/**
 * Core genetics types and contracts.
 *
 * Universal Evolution Model Extension (spec §5.2):
 *   GeneticLocus is now an open string union — the seven named Earth-phenotype loci
 *   are preserved as GeneticLocusCore for backward compatibility, but new loci may be
 *   added by the trait registry without changing this file.
 *
 *   GeneExpression operates on the actual keys present in genes: Record<string, Gene>,
 *   not on a fixed closed union. All existing code that uses the named loci remains valid.
 */

export type DominanceType = 'dominant' | 'recessive' | 'codominant'

export interface Allele {
  readonly id: string
  readonly value: number // Normalized [0.0, 1.0]
  readonly dominance: DominanceType
}

/**
 * Diploid gene representation consisting of two homologous alleles (maternal & paternal).
 * locus is typed as string to allow open extension by the trait registry.
 */
export interface Gene {
  readonly locus: string   // Open string — backward compat: GeneticLocusCore values are valid here
  readonly alleleA: Allele
  readonly alleleB: Allele
}

/**
 * The seven core Earth-phenotype loci.
 * Preserved as a named union for backward compatibility with existing code and tests.
 * @deprecated Use string loci for new trait definitions via the trait registry.
 */
export type GeneticLocusCore =
  | 'thermalOptimum'       // Preferred environmental temperature (maps to -40°C to +80°C)
  | 'thermalRange'         // Temperature buffer width (narrow specialized vs wide generalist)
  | 'waterConservation'    // Moisture retention & desiccation defense (0.0 to 1.0)
  | 'metabolicEfficiency'  // Energy consumption rate (0.0 = low basal, 1.0 = high energy)
  | 'reproductiveInvestment' // Clutch size vs parental energy investment
  | 'structuralArmor'      // Resistance to radiation and tectonic disturbance (0.0 to 1.0)
  | 'mobilityFactor'       // Dispersal and foraging radius (0.0 to 1.0)

/**
 * @deprecated Alias kept for backward compatibility — same as GeneticLocusCore.
 * New code should use string loci or GeneticLocusCore explicitly.
 */
export type GeneticLocus = GeneticLocusCore

/**
 * The organism's complete genetic information.
 * genes is Record<string, Gene> to support open trait registry loci.
 * All existing genotypes with GeneticLocusCore keys remain valid.
 *
 * HereditaryArchitecture (spec §5.2) defines the structural type of the hereditary system.
 */
export type HereditaryArchitecture =
  | 'diploid'            // Two alleles per locus (default — Earth-like)
  | 'haploid'            // One allele per locus
  | 'polyploid'          // Multiple copies per locus
  | 'segmented'          // Genetic material in separate segments
  | 'distributed'        // No single genome (speculative)
  | 'alternative'        // Non-nucleic-acid system (highly speculative)

export interface Genotype {
  readonly genes: Record<string, Gene>
  readonly hereditaryArchitecture?: HereditaryArchitecture  // Default: 'diploid' if absent
}

export interface Phenotype {
  readonly thermalOptimumCelsius: number
  readonly thermalToleranceRangeCelsius: number
  readonly waterConservation: number // [0.0, 1.0]
  readonly metabolicRate: number // Energy burned per rotation
  readonly clutchSize: number // Offspring per reproduction
  readonly gestationRotations: number // Maturity threshold
  readonly radiationResistance: number // [0.0, 1.0]
  readonly mobility: number // [0.0, 1.0]
}

import type {
  EvolutionTier,
  BiologicalTraits,
  OrganismDomain,
  TrophicRole,
  TaxonomicHierarchy,
  PopulationDemographics,
} from '../taxonomy/types.js'
import type { TraitProfile } from '../traits/types.js'

export interface SpeciesSummary {
  readonly id: string
  readonly name: string
  readonly color: string
  readonly population: number
  readonly generation: number
  readonly averageFitness: number
  readonly dominantTraits: {
    readonly thermalOptimum: number
    readonly waterConservation: number
    readonly resilience: number
  }
  readonly isExtinct: boolean

  // ── Legacy Earth-reference fields (backward compat) ──────────────────────
  readonly tier?: EvolutionTier
  readonly tierLabel?: string
  readonly tierRank?: number
  readonly scientificName?: string
  readonly biologicalTraits?: BiologicalTraits
  readonly domain?: OrganismDomain
  readonly domainLabel?: string
  readonly domainIcon?: string
  readonly trophicRole?: TrophicRole
  readonly trophicRoleLabel?: string
  readonly trophicLevel?: number
  readonly taxonomicHierarchy?: TaxonomicHierarchy
  readonly demographics?: PopulationDemographics

  // ── Universal Evolution Model fields ─────────────────────────────────────
  /**
   * Full universal trait profile from UniversalTaxonomyEngine.
   * Present when PopulationManager is operating in universal mode.
   * Falls back to biologicalTraits for display when absent.
   */
  readonly traitProfile?: TraitProfile

  // ── Shared fields ─────────────────────────────────────────────────────────
  readonly preySpeciesIds?: readonly string[]
  readonly predatorSpeciesIds?: readonly string[]
  readonly hungerState?: 'satiated' | 'hungry' | 'starving'
  readonly foodChainSummary?: string
  readonly emergenceRotation?: number
  readonly extinctionRotation?: number | null
  readonly lifespanRotations?: number
}

