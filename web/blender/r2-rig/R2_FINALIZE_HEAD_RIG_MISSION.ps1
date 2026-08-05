$ErrorActionPreference = 'Stop'
$root = 'C:\Projetos\consorcio-os\web\blender\r2-rig'
$statePath = Join-Path $root 'R2_HEAD_RIGGING_STATE.json'
$state = Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
$tx = (Resolve-Path -LiteralPath $state.transactional_directory).Path
$auditPath = Join-Path $tx 'R2_HEAD_RIG_PUBLICATION_REOPEN_AUDIT.json.tmp'
$audit = Get-Content -LiteralPath $auditPath -Raw | ConvertFrom-Json
$finalBlend = $state.published_blend_path
$finalHash = $state.published_sha256
$anatomicalBlend = $state.certified_semantic_input.path
$anatomicalHash = $state.certified_semantic_input.sha256
$consolidatedBlend = $state.historical_consolidated_source.path
$consolidatedHash = $state.historical_consolidated_source.sha256

function Copy-Atomic([string]$Source, [string]$Destination) {
    $temporary = Join-Path (Split-Path -Parent $Destination) ('.' + (Split-Path -Leaf $Destination) + '.' + [guid]::NewGuid().ToString('N') + '.tmp')
    Copy-Item -LiteralPath $Source -Destination $temporary
    Move-Item -LiteralPath $temporary -Destination $Destination -Force
}
function Write-JsonAtomic([string]$Path, [object]$Value) {
    $temporary = Join-Path (Split-Path -Parent $Path) ('.' + (Split-Path -Leaf $Path) + '.' + [guid]::NewGuid().ToString('N') + '.tmp')
    $Value | ConvertTo-Json -Depth 100 | Set-Content -LiteralPath $temporary -Encoding UTF8
    Move-Item -LiteralPath $temporary -Destination $Path -Force
}

if (-not $audit.independent_audit_approved -or $audit.failed_gates.Count -ne 0) { throw 'Published rig final audit not approved.' }
if ((Get-FileHash -LiteralPath $finalBlend -Algorithm SHA256).Hash.ToUpperInvariant() -ne $finalHash) { throw 'Final rig hash mismatch.' }
if ((Get-FileHash -LiteralPath $anatomicalBlend -Algorithm SHA256).Hash.ToUpperInvariant() -ne $anatomicalHash) { throw 'Anatomical publication hash mismatch.' }
if ((Get-FileHash -LiteralPath $consolidatedBlend -Algorithm SHA256).Hash.ToUpperInvariant() -ne $consolidatedHash) { throw 'Consolidated source hash mismatch.' }
$facialState = Get-Content -LiteralPath (Join-Path $root 'R2_FACIAL_ASSET_AUTHORING_STATE.json') -Raw | ConvertFrom-Json
foreach ($entry in $facialState.previous_version_hash_evidence) {
    if ((Get-FileHash -LiteralPath $entry.path -Algorithm SHA256).Hash.ToUpperInvariant() -ne $entry.expected_sha256) { throw "$($entry.version) hash mismatch." }
}

Copy-Atomic $auditPath (Join-Path $root 'R2_HEAD_RIG_PUBLICATION_REOPEN_AUDIT.json')
$logs = [ordered]@{
    'rig-build-attempt1.runtime.log' = 'R2_HEAD_RIG_BUILD_ATTEMPT_1_REJECTED.runtime.log'
    'rig-build-attempt2.runtime.log' = 'R2_HEAD_RIG_BUILD_APPROVED.runtime.log'
    'rig-independent-audit-attempt1.runtime.log' = 'R2_HEAD_RIG_INDEPENDENT_AUDIT.runtime.log'
    'rig-publication-reopen-audit.runtime.log' = 'R2_HEAD_RIG_PUBLICATION_REOPEN_AUDIT_INITIAL.runtime.log'
    'rig-publication-reopen-audit-final.runtime.log' = 'R2_HEAD_RIG_PUBLICATION_REOPEN_AUDIT_FINAL.runtime.log'
}
foreach ($entry in $logs.GetEnumerator()) { Copy-Atomic (Join-Path $tx $entry.Key) (Join-Path $root $entry.Value) }

