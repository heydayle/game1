/**
 * Domain types for Planetary Disasters and Environmental Perturbations.
 * Pure TypeScript definitions decoupled from React and Three.js.
 */

export type DisasterType =
  | 'asteroid_impact'
  | 'ice_age'
  | 'volcanic_eruption'
  | 'climate_shift'
  | 'solar_flare'

export interface EnvironmentalPerturbations {
  /** Delta to surface temperature in Celsius (positive = greenhouse warming, negative = winter/cooling) */
  readonly temperatureDeltaCelsius: number
  /** Multiplier for planetary radiation level (e.g. 5.0 = 500% normal cosmic flux) */
  readonly radiationMultiplier: number
  /** Atmospheric dust opacity [0, 1] blocking sunlight and lowering carrying capacity */
  readonly atmosphericDust: number
  /** Multiplier for genetic mutation probability (e.g. 8.0 = 8x normal rate) */
  readonly mutationRateMultiplier: number
  /** Instant lethality pulse applied on impact rotation [0, 1] (mitigated by structuralArmor) */
  readonly instantMortalityRate: number
  /** Shift in ocean moisture / water availability [-0.3, +0.3] */
  readonly oceanLevelDelta: number
}

export interface ActiveDisaster {
  readonly id: string
  readonly type: DisasterType
  readonly name: string
  readonly severity: number // [0.1, 1.0]
  readonly startRotation: number
  readonly durationRotations: number
  remainingRotations: number
  readonly epicenterCellId?: number
  readonly description: string
}

export interface ActiveDisasterSummary {
  readonly id: string
  readonly type: DisasterType
  readonly name: string
  readonly severity: number
  readonly progress: number // [0, 1] where 1 = just started, 0 = ending
  readonly remainingRotations: number
  readonly durationRotations: number
  readonly epicenterCellId?: number
  readonly description: string
}

export interface DisasterDefinition {
  readonly type: DisasterType
  readonly name: string
  readonly icon: string
  readonly description: string
  readonly defaultDurationRotations: number
  readonly baseSeverity: number
}

