param(
    [Parameter(Mandatory = $true)]
    [string]$TransactionPath
)

$ErrorActionPreference = 'Stop'
$RigRoot = 'C:\Projetos\consorcio-os\web\blender\r2-rig'
$PublicModelRoot = 'C:\Projetos\consorcio-os\web\public\models\r2'
$SourceBlend = Join-Path $RigRoot 'r2-full-character-material-branded-ready-v1\r2-full-character-material-branded-ready-v1.blend'
$SourceGlb = Join-Path $PublicModelRoot 'r2-full-character-material-branded-ready-v1.glb'
$SourceBlendHash = 'AD7501A2828DAA76749C6ABE367597F1645BB79C1A205E83BED265B556F52E57'
$SourceGlbHash = '1F693EBB12E36965786C426CC07AF5FD6775CADFD81542236518103C6541E6AB'
$CandidateBlend = Join-Path $TransactionPath 'r2-full-character-color-readable-ready-v2.candidate.blend'
$CandidateGlb = Join-Path $TransactionPath 'r2-full-character-color-readable-ready-v2.candidate.glb'
$FinalDirectory = Join-Path $RigRoot 'r2-full-character-color-readable-ready-v2'
$FinalBlend = Join-Path $FinalDirectory 'r2-full-character-color-readable-ready-v2.blend'
$FinalGlb = Join-Path $PublicModelRoot 'r2-full-character-color-readable-ready-v2.glb'
$StageDirectory = Join-Path $TransactionPath '.publish-stage-r2-color-v2'
$StageBlendDirectory = Join-Path $StageDirectory 'r2-full-character-color-readable-ready-v2'
$StageBlend = Join-Path $StageBlendDirectory 'r2-full-character-color-readable-ready-v2.blend'
$StageEvidence = Join-Path $StageBlendDirectory 'evidence'
$StageGlb = Join-Path $StageDirectory 'r2-full-character-color-readable-ready-v2.glb'

function Get-Sha256([string]$Path) {
    return (Get-FileHash -Algorithm SHA256 -LiteralPath $Path).Hash
}

function Assert-Approved([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        throw "Required approval report is missing: $Path"
    }
    $Report = Get-Content -Raw -LiteralPath $Path | ConvertFrom-Json
    if ($Report.TechnicalVerdict -ne 'APROVADO' -or $Report.FailedGates -ne 'NONE') {
        throw "Report is not approved: $Path"
    }
    return $Report
}

