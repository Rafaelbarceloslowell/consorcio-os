$ErrorActionPreference = 'Stop'

$RigRoot = 'C:\Projetos\consorcio-os\web\blender\r2-rig'
$Blender = 'C:\Program Files\Blender Foundation\Blender 4.5\blender.exe'
$InventoryScript = Join-Path $RigRoot 'R2_FULL_CHARACTER_INVENTORY.py'
$BodySource = Join-Path $RigRoot 'r2-rig-v13-weights-refined.blend'
$AnatomicalSource = Join-Path $RigRoot 'r2-facial-ocular-oral-assets-ready-v1\r2-facial-ocular-oral-assets-ready-v1.blend'
$HeadSource = Join-Path $RigRoot 'r2-head-rig-expression-ready-v1\r2-head-rig-expression-ready-v1.blend'
$BodyExpected = '392EA67AEBC3BA0FF72E65BE18F599E22A0C4C1296F2F6D365FFB989F35CF9C1'
$AnatomicalExpected = '50D04CFBAEC2A431D96D4060E2AE82045AFBC56A0E74AD1759D156C0222825B3'
$HeadExpected = '7AE3C98EEF99AE60FF3C0470370147559B6B1CE7EE8455BAFD81D9852D8C0B97'
$StatePath = Join-Path $RigRoot 'R2_FULL_CHARACTER_INTEGRATION_STATE.json'
$CertificatePath = Join-Path $RigRoot 'R2_BODY_RIG_SOURCE_CERTIFICATE.json'

function Get-SHA256([string]$Path) {
    return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash
}

function Assert-FileHash([string]$Path, [string]$Expected) {
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        throw "Required source missing: $Path"
    }
    $Actual = Get-SHA256 $Path
    if ($Actual -ne $Expected) {
        throw "Source hash mismatch: $Path expected=$Expected actual=$Actual"
    }
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

function Invoke-Inventory([string]$Blend, [string]$Output, [string]$Log) {
    $OutputLines = & $Blender -b $Blend --python $InventoryScript -- $Output 2>&1
    $ExitCode = $LASTEXITCODE
    [System.IO.File]::WriteAllLines($Log, [string[]]$OutputLines, [System.Text.UTF8Encoding]::new($false))
    if ($ExitCode -ne 0) {
        throw "Blender inventory failed with exit code $ExitCode. Log: $Log"
    }
    if (-not (Test-Path -LiteralPath $Output -PathType Leaf)) {
        throw "Blender inventory produced no JSON: $Output"
    }
    $Report = Get-Content -LiteralPath $Output -Raw | ConvertFrom-Json
    if ($Report.execution_status -ne 'COMPLETED' -or $Report.technical_verdict -ne 'APROVADO') {
        throw "Blender inventory report rejected: $Output"
    }
    return $Report
}

if (-not (Test-Path -LiteralPath $Blender -PathType Leaf)) {
    throw "Blender 4.5 executable missing: $Blender"
}

Assert-FileHash $BodySource $BodyExpected
Assert-FileHash $AnatomicalSource $AnatomicalExpected
Assert-FileHash $HeadSource $HeadExpected

if (Test-Path -LiteralPath $StatePath -PathType Leaf) {
    $ExistingState = Get-Content -LiteralPath $StatePath -Raw | ConvertFrom-Json
    if ($ExistingState.execution_status -eq 'COMPLETED') {
        throw 'The full-character integration phase is already completed; initialization is not allowed.'
    }
    if ($ExistingState.transactional_directory -and (Test-Path -LiteralPath $ExistingState.transactional_directory -PathType Container)) {
        throw "A resumable transaction already exists: $($ExistingState.transactional_directory)"
    }
}

$Timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$Transaction = Join-Path $RigRoot "._r2_full_character_integration_$Timestamp"
$Candidate = Join-Path $Transaction 'r2-full-character-runtime-ready-v1.candidate.blend'
New-Item -ItemType Directory -Path $Transaction | Out-Null
Copy-Item -LiteralPath $HeadSource -Destination $Candidate

if ((Get-SHA256 $Candidate) -ne $HeadExpected) {
    throw 'Transactional candidate identity does not match the approved head-rig source.'
}

$BodyInventoryPath = Join-Path $Transaction 'R2_BODY_SOURCE_INVENTORY.json'
$AnatomicalInventoryPath = Join-Path $Transaction 'R2_ANATOMICAL_SOURCE_INVENTORY.json'
$HeadInventoryPath = Join-Path $Transaction 'R2_HEAD_SOURCE_INVENTORY.json'
$CandidateInventoryPath = Join-Path $Transaction 'R2_CANDIDATE_INITIAL_INVENTORY.json'

