$ErrorActionPreference = 'Stop'

$root = 'C:\Projetos\consorcio-os\web\blender\r2-rig'
$statePath = Join-Path $root 'R2_FACIAL_ASSET_AUTHORING_STATE.json'
$rigStatePath = Join-Path $root 'R2_HEAD_RIGGING_STATE.json'
$state = Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
$tx = (Resolve-Path -LiteralPath $state.transactional_directory).Path
$published = $state.anatomical_publication.path
$publishedHash = $state.anatomical_publication.sha256
$reopenAuditPath = Join-Path $tx 'R2_FACIAL_ASSET_PUBLICATION_REOPEN_AUDIT.json.tmp'
$reopenAudit = Get-Content -LiteralPath $reopenAuditPath -Raw | ConvertFrom-Json

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

if (-not $reopenAudit.independent_audit_approved -or $reopenAudit.failed_gates.Count -ne 0) { throw 'Published blend reopen audit is not approved.' }
$actualPublishedHash = (Get-FileHash -LiteralPath $published -Algorithm SHA256).Hash.ToUpperInvariant()
if ($actualPublishedHash -ne $publishedHash) { throw 'Published blend hash mismatch.' }
$sourceHash = (Get-FileHash -LiteralPath $state.official_source_path -Algorithm SHA256).Hash.ToUpperInvariant()
if ($sourceHash -ne $state.official_source_sha256) { throw 'Official source hash mismatch.' }
foreach ($entry in $state.previous_version_hash_evidence) {
    if ((Get-FileHash -LiteralPath $entry.path -Algorithm SHA256).Hash.ToUpperInvariant() -ne $entry.expected_sha256) { throw "$($entry.version) hash mismatch." }
}

Copy-Atomic $reopenAuditPath (Join-Path $root 'R2_FACIAL_ASSET_PUBLICATION_REOPEN_AUDIT.json')
$logPromotions = [ordered]@{
    'authoring-attempt1.runtime.log' = 'R2_FACIAL_ASSET_AUTHORING_ATTEMPT_1.runtime.log'
    'independent-audit-attempt1.runtime.log' = 'R2_FACIAL_ASSET_AUDIT_ATTEMPT_1.runtime.log'
    'authoring-attempt2.runtime.log' = 'R2_FACIAL_ASSET_AUTHORING_ATTEMPT_2.runtime.log'
    'independent-audit-attempt2.runtime.log' = 'R2_FACIAL_ASSET_AUDIT_ATTEMPT_2.runtime.log'
    'authoring-attempt3.runtime.log' = 'R2_FACIAL_ASSET_AUTHORING_APPROVED.runtime.log'
    'independent-audit-attempt3.runtime.log' = 'R2_FACIAL_ASSET_AUDIT_APPROVED.runtime.log'
    'publication-reopen-audit.runtime.log' = 'R2_FACIAL_ASSET_PUBLICATION_REOPEN_AUDIT.runtime.log'
    'R2_FACIAL_ASSET_AUTHORING_BUILD_REPORT.attempt1.rejected.json' = 'R2_FACIAL_ASSET_AUTHORING_BUILD_REPORT_ATTEMPT_1_REJECTED.json'
    'R2_FACIAL_ASSET_INDEPENDENT_AUDIT.attempt1.rejected.json' = 'R2_FACIAL_ASSET_INDEPENDENT_AUDIT_ATTEMPT_1_REJECTED.json'
    'R2_FACIAL_ASSET_AUTHORING_BUILD_REPORT.attempt2.rejected.json' = 'R2_FACIAL_ASSET_AUTHORING_BUILD_REPORT_ATTEMPT_2_REJECTED.json'
    'R2_FACIAL_ASSET_INDEPENDENT_AUDIT.attempt2.rejected.json' = 'R2_FACIAL_ASSET_INDEPENDENT_AUDIT_ATTEMPT_2_REJECTED.json'
}
foreach ($entry in $logPromotions.GetEnumerator()) {
    Copy-Atomic (Join-Path $tx $entry.Key) (Join-Path $root $entry.Value)
}

$runtimeRows = @()
foreach ($entry in $logPromotions.GetEnumerator()) {
    $path = Join-Path $root $entry.Value
    $runtimeRows += "- $($entry.Value): SHA-256 $((Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToUpperInvariant())"
}
$runtimeMarkdown = @"
# R2 Facial Asset Authoring Runtime Logs

## Approved execution

- Authoring attempt 3: APPROVED
- Independent audit attempt 3: APPROVED
- Published blend reopen audit: APPROVED
- Published blend: $published
- Published SHA-256: $publishedHash
- Official source unchanged: True
- V40-V57 unchanged: True
- Created images: 0

