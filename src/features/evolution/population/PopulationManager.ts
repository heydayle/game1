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
import type { SpeciationEvent } from '../taxonomy/types.js'
import { TaxonomyEngine } from '../taxonomy/TaxonomyEngine.js'
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
  private planetConfig: PlanetConfig | null = null
  private pendingSpeciationEvents: SpeciationEvent[] = []

  private recordSpeciationEvent(event: SpeciationEvent): void {
    this.pendingSpeciationEvents.push(event)
    if (this.pendingSpeciationEvents.length > 25) {
      this.pendingSpeciationEvents.shift()
    }
  }

  /**
   * Initializes a freshly created planet into its prebiotic chemical era.
   * Generates the biome grid and assesses primordial chemical soup without forcing organisms.
   */
  initPlanet(planetConfig: PlanetConfig): void {
    this.planetConfig = planetConfig
    this.pendingSpeciationEvents = []
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

    const foundingTraits = TaxonomyEngine.evaluateTraits(
      primordialGenotype,
      1,
      planetConfig
    )
    const foundingName = TaxonomyEngine.generateSpeciesDisplayName(
      foundingTraits.tier,
      foundingTraits.sapientArchetype,
      foundingTraits.domain,
      foundingTraits.trophicRole,
      1,
      foundingTraits.planetaryLineage
    )

    const foundingSpecies = new Species(
      `sp_${this.nextSpeciesId++}`,
      foundingName,
      primordialGenotype,
      0,
      0,
      undefined,
      planetConfig
    )
    this.speciesMap.set(foundingSpecies.id, foundingSpecies)

    this.recordSpeciationEvent({
      id: `spec_bio_${foundingSpecies.id}_${Date.now()}`,
      speciesId: foundingSpecies.id,
      speciesName: foundingSpecies.name,
      scientificName: foundingSpecies.traits.scientificName,
      tier: foundingSpecies.traits.tier,
      tierLabel: foundingSpecies.traits.tierLabel,
      color: foundingSpecies.color,
      emergenceRotation: 0,
      traits: foundingSpecies.traits,
      eventType: 'biogenesis',
      description: `Loài khởi nguồn ${foundingSpecies.name} (${foundingSpecies.traits.domainLabel} - ${foundingSpecies.traits.trophicRoleLabel}) xuất hiện từ hóa hợp chất nguyên sơ!`,
    })

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
   * Player-invoked spark of life: forces biogenesis if primordial soup is viable,
   * or triggers de novo microbial synthesis if biosphere is already inhabited.
   */
  sparkBiogenesis(planetConfig: PlanetConfig, rng: SeededRNG): boolean {
    const chemistry = this.prebioticEngine.evaluateChemistry(planetConfig)
    if (this.prebioticEngine.getStage() === 'inhabited') {
      this.triggerDeNovoBiogenesis(planetConfig, rng, 25, this.currentGeneration)
      return true
    }
    if (chemistry.chemicalFertility > 0.15 || this.prebioticEngine.getStage() === 'extinct') {
      this.triggerBiogenesis(planetConfig, rng, 40)
      return true
    }
    return false
  }

  /**
   * Applies an interactive chemical catalyst (lightning spark or hydrothermal vent).
   */
  triggerChemicalCatalyst(catalystType: 'spark' | 'vent'): void {
    if (catalystType === 'spark') {
      this.prebioticEngine.catalyzeSpark()
    } else if (catalystType === 'vent') {
      this.prebioticEngine.catalyzeVent()
    }
  }

  /**
   * Spawns a brand new, independent pioneer species directly from prebiotic chemistry
   * while an existing biosphere is actively inhabited.
   */
  triggerDeNovoBiogenesis(
    planetConfig: PlanetConfig,
    rng: SeededRNG,
    count = 25,
    rotation = 0
  ): Species | null {
    const chemistry = this.prebioticEngine.evaluateChemistry(planetConfig)
    const primordialGenotype = this.prebioticEngine.generatePrimordialGenotype(
      planetConfig,
      chemistry.archetype
    )

    // Apply chemical mutation to diversify from previous ancestral strains
    const mutatedGenotype = MutationEngine.mutateGenotype(
      primordialGenotype,
      {
        baseMutationRate: 0.15,
        mutationRateMultiplier: 1.5,
        radiationLevel: 'moderate',
      },
      rng
    )
    const newSpeciesId = `sp_${this.nextSpeciesId++}`
    const branchIndex = this.speciesMap.size + 1

    const traits = TaxonomyEngine.evaluateTraits(
      mutatedGenotype,
      1,
      this.planetConfig ?? planetConfig
    )
    const speciesName = TaxonomyEngine.generateSpeciesDisplayName(
      traits.tier,
      traits.sapientArchetype,
      traits.domain,
      traits.trophicRole,
      branchIndex,
      traits.planetaryLineage
    )

    const newSpecies = new Species(
      newSpeciesId,
      speciesName,
      mutatedGenotype,
      rotation,
      this.speciesMap.size,
      undefined,
      this.planetConfig ?? planetConfig
    )
    newSpecies.generation = 1
    newSpecies.updateTraits(this.planetConfig ?? planetConfig)
    this.speciesMap.set(newSpeciesId, newSpecies)

    // Consume de novo saturation
    this.prebioticEngine.consumeDeNovoBiogenesis()

    // Find a cradle cell (ocean, beach, or hydrothermal lowland)
    let bestCell = this.biomeGrid[0]!
    let bestScore = -1
    for (const cell of this.biomeGrid) {
      const isWater =
        cell.biome === 'deep_ocean' || cell.biome === 'shallow_ocean' || cell.biome === 'beach'
      const score = cell.carryingCapacity * (isWater ? 2.0 : 1.0)
      if (score > bestScore) {
        bestScore = score
        bestCell = cell
      }
    }

    for (let i = 0; i < count; i++) {
      const org = new Organism(
        `org_${this.nextOrganismId++}`,
        newSpecies.id,
        mutatedGenotype,
        1,
        7.0,
        1,
        bestCell.id
      )
      this.organisms.push(org)
    }

    this.recordSpeciationEvent({
      id: `spec_denovo_${newSpecies.id}_${rotation}_${Date.now()}`,
      speciesId: newSpecies.id,
      speciesName: newSpecies.name,
      scientificName: newSpecies.traits.scientificName,
      tier: newSpecies.traits.tier,
      tierLabel: newSpecies.traits.tierLabel,
      color: newSpecies.color,
      emergenceRotation: rotation,
      traits: newSpecies.traits,
      eventType: 'de_novo_chemical_synthesis',
      description: `Khởi sinh hóa học song song: Dòng vi sinh mới ${newSpecies.name} (${newSpecies.traits.domainLabel} • ${newSpecies.traits.trophicRoleLabel}) tự sinh độc lập từ hồ hữu cơ nguyên thủy!`,
    })

    this.updateBiomeGridDensities()
    return newSpecies
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
    speciationEvents: SpeciationEvent[]
  } {
    const planetChanged =
      !this.planetConfig ||
      this.planetConfig.surfaceTemperatureCelsius !== planetConfig.surfaceTemperatureCelsius ||
      this.planetConfig.oceanLevel !== planetConfig.oceanLevel
    this.planetConfig = planetConfig

    if (
      this.biomeGrid.length === 0 ||
      planetChanged ||
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

    // Calculate current living biomass & active species count for continuous biotic feedback
    let totalBiomass = 0
    for (const org of this.organisms) {
      totalBiomass += org.cohortWeight
    }
    const activeSpeciesCount = Array.from(this.speciesMap.values()).filter(
      (s) => !s.isExtinct
    ).length

    // Advance continuous chemical evolution in parallel
    let prebioticState = this.prebioticEngine.step(
      rotation,
      planetConfig,
      perturbations,
      totalBiomass,
      activeSpeciesCount
    )

    // Check Prebiotic Era transitions
    if (this.prebioticEngine.getStage() === 'prebiotic') {
      if (this.prebioticEngine.getOrganicComplexity() >= 1.0) {
        // Spontaneous abiogenesis: chemical soup saturated, the first cell synthesizes!
        this.triggerBiogenesis(planetConfig, rng, 40)
        prebioticState = this.prebioticEngine.step(
          rotation,
          planetConfig,
          perturbations,
          40,
          1
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
          perturbations,
          0,
          0
        )
        return this.generateSummary(extinctState)
      }

      // Spontaneous De Novo Microbial Genesis from saturated parallel chemistry
      if (
        this.prebioticEngine.getDeNovoSynthesisReady() &&
        this.organisms.length > 0 &&
        this.speciesMap.size < 12 &&
        rng.next() < 0.2
      ) {
        this.triggerDeNovoBiogenesis(planetConfig, rng, 20, rotation)
        prebioticState = this.prebioticEngine.step(
          rotation,
          planetConfig,
          perturbations,
          totalBiomass + 20,
          activeSpeciesCount + 1
        )
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
            perturbations,
            40,
            1
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

    // Pre-calculate local trophic biomass per cell for Food Chain interactions
    const cellTrophicBiomass = new Map<
      number,
      { producer: number; herbivore: number; prey: number; carnivore: number }
    >()

    let globalProducers = 0
    let globalHerbivores = 0
    let globalCarnivores = 0
    let globalPrey = 0
    let globalLowerTierBiomass = 0
    let globalMicrobeBiomass = 0
    const microbeSpeciesSet = new Set<string>()
    let globalFloraBiomass = 0

    for (const org of this.organisms) {
      const sp = this.speciesMap.get(org.speciesId)
      const role = sp?.traits.trophicRole ?? 'producer'
      const tier = sp?.traits.tier ?? 'prokaryote'
      const domain = sp?.traits.domain ?? 'microbe'

      if (role === 'producer') {
        globalProducers += org.cohortWeight
      } else if (role === 'herbivore') {
        globalHerbivores += org.cohortWeight
        globalPrey += org.cohortWeight
      } else if (role === 'omnivore') {
        globalPrey += org.cohortWeight
      } else if (role === 'carnivore') {
        globalCarnivores += org.cohortWeight
      }

      if (
        tier === 'prokaryote' ||
        tier === 'eukaryote' ||
        tier === 'simple_multicellular' ||
        tier === 'differentiated_tissue' ||
        tier === 'primitive_animal' ||
        tier === 'unicellular' ||
        tier === 'complex_multicellular'
      ) {
        globalLowerTierBiomass += org.cohortWeight
      }

      if (
        tier === 'prokaryote' ||
        tier === 'eukaryote' ||
        tier === 'simple_multicellular' ||
        tier === 'unicellular' ||
        domain === 'microbe'
      ) {
        globalMicrobeBiomass += org.cohortWeight
        microbeSpeciesSet.add(org.speciesId)
      }
      if (domain === 'flora') {
        globalFloraBiomass += org.cohortWeight
      }

      const entry = cellTrophicBiomass.get(org.cellId) ?? {
        producer: 0,
        herbivore: 0,
        prey: 0,
        carnivore: 0,
      }
      if (role === 'producer') {
        entry.producer += org.cohortWeight
      } else if (role === 'herbivore') {
        entry.herbivore += org.cohortWeight
        entry.prey += org.cohortWeight
      } else if (role === 'omnivore') {
        entry.prey += org.cohortWeight
      } else if (role === 'carnivore') {
        entry.carnivore += org.cohortWeight
      }
      cellTrophicBiomass.set(org.cellId, entry)
    }

    const globalMicrobeDiversity = microbeSpeciesSet.size

    // 1. Natural Selection, Metabolism, Disaster Mortality in Local Biomes
    for (const organism of this.organisms) {
      organism.ageRotations++

      const sp = this.speciesMap.get(organism.speciesId)
      const role = sp?.traits.trophicRole ?? 'producer'
      const tier = sp?.traits.tier ?? 'unicellular'
      const domain = sp?.traits.domain ?? 'microbe'

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

      // Basal metabolic consumption: lower tiers have lower basal metabolic requirements
      const metabolicFactor =
        tier === 'prokaryote' || tier === 'unicellular'
          ? 0.45
          : tier === 'eukaryote'
          ? 0.55
          : tier === 'simple_multicellular'
          ? 0.70
          : tier === 'differentiated_tissue'
          ? 0.85
          : 1.0
      organism.energy -= organism.phenotype.metabolicRate * metabolicFactor
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

      let survivalProb = SelectionEngine.calculateSurvivalProbability(
        organism.fitness,
        env.selectionPressure
      )

      // Microorganisms have immense cellular resilience when within viable environmental tolerances
      const isMicrobeTier =
        tier === 'prokaryote' ||
        tier === 'eukaryote' ||
        tier === 'simple_multicellular' ||
        tier === 'unicellular' ||
        domain === 'microbe'

      if (isMicrobeTier && organism.fitness >= 0.2) {
        survivalProb = Math.min(0.99, survivalProb * 1.2)
      }

      // Calculate food chain energy intake based on trophic role
      const trophicData = cellTrophicBiomass.get(organism.cellId) ?? {
        producer: 0,
        herbivore: 0,
        prey: 0,
        carnivore: 0,
      }

      let trophicFoodMultiplier = 1.0
      if (role === 'producer') {
        trophicFoodMultiplier = 1.2 * env.resourceAvailability
      } else if (role === 'herbivore') {
        if (trophicData.producer <= 0 && globalProducers <= 0) {
          // Total collapse of producer food chain: severe starvation and mortality
          trophicFoodMultiplier = 0.05
          survivalProb *= 0.15
          organism.energy = Math.max(0, organism.energy - 2.0)
          organism.fitness = Math.max(0.01, organism.fitness * 0.3)
        } else if (trophicData.producer <= 0) {
          trophicFoodMultiplier = 0.3
          survivalProb *= 0.5
        } else {
          const ratio = trophicData.producer / Math.max(15, trophicData.herbivore)
          trophicFoodMultiplier = Math.min(1.5, Math.max(0.4, 0.4 + ratio * 0.8))
          if (ratio < 0.3) survivalProb *= (0.5 + ratio * 1.5)
        }
      } else if (role === 'carnivore') {
        if (trophicData.prey <= 0 && globalPrey <= 0) {
          // Total collapse of prey: carnivores starve
          trophicFoodMultiplier = 0.05
          survivalProb *= 0.1
          organism.energy = Math.max(0, organism.energy - 3.0)
          organism.fitness = Math.max(0.01, organism.fitness * 0.2)
        } else if (trophicData.prey <= 0) {
          trophicFoodMultiplier = 0.25
          survivalProb *= 0.45
        } else {
          const ratio = trophicData.prey / Math.max(5, trophicData.carnivore)
          trophicFoodMultiplier = Math.min(1.6, Math.max(0.3, 0.3 + (ratio / (1.0 + ratio)) * 1.3))
          if (ratio < 0.3) survivalProb *= (0.4 + ratio * 1.5)
        }
      } else if (role === 'omnivore') {
        if (globalProducers <= 0 && globalPrey <= 0) {
          trophicFoodMultiplier = 0.1
          survivalProb *= 0.15
        } else {
          const plantRatio = trophicData.producer > 0 ? trophicData.producer / 20.0 : 0.2
          const preyRatio = trophicData.prey > 0 ? trophicData.prey / 10.0 : 0.2
          trophicFoodMultiplier = Math.min(1.3, Math.max(0.3, 0.4 + plantRatio * 0.4 + preyRatio * 0.4))
          if (trophicData.producer <= 0 && trophicData.prey <= 0) survivalProb *= 0.4
        }
      }

      // Bilaterians, Advanced & Sapient species depend on an underlying lower-tier ecological pyramid
      if (
        (tier === 'complex_bilaterian' ||
          tier === 'complex_multicellular' ||
          tier === 'advanced' ||
          tier === 'sapient') &&
        globalLowerTierBiomass <= 5
      ) {
        survivalProb *= 0.25
        organism.fitness = Math.max(0.01, organism.fitness * 0.4)
      }

      // Plants adapt and flourish based on the underlying microbial genome & biodiversity
      if (domain === 'flora') {
        if (globalMicrobeDiversity >= 1 && globalMicrobeBiomass >= 20) {
          // Rich microbial bedrock: bio-weathering, rhizobial/mycorrhizal symbiosis, and soil nutrient cycling
          const diversityBonus = Math.min(0.5, globalMicrobeDiversity * 0.1)
          const biomassBonus = Math.min(0.5, (globalMicrobeBiomass / 300.0) * 0.5)
          trophicFoodMultiplier *= (1.0 + diversityBonus + biomassBonus)
          survivalProb = Math.min(0.98, survivalProb * (1.0 + diversityBonus * 0.3))
          organism.fitness = Math.min(1.0, organism.fitness * (1.0 + diversityBonus * 0.2))
        } else {
          // Without microbial soil foundation and microbial gene inheritance, flora struggles on raw bedrock
          trophicFoodMultiplier *= 0.35
          survivalProb *= 0.4
          organism.fitness = Math.max(0.01, organism.fitness * 0.5)
        }
      }

      const fitnessNutrientFactor =
        organism.fitness >= 0.2 ? 1.0 : Math.max(0.05, organism.fitness * 2.0)
      const baseIntake =
        tier === 'prokaryote' || tier === 'unicellular'
          ? 2.2
          : tier === 'eukaryote'
          ? 2.1
          : tier === 'simple_multicellular'
          ? 2.0
          : 1.8
      const energyIntake =
        baseIntake *
        env.resourceAvailability *
        trophicFoodMultiplier *
        fitnessNutrientFactor *
        (0.8 + 0.4 * organism.phenotype.mobility)

      if (organism.cohortWeight <= 1) {
        if (rng.next() < survivalProb) {
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
        const spA = this.speciesMap.get(parentA.speciesId)
        const roleA = spA?.traits.trophicRole ?? 'producer'
        const tierA = spA?.traits.tier ?? 'prokaryote'
        const domainA = spA?.traits.domain ?? 'microbe'

        // Strict food chain & ecological bedrock compliance:
        // - Severe physiological distress: organisms failing environmental viability cannot reproduce
        // - Herbivores require producers, carnivores require prey
        // - Bilaterians, Advanced & Sapient species require underlying lower-tier biomass
        // - Plants strictly depend on foundational microbial biomass
        if (parentA.fitness < 0.2) continue
        if (roleA === 'herbivore' && globalProducers <= 0) continue
        if (roleA === 'carnivore' && globalPrey <= 0) continue
        if (
          (tierA === 'complex_bilaterian' ||
            tierA === 'complex_multicellular' ||
            tierA === 'advanced' ||
            tierA === 'sapient') &&
          globalLowerTierBiomass <= 5
        ) {
          continue
        }
        if (tierA === 'primitive_animal' && globalLowerTierBiomass <= 3) continue
        if (domainA === 'flora' && globalMicrobeBiomass <= 10) continue

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
          // Microbes divide by binary fission / budding with lower energy requirement and higher success rate
          const isMicrobe =
            tierA === 'prokaryote' ||
            tierA === 'eukaryote' ||
            tierA === 'simple_multicellular' ||
            tierA === 'unicellular' ||
            domainA === 'microbe'
          const isolationEnergyReq = isMicrobe ? 5.0 : 7.0
          const isolationFailProb = isMicrobe ? 0.3 : 0.5
          if (parentA.energy < isolationEnergyReq || rng.next() < isolationFailProb) {
            continue // Allee reproductive failure due to isolation
          }
          parentB = parentA
        }

        // Energy cost of reproduction (microbes divide efficiently)
        const reproCost =
          tierA === 'prokaryote' || tierA === 'unicellular'
            ? 1.8
            : tierA === 'eukaryote'
            ? 1.9
            : tierA === 'simple_multicellular'
            ? 2.1
            : 2.5
        parentA.energy -= reproCost
        if (parentB !== parentA) parentB.energy -= reproCost

        let offspringWeight = Math.max(
          1,
          Math.floor((parentA.cohortWeight + parentB.cohortWeight) / 2)
        )
        // Microorganisms proliferate exponentially at massive scale
        if (tierA === 'prokaryote' || tierA === 'unicellular') {
          offspringWeight = Math.max(2, Math.floor(offspringWeight * 1.6))
        } else if (tierA === 'eukaryote') {
          offspringWeight = Math.max(2, Math.floor(offspringWeight * 1.45))
        } else if (tierA === 'simple_multicellular') {
          offspringWeight = Math.max(1, Math.floor(offspringWeight * 1.3))
        } else if (domainA === 'flora' && globalMicrobeDiversity >= 2) {
          // Flora thriving on high microbial biodiversity expands robustly
          offspringWeight = Math.max(1, Math.floor(offspringWeight * 1.25))
        }

        // Mutation config per evolutionary tier
        const baseMutationRate =
          tierA === 'prokaryote' || tierA === 'unicellular'
            ? 0.12
            : tierA === 'eukaryote'
            ? 0.10
            : tierA === 'simple_multicellular'
            ? 0.08
            : 0.06
        const localMutationConfig = {
          baseMutationRate,
          mutationRateMultiplier:
            planetConfig.environmentalConditions.mutationRateMultiplier *
            perturbations.mutationRateMultiplier,
          radiationLevel: effectiveRadiation,
        }

        // Recombination
        const recombinant = RecombinationEngine.sexualCross(
          parentA.genotype,
          parentB.genotype,
          rng
        )

        // Mutation pass
        const mutated = MutationEngine.mutateGenotype(
          recombinant,
          localMutationConfig,
          rng
        )

        const childGen = Math.max(parentA.generation, parentB.generation) + 1
        this.currentGeneration = Math.max(this.currentGeneration, childGen)

        let targetSpeciesId = parentA.speciesId
        const parentSpecies = this.speciesMap.get(parentA.speciesId)

        // Speciation check (Geographic or genetic divergence)
        if (parentSpecies) {
          const dist = GeneExpression.calculateGeneticDistance(
            mutated,
            parentSpecies.foundingGenotype
          )

          // Microorganisms diversify rapidly with a lower speciation distance threshold
          const speciationThreshold =
            tierA === 'prokaryote' ||
            tierA === 'unicellular' ||
            tierA === 'eukaryote' ||
            tierA === 'simple_multicellular'
              ? 0.12
              : SPECIATION_DISTANCE_THRESHOLD

          if (dist > speciationThreshold) {
            const newSpeciesId = `sp_${this.nextSpeciesId++}`
            const branchIndex = this.speciesMap.size + 1
            const traits = TaxonomyEngine.evaluateTraits(
              mutated,
              childGen,
              this.planetConfig ?? planetConfig
            )
            const branchName = TaxonomyEngine.generateSpeciesDisplayName(
              traits.tier,
              traits.sapientArchetype,
              traits.domain,
              traits.trophicRole,
              branchIndex,
              traits.planetaryLineage
            )

            const newSpecies = new Species(
              newSpeciesId,
              branchName,
              mutated,
              rotation,
              this.speciesMap.size,
              undefined,
              this.planetConfig ?? planetConfig
            )
            newSpecies.generation = childGen
            newSpecies.updateTraits(this.planetConfig ?? planetConfig)
            this.speciesMap.set(newSpeciesId, newSpecies)
            targetSpeciesId = newSpeciesId

            let speciationDesc = `Phân nhánh tiến hóa thích nghi mới: ${newSpecies.name} (${newSpecies.traits.domainLabel} • ${newSpecies.traits.trophicRoleLabel}) xuất hiện từ đột biến gen!`
            if (traits.tier === 'prokaryote') {
              speciationDesc = `Chủng vi sinh vật nhân sơ mới: ${newSpecies.name} (Tế bào nhân sơ Prokaryote chưa màng nhân) xuất hiện và sinh sôi mạnh mẽ!`
            } else if (traits.tier === 'eukaryote') {
              speciationDesc = `Sự hình thành tế bào nhân thực mới: ${newSpecies.name} (Eukaryote nội cộng sinh bào quan ti thể/lục lạp) phát triển với cấu trúc phức tạp!`
            } else if (traits.tier === 'simple_multicellular') {
              speciationDesc = `Bước chuyển sinh vật đa bào đơn giản: ${newSpecies.name} (Tập đoàn tế bào / Colonial organism) hình thành liên kết hợp tác!`
            } else if (traits.tier === 'differentiated_tissue') {
              speciationDesc = `Phân hóa tế bào và mô chuyên biệt: ${newSpecies.name} (Biểu mô, tế bào vận động & sinh sản sơ khai) phân tầng chức năng!`
            } else if (traits.tier === 'primitive_animal') {
              speciationDesc = `Kỷ nguyên Động vật đầu tiên xuất hiện: ${newSpecies.name} (Động vật đa bào nguyên thủy - Bọt biển & Ruột khoang đối xứng tỏa tròn)!`
            } else if (traits.tier === 'complex_bilaterian') {
              speciationDesc = `Đột phá đối xứng hai bên: ${newSpecies.name} (Động vật đối xứng hai bên Bilateria) hình thành hạch não, hệ cơ và khoang tiêu hóa chuyên biệt!`
            } else if (traits.domain === 'flora') {
              speciationDesc = `Thực vật mới thích nghi từ bộ gen vi sinh: ${newSpecies.name} (${newSpecies.traits.tierLabel} • ${newSpecies.traits.trophicRoleLabel}) phát triển nhờ bệ phóng đa dạng sinh học vi sinh!`
            }

            this.recordSpeciationEvent({
              id: `spec_branch_${newSpecies.id}_${rotation}`,
              speciesId: newSpecies.id,
              speciesName: newSpecies.name,
              scientificName: newSpecies.traits.scientificName,
              tier: newSpecies.traits.tier,
              tierLabel: newSpecies.traits.tierLabel,
              color: newSpecies.color,
              emergenceRotation: rotation,
              traits: newSpecies.traits,
              eventType: 'branching',
              description: speciationDesc,
            })
          }
        }

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

    // 4. Extinction & Tier Ascension Detection
    for (const species of this.speciesMap.values()) {
      if (!species.isExtinct) {
        const remaining = this.organisms.filter((o) => o.speciesId === species.id)
        if (remaining.length === 0) {
          species.isExtinct = true
          species.extinctionRotation = rotation
        } else {
          // Check for evolutionary tier ascension as generations accumulate
          const ascended = species.updateTraits(this.planetConfig ?? planetConfig)
          if (ascended) {
            let ascendDesc = `Loài ${species.name} đã đột phá nấc thang tiến hóa, vươn lên cấp bậc: ${species.traits.tierLabel}!`
            if (species.traits.tier === 'eukaryote') {
              ascendDesc = `Bước ngoặt Nội cộng sinh: ${species.name} tích hợp bào quan ti thể/lục lạp, tiến hóa thành Tế bào nhân thực (Eukaryotes)!`
            } else if (species.traits.tier === 'simple_multicellular') {
              ascendDesc = `Hợp tác tế bào: ${species.name} chuyển hóa thành Sinh vật đa bào đơn giản dạng tập đoàn (Colonial)!`
            } else if (species.traits.tier === 'differentiated_tissue') {
              ascendDesc = `Chuyên môn hóa chức năng: ${species.name} phân hóa thành các mô và cơ quan sơ khai (biểu mô, vận động, sinh sản)!`
            } else if (species.traits.tier === 'primitive_animal') {
              ascendDesc = `Bình minh Động vật giới: ${species.name} tiến hóa thành Động vật đa bào nguyên thủy (Metazoa đối xứng tỏa tròn/bọt biển)!`
            } else if (species.traits.tier === 'complex_bilaterian') {
              ascendDesc = `Kỷ nguyên Đối xứng hai bên: ${species.name} phát triển đối xứng hai bên (Bilateria) với hệ thần kinh và khoang cơ thể chuyên biệt!`
            } else if (species.traits.tier === 'advanced') {
              ascendDesc = `Đột phá bậc cao: ${species.name} tiến hóa thành Sinh vật bậc cao phức tạp thích nghi vượt bậc!`
            } else if (species.traits.tier === 'sapient') {
              ascendDesc = `Khai mở trí năng: ${species.name} thăng hoa thành Sinh vật có Trí tuệ và ý thức!`
            }

            this.recordSpeciationEvent({
              id: `spec_ascend_${species.id}_${rotation}_${species.traits.tier}`,
              speciesId: species.id,
              speciesName: species.name,
              scientificName: species.traits.scientificName,
              tier: species.traits.tier,
              tierLabel: species.traits.tierLabel,
              color: species.color,
              emergenceRotation: rotation,
              traits: species.traits,
              eventType: 'ascension',
              description: ascendDesc,
            })
          }
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
      sp.updateTraits(planetConfig)
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
    speciationEvents: SpeciationEvent[]
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

    // Build Trophic Food Web Links
    const activeSpecies = Array.from(this.speciesMap.values()).filter((s) => !s.isExtinct)
    const producerSpecies = activeSpecies.filter((s) => s.traits.trophicRole === 'producer')
    const herbivoreSpecies = activeSpecies.filter(
      (s) => s.traits.trophicRole === 'herbivore' || s.traits.trophicRole === 'omnivore'
    )
    const carnivoreSpecies = activeSpecies.filter(
      (s) => s.traits.trophicRole === 'carnivore' || s.traits.trophicRole === 'omnivore'
    )

    for (const species of this.speciesMap.values()) {
      const living = this.organisms.filter((o) => o.speciesId === species.id)
      if (species.isExtinct) {
        extinctSpeciesCount++
      } else {
        activeSpeciesCount++
      }

      const summary = species.toSummary(living)
      const role = species.traits.trophicRole

      let preyIds: string[] = []
      let predatorIds: string[] = []
      let foodChainSummary = 'Quang hợp và hóa năng'

      if (role === 'herbivore') {
        preyIds = producerSpecies.map((p) => p.id)
        predatorIds = carnivoreSpecies.map((c) => c.id)
        foodChainSummary =
          producerSpecies.length > 0
            ? `Ăn: ${producerSpecies.slice(0, 2).map((p) => p.name).join(', ')}`
            : 'Thiếu thảm thực vật!'
      } else if (role === 'carnivore') {
        preyIds = herbivoreSpecies.map((h) => h.id)
        predatorIds = []
        foodChainSummary =
          herbivoreSpecies.length > 0
            ? `Săn: ${herbivoreSpecies.slice(0, 2).map((h) => h.name).join(', ')}`
            : 'Thiếu con mồi!'
      } else if (role === 'omnivore') {
        preyIds = [
          ...producerSpecies.map((p) => p.id),
          ...herbivoreSpecies.filter((h) => h.id !== species.id).map((h) => h.id),
        ]
        predatorIds = carnivoreSpecies.filter((c) => c.id !== species.id).map((c) => c.id)
        foodChainSummary = 'Tiêu thụ thực vật & con mồi'
      } else if (role === 'producer') {
        preyIds = []
        predatorIds = herbivoreSpecies.map((h) => h.id)
        foodChainSummary = 'Quang năng sao & khoáng chất'
      } else {
        preyIds = []
        predatorIds = []
        foodChainSummary = 'Phân giải xác sinh khối hữu cơ'
      }

      let hungerState: 'satiated' | 'hungry' | 'starving' = 'satiated'
      if (living.length > 0) {
        const totalEnergy = living.reduce((acc, o) => acc + o.energy * o.cohortWeight, 0)
        const avgEnergy = totalEnergy / Math.max(1, summary.population)
        if (avgEnergy < 3.0) {
          hungerState = 'starving'
        } else if (avgEnergy < 5.0) {
          hungerState = 'hungry'
        }
      }

      speciesSummaries.push({
        ...summary,
        preySpeciesIds: preyIds,
        predatorSpeciesIds: predatorIds,
        hungerState,
        foodChainSummary,
      })
    }

    const biomeCells: BiomeCellSummary[] = this.biomeGrid.map((c) => ({
      id: c.id,
      center: c.center,
      biome: c.biome,
      localTemperatureCelsius: c.localTemperatureCelsius,
      biomassDensity: c.biomassDensity,
      residentSpeciesColor: c.residentSpeciesColor,
    }))

    const eventsToEmit = [...this.pendingSpeciationEvents]
    this.pendingSpeciationEvents = []

    return {
      totalPopulation: totalPop,
      activeSpeciesCount,
      extinctSpeciesCount,
      averageFitness,
      generation: this.currentGeneration,
      speciesSummaries,
      biomeCells,
      prebioticState,
      speciationEvents: eventsToEmit,
    }
  }
}
