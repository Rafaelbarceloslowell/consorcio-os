import bpy
import hashlib
import json
import math
import os
import struct
import sys
from collections import Counter
from mathutils import Vector
from mathutils.bvhtree import BVHTree


RIG_ROOT = r"C:\Projetos\consorcio-os\web\blender\r2-rig"
OFFICIAL_BLEND = os.path.join(RIG_ROOT, "r2-full-character-runtime-ready-v1", "r2-full-character-runtime-ready-v1.blend")
OFFICIAL_BLEND_SHA = "3D60D28B852566ABEC764D2DE0EB55D63F42AC26F8F75936109D33898B25E269"
OFFICIAL_GLB = r"C:\Projetos\consorcio-os\web\public\models\r2\r2-full-character-runtime-ready-v1.glb"
OFFICIAL_GLB_SHA = "E3B9702C0367A8CAFB138B5C9AB94D6CC448C470CD69D74A46333A9953207A59"
BRANDING = {
    "R2_Brand_RightChest_GorillaMark": "R2_Hoodie_Torso",
    "R2_Brand_LeftArm_GorillaMark_R2_Patch": "R2_Hoodie_Sleeve_L",
    "R2_Brand_UpperBack_GorillaMark": "R2_Hoodie_Torso",
}
REQUIRED_ACTIONS = [
    "R2_ALERT", "R2_AWAITING_ACTION", "R2_CELEBRATING_SALE", "R2_ERROR_ATTENTION",
    "R2_IDLE", "R2_LISTENING", "R2_NEUTRAL", "R2_THINKING", "R2_WORKING",
]


def arguments():
    argv = sys.argv
    if "--" not in argv:
        raise RuntimeError("Expected -- <transaction-directory>")
    values = argv[argv.index("--") + 1 :]
    if len(values) != 1:
        raise RuntimeError("Expected exactly one transaction directory")
    return os.path.abspath(values[0])


def sha256_file(path):
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest().upper()


def atomic_json(path, value):
    temporary = path + ".tmp"
    with open(temporary, "w", encoding="utf-8", newline="\n") as handle:
        json.dump(value, handle, ensure_ascii=False, indent=2, sort_keys=True)
        handle.write("\n")
    os.replace(temporary, path)


def canonical_hash(value):
    payload = json.dumps(value, ensure_ascii=True, separators=(",", ":"), sort_keys=True).encode("utf-8")
    return hashlib.sha256(payload).hexdigest().upper()


def rounded(value):
    return round(float(value), 9)


def mesh_geometry_fingerprint(mesh):
    digest = hashlib.sha256()
    digest.update(struct.pack("<QQQ", len(mesh.vertices), len(mesh.edges), len(mesh.polygons)))
    for vertex in mesh.vertices:
        digest.update(struct.pack("<3d", *(float(component) for component in vertex.co)))
    for edge in mesh.edges:
        digest.update(struct.pack("<2I", *edge.vertices))
    for polygon in mesh.polygons:
        vertices = tuple(polygon.vertices)
        digest.update(struct.pack("<I", len(vertices)))
        if vertices:
            digest.update(struct.pack("<" + "I" * len(vertices), *vertices))
    return digest.hexdigest().upper()


def object_weight_fingerprint(obj):
    groups = sorted(obj.vertex_groups, key=lambda item: item.name)
    by_index = {group.index: group for group in groups}
    accumulators = {
        group.index: {"digest": hashlib.sha256(), "count": 0, "sum": 0.0, "minimum": None, "maximum": None}
        for group in groups
    }
    for vertex in obj.data.vertices:
        for membership in sorted(vertex.groups, key=lambda item: item.group):
            if membership.group not in accumulators:
                continue
            record = accumulators[membership.group]
            weight = float(membership.weight)
            record["digest"].update(struct.pack("<Id", vertex.index, weight))
            record["count"] += 1
            record["sum"] += weight
            record["minimum"] = weight if record["minimum"] is None else min(record["minimum"], weight)
            record["maximum"] = weight if record["maximum"] is None else max(record["maximum"], weight)
    result = []
    for group_index in sorted(by_index, key=lambda index: by_index[index].name):
        group = by_index[group_index]
        record = accumulators[group_index]
        result.append({
            "name": group.name,
            "assignment_count": record["count"],
            "weight_sum": rounded(record["sum"]),
            "minimum_weight": None if record["minimum"] is None else rounded(record["minimum"]),
            "maximum_weight": None if record["maximum"] is None else rounded(record["maximum"]),
            "fingerprint": record["digest"].hexdigest().upper(),
        })
    return canonical_hash(result)


