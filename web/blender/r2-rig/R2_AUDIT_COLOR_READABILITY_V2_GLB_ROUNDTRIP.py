import bpy
import hashlib
import importlib.util
import json
import os
import sys


RIG_ROOT = r"C:\Projetos\consorcio-os\web\blender\r2-rig"
SOURCE_BLEND = os.path.join(RIG_ROOT, "r2-full-character-material-branded-ready-v1", "r2-full-character-material-branded-ready-v1.blend")
SOURCE_BLEND_SHA256 = "AD7501A2828DAA76749C6ABE367597F1645BB79C1A205E83BED265B556F52E57"
SOURCE_GLB = r"C:\Projetos\consorcio-os\web\public\models\r2\r2-full-character-material-branded-ready-v1.glb"
SOURCE_GLB_SHA256 = "1F693EBB12E36965786C426CC07AF5FD6775CADFD81542236518103C6541E6AB"
BRANDING = {
    "R2_Brand_RightChest_GorillaMark": "R2_Hoodie_Torso",
    "R2_Brand_LeftArm_GorillaMark_R2_Patch": "R2_Hoodie_Sleeve_L",
    "R2_Brand_UpperBack_GorillaMark": "R2_Hoodie_Torso",
}
EXPECTED_ASSIGNMENTS = {
    "R2_Brand_RightChest_GorillaMark": {"R2_Mat_Embroidery_Gray", "R2_Mat_Embroidery_White"},
    "R2_Brand_LeftArm_GorillaMark_R2_Patch": {"R2_Mat_Embroidery_Gray", "R2_Mat_Embroidery_White"},
    "R2_Brand_UpperBack_GorillaMark": {"R2_Mat_Embroidery_Gray", "R2_Mat_Embroidery_White"},
}
EXPECTED_ACTIONS = [
    "R2_ALERT", "R2_AWAITING_ACTION", "R2_CELEBRATING_SALE", "R2_ERROR_ATTENTION",
    "R2_IDLE", "R2_LISTENING", "R2_NEUTRAL", "R2_THINKING", "R2_WORKING",
]
EXPECTED_V2 = {
    "R2_Mat_Fur_DarkGraphite": ("#2D312E", 0.80, 0.0),
    "R2_Mat_Fur_MidGraphite": ("#303431", 0.78, 0.0),
    "R2_Mat_Skin_Anthracite": ("#414743", 0.68, 0.0),
    "R2_Mat_Hoodie_Black": ("#4F5C3A", 0.82, 0.0),
    "R2_Mat_Pants_Charcoal": ("#363A3E", 0.78, 0.0),
    "R2_Mat_Shoes_Black": ("#141718", 0.54, 0.0),
}


