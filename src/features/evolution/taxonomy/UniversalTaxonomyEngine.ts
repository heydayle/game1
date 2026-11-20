/**
 * Universal Taxonomy Engine
 *
 * Registry-driven, emergent taxonomy that does NOT enforce Earth's evolutionary ladder.
 *
 * Key design decisions (per spec §3–7):
 *  - Trait expression is f(genotype × environment) — NEVER f(generation_count → tier).
 *  - complexityIndex is a derived observation, not a goal or advancement gate.
 *  - Speciation requires sustained divergence, not a single mutation.
 *  - Convergent evolution does not merge phylogenetic ancestry.
 *  - Alternative hereditary and energy systems are supported (labeled speculative where appropriate).
 *
 * This engine operates alongside the legacy TaxonomyEngine (preserved for backward compatibility
 * of existing tests). PopulationManager uses this engine by default.
 */

import type { PlanetConfig } from '../../genesis/types/genesis.js'
import { GeneExpression } from '../genetics/Gene.js'
import type { Genotype } from '../genetics/types.js'
import { TraitRegistry } from '../traits/TraitRegistry.js'
import type { EvolutionTier } from './types.js'
import type {
  BehaviorTrait,
  ClassificationResult,
  ConvergenceSignal,
  DefenseTrait,
  DivergenceDirection,
  DivergenceEvent,
  EnergyStrategy,
  EnvironmentalToleranceProfile,
  HereditarySystem,
  LifeArchitecture,
  LifeCycleParams,
  LocomotionTrait,
  MorphologyTrait,
  ReproductionMode,
  SensoryTrait,
  SpeciesEquivalentMode,
  TraitProfile,
  TrophicStrategy,
  TrophicStrategySet,
} from '../traits/types.js'

// ---------------------------------------------------------------------------
// Environment snapshot for trait expression
// ---------------------------------------------------------------------------

interface PlanetEnv {
  readonly temperatureCelsius: number
  readonly oceanLevel: number
  readonly radiationLevel: 'shielded' | 'moderate' | 'intense' | 'extreme'
  readonly pressureAtm: number
  readonly silicatesRock: number
  readonly carbonOrganics: number
  readonly tectonicStability: 'dormant' | 'stable' | 'active' | 'cataclysmic'
}

function extractPlanetEnv(config: PlanetConfig): PlanetEnv {
  return {
    temperatureCelsius: config.surfaceTemperatureCelsius,
    oceanLevel: config.oceanLevel,
    radiationLevel: config.environmentalConditions.radiationLevel,
    pressureAtm: config.atmosphericComposition.pressureAtm,
    silicatesRock: config.elementalComposition.silicatesRock,
    carbonOrganics: config.elementalComposition.carbonOrganics,
    tectonicStability: config.environmentalConditions.tectonicStability,
  }
}

// ---------------------------------------------------------------------------
// Trait expression helpers
// ---------------------------------------------------------------------------

/** Radiation intensity as a normalized [0,1] value. */
function radiationNorm(level: PlanetEnv['radiationLevel']): number {
  switch (level) {
    case 'shielded': return 0.1
    case 'moderate': return 0.35
    case 'intense':  return 0.7
    case 'extreme':  return 1.0
  }
}

/** Tectonic stress as [0,1]. */
function tectonicNorm(stability: PlanetEnv['tectonicStability']): number {
  switch (stability) {
    case 'dormant':      return 0.0
    case 'stable':       return 0.2
    case 'active':       return 0.6
    case 'cataclysmic':  return 1.0
  }
}

// ---------------------------------------------------------------------------
// Environmental Tolerance Profile derivation
// ---------------------------------------------------------------------------

function deriveEnvironmentalTolerance(
  expressed: ReturnType<typeof GeneExpression.expressGenotype>
): EnvironmentalToleranceProfile {
  return {
    temperatureOptimum: expressed.thermalOptimumCelsius,
    temperatureRange: expressed.thermalToleranceRangeCelsius,
    pressureOptimumAtm: 1.0,            // Not yet genotype-mapped; default
    pressureRangeAtm: 1.5,
    radiationResistance: expressed.radiationResistance,
    moistureConservation: expressed.waterConservation,
    lightToleranceRange: [0, 1],        // Generic; extends in future trait expansion
    chemicalGradientAffinity: expressed.metabolicRate / 2.8,
    substrateDependency: 1.0 - expressed.mobility,
  }
}

// ---------------------------------------------------------------------------
// Life Architecture derivation
// ---------------------------------------------------------------------------

function deriveLifeArchitecture(
  expressed: ReturnType<typeof GeneExpression.expressGenotype>,
  _env: PlanetEnv
): LifeArchitecture {
  // complexityIndex is a derived observation (see §3 — no mandatory direction)
  // We use phenotype axes to infer structural organization
  const mobility = expressed.mobility
  const metabolicRate = expressed.metabolicRate
  const clutchSize = expressed.clutchSize

  // High mobility + high metabolism + small clutch → more complex body organization
  const organizationScore = mobility * 0.4 + (metabolicRate / 2.8) * 0.4 + (1 - clutchSize / 6) * 0.2

  if (organizationScore >= 0.75) return 'multicellular'
  if (organizationScore >= 0.55) return 'colonial'
  return 'unicellular'
}

// ---------------------------------------------------------------------------
// Hereditary System derivation
// ---------------------------------------------------------------------------

