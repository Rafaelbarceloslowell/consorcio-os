# R2 Facial Rig Architecture

The rig is hybrid: bones own eye/jaw pivots and shape keys own surface contact and expression form.

- `CTRL-face-root`: non-deforming facial control root, child of existing `head`.
- `CTRL-face-eye.L/.R`: independent eye controls at certified centers; coordinated aim is added by shared armature properties.
- `CTRL-face-jaw`: animator-facing jaw control.
- `DEF-face-jaw`: deform bone constrained to the jaw control and weighted only to the certified jaw region.
- `CTRL-face-brow.L/.R`, `CTRL-face-cheek.L/.R`, `CTRL-face-muzzle`, `CTRL-face-lip-upper`, `CTRL-face-lip-lower`, `CTRL-face-mouth-corner.L/.R`: non-deforming semantic control bones and UI anchors.

Canonical armature properties drive eye yaw/pitch, coordinated aim, left/right/bilateral blink, brow raise/frown, cheek raise, muzzle motion, jaw open, lip closure, smile, frown, narrow, wide, O, E and safe viseme channels A/E/O/MBP/FV/L. All values are normalized unless the specification records angular limits.

Neutral is defined as every scalar property at `0.0`, all new pose-bone rotations at identity, every expression shape at zero and every mesh equal to its Basis/rest signature.
