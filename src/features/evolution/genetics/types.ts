/**
 * Core genetics types and contracts.
 */

export type DominanceType = 'dominant' | 'recessive' | 'codominant'

export interface Allele {
  readonly id: string
  readonly value: number // Normalized [0.0, 1.0]
  readonly dominance: DominanceType
}

/**
 * Diploid gene representation consisting of two homologous alleles (maternal & paternal).
 */
export interface Gene {
  readonly locus: GeneticLocus
  readonly alleleA: Allele
  readonly alleleB: Allele
}

/**
 * Loci that define the functional phenotype of the organism in the planetary environment.
 */
export type GeneticLocus =
  | 'thermalOptimum' // Preferred environmental temperature (maps to -40°C to +80°C)
  | 'thermalRange' // Temperature buffer width (narrow specialized vs wide generalist)
  | 'waterConservation' // Moisture retention & desiccation defense (0.0 to 1.0)
  | 'metabolicEfficiency' // Energy consumption rate (0.0 = low basal, 1.0 = high energy)
  | 'reproductiveInvestment' // Clutch size vs parental energy investment (0.0 = r-strategy, 1.0 = K-strategy)
  | 'structuralArmor' // Resistance to radiation and tectonic disturbance (0.0 to 1.0)
  | 'mobilityFactor' // Dispersal and foraging radius (0.0 to 1.0)

export interface Genotype {
  readonly genes: Record<GeneticLocus, Gene>
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
} from '../taxonomy/types.js'

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
  readonly preySpeciesIds?: readonly string[]
  readonly predatorSpeciesIds?: readonly string[]
  readonly hungerState?: 'satiated' | 'hungry' | 'starving'
  readonly foodChainSummary?: string
  readonly emergenceRotation?: number
  readonly extinctionRotation?: number | null
  readonly lifespanRotations?: number
}

