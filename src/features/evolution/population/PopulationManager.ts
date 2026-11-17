import { SeededRNG } from '../../../shared/utils/seeded-rng.js'
import type { PlanetConfig } from '../../genesis/types/genesis.js'
import { GeneExpression } from '../genetics/Gene.js'
import type { SpeciesSummary } from '../genetics/types.js'
import { MutationEngine } from '../mutation/MutationEngine.js'
import { RecombinationEngine } from '../reproduction/RecombinationEngine.js'
import { SelectionEngine, type EnvironmentalContext } from '../selection/SelectionEngine.js'
import { BiomeGridGenerator } from '../../environment/climate/BiomeGridGenerator.js'
import type { BiomeCell, BiomeCellSummary } from '../../environment/climate/types.js'
import type { EnvironmentalPerturbations } from '../../disasters/types.js'
import { DEFAULT_PERTURBATIONS } from '../../disasters/constants.js'
import { PrebioticEngine, DEFAULT_PREBIOTIC_STATE } from '../abiogenesis/PrebioticEngine.js'
import type { PrebioticState } from '../abiogenesis/types.js'
import { Organism } from './Organism.js'
import { Species } from './Species.js'
import type {
  SerializedSpecies,
  SerializedOrganism,
  SerializedPrebioticState,
} from '../../persistence/types.js'

export const SPECIATION_DISTANCE_THRESHOLD = 0.22
/** Infinite theoretical capacity — no artificial population ceiling */
export const MAX_CARRYING_CAPACITY = Number.POSITIVE_INFINITY
/** Maximum number of active representative genetic cohorts simulated in memory */
export const MAX_SIMULATED_AGENTS = 350

function getPerturbedRadiationLevel(
  base: 'shielded' | 'moderate' | 'intense' | 'extreme',
  multiplier: number
): 'shielded' | 'moderate' | 'intense' | 'extreme' {
  if (multiplier >= 3.0) return 'extreme'
  if (multiplier >= 1.8) {
    return base === 'shielded' ? 'moderate' : 'intense'
  }
  return base
}

export class PopulationManager {
  private organisms: Organism[] = []
  private speciesMap: Map<string, Species> = new Map()
  private biomeGrid: BiomeCell[] = []
  private cellAdjacency: number[][] = []
  private prebioticEngine = new PrebioticEngine()
  private nextOrganismId = 1
  private nextSpeciesId = 1
  private currentGeneration = 0

  /**
   * Initializes a freshly created planet into its prebiotic chemical era.
   * Generates the biome grid and assesses primordial chemical soup without forcing organisms.
   */
  initPlanet(planetConfig: PlanetConfig): void {
    this.organisms = []
    this.speciesMap.clear()
    this.nextOrganismId = 1
    this.nextSpeciesId = 1
    this.currentGeneration = 0
    this.prebioticEngine.reset()
    this.biomeGrid = BiomeGridGenerator.generateGrid(planetConfig)
    this.cellAdjacency = BiomeGridGenerator.buildAdjacencyMap(this.biomeGrid, 5)
    this.updateBiomeGridDensities()
  }

