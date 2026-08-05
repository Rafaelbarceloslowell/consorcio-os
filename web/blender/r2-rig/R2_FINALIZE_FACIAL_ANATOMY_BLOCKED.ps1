$ErrorActionPreference = 'Stop'

$root = 'C:\Projetos\consorcio-os\web\blender\r2-rig'
$tx = Join-Path $root '._r2_facial_anatomy_certification_20260801_120937'
$source = Join-Path $root 'r2-head-consolidated-rig-ready-v1\r2-head-consolidated-rig-ready-v1.blend'
$expectedSourceHash = '340EEDFD0251432E6B8326B23EAE3AD268D560CC9D2FEE0940C8F03F9DC5B64B'
$now = (Get-Date).ToString('o')

function Write-JsonAtomic {
    param([string]$Path, [object]$Value, [int]$Depth = 100)
    $temporary = Join-Path (Split-Path -Parent $Path) ('.' + (Split-Path -Leaf $Path) + '.' + [guid]::NewGuid().ToString('N') + '.tmp')
    $Value | ConvertTo-Json -Depth $Depth | Set-Content -LiteralPath $temporary -Encoding UTF8
    Move-Item -LiteralPath $temporary -Destination $Path -Force
}

function Copy-Atomic {
    param([string]$Source, [string]$Destination)
    $temporary = Join-Path (Split-Path -Parent $Destination) ('.' + (Split-Path -Leaf $Destination) + '.' + [guid]::NewGuid().ToString('N') + '.tmp')
    Copy-Item -LiteralPath $Source -Destination $temporary
    Move-Item -LiteralPath $temporary -Destination $Destination -Force
}

$identity = Get-Content -LiteralPath (Join-Path $root 'R2_FACIAL_FOUNDATION_IDENTITY.json') -Raw | ConvertFrom-Json
$probePath = if (Test-Path -LiteralPath (Join-Path $tx 'checkpoint2-3-probe.corrected.json.tmp')) { Join-Path $tx 'checkpoint2-3-probe.corrected.json.tmp' } else { Join-Path $root 'R2_FACIAL_ANATOMICAL_AXES_AND_CANDIDATE_PROBE.json' }
$correctedAuditTemp = Join-Path $root '.R2_FACIAL_SEMANTIC_SUFFICIENCY_AUDIT.json.corrected.tmp'
$correctedAuditLogTemp = Join-Path $root '.R2_FACIAL_SEMANTIC_SUFFICIENCY_AUDIT.runtime.log.corrected.tmp'
if (Test-Path -LiteralPath $correctedAuditTemp) {
    Copy-Atomic $correctedAuditTemp (Join-Path $root 'R2_FACIAL_SEMANTIC_SUFFICIENCY_AUDIT.json')
    Remove-Item -LiteralPath $correctedAuditTemp -Force
}
if (Test-Path -LiteralPath $correctedAuditLogTemp) {
    Copy-Atomic $correctedAuditLogTemp (Join-Path $root 'R2_FACIAL_SEMANTIC_SUFFICIENCY_AUDIT.runtime.log')
    Remove-Item -LiteralPath $correctedAuditLogTemp -Force
}
$probe = Get-Content -LiteralPath $probePath -Raw | ConvertFrom-Json
$audit = Get-Content -LiteralPath (Join-Path $root 'R2_FACIAL_SEMANTIC_SUFFICIENCY_AUDIT.json') -Raw | ConvertFrom-Json

