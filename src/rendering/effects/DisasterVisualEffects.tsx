import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ActiveDisasterSummary, EnvironmentalPerturbations } from '../../features/disasters/types.js'

interface DisasterVisualEffectsProps {
  radius?: number
  activeDisasters?: readonly ActiveDisasterSummary[]
  perturbations?: EnvironmentalPerturbations
}

export function DisasterVisualEffects({
  radius = 1.6,
  activeDisasters = [],
  perturbations,
}: DisasterVisualEffectsProps) {
  const radiationAuraRef = useRef<THREE.Mesh>(null)
  const impactRingsGroupRef = useRef<THREE.Group>(null)

  const hasRadiation = (perturbations?.radiationMultiplier ?? 1.0) > 1.8
  const hasDust = (perturbations?.atmosphericDust ?? 0.0) > 0.35

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime()

    // 1. Solar Radiation Coronal Pulse
    if (radiationAuraRef.current) {
      const mat = radiationAuraRef.current.material as THREE.MeshBasicMaterial
      const pulse = Math.sin(elapsed * 4.0) * 0.15 + 0.35
      mat.opacity = pulse * (perturbations ? (perturbations.radiationMultiplier - 1.0) * 0.4 : 0.3)
      radiationAuraRef.current.rotation.y = elapsed * 0.2
    }

    // 2. Shockwave Rings Expansion
    if (impactRingsGroupRef.current) {
      impactRingsGroupRef.current.children.forEach((child, idx) => {
        const ring = child as THREE.Mesh
        const disaster = activeDisasters[idx]
        if (disaster) {
          // Progress goes from 1.0 (start) down to 0.0 (end)
          const age = 1.0 - disaster.progress
          const cycle = (age * 3.0 + elapsed * 0.5) % 1.0
          const scale = 0.2 + cycle * 1.8
          ring.scale.set(scale, scale, scale)

          const mat = ring.material as THREE.MeshBasicMaterial
          mat.opacity = (1.0 - cycle) * 0.8 * disaster.severity
        }
      })
    }
  })

  return (
    <group>
      {/* Coronal Solar Flare Radiation Shield Aura */}
      {hasRadiation && (
        <mesh ref={radiationAuraRef}>
          <sphereGeometry args={[radius * 1.14, 32, 32]} />
          <meshBasicMaterial
            color="#fbbf24"
            transparent
            opacity={0.3}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Atmospheric Particulate Haze Sphere during Supervolcano or Asteroid Fallback */}
      {hasDust && (
        <mesh>
          <sphereGeometry args={[radius * 1.06, 32, 32]} />
          <meshBasicMaterial
            color="#78716c"
            transparent
            opacity={Math.min(0.45, (perturbations?.atmosphericDust ?? 0.3) * 0.6)}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Dynamic Expanding Shockwave Rings for Asteroids / Volcanic Eruptions */}
      <group ref={impactRingsGroupRef}>
        {activeDisasters
          .filter(
            (d) =>
              d.type === 'asteroid_impact' ||
              d.type === 'volcanic_eruption' ||
              d.type === 'climate_shift'
          )
          .map((disaster) => {
            const isAsteroid = disaster.type === 'asteroid_impact'
            const isVolcano = disaster.type === 'volcanic_eruption'
            const ringColor = isAsteroid ? '#f97316' : isVolcano ? '#ef4444' : '#38bdf8'

            return (
              <mesh
                key={disaster.id}
                position={[0, 0, radius * 1.015]}
                rotation={[-Math.PI / 2, 0, 0]}
              >
                <ringGeometry args={[0.05, 0.25, 32]} />
                <meshBasicMaterial
                  color={ringColor}
                  transparent
                  opacity={0.8}
                  side={THREE.DoubleSide}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>
            )
          })}
      </group>
    </group>
  )
}
