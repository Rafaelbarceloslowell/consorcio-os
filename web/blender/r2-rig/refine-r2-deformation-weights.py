import bpy
import math
import os
import sys

from collections import defaultdict
from mathutils import Matrix, Vector


def get_arguments():
    if "--" not in sys.argv:
        raise RuntimeError(
            "Argumentos não encontrados."
        )

    values = sys.argv[
        sys.argv.index("--") + 1:
    ]

    if len(values) != 3:
        raise RuntimeError(
            "Esperados: arquivo de repouso, "
            "arquivo de pose e relatório."
        )

    return values


def clamp(value, minimum=0.0, maximum=1.0):
    return max(
        minimum,
        min(maximum, value),
    )


def smoothstep(edge_0, edge_1, value):
    if edge_0 == edge_1:
        return 0.0

    factor = clamp(
        (value - edge_0)
        /
        (edge_1 - edge_0)
    )

    return (
        factor
        *
        factor
        *
        (3.0 - 2.0 * factor)
    )


def get_group(body, name):
    group = body.vertex_groups.get(name)

    if group is None:
        group = body.vertex_groups.new(
            name=name
        )

    return group


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

    rotation = Matrix.Rotation(
        math.radians(angle_degrees),
        4,
        Vector(axis).normalized(),
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


rest_path, pose_path, report_path = get_arguments()

rest_path = os.path.abspath(rest_path)
pose_path = os.path.abspath(pose_path)
report_path = os.path.abspath(report_path)

body = bpy.data.objects.get("R2_Body")
rig = bpy.data.objects.get("R2_Rig")

if body is None or body.type != "MESH":
    raise RuntimeError(
        "R2_Body não encontrado."
    )

if rig is None or rig.type != "ARMATURE":
    raise RuntimeError(
        "R2_Rig não encontrado."
    )

if len(rig.data.bones) != 51:
    raise RuntimeError(
        f"Esperados 51 ossos; encontrados "
        f"{len(rig.data.bones)}."
    )

if body.parent != rig:
    raise RuntimeError(
        "A malha não está ligada ao rig."
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

if (
    bpy.context.object
    and bpy.context.object.mode != "OBJECT"
):
    bpy.ops.object.mode_set(
        mode="OBJECT"
    )

rig.data.pose_position = "POSE"
reset_pose(rig)

bpy.context.scene.frame_set(1)
bpy.context.view_layer.update()

deform_bone_names = {
    bone.name
    for bone in rig.data.bones
    if bone.use_deform
}

group_name_by_index = {
    group.index: group.name
    for group in body.vertex_groups
}

finger_prefixes = (
    "thumb_",
    "index_",
    "middle_",
    "ring_",
    "pinky_",
)

arm_groups = set()

for side in ("L", "R"):
    arm_groups.update({
        f"clavicle.{side}",
        f"upper_arm.{side}",
        f"forearm.{side}",
        f"hand.{side}",
    })

    for prefix in finger_prefixes:
        maximum_joint = (
            2 if prefix == "thumb_"
            else 3
        )

        for joint in range(
            1,
            maximum_joint + 1,
        ):
            arm_groups.add(
                f"{prefix}{joint:02d}.{side}"
            )

lower_body_groups = {
    "pelvis",
    "spine_01",
}

for side in ("L", "R"):
    lower_body_groups.update({
        f"thigh.{side}",
        f"shin.{side}",
        f"foot.{side}",
        f"toe.{side}",
    })

remove_indices = defaultdict(set)

replace_buckets = defaultdict(
    lambda: defaultdict(list)
)

add_buckets = defaultdict(
    lambda: defaultdict(list)
)


def queue_remove(
    group_name,
    vertex_index,
):
    remove_indices[group_name].add(
        vertex_index
    )


def queue_replace(
    group_name,
    vertex_index,
    weight,
):
    weight = round(
        clamp(weight),
        3,
    )

    if weight <= 0.0:
        return

    replace_buckets[
        group_name
    ][weight].append(
        vertex_index
    )


def queue_add(
    group_name,
    vertex_index,
    weight,
):
    weight = round(
        clamp(weight),
        3,
    )

    if weight <= 0.0:
        return

    add_buckets[
        group_name
    ][weight].append(
        vertex_index
    )


world_points = [
    body.matrix_world @ vertex.co
    for vertex in body.data.vertices
]

torso_vertices = 0
knee_vertices = 0
boot_vertices = 0

for vertex, point in zip(
    body.data.vertices,
    world_points,
):
    x = point.x
    y = point.y
    z = point.z

    absolute_x = abs(x)

    current_weights = {
        group_name_by_index.get(
            assignment.group
        ): assignment.weight
        for assignment in vertex.groups
        if (
            assignment.weight > 0.000001
            and group_name_by_index.get(
                assignment.group
            )
        )
    }

    # -----------------------------------------------------
    # PEITO, OMBRO E AXILA
    # -----------------------------------------------------
    # Remove influência dos braços do centro do torso.
    # Mantém uma transição gradual perto do deltoide.

    if (
        0.060 <= z <= 0.520
        and absolute_x < 0.360
    ):
        arm_weight = sum(
            current_weights.get(
                group_name,
                0.0,
            )
            for group_name in arm_groups
        )

        if arm_weight > 0.000001:
            torso_vertices += 1

            arm_factor = smoothstep(
                0.270,
                0.360,
                absolute_x,
            )

            kept_arm_weight = (
                arm_weight
                *
                arm_factor
            )

            torso_weight = (
                arm_weight
                -
                kept_arm_weight
            )

            for group_name in arm_groups:
                if (
                    current_weights.get(
                        group_name,
                        0.0,
                    )
                    > 0.0
                ):
                    queue_remove(
                        group_name,
                        vertex.index,
                    )

            side = (
                "L"
                if x >= 0.0
                else "R"
            )

            if kept_arm_weight > 0.0:
                queue_replace(
                    f"upper_arm.{side}",
                    vertex.index,
                    kept_arm_weight * 0.82,
                )

                queue_replace(
                    f"clavicle.{side}",
                    vertex.index,
                    kept_arm_weight * 0.18,
                )

            if torso_weight > 0.0:
                queue_add(
                    "chest",
                    vertex.index,
                    torso_weight * 0.72,
                )

                queue_add(
                    "spine_02",
                    vertex.index,
                    torso_weight * 0.28,
                )

    # -----------------------------------------------------
    # JOELHOS
    # -----------------------------------------------------
    # Faz a dobra progressiva entre coxa e canela.

    if (
        -0.740 <= z <= -0.460
        and 0.080 <= absolute_x <= 0.360
    ):
        knee_vertices += 1

        side = (
            "L"
            if x >= 0.0
            else "R"
        )

        for group_name in lower_body_groups:
            if (
                current_weights.get(
                    group_name,
                    0.0,
                )
                > 0.0
            ):
                queue_remove(
                    group_name,
                    vertex.index,
                )

        thigh_weight = smoothstep(
            -0.640,
            -0.520,
            z,
        )

        shin_weight = (
            1.0 -
            thigh_weight
        )

        queue_replace(
            f"thigh.{side}",
            vertex.index,
            thigh_weight,
        )

        queue_replace(
            f"shin.{side}",
            vertex.index,
            shin_weight,
        )

    # -----------------------------------------------------
    # TORNOZELO E BOTA
    # -----------------------------------------------------
    # Parte superior mistura canela e pé.
    # Parte inferior fica quase rígida.

    if (
        z <= -0.820
        and absolute_x >= 0.100
    ):
        boot_vertices += 1

        side = (
            "L"
            if x >= 0.0
            else "R"
        )

        for group_name in lower_body_groups:
            if (
                current_weights.get(
                    group_name,
                    0.0,
                )
                > 0.0
            ):
                queue_remove(
                    group_name,
                    vertex.index,
                )

        if z > -0.900:
            ankle_factor = smoothstep(
                -0.900,
                -0.820,
                z,
            )

            shin_weight = (
                0.10
                +
                0.70
                *
                ankle_factor
            )

            foot_weight = (
                1.0 -
                shin_weight
            )

            queue_replace(
                f"shin.{side}",
                vertex.index,
                shin_weight,
            )

            queue_replace(
                f"foot.{side}",
                vertex.index,
                foot_weight,
            )

        else:
            front_factor = clamp(
                (
                    -y -
                    0.160
                )
                /
                0.140
            )

            toe_weight = (
                0.70
                *
                front_factor
            )

            foot_weight = (
                1.0 -
                toe_weight
            )

            queue_replace(
                f"foot.{side}",
                vertex.index,
                foot_weight,
            )

            queue_replace(
                f"toe.{side}",
                vertex.index,
                toe_weight,
            )

# ---------------------------------------------------------
# APLICA ALTERAÇÕES EM LOTES
# ---------------------------------------------------------

for group_name, indices in remove_indices.items():
    group = body.vertex_groups.get(
        group_name
    )

    if group and indices:
        group.remove(
            list(indices)
        )

for group_name, buckets in replace_buckets.items():
    group = get_group(
        body,
        group_name,
    )

    for weight, indices in buckets.items():
        if indices:
            group.add(
                indices,
                weight,
                "REPLACE",
            )

for group_name, buckets in add_buckets.items():
    group = get_group(
        body,
        group_name,
    )

    for weight, indices in buckets.items():
        if indices:
            group.add(
                indices,
                weight,
                "ADD",
            )

# ---------------------------------------------------------
# LIMITA E NORMALIZA
# ---------------------------------------------------------

bpy.ops.object.select_all(
    action="DESELECT"
)

body.select_set(True)
bpy.context.view_layer.objects.active = body

bpy.ops.object.vertex_group_limit_total(
    group_select_mode="ALL",
    limit=4,
)

bpy.ops.object.vertex_group_normalize_all(
    group_select_mode="ALL",
    lock_active=False,
)

group_name_by_index = {
    group.index: group.name
    for group in body.vertex_groups
}

maximum_influences = 0
unweighted_vertices = 0

for vertex in body.data.vertices:
    influences = 0
    total_weight = 0.0

    for assignment in vertex.groups:
        group_name = group_name_by_index.get(
            assignment.group
        )

        if (
            group_name in deform_bone_names
            and assignment.weight > 0.000001
        ):
            influences += 1
            total_weight += assignment.weight

    maximum_influences = max(
        maximum_influences,
        influences,
    )

    if (
        influences == 0
        or total_weight <= 0.000001
    ):
        unweighted_vertices += 1

if unweighted_vertices != 0:
    raise RuntimeError(
        f"Vértices sem peso: {unweighted_vertices}"
    )

if maximum_influences > 4:
    raise RuntimeError(
        "Ainda existem vértices com mais de "
        f"quatro influências: {maximum_influences}"
    )

body["r2_weight_status"] = (
    "regional_weights_refined"
)

body["r2_maximum_influences"] = (
    maximum_influences
)

rig["r2_rig_version"] = (
    "v13-weights-refined"
)

rig["r2_rig_status"] = (
    "regional_weights_refined"
)

rig["r2_weights_applied"] = True

reset_pose(rig)
rig.data.pose_position = "POSE"

bpy.ops.object.select_all(
    action="DESELECT"
)

rig.select_set(True)
bpy.context.view_layer.objects.active = rig

os.makedirs(
    os.path.dirname(rest_path),
    exist_ok=True,
)

bpy.ops.wm.save_as_mainfile(
    filepath=rest_path,
)

# ---------------------------------------------------------
# CRIA POSE DE TESTE
# ---------------------------------------------------------

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

rotate_around_head(
    rig,
    "upper_arm.L",
    -16.0,
    (
        0.0,
        1.0,
        0.0,
    ),
)

rotate_around_head(
    rig,
    "forearm.L",
    30.0,
    (
        0.0,
        1.0,
        0.0,
    ),
)

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

rotate_around_head(
    rig,
    "thigh.R",
    8.0,
    (
        1.0,
        0.0,
        0.0,
    ),
)

rotate_around_head(
    rig,
    "shin.R",
    -20.0,
    (
        1.0,
        0.0,
        0.0,
    ),
)

rig["r2_rig_version"] = (
    "v14-refined-pose-test"
)

rig["r2_rig_status"] = (
    "refined_deformation_test"
)

bpy.ops.object.mode_set(
    mode="POSE"
)

bpy.ops.wm.save_as_mainfile(
    filepath=pose_path,
)

report = [
    "R2_WEIGHT_REFINEMENT_OK",
    f"rest_blend={rest_path}",
    f"pose_blend={pose_path}",
    f"vertices={len(body.data.vertices)}",
    f"bones={len(rig.data.bones)}",
    f"torso_vertices_refined={torso_vertices}",
    f"knee_vertices_refined={knee_vertices}",
    f"boot_vertices_refined={boot_vertices}",
    f"maximum_influences={maximum_influences}",
    f"unweighted_vertices={unweighted_vertices}",
    "shoulder_weights=refined",
    "knee_weights=refined",
    "boot_weights=refined",
    "status=regional_weights_refined",
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