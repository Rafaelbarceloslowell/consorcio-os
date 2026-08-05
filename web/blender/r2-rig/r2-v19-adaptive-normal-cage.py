import bpy
import bmesh
import os
import sys

from collections import deque
from mathutils import Vector
from mathutils.bvhtree import BVHTree


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

    argument_index = arguments.index(name)

    if argument_index + 1 >= len(arguments):
        raise RuntimeError(
            f"Valor ausente para o argumento: {name}"
        )

    return arguments[argument_index + 1]


def format_vector(vector):
    return ",".join(
        f"{float(value):.6f}"
        for value in vector
    )


def get_world_vertex_bounds(obj):
    if obj.type != "MESH":
        raise RuntimeError(
            f"O objeto {obj.name} não é uma malha."
        )

    if len(obj.data.vertices) == 0:
        raise RuntimeError(
            f"O objeto {obj.name} não possui vértices."
        )

    matrix_world = obj.matrix_world

    first_coordinate = (
        matrix_world @ obj.data.vertices[0].co
    )

    minimum = first_coordinate.copy()
    maximum = first_coordinate.copy()

    for vertex in obj.data.vertices[1:]:
        coordinate = matrix_world @ vertex.co

        minimum.x = min(
            minimum.x,
            coordinate.x,
        )

        minimum.y = min(
            minimum.y,
            coordinate.y,
        )

        minimum.z = min(
            minimum.z,
            coordinate.z,
        )

        maximum.x = max(
            maximum.x,
            coordinate.x,
        )

        maximum.y = max(
            maximum.y,
            coordinate.y,
        )

        maximum.z = max(
            maximum.z,
            coordinate.z,
        )

    return minimum, maximum


def count_connected_components(mesh):
    vertex_count = len(mesh.vertices)

    adjacency = [
        []
        for _ in range(vertex_count)
    ]

    for edge in mesh.edges:
        first_vertex, second_vertex = edge.vertices

        adjacency[first_vertex].append(
            second_vertex
        )

        adjacency[second_vertex].append(
            first_vertex
        )

    visited = bytearray(vertex_count)
    component_sizes = []

    for starting_vertex in range(vertex_count):
        if visited[starting_vertex]:
            continue

        queue = deque([starting_vertex])
        visited[starting_vertex] = 1
        component_size = 0

        while queue:
            vertex_index = queue.popleft()
            component_size += 1

            for neighbor in adjacency[vertex_index]:
                if not visited[neighbor]:
                    visited[neighbor] = 1
                    queue.append(neighbor)

        component_sizes.append(component_size)

    component_sizes.sort(reverse=True)

    return component_sizes


def get_topology_statistics(mesh):
    bm = bmesh.new()

    try:
        bm.from_mesh(mesh)

        boundary_edges = sum(
            1
            for edge in bm.edges
            if edge.is_boundary
        )

        non_manifold_edges = sum(
            1
            for edge in bm.edges
            if not edge.is_manifold
        )

        loose_vertices = sum(
            1
            for vertex in bm.verts
            if not vertex.link_edges
        )

        loose_edges = sum(
            1
            for edge in bm.edges
            if not edge.link_faces
        )

        degenerate_faces = sum(
            1
            for face in bm.faces
            if face.calc_area() <= 0.000000000001
        )

        signed_volume = bm.calc_volume(
            signed=True,
        )

        return {
            "boundary_edges": boundary_edges,
            "non_manifold_edges": non_manifold_edges,
            "loose_vertices": loose_vertices,
            "loose_edges": loose_edges,
            "degenerate_faces": degenerate_faces,
            "signed_volume": signed_volume,
        }

    finally:
        bm.free()


def restore_original_coordinates(
    cage,
    original_coordinates,
):
    for vertex, original_coordinate in zip(
        cage.data.vertices,
        original_coordinates,
    ):
        vertex.co = original_coordinate.copy()

    cage.data.update()


def apply_normal_expansion(
    cage,
    expansion_distance,
):
    mesh = cage.data
    bm = bmesh.new()

    try:
        bm.from_mesh(mesh)

        bm.verts.ensure_lookup_table()
        bm.verts.index_update()

        bmesh.ops.recalc_face_normals(
            bm,
            faces=list(bm.faces),
        )

        bm.normal_update()

        signed_volume_before = bm.calc_volume(
            signed=True,
        )

        if signed_volume_before < 0.0:
            bmesh.ops.reverse_faces(
                bm,
                faces=list(bm.faces),
            )

            bm.normal_update()

        original_normals = [
            vertex.normal.copy()
            for vertex in bm.verts
        ]

        for vertex, normal in zip(
            bm.verts,
            original_normals,
        ):
            if normal.length_squared == 0.0:
                raise RuntimeError(
                    "Foi encontrado um vértice sem normal válida."
                )

            vertex.co += (
                normal.normalized()
                * expansion_distance
            )

        bmesh.ops.recalc_face_normals(
            bm,
            faces=list(bm.faces),
        )

        bm.normal_update()

        signed_volume_after = bm.calc_volume(
            signed=True,
        )

        if signed_volume_after < 0.0:
            bmesh.ops.reverse_faces(
                bm,
                faces=list(bm.faces),
            )

            bm.normal_update()

        bm.to_mesh(mesh)

    finally:
        bm.free()

    mesh.update()


