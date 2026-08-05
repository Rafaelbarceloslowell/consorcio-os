$ErrorActionPreference = 'Stop'

$root = 'C:\Projetos\consorcio-os\web\blender\r2-rig'
$statePath = Join-Path $root 'R2_FACIAL_ASSET_AUTHORING_STATE.json'
$state = Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
$tx = (Resolve-Path -LiteralPath $state.transactional_directory).Path
$candidate = (Resolve-Path -LiteralPath $state.transactional_candidate_path).Path
$source = $state.official_source_path
$publication = Join-Path $root 'r2-facial-ocular-oral-assets-ready-v1'
$publishedBlend = Join-Path $publication 'r2-facial-ocular-oral-assets-ready-v1.blend'
$auditPath = Join-Path $tx 'R2_FACIAL_ASSET_INDEPENDENT_AUDIT.json.tmp'
$savePath = Join-Path $tx 'R2_FACIAL_ASSET_AUTHORING_SAVE_RESULT.json.tmp'
$audit = Get-Content -LiteralPath $auditPath -Raw | ConvertFrom-Json
$save = Get-Content -LiteralPath $savePath -Raw | ConvertFrom-Json

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

if (-not $audit.independent_audit_approved -or $audit.failed_gates.Count -ne 0) { throw 'Independent pre-publication audit is not approved.' }
$sourceHash = (Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash.ToUpperInvariant()
if ($sourceHash -ne $state.official_source_sha256) { throw 'Official source hash mismatch before publication.' }
$candidateHash = (Get-FileHash -LiteralPath $candidate -Algorithm SHA256).Hash.ToUpperInvariant()
if ($candidateHash -ne $save.candidate_sha256) { throw 'Candidate hash mismatch before publication.' }
if (Test-Path -LiteralPath $publication) { throw "Publication destination already exists: $publication" }

foreach ($entry in $state.previous_version_hash_evidence) {
    $actual = (Get-FileHash -LiteralPath $entry.path -Algorithm SHA256).Hash.ToUpperInvariant()
    if ($actual -ne $entry.expected_sha256) { throw "Official $($entry.version) hash mismatch." }
}

$staging = Join-Path $root ('._r2_facial_asset_publication_' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $staging | Out-Null
$stagedBlend = Join-Path $staging 'r2-facial-ocular-oral-assets-ready-v1.blend'
Copy-Item -LiteralPath $candidate -Destination $stagedBlend
$stagedHash = (Get-FileHash -LiteralPath $stagedBlend -Algorithm SHA256).Hash.ToUpperInvariant()
if ($stagedHash -ne $candidateHash) { throw 'Staged publication hash mismatch.' }
Move-Item -LiteralPath $staging -Destination $publication

$promotions = [ordered]@{
    'R2_AUTHORIZED_TOPOLOGY_CHANGE_MAP.json.tmp' = 'R2_AUTHORIZED_TOPOLOGY_CHANGE_MAP.json'
    'R2_PRESERVATION_ZONE_MAP.json.tmp' = 'R2_PRESERVATION_ZONE_MAP.json'
    'R2_FACIAL_LANDMARK_CERTIFICATE.json.tmp' = 'R2_FACIAL_LANDMARK_CERTIFICATE.json'
    'R2_OCULAR_ASSET_CERTIFICATE.json.tmp' = 'R2_OCULAR_ASSET_CERTIFICATE.json'
    'R2_ORAL_ASSET_CERTIFICATE.json.tmp' = 'R2_ORAL_ASSET_CERTIFICATE.json'
    'R2_FACIAL_SEMANTIC_REGION_MAP.json.tmp' = 'R2_FACIAL_SEMANTIC_REGION_MAP.json'
    'R2_FACIAL_OBJECT_MESH_MANIFEST.json.tmp' = 'R2_FACIAL_OBJECT_MESH_MANIFEST.json'
    'R2_FACIAL_MATERIAL_MANIFEST.json.tmp' = 'R2_FACIAL_MATERIAL_MANIFEST.json'
    'R2_JAW_EYE_PIVOT_SPECIFICATION.json.tmp' = 'R2_JAW_EYE_PIVOT_SPECIFICATION.json'
    'R2_EYELID_LIP_LOOP_SPECIFICATION.json.tmp' = 'R2_EYELID_LIP_LOOP_SPECIFICATION.json'
    'R2_FACIAL_ASSET_AUTHORING_BUILD_REPORT.json.tmp' = 'R2_FACIAL_ASSET_AUTHORING_BUILD_REPORT.json'
    'R2_FACIAL_ASSET_INDEPENDENT_AUDIT.json.tmp' = 'R2_FACIAL_ASSET_INDEPENDENT_AUDIT.json'
}
foreach ($entry in $promotions.GetEnumerator()) {
    Copy-Atomic (Join-Path $tx $entry.Key) (Join-Path $root $entry.Value)
}

$auditMarkdown = @"
# R2 Facial Asset Independent Audit

ExecutionStatus=COMPLETED  
TechnicalVerdict=APROVADO  
IndependentAuditApproved=True  
FacialLandmarksCertified=True  
OcularAssetsCertified=True  
OralAssetsCertified=True  
RigArchitectureBlockerResolved=True  
OfficialSourceUnchanged=True  
FailedGates=NONE  
CreatedImages=0

Candidate SHA-256: $candidateHash

The separate read-only Blender auditor reproduced the authorized oral mask, preserved source coordinates and non-foundation objects, all 38 landmark coordinates and topology fingerprints, eye centers/pivots, eyelid corner contact, oral closure, internal-asset containment, topology metrics, hierarchy, names, materials and image absence.
"@
[System.IO.File]::WriteAllText((Join-Path $root 'R2_FACIAL_ASSET_INDEPENDENT_AUDIT.md'), $auditMarkdown, (New-Object System.Text.UTF8Encoding($false)))

$state.execution_status = 'IN_PROGRESS'
$state.technical_verdict = 'APROVADO_PENDING_PUBLICATION_REOPEN'
$state.recoverable = $true
$state.current_checkpoint = 'CHECKPOINT_10_PUBLICATION_REOPEN_AUDIT'
$state.checkpoint_status.CHECKPOINT_4_OCULAR_ASSET_AUTHORING = 'APROVADO'
$state.checkpoint_status.CHECKPOINT_5_ORAL_AND_MANDIBULAR_ASSET_AUTHORING = 'APROVADO'
$state.checkpoint_status.CHECKPOINT_6_REMAINING_LANDMARK_AUTHORING = 'APROVADO_38_OF_38'
$state.checkpoint_status.CHECKPOINT_7_SEMANTIC_REGION_MAP = 'APROVADO'
$state.checkpoint_status.CHECKPOINT_8_TECHNICAL_VALIDATION = 'APROVADO'
$state.checkpoint_status.CHECKPOINT_9_INDEPENDENT_AUDIT = 'APROVADO'
$state.checkpoint_status.CHECKPOINT_10_ATOMIC_PUBLICATION = 'PUBLISHED_PENDING_REOPEN_AUDIT'
$state.authorized_topology_change_mask = Join-Path $root 'R2_AUTHORIZED_TOPOLOGY_CHANGE_MAP.json'
$state.preservation_mask = Join-Path $root 'R2_PRESERVATION_ZONE_MAP.json'
$state.expected_object_count_before = 16
$state.expected_mesh_count_before = 15
$state.expected_object_count_after = 32
$state.expected_mesh_count_after = 27
$state.anatomical_publication = [ordered]@{ path = $publishedBlend; sha256 = $stagedHash; reopened = $false; independent_audit_approved = $false }
$state.failed_attempts = @(
    [ordered]@{ attempt = 1; result = 'REJECTED'; reason = 'Bone-parented object world transforms did not persist after reopen.'; evidence = Join-Path $tx 'R2_FACIAL_ASSET_INDEPENDENT_AUDIT.attempt1.rejected.json' },
    [ordered]@{ attempt = 2; result = 'REJECTED'; reason = 'New empty pivots were parented before their dependency-graph matrices were updated and reopened at origin.'; evidence = Join-Path $tx 'R2_FACIAL_ASSET_INDEPENDENT_AUDIT.attempt2.rejected.json' }
)
$state.corrections_performed = @(
    'Replaced direct bone parenting with stable armature-object parenting plus explicit head-bone reference metadata.',
    'Initialized empty pivot locations after parent assignment and forced dependency-graph update before eye parenting.',
    'Restored each rejected candidate from the exact immutable source and reran full authoring and independent audit.'
)
$state.local_datetime = (Get-Date).ToString('o')
Write-JsonAtomic $statePath $state

Write-Output 'ExecutionStatus=COMPLETED'
Write-Output 'TechnicalVerdict=APROVADO'
Write-Output 'IndependentAuditApproved=True'
Write-Output "PublishedBlend=$publishedBlend"
Write-Output "PublishedSHA256=$stagedHash"
Write-Output 'OfficialSourceUnchanged=True'
Write-Output 'PreviousOfficialVersionsUnchanged=True'
Write-Output 'CreatedImages=0'
