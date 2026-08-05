import bpy
import math
import os
import sys

from collections import Counter, deque
from mathutils import Matrix, Vector


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


def format_vector(vector):
    return ",".join(
        f"{float(value):.6f}"
        for value in vector
    )


def percentile(values, fraction):
    if not values:
        return 0.0

    ordered = sorted(values)

    if len(ordered) == 1:
        return ordered[0]

    position = (
        len(ordered) - 1
    ) * fraction

    lower_index = int(
        math.floor(position)
    )

    upper_index = int(
        math.ceil(position)
    )

    if lower_index == upper_index:
        return ordered[lower_index]

    interpolation = (
        position - lower_index
    )

    return (
        ordered[lower_index]
        * (1.0 - interpolation)
        + ordered[upper_index]
        * interpolation
    )


def average(values):
    if not values:
        return 0.0

    return sum(values) / len(values)


def triangle_area(
    first,
    second,
    third,
):
    return (
        (second - first).cross(
            third - first
        ).length
        * 0.5
    )


def evaluated_world_coordinates(obj):
    depsgraph = (
        bpy.context.evaluated_depsgraph_get()
    )

    evaluated_object = obj.evaluated_get(
        depsgraph
    )

    evaluated_mesh = (
        evaluated_object.to_mesh()
    )

    try:
        matrix_world = (
            evaluated_object.matrix_world
        )

        coordinates = [
            matrix_world @ vertex.co
            for vertex in evaluated_mesh.vertices
        ]

    finally:
        evaluated_object.to_mesh_clear()

    return coordinates


def build_components(mesh):
    adjacency = [
        []
        for _ in range(len(mesh.vertices))
    ]

    for edge in mesh.edges:
        first_vertex, second_vertex = (
            edge.vertices
        )

        adjacency[first_vertex].append(
            second_vertex
        )

        adjacency[second_vertex].append(
            first_vertex
        )

    visited = bytearray(
        len(mesh.vertices)
    )

    component_by_vertex = [
        -1
        for _ in mesh.vertices
    ]

    components = []

    for starting_vertex in range(
        len(mesh.vertices)
    ):
        if visited[starting_vertex]:
            continue

        component_index = len(
            components
        )

        queue = deque([
            starting_vertex
        ])

        visited[starting_vertex] = 1
        component_vertices = []

        while queue:
            vertex_index = queue.popleft()

            component_by_vertex[
                vertex_index
            ] = component_index

            component_vertices.append(
                vertex_index
            )

            for neighbor in adjacency[
                vertex_index
            ]:
                if not visited[neighbor]:
                    visited[neighbor] = 1
                    queue.append(neighbor)

        components.append(
            component_vertices
        )

    return (
        components,
        component_by_vertex,
    )


def get_bounds(
    coordinates,
    vertex_indices,
):
    first_coordinate = coordinates[
        vertex_indices[0]
    ]

    minimum = first_coordinate.copy()
    maximum = first_coordinate.copy()

    for vertex_index in vertex_indices[1:]:
        coordinate = coordinates[
            vertex_index
        ]

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


def get_centroid(
    coordinates,
    vertex_indices,
):
    total = Vector((
        0.0,
        0.0,
        0.0,
    ))

    for vertex_index in vertex_indices:
        total += coordinates[
            vertex_index
        ]

    return total / len(
        vertex_indices
    )


def reset_pose(rig):
    if (
        rig.animation_data is not None
        and rig.animation_data.action is not None
    ):
        rig.animation_data.action = None

    for pose_bone in rig.pose.bones:
        pose_bone.matrix_basis = (
            Matrix.Identity(4)
        )

    bpy.context.view_layer.update()


