import bpy
import json
import os
import sys
from collections import defaultdict, deque


def arguments():
    values = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    if len(values) != 1:
        raise RuntimeError("Usage: -- <output-json>")
    return os.path.abspath(values[0])


def component_records(obj):
    vertex_neighbors = defaultdict(set)
    vertex_polygons = defaultdict(set)
    for polygon in obj.data.polygons:
        vertices = tuple(polygon.vertices)
        for vertex in vertices:
            vertex_polygons[vertex].add(polygon.index)
        for start, end in zip(vertices, vertices[1:] + vertices[:1]):
            vertex_neighbors[start].add(end)
            vertex_neighbors[end].add(start)
    unseen = set(range(len(obj.data.vertices)))
    records = []
    while unseen:
        first = unseen.pop()
        vertices = {first}
        queue = deque([first])
        while queue:
            current = queue.popleft()
            for neighbor in vertex_neighbors.get(current, ()):
                if neighbor in unseen:
                    unseen.remove(neighbor)
                    vertices.add(neighbor)
                    queue.append(neighbor)
        polygons = sorted({index for vertex in vertices for index in vertex_polygons.get(vertex, ())})
        points = [obj.matrix_world @ obj.data.vertices[index].co for index in vertices]
        minimum = [min(point[axis] for point in points) for axis in range(3)]
        maximum = [max(point[axis] for point in points) for axis in range(3)]
        material_counts = defaultdict(int)
        for index in polygons:
            polygon = obj.data.polygons[index]
            material = obj.material_slots[polygon.material_index].material if polygon.material_index < len(obj.material_slots) else None
            material_counts[material.name if material else None] += 1
        records.append({
            "vertex_count": len(vertices),
            "polygon_count": len(polygons),
            "vertex_indices": sorted(vertices),
            "polygon_indices": polygons,
            "minimum": [round(value, 9) for value in minimum],
            "maximum": [round(value, 9) for value in maximum],
            "dimensions": [round(maximum[axis] - minimum[axis], 9) for axis in range(3)],
            "center": [round((maximum[axis] + minimum[axis]) * 0.5, 9) for axis in range(3)],
            "materials": dict(sorted(material_counts.items(), key=lambda item: str(item[0]))),
        })
    return sorted(records, key=lambda record: (-record["polygon_count"], record["center"]))


def main():
    output = arguments()
    result = {}
    for obj in sorted((item for item in bpy.data.objects if item.type == "MESH" and not item.hide_render), key=lambda item: item.name):
        result[obj.name] = {
            "materials": [slot.material.name if slot.material else None for slot in obj.material_slots],
            "vertex_count": len(obj.data.vertices),
            "polygon_count": len(obj.data.polygons),
            "components": component_records(obj),
        }
    payload = {"schema_version": 1, "blend": os.path.abspath(bpy.data.filepath), "objects": result}
    with open(output + ".tmp", "w", encoding="utf-8", newline="\n") as handle:
        json.dump(payload, handle, indent=2, sort_keys=True)
        handle.write("\n")
    os.replace(output + ".tmp", output)
    print(json.dumps({name: {"components": len(value["components"]), "materials": value["materials"]} for name, value in result.items()}, indent=2))


if __name__ == "__main__":
    main()
