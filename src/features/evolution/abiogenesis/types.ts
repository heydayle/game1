/**
 * Domain types for Prebiotic Chemistry, Primordial Soup, and Abiogenesis.
 * Models the chemical evolution of life from planetary elements prior to biological populations.
 */

export type LifeStage = 'prebiotic' | 'inhabited' | 'extinct'

export interface PrebioticState {
  /** Current planetary life stage */
  readonly stage: LifeStage
  /** Overall chemical fertility index of the planet [0, 1] */
  readonly chemicalFertility: number
  /** Organic chemical complexity progress toward spontaneous abiogenesis [0, 1] */
  readonly organicComplexity: number
  /** Liquid water solvent viability score [0, 1] */
  readonly waterViability: number
  /** Organic building block availability (carbon & nitrogen compounds) [0, 1] */
  readonly organicAbundance: number
  /** Catalytic energy flux (geothermal, solar UV, mineral catalysts) [0, 1] */
  readonly catalystEnergy: number
  /** Whether the primordial soup meets minimum threshold to spark biogenesis */
  readonly biogenesisReadiness: boolean
  /** Progenitor archetypal lineage name derived from chemical composition */
  readonly chemicalLineageArchetype: string
  /** Human-readable status description of the prebiotic soup */
  readonly statusDescription: string
}

