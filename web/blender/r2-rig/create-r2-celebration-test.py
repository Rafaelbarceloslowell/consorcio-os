import bpy
import math
import os
import sys

from mathutils import Matrix, Vector


def arguments():
    if "--" not in sys.argv:
        raise RuntimeError("Argumentos não encontrados.")

    values = sys.argv[sys.argv.index("--") + 1:]

    if len(values) != 2:
        raise RuntimeError(
            "Esperados: arquivo de saída e relatório."
        )

    return values


def reset_pose(rig):
    for pose_bone in rig.pose.bones:
        pose_bone.rotation_mode = "QUATERNION"
        pose_bone.location = (0.0, 0.0, 0.0)
        pose_bone.rotation_quaternion = (
            1.0,
            0.0,
            0.0,
            0.0,
        )
        pose_bone.scale = (1.0, 1.0, 1.0)


def rotate_world(
    rig,
    bone_name,
    angle_degrees,
    axis,
):
    pose_bone = rig.pose.bones.get(bone_name)

    if pose_bone is None:
        raise RuntimeError(
            f"Osso não encontrado: {bone_name}"
        )

    bpy.context.view_layer.update()

    pivot = pose_bone.head.copy()

    rotation = Matrix.Rotation(
        math.radians(angle_degrees),
        4,
        Vector(axis).normalized(),
    )

    transform = (
        Matrix.Translation(pivot)
        @ rotation
        @ Matrix.Translation(-pivot)
    )

    pose_bone.matrix = (
        transform
        @ pose_bone.matrix
    )

    bpy.context.view_layer.update()


output_path, report_path = arguments()

output_path = os.path.abspath(output_path)
report_path = os.path.abspath(report_path)

rig = bpy.data.objects.get("R2_Rig")
body = bpy.data.objects.get("R2_Body")

if rig is None or rig.type != "ARMATURE":
    raise RuntimeError("R2_Rig não encontrado.")

if body is None or body.type != "MESH":
    raise RuntimeError("R2_Body não encontrado.")

if body.parent != rig:
    raise RuntimeError(
        "A malha não está ligada ao rig."
    )

if len(rig.data.bones) != 51:
    raise RuntimeError(
        f"Esperados 51 ossos; encontrados "
        f"{len(rig.data.bones)}."
    )

if (
    bpy.context.object
    and bpy.context.object.mode != "OBJECT"
):
    bpy.ops.object.mode_set(mode="OBJECT")

rig.data.pose_position = "POSE"

bpy.ops.object.select_all(
    action="DESELECT"
)

rig.select_set(True)
bpy.context.view_layer.objects.active = rig

reset_pose(rig)

bpy.context.scene.frame_set(1)
bpy.context.view_layer.update()

# Peito abre discretamente para a comemoração.
rotate_world(
    rig,
    "chest",
    -4.0,
    (1.0, 0.0, 0.0),
)

# Cabeça olha levemente para cima.
rotate_world(
    rig,
    "head",
    -7.0,
    (1.0, 0.0, 0.0),
)

# Clavículas acompanham a elevação dos braços.
rotate_world(
    rig,
    "clavicle.L",
    -12.0,
    (0.0, 1.0, 0.0),
)

rotate_world(
    rig,
    "clavicle.R",
    12.0,
    (0.0, 1.0, 0.0),
)

# Braços levantados acima da linha dos ombros.
rotate_world(
    rig,
    "upper_arm.L",
    -100.0,
    (0.0, 1.0, 0.0),
)

rotate_world(
    rig,
    "upper_arm.R",
    100.0,
    (0.0, 1.0, 0.0),
)

# Cotovelos dobrados para evitar pose rígida.
rotate_world(
    rig,
    "forearm.L",
    28.0,
    (0.0, 1.0, 0.0),
)

rotate_world(
    rig,
    "forearm.R",
    -28.0,
    (0.0, 1.0, 0.0),
)

# Punhos levemente inclinados.
rotate_world(
    rig,
    "hand.L",
    -8.0,
    (0.0, 1.0, 0.0),
)

rotate_world(
    rig,
    "hand.R",
    8.0,
    (0.0, 1.0, 0.0),
)

rig["r2_rig_version"] = (
    "v15-celebration-test"
)

rig["r2_rig_status"] = (
    "celebration_range_test"
)

rig["r2_pose_test_only"] = True

os.makedirs(
    os.path.dirname(output_path),
    exist_ok=True,
)

bpy.ops.object.mode_set(mode="POSE")

bpy.ops.wm.save_as_mainfile(
    filepath=output_path,
)

report = [
    "R2_CELEBRATION_TEST_OK",
    f"blend={output_path}",
    f"bones={len(rig.data.bones)}",
    "source=v13-weights-refined",
    "clavicles=raised",
    "upper_arms=100_degrees",
    "elbows=28_degrees",
    "chest_extension=4_degrees",
    "head_up=7_degrees",
    "status=celebration_range_test",
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