/**
 * RightEvolutionDrawer — Unified right-side drawer with tabs covering 1/3 of the screen.
 *
 * Consolidates the cluttered HUDs into 3 clean, accessible tabs:
 * 1. 'ecosystem': Macro-Eras, Protocells, Biosphere stats & biogenesis/catalyst controls
 * 2. 'species': Species tiered cards roster, kingdoms, trophic food web & anatomy
 * 3. 'biogeochemical': Atmospheric gas concentrations, crustal minerals & planetary cycles
 */

import type { SpeciesSummary } from '../genetics/types.js'
import type { BiomeDistributionStats } from '../../environment/climate/types.js'
import type { PrebioticState, ChemicalCatalystType } from '../abiogenesis/types.js'
import type { BiogeochemicalState } from '../../environment/biogeochemistry/types.js'
import { EcosystemHUD } from './EcosystemHUD.js'
import { SpeciesCardsDock } from './SpeciesCardsDock.js'
import { BiogeochemicalHUD } from '../../environment/components/BiogeochemicalHUD.js'
import { SoundFX } from '../../audio/SoundFXEngine.js'

export type EvolutionTabType = 'ecosystem' | 'species' | 'biogeochemical'

export interface RightEvolutionDrawerProps {
  isOpen: boolean
  activeTab: EvolutionTabType
  onClose: () => void
  onToggleTab: (tab: EvolutionTabType) => void

  // EcosystemHUD props
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

  // SpeciesCardsDock props
  selectedSpeciesId?: string | null
  onSelectSpecies?: (speciesId: string) => void

  // BiogeochemicalHUD props
  biogeochemical?: BiogeochemicalState
  rotations: number
  partialRotation?: number
}

