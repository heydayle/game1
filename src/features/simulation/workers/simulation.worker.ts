/**
 * Simulation Web Worker.
 *
 * Owns the SimulationClock and PopulationManager.
 * Processes commands from the main thread and emits snapshots.
 *
 * This file runs in a dedicated Worker context — no DOM access.
 */

import { SimulationClock, type BiologicalStateSnapshot } from '../engine/SimulationClock.js'
import { PopulationManager } from '../../evolution/population/PopulationManager.js'
import { DisasterManager } from '../../disasters/services/DisasterManager.js'
import { BiogeochemicalEngine } from '../../environment/biogeochemistry/BiogeochemicalEngine.js'
import { DEFAULT_BIOGEOCHEMICAL_STATE } from '../../environment/biogeochemistry/types.js'
import { DEFAULT_PERTURBATIONS } from '../../disasters/constants.js'
import { DEFAULT_PREBIOTIC_STATE } from '../../evolution/abiogenesis/PrebioticEngine.js'
import { SeededRNG } from '../../../shared/utils/seeded-rng.js'
import type { PlanetConfig } from '../../genesis/types/genesis.js'
import type {
  SimulationCommand,
  SimulationResponse,
} from '../../../shared/types/simulation-protocol.js'
import { ROTATION_DURATION_MS } from '../../../shared/types/simulation-protocol.js'
import type { WorldSave } from '../../persistence/types.js'
import { CURRENT_SAVE_SCHEMA_VERSION } from '../../persistence/types.js'

const clock = new SimulationClock()
const populationManager = new PopulationManager()
const disasterManager = new DisasterManager()
const biogeochemicalEngine = new BiogeochemicalEngine()
let rng = new SeededRNG(42)
let currentPlanetConfig: PlanetConfig | null = null
let currentBioState: BiologicalStateSnapshot = {
  totalPopulation: 0,
  activeSpeciesCount: 0,
  extinctSpeciesCount: 0,
  averageFitness: 0,
  generation: 0,
  speciesSummaries: [],
  biomeCells: [],
  activeDisasters: [],
  perturbations: { ...DEFAULT_PERTURBATIONS },
  autoDisastersEnabled: true,
  prebioticState: { ...DEFAULT_PREBIOTIC_STATE },
  biogeochemical: { ...DEFAULT_BIOGEOCHEMICAL_STATE },
}

function updateBiogeochemistry(): void {
  if (!currentPlanetConfig) return
  const partial =
    (clock.exportState().accumulatedMs % ROTATION_DURATION_MS) / ROTATION_DURATION_MS
  const biogeochemical = biogeochemicalEngine.step(
    clock.getRotations(),
    partial,
    currentPlanetConfig,
    currentBioState.totalPopulation,
    currentBioState.speciesSummaries,
    disasterManager.getPerturbations()
  )
  currentBioState = {
    ...currentBioState,
    biogeochemical,
  }
}

function setBioState(
  bioResult: ReturnType<typeof populationManager.step>,
  activeDisasters = disasterManager.getActiveSummaries(),
  perturbations = disasterManager.getPerturbations()
): void {
  const previousEvents = currentBioState.speciationEvents ?? []
  const newEvents = bioResult.speciationEvents ?? []
  currentBioState = {
    ...bioResult,
    activeDisasters,
    perturbations,
    autoDisastersEnabled: disasterManager.isAutoDisastersEnabled(),
    biogeochemical: currentBioState.biogeochemical,
    speciationEvents: [...previousEvents, ...newEvents],
  }
}

function postResponse(response: SimulationResponse): void {
  self.postMessage(response)
}

function sendSnapshot(): void {
  updateBiogeochemistry()
  postResponse({
    type: 'snapshot',
    snapshot: clock.getSnapshot(currentBioState),
  })
  // Clear speciationEvents buffer after sending so events are only broadcast once
  if (currentBioState.speciationEvents && currentBioState.speciationEvents.length > 0) {
    currentBioState = {
      ...currentBioState,
      speciationEvents: [],
    }
  }
}