function deriveHereditarySystem(
  expressed: ReturnType<typeof GeneExpression.expressGenotype>,
  env: PlanetEnv
): { system: HereditarySystem; isSpeculative: boolean } {
  const radNorm = radiationNorm(env.radiationLevel)
  const armor = expressed.radiationResistance

  // High radiation + high armor → may favor more robust/redundant hereditary systems
  if (radNorm >= 0.9 && armor >= 0.8) {
    return { system: 'multi_strand', isSpeculative: false }
  }
  if (env.temperatureCelsius < -20 && env.carbonOrganics < 5) {
    // Very cold, low-carbon worlds: speculative alternative biochemistry
    return { system: 'alternative_biochemical', isSpeculative: true }
  }
  if (env.silicatesRock > 80 && env.carbonOrganics < 5) {
    return { system: 'alternative_biochemical', isSpeculative: true }
  }
  // Default: complementary replicator (DNA-analog) for most conditions
  return { system: 'complementary_replicator', isSpeculative: false }
}

// ---------------------------------------------------------------------------
// Energy Strategy derivation
// ---------------------------------------------------------------------------

function deriveEnergyStrategies(
  expressed: ReturnType<typeof GeneExpression.expressGenotype>,
  env: PlanetEnv
): readonly EnergyStrategy[] {
  const strategies: EnergyStrategy[] = []
  const radNorm = radiationNorm(env.radiationLevel)

  // Photonic: low metabolic rate on temperate/warm worlds
  if (expressed.metabolicRate <= 0.9 && env.temperatureCelsius >= -20) {
    strategies.push('photonic')
  }

  // Chemosynthetic: hot or reducing environments
  if (env.temperatureCelsius >= 50 || (env.oceanLevel > 0.65 && env.temperatureCelsius >= 20)) {
    strategies.push('chemosynthetic')
  }

  // Radiation capture: high radiation + high armor
  if (radNorm >= 0.65 && expressed.radiationResistance >= 0.75) {
    strategies.push('radiation')
  }

  // Consumer: moderate-high metabolism
  if (expressed.metabolicRate >= 1.0) {
    strategies.push('consumer')
  }

  // Predatory: high metabolism + high mobility
  if (expressed.metabolicRate >= 1.3 && expressed.mobility >= 0.5) {
    strategies.push('predatory')
  }

  // Parasitic: high armor + moderate metabolism (stealth-adapted)
  if (expressed.radiationResistance >= 0.6 && expressed.metabolicRate >= 0.8 && expressed.mobility < 0.4) {
    strategies.push('parasitic')
  }

  // Fallback: ensure at least one strategy
  if (strategies.length === 0) {
    strategies.push('consumer')
  }

  return strategies
}

// ---------------------------------------------------------------------------
// Trophic Strategy derivation
// ---------------------------------------------------------------------------

function deriveTrophicStrategies(
  energyStrategies: readonly EnergyStrategy[],
  expressed: ReturnType<typeof GeneExpression.expressGenotype>,
  env: PlanetEnv
): TrophicStrategySet {
  const strategies: TrophicStrategy[] = []

  if (energyStrategies.includes('photonic') || energyStrategies.includes('chemosynthetic')) {
    strategies.push('producer')
  }
  if (energyStrategies.includes('predatory')) {
    strategies.push('predator')
  }
  if (energyStrategies.includes('parasitic')) {
    strategies.push('parasite')
  }
  if (energyStrategies.includes('consumer') && !energyStrategies.includes('predatory')) {
    // Low mobility consumers tend toward decomposing/recycling
    if (expressed.mobility < 0.25) {
      strategies.push('decomposer')
    } else {
      strategies.push('consumer')
    }
  }

  // Opportunism at moderate mobility with mixed energy
  if (
    energyStrategies.length >= 2 &&
    expressed.mobility >= 0.3 &&
    !strategies.includes('producer') &&
    !strategies.includes('predator')
  ) {
    strategies.push('opportunist')
  }

  if (strategies.length === 0) {
    strategies.push(env.temperatureCelsius > 50 ? 'producer' : 'consumer')
  }

  return strategies as TrophicStrategySet
}

// ---------------------------------------------------------------------------
// Morphology derivation
// ---------------------------------------------------------------------------

function deriveMorphologyTraits(
  expressed: ReturnType<typeof GeneExpression.expressGenotype>,
  lifeArch: LifeArchitecture
): readonly MorphologyTrait[] {
  const traits: MorphologyTrait[] = []

  if (lifeArch === 'unicellular') {
    traits.push('spherical')
    return traits
  }

  if (expressed.mobility >= 0.5) {
    // Mobile organisms tend toward bilateral or segmented body plans
    if (expressed.mobility >= 0.7) {
      traits.push('bilateral')
      if (expressed.metabolicRate >= 1.5) traits.push('segmented')
    } else {
      traits.push('radial')
    }
  } else if (expressed.mobility < 0.2) {
    // Sessile organisms: branched, modular, or asymmetrical
    if (lifeArch === 'modular') {
      traits.push('modular_body')
    } else {
      traits.push('asymmetrical')
    }
  } else {
    // Moderate mobility: compact or radial
    traits.push('compact')
  }

  if (traits.length === 0) traits.push('compact')
  return traits
}

// ---------------------------------------------------------------------------
// Locomotion derivation
// ---------------------------------------------------------------------------

