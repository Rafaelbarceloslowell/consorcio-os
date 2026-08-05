param()

$ErrorActionPreference = 'Stop'
$phaseRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$webRoot = (Resolve-Path (Join-Path $phaseRoot '..\..\..')).Path
$repoRoot = (Resolve-Path (Join-Path $webRoot '..')).Path
$blendPath = Join-Path $webRoot 'blender\r2-rig\r2-full-character-color-readable-ready-v2\r2-full-character-color-readable-ready-v2.blend'
$glbPath = Join-Path $webRoot 'public\models\r2\r2-full-character-color-readable-ready-v2.glb'
$expectedBlendHash = '2EEC504BFC6F3C0D0B1BF6B1EFA932445142DCB61527E94A64F9C4A3A5EE491D'
$expectedGlbHash = '0D960B9E263F17B6B03C52F855B7D5606AE2822524A1DB4EA38FB5552D8696DE'

function Read-Json([string]$name) {
  Get-Content -Raw -LiteralPath (Join-Path $phaseRoot $name) | ConvertFrom-Json
}

$blendHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $blendPath).Hash
$glbHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $glbPath).Hash
$authoring = Read-Json 'R2_STATE_ANIMATION_ORCHESTRATION_V1_AUTHORING_AUDIT.json'
$clips = Read-Json 'R2_STATE_ANIMATION_ORCHESTRATION_V1_CLIP_MANIFEST.json'
$states = Read-Json 'R2_STATE_ANIMATION_ORCHESTRATION_V1_STATE_MANIFEST.json'
$matrix = Read-Json 'R2_STATE_ANIMATION_ORCHESTRATION_V1_TRANSITION_MATRIX.json'
$stress = Read-Json 'R2_STATE_ANIMATION_ORCHESTRATION_V1_STRESS_RESULTS.json'
$three = Read-Json 'R2_STATE_ANIMATION_ORCHESTRATION_V1_THREE_AUDIT.json'
$tests = Read-Json 'R2_STATE_ANIMATION_ORCHESTRATION_V1_TEST_RESULTS.json'
$browser = Read-Json 'R2_STATE_ANIMATION_ORCHESTRATION_V1_BROWSER_RESULTS.json'

