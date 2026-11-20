/**
 * TraitRegistry Tests
 *
 * Verifies the universal, data-driven trait registry (spec §5).
 * No test should reference Earth-specific tier names (prokaryote, eukaryote,
 * sapient, humanoid, etc.) — this registry is not Earth-biology-centric.
 */

import { describe, expect, it } from 'vitest'
import { TraitRegistry } from '../TraitRegistry.js'

// ---------------------------------------------------------------------------
// resolve()
// ---------------------------------------------------------------------------

describe('TraitRegistry.resolve()', () => {
  it('returns a definition for a known life-architecture trait id', () => {
    const def = TraitRegistry.resolve('life_arch.unicellular')
    expect(def).toBeDefined()
    expect(def?.id).toBe('life_arch.unicellular')
    expect(def?.category).toBe('LifeArchitecture')
    expect(def?.displayName).toBeTruthy()
  })

  it('returns a definition for a known hereditary-system trait id', () => {
    const def = TraitRegistry.resolve('heredity.complementary_replicator')
    expect(def).toBeDefined()
    expect(def?.id).toBe('heredity.complementary_replicator')
    expect(def?.category).toBe('HereditarySystem')
  })

  it('returns undefined for an unknown trait id', () => {
    const def = TraitRegistry.resolve('totally.unknown.trait.id')
    expect(def).toBeUndefined()
  })

  it('returns definition with all required fields populated', () => {
    const def = TraitRegistry.resolve('life_arch.multicellular')
    expect(def).toBeDefined()
    if (!def) return
    expect(typeof def.id).toBe('string')
    expect(typeof def.category).toBe('string')
    expect(typeof def.displayName).toBe('string')
    expect(typeof def.description).toBe('string')
    expect(Array.isArray(def.prerequisites)).toBe(true)
    expect(Array.isArray(def.incompatibleWith)).toBe(true)
    expect(typeof def.isSpeculative).toBe('boolean')
    expect(typeof def.baseFitnessModifier).toBe('number')
    expect(typeof def.mutationBias).toBe('number')
    expect(typeof def.expressionThreshold).toBe('number')
  })
})

// ---------------------------------------------------------------------------
// getByCategory()
// ---------------------------------------------------------------------------

