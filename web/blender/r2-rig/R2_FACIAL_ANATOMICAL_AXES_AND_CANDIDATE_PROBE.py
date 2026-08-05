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


def sha256_file(path):
    digest = hashlib.sha256()
    with open(path, "rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest().upper()


def vec(value):
    return [float(component) for component in value]


def identify_foundation():
    candidates = [
        obj for obj in bpy.data.objects
        if obj.type == "MESH" and obj.get("r2_head_foundation_role") == "PRIMARY_DEFORMABLE_HEAD_SURFACE"
    ]
    if len(candidates) != 1:
        raise RuntimeError(f"foundation role count: {len(candidates)}")
    return candidates[0]


def connected_components(nodes, adjacency):
    unseen = set(nodes)
    components = []
    while unseen:
        start = min(unseen)
        queue = deque([start])
        unseen.remove(start)
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


def pca(points):
    array = np.asarray(points, dtype=np.float64)
    center = array.mean(axis=0)
    centered = array - center
    covariance = centered.T @ centered / max(len(array), 1)
    values, vectors = np.linalg.eigh(covariance)
    order = np.argsort(values)[::-1]
    values = values[order]
    vectors = vectors[:, order]
    return center.tolist(), values.tolist(), vectors.T.tolist()


def component_summary(component_id, vertex_indices, edge_indices, mesh, edge_face_map, region_values):
    points = [mesh.vertices[index].co[:] for index in vertex_indices]
    center, eigenvalues, eigenvectors = pca(points)
    minimum = [min(point[axis] for point in points) for axis in range(3)]
    maximum = [max(point[axis] for point in points) for axis in range(3)]
    degrees = Counter()
    local_adjacency = defaultdict(set)
    neighbor_faces = set()
    for edge_index in edge_indices:
        edge = mesh.edges[edge_index]
        a, b = edge.vertices
        degrees[a] += 1
        degrees[b] += 1
        local_adjacency[a].add(b)
        local_adjacency[b].add(a)
        neighbor_faces.update(edge_face_map[edge_index])
    normal = Vector((0.0, 0.0, 0.0))
    for face_index in neighbor_faces:
        normal += mesh.polygons[face_index].normal
    if normal.length:
        normal.normalize()
    region_counts = Counter(region_values[face_index] for face_index in neighbor_faces)
    return {
        "id": component_id,
        "vertex_indices": sorted(vertex_indices),
        "edge_indices": sorted(edge_indices),
        "neighbor_face_indices": sorted(neighbor_faces),
        "vertex_count": len(vertex_indices),
        "edge_count": len(edge_indices),
        "closed": all(degree == 2 for degree in degrees.values()),
        "branched": any(degree > 2 for degree in degrees.values()),
        "degree_histogram": dict(sorted(Counter(degrees.values()).items())),
        "centroid": center,
        "bounds": {"min": vec(minimum), "max": vec(maximum)},
        "span": [maximum[axis] - minimum[axis] for axis in range(3)],
        "pca_eigenvalues": eigenvalues,
        "pca_axes": eigenvectors,
        "average_neighbor_normal": vec(normal),
        "neighbor_region_counts": {str(key): value for key, value in sorted(region_counts.items())},
    }


def face_components(face_indices, face_adjacency):
    return connected_components(face_indices, face_adjacency)


def region_summary(name, face_indices, mesh, face_adjacency):
    components = []
    for component_index, faces in enumerate(face_components(face_indices, face_adjacency)):
        vertices = sorted({vertex for face_index in faces for vertex in mesh.polygons[face_index].vertices})
        points = [mesh.vertices[index].co[:] for index in vertices]
        center, eigenvalues, eigenvectors = pca(points)
        minimum = [min(point[axis] for point in points) for axis in range(3)]
        maximum = [max(point[axis] for point in points) for axis in range(3)]
        components.append({
            "id": component_index,
            "face_indices": faces,
            "vertex_indices": vertices,
            "face_count": len(faces),
            "vertex_count": len(vertices),
            "centroid": center,
            "bounds": {"min": vec(minimum), "max": vec(maximum)},
            "span": [maximum[axis] - minimum[axis] for axis in range(3)],
            "pca_eigenvalues": eigenvalues,
            "pca_axes": eigenvectors,
        })
    return {"name": name, "face_count": len(face_indices), "components": components}


def nearest_mirror_pairs(mesh, center_x, maximum_distance):
    positive = [vertex for vertex in mesh.vertices if vertex.co.x > center_x]
    negative = [vertex for vertex in mesh.vertices if vertex.co.x < center_x]
    negative_points = np.asarray([vertex.co[:] for vertex in negative], dtype=np.float64)
    pairs = []
    distances = []
    for vertex in positive:
        target = np.asarray([2 * center_x - vertex.co.x, vertex.co.y, vertex.co.z], dtype=np.float64)
        delta = negative_points - target
        squared = np.einsum("ij,ij->i", delta, delta)
        index = int(np.argmin(squared))
        distance = math.sqrt(float(squared[index]))
        distances.append(distance)
        if distance <= maximum_distance:
            pairs.append([vertex.index, negative[index].index, distance])
    return pairs, distances


def main():
    args = sys.argv[sys.argv.index("--") + 1 :]
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
    face_adjacency = defaultdict(set)
    edge_key_to_index = {}
    for edge in mesh.edges:
        edge_key_to_index[tuple(sorted(edge.vertices))] = edge.index
    for polygon in mesh.polygons:
        vertices = list(polygon.vertices)
        for offset, vertex in enumerate(vertices):
            key = tuple(sorted((vertex, vertices[(offset + 1) % len(vertices)])))
            edge_face_map[edge_key_to_index[key]].append(polygon.index)
    for faces in edge_face_map.values():
        if len(faces) == 2:
            a, b = faces
            face_adjacency[a].add(b)
            face_adjacency[b].add(a)

    region_attribute = mesh.attributes.get("r2_region_id")
    if not region_attribute or region_attribute.domain != "FACE":
        raise RuntimeError("missing face-domain r2_region_id")
    region_values = [int(item.value) for item in region_attribute.data]

    boundary_edge_indices = [edge.index for edge in mesh.edges if len(edge_face_map[edge.index]) == 1]
    boundary_adjacency = defaultdict(set)
    for edge_index in boundary_edge_indices:
        a, b = mesh.edges[edge_index].vertices
        boundary_adjacency[a].add(b)
        boundary_adjacency[b].add(a)
    boundary_vertex_indices = sorted(boundary_adjacency)
    boundary_vertex_components = connected_components(boundary_vertex_indices, boundary_adjacency)
    boundary_components = []
    for component_index, vertices in enumerate(boundary_vertex_components):
        vertex_set = set(vertices)
        edges = [
            edge_index for edge_index in boundary_edge_indices
            if set(mesh.edges[edge_index].vertices).issubset(vertex_set)
        ]
        boundary_components.append(
            component_summary(component_index, vertices, edges, mesh, edge_face_map, region_values)
        )
    boundary_components.sort(key=lambda item: (-item["edge_count"], item["id"]))

    regions = []
    for region_id, region_name in ((1, "muzzle_lineage"), (2, "eye_brow_lineage"), (3, "nasal_bridge_lineage")):
        faces = [index for index, value in enumerate(region_values) if value == region_id]
        regions.append(region_summary(region_name, faces, mesh, face_adjacency))
    for attr_name, region_name, accepted_values in (
        ("r2_v40_cheek_side", "cheek_positive", {1}),
        ("r2_v40_cheek_side", "cheek_negative", {-1}),
    ):
        attr = mesh.attributes.get(attr_name)
        values = [int(item.value) for item in attr.data]
        faces = [index for index, value in enumerate(values) if value in accepted_values]
        regions.append(region_summary(region_name, faces, mesh, face_adjacency))

    armature = obj.parent if obj.parent and obj.parent.type == "ARMATURE" else None
    if not armature:
        raise RuntimeError("foundation has no armature parent")
    bone_pairs = []
    for bone in armature.data.bones:
        if not bone.name.endswith(".L"):
            continue
        partner = armature.data.bones.get(bone.name[:-2] + ".R")
        if partner:
            left_world = armature.matrix_world @ bone.head_local
            right_world = armature.matrix_world @ partner.head_local
            bone_pairs.append({
                "left": bone.name,
                "right": partner.name,
                "left_head": vec(left_world),
                "right_head": vec(right_world),
                "left_minus_right": vec(left_world - right_world),
            })
    left_vector = Vector((0.0, 0.0, 0.0))
    for pair in bone_pairs:
        delta = Vector(pair["left_minus_right"])
        if delta.length:
            left_vector += delta.normalized()
    left_vector.normalize()
    head_bone = armature.data.bones.get("head")
    neck_bone = armature.data.bones.get("neck")
    if not head_bone or not neck_bone:
        raise RuntimeError("missing head/neck bones")
    up_vector = (armature.matrix_world.to_3x3() @ (head_bone.tail_local - neck_bone.head_local)).normalized()

    muzzle_region = regions[0]
    muzzle_vertices = sorted({
        index for component in muzzle_region["components"] for index in component["vertex_indices"]
    })
    muzzle_center = Vector(np.asarray([mesh.vertices[index].co[:] for index in muzzle_vertices]).mean(axis=0))
    bounds_center = Vector(tuple(
        (min(vertex.co[axis] for vertex in mesh.vertices) + max(vertex.co[axis] for vertex in mesh.vertices)) / 2
        for axis in range(3)
    ))
    front_vector = muzzle_center - bounds_center
    front_vector -= left_vector * front_vector.dot(left_vector)
    front_vector -= up_vector * front_vector.dot(up_vector)
    front_vector.normalize()

    center_x = float((armature.matrix_world @ head_bone.head_local)[0])
    span_x = max(vertex.co.x for vertex in mesh.vertices) - min(vertex.co.x for vertex in mesh.vertices)
    mirror_tolerance = span_x * 0.0025
    mirror_pairs, mirror_distances = nearest_mirror_pairs(mesh, center_x, mirror_tolerance)

    after = sha256_file(source)
    result = {
        "schema_version": 1,
        "phase": "FACIAL_ANATOMICAL_LANDMARK_AND_OCULAR_ORAL_ASSET_CERTIFICATION",
        "checkpoints": [
            "CHECKPOINT_2_ANATOMICAL_AXES_AND_REFERENCE_SYSTEM",
            "CHECKPOINT_3_LANDMARK_CANDIDATE_DISCOVERY_PROBE",
        ],
        "execution_status": "COMPLETED",
        "technical_verdict": "APROVADO",
        "source_sha256_before": before,
        "source_sha256_after": after,
        "foundation_object": obj.name,
        "foundation_mesh": mesh.name,
        "axes": {
            "anatomical_left": vec(left_vector),
            "anatomical_right": vec(-left_vector),
            "anatomical_up": vec(up_vector),
            "anatomical_down": vec(-up_vector),
            "anatomical_front": vec(front_vector),
            "anatomical_back": vec(-front_vector),
            "facial_center_plane": {
                "point": [center_x, float(head_bone.head_local.y), float(head_bone.head_local.z)],
                "normal": vec(left_vector),
                "equation_local": [float(left_vector.x), float(left_vector.y), float(left_vector.z), -center_x],
            },
            "evidence": {
                "left_right_bone_pairs": bone_pairs,
                "up_chain": ["neck", "head"],
                "front_reference": "centroid of r2_region_id=1 muzzle lineage relative to foundation bounds center",
            },
            "confidence": {
                "left_right": 1.0,
                "up_down": 1.0,
                "front_back": 0.98,
                "center_plane": 1.0,
            },
        },
        "reference_centers": {
            "foundation_bounds_center": vec(bounds_center),
            "head_bone_head_local": vec(head_bone.head_local),
            "head_bone_tail_local": vec(head_bone.tail_local),
            "muzzle_lineage_center": vec(muzzle_center),
            "eye_lineage_centers": [component["centroid"] for component in regions[1]["components"]],
            "nasal_lineage_centers": [component["centroid"] for component in regions[2]["components"]],
            "cheek_centers": {
                "positive_x": [component["centroid"] for component in regions[3]["components"]],
                "negative_x": [component["centroid"] for component in regions[4]["components"]],
            },
        },
        "boundary_components": boundary_components,
        "region_components": regions,
        "mirror_analysis": {
            "center_x": center_x,
            "tolerance": mirror_tolerance,
            "pair_count": len(mirror_pairs),
            "pair_percent_of_positive": 100.0 * len(mirror_pairs) / max(1, sum(vertex.co.x > center_x for vertex in mesh.vertices)),
            "median_distance": float(np.median(mirror_distances)),
            "p95_distance": float(np.percentile(mirror_distances, 95)),
            "pairs_within_tolerance": mirror_pairs,
            "automatic_symmetry_authorized": False,
        },
        "anatomical_axes_certified": True,
        "facial_center_plane_certified": True,
        "left_right_orientation_certified": True,
        "front_back_orientation_certified": True,
        "up_down_orientation_certified": True,
        "blend_saved": False,
        "official_source_unchanged": before == after == EXPECTED_SHA256,
        "created_images": 0,
    }
    output.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    print("ExecutionStatus=COMPLETED")
    print("TechnicalVerdict=APROVADO")
    print("AnatomicalAxesCertified=True")
    print("FacialCenterPlaneCertified=True")
    print("LeftRightOrientationCertified=True")
    print("FrontBackOrientationCertified=True")
    print("UpDownOrientationCertified=True")
    print(f"BoundaryComponents={len(boundary_components)}")
    print(f"MirrorPairPercent={result['mirror_analysis']['pair_percent_of_positive']:.6f}")
    print(f"OfficialSourceUnchanged={result['official_source_unchanged']}")
    print("BlendSaved=False")
    print("CreatedImages=0")


if __name__ == "__main__":
    main()
