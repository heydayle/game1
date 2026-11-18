import type { WorldSave } from '../types.js'
import { IndexedDBService } from './IndexedDBService.js'
import { SaveValidator } from './SaveValidator.js'

export const AUTOSAVE_SAVE_ID = 'autosave_session'
export const AUTOSAVE_LOCALSTORAGE_KEY = 'evolution_sandbox_autosave'

export class AutoSaveService {
  private static memoryFallback: string | null = null

  /**
   * Persists the given world save as the current session auto-save.
   * Performs an immediate synchronous write to localStorage and an async write to IndexedDB.
   */
  static async saveAutoSave(save: WorldSave): Promise<void> {
    const autoSave: WorldSave = {
      ...save,
      metadata: {
        ...save.metadata,
        saveId: AUTOSAVE_SAVE_ID,
        name: `Tự động lưu — ${save.planetConfig.name} (Rot ${save.clock.rotations})`,
        savedAt: Date.now(),
      },
    }

    const serialized = JSON.stringify(autoSave)
    this.memoryFallback = serialized

    // 1. Immediate synchronous write to localStorage (guaranteed on browser exit/close)
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(AUTOSAVE_LOCALSTORAGE_KEY, serialized)
      } else if (typeof localStorage !== 'undefined') {
        localStorage.setItem(AUTOSAVE_LOCALSTORAGE_KEY, serialized)
      }
    } catch {
      // Quota exceeded, SecurityError, or restricted fallback
    }

    // 2. Persist to IndexedDB
    try {
      await IndexedDBService.saveWorld(autoSave)
    } catch {
      // Ignored if DB failed
    }
  }

  /**
   * Loads the auto-saved session, prioritizing IndexedDB with localStorage fallback.
   */
  static async loadAutoSave(): Promise<WorldSave | null> {
    try {
      const idbSave = await IndexedDBService.loadWorld(AUTOSAVE_SAVE_ID)
      if (idbSave) return idbSave
    } catch {
      // Fallback to localStorage
    }

    try {
      const storage =
        typeof window !== 'undefined' && window.localStorage
          ? window.localStorage
          : typeof localStorage !== 'undefined'
          ? localStorage
          : null
      const raw = storage?.getItem(AUTOSAVE_LOCALSTORAGE_KEY) ?? this.memoryFallback
      if (raw) {
        const parsed = JSON.parse(raw)
        const val = SaveValidator.validate(parsed)
        if (val.isValid && val.save) {
          return val.save
        }
      }
    } catch {
      if (this.memoryFallback) {
        try {
          const parsed = JSON.parse(this.memoryFallback)
          const val = SaveValidator.validate(parsed)
          if (val.isValid && val.save) {
            return val.save
          }
        } catch {
          // Corrupted JSON fallback
        }
      }
    }

    return null
  }

  /**
   * Synchronously checks if a cached auto-save exists in localStorage or memory.
   */
  static hasCachedAutoSave(): boolean {
    if (this.memoryFallback !== null) return true
    try {
      const storage =
        typeof window !== 'undefined' && window.localStorage
          ? window.localStorage
          : typeof localStorage !== 'undefined'
          ? localStorage
          : null
      return storage ? storage.getItem(AUTOSAVE_LOCALSTORAGE_KEY) !== null : false
    } catch {
      return false
    }
  }

  /**
   * Clears the auto-saved session.
   */
  static async clearAutoSave(): Promise<void> {
    this.memoryFallback = null
    try {
      const storage =
        typeof window !== 'undefined' && window.localStorage
          ? window.localStorage
          : typeof localStorage !== 'undefined'
          ? localStorage
          : null
      storage?.removeItem(AUTOSAVE_LOCALSTORAGE_KEY)
    } catch {
      // Ignore
    }
    await IndexedDBService.deleteSave(AUTOSAVE_SAVE_ID)
  }

  /**
   * Completely wipes all persistent game data (all world saves, auto-saves, and localStorage flags).
   */
  static async wipeAllData(): Promise<void> {
    await IndexedDBService.clearAllSaves()
    this.memoryFallback = null
    try {
      const storage =
        typeof window !== 'undefined' && window.localStorage
          ? window.localStorage
          : typeof localStorage !== 'undefined'
          ? localStorage
          : null
      storage?.removeItem(AUTOSAVE_LOCALSTORAGE_KEY)
      storage?.removeItem('evolution_sandbox_welcomed')
    } catch {
      // Ignore
    }
    await IndexedDBService.deleteSave(AUTOSAVE_SAVE_ID)
  }
}
