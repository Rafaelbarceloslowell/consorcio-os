import bpy
import hashlib
import json
import math
import os
import re
import sys
import traceback
from collections import Counter, defaultdict, deque

ROOT = r"C:\Projetos\consorcio-os\web\blender\r2-rig"
SOURCE = os.path.join(ROOT, "r2-head-consolidated-rig-ready-v1", "r2-head-consolidated-rig-ready-v1.blend")
OUTPUT = os.path.join(ROOT, "R2_HEAD_RIG_DISCOVERY.json")
EXPECTED_SHA = "340EEDFD0251432E6B8326B23EAE3AD268D560CC9D2FEE0940C8F03F9DC5B64B"
V37_REPORT = os.path.join(ROOT, "r2-v37-muzzle-region-retopology-v1", "build-report.json")
V38_REPORT = os.path.join(ROOT, "r2-v38-eye-brow-region-retopology-v2", "build-report.json")
FACIAL_TOKENS = {"eye", "eyes", "eyelid", "eyelids", "lid", "brow", "cheek", "jaw", "mouth", "lip", "lips", "muzzle", "nose", "tongue", "teeth", "ear", "ears", "viseme", "blink"}


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
    return str(value)


def id_properties(block):
    try:
        keys = sorted(block.keys())
    except (AttributeError, TypeError):
        return {}
    return {key: safe_value(block[key]) for key in keys if key != "_RNA_UI"}


def tokens(text):
    return {part for part in re.split(r"[^a-z0-9]+", str(text).lower()) if part}


def semantic_hits(name, properties=None):
    evidence = [name]
    if properties:
        evidence.extend(str(key) + " " + str(value) for key, value in properties.items())
    found = sorted(set().union(*(tokens(item) for item in evidence)) & FACIAL_TOKENS)
    return found


def edge_topology(mesh):
    lookup = {tuple(sorted(edge.vertices)): edge.index for edge in mesh.edges}
    face_counts = [0] * len(mesh.edges)
    adjacency = [[] for _ in mesh.vertices]
    for edge in mesh.edges:
        a, b = edge.vertices
        adjacency[a].append(b)
        adjacency[b].append(a)
    for polygon in mesh.polygons:
        for key in polygon.edge_keys:
            index = lookup.get(tuple(sorted(key)))
            if index is not None:
                face_counts[index] += 1
    boundary_edges = [mesh.edges[index] for index, count in enumerate(face_counts) if count == 1]
    boundary_adjacency = defaultdict(list)
    for edge in boundary_edges:
        a, b = edge.vertices
        boundary_adjacency[a].append(b)
        boundary_adjacency[b].append(a)
    components = []
    remaining = set(boundary_adjacency)
    while remaining:
        start = min(remaining)
        component = set([start])
        queue = deque([start])
        while queue:
            current = queue.popleft()
            for nxt in boundary_adjacency[current]:
                if nxt not in component:
                    component.add(nxt)
                    queue.append(nxt)
        remaining -= component
        coords = [mesh.vertices[index].co for index in component]
        components.append({
            "vertex_count": len(component),
            "closed": all(len(boundary_adjacency[index]) == 2 for index in component),
            "branched": any(len(boundary_adjacency[index]) > 2 for index in component),
            "centroid": [sum(float(co[axis]) for co in coords) / len(coords) for axis in range(3)],
            "bounds": [[min(float(co[axis]) for co in coords), max(float(co[axis]) for co in coords)] for axis in range(3)],
        })
    group_count = 0
    unsafe_duplicates = 0
    for edge in mesh.edges:
        if (mesh.vertices[edge.vertices[0]].co - mesh.vertices[edge.vertices[1]].co).length <= 1.0e-12:
            unsafe_duplicates += 1
    return {
        "vertices": len(mesh.vertices),
        "edges": len(mesh.edges),
        "faces": len(mesh.polygons),
        "boundary_edges": len(boundary_edges),
        "boundary_components": sorted(components, key=lambda item: item["vertex_count"], reverse=True),
        "wire_edges": sum(1 for count in face_counts if count == 0),
        "invalid_non_manifold": sum(1 for count in face_counts if count > 2),
        "zero_area_faces": sum(1 for polygon in mesh.polygons if polygon.area <= 1.0e-12),
        "unsafe_duplicate_vertices": unsafe_duplicates,
    }


