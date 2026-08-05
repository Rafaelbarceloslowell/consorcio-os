// @vitest-environment jsdom
/// <reference types="vitest/globals" />

import { StrictMode } from "react"
import { render, waitFor } from "@testing-library/react"
import {
  AnimationClip,
  Bone,
  BoxGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PerspectiveCamera,
} from "three"

import { R2_ANIMATION_CLIPS } from "@/types/r2-full-character-runtime"
import type { R2RuntimeCommand } from "@/types/r2-intelligence-orchestration"

const mocks = vi.hoisted(() => ({
  gltf: null as null | {
    scene: Group
    animations: AnimationClip[]
  },
  frame: null as null | ((state: unknown, delta: number) => void),
  preload: vi.fn(),
  camera: null as PerspectiveCamera | null,
  size: {
    width: 256,
    height: 256,
  },
}))

vi.mock("@react-three/drei", () => ({
  useGLTF: Object.assign(
    () => mocks.gltf,
    { preload: mocks.preload },
  ),
}))

vi.mock("@react-three/fiber", () => ({
  useFrame: (callback: (state: unknown, delta: number) => void) => {
    mocks.frame = callback
  },
  useThree: (
    selector: (state: {
      camera: PerspectiveCamera | null
      size: { width: number; height: number }
    }) => unknown,
  ) => selector({
    camera: mocks.camera,
    size: mocks.size,
  }),
}))

import { R2FullCharacterModel } from "./r2-full-character-model"
import { R2FullCharacterRuntimeController } from "./r2-full-character-runtime"

const MORPHS_BY_OBJECT = {
  "R2_Head_Face_Foundation": ["EXP_BROW_RAISE", "EXP_BROW_FROWN", "EXP_CHEEK_RAISE", "EXP_MUZZLE"],
  "R2_UpperEyelid.L": ["EXP_BLINK"],
  "R2_LowerEyelid.L": ["EXP_BLINK"],
  "R2_UpperEyelid.R": ["EXP_BLINK"],
  "R2_LowerEyelid.R": ["EXP_BLINK"],
  R2_LipUpper: ["EXP_LIPS_CLOSED", "EXP_SMILE", "EXP_FROWN", "EXP_MOUTH_NARROW", "EXP_MOUTH_WIDE", "EXP_MOUTH_O", "EXP_MOUTH_E"],
  R2_LipLower: ["EXP_LIPS_CLOSED", "EXP_SMILE", "EXP_FROWN", "EXP_MOUTH_NARROW", "EXP_MOUTH_WIDE", "EXP_MOUTH_O", "EXP_MOUTH_E", "EXP_VISEME_FV"],
  R2_Tongue: ["EXP_VISEME_L"],
} as const

function fixture() {
  const scene = new Group()
  const rig = new Object3D()
  rig.name = "R2_Rig"
  scene.add(rig)

  for (const name of ["neck", "head", "CTRL-face-root", "DEF-face-jaw"]) {
    const bone = new Bone()
    bone.name = name
    rig.add(bone)
  }

  for (const name of ["R2_EyePivot.L", "R2_EyePivot.R", "R2_JawDriver"]) {
    const node = new Object3D()
    node.name = name
    scene.add(node)
  }

  for (const [name, morphs] of Object.entries(MORPHS_BY_OBJECT)) {
    const mesh = new Mesh(new BoxGeometry(), new MeshBasicMaterial())
    mesh.name = name
    mesh.morphTargetDictionary = Object.fromEntries(
      morphs.map((morph, index) => [morph, index]),
    )
    mesh.morphTargetInfluences = morphs.map(() => 0)
    scene.add(mesh)
  }

  return {
    scene,
    animations: R2_ANIMATION_CLIPS.map(
      (name) => new AnimationClip(name, 1, []),
    ),
  }
}

