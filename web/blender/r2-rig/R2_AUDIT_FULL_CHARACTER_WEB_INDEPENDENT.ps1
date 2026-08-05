param(
    [Parameter(Mandatory = $true)][string]$GlbPath,
    [Parameter(Mandatory = $true)][string]$HeadlessReportPath,
    [Parameter(Mandatory = $true)][string]$OutputPath
)

$ErrorActionPreference = 'Stop'
$ProjectRoot = 'C:\Projetos\consorcio-os\web'
$ExpectedGlbHash = 'E3B9702C0367A8CAFB138B5C9AB94D6CC448C470CD69D74A46333A9953207A59'
$ExpectedAnimations = @(
    'R2_ALERT',
    'R2_AWAITING_ACTION',
    'R2_CELEBRATING_SALE',
    'R2_ERROR_ATTENTION',
    'R2_IDLE',
    'R2_LISTENING',
    'R2_NEUTRAL',
    'R2_THINKING',
    'R2_WORKING'
)

$ResolvedGlb = (Resolve-Path -LiteralPath $GlbPath).Path
$GlbHash = (Get-FileHash -LiteralPath $ResolvedGlb -Algorithm SHA256).Hash
$Bytes = [System.IO.File]::ReadAllBytes($ResolvedGlb)
if ([Text.Encoding]::ASCII.GetString($Bytes, 0, 4) -ne 'glTF') {
    throw 'Invalid GLB magic.'
}
$JsonLength = [BitConverter]::ToInt32($Bytes, 12)
$JsonText = [Text.Encoding]::UTF8.GetString($Bytes, 20, $JsonLength).TrimEnd([char]0x20, [char]0)
$Glb = $JsonText | ConvertFrom-Json
$EmbeddedImageCount = if ($null -eq $Glb.images) { 0 } else { @($Glb.images).Count }

$AnimationNames = @($Glb.animations | ForEach-Object { $_.name } | Sort-Object)
$NodeNames = @($Glb.nodes | ForEach-Object { $_.name })
$DuplicateNodeNames = @(
    $NodeNames |
        Where-Object { $_ } |
        Group-Object |
        Where-Object { $_.Count -gt 1 } |
        ForEach-Object { $_.Name }
)

$Headless = Get-Content -Raw -LiteralPath $HeadlessReportPath | ConvertFrom-Json
$RuntimePath = Join-Path $ProjectRoot 'components\dashboard\3d\r2\real\r2-full-character-runtime.ts'
$ModelPath = Join-Path $ProjectRoot 'components\dashboard\3d\r2\real\r2-full-character-model.tsx'
$DashboardAvatarPath = Join-Path $ProjectRoot 'components\dashboard\3d\r2\r2-dashboard-avatar.tsx'
$DashboardEntryPath = Join-Path $ProjectRoot 'components\dashboard\3d\gorila-r2-3d.tsx'
$RuntimeText = Get-Content -Raw -LiteralPath $RuntimePath
$ModelText = Get-Content -Raw -LiteralPath $ModelPath
$DashboardAvatarText = Get-Content -Raw -LiteralPath $DashboardAvatarPath
$DashboardEntryText = Get-Content -Raw -LiteralPath $DashboardEntryPath

$StagedFiles = @(& git -C $ProjectRoot diff --cached --name-only)
$TransactionImages = @(
    Get-ChildItem -LiteralPath (Split-Path -Parent $ResolvedGlb) -File |
        Where-Object { $_.Extension -match '^\.(png|jpg|jpeg|webp|bmp|tif|tiff|exr)$' }
)
$RollbackPath = Join-Path $ProjectRoot 'public\models\r2\r2-gorilla-geometry-only.glb'

