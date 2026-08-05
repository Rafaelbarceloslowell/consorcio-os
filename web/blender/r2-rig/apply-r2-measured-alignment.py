import bpy
import os
import sys


def get_arguments():
    if "--" not in sys.argv:
        raise RuntimeError("Argumentos não encontrados.")

    arguments = sys.argv[sys.argv.index("--") + 1:]

    if len(arguments) != 2:
        raise RuntimeError(
            "Esperados: arquivo BLEND de saída e relatório."
        )

    return arguments


def set_bone(
    edit_bones,
    name,
    head,
    tail,
    parent_name=None,
    connected=False,
    deform=True,
):
    bone = edit_bones.get(name)

    if bone is None:
        raise RuntimeError(
            f"Osso não encontrado: {name}"
        )

    bone.use_connect = False
    bone.parent = None

    bone.head = head
    bone.tail = tail
    bone.roll = 0.0
    bone.use_deform = deform

    if parent_name:
        parent = edit_bones.get(parent_name)

        if parent is None:
            raise RuntimeError(
                f"Pai não encontrado: {parent_name}"
            )

        bone.parent = parent
        bone.use_connect = connected

    return bone


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

# O v7 continua sendo uma versão sem pesos.
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
# ESTRUTURA CENTRAL
# ---------------------------------------------------------

set_bone(
    bones,
    "root",
    (0.000, -0.060, -1.000),
    (0.000, -0.060, -0.850),
    deform=False,
)

set_bone(
    bones,
    "pelvis",
    (0.000, -0.060, -0.420),
    (0.000, -0.060, -0.200),
    parent_name="root",
    connected=False,
)

set_bone(
    bones,
    "spine_01",
    (0.000, -0.060, -0.200),
    (0.000, -0.075, 0.000),
    parent_name="pelvis",
    connected=True,
)

set_bone(
    bones,
    "spine_02",
    (0.000, -0.075, 0.000),
    (0.000, -0.055, 0.220),
    parent_name="spine_01",
    connected=True,
)

set_bone(
    bones,
    "chest",
    (0.000, -0.055, 0.220),
    (0.000, -0.020, 0.430),
    parent_name="spine_02",
    connected=True,
)

set_bone(
    bones,
    "neck",
    (0.000, -0.020, 0.430),
    (0.000, -0.010, 0.590),
    parent_name="chest",
    connected=True,
)

set_bone(
    bones,
    "head",
    (0.000, -0.010, 0.590),
    (0.000, 0.000, 0.900),
    parent_name="neck",
    connected=True,
)

# ---------------------------------------------------------
# OMBROS, BRAÇOS, MÃOS E DEDOS
# ---------------------------------------------------------