describe('TraitRegistry.getByCategory()', () => {
  it('returns all LifeArchitecture entries — at least the 5 canonical types', () => {
    const defs = TraitRegistry.getByCategory('LifeArchitecture')
    expect(defs.length).toBeGreaterThanOrEqual(5)
    const ids = defs.map((d) => d.id)
    expect(ids).toContain('life_arch.unicellular')
    expect(ids).toContain('life_arch.multicellular')
    expect(ids).toContain('life_arch.colonial')
    expect(ids).toContain('life_arch.distributed')
    expect(ids).toContain('life_arch.modular')
  })

  it('returns all HereditarySystem entries — at least 5 types', () => {
    const defs = TraitRegistry.getByCategory('HereditarySystem')
    expect(defs.length).toBeGreaterThanOrEqual(5)
    const ids = defs.map((d) => d.id)
    expect(ids).toContain('heredity.alternative_biochemical')
    expect(ids).toContain('heredity.complementary_replicator')
  })

  it('every entry returned by getByCategory() matches the requested category', () => {
    const categories = [
      'LifeArchitecture',
      'HereditarySystem',
      'EnergyAcquisition',
      'TrophicStrategy',
      'EnvironmentalTolerance',
      'Morphology',
      'Locomotion',
      'Reproduction',
      'SensorySystems',
      'Defense',
      'Behavior',
      'LifeCycle',
    ] as const

    for (const cat of categories) {
      const defs = TraitRegistry.getByCategory(cat)
      for (const def of defs) {
        expect(def.category).toBe(cat)
      }
    }
  })

  it('returns an empty array for an unknown category', () => {
    // @ts-expect-error – intentional invalid input for runtime safety check
    const defs = TraitRegistry.getByCategory('NonExistentCategory')
    expect(defs).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// getAll()
// ---------------------------------------------------------------------------

describe('TraitRegistry.getAll()', () => {
  it('returns at least 40 trait definitions', () => {
    const all = TraitRegistry.getAll()
    expect(all.length).toBeGreaterThanOrEqual(40)
  })

  it('every entry has a unique id', () => {
    const all = TraitRegistry.getAll()
    const ids = all.map((d) => d.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('no trait id contains Earth-specific tier names', () => {
    const bannedTerms = ['prokaryote', 'eukaryote', 'sapient', 'humanoid', 'homo_sapiens']
    const all = TraitRegistry.getAll()
    for (const def of all) {
      for (const banned of bannedTerms) {
        expect(def.id.toLowerCase()).not.toContain(banned)
      }
    }
  })
})

// ---------------------------------------------------------------------------
// getAllIds()
// ---------------------------------------------------------------------------

describe('TraitRegistry.getAllIds()', () => {
  it('returns an array of strings matching all definition ids', () => {
    const ids = TraitRegistry.getAllIds()
    const all = TraitRegistry.getAll()
    expect(ids.length).toBe(all.length)
    for (const id of ids) {
      expect(typeof id).toBe('string')
    }
  })
})

// ---------------------------------------------------------------------------
// getSpeculative()
// ---------------------------------------------------------------------------

describe('TraitRegistry.getSpeculative()', () => {
  it('returns only entries with isSpeculative: true', () => {
    const speculative = TraitRegistry.getSpeculative()
    expect(speculative.length).toBeGreaterThan(0)
    for (const def of speculative) {
      expect(def.isSpeculative).toBe(true)
    }
  })

  it('speculative entries include alternative_biochemical hereditary system', () => {
    const speculative = TraitRegistry.getSpeculative()
    const ids = speculative.map((d) => d.id)
    expect(ids).toContain('heredity.alternative_biochemical')
  })

  it('non-speculative traits do NOT appear in getSpeculative()', () => {
    const speculative = TraitRegistry.getSpeculative()
    const ids = speculative.map((d) => d.id)
    // Unicellular and complementary_replicator are established science
    expect(ids).not.toContain('life_arch.unicellular')
    expect(ids).not.toContain('heredity.complementary_replicator')
  })
})

// ---------------------------------------------------------------------------
// areIncompatible()
// ---------------------------------------------------------------------------

describe('TraitRegistry.areIncompatible()', () => {
  it('unicellular and multicellular are incompatible', () => {
    expect(
      TraitRegistry.areIncompatible('life_arch.unicellular', 'life_arch.multicellular')
    ).toBe(true)
  })

  it('incompatibility is symmetric: (A, B) === (B, A)', () => {
    const ab = TraitRegistry.areIncompatible('life_arch.unicellular', 'life_arch.multicellular')
    const ba = TraitRegistry.areIncompatible('life_arch.multicellular', 'life_arch.unicellular')
    expect(ab).toBe(ba)
  })

  it('compatible traits return false', () => {
    // multicellular and chemosynthetic energy are not inherently incompatible
    expect(
      TraitRegistry.areIncompatible('life_arch.multicellular', 'energy.chemosynthetic')
    ).toBe(false)
  })

  it('a trait is not incompatible with itself', () => {
    expect(
      TraitRegistry.areIncompatible('life_arch.unicellular', 'life_arch.unicellular')
    ).toBe(false)
  })

  it('unknown trait ids return false without throwing', () => {
    expect(() =>
      TraitRegistry.areIncompatible('nonexistent.a', 'nonexistent.b')
    ).not.toThrow()
    expect(
      TraitRegistry.areIncompatible('nonexistent.a', 'nonexistent.b')
    ).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// validateTraitSet()
// ---------------------------------------------------------------------------

describe('TraitRegistry.validateTraitSet()', () => {
  it('passes for a valid non-conflicting trait set', () => {
    const result = TraitRegistry.validateTraitSet([
      'life_arch.unicellular',
      'heredity.linear_replicator',
    ])
    expect(result.isValid).toBe(true)
    expect(result.violations).toHaveLength(0)
  })

  it('flags incompatible pair: unicellular + multicellular → isValid false', () => {
    const result = TraitRegistry.validateTraitSet([
      'life_arch.unicellular',
      'life_arch.multicellular',
    ])
    expect(result.isValid).toBe(false)
    expect(result.violations.length).toBeGreaterThan(0)
    // Violation reason should mention the incompatibility, not a tier name
    const violationText = result.violations.map((v) => v.reason).join(' ').toLowerCase()
    expect(violationText).toContain('incompatible')
  })

  it('flags missing prerequisite: colonial requires unicellular', () => {
    // colonial has prerequisite: life_arch.unicellular
    const result = TraitRegistry.validateTraitSet([
      'life_arch.colonial',
      'heredity.complementary_replicator',
      // life_arch.unicellular is intentionally omitted
    ])
    // Should flag the missing prerequisite
    expect(result.isValid).toBe(false)
    expect(result.violations.length).toBeGreaterThan(0)
  })

  it('issues warning for speculative traits — warnings array is non-empty', () => {
    const result = TraitRegistry.validateTraitSet([
      'heredity.alternative_biochemical',
    ])
    // Speculative traits should warn but not necessarily hard-fail
    expect(result.warnings.length).toBeGreaterThan(0)
    // Each warning is an object with traitId and message
    const firstWarn = result.warnings[0]
    expect(firstWarn).toHaveProperty('traitId')
    expect(firstWarn).toHaveProperty('message')
    // Warning message should reference the speculative nature
    expect(firstWarn!.message.toLowerCase()).toMatch(/speculative|hypothetical|uncertain/i)
  })

  it('empty trait set passes with no violations', () => {
    const result = TraitRegistry.validateTraitSet([])
    expect(result.isValid).toBe(true)
    expect(result.violations).toHaveLength(0)
  })

  it('warns on speculative distributed organization', () => {
    const result = TraitRegistry.validateTraitSet(['life_arch.distributed'])
    expect(result.warnings.length).toBeGreaterThan(0)
  })
})
