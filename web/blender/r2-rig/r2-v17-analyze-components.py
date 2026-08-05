import bpy
import sys
from collections import deque


def get_argument(name):
    if "--" not in sys.argv:
        raise RuntimeError("Argumentos do script não encontrados.")

    arguments = sys.argv[sys.argv.index("--") + 1:]

    if name not in arguments:
        raise RuntimeError(f"Argumento obrigatório ausente: {name}")

    index = arguments.index(name)

    if index + 1 >= len(arguments):
        raise RuntimeError(f"Valor ausente para o argumento: {name}")

    return arguments[index + 1]


output_path = get_argument("--out")

mesh_objects = [
    obj
    for obj in bpy.data.objects
    if obj.type == "MESH"
]

if not mesh_objects:
    raise RuntimeError("Nenhum objeto de malha foi encontrado.")

exact_candidates = [
    obj
    for obj in mesh_objects
    if len(obj.data.vertices) == 43272
    and len(obj.data.polygons) == 43270
]

if exact_candidates:
    cage = exact_candidates[0]
else:
    cage = max(
        mesh_objects,
        key=lambda obj: len(obj.data.polygons),
    )

mesh = cage.data
vertex_count = len(mesh.vertices)

adjacency = [
    []
    for _ in range(vertex_count)
]

for edge in mesh.edges:
    first_vertex, second_vertex = edge.vertices

    adjacency[first_vertex].append(second_vertex)
    adjacency[second_vertex].append(first_vertex)

visited = bytearray(vertex_count)
component_by_vertex = [-1] * vertex_count
components = []

for starting_vertex in range(vertex_count):
    if visited[starting_vertex]:
        continue

    component_index = len(components)
    queue = deque([starting_vertex])
    visited[starting_vertex] = 1
    component_vertices = []

    while queue:
        vertex_index = queue.popleft()
        component_by_vertex[vertex_index] = component_index
        component_vertices.append(vertex_index)

        for neighbor in adjacency[vertex_index]:
            if not visited[neighbor]:
                visited[neighbor] = 1
                queue.append(neighbor)

    components.append(component_vertices)

component_edge_counts = [0] * len(components)

for edge in mesh.edges:
    component_index = component_by_vertex[edge.vertices[0]]

    if component_index >= 0:
        component_edge_counts[component_index] += 1

component_details = []

for component_index, vertex_indices in enumerate(components):
    world_coordinates = [
        cage.matrix_world @ mesh.vertices[vertex_index].co
        for vertex_index in vertex_indices
    ]

    minimum_x = min(coordinate.x for coordinate in world_coordinates)
    minimum_y = min(coordinate.y for coordinate in world_coordinates)
    minimum_z = min(coordinate.z for coordinate in world_coordinates)

    maximum_x = max(coordinate.x for coordinate in world_coordinates)
    maximum_y = max(coordinate.y for coordinate in world_coordinates)
    maximum_z = max(coordinate.z for coordinate in world_coordinates)

    dimensions = (
        maximum_x - minimum_x,
        maximum_y - minimum_y,
        maximum_z - minimum_z,
    )

    component_details.append({
        "original_index": component_index,
        "vertices": len(vertex_indices),
        "edges": component_edge_counts[component_index],
        "percentage": (
            len(vertex_indices) / vertex_count * 100.0
            if vertex_count
            else 0.0
        ),
        "dimensions": dimensions,
        "minimum": (
            minimum_x,
            minimum_y,
            minimum_z,
        ),
        "maximum": (
            maximum_x,
            maximum_y,
            maximum_z,
        ),
    })

component_details.sort(
    key=lambda component: component["vertices"],
    reverse=True,
)

lines = [
    "R2_CAGE_COMPONENT_ANALYSIS",
    f"blend={bpy.data.filepath}",
    f"selected_object={cage.name}",
    f"mesh_objects={len(mesh_objects)}",
    f"vertices={len(mesh.vertices)}",
    f"edges={len(mesh.edges)}",
    f"polygons={len(mesh.polygons)}",
    f"components={len(component_details)}",
]

for position, component in enumerate(component_details, start=1):
    dimensions = component["dimensions"]
    minimum = component["minimum"]
    maximum = component["maximum"]

    lines.extend([
        "",
        f"component_{position}_vertices={component['vertices']}",
        f"component_{position}_edges={component['edges']}",
        f"component_{position}_percentage={component['percentage']:.6f}",
        (
            f"component_{position}_dimensions="
            f"{dimensions[0]:.6f},"
            f"{dimensions[1]:.6f},"
            f"{dimensions[2]:.6f}"
        ),
        (
            f"component_{position}_minimum="
            f"{minimum[0]:.6f},"
            f"{minimum[1]:.6f},"
            f"{minimum[2]:.6f}"
        ),
        (
            f"component_{position}_maximum="
            f"{maximum[0]:.6f},"
            f"{maximum[1]:.6f},"
            f"{maximum[2]:.6f}"
        ),
    ])

largest_percentage = (
    component_details[0]["percentage"]
    if component_details
    else 0.0
)

if len(component_details) == 1:
    status = "single_connected_component"
elif largest_percentage >= 99.5:
    status = "main_component_with_small_fragments"
else:
    status = "multiple_significant_components"

lines.extend([
    "",
    f"largest_component_percentage={largest_percentage:.6f}",
    f"status={status}",
])

with open(output_path, "w", encoding="utf-8") as report_file:
    report_file.write("\n".join(lines) + "\n")

print("\n".join(lines))