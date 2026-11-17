import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PlanetInspectHUD } from '../PlanetInspectHUD.js'

describe('PlanetInspectHUD', () => {
  it('renders planetary observatory header and total rotations', () => {
    render(
      <PlanetInspectHUD
        inspectData={null}
        planetName="Aethel Prime"
        surfaceTemperatureCelsius={18}
        axialTiltDeg={23.44}
        rotations={42}
      />
    )

    expect(screen.getByText('Aethel Prime')).toBeInTheDocument()
    expect(screen.getByText('18°C • Tilt 23.4°')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(
      screen.getByText('Hover over planet surface to inspect')
    ).toBeInTheDocument()
  })

  it('renders coordinate and biome information when inspectData is provided', () => {
    const mockData = {
      latLong: { latitude: 12.34, longitude: -56.78 },
      biome: 'ice_cap' as const,
      point: [0, 1, 0] as [number, number, number],
    }

    render(
      <PlanetInspectHUD
        inspectData={mockData}
        planetName="Cryos Beta"
        surfaceTemperatureCelsius={-15}
        axialTiltDeg={23.44}
        rotations={10}
      />
    )

    expect(screen.getByText('12.34°N, 56.78°W')).toBeInTheDocument()
    expect(screen.getByText('Polar Ice Cap')).toBeInTheDocument()
    expect(
      screen.getByText('Glacial cryosphere, low solar radiation')
    ).toBeInTheDocument()
  })

  it('correctly handles southern and eastern coordinates', () => {
    const mockData = {
      latLong: { latitude: -45.0, longitude: 120.5 },
      biome: 'shallow_ocean' as const,
      point: [1, 0, 0] as [number, number, number],
    }

    render(
      <PlanetInspectHUD
        inspectData={mockData}
        planetName="Thalassa IV"
        surfaceTemperatureCelsius={24}
        axialTiltDeg={12.0}
        rotations={5}
      />
    )

    expect(screen.getByText('45°S, 120.5°E')).toBeInTheDocument()
    expect(screen.getByText('Continental Shelf')).toBeInTheDocument()
  })
})
