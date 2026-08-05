# R2 Facial Asset Authoring Runbook

## Mission

Author the user-approved ocular, oral, mandibular and semantic facial foundation transactionally, certify 38 mandatory landmarks, audit and publish it, then resume `HEAD_RIGGING_AND_EXPRESSION_SYSTEM` from Checkpoint 2.

Immutable source: `C:\Projetos\consorcio-os\web\blender\r2-rig\r2-head-consolidated-rig-ready-v1\r2-head-consolidated-rig-ready-v1.blend`

Required source SHA-256: `340EEDFD0251432E6B8326B23EAE3AD268D560CC9D2FEE0940C8F03F9DC5B64B`.

## Execution rules

1. Verify the immutable source and V40-V57 hashes before construction and before every candidate save.
2. Work only in a uniquely named transaction below `blender\r2-rig`.
3. Preserve the complete source foundation coordinate order. Local oral authoring may remove only faces recorded in the authorized oral mask; no existing vertex coordinate is moved.
4. Ocular construction is additive. It uses the two unique `r2_region_id=2` aperture boundaries, certified anatomical axes and the explicit user design authorization.
5. Oral construction is local. It uses a closed neutral lip assembly, a hidden interior cavity, restrained teeth and tongue, and a recorded deletion mask inside the V37 muzzle lineage.
6. New materials are procedural/simple and contain no image nodes.
7. Every save is rejected if its path equals the immutable source or lies outside the transaction/publication destinations.
8. Independent auditing is implemented in a separate read-only Blender script.
9. Publication occurs only after all hard gates pass; publication is atomic and never overwrites an existing destination.
10. Rigging resumes only from the reopened, independently approved anatomical publication.

## Recovery

For a recoverable failure, preserve the full log, delete the rejected candidate, correct the cause, regenerate certificates/hashes and rerun the complete affected checkpoint. Rollback always returns to the immutable source copy. Gates are never weakened.

