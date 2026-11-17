import type { Phenotype } from '../genetics/types.js'
import type { PlanetConfig } from '../../genesis/types/genesis.js'

export interface EnvironmentalContext {
  readonly ambientTemperatureCelsius: number
  readonly oceanLevel: number
  readonly radiationLevel: PlanetConfig['environmentalConditions']['radiationLevel']
  readonly tectonicStability: PlanetConfig['environmentalConditions']['tectonicStability']
  readonly selectionPressure: number // [0.0, 1.0]
  readonly resourceAvailability: number // [0.0, 1.0]
}

export class SelectionEngine {
  /**
   * Computes organism fitness F in [0.0, 1.0] against current planetary environment.
   */
  static evaluateFitness(
    phenotype: Phenotype,
    env: EnvironmentalContext
  ): number {
    // 1. Thermal Fitness
    const deltaT = Math.abs(env.ambientTemperatureCelsius - phenotype.thermalOptimumCelsius)
    const tolerance = phenotype.thermalToleranceRangeCelsius

    let thermalFitness: number
    if (deltaT <= tolerance) {
      // Within buffer: gradual drop off
      thermalFitness = 1.0 - 0.25 * (deltaT / tolerance)
    } else {
      // Beyond buffer: steep gaussian penalty
      const excess = deltaT - tolerance
      thermalFitness = Math.max(0.01, 0.75 * Math.exp(-0.5 * Math.pow(excess / 8.0, 2)))
    }

    // 2. Hydration Fitness (Water Conservation vs Planetary Ocean Level)
    // Low ocean levels (<0.4) require high water conservation
    // High ocean levels (>0.65) require aquatic tolerance (lower desiccation overhead)
    let waterFitness = 1.0
    if (env.oceanLevel < 0.45) {
      const aridityDeficit = (0.45 - env.oceanLevel) * 2.0 // [0, 1]
      waterFitness = Math.max(0.05, 1.0 - aridityDeficit * (1.0 - phenotype.waterConservation))
    } else {
      waterFitness = 0.8 + 0.2 * phenotype.waterConservation
    }

    // 3. Radiation & Tectonic Resilience
    const radiationStress = SelectionEngine.getRadiationStress(env.radiationLevel)
    const tectonicStress = SelectionEngine.getTectonicStress(env.tectonicStability)
    const environmentalHazard = (radiationStress + tectonicStress) / 2.0

    const armorFitness = Math.max(
      0.05,
      1.0 - environmentalHazard * (1.0 - phenotype.radiationResistance)
    )

    // 4. Metabolic Sustainability
    // Higher metabolic rates consume more energy; penalize if resources are scarce
    const metabolicDemand = phenotype.metabolicRate / 2.8 // [0, 1]
    const metabolicFitness =
      env.resourceAvailability >= metabolicDemand
        ? 1.0
        : Math.max(0.1, 1.0 - (metabolicDemand - env.resourceAvailability) * 1.5)

    // Weighted composite fitness
    const compositeFitness =
      Math.pow(thermalFitness, 0.4) *
      Math.pow(waterFitness, 0.3) *
      Math.pow(armorFitness, 0.2) *
      Math.pow(metabolicFitness, 0.1)

    return Number(Math.max(0.0, Math.min(1.0, compositeFitness)).toFixed(4))
  }

  /**
   * Probability of surviving the current rotation based on fitness and selection pressure.
   */
  static calculateSurvivalProbability(
    fitness: number,
    selectionPressure: number
  ): number {
    // Higher selection pressure steepens the curve
    const exponent = 0.5 + selectionPressure * 2.0
    const rawProb = Math.pow(fitness, exponent)
    // Clamp so there's always a slight chance of survival or mortality
    return Math.max(0.05, Math.min(0.98, rawProb))
  }

  private static getRadiationStress(level: PlanetConfig['environmentalConditions']['radiationLevel']): number {
    switch (level) {
      case 'shielded':
        return 0.1
      case 'moderate':
        return 0.3
      case 'intense':
        return 0.65
      case 'extreme':
        return 0.95
    }
  }

  private static getTectonicStress(stability: PlanetConfig['environmentalConditions']['tectonicStability']): number {
    switch (stability) {
      case 'dormant':
        return 0.05
      case 'stable':
        return 0.2
      case 'active':
        return 0.55
      case 'cataclysmic':
        return 0.9
    }
  }
}

