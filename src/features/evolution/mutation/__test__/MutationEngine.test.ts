import { describe, it, expect } from 'vitest'
import { MutationEngine } from '../MutationEngine.js'
import { SeededRNG } from '../../../../shared/utils/seeded-rng.js'
import { GeneExpression } from '../../genetics/Gene.js'
import type { Genotype } from '../../genetics/types.js'

describe('MutationEngine', () => {
  const baseConfig = {
    baseMutationRate: 1.0, // Force 100% mutation check for testing
    mutationRateMultiplier: 1.0,
    radiationLevel: 'moderate' as const,
  }

  it('mutates allele values within valid [0.0, 1.0] boundaries', () => {
    const rng = new SeededRNG(42)
    const allele = { id: 'test_allele', value: 0.95, dominance: 'dominant' as const }

    for (let i = 0; i < 50; i++) {
      const mutated = MutationEngine.mutateAllele(allele, baseConfig, rng)
      expect(mutated.value).toBeGreaterThanOrEqual(0.0)
      expect(mutated.value).toBeLessThanOrEqual(1.0)
    }
  })

  it('elevates mutation frequency under extreme radiation', () => {
    const lowRadConfig = {
      baseMutationRate: 0.05,
      mutationRateMultiplier: 1.0,
      radiationLevel: 'shielded' as const,
    }

    const highRadConfig = {
      baseMutationRate: 0.05,
      mutationRateMultiplier: 1.0,
      radiationLevel: 'extreme' as const,
    }

    let lowMutCount = 0
    let highMutCount = 0

    const rng1 = new SeededRNG(100)
    const rng2 = new SeededRNG(100)
    const allele = { id: 'test', value: 0.5, dominance: 'dominant' as const }

    for (let i = 0; i < 1000; i++) {
      if (MutationEngine.mutateAllele(allele, lowRadConfig, rng1).value !== 0.5) {
        lowMutCount++
      }
      if (MutationEngine.mutateAllele(allele, highRadConfig, rng2).value !== 0.5) {
        highMutCount++
      }
    }

    expect(highMutCount).toBeGreaterThan(lowMutCount)
  })

  it('mutates complete genotypes deterministically with same seed', () => {
    const genotype: Genotype = {
      genes: {
        thermalOptimum: GeneExpression.createGene('thermalOptimum', 0.5),
        thermalRange: GeneExpression.createGene('thermalRange', 0.5),
        waterConservation: GeneExpression.createGene('waterConservation', 0.5),
        metabolicEfficiency: GeneExpression.createGene('metabolicEfficiency', 0.5),
        reproductiveInvestment: GeneExpression.createGene('reproductiveInvestment', 0.5),
        structuralArmor: GeneExpression.createGene('structuralArmor', 0.5),
        mobilityFactor: GeneExpression.createGene('mobilityFactor', 0.5),
      },
    }

    const rngA = new SeededRNG(777)
    const rngB = new SeededRNG(777)

    const mutA = MutationEngine.mutateGenotype(genotype, baseConfig, rngA)
    const mutB = MutationEngine.mutateGenotype(genotype, baseConfig, rngB)

    expect(mutA).toEqual(mutB)
  })
})