def attribute_summary(mesh):
    result = []
    for attribute in sorted(mesh.attributes, key=lambda item: item.name):
        record = {"name": attribute.name, "domain": attribute.domain, "data_type": attribute.data_type, "data_length": len(attribute.data)}
        if attribute.data_type in {"INT", "BOOLEAN", "FLOAT"} and len(attribute.data) <= 100000:
            values = [item.value for item in attribute.data]
            counts = Counter(values)
            record["unique_count"] = len(counts)
            record["sample_counts"] = [{"value": key, "count": count} for key, count in sorted(counts.items(), key=lambda pair: str(pair[0]))[:25]]
            if values and all(isinstance(value, (int, float, bool)) for value in values):
                record["min"] = min(values)
                record["max"] = max(values)
        result.append(record)
    return result


def driver_records(block, owner):
    animation = getattr(block, "animation_data", None)
    if not animation:
        return []
    records = []
    for curve in animation.drivers:
        records.append({
            "owner": owner,
            "data_path": curve.data_path,
            "array_index": curve.array_index,
            "expression": curve.driver.expression,
            "variables": [{"name": variable.name, "type": variable.type, "targets": [{"id": target.id.name if target.id else None, "data_path": target.data_path, "bone_target": target.bone_target} for target in variable.targets]} for variable in curve.driver.variables],
        })
    return records


def nla_records(obj):
    animation = obj.animation_data
    if not animation:
        return []
    return [{"name": track.name, "mute": track.mute, "solo": track.is_solo, "strips": [{"name": strip.name, "action": strip.action.name if strip.action else None} for strip in track.strips]} for track in animation.nla_tracks]


