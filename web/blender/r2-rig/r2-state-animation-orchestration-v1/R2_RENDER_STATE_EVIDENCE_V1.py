import bpy
import hashlib
import importlib.util
import json
import os
import sys


def load_render_support():
    source = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "R2_V2_RENDER_EVIDENCE.py"))
    spec = importlib.util.spec_from_file_location("r2_v2_render_support", source)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def sha256(path):
    digest = hashlib.sha256()
    with open(path, "rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest().upper()


def reset_morphs():
    for obj in bpy.data.objects:
        shape_keys = getattr(obj.data, "shape_keys", None)
        if not shape_keys:
            continue
        for block in shape_keys.key_blocks:
            if block.name != "Basis":
                block.value = 0.0


def set_morph(object_name, morph_name, value):
    obj = bpy.data.objects.get(object_name)
    shape_keys = getattr(obj.data, "shape_keys", None) if obj else None
    block = shape_keys.key_blocks.get(morph_name) if shape_keys else None
    if block:
        block.value = value


def main():
    arguments = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    if len(arguments) != 1:
        raise RuntimeError("Usage: blender <official.blend> --background --python script.py -- <evidence-directory>")
    output_directory = os.path.abspath(arguments[0])
    os.makedirs(output_directory, exist_ok=True)
    support = load_render_support()
    points = support.renderable_points()
    target = support.center_of(points)
    camera = support.configure_scene(target)
    scene = bpy.context.scene
    armature = next(obj for obj in bpy.data.objects if obj.type == "ARMATURE")
    armature.animation_data_create()
    state_map = {
        "neutral": ("R2_NEUTRAL", {}),
        "idle": ("R2_IDLE", {}),
        "working": ("R2_WORKING", {("R2_Head_Face_Foundation", "EXP_BROW_FROWN"): 0.10}),
        "listening": ("R2_LISTENING", {("R2_Head_Face_Foundation", "EXP_BROW_RAISE"): 0.08}),
        "thinking": ("R2_THINKING", {("R2_Head_Face_Foundation", "EXP_BROW_RAISE"): 0.18, ("R2_LipUpper", "EXP_MOUTH_NARROW"): 0.05, ("R2_LipLower", "EXP_MOUTH_NARROW"): 0.05}),
        "awaiting_action": ("R2_AWAITING_ACTION", {("R2_Head_Face_Foundation", "EXP_BROW_RAISE"): 0.12}),
        "alert": ("R2_ALERT", {("R2_Head_Face_Foundation", "EXP_BROW_RAISE"): 0.25, ("R2_Head_Face_Foundation", "EXP_BROW_FROWN"): 0.08}),
        "speaking": ("R2_IDLE", {("R2_Head_Face_Foundation", "EXP_CHEEK_RAISE"): 0.05}),
        "celebrating_sale": ("R2_CELEBRATING_SALE", {("R2_LipUpper", "EXP_SMILE"): 0.65, ("R2_LipLower", "EXP_SMILE"): 0.65, ("R2_Head_Face_Foundation", "EXP_CHEEK_RAISE"): 0.25}),
        "error_attention": ("R2_ERROR_ATTENTION", {("R2_LipUpper", "EXP_FROWN"): 0.28, ("R2_LipLower", "EXP_FROWN"): 0.28, ("R2_Head_Face_Foundation", "EXP_BROW_FROWN"): 0.45}),
    }
    jobs = [(state, state, False, (640, 720)) for state in state_map]
    jobs.extend([
        ("reduced_motion_error_attention", "error_attention", True, (640, 720)),
        ("narrow_working", "working", False, (390, 844)),
    ])
    outputs = []
    for output_name, state, reduced_motion, resolution in jobs:
        clip_name, morphs = state_map[state]
        action = bpy.data.actions.get(clip_name)
        if not action:
            raise RuntimeError(f"Missing action: {clip_name}")
        armature.animation_data.action = action
        start, end = action.frame_range
        frame = start if reduced_motion else start + (end - start) * 0.5
        scene.frame_set(round(frame))
        reset_morphs()
        for (object_name, morph_name), value in morphs.items():
            set_morph(object_name, morph_name, value)
        width, height = resolution
        scene.render.resolution_x = width
        scene.render.resolution_y = height
        support.aim_camera(camera, points, (0.0, -1.0, 0.02), 0.72, width / height, target=target)
        path = os.path.join(output_directory, f"R2_STATE_{output_name}.png")
        scene.render.filepath = path
        bpy.ops.render.render(write_still=True)
        outputs.append({
            "state": state,
            "clip": clip_name,
            "reducedMotion": reduced_motion,
            "frame": round(frame),
            "resolution": [width, height],
            "path": path,
            "sha256": sha256(path),
            "sizeBytes": os.path.getsize(path),
        })
        print(f"Rendered {output_name}: {path}")
    report = {
        "schemaVersion": 1,
        "sourceBlend": os.path.abspath(bpy.data.filepath),
        "sourceBlendSha256": sha256(bpy.data.filepath),
        "readOnly": True,
        "renderer": scene.render.engine,
        "outputs": outputs,
    }
    with open(os.path.join(output_directory, "R2_STATE_EVIDENCE.json"), "w", encoding="utf-8") as destination:
        json.dump(report, destination, indent=2, ensure_ascii=False)
        destination.write("\n")


if __name__ == "__main__":
    main()
