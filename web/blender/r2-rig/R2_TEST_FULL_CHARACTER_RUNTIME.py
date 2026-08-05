import bpy
import json
import math
import os
import sys
import traceback
from collections import defaultdict, deque


RIG_ROOT = r"C:\Projetos\consorcio-os\web\blender\r2-rig"
HEAD_SOURCE = os.path.join(RIG_ROOT, "r2-head-rig-expression-ready-v1", "r2-head-rig-expression-ready-v1.blend")
ANATOMICAL_SOURCE = os.path.join(RIG_ROOT, "r2-facial-ocular-oral-assets-ready-v1", "r2-facial-ocular-oral-assets-ready-v1.blend")
BODY_SOURCE = os.path.join(RIG_ROOT, "r2-rig-v13-weights-refined.blend")
HEAD_SHA = "7AE3C98EEF99AE60FF3C0470370147559B6B1CE7EE8455BAFD81D9852D8C0B97"
ANATOMICAL_SHA = "50D04CFBAEC2A431D96D4060E2AE82045AFBC56A0E74AD1759D156C0222825B3"
BODY_SHA = "392EA67AEBC3BA0FF72E65BE18F599E22A0C4C1296F2F6D365FFB989F35CF9C1"

CLIP_BY_STATE = {
    "neutral": "R2_NEUTRAL",
    "idle": "R2_IDLE",
    "working": "R2_WORKING",
    "listening": "R2_LISTENING",
    "thinking": "R2_THINKING",
    "awaiting_action": "R2_AWAITING_ACTION",
    "alert": "R2_ALERT",
    "speaking": "R2_IDLE",
    "celebrating_sale": "R2_CELEBRATING_SALE",
    "error_attention": "R2_ERROR_ATTENTION",
}

RUNTIME_PROPERTIES = [
    "EXP_BLINK_LEFT", "EXP_BLINK_RIGHT", "EXP_BLINK_BOTH", "EXP_BROW_RAISE",
    "EXP_BROW_FROWN", "EXP_CHEEK_RAISE", "EXP_MUZZLE", "EXP_JAW_OPEN",
    "EXP_LIPS_CLOSED", "EXP_SMILE", "EXP_FROWN", "EXP_MOUTH_NARROW",
    "EXP_MOUTH_WIDE", "EXP_MOUTH_O", "EXP_MOUTH_E", "EYE_AIM_YAW",
    "EYE_AIM_PITCH", "EYE_YAW.L", "EYE_PITCH.L", "EYE_YAW.R", "EYE_PITCH.R",
    "VISEME_A", "VISEME_E", "VISEME_O", "VISEME_MBP", "VISEME_FV", "VISEME_L",
]

LEVELS = [0.0, 0.25, 0.5, 0.75, 1.0]


def args():
    argv = sys.argv
    if "--" not in argv:
        raise RuntimeError("Expected -- <transaction-directory>")
    values = argv[argv.index("--") + 1 :]
    if len(values) != 1:
        raise RuntimeError("Expected one transaction directory")
    return os.path.abspath(values[0])


def sha256(path):
    import hashlib
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


def evaluate():
    frame = bpy.context.scene.frame_current
    bpy.context.scene.frame_set(frame + 1)
    bpy.context.scene.frame_set(frame)
    bpy.context.view_layer.update()


def reset_neutral(armature):
    armature.animation_data_create()
    armature.animation_data.action = None
    for bone in armature.pose.bones:
        bone.location = (0.0, 0.0, 0.0)
        bone.rotation_mode = "XYZ"
        bone.rotation_euler = (0.0, 0.0, 0.0)
        bone.scale = (1.0, 1.0, 1.0)
    for prop in RUNTIME_PROPERTIES:
        armature[prop] = 0.0
    for obj in bpy.data.objects:
        if obj.type == "MESH" and obj.data.shape_keys:
            for key in obj.data.shape_keys.key_blocks:
                key.value = 0.0
    bpy.context.scene.frame_set(1)
    evaluate()