$ResolvedTransaction = [System.IO.Path]::GetFullPath($TransactionPath)
$ExpectedParent = [System.IO.Path]::GetFullPath($RigRoot)
if ([System.IO.Directory]::GetParent($ResolvedTransaction).FullName -ne $ExpectedParent) {
    throw "Unauthorized transaction parent: $ResolvedTransaction"
}
if ([System.IO.Path]::GetFileName($ResolvedTransaction) -notlike '._r2_color_v2_*') {
    throw "Unauthorized transaction name: $ResolvedTransaction"
}
if ((Get-Sha256 $SourceBlend) -ne $SourceBlendHash -or (Get-Sha256 $SourceGlb) -ne $SourceGlbHash) {
    throw 'Immutable V1 source hash mismatch before publication'
}
if (Test-Path -LiteralPath $FinalDirectory) {
    throw "Final V2 Blend directory already exists: $FinalDirectory"
}
if (Test-Path -LiteralPath $FinalGlb) {
    throw "Final V2 GLB already exists: $FinalGlb"
}
if (Test-Path -LiteralPath $StageDirectory) {
    throw "Publication stage already exists: $StageDirectory"
}
$Validation = Assert-Approved (Join-Path $TransactionPath 'R2_COLOR_READABILITY_V2_VALIDATION.json')
$Export = Assert-Approved (Join-Path $TransactionPath 'R2_COLOR_READABILITY_V2_EXPORT_REPORT.json')
$RoundTrip = Assert-Approved (Join-Path $TransactionPath 'R2_COLOR_READABILITY_V2_GLB_ROUNDTRIP.json')
$CandidateBlendHash = Get-Sha256 $CandidateBlend
$CandidateGlbHash = Get-Sha256 $CandidateGlb
if ($Validation.CandidateBlendSHA256 -ne $CandidateBlendHash -or $Export.candidate_blend_sha256 -ne $CandidateBlendHash) {
    throw 'Candidate Blend differs from approved validation/export'
}
if ($Export.glb_sha256 -ne $CandidateGlbHash -or $RoundTrip.glb_sha256 -ne $CandidateGlbHash) {
    throw 'Candidate GLB differs from approved export/round-trip'
}
$EvidenceSource = Join-Path $TransactionPath 'final-evidence'
$EvidenceReportPath = Join-Path $EvidenceSource 'R2_V2_RENDER_EVIDENCE.json'
$EvidenceReport = Get-Content -Raw -LiteralPath $EvidenceReportPath | ConvertFrom-Json
if ($EvidenceReport.blend_sha256 -ne $CandidateBlendHash -or @($EvidenceReport.outputs).Count -ne 5) {
    throw 'Visual evidence does not match the approved candidate Blend'
}
$ExpectedViews = @('back', 'dashboard', 'front', 'left_arm_close', 'three_quarter')
$ActualViews = @($EvidenceReport.outputs | ForEach-Object { $_.view } | Sort-Object)
if (($ActualViews -join ',') -ne ($ExpectedViews -join ',')) {
    throw "Visual evidence views are incomplete: $($ActualViews -join ',')"
}
New-Item -ItemType Directory -Path $StageEvidence | Out-Null
Copy-Item -LiteralPath $CandidateBlend -Destination $StageBlend
Copy-Item -LiteralPath $CandidateGlb -Destination $StageGlb
foreach ($Output in $EvidenceReport.outputs) {
    if ((Get-Sha256 $Output.path) -ne $Output.sha256) {
        throw "Visual evidence hash mismatch: $($Output.path)"
    }
    Copy-Item -LiteralPath $Output.path -Destination (Join-Path $StageEvidence ([System.IO.Path]::GetFileName($Output.path)))
}
Copy-Item -LiteralPath $EvidenceReportPath -Destination (Join-Path $StageEvidence 'R2_V2_RENDER_EVIDENCE.json')
if ((Get-Sha256 $StageBlend) -ne $CandidateBlendHash -or (Get-Sha256 $StageGlb) -ne $CandidateGlbHash) {
    throw 'Staged artifact hash mismatch'
}
Move-Item -LiteralPath $StageBlendDirectory -Destination $FinalDirectory
Move-Item -LiteralPath $StageGlb -Destination $FinalGlb
if (Test-Path -LiteralPath $StageDirectory) {
    Remove-Item -LiteralPath $StageDirectory -Recurse -Force
}
if ((Get-Sha256 $FinalBlend) -ne $CandidateBlendHash -or (Get-Sha256 $FinalGlb) -ne $CandidateGlbHash) {
    throw 'Published artifact hash mismatch'
}
if ((Get-Sha256 $SourceBlend) -ne $SourceBlendHash -or (Get-Sha256 $SourceGlb) -ne $SourceGlbHash) {
    throw 'Immutable V1 source hash mismatch after publication'
}
$Publication = [ordered]@{
    schema_version = 1
    ExecutionStatus = 'COMPLETED'
    TechnicalVerdict = 'APROVADO'
    PublishedBlend = $FinalBlend
    PublishedBlendSHA256 = $CandidateBlendHash
    PublishedBlendSizeBytes = (Get-Item -LiteralPath $FinalBlend).Length
    PublishedGLB = $FinalGlb
    PublishedGLBSHA256 = $CandidateGlbHash
    PublishedGLBSizeBytes = (Get-Item -LiteralPath $FinalGlb).Length
    EvidenceDirectory = Join-Path $FinalDirectory 'evidence'
    EvidenceCount = 5
    EvidenceViews = $ExpectedViews
    PreviousBlend = $SourceBlend
    PreviousBlendSHA256 = $SourceBlendHash
    PreviousGLB = $SourceGlb
    PreviousGLBSHA256 = $SourceGlbHash
    PreviousOfficialSourcesUnchanged = $true
    FailedGates = 'NONE'
}
$PublicationPath = Join-Path $RigRoot 'R2_COLOR_READABILITY_V2_PUBLICATION_REPORT.json'
$PublicationJson = $Publication | ConvertTo-Json -Depth 8
[System.IO.File]::WriteAllText($PublicationPath + '.tmp', $PublicationJson + [Environment]::NewLine, [System.Text.UTF8Encoding]::new($false))
Move-Item -LiteralPath ($PublicationPath + '.tmp') -Destination $PublicationPath
$Publication | ConvertTo-Json -Depth 8
