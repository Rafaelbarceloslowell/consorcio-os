import bpy
import hashlib
import json
import math
import os
import sys
from collections import defaultdict, deque


def arguments():
    values = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    if len(values) != 1:
        raise RuntimeError("Usage: -- <output-json>")
    return os.path.abspath(values[0])


def sha256_file(path):
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest().upper()


def linear_to_srgb(value):
    value = max(0.0, min(1.0, float(value)))
    return 12.92 * value if value <= 0.0031308 else 1.055 * (value ** (1.0 / 2.4)) - 0.055


def rgba_hex(rgba):
    return "#" + "".join(f"{round(linear_to_srgb(channel) * 255):02X}" for channel in rgba[:3])


def principled_values(material):
    if not material or not material.use_nodes or not material.node_tree:
        return None
    principled = next((node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
    if not principled:
        return None
    base = tuple(principled.inputs["Base Color"].default_value)
    return {
        "base_color_linear_rgba": [round(value, 9) for value in base],
        "base_color_srgb_hex": rgba_hex(base),
        "roughness": round(float(principled.inputs["Roughness"].default_value), 9),
        "metallic": round(float(principled.inputs["Metallic"].default_value), 9),
        "alpha": round(float(principled.inputs["Alpha"].default_value), 9),
    }


def object_bounds(obj):
    points = [obj.matrix_world @ vertex.co for vertex in obj.data.vertices]
    if not points:
        return None
    minimum = [min(point[index] for point in points) for index in range(3)]
    maximum = [max(point[index] for point in points) for index in range(3)]
    return {
        "minimum": [round(value, 9) for value in minimum],
        "maximum": [round(value, 9) for value in maximum],
        "dimensions": [round(maximum[index] - minimum[index], 9) for index in range(3)],
        "center": [round((maximum[index] + minimum[index]) * 0.5, 9) for index in range(3)],
    }


def components_by_material(obj):
    polygons_by_material = defaultdict(list)
    for polygon in obj.data.polygons:
        polygons_by_material[polygon.material_index].append(polygon)
    result = []
    for material_index, polygons in sorted(polygons_by_material.items()):
        vertex_to_polygons = defaultdict(set)
        polygon_by_index = {polygon.index: polygon for polygon in polygons}
        for polygon in polygons:
            for vertex_index in polygon.vertices:
                vertex_to_polygons[vertex_index].add(polygon.index)
        unseen = set(polygon_by_index)
        while unseen:
            first = unseen.pop()
            component_polygons = {first}
            queue = deque([first])
            while queue:
                current = queue.popleft()
                for vertex_index in polygon_by_index[current].vertices:
                    for neighbor in vertex_to_polygons[vertex_index]:
                        if neighbor in unseen:
                            unseen.remove(neighbor)
                            component_polygons.add(neighbor)
                            queue.append(neighbor)
            vertices = sorted({vertex for polygon_index in component_polygons for vertex in polygon_by_index[polygon_index].vertices})
            world = [obj.matrix_world @ obj.data.vertices[index].co for index in vertices]
            minimum = [min(point[axis] for point in world) for axis in range(3)]
            maximum = [max(point[axis] for point in world) for axis in range(3)]
            slot = obj.material_slots[material_index] if material_index < len(obj.material_slots) else None
            result.append({
                "material_index": material_index,
                "material": slot.material.name if slot and slot.material else None,
                "polygon_count": len(component_polygons),
                "vertex_count": len(vertices),
                "minimum": [round(value, 9) for value in minimum],
                "maximum": [round(value, 9) for value in maximum],
                "dimensions": [round(maximum[axis] - minimum[axis], 9) for axis in range(3)],
                "center": [round((maximum[axis] + minimum[axis]) * 0.5, 9) for axis in range(3)],
            })
    return result


def main():
    output = arguments()
    blend = os.path.abspath(bpy.data.filepath)
    objects = list(bpy.data.objects)
    meshes = [obj for obj in objects if obj.type == "MESH"]
    renderables = [obj for obj in meshes if not obj.hide_render]
    missing = [
        obj.name
        for obj in renderables
        if len(obj.material_slots) == 0 or any(slot.material is None for slot in obj.material_slots)
    ]
    assigned = defaultdict(set)
    for obj in meshes:
        for slot in obj.material_slots:
            if slot.material:
                assigned[slot.material.name].add(obj.name)
    armatures = [obj for obj in objects if obj.type == "ARMATURE"]
    if len(armatures) != 1:
        raise RuntimeError(f"Expected one armature, found {len(armatures)}")
    armature = armatures[0]
    patch = bpy.data.objects.get("R2_Brand_LeftArm_GorillaMark_R2_Patch")
    if not patch or patch.type != "MESH":
        raise RuntimeError("Official left-arm branding patch is missing")
    report = {
        "schema_version": 1,
        "source_blend": blend,
        "source_blend_sha256": sha256_file(blend),
        "source_blend_size_bytes": os.path.getsize(blend),
        "object_count": len(objects),
        "object_type_counts": {kind: sum(obj.type == kind for obj in objects) for kind in sorted({obj.type for obj in objects})},
        "mesh_count": len(meshes),
        "renderable_mesh_count": len(renderables),
        "renderable_meshes_without_material": missing,
        "material_count": len(bpy.data.materials),
        "materials": [
            {
                "name": material.name,
                "users": material.users,
                "assigned_objects": sorted(assigned.get(material.name, [])),
                "pbr": principled_values(material),
            }
            for material in sorted(bpy.data.materials, key=lambda item: item.name)
        ],
        "armature": armature.name,
        "bone_count": len(armature.data.bones),
        "bones": sorted(bone.name for bone in armature.data.bones),
        "morph_target_occurrences": sum(max(0, len(obj.data.shape_keys.key_blocks) - 1) for obj in meshes if obj.data.shape_keys),
        "actions": sorted(action.name for action in bpy.data.actions),
        "images": [image.name for image in bpy.data.images],
        "libraries": [library.filepath for library in bpy.data.libraries],
        "cameras": [
            {"name": obj.name, "location": [round(value, 9) for value in obj.location], "fov_degrees": round(math.degrees(obj.data.angle), 6)}
            for obj in objects if obj.type == "CAMERA"
        ],
        "lights": [
            {"name": obj.name, "type": obj.data.type, "energy": obj.data.energy, "color": [round(value, 9) for value in obj.data.color], "location": [round(value, 9) for value in obj.location]}
            for obj in objects if obj.type == "LIGHT"
        ],
        "patch": {
            "bounds": object_bounds(patch),
            "material_slots": [slot.material.name if slot.material else None for slot in patch.material_slots],
            "vertex_count": len(patch.data.vertices),
            "polygon_count": len(patch.data.polygons),
            "components": components_by_material(patch),
            "modifiers": [{"name": modifier.name, "type": modifier.type, "object": getattr(getattr(modifier, "object", None), "name", None)} for modifier in patch.modifiers],
        },
    }
    os.makedirs(os.path.dirname(output), exist_ok=True)
    temporary = output + ".tmp"
    with open(temporary, "w", encoding="utf-8", newline="\n") as handle:
        json.dump(report, handle, indent=2, sort_keys=True)
        handle.write("\n")
    os.replace(temporary, output)
    print(json.dumps({
        "SourceBlend": blend,
        "SourceBlendSHA256": report["source_blend_sha256"],
        "Objects": report["object_count"],
        "Meshes": report["mesh_count"],
        "RenderableMeshes": report["renderable_mesh_count"],
        "Materials": report["material_count"],
        "Bones": report["bone_count"],
        "MorphTargets": report["morph_target_occurrences"],
        "Animations": len(report["actions"]),
        "MissingMaterials": len(missing),
        "Output": output,
    }, indent=2))


if __name__ == "__main__":
    main()
