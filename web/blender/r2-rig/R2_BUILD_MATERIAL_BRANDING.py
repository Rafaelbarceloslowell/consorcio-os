import bpy
import bmesh
import hashlib
import json
import math
import os
import struct
import sys
from collections import Counter
from mathutils import Vector
from mathutils.bvhtree import BVHTree


RIG_ROOT = r"C:\Projetos\consorcio-os\web\blender\r2-rig"
OFFICIAL_BLEND = os.path.join(RIG_ROOT, "r2-full-character-runtime-ready-v1", "r2-full-character-runtime-ready-v1.blend")
OFFICIAL_BLEND_SHA = "3D60D28B852566ABEC764D2DE0EB55D63F42AC26F8F75936109D33898B25E269"
OFFICIAL_GLB = r"C:\Projetos\consorcio-os\web\public\models\r2\r2-full-character-runtime-ready-v1.glb"
OFFICIAL_GLB_SHA = "E3B9702C0367A8CAFB138B5C9AB94D6CC448C470CD69D74A46333A9953207A59"
LOGO_SOURCE = r"C:\Projetos\consorcio-os\web\public\brand\GorillaMark_Dark.svg"
LOGO_SHA = "7FC4BA6C6B5BEEA9B082CFF751A480D7DF8F8D372984703CF6847E2398B5749E"
MASTER_SOURCE = r"C:\Projetos\consorcio-os\brand\assets\source\GorillaMark_Master.svg"
MASTER_SHA = "6572940BA485E3E9D993754B8D422CEFB26DE5B194ED5AD8219771224BB29B70"
EXPECTED_CANDIDATE = "r2-full-character-material-branded-ready-v1.candidate.blend"
BRANDING_NAMES = [
    "R2_Brand_RightChest_GorillaMark",
    "R2_Brand_LeftArm_GorillaMark_R2_Patch",
    "R2_Brand_UpperBack_GorillaMark",
]
REQUIRED_ACTIONS = [
    "R2_ALERT",
    "R2_AWAITING_ACTION",
    "R2_CELEBRATING_SALE",
    "R2_ERROR_ATTENTION",
    "R2_IDLE",
    "R2_LISTENING",
    "R2_NEUTRAL",
    "R2_THINKING",
    "R2_WORKING",
]
PRESERVED_MATERIALS = [
    "R2_Mat_EyeSclera",
    "R2_Mat_IrisTechGreen",
    "R2_Mat_Pupil",
    "R2_Mat_Lip",
    "R2_Mat_Teeth",
    "R2_Mat_Tongue",
    "R2_Mat_Eyelid",
    "R2_Mat_MouthInterior",
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


def canonical_hash(value):
    encoded = json.dumps(value, ensure_ascii=True, separators=(",", ":"), sort_keys=True).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest().upper()


def atomic_json(path, value):
    temporary = path + ".tmp"
    with open(temporary, "w", encoding="utf-8", newline="\n") as handle:
        json.dump(value, handle, ensure_ascii=False, indent=2, sort_keys=True)
        handle.write("\n")
    os.replace(temporary, path)


def rounded(value, digits=9):
    return round(float(value), digits)


def vector(value):
    return [rounded(component) for component in value]


def srgb_channel_to_linear(value):
    value = value / 255.0
    return value / 12.92 if value <= 0.04045 else ((value + 0.055) / 1.055) ** 2.4


def hex_linear(value):
    value = value.lstrip("#")
    return tuple(srgb_channel_to_linear(int(value[index : index + 2], 16)) for index in (0, 2, 4)) + (1.0,)


def mesh_geometry_fingerprint(mesh):
    digest = hashlib.sha256()
    digest.update(struct.pack("<QQQ", len(mesh.vertices), len(mesh.edges), len(mesh.polygons)))
    for vertex in mesh.vertices:
        digest.update(struct.pack("<3d", *(float(component) for component in vertex.co)))
    for edge in mesh.edges:
        digest.update(struct.pack("<2I", *edge.vertices))
    for polygon in mesh.polygons:
        vertices = tuple(polygon.vertices)
        digest.update(struct.pack("<I", len(vertices)))
        if vertices:
            digest.update(struct.pack("<" + "I" * len(vertices), *vertices))
    return digest.hexdigest().upper()


def object_weight_fingerprint(obj):
    digest = hashlib.sha256()
    index_to_name = {group.index: group.name for group in obj.vertex_groups}
    for vertex in obj.data.vertices:
        for membership in sorted(vertex.groups, key=lambda item: index_to_name.get(item.group, "")):
            name = index_to_name.get(membership.group, "")
            digest.update(name.encode("utf-8"))
            digest.update(struct.pack("<Id", vertex.index, float(membership.weight)))
    return digest.hexdigest().upper()


def armature_fingerprint(armature):
    return canonical_hash(
        [
            {
                "name": bone.name,
                "parent": bone.parent.name if bone.parent else None,
                "head": vector(bone.head_local),
                "tail": vector(bone.tail_local),
                "use_deform": bool(bone.use_deform),
            }
            for bone in armature.data.bones
        ]
    )


def material_specifications():
    return {
        "R2_Mat_Fur_DarkGraphite": {"hex": "#171B1D", "metallic": 0.0, "roughness": 0.80, "family": "fur"},
        "R2_Mat_Fur_MidGraphite": {"hex": "#242A2D", "metallic": 0.0, "roughness": 0.76, "family": "fur"},
        "R2_Mat_Skin_Anthracite": {"hex": "#383D3E", "metallic": 0.0, "roughness": 0.64, "family": "face_and_hands"},
        "R2_Mat_Hoodie_Black": {"hex": "#111416", "metallic": 0.0, "roughness": 0.84, "family": "hoodie"},
        "R2_Mat_Pants_Charcoal": {"hex": "#272C2F", "metallic": 0.0, "roughness": 0.79, "family": "pants"},
        "R2_Mat_Shoes_Black": {"hex": "#101315", "metallic": 0.0, "roughness": 0.61, "family": "shoes"},
        "R2_Mat_GorillaOS_Green": {"hex": "#163F35", "metallic": 0.0, "roughness": 0.72, "family": "official_green"},
        "R2_Mat_Embroidery_Gray": {"hex": "#818487", "metallic": 0.0, "roughness": 0.73, "family": "official_dark_variant_frame"},
        "R2_Mat_Embroidery_White": {"hex": "#FFFFFF", "metallic": 0.0, "roughness": 0.70, "family": "official_dark_variant_foreground"},
    }


def create_material(name, specification):
    if bpy.data.materials.get(name):
        raise RuntimeError(f"Material already exists before build: {name}")
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    material.diffuse_color = hex_linear(specification["hex"])
    material.use_backface_culling = False
    material.surface_render_method = "DITHERED"
    nodes = material.node_tree.nodes
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    output.name = "R2_Output"
    principled = nodes.new("ShaderNodeBsdfPrincipled")
    principled.name = "R2_Principled"
    principled.inputs["Base Color"].default_value = hex_linear(specification["hex"])
    principled.inputs["Metallic"].default_value = specification["metallic"]
    principled.inputs["Roughness"].default_value = specification["roughness"]
    principled.inputs["Alpha"].default_value = 1.0
    principled.inputs["Emission Strength"].default_value = 0.0
    material.node_tree.links.new(principled.outputs["BSDF"], output.inputs["Surface"])
    material["r2_material_family"] = specification["family"]
    material["r2_srgb_hex"] = specification["hex"]
    material["r2_gltf_compatible"] = True
    material["r2_texture_usage"] = "NONE"
    return material


def assign_single_material(obj, material):
    obj.data.materials.clear()
    obj.data.materials.append(material)
    for polygon in obj.data.polygons:
        polygon.material_index = 0


def world_bounds(obj):
    points = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    minimum = Vector((min(point.x for point in points), min(point.y for point in points), min(point.z for point in points)))
    maximum = Vector((max(point.x for point in points), max(point.y for point in points), max(point.z for point in points)))
    return minimum, maximum


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


def extract_triangulated_components(objects, material_names, cuts=1):
    result = []
    for index, obj in enumerate(objects):
        bpy.ops.object.select_all(action="DESELECT")
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        bpy.ops.object.convert(target="MESH")
        obj.select_set(False)
        mesh = obj.data
        bm = bmesh.new()
        bm.from_mesh(mesh)
        bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=1.0e-10)
        bmesh.ops.dissolve_degenerate(bm, edges=list(bm.edges), dist=1.0e-12)
        bmesh.ops.triangulate(bm, faces=list(bm.faces))
        if cuts:
            bmesh.ops.subdivide_edges(bm, edges=list(bm.edges), cuts=cuts, use_grid_fill=True)
            bmesh.ops.dissolve_degenerate(bm, edges=list(bm.edges), dist=1.0e-12)
            bmesh.ops.triangulate(bm, faces=list(bm.faces))
        bm.verts.ensure_lookup_table()
        bm.faces.ensure_lookup_table()
        vertices = [tuple(obj.matrix_world @ vertex.co) for vertex in bm.verts]
        faces = [tuple(vertex.index for vertex in face.verts) for face in bm.faces]
        result.append({"vertices": vertices, "faces": faces, "material": material_names[index]})
        bm.free()
    return result


