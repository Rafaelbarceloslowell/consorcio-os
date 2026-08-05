import bpy
import math
import os
import sys

from mathutils import Matrix, Vector


def get_arguments():
    if "--" not in sys.argv:
        raise RuntimeError("Argumentos não encontrados.")

    arguments = sys.argv[sys.argv.index("--") + 1:]

    if len(arguments) != 2:
        raise RuntimeError(
            "Esperados: arquivo BLEND de saída e relatório."
        )

    return arguments


def world_bounds(obj):
    points = [
        obj.matrix_world @ Vector(corner)
        for corner in obj.bound_box
    ]

    minimum = Vector((
        min(point.x for point in points),
        min(point.y for point in points),
        min(point.z for point in points),
    ))

    maximum = Vector((
        max(point.x for point in points),
        max(point.y for point in points),
        max(point.z for point in points),
    ))

    return minimum, maximum, maximum - minimum


output_path, report_path = get_arguments()

output_path = os.path.abspath(output_path)
report_path = os.path.abspath(report_path)

body = bpy.data.objects.get("R2_Body")
rig = bpy.data.objects.get("R2_Rig")

if body is None or body.type != "MESH":
    raise RuntimeError("Malha R2_Body não encontrada.")

if rig is None or rig.type != "ARMATURE":
    raise RuntimeError("Armature R2_Rig não encontrada.")

if len(rig.data.bones) != 51:
    raise RuntimeError(
        f"Esperados 51 ossos; encontrados {len(rig.data.bones)}."
    )

bpy.ops.object.mode_set(
    mode="OBJECT",
)

bpy.ops.object.select_all(
    action="DESELECT",
)

# O nariz aponta para +X. Giramos o corpo 90 graus no eixo
# global Z para fazê-lo olhar para -Y, direção frontal do Blender.
front_rotation = Matrix.Rotation(
    math.radians(-90.0),
    4,
    "Z",
)

body.matrix_world = (
    front_rotation @
    body.matrix_world
)

# Grava a orientação diretamente na geometria. O corpo permanece
# visualmente igual, mas Location/Rotation/Scale ficam normalizados.
body.select_set(True)
bpy.context.view_layer.objects.active = body

bpy.ops.object.transform_apply(
    location=True,
    rotation=True,
    scale=True,
)

body["r2_orientation"] = "front_negative_y"
body["r2_transform_status"] = "applied"

rig.show_in_front = True
rig.data.display_type = "OCTAHEDRAL"
rig["r2_rig_version"] = "v4-oriented"
rig["r2_rig_status"] = "body_oriented"

minimum, maximum, dimensions = world_bounds(body)

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
    "R2_ORIENTATION_OK",
    f"blend={output_path}",
    f"bones={len(rig.data.bones)}",
    "body_forward=-Y",
    (
        "body_rotation="
        f"{body.rotation_euler.x:.6f},"
        f"{body.rotation_euler.y:.6f},"
        f"{body.rotation_euler.z:.6f}"
    ),
    (
        "dimensions="
        f"{dimensions.x:.6f},"
        f"{dimensions.y:.6f},"
        f"{dimensions.z:.6f}"
    ),
    (
        "bounds_min="
        f"{minimum.x:.6f},"
        f"{minimum.y:.6f},"
        f"{minimum.z:.6f}"
    ),
    (
        "bounds_max="
        f"{maximum.x:.6f},"
        f"{maximum.y:.6f},"
        f"{maximum.z:.6f}"
    ),
    "status=body_oriented",
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