def load_helpers():
    path = os.path.join(RIG_ROOT, "R2_AUDIT_MATERIAL_BRANDING_GLB_ROUNDTRIP.py")
    spec = importlib.util.spec_from_file_location("r2_v1_roundtrip_helpers", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def arguments():
    values = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    if len(values) not in (2, 3):
        raise RuntimeError("Usage: -- <glb-path> <output-json> [export-report]")
    return (
        os.path.abspath(values[0]),
        os.path.abspath(values[1]),
        os.path.abspath(values[2]) if len(values) == 3 else None,
    )


def sha256_file(path):
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest().upper()


def atomic_json(path, payload):
    with open(path + ".tmp", "w", encoding="utf-8", newline="\n") as handle:
        json.dump(payload, handle, indent=2, sort_keys=True)
        handle.write("\n")
    os.replace(path + ".tmp", path)


def srgb_channel_to_linear(value):
    value /= 255.0
    return value / 12.92 if value <= 0.04045 else ((value + 0.055) / 1.055) ** 2.4


def hex_linear(value):
    value = value.lstrip("#")
    return tuple(srgb_channel_to_linear(int(value[index:index + 2], 16)) for index in (0, 2, 4))


def main():
    glb_path, output, explicit_export_report = arguments()
    helpers = load_helpers()
    export_report_path = explicit_export_report or os.path.join(os.path.dirname(glb_path), "R2_COLOR_READABILITY_V2_EXPORT_REPORT.json")
    if not os.path.isfile(export_report_path):
        export_report_path = os.path.join(RIG_ROOT, "R2_COLOR_READABILITY_V2_EXPORT_REPORT.json")
    export_report = json.loads(open(export_report_path, "r", encoding="utf-8").read())
    if export_report.get("TechnicalVerdict") != "APROVADO" or sha256_file(glb_path) != export_report.get("glb_sha256"):
        raise RuntimeError("Round-trip input differs from approved V2 export")
    if sha256_file(SOURCE_BLEND) != SOURCE_BLEND_SHA256 or sha256_file(SOURCE_GLB) != SOURCE_GLB_SHA256:
        raise RuntimeError("Immutable V1 source hash mismatch")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=glb_path)
    failures = []
    armatures = [obj for obj in bpy.data.objects if obj.type == "ARMATURE"]
    armature = armatures[0] if len(armatures) == 1 else None
    if not armature or armature.name != "R2_Rig" or len(armature.data.bones) != 65:
        failures.append("RigRoundTrip")
    missing_branding = sorted(set(BRANDING) - set(bpy.data.objects.keys()))
    if missing_branding:
        failures.append("BrandingIdentityRoundTrip")
    material_names = sorted(bpy.data.materials.keys())
    if len(material_names) != 17 or any(name.endswith(".001") for name in material_names):
        failures.append("MaterialsIdentityRoundTrip")
    materials = helpers.material_manifest()
    if any(record["images"] for record in materials.values()) or bpy.data.images:
        failures.append("ImageDependenciesRoundTrip")
    palette_checks = {}
    for name, (expected_hex, expected_roughness, expected_metallic) in EXPECTED_V2.items():
        material = bpy.data.materials.get(name)
        if not material or not material.use_nodes:
            failures.append("MaterialMissingRoundTrip:" + name)
            continue
        principled = next((node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
        actual_color = tuple(principled.inputs["Base Color"].default_value[:3])
        expected_color = hex_linear(expected_hex)
        color_delta = max(abs(actual_color[index] - expected_color[index]) for index in range(3))
        roughness = float(principled.inputs["Roughness"].default_value)
        metallic = float(principled.inputs["Metallic"].default_value)
        passed = color_delta <= 2.0e-5 and abs(roughness - expected_roughness) <= 1.0e-5 and abs(metallic - expected_metallic) <= 1.0e-6
        palette_checks[name] = {
            "expected_hex": expected_hex,
            "color_max_linear_delta": round(color_delta, 9),
            "roughness": round(roughness, 9),
            "metallic": round(metallic, 9),
            "passed": passed,
        }
        if not passed:
            failures.append("MaterialParametersRoundTrip:" + name)
    exported_node_names = set(export_report["node_names"])
    materialless = sorted(
        obj.name for obj in bpy.data.objects
        if obj.type == "MESH" and obj.name in exported_node_names
        and (not obj.material_slots or any(slot.material is None for slot in obj.material_slots))
    )
    if materialless:
        failures.append("MissingMaterialsRoundTrip")
    assignments = {
        name: [slot.material.name if slot.material else None for slot in bpy.data.objects[name].material_slots]
        for name in BRANDING if name in bpy.data.objects
    }
    if any(set(assignments.get(name, [])) != expected for name, expected in EXPECTED_ASSIGNMENTS.items()):
        failures.append("BrandingMaterialAssignmentsRoundTrip")
    actions = sorted(bpy.data.actions.keys())
    if actions != EXPECTED_ACTIONS:
        failures.append("AnimationsRoundTrip")
    morphs = helpers.morph_target_count()
    if morphs != 24:
        failures.append("MorphTargetsRoundTrip")
    hierarchy_ok = False
    placement = {}
    distance_matrix = {}
    aggregate = {"clipping": 0, "z_fighting": 0, "floating": 0}
    neutral_reset = False
    if armature and not missing_branding:
        helpers.reset_neutral(armature)
        chest_min, chest_max = helpers.world_bounds(bpy.data.objects["R2_Brand_RightChest_GorillaMark"])
        arm_min, arm_max = helpers.world_bounds(bpy.data.objects["R2_Brand_LeftArm_GorillaMark_R2_Patch"])
        back_min, back_max = helpers.world_bounds(bpy.data.objects["R2_Brand_UpperBack_GorillaMark"])
        torso_min, torso_max = helpers.world_bounds(bpy.data.objects["R2_Hoodie_Torso"])
        sizes = {"chest": (chest_max - chest_min).length, "arm": (arm_max - arm_min).length, "back": (back_max - back_min).length}
        hierarchy_ok = sizes["chest"] < sizes["arm"] < sizes["back"]
        placement = {
            "right_chest": (chest_min.x + chest_max.x) * 0.5 < (torso_min.x + torso_max.x) * 0.5,
            "left_arm": (arm_min.x + arm_max.x) * 0.5 > (torso_min.x + torso_max.x) * 0.5,
            "back_centered": abs((back_min.x + back_max.x - torso_min.x - torso_max.x) * 0.5) <= (torso_max.x - torso_min.x) * 0.025,
        }
        if not hierarchy_ok or not all(placement.values()):
            failures.append("BrandingPlacementRoundTrip")
        depsgraph = bpy.context.evaluated_depsgraph_get()
        baseline = {}
        for brand_name, garment_name in BRANDING.items():
            _, signs = helpers.distances(bpy.data.objects[brand_name], bpy.data.objects[garment_name], depsgraph)
            baseline[brand_name] = signs
        for action_name in EXPECTED_ACTIONS:
            armature.animation_data.action = bpy.data.actions[action_name]
            start, end = [int(round(value)) for value in bpy.data.actions[action_name].frame_range]
            frame = int(round((start + end) * 0.5))
            bpy.context.scene.frame_set(frame)
            bpy.context.view_layer.update()
            distance_matrix[action_name] = {}
            for brand_name, garment_name in BRANDING.items():
                metrics, _ = helpers.distances(bpy.data.objects[brand_name], bpy.data.objects[garment_name], depsgraph, baseline[brand_name])
                distance_matrix[action_name][brand_name] = metrics
                for key in aggregate:
                    aggregate[key] += metrics[key]
        if any(aggregate.values()):
            failures.append("BrandingDeformationRoundTrip")
        helpers.reset_neutral(armature)
        neutral_reset = helpers.neutral_exact(armature)
        if not neutral_reset:
            failures.append("NeutralResetRoundTrip")
    failures = sorted(set(failures))
    report = {
        "schema_version": 1,
        "ExecutionStatus": "COMPLETED" if not failures else "FAILED",
        "TechnicalVerdict": "APROVADO" if not failures else "REPROVADO",
        "glb": glb_path,
        "glb_sha256": sha256_file(glb_path),
        "glb_size_bytes": os.path.getsize(glb_path),
        "GLBRoundTripApproved": not failures,
        "MaterialsRoundTripConfirmed": len(material_names) == 17 and not materialless,
        "PaletteRoundTrip": palette_checks,
        "MaterialCount": len(material_names),
        "MaterialNames": material_names,
        "MaterialManifest": materials,
        "MaterialAssignments": assignments,
        "RenderableMeshesWithoutMaterial": materialless,
        "CreatedImages": len(bpy.data.images),
        "BoneCount": len(armature.data.bones) if armature else 0,
        "MorphTargetOccurrences": morphs,
        "AnimationCount": len(actions),
        "Animations": actions,
        "BrandingHierarchyRoundTrip": hierarchy_ok,
        "BrandingPlacementRoundTrip": placement,
        "BrandingDeformationRoundTrip": aggregate,
        "ClipValidationMatrix": distance_matrix,
        "NeutralResetExact": neutral_reset,
        "ExternalDependencies": export_report["ExternalDependencies"],
        "OfficialSourcesUnchanged": sha256_file(SOURCE_BLEND) == SOURCE_BLEND_SHA256 and sha256_file(SOURCE_GLB) == SOURCE_GLB_SHA256,
        "FailedGates": failures or "NONE",
    }
    atomic_json(output, report)
    print("R2_COLOR_READABILITY_V2_GLB_ROUNDTRIP=" + json.dumps({key: report[key] for key in (
        "ExecutionStatus", "TechnicalVerdict", "GLBRoundTripApproved", "MaterialsRoundTripConfirmed",
        "MaterialCount", "RenderableMeshesWithoutMaterial", "CreatedImages", "BoneCount",
        "MorphTargetOccurrences", "AnimationCount", "BrandingDeformationRoundTrip",
        "NeutralResetExact", "ExternalDependencies", "OfficialSourcesUnchanged", "FailedGates"
    )}, sort_keys=True))
    if failures:
        raise RuntimeError("V2 GLB round-trip failed: " + ", ".join(failures))


if __name__ == "__main__":
    main()
