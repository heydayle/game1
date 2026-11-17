/**
 * useSimulation — React hook that connects to the SimulationWorkerBridge.
 *
 * Provides:
 * - The latest simulation snapshot (including biological ecosystem state).
 * - Command functions (start, pause, reset, setSpeed, syncPlanet, seedPopulation, triggerStress).
 * - Error state.
 *
 * The bridge is a singleton shared across all consumers.
 * The simulation loop (rAF) runs only while the simulation is 'running'.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  SimulationSnapshot,
  TimeWarpSpeed,
} from '../../../shared/types/simulation-protocol.js'
import { SNAPSHOT_VERSION } from '../../../shared/types/simulation-protocol.js'
import type { PlanetConfig } from '../../genesis/types/genesis.js'
import type { DisasterType } from '../../disasters/types.js'
import type { WorldSave } from '../../persistence/types.js'
import { DEFAULT_PERTURBATIONS } from '../../disasters/constants.js'
import { DEFAULT_PREBIOTIC_STATE } from '../../evolution/abiogenesis/PrebioticEngine.js'
import { DEFAULT_BIOGEOCHEMICAL_STATE } from '../../environment/biogeochemistry/types.js'
import { SimulationWorkerBridge } from '../services/SimulationWorkerBridge.js'

const INITIAL_SNAPSHOT: SimulationSnapshot = {
  rotations: 0,
  partialRotation: 0,
  status: 'idle',
  speed: 1,
  wallClockTime: 0,
  version: SNAPSHOT_VERSION,
  totalPopulation: 0,
  activeSpeciesCount: 0,
  extinctSpeciesCount: 0,
  averageFitness: 0,
  generation: 0,
  speciesSummaries: [],
  biomeCells: [],
  activeDisasters: [],
  perturbations: { ...DEFAULT_PERTURBATIONS },
  prebioticState: { ...DEFAULT_PREBIOTIC_STATE },
  biogeochemical: { ...DEFAULT_BIOGEOCHEMICAL_STATE },
}

// Singleton bridge instance — shared across all hook consumers
let sharedBridge: SimulationWorkerBridge | null = null
let bridgeRefCount = 0

function acquireBridge(): SimulationWorkerBridge {
  if (!sharedBridge) {
    sharedBridge = new SimulationWorkerBridge()
  }
  bridgeRefCount++
  return sharedBridge
}

function releaseBridge(): void {
  bridgeRefCount--
  if (bridgeRefCount <= 0) {
    sharedBridge?.dispose()
    sharedBridge = null
    bridgeRefCount = 0
  }
}

export interface UseSimulationResult {
  snapshot: SimulationSnapshot
  error: string | null
  isReady: boolean
  start: () => void
  pause: () => void
  reset: () => void
  setSpeed: (speed: TimeWarpSpeed) => void
  syncPlanet: (planetConfig: PlanetConfig, resetSimulation?: boolean) => void
  seedPopulation: (count?: number) => void
  triggerStress: (intensity?: number) => void
  triggerDisaster: (
    disasterType: DisasterType,
    severity?: number,
    epicenterCellId?: number
  ) => void
  sparkBiogenesis: () => void
  exportState: (saveName?: string) => Promise<WorldSave>
  loadState: (save: WorldSave) => void
}

export function useSimulation(): UseSimulationResult {
  const [snapshot, setSnapshot] = useState<SimulationSnapshot>(INITIAL_SNAPSHOT)
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const bridgeRef = useRef<SimulationWorkerBridge | null>(null)

  useEffect(() => {
    const bridge = acquireBridge()
    bridgeRef.current = bridge

    const unsubSnapshot = bridge.onSnapshot(setSnapshot)
    const unsubError = bridge.onError((message) => setError(message))

    bridge
      .init()
      .then(() => setIsReady(true))
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Failed to init worker'
        setError(msg)
      })

    return () => {
      unsubSnapshot()
      unsubError()
      bridgeRef.current = null
      releaseBridge()
    }
  }, [])

  const start = useCallback(() => {
    bridgeRef.current?.start()
  }, [])

  const pause = useCallback(() => {
    bridgeRef.current?.pause()
  }, [])

  const reset = useCallback(() => {
    bridgeRef.current?.reset()
    setError(null)
  }, [])

  const setSpeed = useCallback((speed: TimeWarpSpeed) => {
    bridgeRef.current?.setSpeed(speed)
  }, [])

  const syncPlanet = useCallback((planetConfig: PlanetConfig, resetSimulation = true) => {
    bridgeRef.current?.syncPlanet(planetConfig, resetSimulation)
  }, [])

  const seedPopulation = useCallback((count?: number) => {
    bridgeRef.current?.seedPopulation(count)
  }, [])

  const triggerStress = useCallback((intensity?: number) => {
    bridgeRef.current?.triggerStress(intensity)
  }, [])

  const triggerDisaster = useCallback(
    (disasterType: DisasterType, severity?: number, epicenterCellId?: number) => {
      bridgeRef.current?.triggerDisaster(disasterType, severity, epicenterCellId)
    },
    []
  )

  const sparkBiogenesis = useCallback(() => {
    bridgeRef.current?.sparkBiogenesis()
  }, [])

  const exportState = useCallback(async (saveName?: string): Promise<WorldSave> => {
    if (!bridgeRef.current) {
      throw new Error('Simulation worker not ready')
    }
    return bridgeRef.current.exportState(saveName)
  }, [])

  const loadState = useCallback((save: WorldSave) => {
    bridgeRef.current?.loadState(save)
  }, [])

  return {
    snapshot,
    error,
    isReady,
    start,
    pause,
    reset,
    setSpeed,
    syncPlanet,
    seedPopulation,
    triggerStress,
    triggerDisaster,
    sparkBiogenesis,
    exportState,
    loadState,
  }
}
