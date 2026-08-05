import bpy
import hashlib
import json
import os
import struct
import sys
import traceback


RIG_ROOT = r"C:\Projetos\consorcio-os\web\blender\r2-rig"
HEAD_SOURCE = os.path.join(RIG_ROOT, "r2-head-rig-expression-ready-v1", "r2-head-rig-expression-ready-v1.blend")
ANATOMICAL_SOURCE = os.path.join(RIG_ROOT, "r2-facial-ocular-oral-assets-ready-v1", "r2-facial-ocular-oral-assets-ready-v1.blend")
BODY_SOURCE = os.path.join(RIG_ROOT, "r2-rig-v13-weights-refined.blend")
HEAD_SHA = "7AE3C98EEF99AE60FF3C0470370147559B6B1CE7EE8455BAFD81D9852D8C0B97"
ANATOMICAL_SHA = "50D04CFBAEC2A431D96D4060E2AE82045AFBC56A0E74AD1759D156C0222825B3"
BODY_SHA = "392EA67AEBC3BA0FF72E65BE18F599E22A0C4C1296F2F6D365FFB989F35CF9C1"
REQUIRED_ACTIONS = [
    "R2_NEUTRAL", "R2_IDLE", "R2_WORKING", "R2_LISTENING", "R2_THINKING",
    "R2_AWAITING_ACTION", "R2_ALERT", "R2_CELEBRATING_SALE", "R2_ERROR_ATTENTION",
]


def args():
    argv = sys.argv
    if "--" not in argv:
        raise RuntimeError("Expected -- <transaction-directory>")
    values = argv[argv.index("--") + 1 :]
    if len(values) != 1:
        raise RuntimeError("Expected one transaction directory")
    return os.path.abspath(values[0])


def sha256(path):
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest().upper()


def write_json(path, value):
    temporary = path + ".tmp"
    with open(temporary, "w", encoding="utf-8", newline="\n") as handle:
        json.dump(value, handle, ensure_ascii=False, indent=2, sort_keys=True)
        handle.write("\n")
    os.replace(temporary, path)


def reset_neutral(armature):
    armature.animation_data_create()
    armature.animation_data.action = None
    for bone in armature.pose.bones:
        bone.location = (0.0, 0.0, 0.0)
        bone.rotation_mode = "XYZ"
        bone.rotation_euler = (0.0, 0.0, 0.0)
        bone.scale = (1.0, 1.0, 1.0)
    for key in armature.keys():
        if key.startswith("EXP_") or key.startswith("EYE_") or key.startswith("VISEME_"):
            armature[key] = 0.0
    for obj in bpy.data.objects:
        if obj.type == "MESH" and obj.data.shape_keys:
            for shape in obj.data.shape_keys.key_blocks:
                shape.value = 0.0
    bpy.context.scene.frame_set(1)
    bpy.context.view_layer.update()


def parse_glb(path):
    errors = []
    with open(path, "rb") as handle:
        header = handle.read(12)
        if len(header) != 12:
            raise RuntimeError("GLB header is truncated")
        magic, version, total_length = struct.unpack("<4sII", header)
        if magic != b"glTF":
            errors.append("invalid magic")
        if version != 2:
            errors.append(f"unsupported version {version}")
        actual_length = os.path.getsize(path)
        if total_length != actual_length:
            errors.append(f"header length {total_length} != file length {actual_length}")
        chunks = []
        while handle.tell() < actual_length:
            chunk_header = handle.read(8)
            if len(chunk_header) != 8:
                errors.append("truncated chunk header")
                break
            chunk_length, chunk_type = struct.unpack("<I4s", chunk_header)
            data = handle.read(chunk_length)
            if len(data) != chunk_length:
                errors.append("truncated chunk")
                break
            chunks.append((chunk_type, data))
    json_chunks = [data for chunk_type, data in chunks if chunk_type == b"JSON"]
    binary_chunks = [data for chunk_type, data in chunks if chunk_type == b"BIN\x00"]
    if len(json_chunks) != 1:
        errors.append(f"expected one JSON chunk, found {len(json_chunks)}")
    if len(binary_chunks) != 1:
        errors.append(f"expected one BIN chunk, found {len(binary_chunks)}")
    document = json.loads(json_chunks[0].decode("utf-8").rstrip(" \t\r\n\x00")) if json_chunks else {}
    return document, errors, len(binary_chunks[0]) if binary_chunks else 0


