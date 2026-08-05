import bpy
import os
import sys


def get_arguments():
    if "--" not in sys.argv:
        raise RuntimeError("Argumentos não encontrados.")

    arguments = sys.argv[sys.argv.index("--") + 1:]

    if len(arguments) != 2:
        raise RuntimeError(
            "Esperados: arquivo de saída e relatório."
        )

    return arguments


def get_bone(edit_bones, name):
    bone = edit_bones.get(name)

    if bone is None:
        raise RuntimeError(
            f"Osso não encontrado: {name}"
        )

    return bone


def position_bone(
    edit_bones,
    name,
    head,
    tail,
    parent_name,
    connected,
):
    bone = get_bone(
        edit_bones,
        name,
    )

    parent = get_bone(
        edit_bones,
        parent_name,
    )

    bone.use_connect = False
    bone.parent = None

    bone.head = head
    bone.tail = tail
    bone.roll = 0.0

    bone.parent = parent
    bone.use_connect = connected


output_path, report_path = get_arguments()

output_path = os.path.abspath(output_path)
report_path = os.path.abspath(report_path)

rig = bpy.data.objects.get("R2_Rig")
body = bpy.data.objects.get("R2_Body")

if rig is None or rig.type != "ARMATURE":
    raise RuntimeError("R2_Rig não encontrado.")

if body is None or body.type != "MESH":
    raise RuntimeError("R2_Body não encontrado.")

if len(rig.data.bones) != 51:
    raise RuntimeError(
        f"Esperados 51 ossos; encontrados {len(rig.data.bones)}."
    )

if bpy.context.object and bpy.context.object.mode != "OBJECT":
    bpy.ops.object.mode_set(
        mode="OBJECT",
    )

# Garante que o arquivo continue sem pesos.
body.parent = None

for modifier in list(body.modifiers):
    if modifier.type == "ARMATURE":
        body.modifiers.remove(modifier)

body.vertex_groups.clear()

bpy.ops.object.select_all(
    action="DESELECT",
)

rig.select_set(True)
bpy.context.view_layer.objects.active = rig

bpy.ops.object.mode_set(
    mode="EDIT",
)

bones = rig.data.edit_bones

# ---------------------------------------------------------
# OMBROS
# ---------------------------------------------------------
# Centro alto na base do pescoço.
# Extremidades descem suavemente para o centro dos deltoides.

for side_name, side in (
    ("L", 1.0),
    ("R", -1.0),
):
    clavicle_origin = (
        0.000,
        -0.020,
        0.490,
    )

    shoulder = (
        side * 0.355,
        -0.012,
        0.445,
    )

    elbow = (
        side * 0.395,
        -0.064,
        0.065,
    )

    wrist = (
        side * 0.391,
        -0.166,
        -0.155,
    )

    position_bone(
        bones,
        f"clavicle.{side_name}",
        clavicle_origin,
        shoulder,
        "chest",
        False,
    )

    position_bone(
        bones,
        f"upper_arm.{side_name}",
        shoulder,
        elbow,
        f"clavicle.{side_name}",
        True,
    )

    position_bone(
        bones,
        f"forearm.{side_name}",
        elbow,
        wrist,
        f"upper_arm.{side_name}",
        True,
    )

# ---------------------------------------------------------
# QUADRIL E PERNAS
# ---------------------------------------------------------
# Quadris ficam mais internos do que a superfície da calça.
# Joelhos acompanham o centro das pernas.
# Tornozelos abrem para o centro das botas.

for side_name, side in (
    ("L", 1.0),
    ("R", -1.0),
):
    hip = (
        side * 0.190,
        -0.063,
        -0.390,
    )

    knee = (
        side * 0.210,
        0.012,
        -0.655,
    )

    ankle = (
        side * 0.260,
        -0.080,
        -0.895,
    )

    foot_ball = (
        side * 0.270,
        -0.210,
        -0.958,
    )

    toe = (
        side * 0.270,
        -0.290,
        -0.958,
    )

    position_bone(
        bones,
        f"thigh.{side_name}",
        hip,
        knee,
        "pelvis",
        False,
    )

    position_bone(
        bones,
        f"shin.{side_name}",
        knee,
        ankle,
        f"thigh.{side_name}",
        True,
    )

    position_bone(
        bones,
        f"foot.{side_name}",
        ankle,
        foot_ball,
        f"shin.{side_name}",
        True,
    )

    position_bone(
        bones,
        f"toe.{side_name}",
        foot_ball,
        toe,
        f"foot.{side_name}",
        True,
    )

bpy.ops.object.mode_set(
    mode="OBJECT",
)

rig.show_in_front = True
rig.data.display_type = "OCTAHEDRAL"

rig["r2_rig_version"] = "v9-joints-refined"
rig["r2_rig_status"] = "shoulders_and_legs_refined"
rig["r2_weights_applied"] = False

body["r2_weight_status"] = "not_applied"

bpy.ops.object.select_all(
    action="DESELECT",
)

rig.select_set(True)
bpy.context.view_layer.objects.active = rig

os.makedirs(
    os.path.dirname(output_path),
    exist_ok=True,
)

bpy.ops.wm.save_as_mainfile(
    filepath=output_path,
)

report = [
    "R2_JOINTS_REFINED_OK",
    f"blend={output_path}",
    f"bones={len(rig.data.bones)}",
    "body_unchanged=true",
    "weights_applied=false",
    "shoulder_x=0.355",
    "shoulder_z=0.445",
    "hip_x=0.190",
    "hip_z=-0.390",
    "knee_x=0.210",
    "knee_z=-0.655",
    "ankle_x=0.260",
    "ankle_z=-0.895",
    "foot_x=0.270",
    "status=shoulders_and_legs_refined",
]

with open(
    report_path,
    "w",
    encoding="utf-8",
) as report_file:
    report_file.write(
        "\n".join(report)
    )

print("\n".join(report))