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


def get_world_bounds(obj):
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


def get_world_coordinates(obj, vertex_indices):
    matrix_world = obj.matrix_world

    return [
        matrix_world @ obj.data.vertices[index].co
        for index in vertex_indices
    ]


def get_centroid(coordinates):
    if not coordinates:
        raise RuntimeError(
            "Não é possível calcular o centro de uma região vazia."
        )

    total = Vector((0.0, 0.0, 0.0))

    for coordinate in coordinates:
        total += coordinate

    return total / len(coordinates)


def build_adjacency(mesh):
    adjacency = [
        []
        for _ in range(len(mesh.vertices))
    ]

    for edge in mesh.edges:
        first_vertex, second_vertex = edge.vertices

        adjacency[first_vertex].append(
            second_vertex
        )

        adjacency[second_vertex].append(
            first_vertex
        )

    return adjacency


def find_subset_patches(
    adjacency,
    selected_vertices,
):
    selected_set = set(selected_vertices)
    visited = set()
    patches = []

    for starting_vertex in sorted(selected_set):
        if starting_vertex in visited:
            continue

        queue = deque([starting_vertex])
        visited.add(starting_vertex)
        patch = []

        while queue:
            vertex_index = queue.popleft()
            patch.append(vertex_index)

            for neighbor in adjacency[vertex_index]:
                if (
                    neighbor in selected_set
                    and neighbor not in visited
                ):
                    visited.add(neighbor)
                    queue.append(neighbor)

        patches.append(patch)

    patches.sort(
        key=len,
        reverse=True,
    )

    return patches


def count_connected_components(mesh):
    adjacency = build_adjacency(mesh)
    visited = bytearray(len(mesh.vertices))
    component_sizes = []

    for starting_vertex in range(len(mesh.vertices)):
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


def recalculate_outward_normals(mesh):
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

        bm.to_mesh(mesh)

    finally:
        bm.free()

    mesh.update()


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
    epsilon=0.000010,
    maximum_hits=128,
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


