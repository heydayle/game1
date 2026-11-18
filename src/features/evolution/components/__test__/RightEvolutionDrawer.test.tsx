import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RightEvolutionDrawer } from '../RightEvolutionDrawer.js'
import type { SpeciesSummary } from '../../genetics/types.js'

describe('RightEvolutionDrawer', () => {
  const mockSpecies: SpeciesSummary[] = [
    {
      id: 'sp_1',
      name: 'Loài Thử Nghiệm Alpha',
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

  it('renders floating tab rail with 3 tabs on the right', () => {
    render(
      <RightEvolutionDrawer
        isOpen={false}
        activeTab="ecosystem"
        onClose={vi.fn()}
        onToggleTab={vi.fn()}
        totalPopulation={48}
        activeSpeciesCount={1}
        extinctSpeciesCount={0}
        averageFitness={0.88}
        generation={3}
        speciesSummaries={mockSpecies}
        rotations={10}
      />
    )

    expect(screen.getByTestId('right-tab-rail')).toBeInTheDocument()
    expect(screen.getByText('Tiến Hóa & Kỷ')).toBeInTheDocument()
    expect(screen.getByText('Danh Mục Loài')).toBeInTheDocument()
    expect(screen.getByText('Chu Trình Địa Hóa')).toBeInTheDocument()
  })

  it('triggers onToggleTab when a tab button on the rail is clicked', () => {
    const handleToggle = vi.fn()
    render(
      <RightEvolutionDrawer
        isOpen={false}
        activeTab="ecosystem"
        onClose={vi.fn()}
        onToggleTab={handleToggle}
        totalPopulation={48}
        activeSpeciesCount={1}
        extinctSpeciesCount={0}
        averageFitness={0.88}
        generation={3}
        speciesSummaries={mockSpecies}
        rotations={10}
      />
    )

    const speciesTabBtn = screen.getByText('Danh Mục Loài')
    fireEvent.click(speciesTabBtn)
    expect(handleToggle).toHaveBeenCalledWith('species')
  })

  it('opens sliding drawer and displays ecosystem content when open with ecosystem tab', () => {
    render(
      <RightEvolutionDrawer
        isOpen={true}
        activeTab="ecosystem"
        onClose={vi.fn()}
        onToggleTab={vi.fn()}
        totalPopulation={48}
        activeSpeciesCount={1}
        extinctSpeciesCount={0}
        averageFitness={0.88}
        generation={3}
        speciesSummaries={mockSpecies}
        rotations={10}
      />
    )

    expect(screen.getByTestId('right-evolution-drawer')).toHaveClass('translate-x-0')
    expect(screen.getByText('BẢNG TIẾN HÓA & SINH QUYỂN')).toBeInTheDocument()
    expect(screen.getByText('Biosphere Monitor')).toBeInTheDocument()
  })

  it('calls onClose when clicking close button inside drawer', () => {
    const handleClose = vi.fn()
    render(
      <RightEvolutionDrawer
        isOpen={true}
        activeTab="ecosystem"
        onClose={handleClose}
        onToggleTab={vi.fn()}
        totalPopulation={48}
        activeSpeciesCount={1}
        extinctSpeciesCount={0}
        averageFitness={0.88}
        generation={3}
        speciesSummaries={mockSpecies}
        rotations={10}
      />
    )

    const closeBtn = screen.getByText('✕ Thu gọn')
    fireEvent.click(closeBtn)
    expect(handleClose).toHaveBeenCalledTimes(1)
  })
})

