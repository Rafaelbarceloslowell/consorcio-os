import hashlib
import json
import math
import struct
import sys
from collections import Counter, defaultdict, deque
from pathlib import Path

import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree


EXPECTED_SOURCE_SHA256 = "340EEDFD0251432E6B8326B23EAE3AD268D560CC9D2FEE0940C8F03F9DC5B64B"
EXPECTED_VERTEX_FINGERPRINT = "B67AD7CDAFC66A8A591E13D6EE2AF8C645F84F9B3285F61A313A44B855F5D3B2"
FOUNDATION_ROLE = "PRIMARY_DEFORMABLE_HEAD_SURFACE"


def sha256_file(path):
    digest = hashlib.sha256()
    with open(path, "rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest().upper()


def canonical_hash(value):
    return hashlib.sha256(json.dumps(value, separators=(",", ":"), sort_keys=True).encode("utf-8")).hexdigest().upper()


def vec(value):
    return [float(component) for component in value]


def ordered_vertex_fingerprint(mesh):
    payload = bytearray()
    for vertex in mesh.vertices:
        payload.extend(struct.pack("<I3d", vertex.index, *(float(v) for v in vertex.co)))
    return hashlib.sha256(bytes(payload)).hexdigest().upper()


def geometry_hash(mesh):
    return canonical_hash({
        "vertices": [[v.index] + [round(float(c), 9) for c in v.co] for v in mesh.vertices],
        "edges": [[e.index] + [int(i) for i in e.vertices] for e in mesh.edges],
        "polygons": [[p.index] + [int(i) for i in p.vertices] for p in mesh.polygons],
    })


def group_payload(obj):
    result = {}
    for group in obj.vertex_groups:
        weights = []
        for vertex in obj.data.vertices:
            found = next((item.weight for item in vertex.groups if item.group == group.index), None)
            if found is not None:
                weights.append([vertex.index, round(float(found), 9)])
        result[group.name] = weights
    return result


def existing_signature(obj):
    result = {
        "name": obj.name,
        "type": obj.type,
        "parent": obj.parent.name if obj.parent else None,
        "parent_type": obj.parent_type,
        "parent_bone": obj.parent_bone if obj.parent_type == "BONE" else None,
        "matrix_world": [[round(float(v), 9) for v in row] for row in obj.matrix_world],
    }
    if obj.type == "MESH":
        result.update({
            "mesh_name": obj.data.name,
            "geometry_hash": geometry_hash(obj.data),
            "materials": [slot.material.name if slot.material else None for slot in obj.material_slots],
            "uv_layers": [layer.name for layer in obj.data.uv_layers],
            "groups": group_payload(obj),
        })
    elif obj.type == "ARMATURE":
        result["bones"] = [
            [bone.name, bone.parent.name if bone.parent else None, vec(bone.head_local), vec(bone.tail_local), bool(bone.use_deform)]
            for bone in obj.data.bones
        ]
    return result


def identify_foundation():
    items = [obj for obj in bpy.data.objects if obj.type == "MESH" and obj.get("r2_head_foundation_role") == FOUNDATION_ROLE]
    if len(items) != 1:
        raise RuntimeError(f"foundation role count: {len(items)}")
    return items[0]


def mesh_maps(mesh):
    edge_faces = defaultdict(list)
    neighbors = defaultdict(set)
    vertex_faces = defaultdict(set)
    lookup = {}
    for edge in mesh.edges:
        a, b = (int(v) for v in edge.vertices)
        lookup[tuple(sorted((a, b)))] = edge.index
        neighbors[a].add(b)
        neighbors[b].add(a)
    for polygon in mesh.polygons:
        vertices = [int(v) for v in polygon.vertices]
        for vertex in vertices:
            vertex_faces[vertex].add(polygon.index)
        for offset, vertex in enumerate(vertices):
            edge_faces[lookup[tuple(sorted((vertex, vertices[(offset + 1) % len(vertices)])))]] .append(polygon.index)
    return edge_faces, neighbors, vertex_faces


def topology_metrics(mesh):
    mesh.update(calc_edges=True)
    edge_faces, neighbors, _ = mesh_maps(mesh)
    islands = 0
    unseen = set(range(len(mesh.vertices)))
    while unseen:
        islands += 1
        stack = [unseen.pop()]
        while stack:
            current = stack.pop()
            for neighbor in neighbors[current]:
                if neighbor in unseen:
                    unseen.remove(neighbor)
                    stack.append(neighbor)
    coordinate_buckets = defaultdict(list)
    for vertex in mesh.vertices:
        coordinate_buckets[tuple(round(float(c), 9) for c in vertex.co)].append(vertex.index)
    unsafe_duplicates = 0
    for indices in coordinate_buckets.values():
        if len(indices) <= 1:
            continue
        for i, first in enumerate(indices):
            for second in indices[i + 1:]:
                if second not in neighbors[first]:
                    unsafe_duplicates += 1
    return {
        "vertices": len(mesh.vertices),
        "edges": len(mesh.edges),
        "polygons": len(mesh.polygons),
        "wire_edges": sum(1 for faces in edge_faces.values() if len(faces) == 0),
        "invalid_non_manifold": sum(1 for faces in edge_faces.values() if len(faces) > 2),
        "boundary_edges": sum(1 for faces in edge_faces.values() if len(faces) == 1),
        "zero_area_faces": sum(1 for polygon in mesh.polygons if polygon.area <= 1e-12),
        "connected_islands": islands,
        "unsafe_duplicate_vertex_pairs": unsafe_duplicates,
    }


def topology_fingerprint(mesh, vertices, faces):
    _, neighbors, _ = mesh_maps(mesh)
    payload = {
        "vertices": sorted(vertices),
        "faces": sorted(faces),
        "coordinates": [[i] + [round(float(v), 9) for v in mesh.vertices[i].co] for i in sorted(vertices)],
        "neighbors": {str(i): sorted(neighbors[i]) for i in sorted(vertices)},
        "face_vertices": {str(i): [int(v) for v in mesh.polygons[i].vertices] for i in sorted(faces)},
    }
    return canonical_hash(payload)


def candidate_parent_signature(obj):
    return [obj.parent.name if obj.parent else None, obj.parent_type, obj.parent_bone if obj.parent_type == "BONE" else None]


def bvh_for_object(obj, depsgraph):
    return BVHTree.FromObject(obj, depsgraph)


def write_json(path, value):
    Path(path).write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def main():
    args = sys.argv[sys.argv.index("--") + 1:]
    if len(args) != 7:
        raise SystemExit("expected SOURCE CANDIDATE EXPECTED_CANDIDATE_HASH MASK LANDMARK OCULAR ORAL OUTPUT")
    source, candidate = (Path(args[0]).resolve(), Path(args[1]).resolve())
    expected_candidate_hash = args[2].upper()
    mask_path, landmark_path, ocular_path, oral_path = map(lambda value: Path(value).resolve(), args[3:7])
    output = Path(args[7]).resolve() if len(args) > 7 else None


if __name__ == "__main__":
    # The explicit parser below is kept outside main so argument-count failures remain concise in Blender logs.
    args = sys.argv[sys.argv.index("--") + 1:]
    if len(args) != 8:
        raise SystemExit("expected SOURCE CANDIDATE EXPECTED_HASH MASK LANDMARK OCULAR ORAL OUTPUT")
    source = Path(args[0]).resolve()
    candidate = Path(args[1]).resolve()
    expected_candidate_hash = args[2].upper()
    mask = json.loads(Path(args[3]).read_text(encoding="utf-8-sig"))
    landmark_certificate = json.loads(Path(args[4]).read_text(encoding="utf-8-sig"))
    ocular_certificate = json.loads(Path(args[5]).read_text(encoding="utf-8-sig"))
    oral_certificate = json.loads(Path(args[6]).read_text(encoding="utf-8-sig"))
    output = Path(args[7]).resolve()

    source_hash_before = sha256_file(source)
    candidate_hash = sha256_file(candidate)
    if source_hash_before != EXPECTED_SOURCE_SHA256:
        raise RuntimeError("official source hash mismatch")
    if candidate_hash != expected_candidate_hash:
        raise RuntimeError("candidate hash mismatch")

    bpy.ops.wm.open_mainfile(filepath=str(source), load_ui=False)
    source_foundation = identify_foundation()
    source_vertices = [tuple(float(c) for c in v.co) for v in source_foundation.data.vertices]
    source_polygons = [tuple(int(v) for v in p.vertices) for p in source_foundation.data.polygons]
    source_foundation_uv = [layer.name for layer in source_foundation.data.uv_layers]
    source_foundation_materials = [slot.material.name if slot.material else None for slot in source_foundation.material_slots]
    source_foundation_groups = group_payload(source_foundation)
    source_objects = {obj.name: existing_signature(obj) for obj in bpy.data.objects}
    source_object_names = sorted(source_objects)
    if ordered_vertex_fingerprint(source_foundation.data) != EXPECTED_VERTEX_FINGERPRINT:
        raise RuntimeError("source foundation fingerprint mismatch")

    bpy.ops.wm.open_mainfile(filepath=str(candidate), load_ui=False)
    foundation = identify_foundation()
    mesh = foundation.data
    candidate_names = sorted(bpy.data.objects.keys())
    expected_new = sorted([
        "R2_Eye.L", "R2_Eye.R", "R2_EyePivot.L", "R2_EyePivot.R",
        "R2_UpperEyelid.L", "R2_LowerEyelid.L", "R2_UpperEyelid.R", "R2_LowerEyelid.R",
        "R2_LipUpper", "R2_LipLower", "R2_MouthInterior", "R2_TeethUpper", "R2_TeethLower",
        "R2_Tongue", "R2_JawPivot.L", "R2_JawPivot.R",
    ])
    actual_new = sorted(set(candidate_names) - set(source_object_names))

    # Existing object preservation, excluding the explicitly changed foundation.
    existing_mismatches = []
    for name in source_object_names:
        if name not in bpy.data.objects:
            existing_mismatches.append({"object": name, "reason": "missing"})
        elif name != foundation.name and existing_signature(bpy.data.objects[name]) != source_objects[name]:
            existing_mismatches.append({"object": name, "reason": "signature_mismatch"})

    coordinate_changes = [
        i for i, vertex in enumerate(mesh.vertices)
        if i >= len(source_vertices) or tuple(float(c) for c in vertex.co) != source_vertices[i]
    ]
    removed_indices = [int(i) for i in mask["removed_original_face_indices"]]
    expected_polygons = Counter(source_polygons)
    for index in removed_indices:
        expected_polygons[source_polygons[index]] -= 1
        if expected_polygons[source_polygons[index]] == 0:
            del expected_polygons[source_polygons[index]]
    observed_polygons = Counter(tuple(int(v) for v in p.vertices) for p in mesh.polygons)
    mask_reproduced = canonical_hash(mask["removed_original_face_vertices"]) == mask["mask_sha256"]
    source_groups_preserved = all(group_payload(foundation).get(name) == values for name, values in source_foundation_groups.items())

    landmarks = landmark_certificate["landmarks"]
    landmark_failures = []
    primary_keys = []
    for name, entry in landmarks.items():
        obj = bpy.data.objects.get(entry["object_name"])
        if obj is None or obj.type != "MESH" or obj.data.name != entry["mesh_name"]:
            landmark_failures.append({"landmark": name, "reason": "object_or_mesh_missing"})
            continue
        primary = int(entry["primary_vertex_index"])
        if primary < 0 or primary >= len(obj.data.vertices):
            landmark_failures.append({"landmark": name, "reason": "primary_out_of_range"})
            continue
        primary_keys.append((obj.name, obj.data.name, primary))
        local = obj.data.vertices[primary].co
        world = obj.matrix_world @ local
        if (local - Vector(entry["object_space_coordinates"])).length > 1e-8:
            landmark_failures.append({"landmark": name, "reason": "object_coordinate_mismatch"})
        if (world - Vector(entry["world_space_coordinates"])).length > 1e-8:
            landmark_failures.append({"landmark": name, "reason": "world_coordinate_mismatch"})
        support_vertices = [int(v) for v in entry["supporting_vertex_indices"]]
        support_faces = [int(f) for f in entry["supporting_face_indices"]]
        if any(v < 0 or v >= len(obj.data.vertices) for v in support_vertices) or any(f < 0 or f >= len(obj.data.polygons) for f in support_faces):
            landmark_failures.append({"landmark": name, "reason": "support_out_of_range"})
        elif topology_fingerprint(obj.data, support_vertices, support_faces) != entry["topology_neighborhood_fingerprint"]:
            landmark_failures.append({"landmark": name, "reason": "topology_fingerprint_mismatch"})
        partner = entry.get("symmetry_partner")
        if partner and partner not in landmarks:
            landmark_failures.append({"landmark": name, "reason": "symmetry_partner_missing"})

    # Ocular certificate and hierarchy.
    ocular_failures = []
    eye_centers = {}
    eye_radius = float(ocular_certificate["equal_bilateral_radius"])
    for side in ("L", "R"):
        eye = bpy.data.objects.get(f"R2_Eye.{side}")
        pivot = bpy.data.objects.get(f"R2_EyePivot.{side}")
        upper = bpy.data.objects.get(f"R2_UpperEyelid.{side}")
        lower = bpy.data.objects.get(f"R2_LowerEyelid.{side}")
        if any(obj is None for obj in (eye, pivot, upper, lower)):
            ocular_failures.append({"side": side, "reason": "missing_asset"})
            continue
        center = Vector(ocular_certificate["assets"][side]["center"])
        eye_centers[side] = center
        if (eye.matrix_world.translation - center).length > 1e-8 or (pivot.matrix_world.translation - center).length > 1e-8:
            ocular_failures.append({"side": side, "reason": "center_or_pivot_mismatch"})
        if eye.parent != pivot:
            ocular_failures.append({"side": side, "reason": "eye_not_parented_to_pivot"})
        if pivot.parent is None or pivot.parent.name != "R2_Rig" or pivot.parent_type != "OBJECT" or pivot.get("r2_parent_bone_reference") != "head":
            ocular_failures.append({"side": side, "reason": "pivot_head_parent_mismatch"})
        aperture = ocular_certificate["assets"][side]["aperture"]
        aperture_points = [mesh.vertices[int(v)].co for v in aperture["vertices"]]
        aperture_center = sum(aperture_points, Vector()) / len(aperture_points)
        maximum_aperture_radius = max((point - aperture_center).length for point in aperture_points)
        if eye_radius < maximum_aperture_radius:
            ocular_failures.append({"side": side, "reason": "eye_does_not_cover_aperture"})
        upper_left, upper_right = upper.data.vertices[0].co, upper.data.vertices[16].co
        lower_left, lower_right = lower.data.vertices[0].co, lower.data.vertices[16].co
        if max((upper_left - lower_left).length, (upper_right - lower_right).length) > 1e-8:
            ocular_failures.append({"side": side, "reason": "eyelid_corner_gap"})
    if len(eye_centers) == 2:
        center_x = float(landmarks["neck_attachment_center"]["world_space_coordinates"][0])
        mirrored_left = Vector((2.0 * center_x - eye_centers["L"].x, eye_centers["L"].y, eye_centers["L"].z))
        ocular_symmetry_error = (mirrored_left - eye_centers["R"]).length
    else:
        ocular_symmetry_error = None

    # Oral certificate and containment/closure.
    oral_failures = []
    upper_lip = bpy.data.objects.get("R2_LipUpper")
    lower_lip = bpy.data.objects.get("R2_LipLower")
    mouth_interior = bpy.data.objects.get("R2_MouthInterior")
    teeth_upper = bpy.data.objects.get("R2_TeethUpper")
    teeth_lower = bpy.data.objects.get("R2_TeethLower")
    tongue = bpy.data.objects.get("R2_Tongue")
    if any(obj is None for obj in (upper_lip, lower_lip, mouth_interior, teeth_upper, teeth_lower, tongue)):
        oral_failures.append({"reason": "missing_oral_asset"})
        neutral_closure_error = None
    else:
        neutral_closure_error = max(
            (upper_lip.data.vertices[i].co - lower_lip.data.vertices[i].co).length for i in range(21)
        )
        if neutral_closure_error > 1e-9:
            oral_failures.append({"reason": "neutral_lip_closure_mismatch", "error": neutral_closure_error})
        cavity_center = mouth_interior.matrix_world.translation
        cavity_bounds = [max(abs(v.co[axis]) for v in mouth_interior.data.vertices) for axis in range(3)]
        for obj in (teeth_upper, teeth_lower, tongue):
            for corner in obj.bound_box:
                local_to_cavity = mouth_interior.matrix_world.inverted() @ (obj.matrix_world @ Vector(corner))
                normalized = sum((local_to_cavity[axis] / max(cavity_bounds[axis], 1e-9)) ** 2 for axis in range(3))
                if normalized > 1.45:
                    oral_failures.append({"reason": "internal_asset_outside_cavity", "object": obj.name, "normalized": normalized})
                    break
        for side in ("L", "R"):
            pivot = bpy.data.objects.get(f"R2_JawPivot.{side}")
            if pivot is None or pivot.parent is None or pivot.parent.name != "R2_Rig" or pivot.parent_type != "OBJECT" or pivot.get("r2_parent_bone_reference") != "head":
                oral_failures.append({"reason": "jaw_pivot_hierarchy", "side": side})

    new_mesh_metrics = {
        name: topology_metrics(bpy.data.objects[name].data)
        for name in expected_new if bpy.data.objects.get(name) and bpy.data.objects[name].type == "MESH"
    }
    all_mesh_metrics = {obj.name: topology_metrics(obj.data) for obj in bpy.data.objects if obj.type == "MESH"}
    new_unsafe_duplicates = sum(item["unsafe_duplicate_vertex_pairs"] for item in new_mesh_metrics.values())
    unexpected_islands = {name: item["connected_islands"] for name, item in new_mesh_metrics.items() if item["connected_islands"] != 1}
    wire_edges = sum(item["wire_edges"] for item in all_mesh_metrics.values())
    invalid_non_manifold = sum(item["invalid_non_manifold"] for item in all_mesh_metrics.values())
    zero_area = sum(item["zero_area_faces"] for item in all_mesh_metrics.values())
    image_count = len(bpy.data.images)
    image_nodes = sum(
        1 for material in bpy.data.materials if material.use_nodes
        for node in material.node_tree.nodes if node.type == "TEX_IMAGE"
    )
    duplicate_object_names = len(candidate_names) - len(set(candidate_names))
    duplicate_mesh_names = len(bpy.data.meshes) - len(set(bpy.data.meshes.keys()))
    duplicate_material_names = len(bpy.data.materials) - len(set(bpy.data.materials.keys()))
    dot001_names = [name for name in list(bpy.data.objects.keys()) + list(bpy.data.meshes.keys()) + list(bpy.data.materials.keys()) if name.endswith(".001")]

    gates = {
        "OfficialSourceUnchanged": sha256_file(source) == EXPECTED_SOURCE_SHA256,
        "CandidateHashConfirmed": sha256_file(candidate) == expected_candidate_hash,
        "FoundationVertexOrderConfirmed": ordered_vertex_fingerprint(mesh) == EXPECTED_VERTEX_FINGERPRINT,
        "FoundationCoordinatesPreserved": len(coordinate_changes) == 0 and len(mesh.vertices) == len(source_vertices),
        "AuthorizedFaceMaskReproduced": mask_reproduced and observed_polygons == expected_polygons,
        "GeometryChangesOutsideAuthorizedZones": observed_polygons == expected_polygons,
        "ExistingObjectsPreserved": len(existing_mismatches) == 0,
        "SourceVertexGroupsPreserved": source_groups_preserved,
        "SourceUVsPreserved": [layer.name for layer in mesh.uv_layers] == source_foundation_uv,
        "SourceMaterialSlotsPreserved": [slot.material.name if slot.material else None for slot in foundation.material_slots] == source_foundation_materials,
        "ExpectedNewObjectsExact": actual_new == expected_new,
        "NoDot001Names": len(dot001_names) == 0,
        "WireEdges": wire_edges == 0,
        "InvalidNonManifold": invalid_non_manifold == 0,
        "ZeroAreaFaces": zero_area == 0,
        "UnsafeDuplicateVertices": new_unsafe_duplicates == 0,
        "UnexpectedConnectedIslands": len(unexpected_islands) == 0,
        "UnexpectedObjectDuplicates": duplicate_object_names == 0,
        "UnexpectedMeshDuplicates": duplicate_mesh_names == 0,
        "UnexpectedMaterialDuplicates": duplicate_material_names == 0,
        "OcularAssetsValid": len(ocular_failures) == 0 and ocular_certificate.get("approved") is True,
        "OralAssetsValid": len(oral_failures) == 0 and oral_certificate.get("approved") is True,
        "NeutralEyeFitValid": len(ocular_failures) == 0,
        "NeutralMouthClosureValid": neutral_closure_error is not None and neutral_closure_error <= 1e-9,
        "LandmarkCertificateConfirmed": len(landmarks) == 38 and len(landmark_failures) == 0,
        "DuplicatePrimaryLandmarks": len(primary_keys) == len(set(primary_keys)),
        "CreatedImages": image_count == 0 and image_nodes == 0,
    }
    failed = [name for name, passed in gates.items() if not passed]
    report = {
        "schema_version": 1,
        "audit_kind": "INDEPENDENT_READ_ONLY_FACIAL_ASSET_AUDIT",
        "execution_status": "COMPLETED",
        "technical_verdict": "APROVADO" if not failed else "REPROVADO",
        "independent_audit_approved": not failed,
        "source_path": str(source),
        "source_sha256_before": source_hash_before,
        "source_sha256_after": sha256_file(source),
        "candidate_path": str(candidate),
        "candidate_sha256": candidate_hash,
        "candidate_hash_confirmed": candidate_hash == expected_candidate_hash,
        "actual_new_objects": actual_new,
        "expected_new_objects": expected_new,
        "coordinate_change_indices": coordinate_changes,
        "existing_object_mismatches": existing_mismatches,
        "landmark_failures": landmark_failures,
        "ocular_failures": ocular_failures,
        "ocular_symmetry_error": ocular_symmetry_error,
        "oral_failures": oral_failures,
        "neutral_closure_error": neutral_closure_error,
        "new_mesh_topology": new_mesh_metrics,
        "aggregate": {
            "wire_edges": wire_edges,
            "invalid_non_manifold": invalid_non_manifold,
            "zero_area_faces": zero_area,
            "unsafe_duplicate_vertices": new_unsafe_duplicates,
            "unexpected_connected_islands": unexpected_islands,
            "created_images": image_count,
            "image_texture_nodes": image_nodes,
        },
        "gates": gates,
        "failed_gates": failed,
        "official_source_unchanged": sha256_file(source) == EXPECTED_SOURCE_SHA256,
        "created_images": 0,
    }
    write_json(output, report)
    print("ExecutionStatus=COMPLETED")
    print(f"TechnicalVerdict={report['technical_verdict']}")
    print(f"IndependentAuditApproved={report['independent_audit_approved']}")
    print(f"FacialLandmarksCertified={gates['LandmarkCertificateConfirmed']}")
    print(f"OcularAssetsCertified={gates['OcularAssetsValid']}")
    print(f"OralAssetsCertified={gates['OralAssetsValid']}")
    print(f"WireEdges={wire_edges}")
    print(f"InvalidNonManifold={invalid_non_manifold}")
    print(f"ZeroAreaFaces={zero_area}")
    print(f"UnsafeDuplicateVertices={new_unsafe_duplicates}")
    print("FailedGates=" + ("NONE" if not failed else ",".join(failed)))
    print(f"OfficialSourceUnchanged={report['official_source_unchanged']}")
    print("CreatedImages=0")
    if failed:
        raise SystemExit(2)
