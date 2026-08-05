param(
    [Parameter(Mandatory = $true)][string]$CandidateBlend,
    [Parameter(Mandatory = $true)][string]$CandidateGlb,
    [Parameter(Mandatory = $true)][string]$ReportPath
)

$ErrorActionPreference = 'Stop'
$RigRoot = [IO.Path]::GetFullPath('C:\Projetos\consorcio-os\web\blender\r2-rig')
$WebModelRoot = [IO.Path]::GetFullPath('C:\Projetos\consorcio-os\web\public\models\r2')
$FinalBlendDirectory = Join-Path $RigRoot 'r2-full-character-runtime-ready-v1'
$FinalBlend = Join-Path $FinalBlendDirectory 'r2-full-character-runtime-ready-v1.blend'
$FinalGlb = Join-Path $WebModelRoot 'r2-full-character-runtime-ready-v1.glb'
$ExpectedBlendHash = '3D60D28B852566ABEC764D2DE0EB55D63F42AC26F8F75936109D33898B25E269'
$ExpectedGlbHash = 'E3B9702C0367A8CAFB138B5C9AB94D6CC448C470CD69D74A46333A9953207A59'
$Token = [Guid]::NewGuid().ToString('N')
$BlendStage = Join-Path $RigRoot ('.__r2_full_character_publish_' + $Token)
$GlbStage = Join-Path $WebModelRoot ('.__r2_full_character_publish_' + $Token + '.glb')
$BlendPublished = $false
$GlbPublished = $false

function Assert-Within([string]$Path, [string]$Root) {
    $Resolved = [IO.Path]::GetFullPath($Path)
    $Prefix = $Root.TrimEnd('\') + '\'
    if (-not $Resolved.StartsWith($Prefix, [StringComparison]::OrdinalIgnoreCase)) {
        throw "Unsafe publication path: $Resolved"
    }
}

Assert-Within $FinalBlend $RigRoot
Assert-Within $FinalGlb $WebModelRoot
Assert-Within $BlendStage $RigRoot
Assert-Within $GlbStage $WebModelRoot

if (Test-Path -LiteralPath $FinalBlendDirectory) {
    throw "Approved blend destination already exists: $FinalBlendDirectory"
}
if (Test-Path -LiteralPath $FinalGlb) {
    throw "Approved GLB destination already exists: $FinalGlb"
}

$CandidateBlendPath = (Resolve-Path -LiteralPath $CandidateBlend).Path
$CandidateGlbPath = (Resolve-Path -LiteralPath $CandidateGlb).Path
$CandidateBlendHash = (Get-FileHash -LiteralPath $CandidateBlendPath -Algorithm SHA256).Hash
$CandidateGlbHash = (Get-FileHash -LiteralPath $CandidateGlbPath -Algorithm SHA256).Hash
if ($CandidateBlendHash -ne $ExpectedBlendHash) {
    throw "Candidate blend hash mismatch: $CandidateBlendHash"
}
if ($CandidateGlbHash -ne $ExpectedGlbHash) {
    throw "Candidate GLB hash mismatch: $CandidateGlbHash"
}

try {
    New-Item -Path $BlendStage -ItemType Directory | Out-Null
    $StagedBlend = Join-Path $BlendStage 'r2-full-character-runtime-ready-v1.blend'
    Copy-Item -LiteralPath $CandidateBlendPath -Destination $StagedBlend
    Copy-Item -LiteralPath $CandidateGlbPath -Destination $GlbStage

    if ((Get-FileHash -LiteralPath $StagedBlend -Algorithm SHA256).Hash -ne $ExpectedBlendHash) {
        throw 'Staged blend hash mismatch.'
    }
    if ((Get-FileHash -LiteralPath $GlbStage -Algorithm SHA256).Hash -ne $ExpectedGlbHash) {
        throw 'Staged GLB hash mismatch.'
    }

    Move-Item -LiteralPath $BlendStage -Destination $FinalBlendDirectory
    $BlendPublished = $true
    Move-Item -LiteralPath $GlbStage -Destination $FinalGlb
    $GlbPublished = $true

    $FinalBlendHash = (Get-FileHash -LiteralPath $FinalBlend -Algorithm SHA256).Hash
    $FinalGlbHash = (Get-FileHash -LiteralPath $FinalGlb -Algorithm SHA256).Hash
    if ($FinalBlendHash -ne $ExpectedBlendHash -or $FinalGlbHash -ne $ExpectedGlbHash) {
        throw 'Final publication hash mismatch.'
    }

    $Report = [ordered]@{
        schema_version = 1
        execution_status = 'COMPLETED'
        technical_verdict = 'APROVADO'
        atomic_publication_approved = $true
        official_blend = $FinalBlend
        official_blend_sha256 = $FinalBlendHash
        official_glb = $FinalGlb
        official_glb_sha256 = $FinalGlbHash
        staging_artifacts_remaining = 0
    }
    [IO.File]::WriteAllText(
        $ReportPath,
        ($Report | ConvertTo-Json -Depth 10) + [Environment]::NewLine,
        [Text.UTF8Encoding]::new($false)
    )
    $Report | ConvertTo-Json -Depth 10
}
catch {
    if ($GlbPublished -and (Test-Path -LiteralPath $FinalGlb)) {
        Remove-Item -LiteralPath $FinalGlb -Force
    }
    if ($BlendPublished -and (Test-Path -LiteralPath $FinalBlendDirectory)) {
        Remove-Item -LiteralPath $FinalBlendDirectory -Recurse -Force
    }
    if (Test-Path -LiteralPath $GlbStage) {
        Remove-Item -LiteralPath $GlbStage -Force
    }
    if (Test-Path -LiteralPath $BlendStage) {
        Remove-Item -LiteralPath $BlendStage -Recurse -Force
    }
    throw
}
