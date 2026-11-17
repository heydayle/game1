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
          chemicalFertility: 0.72,
          organicComplexity: 0.45,
          waterViability: 0.85,
          organicAbundance: 0.65,
          catalystEnergy: 0.55,
          biogenesisReadiness: true,
          chemicalLineageArchetype: 'Chemoarchaeon Primus',
          statusDescription: 'Amino acids synthesized in hydrothermal vents.',
        }}
        onSparkBiogenesis={handleBiogenesis}
      />
    )

    expect(screen.getByText('🧪 Primordial Chemical Soup')).toBeInTheDocument()
    expect(screen.getByText('Chemoarchaeon Primus')).toBeInTheDocument()
    expect(screen.getByText('85%')).toBeInTheDocument() // Solvent
    expect(screen.getByText('45%')).toBeInTheDocument() // Complexity
    const sparkBtn = screen.getByText('⚡ Spark Biogenesis')
    fireEvent.click(sparkBtn)
    expect(handleBiogenesis).toHaveBeenCalledTimes(1)
  })
})
