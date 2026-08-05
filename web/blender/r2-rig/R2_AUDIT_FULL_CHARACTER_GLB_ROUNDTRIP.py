import bpy
import hashlib
import json
import math
import os
import sys
import time
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
REQUIRED_OBJECTS = [
    "R2_Rig", "R2_Head_Face_Foundation", "R2_Head_Fur", "R2_Hood", "R2_Hoodie_Torso",
    "R2_Pants", "R2_Hand_L", "R2_Hand_R", "R2_Shoe_L", "R2_Shoe_R",
    "R2_Eye.L", "R2_Eye.R", "R2_EyePivot.L", "R2_EyePivot.R", "R2_JawDriver",
    "R2_LipUpper", "R2_LipLower", "R2_MouthInterior", "R2_TeethUpper", "R2_TeethLower", "R2_Tongue",
]
REQUIRED_MORPHS = {
    "EXP_BLINK", "EXP_BROW_RAISE", "EXP_BROW_FROWN", "EXP_CHEEK_RAISE", "EXP_MUZZLE",
    "EXP_LIPS_CLOSED", "EXP_SMILE", "EXP_FROWN", "EXP_MOUTH_NARROW", "EXP_MOUTH_WIDE",
    "EXP_MOUTH_O", "EXP_MOUTH_E", "EXP_VISEME_FV", "EXP_VISEME_L",
}


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


def glb_animation_audit(path):
    import struct
    with open(path, "rb") as handle:
        magic, version, total_length = struct.unpack("<4sII", handle.read(12))
        if magic != b"glTF" or version != 2 or total_length != os.path.getsize(path):
            raise RuntimeError("Invalid GLB header during round-trip animation audit")
        chunks = {}
        while handle.tell() < total_length:
            length, chunk_type = struct.unpack("<I4s", handle.read(8))
            chunks[chunk_type] = handle.read(length)
    document = json.loads(chunks[b"JSON"].decode("utf-8").rstrip(" \t\r\n\x00"))
    binary = chunks[b"BIN\x00"]
    accessors = document.get("accessors", [])
    views = document.get("bufferViews", [])
    component_sizes = {5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4}
    component_counts = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4, "MAT2": 4, "MAT3": 9, "MAT4": 16}

    def element_bytes(accessor_index, element_index):
        accessor = accessors[accessor_index]
        view = views[accessor["bufferView"]]
        element_size = component_sizes[accessor["componentType"]] * component_counts[accessor["type"]]
        stride = view.get("byteStride", element_size)
        start = view.get("byteOffset", 0) + accessor.get("byteOffset", 0) + element_index * stride
        return binary[start : start + element_size]

    results = {}
    failures = []
    for animation in document.get("animations", []):
        name = animation.get("name")
        sampler_results = []
        duration = 0.0
        animation_exact = True
        for sampler_index, sampler in enumerate(animation.get("samplers", [])):
            input_accessor = accessors[sampler["input"]]
            output_accessor = accessors[sampler["output"]]
            count = int(output_accessor.get("count", 0))
            exact = count > 0 and element_bytes(sampler["output"], 0) == element_bytes(sampler["output"], count - 1)
            animation_exact = animation_exact and exact
            if input_accessor.get("max"):
                duration = max(duration, float(input_accessor["max"][0]))
            sampler_results.append({"sampler": sampler_index, "sample_count": count, "first_last_bytes_exact": exact})
        if not animation_exact:
            failures.append(name)
        results[name] = {"duration_seconds": duration, "first_last_samples_exact": animation_exact, "samplers": sampler_results}
    return results, failures


def canonical_body_hierarchy(armature):
    return [
        {"name": bone.name, "parent": bone.parent.name if bone.parent else None, "use_deform": bool(bone.use_deform)}
        for bone in armature.data.bones
    ]


