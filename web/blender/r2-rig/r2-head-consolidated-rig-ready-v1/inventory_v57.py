import bpy
import hashlib
import json
import math
import os
import sys
import traceback
from collections import defaultdict, deque

SOURCE = r"C:\Projetos\consorcio-os\web\blender\r2-rig\r2-v57-negative-x-middle-mid-depth-retopology-v1\r2-rig-v57-negative-x-middle-mid-depth-retopology-v1.blend"
EXPECTED_SHA = "63F7F71988B171A37DF9A09EC8F957729DEF6D35E2D0C093A73577702F892752"
OUTPUT = r"C:\Projetos\consorcio-os\web\blender\r2-rig\R2_HEAD_READ_ONLY_INVENTORY.json"
EPS = 1.0e-12


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest().upper()


def safe_value(value):
    if value is None or isinstance(value, (bool, int, float, str)):
        return value
    if hasattr(value, "to_list"):
        return safe_value(value.to_list())
    if isinstance(value, (list, tuple)):
        return [safe_value(item) for item in value]
    if hasattr(value, "keys"):
        try:
            return {str(key): safe_value(value[key]) for key in value.keys()}
        except Exception:
            pass
    return str(value)


def id_properties(block):
    try:
        keys = sorted(block.keys())
    except (AttributeError, TypeError):
        return {}
    return {key: safe_value(block[key]) for key in keys if key != "_RNA_UI"}


def matrix_rows(matrix):
    return [[float(value) for value in row] for row in matrix]


def mesh_topology(obj):
    mesh = obj.data
    edge_faces = [0] * len(mesh.edges)
    edge_key_to_index = {tuple(sorted(edge.vertices)): edge.index for edge in mesh.edges}
    for poly in mesh.polygons:
        for key in poly.edge_keys:
            idx = edge_key_to_index.get(tuple(sorted(key)))
            if idx is not None:
                edge_faces[idx] += 1
    adjacency = [[] for _ in mesh.vertices]
    for edge in mesh.edges:
        a, b = edge.vertices
        adjacency[a].append(b)
        adjacency[b].append(a)
    active = {v.index for v in mesh.vertices if adjacency[v.index]}
    for poly in mesh.polygons:
        active.update(poly.vertices)
    visited = set()
    islands = 0
    for start in sorted(active):
        if start in visited:
            continue
        islands += 1
        visited.add(start)
        queue = deque([start])
        while queue:
            current = queue.popleft()
            for nxt in adjacency[current]:
                if nxt not in visited:
                    visited.add(nxt)
                    queue.append(nxt)
    zero_area = [p.index for p in mesh.polygons if p.area <= EPS]
    degenerate = [p.index for p in mesh.polygons if len(set(p.vertices)) < 3]
    coordinate_groups = defaultdict(list)
    for vertex in mesh.vertices:
        key = tuple(round(float(c), 9) for c in vertex.co)
        coordinate_groups[key].append(vertex.index)
    duplicates = [indices for indices in coordinate_groups.values() if len(indices) > 1]
    invalid_group_refs = 0
    unweighted = []
    weight_sums = []
    group_count = len(obj.vertex_groups)
    for vertex in mesh.vertices:
        total = 0.0
        has_weight = False
        for assignment in vertex.groups:
            if assignment.group >= group_count:
                invalid_group_refs += 1
            if assignment.weight > 0.0:
                has_weight = True
                total += float(assignment.weight)
        if group_count and not has_weight:
            unweighted.append(vertex.index)
        weight_sums.append(total)
    return {
        "vertices": len(mesh.vertices),
        "edges": len(mesh.edges),
        "faces": len(mesh.polygons),
        "loops": len(mesh.loops),
        "connected_islands": islands,
        "boundary_edges": sum(1 for count in edge_faces if count == 1),
        "wire_edges": sum(1 for count in edge_faces if count == 0),
        "invalid_non_manifold_edges": sum(1 for count in edge_faces if count > 2),
        "loose_vertices": sum(1 for index in range(len(mesh.vertices)) if not adjacency[index]),
        "degenerate_faces": len(degenerate),
        "degenerate_face_indices": degenerate,
        "zero_area_faces": len(zero_area),
        "zero_area_face_indices": zero_area,
        "duplicate_coordinate_groups": len(duplicates),
        "duplicate_coordinate_vertices": duplicates,
        "invalid_vertex_group_references": invalid_group_refs,
        "unweighted_vertices_when_groups_exist": len(unweighted),
        "unweighted_vertex_indices": unweighted,
        "weight_sum_min": min(weight_sums) if weight_sums else 0.0,
        "weight_sum_max": max(weight_sums) if weight_sums else 0.0,
        "weight_sum_nonunit_count": sum(1 for total in weight_sums if total > 0.0 and abs(total - 1.0) > 1.0e-5),
    }


