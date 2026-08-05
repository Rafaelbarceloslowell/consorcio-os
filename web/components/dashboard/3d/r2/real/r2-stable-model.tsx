"use client"

import {
  useEffect,
  useMemo,
  useRef,
} from "react"

import {
  useFrame,
} from "@react-three/fiber"

import {
  useGLTF,
} from "@react-three/drei"

import {
  Color,
  DoubleSide,
  Vector3,
} from "three"

import type {
  BufferGeometry,
  Group,
  Mesh,
  Object3D,
  ShaderMaterial,
} from "three"

type R2StableModelProps = {
  scale?: number
  position?: [number, number, number]
  rotation?: [number, number, number]
  behavior?: unknown
}

const r2StableModelPath =
  "/models/r2/r2-gorilla-geometry-only.glb"

const vertexShader = `
  varying vec3 vLocalPosition;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;

  void main() {
    vLocalPosition = position;

    vec4 worldPosition =
      modelMatrix *
      vec4(position, 1.0);

    vWorldPosition =
      worldPosition.xyz;

    vWorldNormal =
      normalize(
        mat3(modelMatrix) *
        normal
      );

    gl_Position =
      projectionMatrix *
      viewMatrix *
      worldPosition;
  }
`

const fragmentShader = `
  uniform float uTime;

  uniform vec3 uFurColor;
  uniform vec3 uHoodieColor;
  uniform vec3 uFaceColor;
  uniform vec3 uMuzzleColor;
  uniform vec3 uAccentColor;

  varying vec3 vLocalPosition;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;

  float hash31(vec3 value) {
    value =
      fract(value * 0.1031);

    value +=
      dot(
        value,
        value.yzx + 33.33
      );

    return fract(
      (value.x + value.y) *
      value.z
    );
  }

  void main() {
    vec3 normal =
      normalize(vWorldNormal);

    vec3 viewDirection =
      normalize(
        cameraPosition -
        vWorldPosition
      );

    vec3 keyLight =
      normalize(
        vec3(
          -0.45,
          0.85,
          0.65
        )
      );

    vec3 fillLight =
      normalize(
        vec3(
          0.55,
          0.20,
          -0.80
        )
      );

    float x =
      vLocalPosition.x;

    float y =
      vLocalPosition.y;

    float z =
      vLocalPosition.z;

    float torsoVertical =
      smoothstep(
        -0.72,
        -0.40,
        y
      ) *
      (
        1.0 -
        smoothstep(
          0.34,
          0.56,
          y
        )
      );

    float torsoHorizontal =
      1.0 -
      smoothstep(
        0.27,
        0.45,
        abs(x)
      );

    float frontMask =
      smoothstep(
        -0.10,
        0.14,
        z
      );

    float hoodieMask =
      torsoVertical *
      torsoHorizontal *
      frontMask;

    float faceVertical =
      smoothstep(
        0.42,
        0.62,
        y
      );

    float faceHorizontal =
      1.0 -
      smoothstep(
        0.18,
        0.32,
        abs(x)
      );

    float faceFront =
      smoothstep(
        0.04,
        0.22,
        z
      );

    float faceMask =
      faceVertical *
      faceHorizontal *
      faceFront;

    float muzzleVertical =
      smoothstep(
        0.36,
        0.48,
        y
      ) *
      (
        1.0 -
        smoothstep(
          0.62,
          0.74,
          y
        )
      );

    float muzzleHorizontal =
      1.0 -
      smoothstep(
        0.10,
        0.23,
        abs(x)
      );

    float muzzleFront =
      smoothstep(
        0.16,
        0.28,
        z
      );

    float muzzleMask =
      muzzleVertical *
      muzzleHorizontal *
      muzzleFront;

    float seamMask =
      (
        1.0 -
        smoothstep(
          0.004,
          0.022,
          abs(x)
        )
      ) *
      hoodieMask *
      smoothstep(
        0.10,
        0.24,
        z
      );

    float furPattern =
      hash31(
        floor(
          vLocalPosition *
          vec3(
            96.0,
            74.0,
            96.0
          )
        )
      );

    float furVariation =
      mix(
        0.84,
        1.12,
        furPattern
      );

    vec3 baseColor =
      uFurColor *
      furVariation;

    baseColor =
      mix(
        baseColor,
        uHoodieColor,
        hoodieMask
      );

    baseColor =
      mix(
        baseColor,
        uFaceColor,
        faceMask * 0.82
      );

    baseColor =
      mix(
        baseColor,
        uMuzzleColor,
        muzzleMask * 0.92
      );

    baseColor +=
      uAccentColor *
      seamMask *
      0.10;

    float keyDiffuse =
      max(
        dot(
          normal,
          keyLight
        ),
        0.0
      );

    float fillDiffuse =
      max(
        dot(
          normal,
          fillLight
        ),
        0.0
      );

    float topGradient =
      0.62 +
      clamp(
        normal.y * 0.38,
        -0.16,
        0.38
      );

    float diffuseLight =
      0.18 +
      keyDiffuse * 0.88 +
      fillDiffuse * 0.18;

    float rim =
      pow(
        1.0 -
        clamp(
          dot(
            normal,
            viewDirection
          ),
          0.0,
          1.0
        ),
        2.35
      );

    vec3 reflectedLight =
      reflect(
        -keyLight,
        normal
      );

    float specular =
      pow(
        max(
          dot(
            reflectedLight,
            viewDirection
          ),
          0.0
        ),
        42.0
      );

    float fabricSpecular =
      mix(
        0.05,
        0.23,
        hoodieMask
      );

    float breathingSheen =
      sin(
        uTime * 1.15 +
        y * 8.0
      ) *
      0.012;

    vec3 finalColor =
      baseColor *
      diffuseLight *
      topGradient;

    finalColor +=
      uAccentColor *
      rim *
      0.19;

    finalColor +=
      vec3(
        0.55,
        0.82,
        0.68
      ) *
      specular *
      fabricSpecular;

    finalColor +=
      uAccentColor *
      breathingSheen *
      hoodieMask;

    gl_FragColor =
      vec4(
        finalColor,
        1.0
      );

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

function findFirstGeometry(
  root: Object3D,
): BufferGeometry | null {
  let geometry: BufferGeometry | null = null

  root.traverse((object) => {
    if (geometry) {
      return
    }

    const mesh =
      object as Mesh

    if (
      mesh.isMesh &&
      mesh.geometry
    ) {
      geometry =
        mesh.geometry
    }
  })

  return geometry
}

export function R2StableModel({
  scale = 1,
  position = [
    0,
    0,
    0,
  ],
  rotation = [
    0,
    0,
    0,
  ],
}: R2StableModelProps) {
  const groupRef =
    useRef<Group>(null)

  const materialRef =
    useRef<ShaderMaterial>(null)

  const {
    scene,
  } = useGLTF(
    r2StableModelPath,
  )

  const uniforms = useMemo(() => {
    return {
      uTime: {
        value: 0,
      },

      uFurColor: {
        value: new Color(
          "#111713",
        ),
      },

      uHoodieColor: {
        value: new Color(
          "#14251D",
        ),
      },

      uFaceColor: {
        value: new Color(
          "#526159",
        ),
      },

      uMuzzleColor: {
        value: new Color(
          "#786C5F",
        ),
      },

      uAccentColor: {
        value: new Color(
          "#43A972",
        ),
      },
    }
  }, [])

  const preparedGeometry = useMemo(() => {
    const sourceGeometry =
      findFirstGeometry(scene)

    if (!sourceGeometry) {
      return null
    }

    const geometry =
      sourceGeometry.clone()

    geometry.computeBoundingBox()

    const boundingBox =
      geometry.boundingBox

    if (!boundingBox) {
      geometry.dispose()

      return null
    }

    const center =
      new Vector3()

    const size =
      new Vector3()

    boundingBox.getCenter(
      center,
    )

    boundingBox.getSize(
      size,
    )

    geometry.translate(
      -center.x,
      -center.y,
      -center.z,
    )

    const largestDimension =
      Math.max(
        size.x,
        size.y,
        size.z,
      )

    return {
      geometry,

      normalizationScale:
        largestDimension > 0
          ? 2 / largestDimension
          : 1,
    }
  }, [
    scene,
  ])

  useFrame((state) => {
    const time =
      state.clock.elapsedTime

    if (materialRef.current) {
      materialRef.current
        .uniforms
        .uTime
        .value = time
    }

    if (!groupRef.current) {
      return
    }

    const breath =
      Math.sin(
        time * 1.28,
      )

    groupRef.current.position.set(
      position[0],
      position[1] +
        breath * 0.011,
      position[2],
    )

    groupRef.current.rotation.set(
      rotation[0] +
        Math.sin(
          time * 0.47,
        ) * 0.004,
      rotation[1] +
        Math.sin(
          time * 0.29,
        ) * 0.018,
      rotation[2],
    )

    groupRef.current.scale.set(
      scale *
        (
          1 -
          breath * 0.002
        ),
      scale *
        (
          1 +
          breath * 0.006
        ),
      scale *
        (
          1 +
          breath * 0.003
        ),
    )
  })

  useEffect(() => {
    return () => {
      preparedGeometry
        ?.geometry
        .dispose()
    }
  }, [
    preparedGeometry,
  ])

  if (!preparedGeometry) {
    return null
  }

  const geometryScale =
    preparedGeometry
      .normalizationScale

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      scale={scale}
    >
      <mesh
        geometry={
          preparedGeometry.geometry
        }
        scale={
          geometryScale
        }
        frustumCulled={false}
      >
        <shaderMaterial
          ref={materialRef}
          uniforms={uniforms}
          vertexShader={
            vertexShader
          }
          fragmentShader={
            fragmentShader
          }
          side={DoubleSide}
        />
      </mesh>

      <group
        scale={geometryScale}
      >
        <mesh
          position={[
            -0.064,
            0.805,
            0.318,
          ]}
        >
          <sphereGeometry
            args={[
              0.015,
              20,
              20,
            ]}
          />

          <meshBasicMaterial
            color="#9DFFD0"
            toneMapped={false}
          />
        </mesh>

        <mesh
          position={[
            0.064,
            0.805,
            0.318,
          ]}
        >
          <sphereGeometry
            args={[
              0.015,
              20,
              20,
            ]}
          />

          <meshBasicMaterial
            color="#9DFFD0"
            toneMapped={false}
          />
        </mesh>

        <pointLight
          position={[
            0,
            0.80,
            0.35,
          ]}
          color="#43A972"
          intensity={0.38}
          distance={0.85}
          decay={2}
        />

        <mesh
          position={[
            0,
            0.17,
            0.318,
          ]}
        >
          <torusGeometry
            args={[
              0.043,
              0.005,
              14,
              48,
            ]}
          />

          <meshBasicMaterial
            color="#43A972"
            toneMapped={false}
          />
        </mesh>

        <mesh
          position={[
            0,
            0.17,
            0.320,
          ]}
        >
          <sphereGeometry
            args={[
              0.014,
              24,
              24,
            ]}
          />

          <meshBasicMaterial
            color="#9DFFD0"
            toneMapped={false}
          />
        </mesh>

        <pointLight
          position={[
            0,
            0.17,
            0.37,
          ]}
          color="#43A972"
          intensity={0.24}
          distance={0.65}
          decay={2}
        />

        <mesh
          position={[
            0,
            -1.01,
            -0.22,
          ]}
          scale={[
            0.58,
            0.105,
            1,
          ]}
        >
          <circleGeometry
            args={[
              1,
              64,
            ]}
          />

          <meshBasicMaterial
            color="#000000"
            transparent
            opacity={0.30}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  )
}

useGLTF.preload(
  r2StableModelPath,
)