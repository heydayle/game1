/**
 * Typed message protocol for Worker communication.
 * Uses discriminated unions for type-safe command/response handling.
 */

import type { SpeciesSummary } from '../../features/evolution/genetics/types.js'
import type { PlanetConfig } from '../../features/genesis/types/genesis.js'
import type { BiomeCellSummary } from '../../features/environment/climate/types.js'
import type {
  ActiveDisasterSummary,
  DisasterType,
  EnvironmentalPerturbations,
} from '../../features/disasters/types.js'
import type { PrebioticState, ChemicalCatalystType } from '../../features/evolution/abiogenesis/types.js'
import type { WorldSave } from '../../features/persistence/types.js'
import type { BiogeochemicalState } from '../../features/environment/biogeochemistry/types.js'
import type { SpeciationEvent } from '../../features/evolution/taxonomy/types.js'

// ============================================================================
// Simulation State
// ============================================================================

export type SimulationStatus = 'idle' | 'running' | 'paused'

export type TimeWarpSpeed = 1 | 10 | 100 | 1000

export interface SimulationSnapshot {
  /** Current rotation count (primary simulation time unit) */
  readonly rotations: number
  /** Fractional progress toward the next rotation [0, 1) */
  readonly partialRotation: number
  /** Current simulation status */
  readonly status: SimulationStatus
  /** Current time warp speed */
  readonly speed: TimeWarpSpeed
  /** Wall-clock timestamp when this snapshot was created (ms) */
  readonly wallClockTime: number
  /** Snapshot version for compatibility checks */
  readonly version: number

  // Biological & Ecosystem Simulation State (Phases 4 & 5)
  readonly totalPopulation: number
  readonly activeSpeciesCount: number
  readonly extinctSpeciesCount: number
  readonly averageFitness: number
  readonly generation: number
  readonly speciesSummaries: readonly SpeciesSummary[]
  readonly biomeCells: readonly BiomeCellSummary[]

  // Planetary Disaster State (Phase 6)
  readonly activeDisasters: readonly ActiveDisasterSummary[]
  readonly perturbations: EnvironmentalPerturbations

  // Prebiotic Chemical Soup & Abiogenesis State
  readonly prebioticState: PrebioticState

  // Dynamic Biogeochemical Elemental & Atmospheric Concentrations
  readonly biogeochemical: BiogeochemicalState

  // Evolutionary Speciation Events & Taxonomic Emergence
  readonly speciationEvents?: readonly SpeciationEvent[]
}

// ============================================================================
// Commands (Main Thread → Worker)
// ============================================================================

export interface StartCommand {
  readonly type: 'start'
}

export interface PauseCommand {
  readonly type: 'pause'
}

export interface ResetCommand {
  readonly type: 'reset'
}

export interface SetSpeedCommand {
  readonly type: 'set-speed'
  readonly speed: TimeWarpSpeed
}

export interface TickCommand {
  readonly type: 'tick'
  readonly deltaMs: number
}

export interface SyncPlanetCommand {
  readonly type: 'sync-planet'
  readonly planetConfig: PlanetConfig
  readonly resetSimulation?: boolean
}

export interface SeedPopulationCommand {
  readonly type: 'seed-population'
  readonly count?: number
}

export interface TriggerStressCommand {
  readonly type: 'trigger-stress'
  readonly intensity: number
}

export interface TriggerDisasterCommand {
  readonly type: 'trigger-disaster'
  readonly disasterType: DisasterType
  readonly severity?: number
  readonly epicenterCellId?: number
}

export interface SparkBiogenesisCommand {
  readonly type: 'spark-biogenesis'
}

export interface CatalyzeChemistryCommand {
  readonly type: 'catalyze-chemistry'
  readonly catalystType: ChemicalCatalystType
}

export interface ExportStateCommand {
  readonly type: 'export-state'
  readonly saveName?: string
}

export interface LoadStateCommand {
  readonly type: 'load-state'
  readonly save: WorldSave
}

export type SimulationCommand =
  | StartCommand
  | PauseCommand
  | ResetCommand
  | SetSpeedCommand
  | TickCommand
  | SyncPlanetCommand
  | SeedPopulationCommand
  | TriggerStressCommand
  | TriggerDisasterCommand
  | SparkBiogenesisCommand
  | CatalyzeChemistryCommand
  | ExportStateCommand
  | LoadStateCommand

// ============================================================================
// Responses (Worker → Main Thread)
// ============================================================================

export interface SnapshotResponse {
  readonly type: 'snapshot'
  readonly snapshot: SimulationSnapshot
}

export interface StateExportResponse {
  readonly type: 'state-export'
  readonly save: WorldSave
}

export interface ErrorResponse {
  readonly type: 'error'
  readonly message: string
  readonly code: string
}

export interface ReadyResponse {
  readonly type: 'ready'
}

export type SimulationResponse =
  | SnapshotResponse
  | StateExportResponse
  | ErrorResponse
  | ReadyResponse

// ============================================================================
// Constants
// ============================================================================

/** Duration of one rotation in simulation-milliseconds at 1x speed (10.0s per rotation) */
export const ROTATION_DURATION_MS = 10000

/** Snapshot version for serialization compatibility */
export const SNAPSHOT_VERSION = 6

/** Available time warp speeds */
export const TIME_WARP_SPEEDS: readonly TimeWarpSpeed[] = [1, 10, 100, 1000] as const

/** Maximum accumulated delta to prevent spiral-of-death (5 rotations backlog cap) */
export const MAX_ACCUMULATED_DELTA_MS = 50000
