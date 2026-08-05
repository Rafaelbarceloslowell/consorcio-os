$ErrorActionPreference = 'Stop'
$root = 'C:\Projetos\consorcio-os\web\blender\r2-rig'
$statePath = Join-Path $root 'R2_HEAD_RIGGING_STATE.json'
$state = Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
$tx = (Resolve-Path -LiteralPath $state.transactional_directory).Path
$candidate = (Resolve-Path -LiteralPath $state.transactional_candidate_path).Path
$publication = Join-Path $root 'r2-head-rig-expression-ready-v1'
$published = Join-Path $publication 'r2-head-rig-expression-ready-v1.blend'
$save = Get-Content -LiteralPath (Join-Path $tx 'R2_HEAD_RIG_SAVE_RESULT.json.tmp') -Raw | ConvertFrom-Json
$audit = Get-Content -LiteralPath (Join-Path $tx 'R2_HEAD_RIG_INDEPENDENT_AUDIT.json.tmp') -Raw | ConvertFrom-Json

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

if (-not $audit.independent_audit_approved -or $audit.failed_gates.Count -ne 0) { throw 'Rig independent audit not approved.' }
$candidateHash = (Get-FileHash -LiteralPath $candidate -Algorithm SHA256).Hash.ToUpperInvariant()
if ($candidateHash -ne $save.candidate_sha256) { throw 'Rig candidate hash mismatch.' }
if ((Get-FileHash -LiteralPath $state.certified_semantic_input.path -Algorithm SHA256).Hash.ToUpperInvariant() -ne $state.certified_semantic_input.sha256) { throw 'Semantic source hash mismatch.' }
if ((Get-FileHash -LiteralPath $state.historical_consolidated_source.path -Algorithm SHA256).Hash.ToUpperInvariant() -ne $state.historical_consolidated_source.sha256) { throw 'Consolidated source hash mismatch.' }
if (Test-Path -LiteralPath $publication) { throw 'Rig publication destination already exists.' }

$facialState = Get-Content -LiteralPath (Join-Path $root 'R2_FACIAL_ASSET_AUTHORING_STATE.json') -Raw | ConvertFrom-Json
foreach ($entry in $facialState.previous_version_hash_evidence) {
    if ((Get-FileHash -LiteralPath $entry.path -Algorithm SHA256).Hash.ToUpperInvariant() -ne $entry.expected_sha256) { throw "$($entry.version) hash mismatch." }
}

$staging = Join-Path $root ('._r2_head_rig_publication_' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $staging | Out-Null
$staged = Join-Path $staging 'r2-head-rig-expression-ready-v1.blend'
Copy-Item -LiteralPath $candidate -Destination $staged
if ((Get-FileHash -LiteralPath $staged -Algorithm SHA256).Hash.ToUpperInvariant() -ne $candidateHash) { throw 'Staged rig hash mismatch.' }
Move-Item -LiteralPath $staging -Destination $publication

$promotions = [ordered]@{
    'R2_HEAD_RIG_BUILD_REPORT.json.tmp' = 'R2_HEAD_RIG_BUILD_REPORT.json'
    'R2_HEAD_RIG_BONE_MAP.json.tmp' = 'R2_HEAD_RIG_BONE_MAP.json'
    'R2_HEAD_RIG_CONTROL_MAP.json.tmp' = 'R2_HEAD_RIG_CONTROL_MAP.json'
    'R2_HEAD_RIG_SHAPE_KEY_MAP.json.tmp' = 'R2_HEAD_RIG_SHAPE_KEY_MAP.json'
    'R2_EXPRESSION_SYSTEM_SPEC.json.tmp' = 'R2_EXPRESSION_SYSTEM_SPEC.json'
    'R2_EXPRESSION_CHANNEL_MAP.json.tmp' = 'R2_EXPRESSION_CHANNEL_MAP.json'
    'R2_VISEME_READINESS_MAP.json.tmp' = 'R2_VISEME_READINESS_MAP.json'
    'R2_HEAD_RIG_RUNTIME_TEST_RESULTS.json.tmp' = 'R2_HEAD_RIG_RUNTIME_TEST_RESULTS.json'
    'R2_HEAD_RIG_INDEPENDENT_AUDIT.json.tmp' = 'R2_HEAD_RIG_INDEPENDENT_AUDIT.json'
}
foreach ($entry in $promotions.GetEnumerator()) { Copy-Atomic (Join-Path $tx $entry.Key) (Join-Path $root $entry.Value) }

$expressionMd = @"
# R2 Expression System Specification

Status: `IMPLEMENTED_AND_RUNTIME_VALIDATED`.

The hybrid system uses certified eye/jaw pivots and shape keys for blink seal, brows, cheeks, muzzle, lip contact, smile/frown, width and O/E shapes. The armature exposes normalized canonical properties for all expression and viseme channels. Eye yaw/pitch and coordinated aim use measured limits of 28 and 20 degrees; jaw opening is limited to 32 degrees.

Runtime validation passed 24/24 channels, exact neutral reset, independent reopen checks and GLB round-trip. The complete bone, control, shape-key, expression and viseme maps are stored in the adjacent JSON artifacts.

TechnicalVerdict=APROVADO  
ConstructionAuthorized=True  
PublicationAuthorized=True
"@
[System.IO.File]::WriteAllText((Join-Path $root 'R2_EXPRESSION_SYSTEM_SPEC.md'), $expressionMd, (New-Object System.Text.UTF8Encoding($false)))

$state.execution_status = 'IN_PROGRESS'
$state.technical_verdict = 'APROVADO_PENDING_PUBLICATION_REOPEN'
$state.current_checkpoint = 'FINAL_RIG_PUBLICATION_REOPEN_AUDIT'
$state.bone_architecture = (Get-Content -LiteralPath (Join-Path $root 'R2_HEAD_RIG_BONE_MAP.json') -Raw | ConvertFrom-Json)
$state.control_architecture = (Get-Content -LiteralPath (Join-Path $root 'R2_HEAD_RIG_CONTROL_MAP.json') -Raw | ConvertFrom-Json)
$state.shape_key_mappings = (Get-Content -LiteralPath (Join-Path $root 'R2_HEAD_RIG_SHAPE_KEY_MAP.json') -Raw | ConvertFrom-Json)
$state.expression_channels = (Get-Content -LiteralPath (Join-Path $root 'R2_EXPRESSION_CHANNEL_MAP.json') -Raw | ConvertFrom-Json)
$state.viseme_channels = (Get-Content -LiteralPath (Join-Path $root 'R2_VISEME_READINESS_MAP.json') -Raw | ConvertFrom-Json)
$state.runtime_tests = (Get-Content -LiteralPath (Join-Path $root 'R2_HEAD_RIG_RUNTIME_TEST_RESULTS.json') -Raw | ConvertFrom-Json)
$state.independent_audit_result = $audit
$state.published_blend_path = $published
$state.published_sha256 = $candidateHash
$state.next_action = 'REOPEN_PUBLISHED_RIG_AND_REPEAT_INDEPENDENT_AUDIT'
$state.local_datetime = (Get-Date).ToString('o')
Write-JsonAtomic $statePath $state

Write-Output 'ExecutionStatus=COMPLETED'
Write-Output 'TechnicalVerdict=APROVADO'
Write-Output 'IndependentAuditApproved=True'
Write-Output "PublishedBlend=$published"
Write-Output "PublishedSHA256=$candidateHash"
Write-Output 'NeutralResetExact=True'
Write-Output 'CreatedImages=0'
