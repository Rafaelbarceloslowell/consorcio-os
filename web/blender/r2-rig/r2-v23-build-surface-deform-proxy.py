import bpy
import bmesh
import math
import os
import sys
import traceback

from collections import deque
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree


REPORT_LINES = []


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


def select_only(obj):
    bpy.ops.object.select_all(
        action="DESELECT",
    )

    obj.select_set(True)

    bpy.context.view_layer.objects.active = obj


def count_components(mesh):
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

    visited = bytearray(
        len(mesh.vertices)
    )

    component_sizes = []

    for starting_vertex in range(
        len(mesh.vertices)
    ):
        if visited[starting_vertex]:
            continue

        queue = deque([starting_vertex])
        visited[starting_vertex] = 1
        component_size = 0

        while queue:
            vertex_index = queue.popleft()
            component_size += 1

            for neighbor in adjacency[
                vertex_index
            ]:
                if not visited[neighbor]:
                    visited[neighbor] = 1
                    queue.append(neighbor)

        component_sizes.append(
            component_size
        )

    component_sizes.sort(
        reverse=True,
    )

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
            if face.calc_area() <= 1.0e-12
        )

        signed_volume = bm.calc_volume(
            signed=True,
        )

        return {
            "boundary_edges": boundary_edges,
            "non_manifold_edges": (
                non_manifold_edges
            ),
            "loose_vertices": loose_vertices,
            "loose_edges": loose_edges,
            "degenerate_faces": (
                degenerate_faces
            ),
            "signed_volume": signed_volume,
        }

    finally:
        bm.free()