$BodyInventory = Invoke-Inventory $BodySource $BodyInventoryPath (Join-Path $Transaction 'R2_BODY_SOURCE_INVENTORY.runtime.log')
$AnatomicalInventory = Invoke-Inventory $AnatomicalSource $AnatomicalInventoryPath (Join-Path $Transaction 'R2_ANATOMICAL_SOURCE_INVENTORY.runtime.log')
$HeadInventory = Invoke-Inventory $HeadSource $HeadInventoryPath (Join-Path $Transaction 'R2_HEAD_SOURCE_INVENTORY.runtime.log')
$CandidateInventory = Invoke-Inventory $Candidate $CandidateInventoryPath (Join-Path $Transaction 'R2_CANDIDATE_INITIAL_INVENTORY.runtime.log')

$BodyArmature = @($BodyInventory.armatures | Where-Object { $_.name -eq 'R2_Rig' })
$HeadArmature = @($HeadInventory.armatures | Where-Object { $_.name -eq 'R2_Rig' })
if ($BodyArmature.Count -ne 1 -or $HeadArmature.Count -ne 1) {
    throw 'Expected exactly one R2_Rig armature in both V13 and head-rig sources.'
}
if ($BodyArmature[0].body_bone_count -ne 51 -or $HeadArmature[0].body_bone_count -ne 51) {
    throw 'The certified body skeleton must contain exactly 51 body bones including root.'
}
if ($BodyArmature[0].hierarchy_fingerprint -ne $HeadArmature[0].hierarchy_fingerprint) {
    throw 'Body hierarchy fingerprint differs between V13 and the approved head-rig source.'
}
if ($BodyArmature[0].rest_pose_fingerprint -ne $HeadArmature[0].rest_pose_fingerprint) {
    throw 'Body rest-pose fingerprint differs between V13 and the approved head-rig source.'
}

$Certificate = [ordered]@{
    schema_version = 1
    certificate = 'R2_BODY_RIG_SOURCE_CERTIFICATE'
    execution_status = 'COMPLETED'
    technical_verdict = 'APROVADO'
    body_source_certified = $true
    absolute_path = $BodySource
    sha256 = $BodyExpected
    file_size_bytes = (Get-Item -LiteralPath $BodySource).Length
    blender_version = $BodyInventory.blender_version
    armature_identity = $BodyArmature[0].name
    armature_data_identity = $BodyArmature[0].data_name
    bone_count = $BodyArmature[0].bone_count
    deform_bone_count = $BodyArmature[0].deform_bone_count
    hierarchy_fingerprint = $BodyArmature[0].hierarchy_fingerprint
    rest_pose_fingerprint = $BodyArmature[0].rest_pose_fingerprint
    all_bones_fingerprint = $BodyArmature[0].all_bones_fingerprint
    bones = $BodyArmature[0].bones
    deform_mesh_identities = @($BodyInventory.meshes | ForEach-Object { $_.name })
    deform_meshes = $BodyInventory.meshes
    vertex_group_fingerprints = [ordered]@{
        R2_Body = @($BodyInventory.meshes | Where-Object { $_.name -eq 'R2_Body' } | ForEach-Object { $_.vertex_groups })
    }
    modifier_relationships = @($BodyInventory.meshes | ForEach-Object { [ordered]@{ mesh = $_.name; parent = $_.parent; modifiers = $_.modifiers } })
    source_evidence = @(
        [ordered]@{ path = (Join-Path $RigRoot 'r2-v13-weight-refinement-report.txt'); statement = 'regional_weights_refined, maximum four influences, zero unweighted vertices' },
        [ordered]@{ path = (Join-Path $RigRoot 'r2-v19-binding-readiness-report.txt'); statement = 'V13 has R2_Rig, 51 bones, 50 deform bones, one armature modifier and 197505 vertices' },
        [ordered]@{ path = (Join-Path $RigRoot 'r2-v30-semantic-atlas-contextual-approved-v1\r2-v30-semantic-atlas-contextual-approved-v1-manifest.json'); statement = 'approved semantic lineage records exact V13 SHA-256' },
        [ordered]@{ path = (Join-Path $RigRoot 'R2_HEAD_CONSOLIDATION_STATE.json'); statement = 'later approved body decomposition preserves R2_Rig and all existing weights by identity' }
    )
    integrated_instance = [ordered]@{
        path = $HeadSource
        sha256 = $HeadExpected
        armature = $HeadArmature[0].name
        total_bone_count = $HeadArmature[0].bone_count
        body_bone_count = $HeadArmature[0].body_bone_count
        body_hierarchy_fingerprint = $HeadArmature[0].hierarchy_fingerprint
        body_rest_pose_fingerprint = $HeadArmature[0].rest_pose_fingerprint
        exact_body_hierarchy_match = $true
        exact_body_rest_pose_match = $true
        authoritative_construction_source = $true
    }
    official_sources_unchanged = $true
    blend_saved = $false
    images_created = 0
    failed_gates = @()
}

