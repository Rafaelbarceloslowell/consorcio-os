# R2 State Animation Orchestration V1 — Discovery

## Official inputs

- Blend: `r2-full-character-color-readable-ready-v2.blend`, SHA-256 `2EEC504BFC6F3C0D0B1BF6B1EFA932445142DCB61527E94A64F9C4A3A5EE491D`.
- GLB: `r2-full-character-color-readable-ready-v2.glb`, SHA-256 `0D960B9E263F17B6B03C52F855B7D5606AE2822524A1DB4EA38FB5552D8696DE`.
- Runtime path: `/models/r2/r2-full-character-color-readable-ready-v2.glb`.
- Both inputs matched before implementation and were treated as read-only.

## Real runtime path

`GorilaR23D` owns the React Three Fiber `Canvas`, renders `R2FullCharacterModel`, loads the official V2 with `useGLTF`, creates an owned skeleton/material/geometry clone, constructs one `R2FullCharacterRuntimeController`, and advances it from `useFrame`. `R2RuntimeCommandAdapter` connects the pre-existing GorillaOS event orchestration to the controller. There was no need for a parallel implementation.

## Canonical states

`neutral`, `idle`, `working`, `listening`, `thinking`, `awaiting_action`, `alert`, `speaking`, `celebrating_sale`, `error_attention`.

## Exact GLB clips

| Clip | Seconds | Tracks | Affected bones | Morph tracks | Net root motion | Foot drift |
|---|---:|---:|---:|---:|---|---|
| R2_NEUTRAL | 1.0 | 195 | 65 | 0 | no | no |
| R2_IDLE | 4.0 | 195 | 65 | 0 | no | no |
| R2_WORKING | 2.400000095 | 195 | 65 | 0 | no | no |
| R2_LISTENING | 3.0 | 195 | 65 | 0 | no | no |
| R2_THINKING | 3.0 | 195 | 65 | 0 | no | no |
| R2_AWAITING_ACTION | 2.5 | 195 | 65 | 0 | no | no |
| R2_ALERT | 1.200000048 | 195 | 65 | 0 | no | no |
| R2_CELEBRATING_SALE | 2.400000095 | 195 | 65 | 0 | no | no |
| R2_ERROR_ATTENTION | 2.0 | 195 | 65 | 0 | no | no |

All clips are in-place, first/last-continuous, and technically loopable. The orchestration deliberately treats celebration and error-attention as semantic one-shots without editing the clips.

## Morph targets (24 occurrences)

- `R2_Head_Face_Foundation`: `EXP_BROW_RAISE`, `EXP_BROW_FROWN`, `EXP_CHEEK_RAISE`, `EXP_MUZZLE`.
- `R2_LipUpper`: `EXP_LIPS_CLOSED`, `EXP_SMILE`, `EXP_FROWN`, `EXP_MOUTH_NARROW`, `EXP_MOUTH_WIDE`, `EXP_MOUTH_O`, `EXP_MOUTH_E`.
- `R2_LipLower`: the same seven plus `EXP_VISEME_FV`.
- `R2_Tongue`: `EXP_VISEME_L`.
- `R2_UpperEyelid.L`, `R2_UpperEyelid.R`, `R2_LowerEyelid.L`, `R2_LowerEyelid.R`: `EXP_BLINK` on each.

## Baseline gap

The original controller already cached nine actions and owned one mixer, facial clamping, neutral reset, and disposal. It restarted repeated states and lacked explicit playback mode, speed, fade-in/out, minimum/maximum duration, priority, cooldown, return state, one-shot completion, request generation, pending requests, reduced motion, diagnostics, and bounded-action stress evidence. The command adapter also called `resetNeutral()` before every command, preventing real crossfades.

## Browser baseline

Edge and Chrome were not connected. The available Codex browser had no `ResizeObserver`, so the existing intentional fallback prevented the R2 canvas from mounting. No product polyfill was added.