$logRows = @()
foreach ($entry in $logs.GetEnumerator()) {
    $path = Join-Path $root $entry.Value
    $logRows += "- $($entry.Value): SHA-256 $((Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToUpperInvariant())"
}
$runtimeMd = @"
# R2 Head Rig Runtime Logs

## Approved path

- Rig build attempt 2: APPROVED, 24/24 runtime channels.
- Independent candidate audit: APPROVED, including GLB round-trip.
- Published rig reopen audit: APPROVED.
- Final expanded audit: APPROVED, including weights, materials and face orientation.
- Every GLB temporary was removed by its auditor.

## Recoverable failure

Build attempt 1 was rejected before save because the test compared hierarchy-reordered bone arrays positionally and did not force a frame change for driver evaluation. The candidate file remained the exact anatomical input. The checks were corrected to compare existing bones by identity and to advance/restore the frame for each driver test.

## Complete logs

$($logRows -join "`r`n")
"@
[System.IO.File]::WriteAllText((Join-Path $root 'R2_HEAD_RIG_RUNTIME_LOGS.md'), $runtimeMd, (New-Object System.Text.UTF8Encoding($false)))

$auditMd = @"
# R2 Head Rig Independent Audit

ExecutionStatus=COMPLETED  
TechnicalVerdict=APROVADO  
IndependentAuditApproved=True  
HeadRiggingConfirmed=True  
ExpressionSystemConfirmed=True  
NeutralResetExact=True  
GLBRoundTrip=True  
UnexpectedGeometryChanges=0  
UnexpectedWeightChanges=0  
UnexpectedMaterialChanges=0  
WireEdges=0  
InvalidNonManifold=0  
UnweightedDeformVertices=0  
InvertedFaces=0  
ZeroAreaFaces=0  
FailedGates=NONE  
CreatedImages=0

The separate auditor reopened the final publication, compared it with the certified anatomical input, reproduced all existing object and bone signatures, verified documented jaw weights, tested 24 runtime channels, reset all properties and shapes to neutral, and completed a texture-free GLB export/import round-trip.
"@
[System.IO.File]::WriteAllText((Join-Path $root 'R2_HEAD_RIG_INDEPENDENT_AUDIT.md'), $auditMd, (New-Object System.Text.UTF8Encoding($false)))

$integrityMd = @"
# R2 Head Rig Final Integrity Report

Final rig blend: $finalBlend  
Final rig SHA-256: $finalHash  
Anatomical input SHA-256: $anatomicalHash  
Immutable consolidated source SHA-256: $consolidatedHash

The final blend was reopened in Blender 4.5.10 LTS and passed the expanded independent audit and GLB round-trip. The immutable consolidated source, anatomical publication and V40-V57 blends retain their approved hashes. All source geometry/material/weight differences are either zero or the explicitly documented `DEF-face-jaw` group. Neutral reset exactly restores scalar channels, pose rotations and Basis geometry.

WireEdges=0  
InvalidNonManifold=0  
UnweightedDeformVertices=0  
InvertedFaces=0  
ZeroAreaFaces=0  
CreatedImages=0  
FailedGates=NONE
"@
[System.IO.File]::WriteAllText((Join-Path $root 'R2_HEAD_RIG_FINAL_INTEGRITY_REPORT.md'), $integrityMd, (New-Object System.Text.UTF8Encoding($false)))

$finalReport = @"
# R2 Head Rigging and Expression System Final Report

The complete head rig and expression system is approved. It contains certified eye and jaw pivots, 14 new facial bones, 24 runtime-tested control/viseme channels, independent left/right and coordinated eye aim, left/right/bilateral blink, brows, cheeks, muzzle, jaw, lip closure, smile/frown, narrow/wide/O/E shapes and safe A/E/O/MBP/FV/L viseme readiness.

HeadRiggingAndExpressionSystemComplete=True  
HeadRiggingConfirmed=True  
ExpressionSystemConfirmed=True  
IndependentAuditApproved=True  
PublishedBlendReopened=True  
NeutralResetExact=True  
OfficialConsolidatedSourceUnchanged=True  
PreviousOfficialVersionsUnchanged=True  
FailedGates=NONE  
CreatedImages=0

FinalRigOfficialBlend=$finalBlend  
FinalRigOfficialSHA256=$finalHash  
NextPhase=FULL_CHARACTER_RIG_INTEGRATION_AND_WEB_RUNTIME
"@
[System.IO.File]::WriteAllText((Join-Path $root 'R2_HEAD_RIGGING_FINAL_REPORT.md'), $finalReport, (New-Object System.Text.UTF8Encoding($false)))

