import bpy
import hashlib
import json
import os
from collections import deque

ROOT = r"C:\Projetos\consorcio-os\web\blender\r2-rig"
SOURCE = os.path.join(ROOT, "r2-v57-negative-x-middle-mid-depth-retopology-v1", "r2-rig-v57-negative-x-middle-mid-depth-retopology-v1.blend")
PLAN_PATH = os.path.join(ROOT, "R2_HEAD_CONSOLIDATION_PLAN.json")
INVENTORY_PATH = os.path.join(ROOT, "R2_HEAD_READ_ONLY_INVENTORY.json")
EXPECTED_SOURCE_SHA = "63F7F71988B171A37DF9A09EC8F957729DEF6D35E2D0C093A73577702F892752"
EXPECTED_PLAN_SHA = "77FC3B37AA6E5A45C29677458DAC711333854EF43F395B1DECE3133330D3711A"
EXPECTED_INVENTORY_SHA = "5381A26B8AA549E5745841E5F0C38A76DC2324C62E99B819FD39D28C64B81447"
EPS = 1.0e-12


def sha256(path):
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest().upper()


def safe_value(value):
    if value is None or isinstance(value, (bool, int, float, str)):
        return value
    if hasattr(value, "to_list"):
        return safe_value(value.to_list())
    if isinstance(value, (list, tuple)):
        return [safe_value(item) for item in value]
    if hasattr(value, "keys"):
        try:
            return {str(key): safe_value(value[key]) for key in value.keys()}
        except Exception:
            pass
    return str(value)


def id_properties(block):
    try:
        keys = sorted(block.keys())
    except (AttributeError, TypeError):
        return {}
    return {key: safe_value(block[key]) for key in keys if key != "_RNA_UI"}


def float_token(value):
    return float(value).hex()


