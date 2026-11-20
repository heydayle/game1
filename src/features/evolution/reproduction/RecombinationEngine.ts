import { SeededRNG } from '../../../shared/utils/seeded-rng.js'
import type { Allele, Gene, Genotype } from '../genetics/types.js'

export class RecombinationEngine {
  /**
   * Performs Mendelian sexual reproduction between two parent genotypes.
   * Independently segregates alleles at each locus to produce a recombinant offspring.
   * Works with any string loci — not restricted to GeneticLocusCore.
   */
  static sexualCross(
    parentA: Genotype,
    parentB: Genotype,
    rng: SeededRNG
  ): Genotype {
    // Build the union of all loci present in either parent
    const lociSet = new Set<string>([
      ...Object.keys(parentA.genes),
      ...Object.keys(parentB.genes),
    ])

    const childGenes: Record<string, Gene> = {}

    for (const locus of lociSet) {
      const geneA = parentA.genes[locus]
      const geneB = parentB.genes[locus]

      // If only one parent has this locus, inherit from that parent
      if (!geneA && geneB) {
        childGenes[locus] = { ...geneB, locus }
        continue
      }
      if (!geneB && geneA) {
        childGenes[locus] = { ...geneA, locus }
        continue
      }
      if (!geneA || !geneB) continue

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

    return {
      genes: childGenes,
      hereditaryArchitecture: parentA.hereditaryArchitecture ?? parentB.hereditaryArchitecture ?? 'diploid',
    }
  }

  /**
   * Performs asexual clonal reproduction (e.g. budding, binary fission).
   * Works with any string loci.
   */
  static asexualReplicate(parent: Genotype): Genotype {
    const loci = Object.keys(parent.genes)
    const childGenes: Record<string, Gene> = {}

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

    return {
      genes: childGenes,
      hereditaryArchitecture: parent.hereditaryArchitecture ?? 'diploid',
    }
  }
}

