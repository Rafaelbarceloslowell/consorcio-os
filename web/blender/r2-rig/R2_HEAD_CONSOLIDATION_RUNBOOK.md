# R2 Head Consolidation and Rig Preparation Runbook

## Environment and immutable source

- Windows PowerShell 5.1
- Blender 4.5.10 LTS
- Immutable source: `r2-v57-negative-x-middle-mid-depth-retopology-v1/r2-rig-v57-negative-x-middle-mid-depth-retopology-v1.blend`
- Required source SHA-256: `63F7F71988B171A37DF9A09EC8F957729DEF6D35E2D0C093A73577702F892752`
- No images, renders, screenshots, previews, Git staging, commits, pushes, pull requests, or manual Blender edits

## Checkpoint protocol

1. Verify the source hash, size, timestamp, and read-only snapshot.
2. Open V57 in Blender background mode and generate the complete read-only inventory without saving.
3. Derive a per-object consolidation plan exclusively from the inventory.
4. Copy V57 to a unique transactional directory and apply only planned deterministic changes.
5. Generate the rig-preparation specification from measured topology, hierarchy, groups, and materials.
6. Run a technical validator against the source and candidate.
7. Run a separate independent auditor against source, candidate, inventory, plan, and canonical mappings.
8. Publish only after both audits approve, by atomic directory movement to a non-V-numbered semantic target.
9. Reopen the published blend and repeat the independent and final integrity audits.
10. Re-hash V40-V57, remove transactional artifacts, and finalize state and report.

## Recovery

Every failed runtime is recorded with its command, output, root cause, correction, and rerun result. Failed candidates never become sources. Gates are never weakened.

## Final checkpoint

- Phase: `HEAD_CONSOLIDATION_AND_RIG_PREPARATION`
- Status: `COMPLETED`
- Technical verdict: `APROVADO`
- Final official blend: `r2-head-consolidated-rig-ready-v1/r2-head-consolidated-rig-ready-v1.blend`
- Final SHA-256: `340EEDFD0251432E6B8326B23EAE3AD268D560CC9D2FEE0940C8F03F9DC5B64B`
- Source V57 unchanged: `True`
- Previous official versions unchanged: `True`
- Failed gates: `NONE`
- Temporary directories remaining: `0`
- Next phase: `HEAD_RIGGING_AND_EXPRESSION_SYSTEM`
