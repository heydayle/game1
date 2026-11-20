/**
 * Universal Trait System — Type Definitions
 *
 * Models biological diversity as a data-driven registry of independent traits,
 * not as a fixed Earth-derived taxonomic ladder.
 *
 * Design policy (per spec §2):
 *  - Established evolutionary principles: used directly.
 *  - Earth-derived biology: a reference, never a mandatory template.
 *  - Speculative biology: explicitly labeled, assumptions configurable.
 */

// ---------------------------------------------------------------------------
// § 5.1  Life Architecture
// ---------------------------------------------------------------------------

export type LifeArchitecture =
  | 'unicellular'    // Single-cell organism
  | 'colonial'       // Cooperative multi-cell aggregate without differentiation
  | 'multicellular'  // Coordinated multicellular body
  | 'modular'        // Repeated structural units (rhizomes, coral polyps, etc.)
  | 'distributed'    // No clear individual boundary — speculative
  | 'hybrid'         // Combines two or more of the above

// ---------------------------------------------------------------------------
// § 5.2  Hereditary System
// ---------------------------------------------------------------------------

export type HereditarySystem =
  | 'linear_replicator'          // Single linear sequence (DNA-like)
  | 'complementary_replicator'   // Double-strand with complementary pairing
  | 'multi_strand'               // Three or more information strands
  | 'segmented'                  // Multiple separate genetic segments
  | 'distributed_heredity'       // Information distributed across network — speculative
  | 'hybrid_heredity'            // Mixed system
  | 'alternative_biochemical'    // Non-nucleic acid replication — highly speculative

// ---------------------------------------------------------------------------
// § 5.3  Energy Acquisition Strategy
// ---------------------------------------------------------------------------

export type EnergyStrategy =
  | 'photonic'         // Photosynthesis-analog (photon capture)
  | 'chemosynthetic'   // Chemical gradient energy extraction
  | 'thermal_gradient' // Thermal differential energy
  | 'electrical'       // Electrical potential exploitation
  | 'radiation'        // Ionizing-radiation energy — speculative
  | 'resource_absorption' // Absorptive heterotrophy (osmotroph-analog)
  | 'consumer'         // Ingestion of organic matter
  | 'predatory'        // Active capture of other organisms
  | 'parasitic'        // Resource extraction from host
  | 'symbiotic'        // Mutual energy exchange
  | 'hybrid_energy'    // Multiple simultaneous strategies

// ---------------------------------------------------------------------------
// § 5.4  Trophic Strategy (ecological role — not phylogenetic)
// ---------------------------------------------------------------------------

export type TrophicStrategy =
  | 'producer'         // Primary energy fixer
  | 'consumer'         // Secondary consumer (generalist herbivore-analog)
  | 'decomposer'       // Breaks down complex organic matter
  | 'recycler'         // Mineral cycling specialist
  | 'predator'         // Active predation
  | 'prey'             // Primary prey base
  | 'parasite'         // Exploits living host without consuming it
  | 'symbiont'         // Mutual benefit with other organisms
  | 'opportunist'      // Context-dependent strategy switching

// An organism may hold multiple trophic strategies simultaneously.
export type TrophicStrategySet = readonly TrophicStrategy[]

// ---------------------------------------------------------------------------
// § 5.6  Morphology
// ---------------------------------------------------------------------------

export type MorphologyTrait =
  | 'spherical'
  | 'compact'
  | 'radial'
  | 'bilateral'
  | 'asymmetrical'
  | 'segmented'
  | 'branched'
  | 'tubular'
  | 'flattened'
  | 'modular_body'
  | 'distributed_body'

// ---------------------------------------------------------------------------
// § 5.7  Locomotion
// ---------------------------------------------------------------------------

export type LocomotionTrait =
  | 'stationary'
  | 'passive_drift'
  | 'surface_glide'
  | 'crawling'
  | 'contractile'
  | 'swimming'
  | 'fluid_propulsion'
  | 'burrowing'
  | 'gliding'
  | 'powered_flight'
  | 'multi_mode'