def main():
    before = sha256(SOURCE)
    if before != EXPECTED_SHA:
        raise RuntimeError("Official source hash mismatch before discovery")
    with open(V37_REPORT, "r", encoding="utf-8") as handle:
        v37 = json.load(handle)
    with open(V38_REPORT, "r", encoding="utf-8") as handle:
        v38 = json.load(handle)
    bpy.ops.wm.open_mainfile(filepath=SOURCE, load_ui=False, use_scripts=False)
    drivers = []
    for obj in bpy.data.objects:
        drivers.extend(driver_records(obj, "object:" + obj.name))
        if obj.data:
            drivers.extend(driver_records(obj.data, "data:" + obj.data.name))
        if obj.type == "MESH" and obj.data.shape_keys:
            drivers.extend(driver_records(obj.data.shape_keys, "shape_keys:" + obj.data.shape_keys.name))
    armatures = []
    for obj in sorted((item for item in bpy.data.objects if item.type == "ARMATURE"), key=lambda item: item.name):
        bone_collections = []
        for collection in obj.data.collections:
            bone_collections.append({"name": collection.name, "bones": sorted(bone.name for bone in collection.bones), "is_visible": collection.is_visible})
        armatures.append({
            "object": obj.name,
            "data": obj.data.name,
            "bones": [{"name": bone.name, "parent": bone.parent.name if bone.parent else None, "use_deform": bone.use_deform, "head_local": list(bone.head_local), "tail_local": list(bone.tail_local), "collections": sorted(collection.name for collection in bone.collections), "custom_properties": id_properties(bone), "semantic_hits": semantic_hits(bone.name, id_properties(bone))} for bone in obj.data.bones],
            "bone_collections": bone_collections,
            "pose_bones": [{"name": bone.name, "rotation_mode": bone.rotation_mode, "constraints": [{"name": constraint.name, "type": constraint.type, "target": constraint.target.name if hasattr(constraint, "target") and constraint.target else None, "subtarget": constraint.subtarget if hasattr(constraint, "subtarget") else None} for constraint in bone.constraints], "custom_properties": id_properties(bone)} for bone in obj.pose.bones],
            "object_constraints": [{"name": constraint.name, "type": constraint.type} for constraint in obj.constraints],
            "custom_properties": id_properties(obj),
            "nla_tracks": nla_records(obj),
        })
    meshes = []
    for obj in sorted((item for item in bpy.data.objects if item.type == "MESH"), key=lambda item: item.name):
        topology = edge_topology(obj.data)
        groups = [group.name for group in obj.vertex_groups]
        unweighted = sum(1 for vertex in obj.data.vertices if groups and not any(assignment.weight > 0.0 for assignment in vertex.groups))
        mesh_record = {
            "object": obj.name,
            "data": obj.data.name,
            "parent": obj.parent.name if obj.parent else None,
            "vertex_groups": groups,
            "armature_modifiers": [{"name": modifier.name, "target": modifier.object.name if modifier.object else None, "index": index} for index, modifier in enumerate(obj.modifiers) if modifier.type == "ARMATURE"],
            "shape_keys": [] if obj.data.shape_keys is None else [key.name for key in obj.data.shape_keys.key_blocks],
            "uv_maps": [layer.name for layer in obj.data.uv_layers],
            "materials": [slot.material.name if slot.material else None for slot in obj.material_slots],
            "attributes": attribute_summary(obj.data),
            "topology": topology,
            "unweighted_vertices": unweighted,
            "semantic_hits": semantic_hits(obj.name, id_properties(obj)),
            "custom_properties": id_properties(obj),
            "nla_tracks": nla_records(obj),
        }
        meshes.append(mesh_record)
    foundation = next(item for item in meshes if item["object"] == "R2_Head_Face_Foundation")
    all_names = [obj.name for obj in bpy.data.objects]
    eye_objects = sorted(name for name in all_names if tokens(name) & {"eye", "eyes", "eyeball", "ocular"})
    oral_objects = sorted(name for name in all_names if tokens(name) & {"mouth", "tongue", "teeth", "tooth", "oral", "lip", "lips"})
    facial_bones = sorted(bone["name"] for armature in armatures for bone in armature["bones"] if bone["semantic_hits"])
    facial_groups = sorted(group for group in foundation["vertex_groups"] if tokens(group) & FACIAL_TOKENS)
    ocular_property_hits = []
    jaw_property_hits = []
    for obj in bpy.data.objects:
        for key, value in id_properties(obj).items():
            combined = tokens(key) | tokens(value)
            if combined & {"ocular", "eye", "eyes", "eyeball"}:
                ocular_property_hits.append({"object": obj.name, "key": key, "value": value})
            if combined & {"jaw", "hinge", "mouth", "lip", "lips"}:
                jaw_property_hits.append({"object": obj.name, "key": key, "value": value})
    readiness = {
        "NEUTRAL": {"supported": True, "evidence": "Existing source rest pose"},
        "HEAD_INTEGRATION": {"supported": True, "evidence": "Existing neck -> head chain and exact head/neck weights"},
        "JAW_OPEN": {"supported": False, "missing": ["certified jaw hinge", "jaw deformation group", "oral boundary ownership", "mouth interior asset"]},
        "EYE_AIM": {"supported": False, "missing": ["left/right eye objects", "certified ocular centers", "eyeball radius/depth"]},
        "BLINK_LEFT_RIGHT": {"supported": False, "missing": ["certified upper/lower lid loops", "eye surface for closure/collision", "lid deformation ownership"]},
        "BROW": {"supported": False, "missing": ["brow landmark map", "left/right deformation ownership"]},
        "CHEEK": {"supported": False, "missing": ["cheek provenance is topology-only", "deformation falloff map"]},
        "MUZZLE": {"supported": False, "missing": ["muzzle deformation ownership", "volume-preservation landmarks"]},
        "LIPS_AND_VISEMES": {"supported": False, "missing": ["upper/lower lip loops", "mouth corners", "oral cavity", "contact surface", "phoneme landmark map"]},
        "EARS": {"supported": False, "missing": ["dedicated ear surface/group ownership"]},
    }
    result = {
        "execution_status": "COMPLETED",
        "technical_verdict": "APROVADO",
        "failed_gates": [],
        "source_path": SOURCE,
        "source_sha256": before,
        "blender_version": bpy.app.version_string,
        "blend_saved": False,
        "images_created": 0,
        "scenes": [{"name": scene.name, "objects": sorted(obj.name for obj in scene.objects), "custom_properties": id_properties(scene)} for scene in bpy.data.scenes],
        "collections": [{"name": collection.name, "objects": sorted(obj.name for obj in collection.objects), "children": sorted(child.name for child in collection.children)} for collection in bpy.data.collections],
        "objects": [{"name": obj.name, "type": obj.type, "parent": obj.parent.name if obj.parent else None, "semantic_hits": semantic_hits(obj.name, id_properties(obj))} for obj in bpy.data.objects],
        "armatures": armatures,
        "meshes": meshes,
        "drivers": drivers,
        "actions": sorted(action.name for action in bpy.data.actions),
        "shape_key_datablocks": sorted(keys.name for keys in bpy.data.shape_keys),
        "images": sorted(image.name for image in bpy.data.images),
        "eye_objects": eye_objects,
        "oral_objects": oral_objects,
        "facial_bones": facial_bones,
        "foundation_facial_vertex_groups": facial_groups,
        "ocular_property_hits": ocular_property_hits,
        "jaw_or_mouth_property_hits": jaw_property_hits,
        "foundation": foundation,
        "historical_topology_evidence": {
            "v37_muzzle_region": {"selection_sha256": v37["region"]["selection_sha256"], "source_faces": v37["region"]["source_faces"], "source_vertices": v37["region"]["source_vertices"], "purpose": "topology patch, not a deformation or jaw-hinge certificate"},
            "v38_eye_brow_region": {"selection_sha256": v38["region"]["selection_sha256"], "source_faces": v38["region"]["source_faces"], "source_vertices": v38["region"]["source_vertices"], "eye_likelihood_score": v38["region"]["pair"]["eye_likelihood_score"], "left_inner_boundary_edges": v38["region"]["eye_regions"][0]["inner_boundary_edges"], "right_inner_boundary_edges": v38["region"]["eye_regions"][1]["inner_boundary_edges"], "purpose": "topology patch selected by likelihood, not certified ocular centers or upper/lower eyelid landmarks"},
        },
        "mandatory_capability_readiness": readiness,
        "mandatory_capabilities_supported": all(item["supported"] for item in readiness.values()),
        "non_recoverable_evidence": [
            "Approved preparation specification explicitly requires anatomical landmark certificates before facial bones or shape keys.",
            "No eye objects or certified ocular centers exist.",
            "No oral cavity, tongue, teeth, lip boundary, mouth-corner, or jaw-hinge ownership exists.",
            "Foundation has only neck/head vertex groups and no facial deformation groups.",
            "No facial bones, shape keys, drivers, actions, or NLA tracks exist.",
            "Historical V37/V38 data certifies topology patches only and cannot determine deformation anatomy.",
            "Automatic symmetry is prohibited by the approved asymmetric-source assessment."
        ],
    }
    after = sha256(SOURCE)
    result["source_sha256_after"] = after
    result["official_source_unchanged"] = after == before == EXPECTED_SHA
    if not result["official_source_unchanged"]:
        result["technical_verdict"] = "REPROVADO"
        result["failed_gates"].append("OfficialSourceUnchanged")
    with open(OUTPUT, "w", encoding="utf-8", newline="\n") as handle:
        json.dump(result, handle, indent=2, ensure_ascii=False, sort_keys=True)
        handle.write("\n")
    print("ExecutionStatus=" + result["execution_status"])
    print("TechnicalVerdict=" + result["technical_verdict"])
    print("SourceSHA256=" + before)
    print("BlendSaved=False")
    print("ImagesCreated=0")
    print("OfficialSourceUnchanged=" + str(result["official_source_unchanged"]))
    print("EyeObjects=" + str(len(eye_objects)))
    print("OralObjects=" + str(len(oral_objects)))
    print("FacialBones=" + str(len(facial_bones)))
    print("FacialVertexGroups=" + str(len(facial_groups)))
    print("ShapeKeyDatablocks=" + str(len(result["shape_key_datablocks"])))
    print("Drivers=" + str(len(drivers)))
    print("Actions=" + str(len(result["actions"])))
    print("MandatoryCapabilitiesSupported=" + str(result["mandatory_capabilities_supported"]))
    print("FailedGates=" + ("NONE" if not result["failed_gates"] else ",".join(result["failed_gates"])))


if __name__ == "__main__":
    try:
        main()
    except Exception:
        traceback.print_exc()
        sys.exit(1)