def prepare_surface_target(cage):
    mesh = cage.data

    vertices_before = len(mesh.vertices)
    edges_before = len(mesh.edges)
    polygons_before = len(mesh.polygons)

    bm = bmesh.new()

    try:
        bm.from_mesh(mesh)

        bmesh.ops.remove_doubles(
            bm,
            verts=list(bm.verts),
            dist=1.0e-8,
        )

        bmesh.ops.triangulate(
            bm,
            faces=list(bm.faces),
            quad_method="BEAUTY",
            ngon_method="BEAUTY",
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

    topology = get_topology_statistics(
        mesh
    )

    components = count_components(
        mesh
    )

    all_triangles = all(
        len(polygon.vertices) == 3
        for polygon in mesh.polygons
    )

    if len(components) != 1:
        raise RuntimeError(
            "A proxy não possui um único componente."
        )

    if topology["boundary_edges"] != 0:
        raise RuntimeError(
            "A proxy possui bordas abertas."
        )

    if topology["non_manifold_edges"] != 0:
        raise RuntimeError(
            "A proxy possui arestas não manifold."
        )

    if topology["loose_vertices"] != 0:
        raise RuntimeError(
            "A proxy possui vértices soltos."
        )

    if topology["loose_edges"] != 0:
        raise RuntimeError(
            "A proxy possui arestas soltas."
        )

    if topology["degenerate_faces"] != 0:
        raise RuntimeError(
            "A proxy possui faces degeneradas."
        )

    if topology["signed_volume"] <= 0.0:
        raise RuntimeError(
            "A proxy não possui volume positivo."
        )

    if not all_triangles:
        raise RuntimeError(
            "A triangulação da proxy não foi concluída."
        )

    return {
        "vertices_before": vertices_before,
        "edges_before": edges_before,
        "polygons_before": polygons_before,
        "vertices_after": len(mesh.vertices),
        "edges_after": len(mesh.edges),
        "polygons_after": len(mesh.polygons),
        "components": len(components),
        "topology": topology,
        "all_triangles": all_triangles,
    }


def barycentric_coordinates(
    point,
    first,
    second,
    third,
):
    edge_zero = second - first
    edge_one = third - first
    point_vector = point - first

    dot_00 = edge_zero.dot(edge_zero)
    dot_01 = edge_zero.dot(edge_one)
    dot_11 = edge_one.dot(edge_one)
    dot_20 = point_vector.dot(edge_zero)
    dot_21 = point_vector.dot(edge_one)

    denominator = (
        dot_00 * dot_11
        - dot_01 * dot_01
    )

    if abs(denominator) <= 1.0e-20:
        return 1.0, 0.0, 0.0

    second_weight = (
        dot_11 * dot_20
        - dot_01 * dot_21
    ) / denominator

    third_weight = (
        dot_00 * dot_21
        - dot_01 * dot_20
    ) / denominator

    first_weight = (
        1.0
        - second_weight
        - third_weight
    )

    weights = [
        max(0.0, first_weight),
        max(0.0, second_weight),
        max(0.0, third_weight),
    ]

    total = sum(weights)

    if total <= 1.0e-20:
        return 1.0, 0.0, 0.0

    return tuple(
        weight / total
        for weight in weights
    )


def transfer_weights_to_proxy(
    source,
    destination,
    maximum_influences=8,
):
    if len(source.vertex_groups) == 0:
        raise RuntimeError(
            "O corpo não possui grupos de vértices."
        )

    for group in list(
        destination.vertex_groups
    ):
        destination.vertex_groups.remove(
            group
        )

    source_group_names = [
        group.name
        for group in source.vertex_groups
    ]

    for group_name in source_group_names:
        destination.vertex_groups.new(
            name=group_name,
        )

    source_weights = []

    for vertex in source.data.vertices:
        source_weights.append({
            membership.group: membership.weight
            for membership in vertex.groups
            if membership.weight > 1.0e-8
        })

    source_mesh = source.data
    source_mesh.calc_loop_triangles()

    source_matrix_world = (
        source.matrix_world
    )

    source_world_vertices = [
        source_matrix_world @ vertex.co
        for vertex in source_mesh.vertices
    ]

    triangles = [
        tuple(loop_triangle.vertices)
        for loop_triangle
        in source_mesh.loop_triangles
    ]

    if not triangles:
        raise RuntimeError(
            "O corpo não possui triângulos utilizáveis."
        )

    source_bvh = BVHTree.FromPolygons(
        source_world_vertices,
        triangles,
        all_triangles=True,
    )

    destination_matrix_world = (
        destination.matrix_world
    )

    transferred_weights = []

    nearest_failures = 0
    fallback_vertices = 0
    maximum_nearest_distance = 0.0

    for vertex in destination.data.vertices:
        world_coordinate = (
            destination_matrix_world
            @ vertex.co
        )

        nearest = source_bvh.find_nearest(
            world_coordinate
        )

        if (
            nearest is None
            or nearest[0] is None
            or nearest[2] is None
        ):
            nearest_failures += 1
            transferred_weights.append({})
            continue

        nearest_location = nearest[0]
        triangle_index = nearest[2]
        nearest_distance = nearest[3]

        maximum_nearest_distance = max(
            maximum_nearest_distance,
            nearest_distance,
        )

        vertex_indices = triangles[
            triangle_index
        ]

        first_index = vertex_indices[0]
        second_index = vertex_indices[1]
        third_index = vertex_indices[2]

        barycentric = barycentric_coordinates(
            nearest_location,
            source_world_vertices[first_index],
            source_world_vertices[second_index],
            source_world_vertices[third_index],
        )

        accumulated = {}

        for source_index, factor in zip(
            vertex_indices,
            barycentric,
        ):
            for group_index, weight in (
                source_weights[
                    source_index
                ].items()
            ):
                accumulated[group_index] = (
                    accumulated.get(
                        group_index,
                        0.0,
                    )
                    + weight * factor
                )

        filtered = [
            (group_index, weight)
            for group_index, weight
            in accumulated.items()
            if weight > 1.0e-8
        ]

        filtered.sort(
            key=lambda item: item[1],
            reverse=True,
        )

        filtered = filtered[
            :maximum_influences
        ]

        total_weight = sum(
            weight
            for _, weight in filtered
        )

        if total_weight <= 1.0e-12:
            fallback_vertices += 1

            triangle_candidates = [
                (
                    (
                        source_world_vertices[
                            source_index
                        ]
                        - world_coordinate
                    ).length,
                    source_index,
                )
                for source_index
                in vertex_indices
            ]

            triangle_candidates.sort(
                key=lambda item: item[0],
            )

            fallback_source = (
                triangle_candidates[0][1]
            )

            fallback_weights = list(
                source_weights[
                    fallback_source
                ].items()
            )

            fallback_weights.sort(
                key=lambda item: item[1],
                reverse=True,
            )

            filtered = fallback_weights[
                :maximum_influences
            ]

            total_weight = sum(
                weight
                for _, weight in filtered
            )

        if total_weight <= 1.0e-12:
            transferred_weights.append({})
            continue

        transferred_weights.append({
            group_index: weight / total_weight
            for group_index, weight
            in filtered
        })

    if nearest_failures != 0:
        raise RuntimeError(
            "Falhou a transferência de pesos para "
            f"{nearest_failures} vértices da proxy."
        )

    bm = bmesh.new()

    try:
        bm.from_mesh(
            destination.data
        )

        bm.verts.ensure_lookup_table()

        deform_layer = (
            bm.verts.layers.deform.verify()
        )

        for vertex_index, weights in enumerate(
            transferred_weights
        ):
            deform_vertex = (
                bm.verts[
                    vertex_index
                ][deform_layer]
            )

            deform_vertex.clear()

            for group_index, weight in (
                weights.items()
            ):
                deform_vertex[
                    group_index
                ] = weight

        bm.to_mesh(
            destination.data
        )

    finally:
        bm.free()

    destination.data.update()

    unweighted_vertices = 0
    minimum_weight_sum = None
    maximum_weight_sum = 0.0
    maximum_vertex_influences = 0

    for vertex in destination.data.vertices:
        weight_sum = sum(
            membership.weight
            for membership in vertex.groups
        )

        influence_count = len(
            vertex.groups
        )

        maximum_vertex_influences = max(
            maximum_vertex_influences,
            influence_count,
        )

        if weight_sum <= 1.0e-8:
            unweighted_vertices += 1

        if minimum_weight_sum is None:
            minimum_weight_sum = weight_sum
        else:
            minimum_weight_sum = min(
                minimum_weight_sum,
                weight_sum,
            )

        maximum_weight_sum = max(
            maximum_weight_sum,
            weight_sum,
        )

    if unweighted_vertices != 0:
        raise RuntimeError(
            "A proxy terminou com "
            f"{unweighted_vertices} vértices sem peso."
        )

    return {
        "source_groups": len(
            source_group_names
        ),
        "destination_groups": len(
            destination.vertex_groups
        ),
        "unweighted_vertices": (
            unweighted_vertices
        ),
        "fallback_vertices": (
            fallback_vertices
        ),
        "minimum_weight_sum": (
            minimum_weight_sum
            if minimum_weight_sum is not None
            else 0.0
        ),
        "maximum_weight_sum": (
            maximum_weight_sum
        ),
        "maximum_vertex_influences": (
            maximum_vertex_influences
        ),
        "maximum_nearest_distance": (
            maximum_nearest_distance
        ),
    }


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
            for vertex
            in evaluated_mesh.vertices
        ]

    finally:
        evaluated_object.to_mesh_clear()

    return coordinates


