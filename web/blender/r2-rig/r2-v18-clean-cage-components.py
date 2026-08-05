import bpy
import bmesh
import os
import sys
from collections import deque


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


def find_components_from_mesh(mesh):
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
    components = []

    for starting_vertex in range(vertex_count):
        if visited[starting_vertex]:
            continue

        queue = deque([starting_vertex])
        visited[starting_vertex] = 1
        component_vertices = []

        while queue:
            vertex_index = queue.popleft()
            component_vertices.append(vertex_index)

            for neighbor in adjacency[vertex_index]:
                if not visited[neighbor]:
                    visited[neighbor] = 1
                    queue.append(neighbor)

        components.append(component_vertices)

    components.sort(
        key=len,
        reverse=True,
    )

    return components


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

mesh_objects = [
    obj
    for obj in bpy.data.objects
    if obj.type == "MESH"
]

if not mesh_objects:
    raise RuntimeError(
        "Nenhum objeto de malha foi encontrado."
    )

exact_candidates = [
    obj
    for obj in mesh_objects
    if len(obj.data.vertices) == 43272
    and len(obj.data.polygons) == 43270
]

if exact_candidates:
    cage = exact_candidates[0]
else:
    named_candidates = [
        obj
        for obj in mesh_objects
        if obj.name == "R2_Deformation_Cage"
    ]

    if named_candidates:
        cage = named_candidates[0]
    else:
        raise RuntimeError(
            "A gaiola R2_Deformation_Cage não foi encontrada."
        )

mesh = cage.data

before_vertices = len(mesh.vertices)
before_edges = len(mesh.edges)
before_polygons = len(mesh.polygons)

components_before = find_components_from_mesh(mesh)

if len(components_before) != 3:
    raise RuntimeError(
        "A gaiola não possui os três componentes esperados. "
        f"Encontrados: {len(components_before)}"
    )

largest_component = set(components_before[0])

small_component_sizes = [
    len(component)
    for component in components_before[1:]
]

vertices_to_remove_indices = {
    vertex_index
    for component in components_before[1:]
    for vertex_index in component
}

expected_removed_vertices = sum(small_component_sizes)

if expected_removed_vertices != 46:
    raise RuntimeError(
        "A quantidade de vértices descartáveis não corresponde "
        f"ao relatório anterior. Esperado: 46. "
        f"Encontrado: {expected_removed_vertices}"
    )

bm = bmesh.new()

try:
    bm.from_mesh(mesh)
    bm.verts.ensure_lookup_table()

    vertices_to_remove = [
        bm.verts[vertex_index]
        for vertex_index in sorted(vertices_to_remove_indices)
    ]

    bmesh.ops.delete(
        bm,
        geom=vertices_to_remove,
        context="VERTS",
    )

    if bm.faces:
        bmesh.ops.recalc_face_normals(
            bm,
            faces=list(bm.faces),
        )

    bm.to_mesh(mesh)

finally:
    bm.free()

mesh.update()

after_vertices = len(mesh.vertices)
after_edges = len(mesh.edges)
after_polygons = len(mesh.polygons)

components_after = find_components_from_mesh(mesh)

removed_vertices = before_vertices - after_vertices
removed_edges = before_edges - after_edges
removed_polygons = before_polygons - after_polygons

if removed_vertices != 46:
    raise RuntimeError(
        "A limpeza removeu uma quantidade inesperada de vértices. "
        f"Esperado: 46. Removido: {removed_vertices}"
    )

if len(components_after) != 1:
    raise RuntimeError(
        "A gaiola ainda não possui um único componente. "
        f"Componentes encontrados: {len(components_after)}"
    )

if after_vertices != len(largest_component):
    raise RuntimeError(
        "A quantidade final de vértices não corresponde ao "
        "maior componente original."
    )

bpy.ops.wm.save_as_mainfile(
    filepath=output_blend_path,
)

if not os.path.exists(output_blend_path):
    raise RuntimeError(
        "O arquivo v18 não foi criado."
    )

lines = [
    "R2_SINGLE_COMPONENT_CAGE_OK",
    f"source_blend={bpy.path.abspath('//')}",
    f"output_blend={output_blend_path}",
    f"selected_object={cage.name}",
    f"components_before={len(components_before)}",
    f"component_1_vertices={len(components_before[0])}",
    f"component_2_vertices={len(components_before[1])}",
    f"component_3_vertices={len(components_before[2])}",
    f"vertices_before={before_vertices}",
    f"edges_before={before_edges}",
    f"polygons_before={before_polygons}",
    f"removed_vertices={removed_vertices}",
    f"removed_edges={removed_edges}",
    f"removed_polygons={removed_polygons}",
    f"vertices_after={after_vertices}",
    f"edges_after={after_edges}",
    f"polygons_after={after_polygons}",
    f"components_after={len(components_after)}",
    "original_v17_unchanged=true",
    "status=single_connected_component_created",
]

with open(
    report_path,
    "w",
    encoding="utf-8",
) as report_file:
    report_file.write(
        "\n".join(lines) + "\n"
    )

print("\n".join(lines))