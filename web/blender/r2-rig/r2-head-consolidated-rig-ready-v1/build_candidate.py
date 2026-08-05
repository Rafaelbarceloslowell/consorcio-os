import bpy
import hashlib
import json
import os
import sys
import traceback

ROOT = r"C:\Projetos\consorcio-os\web\blender\r2-rig"
SOURCE = os.path.join(ROOT, "r2-v57-negative-x-middle-mid-depth-retopology-v1", "r2-rig-v57-negative-x-middle-mid-depth-retopology-v1.blend")
WORKING = os.path.join(ROOT, "._r2_head_consolidation_20260801_0220", "working-source-v57-copy.blend")
STAGE = os.path.join(ROOT, "._r2_head_consolidation_20260801_0220", "r2-head-consolidated-rig-ready-v1")
CANDIDATE = os.path.join(STAGE, "r2-head-consolidated-rig-ready-v1.blend")
PLAN = os.path.join(ROOT, "R2_HEAD_CONSOLIDATION_PLAN.json")
REPORT = os.path.join(STAGE, "construction-report.json")
EXPECTED_SOURCE_SHA = "63F7F71988B171A37DF9A09EC8F957729DEF6D35E2D0C093A73577702F892752"
EXPECTED_PLAN_SHA = "77FC3B37AA6E5A45C29677458DAC711333854EF43F395B1DECE3133330D3711A"


def sha256(path):
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest().upper()


def fail(message):
    raise RuntimeError(message)


def main():
    if sha256(SOURCE) != EXPECTED_SOURCE_SHA:
        fail("Official source hash mismatch before construction")
    if sha256(WORKING) != EXPECTED_SOURCE_SHA:
        fail("Transactional working copy is not an exact V57 copy")
    if sha256(PLAN) != EXPECTED_PLAN_SHA:
        fail("Approved consolidation plan hash mismatch")
    with open(PLAN, "r", encoding="utf-8") as handle:
        plan = json.load(handle)
    expected_objects = sorted(item["source_object"] for item in plan["objects"])
    bpy.ops.wm.open_mainfile(filepath=WORKING, load_ui=False, use_scripts=False)
    actual_objects = sorted(obj.name for obj in bpy.data.objects)
    if actual_objects != expected_objects:
        fail("Working scene object set differs from approved plan")
    if any(len(name) > 4 and name[-4] == "." and name[-3:].isdigit() for name in actual_objects):
        fail("Potential .001 object collision present")
    if len(bpy.data.images) != 0:
        fail("Images exist before construction")
    scene = bpy.data.scenes.get("R2_Master_v35")
    if scene is None:
        fail("Expected canonical scene is missing")
    additions = plan["authorized_metadata_additions"]
    for key, value in additions["scene:R2_Master_v35"].items():
        scene[key] = EXPECTED_PLAN_SHA if value == "SET_FROM_APPROVED_PLAN_FILE" else value
    for target, properties in additions.items():
        if not target.startswith("object:"):
            continue
        name = target.split(":", 1)[1]
        obj = bpy.data.objects.get(name)
        if obj is None:
            fail("Authorized metadata target missing: " + name)
        for key, value in properties.items():
            obj[key] = value
    if len(bpy.data.images) != 0:
        fail("Construction created an image datablock")
    os.makedirs(STAGE, exist_ok=False)
    bpy.ops.wm.save_as_mainfile(filepath=CANDIDATE, check_existing=False, compress=False)
    if not os.path.isfile(CANDIDATE):
        fail("Candidate blend was not saved")
    source_after = sha256(SOURCE)
    if source_after != EXPECTED_SOURCE_SHA:
        fail("Official source changed during construction")
    report = {
        "execution_status": "COMPLETED",
        "technical_verdict": "APROVADO",
        "build_approved": True,
        "failed_gates": [],
        "strategy": plan["strategy"],
        "source_sha256": EXPECTED_SOURCE_SHA,
        "plan_sha256": EXPECTED_PLAN_SHA,
        "candidate_path": CANDIDATE,
        "candidate_sha256": sha256(CANDIDATE),
        "object_count": len(bpy.data.objects),
        "mesh_count": len(bpy.data.meshes),
        "armature_count": len(bpy.data.armatures),
        "material_count": len(bpy.data.materials),
        "image_count": len(bpy.data.images),
        "geometry_changes": 0,
        "weight_changes": 0,
        "object_joins": 0,
        "object_deletions": 0,
        "object_renames": 0,
        "data_block_renames": 0,
        "material_changes": 0,
        "modifier_changes": 0,
        "hierarchy_changes": 0,
        "authorized_metadata_targets": sorted(additions.keys()),
        "official_v57_unchanged": True,
        "created_blends": 1,
        "created_images": 0,
    }
    with open(REPORT, "w", encoding="utf-8", newline="\n") as handle:
        json.dump(report, handle, indent=2, ensure_ascii=False, sort_keys=True)
        handle.write("\n")
    print("ExecutionStatus=COMPLETED")
    print("TechnicalVerdict=APROVADO")
    print("BuildApproved=True")
    print("CandidateSHA256=" + report["candidate_sha256"])
    print("GeometryChanges=0")
    print("WeightChanges=0")
    print("CreatedImages=0")
    print("OfficialV57Unchanged=True")
    print("FailedGates=NONE")


if __name__ == "__main__":
    try:
        main()
    except Exception:
        traceback.print_exc()
        sys.exit(1)

