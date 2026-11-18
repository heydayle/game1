import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EcosystemHUD } from '../EcosystemHUD.js'
import type { SpeciesSummary } from '../../genetics/types.js'

describe('EcosystemHUD', () => {
  const mockSpecies: SpeciesSummary[] = [
    {
      id: 'sp_1',
      name: 'Progenitor Alpha',
      color: '#10b981',
      population: 48,
      generation: 3,
      averageFitness: 0.88,
      dominantTraits: {
        thermalOptimum: 18,
        waterConservation: 0.65,
        resilience: 0.7,
      },
      isExtinct: false,
    },
  ]

  it('renders total population, species count, and fitness percentage', () => {
    render(
      <EcosystemHUD
        totalPopulation={48}
        activeSpeciesCount={1}
        extinctSpeciesCount={0}
        averageFitness={0.88}
        generation={3}
        speciesSummaries={mockSpecies}
      />
    )

    expect(screen.getByText('Biosphere Monitor')).toBeInTheDocument()
    expect(screen.getAllByText('48').length).toBe(2)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('88%')).toBeInTheDocument()
    expect(screen.getByText('Progenitor Alpha')).toBeInTheDocument()
  })

  it('triggers onSeedLife / onSparkBiogenesis callback when button is clicked', () => {
    const handleSeed = vi.fn()
    render(
      <EcosystemHUD
        totalPopulation={0}
        activeSpeciesCount={0}
        extinctSpeciesCount={0}
        averageFitness={0}
        generation={0}
        speciesSummaries={[]}
        onSeedLife={handleSeed}
      />
    )

    const seedBtn = screen.getByText('✦ Spark Life')
    fireEvent.click(seedBtn)
    expect(handleSeed).toHaveBeenCalledTimes(1)
  })

  it('renders prebiotic chemical soup gauges and triggers biogenesis', () => {
    const handleBiogenesis = vi.fn()
    const handleCatalyze = vi.fn()
    render(
      <EcosystemHUD
        totalPopulation={0}
        activeSpeciesCount={0}
        extinctSpeciesCount={0}
        averageFitness={0}
        generation={0}
        speciesSummaries={[]}
        prebioticState={{
          stage: 'prebiotic',
          macroEra: 'prebiological_evolution',
          macroEraLabel: 'Kỷ II: Tiến Hóa Tiền Sinh Học (Nguyên bào / Tế bào sơ khai)',
          protocellForm: 'lipid_coacervate',
          protocellFormLabel: 'Nguyên bào Màng Lipid Coacervate',
          protocellComplexity: 0.45,
          protoMetabolismRate: 0.5,
          chemicalFertility: 0.72,
          organicComplexity: 0.45,
          waterViability: 0.85,
          organicAbundance: 0.65,
          catalystEnergy: 0.55,
          biogenesisReadiness: true,
          chemicalLineageArchetype: 'Chemoarchaeon Primus',
          statusDescription: 'Amino acids synthesized in hydrothermal vents.',
          chemicalPhase: 'polymer_formation',
          chemicalPhaseLabel: 'Nấc II: Hình thành Polyme & RNA World',
          monomerConcentration: 0.6,
          polymerComplexity: 0.45,
          protocellStability: 0.3,
          organicPoolVolume: 0.5,
          bioticFeedbackFlux: 0.0,
          deNovoSynthesisReady: false,
        }}
        onSparkBiogenesis={handleBiogenesis}
        onCatalyzeChemistry={handleCatalyze}
      />
    )

    expect(screen.getByText('🧪 Primordial Chemical Soup')).toBeInTheDocument()
    expect(screen.getByText('Chemoarchaeon Primus')).toBeInTheDocument()
    expect(screen.getByText('85%')).toBeInTheDocument() // Solvent
    expect(screen.getAllByText('45%').length).toBeGreaterThanOrEqual(1) // Complexity
    expect(screen.getByText('Nấc II: Hình thành Polyme & RNA World')).toBeInTheDocument()

    const sparkCatalystBtn = screen.getByText('⚡ Xúc tác Miller-Urey')
    fireEvent.click(sparkCatalystBtn)
    expect(handleCatalyze).toHaveBeenCalledWith('spark')

    const sparkBtn = screen.getByText('⚡ Spark Biogenesis')
    fireEvent.click(sparkBtn)
    expect(handleBiogenesis).toHaveBeenCalledTimes(1)
  })

  it('renders parallel chemical evolution flux and de novo synthesis button during inhabited era', () => {
    const handleDeNovo = vi.fn()
    const handleCatalyze = vi.fn()
    render(
      <EcosystemHUD
        totalPopulation={120}
        activeSpeciesCount={2}
        extinctSpeciesCount={0}
        averageFitness={0.8}
        generation={5}
        speciesSummaries={mockSpecies}
        prebioticState={{
          stage: 'inhabited',
          macroEra: 'biological_evolution',
          macroEraLabel: 'Kỷ III: Tiến Hóa Sinh Học (Rẽ nhánh phi Trái Đất)',
          protocellForm: 'iron_sulfur_bubble',
          protocellFormLabel: 'Nguyên bào Bọt Sắt-Lưu huỳnh',
          protocellComplexity: 0.9,
          protoMetabolismRate: 0.85,
          chemicalFertility: 0.8,
          organicComplexity: 0.95,
          waterViability: 0.9,
          organicAbundance: 0.85,
          catalystEnergy: 0.75,
          biogenesisReadiness: true,
          chemicalLineageArchetype: 'Chemoarchaeon Primus',
          statusDescription: 'Biosphere flourishing.',
          chemicalPhase: 'biogeochemical_flux',
          chemicalPhaseLabel: 'Nấc V: Tuần hoàn Hóa sinh quyển Đồng Tiến hóa',
          monomerConcentration: 0.8,
          polymerComplexity: 0.85,
          protocellStability: 0.9,
          organicPoolVolume: 0.92,
          bioticFeedbackFlux: 0.65,
          deNovoSynthesisReady: true,
        }}
        onSparkBiogenesis={handleDeNovo}
        onCatalyzeChemistry={handleCatalyze}
      />
    )

    expect(screen.getByText('⚗️ Tiến Hóa Hóa Học Song Song')).toBeInTheDocument()
    expect(
      screen.getByText(/Nấc V: Tuần hoàn Hóa sinh quyển Đồng Tiến hóa/)
    ).toBeInTheDocument()

    const ventBtn = screen.getByText('🌋 Vent Catalyst')
    fireEvent.click(ventBtn)
    expect(handleCatalyze).toHaveBeenCalledWith('vent')

    const deNovoBtn = screen.getByText('🌱 Khởi Sinh Dòng Vi Sinh Mới (De Novo)')
    fireEvent.click(deNovoBtn)
    expect(handleDeNovo).toHaveBeenCalledTimes(1)
  })

  it('formats large populations using k, m, and infinity symbol ∞ in HUD', () => {
    const hugeSpecies: SpeciesSummary[] = [
      {
        id: 'sp_mega',
        name: 'Mega Strain',
        color: '#06b6d4',
        population: 15_000,
        generation: 4,
        averageFitness: 0.9,
        dominantTraits: {
          thermalOptimum: 20,
          waterConservation: 0.5,
          resilience: 0.5,
        },
        isExtinct: false,
      },
    ]

    render(
      <EcosystemHUD
        totalPopulation={1_200_000_000}
        activeSpeciesCount={1}
        extinctSpeciesCount={0}
        averageFitness={0.9}
        generation={4}
        speciesSummaries={hugeSpecies}
      />
    )

    // Total population >= 1 billion should be formatted as '∞'
    expect(screen.getByText('∞')).toBeInTheDocument()
    // Species with 15,000 population should be formatted as '15k'
    expect(screen.getByText('15k')).toBeInTheDocument()
  })
})
