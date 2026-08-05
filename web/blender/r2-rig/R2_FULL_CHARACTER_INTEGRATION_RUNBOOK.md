# R2 Full Character Rig Integration and Web Runtime Runbook

## Immutable inputs

- Body-rig baseline: `r2-rig-v13-weights-refined.blend`, SHA-256 `392EA67AEBC3BA0FF72E65BE18F599E22A0C4C1296F2F6D365FFB989F35CF9C1`.
- Anatomical publication: `r2-facial-ocular-oral-assets-ready-v1.blend`, SHA-256 `50D04CFBAEC2A431D96D4060E2AE82045AFBC56A0E74AD1759D156C0222825B3`.
- Head-rig publication and integration source: `r2-head-rig-expression-ready-v1.blend`, SHA-256 `7AE3C98EEF99AE60FF3C0470370147559B6B1CE7EE8455BAFD81D9852D8C0B97`.

The approved head-rig publication contains the complete V57 body geometry and the exact V13 body-armature rest pose and hierarchy. The phase therefore uses that publication as its sole Blender construction source. V13 remains the certified historical body-rig baseline and is never copied into or merged with the candidate.

## Checkpoints

1. Read-only source, repository, GLB and Git inventory; deterministic body-source certification.
2. Written head/body, animation, GLB and Three.js architecture.
3. Unique transactional candidate copied from the immutable head-rig publication.
4. Preserve the single `R2_Rig`; certify the existing `neck -> head` attachment and all mesh relationships.
5. Add deterministic interaction-state metadata and exact neutral reset.
6. Author nine restrained body actions with deterministic names and no root motion.
7. Run combined body/head/eye/jaw/morph tests and preservation comparisons.
8. Export a self-contained binary GLB with skeleton, morph targets and actions.
9. Import the GLB into a clean Blender scene and audit skeleton, meshes, morphs, actions and neutral state.
10. Implement a typed Three.js controller without a competing state system.
11. Route the existing stable dashboard avatar through the official GLB while retaining the prior model path as rollback evidence.
12. Run focused Vitest, R2 tests and TypeScript checks.
13. Run programmatic loader/controller mount, transition, cleanup and remount validation.
14. Measure artifact size, parse time, nodes, materials, skins, bones, morphs, actions and cleanup stability.
15. Run an independent Blender/GLB/web/scope audit using implementations separate from the builder and controller.
16. Atomically publish only after every gate passes, then reopen/reload and repeat all applicable validations.

## Failure handling

Every rejected attempt remains confined to the current transaction. Logs record the command, checkpoint, full error, root cause and correction. Approved sources are rehashed before every candidate save and after every runtime. Gates are never relaxed. Invalid candidates are removed only after their rejection evidence is preserved.

## Publication names

- Blender: `blender/r2-rig/r2-full-character-runtime-ready-v1/r2-full-character-runtime-ready-v1.blend`
- Web GLB: `public/models/r2/r2-full-character-runtime-ready-v1.glb`
- Rollback GLB: `/models/r2/r2-gorilla-geometry-only.glb`

No images, renders, staging, commits, pushes or pull requests are part of this phase.