## Recoverable attempts

- Attempt 1 was rejected because bone-parented world transforms did not reproduce after reopen.
- Attempt 2 was rejected because new empty pivots reopened at the armature origin.
- Both candidates were deleted, restored from the immutable source, corrected and fully rerun.

## Complete log artifacts

$($runtimeRows -join "`r`n")
"@
[System.IO.File]::WriteAllText((Join-Path $root 'R2_FACIAL_ASSET_AUTHORING_RUNTIME_LOGS.md'), $runtimeMarkdown, (New-Object System.Text.UTF8Encoding($false)))

$integrity = @"
# R2 Facial Asset Final Integrity Report

ExecutionStatus=COMPLETED  
TechnicalVerdict=APROVADO  
IndependentAuditApproved=True  
PublishedBlendReopened=True  
FacialLandmarksCertified=True  
MandatoryLandmarkCount=38  
OcularAssetsCertified=True  
OralAssetsCertified=True  
RigArchitectureBlockerResolved=True  
OfficialSourceUnchanged=True  
PreviousOfficialVersionsUnchanged=True  
UnauthorizedGeometryChanges=0  
GeometryChangesOutsideAuthorizedZones=0  
WireEdges=0  
InvalidNonManifold=0  
ZeroAreaFaces=0  
UnsafeDuplicateVertices=0  
UnexpectedConnectedIslands=0  
UnexpectedObjectDuplicates=0  
UnexpectedMeshDuplicates=0  
UnexpectedMaterialDuplicates=0  
CreatedImages=0  
FailedGates=NONE

The publication was reopened in Blender 4.5.10 LTS and compared independently with the immutable source. All original coordinates and all polygons outside the authorized 15-face oral mask match. Existing object signatures, source weights, materials and UVs are preserved. The 38 landmark coordinates and topology fingerprints, ocular pivots, eyelid contact, neutral lip closure and oral containment reproduce exactly.

Published blend: $published  
Published SHA-256: $publishedHash
"@
[System.IO.File]::WriteAllText((Join-Path $root 'R2_FACIAL_ASSET_FINAL_INTEGRITY_REPORT.md'), $integrity, (New-Object System.Text.UTF8Encoding($false)))

$finalReport = @"
# R2 Facial Asset Authoring Final Report

The user-authorized ocular/oral anatomy was completed and independently approved. The semantic publication contains two eyes and pivots, four eyelids, a closed neutral lip system, a local oral opening, hidden oral cavity, restrained upper/lower teeth, tongue, bilateral jaw pivots, 38 certified landmarks and 20 semantic deformation regions.

AnatomicalOfficialBlend=$published  
AnatomicalOfficialSHA256=$publishedHash  
SourceOfficialSHA256=$sourceHash  
FacialOcularOralAssetAuthoringComplete=True  
FacialLandmarksCertified=True  
OcularAssetsCertified=True  
OralAssetsCertified=True  
IndependentAuditApproved=True  
PublishedBlendReopened=True  
RigArchitectureBlockerResolved=True  
OfficialSourceUnchanged=True  
PreviousOfficialVersionsUnchanged=True  
FailedGates=NONE  
CreatedImages=0

NextPhase=RESUME_HEAD_RIGGING_AND_EXPRESSION_SYSTEM_CHECKPOINT_2
"@
[System.IO.File]::WriteAllText((Join-Path $root 'R2_FACIAL_ASSET_AUTHORING_FINAL_REPORT.md'), $finalReport, (New-Object System.Text.UTF8Encoding($false)))

$artifactNames = @(
    'R2_FACIAL_LANDMARK_CERTIFICATE.json','R2_OCULAR_ASSET_CERTIFICATE.json','R2_ORAL_ASSET_CERTIFICATE.json',
    'R2_AUTHORIZED_TOPOLOGY_CHANGE_MAP.json','R2_PRESERVATION_ZONE_MAP.json','R2_FACIAL_SEMANTIC_REGION_MAP.json',
    'R2_FACIAL_OBJECT_MESH_MANIFEST.json','R2_FACIAL_MATERIAL_MANIFEST.json','R2_JAW_EYE_PIVOT_SPECIFICATION.json',
    'R2_EYELID_LIP_LOOP_SPECIFICATION.json','R2_FACIAL_ASSET_AUTHORING_BUILD_REPORT.json',
    'R2_FACIAL_ASSET_INDEPENDENT_AUDIT.json','R2_FACIAL_ASSET_PUBLICATION_REOPEN_AUDIT.json',
    'R2_FACIAL_ASSET_FINAL_INTEGRITY_REPORT.md','R2_FACIAL_ASSET_AUTHORING_FINAL_REPORT.md'
)
$artifactHashes = [ordered]@{}
foreach ($name in $artifactNames) { $artifactHashes[$name] = (Get-FileHash -LiteralPath (Join-Path $root $name) -Algorithm SHA256).Hash.ToUpperInvariant() }

