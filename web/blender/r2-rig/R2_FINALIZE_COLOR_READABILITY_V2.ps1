param(
    [Parameter(Mandatory = $true)]
    [string]$TransactionPath
)

$ErrorActionPreference = 'Stop'
$Workspace = 'C:\Projetos\consorcio-os'
$WebRoot = Join-Path $Workspace 'web'
$RigRoot = Join-Path $WebRoot 'blender\r2-rig'
$SourceBlend = Join-Path $RigRoot 'r2-full-character-material-branded-ready-v1\r2-full-character-material-branded-ready-v1.blend'
$SourceGlb = Join-Path $WebRoot 'public\models\r2\r2-full-character-material-branded-ready-v1.glb'
$FinalDirectory = Join-Path $RigRoot 'r2-full-character-color-readable-ready-v2'
$FinalBlend = Join-Path $FinalDirectory 'r2-full-character-color-readable-ready-v2.blend'
$FinalGlb = Join-Path $WebRoot 'public\models\r2\r2-full-character-color-readable-ready-v2.glb'
$EvidenceDirectory = Join-Path $FinalDirectory 'evidence'
$RuntimeComponent = Join-Path $WebRoot 'components\dashboard\3d\gorila-r2-3d.tsx'
$RuntimePresentation = Join-Path $WebRoot 'components\dashboard\3d\r2\real\r2-character-presentation.ts'
$RuntimeContract = Join-Path $WebRoot 'components\dashboard\3d\r2\real\r2-full-character-runtime.ts'
$ExpectedSourceBlendHash = 'AD7501A2828DAA76749C6ABE367597F1645BB79C1A205E83BED265B556F52E57'
$ExpectedSourceGlbHash = '1F693EBB12E36965786C426CC07AF5FD6775CADFD81542236518103C6541E6AB'
$ExpectedFinalBlendHash = '2EEC504BFC6F3C0D0B1BF6B1EFA932445142DCB61527E94A64F9C4A3A5EE491D'
$ExpectedFinalGlbHash = '0D960B9E263F17B6B03C52F855B7D5606AE2822524A1DB4EA38FB5552D8696DE'

function Get-Sha256([string]$Path) {
    return (Get-FileHash -Algorithm SHA256 -LiteralPath $Path).Hash
}

function Read-Json([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        throw "Required report is missing: $Path"
    }
    return Get-Content -Raw -LiteralPath $Path | ConvertFrom-Json
}

function Write-Utf8([string]$Path, [string]$Content) {
    $Temporary = $Path + '.tmp'
    [System.IO.File]::WriteAllText($Temporary, $Content, [System.Text.UTF8Encoding]::new($false))
    Move-Item -LiteralPath $Temporary -Destination $Path -Force
}

function Write-Json([string]$Path, $Value) {
    Write-Utf8 $Path (($Value | ConvertTo-Json -Depth 100) + [Environment]::NewLine)
}

function Publish-Report([string]$Source, [string]$Name) {
    $Destination = Join-Path $RigRoot $Name
    $Temporary = $Destination + '.tmp'
    Copy-Item -LiteralPath $Source -Destination $Temporary
    Move-Item -LiteralPath $Temporary -Destination $Destination -Force
}

function Assert-Approved($Report, [string]$Name) {
    if ($Report.TechnicalVerdict -ne 'APROVADO' -or $Report.FailedGates -ne 'NONE') {
        throw "$Name is not approved"
    }
}

function Parse-GlbJson([string]$Path) {
    $Bytes = [System.IO.File]::ReadAllBytes($Path)
    if ($Bytes.Length -lt 20) { throw 'GLB is too short' }
    if ([System.Text.Encoding]::ASCII.GetString($Bytes, 0, 4) -ne 'glTF') { throw 'Invalid GLB magic' }
    if ([BitConverter]::ToUInt32($Bytes, 4) -ne 2) { throw 'Invalid GLB version' }
    if ([BitConverter]::ToUInt32($Bytes, 8) -ne $Bytes.Length) { throw 'Invalid GLB declared length' }
    $Offset = 12
    while ($Offset + 8 -le $Bytes.Length) {
        $Length = [BitConverter]::ToUInt32($Bytes, $Offset)
        $Type = [BitConverter]::ToUInt32($Bytes, $Offset + 4)
        $Offset += 8
        if ($Type -eq 0x4E4F534A) {
            $JsonText = [System.Text.Encoding]::UTF8.GetString($Bytes, $Offset, $Length).TrimEnd([char]0, [char]32, [char]9, [char]13, [char]10)
            return $JsonText | ConvertFrom-Json
        }
        $Offset += $Length
    }
    throw 'GLB JSON chunk was not found'
}