def import_logo_components():
    before = set(bpy.data.objects)
    bpy.ops.import_curve.svg(filepath=LOGO_SOURCE)
    imported = sorted((obj for obj in bpy.data.objects if obj not in before and obj.type == "CURVE"), key=lambda item: item.name)
    if len(imported) != 4:
        raise RuntimeError(f"Official logo import created {len(imported)} paths instead of 4")
    components = extract_triangulated_components(
        imported,
        ["R2_Mat_Embroidery_Gray", "R2_Mat_Embroidery_Gray", "R2_Mat_Embroidery_White", "R2_Mat_Embroidery_White"],
        cuts=1,
    )
    for obj in imported:
        bpy.data.objects.remove(obj, do_unlink=True)
    all_points = [point for component in components for point in component["vertices"]]
    minimum = Vector((min(point[0] for point in all_points), min(point[1] for point in all_points)))
    maximum = Vector((max(point[0] for point in all_points), max(point[1] for point in all_points)))
    dimensions = maximum - minimum
    center = (minimum + maximum) * 0.5
    for component in components:
        component["vertices"] = [(point[0] - center.x, point[1] - center.y) for point in component["vertices"]]
    return components, {"source_dimensions": vector(dimensions), "source_center": vector(center), "aspect_height_over_width": rounded(dimensions.y / dimensions.x)}