def apply_validation_pose(rig):
    required_bones = [
        "clavicle.L",
        "upper_arm.L",
        "forearm.L",
        "hand.L",
        "clavicle.R",
        "upper_arm.R",
        "forearm.R",
        "hand.R",
        "chest",
        "neck",
        "head",
    ]

    missing_bones = [
        bone_name
        for bone_name in required_bones
        if bone_name not in rig.pose.bones
    ]

    if missing_bones:
        raise RuntimeError(
            "Ossos ausentes: "
            + ", ".join(missing_bones)
        )

    rig.pose.bones[
        "clavicle.L"
    ].matrix_basis = (
        Matrix.Rotation(
            math.radians(-8.0),
            4,
            "Y",
        )
        @ rig.pose.bones[
            "clavicle.L"
        ].matrix_basis
    )

    rig.pose.bones[
        "upper_arm.L"
    ].matrix_basis = (
        Matrix.Rotation(
            math.radians(-58.0),
            4,
            "Z",
        )
        @ Matrix.Rotation(
            math.radians(-18.0),
            4,
            "Y",
        )
        @ rig.pose.bones[
            "upper_arm.L"
        ].matrix_basis
    )

    rig.pose.bones[
        "forearm.L"
    ].matrix_basis = (
        Matrix.Rotation(
            math.radians(32.0),
            4,
            "X",
        )
        @ rig.pose.bones[
            "forearm.L"
        ].matrix_basis
    )

    rig.pose.bones[
        "hand.L"
    ].matrix_basis = (
        Matrix.Rotation(
            math.radians(-10.0),
            4,
            "Z",
        )
        @ rig.pose.bones[
            "hand.L"
        ].matrix_basis
    )

    rig.pose.bones[
        "clavicle.R"
    ].matrix_basis = (
        Matrix.Rotation(
            math.radians(8.0),
            4,
            "Y",
        )
        @ rig.pose.bones[
            "clavicle.R"
        ].matrix_basis
    )

    rig.pose.bones[
        "upper_arm.R"
    ].matrix_basis = (
        Matrix.Rotation(
            math.radians(58.0),
            4,
            "Z",
        )
        @ Matrix.Rotation(
            math.radians(18.0),
            4,
            "Y",
        )
        @ rig.pose.bones[
            "upper_arm.R"
        ].matrix_basis
    )

    rig.pose.bones[
        "forearm.R"
    ].matrix_basis = (
        Matrix.Rotation(
            math.radians(32.0),
            4,
            "X",
        )
        @ rig.pose.bones[
            "forearm.R"
        ].matrix_basis
    )

    rig.pose.bones[
        "hand.R"
    ].matrix_basis = (
        Matrix.Rotation(
            math.radians(10.0),
            4,
            "Z",
        )
        @ rig.pose.bones[
            "hand.R"
        ].matrix_basis
    )

    rig.pose.bones[
        "chest"
    ].matrix_basis = (
        Matrix.Rotation(
            math.radians(4.0),
            4,
            "Y",
        )
        @ rig.pose.bones[
            "chest"
        ].matrix_basis
    )

    rig.pose.bones[
        "neck"
    ].matrix_basis = (
        Matrix.Rotation(
            math.radians(-3.0),
            4,
            "Y",
        )
        @ rig.pose.bones[
            "neck"
        ].matrix_basis
    )

    rig.pose.bones[
        "head"
    ].matrix_basis = (
        Matrix.Rotation(
            math.radians(-6.0),
            4,
            "Y",
        )
        @ rig.pose.bones[
            "head"
        ].matrix_basis
    )

    bpy.context.view_layer.update()


report_path = os.path.abspath(
    get_argument("--report")
)

if os.path.exists(report_path):
    raise RuntimeError(
        f"O relatório já existe: {report_path}"
    )

source_blend_path = (
    bpy.data.filepath
)

body = bpy.data.objects.get(
    "R2_Body"
)

rig = bpy.data.objects.get(
    "R2_Rig"
)

if body is None or body.type != "MESH":
    raise RuntimeError(
        "O corpo R2_Body não foi encontrado."
    )

if rig is None or rig.type != "ARMATURE":
    raise RuntimeError(
        "O rig R2_Rig não foi encontrado."
    )

if len(body.data.vertices) != 197505:
    raise RuntimeError(
        "O corpo não possui os 197505 vértices esperados."
    )

armature_modifiers = [
    modifier
    for modifier in body.modifiers
    if modifier.type == "ARMATURE"
]

if len(armature_modifiers) != 1:
    raise RuntimeError(
        "O corpo não possui exatamente um modificador Armature."
    )

if armature_modifiers[0].object != rig:
    raise RuntimeError(
        "O modificador Armature não aponta para R2_Rig."
    )

if len(body.vertex_groups) != 50:
    raise RuntimeError(
        "O corpo não possui os 50 grupos de pesos esperados."
    )

mesh = body.data

mesh.calc_loop_triangles()

(
    components,
    component_by_vertex,
) = build_components(mesh)

if len(components) != 110:
    raise RuntimeError(
        "A quantidade de componentes mudou. "
        f"Esperado: 110. Encontrado: {len(components)}"
    )

reset_pose(rig)

neutral_coordinates = (
    evaluated_world_coordinates(body)
)

if len(neutral_coordinates) != len(
    mesh.vertices
):
    raise RuntimeError(
        "A contagem de vértices neutros está incorreta."
    )

apply_validation_pose(rig)

posed_coordinates = (
    evaluated_world_coordinates(body)
)

if len(posed_coordinates) != len(
    mesh.vertices
):
    raise RuntimeError(
        "A contagem de vértices posados está incorreta."
    )