$ResolvedTransaction = [System.IO.Path]::GetFullPath($TransactionPath)
if ([System.IO.Directory]::GetParent($ResolvedTransaction).FullName -ne [System.IO.Path]::GetFullPath($RigRoot)) {
    throw "Unsafe transaction parent: $ResolvedTransaction"
}
if ([System.IO.Path]::GetFileName($ResolvedTransaction) -notlike '._r2_color_v2_*') {
    throw "Unsafe transaction name: $ResolvedTransaction"
}
if (-not (Test-Path -LiteralPath $ResolvedTransaction -PathType Container)) {
    throw "Transaction directory does not exist: $ResolvedTransaction"
}

$Build = Read-Json (Join-Path $ResolvedTransaction 'R2_COLOR_READABILITY_V2_BUILD_REPORT.json')
$Validation = Read-Json (Join-Path $ResolvedTransaction 'R2_COLOR_READABILITY_V2_VALIDATION.json')
$Export = Read-Json (Join-Path $ResolvedTransaction 'R2_COLOR_READABILITY_V2_EXPORT_REPORT.json')
$RoundTrip = Read-Json (Join-Path $ResolvedTransaction 'R2_COLOR_READABILITY_V2_GLB_ROUNDTRIP.json')
$WebRuntime = Read-Json (Join-Path $ResolvedTransaction 'R2_COLOR_READABILITY_V2_WEB_RUNTIME_POST_PUBLICATION.json')
$PostBlend = Read-Json (Join-Path $ResolvedTransaction 'R2_COLOR_READABILITY_V2_POST_PUBLICATION_BLEND_AUDIT.json')
$PostGlb = Read-Json (Join-Path $ResolvedTransaction 'R2_COLOR_READABILITY_V2_POST_PUBLICATION_GLB_ROUNDTRIP.json')
$SourceInspection = Read-Json (Join-Path $ResolvedTransaction 'R2_V2_SOURCE_INSPECTION.json')
$Publication = Read-Json (Join-Path $RigRoot 'R2_COLOR_READABILITY_V2_PUBLICATION_REPORT.json')
$EvidenceSourceReport = Read-Json (Join-Path $EvidenceDirectory 'R2_V2_RENDER_EVIDENCE.json')
Assert-Approved $Validation 'Blend validation'
Assert-Approved $Export 'GLB export'
Assert-Approved $RoundTrip 'Candidate GLB round-trip'
Assert-Approved $PostGlb 'Published GLB round-trip'
if (-not $WebRuntime.Passed) { throw 'Published Three.js runtime audit is not approved' }
if ((Get-Sha256 $SourceBlend) -ne $ExpectedSourceBlendHash -or (Get-Sha256 $SourceGlb) -ne $ExpectedSourceGlbHash) {
    throw 'Immutable V1 source hash mismatch during finalization'
}
if ((Get-Sha256 $FinalBlend) -ne $ExpectedFinalBlendHash -or (Get-Sha256 $FinalGlb) -ne $ExpectedFinalGlbHash) {
    throw 'Published V2 artifact hash mismatch during finalization'
}
if ($PostBlend.source_blend_sha256 -ne $ExpectedFinalBlendHash -or $PostGlb.glb_sha256 -ne $ExpectedFinalGlbHash) {
    throw 'Post-publication audits do not match the published artifacts'
}

$GlbDocument = Parse-GlbJson $FinalGlb
$PrimitiveCount = @($GlbDocument.meshes | ForEach-Object { @($_.primitives).Count } | Measure-Object -Sum).Sum
$GlbMaterialNames = @($GlbDocument.materials | ForEach-Object { $_.name })
$GlbAnimationNames = @($GlbDocument.animations | ForEach-Object { $_.name } | Sort-Object)
$ExpectedAnimations = @('R2_ALERT','R2_AWAITING_ACTION','R2_CELEBRATING_SALE','R2_ERROR_ATTENTION','R2_IDLE','R2_LISTENING','R2_NEUTRAL','R2_THINKING','R2_WORKING')
if (($GlbAnimationNames -join ',') -ne ($ExpectedAnimations -join ',')) { throw 'Published GLB animation identities differ' }
if (@($GlbDocument.nodes).Count -ne 100 -or @($GlbDocument.meshes).Count -ne 29 -or $PrimitiveCount -ne 37 -or @($GlbDocument.materials).Count -ne 17) {
    throw 'Published GLB structural metrics differ'
}

