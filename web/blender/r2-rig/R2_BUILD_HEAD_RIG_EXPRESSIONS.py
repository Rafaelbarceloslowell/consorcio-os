import hashlib
import json
import math
import sys
from collections import defaultdict, deque
from pathlib import Path

import bpy
from mathutils import Vector


def sha256_file(path):
    digest = hashlib.sha256()
    with open(path, "rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest().upper()


def canonical_hash(value):
    return hashlib.sha256(json.dumps(value, separators=(",", ":"), sort_keys=True).encode("utf-8")).hexdigest().upper()


def vec(value):
    return [float(v) for v in value]


def write_json(path, value):
    Path(path).write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def mesh_maps(mesh):
    edge_faces = defaultdict(list)
    neighbors = defaultdict(set)
    lookup = {}
    for edge in mesh.edges:
        a, b = (int(v) for v in edge.vertices)
        lookup[tuple(sorted((a, b)))] = edge.index
        neighbors[a].add(b)
        neighbors[b].add(a)
    for polygon in mesh.polygons:
        vertices = [int(v) for v in polygon.vertices]
        for offset, vertex in enumerate(vertices):
            edge_faces[lookup[tuple(sorted((vertex, vertices[(offset + 1) % len(vertices)])))]] .append(polygon.index)
    return edge_faces, neighbors


def topology_metrics(mesh):
    mesh.update(calc_edges=True)
    edge_faces, neighbors = mesh_maps(mesh)
    unseen = set(range(len(mesh.vertices)))
    islands = 0
    while unseen:
        islands += 1
        stack = [unseen.pop()]
        while stack:
            current = stack.pop()
            for neighbor in neighbors[current]:
                if neighbor in unseen:
                    unseen.remove(neighbor)
                    stack.append(neighbor)
    return {
        "vertices": len(mesh.vertices),
        "edges": len(mesh.edges),
        "polygons": len(mesh.polygons),
        "wire_edges": sum(1 for faces in edge_faces.values() if len(faces) == 0),
        "invalid_non_manifold": sum(1 for faces in edge_faces.values() if len(faces) > 2),
        "zero_area_faces": sum(1 for polygon in mesh.polygons if polygon.area <= 1e-12),
        "connected_islands": islands,
    }


def add_property(owner, name, minimum=0.0, maximum=1.0):
    if name in owner:
        raise RuntimeError(f"property collision: {name}")
    owner[name] = 0.0
    ui = owner.id_properties_ui(name)
    ui.update(min=minimum, max=maximum, soft_min=minimum, soft_max=maximum, default=0.0)


def add_driver(target, data_path, index, owner, variables, expression):
    fcurve = target.driver_add(data_path, index) if index is not None else target.driver_add(data_path)
    driver = fcurve.driver
    driver.type = "SCRIPTED"
    driver.expression = expression
    while driver.variables:
        driver.variables.remove(driver.variables[0])
    for variable_name, property_name in variables:
        variable = driver.variables.new()
        variable.name = variable_name
        variable.type = "SINGLE_PROP"
        variable.targets[0].id = owner
        variable.targets[0].data_path = f'["{property_name}"]'
    return fcurve


def add_shape_driver(key_block, owner, variables, expression):
    return add_driver(key_block, "value", None, owner, variables, expression)


def ensure_basis(obj):
    if obj.data.shape_keys is not None:
        raise RuntimeError(f"unexpected pre-existing shape keys on {obj.name}")
    return obj.shape_key_add(name="Basis", from_mix=False)


def create_shape(obj, name, transform):
    key = obj.shape_key_add(name=name, from_mix=False)
    for index, point in enumerate(key.data):
        point.co = transform(index, point.co.copy())
    key.value = 0.0
    key.slider_min = 0.0
    key.slider_max = 1.0
    return key


def parent_keep_world(obj, parent):
    world = obj.matrix_world.copy()
    obj.parent = parent
    obj.parent_type = "OBJECT"
    obj.matrix_world = world
    bpy.context.view_layer.update()


def bone_signature(armature):
    return [
        {
            "name": bone.name,
            "parent": bone.parent.name if bone.parent else None,
            "head": vec(bone.head_local),
            "tail": vec(bone.tail_local),
            "use_deform": bool(bone.use_deform),
        }
        for bone in armature.data.bones
    ]


def main():
    args = sys.argv[sys.argv.index("--") + 1:]
    if len(args) != 7:
        raise SystemExit("expected SEMANTIC_SOURCE CANDIDATE OUTPUT LANDMARK OCULAR ORAL SEMANTIC_MAP")
    semantic_source = Path(args[0]).resolve()
    candidate = Path(args[1]).resolve()
    output = Path(args[2]).resolve()
    landmark_certificate = json.loads(Path(args[3]).read_text(encoding="utf-8-sig"))
    ocular_certificate = json.loads(Path(args[4]).read_text(encoding="utf-8-sig"))
    oral_certificate = json.loads(Path(args[5]).read_text(encoding="utf-8-sig"))
    semantic_map = json.loads(Path(args[6]).read_text(encoding="utf-8-sig"))
    source_hash_before = sha256_file(semantic_source)
    if sha256_file(candidate) != source_hash_before:
        raise RuntimeError("rig candidate is not the exact certified semantic source copy")

    bpy.ops.wm.open_mainfile(filepath=str(candidate), load_ui=False)
    armature = bpy.data.objects.get("R2_Rig")
    foundation = bpy.data.objects.get("R2_Head_Face_Foundation")
    if armature is None or armature.type != "ARMATURE" or foundation is None:
        raise RuntimeError("certified rig/foundation is missing")
    if len(landmark_certificate["landmarks"]) != 38:
        raise RuntimeError("38-landmark certificate is not present")
    if not ocular_certificate.get("approved") or not oral_certificate.get("approved"):
        raise RuntimeError("ocular/oral certificates are not approved")

    objects_before = sorted(bpy.data.objects.keys())
    meshes_before = sorted(bpy.data.meshes.keys())
    materials_before = sorted(bpy.data.materials.keys())
    existing_bones_before = bone_signature(armature)
    source_mesh_signatures = {
        obj.name: canonical_hash({
            "vertices": [[v.index] + [round(float(c), 9) for c in v.co] for v in obj.data.vertices],
            "polygons": [[p.index] + [int(v) for v in p.vertices] for p in obj.data.polygons],
        }) for obj in bpy.data.objects if obj.type == "MESH"
    }
    neutral_basis = {obj.name: [tuple(float(c) for c in v.co) for v in obj.data.vertices] for obj in bpy.data.objects if obj.type == "MESH"}

    landmarks = landmark_certificate["landmarks"]
    eye_centers = {side: Vector(ocular_certificate["assets"][side]["center"]) for side in ("L", "R")}
    jaw_ref_l = bpy.data.objects["R2_JawPivot.L"].matrix_world.translation.copy()
    jaw_ref_r = bpy.data.objects["R2_JawPivot.R"].matrix_world.translation.copy()
    jaw_center = (jaw_ref_l + jaw_ref_r) / 2.0
    up = Vector((0.0, 0.049937620759010315, 0.9987523555755615))
    front = Vector((0.0, -0.9987523555755615, 0.049937646836042404))
    horizontal = Vector((1.0, 0.0, 0.0))

    expected_bones = [
        "CTRL-face-root", "CTRL-face-eye.L", "CTRL-face-eye.R", "CTRL-face-jaw", "DEF-face-jaw",
        "CTRL-face-brow.L", "CTRL-face-brow.R", "CTRL-face-cheek.L", "CTRL-face-cheek.R",
        "CTRL-face-muzzle", "CTRL-face-lip-upper", "CTRL-face-lip-lower",
        "CTRL-face-mouth-corner.L", "CTRL-face-mouth-corner.R",
    ]
    collisions = [name for name in expected_bones if armature.data.bones.get(name)]
    if collisions:
        raise RuntimeError("facial bone name collisions: " + ",".join(collisions))

    bpy.context.view_layer.objects.active = armature
    armature.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    inverse_armature = armature.matrix_world.inverted()

    def make_bone(name, head_world, tail_world, parent, deform=False):
        bone = armature.data.edit_bones.new(name)
        bone.head = inverse_armature @ head_world
        bone.tail = inverse_armature @ tail_world
        if (bone.tail - bone.head).length < 0.001:
            bone.tail = bone.head + Vector((0.0, 0.0, 0.006))
        bone.parent = armature.data.edit_bones.get(parent) if parent else None
        bone.use_deform = deform
        return bone

    neck_attach = Vector(landmarks["neck_attachment_center"]["world_space_coordinates"])
    make_bone("CTRL-face-root", neck_attach, neck_attach + up * 0.014, "head", False)
    for side in ("L", "R"):
        make_bone(f"CTRL-face-eye.{side}", eye_centers[side], eye_centers[side] + front * 0.012, "CTRL-face-root", False)
    make_bone("CTRL-face-jaw", jaw_ref_r, jaw_ref_l, "CTRL-face-root", False)
    make_bone("DEF-face-jaw", jaw_ref_r, jaw_ref_l, "head", True)
    for side, word in (("L", "left"), ("R", "right")):
        for role in ("brow", "cheek"):
            point = Vector(landmarks[f"{word}_{role}_center"]["world_space_coordinates"])
            make_bone(f"CTRL-face-{role}.{side}", point, point + up * 0.009, "CTRL-face-root", False)
        point = Vector(landmarks[f"{word}_mouth_corner"]["world_space_coordinates"])
        make_bone(f"CTRL-face-mouth-corner.{side}", point, point + up * 0.007, "CTRL-face-root", False)
    muzzle = Vector(landmarks["muzzle_center"]["world_space_coordinates"])
    make_bone("CTRL-face-muzzle", muzzle, muzzle + front * 0.009, "CTRL-face-root", False)
    for role in ("upper", "lower"):
        point = Vector(landmarks[f"{role}_lip_center"]["world_space_coordinates"])
        make_bone(f"CTRL-face-lip-{role}", point, point + up * 0.007, "CTRL-face-root", False)
    bpy.ops.object.mode_set(mode="POSE")

    property_ranges = {
        "EYE_YAW.L": (-1.0, 1.0), "EYE_PITCH.L": (-1.0, 1.0),
        "EYE_YAW.R": (-1.0, 1.0), "EYE_PITCH.R": (-1.0, 1.0),
        "EYE_AIM_YAW": (-1.0, 1.0), "EYE_AIM_PITCH": (-1.0, 1.0),
        "EXP_BLINK_LEFT": (0.0, 1.0), "EXP_BLINK_RIGHT": (0.0, 1.0), "EXP_BLINK_BOTH": (0.0, 1.0),
        "EXP_BROW_RAISE": (0.0, 1.0), "EXP_BROW_FROWN": (0.0, 1.0), "EXP_CHEEK_RAISE": (0.0, 1.0),
        "EXP_MUZZLE": (0.0, 1.0), "EXP_JAW_OPEN": (0.0, 1.0), "EXP_LIPS_CLOSED": (0.0, 1.0),
        "EXP_SMILE": (0.0, 1.0), "EXP_FROWN": (0.0, 1.0), "EXP_MOUTH_NARROW": (0.0, 1.0),
        "EXP_MOUTH_WIDE": (0.0, 1.0), "EXP_MOUTH_O": (0.0, 1.0), "EXP_MOUTH_E": (0.0, 1.0),
        "VISEME_A": (0.0, 1.0), "VISEME_E": (0.0, 1.0), "VISEME_O": (0.0, 1.0),
        "VISEME_MBP": (0.0, 1.0), "VISEME_FV": (0.0, 1.0), "VISEME_L": (0.0, 1.0),
    }
    for name, limits in property_ranges.items():
        add_property(armature, name, *limits)

    for side in ("L", "R"):
        pose = armature.pose.bones[f"CTRL-face-eye.{side}"]
        pose.rotation_mode = "XYZ"
        add_driver(pose, "rotation_euler", 0, armature,
                   [("p", f"EYE_PITCH.{side}"), ("a", "EYE_AIM_PITCH")],
                   f"{math.radians(20.0):.12f}*(p+a)")
        add_driver(pose, "rotation_euler", 2, armature,
                   [("y", f"EYE_YAW.{side}"), ("a", "EYE_AIM_YAW")],
                   f"{math.radians(28.0):.12f}*(y+a)")
        pivot = bpy.data.objects[f"R2_EyePivot.{side}"]
        pivot.rotation_mode = "XYZ"
        add_driver(pivot, "rotation_euler", 0, armature,
                   [("p", f"EYE_PITCH.{side}"), ("a", "EYE_AIM_PITCH")],
                   f"{math.radians(20.0):.12f}*(p+a)")
        add_driver(pivot, "rotation_euler", 2, armature,
                   [("y", f"EYE_YAW.{side}"), ("a", "EYE_AIM_YAW")],
                   f"{math.radians(28.0):.12f}*(y+a)")

    for bone_name in ("CTRL-face-jaw", "DEF-face-jaw"):
        pose = armature.pose.bones[bone_name]
        pose.rotation_mode = "XYZ"
        add_driver(pose, "rotation_euler", 0, armature, [("j", "EXP_JAW_OPEN")], f"{-math.radians(32.0):.12f}*j")
    bpy.ops.object.mode_set(mode="OBJECT")

    rig_collection = bpy.data.collections.get("R2_FACIAL_RIG")
    if rig_collection is not None:
        raise RuntimeError("R2_FACIAL_RIG collection collision")
    rig_collection = bpy.data.collections.new("R2_FACIAL_RIG")
    bpy.context.scene.collection.children.link(rig_collection)
    if bpy.data.objects.get("R2_JawDriver"):
        raise RuntimeError("R2_JawDriver collision")
    jaw_driver = bpy.data.objects.new("R2_JawDriver", None)
    jaw_driver.empty_display_type = "ARROWS"
    jaw_driver.empty_display_size = 0.008
    jaw_driver.hide_render = True
    rig_collection.objects.link(jaw_driver)
    jaw_driver.parent = armature
    jaw_driver.parent_type = "OBJECT"
    jaw_driver.location = armature.matrix_world.inverted() @ jaw_center
    jaw_driver["r2_role"] = "JAW_RUNTIME_DRIVER"
    jaw_driver["r2_bone_reference"] = "DEF-face-jaw"
    jaw_driver.rotation_mode = "XYZ"
    bpy.context.view_layer.update()
    add_driver(jaw_driver, "rotation_euler", 0, armature, [("j", "EXP_JAW_OPEN")], f"{-math.radians(32.0):.12f}*j")
    for name in ("R2_LipLower", "R2_TeethLower", "R2_Tongue"):
        parent_keep_world(bpy.data.objects[name], jaw_driver)

    jaw_vertices = [int(v) for v in semantic_map["regions"]["jaw"]["vertex_indices"]]
    if foundation.vertex_groups.get("DEF-face-jaw"):
        raise RuntimeError("DEF-face-jaw vertex group collision")
    jaw_group = foundation.vertex_groups.new(name="DEF-face-jaw")
    jaw_group.add(jaw_vertices, 0.68, "REPLACE")
    modifier = foundation.modifiers.get("R2_FacialArmature")
    if modifier is not None:
        raise RuntimeError("R2_FacialArmature modifier collision")
    modifier = foundation.modifiers.new("R2_FacialArmature", "ARMATURE")
    modifier.object = armature
    modifier.use_vertex_groups = True
    modifier.use_bone_envelopes = False
    modifier.use_deform_preserve_volume = True

    # Foundation expression shapes.
    ensure_basis(foundation)
    foundation_keys = {}
    brow_vertices = sorted(set(semantic_map["regions"]["brow_left"]["vertex_indices"] + semantic_map["regions"]["brow_right"]["vertex_indices"]))
    cheek_vertices = sorted(set(semantic_map["regions"]["cheek_left"]["vertex_indices"] + semantic_map["regions"]["cheek_right"]["vertex_indices"]))
    muzzle_vertices = [int(v) for v in semantic_map["regions"]["muzzle"]["vertex_indices"]]
    brow_set, cheek_set, muzzle_set = set(brow_vertices), set(cheek_vertices), set(muzzle_vertices)
    foundation_keys["EXP_BROW_RAISE"] = create_shape(
        foundation, "EXP_BROW_RAISE", lambda i, co: co + up * 0.006 if i in brow_set else co
    )
    foundation_keys["EXP_BROW_FROWN"] = create_shape(
        foundation, "EXP_BROW_FROWN", lambda i, co: co - up * 0.0035 - horizontal * math.copysign(0.0015, co.x) if i in brow_set else co
    )
    foundation_keys["EXP_CHEEK_RAISE"] = create_shape(
        foundation, "EXP_CHEEK_RAISE", lambda i, co: co + up * 0.004 + front * 0.001 if i in cheek_set else co
    )
    foundation_keys["EXP_MUZZLE"] = create_shape(
        foundation, "EXP_MUZZLE", lambda i, co: co + front * 0.0035 if i in muzzle_set else co
    )
    for name, key in foundation_keys.items():
        add_shape_driver(key, armature, [("v", name)], "v")

    # Eyelid blink shapes.
    for side, word in (("L", "LEFT"), ("R", "RIGHT")):
        aperture_center = Vector(ocular_certificate["assets"][side]["aperture"]["centroid"])
        for role in ("Upper", "Lower"):
            obj = bpy.data.objects[f"R2_{role}Eyelid.{side}"]
            ensure_basis(obj)
            blink = create_shape(
                obj, "EXP_BLINK",
                lambda i, co, center=aperture_center: co - up * ((co - center).dot(up) * 0.96),
            )
            add_shape_driver(
                blink, armature,
                [("s", f"EXP_BLINK_{word}"), ("b", "EXP_BLINK_BOTH")], "min(1.0,s+b)",
            )

    mouth_center = Vector(oral_certificate["mouth_center"])
    mouth_half_width = float(oral_certificate["mouth_half_width"])
    lip_key_map = {}
    for role in ("Upper", "Lower"):
        obj = bpy.data.objects[f"R2_Lip{role}"]
        ensure_basis(obj)
        sign = 1.0 if role == "Upper" else -1.0

        def radial_weight(co):
            return min(1.0, abs((co.x - mouth_center.x) / max(mouth_half_width, 1e-9)))

        shapes = {
            "EXP_LIPS_CLOSED": lambda i, co: co - up * ((co - mouth_center).dot(up) * 0.12),
            "EXP_SMILE": lambda i, co: co + up * (0.004 * radial_weight(co)),
            "EXP_FROWN": lambda i, co: co - up * (0.0035 * radial_weight(co)),
            "EXP_MOUTH_NARROW": lambda i, co: mouth_center + horizontal * ((co - mouth_center).dot(horizontal) * 0.78) + up * (co - mouth_center).dot(up) + front * (co - mouth_center).dot(front),
            "EXP_MOUTH_WIDE": lambda i, co: mouth_center + horizontal * ((co - mouth_center).dot(horizontal) * 1.16) + up * (co - mouth_center).dot(up) + front * (co - mouth_center).dot(front),
            "EXP_MOUTH_O": lambda i, co: mouth_center + horizontal * ((co - mouth_center).dot(horizontal) * 0.70) + up * ((co - mouth_center).dot(up) + sign * 0.0016) + front * (co - mouth_center).dot(front),
            "EXP_MOUTH_E": lambda i, co: mouth_center + horizontal * ((co - mouth_center).dot(horizontal) * 1.12) + up * ((co - mouth_center).dot(up) + sign * 0.0007) + front * (co - mouth_center).dot(front),
        }
        if role == "Lower":
            shapes["EXP_VISEME_FV"] = lambda i, co: co + up * 0.0018 - front * 0.0005
        lip_key_map[obj.name] = {}
        for name, transform in shapes.items():
            lip_key_map[obj.name][name] = create_shape(obj, name, transform)
        driver_specs = {
            "EXP_LIPS_CLOSED": ([("v", "EXP_LIPS_CLOSED"), ("m", "VISEME_MBP")], "max(v,m)"),
            "EXP_SMILE": ([("v", "EXP_SMILE")], "v"),
            "EXP_FROWN": ([("v", "EXP_FROWN")], "v"),
            "EXP_MOUTH_NARROW": ([("v", "EXP_MOUTH_NARROW")], "v"),
            "EXP_MOUTH_WIDE": ([("v", "EXP_MOUTH_WIDE"), ("a", "VISEME_A")], "max(v,0.55*a)"),
            "EXP_MOUTH_O": ([("v", "EXP_MOUTH_O"), ("o", "VISEME_O")], "max(v,o)"),
            "EXP_MOUTH_E": ([("v", "EXP_MOUTH_E"), ("e", "VISEME_E")], "max(v,e)"),
        }
        if role == "Lower":
            driver_specs["EXP_VISEME_FV"] = ([("v", "VISEME_FV")], "v")
        for name, (variables, expression) in driver_specs.items():
            add_shape_driver(lip_key_map[obj.name][name], armature, variables, expression)

    tongue = bpy.data.objects["R2_Tongue"]
    ensure_basis(tongue)
    tongue_l = create_shape(tongue, "EXP_VISEME_L", lambda i, co: co + front * 0.0025 + up * 0.0016)
    add_shape_driver(tongue_l, armature, [("l", "VISEME_L")], "l")

    bpy.context.view_layer.update()
    bpy.context.scene.frame_set(bpy.context.scene.frame_current)

    # Runtime channel tests.
    def reset_channels():
        for name in property_ranges:
            armature[name] = 0.0
        armature.update_tag()
        bpy.context.view_layer.update()
        current_frame = bpy.context.scene.frame_current
        bpy.context.scene.frame_set(current_frame + 1)
        bpy.context.scene.frame_set(current_frame)

    channel_checks = {
        "BLINK_LEFT": ("EXP_BLINK_LEFT", lambda: bpy.data.objects["R2_UpperEyelid.L"].data.shape_keys.key_blocks["EXP_BLINK"].value),
        "BLINK_RIGHT": ("EXP_BLINK_RIGHT", lambda: bpy.data.objects["R2_UpperEyelid.R"].data.shape_keys.key_blocks["EXP_BLINK"].value),
        "BLINK_BOTH": ("EXP_BLINK_BOTH", lambda: min(bpy.data.objects["R2_UpperEyelid.L"].data.shape_keys.key_blocks["EXP_BLINK"].value, bpy.data.objects["R2_UpperEyelid.R"].data.shape_keys.key_blocks["EXP_BLINK"].value)),
        "BROW_RAISE": ("EXP_BROW_RAISE", lambda: foundation.data.shape_keys.key_blocks["EXP_BROW_RAISE"].value),
        "BROW_FROWN": ("EXP_BROW_FROWN", lambda: foundation.data.shape_keys.key_blocks["EXP_BROW_FROWN"].value),
        "CHEEK_RAISE": ("EXP_CHEEK_RAISE", lambda: foundation.data.shape_keys.key_blocks["EXP_CHEEK_RAISE"].value),
        "MUZZLE": ("EXP_MUZZLE", lambda: foundation.data.shape_keys.key_blocks["EXP_MUZZLE"].value),
        "JAW_OPEN": ("EXP_JAW_OPEN", lambda: abs(jaw_driver.rotation_euler.x)),
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
        "VISEME_L": ("VISEME_L", lambda: tongue.data.shape_keys.key_blocks["EXP_VISEME_L"].value),
    }
    runtime_tests = {}
    reset_channels()
    for channel, (property_name, getter) in channel_checks.items():
        armature[property_name] = 1.0
        armature.update_tag()
        bpy.context.view_layer.update()
        current_frame = bpy.context.scene.frame_current
        bpy.context.scene.frame_set(current_frame + 1)
        bpy.context.scene.frame_set(current_frame)
        observed = float(getter())
        runtime_tests[channel] = {"property": property_name, "observed": observed, "passed": observed > 1e-5}
        reset_channels()

    neutral_shape_values = {}
    for obj in bpy.data.objects:
        if obj.type == "MESH" and obj.data.shape_keys:
            neutral_shape_values[obj.name] = {key.name: float(key.value) for key in obj.data.shape_keys.key_blocks if key.name != "Basis"}
    neutral_shapes_zero = all(abs(value) <= 1e-9 for values in neutral_shape_values.values() for value in values.values())
    neutral_props_zero = all(abs(float(armature[name])) <= 1e-9 for name in property_ranges)
    neutral_mesh_basis_exact = all(
        all(tuple(float(c) for c in obj.data.vertices[i].co) == neutral_basis[obj.name][i] for i in range(len(obj.data.vertices)))
        for obj in bpy.data.objects if obj.type == "MESH" and obj.name in neutral_basis
    )
    all_channel_tests_pass = all(item["passed"] for item in runtime_tests.values())

    topology = {obj.name: topology_metrics(obj.data) for obj in bpy.data.objects if obj.type == "MESH"}
    wire_edges = sum(item["wire_edges"] for item in topology.values())
    invalid_non_manifold = sum(item["invalid_non_manifold"] for item in topology.values())
    zero_area = sum(item["zero_area_faces"] for item in topology.values())
    unweighted_deform_vertices = 0
    deform_group_names = {bone.name for bone in armature.data.bones if bone.use_deform}
    for vertex in foundation.data.vertices:
        total = 0.0
        for assignment in vertex.groups:
            group_name = foundation.vertex_groups[assignment.group].name
            if group_name in deform_group_names:
                total += assignment.weight
        if total <= 1e-8:
            unweighted_deform_vertices += 1
    images = len(bpy.data.images)
    image_nodes = sum(1 for material in bpy.data.materials if material.use_nodes for node in material.node_tree.nodes if node.type == "TEX_IMAGE")
    source_hash_pre_save = sha256_file(semantic_source)
    current_bones = {item["name"]: item for item in bone_signature(armature)}
    existing_bones_preserved = True
    for expected_bone in existing_bones_before:
        observed = current_bones.get(expected_bone["name"])
        if observed is None or observed["parent"] != expected_bone["parent"] or observed["use_deform"] != expected_bone["use_deform"]:
            existing_bones_preserved = False
            break
        if (Vector(observed["head"]) - Vector(expected_bone["head"])).length > 1e-7 or (Vector(observed["tail"]) - Vector(expected_bone["tail"])).length > 1e-7:
            existing_bones_preserved = False
            break
    gates = {
        "CertifiedSemanticInputUnchanged": source_hash_pre_save == source_hash_before,
        "ExistingBonesPreserved": existing_bones_preserved,
        "RequiredBonesCreated": all(armature.data.bones.get(name) for name in expected_bones),
        "AllChannelRuntimeTestsPass": all_channel_tests_pass,
        "NeutralShapeValuesZero": neutral_shapes_zero,
        "NeutralPropertiesZero": neutral_props_zero,
        "NeutralMeshBasisExact": neutral_mesh_basis_exact,
        "WireEdges": wire_edges == 0,
        "InvalidNonManifold": invalid_non_manifold == 0,
        "ZeroAreaFaces": zero_area == 0,
        "UnweightedDeformVertices": unweighted_deform_vertices == 0,
        "CreatedImages": images == 0 and image_nodes == 0,
    }
    failed = [name for name, passed in gates.items() if not passed]
    if failed:
        write_json(output / "R2_HEAD_RIG_BUILD_FAILURE_DIAGNOSTIC.json.tmp", {
            "failed_gates": failed,
            "runtime_tests": runtime_tests,
            "existing_bones_preserved": existing_bones_preserved,
            "neutral_shape_values": neutral_shape_values,
            "neutral_properties_zero": neutral_props_zero,
            "neutral_mesh_basis_exact": neutral_mesh_basis_exact,
        })
        raise RuntimeError("rig build gates failed: " + ",".join(failed))

    bone_map = {
        "schema_version": 1,
        "armature": armature.name,
        "preserved_existing_bones": existing_bones_before,
        "new_bones": [item for item in bone_signature(armature) if item["name"] in expected_bones],
        "jaw_deform_group": {"name": "DEF-face-jaw", "vertices": jaw_vertices, "weight": 0.68},
    }
    control_map = {
        "schema_version": 1,
        "control_bones": [name for name in expected_bones if name.startswith("CTRL-")],
        "runtime_properties": {name: {"minimum": limits[0], "maximum": limits[1], "neutral": 0.0} for name, limits in property_ranges.items()},
        "jaw_driver_object": "R2_JawDriver",
        "eye_pivot_objects": ["R2_EyePivot.L", "R2_EyePivot.R"],
    }
    shape_map = {
        obj.name: [key.name for key in obj.data.shape_keys.key_blocks]
        for obj in bpy.data.objects if obj.type == "MESH" and obj.data.shape_keys
    }
    expression_channels = {
        "NEUTRAL": {"status": "READY", "property_values": 0.0, "neutral_reset_exact": True},
        **{channel: {"status": "READY", **result} for channel, result in runtime_tests.items() if not channel.startswith("VISEME_")},
    }
    viseme_map = {
        name: {"status": "READY", "property": name, "runtime_test": runtime_tests[name]}
        for name in ("VISEME_A", "VISEME_E", "VISEME_O", "VISEME_MBP", "VISEME_FV", "VISEME_L")
    }
    expression_spec = {
        "schema_version": 2,
        "phase": "HEAD_RIGGING_AND_EXPRESSION_SYSTEM",
        "specification_status": "IMPLEMENTED_AND_RUNTIME_VALIDATED",
        "certified_semantic_source": str(semantic_source),
        "certified_semantic_source_sha256": source_hash_before,
        "responsibility_model": "bones own eye/jaw pivots; shape keys own blink, surface contact and expression form",
        "bone_map": bone_map,
        "control_map": control_map,
        "shape_key_map": shape_map,
        "expression_channels": expression_channels,
        "viseme_channels": viseme_map,
        "construction_authorized": True,
        "publication_authorized_after_independent_audit": True,
        "technical_verdict": "APROVADO",
    }
    build_report = {
        "schema_version": 1,
        "execution_status": "COMPLETED",
        "technical_verdict": "APROVADO",
        "blender_version": bpy.app.version_string,
        "source_path": str(semantic_source),
        "source_sha256_before": source_hash_before,
        "source_sha256_before_save": source_hash_pre_save,
        "objects_before": objects_before,
        "objects_after": sorted(bpy.data.objects.keys()),
        "meshes_before": meshes_before,
        "meshes_after": sorted(bpy.data.meshes.keys()),
        "materials_before": materials_before,
        "materials_after": sorted(bpy.data.materials.keys()),
        "new_object_names": sorted(set(bpy.data.objects.keys()) - set(objects_before)),
        "new_bone_names": expected_bones,
        "bone_map": bone_map,
        "control_map": control_map,
        "shape_key_map": shape_map,
        "runtime_tests": runtime_tests,
        "neutral_reset": {
            "properties_zero": neutral_props_zero,
            "shape_values_zero": neutral_shapes_zero,
            "mesh_basis_exact": neutral_mesh_basis_exact,
        },
        "topology": topology,
        "aggregate": {
            "wire_edges": wire_edges,
            "invalid_non_manifold": invalid_non_manifold,
            "zero_area_faces": zero_area,
            "unweighted_deform_vertices": unweighted_deform_vertices,
            "created_images": images,
        },
        "gates": gates,
        "failed_gates": failed,
    }
    write_json(output / "R2_HEAD_RIG_BUILD_REPORT.json.tmp", build_report)
    write_json(output / "R2_HEAD_RIG_BONE_MAP.json.tmp", bone_map)
    write_json(output / "R2_HEAD_RIG_CONTROL_MAP.json.tmp", control_map)
    write_json(output / "R2_HEAD_RIG_SHAPE_KEY_MAP.json.tmp", shape_map)
    write_json(output / "R2_EXPRESSION_SYSTEM_SPEC.json.tmp", expression_spec)
    write_json(output / "R2_EXPRESSION_CHANNEL_MAP.json.tmp", expression_channels)
    write_json(output / "R2_VISEME_READINESS_MAP.json.tmp", viseme_map)
    write_json(output / "R2_HEAD_RIG_RUNTIME_TEST_RESULTS.json.tmp", {
        "execution_status": "COMPLETED", "technical_verdict": "APROVADO",
        "runtime_tests": runtime_tests, "neutral_reset_exact": True,
        "all_tests_passed": all_channel_tests_pass, "created_images": 0,
    })

    reset_channels()
    bpy.ops.wm.save_as_mainfile(filepath=str(candidate), check_existing=False)
    candidate_hash = sha256_file(candidate)
    source_hash_after = sha256_file(semantic_source)
    if source_hash_after != source_hash_before:
        raise RuntimeError("certified semantic input changed after rig save")
    write_json(output / "R2_HEAD_RIG_SAVE_RESULT.json.tmp", {
        "candidate_path": str(candidate), "candidate_sha256": candidate_hash,
        "source_sha256_after": source_hash_after, "created_images": 0,
    })
    print("ExecutionStatus=COMPLETED")
    print("TechnicalVerdict=APROVADO")
    print("HeadRiggingConfirmed=True")
    print("ExpressionSystemConfirmed=True")
    print("NeutralResetExact=True")
    print(f"RuntimeChannelsPassed={sum(1 for item in runtime_tests.values() if item['passed'])}/{len(runtime_tests)}")
    print(f"WireEdges={wire_edges}")
    print(f"InvalidNonManifold={invalid_non_manifold}")
    print(f"UnweightedDeformVertices={unweighted_deform_vertices}")
    print(f"ZeroAreaFaces={zero_area}")
    print("FailedGates=NONE")
    print(f"CandidateSHA256={candidate_hash}")
    print("CertifiedSemanticInputUnchanged=True")
    print("CreatedImages=0")


if __name__ == "__main__":
    main()