component_edge_ratios = [
    []
    for _ in components
]

component_face_ratios = [
    []
    for _ in components
]

component_displacements = [
    []
    for _ in components
]

all_edge_ratios = []
all_face_ratios = []
all_displacements = []

zero_length_edges = 0
zero_area_faces = 0

for vertex_index in range(
    len(mesh.vertices)
):
    displacement = (
        posed_coordinates[vertex_index]
        - neutral_coordinates[vertex_index]
    ).length

    component_index = (
        component_by_vertex[
            vertex_index
        ]
    )

    component_displacements[
        component_index
    ].append(displacement)

    all_displacements.append(
        displacement
    )

for edge in mesh.edges:
    first_index, second_index = (
        edge.vertices
    )

    neutral_length = (
        neutral_coordinates[first_index]
        - neutral_coordinates[second_index]
    ).length

    if neutral_length <= 1.0e-12:
        zero_length_edges += 1
        continue

    posed_length = (
        posed_coordinates[first_index]
        - posed_coordinates[second_index]
    ).length

    ratio = (
        posed_length
        / neutral_length
    )

    component_index = (
        component_by_vertex[
            first_index
        ]
    )

    component_edge_ratios[
        component_index
    ].append(ratio)

    all_edge_ratios.append(
        ratio
    )

for triangle in mesh.loop_triangles:
    first_index, second_index, third_index = (
        triangle.vertices
    )

    neutral_area = triangle_area(
        neutral_coordinates[first_index],
        neutral_coordinates[second_index],
        neutral_coordinates[third_index],
    )

    if neutral_area <= 1.0e-14:
        zero_area_faces += 1
        continue

    posed_area = triangle_area(
        posed_coordinates[first_index],
        posed_coordinates[second_index],
        posed_coordinates[third_index],
    )

    ratio = (
        posed_area
        / neutral_area
    )

    component_index = (
        component_by_vertex[
            first_index
        ]
    )

    component_face_ratios[
        component_index
    ].append(ratio)

    all_face_ratios.append(
        ratio
    )

group_names = {
    group.index: group.name
    for group in body.vertex_groups
}

component_results = []

for component_index, vertex_indices in enumerate(
    components
):
    edge_ratios = component_edge_ratios[
        component_index
    ]

    face_ratios = component_face_ratios[
        component_index
    ]

    displacements = component_displacements[
        component_index
    ]

    neutral_minimum, neutral_maximum = (
        get_bounds(
            neutral_coordinates,
            vertex_indices,
        )
    )

    posed_minimum, posed_maximum = (
        get_bounds(
            posed_coordinates,
            vertex_indices,
        )
    )

    centroid = get_centroid(
        neutral_coordinates,
        vertex_indices,
    )

    weight_sums = Counter()
    total_weight = 0.0

    for vertex_index in vertex_indices:
        for membership in mesh.vertices[
            vertex_index
        ].groups:
            group_name = group_names.get(
                membership.group,
                f"GROUP_{membership.group}",
            )

            weight_sums[
                group_name
            ] += membership.weight

            total_weight += (
                membership.weight
            )

    dominant_groups = (
        weight_sums.most_common(6)
    )

    edge_p01 = percentile(
        edge_ratios,
        0.01,
    )

    edge_p50 = percentile(
        edge_ratios,
        0.50,
    )

    edge_p95 = percentile(
        edge_ratios,
        0.95,
    )

    edge_p99 = percentile(
        edge_ratios,
        0.99,
    )

    face_p01 = percentile(
        face_ratios,
        0.01,
    )

    face_p50 = percentile(
        face_ratios,
        0.50,
    )

    face_p95 = percentile(
        face_ratios,
        0.95,
    )

    face_p99 = percentile(
        face_ratios,
        0.99,
    )

    compression_factor = (
        1.0 / max(
            edge_p01,
            1.0e-9,
        )
    )

    face_compression_factor = (
        1.0 / math.sqrt(
            max(
                face_p01,
                1.0e-12,
            )
        )
    )

    face_stretch_factor = math.sqrt(
        max(
            face_p99,
            0.0,
        )
    )

    stress_score = max(
        edge_p99,
        compression_factor,
        face_stretch_factor,
        face_compression_factor,
    )

    if neutral_maximum.x < 0.0:
        side = "RIGHT"
    elif neutral_minimum.x > 0.0:
        side = "LEFT"
    else:
        side = "CENTER"

    component_results.append({
        "index": component_index,
        "vertices": len(vertex_indices),
        "edges": len(edge_ratios),
        "triangles": len(face_ratios),
        "side": side,
        "centroid": centroid,
        "neutral_minimum": neutral_minimum,
        "neutral_maximum": neutral_maximum,
        "neutral_dimensions": (
            neutral_maximum
            - neutral_minimum
        ),
        "posed_dimensions": (
            posed_maximum
            - posed_minimum
        ),
        "displacement_average": (
            average(displacements)
        ),
        "displacement_p95": percentile(
            displacements,
            0.95,
        ),
        "displacement_maximum": (
            max(displacements)
            if displacements
            else 0.0
        ),
        "edge_minimum": (
            min(edge_ratios)
            if edge_ratios
            else 0.0
        ),
        "edge_p01": edge_p01,
        "edge_p50": edge_p50,
        "edge_p95": edge_p95,
        "edge_p99": edge_p99,
        "edge_maximum": (
            max(edge_ratios)
            if edge_ratios
            else 0.0
        ),
        "edges_over_1_5": sum(
            1
            for ratio in edge_ratios
            if ratio > 1.5
        ),
        "edges_over_2": sum(
            1
            for ratio in edge_ratios
            if ratio > 2.0
        ),
        "edges_under_0_67": sum(
            1
            for ratio in edge_ratios
            if ratio < 0.67
        ),
        "edges_under_0_5": sum(
            1
            for ratio in edge_ratios
            if ratio < 0.5
        ),
        "face_minimum": (
            min(face_ratios)
            if face_ratios
            else 0.0
        ),
        "face_p01": face_p01,
        "face_p50": face_p50,
        "face_p95": face_p95,
        "face_p99": face_p99,
        "face_maximum": (
            max(face_ratios)
            if face_ratios
            else 0.0
        ),
        "faces_over_2": sum(
            1
            for ratio in face_ratios
            if ratio > 2.0
        ),
        "faces_over_4": sum(
            1
            for ratio in face_ratios
            if ratio > 4.0
        ),
        "faces_under_0_5": sum(
            1
            for ratio in face_ratios
            if ratio < 0.5
        ),
        "faces_under_0_25": sum(
            1
            for ratio in face_ratios
            if ratio < 0.25
        ),
        "dominant_groups": dominant_groups,
        "total_weight": total_weight,
        "stress_score": stress_score,
    })

