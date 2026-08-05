import bpy
import hashlib
import json
import os
import struct
import sys
from collections import Counter


RIG_ROOT = r"C:\Projetos\consorcio-os\web\blender\r2-rig"
OFFICIAL_BLEND = os.path.join(RIG_ROOT, "r2-full-character-runtime-ready-v1", "r2-full-character-runtime-ready-v1.blend")
OFFICIAL_BLEND_SHA = "3D60D28B852566ABEC764D2DE0EB55D63F42AC26F8F75936109D33898B25E269"
OFFICIAL_GLB = r"C:\Projetos\consorcio-os\web\public\models\r2\r2-full-character-runtime-ready-v1.glb"
OFFICIAL_GLB_SHA = "E3B9702C0367A8CAFB138B5C9AB94D6CC448C470CD69D74A46333A9953207A59"
BRANDING_NAMES = [
    "R2_Brand_RightChest_GorillaMark",
    "R2_Brand_LeftArm_GorillaMark_R2_Patch",
    "R2_Brand_UpperBack_GorillaMark",
]


def arguments():
    argv = sys.argv
    if "--" not in argv:
        raise RuntimeError("Expected -- <transaction-directory>")
    values = argv[argv.index("--") + 1 :]
    if len(values) != 1:
        raise RuntimeError("Expected exactly one transaction directory")
    return os.path.abspath(values[0])


def sha256_file(path):
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest().upper()


def atomic_json(path, value):
    temporary = path + ".tmp"
    with open(temporary, "w", encoding="utf-8", newline="\n") as handle:
        json.dump(value, handle, ensure_ascii=False, indent=2, sort_keys=True)
        handle.write("\n")
    os.replace(temporary, path)


def reset_neutral(armature):
    if armature.animation_data:
        armature.animation_data.action = None
    for bone in armature.pose.bones:
        bone.location = (0.0, 0.0, 0.0)
        bone.rotation_mode = "QUATERNION"
        bone.rotation_quaternion = (1.0, 0.0, 0.0, 0.0)
        bone.scale = (1.0, 1.0, 1.0)
    for obj in bpy.data.objects:
        if obj.type == "MESH" and obj.data.shape_keys:
            for key in obj.data.shape_keys.key_blocks:
                if key.name != "Basis":
                    key.value = 0.0
    bpy.context.scene.frame_set(1)
    bpy.context.view_layer.update()


def parse_glb(path):
    errors = []
    with open(path, "rb") as handle:
        data = handle.read()
    if len(data) < 20:
        return {}, ["file too short"], 0
    magic, version, declared_length = struct.unpack_from("<4sII", data, 0)
    if magic != b"glTF":
        errors.append("invalid magic")
    if version != 2:
        errors.append(f"unexpected version {version}")
    if declared_length != len(data):
        errors.append(f"declared length {declared_length} != actual {len(data)}")
    offset = 12
    document = None
    binary_bytes = 0
    while offset + 8 <= len(data):
        chunk_length, chunk_type = struct.unpack_from("<II", data, offset)
        offset += 8
        chunk = data[offset : offset + chunk_length]
        offset += chunk_length
        if len(chunk) != chunk_length:
            errors.append("truncated chunk")
            break
        if chunk_type == 0x4E4F534A:
            try:
                document = json.loads(chunk.rstrip(b" \t\r\n\x00").decode("utf-8"))
            except Exception as error:
                errors.append(f"json parse: {error}")
        elif chunk_type == 0x004E4942:
            binary_bytes += chunk_length
    if document is None:
        errors.append("missing JSON chunk")
        document = {}
    return document, errors, binary_bytes


