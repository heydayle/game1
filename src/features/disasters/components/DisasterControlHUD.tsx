import { useState, useEffect } from 'react'
import type {
  ActiveDisasterSummary,
  DisasterType,
  EnvironmentalPerturbations,
} from '../types.js'
import { DISASTER_CATALOG } from '../constants.js'
import { SoundFX } from '../../audio/SoundFXEngine.js'

interface DisasterControlHUDProps {
  activeDisasters: readonly ActiveDisasterSummary[]
  perturbations: EnvironmentalPerturbations
  onTriggerDisaster: (type: DisasterType, severity: number) => void
}

export function DisasterControlHUD({
  activeDisasters,
  perturbations,
  onTriggerDisaster,
}: DisasterControlHUDProps) {
  const [severity, setSeverity] = useState<number>(0.8)
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false)
  const [selectedActiveId, setSelectedActiveId] = useState<string | null>(
    activeDisasters[0]?.id ?? null
  )

  // Sync selected disaster when active disasters change
  useEffect(() => {
    if (activeDisasters.length > 0) {
      if (!selectedActiveId || !activeDisasters.some((d) => d.id === selectedActiveId)) {
        setSelectedActiveId(activeDisasters[0]?.id ?? null)
      }
    } else {
      setSelectedActiveId(null)
    }
  }, [activeDisasters, selectedActiveId])

  const disasterKeys = Object.keys(DISASTER_CATALOG) as DisasterType[]

  return (
    <>
      {/* 1. Left Docked Button to open Cataclysm Arsenal Drawer */}
      <div className="fixed top-24 left-4 z-20 font-mono select-none pointer-events-auto">
        <button
          onClick={() => {
            SoundFX.playClick()
            setIsDrawerOpen((prev) => !prev)
          }}
          className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold shadow-lg backdrop-blur-md transition-all ${
            isDrawerOpen
              ? 'bg-red-700/90 border-red-400 text-white shadow-red-500/30 ring-2 ring-red-500/30'
              : 'bg-gray-950/85 border-white/15 text-gray-300 hover:bg-white/10 hover:text-white'
          }`}
          title="Mở kho vũ khí thiên tai (Trượt 1/5 màn hình từ bên trái)"
        >
          <span className="text-red-400 text-sm">⚡</span>
          <span>Unleash Cataclysm</span>
        </button>
      </div>

      {/* 2. Cataclysm Arsenal Drawer: Slides in from the left covering 1/5 screen */}
      {isDrawerOpen && (
        <aside
          data-testid="cataclysm-drawer"
          aria-label="Kho Vũ Khí Thiên Tai"
          className="fixed top-0 left-0 h-full w-full sm:w-72 md:w-80 lg:w-[20vw] min-w-[280px] max-w-[340px] z-40 bg-gray-950/95 border-r border-white/15 shadow-2xl backdrop-blur-2xl flex flex-col font-mono select-none pointer-events-auto animate-in fade-in slide-in-from-left duration-300"
        >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-3.5 bg-black/40">
          <div className="flex items-center gap-2">
            <span className="text-red-400 text-base">⚡</span>
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">
              Vũ Khí Thiên Tai
            </h2>
          </div>
          <button
            onClick={() => {
              SoundFX.playClick()
              setIsDrawerOpen(false)
            }}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-gray-400 hover:bg-white/10 hover:text-white transition-colors border border-white/10"
            title="Thu gọn kho thiên tai"
          >
            <span>✕ Thu gọn</span>
          </button>
        </div>

        {/* Severity Selector */}
        <div className="p-3.5 border-b border-white/10 bg-gray-900/40 space-y-2">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-gray-400 uppercase font-semibold">Cường độ hủy diệt:</span>
            <span className="font-bold text-amber-300">{(severity * 100).toFixed(0)}%</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => {
                SoundFX.playClick()
                setSeverity(0.5)
              }}
              className={`rounded-lg py-1 text-[11px] font-semibold transition-all border ${
                severity === 0.5
                  ? 'bg-blue-600 text-white border-blue-400 shadow-sm'
                  : 'bg-black/40 text-gray-400 hover:text-white border-white/5'
              }`}
            >
              50% Vừa
            </button>
            <button
              onClick={() => {
                SoundFX.playClick()
                setSeverity(0.8)
              }}
              className={`rounded-lg py-1 text-[11px] font-semibold transition-all border ${
                severity === 0.8
                  ? 'bg-amber-600 text-white border-amber-400 shadow-sm'
                  : 'bg-black/40 text-gray-400 hover:text-white border-white/5'
              }`}
            >
              80% Nặng
            </button>
            <button
              onClick={() => {
                SoundFX.playClick()
                setSeverity(1.0)
              }}
              className={`rounded-lg py-1 text-[11px] font-semibold transition-all border ${
                severity === 1.0
                  ? 'bg-red-600 text-white border-red-400 shadow-sm'
                  : 'bg-black/40 text-gray-400 hover:text-white border-white/5'
              }`}
            >
              100% Diệt
            </button>
          </div>
        </div>

        {/* Disaster Buttons List: Each disaster in its own discrete button card */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 custom-scrollbar">
          {disasterKeys.map((key) => {
            const def = DISASTER_CATALOG[key]
            const isCurrentlyActive = activeDisasters.some((d) => d.type === key)

            return (
              <button
                key={key}
                onClick={() => {
                  SoundFX.playClick()
                  onTriggerDisaster(key, severity)
                }}
                className={`w-full text-left rounded-xl border p-3 transition-all flex flex-col gap-1.5 group shadow-md ${
                  isCurrentlyActive
                    ? 'bg-red-950/40 border-red-500/60 ring-1 ring-red-500/30'
                    : 'bg-gray-900/60 hover:bg-gray-800/80 border-white/10 hover:border-red-500/40'
                }`}
                title={`Kích hoạt ${def.name}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5 group-hover:text-red-300">
                    <span className="text-base">{def.icon}</span>
                    <span>{def.name.split(' ')[0]}</span>
                    <span className="text-gray-300 font-normal">
                      {def.name.includes(' ') ? def.name.slice(def.name.indexOf(' ')) : ''}
                    </span>
                  </span>
                  <span className="text-[9px] text-gray-400 font-mono">
                    {def.defaultDurationRotations} rot
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed">
                  {def.description}
                </p>
                <div className="flex items-center justify-between text-[9px] text-gray-400 pt-1 border-t border-white/5">
                  <span className="text-red-400/80 font-semibold group-hover:text-red-300">
                    {isCurrentlyActive ? '⚡ Đang diễn ra' : '▶ Kích hoạt thiên tai'}
                  </span>
                  <span>Thời lượng: {def.defaultDurationRotations} vòng</span>
                </div>
              </button>
            )
          })}
        </div>
      </aside>
      )}

      {/* 3. Active Disaster Status: Small Pulsing Icon Badge with Expandable Details Popover */}
      {activeDisasters.length > 0 && (
        <div className="fixed top-36 left-4 z-30 flex flex-col gap-2 font-mono items-start pointer-events-auto">
          {activeDisasters.map((d) => {
            const isSelected = selectedActiveId === d.id
            const isAsteroid = d.type === 'asteroid_impact'
            const isIceAge = d.type === 'ice_age'
            const isSolar = d.type === 'solar_flare'
            const isVolcano = d.type === 'volcanic_eruption'

            return (
              <div key={d.id} className="relative flex flex-col items-start">
                {/* Small pulsing/blinking icon badge */}
                <button
                  onClick={() => {
                    SoundFX.playClick()
                    setSelectedActiveId(isSelected ? null : d.id)
                  }}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-xl backdrop-blur-md transition-all ${
                    isSelected
                      ? 'bg-red-950/90 border-red-400 text-red-200 ring-2 ring-red-500/40 shadow-red-500/20'
                      : 'bg-black/85 border-red-500/50 text-white hover:bg-red-950/70 hover:border-red-400'
                  }`}
                  title="Nhấp để hiển thị tiến trình (process), thời gian và phạm vi thiên tai"
                >
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                  </span>
                  <span className="text-sm">{DISASTER_CATALOG[d.type].icon}</span>
                  <span className="text-[11px] font-bold tracking-tight">{d.name.split(' ')[0]}</span>
                  <span className="text-[10px] rounded-full px-1.5 py-0.2 bg-red-950 text-red-300 border border-red-500/40">
                    {d.remainingRotations} rot
                  </span>
                </button>

                {/* Popover Card displaying Process, Thời gian, and Phạm vi */}
                {isSelected && (
                  <div className="mt-1.5 w-80 rounded-xl border border-red-500/50 bg-gray-950/95 p-3.5 shadow-2xl backdrop-blur-2xl text-xs z-50 animate-in fade-in slide-in-from-left-2">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <div className="flex items-center gap-1.5 font-bold text-white">
                        <span className="text-base">{DISASTER_CATALOG[d.type].icon}</span>
                        <span className="tracking-wide uppercase text-[11px]">{d.name}</span>
                      </div>
                      <span className="bg-red-950/80 text-red-300 text-[10px] px-1.5 py-0.5 rounded border border-red-500/40">
                        Sev: {(d.severity * 100).toFixed(0)}%
                      </span>
                    </div>

                    {/* Process (Tiến trình) */}
                    <div className="mt-2.5 space-y-1">
                      <div className="flex justify-between text-[10px] text-gray-400">
                        <span className="uppercase tracking-wider font-semibold">Tiến trình (Process)</span>
                        <span className="text-cyan-300 font-bold">
                          {Math.round(Math.max(0, (1 - d.progress) * 100))}%
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isIceAge
                              ? 'bg-cyan-400'
                              : isSolar
                                ? 'bg-amber-400'
                                : isVolcano
                                  ? 'bg-orange-500'
                                  : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.max(5, (1 - d.progress) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Thời gian */}
                    <div className="mt-2.5 flex justify-between text-[10px] bg-black/40 p-2 rounded border border-white/5">
                      <span className="text-gray-400">Thời gian:</span>
                      <div className="flex items-center gap-1 font-semibold text-white">
                        <span>{d.remainingRotations} rot remaining</span>
                        <span className="text-gray-400 font-normal">({d.durationRotations} rot tổng)</span>
                      </div>
                    </div>

                    {/* Phạm vi & Biến động môi trường */}
                    <div className="mt-2.5 space-y-1.5 text-[10px]">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-gray-400 uppercase text-[9px] font-semibold">
                          Phạm vi tác động:
                        </span>
                        <span className="text-amber-300 font-bold bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-500/30">
                          {isAsteroid
                            ? 'Toàn cầu & Điểm va chạm'
                            : isIceAge
                              ? 'Toàn cầu & Băng cực'
                              : isVolcano
                                ? 'Khu vực & Khí quyển tầng cao'
                                : 'Toàn cầu'}
                        </span>
                      </div>

                      {/* Real-time Environmental Perturbations */}
                      <div className="grid grid-cols-2 gap-1.5 mt-1">
                        {perturbations.temperatureDeltaCelsius !== 0 && (
                          <div className="rounded bg-black/30 p-1.5 border border-white/5">
                            <span className="text-gray-400 text-[9px] block">Biến thiên nhiệt:</span>
                            <span
                              className={
                                perturbations.temperatureDeltaCelsius < 0
                                  ? 'text-cyan-300 font-bold'
                                  : 'text-orange-300 font-bold'
                              }
                            >
                              ΔT: {perturbations.temperatureDeltaCelsius > 0 ? '+' : ''}
                              {perturbations.temperatureDeltaCelsius}°C
                            </span>
                          </div>
                        )}
                        {perturbations.atmosphericDust > 0.05 && (
                          <div className="rounded bg-black/30 p-1.5 border border-white/5">
                            <span className="text-gray-400 text-[9px] block">Bụi khí quyển:</span>
                            <span className="text-gray-200 font-bold">
                              Dust: {(perturbations.atmosphericDust * 100).toFixed(0)}%
                            </span>
                          </div>
                        )}
                        {perturbations.radiationMultiplier > 1.2 && (
                          <div className="rounded bg-black/30 p-1.5 border border-white/5">
                            <span className="text-gray-400 text-[9px] block">Bức xạ:</span>
                            <span className="text-amber-300 font-bold">
                              Rad: {perturbations.radiationMultiplier}x
                            </span>
                          </div>
                        )}
                        {perturbations.instantMortalityRate > 0 && (
                          <div className="rounded bg-black/30 p-1.5 border border-white/5">
                            <span className="text-gray-400 text-[9px] block">Sóng xung kích:</span>
                            <span className="text-red-400 font-bold">
                              Shockwave: {(perturbations.instantMortalityRate * 100).toFixed(0)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
