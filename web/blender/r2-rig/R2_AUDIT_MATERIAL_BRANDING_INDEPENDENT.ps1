param(
    [Parameter(Mandatory = $true)][string]$Transaction,
    [Parameter(Mandatory = $true)][string]$OutputJson,
    [Parameter(Mandatory = $true)][string]$OutputMarkdown
)

$ErrorActionPreference = 'Stop'
$RigRoot = 'C:\Projetos\consorcio-os\web\blender\r2-rig'
$ProjectRoot = 'C:\Projetos\consorcio-os\web'
$OfficialBlend = Join-Path $RigRoot 'r2-full-character-runtime-ready-v1\r2-full-character-runtime-ready-v1.blend'
$OfficialGlb = Join-Path $ProjectRoot 'public\models\r2\r2-full-character-runtime-ready-v1.glb'
$Logo = Join-Path $ProjectRoot 'public\brand\GorillaMark_Dark.svg'
$CandidateBlend = Join-Path $Transaction 'r2-full-character-material-branded-ready-v1.candidate.blend'
$CandidateGlb = Join-Path $Transaction 'r2-full-character-material-branded-ready-v1.candidate.glb'
$ExpectedOfficialBlendHash = '3D60D28B852566ABEC764D2DE0EB55D63F42AC26F8F75936109D33898B25E269'
$ExpectedOfficialGlbHash = 'E3B9702C0367A8CAFB138B5C9AB94D6CC448C470CD69D74A46333A9953207A59'
$ExpectedLogoHash = '7FC4BA6C6B5BEEA9B082CFF751A480D7DF8F8D372984703CF6847E2398B5749E'
$ExpectedBranding = @(
    'R2_Brand_LeftArm_GorillaMark_R2_Patch',
    'R2_Brand_RightChest_GorillaMark',
    'R2_Brand_UpperBack_GorillaMark'
)
$ExpectedAnimations = @(
    'R2_ALERT', 'R2_AWAITING_ACTION', 'R2_CELEBRATING_SALE',
    'R2_ERROR_ATTENTION', 'R2_IDLE', 'R2_LISTENING',
    'R2_NEUTRAL', 'R2_THINKING', 'R2_WORKING'
)

foreach ($Path in @($OfficialBlend, $OfficialGlb, $Logo, $CandidateBlend, $CandidateGlb)) {
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        throw "Required audit input missing: $Path"
    }
}

$Validation = Get-Content -Raw -LiteralPath (Join-Path $RigRoot 'R2_MATERIAL_BRANDING_TEST_RESULTS.json') | ConvertFrom-Json
$Export = Get-Content -Raw -LiteralPath (Join-Path $RigRoot 'R2_MATERIAL_BRANDING_EXPORT_REPORT.json') | ConvertFrom-Json
$RoundTrip = Get-Content -Raw -LiteralPath (Join-Path $RigRoot 'R2_MATERIAL_BRANDING_GLB_ROUNDTRIP.json') | ConvertFrom-Json
$RuntimeReportPath = Join-Path $RigRoot 'R2_MATERIAL_BRANDING_WEB_RUNTIME_POST_PUBLICATION.json'
if (-not (Test-Path -LiteralPath $RuntimeReportPath)) {
    $RuntimeReportPath = Join-Path $RigRoot 'R2_MATERIAL_BRANDING_WEB_RUNTIME_CANDIDATE.json'
}
$Runtime = Get-Content -Raw -LiteralPath $RuntimeReportPath | ConvertFrom-Json
$PostRoundTrip = Get-Content -Raw -LiteralPath (Join-Path $RigRoot 'R2_MATERIAL_BRANDING_POST_PUBLICATION_GLB_ROUNDTRIP.json') | ConvertFrom-Json
$Publication = Get-Content -Raw -LiteralPath (Join-Path $RigRoot 'R2_MATERIAL_BRANDING_PUBLICATION_REPORT.json') | ConvertFrom-Json
$Manifest = Get-Content -Raw -LiteralPath (Join-Path $RigRoot 'R2_MATERIAL_MANIFEST.json') | ConvertFrom-Json
$Certificate = Get-Content -Raw -LiteralPath (Join-Path $RigRoot 'R2_BRANDING_ASSET_CERTIFICATE.json') | ConvertFrom-Json

