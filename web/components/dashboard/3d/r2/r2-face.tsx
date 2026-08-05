"use client"

import type { R2Behavior } from "../r2-behavior"

type R2FaceProps = {
  behavior?: R2Behavior
}

export function R2Face({
  behavior,
}: R2FaceProps) {

  const mood =
    behavior?.mood ?? "welcome"


  const leftBrow =
    mood === "alert"
      ? -0.35
      : mood === "thinking"
      ? -0.1
      : -0.2


  const rightBrow =
    mood === "alert"
      ? 0.35
      : mood === "thinking"
      ? 0.25
      : 0.2


  return (
    <group>


      {/* olhos neutros */}
      <mesh position={[-0.18,0,0.45]}>
        <sphereGeometry args={[0.08,32,32]} />
        <meshStandardMaterial
          color="#FFFFFF"
          emissive="#FFFFFF"
        />
      </mesh>


      <mesh position={[0.18,0,0.45]}>
        <sphereGeometry args={[0.08,32,32]} />
        <meshStandardMaterial
          color="#FFFFFF"
          emissive="#FFFFFF"
        />
      </mesh>



      {/* sobrancelha esquerda */}
      <mesh
        position={[-0.18,0.16,0.43]}
        rotation={[0,0,leftBrow]}
      >
        <boxGeometry args={[0.25,0.04,0.04]} />
        <meshStandardMaterial
          color="#183C2A"
        />
      </mesh>



      {/* sobrancelha direita */}
      <mesh
        position={[0.18,0.16,0.43]}
        rotation={[0,0,rightBrow]}
      >
        <boxGeometry args={[0.25,0.04,0.04]} />
        <meshStandardMaterial
          color="#183C2A"
        />
      </mesh>



      {/* focinho */}
      <mesh position={[0,-0.12,0.48]}>
        <sphereGeometry args={[0.18,32,32]} />
        <meshStandardMaterial
          color="#256B46"
        />
      </mesh>


    </group>
  )
}