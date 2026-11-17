/**
 * SimulationClock — fixed-step simulation clock.
 *
 * Runs entirely inside a Web Worker. Converts wall-clock delta time
 * into discrete rotation ticks at the configured time warp speed.
 *
 * Key design decisions:
 * - Fixed-step to ensure determinism regardless of frame rate.
 * - Delta-time accumulation to avoid losing simulation time.
 * - Backlog cap to prevent spiral-of-death on slow frames.
 * - No dependency on DOM, React, or Three.js.
 */

import type {
  SimulationSnapshot,
  SimulationStatus,
  TimeWarpSpeed,
} from '../../../shared/types/simulation-protocol.js'
import {
  MAX_ACCUMULATED_DELTA_MS,
  ROTATION_DURATION_MS,
  SNAPSHOT_VERSION,
} from '../../../shared/types/simulation-protocol.js'
import { DEFAULT_PERTURBATIONS } from '../../disasters/constants.js'
import { DEFAULT_PREBIOTIC_STATE } from '../../evolution/abiogenesis/PrebioticEngine.js'
import { DEFAULT_BIOGEOCHEMICAL_STATE } from '../../environment/biogeochemistry/types.js'

export interface BiologicalStateSnapshot {
  readonly totalPopulation: number
  readonly activeSpeciesCount: number
  readonly extinctSpeciesCount: number
  readonly averageFitness: number
  readonly generation: number
  readonly speciesSummaries: SimulationSnapshot['speciesSummaries']
  readonly biomeCells: SimulationSnapshot['biomeCells']
  readonly activeDisasters: SimulationSnapshot['activeDisasters']
  readonly perturbations: SimulationSnapshot['perturbations']
  readonly prebioticState: SimulationSnapshot['prebioticState']
  readonly biogeochemical: SimulationSnapshot['biogeochemical']
}

const DEFAULT_BIO_STATE: BiologicalStateSnapshot = {
  totalPopulation: 0,
  activeSpeciesCount: 0,
  extinctSpeciesCount: 0,
  averageFitness: 0,
  generation: 0,
  speciesSummaries: [],
  biomeCells: [],
  activeDisasters: [],
  perturbations: { ...DEFAULT_PERTURBATIONS },
  prebioticState: { ...DEFAULT_PREBIOTIC_STATE },
  biogeochemical: { ...DEFAULT_BIOGEOCHEMICAL_STATE },
}

export class SimulationClock {
  private rotations = 0
  private accumulatedMs = 0
  private status: SimulationStatus = 'idle'
  private speed: TimeWarpSpeed = 1

  /**
   * Process a time delta and advance the simulation.
   * Returns the number of complete rotations that occurred.
   */
  tick(deltaMs: number): number {
    if (this.status !== 'running') {
      return 0
    }

    if (deltaMs < 0) {
      return 0
    }

    // Scale delta by time warp speed
    const scaledDelta = deltaMs * this.speed

    // Accumulate, but cap to prevent spiral-of-death
    this.accumulatedMs = Math.min(
      this.accumulatedMs + scaledDelta,
      MAX_ACCUMULATED_DELTA_MS * this.speed
    )

    // Fixed-step: consume full rotations
    let completedRotations = 0
    while (this.accumulatedMs >= ROTATION_DURATION_MS) {
      this.accumulatedMs -= ROTATION_DURATION_MS
      this.rotations++
      completedRotations++
    }

    return completedRotations
  }

  start(): void {
    if (this.status === 'idle' || this.status === 'paused') {
      this.status = 'running'
    }
  }

  pause(): void {
    if (this.status === 'running') {
      this.status = 'paused'
    }
  }

  reset(): void {
    this.rotations = 0
    this.accumulatedMs = 0
    this.status = 'idle'
    this.speed = 1
  }

  setSpeed(speed: TimeWarpSpeed): void {
    this.speed = speed
    // Reset accumulator on speed change to avoid burst of ticks
    this.accumulatedMs = 0
  }

  getSnapshot(bioState: BiologicalStateSnapshot = DEFAULT_BIO_STATE): SimulationSnapshot {
    return {
      rotations: this.rotations,
      partialRotation: this.accumulatedMs / ROTATION_DURATION_MS,
      status: this.status,
      speed: this.speed,
      wallClockTime: Date.now(),
      version: SNAPSHOT_VERSION,
      totalPopulation: bioState.totalPopulation,
      activeSpeciesCount: bioState.activeSpeciesCount,
      extinctSpeciesCount: bioState.extinctSpeciesCount,
      averageFitness: bioState.averageFitness,
      generation: bioState.generation,
      speciesSummaries: bioState.speciesSummaries,
      biomeCells: bioState.biomeCells,
      activeDisasters: bioState.activeDisasters,
      perturbations: bioState.perturbations,
      prebioticState: bioState.prebioticState,
      biogeochemical: bioState.biogeochemical,
    }
  }

  getStatus(): SimulationStatus {
    return this.status
  }

  getRotations(): number {
    return this.rotations
  }

  getSpeed(): TimeWarpSpeed {
    return this.speed
  }

  exportState(): {
    rotations: number
    speed: TimeWarpSpeed
    status: SimulationStatus
    accumulatedMs: number
  } {
    return {
      rotations: this.rotations,
      speed: this.speed,
      status: this.status,
      accumulatedMs: this.accumulatedMs,
    }
  }

  restoreState(state: {
    rotations: number
    speed: TimeWarpSpeed
    status: SimulationStatus
    accumulatedMs?: number
  }): void {
    this.rotations = Math.max(0, Math.floor(state.rotations))
    this.speed = state.speed
    this.status = state.status
    this.accumulatedMs = Math.max(0, state.accumulatedMs ?? 0)
  }
}
