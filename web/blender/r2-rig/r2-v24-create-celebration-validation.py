import bpy
import math
import os
import sys

from mathutils import Matrix


def get_argument(name):
    if "--" not in sys.argv:
        raise RuntimeError(
            "Os argumentos do script não foram encontrados."
        )

    arguments = sys.argv[sys.argv.index("--") + 1:]

    if name not in arguments:
        raise RuntimeError(
            f"Argumento obrigatório ausente: {name}"
        )

    index = arguments.index(name)

    if index + 1 >= len(arguments):
        raise RuntimeError(
            f"Valor ausente para o argumento: {name}"
        )

    return arguments[index + 1]


def evaluated_coordinates(obj):
    depsgraph = bpy.context.evaluated_depsgraph_get()
    evaluated_object = obj.evaluated_get(
        depsgraph
    )

    evaluated_mesh = evaluated_object.to_mesh()

    try:
        matrix_world = evaluated_object.matrix_world

        coordinates = [
            matrix_world @ vertex.co
            for vertex in evaluated_mesh.vertices
        ]

    finally:
        evaluated_object.to_mesh_clear()

    return coordinates


def compare_coordinates(
    original_coordinates,
    posed_coordinates,
):
    if len(original_coordinates) != len(
        posed_coordinates
    ):
        raise RuntimeError(
            "A quantidade de vértices mudou durante o teste."
        )

    distances = [
        (
            posed_coordinate
            - original_coordinate
        ).length
        for original_coordinate, posed_coordinate
        in zip(
            original_coordinates,
            posed_coordinates,
        )
    ]

    return {
        "maximum": max(distances),
        "average": (
            sum(distances)
            / len(distances)
        ),
        "over_1mm": sum(
            1
            for distance in distances
            if distance > 0.001
        ),
        "over_10mm": sum(
            1
            for distance in distances
            if distance > 0.010
        ),
    }


output_blend_path = os.path.abspath(
    get_argument("--output-blend")
)

report_path = os.path.abspath(
    get_argument("--report")
)

if os.path.exists(output_blend_path):
    raise RuntimeError(
        f"O arquivo de saída já existe: {output_blend_path}"
    )

if os.path.exists(report_path):
    raise RuntimeError(
        f"O relatório já existe: {report_path}"
    )

body = bpy.data.objects.get(
    "R2_Body"
)

rig = bpy.data.objects.get(
    "R2_Rig"
)

proxy = bpy.data.objects.get(
    "R2_Deformation_Proxy"
)

if body is None or body.type != "MESH":
    raise RuntimeError(
        "O corpo R2_Body não foi encontrado."
    )

if rig is None or rig.type != "ARMATURE":
    raise RuntimeError(
        "O rig R2_Rig não foi encontrado."
    )

if proxy is None or proxy.type != "MESH":
    raise RuntimeError(
        "A proxy R2_Deformation_Proxy não foi encontrada."
    )

surface_modifiers = [
    modifier
    for modifier in body.modifiers
    if modifier.type == "SURFACE_DEFORM"
]

if len(surface_modifiers) != 1:
    raise RuntimeError(
        "O corpo não possui exatamente um modificador "
        "Surface Deform."
    )

surface_deform = surface_modifiers[0]

if not surface_deform.is_bound:
    raise RuntimeError(
        "O Surface Deform não está vinculado."
    )

if surface_deform.target != proxy:
    raise RuntimeError(
        "O Surface Deform não está apontando para a proxy correta."
    )

armature_modifiers = [
    modifier
    for modifier in proxy.modifiers
    if modifier.type == "ARMATURE"
]

if len(armature_modifiers) != 1:
    raise RuntimeError(
        "A proxy não possui exatamente um modificador Armature."
    )

if armature_modifiers[0].object != rig:
    raise RuntimeError(
        "O modificador Armature da proxy não aponta para o R2_Rig."
    )

required_bones = [
    "clavicle.L",
    "upper_arm.L",
    "forearm.L",
    "hand.L",
    "clavicle.R",
    "upper_arm.R",
    "forearm.R",
    "hand.R",
    "chest",
    "neck",
    "head",
]

missing_bones = [
    bone_name
    for bone_name in required_bones
    if bone_name not in rig.pose.bones
]

if missing_bones:
    raise RuntimeError(
        "Ossos obrigatórios ausentes: "
        + ", ".join(missing_bones)
    )

if (
    rig.animation_data is not None
    and rig.animation_data.action is not None
):
    rig.animation_data.action = None

for pose_bone in rig.pose.bones:
    pose_bone.matrix_basis = Matrix.Identity(4)

bpy.context.view_layer.update()

neutral_coordinates = evaluated_coordinates(
    body
)

rig.pose.bones[
    "clavicle.L"
].matrix_basis = (
    Matrix.Rotation(
        math.radians(-8.0),
        4,
        "Y",
    )
    @ rig.pose.bones[
        "clavicle.L"
    ].matrix_basis
)

