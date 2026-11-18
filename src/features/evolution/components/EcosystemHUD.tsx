import { useState } from 'react'
import type { SpeciesSummary } from '../genetics/types.js'
import type { BiomeDistributionStats } from '../../environment/climate/types.js'
import type { PrebioticState, ChemicalCatalystType } from '../abiogenesis/types.js'
import { formatPopulation } from '../../../shared/utils/formatters.js'

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
  onCatalyzeChemistry?: (type: ChemicalCatalystType) => void
  embedded?: boolean
  className?: string
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
  onCatalyzeChemistry,
  embedded = false,
  className,
}: EcosystemHUDProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showChemicalFlux, setShowChemicalFlux] = useState(true)

  const isPrebiotic = prebioticState?.stage === 'prebiotic'
  const isExtinct = prebioticState?.stage === 'extinct' && totalPopulation === 0

  const chemicalPhaseLabel =
    prebioticState?.chemicalPhaseLabel ??
    (isPrebiotic ? 'Nấc I: Tổng hợp Monomer Vô cơ' : 'Nấc V: Tuần hoàn Hóa sinh quyển')
  const monomerConc = prebioticState?.monomerConcentration ?? 0
  const polymerComp = prebioticState?.polymerComplexity ?? 0
  const protocellStab = prebioticState?.protocellStability ?? 0
  const organicPool = prebioticState?.organicPoolVolume ?? 0
  const bioticFlux = prebioticState?.bioticFeedbackFlux ?? 0
  const deNovoReady = prebioticState?.deNovoSynthesisReady ?? false

  const containerClass = embedded
    ? (className ?? 'w-full rounded-xl border border-white/10 bg-gray-950/80 p-3.5 font-mono text-xs shadow-xl backdrop-blur-md')
    : 'fixed bottom-4 right-4 z-10 w-88 rounded-lg border border-white/10 bg-gray-950/85 p-3.5 font-mono text-xs shadow-xl backdrop-blur-md'

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block h-2 w-2 rounded-full animate-pulse ${
              isPrebiotic
                ? 'bg-amber-400'
                : isExtinct
                  ? prebioticState?.biogenesisReadiness
                    ? 'bg-amber-400'
                    : 'bg-rose-500'
                  : 'bg-emerald-400'
            }`}
          />
          <span
            className={`text-[10px] tracking-wider font-semibold uppercase ${
              isPrebiotic
                ? 'text-amber-400'
                : isExtinct
                  ? prebioticState?.biogenesisReadiness
                    ? 'text-amber-400'
                    : 'text-rose-400'
                  : 'text-emerald-400'
            }`}
          >
            {isPrebiotic
              ? '🧪 Primordial Chemical Soup'
              : isExtinct
                ? prebioticState?.biogenesisReadiness
                  ? '🌱 Biosphere Resurgence'
                  : '☠ Biosphere Extinction'
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
          {/* Grand 3 Macro-Evolution Eras Progression */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[9px] text-gray-400 font-semibold uppercase tracking-wider">
              <span>Chuỗi Kỷ Nguyên Tiến Hóa:</span>
              <span className="text-amber-300 font-bold">
                {prebioticState?.macroEraLabel ?? 'Kỷ I: Tiến Hóa Hóa Học'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1 text-center text-[8px] font-mono">
              <div
                className={`rounded py-0.5 px-1 border transition-all ${
                  prebioticState?.macroEra === 'chemical_evolution'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400 font-bold shadow'
                    : 'bg-gray-900/40 text-gray-400 border-white/5'
                }`}
              >
                I. Hóa Học
              </div>
              <div
                className={`rounded py-0.5 px-1 border transition-all ${
                  prebioticState?.macroEra === 'prebiological_evolution'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 font-bold shadow animate-pulse'
                    : 'bg-gray-900/40 text-gray-400 border-white/5'
                }`}
              >
                II. Tiền Sinh Học
              </div>
              <div
                className={`rounded py-0.5 px-1 border transition-all ${
                  prebioticState?.macroEra === 'biological_evolution'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 font-bold shadow'
                    : 'bg-gray-900/40 text-gray-400 border-white/5'
                }`}
              >
                III. Sinh Học
              </div>
            </div>
          </div>

          {/* Protocell Architecture Card */}
          <div className="rounded border border-cyan-500/25 bg-cyan-950/20 p-2 space-y-1 text-[10px]">
            <div className="flex items-center justify-between text-cyan-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <span>🫧</span>
                <span>{prebioticState?.protocellFormLabel ?? 'Nguyên bào Màng Lipid'}</span>
              </span>
              <span className="font-mono text-cyan-400">
                {((prebioticState?.protocellComplexity ?? 0) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center justify-between text-[9px] text-gray-400">
              <span>Chuyển hóa tiền enzyme:</span>
              <span className="text-amber-300 font-mono">
                {((prebioticState?.protoMetabolismRate ?? 0) * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Chemical Evolution Phase Badge */}
          <div className="flex items-center justify-between bg-amber-950/30 border border-amber-500/20 px-2 py-1 rounded">
            <span className="text-[9px] text-amber-300 font-semibold uppercase tracking-wider">
              {chemicalPhaseLabel}
            </span>
            <span className="text-[9px] text-gray-400">
              {((prebioticState?.organicComplexity ?? 0) * 100).toFixed(0)}%
            </span>
          </div>

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

          {/* 3 Step Chemical Evolution Progress Bars */}
          <div className="space-y-1.5 rounded border border-white/5 bg-gray-900/50 p-2 text-[10px]">
            <div className="flex justify-between items-center text-gray-300">
              <span>Monomers (Axit amin/Base):</span>
              <span className="text-cyan-300 font-mono">{(monomerConc * 100).toFixed(0)}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-950">
              <div
                className="h-full bg-cyan-400 transition-all duration-300"
                style={{ width: `${Math.max(3, monomerConc * 100)}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-gray-300 pt-0.5">
              <span>Polymers (Chuỗi RNA/Peptide):</span>
              <span className="text-emerald-300 font-mono">{(polymerComp * 100).toFixed(0)}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-950">
              <div
                className="h-full bg-emerald-400 transition-all duration-300"
                style={{ width: `${Math.max(3, polymerComp * 100)}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-gray-300 pt-0.5">
              <span>Protocells (Màng & Coacervates):</span>
              <span className="text-amber-300 font-mono">{(protocellStab * 100).toFixed(0)}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-950">
              <div
                className="h-full bg-amber-400 transition-all duration-300"
                style={{ width: `${Math.max(3, protocellStab * 100)}%` }}
              />
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

          {/* Interactive Chemical Catalysts */}
          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            <button
              onClick={() => onCatalyzeChemistry?.('spark')}
              className="rounded bg-sky-950/80 hover:bg-sky-900 border border-sky-500/30 px-2 py-1 text-[10px] text-sky-200 transition-all shadow-sm"
              title="Phóng tia sét khí quyển Miller-Urey để tổng hợp monomer hữu cơ"
            >
              ⚡ Xúc tác Miller-Urey
            </button>
            <button
              onClick={() => onCatalyzeChemistry?.('vent')}
              className="rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-500/30 px-2 py-1 text-[10px] text-amber-200 transition-all shadow-sm"
              title="Phun nhiệt địa chất đáy biển xúc tác hình thành polyme & màng lipid"
            >
              🌋 Miệng Phun Nhiệt
            </button>
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
              <span className="text-sm font-bold text-white font-mono">
                {formatPopulation(totalPopulation)}
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

          {/* Continuous Parallel Chemical Evolution Flux Sub-Panel */}
          {!isExtinct && (
            <div className="mt-2.5 rounded border border-cyan-500/30 bg-cyan-950/20 p-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-cyan-300 flex items-center gap-1.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  ⚗️ Tiến Hóa Hóa Học Song Song
                </span>
                <button
                  onClick={() => setShowChemicalFlux((p) => !p)}
                  className="text-[9px] text-gray-400 hover:text-white"
                >
                  {showChemicalFlux ? '▲' : '▼'}
                </button>
              </div>

              {showChemicalFlux && (
                <>
                  <div className="flex items-center justify-between text-[9px] text-cyan-300 font-mono">
                    <span>{prebioticState?.macroEraLabel ?? 'Kỷ III: Tiến Hóa Sinh Học'}</span>
                    <span className="text-emerald-400 font-semibold">Rẽ nhánh phi Trái Đất</span>
                  </div>
                  <div className="text-[9px] text-gray-400 font-mono">
                    {chemicalPhaseLabel} • {prebioticState?.protocellFormLabel ?? 'Nguyên bào sơ khai'}
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 pt-0.5 text-center">
                    <div className="rounded bg-black/40 p-1 border border-white/5">
                      <span className="text-[8px] text-gray-400 uppercase block">Monomer</span>
                      <span className="text-[10px] font-bold text-cyan-300">
                        {(monomerConc * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="rounded bg-black/40 p-1 border border-white/5">
                      <span className="text-[8px] text-gray-400 uppercase block">Hồ Hữu Cơ</span>
                      <span className="text-[10px] font-bold text-emerald-300">
                        {(organicPool * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="rounded bg-black/40 p-1 border border-white/5">
                      <span className="text-[8px] text-gray-400 uppercase block">Biotic Flux</span>
                      <span className="text-[10px] font-bold text-amber-300">
                        {(bioticFlux * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Catalyst Controls in Living World */}
                  <div className="grid grid-cols-2 gap-1 pt-1">
                    <button
                      onClick={() => onCatalyzeChemistry?.('spark')}
                      className="rounded bg-sky-950/80 hover:bg-sky-900 border border-sky-500/30 px-1.5 py-1 text-[9px] text-sky-200 transition-colors"
                      title="Phóng điện khí quyển kích hoạt xúc tác hóa học"
                    >
                      ⚡ Miller-Urey Spark
                    </button>
                    <button
                      onClick={() => onCatalyzeChemistry?.('vent')}
                      className="rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-500/30 px-1.5 py-1 text-[9px] text-amber-200 transition-colors"
                      title="Phun nhiệt đáy biển kích thích màng lipid"
                    >
                      🌋 Vent Catalyst
                    </button>
                  </div>

                  {/* De Novo Genesis Alert & Trigger */}
                  {deNovoReady && (
                    <div className="pt-1">
                      <button
                        onClick={onSparkBiogenesis}
                        className="w-full rounded bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-bold px-2 py-1 text-[10px] shadow animate-pulse"
                        title="Hồ hữu cơ siêu bão hòa! Kích hoạt để khởi sinh dòng vi sinh mới trực tiếp từ hóa chất!"
                      >
                        🌱 Khởi Sinh Dòng Vi Sinh Mới (De Novo)
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

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

              {/* Chemical Catalysts for Extinction Resurgence */}
              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <button
                  onClick={() => onCatalyzeChemistry?.('spark')}
                  className="rounded bg-sky-950/80 hover:bg-sky-900 border border-sky-500/30 px-1.5 py-0.5 text-[9px] text-sky-200 transition-colors"
                >
                  ⚡ Tia Chớp Tái Sinh
                </button>
                <button
                  onClick={() => onCatalyzeChemistry?.('vent')}
                  className="rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-500/30 px-1.5 py-0.5 text-[9px] text-amber-200 transition-colors"
                >
                  🌋 Miệng Phun Tái Sinh
                </button>
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
                <span>
                  Generation: <strong className="text-white">Gen-{generation}</strong>
                </span>
                <span>
                  Extinctions: <strong className="text-rose-400">{extinctSpeciesCount}</strong>
                </span>
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
                      style={{
                        width: `${
                          biomeDistribution.highlandPercent + biomeDistribution.mountainPercent
                        }%`,
                      }}
                      title={`Highlands/Mountain: ${
                        biomeDistribution.highlandPercent + biomeDistribution.mountainPercent
                      }%`}
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
                        <div className="flex items-center gap-1.5 truncate max-w-[140px]">
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: species.color }}
                          />
                          <span className="font-medium text-white truncate">
                            {species.name}
                          </span>
                          {species.tierLabel && (
                            <span className="text-[9px] text-cyan-300 font-mono">
                              • {species.tierLabel}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-right">
                          <span className="text-gray-400 text-[10px]">
                            {species.dominantTraits.thermalOptimum}°C
                          </span>
                          <span className="font-semibold text-emerald-400 font-mono">
                            {formatPopulation(species.population)}
                          </span>
                        </div>
                      </div>
                    ))
                )}
              </div>

              {/* Cosmic Speculative Evolution Philosophy Note */}
              <div className="rounded bg-indigo-950/30 border border-indigo-500/20 px-2 py-1 text-[9px] text-indigo-300 flex items-center gap-1.5">
                <span>🌌</span>
                <span>Tiến hóa vũ trụ rẽ nhánh tự do theo điều kiện hành tinh.</span>
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
