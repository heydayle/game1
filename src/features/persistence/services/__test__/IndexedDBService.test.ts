import { describe, it, expect, beforeEach } from 'vitest'
import { IndexedDBService } from '../IndexedDBService.js'
import { CURRENT_SAVE_SCHEMA_VERSION, type WorldSave } from '../../types.js'
import { GenesisEngine } from '../../../genesis/services/GenesisEngine.js'

describe('IndexedDBService (Storage Repository & Fallback)', () => {
  const dummyPlanet = GenesisEngine.generatePlanet({}, 101)

  const makeSave = (id: string, name: string, savedAt: number): WorldSave => ({
    schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
    metadata: {
      saveId: id,
      name,
      savedAt,
      schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
      planetName: dummyPlanet.name,
      rotations: 15,
      totalPopulation: 250,
      activeSpeciesCount: 1,
      lifeStage: 'inhabited',
      dominantAtmosphere: 'nitrogen',
    },
    planetConfig: dummyPlanet,
    clock: {
      rotations: 15,
      speed: 1,
      status: 'idle',
      accumulatedMs: 0,
    },
    evolution: {
      currentGeneration: 2,
      nextOrganismId: 30,
      nextSpeciesId: 2,
      species: [],
      organisms: [],
      prebiotic: { stage: 'inhabited', organicComplexity: 100 },
    },
    disasters: {
      activeDisasters: [],
      nextDisasterId: 1,
      lastPulseRotation: -1,
    },
  })

  beforeEach(() => {
    IndexedDBService.resetMemoryFallback()
  })

  it('saves and loads a world successfully', async () => {
    const save = makeSave('slot_1', 'Earth Alpha', 1000)
    await IndexedDBService.saveWorld(save)

    const loaded = await IndexedDBService.loadWorld('slot_1')
    expect(loaded).toBeDefined()
    expect(loaded?.metadata.saveId).toBe('slot_1')
    expect(loaded?.metadata.name).toBe('Earth Alpha')
    expect(loaded?.clock.rotations).toBe(15)
  })

  it('returns null when loading non-existent saveId', async () => {
    const loaded = await IndexedDBService.loadWorld('non_existent_id')
    expect(loaded).toBeNull()
  })

  it('lists saves sorted by savedAt descending (newest first)', async () => {
    await IndexedDBService.saveWorld(makeSave('slot_1', 'First Save', 1000))
    await IndexedDBService.saveWorld(makeSave('slot_2', 'Second Save', 3000))
    await IndexedDBService.saveWorld(makeSave('slot_3', 'Third Save', 2000))

    const saves = await IndexedDBService.listSaves()
    expect(saves).toHaveLength(3)
    expect(saves[0]?.saveId).toBe('slot_2') // 3000
    expect(saves[1]?.saveId).toBe('slot_3') // 2000
    expect(saves[2]?.saveId).toBe('slot_1') // 1000
  })

  it('deletes a save successfully', async () => {
    await IndexedDBService.saveWorld(makeSave('slot_del', 'To Delete', 5000))
    let loaded = await IndexedDBService.loadWorld('slot_del')
    expect(loaded).not.toBeNull()

    await IndexedDBService.deleteSave('slot_del')
    loaded = await IndexedDBService.loadWorld('slot_del')
    expect(loaded).toBeNull()
  })

  it('rejects saving malformed data', async () => {
    const invalidSave = { invalid: true } as unknown as WorldSave
    await expect(IndexedDBService.saveWorld(invalidSave)).rejects.toThrow('Cannot save invalid world data')
  })
})

