import { useState } from 'react'
import type { SpeciesSummary } from '../genetics/types.js'
import type { BiomeDistributionStats } from '../../environment/climate/types.js'
import type { PrebioticState } from '../abiogenesis/types.js'

interface EcosystemHUDProps {
  totalPopulation: number
  activeSpeciesCount: number
  extinctSpeciesCount: number
  averageFitness: number
  generation: number
  speciesSummaries: readonly SpeciesSummary[]
  biomeDistribution?: BiomeDistributionStats
  prebioticState?: PrebioticState
  onSeedLife?: () => void
  onTriggerStress?: () => void
  onSparkBiogenesis?: () => void
}

export function EcosystemHUD({
  totalPopulation,
  activeSpeciesCount,
  extinctSpeciesCount,
  averageFitness,
  generation,
  speciesSummaries,
  biomeDistribution,
  prebioticState,
  onSeedLife,
  onTriggerStress,
  onSparkBiogenesis,
}: EcosystemHUDProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const isPrebiotic = prebioticState?.stage === 'prebiotic'
  const isExtinct = prebioticState?.stage === 'extinct' && totalPopulation === 0

  return (
    <div className="fixed bottom-4 right-4 z-10 w-84 rounded-lg border border-white/10 bg-gray-950/85 p-3.5 font-mono text-xs shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block h-2 w-2 rounded-full animate-pulse ${
              isPrebiotic
                ? 'bg-amber-400'
                : isExtinct
                  ? (prebioticState?.biogenesisReadiness ? 'bg-amber-400' : 'bg-rose-500')
                  : 'bg-emerald-400'
            }`}
          />
          <span
            className={`text-[10px] tracking-wider font-semibold uppercase ${
              isPrebiotic
                ? 'text-amber-400'
                : isExtinct
                  ? (prebioticState?.biogenesisReadiness ? 'text-amber-400' : 'text-rose-400')
                  : 'text-emerald-400'
            }`}
          >
            {isPrebiotic
              ? '🧪 Primordial Chemical Soup'
              : isExtinct
                ? (prebioticState?.biogenesisReadiness ? '🌱 Biosphere Resurgence' : '☠ Biosphere Extinction')
                : 'Biosphere Monitor'}
          </span>
        </div>
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="text-[10px] text-gray-400 hover:text-white transition-colors"
        >
          {isExpanded ? 'Hide ▲' : 'Show ▼'}
        </button>
      </div>

      {/* Mode A: Prebiotic Chemical Era */}
      {isPrebiotic && (
        <div className="mt-2.5 space-y-2.5">
          {/* Chemical Gauges */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded bg-gray-900/60 p-1.5 border border-white/5">
              <span className="text-[9px] text-gray-400 uppercase block">Solvent (H₂O)</span>
              <span className="text-xs font-bold text-cyan-300">
                {((prebioticState?.waterViability ?? 0) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="rounded bg-gray-900/60 p-1.5 border border-white/5">
              <span className="text-[9px] text-gray-400 uppercase block">Organics (C, N)</span>
              <span className="text-xs font-bold text-emerald-300">
                {((prebioticState?.organicAbundance ?? 0) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="rounded bg-gray-900/60 p-1.5 border border-white/5">
              <span className="text-[9px] text-gray-400 uppercase block">Catalyst Energy</span>
              <span className="text-xs font-bold text-amber-300">
                {((prebioticState?.catalystEnergy ?? 0) * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Organic Complexity Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-gray-300">
              <span>Prebiotic Synthesis:</span>
              <span className="font-bold text-amber-400">
                {((prebioticState?.organicComplexity ?? 0) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-900 border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-emerald-400 to-cyan-400 transition-all duration-300"
                style={{
                  width: `${Math.max(5, (prebioticState?.organicComplexity ?? 0) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Lineage & Status Description */}
          <div className="rounded border border-white/5 bg-gray-900/40 p-2 text-[10px] text-gray-300 space-y-1">
            <div className="text-gray-400">
              Chemical Lineage:{' '}
              <span className="font-semibold text-white">
                {prebioticState?.chemicalLineageArchetype ?? 'Progenitor'}
              </span>
            </div>
            <p className="text-[10px] text-gray-400 italic">
              {prebioticState?.statusDescription}
            </p>
          </div>

          {/* Biogenesis Action */}
          <div className="pt-1">
            <button
              onClick={onSparkBiogenesis ?? onSeedLife}
              className={`w-full rounded px-2.5 py-1.5 text-[11px] font-semibold transition-all shadow ${
                prebioticState?.biogenesisReadiness
                  ? 'bg-amber-500 hover:bg-amber-400 text-black font-bold animate-pulse'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-white/10'
              }`}
            >
              ⚡ Spark Biogenesis
            </button>
          </div>
        </div>
      )}

      {/* Mode B: Inhabited or Extinct Biological Era */}
      {!isPrebiotic && (
        <>
          {/* Metrics Row */}
          <div className="mt-2.5 grid grid-cols-3 gap-2 text-center">
            <div className="rounded bg-gray-900/60 p-1.5 border border-white/5">
              <span className="text-[9px] text-gray-400 uppercase block">Population</span>
              <span className="text-sm font-bold text-white">
                {totalPopulation.toLocaleString()}
              </span>
            </div>
            <div className="rounded bg-gray-900/60 p-1.5 border border-white/5">
              <span className="text-[9px] text-gray-400 uppercase block">Species</span>
              <span className="text-sm font-bold text-blue-400">
                {activeSpeciesCount}
              </span>
            </div>
            <div className="rounded bg-gray-900/60 p-1.5 border border-white/5">
              <span className="text-[9px] text-gray-400 uppercase block">Fitness</span>
              <span className="text-sm font-bold text-amber-300">
                {(averageFitness * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Secondary Abiogenesis Resurgence Progress (Active during Extinction) */}
          {isExtinct && (
            <div className="mt-2.5 rounded border border-amber-500/25 bg-amber-950/20 p-2 space-y-1.5">
              <div className="flex justify-between text-[10px]">
                <span className="text-amber-300 font-semibold flex items-center gap-1.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
                  Secondary Abiogenesis:
                </span>
                <span className="font-mono text-amber-400 font-bold">
                  {((prebioticState?.organicComplexity ?? 0) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/40 border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-400 transition-all duration-300"
                  style={{
                    width: `${Math.max(4, (prebioticState?.organicComplexity ?? 0) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-[9px] text-gray-300 italic">
                {prebioticState?.statusDescription}
              </p>
            </div>
          )}

          {isExpanded && (
            <div className="mt-3 space-y-2.5">
              {/* Sub metrics */}
              <div className="flex justify-between text-[11px] text-gray-400 px-0.5">
                <span>Generation: <strong className="text-white">Gen-{generation}</strong></span>
                <span>Extinctions: <strong className="text-rose-400">{extinctSpeciesCount}</strong></span>
              </div>

              {/* Biome Distribution Bar (if available) */}
              {biomeDistribution && (
                <div className="space-y-1">
                  <span className="text-[9px] text-gray-400 uppercase tracking-wider block">
                    Ecosystem Biomes
                  </span>
                  <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-900 border border-white/5">
                    <div
                      className="bg-blue-600"
                      style={{ width: `${biomeDistribution.deepOceanPercent}%` }}
                      title={`Deep Ocean: ${biomeDistribution.deepOceanPercent}%`}
                    />
                    <div
                      className="bg-cyan-500"
                      style={{ width: `${biomeDistribution.shallowOceanPercent}%` }}
                      title={`Shallow Ocean: ${biomeDistribution.shallowOceanPercent}%`}
                    />
                    <div
                      className="bg-green-600"
                      style={{ width: `${biomeDistribution.lowlandPercent}%` }}
                      title={`Lowlands/Plains: ${biomeDistribution.lowlandPercent}%`}
                    />
                    <div
                      className="bg-stone-500"
                      style={{ width: `${biomeDistribution.highlandPercent + biomeDistribution.mountainPercent}%` }}
                      title={`Highlands/Mountain: ${biomeDistribution.highlandPercent + biomeDistribution.mountainPercent}%`}
                    />
                    <div
                      className="bg-sky-200"
                      style={{ width: `${biomeDistribution.iceCapPercent}%` }}
                      title={`Polar Cryosphere: ${biomeDistribution.iceCapPercent}%`}
                    />
                  </div>
                </div>
              )}

              {/* Active Species Roster */}
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {speciesSummaries.length === 0 ? (
                  <div className="text-center py-3 text-gray-400 text-[11px]">
                    {isExtinct
                      ? 'Biosphere collapsed. Secondary abiogenesis in progress...'
                      : 'No living biomass detected.'}
                  </div>
                ) : (
                  speciesSummaries
                    .filter((s) => !s.isExtinct)
                    .map((species) => (
                      <div
                        key={species.id}
                        className="flex items-center justify-between rounded border border-white/5 bg-gray-900/50 px-2.5 py-1.5 text-[11px]"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: species.color }}
                          />
                          <span className="font-medium text-white truncate max-w-[120px]">
                            {species.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-right">
                          <span className="text-gray-400 text-[10px]">
                            {species.dominantTraits.thermalOptimum}°C
                          </span>
                          <span className="font-semibold text-emerald-400 font-mono">
                            {species.population.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))
                )}
              </div>

              {/* Intervention Controls */}
              <div className="flex gap-2 pt-1 border-t border-white/10">
                <button
                  onClick={onSparkBiogenesis ?? onSeedLife}
                  className={`flex-1 rounded px-2 py-1 text-[10px] font-semibold transition-colors shadow ${
                    isExtinct && prebioticState?.biogenesisReadiness
                      ? 'bg-amber-500 hover:bg-amber-400 text-black font-bold animate-pulse'
                      : 'bg-emerald-600/80 hover:bg-emerald-600 text-white'
                  }`}
                >
                  {isExtinct ? '⚡ Spark Resurgence' : '✦ Spark Life'}
                </button>
                <button
                  onClick={onTriggerStress}
                  className="flex-1 rounded bg-rose-600/80 hover:bg-rose-600 px-2 py-1 text-[10px] font-semibold text-white transition-colors shadow"
                  title="Apply selective pressure spike"
                >
                  ⚡ Radiation Pulse
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
