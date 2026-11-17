/**
 * SimulationWorkerBridge — manages Worker lifecycle and message passing.
 *
 * Responsibilities:
 * - Create and terminate the Web Worker.
 * - Send typed commands.
 * - Drive the simulation loop via requestAnimationFrame.
 * - Notify subscribers of snapshot updates.
 *
 * This is the ONLY class that directly interacts with the Worker.
 * React hooks consume this bridge, never the Worker directly.
 */

import type {
  SimulationCommand,
  SimulationResponse,
  SimulationSnapshot,
  TimeWarpSpeed,
} from '../../../shared/types/simulation-protocol.js'
import type { PlanetConfig } from '../../genesis/types/genesis.js'
import type { DisasterType } from '../../disasters/types.js'
import type { WorldSave } from '../../persistence/types.js'

export type SnapshotListener = (snapshot: SimulationSnapshot) => void
export type ErrorListener = (message: string, code: string) => void

export class SimulationWorkerBridge {
  private worker: Worker | null = null
  private animationFrameId: number | null = null
  private lastTimestamp: number | null = null
  private snapshotListeners: Set<SnapshotListener> = new Set()
  private errorListeners: Set<ErrorListener> = new Set()
  private readyResolve: (() => void) | null = null
  private exportResolvers: Array<(save: WorldSave) => void> = []
  private isRunning = false
  private accumulatedTickMs = 0

  /**
   * Initialize the Worker and wait for it to signal ready.
   */
  async init(): Promise<void> {
    if (this.worker) {
      return
    }

    return new Promise<void>((resolve, reject) => {
      try {
        this.worker = new Worker(
          new URL('../workers/simulation.worker.ts', import.meta.url),
          { type: 'module' }
        )

        this.readyResolve = resolve

        this.worker.onmessage = (event: MessageEvent<SimulationResponse>) => {
          this.handleResponse(event.data)
        }

        this.worker.onerror = (event) => {
          const msg = event.message || 'Worker initialization failed'
          this.notifyError(msg, 'WORKER_INIT_ERROR')
          reject(new Error(msg))
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Terminate the Worker and stop the animation loop.
   */
  dispose(): void {
    this.stopLoop()
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
    this.snapshotListeners.clear()
    this.errorListeners.clear()
    this.exportResolvers = []
  }

  // ---- Commands ----

  start(): void {
    this.sendCommand({ type: 'start' })
    this.startLoop()
  }

  pause(): void {
    this.sendCommand({ type: 'pause' })
    this.stopLoop()
  }

  reset(): void {
    this.sendCommand({ type: 'reset' })
    this.stopLoop()
  }

  setSpeed(speed: TimeWarpSpeed): void {
    this.sendCommand({ type: 'set-speed', speed })
  }

  syncPlanet(planetConfig: PlanetConfig, resetSimulation = true): void {
    this.sendCommand({ type: 'sync-planet', planetConfig, resetSimulation })
  }

  seedPopulation(count = 40): void {
    this.sendCommand({ type: 'seed-population', count })
  }

  triggerStress(intensity = 0.5): void {
    this.sendCommand({ type: 'trigger-stress', intensity })
  }

  triggerDisaster(
    disasterType: DisasterType,
    severity = 0.8,
    epicenterCellId?: number
  ): void {
    this.sendCommand({
      type: 'trigger-disaster',
      disasterType,
      severity,
      epicenterCellId,
    })
  }

  sparkBiogenesis(): void {
    this.sendCommand({ type: 'spark-biogenesis' })
  }

  exportState(saveName?: string): Promise<WorldSave> {
    return new Promise((resolve) => {
      this.exportResolvers.push(resolve)
      this.sendCommand({ type: 'export-state', saveName })
    })
  }

  loadState(save: WorldSave): void {
    this.sendCommand({ type: 'load-state', save })
  }

  // ---- Subscriptions ----

  onSnapshot(listener: SnapshotListener): () => void {
    this.snapshotListeners.add(listener)
    return () => {
      this.snapshotListeners.delete(listener)
    }
  }

  onError(listener: ErrorListener): () => void {
    this.errorListeners.add(listener)
    return () => {
      this.errorListeners.delete(listener)
    }
  }

  // ---- Internal ----

  private sendCommand(command: SimulationCommand): void {
    if (!this.worker) {
      this.notifyError(
        'Worker not initialized. Call init() first.',
        'WORKER_NOT_READY'
      )
      return
    }
    this.worker.postMessage(command)
  }

  private handleResponse(response: SimulationResponse): void {
    switch (response.type) {
      case 'ready':
        this.readyResolve?.()
        this.readyResolve = null
        break

      case 'snapshot':
        for (const listener of this.snapshotListeners) {
          listener(response.snapshot)
        }
        break

      case 'state-export': {
        const resolver = this.exportResolvers.shift()
        if (resolver) {
          resolver(response.save)
        }
        break
      }

      case 'error':
        this.notifyError(response.message, response.code)
        break
    }
  }

  private notifyError(message: string, code: string): void {
    for (const listener of this.errorListeners) {
      listener(message, code)
    }
    if (this.errorListeners.size === 0) {
      console.error(`[SimulationWorker] ${code}: ${message}`)
    }
  }

  private startLoop(): void {
    if (this.isRunning) return
    this.isRunning = true
    this.lastTimestamp = null
    this.animationFrameId = requestAnimationFrame(this.loop)
  }

  private stopLoop(): void {
    this.isRunning = false
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
    this.lastTimestamp = null
    this.accumulatedTickMs = 0
  }

  private loop = (timestamp: DOMHighResTimeStamp): void => {
    if (!this.isRunning) return

    if (this.lastTimestamp !== null) {
      const deltaMs = timestamp - this.lastTimestamp
      this.accumulatedTickMs += deltaMs
      // Throttle postMessage tick dispatches to stable 60Hz interval (min 16ms)
      // to avoid message flooding on 120Hz/144Hz/240Hz gaming monitors
      if (this.accumulatedTickMs >= 16.0) {
        this.sendCommand({ type: 'tick', deltaMs: this.accumulatedTickMs })
        this.accumulatedTickMs = 0
      }
    }
    this.lastTimestamp = timestamp
    this.animationFrameId = requestAnimationFrame(this.loop)
  }
}

