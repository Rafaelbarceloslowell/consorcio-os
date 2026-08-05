import glob
import json
import os
import sys
import traceback

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audit_common import EXPECTED_SOURCE_SHA, ROOT, run_audit, sha256, write_report

EXPECTED_SPEC_SHA = "66200081BEE95254A6EDEB8BC596670DCBC268125CEEF926B318E0A7642B5403"
EXPECTED_PREVIOUS = {
    "V40": ("r2-v40-cheek-region-retopology-v2", "r2-rig-v40-cheek-region-retopology-v2.blend", "E770FF08D8945DFAA8BB2D1EC0E558A1F5CC2E12E0DAD8FDF6592F9E3AFAB3FC"),
    "V41": ("r2-v41-center-lower-front-retopology-v1", "r2-rig-v41-center-lower-front-retopology-v1.blend", "4D19EA4F98B86592E43505814EF58CBF15252F445C2431D8D156F0DA7D8730CB"),
    "V42": ("r2-v42-positive-x-lower-back-retopology-v1", "r2-rig-v42-positive-x-lower-back-retopology-v1.blend", "803D9DEEAB64D3AD16523DFBA59B9556CBA306BAEC94F02EB21EA7EB26AEA5DD"),
    "V43": ("r2-v43-positive-x-lower-back-retopology-v1", "r2-rig-v43-positive-x-lower-back-retopology-v1.blend", "CEB65B49D6B75AD1D6B5C2780046F68A22DDF15272C1A8747FF3BFDE535B91DA"),
    "V44": ("r2-v44-positive-x-lower-back-retopology-v1", "r2-rig-v44-positive-x-lower-back-retopology-v1.blend", "2572ACD4D563833A294C8C507C21C6B47B341F471C928BE2B63D073D2DD8790E"),
    "V45": ("r2-v45-negative-x-upper-back-retopology-v1", "r2-rig-v45-negative-x-upper-back-retopology-v1.blend", "917988C37BD125C391D85D166020243FD75192CBA16D34D4B5E70578EA41339B"),
    "V46": ("r2-v46-positive-x-lower-mid-depth-retopology-v1", "r2-rig-v46-positive-x-lower-mid-depth-retopology-v1.blend", "496B459EBB0350AFD10B5353C71692EC74CD11C08401E9AEA6DCFC1256D2A696"),
    "V47": ("r2-v47-center-upper-back-retopology-v1", "r2-rig-v47-center-upper-back-retopology-v1.blend", "15ABA4E137DD2CC01B39842DA80AA81C8C8F3B85EF741F94A9915108D5DAAC19"),
    "V48": ("r2-v48-positive-x-lower-mid-depth-retopology-v1", "r2-rig-v48-positive-x-lower-mid-depth-retopology-v1.blend", "4B6C58414920BF9B0A440B6BAE1FB887B76683077A2CDD92B465A9F81A562088"),
    "V49": ("r2-v49-positive-x-middle-mid-depth-retopology-v1", "r2-rig-v49-positive-x-middle-mid-depth-retopology-v1.blend", "F2CA2AB53B59AA6D8F60E665BB29E335273FB6E9AACEFC7A68E9C139899AD126"),
    "V50": ("r2-v50-positive-x-lower-front-retopology-v1", "r2-rig-v50-positive-x-lower-front-retopology-v1.blend", "9BE98A43AFB6E5974057AA6C24CEB71486BC254077DA2DF20E23A3DF7ACAAACC"),
    "V51": ("r2-v51-positive-x-lower-mid-depth-retopology-v1", "r2-rig-v51-positive-x-lower-mid-depth-retopology-v1.blend", "23DCF9D94B1232A50F36ECF4B168EB70ED3AFCFFB2E3AEB00BBDB88B7D2E6C9C"),
    "V52": ("r2-v52-positive-x-lower-mid-depth-retopology-v1", "r2-rig-v52-positive-x-lower-mid-depth-retopology-v1.blend", "F2139FAF062507DFBE05439836752DC05A20659B62E13F06F45C59F440B8637A"),
    "V53": ("r2-v53-negative-x-upper-back-retopology-v1", "r2-rig-v53-negative-x-upper-back-retopology-v1.blend", "AF8413D82E790134B541B97B19EF6D2E40893F3576CCA84D286B08105747BD1B"),
    "V54": ("r2-v54-positive-x-lower-front-retopology-v1", "r2-rig-v54-positive-x-lower-front-retopology-v1.blend", "3C1E373AE64B0B5C017FCCE9F3C0D7489D89AD500AE536CF05BA2A1337EF2435"),
    "V55": ("r2-v55-negative-x-upper-back-retopology-v1", "r2-rig-v55-negative-x-upper-back-retopology-v1.blend", "2CB36F889303C98D8A8FAEA69F8BBD2AEFEBB3A13C27050071D8DBA7269653CD"),
    "V56": ("r2-v56-negative-x-upper-back-retopology-v1", "r2-rig-v56-negative-x-upper-back-retopology-v1.blend", "FB374635A16B5305AAF316726BA1AA0BB4A75B21F33A3225A49B3CDEEF504BB8"),
    "V57": ("r2-v57-negative-x-middle-mid-depth-retopology-v1", "r2-rig-v57-negative-x-middle-mid-depth-retopology-v1.blend", EXPECTED_SOURCE_SHA),
}


