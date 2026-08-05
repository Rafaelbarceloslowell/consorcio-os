import bpy
import os
import sys

from collections import defaultdict
from mathutils import Vector


def arguments():
    if "--" not in sys.argv:
        raise RuntimeError("Argumentos não encontrados.")

    values = sys.argv[sys.argv.index("--") + 1:]

    if len(values) != 2:
        raise RuntimeError(
            "Esperados: arquivo de saída e relatório."
        )

    return values


def connected_component_count(mesh):
    parent = list(range(len(mesh.vertices)))

    def find(index):
        while parent[index] != index:
            parent[index] = parent[parent[index]]
            index = parent[index]

        return index

    def union(first, second):
        first_root = find(first)
        second_root = find(second)

        if first_root != second_root:
            parent[second_root] = first_root

    for edge in mesh.edges:
        union(
            edge.vertices[0],
            edge.vertices[1],
        )

    return len({
        find(vertex.index)
        for vertex in mesh.vertices
    })


output_path, report_path = arguments()

output_path = os.path.abspath(output_path)
report_path = os.path.abspath(report_path)

body = bpy.data.objects.get("R2_Body")
rig = bpy.data.objects.get("R2_Rig")

if body is None or body.type != "MESH":
    raise RuntimeError("R2_Body não encontrado.")

if rig is None or rig.type != "ARMATURE":
    raise RuntimeError("R2_Rig não encontrado.")

if (
    bpy.context.object
    and bpy.context.object.mode != "OBJECT"
):
    bpy.ops.object.mode_set(mode="OBJECT")

bpy.ops.object.select_all(action="DESELECT")

cage = body.copy()
cage.data = body.data.copy()
cage.name = "R2_Deformation_Cage"

bpy.context.collection.objects.link(cage)

cage.parent = None

for modifier in list(cage.modifiers):
    cage.modifiers.remove(modifier)

cage.vertex_groups.clear()
cage.hide_viewport = False
cage.hide_render = True

cage.select_set(True)
bpy.context.view_layer.objects.active = cage

# Converte as ilhas sobrepostas em uma superfície contínua.
cage.data.remesh_voxel_size = 0.0125
cage.data.remesh_voxel_adaptivity = 0.0

bpy.ops.object.voxel_remesh()

if len(cage.data.vertices) < 1000:
    raise RuntimeError(
        "A gaiola perdeu geometria demais durante o remesh."
    )

# Suavização leve; não altera o R2 original.
smooth = cage.modifiers.new(
    name="R2_Cage_Smooth",
    type="SMOOTH",
)

smooth.factor = 0.28
smooth.iterations = 3

bpy.ops.object.modifier_apply(
    modifier=smooth.name
)

bpy.ops.object.shade_smooth()

cage.display_type = "WIRE"
cage.show_in_front = True
cage.color = (
    1.0,
    0.20,
    0.04,
    1.0,
)

body.hide_viewport = False
body.hide_render = False
body.display_type = "SOLID"

rig.hide_viewport = True
rig.hide_render = True

world_points = [
    cage.matrix_world @ vertex.co
    for vertex in cage.data.vertices
]

minimum = Vector((
    min(point.x for point in world_points),
    min(point.y for point in world_points),
    min(point.z for point in world_points),
))

maximum = Vector((
    max(point.x for point in world_points),
    max(point.y for point in world_points),
    max(point.z for point in world_points),
))

dimensions = maximum - minimum

components = connected_component_count(
    cage.data
)

cage["r2_cage_version"] = "v17"
cage["r2_voxel_size"] = 0.0125
cage["r2_component_count"] = components

bpy.ops.object.select_all(action="DESELECT")
cage.select_set(True)
bpy.context.view_layer.objects.active = cage

os.makedirs(
    os.path.dirname(output_path),
    exist_ok=True,
)

bpy.ops.wm.save_as_mainfile(
    filepath=output_path
)

report = [
    "R2_DEFORMATION_CAGE_OK",
    f"blend={output_path}",
    f"source_vertices={len(body.data.vertices)}",
    f"cage_vertices={len(cage.data.vertices)}",
    f"cage_polygons={len(cage.data.polygons)}",
    f"cage_components={components}",
    "voxel_size=0.0125",
    (
        "dimensions="
        f"{dimensions.x:.6f},"
        f"{dimensions.y:.6f},"
        f"{dimensions.z:.6f}"
    ),
    "original_body_unchanged=true",
    "status=deformation_cage_created",
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