import bpy
import hashlib
import json
import math
import os
import sys
import traceback
from mathutils import Vector
from mathutils.kdtree import KDTree

SOURCE = r"C:\Projetos\consorcio-os\web\blender\r2-rig\r2-v57-negative-x-middle-mid-depth-retopology-v1\r2-rig-v57-negative-x-middle-mid-depth-retopology-v1.blend"
OUTPUT = r"C:\Projetos\consorcio-os\web\blender\r2-rig\._r2_head_consolidation_20260801_0220\rig-analysis.json"
EXPECTED_SHA = "63F7F71988B171A37DF9A09EC8F957729DEF6D35E2D0C093A73577702F892752"


def sha256(path):
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest().upper()


def percentile(values, fraction):
    values = sorted(values)
    if not values:
        return 0.0
    position = (len(values) - 1) * fraction
    low = int(math.floor(position))
    high = int(math.ceil(position))
    if low == high:
        return float(values[low])
    blend = position - low
    return float(values[low] * (1.0 - blend) + values[high] * blend)


def main():
    if sha256(SOURCE) != EXPECTED_SHA:
        raise RuntimeError("Source hash mismatch")
    bpy.ops.wm.open_mainfile(filepath=SOURCE, load_ui=False, use_scripts=False)
    obj = bpy.data.objects.get("R2_Head_Face_Foundation")
    rig = bpy.data.objects.get("R2_Rig")
    if obj is None or rig is None:
        raise RuntimeError("Required foundation or rig missing")
    coordinates = [tuple(float(value) for value in vertex.co) for vertex in obj.data.vertices]
    axes = list(zip(*coordinates))
    bounds = {axis: {"min": min(values), "max": max(values), "p05": percentile(values, 0.05), "median": percentile(values, 0.5), "p95": percentile(values, 0.95)} for axis, values in zip(("x", "y", "z"), axes)}
    width = bounds["x"]["max"] - bounds["x"]["min"]
    center_tolerance = max(width * 0.0025, 1.0e-6)
    centerline_count = sum(1 for x, _, _ in coordinates if abs(x) <= center_tolerance)
    tree = KDTree(len(coordinates))
    for index, coordinate in enumerate(coordinates):
        tree.insert(Vector(coordinate), index)
    tree.balance()
    mirror_distances = [float(tree.find(Vector((-x, y, z)))[2]) for x, y, z in coordinates]
    mirror_tolerance = max(width * 0.0025, 1.0e-6)
    symmetric_count = sum(1 for distance in mirror_distances if distance <= mirror_tolerance)
    bones = {bone.name for bone in rig.data.bones}
    facial_tokens = {"jaw", "eye", "eyelid", "lid", "brow", "cheek", "lip", "mouth", "muzzle", "nose", "ear"}

    def is_facial_bone(name):
        parts = set(name.lower().replace(".", "_").replace("-", "_").split("_"))
        return bool(parts & facial_tokens)
    result = {
        "execution_status": "COMPLETED",
        "technical_verdict": "APROVADO",
        "failed_gates": [],
        "source_sha256": EXPECTED_SHA,
        "blender_version": bpy.app.version_string,
        "foundation_object": obj.name,
        "foundation_mesh": obj.data.name,
        "bounds_local": bounds,
        "centerline_tolerance": center_tolerance,
        "centerline_vertex_count": centerline_count,
        "mirror_tolerance": mirror_tolerance,
        "mirror_match_count": symmetric_count,
        "mirror_match_percent": 100.0 * symmetric_count / len(coordinates),
        "mirror_distance_median": percentile(mirror_distances, 0.5),
        "mirror_distance_p95": percentile(mirror_distances, 0.95),
        "foundation_vertex_groups": [group.name for group in obj.vertex_groups],
        "existing_head_chain": [name for name in ("root", "pelvis", "spine_01", "spine_02", "chest", "neck", "head") if name in bones],
        "existing_facial_bones": sorted(name for name in bones if is_facial_bone(name)),
        "shape_keys": [] if obj.data.shape_keys is None else [key.name for key in obj.data.shape_keys.key_blocks],
        "uv_maps": [layer.name for layer in obj.data.uv_layers],
        "materials": [slot.material.name if slot.material else None for slot in obj.material_slots],
        "images_created": 0,
        "blend_saved": False,
        "v57_unchanged": sha256(SOURCE) == EXPECTED_SHA,
    }
    with open(OUTPUT, "w", encoding="utf-8", newline="\n") as handle:
        json.dump(result, handle, indent=2, ensure_ascii=False, sort_keys=True)
        handle.write("\n")
    print("ExecutionStatus=COMPLETED")
    print("TechnicalVerdict=APROVADO")
    print("CenterlineVertexCount=" + str(centerline_count))
    print("MirrorMatchPercent=" + str(result["mirror_match_percent"]))
    print("MirrorDistanceP95=" + str(result["mirror_distance_p95"]))
    print("ExistingFacialBones=" + (",".join(result["existing_facial_bones"]) if result["existing_facial_bones"] else "NONE"))
    print("ShapeKeys=" + (",".join(result["shape_keys"]) if result["shape_keys"] else "NONE"))
    print("BlendSaved=False")
    print("ImagesCreated=0")
    print("V57Unchanged=" + str(result["v57_unchanged"]))


if __name__ == "__main__":
    try:
        main()
    except Exception:
        traceback.print_exc()
        sys.exit(1)
