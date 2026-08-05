import bpy
import bmesh
import os
import sys

from collections import Counter, deque
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


def restore_coordinates(obj, coordinates):
    if len(obj.data.vertices) != len(coordinates):
        raise RuntimeError(
            "A contagem de vértices mudou durante a auditoria."
        )

    for vertex, coordinate in zip(
        obj.data.vertices,
        coordinates,
    ):
        vertex.co = coordinate.copy()

    obj.data.update()


def get_world_bounds(obj):
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


def count_components(mesh):
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


def get_topology(mesh):
    bm = bmesh.new()

    try:
        bm.from_mesh(mesh)

        return {
            "boundary_edges": sum(
                1
                for edge in bm.edges
                if edge.is_boundary
            ),
            "non_manifold_edges": sum(
                1
                for edge in bm.edges
                if not edge.is_manifold
            ),
            "loose_vertices": sum(
                1
                for vertex in bm.verts
                if not vertex.link_edges
            ),
            "loose_edges": sum(
                1
                for edge in bm.edges
                if not edge.link_faces
            ),
            "degenerate_faces": sum(
                1
                for face in bm.faces
                if face.calc_area() <= 0.000000000001
            ),
            "signed_volume": bm.calc_volume(
                signed=True,
            ),
        }

    finally:
        bm.free()