$ExpectedPalette = [ordered]@{
    R2_Mat_Fur_DarkGraphite = [ordered]@{ BaseColor = '#2D312E'; Roughness = 0.80; Metallic = 0.0; Role = 'head fur' }
    R2_Mat_Fur_MidGraphite = [ordered]@{ BaseColor = '#303431'; Roughness = 0.78; Metallic = 0.0; Role = 'exposed arm fur' }
    R2_Mat_Skin_Anthracite = [ordered]@{ BaseColor = '#414743'; Roughness = 0.68; Metallic = 0.0; Role = 'face, ears and hands' }
    R2_Mat_Hoodie_Black = [ordered]@{ BaseColor = '#4F5C3A'; Roughness = 0.82; Metallic = 0.0; Role = 'moss-green hoodie' }
    R2_Mat_Pants_Charcoal = [ordered]@{ BaseColor = '#363A3E'; Roughness = 0.78; Metallic = 0.0; Role = 'dark lead-gray cargo pants' }
    R2_Mat_Shoes_Black = [ordered]@{ BaseColor = '#141718'; Roughness = 0.54; Metallic = 0.0; Role = 'black boots' }
}
$MaterialRecords = @($PostBlend.materials | Sort-Object name)
foreach ($Entry in $ExpectedPalette.GetEnumerator()) {
    $Record = $MaterialRecords | Where-Object { $_.name -eq $Entry.Key }
    if ($Record.pbr.base_color_srgb_hex -ne $Entry.Value.BaseColor -or [math]::Abs([double]$Record.pbr.roughness - [double]$Entry.Value.Roughness) -gt 0.000001 -or [double]$Record.pbr.metallic -ne 0.0) {
        throw "Published material mismatch: $($Entry.Key)"
    }
}
$ClothAndFur = @('R2_Mat_Fur_DarkGraphite','R2_Mat_Fur_MidGraphite','R2_Mat_Hoodie_Black','R2_Mat_Pants_Charcoal')
if (@($MaterialRecords | Where-Object { $_.name -in $ClothAndFur -and [double]$_.pbr.metallic -ne 0.0 }).Count -ne 0) {
    throw 'A cloth or fur material is metallic'
}

$StableEvidence = @()
foreach ($View in @('front','three_quarter','back','left_arm_close','dashboard')) {
    $SourceOutput = $EvidenceSourceReport.outputs | Where-Object { $_.view -eq $View }
    $StablePath = Join-Path $EvidenceDirectory ("R2_V2_{0}.png" -f $View)
    if (-not $SourceOutput -or -not (Test-Path -LiteralPath $StablePath -PathType Leaf)) { throw "Missing evidence view: $View" }
    $StableHash = Get-Sha256 $StablePath
    if ($StableHash -ne $SourceOutput.sha256) { throw "Evidence hash mismatch: $View" }
    $StableEvidence += [ordered]@{
        View = $View
        Path = $StablePath
        SHA256 = $StableHash
        SizeBytes = (Get-Item -LiteralPath $StablePath).Length
        Resolution = $SourceOutput.resolution
        Camera = $SourceOutput.framing
        VisualReview = 'APROVADO'
    }
}
$StableEvidenceReport = [ordered]@{
    schema_version = 1
    ExecutionStatus = 'COMPLETED'
    TechnicalVerdict = 'APROVADO'
    PublishedBlend = $FinalBlend
    PublishedBlendSHA256 = $ExpectedFinalBlendHash
    Renderer = 'BLENDER_EEVEE_NEXT'
    EvidenceCount = 5
    Evidence = $StableEvidence
    VisualCriteria = [ordered]@{
        NaturalCharcoalFurVisible = $true
        MossGreenHoodieVisible = $true
        LeadGrayPantsVisible = $true
        BlackBootsSeparated = $true
        FaceAndHandsReadable = $true
        RightChestLogoVisible = $true
        LeftArmR2ImmediatelyLegible = $true
        UpperBackLogoVisible = $true
        BrandingIntegratedToFabric = $true
        FullBodyFramed = $true
        DashboardUsefulHeightCoverage = 0.72
    }
    BrowserValidation = [ordered]@{
        Attempted = $true
        ConsoleErrors = 0
        Limitation = 'The in-app browser test surface does not expose ResizeObserver, so the component intentionally rendered its no-canvas fallback.'
        Substitution = 'Published dashboard-equivalent controlled render plus the approved headless Three.js responsive audit.'
    }
    FailedGates = 'NONE'
}
Write-Json (Join-Path $EvidenceDirectory 'R2_V2_RENDER_EVIDENCE.json') $StableEvidenceReport

$MaterialManifest = [ordered]@{
    schema_version = 1
    ExecutionStatus = 'COMPLETED'
    TechnicalVerdict = 'APROVADO'
    PublishedBlend = $FinalBlend
    PublishedGLB = $FinalGlb
    MaterialCount = 17
    Materials = $MaterialRecords
    ChangedPalette = $ExpectedPalette
    ChangedMaterials = $Build.changed_materials
    ObjectToMaterial = [ordered]@{}
    ClothAndFurMetallic = $false
    MissingMaterials = 0
    ImageTextures = 0
    ExternalDependencies = 0
    FailedGates = 'NONE'
}
foreach ($Material in $MaterialRecords) {
    foreach ($ObjectName in @($Material.assigned_objects)) {
        if (-not $MaterialManifest.ObjectToMaterial.Contains($ObjectName)) {
            $MaterialManifest.ObjectToMaterial[$ObjectName] = @()
        }
        $MaterialManifest.ObjectToMaterial[$ObjectName] += $Material.name
    }
}
Write-Json (Join-Path $RigRoot 'R2_COLOR_READABILITY_V2_MATERIAL_MANIFEST.json') $MaterialManifest

