import { describe, it, expect } from 'vitest'
import {
  ROTATION_DURATION_MS,
  SNAPSHOT_VERSION,
  TIME_WARP_SPEEDS,
  MAX_ACCUMULATED_DELTA_MS,
} from '../simulation-protocol.js'
import type {
  SimulationCommand,
  SimulationResponse,
} from '../simulation-protocol.js'
import { DEFAULT_PERTURBATIONS } from '../../../features/disasters/constants.js'
import { DEFAULT_PREBIOTIC_STATE } from '../../../features/evolution/abiogenesis/PrebioticEngine.js'
import { DEFAULT_BIOGEOCHEMICAL_STATE } from '../../../features/environment/biogeochemistry/types.js'

describe('Simulation Protocol Constants', () => {
  it('ROTATION_DURATION_MS is a positive number', () => {
    expect(ROTATION_DURATION_MS).toBeGreaterThan(0)
  })

  it('SNAPSHOT_VERSION is defined', () => {
    expect(SNAPSHOT_VERSION).toBe(6)
  })

  it('TIME_WARP_SPEEDS contains expected values', () => {
    expect(TIME_WARP_SPEEDS).toEqual([1, 10, 100, 1000])
  })

  it('MAX_ACCUMULATED_DELTA_MS is reasonable', () => {
    expect(MAX_ACCUMULATED_DELTA_MS).toBeGreaterThan(0)
    expect(MAX_ACCUMULATED_DELTA_MS).toBeLessThanOrEqual(60000)
  })
})

describe('Simulation Protocol Type Guards', () => {
  it('commands are distinguishable by type field', () => {
    const commands: SimulationCommand[] = [
      { type: 'start' },
      { type: 'pause' },
      { type: 'reset' },
      { type: 'set-speed', speed: 10 },
      { type: 'tick', deltaMs: 16 },
      { type: 'seed-population', count: 30 },
      { type: 'trigger-stress', intensity: 0.5 },
      { type: 'trigger-disaster', disasterType: 'asteroid_impact', severity: 0.8 },
      { type: 'spark-biogenesis' },
      { type: 'export-state', saveName: 'Test Save' },
      {
        type: 'load-state',
        save: {
          schemaVersion: 1,
          metadata: {
            saveId: 'save_1',
            name: 'Test',
            savedAt: 1000,
            schemaVersion: 1,
            planetName: 'TestPlanet',
            rotations: 10,
            totalPopulation: 100,
            activeSpeciesCount: 1,
            lifeStage: 'inhabited',
            dominantAtmosphere: 'Nitrogen',
          },
          planetConfig: {} as any,
          clock: { rotations: 10, speed: 1, status: 'running', accumulatedMs: 0 },
          evolution: {
            currentGeneration: 1,
            nextOrganismId: 1,
            nextSpeciesId: 1,
            species: [],
            organisms: [],
            prebiotic: { stage: 'inhabited', organicComplexity: 100 },
          },
          disasters: { activeDisasters: [], nextDisasterId: 1, lastPulseRotation: -1 },
        },
      },
    ]

    const types = commands.map((c) => c.type)
    const uniqueTypes = new Set(types)
    expect(uniqueTypes.size).toBe(commands.length)
  })

  it('responses are distinguishable by type field', () => {
    const responses: SimulationResponse[] = [
      { type: 'ready' },
      {
        type: 'snapshot',
        snapshot: {
          rotations: 0,
          partialRotation: 0,
          status: 'idle',
          speed: 1,
          wallClockTime: 0,
          version: SNAPSHOT_VERSION,
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
        },
      },
      {
        type: 'state-export',
        save: {
          schemaVersion: 1,
          metadata: {} as any,
          planetConfig: {} as any,
          clock: {} as any,
          evolution: {} as any,
          disasters: {} as any,
        },
      },
      { type: 'error', message: 'test', code: 'TEST' },
    ]

    const types = responses.map((r) => r.type)
    const uniqueTypes = new Set(types)
    expect(uniqueTypes.size).toBe(responses.length)
  })
})