$Gates = [ordered]@{
    GLBSha256Exact = $GlbHash -eq $ExpectedGlbHash
    GLBVersion2 = [BitConverter]::ToInt32($Bytes, 4) -eq 2
    ExternalDependenciesZero = @($Glb.buffers | Where-Object { $_.uri }).Count -eq 0
    ImagesZero = $EmbeddedImageCount -eq 0
    SkinCountOne = @($Glb.skins).Count -eq 1
    DuplicateNodeNamesZero = $DuplicateNodeNames.Count -eq 0
    BoneCount65 = [int]$Headless.BoneCount -eq 65
    MorphTargetCount24 = [int]$Headless.MorphTargetCount -eq 24
    AnimationNamesExact = (@(Compare-Object $ExpectedAnimations $AnimationNames).Count -eq 0)
    HeadlessRuntimeApproved = [bool]$Headless.Passed
    NeutralResetExact = [bool]$Headless.NeutralResetExact
    PairwiseTransitions100 = [int]$Headless.PairwiseTransitions -eq 100
    ControllerDisposed = [bool]$Headless.ControllerDisposed
    OfficialModelPathExact = $RuntimeText.Contains('/models/r2/r2-full-character-runtime-ready-v1.glb')
    RollbackPathDocumented = $RuntimeText.Contains('/models/r2/r2-gorilla-geometry-only.glb') -and (Test-Path -LiteralPath $RollbackPath)
    MissingAssetValidationExplicit = $RuntimeText.Contains('MISSING_ANIMATION') -and $RuntimeText.Contains('MISSING_MORPH') -and $RuntimeText.Contains('MISSING_BONE')
    ControllerApiComplete = @('setState(', 'setExpression(', 'setViseme(', 'setEyeTarget(', 'setSpeakingIntensity(', 'resetNeutral(', 'dispose(') | ForEach-Object { $RuntimeText.Contains($_) } | Where-Object { -not $_ } | Measure-Object | Select-Object -ExpandProperty Count | ForEach-Object { $_ -eq 0 }
    ModelOwnsCleanup = $ModelText.Contains('controller.dispose()')
    DashboardAvatarUsesFullCharacter = $DashboardAvatarText.Contains('R2FullCharacterModel')
    DashboardEntryUsesFullCharacter = $DashboardEntryText.Contains('R2FullCharacterModel')
    GitStagedFilesZero = $StagedFiles.Count -eq 0
    CreatedImagesZero = $TransactionImages.Count -eq 0
}

$FailedGates = @($Gates.GetEnumerator() | Where-Object { -not $_.Value } | ForEach-Object { $_.Key })
$Report = [ordered]@{
    schema_version = 1
    audit = 'FULL_CHARACTER_INDEPENDENT_WEB_AND_GLB_AUDIT'
    execution_status = $(if ($FailedGates.Count -eq 0) { 'COMPLETED' } else { 'FAILED' })
    technical_verdict = $(if ($FailedGates.Count -eq 0) { 'APROVADO' } else { 'REPROVADO' })
    independent_audit_approved = $FailedGates.Count -eq 0
    glb_path = $ResolvedGlb
    glb_sha256 = $GlbHash
    glb_size_bytes = $Bytes.Length
    node_count = @($Glb.nodes).Count
    mesh_count = @($Glb.meshes).Count
    skin_count = @($Glb.skins).Count
    material_count = @($Glb.materials).Count
    animation_names = $AnimationNames
    duplicate_node_names = $DuplicateNodeNames
    external_dependencies = @($Glb.buffers | Where-Object { $_.uri }).Count
    embedded_images = $EmbeddedImageCount
    headless_runtime = $Headless
    staged_files = $StagedFiles
    transaction_images = @($TransactionImages | ForEach-Object { $_.FullName })
    gates = $Gates
    failed_gates = $FailedGates
}

$Json = $Report | ConvertTo-Json -Depth 20
[System.IO.File]::WriteAllText($OutputPath, $Json + [Environment]::NewLine, [Text.UTF8Encoding]::new($false))
$Json
if ($FailedGates.Count -ne 0) {
    exit 2
}