def create_world_bvh(obj):
    matrix_world = obj.matrix_world

    world_vertices = [
        matrix_world @ vertex.co
        for vertex in obj.data.vertices
    ]

    polygons = [
        list(polygon.vertices)
        for polygon in obj.data.polygons
    ]

    return BVHTree.FromPolygons(
        world_vertices,
        polygons,
        all_triangles=False,
    )


def audit_body_against_cage(
    body,
    cage,
    tolerance,
):
    bvh = create_world_bvh(cage)
    body_matrix_world = body.matrix_world

    outside_vertices = 0
    nearest_failures = 0
    maximum_outside_distance = 0.0

    minimum_clearance = None
    maximum_clearance = None

    for vertex in body.data.vertices:
        world_coordinate = (
            body_matrix_world @ vertex.co
        )

        nearest_result = bvh.find_nearest(
            world_coordinate
        )

        if nearest_result is None:
            nearest_failures += 1
            continue

        nearest_location = nearest_result[0]
        nearest_normal = nearest_result[1]

        signed_distance = (
            world_coordinate
            - nearest_location
        ).dot(nearest_normal)

        clearance = -signed_distance

        if minimum_clearance is None:
            minimum_clearance = clearance
            maximum_clearance = clearance
        else:
            minimum_clearance = min(
                minimum_clearance,
                clearance,
            )

            maximum_clearance = max(
                maximum_clearance,
                clearance,
            )

        if signed_distance > tolerance:
            outside_vertices += 1

            maximum_outside_distance = max(
                maximum_outside_distance,
                signed_distance,
            )

    return {
        "tested_vertices": len(body.data.vertices),
        "outside_vertices": outside_vertices,
        "nearest_failures": nearest_failures,
        "maximum_outside_distance": (
            maximum_outside_distance
        ),
        "minimum_clearance": (
            minimum_clearance
            if minimum_clearance is not None
            else 0.0
        ),
        "maximum_clearance": (
            maximum_clearance
            if maximum_clearance is not None
            else 0.0
        ),
        "tolerance": tolerance,
    }


source_blend_path = bpy.data.filepath

output_blend_path = os.path.abspath(
    get_argument("--output-blend")
)

report_path = os.path.abspath(
    get_argument("--report")
)

candidate_distances = [
    float(value.strip())
    for value in get_argument(
        "--candidate-distances"
    ).split(",")
    if value.strip()
]

required_minimum_clearance = float(
    get_argument(
        "--required-minimum-clearance"
    )
)

containment_tolerance = float(
    get_argument(
        "--containment-tolerance"
    )
)

if os.path.exists(output_blend_path):
    raise RuntimeError(
        f"O arquivo de saída já existe: {output_blend_path}"
    )

if os.path.exists(report_path):
    raise RuntimeError(
        f"O relatório já existe: {report_path}"
    )

if not candidate_distances:
    raise RuntimeError(
        "Nenhuma distância candidata foi informada."
    )

if sorted(candidate_distances) != candidate_distances:
    raise RuntimeError(
        "As distâncias candidatas precisam estar "
        "em ordem crescente."
    )

body = bpy.data.objects.get(
    "R2_Body"
)

cage = bpy.data.objects.get(
    "R2_Deformation_Cage"
)

if body is None or body.type != "MESH":
    raise RuntimeError(
        "O corpo R2_Body não foi encontrado."
    )

if cage is None or cage.type != "MESH":
    raise RuntimeError(
        "A gaiola R2_Deformation_Cage não foi encontrada."
    )

if len(body.data.vertices) != 197505:
    raise RuntimeError(
        "O corpo não possui os 197505 vértices esperados."
    )

if len(cage.data.vertices) != 43226:
    raise RuntimeError(
        "A gaiola não possui os 43226 vértices esperados."
    )

if len(cage.data.polygons) != 43228:
    raise RuntimeError(
        "A gaiola não possui os 43228 polígonos esperados."
    )

if cage.matrix_world != body.matrix_world:
    raise RuntimeError(
        "O corpo e a gaiola possuem transformações diferentes."
    )

components_before = count_connected_components(
    cage.data
)

