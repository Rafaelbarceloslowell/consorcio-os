"use client"

export function R2Neck() {
  return (
    <group>

      {/* pescoço */}
      <mesh
        position={[0,0.9,0]}
        scale={[0.65,0.5,0.65]}
      >
        <sphereGeometry args={[0.45,32,32]} />
        <meshStandardMaterial
          color="#183C2A"
        />
      </mesh>


      {/* trapézio esquerdo */}
      <mesh
        position={[-0.45,0.75,0]}
        scale={[0.7,0.35,0.7]}
      >
        <sphereGeometry args={[0.45,32,32]} />
        <meshStandardMaterial
          color="#214B35"
        />
      </mesh>


      {/* trapézio direito */}
      <mesh
        position={[0.45,0.75,0]}
        scale={[0.7,0.35,0.7]}
      >
        <sphereGeometry args={[0.45,32,32]} />
        <meshStandardMaterial
          color="#214B35"
        />
      </mesh>

    </group>
  )
}