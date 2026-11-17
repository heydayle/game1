import { cartesianToLatLong, classifyBiome, type BiomeType } from '../../planet/utils/planet-math.js'
import type { PlanetConfig } from '../../genesis/types/genesis.js'
import { SeededRNG } from '../../../shared/utils/seeded-rng.js'
import type { BiomeCell, BiomeDistributionStats } from './types.js'

export const DEFAULT_CELL_COUNT = 128

export class BiomeGridGenerator {
  /**
   * Generates a Fibonacci lattice of cells distributed uniformly across the planetary sphere.
   */
  static generateGrid(
    planetConfig: PlanetConfig,
    cellCount = DEFAULT_CELL_COUNT,
    temperatureDelta = 0,
    oceanLevelDelta = 0
  ): BiomeCell[] {
    const rng = new SeededRNG(planetConfig.seed + 101)
    const cells: BiomeCell[] = []
    const goldenRatio = (1 + Math.sqrt(5)) / 2

    const effectiveSurfaceTemp = planetConfig.surfaceTemperatureCelsius + temperatureDelta
    const effectiveOceanLevel = Math.max(
      0.05,
      Math.min(0.95, planetConfig.oceanLevel + oceanLevelDelta)
    )

    for (let i = 0; i < cellCount; i++) {
      // 1. Fibonacci Sphere sampling
      const theta = (2 * Math.PI * i) / goldenRatio
      const phi = Math.acos(1 - (2 * (i + 0.5)) / cellCount)

      const x = Math.sin(phi) * Math.cos(theta)
      const y = Math.cos(phi)
      const z = Math.sin(phi) * Math.sin(theta)

      const { latitude, longitude } = cartesianToLatLong(x, y, z)
      const latRad = (latitude * Math.PI) / 180

      // 2. Procedural elevation sampling (multi-octave harmonic noise based on seed)
      const elevationNoise =
        0.5 +
        0.28 * Math.sin(x * 3.4 + y * 2.1 + planetConfig.seed * 0.1) *
          Math.cos(z * 3.1 + planetConfig.seed * 0.15) +
        0.14 * Math.sin(x * 7.2 - z * 5.4 + y * 6.3) +
        rng.nextFloat(-0.06, 0.06)

      const elevation = Math.max(0.0, Math.min(1.0, elevationNoise))

      // 3. Local Temperature Model
      // Equator is warm, poles are cold, high elevation drops temperature via lapse rate
      const latitudinalCooling = 38.0 * Math.pow(Math.sin(latRad), 2)
      const elevationLapseRate = 18.0 * (elevation - 0.5)

      const localTemperatureCelsius = Math.round(
        effectiveSurfaceTemp - latitudinalCooling - elevationLapseRate
      )

      // 4. Moisture Model
      // Tropical Hadley convergence zone has higher precipitation; subtropical deserts have lower
      const tropicalHadleyBonus = Math.abs(latitude) < 18 ? 0.25 : 0.0
      const polarAridity = Math.abs(latitude) > 65 ? -0.2 : 0.0
      const marineMoisture =
        elevation < effectiveOceanLevel
          ? 0.95
          : effectiveOceanLevel * 0.85

      const moisture = Math.max(
        0.05,
        Math.min(
          1.0,
          marineMoisture + tropicalHadleyBonus + polarAridity + rng.nextFloat(-0.08, 0.08)
        )
      )

      // 5. Biome Classification (responsive to climate shifts & glaciation)
      const effectiveIceCapLat = Math.max(
        0.18,
        Math.min(0.95, planetConfig.iceCapLatitude + temperatureDelta * 0.018)
      )
      const iceCapThresholdDeg = effectiveIceCapLat * 90.0
      const biome = classifyBiome(
        elevation,
        latitude,
        effectiveOceanLevel,
        iceCapThresholdDeg
      )

      // 6. Base Carrying Capacity
      // Optimal temperature (15-25°C) and abundant water provide highest carrying capacity
      let capacityFactor = 1.0
      if (biome === 'ice_cap' || localTemperatureCelsius < -15) {
        capacityFactor = 0.15
      } else if (biome === 'mountain') {
        capacityFactor = 0.35
      } else if (biome === 'deep_ocean') {
        capacityFactor = 0.5
      } else if (biome === 'shallow_ocean') {
        capacityFactor = 1.2
      } else if (biome === 'lowland' || biome === 'beach') {
        capacityFactor = 1.4
      }

      const carryingCapacity = Math.round(
        capacityFactor *
          (planetConfig.initialResources.solarIrradianceWatts / 25 +
            planetConfig.initialResources.geothermalEnergy * 3.5)
      )

      cells.push({
        id: i,
        center: [Number(x.toFixed(4)), Number(y.toFixed(4)), Number(z.toFixed(4))],
        latitude,
        longitude,
        elevation: Number(elevation.toFixed(3)),
        biome,
        localTemperatureCelsius,
        moisture: Number(moisture.toFixed(2)),
        carryingCapacity,
        biomassDensity: 0,
        residentSpeciesId: null,
        residentSpeciesColor: null,
      })
    }

    return cells
  }

