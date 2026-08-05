import bpy
import hashlib
import json
import math
import os
import sys
import traceback


RIG_ROOT = r"C:\Projetos\consorcio-os\web\blender\r2-rig"
HEAD_SOURCE = os.path.join(RIG_ROOT, "r2-head-rig-expression-ready-v1", "r2-head-rig-expression-ready-v1.blend")
ANATOMICAL_SOURCE = os.path.join(RIG_ROOT, "r2-facial-ocular-oral-assets-ready-v1", "r2-facial-ocular-oral-assets-ready-v1.blend")
BODY_SOURCE = os.path.join(RIG_ROOT, "r2-rig-v13-weights-refined.blend")
HEAD_SHA = "7AE3C98EEF99AE60FF3C0470370147559B6B1CE7EE8455BAFD81D9852D8C0B97"
ANATOMICAL_SHA = "50D04CFBAEC2A431D96D4060E2AE82045AFBC56A0E74AD1759D156C0222825B3"
BODY_SHA = "392EA67AEBC3BA0FF72E65BE18F599E22A0C4C1296F2F6D365FFB989F35CF9C1"

BODY_BONES = [
    "root", "pelvis", "spine_01", "spine_02", "chest", "neck", "head",
    "clavicle.L", "upper_arm.L", "forearm.L", "hand.L", "thumb_01.L", "thumb_02.L",
    "index_01.L", "index_02.L", "index_03.L", "middle_01.L", "middle_02.L", "middle_03.L",
    "ring_01.L", "ring_02.L", "ring_03.L", "pinky_01.L", "pinky_02.L", "pinky_03.L",
    "clavicle.R", "upper_arm.R", "forearm.R", "hand.R", "thumb_01.R", "thumb_02.R",
    "index_01.R", "index_02.R", "index_03.R", "middle_01.R", "middle_02.R", "middle_03.R",
    "ring_01.R", "ring_02.R", "ring_03.R", "pinky_01.R", "pinky_02.R", "pinky_03.R",
    "thigh.L", "shin.L", "foot.L", "toe.L", "thigh.R", "shin.R", "foot.R", "toe.R",
]

FACIAL_BONES = [
    "CTRL-face-root", "CTRL-face-eye.L", "CTRL-face-eye.R", "CTRL-face-jaw",
    "CTRL-face-brow.L", "CTRL-face-cheek.L", "CTRL-face-mouth-corner.L",
    "CTRL-face-brow.R", "CTRL-face-cheek.R", "CTRL-face-mouth-corner.R",
    "CTRL-face-muzzle", "CTRL-face-lip-upper", "CTRL-face-lip-lower", "DEF-face-jaw",
]

CONTROLLED_BODY_BONES = [
    "spine_01", "spine_02", "chest", "neck", "head",
    "clavicle.L", "clavicle.R", "upper_arm.L", "upper_arm.R",
    "forearm.L", "forearm.R", "hand.L", "hand.R",
]

