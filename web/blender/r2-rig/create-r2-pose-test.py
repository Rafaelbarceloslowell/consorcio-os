import bpy
import math
import os
import sys

from mathutils import Matrix, Vector


def get_arguments():
    if "--" not in sys.argv:
        raise RuntimeError(
            "Argumentos não encontrados."
        )

    values = sys.argv[
        sys.argv.index("--") + 1:
    ]

    if len(values) != 2:
        raise RuntimeError(
            "Esperados: arquivo de saída e relatório."
        )

    return values


def reset_pose(rig):
    for pose_bone in rig.pose.bones:
        pose_bone.rotation_mode = "QUATERNION"
        pose_bone.location = (
            0.0,
            0.0,
            0.0,
        )
        pose_bone.rotation_quaternion = (
            1.0,
            0.0,
            0.0,
            0.0,
        )
        pose_bone.scale = (
            1.0,
            1.0,
            1.0,
        )


def rotate_around_head(
    rig,
    bone_name,
    angle_degrees,
    axis,
):
    pose_bone = rig.pose.bones.get(
        bone_name
    )

    if pose_bone is None:
        raise RuntimeError(
            f"Osso não encontrado: {bone_name}"
        )

    bpy.context.view_layer.update()

    pivot = pose_bone.head.copy()

    axis_vector = Vector(
        axis
    ).normalized()

    rotation = Matrix.Rotation(
        math.radians(
            angle_degrees
        ),
        4,
        axis_vector,
    )

    transformation = (
        Matrix.Translation(pivot)
        @ rotation
        @ Matrix.Translation(-pivot)
    )

    pose_bone.matrix = (
        transformation
        @ pose_bone.matrix
    )

    bpy.context.view_layer.update()


output_path, report_path = get_arguments()

output_path = os.path.abspath(
    output_path
)

report_path = os.path.abspath(
    report_path
)

rig = bpy.data.objects.get(
    "R2_Rig"
)

body = bpy.data.objects.get(
    "R2_Body"
)

if rig is None or rig.type != "ARMATURE":
    raise RuntimeError(
        "R2_Rig não encontrado."
    )

if body is None or body.type != "MESH":
    raise RuntimeError(
        "R2_Body não encontrado."
    )

if len(rig.data.bones) != 51:
    raise RuntimeError(
        f"Esperados 51 ossos; encontrados "
        f"{len(rig.data.bones)}."
    )

armature_modifiers = [
    modifier
    for modifier in body.modifiers
    if modifier.type == "ARMATURE"
]

if len(armature_modifiers) != 1:
    raise RuntimeError(
        "Modificador Armature inválido."
    )

if body.parent != rig:
    raise RuntimeError(
        "A malha não está ligada ao R2_Rig."
    )

if (
    bpy.context.object
    and bpy.context.object.mode != "OBJECT"
):
    bpy.ops.object.mode_set(
        mode="OBJECT",
    )

rig.data.pose_position = "POSE"

bpy.ops.object.select_all(
    action="DESELECT",
)

rig.select_set(True)
bpy.context.view_layer.objects.active = rig

reset_pose(rig)

bpy.context.scene.frame_set(1)
bpy.context.view_layer.update()

# Cabeça: inclinação discreta.
rotate_around_head(
    rig,
    "head",
    5.0,
    (
        0.0,
        1.0,
        0.0,
    ),
)

# Braço esquerdo: elevação leve.
rotate_around_head(
    rig,
    "upper_arm.L",
    -14.0,
    (
        0.0,
        1.0,
        0.0,
    ),
)

# Cotovelo esquerdo: dobra visível.
rotate_around_head(
    rig,
    "forearm.L",
    27.0,
    (
        0.0,
        1.0,
        0.0,
    ),
)

# Punho esquerdo: ajuste pequeno.
rotate_around_head(
    rig,
    "hand.L",
    -7.0,
    (
        0.0,
        1.0,
        0.0,
    ),
)

# Perna direita: avanço discreto.
rotate_around_head(
    rig,
    "thigh.R",
    6.0,
    (
        1.0,
        0.0,
        0.0,
    ),
)

# Joelho direito: dobra leve.
rotate_around_head(
    rig,
    "shin.R",
    -15.0,
    (
        1.0,
        0.0,
        0.0,
    ),
)

rig["r2_rig_version"] = (
    "v12-pose-test"
)

rig["r2_rig_status"] = (
    "pose_deformation_test"
)

rig["r2_pose_test_only"] = True

os.makedirs(
    os.path.dirname(output_path),
    exist_ok=True,
)

# Salva já em Pose Mode para facilitar a inspeção.
bpy.ops.object.mode_set(
    mode="POSE",
)

bpy.ops.wm.save_as_mainfile(
    filepath=output_path,
)

report = [
    "R2_POSE_TEST_OK",
    f"blend={output_path}",
    f"bones={len(rig.data.bones)}",
    "source=v11-weighted-repaired",
    "head_tilt=5",
    "upper_arm_left=-14",
    "forearm_left=27",
    "hand_left=-7",
    "thigh_right=6",
    "shin_right=-15",
    "status=pose_deformation_test",
]

with open(
    report_path,
    "w",
    encoding="utf-8",
) as report_file:
    report_file.write(
        "\n".join(report)
    )

print(
    "\n".join(report)
)