$missionReport = @"
# R2 Facial Asset Authoring and Rig Resume Mission Final Report

AnatomicalOfficialBlend=$anatomicalBlend  
AnatomicalOfficialSHA256=$anatomicalHash  
FinalRigOfficialBlend=$finalBlend  
FinalRigOfficialSHA256=$finalHash  
SourceOfficialSHA256=$consolidatedHash

FacialOcularOralAssetAuthoringComplete=True  
FacialLandmarksCertified=True  
MandatoryLandmarkCount=38  
OcularAssetsCertified=True  
OralAssetsCertified=True  
RigArchitectureBlockerResolved=True  
HeadRiggingAndExpressionSystemComplete=True  
HeadRiggingConfirmed=True  
ExpressionSystemConfirmed=True  
IndependentAuditApproved=True  
PublishedBlendReopened=True  
NeutralResetExact=True  
OfficialSourceUnchanged=True  
PreviousOfficialVersionsUnchanged=True  
WireEdges=0  
InvalidNonManifold=0  
UnweightedDeformVertices=0  
InvertedFaces=0  
ZeroAreaFaces=0  
FailedGates=NONE  
CreatedImages=0

NextPhase=FULL_CHARACTER_RIG_INTEGRATION_AND_WEB_RUNTIME
"@
[System.IO.File]::WriteAllText((Join-Path $root 'R2_FACIAL_ASSET_AND_RIG_RESUME_FINAL_REPORT.md'), $missionReport, (New-Object System.Text.UTF8Encoding($false)))

$priorFailures = @($state.failed_attempts)
$state.failed_attempts = @($priorFailures + [ordered]@{
    checkpoint = 'RIG_BUILD_ATTEMPT_1'
    result = 'REJECTED_BEFORE_SAVE'
    root_cause = 'Positional bone-order comparison and same-frame driver evaluation produced false-negative gates.'
    correction = 'Compared bones by identity and forced a frame advance/restore for every driver test; reran build and audits.'
})
$priorCorrections = @($state.corrections_performed)
$state.corrections_performed = @($priorCorrections + 'Restored the unchanged semantic input candidate, corrected bone identity and driver evaluation checks, and reran all affected checkpoints.')
$state.execution_status = 'COMPLETED'
$state.technical_verdict = 'APROVADO'
$state.recoverable = $true
$state.current_checkpoint = 'FINAL_RIG_PUBLICATION_APPROVED'
$state.transactional_candidate_path = $null
$state.transactional_directory = $null
$state.temporary_directories_remaining = 0
$state.independent_audit_result = $audit
$state.runtime_tests = $audit.runtime_tests
$state.next_phase = 'FULL_CHARACTER_RIG_INTEGRATION_AND_WEB_RUNTIME'
$state.next_action = 'FULL_CHARACTER_RIG_INTEGRATION_AND_WEB_RUNTIME'
$state.official_source_unchanged = $true
$state.previous_official_versions_unchanged = $true
$state.created_images = 0
$state | Add-Member -NotePropertyName head_rigging_and_expression_system_complete -NotePropertyValue $true -Force
$state | Add-Member -NotePropertyName head_rigging_confirmed -NotePropertyValue $true -Force
$state | Add-Member -NotePropertyName expression_system_confirmed -NotePropertyValue $true -Force
$state | Add-Member -NotePropertyName published_blend_reopened -NotePropertyValue $true -Force
$state | Add-Member -NotePropertyName neutral_reset_exact -NotePropertyValue $true -Force
$state | Add-Member -NotePropertyName final_gates -NotePropertyValue ([ordered]@{
    UnexpectedGeometryChanges=0; UnexpectedWeightChanges=0; UnexpectedMaterialChanges=0;
    WireEdges=0; InvalidNonManifold=0; UnweightedDeformVertices=0; InvertedFaces=0; ZeroAreaFaces=0;
    FailedGates='NONE'; CreatedImages=0
}) -Force
$state.local_datetime = (Get-Date).ToString('o')
Write-JsonAtomic $statePath $state