def neutral_exact(armature):
    tolerance = 1.0e-8
    bone_exact = all(
        bone.location.length <= tolerance
        and bone.rotation_euler.to_matrix().to_3x3().is_identity
        and all(abs(float(value) - 1.0) <= tolerance for value in bone.scale)
        for bone in armature.pose.bones
    )
    props_exact = all(abs(float(armature[prop])) <= tolerance for prop in RUNTIME_PROPERTIES)
    shapes_exact = all(
        abs(float(key.value)) <= tolerance
        for obj in bpy.data.objects if obj.type == "MESH" and obj.data.shape_keys
        for key in obj.data.shape_keys.key_blocks if key.name != "Basis"
    )
    return bone_exact and props_exact and shapes_exact


def topology_metrics(mesh):
    # Match the approved head-rig audit precondition: rebuild the edge table from polygons
    # before classifying loose, boundary and non-manifold edges.
    mesh.update(calc_edges=True)
    face_counts = [0] * len(mesh.edges)
    edge_lookup = {tuple(sorted(edge.vertices)): edge.index for edge in mesh.edges}
    adjacency = defaultdict(list)
    for edge in mesh.edges:
        a, b = edge.vertices
        adjacency[a].append(b)
        adjacency[b].append(a)
    for polygon in mesh.polygons:
        vertices = [int(index) for index in polygon.vertices]
        for offset, vertex in enumerate(vertices):
            key = tuple(sorted((vertex, vertices[(offset + 1) % len(vertices)])))
            index = edge_lookup.get(key)
            if index is not None:
                face_counts[index] += 1
    islands = 0
    remaining = set(range(len(mesh.vertices)))
    while remaining:
        islands += 1
        start = min(remaining)
        queue = deque([start])
        remaining.remove(start)
        while queue:
            current = queue.popleft()
            for neighbor in adjacency[current]:
                if neighbor in remaining:
                    remaining.remove(neighbor)
                    queue.append(neighbor)
    return {
        "vertices": len(mesh.vertices),
        "edges": len(mesh.edges),
        "faces": len(mesh.polygons),
        "connected_islands": islands,
        "boundary_edges": sum(1 for count in face_counts if count == 1),
        "wire_edges": sum(1 for count in face_counts if count == 0),
        "invalid_non_manifold": sum(1 for count in face_counts if count > 2),
        "zero_area_faces": sum(1 for polygon in mesh.polygons if polygon.area <= 1.0e-12),
    }


def signed_volume(mesh):
    volume = 0.0
    for polygon in mesh.polygons:
        vertices = [mesh.vertices[index].co for index in polygon.vertices]
        if len(vertices) < 3:
            continue
        origin = vertices[0]
        for index in range(1, len(vertices) - 1):
            volume += origin.dot(vertices[index].cross(vertices[index + 1])) / 6.0
    return volume


