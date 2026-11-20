/**
 * Universal Trait Registry
 *
 * A data-driven registry of biological trait definitions spanning all 12 trait
 * categories from the spec (§5.1–5.12).
 *
 * Design rules:
 *  - Adding a new trait requires ONLY adding an entry here.
 *  - No changes required to PopulationManager, Genetics Engine, or Taxonomy Engine.
 *  - Speculative traits are explicitly labeled (spec §2.C).
 *  - Invalid trait combinations are rejected or flagged, never silently permitted.
 */

import type {
  TraitCategory,
  TraitDefinition,
  TraitValidationResult,
} from './types.js'

// ---------------------------------------------------------------------------
// Registry entries — organized by category
// ---------------------------------------------------------------------------

const TRAIT_DEFINITIONS: readonly TraitDefinition[] = [

  // ═══════════════════════════════════════════════════════════════════════
  // § 5.1  Life Architecture
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'life_arch.unicellular',
    category: 'LifeArchitecture',
    displayName: 'Unicellular Organization',
    description: 'Organism exists as a single cell. All biological functions are performed within one cellular unit.',
    prerequisites: [],
    incompatibleWith: ['life_arch.multicellular', 'life_arch.colonial'],
    expressionThreshold: 0.0,
    baseFitnessModifier: 1.0,
    mutationBias: 0.3,
    tags: ['foundational', 'established'],
    visualTag: '🦠',
    isSpeculative: false,
    speculativeAssumptions: [],
    version: '1.0.0',
  },
  {
    id: 'life_arch.colonial',
    category: 'LifeArchitecture',
    displayName: 'Colonial Organization',
    description: 'Cooperative aggregate of cells without true tissue differentiation. Individual cells retain basic autonomy.',
    prerequisites: ['life_arch.unicellular'],
    incompatibleWith: ['life_arch.distributed'],
    expressionThreshold: 0.4,
    baseFitnessModifier: 1.1,
    mutationBias: 0.25,
    tags: ['transitional', 'established'],
    visualTag: '🧫',
    isSpeculative: false,
    speculativeAssumptions: [],
    version: '1.0.0',
  },
  {
    id: 'life_arch.multicellular',
    category: 'LifeArchitecture',
    displayName: 'Multicellular Organization',
    description: 'Coordinated multicellular body with cell specialization. Cells permanently commit to differentiated roles.',
    prerequisites: ['life_arch.colonial'],
    incompatibleWith: ['life_arch.unicellular'],
    expressionThreshold: 0.55,
    baseFitnessModifier: 1.2,
    mutationBias: 0.2,
    tags: ['established'],
    visualTag: '🌿',
    isSpeculative: false,
    speculativeAssumptions: [],
    version: '1.0.0',
  },
  {
    id: 'life_arch.modular',
    category: 'LifeArchitecture',
    displayName: 'Modular Organization',
    description: 'Body composed of repeated structural modules. Modules may be semi-independent.',
    prerequisites: [],
    incompatibleWith: [],
    expressionThreshold: 0.5,
    baseFitnessModifier: 1.05,
    mutationBias: 0.2,
    tags: ['established'],
    visualTag: '🪸',
    isSpeculative: false,
    speculativeAssumptions: [],
    version: '1.0.0',
  },
  {
    id: 'life_arch.distributed',
    category: 'LifeArchitecture',
    displayName: 'Distributed Organization',
    description: 'No clear individual boundary. Biological functions distributed across a network of semi-autonomous units.',
    prerequisites: [],
    incompatibleWith: ['life_arch.unicellular', 'life_arch.colonial'],
    expressionThreshold: 0.6,
    baseFitnessModifier: 0.95,
    mutationBias: 0.15,
    tags: ['speculative', 'exotic'],
    visualTag: '🕸️',
    isSpeculative: true,
    speculativeAssumptions: [
      'Assumes information coherence across distributed nodes without central nervous system analog.',
      'Assumes some mechanism for distributed genetic expression.',
    ],
    version: '1.0.0',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // § 5.2  Hereditary System
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'heredity.linear_replicator',
    category: 'HereditarySystem',
    displayName: 'Linear Sequence Replicator',
    description: 'Genetic information encoded in a single linear sequence. Analogous to single-stranded RNA/DNA.',
    prerequisites: [],
    incompatibleWith: ['heredity.complementary_replicator', 'heredity.alternative_biochemical'],
    expressionThreshold: 0.0,
    baseFitnessModifier: 1.0,
    mutationBias: 0.4,
    tags: ['foundational', 'established'],
    visualTag: '🧬',
    isSpeculative: false,
    speculativeAssumptions: [],
    version: '1.0.0',
  },
  {
    id: 'heredity.complementary_replicator',
    category: 'HereditarySystem',
    displayName: 'Complementary Replicator',
    description: 'Double-strand information system with complementary pairing, enabling error-correction.',
    prerequisites: ['heredity.linear_replicator'],
    incompatibleWith: ['heredity.alternative_biochemical'],
    expressionThreshold: 0.4,
    baseFitnessModifier: 1.15,
    mutationBias: 0.3,
    tags: ['established'],
    visualTag: '🧬',
    isSpeculative: false,
    speculativeAssumptions: [],
    version: '1.0.0',
  },
  {
    id: 'heredity.segmented',
    category: 'HereditarySystem',
    displayName: 'Segmented Genetic System',
    description: 'Genetic information distributed across multiple separate segments. Enables rapid reassortment.',
    prerequisites: [],
    incompatibleWith: [],
    expressionThreshold: 0.45,
    baseFitnessModifier: 1.1,
    mutationBias: 0.35,
    tags: ['established', 'adaptive'],
    visualTag: '🧫',
    isSpeculative: false,
    speculativeAssumptions: [],
    version: '1.0.0',
  },
  {
    id: 'heredity.distributed',
    category: 'HereditarySystem',
    displayName: 'Distributed Hereditary System',
    description: 'Genetic information distributed across a network — no single central genome.',
    prerequisites: ['life_arch.distributed'],
    incompatibleWith: ['heredity.complementary_replicator'],
    expressionThreshold: 0.6,
    baseFitnessModifier: 0.9,
    mutationBias: 0.2,
    tags: ['speculative', 'exotic'],
    visualTag: '🕸️',
    isSpeculative: true,
    speculativeAssumptions: [
      'Assumes coherent information propagation across distributed nodes.',
      'Assumes distributed consensus mechanism for trait expression.',
    ],
    version: '1.0.0',
  },
  {
    id: 'heredity.alternative_biochemical',
    category: 'HereditarySystem',
    displayName: 'Alternative Biochemical Replicator',
    description: 'Information storage and replication not based on nucleic acids. Entirely hypothetical.',
    prerequisites: [],
    incompatibleWith: ['heredity.linear_replicator', 'heredity.complementary_replicator'],
    expressionThreshold: 0.7,
    baseFitnessModifier: 0.85,
    mutationBias: 0.5,
    tags: ['speculative', 'exotic', 'highly_uncertain'],
    visualTag: '⚗️',
    isSpeculative: true,
    speculativeAssumptions: [
      'Assumes a stable alternative polymer capable of information storage.',
      'Assumes error-correction mechanism not based on complementary pairing.',
      'Assumes an alternative energy source for replication.',
      'No confirmed empirical example exists.',
    ],
    version: '1.0.0',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // § 5.3  Energy Acquisition
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'energy.photonic',
    category: 'EnergyAcquisition',
    displayName: 'Photonic Energy Capture',
    description: 'Captures electromagnetic radiation (starlight or equivalent) and converts it to chemical energy.',
    prerequisites: [],
    incompatibleWith: [],
    expressionThreshold: 0.3,
    baseFitnessModifier: 1.2,
    mutationBias: 0.25,
    tags: ['established', 'primary_producer'],
    visualTag: '☀️',
    isSpeculative: false,
    speculativeAssumptions: [],
    version: '1.0.0',
  },
  {
    id: 'energy.chemosynthetic',
    category: 'EnergyAcquisition',
    displayName: 'Chemical Energy Acquisition',
    description: 'Extracts energy from inorganic chemical reactions (e.g., sulfur oxidation, iron reduction).',
    prerequisites: [],
    incompatibleWith: [],
    expressionThreshold: 0.35,
    baseFitnessModifier: 1.1,
    mutationBias: 0.3,
    tags: ['established', 'primary_producer'],
    visualTag: '⚗️',
    isSpeculative: false,
    speculativeAssumptions: [],
    version: '1.0.0',
  },
  {
    id: 'energy.thermal_gradient',
    category: 'EnergyAcquisition',
    displayName: 'Thermal Gradient Utilization',
    description: 'Exploits temperature differentials between environments to drive metabolic processes.',
    prerequisites: [],
    incompatibleWith: [],
    expressionThreshold: 0.5,
    baseFitnessModifier: 0.95,
    mutationBias: 0.2,
    tags: ['speculative', 'exotic'],
    visualTag: '🌡️',
    isSpeculative: true,
    speculativeAssumptions: [
      'Assumes sustained access to thermal gradient above metabolic threshold.',
      'No confirmed macroscopic biological example.',
    ],
    version: '1.0.0',
  },
  {
    id: 'energy.radiation',
    category: 'EnergyAcquisition',
    displayName: 'Radiation Energy Capture',
    description: 'Converts ionizing radiation into metabolic energy (radiotrophic analog).',
    prerequisites: [],
    incompatibleWith: [],
    expressionThreshold: 0.6,
    baseFitnessModifier: 0.9,
    mutationBias: 0.15,
    tags: ['speculative', 'exotic'],
    visualTag: '☢️',
    isSpeculative: true,
    speculativeAssumptions: [
      'Based on observed radiotrophic fungi — generalized beyond confirmed cases.',
      'Assumes radiation flux above minimum metabolic threshold.',
    ],
    version: '1.0.0',
  },
  {
    id: 'energy.consumer',
    category: 'EnergyAcquisition',
    displayName: 'Organic Matter Consumption',
    description: 'Ingests and metabolizes organic matter produced by other organisms.',
    prerequisites: [],
    incompatibleWith: [],
    expressionThreshold: 0.3,
    baseFitnessModifier: 1.0,
    mutationBias: 0.3,
    tags: ['established', 'heterotroph'],
    visualTag: '🍽️',
    isSpeculative: false,
    speculativeAssumptions: [],
    version: '1.0.0',
  },
  {
    id: 'energy.predatory',
    category: 'EnergyAcquisition',
    displayName: 'Predatory Consumption',
    description: 'Active capture and consumption of living organisms.',
    prerequisites: ['energy.consumer'],
    incompatibleWith: [],
    expressionThreshold: 0.5,
    baseFitnessModifier: 1.3,
    mutationBias: 0.25,
    tags: ['established', 'heterotroph'],
    visualTag: '🦅',
    isSpeculative: false,
    speculativeAssumptions: [],
    version: '1.0.0',
  },
  {
    id: 'energy.parasitic',
    category: 'EnergyAcquisition',
    displayName: 'Parasitic Resource Extraction',
    description: 'Extracts resources from a living host without consuming it entirely.',
    prerequisites: [],
    incompatibleWith: [],
    expressionThreshold: 0.4,
    baseFitnessModifier: 1.1,
    mutationBias: 0.2,
    tags: ['established'],
    visualTag: '🦠',
    isSpeculative: false,
    speculativeAssumptions: [],
    version: '1.0.0',
  },
  {
    id: 'energy.symbiotic',
    category: 'EnergyAcquisition',
    displayName: 'Symbiotic Exchange',
    description: 'Mutual energy exchange with another organism. Both parties benefit.',
    prerequisites: [],
    incompatibleWith: [],
    expressionThreshold: 0.4,
    baseFitnessModifier: 1.15,
    mutationBias: 0.2,
    tags: ['established'],
    visualTag: '🤝',
    isSpeculative: false,
    speculativeAssumptions: [],
    version: '1.0.0',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // § 5.6  Morphology
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'morph.spherical',
    category: 'Morphology',
    displayName: 'Spherical Body Form',
    description: 'Roughly spherical body minimizing surface area relative to volume.',
    prerequisites: [],
    incompatibleWith: ['morph.bilateral', 'morph.segmented'],
    expressionThreshold: 0.3,
    baseFitnessModifier: 1.0,
    mutationBias: 0.3,
    tags: ['established'],
    visualTag: '⚫',
    isSpeculative: false,
    speculativeAssumptions: [],
    version: '1.0.0',
  },
  {
    id: 'morph.radial',
    category: 'Morphology',
    displayName: 'Radial Body Form',
    description: 'Radially symmetric body plan. Multiple planes of symmetry through central axis.',
    prerequisites: [],
    incompatibleWith: ['morph.bilateral'],
    expressionThreshold: 0.4,
    baseFitnessModifier: 1.05,
    mutationBias: 0.25,
    tags: ['established'],
    visualTag: '🌸',
    isSpeculative: false,
    speculativeAssumptions: [],
    version: '1.0.0',
  },
  {
    id: 'morph.bilateral',
    category: 'Morphology',
    displayName: 'Bilateral Body Form',
    description: 'Single plane of symmetry. Enables directional movement and cephalization.',
    prerequisites: [],
    incompatibleWith: ['morph.radial', 'morph.spherical'],
    expressionThreshold: 0.5,
    baseFitnessModifier: 1.1,
    mutationBias: 0.2,
    tags: ['established', 'adaptive'],
    visualTag: '🦎',
    isSpeculative: false,
    speculativeAssumptions: [],
    version: '1.0.0',
  },
  {
    id: 'morph.asymmetrical',
    category: 'Morphology',
    displayName: 'Asymmetrical Body Form',
    description: 'No consistent plane of symmetry. Common in sessile or early multicellular forms.',
    prerequisites: [],
    incompatibleWith: [],
    expressionThreshold: 0.2,
    baseFitnessModifier: 0.95,
    mutationBias: 0.35,
    tags: ['established'],
    visualTag: '🧽',
    isSpeculative: false,
    speculativeAssumptions: [],
    version: '1.0.0',
  },
  {
    id: 'morph.segmented',
    category: 'Morphology',
    displayName: 'Segmented Body Form',
    description: 'Body divided into repeated structural units (segments/metameres).',
    prerequisites: ['morph.bilateral'],
    incompatibleWith: ['morph.spherical'],
    expressionThreshold: 0.5,
    baseFitnessModifier: 1.1,
    mutationBias: 0.2,
    tags: ['established'],
    visualTag: '🐛',
    isSpeculative: false,
    speculativeAssumptions: [],
    version: '1.0.0',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // § 5.7  Locomotion
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'loco.stationary',
    category: 'Locomotion',
    displayName: 'Stationary',
    description: 'No active locomotion. Organism is permanently anchored to substrate.',
    prerequisites: [],
    incompatibleWith: ['loco.powered_flight', 'loco.swimming'],
    expressionThreshold: 0.0,
    baseFitnessModifier: 0.9,
    mutationBias: 0.3,
    tags: ['established'],
    visualTag: '🌳',
    isSpeculative: false,
    speculativeAssumptions: [],
    version: '1.0.0',
  },
  {
    id: 'loco.passive_drift',
    category: 'Locomotion',
    displayName: 'Passive Drift',
    description: 'Movement driven entirely by environmental currents — no active propulsion.',
    prerequisites: [],
    incompatibleWith: [],
    expressionThreshold: 0.2,
    baseFitnessModifier: 0.95,
    mutationBias: 0.25,
    tags: ['established'],
    visualTag: '🌊',
    isSpeculative: false,
    speculativeAssumptions: [],
    version: '1.0.0',
  },
  {
    id: 'loco.crawling',
    category: 'Locomotion',
    displayName: 'Surface Crawling',
    description: 'Active movement across a substrate surface.',
    prerequisites: [],
    incompatibleWith: ['loco.stationary'],
    expressionThreshold: 0.4,
    baseFitnessModifier: 1.0,
    mutationBias: 0.25,
    tags: ['established'],
    visualTag: '🐌',
    isSpeculative: false,
    speculativeAssumptions: [],
    version: '1.0.0',
  },
  {
    id: 'loco.swimming',
    category: 'Locomotion',
    displayName: 'Swimming',
    description: 'Active propulsion through liquid medium.',
    prerequisites: [],
    incompatibleWith: ['loco.stationary'],
    expressionThreshold: 0.4,
    baseFitnessModifier: 1.1,
    mutationBias: 0.25,
    tags: ['established'],
    visualTag: '🐟',
    isSpeculative: false,
    speculativeAssumptions: [],
    version: '1.0.0',
  },
  {
    id: 'loco.powered_flight',
    category: 'Locomotion',
    displayName: 'Powered Flight',
    description: 'Sustained powered movement through gaseous medium.',
    prerequisites: ['morph.bilateral'],
    incompatibleWith: ['loco.stationary'],
    expressionThreshold: 0.6,
    baseFitnessModifier: 1.2,
    mutationBias: 0.15,
    tags: ['established', 'high_energy'],
    visualTag: '🦅',
    isSpeculative: false,
    speculativeAssumptions: [],
    version: '1.0.0',
  },
  {
    id: 'loco.fluid_propulsion',
    category: 'Locomotion',
    displayName: 'Fluid Propulsion',
    description: 'Jet-propulsion through expelling fluid (e.g., cephalopod-analog).',
    prerequisites: [],
    incompatibleWith: ['loco.stationary'],
    expressionThreshold: 0.45,
    baseFitnessModifier: 1.1,
    mutationBias: 0.2,
    tags: ['established'],
    visualTag: '🐙',
    isSpeculative: false,
    speculativeAssumptions: [],
    version: '1.0.0',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // § 5.8  Reproduction
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'repro.binary_fission',
    category: 'Reproduction',
    displayName: 'Binary Fission',
    description: 'Asexual reproduction by splitting into two daughter cells.',
    prerequisites: [],
    incompatibleWith: [],
    expressionThreshold: 0.0,
    baseFitnessModifier: 1.2,
    mutationBias: 0.3,
    tags: ['established', 'asexual'],
    visualTag: '➗',
    isSpeculative: false,
    speculativeAssumptions: [],
    version: '1.0.0',
  },
  {
    id: 'repro.genetic_mixing',
    category: 'Reproduction',
    displayName: 'Genetic Mixing (Sexual-analog)',
    description: 'Reproductive process involving recombination of genetic material from two parents.',
    prerequisites: [],
    incompatibleWith: [],
    expressionThreshold: 0.4,
    baseFitnessModifier: 1.1,
    mutationBias: 0.25,
    tags: ['established', 'sexual'],
    visualTag: '🔀',
    isSpeculative: false,
    speculativeAssumptions: [],
    version: '1.0.0',
  },
  {
    id: 'repro.multi_parent',
    category: 'Reproduction',
    displayName: 'Multi-parent Genetic Contribution',
    description: 'More than two organisms contribute genetic material to a single offspring.',
    prerequisites: ['repro.genetic_mixing'],
    incompatibleWith: ['repro.binary_fission'],
    expressionThreshold: 0.6,
    baseFitnessModifier: 1.05,
    mutationBias: 0.15,
    tags: ['speculative'],
    visualTag: '🔱',
    isSpeculative: true,
    speculativeAssumptions: [
      'Assumes a mechanism for integrating genetic information from more than two sources coherently.',
    ],
    version: '1.0.0',
  },
  {
    id: 'repro.spore_based',
    category: 'Reproduction',
    displayName: 'Spore-based Reproduction',
    description: 'Reproduction via hardy dispersal units (spores) that can survive adverse conditions.',
    prerequisites: [],
    incompatibleWith: [],
    expressionThreshold: 0.4,
    baseFitnessModifier: 1.1,
    mutationBias: 0.2,
    tags: ['established'],
    visualTag: '🍄',
    isSpeculative: false,
    speculativeAssumptions: [],
    version: '1.0.0',
  },
  {
    id: 'repro.conditional',
    category: 'Reproduction',
    displayName: 'Conditional Reproduction',
    description: 'Organism switches between reproductive modes based on environmental conditions.',
    prerequisites: [],
    incompatibleWith: [],
    expressionThreshold: 0.5,
    baseFitnessModifier: 1.15,
    mutationBias: 0.2,
    tags: ['established', 'adaptive'],
    visualTag: '🔄',
    isSpeculative: false,
    speculativeAssumptions: [],
    version: '1.0.0',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // § 5.9  Sensory Systems
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'sense.chemosensory',
    category: 'SensorySystems',
    displayName: 'Chemical Sensing',
    description: 'Detection of chemical gradients for navigation, resource finding, or threat avoidance.',
    prerequisites: [],
    incompatibleWith: [],
    expressionThreshold: 0.3,
    baseFitnessModifier: 1.1,
    mutationBias: 0.3,
    tags: ['established'],
    visualTag: '👃',
    isSpeculative: false,
    speculativeAssumptions: [],
    version: '1.0.0',
  },
  {
    id: 'sense.photosensory',
    category: 'SensorySystems',
    displayName: 'Photonic Sensing',
    description: 'Detection of light/electromagnetic radiation for orientation or resource location.',
    prerequisites: [],
    incompatibleWith: [],
    expressionThreshold: 0.35,
    baseFitnessModifier: 1.1,
    mutationBias: 0.25,
    tags: ['established'],
    visualTag: '👁️',
    isSpeculative: false,
    speculativeAssumptions: [],
    version: '1.0.0',
  },
  {
    id: 'sense.electrosensory',
    category: 'SensorySystems',
    displayName: 'Electrical Sensing',
    description: 'Detection of electrical fields in the environment.',
    prerequisites: [],
    incompatibleWith: [],
    expressionThreshold: 0.5,
    baseFitnessModifier: 1.05,
    mutationBias: 0.2,
    tags: ['established'],
    visualTag: '⚡',
    isSpeculative: false,
    speculativeAssumptions: [],
    version: '1.0.0',
  },
  {
    id: 'sense.magnetosensory',
    category: 'SensorySystems',
    displayName: 'Magnetic Sensing',
    description: 'Detection of magnetic fields for navigation.',
    prerequisites: [],
    incompatibleWith: [],
    expressionThreshold: 0.5,
    baseFitnessModifier: 1.05,
    mutationBias: 0.15,
    tags: ['established'],
    visualTag: '🧲',
    isSpeculative: false,
    speculativeAssumptions: [],
    version: '1.0.0',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // § 5.10  Defense
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'defense.physical_armor',
    category: 'Defense',
    displayName: 'Physical Armor',
    description: 'Hard external covering or shell providing mechanical protection.',
    prerequisites: [],
    incompatibleWith: [],
    expressionThreshold: 0.4,
    baseFitnessModifier: 1.1,
    mutationBias: 0.25,
    tags: ['established'],
    visualTag: '🛡️',
    isSpeculative: false,
    speculativeAssumptions: [],
    version: '1.0.0',
  },
  {
    id: 'defense.chemical_defense',
    category: 'Defense',
    displayName: 'Chemical Defense',
    description: 'Production of chemical deterrents, toxins, or irritants.',
    prerequisites: [],
    incompatibleWith: [],
    expressionThreshold: 0.4,
    baseFitnessModifier: 1.1,
    mutationBias: 0.25,
    tags: ['established'],
    visualTag: '☠️',
    isSpeculative: false,
    speculativeAssumptions: [],
    version: '1.0.0',
  },
  {
    id: 'defense.regeneration',
    category: 'Defense',
    displayName: 'Regeneration',
    description: 'Ability to regrow damaged or lost body parts.',
    prerequisites: ['life_arch.multicellular'],
    incompatibleWith: [],
    expressionThreshold: 0.5,
    baseFitnessModifier: 1.15,
    mutationBias: 0.2,
    tags: ['established'],
    visualTag: '♻️',
    isSpeculative: false,
    speculativeAssumptions: [],
    version: '1.0.0',
  },
  {
    id: 'defense.environmental_resistance',
    category: 'Defense',
    displayName: 'Environmental Resistance',
    description: 'Broad tolerance for adverse environmental conditions (radiation, temperature extremes, etc.).',
    prerequisites: [],
    incompatibleWith: [],
    expressionThreshold: 0.4,
    baseFitnessModifier: 1.2,
    mutationBias: 0.3,
    tags: ['established', 'adaptive'],
    visualTag: '💪',
    isSpeculative: false,
    speculativeAssumptions: [],
    version: '1.0.0',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // § 5.11  Behavior
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'behav.reactive',
    category: 'Behavior',
    displayName: 'Reactive Behavior',
    description: 'Simple stimulus-response behavior without memory or prediction.',
    prerequisites: [],
    incompatibleWith: [],
    expressionThreshold: 0.0,
    baseFitnessModifier: 1.0,
    mutationBias: 0.3,
    tags: ['established'],
    visualTag: '⚡',
    isSpeculative: false,
    speculativeAssumptions: [],
    version: '1.0.0',
  },
  {
    id: 'behav.cooperative',
    category: 'Behavior',
    displayName: 'Cooperative Behavior',
    description: 'Coordinated behavior between multiple individuals providing mutual benefit.',
    prerequisites: [],
    incompatibleWith: [],
    expressionThreshold: 0.5,
    baseFitnessModifier: 1.15,
    mutationBias: 0.2,
    tags: ['established'],
    visualTag: '🤝',
    isSpeculative: false,
    speculativeAssumptions: [],
    version: '1.0.0',
  },
  {
    id: 'behav.learning_capable',
    category: 'Behavior',
    displayName: 'Learning-capable Behavior',
    description: 'Ability to modify behavior based on past experience.',
    prerequisites: ['sense.chemosensory'],
    incompatibleWith: [],
    expressionThreshold: 0.6,
    baseFitnessModifier: 1.2,
    mutationBias: 0.15,
    tags: ['established', 'complex'],
    visualTag: '🧠',
    isSpeculative: false,
    speculativeAssumptions: [],
    version: '1.0.0',
  },
  {
    id: 'behav.complex_adaptive',
    category: 'Behavior',
    displayName: 'Complex Adaptive Behavior',
    description: 'High-level behavioral plasticity. Does NOT imply intelligence as an evolutionary goal.',
    prerequisites: ['behav.learning_capable', 'sense.chemosensory'],
    incompatibleWith: [],
    expressionThreshold: 0.7,
    baseFitnessModifier: 1.25,
    mutationBias: 0.1,
    tags: ['established', 'complex'],
    visualTag: '🌐',
    isSpeculative: false,
    speculativeAssumptions: [],
    version: '1.0.0',
  },
]

