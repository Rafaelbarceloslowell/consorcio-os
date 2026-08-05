$ErrorActionPreference = 'Stop'

$RigRoot = 'C:\Projetos\consorcio-os\web\blender\r2-rig'
$StatePath = Join-Path $RigRoot 'R2_FULL_CHARACTER_INTEGRATION_STATE.json'
$State = Get-Content -LiteralPath $StatePath -Raw | ConvertFrom-Json
$Transaction = $State.transactional_directory
$InitialPath = Join-Path $Transaction 'R2_CANDIDATE_INITIAL_INVENTORY.json'
$FinalPath = Join-Path $Transaction 'R2_CANDIDATE_POST_RUNTIME_INVENTORY.json'
$RuntimePath = Join-Path $Transaction 'R2_FULL_CHARACTER_RUNTIME_TESTS.json.tmp'
$RepairPath = Join-Path $Transaction 'R2_AUTHORIZED_FULL_CHARACTER_GEOMETRY_CHANGE_MAP.json.tmp'
$Initial = Get-Content -LiteralPath $InitialPath -Raw | ConvertFrom-Json
$Final = Get-Content -LiteralPath $FinalPath -Raw | ConvertFrom-Json
$Runtime = Get-Content -LiteralPath $RuntimePath -Raw | ConvertFrom-Json
$Repair = Get-Content -LiteralPath $RepairPath -Raw | ConvertFrom-Json

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

if ($Runtime.execution_status -ne 'COMPLETED' -or $Runtime.technical_verdict -ne 'APROVADO' -or @($Runtime.failed_gates).Count -ne 0) {
    throw 'Combined runtime tests are not approved.'
}
if ($Runtime.expression_channels_preserved -ne 24 -or -not $Runtime.neutral_reset_exact) {
    throw 'Expression preservation or neutral reset gate failed.'
}
if ($Runtime.topology.wire_edges -ne 0 -or $Runtime.topology.invalid_non_manifold -ne 0 -or
    $Runtime.topology.unweighted_deform_vertices -ne 0 -or $Runtime.topology.inverted_faces -ne 0 -or
    $Runtime.topology.zero_area_faces -ne 0) {
    throw 'One or more topology/deformation hard gates failed.'
}
if ($Repair.execution_status -ne 'COMPLETED' -or $Repair.technical_verdict -ne 'APROVADO' -or
    $Repair.removed_loose_edge_count -ne 16 -or $Repair.unexpected_geometry_changes -ne 0) {
    throw 'The authorized loose-edge repair is not approved.'
}

$CandidateHash = Get-SHA256 $State.transactional_candidate_path
if ($CandidateHash -ne $Runtime.candidate_sha256 -or $CandidateHash -ne $Final.source_sha256 -or $CandidateHash -ne $Repair.candidate_sha256_after) {
    throw 'Candidate hash differs among runtime, inventory and repair evidence.'
}
if ((Get-SHA256 $State.approved_head_source) -ne $State.approved_head_sha256 -or
    (Get-SHA256 $State.approved_anatomical_source) -ne $State.approved_anatomical_sha256 -or
    (Get-SHA256 $State.approved_body_source) -ne $State.approved_body_sha256) {
    throw 'An immutable source changed.'
}

$InitialArmature = @($Initial.armatures | Where-Object { $_.name -eq 'R2_Rig' })[0]
$FinalArmature = @($Final.armatures | Where-Object { $_.name -eq 'R2_Rig' })[0]
if ($InitialArmature.all_bones_fingerprint -ne $FinalArmature.all_bones_fingerprint -or
    $InitialArmature.hierarchy_fingerprint -ne $FinalArmature.hierarchy_fingerprint -or
    $InitialArmature.rest_pose_fingerprint -ne $FinalArmature.rest_pose_fingerprint) {
    throw 'Armature hierarchy or rest pose changed.'
}
if ((@($Initial.object_names) -join "`n") -ne (@($Final.object_names) -join "`n")) {
    throw 'Object identity changed.'
}