def neutral_reset(armature):
    armature.animation_data_create()
    armature.animation_data.action = None
    for bone in armature.pose.bones:
        bone.location = (0.0, 0.0, 0.0)
        bone.rotation_mode = "XYZ"
        bone.rotation_euler = (0.0, 0.0, 0.0)
        bone.scale = (1.0, 1.0, 1.0)
    for obj in bpy.data.objects:
        if obj.type == "MESH" and obj.data.shape_keys:
            for key in obj.data.shape_keys.key_blocks:
                key.value = 0.0
    bpy.context.scene.frame_set(1)
    bpy.context.view_layer.update()


def neutral_exact(armature):
    tolerance = 1.0e-8
    bones = all(
        bone.location.length <= tolerance
        and bone.rotation_euler.to_matrix().to_3x3().is_identity
        and all(abs(float(value) - 1.0) <= tolerance for value in bone.scale)
        for bone in armature.pose.bones
    )
    morphs = all(
        abs(float(key.value)) <= tolerance
        for obj in bpy.data.objects if obj.type == "MESH" and obj.data.shape_keys
        for key in obj.data.shape_keys.key_blocks if key.name != "Basis"
    )
    return bones and morphs


def finite_scene():
    return all(
        math.isfinite(float(value))
        for obj in bpy.data.objects
        for row in obj.matrix_world
        for value in row
    )


def mesh_summary():
    result = {}
    for obj in sorted((item for item in bpy.data.objects if item.type == "MESH"), key=lambda item: item.name):
        morphs = []
        if obj.data.shape_keys:
            morphs = [key.name for key in obj.data.shape_keys.key_blocks if key.name != "Basis"]
        result[obj.name] = {
            "vertices": len(obj.data.vertices),
            "edges": len(obj.data.edges),
            "faces": len(obj.data.polygons),
            "materials": [slot.material.name if slot.material else None for slot in obj.material_slots],
            "morph_targets": morphs,
            "parent": obj.parent.name if obj.parent else None,
            "armature_modifiers": [modifier.object.name if modifier.object else None for modifier in obj.modifiers if modifier.type == "ARMATURE"],
        }
    return result


def action_tests(armature):
    results = {}
    failures = []
    for action_name in REQUIRED_ACTIONS:
        action = bpy.data.actions.get(action_name)
        if not action:
            failures.append(f"missing:{action_name}")
            continue
        armature.animation_data.action = action
        first, last = (float(value) for value in action.frame_range)
        first_integer = int(math.floor(first))
        last_integer = int(math.floor(last))
        bpy.context.scene.frame_set(first_integer, subframe=first - first_integer)
        bpy.context.view_layer.update()
        first_pose = {bone.name: [[float(value) for value in row] for row in bone.matrix] for bone in armature.pose.bones}
        bpy.context.scene.frame_set(last_integer, subframe=last - last_integer)
        bpy.context.view_layer.update()
        last_pose = {bone.name: [[float(value) for value in row] for row in bone.matrix] for bone in armature.pose.bones}
        maximum_delta = max(
            abs(first_pose[bone][row][column] - last_pose[bone][row][column])
            for bone in first_pose for row in range(4) for column in range(4)
        )
        continuity = maximum_delta <= 1.0e-5
        finite = finite_scene()
        passed = continuity and finite
        if not passed:
            failures.append(action_name)
        results[action_name] = {
            "frame_range": [first, last],
            "duration_seconds_at_import_fps": (last - first) / bpy.context.scene.render.fps,
            "first_last_continuity": continuity,
            "maximum_matrix_delta": maximum_delta,
            "continuity_tolerance": 1.0e-5,
            "finite_transforms": finite,
            "passed": passed,
        }
    neutral_reset(armature)
    return results, failures


def morph_tests():
    results = {}
    failures = []
    for obj in bpy.data.objects:
        if obj.type != "MESH" or not obj.data.shape_keys:
            continue
        for key in obj.data.shape_keys.key_blocks:
            if key.name == "Basis":
                continue
            samples = []
            for level in (0.0, 0.25, 0.5, 0.75, 1.0):
                key.value = level
                bpy.context.view_layer.update()
                observed = float(key.value)
                samples.append(observed)
                key.value = 0.0
            passed = samples == [0.0, 0.25, 0.5, 0.75, 1.0]
            name = f"{obj.name}:{key.name}"
            results[name] = {"samples": samples, "passed": passed}
            if not passed:
                failures.append(name)
    return results, failures


