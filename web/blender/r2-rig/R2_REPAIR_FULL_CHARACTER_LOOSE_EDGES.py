import bmesh
import bpy
import hashlib
import json
import os
import sys
import traceback


RIG_ROOT = r"C:\Projetos\consorcio-os\web\blender\r2-rig"
HEAD_SOURCE = os.path.join(RIG_ROOT, "r2-head-rig-expression-ready-v1", "r2-head-rig-expression-ready-v1.blend")
ANATOMICAL_SOURCE = os.path.join(RIG_ROOT, "r2-facial-ocular-oral-assets-ready-v1", "r2-facial-ocular-oral-assets-ready-v1.blend")
BODY_SOURCE = os.path.join(RIG_ROOT, "r2-rig-v13-weights-refined.blend")
HEAD_SHA = "7AE3C98EEF99AE60FF3C0470370147559B6B1CE7EE8455BAFD81D9852D8C0B97"
ANATOMICAL_SHA = "50D04CFBAEC2A431D96D4060E2AE82045AFBC56A0E74AD1759D156C0222825B3"
BODY_SHA = "392EA67AEBC3BA0FF72E65BE18F599E22A0C4C1296F2F6D365FFB989F35CF9C1"
TARGET = "R2_Head_Face_Foundation"


def args():
    argv = sys.argv
    if "--" not in argv:
        raise RuntimeError("Expected -- <transaction-directory>")
    values = argv[argv.index("--") + 1 :]
    if len(values) != 1:
        raise RuntimeError("Expected one transaction directory")
    return os.path.abspath(values[0])


def sha256(path):
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest().upper()


def write_json(path, value):
    temporary = path + ".tmp"
    with open(temporary, "w", encoding="utf-8", newline="\n") as handle:
        json.dump(value, handle, ensure_ascii=False, indent=2, sort_keys=True)
        handle.write("\n")
    os.replace(temporary, path)


def edge_face_counts(mesh):
    lookup = {tuple(sorted((int(edge.vertices[0]), int(edge.vertices[1])))): edge.index for edge in mesh.edges}
    counts = [0] * len(mesh.edges)
    for polygon in mesh.polygons:
        vertices = [int(index) for index in polygon.vertices]
        for offset, vertex in enumerate(vertices):
            key = tuple(sorted((vertex, vertices[(offset + 1) % len(vertices)])))
            counts[lookup[key]] += 1
    return counts


def loose_edges(mesh):
    counts = edge_face_counts(mesh)
    result = []
    for edge, count in zip(mesh.edges, counts):
        if count == 0:
            pair = [int(index) for index in edge.vertices]
            result.append(
                {
                    "edge_index": edge.index,
                    "vertex_indices": pair,
                    "vertex_coordinates": [
                        [round(float(component), 12) for component in mesh.vertices[index].co]
                        for index in pair
                    ],
                }
            )
    return result


def mesh_preservation_snapshot(obj):
    mesh = obj.data
    shapes = {}
    if mesh.shape_keys:
        for key in mesh.shape_keys.key_blocks:
            shapes[key.name] = [tuple(float(component) for component in point.co) for point in key.data]
    groups = {}
    for group in obj.vertex_groups:
        assignments = []
        for vertex in mesh.vertices:
            membership = next((item for item in vertex.groups if item.group == group.index), None)
            if membership is not None:
                assignments.append((vertex.index, float(membership.weight)))
        groups[group.name] = assignments
    return {
        "vertices": [tuple(float(component) for component in vertex.co) for vertex in mesh.vertices],
        "polygons": [tuple(int(index) for index in polygon.vertices) for polygon in mesh.polygons],
        "polygon_materials": [int(polygon.material_index) for polygon in mesh.polygons],
        "shape_keys": shapes,
        "vertex_groups": groups,
        "material_slots": [slot.material.name if slot.material else None for slot in obj.material_slots],
        "attributes": [
            (attribute.name, attribute.domain, attribute.data_type, len(attribute.data))
            for attribute in sorted(mesh.attributes, key=lambda item: item.name)
            if not attribute.name.startswith(".")
        ],
    }


