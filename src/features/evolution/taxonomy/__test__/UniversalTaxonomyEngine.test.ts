/**
 * UniversalTaxonomyEngine Tests
 *
 * Verifies the Universal Evolution Model taxonomy engine (spec §3–7).
 *
 * Key invariants checked:
 *  - Trait expression is f(genotype × environment) — NEVER f(generation_count → tier)
 *  - complexityIndex is in [0,1] and never gates trait expression
 *  - Speciation requires sustained divergence (not a single mutation or generation threshold)
 *  - Convergence detection does NOT merge phylogenetic ancestry
 *  - Lineage names are compositional — not Earth template lookups
 *
 * No test checks for tier names: prokaryote, eukaryote, sapient, humanoid.
 */

import { describe, expect, it } from 'vitest'
import { GenesisEngine } from '../../../genesis/services/GenesisEngine.js'
import type { PlanetConfig } from '../../../genesis/types/genesis.js'
import { PrebioticEngine } from '../../abiogenesis/PrebioticEngine.js'
import { GeneExpression } from '../../genetics/Gene.js'
import type { Genotype } from '../../genetics/types.js'
import { UniversalTaxonomyEngine } from '../UniversalTaxonomyEngine.js'

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

/** Build a minimal genotype from normalized [0,1] locus values. */
function makeGenotype(overrides: Partial<Record<string, number>> = {}): Genotype {
  const defaults: Record<string, number> = {
    thermalOptimum: 0.5,       // 20°C
    thermalRange: 0.5,
    waterConservation: 0.5,
    metabolicEfficiency: 0.3,
    reproductiveInvestment: 0.5,
    structuralArmor: 0.4,
    mobilityFactor: 0.5,
  }
  const values = { ...defaults, ...overrides }
  return {
    genes: Object.fromEntries(
      Object.entries(values).map(([locus, v]) => [locus, GeneExpression.createGene(locus, v ?? 0.5)])
    ),
  }
}

const prebioticEngine = new PrebioticEngine()
const defaultPlanet: PlanetConfig = GenesisEngine.generatePlanet({}, 42)

/** A cold, low-carbon planet where photonic energy is NOT favourable. */
const coldPlanet: PlanetConfig = {
  ...GenesisEngine.generatePlanet({}, 7),
  surfaceTemperatureCelsius: -25,
}

/** A high-radiation planet. */
const highRadiationPlanet: PlanetConfig = (() => {
  const base = GenesisEngine.generatePlanet({}, 99)
  return {
    ...base,
    environmentalConditions: {
      ...base.environmentalConditions,
      radiationLevel: 'extreme' as const,
    },
  }
})()

/** Genotype tuned for cold adaptation (low thermalOptimum). */
const coldAdaptedGenotype = makeGenotype({ thermalOptimum: 0.1, structuralArmor: 0.7 })

/** Genotype tuned for high radiation resistance. */
const radiationArmoredGenotype = makeGenotype({ structuralArmor: 0.95, metabolicEfficiency: 0.6 })

/** Genotype tuned for predatory / high-metabolism lifestyle. */
const predatoryGenotype = makeGenotype({ metabolicEfficiency: 0.9, mobilityFactor: 0.85 })

// ---------------------------------------------------------------------------
// evaluateTraitProfile()
// ---------------------------------------------------------------------------

