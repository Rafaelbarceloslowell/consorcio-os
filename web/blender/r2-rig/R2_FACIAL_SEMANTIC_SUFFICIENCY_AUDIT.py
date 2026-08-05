import hashlib
import json
import math
import sys
from collections import Counter, defaultdict, deque
from pathlib import Path

import bpy
import numpy as np
from mathutils import Vector


EXPECTED_SHA256 = "340EEDFD0251432E6B8326B23EAE3AD268D560CC9D2FEE0940C8F03F9DC5B64B"
FOUNDATION_ROLE = "PRIMARY_DEFORMABLE_HEAD_SURFACE"


def sha256_file(path):
    digest = hashlib.sha256()
    with open(path, "rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest().upper()


def vec(value):
    return [float(component) for component in value]


def fingerprint(payload):
    encoded = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest().upper()


def connected_components(nodes, adjacency):
    unseen = set(nodes)
    components = []
    while unseen:
        start = min(unseen)
        unseen.remove(start)
        queue = deque([start])
        component = []
        while queue:
            current = queue.popleft()
            component.append(current)
            for neighbor in adjacency.get(current, ()):
                if neighbor in unseen:
                    unseen.remove(neighbor)
                    queue.append(neighbor)
        components.append(sorted(component))
    return components


def identify_foundation():
    candidates = [
        obj for obj in bpy.data.objects
        if obj.type == "MESH" and obj.get("r2_head_foundation_role") == FOUNDATION_ROLE
    ]
    if len(candidates) != 1:
        raise RuntimeError(f"foundation role count: {len(candidates)}")
    return candidates[0]


def topology_fingerprint(mesh, vertices, faces, vertex_neighbors):
    payload = {
        "vertices": sorted(vertices),
        "faces": sorted(faces),
        "coordinates": [
            [index] + [round(float(value), 9) for value in mesh.vertices[index].co]
            for index in sorted(vertices)
        ],
        "neighbor_indices": {
            str(index): sorted(vertex_neighbors[index]) for index in sorted(vertices)
        },
        "face_vertices": {
            str(index): list(mesh.polygons[index].vertices) for index in sorted(faces)
        },
    }
    return fingerprint(payload)


def make_landmark(name, description, primary, support_vertices, support_faces, obj, normal,
                  symmetry_partner, confidence, evidence, intended_use, vertex_neighbors):
    mesh = obj.data
    object_coordinate = mesh.vertices[primary].co.copy()
    world_coordinate = obj.matrix_world @ object_coordinate
    return {
        "canonical_name": name,
        "semantic_description": description,
        "object_name": obj.name,
        "mesh_name": mesh.name,
        "primary_vertex_index": int(primary),
        "supporting_vertex_indices": sorted(int(index) for index in support_vertices),
        "supporting_face_indices": sorted(int(index) for index in support_faces),
        "object_space_coordinates": vec(object_coordinate),
        "world_space_coordinates": vec(world_coordinate),
        "topology_neighborhood_fingerprint": topology_fingerprint(
            mesh, support_vertices, support_faces, vertex_neighbors
        ),
        "normal_direction": vec(normal),
        "symmetry_partner": symmetry_partner,
        "symmetry_error": None,
        "confidence_score": float(confidence),
        "evidence": evidence,
        "intended_rigging_use": intended_use,
        "certification_status": "CERTIFIABLE_FROM_CURRENT_SOURCE",
    }


def fit_sphere(points):
    array = np.asarray(points, dtype=np.float64)
    if len(array) < 4:
        return {"valid": False, "reason": "fewer_than_four_points"}
    matrix = np.column_stack((2.0 * array, np.ones(len(array))))
    target = np.einsum("ij,ij->i", array, array)
    solution, _, rank, singular = np.linalg.lstsq(matrix, target, rcond=None)
    center = solution[:3]
    radius_squared = float(np.dot(center, center) + solution[3])
    if radius_squared <= 0:
        return {"valid": False, "reason": "non_positive_radius_squared", "rank": int(rank)}
    radius = math.sqrt(radius_squared)
    radial = np.linalg.norm(array - center, axis=1)
    residuals = np.abs(radial - radius)
    condition = float(np.inf if singular[-1] == 0 else singular[0] / singular[-1])
    return {
        "valid": True,
        "sample_count": len(array),
        "rank": int(rank),
        "condition_number": condition,
        "center": vec(center),
        "radius": float(radius),
        "median_absolute_radial_residual": float(np.median(residuals)),
        "p95_absolute_radial_residual": float(np.percentile(residuals, 95)),
        "maximum_absolute_radial_residual": float(np.max(residuals)),
    }


def expand_ring(seed, vertex_neighbors, depth):
    reached = set(seed)
    frontier = set(seed)
    for _ in range(depth):
        frontier = {neighbor for index in frontier for neighbor in vertex_neighbors[index]} - reached
        reached.update(frontier)
    return sorted(reached)


def custom_properties(data):
    return {
        key: data[key] for key in sorted(data.keys())
        if key != "_RNA_UI" and isinstance(data[key], (str, int, float, bool))
    }


def main():
    args = sys.argv[sys.argv.index("--") + 1:]
    if len(args) != 2:
        raise SystemExit("expected SOURCE OUTPUT")
    source = Path(args[0]).resolve()
    output = Path(args[1]).resolve()
    before = sha256_file(source)
    if before != EXPECTED_SHA256:
        raise RuntimeError("source hash mismatch")
    bpy.ops.wm.open_mainfile(filepath=str(source), load_ui=False)
    obj = identify_foundation()
    mesh = obj.data
    mesh.update(calc_edges=True)

    edge_face_map = defaultdict(list)
    vertex_neighbors = defaultdict(set)
    vertex_faces = defaultdict(set)
    edge_key_to_index = {}
    for edge in mesh.edges:
        a, b = edge.vertices
        edge_key_to_index[tuple(sorted((a, b)))] = edge.index
        vertex_neighbors[a].add(b)
        vertex_neighbors[b].add(a)
    for polygon in mesh.polygons:
        vertices = list(polygon.vertices)
        for vertex in vertices:
            vertex_faces[vertex].add(polygon.index)
        for offset, vertex in enumerate(vertices):
            key = tuple(sorted((vertex, vertices[(offset + 1) % len(vertices)])))
            edge_face_map[edge_key_to_index[key]].append(polygon.index)

    region_attribute = mesh.attributes.get("r2_region_id")
    if not region_attribute or region_attribute.domain != "FACE":
        raise RuntimeError("missing FACE-domain r2_region_id")
    region_values = [int(item.value) for item in region_attribute.data]

    armature = obj.parent if obj.parent and obj.parent.type == "ARMATURE" else None
    if armature is None:
        raise RuntimeError("foundation has no armature parent")
    head_bone = armature.data.bones.get("head")
    neck_bone = armature.data.bones.get("neck")
    if head_bone is None or neck_bone is None:
        raise RuntimeError("missing head/neck bones")
    center_x = float((armature.matrix_world @ head_bone.head_local).x)
    up = (armature.matrix_world.to_3x3() @ (head_bone.tail_local - neck_bone.head_local)).normalized()
    anatomical_left = Vector((1.0, 0.0, 0.0))

    boundary_edges = [edge.index for edge in mesh.edges if len(edge_face_map[edge.index]) == 1]
    boundary_adjacency = defaultdict(set)
    for edge_index in boundary_edges:
        a, b = mesh.edges[edge_index].vertices
        boundary_adjacency[a].add(b)
        boundary_adjacency[b].add(a)
    components = connected_components(boundary_adjacency.keys(), boundary_adjacency)
    boundaries = []
    for component_id, vertices in enumerate(components):
        vertex_set = set(vertices)
        edges = [
            edge_index for edge_index in boundary_edges
            if set(mesh.edges[edge_index].vertices).issubset(vertex_set)
        ]
        faces = sorted({face for edge_index in edges for face in edge_face_map[edge_index]})
        region_counts = Counter(region_values[index] for index in faces)
        centroid = sum((mesh.vertices[index].co for index in vertices), Vector()) / len(vertices)
        degrees = [len(boundary_adjacency[index] & vertex_set) for index in vertices]
        boundaries.append({
            "component_id": component_id,
            "vertex_indices": sorted(vertices),
            "edge_indices": sorted(edges),
            "neighbor_face_indices": faces,
            "neighbor_region_counts": {str(key): value for key, value in sorted(region_counts.items())},
            "centroid": vec(centroid),
            "closed": all(degree == 2 for degree in degrees),
            "branched": any(degree > 2 for degree in degrees),
        })

    eye_boundaries = [
        boundary for boundary in boundaries
        if boundary["closed"] and boundary["neighbor_region_counts"]
        and set(boundary["neighbor_region_counts"]) == {"2"}
    ]
    if len(eye_boundaries) != 2:
        raise RuntimeError(f"expected two unique eye-lineage boundaries, found {len(eye_boundaries)}")

    landmarks = {}
    ocular_fits = {}
    for boundary in eye_boundaries:
        vertices = boundary["vertex_indices"]
        faces = boundary["neighbor_face_indices"]
        centroid = Vector(boundary["centroid"])
        side = "left" if centroid.x > center_x else "right"
        if side == "left":
            inner = min(vertices, key=lambda index: mesh.vertices[index].co.x)
            outer = max(vertices, key=lambda index: mesh.vertices[index].co.x)
        else:
            inner = max(vertices, key=lambda index: mesh.vertices[index].co.x)
            outer = min(vertices, key=lambda index: mesh.vertices[index].co.x)
        upper = max(vertices, key=lambda index: mesh.vertices[index].co.dot(up))
        lower = min(vertices, key=lambda index: mesh.vertices[index].co.dot(up))
        normal = sum((mesh.polygons[index].normal for index in faces), Vector())
        if normal.length:
            normal.normalize()
        evidence = (
            "Unique closed four-edge boundary wholly adjacent to approved r2_region_id=2 "
            "eye-brow lineage; side is certified from existing .L/.R armature convention."
        )
        for role, primary, partner_role, description, use in (
            ("inner_eye_corner", inner, "inner_eye_corner", "Medial canthus boundary vertex", "eye and eyelid anchor"),
            ("outer_eye_corner", outer, "outer_eye_corner", "Lateral canthus boundary vertex", "eye and eyelid anchor"),
            ("upper_eyelid", upper, "upper_eyelid", "Upper extremum of certified eye boundary", "upper eyelid region seed"),
            ("lower_eyelid", lower, "lower_eyelid", "Lower extremum of certified eye boundary", "lower eyelid region seed"),
        ):
            name = f"{side}_{role}"
            landmarks[name] = make_landmark(
                name, description, primary, vertices, faces, obj, normal,
                f"{'right' if side == 'left' else 'left'}_{partner_role}", 0.99,
                evidence, use, vertex_neighbors,
            )
        fits = []
        for depth in range(4):
            samples = expand_ring(vertices, vertex_neighbors, depth)
            fit = fit_sphere([mesh.vertices[index].co[:] for index in samples])
            fit["ring_depth"] = depth
            fit["vertex_indices"] = samples
            fits.append(fit)
        valid_fits = [fit for fit in fits if fit.get("valid")]
        center_spread = None
        radius_spread = None
        if len(valid_fits) > 1:
            centers = np.asarray([fit["center"] for fit in valid_fits])
            radii = np.asarray([fit["radius"] for fit in valid_fits])
            center_spread = float(np.max(np.linalg.norm(centers - centers.mean(axis=0), axis=1)))
            radius_spread = float(np.max(radii) - np.min(radii))
        ocular_fits[side] = {
            "boundary_component_id": boundary["component_id"],
            "ring_fits": fits,
            "center_spread_across_ring_depths": center_spread,
            "radius_spread_across_ring_depths": radius_spread,
            "certified_eyeball_center": None,
            "certified_eyeball_radius": None,
            "readiness": "BLOCKED_MISSING_DESIGN_EVIDENCE",
            "reason": (
                "The source provides only an eyelid/socket aperture. It contains no separate eyeball geometry, "
                "approved eye diameter, corneal direction, or pivot. Sphere fits to expanding skin neighborhoods "
                "are measurements of different facial surfaces and do not establish a unique ocular asset."
            ),
        }

    keyword_groups = {
        "ocular": ("eye", "ocular", "cornea", "iris", "pupil", "lens", "eyeball"),
        "oral": ("mouth", "oral", "lip", "teeth", "tooth", "tongue", "gum", "jaw", "mandible"),
        "ear": ("ear", "pinna", "auricle"),
    }
    mesh_inventory = []
    named_candidates = {group: [] for group in keyword_groups}
    for candidate in sorted((item for item in bpy.data.objects if item.type == "MESH"), key=lambda item: item.name):
        data = candidate.data
        entry = {
            "object_name": candidate.name,
            "mesh_name": data.name,
            "parent": candidate.parent.name if candidate.parent else None,
            "vertices": len(data.vertices),
            "edges": len(data.edges),
            "polygons": len(data.polygons),
            "materials": [slot.material.name if slot.material else None for slot in candidate.material_slots],
            "uv_layers": [layer.name for layer in data.uv_layers],
            "attributes": [attribute.name for attribute in data.attributes],
            "object_custom_properties": custom_properties(candidate),
            "mesh_custom_properties": custom_properties(data),
        }
        mesh_inventory.append(entry)
        haystack = " ".join((candidate.name, data.name, " ".join(entry["attributes"]))).lower()
        for group, keywords in keyword_groups.items():
            if any(keyword in haystack for keyword in keywords):
                named_candidates[group].append(candidate.name)

    region_boundary_counts = Counter()
    for boundary in boundaries:
        for region, count in boundary["neighbor_region_counts"].items():
            region_boundary_counts[region] += count
    oral_semantic_attributes = [
        attribute.name for attribute in mesh.attributes
        if any(keyword in attribute.name.lower() for keyword in keyword_groups["oral"])
    ]
    eye_semantic_attributes = [
        attribute.name for attribute in mesh.attributes
        if any(keyword in attribute.name.lower() for keyword in keyword_groups["ocular"])
    ]

    certifiable_landmarks = {
        name: value for name, value in landmarks.items()
        if name.endswith("_inner_eye_corner") or name.endswith("_outer_eye_corner")
    }
    eye_coordinate_buckets = defaultdict(list)
    for boundary in eye_boundaries:
        for index in boundary["vertex_indices"]:
            key = tuple(round(float(value), 9) for value in mesh.vertices[index].co)
            eye_coordinate_buckets[key].append(index)
    duplicate_eye_coordinate_pairs = [
        {"coordinates": list(coordinates), "vertex_indices": sorted(indices)}
        for coordinates, indices in sorted(eye_coordinate_buckets.items()) if len(indices) > 1
    ]

    mandatory = [
        "left_inner_eye_corner", "left_outer_eye_corner", "right_inner_eye_corner", "right_outer_eye_corner",
        "left_upper_eyelid", "left_lower_eyelid", "right_upper_eyelid", "right_lower_eyelid",
        "left_brow_inner", "left_brow_center", "left_brow_outer",
        "right_brow_inner", "right_brow_center", "right_brow_outer",
        "nose_bridge_upper", "nose_bridge_lower", "nose_tip", "left_nostril", "right_nostril",
        "muzzle_center", "left_muzzle", "right_muzzle", "upper_lip_center", "lower_lip_center",
        "left_mouth_corner", "right_mouth_corner", "upper_lip_boundary", "lower_lip_boundary",
        "mouth_opening_boundary", "chin_center", "left_jaw_hinge_region", "right_jaw_hinge_region",
        "jaw_center", "left_cheek_center", "right_cheek_center", "left_ear_base", "right_ear_base",
        "neck_attachment_center",
    ]
    missing = sorted(set(mandatory) - set(certifiable_landmarks))

    invalid_non_manifold = sum(1 for faces in edge_face_map.values() if len(faces) > 2)
    wire_edges = sum(1 for faces in edge_face_map.values() if len(faces) == 0)
    zero_area = sum(1 for polygon in mesh.polygons if polygon.area <= 1e-12)
    after = sha256_file(source)
    result = {
        "schema_version": 1,
        "phase": "FACIAL_ANATOMICAL_LANDMARK_AND_OCULAR_ORAL_ASSET_CERTIFICATION",
        "checkpoints_examined": [
            "CHECKPOINT_3_LANDMARK_CANDIDATE_DISCOVERY",
            "CHECKPOINT_4_LANDMARK_CERTIFICATION",
            "CHECKPOINT_5_OCULAR_ASSET_AUDIT",
            "CHECKPOINT_7_ORAL_ASSET_AUDIT",
        ],
        "execution_status": "COMPLETED",
        "technical_verdict": "REPROVADO",
        "phase_gate_status": "BLOCKED",
        "recoverable": False,
        "source": {"path": str(source), "sha256_before": before, "sha256_after": after},
        "foundation": {
            "object_name": obj.name,
            "mesh_name": mesh.name,
            "vertices": len(mesh.vertices),
            "edges": len(mesh.edges),
            "polygons": len(mesh.polygons),
            "ordered_vertex_fingerprint": fingerprint([
                [vertex.index] + [round(float(value), 9) for value in vertex.co] for vertex in mesh.vertices
            ]),
            "attributes": [attribute.name for attribute in mesh.attributes],
            "materials": [slot.material.name if slot.material else None for slot in obj.material_slots],
            "uv_layers": [layer.name for layer in mesh.uv_layers],
        },
        "reference_system": {
            "anatomical_left": vec(anatomical_left),
            "anatomical_right": vec(-anatomical_left),
            "anatomical_up": vec(up),
            "center_plane_x": center_x,
        },
        "boundary_components": boundaries,
        "landmark_candidates": landmarks,
        "certifiable_landmark_candidates": certifiable_landmarks,
        "mandatory_landmark_count": len(mandatory),
        "landmark_candidate_count": len(landmarks),
        "certifiable_landmark_count": len(certifiable_landmarks),
        "missing_or_uncertifiable_mandatory_landmarks": missing,
        "all_mandatory_landmarks_certifiable": len(missing) == 0,
        "duplicate_eye_coordinate_pairs": duplicate_eye_coordinate_pairs,
        "ocular_audit": {
            "named_object_candidates": named_candidates["ocular"],
            "semantic_attributes": eye_semantic_attributes,
            "unique_eye_lineage_boundaries": len(eye_boundaries),
            "per_side_sphere_fit_stability": ocular_fits,
            "left_eyeball": "BLOCKED_MISSING_DESIGN_EVIDENCE",
            "right_eyeball": "BLOCKED_MISSING_DESIGN_EVIDENCE",
            "eye_centers": "BLOCKED_MISSING_DESIGN_EVIDENCE",
            "eye_radii": "BLOCKED_MISSING_DESIGN_EVIDENCE",
            "rotational_pivots": "BLOCKED_MISSING_DESIGN_EVIDENCE",
            "corneal_or_surface_direction": "BLOCKED_MISSING_DESIGN_EVIDENCE",
            "eyelid_boundary_seeds": "READY",
            "distinct_upper_lower_eyelid_primary_landmarks": "BLOCKED_MISSING_DESIGN_EVIDENCE",
        },
        "oral_audit": {
            "named_object_candidates": named_candidates["oral"],
            "semantic_attributes": oral_semantic_attributes,
            "boundary_edges_adjacent_to_muzzle_lineage_region_1": int(region_boundary_counts.get("1", 0)),
            "upper_lip": "BLOCKED_MISSING_DESIGN_EVIDENCE",
            "lower_lip": "BLOCKED_MISSING_DESIGN_EVIDENCE",
            "mouth_corners": "BLOCKED_MISSING_DESIGN_EVIDENCE",
            "mouth_opening_boundary": "BLOCKED_MISSING_DESIGN_EVIDENCE",
            "oral_cavity": "BLOCKED_MISSING_DESIGN_EVIDENCE",
            "jaw_relationship": "BLOCKED_MISSING_DESIGN_EVIDENCE",
            "mandibular_pivot": "BLOCKED_MISSING_DESIGN_EVIDENCE",
            "teeth": "BLOCKED_MISSING_DESIGN_EVIDENCE",
            "tongue": "BLOCKED_MISSING_DESIGN_EVIDENCE",
            "reason": (
                "No oral-named object, mesh, face/point attribute, material, or closed boundary adjacent to the "
                "approved muzzle lineage exists. The historical C086 specification requires mouth/lip/jaw topology "
                "to be created, while V37 certifies surface retopology rather than oral semantics."
            ),
        },
        "ear_audit": {
            "named_object_candidates": named_candidates["ear"],
            "left_ear_base": "BLOCKED_MISSING_DESIGN_EVIDENCE",
            "right_ear_base": "BLOCKED_MISSING_DESIGN_EVIDENCE",
        },
        "scene_mesh_inventory": mesh_inventory,
        "topology_observations": {
            "wire_edges": wire_edges,
            "invalid_non_manifold_edges": invalid_non_manifold,
            "zero_area_faces": zero_area,
            "boundary_component_count": len(boundaries),
        },
        "blocking_reason": (
            "The official source certifies two eyelid apertures but contains no separate ocular assets or approved "
            "eye dimensions/pivots, and it contains no deterministic oral opening, lip, jaw-hinge, oral-cavity, "
            "dental, tongue, or ear-base semantics. Constructing these would require human design evidence and, "
            "for the mandatory mouth deformation system, external facial topology decisions outside a neutral "
            "support-asset derivation."
        ),
        "recommended_recovery": (
            "Provide an approved anatomical design package or artist-authored source containing left/right eyeball "
            "meshes with centers/radii/forward axes, certified lip and mouth-opening edge loops, jaw hinge/pivot and "
            "affected region, oral cavity/closure topology, and ear-base landmarks, all registered to this exact "
            "foundation vertex order; then rerun Checkpoints 3 through 11."
        ),
        "blend_saved": False,
        "official_source_unchanged": before == after == EXPECTED_SHA256,
        "created_images": 0,
    }
    output.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print("ExecutionStatus=COMPLETED")
    print("TechnicalVerdict=REPROVADO")
    print("PhaseGateStatus=BLOCKED")
    print("Recoverable=False")
    print(f"LandmarkCandidates={len(landmarks)}")
    print(f"CertifiableMandatoryLandmarks={len(certifiable_landmarks)}/{len(mandatory)}")
    print(f"DuplicateEyeCoordinatePairs={len(duplicate_eye_coordinate_pairs)}")
    print(f"UniqueEyeLineageBoundaries={len(eye_boundaries)}")
    print(f"OcularNamedObjects={len(named_candidates['ocular'])}")
    print(f"OralNamedObjects={len(named_candidates['oral'])}")
    print(f"OralSemanticAttributes={len(oral_semantic_attributes)}")
    print(f"MuzzleLineageBoundaryEdges={region_boundary_counts.get('1', 0)}")
    print(f"OfficialSourceUnchanged={result['official_source_unchanged']}")
    print("BlendSaved=False")
    print("CreatedImages=0")


if __name__ == "__main__":
    main()