function deriveLocomotionTraits(
  expressed: ReturnType<typeof GeneExpression.expressGenotype>,
  env: PlanetEnv
): readonly LocomotionTrait[] {
  const traits: LocomotionTrait[] = []
  const mob = expressed.mobility

  if (mob < 0.1) {
    traits.push('stationary')
    return traits
  }

  if (mob < 0.25) {
    traits.push('passive_drift')
    return traits
  }

  // High ocean level → aquatic locomotion preferred
  if (env.oceanLevel >= 0.6) {
    traits.push(mob >= 0.6 ? 'fluid_propulsion' : 'swimming')
  } else if (env.pressureAtm >= 1.8) {
    // Dense atmosphere
    traits.push(mob >= 0.65 ? 'powered_flight' : 'passive_drift')
  } else {
    // Surface locomotion
    traits.push(mob >= 0.6 ? 'crawling' : 'surface_glide')
  }

  if (mob >= 0.75) {
    // High-mobility organisms may develop multi-mode locomotion
    traits.push('multi_mode')
  }

  return traits
}

// ---------------------------------------------------------------------------
// Reproduction Mode derivation
// ---------------------------------------------------------------------------

function deriveReproductionModes(
  expressed: ReturnType<typeof GeneExpression.expressGenotype>,
  lifeArch: LifeArchitecture
): readonly ReproductionMode[] {
  const modes: ReproductionMode[] = []
  const repro = expressed.clutchSize  // r vs K signal

  if (lifeArch === 'unicellular') {
    modes.push('binary_fission')
  } else if (repro >= 4) {
    // r-strategy: high offspring count → fission or spore-based
    modes.push('binary_fission')
    if (expressed.radiationResistance >= 0.5) modes.push('spore_based')
  } else {
    // K-strategy: invest per offspring → genetic mixing
    modes.push('genetic_mixing')
    if (expressed.metabolicRate >= 1.5) modes.push('conditional')
  }

  return modes
}

// ---------------------------------------------------------------------------
// Sensory traits derivation
// ---------------------------------------------------------------------------

function deriveSensoryTraits(
  expressed: ReturnType<typeof GeneExpression.expressGenotype>,
  env: PlanetEnv
): readonly SensoryTrait[] {
  const traits: SensoryTrait[] = []

  // All organisms with any mobility have chemosensory capability
  if (expressed.mobility > 0.1) traits.push('chemosensory')

  // Photosensory: organisms in light-available environments
  if (env.temperatureCelsius > -60 && env.oceanLevel < 0.95) traits.push('photosensory')

  // Electrosensory: aquatic predators
  if (env.oceanLevel >= 0.5 && expressed.mobility >= 0.5) traits.push('electrosensory')

  // Magnetosensory: mobile organisms in magnetically active environments
  if (expressed.mobility >= 0.6 && tectonicNorm(env.tectonicStability) >= 0.4) {
    traits.push('magnetosensory')
  }

  if (traits.length === 0) traits.push('chemosensory')
  return traits
}

// ---------------------------------------------------------------------------
// Defense traits derivation
// ---------------------------------------------------------------------------

function deriveDefenseTraits(
  expressed: ReturnType<typeof GeneExpression.expressGenotype>,
  env: PlanetEnv
): readonly DefenseTrait[] {
  const traits: DefenseTrait[] = []
  const radNorm = radiationNorm(env.radiationLevel)

  if (expressed.radiationResistance >= 0.6) traits.push('environmental_resistance')
  if (expressed.radiationResistance >= 0.75) traits.push('physical_armor')
  if (expressed.waterConservation >= 0.7) traits.push('chemical_defense')
  if (expressed.mobility < 0.2 && expressed.radiationResistance >= 0.4) traits.push('camouflage')
  if (radNorm >= 0.5 && expressed.radiationResistance >= 0.65) traits.push('toxin_resistance')

  if (traits.length === 0) traits.push('environmental_resistance')
  return traits
}

// ---------------------------------------------------------------------------
// Behavior traits derivation
// ---------------------------------------------------------------------------

function deriveBehaviorTraits(
  expressed: ReturnType<typeof GeneExpression.expressGenotype>
): readonly BehaviorTrait[] {
  const traits: BehaviorTrait[] = ['reactive']  // All organisms have reactive behavior

  if (expressed.mobility >= 0.3) traits.push('resource_seeking')
  if (expressed.mobility >= 0.5 && expressed.metabolicRate >= 1.0) traits.push('territorial')
  if (expressed.clutchSize <= 2 && expressed.mobility >= 0.4) traits.push('cooperative')

  // Learning-capable only with significant sensory investment (not an evolutionary goal)
  if (
    expressed.mobility >= 0.6 &&
    expressed.metabolicRate >= 1.2 &&
    expressed.radiationResistance < 0.9  // Not locked into purely defensive strategy
  ) {
    traits.push('learning_capable')
  }

  return traits
}

// ---------------------------------------------------------------------------
// Life Cycle derivation
// ---------------------------------------------------------------------------

function deriveLifeCycle(
  expressed: ReturnType<typeof GeneExpression.expressGenotype>
): LifeCycleParams {
  return {
    lifespanGenerations: Math.max(1, Math.round(expressed.gestationRotations * 3)),
    maturationThresholdRotations: expressed.gestationRotations,
    reproductiveIntervalRotations: Math.max(1, Math.round(expressed.gestationRotations * 0.5)),
    offspringCountMean: expressed.clutchSize,
    offspringCountVariance: Math.max(0.5, expressed.clutchSize * 0.3),
    offspringSurvivalBase: Math.max(0.1, 1.0 - (expressed.clutchSize - 1) * 0.12),
    growthRate: expressed.metabolicRate / 2.8,
    dormancyCapable: expressed.waterConservation >= 0.7,
    regenerationCapable: expressed.radiationResistance >= 0.65,
    reproductiveInvestment: 1.0 - (expressed.clutchSize / 6),
  }
}

