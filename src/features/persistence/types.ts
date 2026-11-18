import type { PlanetConfig } from '../genesis/types/genesis.js'
import type { Genotype } from '../evolution/genetics/types.js'
import type { LifeStage } from '../evolution/abiogenesis/types.js'
import type { ActiveDisaster } from '../disasters/types.js'
import type { SimulationStatus, TimeWarpSpeed } from '../../shared/types/simulation-protocol.js'

export const CURRENT_SAVE_SCHEMA_VERSION = 1

export interface SerializedSpecies {
  readonly id: string
  readonly name: string
  readonly color: string
  readonly foundingGenotype: Genotype
  readonly emergenceRotation: number
  readonly isExtinct: boolean
  readonly extinctionRotation: number | null
  readonly generation: number
}

export interface SerializedOrganism {
  readonly id: string
  readonly speciesId: string
  readonly genotype: Genotype
  readonly generation: number
  readonly energy: number
  readonly ageRotations: number
  readonly fitness: number
  readonly cohortWeight: number
  readonly cellId: number
}

export interface SerializedClockState {
  readonly rotations: number
  readonly speed: TimeWarpSpeed
  readonly status: SimulationStatus
  readonly accumulatedMs: number
}

export interface SerializedPrebioticState {
  readonly stage: LifeStage
  readonly organicComplexity: number
  readonly monomerConcentration?: number
  readonly polymerComplexity?: number
  readonly protocellStability?: number
  readonly organicPoolVolume?: number
  readonly bioticFeedbackFlux?: number
  readonly deNovoSynthesisReady?: boolean
}

export interface SerializedDisasterState {
  readonly activeDisasters: readonly ActiveDisaster[]
  readonly nextDisasterId: number
  readonly lastPulseRotation: number
}

export interface WorldSaveMetadata {
  readonly saveId: string
  readonly name: string
  readonly savedAt: number // Unix epoch ms
  readonly schemaVersion: number
  readonly planetName: string
  readonly rotations: number
  readonly totalPopulation: number
  readonly activeSpeciesCount: number
  readonly lifeStage: LifeStage
  readonly dominantAtmosphere: string
}

export interface WorldSave {
  readonly schemaVersion: number
  readonly metadata: WorldSaveMetadata
  readonly planetConfig: PlanetConfig
  readonly clock: SerializedClockState
  readonly evolution: {
    readonly currentGeneration: number
    readonly nextOrganismId: number
    readonly nextSpeciesId: number
    readonly species: readonly SerializedSpecies[]
    readonly organisms: readonly SerializedOrganism[]
    readonly prebiotic: SerializedPrebioticState
  }
  readonly disasters: SerializedDisasterState
  readonly biogeochemical?: {
    readonly biogenicOxygen: number
    readonly biogenicCarbonFixed: number
    readonly biogenicMethane: number
  }
}

