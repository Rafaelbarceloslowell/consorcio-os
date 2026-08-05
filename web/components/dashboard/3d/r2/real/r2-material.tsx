"use client"

import * as THREE from "three"

export function setupR2Materials(
  scene: THREE.Object3D
) {

  scene.traverse((object) => {

    if (
      object instanceof THREE.Mesh
    ) {

      object.castShadow = true
      object.receiveShadow = true

      if (
        object.material instanceof THREE.MeshStandardMaterial
      ) {

        object.material.roughness = 0.8
        object.material.metalness = 0.05

      }

    }

  })

}