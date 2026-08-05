import bpy
import hashlib
import importlib.util
import json
import os
import sys


RIG_ROOT = r"C:\Projetos\consorcio-os\web\blender\r2-rig"
SOURCE_BLEND = os.path.join(RIG_ROOT, "r2-full-character-material-branded-ready-v1", "r2-full-character-material-branded-ready-v1.blend")
SOURCE_BLEND_SHA256 = "AD7501A2828DAA76749C6ABE367597F1645BB79C1A205E83BED265B556F52E57"
SOURCE_GLB = r"C:\Projetos\consorcio-os\web\public\models\r2\r2-full-character-material-branded-ready-v1.glb"
SOURCE_GLB_SHA256 = "1F693EBB12E36965786C426CC07AF5FD6775CADFD81542236518103C6541E6AB"
CANDIDATE_BLEND_NAME = "r2-full-character-color-readable-ready-v2.candidate.blend"
CANDIDATE_GLB_NAME = "r2-full-character-color-readable-ready-v2.candidate.glb"
BRANDING_NAMES = [
    "R2_Brand_RightChest_GorillaMark",
    "R2_Brand_LeftArm_GorillaMark_R2_Patch",
    "R2_Brand_UpperBack_GorillaMark",
]


def load_export_helpers():
    path = os.path.join(RIG_ROOT, "R2_EXPORT_MATERIAL_BRANDING_GLB.py")
    spec = importlib.util.spec_from_file_location("r2_v1_export_helpers", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def arguments():
    values = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    if len(values) != 1:
        raise RuntimeError("Usage: -- <transaction-directory>")
    return os.path.abspath(values[0])


def sha256_file(path):
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest().upper()


def atomic_json(path, payload):
    with open(path + ".tmp", "w", encoding="utf-8", newline="\n") as handle:
        json.dump(payload, handle, indent=2, sort_keys=True)
        handle.write("\n")
    os.replace(path + ".tmp", path)


def main():
    transaction = arguments()
    candidate = os.path.abspath(bpy.data.filepath)
    expected_candidate = os.path.join(transaction, CANDIDATE_BLEND_NAME)
    if candidate != expected_candidate:
        raise RuntimeError(f"Unauthorized V2 candidate path: {candidate}")
    if sha256_file(SOURCE_BLEND) != SOURCE_BLEND_SHA256 or sha256_file(SOURCE_GLB) != SOURCE_GLB_SHA256:
        raise RuntimeError("Immutable V1 source hash mismatch")
    validation_path = os.path.join(transaction, "R2_COLOR_READABILITY_V2_VALIDATION.json")
    validation = json.loads(open(validation_path, "r", encoding="utf-8").read())
    if validation.get("TechnicalVerdict") != "APROVADO" or validation.get("FailedGates") != "NONE":
        raise RuntimeError("V2 GLB export requires approved Blender validation")
    if validation.get("CandidateBlendSHA256") != sha256_file(candidate):
        raise RuntimeError("Candidate changed after validation")
    helpers = load_export_helpers()
    armature = bpy.data.objects.get("R2_Rig")
    if not armature or len(armature.data.bones) != 65:
        raise RuntimeError("Expected the approved 65-bone R2_Rig")
    helpers.reset_neutral(armature)
    bpy.ops.object.select_all(action="DESELECT")
    selected_names = []
    for obj in bpy.context.scene.objects:
        include = obj.name != "R2_Head_Face" and obj.type in {"MESH", "ARMATURE", "EMPTY"}
        obj.select_set(include)
        if include:
            selected_names.append(obj.name)
    bpy.context.view_layer.objects.active = armature
    glb_path = os.path.join(transaction, CANDIDATE_GLB_NAME)
    if os.path.exists(glb_path):
        raise RuntimeError("Controlled V2 GLB destination already exists")
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
        raise RuntimeError("V2 GLB exporter produced no artifact")
    document, parse_errors, binary_chunk_bytes = helpers.parse_glb(glb_path)
    metrics = helpers.inspect_document(document)
    failures = []
    if parse_errors:
        failures.append("GLBParseErrors")
    if metrics["external_dependencies"]:
        failures.append("ExternalDependencies")
    if metrics["missing_materials"]:
        failures.append("MissingMaterials")
    if metrics["duplicate_material_names"] or metrics["duplicate_node_names"]:
        failures.append("DuplicateIdentities")
    if metrics["branding_node_names"] != sorted(BRANDING_NAMES):
        failures.append("BrandingNodeIdentity")
    if metrics["image_count"] or metrics["texture_count"]:
        failures.append("ImageOrTextureDependencies")
    if metrics["bone_count"] != 65:
        failures.append("BoneCount")
    if metrics["animation_count"] != 9:
        failures.append("AnimationCount")
    if metrics["morph_target_count"] != 24:
        failures.append("MorphTargetCount")
    if metrics["material_count"] != 17:
        failures.append("MaterialCount")
    patch_materials = metrics["branding_material_assignments"].get("R2_Brand_LeftArm_GorillaMark_R2_Patch")
    if patch_materials != ["R2_Mat_Embroidery_Gray", "R2_Mat_Embroidery_White"]:
        failures.append("PatchMaterialContrast")
    report = {
        "schema_version": 1,
        "ExecutionStatus": "COMPLETED" if not failures else "FAILED",
        "TechnicalVerdict": "APROVADO" if not failures else "REPROVADO",
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
        "CreatedImages": metrics["image_count"],
        **metrics,
        "FailedGates": failures or "NONE",
    }
    atomic_json(os.path.join(transaction, "R2_COLOR_READABILITY_V2_EXPORT_REPORT.json"), report)
    print("R2_COLOR_READABILITY_V2_GLB_EXPORT=" + json.dumps({key: report[key] for key in (
        "ExecutionStatus", "TechnicalVerdict", "glb_sha256", "file_size_bytes", "node_count", "mesh_count",
        "primitive_count", "material_count", "texture_count", "image_count", "bone_count",
        "animation_count", "morph_target_count", "ExternalDependencies", "MissingMaterials", "FailedGates"
    )}, sort_keys=True))
    if failures:
        raise RuntimeError("V2 GLB export failed: " + ", ".join(failures))


if __name__ == "__main__":
    main()
