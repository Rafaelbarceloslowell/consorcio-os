"use client"

export function R2Body() {
  return (
    <group>

      {/* tronco */}
      <mesh
        scale={[1.2,1.5,0.9]}
      >
        <sphereGeometry args={[0.8,32,32]} />
        <meshStandardMaterial color="#214B35" />
      </mesh>


      {/* peito tecnológico */}
      <mesh
        position={[0,0.15,0.72]}
      >
        <sphereGeometry args={[0.18,32,32]} />
        <meshStandardMaterial
          color="#3FB980"
          emissive="#3FB980"
        />
      </mesh>


      {/* ombro esquerdo */}
      <mesh
        position={[-0.75,0.35,0]}
      >
        <sphereGeometry args={[0.3,32,32]} />
        <meshStandardMaterial color="#2F8F5B" />
      </mesh>


      {/* ombro direito */}
      <mesh
        position={[0.75,0.35,0]}
      >
        <sphereGeometry args={[0.3,32,32]} />
        <meshStandardMaterial color="#2F8F5B" />
      </mesh>


      {/* braços */}
      <mesh
        position={[-1,-0.35,0]}
      >
        <capsuleGeometry args={[0.18,0.6,8,16]} />
        <meshStandardMaterial color="#183C2A" />
      </mesh>


      <mesh
        position={[1,-0.35,0]}
      >
        <capsuleGeometry args={[0.18,0.6,8,16]} />
        <meshStandardMaterial color="#183C2A" />
      </mesh>

    </group>
  )
}