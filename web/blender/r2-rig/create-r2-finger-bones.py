import bpy
import os
import sys


def get_arguments():
    if "--" not in sys.argv:
        raise RuntimeError(
            "Argumentos do script não encontrados."
        )

    arguments = sys.argv[
        sys.argv.index("--") + 1:
    ]

    if len(arguments) != 2:
        raise RuntimeError(
            "Esperados: arquivo BLEND de saída e relatório."
        )

    return arguments


def create_chain(
    edit_bones,
    names,
    points,
    parent_name,
):
    if len(points) != len(names) + 1:
        raise RuntimeError(
            f"Quantidade inválida de pontos para {names[0]}"
        )

    parent = edit_bones[parent_name]
    created = []

    for index, name in enumerate(names):
        bone = edit_bones.new(name)

        bone.head = points[index]
        bone.tail = points[index + 1]
        bone.roll = 0.0
        bone.use_deform = True
        bone.parent = parent

        if index > 0:
            bone.use_connect = True

        created.append(bone)
        parent = bone

    return created


output_path, report_path = get_arguments()

output_path = os.path.abspath(output_path)
report_path = os.path.abspath(report_path)

rig = bpy.data.objects.get("R2_Rig")

if rig is None:
    raise RuntimeError(
        "Objeto R2_Rig não encontrado."
    )

if rig.type != "ARMATURE":
    raise RuntimeError(
        "R2_Rig não é uma armature."
    )

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

edit_bones = rig.data.edit_bones

finger_prefixes = (
    "thumb_",
    "index_",
    "middle_",
    "ring_",
    "pinky_",
)

for bone in list(edit_bones):
    if bone.name.startswith(finger_prefixes):
        edit_bones.remove(bone)

created_names = []

for side_name, side in (
    ("L", 1.0),
    ("R", -1.0),
):
    hand_name = f"hand.{side_name}"

    if hand_name not in edit_bones:
        raise RuntimeError(
            f"Osso não encontrado: {hand_name}"
        )

    thumb_names = [
        f"thumb_01.{side_name}",
        f"thumb_02.{side_name}",
    ]

    thumb_points = [
        (
            side * 0.462,
            -0.082,
            -0.245,
        ),
        (
            side * 0.485,
            -0.116,
            -0.282,
        ),
        (
            side * 0.508,
            -0.128,
            -0.318,
        ),
    ]

    created = create_chain(
        edit_bones,
        thumb_names,
        thumb_points,
        hand_name,
    )

    created_names.extend(
        bone.name
        for bone in created
    )

    finger_settings = [
        (
            "index",
            -0.070,
            -0.238,
            -0.365,
        ),
        (
            "middle",
            -0.022,
            -0.235,
            -0.372,
        ),
        (
            "ring",
            0.026,
            -0.240,
            -0.365,
        ),
        (
            "pinky",
            0.072,
            -0.250,
            -0.350,
        ),
    ]

    for (
        finger_name,
        depth,
        start_z,
        end_z,
    ) in finger_settings:
        names = [
            f"{finger_name}_01.{side_name}",
            f"{finger_name}_02.{side_name}",
            f"{finger_name}_03.{side_name}",
        ]

        total_length = (
            end_z -
            start_z
        )

        points = [
            (
                side * 0.482,
                depth,
                start_z,
            ),
            (
                side * 0.494,
                depth - 0.004,
                start_z +
                total_length * 0.34,
            ),
            (
                side * 0.500,
                depth - 0.008,
                start_z +
                total_length * 0.68,
            ),
            (
                side * 0.497,
                depth - 0.012,
                end_z,
            ),
        ]

        created = create_chain(
            edit_bones,
            names,
            points,
            hand_name,
        )

        created_names.extend(
            bone.name
            for bone in created
        )

bpy.ops.object.mode_set(
    mode="OBJECT",
)

rig.show_in_front = True
rig.data.display_type = "OCTAHEDRAL"

rig["r2_rig_version"] = "v3-fingers"
rig["r2_rig_status"] = "finger_bones_created"
rig["r2_finger_bone_count"] = len(created_names)
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
    "R2_FINGER_BONES_OK",
    f"blend={output_path}",
    f"new_finger_bones={len(created_names)}",
    f"total_bones={len(rig.data.bones)}",
    "status=finger_bones_created",
    "",
    *created_names,
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