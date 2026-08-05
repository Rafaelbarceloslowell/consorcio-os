import bpy
import hashlib
import json
import os
import sys


EXPECTED_SHA256 = "2EEC504BFC6F3C0D0B1BF6B1EFA932445142DCB61527E94A64F9C4A3A5EE491D"


def sha256(path):
    digest = hashlib.sha256()
    with open(path, "rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest().upper()


def main():
    arguments = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    if len(arguments) != 1:
        raise RuntimeError("Usage: blender <official.blend> --background --python script.py -- <report.json>")

    report_path = os.path.abspath(arguments[0])
    blend_path = os.path.abspath(bpy.data.filepath)
    blend_sha256 = sha256(blend_path)
    objects = list(bpy.data.objects)
    mesh_objects = [obj for obj in objects if obj.type == "MESH"]
    renderable_meshes = [obj for obj in mesh_objects if not obj.hide_render]
    material_names = sorted({
        slot.material.name
        for obj in mesh_objects
        for slot in obj.material_slots
        if slot.material is not None
    })
    armatures = [obj for obj in objects if obj.type == "ARMATURE"]
    bone_names = sorted({bone.name for armature in armatures for bone in armature.data.bones})
    morph_targets = []
    for obj in mesh_objects:
        shape_keys = obj.data.shape_keys
        if not shape_keys:
            continue
        for index, block in enumerate(shape_keys.key_blocks):
            if index == 0 and block.name == "Basis":
                continue
            morph_targets.append({"object": obj.name, "name": block.name, "index": index - 1})

    fps = bpy.context.scene.render.fps / bpy.context.scene.render.fps_base
    actions = []
    for action in sorted(bpy.data.actions, key=lambda candidate: candidate.name):
        start, end = action.frame_range
        actions.append({
            "name": action.name,
            "durationFrames": float(end - start),
            "durationSeconds": float((end - start) / fps),
            "fCurveCount": len(action.fcurves),
        })

    report = {
        "schemaVersion": 1,
        "audit": "R2_STATE_ANIMATION_ORCHESTRATION_V1_AUTHORING_READ_ONLY",
        "blendPath": blend_path,
        "blendSha256": blend_sha256,
        "objectCount": len(objects),
        "meshObjectCount": len(mesh_objects),
        "renderableMeshCount": len(renderable_meshes),
        "renderableMeshesWithoutMaterial": [
            obj.name for obj in renderable_meshes
            if not any(slot.material is not None for slot in obj.material_slots)
        ],
        "materialCount": len(material_names),
        "materialNames": material_names,
        "armatureCount": len(armatures),
        "boneCount": len(bone_names),
        "boneNames": bone_names,
        "morphTargetOccurrences": len(morph_targets),
        "morphTargets": morph_targets,
        "animationCount": len(actions),
        "animations": actions,
        "readOnly": True,
    }
    report["passed"] = (
        blend_sha256 == EXPECTED_SHA256
        and report["objectCount"] == 36
        and report["meshObjectCount"] == 30
        and report["renderableMeshCount"] == 29
        and len(report["renderableMeshesWithoutMaterial"]) == 0
        and report["materialCount"] == 17
        and report["boneCount"] == 65
        and report["morphTargetOccurrences"] == 24
        and report["animationCount"] == 9
    )
    report["verdict"] = "APROVADO" if report["passed"] else "REPROVADO"
    os.makedirs(os.path.dirname(report_path), exist_ok=True)
    with open(report_path, "w", encoding="utf-8") as destination:
        json.dump(report, destination, indent=2, ensure_ascii=False)
        destination.write("\n")
    print(json.dumps(report, indent=2, ensure_ascii=False))
    if not report["passed"]:
        raise RuntimeError("Authoring read-only audit failed")


if __name__ == "__main__":
    main()
