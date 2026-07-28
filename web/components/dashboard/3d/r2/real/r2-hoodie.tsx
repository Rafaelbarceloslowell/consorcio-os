"use client"

export function R2Hoodie() {
  return (
    <group>

      {/* corpo do moletom */}
      <mesh
        position={[0,0,0]}
        scale={[1.15,1.25,0.95]}
      >
        <sphereGeometry args={[0.8,64,64]} />

        <meshStandardMaterial
          color="#556B2F"
          roughness={1}
        />

      </mesh>


      {/* logo GorilaOS */}
      <mesh
        position={[0,0.15,0.72]}
      >

        <sphereGeometry
          args={[0.12,32,32]}
        />

        <meshStandardMaterial
          color="#2F8F5B"
          emissive="#2F8F5B"
          emissiveIntensity={2}
        />

      </mesh>

    </group>
  )
}