def main():
    transaction = args()
    candidate = os.path.abspath(bpy.data.filepath)
    if not os.path.normcase(candidate).startswith(os.path.normcase(transaction + os.sep)):
        raise RuntimeError("Candidate is outside the transaction")
    for path, expected in ((HEAD_SOURCE, HEAD_SHA), (ANATOMICAL_SOURCE, ANATOMICAL_SHA), (BODY_SOURCE, BODY_SHA)):
        if sha256(path) != expected:
            raise RuntimeError(f"Immutable source mismatch: {path}")

    candidate_hash_before = sha256(candidate)
    bpy.ops.wm.open_mainfile(filepath=HEAD_SOURCE, load_ui=False)
    source_obj = bpy.data.objects[TARGET]
    source_loose = loose_edges(source_obj.data)
    source_counts = (len(source_obj.data.vertices), len(source_obj.data.edges), len(source_obj.data.polygons))
    if len(source_loose) != 16:
        raise RuntimeError(f"Expected exactly 16 certified source loose edges, found {len(source_loose)}")

    bpy.ops.wm.open_mainfile(filepath=candidate, load_ui=False)
    obj = bpy.data.objects[TARGET]
    candidate_loose = loose_edges(obj.data)
    if [item["vertex_indices"] for item in candidate_loose] != [item["vertex_indices"] for item in source_loose]:
        raise RuntimeError("Candidate loose-edge set differs from the immutable source")
    before = mesh_preservation_snapshot(obj)
    before_counts = (len(obj.data.vertices), len(obj.data.edges), len(obj.data.polygons))
    if before_counts != source_counts:
        raise RuntimeError("Candidate topology counts differ before the authorized repair")

    mesh = obj.data
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode="EDIT")
    bm = bmesh.from_edit_mesh(mesh)
    bm.edges.ensure_lookup_table()
    for edge in bm.edges:
        edge.select = False
    doomed = [edge for edge in bm.edges if len(edge.link_faces) == 0]
    if len(doomed) != 16:
        bpy.ops.object.mode_set(mode="OBJECT")
        raise RuntimeError(f"Edit BMesh located {len(doomed)} loose edges instead of 16")
    for edge in sorted(doomed, key=lambda item: item.index, reverse=True):
        bm.edges.remove(edge)
    bmesh.update_edit_mesh(mesh, loop_triangles=False, destructive=False)
    bpy.ops.object.mode_set(mode="OBJECT")
    mesh.update(calc_edges=True)

    after = mesh_preservation_snapshot(obj)
    after_counts = (len(mesh.vertices), len(mesh.edges), len(mesh.polygons))
    preservation_failures = []
    for key in ("vertices", "polygons", "polygon_materials", "shape_keys", "vertex_groups", "material_slots", "attributes"):
        if before[key] != after[key]:
            preservation_failures.append(key)
    remaining_loose = loose_edges(mesh)
    if after_counts != (before_counts[0], before_counts[1] - 16, before_counts[2]):
        preservation_failures.append("expected topology counts")
    if remaining_loose:
        preservation_failures.append("remaining loose edges")
    if preservation_failures:
        raise RuntimeError("Authorized repair preservation failure: " + ", ".join(preservation_failures))

    bpy.ops.wm.save_as_mainfile(filepath=candidate, check_existing=False, compress=False)
    report = {
        "schema_version": 1,
        "change_kind": "AUTHORIZED_WEB_SAFETY_LOOSE_EDGE_REMOVAL",
        "execution_status": "COMPLETED",
        "technical_verdict": "APROVADO",
        "candidate": candidate,
        "candidate_sha256_before": candidate_hash_before,
        "candidate_sha256_after": sha256(candidate),
        "immutable_source": HEAD_SOURCE,
        "immutable_source_sha256": HEAD_SHA,
        "target_object": TARGET,
        "source_defect_confirmed": True,
        "legacy_auditor_root_cause": "The previous edge-face defaultdict did not preinitialize all mesh edges, so truly loose edges were absent from the values iterated by its wire-edge gate.",
        "removed_loose_edges": source_loose,
        "removed_loose_edge_count": 16,
        "counts_before": {"vertices": before_counts[0], "edges": before_counts[1], "faces": before_counts[2]},
        "counts_after": {"vertices": after_counts[0], "edges": after_counts[1], "faces": after_counts[2]},
        "vertex_coordinates_preserved_exact": True,
        "polygon_topology_preserved_exact": True,
        "shape_keys_preserved_exact": True,
        "vertex_groups_preserved_exact": True,
        "materials_preserved_exact": True,
        "attributes_preserved_exact": True,
        "unexpected_geometry_changes": 0,
        "unexpected_weight_changes": 0,
        "unexpected_material_changes": 0,
        "official_sources_unchanged": True,
        "created_images": 0,
        "failed_gates": [],
    }
    write_json(os.path.join(transaction, "R2_AUTHORIZED_FULL_CHARACTER_GEOMETRY_CHANGE_MAP.json.tmp"), report)
    print("R2_FULL_CHARACTER_LOOSE_EDGE_REPAIR=" + json.dumps({
        "ExecutionStatus": "COMPLETED",
        "TechnicalVerdict": "APROVADO",
        "RemovedLooseEdges": 16,
        "WireEdgesAfter": 0,
        "VerticesChanged": 0,
        "FacesChanged": 0,
        "ShapeKeysChanged": 0,
        "WeightsChanged": 0,
        "MaterialsChanged": 0,
        "UnexpectedGeometryChanges": 0,
        "CandidateSHA256": report["candidate_sha256_after"],
        "OfficialSourcesUnchanged": True,
        "CreatedImages": 0,
    }, sort_keys=True))


try:
    main()
except Exception:
    traceback.print_exc()
    raise