describe("R2FullCharacterModel lifecycle", () => {
  it("frames the loaded model and responds to container resize", async () => {
    mocks.gltf = fixture()
    mocks.camera = new PerspectiveCamera()
    mocks.size = {
      width: 256,
      height: 256,
    }
    const projectionUpdate = vi.spyOn(
      mocks.camera,
      "updateProjectionMatrix",
    )
    const ready = vi.fn()
    const view = render(
      <R2FullCharacterModel
        autoFrame
        onControllerReady={ready}
      />,
    )

    await waitFor(() => {
      expect(projectionUpdate).toHaveBeenCalled()
    })

    expect(mocks.camera.fov).toBe(32)
    expect(mocks.camera.position.x).toBeCloseTo(0)
    expect(mocks.camera.position.y).toBeCloseTo(0)
    const squareDistance =
      mocks.camera.position.z

    mocks.size = {
      width: 128,
      height: 256,
    }
    view.rerender(
      <R2FullCharacterModel
        autoFrame
        onControllerReady={ready}
      />,
    )

    await waitFor(() => {
      expect(
        mocks.camera!.position.z,
      ).toBeGreaterThan(squareDistance)
    })

    expect(mocks.camera.aspect).toBe(0.5)
    view.unmount()
  })

  it("owns distinct Strict Mode resources and disposes every mount", async () => {
    mocks.gltf = fixture()
    const ready = vi.fn()
    const loadState = vi.fn()
    const dispose = vi.spyOn(
      R2FullCharacterRuntimeController.prototype,
      "dispose",
    )

    const first = render(
      <StrictMode>
        <R2FullCharacterModel
          behavior={{ mood: "thinking", animation: "thinking", message: "" }}
          onControllerReady={ready}
          onLoadStateChange={loadState}
        />
      </StrictMode>,
    )

    await waitFor(() => expect(ready).toHaveBeenCalledTimes(2))
    expect(dispose).toHaveBeenCalledTimes(1)
    expect(ready.mock.calls[0][0]).not.toBe(ready.mock.calls[1][0])
    expect(ready.mock.calls[1][0].state).toBe("thinking")
    expect(mocks.frame).not.toBeNull()
    mocks.frame?.({}, 1 / 60)

    first.unmount()
    expect(dispose).toHaveBeenCalledTimes(2)

    const second = render(
      <StrictMode>
        <R2FullCharacterModel onControllerReady={ready} />
      </StrictMode>,
    )
    await waitFor(() => expect(ready).toHaveBeenCalledTimes(4))
    second.unmount()
    expect(dispose).toHaveBeenCalledTimes(4)
    expect(loadState).toHaveBeenCalledWith({ status: "ready" })
  })

  it("gives typed runtime commands precedence and reports adapter receipts", async () => {
    mocks.gltf = fixture()
    const ready = vi.fn()
    const receipt = vi.fn()
    const baseCommand: R2RuntimeCommand = {
      commandId: "model-command-1",
      eventId: "model-event-1",
      workspaceId: "workspace-a",
      runtimeState: "awaiting_action",
      expression: "BROW_RAISE",
      expressionIntensity: 0.2,
      durationMs: 60_000,
      minimumDisplayMs: 1000,
      transitionMs: 250,
      priority: "ATTENTION",
      message: "Revisar ação",
      actionLabel: "Revisar",
      actionId: "review",
      expiresAt: null,
      fallbackState: "idle",
      requiresConfirmation: true,
    }
    const view = render(
      <R2FullCharacterModel
        behavior={{ mood: "success", animation: "celebrating", message: "legacy" }}
        runtimeWorkspaceId="workspace-a"
        runtimeCommand={baseCommand}
        onRuntimeReceipt={receipt}
        onControllerReady={ready}
      />,
    )
    await waitFor(() => expect(receipt).toHaveBeenCalledWith(
      expect.objectContaining({ status: "APPLIED", commandId: "model-command-1" }),
    ))
    expect(ready.mock.calls[0][0].state).toBe("awaiting_action")

    view.rerender(
      <R2FullCharacterModel
        runtimeWorkspaceId="workspace-a"
        runtimeCommand={{
          ...baseCommand,
          commandId: "model-command-2",
          eventId: "model-event-2",
          runtimeState: "alert",
          priority: "HIGH",
          requiresConfirmation: false,
        }}
        onRuntimeReceipt={receipt}
        onControllerReady={ready}
      />,
    )
    await waitFor(() => expect(receipt).toHaveBeenCalledWith(
      expect.objectContaining({ status: "APPLIED", commandId: "model-command-2" }),
    ))
    expect(ready.mock.calls[0][0].state).toBe("alert")
    view.unmount()
  })
})