component_results.sort(
    key=lambda result: (
        -result["stress_score"],
        -result["vertices"],
        result["index"],
    )
)

overall_edge_p01 = percentile(
    all_edge_ratios,
    0.01,
)

overall_edge_p99 = percentile(
    all_edge_ratios,
    0.99,
)

overall_face_p01 = percentile(
    all_face_ratios,
    0.01,
)

overall_face_p99 = percentile(
    all_face_ratios,
    0.99,
)

critical_components = [
    result
    for result in component_results
    if (
        result["edges_over_2"] > 0
        or result["edges_under_0_5"] > 0
        or result["faces_over_4"] > 0
        or result["faces_under_0_25"] > 0
    )
]

lines = [
    "R2_DIRECT_ARMATURE_FORENSIC_AUDIT",
    f"source_blend={source_blend_path}",
    f"body={body.name}",
    f"rig={rig.name}",
    (
        "armature_modifier="
        f"{armature_modifiers[0].name}"
    ),
    f"vertices={len(mesh.vertices)}",
    f"edges={len(mesh.edges)}",
    f"polygons={len(mesh.polygons)}",
    (
        "loop_triangles="
        f"{len(mesh.loop_triangles)}"
    ),
    f"components={len(components)}",
    f"weight_groups={len(body.vertex_groups)}",
    f"zero_length_edges={zero_length_edges}",
    f"zero_area_faces={zero_area_faces}",
    (
        "overall_displacement_average="
        f"{average(all_displacements):.6f}"
    ),
    (
        "overall_displacement_p95="
        f"{percentile(all_displacements, 0.95):.6f}"
    ),
    (
        "overall_displacement_maximum="
        f"{max(all_displacements):.6f}"
    ),
    (
        "overall_edge_ratio_minimum="
        f"{min(all_edge_ratios):.6f}"
    ),
    (
        "overall_edge_ratio_p01="
        f"{overall_edge_p01:.6f}"
    ),
    (
        "overall_edge_ratio_p99="
        f"{overall_edge_p99:.6f}"
    ),
    (
        "overall_edge_ratio_maximum="
        f"{max(all_edge_ratios):.6f}"
    ),
    (
        "overall_face_ratio_minimum="
        f"{min(all_face_ratios):.6f}"
    ),
    (
        "overall_face_ratio_p01="
        f"{overall_face_p01:.6f}"
    ),
    (
        "overall_face_ratio_p99="
        f"{overall_face_p99:.6f}"
    ),
    (
        "overall_face_ratio_maximum="
        f"{max(all_face_ratios):.6f}"
    ),
    (
        "critical_components="
        f"{len(critical_components)}"
    ),
    "",
    "TOP_PROBLEM_COMPONENTS",
]

