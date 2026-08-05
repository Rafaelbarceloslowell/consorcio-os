import bpy
import bmesh
import os
import sys

from collections import Counter, defaultdict, deque
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


def get_world_bounds_from_indices(
    obj,
    vertex_indices,
):
    if not vertex_indices:
        return None, None

    matrix_world = obj.matrix_world
    indices = list(vertex_indices)

    first_coordinate = (
        matrix_world
        @ obj.data.vertices[indices[0]].co
    )

    minimum = first_coordinate.copy()
    maximum = first_coordinate.copy()

    for vertex_index in indices[1:]:
        coordinate = (
            matrix_world
            @ obj.data.vertices[vertex_index].co
        )

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


def get_world_centroid(
    obj,
    vertex_indices,
):
    matrix_world = obj.matrix_world
    total = Vector((0.0, 0.0, 0.0))
    indices = list(vertex_indices)

    for vertex_index in indices:
        total += (
            matrix_world
            @ obj.data.vertices[vertex_index].co
        )

    return total / len(indices)


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


def find_connected_components(adjacency):
    vertex_count = len(adjacency)
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

            component_by_vertex[vertex_index] = (
                component_index
            )

            component_vertices.append(
                vertex_index
            )

            for neighbor in adjacency[vertex_index]:
                if not visited[neighbor]:
                    visited[neighbor] = 1
                    queue.append(neighbor)

        components.append(
            component_vertices
        )

    return components, component_by_vertex


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


def restore_coordinates(
    obj,
    coordinates,
):
    if len(obj.data.vertices) != len(coordinates):
        raise RuntimeError(
            "A quantidade de vértices mudou."
        )

    for vertex, coordinate in zip(
        obj.data.vertices,
        coordinates,
    ):
        vertex.co = coordinate.copy()

    obj.data.update()


def apply_normal_expansion(
    cage,
    expansion_distance,
):
    mesh = cage.data
    bm = bmesh.new()

    try:
        bm.from_mesh(mesh)

        bm.verts.ensure_lookup_table()

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
                    "Foi encontrado um vértice sem normal."
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


def classify_point(
    bvh,
    world_coordinate,
    directions,
    maximum_distance,
):
    epsilon = 0.000010
    maximum_hits = 128

    inside_votes = 0
    outside_votes = 0
    overflow_count = 0
    intersection_counts = []

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

        intersection_counts.append(
            intersection_count
        )

        if overflow:
            overflow_count += 1

        if intersection_count % 2 == 1:
            inside_votes += 1
        else:
            outside_votes += 1

    return {
        "inside_votes": inside_votes,
        "outside_votes": outside_votes,
        "overflow_count": overflow_count,
        "intersection_counts": (
            intersection_counts
        ),
    }


def distance_point_to_segment(
    point,
    segment_start,
    segment_end,
):
    segment = segment_end - segment_start
    segment_length_squared = (
        segment.length_squared
    )

    if segment_length_squared == 0.0:
        return (
            point - segment_start
        ).length

    parameter = (
        point - segment_start
    ).dot(segment) / segment_length_squared

    parameter = max(
        0.0,
        min(1.0, parameter),
    )

    nearest_point = (
        segment_start
        + segment * parameter
    )

    return (
        point - nearest_point
    ).length


def get_nearest_bones(
    armature,
    world_coordinate,
    maximum_results=3,
):
    matrix_world = armature.matrix_world
    distances = []

    for bone in armature.data.bones:
        if not bone.use_deform:
            continue

        world_head = (
            matrix_world @ bone.head_local
        )

        world_tail = (
            matrix_world @ bone.tail_local
        )

        distance = distance_point_to_segment(
            world_coordinate,
            world_head,
            world_tail,
        )

        distances.append((
            distance,
            bone.name,
        ))

    distances.sort(
        key=lambda item: (
            item[0],
            item[1],
        )
    )

    return distances[:maximum_results]


source_blend_path = bpy.data.filepath

report_path = os.path.abspath(
    get_argument("--report")
)

