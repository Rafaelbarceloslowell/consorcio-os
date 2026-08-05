import bpy
import os
import sys

from collections import defaultdict
from mathutils import Vector


def get_arguments():
    if "--" not in sys.argv:
        raise RuntimeError("Argumentos não encontrados.")

    values = sys.argv[sys.argv.index("--") + 1:]

    if len(values) != 1:
        raise RuntimeError(
            "Esperado: caminho do relatório."
        )

    return os.path.abspath(values[0])


class UnionFind:
    def __init__(self, size):
        self.parent = list(range(size))
        self.rank = [0] * size

    def find(self, item):
        root = item

        while self.parent[root] != root:
            root = self.parent[root]

        while self.parent[item] != item:
            next_item = self.parent[item]
            self.parent[item] = root
            item = next_item

        return root

    def union(self, first, second):
        first_root = self.find(first)
        second_root = self.find(second)

        if first_root == second_root:
            return

        if self.rank[first_root] < self.rank[second_root]:
            first_root, second_root = (
                second_root,
                first_root,
            )

        self.parent[second_root] = first_root

        if self.rank[first_root] == self.rank[second_root]:
            self.rank[first_root] += 1


report_path = get_arguments()

body = bpy.data.objects.get("R2_Body")

if body is None or body.type != "MESH":
    raise RuntimeError(
        "Malha R2_Body não encontrada."
    )

mesh = body.data
vertex_count = len(mesh.vertices)

union_find = UnionFind(vertex_count)

for edge in mesh.edges:
    union_find.union(
        edge.vertices[0],
        edge.vertices[1],
    )

components = defaultdict(list)

for vertex in mesh.vertices:
    root = union_find.find(vertex.index)

    components[root].append(
        vertex.index
    )

face_counts = defaultdict(int)

for polygon in mesh.polygons:
    if not polygon.vertices:
        continue

    root = union_find.find(
        polygon.vertices[0]
    )

    face_counts[root] += 1

component_reports = []

for root, indices in components.items():
    points = [
        body.matrix_world @
        mesh.vertices[index].co
        for index in indices
    ]

    minimum = Vector((
        min(point.x for point in points),
        min(point.y for point in points),
        min(point.z for point in points),
    ))

    maximum = Vector((
        max(point.x for point in points),
        max(point.y for point in points),
        max(point.z for point in points),
    ))

    center = (
        minimum +
        maximum
    ) * 0.5

    dimensions = (
        maximum -
        minimum
    )

    component_reports.append({
        "root": root,
        "vertices": len(indices),
        "faces": face_counts[root],
        "minimum": minimum,
        "maximum": maximum,
        "center": center,
        "dimensions": dimensions,
    })

component_reports.sort(
    key=lambda item: item["vertices"],
    reverse=True,
)

report = [
    "R2_MESH_ISLANDS_OK",
    f"mesh={body.name}",
    f"vertices={len(mesh.vertices)}",
    f"edges={len(mesh.edges)}",
    f"polygons={len(mesh.polygons)}",
    f"islands={len(component_reports)}",
    "",
]

for index, component in enumerate(
    component_reports[:40],
    start=1,
):
    minimum = component["minimum"]
    maximum = component["maximum"]
    center = component["center"]
    dimensions = component["dimensions"]

    report.extend([
        f"[ISLAND_{index:02d}]",
        f"vertices={component['vertices']}",
        f"faces={component['faces']}",
        (
            "center="
            f"{center.x:.6f},"
            f"{center.y:.6f},"
            f"{center.z:.6f}"
        ),
        (
            "dimensions="
            f"{dimensions.x:.6f},"
            f"{dimensions.y:.6f},"
            f"{dimensions.z:.6f}"
        ),
        (
            "bounds_min="
            f"{minimum.x:.6f},"
            f"{minimum.y:.6f},"
            f"{minimum.z:.6f}"
        ),
        (
            "bounds_max="
            f"{maximum.x:.6f},"
            f"{maximum.y:.6f},"
            f"{maximum.z:.6f}"
        ),
        "",
    ])

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