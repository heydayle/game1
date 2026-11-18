import { useEffect, useState, useRef } from 'react'
import type { SpeciationEvent } from '../taxonomy/types.js'
import { SoundFX } from '../../audio/SoundFXEngine.js'

export interface SpeciationAlertToastProps {
  events?: readonly SpeciationEvent[]
  onSelectSpecies?: (speciesId: string) => void
  initialExpanded?: boolean
}

interface StreamState {
  current: SpeciationEvent | null
  queue: SpeciationEvent[]
  isDetailsExpanded: boolean
}

export function SpeciationAlertToast({
  events,
  onSelectSpecies,
  initialExpanded = false,
}: SpeciationAlertToastProps) {
  // 1. Separate streams for New Species (Top) and Evolution (Bottom)
  const [speciesStream, setSpeciesStream] = useState<StreamState>({
    current: null,
    queue: [],
    isDetailsExpanded: initialExpanded,
  })

  const [evolutionStream, setEvolutionStream] = useState<StreamState>({
    current: null,
    queue: [],
    isDetailsExpanded: initialExpanded,
  })

  const seenIdsRef = useRef<Set<string>>(new Set())

  // Ingest incoming events and route them to their respective streams
  useEffect(() => {
    if (!events || events.length === 0) return

    const newSpeciesArrivals: SpeciationEvent[] = []
    const newEvolutionArrivals: SpeciationEvent[] = []

    for (const ev of events) {
      if (!seenIdsRef.current.has(ev.id)) {
        seenIdsRef.current.add(ev.id)
        if (ev.eventType === 'ascension') {
          newEvolutionArrivals.push(ev)
        } else {
          newSpeciesArrivals.push(ev)
        }
      }
    }

    if (newSpeciesArrivals.length > 0) {
      setSpeciesStream((prev) => {
        // Enforce maximum 3 latest notifications
        const allPending = prev.current
          ? [prev.current, ...prev.queue, ...newSpeciesArrivals]
          : newSpeciesArrivals
        const capped = allPending.slice(-3)
        const [nextCurrent, ...rest] = capped
        SoundFX.playSpeciation()
        return {
          current: nextCurrent ?? null,
          queue: rest,
          isDetailsExpanded: prev.isDetailsExpanded,
        }
      })
    }

    if (newEvolutionArrivals.length > 0) {
      setEvolutionStream((prev) => {
        // Enforce maximum 3 latest notifications
        const allPending = prev.current
          ? [prev.current, ...prev.queue, ...newEvolutionArrivals]
          : newEvolutionArrivals
        const capped = allPending.slice(-3)
        const [nextCurrent, ...rest] = capped
        SoundFX.playSpeciation()
        return {
          current: nextCurrent ?? null,
          queue: rest,
          isDetailsExpanded: prev.isDetailsExpanded,
        }
      })
    }
  }, [events])

  // Auto-dismiss Species stream after 3 seconds (3000ms)
  useEffect(() => {
    if (!speciesStream.current) return

    const timer = setTimeout(() => {
      setSpeciesStream((prev) => {
        if (prev.queue.length > 0) {
          const [next, ...remaining] = prev.queue
          SoundFX.playSpeciation()
          return { current: next ?? null, queue: remaining, isDetailsExpanded: false }
        }
        return { current: null, queue: [], isDetailsExpanded: false }
      })
    }, 3000)

    return () => clearTimeout(timer)
  }, [speciesStream.current, speciesStream.queue])

  // Auto-dismiss Evolution stream after 3 seconds (3000ms)
  useEffect(() => {
    if (!evolutionStream.current) return

    const timer = setTimeout(() => {
      setEvolutionStream((prev) => {
        if (prev.queue.length > 0) {
          const [next, ...remaining] = prev.queue
          SoundFX.playSpeciation()
          return { current: next ?? null, queue: remaining, isDetailsExpanded: false }
        }
        return { current: null, queue: [], isDetailsExpanded: false }
      })
    }, 3000)

    return () => clearTimeout(timer)
  }, [evolutionStream.current, evolutionStream.queue])

  const dismissSpecies = () => {
    setSpeciesStream((prev) => {
      if (prev.queue.length > 0) {
        const [next, ...remaining] = prev.queue
        SoundFX.playSpeciation()
        return { current: next ?? null, queue: remaining, isDetailsExpanded: false }
      }
      return { current: null, queue: [], isDetailsExpanded: false }
    })
  }

  const dismissAllSpecies = () => {
    SoundFX.playClick()
    setSpeciesStream({ current: null, queue: [], isDetailsExpanded: false })
  }

  const dismissEvolution = () => {
    setEvolutionStream((prev) => {
      if (prev.queue.length > 0) {
        const [next, ...remaining] = prev.queue
        SoundFX.playSpeciation()
        return { current: next ?? null, queue: remaining, isDetailsExpanded: false }
      }
      return { current: null, queue: [], isDetailsExpanded: false }
    })
  }

  const dismissAllEvolution = () => {
    SoundFX.playClick()
    setEvolutionStream({ current: null, queue: [], isDetailsExpanded: false })
  }

  const renderToastCard = (
    currentEvent: SpeciationEvent,
    queueLength: number,
    isExpanded: boolean,
    onToggleDetails: () => void,
    onDismissSingle: () => void,
    onDismissAllItems: () => void,
    streamType: 'species' | 'evolution'
  ) => {
    const { traits } = currentEvent
    const isSapient = traits.tier === 'sapient'

    return (
      <div className="relative w-full">
        {/* Physical Stack Card Layers behind active card */}
        {queueLength >= 1 && (
          <div
            data-testid="toast-stack-layer-1"
            className="absolute -bottom-1.5 inset-x-3 h-4 rounded-xl border border-white/10 bg-gray-900/90 shadow-md -z-10 scale-[0.98] transition-all"
          />
        )}
        {queueLength >= 2 && (
          <div
            data-testid="toast-stack-layer-2"
            className="absolute -bottom-3 inset-x-6 h-4 rounded-xl border border-white/5 bg-gray-950/70 shadow-sm -z-20 scale-[0.96] transition-all"
          />
        )}

        {/* Active Top Card */}
        <div
          className={`w-full rounded-xl border p-3.5 shadow-2xl backdrop-blur-xl transition-all duration-300 ${
            streamType === 'evolution'
              ? 'border-purple-500/80 bg-gradient-to-b from-purple-950/95 via-gray-950/95 to-black/95 text-purple-100 shadow-purple-500/30'
              : isSapient
              ? 'border-amber-400/80 bg-gradient-to-b from-amber-950/95 via-gray-950/95 to-black/95 text-amber-100 shadow-amber-500/30'
              : 'border-cyan-500/60 bg-gradient-to-b from-cyan-950/95 via-gray-950/95 to-black/95 text-gray-200 shadow-cyan-500/30'
          }`}
        >
          {/* Header Row: Badge, Stack Counter, Dismiss All & Close */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <span
                className="flex h-2.5 w-2.5 rounded-full animate-ping"
                style={{ backgroundColor: currentEvent.color }}
              />
              <span
                className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded ${
                  streamType === 'evolution'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-400/50'
                    : isSapient
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                }`}
              >
                {currentEvent.eventType === 'ascension'
                  ? '🧬 ĐỘT PHÁ NẤC THANG TIẾN HÓA'
                  : currentEvent.eventType === 'de_novo_chemical_synthesis'
                  ? '⚗️ KHỞI SINH HÓA HỌC TỰ PHÁT'
                  : isSapient
                  ? '👑 KHỞI SINH TRÍ TUỆ ĐỈNH CAO'
                  : '✨ PHÁT HIỆN LOÀI MỚI'}
              </span>

              {/* Stack Counter Pill */}
              {queueLength > 0 && (
                <span
                  data-testid="toast-stack-badge"
                  className="text-[9px] bg-cyan-950/80 border border-cyan-400/40 px-2 py-0.5 rounded-full text-cyan-200 font-semibold"
                >
                  +{queueLength} loài trong hàng đợi
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {queueLength > 0 && (
                <button
                  onClick={onDismissAllItems}
                  className="text-[9px] text-gray-400 hover:text-rose-300 transition-colors px-1.5 py-0.5 rounded border border-white/10 hover:border-rose-500/40"
                  title="Bỏ qua tất cả thông báo trong hàng đợi"
                >
                  Bỏ qua tất cả ({queueLength + 1})
                </button>
              )}
              <button
                onClick={onDismissSingle}
                className="text-gray-400 hover:text-white transition-colors text-sm font-bold px-1"
                title="Đóng thông báo"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Compact Summary: Species Name, Tier, Scientific Name */}
          <div className="mt-2.5 flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: currentEvent.color }}
                />
                <h3 className="text-sm font-bold text-white tracking-wide">
                  {currentEvent.speciesName}
                </h3>
                <span className="text-[10px] font-semibold text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded bg-cyan-950/60">
                  {traits.tierLabel}
                </span>
              </div>
              <p className="text-[11px] italic text-gray-400 ml-4">{traits.scientificName}</p>
            </div>

            {/* Quick Action: Details Toggle Button */}
            <button
              onClick={() => {
                SoundFX.playClick()
                onToggleDetails()
              }}
              className="flex items-center gap-1 text-[10px] text-gray-300 hover:text-white px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors whitespace-nowrap shadow-sm"
              title="Mở rộng hoặc thu gọn thông tin chi tiết sinh học"
            >
              <span>{isExpanded ? '▲ Thu gọn' : '▼ Chi tiết'}</span>
            </button>
          </div>

          {/* Compact Kingdom & Trophic Badges */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
            <span className="rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 font-bold flex items-center gap-1">
              <span>{traits.domainIcon}</span>
              <span>{traits.domainLabel}</span>
            </span>
            <span className="rounded bg-gray-900 border border-white/10 px-2 py-0.5 text-gray-200 font-medium">
              {traits.trophicRoleLabel}
            </span>
            {traits.planetaryLineageLabel && (
              <span className="rounded bg-indigo-950/80 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 font-semibold text-[9px]">
                ✨ {traits.planetaryLineageLabel}
              </span>
            )}
          </div>

          {/* Collapsible Details Section */}
          {isExpanded && (
            <div
              data-testid="toast-details-section"
              className="mt-3 pt-2.5 border-t border-white/10 space-y-2 text-[10px] animate-in fade-in duration-200"
            >
              {isSapient && traits.sapientLabel && (
                <div className="rounded-lg border border-amber-500/40 bg-amber-950/40 p-2 text-[11px] text-amber-200">
                  <span className="font-semibold block text-[10px] uppercase text-amber-400 tracking-wide">
                    Dạng Trí Tuệ Thích Nghi:
                  </span>
                  {traits.sapientLabel}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded bg-black/40 border border-white/5 p-2">
                  <span className="text-gray-400 block text-[9px] uppercase">Thức ăn:</span>
                  <span className="font-medium text-emerald-300 line-clamp-1">
                    {traits.dietDescription}
                  </span>
                </div>
                <div className="rounded bg-black/40 border border-white/5 p-2">
                  <span className="text-gray-400 block text-[9px] uppercase">Vận động:</span>
                  <span className="font-medium text-cyan-300 line-clamp-1">{traits.locomotion}</span>
                </div>
              </div>

              {traits.cellularGrade && (
                <div className="rounded bg-black/40 border border-white/5 p-2">
                  <span className="text-gray-400 block text-[9px] uppercase">Cấp độ cấu trúc tế bào:</span>
                  <span className="font-medium text-cyan-200 line-clamp-2">{traits.cellularGrade}</span>
                </div>
              )}

              <div className="space-y-1.5 text-gray-300">
                <div>
                  <span className="text-gray-400 text-[9px] uppercase block">Hình thái học:</span>
                  <p className="line-clamp-2 text-gray-300">{traits.morphology}</p>
                </div>
                {traits.notableAdaptations.length > 0 && (
                  <div>
                    <span className="text-gray-400 text-[9px] uppercase block">
                      Đặc điểm sinh học nổi bật:
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {traits.notableAdaptations.slice(0, 3).map((ad, idx) => (
                        <span
                          key={idx}
                          className="rounded bg-white/5 border border-white/10 px-1.5 py-0.5 text-[9px] text-gray-300"
                        >
                          • {ad}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[10px]">
            <span className="text-gray-400 italic">
              Vòng tự quay: {currentEvent.emergenceRotation}
            </span>

            <div className="flex items-center gap-3">
              {queueLength > 0 && (
                <button
                  onClick={onDismissSingle}
                  className="text-gray-300 hover:text-white transition-colors flex items-center gap-1 font-medium"
                  title="Chuyển sang loài tiếp theo trong hàng đợi"
                >
                  <span>Tiếp theo</span>
                  <span>▶</span>
                </button>
              )}
              {onSelectSpecies && (
                <button
                  onClick={() => {
                    onSelectSpecies(currentEvent.speciesId)
                    onDismissSingle()
                  }}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-2 transition-colors"
                >
                  Xem trong danh mục →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!speciesStream.current && !evolutionStream.current) return null

  return (
    <>
      {/* Stream 1: New Species Notifications (Phía Trên - TOP) */}
      {speciesStream.current && (
        <div
          role="alert"
          data-testid="toast-stream-species"
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 select-none pointer-events-auto flex flex-col items-center animate-in fade-in slide-in-from-top-6 duration-300 font-mono"
        >
          {renderToastCard(
            speciesStream.current,
            speciesStream.queue.length,
            speciesStream.isDetailsExpanded,
            () =>
              setSpeciesStream((prev) => ({
                ...prev,
                isDetailsExpanded: !prev.isDetailsExpanded,
              })),
            dismissSpecies,
            dismissAllSpecies,
            'species'
          )}
        </div>
      )}

      {/* Stream 2: Evolutionary Ascension Breakthroughs (Phía Dưới - BOTTOM) */}
      {evolutionStream.current && (
        <div
          role="alert"
          data-testid="toast-stream-evolution"
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 select-none pointer-events-auto flex flex-col items-center animate-in fade-in slide-in-from-bottom-6 duration-300 font-mono"
        >
          {renderToastCard(
            evolutionStream.current,
            evolutionStream.queue.length,
            evolutionStream.isDetailsExpanded,
            () =>
              setEvolutionStream((prev) => ({
                ...prev,
                isDetailsExpanded: !prev.isDetailsExpanded,
              })),
            dismissEvolution,
            dismissAllEvolution,
            'evolution'
          )}
        </div>
      )}
    </>
  )
}
