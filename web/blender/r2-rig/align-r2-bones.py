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


def set_bone(edit_bones, name, head, tail):
    bone = edit_bones.get(name)

    if bone is None:
        raise RuntimeError(
            f"Osso não encontrado: {name}"
        )

    bone.head = head
    bone.tail = tail
    bone.roll = 0.0


def set_chain(edit_bones, names, points):
    if len(points) != len(names) + 1:
        raise RuntimeError(
            f"Quantidade incorreta de pontos: {names}"
        )

    for index, name in enumerate(names):
        set_bone(
            edit_bones,
            name,
            points[index],
            points[index + 1],
        )


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
    bpy.ops.object.mode_set(mode="OBJECT")

bpy.ops.object.select_all(
    action="DESELECT",
)

rig.select_set(True)
bpy.context.view_layer.objects.active = rig

bpy.ops.object.mode_set(
    mode="EDIT",
)

bones = rig.data.edit_bones

# Coluna e cabeça.
set_bone(
    bones,
    "root",
    (0.00, 0.00, -1.00),
    (0.00, 0.00, -0.86),
)

set_chain(
    bones,
    [
        "pelvis",
        "spine_01",
        "spine_02",
        "chest",
        "neck",
        "head",
    ],
    [
        (0.00, 0.00, -0.62),
        (0.00, 0.00, -0.40),
        (0.00, 0.00, -0.12),
        (0.00, 0.00, 0.18),
        (0.00, 0.00, 0.42),
        (0.00, -0.015, 0.61),
        (0.00, -0.030, 0.91),
    ],
)

# Braços e mãos.
for side_name, side in (
    ("L", 1.0),
    ("R", -1.0),
):
    set_bone(
        bones,
        f"clavicle.{side_name}",
        (0.00, 0.00, 0.37),
        (side * 0.22, 0.00, 0.36),
    )

    set_chain(
        bones,
        [
            f"upper_arm.{side_name}",
            f"forearm.{side_name}",
            f"hand.{side_name}",
        ],
        [
            (side * 0.22, 0.00, 0.36),
            (side * 0.36, -0.005, 0.09),
            (side * 0.42, -0.010, -0.15),
            (side * 0.435, -0.020, -0.275),
        ],
    )

    # Polegar.
    set_chain(
        bones,
        [
            f"thumb_01.{side_name}",
            f"thumb_02.{side_name}",
        ],
        [
            (side * 0.405, -0.055, -0.195),
            (side * 0.430, -0.090, -0.235),
            (side * 0.445, -0.110, -0.275),
        ],
    )

    finger_settings = [
        ("index", -0.060, -0.205, -0.300),
        ("middle", -0.020, -0.202, -0.307),
        ("ring", 0.020, -0.207, -0.300),
        ("pinky", 0.055, -0.215, -0.288),
    ]

    for finger_name, depth, start_z, end_z in finger_settings:
        length = end_z - start_z

        set_chain(
            bones,
            [
                f"{finger_name}_01.{side_name}",
                f"{finger_name}_02.{side_name}",
                f"{finger_name}_03.{side_name}",
            ],
            [
                (
                    side * 0.425,
                    depth,
                    start_z,
                ),
                (
                    side * 0.435,
                    depth - 0.003,
                    start_z + length * 0.34,
                ),
                (
                    side * 0.440,
                    depth - 0.006,
                    start_z + length * 0.68,
                ),
                (
                    side * 0.437,
                    depth - 0.009,
                    end_z,
                ),
            ],
        )

# Pernas, tornozelos e pés.
for side_name, side in (
    ("L", 1.0),
    ("R", -1.0),
):
    set_chain(
        bones,
        [
            f"thigh.{side_name}",
            f"shin.{side_name}",
            f"foot.{side_name}",
            f"toe.{side_name}",
        ],
        [
            (side * 0.16, 0.00, -0.45),
            (side * 0.18, 0.00, -0.64),
            (side * 0.18, 0.00, -0.88),
            (side * 0.18, -0.13, -0.945),
            (side * 0.18, -0.25, -0.945),
        ],
    )

bpy.ops.object.mode_set(
    mode="OBJECT",
)

rig.show_in_front = True
rig.data.display_type = "OCTAHEDRAL"

rig["r2_rig_version"] = "v4-aligned"
rig["r2_rig_status"] = "bones_aligned"
rig["r2_total_bone_count"] = len(rig.data.bones)
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
    "R2_BONES_ALIGNED_OK",
    f"blend={output_path}",
    f"bones={len(rig.data.bones)}",
    "body_unchanged=true",
    "weights_applied=false",
    "status=bones_aligned",
    "",
    "adjusted=spine",
    "adjusted=head",
    "adjusted=shoulders",
    "adjusted=elbows",
    "adjusted=wrists",
    "adjusted=fingers",
    "adjusted=knees",
    "adjusted=ankles",
    "adjusted=feet",
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