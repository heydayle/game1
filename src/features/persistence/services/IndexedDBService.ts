import type { WorldSave, WorldSaveMetadata } from '../types.js'
import { SaveValidator } from './SaveValidator.js'

const DB_NAME = 'evolution_sandbox_db'
const DB_VERSION = 1
const STORE_NAME = 'world_saves'

export class IndexedDBService {
  private static memoryFallback: Map<string, WorldSave> = new Map()

  private static isIndexedDBAvailable(): boolean {
    return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined'
  }

  private static openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (!this.isIndexedDBAvailable()) {
        reject(new Error('IndexedDB is not supported in this environment'))
        return
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'metadata.saveId' })
        }
      }

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'))
    })
  }

  /**
   * Persists a world save slot.
   */
  static async saveWorld(save: WorldSave): Promise<void> {
    const validation = SaveValidator.validate(save)
    if (!validation.isValid || !validation.save) {
      throw new Error(`Cannot save invalid world data: ${validation.error}`)
    }

    if (!this.isIndexedDBAvailable()) {
      this.memoryFallback.set(validation.save.metadata.saveId, validation.save)
      return
    }

    try {
      const db = await this.openDatabase()
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const store = tx.objectStore(STORE_NAME)
        const req = store.put(validation.save)

        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error ?? new Error('Failed to put save into store'))
        tx.oncomplete = () => db.close()
      })
    } catch {
      // Graceful fallback to memory on error
      this.memoryFallback.set(validation.save.metadata.saveId, validation.save)
    }
  }

  /**
   * Loads a world save by its saveId.
   */
  static async loadWorld(saveId: string): Promise<WorldSave | null> {
    if (!this.isIndexedDBAvailable()) {
      return this.memoryFallback.get(saveId) ?? null
    }

    try {
      const db = await this.openDatabase()
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly')
        const store = tx.objectStore(STORE_NAME)
        const req = store.get(saveId)

        req.onsuccess = () => {
          const res = req.result as WorldSave | undefined
          if (!res) {
            resolve(this.memoryFallback.get(saveId) ?? null)
          } else {
            const val = SaveValidator.validate(res)
            resolve(val.isValid && val.save ? val.save : null)
          }
        }
        req.onerror = () => reject(req.error ?? new Error('Failed to get save from store'))
        tx.oncomplete = () => db.close()
      })
    } catch {
      return this.memoryFallback.get(saveId) ?? null
    }
  }

  /**
   * Lists metadata for all stored world saves, sorted newest first.
   */
  static async listSaves(): Promise<WorldSaveMetadata[]> {
    if (!this.isIndexedDBAvailable()) {
      return Array.from(this.memoryFallback.values())
        .map((s) => s.metadata)
        .sort((a, b) => b.savedAt - a.savedAt)
    }

    try {
      const db = await this.openDatabase()
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly')
        const store = tx.objectStore(STORE_NAME)
        const req = store.getAll()

        req.onsuccess = () => {
          const allSaves = (req.result as WorldSave[]) ?? []
          const metadataList = allSaves
            .filter((s) => s && s.metadata)
            .map((s) => s.metadata)
            .sort((a, b) => b.savedAt - a.savedAt)
          resolve(metadataList)
        }
        req.onerror = () => reject(req.error ?? new Error('Failed to query saves'))
        tx.oncomplete = () => db.close()
      })
    } catch {
      return Array.from(this.memoryFallback.values())
        .map((s) => s.metadata)
        .sort((a, b) => b.savedAt - a.savedAt)
    }
  }

  /**
   * Deletes a world save by saveId.
   */
  static async deleteSave(saveId: string): Promise<void> {
    this.memoryFallback.delete(saveId)

    if (!this.isIndexedDBAvailable()) {
      return
    }

    try {
      const db = await this.openDatabase()
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const store = tx.objectStore(STORE_NAME)
        const req = store.delete(saveId)

        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error ?? new Error('Failed to delete save'))
        tx.oncomplete = () => db.close()
      })
    } catch {
      // Ignored if failed
    }
  }

  /**
   * Clears all stored world saves from IndexedDB and memory fallback.
   */
  static async clearAllSaves(): Promise<void> {
    this.memoryFallback.clear()

    if (!this.isIndexedDBAvailable()) {
      return
    }

    try {
      const db = await this.openDatabase()
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const store = tx.objectStore(STORE_NAME)
        const req = store.clear()

        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error ?? new Error('Failed to clear all saves'))
        tx.oncomplete = () => db.close()
      })
    } catch {
      // Ignored if failed
    }
  }

  /**
   * Resets memory fallback for testing.
   */
  static resetMemoryFallback(): void {
    this.memoryFallback.clear()
  }
}