// ---------------------------------------------------------------------------
// Registry class
// ---------------------------------------------------------------------------

/**
 * Incompatibility rules — pairs of trait ids that cannot coexist.
 * Derived from the trait definitions above, cached for performance.
 */
const INCOMPATIBILITY_MAP = new Map<string, Set<string>>()

for (const def of TRAIT_DEFINITIONS) {
  if (!INCOMPATIBILITY_MAP.has(def.id)) {
    INCOMPATIBILITY_MAP.set(def.id, new Set())
  }
  for (const inc of def.incompatibleWith) {
    INCOMPATIBILITY_MAP.get(def.id)!.add(inc)
    // Ensure symmetry
    if (!INCOMPATIBILITY_MAP.has(inc)) {
      INCOMPATIBILITY_MAP.set(inc, new Set())
    }
    INCOMPATIBILITY_MAP.get(inc)!.add(def.id)
  }
}

const TRAIT_MAP = new Map<string, TraitDefinition>(
  TRAIT_DEFINITIONS.map((d) => [d.id, d])
)

const CATEGORY_MAP = new Map<TraitCategory, TraitDefinition[]>()
for (const def of TRAIT_DEFINITIONS) {
  const list = CATEGORY_MAP.get(def.category) ?? []
  list.push(def)
  CATEGORY_MAP.set(def.category, list)
}

