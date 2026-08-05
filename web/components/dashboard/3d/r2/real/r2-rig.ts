import * as THREE from "three"

export type R2Rig = {
  head?: THREE.Object3D
  leftEye?: THREE.Object3D
  rightEye?: THREE.Object3D
  jaw?: THREE.Object3D
}


export function findR2Rig(
  scene: THREE.Object3D
): R2Rig {

  const rig: R2Rig = {}


  scene.traverse((object) => {

    const name =
      object.name.toLowerCase()


    if (
      name.includes("head")
    ) {
      rig.head = object
    }


    if (
      name.includes("eye") &&
      name.includes("l")
    ) {
      rig.leftEye = object
    }


    if (
      name.includes("eye") &&
      name.includes("r")
    ) {
      rig.rightEye = object
    }


    if (
      name.includes("jaw") ||
      name.includes("mouth")
    ) {
      rig.jaw = object
    }

  })


  return rig
}