topology_before = get_topology_statistics(
    cage.data
)

if len(components_before) != 1:
    raise RuntimeError(
        "A gaiola não possui um único componente antes "
        f"dos testes. Encontrados: {len(components_before)}"
    )

if topology_before["boundary_edges"] != 0:
    raise RuntimeError(
        "A gaiola possui bordas abertas antes dos testes: "
        f"{topology_before['boundary_edges']}"
    )

if topology_before["non_manifold_edges"] != 0:
    raise RuntimeError(
        "A gaiola possui arestas não manifold antes dos testes: "
        f"{topology_before['non_manifold_edges']}"
    )

original_coordinates = [
    vertex.co.copy()
    for vertex in cage.data.vertices
]

body_minimum, body_maximum = (
    get_world_vertex_bounds(body)
)

cage_minimum_original, cage_maximum_original = (
    get_world_vertex_bounds(cage)
)

candidate_results = []
selected_distance = None
selected_result = None

for candidate_position, candidate_distance in enumerate(
    candidate_distances,
    start=1,
):
    restore_original_coordinates(
        cage,
        original_coordinates,
    )

    apply_normal_expansion(
        cage,
        candidate_distance,
    )

    cage_minimum, cage_maximum = (
        get_world_vertex_bounds(cage)
    )

    components = count_connected_components(
        cage.data
    )

    topology = get_topology_statistics(
        cage.data
    )

    containment = audit_body_against_cage(
        body,
        cage,
        containment_tolerance,
    )

    margins = {
        "left": (
            body_minimum.x
            - cage_minimum.x
        ),
        "right": (
            cage_maximum.x
            - body_maximum.x
        ),
        "back": (
            body_minimum.y
            - cage_minimum.y
        ),
        "front": (
            cage_maximum.y
            - body_maximum.y
        ),
        "bottom": (
            body_minimum.z
            - cage_minimum.z
        ),
        "top": (
            cage_maximum.z
            - body_maximum.z
        ),
    }

    topology_approved = (
        len(components) == 1
        and topology["boundary_edges"] == 0
        and topology["non_manifold_edges"] == 0
        and topology["loose_vertices"] == 0
        and topology["loose_edges"] == 0
        and topology["degenerate_faces"] == 0
        and topology["signed_volume"] > 0.0
    )

    containment_approved = (
        containment["outside_vertices"] == 0
        and containment["nearest_failures"] == 0
        and containment["minimum_clearance"]
        >= required_minimum_clearance
    )

    candidate_approved = (
        topology_approved
        and containment_approved
    )

    candidate_result = {
        "position": candidate_position,
        "distance": candidate_distance,
        "minimum": cage_minimum.copy(),
        "maximum": cage_maximum.copy(),
        "components": len(components),
        "topology": topology,
        "containment": containment,
        "margins": margins,
        "topology_approved": topology_approved,
        "containment_approved": containment_approved,
        "approved": candidate_approved,
    }

    candidate_results.append(
        candidate_result
    )

    if candidate_approved:
        selected_distance = candidate_distance
        selected_result = candidate_result
        break

approved = (
    selected_distance is not None
    and selected_result is not None
)

status = (
    "adaptive_normal_cage_ready_for_binding"
    if approved
    else "adaptive_normal_cage_validation_failed"
)

lines = [
    (
        "R2_ADAPTIVE_NORMAL_CAGE_OK"
        if approved
        else "R2_ADAPTIVE_NORMAL_CAGE_FAILED"
    ),
    f"source_blend={source_blend_path}",
    f"output_blend={output_blend_path}",
    f"body={body.name}",
    f"cage={cage.name}",
    (
        "candidate_distances="
        + ",".join(
            f"{distance:.6f}"
            for distance in candidate_distances
        )
    ),
    (
        "required_minimum_clearance="
        f"{required_minimum_clearance:.6f}"
    ),
    (
        "containment_tolerance="
        f"{containment_tolerance:.6f}"
    ),
    f"body_vertices={len(body.data.vertices)}",
    f"cage_vertices={len(cage.data.vertices)}",
    f"cage_edges={len(cage.data.edges)}",
    f"cage_polygons={len(cage.data.polygons)}",
    f"components_before={len(components_before)}",
    (
        "body_world_minimum="
        + format_vector(body_minimum)
    ),
    (
        "body_world_maximum="
        + format_vector(body_maximum)
    ),
    (
        "cage_world_minimum_original="
        + format_vector(cage_minimum_original)
    ),
    (
        "cage_world_maximum_original="
        + format_vector(cage_maximum_original)
    ),
    (
        "boundary_edges_before="
        f"{topology_before['boundary_edges']}"
    ),
    (
        "non_manifold_edges_before="
        f"{topology_before['non_manifold_edges']}"
    ),
]

