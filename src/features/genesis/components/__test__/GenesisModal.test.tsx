import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GenesisModal } from '../GenesisModal.js'
import { usePlanetStore } from '../../../../stores/planet-store.js'

describe('GenesisModal', () => {
  beforeEach(() => {
    usePlanetStore.setState({
      isGenesisModalOpen: true,
    })
  })

  it('renders question and choices when open', () => {
    render(<GenesisModal />)

    expect(screen.getByText('Genesis Protocol')).toBeInTheDocument()
    expect(screen.getByText(/The Primordial Spark/i)).toBeInTheDocument()
    expect(screen.getByText('Volcanic Crucible')).toBeInTheDocument()
    expect(screen.getByText('Crystalline Equilibrium')).toBeInTheDocument()
  })

  it('navigates through questions and reaches the dossier preview', () => {
    render(<GenesisModal />)

    // Step through 9 questions
    for (let i = 0; i < 9; i++) {
      const nextBtn = screen.getByText('Next Question')
      fireEvent.click(nextBtn)
    }

    // On Question 10, button becomes "Review Dossier"
    const reviewBtn = screen.getByText('Review Dossier')
    expect(reviewBtn).toBeInTheDocument()

    // Click Review Dossier
    fireEvent.click(reviewBtn)

    // Dossier view should be active
    expect(screen.getByText('Planetary Dossier')).toBeInTheDocument()
    expect(screen.getByText('Cosmic Seed')).toBeInTheDocument()
    expect(screen.getByText('Awaken Planet')).toBeInTheDocument()
  })

  it('commits genesis and closes modal when Awaken Planet is clicked', () => {
    render(<GenesisModal />)

    // Fast-forward to dossier
    for (let i = 0; i < 9; i++) {
      fireEvent.click(screen.getByText('Next Question'))
    }
    fireEvent.click(screen.getByText('Review Dossier'))

    const awakenBtn = screen.getByText('Awaken Planet')
    fireEvent.click(awakenBtn)

    // Modal state in store should now be closed
    expect(usePlanetStore.getState().isGenesisModalOpen).toBe(false)
  })
})

