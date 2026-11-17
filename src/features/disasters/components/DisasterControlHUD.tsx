import { useState } from 'react'
import type {
  ActiveDisasterSummary,
  DisasterType,
  EnvironmentalPerturbations,
} from '../types.js'
import { DISASTER_CATALOG } from '../constants.js'

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
  const [isExpanded, setIsExpanded] = useState<boolean>(false)

  const disasterKeys = Object.keys(DISASTER_CATALOG) as DisasterType[]

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 font-mono select-none pointer-events-auto">
      {/* Active Disaster Alert Banner */}
      {activeDisasters.length > 0 && (
        <div className="flex flex-col gap-1.5 items-center">
          {activeDisasters.map((d) => {
            const isAsteroid = d.type === 'asteroid_impact'
            const isIceAge = d.type === 'ice_age'
            const isSolar = d.type === 'solar_flare'
            const isVolcano = d.type === 'volcanic_eruption'

            const borderColor = isAsteroid
              ? 'border-red-500/60 shadow-red-500/20'
              : isIceAge
                ? 'border-cyan-400/60 shadow-cyan-400/20'
                : isSolar
                  ? 'border-amber-400/60 shadow-amber-400/20'
                  : isVolcano
                    ? 'border-orange-500/60 shadow-orange-500/20'
                    : 'border-purple-500/60 shadow-purple-500/20'

            return (
              <div
                key={d.id}
                className={`flex flex-col gap-1 rounded-lg border bg-black/85 backdrop-blur-md px-4 py-2 text-xs text-white shadow-lg transition-all animate-pulse min-w-[340px] max-w-[460px] ${borderColor}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{DISASTER_CATALOG[d.type].icon}</span>
                    <span className="font-semibold tracking-wide uppercase text-[11px]">
                      {d.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-gray-300">
                    <span className="bg-red-950/80 text-red-300 px-1.5 py-0.5 rounded border border-red-500/30">
                      {d.remainingRotations} rot remaining
                    </span>
                    <span>Sev: {(d.severity * 100).toFixed(0)}%</span>
                  </div>
                </div>

                {/* Duration Progress Bar */}
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
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

                {/* Real-time Perturbation Indicators */}
                <div className="flex items-center justify-between text-[10px] text-gray-400 mt-0.5">
                  {perturbations.temperatureDeltaCelsius !== 0 && (
                    <span
                      className={
                        perturbations.temperatureDeltaCelsius < 0
                          ? 'text-cyan-300'
                          : 'text-orange-300'
                      }
                    >
                      ΔT: {perturbations.temperatureDeltaCelsius > 0 ? '+' : ''}
                      {perturbations.temperatureDeltaCelsius}°C
                    </span>
                  )}
                  {perturbations.atmosphericDust > 0.05 && (
                    <span className="text-gray-300">
                      Dust: {(perturbations.atmosphericDust * 100).toFixed(0)}%
                    </span>
                  )}
                  {perturbations.radiationMultiplier > 1.2 && (
                    <span className="text-amber-300">
                      Rad: {perturbations.radiationMultiplier}x
                    </span>
                  )}
                  {perturbations.mutationRateMultiplier > 1.2 && (
                    <span className="text-purple-300">
                      Mut: {perturbations.mutationRateMultiplier}x
                    </span>
                  )}
                  {perturbations.instantMortalityRate > 0 && (
                    <span className="text-red-400 font-bold animate-bounce">
                      Shockwave: {(perturbations.instantMortalityRate * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Cataclysm Arsenal Control Dock */}
      <div className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/75 px-3 py-1.5 backdrop-blur-md shadow-xl text-xs">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 px-2 py-0.5 text-gray-300 hover:text-white transition-colors"
          title="Toggle Disaster Arsenal Panel"
        >
          <span className="text-red-400 font-bold">⚡</span>
          <span className="text-[11px] font-medium tracking-wide">
            {isExpanded ? 'Hide Cataclysms' : 'Unleash Cataclysm'}
          </span>
        </button>

        {isExpanded && (
          <>
            <div className="h-4 w-[1px] bg-white/20 mx-1" />

            {/* Disaster Quick Trigger Buttons */}
            <div className="flex items-center gap-1">
              {disasterKeys.map((key) => {
                const def = DISASTER_CATALOG[key]
                const isCurrentlyActive = activeDisasters.some((d) => d.type === key)

                return (
                  <button
                    key={key}
                    onClick={() => onTriggerDisaster(key, severity)}
                    className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-all ${
                      isCurrentlyActive
                        ? 'bg-red-500/30 text-red-200 border border-red-500/50'
                        : 'bg-white/5 hover:bg-white/15 text-gray-200 hover:text-white border border-white/10'
                    }`}
                    title={`${def.name}: ${def.description}`}
                  >
                    <span>{def.icon}</span>
                    <span className="hidden sm:inline">{def.name.split(' ')[0]}</span>
                  </button>
                )
              })}
            </div>

            <div className="h-4 w-[1px] bg-white/20 mx-1" />

            {/* Severity Selector */}
            <div className="flex items-center gap-1 text-[10px] text-gray-400">
              <span>Sev:</span>
              <button
                onClick={() => setSeverity(0.5)}
                className={`px-1.5 py-0.5 rounded ${
                  severity === 0.5 ? 'bg-blue-600 text-white font-bold' : 'hover:bg-white/10'
                }`}
              >
                50%
              </button>
              <button
                onClick={() => setSeverity(0.8)}
                className={`px-1.5 py-0.5 rounded ${
                  severity === 0.8 ? 'bg-amber-600 text-white font-bold' : 'hover:bg-white/10'
                }`}
              >
                80%
              </button>
              <button
                onClick={() => setSeverity(1.0)}
                className={`px-1.5 py-0.5 rounded ${
                  severity === 1.0 ? 'bg-red-600 text-white font-bold' : 'hover:bg-white/10'
                }`}
              >
                100%
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

