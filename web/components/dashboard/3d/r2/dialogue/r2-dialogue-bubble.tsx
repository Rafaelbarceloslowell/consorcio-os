"use client"

type R2DialogueBubbleProps = {
  message?: string
}


export function R2DialogueBubble({
  message,
}: R2DialogueBubbleProps) {

  if (!message) return null


  return (
    <group
      position={[0,2,0]}
    >

      <mesh>
        <planeGeometry
          args={[2,0.6]}
        />

        <meshStandardMaterial
          color="#10251B"
          transparent
          opacity={0.85}
        />

      </mesh>

    </group>
  )
}