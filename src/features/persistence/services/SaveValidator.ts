import { CURRENT_SAVE_SCHEMA_VERSION, type WorldSave } from '../types.js'

export interface ValidationResult {
  readonly isValid: boolean
  readonly error?: string
  readonly save?: WorldSave
}

export class SaveValidator {
  /**
   * Validates an unknown parsed JSON object against the WorldSave schema.
   */
  static validate(data: unknown): ValidationResult {
    if (!data || typeof data !== 'object') {
      return { isValid: false, error: 'Save data must be a non-null object' }
    }

    const obj = data as Record<string, unknown>

    if (typeof obj.schemaVersion !== 'number') {
      return { isValid: false, error: 'Missing or invalid schemaVersion' }
    }

    if (obj.schemaVersion > CURRENT_SAVE_SCHEMA_VERSION) {
      return {
        isValid: false,
        error: `Save schema version ${obj.schemaVersion} is newer than supported version ${CURRENT_SAVE_SCHEMA_VERSION}`,
      }
    }

    // Validate metadata
    if (!obj.metadata || typeof obj.metadata !== 'object') {
      return { isValid: false, error: 'Missing or invalid metadata block' }
    }
    const meta = obj.metadata as Record<string, unknown>
    if (!meta.saveId || typeof meta.saveId !== 'string') {
      return { isValid: false, error: 'Invalid metadata.saveId' }
    }
    if (!meta.name || typeof meta.name !== 'string') {
      return { isValid: false, error: 'Invalid metadata.name' }
    }

    // Validate planetConfig
    if (!obj.planetConfig || typeof obj.planetConfig !== 'object') {
      return { isValid: false, error: 'Missing or invalid planetConfig block' }
    }
    const planet = obj.planetConfig as Record<string, unknown>
    if (typeof planet.seed !== 'number' || typeof planet.name !== 'string') {
      return { isValid: false, error: 'Invalid planetConfig: missing seed or name' }
    }

    // Validate clock
    if (!obj.clock || typeof obj.clock !== 'object') {
      return { isValid: false, error: 'Missing or invalid clock block' }
    }
    const clock = obj.clock as Record<string, unknown>
    if (typeof clock.rotations !== 'number' || typeof clock.speed !== 'number') {
      return { isValid: false, error: 'Invalid clock: missing rotations or speed' }
    }

    // Validate evolution
    if (!obj.evolution || typeof obj.evolution !== 'object') {
      return { isValid: false, error: 'Missing or invalid evolution block' }
    }
    const evolution = obj.evolution as Record<string, unknown>
    if (!Array.isArray(evolution.species) || !Array.isArray(evolution.organisms)) {
      return { isValid: false, error: 'Invalid evolution: species and organisms must be arrays' }
    }

    // Validate disasters
    if (!obj.disasters || typeof obj.disasters !== 'object') {
      return { isValid: false, error: 'Missing or invalid disasters block' }
    }
    const disasters = obj.disasters as Record<string, unknown>
    if (!Array.isArray(disasters.activeDisasters)) {
      return { isValid: false, error: 'Invalid disasters: activeDisasters must be an array' }
    }

    // Perform migrations if needed (for future versions)
    const migratedSave = this.migrate(obj as unknown as WorldSave)

    return {
      isValid: true,
      save: migratedSave,
    }
  }

  /**
   * Applies schema migrations sequentially from older versions to CURRENT_SAVE_SCHEMA_VERSION.
   */
  static migrate(save: WorldSave): WorldSave {
    let current = save
    if (current.schemaVersion === 1) {
      current = {
        ...current,
        schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
        metadata: {
          ...current.metadata,
          schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
        },
        biogeochemical: current.biogeochemical
          ? {
              ...current.biogeochemical,
              oceanDissolvedIron: current.biogeochemical.oceanDissolvedIron ?? 100.0,
              totalBifDeposited: current.biogeochemical.totalBifDeposited ?? 0.0,
            }
          : undefined,
      }
    }

    return current
  }

  /**
   * Serializes a WorldSave into a formatted JSON string for file export.
   */
  static serializeToJson(save: WorldSave): string {
    return JSON.stringify(save, null, 2)
  }

  /**
   * Parses and validates a raw JSON string into a WorldSave.
   */
  static parseFromJson(jsonString: string): ValidationResult {
    try {
      const parsed = JSON.parse(jsonString)
      return this.validate(parsed)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid JSON syntax'
      return { isValid: false, error: `JSON Parse Error: ${msg}` }
    }
  }
}
