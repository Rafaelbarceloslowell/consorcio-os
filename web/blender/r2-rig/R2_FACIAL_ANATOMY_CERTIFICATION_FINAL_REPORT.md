# R2 Facial Anatomy Certification Final Report

## Result

ExecutionStatus=BLOCKED  
TechnicalVerdict=REPROVADO  
Recoverable=False  
CurrentCheckpoint=CHECKPOINT_4_LANDMARK_CERTIFICATION_BLOCKED

The immutable foundation was identified and fingerprinted successfully, and its anatomical axes were certified in Blender 4.5.10 LTS. The discovery pass found exactly two closed boundaries wholly adjacent to the approved eye/brow lineage. They support four certifiable eye-corner landmarks and four additional eyelid candidates, but duplicate coordinates prevent distinct upper/lower primary landmarks. This is insufficient to approve the mandatory 38-landmark certificate.

## Decisive evidence

- Source SHA-256 before and after every Blender run: 340EEDFD0251432E6B8326B23EAE3AD268D560CC9D2FEE0940C8F03F9DC5B64B.
- Foundation: R2_Head_Face_Foundation / R2_Head_Face_Foundation_Mesh, 3654 vertices, 10524 edges, 6847 polygons.
- Ordered vertex fingerprint: B67AD7CDAFC66A8A591E13D6EE2AF8C645F84F9B3285F61A313A44B855F5D3B2.
- Mandatory landmarks safely certifiable: 4 of 38.
- Scene ocular objects: 0; scene oral objects: 0; oral semantic attributes: 0.
- Boundary edges adjacent to the approved muzzle lineage: 0.
- Eye sphere inference is unstable: the left fit radius ranges across ring depths by 0.610721; the right by 0.422840. The depth-zero fits are near-planar and ill-conditioned, so they cannot define an eye asset or pivot.
- The approved C086 reference explicitly called for mouth/lip/muzzle/jaw topology to be created. V37 approved surface retopology/proximity but did not certify lip loops, a mouth opening, jaw hinge, or oral cavity.
- V40â€“V57 official blend hashes were rechecked and all match their approved values.

## Blocking reason

The official source certifies two eyelid apertures but contains no separate ocular assets or approved eye dimensions/pivots, and it contains no deterministic oral opening, lip, jaw-hinge, oral-cavity, dental, tongue, or ear-base semantics. Constructing these would require human design evidence and, for the mandatory mouth deformation system, external facial topology decisions outside a neutral support-asset derivation.

## Consequences

No ocular or oral support asset was created because its dimensions, pivot and topology would be an artistic guess. No blend was saved or published. Checkpoints 9-11 were not run, the independent audit cannot approve incomplete certificates, and HEAD_RIGGING_AND_EXPRESSION_SYSTEM remains blocked at Checkpoint 2.

## Recommended recovery

Provide an approved anatomical design package or artist-authored source containing left/right eyeball meshes with centers/radii/forward axes, certified lip and mouth-opening edge loops, jaw hinge/pivot and affected region, oral cavity/closure topology, and ear-base landmarks, all registered to this exact foundation vertex order; then rerun Checkpoints 3 through 11.

OfficialSourceUnchanged=True  
PreviousOfficialVersionsUnchanged=True  
CreatedImages=0