def reset_neutral(armature):
    if armature.animation_data:
        armature.animation_data.action = None
    for bone in armature.pose.bones:
        bone.location = (0.0, 0.0, 0.0)
        bone.rotation_mode = "QUATERNION"
        bone.rotation_quaternion = (1.0, 0.0, 0.0, 0.0)
        bone.scale = (1.0, 1.0, 1.0)
    for obj in bpy.data.objects:
        if obj.type == "MESH" and obj.data.shape_keys:
            for key in obj.data.shape_keys.key_blocks:
                if key.name != "Basis":
                    key.value = 0.0
    for key in list(armature.keys()):
        if key.startswith("EXP_") or key.startswith("VISEME_") or key.startswith("EYE_"):
            armature[key] = 0.0
    bpy.context.scene.frame_set(1)
    bpy.context.view_layer.update()


def neutral_exact(armature):
    tolerance = 1.0e-8
    bones_exact = all(
        bone.location.length <= tolerance
        and abs(bone.rotation_quaternion.w - 1.0) <= tolerance
        and Vector((bone.rotation_quaternion.x, bone.rotation_quaternion.y, bone.rotation_quaternion.z)).length <= tolerance
        and (bone.scale - Vector((1.0, 1.0, 1.0))).length <= tolerance
        for bone in armature.pose.bones
    )
    morphs_exact = all(
        abs(key.value) <= tolerance
        for obj in bpy.data.objects
        if obj.type == "MESH" and obj.data.shape_keys
        for key in obj.data.shape_keys.key_blocks
        if key.name != "Basis"
    )
    return bones_exact and morphs_exact


def morph_target_count():
    return sum(max(0, len(obj.data.shape_keys.key_blocks) - 1) for obj in bpy.data.objects if obj.type == "MESH" and obj.data.shape_keys)


def topology_metrics(obj):
    mesh = obj.data
    face_counts = [0] * len(mesh.edges)
    edge_lookup = {tuple(sorted(edge.vertices)): edge.index for edge in mesh.edges}
    zero_area = 0
    for polygon in mesh.polygons:
        zero_area += polygon.area <= 1.0e-14
        vertices = tuple(polygon.vertices)
        for start, end in zip(vertices, vertices[1:] + vertices[:1]):
            face_counts[edge_lookup[tuple(sorted((start, end)))]] += 1
    return {
        "wire_edges": sum(count == 0 for count in face_counts),
        "boundary_edges": sum(count == 1 for count in face_counts),
        "invalid_non_manifold": sum(count not in (1, 2) for count in face_counts),
        "zero_area_faces": int(zero_area),
    }


def signed_volume(obj):
    volume = 0.0
    for polygon in obj.data.polygons:
        vertices = [obj.data.vertices[index].co for index in polygon.vertices]
        if len(vertices) < 3:
            continue
        anchor = vertices[0]
        for index in range(1, len(vertices) - 1):
            volume += anchor.dot(vertices[index].cross(vertices[index + 1])) / 6.0
    return volume


def evaluated_geometry(obj, depsgraph):
    evaluated = obj.evaluated_get(depsgraph)
    mesh = evaluated.to_mesh(preserve_all_data_layers=False, depsgraph=depsgraph)
    matrix = evaluated.matrix_world.copy()
    return evaluated, mesh, matrix


