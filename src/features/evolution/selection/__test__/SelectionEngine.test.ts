import { describe, it, expect } from 'vitest'
import { SelectionEngine, type EnvironmentalContext } from '../SelectionEngine.js'
import type { Phenotype } from '../../genetics/types.js'

describe('SelectionEngine', () => {
  const temperatePhenotype: Phenotype = {
    thermalOptimumCelsius: 20,
    thermalToleranceRangeCelsius: 15, // Tolerates 5°C to 35°C
    waterConservation: 0.6,
    metabolicRate: 1.0,
    clutchSize: 3,
    gestationRotations: 2,
    radiationResistance: 0.6,
    mobility: 0.5,
  }

  const baseEnv: EnvironmentalContext = {
    ambientTemperatureCelsius: 20,
    oceanLevel: 0.5,
    radiationLevel: 'moderate',
    tectonicStability: 'stable',
    selectionPressure: 0.5,
    resourceAvailability: 0.8,
  }

  it('awards high fitness to well-adapted organisms in ideal environment', () => {
    const fitness = SelectionEngine.evaluateFitness(temperatePhenotype, baseEnv)
    expect(fitness).toBeGreaterThan(0.8)
    expect(fitness).toBeLessThanOrEqual(1.0)
  })

  it('penalizes fitness when ambient temperature exceeds tolerance buffer', () => {
    const freezingEnv: EnvironmentalContext = {
      ...baseEnv,
      ambientTemperatureCelsius: -25, // 45°C away from 20°C, buffer is 15°C
    }

    const fitness = SelectionEngine.evaluateFitness(temperatePhenotype, freezingEnv)
    expect(fitness).toBeLessThan(0.3)
  })

  it('penalizes low water conservation in arid low-ocean worlds', () => {
    const aridEnv: EnvironmentalContext = {
      ...baseEnv,
      oceanLevel: 0.25, // Very dry world
    }

    const thirstyPhenotype: Phenotype = {
      ...temperatePhenotype,
      waterConservation: 0.1, // Poor water retention
    }

    const desertPhenotype: Phenotype = {
      ...temperatePhenotype,
      waterConservation: 0.95, // Excellent water retention
    }

    const fitnessThirsty = SelectionEngine.evaluateFitness(thirstyPhenotype, aridEnv)
    const fitnessDesert = SelectionEngine.evaluateFitness(desertPhenotype, aridEnv)

    expect(fitnessDesert).toBeGreaterThan(fitnessThirsty)
  })

  it('calculates survival probability bounded within [0.05, 0.98]', () => {
    expect(SelectionEngine.calculateSurvivalProbability(1.0, 0.5)).toBeCloseTo(0.98, 2)
    expect(SelectionEngine.calculateSurvivalProbability(0.0, 0.9)).toBe(0.05)
  })
})

