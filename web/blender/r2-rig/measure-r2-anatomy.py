import bpy
import os
import statistics
import sys

from mathutils import Vector


def get_arguments():
    if "--" not in sys.argv:
        raise RuntimeError("Argumentos não encontrados.")

    arguments = sys.argv[sys.argv.index("--") + 1:]

    if len(arguments) != 1:
        raise RuntimeError("Esperado: caminho do relatório.")

    return os.path.abspath(arguments[0])


def percentile(values, percentage):
    if not values:
        return 0.0

    ordered = sorted(values)

    position = (
        len(ordered) - 1
    ) * percentage

    lower = int(position)
    upper = min(
        lower + 1,
        len(ordered) - 1,
    )

    fraction = position - lower

    return (
        ordered[lower] *
        (1.0 - fraction)
        +
        ordered[upper] *
        fraction
    )


def describe_slice(
    points,
    name,
    z_min,
    z_max,
    minimum_abs_x=0.0,
):
    selected = [
        point
        for point in points
        if (
            z_min <= point.z <= z_max
            and abs(point.x) >= minimum_abs_x
        )
    ]

    if not selected:
        return [
            f"[{name}]",
            "vertices=0",
            "",
        ]

    x_values = [
        point.x
        for point in selected
    ]

    y_values = [
        point.y
        for point in selected
    ]

    positive = [
        point
        for point in selected
        if point.x > 0
    ]

    negative = [
        point
        for point in selected
        if point.x < 0
    ]

    positive_x = [
        point.x
        for point in positive
    ]

    negative_x = [
        point.x
        for point in negative
    ]

    positive_y = [
        point.y
        for point in positive
    ]

    negative_y = [
        point.y
        for point in negative
    ]

    return [
        f"[{name}]",
        f"z_range={z_min:.3f},{z_max:.3f}",
        f"vertices={len(selected)}",
        (
            "x_bounds="
            f"{min(x_values):.6f},"
            f"{max(x_values):.6f}"
        ),
        (
            "x_quantiles="
            f"{percentile(x_values, 0.10):.6f},"
            f"{percentile(x_values, 0.25):.6f},"
            f"{percentile(x_values, 0.50):.6f},"
            f"{percentile(x_values, 0.75):.6f},"
            f"{percentile(x_values, 0.90):.6f}"
        ),
        (
            "y_bounds="
            f"{min(y_values):.6f},"
            f"{max(y_values):.6f}"
        ),
        (
            "y_quantiles="
            f"{percentile(y_values, 0.10):.6f},"
            f"{percentile(y_values, 0.50):.6f},"
            f"{percentile(y_values, 0.90):.6f}"
        ),
        (
            "positive_side_center="
            f"{statistics.median(positive_x) if positive_x else 0.0:.6f},"
            f"{statistics.median(positive_y) if positive_y else 0.0:.6f}"
        ),
        (
            "negative_side_center="
            f"{statistics.median(negative_x) if negative_x else 0.0:.6f},"
            f"{statistics.median(negative_y) if negative_y else 0.0:.6f}"
        ),
        "",
    ]


report_path = get_arguments()

body = bpy.data.objects.get("R2_Body")
rig = bpy.data.objects.get("R2_Rig")

if body is None or body.type != "MESH":
    raise RuntimeError("R2_Body não encontrado.")

if rig is None or rig.type != "ARMATURE":
    raise RuntimeError("R2_Rig não encontrado.")

points = [
    body.matrix_world @
    Vector(vertex.co)
    for vertex in body.data.vertices
]

sections = [
    (
        "HEAD",
        0.56,
        0.92,
        0.00,
    ),
    (
        "SHOULDERS",
        0.27,
        0.39,
        0.16,
    ),
    (
        "ELBOWS",
        0.00,
        0.13,
        0.28,
    ),
    (
        "WRISTS_HANDS",
        -0.29,
        -0.12,
        0.32,
    ),
    (
        "WAIST",
        -0.25,
        -0.08,
        0.00,
    ),
    (
        "HIPS",
        -0.48,
        -0.32,
        0.08,
    ),
    (
        "KNEES",
        -0.73,
        -0.58,
        0.08,
    ),
    (
        "ANKLES",
        -0.94,
        -0.84,
        0.08,
    ),
    (
        "FEET",
        -1.01,
        -0.92,
        0.08,
    ),
]

report = [
    "R2_ANATOMY_MEASUREMENTS_OK",
    f"vertices={len(points)}",
    f"bones={len(rig.data.bones)}",
    "",
]

for (
    name,
    z_min,
    z_max,
    minimum_abs_x,
) in sections:
    report.extend(
        describe_slice(
            points,
            name,
            z_min,
            z_max,
            minimum_abs_x,
        )
    )

os.makedirs(
    os.path.dirname(report_path),
    exist_ok=True,
)

with open(
    report_path,
    "w",
    encoding="utf-8",
) as report_file:
    report_file.write(
        "\n".join(report)
    )

print("\n".join(report))