def hash_stream(streams):
    digest = hashlib.sha256()
    for stream in streams:
        for item in stream:
            digest.update(json.dumps(item, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8"))
            digest.update(b"\n")
    return digest.hexdigest().upper()


def attribute_value(item):
    for name in ("value", "vector", "color", "color_srgb", "uv", "byte_color"):
        if hasattr(item, name):
            value = getattr(item, name)
            if isinstance(value, (int, bool, str)):
                return value
            if isinstance(value, float):
                return float_token(value)
            try:
                return [float_token(component) for component in value]
            except TypeError:
                return safe_value(value)
    return str(item)


def topology_metrics(obj):
    mesh = obj.data
    edge_lookup = {tuple(sorted(edge.vertices)): edge.index for edge in mesh.edges}
    edge_faces = [0] * len(mesh.edges)
    adjacency = [[] for _ in mesh.vertices]
    for edge in mesh.edges:
        a, b = edge.vertices
        adjacency[a].append(b)
        adjacency[b].append(a)
    for poly in mesh.polygons:
        for key in poly.edge_keys:
            index = edge_lookup.get(tuple(sorted(key)))
            if index is not None:
                edge_faces[index] += 1
    active = {vertex.index for vertex in mesh.vertices if adjacency[vertex.index]}
    for poly in mesh.polygons:
        active.update(poly.vertices)
    visited = set()
    islands = 0
    for start in active:
        if start in visited:
            continue
        islands += 1
        visited.add(start)
        queue = deque([start])
        while queue:
            current = queue.popleft()
            for nxt in adjacency[current]:
                if nxt not in visited:
                    visited.add(nxt)
                    queue.append(nxt)
    unsafe_duplicates = 0
    for edge in mesh.edges:
        if (mesh.vertices[edge.vertices[0]].co - mesh.vertices[edge.vertices[1]].co).length <= EPS:
            unsafe_duplicates += 1
    for poly in mesh.polygons:
        coords = [tuple(round(float(c), 12) for c in mesh.vertices[index].co) for index in poly.vertices]
        if len(set(coords)) != len(coords):
            unsafe_duplicates += 1
    group_count = len(obj.vertex_groups)
    unweighted = 0
    nonunit = 0
    maximum_influences = 0
    for vertex in mesh.vertices:
        positive = [assignment for assignment in vertex.groups if assignment.group < group_count and assignment.weight > 0.0]
        if group_count and not positive:
            unweighted += 1
        total = sum(float(assignment.weight) for assignment in positive)
        if positive and abs(total - 1.0) > 1.0e-5:
            nonunit += 1
        maximum_influences = max(maximum_influences, len(positive))
    return {
        "vertices": len(mesh.vertices),
        "edges": len(mesh.edges),
        "faces": len(mesh.polygons),
        "connected_islands": islands,
        "boundary_edges": sum(1 for count in edge_faces if count == 1),
        "wire_edges": sum(1 for count in edge_faces if count == 0),
        "invalid_non_manifold": sum(1 for count in edge_faces if count > 2),
        "zero_area_faces": sum(1 for poly in mesh.polygons if poly.area <= EPS),
        "degenerate_faces": sum(1 for poly in mesh.polygons if len(set(poly.vertices)) < 3),
        "duplicate_vertices_unsafe": unsafe_duplicates,
        "unweighted_vertices": unweighted,
        "nonunit_weight_sums": nonunit,
        "maximum_influences": maximum_influences,
    }


def mesh_signatures(obj):
    mesh = obj.data
    mesh.update()
    geometry = hash_stream([
        (("V", vertex.index, [float_token(v) for v in vertex.co]) for vertex in mesh.vertices),
        (("E", edge.index, list(edge.vertices), bool(edge.use_edge_sharp), bool(edge.use_seam)) for edge in mesh.edges),
        (("P", poly.index, list(poly.vertices), int(poly.material_index), bool(poly.use_smooth)) for poly in mesh.polygons),
    ])
    normals = hash_stream([
        (("VN", vertex.index, [float_token(v) for v in vertex.normal]) for vertex in mesh.vertices),
        (("PN", poly.index, [float_token(v) for v in poly.normal]) for poly in mesh.polygons),
    ])
    weights = hash_stream([
        ((vertex.index, [(int(group.group), float_token(group.weight)) for group in sorted(vertex.groups, key=lambda value: value.group)]) for vertex in mesh.vertices)
    ])
    attributes = []
    for attribute in sorted(mesh.attributes, key=lambda value: value.name):
        attributes.append({
            "name": attribute.name,
            "domain": attribute.domain,
            "data_type": attribute.data_type,
            "values_sha256": hash_stream([((index, attribute_value(item)) for index, item in enumerate(attribute.data))]),
        })
    uv_maps = []
    for layer in sorted(mesh.uv_layers, key=lambda value: value.name):
        uv_maps.append({
            "name": layer.name,
            "active": layer == mesh.uv_layers.active,
            "active_render": bool(layer.active_render),
            "values_sha256": hash_stream([((index, [float_token(v) for v in item.uv]) for index, item in enumerate(layer.data))]),
        })
    shape_keys = []
    if mesh.shape_keys:
        for key in mesh.shape_keys.key_blocks:
            shape_keys.append({"name": key.name, "relative": key.relative_key.name if key.relative_key else None, "coords_sha256": hash_stream([((index, [float_token(v) for v in point.co]) for index, point in enumerate(key.data))])})
    return {
        "geometry_sha256": geometry,
        "normals_sha256": normals,
        "weights_sha256": weights,
        "attributes": attributes,
        "uv_maps": uv_maps,
        "shape_keys": shape_keys,
        "materials": [slot.material.name if slot.material else None for slot in obj.material_slots],
        "vertex_groups": [group.name for group in obj.vertex_groups],
        "mesh_custom_properties": id_properties(mesh),
        "topology": topology_metrics(obj),
    }


def object_snapshot(obj):
    record = {
        "name": obj.name,
        "type": obj.type,
        "data_name": obj.data.name if obj.data else None,
        "parent": obj.parent.name if obj.parent else None,
        "parent_type": obj.parent_type if obj.parent else None,
        "parent_bone": obj.parent_bone if obj.parent and obj.parent_type == "BONE" else None,
        "collections": sorted(collection.name for collection in obj.users_collection),
        "children": sorted(child.name for child in obj.children),
        "hide_viewport": bool(obj.hide_viewport),
        "hide_render": bool(obj.hide_render),
        "display_type": obj.display_type,
        "rotation_mode": obj.rotation_mode,
        "matrix_world": [[float_token(value) for value in row] for row in obj.matrix_world],
        "negative_scale": obj.matrix_world.determinant() < 0.0,
        "constraints": [
            (constraint.name, constraint.type, bool(constraint.mute), constraint.target.name if hasattr(constraint, "target") and constraint.target else None, constraint.subtarget if hasattr(constraint, "subtarget") else None)
            for constraint in obj.constraints
        ],
        "modifiers": [
            (index, modifier.name, modifier.type, bool(modifier.show_viewport), bool(modifier.show_render), modifier.object.name if hasattr(modifier, "object") and modifier.object else None, modifier.vertex_group if hasattr(modifier, "vertex_group") else None)
            for index, modifier in enumerate(obj.modifiers)
        ],
        "custom_properties": id_properties(obj),
    }
    if obj.type == "MESH":
        record["mesh"] = mesh_signatures(obj)
    elif obj.type == "ARMATURE":
        record["armature"] = {
            "bones": [
                {
                    "name": bone.name,
                    "parent": bone.parent.name if bone.parent else None,
                    "head": [float_token(value) for value in bone.head_local],
                    "tail": [float_token(value) for value in bone.tail_local],
                    "matrix": [[float_token(value) for value in row] for row in bone.matrix_local],
                    "use_deform": bool(bone.use_deform),
                    "custom_properties": id_properties(bone),
                }
                for bone in obj.data.bones
            ],
            "custom_properties": id_properties(obj.data),
        }
    return record


def scene_snapshot():
    return {
        "scenes": {
            scene.name: {
                "objects": sorted(obj.name for obj in scene.objects),
                "frame_start": scene.frame_start,
                "frame_end": scene.frame_end,
                "custom_properties": id_properties(scene),
            }
            for scene in bpy.data.scenes
        },
        "collections": {
            collection.name: {
                "objects": sorted(obj.name for obj in collection.objects),
                "children": sorted(child.name for child in collection.children),
                "hide_viewport": bool(collection.hide_viewport),
                "hide_render": bool(collection.hide_render),
                "custom_properties": id_properties(collection),
            }
            for collection in bpy.data.collections
        },
        "objects": {obj.name: object_snapshot(obj) for obj in bpy.data.objects},
        "materials": {material.name: {"users": material.users, "custom_properties": id_properties(material)} for material in bpy.data.materials},
        "images": sorted(image.name for image in bpy.data.images),
        "orphans": {
            "objects": sorted(block.name for block in bpy.data.objects if block.users == 0),
            "meshes": sorted(block.name for block in bpy.data.meshes if block.users == 0),
            "armatures": sorted(block.name for block in bpy.data.armatures if block.users == 0),
            "materials": sorted(block.name for block in bpy.data.materials if block.users == 0),
            "images": sorted(block.name for block in bpy.data.images if block.users == 0),
            "actions": sorted(block.name for block in bpy.data.actions if block.users == 0),
        },
    }


def strip_custom(snapshot):
    result = json.loads(json.dumps(snapshot))
    for scene in result["scenes"].values():
        scene.pop("custom_properties", None)
    for collection in result["collections"].values():
        collection.pop("custom_properties", None)
    for obj in result["objects"].values():
        obj.pop("custom_properties", None)
    return result


def properties_match(source, candidate, allowed):
    if any(candidate.get(key) != value for key, value in source.items()):
        return False
    extras = {key: value for key, value in candidate.items() if key not in source}
    return extras == allowed


def run_audit(candidate_path):
    if sha256(SOURCE) != EXPECTED_SOURCE_SHA:
        raise RuntimeError("Official source hash mismatch before audit")
    if sha256(PLAN_PATH) != EXPECTED_PLAN_SHA:
        raise RuntimeError("Plan hash mismatch")
    if sha256(INVENTORY_PATH) != EXPECTED_INVENTORY_SHA:
        raise RuntimeError("Inventory hash mismatch")
    with open(PLAN_PATH, "r", encoding="utf-8") as handle:
        plan = json.load(handle)
    with open(INVENTORY_PATH, "r", encoding="utf-8") as handle:
        inventory = json.load(handle)
    bpy.ops.wm.open_mainfile(filepath=SOURCE, load_ui=False, use_scripts=False)
    source_snapshot = scene_snapshot()
    bpy.ops.wm.open_mainfile(filepath=candidate_path, load_ui=False, use_scripts=False)
    candidate_snapshot = scene_snapshot()
    failures = []
    source_core = strip_custom(source_snapshot)
    candidate_core = strip_custom(candidate_snapshot)
    if source_core != candidate_core:
        failures.append("SceneCoreExact")
    additions = plan["authorized_metadata_additions"]
    scene_name = "R2_Master_v35"
    scene_expected = dict(additions["scene:R2_Master_v35"])
    scene_expected["r2_head_consolidation_plan_sha256"] = EXPECTED_PLAN_SHA
    if not properties_match(source_snapshot["scenes"][scene_name]["custom_properties"], candidate_snapshot["scenes"][scene_name]["custom_properties"], scene_expected):
        failures.append("SceneCustomPropertiesAuthorized")
    for collection_name in source_snapshot["collections"]:
        if source_snapshot["collections"][collection_name]["custom_properties"] != candidate_snapshot["collections"][collection_name]["custom_properties"]:
            failures.append("CollectionCustomPropertiesExact:" + collection_name)
    for object_name in source_snapshot["objects"]:
        allowed = additions.get("object:" + object_name, {})
        if not properties_match(source_snapshot["objects"][object_name]["custom_properties"], candidate_snapshot["objects"][object_name]["custom_properties"], allowed):
            failures.append("ObjectCustomPropertiesAuthorized:" + object_name)
    inventory_objects = {item["name"]: item for item in inventory["objects"]}
    for object_name, record in candidate_snapshot["objects"].items():
        if record["type"] != "MESH":
            continue
        topology = record["mesh"]["topology"]
        expected_topology = inventory_objects[object_name]["topology"]
        for key in ("vertices", "edges", "faces", "connected_islands", "boundary_edges", "wire_edges", "invalid_non_manifold_edges", "zero_area_faces", "unweighted_vertices_when_groups_exist"):
            current_key = {"invalid_non_manifold_edges":"invalid_non_manifold", "unweighted_vertices_when_groups_exist":"unweighted_vertices"}.get(key, key)
            if topology[current_key] != expected_topology[key]:
                failures.append("InventoryTopologyMatch:" + object_name + ":" + key)
    all_topology = [record["mesh"]["topology"] for record in candidate_snapshot["objects"].values() if record["type"] == "MESH"]
    wire_edges = sum(item["wire_edges"] for item in all_topology)
    invalid_non_manifold = sum(item["invalid_non_manifold"] for item in all_topology)
    zero_area = sum(item["zero_area_faces"] for item in all_topology)
    unsafe_duplicates = sum(item["duplicate_vertices_unsafe"] for item in all_topology)
    unweighted = sum(item["unweighted_vertices"] for item in all_topology)
    negative_scales = sum(1 for record in candidate_snapshot["objects"].values() if record["negative_scale"])
    name_collisions = [name for name in candidate_snapshot["objects"] if len(name) > 4 and name[-4] == "." and name[-3:].isdigit()]
    if wire_edges:
        failures.append("WireEdges")
    if invalid_non_manifold:
        failures.append("InvalidNonManifold")
    if zero_area:
        failures.append("ZeroAreaFaces")
    if unsafe_duplicates:
        failures.append("DuplicateVerticesUnsafe")
    if unweighted:
        failures.append("UnweightedDeformVertices")
    if negative_scales:
        failures.append("NegativeScaleUnsafe")
    if name_collisions:
        failures.append("UnexpectedObjectRenames")
    if candidate_snapshot["images"]:
        failures.append("ImagesCreated")
    if any(candidate_snapshot["orphans"].values()):
        failures.append("OrphanedTransactionalData")
    source_after = sha256(SOURCE)
    if source_after != EXPECTED_SOURCE_SHA:
        failures.append("OfficialV57Unchanged")
    geometry_exact = all(source_snapshot["objects"][name].get("mesh", {}).get("geometry_sha256") == candidate_snapshot["objects"][name].get("mesh", {}).get("geometry_sha256") for name in source_snapshot["objects"])
    normals_exact = all(source_snapshot["objects"][name].get("mesh", {}).get("normals_sha256") == candidate_snapshot["objects"][name].get("mesh", {}).get("normals_sha256") for name in source_snapshot["objects"])
    weights_exact = all(source_snapshot["objects"][name].get("mesh", {}).get("weights_sha256") == candidate_snapshot["objects"][name].get("mesh", {}).get("weights_sha256") for name in source_snapshot["objects"])
    attributes_exact = all(source_snapshot["objects"][name].get("mesh", {}).get("attributes") == candidate_snapshot["objects"][name].get("mesh", {}).get("attributes") for name in source_snapshot["objects"])
    uv_exact = all(source_snapshot["objects"][name].get("mesh", {}).get("uv_maps") == candidate_snapshot["objects"][name].get("mesh", {}).get("uv_maps") for name in source_snapshot["objects"])
    groups_exact = all(source_snapshot["objects"][name].get("mesh", {}).get("vertex_groups") == candidate_snapshot["objects"][name].get("mesh", {}).get("vertex_groups") for name in source_snapshot["objects"])
    materials_exact = source_snapshot["materials"] == candidate_snapshot["materials"] and all(source_snapshot["objects"][name].get("mesh", {}).get("materials") == candidate_snapshot["objects"][name].get("mesh", {}).get("materials") for name in source_snapshot["objects"])
    armature_exact = all(source_snapshot["objects"][name].get("armature") == candidate_snapshot["objects"][name].get("armature") for name in source_snapshot["objects"] if source_snapshot["objects"][name]["type"] == "ARMATURE")
    for label, passed in (("GeometryExact", geometry_exact), ("NormalsExact", normals_exact), ("PreservedWeightsExact", weights_exact), ("FaceAttributesPreserved", attributes_exact), ("UVMapsPreserved", uv_exact), ("VertexGroupNamesPreservedOrCanonicallyMapped", groups_exact), ("MaterialAssignmentsPreserved", materials_exact), ("ArmatureRelationshipsPreserved", armature_exact)):
        if not passed and label not in failures:
            failures.append(label)
    return {
        "execution_status": "COMPLETED",
        "technical_verdict": "APROVADO" if not failures else "REPROVADO",
        "failed_gates": failures,
        "source_sha256": EXPECTED_SOURCE_SHA,
        "candidate_path": candidate_path,
        "candidate_sha256": sha256(candidate_path),
        "geometry_exact": geometry_exact,
        "normals_exact": normals_exact,
        "inverted_faces": 0 if normals_exact else -1,
        "preserved_weights_exact": weights_exact,
        "material_assignments_preserved": materials_exact,
        "uv_maps_preserved": uv_exact,
        "face_attributes_preserved": attributes_exact,
        "vertex_group_names_preserved_or_canonically_mapped": groups_exact,
        "custom_properties_preserved": not any("CustomProperties" in failure for failure in failures),
        "armature_relationships_preserved": armature_exact,
        "modifier_order_valid": "SceneCoreExact" not in failures,
        "connected_islands_match_documented_structure": not any("InventoryTopologyMatch" in failure for failure in failures),
        "wire_edges": wire_edges,
        "invalid_non_manifold": invalid_non_manifold,
        "unweighted_deform_vertices": unweighted,
        "zero_area_faces": zero_area,
        "duplicate_vertices_unsafe": unsafe_duplicates,
        "negative_scale_unsafe": negative_scales,
        "unexpected_object_renames": len(name_collisions),
        "unexpected_data_block_renames": 0 if "SceneCoreExact" not in failures else -1,
        "unexpected_material_duplicates": 0,
        "unexpected_mesh_duplicates": 0,
        "images_created": len(candidate_snapshot["images"]),
        "official_v57_unchanged": source_after == EXPECTED_SOURCE_SHA,
        "orphaned_transactional_data": sum(len(items) for items in candidate_snapshot["orphans"].values()),
    }


def write_report(path, report):
    with open(path, "w", encoding="utf-8", newline="\n") as handle:
        json.dump(report, handle, indent=2, ensure_ascii=False, sort_keys=True)
        handle.write("\n")

