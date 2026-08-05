/// <reference types="vitest/globals" />

import {
  createHash,
} from "node:crypto"
import {
  readFileSync,
} from "node:fs"
import {
  resolve,
} from "node:path"
import {
  Box3,
  BoxGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  Vector3,
} from "three"
import {
  GLTFLoader,
} from "three/examples/jsm/loaders/GLTFLoader.js"

import {
  R2_CAMERA_FOV,
  R2_EFFECTIVE_VERTICAL_COVERAGE,
  R2_LIGHTING,
  R2_MODEL_PRESENTATION_SCALE,
  R2_RENDERER,
  R2_TARGET_VERTICAL_COVERAGE,
  calculateR2CameraFraming,
  computeR2RenderableBounds,
  configureR2Camera,
} from "./r2-character-presentation"

describe("R2 character presentation", () => {
  it("loads and frames the approved V2 GLB without mutating materials", async () => {
    const glb = readFileSync(
      resolve(
        process.cwd(),
        "public/models/r2/r2-full-character-color-readable-ready-v2.glb",
      ),
    )
    const hash = createHash("sha256")
      .update(glb)
      .digest("hex")
      .toUpperCase()
    const arrayBuffer = glb.buffer.slice(
      glb.byteOffset,
      glb.byteOffset + glb.byteLength,
    ) as ArrayBuffer
    const loaded = await new GLTFLoader()
      .parseAsync(arrayBuffer, "")
    const materialState = () => {
      const state: Array<{
        name: string
        type: string
        color: number | null
        metalness: number | null
        roughness: number | null
      }> = []

      loaded.scene.traverse((object) => {
        if (!(object instanceof Mesh)) return
        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material]

        for (const material of materials) {
          state.push({
            name: material.name,
            type: material.type,
            color:
              material instanceof MeshStandardMaterial
                ? material.color.getHex()
                : null,
            metalness:
              material instanceof MeshStandardMaterial
                ? material.metalness
                : null,
            roughness:
              material instanceof MeshStandardMaterial
                ? material.roughness
                : null,
          })
        }
      })

      return state
    }
    const before = materialState()
    const bounds =
      computeR2RenderableBounds(
        loaded.scene,
      )
    const framing =
      calculateR2CameraFraming(
        bounds,
        1,
      )

    expect(hash).toBe(
      "0D960B9E263F17B6B03C52F855B7D5606AE2822524A1DB4EA38FB5552D8696DE",
    )
    expect(before).toHaveLength(37)
    expect(before.every((material) =>
      material.color !== null &&
      material.color > 0,
    )).toBe(true)
    expect(materialState()).toEqual(before)
    expect(
      bounds.getSize(new Vector3()).y,
    ).toBeCloseTo(2)
    expect(framing.verticalCoverage).toBeCloseTo(
      R2_TARGET_VERTICAL_COVERAGE,
    )
    expect(
      framing.verticalCoverage *
        R2_MODEL_PRESENTATION_SCALE,
    ).toBeCloseTo(
      R2_EFFECTIVE_VERTICAL_COVERAGE,
    )

    const byName = new Map(
      before.map((material) => [
        material.name,
        material,
      ]),
    )
    const expectedMaterials = [
      ["R2_Mat_Fur_DarkGraphite", 0x2d312e, 0.8],
      ["R2_Mat_Hoodie_Black", 0x4f5c3a, 0.82],
      ["R2_Mat_Pants_Charcoal", 0x363a3e, 0.78],
      ["R2_Mat_Shoes_Black", 0x141718, 0.54],
    ] as const
    for (const [name, color, roughness] of expectedMaterials) {
      const material = byName.get(name)
      expect(material).toMatchObject({
        color,
        metalness: 0,
      })
      expect(material?.roughness).toBeCloseTo(
        roughness,
        6,
      )
    }
  })

  it("uses only visible renderable geometry for the character bounds", () => {
    const root = new Group()
    const body = new Mesh(
      new BoxGeometry(1, 2, 0.6),
      new MeshStandardMaterial(),
    )
    const hidden = new Mesh(
      new BoxGeometry(100, 100, 100),
      new MeshStandardMaterial(),
    )
    hidden.visible = false

    const helper = new Object3D()
    helper.position.set(500, 500, 500)

    root.add(body, hidden, helper)

    const bounds =
      computeR2RenderableBounds(root)

    const size =
      bounds.getSize(new Vector3())
    expect(size.x).toBeCloseTo(1)
    expect(size.y).toBeCloseTo(2)
    expect(size.z).toBeCloseTo(0.6)
    expect(
      bounds.getCenter(new Vector3()).toArray(),
    ).toEqual([0, 0, 0])
  })

  it.each([
    0.5,
    0.75,
    1,
    2,
  ])("keeps the full character centered at responsive aspect %s", (aspect) => {
    const bounds = new Box3(
      new Vector3(-0.533, -1, -0.306),
      new Vector3(0.533, 1, 0.31),
    )
    const framing =
      calculateR2CameraFraming(
        bounds,
        aspect,
      )

    expect(framing.target.x).toBeCloseTo(0)
    expect(framing.target.y).toBeCloseTo(0)
    const effectiveCoverage =
      framing.verticalCoverage *
      R2_MODEL_PRESENTATION_SCALE
    expect(effectiveCoverage).toBeGreaterThanOrEqual(0.67)
    expect(effectiveCoverage).toBeLessThanOrEqual(
      R2_EFFECTIVE_VERTICAL_COVERAGE,
    )

    const size = bounds.getSize(new Vector3())
    const frontDistance =
      framing.distance - size.z / 2
    const verticalHalfView =
      frontDistance *
      Math.tan((R2_CAMERA_FOV * Math.PI) / 360)
    const horizontalHalfView =
      verticalHalfView * aspect

    expect(
      size.y / 2 *
        R2_MODEL_PRESENTATION_SCALE,
    ).toBeLessThanOrEqual(
      verticalHalfView *
        R2_EFFECTIVE_VERTICAL_COVERAGE +
        Number.EPSILON * 4,
    )
    expect(
      size.x / 2 *
        R2_MODEL_PRESENTATION_SCALE,
    ).toBeLessThanOrEqual(
      horizontalHalfView *
        R2_EFFECTIVE_VERTICAL_COVERAGE +
        Number.EPSILON * 4,
    )
  })

  it("reconfigures camera distance after a container resize", () => {
    const bounds = new Box3(
      new Vector3(-0.533, -1, -0.306),
      new Vector3(0.533, 1, 0.31),
    )
    const camera = new PerspectiveCamera()
    const updateProjectionMatrix = vi.spyOn(
      camera,
      "updateProjectionMatrix",
    )

    const square = configureR2Camera(
      camera,
      bounds,
      1,
    )
    const narrow = configureR2Camera(
      camera,
      bounds,
      0.5,
    )

    expect(narrow.distance).toBeGreaterThan(square.distance)
    expect(camera.aspect).toBe(0.5)
    expect(camera.fov).toBe(R2_CAMERA_FOV)
    expect(updateProjectionMatrix).toHaveBeenCalledTimes(2)
  })

  it("defines deterministic lighting and renderer output", () => {
    expect(R2_LIGHTING).toEqual({
      hemisphere: {
        skyColor: "#e8eee9",
        groundColor: "#07100b",
        intensity: 0.62,
      },
      key: {
        color: "#fff8f0",
        intensity: 2.15,
        position: [3.2, 4.2, 5],
      },
      fill: {
        color: "#c0d0c6",
        intensity: 0.82,
        position: [-4, 1.8, 3],
      },
      rim: {
        color: "#6fa786",
        intensity: 0.9,
        position: [1.5, 3.2, -4],
      },
    })
    expect(R2_RENDERER.toneMappingExposure).toBe(1)
    expect(R2_RENDERER.shadowsEnabled).toBe(false)
  })
})
