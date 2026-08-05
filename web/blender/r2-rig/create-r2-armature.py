import bpy
import os
import sys


def get_arguments():
    if "--" not in sys.argv:
        raise RuntimeError("Argumentos não encontrados.")

    args = sys.argv[sys.argv.index("--") + 1:]

    if len(args) != 2:
        raise RuntimeError(
            "Esperados: arquivo de saída e relatório."
        )

    return args


output_path, report_path = get_arguments()

output_path = os.path.abspath(output_path)
report_path = os.path.abspath(report_path)

# Remove um rig anterior, caso o script seja executado novamente.
for obj in list(bpy.data.objects):
    if obj.type == "ARMATURE" and obj.name.startswith("R2_Rig"):
        bpy.data.objects.remove(
            obj,
            do_unlink=True,
        )

bpy.ops.object.select_all(
    action="DESELECT"
)

bpy.ops.object.armature_add(
    enter_editmode=True,
    location=(0.0, 0.0, 0.0),
)

rig = bpy.context.active_object
rig.name = "R2_Rig"
rig.data.name = "R2_Rig_Data"
rig.show_in_front = True
rig.data.display_type = "BBONE"

# Remove o osso padrão criado pelo Blender.
for bone in list(rig.data.edit_bones):
    rig.data.edit_bones.remove(bone)

bone_definitions = [
    # Nome, cabeça, cauda, pai, conectado, deformador
    (
        "root",
        (0.00, 0.00, -1.00),
        (0.00, 0.00, -0.86),
        None,
        False,
        False,
    ),
    (
        "pelvis",
        (0.00, 0.00, -0.62),
        (0.00, 0.00, -0.40),
        "root",
        False,
        True,
    ),
    (
        "spine_01",
        (0.00, 0.00, -0.40),
        (0.00, 0.00, -0.12),
        "pelvis",
        True,
        True,
    ),
    (
        "spine_02",
        (0.00, 0.00, -0.12),
        (0.00, 0.00, 0.18),
        "spine_01",
        True,
        True,
    ),
    (
        "chest",
        (0.00, 0.00, 0.18),
        (0.00, 0.00, 0.42),
        "spine_02",
        True,
        True,
    ),
    (
        "neck",
        (0.00, 0.00, 0.42),
        (0.00, 0.00, 0.62),
        "chest",
        True,
        True,
    ),
    (
        "head",
        (0.00, 0.00, 0.62),
        (0.00, 0.00, 0.91),
        "neck",
        True,
        True,
    ),

    # Braço esquerdo: lado +X.
    (
        "clavicle.L",
        (0.00, 0.00, 0.37),
        (0.19, 0.00, 0.39),
        "chest",
        False,
        True,
    ),
    (
        "upper_arm.L",
        (0.19, 0.00, 0.39),
        (0.38, 0.00, 0.10),
        "clavicle.L",
        True,
        True,
    ),
    (
        "forearm.L",
        (0.38, 0.00, 0.10),
        (0.47, 0.00, -0.18),
        "upper_arm.L",
        True,
        True,
    ),
    (
        "hand.L",
        (0.47, 0.00, -0.18),
        (0.50, -0.02, -0.34),
        "forearm.L",
        True,
        True,
    ),

    # Braço direito: lado -X.
    (
        "clavicle.R",
        (0.00, 0.00, 0.37),
        (-0.19, 0.00, 0.39),
        "chest",
        False,
        True,
    ),
    (
        "upper_arm.R",
        (-0.19, 0.00, 0.39),
        (-0.38, 0.00, 0.10),
        "clavicle.R",
        True,
        True,
    ),
    (
        "forearm.R",
        (-0.38, 0.00, 0.10),
        (-0.47, 0.00, -0.18),
        "upper_arm.R",
        True,
        True,
    ),
    (
        "hand.R",
        (-0.47, 0.00, -0.18),
        (-0.50, -0.02, -0.34),
        "forearm.R",
        True,
        True,
    ),

    # Perna esquerda.
    (
        "thigh.L",
        (0.16, 0.00, -0.48),
        (0.18, 0.00, -0.72),
        "pelvis",
        False,
        True,
    ),
    (
        "shin.L",
        (0.18, 0.00, -0.72),
        (0.18, 0.00, -0.93),
        "thigh.L",
        True,
        True,
    ),
    (
        "foot.L",
        (0.18, 0.00, -0.93),
        (0.18, -0.15, -0.98),
        "shin.L",
        True,
        True,
    ),
    (
        "toe.L",
        (0.18, -0.15, -0.98),
        (0.18, -0.27, -0.98),
        "foot.L",
        True,
        True,
    ),

    # Perna direita.
    (
        "thigh.R",
        (-0.16, 0.00, -0.48),
        (-0.18, 0.00, -0.72),
        "pelvis",
        False,
        True,
    ),
    (
        "shin.R",
        (-0.18, 0.00, -0.72),
        (-0.18, 0.00, -0.93),
        "thigh.R",
        True,
        True,
    ),
    (
        "foot.R",
        (-0.18, 0.00, -0.93),
        (-0.18, -0.15, -0.98),
        "shin.R",
        True,
        True,
    ),
    (
        "toe.R",
        (-0.18, -0.15, -0.98),
        (-0.18, -0.27, -0.98),
        "foot.R",
        True,
        True,
    ),
]

created_bones = {}

for (
    name,
    head,
    tail,
    parent_name,
    connected,
    deform,
) in bone_definitions:
    bone = rig.data.edit_bones.new(name)

    bone.head = head
    bone.tail = tail
    bone.roll = 0.0
    bone.use_deform = deform

    if parent_name:
        bone.parent = created_bones[parent_name]
        bone.use_connect = connected

    created_bones[name] = bone

bpy.ops.object.mode_set(
    mode="OBJECT"
)

rig["r2_rig_version"] = "v2-armature"
rig["r2_rig_status"] = "skeleton_created"
rig["r2_bone_count"] = len(created_bones)

# Mantém o rig selecionado ao abrir o arquivo.
bpy.ops.object.select_all(
    action="DESELECT"
)

rig.select_set(True)
bpy.context.view_layer.objects.active = rig

os.makedirs(
    os.path.dirname(output_path),
    exist_ok=True,
)

bpy.ops.wm.save_as_mainfile(
    filepath=output_path
)

report = [
    "R2_ARMATURE_OK",
    f"blend={output_path}",
    f"bones={len(created_bones)}",
    "status=skeleton_created",
    "",
    *created_bones.keys(),
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