expansion_distance = float(
    get_argument("--expansion-distance")
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

armature = bpy.data.objects.get(
    "R2_Rig"
)

if body is None or body.type != "MESH":
    raise RuntimeError(
        "O corpo R2_Body não foi encontrado."
    )

if cage is None or cage.type != "MESH":
    raise RuntimeError(
        "A gaiola R2_Deformation_Cage não foi encontrada."
    )

if armature is None or armature.type != "ARMATURE":
    raise RuntimeError(
        "O armature R2_Rig não foi encontrado."
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

original_cage_coordinates = [
    vertex.co.copy()
    for vertex in cage.data.vertices
]

apply_normal_expansion(
    cage,
    expansion_distance,
)

topology = get_topology_statistics(
    cage.data
)

topology_approved = (
    topology["boundary_edges"] == 0
    and topology["non_manifold_edges"] == 0
    and topology["loose_vertices"] == 0
    and topology["loose_edges"] == 0
    and topology["degenerate_faces"] == 0
    and topology["signed_volume"] > 0.0
)

if not topology_approved:
    raise RuntimeError(
        "A gaiola expandida perdeu a integridade topológica."
    )

cage_minimum, cage_maximum = (
    get_world_bounds_from_indices(
        cage,
        range(len(cage.data.vertices)),
    )
)

maximum_distance = max(
    (cage_maximum - cage_minimum).length
    * 4.0,
    10.0,
)

bvh = create_world_bvh(cage)

initial_directions = [
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

verification_directions = [
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

body_matrix_world = body.matrix_world

initial_outside_vertices = []
initial_ambiguous_vertices = []
initial_overflows = 0
initial_patterns = Counter()

for vertex in body.data.vertices:
    world_coordinate = (
        body_matrix_world @ vertex.co
    )

    result = classify_point(
        bvh,
        world_coordinate,
        initial_directions,
        maximum_distance,
    )

    pattern = (
        f"{result['inside_votes']}_"
        f"{result['outside_votes']}"
    )

    initial_patterns[pattern] += 1
    initial_overflows += result["overflow_count"]

    if result["outside_votes"] >= 2:
        initial_outside_vertices.append(
            vertex.index
        )

    if (
        result["inside_votes"] > 0
        and result["outside_votes"] > 0
    ):
        initial_ambiguous_vertices.append(
            vertex.index
        )

confirmed_outside_vertices = []
disputed_vertices = []
verification_patterns = Counter()
verification_overflows = 0

for vertex_index in initial_outside_vertices:
    world_coordinate = (
        body_matrix_world
        @ body.data.vertices[vertex_index].co
    )

    result = classify_point(
        bvh,
        world_coordinate,
        verification_directions,
        maximum_distance,
    )

    pattern = (
        f"{result['inside_votes']}_"
        f"{result['outside_votes']}"
    )

    verification_patterns[pattern] += 1
    verification_overflows += (
        result["overflow_count"]
    )

    if result["outside_votes"] >= 5:
        confirmed_outside_vertices.append(
            vertex_index
        )
    else:
        disputed_vertices.append(
            vertex_index
        )

body_adjacency = build_adjacency(
    body.data
)

(
    body_components,
    body_component_by_vertex,
) = find_connected_components(
    body_adjacency
)

confirmed_patches = find_subset_patches(
    body_adjacency,
    confirmed_outside_vertices,
)

outside_count_by_body_component = defaultdict(int)

for vertex_index in confirmed_outside_vertices:
    component_index = (
        body_component_by_vertex[vertex_index]
    )

    outside_count_by_body_component[
        component_index
    ] += 1

affected_body_components = sorted(
    outside_count_by_body_component.items(),
    key=lambda item: (
        -item[1],
        -len(body_components[item[0]]),
        item[0],
    ),
)

patch_details = []

for patch_position, patch in enumerate(
    confirmed_patches,
    start=1,
):
    minimum, maximum = (
        get_world_bounds_from_indices(
            body,
            patch,
        )
    )

    centroid = get_world_centroid(
        body,
        patch,
    )

    body_component_indices = Counter(
        body_component_by_vertex[
            vertex_index
        ]
        for vertex_index in patch
    )

    dominant_body_component = (
        body_component_indices.most_common(1)[0][0]
    )

    nearest_bones = get_nearest_bones(
        armature,
        centroid,
        maximum_results=3,
    )

    patch_details.append({
        "position": patch_position,
        "vertices": patch,
        "minimum": minimum,
        "maximum": maximum,
        "dimensions": maximum - minimum,
        "centroid": centroid,
        "body_component": (
            dominant_body_component
        ),
        "body_component_size": len(
            body_components[
                dominant_body_component
            ]
        ),
        "nearest_bones": nearest_bones,
    })

restore_coordinates(
    cage,
    original_cage_coordinates,
)

coverage_percentage = (
    (
        len(body.data.vertices)
        - len(confirmed_outside_vertices)
    )
    / len(body.data.vertices)
    * 100.0
)

outside_percentage = (
    len(confirmed_outside_vertices)
    / len(body.data.vertices)
    * 100.0
)

lines = [
    "R2_OUTSIDE_REGIONS_LOCALIZATION",
    f"source_blend={source_blend_path}",
    f"body={body.name}",
    f"cage={cage.name}",
    f"armature={armature.name}",
    (
        "expansion_distance="
        f"{expansion_distance:.6f}"
    ),
    f"body_vertices={len(body.data.vertices)}",
    f"body_edges={len(body.data.edges)}",
    f"body_polygons={len(body.data.polygons)}",
    f"body_components={len(body_components)}",
    f"cage_vertices={len(cage.data.vertices)}",
    f"cage_polygons={len(cage.data.polygons)}",
    (
        "topology_boundary_edges="
        f"{topology['boundary_edges']}"
    ),
    (
        "topology_non_manifold_edges="
        f"{topology['non_manifold_edges']}"
    ),
    (
        "topology_signed_volume="
        f"{topology['signed_volume']:.9f}"
    ),
    (
        "initial_directions="
        f"{len(initial_directions)}"
    ),
    (
        "initial_outside_vertices="
        f"{len(initial_outside_vertices)}"
    ),
    (
        "initial_ambiguous_vertices="
        f"{len(initial_ambiguous_vertices)}"
    ),
    (
        "initial_ray_overflows="
        f"{initial_overflows}"
    ),
    (
        "verification_directions="
        f"{len(verification_directions)}"
    ),
    (
        "confirmed_outside_vertices="
        f"{len(confirmed_outside_vertices)}"
    ),
    (
        "disputed_vertices="
        f"{len(disputed_vertices)}"
    ),
    (
        "verification_ray_overflows="
        f"{verification_overflows}"
    ),
    (
        "coverage_percentage="
        f"{coverage_percentage:.6f}"
    ),
    (
        "outside_percentage="
        f"{outside_percentage:.6f}"
    ),
    (
        "affected_body_components="
        f"{len(affected_body_components)}"
    ),
    (
        "outside_patches="
        f"{len(patch_details)}"
    ),
]

for pattern, count in sorted(
    initial_patterns.items()
):
    lines.append(
        f"initial_pattern_{pattern}={count}"
    )

for pattern, count in sorted(
    verification_patterns.items()
):
    lines.append(
        f"verification_pattern_{pattern}={count}"
    )

lines.extend([
    "",
    "AFFECTED_BODY_COMPONENTS",
])

if not affected_body_components:
    lines.append(
        "affected_body_components=NONE"
    )

for position, (
    component_index,
    outside_count,
) in enumerate(
    affected_body_components,
    start=1,
):
    component_vertices = (
        body_components[component_index]
    )

    minimum, maximum = (
        get_world_bounds_from_indices(
            body,
            component_vertices,
        )
    )

    centroid = get_world_centroid(
        body,
        component_vertices,
    )

    nearest_bones = get_nearest_bones(
        armature,
        centroid,
        maximum_results=3,
    )

    lines.extend([
        "",
        (
            f"affected_component_{position}_index="
            f"{component_index}"
        ),
        (
            f"affected_component_{position}_vertices="
            f"{len(component_vertices)}"
        ),
        (
            f"affected_component_{position}_outside_vertices="
            f"{outside_count}"
        ),
        (
            f"affected_component_{position}_outside_percentage="
            f"{outside_count / len(component_vertices) * 100.0:.6f}"
        ),
        (
            f"affected_component_{position}_minimum="
            + format_vector(minimum)
        ),
        (
            f"affected_component_{position}_maximum="
            + format_vector(maximum)
        ),
        (
            f"affected_component_{position}_dimensions="
            + format_vector(maximum - minimum)
        ),
        (
            f"affected_component_{position}_centroid="
            + format_vector(centroid)
        ),
        (
            f"affected_component_{position}_nearest_bones="
            + "|".join(
                (
                    f"{bone_name}:"
                    f"{distance:.6f}"
                )
                for distance, bone_name
                in nearest_bones
            )
        ),
    ])

lines.extend([
    "",
    "OUTSIDE_PATCHES",
])

if not patch_details:
    lines.append(
        "outside_patches=NONE"
    )

for patch in patch_details:
    position = patch["position"]
    vertex_indices_preview = (
        patch["vertices"][:20]
    )

    lines.extend([
        "",
        (
            f"patch_{position}_vertices="
            f"{len(patch['vertices'])}"
        ),
        (
            f"patch_{position}_body_component="
            f"{patch['body_component']}"
        ),
        (
            f"patch_{position}_body_component_size="
            f"{patch['body_component_size']}"
        ),
        (
            f"patch_{position}_minimum="
            + format_vector(
                patch["minimum"]
            )
        ),
        (
            f"patch_{position}_maximum="
            + format_vector(
                patch["maximum"]
            )
        ),
        (
            f"patch_{position}_dimensions="
            + format_vector(
                patch["dimensions"]
            )
        ),
        (
            f"patch_{position}_centroid="
            + format_vector(
                patch["centroid"]
            )
        ),
        (
            f"patch_{position}_nearest_bones="
            + "|".join(
                (
                    f"{bone_name}:"
                    f"{distance:.6f}"
                )
                for distance, bone_name
                in patch["nearest_bones"]
            )
        ),
        (
            f"patch_{position}_vertex_indices_preview="
            + ",".join(
                str(vertex_index)
                for vertex_index
                in vertex_indices_preview
            )
        ),
    ])

lines.extend([
    "",
    "blend_saved=false",
    "original_v18_unchanged=true",
    "status=outside_regions_localized_no_blend_saved",
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