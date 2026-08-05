import bpy
import hashlib
import importlib.util
import json
import math
import os
import sys


RIG_ROOT = r"C:\Projetos\consorcio-os\web\blender\r2-rig"
SOURCE_BLEND = os.path.join(RIG_ROOT, "r2-full-character-material-branded-ready-v1", "r2-full-character-material-branded-ready-v1.blend")
SOURCE_BLEND_SHA256 = "AD7501A2828DAA76749C6ABE367597F1645BB79C1A205E83BED265B556F52E57"
SOURCE_GLB = r"C:\Projetos\consorcio-os\web\public\models\r2\r2-full-character-material-branded-ready-v1.glb"
SOURCE_GLB_SHA256 = "1F693EBB12E36965786C426CC07AF5FD6775CADFD81542236518103C6541E6AB"
PATCH = "R2_Brand_LeftArm_GorillaMark_R2_Patch"
BRANDING = {
    "R2_Brand_RightChest_GorillaMark": "R2_Hoodie_Torso",
    PATCH: "R2_Hoodie_Sleeve_L",
    "R2_Brand_UpperBack_GorillaMark": "R2_Hoodie_Torso",
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


def load_module(name, filename):
    spec = importlib.util.spec_from_file_location(name, os.path.join(RIG_ROOT, filename))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def arguments():
    values = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    if len(values) != 2:
        raise RuntimeError("Usage: -- <candidate-blend> <output-json>")
    return os.path.abspath(values[0]), os.path.abspath(values[1])


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


def material_state(material, branding):
    principled = [node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED"] if material.use_nodes else []
    outputs = [node for node in material.node_tree.nodes if node.type == "OUTPUT_MATERIAL"] if material.use_nodes else []
    if len(principled) != 1 or len(outputs) != 1:
        raise RuntimeError(f"Non-canonical material nodes: {material.name}")
    node = principled[0]
    base = tuple(node.inputs["Base Color"].default_value)
    return {
        "hex": material.get("r2_srgb_hex"),
        "base_linear": branding.vector(base),
        "roughness": branding.rounded(node.inputs["Roughness"].default_value),
        "metallic": branding.rounded(node.inputs["Metallic"].default_value),
        "image_texture_nodes": sum(item.type == "TEX_IMAGE" for item in material.node_tree.nodes),
    }


def main():
    candidate, output = arguments()
    branding = load_module("r2_material_branding_validation_helpers", "R2_BUILD_MATERIAL_BRANDING.py")
    validation = load_module("r2_material_branding_deformation_helpers", "R2_VALIDATE_MATERIAL_BRANDING.py")
    if sha256_file(SOURCE_BLEND) != SOURCE_BLEND_SHA256 or sha256_file(SOURCE_GLB) != SOURCE_GLB_SHA256:
        raise RuntimeError("Immutable V1 source hash mismatch")
    bpy.ops.wm.open_mainfile(filepath=SOURCE_BLEND)
    source_armature = bpy.data.objects["R2_Rig"]
    branding.reset_neutral(source_armature)
    source_geometry = {obj.name: branding.mesh_geometry_fingerprint(obj.data) for obj in bpy.data.objects if obj.type == "MESH"}
    source_weights = {obj.name: branding.object_weight_fingerprint(obj) for obj in bpy.data.objects if obj.type == "MESH"}
    source_armature_hash = branding.armature_fingerprint(source_armature)
    source_material_names = sorted(bpy.data.materials.keys())
    source_materials = {material.name: material_state(material, branding) for material in bpy.data.materials}
    source_patch_geometry = source_geometry[PATCH]
    source_patch_weights = source_weights[PATCH]
    bpy.ops.wm.open_mainfile(filepath=candidate)
    candidate_hash = sha256_file(candidate)
    armature = bpy.data.objects.get("R2_Rig")
    if not armature or armature.type != "ARMATURE":
        raise RuntimeError("Candidate R2_Rig is missing")
    branding.reset_neutral(armature)
    failures = []
    geometry_changes = []
    weight_changes = []
    for name, expected in source_geometry.items():
        obj = bpy.data.objects.get(name)
        if not obj or obj.type != "MESH":
            geometry_changes.append(name + ":missing")
            continue
        actual_geometry = branding.mesh_geometry_fingerprint(obj.data)
        actual_weights = branding.object_weight_fingerprint(obj)
        if actual_geometry != expected:
            geometry_changes.append(name)
        if actual_weights != source_weights[name]:
            weight_changes.append(name)
    if geometry_changes != [PATCH]:
        failures.append("UnauthorizedGeometryChanges")
    if weight_changes != [PATCH]:
        failures.append("UnauthorizedWeightChanges")
    if branding.armature_fingerprint(armature) != source_armature_hash:
        failures.append("RigChanged")
    materials = sorted(bpy.data.materials.keys())
    if materials != source_material_names or len(materials) != 17:
        failures.append("MaterialIdentityChanged")
    changed_materials = []
    image_texture_nodes = 0
    for name in materials:
        state = material_state(bpy.data.materials[name], branding)
        image_texture_nodes += state["image_texture_nodes"]
        if name in EXPECTED_V2:
            expected_hex, expected_roughness, expected_metallic = EXPECTED_V2[name]
            if state["hex"] != expected_hex or abs(state["roughness"] - expected_roughness) > 1.0e-6 or abs(state["metallic"] - expected_metallic) > 1.0e-6:
                failures.append("MaterialPaletteMismatch:" + name)
            changed_materials.append({"name": name, "before": source_materials[name], "after": state})
        elif state != source_materials[name]:
            failures.append("UnauthorizedMaterialParameterChange:" + name)
    if image_texture_nodes or bpy.data.images or bpy.data.libraries:
        failures.append("ExternalOrImageDependencies")
    materialless = [
        obj.name for obj in bpy.data.objects
        if obj.type == "MESH" and not obj.hide_render and (not obj.material_slots or any(slot.material is None for slot in obj.material_slots))
    ]
    if materialless:
        failures.append("RenderableMeshesWithoutMaterial")
    patch = bpy.data.objects.get(PATCH)
    if not patch or patch.type != "MESH":
        failures.append("PatchMissing")
    else:
        patch_materials = [slot.material.name if slot.material else None for slot in patch.material_slots]
        if patch_materials != ["R2_Mat_Embroidery_Gray", "R2_Mat_Embroidery_White"]:
            failures.append("PatchMaterialContrast")
        if patch.get("r2_designation") != "R2" or patch.get("r2_designation_material") != "R2_Mat_Embroidery_White":
            failures.append("PatchDesignationIdentity")
    topology = {name: validation.topology_metrics(bpy.data.objects[name]) for name in BRANDING}
    if any(any(metrics[key] != 0 for key in ("wire_edges", "boundary_edges", "invalid_non_manifold", "zero_area_faces")) for metrics in topology.values()):
        failures.append("BrandingTopology")
    deform_groups = {bone.name for bone in armature.data.bones if bone.use_deform}
    unweighted = []
    for obj in bpy.data.objects:
        if obj.type != "MESH" or not any(modifier.type == "ARMATURE" and modifier.object == armature for modifier in obj.modifiers):
            continue
        group_names = {group.index: group.name for group in obj.vertex_groups}
        for vertex in obj.data.vertices:
            total = sum(item.weight for item in vertex.groups if group_names.get(item.group) in deform_groups)
            if total <= 1.0e-7:
                unweighted.append((obj.name, vertex.index))
    if unweighted:
        failures.append("UnweightedDeformVertices")
    depsgraph = bpy.context.evaluated_depsgraph_get()
    baseline_signs = {}
    neutral_distances = {}
    for brand_name, garment_name in BRANDING.items():
        metrics, signs = validation.distances_for_pair(bpy.data.objects[brand_name], bpy.data.objects[garment_name], depsgraph)
        baseline_signs[brand_name] = signs
        neutral_distances[brand_name] = metrics
    clip_matrix = {}
    aggregate = {"clipping_vertices": 0, "z_fighting_vertices": 0, "floating_vertices": 0}
    for action_name in EXPECTED_ACTIONS:
        action = bpy.data.actions[action_name]
        if not armature.animation_data:
            armature.animation_data_create()
        armature.animation_data.action = action
        start, end = [int(round(value)) for value in action.frame_range]
        frames = sorted({start, int(round((start + end) * 0.5)), end})
        clip_matrix[action_name] = {}
        for frame in frames:
            bpy.context.scene.frame_set(frame)
            bpy.context.view_layer.update()
            clip_matrix[action_name][str(frame)] = {}
            for brand_name, garment_name in BRANDING.items():
                metrics, _ = validation.distances_for_pair(
                    bpy.data.objects[brand_name], bpy.data.objects[garment_name], depsgraph, baseline_signs[brand_name]
                )
                clip_matrix[action_name][str(frame)][brand_name] = metrics
                for key in aggregate:
                    aggregate[key] += metrics[key]
    branding.reset_neutral(armature)
    neutral_reset = validation.neutral_exact(armature)
    if any(aggregate.values()):
        failures.append("BrandingDeformation")
    if not neutral_reset:
        failures.append("NeutralReset")
    if len(bpy.data.objects) != 36 or len([obj for obj in bpy.data.objects if obj.type == "MESH"]) != 30:
        failures.append("ObjectOrMeshCount")
    renderable_count = len([obj for obj in bpy.data.objects if obj.type == "MESH" and not obj.hide_render])
    if renderable_count != 29:
        failures.append("RenderableMeshCount")
    if len(armature.data.bones) != 65:
        failures.append("BoneCount")
    morphs = branding.morph_target_count()
    if morphs != 24:
        failures.append("MorphTargetCount")
    actions = sorted(action.name for action in bpy.data.actions)
    if actions != EXPECTED_ACTIONS:
        failures.append("AnimationIdentity")
    cloth_fur_materials = ["R2_Mat_Fur_DarkGraphite", "R2_Mat_Fur_MidGraphite", "R2_Mat_Hoodie_Black", "R2_Mat_Pants_Charcoal"]
    cloth_fur_metallic = {name: material_state(bpy.data.materials[name], branding)["metallic"] for name in cloth_fur_materials}
    if any(value != 0.0 for value in cloth_fur_metallic.values()):
        failures.append("ClothOrFurMetallic")
    failures = sorted(set(failures))
    report = {
        "schema_version": 1,
        "ExecutionStatus": "COMPLETED" if not failures else "FAILED",
        "TechnicalVerdict": "APROVADO" if not failures else "REPROVADO",
        "SourceBlend": SOURCE_BLEND,
        "SourceBlendSHA256": SOURCE_BLEND_SHA256,
        "CandidateBlend": candidate,
        "CandidateBlendSHA256": candidate_hash,
        "CandidateBlendSizeBytes": os.path.getsize(candidate),
        "ObjectCount": len(bpy.data.objects),
        "MeshCount": len([obj for obj in bpy.data.objects if obj.type == "MESH"]),
        "RenderableMeshCount": renderable_count,
        "RenderableMeshesWithoutMaterial": materialless,
        "MaterialCount": len(bpy.data.materials),
        "Materials": materials,
        "ChangedMaterials": changed_materials,
        "ClothAndFurMetallic": cloth_fur_metallic,
        "ImageTextureNodes": image_texture_nodes,
        "Images": len(bpy.data.images),
        "ExternalLibraries": len(bpy.data.libraries),
        "BoneCount": len(armature.data.bones),
        "MorphTargetOccurrences": morphs,
        "AnimationCount": len(actions),
        "Animations": actions,
        "AuthorizedGeometryChanges": geometry_changes,
        "AuthorizedWeightChanges": weight_changes,
        "PatchGeometrySHA256Before": source_patch_geometry,
        "PatchGeometrySHA256After": branding.mesh_geometry_fingerprint(patch.data),
        "PatchWeightsSHA256Before": source_patch_weights,
        "PatchWeightsSHA256After": branding.object_weight_fingerprint(patch),
        "PatchMaterialSlots": [slot.material.name if slot.material else None for slot in patch.material_slots],
        "PatchScaleDeltaPercent": patch.get("r2_patch_scale_delta_percent"),
        "DesignationScaleDeltaPercent": patch.get("r2_designation_scale_delta_percent"),
        "PatchDesignation": patch.get("r2_designation"),
        "PatchDesignationMaterial": patch.get("r2_designation_material"),
        "BrandingTopology": topology,
        "UnweightedDeformVertices": len(unweighted),
        "NeutralDistances": neutral_distances,
        "ClipValidationMatrix": clip_matrix,
        "BrandingClippingVertices": aggregate["clipping_vertices"],
        "BrandingZFightingVertices": aggregate["z_fighting_vertices"],
        "BrandingFloatingVertices": aggregate["floating_vertices"],
        "NeutralResetExact": neutral_reset,
        "OfficialSourcesUnchanged": sha256_file(SOURCE_BLEND) == SOURCE_BLEND_SHA256 and sha256_file(SOURCE_GLB) == SOURCE_GLB_SHA256,
        "FailedGates": failures or "NONE",
    }
    atomic_json(output, report)
    print("R2_COLOR_READABILITY_V2_VALIDATION=" + json.dumps({key: report[key] for key in (
        "ExecutionStatus", "TechnicalVerdict", "ObjectCount", "MeshCount", "RenderableMeshCount",
        "MaterialCount", "BoneCount", "MorphTargetOccurrences", "AnimationCount",
        "BrandingClippingVertices", "BrandingZFightingVertices", "BrandingFloatingVertices",
        "NeutralResetExact", "OfficialSourcesUnchanged", "FailedGates"
    )}, sort_keys=True))
    if failures:
        raise RuntimeError("V2 validation failed: " + ", ".join(failures))


if __name__ == "__main__":
    main()
