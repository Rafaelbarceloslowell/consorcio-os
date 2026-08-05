import bpy
import os
import sys

from mathutils import Vector


def get_arguments():
    if "--" not in sys.argv:
        raise RuntimeError("Argumentos do script não foram encontrados.")

    arguments = sys.argv[sys.argv.index("--") + 1:]

    if len(arguments) != 3:
        raise RuntimeError(
            "Esperados: arquivo GLB, arquivo BLEND e relatório."
        )

    return arguments


source_path, blend_path, report_path = get_arguments()

source_path = os.path.abspath(source_path)
blend_path = os.path.abspath(blend_path)
report_path = os.path.abspath(report_path)

if not os.path.isfile(source_path):
    raise FileNotFoundError(source_path)

bpy.ops.wm.read_factory_settings(use_empty=True)

scene = bpy.context.scene
scene.name = "R2_Rig_Scene"
scene.unit_settings.system = "METRIC"
scene.unit_settings.scale_length = 1.0

bpy.ops.import_scene.gltf(
    filepath=source_path
)

mesh_objects = [
    obj
    for obj in scene.objects
    if obj.type == "MESH"
]

if not mesh_objects:
    raise RuntimeError(
        "Nenhuma malha foi importada do GLB."
    )

for index, obj in enumerate(mesh_objects):
    if index == 0:
        obj.name = "R2_Body"
        obj.data.name = "R2_Body_Mesh"
    else:
        obj.name = f"R2_Body_{index + 1:02d}"
        obj.data.name = f"R2_Body_Mesh_{index + 1:02d}"

bpy.ops.object.select_all(
    action="DESELECT"
)

for obj in mesh_objects:
    obj.select_set(True)

bpy.context.view_layer.objects.active = mesh_objects[0]

world_points = []

for obj in mesh_objects:
    for corner in obj.bound_box:
        world_points.append(
            obj.matrix_world @ Vector(corner)
        )

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

scene["r2_source_glb"] = source_path
scene["r2_rig_version"] = "v1"
scene["r2_rig_status"] = "base_imported"

os.makedirs(
    os.path.dirname(blend_path),
    exist_ok=True,
)

bpy.ops.wm.save_as_mainfile(
    filepath=blend_path
)

vertex_count = sum(
    len(obj.data.vertices)
    for obj in mesh_objects
)

polygon_count = sum(
    len(obj.data.polygons)
    for obj in mesh_objects
)

report = [
    "R2_RIG_BASE_OK",
    f"source={source_path}",
    f"blend={blend_path}",
    f"objects={len(scene.objects)}",
    f"meshes={len(mesh_objects)}",
    f"vertices={vertex_count}",
    f"polygons={polygon_count}",
    (
        "dimensions="
        f"{dimensions.x:.6f},"
        f"{dimensions.y:.6f},"
        f"{dimensions.z:.6f}"
    ),
    (
        "bounds_min="
        f"{minimum.x:.6f},"
        f"{minimum.y:.6f},"
        f"{minimum.z:.6f}"
    ),
    (
        "bounds_max="
        f"{maximum.x:.6f},"
        f"{maximum.y:.6f},"
        f"{maximum.z:.6f}"
    ),
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