def channel_targets():
    foundation = bpy.data.objects["R2_Head_Face_Foundation"]
    return {
        "BLINK_LEFT": ("EXP_BLINK_LEFT", lambda: bpy.data.objects["R2_UpperEyelid.L"].data.shape_keys.key_blocks["EXP_BLINK"].value),
        "BLINK_RIGHT": ("EXP_BLINK_RIGHT", lambda: bpy.data.objects["R2_UpperEyelid.R"].data.shape_keys.key_blocks["EXP_BLINK"].value),
        "BLINK_BOTH": ("EXP_BLINK_BOTH", lambda: min(bpy.data.objects["R2_UpperEyelid.L"].data.shape_keys.key_blocks["EXP_BLINK"].value, bpy.data.objects["R2_UpperEyelid.R"].data.shape_keys.key_blocks["EXP_BLINK"].value)),
        "BROW_RAISE": ("EXP_BROW_RAISE", lambda: foundation.data.shape_keys.key_blocks["EXP_BROW_RAISE"].value),
        "BROW_FROWN": ("EXP_BROW_FROWN", lambda: foundation.data.shape_keys.key_blocks["EXP_BROW_FROWN"].value),
        "CHEEK_RAISE": ("EXP_CHEEK_RAISE", lambda: foundation.data.shape_keys.key_blocks["EXP_CHEEK_RAISE"].value),
        "MUZZLE": ("EXP_MUZZLE", lambda: foundation.data.shape_keys.key_blocks["EXP_MUZZLE"].value),
        "JAW_OPEN": ("EXP_JAW_OPEN", lambda: abs(bpy.data.objects["R2_JawDriver"].rotation_euler.x)),
        "LIPS_CLOSED": ("EXP_LIPS_CLOSED", lambda: bpy.data.objects["R2_LipUpper"].data.shape_keys.key_blocks["EXP_LIPS_CLOSED"].value),
        "SMILE": ("EXP_SMILE", lambda: bpy.data.objects["R2_LipUpper"].data.shape_keys.key_blocks["EXP_SMILE"].value),
        "FROWN": ("EXP_FROWN", lambda: bpy.data.objects["R2_LipUpper"].data.shape_keys.key_blocks["EXP_FROWN"].value),
        "MOUTH_NARROW": ("EXP_MOUTH_NARROW", lambda: bpy.data.objects["R2_LipUpper"].data.shape_keys.key_blocks["EXP_MOUTH_NARROW"].value),
        "MOUTH_WIDE": ("EXP_MOUTH_WIDE", lambda: bpy.data.objects["R2_LipUpper"].data.shape_keys.key_blocks["EXP_MOUTH_WIDE"].value),
        "MOUTH_O": ("EXP_MOUTH_O", lambda: bpy.data.objects["R2_LipUpper"].data.shape_keys.key_blocks["EXP_MOUTH_O"].value),
        "MOUTH_E": ("EXP_MOUTH_E", lambda: bpy.data.objects["R2_LipUpper"].data.shape_keys.key_blocks["EXP_MOUTH_E"].value),
        "EYE_LEFT": ("EYE_YAW.L", lambda: abs(bpy.data.objects["R2_EyePivot.L"].rotation_euler.z)),
        "EYE_RIGHT": ("EYE_YAW.R", lambda: abs(bpy.data.objects["R2_EyePivot.R"].rotation_euler.z)),
        "EYE_AIM": ("EYE_AIM_YAW", lambda: min(abs(bpy.data.objects["R2_EyePivot.L"].rotation_euler.z), abs(bpy.data.objects["R2_EyePivot.R"].rotation_euler.z))),
        "VISEME_A": ("VISEME_A", lambda: bpy.data.objects["R2_LipUpper"].data.shape_keys.key_blocks["EXP_MOUTH_WIDE"].value),
        "VISEME_E": ("VISEME_E", lambda: bpy.data.objects["R2_LipUpper"].data.shape_keys.key_blocks["EXP_MOUTH_E"].value),
        "VISEME_O": ("VISEME_O", lambda: bpy.data.objects["R2_LipUpper"].data.shape_keys.key_blocks["EXP_MOUTH_O"].value),
        "VISEME_MBP": ("VISEME_MBP", lambda: bpy.data.objects["R2_LipUpper"].data.shape_keys.key_blocks["EXP_LIPS_CLOSED"].value),
        "VISEME_FV": ("VISEME_FV", lambda: bpy.data.objects["R2_LipLower"].data.shape_keys.key_blocks["EXP_VISEME_FV"].value),
        "VISEME_L": ("VISEME_L", lambda: bpy.data.objects["R2_Tongue"].data.shape_keys.key_blocks["EXP_VISEME_L"].value),
    }


def test_channels(armature):
    results = {}
    failures = []
    for channel, (property_name, getter) in channel_targets().items():
        observations = []
        for level in LEVELS:
            reset_neutral(armature)
            armature[property_name] = level
            armature.update_tag()
            evaluate()
            observed = float(getter())
            observations.append({"level": level, "observed": observed})
            if level == 0.0 and abs(observed) > 1.0e-7:
                failures.append(f"{channel} nonzero at neutral")
            if level > 0.0 and observed <= 1.0e-7:
                failures.append(f"{channel} failed at level {level}")
        monotonic = all(observations[index]["observed"] <= observations[index + 1]["observed"] + 1.0e-7 for index in range(len(observations) - 1))
        if not monotonic:
            failures.append(f"{channel} is not monotonic")
        reset_neutral(armature)
        neutral_after = neutral_exact(armature)
        if not neutral_after:
            failures.append(f"{channel} neutral reset failed")
        results[channel] = {
            "property": property_name,
            "levels": observations,
            "monotonic": monotonic,
            "neutral_reset_exact": neutral_after,
            "passed": monotonic and neutral_after and observations[-1]["observed"] > 1.0e-7,
        }
    return results, failures