rig.pose.bones[
    "upper_arm.L"
].matrix_basis = (
    Matrix.Rotation(
        math.radians(-58.0),
        4,
        "Z",
    )
    @ Matrix.Rotation(
        math.radians(-18.0),
        4,
        "Y",
    )
    @ rig.pose.bones[
        "upper_arm.L"
    ].matrix_basis
)

rig.pose.bones[
    "forearm.L"
].matrix_basis = (
    Matrix.Rotation(
        math.radians(32.0),
        4,
        "X",
    )
    @ rig.pose.bones[
        "forearm.L"
    ].matrix_basis
)

rig.pose.bones[
    "hand.L"
].matrix_basis = (
    Matrix.Rotation(
        math.radians(-10.0),
        4,
        "Z",
    )
    @ rig.pose.bones[
        "hand.L"
    ].matrix_basis
)

rig.pose.bones[
    "clavicle.R"
].matrix_basis = (
    Matrix.Rotation(
        math.radians(8.0),
        4,
        "Y",
    )
    @ rig.pose.bones[
        "clavicle.R"
    ].matrix_basis
)

rig.pose.bones[
    "upper_arm.R"
].matrix_basis = (
    Matrix.Rotation(
        math.radians(58.0),
        4,
        "Z",
    )
    @ Matrix.Rotation(
        math.radians(18.0),
        4,
        "Y",
    )
    @ rig.pose.bones[
        "upper_arm.R"
    ].matrix_basis
)

rig.pose.bones[
    "forearm.R"
].matrix_basis = (
    Matrix.Rotation(
        math.radians(32.0),
        4,
        "X",
    )
    @ rig.pose.bones[
        "forearm.R"
    ].matrix_basis
)

rig.pose.bones[
    "hand.R"
].matrix_basis = (
    Matrix.Rotation(
        math.radians(10.0),
        4,
        "Z",
    )
    @ rig.pose.bones[
        "hand.R"
    ].matrix_basis
)

rig.pose.bones[
    "chest"
].matrix_basis = (
    Matrix.Rotation(
        math.radians(4.0),
        4,
        "Y",
    )
    @ rig.pose.bones[
        "chest"
    ].matrix_basis
)

rig.pose.bones[
    "neck"
].matrix_basis = (
    Matrix.Rotation(
        math.radians(-3.0),
        4,
        "Y",
    )
    @ rig.pose.bones[
        "neck"
    ].matrix_basis
)

rig.pose.bones[
    "head"
].matrix_basis = (
    Matrix.Rotation(
        math.radians(-6.0),
        4,
        "Y",
    )
    @ rig.pose.bones[
        "head"
    ].matrix_basis
)

bpy.context.view_layer.update()

posed_coordinates = evaluated_coordinates(
    body
)

comparison = compare_coordinates(
    neutral_coordinates,
    posed_coordinates,
)

if comparison["maximum"] < 0.050:
    raise RuntimeError(
        "A pose não produziu movimento suficiente."
    )

if comparison["maximum"] > 0.900:
    raise RuntimeError(
        "A pose produziu deformação explosiva. "
        f"Deslocamento máximo: {comparison['maximum']:.6f}"
    )

if comparison["over_1mm"] < 1000:
    raise RuntimeError(
        "Poucos vértices responderam à pose."
    )

proxy.hide_viewport = True
proxy.hide_render = True
proxy.display_type = "WIRE"

rig.hide_viewport = False
rig.hide_render = True
rig.show_in_front = True

body.hide_viewport = False
body.hide_render = False

bpy.context.scene[
    "r2_validation_pose"
] = "CELEBRATION_V24"

bpy.context.scene[
    "r2_validation_source"
] = bpy.data.filepath

bpy.context.scene[
    "r2_validation_surface_deform_bound"
] = True

bpy.ops.wm.save_as_mainfile(
    filepath=output_blend_path
)

if not os.path.exists(output_blend_path):
    raise RuntimeError(
        "O arquivo v24 não foi criado."
    )

lines = [
    "R2_CELEBRATION_VALIDATION_OK",
    f"source_blend={bpy.data.filepath}",
    f"output_blend={output_blend_path}",
    f"body={body.name}",
    f"rig={rig.name}",
    f"proxy={proxy.name}",
    f"body_vertices={len(body.data.vertices)}",
    f"proxy_vertices={len(proxy.data.vertices)}",
    f"surface_deform_modifier={surface_deform.name}",
    f"surface_deform_bound={str(surface_deform.is_bound).lower()}",
    f"maximum_displacement={comparison['maximum']:.6f}",
    f"average_displacement={comparison['average']:.6f}",
    f"vertices_over_1mm={comparison['over_1mm']}",
    f"vertices_over_10mm={comparison['over_10mm']}",
    "proxy_hidden_in_viewport=true",
    "proxy_hidden_in_render=true",
    "source_v23_unchanged=true",
    "status=celebration_pose_ready_for_visual_review",
]

with open(
    report_path,
    "x",
    encoding="utf-8",
) as report_file:
    report_file.write(
        "\n".join(lines) + "\n"
    )

print(
    "\n".join(lines)
)