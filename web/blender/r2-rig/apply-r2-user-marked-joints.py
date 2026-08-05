import bpy
import os
import sys


def get_arguments():
    if "--" not in sys.argv:
        raise RuntimeError("Argumentos não encontrados.")

    values = sys.argv[
        sys.argv.index("--") + 1:
    ]

    if len(values) != 2:
        raise RuntimeError(
            "Esperados: arquivo de saída e relatório."
        )

    return values


def get_bone(edit_bones, name):
    result = edit_bones.get(name)

    if result is None:
        raise RuntimeError(
            f"Osso não encontrado: {name}"
        )

    return result


def set_bone(
    edit_bones,
    name,
    head,
    tail,
    parent_name=None,
    connected=False,
    deform=True,
):
    current = get_bone(
        edit_bones,
        name,
    )

    current.use_connect = False
    current.parent = None

    current.head = head
    current.tail = tail
    current.roll = 0.0
    current.use_deform = deform

    if parent_name:
        parent = get_bone(
            edit_bones,
            parent_name,
        )

        current.parent = parent
        current.use_connect = connected


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

if (
    bpy.context.object
    and bpy.context.object.mode != "OBJECT"
):
    bpy.ops.object.mode_set(
        mode="OBJECT",
    )

# O arquivo continua sem pesos.
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
# CENTRO DO CORPO
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
    (0.000, -0.065, -0.340),
    (0.000, -0.065, -0.180),
    parent_name="root",
    connected=False,
)

set_bone(
    bones,
    "spine_01",
    (0.000, -0.065, -0.180),
    (0.000, -0.060, -0.050),
    parent_name="pelvis",
    connected=True,
)

# A articulação da cintura fica na marca amarela.
set_bone(
    bones,
    "spine_02",
    (0.000, -0.060, -0.050),
    (0.000, -0.040, 0.220),
    parent_name="spine_01",
    connected=True,
)

set_bone(
    bones,
    "chest",
    (0.000, -0.040, 0.220),
    (0.000, -0.020, 0.500),
    parent_name="spine_02",
    connected=True,
)

set_bone(
    bones,
    "neck",
    (0.000, -0.020, 0.500),
    (0.000, -0.010, 0.610),
    parent_name="chest",
    connected=True,
)

set_bone(
    bones,
    "head",
    (0.000, -0.010, 0.610),
    (0.000, 0.000, 0.900),
    parent_name="neck",
    connected=True,
)

# ---------------------------------------------------------
# OMBROS, COTOVELOS, PUNHOS E DEDOS
# ---------------------------------------------------------

for side_name, side in (
    ("L", 1.0),
    ("R", -1.0),
):
    # Marcações vermelhas.
    clavicle_origin = (
        0.000,
        -0.020,
        0.500,
    )

    shoulder = (
        side * 0.300,
        -0.015,
        0.560,
    )

    # Marcações verdes.
    elbow = (
        side * 0.400,
        -0.060,
        0.240,
    )

    # O punho fica acima do X preto da mão.
    wrist = (
        side * 0.400,
        -0.155,
        -0.120,
    )

    hand_end = (
        side * 0.400,
        -0.180,
        -0.250,
    )

    set_bone(
        bones,
        f"clavicle.{side_name}",
        clavicle_origin,
        shoulder,
        parent_name="chest",
        connected=False,
    )

    set_bone(
        bones,
        f"upper_arm.{side_name}",
        shoulder,
        elbow,
        parent_name=f"clavicle.{side_name}",
        connected=True,
    )

    set_bone(
        bones,
        f"forearm.{side_name}",
        elbow,
        wrist,
        parent_name=f"upper_arm.{side_name}",
        connected=True,
    )

    set_bone(
        bones,
        f"hand.{side_name}",
        wrist,
        hand_end,
        parent_name=f"forearm.{side_name}",
        connected=True,
    )

    set_bone(
        bones,
        f"thumb_01.{side_name}",
        (
            side * 0.372,
            -0.145,
            -0.150,
        ),
        (
            side * 0.352,
            -0.178,
            -0.195,
        ),
        parent_name=f"hand.{side_name}",
        connected=False,
    )

    set_bone(
        bones,
        f"thumb_02.{side_name}",
        (
            side * 0.352,
            -0.178,
            -0.195,
        ),
        (
            side * 0.342,
            -0.205,
            -0.235,
        ),
        parent_name=f"thumb_01.{side_name}",
        connected=True,
    )

    finger_data = {
        "index": (
            side * 0.373,
            -0.158,
            0.100,
        ),
        "middle": (
            side * 0.389,
            -0.166,
            0.108,
        ),
        "ring": (
            side * 0.405,
            -0.174,
            0.100,
        ),
        "pinky": (
            side * 0.420,
            -0.182,
            0.088,
        ),
    }

    for finger_name, (
        finger_x,
        finger_y,
        length,
    ) in finger_data.items():
        start_z = -0.145
        joint_01_z = (
            start_z -
            length * 0.34
        )
        joint_02_z = (
            start_z -
            length * 0.68
        )
        end_z = (
            start_z -
            length
        )

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
                joint_01_z,
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
                joint_01_z,
            ),
            (
                finger_x,
                finger_y - 0.007,
                joint_02_z,
            ),
            parent_name=(
                f"{finger_name}_01.{side_name}"
            ),
            connected=True,
        )

        set_bone(
            bones,
            f"{finger_name}_03.{side_name}",
            (
                finger_x,
                finger_y - 0.007,
                joint_02_z,
            ),
            (
                finger_x,
                finger_y - 0.011,
                end_z,
            ),
            parent_name=(
                f"{finger_name}_02.{side_name}"
            ),
            connected=True,
        )

# ---------------------------------------------------------
# QUADRIL, JOELHOS, TORNOZELOS E BOTAS
# ---------------------------------------------------------

for side_name, side in (
    ("L", 1.0),
    ("R", -1.0),
):
    hip = (
        side * 0.180,
        -0.060,
        -0.320,
    )

    # Marcações roxas.
    knee = (
        side * 0.210,
        0.010,
        -0.570,
    )

    # O tornozelo fica acima do X preto da bota.
    ankle = (
        side * 0.250,
        -0.075,
        -0.840,
    )

    # O X preto marca a região da bota.
    foot_ball = (
        side * 0.270,
        -0.200,
        -0.955,
    )

    toe = (
        side * 0.270,
        -0.290,
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
        foot_ball,
        parent_name=f"shin.{side_name}",
        connected=True,
    )

    set_bone(
        bones,
        f"toe.{side_name}",
        foot_ball,
        toe,
        parent_name=f"foot.{side_name}",
        connected=True,
    )

bpy.ops.object.mode_set(
    mode="OBJECT",
)

rig.show_in_front = True
rig.data.display_type = "OCTAHEDRAL"

rig["r2_rig_version"] = "v10-user-marked"
rig["r2_rig_status"] = "user_marked_joints_applied"
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
    "R2_USER_MARKED_JOINTS_OK",
    f"blend={output_path}",
    f"bones={len(rig.data.bones)}",
    "body_unchanged=true",
    "weights_applied=false",
    "shoulders=red_marks",
    "elbows=green_marks",
    "waist=yellow_mark",
    "knees=purple_marks",
    "hands=black_marks",
    "boots=black_marks",
    "ankles=raised_above_boot_marks",
    "shoulder_x=0.300",
    "shoulder_z=0.560",
    "elbow_z=0.240",
    "waist_z=-0.050",
    "knee_z=-0.570",
    "ankle_z=-0.840",
    "boot_z=-0.955",
    "status=user_marked_joints_applied",
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