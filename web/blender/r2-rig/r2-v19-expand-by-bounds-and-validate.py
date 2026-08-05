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

        minimum.x = min(minimum.x, coordinate.x)
        minimum.y = min(minimum.y, coordinate.y)
        minimum.z = min(minimum.z, coordinate.z)

        maximum.x = max(maximum.x, coordinate.x)
        maximum.y = max(maximum.y, coordinate.y)
        maximum.z = max(maximum.z, coordinate.z)

    return minimum, maximum


def count_connected_components(mesh):
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

        return {
            "boundary_edges": boundary_edges,
            "non_manifold_edges": non_manifold_edges,
            "loose_vertices": loose_vertices,
            "loose_edges": loose_edges,
        }

    finally:
        bm.free()


def recalculate_outward_normals(mesh):
    bm = bmesh.new()

    try:
        bm.from_mesh(mesh)

        bmesh.ops.recalc_face_normals(
            bm,
            faces=list(bm.faces),
        )

        bm.normal_update()

        signed_volume = bm.calc_volume(
            signed=True,
        )

        reversed_faces = False

        if signed_volume < 0.0:
            bmesh.ops.reverse_faces(
                bm,
                faces=list(bm.faces),
            )

            bm.normal_update()
            reversed_faces = True

        final_signed_volume = bm.calc_volume(
            signed=True,
        )

        bm.to_mesh(mesh)

        return (
            signed_volume,
            final_signed_volume,
            reversed_faces,
        )

    finally:
        bm.free()


def expand_cage_to_target_bounds(
    cage,
    target_minimum,
    target_maximum,
):
    cage_minimum, cage_maximum = (
        get_world_vertex_bounds(cage)
    )

    source_center = (
        cage_minimum + cage_maximum
    ) * 0.5

    source_half_size = (
        cage_maximum - cage_minimum
    ) * 0.5

    target_center = (
        target_minimum + target_maximum
    ) * 0.5

    target_half_size = (
        target_maximum - target_minimum
    ) * 0.5

    if (
        source_half_size.x <= 0.0
        or source_half_size.y <= 0.0
        or source_half_size.z <= 0.0
    ):
        raise RuntimeError(
            "A gaiola possui dimensões inválidas."
        )

    matrix_world = cage.matrix_world
    matrix_world_inverse = matrix_world.inverted()

    for vertex in cage.data.vertices:
        world_coordinate = (
            matrix_world @ vertex.co
        )

        normalized_coordinate = Vector((
            (
                world_coordinate.x
                - source_center.x
            ) / source_half_size.x,
            (
                world_coordinate.y
                - source_center.y
            ) / source_half_size.y,
            (
                world_coordinate.z
                - source_center.z
            ) / source_half_size.z,
        ))

        expanded_world_coordinate = Vector((
            target_center.x
            + normalized_coordinate.x
            * target_half_size.x,
            target_center.y
            + normalized_coordinate.y
            * target_half_size.y,
            target_center.z
            + normalized_coordinate.z
            * target_half_size.z,
        ))

        vertex.co = (
            matrix_world_inverse
            @ expanded_world_coordinate
        )

    cage.data.update()


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


def audit_body_against_cage(body, cage):
    bvh = create_world_bvh(cage)
    body_matrix_world = body.matrix_world

    tolerance = 0.000250

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

clearance = float(
    get_argument("--clearance")
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
        f"da expansão. Encontrados: {len(components_before)}"
    )

if topology_before["boundary_edges"] != 0:
    raise RuntimeError(
        "A gaiola possui bordas abertas antes da expansão: "
        f"{topology_before['boundary_edges']}"
    )

if topology_before["non_manifold_edges"] != 0:
    raise RuntimeError(
        "A gaiola possui arestas não manifold antes da expansão: "
        f"{topology_before['non_manifold_edges']}"
    )

body_minimum, body_maximum = (
    get_world_vertex_bounds(body)
)

cage_minimum_before, cage_maximum_before = (
    get_world_vertex_bounds(cage)
)

target_minimum = body_minimum - Vector((
    clearance,
    clearance,
    clearance,
))

target_maximum = body_maximum + Vector((
    clearance,
    clearance,
    clearance,
))

expand_cage_to_target_bounds(
    cage,
    target_minimum,
    target_maximum,
)

(
    signed_volume_before_correction,
    signed_volume_after_correction,
    faces_reversed,
) = recalculate_outward_normals(
    cage.data
)

cage.data.update()

cage_minimum_after, cage_maximum_after = (
    get_world_vertex_bounds(cage)
)

components_after = count_connected_components(
    cage.data
)

topology_after = get_topology_statistics(
    cage.data
)

