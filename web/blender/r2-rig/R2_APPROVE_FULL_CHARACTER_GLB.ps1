$ErrorActionPreference = 'Stop'

$RigRoot = 'C:\Projetos\consorcio-os\web\blender\r2-rig'
$StatePath = Join-Path $RigRoot 'R2_FULL_CHARACTER_INTEGRATION_STATE.json'
$State = Get-Content -LiteralPath $StatePath -Raw | ConvertFrom-Json
$Transaction = $State.transactional_directory
$ExportPath = Join-Path $Transaction 'R2_FULL_CHARACTER_GLB_EXPORT_REPORT.json.tmp'
$RoundTripPath = Join-Path $Transaction 'R2_FULL_CHARACTER_GLB_ROUNDTRIP_AUDIT.json.tmp'
$Export = Get-Content -LiteralPath $ExportPath -Raw | ConvertFrom-Json
$RoundTrip = Get-Content -LiteralPath $RoundTripPath -Raw | ConvertFrom-Json

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

function Promote-Json([string]$Source, [string]$Destination) {
    $Temporary = "$Destination.tmp"
    Copy-Item -LiteralPath $Source -Destination $Temporary -Force
    $null = Get-Content -LiteralPath $Temporary -Raw | ConvertFrom-Json
    if (Test-Path -LiteralPath $Destination) {
        $Backup = "$Destination.atomic-backup"
        [System.IO.File]::Replace($Temporary, $Destination, $Backup, $true)
        Remove-Item -LiteralPath $Backup -Force
    } else {
        Move-Item -LiteralPath $Temporary -Destination $Destination
    }
}

if ($Export.execution_status -ne 'COMPLETED' -or $Export.technical_verdict -ne 'APROVADO' -or @($Export.failed_gates).Count -ne 0) {
    throw 'GLB export report is not approved.'
}
if ($RoundTrip.execution_status -ne 'COMPLETED' -or $RoundTrip.technical_verdict -ne 'APROVADO' -or
    -not $RoundTrip.glb_round_trip_approved -or @($RoundTrip.failed_gates).Count -ne 0) {
    throw 'GLB round-trip report is not approved.'
}
$GLBPath = $Export.glb_candidate_path
$GLBHash = Get-SHA256 $GLBPath
if ($GLBHash -ne $Export.glb_sha256 -or $GLBHash -ne $RoundTrip.glb_sha256) {
    throw 'GLB hash differs among the artifact and reports.'
}
if ($Export.metrics.external_dependencies -ne 0 -or $Export.metrics.missing_buffers -ne 0 -or
    $Export.metrics.missing_images -ne 0 -or @($Export.metrics.duplicate_node_names).Count -ne 0 -or
    @($Export.metrics.duplicate_bone_names).Count -ne 0 -or @($Export.glb_parse_errors).Count -ne 0) {
    throw 'One or more GLB structural gates failed.'
}
if ($Export.metrics.bone_count -ne 65 -or $Export.metrics.morph_target_count -ne 24 -or $Export.metrics.animation_count -ne 9) {
    throw 'GLB behavioral artifact counts are incorrect.'
}
if (-not $RoundTrip.skeleton_round_trip_exact -or -not $RoundTrip.morph_targets_round_trip_confirmed -or
    -not $RoundTrip.animation_clips_round_trip_confirmed -or -not $RoundTrip.neutral_reset_exact) {
    throw 'One or more GLB round-trip behavior gates failed.'
}
if ((Get-SHA256 $State.approved_head_source) -ne $State.approved_head_sha256 -or
    (Get-SHA256 $State.approved_anatomical_source) -ne $State.approved_anatomical_sha256 -or
    (Get-SHA256 $State.approved_body_source) -ne $State.approved_body_sha256) {
    throw 'An immutable official source changed.'
}

Promote-Json $ExportPath (Join-Path $RigRoot 'R2_FULL_CHARACTER_GLB_EXPORT_REPORT.json')
Promote-Json $RoundTripPath (Join-Path $RigRoot 'R2_FULL_CHARACTER_GLB_ROUNDTRIP_AUDIT.json')

