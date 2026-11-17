import type { BiomeType } from '../../planet/utils/planet-math.js'

export interface BiomeCell {
  readonly id: number
  readonly center: readonly [number, number, number] // Unit Cartesian vector on sphere
  readonly latitude: number // Degrees: -90 to +90
  readonly longitude: number // Degrees: -180 to +180
  readonly elevation: number // 0.0 to 1.0
  readonly biome: BiomeType
  readonly localTemperatureCelsius: number
  readonly moisture: number // 0.0 (arid) to 1.0 (hyper-humid)
  readonly carryingCapacity: number // Max biomass supported
  readonly biomassDensity: number // Current living biomass [0.0, 1.0]
  readonly residentSpeciesId: string | null
  readonly residentSpeciesColor: string | null
}

export interface BiomeCellSummary {
  readonly id: number
  readonly center: readonly [number, number, number]
  readonly biome: BiomeType
  readonly localTemperatureCelsius: number
  readonly biomassDensity: number
  readonly residentSpeciesColor: string | null
}

export interface BiomeDistributionStats {
  readonly deepOceanPercent: number
  readonly shallowOceanPercent: number
  readonly beachPercent: number
  readonly lowlandPercent: number
  readonly highlandPercent: number
  readonly mountainPercent: number
  readonly iceCapPercent: number
}