$sourceHash = (Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash.ToUpperInvariant()
if ($sourceHash -ne $expectedSourceHash) { throw "Official source hash mismatch: $sourceHash" }

$versions = [ordered]@{
    40 = @('r2-v40-cheek-region-retopology-v2\r2-rig-v40-cheek-region-retopology-v2.blend', 'E770FF08D8945DFAA8BB2D1EC0E558A1F5CC2E12E0DAD8FDF6592F9E3AFAB3FC')
    41 = @('r2-v41-center-lower-front-retopology-v1\r2-rig-v41-center-lower-front-retopology-v1.blend', '4D19EA4F98B86592E43505814EF58CBF15252F445C2431D8D156F0DA7D8730CB')
    42 = @('r2-v42-positive-x-lower-back-retopology-v1\r2-rig-v42-positive-x-lower-back-retopology-v1.blend', '803D9DEEAB64D3AD16523DFBA59B9556CBA306BAEC94F02EB21EA7EB26AEA5DD')
    43 = @('r2-v43-positive-x-lower-back-retopology-v1\r2-rig-v43-positive-x-lower-back-retopology-v1.blend', 'CEB65B49D6B75AD1D6B5C2780046F68A22DDF15272C1A8747FF3BFDE535B91DA')
    44 = @('r2-v44-positive-x-lower-back-retopology-v1\r2-rig-v44-positive-x-lower-back-retopology-v1.blend', '2572ACD4D563833A294C8C507C21C6B47B341F471C928BE2B63D073D2DD8790E')
    45 = @('r2-v45-negative-x-upper-back-retopology-v1\r2-rig-v45-negative-x-upper-back-retopology-v1.blend', '917988C37BD125C391D85D166020243FD75192CBA16D34D4B5E70578EA41339B')
    46 = @('r2-v46-positive-x-lower-mid-depth-retopology-v1\r2-rig-v46-positive-x-lower-mid-depth-retopology-v1.blend', '496B459EBB0350AFD10B5353C71692EC74CD11C08401E9AEA6DCFC1256D2A696')
    47 = @('r2-v47-center-upper-back-retopology-v1\r2-rig-v47-center-upper-back-retopology-v1.blend', '15ABA4E137DD2CC01B39842DA80AA81C8C8F3B85EF741F94A9915108D5DAAC19')
    48 = @('r2-v48-positive-x-lower-mid-depth-retopology-v1\r2-rig-v48-positive-x-lower-mid-depth-retopology-v1.blend', '4B6C58414920BF9B0A440B6BAE1FB887B76683077A2CDD92B465A9F81A562088')
    49 = @('r2-v49-positive-x-middle-mid-depth-retopology-v1\r2-rig-v49-positive-x-middle-mid-depth-retopology-v1.blend', 'F2CA2AB53B59AA6D8F60E665BB29E335273FB6E9AACEFC7A68E9C139899AD126')
    50 = @('r2-v50-positive-x-lower-front-retopology-v1\r2-rig-v50-positive-x-lower-front-retopology-v1.blend', '9BE98A43AFB6E5974057AA6C24CEB71486BC254077DA2DF20E23A3DF7ACAAACC')
    51 = @('r2-v51-positive-x-lower-mid-depth-retopology-v1\r2-rig-v51-positive-x-lower-mid-depth-retopology-v1.blend', '23DCF9D94B1232A50F36ECF4B168EB70ED3AFCFFB2E3AEB00BBDB88B7D2E6C9C')
    52 = @('r2-v52-positive-x-lower-mid-depth-retopology-v1\r2-rig-v52-positive-x-lower-mid-depth-retopology-v1.blend', 'F2139FAF062507DFBE05439836752DC05A20659B62E13F06F45C59F440B8637A')
    53 = @('r2-v53-negative-x-upper-back-retopology-v1\r2-rig-v53-negative-x-upper-back-retopology-v1.blend', 'AF8413D82E790134B541B97B19EF6D2E40893F3576CCA84D286B08105747BD1B')
    54 = @('r2-v54-positive-x-lower-front-retopology-v1\r2-rig-v54-positive-x-lower-front-retopology-v1.blend', '3C1E373AE64B0B5C017FCCE9F3C0D7489D89AD500AE536CF05BA2A1337EF2435')
    55 = @('r2-v55-negative-x-upper-back-retopology-v1\r2-rig-v55-negative-x-upper-back-retopology-v1.blend', '2CB36F889303C98D8A8FAEA69F8BBD2AEFEBB3A13C27050071D8DBA7269653CD')
    56 = @('r2-v56-negative-x-upper-back-retopology-v1\r2-rig-v56-negative-x-upper-back-retopology-v1.blend', 'FB374635A16B5305AAF316726BA1AA0BB4A75B21F33A3225A49B3CDEEF504BB8')
    57 = @('r2-v57-negative-x-middle-mid-depth-retopology-v1\r2-rig-v57-negative-x-middle-mid-depth-retopology-v1.blend', '63F7F71988B171A37DF9A09EC8F957729DEF6D35E2D0C093A73577702F892752')
}
$versionEvidence = @()
foreach ($entry in $versions.GetEnumerator()) {
    $path = Join-Path $root $entry.Value[0]
    $actual = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToUpperInvariant()
    $versionEvidence += [ordered]@{ version = 'V' + $entry.Key; path = $path; expected_sha256 = $entry.Value[1]; actual_sha256 = $actual; unchanged = ($actual -eq $entry.Value[1]) }
}
$previousVersionsUnchanged = ($versionEvidence | Where-Object { -not $_.unchanged }).Count -eq 0
if (-not $previousVersionsUnchanged) { throw 'At least one V40-V57 official blend hash diverged.' }

if (Test-Path -LiteralPath $tx) {
    Copy-Atomic (Join-Path $tx 'checkpoint2_3_geometry_probe.py') (Join-Path $root 'R2_FACIAL_ANATOMICAL_AXES_AND_CANDIDATE_PROBE.py')
    Copy-Atomic (Join-Path $tx 'checkpoint2-3-probe.corrected.json.tmp') (Join-Path $root 'R2_FACIAL_ANATOMICAL_AXES_AND_CANDIDATE_PROBE.json')
    Copy-Atomic (Join-Path $tx 'checkpoint2-3-probe.corrected.runtime.log') (Join-Path $root 'R2_FACIAL_ANATOMICAL_AXES_AND_CANDIDATE_PROBE.runtime.log')
    Copy-Atomic (Join-Path $tx 'checkpoint2-3-probe.runtime.log') (Join-Path $root 'R2_FACIAL_ANATOMY_CHECKPOINT2_3_REJECTED.runtime.log')
}

$foundationLink = [ordered]@{
    source_blend = $source
    source_sha256 = $sourceHash
    object_name = $identity.foundation.object_name
    mesh_name = $identity.foundation.mesh_name
    vertex_count = $identity.foundation.vertices
    edge_count = $identity.foundation.edges
    polygon_count = $identity.foundation.polygons
    loop_count = $identity.foundation.loops
    ordered_vertex_coordinates_sha256 = $identity.fingerprints.ordered_vertex_coordinates_sha256
    ordered_polygon_vertex_indices_sha256 = $identity.fingerprints.ordered_polygon_vertex_indices_sha256
    ordered_edges_sha256 = $identity.fingerprints.ordered_edges_sha256
    combined_foundation_identity_sha256 = $identity.fingerprints.combined_foundation_identity_sha256
}

$landmarkCertificate = [ordered]@{
    schema_version = 1
    certificate = 'R2_FACIAL_LANDMARK_CERTIFICATE'
    execution_status = 'BLOCKED'
    technical_verdict = 'REPROVADO'
    approved = $false
    recoverable = $false
    generated_at = $now
    foundation_link = $foundationLink
    anatomical_axes = $probe.axes
    mandatory_landmark_count = $audit.mandatory_landmark_count
    certifiable_landmark_count = $audit.certifiable_landmark_count
    partial_certifiable_evidence_not_phase_approval = $audit.certifiable_landmark_candidates
    missing_or_uncertifiable_mandatory_landmarks = $audit.missing_or_uncertifiable_mandatory_landmarks
    gates = [ordered]@{
        LandmarkIndicesValidForPartialEntries = $true
        LandmarkCoordinatesMatchForPartialEntries = $true
        LandmarkTopologyFingerprintsMatchForPartialEntries = $true
        LandmarkFoundationHashLinked = $true
        AllMandatoryLandmarksPresent = $false
        LeftRightSymmetryMappingValidForMandatorySet = $false
        DuplicatePrimaryLandmarks = 0
        OutOfRangeIndices = 0
        FacialLandmarksCertified = $false
    }
    blocking_reason = $audit.blocking_reason
    evidence_file = (Join-Path $root 'R2_FACIAL_SEMANTIC_SUFFICIENCY_AUDIT.json')
}
Write-JsonAtomic (Join-Path $root 'R2_FACIAL_LANDMARK_CERTIFICATE.json') $landmarkCertificate

$ocularCertificate = [ordered]@{
    schema_version = 1
    certificate = 'R2_OCULAR_ASSET_CERTIFICATE'
    execution_status = 'BLOCKED'
    technical_verdict = 'REPROVADO'
    approved = $false
    recoverable = $false
    generated_at = $now
    foundation_link = $foundationLink
    audit = $audit.ocular_audit
    classifications = [ordered]@{
        left_eyeball = 'BLOCKED_MISSING_DESIGN_EVIDENCE'
        right_eyeball = 'BLOCKED_MISSING_DESIGN_EVIDENCE'
        eye_centers = 'BLOCKED_MISSING_DESIGN_EVIDENCE'
        eye_radii = 'BLOCKED_MISSING_DESIGN_EVIDENCE'
        rotational_pivots = 'BLOCKED_MISSING_DESIGN_EVIDENCE'
        eye_sockets = 'REPAIRABLE_TRANSACTIONALLY_AFTER_APPROVED_EYEBALL_DESIGN'
        upper_and_lower_eyelid_boundary_seeds = 'READY'
        corneal_direction = 'BLOCKED_MISSING_DESIGN_EVIDENCE'
        material_assignments = 'BLOCKED_MISSING_DESIGN_EVIDENCE'
        glb_compatibility = 'NOT_AUDITABLE_WITHOUT_ASSETS'
    }
    created_support_assets = @()
    support_asset_construction_authorized_by_evidence = $false
    reason = $audit.ocular_audit.per_side_sphere_fit_stability.left.reason
}
Write-JsonAtomic (Join-Path $root 'R2_OCULAR_ASSET_CERTIFICATE.json') $ocularCertificate

$oralCertificate = [ordered]@{
    schema_version = 1
    certificate = 'R2_ORAL_ASSET_CERTIFICATE'
    execution_status = 'BLOCKED'
    technical_verdict = 'REPROVADO'
    approved = $false
    recoverable = $false
    generated_at = $now
    foundation_link = $foundationLink
    audit = $audit.oral_audit
    classifications = [ordered]@{
        upper_lip = 'BLOCKED_MISSING_DESIGN_EVIDENCE'
        lower_lip = 'BLOCKED_MISSING_DESIGN_EVIDENCE'
        mouth_corners = 'BLOCKED_MISSING_DESIGN_EVIDENCE'
        mouth_opening_boundary = 'BLOCKED_MISSING_DESIGN_EVIDENCE'
        oral_cavity = 'BLOCKED_MISSING_DESIGN_EVIDENCE'
        jaw_relationship = 'BLOCKED_MISSING_DESIGN_EVIDENCE'
        mandibular_pivot = 'BLOCKED_MISSING_DESIGN_EVIDENCE'
        lip_closure_topology = 'BLOCKED_MISSING_DESIGN_EVIDENCE'
        teeth = 'BLOCKED_MISSING_DESIGN_EVIDENCE'
        tongue = 'BLOCKED_MISSING_DESIGN_EVIDENCE'
        gum_surfaces = 'BLOCKED_MISSING_DESIGN_EVIDENCE'
        glb_compatibility = 'NOT_AUDITABLE_WITHOUT_ASSETS'
    }
    created_support_assets = @()
    support_asset_construction_authorized_by_evidence = $false
    reason = $audit.oral_audit.reason
}
Write-JsonAtomic (Join-Path $root 'R2_ORAL_ASSET_CERTIFICATE.json') $oralCertificate

$identityLog = Get-Content -LiteralPath (Join-Path $root 'R2_FACIAL_FOUNDATION_IDENTITY.runtime.log') -Raw
$rejectedLog = Get-Content -LiteralPath (Join-Path $root 'R2_FACIAL_ANATOMY_CHECKPOINT2_3_REJECTED.runtime.log') -Raw
$correctedLog = Get-Content -LiteralPath (Join-Path $root 'R2_FACIAL_ANATOMICAL_AXES_AND_CANDIDATE_PROBE.runtime.log') -Raw
$auditLog = Get-Content -LiteralPath (Join-Path $root 'R2_FACIAL_SEMANTIC_SUFFICIENCY_AUDIT.runtime.log') -Raw
$runtimeMarkdown = @'
# R2 Facial Anatomy Runtime Logs

## Checkpoint 1 - foundation identity

~~~text
{{IDENTITY_LOG}}
~~~

## Rejected Checkpoint 2/3 attempt

Root cause: a recoverable Python type error indexed after converting a vector component to `float`. The output was rejected and never promoted.

~~~text
{{REJECTED_LOG}}
~~~

## Corrected Checkpoint 2/3 run

~~~text
{{CORRECTED_LOG}}
~~~

## Checkpoint 3/4/5/7 semantic sufficiency audit

~~~text
{{AUDIT_LOG}}
~~~
'@
$runtimeMarkdown = $runtimeMarkdown.Replace('{{IDENTITY_LOG}}', $identityLog).Replace('{{REJECTED_LOG}}', $rejectedLog).Replace('{{CORRECTED_LOG}}', $correctedLog).Replace('{{AUDIT_LOG}}', $auditLog)
[System.IO.File]::WriteAllText((Join-Path $root 'R2_FACIAL_ANATOMY_RUNTIME_LOGS.md'), $runtimeMarkdown, (New-Object System.Text.UTF8Encoding($false)))

$blockingReason = $audit.blocking_reason
$recommendedRecovery = $audit.recommended_recovery
$finalReport = @'
# R2 Facial Anatomy Certification Final Report

## Result

ExecutionStatus=BLOCKED  
TechnicalVerdict=REPROVADO  
Recoverable=False  
CurrentCheckpoint=CHECKPOINT_4_LANDMARK_CERTIFICATION_BLOCKED

The immutable foundation was identified and fingerprinted successfully, and its anatomical axes were certified in Blender 4.5.10 LTS. The discovery pass found exactly two closed boundaries wholly adjacent to the approved eye/brow lineage. They support four certifiable eye-corner landmarks and four additional eyelid candidates, but duplicate coordinates prevent distinct upper/lower primary landmarks. This is insufficient to approve the mandatory 38-landmark certificate.

## Decisive evidence

- Source SHA-256 before and after every Blender run: {{SOURCE_HASH}}.
- Foundation: {{FOUNDATION_OBJECT}} / {{FOUNDATION_MESH}}, {{VERTICES}} vertices, {{EDGES}} edges, {{POLYGONS}} polygons.
- Ordered vertex fingerprint: {{VERTEX_FP}}.
- Mandatory landmarks safely certifiable: {{CERTIFIABLE}} of {{MANDATORY}}.
- Scene ocular objects: 0; scene oral objects: 0; oral semantic attributes: 0.
- Boundary edges adjacent to the approved muzzle lineage: {{MUZZLE_BOUNDARY_EDGES}}.
- Eye sphere inference is unstable: the left fit radius ranges across ring depths by {{LEFT_RADIUS_SPREAD}}; the right by {{RIGHT_RADIUS_SPREAD}}. The depth-zero fits are near-planar and ill-conditioned, so they cannot define an eye asset or pivot.
- The approved C086 reference explicitly called for mouth/lip/muzzle/jaw topology to be created. V37 approved surface retopology/proximity but did not certify lip loops, a mouth opening, jaw hinge, or oral cavity.
- V40–V57 official blend hashes were rechecked and all match their approved values.

## Blocking reason

{{BLOCKING_REASON}}

## Consequences

No ocular or oral support asset was created because its dimensions, pivot and topology would be an artistic guess. No blend was saved or published. Checkpoints 9-11 were not run, the independent audit cannot approve incomplete certificates, and HEAD_RIGGING_AND_EXPRESSION_SYSTEM remains blocked at Checkpoint 2.

## Recommended recovery

{{RECOMMENDED_RECOVERY}}

OfficialSourceUnchanged=True  
PreviousOfficialVersionsUnchanged=True  
CreatedImages=0
'@
$finalReport = $finalReport.Replace('{{SOURCE_HASH}}', $sourceHash).Replace('{{FOUNDATION_OBJECT}}', [string]$identity.foundation.object_name).Replace('{{FOUNDATION_MESH}}', [string]$identity.foundation.mesh_name).Replace('{{VERTICES}}', [string]$identity.foundation.vertices).Replace('{{EDGES}}', [string]$identity.foundation.edges).Replace('{{POLYGONS}}', [string]$identity.foundation.polygons).Replace('{{VERTEX_FP}}', [string]$identity.fingerprints.ordered_vertex_coordinates_sha256).Replace('{{CERTIFIABLE}}', [string]$audit.certifiable_landmark_count).Replace('{{MANDATORY}}', [string]$audit.mandatory_landmark_count).Replace('{{MUZZLE_BOUNDARY_EDGES}}', [string]$audit.oral_audit.boundary_edges_adjacent_to_muzzle_lineage_region_1).Replace('{{LEFT_RADIUS_SPREAD}}', [string][math]::Round($audit.ocular_audit.per_side_sphere_fit_stability.left.radius_spread_across_ring_depths, 6)).Replace('{{RIGHT_RADIUS_SPREAD}}', [string][math]::Round($audit.ocular_audit.per_side_sphere_fit_stability.right.radius_spread_across_ring_depths, 6)).Replace('{{BLOCKING_REASON}}', [string]$blockingReason).Replace('{{RECOMMENDED_RECOVERY}}', [string]$recommendedRecovery)
[System.IO.File]::WriteAllText((Join-Path $root 'R2_FACIAL_ANATOMY_CERTIFICATION_FINAL_REPORT.md'), $finalReport, (New-Object System.Text.UTF8Encoding($false)))

$blockedReport = @'
# R2 Facial Anatomy Certification Blocked Report

ExecutionStatus=BLOCKED
TechnicalVerdict=REPROVADO
Recoverable=False
CurrentCheckpoint=CHECKPOINT_4_LANDMARK_CERTIFICATION_BLOCKED
BlockingReason={{BLOCKING_REASON}}
Evidence={{EVIDENCE}}
OfficialSourceUnchanged=True
CreatedImages=0
RecommendedRecovery={{RECOMMENDED_RECOVERY}}
'@
$evidenceSummary = (Join-Path $root 'R2_FACIAL_FOUNDATION_IDENTITY.json') + '; ' + (Join-Path $root 'R2_FACIAL_ANATOMICAL_AXES_AND_CANDIDATE_PROBE.json') + '; ' + (Join-Path $root 'R2_FACIAL_SEMANTIC_SUFFICIENCY_AUDIT.json') + '; Blender runtime: 8 landmark candidates, 4/38 mandatory landmarks certifiable, 2 duplicate eye-coordinate pairs, 0 ocular objects, 0 oral objects, 0 oral semantic attributes, 0 muzzle-lineage boundary edges, unstable ocular sphere fits.'
$blockedReport = $blockedReport.Replace('{{BLOCKING_REASON}}', [string]$blockingReason).Replace('{{EVIDENCE}}', $evidenceSummary).Replace('{{RECOMMENDED_RECOVERY}}', [string]$recommendedRecovery)
[System.IO.File]::WriteAllText((Join-Path $root 'R2_FACIAL_ANATOMY_CERTIFICATION_BLOCKED_REPORT.md'), $blockedReport, (New-Object System.Text.UTF8Encoding($false)))

$artifactNames = @(
    'R2_FACIAL_FOUNDATION_IDENTITY.json',
    'R2_FACIAL_ANATOMICAL_AXES_AND_CANDIDATE_PROBE.json',
    'R2_FACIAL_SEMANTIC_SUFFICIENCY_AUDIT.json',
    'R2_FACIAL_LANDMARK_CERTIFICATE.json',
    'R2_OCULAR_ASSET_CERTIFICATE.json',
    'R2_ORAL_ASSET_CERTIFICATE.json',
    'R2_FACIAL_ANATOMY_RUNTIME_LOGS.md',
    'R2_FACIAL_ANATOMY_CERTIFICATION_FINAL_REPORT.md',
    'R2_FACIAL_ANATOMY_CERTIFICATION_BLOCKED_REPORT.md'
)
$artifactHashes = [ordered]@{}
foreach ($name in $artifactNames) {
    $artifactHashes[$name] = (Get-FileHash -LiteralPath (Join-Path $root $name) -Algorithm SHA256).Hash.ToUpperInvariant()
}

$state = [ordered]@{
    schema_version = 1
    phase = 'FACIAL_ANATOMICAL_LANDMARK_AND_OCULAR_ORAL_ASSET_CERTIFICATION'
    execution_status = 'BLOCKED'
    technical_verdict = 'REPROVADO'
    recoverable = $false
    current_checkpoint = 'CHECKPOINT_4_LANDMARK_CERTIFICATION_BLOCKED'
    source_path = $source
    source_sha256 = $sourceHash
    foundation_identity = $foundationLink
    checkpoints = [ordered]@{
        CHECKPOINT_1_SOURCE_AND_FOUNDATION_IDENTITY = 'APROVADO'
        CHECKPOINT_2_ANATOMICAL_AXES_AND_REFERENCE_SYSTEM = 'APROVADO'
        CHECKPOINT_3_LANDMARK_CANDIDATE_DISCOVERY = 'COMPLETED_WITH_INSUFFICIENT_MANDATORY_EVIDENCE'
        CHECKPOINT_4_LANDMARK_CERTIFICATION = 'BLOCKED'
        CHECKPOINT_5_OCULAR_ASSET_AUDIT = 'DIAGNOSTIC_COMPLETED_BLOCKED_MISSING_DESIGN_EVIDENCE'
        CHECKPOINT_6_OCULAR_SUPPORT_ASSET_PREPARATION = 'NOT_AUTHORIZED_BY_EVIDENCE'
        CHECKPOINT_7_ORAL_ASSET_AUDIT = 'DIAGNOSTIC_COMPLETED_BLOCKED_MISSING_DESIGN_EVIDENCE'
        CHECKPOINT_8_ORAL_SUPPORT_ASSET_PREPARATION = 'NOT_AUTHORIZED_BY_EVIDENCE'
        CHECKPOINT_9_RIG_READINESS_SEMANTIC_MAP = 'NOT_RUN'
        CHECKPOINT_10_INDEPENDENT_AUDIT = 'NOT_RUN'
        CHECKPOINT_11_PUBLICATION = 'NOT_RUN'
    }
    fingerprints = $identity.fingerprints
    anatomical_axes = $probe.axes
    landmark_candidates = [ordered]@{ mandatory = $audit.mandatory_landmark_count; candidates = $audit.landmark_candidate_count; certifiable = $audit.certifiable_landmark_count; duplicate_eye_coordinate_pairs = $audit.duplicate_eye_coordinate_pairs; missing = $audit.missing_or_uncertifiable_mandatory_landmarks }
    certified_landmarks = [ordered]@{ phase_approved = $false; partial_entries = $audit.certifiable_landmark_candidates }
    ocular_assets = $ocularCertificate.classifications
    oral_assets = $oralCertificate.classifications
    created_support_assets = @()
    rig_readiness_semantic_map = @{}
    independent_audit_result = 'NOT_RUN_INCOMPLETE_CERTIFICATES'
    published_blend_path = $null
    published_sha256 = $null
    failed_attempts = @([ordered]@{ checkpoint = 'CHECKPOINT_2_3_PROBE'; error = 'TypeError: float object is not subscriptable'; rejected_log = (Join-Path $root 'R2_FACIAL_ANATOMY_CHECKPOINT2_3_REJECTED.runtime.log'); recovered = $true })
    corrections_performed = @('Corrected vector component conversion before float coercion; reran the complete affected probe and promoted only the passing output.')
    blocker = [ordered]@{ reason = $blockingReason; evidence = (Join-Path $root 'R2_FACIAL_SEMANTIC_SUFFICIENCY_AUDIT.json'); recommended_recovery = $recommendedRecovery }
    official_source_unchanged = $true
    previous_official_versions_unchanged = $true
    previous_version_hash_evidence = $versionEvidence
    artifact_sha256 = $artifactHashes
    created_images = 0
    blend_saved = $false
    temporary_directories_remaining = 0
    next_action = 'AWAIT_APPROVED_ANATOMICAL_DESIGN_PACKAGE_THEN_RERUN_CHECKPOINTS_3_TO_11'
    local_datetime = $now
}
Write-JsonAtomic (Join-Path $root 'R2_FACIAL_ANATOMY_CERTIFICATION_STATE.json') $state

if (Test-Path -LiteralPath $tx) {
    $resolvedRoot = (Resolve-Path -LiteralPath $root).Path.TrimEnd('\')
    $resolvedTx = (Resolve-Path -LiteralPath $tx).Path
    if (-not $resolvedTx.StartsWith($resolvedRoot + '\._r2_facial_anatomy_certification_', [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to remove unexpected transactional path: $resolvedTx"
    }
    Remove-Item -LiteralPath $resolvedTx -Recurse -Force
}

Write-Output 'ExecutionStatus=BLOCKED'
Write-Output 'TechnicalVerdict=REPROVADO'
Write-Output 'Recoverable=False'
Write-Output 'CurrentCheckpoint=CHECKPOINT_4_LANDMARK_CERTIFICATION_BLOCKED'
Write-Output "BlockingReason=$blockingReason"
Write-Output "Evidence=$(Join-Path $root 'R2_FACIAL_SEMANTIC_SUFFICIENCY_AUDIT.json')"
Write-Output 'OfficialSourceUnchanged=True'
Write-Output 'PreviousOfficialVersionsUnchanged=True'
Write-Output 'CreatedImages=0'
Write-Output 'TemporaryDirectoriesRemaining=0'
Write-Output "RecommendedRecovery=$recommendedRecovery"
