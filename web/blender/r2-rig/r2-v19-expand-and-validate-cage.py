import bpy
import bmesh
import os
import sys

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


def get_world_bounds(obj):
    world_corners = [
        obj.matrix_world @ Vector(corner)
        for corner in obj.bound_box
    ]

    minimum = Vector((
        min(corner.x for corner in world_corners),
        min(corner.y for corner in world_corners),
        min(corner.z for corner in world_corners),
    ))

    maximum = Vector((
        max(corner.x for corner in world_corners),
        max(corner.y for corner in world_corners),
        max(corner.z for corner in world_corners),
    ))

    return minimum, maximum


def get_topology_statistics(mesh):
    bm = bmesh.new()

    try:
        bm.from_mesh(mesh)

        boundary_edges = sum(
            1
            for edge in bm.edges
            if edge.is_boundary
        )

        manifold_edges = sum(
            1
            for edge in bm.edges
            if edge.is_manifold
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
            "manifold_edges": manifold_edges,
            "non_manifold_edges": non_manifold_edges,
            "loose_vertices": loose_vertices,
            "loose_edges": loose_edges,
        }

    finally:
        bm.free()


def create_world_bvh(obj):
    mesh = obj.data
    matrix_world = obj.matrix_world

    world_vertices = [
        matrix_world @ vertex.co
        for vertex in mesh.vertices
    ]

    polygons = [
        list(polygon.vertices)
        for polygon in mesh.polygons
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
            world_coordinate - nearest_location
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
        "maximum_outside_distance": maximum_outside_distance,
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


output_blend_path = os.path.abspath(
    get_argument("--output-blend")
)

report_path = os.path.abspath(
    get_argument("--report")
)

expansion_distance = float(
    get_argument("--expansion")
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
        "O objeto de corpo R2_Body não foi encontrado."
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

if cage.matrix_world != body.matrix_world:
    raise RuntimeError(
        "O corpo e a gaiola não possuem a mesma transformação."
    )

body_minimum, body_maximum = get_world_bounds(
    body
)

cage_minimum_before, cage_maximum_before = (
    get_world_bounds(cage)
)

topology_before = get_topology_statistics(
    cage.data
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

mesh = cage.data
bm = bmesh.new()

try:
    bm.from_mesh(mesh)

    bmesh.ops.recalc_face_normals(
        bm,
        faces=list(bm.faces),
    )

    bm.normal_update()

    original_normals = {
        vertex.index: vertex.normal.copy()
        for vertex in bm.verts
    }

    for vertex in bm.verts:
        normal = original_normals[vertex.index]

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
    bm.to_mesh(mesh)

finally:
    bm.free()

mesh.update()

cage_minimum_after, cage_maximum_after = (
    get_world_bounds(cage)
)

topology_after = get_topology_statistics(
    cage.data
)

if topology_after["boundary_edges"] != 0:
    raise RuntimeError(
        "A expansão criou bordas abertas: "
        f"{topology_after['boundary_edges']}"
    )

if topology_after["non_manifold_edges"] != 0:
    raise RuntimeError(
        "A expansão criou arestas não manifold: "
        f"{topology_after['non_manifold_edges']}"
    )

margins = {
    "left": body_minimum.x - cage_minimum_after.x,
    "right": cage_maximum_after.x - body_maximum.x,
    "back": body_minimum.y - cage_minimum_after.y,
    "front": cage_maximum_after.y - body_maximum.y,
    "bottom": body_minimum.z - cage_minimum_after.z,
    "top": cage_maximum_after.z - body_maximum.z,
}

invalid_margins = {
    name: value
    for name, value in margins.items()
    if value <= 0.0
}

if invalid_margins:
    formatted_invalid_margins = ", ".join(
        f"{name}={value:.6f}"
        for name, value in invalid_margins.items()
    )

    raise RuntimeError(
        "A gaiola ainda não envolve os limites do corpo: "
        + formatted_invalid_margins
    )

containment = audit_body_against_cage(
    body,
    cage,
)

if containment["nearest_failures"] != 0:
    raise RuntimeError(
        "Falhou a análise de proximidade para "
        f"{containment['nearest_failures']} vértices."
    )

if containment["outside_vertices"] != 0:
    raise RuntimeError(
        "A análise encontrou vértices fora da gaiola: "
        f"{containment['outside_vertices']}. "
        "Nenhum arquivo será aprovado."
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

lines = [
    "R2_EXPANDED_CAGE_OK",
    f"input_blend={bpy.data.filepath}",
    f"output_blend={output_blend_path}",
    f"body={body.name}",
    f"cage={cage.name}",
    f"expansion_distance={expansion_distance:.6f}",
    f"body_vertices={len(body.data.vertices)}",
    f"cage_vertices={len(cage.data.vertices)}",
    f"cage_edges={len(cage.data.edges)}",
    f"cage_polygons={len(cage.data.polygons)}",
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
        "containment_tolerance="
        f"{containment['tolerance']:.6f}"
    ),
    (
        "minimum_signed_clearance="
        f"{containment['minimum_clearance']:.6f}"
    ),
    (
        "maximum_signed_clearance="
        f"{containment['maximum_clearance']:.6f}"
    ),
    "cage_hidden_in_viewport=true",
    "cage_hidden_in_render=true",
    "original_v18_unchanged=true",
    "status=expanded_cage_ready_for_binding",
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