  /**
   * Triggers the biogenesis event, synthesizing the first living organisms
   * concentrated in a prime biogenesis cradle and its immediate contiguous neighbors.
   */
  triggerBiogenesis(
    planetConfig: PlanetConfig,
    _rng: SeededRNG,
    count = 40
  ): void {
    this.organisms = []
    this.speciesMap.clear()
    this.nextOrganismId = 1
    this.nextSpeciesId = 1
    this.currentGeneration = 1
    this.prebioticEngine.setStage('inhabited')

    if (this.biomeGrid.length === 0) {
      this.biomeGrid = BiomeGridGenerator.generateGrid(planetConfig)
    }
    if (this.cellAdjacency.length === 0) {
      this.cellAdjacency = BiomeGridGenerator.buildAdjacencyMap(this.biomeGrid, 5)
    }

    // 1. Synthesize primordial genotype directly from planetary chemistry
    const chemistry = this.prebioticEngine.evaluateChemistry(planetConfig)
    const primordialGenotype = this.prebioticEngine.generatePrimordialGenotype(
      planetConfig,
      chemistry.archetype
    )

    const foundingSpecies = new Species(
      `sp_${this.nextSpeciesId++}`,
      chemistry.archetype,
      primordialGenotype,
      0,
      0
    )
    this.speciesMap.set(foundingSpecies.id, foundingSpecies)

    // 2. Identify the single best focal biogenesis cradle on the planet
    let bestCradleCell = this.biomeGrid[0]!
    let maxScore = -1

    for (const cell of this.biomeGrid) {
      const tempSuitability = Math.max(0.1, 1.0 - Math.abs(cell.localTemperatureCelsius - 30) / 40.0)
      const waterBonus = cell.biome === 'shallow_ocean' || cell.biome === 'beach' ? 2.5 : 1.0
      const score = cell.carryingCapacity * tempSuitability * waterBonus
      if (score > maxScore) {
        maxScore = score
        bestCradleCell = cell
      }
    }

    const cradleNeighbors = this.cellAdjacency[bestCradleCell.id] ?? []
    const cradleCluster = [bestCradleCell.id, ...cradleNeighbors.slice(0, 2)]

    // 3. Spawn all initial pioneer organisms clustered together!
    for (let i = 0; i < count; i++) {
      // 70% in the epicenter cradle cell, 30% in immediate contiguous neighbors
      const assignedCellId =
        i < count * 0.7 ? bestCradleCell.id : cradleCluster[i % cradleCluster.length]!
      const organism = new Organism(
        `org_${this.nextOrganismId++}`,
        foundingSpecies.id,
        primordialGenotype,
        1,
        8.0,
        1,
        assignedCellId
      )
      this.organisms.push(organism)
    }

    this.updateBiomeGridDensities()
  }

  /**
   * Player-invoked spark of life: forces biogenesis if primordial soup is viable.
   */
  sparkBiogenesis(planetConfig: PlanetConfig, rng: SeededRNG): boolean {
    const chemistry = this.prebioticEngine.evaluateChemistry(planetConfig)
    if (chemistry.chemicalFertility > 0.15 || this.prebioticEngine.getStage() === 'extinct') {
      this.triggerBiogenesis(planetConfig, rng, 40)
      return true
    }
    return false
  }

  /**
   * Seeds an initial primordial ancestor population adapted to the planet's conditions.
   * Maintained for API compatibility.
   */
  seedPrimordialLife(planetConfig: PlanetConfig, count = 40): void {
    const rng = new SeededRNG(planetConfig.seed)
    this.triggerBiogenesis(planetConfig, rng, count)
  }

  getPrebioticState(planetConfig?: PlanetConfig): PrebioticState {
    if (!planetConfig) {
      return { ...DEFAULT_PREBIOTIC_STATE }
    }
    return this.prebioticEngine.step(this.currentGeneration, planetConfig)
  }