  /**
   * Computes biome distribution statistics across the entire planet.
   */
  static calculateDistributionStats(cells: readonly BiomeCell[]): BiomeDistributionStats {
    if (cells.length === 0) {
      return {
        deepOceanPercent: 0,
        shallowOceanPercent: 0,
        beachPercent: 0,
        lowlandPercent: 0,
        highlandPercent: 0,
        mountainPercent: 0,
        iceCapPercent: 0,
      }
    }

    const counts: Record<BiomeType, number> = {
      deep_ocean: 0,
      shallow_ocean: 0,
      beach: 0,
      lowland: 0,
      highland: 0,
      mountain: 0,
      ice_cap: 0,
    }

    for (const cell of cells) {
      counts[cell.biome]++
    }

    const total = cells.length
    return {
      deepOceanPercent: Math.round((counts.deep_ocean / total) * 100),
      shallowOceanPercent: Math.round((counts.shallow_ocean / total) * 100),
      beachPercent: Math.round((counts.beach / total) * 100),
      lowlandPercent: Math.round((counts.lowland / total) * 100),
      highlandPercent: Math.round((counts.highland / total) * 100),
      mountainPercent: Math.round((counts.mountain / total) * 100),
      iceCapPercent: Math.round((counts.ice_cap / total) * 100),
    }
  }

  /**
   * Finds the nearest biome cell to a given 3D unit coordinate point.
   */
  static findNearestCell(
    point: readonly [number, number, number],
    cells: readonly BiomeCell[]
  ): BiomeCell | null {
    if (cells.length === 0) return null

    let nearest = cells[0]!
    let minDistanceSq = Number.POSITIVE_INFINITY

    for (const cell of cells) {
      const dx = point[0] - cell.center[0]
      const dy = point[1] - cell.center[1]
      const dz = point[2] - cell.center[2]
      const distSq = dx * dx + dy * dy + dz * dz

      if (distSq < minDistanceSq) {
        minDistanceSq = distSq
        nearest = cell
      }
    }

    return nearest
  }

  /**
   * Finds the K physically nearest neighbor cell IDs for a specific cell on the sphere.
   */
  static findNeighborCellIds(
    targetCellId: number,
    cells: readonly BiomeCell[],
    k = 5
  ): number[] {
    const target = cells[targetCellId]
    if (!target) return []

    const distances: { id: number; distSq: number }[] = []
    for (const cell of cells) {
      if (cell.id === targetCellId) continue
      const dx = target.center[0] - cell.center[0]
      const dy = target.center[1] - cell.center[1]
      const dz = target.center[2] - cell.center[2]
      distances.push({ id: cell.id, distSq: dx * dx + dy * dy + dz * dz })
    }

    distances.sort((a, b) => a.distSq - b.distSq)
    return distances.slice(0, k).map((d) => d.id)
  }

  /**
   * Precomputes the adjacency graph for all cells on the Fibonacci sphere.
   * Returns a 2D array where index i contains the adjacent neighbor cell IDs of cell i.
   */
  static buildAdjacencyMap(cells: readonly BiomeCell[], k = 5): number[][] {
    return cells.map((cell) => BiomeGridGenerator.findNeighborCellIds(cell.id, cells, k))
  }
}

