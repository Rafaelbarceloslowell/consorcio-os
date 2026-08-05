# R2 Color Readability V2 - Runtime and correction log

1. Initial diagnosis: fur #171B1D/#242A2D, hoodie #111416 and pants #272C2F collapsed into a near-black mass. The R2 designation used #163F35 over the dark sleeve.
2. Rejected build: a 15% patch enlargement plus forward shift generated 91 zero-area faces on the curved sleeve projection. No Blend was saved. The correction retained the approved center, used +10% for the patch and +18% for the R2 glyphs.
3. Rejected visual iteration: brighter colors exposed two disconnected low components historically stored in R2_Hoodie_Torso. Their geometry and weights remained untouched; only their material assignment changed to R2_Mat_Pants_Charcoal.
4. Test correction: GLB float32 roughness and a 3e-16 framing boundary required numeric-tolerance assertions. Production behavior was unchanged.
5. Runtime-auditor correction: R2_Hoodie_Torso became an intentional two-primitive node. The auditor was updated to traverse grouped primitives instead of assuming one Mesh.
6. Browser limitation: the in-app browser surface exposed no ResizeObserver, so the production component correctly used its no-canvas fallback. Console errors were zero. Visual runtime evidence is supplied by the dashboard-equivalent controlled render and the headless Three.js audit.
