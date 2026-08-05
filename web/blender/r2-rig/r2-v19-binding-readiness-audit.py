import bpy
import os
import sys


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


def get_world_bounds(obj):
    if obj.type != "MESH" or not obj.bound_box:
        return None

    world_corners = [
        obj.matrix_world @ corner
        for corner in map(
            lambda coordinate: __import__("mathutils").Vector(coordinate),
            obj.bound_box,
        )
    ]

    minimum = (
        min(corner.x for corner in world_corners),
        min(corner.y for corner in world_corners),
        min(corner.z for corner in world_corners),
    )

    maximum = (
        max(corner.x for corner in world_corners),
        max(corner.y for corner in world_corners),
        max(corner.z for corner in world_corners),
    )

    return minimum, maximum


def inspect_blend(filepath, label):
    bpy.ops.wm.open_mainfile(
        filepath=filepath,
        load_ui=False,
    )

    lines = [
        f"===== {label} =====",
        f"filepath={bpy.data.filepath}",
        f"scene={bpy.context.scene.name}",
        f"objects={len(bpy.data.objects)}",
        f"mesh_objects={sum(1 for obj in bpy.data.objects if obj.type == 'MESH')}",
        f"armature_objects={sum(1 for obj in bpy.data.objects if obj.type == 'ARMATURE')}",
        "",
        "OBJECT_INDEX",
    ]

    sorted_objects = sorted(
        bpy.data.objects,
        key=lambda obj: (
            obj.type,
            obj.name.lower(),
        ),
    )

    for obj in sorted_objects:
        parent_name = (
            obj.parent.name
            if obj.parent
            else "NONE"
        )

        lines.extend([
            (
                f"object="
                f"{obj.name}"
                f"|type={obj.type}"
                f"|parent={parent_name}"
                f"|location={format_vector(obj.location)}"
                f"|rotation={format_vector(obj.rotation_euler)}"
                f"|scale={format_vector(obj.scale)}"
                f"|dimensions={format_vector(obj.dimensions)}"
                f"|hide_viewport={obj.hide_viewport}"
                f"|hide_render={obj.hide_render}"
            )
        ])

    mesh_objects = sorted(
        [
            obj
            for obj in bpy.data.objects
            if obj.type == "MESH"
        ],
        key=lambda obj: len(obj.data.vertices),
        reverse=True,
    )

    lines.extend([
        "",
        "MESH_DETAILS",
    ])

    for position, obj in enumerate(mesh_objects, start=1):
        bounds = get_world_bounds(obj)

        if bounds:
            minimum, maximum = bounds
            world_minimum = format_vector(minimum)
            world_maximum = format_vector(maximum)
        else:
            world_minimum = "NONE"
            world_maximum = "NONE"

        lines.extend([
            "",
            f"mesh_{position}_name={obj.name}",
            f"mesh_{position}_data={obj.data.name}",
            f"mesh_{position}_vertices={len(obj.data.vertices)}",
            f"mesh_{position}_edges={len(obj.data.edges)}",
            f"mesh_{position}_polygons={len(obj.data.polygons)}",
            f"mesh_{position}_materials={len(obj.data.materials)}",
            f"mesh_{position}_vertex_groups={len(obj.vertex_groups)}",
            f"mesh_{position}_shape_keys={0 if obj.data.shape_keys is None else len(obj.data.shape_keys.key_blocks)}",
            f"mesh_{position}_world_minimum={world_minimum}",
            f"mesh_{position}_world_maximum={world_maximum}",
            f"mesh_{position}_matrix_world=",
        ])

        for row in obj.matrix_world:
            lines.append(
                "  " + format_vector(row)
            )

        if obj.vertex_groups:
            lines.append(
                f"mesh_{position}_vertex_group_names="
                + "|".join(
                    group.name
                    for group in obj.vertex_groups
                )
            )
        else:
            lines.append(
                f"mesh_{position}_vertex_group_names=NONE"
            )

        if obj.modifiers:
            lines.append(
                f"mesh_{position}_modifiers={len(obj.modifiers)}"
            )

            for modifier_position, modifier in enumerate(
                obj.modifiers,
                start=1,
            ):
                modifier_object = getattr(
                    modifier,
                    "object",
                    None,
                )

                modifier_target = getattr(
                    modifier,
                    "target",
                    None,
                )

                referenced_object = (
                    modifier_object
                    if modifier_object is not None
                    else modifier_target
                )

                referenced_name = (
                    referenced_object.name
                    if referenced_object is not None
                    else "NONE"
                )

                lines.append(
                    (
                        f"mesh_{position}_modifier_{modifier_position}="
                        f"{modifier.name}"
                        f"|type={modifier.type}"
                        f"|object={referenced_name}"
                        f"|show_viewport={modifier.show_viewport}"
                        f"|show_render={modifier.show_render}"
                    )
                )
        else:
            lines.append(
                f"mesh_{position}_modifiers=0"
            )

    armatures = sorted(
        [
            obj
            for obj in bpy.data.objects
            if obj.type == "ARMATURE"
        ],
        key=lambda obj: obj.name.lower(),
    )

    lines.extend([
        "",
        "ARMATURE_DETAILS",
    ])

    if not armatures:
        lines.append(
            "armatures=NONE"
        )

    for position, armature in enumerate(
        armatures,
        start=1,
    ):
        bones = list(armature.data.bones)

        deform_bones = [
            bone
            for bone in bones
            if bone.use_deform
        ]

        lines.extend([
            "",
            f"armature_{position}_name={armature.name}",
            f"armature_{position}_data={armature.data.name}",
            f"armature_{position}_bones={len(bones)}",
            f"armature_{position}_deform_bones={len(deform_bones)}",
            f"armature_{position}_parent={armature.parent.name if armature.parent else 'NONE'}",
            f"armature_{position}_location={format_vector(armature.location)}",
            f"armature_{position}_rotation={format_vector(armature.rotation_euler)}",
            f"armature_{position}_scale={format_vector(armature.scale)}",
            f"armature_{position}_dimensions={format_vector(armature.dimensions)}",
            (
                f"armature_{position}_bone_names="
                + "|".join(
                    bone.name
                    for bone in bones
                )
            ),
            (
                f"armature_{position}_deform_bone_names="
                + "|".join(
                    bone.name
                    for bone in deform_bones
                )
            ),
        ])

    largest_mesh = (
        mesh_objects[0]
        if mesh_objects
        else None
    )

    named_cage = bpy.data.objects.get(
        "R2_Deformation_Cage"
    )

    lines.extend([
        "",
        "AUTOMATIC_CANDIDATES",
        (
            f"largest_mesh="
            f"{largest_mesh.name if largest_mesh else 'NONE'}"
        ),
        (
            f"largest_mesh_vertices="
            f"{len(largest_mesh.data.vertices) if largest_mesh else 0}"
        ),
        (
            f"named_cage="
            f"{named_cage.name if named_cage else 'NONE'}"
        ),
        (
            f"named_cage_vertices="
            f"{len(named_cage.data.vertices) if named_cage and named_cage.type == 'MESH' else 0}"
        ),
        (
            f"primary_armature="
            f"{armatures[0].name if armatures else 'NONE'}"
        ),
    ])

    return lines


rig_blend_path = os.path.abspath(
    get_argument("--rig-blend")
)

cage_blend_path = os.path.abspath(
    get_argument("--cage-blend")
)

report_path = os.path.abspath(
    get_argument("--report")
)

if os.path.exists(report_path):
    raise RuntimeError(
        f"O relatório já existe: {report_path}"
    )

rig_lines = inspect_blend(
    rig_blend_path,
    "RIG_V13",
)

cage_lines = inspect_blend(
    cage_blend_path,
    "CAGE_V18",
)

report_lines = [
    "R2_BINDING_READINESS_AUDIT",
    f"rig_blend={rig_blend_path}",
    f"cage_blend={cage_blend_path}",
    "",
    *rig_lines,
    "",
    *cage_lines,
    "",
    "status=audit_completed_no_blend_saved",
]

with open(
    report_path,
    "x",
    encoding="utf-8",
) as report_file:
    report_file.write(
        "\n".join(report_lines) + "\n"
    )

print(
    "\n".join(report_lines)
)