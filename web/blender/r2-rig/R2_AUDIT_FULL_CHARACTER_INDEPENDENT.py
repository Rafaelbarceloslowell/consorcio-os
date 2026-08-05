import bpy
import hashlib
import json
import pathlib
import sys


EXPECTED_SOURCE_HASHES = {
    "body": (
        pathlib.Path(r"C:\Projetos\consorcio-os\web\blender\r2-rig\r2-rig-v13-weights-refined.blend"),
        "392EA67AEBC3BA0FF72E65BE18F599E22A0C4C1296F2F6D365FFB989F35CF9C1",
    ),
    "anatomical": (
        pathlib.Path(r"C:\Projetos\consorcio-os\web\blender\r2-rig\r2-facial-ocular-oral-assets-ready-v1\r2-facial-ocular-oral-assets-ready-v1.blend"),
        "50D04CFBAEC2A431D96D4060E2AE82045AFBC56A0E74AD1759D156C0222825B3",
    ),
    "head_rig": (
        pathlib.Path(r"C:\Projetos\consorcio-os\web\blender\r2-rig\r2-head-rig-expression-ready-v1\r2-head-rig-expression-ready-v1.blend"),
        "7AE3C98EEF99AE60FF3C0470370147559B6B1CE7EE8455BAFD81D9852D8C0B97",
    ),
}

EXPECTED_ACTIONS = {
    "R2_NEUTRAL",
    "R2_IDLE",
    "R2_WORKING",
    "R2_LISTENING",
    "R2_THINKING",
    "R2_AWAITING_ACTION",
    "R2_ALERT",
    "R2_CELEBRATING_SALE",
    "R2_ERROR_ATTENTION",
}

EXPECTED_MORPHS = {
    "R2_Head_Face_Foundation": ["Basis", "EXP_BROW_RAISE", "EXP_BROW_FROWN", "EXP_CHEEK_RAISE", "EXP_MUZZLE"],
    "R2_LipLower": ["Basis", "EXP_LIPS_CLOSED", "EXP_SMILE", "EXP_FROWN", "EXP_MOUTH_NARROW", "EXP_MOUTH_WIDE", "EXP_MOUTH_O", "EXP_MOUTH_E", "EXP_VISEME_FV"],
    "R2_LipUpper": ["Basis", "EXP_LIPS_CLOSED", "EXP_SMILE", "EXP_FROWN", "EXP_MOUTH_NARROW", "EXP_MOUTH_WIDE", "EXP_MOUTH_O", "EXP_MOUTH_E"],
    "R2_LowerEyelid.L": ["Basis", "EXP_BLINK"],
    "R2_LowerEyelid.R": ["Basis", "EXP_BLINK"],
    "R2_Tongue": ["Basis", "EXP_VISEME_L"],
    "R2_UpperEyelid.L": ["Basis", "EXP_BLINK"],
    "R2_UpperEyelid.R": ["Basis", "EXP_BLINK"],
}


