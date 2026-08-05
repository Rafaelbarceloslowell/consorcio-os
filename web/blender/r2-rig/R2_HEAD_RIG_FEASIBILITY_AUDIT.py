import hashlib
import json
import re
import sys
from pathlib import Path

import bpy


EXPECTED_SHA256 = "340EEDFD0251432E6B8326B23EAE3AD268D560CC9D2FEE0940C8F03F9DC5B64B"
FACIAL_TERMS = (
    "jaw", "eye", "lid", "brow", "cheek", "muzzle", "lip", "mouth",
    "tongue", "teeth", "ear", "blink", "smile", "frown", "viseme",
)
EYE_TERMS = ("eye", "ocular", "cornea", "eyeball")
ORAL_TERMS = ("mouth", "oral", "tongue", "teeth", "tooth", "lip")


def sha256(path):
    digest = hashlib.sha256()
    with open(path, "rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest().upper()


def hits(name, terms):
    tokens = {token for token in re.split(r"[^a-z0-9]+", name.casefold()) if token}
    return any(term in tokens for term in terms)


def main():
    args = sys.argv[sys.argv.index("--") + 1 :]
    if len(args) != 3:
        raise SystemExit("expected: SOURCE PREPARATION_SPEC OUTPUT_JSON")

    source = Path(args[0]).resolve()
    prep_path = Path(args[1]).resolve()
    output_path = Path(args[2]).resolve()
    source_hash_before = sha256(source)
    prep = json.loads(prep_path.read_text(encoding="utf-8-sig"))

    bpy.ops.wm.open_mainfile(filepath=str(source), load_ui=False)

    objects = list(bpy.data.objects)
    armatures = [obj for obj in objects if obj.type == "ARMATURE"]
    meshes = [obj for obj in objects if obj.type == "MESH"]
    eye_objects = sorted(obj.name for obj in objects if hits(obj.name, EYE_TERMS))
    oral_objects = sorted(obj.name for obj in objects if hits(obj.name, ORAL_TERMS))
    facial_bones = sorted(
        bone.name
        for armature in armatures
        for bone in armature.data.bones
        if hits(bone.name, FACIAL_TERMS)
    )
    facial_groups = sorted(
        f"{obj.name}:{group.name}"
        for obj in meshes
        for group in obj.vertex_groups
        if hits(group.name, FACIAL_TERMS)
    )
    shape_keys = sorted(
        f"{mesh.name}:{key.name}"
        for mesh in bpy.data.meshes
        if mesh.shape_keys
        for key in mesh.shape_keys.key_blocks
    )
    drivers = sorted(
        f"{id_block.name}:{fcurve.data_path}"
        for id_block in list(bpy.data.objects) + list(bpy.data.meshes) + list(bpy.data.armatures)
        if getattr(id_block, "animation_data", None)
        and id_block.animation_data.drivers
        for fcurve in id_block.animation_data.drivers
    )

    zones = prep.get("deformation_zone_inventory", {})
    gate_evidence = {
        "approved_preparation_requires_landmark_certificates": all(
            "REQUIRED" in zones.get(zone, {}).get("status", "")
            for zone in ("eyelids", "eye_sockets", "brows", "muzzle", "lips_and_mouth_boundary", "jaw")
        ),
        "certified_eye_assets_present": bool(eye_objects or prep.get("existing_eye_objects")),
        "certified_oral_assets_present": bool(oral_objects or prep.get("existing_oral_cavity_objects")),
        "facial_bones_present": bool(facial_bones),
        "facial_vertex_groups_present": bool(facial_groups),
        "shape_keys_present": bool(shape_keys),
        "drivers_present": bool(drivers),
        "automatic_symmetry_authorized": prep.get("symmetry_assessment", {}).get("mode") != "ASYMMETRIC_SOURCE_PRESERVATION",
    }

    missing_prerequisites = [
        "certified bilateral ocular centers and eye surfaces",
        "certified upper/lower eyelid loops and ownership",
        "certified jaw hinge, chin, oral boundary, and mouth-interior ownership",
        "certified upper/lower lip loops and mouth corners",
        "certified bilateral brow, cheek, muzzle, and ear deformation ownership",
        "approved neutral landmark map and regression signature for facial shape keys",
    ]
    mandatory_channels = [
        "BLINK_LEFT", "BLINK_RIGHT", "BLINK_BOTH", "BROW_RAISE", "BROW_FROWN",
        "CHEEK_RAISE", "SMILE", "FROWN", "JAW_OPEN", "LIPS_CLOSED",
        "MOUTH_NARROW", "MOUTH_WIDE", "MOUTH_O", "MOUTH_E",
    ]

    source_hash_after = sha256(source)
    blocker_confirmed = (
        source_hash_before == EXPECTED_SHA256
        and source_hash_after == EXPECTED_SHA256
        and gate_evidence["approved_preparation_requires_landmark_certificates"]
        and not gate_evidence["certified_eye_assets_present"]
        and not gate_evidence["certified_oral_assets_present"]
        and not gate_evidence["facial_bones_present"]
        and not gate_evidence["facial_vertex_groups_present"]
        and not gate_evidence["shape_keys_present"]
    )

    result = {
        "schema_version": 1,
        "phase": "HEAD_RIGGING_AND_EXPRESSION_SYSTEM",
        "audit_kind": "INDEPENDENT_READ_ONLY_FEASIBILITY_AUDIT",
        "execution_status": "COMPLETED",
        "technical_verdict": "REPROVADO" if blocker_confirmed else "INCONCLUSIVE",
        "recoverable": False if blocker_confirmed else None,
        "blocker_confirmed": blocker_confirmed,
        "source_path": str(source),
        "source_sha256_before": source_hash_before,
        "source_sha256_after": source_hash_after,
        "official_source_unchanged": source_hash_before == source_hash_after == EXPECTED_SHA256,
        "blend_saved": False,
        "images_created": 0,
        "scene_counts": {
            "objects": len(objects),
            "armatures": len(armatures),
            "meshes": len(meshes),
            "eye_objects": len(eye_objects),
            "oral_objects": len(oral_objects),
            "facial_bones": len(facial_bones),
            "facial_vertex_groups": len(facial_groups),
            "shape_keys": len(shape_keys),
            "drivers": len(drivers),
        },
        "gate_evidence": gate_evidence,
        "missing_prerequisites": missing_prerequisites,
        "mandatory_channels_blocked": mandatory_channels,
        "safe_conclusion": (
            "Required semantic information cannot be determined from the approved preparation specification "
            "or actual blend. Implementing the mandatory facial rig would require guessed anatomical ownership "
            "and, for eye/oral behavior, missing assets or topology work outside this phase."
        ),
        "candidate_created": False,
        "publication_authorized": False,
    }
    output_path.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    print("ExecutionStatus=COMPLETED")
    print(f"TechnicalVerdict={result['technical_verdict']}")
    print(f"BlockerConfirmed={blocker_confirmed}")
    print(f"OfficialSourceUnchanged={result['official_source_unchanged']}")
    print("BlendSaved=False")
    print("CreatedImages=0")
    print(f"SourceSHA256={source_hash_after}")


if __name__ == "__main__":
    main()