def set_action(armature, action_name, normalized_time=0.5):
    action = bpy.data.actions[action_name]
    armature.animation_data.action = action
    first, last = action.frame_range
    frame = int(round(first + (last - first) * normalized_time))
    bpy.context.scene.frame_set(frame)
    evaluate()
    return frame


def finite_pose(armature):
    return all(math.isfinite(float(value)) for bone in armature.pose.bones for row in bone.matrix for value in row)


def combined_tests(armature):
    failures = []
    results = {}

    cases = [
        ("head_rotation_plus_blink", "R2_LISTENING", "EXP_BLINK_BOTH", lambda: bpy.data.objects["R2_UpperEyelid.L"].data.shape_keys.key_blocks["EXP_BLINK"].value),
        ("neck_rotation_plus_eye_aim", "R2_THINKING", "EYE_AIM_YAW", lambda: abs(bpy.data.objects["R2_EyePivot.L"].rotation_euler.z)),
        ("jaw_open_plus_head_rotation", "R2_ALERT", "EXP_JAW_OPEN", lambda: abs(bpy.data.objects["R2_JawDriver"].rotation_euler.x)),
        ("speaking_viseme_plus_idle", "R2_IDLE", "VISEME_A", lambda: bpy.data.objects["R2_LipUpper"].data.shape_keys.key_blocks["EXP_MOUTH_WIDE"].value),
        ("smile_plus_celebrating", "R2_CELEBRATING_SALE", "EXP_SMILE", lambda: bpy.data.objects["R2_LipUpper"].data.shape_keys.key_blocks["EXP_SMILE"].value),
        ("alert_expression_plus_body_alert", "R2_ALERT", "EXP_BROW_RAISE", lambda: bpy.data.objects["R2_Head_Face_Foundation"].data.shape_keys.key_blocks["EXP_BROW_RAISE"].value),
        ("listening_expression_plus_eye_target", "R2_LISTENING", "EYE_AIM_YAW", lambda: abs(bpy.data.objects["R2_EyePivot.L"].rotation_euler.z)),
        ("thinking_expression_plus_eye_target", "R2_THINKING", "EXP_BROW_RAISE", lambda: bpy.data.objects["R2_Head_Face_Foundation"].data.shape_keys.key_blocks["EXP_BROW_RAISE"].value),
    ]
    for name, action_name, property_name, getter in cases:
        reset_neutral(armature)
        frame = set_action(armature, action_name)
        armature[property_name] = 0.75
        armature.update_tag()
        evaluate()
        observed = float(getter())
        passed = finite_pose(armature) and observed > 1.0e-7
        reset_neutral(armature)
        reset_exact = neutral_exact(armature)
        passed = passed and reset_exact
        if not passed:
            failures.append(name)
        results[name] = {"action": action_name, "frame": frame, "property": property_name, "observed": observed, "neutral_reset_exact": reset_exact, "passed": passed}

    blink_states = {}
    for state, action_name in CLIP_BY_STATE.items():
        reset_neutral(armature)
        set_action(armature, action_name)
        armature["EXP_BLINK_BOTH"] = 1.0
        armature.update_tag()
        evaluate()
        observed = min(
            bpy.data.objects["R2_UpperEyelid.L"].data.shape_keys.key_blocks["EXP_BLINK"].value,
            bpy.data.objects["R2_UpperEyelid.R"].data.shape_keys.key_blocks["EXP_BLINK"].value,
        )
        passed = observed > 0.99 and finite_pose(armature)
        blink_states[state] = {"clip": action_name, "observed": float(observed), "passed": passed}
        if not passed:
            failures.append(f"blink during {state}")
    results["blink_during_every_state"] = blink_states

    transition_count = 0
    transition_failures = []
    for source_state, source_action in CLIP_BY_STATE.items():
        for target_state, target_action in CLIP_BY_STATE.items():
            reset_neutral(armature)
            set_action(armature, source_action, 0.45)
            if not finite_pose(armature):
                transition_failures.append(f"{source_state}->{target_state}:source")
            set_action(armature, target_action, 0.55)
            if not finite_pose(armature):
                transition_failures.append(f"{source_state}->{target_state}:target")
            reset_neutral(armature)
            if not neutral_exact(armature):
                transition_failures.append(f"{source_state}->{target_state}:neutral")
            transition_count += 1
    failures.extend(transition_failures)
    results["all_pair_transitions"] = {"tested": transition_count, "failures": transition_failures, "passed": not transition_failures}

    repeated_failures = []
    for cycle in range(10):
        for state, action_name in CLIP_BY_STATE.items():
            set_action(armature, action_name, (cycle % 5) / 4.0)
            if not finite_pose(armature):
                repeated_failures.append(f"cycle={cycle},state={state}")
    reset_neutral(armature)
    if not neutral_exact(armature):
        repeated_failures.append("final neutral")
    failures.extend(repeated_failures)
    results["repeated_transition_cycles"] = {"cycles": 10, "state_applications": 100, "failures": repeated_failures, "passed": not repeated_failures}

    reset_neutral(armature)
    armature.animation_data.action = bpy.data.actions["R2_IDLE"]
    idle_failures = []
    for cycle in range(100):
        for frame in (1, 31, 61, 91, 120):
            bpy.context.scene.frame_set(frame)
            if not finite_pose(armature):
                idle_failures.append({"cycle": cycle, "frame": frame})
    reset_neutral(armature)
    failures.extend(f"long idle {item}" for item in idle_failures)
    results["long_running_idle"] = {"cycles": 100, "samples": 500, "failures": idle_failures, "passed": not idle_failures and neutral_exact(armature)}

    # Explicit interruption requirements.
    interruption_results = {}
    for name, first_action, prop, second_action in (
        ("speaking_by_alert", "R2_IDLE", "VISEME_E", "R2_ALERT"),
        ("celebrating_by_neutral", "R2_CELEBRATING_SALE", "EXP_SMILE", "R2_NEUTRAL"),
    ):
        reset_neutral(armature)
        set_action(armature, first_action)
        armature[prop] = 0.8
        evaluate()
        set_action(armature, second_action)
        reset_neutral(armature)
        passed = neutral_exact(armature)
        interruption_results[name] = {"passed": passed}
        if not passed:
            failures.append(name)
    results["interruptions"] = interruption_results
    return results, failures


