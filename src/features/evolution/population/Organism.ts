import { GeneExpression } from '../genetics/Gene.js'
import type { Genotype, Phenotype } from '../genetics/types.js'

export class Organism {
  readonly id: string
  readonly speciesId: string
  readonly genotype: Genotype
  readonly phenotype: Phenotype
  readonly generation: number
  cellId: number

  energy: number
  ageRotations: number
  fitness: number
  /** Number of physical biological individuals represented by this genetic cohort */
  cohortWeight: number

  constructor(
    id: string,
    speciesId: string,
    genotype: Genotype,
    generation = 1,
    initialEnergy = 5.0,
    cohortWeight = 1,
    cellId = 0
  ) {
    this.id = id
    this.speciesId = speciesId
    this.genotype = genotype
    this.phenotype = GeneExpression.expressGenotype(genotype)
    this.generation = generation
    this.energy = initialEnergy
    this.ageRotations = 0
    this.fitness = 1.0
    this.cohortWeight = Math.max(1, Math.round(cohortWeight))
    this.cellId = cellId
  }

  isFertile(): boolean {
    return (
      this.ageRotations >= this.phenotype.gestationRotations &&
      this.energy >= 3.5
    )
  }
}
