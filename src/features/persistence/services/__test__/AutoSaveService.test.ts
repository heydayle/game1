import { describe, it, expect, beforeEach } from 'vitest'
import {
  AutoSaveService,
  AUTOSAVE_SAVE_ID,
} from '../AutoSaveService.js'
import { IndexedDBService } from '../IndexedDBService.js'
import { CURRENT_SAVE_SCHEMA_VERSION, type WorldSave } from '../../types.js'
import { GenesisEngine } from '../../../genesis/services/GenesisEngine.js'

describe('AutoSaveService', () => {
  const dummyPlanet = GenesisEngine.generatePlanet({}, 42)

  const sampleSave: WorldSave = {
    schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
    metadata: {
      saveId: 'save_temp',
      name: 'Temp World',
      savedAt: Date.now(),
      schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
      planetName: 'Alpha',
      rotations: 12,
      totalPopulation: 80,
      activeSpeciesCount: 1,
      lifeStage: 'inhabited',
      dominantAtmosphere: 'nitrogen',
    },
    planetConfig: dummyPlanet,
    clock: {
      rotations: 12,
      speed: 1,
      status: 'running',
      accumulatedMs: 120,
    },
    evolution: {
      currentGeneration: 2,
      nextOrganismId: 10,
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
  }

  beforeEach(async () => {
    IndexedDBService.resetMemoryFallback()
    if (typeof localStorage !== 'undefined') {
      localStorage.clear()
    }
    await AutoSaveService.clearAutoSave()
  })

  it('saves and loads auto-save session with dedicated ID and name', async () => {
    await AutoSaveService.saveAutoSave(sampleSave)

    expect(AutoSaveService.hasCachedAutoSave()).toBe(true)

    const loaded = await AutoSaveService.loadAutoSave()
    expect(loaded).not.toBeNull()
    expect(loaded?.metadata.saveId).toBe(AUTOSAVE_SAVE_ID)
    expect(loaded?.metadata.name).toContain('Tự động lưu')
    expect(loaded?.clock.rotations).toBe(12)
  })

  it('clears auto-save session from storage', async () => {
    await AutoSaveService.saveAutoSave(sampleSave)
    expect(AutoSaveService.hasCachedAutoSave()).toBe(true)

    await AutoSaveService.clearAutoSave()
    expect(AutoSaveService.hasCachedAutoSave()).toBe(false)

    const loaded = await AutoSaveService.loadAutoSave()
    expect(loaded).toBeNull()
  })

  it('wipes all data including world archives and localStorage flags', async () => {
    // Save an autosave and a world archive
    await AutoSaveService.saveAutoSave(sampleSave)
    await IndexedDBService.saveWorld(sampleSave)
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('evolution_sandbox_welcomed', 'true')
    }

    expect(AutoSaveService.hasCachedAutoSave()).toBe(true)
    const initialList = await IndexedDBService.listSaves()
    expect(initialList.length).toBeGreaterThan(0)

    // Execute wipe
    await AutoSaveService.wipeAllData()

    expect(AutoSaveService.hasCachedAutoSave()).toBe(false)
    const afterList = await IndexedDBService.listSaves()
    expect(afterList).toHaveLength(0)
    if (typeof localStorage !== 'undefined') {
      expect(localStorage.getItem('evolution_sandbox_welcomed')).toBeNull()
    }
  })
})
