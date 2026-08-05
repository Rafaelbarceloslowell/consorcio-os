import bpy
import hashlib
import json
import math
import os
import sys
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
        raise RuntimeError("Expected -- <transaction-directory-or-glb-path>")
    values = argv[argv.index("--") + 1 :]
    if len(values) != 1:
        raise RuntimeError("Expected exactly one transaction directory or GLB path")
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


def rounded(value):
    return round(float(value), 9)


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
    bpy.context.scene.frame_set(1)
    bpy.context.view_layer.update()


def neutral_exact(armature):
    tolerance = 1.0e-7
    return all(
        bone.location.length <= tolerance
        and abs(bone.rotation_quaternion.w - 1.0) <= tolerance
        and Vector((bone.rotation_quaternion.x, bone.rotation_quaternion.y, bone.rotation_quaternion.z)).length <= tolerance
        and (bone.scale - Vector((1.0, 1.0, 1.0))).length <= tolerance
        for bone in armature.pose.bones
    )


def morph_target_count():
    return sum(max(0, len(obj.data.shape_keys.key_blocks) - 1) for obj in bpy.data.objects if obj.type == "MESH" and obj.data.shape_keys)


def world_bounds(obj):
    points = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    minimum = Vector((min(point.x for point in points), min(point.y for point in points), min(point.z for point in points)))
    maximum = Vector((max(point.x for point in points), max(point.y for point in points), max(point.z for point in points)))
    return minimum, maximum


def evaluated_geometry(obj, depsgraph):
    evaluated = obj.evaluated_get(depsgraph)
    mesh = evaluated.to_mesh(preserve_all_data_layers=False, depsgraph=depsgraph)
    return evaluated, mesh, evaluated.matrix_world.copy()


def distances(brand, garment, depsgraph, signs=None):
    eval_garment, garment_mesh, garment_matrix = evaluated_geometry(garment, depsgraph)
    vertices = [garment_matrix @ vertex.co for vertex in garment_mesh.vertices]
    polygons = [tuple(polygon.vertices) for polygon in garment_mesh.polygons]
    bvh = BVHTree.FromPolygons(vertices, polygons, all_triangles=False)
    eval_brand, brand_mesh, brand_matrix = evaluated_geometry(brand, depsgraph)
    values = []
    signed_values = []
    observed_signs = []
    for vertex in brand_mesh.vertices:
        point = brand_matrix @ vertex.co
        nearest, normal, _face, distance = bvh.find_nearest(point, 0.05)
        if nearest is None:
            raise RuntimeError(f"Round-trip branding vertex detached: {brand.name}:{vertex.index}")
        signed = (point - nearest).dot(normal)
        values.append(float(distance))
        signed_values.append(float(signed))
        observed_signs.append(1.0 if signed >= 0 else -1.0)
    eval_brand.to_mesh_clear()
    eval_garment.to_mesh_clear()
    reference = signs or observed_signs
    return {
        "minimum": rounded(min(values)),
        "maximum": rounded(max(values)),
        "clipping": sum(value * reference[index] < -0.00045 for index, value in enumerate(signed_values)),
        "z_fighting": sum(value < 0.00020 for value in values),
        "floating": sum(value > 0.02000 for value in values),
        "vertices": len(values),
    }, observed_signs