$Bytes = [System.IO.File]::ReadAllBytes($CandidateGlb)
if ([Text.Encoding]::ASCII.GetString($Bytes, 0, 4) -ne 'glTF') {
    throw 'Candidate GLB magic is invalid.'
}
$JsonLength = [BitConverter]::ToInt32($Bytes, 12)
$JsonText = [Text.Encoding]::UTF8.GetString($Bytes, 20, $JsonLength).TrimEnd([char]0x20, [char]0)
$Glb = $JsonText | ConvertFrom-Json
$NodeNames = @($Glb.nodes | ForEach-Object { $_.name } | Where-Object { $_ })
$BrandingNodes = @($NodeNames | Where-Object { $_ -like 'R2_Brand_*' } | Sort-Object)
$DuplicateNodes = @($NodeNames | Group-Object | Where-Object Count -gt 1 | ForEach-Object Name)
$MaterialNames = @($Glb.materials | ForEach-Object { $_.name })
$DuplicateMaterials = @($MaterialNames | Group-Object | Where-Object Count -gt 1 | ForEach-Object Name)
$Primitives = @($Glb.meshes | ForEach-Object { @($_.primitives) })
$MissingPrimitiveMaterials = @($Primitives | Where-Object { $null -eq $_.material })
$ExternalUris = @(
    @($Glb.buffers | Where-Object { $_.uri } | ForEach-Object { $_.uri })
    @($Glb.images | Where-Object { $_.uri -and -not $_.uri.StartsWith('data:') } | ForEach-Object { $_.uri })
)
$ImageCount = if ($null -eq $Glb.images) { 0 } else { @($Glb.images).Count }
$TextureCount = if ($null -eq $Glb.textures) { 0 } else { @($Glb.textures).Count }
$AnimationNames = @($Glb.animations | ForEach-Object name | Sort-Object)
$StagedFiles = @(& git -C $ProjectRoot diff --cached --name-only)
$RuntimeSource = Get-Content -Raw -LiteralPath (Join-Path $ProjectRoot 'components\dashboard\3d\r2\real\r2-full-character-runtime.ts')
$RuntimeOverridePatterns = @(
    'new MeshStandardMaterial',
    '.metalness =',
    '.roughness =',
    '.color.set',
    'material.color ='
)
$RuntimeOverrides = @($RuntimeOverridePatterns | Where-Object { $RuntimeSource.Contains($_) })
$TransactionImages = @(Get-ChildItem -LiteralPath $Transaction -File | Where-Object Extension -Match '^\.(png|jpg|jpeg|webp|bmp|tif|tiff|exr)$')