// ---------------------------------------------------------------------------
// § 5.8  Reproduction Mode
// ---------------------------------------------------------------------------

export type ReproductionMode =
  | 'binary_fission'
  | 'multiple_fission'
  | 'budding'
  | 'fragmentation'
  | 'spore_based'
  | 'clonal'
  | 'genetic_mixing'           // Generalized sexual recombination
  | 'multi_parent'             // > 2 genetic contributors — speculative
  | 'environmental_fertilization'
  | 'conditional'              // Switches between modes based on context
  | 'symbiotic_reproduction'   // Requires another organism's participation
  | 'host_mediated'            // Parasite-like reproduction through host
  | 'alternative_replication'  // Highly speculative non-cellular replication

// ---------------------------------------------------------------------------
// § 5.9  Sensory Systems
// ---------------------------------------------------------------------------

export type SensoryTrait =
  | 'chemosensory'
  | 'photosensory'
  | 'mechanosensory'
  | 'thermosensory'
  | 'electrosensory'
  | 'magnetosensory'
  | 'spatial_sensing'
  | 'multi_sensory'

// ---------------------------------------------------------------------------
// § 5.10  Defense
// ---------------------------------------------------------------------------

export type DefenseTrait =
  | 'physical_armor'
  | 'chemical_defense'
  | 'camouflage'
  | 'mimicry'
  | 'structural_barrier'
  | 'regeneration'
  | 'environmental_resistance'
  | 'toxin_resistance'
  | 'evasion'
  | 'collective_defense'

// ---------------------------------------------------------------------------
// § 5.11  Behavior
// ---------------------------------------------------------------------------

export type BehaviorTrait =
  | 'reactive'
  | 'stimulus_response'
  | 'resource_seeking'
  | 'environmental_avoidance'
  | 'territorial'
  | 'cooperative'
  | 'group_coordination'
  | 'distributed_coordination'
  | 'learning_capable'
  | 'complex_adaptive'

// ---------------------------------------------------------------------------
// § 5.12  Life Cycle Parameters (numerical)
// ---------------------------------------------------------------------------

export interface LifeCycleParams {
  readonly lifespanGenerations: number         // Mean lifespan in generations
  readonly maturationThresholdRotations: number
  readonly reproductiveIntervalRotations: number
  readonly offspringCountMean: number
  readonly offspringCountVariance: number
  readonly offspringSurvivalBase: number       // [0,1]
  readonly growthRate: number                  // [0,1]
  readonly dormancyCapable: boolean
  readonly regenerationCapable: boolean
  readonly reproductiveInvestment: number      // [0,1] r vs K spectrum
}

// ---------------------------------------------------------------------------
// § 5.5  Environmental Tolerance Profile
// ---------------------------------------------------------------------------

export interface EnvironmentalToleranceProfile {
  readonly temperatureOptimum: number          // °C
  readonly temperatureRange: number            // °C half-width
  readonly pressureOptimumAtm: number
  readonly pressureRangeAtm: number
  readonly radiationResistance: number         // [0,1]
  readonly moistureConservation: number        // [0,1]
  readonly lightToleranceRange: [number, number] // [min, max] lux-analog
  readonly chemicalGradientAffinity: number    // [0,1] — how well it exploits gradients
  readonly substrateDependency: number         // [0,1] — 0=free-floating, 1=substrate-bound
}

// ---------------------------------------------------------------------------
// Trait Profile — the universal replacement for BiologicalTraits
// ---------------------------------------------------------------------------

/**
 * TraitProfile holds all resolved biological trait values for a species-equivalent.
 * It is the product of Genotype × PlanetConfig expression through the trait registry.
 *
 * Key design decisions:
 *  - No tier/rank ladder — complexityIndex is a derived observation, not a goal.
 *  - Multiple values allowed per category (a lineage can be both predator and symbiont).
 *  - Speculative traits always carry the isSpeculative flag to the UI.
 */