def inspect_document(document):
    nodes = document.get("nodes", [])
    meshes = document.get("meshes", [])
    materials = document.get("materials", [])
    skins = document.get("skins", [])
    animations = document.get("animations", [])
    accessors = document.get("accessors", [])
    buffer_views = document.get("bufferViews", [])
    buffers = document.get("buffers", [])
    images = document.get("images", [])
    textures = document.get("textures", [])

    node_names = [node.get("name") for node in nodes if node.get("name")]
    duplicates = sorted({name for name in node_names if node_names.count(name) > 1})
    animation_names = [animation.get("name") for animation in animations]
    animation_duplicates = sorted({name for name in animation_names if name and animation_names.count(name) > 1})
    joint_indices = [joint for skin in skins for joint in skin.get("joints", [])]
    joint_names = [nodes[index].get("name") for index in joint_indices if 0 <= index < len(nodes)]
    duplicate_bones = sorted({name for name in joint_names if name and joint_names.count(name) > 1})

    primitive_count = sum(len(mesh.get("primitives", [])) for mesh in meshes)
    morph_target_count = 0
    morph_target_names = []
    for mesh in meshes:
        target_names = mesh.get("extras", {}).get("targetNames", [])
        morph_target_names.extend(target_names)
        for primitive in mesh.get("primitives", []):
            morph_target_count += len(primitive.get("targets", []))

    external_dependencies = 0
    external_uris = []
    for buffer in buffers:
        uri = buffer.get("uri")
        if uri:
            external_dependencies += 1
            external_uris.append(uri)
    for image in images:
        uri = image.get("uri")
        if uri:
            external_dependencies += 1
            external_uris.append(uri)

    missing_buffers = 0
    for view in buffer_views:
        index = view.get("buffer", 0)
        if index < 0 or index >= len(buffers):
            missing_buffers += 1
    missing_images = 0
    for texture in textures:
        source = texture.get("source")
        if source is not None and (source < 0 or source >= len(images)):
            missing_images += 1

    bounds_min = [float("inf"), float("inf"), float("inf")]
    bounds_max = [float("-inf"), float("-inf"), float("-inf")]
    for mesh in meshes:
        for primitive in mesh.get("primitives", []):
            position_index = primitive.get("attributes", {}).get("POSITION")
            if position_index is None or position_index >= len(accessors):
                continue
            accessor = accessors[position_index]
            minimum = accessor.get("min")
            maximum = accessor.get("max")
            if not minimum or not maximum or len(minimum) < 3 or len(maximum) < 3:
                continue
            for axis in range(3):
                bounds_min[axis] = min(bounds_min[axis], float(minimum[axis]))
                bounds_max[axis] = max(bounds_max[axis], float(maximum[axis]))
    if any(value == float("inf") for value in bounds_min):
        bounds_min = None
        bounds_max = None

    return {
        "node_count": len(nodes),
        "mesh_count": len(meshes),
        "primitive_count": primitive_count,
        "material_count": len(materials),
        "skin_count": len(skins),
        "bone_count": len(set(joint_indices)),
        "joint_names": joint_names,
        "morph_target_count": morph_target_count,
        "morph_target_names": sorted(set(morph_target_names)),
        "animation_count": len(animations),
        "animation_names": animation_names,
        "duplicate_node_names": duplicates,
        "duplicate_bone_names": duplicate_bones,
        "duplicate_animation_names": animation_duplicates,
        "external_dependencies": external_dependencies,
        "external_uris": external_uris,
        "missing_buffers": missing_buffers,
        "missing_images": missing_images,
        "image_count": len(images),
        "texture_count": len(textures),
        "bounds": {"minimum": bounds_min, "maximum": bounds_max},
    }