def object_record(obj):
    record = {
        "name": obj.name,
        "type": obj.type,
        "data_name": obj.data.name if obj.data else None,
        "data_users": obj.data.users if obj.data else None,
        "parent": obj.parent.name if obj.parent else None,
        "parent_type": obj.parent_type if obj.parent else None,
        "parent_bone": obj.parent_bone if obj.parent and obj.parent_type == "BONE" else None,
        "children": sorted(child.name for child in obj.children),
        "collections": sorted(collection.name for collection in obj.users_collection),
        "hide_viewport": bool(obj.hide_viewport),
        "hide_render": bool(obj.hide_render),
        "hide_get": bool(obj.hide_get()),
        "visible_get": bool(obj.visible_get()),
        "display_type": obj.display_type,
        "location": list(obj.location),
        "rotation_mode": obj.rotation_mode,
        "rotation_euler": list(obj.rotation_euler),
        "rotation_quaternion": list(obj.rotation_quaternion),
        "scale": list(obj.scale),
        "matrix_world": matrix_rows(obj.matrix_world),
        "negative_scale": obj.matrix_world.determinant() < 0.0,
        "unapplied_transform": any(abs(float(v)) > 1.0e-8 for v in obj.location) or any(abs(float(v) - 1.0) > 1.0e-8 for v in obj.scale) or any(abs(float(v)) > 1.0e-8 for v in obj.rotation_euler),
        "library": obj.library.filepath if obj.library else None,
        "override_library": bool(obj.override_library),
        "custom_properties": id_properties(obj),
        "constraints": [
            {
                "name": constraint.name,
                "type": constraint.type,
                "mute": bool(constraint.mute),
                "target": constraint.target.name if hasattr(constraint, "target") and constraint.target else None,
                "subtarget": constraint.subtarget if hasattr(constraint, "subtarget") else None,
            }
            for constraint in obj.constraints
        ],
        "modifiers": [
            {
                "index": index,
                "name": modifier.name,
                "type": modifier.type,
                "show_viewport": bool(modifier.show_viewport),
                "show_render": bool(modifier.show_render),
                "object": modifier.object.name if hasattr(modifier, "object") and modifier.object else None,
                "vertex_group": modifier.vertex_group if hasattr(modifier, "vertex_group") else None,
                "custom_properties": id_properties(modifier),
            }
            for index, modifier in enumerate(obj.modifiers)
        ],
    }
    if obj.type == "MESH":
        mesh = obj.data
        record.update({
            "topology": mesh_topology(obj),
            "materials": [slot.material.name if slot.material else None for slot in obj.material_slots],
            "material_index_counts": {str(index): sum(1 for poly in mesh.polygons if poly.material_index == index) for index in range(len(obj.material_slots))},
            "invalid_material_index_faces": [poly.index for poly in mesh.polygons if poly.material_index >= len(obj.material_slots)],
            "vertex_groups": [
                {"index": group.index, "name": group.name, "lock_weight": bool(group.lock_weight)}
                for group in obj.vertex_groups
            ],
            "uv_maps": [
                {"name": layer.name, "active": layer == mesh.uv_layers.active, "active_render": bool(layer.active_render), "data_length": len(layer.data)}
                for layer in mesh.uv_layers
            ],
            "color_attributes": [
                {"name": attr.name, "domain": attr.domain, "data_type": attr.data_type, "data_length": len(attr.data)}
                for attr in mesh.color_attributes
            ],
            "face_attributes": [
                {"name": attr.name, "domain": attr.domain, "data_type": attr.data_type, "data_length": len(attr.data)}
                for attr in mesh.attributes if attr.domain == "FACE"
            ],
            "all_attributes": [
                {"name": attr.name, "domain": attr.domain, "data_type": attr.data_type, "data_length": len(attr.data)}
                for attr in mesh.attributes
            ],
            "shape_keys": [] if mesh.shape_keys is None else [
                {"name": key.name, "value": float(key.value), "relative_key": key.relative_key.name if key.relative_key else None}
                for key in mesh.shape_keys.key_blocks
            ],
            "mesh_custom_properties": id_properties(mesh),
        })
    elif obj.type == "ARMATURE":
        armature = obj.data
        record.update({
            "bones": [
                {
                    "name": bone.name,
                    "parent": bone.parent.name if bone.parent else None,
                    "head_local": list(bone.head_local),
                    "tail_local": list(bone.tail_local),
                    "use_deform": bool(bone.use_deform),
                }
                for bone in armature.bones
            ],
            "armature_custom_properties": id_properties(armature),
        })
    return record


