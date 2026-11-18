import { useState } from 'react'
import type { BiogeochemicalState, GasTrend } from '../biogeochemistry/types.js'

interface BiogeochemicalHUDProps {
  biogeochemical?: BiogeochemicalState
  rotations: number
  partialRotation?: number
  embedded?: boolean
  className?: string
}

function getTrendSymbol(trend?: GasTrend): string {
  switch (trend) {
    case 'rising':
      return '▲'
    case 'falling':
      return '▼'
    default:
      return '▶'
  }
}

function getTrendColor(trend?: GasTrend, inverted = false): string {
  if (trend === 'rising') {
    return inverted ? 'text-amber-400' : 'text-emerald-400'
  }
  if (trend === 'falling') {
    return inverted ? 'text-emerald-400' : 'text-rose-400'
  }
  return 'text-gray-500'
}

function getRegimeBadge(regime?: BiogeochemicalState['dominantBiochemicalRegime']): {
  label: string
  color: string
  border: string
  bg: string
} {
  switch (regime) {
    case 'Great Oxidation Surge':
      return {
        label: 'Great Oxidation Surge',
        color: 'text-cyan-300',
        border: 'border-cyan-500/40',
        bg: 'bg-cyan-950/60',
      }
    case 'Equilibrium Biosphere':
      return {
        label: 'Equilibrium Biosphere',
        color: 'text-emerald-300',
        border: 'border-emerald-500/40',
        bg: 'bg-emerald-950/60',
      }
    case 'Volcanic Greenhouse':
      return {
        label: 'Volcanic Greenhouse',
        color: 'text-amber-300',
        border: 'border-amber-500/40',
        bg: 'bg-amber-950/60',
      }
    case 'Glacial Cryo-Lock':
      return {
        label: 'Glacial Cryo-Lock',
        color: 'text-blue-200',
        border: 'border-blue-400/40',
        bg: 'bg-blue-950/60',
      }
    case 'Impact Fallback':
      return {
        label: 'Impact Dust Fallout',
        color: 'text-rose-300',
        border: 'border-rose-500/40',
        bg: 'bg-rose-950/60',
      }
    case 'Chemosynthetic Haze':
      return {
        label: 'Chemosynthetic Haze',
        color: 'text-purple-300',
        border: 'border-purple-500/40',
        bg: 'bg-purple-950/60',
      }
    default:
      return {
        label: 'Primordial Anoxic',
        color: 'text-yellow-300',
        border: 'border-yellow-500/40',
        bg: 'bg-yellow-950/60',
      }
  }
}

