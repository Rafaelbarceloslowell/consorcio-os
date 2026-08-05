import hashlib
import json
import math
import struct
import sys
from pathlib import Path

import bpy
from mathutils import Vector


EXPECTED_SOURCE_SHA256 = "340EEDFD0251432E6B8326B23EAE3AD268D560CC9D2FEE0940C8F03F9DC5B64B"


def sha256_file(path):
    digest = hashlib.sha256()
    with open(path, "rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest().upper()


def sha256_bytes(data):
    return hashlib.sha256(data).hexdigest().upper()


def canonical_json_hash(value):
    payload = json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return sha256_bytes(payload.encode("utf-8"))


def finite_float(value):
    value = float(value)
    if not math.isfinite(value):
        raise RuntimeError(f"non-finite value: {value}")
    return value


def vector_list(value):
    return [finite_float(component) for component in value]


def custom_properties(id_block):
    result = {}
    for key in sorted(id_block.keys()):
        if key == "_RNA_UI":
            continue
        value = id_block[key]
        if hasattr(value, "to_list"):
            value = value.to_list()
        elif not isinstance(value, (str, int, float, bool, list, dict, type(None))):
            try:
                value = list(value)
            except TypeError:
                value = str(value)
        result[key] = value
    return result


def attribute_item_value(item):
    for property_name in (
        "value", "vector", "color", "color_srgb", "byte_color", "string",
        "int8", "quaternion", "matrix",
    ):
        if hasattr(item, property_name):
            value = getattr(item, property_name)
            if isinstance(value, (str, int, bool)):
                return value
            if isinstance(value, float):
                return finite_float(value)
            try:
                return [finite_float(component) for component in value]
            except TypeError:
                return str(value)
    properties = []
    for prop in item.bl_rna.properties:
        if prop.identifier != "rna_type" and not prop.is_readonly:
            properties.append(prop.identifier)
    raise RuntimeError(f"unsupported attribute item properties: {properties}")


def identify_foundation():
    candidates = []
    for obj in bpy.data.objects:
        if obj.type != "MESH":
            continue
        mesh = obj.data
        role = obj.get("r2_head_foundation_role")
        groups = {group.name for group in obj.vertex_groups}
        attr_names = {attr.name for attr in mesh.attributes}
        armature_modifiers = [modifier for modifier in obj.modifiers if modifier.type == "ARMATURE"]
        reasons = []
        score = 0
        if role == "PRIMARY_DEFORMABLE_HEAD_SURFACE":
            score += 100
            reasons.append("certified consolidation role")
        if groups == {"neck", "head"}:
            score += 20
            reasons.append("exact head/neck group set")
        if "r2_region_id" in attr_names:
            score += 20
            reasons.append("retopology region lineage")
        if len(armature_modifiers) == 1:
            score += 5
            reasons.append("single armature modifier")
        if obj.parent and obj.parent.type == "ARMATURE":
            score += 5
            reasons.append("armature parent")
        if score:
            candidates.append({"object": obj, "score": score, "reasons": reasons})
    candidates.sort(key=lambda entry: (-entry["score"], entry["object"].name))
    if not candidates or candidates[0]["score"] < 100:
        raise RuntimeError("no mesh has the approved PRIMARY_DEFORMABLE_HEAD_SURFACE role")
    if len(candidates) > 1 and candidates[1]["score"] == candidates[0]["score"]:
        raise RuntimeError("foundation identity is ambiguous")
    return candidates[0], [
        {"object": item["object"].name, "score": item["score"], "reasons": item["reasons"]}
        for item in candidates
    ]


def main():
    args = sys.argv[sys.argv.index("--") + 1 :]
    if len(args) != 2:
        raise SystemExit("expected SOURCE_BLEND OUTPUT_JSON")
    source = Path(args[0]).resolve()
    output = Path(args[1]).resolve()

    source_hash_before = sha256_file(source)
    if source_hash_before != EXPECTED_SOURCE_SHA256:
        raise RuntimeError(f"source hash mismatch: {source_hash_before}")
    source_stat = source.stat()
    bpy.ops.wm.open_mainfile(filepath=str(source), load_ui=False)

    selected, all_candidates = identify_foundation()
    obj = selected["object"]
    mesh = obj.data
    mesh.update(calc_edges=True)
    mesh.calc_loop_triangles()

    vertex_bytes = bytearray()
    ordered_vertices = []
    for vertex in mesh.vertices:
        coords = tuple(finite_float(component) for component in vertex.co)
        vertex_bytes.extend(struct.pack("<I3d", vertex.index, *coords))
        ordered_vertices.append({"index": vertex.index, "co": list(coords)})

    edge_bytes = bytearray()
    ordered_edges = []
    for edge in mesh.edges:
        vertices = tuple(int(index) for index in edge.vertices)
        edge_bytes.extend(struct.pack("<I2I", edge.index, *vertices))
        ordered_edges.append({"index": edge.index, "vertices": list(vertices)})

    polygon_bytes = bytearray()
    ordered_polygons = []
    for polygon in mesh.polygons:
        vertices = tuple(int(index) for index in polygon.vertices)
        polygon_bytes.extend(struct.pack("<II", polygon.index, len(vertices)))
        for index in vertices:
            polygon_bytes.extend(struct.pack("<I", index))
        ordered_polygons.append({
            "index": polygon.index,
            "vertices": list(vertices),
            "material_index": int(polygon.material_index),
        })

    uv_layers = []
    for layer in mesh.uv_layers:
        values = [vector_list(item.uv) for item in layer.data]
        uv_layers.append({
            "name": layer.name,
            "active": layer == mesh.uv_layers.active,
            "active_render": bool(layer.active_render),
            "values": values,
            "fingerprint": canonical_json_hash(values),
        })

    attributes = []
    for attribute in sorted(mesh.attributes, key=lambda item: item.name):
        values = [attribute_item_value(item) for item in attribute.data]
        attributes.append({
            "name": attribute.name,
            "domain": attribute.domain,
            "data_type": attribute.data_type,
            "count": len(values),
            "fingerprint": canonical_json_hash(values),
            "value_counts": (
                {str(value): values.count(value) for value in sorted(set(values))}
                if values and isinstance(values[0], (str, int, bool)) else None
            ),
        })

    vertex_groups = []
    vertex_group_payload = []
    for group in sorted(obj.vertex_groups, key=lambda item: item.index):
        weights = []
        for vertex in mesh.vertices:
            for assignment in vertex.groups:
                if assignment.group == group.index:
                    weights.append([vertex.index, finite_float(assignment.weight)])
                    break
        vertex_groups.append({
            "name": group.name,
            "index": group.index,
            "weighted_vertex_count": len(weights),
            "fingerprint": canonical_json_hash(weights),
        })
        vertex_group_payload.append([group.name, group.index, weights])

    material_slots = [slot.material.name if slot.material else None for slot in obj.material_slots]
    material_assignments = [int(polygon.material_index) for polygon in mesh.polygons]

    object_bbox_local = [vector_list(corner) for corner in obj.bound_box]
    object_bbox_world = [vector_list(obj.matrix_world @ Vector(corner)) for corner in obj.bound_box]
    local_min = [min(vertex.co[axis] for vertex in mesh.vertices) for axis in range(3)]
    local_max = [max(vertex.co[axis] for vertex in mesh.vertices) for axis in range(3)]
    world_positions = [obj.matrix_world @ vertex.co for vertex in mesh.vertices]
    world_min = [min(position[axis] for position in world_positions) for axis in range(3)]
    world_max = [max(position[axis] for position in world_positions) for axis in range(3)]

    modifiers = []
    for modifier in obj.modifiers:
        item = {"name": modifier.name, "type": modifier.type}
        if modifier.type == "ARMATURE":
            item.update({
                "object": modifier.object.name if modifier.object else None,
                "use_vertex_groups": bool(modifier.use_vertex_groups),
                "use_bone_envelopes": bool(modifier.use_bone_envelopes),
            })
        modifiers.append(item)

    collections = sorted(collection.name for collection in obj.users_collection)
    scene_membership = sorted(scene.name for scene in bpy.data.scenes if obj.name in scene.objects)

    source_hash_after = sha256_file(source)
    result = {
        "schema_version": 1,
        "phase": "FACIAL_ANATOMICAL_LANDMARK_AND_OCULAR_ORAL_ASSET_CERTIFICATION",
        "checkpoint": "CHECKPOINT_1_SOURCE_AND_FOUNDATION_IDENTITY",
        "execution_status": "COMPLETED",
        "technical_verdict": "APROVADO",
        "blender_version": bpy.app.version_string,
        "source": {
            "path": str(source),
            "sha256_before": source_hash_before,
            "sha256_after": source_hash_after,
            "size_bytes": source_stat.st_size,
            "timestamp_ns": source_stat.st_mtime_ns,
        },
        "foundation_identity_confirmed": True,
        "foundation_identification": {
            "selected_object": obj.name,
            "selected_score": selected["score"],
            "selected_reasons": selected["reasons"],
            "all_scored_candidates": all_candidates,
        },
        "foundation": {
            "scene_membership": scene_membership,
            "collection_membership": collections,
            "object_name": obj.name,
            "mesh_name": mesh.name,
            "object_custom_properties": custom_properties(obj),
            "mesh_custom_properties": custom_properties(mesh),
            "vertices": len(mesh.vertices),
            "edges": len(mesh.edges),
            "polygons": len(mesh.polygons),
            "loops": len(mesh.loops),
            "loop_triangles": len(mesh.loop_triangles),
            "material_slots": material_slots,
            "uv_maps": [layer["name"] for layer in uv_layers],
            "color_attributes": [attribute.name for attribute in mesh.color_attributes],
            "attributes": attributes,
            "vertex_groups": vertex_groups,
            "shape_keys": [key.name for key in mesh.shape_keys.key_blocks] if mesh.shape_keys else [],
            "modifiers": modifiers,
            "parent": obj.parent.name if obj.parent else None,
            "parent_type": obj.parent_type,
            "world_matrix": [vector_list(row) for row in obj.matrix_world],
            "object_bbox_local_corners": object_bbox_local,
            "object_bbox_world_corners": object_bbox_world,
            "vertex_bounds_local": {"min": vector_list(local_min), "max": vector_list(local_max)},
            "vertex_bounds_world": {"min": vector_list(world_min), "max": vector_list(world_max)},
        },
        "fingerprints": {
            "ordered_vertex_coordinates_sha256": sha256_bytes(bytes(vertex_bytes)),
            "ordered_polygon_vertex_indices_sha256": sha256_bytes(bytes(polygon_bytes)),
            "ordered_edges_sha256": sha256_bytes(bytes(edge_bytes)),
            "uv_layers_sha256": canonical_json_hash(uv_layers),
            "attributes_sha256": canonical_json_hash(attributes),
            "vertex_groups_sha256": canonical_json_hash(vertex_group_payload),
            "material_assignments_sha256": canonical_json_hash({
                "slots": material_slots,
                "polygon_indices": material_assignments,
            }),
            "combined_foundation_identity_sha256": canonical_json_hash({
                "object": obj.name,
                "mesh": mesh.name,
                "vertices": sha256_bytes(bytes(vertex_bytes)),
                "polygons": sha256_bytes(bytes(polygon_bytes)),
                "edges": sha256_bytes(bytes(edge_bytes)),
                "uv": canonical_json_hash(uv_layers),
                "attributes": canonical_json_hash(attributes),
                "groups": canonical_json_hash(vertex_group_payload),
                "materials": canonical_json_hash({"slots": material_slots, "polygon_indices": material_assignments}),
            }),
        },
        "ordered_vertices": ordered_vertices,
        "ordered_edges": ordered_edges,
        "ordered_polygons": ordered_polygons,
        "vertex_order_fingerprint_created": True,
        "blend_saved": False,
        "official_source_unchanged": source_hash_before == source_hash_after == EXPECTED_SOURCE_SHA256,
        "created_images": 0,
        "failed_gates": [],
    }
    output.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    print("ExecutionStatus=COMPLETED")
    print("TechnicalVerdict=APROVADO")
    print(f"SourceSHA256={source_hash_after}")
    print("FoundationIdentityConfirmed=True")
    print("VertexOrderFingerprintCreated=True")
    print("BlendSaved=False")
    print(f"OfficialSourceUnchanged={result['official_source_unchanged']}")
    print("CreatedImages=0")
    print(f"FoundationObject={obj.name}")
    print(f"FoundationMesh={mesh.name}")
    print(f"FoundationVertices={len(mesh.vertices)}")
    print(f"FoundationPolygons={len(mesh.polygons)}")
    print(f"CombinedFingerprint={result['fingerprints']['combined_foundation_identity_sha256']}")


if __name__ == "__main__":
    main()