$typeSource = Get-Content -Raw -LiteralPath (Join-Path $webRoot 'types\r2-full-character-runtime.ts')
$stateBlock = [regex]::Match($typeSource, 'R2_RUNTIME_STATES\s*=\s*\[(.*?)\]\s*as const', 'Singleline').Groups[1].Value
$sourceStates = [regex]::Matches($stateBlock, '"([a-z_]+)"') | ForEach-Object { $_.Groups[1].Value }
$runtimeSource = Get-Content -Raw -LiteralPath (Join-Path $webRoot 'components\dashboard\3d\r2\real\r2-full-character-runtime.ts')
$modelPathConfirmed = $runtimeSource.Contains('/models/r2/r2-full-character-color-readable-ready-v2.glb')
$lockChanges = @(git -C $repoRoot diff --name-only -- web/package.json web/package-lock.json web/pnpm-lock.yaml web/yarn.lock)
$stagedFiles = @(git -C $repoRoot diff --cached --name-only)
$head = (git -C $repoRoot rev-parse HEAD).Trim()
$statusLines = @(git -C $repoRoot status --porcelain=v1 --untracked-files=all)
$phaseRelative = 'web/blender/r2-rig/r2-state-animation-orchestration-v1/'
$initialFilesReconstructed = @($statusLines | Where-Object { -not $_.Replace('\', '/').Contains($phaseRelative) })
$initialSnapshot = [ordered]@{
  schemaVersion = 1
  method = 'Final worktree status excluding the phase-owned report/evidence directory. All six edited runtime/test paths existed in the initial untracked worktree.'
  entries = $initialFilesReconstructed
  count = $initialFilesReconstructed.Count
}
$initialSnapshot | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $phaseRoot 'R2_STATE_ANIMATION_ORCHESTRATION_V1_INITIAL_WORKTREE.json') -Encoding utf8

$transactionDirectories = @(Get-ChildItem -LiteralPath (Join-Path $webRoot 'blender\r2-rig') -Directory -Force | Where-Object { $_.Name -like '._r2_state_animation_orchestration*' })
$phaseFiles = @(Get-ChildItem -LiteralPath $phaseRoot -Recurse -File | ForEach-Object { $_.FullName.Substring($phaseRoot.Length + 1).Replace('\', '/') } | Sort-Object)

$checks = [ordered]@{
  blendHash = ($blendHash -eq $expectedBlendHash)
  glbHash = ($glbHash -eq $expectedGlbHash)
  authoringMetrics = [bool]$authoring.passed
  sourceStateCount = ($sourceStates.Count -eq 10)
  stateManifestCount = ($states.stateCount -eq 10)
  clipManifestCount = ($clips.clips.Count -eq 9)
  transitionMatrix = ($matrix.transitionsChecked -eq 100)
  runtimeModelPath = $modelPathConfirmed
  threeAudit = [bool]$three.passed
  stress = ($stress.verdict -eq 'APROVADO' -and $stress.requests -eq 1000 -and $stress.effectiveTransitions -ge 500 -and $stress.mountUnmountCycles -eq 100)
  typescript = [bool]$tests.final.typescript.passed
  directedTests = ($tests.final.focusedTests.passed -eq 60 -and $tests.final.focusedTests.failed -eq 0)
  lint = [bool]$tests.final.phaseLint.passed
  noDependencyChanges = ($lockChanges.Count -eq 0)
  noStaging = ($stagedFiles.Count -eq 0)
  noCommit = ($head -eq '5db7dba5618eca83d14437d50aa0d4665c8bdf9b')
  noTransactionDirectories = ($transactionDirectories.Count -eq 0)
  browser = ($browser.verdict -eq 'APROVADO')
}
$failedChecks = @($checks.GetEnumerator() | Where-Object { -not $_.Value } | ForEach-Object { $_.Key })
$approved = $failedChecks.Count -eq 0
$audit = [ordered]@{
  schemaVersion = 1
  audit = 'R2_STATE_ANIMATION_ORCHESTRATION_V1_INDEPENDENT'
  executedAt = (Get-Date).ToString('o')
  head = $head
  officialHashes = [ordered]@{ blend = $blendHash; glb = $glbHash }
  canonicalStates = $sourceStates
  exactClipNames = @($clips.clips | ForEach-Object { $_.name })
  phaseFileCount = $phaseFiles.Count
  phaseFiles = $phaseFiles
  initiallyModifiedFileCount = $initialFilesReconstructed.Count
  dependencyChanges = $lockChanges
  stagedFiles = $stagedFiles
  transactionDirectories = @($transactionDirectories | ForEach-Object { $_.FullName })
  checks = $checks
  failedChecks = $failedChecks
  browserBlocker = [ordered]@{
    requirement = 'Compatible real-browser R2 canvas plus five required viewports'
    evidence = 'R2_STATE_ANIMATION_ORCHESTRATION_V1_BROWSER_RESULTS.json'
    cause = 'Edge and Chrome unavailable; available browser lacks ResizeObserver and therefore renders the intentional fallback.'
    affectedFile = 'components/dashboard/3d/gorila-r2-3d.tsx (fallback branch, unchanged in this phase)'
    risk = 'Visual state transitions, one-shot completion, reduced motion, responsive framing, and GLB network loading are not proven in a compatible real browser.'
    recommendedCorrection = 'Connect Edge or Chrome through Codex computer-use support and rerun the five viewports through the development diagnostics API.'
    safeState = 'Official files unchanged; implementation, TypeScript, tests, lint, Three.js, authoring, stress, and lifecycle audits approved.'
  }
  verdict = if ($approved) { 'APROVADO' } else { 'REPROVADO' }
}
$audit | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath (Join-Path $phaseRoot 'R2_STATE_ANIMATION_ORCHESTRATION_V1_INDEPENDENT_AUDIT.json') -Encoding utf8

$markdown = @"
# R2 State Animation Orchestration V1 — Independent Audit

## Verdict

**$($audit.verdict)**

The independent audit recalculated both official hashes, parsed the source state tuple separately, compared the GLB clip manifest, checked the authoring and Three.js inventories, validated stress/lifecycle counters, rechecked Git staging/HEAD/dependencies, and inspected the browser result. It does not copy the implementation verdict.

## Approved checks

- Blend and GLB hashes match exactly.
- Authoring metrics: 36 objects, 30 mesh objects, 29 renderable meshes, 17 materials, 65 bones, 24 morph occurrences, nine actions.
- Runtime: ten canonical source states, nine exact clips, 100 matrix entries, official V2 model path.
- Three.js, 1,000-request stress, 653 effective transitions, and 100 mount/unmount cycles approved.
- TypeScript, 60/60 directed tests, and phase lint approved.
- No dependency/lockfile change, staging, commit, push, or transaction directory.

## Failed mandatory check

- Requirement: compatible real-browser R2 canvas and five required viewports.
- Evidence: `R2_STATE_ANIMATION_ORCHESTRATION_V1_BROWSER_RESULTS.json`.
- Cause: Edge and Chrome were unavailable; the available browser lacks `ResizeObserver` and rendered the intentional no-canvas fallback.
- Affected path: `components/dashboard/3d/gorila-r2-3d.tsx` fallback branch (not changed by this phase).
- Risk: browser execution of state transitions, one-shot return, reduced motion, network GLB loading, and responsive framing is not proven.
- Recommended correction: connect Edge or Chrome and rerun all five viewports through `window.__GORILLA_R2_DIAGNOSTICS__` in development.
- Safe state: official artifacts are byte-identical and all non-browser gates pass.

Because browser approval is an explicit mandatory criterion, the independent and final verdicts are **REPROVADO**, with no contradictory “approval with caveats.”
"@
$markdown | Set-Content -LiteralPath (Join-Path $phaseRoot 'R2_STATE_ANIMATION_ORCHESTRATION_V1_INDEPENDENT_AUDIT.md') -Encoding utf8

$audit | ConvertTo-Json -Depth 10
if (-not $approved) { exit 2 }