$Gates = [ordered]@{
    OfficialBlendUnchanged = (Get-FileHash -Algorithm SHA256 -LiteralPath $OfficialBlend).Hash -eq $ExpectedOfficialBlendHash
    OfficialGlbUnchanged = (Get-FileHash -Algorithm SHA256 -LiteralPath $OfficialGlb).Hash -eq $ExpectedOfficialGlbHash
    OfficialLogoExact = (Get-FileHash -Algorithm SHA256 -LiteralPath $Logo).Hash -eq $ExpectedLogoHash
    BlenderValidationApproved = $Validation.TechnicalVerdict -eq 'APROVADO' -and $Validation.FailedGates -eq 'NONE'
    MaterialAuthoringConfirmed = [int]$Validation.RenderableMeshesWithoutMaterial -eq 0 -and [int]$Manifest.renderable_meshes_without_material -eq 0
    GeometryPreserved = [int]$Validation.UnexpectedGeometryChanges -eq 0
    WeightsPreserved = [int]$Validation.UnexpectedWeightChanges -eq 0
    RigPreserved = [int]$Validation.UnexpectedRigChanges -eq 0 -and [int]$Runtime.BoneCount -eq 65
    MorphTargetsPreserved = [int]$Runtime.MorphTargetCount -eq 24 -and [bool]$RoundTrip.MorphTargetsRoundTripConfirmed
    AnimationClipsPreserved = @($AnimationNames).Count -eq 9 -and @(Compare-Object $ExpectedAnimations $AnimationNames).Count -eq 0
    RuntimeStatesPreserved = [int]$Runtime.RuntimeStateCount -eq 10
    NeutralResetExact = [bool]$Validation.NeutralResetExact -and [bool]$RoundTrip.NeutralResetExact -and [bool]$Runtime.NeutralResetExact
    ExactlyThreeBrandingNodes = @(Compare-Object $ExpectedBranding $BrandingNodes).Count -eq 0
    OfficialBrandingConfirmed = $Certificate.official_logo_sha256 -eq $ExpectedLogoHash -and [bool]$Certificate.variant_certification.published_matches_distribution_byte_for_byte
    RightChestEmbroideryConfirmed = [bool]$Validation.RightChestLogoConfirmed -and [bool]$RoundTrip.RightChestBrandingRoundTripConfirmed
    LeftArmEmbroideryConfirmed = [bool]$Validation.LeftArmPatchConfirmed -and [bool]$RoundTrip.LeftArmBrandingRoundTripConfirmed
    LeftArmR2MarkConfirmed = [bool]$Validation.LeftArmR2MarkConfirmed -and [bool]$Certificate.left_arm_patch.contains_r2_designation
    BackEmbroideryConfirmed = [bool]$Validation.LargeBackLogoConfirmed -and [bool]$RoundTrip.BackBrandingRoundTripConfirmed
    BrandingHierarchyConfirmed = [bool]$Validation.BrandingHierarchyConfirmed -and [bool]$RoundTrip.BrandingHierarchyRoundTrip -and [bool]$Runtime.BrandingHierarchy
    BrandingDeformationApproved = [int]$Validation.BrandingAnimationClipping -eq 0 -and [int]$Validation.BrandingZFighting -eq 0 -and [int]$Validation.BrandingFloating -eq 0
    GLBParseApproved = [BitConverter]::ToInt32($Bytes, 4) -eq 2 -and [int]$Export.GLBParseErrors.Count -eq 0
    GLBHashMatchesExport = (Get-FileHash -Algorithm SHA256 -LiteralPath $CandidateGlb).Hash -eq $Export.glb_sha256
    ExternalDependenciesZero = $ExternalUris.Count -eq 0
    ImagesZero = $ImageCount -eq 0 -and $TextureCount -eq 0 -and $TransactionImages.Count -eq 0
    MaterialsExact = @($Glb.materials).Count -eq 17 -and $DuplicateMaterials.Count -eq 0
    MissingMaterialsZero = $MissingPrimitiveMaterials.Count -eq 0
    DuplicateNodesZero = $DuplicateNodes.Count -eq 0
    GLBRoundTripApproved = [bool]$RoundTrip.GLBRoundTripApproved -and $RoundTrip.FailedGates -eq 'NONE'
    WebRuntimeApproved = [bool]$Runtime.Passed -and [int]$Runtime.RuntimeConsoleErrors -eq 0
    RuntimeMaterialOverridesZero = $RuntimeOverrides.Count -eq 0 -and [int]$Runtime.RuntimeMaterialOverrides -eq 0
    DisposeRemountApproved = [bool]$Runtime.ControllerDisposed -and [bool]$Runtime.RemountDistinct -and [bool]$Runtime.RemountDisposed
    ResponsiveFramingApproved = @($Runtime.ResponsiveFraming | Where-Object { -not $_.passed }).Count -eq 0
    PublishedArtifactsExact = $Publication.published_blend_sha256 -eq $Export.candidate_blend_sha256 -and $Publication.published_glb_sha256 -eq $Export.glb_sha256
    PublishedBlendReopened = (Get-Content -Raw -LiteralPath (Join-Path $RigRoot 'R2_MATERIAL_BRANDING_POST_PUBLICATION_BLEND_AUDIT.json') | ConvertFrom-Json).source_sha256 -eq $Publication.published_blend_sha256
    PublishedGlbReloaded = [bool]$PostRoundTrip.GLBRoundTripApproved -and $PostRoundTrip.glb_sha256 -eq $Publication.published_glb_sha256
    OfficialModelPathExact = $RuntimeSource.Contains('/models/r2/r2-full-character-material-branded-ready-v1.glb')
    RollbackModelPathExact = $RuntimeSource.Contains('/models/r2/r2-full-character-runtime-ready-v1.glb')
    GitStagedFilesZero = $StagedFiles.Count -eq 0
}