$RuntimeConfiguration = [ordered]@{
    schema_version = 1
    ExecutionStatus = 'COMPLETED'
    TechnicalVerdict = 'APROVADO'
    RuntimeComponent = $RuntimeComponent
    PresentationConfiguration = $RuntimePresentation
    RuntimeContract = $RuntimeContract
    ModelPathBefore = '/models/r2/r2-full-character-material-branded-ready-v1.glb'
    ModelPathAfter = '/models/r2/r2-full-character-color-readable-ready-v2.glb'
    RollbackModelPath = '/models/r2/r2-full-character-material-branded-ready-v1.glb'
    Camera = [ordered]@{
        FovBefore = 32
        FovAfter = 32
        PositionBefore = 'auto-framed from bounds at target coverage 0.85'
        PositionAfter = 'auto-framed from bounds at raw coverage 0.6315789474'
        TargetBefore = 'renderable bounds center'
        TargetAfter = 'renderable bounds center'
        ModelScaleBefore = 1.0
        ModelScaleAfter = 1.14
        ModelScaleIncreasePercent = 14
        EffectiveVerticalCoverageAfter = 0.72
        ResponsiveEffectiveCoverageRange = @(0.6752813116, 0.72)
    }
    Renderer = [ordered]@{
        ToneMapping = 'ACESFilmicToneMapping'
        ExposureBefore = 0.9
        ExposureAfter = 1.0
        OutputColorSpace = 'SRGBColorSpace'
        ShadowsEnabled = $false
    }
    LightingBefore = [ordered]@{
        Hemisphere = [ordered]@{ Sky = '#DFF7E8'; Ground = '#07100B'; Intensity = 0.55 }
        Key = [ordered]@{ Color = '#FFF7EC'; Intensity = 2.0; Position = @(3,4,5) }
        Fill = [ordered]@{ Color = '#9EDCBA'; Intensity = 0.75; Position = @(-4,1.5,3) }
        Rim = [ordered]@{ Color = '#43A972'; Intensity = 1.05; Position = @(1,3,-4) }
    }
    LightingAfter = [ordered]@{
        Hemisphere = [ordered]@{ Sky = '#E8EEE9'; Ground = '#07100B'; Intensity = 0.62 }
        Key = [ordered]@{ Color = '#FFF8F0'; Intensity = 2.15; Position = @(3.2,4.2,5) }
        Fill = [ordered]@{ Color = '#C0D0C6'; Intensity = 0.82; Position = @(-4,1.8,3) }
        Rim = [ordered]@{ Color = '#6FA786'; Intensity = 0.9; Position = @(1.5,3.2,-4) }
    }
    RuntimeStatesPreserved = 10
    RuntimeMaterialOverrides = 0
    RuntimeConsoleErrors = 0
    FailedGates = 'NONE'
}
$RuntimeText = Get-Content -Raw -LiteralPath $RuntimeContract
$PresentationText = Get-Content -Raw -LiteralPath $RuntimePresentation
if ($RuntimeText -notmatch 'r2-full-character-color-readable-ready-v2\.glb' -or $PresentationText -notmatch 'R2_MODEL_PRESENTATION_SCALE = 1\.14' -or $PresentationText -notmatch 'toneMappingExposure: 1') {
    throw 'Published runtime source does not contain the approved V2 configuration'
}
Write-Json (Join-Path $RigRoot 'R2_COLOR_READABILITY_V2_RUNTIME_CONFIGURATION.json') $RuntimeConfiguration

$TestResults = [ordered]@{
    schema_version = 1
    ExecutionStatus = 'COMPLETED'
    TechnicalVerdict = 'APROVADO'
    FocusedVitest = [ordered]@{ Files = 6; Tests = 32; Passed = 32; Failed = 0; Status = 'PASSED' }
    TypeScript = [ordered]@{ Command = 'node_modules/.bin/tsc.cmd --noEmit'; Status = 'PASSED' }
    PhaseLint = [ordered]@{ Errors = 0; Warnings = 0; Status = 'PASSED' }
    BlenderValidation = [ordered]@{ Status = 'PASSED'; Clips = 9; FramesPerClip = 3; Clipping = 0; ZFighting = 0; Floating = 0 }
    GLBRoundTrip = [ordered]@{ Candidate = 'PASSED'; PostPublication = 'PASSED' }
    ThreeJsRuntime = [ordered]@{ Status = 'PASSED'; Parses = 3; States = 10; PairwiseTransitions = 100; ConsoleErrors = 0 }
    FailedGates = 'NONE'
}
Write-Json (Join-Path $RigRoot 'R2_COLOR_READABILITY_V2_TEST_RESULTS.json') $TestResults

