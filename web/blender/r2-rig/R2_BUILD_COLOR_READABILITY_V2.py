import bpy
import hashlib
import importlib.util
import json
import os
import sys
from collections import defaultdict, deque
from mathutils import Vector


RIG_ROOT = r"C:\Projetos\consorcio-os\web\blender\r2-rig"
SOURCE_BLEND = os.path.join(RIG_ROOT, "r2-full-character-material-branded-ready-v1", "r2-full-character-material-branded-ready-v1.blend")
SOURCE_BLEND_SHA256 = "AD7501A2828DAA76749C6ABE367597F1645BB79C1A205E83BED265B556F52E57"
SOURCE_GLB = r"C:\Projetos\consorcio-os\web\public\models\r2\r2-full-character-material-branded-ready-v1.glb"
SOURCE_GLB_SHA256 = "1F693EBB12E36965786C426CC07AF5FD6775CADFD81542236518103C6541E6AB"
CANDIDATE_NAME = "r2-full-character-color-readable-ready-v2.candidate.blend"
PATCH_NAME = "R2_Brand_LeftArm_GorillaMark_R2_Patch"
EXPECTED_ACTIONS = [
    "R2_ALERT",
    "R2_AWAITING_ACTION",
    "R2_CELEBRATING_SALE",
    "R2_ERROR_ATTENTION",
    "R2_IDLE",
    "R2_LISTENING",
    "R2_NEUTRAL",
    "R2_THINKING",
    "R2_WORKING",
]
MATERIAL_V2 = {
    "R2_Mat_Fur_DarkGraphite": {"hex": "#2D312E", "roughness": 0.80, "metallic": 0.0, "role": "head fur"},
    "R2_Mat_Fur_MidGraphite": {"hex": "#303431", "roughness": 0.78, "metallic": 0.0, "role": "exposed arm fur"},
    "R2_Mat_Skin_Anthracite": {"hex": "#414743", "roughness": 0.68, "metallic": 0.0, "role": "face, ears and hands"},
    "R2_Mat_Hoodie_Black": {"hex": "#4F5C3A", "roughness": 0.82, "metallic": 0.0, "role": "moss-green hoodie"},
    "R2_Mat_Pants_Charcoal": {"hex": "#363A3E", "roughness": 0.78, "metallic": 0.0, "role": "dark lead-gray cargo pants"},
    "R2_Mat_Shoes_Black": {"hex": "#141718", "roughness": 0.54, "metallic": 0.0, "role": "black boots"},
}