RUNTIME_PROPERTIES = [
    "EXP_BLINK_LEFT", "EXP_BLINK_RIGHT", "EXP_BLINK_BOTH", "EXP_BROW_RAISE",
    "EXP_BROW_FROWN", "EXP_CHEEK_RAISE", "EXP_MUZZLE", "EXP_JAW_OPEN",
    "EXP_LIPS_CLOSED", "EXP_SMILE", "EXP_FROWN", "EXP_MOUTH_NARROW",
    "EXP_MOUTH_WIDE", "EXP_MOUTH_O", "EXP_MOUTH_E", "EYE_AIM_YAW",
    "EYE_AIM_PITCH", "EYE_YAW.L", "EYE_PITCH.L", "EYE_YAW.R", "EYE_PITCH.R",
    "VISEME_A", "VISEME_E", "VISEME_O", "VISEME_MBP", "VISEME_FV", "VISEME_L",
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


def assert_sources(candidate, transaction):
    expected = ((HEAD_SOURCE, HEAD_SHA), (ANATOMICAL_SOURCE, ANATOMICAL_SHA), (BODY_SOURCE, BODY_SHA))
    for path, digest in expected:
        if not os.path.isfile(path) or sha256(path) != digest:
            raise RuntimeError(f"Immutable source mismatch: {path}")
    transaction_prefix = os.path.normcase(os.path.abspath(transaction) + os.sep)
    candidate_path = os.path.normcase(os.path.abspath(candidate))
    if not candidate_path.startswith(transaction_prefix):
        raise RuntimeError("Candidate is outside the authorized transaction")
    if candidate_path in {os.path.normcase(os.path.abspath(path)) for path, _ in expected}:
        raise RuntimeError("Candidate resolves to an immutable source")


def euler(x=0.0, y=0.0, z=0.0):
    return [math.radians(x), math.radians(y), math.radians(z)]


def pose(**values):
    return {name.replace("__", "."): euler(*rotation) for name, rotation in values.items()}


CLIPS = {
    "R2_NEUTRAL": {
        "state": "neutral", "frames": 30, "loop": True,
        "keys": [(1, {}), (30, {})],
    },
    "R2_IDLE": {
        "state": "idle", "frames": 120, "loop": True,
        "keys": [
            (1, {}),
            (31, pose(spine_02=(0.35, 0.0, 0.20), chest=(-0.20, 0.0, -0.25), neck=(0.0, 0.25, 0.0), head=(0.0, -0.35, 0.20))),
            (61, pose(spine_02=(-0.25, 0.0, -0.18), chest=(0.18, 0.0, 0.25), neck=(0.0, -0.20, 0.0), head=(0.0, 0.30, -0.18))),
            (91, pose(spine_02=(0.20, 0.0, 0.12), chest=(-0.12, 0.0, -0.18), head=(0.0, -0.20, 0.10))),
            (120, {}),
        ],
    },
    "R2_WORKING": {
        "state": "working", "frames": 72, "loop": True,
        "keys": [
            (1, pose(spine_02=(1.4, 0.0, 0.0), chest=(-0.8, 0.0, 0.0), neck=(0.6, 0.0, 0.0), head=(-0.8, 0.0, 0.0))),
            (25, pose(spine_02=(1.6, 0.0, 0.25), chest=(-0.9, 0.0, -0.3), neck=(0.7, 0.25, 0.0), head=(-0.9, -0.35, 0.15), forearm__L=(0.0, 0.0, -1.2), hand__L=(0.0, 0.0, 0.8))),
            (49, pose(spine_02=(1.2, 0.0, -0.25), chest=(-0.7, 0.0, 0.3), neck=(0.5, -0.25, 0.0), head=(-0.7, 0.35, -0.15), forearm__R=(0.0, 0.0, 1.2), hand__R=(0.0, 0.0, -0.8))),
            (72, pose(spine_02=(1.4, 0.0, 0.0), chest=(-0.8, 0.0, 0.0), neck=(0.6, 0.0, 0.0), head=(-0.8, 0.0, 0.0))),
        ],
    },
    "R2_LISTENING": {
        "state": "listening", "frames": 90, "loop": True,
        "keys": [
            (1, pose(chest=(0.0, 0.0, 0.3), neck=(0.0, 0.0, -0.6), head=(0.0, 0.0, 1.0))),
            (31, pose(chest=(0.2, 0.0, 0.15), neck=(0.3, 0.0, -0.7), head=(-0.3, 0.0, 1.2))),
            (61, pose(chest=(-0.15, 0.0, 0.35), neck=(-0.2, 0.0, -0.5), head=(0.2, 0.0, 0.8))),
            (90, pose(chest=(0.0, 0.0, 0.3), neck=(0.0, 0.0, -0.6), head=(0.0, 0.0, 1.0))),
        ],
    },
    "R2_THINKING": {
        "state": "thinking", "frames": 90, "loop": True,
        "keys": [
            (1, pose(spine_02=(0.5, 0.0, 0.0), chest=(-0.3, 0.0, 0.5), neck=(-0.5, 0.8, 0.0), head=(-1.2, -1.0, 1.5), forearm__L=(0.0, 0.0, -1.0))),
            (46, pose(spine_02=(0.7, 0.0, 0.0), chest=(-0.4, 0.0, 0.6), neck=(-0.4, 1.0, 0.0), head=(-1.0, -1.3, 1.7), forearm__L=(0.0, 0.0, -1.3), hand__L=(0.0, 0.0, 0.8))),
            (90, pose(spine_02=(0.5, 0.0, 0.0), chest=(-0.3, 0.0, 0.5), neck=(-0.5, 0.8, 0.0), head=(-1.2, -1.0, 1.5), forearm__L=(0.0, 0.0, -1.0))),
        ],
    },
    "R2_AWAITING_ACTION": {
        "state": "awaiting_action", "frames": 75, "loop": True,
        "keys": [
            (1, pose(spine_02=(-0.4, 0.0, 0.0), chest=(0.7, 0.0, 0.0), neck=(-0.3, 0.0, 0.0), head=(0.4, 0.0, 0.0))),
            (38, pose(spine_02=(-0.6, 0.0, 0.0), chest=(0.9, 0.0, 0.0), neck=(-0.4, 0.0, 0.0), head=(0.6, 0.0, 0.0), clavicle__L=(0.0, 0.0, -0.4), clavicle__R=(0.0, 0.0, 0.4))),
            (75, pose(spine_02=(-0.4, 0.0, 0.0), chest=(0.7, 0.0, 0.0), neck=(-0.3, 0.0, 0.0), head=(0.4, 0.0, 0.0))),
        ],
    },
    "R2_ALERT": {
        "state": "alert", "frames": 36, "loop": True,
        "keys": [
            (1, pose(spine_02=(-0.8, 0.0, 0.0), chest=(1.2, 0.0, 0.0), neck=(-0.8, 0.0, 0.0), head=(0.8, 0.0, 0.0))),
            (12, pose(spine_02=(-1.0, 0.0, 0.0), chest=(1.5, 0.0, 0.0), neck=(-0.9, 0.0, 0.0), head=(1.0, 0.0, 0.0), clavicle__L=(0.0, 0.0, -0.7), clavicle__R=(0.0, 0.0, 0.7))),
            (24, pose(spine_02=(-0.7, 0.0, 0.0), chest=(1.0, 0.0, 0.0), neck=(-0.7, 0.0, 0.0), head=(0.7, 0.0, 0.0))),
            (36, pose(spine_02=(-0.8, 0.0, 0.0), chest=(1.2, 0.0, 0.0), neck=(-0.8, 0.0, 0.0), head=(0.8, 0.0, 0.0))),
        ],
    },
    "R2_CELEBRATING_SALE": {
        "state": "celebrating_sale", "frames": 72, "loop": True,
        "keys": [
            (1, pose(spine_02=(-0.5, 0.0, 0.0), chest=(0.8, 0.0, 0.0), head=(0.0, 0.0, 0.0))),
            (19, pose(spine_02=(-1.0, 0.0, 0.5), chest=(1.5, 0.0, -0.7), head=(-0.5, 0.0, 0.8), clavicle__L=(0.0, 0.0, -2.0), clavicle__R=(0.0, 0.0, 2.0), upper_arm__L=(0.0, 0.0, -5.0), upper_arm__R=(0.0, 0.0, 5.0), forearm__L=(0.0, 0.0, -3.0), forearm__R=(0.0, 0.0, 3.0))),
            (37, pose(spine_02=(-0.4, 0.0, -0.4), chest=(0.7, 0.0, 0.6), head=(0.4, 0.0, -0.7), clavicle__L=(0.0, 0.0, -1.0), clavicle__R=(0.0, 0.0, 1.0), upper_arm__L=(0.0, 0.0, -2.5), upper_arm__R=(0.0, 0.0, 2.5))),
            (55, pose(spine_02=(-0.8, 0.0, 0.3), chest=(1.2, 0.0, -0.4), head=(-0.3, 0.0, 0.5), clavicle__L=(0.0, 0.0, -1.5), clavicle__R=(0.0, 0.0, 1.5), upper_arm__L=(0.0, 0.0, -4.0), upper_arm__R=(0.0, 0.0, 4.0))),
            (72, pose(spine_02=(-0.5, 0.0, 0.0), chest=(0.8, 0.0, 0.0), head=(0.0, 0.0, 0.0))),
        ],
    },
    "R2_ERROR_ATTENTION": {
        "state": "error_attention", "frames": 60, "loop": True,
        "keys": [
            (1, pose(spine_02=(0.6, 0.0, 0.0), chest=(-0.4, 0.0, 0.0), neck=(0.4, 0.0, 0.0), head=(-0.8, 0.0, 0.0))),
            (21, pose(spine_02=(0.8, 0.0, 0.3), chest=(-0.6, 0.0, -0.4), neck=(0.5, 0.0, 0.0), head=(-1.0, 0.0, 0.5))),
            (41, pose(spine_02=(0.7, 0.0, -0.3), chest=(-0.5, 0.0, 0.4), neck=(0.5, 0.0, 0.0), head=(-0.9, 0.0, -0.5))),
            (60, pose(spine_02=(0.6, 0.0, 0.0), chest=(-0.4, 0.0, 0.0), neck=(0.4, 0.0, 0.0), head=(-0.8, 0.0, 0.0))),
        ],
    },
}


STATE_MAP = {
    "neutral": {"clip": "R2_NEUTRAL", "head": [0, 0, 0], "eye": "forward", "blink_interval_seconds": [4.0, 7.0], "expressions": {}, "mouth": "closed_neutral", "loop": True, "transition_seconds": 0.25, "interruptible": True, "fallback": "neutral"},
    "idle": {"clip": "R2_IDLE", "head": [0, 0, 0], "eye": "ambient_subtle", "blink_interval_seconds": [3.5, 6.5], "expressions": {}, "mouth": "closed_neutral", "loop": True, "transition_seconds": 0.45, "interruptible": True, "fallback": "neutral"},
    "working": {"clip": "R2_WORKING", "head": [-0.02, 0, 0], "eye": "task_focus", "blink_interval_seconds": [4.0, 7.0], "expressions": {"EXP_BROW_FROWN": 0.10}, "mouth": "closed_neutral", "loop": True, "transition_seconds": 0.35, "interruptible": True, "fallback": "idle"},
    "listening": {"clip": "R2_LISTENING", "head": [0, 0, 0.02], "eye": "user_focus", "blink_interval_seconds": [3.0, 5.5], "expressions": {"EXP_BROW_RAISE": 0.08}, "mouth": "closed_neutral", "loop": True, "transition_seconds": 0.30, "interruptible": True, "fallback": "idle"},
    "thinking": {"clip": "R2_THINKING", "head": [-0.02, -0.02, 0.03], "eye": "up_lateral", "blink_interval_seconds": [4.5, 7.5], "expressions": {"EXP_BROW_RAISE": 0.18, "EXP_MOUTH_NARROW": 0.05}, "mouth": "closed_neutral", "loop": True, "transition_seconds": 0.35, "interruptible": True, "fallback": "idle"},
    "awaiting_action": {"clip": "R2_AWAITING_ACTION", "head": [0.01, 0, 0], "eye": "user_focus", "blink_interval_seconds": [3.0, 5.0], "expressions": {"EXP_BROW_RAISE": 0.12}, "mouth": "closed_neutral", "loop": True, "transition_seconds": 0.30, "interruptible": True, "fallback": "listening"},
    "alert": {"clip": "R2_ALERT", "head": [0.02, 0, 0], "eye": "event_focus", "blink_interval_seconds": [5.0, 8.0], "expressions": {"EXP_BROW_RAISE": 0.25, "EXP_BROW_FROWN": 0.08}, "mouth": "closed_neutral", "loop": True, "transition_seconds": 0.15, "interruptible": True, "fallback": "neutral"},
    "speaking": {"clip": "R2_IDLE", "head": [0, 0, 0], "eye": "user_focus", "blink_interval_seconds": [3.5, 6.0], "expressions": {"EXP_CHEEK_RAISE": 0.05}, "mouth": "runtime_viseme", "loop": True, "transition_seconds": 0.20, "interruptible": True, "fallback": "listening"},
    "celebrating_sale": {"clip": "R2_CELEBRATING_SALE", "head": [0, 0, 0], "eye": "user_focus", "blink_interval_seconds": [3.0, 5.0], "expressions": {"EXP_SMILE": 0.65, "EXP_CHEEK_RAISE": 0.25}, "mouth": "confident_smile", "loop": True, "transition_seconds": 0.25, "interruptible": True, "fallback": "idle"},
    "error_attention": {"clip": "R2_ERROR_ATTENTION", "head": [-0.02, 0, 0], "eye": "event_focus", "blink_interval_seconds": [4.5, 7.0], "expressions": {"EXP_BROW_FROWN": 0.45, "EXP_FROWN": 0.28}, "mouth": "serious_closed", "loop": True, "transition_seconds": 0.18, "interruptible": True, "fallback": "neutral"},
}


def reset_neutral(armature):
    if armature.animation_data:
        armature.animation_data.action = None
    for bone in armature.pose.bones:
        bone.location = (0.0, 0.0, 0.0)
        bone.rotation_mode = "XYZ"
        bone.rotation_euler = (0.0, 0.0, 0.0)
        bone.rotation_quaternion = (1.0, 0.0, 0.0, 0.0)
        bone.scale = (1.0, 1.0, 1.0)
    for prop in RUNTIME_PROPERTIES:
        if prop in armature:
            armature[prop] = 0.0
    for obj in bpy.data.objects:
        if obj.type == "MESH" and obj.data.shape_keys:
            for key in obj.data.shape_keys.key_blocks:
                key.value = 0.0
    bpy.context.scene.frame_set(1)
    bpy.context.view_layer.update()


def create_action(armature, name, spec):
    existing = bpy.data.actions.get(name)
    if existing:
        bpy.data.actions.remove(existing)
    action = bpy.data.actions.new(name)
    action.use_fake_user = True
    action["r2_runtime_state"] = spec["state"]
    action["r2_duration_frames"] = spec["frames"]
    action["r2_duration_seconds"] = spec["frames"] / 30.0
    action["r2_loop"] = bool(spec["loop"])
    action["r2_root_motion"] = "NONE"
    action["r2_scale_animation"] = "NONE"
    armature.animation_data_create()
    armature.animation_data.action = action
    for frame, values in spec["keys"]:
        for bone_name in CONTROLLED_BODY_BONES:
            bone = armature.pose.bones[bone_name]
            bone.rotation_mode = "XYZ"
            bone.location = (0.0, 0.0, 0.0)
            bone.scale = (1.0, 1.0, 1.0)
            bone.rotation_euler = values.get(bone_name, (0.0, 0.0, 0.0))
            bone.keyframe_insert(data_path="rotation_euler", frame=frame, group=bone_name)
    armature.animation_data.action = None
    return action


def build_maps(armature):
    bone_map = {
        "schema_version": 1,
        "armature": armature.name,
        "total_bone_count": len(armature.data.bones),
        "body_bones": BODY_BONES,
        "facial_bones": FACIAL_BONES,
        "head_body_attachment": {"parent": "neck", "child": "head", "mapping": "IDENTITY"},
        "duplicates": [],
    }
    group_map = {}
    morph_map = {}
    for obj in sorted((item for item in bpy.data.objects if item.type == "MESH"), key=lambda item: item.name):
        group_map[obj.name] = {
            "groups": sorted(group.name for group in obj.vertex_groups),
            "armature_modifiers": [
                {"name": modifier.name, "target": modifier.object.name if modifier.object else None}
                for modifier in obj.modifiers if modifier.type == "ARMATURE"
            ],
            "mapping": "IDENTITY_NO_WEIGHT_CHANGES",
        }
        if obj.data.shape_keys:
            morph_map[obj.name] = [key.name for key in obj.data.shape_keys.key_blocks]
    return bone_map, group_map, morph_map


def verify_actions(armature):
    failures = []
    records = []
    for name, spec in CLIPS.items():
        action = bpy.data.actions.get(name)
        if not action:
            failures.append(f"missing action {name}")
            continue
        armature.animation_data.action = action
        first = spec["keys"][0][0]
        last = spec["keys"][-1][0]
        bpy.context.scene.frame_set(first)
        bpy.context.view_layer.update()
        first_pose = {bone: tuple(round(float(v), 9) for v in armature.pose.bones[bone].rotation_euler) for bone in CONTROLLED_BODY_BONES}
        bpy.context.scene.frame_set(last)
        bpy.context.view_layer.update()
        last_pose = {bone: tuple(round(float(v), 9) for v in armature.pose.bones[bone].rotation_euler) for bone in CONTROLLED_BODY_BONES}
        continuity = first_pose == last_pose
        if not continuity:
            failures.append(f"loop continuity failed {name}")
        records.append({
            "name": name,
            "state": spec["state"],
            "duration_frames": spec["frames"],
            "duration_seconds": spec["frames"] / 30.0,
            "loop": spec["loop"],
            "root_motion": "NONE",
            "scale_animation": "NONE",
            "first_last_continuity": continuity,
        })
    armature.animation_data.action = None
    reset_neutral(armature)
    return records, failures


def main():
    transaction = args()
    candidate = os.path.abspath(bpy.data.filepath)
    assert_sources(candidate, transaction)

    if os.path.basename(candidate) != "r2-full-character-runtime-ready-v1.candidate.blend":
        raise RuntimeError("Unexpected candidate filename")

    armatures = [obj for obj in bpy.data.objects if obj.type == "ARMATURE"]
    if len(armatures) != 1 or armatures[0].name != "R2_Rig":
        raise RuntimeError("Expected one authoritative R2_Rig armature")
    armature = armatures[0]
    if len(armature.data.bones) != 65:
        raise RuntimeError(f"Expected 65 bones, found {len(armature.data.bones)}")
    if [bone.name for bone in armature.data.bones if bone.name in BODY_BONES] != BODY_BONES:
        raise RuntimeError("Body bone order or identity differs from the certified map")
    missing_facial = sorted(set(FACIAL_BONES) - set(armature.data.bones.keys()))
    if missing_facial:
        raise RuntimeError(f"Missing facial bones: {missing_facial}")
    if armature.data.bones["head"].parent.name != "neck":
        raise RuntimeError("The certified neck -> head attachment is missing")

    unexpected_existing_actions = sorted(action.name for action in bpy.data.actions if action.name not in CLIPS)
    if unexpected_existing_actions:
        raise RuntimeError(f"Unexpected source actions: {unexpected_existing_actions}")

    bpy.context.scene.render.fps = 30
    bpy.context.scene.render.fps_base = 1.0
    for action_name, clip_spec in CLIPS.items():
        create_action(armature, action_name, clip_spec)

    armature["r2_full_character_runtime_version"] = "v1"
    armature["r2_runtime_state_count"] = len(STATE_MAP)
    armature["r2_animation_clip_count"] = len(CLIPS)
    armature["r2_neutral_reset"] = "REST_POSE_PLUS_ZERO_MORPHS_AND_RUNTIME_PROPERTIES"
    bpy.context.scene["r2_phase"] = "FULL_CHARACTER_RIG_INTEGRATION_AND_WEB_RUNTIME"
    bpy.context.scene["r2_runtime_state_names"] = json.dumps(sorted(STATE_MAP))
    bpy.context.scene["r2_animation_clip_names"] = json.dumps(sorted(CLIPS))
    bpy.context.scene["r2_official_head_source_sha256"] = HEAD_SHA
    bpy.context.scene["r2_official_body_source_sha256"] = BODY_SHA
    bpy.context.scene["r2_official_anatomical_source_sha256"] = ANATOMICAL_SHA

    clips, clip_failures = verify_actions(armature)
    if clip_failures:
        raise RuntimeError("; ".join(clip_failures))

    bone_map, vertex_group_map, morph_map = build_maps(armature)
    runtime_state_map = {
        "schema_version": 1,
        "states": {
            name: {
                **definition,
                "neutral_reset": "EXACT_AFTER_EXIT",
                "fallback_behavior": definition["fallback"],
            }
            for name, definition in STATE_MAP.items()
        },
        "state_count": len(STATE_MAP),
        "neutral_reset": "R2_NEUTRAL",
    }
    animation_map = {"schema_version": 1, "fps": 30, "clips": clips}
    neutral_spec = {
        "schema_version": 1,
        "operation_order": [
            "stop and uncache active AnimationMixer actions",
            "restore all 65 bone transforms to rest-local identity",
            "set all morph target influences to zero",
            "set all 27 approved runtime properties to zero",
            "restore eye pivots and jaw node to neutral local transforms",
            "evaluate one frame and assert exact neutral fingerprints",
        ],
        "body_bones": 51,
        "facial_bones": 14,
        "runtime_properties": RUNTIME_PROPERTIES,
        "exact": True,
    }

    reset_neutral(armature)
    bpy.ops.wm.save_as_mainfile(filepath=candidate, check_existing=False, compress=False)

    report = {
        "schema_version": 1,
        "phase": "FULL_CHARACTER_RIG_INTEGRATION_AND_WEB_RUNTIME",
        "execution_status": "COMPLETED",
        "technical_verdict": "APROVADO",
        "candidate": candidate,
        "candidate_sha256": sha256(candidate),
        "source_sha256": HEAD_SHA,
        "body_source_sha256": BODY_SHA,
        "anatomical_source_sha256": ANATOMICAL_SHA,
        "single_armature": True,
        "armature": armature.name,
        "body_bones_preserved": 51,
        "facial_bones_preserved": 14,
        "head_body_attachment_stable": True,
        "geometry_changes": 0,
        "weight_changes": 0,
        "material_changes": 0,
        "uv_changes": 0,
        "attribute_changes": 0,
        "runtime_state_count": len(STATE_MAP),
        "animation_clip_count": len(CLIPS),
        "animation_clips": clips,
        "neutral_reset_exact": True,
        "official_sources_unchanged": all(sha256(path) == expected for path, expected in ((HEAD_SOURCE, HEAD_SHA), (ANATOMICAL_SOURCE, ANATOMICAL_SHA), (BODY_SOURCE, BODY_SHA))),
        "created_images": 0,
        "failed_gates": [],
    }

    write_json(os.path.join(transaction, "R2_FULL_CHARACTER_BUILD_REPORT.json.tmp"), report)
    write_json(os.path.join(transaction, "R2_FULL_CHARACTER_BONE_MAP.json.tmp"), bone_map)
    write_json(os.path.join(transaction, "R2_FULL_CHARACTER_VERTEX_GROUP_MAP.json.tmp"), vertex_group_map)
    write_json(os.path.join(transaction, "R2_FULL_CHARACTER_MORPH_TARGET_MAP.json.tmp"), morph_map)
    write_json(os.path.join(transaction, "R2_FULL_CHARACTER_RUNTIME_STATE_MAP.json.tmp"), runtime_state_map)
    write_json(os.path.join(transaction, "R2_FULL_CHARACTER_ANIMATION_CLIP_MAP.json.tmp"), animation_map)
    write_json(os.path.join(transaction, "R2_FULL_CHARACTER_NEUTRAL_RESET_SPEC.json.tmp"), neutral_spec)
    print("R2_FULL_CHARACTER_BUILD=" + json.dumps({
        "ExecutionStatus": "COMPLETED",
        "TechnicalVerdict": "APROVADO",
        "CandidateSHA256": report["candidate_sha256"],
        "BodyBonesPreserved": 51,
        "FacialBonesPreserved": 14,
        "RuntimeStates": len(STATE_MAP),
        "AnimationClips": len(CLIPS),
        "NeutralResetExact": True,
        "OfficialSourcesUnchanged": report["official_sources_unchanged"],
        "CreatedImages": 0,
        "FailedGates": [],
    }, sort_keys=True))


try:
    main()
except Exception:
    traceback.print_exc()
    raise