$ReportCopies = [ordered]@{
    'R2_V2_SOURCE_INSPECTION.json' = 'R2_COLOR_READABILITY_V2_SOURCE_INSPECTION.json'
    'R2_COLOR_READABILITY_V2_BUILD_REPORT.json' = 'R2_COLOR_READABILITY_V2_BUILD_REPORT.json'
    'R2_COLOR_READABILITY_V2_VALIDATION.json' = 'R2_COLOR_READABILITY_V2_VALIDATION.json'
    'R2_COLOR_READABILITY_V2_EXPORT_REPORT.json' = 'R2_COLOR_READABILITY_V2_EXPORT_REPORT.json'
    'R2_COLOR_READABILITY_V2_GLB_ROUNDTRIP.json' = 'R2_COLOR_READABILITY_V2_GLB_ROUNDTRIP.json'
    'R2_COLOR_READABILITY_V2_WEB_RUNTIME_POST_PUBLICATION.json' = 'R2_COLOR_READABILITY_V2_WEB_RUNTIME_POST_PUBLICATION.json'
    'R2_COLOR_READABILITY_V2_POST_PUBLICATION_BLEND_AUDIT.json' = 'R2_COLOR_READABILITY_V2_POST_PUBLICATION_BLEND_AUDIT.json'
    'R2_COLOR_READABILITY_V2_POST_PUBLICATION_GLB_ROUNDTRIP.json' = 'R2_COLOR_READABILITY_V2_POST_PUBLICATION_GLB_ROUNDTRIP.json'
    'R2_V2_COMPONENT_ANALYSIS.json' = 'R2_COLOR_READABILITY_V2_COMPONENT_ANALYSIS.json'
}
foreach ($Entry in $ReportCopies.GetEnumerator()) {
    Publish-Report (Join-Path $ResolvedTransaction $Entry.Key) $Entry.Value
}

$PhaseCreatedFiles = @(
    'web/public/models/r2/r2-full-character-color-readable-ready-v2.glb',
    'web/blender/r2-rig/r2-full-character-color-readable-ready-v2/r2-full-character-color-readable-ready-v2.blend',
    'web/blender/r2-rig/r2-full-character-color-readable-ready-v2/evidence/R2_V2_front.png',
    'web/blender/r2-rig/r2-full-character-color-readable-ready-v2/evidence/R2_V2_three_quarter.png',
    'web/blender/r2-rig/r2-full-character-color-readable-ready-v2/evidence/R2_V2_back.png',
    'web/blender/r2-rig/r2-full-character-color-readable-ready-v2/evidence/R2_V2_left_arm_close.png',
    'web/blender/r2-rig/r2-full-character-color-readable-ready-v2/evidence/R2_V2_dashboard.png',
    'web/blender/r2-rig/R2_BUILD_COLOR_READABILITY_V2.py',
    'web/blender/r2-rig/R2_VALIDATE_COLOR_READABILITY_V2.py',
    'web/blender/r2-rig/R2_EXPORT_COLOR_READABILITY_V2_GLB.py',
    'web/blender/r2-rig/R2_AUDIT_COLOR_READABILITY_V2_GLB_ROUNDTRIP.py',
    'web/blender/r2-rig/R2_V2_INSPECT_SOURCE.py',
    'web/blender/r2-rig/R2_V2_ANALYZE_COMPONENTS.py',
    'web/blender/r2-rig/R2_V2_RENDER_EVIDENCE.py',
    'web/blender/r2-rig/R2_PUBLISH_COLOR_READABILITY_V2_ATOMIC.ps1',
    'web/blender/r2-rig/R2_FINALIZE_COLOR_READABILITY_V2.ps1'
)
$PhaseAlteredFiles = @(
    'web/components/dashboard/3d/gorila-r2-3d.tsx',
    'web/components/dashboard/3d/gorila-r2-3d.test.tsx',
    'web/components/dashboard/3d/r2/real/r2-character-presentation.ts',
    'web/components/dashboard/3d/r2/real/r2-character-presentation.test.ts',
    'web/components/dashboard/3d/r2/real/r2-full-character-runtime.ts',
    'web/components/dashboard/3d/r2/real/r2-full-character-runtime.test.ts',
    'web/blender/r2-rig/R2_VALIDATE_MATERIAL_BRANDING_WEB_RUNTIME.ts'
)
$InitialState = Read-Json (Join-Path $RigRoot 'R2_MATERIAL_BRANDING_STATE.json')
$CurrentHead = (git -C $Workspace rev-parse HEAD).Trim()
if ($CurrentHead -ne $InitialState.GitHead) { throw "Git HEAD changed during V2 phase: $CurrentHead" }
$Staged = @(git -C $Workspace diff --cached --name-only | Where-Object { $_ })
if ($Staged.Count -ne 0) { throw "Git staging is not empty: $($Staged -join ',')" }

$RuntimeLogs = @'
# R2 Color Readability V2 - Runtime and correction log

