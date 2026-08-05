# R2 Head Web and GLB Compatibility Assessment

## Source compatibility

The existing source keeps a conventional armature hierarchy, positive unit transforms, an Armature modifier relationship, deterministic object names, and the approved `neck -> head` chain. These existing elements remain suitable foundations for a future GLB pipeline.

## Expression compatibility verdict

No facial system exists to assess or export: there are zero facial bones, shape keys, drivers, eye objects, and oral-cavity objects. A temporary GLB was not exported because it could only reproduce the unchanged foundation and would provide no evidence for mandatory expression-channel compatibility.

Future export must keep morph names unique, avoid relying on Blender drivers at runtime, explicitly bake supported animation/morph channels, preserve four-influence skinning policy, and verify morph/skin/hierarchy round-trip in Three.js. Eye aiming should be represented through exportable bone or animation transforms; Blender-only constraint/driver logic must be baked or reimplemented at runtime.

- TechnicalVerdict: `REPROVADO` for the requested facial system
- TemporaryGLBFilesCreated: `0`
- TemporaryGLBFilesRemaining: `0`
- CreatedImages: `0`
