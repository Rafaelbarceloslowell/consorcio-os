import {
  ACESFilmicToneMapping,
  Box3,
  Mesh,
  PerspectiveCamera,
  SRGBColorSpace,
  Vector3,
} from "three"
import type {
  Object3D,
} from "three"

export const R2_CAMERA_FOV = 32
export const R2_MODEL_PRESENTATION_SCALE = 1.14
export const R2_EFFECTIVE_VERTICAL_COVERAGE = 0.72
export const R2_TARGET_VERTICAL_COVERAGE =
  R2_EFFECTIVE_VERTICAL_COVERAGE /
  R2_MODEL_PRESENTATION_SCALE

export const R2_LIGHTING = {
  hemisphere: {
    skyColor: "#e8eee9",
    groundColor: "#07100b",
    intensity: 0.62,
  },
  key: {
    color: "#fff8f0",
    intensity: 2.15,
    position: [3.2, 4.2, 5] as const,
  },
  fill: {
    color: "#c0d0c6",
    intensity: 0.82,
    position: [-4, 1.8, 3] as const,
  },
  rim: {
    color: "#6fa786",
    intensity: 0.9,
    position: [1.5, 3.2, -4] as const,
  },
} as const

export const R2_RENDERER = {
  toneMapping: ACESFilmicToneMapping,
  toneMappingExposure: 1,
  outputColorSpace: SRGBColorSpace,
  shadowsEnabled: false,
} as const

function isEffectivelyVisible(
  object: Object3D,
  root: Object3D,
) {
  let current: Object3D | null = object

  while (current) {
    if (!current.visible) return false
    if (current === root) return true
    current = current.parent
  }

  return false
}

export function computeR2RenderableBounds(
  root: Object3D,
) {
  const bounds = new Box3()
  root.updateMatrixWorld(true)

  root.traverse((object) => {
    if (
      !(object instanceof Mesh) ||
      !isEffectivelyVisible(object, root) ||
      !object.geometry
    ) {
      return
    }

    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material]

    if (materials.every((material) => !material.visible)) {
      return
    }

    if (!object.geometry.boundingBox) {
      object.geometry.computeBoundingBox()
    }

    const geometryBounds =
      object.geometry.boundingBox

    if (!geometryBounds || geometryBounds.isEmpty()) {
      return
    }

    bounds.union(
      geometryBounds
        .clone()
        .applyMatrix4(object.matrixWorld),
    )
  })

  if (bounds.isEmpty()) {
    throw new Error(
      "R2 has no visible renderable geometry to frame.",
    )
  }

  return bounds
}

export type R2CameraFraming = Readonly<{
  target: Vector3
  position: Vector3
  distance: number
  verticalCoverage: number
}>

export function calculateR2CameraFraming(
  bounds: Box3,
  aspect: number,
  fov = R2_CAMERA_FOV,
  targetCoverage =
    R2_TARGET_VERTICAL_COVERAGE,
): R2CameraFraming {
  if (bounds.isEmpty()) {
    throw new Error(
      "Cannot frame an empty R2 bounding box.",
    )
  }

  const safeAspect =
    Number.isFinite(aspect) && aspect > 0
      ? aspect
      : 1
  const safeCoverage = Math.min(
    0.72,
    Math.max(0.6, targetCoverage),
  )
  const verticalTangent = Math.tan(
    (fov * Math.PI) / 360,
  )
  const horizontalTangent =
    verticalTangent * safeAspect
  const size = bounds.getSize(new Vector3())
  const target = bounds.getCenter(new Vector3())
  const halfHeight = size.y / 2
  const halfWidth = size.x / 2
  const halfDepth = size.z / 2
  const distanceFromFront = Math.max(
    halfHeight /
      (verticalTangent * safeCoverage),
    halfWidth /
      (horizontalTangent * safeCoverage),
  )
  const distance =
    distanceFromFront + halfDepth
  const verticalCoverage =
    halfHeight /
    (distanceFromFront * verticalTangent)

  return {
    target,
    position: new Vector3(
      target.x,
      target.y,
      target.z + distance,
    ),
    distance,
    verticalCoverage,
  }
}

export function configureR2Camera(
  camera: PerspectiveCamera,
  bounds: Box3,
  aspect: number,
) {
  const framing =
    calculateR2CameraFraming(
      bounds,
      aspect,
    )

  camera.fov = R2_CAMERA_FOV
  camera.aspect = aspect > 0 ? aspect : 1
  camera.near = 0.1
  camera.far = 100
  camera.position.copy(framing.position)
  camera.lookAt(framing.target)
  camera.updateProjectionMatrix()

  return framing
}
