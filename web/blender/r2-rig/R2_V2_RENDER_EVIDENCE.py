import bpy
import hashlib
import json
import math
import os
import sys
from mathutils import Vector


def parse_arguments():
    values = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    if len(values) < 2:
        raise RuntimeError("Usage: -- <output-directory> <coverage> [view,...]")
    views = values[2].split(",") if len(values) > 2 else ["front", "three_quarter", "back", "left_arm_close", "dashboard"]
    return os.path.abspath(values[0]), float(values[1]), views


def sha256_file(path):
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest().upper()


def renderable_points(root_objects=None):
    roots = set(root_objects or [])
    points = []
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH" or obj.hide_render:
            continue
        if roots and obj.name not in roots:
            continue
        points.extend(obj.matrix_world @ Vector(corner) for corner in obj.bound_box)
    if not points:
        raise RuntimeError("No renderable points found")
    return points


def center_of(points):
    minimum = Vector(tuple(min(point[axis] for point in points) for axis in range(3)))
    maximum = Vector(tuple(max(point[axis] for point in points) for axis in range(3)))
    return (minimum + maximum) * 0.5


def aim_camera(camera, points, direction, coverage, aspect, fov_degrees=32.0, target=None):
    target = target or center_of(points)
    camera_side = Vector(direction).normalized()
    world_up = Vector((0.0, 0.0, 1.0))
    right = camera_side.cross(world_up).normalized()
    up = right.cross(camera_side).normalized()
    relative = [point - target for point in points]
    half_width = max(abs(point.dot(right)) for point in relative)
    half_height = max(abs(point.dot(up)) for point in relative)
    camera_depth = max(point.dot(camera_side) for point in relative)
    vertical_tangent = math.tan(math.radians(fov_degrees) * 0.5)
    horizontal_tangent = vertical_tangent * aspect
    distance_from_front = max(
        half_height / max(1.0e-6, vertical_tangent * coverage),
        half_width / max(1.0e-6, horizontal_tangent * coverage),
    )
    distance = distance_from_front + camera_depth
    camera.location = target + camera_side * distance
    camera.rotation_euler = (target - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera.data.sensor_fit = "VERTICAL"
    camera.data.angle = math.radians(fov_degrees)
    camera.data.dof.use_dof = False
    return {
        "target": [round(value, 9) for value in target],
        "position": [round(value, 9) for value in camera.location],
        "distance": round(distance, 9),
        "coverage": coverage,
        "aspect": aspect,
        "fov_degrees": fov_degrees,
    }


def add_area_light(name, location, color, energy, size, target):
    data = bpy.data.lights.new(name=name, type="AREA")
    data.energy = energy
    data.color = color
    data.shape = "DISK"
    data.size = size
    obj = bpy.data.objects.new(name, data)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = (target - obj.location).to_track_quat("-Z", "Y").to_euler()
    return obj


def configure_scene(target):
    scene = bpy.context.scene
    for obj in list(scene.objects):
        if obj.name.startswith("R2_V2_Evidence_"):
            bpy.data.objects.remove(obj, do_unlink=True)
    camera_data = bpy.data.cameras.new("R2_V2_Evidence_Camera")
    camera = bpy.data.objects.new("R2_V2_Evidence_Camera", camera_data)
    scene.collection.objects.link(camera)
    scene.camera = camera
    add_area_light("R2_V2_Evidence_Key", Vector((3.4, -4.0, 4.2)), (1.0, 0.95, 0.88), 720.0, 3.5, target)
    add_area_light("R2_V2_Evidence_Fill", Vector((-3.2, -2.4, 1.7)), (0.62, 0.78, 0.68), 260.0, 4.0, target)
    add_area_light("R2_V2_Evidence_Rim", Vector((1.5, 3.2, 3.5)), (0.34, 0.70, 0.48), 520.0, 3.0, target)
    world = scene.world or bpy.data.worlds.new("R2_V2_Evidence_World")
    scene.world = world
    world.use_nodes = True
    background = world.node_tree.nodes.get("Background")
    background.inputs["Color"].default_value = (0.0065, 0.012, 0.009, 1.0)
    background.inputs["Strength"].default_value = 0.16
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.film_transparent = False
    scene.render.resolution_percentage = 100
    scene.render.image_settings.color_depth = "8"
    scene.render.use_file_extension = True
    scene.render.film_transparent = False
    scene.render.image_settings.compression = 15
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = 0.35
    return camera


def main():
    output_directory, coverage, views = parse_arguments()
    os.makedirs(output_directory, exist_ok=True)
    all_points = renderable_points()
    character_target = center_of(all_points)
    camera = configure_scene(character_target)
    patch_name = "R2_Brand_LeftArm_GorillaMark_R2_Patch"
    sleeve_name = "R2_Hoodie_Sleeve_L"
    patch_points = renderable_points([patch_name, sleeve_name])
    patch_target = center_of(renderable_points([patch_name]))
    specifications = {
        "front": {"direction": (0.0, -1.0, 0.02), "resolution": (700, 850), "points": all_points, "target": character_target, "coverage": coverage},
        "three_quarter": {"direction": (1.0, -1.55, 0.08), "resolution": (760, 850), "points": all_points, "target": character_target, "coverage": coverage},
        "back": {"direction": (0.0, 1.0, 0.02), "resolution": (700, 850), "points": all_points, "target": character_target, "coverage": coverage},
        "left_arm_close": {"direction": (1.2, -0.85, 0.12), "resolution": (800, 800), "points": patch_points, "target": patch_target, "coverage": 0.62},
        "dashboard": {"direction": (0.0, -1.0, 0.02), "resolution": (960, 540), "points": all_points, "target": character_target, "coverage": coverage},
    }
    outputs = []
    for view in views:
        if view not in specifications:
            raise RuntimeError(f"Unknown evidence view: {view}")
        spec = specifications[view]
        width, height = spec["resolution"]
        bpy.context.scene.render.resolution_x = width
        bpy.context.scene.render.resolution_y = height
        aspect = width / height
        framing = aim_camera(camera, spec["points"], spec["direction"], spec["coverage"], aspect, target=spec["target"])
        path = os.path.join(output_directory, f"R2_V2_{view}.png")
        bpy.context.scene.render.filepath = path
        bpy.ops.render.render(write_still=True)
        outputs.append({
            "view": view,
            "path": path,
            "sha256": sha256_file(path),
            "size_bytes": os.path.getsize(path),
            "resolution": [width, height],
            "framing": framing,
        })
        print(f"Rendered {view}: {path}")
    report = {
        "schema_version": 1,
        "blend": os.path.abspath(bpy.data.filepath),
        "blend_sha256": sha256_file(bpy.data.filepath),
        "renderer": "BLENDER_EEVEE_NEXT",
        "view_transform": bpy.context.scene.view_settings.view_transform,
        "look": bpy.context.scene.view_settings.look,
        "exposure": bpy.context.scene.view_settings.exposure,
        "outputs": outputs,
    }
    report_path = os.path.join(output_directory, "R2_V2_RENDER_EVIDENCE.json")
    with open(report_path + ".tmp", "w", encoding="utf-8", newline="\n") as handle:
        json.dump(report, handle, indent=2, sort_keys=True)
        handle.write("\n")
    os.replace(report_path + ".tmp", report_path)


if __name__ == "__main__":
    main()
