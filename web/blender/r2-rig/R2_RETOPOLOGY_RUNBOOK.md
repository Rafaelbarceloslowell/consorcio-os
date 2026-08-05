# R2 Retopology Autonomous Runbook

## Environment

- Windows PowerShell 5.1
- Blender 4.5.10 LTS
- No manual Blender editing, images, renders, previews, staging, commits, pushes, or pull requests

## Transactional cycle

1. Verify the frozen source blend and certificate hashes.
2. Run static Python and PowerShell validation.
3. Build candidates only inside the certified region without dissolving boundary vertices.
4. Save the selected candidate in a transactional staging directory.
5. Run an independent source-versus-candidate audit.
6. Publish only an approved candidate to a new immutable version directory.
7. Run a final read-only integrity audit opening source and published blend separately.
8. Freeze the approved version and update `R2_RETOPOLOGY_STATE.json` transactionally.
9. Run the next read-only priority analysis.
10. Stop when no remaining candidate maps to a safe, measurable retopology operation.

## Final checkpoint

- Frozen official source: V57
- Official blend: `r2-v57-negative-x-middle-mid-depth-retopology-v1/r2-rig-v57-negative-x-middle-mid-depth-retopology-v1.blend`
- Official SHA-256: `63F7F71988B171A37DF9A09EC8F957729DEF6D35E2D0C093A73577702F892752`
- Last approved runtime: `V57_FINAL_INTEGRITY_READ_ONLY_AUDIT`
- Loop status: `COMPLETE`
- Stop condition: `NO_FURTHER_SAFE_CANDIDATE`
- Next phase: `HEAD_CONSOLIDATION_AND_RIG_PREPARATION`

## Confirmed stopping procedure

After V57 was frozen, the V58 priority and certificate analyses isolated a safe 14-face subset in `NEGATIVE_X_LOWER_MID_DEPTH`. Runtime construction tested each strictly internal vertex dissolution, their combination, and every pair of strictly internal edges. Candidates with measurable reduction worsened aspect or normal gates; the sole quality-improving vertex candidate reduced only 7.142857%, below the unchanged 10% measurable-benefit gate; edge pairs reduced zero faces and sometimes degraded topology. V58 was therefore rejected without publication, and V57 remains the immutable official endpoint.

## Non-negotiable gates

External geometry, surviving weights, preserved face attributes, materials, vertex-group names, and inherited custom properties must remain exact. Wire edges, invalid non-manifold edges, unweighted vertices, inverted faces, additional connected islands, and unsafe boundary dissolution are forbidden.
