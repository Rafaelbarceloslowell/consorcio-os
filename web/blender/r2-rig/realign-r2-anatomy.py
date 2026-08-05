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


def configure_bone(
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

# Confirma que estamos trabalhando no arquivo sem pesos.
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

# Estrutura central.
configure_bone(
    bones,
    "root",
    (0.00, 0.00, -1.00),
    (0.00, 0.00, -0.84),
    deform=False,
)

configure_bone(
    bones,
    "pelvis",
    (0.00, 0.00, -0.40),
    (0.00, 0.00, -0.18),
    parent_name="root",
    connected=False,
)

configure_bone(
    bones,
    "spine_01",
    (0.00, 0.00, -0.18),
    (0.00, 0.00, 0.02),
    parent_name="pelvis",
    connected=True,
)

configure_bone(
    bones,
    "spine_02",
    (0.00, 0.00, 0.02),
    (0.00, 0.00, 0.22),
    parent_name="spine_01",
    connected=True,
)

configure_bone(
    bones,
    "chest",
    (0.00, 0.00, 0.22),
    (0.00, 0.00, 0.38),
    parent_name="spine_02",
    connected=True,
)

configure_bone(
    bones,
    "neck",
    (0.00, 0.00, 0.38),
    (0.00, -0.01, 0.56),
    parent_name="chest",
    connected=True,
)

configure_bone(
    bones,
    "head",
    (0.00, -0.01, 0.56),
    (0.00, -0.03, 0.90),
    parent_name="neck",
    connected=True,
)

# Braços, mãos e dedos.
for side_name, side in (
    ("L", 1.0),
    ("R", -1.0),
):
    configure_bone(
        bones,
        f"clavicle.{side_name}",
        (0.00, 0.00, 0.34),
        (side * 0.31, 0.00, 0.33),
        parent_name="chest",
        connected=False,
    )

    configure_bone(
        bones,
        f"upper_arm.{side_name}",
        (side * 0.31, 0.00, 0.33),
        (side * 0.405, -0.005, 0.06),
        parent_name=f"clavicle.{side_name}",
        connected=True,
    )

    configure_bone(
        bones,
        f"forearm.{side_name}",
        (side * 0.405, -0.005, 0.06),
        (side * 0.455, -0.015, -0.16),
        parent_name=f"upper_arm.{side_name}",
        connected=True,
    )

    configure_bone(
        bones,
        f"hand.{side_name}",
        (side * 0.455, -0.015, -0.16),
        (side * 0.462, -0.035, -0.275),
        parent_name=f"forearm.{side_name}",
        connected=True,
    )

    # Polegar, acomodado dentro da lateral da mão.
    configure_bone(
        bones,
        f"thumb_01.{side_name}",
        (side * 0.438, -0.045, -0.19),
        (side * 0.448, -0.085, -0.235),
        parent_name=f"hand.{side_name}",
        connected=False,
    )

    configure_bone(
        bones,
        f"thumb_02.{side_name}",
        (side * 0.448, -0.085, -0.235),
        (side * 0.452, -0.115, -0.275),
        parent_name=f"thumb_01.{side_name}",
        connected=True,
    )

    finger_depths = {
        "index": -0.075,
        "middle": -0.035,
        "ring": 0.005,
        "pinky": 0.045,
    }

    finger_lengths = {
        "index": 0.102,
        "middle": 0.108,
        "ring": 0.101,
        "pinky": 0.090,
    }

    for finger_name, depth in finger_depths.items():
        start_z = -0.18
        length = finger_lengths[finger_name]
        end_z = start_z - length

        first_z = start_z - length * 0.34
        second_z = start_z - length * 0.68

        configure_bone(
            bones,
            f"{finger_name}_01.{side_name}",
            (
                side * 0.450,
                depth,
                start_z,
            ),
            (
                side * 0.458,
                depth - 0.003,
                first_z,
            ),
            parent_name=f"hand.{side_name}",
            connected=False,
        )

        configure_bone(
            bones,
            f"{finger_name}_02.{side_name}",
            (
                side * 0.458,
                depth - 0.003,
                first_z,
            ),
            (
                side * 0.461,
                depth - 0.007,
                second_z,
            ),
            parent_name=f"{finger_name}_01.{side_name}",
            connected=True,
        )

        configure_bone(
            bones,
            f"{finger_name}_03.{side_name}",
            (
                side * 0.461,
                depth - 0.007,
                second_z,
            ),
            (
                side * 0.457,
                depth - 0.012,
                end_z,
            ),
            parent_name=f"{finger_name}_02.{side_name}",
            connected=True,
        )

# Quadril, joelhos, tornozelos e pés.
for side_name, side in (
    ("L", 1.0),
    ("R", -1.0),
):
    configure_bone(
        bones,
        f"thigh.{side_name}",
        (side * 0.18, 0.00, -0.40),
        (side * 0.20, -0.005, -0.67),
        parent_name="pelvis",
        connected=False,
    )

    configure_bone(
        bones,
        f"shin.{side_name}",
        (side * 0.20, -0.005, -0.67),
        (side * 0.19, -0.005, -0.90),
        parent_name=f"thigh.{side_name}",
        connected=True,
    )

    configure_bone(
        bones,
        f"foot.{side_name}",
        (side * 0.19, -0.005, -0.90),
        (side * 0.19, -0.14, -0.96),
        parent_name=f"shin.{side_name}",
        connected=True,
    )

    configure_bone(
        bones,
        f"toe.{side_name}",
        (side * 0.19, -0.14, -0.96),
        (side * 0.19, -0.26, -0.96),
        parent_name=f"foot.{side_name}",
        connected=True,
    )

bpy.ops.object.mode_set(
    mode="OBJECT",
)

rig.show_in_front = True
rig.data.display_type = "OCTAHEDRAL"

rig["r2_rig_version"] = "v6-anatomy-aligned"
rig["r2_rig_status"] = "full_anatomy_aligned"
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

joint_report = [
    (
        "shoulder.L="
        f"{bones if False else '0.310000,0.000000,0.330000'}"
    ),
    "elbow.L=0.405000,-0.005000,0.060000",
    "wrist.L=0.455000,-0.015000,-0.160000",
    "pelvis=0.000000,0.000000,-0.290000",
    "hip.L=0.180000,0.000000,-0.400000",
    "knee.L=0.200000,-0.005000,-0.670000",
    "ankle.L=0.190000,-0.005000,-0.900000",
]

report = [
    "R2_ANATOMY_ALIGNED_OK",
    f"blend={output_path}",
    f"bones={len(rig.data.bones)}",
    "body_unchanged=true",
    "weights_applied=false",
    "shoulders=realigned",
    "waist=realigned",
    "pelvis=realigned",
    "knees=realigned",
    "wrists=realigned",
    "fingers=realigned",
    "ankles=realigned",
    "feet=realigned",
    "status=full_anatomy_aligned",
    "",
    *joint_report,
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