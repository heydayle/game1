import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import atmosphereVertShader from '../shaders/atmosphere.vert.glsl?raw'
import atmosphereFragShader from '../shaders/atmosphere.frag.glsl?raw'

interface PlanetAtmosphereProps {
  radius?: number
  sunDirection: THREE.Vector3
  color?: THREE.ColorRepresentation
}

export function PlanetAtmosphere({
  radius = 1.6 * 1.15,
  sunDirection,
  color = '#4ea8de',
}: PlanetAtmosphereProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useMemo(
    () => ({
      uSunDirection: { value: sunDirection.clone().normalize() },
      uCameraPosition: { value: new THREE.Vector3() },
      uAtmosphereColor: { value: new THREE.Color(color) },
    }),
    [sunDirection, color]
  )

  useFrame(({ camera }) => {
    const currentUniforms = materialRef.current?.uniforms
    if (currentUniforms) {
      if (currentUniforms.uCameraPosition?.value) {
        currentUniforms.uCameraPosition.value.copy(camera.position)
      }
      if (currentUniforms.uSunDirection?.value) {
        currentUniforms.uSunDirection.value.copy(sunDirection).normalize()
      }
      if (currentUniforms.uAtmosphereColor?.value) {
        currentUniforms.uAtmosphereColor.value.set(color)
      }
    }
  })

  return (
    <mesh>
      <sphereGeometry args={[radius, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={atmosphereVertShader}
        fragmentShader={atmosphereFragShader}
        uniforms={uniforms}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.BackSide}
      />
    </mesh>
  )
}