$FailedGates = @($Gates.GetEnumerator() | Where-Object { -not $_.Value } | ForEach-Object Key)
$Report = [ordered]@{
    schema_version = 1
    audit = 'R2_MATERIAL_BRANDING_INDEPENDENT_POWERSHELL'
    ExecutionStatus = $(if ($FailedGates.Count -eq 0) { 'COMPLETED' } else { 'FAILED' })
    TechnicalVerdict = $(if ($FailedGates.Count -eq 0) { 'APROVADO' } else { 'REPROVADO' })
    IndependentAuditApproved = $FailedGates.Count -eq 0
    MaterialAuthoringConfirmed = [bool]$Gates.MaterialAuthoringConfirmed
    OfficialBrandingConfirmed = [bool]$Gates.OfficialBrandingConfirmed
    RightChestEmbroideryConfirmed = [bool]$Gates.RightChestEmbroideryConfirmed
    LeftArmEmbroideryConfirmed = [bool]$Gates.LeftArmEmbroideryConfirmed
    LeftArmR2MarkConfirmed = [bool]$Gates.LeftArmR2MarkConfirmed
    BackEmbroideryConfirmed = [bool]$Gates.BackEmbroideryConfirmed
    RuntimeApproved = [bool]$Gates.WebRuntimeApproved
    candidate_blend = $CandidateBlend
    candidate_blend_sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $CandidateBlend).Hash
    candidate_glb = $CandidateGlb
    candidate_glb_sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $CandidateGlb).Hash
    branding_nodes = $BrandingNodes
    material_names = $MaterialNames
    animation_names = $AnimationNames
    external_dependencies = $ExternalUris.Count
    images = $ImageCount
    textures = $TextureCount
    staged_files = $StagedFiles
    runtime_override_patterns_found = $RuntimeOverrides
    gates = $Gates
    FailedGates = $(if ($FailedGates.Count -eq 0) { 'NONE' } else { $FailedGates })
}

$Json = $Report | ConvertTo-Json -Depth 30
$JsonTemp = $OutputJson + '.tmp'
[System.IO.File]::WriteAllText($JsonTemp, $Json + [Environment]::NewLine, [Text.UTF8Encoding]::new($false))
Move-Item -LiteralPath $JsonTemp -Destination $OutputJson -Force

$Markdown = @"
# R2 Material Branding Independent Audit

- ExecutionStatus: $($Report.ExecutionStatus)
- TechnicalVerdict: $($Report.TechnicalVerdict)
- IndependentAuditApproved: $($Report.IndependentAuditApproved)
- Candidate blend SHA-256: ``$($Report.candidate_blend_sha256)``
- Candidate GLB SHA-256: ``$($Report.candidate_glb_sha256)``
- Official GorillaOS logo SHA-256: ``$ExpectedLogoHash``
- Branding placements: right chest, left upper arm with R2, centered upper back (exactly three)
- Materials: $(@($Glb.materials).Count); missing primitive materials: $($MissingPrimitiveMaterials.Count)
- Rig/morphs/animations/states: 65 / 24 / 9 / 10
- Branding clipping/z-fighting/floating: $($Validation.BrandingAnimationClipping) / $($Validation.BrandingZFighting) / $($Validation.BrandingFloating)
- External dependencies/images/textures: $($ExternalUris.Count) / $ImageCount / $TextureCount
- Runtime material overrides: $($RuntimeOverrides.Count)
- FailedGates: $($Report.FailedGates -join ', ')

The audit reparsed the GLB directly in PowerShell and cross-checked the Blender, GLB export, clean round-trip and Three.js headless-runtime reports. It did not reuse the construction implementation.
"@
$MarkdownTemp = $OutputMarkdown + '.tmp'
[System.IO.File]::WriteAllText($MarkdownTemp, $Markdown, [Text.UTF8Encoding]::new($false))
Move-Item -LiteralPath $MarkdownTemp -Destination $OutputMarkdown -Force

$Json
if ($FailedGates.Count -ne 0) {
    exit 2
}
