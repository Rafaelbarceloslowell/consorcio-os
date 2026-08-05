# R2 Head Rig Preparation Specification

## Approved foundation

Use `R2_Head_Face_Foundation` / `R2_Head_Face_Foundation_Mesh` with the existing `R2_Rig → neck → head` integration. The mesh has one island, identity transform, positive unit scale, exact normalized `neck`/`head` weights, zero unweighted vertices, and no invalid topology. Preserve `R2_Head_Fur` and hidden `R2_Head_Face` separately.

## Anatomical evidence and asymmetry

The local foundation bounds are X `[-0.0431719236, 0.1110405475]`, Y `[-0.3055976033, -0.1096198037]`, and Z `[0.6516481638, 0.9505565763]`. Six vertices lie within the measured centerline tolerance. Only 1.80624% have a mirrored nearest neighbor within that narrow tolerance; median mirrored distance is `0.01032037` and p95 is `0.09803690`. Automatic mirroring of topology, weights, bones, or shape keys is prohibited. The future system must certify explicit bilateral landmarks and preserve authored asymmetry.

There are currently no facial bones, shape keys, eye objects, oral-cavity objects, materials, or UV maps. Cheek and nasal provenance attributes exist, but they are not deformation labels. Eyelids, sockets, brows, muzzle, lips, jaw, and ears therefore require landmark/component certificates before controls are added.

## Recommended future control architecture

- Head root: preserve the existing deform `head` under `neck`; add a non-deforming facial-control root only after landmark approval.
- Jaw: certified anatomical hinge and oral boundary first; then a minimal jaw deform chain plus corrective shapes.
- Eyes: no controls until independent left/right ocular centers and eye assets exist.
- Eyelids: hybrid sparse follow bones plus blink/seal/squint shape keys after lid-loop certification.
- Brows, cheeks, muzzle, and ears: low-count regional bones for broad motion, only where semantic ownership is certified.
- Lips: certified upper/lower/corner landmarks; bones own broad placement, shape keys own contact, phonemes, folds, and asymmetry.
- Correctives: pose-space shapes driven by measured combinations, never generated from assumed symmetry.
- Neck: retain exact current head/neck weights and validate motion jointly with fur and hood clearance.

## Readiness and tests

Topology and vertex order are stable enough for a future Basis, but the next phase must first freeze a neutral vertex-order signature, an anatomical landmark certificate, naming rules, jaw/eye centers, and zone ownership. Required regression tests cover blink seal, jaw/lip contact, brow-cheek-muzzle volume, head-neck continuity, hood/fur clearance, four-influence limits, zero unweighted vertices, corrective combinations, and GLB round-trip skin/morph integrity.

Do not apply Armature modifiers, bake final animation, generate unapproved facial bones, infer symmetry, or export the final web GLB during this phase.

`NextPhase=HEAD_RIGGING_AND_EXPRESSION_SYSTEM`