export interface TraitProfile {
  // Core identity
  readonly lineageId: string
  readonly profileVersion: number         // Increments when traits shift significantly

  // Life architecture (§5.1)
  readonly lifeArchitecture: LifeArchitecture

  // Hereditary system (§5.2)
  readonly hereditarySystem: HereditarySystem
  readonly isSpeculativeHeredity: boolean  // True if alternative_biochemical etc.

  // Energy (§5.3)
  readonly energyStrategies: readonly EnergyStrategy[]

  // Trophic (§5.4)
  readonly trophicStrategies: TrophicStrategySet

  // Environmental tolerance (§5.5)
  readonly environmentalTolerance: EnvironmentalToleranceProfile

  // Morphology (§5.6)
  readonly morphologyTraits: readonly MorphologyTrait[]

  // Locomotion (§5.7)
  readonly locomotionTraits: readonly LocomotionTrait[]

  // Reproduction (§5.8)
  readonly reproductionModes: readonly ReproductionMode[]

  // Sensory (§5.9)
  readonly sensoryTraits: readonly SensoryTrait[]

  // Defense (§5.10)
  readonly defenseTraits: readonly DefenseTrait[]

  // Behavior (§5.11)
  readonly behaviorTraits: readonly BehaviorTrait[]

  // Life cycle (§5.12)
  readonly lifeCycle: LifeCycleParams

  // Derived observations (not goals — do NOT use to gate advancement)
  readonly complexityIndex: number         // [0,1] — derived, not a rung
  readonly specialistScore: number         // [0,1] — generalist vs specialist
  readonly mobilityScore: number           // [0,1] — aggregated locomotion
  readonly metabolicDemand: number         // [0,1] — resource consumption rate

  // Classification display
  readonly classificationLabel: string     // Emergent label from traits
  readonly lineageLabel: string            // Planetary lineage descriptor
  readonly morphologyDescription: string   // Human-readable morphology summary
  readonly locomotionDescription: string
  readonly notableAdaptations: readonly string[]

  // Speculative biology flag (spec §2.C)
  readonly hasSpeculativeTraits: boolean
  readonly speculativeTraitIds: readonly string[]
}

// ---------------------------------------------------------------------------
// § 7  Dynamic Phylogenetic Classification
// ---------------------------------------------------------------------------

/**
 * Specifies how a species-equivalent boundary is defined.
 * Different organisms may use different classification modes.
 */
export type SpeciesEquivalentMode =
  | 'reproductive'    // Mayr biological species concept — reproductive isolation
  | 'genetic_cluster' // Phylogenetic: genetic distance clustering
  | 'asexual_lineage' // Clonal lineage — no sexual species concept applicable
  | 'population'      // Population-level classification
  | 'composite'       // Networked / modular organisms without clear individuals

/**
 * Phylogenetic hierarchy ranks — variable depth, presentation abstractions only.
 * These are NOT mandatory scientific ranks.
 */
export type PhylogeneticRank =
  | 'origin'
  | 'lineage'
  | 'major_clade'
  | 'clade'
  | 'subclade'
  | 'population'
  | 'species_equivalent'
  | 'variant'

/**
 * A single node in the phylogenetic tree.
 * Ancestry is tracked by reference, not by generation counter.
 */
export interface PhylogeneticNode {
  readonly id: string
  readonly parentId: string | null       // null = origin
  readonly rank: PhylogeneticRank
  readonly label: string
  readonly firstObservedRotation: number
  readonly lastObservedRotation: number | null  // null = extant
  readonly geneticDivergenceFromParent: number  // [0,1]
  readonly isExtinct: boolean
  readonly extinctionRotation: number | null
  // Classification integrity
  readonly speciesEquivalentMode: SpeciesEquivalentMode
  readonly populationSizeAtBranch: number
  readonly generationsBeforeBranch: number      // Minimum persistence requirement
}