$State.current_checkpoint = 'CHECKPOINT_9_GLB_ROUND_TRIP_APPROVED'
$State.glb_candidate_path = $GLBPath
$State.glb_sha256 = $GLBHash
$State.checkpoints | Add-Member -NotePropertyName checkpoint_8_official_glb_export -NotePropertyValue ([ordered]@{
    status = 'APPROVED'
    path = $GLBPath
    sha256 = $GLBHash
    file_size_bytes = $Export.file_size_bytes
    node_count = $Export.metrics.node_count
    mesh_count = $Export.metrics.mesh_count
    primitive_count = $Export.metrics.primitive_count
    material_count = $Export.metrics.material_count
    bone_count = $Export.metrics.bone_count
    skin_count = $Export.metrics.skin_count
    morph_target_count = $Export.metrics.morph_target_count
    animation_count = $Export.metrics.animation_count
    external_dependencies = 0
}) -Force
$State.checkpoints | Add-Member -NotePropertyName checkpoint_9_glb_round_trip -NotePropertyValue ([ordered]@{
    status = 'APPROVED'
    glb_round_trip_approved = $true
    skeleton_round_trip_exact = $true
    morph_targets_round_trip_confirmed = $true
    animation_clips_round_trip_confirmed = $true
    neutral_reset_exact = $true
}) -Force
$State.failed_attempts = @($State.failed_attempts) + @(
    [ordered]@{ checkpoint = 'CHECKPOINT_9'; attempt = 1; error_type = 'RoundTripAuditFalseNegative'; root_cause = 'Imported actions were evaluated at rounded integer frames in a 24 FPS scene.'; candidate_changed = $false; glb_changed = $false },
    [ordered]@{ checkpoint = 'CHECKPOINT_9'; attempt = 2; error_type = 'RoundTripAuditFalseNegative'; root_cause = 'GLB accessors were byte-exact, but integer-frame evaluation still omitted the fractional final subframe.'; candidate_changed = $false; glb_changed = $false },
    [ordered]@{ checkpoint = 'CHECKPOINT_9'; attempt = 3; execution_status = 'COMPLETED'; technical_verdict = 'APROVADO'; correction = 'Audited accessor endpoints byte-for-byte and evaluated imported action endpoints at exact subframes.' }
)
$State.corrections = @($State.corrections) + @('Added byte-level glTF animation accessor continuity audit and exact imported-action subframe evaluation.')
$State.test_results | Add-Member -NotePropertyName glb_export -NotePropertyValue ([ordered]@{ execution_status = 'COMPLETED'; technical_verdict = 'APROVADO'; report = (Join-Path $RigRoot 'R2_FULL_CHARACTER_GLB_EXPORT_REPORT.json'); failed_gates = @() }) -Force
$State.test_results | Add-Member -NotePropertyName glb_round_trip -NotePropertyValue ([ordered]@{ execution_status = 'COMPLETED'; technical_verdict = 'APROVADO'; report = (Join-Path $RigRoot 'R2_FULL_CHARACTER_GLB_ROUNDTRIP_AUDIT.json'); failed_gates = @() }) -Force
$State.next_action = 'CHECKPOINT_10_WEB_RUNTIME_ARCHITECTURE'
$State.local_datetime = (Get-Date).ToString('o')
Write-AtomicJson $StatePath $State

Write-Output 'R2_FULL_CHARACTER_GLB_CHECKPOINTS=APPROVED'
Write-Output 'CurrentCheckpoint=CHECKPOINT_9_GLB_ROUND_TRIP_APPROVED'
Write-Output "GLBCandidate=$GLBPath"
Write-Output "GLBSHA256=$GLBHash"
Write-Output 'GLBRoundTripApproved=True'
Write-Output 'SkeletonRoundTripExact=True'
Write-Output 'MorphTargetsRoundTripConfirmed=True'
Write-Output 'AnimationClipsRoundTripConfirmed=True'
Write-Output 'NeutralResetExact=True'
Write-Output 'ExternalDependencies=0'
Write-Output 'FailedGates=NONE'