export const TraitRegistry = {
  /**
   * Returns the definition for a trait id, or undefined if not registered.
   */
  resolve(id: string): TraitDefinition | undefined {
    return TRAIT_MAP.get(id)
  },

  /**
   * Returns all trait definitions in a given category.
   */
  getByCategory(category: TraitCategory): readonly TraitDefinition[] {
    return CATEGORY_MAP.get(category) ?? []
  },

  /**
   * Returns all registered trait definitions.
   */
  getAll(): readonly TraitDefinition[] {
    return TRAIT_DEFINITIONS
  },

  /**
   * Returns all speculative trait definitions.
   */
  getSpeculative(): readonly TraitDefinition[] {
    return TRAIT_DEFINITIONS.filter((d) => d.isSpeculative)
  },

  /**
   * Validates a set of trait ids for compatibility.
   * Invalid combinations are rejected per spec §6.
   */
  validateTraitSet(traitIds: readonly string[]): TraitValidationResult {
    const violations: Array<{
      traitId: string
      conflictingTraitId: string
      reason: string
    }> = []
    const warnings: Array<{ traitId: string; message: string }> = []

    const traitSet = new Set(traitIds)

    for (const id of traitIds) {
      const def = TRAIT_MAP.get(id)
      if (!def) {
        warnings.push({ traitId: id, message: `Unknown trait id: "${id}". Not present in registry.` })
        continue
      }

      // Check incompatibilities
      for (const incomp of def.incompatibleWith) {
        if (traitSet.has(incomp)) {
          violations.push({
            traitId: id,
            conflictingTraitId: incomp,
            reason: `Trait "${id}" is incompatible with "${incomp}".`,
          })
        }
      }

      // Check prerequisites
      for (const prereq of def.prerequisites) {
        if (!traitSet.has(prereq)) {
          violations.push({
            traitId: id,
            conflictingTraitId: prereq,
            reason: `Trait "${id}" requires prerequisite "${prereq}" which is not expressed.`,
          })
        }
      }

      // Warn about speculative traits
      if (def.isSpeculative) {
        warnings.push({
          traitId: id,
          message: `Trait "${id}" is speculative. Assumptions: ${def.speculativeAssumptions.join(' | ')}`,
        })
      }
    }

    return {
      isValid: violations.length === 0,
      violations,
      warnings,
    }
  },

  /**
   * Whether two trait ids are incompatible with each other.
   */
  areIncompatible(idA: string, idB: string): boolean {
    return INCOMPATIBILITY_MAP.get(idA)?.has(idB) ?? false
  },

  /**
   * Returns all trait ids in the registry.
   */
  getAllIds(): readonly string[] {
    return TRAIT_DEFINITIONS.map((d) => d.id)
  },
}

