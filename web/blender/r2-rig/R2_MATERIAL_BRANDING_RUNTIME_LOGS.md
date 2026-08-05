# R2 Material Branding Runtime Logs

## Successful checkpoints

- Source inventory: hashes exact; 65 bones (51 body + 14 facial), 24 morph occurrences, 9 clips, 14 exported materialless meshes.
- Build: 17 final materials, 30 blend meshes, exactly 3 branding objects, 0 source geometry/weight changes.
- Deformation: 9 clips x 3 frames x 2,316 branding vertices; clipping=0, z-fighting=0, floating=0.
- Export: GLB `1F693EBB12E36965786C426CC07AF5FD6775CADFD81542236518103C6541E6AB`; 29 meshes, 37 primitives, 17 materials, 0 images/textures/external dependencies.
- Clean round-trip: materials/branding/65 bones/24 morphs/9 clips preserved.
- Web runtime: 10 states, 100 pairwise transitions, 25 repeated cycles, exact neutral reset, dispose/remount approved, responsive aspects 0.5/0.75/1/2 approved.
- Focused Vitest: 6 files, 32 tests, all passed. TypeScript: passed. Phase lint: passed.

## Recoverable failures and corrections

1. `R2_BUILD_MATERIAL_BRANDING.py` - sleeve ray missed at the curved patch corner. Added bounded nearest-surface fallback and external-normal validation.
2. Same build - curved patch backing produced 35 then 9 zero-area faces. Removed the non-required solid backing; retained one coherent GorillaMark + R2 skinned patch object.
3. Same build - `R2_Head_Face_Foundation` fingerprint changed because Blender conversion inherited a persisted selection. Added explicit deselection before every SVG/text conversion; rerun reported 0 geometry and 0 weight changes.
4. `R2_VALIDATE_MATERIAL_BRANDING.py` - Blender Quaternion has no `xyz` property. Read x/y/z explicitly and reran all clips.
5. Same validator - a different weight serialization falsely reported 27 changes. Aligned the independent fingerprint to the official inventory algorithm; result 0.
6. GLB exporter audit - counted 14 unique morph names instead of 24 distributed occurrences. Corrected the contract metric, deleted only the rejected candidate GLB and re-exported it byte-identically.
7. Clean GLB audit - Blender importer creates an unexported helper `Icosphere`. Restricted the missing-material audit to actual GLB node names; exported primitives remained 0 missing materials.
8. `npx` was blocked by PowerShell execution policy. Used the installed `tsx.cmd` wrapper; no dependency changes.
9. Three.js branding nodes with multiple primitives are groups. Updated the auditor to traverse descendants; exact 2/3/2 material assignments passed.
10. Independent PowerShell audit treated absent `images`/`textures` as arrays containing null. Added null-safe counts; both are 0.
11. Final independent audit initially referenced an undefined candidate-hash variable. Switched it to the approved export report; published hashes match.

## Repository-wide baseline findings

- Full Vitest: 122 files/1,542 tests passed; 2 files/13 tests failed in pre-existing DashboardHeader/DashboardContent expectations. No phase file causes those failures.
- Full lint: 26 errors and 26 warnings in pre-existing client pages, legacy controllers, r2-lab and UI dialog. Phase-scoped lint has 0 errors and 0 warnings.