def material_manifest():
    result = {}
    for material in bpy.data.materials:
        principled = next((node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None) if material.use_nodes else None
        result[material.name] = {
            "base_color": [rounded(value) for value in principled.inputs["Base Color"].default_value] if principled else None,
            "metallic": rounded(principled.inputs["Metallic"].default_value) if principled else None,
            "roughness": rounded(principled.inputs["Roughness"].default_value) if principled else None,
            "images": sum(node.type == "TEX_IMAGE" for node in material.node_tree.nodes) if material.use_nodes else 0,
        }
    return result


def main():
    source_argument = arguments()
    post_publication = os.path.isfile(source_argument) and source_argument.lower().endswith(".glb")
    glb_path = source_argument if post_publication else os.path.join(source_argument, "r2-full-character-material-branded-ready-v1.candidate.glb")
    export_report = json.loads(open(os.path.join(RIG_ROOT, "R2_MATERIAL_BRANDING_EXPORT_REPORT.json"), "r", encoding="utf-8").read())
    if sha256_file(glb_path) != export_report["glb_sha256"] or export_report["TechnicalVerdict"] != "APROVADO":
        raise RuntimeError("Round-trip source differs from approved export")
    if sha256_file(OFFICIAL_BLEND) != OFFICIAL_BLEND_SHA or sha256_file(OFFICIAL_GLB) != OFFICIAL_GLB_SHA:
        raise RuntimeError("Immutable official source mismatch")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=glb_path)
    failures = []
    armatures = [obj for obj in bpy.data.objects if obj.type == "ARMATURE"]
    armature = armatures[0] if len(armatures) == 1 else None
    if not armature or armature.name != "R2_Rig" or len(armature.data.bones) != 65:
        failures.append("RigRoundTrip")
    missing_branding = sorted(set(BRANDING) - set(bpy.data.objects.keys()))
    if missing_branding:
        failures.append("BrandingRoundTripIdentity")
    material_names = sorted(bpy.data.materials.keys())
    if len(material_names) != 17 or any(name.endswith(".001") for name in material_names):
        failures.append("MaterialsRoundTripIdentity")
    materials = material_manifest()
    if any(record["images"] for record in materials.values()) or bpy.data.images:
        failures.append("RoundTripImages")
    exported_node_names = set(export_report["node_names"])
    materialless = sorted(
        obj.name for obj in bpy.data.objects
        if obj.type == "MESH" and obj.name in exported_node_names
        and (not obj.material_slots or any(slot.material is None for slot in obj.material_slots))
    )
    if materialless:
        failures.append("RoundTripMissingMaterials")
    assignments = {
        name: [slot.material.name if slot.material else None for slot in bpy.data.objects[name].material_slots]
        for name in BRANDING if name in bpy.data.objects
    }
    expected_assignments = {
        "R2_Brand_RightChest_GorillaMark": {"R2_Mat_Embroidery_Gray", "R2_Mat_Embroidery_White"},
        "R2_Brand_LeftArm_GorillaMark_R2_Patch": {"R2_Mat_Embroidery_Gray", "R2_Mat_Embroidery_White", "R2_Mat_GorillaOS_Green"},
        "R2_Brand_UpperBack_GorillaMark": {"R2_Mat_Embroidery_Gray", "R2_Mat_Embroidery_White"},
    }
    if any(set(assignments.get(name, [])) != expected for name, expected in expected_assignments.items()):
        failures.append("BrandingMaterialAssignmentsRoundTrip")
    actions = sorted(bpy.data.actions.keys())
    if actions != REQUIRED_ACTIONS:
        failures.append("AnimationClipsRoundTrip")
    morphs = morph_target_count()
    if morphs != 24:
        failures.append("MorphTargetsRoundTrip")

    hierarchy_ok = False
    placement = {}
    distance_matrix = {}
    aggregate = {"clipping": 0, "z_fighting": 0, "floating": 0}
    neutral_reset = False
    if armature and not missing_branding:
        reset_neutral(armature)
        chest_min, chest_max = world_bounds(bpy.data.objects["R2_Brand_RightChest_GorillaMark"])
        arm_min, arm_max = world_bounds(bpy.data.objects["R2_Brand_LeftArm_GorillaMark_R2_Patch"])
        back_min, back_max = world_bounds(bpy.data.objects["R2_Brand_UpperBack_GorillaMark"])
        torso_min, torso_max = world_bounds(bpy.data.objects["R2_Hoodie_Torso"])
        sizes = {"chest": (chest_max - chest_min).length, "arm": (arm_max - arm_min).length, "back": (back_max - back_min).length}
        hierarchy_ok = sizes["chest"] < sizes["arm"] < sizes["back"]
        placement = {
            "right_chest": (chest_min.x + chest_max.x) * 0.5 < (torso_min.x + torso_max.x) * 0.5,
            "left_arm": (arm_min.x + arm_max.x) * 0.5 > (torso_min.x + torso_max.x) * 0.5,
            "back_centered": abs((back_min.x + back_max.x - torso_min.x - torso_max.x) * 0.5) <= (torso_max.x - torso_min.x) * 0.025,
            "sizes": {key: rounded(value) for key, value in sizes.items()},
        }
        if not hierarchy_ok:
            failures.append("BrandingHierarchyRoundTrip")
        if not all(value for key, value in placement.items() if key != "sizes"):
            failures.append("BrandingPlacementRoundTrip")
        depsgraph = bpy.context.evaluated_depsgraph_get()
        baseline = {}
        for brand_name, garment_name in BRANDING.items():
            metrics, signs = distances(bpy.data.objects[brand_name], bpy.data.objects[garment_name], depsgraph)
            baseline[brand_name] = signs
        for action_name in REQUIRED_ACTIONS:
            armature.animation_data.action = bpy.data.actions[action_name]
            start, end = [int(round(value)) for value in bpy.data.actions[action_name].frame_range]
            frame = int(round((start + end) * 0.5))
            bpy.context.scene.frame_set(frame)
            bpy.context.view_layer.update()
            distance_matrix[action_name] = {}
            for brand_name, garment_name in BRANDING.items():
                metrics, _signs = distances(bpy.data.objects[brand_name], bpy.data.objects[garment_name], depsgraph, baseline[brand_name])
                distance_matrix[action_name][brand_name] = metrics
                for key in aggregate:
                    aggregate[key] += metrics[key]
        if any(aggregate.values()):
            failures.append("BrandingDeformationRoundTrip")
        reset_neutral(armature)
        neutral_reset = neutral_exact(armature)
        if not neutral_reset:
            failures.append("NeutralResetRoundTrip")

    failures = sorted(set(failures))
    report = {
        "schema_version": 1,
        "ExecutionStatus": "COMPLETED" if not failures else "FAILED",
        "TechnicalVerdict": "APROVADO" if not failures else "REPROVADO",
        "glb": glb_path,
        "glb_sha256": sha256_file(glb_path),
        "GLBRoundTripApproved": not failures,
        "MaterialsRoundTripConfirmed": len(material_names) == 17 and not materialless,
        "RightChestBrandingRoundTripConfirmed": "R2_Brand_RightChest_GorillaMark" not in missing_branding,
        "LeftArmBrandingRoundTripConfirmed": "R2_Brand_LeftArm_GorillaMark_R2_Patch" not in missing_branding,
        "BackBrandingRoundTripConfirmed": "R2_Brand_UpperBack_GorillaMark" not in missing_branding,
        "AnimationClipsRoundTripConfirmed": actions == REQUIRED_ACTIONS,
        "MorphTargetsRoundTripConfirmed": morphs == 24,
        "BoneCount": len(armature.data.bones) if armature else 0,
        "MaterialCount": len(material_names),
        "MaterialManifest": materials,
        "MaterialAssignments": assignments,
        "RenderableMeshesWithoutMaterial": len(materialless),
        "CreatedImages": len(bpy.data.images),
        "BrandingHierarchyRoundTrip": hierarchy_ok,
        "BrandingPlacementRoundTrip": placement,
        "BrandingDeformationRoundTrip": aggregate,
        "ClipValidationMatrix": distance_matrix,
        "NeutralResetExact": neutral_reset,
        "ExternalDependencies": export_report["ExternalDependencies"],
        "FailedGates": failures or "NONE",
    }
    report_path = os.path.join(
        RIG_ROOT,
        "R2_MATERIAL_BRANDING_POST_PUBLICATION_GLB_ROUNDTRIP.json" if post_publication else "R2_MATERIAL_BRANDING_GLB_ROUNDTRIP.json",
    )
    report["PostPublication"] = post_publication
    atomic_json(report_path, report)
    certificate_path = os.path.join(RIG_ROOT, "R2_BRANDING_ASSET_CERTIFICATE.json")
    certificate = json.loads(open(certificate_path, "r", encoding="utf-8").read())
    identity = {"approved": not failures, "path": glb_path, "sha256": sha256_file(glb_path), "objects": sorted(BRANDING), "materials": assignments, "animation_clips": actions, "morph_targets": morphs, "bone_count": len(armature.data.bones) if armature else 0}
    certificate["published_glb_round_trip" if post_publication else "glb_round_trip_identities"] = identity
    atomic_json(certificate_path, certificate)
    print("R2_MATERIAL_BRANDING_GLB_ROUNDTRIP=" + json.dumps({key: report[key] for key in (
        "ExecutionStatus", "TechnicalVerdict", "GLBRoundTripApproved", "MaterialsRoundTripConfirmed",
        "RightChestBrandingRoundTripConfirmed", "LeftArmBrandingRoundTripConfirmed", "BackBrandingRoundTripConfirmed",
        "AnimationClipsRoundTripConfirmed", "MorphTargetsRoundTripConfirmed", "BoneCount", "MaterialCount",
        "RenderableMeshesWithoutMaterial", "CreatedImages", "BrandingDeformationRoundTrip", "NeutralResetExact", "FailedGates"
    )}, sort_keys=True))
    if failures:
        raise RuntimeError("GLB round-trip failed: " + ", ".join(failures))


if __name__ == "__main__":
    main()
