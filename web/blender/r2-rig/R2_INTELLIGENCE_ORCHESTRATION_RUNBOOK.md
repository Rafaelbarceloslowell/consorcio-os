# GorillaOS R2 Intelligence and Event Orchestration Runbook

## Immutable runtime inputs

- Official GLB: `C:\Projetos\consorcio-os\web\public\models\r2\r2-full-character-runtime-ready-v1.glb`
- Required SHA-256: `E3B9702C0367A8CAFB138B5C9AB94D6CC448C470CD69D74A46333A9953207A59`
- Official blend: `C:\Projetos\consorcio-os\web\blender\r2-rig\r2-full-character-runtime-ready-v1\r2-full-character-runtime-ready-v1.blend`
- Required SHA-256: `3D60D28B852566ABEC764D2DE0EB55D63F42AC26F8F75936109D33898B25E269`

The phase may read but never alter these assets. The existing typed full-character controller remains the sole owner of Three.js loading, `AnimationMixer`, action cache, morph bindings, exact neutral reset and disposal.

## Repository architecture discovered

The project has no standalone `domain` directory. Approved commercial domain contracts live under `types/domain`; application use cases live under `application`; deterministic decision/workflow/automation engines live under `engine/decision`; repository ports live under `repositories`; the active R2 runtime lives under `components/dashboard/3d/r2`.

Existing `CommercialEvent` is the authoritative event source for commercial facts. The R2 canonical event is a presentation-oriented normalized envelope and does not replace or persist over the commercial event.

## Checkpoints

1. Read-only inventory, Git baseline and immutable-asset certification.
2. Canonical contracts, event catalog, intelligence port, policies and event-to-runtime map.
3. Functional vertical flows from real commercial events through presentation commands.
4. Complete deterministic queue, priority, interruption, cooldown, idempotency, expiry, receipt and fallback orchestration.
5. Local structured intelligence implementation with no network.
6. Runtime adapter and dashboard lifecycle bridge without business rules in React/Three.js.
7. Priority, interruption, isolation, failure and cleanup tests.
8. Focused/application/runtime tests, TypeScript, lint and feasible broader suite.
9. Programmatic GLB plus orchestration/runtime headless validation.
10. Independent source, boundary, isolation, idempotency, scope and asset audit.
11. Report publication, post-publication revalidation and temporary cleanup.

## State strategy

Orchestration state is in-memory and scoped to one workspace-owned provider/store. It is reconstructed from canonical events and is not persisted as animation state. Business repositories remain authoritative. Presentation commands cannot mutate commercial data.

## Failure handling

Every recoverable failure is recorded with checkpoint, command, exact cause and correction. Official assets are rehashed after affected checkpoints. No gate is weakened. No external provider, network call, image, staging, commit or push is part of the phase.