export function BiogeochemicalHUD({
  biogeochemical,
  rotations,
  partialRotation = 0,
  embedded = false,
  className,
}: BiogeochemicalHUDProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [activeTab, setActiveTab] = useState<'atmosphere' | 'elemental'>('atmosphere')

  if (!biogeochemical) return null

  const { atmospheric, elemental, trends, biosphericFlux, cyclePhase, dominantBiochemicalRegime } =
    biogeochemical

  const regime = getRegimeBadge(dominantBiochemicalRegime)

  // Diurnal phase description
  const isNocturnal = cyclePhase === 'nocturnal_cooling'
  const isSeasonal = cyclePhase === 'seasonal_flux'

  const containerClass = embedded
    ? (className ?? 'w-full rounded-xl border border-white/10 bg-gray-950/80 p-3.5 font-mono text-xs shadow-xl backdrop-blur-md')
    : 'fixed top-28 left-4 z-10 w-80 rounded-lg border border-white/10 bg-gray-950/85 p-3.5 font-mono text-xs shadow-xl backdrop-blur-md'

  return (
    <div
      data-testid="biogeochemical-hud"
      className={containerClass}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                dominantBiochemicalRegime === 'Volcanic Greenhouse'
                  ? 'bg-amber-400'
                  : dominantBiochemicalRegime === 'Glacial Cryo-Lock'
                    ? 'bg-blue-300'
                    : 'bg-cyan-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                dominantBiochemicalRegime === 'Volcanic Greenhouse'
                  ? 'bg-amber-500'
                  : dominantBiochemicalRegime === 'Glacial Cryo-Lock'
                    ? 'bg-blue-400'
                    : 'bg-cyan-500'
              }`}
            />
          </span>
          <span className="text-[10px] tracking-wider font-semibold uppercase text-cyan-400">
            Biogeochemical Cycle
          </span>
        </div>
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="text-[10px] text-gray-400 hover:text-white transition-colors"
          title={isExpanded ? 'Collapse panel' : 'Expand panel'}
        >
          {isExpanded ? 'Hide ▲' : 'Show ▼'}
        </button>
      </div>

      {/* Dominant Regime & Planetary Dynamics Banner */}
      <div className="mt-2.5 flex items-center justify-between gap-1.5">
        <span
          className={`inline-block rounded px-2 py-0.5 text-[9px] font-semibold uppercase border ${regime.bg} ${regime.border} ${regime.color}`}
        >
          {regime.label}
        </span>
        <div className="flex items-center gap-1 text-[9px] text-gray-400">
          <span>{isNocturnal ? '🌙 Night Flux' : isSeasonal ? '🍂 Tilt Surge' : '☀️ Day Peak'}</span>
          <span className="text-gray-600">|</span>
          <span className="text-gray-300 font-mono">
            P:{atmospheric.pressureAtm.toFixed(2)}a
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 space-y-3">
          {/* Tabs */}
          <div className="grid grid-cols-2 gap-1 rounded bg-black/40 p-0.5 text-[10px]">
            <button
              onClick={() => setActiveTab('atmosphere')}
              className={`rounded py-1 transition-all ${
                activeTab === 'atmosphere'
                  ? 'bg-cyan-950/70 text-cyan-300 font-semibold shadow-sm border border-cyan-800/40'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Atmosphere (100%)
            </button>
            <button
              onClick={() => setActiveTab('elemental')}
              className={`rounded py-1 transition-all ${
                activeTab === 'elemental'
                  ? 'bg-cyan-950/70 text-cyan-300 font-semibold shadow-sm border border-cyan-800/40'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Crust & Elements
            </button>
          </div>

          {/* Tab 1: Atmospheric Gases */}
          {activeTab === 'atmosphere' && (
            <div className="space-y-2">
              {/* Nitrogen */}
              <div>
                <div className="flex justify-between text-[10px] text-gray-300 mb-0.5">
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-400" />
                    <span>Nitrogen (N₂)</span>
                  </span>
                  <span className="font-mono text-gray-400">{atmospheric.nitrogen.toFixed(2)}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full bg-indigo-500/80 transition-all duration-300"
                    style={{ width: `${Math.min(100, atmospheric.nitrogen)}%` }}
                  />
                </div>
              </div>

              {/* Oxygen */}
              <div>
                <div className="flex justify-between text-[10px] text-gray-300 mb-0.5">
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span>Oxygen (O₂)</span>
                    <span className={`text-[8px] font-bold ${getTrendColor(trends.oxygenTrend)}`}>
                      {getTrendSymbol(trends.oxygenTrend)}
                    </span>
                  </span>
                  <span className="font-mono text-emerald-400 font-medium">
                    {atmospheric.oxygen.toFixed(2)}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-300 shadow-[0_0_8px_rgba(52,211,153,0.3)]"
                    style={{ width: `${Math.min(100, atmospheric.oxygen * 2.5)}%` }}
                  />
                </div>
              </div>

              {/* Carbon Dioxide */}
              <div>
                <div className="flex justify-between text-[10px] text-gray-300 mb-0.5">
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
                    <span>Carbon Dioxide (CO₂)</span>
                    <span className={`text-[8px] font-bold ${getTrendColor(trends.co2Trend, true)}`}>
                      {getTrendSymbol(trends.co2Trend)}
                    </span>
                  </span>
                  <span className="font-mono text-amber-400">
                    {atmospheric.carbonDioxide.toFixed(2)}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full bg-amber-400 transition-all duration-300"
                    style={{ width: `${Math.min(100, atmospheric.carbonDioxide * 3)}%` }}
                  />
                </div>
              </div>

              {/* Methane */}
              <div>
                <div className="flex justify-between text-[10px] text-gray-300 mb-0.5">
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-purple-400" />
                    <span>Methane (CH₄)</span>
                    <span className={`text-[8px] font-bold ${getTrendColor(trends.methaneTrend)}`}>
                      {getTrendSymbol(trends.methaneTrend)}
                    </span>
                  </span>
                  <span className="font-mono text-purple-400">
                    {atmospheric.methane.toFixed(2)}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full bg-purple-400 transition-all duration-300"
                    style={{ width: `${Math.min(100, atmospheric.methane * 10)}%` }}
                  />
                </div>
              </div>

              {/* Water Vapor */}
              <div>
                <div className="flex justify-between text-[10px] text-gray-300 mb-0.5">
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-400" />
                    <span>Water Vapor (H₂O)</span>
                    <span className={`text-[8px] font-bold ${getTrendColor(trends.waterVaporTrend)}`}>
                      {getTrendSymbol(trends.waterVaporTrend)}
                    </span>
                  </span>
                  <span className="font-mono text-sky-400">
                    {atmospheric.waterVapor.toFixed(2)}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full bg-sky-400 transition-all duration-300"
                    style={{ width: `${Math.min(100, atmospheric.waterVapor * 10)}%` }}
                  />
                </div>
              </div>

              {/* Biosphere Gas Flux Rates */}
              <div className="mt-2 rounded border border-white/5 bg-black/30 p-2">
                <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Biogenic Dynamic Flux
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px]">
                  <div className="flex justify-between text-gray-300">
                    <span>O₂ Photosynth:</span>
                    <span className="font-mono text-emerald-400">
                      +{biosphericFlux.oxygenProductionRate.toFixed(3)}/r
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>CO₂ Respiration:</span>
                    <span className="font-mono text-amber-400">
                      +{biosphericFlux.respirationRate.toFixed(3)}/r
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>C-Org Fixation:</span>
                    <span className="font-mono text-cyan-400">
                      +{biosphericFlux.carbonFixationRate.toFixed(3)}/r
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Methanogenesis:</span>
                    <span className="font-mono text-purple-400">
                      {biosphericFlux.methanogenesisRate >= 0 ? '+' : ''}
                      {biosphericFlux.methanogenesisRate.toFixed(3)}/r
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Crustal Elements */}
          {activeTab === 'elemental' && (
            <div className="space-y-2.5">
              {/* Continuous Segmented Bar */}
              <div>
                <div className="text-[9px] text-gray-400 mb-1 flex justify-between">
                  <span>Crustal Core Distribution</span>
                  <span className="font-mono text-gray-500">100.0%</span>
                </div>
                <div className="flex h-2.5 w-full overflow-hidden rounded bg-white/5">
                  <div
                    className="bg-amber-600 transition-all duration-300"
                    style={{ width: `${elemental.silicatesRock}%` }}
                    title={`Silicates: ${elemental.silicatesRock}%`}
                  />
                  <div
                    className="bg-slate-400 transition-all duration-300"
                    style={{ width: `${elemental.ironMetals}%` }}
                    title={`Metals: ${elemental.ironMetals}%`}
                  />
                  <div
                    className="bg-sky-500 transition-all duration-300"
                    style={{ width: `${elemental.waterVolatiles}%` }}
                    title={`Volatiles: ${elemental.waterVolatiles}%`}
                  />
                  <div
                    className="bg-emerald-500 transition-all duration-300"
                    style={{ width: `${elemental.carbonOrganics}%` }}
                    title={`Organics: ${elemental.carbonOrganics}%`}
                  />
                </div>
              </div>

              {/* Element Cards */}
              <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                <div className="rounded border border-amber-900/30 bg-amber-950/20 p-1.5">
                  <div className="flex justify-between text-amber-300">
                    <span>Silicates/Rock</span>
                    <span className="font-mono font-bold">{elemental.silicatesRock.toFixed(1)}%</span>
                  </div>
                  <span className="text-[8px] text-gray-400">Continental crust & mantle</span>
                </div>

                <div className="rounded border border-slate-700/30 bg-slate-900/20 p-1.5">
                  <div className="flex justify-between text-slate-300">
                    <span>Iron/Metals</span>
                    <span className="font-mono font-bold">{elemental.ironMetals.toFixed(1)}%</span>
                  </div>
                  <span className="text-[8px] text-gray-400">Magnetic dynamo & ores</span>
                </div>

                <div className="rounded border border-sky-900/30 bg-sky-950/20 p-1.5">
                  <div className="flex justify-between text-sky-300">
                    <span>Water/Volatiles</span>
                    <span className="font-mono font-bold">{elemental.waterVolatiles.toFixed(1)}%</span>
                  </div>
                  <span className="text-[8px] text-gray-400">Hydrosphere reservoirs</span>
                </div>

                <div className="rounded border border-emerald-900/30 bg-emerald-950/20 p-1.5">
                  <div className="flex justify-between text-emerald-300">
                    <span className="flex items-center gap-1">
                      <span>C-Organics</span>
                      <span className={`text-[8px] font-bold ${getTrendColor(trends.organicCarbonTrend)}`}>
                        {getTrendSymbol(trends.organicCarbonTrend)}
                      </span>
                    </span>
                    <span className="font-mono font-bold">{elemental.carbonOrganics.toFixed(1)}%</span>
                  </div>
                  <span className="text-[8px] text-gray-400">Biological fossil strata</span>
                </div>
              </div>
            </div>
          )}

          {/* Footer Cycle Ticker */}
          <div className="flex items-center justify-between border-t border-white/5 pt-2 text-[9px] text-gray-500">
            <span>Spin Flux Cycle</span>
            <span className="font-mono text-gray-400">
              Rot {rotations.toLocaleString()} + {(partialRotation * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

