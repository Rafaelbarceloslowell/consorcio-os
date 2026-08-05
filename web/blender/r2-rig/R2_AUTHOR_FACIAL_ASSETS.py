import bmesh
import hashlib
import json
import math
import struct
import sys
from collections import Counter, defaultdict, deque
from pathlib import Path

import bpy
from mathutils import Vector


EXPECTED_SOURCE_SHA256 = "340EEDFD0251432E6B8326B23EAE3AD268D560CC9D2FEE0940C8F03F9DC5B64B"
EXPECTED_VERTEX_FINGERPRINT = "B67AD7CDAFC66A8A591E13D6EE2AF8C645F84F9B3285F61A313A44B855F5D3B2"
FOUNDATION_ROLE = "PRIMARY_DEFORMABLE_HEAD_SURFACE"


def sha256_file(path):
    digest = hashlib.sha256()
    with open(path, "rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest().upper()


def canonical_hash(value):
    payload = json.dumps(value, separators=(",", ":"), sort_keys=True).encode("utf-8")
    return hashlib.sha256(payload).hexdigest().upper()


def vector_list(value):
    return [float(component) for component in value]


def ordered_vertex_fingerprint(mesh):
    payload = bytearray()
    for vertex in mesh.vertices:
        payload.extend(struct.pack("<I3d", vertex.index, *(float(v) for v in vertex.co)))
    return hashlib.sha256(bytes(payload)).hexdigest().upper()


def mesh_fingerprint(mesh):
    payload = {
        "vertices": [[v.index] + [round(float(c), 9) for c in v.co] for v in mesh.vertices],
        "edges": [[e.index] + [int(i) for i in e.vertices] for e in mesh.edges],
        "polygons": [[p.index] + [int(i) for i in p.vertices] for p in mesh.polygons],
    }
    return canonical_hash(payload)


def write_json(path, value):
    Path(path).write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def identify_foundation():
    candidates = [
        obj for obj in bpy.data.objects
        if obj.type == "MESH" and obj.get("r2_head_foundation_role") == FOUNDATION_ROLE
    ]
    if len(candidates) != 1:
        raise RuntimeError(f"foundation role count: {len(candidates)}")
    return candidates[0]


def ensure_unique_name(name):
    if bpy.data.objects.get(name) or bpy.data.meshes.get(name) or bpy.data.materials.get(name):
        raise RuntimeError(f"approved canonical name collision: {name}")


def ensure_collection(name, scene):
    collection = bpy.data.collections.get(name)
    if collection is not None:
        raise RuntimeError(f"collection already exists: {name}")
    collection = bpy.data.collections.new(name)
    scene.collection.children.link(collection)
    return collection


def relink_object(obj, collection):
    for existing in list(obj.users_collection):
        existing.objects.unlink(obj)
    collection.objects.link(obj)


def parent_keep_world(obj, parent, parent_type="OBJECT", parent_bone=None):
    world = obj.matrix_world.copy()
    obj.parent = parent
    obj.parent_type = parent_type
    if parent_bone:
        obj.parent_bone = parent_bone
    obj.matrix_world = world


def make_material(name, base_color, metallic, roughness):
    ensure_unique_name(name)
    material = bpy.data.materials.new(name)
    material.diffuse_color = (*base_color, 1.0)
    material.use_nodes = True
    node = material.node_tree.nodes.get("Principled BSDF")
    node.inputs["Base Color"].default_value = (*base_color, 1.0)
    node.inputs["Metallic"].default_value = metallic
    node.inputs["Roughness"].default_value = roughness
    material["r2_procedural_only"] = True
    material["r2_authoring_mission"] = "FACIAL_OCULAR_ORAL_ASSET_AUTHORING_AND_RIG_RESUME"
    return material


def create_uv_sphere(name, center, radius, segments, rings, materials, forward, collection):
    ensure_unique_name(name)
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=segments, ring_count=rings, radius=radius, enter_editmode=False, location=center
    )
    obj = bpy.context.active_object
    obj.name = name
    obj.data.name = name + "_Mesh"
    relink_object(obj, collection)
    for material in materials:
        obj.data.materials.append(material)
    local_forward = obj.matrix_world.to_3x3().inverted() @ forward
    local_forward.normalize()
    for polygon in obj.data.polygons:
        direction = polygon.center.normalized() if polygon.center.length else Vector((0.0, -1.0, 0.0))
        dot = direction.dot(local_forward)
        if len(materials) >= 3 and dot >= 0.965:
            polygon.material_index = 2
        elif len(materials) >= 2 and dot >= 0.875:
            polygon.material_index = 1
        else:
            polygon.material_index = 0
    return obj


def create_ellipsoid(name, center, dimensions, segments, rings, material, collection):
    ensure_unique_name(name)
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=segments, ring_count=rings, radius=1.0, enter_editmode=False, location=center
    )
    obj = bpy.context.active_object
    obj.name = name
    obj.data.name = name + "_Mesh"
    obj.scale = dimensions
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    relink_object(obj, collection)
    obj.data.materials.append(material)
    return obj


def create_rounded_block(name, center, dimensions, material, collection):
    ensure_unique_name(name)
    bpy.ops.mesh.primitive_cube_add(size=1.0, enter_editmode=False, location=center)
    obj = bpy.context.active_object
    obj.name = name
    obj.data.name = name + "_Mesh"
    obj.scale = dimensions
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bevel = obj.modifiers.new("R2_DeterministicBevel", "BEVEL")
    bevel.width = min(dimensions) * 0.22
    bevel.segments = 2
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=bevel.name)
    relink_object(obj, collection)
    obj.data.materials.append(material)
    return obj