  /**
   * Advances one full planetary rotation of biological life with spatial biome adaptation.
   */
  step(
    rotation: number,
    planetConfig: PlanetConfig,
    rng: SeededRNG,
    perturbations: EnvironmentalPerturbations = DEFAULT_PERTURBATIONS
  ): {
    totalPopulation: number
    activeSpeciesCount: number
    extinctSpeciesCount: number
    averageFitness: number
    generation: number
    speciesSummaries: SpeciesSummary[]
    biomeCells: BiomeCellSummary[]
    prebioticState: PrebioticState
  } {
    if (
      this.biomeGrid.length === 0 ||
      perturbations.temperatureDeltaCelsius !== 0 ||
      perturbations.oceanLevelDelta !== 0
    ) {
      this.biomeGrid = BiomeGridGenerator.generateGrid(
        planetConfig,
        this.biomeGrid.length || undefined,
        perturbations.temperatureDeltaCelsius,
        perturbations.oceanLevelDelta
      )
      this.cellAdjacency = BiomeGridGenerator.buildAdjacencyMap(this.biomeGrid, 5)
    } else if (this.cellAdjacency.length === 0) {
      this.cellAdjacency = BiomeGridGenerator.buildAdjacencyMap(this.biomeGrid, 5)
    }

    // Advance prebiotic chemical evolution
    let prebioticState = this.prebioticEngine.step(
      rotation,
      planetConfig,
      perturbations
    )

    // Check Prebiotic Era transitions
    if (this.prebioticEngine.getStage() === 'prebiotic') {
      if (this.prebioticEngine.getOrganicComplexity() >= 1.0) {
        // Spontaneous abiogenesis: chemical soup saturated, the first cell synthesizes!
        this.triggerBiogenesis(planetConfig, rng, 40)
        prebioticState = this.prebioticEngine.step(
          rotation,
          planetConfig,
          perturbations
        )
      } else {
        return this.generateSummary(prebioticState)
      }
    } else if (this.prebioticEngine.getStage() === 'inhabited') {
      if (this.organisms.length === 0) {
        this.prebioticEngine.setStage('extinct')
        // Initialize post-extinction organic soup residue
        this.prebioticEngine.setOrganicComplexity(0.05)
        const extinctState = this.prebioticEngine.step(
          rotation,
          planetConfig,
          perturbations
        )
        return this.generateSummary(extinctState)
      }
    } else if (this.prebioticEngine.getStage() === 'extinct') {
      if (this.organisms.length === 0) {
        // If environmental conditions are favorable, organic soup saturates to 1.0!
        if (this.prebioticEngine.getOrganicComplexity() >= 1.0) {
          // Spontaneous Resurgence: A brand new evolutionary lineage emerges!
          this.triggerBiogenesis(planetConfig, rng, 40)
          prebioticState = this.prebioticEngine.step(
            rotation,
            planetConfig,
            perturbations
          )
        } else {
          return this.generateSummary(prebioticState)
        }
      }
    }

    if (this.organisms.length === 0) {
      return this.generateSummary(prebioticState)
    }

    const cellCount = this.biomeGrid.length
    const survivors: Organism[] = []

    // 1. Natural Selection, Metabolism, Disaster Mortality in Local Biomes
    for (const organism of this.organisms) {
      organism.ageRotations++

      // Instant shockwave / disaster pulse (mitigated by structural armor)
      if (perturbations.instantMortalityRate > 0) {
        const armorDefense = organism.phenotype.radiationResistance * 0.75
        const effectiveMortality = perturbations.instantMortalityRate * (1.0 - armorDefense)
        if (organism.cohortWeight <= 1) {
          if (rng.next() < effectiveMortality) {
            continue // Killed by disaster shockwave
          }
        } else {
          const survivingWeight = Math.floor(
            organism.cohortWeight * (1.0 - effectiveMortality)
          )
          if (survivingWeight <= 0) {
            continue
          }
          organism.cohortWeight = survivingWeight
        }
      }

      // Basal metabolic consumption
      organism.energy -= organism.phenotype.metabolicRate
      if (organism.energy <= 0) {
        continue // Starvation
      }

      // Query local biome climate conditions
      const localCell = this.biomeGrid[organism.cellId % cellCount]!

      const effectiveRadiation = getPerturbedRadiationLevel(
        planetConfig.environmentalConditions.radiationLevel,
        perturbations.radiationMultiplier
      )

      const env: EnvironmentalContext = {
        ambientTemperatureCelsius: localCell.localTemperatureCelsius,
        oceanLevel: localCell.moisture,
        radiationLevel: effectiveRadiation,
        tectonicStability: planetConfig.environmentalConditions.tectonicStability,
        selectionPressure: Math.min(
          1.0,
          planetConfig.environmentalConditions.selectionPressure *
            (1.0 + perturbations.atmosphericDust * 0.4)
        ),
        resourceAvailability: Math.min(
          1.0,
          (localCell.carryingCapacity / 80.0) *
            Math.max(0.1, 1.0 - perturbations.atmosphericDust)
        ),
      }

      // Evaluate fitness against local biome climate
      organism.fitness = SelectionEngine.evaluateFitness(organism.phenotype, env)

      const survivalProb = SelectionEngine.calculateSurvivalProbability(
        organism.fitness,
        env.selectionPressure
      )

      if (organism.cohortWeight <= 1) {
        if (rng.next() < survivalProb) {
          const energyIntake =
            1.8 * env.resourceAvailability * (0.8 + 0.4 * organism.phenotype.mobility)
          organism.energy = Math.min(15.0, organism.energy + energyIntake)

          // Density-Dependent Geodesic Spatial Dispersal to contiguous neighbors
          const cellNeighbors = this.cellAdjacency[organism.cellId]
          if (cellNeighbors && cellNeighbors.length > 0) {
            const localCrowding = localCell.biomassDensity ?? 0
            // Organisms cling together in colonies; only disperse if crowded or high mobility
            const migrationChance =
              localCrowding > 0.65
                ? 0.05 + organism.phenotype.mobility * 0.3
                : organism.phenotype.mobility * 0.05
            if (rng.next() < migrationChance) {
              organism.cellId = cellNeighbors[rng.nextInt(0, cellNeighbors.length - 1)]!
            }
          }

          survivors.push(organism)
        }
      } else {
        const survivingWeight = Math.floor(
          organism.cohortWeight * survivalProb + rng.next()
        )
        if (survivingWeight > 0) {
          organism.cohortWeight = survivingWeight
          const energyIntake =
            1.8 * env.resourceAvailability * (0.8 + 0.4 * organism.phenotype.mobility)
          organism.energy = Math.min(15.0, organism.energy + energyIntake)

          // Density-Dependent Geodesic Spatial Dispersal to contiguous neighbors
          const cellNeighbors = this.cellAdjacency[organism.cellId]
          if (cellNeighbors && cellNeighbors.length > 0) {
            const localCrowding = localCell.biomassDensity ?? 0
            const migrationChance =
              localCrowding > 0.65
                ? 0.05 + organism.phenotype.mobility * 0.3
                : organism.phenotype.mobility * 0.05
            if (rng.next() < migrationChance) {
              organism.cellId = cellNeighbors[rng.nextInt(0, cellNeighbors.length - 1)]!
            }
          }

          survivors.push(organism)
        }
      }
    }

    // 2. Colony-Based Local Reproduction & Allee Effect
    const newOffspring: Organism[] = []
    const effectiveRadiation = getPerturbedRadiationLevel(
      planetConfig.environmentalConditions.radiationLevel,
      perturbations.radiationMultiplier
    )
    const mutationConfig = {
      baseMutationRate: 0.06,
      mutationRateMultiplier:
        planetConfig.environmentalConditions.mutationRateMultiplier *
        perturbations.mutationRateMultiplier,
      radiationLevel: effectiveRadiation,
    }

    // Group fertile organisms by local colony (cellId)
    const colonyFertileMap = new Map<number, Organism[]>()
    for (const org of survivors) {
      if (org.isFertile()) {
        const list = colonyFertileMap.get(org.cellId)
        if (list) list.push(org)
        else colonyFertileMap.set(org.cellId, [org])
      }
    }

    for (const [cellId, localFertile] of colonyFertileMap) {
      const cellNeighbors = this.cellAdjacency[cellId] ?? []

      for (let i = 0; i < localFertile.length; i += 2) {
        const parentA = localFertile[i]!
        let parentB = localFertile[i + 1]

        // If odd, try mating with neighboring contiguous colony
        if (!parentB && cellNeighbors.length > 0) {
          for (const neighborId of cellNeighbors) {
            const neighborFertile = colonyFertileMap.get(neighborId)
            if (neighborFertile && neighborFertile.length > 0) {
              parentB = neighborFertile[0]
              break
            }
          }
        }

        if (!parentB) {
          // Allee Effect: Isolated individual with no local or neighboring mates
          // Requires high energy reserves (budding) or reproduction fails
          if (parentA.energy < 7.0 || rng.next() > 0.5) {
            continue // Allee reproductive failure due to isolation
          }
          parentB = parentA
        }

        // Energy cost of reproduction
        parentA.energy -= 2.5
        if (parentB !== parentA) parentB.energy -= 2.5

        const offspringWeight = Math.max(
          1,
          Math.floor((parentA.cohortWeight + parentB.cohortWeight) / 2)
        )

        // Recombination
        const recombinant = RecombinationEngine.sexualCross(
          parentA.genotype,
          parentB.genotype,
          rng
        )

        // Mutation pass
        const mutated = MutationEngine.mutateGenotype(
          recombinant,
          mutationConfig,
          rng
        )

        let targetSpeciesId = parentA.speciesId
        const parentSpecies = this.speciesMap.get(parentA.speciesId)

        // Speciation check (Geographic or genetic divergence)
        if (parentSpecies) {
          const dist = GeneExpression.calculateGeneticDistance(
            mutated,
            parentSpecies.foundingGenotype
          )

          if (dist > SPECIATION_DISTANCE_THRESHOLD) {
            const newSpeciesId = `sp_${this.nextSpeciesId++}`
            const newSpecies = new Species(
              newSpeciesId,
              `Branch ${parentSpecies.name.split(' ')[0]} ${String.fromCharCode(64 + (this.nextSpeciesId % 26))}`,
              mutated,
              rotation,
              this.speciesMap.size
            )
            this.speciesMap.set(newSpeciesId, newSpecies)
            targetSpeciesId = newSpeciesId
          }
        }

        const childGen = Math.max(parentA.generation, parentB.generation) + 1
        this.currentGeneration = Math.max(this.currentGeneration, childGen)

        // Offspring placement: born in parent's colony, or spills into contiguous neighbor if full
        let birthCellId = parentA.cellId
        const homeCell = this.biomeGrid[birthCellId]
        if (homeCell && (homeCell.biomassDensity ?? 0) > 0.7 && cellNeighbors.length > 0) {
          birthCellId = cellNeighbors[rng.nextInt(0, cellNeighbors.length - 1)]!
        }

        const child = new Organism(
          `org_${this.nextOrganismId++}`,
          targetSpeciesId,
          mutated,
          childGen,
          6.0,
          offspringWeight,
          birthCellId
        )
        newOffspring.push(child)
      }
    }

    // 3. Combine and compress cohorts if needed to guarantee O(1) performance
    this.organisms = [...survivors, ...newOffspring]
    if (this.organisms.length > MAX_SIMULATED_AGENTS) {
      this.compressCohorts()
    }

    // 4. Extinction Detection
    for (const species of this.speciesMap.values()) {
      if (!species.isExtinct) {
        const remaining = this.organisms.filter((o) => o.speciesId === species.id)
        if (remaining.length === 0) {
          species.isExtinct = true
          species.extinctionRotation = rotation
        }
      }
    }

    // 5. Update Biome Densities
    this.updateBiomeGridDensities()

    return this.generateSummary(prebioticState)
  }