// ---------------------------------------------------------------------------
// complexityIndex — a derived OBSERVATION, not a progression gate
// ---------------------------------------------------------------------------

function deriveComplexityIndex(
  expressed: ReturnType<typeof GeneExpression.expressGenotype>,
  lifeArch: LifeArchitecture,
  behaviorTraits: readonly BehaviorTrait[],
  sensoryTraits: readonly SensoryTrait[]
): number {
  // Structural complexity component
  const archScore: Record<LifeArchitecture, number> = {
    unicellular: 0.1,
    colonial: 0.3,
    multicellular: 0.5,
    modular: 0.45,
    distributed: 0.4,
    hybrid: 0.5,
  }
  const structural = archScore[lifeArch] ?? 0.1

  // Behavioral complexity component (not a goal — just observation)
  const behavioral = behaviorTraits.includes('learning_capable') ? 0.3
    : behaviorTraits.includes('cooperative') ? 0.2
    : behaviorTraits.includes('resource_seeking') ? 0.1
    : 0.05

  // Sensory complexity
  const sensory = Math.min(0.2, sensoryTraits.length * 0.05)

  // Metabolic investment
  const metabolic = Math.min(0.1, expressed.metabolicRate / 28.0)

  return Number(Math.min(1.0, Math.max(0.01, structural + behavioral + sensory + metabolic)).toFixed(3))
}

// ---------------------------------------------------------------------------
// Label generation (emergent, not hardcoded Earth names)
// ---------------------------------------------------------------------------

function deriveClassificationLabel(
  lifeArch: LifeArchitecture,
  trophicStrategies: TrophicStrategySet,
  morphologyTraits: readonly MorphologyTrait[],
  _energyStrategies: readonly EnergyStrategy[]
): string {
  const archLabel: Record<LifeArchitecture, string> = {
    unicellular: 'Unicellular',
    colonial: 'Colonial',
    multicellular: 'Multicellular',
    modular: 'Modular',
    distributed: 'Distributed',
    hybrid: 'Hybrid',
  }

  const primaryTrophic = trophicStrategies[0] ?? 'consumer'
  const trophicLabel: Record<TrophicStrategy, string> = {
    producer: 'Producer',
    consumer: 'Consumer',
    decomposer: 'Decomposer',
    recycler: 'Recycler',
    predator: 'Predator',
    prey: 'Prey',
    parasite: 'Parasite',
    symbiont: 'Symbiont',
    opportunist: 'Opportunist',
  }

  const primaryMorph = morphologyTraits[0]
  const morphLabel: Partial<Record<MorphologyTrait, string>> = {
    bilateral: 'Bilateral',
    radial: 'Radial',
    segmented: 'Segmented',
    spherical: 'Spherical',
    asymmetrical: 'Asymmetric',
    branched: 'Branched',
  }

  const arch = archLabel[lifeArch]
  const troph = trophicLabel[primaryTrophic]
  const morph = primaryMorph ? morphLabel[primaryMorph] : undefined

  return morph ? `${arch} ${troph} (${morph})` : `${arch} ${troph}`
}

function derivePlanetaryLineageLabel(env: PlanetEnv): string {
  if (env.temperatureCelsius < -10) return 'Cryo-Methanogen Lineage'
  if ((env.silicatesRock > 75 && env.carbonOrganics < 10) ||
    env.radiationLevel === 'extreme' || env.temperatureCelsius > 55) {
    return 'Silico-Crystalline Lineage'
  }
  if (env.radiationLevel === 'intense') return 'Radiotrophic-Litho Lineage'
  if (env.oceanLevel > 0.65) return 'Abyssal-Chemosynthetic Lineage'
  if (env.pressureAtm > 1.8) return 'Aero-Atmospheric Lineage'
  return 'Terran-Carbon Lineage'
}

function deriveMorphologyDescription(
  morphologyTraits: readonly MorphologyTrait[],
  lifeArch: LifeArchitecture,
  env: PlanetEnv
): string {
  if (lifeArch === 'unicellular') {
    if (env.temperatureCelsius < -10) return 'Single-cell membrane organism adapted to cryogenic solvent'
    if (env.radiationLevel === 'extreme') return 'Radiation-hardened unicellular form with dense molecular shielding'
    return 'Microscopic single-cell organism with membrane-based metabolic exchange'
  }

  const primary = morphologyTraits[0]
  switch (primary) {
    case 'bilateral': return 'Bilaterally symmetric body with directed locomotion capability'
    case 'radial': return 'Radially symmetric body, optimized for sessile or slow-moving feeding'
    case 'segmented': return 'Segmented body plan with repeated structural units'
    case 'spherical': return 'Compact spherical body form minimizing surface-to-volume ratio'
    case 'asymmetrical': return 'Asymmetric body form common in early multicellular and colonial organisms'
    case 'modular_body': return 'Modular body composed of semi-independent repeating units'
    case 'distributed_body': return 'Distributed body form without defined individual boundary'
    default: return 'Compact multicellular body form'
  }
}

