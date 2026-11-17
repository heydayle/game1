import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PlanetSurface, type PlanetInspectData } from './PlanetSurface.js'
import { PlanetAtmosphere } from './PlanetAtmosphere.js'
import { BiomassClusters } from '../../../rendering/instancing/BiomassClusters.js'
import { DisasterVisualEffects } from '../../../rendering/effects/DisasterVisualEffects.js'
import type { BiomeCellSummary } from '../../environment/climate/types.js'
import type { EnvironmentalPerturbations, ActiveDisasterSummary } from '../../disasters/types.js'
import type { BiogeochemicalState } from '../../environment/biogeochemistry/types.js'
import { calculateRotationAngle } from '../utils/planet-math.js'

const DEFAULT_SUN_DIRECTION = new THREE.Vector3(5, 2, 4)

interface PlanetProps {
  radius?: number
  axialTiltDeg?: number
  rotations: number
  partialRotation: number
  sunDirection?: THREE.Vector3
  seed?: number
  oceanLevel?: number
  iceCapLatitude?: number
  atmosphereColor?: string
  biomeCells?: readonly BiomeCellSummary[]
  perturbations?: EnvironmentalPerturbations
  activeDisasters?: readonly ActiveDisasterSummary[]
  biogeochemical?: BiogeochemicalState
  onInspect?: (data: PlanetInspectData | null) => void
}

export function Planet({
  radius = 1.6,
  axialTiltDeg = 23.44,
  rotations,
  partialRotation,
  sunDirection = DEFAULT_SUN_DIRECTION,
  seed = 42.0,
  oceanLevel = 0.5,
  iceCapLatitude = 0.74,
  atmosphereColor = '#38bdf8',
  biomeCells = [],
  perturbations,
  activeDisasters = [],
  biogeochemical,
  onInspect,
}: PlanetProps) {
  const tiltGroupRef = useRef<THREE.Group>(null)
  const rotatingGroupRef = useRef<THREE.Group>(null)

  // Tilt in radians (applied around Z-axis)
  const axialTiltRad = useMemo(
    () => (axialTiltDeg * Math.PI) / 180,
    [axialTiltDeg]
  )

  // Dynamically modulate ice cap and ocean level according to disasters
  const tempDelta = perturbations?.temperatureDeltaCelsius ?? 0
  const effectiveIceCapLatitude = Math.max(
    0.18,
    Math.min(0.95, iceCapLatitude + tempDelta * 0.018)
  )
  const effectiveOceanLevel = Math.max(
    0.1,
    Math.min(0.9, oceanLevel + (perturbations?.oceanLevelDelta ?? 0))
  )

  // Atmospheric visual shifts under disaster stress and biogeochemical evolution
  const effectiveAtmosphereColor = useMemo(() => {
    if (biogeochemical) {
      const { dominantBiochemicalRegime, atmospheric } = biogeochemical
      if (dominantBiochemicalRegime === 'Volcanic Greenhouse') return '#ea580c'
      if (dominantBiochemicalRegime === 'Glacial Cryo-Lock') return '#93c5fd'
      if (dominantBiochemicalRegime === 'Impact Fallback') return '#78716c'
      if (dominantBiochemicalRegime === 'Chemosynthetic Haze') return '#eab308'
      if (dominantBiochemicalRegime === 'Great Oxidation Surge') return '#06b6d4'
      if (dominantBiochemicalRegime === 'Equilibrium Biosphere') return '#0284c7'
      if (atmospheric.oxygen < 1.0) return '#ca8a04' // Primordial methane/nitrogen haze
    }

    if (!perturbations) return atmosphereColor

    const hasRadiation = perturbations.radiationMultiplier > 2.5
    const hasDust = perturbations.atmosphericDust > 0.35

    if (hasRadiation && hasDust) {
      // Blended toxic amber-soot haze
      return '#b45309'
    }
    if (hasRadiation) {
      return '#f59e0b' // Auroral amber corona
    }
    if (hasDust) {
      return '#78716c' // Soot & ash haze
    }
    return atmosphereColor
  }, [atmosphereColor, perturbations, biogeochemical])

  useFrame(() => {
    if (rotatingGroupRef.current) {
      // Direct synchronisation with the simulation rotation clock
      const targetAngle = calculateRotationAngle(rotations, partialRotation)
      rotatingGroupRef.current.rotation.y = targetAngle
    }
  })

  return (
    <group ref={tiltGroupRef} rotation={[0, 0, axialTiltRad]}>
      {/* Inner group that rotates with planetary time */}
      <group ref={rotatingGroupRef}>
        <PlanetSurface
          radius={radius}
          sunDirection={sunDirection}
          seed={seed}
          oceanLevel={effectiveOceanLevel}
          iceCapLatitude={effectiveIceCapLatitude}
          onInspect={onInspect}
        />
        {/* Living Biomass Clusters on surface */}
        <BiomassClusters radius={radius} biomeCells={biomeCells} />

        {/* Dynamic Planetary Disaster Shockwaves & Impact Rings */}
        <DisasterVisualEffects
          radius={radius}
          activeDisasters={activeDisasters}
          perturbations={perturbations}
        />
      </group>

      {/* Atmospheric layer surrounding the planet */}
      <PlanetAtmosphere
        radius={radius * 1.15}
        sunDirection={sunDirection}
        color={effectiveAtmosphereColor}
      />
    </group>
  )
}