margins = {
    "left": (
        body_minimum.x
        - cage_minimum_after.x
    ),
    "right": (
        cage_maximum_after.x
        - body_maximum.x
    ),
    "back": (
        body_minimum.y
        - cage_minimum_after.y
    ),
    "front": (
        cage_maximum_after.y
        - body_maximum.y
    ),
    "bottom": (
        body_minimum.z
        - cage_minimum_after.z
    ),
    "top": (
        cage_maximum_after.z
        - body_maximum.z
    ),
}

containment = audit_body_against_cage(
    body,
    cage,
)

topology_approved = (
    len(components_after) == 1
    and topology_after["boundary_edges"] == 0
    and topology_after["non_manifold_edges"] == 0
    and topology_after["loose_vertices"] == 0
    and topology_after["loose_edges"] == 0
)

bounds_approved = all(
    margin >= clearance - 0.000010
    for margin in margins.values()
)

containment_approved = (
    containment["outside_vertices"] == 0
    and containment["nearest_failures"] == 0
)

approved = (
    topology_approved
    and bounds_approved
    and containment_approved
)

status = (
    "expanded_cage_ready_for_binding"
    if approved
    else "expanded_cage_validation_failed"
)

lines = [
    (
        "R2_EXPANDED_CAGE_OK"
        if approved
        else "R2_EXPANDED_CAGE_FAILED"
    ),
    f"source_blend={source_blend_path}",
    f"output_blend={output_blend_path}",
    f"body={body.name}",
    f"cage={cage.name}",
    f"clearance={clearance:.6f}",
    f"body_vertices={len(body.data.vertices)}",
    f"cage_vertices={len(cage.data.vertices)}",
    f"cage_edges={len(cage.data.edges)}",
    f"cage_polygons={len(cage.data.polygons)}",
    f"components_before={len(components_before)}",
    f"components_after={len(components_after)}",
    (
        "body_world_minimum="
        + format_vector(body_minimum)
    ),
    (
        "body_world_maximum="
        + format_vector(body_maximum)
    ),
    (
        "cage_world_minimum_before="
        + format_vector(cage_minimum_before)
    ),
    (
        "cage_world_maximum_before="
        + format_vector(cage_maximum_before)
    ),
    (
        "target_world_minimum="
        + format_vector(target_minimum)
    ),
    (
        "target_world_maximum="
        + format_vector(target_maximum)
    ),
    (
        "cage_world_minimum_after="
        + format_vector(cage_minimum_after)
    ),
    (
        "cage_world_maximum_after="
        + format_vector(cage_maximum_after)
    ),
    f"margin_left={margins['left']:.6f}",
    f"margin_right={margins['right']:.6f}",
    f"margin_back={margins['back']:.6f}",
    f"margin_front={margins['front']:.6f}",
    f"margin_bottom={margins['bottom']:.6f}",
    f"margin_top={margins['top']:.6f}",
    (
        "boundary_edges_before="
        f"{topology_before['boundary_edges']}"
    ),
    (
        "non_manifold_edges_before="
        f"{topology_before['non_manifold_edges']}"
    ),
    (
        "boundary_edges_after="
        f"{topology_after['boundary_edges']}"
    ),
    (
        "non_manifold_edges_after="
        f"{topology_after['non_manifold_edges']}"
    ),
    (
        "loose_vertices_after="
        f"{topology_after['loose_vertices']}"
    ),
    (
        "loose_edges_after="
        f"{topology_after['loose_edges']}"
    ),
    (
        "signed_volume_before_correction="
        f"{signed_volume_before_correction:.9f}"
    ),
    (
        "signed_volume_after_correction="
        f"{signed_volume_after_correction:.9f}"
    ),
    f"faces_reversed={str(faces_reversed).lower()}",
    (
        "containment_tested_vertices="
        f"{containment['tested_vertices']}"
    ),
    (
        "containment_outside_vertices="
        f"{containment['outside_vertices']}"
    ),
    (
        "containment_nearest_failures="
        f"{containment['nearest_failures']}"
    ),
    (
        "maximum_outside_distance="
        f"{containment['maximum_outside_distance']:.6f}"
    ),
    (
        "minimum_signed_clearance="
        f"{containment['minimum_clearance']:.6f}"
    ),
    (
        "maximum_signed_clearance="
        f"{containment['maximum_clearance']:.6f}"
    ),
    f"topology_approved={str(topology_approved).lower()}",
    f"bounds_approved={str(bounds_approved).lower()}",
    (
        "containment_approved="
        f"{str(containment_approved).lower()}"
    ),
    "original_v18_unchanged=true",
    f"status={status}",
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

if not approved:
    raise RuntimeError(
        "A gaiola expandida não passou em todas as validações. "
        "O arquivo v19 não será salvo."
    )

cage.hide_viewport = True
cage.hide_render = True

bpy.ops.wm.save_as_mainfile(
    filepath=output_blend_path,
)

if not os.path.exists(output_blend_path):
    raise RuntimeError(
        "O arquivo v19 não foi criado."
    )