for candidate_result in candidate_results:
    position = candidate_result["position"]
    topology = candidate_result["topology"]
    containment = candidate_result["containment"]
    margins = candidate_result["margins"]

    lines.extend([
        "",
        (
            f"candidate_{position}_distance="
            f"{candidate_result['distance']:.6f}"
        ),
        (
            f"candidate_{position}_cage_world_minimum="
            + format_vector(
                candidate_result["minimum"]
            )
        ),
        (
            f"candidate_{position}_cage_world_maximum="
            + format_vector(
                candidate_result["maximum"]
            )
        ),
        (
            f"candidate_{position}_margin_left="
            f"{margins['left']:.6f}"
        ),
        (
            f"candidate_{position}_margin_right="
            f"{margins['right']:.6f}"
        ),
        (
            f"candidate_{position}_margin_back="
            f"{margins['back']:.6f}"
        ),
        (
            f"candidate_{position}_margin_front="
            f"{margins['front']:.6f}"
        ),
        (
            f"candidate_{position}_margin_bottom="
            f"{margins['bottom']:.6f}"
        ),
        (
            f"candidate_{position}_margin_top="
            f"{margins['top']:.6f}"
        ),
        (
            f"candidate_{position}_components="
            f"{candidate_result['components']}"
        ),
        (
            f"candidate_{position}_boundary_edges="
            f"{topology['boundary_edges']}"
        ),
        (
            f"candidate_{position}_non_manifold_edges="
            f"{topology['non_manifold_edges']}"
        ),
        (
            f"candidate_{position}_loose_vertices="
            f"{topology['loose_vertices']}"
        ),
        (
            f"candidate_{position}_loose_edges="
            f"{topology['loose_edges']}"
        ),
        (
            f"candidate_{position}_degenerate_faces="
            f"{topology['degenerate_faces']}"
        ),
        (
            f"candidate_{position}_signed_volume="
            f"{topology['signed_volume']:.9f}"
        ),
        (
            f"candidate_{position}_outside_vertices="
            f"{containment['outside_vertices']}"
        ),
        (
            f"candidate_{position}_nearest_failures="
            f"{containment['nearest_failures']}"
        ),
        (
            f"candidate_{position}_maximum_outside_distance="
            f"{containment['maximum_outside_distance']:.6f}"
        ),
        (
            f"candidate_{position}_minimum_clearance="
            f"{containment['minimum_clearance']:.6f}"
        ),
        (
            f"candidate_{position}_maximum_clearance="
            f"{containment['maximum_clearance']:.6f}"
        ),
        (
            f"candidate_{position}_topology_approved="
            f"{str(candidate_result['topology_approved']).lower()}"
        ),
        (
            f"candidate_{position}_containment_approved="
            f"{str(candidate_result['containment_approved']).lower()}"
        ),
        (
            f"candidate_{position}_approved="
            f"{str(candidate_result['approved']).lower()}"
        ),
    ])

lines.extend([
    "",
    (
        "selected_distance="
        + (
            f"{selected_distance:.6f}"
            if selected_distance is not None
            else "NONE"
        )
    ),
    (
        "selected_outside_vertices="
        + (
            str(
                selected_result[
                    "containment"
                ][
                    "outside_vertices"
                ]
            )
            if selected_result is not None
            else "NONE"
        )
    ),
    (
        "selected_minimum_clearance="
        + (
            f"{selected_result['containment']['minimum_clearance']:.6f}"
            if selected_result is not None
            else "NONE"
        )
    ),
    (
        "selected_components="
        + (
            str(
                selected_result[
                    "components"
                ]
            )
            if selected_result is not None
            else "NONE"
        )
    ),
    (
        "selected_boundary_edges="
        + (
            str(
                selected_result[
                    "topology"
                ][
                    "boundary_edges"
                ]
            )
            if selected_result is not None
            else "NONE"
        )
    ),
    (
        "selected_non_manifold_edges="
        + (
            str(
                selected_result[
                    "topology"
                ][
                    "non_manifold_edges"
                ]
            )
            if selected_result is not None
            else "NONE"
        )
    ),
    "original_v18_unchanged=true",
    f"status={status}",
])

if approved:
    cage.hide_viewport = True
    cage.hide_render = True

    bpy.ops.wm.save_as_mainfile(
        filepath=output_blend_path,
    )

    if not os.path.exists(output_blend_path):
        raise RuntimeError(
            "O arquivo v19 aprovado não foi criado."
        )

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

if not approved:
    raise RuntimeError(
        "Nenhuma das distâncias testadas envolveu o corpo "
        "com a folga mínima exigida. "
        "Nenhum arquivo v19 foi salvo."
    )