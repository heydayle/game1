import { SeededRNG } from '../../../shared/utils/seeded-rng.js'
import type { Allele, DominanceType, Gene, Genotype, GeneticLocus } from '../genetics/types.js'

export interface MutationConfig {
  readonly baseMutationRate: number // e.g. 0.05 per locus
  readonly mutationRateMultiplier: number // from PlanetConfig (0.5 to 3.0)
  readonly radiationLevel: 'shielded' | 'moderate' | 'intense' | 'extreme'
}

export class MutationEngine {
  /**
   * Mutates a single allele according to environmental mutation pressures.
   */
  static mutateAllele(
    allele: Allele,
    config: MutationConfig,
    rng: SeededRNG
  ): Allele {
    const radiationMultiplier = MutationEngine.getRadiationMultiplier(config.radiationLevel)
    const effectiveChance = config.baseMutationRate * config.mutationRateMultiplier * radiationMultiplier

    // Roll mutation check
    if (rng.next() > effectiveChance) {
      return allele // No mutation
    }

    let newValue = allele.value
    let newDominance = allele.dominance

    // Roll mutation category
    const roll = rng.next()
    if (roll < 0.75) {
      // 1. Minor point mutation: ±0.04 to ±0.12 drift
      const delta = rng.nextFloat(-0.08, 0.08)
      newValue = Math.max(0.0, Math.min(1.0, newValue + delta))
    } else if (roll < 0.92) {
      // 2. Significant shift: ±0.15 to ±0.30
      const delta = rng.nextFloat(-0.25, 0.25)
      newValue = Math.max(0.0, Math.min(1.0, newValue + delta))
    } else {
      // 3. Dominance shift
      const dominances: DominanceType[] = ['dominant', 'recessive', 'codominant']
      const filtered = dominances.filter((d) => d !== allele.dominance)
      const picked = filtered[rng.nextInt(0, filtered.length - 1)]
      if (picked) newDominance = picked
    }

    return {
      id: `${allele.id}_mut`,
      value: Number(newValue.toFixed(4)),
      dominance: newDominance,
    }
  }

  /**
   * Mutates a diploid gene pair.
   */
  static mutateGene(gene: Gene, config: MutationConfig, rng: SeededRNG): Gene {
    return {
      locus: gene.locus,
      alleleA: MutationEngine.mutateAllele(gene.alleleA, config, rng),
      alleleB: MutationEngine.mutateAllele(gene.alleleB, config, rng),
    }
  }

  /**
   * Mutates an entire genotype.
   */
  static mutateGenotype(
    genotype: Genotype,
    config: MutationConfig,
    rng: SeededRNG
  ): Genotype {
    const loci = Object.keys(genotype.genes) as GeneticLocus[]
    const newGenes = {} as Record<GeneticLocus, Gene>

    for (const locus of loci) {
      const g = genotype.genes[locus]
      if (g) {
        newGenes[locus] = MutationEngine.mutateGene(g, config, rng)
      }
    }

    return { genes: newGenes }
  }

  private static getRadiationMultiplier(level: MutationConfig['radiationLevel']): number {
    switch (level) {
      case 'shielded':
        return 0.6
      case 'moderate':
        return 1.0
      case 'intense':
        return 1.8
      case 'extreme':
        return 3.2
    }
  }
}

