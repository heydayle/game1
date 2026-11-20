import { useState } from 'react'
import { SoundFX } from '../../audio/SoundFXEngine.js'

export interface SapientLogEntry {
  readonly id: string
  readonly speciesId: string
  readonly speciesName: string
  readonly scientificName?: string
  readonly tier: string
  readonly tierLabel: string
  readonly sapientArchetype?: string
  readonly sapientLabel?: string
  readonly color: string
  readonly rotation: number
  readonly generation: number
  readonly description: string
  readonly timestamp: number
}

export interface SapientEvolutionLogHUDProps {
  readonly logs: readonly SapientLogEntry[]
  readonly countdownSeconds: number | null
  readonly savedSpeed: number
  readonly onDismiss: (logId: string) => void
  readonly onDismissAll?: () => void
  readonly onResumeNow?: () => void
  readonly onSelectSpecies?: (speciesId: string) => void
}

export function SapientEvolutionLogHUD({
  logs,
  countdownSeconds,
  savedSpeed,
  onDismiss,
  onDismissAll,
  onResumeNow,
  onSelectSpecies,
}: SapientEvolutionLogHUDProps) {
  const [activeLogIndex, setActiveLogIndex] = useState(0)

  if (logs.length === 0) {
    return null
  }

  // Show latest log (or selected log in history)
  const currentLog = logs[activeLogIndex] ?? logs[0]
  if (!currentLog) return null

  const isCountingDown = countdownSeconds !== null && countdownSeconds > 0
  const progressPercent = isCountingDown ? (countdownSeconds / 10) * 100 : 0

  return (
    <aside
      aria-label="Nhật ký sinh vật trí tuệ"
      data-testid="sapient-evolution-log-hud"
      className="fixed bottom-5 left-4 z-40 w-full max-w-sm sm:max-w-md font-mono select-none pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="relative rounded-2xl border border-amber-400/60 bg-gradient-to-b from-gray-950/95 via-amber-950/40 to-black/95 p-4 shadow-2xl shadow-amber-950/60 backdrop-blur-xl">
        {/* Glowing Ambient Corner Accent */}
        <div
          className="absolute -top-1 -left-1 h-3 w-3 rounded-full animate-ping pointer-events-none"
          style={{ backgroundColor: currentLog.color || '#f59e0b' }}
        />

        {/* 1. Header Row */}
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-base" role="img" aria-label="crown">
              👑
            </span>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                Sinh vật Trí tuệ Khởi sinh
              </span>
              <span className="text-[9px] text-gray-400">
                Nhánh sinh vật bậc cao hiện đại
              </span>
            </div>
          </div>

          {/* Close Log Button */}
          <button
            onClick={() => {
              SoundFX.playClick()
              onDismiss(currentLog.id)
            }}
            data-testid="sapient-log-close-btn"
            className="rounded-lg p-1 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Tắt thông báo này (✕)"
          >
            <span className="text-sm font-bold leading-none">✕</span>
          </button>
        </div>

        {/* 2. Timer & Auto-Resume Status Banner */}
        <div className="mt-2.5 rounded-xl border border-amber-500/30 bg-amber-950/30 p-2 text-xs">
          {isCountingDown ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 font-semibold text-amber-300">
                  <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>Tạm dừng 10s quan sát:</span>
                  <span className="font-bold text-amber-200">{countdownSeconds}s</span>
                </span>
                {onResumeNow && (
                  <button
                    onClick={() => {
                      SoundFX.playClick()
                      onResumeNow()
                    }}
                    data-testid="sapient-log-resume-now-btn"
                    className="rounded bg-amber-500/30 hover:bg-amber-500/50 px-2 py-0.5 text-[10px] font-semibold text-amber-200 border border-amber-400/40 transition-colors"
                  >
                    ▶ Tiếp tục ngay
                  </button>
                )}
              </div>
              {/* Progress countdown bar */}
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-900 border border-amber-500/20">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-1000 ease-linear"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
                <span>Tiến trình mô phỏng đang tiếp tục ({savedSpeed}x)</span>
              </span>
              <span className="text-[10px] text-gray-500">Giữ nguyên tốc độ</span>
            </div>
          )}
        </div>

        {/* 3. Species Details Card */}
        <div className="mt-3 rounded-xl border border-white/10 bg-gray-900/60 p-3 space-y-2">
          {/* Species Name & Tier Archetype */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: currentLog.color }}
                />
                <span className="font-bold text-sm text-white drop-shadow">
                  {currentLog.speciesName}
                </span>
              </div>
              <p className="text-[11px] italic text-cyan-300 pl-5">
                {currentLog.scientificName ?? 'Sapientus cosmica'}
              </p>
            </div>

            {/* Archetype Badge */}
            <span className="rounded px-2 py-0.5 text-[10px] font-semibold bg-amber-900/60 border border-amber-400/40 text-amber-200 whitespace-nowrap">
              {currentLog.sapientArchetype
                ? currentLog.sapientLabel ?? 'Hình nhân Đứng thẳng'
                : currentLog.tierLabel}
            </span>
          </div>

          {/* Emergence Milestone Info */}
          <div className="flex items-center gap-3 text-[10px] text-gray-400 border-t border-white/5 pt-2">
            <span>
              Vòng quay:{' '}
              <strong className="text-white font-mono">{currentLog.rotation}</strong>
            </span>
            <span>•</span>
            <span>
              Thế hệ:{' '}
              <strong className="text-white font-mono">Gen {currentLog.generation}</strong>
            </span>
            <span>•</span>
            <span className="text-amber-400/90 font-medium">Bậc Trí tuệ (Sapient)</span>
          </div>

          {/* Description */}
          <p className="text-[11px] leading-relaxed text-gray-300 bg-black/40 rounded-lg p-2 border border-white/5">
            {currentLog.description}
          </p>
        </div>

        {/* 4. Action & Navigation Footer */}
        <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-white/10">
          {/* Multiple Logs Stack Navigator */}
          {logs.length > 1 ? (
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
              <button
                disabled={activeLogIndex === 0}
                onClick={() => setActiveLogIndex((prev) => Math.max(0, prev - 1))}
                className="rounded px-1.5 py-0.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white"
              >
                ◀
              </button>
              <span>
                {activeLogIndex + 1}/{logs.length} loài
              </span>
              <button
                disabled={activeLogIndex === logs.length - 1}
                onClick={() =>
                  setActiveLogIndex((prev) => Math.min(logs.length - 1, prev + 1))
                }
                className="rounded px-1.5 py-0.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white"
              >
                ▶
              </button>
            </div>
          ) : (
            <span className="text-[10px] text-gray-500 italic">
              Log lưu lại đến khi bạn bấm tắt
            </span>
          )}

          <div className="flex items-center gap-2">
            {onSelectSpecies && (
              <button
                onClick={() => {
                  SoundFX.playClick()
                  onSelectSpecies(currentLog.speciesId)
                }}
                className="rounded bg-cyan-600/80 hover:bg-cyan-600 px-2.5 py-1 text-xs font-semibold text-white transition-colors shadow"
              >
                🔍 Xem loài
              </button>
            )}
            <button
              onClick={() => {
                SoundFX.playClick()
                if (onDismissAll && logs.length > 1) {
                  onDismissAll()
                } else {
                  onDismiss(currentLog.id)
                }
              }}
              data-testid="sapient-log-dismiss-action"
              className="rounded bg-gray-800 hover:bg-gray-700 border border-white/10 px-2 py-1 text-xs text-gray-300 hover:text-white transition-colors"
            >
              {logs.length > 1 ? 'Đóng tất cả' : 'Đóng log'}
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