function deriveLocomotionDescription(
  locomotionTraits: readonly LocomotionTrait[],
  env: PlanetEnv
): string {
  const primary = locomotionTraits[0]
  switch (primary) {
    case 'stationary': return 'Permanently anchored to substrate; no active movement'
    case 'passive_drift': return `Passive drift via ${env.oceanLevel > 0.5 ? 'ocean' : 'atmospheric'} currents`
    case 'swimming': return 'Active propulsion through liquid medium'
    case 'fluid_propulsion': return 'Jet-propulsion through fluid expulsion'
    case 'powered_flight': return `Powered flight through ${env.pressureAtm > 1.5 ? 'dense' : 'standard'} atmosphere`
    case 'crawling': return 'Surface crawling with direct substrate contact'
    case 'surface_glide': return 'Smooth gliding across substrate surface'
    case 'burrowing': return 'Active burrowing through substrate'
    default: return 'Multi-mode locomotion adapted to varied terrain'
  }
}

function deriveNotableAdaptations(
  expressed: ReturnType<typeof GeneExpression.expressGenotype>,
  _env: PlanetEnv,
  energyStrategies: readonly EnergyStrategy[],
  defenseTraits: readonly DefenseTrait[],
  hereditarySystem: HereditarySystem
): readonly string[] {
  const adaptations: string[] = []

  // Thermal adaptation
  if (expressed.thermalOptimumCelsius <= -15) {
    adaptations.push('Cryogenic membrane stabilization for sub-zero environments')
  } else if (expressed.thermalOptimumCelsius >= 50) {
    adaptations.push('Thermostable molecular architecture for extreme heat')
  } else {
    adaptations.push('Homeostatic thermal regulation within viable range')
  }

  // Water
  if (expressed.waterConservation >= 0.75) adaptations.push('Advanced desiccation resistance mechanisms')

  // Radiation
  if (expressed.radiationResistance >= 0.7) adaptations.push('Enhanced molecular repair under ionizing radiation')

  // Energy
  if (energyStrategies.includes('photonic') && energyStrategies.includes('chemosynthetic')) {
    adaptations.push('Dual-mode energy acquisition: photonic and chemosynthetic')
  } else if (energyStrategies.includes('radiation')) {
    adaptations.push('Radiotrophic energy capture [SPECULATIVE]')
  }

  // Hereditary system
  if (hereditarySystem === 'alternative_biochemical') {
    adaptations.push('Non-standard biochemical replication system [SPECULATIVE]')
  } else if (hereditarySystem === 'multi_strand') {
    adaptations.push('Multi-strand hereditary system with redundant error correction')
  }

  // Defense
  if (defenseTraits.includes('regeneration')) adaptations.push('Rapid tissue regeneration capability')

  return adaptations
}

// ---------------------------------------------------------------------------
// Name generation — emergent, not Earth template lookup
// ---------------------------------------------------------------------------

const LINEAGE_PREFIXES = [
  'Aero', 'Bathy', 'Chemo', 'Cryo', 'Electro', 'Ferro', 'Geo',
  'Hydro', 'Lith', 'Photo', 'Radio', 'Silico', 'Thermo', 'Xeno',
]

const TROPHIC_SUFFIXES: Record<TrophicStrategy, string> = {
  producer: 'troph',
  consumer: 'vore',
  decomposer: 'phage',
  recycler: 'cycle',
  predator: 'hunt',
  prey: 'bait',
  parasite: 'para',
  symbiont: 'sym',
  opportunist: 'flex',
}