$UnexpectedGeometry = @()
$PreservationFailures = @()
foreach ($InitialMesh in $Initial.meshes) {
    $FinalMesh = @($Final.meshes | Where-Object { $_.name -eq $InitialMesh.name })
    if ($FinalMesh.Count -ne 1) {
        $PreservationFailures += "mesh identity:$($InitialMesh.name)"
        continue
    }
    $Current = $FinalMesh[0]
    foreach ($Field in @('vertex_group_fingerprint','shape_key_fingerprint','attribute_fingerprint','material_fingerprint')) {
        if ($InitialMesh.$Field -ne $Current.$Field) {
            $PreservationFailures += "${Field}:$($InitialMesh.name)"
        }
    }
    if (($InitialMesh.modifiers | ConvertTo-Json -Depth 20 -Compress) -ne ($Current.modifiers | ConvertTo-Json -Depth 20 -Compress)) {
        $PreservationFailures += "modifiers:$($InitialMesh.name)"
    }
    if ($InitialMesh.geometry_fingerprint -ne $Current.geometry_fingerprint) {
        if ($InitialMesh.name -ne 'R2_Head_Face_Foundation') {
            $UnexpectedGeometry += $InitialMesh.name
        } elseif ($InitialMesh.vertices -ne $Current.vertices -or $InitialMesh.faces -ne $Current.faces -or ($InitialMesh.edges - $Current.edges) -ne 16) {
            $PreservationFailures += 'authorized foundation edge delta'
        }
    }
}
if ($UnexpectedGeometry.Count -ne 0 -or $PreservationFailures.Count -ne 0) {
    throw "Fingerprint preservation failed. unexpected_geometry=$($UnexpectedGeometry -join ',') preservation=$($PreservationFailures -join ',')"
}
if (@($Final.actions).Count -ne 9) {
    throw 'Expected exactly nine deterministic actions in the candidate inventory.'
}

Promote-Json $RuntimePath (Join-Path $RigRoot 'R2_FULL_CHARACTER_RUNTIME_TESTS.json')
Promote-Json $RepairPath (Join-Path $RigRoot 'R2_AUTHORIZED_FULL_CHARACTER_GEOMETRY_CHANGE_MAP.json')
Promote-Json $InitialPath (Join-Path $RigRoot 'R2_FULL_CHARACTER_SOURCE_INVENTORY.json')
Promote-Json $FinalPath (Join-Path $RigRoot 'R2_FULL_CHARACTER_CANDIDATE_INVENTORY.json')

$BuildReportPath = Join-Path $RigRoot 'R2_FULL_CHARACTER_BUILD_REPORT.json'
$BuildReport = Get-Content -LiteralPath $BuildReportPath -Raw | ConvertFrom-Json
$BuildReport.candidate_sha256 = $CandidateHash
$BuildReport.geometry_changes = 16
$BuildReport | Add-Member -NotePropertyName authorized_geometry_change -NotePropertyValue ([ordered]@{
    object = 'R2_Head_Face_Foundation'
    operation = 'remove 16 source-proven loose edges'
    map = (Join-Path $RigRoot 'R2_AUTHORIZED_FULL_CHARACTER_GEOMETRY_CHANGE_MAP.json')
    vertices_changed = 0
    faces_changed = 0
}) -Force
$BuildReport | Add-Member -NotePropertyName unexpected_geometry_changes -NotePropertyValue 0 -Force
$BuildReport | Add-Member -NotePropertyName unexpected_weight_changes -NotePropertyValue 0 -Force
$BuildReport | Add-Member -NotePropertyName unexpected_material_changes -NotePropertyValue 0 -Force
Write-AtomicJson $BuildReportPath $BuildReport

