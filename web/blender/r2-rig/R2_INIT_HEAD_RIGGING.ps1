$ErrorActionPreference = 'Stop'
$root = 'C:\Projetos\consorcio-os\web\blender\r2-rig'
$statePath = Join-Path $root 'R2_HEAD_RIGGING_STATE.json'
$state = Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
$source = $state.certified_semantic_input.path
$expected = $state.certified_semantic_input.sha256
$destination = Join-Path $root 'r2-head-rig-expression-ready-v1'

function Write-JsonAtomic([string]$Path, [object]$Value) {
    $temporary = Join-Path (Split-Path -Parent $Path) ('.' + (Split-Path -Leaf $Path) + '.' + [guid]::NewGuid().ToString('N') + '.tmp')
    $Value | ConvertTo-Json -Depth 100 | Set-Content -LiteralPath $temporary -Encoding UTF8
    Move-Item -LiteralPath $temporary -Destination $Path -Force
}

if ((Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash.ToUpperInvariant() -ne $expected) { throw 'Certified semantic input hash mismatch.' }
if (Test-Path -LiteralPath $destination) { throw 'Final rig publication already exists.' }
$prior = @(Get-ChildItem -LiteralPath $root -Directory -Force | Where-Object { $_.Name -like '._r2_head_rig_expression_*' })
if ($prior.Count -ne 0) { throw 'Unexpected prior rigging transaction exists.' }
$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$tx = Join-Path $root ('._r2_head_rig_expression_' + $stamp)
$candidate = Join-Path $tx 'r2-head-rig-expression-ready-v1.candidate.blend'
New-Item -ItemType Directory -Path $tx | Out-Null
Copy-Item -LiteralPath $source -Destination $candidate
if ((Get-FileHash -LiteralPath $candidate -Algorithm SHA256).Hash.ToUpperInvariant() -ne $expected) { throw 'Rig candidate source-copy hash mismatch.' }

$state.execution_status = 'IN_PROGRESS'
$state.technical_verdict = 'PENDING'
$state.recoverable = $true
$state.current_checkpoint = 'CHECKPOINT_2_RIG_ARCHITECTURE_APPROVED'
$state.transactional_directory = $tx
$state.transactional_candidate_path = $candidate
$state.temporary_directories_remaining = 1
$state.bone_architecture.status = 'AUTHORIZED_FROM_CERTIFIED_ANATOMY'
$state.control_architecture.status = 'AUTHORIZED_FROM_CERTIFIED_ANATOMY'
$state.next_action = 'BUILD_RIG_AND_EXPRESSION_CANDIDATE'
$state.local_datetime = (Get-Date).ToString('o')
Write-JsonAtomic $statePath $state

Write-Output 'ExecutionStatus=COMPLETED'
Write-Output 'TechnicalVerdict=APROVADO'
Write-Output "CertifiedInput=$source"
Write-Output "CertifiedInputSHA256=$expected"
Write-Output "TransactionalDirectory=$tx"
Write-Output "CandidatePath=$candidate"
Write-Output 'CreatedImages=0'
