import bpy
import math
import os
import sys

from mathutils import Matrix


def get_arguments():
    if "--" not in sys.argv:
        raise RuntimeError("Argumentos não encontrados.")

    arguments = sys.argv[sys.argv.index("--") + 1:]

    if len(arguments) != 2:
        raise RuntimeError(
            "Esperados: arquivo de saída e relatório."
        )

    return arguments


output_path, report_path = get_arguments()

output_path = os.path.abspath(output_path)
report_path = os.path.abspath(report_path)

body = bpy.data.objects.get("R2_Body")
rig = bpy.data.objects.get("R2_Rig")

if body is None or body.type != "MESH":
    raise RuntimeError("R2_Body não encontrado.")

if rig is None or rig.type != "ARMATURE":
    raise RuntimeError("R2_Rig não encontrado.")

if len(rig.data.bones) != 51:
    raise RuntimeError(
        f"Esperados 51 ossos; encontrados {len(rig.data.bones)}."
    )

if bpy.context.object and bpy.context.object.mode != "OBJECT":
    bpy.ops.object.mode_set(mode="OBJECT")

bpy.ops.object.select_all(
    action="DESELECT",
)

rig.select_set(True)
bpy.context.view_layer.objects.active = rig

# O corpo original olha para -X.
# O rig foi construído olhando para -Y.
# Giramos somente o rig para fazê-lo olhar para -X.
rotation = Matrix.Rotation(
    math.radians(-90.0),
    4,
    "Z",
)

rig.matrix_world = (
    rotation @
    rig.matrix_world
)

bpy.ops.object.transform_apply(
    location=True,
    rotation=True,
    scale=True,
)

rig.show_in_front = True
rig.data.display_type = "OCTAHEDRAL"

rig["r2_rig_version"] = "v5-axis-aligned"
rig["r2_rig_status"] = "rig_axis_aligned"
rig["r2_forward_axis"] = "-X"
rig["r2_total_bone_count"] = len(rig.data.bones)

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
    "R2_RIG_AXIS_OK",
    f"blend={output_path}",
    f"bones={len(rig.data.bones)}",
    "body_unchanged=true",
    "rig_forward=-X",
    (
        "rig_rotation="
        f"{rig.rotation_euler.x:.6f},"
        f"{rig.rotation_euler.y:.6f},"
        f"{rig.rotation_euler.z:.6f}"
    ),
    "status=rig_axis_aligned",
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