const MORPH_SUFFIXES: Record<MorphologyTrait, string> = {
  bilateral: 'tera',
  radial: 'radia',
  spherical: 'sphere',
  compact: 'compacta',
  asymmetrical: 'asymmetrix',
  segmented: 'segmenta',
  branched: 'arbor',
  tubular: 'tubula',
  flattened: 'plana',
  modular_body: 'modula',
  distributed_body: 'retis',
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export class UniversalTaxonomyEngine {
  /**
   * Core method: derives a full TraitProfile from genotype × planet environment.
   *
   * CRITICAL: This method does NOT contain any "generation >= N → tier" logic.
   * All traits emerge from the genotype's phenotype values and the planetary environment.
   * complexityIndex is derived AFTER trait resolution, never used to gate traits.
   *
   * @param genotype - The organism's genetic makeup
   * @param planetConfig - Current planetary environment
   * @param lineageId - ID for this lineage (used in profile)
   */
  static evaluateTraitProfile(
    genotype: Genotype,
    planetConfig: PlanetConfig,
    lineageId: string = 'unknown'
  ): TraitProfile {
    const expressed = GeneExpression.expressGenotype(genotype)
    const env = extractPlanetEnv(planetConfig)

    // Derive all trait categories from genotype × environment
    const lifeArchitecture = deriveLifeArchitecture(expressed, env)
    const { system: hereditarySystem, isSpeculative: isSpeculativeHeredity } =
      deriveHereditarySystem(expressed, env)
    const energyStrategies = deriveEnergyStrategies(expressed, env)
    const trophicStrategies = deriveTrophicStrategies(energyStrategies, expressed, env)
    const environmentalTolerance = deriveEnvironmentalTolerance(expressed)
    const morphologyTraits = deriveMorphologyTraits(expressed, lifeArchitecture)
    const locomotionTraits = deriveLocomotionTraits(expressed, env)
    const reproductionModes = deriveReproductionModes(expressed, lifeArchitecture)
    const sensoryTraits = deriveSensoryTraits(expressed, env)
    const defenseTraits = deriveDefenseTraits(expressed, env)
    const behaviorTraits = deriveBehaviorTraits(expressed)
    const lifeCycle = deriveLifeCycle(expressed)

    // Derived observations — NEVER used to gate trait expression
    const complexityIndex = deriveComplexityIndex(
      expressed, lifeArchitecture, behaviorTraits, sensoryTraits
    )
    const specialistScore = 1.0 - Math.min(1, energyStrategies.length * 0.25)
    const mobilityScore = expressed.mobility
    const metabolicDemand = expressed.metabolicRate / 2.8

    // Labels
    const classificationLabel = deriveClassificationLabel(
      lifeArchitecture, trophicStrategies, morphologyTraits, energyStrategies
    )
    const lineageLabel = derivePlanetaryLineageLabel(env)
    const morphologyDescription = deriveMorphologyDescription(morphologyTraits, lifeArchitecture, env)
    const locomotionDescription = deriveLocomotionDescription(locomotionTraits, env)
    const notableAdaptations = deriveNotableAdaptations(
      expressed, env, energyStrategies, defenseTraits, hereditarySystem
    )

    // Speculative trait inventory
    const speculativeTraitIds: string[] = []
    if (isSpeculativeHeredity) speculativeTraitIds.push(`heredity.${hereditarySystem}`)
    if (energyStrategies.includes('radiation')) speculativeTraitIds.push('energy.radiation')
    if (energyStrategies.includes('thermal_gradient')) speculativeTraitIds.push('energy.thermal_gradient')
    if (lifeArchitecture === 'distributed') speculativeTraitIds.push('life_arch.distributed')

    return {
      lineageId,
      profileVersion: 1,
      lifeArchitecture,
      hereditarySystem,
      isSpeculativeHeredity,
      energyStrategies,
      trophicStrategies,
      environmentalTolerance,
      morphologyTraits,
      locomotionTraits,
      reproductionModes,
      sensoryTraits,
      defenseTraits,
      behaviorTraits,
      lifeCycle,
      complexityIndex,
      specialistScore,
      mobilityScore,
      metabolicDemand,
      classificationLabel,
      lineageLabel,
      morphologyDescription,
      locomotionDescription,
      notableAdaptations,
      hasSpeculativeTraits: speculativeTraitIds.length > 0,
      speculativeTraitIds,
    }
  }

  /**
   * Derives the authentic biological EvolutionTier from genotype × planetary environment,
   * completely decoupled from generation count.
   *
   * Biological Milestones:
   * 1. Unicellular prokaryote vs eukaryote (metabolic rate & compartmentalization).
   * 2. Colonial aggregate (simple_multicellular).
   * 3. Differentiated tissue (plantae, early metazoan, fungi).
   * 4. Metazoan Animals (primitive_animal / radial vs complex_bilaterian / bilateral).
   * 5. Advanced (circulatory, vascular, organ systems).
   * 6. Sapient (learning, high neural complexity, K-strategy investment).
   */
  static deriveEvolutionTier(
    genotype: Genotype,
    planetConfig: PlanetConfig
  ): EvolutionTier {
    const expressed = GeneExpression.expressGenotype(genotype)
    const profile = UniversalTaxonomyEngine.evaluateTraitProfile(genotype, planetConfig)
    const { lifeArchitecture, complexityIndex, trophicStrategies, morphologyTraits, behaviorTraits } = profile

    if (lifeArchitecture === 'unicellular') {
      return expressed.metabolicRate >= 1.6 ? 'eukaryote' : 'prokaryote'
    }
    if (lifeArchitecture === 'colonial') {
      return 'simple_multicellular'
    }
    // Multicellular, modular, distributed, hybrid
    if (complexityIndex < 0.45) {
      return 'differentiated_tissue'
    }
    if (complexityIndex < 0.65) {
      const isAnimal = trophicStrategies.some(
        (t) => t === 'consumer' || t === 'predator' || t === 'parasite'
      )
      if (isAnimal) {
        return morphologyTraits.includes('bilateral')
          ? 'complex_bilaterian'
          : 'primitive_animal'
      }
      return 'differentiated_tissue'
    }
    if (complexityIndex < 0.85) {
      return 'advanced'
    }
    // High complexity (>= 0.85): requires sapient behavioral or neural prerequisites
    const isSapient = behaviorTraits.includes('learning_capable') || complexityIndex >= 0.88
    return isSapient ? 'sapient' : 'advanced'
  }

  /**
   * Classify a species-equivalent based on population data and chosen classification mode.
   * Species classification is NOT triggered by a single mutation (spec §7.3).
   *
   * @param geneticDistanceFromAncestor - [0,1] Euclidean genetic distance
   * @param persistenceGenerations - Number of generations this population has existed
   * @param speciationDistanceThreshold - Configurable threshold (default: 0.22)
   * @param minPersistenceGenerations - Minimum generations before speciation recognized (default: 3)
   * @param mode - Classification mode
   */
  static classifySpeciesEquivalent(
    speciesId: string,
    geneticDistanceFromAncestor: number,
    persistenceGenerations: number,
    speciationDistanceThreshold: number = 0.22,
    minPersistenceGenerations: number = 3,
    mode: SpeciesEquivalentMode = 'genetic_cluster'
  ): ClassificationResult {
    const isNewSpeciation =
      geneticDistanceFromAncestor > speciationDistanceThreshold &&
      persistenceGenerations >= minPersistenceGenerations

    return {
      speciesEquivalentId: speciesId,
      mode,
      label: `Species-${speciesId}`,
      isNewSpeciation,
      geneticDistanceFromAncestor,
      populationPersistenceGenerations: persistenceGenerations,
    }
  }

  /**
   * Detects convergent evolution between two lineages.
   * Convergence signal does NOT merge phylogenetic ancestry (spec §4.7).
   *
   * Returns null if lineages are too phylogenetically close (not true convergence).
   */
  static detectConvergence(
    lineageIdA: string,
    profileA: TraitProfile,
    lineageIdB: string,
    profileB: TraitProfile,
    isPhylogeneticallyRelated: boolean
  ): ConvergenceSignal | null {
    const sharedMorphology = profileA.morphologyTraits.filter((m) =>
      profileB.morphologyTraits.includes(m)
    )
    const sharedEnergy = profileA.energyStrategies.filter((e) =>
      profileB.energyStrategies.includes(e)
    )
    const sharedTrophic = profileA.trophicStrategies.filter((t) =>
      (profileB.trophicStrategies as readonly TrophicStrategy[]).includes(t)
    )
    const sharedLocomot = profileA.locomotionTraits.filter((l) =>
      profileB.locomotionTraits.includes(l)
    )

    const sharedTraitIds = [
      ...sharedMorphology.map((m) => `morph.${m}`),
      ...sharedEnergy.map((e) => `energy.${e}`),
      ...sharedTrophic.map((t) => `trophic.${t}`),
      ...sharedLocomot.map((l) => `loco.${l}`),
    ]

    const totalPossible = Math.max(1,
      profileA.morphologyTraits.length + profileA.energyStrategies.length +
      profileA.trophicStrategies.length + profileA.locomotionTraits.length
    )
    const traitSimilarityScore = sharedTraitIds.length / totalPossible

    // No signal if similarity too low
    if (traitSimilarityScore < 0.3) return null

    return {
      lineageIdA,
      lineageIdB,
      sharedTraitIds,
      traitSimilarityScore: Number(traitSimilarityScore.toFixed(3)),
      isPhylogeneticallyRelated,
      description: isPhylogeneticallyRelated
        ? `Lineages ${lineageIdA} and ${lineageIdB} share ${sharedTraitIds.length} trait(s) due to common ancestry.`
        : `Convergent evolution detected: unrelated lineages ${lineageIdA} and ${lineageIdB} independently developed similar traits [${sharedTraitIds.join(', ')}].`,
    }
  }

  /**
   * Generates an emergent lineage name from trait profile data.
   * Does NOT use a fixed Earth template lookup (no hardcoded "humanoid/aquatic_cephalopod" names).
   * Names are constructed compositionally from trait categories.
   */
  static generateLineageName(profile: TraitProfile, index: number): string {
    const suffix = LETTERS[(index - 1) % LETTERS.length] ?? 'A'

    // Select prefix based on dominant energy strategy and environment
    let prefixIdx = 0
    if (profile.energyStrategies.includes('photonic')) prefixIdx = 7      // 'Photo'
    else if (profile.energyStrategies.includes('chemosynthetic')) prefixIdx = 2  // 'Chemo'
    else if (profile.energyStrategies.includes('radiation')) prefixIdx = 11  // 'Radio'
    else if (profile.environmentalTolerance.temperatureOptimum < -10) prefixIdx = 3  // 'Cryo'
    else if (profile.environmentalTolerance.temperatureOptimum > 50) prefixIdx = 14  // 'Thermo'
    else if (profile.environmentalTolerance.substrateDependency < 0.2) prefixIdx = 0  // 'Aero'
    else prefixIdx = Math.abs(index) % LINEAGE_PREFIXES.length

    const prefix = LINEAGE_PREFIXES[prefixIdx] ?? 'Xeno'

    // Trophic suffix
    const primaryTrophic = profile.trophicStrategies[0] ?? 'consumer'
    const trophicSuffix = TROPHIC_SUFFIXES[primaryTrophic] ?? 'vore'

    // Morphology suffix
    const primaryMorph = profile.morphologyTraits[0]
    const morphSuffix = primaryMorph ? MORPH_SUFFIXES[primaryMorph] : 'compacta'

    // Architecture indicator
    const archIndicator = profile.lifeArchitecture === 'unicellular' ? 'micro'
      : profile.lifeArchitecture === 'colonial' ? 'colony'
      : profile.lifeArchitecture === 'multicellular' ? 'meta'
      : profile.lifeArchitecture === 'modular' ? 'mod'
      : 'org'

    return `${prefix}${trophicSuffix} ${archIndicator}${morphSuffix} ${suffix}`
  }

  /**
   * Determines the direction of divergence for a speciation or divergence event.
   * Direction is an observation, not a goal (spec §3).
   */
  static determineDivergenceDirection(
    ancestorComplexity: number,
    descendantComplexity: number,
    ancestorMobility: number,
    descendantMobility: number
  ): DivergenceDirection {
    const complexityDelta = descendantComplexity - ancestorComplexity
    const mobilityDelta = descendantMobility - ancestorMobility

    if (complexityDelta > 0.1) return 'increasing_complexity'
    if (complexityDelta < -0.1) return 'decreasing_complexity'
    if (Math.abs(mobilityDelta) > 0.15) return 'local_specialization'
    return 'lateral_adaptation'
  }

  /**
   * Builds a DivergenceEvent record for use in PopulationManager history.
   */
  static buildDivergenceEvent(
    id: string,
    speciesId: string,
    speciesName: string,
    rotation: number,
    ancestorProfile: TraitProfile | null,
    descendantProfile: TraitProfile,
    geneticDistance: number
  ): DivergenceEvent {
    const direction = ancestorProfile
      ? UniversalTaxonomyEngine.determineDivergenceDirection(
          ancestorProfile.complexityIndex,
          descendantProfile.complexityIndex,
          ancestorProfile.mobilityScore,
          descendantProfile.mobilityScore
        )
      : 'lateral_adaptation'

    // Determine which trait categories changed significantly
    const affectedCategories: string[] = []
    if (ancestorProfile) {
      if (ancestorProfile.lifeArchitecture !== descendantProfile.lifeArchitecture) {
        affectedCategories.push('LifeArchitecture')
      }
      if (ancestorProfile.energyStrategies[0] !== descendantProfile.energyStrategies[0]) {
        affectedCategories.push('EnergyAcquisition')
      }
      if (ancestorProfile.trophicStrategies[0] !== descendantProfile.trophicStrategies[0]) {
        affectedCategories.push('TrophicStrategy')
      }
      if (ancestorProfile.morphologyTraits[0] !== descendantProfile.morphologyTraits[0]) {
        affectedCategories.push('Morphology')
      }
      if (ancestorProfile.locomotionTraits[0] !== descendantProfile.locomotionTraits[0]) {
        affectedCategories.push('Locomotion')
      }
    }
    if (affectedCategories.length === 0) affectedCategories.push('Genetics')

    const directionLabel: Record<DivergenceDirection, string> = {
      increasing_complexity: 'increasing structural complexity',
      decreasing_complexity: 'reduction in complexity (regressive divergence)',
      lateral_adaptation: 'lateral adaptation without directional change',
      convergent_trait: 'convergent trait development',
      local_specialization: 'local environmental specialization',
      generalist_broadening: 'generalist niche broadening',
      extinction_trajectory: 'trajectory toward extinction',
    }

    const isSpeculative = descendantProfile.hasSpeculativeTraits

    return {
      id,
      speciesId,
      speciesName,
      rotation,
      direction,
      geneticDistance: Number(geneticDistance.toFixed(4)),
      affectedTraitCategories: affectedCategories,
      description: `${speciesName} diverged with ${directionLabel[direction]}, affecting [${affectedCategories.join(', ')}].${isSpeculative ? ' [Contains speculative traits]' : ''}`,
      isSpeculative,
    }
  }

  /**
   * Determines SpeciesEquivalentMode from reproduction modes.
   * Asexual organisms use asexual_lineage mode (Mayr concept doesn't apply).
   */
  static inferSpeciesEquivalentMode(
    reproductionModes: readonly ReproductionMode[]
  ): SpeciesEquivalentMode {
    if (
      reproductionModes.includes('genetic_mixing') ||
      reproductionModes.includes('multi_parent')
    ) {
      return 'reproductive'
    }
    if (reproductionModes.includes('binary_fission') || reproductionModes.includes('clonal')) {
      return 'asexual_lineage'
    }
    if (reproductionModes.includes('spore_based') || reproductionModes.includes('fragmentation')) {
      return 'genetic_cluster'
    }
    return 'genetic_cluster'
  }

  /**
   * Validates a TraitProfile for internal consistency.
   * Checks:
   *  1. complexityIndex is in [0, 1]
   *  2. energyStrategies is non-empty
   *  3. trophicStrategies is non-empty
   *  4. Registry-level trait compatibility via TraitRegistry.validateTraitSet
   *
   * Logs warnings for invalid combinations; returns whether profile is clean.
   * Does NOT throw — invalid combos from extreme conditions are logged and surfaced.
   */
  static validateProfile(profile: TraitProfile): boolean {
    // Guard: structural invariants that registry cannot check
    if (profile.complexityIndex < 0 || profile.complexityIndex > 1) {
      console.warn(
        `[UniversalTaxonomyEngine] TraitProfile for lineage "${profile.lineageId}" has complexityIndex out of [0,1]: ${profile.complexityIndex}`
      )
      return false
    }
    if (!profile.energyStrategies || profile.energyStrategies.length === 0) {
      console.warn(
        `[UniversalTaxonomyEngine] TraitProfile for lineage "${profile.lineageId}" has no energyStrategies.`
      )
      return false
    }
    if (!profile.trophicStrategies || profile.trophicStrategies.length === 0) {
      console.warn(
        `[UniversalTaxonomyEngine] TraitProfile for lineage "${profile.lineageId}" has no trophicStrategies.`
      )
      return false
    }

    // Registry-level compatibility check (unknown ids become warnings, not violations)
    const allTraitIds: string[] = [
      `life_arch.${profile.lifeArchitecture}`,
      `heredity.${profile.hereditarySystem}`,
      ...profile.energyStrategies.map((e) => `energy.${e}`),
      ...profile.morphologyTraits.map((m) => `morph.${m}`),
      ...profile.locomotionTraits.map((l) => `loco.${l}`),
      ...profile.reproductionModes.map((r) => `repro.${r}`),
    ]

    const result = TraitRegistry.validateTraitSet(allTraitIds)

    if (!result.isValid) {
      console.warn(
        `[UniversalTaxonomyEngine] TraitProfile for lineage "${profile.lineageId}" has ${result.violations.length} invalid combination(s):`,
        result.violations.map((v) => v.reason).join('; ')
      )
    }

    return result.isValid
  }
}