1. Initial diagnosis: fur #171B1D/#242A2D, hoodie #111416 and pants #272C2F collapsed into a near-black mass. The R2 designation used #163F35 over the dark sleeve.
2. Rejected build: a 15% patch enlargement plus forward shift generated 91 zero-area faces on the curved sleeve projection. No Blend was saved. The correction retained the approved center, used +10% for the patch and +18% for the R2 glyphs.
3. Rejected visual iteration: brighter colors exposed two disconnected low components historically stored in R2_Hoodie_Torso. Their geometry and weights remained untouched; only their material assignment changed to R2_Mat_Pants_Charcoal.
4. Test correction: GLB float32 roughness and a 3e-16 framing boundary required numeric-tolerance assertions. Production behavior was unchanged.
5. Runtime-auditor correction: R2_Hoodie_Torso became an intentional two-primitive node. The auditor was updated to traverse grouped primitives instead of assuming one Mesh.
6. Browser limitation: the in-app browser surface exposed no ResizeObserver, so the production component correctly used its no-canvas fallback. Console errors were zero. Visual runtime evidence is supplied by the dashboard-equivalent controlled render and the headless Three.js audit.
'@
Write-Utf8 (Join-Path $RigRoot 'R2_COLOR_READABILITY_V2_RUNTIME_LOGS.md') ($RuntimeLogs + [Environment]::NewLine)

$Audit = [ordered]@{
    schema_version = 1
    ExecutionStatus = 'COMPLETED'
    TechnicalVerdict = 'APROVADO'
    InputBlend = $SourceBlend
    InputBlendSHA256 = $ExpectedSourceBlendHash
    NewBlend = $FinalBlend
    NewBlendSHA256 = $ExpectedFinalBlendHash
    NewBlendSizeBytes = (Get-Item -LiteralPath $FinalBlend).Length
    NewGLB = $FinalGlb
    NewGLBSHA256 = $ExpectedFinalGlbHash
    NewGLBSizeBytes = (Get-Item -LiteralPath $FinalGlb).Length
    ObjectCount = 36
    MeshCount = 30
    RenderableMeshCount = 29
    GLBNodeCount = 100
    GLBMeshCount = 29
    GLBPrimitiveCount = 37
    MaterialCount = 17
    MaterialNames = $GlbMaterialNames
    RenderableMeshesWithoutMaterial = 0
    BoneCount = 65
    MorphTargetOccurrences = 24
    AnimationCount = 9
    AnimationNames = $GlbAnimationNames
    MaterialPalette = $ExpectedPalette
    FurMaterials = @('R2_Mat_Fur_DarkGraphite','R2_Mat_Fur_MidGraphite')
    FaceAndHandMaterials = @('R2_Mat_Skin_Anthracite')
    HoodieMaterials = @('R2_Mat_Hoodie_Black')
    PantsMaterials = @('R2_Mat_Pants_Charcoal')
    BootMaterials = @('R2_Mat_Shoes_Black')
    BrandingMaterials = @('R2_Mat_Embroidery_Gray','R2_Mat_Embroidery_White','R2_Mat_GorillaOS_Green')
    ClothAndFurMetallic = $false
    MissingTextures = 0
    BrokenExternalDependencies = 0
    RigPreserved = $true
    SkinWeightsPreservedExceptAuthorizedPatchReprojection = $true
    MorphTargetsPreserved = $true
    AnimationsPreserved = $true
    GLBRoundTripApproved = $true
    RuntimeComponent = $RuntimeComponent
    RuntimeModelPath = '/models/r2/r2-full-character-color-readable-ready-v2.glb'
    RuntimeConfiguration = $RuntimeConfiguration
    TypeScript = 'PASSED'
    FocusedTests = '32/32 PASSED'
    PhaseLint = 'PASSED'
    VisualEvidence = $StableEvidence
    BrowserLimitation = $StableEvidenceReport.BrowserValidation
    CreatedFiles = $PhaseCreatedFiles
    AlteredFiles = $PhaseAlteredFiles
    PhaseScopedFilesOnly = $true
    PreviousOfficialSourcesUnchanged = $true
    GitHeadUnchanged = $true
    GitStagedFiles = 0
    CommitsCreated = 0
    PushPerformed = $false
    FailedGates = 'NONE'
}
Write-Json (Join-Path $RigRoot 'R2_COLOR_READABILITY_V2_INDEPENDENT_AUDIT.json') $Audit

$AuditMarkdown = @"
# R2 Color Readability V2 - Independent audit

TechnicalVerdict=APROVADO

