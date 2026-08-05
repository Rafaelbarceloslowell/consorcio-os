# R2 Facial Anatomy Certification Runbook

## Scope

This runbook governs `FACIAL_ANATOMICAL_LANDMARK_AND_OCULAR_ORAL_ASSET_CERTIFICATION` against the immutable source:

`C:\Projetos\consorcio-os\web\blender\r2-rig\r2-head-consolidated-rig-ready-v1\r2-head-consolidated-rig-ready-v1.blend`

Required SHA-256: `340EEDFD0251432E6B8326B23EAE3AD268D560CC9D2FEE0940C8F03F9DC5B64B`.

No source save, V-numbered output, render, screenshot, preview, image, rig construction, staging, commit, push, or PR is permitted.

## Checkpoint procedure

1. Verify source SHA-256 before and after every Blender process.
2. Identify the foundation exclusively by the unique custom role `PRIMARY_DEFORMABLE_HEAD_SURFACE`.
3. Create ordered geometry and semantic fingerprints before interpreting indices.
4. Derive anatomical axes from the existing armature and approved lineage attributes.
5. Discover landmarks from topology plus approved semantic lineage; spatial proximity alone is insufficient.
6. Treat a candidate as certified only when every mandatory field and its source linkage are reproducible.
7. Audit scene objects, attributes, boundaries, topology and fit stability before constructing support assets.
8. Construct no support asset when dimensions, pivot, correspondence or design are underdetermined.
9. Stop at the first indispensable non-recoverable semantic gate; preserve passed checkpoint evidence.
10. Publish and resume rigging only after all certificates and the independent audit are approved.

## Recovery rule

Recoverable script/runtime errors are logged, corrected at their root cause, and rerun without weakening gates. Missing approved anatomical design evidence is non-recoverable by automation and must not be replaced by inferred artistic choices.

## Current outcome

Checkpoint 1 and Checkpoint 2 passed. Discovery found two uniquely supported eye-aperture boundaries and eight certifiable eyelid/canthus seeds. The mandatory landmark set, eyeball assets, ocular pivots, oral topology, jaw relationship and ear bases are not deterministically defined by the approved source. The phase therefore stops at `CHECKPOINT_4_LANDMARK_CERTIFICATION_BLOCKED`; no candidate blend is created or published and rigging remains paused.
