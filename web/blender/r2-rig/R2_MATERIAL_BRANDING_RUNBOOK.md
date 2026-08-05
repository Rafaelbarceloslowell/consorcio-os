# R2 Material Authoring, Branding and Controlled Re-export Runbook

## Certified inputs

- Immutable blend: `C:\Projetos\consorcio-os\web\blender\r2-rig\r2-full-character-runtime-ready-v1\r2-full-character-runtime-ready-v1.blend` - `3D60D28B852566ABEC764D2DE0EB55D63F42AC26F8F75936109D33898B25E269`.
- Immutable GLB: `C:\Projetos\consorcio-os\web\public\models\r2\r2-full-character-runtime-ready-v1.glb` - `E3B9702C0367A8CAFB138B5C9AB94D6CC448C470CD69D74A46333A9953207A59`.
- Official dashboard logo: `C:\Projetos\consorcio-os\web\public\brand\GorillaMark_Dark.svg` - `7FC4BA6C6B5BEEA9B082CFF751A480D7DF8F8D372984703CF6847E2398B5749E`.
- Certified variant: GorillaMark Dark, loaded by `BrandMarkSlot` for the default dark theme.
- Official green: `#163F35` from `brand/assets/manifest.json`.

## Deterministic construction

The official four SVG paths are imported through Blender's SVG curve importer, triangulated without rasterization, projected onto actual garment faces, extruded into shallow closed relief and weighted by barycentric interpolation from the hit garment faces. Anatomical axes are left `+X`, right `-X`, front `-Y` and back `+Y`.

- Right chest: smallest mark, torso surface, anatomical right.
- Left upper arm: medium GorillaMark plus converted `R2` designation, sleeve surface, anatomical left.
- Upper back: largest mark, centered on the torso back.

All new shaders use one Principled BSDF connected directly to Material Output. Textures, images, procedural nodes, emissive substitution and runtime material overrides are prohibited.

## Validation and rollback

Run `R2_VALIDATE_MATERIAL_BRANDING.py`, `R2_EXPORT_MATERIAL_BRANDING_GLB.py`, `R2_AUDIT_MATERIAL_BRANDING_GLB_ROUNDTRIP.py`, the TypeScript headless validator and the independent PowerShell audit. Publication is permitted only with `FailedGates=NONE`. Runtime rollback is `/models/r2/r2-full-character-runtime-ready-v1.glb`.