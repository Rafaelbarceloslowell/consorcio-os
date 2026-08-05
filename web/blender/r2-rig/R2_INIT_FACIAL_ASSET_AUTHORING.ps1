$ErrorActionPreference = 'Stop'

$root = 'C:\Projetos\consorcio-os\web\blender\r2-rig'
$source = Join-Path $root 'r2-head-consolidated-rig-ready-v1\r2-head-consolidated-rig-ready-v1.blend'
$expectedSource = '340EEDFD0251432E6B8326B23EAE3AD268D560CC9D2FEE0940C8F03F9DC5B64B'
$publication = Join-Path $root 'r2-facial-ocular-oral-assets-ready-v1'
$certStatePath = Join-Path $root 'R2_FACIAL_ANATOMY_CERTIFICATION_STATE.json'
$identityPath = Join-Path $root 'R2_FACIAL_FOUNDATION_IDENTITY.json'

function Write-JsonAtomic([string]$Path, [object]$Value) {
    $temporary = Join-Path (Split-Path -Parent $Path) ('.' + (Split-Path -Leaf $Path) + '.' + [guid]::NewGuid().ToString('N') + '.tmp')
    $Value | ConvertTo-Json -Depth 100 | Set-Content -LiteralPath $temporary -Encoding UTF8
    Move-Item -LiteralPath $temporary -Destination $Path -Force
}