$AttemptRecords = @(
    [ordered]@{ checkpoint = 'CHECKPOINT_7_APPROVAL'; attempt = 1; error_type = 'PowerShellParserError'; root_cause = 'A colon immediately after an interpolated variable name was parsed as a drive qualifier.'; correction = 'Delimited the variable as ${Field} before the colon.'; candidate_saved = $false },
    [ordered]@{ checkpoint = 'CHECKPOINT_7'; attempt = 1; error_type = 'IndependentRuntimeAuditFailure'; failed_gates = @('CombinedDeformationRuntimeTests','WireEdges'); root_cause = 'Blink state loop omitted armature.update_tag; wire audit exposed 16 legacy source loose edges.'; candidate_saved = $false },
    [ordered]@{ checkpoint = 'CHECKPOINT_7'; attempt = 2; error_type = 'IndependentRuntimeAuditFailure'; failed_gates = @('WireEdges'); root_cause = 'Correct driver invalidation fixed blink; canonical source comparison was still pending.'; candidate_saved = $false },
    [ordered]@{ checkpoint = 'CHECKPOINT_7'; attempt = 3; error_type = 'LegacyAuditDefectConfirmed'; failed_gates = @('WireEdges'); root_cause = 'Prior auditor defaultdict omitted edges not referenced by polygons; direct source audit proved the legacy false approval mechanism.'; candidate_saved = $false },
    [ordered]@{ checkpoint = 'CHECKPOINT_7_REPAIR'; attempt = 1; error_type = 'PreservationGateRejection'; root_cause = 'Whole-mesh BMesh round-trip reordered or removed protected data.'; candidate_saved = $false },
    [ordered]@{ checkpoint = 'CHECKPOINT_7_REPAIR'; attempt = 2; error_type = 'PreservationGateRejection'; root_cause = 'Edit-mode EDGE delete affected protected mesh elements.'; candidate_saved = $false },
    [ordered]@{ checkpoint = 'CHECKPOINT_7_REPAIR'; attempt = 3; error_type = 'OperationNoOp'; root_cause = 'dissolve_edges with use_verts=False intentionally retained loose edges.'; candidate_saved = $false },
    [ordered]@{ checkpoint = 'CHECKPOINT_7_REPAIR'; attempt = 4; execution_status = 'COMPLETED'; technical_verdict = 'APROVADO'; correction = 'Direct BMEdge removal preserved all protected data and removed exactly 16 loose edges.'; candidate_saved = $true }
)
$State.failed_attempts = @($State.failed_attempts) + $AttemptRecords
$State.corrections = @($State.corrections) + @(
    'Added armature dependency invalidation before combined blink evaluation.',
    'Replaced the legacy sparse edge-face audit with a complete preinitialized edge table.',
    'Certified and removed only the 16 source-proven loose edges using direct BMEdge removal.',
    'Rejected three repair operations before save when exact preservation could not be proven.'
)
$State.current_checkpoint = 'CHECKPOINT_7_COMBINED_DEFORMATION_RUNTIME_TESTS_APPROVED'
$State.checkpoints | Add-Member -NotePropertyName checkpoint_7_combined_runtime_tests -NotePropertyValue ([ordered]@{
    status = 'APPROVED'
    expression_channels_preserved = 24
    expression_level_samples = 120
    all_pair_transitions = 100
    neutral_reset_exact = $true
    wire_edges = 0
    invalid_non_manifold = 0
    unweighted_deform_vertices = 0
    inverted_faces = 0
    zero_area_faces = 0
    unexpected_geometry_changes = 0
    unexpected_weight_changes = 0
    unexpected_material_changes = 0
}) -Force
$State.transactional_candidate_sha256 = $CandidateHash
$State.test_results | Add-Member -NotePropertyName combined_runtime -NotePropertyValue ([ordered]@{
    execution_status = 'COMPLETED'
    technical_verdict = 'APROVADO'
    report = (Join-Path $RigRoot 'R2_FULL_CHARACTER_RUNTIME_TESTS.json')
    failed_gates = @()
}) -Force
$State.next_action = 'CHECKPOINT_8_OFFICIAL_GLB_EXPORT'
$State.local_datetime = (Get-Date).ToString('o')
Write-AtomicJson $StatePath $State

Write-Output 'R2_FULL_CHARACTER_RUNTIME_CHECKPOINT=APPROVED'
Write-Output 'CurrentCheckpoint=CHECKPOINT_7_COMBINED_DEFORMATION_RUNTIME_TESTS_APPROVED'
Write-Output "CandidateSHA256=$CandidateHash"
Write-Output 'ExpressionChannelsPreserved=24'
Write-Output 'NeutralResetExact=True'
Write-Output 'WireEdges=0'
Write-Output 'UnexpectedGeometryChanges=0'
Write-Output 'UnexpectedWeightChanges=0'
Write-Output 'UnexpectedMaterialChanges=0'
Write-Output 'FailedGates=NONE'
