import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SimulationControlsCenterHUD } from '../SimulationControlsCenterHUD.js'

describe('SimulationControlsCenterHUD', () => {
  it('renders rotation count and speed buttons in unified center hud', () => {
    render(
      <SimulationControlsCenterHUD
        rotations={1420}
        partialRotation={0.55}
        speed={10}
        status="running"
        onStart={vi.fn()}
        onPause={vi.fn()}
        onSetSpeed={vi.fn()}
      />
    )

    expect(screen.getByTestId('simulation-controls-center-hud')).toBeInTheDocument()
    expect(screen.getByText('Vòng quay')).toBeInTheDocument()
    expect(screen.getByText('1,420.55')).toBeInTheDocument()
    expect(screen.getByText('⏸ Tạm dừng')).toBeInTheDocument()
    expect(screen.getByText('1x')).toBeInTheDocument()
    expect(screen.getByText('10x')).toBeInTheDocument()
    expect(screen.getByText('100x')).toBeInTheDocument()
    expect(screen.getByText('1000x')).toBeInTheDocument()
  })

  it('triggers onPause when running and clicking pause button', () => {
    const handlePause = vi.fn()
    render(
      <SimulationControlsCenterHUD
        rotations={50}
        speed={1}
        status="running"
        onStart={vi.fn()}
        onPause={handlePause}
        onSetSpeed={vi.fn()}
      />
    )

    const pauseBtn = screen.getByText('⏸ Tạm dừng')
    fireEvent.click(pauseBtn)
    expect(handlePause).toHaveBeenCalledTimes(1)
  })

  it('triggers onStart when paused and clicking start button', () => {
    const handleStart = vi.fn()
    render(
      <SimulationControlsCenterHUD
        rotations={50}
        speed={1}
        status="paused"
        onStart={handleStart}
        onPause={vi.fn()}
        onSetSpeed={vi.fn()}
      />
    )

    const startBtn = screen.getByText('▶ Bắt đầu')
    fireEvent.click(startBtn)
    expect(handleStart).toHaveBeenCalledTimes(1)
  })

  it('triggers onSetSpeed when speed button is clicked', () => {
    const handleSetSpeed = vi.fn()
    render(
      <SimulationControlsCenterHUD
        rotations={50}
        speed={1}
        status="running"
        onStart={vi.fn()}
        onPause={vi.fn()}
        onSetSpeed={handleSetSpeed}
      />
    )

    const speed100Btn = screen.getByText('100x')
    fireEvent.click(speed100Btn)
    expect(handleSetSpeed).toHaveBeenCalledWith(100)
  })
})