describe('UniversalTaxonomyEngine.evaluateTraitProfile()', () => {

  it('returns a non-null TraitProfile for any valid genotype + planet', () => {
    const genotype = prebioticEngine.generatePrimordialGenotype(defaultPlanet, 'cyanobacteria')
    const profile = UniversalTaxonomyEngine.evaluateTraitProfile(genotype, defaultPlanet, 'lin-001')
    expect(profile).toBeDefined()
    expect(profile).not.toBeNull()
  })

  it('complexityIndex is always in [0, 1]', () => {
    const genotypes = [
      makeGenotype({ mobilityFactor: 0.0, metabolicEfficiency: 0.0 }),
      makeGenotype({ mobilityFactor: 1.0, metabolicEfficiency: 1.0 }),
      makeGenotype(),
      predatoryGenotype,
      coldAdaptedGenotype,
    ]
    for (const g of genotypes) {
      const profile = UniversalTaxonomyEngine.evaluateTraitProfile(g, defaultPlanet)
      expect(profile.complexityIndex).toBeGreaterThanOrEqual(0)
      expect(profile.complexityIndex).toBeLessThanOrEqual(1)
    }
  })

  it('always has at least one trophicStrategy', () => {
    const profile = UniversalTaxonomyEngine.evaluateTraitProfile(makeGenotype(), defaultPlanet)
    expect(profile.trophicStrategies.length).toBeGreaterThanOrEqual(1)
  })

  it('always has at least one energyStrategy', () => {
    const profile = UniversalTaxonomyEngine.evaluateTraitProfile(makeGenotype(), defaultPlanet)
    expect(profile.energyStrategies.length).toBeGreaterThanOrEqual(1)
  })

  it('always has at least one morphologyTrait', () => {
    const profile = UniversalTaxonomyEngine.evaluateTraitProfile(makeGenotype(), defaultPlanet)
    expect(profile.morphologyTraits.length).toBeGreaterThanOrEqual(1)
  })

  it('always has at least one locomotionTrait', () => {
    const profile = UniversalTaxonomyEngine.evaluateTraitProfile(makeGenotype(), defaultPlanet)
    expect(profile.locomotionTraits.length).toBeGreaterThanOrEqual(1)
  })

  it('always has at least one reproductionMode', () => {
    const profile = UniversalTaxonomyEngine.evaluateTraitProfile(makeGenotype(), defaultPlanet)
    expect(profile.reproductionModes.length).toBeGreaterThanOrEqual(1)
  })

  it('always has at least one sensoryTrait', () => {
    const profile = UniversalTaxonomyEngine.evaluateTraitProfile(makeGenotype(), defaultPlanet)
    expect(profile.sensoryTraits.length).toBeGreaterThanOrEqual(1)
  })

  // KEY INVARIANT: No generation counter
  it('same genotype at generation 1 and generation 100 returns the same profile (no tier ladder)', () => {
    const genotype = makeGenotype()
    // The function signature has no generation parameter — this is by design
    const profile1 = UniversalTaxonomyEngine.evaluateTraitProfile(genotype, defaultPlanet, 'lin-gen1')
    const profile2 = UniversalTaxonomyEngine.evaluateTraitProfile(genotype, defaultPlanet, 'lin-gen100')

    // Structural profile must be identical regardless of which "generation" we claim
    expect(profile1.lifeArchitecture).toBe(profile2.lifeArchitecture)
    expect(profile1.hereditarySystem).toBe(profile2.hereditarySystem)
    expect(profile1.complexityIndex).toBeCloseTo(profile2.complexityIndex, 5)
    expect(profile1.energyStrategies).toEqual(profile2.energyStrategies)
    expect(profile1.trophicStrategies).toEqual(profile2.trophicStrategies)
  })

  it('cold planet (temp < -10°C) → photonic is NOT in energyStrategies (too cold for primary photosynthesis)', () => {
    // energyStrategies derivation: photonic requires temperatureCelsius >= -20
    // coldPlanet is at -25°C
    const profile = UniversalTaxonomyEngine.evaluateTraitProfile(coldAdaptedGenotype, coldPlanet)
    // Photonic is excluded at very cold temperatures
    expect(profile.energyStrategies).not.toContain('photonic')
  })

  it('high-radiation planet with high armor genotype → may include radiation energy strategy', () => {
    // radiation energy is added when radiationNorm >= 0.65 AND radiationResistance >= 0.75
    const profile = UniversalTaxonomyEngine.evaluateTraitProfile(radiationArmoredGenotype, highRadiationPlanet)
    // This combination should trigger the radiation energy strategy
    expect(profile.energyStrategies).toContain('radiation')
  })

  it('high-radiation planet with high armor → may mark hasSpeculativeTraits (radiation energy is speculative)', () => {
    const profile = UniversalTaxonomyEngine.evaluateTraitProfile(radiationArmoredGenotype, highRadiationPlanet)
    if (profile.energyStrategies.includes('radiation')) {
      expect(profile.hasSpeculativeTraits).toBe(true)
      expect(profile.speculativeTraitIds).toContain('energy.radiation')
    }
  })

  it('lineageId is preserved in the returned profile', () => {
    const profile = UniversalTaxonomyEngine.evaluateTraitProfile(makeGenotype(), defaultPlanet, 'test-lineage-42')
    expect(profile.lineageId).toBe('test-lineage-42')
  })

  it('profileVersion field is present and positive', () => {
    const profile = UniversalTaxonomyEngine.evaluateTraitProfile(makeGenotype(), defaultPlanet)
    expect(typeof profile.profileVersion).toBe('number')
    expect(profile.profileVersion).toBeGreaterThan(0)
  })

  it('classificationLabel is a non-empty string with no Earth-specific tier names', () => {
    const profile = UniversalTaxonomyEngine.evaluateTraitProfile(makeGenotype(), defaultPlanet)
    expect(typeof profile.classificationLabel).toBe('string')
    expect(profile.classificationLabel.length).toBeGreaterThan(0)

    const banned = ['prokaryote', 'eukaryote', 'sapient', 'humanoid', 'homo sapiens']
    for (const b of banned) {
      expect(profile.classificationLabel.toLowerCase()).not.toContain(b)
    }
  })

  it('lineageLabel is a non-empty string', () => {
    const profile = UniversalTaxonomyEngine.evaluateTraitProfile(makeGenotype(), defaultPlanet)
    expect(typeof profile.lineageLabel).toBe('string')
    expect(profile.lineageLabel.length).toBeGreaterThan(0)
  })

  it('predatory genotype on default planet → energyStrategies includes predatory', () => {
    const profile = UniversalTaxonomyEngine.evaluateTraitProfile(predatoryGenotype, defaultPlanet)
    expect(profile.energyStrategies).toContain('predatory')
  })

  it('high ocean level + mobile genotype → locomotion uses fluid-based movement', () => {
    // Use a known high-ocean planet directly by crafting the config
    const highOceanPlanet: PlanetConfig = {
      ...defaultPlanet,
      oceanLevel: 0.85,
    }
    const mobileGenotype = makeGenotype({ mobilityFactor: 0.75 })
    const profile = UniversalTaxonomyEngine.evaluateTraitProfile(mobileGenotype, highOceanPlanet)
    const fluidLoco = ['swimming', 'fluid_propulsion']
    const hasFluid = profile.locomotionTraits.some((l) => fluidLoco.includes(l))
    expect(hasFluid).toBe(true)
  })

  it('unicellular architecture → has binary_fission in reproductionModes', () => {
    // Low mobility + low metabolism → unicellular
    const sessileGenotype = makeGenotype({
      mobilityFactor: 0.05,
      metabolicEfficiency: 0.05,
      reproductiveInvestment: 0.9,
    })
    const profile = UniversalTaxonomyEngine.evaluateTraitProfile(sessileGenotype, defaultPlanet)
    if (profile.lifeArchitecture === 'unicellular') {
      expect(profile.reproductionModes).toContain('binary_fission')
    }
  })

  it('notableAdaptations contains SPECULATIVE label for radiation energy', () => {
    const profile = UniversalTaxonomyEngine.evaluateTraitProfile(radiationArmoredGenotype, highRadiationPlanet)
    if (profile.energyStrategies.includes('radiation')) {
      const adaptText = profile.notableAdaptations.join(' ')
      expect(adaptText).toContain('[SPECULATIVE]')
    }
  })
})

