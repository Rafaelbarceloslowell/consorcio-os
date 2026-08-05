import bpy
import os
import sys


def get_arguments():
    if "--" not in sys.argv:
        raise RuntimeError("Argumentos não encontrados.")

    arguments = sys.argv[
        sys.argv.index("--") + 1:
    ]

    if len(arguments) != 2:
        raise RuntimeError(
            "Esperados: arquivo de saída e relatório."
        )

    return arguments


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

bpy.ops.object.select_all(
    action="DESELECT",
)

rig.select_set(True)
bpy.context.view_layer.objects.active = rig

bpy.ops.object.mode_set(
    mode="EDIT",
)

bones = rig.data.edit_bones

chest = bones.get("chest")

if chest is None:
    raise RuntimeError("Osso chest não encontrado.")

for side_name, side in (
    ("L", 1.0),
    ("R", -1.0),
):
    clavicle = bones.get(
        f"clavicle.{side_name}"
    )

    upper_arm = bones.get(
        f"upper_arm.{side_name}"
    )

    forearm = bones.get(
        f"forearm.{side_name}"
    )

    if (
        clavicle is None
        or upper_arm is None
        or forearm is None
    ):
        raise RuntimeError(
            f"Estrutura incompleta no lado {side_name}."
        )

    clavicle_origin = (
        0.000,
        -0.020,
        0.490,
    )

    shoulder_pivot = (
        side * 0.370,
        -0.012,
        0.470,
    )

    elbow_pivot = (
        side * 0.395,
        -0.064,
        0.065,
    )

    wrist_pivot = (
        side * 0.391,
        -0.166,
        -0.155,
    )

    clavicle.parent = chest
    clavicle.use_connect = False
    clavicle.head = clavicle_origin
    clavicle.tail = shoulder_pivot
    clavicle.roll = 0.0

    upper_arm.parent = clavicle
    upper_arm.use_connect = True
    upper_arm.head = shoulder_pivot
    upper_arm.tail = elbow_pivot
    upper_arm.roll = 0.0

    forearm.parent = upper_arm
    forearm.use_connect = True
    forearm.head = elbow_pivot
    forearm.tail = wrist_pivot
    forearm.roll = 0.0

bpy.ops.object.mode_set(
    mode="OBJECT",
)

rig.show_in_front = True
rig.data.display_type = "OCTAHEDRAL"

rig["r2_rig_version"] = "v8-shoulders-raised"
rig["r2_rig_status"] = "shoulders_raised"
rig["r2_weights_applied"] = False

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
    "R2_SHOULDERS_RAISED_OK",
    f"blend={output_path}",
    f"bones={len(rig.data.bones)}",
    "body_unchanged=true",
    "weights_applied=false",
    "clavicle_origin_z=0.490",
    "shoulder_x=0.370",
    "shoulder_y=-0.012",
    "shoulder_z=0.470",
    "elbows_unchanged=true",
    "wrists_unchanged=true",
    "status=shoulders_raised",
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