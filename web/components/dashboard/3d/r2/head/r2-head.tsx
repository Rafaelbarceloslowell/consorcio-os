"use client"

export function R2Head() {
  return (
    <group>


      {/* crânio */}
      <mesh
        position={[0,0.35,-0.05]}
        scale={[1.2,1,1]}
      >
        <sphereGeometry args={[0.65,64,64]} />
        <meshStandardMaterial
          color="#214B35"
        />
      </mesh>


      {/* testa */}
      <mesh
        position={[0,0.45,0.35]}
        scale={[0.8,0.65,0.5]}
      >
        <sphereGeometry args={[0.45,64,64]} />
        <meshStandardMaterial
          color="#214B35"
        />
      </mesh>


      {/* mandíbula */}
      <mesh
        position={[0,-0.15,0.25]}
        scale={[0.85,0.45,0.7]}
      >
        <sphereGeometry args={[0.45,64,64]} />
        <meshStandardMaterial
          color="#183C2A"
        />
      </mesh>


      {/* focinho */}
      <mesh
        position={[0,-0.05,0.55]}
        scale={[0.65,0.5,0.45]}
      >
        <sphereGeometry args={[0.35,64,64]} />
        <meshStandardMaterial
          color="#256B46"
        />
      </mesh>


      {/* orelhas */}
      <mesh position={[-0.65,0.35,0]}>
        <sphereGeometry args={[0.16,32,32]} />
        <meshStandardMaterial color="#183C2A" />
      </mesh>


      <mesh position={[0.65,0.35,0]}>
        <sphereGeometry args={[0.16,32,32]} />
        <meshStandardMaterial color="#183C2A" />
      </mesh>


    </group>
  )
}