def sha256(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest().upper()


def main():
    args = sys.argv[sys.argv.index("--") + 1 :]
    output_path = pathlib.Path(args[0])
    blend_path = pathlib.Path(bpy.data.filepath)

    source_results = {}
    for label, (path, expected) in EXPECTED_SOURCE_HASHES.items():
        actual = sha256(path)
        source_results[label] = {
            "path": str(path),
            "expected_sha256": expected,
            "actual_sha256": actual,
            "unchanged": actual == expected,
        }

    armatures = [obj for obj in bpy.data.objects if obj.type == "ARMATURE"]
    rig = bpy.data.objects.get("R2_Rig")
    bone_names = [bone.name for bone in rig.data.bones] if rig else []
    head = rig.data.bones.get("head") if rig else None
    head_attachment_stable = bool(head and head.parent and head.parent.name == "neck")

    actual_morphs = {}
    morph_exact = True
    for object_name, expected_names in EXPECTED_MORPHS.items():
        obj = bpy.data.objects.get(object_name)
        actual_names = (
            [key.name for key in obj.data.shape_keys.key_blocks]
            if obj and obj.type == "MESH" and obj.data.shape_keys
            else []
        )
        actual_morphs[object_name] = actual_names
        morph_exact = morph_exact and actual_names == expected_names

    wire_edges = 0
    invalid_non_manifold = 0
    zero_area_faces = 0
    unweighted_deform_vertices = 0
    mesh_count = 0
    material_slots = 0

    deform_bones = {
        bone.name for bone in rig.data.bones if bone.use_deform
    } if rig else set()

    for obj in bpy.data.objects:
        if obj.type != "MESH":
            continue
        mesh_count += 1
        material_slots += len(obj.material_slots)
        mesh = obj.data
        edge_use = [0] * len(mesh.edges)
        edge_index_by_key = {
            tuple(sorted(edge.vertices)): edge.index for edge in mesh.edges
        }
        for polygon in mesh.polygons:
            if polygon.area <= 1.0e-12:
                zero_area_faces += 1
            for edge_key in polygon.edge_keys:
                edge_use[edge_index_by_key[tuple(sorted(edge_key))]] += 1
        wire_edges += sum(1 for count in edge_use if count == 0)
        invalid_non_manifold += sum(1 for count in edge_use if count > 2)

        has_rig_modifier = any(
            modifier.type == "ARMATURE" and modifier.object == rig
            for modifier in obj.modifiers
        )
        if not has_rig_modifier:
            continue
        deform_group_indices = {
            group.index for group in obj.vertex_groups if group.name in deform_bones
        }
        for vertex in mesh.vertices:
            if not any(
                element.group in deform_group_indices and element.weight > 0.0
                for element in vertex.groups
            ):
                unweighted_deform_vertices += 1

    action_names = {action.name for action in bpy.data.actions}
    unexpected_actions = sorted(action_names - EXPECTED_ACTIONS)
    missing_actions = sorted(EXPECTED_ACTIONS - action_names)
    duplicate_bones = len(bone_names) != len(set(bone_names))
    candidate_sha = sha256(blend_path)

    failed_gates = []
    gates = {
        "OfficialSourcesUnchanged": all(item["unchanged"] for item in source_results.values()),
        "SingleArmature": len(armatures) == 1 and rig is not None,
        "BoneCount65": len(bone_names) == 65,
        "DuplicateBonesZero": not duplicate_bones,
        "HeadBodyAttachmentStable": head_attachment_stable,
        "MorphTargetsExact": morph_exact,
        "AnimationClipsExact": not missing_actions and not unexpected_actions,
        "WireEdgesZero": wire_edges == 0,
        "InvalidNonManifoldZero": invalid_non_manifold == 0,
        "ZeroAreaFacesZero": zero_area_faces == 0,
        "UnweightedDeformVerticesZero": unweighted_deform_vertices == 0,
        "CreatedImagesZero": len(bpy.data.images) == 0,
    }
    for name, passed in gates.items():
        if not passed:
            failed_gates.append(name)

    report = {
        "schema_version": 1,
        "audit": "FULL_CHARACTER_INDEPENDENT_BLENDER_AUDIT",
        "execution_status": "COMPLETED" if not failed_gates else "FAILED",
        "technical_verdict": "APROVADO" if not failed_gates else "REPROVADO",
        "independent_audit_approved": not failed_gates,
        "blend_path": str(blend_path),
        "blend_sha256": candidate_sha,
        "blender_version": bpy.app.version_string,
        "official_sources": source_results,
        "armature_count": len(armatures),
        "bone_count": len(bone_names),
        "duplicate_bones": duplicate_bones,
        "head_body_attachment_stable": head_attachment_stable,
        "mesh_count": mesh_count,
        "material_slot_count": material_slots,
        "morph_targets": actual_morphs,
        "morph_targets_exact": morph_exact,
        "animation_names": sorted(action_names),
        "missing_animations": missing_actions,
        "unexpected_animations": unexpected_actions,
        "wire_edges": wire_edges,
        "invalid_non_manifold": invalid_non_manifold,
        "zero_area_faces": zero_area_faces,
        "unweighted_deform_vertices": unweighted_deform_vertices,
        "created_images": len(bpy.data.images),
        "gates": gates,
        "failed_gates": failed_gates,
    }
    output_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    if failed_gates:
        raise SystemExit(2)


if __name__ == "__main__":
    main()