def topology_and_weights(armature):
    topology = {obj.name: topology_metrics(obj.data) for obj in bpy.data.objects if obj.type == "MESH"}
    wire_edges = sum(item["wire_edges"] for item in topology.values())
    invalid_non_manifold = sum(item["invalid_non_manifold"] for item in topology.values())
    zero_area_faces = sum(item["zero_area_faces"] for item in topology.values())
    inverted = []
    for obj in bpy.data.objects:
        if obj.type != "MESH" or not obj.data.polygons:
            continue
        if topology[obj.name]["boundary_edges"] == 0:
            volume = signed_volume(obj.data)
            if volume < -1.0e-12:
                inverted.append({"object": obj.name, "signed_volume": volume, "faces": len(obj.data.polygons)})
    deform_groups = {bone.name for bone in armature.data.bones if bone.use_deform}
    unweighted = []
    for obj in bpy.data.objects:
        if obj.type != "MESH" or not any(modifier.type == "ARMATURE" and modifier.object == armature for modifier in obj.modifiers):
            continue
        for vertex in obj.data.vertices:
            total = sum(
                membership.weight
                for membership in vertex.groups
                if obj.vertex_groups[membership.group].name in deform_groups
            )
            if total <= 1.0e-8:
                unweighted.append({"object": obj.name, "vertex": vertex.index})
    return {
        "per_mesh": topology,
        "wire_edges": wire_edges,
        "invalid_non_manifold": invalid_non_manifold,
        "zero_area_faces": zero_area_faces,
        "inverted_faces": sum(item["faces"] for item in inverted),
        "inverted_closed_meshes": inverted,
        "unweighted_deform_vertices": len(unweighted),
        "unweighted_samples": unweighted[:50],
    }