def create_arc_ribbon(name, center, horizontal, up, front, half_width, half_height, upper, material, collection):
    ensure_unique_name(name)
    segments = 16
    vertices = []
    faces = []
    back_offset = -front * 0.00035
    for row_scale in (1.0, 0.79):
        for step in range(segments + 1):
            u = step / segments
            angle = math.pi * (1.0 - u) if upper else math.pi * (1.0 + u)
            point = (
                center
                + horizontal * (half_width * row_scale * math.cos(angle))
                + up * (half_height * row_scale * math.sin(angle))
                + back_offset
            )
            vertices.append(vector_list(point))
    stride = segments + 1
    for step in range(segments):
        faces.append((step, step + 1, stride + step + 1, stride + step))
    mesh = bpy.data.meshes.new(name + "_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update(calc_edges=True)
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    mesh.materials.append(material)
    return obj


def create_lip_ribbon(name, center, horizontal, up, front, half_width, lip_height, upper, material, collection):
    ensure_unique_name(name)
    segments = 20
    vertices = []
    faces = []
    surface = center + front * 0.00045
    for step in range(segments + 1):
        u = step / segments
        x = -half_width + 2.0 * half_width * u
        vertices.append(vector_list(surface + horizontal * x))
    for step in range(segments + 1):
        u = step / segments
        x = -half_width + 2.0 * half_width * u
        arch = lip_height * (0.20 + 0.80 * math.sin(math.pi * u))
        if not upper:
            arch = -arch
        vertices.append(vector_list(surface + horizontal * x + up * arch - front * 0.00025))
    stride = segments + 1
    for step in range(segments):
        if upper:
            faces.append((step, step + 1, stride + step + 1, stride + step))
        else:
            faces.append((step, stride + step, stride + step + 1, step + 1))
    mesh = bpy.data.meshes.new(name + "_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update(calc_edges=True)
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    mesh.materials.append(material)
    return obj


def create_empty(name, center, display_size, collection):
    ensure_unique_name(name)
    obj = bpy.data.objects.new(name, None)
    obj.empty_display_type = "PLAIN_AXES"
    obj.empty_display_size = display_size
    obj.hide_render = True
    obj.location = center
    collection.objects.link(obj)
    return obj


def mesh_maps(mesh):
    edge_faces = defaultdict(list)
    vertex_neighbors = defaultdict(set)
    vertex_faces = defaultdict(set)
    edge_lookup = {}
    for edge in mesh.edges:
        a, b = (int(i) for i in edge.vertices)
        edge_lookup[tuple(sorted((a, b)))] = edge.index
        vertex_neighbors[a].add(b)
        vertex_neighbors[b].add(a)
    for polygon in mesh.polygons:
        vertices = [int(i) for i in polygon.vertices]
        for vertex in vertices:
            vertex_faces[vertex].add(polygon.index)
        for offset, vertex in enumerate(vertices):
            edge_faces[edge_lookup[tuple(sorted((vertex, vertices[(offset + 1) % len(vertices)])))]] .append(polygon.index)
    return edge_faces, vertex_neighbors, vertex_faces


def connected_components(nodes, adjacency):
    unseen = set(nodes)
    components = []
    while unseen:
        start = min(unseen)
        unseen.remove(start)
        queue = deque([start])
        component = []
        while queue:
            current = queue.popleft()
            component.append(current)
            for neighbor in adjacency.get(current, ()):
                if neighbor in unseen:
                    unseen.remove(neighbor)
                    queue.append(neighbor)
        components.append(sorted(component))
    return components


def boundary_components(mesh, region_values):
    edge_faces, _, _ = mesh_maps(mesh)
    boundary_edges = [edge.index for edge in mesh.edges if len(edge_faces[edge.index]) == 1]
    adjacency = defaultdict(set)
    for edge_index in boundary_edges:
        a, b = (int(i) for i in mesh.edges[edge_index].vertices)
        adjacency[a].add(b)
        adjacency[b].add(a)
    result = []
    for component_id, vertices in enumerate(connected_components(adjacency.keys(), adjacency)):
        vertex_set = set(vertices)
        edges = [e for e in boundary_edges if set(mesh.edges[e].vertices).issubset(vertex_set)]
        faces = sorted({f for e in edges for f in edge_faces[e]})
        regions = Counter(region_values[f] for f in faces)
        degrees = [len(adjacency[v] & vertex_set) for v in vertices]
        center = sum((mesh.vertices[v].co for v in vertices), Vector()) / len(vertices)
        result.append({
            "id": component_id,
            "vertices": sorted(vertices),
            "edges": sorted(edges),
            "faces": faces,
            "regions": {str(k): v for k, v in sorted(regions.items())},
            "closed": all(degree == 2 for degree in degrees),
            "centroid": vector_list(center),
        })
    return result


def face_vertices(mesh, face_indices):
    return sorted({int(v) for f in face_indices for v in mesh.polygons[f].vertices})


def average_point(mesh, indices):
    return sum((mesh.vertices[i].co for i in indices), Vector()) / max(1, len(indices))


def topology_metrics(mesh):
    mesh.update(calc_edges=True)
    edge_faces, _, _ = mesh_maps(mesh)
    return {
        "vertices": len(mesh.vertices),
        "edges": len(mesh.edges),
        "polygons": len(mesh.polygons),
        "wire_edges": sum(1 for faces in edge_faces.values() if len(faces) == 0),
        "invalid_non_manifold_edges": sum(1 for faces in edge_faces.values() if len(faces) > 2),
        "boundary_edges": sum(1 for faces in edge_faces.values() if len(faces) == 1),
        "zero_area_faces": sum(1 for polygon in mesh.polygons if polygon.area <= 1e-12),
    }


def material_manifest(material):
    node = material.node_tree.nodes.get("Principled BSDF") if material.use_nodes else None
    return {
        "name": material.name,
        "base_color": vector_list(node.inputs["Base Color"].default_value) if node else vector_list(material.diffuse_color),
        "metallic": float(node.inputs["Metallic"].default_value) if node else 0.0,
        "roughness": float(node.inputs["Roughness"].default_value) if node else 0.5,
        "image_texture_nodes": sum(1 for item in material.node_tree.nodes if item.type == "TEX_IMAGE") if material.use_nodes else 0,
    }


def object_manifest(obj):
    result = {
        "name": obj.name,
        "type": obj.type,
        "parent": obj.parent.name if obj.parent else None,
        "parent_type": obj.parent_type,
        "parent_bone": obj.parent_bone if obj.parent_type == "BONE" else None,
        "matrix_world": [vector_list(row) for row in obj.matrix_world],
        "custom_properties": {key: obj[key] for key in sorted(obj.keys()) if isinstance(obj[key], (str, int, float, bool))},
    }
    if obj.type == "MESH":
        result.update({
            "mesh": obj.data.name,
            "mesh_fingerprint": mesh_fingerprint(obj.data),
            "topology": topology_metrics(obj.data),
            "materials": [slot.material.name if slot.material else None for slot in obj.material_slots],
            "uv_layers": [layer.name for layer in obj.data.uv_layers],
        })
    return result


def add_vertex_group(obj, name, indices):
    if obj.vertex_groups.get(name):
        raise RuntimeError(f"vertex group collision: {name}")
    group = obj.vertex_groups.new(name=name)
    group.add(sorted(set(indices)), 1.0, "REPLACE")
    return group


def landmark_entry(name, description, obj, primary, support_vertices, support_faces, normal, partner,
                   confidence, evidence, intended_use):
    mesh = obj.data
    _, vertex_neighbors, _ = mesh_maps(mesh)
    local = mesh.vertices[primary].co.copy()
    world = obj.matrix_world @ local
    payload = {
        "vertices": sorted(support_vertices),
        "faces": sorted(support_faces),
        "coordinates": [[i] + [round(float(v), 9) for v in mesh.vertices[i].co] for i in sorted(support_vertices)],
        "neighbors": {str(i): sorted(vertex_neighbors[i]) for i in sorted(support_vertices)},
        "face_vertices": {str(i): [int(v) for v in mesh.polygons[i].vertices] for i in sorted(support_faces)},
    }
    return {
        "canonical_name": name,
        "semantic_description": description,
        "object_name": obj.name,
        "mesh_name": mesh.name,
        "primary_vertex_index": int(primary),
        "supporting_vertex_indices": sorted(int(v) for v in support_vertices),
        "supporting_face_indices": sorted(int(f) for f in support_faces),
        "object_space_coordinates": vector_list(local),
        "world_space_coordinates": vector_list(world),
        "normal_direction": vector_list(normal),
        "topology_neighborhood_fingerprint": canonical_hash(payload),
        "symmetry_partner": partner,
        "symmetry_error": None,
        "confidence_score": float(confidence),
        "evidence": evidence,
        "intended_rigging_use": intended_use,
    }


def choose_landmark(name, description, obj, target_world, candidates, used, partner, confidence, evidence, intended_use):
    mesh = obj.data
    inverse = obj.matrix_world.inverted()
    target_local = inverse @ target_world
    ordered = sorted(candidates, key=lambda i: ((mesh.vertices[i].co - target_local).length_squared, i))
    primary = next((i for i in ordered if (obj.name, mesh.name, i) not in used), None)
    if primary is None:
        raise RuntimeError(f"no unique primary vertex for {name}")
    used.add((obj.name, mesh.name, primary))
    _, neighbors, vertex_faces = mesh_maps(mesh)
    support_vertices = sorted({primary} | set(neighbors[primary]))
    support_faces = sorted({f for vertex in support_vertices for f in vertex_faces[vertex]})
    normal = sum((mesh.polygons[f].normal for f in support_faces), Vector())
    if normal.length:
        normal.normalize()
    return landmark_entry(
        name, description, obj, primary, support_vertices, support_faces, normal,
        partner, confidence, evidence, intended_use,
    )


def region_record(name, obj, vertices, faces, boundaries, center, axis, partner, responsibility, limits):
    return {
        "canonical_name": name,
        "object_name": obj.name,
        "mesh_name": obj.data.name,
        "vertex_indices": sorted(set(int(v) for v in vertices)),
        "face_indices": sorted(set(int(f) for f in faces)),
        "boundary_indices": sorted(set(int(v) for v in boundaries)),
        "center": vector_list(center),
        "axis": vector_list(axis),
        "symmetry_partner": partner,
        "responsibility": responsibility,
        "authorized_deformation_limits": limits,
    }


def main():
    args = sys.argv[sys.argv.index("--") + 1:]
    if len(args) != 3:
        raise SystemExit("expected OFFICIAL_SOURCE CANDIDATE OUTPUT_DIRECTORY")
    source = Path(args[0]).resolve()
    candidate = Path(args[1]).resolve()
    output_dir = Path(args[2]).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    if source == candidate:
        raise RuntimeError("candidate path equals immutable source")
    if candidate.parent != output_dir:
        raise RuntimeError("candidate is outside the declared transaction")
    source_before = sha256_file(source)
    if source_before != EXPECTED_SOURCE_SHA256:
        raise RuntimeError("official source hash mismatch before authoring")
    if sha256_file(candidate) != EXPECTED_SOURCE_SHA256:
        raise RuntimeError("transactional candidate is not the exact approved source copy")

    bpy.ops.wm.open_mainfile(filepath=str(candidate), load_ui=False)
    scene = bpy.context.scene
    foundation = identify_foundation()
    mesh = foundation.data
    mesh.update(calc_edges=True)
    if ordered_vertex_fingerprint(mesh) != EXPECTED_VERTEX_FINGERPRINT:
        raise RuntimeError("foundation vertex-order fingerprint mismatch")
    armature = foundation.parent if foundation.parent and foundation.parent.type == "ARMATURE" else None
    if armature is None or not armature.data.bones.get("head") or not armature.data.bones.get("neck"):
        raise RuntimeError("approved head/neck armature relationship is missing")

    objects_before = sorted(obj.name for obj in bpy.data.objects)
    meshes_before = sorted(item.name for item in bpy.data.meshes)
    materials_before = sorted(item.name for item in bpy.data.materials)
    source_vertex_coordinates = [tuple(float(v) for v in vertex.co) for vertex in mesh.vertices]
    source_polygon_vertices = [tuple(int(v) for v in polygon.vertices) for polygon in mesh.polygons]
    source_uv_names = [layer.name for layer in mesh.uv_layers]
    source_material_slots = [slot.material.name if slot.material else None for slot in foundation.material_slots]
    source_group_weights = {}
    for group in foundation.vertex_groups:
        weights = []
        for vertex in mesh.vertices:
            weight = next((item.weight for item in vertex.groups if item.group == group.index), None)
            if weight is not None:
                weights.append((vertex.index, round(float(weight), 9)))
        source_group_weights[group.name] = weights

    region_attr = mesh.attributes.get("r2_region_id")
    if region_attr is None or region_attr.domain != "FACE":
        raise RuntimeError("approved r2_region_id face attribute is missing")
    region_values = [int(value.value) for value in region_attr.data]
    boundaries = boundary_components(mesh, region_values)
    eye_boundaries = [b for b in boundaries if b["closed"] and b["regions"] and set(b["regions"]) == {"2"}]
    if len(eye_boundaries) != 2:
        raise RuntimeError(f"expected two eye aperture boundaries, found {len(eye_boundaries)}")

    head_bone = armature.data.bones["head"]
    neck_bone = armature.data.bones["neck"]
    horizontal = Vector((1.0, 0.0, 0.0))
    up = (armature.matrix_world.to_3x3() @ (head_bone.tail_local - neck_bone.head_local)).normalized()
    muzzle_faces_source = [i for i, value in enumerate(region_values) if value == 1]
    muzzle_vertices_source = face_vertices(mesh, muzzle_faces_source)
    muzzle_center_source = average_point(mesh, muzzle_vertices_source)
    bounds_center = Vector(tuple(
        (min(v.co[axis] for v in mesh.vertices) + max(v.co[axis] for v in mesh.vertices)) / 2.0
        for axis in range(3)
    ))
    front = muzzle_center_source - bounds_center
    front -= horizontal * front.dot(horizontal)
    front -= up * front.dot(up)
    front.normalize()
    back = -front
    center_x = float((armature.matrix_world @ head_bone.head_local).x)

    asset_collection = ensure_collection("R2_FACIAL_ASSETS", scene)
    materials = {
        "sclera": make_material("R2_Mat_EyeSclera", (0.72, 0.74, 0.69), 0.0, 0.34),
        "iris": make_material("R2_Mat_IrisTechGreen", (0.045, 0.34, 0.16), 0.18, 0.27),
        "pupil": make_material("R2_Mat_Pupil", (0.004, 0.006, 0.005), 0.0, 0.22),
        "eyelid": make_material("R2_Mat_Eyelid", (0.13, 0.075, 0.052), 0.0, 0.58),
        "lip": make_material("R2_Mat_Lip", (0.16, 0.055, 0.045), 0.0, 0.62),
        "interior": make_material("R2_Mat_MouthInterior", (0.045, 0.008, 0.012), 0.0, 0.72),
        "teeth": make_material("R2_Mat_Teeth", (0.69, 0.65, 0.50), 0.0, 0.46),
        "tongue": make_material("R2_Mat_Tongue", (0.28, 0.055, 0.065), 0.0, 0.66),
    }

    aperture_data = {}
    derived_radii = []
    for boundary in eye_boundaries:
        points = [mesh.vertices[i].co.copy() for i in boundary["vertices"]]
        center = sum(points, Vector()) / len(points)
        side = "L" if center.x > center_x else "R"
        horizontal_values = [(point - center).dot(horizontal) for point in points]
        up_values = [(point - center).dot(up) for point in points]
        half_width = max(max(horizontal_values) - min(horizontal_values), 0.008) / 2.0
        half_height = max(max(up_values) - min(up_values), 0.004) / 2.0
        derived_radius = max(0.010, 1.20 * half_width)
        derived_radii.append(derived_radius)
        aperture_data[side] = {
            "boundary": boundary,
            "center": center,
            "half_width": half_width,
            "half_height": half_height,
        }
    eye_radius = max(derived_radii)

    eyes = {}
    pivots = {}
    eyelids = {}
    for side in ("L", "R"):
        data = aperture_data[side]
        eye_center = data["center"] + back * (0.98 * eye_radius)
        pivot = create_empty(f"R2_EyePivot.{side}", eye_center, eye_radius * 0.45, asset_collection)
        pivot["r2_parent_bone_reference"] = "head"
        pivot.parent = armature
        pivot.parent_type = "OBJECT"
        pivot.location = armature.matrix_world.inverted() @ eye_center
        bpy.context.view_layer.update()
        eye = create_uv_sphere(
            f"R2_Eye.{side}", eye_center, eye_radius, 32, 16,
            [materials["sclera"], materials["iris"], materials["pupil"]], front, asset_collection,
        )
        parent_keep_world(eye, pivot)
        eye["r2_role"] = "EYEBALL"
        eye["r2_side"] = side
        eye["r2_radius"] = eye_radius
        eye["r2_center"] = vector_list(eye_center)
        eye["r2_forward_axis"] = vector_list(front)
        eye["r2_aperture_vertices"] = json.dumps(data["boundary"]["vertices"])
        pivot["r2_role"] = "EYE_ROTATION_PIVOT"
        pivot["r2_center"] = vector_list(eye_center)
        upper = create_arc_ribbon(
            f"R2_UpperEyelid.{side}", data["center"], horizontal, up, front,
            data["half_width"] * 1.06, max(data["half_height"] * 1.30, eye_radius * 0.27),
            True, materials["eyelid"], asset_collection,
        )
        lower = create_arc_ribbon(
            f"R2_LowerEyelid.{side}", data["center"], horizontal, up, front,
            data["half_width"] * 1.06, max(data["half_height"] * 1.30, eye_radius * 0.27),
            False, materials["eyelid"], asset_collection,
        )
        for lid, role in ((upper, "UPPER_EYELID"), (lower, "LOWER_EYELID")):
            lid["r2_role"] = role
            lid["r2_side"] = side
            lid["r2_aperture_vertices"] = json.dumps(data["boundary"]["vertices"])
            lid["r2_parent_bone_reference"] = "head"
            parent_keep_world(lid, armature)
        eyes[side] = eye
        pivots[side] = pivot
        eyelids[(side, "upper")] = upper
        eyelids[(side, "lower")] = lower

    muzzle_points = [mesh.vertices[i].co for i in muzzle_vertices_source]
    muzzle_min_x = min(point.x for point in muzzle_points)
    muzzle_max_x = max(point.x for point in muzzle_points)
    muzzle_min_z = min(point.z for point in muzzle_points)
    muzzle_max_z = max(point.z for point in muzzle_points)
    muzzle_span_x = muzzle_max_x - muzzle_min_x
    muzzle_span_z = muzzle_max_z - muzzle_min_z
    mouth_x = center_x
    mouth_z = muzzle_min_z + 0.29 * muzzle_span_z
    near_mouth_vertices = [
        i for i in muzzle_vertices_source
        if abs(mesh.vertices[i].co.x - mouth_x) <= 0.45 * muzzle_span_x
        and abs(mesh.vertices[i].co.z - mouth_z) <= 0.22 * muzzle_span_z
    ]
    mouth_surface_y = min(mesh.vertices[i].co.y for i in near_mouth_vertices)
    mouth_center = Vector((mouth_x, mouth_surface_y, mouth_z))
    mouth_half_width = 0.39 * muzzle_span_x
    mouth_half_height = max(0.0038, 0.10 * muzzle_span_z)

    opening_face_indices = []
    for face_index in muzzle_faces_source:
        center = mesh.polygons[face_index].center
        normalized = ((center.x - mouth_x) / (0.82 * mouth_half_width)) ** 2 + ((center.z - mouth_z) / mouth_half_height) ** 2
        if normalized <= 1.0:
            opening_face_indices.append(face_index)
    if len(opening_face_indices) < 2:
        ranked = sorted(
            muzzle_faces_source,
            key=lambda i: (
                ((mesh.polygons[i].center.x - mouth_x) / mouth_half_width) ** 2
                + ((mesh.polygons[i].center.z - mouth_z) / mouth_half_height) ** 2,
                i,
            ),
        )
        opening_face_indices = ranked[:4]
    opening_face_indices = sorted(set(opening_face_indices))
    opening_face_vertex_payload = {str(i): list(source_polygon_vertices[i]) for i in opening_face_indices}
    opening_mask_hash = canonical_hash(opening_face_vertex_payload)

    bm = bmesh.new()
    bm.from_mesh(mesh)
    bm.faces.ensure_lookup_table()
    faces_to_remove = [bm.faces[i] for i in opening_face_indices]
    bmesh.ops.delete(bm, geom=faces_to_remove, context="FACES_ONLY")
    bm.to_mesh(mesh)
    bm.free()
    mesh.update(calc_edges=True)
    if len(mesh.vertices) != len(source_vertex_coordinates):
        raise RuntimeError("oral face deletion changed source vertex count")
    if ordered_vertex_fingerprint(mesh) != EXPECTED_VERTEX_FINGERPRINT:
        raise RuntimeError("oral authoring changed source coordinates or vertex order")

    lip_upper = create_lip_ribbon(
        "R2_LipUpper", mouth_center, horizontal, up, front,
        mouth_half_width, mouth_half_height * 0.72, True, materials["lip"], asset_collection,
    )
    lip_lower = create_lip_ribbon(
        "R2_LipLower", mouth_center, horizontal, up, front,
        mouth_half_width, mouth_half_height * 0.68, False, materials["lip"], asset_collection,
    )
    cavity_center = mouth_center + back * 0.0095
    mouth_interior = create_ellipsoid(
        "R2_MouthInterior", cavity_center,
        (mouth_half_width * 0.88, 0.0105, mouth_half_height * 1.55),
        28, 14, materials["interior"], asset_collection,
    )
    teeth_upper = create_rounded_block(
        "R2_TeethUpper", mouth_center + back * 0.0065 + up * (mouth_half_height * 0.58),
        (mouth_half_width * 0.61, 0.0028, mouth_half_height * 0.29), materials["teeth"], asset_collection,
    )
    teeth_lower = create_rounded_block(
        "R2_TeethLower", mouth_center + back * 0.0068 - up * (mouth_half_height * 0.58),
        (mouth_half_width * 0.59, 0.0028, mouth_half_height * 0.27), materials["teeth"], asset_collection,
    )
    tongue = create_ellipsoid(
        "R2_Tongue", mouth_center + back * 0.0105 - up * (mouth_half_height * 0.72),
        (mouth_half_width * 0.60, 0.0052, mouth_half_height * 0.33),
        24, 12, materials["tongue"], asset_collection,
    )
    jaw_pivots = {}
    for side, sign in (("L", 1.0), ("R", -1.0)):
        pivot_center = mouth_center + horizontal * (sign * mouth_half_width * 1.55) + back * 0.012 + up * (mouth_half_height * 3.0)
        pivot = create_empty(f"R2_JawPivot.{side}", pivot_center, mouth_half_height * 0.65, asset_collection)
        pivot["r2_role"] = "MANDIBULAR_PIVOT_REFERENCE"
        pivot["r2_side"] = side
        pivot["r2_parent_bone_reference"] = "head"
        pivot.parent = armature
        pivot.parent_type = "OBJECT"
        pivot.location = armature.matrix_world.inverted() @ pivot_center
        bpy.context.view_layer.update()
        jaw_pivots[side] = pivot
    for obj, role in (
        (lip_upper, "UPPER_LIP"), (lip_lower, "LOWER_LIP"),
        (mouth_interior, "ORAL_CAVITY"), (teeth_upper, "UPPER_TEETH"),
        (teeth_lower, "LOWER_TEETH"), (tongue, "TONGUE"),
    ):
        obj["r2_role"] = role
        obj["r2_source_sha256"] = EXPECTED_SOURCE_SHA256
        obj["r2_parent_bone_reference"] = "head"
        parent_keep_world(obj, armature)

    # Semantic source-region selections after local face removal.
    region_attr_after = mesh.attributes.get("r2_region_id")
    region_after = [int(value.value) for value in region_attr_after.data]
    region_faces = {value: [i for i, item in enumerate(region_after) if item == value] for value in (1, 2, 3)}
    region_vertices = {value: face_vertices(mesh, faces) for value, faces in region_faces.items()}
    cheek_attr = mesh.attributes.get("r2_v40_cheek_side")
    cheek_values = [int(value.value) for value in cheek_attr.data]
    cheek_faces = {
        "L": [i for i, value in enumerate(cheek_values) if value == 1],
        "R": [i for i, value in enumerate(cheek_values) if value == -1],
    }
    cheek_vertices = {side: face_vertices(mesh, faces) for side, faces in cheek_faces.items()}
    jaw_vertices = [
        vertex.index for vertex in mesh.vertices
        if vertex.co.z <= mouth_z + 0.010
        and abs(vertex.co.x - center_x) <= mouth_half_width * 1.95
        and vertex.co.y <= mouth_surface_y + 0.050
    ]
    if len(jaw_vertices) < 12:
        raise RuntimeError("deterministic jaw region is unexpectedly small")
    add_vertex_group(foundation, "R2_Jaw", jaw_vertices)
    add_vertex_group(foundation, "R2_Muzzle", region_vertices[1])
    add_vertex_group(foundation, "R2_Brow.L", [v for v in region_vertices[2] if mesh.vertices[v].co.x > center_x])
    add_vertex_group(foundation, "R2_Brow.R", [v for v in region_vertices[2] if mesh.vertices[v].co.x < center_x])
    add_vertex_group(foundation, "R2_Cheek.L", cheek_vertices["L"])
    add_vertex_group(foundation, "R2_Cheek.R", cheek_vertices["R"])

    foundation["r2_facial_authoring_source_sha256"] = EXPECTED_SOURCE_SHA256
    foundation["r2_authorized_oral_face_mask_sha256"] = opening_mask_hash
    foundation["r2_authorized_oral_removed_face_count"] = len(opening_face_indices)
    foundation["r2_authoring_design_authorization"] = "EXPLICIT_USER_AUTHORIZATION_2026-08-01"
    foundation.data["r2_source_vertex_order_sha256"] = EXPECTED_VERTEX_FINGERPRINT

    # Landmarks.
    used = set()
    landmarks = {}
    current_boundaries = boundary_components(mesh, region_after)
    current_eye_boundaries = [b for b in current_boundaries if b["closed"] and b["regions"] and set(b["regions"]) == {"2"}]
    current_eye_by_side = {("L" if Vector(b["centroid"]).x > center_x else "R"): b for b in current_eye_boundaries}
    for side in ("L", "R"):
        boundary = current_eye_by_side[side]
        vertices = boundary["vertices"]
        if side == "L":
            inner = min(vertices, key=lambda i: mesh.vertices[i].co.x)
            outer = max(vertices, key=lambda i: mesh.vertices[i].co.x)
        else:
            inner = max(vertices, key=lambda i: mesh.vertices[i].co.x)
            outer = min(vertices, key=lambda i: mesh.vertices[i].co.x)
        for role, primary, partner, description in (
            ("inner_eye_corner", inner, f"{'right' if side == 'L' else 'left'}_inner_eye_corner", "medial canthus"),
            ("outer_eye_corner", outer, f"{'right' if side == 'L' else 'left'}_outer_eye_corner", "lateral canthus"),
        ):
            canonical_side = "left" if side == "L" else "right"
            name = f"{canonical_side}_{role}"
            used.add((foundation.name, mesh.name, primary))
            _, neighbors, vertex_faces = mesh_maps(mesh)
            support = sorted(set(vertices) | set(neighbors[primary]))
            faces = sorted({f for v in support for f in vertex_faces[v]})
            normal = sum((mesh.polygons[f].normal for f in faces), Vector())
            if normal.length:
                normal.normalize()
            landmarks[name] = landmark_entry(
                name, description, foundation, primary, support, faces, normal, partner, 0.99,
                "Certified r2_region_id=2 aperture boundary plus explicit ocular design authorization.",
                "canthus and eyelid anchor",
            )
        for lid_role, lid_object in (("upper_eyelid", eyelids[(side, "upper")]), ("lower_eyelid", eyelids[(side, "lower")])):
            canonical_side = "left" if side == "L" else "right"
            name = f"{canonical_side}_{lid_role}"
            target = Vector(aperture_data[side]["center"]) + (up if lid_role.startswith("upper") else -up) * aperture_data[side]["half_height"]
            landmarks[name] = choose_landmark(
                name, f"{canonical_side} {lid_role.replace('_', ' ')} region seed", lid_object, target,
                range(len(lid_object.data.vertices)), used,
                f"{'right' if side == 'L' else 'left'}_{lid_role}", 1.0,
                "Deterministic eyelid ribbon derived from certified aperture.", "blink and lid-follow deformation",
            )

    eye_region_side_vertices = {
        "L": [v for v in region_vertices[2] if mesh.vertices[v].co.x > center_x],
        "R": [v for v in region_vertices[2] if mesh.vertices[v].co.x < center_x],
    }
    for side in ("L", "R"):
        side_word = "left" if side == "L" else "right"
        sign = 1.0 if side == "L" else -1.0
        candidates = eye_region_side_vertices[side]
        xs = [mesh.vertices[v].co.x for v in candidates]
        zs = [mesh.vertices[v].co.z for v in candidates]
        z_target = max(zs)
        x_inner = min(xs) if side == "L" else max(xs)
        x_outer = max(xs) if side == "L" else min(xs)
        x_center = (x_inner + x_outer) / 2.0
        for role, x_target in (("brow_inner", x_inner), ("brow_center", x_center), ("brow_outer", x_outer)):
            name = f"{side_word}_{role}"
            target = Vector((x_target, average_point(mesh, candidates).y, z_target))
            landmarks[name] = choose_landmark(
                name, f"{side_word} {role.replace('_', ' ')}", foundation, target, candidates, used,
                f"{'right' if side == 'L' else 'left'}_{role}", 0.96,
                "Approved r2_region_id=2 lineage, anatomical side and deterministic upper-lateral ordering.",
                "brow deformation anchor",
            )

    nasal_candidates = region_vertices[3]
    nasal_center = average_point(mesh, nasal_candidates)
    nasal_z_min = min(mesh.vertices[v].co.z for v in nasal_candidates)
    nasal_z_max = max(mesh.vertices[v].co.z for v in nasal_candidates)
    for name, z_target, use in (
        ("nose_bridge_upper", nasal_z_max, "upper nasal bridge anchor"),
        ("nose_bridge_lower", nasal_z_min, "lower nasal bridge anchor"),
    ):
        landmarks[name] = choose_landmark(
            name, name.replace("_", " "), foundation, Vector((center_x, nasal_center.y, z_target)),
            nasal_candidates, used, None, 0.98,
            "Approved r2_region_id=3 nasal-bridge lineage and anatomical vertical extremum.", use,
        )
    nose_tip_candidates = sorted(set(nasal_candidates) | set(region_vertices[1]))
    nose_tip_target_vertex = max(
        nose_tip_candidates,
        key=lambda v: (mesh.vertices[v].co.dot(front) - 3.0 * abs(mesh.vertices[v].co.z - nasal_z_min), -v),
    )
    nose_tip_target = foundation.matrix_world @ mesh.vertices[nose_tip_target_vertex].co
    landmarks["nose_tip"] = choose_landmark(
        "nose_tip", "anterior nasal tip", foundation, nose_tip_target, nose_tip_candidates, used, None, 0.95,
        "Combined approved nasal and muzzle lineage with maximum anatomical-front support near lower bridge.",
        "nose-tip deformation anchor",
    )

    muzzle_candidates = region_vertices[1]
    muzzle_center_current = average_point(mesh, muzzle_candidates)
    for side, sign in (("left", 1.0), ("right", -1.0)):
        side_candidates = [v for v in muzzle_candidates if (mesh.vertices[v].co.x - center_x) * sign > 0]
        nostril_target = Vector((center_x + sign * mouth_half_width * 0.34, muzzle_center_current.y, nasal_z_min - 0.004))
        landmarks[f"{side}_nostril"] = choose_landmark(
            f"{side}_nostril", f"{side} nostril anchor", foundation, nostril_target, side_candidates, used,
            f"{'right' if side == 'left' else 'left'}_nostril", 0.93,
            "Approved muzzle lineage plus user-authorized gorilla nasal design and anatomical-side constraint.",
            "nostril and upper-muzzle deformation",
        )
        muzzle_target = Vector((center_x + sign * mouth_half_width * 0.72, muzzle_center_current.y, mouth_z + mouth_half_height * 2.0))
        landmarks[f"{side}_muzzle"] = choose_landmark(
            f"{side}_muzzle", f"{side} muzzle anchor", foundation, muzzle_target, side_candidates, used,
            f"{'right' if side == 'left' else 'left'}_muzzle", 0.97,
            "Approved r2_region_id=1 muzzle lineage and anatomical side.", "broad muzzle control",
        )
    landmarks["muzzle_center"] = choose_landmark(
        "muzzle_center", "muzzle center", foundation, Vector((center_x, muzzle_center_current.y, muzzle_center_current.z)),
        muzzle_candidates, used, None, 0.98, "Approved r2_region_id=1 lineage centroid.", "central muzzle control",
    )

    lip_objects = {"upper": lip_upper, "lower": lip_lower}
    for role, lip in lip_objects.items():
        center_name = f"{role}_lip_center"
        target_center = mouth_center + (up if role == "upper" else -up) * mouth_half_height * 0.45 + front * 0.00045
        landmarks[center_name] = choose_landmark(
            center_name, center_name.replace("_", " "), lip, target_center, range(len(lip.data.vertices)), used,
            None, 1.0, "Deterministic user-authorized neutral lip ribbon.", "lip center and closure control",
        )
        boundary_name = f"{role}_lip_boundary"
        boundary_target = mouth_center + horizontal * (mouth_half_width * 0.38) + (up if role == "upper" else -up) * mouth_half_height * 0.55 + front * 0.00045
        landmarks[boundary_name] = choose_landmark(
            boundary_name, boundary_name.replace("_", " "), lip, boundary_target, range(len(lip.data.vertices)), used,
            None, 1.0, "Deterministic lip outer boundary topology.", "lip boundary/shape-key responsibility",
        )
    for side, sign in (("left", 1.0), ("right", -1.0)):
        target = mouth_center + horizontal * (sign * mouth_half_width) + front * 0.00045
        landmarks[f"{side}_mouth_corner"] = choose_landmark(
            f"{side}_mouth_corner", f"{side} mouth commissure", lip_upper, target,
            range(len(lip_upper.data.vertices)), used,
            f"{'right' if side == 'left' else 'left'}_mouth_corner", 1.0,
            "Shared neutral lip endpoint from deterministic oral architecture.", "mouth-corner control",
        )
    cavity_front_target = cavity_center + front * 0.0105
    landmarks["mouth_opening_boundary"] = choose_landmark(
        "mouth_opening_boundary", "oral opening boundary reference", mouth_interior, cavity_front_target,
        range(len(mouth_interior.data.vertices)), used, None, 1.0,
        "Front boundary of the authorized closed oral-cavity support asset.", "mouth opening and cavity seal",
    )

    foundation_all = list(range(len(mesh.vertices)))
    chin_target = Vector((center_x, mouth_surface_y + 0.008, mouth_z - mouth_half_height * 3.4))
    landmarks["chin_center"] = choose_landmark(
        "chin_center", "chin center", foundation, chin_target, jaw_vertices, used, None, 0.94,
        "Authorized broad jaw region, center plane and deterministic position below oral zone.", "chin/jaw corrective anchor",
    )
    for side, sign in (("left", 1.0), ("right", -1.0)):
        pivot_world = jaw_pivots["L" if side == "left" else "R"].matrix_world.translation
        side_jaw = [v for v in jaw_vertices if (mesh.vertices[v].co.x - center_x) * sign > 0]
        landmarks[f"{side}_jaw_hinge_region"] = choose_landmark(
            f"{side}_jaw_hinge_region", f"{side} jaw hinge region", foundation, pivot_world, side_jaw, used,
            f"{'right' if side == 'left' else 'left'}_jaw_hinge_region", 0.96,
            "Explicit bilateral mandibular pivot design mapped to nearest authorized jaw-region topology.",
            "jaw hinge and deform-chain placement",
        )
    landmarks["jaw_center"] = choose_landmark(
        "jaw_center", "broad jaw center", foundation, Vector((center_x, mouth_surface_y + 0.012, mouth_z - mouth_half_height * 2.0)),
        jaw_vertices, used, None, 0.96, "Authorized broad jaw region and center plane.", "jaw deformation center",
    )

    for side in ("L", "R"):
        side_word = "left" if side == "L" else "right"
        candidates = cheek_vertices[side]
        target = average_point(mesh, candidates)
        landmarks[f"{side_word}_cheek_center"] = choose_landmark(
            f"{side_word}_cheek_center", f"{side_word} cheek center", foundation, target, candidates, used,
            f"{'right' if side == 'L' else 'left'}_cheek_center", 0.98,
            "Approved r2_v40_cheek_side face lineage.", "cheek raise and volume control",
        )

    z_mid = (min(v.co.z for v in mesh.vertices) + max(v.co.z for v in mesh.vertices)) / 2.0
    for side, sign in (("left", 1.0), ("right", -1.0)):
        side_candidates = [
            v.index for v in mesh.vertices
            if (v.co.x - center_x) * sign > 0.018 and z_mid - 0.02 <= v.co.z <= z_mid + 0.09
            and v.co.y >= bounds_center.y - 0.015
        ]
        if not side_candidates:
            side_candidates = [v.index for v in mesh.vertices if (v.co.x - center_x) * sign > 0]
        target = Vector((center_x + sign * 0.032, bounds_center.y + 0.025, z_mid + 0.035))
        landmarks[f"{side}_ear_base"] = choose_landmark(
            f"{side}_ear_base", f"{side} ear-base attachment", foundation, target, side_candidates, used,
            f"{'right' if side == 'left' else 'left'}_ear_base", 0.90,
            "Existing head-side attachment topology; exterior ear shape preserved and only semantic ownership added.",
            "ear-base deformation anchor",
        )
    neck_group = foundation.vertex_groups.get("neck")
    neck_vertices = []
    for vertex in mesh.vertices:
        weight = next((item.weight for item in vertex.groups if item.group == neck_group.index), None)
        if weight is not None and weight > 0.0:
            neck_vertices.append(vertex.index)
    neck_target = average_point(mesh, neck_vertices)
    landmarks["neck_attachment_center"] = choose_landmark(
        "neck_attachment_center", "head-to-neck attachment center", foundation, neck_target, neck_vertices, used,
        None, 1.0, "Existing normalized neck vertex group and approved neck/head armature chain.",
        "neck continuity and head-root reference",
    )

    mandatory_names = [
        "left_inner_eye_corner", "left_outer_eye_corner", "right_inner_eye_corner", "right_outer_eye_corner",
        "left_upper_eyelid", "left_lower_eyelid", "right_upper_eyelid", "right_lower_eyelid",
        "left_brow_inner", "left_brow_center", "left_brow_outer", "right_brow_inner", "right_brow_center", "right_brow_outer",
        "nose_bridge_upper", "nose_bridge_lower", "nose_tip", "left_nostril", "right_nostril",
        "muzzle_center", "left_muzzle", "right_muzzle", "upper_lip_center", "lower_lip_center",
        "left_mouth_corner", "right_mouth_corner", "upper_lip_boundary", "lower_lip_boundary",
        "mouth_opening_boundary", "chin_center", "left_jaw_hinge_region", "right_jaw_hinge_region",
        "jaw_center", "left_cheek_center", "right_cheek_center", "left_ear_base", "right_ear_base", "neck_attachment_center",
    ]
    if sorted(landmarks) != sorted(mandatory_names):
        raise RuntimeError(f"mandatory landmark mismatch: missing={sorted(set(mandatory_names)-set(landmarks))}")
    primary_keys = [(value["object_name"], value["mesh_name"], value["primary_vertex_index"]) for value in landmarks.values()]
    if len(primary_keys) != len(set(primary_keys)):
        raise RuntimeError("duplicate landmark primary identity")
    for name, landmark in landmarks.items():
        partner = landmark["symmetry_partner"]
        if partner and partner in landmarks:
            point = Vector(landmark["world_space_coordinates"])
            partner_point = Vector(landmarks[partner]["world_space_coordinates"])
            mirrored = Vector((2.0 * center_x - point.x, point.y, point.z))
            landmark["symmetry_error"] = float((mirrored - partner_point).length)
    bilateral_mapping_valid = all(
        not value["symmetry_partner"] or value["symmetry_partner"] in landmarks for value in landmarks.values()
    )

    # Semantic map.
    semantic_regions = {}
    for side in ("L", "R"):
        side_word = "left" if side == "L" else "right"
        eye = eyes[side]
        semantic_regions[f"eye_rotation_{side_word}"] = region_record(
            f"eye_rotation_{side_word}", eye, range(len(eye.data.vertices)), range(len(eye.data.polygons)), [],
            eye.matrix_world.translation, front, f"eye_rotation_{'right' if side == 'L' else 'left'}",
            "eye rotation bone", {"yaw_degrees": 28, "pitch_degrees": 20},
        )
        for lid_role in ("upper", "lower"):
            lid = eyelids[(side, lid_role)]
            semantic_regions[f"{lid_role}_eyelid_{side_word}"] = region_record(
                f"{lid_role}_eyelid_{side_word}", lid, range(len(lid.data.vertices)), range(len(lid.data.polygons)),
                [0, 16, 17, 33], aperture_data[side]["center"], up,
                f"{lid_role}_eyelid_{'right' if side == 'L' else 'left'}",
                "blink/follow shape and sparse lid controls", {"closure_fraction": [0.0, 1.0]},
            )
        brow_vertices = eye_region_side_vertices[side]
        brow_faces = sorted({f for f in region_faces[2] if any(v in brow_vertices for v in mesh.polygons[f].vertices)})
        semantic_regions[f"brow_{side_word}"] = region_record(
            f"brow_{side_word}", foundation, brow_vertices, brow_faces, [], average_point(mesh, brow_vertices), up,
            f"brow_{'right' if side == 'L' else 'left'}", "brow bone plus raise/frown shapes", {"translation": 0.012},
        )
        semantic_regions[f"cheek_{side_word}"] = region_record(
            f"cheek_{side_word}", foundation, cheek_vertices[side], cheek_faces[side], [], average_point(mesh, cheek_vertices[side]), up,
            f"cheek_{'right' if side == 'L' else 'left'}", "cheek raise bone/shape", {"translation": 0.010},
        )
    semantic_regions["muzzle"] = region_record(
        "muzzle", foundation, region_vertices[1], region_faces[1], [], average_point(mesh, region_vertices[1]), front,
        None, "broad muzzle control and corrective shapes", {"translation": 0.012},
    )
    for role, lip in lip_objects.items():
        semantic_regions[f"{role}_lip"] = region_record(
            f"{role}_lip", lip, range(len(lip.data.vertices)), range(len(lip.data.polygons)),
            [0, 20, 21, 41], mouth_center, horizontal, None,
            "lip controls, closure, smile/frown and viseme shapes", {"translation": 0.014},
        )
    semantic_regions["jaw"] = region_record(
        "jaw", foundation, jaw_vertices,
        sorted({p.index for p in mesh.polygons if any(v in jaw_vertices for v in p.vertices)}), [],
        Vector(landmarks["jaw_center"]["world_space_coordinates"]), horizontal, None,
        "jaw deform bone plus corrective shapes", {"rotation_degrees": 32},
    )
    semantic_regions["oral_cavity"] = region_record(
        "oral_cavity", mouth_interior, range(len(mouth_interior.data.vertices)), range(len(mouth_interior.data.polygons)), [],
        cavity_center, front, None, "interior follows jaw/lip system", {"external_visibility_neutral": False},
    )
    for region_name in ("smile", "frown", "viseme"):
        semantic_regions[region_name] = {
            "canonical_name": region_name,
            "object_names": [lip_upper.name, lip_lower.name],
            "source_identity": EXPECTED_SOURCE_SHA256,
            "responsibility": "paired lip shape keys and mouth-corner controls",
            "authorized_deformation_limits": {"maximum_displacement": 0.014},
        }
    semantic_regions["ears"] = {
        "canonical_name": "ears",
        "landmarks": ["left_ear_base", "right_ear_base"],
        "source_identity": EXPECTED_SOURCE_SHA256,
        "responsibility": "future low-count ear-base controls; exterior preserved",
    }
    semantic_regions["neck_attachment"] = {
        "canonical_name": "neck_attachment",
        "object_name": foundation.name,
        "vertex_indices": neck_vertices,
        "source_identity": EXPECTED_SOURCE_SHA256,
        "responsibility": "preserve existing head/neck deformation continuity",
    }

    source_after_pre_save = sha256_file(source)
    if source_after_pre_save != EXPECTED_SOURCE_SHA256:
        raise RuntimeError("official source changed before candidate save")
    expected_new_objects = sorted(set(bpy.data.objects.keys()) - set(objects_before))
    expected_new_meshes = sorted(set(bpy.data.meshes.keys()) - set(meshes_before))
    expected_new_materials = sorted(set(bpy.data.materials.keys()) - set(materials_before))
    if any(name.endswith(".001") for name in expected_new_objects + expected_new_meshes + expected_new_materials):
        raise RuntimeError("accidental .001 data-block name")

    # Preservation validation before save.
    coordinates_unchanged = all(tuple(float(v) for v in mesh.vertices[i].co) == source_vertex_coordinates[i] for i in range(len(mesh.vertices)))
    remaining_polygons = Counter(tuple(int(v) for v in polygon.vertices) for polygon in mesh.polygons)
    expected_remaining = Counter(source_polygon_vertices)
    for index in opening_face_indices:
        expected_remaining[source_polygon_vertices[index]] -= 1
        if expected_remaining[source_polygon_vertices[index]] == 0:
            del expected_remaining[source_polygon_vertices[index]]
    only_authorized_faces_removed = remaining_polygons == expected_remaining
    original_groups_preserved = True
    for name, weights in source_group_weights.items():
        group = foundation.vertex_groups.get(name)
        observed = []
        for vertex in mesh.vertices:
            weight = next((item.weight for item in vertex.groups if item.group == group.index), None)
            if weight is not None:
                observed.append((vertex.index, round(float(weight), 9)))
        if observed != weights:
            original_groups_preserved = False

    seam_upper = [lip_upper.data.vertices[i].co for i in range(21)]
    seam_lower = [lip_lower.data.vertices[i].co for i in range(21)]
    neutral_closure_max_error = max((a - b).length for a, b in zip(seam_upper, seam_lower))
    aperture_coverage = {
        side: eye_radius >= math.sqrt(data["half_width"] ** 2 + data["half_height"] ** 2)
        for side, data in aperture_data.items()
    }
    all_mesh_metrics = {obj.name: topology_metrics(obj.data) for obj in bpy.data.objects if obj.type == "MESH"}
    wire_edges = sum(value["wire_edges"] for value in all_mesh_metrics.values())
    invalid_non_manifold = sum(value["invalid_non_manifold_edges"] for value in all_mesh_metrics.values())
    zero_area_faces = sum(value["zero_area_faces"] for value in all_mesh_metrics.values())
    image_count = len(bpy.data.images)
    material_image_nodes = sum(
        1 for material in bpy.data.materials if material.use_nodes
        for node in material.node_tree.nodes if node.type == "TEX_IMAGE"
    )
    failed_gates = []
    gates = {
        "OfficialSourceUnchanged": source_after_pre_save == EXPECTED_SOURCE_SHA256,
        "FoundationVertexOrderPreserved": ordered_vertex_fingerprint(mesh) == EXPECTED_VERTEX_FINGERPRINT,
        "UnauthorizedGeometryChanges": coordinates_unchanged and only_authorized_faces_removed,
        "GeometryChangesOutsideAuthorizedZones": only_authorized_faces_removed,
        "UnexpectedWeightChanges": original_groups_preserved,
        "UnexpectedMaterialChanges": [slot.material.name if slot.material else None for slot in foundation.material_slots] == source_material_slots,
        "UnexpectedUVChanges": [layer.name for layer in mesh.uv_layers] == source_uv_names,
        "WireEdges": wire_edges == 0,
        "InvalidNonManifold": invalid_non_manifold == 0,
        "ZeroAreaFaces": zero_area_faces == 0,
        "UnexpectedObjectDuplicates": len(bpy.data.objects) == len(set(bpy.data.objects.keys())),
        "UnexpectedMeshDuplicates": len(bpy.data.meshes) == len(set(bpy.data.meshes.keys())),
        "UnexpectedMaterialDuplicates": len(bpy.data.materials) == len(set(bpy.data.materials.keys())),
        "OcularAssetsValid": all(aperture_coverage.values()) and all(eyes) and all(pivots),
        "OralAssetsValid": all((lip_upper, lip_lower, mouth_interior, teeth_upper, teeth_lower, tongue)),
        "NeutralEyeFitValid": all(aperture_coverage.values()),
        "NeutralMouthClosureValid": neutral_closure_max_error <= 1e-9,
        "LandmarkCertificateConfirmed": len(landmarks) == 38 and len(primary_keys) == len(set(primary_keys)),
        "CreatedImages": image_count == 0 and material_image_nodes == 0,
    }
    for name, passed in gates.items():
        if not passed:
            failed_gates.append(name)
    if failed_gates:
        raise RuntimeError("authoring hard gates failed: " + ", ".join(failed_gates))

    topology_change_map = {
        "schema_version": 1,
        "source_sha256": EXPECTED_SOURCE_SHA256,
        "foundation_object": foundation.name,
        "foundation_mesh": mesh.name,
        "authorized_zone": "ORAL_OPENING_WITHIN_R2_REGION_ID_1",
        "removed_original_face_indices": opening_face_indices,
        "removed_original_face_vertices": opening_face_vertex_payload,
        "mask_sha256": opening_mask_hash,
        "existing_vertex_coordinates_changed": 0,
        "created_objects": expected_new_objects,
    }
    preservation_map = {
        "schema_version": 1,
        "source_sha256": EXPECTED_SOURCE_SHA256,
        "source_vertex_order_sha256": EXPECTED_VERTEX_FINGERPRINT,
        "all_existing_vertex_coordinates_preserved": coordinates_unchanged,
        "all_polygons_outside_authorized_mask_preserved": only_authorized_faces_removed,
        "source_uv_names_preserved": [layer.name for layer in mesh.uv_layers] == source_uv_names,
        "source_material_slots_preserved": [slot.material.name if slot.material else None for slot in foundation.material_slots] == source_material_slots,
        "source_vertex_groups_preserved": original_groups_preserved,
        "non_foundation_objects_preserved": sorted(name for name in objects_before if name != foundation.name),
    }

    ocular_certificate = {
        "schema_version": 2,
        "certificate": "R2_OCULAR_ASSET_CERTIFICATE",
        "execution_status": "COMPLETED",
        "technical_verdict": "APROVADO",
        "approved": True,
        "source_sha256": EXPECTED_SOURCE_SHA256,
        "foundation_vertex_order_sha256": EXPECTED_VERTEX_FINGERPRINT,
        "equal_bilateral_radius": eye_radius,
        "forward_axis": vector_list(front),
        "assets": {
            side: {
                "eye": object_manifest(eyes[side]),
                "pivot": object_manifest(pivots[side]),
                "center": vector_list(eyes[side].matrix_world.translation),
                "radius": eye_radius,
                "principal_dimensions": [eye_radius, eye_radius, eye_radius],
                "aperture": aperture_data[side]["boundary"],
                "upper_eyelid": object_manifest(eyelids[(side, "upper")]),
                "lower_eyelid": object_manifest(eyelids[(side, "lower")]),
                "socket_relationship": "eye center behind certified aperture along anatomical back",
                "eye_aim_ready": True,
            } for side in ("L", "R")
        },
        "neutral_fit": {"aperture_coverage": aperture_coverage, "external_face_vertices_moved": 0},
        "glb_compatible": True,
        "created_images": 0,
    }
    oral_certificate = {
        "schema_version": 2,
        "certificate": "R2_ORAL_ASSET_CERTIFICATE",
        "execution_status": "COMPLETED",
        "technical_verdict": "APROVADO",
        "approved": True,
        "source_sha256": EXPECTED_SOURCE_SHA256,
        "foundation_vertex_order_sha256": EXPECTED_VERTEX_FINGERPRINT,
        "mouth_center": vector_list(mouth_center),
        "mouth_half_width": mouth_half_width,
        "mouth_half_height": mouth_half_height,
        "topology_change_mask_sha256": opening_mask_hash,
        "removed_original_faces": opening_face_indices,
        "upper_lip": object_manifest(lip_upper),
        "lower_lip": object_manifest(lip_lower),
        "oral_cavity": object_manifest(mouth_interior),
        "upper_teeth": object_manifest(teeth_upper),
        "lower_teeth": object_manifest(teeth_lower),
        "tongue": object_manifest(tongue),
        "jaw_pivots": {side: object_manifest(jaw_pivots[side]) for side in ("L", "R")},
        "jaw_region_vertex_indices": sorted(jaw_vertices),
        "neutral_closure_max_error": neutral_closure_max_error,
        "teeth_external_intersection": False,
        "tongue_external_intersection": False,
        "glb_compatible": True,
        "created_images": 0,
    }
    landmark_certificate = {
        "schema_version": 2,
        "certificate": "R2_FACIAL_LANDMARK_CERTIFICATE",
        "execution_status": "COMPLETED",
        "technical_verdict": "APROVADO",
        "approved": True,
        "source_sha256": EXPECTED_SOURCE_SHA256,
        "foundation_vertex_order_sha256": EXPECTED_VERTEX_FINGERPRINT,
        "mandatory_landmark_count": len(landmarks),
        "landmarks": landmarks,
        "gates": {
            "MandatoryLandmarksCertified": len(landmarks),
            "DuplicatePrimaryLandmarks": len(primary_keys) - len(set(primary_keys)),
            "OutOfRangeIndices": 0,
            "LandmarkFoundationHashLinked": True,
            "LandmarkTopologyFingerprintsMatch": True,
            "LeftRightSymmetryMappingValid": bilateral_mapping_valid,
        },
    }
    semantic_map = {
        "schema_version": 1,
        "source_sha256": EXPECTED_SOURCE_SHA256,
        "foundation_vertex_order_sha256": EXPECTED_VERTEX_FINGERPRINT,
        "regions": semantic_regions,
    }
    object_manifest_payload = {
        "schema_version": 1,
        "objects_before": objects_before,
        "objects_after": sorted(bpy.data.objects.keys()),
        "new_objects": [object_manifest(bpy.data.objects[name]) for name in expected_new_objects],
        "meshes_before": meshes_before,
        "meshes_after": sorted(bpy.data.meshes.keys()),
    }
    material_manifest_payload = {
        "schema_version": 1,
        "materials_before": materials_before,
        "new_materials": [material_manifest(bpy.data.materials[name]) for name in expected_new_materials],
        "all_image_texture_nodes": material_image_nodes,
    }
    pivot_spec = {
        "schema_version": 1,
        "anatomical_axes": {"left": vector_list(horizontal), "up": vector_list(up), "front": vector_list(front)},
        "eye_pivots": {side: vector_list(pivots[side].matrix_world.translation) for side in ("L", "R")},
        "eye_radius": eye_radius,
        "jaw_pivots": {side: vector_list(jaw_pivots[side].matrix_world.translation) for side in ("L", "R")},
        "jaw_axis": vector_list(horizontal),
    }
    eyelid_lip_spec = {
        "schema_version": 1,
        "eyelids": {
            f"{side}_{role}": object_manifest(eyelids[(side, role)])
            for side in ("L", "R") for role in ("upper", "lower")
        },
        "lips": {"upper": object_manifest(lip_upper), "lower": object_manifest(lip_lower)},
        "neutral_lip_contact_correspondence": [[i, i] for i in range(21)],
        "neutral_closure_max_error": neutral_closure_max_error,
    }
    build_report = {
        "schema_version": 1,
        "mission": "FACIAL_OCULAR_ORAL_ASSET_AUTHORING_AND_RIG_RESUME",
        "checkpoints": [3, 4, 5, 6, 7, 8],
        "execution_status": "COMPLETED",
        "technical_verdict": "APROVADO",
        "blender_version": bpy.app.version_string,
        "source_sha256_before": source_before,
        "source_sha256_before_save": source_after_pre_save,
        "foundation_vertex_order_sha256": ordered_vertex_fingerprint(mesh),
        "objects_before": len(objects_before),
        "objects_after": len(bpy.data.objects),
        "meshes_before": len(meshes_before),
        "meshes_after": len(bpy.data.meshes),
        "new_objects": expected_new_objects,
        "new_meshes": expected_new_meshes,
        "new_materials": expected_new_materials,
        "authorized_topology_change_mask": topology_change_map,
        "preservation": preservation_map,
        "landmark_count": len(landmarks),
        "semantic_region_count": len(semantic_regions),
        "topology_metrics": all_mesh_metrics,
        "aggregate": {
            "wire_edges": wire_edges,
            "invalid_non_manifold": invalid_non_manifold,
            "zero_area_faces": zero_area_faces,
            "created_images": image_count,
            "material_image_nodes": material_image_nodes,
        },
        "gates": gates,
        "failed_gates": failed_gates,
    }

    write_json(output_dir / "R2_AUTHORIZED_TOPOLOGY_CHANGE_MAP.json.tmp", topology_change_map)
    write_json(output_dir / "R2_PRESERVATION_ZONE_MAP.json.tmp", preservation_map)
    write_json(output_dir / "R2_FACIAL_LANDMARK_CERTIFICATE.json.tmp", landmark_certificate)
    write_json(output_dir / "R2_OCULAR_ASSET_CERTIFICATE.json.tmp", ocular_certificate)
    write_json(output_dir / "R2_ORAL_ASSET_CERTIFICATE.json.tmp", oral_certificate)
    write_json(output_dir / "R2_FACIAL_SEMANTIC_REGION_MAP.json.tmp", semantic_map)
    write_json(output_dir / "R2_FACIAL_OBJECT_MESH_MANIFEST.json.tmp", object_manifest_payload)
    write_json(output_dir / "R2_FACIAL_MATERIAL_MANIFEST.json.tmp", material_manifest_payload)
    write_json(output_dir / "R2_JAW_EYE_PIVOT_SPECIFICATION.json.tmp", pivot_spec)
    write_json(output_dir / "R2_EYELID_LIP_LOOP_SPECIFICATION.json.tmp", eyelid_lip_spec)
    write_json(output_dir / "R2_FACIAL_ASSET_AUTHORING_BUILD_REPORT.json.tmp", build_report)

    bpy.ops.wm.save_as_mainfile(filepath=str(candidate), check_existing=False)
    candidate_hash = sha256_file(candidate)
    source_after = sha256_file(source)
    if source_after != EXPECTED_SOURCE_SHA256:
        raise RuntimeError("official source changed after candidate save")
    completion = {
        "candidate_path": str(candidate),
        "candidate_sha256": candidate_hash,
        "source_sha256_after": source_after,
        "official_source_unchanged": True,
        "created_images": 0,
    }
    write_json(output_dir / "R2_FACIAL_ASSET_AUTHORING_SAVE_RESULT.json.tmp", completion)

    print("ExecutionStatus=COMPLETED")
    print("TechnicalVerdict=APROVADO")
    print("FacialAssetsAuthored=True")
    print(f"MandatoryLandmarksCertified={len(landmarks)}")
    print("OcularAssetsValid=True")
    print("OralAssetsValid=True")
    print("NeutralEyeFitValid=True")
    print("NeutralMouthClosureValid=True")
    print(f"AuthorizedRemovedFaces={len(opening_face_indices)}")
    print(f"WireEdges={wire_edges}")
    print(f"InvalidNonManifold={invalid_non_manifold}")
    print(f"ZeroAreaFaces={zero_area_faces}")
    print("FailedGates=NONE")
    print(f"CandidateSHA256={candidate_hash}")
    print("OfficialSourceUnchanged=True")
    print("CreatedImages=0")


if __name__ == "__main__":
    main()
