import type { DisasterDefinition, DisasterType, EnvironmentalPerturbations } from './types.js'

export const DEFAULT_PERTURBATIONS: EnvironmentalPerturbations = {
  temperatureDeltaCelsius: 0,
  radiationMultiplier: 1.0,
  atmosphericDust: 0.0,
  mutationRateMultiplier: 1.0,
  instantMortalityRate: 0.0,
  oceanLevelDelta: 0.0,
}

export const DISASTER_CATALOG: Record<DisasterType, DisasterDefinition> = {
  asteroid_impact: {
    type: 'asteroid_impact',
    name: 'Asteroid Impact',
    icon: '☄️',
    description:
      'Massive kinetic collision delivering planetary shockwaves, atmospheric dust ejection, and a severe impact winter.',
    defaultDurationRotations: 12,
    baseSeverity: 0.8,
  },
  ice_age: {
    type: 'ice_age',
    name: 'Global Glaciation',
    icon: '❄️',
    description:
      'Prolonged planetary deep-freeze expanding polar ice caps toward the equator, locking ocean water and filtering for cold-tolerant genes.',
    defaultDurationRotations: 30,
    baseSeverity: 0.75,
  },
  volcanic_eruption: {
    type: 'volcanic_eruption',
    name: 'Supervolcanic Eruption',
    icon: '🌋',
    description:
      'Cataclysmic basaltic fissure eruption releasing sulfurous ash followed by runaway greenhouse heating and toxic gas poisoning.',
    defaultDurationRotations: 20,
    baseSeverity: 0.7,
  },
  climate_shift: {
    type: 'climate_shift',
    name: 'Milankovitch Climate Shift',
    icon: '🌪️',
    description:
      'Severe orbital axial oscillation producing chaotic seasonal extremes, desertification of lush biomes, and niche destabilization.',
    defaultDurationRotations: 25,
    baseSeverity: 0.65,
  },
  solar_flare: {
    type: 'solar_flare',
    name: 'Coronal Radiation Flare',
    icon: '☢️',
    description:
      'Intense stellar radiation pulse penetrating the magnetosphere, inducing lethal ionizing burns and rapid genetic mutations.',
    defaultDurationRotations: 8,
    baseSeverity: 0.85,
  },
}