def coordinates_are_finite(coordinates):
    return all(
        math.isfinite(coordinate.x)
        and math.isfinite(coordinate.y)
        and math.isfinite(coordinate.z)
        for coordinate in coordinates
    )


def compare_coordinates(
    first_coordinates,
    second_coordinates,
):
    if len(first_coordinates) != len(
        second_coordinates
    ):
        raise RuntimeError(
            "A contagem de vértices mudou durante o teste."
        )

    distances = [
        (
            second_coordinate
            - first_coordinate
        ).length
        for first_coordinate, second_coordinate
        in zip(
            first_coordinates,
            second_coordinates,
        )
    ]

    return {
        "maximum": max(distances),
        "average": (
            sum(distances)
            / len(distances)
        ),
        "moved_over_0_1mm": sum(
            1
            for distance in distances
            if distance > 0.0001
        ),
        "moved_over_1mm": sum(
            1
            for distance in distances
            if distance > 0.001
        ),
    }


def main():
    rig_blend_path = os.path.abspath(
        get_argument("--rig-blend")
    )

    cage_blend_path = os.path.abspath(
        get_argument("--cage-blend")
    )

    output_blend_path = os.path.abspath(
        get_argument("--output-blend")
    )

    report_path = os.path.abspath(
        get_argument("--report")
    )

    if os.path.exists(output_blend_path):
        raise RuntimeError(
            "O arquivo de saída já existe."
        )

    if os.path.exists(report_path):
        raise RuntimeError(
            "O relatório já existe."
        )

    body = bpy.data.objects.get(
        "R2_Body"
    )

    rig = bpy.data.objects.get(
        "R2_Rig"
    )

    if body is None or body.type != "MESH":
        raise RuntimeError(
            "O corpo R2_Body não foi encontrado no v13."
        )

    if rig is None or rig.type != "ARMATURE":
        raise RuntimeError(
            "O rig R2_Rig não foi encontrado no v13."
        )

    if len(body.data.vertices) != 197505:
        raise RuntimeError(
            "O corpo não possui os 197505 vértices esperados."
        )

    if len(body.vertex_groups) != 50:
        raise RuntimeError(
            "O corpo não possui os 50 grupos esperados."
        )

    source_group_names = {
        group.name
        for group in body.vertex_groups
    }

    deform_bone_names = {
        bone.name
        for bone in rig.data.bones
        if bone.use_deform
    }

    if source_group_names != deform_bone_names:
        missing_groups = sorted(
            deform_bone_names
            - source_group_names
        )

        extra_groups = sorted(
            source_group_names
            - deform_bone_names
        )

        raise RuntimeError(
            "Os grupos do corpo não correspondem aos "
            "ossos deformadores. "
            f"Faltando: {missing_groups}. "
            f"Extras: {extra_groups}."
        )

    body_world_matrix = (
        body.matrix_world.copy()
    )

    body_original_world_coordinates = [
        body_world_matrix @ vertex.co
        for vertex in body.data.vertices
    ]

    if bpy.data.objects.get(
        "R2_Deformation_Cage"
    ) is not None:
        raise RuntimeError(
            "O v13 já contém um objeto chamado "
            "R2_Deformation_Cage."
        )

    imported_objects = None

    with bpy.data.libraries.load(
        cage_blend_path,
        link=False,
    ) as (
        data_from,
        data_to,
    ):
        if (
            "R2_Deformation_Cage"
            not in data_from.objects
        ):
            raise RuntimeError(
                "A gaiola não foi encontrada no v18."
            )

        data_to.objects = [
            "R2_Deformation_Cage"
        ]

        imported_objects = data_to.objects

    if (
        not imported_objects
        or imported_objects[0] is None
    ):
        raise RuntimeError(
            "A importação da gaiola falhou."
        )

    cage = imported_objects[0]

    bpy.context.scene.collection.objects.link(
        cage
    )

    cage.name = "R2_Deformation_Proxy"
    cage.data.name = (
        "R2_Deformation_Proxy_Mesh"
    )

    if cage.type != "MESH":
        raise RuntimeError(
            "A proxy importada não é uma malha."
        )

    if len(cage.data.vertices) != 43226:
        raise RuntimeError(
            "A proxy não possui os 43226 vértices esperados."
        )

    cage.parent = None
    cage.matrix_world = (
        body.matrix_world.copy()
    )

    target_statistics = (
        prepare_surface_target(
            cage
        )
    )

    weight_statistics = (
        transfer_weights_to_proxy(
            body,
            cage,
            maximum_influences=8,
        )
    )

    for modifier in list(
        cage.modifiers
    ):
        cage.modifiers.remove(
            modifier
        )

    cage_armature = cage.modifiers.new(
        name="R2_Proxy_Armature",
        type="ARMATURE",
    )

    cage_armature.object = rig
    cage_armature.use_vertex_groups = True
    cage_armature.use_deform_preserve_volume = True

    removed_body_armatures = []

    for modifier in list(
        body.modifiers
    ):
        if modifier.type == "ARMATURE":
            removed_body_armatures.append(
                modifier.name
            )

            body.modifiers.remove(
                modifier
            )

    if not removed_body_armatures:
        raise RuntimeError(
            "O modificador Armature original do corpo "
            "não foi encontrado."
        )

    body_world_matrix = (
        body.matrix_world.copy()
    )

    body.parent = None
    body.matrix_world = body_world_matrix

    original_action = None

    if (
        rig.animation_data is not None
        and rig.animation_data.action is not None
    ):
        original_action = (
            rig.animation_data.action.name
        )

        rig.animation_data.action = None

    for pose_bone in rig.pose.bones:
        pose_bone.matrix_basis = (
            Matrix.Identity(4)
        )

    bpy.context.scene.frame_set(
        bpy.context.scene.frame_current
    )

    bpy.context.view_layer.update()

    surface_deform = body.modifiers.new(
        name="R2_Surface_Deform",
        type="SURFACE_DEFORM",
    )

    surface_deform.target = cage
    surface_deform.falloff = 4.0
    surface_deform.strength = 1.0

    select_only(body)

    bind_result = (
        bpy.ops.object.surfacedeform_bind(
            modifier=surface_deform.name,
        )
    )

    if "FINISHED" not in bind_result:
        raise RuntimeError(
            "O operador Surface Deform não terminou corretamente."
        )

    if not surface_deform.is_bound:
        raise RuntimeError(
            "O Surface Deform não ficou vinculado."
        )

    bpy.context.view_layer.update()

    bound_rest_coordinates = (
        evaluated_world_coordinates(
            body
        )
    )

    if not coordinates_are_finite(
        bound_rest_coordinates
    ):
        raise RuntimeError(
            "O corpo apresentou coordenadas inválidas após o bind."
        )

    rest_comparison = compare_coordinates(
        body_original_world_coordinates,
        bound_rest_coordinates,
    )

    if rest_comparison["maximum"] > 0.003:
        raise RuntimeError(
            "O bind alterou a posição neutra em mais de 3 mm. "
            f"Máximo: {rest_comparison['maximum']:.6f}"
        )

    tested_pose_bones = [
        bone_name
        for bone_name in (
            "upper_arm.R",
            "forearm.R",
        )
        if bone_name in rig.pose.bones
    ]

    if len(tested_pose_bones) != 2:
        raise RuntimeError(
            "Os ossos do braço direito usados no teste "
            "não foram encontrados."
        )

    original_pose_matrices = {
        bone_name: (
            rig.pose.bones[
                bone_name
            ].matrix_basis.copy()
        )
        for bone_name in tested_pose_bones
    }

    rig.pose.bones[
        "upper_arm.R"
    ].matrix_basis = (
        Matrix.Rotation(
            math.radians(12.0),
            4,
            "Z",
        )
        @ rig.pose.bones[
            "upper_arm.R"
        ].matrix_basis
    )

    rig.pose.bones[
        "forearm.R"
    ].matrix_basis = (
        Matrix.Rotation(
            math.radians(10.0),
            4,
            "X",
        )
        @ rig.pose.bones[
            "forearm.R"
        ].matrix_basis
    )

    bpy.context.view_layer.update()

    posed_coordinates = (
        evaluated_world_coordinates(
            body
        )
    )

    if not coordinates_are_finite(
        posed_coordinates
    ):
        raise RuntimeError(
            "O corpo apresentou coordenadas inválidas "
            "no teste de movimento."
        )

    pose_comparison = compare_coordinates(
        bound_rest_coordinates,
        posed_coordinates,
    )

    if pose_comparison["maximum"] < 0.002:
        raise RuntimeError(
            "O corpo não respondeu ao movimento do rig."
        )

    if pose_comparison["maximum"] > 0.750:
        raise RuntimeError(
            "O teste detectou deformação explosiva. "
            f"Deslocamento máximo: "
            f"{pose_comparison['maximum']:.6f}"
        )

    if pose_comparison[
        "moved_over_1mm"
    ] < 100:
        raise RuntimeError(
            "Poucos vértices responderam ao movimento do rig."
        )

    for bone_name, matrix_basis in (
        original_pose_matrices.items()
    ):
        rig.pose.bones[
            bone_name
        ].matrix_basis = (
            matrix_basis
        )

    bpy.context.view_layer.update()

    restored_coordinates = (
        evaluated_world_coordinates(
            body
        )
    )

    restored_comparison = compare_coordinates(
        bound_rest_coordinates,
        restored_coordinates,
    )

    if restored_comparison["maximum"] > 0.001:
        raise RuntimeError(
            "O corpo não retornou corretamente à posição neutra."
        )

    cage.display_type = "WIRE"
    cage.hide_render = True
    cage.hide_viewport = True

    bpy.context.scene[
        "r2_deformation_system"
    ] = "SURFACE_DEFORM_PROXY"

    bpy.context.scene[
        "r2_source_rig"
    ] = rig_blend_path

    bpy.context.scene[
        "r2_source_proxy"
    ] = cage_blend_path

    bpy.context.scene[
        "r2_surface_deform_bound"
    ] = True

    bpy.ops.wm.save_as_mainfile(
        filepath=output_blend_path,
    )

    if not os.path.exists(
        output_blend_path
    ):
        raise RuntimeError(
            "O arquivo v23 não foi criado."
        )

    REPORT_LINES.extend([
        "R2_SURFACE_DEFORM_PROXY_OK",
        f"rig_source={rig_blend_path}",
        f"proxy_source={cage_blend_path}",
        f"output_blend={output_blend_path}",
        f"body={body.name}",
        f"rig={rig.name}",
        f"proxy={cage.name}",
        (
            "body_vertices="
            f"{len(body.data.vertices)}"
        ),
        (
            "proxy_vertices_before="
            f"{target_statistics['vertices_before']}"
        ),
        (
            "proxy_vertices_after="
            f"{target_statistics['vertices_after']}"
        ),
        (
            "proxy_edges_after="
            f"{target_statistics['edges_after']}"
        ),
        (
            "proxy_polygons_after="
            f"{target_statistics['polygons_after']}"
        ),
        (
            "proxy_components="
            f"{target_statistics['components']}"
        ),
        (
            "proxy_boundary_edges="
            f"{target_statistics['topology']['boundary_edges']}"
        ),
        (
            "proxy_non_manifold_edges="
            f"{target_statistics['topology']['non_manifold_edges']}"
        ),
        (
            "proxy_degenerate_faces="
            f"{target_statistics['topology']['degenerate_faces']}"
        ),
        (
            "proxy_all_triangles="
            f"{str(target_statistics['all_triangles']).lower()}"
        ),
        (
            "proxy_signed_volume="
            f"{target_statistics['topology']['signed_volume']:.9f}"
        ),
        (
            "source_weight_groups="
            f"{weight_statistics['source_groups']}"
        ),
        (
            "proxy_weight_groups="
            f"{weight_statistics['destination_groups']}"
        ),
        (
            "proxy_unweighted_vertices="
            f"{weight_statistics['unweighted_vertices']}"
        ),
        (
            "proxy_weight_fallback_vertices="
            f"{weight_statistics['fallback_vertices']}"
        ),
        (
            "proxy_minimum_weight_sum="
            f"{weight_statistics['minimum_weight_sum']:.6f}"
        ),
        (
            "proxy_maximum_weight_sum="
            f"{weight_statistics['maximum_weight_sum']:.6f}"
        ),
        (
            "proxy_maximum_vertex_influences="
            f"{weight_statistics['maximum_vertex_influences']}"
        ),
        (
            "weight_transfer_maximum_distance="
            f"{weight_statistics['maximum_nearest_distance']:.6f}"
        ),
        (
            "removed_body_armature_modifiers="
            + "|".join(
                removed_body_armatures
            )
        ),
        (
            "original_action_detached="
            + (
                original_action
                if original_action is not None
                else "NONE"
            )
        ),
        (
            "surface_deform_modifier="
            f"{surface_deform.name}"
        ),
        (
            "surface_deform_bound="
            f"{str(surface_deform.is_bound).lower()}"
        ),
        (
            "rest_maximum_error="
            f"{rest_comparison['maximum']:.9f}"
        ),
        (
            "rest_average_error="
            f"{rest_comparison['average']:.9f}"
        ),
        (
            "pose_test_maximum_displacement="
            f"{pose_comparison['maximum']:.6f}"
        ),
        (
            "pose_test_average_displacement="
            f"{pose_comparison['average']:.6f}"
        ),
        (
            "pose_test_vertices_over_1mm="
            f"{pose_comparison['moved_over_1mm']}"
        ),
        (
            "restored_maximum_error="
            f"{restored_comparison['maximum']:.9f}"
        ),
        "proxy_hidden_in_viewport=true",
        "proxy_hidden_in_render=true",
        "source_v13_unchanged=true",
        "source_v18_unchanged=true",
        "status=surface_deform_proxy_ready",
    ])

    with open(
        report_path,
        "x",
        encoding="utf-8",
    ) as report_file:
        report_file.write(
            "\n".join(REPORT_LINES)
            + "\n"
        )

    print(
        "\n".join(REPORT_LINES)
    )


report_path_for_failure = os.path.abspath(
    get_argument("--report")
)

try:
    main()

except Exception as error:
    failure_lines = [
        "R2_SURFACE_DEFORM_PROXY_FAILED",
        f"error_type={type(error).__name__}",
        f"error_message={str(error)}",
        "output_saved=false",
        "source_v13_unchanged=true",
        "source_v18_unchanged=true",
        "status=surface_deform_proxy_failed",
        "",
        "TRACEBACK",
        traceback.format_exc(),
    ]

    if not os.path.exists(
        report_path_for_failure
    ):
        with open(
            report_path_for_failure,
            "x",
            encoding="utf-8",
        ) as report_file:
            report_file.write(
                "\n".join(failure_lines)
                + "\n"
            )

    print(
        "\n".join(failure_lines)
    )

    raise