def main():
    before = sha256(SOURCE)
    if before != EXPECTED_SHA:
        raise RuntimeError(f"Source hash mismatch before open: {before}")
    bpy.ops.wm.open_mainfile(filepath=SOURCE, load_ui=False, use_scripts=False)
    objects = [object_record(obj) for obj in sorted(bpy.data.objects, key=lambda value: value.name)]
    datablocks = {}
    collections = [
        ("objects", bpy.data.objects), ("meshes", bpy.data.meshes), ("armatures", bpy.data.armatures),
        ("materials", bpy.data.materials), ("images", bpy.data.images), ("actions", bpy.data.actions),
        ("collections", bpy.data.collections), ("curves", bpy.data.curves), ("cameras", bpy.data.cameras),
        ("lights", bpy.data.lights), ("node_groups", bpy.data.node_groups), ("shape_keys", bpy.data.shape_keys),
    ]
    for name, blocks in collections:
        datablocks[name] = {
            "count": len(blocks),
            "orphans": sorted(block.name for block in blocks if block.users == 0),
            "linked": sorted(block.name for block in blocks if block.library is not None),
        }
    inventory = {
        "execution_status": "COMPLETED",
        "technical_verdict": "APROVADO",
        "failed_gates": [],
        "source_path": SOURCE,
        "source_v57_sha256": before,
        "blender_version": bpy.app.version_string,
        "blend_saved": False,
        "images_created": 0,
        "scenes": [
            {
                "name": scene.name,
                "objects": sorted(obj.name for obj in scene.objects),
                "camera": scene.camera.name if scene.camera else None,
                "frame_start": scene.frame_start,
                "frame_end": scene.frame_end,
                "custom_properties": id_properties(scene),
            }
            for scene in bpy.data.scenes
        ],
        "collections": [
            {
                "name": collection.name,
                "objects": sorted(obj.name for obj in collection.objects),
                "children": sorted(child.name for child in collection.children),
                "hide_viewport": bool(collection.hide_viewport),
                "hide_render": bool(collection.hide_render),
                "library": collection.library.filepath if collection.library else None,
                "custom_properties": id_properties(collection),
            }
            for collection in sorted(bpy.data.collections, key=lambda value: value.name)
        ],
        "objects": objects,
        "materials": [
            {
                "name": material.name,
                "users": material.users,
                "use_nodes": bool(material.use_nodes),
                "library": material.library.filepath if material.library else None,
                "custom_properties": id_properties(material),
            }
            for material in sorted(bpy.data.materials, key=lambda value: value.name)
        ],
        "datablocks": datablocks,
        "potential_name_collisions": sorted(
            obj.name for obj in bpy.data.objects
            if len(obj.name) > 4 and obj.name[-4] == "." and obj.name[-3:].isdigit()
        ),
    }
    after = sha256(SOURCE)
    inventory["source_v57_sha256_after"] = after
    inventory["v57_unchanged"] = after == before == EXPECTED_SHA
    if not inventory["v57_unchanged"]:
        inventory["technical_verdict"] = "REPROVADO"
        inventory["failed_gates"].append("V57Unchanged")
    with open(OUTPUT, "w", encoding="utf-8", newline="\n") as handle:
        json.dump(inventory, handle, indent=2, ensure_ascii=False, sort_keys=True)
        handle.write("\n")
    print("ExecutionStatus=" + inventory["execution_status"])
    print("TechnicalVerdict=" + inventory["technical_verdict"])
    print("SourceV57SHA256=" + before)
    print("BlendSaved=False")
    print("ImagesCreated=0")
    print("V57Unchanged=" + str(inventory["v57_unchanged"]))
    print("FailedGates=" + ("NONE" if not inventory["failed_gates"] else ",".join(inventory["failed_gates"])))
    if inventory["failed_gates"]:
        sys.exit(2)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        traceback.print_exc()
        sys.exit(1)