def inspect_document(document):
    nodes = document.get("nodes", [])
    meshes = document.get("meshes", [])
    materials = document.get("materials", [])
    skins = document.get("skins", [])
    animations = document.get("animations", [])
    images = document.get("images", [])
    textures = document.get("textures", [])
    node_names = [node.get("name") for node in nodes if node.get("name")]
    material_names = [material.get("name") for material in materials if material.get("name")]
    duplicate_nodes = sorted(name for name, count in Counter(node_names).items() if count > 1)
    duplicate_materials = sorted(name for name, count in Counter(material_names).items() if count > 1)
    primitives = [(mesh_index, primitive_index, primitive) for mesh_index, mesh in enumerate(meshes) for primitive_index, primitive in enumerate(mesh.get("primitives", []))]
    missing_materials = [(mesh_index, primitive_index) for mesh_index, primitive_index, primitive in primitives if "material" not in primitive]
    external_uris = []
    for buffer in document.get("buffers", []):
        uri = buffer.get("uri")
        if uri and not uri.startswith("data:"):
            external_uris.append(uri)
    for image in images:
        uri = image.get("uri")
        if uri and not uri.startswith("data:"):
            external_uris.append(uri)
    branding_nodes = sorted(name for name in node_names if name.startswith("R2_Brand_"))
    branding_material_assignments = {}
    for node in nodes:
        name = node.get("name")
        if name not in BRANDING_NAMES or "mesh" not in node:
            continue
        mesh = meshes[node["mesh"]]
        branding_material_assignments[name] = [
            materials[primitive["material"]].get("name") if "material" in primitive else None
            for primitive in mesh.get("primitives", [])
        ]
    morph_names = set()
    morph_target_count = 0
    for mesh in meshes:
        extras = mesh.get("extras", {})
        target_names = extras.get("targetNames", [])
        morph_target_count += len(target_names)
        for name in target_names:
            morph_names.add(name)
    bounds_min = [float("inf")] * 3
    bounds_max = [float("-inf")] * 3
    accessors = document.get("accessors", [])
    for _mesh_index, _primitive_index, primitive in primitives:
        position_index = primitive.get("attributes", {}).get("POSITION")
        if position_index is None:
            continue
        accessor = accessors[position_index]
        if "min" in accessor and "max" in accessor:
            for axis in range(3):
                bounds_min[axis] = min(bounds_min[axis], accessor["min"][axis])
                bounds_max[axis] = max(bounds_max[axis], accessor["max"][axis])
    material_assignments = {}
    for node in nodes:
        if "mesh" not in node or not node.get("name"):
            continue
        mesh = meshes[node["mesh"]]
        material_assignments[node["name"]] = [
            materials[primitive["material"]].get("name") if "material" in primitive else None
            for primitive in mesh.get("primitives", [])
        ]
    return {
        "node_count": len(nodes),
        "node_names": node_names,
        "duplicate_node_names": duplicate_nodes,
        "mesh_count": len(meshes),
        "primitive_count": len(primitives),
        "material_count": len(materials),
        "material_names": material_names,
        "duplicate_material_names": duplicate_materials,
        "missing_materials": missing_materials,
        "texture_count": len(textures),
        "image_count": len(images),
        "skin_count": len(skins),
        "bone_count": max((len(skin.get("joints", [])) for skin in skins), default=0),
        "animation_count": len(animations),
        "animation_names": [animation.get("name") for animation in animations],
        "morph_target_count": morph_target_count,
        "morph_target_names": sorted(morph_names),
        "external_dependencies": len(external_uris),
        "external_uris": external_uris,
        "branding_node_names": branding_nodes,
        "branding_material_assignments": branding_material_assignments,
        "material_assignments": material_assignments,
        "bounds": {"minimum": bounds_min, "maximum": bounds_max},
    }