def main():
    transaction = args()
    candidate = os.path.abspath(bpy.data.filepath)
    if not os.path.normcase(candidate).startswith(os.path.normcase(transaction + os.sep)):
        raise RuntimeError("Candidate is outside the transaction")
    for path, expected in ((HEAD_SOURCE, HEAD_SHA), (ANATOMICAL_SOURCE, ANATOMICAL_SHA), (BODY_SOURCE, BODY_SHA)):
        if sha256(path) != expected:
            raise RuntimeError(f"Immutable source mismatch: {path}")

    armatures = [obj for obj in bpy.data.objects if obj.type == "ARMATURE"]
    if len(armatures) != 1 or armatures[0].name != "R2_Rig" or len(armatures[0].data.bones) != 65:
        raise RuntimeError("Expected one 65-bone R2_Rig")
    armature = armatures[0]
    missing_actions = sorted(set(REQUIRED_ACTIONS) - set(bpy.data.actions.keys()))
    unexpected_actions = sorted(set(bpy.data.actions.keys()) - set(REQUIRED_ACTIONS))
    if missing_actions or unexpected_actions:
        raise RuntimeError(f"Action identity mismatch missing={missing_actions} unexpected={unexpected_actions}")

    reset_neutral(armature)
    bpy.ops.object.select_all(action="DESELECT")
    selected_names = []
    for obj in bpy.context.scene.objects:
        include = obj.name != "R2_Head_Face" and obj.type in {"MESH", "ARMATURE", "EMPTY"}
        obj.select_set(include)
        if include:
            selected_names.append(obj.name)
    bpy.context.view_layer.objects.active = armature

    glb_path = os.path.join(transaction, "r2-full-character-runtime-ready-v1.candidate.glb")
    if os.path.exists(glb_path):
        os.remove(glb_path)
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
    if metrics["external_dependencies"] != 0:
        failed_gates.append("ExternalDependencies")
    if metrics["missing_buffers"] != 0:
        failed_gates.append("MissingBuffers")
    if metrics["missing_images"] != 0:
        failed_gates.append("MissingImages")
    if metrics["duplicate_node_names"]:
        failed_gates.append("DuplicateNodeNames")
    if metrics["duplicate_bone_names"]:
        failed_gates.append("DuplicateBoneNames")
    if metrics["duplicate_animation_names"]:
        failed_gates.append("DuplicateAnimationNames")
    if sorted(metrics["animation_names"]) != sorted(REQUIRED_ACTIONS):
        failed_gates.append("RequiredAnimations")
    if metrics["bone_count"] != 65:
        failed_gates.append("RequiredBones")
    required_morphs = {
        "EXP_BLINK", "EXP_BROW_RAISE", "EXP_BROW_FROWN", "EXP_CHEEK_RAISE", "EXP_MUZZLE",
        "EXP_LIPS_CLOSED", "EXP_SMILE", "EXP_FROWN", "EXP_MOUTH_NARROW", "EXP_MOUTH_WIDE",
        "EXP_MOUTH_O", "EXP_MOUTH_E", "EXP_VISEME_FV", "EXP_VISEME_L",
    }
    if not required_morphs.issubset(set(metrics["morph_target_names"])):
        failed_gates.append("RequiredMorphTargets")

    report = {
        "schema_version": 1,
        "audit_kind": "R2_FULL_CHARACTER_OFFICIAL_GLB_EXPORT",
        "execution_status": "COMPLETED" if not failed_gates else "FAILED",
        "technical_verdict": "APROVADO" if not failed_gates else "REPROVADO",
        "candidate_blend": candidate,
        "candidate_blend_sha256": sha256(candidate),
        "glb_candidate_path": glb_path,
        "glb_sha256": sha256(glb_path),
        "file_size_bytes": os.path.getsize(glb_path),
        "binary_chunk_bytes": binary_chunk_bytes,
        "selected_objects": sorted(selected_names),
        "excluded_objects": ["R2_Head_Face"],
        "export_settings": export_settings,
        "metrics": metrics,
        "glb_parse_errors": parse_errors,
        "official_sources_unchanged": True,
        "created_images": 0,
        "failed_gates": failed_gates,
    }
    write_json(os.path.join(transaction, "R2_FULL_CHARACTER_GLB_EXPORT_REPORT.json.tmp"), report)
    print("R2_FULL_CHARACTER_GLB_EXPORT=" + json.dumps({
        "ExecutionStatus": report["execution_status"],
        "TechnicalVerdict": report["technical_verdict"],
        "GLB": glb_path,
        "GLBSHA256": report["glb_sha256"],
        "FileSizeBytes": report["file_size_bytes"],
        "NodeCount": metrics["node_count"],
        "MeshCount": metrics["mesh_count"],
        "PrimitiveCount": metrics["primitive_count"],
        "MaterialCount": metrics["material_count"],
        "BoneCount": metrics["bone_count"],
        "SkinCount": metrics["skin_count"],
        "MorphTargetCount": metrics["morph_target_count"],
        "AnimationCount": metrics["animation_count"],
        "ExternalDependencies": metrics["external_dependencies"],
        "MissingBuffers": metrics["missing_buffers"],
        "MissingImages": metrics["missing_images"],
        "DuplicateNodeNames": len(metrics["duplicate_node_names"]),
        "DuplicateBoneNames": len(metrics["duplicate_bone_names"]),
        "GLBParseErrors": len(parse_errors),
        "FailedGates": failed_gates,
        "CreatedImages": 0,
    }, sort_keys=True))
    if failed_gates:
        raise RuntimeError("GLB export gates failed: " + ", ".join(failed_gates))


try:
    main()
except Exception:
    traceback.print_exc()
    raise
