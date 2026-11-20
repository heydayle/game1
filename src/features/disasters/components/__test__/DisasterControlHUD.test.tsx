import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DisasterControlHUD } from '../DisasterControlHUD.js'
import { DEFAULT_PERTURBATIONS } from '../../constants.js'
import type { ActiveDisasterSummary } from '../../types.js'

describe('DisasterControlHUD', () => {
  it('renders closed dock initially with Unleash Cataclysm button', () => {
    render(
      <DisasterControlHUD
        activeDisasters={[]}
        perturbations={DEFAULT_PERTURBATIONS}
        onTriggerDisaster={vi.fn()}
      />
    )

    expect(screen.getByText('Unleash Cataclysm')).toBeInTheDocument()
    expect(screen.queryByText('Asteroid')).not.toBeInTheDocument()
  })

  it('expands dock on click and triggers disaster on button selection', () => {
    const handleTrigger = vi.fn()
    render(
      <DisasterControlHUD
        activeDisasters={[]}
        perturbations={DEFAULT_PERTURBATIONS}
        onTriggerDisaster={handleTrigger}
      />
    )

    // Expand
    fireEvent.click(screen.getByText('Unleash Cataclysm'))
    expect(screen.getByText('Asteroid')).toBeInTheDocument()
    expect(screen.getByText('Global')).toBeInTheDocument() // Ice Age

    // Trigger Asteroid
    fireEvent.click(screen.getByText('Asteroid'))
    expect(handleTrigger).toHaveBeenCalledWith('asteroid_impact', 0.8)
  })

  it('displays active disaster alert banner with countdown and perturbation metrics', () => {
    const mockDisaster: ActiveDisasterSummary = {
      id: 'dis_1',
      type: 'ice_age',
      name: 'Global Glaciation',
      severity: 0.85,
      progress: 0.7,
      remainingRotations: 21,
      durationRotations: 30,
      description: 'Test ice age description',
    }

    render(
      <DisasterControlHUD
        activeDisasters={[mockDisaster]}
        perturbations={{
          ...DEFAULT_PERTURBATIONS,
          temperatureDeltaCelsius: -22,
          atmosphericDust: 0.15,
        }}
        onTriggerDisaster={vi.fn()}
      />
    )

    expect(screen.getByText('Global Glaciation')).toBeInTheDocument()
    expect(screen.getByText('21 rot remaining')).toBeInTheDocument()
    expect(screen.getByText('ΔT: -22°C')).toBeInTheDocument()
    expect(screen.getByText('Dust: 15%')).toBeInTheDocument()
  })

  it('renders auto-disasters toggle and triggers onToggleAutoDisasters callback', () => {
    const handleToggle = vi.fn()
    render(
      <DisasterControlHUD
        activeDisasters={[]}
        perturbations={DEFAULT_PERTURBATIONS}
        onTriggerDisaster={vi.fn()}
        autoDisastersEnabled={true}
        onToggleAutoDisasters={handleToggle}
      />
    )

    // Expand drawer
    fireEvent.click(screen.getByText('Unleash Cataclysm'))
    expect(screen.getByText('Thiên tai tự nhiên')).toBeInTheDocument()
    expect(screen.getByTestId('toggle-auto-disasters')).toHaveTextContent('● Đang BẬT')

    // Click toggle
    fireEvent.click(screen.getByTestId('toggle-auto-disasters'))
    expect(handleToggle).toHaveBeenCalledWith(false)
  })
})