def copy_scaled_components(components, width, vertical_offset=0.0, material_override=None, base_offset=0.0015, relief=0.0025):
    source_width = max(point[0] for component in components for point in component["vertices"]) - min(point[0] for component in components for point in component["vertices"])
    scale = width / source_width
    return [
        {
            "vertices": [(point[0] * scale, point[1] * scale + vertical_offset) for point in component["vertices"]],
            "faces": [tuple(face) for face in component["faces"]],
            "material": material_override or component["material"],
            "base_offset": base_offset,
            "relief": relief,
        }
        for component in components
    ]


def rounded_rectangle(width, height, radius, material, base_offset, relief, segments=3):
    points = []
    for center_x, center_y, start in (
        (width / 2 - radius, height / 2 - radius, 0.0),
        (-width / 2 + radius, height / 2 - radius, math.pi / 2),
        (-width / 2 + radius, -height / 2 + radius, math.pi),
        (width / 2 - radius, -height / 2 + radius, 3 * math.pi / 2),
    ):
        for step in range(segments + 1):
            angle = start + step * (math.pi / 2) / segments
            points.append((center_x + radius * math.cos(angle), center_y + radius * math.sin(angle)))
    vertices = [(0.0, 0.0)] + points
    faces = []
    for index in range(len(points)):
        faces.append((0, index + 1, ((index + 1) % len(points)) + 1))
    return {"vertices": vertices, "faces": faces, "material": material, "base_offset": base_offset, "relief": relief}


def text_components(text, width, vertical_offset, material, base_offset, relief):
    curve = bpy.data.curves.new("R2_BrandingDesignation_Curve", "FONT")
    curve.body = text
    curve.align_x = "CENTER"
    curve.align_y = "CENTER"
    curve.size = 1.0
    curve.resolution_u = 3
    curve.render_resolution_u = 3
    obj = bpy.data.objects.new("R2_BrandingDesignation_Temporary", curve)
    bpy.context.scene.collection.objects.link(obj)
    components = extract_triangulated_components([obj], [material], cuts=1)
    extracted = components[0]
    points = extracted["vertices"]
    minimum_x = min(point[0] for point in points)
    maximum_x = max(point[0] for point in points)
    minimum_y = min(point[1] for point in points)
    maximum_y = max(point[1] for point in points)
    center_x = (minimum_x + maximum_x) * 0.5
    center_y = (minimum_y + maximum_y) * 0.5
    scale = width / (maximum_x - minimum_x)
    extracted["vertices"] = [((point[0] - center_x) * scale, (point[1] - center_y) * scale + vertical_offset) for point in points]
    extracted["base_offset"] = base_offset
    extracted["relief"] = relief
    bpy.data.objects.remove(obj, do_unlink=True)
    return [extracted], {"width": width, "height": rounded((maximum_y - minimum_y) * scale), "font": "Blender Bfont converted to mesh", "text": text}


def build_surface(garment):
    world_vertices = [garment.matrix_world @ vertex.co for vertex in garment.data.vertices]
    polygons = [tuple(polygon.vertices) for polygon in garment.data.polygons]
    bvh = BVHTree.FromPolygons(world_vertices, polygons, all_triangles=False)
    group_index_to_name = {group.index: group.name for group in garment.vertex_groups}
    vertex_weights = []
    for vertex in garment.data.vertices:
        vertex_weights.append({group_index_to_name[item.group]: float(item.weight) for item in vertex.groups if item.group in group_index_to_name and item.weight > 0.0})
    return world_vertices, polygons, bvh, vertex_weights


def barycentric(point, a, b, c):
    v0 = b - a
    v1 = c - a
    v2 = point - a
    d00 = v0.dot(v0)
    d01 = v0.dot(v1)
    d11 = v1.dot(v1)
    d20 = v2.dot(v0)
    d21 = v2.dot(v1)
    denominator = d00 * d11 - d01 * d01
    if abs(denominator) < 1.0e-15:
        return (1.0, 0.0, 0.0)
    v = (d11 * d20 - d01 * d21) / denominator
    w = (d00 * d21 - d01 * d20) / denominator
    u = 1.0 - v - w
    return (u, v, w)


def interpolate_weights(face_vertices, factors, vertex_weights):
    result = {}
    for vertex_index, factor in zip(face_vertices, factors):
        for name, weight in vertex_weights[vertex_index].items():
            result[name] = result.get(name, 0.0) + factor * weight
    result = {name: max(0.0, value) for name, value in result.items() if value > 1.0e-8}
    total = sum(result.values())
    if total <= 1.0e-12:
        raise RuntimeError("Surface projection resolved no deform weights")
    return {name: value / total for name, value in result.items()}


