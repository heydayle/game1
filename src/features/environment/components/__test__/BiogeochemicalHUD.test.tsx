import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BiogeochemicalHUD } from '../BiogeochemicalHUD.js'
import { DEFAULT_BIOGEOCHEMICAL_STATE } from '../../biogeochemistry/types.js'

describe('BiogeochemicalHUD', () => {
  it('renders atmospheric gas percentages and dominant regime badge', () => {
    render(
      <BiogeochemicalHUD
        biogeochemical={DEFAULT_BIOGEOCHEMICAL_STATE}
        rotations={42}
        partialRotation={0.35}
      />
    )

    expect(screen.getByText('Biogeochemical Cycle')).toBeInTheDocument()
    expect(screen.getByText('Primordial Anoxic')).toBeInTheDocument()
    expect(screen.getByText('Nitrogen (N₂)')).toBeInTheDocument()
    expect(screen.getByText('Oxygen (O₂)')).toBeInTheDocument()
    expect(screen.getByText(/78\.08/)).toBeInTheDocument()
    expect(screen.getByText(/0\.10/)).toBeInTheDocument()
  })

  it('switches tabs to display crustal elemental composition', () => {
    render(
      <BiogeochemicalHUD
        biogeochemical={DEFAULT_BIOGEOCHEMICAL_STATE}
        rotations={100}
        partialRotation={0.5}
      />
    )

    // Switch to Elemental tab
    const elemTabBtn = screen.getByText('Crust & Elements')
    fireEvent.click(elemTabBtn)

    expect(screen.getByText('Crustal Core Distribution')).toBeInTheDocument()
    expect(screen.getByText('Silicates/Rock')).toBeInTheDocument()
    expect(screen.getByText('Iron/Metals')).toBeInTheDocument()
    expect(screen.getByText('C-Organics')).toBeInTheDocument()
    expect(screen.getByText(/48\.2/)).toBeInTheDocument()
  })

  it('toggles collapse and expand when header button is clicked', () => {
    render(
      <BiogeochemicalHUD
        biogeochemical={DEFAULT_BIOGEOCHEMICAL_STATE}
        rotations={10}
      />
    )

    expect(screen.getByText('Atmosphere (100%)')).toBeInTheDocument()

    // Collapse
    const toggleBtn = screen.getByText('Hide ▲')
    fireEvent.click(toggleBtn)

    expect(screen.queryByText('Atmosphere (100%)')).not.toBeInTheDocument()
    expect(screen.getByText('Show ▼')).toBeInTheDocument()

    // Expand again
    fireEvent.click(screen.getByText('Show ▼'))
    expect(screen.getByText('Atmosphere (100%)')).toBeInTheDocument()
  })
})