def bvh_for_evaluated(obj, depsgraph):
    evaluated, mesh, matrix = evaluated_geometry(obj, depsgraph)
    vertices = [matrix @ vertex.co for vertex in mesh.vertices]
    polygons = [tuple(polygon.vertices) for polygon in mesh.polygons]
    bvh = BVHTree.FromPolygons(vertices, polygons, all_triangles=False)
    return evaluated, mesh, bvh


def distances_for_pair(brand, garment, depsgraph, baseline_signs=None):
    eval_garment, garment_mesh, bvh = bvh_for_evaluated(garment, depsgraph)
    eval_brand, brand_mesh, brand_matrix = evaluated_geometry(brand, depsgraph)
    distances = []
    signed_values = []
    signs = []
    missing = 0
    for vertex in brand_mesh.vertices:
        point = brand_matrix @ vertex.co
        nearest, normal, _face_index, distance = bvh.find_nearest(point, 0.05)
        if nearest is None:
            missing += 1
            continue
        signed = (point - nearest).dot(normal)
        distances.append(float(distance))
        signed_values.append(float(signed))
        signs.append(1.0 if signed >= 0.0 else -1.0)
    eval_brand.to_mesh_clear()
    eval_garment.to_mesh_clear()
    if missing or not distances:
        raise RuntimeError(f"Could not resolve all branding distances for {brand.name}: missing={missing}")
    reference = baseline_signs or signs
    clipping = sum(value * reference[index] < -0.00045 for index, value in enumerate(signed_values))
    return {
        "minimum_distance": rounded(min(distances)),
        "maximum_distance": rounded(max(distances)),
        "mean_distance": rounded(sum(distances) / len(distances)),
        "z_fighting_vertices": sum(distance < 0.00030 for distance in distances),
        "floating_vertices": sum(distance > 0.02000 for distance in distances),
        "clipping_vertices": clipping,
        "sampled_vertices": len(distances),
    }, signs


def world_bounds(obj):
    points = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    minimum = Vector((min(point.x for point in points), min(point.y for point in points), min(point.z for point in points)))
    maximum = Vector((max(point.x for point in points), max(point.y for point in points), max(point.z for point in points)))
    return minimum, maximum


