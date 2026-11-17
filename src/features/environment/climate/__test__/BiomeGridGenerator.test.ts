import { describe, it, expect } from 'vitest'
import { BiomeGridGenerator } from '../BiomeGridGenerator.js'
import { GenesisEngine } from '../../../genesis/services/GenesisEngine.js'

describe('BiomeGridGenerator', () => {
  const planetConfig = GenesisEngine.generatePlanet({}, 42)

  it('generates 128 uniformly distributed cells on unit sphere', () => {
    const grid = BiomeGridGenerator.generateGrid(planetConfig, 128)
    expect(grid.length).toBe(128)

    for (const cell of grid) {
      const [x, y, z] = cell.center
      const radius = Math.sqrt(x * x + y * y + z * z)
      expect(radius).toBeCloseTo(1.0, 2)
    }
  })

  it('enforces latitudinal temperature gradient (equator is warmer than poles)', () => {
    const grid = BiomeGridGenerator.generateGrid(planetConfig, 128)

    // Find equatorial cells (|lat| < 10) and polar cells (|lat| > 75)
    const equatorialCells = grid.filter((c) => Math.abs(c.latitude) < 10)
    const polarCells = grid.filter((c) => Math.abs(c.latitude) > 75)

    expect(equatorialCells.length).toBeGreaterThan(0)
    expect(polarCells.length).toBeGreaterThan(0)

    const avgEquatorTemp =
      equatorialCells.reduce((acc, c) => acc + c.localTemperatureCelsius, 0) /
      equatorialCells.length

    const avgPolarTemp =
      polarCells.reduce((acc, c) => acc + c.localTemperatureCelsius, 0) /
      polarCells.length

    expect(avgEquatorTemp).toBeGreaterThan(avgPolarTemp)
  })

  it('computes valid biome distribution percentages summing to 100%', () => {
    const grid = BiomeGridGenerator.generateGrid(planetConfig, 128)
    const stats = BiomeGridGenerator.calculateDistributionStats(grid)

    const totalPercent =
      stats.deepOceanPercent +
      stats.shallowOceanPercent +
      stats.beachPercent +
      stats.lowlandPercent +
      stats.highlandPercent +
      stats.mountainPercent +
      stats.iceCapPercent

    expect(totalPercent).toBeGreaterThanOrEqual(98)
    expect(totalPercent).toBeLessThanOrEqual(102)
  })

  it('finds nearest cell accurately given a 3D coordinate', () => {
    const grid = BiomeGridGenerator.generateGrid(planetConfig, 128)
    const northPoleQuery: [number, number, number] = [0, 1, 0]

    const nearest = BiomeGridGenerator.findNearestCell(northPoleQuery, grid)
    expect(nearest).not.toBeNull()
    expect(nearest!.latitude).toBeGreaterThan(70)
  })

  it('builds an adjacency map connecting each cell to physically contiguous neighbors', () => {
    const grid = BiomeGridGenerator.generateGrid(planetConfig, 128)
    const adjacency = BiomeGridGenerator.buildAdjacencyMap(grid, 5)

    expect(adjacency.length).toBe(128)
    for (let i = 0; i < 128; i++) {
      const neighbors = adjacency[i]!
      expect(neighbors.length).toBe(5)
      // Cell should not be its own neighbor
      expect(neighbors.includes(i)).toBe(false)
    }
  })
})

