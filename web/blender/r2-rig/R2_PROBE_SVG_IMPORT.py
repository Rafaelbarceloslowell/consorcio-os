import bpy
import json
from mathutils import Vector

svg = r"C:\Projetos\consorcio-os\web\public\brand\GorillaMark_Dark.svg"
before = set(bpy.data.objects)
bpy.ops.import_curve.svg(filepath=svg)
created = [obj for obj in bpy.data.objects if obj not in before]
report = []
for obj in created:
    points = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    report.append({
        "name": obj.name,
        "type": obj.type,
        "data": obj.data.name,
        "splines": len(obj.data.splines) if obj.type == "CURVE" else None,
        "bounds": {
            "min": [round(min(p[i] for p in points), 8) for i in range(3)],
            "max": [round(max(p[i] for p in points), 8) for i in range(3)],
        },
        "materials": [slot.material.name if slot.material else None for slot in obj.material_slots],
    })
print("R2_SVG_IMPORT_PROBE=" + json.dumps(report, sort_keys=True))