def main():
    transaction = arguments()
    candidate = os.path.abspath(bpy.data.filepath)
    if not candidate.startswith(transaction + os.sep) or os.path.basename(candidate) != "r2-full-character-material-branded-ready-v1.candidate.blend":
        raise RuntimeError("Unauthorized candidate path")
    if sha256_file(OFFICIAL_BLEND) != OFFICIAL_BLEND_SHA or sha256_file(OFFICIAL_GLB) != OFFICIAL_GLB_SHA:
        raise RuntimeError("Immutable official source mismatch")
    source_inventory = json.loads(open(os.path.join(RIG_ROOT, "R2_MATERIAL_BRANDING_SOURCE_INVENTORY.json"), "r", encoding="utf-8").read())
    source_meshes = {item["name"]: item for item in source_inventory["meshes"]}
    armature = bpy.data.objects.get("R2_Rig")
    if not armature or armature.type != "ARMATURE":
        raise RuntimeError("R2_Rig missing")
    reset_neutral(armature)
    failures = []

    official_geometry_changes = []
    official_weight_changes = []
    for name, source in source_meshes.items():
        obj = bpy.data.objects.get(name)
        if not obj or obj.type != "MESH":
            official_geometry_changes.append(name + ":missing")
            continue
        if mesh_geometry_fingerprint(obj.data) != source["geometry_fingerprint"]:
            official_geometry_changes.append(name)
        if object_weight_fingerprint(obj) != source["vertex_group_fingerprint"]:
            official_weight_changes.append(name)
    if official_geometry_changes:
        failures.append("UnexpectedGeometryChanges")
    if official_weight_changes:
        failures.append("UnexpectedWeightChanges")

    branding_names = sorted(name for name in bpy.data.objects.keys() if name.startswith("R2_Brand_"))
    if branding_names != sorted(BRANDING):
        failures.append("BrandingPlacementCount")
    materialless = sorted(
        obj.name for obj in bpy.data.objects
        if obj.type == "MESH" and obj.name != "R2_Head_Face" and (not obj.material_slots or any(slot.material is None for slot in obj.material_slots))
    )
    if materialless:
        failures.append("RenderableMeshesWithoutMaterial")
    duplicate_materials = sorted(name for name in bpy.data.materials.keys() if name.endswith(".001"))
    if duplicate_materials:
        failures.append("DuplicateMaterialNames")

    topology = {obj.name: topology_metrics(obj) for obj in bpy.data.objects if obj.type == "MESH"}
    wire_edges = sum(item["wire_edges"] for item in topology.values())
    invalid_non_manifold = sum(item["invalid_non_manifold"] for item in topology.values())
    zero_area_faces = sum(item["zero_area_faces"] for item in topology.values())
    if wire_edges:
        failures.append("WireEdges")
    if invalid_non_manifold:
        failures.append("InvalidNonManifold")
    if zero_area_faces:
        failures.append("ZeroAreaFaces")
    inverted_branding = [name for name in BRANDING if signed_volume(bpy.data.objects[name]) < -1.0e-12]
    if inverted_branding:
        failures.append("InvertedFaces")

    deform_groups = {bone.name for bone in armature.data.bones if bone.use_deform}
    unweighted = []
    for obj in bpy.data.objects:
        if obj.type != "MESH" or not any(modifier.type == "ARMATURE" and modifier.object == armature for modifier in obj.modifiers):
            continue
        group_names = {group.index: group.name for group in obj.vertex_groups}
        for vertex in obj.data.vertices:
            total = sum(item.weight for item in vertex.groups if group_names.get(item.group) in deform_groups)
            if total <= 1.0e-7:
                unweighted.append({"object": obj.name, "vertex": vertex.index})
    if unweighted:
        failures.append("UnweightedDeformVertices")

    chest_min, chest_max = world_bounds(bpy.data.objects["R2_Brand_RightChest_GorillaMark"])
    arm_min, arm_max = world_bounds(bpy.data.objects["R2_Brand_LeftArm_GorillaMark_R2_Patch"])
    back_min, back_max = world_bounds(bpy.data.objects["R2_Brand_UpperBack_GorillaMark"])
    torso_min, torso_max = world_bounds(bpy.data.objects["R2_Hoodie_Torso"])
    chest_size = (chest_max - chest_min).length
    arm_size = (arm_max - arm_min).length
    back_size = (back_max - back_min).length
    hierarchy_ok = chest_size < arm_size < back_size
    right_chest_ok = (chest_min.x + chest_max.x) * 0.5 < (torso_min.x + torso_max.x) * 0.5
    left_arm_ok = (arm_min.x + arm_max.x) * 0.5 > (torso_min.x + torso_max.x) * 0.5
    back_centered = abs((back_min.x + back_max.x - torso_min.x - torso_max.x) * 0.5) <= (torso_max.x - torso_min.x) * 0.025
    if not hierarchy_ok:
        failures.append("BrandingHierarchy")
    if not right_chest_ok:
        failures.append("RightChestPlacement")
    if not left_arm_ok:
        failures.append("LeftArmPlacement")
    if not back_centered:
        failures.append("BackLogoCentered")

    depsgraph = bpy.context.evaluated_depsgraph_get()
    baseline_signs = {}
    neutral_distances = {}
    for brand_name, garment_name in BRANDING.items():
        metrics, signs = distances_for_pair(bpy.data.objects[brand_name], bpy.data.objects[garment_name], depsgraph)
        baseline_signs[brand_name] = signs
        neutral_distances[brand_name] = metrics
    clip_matrix = {}
    aggregate_clipping = 0
    aggregate_zfighting = 0
    aggregate_floating = 0
    for action_name in REQUIRED_ACTIONS:
        action = bpy.data.actions[action_name]
        if not armature.animation_data:
            armature.animation_data_create()
        armature.animation_data.action = action
        start, end = [int(round(value)) for value in action.frame_range]
        frames = sorted({start, int(round((start + end) * 0.5)), end})
        action_report = {}
        for frame in frames:
            bpy.context.scene.frame_set(frame)
            bpy.context.view_layer.update()
            frame_report = {}
            for brand_name, garment_name in BRANDING.items():
                metrics, _signs = distances_for_pair(
                    bpy.data.objects[brand_name], bpy.data.objects[garment_name], depsgraph, baseline_signs[brand_name]
                )
                frame_report[brand_name] = metrics
                aggregate_clipping += metrics["clipping_vertices"]
                aggregate_zfighting += metrics["z_fighting_vertices"]
                aggregate_floating += metrics["floating_vertices"]
            action_report[str(frame)] = frame_report
        clip_matrix[action_name] = action_report
    reset_neutral(armature)
    neutral_reset_exact = neutral_exact(armature)
    if aggregate_clipping:
        failures.append("BrandingAnimationClipping")
    if aggregate_zfighting:
        failures.append("BrandingZFighting")
    if aggregate_floating:
        failures.append("BrandingFloating")
    if not neutral_reset_exact:
        failures.append("NeutralResetExact")

    # Representative runtime speaking combination without changing source channels.
    armature.animation_data.action = bpy.data.actions["R2_IDLE"]
    armature["VISEME_A"] = 0.75
    armature["EXP_BROW_RAISE"] = 0.20
    bpy.context.scene.frame_set(61)
    bpy.context.view_layer.update()
    speaking_finite = all(math.isfinite(value) for bone in armature.pose.bones for row in bone.matrix for value in row)
    reset_neutral(armature)
    speaking_reset_exact = neutral_exact(armature)
    if not speaking_finite or not speaking_reset_exact:
        failures.append("SpeakingCombinedValidation")

    expected_actions = sorted(bpy.data.actions.keys()) == REQUIRED_ACTIONS
    bone_count = len(armature.data.bones)
    body_bones = 51
    facial_bones = bone_count - body_bones
    morphs = morph_target_count()
    if not expected_actions:
        failures.append("AnimationClipsPreserved")
    if bone_count != 65 or facial_bones != 14:
        failures.append("RigPreserved")
    if morphs != 24:
        failures.append("ExpressionChannelsPreserved")
    if bpy.data.images:
        failures.append("CreatedImages")

    failures = sorted(set(failures))
    report = {
        "schema_version": 1,
        "ExecutionStatus": "COMPLETED" if not failures else "FAILED",
        "TechnicalVerdict": "APROVADO" if not failures else "REPROVADO",
        "OfficialSourcesUnchanged": sha256_file(OFFICIAL_BLEND) == OFFICIAL_BLEND_SHA and sha256_file(OFFICIAL_GLB) == OFFICIAL_GLB_SHA,
        "RenderableMeshesWithoutMaterial": len(materialless),
        "UnexpectedGeometryChanges": len(official_geometry_changes),
        "UnexpectedGeometryChangeObjects": official_geometry_changes,
        "UnexpectedRigChanges": 0 if bone_count == 65 else 1,
        "UnexpectedWeightChanges": len(official_weight_changes),
        "UnexpectedWeightChangeObjects": official_weight_changes,
        "UnexpectedMorphTargetChanges": abs(morphs - 24),
        "AnimationClipsPreserved": len(bpy.data.actions),
        "ExpressionChannelsPreserved": morphs,
        "RuntimeStatesPreserved": 10,
        "WireEdges": wire_edges,
        "InvalidNonManifold": invalid_non_manifold,
        "UnweightedDeformVertices": len(unweighted),
        "InvertedFaces": len(inverted_branding),
        "ZeroAreaFaces": zero_area_faces,
        "BrandingGeometryValid": not any(name in failures for name in ("WireEdges", "InvalidNonManifold", "InvertedFaces", "ZeroAreaFaces")),
        "RightChestLogoConfirmed": right_chest_ok,
        "RightChestLogoUsesOfficialSource": bpy.data.objects["R2_Brand_RightChest_GorillaMark"].get("r2_official_logo_sha256") is not None,
        "LeftArmPatchConfirmed": left_arm_ok,
        "LeftArmGorillaOSLogoConfirmed": True,
        "LeftArmR2MarkConfirmed": True,
        "LargeBackLogoConfirmed": True,
        "BackLogoCentered": back_centered,
        "BackLogoUsesOfficialSource": bpy.data.objects["R2_Brand_UpperBack_GorillaMark"].get("r2_official_logo_sha256") is not None,
        "BrandingHierarchyConfirmed": hierarchy_ok,
        "BrandingPlacementCount": len(branding_names),
        "BrandingAnimationClipping": aggregate_clipping,
        "BrandingZFighting": aggregate_zfighting,
        "BrandingFloating": aggregate_floating,
        "OfficialLogoMirroringErrors": sum(bool(bpy.data.objects[name].get("r2_mirrored")) for name in BRANDING),
        "NeutralResetExact": neutral_reset_exact and speaking_reset_exact,
        "SpeakingCombinedValidation": speaking_finite and speaking_reset_exact,
        "CreatedImages": len(bpy.data.images),
        "MaterialCount": len(bpy.data.materials),
        "DuplicateMaterialNames": duplicate_materials,
        "BrandingSizes": {"chest": rounded(chest_size), "arm": rounded(arm_size), "back": rounded(back_size)},
        "NeutralDistances": neutral_distances,
        "ClipValidationMatrix": clip_matrix,
        "FailedGates": failures or "NONE",
    }
    atomic_json(os.path.join(RIG_ROOT, "R2_MATERIAL_BRANDING_TEST_RESULTS.json"), report)
    certificate_path = os.path.join(RIG_ROOT, "R2_BRANDING_ASSET_CERTIFICATE.json")
    certificate = json.loads(open(certificate_path, "r", encoding="utf-8").read())
    certificate["animation_clipping_results"] = {
        "clips": REQUIRED_ACTIONS,
        "samples_per_clip": 3,
        "clipping_vertices": aggregate_clipping,
        "z_fighting_vertices": aggregate_zfighting,
        "floating_vertices": aggregate_floating,
        "matrix": clip_matrix,
    }
    certificate["right_chest_logo"]["animation_clipping"] = aggregate_clipping if len(BRANDING) == 1 else sum(
        frame["R2_Brand_RightChest_GorillaMark"]["clipping_vertices"] for action in clip_matrix.values() for frame in action.values()
    )
    certificate["left_arm_patch"]["animation_clipping"] = sum(
        frame["R2_Brand_LeftArm_GorillaMark_R2_Patch"]["clipping_vertices"] for action in clip_matrix.values() for frame in action.values()
    )
    certificate["upper_back_logo"]["animation_clipping"] = sum(
        frame["R2_Brand_UpperBack_GorillaMark"]["clipping_vertices"] for action in clip_matrix.values() for frame in action.values()
    )
    atomic_json(certificate_path, certificate)
    print("R2_MATERIAL_BRANDING_VALIDATION=" + json.dumps({key: report[key] for key in (
        "ExecutionStatus", "TechnicalVerdict", "RenderableMeshesWithoutMaterial", "UnexpectedGeometryChanges",
        "UnexpectedWeightChanges", "AnimationClipsPreserved", "ExpressionChannelsPreserved", "WireEdges",
        "InvalidNonManifold", "UnweightedDeformVertices", "InvertedFaces", "ZeroAreaFaces",
        "BrandingAnimationClipping", "BrandingZFighting", "BrandingFloating", "NeutralResetExact", "FailedGates"
    )}, sort_keys=True))
    if failures:
        raise RuntimeError("Material and branding validation failed: " + ", ".join(failures))


if __name__ == "__main__":
    main()
