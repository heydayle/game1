/**
 * SimulationControlsCenterHUD — Unified center HUD for rotations & simulation speed.
 *
 * Positions in the center (bottom-center) of the viewport:
 * - Displays total rotations & partial rotation progress
 * - Play / Pause toggle with Spacebar indicator
 * - Speed selector (1x, 10x, 100x, 1000x)
 * - Simulation status indicator (Running / Paused)
 */

import type { TimeWarpSpeed, SimulationStatus } from '../../../shared/types/simulation-protocol.js'
import { TIME_WARP_SPEEDS } from '../../../shared/types/simulation-protocol.js'
import { SoundFX } from '../../audio/SoundFXEngine.js'

export interface SimulationControlsCenterHUDProps {
  rotations: number
  partialRotation?: number
  speed: TimeWarpSpeed
  status: SimulationStatus
  onStart: () => void
  onPause: () => void
  onSetSpeed: (speed: TimeWarpSpeed) => void
  onReset?: () => void
}

function formatRotations(rotations: number, partial = 0): string {
  return `${rotations.toLocaleString()}.${Math.floor(partial * 100)
    .toString()
    .padStart(2, '0')}`
}

export function SimulationControlsCenterHUD({
  rotations,
  partialRotation = 0,
  speed,
  status,
  onStart,
  onPause,
  onSetSpeed,
  onReset,
}: SimulationControlsCenterHUDProps) {
  const isRunning = status === 'running'

  return (
    <div
      data-testid="simulation-controls-center-hud"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 select-none pointer-events-auto"
    >
      <div className="flex items-center gap-3 rounded-full border border-white/20 bg-gray-950/90 px-4 py-2 font-mono text-xs shadow-2xl shadow-black/80 backdrop-blur-xl">
        {/* Status & Rotations Counter */}
        <div className="flex items-center gap-2.5 pr-3 border-r border-white/15">
          <span
            className={`flex h-2.5 w-2.5 rounded-full ${
              isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
            title={`Trạng thái: ${status.toUpperCase()}`}
          />
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
              Vòng quay
            </span>
            <span className="text-white font-bold tracking-tight text-xs">
              {formatRotations(rotations, partialRotation)}
            </span>
          </div>
        </div>

        {/* Playback Controls (Play / Pause) */}
        <button
          onClick={() => {
            SoundFX.playClick()
            if (isRunning) {
              onPause()
            } else {
              onStart()
            }
          }}
          className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all shadow-md ${
            isRunning
              ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
              : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'
          }`}
          title={isRunning ? 'Tạm dừng mô phỏng (Phím Space)' : 'Tiếp tục mô phỏng (Phím Space)'}
        >
          <span>{isRunning ? '⏸ Tạm dừng' : '▶ Bắt đầu'}</span>
        </button>

        {/* Speed Selector (1x, 10x, 100x, 1000x) */}
        <div className="flex items-center gap-1 rounded-full bg-black/50 p-1 border border-white/10">
          {TIME_WARP_SPEEDS.map((s) => {
            const isActive = speed === s
            return (
              <button
                key={s}
                onClick={() => {
                  SoundFX.playClick()
                  onSetSpeed(s)
                }}
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
                title={`Tốc độ quay: ${s}x (Phím 1-4)`}
              >
                {s}x
              </button>
            )
          })}
        </div>

        {/* Reset button (optional) */}
        {onReset && (
          <button
            onClick={() => {
              SoundFX.playClick()
              onReset()
            }}
            className="text-gray-400 hover:text-rose-400 px-1.5 py-1 text-[11px] transition-colors rounded hover:bg-white/5"
            title="Đặt lại mô phỏng"
          >
            ↺
          </button>
        )}
      </div>
    </div>
  )
}