def apply_normal_expansion(
    cage,
    expansion_distance,
):
    mesh = cage.data
    bm = bmesh.new()

    try:
        bm.from_mesh(mesh)

        bmesh.ops.recalc_face_normals(
            bm,
            faces=list(bm.faces),
        )

        bm.normal_update()

        if bm.calc_volume(signed=True) < 0.0:
            bmesh.ops.reverse_faces(
                bm,
                faces=list(bm.faces),
            )

            bm.normal_update()

        vertex_normals = [
            vertex.normal.copy()
            for vertex in bm.verts
        ]

        for vertex, normal in zip(
            bm.verts,
            vertex_normals,
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

        if bm.calc_volume(signed=True) < 0.0:
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
    mesh = obj.data
    mesh.calc_loop_triangles()

    matrix_world = obj.matrix_world

    world_vertices = [
        matrix_world @ vertex.co
        for vertex in mesh.vertices
    ]

    triangles = [
        tuple(loop_triangle.vertices)
        for loop_triangle in mesh.loop_triangles
    ]

    return BVHTree.FromPolygons(
        world_vertices,
        triangles,
        all_triangles=True,
    )


def count_ray_intersections(
    bvh,
    starting_point,
    direction,
    maximum_distance,
    epsilon,
    maximum_hits,
):
    origin = starting_point.copy()
    remaining_distance = maximum_distance
    intersection_count = 0

    for _ in range(maximum_hits):
        result = bvh.ray_cast(
            origin,
            direction,
            remaining_distance,
        )

        location = result[0]
        distance = result[3]

        if location is None or distance is None:
            return intersection_count, False

        travelled_distance = (
            location - origin
        ).length

        intersection_count += 1

        advance_distance = max(
            epsilon,
            travelled_distance * 0.000001,
        )

        origin = (
            location
            + direction * advance_distance
        )

        remaining_distance -= (
            travelled_distance
            + advance_distance
        )

        if remaining_distance <= 0.0:
            return intersection_count, False

    return intersection_count, True


def audit_points(
    body,
    cage,
    vertex_indices,
    directions,
):
    cage_minimum, cage_maximum = (
        get_world_bounds(cage)
    )

    cage_diagonal = (
        cage_maximum - cage_minimum
    ).length

    maximum_distance = max(
        cage_diagonal * 4.0,
        10.0,
    )

    epsilon = 0.000010
    maximum_hits = 128

    bvh = create_world_bvh(cage)
    body_matrix_world = body.matrix_world

    tested_vertices = 0
    majority_inside_vertices = 0
    majority_outside_vertices = 0
    unanimous_inside_vertices = 0
    unanimous_outside_vertices = 0
    ambiguous_vertices = 0
    ray_overflows = 0
    maximum_intersections = 0
    parity_patterns = Counter()

    for vertex_index in vertex_indices:
        world_coordinate = (
            body_matrix_world
            @ body.data.vertices[vertex_index].co
        )

        parity_votes = []

        for direction in directions:
            intersection_count, overflow = (
                count_ray_intersections(
                    bvh,
                    world_coordinate,
                    direction,
                    maximum_distance,
                    epsilon,
                    maximum_hits,
                )
            )

            maximum_intersections = max(
                maximum_intersections,
                intersection_count,
            )

            if overflow:
                ray_overflows += 1

            parity_votes.append(
                1
                if intersection_count % 2 == 1
                else 0
            )

        inside_votes = sum(parity_votes)
        tested_vertices += 1

        parity_pattern = "".join(
            str(vote)
            for vote in parity_votes
        )

        parity_patterns[parity_pattern] += 1

        if inside_votes >= 2:
            majority_inside_vertices += 1
        else:
            majority_outside_vertices += 1

        if inside_votes == len(directions):
            unanimous_inside_vertices += 1
        elif inside_votes == 0:
            unanimous_outside_vertices += 1
        else:
            ambiguous_vertices += 1

    return {
        "tested_vertices": tested_vertices,
        "majority_inside_vertices": (
            majority_inside_vertices
        ),
        "majority_outside_vertices": (
            majority_outside_vertices
        ),
        "unanimous_inside_vertices": (
            unanimous_inside_vertices
        ),
        "unanimous_outside_vertices": (
            unanimous_outside_vertices
        ),
        "ambiguous_vertices": ambiguous_vertices,
        "ray_overflows": ray_overflows,
        "maximum_intersections": (
            maximum_intersections
        ),
        "parity_patterns": parity_patterns,
    }


source_blend_path = bpy.data.filepath

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

sample_stride = int(
    get_argument("--sample-stride")
)

if os.path.exists(report_path):
    raise RuntimeError(
        f"O relatório já existe: {report_path}"
    )

if not candidate_distances:
    raise RuntimeError(
        "Nenhuma distância candidata foi informada."
    )

if candidate_distances != sorted(candidate_distances):
    raise RuntimeError(
        "As distâncias precisam estar em ordem crescente."
    )

if sample_stride <= 0:
    raise RuntimeError(
        "O intervalo da amostra precisa ser positivo."
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

components_original = count_components(
    cage.data
)

topology_original = get_topology(
    cage.data
)

if len(components_original) != 1:
    raise RuntimeError(
        "A gaiola original não possui um único componente."
    )

if topology_original["boundary_edges"] != 0:
    raise RuntimeError(
        "A gaiola original possui bordas abertas."
    )

if topology_original["non_manifold_edges"] != 0:
    raise RuntimeError(
        "A gaiola original possui arestas não manifold."
    )

original_coordinates = [
    vertex.co.copy()
    for vertex in cage.data.vertices
]

body_minimum, body_maximum = (
    get_world_bounds(body)
)

directions = [
    Vector((
        1.000000,
        0.318310,
        0.141421,
    )).normalized(),
    Vector((
        -0.271828,
        1.000000,
        0.173205,
    )).normalized(),
    Vector((
        0.223607,
        -0.367879,
        1.000000,
    )).normalized(),
]

sample_indices = list(
    range(
        0,
        len(body.data.vertices),
        sample_stride,
    )
)

last_vertex_index = (
    len(body.data.vertices) - 1
)

if sample_indices[-1] != last_vertex_index:
    sample_indices.append(
        last_vertex_index
    )

sample_results = []

for candidate_position, distance in enumerate(
    candidate_distances,
    start=1,
):
    restore_coordinates(
        cage,
        original_coordinates,
    )

    apply_normal_expansion(
        cage,
        distance,
    )

    cage_minimum, cage_maximum = (
        get_world_bounds(cage)
    )

    components = count_components(
        cage.data
    )

    topology = get_topology(
        cage.data
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

    bounds_approved = all(
        margin > 0.0
        for margin in margins.values()
    )

    sample_audit = audit_points(
        body,
        cage,
        sample_indices,
        directions,
    )

    sample_results.append({
        "position": candidate_position,
        "distance": distance,
        "minimum": cage_minimum.copy(),
        "maximum": cage_maximum.copy(),
        "components": len(components),
        "topology": topology,
        "margins": margins,
        "topology_approved": topology_approved,
        "bounds_approved": bounds_approved,
        "audit": sample_audit,
    })

ranked_results = sorted(
    sample_results,
    key=lambda result: (
        result["audit"][
            "majority_outside_vertices"
        ],
        result["audit"][
            "ambiguous_vertices"
        ],
        result["distance"],
    ),
)

full_results = []
selected_result = None

for ranked_result in ranked_results[:2]:
    restore_coordinates(
        cage,
        original_coordinates,
    )

    apply_normal_expansion(
        cage,
        ranked_result["distance"],
    )

    full_audit = audit_points(
        body,
        cage,
        range(len(body.data.vertices)),
        directions,
    )

    ambiguity_limit = max(
        25,
        int(
            full_audit["tested_vertices"]
            * 0.0001
        ),
    )

    approved = (
        ranked_result["topology_approved"]
        and ranked_result["bounds_approved"]
        and full_audit[
            "majority_outside_vertices"
        ] == 0
        and full_audit[
            "unanimous_outside_vertices"
        ] == 0
        and full_audit[
            "ambiguous_vertices"
        ] <= ambiguity_limit
        and full_audit[
            "ray_overflows"
        ] == 0
    )

    full_result = {
        "candidate": ranked_result,
        "audit": full_audit,
        "ambiguity_limit": ambiguity_limit,
        "approved": approved,
    }

    full_results.append(
        full_result
    )

    if approved:
        selected_result = full_result
        break

restore_coordinates(
    cage,
    original_coordinates,
)

status = (
    "ray_parity_candidate_found"
    if selected_result is not None
    else "ray_parity_no_candidate"
)

lines = [
    "R2_RAY_PARITY_CONTAINMENT_AUDIT",
    f"source_blend={source_blend_path}",
    f"body={body.name}",
    f"cage={cage.name}",
    (
        "candidate_distances="
        + ",".join(
            f"{distance:.6f}"
            for distance in candidate_distances
        )
    ),
    f"sample_stride={sample_stride}",
    f"sample_vertices={len(sample_indices)}",
    f"ray_directions={len(directions)}",
    f"body_vertices={len(body.data.vertices)}",
    f"cage_vertices={len(cage.data.vertices)}",
    f"cage_polygons={len(cage.data.polygons)}",
    f"components_original={len(components_original)}",
    (
        "boundary_edges_original="
        f"{topology_original['boundary_edges']}"
    ),
    (
        "non_manifold_edges_original="
        f"{topology_original['non_manifold_edges']}"
    ),
]

for result in sample_results:
    position = result["position"]
    topology = result["topology"]
    margins = result["margins"]
    audit = result["audit"]

    lines.extend([
        "",
        (
            f"sample_candidate_{position}_distance="
            f"{result['distance']:.6f}"
        ),
        (
            f"sample_candidate_{position}_components="
            f"{result['components']}"
        ),
        (
            f"sample_candidate_{position}_boundary_edges="
            f"{topology['boundary_edges']}"
        ),
        (
            f"sample_candidate_{position}_non_manifold_edges="
            f"{topology['non_manifold_edges']}"
        ),
        (
            f"sample_candidate_{position}_signed_volume="
            f"{topology['signed_volume']:.9f}"
        ),
        (
            f"sample_candidate_{position}_margin_left="
            f"{margins['left']:.6f}"
        ),
        (
            f"sample_candidate_{position}_margin_right="
            f"{margins['right']:.6f}"
        ),
        (
            f"sample_candidate_{position}_margin_back="
            f"{margins['back']:.6f}"
        ),
        (
            f"sample_candidate_{position}_margin_front="
            f"{margins['front']:.6f}"
        ),
        (
            f"sample_candidate_{position}_margin_bottom="
            f"{margins['bottom']:.6f}"
        ),
        (
            f"sample_candidate_{position}_margin_top="
            f"{margins['top']:.6f}"
        ),
        (
            f"sample_candidate_{position}_tested_vertices="
            f"{audit['tested_vertices']}"
        ),
        (
            f"sample_candidate_{position}_majority_outside="
            f"{audit['majority_outside_vertices']}"
        ),
        (
            f"sample_candidate_{position}_unanimous_outside="
            f"{audit['unanimous_outside_vertices']}"
        ),
        (
            f"sample_candidate_{position}_ambiguous="
            f"{audit['ambiguous_vertices']}"
        ),
        (
            f"sample_candidate_{position}_ray_overflows="
            f"{audit['ray_overflows']}"
        ),
        (
            f"sample_candidate_{position}_maximum_intersections="
            f"{audit['maximum_intersections']}"
        ),
        (
            f"sample_candidate_{position}_topology_approved="
            f"{str(result['topology_approved']).lower()}"
        ),
        (
            f"sample_candidate_{position}_bounds_approved="
            f"{str(result['bounds_approved']).lower()}"
        ),
    ])

    for pattern, count in sorted(
        audit["parity_patterns"].items()
    ):
        lines.append(
            (
                f"sample_candidate_{position}_"
                f"pattern_{pattern}={count}"
            )
        )

for full_position, result in enumerate(
    full_results,
    start=1,
):
    candidate = result["candidate"]
    audit = result["audit"]

    lines.extend([
        "",
        (
            f"full_test_{full_position}_distance="
            f"{candidate['distance']:.6f}"
        ),
        (
            f"full_test_{full_position}_tested_vertices="
            f"{audit['tested_vertices']}"
        ),
        (
            f"full_test_{full_position}_majority_inside="
            f"{audit['majority_inside_vertices']}"
        ),
        (
            f"full_test_{full_position}_majority_outside="
            f"{audit['majority_outside_vertices']}"
        ),
        (
            f"full_test_{full_position}_unanimous_inside="
            f"{audit['unanimous_inside_vertices']}"
        ),
        (
            f"full_test_{full_position}_unanimous_outside="
            f"{audit['unanimous_outside_vertices']}"
        ),
        (
            f"full_test_{full_position}_ambiguous="
            f"{audit['ambiguous_vertices']}"
        ),
        (
            f"full_test_{full_position}_ambiguity_limit="
            f"{result['ambiguity_limit']}"
        ),
        (
            f"full_test_{full_position}_ray_overflows="
            f"{audit['ray_overflows']}"
        ),
        (
            f"full_test_{full_position}_maximum_intersections="
            f"{audit['maximum_intersections']}"
        ),
        (
            f"full_test_{full_position}_approved="
            f"{str(result['approved']).lower()}"
        ),
    ])

    for pattern, count in sorted(
        audit["parity_patterns"].items()
    ):
        lines.append(
            (
                f"full_test_{full_position}_"
                f"pattern_{pattern}={count}"
            )
        )

lines.extend([
    "",
    (
        "selected_distance="
        + (
            f"{selected_result['candidate']['distance']:.6f}"
            if selected_result is not None
            else "NONE"
        )
    ),
    (
        "selected_majority_outside="
        + (
            str(
                selected_result[
                    "audit"
                ][
                    "majority_outside_vertices"
                ]
            )
            if selected_result is not None
            else "NONE"
        )
    ),
    (
        "selected_ambiguous="
        + (
            str(
                selected_result[
                    "audit"
                ][
                    "ambiguous_vertices"
                ]
            )
            if selected_result is not None
            else "NONE"
        )
    ),
    "blend_saved=false",
    "original_v18_unchanged=true",
    f"status={status}",
])

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