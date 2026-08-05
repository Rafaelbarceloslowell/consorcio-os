import bpy
import heapq
import os
import sys

from mathutils import Vector


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


def point_segment_distance(
    point,
    head,
    tail,
):
    segment = tail - head
    length_squared = segment.length_squared

    if length_squared <= 0.00000001:
        return (point - head).length

    factor = (
        (point - head).dot(segment)
        /
        length_squared
    )

    factor = max(
        0.0,
        min(1.0, factor),
    )

    closest = (
        head +
        segment * factor
    )

    return (
        point -
        closest
    ).length


def is_finger_bone(name):
    prefixes = (
        "thumb_",
        "index_",
        "middle_",
        "ring_",
        "pinky_",
    )

    return name.startswith(prefixes)


def repair_radius(name):
    if is_finger_bone(name):
        return 0.040

    if name.startswith("hand."):
        return 0.075

    if name == "pelvis":
        return 0.220

    if name.startswith("toe."):
        return 0.085

    if name.startswith("foot."):
        return 0.105

    return 0.090


def side_matches(
    name,
    point,
):
    if name.endswith(".L"):
        return point.x >= 0.0

    if name.endswith(".R"):
        return point.x <= 0.0

    return True


def weighted_group_indices(body):
    result = set()

    for vertex in body.data.vertices:
        for assignment in vertex.groups:
            if assignment.weight > 0.000001:
                result.add(
                    assignment.group
                )

    return result


output_path, report_path = get_arguments()

output_path = os.path.abspath(output_path)
report_path = os.path.abspath(report_path)

body = bpy.data.objects.get("R2_Body")
rig = bpy.data.objects.get("R2_Rig")

if body is None or body.type != "MESH":
    raise RuntimeError(
        "Malha R2_Body não encontrada."
    )