  /**
   * Recalculates spatial biomass density and dominant resident species per biome cell.
   */
  private updateBiomeGridDensities(): void {
    if (this.biomeGrid.length === 0) return

    // Group organisms by cell
    const cellPops = new Map<number, { totalWeight: number; speciesCount: Map<string, number> }>()

    for (const org of this.organisms) {
      const entry = cellPops.get(org.cellId) ?? {
        totalWeight: 0,
        speciesCount: new Map<string, number>(),
      }
      entry.totalWeight += org.cohortWeight
      entry.speciesCount.set(
        org.speciesId,
        (entry.speciesCount.get(org.speciesId) ?? 0) + org.cohortWeight
      )
      cellPops.set(org.cellId, entry)
    }

    for (let i = 0; i < this.biomeGrid.length; i++) {
      const cell = this.biomeGrid[i]!
      const data = cellPops.get(cell.id)

      if (!data || data.totalWeight === 0) {
        this.biomeGrid[i] = {
          ...cell,
          biomassDensity: 0,
          residentSpeciesId: null,
          residentSpeciesColor: null,
        }
        continue
      }

      // Find dominant species in this cell
      let dominantSpeciesId = ''
      let maxCount = 0
      for (const [spId, count] of data.speciesCount) {
        if (count > maxCount) {
          maxCount = count
          dominantSpeciesId = spId
        }
      }

      const dominantSpecies = this.speciesMap.get(dominantSpeciesId)
      const density = Math.min(1.0, data.totalWeight / Math.max(1, cell.carryingCapacity * 0.3))

      this.biomeGrid[i] = {
        ...cell,
        biomassDensity: Number(density.toFixed(3)),
        residentSpeciesId: dominantSpeciesId,
        residentSpeciesColor: dominantSpecies?.color ?? null,
      }
    }
  }