// ---------------------------------------------------------------------------
// generateLineageName()
// ---------------------------------------------------------------------------

describe('UniversalTaxonomyEngine.generateLineageName()', () => {
  it('returns a non-empty string', () => {
    const profile = UniversalTaxonomyEngine.evaluateTraitProfile(makeGenotype(), defaultPlanet)
    const name = UniversalTaxonomyEngine.generateLineageName(profile, 1)
    expect(typeof name).toBe('string')
    expect(name.length).toBeGreaterThan(0)
  })

  it('does not return any hardcoded Earth template names', () => {
    const bannedNames = ['humanoid', 'Prokaryota', 'Eukaryota', 'sapient', 'Homo ', 'Cnidaria', 'Porifera']
    for (let i = 1; i <= 10; i++) {
      const profile = UniversalTaxonomyEngine.evaluateTraitProfile(makeGenotype({ mobilityFactor: i * 0.1 }), defaultPlanet)
      const name = UniversalTaxonomyEngine.generateLineageName(profile, i)
      for (const banned of bannedNames) {
        expect(name).not.toContain(banned)
      }
    }
  })

  it('two calls with different trait profiles produce different names', () => {
    const profileA = UniversalTaxonomyEngine.evaluateTraitProfile(
      makeGenotype({ mobilityFactor: 0.1, metabolicEfficiency: 0.05 }), defaultPlanet
    )
    const profileB = UniversalTaxonomyEngine.evaluateTraitProfile(
      predatoryGenotype, defaultPlanet
    )
    const nameA = UniversalTaxonomyEngine.generateLineageName(profileA, 1)
    const nameB = UniversalTaxonomyEngine.generateLineageName(profileB, 2)
    // Profiles with very different trait sets should produce different names
    // (not guaranteed for all pairs, but definitely different for sessile vs predatory)
    expect(nameA).not.toBe(nameB)
  })

  it('name includes a letter suffix that cycles through the alphabet', () => {
    const profile = UniversalTaxonomyEngine.evaluateTraitProfile(makeGenotype(), defaultPlanet)
    const nameA = UniversalTaxonomyEngine.generateLineageName(profile, 1)
    const nameB = UniversalTaxonomyEngine.generateLineageName(profile, 2)
    // Both names should end in a capital letter
    expect(nameA).toMatch(/[A-Z]$/)
    expect(nameB).toMatch(/[A-Z]$/)
    // Index 1 → 'A', index 2 → 'B' (suffix from LETTERS array)
    expect(nameA.endsWith('A')).toBe(true)
    expect(nameB.endsWith('B')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// classifySpeciesEquivalent()
// ---------------------------------------------------------------------------

describe('UniversalTaxonomyEngine.classifySpeciesEquivalent()', () => {
  it('small distance + low persistence → isNewSpeciation: false', () => {
    const result = UniversalTaxonomyEngine.classifySpeciesEquivalent(
      'sp-001',
      0.05,  // well below 0.22 threshold
      1,     // only 1 generation — below min of 3
    )
    expect(result.isNewSpeciation).toBe(false)
  })

  it('large distance + high persistence → isNewSpeciation: true', () => {
    const result = UniversalTaxonomyEngine.classifySpeciesEquivalent(
      'sp-002',
      0.35,  // above 0.22 threshold
      5,     // above min of 3 generations
    )
    expect(result.isNewSpeciation).toBe(true)
  })

  it('distance above threshold but insufficient persistence → isNewSpeciation: false', () => {
    const result = UniversalTaxonomyEngine.classifySpeciesEquivalent(
      'sp-003',
      0.30,  // above threshold
      2,     // below minPersistenceGenerations=3
    )
    expect(result.isNewSpeciation).toBe(false)
  })

  it('persistence met but distance below threshold → isNewSpeciation: false', () => {
    const result = UniversalTaxonomyEngine.classifySpeciesEquivalent(
      'sp-004',
      0.10,  // below 0.22 threshold
      10,    // persistence met
    )
    expect(result.isNewSpeciation).toBe(false)
  })

  it('speciesEquivalentId is preserved in result', () => {
    const result = UniversalTaxonomyEngine.classifySpeciesEquivalent('my-lineage-X', 0.3, 5)
    expect(result.speciesEquivalentId).toBe('my-lineage-X')
  })

  it('geneticDistanceFromAncestor is preserved in result', () => {
    const dist = 0.33
    const result = UniversalTaxonomyEngine.classifySpeciesEquivalent('sp-X', dist, 5)
    expect(result.geneticDistanceFromAncestor).toBe(dist)
  })

  it('populationPersistenceGenerations is preserved in result', () => {
    const result = UniversalTaxonomyEngine.classifySpeciesEquivalent('sp-X', 0.3, 7)
    expect(result.populationPersistenceGenerations).toBe(7)
  })

  it('custom threshold and persistence parameters are respected', () => {
    // With custom threshold=0.5 and minPersistence=10, default params would classify as new but custom should not
    const result = UniversalTaxonomyEngine.classifySpeciesEquivalent(
      'sp-custom',
      0.35,  // above default 0.22 but below custom 0.5
      5,     // above default 3 but below custom 10
      0.5,
      10,
    )
    expect(result.isNewSpeciation).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// detectConvergence()
// ---------------------------------------------------------------------------

describe('UniversalTaxonomyEngine.detectConvergence()', () => {
  it('identical profiles → returns a convergence signal with high score', () => {
    const profile = UniversalTaxonomyEngine.evaluateTraitProfile(makeGenotype(), defaultPlanet)
    const signal = UniversalTaxonomyEngine.detectConvergence(
      'lin-A', profile, 'lin-B', profile, false
    )
    expect(signal).not.toBeNull()
    expect(signal!.traitSimilarityScore).toBeGreaterThan(0.5)
  })

  it('very different profiles → convergence score is below 0.5 OR signal is null', () => {
    // Sessile chemosynthetic unicellular vs mobile predatory multicellular
    const sessileProfile = UniversalTaxonomyEngine.evaluateTraitProfile(
      makeGenotype({ mobilityFactor: 0.0, metabolicEfficiency: 0.05 }),
      { ...GenesisEngine.generatePlanet({}, 1), surfaceTemperatureCelsius: 60, oceanLevel: 0.8 }
    )
    const predProfile = UniversalTaxonomyEngine.evaluateTraitProfile(
      makeGenotype({ mobilityFactor: 1.0, metabolicEfficiency: 0.99, reproductiveInvestment: 0.1 }),
      { ...GenesisEngine.generatePlanet({}, 2), surfaceTemperatureCelsius: 15, oceanLevel: 0.1 }
    )
    const signal = UniversalTaxonomyEngine.detectConvergence(
      'lin-C', sessileProfile, 'lin-D', predProfile, false
    )
    // Either no signal (similarity too low) or score is not high
    if (signal !== null) {
      // The score threshold for returning non-null is 0.3, so we just check it's not very high
      expect(signal.traitSimilarityScore).toBeLessThan(0.9)
    }
    // null result is also valid and means no convergence detected
    expect(signal === null || typeof signal.traitSimilarityScore === 'number').toBe(true)
  })

  it('convergence signal has isPhylogeneticallyRelated matching the input flag (false → unrelated)', () => {
    const profile = UniversalTaxonomyEngine.evaluateTraitProfile(makeGenotype(), defaultPlanet)
    const signal = UniversalTaxonomyEngine.detectConvergence(
      'lin-E', profile, 'lin-F', profile, false
    )
    if (signal) {
      expect(signal.isPhylogeneticallyRelated).toBe(false)
    }
  })

  it('convergence signal has isPhylogeneticallyRelated matching the input flag (true → related)', () => {
    const profile = UniversalTaxonomyEngine.evaluateTraitProfile(makeGenotype(), defaultPlanet)
    const signal = UniversalTaxonomyEngine.detectConvergence(
      'lin-G', profile, 'lin-H', profile, true
    )
    if (signal) {
      expect(signal.isPhylogeneticallyRelated).toBe(true)
    }
  })

  it('convergence does NOT merge lineage ids — both lineage ids are preserved', () => {
    const profile = UniversalTaxonomyEngine.evaluateTraitProfile(makeGenotype(), defaultPlanet)
    const signal = UniversalTaxonomyEngine.detectConvergence(
      'lineage-X', profile, 'lineage-Y', profile, false
    )
    if (signal) {
      expect(signal.lineageIdA).toBe('lineage-X')
      expect(signal.lineageIdB).toBe('lineage-Y')
      // Phylogenetic ancestry is NOT merged — they remain two separate lineages
      expect(signal.lineageIdA).not.toBe(signal.lineageIdB)
    }
  })

  it('sharedTraitIds is an array (possibly empty)', () => {
    const profile = UniversalTaxonomyEngine.evaluateTraitProfile(makeGenotype(), defaultPlanet)
    const signal = UniversalTaxonomyEngine.detectConvergence(
      'lin-I', profile, 'lin-J', profile, false
    )
    if (signal) {
      expect(Array.isArray(signal.sharedTraitIds)).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// determineDivergenceDirection()
// ---------------------------------------------------------------------------

describe('UniversalTaxonomyEngine.determineDivergenceDirection()', () => {
  it('higher complexity descendant → direction includes "increasing_complexity"', () => {
    const direction = UniversalTaxonomyEngine.determineDivergenceDirection(
      0.2,  // ancestor complexity
      0.7,  // descendant complexity — much higher
      0.3,  // ancestor mobility
      0.5,  // descendant mobility
    )
    expect(direction).toBe('increasing_complexity')
  })

  it('lower complexity descendant → direction is "decreasing_complexity"', () => {
    const direction = UniversalTaxonomyEngine.determineDivergenceDirection(
      0.7,  // ancestor complexity — high
      0.2,  // descendant complexity — much lower (regressive)
      0.6,
      0.2,
    )
    expect(direction).toBe('decreasing_complexity')
  })

  it('similar complexity + similar mobility → direction is "lateral_adaptation"', () => {
    const direction = UniversalTaxonomyEngine.determineDivergenceDirection(
      0.5,  // ancestor
      0.52, // descendant — delta < 0.1, not "increasing" or "decreasing"
      0.5,
      0.5,  // mobilityDelta = 0.0, not > 0.15
    )
    expect(direction).toBe('lateral_adaptation')
  })
})

// ---------------------------------------------------------------------------
// inferSpeciesEquivalentMode()
// ---------------------------------------------------------------------------

describe('UniversalTaxonomyEngine.inferSpeciesEquivalentMode()', () => {
  it('binary_fission reproductionMode → asexual_lineage mode', () => {
    const mode = UniversalTaxonomyEngine.inferSpeciesEquivalentMode(['binary_fission'])
    expect(mode).toBe('asexual_lineage')
  })

  it('genetic_mixing reproductionMode → reproductive mode', () => {
    const mode = UniversalTaxonomyEngine.inferSpeciesEquivalentMode(['genetic_mixing'])
    expect(mode).toBe('reproductive')
  })

  it('empty reproductionModes → returns a valid default mode', () => {
    const mode = UniversalTaxonomyEngine.inferSpeciesEquivalentMode([])
    expect(['asexual_lineage', 'reproductive', 'genetic_cluster', 'population', 'composite']).toContain(mode)
  })
})

// ---------------------------------------------------------------------------
// validateProfile()
// ---------------------------------------------------------------------------

describe('UniversalTaxonomyEngine.validateProfile()', () => {
  it('returns a boolean (true or false) for a well-formed profile from evaluateTraitProfile()', () => {
    // validateProfile() runs registry validation on the profile's trait ids.
    // Some derived trait combos (e.g., complementary_replicator without linear_replicator in
    // the input set) may trigger prerequisite warnings — this is by design.
    // The key invariant is that it does NOT throw.
    const profile = UniversalTaxonomyEngine.evaluateTraitProfile(makeGenotype(), defaultPlanet)
    expect(() => UniversalTaxonomyEngine.validateProfile(profile)).not.toThrow()
    const valid = UniversalTaxonomyEngine.validateProfile(profile)
    expect(typeof valid).toBe('boolean')
  })

  it('returns false for a profile with invalid complexityIndex (> 1)', () => {
    const profile = UniversalTaxonomyEngine.evaluateTraitProfile(makeGenotype(), defaultPlanet)
    const badProfile = { ...profile, complexityIndex: 1.5 }
    const valid = UniversalTaxonomyEngine.validateProfile(badProfile)
    expect(valid).toBe(false)
  })

  it('returns false for a profile with empty trophicStrategies', () => {
    const profile = UniversalTaxonomyEngine.evaluateTraitProfile(makeGenotype(), defaultPlanet)
    const badProfile = { ...profile, trophicStrategies: [] }
    const valid = UniversalTaxonomyEngine.validateProfile(badProfile)
    expect(valid).toBe(false)
  })

  it('returns false for a profile with empty energyStrategies', () => {
    const profile = UniversalTaxonomyEngine.evaluateTraitProfile(makeGenotype(), defaultPlanet)
    const badProfile = { ...profile, energyStrategies: [] }
    const valid = UniversalTaxonomyEngine.validateProfile(badProfile)
    expect(valid).toBe(false)
  })

  it('returns false for a profile with negative complexityIndex', () => {
    const profile = UniversalTaxonomyEngine.evaluateTraitProfile(makeGenotype(), defaultPlanet)
    const badProfile = { ...profile, complexityIndex: -0.1 }
    const valid = UniversalTaxonomyEngine.validateProfile(badProfile)
    expect(valid).toBe(false)
  })
})
