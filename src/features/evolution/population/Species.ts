import type { Genotype, SpeciesSummary } from '../genetics/types.js'
import type { Organism } from './Organism.js'

const SPECIES_PALETTES = [
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#84cc16', // Lime
  '#f97316', // Orange
  '#14b8a6', // Teal
]

export class Species {
  readonly id: string
  readonly name: string
  readonly color: string
  readonly foundingGenotype: Genotype
  readonly emergenceRotation: number

  isExtinct = false
  extinctionRotation: number | null = null
  generation = 1

  constructor(
    id: string,
    name: string,
    foundingGenotype: Genotype,
    emergenceRotation = 0,
    colorIndex = 0,
    customColor?: string
  ) {
    this.id = id
    this.name = name
    this.foundingGenotype = foundingGenotype
    this.emergenceRotation = emergenceRotation
    this.color = customColor ?? SPECIES_PALETTES[colorIndex % SPECIES_PALETTES.length] ?? '#10b981'
  }

  toSummary(livingMembers: readonly Organism[]): SpeciesSummary {
    let pop = 0
    let weightedFitness = 0
    let weightedThermal = 0
    let weightedWater = 0
    let weightedResilience = 0

    if (livingMembers.length > 0) {
      for (const m of livingMembers) {
        const weight = m.cohortWeight
        pop += weight
        weightedFitness += m.fitness * weight
        weightedThermal += m.phenotype.thermalOptimumCelsius * weight
        weightedWater += m.phenotype.waterConservation * weight
        weightedResilience += m.phenotype.radiationResistance * weight
      }
      if (pop > 0) {
        weightedFitness /= pop
        weightedThermal /= pop
        weightedWater /= pop
        weightedResilience /= pop
      }
    }

    return {
      id: this.id,
      name: this.name,
      color: this.color,
      population: pop,
      generation: this.generation,
      averageFitness: Number(weightedFitness.toFixed(3)),
      dominantTraits: {
        thermalOptimum: Math.round(weightedThermal),
        waterConservation: Number(weightedWater.toFixed(2)),
        resilience: Number(weightedResilience.toFixed(2)),
      },
      isExtinct: this.isExtinct,
    }
  }
}
