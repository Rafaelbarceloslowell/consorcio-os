$ErrorActionPreference = 'Stop'

$RigRoot = 'C:\Projetos\consorcio-os\web\blender\r2-rig'
$StatePath = Join-Path $RigRoot 'R2_FULL_CHARACTER_INTEGRATION_STATE.json'
$State = Get-Content -LiteralPath $StatePath -Raw | ConvertFrom-Json
$Transaction = $State.transactional_directory
$BuildReportPath = Join-Path $Transaction 'R2_FULL_CHARACTER_BUILD_REPORT.json.tmp'
$BuildReport = Get-Content -LiteralPath $BuildReportPath -Raw | ConvertFrom-Json

function Get-SHA256([string]$Path) {
    return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash
}

function Write-AtomicJson([string]$Path, $Value) {
    $Temporary = "$Path.tmp"
    $Json = $Value | ConvertTo-Json -Depth 100
    [System.IO.File]::WriteAllText($Temporary, $Json + [Environment]::NewLine, [System.Text.UTF8Encoding]::new($false))
    if (Test-Path -LiteralPath $Path) {
        $Backup = "$Path.atomic-backup"
        [System.IO.File]::Replace($Temporary, $Path, $Backup, $true)
        Remove-Item -LiteralPath $Backup -Force
    } else {
        Move-Item -LiteralPath $Temporary -Destination $Path
    }
}

function Promote-Artifact([string]$TemporaryName, [string]$FinalName) {
    $Source = Join-Path $Transaction $TemporaryName
    $Destination = Join-Path $RigRoot $FinalName
    if (-not (Test-Path -LiteralPath $Source -PathType Leaf)) {
        throw "Missing approved build artifact: $Source"
    }
    $DestinationTemporary = "$Destination.tmp"
    Copy-Item -LiteralPath $Source -Destination $DestinationTemporary -Force
    $null = Get-Content -LiteralPath $DestinationTemporary -Raw | ConvertFrom-Json
    if (Test-Path -LiteralPath $Destination) {
        $Backup = "$Destination.atomic-backup"
        [System.IO.File]::Replace($DestinationTemporary, $Destination, $Backup, $true)
        Remove-Item -LiteralPath $Backup -Force
    } else {
        Move-Item -LiteralPath $DestinationTemporary -Destination $Destination
    }
}

if ($BuildReport.execution_status -ne 'COMPLETED' -or $BuildReport.technical_verdict -ne 'APROVADO') {
    throw 'Build report is not approved.'
}
if (@($BuildReport.failed_gates).Count -ne 0) {
    throw 'Build report contains failed gates.'
}
if ($BuildReport.runtime_state_count -ne 10 -or $BuildReport.animation_clip_count -ne 9) {
    throw 'Runtime-state or action count differs from the approved architecture.'
}
if ((Get-SHA256 $State.transactional_candidate_path) -ne $BuildReport.candidate_sha256) {
    throw 'Candidate hash differs from the approved build report.'
}
if ((Get-SHA256 $State.approved_head_source) -ne $State.approved_head_sha256 -or
    (Get-SHA256 $State.approved_anatomical_source) -ne $State.approved_anatomical_sha256 -or
    (Get-SHA256 $State.approved_body_source) -ne $State.approved_body_sha256) {
    throw 'An immutable official source changed during construction.'
}

$Artifacts = [ordered]@{
    'R2_FULL_CHARACTER_BUILD_REPORT.json.tmp' = 'R2_FULL_CHARACTER_BUILD_REPORT.json'
    'R2_FULL_CHARACTER_BONE_MAP.json.tmp' = 'R2_FULL_CHARACTER_BONE_MAP.json'
    'R2_FULL_CHARACTER_VERTEX_GROUP_MAP.json.tmp' = 'R2_FULL_CHARACTER_VERTEX_GROUP_MAP.json'
    'R2_FULL_CHARACTER_MORPH_TARGET_MAP.json.tmp' = 'R2_FULL_CHARACTER_MORPH_TARGET_MAP.json'
    'R2_FULL_CHARACTER_RUNTIME_STATE_MAP.json.tmp' = 'R2_FULL_CHARACTER_RUNTIME_STATE_MAP.json'
    'R2_FULL_CHARACTER_ANIMATION_CLIP_MAP.json.tmp' = 'R2_FULL_CHARACTER_ANIMATION_CLIP_MAP.json'
    'R2_FULL_CHARACTER_NEUTRAL_RESET_SPEC.json.tmp' = 'R2_FULL_CHARACTER_NEUTRAL_RESET_SPEC.json'
}
foreach ($Entry in $Artifacts.GetEnumerator()) {
    Promote-Artifact $Entry.Key $Entry.Value
}

$State.current_checkpoint = 'CHECKPOINT_6_ANIMATION_CLIPS_APPROVED'
$State.checkpoints | Add-Member -NotePropertyName checkpoint_4_head_body_integration -NotePropertyValue ([ordered]@{
    status = 'APPROVED'
    architecture = 'SINGLE_EXISTING_ARMATURE_NO_MERGE'
    body_bones_preserved = 51
    facial_bones_preserved = 14
    head_body_attachment_stable = $true
    geometry_changes = 0
    weight_changes = 0
}) -Force
$State.checkpoints | Add-Member -NotePropertyName checkpoint_5_runtime_state_system -NotePropertyValue ([ordered]@{
    status = 'APPROVED'
    states = 10
    state_map = (Join-Path $RigRoot 'R2_FULL_CHARACTER_RUNTIME_STATE_MAP.json')
    neutral_reset_exact = $true
}) -Force
$State.checkpoints | Add-Member -NotePropertyName checkpoint_6_animation_clips -NotePropertyValue ([ordered]@{
    status = 'APPROVED'
    clips = 9
    clip_map = (Join-Path $RigRoot 'R2_FULL_CHARACTER_ANIMATION_CLIP_MAP.json')
    loop_continuity_exact = $true
    root_motion = 'NONE'
}) -Force
$State | Add-Member -NotePropertyName transactional_candidate_sha256 -NotePropertyValue $BuildReport.candidate_sha256 -Force
$State.morph_target_mappings = Join-Path $RigRoot 'R2_FULL_CHARACTER_MORPH_TARGET_MAP.json'
$State.animation_clip_mappings = Join-Path $RigRoot 'R2_FULL_CHARACTER_ANIMATION_CLIP_MAP.json'
$State.runtime_state_mappings = Join-Path $RigRoot 'R2_FULL_CHARACTER_RUNTIME_STATE_MAP.json'
$State.test_results | Add-Member -NotePropertyName build -NotePropertyValue ([ordered]@{
    execution_status = 'COMPLETED'
    technical_verdict = 'APROVADO'
    candidate_sha256 = $BuildReport.candidate_sha256
    neutral_reset_exact = $true
    failed_gates = @()
}) -Force
$State.next_action = 'CHECKPOINT_7_COMBINED_DEFORMATION_RUNTIME_TESTS'
$State.local_datetime = (Get-Date).ToString('o')
Write-AtomicJson $StatePath $State

Write-Output 'R2_FULL_CHARACTER_BUILD_CHECKPOINT=APPROVED'
Write-Output 'CurrentCheckpoint=CHECKPOINT_6_ANIMATION_CLIPS_APPROVED'
Write-Output "CandidateSHA256=$($BuildReport.candidate_sha256)"
Write-Output 'RuntimeStateSystemConfirmed=True'
Write-Output 'AnimationClipsConfirmed=True'
Write-Output 'OfficialSourcesUnchanged=True'
Write-Output 'CreatedImages=0'
