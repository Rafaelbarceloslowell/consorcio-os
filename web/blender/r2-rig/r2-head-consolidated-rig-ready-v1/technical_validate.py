import os
import sys
import traceback

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audit_common import run_audit, write_report


def main():
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    if len(args) != 2:
        raise RuntimeError("Expected candidate and report paths")
    report = run_audit(args[0])
    report["validation_type"] = "CHECKPOINT_5_TECHNICAL_VALIDATION"
    report["validation_approved"] = report["technical_verdict"] == "APROVADO"
    write_report(args[1], report)
    print("ExecutionStatus=" + report["execution_status"])
    print("TechnicalVerdict=" + report["technical_verdict"])
    print("ValidationApproved=" + str(report["validation_approved"]))
    print("WireEdges=" + str(report["wire_edges"]))
    print("InvalidNonManifold=" + str(report["invalid_non_manifold"]))
    print("UnweightedDeformVertices=" + str(report["unweighted_deform_vertices"]))
    print("InvertedFaces=" + str(report["inverted_faces"]))
    print("ZeroAreaFaces=" + str(report["zero_area_faces"]))
    print("DuplicateVerticesUnsafe=" + str(report["duplicate_vertices_unsafe"]))
    print("CreatedImages=" + str(report["images_created"]))
    print("OfficialV57Unchanged=" + str(report["official_v57_unchanged"]))
    print("FailedGates=" + ("NONE" if not report["failed_gates"] else ",".join(report["failed_gates"])))
    if report["failed_gates"]:
        sys.exit(2)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        traceback.print_exc()
        sys.exit(1)