def main():
    transaction = args()
    candidate = os.path.abspath(bpy.data.filepath)
    expected_candidate_prefix = os.path.normcase(os.path.abspath(transaction) + os.sep)
    if not os.path.normcase(candidate).startswith(expected_candidate_prefix):
        raise RuntimeError("Runtime test candidate is outside the transaction")
    source_hashes = {
        "head": sha256(HEAD_SOURCE),
        "anatomical": sha256(ANATOMICAL_SOURCE),
        "body": sha256(BODY_SOURCE),
    }
    if source_hashes != {"head": HEAD_SHA, "anatomical": ANATOMICAL_SHA, "body": BODY_SHA}:
        raise RuntimeError("An immutable source hash changed")

    armatures = [obj for obj in bpy.data.objects if obj.type == "ARMATURE"]
    if len(armatures) != 1 or armatures[0].name != "R2_Rig":
        raise RuntimeError("Expected one R2_Rig")
    armature = armatures[0]
    required_actions = sorted(set(CLIP_BY_STATE.values()))
    missing_actions = sorted(set(required_actions) - set(bpy.data.actions.keys()))
    if missing_actions:
        raise RuntimeError(f"Missing actions: {missing_actions}")

    reset_neutral(armature)
    initial_neutral = neutral_exact(armature)
    channel_results, channel_failures = test_channels(armature)
    combined_results, combined_failures = combined_tests(armature)
    reset_neutral(armature)
    final_neutral = neutral_exact(armature)
    topology = topology_and_weights(armature)

    failed_gates = []
    if not initial_neutral or not final_neutral:
        failed_gates.append("NeutralResetExact")
    if channel_failures or len(channel_results) != 24:
        failed_gates.append("ExpressionChannelsPreserved")
    if combined_failures:
        failed_gates.append("CombinedDeformationRuntimeTests")
    if topology["wire_edges"] != 0:
        failed_gates.append("WireEdges")
    if topology["invalid_non_manifold"] != 0:
        failed_gates.append("InvalidNonManifold")
    if topology["unweighted_deform_vertices"] != 0:
        failed_gates.append("UnweightedDeformVertices")
    if topology["inverted_faces"] != 0:
        failed_gates.append("InvertedFaces")
    if topology["zero_area_faces"] != 0:
        failed_gates.append("ZeroAreaFaces")
    if len(bpy.data.images) != 0:
        failed_gates.append("CreatedImages")

    report = {
        "schema_version": 1,
        "audit_kind": "R2_FULL_CHARACTER_COMBINED_DEFORMATION_RUNTIME_TESTS",
        "execution_status": "COMPLETED" if not failed_gates else "FAILED",
        "technical_verdict": "APROVADO" if not failed_gates else "REPROVADO",
        "candidate": candidate,
        "candidate_sha256": sha256(candidate),
        "source_hashes": source_hashes,
        "runtime_states_tested": len(CLIP_BY_STATE),
        "animation_clips_tested": len(required_actions),
        "expression_channels_preserved": len(channel_results) if not channel_failures else len([item for item in channel_results.values() if item["passed"]]),
        "expression_level_samples": 24 * len(LEVELS),
        "channel_results": channel_results,
        "channel_failures": channel_failures,
        "combined_results": combined_results,
        "combined_failures": combined_failures,
        "neutral_reset_exact": initial_neutral and final_neutral,
        "head_body_attachment_stable": armature.data.bones["head"].parent.name == "neck",
        "topology": topology,
        "official_sources_unchanged": True,
        "created_images": 0,
        "failed_gates": failed_gates,
    }
    write_json(os.path.join(transaction, "R2_FULL_CHARACTER_RUNTIME_TESTS.json.tmp"), report)
    print("R2_FULL_CHARACTER_RUNTIME_TESTS=" + json.dumps({
        "ExecutionStatus": report["execution_status"],
        "TechnicalVerdict": report["technical_verdict"],
        "RuntimeStatesTested": report["runtime_states_tested"],
        "AnimationClipsTested": report["animation_clips_tested"],
        "ExpressionChannelsPreserved": report["expression_channels_preserved"],
        "ExpressionLevelSamples": report["expression_level_samples"],
        "AllPairTransitions": report["combined_results"].get("all_pair_transitions", {}).get("tested"),
        "NeutralResetExact": report["neutral_reset_exact"],
        "WireEdges": topology["wire_edges"],
        "InvalidNonManifold": topology["invalid_non_manifold"],
        "UnweightedDeformVertices": topology["unweighted_deform_vertices"],
        "InvertedFaces": topology["inverted_faces"],
        "ZeroAreaFaces": topology["zero_area_faces"],
        "FailedGates": failed_gates,
        "CreatedImages": 0,
    }, sort_keys=True))
    if failed_gates:
        raise RuntimeError("Runtime gates failed: " + ", ".join(failed_gates))


try:
    main()
except Exception:
    traceback.print_exc()
    raise