for side_name, side in (
    ("L", 1.0),
    ("R", -1.0),
):
    shoulder_x = side * 0.340
    elbow_x = side * 0.395
    wrist_x = side * 0.391

    # Linha das clavículas elevada para a base do pescoço.
    set_bone(
        bones,
        f"clavicle.{side_name}",
        (0.000, -0.020, 0.430),
        (shoulder_x, -0.003, 0.430),
        parent_name="chest",
        connected=False,
    )

    set_bone(
        bones,
        f"upper_arm.{side_name}",
        (shoulder_x, -0.003, 0.430),
        (elbow_x, -0.064, 0.065),
        parent_name=f"clavicle.{side_name}",
        connected=True,
    )

    set_bone(
        bones,
        f"forearm.{side_name}",
        (elbow_x, -0.064, 0.065),
        (wrist_x, -0.166, -0.155),
        parent_name=f"upper_arm.{side_name}",
        connected=True,
    )

    set_bone(
        bones,
        f"hand.{side_name}",
        (wrist_x, -0.166, -0.155),
        (wrist_x, -0.180, -0.285),
        parent_name=f"forearm.{side_name}",
        connected=True,
    )

    # Polegar voltado para o lado interno da palma.
    set_bone(
        bones,
        f"thumb_01.{side_name}",
        (side * 0.365, -0.150, -0.175),
        (side * 0.350, -0.180, -0.220),
        parent_name=f"hand.{side_name}",
        connected=False,
    )

    set_bone(
        bones,
        f"thumb_02.{side_name}",
        (side * 0.350, -0.180, -0.220),
        (side * 0.342, -0.205, -0.255),
        parent_name=f"thumb_01.{side_name}",
        connected=True,
    )

    # Dedos distribuídos dentro da largura real da mão.
    finger_data = {
        "index": (
            side * 0.372,
            -0.160,
            0.105,
        ),
        "middle": (
            side * 0.388,
            -0.168,
            0.112,
        ),
        "ring": (
            side * 0.404,
            -0.176,
            0.105,
        ),
        "pinky": (
            side * 0.420,
            -0.184,
            0.092,
        ),
    }

    for finger_name, (
        finger_x,
        finger_y,
        finger_length,
    ) in finger_data.items():
        start_z = -0.175
        first_z = start_z - finger_length * 0.34
        second_z = start_z - finger_length * 0.68
        end_z = start_z - finger_length

        set_bone(
            bones,
            f"{finger_name}_01.{side_name}",
            (
                finger_x,
                finger_y,
                start_z,
            ),
            (
                finger_x,
                finger_y - 0.003,
                first_z,
            ),
            parent_name=f"hand.{side_name}",
            connected=False,
        )

        set_bone(
            bones,
            f"{finger_name}_02.{side_name}",
            (
                finger_x,
                finger_y - 0.003,
                first_z,
            ),
            (
                finger_x,
                finger_y - 0.007,
                second_z,
            ),
            parent_name=f"{finger_name}_01.{side_name}",
            connected=True,
        )

        set_bone(
            bones,
            f"{finger_name}_03.{side_name}",
            (
                finger_x,
                finger_y - 0.007,
                second_z,
            ),
            (
                finger_x,
                finger_y - 0.011,
                end_z,
            ),
            parent_name=f"{finger_name}_02.{side_name}",
            connected=True,
        )

# ---------------------------------------------------------
# QUADRIL, JOELHOS, TORNOZELOS E PÉS
# ---------------------------------------------------------

for side_name, side in (
    ("L", 1.0),
    ("R", -1.0),
):
    hip = (
        side * 0.250,
        -0.063,
        -0.400,
    )

    knee = (
        side * 0.219,
        0.012,
        -0.640,
    )

    ankle = (
        side * 0.225,
        -0.055,
        -0.885,
    )

    foot_center = (
        side * 0.250,
        -0.190,
        -0.955,
    )

    toe_end = (
        side * 0.265,
        -0.285,
        -0.955,
    )

    set_bone(
        bones,
        f"thigh.{side_name}",
        hip,
        knee,
        parent_name="pelvis",
        connected=False,
    )

    set_bone(
        bones,
        f"shin.{side_name}",
        knee,
        ankle,
        parent_name=f"thigh.{side_name}",
        connected=True,
    )

    set_bone(
        bones,
        f"foot.{side_name}",
        ankle,
        foot_center,
        parent_name=f"shin.{side_name}",
        connected=True,
    )

    set_bone(
        bones,
        f"toe.{side_name}",
        foot_center,
        toe_end,
        parent_name=f"foot.{side_name}",
        connected=True,
    )

bpy.ops.object.mode_set(
    mode="OBJECT",
)

rig.show_in_front = True
rig.data.display_type = "OCTAHEDRAL"

rig["r2_rig_version"] = "v7-measured-alignment"
rig["r2_rig_status"] = "geometry_measured_alignment"
rig["r2_total_bone_count"] = len(rig.data.bones)
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
    "R2_MEASURED_ALIGNMENT_OK",
    f"blend={output_path}",
    f"bones={len(rig.data.bones)}",
    "body_unchanged=true",
    "weights_applied=false",
    "shoulder_height=0.430",
    "shoulder_x=0.340",
    "elbow_x=0.395",
    "wrist_x=0.391",
    "hip_x=0.250",
    "knee_x=0.219",
    "knee_z=-0.640",
    "ankle_z=-0.885",
    "status=geometry_measured_alignment",
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