def main():
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    if len(args) != 2:
        raise RuntimeError("Expected published blend and report paths")
    published, report_path = args
    report = run_audit(published)
    failures = list(report["failed_gates"])
    spec_path = os.path.join(ROOT, "R2_HEAD_RIG_PREPARATION_SPEC.json")
    spec_valid = sha256(spec_path) == EXPECTED_SPEC_SHA
    if spec_valid:
        with open(spec_path, "r", encoding="utf-8") as handle:
            spec = json.load(handle)
        spec_valid = spec.get("technical_verdict") == "APROVADO" and spec.get("next_phase") == "HEAD_RIGGING_AND_EXPRESSION_SYSTEM"
    if not spec_valid:
        failures.append("RigPreparationSpecificationApproved")
    independent_path = os.path.join(os.path.dirname(published), "independent-audit-report.json")
    independent_valid = False
    if os.path.isfile(independent_path):
        with open(independent_path, "r", encoding="utf-8") as handle:
            independent = json.load(handle)
        independent_valid = bool(independent.get("independent_audit_approved")) and independent.get("candidate_sha256") == sha256(published) and not independent.get("failed_gates")
    if not independent_valid:
        failures.append("IndependentAuditApproved")
    previous_hashes = {}
    for version, (folder, filename, expected) in EXPECTED_PREVIOUS.items():
        path = os.path.join(ROOT, folder, filename)
        actual = sha256(path) if os.path.isfile(path) else "MISSING"
        previous_hashes[version] = {"path": path, "expected": expected, "actual": actual, "match": actual == expected}
    previous_unchanged = all(item["match"] for item in previous_hashes.values())
    if not previous_unchanged:
        failures.append("PreviousOfficialVersionsUnchanged")
    temporary = sorted(glob.glob(os.path.join(ROOT, "._*r2_head_consolidation*")))
    if temporary:
        failures.append("TemporaryDirectoriesRemaining")
    report.update({
        "audit_type": "CHECKPOINT_8_FINAL_INTEGRITY_AUDIT",
        "technical_verdict": "APROVADO" if not failures else "REPROVADO",
        "failed_gates": failures,
        "head_consolidation_confirmed": not failures,
        "rig_preparation_confirmed": spec_valid and not failures,
        "independent_audit_approved": independent_valid,
        "published_blend_reopened": True,
        "published_blend_sha256": sha256(published),
        "previous_official_versions": previous_hashes,
        "previous_official_versions_unchanged": previous_unchanged,
        "temporary_directories": temporary,
        "temporary_directories_remaining": len(temporary),
        "created_images": report["images_created"],
    })
    write_report(report_path, report)
    print("ExecutionStatus=COMPLETED")
    print("TechnicalVerdict=" + report["technical_verdict"])
    print("HeadConsolidationConfirmed=" + str(report["head_consolidation_confirmed"]))
    print("RigPreparationConfirmed=" + str(report["rig_preparation_confirmed"]))
    print("IndependentAuditApproved=" + str(report["independent_audit_approved"]))
    print("PublishedBlendReopened=True")
    print("OfficialV57Unchanged=" + str(report["official_v57_unchanged"]))
    print("PreviousOfficialVersionsUnchanged=" + str(report["previous_official_versions_unchanged"]))
    print("CreatedImages=" + str(report["created_images"]))
    print("TemporaryDirectoriesRemaining=" + str(report["temporary_directories_remaining"]))
    print("FailedGates=" + ("NONE" if not failures else ",".join(failures)))
    if failures:
        sys.exit(2)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        traceback.print_exc()
        sys.exit(1)

