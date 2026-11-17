import { SeededRNG } from '../../../shared/utils/seeded-rng.js'
import type { Allele, Gene, GeneticLocus, Genotype } from '../genetics/types.js'

export class RecombinationEngine {
  /**
   * Performs Mendelian sexual reproduction between two parent genotypes.
   * Independently segregates alleles at each locus to produce a recombinant offspring.
   */
  static sexualCross(
    parentA: Genotype,
    parentB: Genotype,
    rng: SeededRNG
  ): Genotype {
    const loci: GeneticLocus[] = [
      'thermalOptimum',
      'thermalRange',
      'waterConservation',
      'metabolicEfficiency',
      'reproductiveInvestment',
      'structuralArmor',
      'mobilityFactor',
    ]

    const childGenes = {} as Record<GeneticLocus, Gene>

    for (const locus of loci) {
      const geneA = parentA.genes[locus]
      const geneB = parentB.genes[locus]

      // Segregate one allele from parent A (50% chance A vs B)
      const gameteA: Allele =
        rng.next() < 0.5 ? geneA.alleleA : geneA.alleleB

      // Segregate one allele from parent B (50% chance A vs B)
      const gameteB: Allele =
        rng.next() < 0.5 ? geneB.alleleA : geneB.alleleB

      childGenes[locus] = {
        locus,
        alleleA: { ...gameteA, id: `${locus}_m` },
        alleleB: { ...gameteB, id: `${locus}_p` },
      }
    }

    return { genes: childGenes }
  }

  /**
   * Performs asexual clonal reproduction (e.g. budding, binary fission).
   */
  static asexualReplicate(parent: Genotype): Genotype {
    const loci = Object.keys(parent.genes) as GeneticLocus[]
    const childGenes = {} as Record<GeneticLocus, Gene>

    for (const locus of loci) {
      const g = parent.genes[locus]
      if (g) {
        childGenes[locus] = {
          locus,
          alleleA: { ...g.alleleA },
          alleleB: { ...g.alleleB },
        }
      }
    }

    return { genes: childGenes }
  }
}

