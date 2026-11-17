import { describe, it, expect } from 'vitest'
import { SaveValidator } from '../SaveValidator.js'
import { CURRENT_SAVE_SCHEMA_VERSION, type WorldSave } from '../../types.js'
import { GenesisEngine } from '../../../genesis/services/GenesisEngine.js'

describe('SaveValidator', () => {
  const dummyPlanet = GenesisEngine.generatePlanet({}, 42)

  const sampleValidSave: WorldSave = {
    schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
    metadata: {
      saveId: 'save_123',
      name: 'Alpha Prime - Rot 50',
      savedAt: Date.now(),
      schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
      planetName: 'Alpha Prime',
      rotations: 50,
      totalPopulation: 120,
      activeSpeciesCount: 2,
      lifeStage: 'inhabited',
      dominantAtmosphere: 'nitrogen',
    },
    planetConfig: dummyPlanet,
    clock: {
      rotations: 50,
      speed: 10,
      status: 'running',
      accumulatedMs: 250,
    },
    evolution: {
      currentGeneration: 5,
      nextOrganismId: 50,
      nextSpeciesId: 3,
      species: [],
      organisms: [],
      prebiotic: {
        stage: 'inhabited',
        organicComplexity: 100,
      },
    },
    disasters: {
      activeDisasters: [],
      nextDisasterId: 1,
      lastPulseRotation: -1,
    },
  }

  it('validates a well-formed WorldSave object', () => {
    const res = SaveValidator.validate(sampleValidSave)
    expect(res.isValid).toBe(true)
    expect(res.save).toBeDefined()
    expect(res.save?.metadata.saveId).toBe('save_123')
  })

  it('rejects null or non-object payloads', () => {
    expect(SaveValidator.validate(null).isValid).toBe(false)
    expect(SaveValidator.validate('string').isValid).toBe(false)
    expect(SaveValidator.validate(123).isValid).toBe(false)
  })

  it('rejects unsupported newer schema versions', () => {
    const futureSave = { ...sampleValidSave, schemaVersion: CURRENT_SAVE_SCHEMA_VERSION + 1 }
    const res = SaveValidator.validate(futureSave)
    expect(res.isValid).toBe(false)
    expect(res.error).toContain('newer than supported')
  })

  it('rejects missing or corrupted metadata', () => {
    const corrupted = { ...sampleValidSave, metadata: { name: 'Invalid' } }
    const res = SaveValidator.validate(corrupted)
    expect(res.isValid).toBe(false)
    expect(res.error).toContain('saveId')
  })

  it('rejects missing planetConfig', () => {
    const corrupted = { ...sampleValidSave, planetConfig: null }
    const res = SaveValidator.validate(corrupted)
    expect(res.isValid).toBe(false)
    expect(res.error).toContain('planetConfig')
  })

  it('rejects missing clock block', () => {
    const corrupted = { ...sampleValidSave, clock: null }
    const res = SaveValidator.validate(corrupted)
    expect(res.isValid).toBe(false)
    expect(res.error).toContain('clock')
  })

  it('serializes and parses round-trip correctly', () => {
    const jsonStr = SaveValidator.serializeToJson(sampleValidSave)
    expect(typeof jsonStr).toBe('string')
    const parseResult = SaveValidator.parseFromJson(jsonStr)
    expect(parseResult.isValid).toBe(true)
    expect(parseResult.save?.metadata.saveId).toBe(sampleValidSave.metadata.saveId)
  })

  it('returns informative error on invalid JSON string', () => {
    const res = SaveValidator.parseFromJson('{ broken json')
    expect(res.isValid).toBe(false)
    expect(res.error).toContain('JSON Parse Error')
  })
})

