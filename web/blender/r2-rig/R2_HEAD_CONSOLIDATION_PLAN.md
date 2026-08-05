# R2 Head Consolidation Plan

## Decision

Use `SEMANTIC_CONSOLIDATION_WITH_IDENTITY_MAPPING_AND_ADDITIVE_ROLE_METADATA`. The source already has deterministic canonical names, one mesh datablock per object, zero materials, zero orphan data, zero `.001` collisions, identity transforms, and a valid one-Armature-modifier hierarchy. No join, deletion, rename, topology operation, modifier application, reparenting, or weight repair is authorized.

## Head classifications

| Source | Action | Output | Reason | Risk |
|---|---|---|---|---|
| `R2_Head_Face_Foundation` | `KEEP_SEPARATE` | identity | Active retopologized facial surface | Low |
| `R2_Head_Fur` | `KEEP_SEPARATE` | identity | Fourteen fur components with separate semantic ownership | Low |
| `R2_Head_Face` | `PRESERVE_REFERENCE` | identity | Hidden historical/reference topology | Low |
| `R2_Rig` | `PRESERVE_REFERENCE` | identity | Existing body armature used by all meshes | Low |

The remaining 12 mesh objects are `EXCLUDE_FROM_HEAD` and must remain byte-semantically unchanged inside the scene.

## Canonical mappings

- Objects: identity mapping for `R2_Head_Face_Foundation`, `R2_Head_Fur`, `R2_Head_Face`, and `R2_Rig`.
- Mesh datablocks: identity mapping for the corresponding three head meshes.
- Materials: empty mapping because the source contains no materials.
- Vertex groups: identity mapping for every existing group; the active foundation remains exactly `neck` and `head`.
- Modifiers and parents: identity mapping, preserving the single Armature modifier to `R2_Rig`.

## Only authorized changes

Add phase/status/source/plan identity properties to `R2_Master_v35`, and additive role properties to the three head objects plus `R2_Rig`. Existing custom properties must remain exact. This metadata makes the semantic consolidation deterministic and auditable without changing geometry or rig behavior.

## Rollback and gates

Rollback is deletion of the transactional candidate. Publication is forbidden unless geometry, normals, weights, materials, UV maps, face attributes, vertex groups, existing custom properties, hierarchy, bones, modifiers, visibility, object/data names, and scene structure compare exactly, with only the declared metadata additions allowed.