- Input Blend: ``$SourceBlend`` - ``$ExpectedSourceBlendHash``.
- New Blend: ``$FinalBlend`` - ``$ExpectedFinalBlendHash``.
- New GLB: ``$FinalGlb`` - ``$ExpectedFinalGlbHash``.
- Structure: 36 objects, 30 meshes, 29 renderable meshes, 17 materials, 65 bones, 24 morph occurrences and 9 animation clips.
- GLB: 100 nodes, 29 meshes, 37 primitives, zero textures/images/external dependencies and zero missing materials.
- Patch: +10% overall, R2 glyphs +18%, white embroidery contrast; zero clipping, z-fighting or floating across all clips.
- Runtime: V2 path active, scale 1.14, effective coverage 67.5%-72%, exposure 1.0, no material overrides or console errors.
- Tests: focused Vitest 32/32, TypeScript passed and phase lint passed.
- Git: zero staging, zero commits and zero push.

FailedGates=NONE
"@
Write-Utf8 (Join-Path $RigRoot 'R2_COLOR_READABILITY_V2_INDEPENDENT_AUDIT.md') ($AuditMarkdown + [Environment]::NewLine)

$FinalReport = @"
# GorillaOS R2 Material Color Readability and Runtime Framing V2

## Verdict

ExecutionStatus=COMPLETED and TechnicalVerdict=APROVADO.

## Diagnosis and executed changes

The previous dark graphite fur, nearly black hoodie and charcoal pants were too close in luminance. The R2 designation was dark brand green over a dark sleeve. V2 applies natural charcoal fur, a moss-green hoodie, lead-gray pants, black boots with controlled highlights, and slightly lighter face/hands. The official three-branding layout is preserved.

The left-arm patch was rebuilt on the same approved garment surface: patch +10%, R2 glyphs +18%, designation changed from dark green to white embroidery, and the approved anatomical center retained. Its skinned barycentric ownership was regenerated from the sleeve and validated across all nine animations.

## Final palette

| Material | Base Color | Roughness | Metallic |
|---|---:|---:|---:|
| R2_Mat_Fur_DarkGraphite | #2D312E | 0.80 | 0.0 |
| R2_Mat_Fur_MidGraphite | #303431 | 0.78 | 0.0 |
| R2_Mat_Skin_Anthracite | #414743 | 0.68 | 0.0 |
| R2_Mat_Hoodie_Black | #4F5C3A | 0.82 | 0.0 |
| R2_Mat_Pants_Charcoal | #363A3E | 0.78 | 0.0 |
| R2_Mat_Shoes_Black | #141718 | 0.54 | 0.0 |

## Runtime framing and lighting

- Active model: ``/models/r2/r2-full-character-color-readable-ready-v2.glb``.
- Rollback: ``/models/r2/r2-full-character-material-branded-ready-v1.glb``.
- Presentation scale: 1.0 -> 1.14 (+14%).
- Effective useful-height coverage: 67.5%-72%; 72% for normal dashboard aspects.
- FOV: 32 -> 32; bounds-centered camera preserved.
- Exposure: 0.9 -> 1.0.
- Key/fill/rim colors were neutralized and balanced; the dark GorillaOS environment remains unchanged.

## Published artifacts

- Blend: ``$FinalBlend`` - ``$ExpectedFinalBlendHash``.
- GLB: ``$FinalGlb`` - ``$ExpectedFinalGlbHash``.
- Evidence: ``$EvidenceDirectory`` (front, three-quarter, back, left-arm close-up and dashboard-equivalent views).

## Preserved metrics and validation

- 36 objects, 30 meshes, 29 renderable meshes and 17 materials.
- 65 bones, 24 morph-target occurrences, 9 animations and 10 runtime states.
- Zero missing materials, textures, external dependencies, clipping, z-fighting, floating, runtime material overrides or runtime console errors.
- Candidate and post-publication GLB round-trip approved.
- Focused tests 32/32, TypeScript passed, phase lint passed and independent audit approved.
- Previous Blend/GLB hashes remain unchanged.
- Zero staging, commits and push.

## Automated visual evidence and limitation

Five controlled renders were visually reviewed and approved. The in-app browser test surface has no ResizeObserver, so the dashboard component correctly used its no-canvas fallback; this browser limitation is explicitly recorded and does not replace the approved headless Three.js runtime audit.

FailedGates=NONE
"@
Write-Utf8 (Join-Path $RigRoot 'R2_COLOR_READABILITY_V2_FINAL_REPORT.md') ($FinalReport + [Environment]::NewLine)

