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

if bpy.context.object and bpy.context.object.mode != "OBJECT":
    bpy.ops.object.mode_set(mode="OBJECT")

rig.data.pose_position = "REST"

body.animation_data_clear()
rig.animation_data_clear()

body.parent = None
body.matrix_parent_inverse.identity()

for modifier in list(body.modifiers):
    if modifier.type == "ARMATURE":
        body.modifiers.remove(modifier)

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
        "O modificador Armature não foi criado corretamente."
    )

armature_modifier = armature_modifiers[0]
armature_modifier.name = "R2_Armature"
armature_modifier.object = rig
armature_modifier.use_deform_preserve_volume = True

deform_bone_names = {
    bone.name
    for bone in rig.data.bones
    if bone.use_deform
}

group_name_by_index = {
    group.index: group.name
    for group in body.vertex_groups
}

weighted_group_names = set()
maximum_influences = 0

for vertex in body.data.vertices:
    influences = 0

    for assignment in vertex.groups:
        if assignment.weight <= 0.000001:
            continue

        group_name = group_name_by_index.get(
            assignment.group
        )

        if group_name:
            weighted_group_names.add(group_name)

        influences += 1

    maximum_influences = max(
        maximum_influences,
        influences,
    )

empty_deform_groups = sorted(
    deform_bone_names -
    weighted_group_names
)

missing_deform_groups = sorted(
    deform_bone_names -
    {
        group.name
        for group in body.vertex_groups
    }
)

body["r2_weight_status"] = "automatic_weights_applied"
body["r2_weight_group_count"] = len(body.vertex_groups)
body["r2_empty_deform_group_count"] = len(empty_deform_groups)

rig["r2_rig_version"] = "v5-weighted"
rig["r2_rig_status"] = "automatic_weights_applied"
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
    "R2_AUTOMATIC_WEIGHTS_OK",
    f"blend={output_path}",
    f"vertices={len(body.data.vertices)}",
    f"bones={len(rig.data.bones)}",
    f"deform_bones={len(deform_bone_names)}",
    f"vertex_groups={len(body.vertex_groups)}",
    f"weighted_groups={len(weighted_group_names)}",
    f"empty_deform_groups={len(empty_deform_groups)}",
    f"missing_deform_groups={len(missing_deform_groups)}",
    f"maximum_influences={maximum_influences}",
    f"parent={body.parent.name if body.parent else 'NONE'}",
    f"armature_modifier={armature_modifier.name}",
    "status=automatic_weights_applied",
]

if empty_deform_groups:
    report.extend([
        "",
        "EMPTY_DEFORM_GROUPS",
        *empty_deform_groups,
    ])

if missing_deform_groups:
    report.extend([
        "",
        "MISSING_DEFORM_GROUPS",
        *missing_deform_groups,
    ])

with open(
    report_path,
    "w",
    encoding="utf-8",
) as report_file:
    report_file.write(
        "\n".join(report)
    )

print("\n".join(report))