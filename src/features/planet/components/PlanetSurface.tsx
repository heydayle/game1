import { useRef, useMemo, useCallback, useEffect } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import planetVertShader from '../shaders/planet.vert.glsl?raw'
import planetFragShader from '../shaders/planet.frag.glsl?raw'
import {
  cartesianToLatLong,
  classifyBiome,
  type BiomeType,
  type LatLong,
} from '../utils/planet-math.js'

export interface PlanetInspectData {
  latLong: LatLong
  biome: BiomeType
  point: [number, number, number]
  localTemperatureCelsius?: number
}

interface PlanetSurfaceProps {
  radius?: number
  oceanLevel?: number
  iceCapLatitude?: number
  seed?: number
  sunDirection: THREE.Vector3
  onInspect?: (data: PlanetInspectData | null) => void
}

export function PlanetSurface({
  radius = 1.6,
  oceanLevel = 0.5,
  iceCapLatitude = 0.74,
  seed = 42.0,
  sunDirection,
  onInspect,
}: PlanetSurfaceProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  // Clear inspect HUD if component unmounts
  useEffect(() => {
    return () => {
      onInspect?.(null)
    }
  }, [onInspect])

  const uniforms = useMemo(
    () => ({
      uSunDirection: { value: sunDirection.clone().normalize() },
      uOceanLevel: { value: oceanLevel },
      uIceCapLatitude: { value: iceCapLatitude },
      uSeed: { value: seed },
      uCameraPosition: { value: new THREE.Vector3() },
    }),
    [seed]
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
      // Imperatively sync disaster & Genesis environmental shifts
      if (currentUniforms.uOceanLevel) {
        currentUniforms.uOceanLevel.value = oceanLevel
      }
      if (currentUniforms.uIceCapLatitude) {
        currentUniforms.uIceCapLatitude.value = iceCapLatitude
      }
    }
  })

  const handlePointerMove = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation()
      if (!meshRef.current || !event.point) return

      // Transform intersection point into local sphere coordinate space
      const localPoint = meshRef.current.worldToLocal(event.point.clone())
      const latLong = cartesianToLatLong(localPoint.x, localPoint.y, localPoint.z)

      const latRad = (latLong.latitude * Math.PI) / 180
      const lonRad = (latLong.longitude * Math.PI) / 180
      const nx = Math.cos(latRad) * Math.sin(lonRad)
      const ny = Math.sin(latRad)
      const nz = Math.cos(latRad) * Math.cos(lonRad)

      // Sample procedural elevation matching planetary terrain noise
      const elevationNoise =
        0.5 +
        0.28 *
          Math.sin(nx * 3.4 + ny * 2.1 + seed * 0.1) *
          Math.cos(nz * 3.1 + seed * 0.15) +
        0.14 * Math.sin(nx * 7.2 - nz * 5.4 + ny * 6.3)
      const elevation = Math.max(0.0, Math.min(1.0, elevationNoise))

      // Estimate biome using math model with actual dynamic ice cap threshold
      const iceCapThresholdDeg = iceCapLatitude * 90.0
      const biome = classifyBiome(elevation, latLong.latitude, oceanLevel, iceCapThresholdDeg)
      const localTemp = Math.round(15 - 38 * Math.pow(Math.sin(latRad), 2) - 18.0 * (elevation - 0.5))

      onInspect?.({
        latLong,
        biome,
        point: [event.point.x, event.point.y, event.point.z],
        localTemperatureCelsius: localTemp,
      })
    },
    [onInspect, oceanLevel, iceCapLatitude, seed]
  )

  const handlePointerOut = useCallback(() => {
    onInspect?.(null)
  }, [onInspect])

  return (
    <mesh
      ref={meshRef}
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
    >
      <sphereGeometry args={[radius, 96, 96]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={planetVertShader}
        fragmentShader={planetFragShader}
        uniforms={uniforms}
      />
    </mesh>
  )
}