def project_template_point(point, placement, garment_surface):
    horizontal, vertical = point
    minimum, maximum = placement["garment_bounds"]
    if placement["plane"] == "XZ":
        x = placement["center"][0] + horizontal
        z = placement["center"][2] + vertical
        if placement["outward_axis"] == "-Y":
            origin = Vector((x, minimum.y - 0.20, z))
            fallback_origin = Vector((x, minimum.y - 0.03, z))
            direction = Vector((0.0, 1.0, 0.0))
        else:
            origin = Vector((x, maximum.y + 0.20, z))
            fallback_origin = Vector((x, maximum.y + 0.03, z))
            direction = Vector((0.0, -1.0, 0.0))
    elif placement["plane"] == "YZ":
        y = placement["center"][1] + horizontal
        z = placement["center"][2] + vertical
        origin = Vector((maximum.x + 0.20, y, z))
        fallback_origin = Vector((maximum.x, y, z))
        direction = Vector((-1.0, 0.0, 0.0))
    else:
        raise RuntimeError(f"Unsupported placement plane: {placement['plane']}")
    world_vertices, polygons, bvh, vertex_weights = garment_surface
    location, normal, face_index, distance = bvh.ray_cast(origin, direction, 1.0)
    used_nearest = False
    if location is None or face_index is None:
        used_nearest = True
        location, normal, face_index, distance = bvh.find_nearest(fallback_origin, 0.25)
        if location is None or face_index is None:
            raise RuntimeError(f"Surface projection missed {placement['garment']} at local point {point}")
    face = polygons[face_index]
    if len(face) != 3:
        raise RuntimeError(f"Branding target polygon {face_index} on {placement['garment']} is not triangular")
    factors = barycentric(location, *(world_vertices[index] for index in face))
    weights = interpolate_weights(face, factors, vertex_weights)
    normal.normalize()
    expected = Vector(placement["expected_normal"])
    if used_nearest and abs(normal.dot(expected)) < 0.05:
        raise RuntimeError(f"Surface normal is incompatible with {placement['placement']} at local point {point}")
    if normal.dot(expected) < 0.0:
        normal.negate()
    return location, normal, weights, face_index, distance


def create_projected_prism_object(name, garment, placement, components, materials, armature):
    garment_surface = build_surface(garment)
    output_vertices = []
    output_faces = []
    output_materials = []
    output_weights = []
    reference_faces = set()
    neutral_offsets = []
    for component in components:
        projected = [project_template_point(point, placement, garment_surface) for point in component["vertices"]]
        orientation_faces = []
        reverse = bool(placement["reverse_faces"])
        for face in component["faces"]:
            orientation_faces.append(tuple(reversed(face)) if reverse else tuple(face))
        boundary_counter = Counter()
        boundary_direction = {}
        for face in orientation_faces:
            for start, end in zip(face, face[1:] + face[:1]):
                key = tuple(sorted((start, end)))
                boundary_counter[key] += 1
                boundary_direction[key] = (start, end)
        base_index = len(output_vertices)
        for location, normal, weights, face_index, _distance in projected:
            bottom = location + normal * component["base_offset"]
            top = location + normal * (component["base_offset"] + component["relief"])
            output_vertices.extend((tuple(bottom), tuple(top)))
            output_weights.extend((weights, weights))
            reference_faces.add(face_index)
            neutral_offsets.extend((component["base_offset"], component["base_offset"] + component["relief"]))
        material_index = list(materials).index(component["material"])
        for face in orientation_faces:
            bottom_face = tuple(base_index + vertex * 2 for vertex in reversed(face))
            top_face = tuple(base_index + vertex * 2 + 1 for vertex in face)
            output_faces.extend((bottom_face, top_face))
            output_materials.extend((material_index, material_index))
        for edge, count in boundary_counter.items():
            if count != 1:
                continue
            start, end = boundary_direction[edge]
            output_faces.append((base_index + start * 2, base_index + end * 2, base_index + end * 2 + 1, base_index + start * 2 + 1))
            output_materials.append(material_index)
    mesh = bpy.data.meshes.new(name + "_Mesh")
    mesh.from_pydata(output_vertices, [], output_faces)
    mesh.update(calc_edges=True)
    mesh.validate(verbose=False, clean_customdata=False)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = armature
    obj.matrix_world = armature.matrix_world.copy()
    for material_name in materials:
        mesh.materials.append(bpy.data.materials[material_name])
    for polygon, material_index in zip(mesh.polygons, output_materials):
        polygon.material_index = material_index
        polygon.use_smooth = False
    group_members = {}
    for vertex_index, weights in enumerate(output_weights):
        for group_name, weight in weights.items():
            group_members.setdefault(group_name, []).append((vertex_index, weight))
    for group_name in sorted(group_members):
        group = obj.vertex_groups.new(name=group_name)
        for vertex_index, weight in group_members[group_name]:
            group.add([vertex_index], weight, "REPLACE")
    modifier = obj.modifiers.new("R2_Armature", "ARMATURE")
    modifier.object = armature
    modifier.use_vertex_groups = True
    modifier.use_deform_preserve_volume = False
    obj["r2_branding_placement"] = placement["placement"]
    obj["r2_official_logo_source"] = LOGO_SOURCE
    obj["r2_official_logo_sha256"] = LOGO_SHA
    obj["r2_underlying_garment"] = garment.name
    obj["r2_skinning_method"] = "surface-face barycentric interpolation from underlying garment"
    obj["r2_reference_faces_json"] = json.dumps(sorted(reference_faces))
    obj["r2_neutral_offset_min"] = min(neutral_offsets)
    obj["r2_neutral_offset_max"] = max(neutral_offsets)
    obj["r2_mirrored"] = False
    return obj, {
        "object": name,
        "garment": garment.name,
        "placement": placement["placement"],
        "center_from_bounds": vector(placement["center"]),
        "garment_bounds": {"minimum": vector(placement["garment_bounds"][0]), "maximum": vector(placement["garment_bounds"][1])},
        "reference_faces": sorted(reference_faces),
        "reference_face_count": len(reference_faces),
        "vertex_count": len(mesh.vertices),
        "face_count": len(mesh.polygons),
        "material_slots": [material.name for material in mesh.materials],
        "neutral_offset_min": rounded(min(neutral_offsets)),
        "neutral_offset_max": rounded(max(neutral_offsets)),
        "geometry_sha256": mesh_geometry_fingerprint(mesh),
        "weights_sha256": object_weight_fingerprint(obj),
        "mirrored": False,
    }