function handleCommand(command: SimulationCommand): void {
  switch (command.type) {
    case 'start':
      clock.start()
      sendSnapshot()
      break

    case 'pause':
      clock.pause()
      sendSnapshot()
      break

    case 'reset':
      clock.reset()
      disasterManager.reset()
      if (currentPlanetConfig) {
        biogeochemicalEngine.reset(currentPlanetConfig)
        populationManager.initPlanet(currentPlanetConfig)
        const bioResult = populationManager.step(0, currentPlanetConfig, rng)
        setBioState(bioResult, [], { ...DEFAULT_PERTURBATIONS })
      }
      sendSnapshot()
      break

    case 'set-speed':
      clock.setSpeed(command.speed)
      sendSnapshot()
      break

    case 'tick': {
      const completedRotations = clock.tick(command.deltaMs)
      if (completedRotations > 0 && currentPlanetConfig) {
        // Cap biological step calculations per tick to avoid worker backlog choking
        const bioSteps = Math.min(completedRotations, 10)
        for (let i = 0; i < bioSteps; i++) {
          const currentRot = clock.getRotations()
          const perturbations = disasterManager.step(currentRot, rng, currentPlanetConfig)
          const bioResult = populationManager.step(
            currentRot,
            currentPlanetConfig,
            rng,
            perturbations
          )
          setBioState(bioResult, disasterManager.getActiveSummaries(), perturbations)
        }
      }
      sendSnapshot()
      break
    }

    case 'sync-planet': {
      currentPlanetConfig = command.planetConfig
      rng = new SeededRNG(command.planetConfig.seed)
      const shouldReset = command.resetSimulation !== false
      if (shouldReset) {
        biogeochemicalEngine.reset(command.planetConfig)
        populationManager.initPlanet(command.planetConfig)
      }
      const bioResult = populationManager.step(
        clock.getRotations(),
        command.planetConfig,
        rng,
        disasterManager.getPerturbations()
      )
      setBioState(bioResult)
      sendSnapshot()
      break
    }

    case 'seed-population':
      if (currentPlanetConfig) {
        populationManager.seedPrimordialLife(currentPlanetConfig, command.count ?? 50)
        const bioResult = populationManager.step(
          clock.getRotations(),
          currentPlanetConfig,
          rng,
          disasterManager.getPerturbations()
        )
        setBioState(bioResult)
        sendSnapshot()
      }
      break

    case 'trigger-stress':
      // Micro-stress event: quick selective cull
      if (currentPlanetConfig) {
        disasterManager.triggerDisaster('climate_shift', command.intensity, clock.getRotations())
        const perturbations = disasterManager.getPerturbations()
        const bioResult = populationManager.step(
          clock.getRotations(),
          currentPlanetConfig,
          rng,
          perturbations
        )
        setBioState(bioResult, disasterManager.getActiveSummaries(), perturbations)
        sendSnapshot()
      }
      break

    case 'trigger-disaster':
      if (currentPlanetConfig) {
        disasterManager.triggerDisaster(
          command.disasterType,
          command.severity ?? 0.8,
          clock.getRotations(),
          command.epicenterCellId
        )
        const perturbations = disasterManager.getPerturbations()
        const bioResult = populationManager.step(
          clock.getRotations(),
          currentPlanetConfig,
          rng,
          perturbations
        )
        setBioState(bioResult, disasterManager.getActiveSummaries(), perturbations)
        sendSnapshot()
      }
      break

    case 'set-auto-disasters':
      disasterManager.setAutoDisastersEnabled(command.enabled)
      currentBioState = {
        ...currentBioState,
        autoDisastersEnabled: command.enabled,
      }
      sendSnapshot()
      break

    case 'spark-biogenesis':
      if (currentPlanetConfig) {
        populationManager.sparkBiogenesis(currentPlanetConfig, rng)
        const bioResult = populationManager.step(
          clock.getRotations(),
          currentPlanetConfig,
          rng,
          disasterManager.getPerturbations()
        )
        setBioState(bioResult)
        sendSnapshot()
      }
      break

    case 'catalyze-chemistry':
      if (currentPlanetConfig) {
        populationManager.triggerChemicalCatalyst(command.catalystType)
        const bioResult = populationManager.step(
          clock.getRotations(),
          currentPlanetConfig,
          rng,
          disasterManager.getPerturbations()
        )
        setBioState(bioResult)
        sendSnapshot()
      }
      break

    case 'export-state':
      if (currentPlanetConfig) {
        const dominantAtmosphere =
          Object.entries(currentPlanetConfig.atmosphericComposition).sort(
            ([, a], [, b]) => b - a
          )[0]?.[0] ?? 'nitrogen'

        const save: WorldSave = {
          schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
          metadata: {
            saveId: `save_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            name:
              command.saveName?.trim() ||
              `${currentPlanetConfig.name} - Rot ${clock.getRotations()}`,
            savedAt: Date.now(),
            schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
            planetName: currentPlanetConfig.name,
            rotations: clock.getRotations(),
            totalPopulation: currentBioState.totalPopulation,
            activeSpeciesCount: currentBioState.activeSpeciesCount,
            lifeStage: currentBioState.prebioticState.stage,
            dominantAtmosphere,
          },
          planetConfig: currentPlanetConfig,
          clock: clock.exportState(),
          evolution: populationManager.exportState(),
          disasters: disasterManager.exportState(),
          biogeochemical: biogeochemicalEngine.exportState(),
        }

        postResponse({
          type: 'state-export',
          save,
        })
      }
      break

    case 'load-state': {
      const { save } = command
      currentPlanetConfig = save.planetConfig
      rng = new SeededRNG(save.planetConfig.seed)
      clock.restoreState(save.clock)
      disasterManager.restoreState(save.disasters, save.clock.rotations)
      populationManager.restoreState(save.evolution, save.planetConfig)
      if (save.biogeochemical) {
        biogeochemicalEngine.restoreState(save.biogeochemical)
      } else {
        biogeochemicalEngine.reset(save.planetConfig)
      }

      const perturbations = disasterManager.getPerturbations()
      const bioResult = populationManager.step(
        save.clock.rotations,
        save.planetConfig,
        rng,
        perturbations
      )
      setBioState(bioResult, disasterManager.getActiveSummaries(), perturbations)
      sendSnapshot()
      break
    }

    default: {
      const _exhaustive: never = command
      postResponse({
        type: 'error',
        message: `Unknown command type: ${JSON.stringify(_exhaustive)}`,
        code: 'UNKNOWN_COMMAND',
      })
    }
  }
}

self.onmessage = (event: MessageEvent<SimulationCommand>) => {
  try {
    handleCommand(event.data)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown worker error'
    postResponse({
      type: 'error',
      message,
      code: 'WORKER_ERROR',
    })
  }
}

// Signal that the worker is ready
postResponse({ type: 'ready' })
