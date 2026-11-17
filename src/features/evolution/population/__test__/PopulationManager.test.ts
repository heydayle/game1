import { describe, it, expect, beforeEach } from 'vitest'
import { PopulationManager, MAX_CARRYING_CAPACITY } from '../PopulationManager.js'
import { SeededRNG } from '../../../../shared/utils/seeded-rng.js'
import { GenesisEngine } from '../../../genesis/services/GenesisEngine.js'
import type { PlanetConfig } from '../../../genesis/types/genesis.js'

describe('PopulationManager', () => {
  let manager: PopulationManager
  let planetConfig: PlanetConfig

  beforeEach(() => {
    manager = new PopulationManager()
    planetConfig = GenesisEngine.generatePlanet({}, 42)
  })

  it('has infinite carrying capacity without an arbitrary ceiling', () => {
    expect(MAX_CARRYING_CAPACITY).toBe(Number.POSITIVE_INFINITY)
    expect(!Number.isFinite(MAX_CARRYING_CAPACITY)).toBe(true)
  })

  it('seeds initial primordial life adapted to planet', () => {
    manager.seedPrimordialLife(planetConfig, 30)

    const orgs = manager.getOrganisms()
    expect(orgs.length).toBe(30)

    const species = manager.getSpeciesList()
    expect(species.length).toBe(1)
    expect(species[0]!.name).toBeTruthy()
    expect(species[0]!.isExtinct).toBe(false)
  })

  it('simulates population survival, reproduction, and speciation over rotations', () => {
    manager.seedPrimordialLife(planetConfig, 40)
    const rng = new SeededRNG(999)

    let summary = manager.step(1, planetConfig, rng)

    // Run 15 rotations
    for (let r = 2; r <= 15; r++) {
      summary = manager.step(r, planetConfig, rng)
    }

    expect(summary.totalPopulation).toBeGreaterThan(0)
    expect(summary.generation).toBeGreaterThan(1)
    expect(summary.speciesSummaries.length).toBeGreaterThanOrEqual(1)
  })

  it('culls populations when subjected to lethal environmental extremes', () => {
    manager.seedPrimordialLife(planetConfig, 50)
    const rng = new SeededRNG(123)

    // Create an uninhabitable super-volcanic hellworld with 95% selection pressure
    const lethalPlanet: PlanetConfig = {
      ...planetConfig,
      surfaceTemperatureCelsius: 120, // Boiling hot, far above thermal buffer
      environmentalConditions: {
        ...planetConfig.environmentalConditions,
        selectionPressure: 0.99,
        radiationLevel: 'extreme',
        tectonicStability: 'cataclysmic',
      },
    }

    // Step several rotations under lethal conditions
    for (let r = 1; r <= 10; r++) {
      manager.step(r, lethalPlanet, rng)
    }

    const remaining = manager.getOrganisms()
    // Most or all should have died off under 120°C extreme environment
    expect(remaining.length).toBeLessThan(10)
  })

  it('guarantees O(1) memory and latency without lag when population grows very large', () => {
    // Seed initial population
    manager.seedPrimordialLife(planetConfig, 100)
    const rng = new SeededRNG(456)

    // Run 50 rotations allowing massive population growth
    const startTime = performance.now()
    for (let r = 1; r <= 50; r++) {
      manager.step(r, planetConfig, rng)
    }
    const elapsed = performance.now() - startTime

    // 50 full ecosystem rotations must finish in under 300ms total (<6ms per rotation)
    expect(elapsed).toBeLessThan(300)

    // The in-memory array must be strictly bounded by MAX_SIMULATED_AGENTS
    const simulatedAgents = manager.getOrganisms()
    expect(simulatedAgents.length).toBeLessThanOrEqual(350)
  })

  it('starts in prebiotic stage and accumulates organic complexity toward spontaneous biogenesis', () => {
    manager.initPlanet(planetConfig)
    const rng = new SeededRNG(42)

    let summary = manager.step(1, planetConfig, rng)
    expect(summary.totalPopulation).toBe(0)
    expect(summary.prebioticState.stage).toBe('prebiotic')

    // Run until biogenesis occurs
    for (let r = 2; r <= 35; r++) {
      summary = manager.step(r, planetConfig, rng)
      if (summary.totalPopulation > 0) break
    }

    expect(summary.totalPopulation).toBeGreaterThan(0)
    expect(summary.prebioticState.stage).toBe('inhabited')
  })

  it('exports and restores population state with full fidelity', () => {
    manager.initPlanet(planetConfig)
    const rng = new SeededRNG(42)
    manager.sparkBiogenesis(planetConfig, rng)

    // Advance 5 steps
    for (let r = 1; r <= 5; r++) {
      manager.step(r, planetConfig, rng)
    }

    const exported = manager.exportState()
    expect(exported.species.length).toBeGreaterThan(0)
    expect(exported.organisms.length).toBeGreaterThan(0)
    expect(exported.prebiotic.stage).toBe('inhabited')

    const newManager = new PopulationManager()
    newManager.restoreState(exported, planetConfig)

    expect(newManager.getSpeciesList().length).toBe(exported.species.length)
    expect(newManager.getOrganisms().length).toBe(exported.organisms.length)

    // Verify it continues stepping normally after restore
    const postStep = newManager.step(6, planetConfig, rng)
    expect(postStep.totalPopulation).toBeGreaterThan(0)
    expect(postStep.generation).toBeGreaterThan(0)
  })

  it('automatically triggers secondary biogenesis when extinct life re-emerges in fertile environment', () => {
    manager.initPlanet(planetConfig)
    const rng = new SeededRNG(777)

    // 1. Spark initial life
    manager.sparkBiogenesis(planetConfig, rng)
    expect(manager.getOrganisms().length).toBeGreaterThan(0)

    // 2. Simulate total extinction
    manager.restoreState(
      {
        currentGeneration: 5,
        nextOrganismId: 100,
        nextSpeciesId: 10,
        species: [],
        organisms: [],
        prebiotic: {
          stage: 'inhabited',
          organicComplexity: 1.0,
        },
      },
      planetConfig
    )

    // Step 1: Detects 0 organisms, transitions to extinct
    const extinctStep = manager.step(1, planetConfig, rng)
    expect(extinctStep.totalPopulation).toBe(0)
    expect(extinctStep.prebioticState.stage).toBe('extinct')

    // Advance until secondary abiogenesis triggers spontaneous resurgence
    let resurgenceStep = extinctStep
    for (let r = 2; r <= 40; r++) {
      resurgenceStep = manager.step(r, planetConfig, rng)
      if (resurgenceStep.totalPopulation > 0) break
    }

    // A brand new biosphere has spontaneously formed!
    expect(resurgenceStep.totalPopulation).toBeGreaterThan(0)
    expect(resurgenceStep.prebioticState.stage).toBe('inhabited')
    expect(resurgenceStep.speciesSummaries.length).toBeGreaterThan(0)
  })
})