  private compressCohorts(): void {
    // 1. Group cohorts by local colony: (cellId, speciesId) to guarantee zero spatial leakage
    const colonySpeciesMap = new Map<string, Organism[]>()

    for (const org of this.organisms) {
      const key = `${org.cellId}_${org.speciesId}`
      const bucket = colonySpeciesMap.get(key)
      if (bucket) {
        bucket.push(org)
      } else {
        colonySpeciesMap.set(key, [org])
      }
    }

    const compressed: Organism[] = []

    // 2. Compress multiple cohorts within the SAME cell and species
    for (const [, bucket] of colonySpeciesMap) {
      if (bucket.length <= 4) {
        compressed.push(...bucket)
        continue
      }

      bucket.sort(
        (a, b) =>
          a.phenotype.thermalOptimumCelsius - b.phenotype.thermalOptimumCelsius
      )

      for (let i = 0; i < bucket.length; i += 2) {
        const first = bucket[i]!
        const second = bucket[i + 1]

        if (!second) {
          compressed.push(first)
          continue
        }

        const totalWeight = first.cohortWeight + second.cohortWeight
        const avgEnergy =
          (first.energy * first.cohortWeight + second.energy * second.cohortWeight) /
          totalWeight

        first.cohortWeight = totalWeight
        first.energy = avgEnergy
        compressed.push(first)
      }
    }

    // 3. If total organisms still exceed MAX_SIMULATED_AGENTS, bound strictly
    if (compressed.length > MAX_SIMULATED_AGENTS) {
      compressed.sort((a, b) => b.cohortWeight - a.cohortWeight)
      this.organisms = compressed.slice(0, MAX_SIMULATED_AGENTS)
    } else {
      this.organisms = compressed
    }
  }