def main():
    transaction = arguments()
    candidate = os.path.abspath(bpy.data.filepath)
    if not candidate.startswith(transaction + os.sep) or os.path.basename(candidate) != "r2-full-character-material-branded-ready-v1.candidate.blend":
        raise RuntimeError("Unauthorized candidate path")
    if sha256_file(OFFICIAL_BLEND) != OFFICIAL_BLEND_SHA or sha256_file(OFFICIAL_GLB) != OFFICIAL_GLB_SHA:
        raise RuntimeError("Immutable official source mismatch")
    validation = json.loads(open(os.path.join(RIG_ROOT, "R2_MATERIAL_BRANDING_TEST_RESULTS.json"), "r", encoding="utf-8").read())
    if validation.get("TechnicalVerdict") != "APROVADO" or validation.get("FailedGates") != "NONE":
        raise RuntimeError("Controlled export requires an approved Blender validation")
    armature = bpy.data.objects.get("R2_Rig")
    if not armature or len(armature.data.bones) != 65:
        raise RuntimeError("Expected one 65-bone R2_Rig")
    reset_neutral(armature)
    bpy.ops.object.select_all(action="DESELECT")
    selected_names = []
    for obj in bpy.context.scene.objects:
        include = obj.name != "R2_Head_Face" and obj.type in {"MESH", "ARMATURE", "EMPTY"}
        obj.select_set(include)
        if include:
            selected_names.append(obj.name)
    bpy.context.view_layer.objects.active = armature
    glb_path = os.path.join(transaction, "r2-full-character-material-branded-ready-v1.candidate.glb")
    if os.path.exists(glb_path):
        raise RuntimeError("Controlled export destination already exists")
    export_settings = {
        "export_format": "GLB",
        "use_selection": True,
        "use_visible": False,
        "use_renderable": False,
        "export_apply": False,
        "export_yup": True,
        "export_skins": True,
        "export_all_influences": False,
        "export_def_bones": False,
        "export_morph": True,
        "export_morph_normal": False,
        "export_morph_tangent": False,
        "export_morph_animation": False,
        "export_materials": "EXPORT",
        "export_image_format": "NONE",
        "export_animations": True,
        "export_animation_mode": "ACTIONS",
        "export_nla_strips": False,
        "export_extra_animations": False,
        "export_force_sampling": True,
        "export_sampling_interpolation_fallback": "LINEAR",
        "export_optimize_animation_size": False,
        "export_anim_single_armature": True,
        "export_anim_scene_split_object": False,
        "export_frame_range": True,
        "export_frame_step": 1,
        "export_extras": True,
        "export_cameras": False,
        "export_lights": False,
        "export_draco_mesh_compression_enable": False,
        "use_mesh_edges": False,
        "use_mesh_vertices": False,
        "check_existing": False,
    }
    bpy.ops.export_scene.gltf(filepath=glb_path, **export_settings)
    if not os.path.isfile(glb_path) or os.path.getsize(glb_path) == 0:
        raise RuntimeError("GLB exporter produced no artifact")
    document, parse_errors, binary_chunk_bytes = parse_glb(glb_path)
    metrics = inspect_document(document)
    failed_gates = []
    if parse_errors:
        failed_gates.append("GLBParseErrors")
    if metrics["external_dependencies"]:
        failed_gates.append("ExternalDependencies")
    if metrics["missing_materials"]:
        failed_gates.append("MissingMaterials")
    if metrics["duplicate_material_names"]:
        failed_gates.append("DuplicateMaterialNames")
    if metrics["duplicate_node_names"]:
        failed_gates.append("DuplicateNodeNames")
    if metrics["branding_node_names"] != sorted(BRANDING_NAMES):
        failed_gates.append("BrandingNodeIdentity")
    if metrics["image_count"] or metrics["texture_count"]:
        failed_gates.append("CreatedImages")
    if metrics["bone_count"] != 65:
        failed_gates.append("BoneCount")
    if metrics["animation_count"] != 9:
        failed_gates.append("AnimationCount")
    if metrics["morph_target_count"] != 24:
        failed_gates.append("MorphTargetCount")
    if metrics["material_count"] != 17:
        failed_gates.append("MaterialCount")
    report = {
        "schema_version": 1,
        "ExecutionStatus": "COMPLETED" if not failed_gates else "FAILED",
        "TechnicalVerdict": "APROVADO" if not failed_gates else "REPROVADO",
        "candidate_blend": candidate,
        "candidate_blend_sha256": sha256_file(candidate),
        "glb_candidate_path": glb_path,
        "glb_sha256": sha256_file(glb_path),
        "file_size_bytes": os.path.getsize(glb_path),
        "binary_chunk_bytes": binary_chunk_bytes,
        "selected_objects": selected_names,
        "export_settings": export_settings,
        "GLBParseErrors": parse_errors,
        "ExternalDependencies": metrics["external_dependencies"],
        "MissingMaterials": len(metrics["missing_materials"]),
        "RenderableMeshesWithoutMaterial": len(metrics["missing_materials"]),
        "DuplicateMaterialNames": len(metrics["duplicate_material_names"]),
        "DuplicateBrandingNodes": len(metrics["branding_node_names"]) - len(set(metrics["branding_node_names"])),
        "CreatedImages": metrics["image_count"],
        **metrics,
        "FailedGates": failed_gates or "NONE",
    }
    atomic_json(os.path.join(RIG_ROOT, "R2_MATERIAL_BRANDING_EXPORT_REPORT.json"), report)
    atomic_json(os.path.join(transaction, "R2_MATERIAL_BRANDING_EXPORT_REPORT.json"), report)
    certificate_path = os.path.join(RIG_ROOT, "R2_BRANDING_ASSET_CERTIFICATE.json")
    certificate = json.loads(open(certificate_path, "r", encoding="utf-8").read())
    certificate["glb_candidate"] = {"path": glb_path, "sha256": report["glb_sha256"], "branding_node_names": metrics["branding_node_names"], "branding_material_assignments": metrics["branding_material_assignments"]}
    atomic_json(certificate_path, certificate)
    print("R2_MATERIAL_BRANDING_GLB_EXPORT=" + json.dumps({key: report[key] for key in (
        "ExecutionStatus", "TechnicalVerdict", "glb_sha256", "file_size_bytes", "node_count", "mesh_count",
        "primitive_count", "material_count", "texture_count", "image_count", "bone_count", "animation_count",
        "morph_target_count", "ExternalDependencies", "MissingMaterials", "FailedGates"
    )}, sort_keys=True))
    if failed_gates:
        raise RuntimeError("Controlled GLB export failed: " + ", ".join(failed_gates))


if __name__ == "__main__":
    main()