def world_bounds():
    minimum = [float("inf")] * 3
    maximum = [float("-inf")] * 3
    for obj in bpy.data.objects:
        if obj.type != "MESH":
            continue
        for corner in obj.bound_box:
            world = obj.matrix_world @ __import__("mathutils").Vector(corner)
            for axis in range(3):
                minimum[axis] = min(minimum[axis], float(world[axis]))
                maximum[axis] = max(maximum[axis], float(world[axis]))
    return {"minimum": minimum, "maximum": maximum}


def main():
    transaction = args()
    glb_path = os.path.join(transaction, "r2-full-character-runtime-ready-v1.candidate.glb")
    export_report_path = os.path.join(transaction, "R2_FULL_CHARACTER_GLB_EXPORT_REPORT.json.tmp")
    export_report = json.loads(open(export_report_path, "r", encoding="utf-8").read())
    if sha256(glb_path) != export_report["glb_sha256"]:
        raise RuntimeError("GLB hash differs from the export report")
    for path, expected in ((HEAD_SOURCE, HEAD_SHA), (ANATOMICAL_SOURCE, ANATOMICAL_SHA), (BODY_SOURCE, BODY_SHA)):
        if sha256(path) != expected:
            raise RuntimeError(f"Immutable source mismatch: {path}")

    bpy.ops.wm.read_factory_settings(use_empty=True)
    started = time.perf_counter()
    bpy.ops.import_scene.gltf(filepath=glb_path)
    import_seconds = time.perf_counter() - started

    armatures = [obj for obj in bpy.data.objects if obj.type == "ARMATURE"]
    missing_objects = sorted(set(REQUIRED_OBJECTS) - set(bpy.data.objects.keys()))
    unexpected_historical = bpy.data.objects.get("R2_Head_Face") is not None
    failed_gates = []
    if len(armatures) != 1 or armatures[0].name != "R2_Rig":
        failed_gates.append("SingleArmatureRoundTrip")
        armature = armatures[0] if armatures else None
    else:
        armature = armatures[0]
    if missing_objects:
        failed_gates.append("RequiredObjectsRoundTrip")
    if unexpected_historical:
        failed_gates.append("HiddenHistoricalMeshExcluded")

    source_bone_map = json.loads(open(os.path.join(RIG_ROOT, "R2_FULL_CHARACTER_BONE_MAP.json"), "r", encoding="utf-8").read())
    skeleton_exact = False
    hierarchy_failures = []
    if armature:
        bone_names = [bone.name for bone in armature.data.bones]
        expected_names = source_bone_map["body_bones"] + source_bone_map["facial_bones"]
        hierarchy = canonical_body_hierarchy(armature)
        by_name = {item["name"]: item for item in hierarchy}
        missing_bones = sorted(set(expected_names) - set(bone_names))
        duplicate_bones = sorted({name for name in bone_names if bone_names.count(name) > 1})
        for expected in ("root", "pelvis", "spine_01", "spine_02", "chest", "neck", "head"):
            if expected not in by_name:
                hierarchy_failures.append(f"missing:{expected}")
        expected_parents = {"pelvis": "root", "spine_01": "pelvis", "spine_02": "spine_01", "chest": "spine_02", "neck": "chest", "head": "neck", "CTRL-face-root": "head", "DEF-face-jaw": "head"}
        for child, parent in expected_parents.items():
            if by_name.get(child, {}).get("parent") != parent:
                hierarchy_failures.append(f"{child}->{parent}")
        skeleton_exact = len(bone_names) == 65 and not missing_bones and not duplicate_bones and not hierarchy_failures
    else:
        bone_names, missing_bones, duplicate_bones, hierarchy = [], [], [], []
    if not skeleton_exact:
        failed_gates.append("SkeletonRoundTripExact")

    actions = sorted(bpy.data.actions.keys())
    action_results, action_failures = action_tests(armature) if armature else ({}, ["no armature"])
    glb_animation_results, glb_animation_failures = glb_animation_audit(glb_path)
    action_exact = actions == sorted(REQUIRED_ACTIONS) and not action_failures and not glb_animation_failures
    if not action_exact:
        failed_gates.append("AnimationClipsRoundTripConfirmed")

    meshes = mesh_summary()
    morph_names = sorted({name for record in meshes.values() for name in record["morph_targets"]})
    morph_count = sum(len(record["morph_targets"]) for record in meshes.values())
    morph_results, morph_failures = morph_tests()
    morph_exact = morph_count == 24 and REQUIRED_MORPHS.issubset(set(morph_names)) and not morph_failures
    if not morph_exact:
        failed_gates.append("MorphTargetsRoundTripConfirmed")

    if armature:
        neutral_reset(armature)
    reset_exact = bool(armature) and neutral_exact(armature)
    if not reset_exact:
        failed_gates.append("NeutralResetExact")
    if len(bpy.data.images) != 0:
        failed_gates.append("CreatedImages")

    report = {
        "schema_version": 1,
        "audit_kind": "R2_FULL_CHARACTER_GLB_ROUND_TRIP_AUDIT",
        "execution_status": "COMPLETED" if not failed_gates else "FAILED",
        "technical_verdict": "APROVADO" if not failed_gates else "REPROVADO",
        "glb": glb_path,
        "glb_sha256": export_report["glb_sha256"],
        "import_seconds": import_seconds,
        "object_count": len(bpy.data.objects),
        "mesh_count": len(meshes),
        "material_count": len(bpy.data.materials),
        "armature_count": len(armatures),
        "bone_count": len(bone_names),
        "action_count": len(actions),
        "actions": actions,
        "morph_target_count": morph_count,
        "morph_target_names": morph_names,
        "missing_required_objects": missing_objects,
        "hidden_historical_mesh_excluded": not unexpected_historical,
        "skeleton_round_trip_exact": skeleton_exact,
        "missing_bones": missing_bones,
        "duplicate_bones": duplicate_bones,
        "hierarchy_failures": hierarchy_failures,
        "animation_clips_round_trip_confirmed": action_exact,
        "action_tests": action_results,
        "action_failures": action_failures,
        "glb_animation_accessor_tests": glb_animation_results,
        "glb_animation_accessor_failures": glb_animation_failures,
        "morph_targets_round_trip_confirmed": morph_exact,
        "morph_tests": morph_results,
        "morph_failures": morph_failures,
        "neutral_reset_exact": reset_exact,
        "bounds": world_bounds(),
        "finite_scene_transforms": finite_scene(),
        "glb_round_trip_approved": not failed_gates,
        "official_sources_unchanged": True,
        "created_images": 0,
        "temporary_blend_created": False,
        "failed_gates": failed_gates,
    }
    write_json(os.path.join(transaction, "R2_FULL_CHARACTER_GLB_ROUNDTRIP_AUDIT.json.tmp"), report)
    print("R2_FULL_CHARACTER_GLB_ROUNDTRIP=" + json.dumps({
        "ExecutionStatus": report["execution_status"],
        "TechnicalVerdict": report["technical_verdict"],
        "GLBRoundTripApproved": report["glb_round_trip_approved"],
        "SkeletonRoundTripExact": report["skeleton_round_trip_exact"],
        "MorphTargetsRoundTripConfirmed": report["morph_targets_round_trip_confirmed"],
        "AnimationClipsRoundTripConfirmed": report["animation_clips_round_trip_confirmed"],
        "NeutralResetExact": report["neutral_reset_exact"],
        "BoneCount": report["bone_count"],
        "MorphTargetCount": report["morph_target_count"],
        "AnimationCount": report["action_count"],
        "FailedGates": failed_gates,
        "CreatedImages": 0,
    }, sort_keys=True))
    if failed_gates:
        raise RuntimeError("GLB round-trip gates failed: " + ", ".join(failed_gates))


try:
    main()
except Exception:
    traceback.print_exc()
    raise
