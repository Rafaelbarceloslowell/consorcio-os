import bpy
import json
import os
from mathutils import Vector


TARGETS = [
    "R2_Hoodie_Torso",
    "R2_Hoodie_Sleeve_L",
    "R2_Hoodie_Sleeve_R",
    "R2_Hood",
    "R2_Head_Fur",
    "R2_Head_Face",
    "R2_Head_Face_Foundation",
    "R2_Hand_L",
    "R2_Hand_R",
    "R2_Pants",
    "R2_Shoe_L",
    "R2_Shoe_R",
]


def rounded(value):
    return round(float(value), 6)


def vec(value):
    return [rounded(component) for component in value]


def bounds(obj):
    points = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    minimum = Vector((min(p.x for p in points), min(p.y for p in points), min(p.z for p in points)))
    maximum = Vector((max(p.x for p in points), max(p.y for p in points), max(p.z for p in points)))
    return {"minimum": vec(minimum), "maximum": vec(maximum), "dimensions": vec(maximum - minimum)}


def extrema(obj):
    vertices = [(vertex.index, obj.matrix_world @ vertex.co) for vertex in obj.data.vertices]
    result = {}
    for axis, index in (("x", 0), ("y", 1), ("z", 2)):
        low = min(vertices, key=lambda item: item[1][index])
        high = max(vertices, key=lambda item: item[1][index])
        result[axis] = {
            "minimum": {"index": low[0], "world": vec(low[1])},
            "maximum": {"index": high[0], "world": vec(high[1])},
        }
    return result


def material_details(material):
    result = {
        "name": material.name,
        "diffuse_color": vec(material.diffuse_color),
        "use_nodes": bool(material.use_nodes),
        "surface_render_method": getattr(material, "surface_render_method", None),
        "use_backface_culling": bool(material.use_backface_culling),
    }
    if material.use_nodes:
        principled = next((node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
        if principled:
            result["principled"] = {
                name: vec(socket.default_value) if hasattr(socket.default_value, "__len__") else rounded(socket.default_value)
                for name in ("Base Color", "Metallic", "Roughness", "Alpha", "Emission Color", "Emission Strength")
                for socket in [principled.inputs.get(name)]
                if socket is not None
            }
    return result


def main():
    report = {
        "blend": os.path.abspath(bpy.data.filepath),
        "objects": {},
        "materials": [material_details(material) for material in sorted(bpy.data.materials, key=lambda item: item.name)],
        "images": [image.name for image in bpy.data.images],
        "actions": [action.name for action in bpy.data.actions],
    }
    for name in TARGETS:
        obj = bpy.data.objects.get(name)
        if obj is None:
            report["objects"][name] = None
            continue
        report["objects"][name] = {
            "bounds": bounds(obj),
            "extrema": extrema(obj),
            "vertices": len(obj.data.vertices),
            "faces": len(obj.data.polygons),
            "material_slots": [slot.material.name if slot.material else None for slot in obj.material_slots],
            "modifiers": [{"name": modifier.name, "type": modifier.type, "object": getattr(getattr(modifier, "object", None), "name", None)} for modifier in obj.modifiers],
        }
    print("R2_MATERIAL_BRANDING_PROBE=" + json.dumps(report, sort_keys=True))


if __name__ == "__main__":
    main()
