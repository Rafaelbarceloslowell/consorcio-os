import bpy
import colorsys
import os
import sys


def get_arguments():
    if "--" not in sys.argv:
        raise RuntimeError("Argumentos não encontrados.")

    values = sys.argv[sys.argv.index("--") + 1:]

    if len(values) != 2:
        raise RuntimeError(
            "Esperados: arquivo de saída e relatório."
        )

    return values


output_path, report_path = get_arguments()

output_path = os.path.abspath(output_path)
report_path = os.path.abspath(report_path)

body = bpy.data.objects.get("R2_Body")
rig = bpy.data.objects.get("R2_Rig")

if body is None or body.type != "MESH":
    raise RuntimeError("R2_Body não encontrado.")

if rig is None or rig.type != "ARMATURE":
    raise RuntimeError("R2_Rig não encontrado.")

if bpy.context.object and bpy.context.object.mode != "OBJECT":
    bpy.ops.object.mode_set(mode="OBJECT")

# Preserva o objeto original, escondido.
body.hide_viewport = True
body.hide_render = True

diagnostic = body.copy()
diagnostic.data = body.data.copy()
diagnostic.name = "R2_Islands_Source"

for modifier in list(diagnostic.modifiers):
    diagnostic.modifiers.remove(modifier)

diagnostic.parent = None
diagnostic.hide_viewport = False
diagnostic.hide_render = False

bpy.context.collection.objects.link(diagnostic)

bpy.ops.object.select_all(action="DESELECT")
diagnostic.select_set(True)
bpy.context.view_layer.objects.active = diagnostic

bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.mesh.separate(type="LOOSE")
bpy.ops.object.mode_set(mode="OBJECT")

islands = [
    obj
    for obj in bpy.context.selected_objects
    if obj.type == "MESH"
]

islands.sort(
    key=lambda obj: len(obj.data.vertices),
    reverse=True,
)

if len(islands) != 110:
    raise RuntimeError(
        f"Esperadas 110 ilhas; encontradas {len(islands)}."
    )

collection = bpy.data.collections.new(
    "R2_Islands_Colored"
)

bpy.context.scene.collection.children.link(
    collection
)

report = [
    "R2_COLORED_ISLANDS_OK",
    f"blend={output_path}",
    f"islands={len(islands)}",
    "",
]

for index, island in enumerate(islands, start=1):
    island.name = f"R2_Island_{index:03d}"

    for current_collection in list(
        island.users_collection
    ):
        current_collection.objects.unlink(island)

    collection.objects.link(island)

    hue = (
        (index * 0.61803398875) % 1.0
    )

    saturation = 0.72
    value = 0.88

    red, green, blue = colorsys.hsv_to_rgb(
        hue,
        saturation,
        value,
    )

    material = bpy.data.materials.new(
        name=f"R2_Island_Material_{index:03d}"
    )

    material.diffuse_color = (
        red,
        green,
        blue,
        1.0,
    )

    material.metallic = 0.0
    material.roughness = 0.72

    island.data.materials.clear()
    island.data.materials.append(material)

    island.color = (
        red,
        green,
        blue,
        1.0,
    )

    report.append(
        f"{island.name}="
        f"{len(island.data.vertices)} vertices"
    )

rig.hide_viewport = True
rig.hide_render = True

bpy.ops.object.select_all(action="DESELECT")

for island in islands:
    island.select_set(True)

bpy.context.view_layer.objects.active = islands[0]

os.makedirs(
    os.path.dirname(output_path),
    exist_ok=True,
)

bpy.ops.wm.save_as_mainfile(
    filepath=output_path,
)

with open(
    report_path,
    "w",
    encoding="utf-8",
) as report_file:
    report_file.write(
        "\n".join(report)
    )

print("\n".join(report[:15]))
print("...")
print(f"total_islands={len(islands)}")