for position, result in enumerate(
    component_results[:40],
    start=1,
):
    dominant_groups_text = "|".join(
        (
            f"{group_name}:"
            f"{weight_sum:.6f}"
        )
        for group_name, weight_sum
        in result["dominant_groups"]
    )

    lines.extend([
        "",
        (
            f"problem_{position}_component="
            f"{result['index']}"
        ),
        (
            f"problem_{position}_stress_score="
            f"{result['stress_score']:.6f}"
        ),
        (
            f"problem_{position}_side="
            f"{result['side']}"
        ),
        (
            f"problem_{position}_vertices="
            f"{result['vertices']}"
        ),
        (
            f"problem_{position}_edges="
            f"{result['edges']}"
        ),
        (
            f"problem_{position}_triangles="
            f"{result['triangles']}"
        ),
        (
            f"problem_{position}_centroid="
            + format_vector(
                result["centroid"]
            )
        ),
        (
            f"problem_{position}_neutral_minimum="
            + format_vector(
                result["neutral_minimum"]
            )
        ),
        (
            f"problem_{position}_neutral_maximum="
            + format_vector(
                result["neutral_maximum"]
            )
        ),
        (
            f"problem_{position}_neutral_dimensions="
            + format_vector(
                result["neutral_dimensions"]
            )
        ),
        (
            f"problem_{position}_posed_dimensions="
            + format_vector(
                result["posed_dimensions"]
            )
        ),
        (
            f"problem_{position}_displacement_average="
            f"{result['displacement_average']:.6f}"
        ),
        (
            f"problem_{position}_displacement_p95="
            f"{result['displacement_p95']:.6f}"
        ),
        (
            f"problem_{position}_displacement_maximum="
            f"{result['displacement_maximum']:.6f}"
        ),
        (
            f"problem_{position}_edge_ratio_minimum="
            f"{result['edge_minimum']:.6f}"
        ),
        (
            f"problem_{position}_edge_ratio_p01="
            f"{result['edge_p01']:.6f}"
        ),
        (
            f"problem_{position}_edge_ratio_p50="
            f"{result['edge_p50']:.6f}"
        ),
        (
            f"problem_{position}_edge_ratio_p95="
            f"{result['edge_p95']:.6f}"
        ),
        (
            f"problem_{position}_edge_ratio_p99="
            f"{result['edge_p99']:.6f}"
        ),
        (
            f"problem_{position}_edge_ratio_maximum="
            f"{result['edge_maximum']:.6f}"
        ),
        (
            f"problem_{position}_edges_over_1_5="
            f"{result['edges_over_1_5']}"
        ),
        (
            f"problem_{position}_edges_over_2="
            f"{result['edges_over_2']}"
        ),
        (
            f"problem_{position}_edges_under_0_67="
            f"{result['edges_under_0_67']}"
        ),
        (
            f"problem_{position}_edges_under_0_5="
            f"{result['edges_under_0_5']}"
        ),
        (
            f"problem_{position}_face_ratio_minimum="
            f"{result['face_minimum']:.6f}"
        ),
        (
            f"problem_{position}_face_ratio_p01="
            f"{result['face_p01']:.6f}"
        ),
        (
            f"problem_{position}_face_ratio_p50="
            f"{result['face_p50']:.6f}"
        ),
        (
            f"problem_{position}_face_ratio_p95="
            f"{result['face_p95']:.6f}"
        ),
        (
            f"problem_{position}_face_ratio_p99="
            f"{result['face_p99']:.6f}"
        ),
        (
            f"problem_{position}_face_ratio_maximum="
            f"{result['face_maximum']:.6f}"
        ),
        (
            f"problem_{position}_faces_over_2="
            f"{result['faces_over_2']}"
        ),
        (
            f"problem_{position}_faces_over_4="
            f"{result['faces_over_4']}"
        ),
        (
            f"problem_{position}_faces_under_0_5="
            f"{result['faces_under_0_5']}"
        ),
        (
            f"problem_{position}_faces_under_0_25="
            f"{result['faces_under_0_25']}"
        ),
        (
            f"problem_{position}_dominant_groups="
            f"{dominant_groups_text}"
        ),
    ])

lines.extend([
    "",
    "blend_saved=false",
    "source_v13_unchanged=true",
    "status=direct_armature_problem_components_mapped",
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

reset_pose(rig)