def load_branding_module():
    path = os.path.join(RIG_ROOT, "R2_BUILD_MATERIAL_BRANDING.py")
    spec = importlib.util.spec_from_file_location("r2_material_branding_v1", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def arguments():
    values = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    if len(values) != 1:
        raise RuntimeError("Usage: -- <transaction-directory>")
    return os.path.abspath(values[0])


def sha256_file(path):
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest().upper()


def atomic_json(path, payload):
    temporary = path + ".tmp"
    with open(temporary, "w", encoding="utf-8", newline="\n") as handle:
        json.dump(payload, handle, indent=2, sort_keys=True)
        handle.write("\n")
    os.replace(temporary, path)


def linear_to_srgb(value):
    value = max(0.0, min(1.0, float(value)))
    return 12.92 * value if value <= 0.0031308 else 1.055 * (value ** (1.0 / 2.4)) - 0.055


def srgb_hex(rgba):
    return "#" + "".join(f"{round(linear_to_srgb(channel) * 255):02X}" for channel in rgba[:3])


def material_state(material, branding):
    principled = next(node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED")
    color = tuple(principled.inputs["Base Color"].default_value)
    return {
        "name": material.name,
        "base_color_srgb_hex": material.get("r2_srgb_hex") or srgb_hex(color),
        "base_color_linear_rgba": branding.vector(color),
        "roughness": branding.rounded(principled.inputs["Roughness"].default_value),
        "metallic": branding.rounded(principled.inputs["Metallic"].default_value),
    }


def apply_material(material, specification, branding):
    if not material.use_nodes or not material.node_tree:
        raise RuntimeError(f"Material is not node-based: {material.name}")
    principled_nodes = [node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED"]
    if len(principled_nodes) != 1:
        raise RuntimeError(f"Material does not have exactly one Principled node: {material.name}")
    principled = principled_nodes[0]
    rgba = branding.hex_linear(specification["hex"])
    principled.inputs["Base Color"].default_value = rgba
    principled.inputs["Roughness"].default_value = specification["roughness"]
    principled.inputs["Metallic"].default_value = specification["metallic"]
    material.diffuse_color = rgba
    material["r2_srgb_hex"] = specification["hex"]
    material["r2_material_role"] = specification["role"]
    material["r2_color_readability_version"] = "V2"


def reassign_low_hoodie_components_to_pants(hoodie, pants_material):
    if pants_material.name not in [slot.material.name for slot in hoodie.material_slots if slot.material]:
        hoodie.data.materials.append(pants_material)
    pants_index = next(index for index, slot in enumerate(hoodie.material_slots) if slot.material == pants_material)
    vertex_neighbors = defaultdict(set)
    vertex_polygons = defaultdict(set)
    for polygon in hoodie.data.polygons:
        vertices = tuple(polygon.vertices)
        for vertex in vertices:
            vertex_polygons[vertex].add(polygon.index)
        for start, end in zip(vertices, vertices[1:] + vertices[:1]):
            vertex_neighbors[start].add(end)
            vertex_neighbors[end].add(start)
    unseen = set(range(len(hoodie.data.vertices)))
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
        world_z = [float((hoodie.matrix_world @ hoodie.data.vertices[index].co).z) for index in vertices]
        minimum_z = min(world_z)
        maximum_z = max(world_z)
        if maximum_z < 0.02:
            for polygon_index in polygons:
                hoodie.data.polygons[polygon_index].material_index = pants_index
            records.append({
                "polygon_count": len(polygons),
                "vertex_count": len(vertices),
                "minimum_z": round(minimum_z, 9),
                "maximum_z": round(maximum_z, 9),
                "assigned_material": pants_material.name,
            })
    if len(records) != 2:
        raise RuntimeError(f"Expected exactly two low hoodie components, found {len(records)}")
    return records


def main():
    transaction = arguments()
    os.makedirs(transaction, exist_ok=True)
    candidate = os.path.join(transaction, CANDIDATE_NAME)
    branding = load_branding_module()
    if os.path.abspath(bpy.data.filepath) != os.path.abspath(SOURCE_BLEND):
        raise RuntimeError(f"Unexpected open source: {bpy.data.filepath}")
    if sha256_file(SOURCE_BLEND) != SOURCE_BLEND_SHA256 or sha256_file(SOURCE_GLB) != SOURCE_GLB_SHA256:
        raise RuntimeError("Immutable V1 source hash mismatch before V2 build")
    if len(bpy.data.objects) != 36 or len([obj for obj in bpy.data.objects if obj.type == "MESH"]) != 30:
        raise RuntimeError("Unexpected V1 object or mesh count")
    if len(bpy.data.materials) != 17:
        raise RuntimeError(f"Expected 17 source materials, found {len(bpy.data.materials)}")
    if sorted(action.name for action in bpy.data.actions) != EXPECTED_ACTIONS:
        raise RuntimeError("The nine approved animations are not exact")
    armature = bpy.data.objects.get("R2_Rig")
    if not armature or armature.type != "ARMATURE" or len(armature.data.bones) != 65:
        raise RuntimeError("The approved 65-bone armature is not exact")
    if branding.morph_target_count() != 24:
        raise RuntimeError("The approved 24 morph-target occurrences are not exact")
    branding.reset_neutral(armature)
    source_meshes = {obj.name: obj for obj in bpy.data.objects if obj.type == "MESH"}
    original_geometry = {name: branding.mesh_geometry_fingerprint(obj.data) for name, obj in source_meshes.items()}
    original_weights = {name: branding.object_weight_fingerprint(obj) for name, obj in source_meshes.items()}
    original_armature = branding.armature_fingerprint(armature)
    original_material_names = set(bpy.data.materials.keys())
    changed_materials = []
    for name, specification in MATERIAL_V2.items():
        material = bpy.data.materials.get(name)
        if not material:
            raise RuntimeError(f"Required material is missing: {name}")
        before = material_state(material, branding)
        apply_material(material, specification, branding)
        after = material_state(material, branding)
        changed_materials.append({"role": specification["role"], "before": before, "after": after})
    semantic_material_corrections = {
        "R2_Hoodie_Torso": reassign_low_hoodie_components_to_pants(
            bpy.data.objects["R2_Hoodie_Torso"],
            bpy.data.materials["R2_Mat_Pants_Charcoal"],
        )
    }
    old_patch = bpy.data.objects.get(PATCH_NAME)
    if not old_patch or old_patch.type != "MESH":
        raise RuntimeError("The approved V1 left-arm patch is missing")
    old_patch_mesh = old_patch.data
    old_patch_geometry = original_geometry[PATCH_NAME]
    old_patch_weights = original_weights[PATCH_NAME]
    bpy.data.objects.remove(old_patch, do_unlink=True)
    if old_patch_mesh.users == 0:
        bpy.data.meshes.remove(old_patch_mesh)
    logo_components, logo_import = branding.import_logo_components()
    sleeve = bpy.data.objects["R2_Hoodie_Sleeve_L"]
    sleeve_min, sleeve_max = branding.world_bounds(sleeve)
    sleeve_dimensions = sleeve_max - sleeve_min
    patch_scale_factor = 1.10
    designation_scale_factor = 1.18
    center = Vector((
        sleeve_max.x,
        (sleeve_min.y + sleeve_max.y) * 0.5,
        sleeve_min.z + sleeve_dimensions.z * 0.66,
    ))
    logo = branding.copy_scaled_components(
        logo_components,
        sleeve_dimensions.z * 0.187 * patch_scale_factor,
        vertical_offset=0.025 * patch_scale_factor,
        base_offset=0.0018,
        relief=0.0027,
    )
    designation, text_spec = branding.text_components(
        "R2",
        sleeve_dimensions.z * 0.135 * designation_scale_factor,
        -0.045 * patch_scale_factor,
        "R2_Mat_Embroidery_White",
        0.0018,
        0.0027,
    )
    placement = {
        "garment": sleeve.name,
        "garment_bounds": (sleeve_min, sleeve_max),
        "center": center,
        "plane": "YZ",
        "outward_axis": "+X",
        "expected_normal": (1.0, 0.0, 0.0),
        "reverse_faces": False,
        "placement": "ANATOMICAL_LEFT_UPPER_ARM",
    }
    patch, patch_record = branding.create_projected_prism_object(
        PATCH_NAME,
        sleeve,
        placement,
        logo + designation,
        ["R2_Mat_Embroidery_Gray", "R2_Mat_Embroidery_White"],
        armature,
    )
    patch["r2_designation"] = "R2"
    patch["r2_designation_material"] = "R2_Mat_Embroidery_White"
    patch["r2_patch_scale_delta_percent"] = 10.0
    patch["r2_designation_scale_delta_percent"] = 18.0
    patch["r2_patch_forward_shift"] = 0.0
    topology = branding.topology_metrics(patch)
    if any(topology[key] != 0 for key in ("wire_edges", "boundary_edges", "invalid_non_manifold", "zero_area_faces")):
        raise RuntimeError(f"Rebuilt V2 patch topology failed: {topology}")
    for material in list(bpy.data.materials):
        if material.name not in original_material_names and material.users == 0:
            bpy.data.materials.remove(material)
    if len(bpy.data.materials) != 17 or set(bpy.data.materials.keys()) != original_material_names:
        raise RuntimeError(f"Material identity/count changed unexpectedly: {sorted(bpy.data.materials.keys())}")
    unchanged_geometry = []
    unchanged_weights = []
    for name, fingerprint in original_geometry.items():
        if name == PATCH_NAME:
            continue
        current = bpy.data.objects.get(name)
        if not current or branding.mesh_geometry_fingerprint(current.data) != fingerprint:
            raise RuntimeError(f"Unauthorized geometry change: {name}")
        if branding.object_weight_fingerprint(current) != original_weights[name]:
            raise RuntimeError(f"Unauthorized weight change: {name}")
        unchanged_geometry.append(name)
        unchanged_weights.append(name)
    if branding.armature_fingerprint(armature) != original_armature:
        raise RuntimeError("Rig structure changed during V2 build")
    if branding.morph_target_count() != 24 or sorted(action.name for action in bpy.data.actions) != EXPECTED_ACTIONS:
        raise RuntimeError("Morph targets or animations changed during V2 build")
    if bpy.data.images or bpy.data.libraries:
        raise RuntimeError("V2 build introduced image or library dependencies")
    missing_material = [
        obj.name for obj in bpy.data.objects
        if obj.type == "MESH" and not obj.hide_render and (not obj.material_slots or any(slot.material is None for slot in obj.material_slots))
    ]
    if missing_material:
        raise RuntimeError(f"Renderable meshes without material: {missing_material}")
    armature["r2_color_readability_version"] = "r2-full-character-color-readable-ready-v2"
    armature["r2_color_readability_palette"] = json.dumps({name: value["hex"] for name, value in MATERIAL_V2.items()}, sort_keys=True)
    armature["r2_patch_scale_delta_percent"] = 10.0
    armature["r2_designation_scale_delta_percent"] = 18.0
    armature["r2_patch_designation_material"] = "R2_Mat_Embroidery_White"
    if sha256_file(SOURCE_BLEND) != SOURCE_BLEND_SHA256 or sha256_file(SOURCE_GLB) != SOURCE_GLB_SHA256:
        raise RuntimeError("Immutable V1 source changed before V2 save")
    bpy.ops.wm.save_as_mainfile(filepath=candidate, check_existing=False)
    if sha256_file(SOURCE_BLEND) != SOURCE_BLEND_SHA256 or sha256_file(SOURCE_GLB) != SOURCE_GLB_SHA256:
        raise RuntimeError("Immutable V1 source changed after V2 save")
    report = {
        "schema_version": 1,
        "execution_status": "COMPLETED",
        "technical_verdict": "PENDING_VISUAL_AND_ROUNDTRIP_VALIDATION",
        "source_blend": SOURCE_BLEND,
        "source_blend_sha256": SOURCE_BLEND_SHA256,
        "source_glb": SOURCE_GLB,
        "source_glb_sha256": SOURCE_GLB_SHA256,
        "candidate_blend": candidate,
        "candidate_blend_sha256": sha256_file(candidate),
        "candidate_blend_size_bytes": os.path.getsize(candidate),
        "object_count": len(bpy.data.objects),
        "mesh_count": len([obj for obj in bpy.data.objects if obj.type == "MESH"]),
        "renderable_mesh_count": len([obj for obj in bpy.data.objects if obj.type == "MESH" and not obj.hide_render]),
        "material_count": len(bpy.data.materials),
        "bone_count": len(armature.data.bones),
        "morph_target_occurrences": branding.morph_target_count(),
        "animations": EXPECTED_ACTIONS,
        "changed_materials": changed_materials,
        "semantic_material_corrections": semantic_material_corrections,
        "unchanged_mesh_geometry_count": len(unchanged_geometry),
        "unchanged_mesh_weights_count": len(unchanged_weights),
        "authorized_patch_change": {
            "object": PATCH_NAME,
            "old_geometry_sha256": old_patch_geometry,
            "new_geometry_sha256": branding.mesh_geometry_fingerprint(patch.data),
            "old_weights_sha256": old_patch_weights,
            "new_weights_sha256": branding.object_weight_fingerprint(patch),
            "scale_delta_percent": 10.0,
            "designation_scale_delta_percent": 18.0,
            "forward_shift": 0.0,
            "designation_material_before": "R2_Mat_GorillaOS_Green",
            "designation_material_after": "R2_Mat_Embroidery_White",
            "designation": text_spec,
            "logo_import": logo_import,
            "topology": topology,
            "record": patch_record,
        },
        "renderable_meshes_without_material": [],
        "images": 0,
        "external_libraries": 0,
        "failed_gates": [],
    }
    atomic_json(os.path.join(transaction, "R2_COLOR_READABILITY_V2_BUILD_REPORT.json"), report)
    print(json.dumps({
        "CandidateBlend": candidate,
        "CandidateBlendSHA256": report["candidate_blend_sha256"],
        "Objects": report["object_count"],
        "Meshes": report["mesh_count"],
        "RenderableMeshes": report["renderable_mesh_count"],
        "Materials": report["material_count"],
        "Bones": report["bone_count"],
        "MorphTargets": report["morph_target_occurrences"],
        "Animations": len(report["animations"]),
        "PatchScaleDeltaPercent": 10,
        "DesignationScaleDeltaPercent": 18,
        "MissingMaterials": 0,
    }, indent=2))


if __name__ == "__main__":
    main()