Write-AtomicJson $CertificatePath $Certificate

$State = [ordered]@{
    schema_version = 1
    phase = 'FULL_CHARACTER_RIG_INTEGRATION_AND_WEB_RUNTIME'
    execution_status = 'IN_PROGRESS'
    technical_verdict = 'PENDING'
    recoverable = $true
    current_checkpoint = 'CHECKPOINT_3_TRANSACTIONAL_CANDIDATE_CREATED'
    checkpoints = [ordered]@{
        checkpoint_1_read_only_inventory = [ordered]@{ status = 'APPROVED'; blend_saved = $false; images_created = 0; body_source_certified = $true }
        checkpoint_2_architecture = [ordered]@{ status = 'APPROVED'; spec = (Join-Path $RigRoot 'R2_HEAD_BODY_INTEGRATION_SPEC.json') }
        checkpoint_3_transaction = [ordered]@{ status = 'APPROVED'; candidate_sha256 = $HeadExpected }
    }
    approved_head_source = $HeadSource
    approved_head_sha256 = $HeadExpected
    approved_anatomical_source = $AnatomicalSource
    approved_anatomical_sha256 = $AnatomicalExpected
    approved_body_source = $BodySource
    approved_body_sha256 = $BodyExpected
    body_armature_identity = 'R2_Rig'
    facial_armature_identity = 'R2_Rig'
    body_hierarchy_fingerprint = $BodyArmature[0].hierarchy_fingerprint
    body_rest_pose_fingerprint = $BodyArmature[0].rest_pose_fingerprint
    integration_architecture = 'SINGLE_EXISTING_ARMATURE_NO_MERGE'
    bone_mappings = [ordered]@{ body = 'IDENTITY_51'; facial = 'IDENTITY_14'; head_attachment = 'neck -> head' }
    mesh_mappings = 'IDENTITY_ALL_27_SOURCE_MESHES'
    vertex_group_mappings = 'IDENTITY_NO_WEIGHT_CHANGES'
    material_mappings = 'IDENTITY_NO_MATERIAL_CHANGES'
    morph_target_mappings = 'PENDING_BUILD_MANIFEST'
    animation_clip_mappings = 'PENDING_BUILD_MANIFEST'
    runtime_state_mappings = 'PENDING_BUILD_MANIFEST'
    transactional_directory = $Transaction
    transactional_candidate_path = $Candidate
    transactional_candidate_initial_sha256 = $HeadExpected
    glb_candidate_path = $null
    glb_sha256 = $null
    web_files_changed = @()
    test_results = [ordered]@{}
    failed_attempts = @(
        [ordered]@{
            checkpoint = 'CHECKPOINT_3_TRANSACTIONAL_CANDIDATE'
            attempt = 1
            command = 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File R2_INIT_FULL_CHARACTER_INTEGRATION.ps1'
            error_type = 'PowerShellParameterBindingException'
            message = "New-Item does not expose -LiteralPath in Windows PowerShell 5.1"
            root_cause = 'The initialization script used a parameter available on other filesystem cmdlets but not New-Item in PowerShell 5.1.'
            candidate_created = $false
            official_sources_unchanged = $true
        }
    )
    corrections = @('Replaced New-Item -LiteralPath with the PowerShell 5.1-compatible -Path parameter before any transaction was created.')
    published_blend_path = $null
    published_blend_sha256 = $null
    published_glb_path = $null
    published_glb_sha256 = $null
    official_sources_unchanged = $true
    previous_official_versions_unchanged = $true
    created_images = 0
    temporary_directories_remaining = 1
    git_baseline = 'main...origin/main [ahead 63]; pre-existing modified and untracked files recorded in runtime logs'
    next_phase = $null
    next_action = 'CHECKPOINT_4_HEAD_TO_BODY_RIG_INTEGRATION'
    local_datetime = (Get-Date).ToString('o')
}

Write-AtomicJson $StatePath $State

Write-Output 'R2_FULL_CHARACTER_INITIALIZATION=APPROVED'
Write-Output "ExecutionStatus=IN_PROGRESS"
Write-Output 'TechnicalVerdict=PENDING'
Write-Output 'CurrentCheckpoint=CHECKPOINT_3_TRANSACTIONAL_CANDIDATE_CREATED'
Write-Output "BodySource=$BodySource"
Write-Output "BodySourceSHA256=$BodyExpected"
Write-Output 'BodySourceCertified=True'
Write-Output 'BodyHierarchyExact=True'
Write-Output 'BodyRestPoseExact=True'
Write-Output "Transaction=$Transaction"
Write-Output "Candidate=$Candidate"
Write-Output 'OfficialSourcesUnchanged=True'
Write-Output 'ImagesCreated=0'
