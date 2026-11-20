import { describe, it, expect } from 'vitest'
import { RecombinationEngine } from '../RecombinationEngine.js'
import { GeneExpression } from '../../genetics/Gene.js'
import { SeededRNG } from '../../../../shared/utils/seeded-rng.js'
import type { Genotype } from '../../genetics/types.js'

describe('RecombinationEngine', () => {
  const parentA: Genotype = {
    genes: {
      thermalOptimum: GeneExpression.createGene('thermalOptimum', 0.1, 'dominant', 0.1, 'dominant'),
      thermalRange: GeneExpression.createGene('thermalRange', 0.1),
      waterConservation: GeneExpression.createGene('waterConservation', 0.1),
      metabolicEfficiency: GeneExpression.createGene('metabolicEfficiency', 0.1),
      reproductiveInvestment: GeneExpression.createGene('reproductiveInvestment', 0.1),
      structuralArmor: GeneExpression.createGene('structuralArmor', 0.1),
      mobilityFactor: GeneExpression.createGene('mobilityFactor', 0.1),
    },
  }

  const parentB: Genotype = {
    genes: {
      thermalOptimum: GeneExpression.createGene('thermalOptimum', 0.9, 'recessive', 0.9, 'recessive'),
      thermalRange: GeneExpression.createGene('thermalRange', 0.9),
      waterConservation: GeneExpression.createGene('waterConservation', 0.9),
      metabolicEfficiency: GeneExpression.createGene('metabolicEfficiency', 0.9),
      reproductiveInvestment: GeneExpression.createGene('reproductiveInvestment', 0.9),
      structuralArmor: GeneExpression.createGene('structuralArmor', 0.9),
      mobilityFactor: GeneExpression.createGene('mobilityFactor', 0.9),
    },
  }

  it('sexual cross inherits one allele from each parent', () => {
    const rng = new SeededRNG(42)
    const child = RecombinationEngine.sexualCross(parentA, parentB, rng)

    // Child should have alleleA from parent A (0.1) and alleleB from parent B (0.9)
    const thermalGene = child.genes.thermalOptimum
    expect(thermalGene!.alleleA.value).toBe(0.1)
    expect(thermalGene!.alleleB.value).toBe(0.9)
  })

  it('asexual replicate creates accurate clonal duplicate', () => {
    const clone = RecombinationEngine.asexualReplicate(parentA)
    expect(GeneExpression.calculateGeneticDistance(parentA, clone)).toBe(0)
  })
})

