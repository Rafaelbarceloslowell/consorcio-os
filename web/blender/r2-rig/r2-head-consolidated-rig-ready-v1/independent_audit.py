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
    report["audit_type"] = "CHECKPOINT_6_INDEPENDENT_READ_ONLY_AUDIT"
    report["independent_audit_approved"] = report["technical_verdict"] == "APROVADO"
    write_report(args[1], report)
    print("ExecutionStatus=" + report["execution_status"])
    print("TechnicalVerdict=" + report["technical_verdict"])
    print("IndependentAuditApproved=" + str(report["independent_audit_approved"]))
    print("GeometryExact=" + str(report["geometry_exact"]))
    print("PreservedWeightsExact=" + str(report["preserved_weights_exact"]))
    print("FaceAttributesPreserved=" + str(report["face_attributes_preserved"]))
    print("ArmatureRelationshipsPreserved=" + str(report["armature_relationships_preserved"]))
    print("OfficialV57Unchanged=" + str(report["official_v57_unchanged"]))
    print("CreatedImages=" + str(report["images_created"]))
    print("FailedGates=" + ("NONE" if not report["failed_gates"] else ",".join(report["failed_gates"])))
    if report["failed_gates"]:
        sys.exit(2)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        traceback.print_exc()
        sys.exit(1)
