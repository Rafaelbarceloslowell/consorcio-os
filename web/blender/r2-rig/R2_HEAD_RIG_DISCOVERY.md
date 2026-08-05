# R2 Head Rig Read-Only Discovery

## Result

- ExecutionStatus: `COMPLETED`
- TechnicalVerdict: `APROVADO` for read-only discovery
- Blender: `4.5.10 LTS`
- Official source SHA-256 before/after: `340EEDFD0251432E6B8326B23EAE3AD268D560CC9D2FEE0940C8F03F9DC5B64B`
- BlendSaved: `False`
- OfficialSourceUnchanged: `True`
- CreatedImages: `0`

The source contains one armature, `R2_Rig`, with the existing `neck -> head` integration. The facial foundation has 3,654 vertices, 10,524 edges, 6,847 faces, 343 boundary edges, 23 boundary components, only the `neck` and `head` vertex groups, zero unweighted vertices, zero UV maps, zero material slots, and zero shape keys.

## Mandatory facial prerequisites

Runtime inspection found zero eye objects, zero oral-cavity objects, zero facial bones, zero facial vertex groups, zero shape-key datablocks, zero drivers, and zero actions. The approved preparation specification independently marks eyelids, eye sockets, brows, muzzle, lips/mouth boundary, and jaw as requiring anatomical landmark or ownership certificates.

Historical V37 muzzle and V38 eye/brow data are topology-selection provenance. They do not certify a jaw hinge, lip boundary, mouth corners, ocular centers, upper/lower eyelids, or deformation falloffs. Automatic symmetry is not authorized: the approved mirror-match result is 1.80623973727422% with only six centerline vertices.

## Capability verdict

`NEUTRAL` and existing `HEAD_INTEGRATION` are supported. Jaw, eye aim, blink, brow, cheek, muzzle, lips/visemes, and ear control are not deterministically implementable from the approved evidence. The full machine-readable evidence is in `R2_HEAD_RIG_DISCOVERY.json`.