/**
 * Records an evolutionary divergence event (replaces the old 'ascension' event type).
 * Divergence may be:
 *  - increasing complexity    (but NOT mandatory)
 *  - decreasing complexity    (regressive evolution)
 *  - lateral (no change)
 *  - convergent               (similar traits, unrelated ancestry)
 *  - local adaptation
 */
export type DivergenceDirection =
  | 'increasing_complexity'
  | 'decreasing_complexity'
  | 'lateral_adaptation'
  | 'convergent_trait'
  | 'local_specialization'
  | 'generalist_broadening'
  | 'extinction_trajectory'

export interface DivergenceEvent {
  readonly id: string
  readonly speciesId: string
  readonly speciesName: string
  readonly rotation: number
  readonly direction: DivergenceDirection
  readonly geneticDistance: number       // from ancestor at branch point
  readonly affectedTraitCategories: readonly string[]
  readonly description: string
  readonly isSpeculative: boolean
}

// ---------------------------------------------------------------------------
// Trait Registry — Definition Schema
// ---------------------------------------------------------------------------

/**
 * Categories matching spec §5.1–5.12 exactly.
 */
export type TraitCategory =
  | 'LifeArchitecture'
  | 'HereditarySystem'
  | 'EnergyAcquisition'
  | 'TrophicStrategy'
  | 'EnvironmentalTolerance'
  | 'Morphology'
  | 'Locomotion'
  | 'Reproduction'
  | 'SensorySystems'
  | 'Defense'
  | 'Behavior'
  | 'LifeCycle'

/**
 * A single registered trait definition.
 * Adding a new trait requires ONLY adding a new entry here —
 * it must not require changes to PopulationManager, Genetics Engine, or Taxonomy Engine.
 */
export interface TraitDefinition {
  readonly id: string                   // Namespaced: 'life_arch.unicellular'
  readonly category: TraitCategory
  readonly displayName: string
  readonly description: string
  readonly prerequisites: readonly string[]       // Other trait ids required first
  readonly incompatibleWith: readonly string[]    // Mutually exclusive trait ids
  /**
   * Maps raw genotype value [0,1] × planet environment → resolved trait presence [0,1].
   * Value >= 0.5 means the trait is expressed.
   */
  readonly expressionThreshold: number            // [0,1] minimum value to express
  /**
   * Fitness multiplier when this trait is expressed.
   * Receives the expressed value [0,1] and returns a multiplier (0.5 to 2.0 typical).
   * Context-dependent: same trait may be beneficial or detrimental by environment.
   */
  readonly baseFitnessModifier: number            // Applied when expressed
  readonly mutationBias: number                   // Relative mutation frequency weight
  readonly tags: readonly string[]                // 'convergent', 'adaptive', etc.
  readonly visualTag: string                      // Emoji for UI
  readonly isSpeculative: boolean                 // Per spec §2.C
  readonly speculativeAssumptions: readonly string[] // List of assumptions when speculative
  readonly version: string                        // Semver for registry versioning
}

/**
 * Result of ValidateTraitCompatibility.
 */
export interface TraitValidationResult {
  readonly isValid: boolean
  readonly violations: readonly {
    readonly traitId: string
    readonly conflictingTraitId: string
    readonly reason: string
  }[]
  readonly warnings: readonly {
    readonly traitId: string
    readonly message: string
  }[]
}

/**
 * Result of classifying a species-equivalent population.
 */
export interface ClassificationResult {
  readonly speciesEquivalentId: string
  readonly mode: SpeciesEquivalentMode
  readonly label: string
  readonly isNewSpeciation: boolean
  readonly geneticDistanceFromAncestor: number
  readonly populationPersistenceGenerations: number
}

/**
 * Signal of convergent evolution between two unrelated lineages.
 * Convergence does NOT merge lineages — ancestry is unaffected.
 */
export interface ConvergenceSignal {
  readonly lineageIdA: string
  readonly lineageIdB: string
  readonly sharedTraitIds: readonly string[]
  readonly traitSimilarityScore: number  // [0,1]
  readonly isPhylogeneticallyRelated: boolean  // Should be false for true convergence
  readonly description: string
}

