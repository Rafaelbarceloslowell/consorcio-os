# R2 Head Rigging and Expression Runbook

## Approved semantic input

Use only the reopened anatomical publication recorded in `R2_HEAD_RIGGING_STATE.json`. Preserve the immutable consolidated source as historical evidence and do not repeat completed anatomy authoring.

## Architecture

- Preserve the existing `root -> pelvis -> spine_01 -> spine_02 -> chest -> neck -> head` chain.
- Add a non-deforming facial control root under `head`.
- Add bilateral eye controls at certified ocular centers and drive the published eye pivots.
- Add a jaw control and deform bone on the certified jaw axis; weights are changed only inside the certified jaw semantic region.
- Shape keys own blink seal, brows, cheeks, muzzle, lip contact, smile/frown, mouth width and O/E shapes.
- A jaw-driver object owns lower oral rigid motion; its neutral transform is exact.
- Armature custom properties are the canonical runtime channels and drive bones, eye pivots and shape keys deterministically.
- All runtime tests must restore every property to zero and reproduce the exact neutral signatures before publication.

## Recovery and publication

Work only in a unique transaction copied from the anatomical publication. Preserve rejected logs, delete rejected blends, restore from the approved semantic input and rerun the affected checkpoint. Publish atomically only after an independent read-only auditor passes, then reopen and audit again.