$state.execution_status = 'COMPLETED'
$state.technical_verdict = 'APROVADO'
$state.recoverable = $true
$state.current_checkpoint = 'CHECKPOINT_10_ATOMIC_PUBLICATION_APPROVED'
$state.checkpoint_status.CHECKPOINT_10_ATOMIC_PUBLICATION = 'APROVADO_REOPENED'
$state.checkpoint_status.HEAD_RIGGING_AND_EXPRESSION_SYSTEM = 'AUTHORIZED_TO_RESUME_CHECKPOINT_2'
$state.anatomical_publication.reopened = $true
$state.anatomical_publication.independent_audit_approved = $true
$state | Add-Member -NotePropertyName artifact_sha256 -NotePropertyValue $artifactHashes -Force
$state.created_images = 0
$state.temporary_directories_remaining = 0
$state | Add-Member -NotePropertyName next_phase -NotePropertyValue 'HEAD_RIGGING_AND_EXPRESSION_SYSTEM_CHECKPOINT_2' -Force
$state.local_datetime = (Get-Date).ToString('o')
Write-JsonAtomic $statePath $state

$rig = Get-Content -LiteralPath $rigStatePath -Raw | ConvertFrom-Json
$historicalSource = [ordered]@{ path = $rig.source_path; sha256 = $rig.source_sha256 }
$rig.execution_status = 'IN_PROGRESS'
$rig.technical_verdict = 'PENDING'
$rig.recoverable = $true
$rig.current_checkpoint = 'CHECKPOINT_2_RIG_ARCHITECTURE'
$rig.last_resume_evaluation.technical_blocker = $false
$rig.last_resume_evaluation.state_transition_to_in_progress_authorized = $true
$rig.last_resume_evaluation.reason = 'Resolved by approved facial ocular/oral asset publication and 38-landmark certificate.'
$rig | Add-Member -NotePropertyName historical_consolidated_source -NotePropertyValue $historicalSource -Force
$rig | Add-Member -NotePropertyName certified_semantic_input -NotePropertyValue ([ordered]@{ path = $published; sha256 = $publishedHash; landmark_certificate = Join-Path $root 'R2_FACIAL_LANDMARK_CERTIFICATE.json'; ocular_certificate = Join-Path $root 'R2_OCULAR_ASSET_CERTIFICATE.json'; oral_certificate = Join-Path $root 'R2_ORAL_ASSET_CERTIFICATE.json'; independent_audit = Join-Path $root 'R2_FACIAL_ASSET_PUBLICATION_REOPEN_AUDIT.json' }) -Force
$rig.source_path = $published
$rig.source_sha256 = $publishedHash
$rig.source_sha256_after = $publishedHash
$rig.blocking_reason = $null
$rig.next_phase = 'HEAD_RIGGING_AND_EXPRESSION_SYSTEM'
$rig.next_action = 'BUILD_CHECKPOINT_2_RIG_ARCHITECTURE_FROM_CERTIFIED_SEMANTIC_INPUT'
$rig.official_source_unchanged = $true
$rig.previous_official_versions_unchanged = $true
$rig.created_images = 0
$rig.local_datetime = (Get-Date).ToString('o')
Write-JsonAtomic $rigStatePath $rig

$resolvedRoot = (Resolve-Path -LiteralPath $root).Path.TrimEnd('\')
if (-not $tx.StartsWith($resolvedRoot + '\._r2_facial_asset_authoring_', [System.StringComparison]::OrdinalIgnoreCase)) { throw 'Refusing to remove unexpected transaction.' }
Remove-Item -LiteralPath $tx -Recurse -Force

Write-Output 'ExecutionStatus=COMPLETED'
Write-Output 'TechnicalVerdict=APROVADO'
Write-Output 'FacialOcularOralAssetAuthoringComplete=True'
Write-Output 'MandatoryLandmarkCount=38'
Write-Output 'OcularAssetsCertified=True'
Write-Output 'OralAssetsCertified=True'
Write-Output 'IndependentAuditApproved=True'
Write-Output 'PublishedBlendReopened=True'
Write-Output 'RigArchitectureBlockerResolved=True'
Write-Output "AnatomicalOfficialBlend=$published"
Write-Output "AnatomicalOfficialSHA256=$publishedHash"
Write-Output 'TemporaryDirectoriesRemaining=0'
Write-Output 'NextPhase=HEAD_RIGGING_AND_EXPRESSION_SYSTEM_CHECKPOINT_2'
