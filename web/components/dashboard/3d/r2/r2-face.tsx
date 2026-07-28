"use client"

import type { R2Behavior } from "../r2-behavior"

type R2FaceProps = {
  behavior?: R2Behavior
}

function getEyeColor(
  mood?: R2Behavior["mood"]
) {
  switch (mood) {
    case "alert":
      return "#FF4B4B"

    case "thinking":
      return "#FFD166"

    case "success":
      return "#3FB980"

    default:
      return "#FFFFFF"
  }
}

export function R2Face({
  behavior,
}: R2FaceProps) {

  const eyeColor =
    getEyeColor(
      behavior?.mood
    )

  return (
    <group>

      {/* olhos */}
      <mesh position={[-0.18,0,0.45]}>
        <sphereGeometry args={[0.08,32,32]} />
        <meshStandardMaterial
          color={eyeColor}
          emissive={eyeColor}
        />
      </mesh>

      <mesh position={[0.18,0,0.45]}>
        <sphereGeometry args={[0.08,32,32]} />
        <meshStandardMaterial
          color={eyeColor}
          emissive={eyeColor}
        />
      </mesh>


      {/* sobrancelhas */}
      <mesh
        position={[-0.18,0.16,0.43]}
        rotation={[0,0,-0.2]}
      >
        <boxGeometry args={[0.25,0.04,0.04]} />
        <meshStandardMaterial color="#183C2A" />
      </mesh>


      <mesh
        position={[0.18,0.16,0.43]}
        rotation={[0,0,0.2]}
      >
        <boxGeometry args={[0.25,0.04,0.04]} />
        <meshStandardMaterial color="#183C2A" />
      </mesh>


      {/* focinho */}
      <mesh position={[0,-0.12,0.48]}>
        <sphereGeometry args={[0.18,32,32]} />
        <meshStandardMaterial color="#256B46" />
      </mesh>

    </group>
  )
}