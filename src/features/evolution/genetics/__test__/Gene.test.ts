import { describe, it, expect } from 'vitest'
import { GeneExpression } from '../Gene.js'
import type { Genotype } from '../types.js'

describe('GeneExpression', () => {
  describe('expressGene (Mendelian dominance & recessiveness)', () => {
    it('expresses dominant allele over recessive allele', () => {
      const gene = GeneExpression.createGene('thermalOptimum', 0.8, 'dominant', 0.2, 'recessive')
      const val = GeneExpression.expressGene(gene)
      expect(val).toBe(0.8)
    })

    it('expresses dominant allele regardless of order', () => {
      const gene = GeneExpression.createGene('thermalOptimum', 0.1, 'recessive', 0.9, 'dominant')
      const val = GeneExpression.expressGene(gene)
      expect(val).toBe(0.9)
    })

    it('averages homozygous dominant or homozygous recessive alleles', () => {
      const geneDom = GeneExpression.createGene('thermalOptimum', 0.4, 'dominant', 0.8, 'dominant')
      expect(GeneExpression.expressGene(geneDom)).toBeCloseTo(0.6, 5)

      const geneRec = GeneExpression.createGene('thermalOptimum', 0.3, 'recessive', 0.7, 'recessive')
      expect(GeneExpression.expressGene(geneRec)).toBeCloseTo(0.5, 5)
    })

    it('averages codominant alleles', () => {
      const gene = GeneExpression.createGene('thermalOptimum', 0.2, 'codominant', 0.8, 'codominant')
      expect(GeneExpression.expressGene(gene)).toBeCloseTo(0.5, 5)
    })
  })

  describe('expressGenotype', () => {
    it('translates normalized genes into physical phenotype', () => {
      const genotype: Genotype = {
        genes: {
          thermalOptimum: GeneExpression.createGene('thermalOptimum', 0.5),
          thermalRange: GeneExpression.createGene('thermalRange', 0.5),
          waterConservation: GeneExpression.createGene('waterConservation', 0.7),
          metabolicEfficiency: GeneExpression.createGene('metabolicEfficiency', 0.3),
          reproductiveInvestment: GeneExpression.createGene('reproductiveInvestment', 0.6),
          structuralArmor: GeneExpression.createGene('structuralArmor', 0.8),
          mobilityFactor: GeneExpression.createGene('mobilityFactor', 0.4),
        },
      }

      const pheno = GeneExpression.expressGenotype(genotype)

      expect(pheno.thermalOptimumCelsius).toBe(20) // -40 + 0.5 * 120 = 20°C
      expect(pheno.thermalToleranceRangeCelsius).toBe(20) // 5 + 0.5 * 30 = 20°C
      expect(pheno.waterConservation).toBe(0.7)
      expect(pheno.radiationResistance).toBe(0.8)
      expect(pheno.clutchSize).toBeGreaterThanOrEqual(1)
      expect(pheno.gestationRotations).toBeGreaterThanOrEqual(1)
    })
  })

  describe('calculateGeneticDistance', () => {
    it('computes 0 distance between identical genotypes', () => {
      const g1: Genotype = {
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
      expect(GeneExpression.calculateGeneticDistance(g1, g1)).toBe(0)
    })

    it('computes positive distance between divergent genotypes', () => {
      const g1: Genotype = {
        genes: {
          thermalOptimum: GeneExpression.createGene('thermalOptimum', 0.1),
          thermalRange: GeneExpression.createGene('thermalRange', 0.1),
          waterConservation: GeneExpression.createGene('waterConservation', 0.1),
          metabolicEfficiency: GeneExpression.createGene('metabolicEfficiency', 0.1),
          reproductiveInvestment: GeneExpression.createGene('reproductiveInvestment', 0.1),
          structuralArmor: GeneExpression.createGene('structuralArmor', 0.1),
          mobilityFactor: GeneExpression.createGene('mobilityFactor', 0.1),
        },
      }

      const g2: Genotype = {
        genes: {
          thermalOptimum: GeneExpression.createGene('thermalOptimum', 0.9),
          thermalRange: GeneExpression.createGene('thermalRange', 0.9),
          waterConservation: GeneExpression.createGene('waterConservation', 0.9),
          metabolicEfficiency: GeneExpression.createGene('metabolicEfficiency', 0.9),
          reproductiveInvestment: GeneExpression.createGene('reproductiveInvestment', 0.9),
          structuralArmor: GeneExpression.createGene('structuralArmor', 0.9),
          mobilityFactor: GeneExpression.createGene('mobilityFactor', 0.9),
        },
      }

      const dist = GeneExpression.calculateGeneticDistance(g1, g2)
      expect(dist).toBeGreaterThan(0.5)
      expect(dist).toBeLessThanOrEqual(1.0)
    })
  })
})