  getOrganisms(): readonly Organism[] {
    return this.organisms
  }

  getSpeciesList(): readonly Species[] {
    return Array.from(this.speciesMap.values())
  }

  getBiomeGrid(): readonly BiomeCell[] {
    return this.biomeGrid
  }

  exportState(): {
    currentGeneration: number
    nextOrganismId: number
    nextSpeciesId: number
    species: SerializedSpecies[]
    organisms: SerializedOrganism[]
    prebiotic: SerializedPrebioticState
  } {
    const species: SerializedSpecies[] = Array.from(this.speciesMap.values()).map((s) => ({
      id: s.id,
      name: s.name,
      color: s.color,
      foundingGenotype: s.foundingGenotype,
      emergenceRotation: s.emergenceRotation,
      isExtinct: s.isExtinct,
      extinctionRotation: s.extinctionRotation,
      generation: s.generation,
    }))

    const organisms: SerializedOrganism[] = this.organisms.map((o) => ({
      id: o.id,
      speciesId: o.speciesId,
      genotype: o.genotype,
      generation: o.generation,
      energy: o.energy,
      ageRotations: o.ageRotations,
      fitness: o.fitness,
      cohortWeight: o.cohortWeight,
      cellId: o.cellId,
    }))

    return {
      currentGeneration: this.currentGeneration,
      nextOrganismId: this.nextOrganismId,
      nextSpeciesId: this.nextSpeciesId,
      species,
      organisms,
      prebiotic: this.prebioticEngine.exportState(),
    }
  }

