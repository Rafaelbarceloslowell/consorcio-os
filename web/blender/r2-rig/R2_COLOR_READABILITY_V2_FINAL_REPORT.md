# GorillaOS R2 Material Color Readability and Runtime Framing V2

## Verdict

ExecutionStatus=COMPLETED and TechnicalVerdict=APROVADO.

## Diagnosis and executed changes

The previous dark graphite fur, nearly black hoodie and charcoal pants were too close in luminance. The R2 designation was dark brand green over a dark sleeve. V2 applies natural charcoal fur, a moss-green hoodie, lead-gray pants, black boots with controlled highlights, and slightly lighter face/hands. The official three-branding layout is preserved.

The left-arm patch was rebuilt on the same approved garment surface: patch +10%, R2 glyphs +18%, designation changed from dark green to white embroidery, and the approved anatomical center retained. Its skinned barycentric ownership was regenerated from the sleeve and validated across all nine animations.

## Final palette

| Material | Base Color | Roughness | Metallic |
|---|---:|---:|---:|
| R2_Mat_Fur_DarkGraphite | #2D312E | 0.80 | 0.0 |
| R2_Mat_Fur_MidGraphite | #303431 | 0.78 | 0.0 |
| R2_Mat_Skin_Anthracite | #414743 | 0.68 | 0.0 |
| R2_Mat_Hoodie_Black | #4F5C3A | 0.82 | 0.0 |
| R2_Mat_Pants_Charcoal | #363A3E | 0.78 | 0.0 |
| R2_Mat_Shoes_Black | #141718 | 0.54 | 0.0 |

## Runtime framing and lighting

- Active model: `/models/r2/r2-full-character-color-readable-ready-v2.glb`.
- Rollback: `/models/r2/r2-full-character-material-branded-ready-v1.glb`.
- Presentation scale: 1.0 -> 1.14 (+14%).
- Effective useful-height coverage: 67.5%-72%; 72% for normal dashboard aspects.
- FOV: 32 -> 32; bounds-centered camera preserved.
- Exposure: 0.9 -> 1.0.
- Key/fill/rim colors were neutralized and balanced; the dark GorillaOS environment remains unchanged.

## Published artifacts

- Blend: `C:\Projetos\consorcio-os\web\blender\r2-rig\r2-full-character-color-readable-ready-v2\r2-full-character-color-readable-ready-v2.blend` - `2EEC504BFC6F3C0D0B1BF6B1EFA932445142DCB61527E94A64F9C4A3A5EE491D`.
- GLB: `C:\Projetos\consorcio-os\web\public\models\r2\r2-full-character-color-readable-ready-v2.glb` - `0D960B9E263F17B6B03C52F855B7D5606AE2822524A1DB4EA38FB5552D8696DE`.
- Evidence: `C:\Projetos\consorcio-os\web\blender\r2-rig\r2-full-character-color-readable-ready-v2\evidence` (front, three-quarter, back, left-arm close-up and dashboard-equivalent views).

## Preserved metrics and validation

- 36 objects, 30 meshes, 29 renderable meshes and 17 materials.
- 65 bones, 24 morph-target occurrences, 9 animations and 10 runtime states.
- Zero missing materials, textures, external dependencies, clipping, z-fighting, floating, runtime material overrides or runtime console errors.
- Candidate and post-publication GLB round-trip approved.
- Focused tests 32/32, TypeScript passed, phase lint passed and independent audit approved.
- Previous Blend/GLB hashes remain unchanged.
- Zero staging, commits and push.

## Automated visual evidence and limitation

Five controlled renders were visually reviewed and approved. The in-app browser test surface has no ResizeObserver, so the dashboard component correctly used its no-canvas fallback; this browser limitation is explicitly recorded and does not replace the approved headless Three.js runtime audit.

FailedGates=NONE
