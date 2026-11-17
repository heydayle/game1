import type {
  Allele,
  Gene,
  GeneticLocus,
  Genotype,
  Phenotype,
} from './types.js'

export class GeneExpression {
  /**
   * Expresses a diploid gene pair into a single phenotypic value in [0.0, 1.0].
   */
  static expressGene(gene: Gene): number {
    const { alleleA, alleleB } = gene

    // If both have identical dominance
    if (alleleA.dominance === alleleB.dominance) {
      return (alleleA.value + alleleB.value) / 2.0
    }

    // Dominant overrides recessive
    if (alleleA.dominance === 'dominant' && alleleB.dominance === 'recessive') {
      return alleleA.value
    }
    if (alleleB.dominance === 'dominant' && alleleA.dominance === 'recessive') {
      return alleleB.value
    }

    // Codominant mixes proportionally
    if (alleleA.dominance === 'codominant' || alleleB.dominance === 'codominant') {
      return (alleleA.value + alleleB.value) / 2.0
    }

    return (alleleA.value + alleleB.value) / 2.0
  }

  /**
   * Translates a complete Genotype into concrete Phenotype attributes.
   */
  static expressGenotype(genotype: Genotype): Phenotype {
    const express = (locus: GeneticLocus): number => {
      const g = genotype.genes[locus]
      return g ? GeneExpression.expressGene(g) : 0.5
    }

    const rawThermal = express('thermalOptimum')
    const rawRange = express('thermalRange')
    const rawWater = express('waterConservation')
    const rawMetabolism = express('metabolicEfficiency')
    const rawRepro = express('reproductiveInvestment')
    const rawArmor = express('structuralArmor')
    const rawMobility = express('mobilityFactor')

    // 1. Thermal optimum: -40°C to +80°C
    const thermalOptimumCelsius = Math.round(-40 + rawThermal * 120)

    // 2. Tolerance buffer: 5°C (narrow specialist) to 35°C (broad generalist)
    // Note: broad range incurs a slight metabolic overhead!
    const thermalToleranceRangeCelsius = Math.round(5 + rawRange * 30)

    // 3. Water conservation: [0.0, 1.0]
    const waterConservation = Number(rawWater.toFixed(3))

    // 4. Metabolic rate: basal energy burned per rotation (0.4 to 2.8 units)
    // High mobility or broad thermal buffer increases metabolism
    const metabolicRate = Number(
      (0.4 + rawMetabolism * 1.6 + rawMobility * 0.4 + rawRange * 0.4).toFixed(2)
    )

    // 5. Reproduction strategy (r vs K strategy)
    // High rawRepro = K-strategy (1-2 offspring, well-endowed), Low = r-strategy (3-6 offspring)
    const clutchSize = Math.max(1, Math.round(6 - rawRepro * 5))
    const gestationRotations = Math.max(1, Math.round(1 + rawRepro * 3))

    // 6. Resistance to cosmic radiation and geological disturbance
    const radiationResistance = Number(rawArmor.toFixed(3))

    // 7. Mobility and dispersal factor
    const mobility = Number(rawMobility.toFixed(3))

    return {
      thermalOptimumCelsius,
      thermalToleranceRangeCelsius,
      waterConservation,
      metabolicRate,
      clutchSize,
      gestationRotations,
      radiationResistance,
      mobility,
    }
  }

  /**
   * Computes the normalized genetic Euclidean distance between two genotypes in [0.0, 1.0].
   */
  static calculateGeneticDistance(a: Genotype, b: Genotype): number {
    const loci: GeneticLocus[] = [
      'thermalOptimum',
      'thermalRange',
      'waterConservation',
      'metabolicEfficiency',
      'reproductiveInvestment',
      'structuralArmor',
      'mobilityFactor',
    ]

    let sumSquaredDiff = 0
    for (const locus of loci) {
      const valA = GeneExpression.expressGene(a.genes[locus])
      const valB = GeneExpression.expressGene(b.genes[locus])
      const diff = valA - valB
      sumSquaredDiff += diff * diff
    }

    return Math.sqrt(sumSquaredDiff / loci.length)
  }

  /**
   * Helper to instantiate a homozygous or heterozygous diploid gene.
   */
  static createGene(
    locus: GeneticLocus,
    valA: number,
    domA: Allele['dominance'] = 'dominant',
    valB: number = valA,
    domB: Allele['dominance'] = domA
  ): Gene {
    return {
      locus,
      alleleA: { id: `${locus}_a`, value: Math.max(0, Math.min(1, valA)), dominance: domA },
      alleleB: { id: `${locus}_b`, value: Math.max(0, Math.min(1, valB)), dominance: domB },
    }
  }
}