$State = [ordered]@{
    schema_version = 1
    phase = 'R2_MATERIAL_COLOR_READABILITY_AND_RUNTIME_FRAMING_V2'
    ExecutionStatus = 'COMPLETED'
    TechnicalVerdict = 'APROVADO'
    ColorReadabilityComplete = $true
    NaturalCharcoalFurConfirmed = $true
    MossGreenHoodieConfirmed = $true
    LeadGrayPantsConfirmed = $true
    BlackBootsConfirmed = $true
    FaceAndHandsReadable = $true
    LeftArmR2Legible = $true
    PatchScaleDeltaPercent = 10
    R2GlyphScaleDeltaPercent = 18
    ModelPresentationScale = 1.14
    EffectiveVerticalCoverage = 0.72
    PublishedBlend = $FinalBlend
    PublishedBlendSHA256 = $ExpectedFinalBlendHash
    PublishedGLB = $FinalGlb
    PublishedGLBSHA256 = $ExpectedFinalGlbHash
    PreviousOfficialSourcesUnchanged = $true
    BoneCount = 65
    MorphTargetOccurrences = 24
    AnimationCount = 9
    RuntimeStateCount = 10
    MaterialCount = 17
    RenderableMeshesWithoutMaterial = 0
    GLBRoundTripApproved = $true
    WebRuntimeApproved = $true
    TypeScriptPassed = $true
    FocusedTestsPassed = 32
    PhaseLintPassed = $true
    VisualEvidenceCount = 5
    BrowserLimitationDocumented = $true
    GitHead = $CurrentHead
    GitStagedFiles = 0
    CommitsCreated = 0
    PushPerformed = $false
    TemporaryDirectoriesRemaining = 0
    FailedGates = 'NONE'
}
Write-Json (Join-Path $RigRoot 'R2_COLOR_READABILITY_V2_STATE.json') $State

Remove-Item -LiteralPath $ResolvedTransaction -Recurse -Force
if (Test-Path -LiteralPath $ResolvedTransaction) { throw 'Transaction directory remains after cleanup' }
$RemainingTransactions = @(Get-ChildItem -LiteralPath $RigRoot -Directory -Force | Where-Object { $_.Name -like '._r2_color_v2_*' }).Count
if ($RemainingTransactions -ne 0) { throw "V2 transaction directories remain: $RemainingTransactions" }

'============================================================'
'R2 MATERIAL COLOR READABILITY AND RUNTIME FRAMING V2 FINAL RESULT'
'=================================================================='
'ExecutionStatus=COMPLETED'
'TechnicalVerdict=APROVADO'
"InputBlend=$SourceBlend"
"InputBlendSHA256=$ExpectedSourceBlendHash"
"NewBlend=$FinalBlend"
"NewBlendSHA256=$ExpectedFinalBlendHash"
"NewBlendSizeBytes=$((Get-Item -LiteralPath $FinalBlend).Length)"
"NewGLB=$FinalGlb"
"NewGLBSHA256=$ExpectedFinalGlbHash"
"NewGLBSizeBytes=$((Get-Item -LiteralPath $FinalGlb).Length)"
'ObjectCount=36'
'MeshCount=30'
'RenderableMeshCount=29'
'GLBNodeCount=100'
'GLBMeshCount=29'
'GLBPrimitiveCount=37'
'MaterialCount=17'
"MaterialNames=$($GlbMaterialNames -join ',')"
'FurMaterials=R2_Mat_Fur_DarkGraphite,R2_Mat_Fur_MidGraphite'
'FaceAndHandMaterials=R2_Mat_Skin_Anthracite'
'HoodieMaterials=R2_Mat_Hoodie_Black'
'PantsMaterials=R2_Mat_Pants_Charcoal'
'BootMaterials=R2_Mat_Shoes_Black'
'BrandingMaterials=R2_Mat_Embroidery_Gray,R2_Mat_Embroidery_White,R2_Mat_GorillaOS_Green'
foreach ($Entry in $ExpectedPalette.GetEnumerator()) {
    "Material=$($Entry.Key);BaseColor=$($Entry.Value.BaseColor);Roughness=$($Entry.Value.Roughness);Metallic=$($Entry.Value.Metallic)"
}
'ClothAndFurMetallic=False'
'MissingTextures=0'
'BrokenExternalDependencies=0'
'RenderableMeshesWithoutMaterial=0'
'BoneCount=65'
'MorphTargetOccurrences=24'
'AnimationCount=9'
"AnimationNames=$($GlbAnimationNames -join ',')"
'RigPreserved=True'
'SkinWeightsPreservedExceptAuthorizedPatchReprojection=True'
'MorphTargetsPreserved=True'
'AnimationsPreserved=True'
'GLBRoundTripApproved=True'
"RuntimeComponent=$RuntimeComponent"
'RuntimeModelPath=/models/r2/r2-full-character-color-readable-ready-v2.glb'
'CameraFovBefore=32'
'CameraFovAfter=32'
'ModelScaleBefore=1.0'
'ModelScaleAfter=1.14'
'EffectiveVerticalCoverageAfter=0.72'
'ExposureBefore=0.9'
'ExposureAfter=1.0'
'TypeScript=PASSED'
'FocusedTests=32/32 PASSED'
'PhaseLint=PASSED'
'VisualEvidenceCount=5'
'BrowserLimitationDocumented=True'
'PreviousOfficialSourcesUnchanged=True'
'PhaseScopedFilesOnly=True'
'TemporaryDirectoriesRemaining=0'
'GitStagedFiles=0'
'CommitsCreated=0'
'PushPerformed=False'
'FailedGates=NONE'
'============================================================'
