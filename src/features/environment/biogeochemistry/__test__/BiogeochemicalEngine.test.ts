import { describe, it, expect, beforeEach } from 'vitest'
import { BiogeochemicalEngine } from '../BiogeochemicalEngine.js'
import { GenesisEngine } from '../../../genesis/services/GenesisEngine.js'
import type { PlanetConfig } from '../../../genesis/types/genesis.js'
import { DEFAULT_PERTURBATIONS } from '../../../disasters/constants.js'

describe('BiogeochemicalEngine', () => {
  let engine: BiogeochemicalEngine
  let testPlanet: PlanetConfig

  const defaultAnswers: Record<number, string> = {
    1: 'q1_magnetic',
    2: 'q2_meridian',
    3: 'q3_balanced',
    4: 'q4_shield',
    5: 'q5_earth',
    6: 'q6_solar',
    7: 'q7_carbonaceous',
    8: 'q8_pools',
    9: 'q9_dynamic',
    10: 'q10_resilience',
  }

  beforeEach(() => {
    engine = new BiogeochemicalEngine()
    testPlanet = GenesisEngine.generatePlanet(defaultAnswers, 12345)
  })

  it('maintains exact 100.00% atmospheric gas conservation', () => {
    const state = engine.step(10, 0.25, testPlanet, 5000, [], DEFAULT_PERTURBATIONS)
    const atm = state.atmospheric
    const totalGas = Number(
      (
        atm.nitrogen +
        atm.oxygen +
        atm.carbonDioxide +
        atm.methane +
        atm.waterVapor +
        atm.nobleGases
      ).toFixed(2)
    )
    expect(totalGas).toBe(100.0)
  })

  it('maintains exact 100.0% crustal elemental conservation', () => {
    const state = engine.step(10, 0.25, testPlanet, 5000, [], DEFAULT_PERTURBATIONS)
    const elem = state.elemental
    const totalElem = Number(
      (
        elem.silicatesRock +
        elem.ironMetals +
        elem.waterVolatiles +
        elem.carbonOrganics
      ).toFixed(1)
    )
    expect(totalElem).toBe(100.0)
  })

  it('produces diurnal oscillation in water vapor during planetary spin', () => {
    // Noon vs Midnight equivalent phase
    const dayState = engine.step(5, 0.25, testPlanet, 0, [], DEFAULT_PERTURBATIONS)
    const nightState = engine.step(5, 0.75, testPlanet, 0, [], DEFAULT_PERTURBATIONS)

    // Noon has positive diurnal flux, night has negative diurnal flux
    expect(dayState.atmospheric.waterVapor).toBeGreaterThan(
      nightState.atmospheric.waterVapor
    )
  })

  it('accumulates biogenic oxygen and organic carbon under population growth', () => {
    const primordialPlanet: PlanetConfig = {
      ...testPlanet,
      atmosphericComposition: {
        nitrogen: 88.0,
        oxygen: 0.1,
        carbonDioxide: 9.0,
        methane: 1.5,
        waterVapor: 0.8,
        nobleGases: 0.6,
        pressureAtm: 1.2,
      },
      elementalComposition: {
        silicatesRock: 55.0,
        ironMetals: 35.0,
        waterVolatiles: 9.5,
        carbonOrganics: 0.5,
      },
    }

    engine.reset(primordialPlanet)
    const initialState = engine.step(0, 0, primordialPlanet, 0)

    // Simulate 50 rotations with thriving population
    let currentState = initialState
    for (let r = 1; r <= 50; r++) {
      currentState = engine.step(
        r,
        0.5,
        primordialPlanet,
        100_000,
        [
          {
            id: 'sp_1',
            name: 'Cyanophyta',
            color: '#10b981',
            population: 100_000,
            generation: 1,
            averageFitness: 0.85,
            isExtinct: false,
            dominantTraits: {
              thermalOptimum: 20,
              waterConservation: 0.5,
              resilience: 0.8,
            },
          },
        ],
        DEFAULT_PERTURBATIONS
      )
    }

    expect(currentState.atmospheric.oxygen).toBeGreaterThan(
      initialState.atmospheric.oxygen
    )
    expect(currentState.elemental.carbonOrganics).toBeGreaterThan(
      initialState.elemental.carbonOrganics
    )
  })

  it('responds dynamically to supervolcano disaster with CO2 surge', () => {
    const calmState = engine.step(10, 0, testPlanet, 0, [], DEFAULT_PERTURBATIONS)
    const volcanicPerturbations = {
      ...DEFAULT_PERTURBATIONS,
      atmosphericDust: 0.8,
      temperatureDeltaCelsius: 6.0,
    }
    const volcanicState = engine.step(
      11,
      0,
      testPlanet,
      0,
      [],
      volcanicPerturbations
    )

    expect(volcanicState.atmospheric.carbonDioxide).toBeGreaterThan(
      calmState.atmospheric.carbonDioxide
    )
    expect(volcanicState.dominantBiochemicalRegime).toBe('Volcanic Greenhouse')
  })

  it('freezes water vapor into glacial sheets during Ice Age climate shift', () => {
    const normalState = engine.step(10, 0, testPlanet, 0, [], DEFAULT_PERTURBATIONS)
    const iceAgePerturbations = {
      ...DEFAULT_PERTURBATIONS,
      temperatureDeltaCelsius: -15.0,
    }
    const glacialState = engine.step(
      11,
      0,
      testPlanet,
      0,
      [],
      iceAgePerturbations
    )

    expect(glacialState.atmospheric.waterVapor).toBeLessThan(
      normalState.atmospheric.waterVapor
    )
    expect(glacialState.dominantBiochemicalRegime).toBe('Glacial Cryo-Lock')
  })

  it('supports full export and restore of biogenic accumulation', () => {
    // Accumulate biogenic shift
    for (let r = 1; r <= 20; r++) {
      engine.step(r, 0, testPlanet, 50_000, [], DEFAULT_PERTURBATIONS)
    }
    const exported = engine.exportState()

    const restoredEngine = new BiogeochemicalEngine()
    restoredEngine.restoreState(exported)

    const state1 = engine.step(21, 0, testPlanet, 50_000, [], DEFAULT_PERTURBATIONS)
    const state2 = restoredEngine.step(
      21,
      0,
      testPlanet,
      50_000,
      [],
      DEFAULT_PERTURBATIONS
    )

    expect(state2.atmospheric.oxygen).toBeCloseTo(state1.atmospheric.oxygen, 1)
    expect(state2.elemental.carbonOrganics).toBeCloseTo(
      state1.elemental.carbonOrganics,
      1
    )
  })
})
