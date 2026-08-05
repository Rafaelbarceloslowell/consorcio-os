import bpy
import hashlib
import json
import os
import struct
import sys
import traceback


def arguments():
    argv = sys.argv
    if "--" not in argv:
        raise RuntimeError("Expected -- <output-json>")
    values = argv[argv.index("--") + 1 :]
    if len(values) != 1:
        raise RuntimeError("Expected exactly one output JSON path")
    return os.path.abspath(values[0])


def sha256_file(path):
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest().upper()


def rounded(value):
    return round(float(value), 9)


def vector(value):
    return [rounded(component) for component in value]


def matrix(value):
    return [[rounded(component) for component in row] for row in value]


def canonical_hash(value):
    payload = json.dumps(
        value,
        ensure_ascii=True,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("utf-8")
    return hashlib.sha256(payload).hexdigest().upper()


def safe_property(value):
    if value is None or isinstance(value, (bool, int, float, str)):
        return value
    if hasattr(value, "to_list"):
        return safe_property(value.to_list())
    if isinstance(value, (list, tuple)):
        return [safe_property(item) for item in value]
    return str(value)


def id_properties(block):
    try:
        keys = sorted(block.keys())
    except (AttributeError, TypeError):
        return {}
    return {
        key: safe_property(block[key])
        for key in keys
        if key != "_RNA_UI"
    }


def mesh_geometry_fingerprint(mesh):
    digest = hashlib.sha256()
    digest.update(struct.pack("<QQQ", len(mesh.vertices), len(mesh.edges), len(mesh.polygons)))
    for vertex in mesh.vertices:
        digest.update(struct.pack("<3d", *(float(component) for component in vertex.co)))
    for edge in mesh.edges:
        digest.update(struct.pack("<2I", *edge.vertices))
    for polygon in mesh.polygons:
        vertices = tuple(polygon.vertices)
        digest.update(struct.pack("<I", len(vertices)))
        if vertices:
            digest.update(struct.pack("<" + "I" * len(vertices), *vertices))
    return digest.hexdigest().upper()


def mesh_attribute_manifest(mesh):
    return [
        {
            "name": attribute.name,
            "domain": attribute.domain,
            "data_type": attribute.data_type,
            "data_length": len(attribute.data),
        }
        for attribute in sorted(mesh.attributes, key=lambda item: item.name)
        if not attribute.name.startswith(".")
    ]


def vertex_group_fingerprints(obj):
    groups = sorted(obj.vertex_groups, key=lambda item: item.name)
    by_index = {group.index: group for group in groups}
    accumulators = {
        group.index: {
            "digest": hashlib.sha256(),
            "count": 0,
            "sum": 0.0,
            "minimum": None,
            "maximum": None,
        }
        for group in groups
    }
    for vertex in obj.data.vertices:
        for membership in sorted(vertex.groups, key=lambda item: item.group):
            if membership.group not in accumulators:
                continue
            record = accumulators[membership.group]
            weight = float(membership.weight)
            record["digest"].update(struct.pack("<Id", vertex.index, weight))
            record["count"] += 1
            record["sum"] += weight
            record["minimum"] = weight if record["minimum"] is None else min(record["minimum"], weight)
            record["maximum"] = weight if record["maximum"] is None else max(record["maximum"], weight)
    result = []
    for group_index in sorted(by_index, key=lambda index: by_index[index].name):
        group = by_index[group_index]
        record = accumulators[group_index]
        result.append(
            {
                "name": group.name,
                "assignment_count": record["count"],
                "weight_sum": rounded(record["sum"]),
                "minimum_weight": None if record["minimum"] is None else rounded(record["minimum"]),
                "maximum_weight": None if record["maximum"] is None else rounded(record["maximum"]),
                "fingerprint": record["digest"].hexdigest().upper(),
            }
        )
    return result


def shape_key_manifest(obj):
    if not obj.data.shape_keys:
        return []
    result = []
    for key in obj.data.shape_keys.key_blocks:
        digest = hashlib.sha256()
        for point in key.data:
            digest.update(struct.pack("<3d", *(float(component) for component in point.co)))
        result.append(
            {
                "name": key.name,
                "point_count": len(key.data),
                "slider_min": rounded(key.slider_min),
                "slider_max": rounded(key.slider_max),
                "vertex_fingerprint": digest.hexdigest().upper(),
            }
        )
    return result


def material_manifest(obj):
    result = []
    for slot in obj.material_slots:
        material = slot.material
        result.append(
            {
                "slot": slot.name,
                "material": material.name if material else None,
                "use_nodes": bool(material.use_nodes) if material else None,
            }
        )
    return result


def modifier_manifest(obj):
    return [
        {
            "index": index,
            "name": modifier.name,
            "type": modifier.type,
            "target": modifier.object.name if getattr(modifier, "object", None) else None,
            "show_viewport": bool(modifier.show_viewport),
            "show_render": bool(modifier.show_render),
        }
        for index, modifier in enumerate(obj.modifiers)
    ]


def bone_manifest(armature):
    return [
        {
            "name": bone.name,
            "parent": bone.parent.name if bone.parent else None,
            "head_local": vector(bone.head_local),
            "tail_local": vector(bone.tail_local),
            "matrix_local": matrix(bone.matrix_local),
            "use_connect": bool(bone.use_connect),
            "use_deform": bool(bone.use_deform),
            "inherit_scale": bone.inherit_scale,
        }
        for bone in armature.data.bones
    ]


def action_manifest():
    result = []
    for action in sorted(bpy.data.actions, key=lambda item: item.name):
        frame_range = [rounded(action.frame_range[0]), rounded(action.frame_range[1])]
        result.append(
            {
                "name": action.name,
                "frame_range": frame_range,
                "custom_properties": id_properties(action),
            }
        )
    return result


def build_inventory():
    blend_path = os.path.abspath(bpy.data.filepath)
    if not blend_path or not os.path.isfile(blend_path):
        raise RuntimeError("The active Blender file must be a saved source blend")

    armatures = []
    for obj in sorted((item for item in bpy.data.objects if item.type == "ARMATURE"), key=lambda item: item.name):
        bones = bone_manifest(obj)
        body_bones = [bone for bone in bones if bone["name"] in BODY_BONE_NAMES]
        hierarchy = [
            {
                "name": bone["name"],
                "parent": bone["parent"],
                "use_deform": bone["use_deform"],
            }
            for bone in body_bones
        ]
        armatures.append(
            {
                "name": obj.name,
                "data_name": obj.data.name,
                "parent": obj.parent.name if obj.parent else None,
                "matrix_world": matrix(obj.matrix_world),
                "bone_count": len(bones),
                "deform_bone_count": sum(1 for bone in bones if bone["use_deform"]),
                "body_bone_count": len(body_bones),
                "hierarchy_fingerprint": canonical_hash(hierarchy),
                "rest_pose_fingerprint": canonical_hash(body_bones),
                "all_bones_fingerprint": canonical_hash(bones),
                "bones": bones,
                "custom_properties": id_properties(obj),
            }
        )

    meshes = []
    for obj in sorted((item for item in bpy.data.objects if item.type == "MESH"), key=lambda item: item.name):
        groups = vertex_group_fingerprints(obj)
        shapes = shape_key_manifest(obj)
        attributes = mesh_attribute_manifest(obj.data)
        materials = material_manifest(obj)
        meshes.append(
            {
                "name": obj.name,
                "data_name": obj.data.name,
                "parent": obj.parent.name if obj.parent else None,
                "matrix_world": matrix(obj.matrix_world),
                "visible_render": not bool(obj.hide_render),
                "vertices": len(obj.data.vertices),
                "edges": len(obj.data.edges),
                "faces": len(obj.data.polygons),
                "geometry_fingerprint": mesh_geometry_fingerprint(obj.data),
                "vertex_groups": groups,
                "vertex_group_fingerprint": canonical_hash(groups),
                "shape_keys": shapes,
                "shape_key_fingerprint": canonical_hash(shapes),
                "attributes": attributes,
                "attribute_fingerprint": canonical_hash(attributes),
                "materials": materials,
                "material_fingerprint": canonical_hash(materials),
                "modifiers": modifier_manifest(obj),
                "custom_properties": id_properties(obj),
            }
        )

    result = {
        "schema_version": 1,
        "audit_kind": "R2_FULL_CHARACTER_READ_ONLY_INVENTORY",
        "execution_status": "COMPLETED",
        "technical_verdict": "APROVADO",
        "source_path": blend_path,
        "source_sha256": sha256_file(blend_path),
        "source_size_bytes": os.path.getsize(blend_path),
        "blender_version": bpy.app.version_string,
        "scene_names": sorted(scene.name for scene in bpy.data.scenes),
        "object_count": len(bpy.data.objects),
        "mesh_count": len(meshes),
        "armature_count": len(armatures),
        "image_count": len(bpy.data.images),
        "material_count": len(bpy.data.materials),
        "action_count": len(bpy.data.actions),
        "armatures": armatures,
        "meshes": meshes,
        "actions": action_manifest(),
        "object_names": sorted(obj.name for obj in bpy.data.objects),
        "duplicate_object_suffixes": sorted(obj.name for obj in bpy.data.objects if obj.name.endswith(".001")),
        "created_images": 0,
        "blend_saved": False,
        "failed_gates": [],
    }
    return result


BODY_BONE_NAMES = {
    "root", "pelvis", "spine_01", "spine_02", "chest", "neck", "head",
    "clavicle.L", "upper_arm.L", "forearm.L", "hand.L", "thumb_01.L", "thumb_02.L",
    "index_01.L", "index_02.L", "index_03.L", "middle_01.L", "middle_02.L", "middle_03.L",
    "ring_01.L", "ring_02.L", "ring_03.L", "pinky_01.L", "pinky_02.L", "pinky_03.L",
    "clavicle.R", "upper_arm.R", "forearm.R", "hand.R", "thumb_01.R", "thumb_02.R",
    "index_01.R", "index_02.R", "index_03.R", "middle_01.R", "middle_02.R", "middle_03.R",
    "ring_01.R", "ring_02.R", "ring_03.R", "pinky_01.R", "pinky_02.R", "pinky_03.R",
    "thigh.L", "shin.L", "foot.L", "toe.L", "thigh.R", "shin.R", "foot.R", "toe.R",
}


def main():
    output_path = arguments()
    result = build_inventory()
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    temporary_path = output_path + ".tmp"
    with open(temporary_path, "w", encoding="utf-8", newline="\n") as handle:
        json.dump(result, handle, ensure_ascii=False, indent=2, sort_keys=True)
        handle.write("\n")
    os.replace(temporary_path, output_path)
    print("R2_FULL_CHARACTER_INVENTORY=" + json.dumps({
        "ExecutionStatus": result["execution_status"],
        "TechnicalVerdict": result["technical_verdict"],
        "SourceSHA256": result["source_sha256"],
        "Armatures": result["armature_count"],
        "Bones": sum(item["bone_count"] for item in result["armatures"]),
        "Meshes": result["mesh_count"],
        "ImagesCreated": result["created_images"],
        "BlendSaved": result["blend_saved"],
    }, sort_keys=True))


try:
    main()
except Exception:
    traceback.print_exc()
    raise