  restoreState(
    state: {
      currentGeneration: number
      nextOrganismId: number
      nextSpeciesId: number
      species: readonly SerializedSpecies[]
      organisms: readonly SerializedOrganism[]
      prebiotic: SerializedPrebioticState
    },
    planetConfig: PlanetConfig
  ): void {
    this.currentGeneration = state.currentGeneration
    this.nextOrganismId = state.nextOrganismId
    this.nextSpeciesId = state.nextSpeciesId

    this.speciesMap.clear()
    for (const s of state.species) {
      const sp = new Species(s.id, s.name, s.foundingGenotype, s.emergenceRotation, 0, s.color)
      sp.isExtinct = s.isExtinct
      sp.extinctionRotation = s.extinctionRotation
      sp.generation = s.generation
      this.speciesMap.set(s.id, sp)
    }

    this.organisms = state.organisms.map((o) => {
      const org = new Organism(
        o.id,
        o.speciesId,
        o.genotype,
        o.generation,
        o.energy,
        o.cohortWeight,
        o.cellId
      )
      org.ageRotations = o.ageRotations
      org.fitness = o.fitness
      return org
    })

    this.prebioticEngine.restoreState(state.prebiotic)

    // Recompute biome grid and adjacency from planetConfig
    this.biomeGrid = BiomeGridGenerator.generateGrid(planetConfig)
    this.cellAdjacency = BiomeGridGenerator.buildAdjacencyMap(this.biomeGrid, 5)

    this.updateBiomeGridDensities()
  }

  private generateSummary(
    prebioticState: PrebioticState = { ...DEFAULT_PREBIOTIC_STATE }
  ): {
    totalPopulation: number
    activeSpeciesCount: number
    extinctSpeciesCount: number
    averageFitness: number
    generation: number
    speciesSummaries: SpeciesSummary[]
    biomeCells: BiomeCellSummary[]
    prebioticState: PrebioticState
  } {
    let totalPop = 0
    let weightedFitness = 0

    for (const org of this.organisms) {
      totalPop += org.cohortWeight
      weightedFitness += org.fitness * org.cohortWeight
    }

    const averageFitness =
      totalPop > 0 ? Number((weightedFitness / totalPop).toFixed(3)) : 0

    let activeSpeciesCount = 0
    let extinctSpeciesCount = 0
    const speciesSummaries: SpeciesSummary[] = []

    for (const species of this.speciesMap.values()) {
      const living = this.organisms.filter((o) => o.speciesId === species.id)
      if (species.isExtinct) {
        extinctSpeciesCount++
      } else {
        activeSpeciesCount++
      }
      speciesSummaries.push(species.toSummary(living))
    }

    const biomeCells: BiomeCellSummary[] = this.biomeGrid.map((c) => ({
      id: c.id,
      center: c.center,
      biome: c.biome,
      localTemperatureCelsius: c.localTemperatureCelsius,
      biomassDensity: c.biomassDensity,
      residentSpeciesColor: c.residentSpeciesColor,
    }))

    return {
      totalPopulation: totalPop,
      activeSpeciesCount,
      extinctSpeciesCount,
      averageFitness,
      generation: this.currentGeneration,
      speciesSummaries,
      biomeCells,
      prebioticState,
    }
  }
}
