# R2 Facial Ocular/Oral Authoring Architecture

## Evidence classes

- **Preserved exact:** all existing object transforms, data-blocks, vertex coordinates, vertex order, materials, UVs, attributes, hierarchy and weights outside the authorized oral face-deletion mask.
- **Source-derived:** anatomical axes; eye aperture ownership; eye centers and forward directions; muzzle, nasal and cheek regions; head/neck attachment; preservation and authoring masks.
- **User-authorized design:** restrained symmetric eyeballs, green procedural irises, dark pupils, separate eyelid ribbons, subtle closed lips, oral cavity, neutral teeth, neutral tongue and mandibular references.
- **Locally changed:** only foundation faces selected by the deterministic oral opening ellipse and explicitly recorded by original polygon index. Existing vertices are not moved or reindexed intentionally.

## Ocular construction

- Aperture ownership is determined exclusively by the two closed boundary components whose neighboring faces are entirely `r2_region_id=2`; positive anatomical X is `.L`, negative X is `.R`.
- The aperture center is the mean of its boundary coordinates. Horizontal extent is measured along anatomical left/right and vertical extent along anatomical up.
- Eyeball radius is deterministic: `max(0.010, 1.20 * aperture_half_width)`, with equal bilateral radius set to the larger derived side. Center is aperture center shifted backward by `0.92 * radius`; forward is the certified anatomical-front vector.
- Each eye is a deterministic UV sphere with procedural sclera/iris/pupil material assignment. The eye pivot empty is exactly at its center.
- Upper/lower eyelids are separate deterministic arc ribbons derived from the aperture ellipse, set slightly behind the exterior surface. Their centerline/contact mapping supports independent blink without changing source vertices.
- Socket and blink regions are the aperture boundary plus deterministic adjacency rings recorded as semantic metadata.

## Oral and mandibular construction

- The oral zone is centered within the approved V37 muzzle lineage. Its width is restrained to the lineage width and its height to a narrow closed neutral seam.
- The opening mask uses only original faces inside a deterministic anatomical-coordinate ellipse and only when `r2_region_id=1`. Removed original face indices are the complete authorized topology-change mask.
- Upper/lower lip ribbons are separate, subtle elliptical bands whose contact centerlines coincide in the neutral pose. Corners are shared spatial targets but distinct topology endpoints.
- The oral cavity is a closed dark ellipsoid placed behind the opening. Upper/lower teeth are low-detail rounded blocks without fangs. The tongue is a low-detail flattened ellipsoid entirely inside the cavity.
- Jaw ownership is a broad, smoothly bounded foundation vertex group below the mouth/nasal region. Bilateral pivot references are symmetric about the certified center plane and stored as empties; no source vertex is moved.

## Remaining landmarks and semantics

- Approved lineage attributes own muzzle, eye/brow, nasal and cheek selections.
- Landmarks use topology plus region ownership and deterministic anatomical extrema/centroids. Unique primary indices are enforced per object/mesh identity.
- Ear bases preserve the source exterior and are chosen from head-side attachment zones, not lateral extrema alone.
- The semantic map records vertices, faces, boundaries, centers, axes, symmetry partners, deformation responsibility and limits.

## Preservation and rollback

- Preservation mask: every source polygon not in the recorded oral deletion mask, all source vertex coordinates, all source materials/UVs/attributes/groups, all non-foundation objects and the existing armature hierarchy.
- Rollback: delete the transaction and recopy the immutable source. No rejected blend can become an input.

## Independent gates

The independent auditor reproduces source identity, candidate object/mesh/material manifests, authorized face removals, unchanged source coordinates, absence of out-of-mask changes, landmark indices/fingerprints, eye centers/pivots, ocular fit, neutral lip contact, internal containment, hierarchy, topology, weights, image count and duplicate names. It rejects any undocumented difference.