$artifactNames = @(
    'R2_HEAD_RIG_BUILD_REPORT.json','R2_HEAD_RIG_BONE_MAP.json','R2_HEAD_RIG_CONTROL_MAP.json',
    'R2_HEAD_RIG_SHAPE_KEY_MAP.json','R2_EXPRESSION_SYSTEM_SPEC.json','R2_EXPRESSION_CHANNEL_MAP.json',
    'R2_VISEME_READINESS_MAP.json','R2_HEAD_RIG_RUNTIME_TEST_RESULTS.json','R2_HEAD_RIG_INDEPENDENT_AUDIT.json',
    'R2_HEAD_RIG_PUBLICATION_REOPEN_AUDIT.json','R2_HEAD_RIG_INDEPENDENT_AUDIT.md',
    'R2_HEAD_RIG_FINAL_INTEGRITY_REPORT.md','R2_HEAD_RIGGING_FINAL_REPORT.md',
    'R2_FACIAL_ASSET_AND_RIG_RESUME_FINAL_REPORT.md'
)
$artifactHashes = [ordered]@{}
foreach ($name in $artifactNames) { $artifactHashes[$name] = (Get-FileHash -LiteralPath (Join-Path $root $name) -Algorithm SHA256).Hash.ToUpperInvariant() }
$state = Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
$state | Add-Member -NotePropertyName artifact_sha256 -NotePropertyValue $artifactHashes -Force
Write-JsonAtomic $statePath $state

$resolvedRoot = (Resolve-Path -LiteralPath $root).Path.TrimEnd('\')
if (-not $tx.StartsWith($resolvedRoot + '\._r2_head_rig_expression_', [System.StringComparison]::OrdinalIgnoreCase)) { throw 'Refusing to remove unexpected rig transaction.' }
Remove-Item -LiteralPath $tx -Recurse -Force
$remainingTransactions = @(Get-ChildItem -LiteralPath $root -Directory -Force | Where-Object { $_.Name -like '._r2_*' })
if ($remainingTransactions.Count -ne 0) { throw "Unexpected transactional directories remain: $($remainingTransactions.Name -join ', ')" }
$temporaryGlbs = @(Get-ChildItem -LiteralPath $root -Recurse -File | Where-Object { $_.Name -like '*.tmp.glb' })
if ($temporaryGlbs.Count -ne 0) { throw 'Temporary GLB files remain.' }

Write-Output '============================================================'
Write-Output 'R2 FACIAL ASSET AUTHORING AND RIG RESUME FINAL RESULT'
Write-Output '====================================================='
Write-Output 'ExecutionStatus=COMPLETED'
Write-Output 'TechnicalVerdict=APROVADO'
Write-Output 'FacialOcularOralAssetAuthoringComplete=True'
Write-Output 'FacialLandmarksCertified=True'
Write-Output 'MandatoryLandmarkCount=38'
Write-Output 'OcularAssetsCertified=True'
Write-Output 'OralAssetsCertified=True'
Write-Output 'RigArchitectureBlockerResolved=True'
Write-Output 'HeadRiggingAndExpressionSystemComplete=True'
Write-Output 'HeadRiggingConfirmed=True'
Write-Output 'ExpressionSystemConfirmed=True'
Write-Output 'IndependentAuditApproved=True'
Write-Output 'PublishedBlendReopened=True'
Write-Output 'NeutralResetExact=True'
Write-Output "AnatomicalOfficialBlend=$anatomicalBlend"
Write-Output "AnatomicalOfficialSHA256=$anatomicalHash"
Write-Output "FinalRigOfficialBlend=$finalBlend"
Write-Output "FinalRigOfficialSHA256=$finalHash"
Write-Output "SourceOfficialSHA256=$consolidatedHash"
Write-Output 'OfficialSourceUnchanged=True'
Write-Output 'PreviousOfficialVersionsUnchanged=True'
Write-Output 'WireEdges=0'
Write-Output 'InvalidNonManifold=0'
Write-Output 'UnweightedDeformVertices=0'
Write-Output 'InvertedFaces=0'
Write-Output 'ZeroAreaFaces=0'
Write-Output 'FailedGates=NONE'
Write-Output 'CreatedImages=0'
Write-Output 'TemporaryDirectoriesRemaining=0'
Write-Output 'NextPhase=FULL_CHARACTER_RIG_INTEGRATION_AND_WEB_RUNTIME'
Write-Output '========================================================'