export function RightEvolutionDrawer({
  isOpen,
  activeTab,
  onClose,
  onToggleTab,
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
  selectedSpeciesId,
  onSelectSpecies,
  biogeochemical,
  rotations,
  partialRotation = 0,
}: RightEvolutionDrawerProps) {
  const isPrebiotic = prebioticState?.stage === 'prebiotic'

  return (
    <>
      {/* Floating Vertical Tab Rail on the Right Edge */}
      <div
        data-testid="right-tab-rail"
        className="fixed right-4 top-36 z-30 flex flex-col gap-2 font-mono select-none pointer-events-auto items-end"
      >
        {/* Tab 1: Ecosystem & Macro-Eras */}
        <button
          onClick={() => {
            SoundFX.playClick()
            onToggleTab('ecosystem')
          }}
          className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold shadow-lg backdrop-blur-md transition-all ${
            isOpen && activeTab === 'ecosystem'
              ? 'bg-emerald-600/90 border-emerald-400 text-white shadow-emerald-500/25 ring-2 ring-emerald-500/30'
              : 'bg-gray-950/85 border-white/15 text-gray-300 hover:bg-white/10 hover:text-white'
          }`}
          title="Mở Bảng Kỷ Tiến Hóa & Hệ Sinh Thái"
        >
          <span className="text-sm">🌱</span>
          <span className="hidden sm:inline">Tiến Hóa & Kỷ</span>
          <span className="text-[10px] rounded-full px-1.5 py-0.2 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
            {isPrebiotic ? 'Kỷ II' : 'Kỷ III'}
          </span>
        </button>

        {/* Tab 2: Species & Food Chain */}
        <button
          onClick={() => {
            SoundFX.playClick()
            onToggleTab('species')
          }}
          className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold shadow-lg backdrop-blur-md transition-all ${
            isOpen && activeTab === 'species'
              ? 'bg-blue-600/90 border-blue-400 text-white shadow-blue-500/25 ring-2 ring-blue-500/30'
              : 'bg-gray-950/85 border-white/15 text-gray-300 hover:bg-white/10 hover:text-white'
          }`}
          title="Mở Danh Mục Loài & Chuỗi Thức Ăn"
        >
          <span className="text-sm">🐾</span>
          <span className="hidden sm:inline">Danh Mục Loài</span>
          <span className="text-[10px] rounded-full px-1.5 py-0.2 bg-blue-950/80 border border-blue-500/40 text-blue-300">
            {activeSpeciesCount}
          </span>
        </button>

        {/* Tab 3: Biogeochemical Cycles */}
        <button
          onClick={() => {
            SoundFX.playClick()
            onToggleTab('biogeochemical')
          }}
          className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold shadow-lg backdrop-blur-md transition-all ${
            isOpen && activeTab === 'biogeochemical'
              ? 'bg-cyan-600/90 border-cyan-400 text-white shadow-cyan-500/25 ring-2 ring-cyan-500/30'
              : 'bg-gray-950/85 border-white/15 text-gray-300 hover:bg-white/10 hover:text-white'
          }`}
          title="Mở Chu Trình Địa Hóa & Khí Quyển"
        >
          <span className="text-sm">⚗️</span>
          <span className="hidden sm:inline">Chu Trình Địa Hóa</span>
          <span className="text-[10px] rounded-full px-1.5 py-0.2 bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
            {biogeochemical?.atmospheric ? `${(biogeochemical.atmospheric.oxygen * 100).toFixed(0)}% O₂` : 'Cycles'}
          </span>
        </button>
      </div>

      {/* The 1/3-Screen Sliding Drawer from the Right */}
      <aside
        data-testid="right-evolution-drawer"
        aria-label="Thế giới Sinh quyển & Tiến hóa"
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] md:w-[480px] lg:w-[33.333vw] z-40 bg-gray-950/95 border-l border-white/15 shadow-2xl backdrop-blur-2xl flex flex-col font-mono select-none pointer-events-auto transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        }`}
      >
        {/* Drawer Header & Tab Switcher Bar */}
        <div className="flex flex-col border-b border-white/10 bg-black/40 p-3.5 gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                BẢNG TIẾN HÓA & SINH QUYỂN
              </h2>
            </div>
            <button
              onClick={() => {
                SoundFX.playClick()
                onClose()
              }}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-gray-400 hover:bg-white/10 hover:text-white transition-colors border border-white/10"
              title="Thu gọn bảng điều khiển (Đóng)"
            >
              <span>✕ Thu gọn</span>
            </button>
          </div>

          {/* 3 Tab Switcher Buttons */}
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-gray-900/80 p-1 border border-white/10 text-[11px]">
            <button
              onClick={() => {
                SoundFX.playClick()
                onToggleTab('ecosystem')
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'ecosystem'
                  ? 'bg-emerald-600 text-white font-semibold shadow'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>🌱</span>
              <span>Kỷ & Hệ sinh thái</span>
            </button>
            <button
              onClick={() => {
                SoundFX.playClick()
                onToggleTab('species')
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'species'
                  ? 'bg-blue-600 text-white font-semibold shadow'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>🐾</span>
              <span>Danh mục loài</span>
            </button>
            <button
              onClick={() => {
                SoundFX.playClick()
                onToggleTab('biogeochemical')
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'biogeochemical'
                  ? 'bg-cyan-600 text-white font-semibold shadow'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>⚗️</span>
              <span>Chu trình Địa hóa</span>
            </button>
          </div>
        </div>

        {/* Scrollable Drawer Content (1/3 screen) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {activeTab === 'ecosystem' && (
            <EcosystemHUD
              embedded={true}
              totalPopulation={totalPopulation}
              activeSpeciesCount={activeSpeciesCount}
              extinctSpeciesCount={extinctSpeciesCount}
              averageFitness={averageFitness}
              generation={generation}
              speciesSummaries={speciesSummaries}
              biomeDistribution={biomeDistribution}
              prebioticState={prebioticState}
              onSeedLife={onSeedLife}
              onTriggerStress={onTriggerStress}
              onSparkBiogenesis={onSparkBiogenesis}
              onCatalyzeChemistry={onCatalyzeChemistry}
            />
          )}

          {activeTab === 'species' && (
            <SpeciesCardsDock
              embedded={true}
              speciesSummaries={speciesSummaries}
              selectedSpeciesId={selectedSpeciesId}
              onSelectSpecies={onSelectSpecies}
            />
          )}

          {activeTab === 'biogeochemical' && (
            <BiogeochemicalHUD
              embedded={true}
              biogeochemical={biogeochemical}
              rotations={rotations}
              partialRotation={partialRotation}
            />
          )}
        </div>
      </aside>
    </>
  )
}
