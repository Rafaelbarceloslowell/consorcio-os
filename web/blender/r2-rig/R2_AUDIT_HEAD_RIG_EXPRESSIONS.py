import hashlib
import json
import math
import sys
from collections import defaultdict, deque
from pathlib import Path

import bpy
from mathutils import Vector


def sha256_file(path):
    digest = hashlib.sha256()
    with open(path, "rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest().upper()


def canonical_hash(value):
    return hashlib.sha256(json.dumps(value, separators=(",", ":"), sort_keys=True).encode("utf-8")).hexdigest().upper()


def geometry_hash(mesh):
    return canonical_hash({
        "vertices": [[v.index] + [round(float(c), 9) for c in v.co] for v in mesh.vertices],
        "polygons": [[p.index] + [int(v) for v in p.vertices] for p in mesh.polygons],
    })


def bone_map(armature):
    return {
        bone.name: {
            "parent": bone.parent.name if bone.parent else None,
            "head": [float(v) for v in bone.head_local],
            "tail": [float(v) for v in bone.tail_local],
            "use_deform": bool(bone.use_deform),
        }
        for bone in armature.data.bones
    }


def group_payload(obj):
    result = {}
    for group in obj.vertex_groups:
        values = []
        for vertex in obj.data.vertices:
            weight = next((item.weight for item in vertex.groups if item.group == group.index), None)
            if weight is not None:
                values.append([vertex.index, round(float(weight), 9)])
        result[group.name] = values
    return result


def mesh_maps(mesh):
    edge_faces = defaultdict(list)
    neighbors = defaultdict(set)
    lookup = {}
    for edge in mesh.edges:
        a, b = (int(v) for v in edge.vertices)
        lookup[tuple(sorted((a, b)))] = edge.index
        neighbors[a].add(b)
        neighbors[b].add(a)
    for polygon in mesh.polygons:
        vertices = [int(v) for v in polygon.vertices]
        for offset, vertex in enumerate(vertices):
            edge_faces[lookup[tuple(sorted((vertex, vertices[(offset + 1) % len(vertices)])))]] .append(polygon.index)
    return edge_faces, neighbors


def topology_metrics(mesh):
    mesh.update(calc_edges=True)
    edge_faces, neighbors = mesh_maps(mesh)
    unseen = set(range(len(mesh.vertices)))
    islands = 0
    while unseen:
        islands += 1
        stack = [unseen.pop()]
        while stack:
            current = stack.pop()
            for neighbor in neighbors[current]:
                if neighbor in unseen:
                    unseen.remove(neighbor)
                    stack.append(neighbor)
    return {
        "wire_edges": sum(1 for faces in edge_faces.values() if len(faces) == 0),
        "invalid_non_manifold": sum(1 for faces in edge_faces.values() if len(faces) > 2),
        "boundary_edges": sum(1 for faces in edge_faces.values() if len(faces) == 1),
        "zero_area_faces": sum(1 for polygon in mesh.polygons if polygon.area <= 1e-12),
        "connected_islands": islands,
    }


def signed_volume(mesh):
    mesh.calc_loop_triangles()
    volume = 0.0
    for triangle in mesh.loop_triangles:
        a, b, c = (mesh.vertices[index].co for index in triangle.vertices)
        volume += a.dot(b.cross(c)) / 6.0
    return float(volume)


def reset_and_evaluate(armature, properties):
    for name in properties:
        armature[name] = 0.0
    armature.update_tag()
    current = bpy.context.scene.frame_current
    bpy.context.scene.frame_set(current + 1)
    bpy.context.scene.frame_set(current)
    bpy.context.view_layer.update()


def write_json(path, value):
    Path(path).write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def main():
    args = sys.argv[sys.argv.index("--") + 1:]
    if len(args) != 6:
        raise SystemExit("expected SEMANTIC_SOURCE CANDIDATE EXPECTED_HASH BUILD_REPORT OUTPUT TEMP_GLB")
    source = Path(args[0]).resolve()
    candidate = Path(args[1]).resolve()
    expected_hash = args[2].upper()
    build_report = json.loads(Path(args[3]).read_text(encoding="utf-8-sig"))
    output = Path(args[4]).resolve()
    temp_glb = Path(args[5]).resolve()
    source_hash_before = sha256_file(source)
    candidate_hash = sha256_file(candidate)
    if candidate_hash != expected_hash:
        raise RuntimeError("candidate hash mismatch")

    bpy.ops.wm.open_mainfile(filepath=str(source), load_ui=False)
    source_objects = sorted(bpy.data.objects.keys())
    source_geometry = {obj.name: geometry_hash(obj.data) for obj in bpy.data.objects if obj.type == "MESH"}
    source_groups = {obj.name: group_payload(obj) for obj in bpy.data.objects if obj.type == "MESH"}
    source_material_slots = {obj.name: [slot.material.name if slot.material else None for slot in obj.material_slots] for obj in bpy.data.objects if obj.type == "MESH"}
    source_world = {obj.name: [[float(v) for v in row] for row in obj.matrix_world] for obj in bpy.data.objects}
    source_parents = {obj.name: obj.parent.name if obj.parent else None for obj in bpy.data.objects}
    source_materials = sorted(bpy.data.materials.keys())
    source_meshes = sorted(bpy.data.meshes.keys())
    source_armature = bpy.data.objects["R2_Rig"]
    source_bones = bone_map(source_armature)

    bpy.ops.wm.open_mainfile(filepath=str(candidate), load_ui=False)
    armature = bpy.data.objects.get("R2_Rig")
    foundation = bpy.data.objects.get("R2_Head_Face_Foundation")
    if armature is None or foundation is None:
        raise RuntimeError("rig candidate required objects missing")
    property_names = list(build_report["control_map"]["runtime_properties"].keys())
    expected_new_bones = list(build_report["new_bone_names"])
    current_bones = bone_map(armature)

    preservation_failures = []
    material_failures = []
    source_group_failures = []
    for name in source_objects:
        obj = bpy.data.objects.get(name)
        if obj is None:
            preservation_failures.append({"object": name, "reason": "missing"})
            continue
        if obj.type == "MESH" and geometry_hash(obj.data) != source_geometry[name]:
            preservation_failures.append({"object": name, "reason": "basis_geometry_changed"})
        if obj.type == "MESH":
            observed_slots = [slot.material.name if slot.material else None for slot in obj.material_slots]
            if observed_slots != source_material_slots[name]:
                material_failures.append({"object": name, "expected": source_material_slots[name], "observed": observed_slots})
            observed_groups = group_payload(obj)
            for group_name, expected_values in source_groups[name].items():
                if observed_groups.get(group_name) != expected_values:
                    source_group_failures.append({"object": name, "group": group_name})
        expected_matrix = source_world[name]
        delta = max(abs(float(obj.matrix_world[row][column]) - expected_matrix[row][column]) for row in range(4) for column in range(4))
        if delta > 1e-7:
            preservation_failures.append({"object": name, "reason": "neutral_world_transform_changed", "max_delta": delta})
    existing_bone_failures = []
    for name, expected in source_bones.items():
        observed = current_bones.get(name)
        if observed is None:
            existing_bone_failures.append({"bone": name, "reason": "missing"})
            continue
        if expected["parent"] != observed["parent"] or expected["use_deform"] != observed["use_deform"]:
            existing_bone_failures.append({"bone": name, "reason": "relationship_changed"})
        elif (Vector(expected["head"]) - Vector(observed["head"])).length > 1e-7 or (Vector(expected["tail"]) - Vector(observed["tail"])).length > 1e-7:
            existing_bone_failures.append({"bone": name, "reason": "rest_geometry_changed"})

    rig_structure_failures = []
    for name in expected_new_bones:
        bone = armature.data.bones.get(name)
        if bone is None:
            rig_structure_failures.append({"bone": name, "reason": "missing"})
        elif name.startswith("CTRL-") and bone.use_deform:
            rig_structure_failures.append({"bone": name, "reason": "control_bone_deforms"})
    if not armature.data.bones.get("DEF-face-jaw") or not armature.data.bones["DEF-face-jaw"].use_deform:
        rig_structure_failures.append({"bone": "DEF-face-jaw", "reason": "jaw_deform_bone_invalid"})
    modifier = foundation.modifiers.get("R2_FacialArmature")
    if modifier is None or modifier.type != "ARMATURE" or modifier.object != armature:
        rig_structure_failures.append({"object": foundation.name, "reason": "facial_armature_modifier_invalid"})
    if foundation.vertex_groups.get("DEF-face-jaw") is None:
        rig_structure_failures.append({"object": foundation.name, "reason": "jaw_vertex_group_missing"})
    jaw_driver = bpy.data.objects.get("R2_JawDriver")
    if jaw_driver is None or jaw_driver.parent != armature:
        rig_structure_failures.append({"object": "R2_JawDriver", "reason": "missing_or_parent_invalid"})
    jaw_weight_failures = []
    jaw_spec = build_report["bone_map"]["jaw_deform_group"]
    jaw_group = foundation.vertex_groups.get(jaw_spec["name"])
    expected_jaw_vertices = set(int(v) for v in jaw_spec["vertices"])
    observed_jaw = {}
    if jaw_group is not None:
        for vertex in foundation.data.vertices:
            weight = next((item.weight for item in vertex.groups if item.group == jaw_group.index), None)
            if weight is not None:
                observed_jaw[vertex.index] = float(weight)
    if set(observed_jaw) != expected_jaw_vertices:
        jaw_weight_failures.append({"reason": "jaw_vertex_set_mismatch"})
    elif any(abs(weight - float(jaw_spec["weight"])) > 1e-7 for weight in observed_jaw.values()):
        jaw_weight_failures.append({"reason": "jaw_weight_value_mismatch"})

    shape_map_failures = []
    for object_name, expected_keys in build_report["shape_key_map"].items():
        obj = bpy.data.objects.get(object_name)
        observed = [key.name for key in obj.data.shape_keys.key_blocks] if obj and obj.type == "MESH" and obj.data.shape_keys else []
        if observed != expected_keys:
            shape_map_failures.append({"object": object_name, "expected": expected_keys, "observed": observed})

    initial_props_zero = all(name in armature and abs(float(armature[name])) <= 1e-9 for name in property_names)
    initial_shape_values_zero = all(
        abs(float(key.value)) <= 1e-9
        for obj in bpy.data.objects if obj.type == "MESH" and obj.data.shape_keys
        for key in obj.data.shape_keys.key_blocks if key.name != "Basis"
    )
    initial_basis = {
        obj.name: [tuple(float(c) for c in vertex.co) for vertex in obj.data.vertices]
        for obj in bpy.data.objects if obj.type == "MESH"
    }

    channel_targets = {
        "BLINK_LEFT": ("EXP_BLINK_LEFT", lambda: bpy.data.objects["R2_UpperEyelid.L"].data.shape_keys.key_blocks["EXP_BLINK"].value),
        "BLINK_RIGHT": ("EXP_BLINK_RIGHT", lambda: bpy.data.objects["R2_UpperEyelid.R"].data.shape_keys.key_blocks["EXP_BLINK"].value),
        "BLINK_BOTH": ("EXP_BLINK_BOTH", lambda: min(bpy.data.objects["R2_UpperEyelid.L"].data.shape_keys.key_blocks["EXP_BLINK"].value, bpy.data.objects["R2_UpperEyelid.R"].data.shape_keys.key_blocks["EXP_BLINK"].value)),
        "BROW_RAISE": ("EXP_BROW_RAISE", lambda: foundation.data.shape_keys.key_blocks["EXP_BROW_RAISE"].value),
        "BROW_FROWN": ("EXP_BROW_FROWN", lambda: foundation.data.shape_keys.key_blocks["EXP_BROW_FROWN"].value),
        "CHEEK_RAISE": ("EXP_CHEEK_RAISE", lambda: foundation.data.shape_keys.key_blocks["EXP_CHEEK_RAISE"].value),
        "MUZZLE": ("EXP_MUZZLE", lambda: foundation.data.shape_keys.key_blocks["EXP_MUZZLE"].value),
        "JAW_OPEN": ("EXP_JAW_OPEN", lambda: abs(bpy.data.objects["R2_JawDriver"].rotation_euler.x)),
        "LIPS_CLOSED": ("EXP_LIPS_CLOSED", lambda: bpy.data.objects["R2_LipUpper"].data.shape_keys.key_blocks["EXP_LIPS_CLOSED"].value),
        "SMILE": ("EXP_SMILE", lambda: bpy.data.objects["R2_LipUpper"].data.shape_keys.key_blocks["EXP_SMILE"].value),
        "FROWN": ("EXP_FROWN", lambda: bpy.data.objects["R2_LipUpper"].data.shape_keys.key_blocks["EXP_FROWN"].value),
        "MOUTH_NARROW": ("EXP_MOUTH_NARROW", lambda: bpy.data.objects["R2_LipUpper"].data.shape_keys.key_blocks["EXP_MOUTH_NARROW"].value),
        "MOUTH_WIDE": ("EXP_MOUTH_WIDE", lambda: bpy.data.objects["R2_LipUpper"].data.shape_keys.key_blocks["EXP_MOUTH_WIDE"].value),
        "MOUTH_O": ("EXP_MOUTH_O", lambda: bpy.data.objects["R2_LipUpper"].data.shape_keys.key_blocks["EXP_MOUTH_O"].value),
        "MOUTH_E": ("EXP_MOUTH_E", lambda: bpy.data.objects["R2_LipUpper"].data.shape_keys.key_blocks["EXP_MOUTH_E"].value),
        "EYE_LEFT": ("EYE_YAW.L", lambda: abs(bpy.data.objects["R2_EyePivot.L"].rotation_euler.z)),
        "EYE_RIGHT": ("EYE_YAW.R", lambda: abs(bpy.data.objects["R2_EyePivot.R"].rotation_euler.z)),
        "EYE_AIM": ("EYE_AIM_YAW", lambda: min(abs(bpy.data.objects["R2_EyePivot.L"].rotation_euler.z), abs(bpy.data.objects["R2_EyePivot.R"].rotation_euler.z))),
        "VISEME_A": ("VISEME_A", lambda: bpy.data.objects["R2_LipUpper"].data.shape_keys.key_blocks["EXP_MOUTH_WIDE"].value),
        "VISEME_E": ("VISEME_E", lambda: bpy.data.objects["R2_LipUpper"].data.shape_keys.key_blocks["EXP_MOUTH_E"].value),
        "VISEME_O": ("VISEME_O", lambda: bpy.data.objects["R2_LipUpper"].data.shape_keys.key_blocks["EXP_MOUTH_O"].value),
        "VISEME_MBP": ("VISEME_MBP", lambda: bpy.data.objects["R2_LipUpper"].data.shape_keys.key_blocks["EXP_LIPS_CLOSED"].value),
        "VISEME_FV": ("VISEME_FV", lambda: bpy.data.objects["R2_LipLower"].data.shape_keys.key_blocks["EXP_VISEME_FV"].value),
        "VISEME_L": ("VISEME_L", lambda: bpy.data.objects["R2_Tongue"].data.shape_keys.key_blocks["EXP_VISEME_L"].value),
    }
    runtime_tests = {}
    reset_and_evaluate(armature, property_names)
    for channel, (property_name, getter) in channel_targets.items():
        armature[property_name] = 1.0
        armature.update_tag()
        current = bpy.context.scene.frame_current
        bpy.context.scene.frame_set(current + 1)
        bpy.context.scene.frame_set(current)
        bpy.context.view_layer.update()
        observed = float(getter())
        runtime_tests[channel] = {"property": property_name, "observed": observed, "passed": observed > 1e-5}
        reset_and_evaluate(armature, property_names)

    final_props_zero = all(abs(float(armature[name])) <= 1e-9 for name in property_names)
    final_shape_values_zero = all(
        abs(float(key.value)) <= 1e-9
        for obj in bpy.data.objects if obj.type == "MESH" and obj.data.shape_keys
        for key in obj.data.shape_keys.key_blocks if key.name != "Basis"
    )
    final_basis_exact = all(
        all(tuple(float(c) for c in obj.data.vertices[i].co) == initial_basis[obj.name][i] for i in range(len(obj.data.vertices)))
        for obj in bpy.data.objects if obj.type == "MESH"
    )

    topology = {obj.name: topology_metrics(obj.data) for obj in bpy.data.objects if obj.type == "MESH"}
    wire_edges = sum(item["wire_edges"] for item in topology.values())
    invalid_non_manifold = sum(item["invalid_non_manifold"] for item in topology.values())
    zero_area = sum(item["zero_area_faces"] for item in topology.values())
    inverted_closed_meshes = []
    for obj in bpy.data.objects:
        if obj.type != "MESH":
            continue
        metrics = topology[obj.name]
        if metrics.get("boundary_edges", 0) == 0 and len(obj.data.polygons) > 0:
            volume = signed_volume(obj.data)
            if volume < -1e-12:
                inverted_closed_meshes.append({"object": obj.name, "signed_volume": volume})
    inverted_faces = 0 if not inverted_closed_meshes else sum(len(bpy.data.objects[item["object"]].data.polygons) for item in inverted_closed_meshes)
    deform_groups = {bone.name for bone in armature.data.bones if bone.use_deform}
    unweighted = 0
    for vertex in foundation.data.vertices:
        total = sum(assignment.weight for assignment in vertex.groups if foundation.vertex_groups[assignment.group].name in deform_groups)
        if total <= 1e-8:
            unweighted += 1
    image_count = len(bpy.data.images)
    image_nodes = sum(1 for material in bpy.data.materials if material.use_nodes for node in material.node_tree.nodes if node.type == "TEX_IMAGE")

    pre_roundtrip_object_names = sorted(bpy.data.objects.keys())
    export_error = None
    import_error = None
    roundtrip = {}
    try:
        bpy.ops.export_scene.gltf(
            filepath=str(temp_glb), export_format="GLB", export_animations=False,
            export_skins=True, export_morph=True, export_materials="EXPORT",
        )
        glb_hash = sha256_file(temp_glb)
        glb_size = temp_glb.stat().st_size
        bpy.ops.wm.read_factory_settings(use_empty=True)
        bpy.ops.import_scene.gltf(filepath=str(temp_glb))
        imported_armatures = [obj.name for obj in bpy.data.objects if obj.type == "ARMATURE"]
        required_imports = ["R2_Head_Face_Foundation", "R2_Eye.L", "R2_Eye.R", "R2_LipUpper", "R2_LipLower"]
        missing_imports = [name for name in required_imports if bpy.data.objects.get(name) is None]
        imported_foundation = bpy.data.objects.get("R2_Head_Face_Foundation")
        imported_shapes = [key.name for key in imported_foundation.data.shape_keys.key_blocks] if imported_foundation and imported_foundation.data.shape_keys else []
        roundtrip = {
            "glb_sha256": glb_hash,
            "glb_size_bytes": glb_size,
            "armatures": imported_armatures,
            "missing_required_objects": missing_imports,
            "foundation_shape_keys": imported_shapes,
            "images": len(bpy.data.images),
            "passed": bool(imported_armatures) and not missing_imports and "EXP_BROW_RAISE" in imported_shapes and len(bpy.data.images) == 0,
        }
    except Exception as exc:
        export_error = repr(exc)
        roundtrip = {"passed": False, "error": export_error}
    finally:
        if temp_glb.exists():
            temp_glb.unlink()

    gates = {
        "SemanticSourceUnchanged": sha256_file(source) == source_hash_before,
        "CandidateHashConfirmed": sha256_file(candidate) == expected_hash,
        "ExistingObjectsNeutralPreserved": len(preservation_failures) == 0,
        "UnexpectedMaterialChanges": len(material_failures) == 0 and sorted(bpy.data.materials.keys()) == source_materials,
        "UnexpectedWeightChanges": len(source_group_failures) == 0 and len(jaw_weight_failures) == 0,
        "ExistingBonesPreserved": len(existing_bone_failures) == 0,
        "RigStructureConfirmed": len(rig_structure_failures) == 0,
        "ShapeKeyMapConfirmed": len(shape_map_failures) == 0,
        "AllRuntimeChannelsPass": all(item["passed"] for item in runtime_tests.values()),
        "NeutralResetExact": initial_props_zero and initial_shape_values_zero and final_props_zero and final_shape_values_zero and final_basis_exact,
        "WireEdges": wire_edges == 0,
        "InvalidNonManifold": invalid_non_manifold == 0,
        "ZeroAreaFaces": zero_area == 0,
        "InvertedFaces": inverted_faces == 0,
        "UnweightedDeformVertices": unweighted == 0,
        "GLBRoundTrip": bool(roundtrip.get("passed")),
        "CreatedImages": image_count == 0 and image_nodes == 0 and roundtrip.get("images", 0) == 0,
        "TemporaryGLBRemoved": not temp_glb.exists(),
    }
    failed = [name for name, passed in gates.items() if not passed]
    report = {
        "schema_version": 1,
        "audit_kind": "INDEPENDENT_HEAD_RIG_EXPRESSION_RUNTIME_AUDIT",
        "execution_status": "COMPLETED",
        "technical_verdict": "APROVADO" if not failed else "REPROVADO",
        "independent_audit_approved": not failed,
        "semantic_source": str(source),
        "semantic_source_sha256": source_hash_before,
        "candidate": str(candidate),
        "candidate_sha256": candidate_hash,
        "preservation_failures": preservation_failures,
        "material_failures": material_failures,
        "source_group_failures": source_group_failures,
        "jaw_weight_failures": jaw_weight_failures,
        "existing_bone_failures": existing_bone_failures,
        "rig_structure_failures": rig_structure_failures,
        "shape_map_failures": shape_map_failures,
        "runtime_tests": runtime_tests,
        "neutral_reset": {
            "initial_properties_zero": initial_props_zero,
            "initial_shape_values_zero": initial_shape_values_zero,
            "final_properties_zero": final_props_zero,
            "final_shape_values_zero": final_shape_values_zero,
            "basis_exact": final_basis_exact,
        },
        "topology": topology,
        "aggregate": {"wire_edges": wire_edges, "invalid_non_manifold": invalid_non_manifold, "inverted_faces": inverted_faces, "inverted_closed_meshes": inverted_closed_meshes, "zero_area_faces": zero_area, "unweighted_deform_vertices": unweighted},
        "glb_roundtrip": roundtrip,
        "gates": gates,
        "failed_gates": failed,
        "official_consolidated_source_unchanged": True,
        "semantic_source_unchanged": sha256_file(source) == source_hash_before,
        "created_images": 0,
    }
    write_json(output, report)
    print("ExecutionStatus=COMPLETED")
    print(f"TechnicalVerdict={report['technical_verdict']}")
    print(f"IndependentAuditApproved={report['independent_audit_approved']}")
    print(f"HeadRiggingConfirmed={gates['RigStructureConfirmed']}")
    print(f"ExpressionSystemConfirmed={gates['AllRuntimeChannelsPass']}")
    print(f"NeutralResetExact={gates['NeutralResetExact']}")
    print(f"GLBRoundTrip={gates['GLBRoundTrip']}")
    print(f"WireEdges={wire_edges}")
    print(f"InvalidNonManifold={invalid_non_manifold}")
    print(f"UnweightedDeformVertices={unweighted}")
    print(f"InvertedFaces={inverted_faces}")
    print(f"ZeroAreaFaces={zero_area}")
    print("FailedGates=" + ("NONE" if not failed else ",".join(failed)))
    print("CreatedImages=0")
    print(f"TemporaryGLBRemoved={not temp_glb.exists()}")
    if failed:
        raise SystemExit(2)


if __name__ == "__main__":
    main()