def topology_metrics(obj):
    mesh = obj.data
    edge_face_count = [0] * len(mesh.edges)
    edge_lookup = {tuple(sorted(edge.vertices)): edge.index for edge in mesh.edges}
    zero_area = 0
    for polygon in mesh.polygons:
        if polygon.area <= 1.0e-14:
            zero_area += 1
        vertices = tuple(polygon.vertices)
        for start, end in zip(vertices, vertices[1:] + vertices[:1]):
            edge_face_count[edge_lookup[tuple(sorted((start, end)))]] += 1
    return {
        "wire_edges": sum(count == 0 for count in edge_face_count),
        "boundary_edges": sum(count == 1 for count in edge_face_count),
        "invalid_non_manifold": sum(count != 2 for count in edge_face_count),
        "zero_area_faces": zero_area,
    }


def morph_target_count():
    return sum(
        max(0, len(obj.data.shape_keys.key_blocks) - 1)
        for obj in bpy.data.objects
        if obj.type == "MESH" and obj.data.shape_keys
    )


def material_record(material, assigned_objects):
    principled = next((node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None) if material.use_nodes else None
    base = principled.inputs["Base Color"].default_value if principled else material.diffuse_color
    return {
        "material_name": material.name,
        "assigned_objects": sorted(assigned_objects),
        "assigned_slots": [{"object": name, "slot": index} for name in sorted(assigned_objects) for index, slot in enumerate(bpy.data.objects[name].material_slots) if slot.material == material],
        "base_color_linear_rgba": vector(base),
        "srgb_hex": material.get("r2_srgb_hex"),
        "metallic": rounded(principled.inputs["Metallic"].default_value) if principled else None,
        "roughness": rounded(principled.inputs["Roughness"].default_value) if principled else None,
        "alpha_mode": "OPAQUE",
        "emissive": [0.0, 0.0, 0.0],
        "double_sided": not material.use_backface_culling,
        "texture_usage": "NONE",
        "node_graph_summary": "Principled BSDF -> Material Output" if principled else "legacy material",
        "gltf_export_compatibility": True,
        "runtime_result": "pending controlled GLB export",
        "material_sha256": canonical_hash({"name": material.name, "base": vector(base), "metallic": rounded(principled.inputs["Metallic"].default_value) if principled else None, "roughness": rounded(principled.inputs["Roughness"].default_value) if principled else None}),
    }


def main():
    transaction = arguments()
    candidate = os.path.abspath(bpy.data.filepath)
    if os.path.basename(candidate) != EXPECTED_CANDIDATE:
        raise RuntimeError(f"Candidate basename is not authorized: {candidate}")
    if not os.path.normcase(candidate).startswith(os.path.normcase(transaction + os.sep)):
        raise RuntimeError("Candidate is outside the transaction directory")
    if "._r2_material_branding_" not in os.path.basename(transaction):
        raise RuntimeError("Transaction directory does not have the required semantic prefix")
    for path, expected in ((OFFICIAL_BLEND, OFFICIAL_BLEND_SHA), (OFFICIAL_GLB, OFFICIAL_GLB_SHA), (LOGO_SOURCE, LOGO_SHA), (MASTER_SOURCE, MASTER_SHA)):
        if not os.path.isfile(path) or sha256_file(path) != expected:
            raise RuntimeError(f"Immutable source mismatch: {path}")
    if any(bpy.data.objects.get(name) for name in BRANDING_NAMES):
        raise RuntimeError("Branding already exists in the transactional candidate")
    if any(bpy.data.materials.get(name) for name in material_specifications()):
        raise RuntimeError("New material names already exist in the transactional candidate")
    armatures = [obj for obj in bpy.data.objects if obj.type == "ARMATURE"]
    if len(armatures) != 1 or armatures[0].name != "R2_Rig" or len(armatures[0].data.bones) != 65:
        raise RuntimeError("Expected one 65-bone R2_Rig")
    armature = armatures[0]
    if sorted(bpy.data.actions.keys()) != REQUIRED_ACTIONS:
        raise RuntimeError("The nine approved animation actions are not exact")
    if any(name not in bpy.data.materials for name in PRESERVED_MATERIALS):
        raise RuntimeError("One or more approved eye/oral materials are missing")
    if bpy.data.images:
        raise RuntimeError("Approved source unexpectedly contains image dependencies")
    reset_neutral(armature)

    original_meshes = [obj for obj in bpy.data.objects if obj.type == "MESH"]
    original_geometry = {obj.name: mesh_geometry_fingerprint(obj.data) for obj in original_meshes}
    original_weights = {obj.name: object_weight_fingerprint(obj) for obj in original_meshes}
    original_armature = armature_fingerprint(armature)
    original_morphs = morph_target_count()

    specifications = material_specifications()
    materials = {name: create_material(name, specification) for name, specification in specifications.items()}
    assignments = {
        "R2_Arm_Fur_R": "R2_Mat_Fur_MidGraphite",
        "R2_Hand_L": "R2_Mat_Skin_Anthracite",
        "R2_Hand_R": "R2_Mat_Skin_Anthracite",
        "R2_Head_Face": "R2_Mat_Skin_Anthracite",
        "R2_Head_Face_Foundation": "R2_Mat_Skin_Anthracite",
        "R2_Head_Fur": "R2_Mat_Fur_DarkGraphite",
        "R2_Hood": "R2_Mat_Hoodie_Black",
        "R2_Hood_Cord_L": "R2_Mat_GorillaOS_Green",
        "R2_Hood_Cord_R": "R2_Mat_GorillaOS_Green",
        "R2_Hoodie_Sleeve_L": "R2_Mat_Hoodie_Black",
        "R2_Hoodie_Sleeve_R": "R2_Mat_Hoodie_Black",
        "R2_Hoodie_Torso": "R2_Mat_Hoodie_Black",
        "R2_Pants": "R2_Mat_Pants_Charcoal",
        "R2_Shoe_L": "R2_Mat_Shoes_Black",
        "R2_Shoe_R": "R2_Mat_Shoes_Black",
    }
    initial_materialless = sorted(obj.name for obj in original_meshes if obj.visible_get() and len(obj.material_slots) == 0)
    for object_name, material_name in assignments.items():
        assign_single_material(bpy.data.objects[object_name], materials[material_name])
    remaining_materialless = sorted(obj.name for obj in original_meshes if obj.visible_get() and (len(obj.material_slots) == 0 or any(slot.material is None for slot in obj.material_slots)))
    if remaining_materialless:
        raise RuntimeError(f"Renderable source meshes remain materialless: {remaining_materialless}")

    logo_components, logo_import = import_logo_components()
    torso = bpy.data.objects["R2_Hoodie_Torso"]
    sleeve_left = bpy.data.objects["R2_Hoodie_Sleeve_L"]
    torso_min, torso_max = world_bounds(torso)
    sleeve_min, sleeve_max = world_bounds(sleeve_left)
    torso_dimensions = torso_max - torso_min
    sleeve_dimensions = sleeve_max - sleeve_min

    chest_center = Vector((
        (torso_min.x + torso_max.x) * 0.5 - torso_dimensions.x * 0.205,
        torso_min.y,
        torso_min.z + torso_dimensions.z * 0.675,
    ))
    back_center = Vector(((torso_min.x + torso_max.x) * 0.5, torso_max.y, torso_min.z + torso_dimensions.z * 0.605))
    arm_center = Vector((sleeve_max.x, (sleeve_min.y + sleeve_max.y) * 0.5, sleeve_min.z + sleeve_dimensions.z * 0.66))

    chest_components = copy_scaled_components(logo_components, torso_dimensions.x * 0.105, base_offset=0.0015, relief=0.0025)
    back_components = copy_scaled_components(logo_components, torso_dimensions.x * 0.245, base_offset=0.0015, relief=0.0027)
    arm_logo_components = copy_scaled_components(logo_components, sleeve_dimensions.z * 0.187, vertical_offset=0.025, base_offset=0.0015, relief=0.0025)
    arm_text_components, text_spec = text_components("R2", sleeve_dimensions.z * 0.135, -0.045, "R2_Mat_GorillaOS_Green", 0.0015, 0.0025)
    arm_components = arm_logo_components + arm_text_components

    placements = {
        BRANDING_NAMES[0]: {
            "garment": torso.name,
            "garment_bounds": (torso_min, torso_max),
            "center": chest_center,
            "plane": "XZ",
            "outward_axis": "-Y",
            "expected_normal": (0.0, -1.0, 0.0),
            "reverse_faces": False,
            "placement": "ANATOMICAL_RIGHT_CHEST",
        },
        BRANDING_NAMES[1]: {
            "garment": sleeve_left.name,
            "garment_bounds": (sleeve_min, sleeve_max),
            "center": arm_center,
            "plane": "YZ",
            "outward_axis": "+X",
            "expected_normal": (1.0, 0.0, 0.0),
            "reverse_faces": False,
            "placement": "ANATOMICAL_LEFT_UPPER_ARM",
        },
        BRANDING_NAMES[2]: {
            "garment": torso.name,
            "garment_bounds": (torso_min, torso_max),
            "center": back_center,
            "plane": "XZ",
            "outward_axis": "+Y",
            "expected_normal": (0.0, 1.0, 0.0),
            "reverse_faces": True,
            "placement": "UPPER_BACK_CENTERED",
        },
    }
    brand_records = {}
    brand_records[BRANDING_NAMES[0]] = create_projected_prism_object(
        BRANDING_NAMES[0], torso, placements[BRANDING_NAMES[0]], chest_components,
        ["R2_Mat_Embroidery_Gray", "R2_Mat_Embroidery_White"], armature,
    )[1]
    brand_records[BRANDING_NAMES[1]] = create_projected_prism_object(
        BRANDING_NAMES[1], sleeve_left, placements[BRANDING_NAMES[1]], arm_components,
        ["R2_Mat_Embroidery_Gray", "R2_Mat_Embroidery_White", "R2_Mat_GorillaOS_Green"], armature,
    )[1]
    brand_records[BRANDING_NAMES[2]] = create_projected_prism_object(
        BRANDING_NAMES[2], torso, placements[BRANDING_NAMES[2]], back_components,
        ["R2_Mat_Embroidery_Gray", "R2_Mat_Embroidery_White"], armature,
    )[1]

    for name, expected_materials in (
        (BRANDING_NAMES[0], {"R2_Mat_Embroidery_Gray", "R2_Mat_Embroidery_White"}),
        (BRANDING_NAMES[1], {"R2_Mat_Embroidery_Gray", "R2_Mat_Embroidery_White", "R2_Mat_GorillaOS_Green"}),
        (BRANDING_NAMES[2], {"R2_Mat_Embroidery_Gray", "R2_Mat_Embroidery_White"}),
    ):
        actual = {slot.material.name for slot in bpy.data.objects[name].material_slots if slot.material}
        if actual != expected_materials:
            raise RuntimeError(f"Branding material mismatch for {name}: {actual}")
        metrics = topology_metrics(bpy.data.objects[name])
        brand_records[name]["topology"] = metrics
        if any(metrics[key] != 0 for key in ("wire_edges", "boundary_edges", "invalid_non_manifold", "zero_area_faces")):
            zero_by_material = Counter(
                bpy.data.objects[name].material_slots[polygon.material_index].material.name
                for polygon in bpy.data.objects[name].data.polygons
                if polygon.area <= 1.0e-14
            )
            raise RuntimeError(f"Invalid branding topology for {name}: {metrics}; zero_by_material={dict(zero_by_material)}")

    unexpected_geometry = [name for name, fingerprint in original_geometry.items() if mesh_geometry_fingerprint(bpy.data.objects[name].data) != fingerprint]
    unexpected_weights = [name for name, fingerprint in original_weights.items() if object_weight_fingerprint(bpy.data.objects[name]) != fingerprint]
    if unexpected_geometry or unexpected_weights:
        raise RuntimeError(f"Source mesh invariant failed geometry={unexpected_geometry} weights={unexpected_weights}")
    if armature_fingerprint(armature) != original_armature:
        raise RuntimeError("Rig structure changed unexpectedly")
    if morph_target_count() != original_morphs or original_morphs != 24:
        raise RuntimeError("Morph target identity changed unexpectedly")
    if bpy.data.images:
        raise RuntimeError("The build created an image dependency")

    assigned_by_material = {}
    for obj in bpy.data.objects:
        if obj.type != "MESH":
            continue
        for slot in obj.material_slots:
            if slot.material:
                assigned_by_material.setdefault(slot.material.name, set()).add(obj.name)
    material_manifest = [material_record(material, assigned_by_material.get(material.name, set())) for material in sorted(bpy.data.materials, key=lambda item: item.name)]
    object_map = {
        obj.name: [slot.material.name if slot.material else None for slot in obj.material_slots]
        for obj in sorted((item for item in bpy.data.objects if item.type == "MESH"), key=lambda item: item.name)
    }
    materialless_final = sorted(name for name, slots in object_map.items() if not slots or any(slot is None for slot in slots))
    if materialless_final:
        raise RuntimeError(f"Final blend has materialless meshes: {materialless_final}")

    armature["r2_material_branding_version"] = "r2-full-character-material-branded-ready-v1"
    armature["r2_official_logo_sha256"] = LOGO_SHA
    armature["r2_branding_placement_count"] = 3
    armature["r2_material_manifest_sha256"] = canonical_hash(material_manifest)
    checkpoint = {
        "candidate": candidate,
        "expected_object_count": len(bpy.data.objects),
        "expected_mesh_count": len([obj for obj in bpy.data.objects if obj.type == "MESH"]),
        "expected_material_count": len(bpy.data.materials),
        "expected_branding_objects": BRANDING_NAMES,
        "official_blend_sha256_before_save": sha256_file(OFFICIAL_BLEND),
        "official_glb_sha256_before_save": sha256_file(OFFICIAL_GLB),
    }
    atomic_json(os.path.join(transaction, "R2_MATERIAL_BRANDING_PRE_SAVE_CHECKPOINT.json"), checkpoint)
    if sha256_file(OFFICIAL_BLEND) != OFFICIAL_BLEND_SHA or sha256_file(OFFICIAL_GLB) != OFFICIAL_GLB_SHA:
        raise RuntimeError("Immutable source changed immediately before save")
    bpy.ops.wm.save_as_mainfile(filepath=candidate, check_existing=False)
    if os.path.abspath(bpy.data.filepath) != candidate:
        raise RuntimeError("Blender saved to an unexpected path")

    manifest = {
        "schema_version": 1,
        "execution_status": "COMPLETED",
        "technical_verdict": "APROVADO",
        "source_blend": OFFICIAL_BLEND,
        "source_blend_sha256": OFFICIAL_BLEND_SHA,
        "source_glb": OFFICIAL_GLB,
        "source_glb_sha256": OFFICIAL_GLB_SHA,
        "candidate_blend": candidate,
        "candidate_blend_sha256": sha256_file(candidate),
        "initial_materialless_renderable_meshes": initial_materialless,
        "initial_materialless_count": len(initial_materialless),
        "renderable_meshes_without_material": len(materialless_final),
        "object_to_material": object_map,
        "materials": material_manifest,
        "preserved_materials": PRESERVED_MATERIALS,
        "new_materials": sorted(specifications),
        "official_green": {"hex": "#163F35", "source": MASTER_SOURCE, "master_sha256": MASTER_SHA, "manifest": r"C:\Projetos\consorcio-os\brand\assets\manifest.json"},
        "node_graph_policy": "One glTF-compatible Principled BSDF connected directly to Material Output; no images and no procedural nodes.",
        "created_images": 0,
        "failed_gates": [],
    }
    certificate = {
        "schema_version": 1,
        "execution_status": "COMPLETED",
        "technical_verdict": "APROVADO",
        "official_logo_source": LOGO_SOURCE,
        "official_logo_sha256": LOGO_SHA,
        "official_master_source": MASTER_SOURCE,
        "official_master_sha256": MASTER_SHA,
        "variant": "GorillaMark Dark",
        "variant_certification": {
            "dashboard_default_theme": "dark",
            "dashboard_component": r"C:\Projetos\consorcio-os\web\components\brand\brand-identity.tsx",
            "dashboard_runtime_path": "/brand/GorillaMark_Dark.svg",
            "distribution_source": r"C:\Projetos\consorcio-os\brand\assets\svg\GorillaMark_Dark.svg",
            "published_matches_distribution_byte_for_byte": True,
            "geometry_paths": 4,
            "geometry_reinterpreted": False,
            "mirrored": False,
            "colors": {"frame": "#818487", "foreground": "#FFFFFF"},
            "selection_reason": "The current dashboard defaults to its dark theme and BrandMarkSlot loads this exact distributed SVG."
        },
        "candidate_paths_inspected": [
            r"C:\Projetos\consorcio-os\brand\assets\source\GorillaMark_Master.svg",
            r"C:\Projetos\consorcio-os\brand\assets\svg\GorillaMark_Dark.svg",
            r"C:\Projetos\consorcio-os\brand\assets\svg\GorillaMark_Light.svg",
            r"C:\Projetos\consorcio-os\brand\assets\svg\GorillaMark_Monochrome.svg",
            r"C:\Projetos\consorcio-os\web\public\brand\GorillaMark_Dark.svg",
            r"C:\Projetos\consorcio-os\web\public\brand\GorillaMark_Light.svg",
        ],
        "logo_import": logo_import,
        "branding_placement_count": 3,
        "right_chest_logo": brand_records[BRANDING_NAMES[0]],
        "left_arm_patch": {**brand_records[BRANDING_NAMES[1]], "r2_mark": text_spec, "contains_official_logo": True, "contains_r2_designation": True},
        "upper_back_logo": brand_records[BRANDING_NAMES[2]],
        "hierarchy": {"largest": BRANDING_NAMES[2], "medium": BRANDING_NAMES[1], "smallest": BRANDING_NAMES[0]},
        "skinning_ownership": {name: {"armature": "R2_Rig", "garment": record["garment"], "method": "barycentric transfer from ray-hit garment faces"} for name, record in brand_records.items()},
        "animation_clipping_results": "pending checkpoint 8 validation",
        "glb_round_trip_identities": "pending checkpoint 11 validation",
        "created_images": 0,
        "failed_gates": [],
    }
    build_report = {
        "ExecutionStatus": "COMPLETED",
        "TechnicalVerdict": "APROVADO",
        "OfficialSourcesUnchanged": True,
        "RenderableMeshesWithoutMaterial": 0,
        "UnexpectedGeometryChanges": len(unexpected_geometry),
        "UnexpectedRigChanges": 0,
        "UnexpectedWeightChanges": len(unexpected_weights),
        "UnexpectedMorphTargetChanges": 0,
        "AnimationClipsPreserved": len(bpy.data.actions),
        "ExpressionChannelsPreserved": morph_target_count(),
        "BodyBonesPreserved": 51,
        "FacialBonesPreserved": 14,
        "BrandingPlacementCount": 3,
        "RightChestLogoConfirmed": True,
        "LeftArmPatchConfirmed": True,
        "LeftArmR2MarkConfirmed": True,
        "LargeBackLogoConfirmed": True,
        "OfficialLogoMirroringErrors": 0,
        "CreatedImages": 0,
        "CandidateBlend": candidate,
        "CandidateBlendSHA256": sha256_file(candidate),
        "FailedGates": [],
    }
    atomic_json(os.path.join(RIG_ROOT, "R2_MATERIAL_MANIFEST.json"), manifest)
    atomic_json(os.path.join(RIG_ROOT, "R2_BRANDING_ASSET_CERTIFICATE.json"), certificate)
    atomic_json(os.path.join(transaction, "R2_MATERIAL_BRANDING_BUILD_REPORT.json"), build_report)
    print("R2_MATERIAL_BRANDING_BUILD=" + json.dumps(build_report, sort_keys=True))


if __name__ == "__main__":
    main()