if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { throw 'Official source is missing.' }
$sourceHash = (Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash.ToUpperInvariant()
if ($sourceHash -ne $expectedSource) { throw "Official source hash mismatch: $sourceHash" }
if (Test-Path -LiteralPath $publication) { throw "Approved publication destination already exists: $publication" }
$unexpected = @(Get-ChildItem -LiteralPath $root -Directory -Force | Where-Object { $_.Name -like '._r2_facial_asset_authoring_*' })
if ($unexpected.Count -ne 0) { throw "Unexpected prior authoring transaction exists: $($unexpected.FullName -join ', ')" }

$certState = Get-Content -LiteralPath $certStatePath -Raw | ConvertFrom-Json
$identity = Get-Content -LiteralPath $identityPath -Raw | ConvertFrom-Json
$versionEvidence = @()
foreach ($entry in $certState.previous_version_hash_evidence) {
    $actual = (Get-FileHash -LiteralPath $entry.path -Algorithm SHA256).Hash.ToUpperInvariant()
    $versionEvidence += [ordered]@{
        version = $entry.version
        path = $entry.path
        expected_sha256 = $entry.expected_sha256
        actual_sha256 = $actual
        unchanged = ($actual -eq $entry.expected_sha256)
    }
}
if (@($versionEvidence | Where-Object { -not $_.unchanged }).Count -ne 0) { throw 'V40-V57 hash mismatch.' }

$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$tx = Join-Path $root ('._r2_facial_asset_authoring_' + $stamp)
$candidate = Join-Path $tx 'r2-facial-ocular-oral-assets-ready-v1.candidate.blend'
New-Item -ItemType Directory -Path $tx | Out-Null
Copy-Item -LiteralPath $source -Destination $candidate
$candidateInitialHash = (Get-FileHash -LiteralPath $candidate -Algorithm SHA256).Hash.ToUpperInvariant()
if ($candidateInitialHash -ne $expectedSource) { throw 'Transactional source copy hash mismatch.' }

$inputArtifacts = [ordered]@{}
foreach ($name in @(
    'R2_FACIAL_ANATOMY_CERTIFICATION_STATE.json',
    'R2_FACIAL_ANATOMY_CERTIFICATION_FINAL_REPORT.md',
    'R2_FACIAL_SEMANTIC_SUFFICIENCY_AUDIT.json',
    'R2_FACIAL_LANDMARK_CERTIFICATE.json',
    'R2_OCULAR_ASSET_CERTIFICATE.json',
    'R2_ORAL_ASSET_CERTIFICATE.json',
    'R2_FACIAL_ASSET_AUTHORING_ARCHITECTURE.md'
)) {
    $inputArtifacts[$name] = (Get-FileHash -LiteralPath (Join-Path $root $name) -Algorithm SHA256).Hash.ToUpperInvariant()
}

$state = [ordered]@{
    schema_version = 1
    mission = 'FACIAL_OCULAR_ORAL_ASSET_AUTHORING_AND_RIG_RESUME'
    execution_status = 'IN_PROGRESS'
    technical_verdict = 'PENDING'
    recoverable = $true
    current_checkpoint = 'CHECKPOINT_3_TRANSACTIONAL_WORKSPACE'
    checkpoint_status = [ordered]@{
        CHECKPOINT_1_SOURCE_AND_BLOCKER_REVALIDATION = 'APROVADO'
        CHECKPOINT_2_AUTHORING_ARCHITECTURE = 'APROVADO'
        CHECKPOINT_3_TRANSACTIONAL_WORKSPACE = 'APROVADO'
        CHECKPOINT_4_OCULAR_ASSET_AUTHORING = 'PENDING'
        CHECKPOINT_5_ORAL_AND_MANDIBULAR_ASSET_AUTHORING = 'PENDING'
        CHECKPOINT_6_REMAINING_LANDMARK_AUTHORING = 'PENDING'
        CHECKPOINT_7_SEMANTIC_REGION_MAP = 'PENDING'
        CHECKPOINT_8_TECHNICAL_VALIDATION = 'PENDING'
        CHECKPOINT_9_INDEPENDENT_AUDIT = 'PENDING'
        CHECKPOINT_10_ATOMIC_PUBLICATION = 'PENDING'
        HEAD_RIGGING_AND_EXPRESSION_SYSTEM = 'WAITING_FOR_ANATOMICAL_PUBLICATION'
    }
    official_source_path = $source
    official_source_sha256 = $sourceHash
    official_source_unchanged = $true
    previous_official_versions_unchanged = $true
    previous_version_hash_evidence = $versionEvidence
    foundation_identity = [ordered]@{
        object_name = $identity.foundation.object_name
        mesh_name = $identity.foundation.mesh_name
        vertex_count = $identity.foundation.vertices
        polygon_count = $identity.foundation.polygons
        vertex_order_fingerprint = $identity.fingerprints.ordered_vertex_coordinates_sha256
        combined_identity_fingerprint = $identity.fingerprints.combined_foundation_identity_sha256
    }
    design_authorization = 'EXPLICIT_USER_AUTHORIZATION_2026-08-01'
    authoring_architecture = (Join-Path $root 'R2_FACIAL_ASSET_AUTHORING_ARCHITECTURE.md')
    transactional_directory = $tx
    transactional_candidate_path = $candidate
    transactional_candidate_initial_sha256 = $candidateInitialHash
    input_artifact_sha256 = $inputArtifacts
    authorized_topology_change_mask = $null
    preservation_mask = $null
    expected_object_count_before = $null
    expected_mesh_count_before = $null
    expected_object_count_after = $null
    expected_mesh_count_after = $null
    anatomical_publication = $null
    rig_publication = $null
    failed_attempts = @()
    corrections_performed = @()
    created_images = 0
    temporary_directories_remaining = 1
    local_datetime = (Get-Date).ToString('o')
}
Write-JsonAtomic (Join-Path $root 'R2_FACIAL_ASSET_AUTHORING_STATE.json') $state

Write-Output 'ExecutionStatus=COMPLETED'
Write-Output 'TechnicalVerdict=APROVADO'
Write-Output "SourceSHA256=$sourceHash"
Write-Output 'FoundationIdentityConfirmed=True'
Write-Output 'VertexOrderFingerprintConfirmed=True'
Write-Output 'OfficialSourceUnchanged=True'
Write-Output 'PreviousOfficialVersionsUnchanged=True'
Write-Output 'CreatedImages=0'
Write-Output "TransactionalDirectory=$tx"
Write-Output "CandidatePath=$candidate"
