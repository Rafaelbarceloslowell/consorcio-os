# R2 Head Read-Only Inventory

## Runtime result

- `ExecutionStatus=COMPLETED`
- `TechnicalVerdict=APROVADO`
- `SourceV57SHA256=63F7F71988B171A37DF9A09EC8F957729DEF6D35E2D0C093A73577702F892752`
- `BlendSaved=False`
- `ImagesCreated=0`
- `V57Unchanged=True`
- Blender 4.5.10 LTS

The complete machine-readable inventory is in `R2_HEAD_READ_ONLY_INVENTORY.json` (SHA-256 `5381A26B8AA549E5745841E5F0C38A76DC2324C62E99B819FD39D28C64B81447`). It records every scene, collection, object, mesh, armature, bone, modifier, constraint, material, vertex group, custom property, hierarchy relation, transform, data-block user count, linked/orphan status, shape key, UV map, color/face attribute, material slot, and topology/weight metric.

## Scene structure

- Scenes: 1 (`R2_Master_v35`)
- Collections: 8
- Objects: 16
- Mesh objects: 15
- Armatures: 1 (`R2_Rig`, 51 bones total)
- Materials: 0
- Images: 0
- Actions: 0
- Linked data-blocks: 0
- Orphaned objects, meshes, armatures, materials, images, actions, collections, curves, cameras, lights, node groups, and shape keys: 0
- Potential `.001` name collisions: 0

## Head assets discovered

| Object | Role | Vertices | Faces | Islands | Boundary | Wire | Invalid non-manifold | Zero area | Unweighted |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `R2_Head_Face_Foundation` | Active retopologized deformable head surface | 3,654 | 6,847 | 1 | 343 | 0 | 0 | 0 | 0 |
| `R2_Head_Fur` | Semantic fur/neck layer | 18,673 | 35,015 | 14 | 2,531 | 0 | 0 | 0 | 0 |
| `R2_Head_Face` | Hidden historical/reference surface | 3,697 | 7,086 | 1 | 354 | 0 | 0 | 0 | 0 |

All three meshes are parented to `R2_Rig` and have one Armature modifier targeting it. The foundation uses vertex groups `neck` and `head`; the reference and fur meshes retain the full existing body group set. No head mesh has UV maps, color attributes, materials, or shape keys. The foundation preserves five FACE-domain attributes: `r2_region_id`, `r2_v38_source_face_index`, `r2_v39_source_face_index`, `r2_v40_cheek_patch`, and `r2_v40_cheek_side`.

Exact coordinate coincidences exist in the source (foundation 23 groups, reference 26, fur 742). They are not connected by zero-length edges, do not create zero-area faces, wire edges, invalid non-manifold edges, loose vertices, or additional unexpected islands. They are retained and classified as source interface/seam coordinates, not unsafe duplicates.

## Rig and hierarchy findings

`R2_Rig` is at identity transform, uses rotation mode `XYZ`, and contains the existing body hierarchy from `root` through pelvis, spine, chest, neck, head, limbs, hands, fingers, feet, and toes. It has no facial bones or controls. Every mesh is parented to this armature and all object transforms are identity with positive unit scale. Modifier order is deterministic and contains a single Armature modifier per mesh. No final animation or expression data is present.

## Consolidation conclusion

The active foundation, fur layer, hidden historical surface, and armature have distinct topology, semantic ownership, visibility, and deformation purposes. Joining or deleting them would be unsafe and is not justified by the source. The correct consolidation is semantic: preserve object/data names and separation, formalize canonical roles with additive metadata, and publish an independently audited rig-ready foundation without geometry, weight, material, attribute, hierarchy, or modifier changes.

