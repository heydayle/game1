/**
 * DebugPanel — real-time visualization of simulation state.
 *
 * Displays:
 * - Current rotation count
 * - Simulation status
 * - Time warp speed
 * - Start / Pause / Reset controls
 * - Speed selector
 * - Error messages
 */

import type { TimeWarpSpeed } from '../../../shared/types/simulation-protocol.js'
import { TIME_WARP_SPEEDS } from '../../../shared/types/simulation-protocol.js'
import { useSimulation } from '../hooks/useSimulation.js'

function formatRotations(rotations: number, partial: number): string {
  return `${rotations.toLocaleString()}.${Math.floor(partial * 100)
    .toString()
    .padStart(2, '0')}`
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'running':
      return 'text-green-400'
    case 'paused':
      return 'text-yellow-400'
    default:
      return 'text-gray-400'
  }
}

export function DebugPanel() {
  const { snapshot, error, isReady, start, pause, reset, setSpeed } =
    useSimulation()

  if (!isReady) {
    return (
      <div className="fixed bottom-4 left-4 rounded-lg bg-gray-900/90 p-4 font-mono text-sm text-gray-400 shadow-lg backdrop-blur-sm">
        Initializing simulation worker...
      </div>
    )
  }

  const isRunning = snapshot.status === 'running'
  const isIdle = snapshot.status === 'idle'

  return (
    <div className="fixed bottom-4 left-4 w-80 rounded-lg bg-gray-900/90 p-4 font-mono text-sm shadow-lg backdrop-blur-sm">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between border-b border-gray-700 pb-2">
        <span className="text-xs tracking-wider text-gray-500 uppercase">
          Simulation Debug
        </span>
        <span className={`text-xs font-bold uppercase ${getStatusColor(snapshot.status)}`}>
          {snapshot.status}
        </span>
      </div>

      {/* Metrics */}
      <div className="mb-3 space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-400">Rotations</span>
          <span className="text-white">
            {formatRotations(snapshot.rotations, snapshot.partialRotation)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Speed</span>
          <span className="text-white">{snapshot.speed}x</span>
        </div>
      </div>

      {/* Speed Controls */}
      <div className="mb-3 flex gap-1">
        {TIME_WARP_SPEEDS.map((speed: TimeWarpSpeed) => (
          <button
            key={speed}
            onClick={() => setSpeed(speed)}
            className={`flex-1 rounded px-2 py-1 text-xs transition-colors ${
              snapshot.speed === speed
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {speed}x
          </button>
        ))}
      </div>

      {/* Playback Controls */}
      <div className="flex gap-2">
        {isRunning ? (
          <button
            onClick={pause}
            className="flex-1 rounded bg-yellow-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-yellow-500"
          >
            ⏸ Pause
          </button>
        ) : (
          <button
            onClick={start}
            className="flex-1 rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-500"
          >
            ▶ Start
          </button>
        )}
        <button
          onClick={reset}
          disabled={isIdle}
          className={`flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
            isIdle
              ? 'cursor-not-allowed bg-gray-700 text-gray-500'
              : 'bg-red-600 text-white hover:bg-red-500'
          }`}
        >
          ↻ Reset
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-3 rounded bg-red-900/50 p-2 text-xs text-red-300">
          ⚠ {error}
        </div>
      )}
    </div>
  )
}

