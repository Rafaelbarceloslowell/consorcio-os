param(
    [Parameter(Mandatory = $true)][string]$Transaction
)

$ErrorActionPreference = 'Stop'
$RigRoot = 'C:\Projetos\consorcio-os\web\blender\r2-rig'
$WebModelRoot = 'C:\Projetos\consorcio-os\web\public\models\r2'
$OfficialBlend = Join-Path $RigRoot 'r2-full-character-runtime-ready-v1\r2-full-character-runtime-ready-v1.blend'
$OfficialGlb = Join-Path $WebModelRoot 'r2-full-character-runtime-ready-v1.glb'
$ExpectedOfficialBlendHash = '3D60D28B852566ABEC764D2DE0EB55D63F42AC26F8F75936109D33898B25E269'
$ExpectedOfficialGlbHash = 'E3B9702C0367A8CAFB138B5C9AB94D6CC448C470CD69D74A46333A9953207A59'
$CandidateBlend = Join-Path $Transaction 'r2-full-character-material-branded-ready-v1.candidate.blend'
$CandidateGlb = Join-Path $Transaction 'r2-full-character-material-branded-ready-v1.candidate.glb'
$FinalBlendDirectory = Join-Path $RigRoot 'r2-full-character-material-branded-ready-v1'
$FinalBlend = Join-Path $FinalBlendDirectory 'r2-full-character-material-branded-ready-v1.blend'
$FinalGlb = Join-Path $WebModelRoot 'r2-full-character-material-branded-ready-v1.glb'
$BlendTemporary = Join-Path $FinalBlendDirectory '.r2-full-character-material-branded-ready-v1.blend.publication.tmp'
$GlbTemporary = Join-Path $WebModelRoot '.r2-full-character-material-branded-ready-v1.glb.publication.tmp'
$AuditPath = Join-Path $RigRoot 'R2_MATERIAL_BRANDING_INDEPENDENT_AUDIT.json'
$ReportPath = Join-Path $RigRoot 'R2_MATERIAL_BRANDING_PUBLICATION_REPORT.json'

if ((Get-FileHash -Algorithm SHA256 -LiteralPath $OfficialBlend).Hash -ne $ExpectedOfficialBlendHash) {
    throw 'Previous official blend hash mismatch.'
}
if ((Get-FileHash -Algorithm SHA256 -LiteralPath $OfficialGlb).Hash -ne $ExpectedOfficialGlbHash) {
    throw 'Previous official GLB hash mismatch.'
}
if (-not (Test-Path -LiteralPath $CandidateBlend -PathType Leaf) -or -not (Test-Path -LiteralPath $CandidateGlb -PathType Leaf)) {
    throw 'Approved transactional candidates are missing.'
}
if (Test-Path -LiteralPath $FinalBlendDirectory) {
    throw "Approved blend destination already exists: $FinalBlendDirectory"
}
if (Test-Path -LiteralPath $FinalGlb) {
    throw "Approved GLB destination already exists: $FinalGlb"
}
$Audit = Get-Content -Raw -LiteralPath $AuditPath | ConvertFrom-Json
if (-not [bool]$Audit.IndependentAuditApproved -or $Audit.FailedGates -ne 'NONE') {
    throw 'Atomic publication requires an approved independent audit.'
}
$CandidateBlendHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $CandidateBlend).Hash
$CandidateGlbHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $CandidateGlb).Hash
if ($CandidateBlendHash -ne $Audit.candidate_blend_sha256 -or $CandidateGlbHash -ne $Audit.candidate_glb_sha256) {
    throw 'Candidate hashes differ from the independent audit.'
}

$CreatedDirectory = $false
$PublishedBlend = $false
$PublishedGlb = $false
try {
    New-Item -ItemType Directory -Path $FinalBlendDirectory | Out-Null
    $CreatedDirectory = $true
    Copy-Item -LiteralPath $CandidateBlend -Destination $BlendTemporary
    Copy-Item -LiteralPath $CandidateGlb -Destination $GlbTemporary
    if ((Get-FileHash -Algorithm SHA256 -LiteralPath $BlendTemporary).Hash -ne $CandidateBlendHash) {
        throw 'Temporary blend copy hash mismatch.'
    }
    if ((Get-FileHash -Algorithm SHA256 -LiteralPath $GlbTemporary).Hash -ne $CandidateGlbHash) {
        throw 'Temporary GLB copy hash mismatch.'
    }
    Move-Item -LiteralPath $BlendTemporary -Destination $FinalBlend
    $PublishedBlend = $true
    Move-Item -LiteralPath $GlbTemporary -Destination $FinalGlb
    $PublishedGlb = $true
    if ((Get-FileHash -Algorithm SHA256 -LiteralPath $FinalBlend).Hash -ne $CandidateBlendHash) {
        throw 'Published blend hash mismatch.'
    }
    if ((Get-FileHash -Algorithm SHA256 -LiteralPath $FinalGlb).Hash -ne $CandidateGlbHash) {
        throw 'Published GLB hash mismatch.'
    }
}
catch {
    if (Test-Path -LiteralPath $BlendTemporary) { Remove-Item -LiteralPath $BlendTemporary }
    if (Test-Path -LiteralPath $GlbTemporary) { Remove-Item -LiteralPath $GlbTemporary }
    if ($PublishedBlend -and (Test-Path -LiteralPath $FinalBlend)) { Remove-Item -LiteralPath $FinalBlend }
    if ($PublishedGlb -and (Test-Path -LiteralPath $FinalGlb)) { Remove-Item -LiteralPath $FinalGlb }
    if ($CreatedDirectory -and (Test-Path -LiteralPath $FinalBlendDirectory) -and @(Get-ChildItem -LiteralPath $FinalBlendDirectory -Force).Count -eq 0) {
        Remove-Item -LiteralPath $FinalBlendDirectory
    }
    throw
}

$Report = [ordered]@{
    schema_version = 1
    ExecutionStatus = 'COMPLETED'
    TechnicalVerdict = 'APROVADO'
    published_blend = $FinalBlend
    published_blend_sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $FinalBlend).Hash
    published_blend_size_bytes = (Get-Item -LiteralPath $FinalBlend).Length
    published_glb = $FinalGlb
    published_glb_sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $FinalGlb).Hash
    published_glb_size_bytes = (Get-Item -LiteralPath $FinalGlb).Length
    previous_official_blend = $OfficialBlend
    previous_official_blend_sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $OfficialBlend).Hash
    previous_official_glb = $OfficialGlb
    previous_official_glb_sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $OfficialGlb).Hash
    previous_official_sources_unchanged = $true
    overwrite_performed = $false
    failed_gates = 'NONE'
}
$Json = $Report | ConvertTo-Json -Depth 10
$TemporaryReport = $ReportPath + '.tmp'
[System.IO.File]::WriteAllText($TemporaryReport, $Json + [Environment]::NewLine, [Text.UTF8Encoding]::new($false))
Move-Item -LiteralPath $TemporaryReport -Destination $ReportPath -Force
$Json
