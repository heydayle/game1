# Phase 7 — World Persistence & Serialization Protocol

## 1. Overview & Architecture

The **World Persistence & Serialization System** allows players to save their planetary simulation state into local browser storage (**IndexedDB**) and export/import complete, portable **World Dossiers** (`.json`).

Because the entire biological and planetary simulation runs inside a dedicated **Web Worker**, persistence is achieved through a decoupled **request-response protocol**:
1. The Main Thread issues an `export-state` command to the Worker.
2. The Worker synchronously serializes its four internal engines:
   - `SimulationClock` (rotations, speed, status, accumulator)
   - `PopulationManager` (species definitions, living organism cohorts, generation, ID counters)
   - `PrebioticEngine` (chemical stage, organic complexity)
   - `DisasterManager` (active disasters, elapsed durations, perturbations)
3. The Worker sends back a `state-export` response containing a typed, self-contained `WorldSave` payload.
4. The Main Thread writes this `WorldSave` into `IndexedDB` or triggers a JSON file download.
5. On restore, the Main Thread sends a `load-state` command with the payload to the Worker and synchronizes the React/Zustand `usePlanetStore`, immediately resuming simulation with 100% fidelity.

```
Main Thread (React / UI)                         Web Worker (Simulation)
┌─────────────────────────────────┐             ┌──────────────────────────────────┐
│ SaveManagerModal                │             │ simulation.worker.ts             │
│   ├─ IndexedDBService           │             │   ├─ SimulationClock             │
│   │   └─ world_saves Store      │             │   ├─ PopulationManager           │
│   └─ SaveValidator (Schema v1)  │             │   ├─ PrebioticEngine             │
│                                 │             │   └─ DisasterManager             │
│                                 │             │                                  │
│ SimulationWorkerBridge          │──export-state──►                               │
│   ├─ exportState() (Promise)    │◄──state-export──│ Packages complete WorldSave  │
│   └─ loadState(save)            │──load-state───► Re-hydrates state & steps      │
└─────────────────────────────────┘             └──────────────────────────────────┘
```

---

## 2. Schema Specification (`WorldSave` Schema v1)

All save files adhere to `SCHEMA_VERSION = 1`:

```ts
export interface WorldSave {
  readonly schemaVersion: number
  readonly metadata: WorldSaveMetadata
  readonly planetConfig: PlanetConfig
  readonly clock: SerializedClockState
  readonly evolution: {
    readonly currentGeneration: number
    readonly nextOrganismId: number
    readonly nextSpeciesId: number
    readonly species: readonly SerializedSpecies[]
    readonly organisms: readonly SerializedOrganism[]
    readonly prebiotic: SerializedPrebioticState
  }
  readonly disasters: SerializedDisasterState
}
```

### Metadata Block (`metadata`)
Used for lightweight slot indexing and preview rendering without parsing heavy organism arrays:
- `saveId`: Unique key for IndexedDB (`save_<timestamp>_<hash>`).
- `name`: User-customizable archive title.
- `savedAt`: Unix epoch millisecond timestamp.
- `planetName`: Name of the planetary body.
- `rotations`: Elapsed simulation rotations.
- `totalPopulation`: Total living individuals (sum of cohort weights).
- `activeSpeciesCount`: Number of extant living species.
- `lifeStage`: `'prebiotic' | 'inhabited' | 'extinct'`.
- `dominantAtmosphere`: Major atmospheric gas component.

---

## 3. Storage & Safety Guarantees

1. **IndexedDB Primary Store with In-Memory Fallback**:
   - Primary database: `evolution_sandbox_db`, store: `world_saves`.
   - If IndexedDB is blocked or restricted (e.g. strict private browsing or non-browser environments), the system falls back to an in-memory repository without throwing unhandled exceptions.
2. **Strict Schema Validation (`SaveValidator`)**:
   - All imported JSON dossiers are checked for schema version, object structure, and key constraints before being loaded or stored.
   - Saves with unsupported future versions are rejected with actionable error messages.
3. **Cohort Compactness**:
   - Because population scaling uses the representative genetic cohort engine (`MAX_SIMULATED_AGENTS = 350`), save files remain extremely compact (~50–150 KB) even when simulating billions of organisms.