if rig is None or rig.type != "ARMATURE":
    raise RuntimeError(
        "Armature R2_Rig não encontrada."
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
    bpy.ops.object.mode_set(
        mode="OBJECT",
    )

rig.data.pose_position = "REST"

body.animation_data_clear()
rig.animation_data_clear()

body.parent = None
body.matrix_parent_inverse.identity()

for modifier in list(body.modifiers):
    if modifier.type == "ARMATURE":
        body.modifiers.remove(
            modifier
        )

body.vertex_groups.clear()

bpy.ops.object.select_all(
    action="DESELECT",
)

body.select_set(True)
rig.select_set(True)

bpy.context.view_layer.objects.active = rig

result = bpy.ops.object.parent_set(
    type="ARMATURE_AUTO",
)

if "FINISHED" not in result:
    raise RuntimeError(
        f"Pesos automáticos falharam: {result}"
    )

armature_modifiers = [
    modifier
    for modifier in body.modifiers
    if modifier.type == "ARMATURE"
]

if len(armature_modifiers) != 1:
    raise RuntimeError(
        "O modificador Armature não foi criado."
    )

armature_modifier = armature_modifiers[0]
armature_modifier.name = "R2_Armature"
armature_modifier.object = rig
armature_modifier.use_deform_preserve_volume = True

deform_bones = {
    bone.name: bone
    for bone in rig.data.bones
    if bone.use_deform
}

weighted_indices = weighted_group_indices(
    body
)

empty_before = []

for name in deform_bones:
    group = body.vertex_groups.get(name)

    if (
        group is None
        or group.index not in weighted_indices
    ):
        empty_before.append(name)

world_points = [
    body.matrix_world @
    vertex.co
    for vertex in body.data.vertices
]

repaired = []

for name in empty_before:
    bone = deform_bones[name]

    group = body.vertex_groups.get(name)

    if group is None:
        group = body.vertex_groups.new(
            name=name
        )

    head = (
        rig.matrix_world @
        bone.head_local
    )

    tail = (
        rig.matrix_world @
        bone.tail_local
    )

    radius = repair_radius(name)

    buckets = {}

    for vertex_index, point in enumerate(
        world_points
    ):
        if not side_matches(
            name,
            point,
        ):
            continue

        distance = point_segment_distance(
            point,
            head,
            tail,
        )

        if distance > radius:
            continue

        raw_weight = (
            1.0 -
            distance / radius
        ) ** 2

        weight = max(
            0.05,
            min(
                1.0,
                round(
                    raw_weight * 20
                ) / 20,
            ),
        )

        buckets.setdefault(
            weight,
            [],
        ).append(
            vertex_index
        )

    if not buckets:
        nearest = heapq.nsmallest(
            48,
            (
                (
                    point_segment_distance(
                        point,
                        head,
                        tail,
                    ),
                    vertex_index,
                )
                for vertex_index, point
                in enumerate(world_points)
                if side_matches(
                    name,
                    point,
                )
            ),
        )

        for rank, (
            distance,
            vertex_index,
        ) in enumerate(nearest):
            weight = max(
                0.10,
                1.0 -
                rank / max(
                    1,
                    len(nearest),
                ),
            )

            weight = round(
                weight * 20
            ) / 20

            buckets.setdefault(
                weight,
                [],
            ).append(
                vertex_index
            )

    repaired_vertex_count = 0

    for weight, indices in buckets.items():
        group.add(
            indices,
            weight,
            "REPLACE",
        )

        repaired_vertex_count += len(
            indices
        )

    repaired.append(
        (
            name,
            repaired_vertex_count,
        )
    )

weighted_indices_after = weighted_group_indices(
    body
)

empty_after = []

for name in deform_bones:
    group = body.vertex_groups.get(name)

    if (
        group is None
        or group.index not in weighted_indices_after
    ):
        empty_after.append(name)

if empty_after:
    raise RuntimeError(
        "Ainda existem grupos vazios: "
        +
        ", ".join(empty_after)
    )

group_name_by_index = {
    group.index: group.name
    for group in body.vertex_groups
}

unweighted_vertex_indices = []
maximum_influences = 0

for vertex in body.data.vertices:
    influences = 0

    for assignment in vertex.groups:
        group_name = group_name_by_index.get(
            assignment.group
        )

        if (
            group_name in deform_bones
            and assignment.weight > 0.000001
        ):
            influences += 1

    maximum_influences = max(
        maximum_influences,
        influences,
    )

    if influences == 0:
        unweighted_vertex_indices.append(
            vertex.index
        )

fallback_vertices = len(
    unweighted_vertex_indices
)

if unweighted_vertex_indices:
    bone_segments = []

    for name, current_bone in deform_bones.items():
        world_head = (
            rig.matrix_world @
            current_bone.head_local
        )

        world_tail = (
            rig.matrix_world @
            current_bone.tail_local
        )

        bone_segments.append(
            (
                name,
                world_head,
                world_tail,
            )
        )

    for vertex_index in unweighted_vertex_indices:
        point = world_points[
            vertex_index
        ]

        candidates = [
            segment
            for segment in bone_segments
            if side_matches(
                segment[0],
                point,
            )
        ]

        if not candidates:
            candidates = bone_segments

        distance, nearest_name = min(
            (
                point_segment_distance(
                    point,
                    head,
                    tail,
                ),
                name,
            )
            for name, head, tail
            in candidates
        )

        nearest_group = (
            body.vertex_groups.get(
                nearest_name
            )
        )

        if nearest_group is None:
            nearest_group = (
                body.vertex_groups.new(
                    name=nearest_name
                )
            )

        nearest_group.add(
            [vertex_index],
            1.0,
            "REPLACE",
        )

group_name_by_index = {
    group.index: group.name
    for group in body.vertex_groups
}

remaining_unweighted = []
maximum_influences = 0

for vertex in body.data.vertices:
    influences = 0

    for assignment in vertex.groups:
        group_name = group_name_by_index.get(
            assignment.group
        )

        if (
            group_name in deform_bones
            and assignment.weight > 0.000001
        ):
            influences += 1

    maximum_influences = max(
        maximum_influences,
        influences,
    )

    if influences == 0:
        remaining_unweighted.append(
            vertex.index
        )

unweighted_vertices = len(
    remaining_unweighted
)

if unweighted_vertices > 0:
    raise RuntimeError(
        "Ainda existem vértices sem peso: "
        f"{unweighted_vertices}"
    )

body["r2_weight_status"] = (
    "automatic_weights_repaired"
)

body["r2_empty_groups_before"] = len(
    empty_before
)

body["r2_empty_groups_after"] = len(
    empty_after
)

rig["r2_rig_version"] = (
    "v11-weighted-repaired"
)

rig["r2_rig_status"] = (
    "weights_repaired"
)

rig["r2_weights_applied"] = True

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
    "R2_REPAIRED_WEIGHTS_OK",
    f"blend={output_path}",
    f"vertices={len(body.data.vertices)}",
    f"bones={len(rig.data.bones)}",
    f"deform_bones={len(deform_bones)}",
    f"vertex_groups={len(body.vertex_groups)}",
    f"empty_groups_before={len(empty_before)}",
    f"empty_groups_after={len(empty_after)}",
    f"fallback_vertices={fallback_vertices}",
    f"unweighted_vertices={unweighted_vertices}",
    f"maximum_influences={maximum_influences}",
    f"parent={body.parent.name if body.parent else 'NONE'}",
    f"armature_modifier={armature_modifier.name}",
    "status=weights_repaired",
    "",
    "REPAIRED_GROUPS",
]

for name, count in repaired:
    report.append(
        f"{name}={count}"
    )

with open(
    report_path,
    "w",
    encoding="utf-8",
) as report_file:
    report_file.write(
        "\n".join(report)
    )

print("\n".join(report))