INITIAL_DIRECTIONS = [
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

VERIFICATION_DIRECTIONS = [
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
    Vector((
        0.707107,
        1.000000,
        -0.244949,
    )).normalized(),
    Vector((
        -1.000000,
        0.414214,
        0.577350,
    )).normalized(),
    Vector((
        0.447214,
        -1.000000,
        -0.316228,
    )).normalized(),
    Vector((
        -0.577350,
        -0.267949,
        1.000000,
    )).normalized(),
]


def classify_point(
    bvh,
    world_coordinate,
    directions,
    maximum_distance,
):
    inside_votes = 0
    outside_votes = 0
    ray_overflows = 0

    for direction in directions:
        intersection_count, overflow = (
            count_ray_intersections(
                bvh,
                world_coordinate,
                direction,
                maximum_distance,
            )
        )

        if overflow:
            ray_overflows += 1

        if intersection_count % 2 == 1:
            inside_votes += 1
        else:
            outside_votes += 1

    return {
        "inside_votes": inside_votes,
        "outside_votes": outside_votes,
        "ray_overflows": ray_overflows,
    }


def find_confirmed_outside(
    body,
    cage,
):
    cage_minimum, cage_maximum = (
        get_world_bounds(cage)
    )

    maximum_distance = max(
        (cage_maximum - cage_minimum).length
        * 4.0,
        10.0,
    )

    bvh = create_world_bvh(cage)
    body_matrix_world = body.matrix_world

    initial_suspects = []
    initial_ambiguous = 0
    initial_overflows = 0
    initial_patterns = Counter()

    for vertex in body.data.vertices:
        world_coordinate = (
            body_matrix_world @ vertex.co
        )

        result = classify_point(
            bvh,
            world_coordinate,
            INITIAL_DIRECTIONS,
            maximum_distance,
        )

        pattern = (
            f"{result['inside_votes']}_"
            f"{result['outside_votes']}"
        )

        initial_patterns[pattern] += 1
        initial_overflows += (
            result["ray_overflows"]
        )

        if result["outside_votes"] >= 2:
            initial_suspects.append(
                vertex.index
            )

        if (
            result["inside_votes"] > 0
            and result["outside_votes"] > 0
        ):
            initial_ambiguous += 1

    confirmed_outside = []
    disputed_vertices = []
    verification_overflows = 0
    verification_patterns = Counter()

    for vertex_index in initial_suspects:
        world_coordinate = (
            body_matrix_world
            @ body.data.vertices[vertex_index].co
        )

        result = classify_point(
            bvh,
            world_coordinate,
            VERIFICATION_DIRECTIONS,
            maximum_distance,
        )

        pattern = (
            f"{result['inside_votes']}_"
            f"{result['outside_votes']}"
        )

        verification_patterns[pattern] += 1
        verification_overflows += (
            result["ray_overflows"]
        )

        if result["outside_votes"] >= 5:
            confirmed_outside.append(
                vertex_index
            )
        else:
            disputed_vertices.append(
                vertex_index
            )

    return {
        "initial_suspects": initial_suspects,
        "initial_ambiguous": initial_ambiguous,
        "initial_overflows": initial_overflows,
        "initial_patterns": initial_patterns,
        "confirmed_outside": confirmed_outside,
        "disputed_vertices": disputed_vertices,
        "verification_overflows": (
            verification_overflows
        ),
        "verification_patterns": (
            verification_patterns
        ),
    }


def merge_patches_into_clusters(
    body,
    patches,
    merge_distance,
):
    patch_records = []

    for patch_index, patch in enumerate(patches):
        coordinates = get_world_coordinates(
            body,
            patch,
        )

        patch_records.append({
            "index": patch_index,
            "vertices": set(patch),
            "centroid": get_centroid(
                coordinates
            ),
        })

    parent = list(
        range(len(patch_records))
    )

    def find_root(index):
        while parent[index] != index:
            parent[index] = parent[parent[index]]
            index = parent[index]

        return index

    def union(first_index, second_index):
        first_root = find_root(first_index)
        second_root = find_root(second_index)

        if first_root != second_root:
            parent[second_root] = first_root

    for first_index in range(len(patch_records)):
        for second_index in range(
            first_index + 1,
            len(patch_records),
        ):
            distance = (
                patch_records[first_index]["centroid"]
                - patch_records[second_index]["centroid"]
            ).length

            if distance <= merge_distance:
                union(
                    first_index,
                    second_index,
                )

    grouped_vertices = {}

    for patch_index, record in enumerate(
        patch_records
    ):
        root = find_root(patch_index)

        if root not in grouped_vertices:
            grouped_vertices[root] = set()

        grouped_vertices[root].update(
            record["vertices"]
        )

    clusters = [
        sorted(vertices)
        for vertices in grouped_vertices.values()
    ]

    clusters.sort(
        key=len,
        reverse=True,
    )

    return clusters


def smoothstep(value):
    value = max(
        0.0,
        min(1.0, value),
    )

    return (
        value
        * value
        * (3.0 - 2.0 * value)
    )


def apply_local_cluster_corrections(
    body,
    cage,
    clusters,
    target_clearance,
    maximum_round_displacement,
):
    bvh = create_world_bvh(cage)

    cage_matrix_world = cage.matrix_world
    cage_matrix_world_inverse = (
        cage_matrix_world.inverted()
    )

    cage_world_coordinates = [
        cage_matrix_world @ vertex.co
        for vertex in cage.data.vertices
    ]

    accumulated_displacements = [
        Vector((0.0, 0.0, 0.0))
        for _ in cage.data.vertices
    ]

    correction_details = []

    for cluster_position, cluster in enumerate(
        clusters,
        start=1,
    ):
        cluster_coordinates = (
            get_world_coordinates(
                body,
                cluster,
            )
        )

        centroid = get_centroid(
            cluster_coordinates
        )

        cluster_radius = max(
            (
                coordinate - centroid
            ).length
            for coordinate in cluster_coordinates
        )

        nearest_result = bvh.find_nearest(
            centroid
        )

        if nearest_result is None:
            raise RuntimeError(
                "Não foi possível encontrar a superfície "
                "mais próxima para uma região externa."
            )

        nearest_location = nearest_result[0]
        nearest_normal = nearest_result[1]
        nearest_distance = nearest_result[3]

        correction_direction = (
            centroid - nearest_location
        )

        if correction_direction.length_squared <= 0.000000000001:
            correction_direction = (
                nearest_normal.copy()
            )

        if correction_direction.length_squared <= 0.000000000001:
            raise RuntimeError(
                "Não foi possível determinar a direção "
                "de correção local."
            )

        correction_direction.normalize()

        maximum_projection = max(
            (
                coordinate - nearest_location
            ).dot(correction_direction)
            for coordinate in cluster_coordinates
        )

        required_displacement = max(
            maximum_projection
            + target_clearance,
            nearest_distance
            + target_clearance,
            target_clearance,
        )

        influence_radius = max(
            0.040,
            cluster_radius * 3.5,
            required_displacement * 3.0,
        )

        influenced_vertices = 0

        for cage_vertex_index, cage_coordinate in enumerate(
            cage_world_coordinates
        ):
            distance_to_center = (
                cage_coordinate
                - nearest_location
            ).length

            if distance_to_center >= influence_radius:
                continue

            normalized_influence = (
                1.0
                - distance_to_center
                / influence_radius
            )

            influence = smoothstep(
                normalized_influence
            )

            accumulated_displacements[
                cage_vertex_index
            ] += (
                correction_direction
                * required_displacement
                * influence
            )

            influenced_vertices += 1

        correction_details.append({
            "position": cluster_position,
            "vertices": len(cluster),
            "centroid": centroid.copy(),
            "cluster_radius": cluster_radius,
            "nearest_location": (
                nearest_location.copy()
            ),
            "nearest_distance": (
                nearest_distance
            ),
            "direction": (
                correction_direction.copy()
            ),
            "required_displacement": (
                required_displacement
            ),
            "influence_radius": (
                influence_radius
            ),
            "influenced_vertices": (
                influenced_vertices
            ),
        })

    moved_vertices = 0
    maximum_applied_displacement = 0.0

    for vertex_index, displacement in enumerate(
        accumulated_displacements
    ):
        displacement_length = (
            displacement.length
        )

        if displacement_length <= 0.0:
            continue

        if (
            displacement_length
            > maximum_round_displacement
        ):
            displacement = (
                displacement.normalized()
                * maximum_round_displacement
            )

            displacement_length = (
                maximum_round_displacement
            )

        new_world_coordinate = (
            cage_world_coordinates[vertex_index]
            + displacement
        )

        cage.data.vertices[vertex_index].co = (
            cage_matrix_world_inverse
            @ new_world_coordinate
        )

        moved_vertices += 1

        maximum_applied_displacement = max(
            maximum_applied_displacement,
            displacement_length,
        )

    cage.data.update()
    recalculate_outward_normals(
        cage.data
    )

    return {
        "clusters": len(clusters),
        "moved_vertices": moved_vertices,
        "maximum_applied_displacement": (
            maximum_applied_displacement
        ),
        "correction_details": (
            correction_details
        ),
    }


source_blend_path = bpy.data.filepath

output_blend_path = os.path.abspath(
    get_argument("--output-blend")
)

report_path = os.path.abspath(
    get_argument("--report")
)

global_expansion = float(
    get_argument("--global-expansion")
)

target_clearance = float(
    get_argument("--target-clearance")
)

merge_distance = float(
    get_argument("--merge-distance")
)

maximum_rounds = int(
    get_argument("--maximum-rounds")
)

maximum_round_displacement = float(
    get_argument(
        "--maximum-round-displacement"
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

if body.matrix_world != cage.matrix_world:
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
        "A gaiola original não possui um único componente."
    )

if topology_before["boundary_edges"] != 0:
    raise RuntimeError(
        "A gaiola original possui bordas abertas."
    )

if topology_before["non_manifold_edges"] != 0:
    raise RuntimeError(
        "A gaiola original possui arestas não manifold."
    )

apply_normal_expansion(
    cage,
    global_expansion,
)

body_adjacency = build_adjacency(
    body.data
)

round_results = []

containment = find_confirmed_outside(
    body,
    cage,
)

initial_confirmed_outside = len(
    containment["confirmed_outside"]
)

for round_number in range(
    1,
    maximum_rounds + 1,
):
    confirmed_outside = (
        containment["confirmed_outside"]
    )

    if not confirmed_outside:
        break

    patches = find_subset_patches(
        body_adjacency,
        confirmed_outside,
    )

    clusters = merge_patches_into_clusters(
        body,
        patches,
        merge_distance,
    )

    correction = (
        apply_local_cluster_corrections(
            body,
            cage,
            clusters,
            target_clearance,
            maximum_round_displacement,
        )
    )

    topology_after_round = (
        get_topology_statistics(
            cage.data
        )
    )

    components_after_round = (
        count_connected_components(
            cage.data
        )
    )

    topology_round_approved = (
        len(components_after_round) == 1
        and topology_after_round[
            "boundary_edges"
        ] == 0
        and topology_after_round[
            "non_manifold_edges"
        ] == 0
        and topology_after_round[
            "loose_vertices"
        ] == 0
        and topology_after_round[
            "loose_edges"
        ] == 0
        and topology_after_round[
            "degenerate_faces"
        ] == 0
        and topology_after_round[
            "signed_volume"
        ] > 0.0
    )

    if not topology_round_approved:
        raise RuntimeError(
            f"A topologia foi comprometida na rodada "
            f"{round_number}. Nenhum arquivo será salvo."
        )

    containment_after = find_confirmed_outside(
        body,
        cage,
    )

    round_results.append({
        "round": round_number,
        "outside_before": len(
            confirmed_outside
        ),
        "patches": len(patches),
        "clusters": len(clusters),
        "correction": correction,
        "topology": topology_after_round,
        "components": len(
            components_after_round
        ),
        "outside_after": len(
            containment_after[
                "confirmed_outside"
            ]
        ),
        "ambiguous_after": (
            containment_after[
                "initial_ambiguous"
            ]
        ),
        "ray_overflows_after": (
            containment_after[
                "initial_overflows"
            ]
            + containment_after[
                "verification_overflows"
            ]
        ),
    })

    containment = containment_after

final_confirmed_outside = len(
    containment["confirmed_outside"]
)

final_disputed_vertices = len(
    containment["disputed_vertices"]
)

final_ray_overflows = (
    containment["initial_overflows"]
    + containment["verification_overflows"]
)

components_final = count_connected_components(
    cage.data
)

topology_final = get_topology_statistics(
    cage.data
)

body_minimum, body_maximum = (
    get_world_bounds(body)
)

cage_minimum, cage_maximum = (
    get_world_bounds(cage)
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
    len(components_final) == 1
    and topology_final["boundary_edges"] == 0
    and topology_final["non_manifold_edges"] == 0
    and topology_final["loose_vertices"] == 0
    and topology_final["loose_edges"] == 0
    and topology_final["degenerate_faces"] == 0
    and topology_final["signed_volume"] > 0.0
)

bounds_approved = all(
    margin >= 0.005
    for margin in margins.values()
)

containment_approved = (
    final_confirmed_outside == 0
    and final_ray_overflows == 0
)

approved = (
    topology_approved
    and bounds_approved
    and containment_approved
)

status = (
    "local_envelope_cage_ready_for_binding"
    if approved
    else "local_envelope_cage_validation_failed"
)

lines = [
    (
        "R2_LOCAL_ENVELOPE_CAGE_OK"
        if approved
        else "R2_LOCAL_ENVELOPE_CAGE_FAILED"
    ),
    f"source_blend={source_blend_path}",
    f"output_blend={output_blend_path}",
    f"body={body.name}",
    f"cage={cage.name}",
    (
        "global_expansion="
        f"{global_expansion:.6f}"
    ),
    (
        "target_clearance="
        f"{target_clearance:.6f}"
    ),
    (
        "merge_distance="
        f"{merge_distance:.6f}"
    ),
    f"maximum_rounds={maximum_rounds}",
    (
        "maximum_round_displacement="
        f"{maximum_round_displacement:.6f}"
    ),
    f"body_vertices={len(body.data.vertices)}",
    f"cage_vertices={len(cage.data.vertices)}",
    f"cage_edges={len(cage.data.edges)}",
    f"cage_polygons={len(cage.data.polygons)}",
    (
        "initial_confirmed_outside="
        f"{initial_confirmed_outside}"
    ),
    f"rounds_executed={len(round_results)}",
]

for result in round_results:
    round_number = result["round"]
    correction = result["correction"]
    topology = result["topology"]

    lines.extend([
        "",
        (
            f"round_{round_number}_outside_before="
            f"{result['outside_before']}"
        ),
        (
            f"round_{round_number}_patches="
            f"{result['patches']}"
        ),
        (
            f"round_{round_number}_clusters="
            f"{result['clusters']}"
        ),
        (
            f"round_{round_number}_moved_cage_vertices="
            f"{correction['moved_vertices']}"
        ),
        (
            f"round_{round_number}_maximum_applied_displacement="
            f"{correction['maximum_applied_displacement']:.6f}"
        ),
        (
            f"round_{round_number}_components="
            f"{result['components']}"
        ),
        (
            f"round_{round_number}_boundary_edges="
            f"{topology['boundary_edges']}"
        ),
        (
            f"round_{round_number}_non_manifold_edges="
            f"{topology['non_manifold_edges']}"
        ),
        (
            f"round_{round_number}_signed_volume="
            f"{topology['signed_volume']:.9f}"
        ),
        (
            f"round_{round_number}_outside_after="
            f"{result['outside_after']}"
        ),
        (
            f"round_{round_number}_ambiguous_after="
            f"{result['ambiguous_after']}"
        ),
        (
            f"round_{round_number}_ray_overflows_after="
            f"{result['ray_overflows_after']}"
        ),
    ])

    for detail in correction[
        "correction_details"
    ]:
        cluster_position = detail["position"]

        lines.extend([
            (
                f"round_{round_number}_cluster_"
                f"{cluster_position}_vertices="
                f"{detail['vertices']}"
            ),
            (
                f"round_{round_number}_cluster_"
                f"{cluster_position}_centroid="
                + format_vector(
                    detail["centroid"]
                )
            ),
            (
                f"round_{round_number}_cluster_"
                f"{cluster_position}_nearest_distance="
                f"{detail['nearest_distance']:.6f}"
            ),
            (
                f"round_{round_number}_cluster_"
                f"{cluster_position}_required_displacement="
                f"{detail['required_displacement']:.6f}"
            ),
            (
                f"round_{round_number}_cluster_"
                f"{cluster_position}_influence_radius="
                f"{detail['influence_radius']:.6f}"
            ),
            (
                f"round_{round_number}_cluster_"
                f"{cluster_position}_influenced_vertices="
                f"{detail['influenced_vertices']}"
            ),
        ])

lines.extend([
    "",
    (
        "final_confirmed_outside="
        f"{final_confirmed_outside}"
    ),
    (
        "final_disputed_vertices="
        f"{final_disputed_vertices}"
    ),
    (
        "final_ray_overflows="
        f"{final_ray_overflows}"
    ),
    f"components_final={len(components_final)}",
    (
        "boundary_edges_final="
        f"{topology_final['boundary_edges']}"
    ),
    (
        "non_manifold_edges_final="
        f"{topology_final['non_manifold_edges']}"
    ),
    (
        "loose_vertices_final="
        f"{topology_final['loose_vertices']}"
    ),
    (
        "loose_edges_final="
        f"{topology_final['loose_edges']}"
    ),
    (
        "degenerate_faces_final="
        f"{topology_final['degenerate_faces']}"
    ),
    (
        "signed_volume_final="
        f"{topology_final['signed_volume']:.9f}"
    ),
    (
        "cage_world_minimum="
        + format_vector(cage_minimum)
    ),
    (
        "cage_world_maximum="
        + format_vector(cage_maximum)
    ),
    f"margin_left={margins['left']:.6f}",
    f"margin_right={margins['right']:.6f}",
    f"margin_back={margins['back']:.6f}",
    f"margin_front={margins['front']:.6f}",
    f"margin_bottom={margins['bottom']:.6f}",
    f"margin_top={margins['top']:.6f}",
    (
        "topology_approved="
        f"{str(topology_approved).lower()}"
    ),
    (
        "bounds_approved="
        f"{str(bounds_approved).lower()}"
    ),
    (
        "containment_approved="
        f"{str(containment_approved).lower()}"
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
        "A correção local não passou em todas as validações. "
        "Nenhum arquivo v19 foi salvo."
    )