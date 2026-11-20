import { describe, it, expect, beforeEach } from 'vitest'
import { PopulationManager, MAX_CARRYING_CAPACITY } from '../PopulationManager.js'
import { SeededRNG } from '../../../../shared/utils/seeded-rng.js'
import { GenesisEngine } from '../../../genesis/services/GenesisEngine.js'
import type { PlanetConfig } from '../../../genesis/types/genesis.js'
import { Species } from '../Species.js'
import { Organism } from '../Organism.js'
import { PrebioticEngine } from '../../abiogenesis/PrebioticEngine.js'
import { GeneExpression } from '../../genetics/Gene.js'
import type { SpeciationEvent } from '../../taxonomy/types.js'

describe('PopulationManager', () => {
  let manager: PopulationManager
  let planetConfig: PlanetConfig

  beforeEach(() => {
    manager = new PopulationManager()
    planetConfig = GenesisEngine.generatePlanet({}, 42)
  })

  it('has infinite carrying capacity without an arbitrary ceiling', () => {
    expect(MAX_CARRYING_CAPACITY).toBe(Number.POSITIVE_INFINITY)
    expect(!Number.isFinite(MAX_CARRYING_CAPACITY)).toBe(true)
  })

  it('seeds initial primordial life adapted to planet', () => {
    manager.seedPrimordialLife(planetConfig, 30)

    const orgs = manager.getOrganisms()
    expect(orgs.length).toBe(30)

    const species = manager.getSpeciesList()
    expect(species.length).toBe(1)
    expect(species[0]!.name).toBeTruthy()
    expect(species[0]!.isExtinct).toBe(false)
  })

  it('simulates population survival, reproduction, and speciation over rotations', () => {
    manager.seedPrimordialLife(planetConfig, 40)
    const rng = new SeededRNG(999)

    let summary = manager.step(1, planetConfig, rng)

    // Run 15 rotations
    for (let r = 2; r <= 15; r++) {
      summary = manager.step(r, planetConfig, rng)
    }

    expect(summary.totalPopulation).toBeGreaterThan(0)
    expect(summary.generation).toBeGreaterThan(1)
    expect(summary.speciesSummaries.length).toBeGreaterThanOrEqual(1)
  })

  it('culls populations when subjected to lethal environmental extremes', () => {
    manager.seedPrimordialLife(planetConfig, 50)
    const rng = new SeededRNG(123)

    // Create an uninhabitable super-volcanic hellworld with 95% selection pressure
    const lethalPlanet: PlanetConfig = {
      ...planetConfig,
      surfaceTemperatureCelsius: 120, // Boiling hot, far above thermal buffer
      environmentalConditions: {
        ...planetConfig.environmentalConditions,
        selectionPressure: 0.99,
        radiationLevel: 'extreme',
        tectonicStability: 'cataclysmic',
      },
    }

    // Step several rotations under lethal conditions
    for (let r = 1; r <= 10; r++) {
      manager.step(r, lethalPlanet, rng)
    }

    const remaining = manager.getOrganisms()
    // Most or all should have died off under 120°C extreme environment
    expect(remaining.length).toBeLessThan(10)
  })

  it('guarantees O(1) memory and latency without lag when population grows very large', () => {
    // Seed initial population
    manager.seedPrimordialLife(planetConfig, 100)
    const rng = new SeededRNG(456)

    // Run 50 rotations allowing massive population growth
    const startTime = performance.now()
    for (let r = 1; r <= 50; r++) {
      manager.step(r, planetConfig, rng)
    }
    const elapsed = performance.now() - startTime

    // 50 full ecosystem rotations must finish in under 300ms total (<6ms per rotation)
    expect(elapsed).toBeLessThan(300)

    // The in-memory array must be strictly bounded by MAX_SIMULATED_AGENTS
    const simulatedAgents = manager.getOrganisms()
    expect(simulatedAgents.length).toBeLessThanOrEqual(350)
  })

  it('starts in prebiotic stage and accumulates organic complexity toward spontaneous biogenesis', () => {
    manager.initPlanet(planetConfig)
    const rng = new SeededRNG(42)

    let summary = manager.step(1, planetConfig, rng)
    expect(summary.totalPopulation).toBe(0)
    expect(summary.prebioticState.stage).toBe('prebiotic')

    // Run until biogenesis occurs
    for (let r = 2; r <= 35; r++) {
      summary = manager.step(r, planetConfig, rng)
      if (summary.totalPopulation > 0) break
    }

    expect(summary.totalPopulation).toBeGreaterThan(0)
    expect(summary.prebioticState.stage).toBe('inhabited')
  })

  it('exports and restores population state with full fidelity', () => {
    manager.initPlanet(planetConfig)
    const rng = new SeededRNG(42)
    manager.sparkBiogenesis(planetConfig, rng)

    // Advance 5 steps
    for (let r = 1; r <= 5; r++) {
      manager.step(r, planetConfig, rng)
    }

    const exported = manager.exportState()
    expect(exported.species.length).toBeGreaterThan(0)
    expect(exported.organisms.length).toBeGreaterThan(0)
    expect(exported.prebiotic.stage).toBe('inhabited')

    const newManager = new PopulationManager()
    newManager.restoreState(exported, planetConfig)

    expect(newManager.getSpeciesList().length).toBe(exported.species.length)
    expect(newManager.getOrganisms().length).toBe(exported.organisms.length)

    // Verify it continues stepping normally after restore
    const postStep = newManager.step(6, planetConfig, rng)
    expect(postStep.totalPopulation).toBeGreaterThan(0)
    expect(postStep.generation).toBeGreaterThan(0)
  })

  it('automatically triggers secondary biogenesis when extinct life re-emerges in fertile environment', () => {
    manager.initPlanet(planetConfig)
    const rng = new SeededRNG(777)

    // 1. Spark initial life
    manager.sparkBiogenesis(planetConfig, rng)
    expect(manager.getOrganisms().length).toBeGreaterThan(0)

    // 2. Simulate total extinction
    manager.restoreState(
      {
        currentGeneration: 5,
        nextOrganismId: 100,
        nextSpeciesId: 10,
        species: [],
        organisms: [],
        prebiotic: {
          stage: 'inhabited',
          organicComplexity: 1.0,
        },
      },
      planetConfig
    )

    // Step 1: Detects 0 organisms, transitions to extinct
    const extinctStep = manager.step(1, planetConfig, rng)
    expect(extinctStep.totalPopulation).toBe(0)
    expect(extinctStep.prebioticState.stage).toBe('extinct')

    // Advance until secondary abiogenesis triggers spontaneous resurgence
    let resurgenceStep = extinctStep
    for (let r = 2; r <= 40; r++) {
      resurgenceStep = manager.step(r, planetConfig, rng)
      if (resurgenceStep.totalPopulation > 0) break
    }

    // A brand new biosphere has spontaneously formed!
    expect(resurgenceStep.totalPopulation).toBeGreaterThan(0)
    expect(resurgenceStep.prebioticState.stage).toBe('inhabited')
    expect(resurgenceStep.speciesSummaries.length).toBeGreaterThan(0)
  })

  it('supports continuous chemical catalysts and de novo biogenesis in an inhabited biosphere', () => {
    manager.initPlanet(planetConfig)
    const rng = new SeededRNG(101)

    // Spark initial life
    manager.sparkBiogenesis(planetConfig, rng)
    const initialSpeciesCount = manager.getSpeciesList().length
    expect(initialSpeciesCount).toBe(1)

    // Trigger interactive catalysts in living world
    manager.triggerChemicalCatalyst('spark')
    manager.triggerChemicalCatalyst('vent')

    // Step simulation - verify prebiotic state runs parallel in inhabited era
    const stepResult = manager.step(1, planetConfig, rng)
    expect(stepResult.prebioticState.stage).toBe('inhabited')
    expect(stepResult.prebioticState.chemicalPhase).toBe('biogeochemical_flux')
    expect(stepResult.prebioticState.bioticFeedbackFlux).toBeGreaterThan(0)

    // Trigger de novo microbial synthesis from saturated chemical reservoir
    const newSpecies = manager.triggerDeNovoBiogenesis(planetConfig, rng, 20, 1)
    expect(newSpecies).not.toBeNull()
    expect(manager.getSpeciesList().length).toBe(2)

    // Ensure de novo speciation event was recorded
    const nextStep = manager.step(2, planetConfig, rng)
    const deNovoEvent = nextStep.speciationEvents.find(
      (e) => e.eventType === 'de_novo_chemical_synthesis'
    )
    expect(deNovoEvent).toBeDefined()
    expect(deNovoEvent?.description).toContain('Khởi sinh hóa học song song')
  })

  it('enforces strict trophic food chain dependency: predators/herbivores collapse without lower food sources', () => {
    manager.initPlanet(planetConfig)
    const rng = new SeededRNG(555)

    // Create a mock carnivore species with 0 prey/herbivores on the planet
    const prebioticEngine = new PrebioticEngine()
    const carnivoreGenotype = prebioticEngine.generatePrimordialGenotype(
      planetConfig,
      'carbon_organic'
    )

    const carnivoreSpecies = new Species(
      'sp_carnivore_only',
      'Thú Ăn Thịt Cô Đơn',
      carnivoreGenotype,
      1,
      0,
      '#f43f5e'
    )

    // Seed carnivores into manager directly without any producers or prey
    const carnivores = [
      new Organism('org_c1', 'sp_carnivore_only', carnivoreGenotype, 1, 8.0, 1, 0),
      new Organism('org_c2', 'sp_carnivore_only', carnivoreGenotype, 1, 8.0, 1, 0),
    ]

    manager.restoreState(
      {
        currentGeneration: 1,
        nextOrganismId: 10,
        nextSpeciesId: 5,
        species: [
          {
            id: carnivoreSpecies.id,
            name: carnivoreSpecies.name,
            color: carnivoreSpecies.color,
            generation: 1,
            emergenceRotation: 1,
            isExtinct: false,
            extinctionRotation: null,
            foundingGenotype: carnivoreGenotype,
          },
        ],
        organisms: carnivores.map((c) => ({
          id: c.id,
          speciesId: c.speciesId,
          genotype: c.genotype,
          generation: c.generation,
          energy: c.energy,
          cohortWeight: c.cohortWeight,
          cellId: c.cellId,
          ageRotations: c.ageRotations,
          fitness: c.fitness,
        })),
        prebiotic: {
          stage: 'inhabited',
          organicComplexity: 1.0,
        },
      },
      planetConfig
    )

    // Ensure the restored species has carnivore traits for test verification
    const sp = manager.getSpeciesList()[0]!
    sp.traits = {
      ...sp.traits,
      trophicRole: 'carnivore',
      tier: 'advanced',
    }

    // Step 1: Without prey, carnivores experience severe starvation and cannot reproduce
    manager.step(1, planetConfig, rng)

    // Verify energy drained and population cannot expand
    const remainingCarnivores = manager.getOrganisms()
    // If any survived step 1, their energy should have dropped significantly
    for (const org of remainingCarnivores) {
      expect(org.energy).toBeLessThan(8.0)
    }

    // Step several more rotations: with no food source at all, they must go extinct
    for (let r = 2; r <= 8; r++) {
      manager.step(r, planetConfig, rng)
    }

    // Population collapsed to 0
    expect(manager.getOrganisms().length).toBe(0)
  })

  it('microorganisms develop at massive scale with high biodiversity and rapid speciation', () => {
    manager.seedPrimordialLife(planetConfig, 30)
    const rng = new SeededRNG(999)

    const allEmittedSpeciationEvents: SpeciationEvent[] = []

    // Run 30 rotations of evolutionary simulation
    let latestSummary = manager.step(1, planetConfig, rng)
    allEmittedSpeciationEvents.push(...latestSummary.speciationEvents)
    for (let r = 2; r <= 35; r++) {
      latestSummary = manager.step(r, planetConfig, rng)
      allEmittedSpeciationEvents.push(...latestSummary.speciationEvents)
    }

    // 1. Massive scale: total population (cohort weights) should expand significantly
    expect(latestSummary.totalPopulation).toBeGreaterThan(100)

    // 2. High biodiversity: speciation distance threshold 0.12 and higher mutation rate 0.12 produce multiple active microbial strains
    const speciesList = manager.getSpeciesList()
    expect(speciesList.length).toBeGreaterThanOrEqual(3)

    // 3. Speciation events are properly recorded with tier descriptions
    expect(allEmittedSpeciationEvents.length).toBeGreaterThanOrEqual(3)
  })

  it('flora strictly depends on microbial biomass and flourishes under high microbial biodiversity', () => {
    const rng = new SeededRNG(777)
    const prebioticEngine = new PrebioticEngine()
    const plantGenotype = prebioticEngine.generatePrimordialGenotype(
      planetConfig,
      'carbon_organic'
    )

    // Scenario A: Flora without microbial foundation (globalMicrobeBiomass = 0)
    const plantSpeciesOnly = new Species(
      'sp_flora_isolated',
      'Thảo Mộc Cô Lập',
      plantGenotype,
      1,
      0,
      '#10b981'
    )

    manager.restoreState(
      {
        currentGeneration: 1,
        nextOrganismId: 20,
        nextSpeciesId: 5,
        species: [
          {
            id: plantSpeciesOnly.id,
            name: plantSpeciesOnly.name,
            color: plantSpeciesOnly.color,
            generation: 1,
            emergenceRotation: 1,
            isExtinct: false,
            extinctionRotation: null,
            foundingGenotype: plantGenotype,
          },
        ],
        organisms: [
          new Organism('org_p1', 'sp_flora_isolated', plantGenotype, 1, 8.0, 5, 0),
          new Organism('org_p2', 'sp_flora_isolated', plantGenotype, 1, 8.0, 5, 0),
        ].map((o) => ({
          id: o.id,
          speciesId: o.speciesId,
          genotype: o.genotype,
          generation: o.generation,
          energy: o.energy,
          cohortWeight: o.cohortWeight,
          cellId: o.cellId,
          ageRotations: o.ageRotations,
          fitness: o.fitness,
        })),
        prebiotic: {
          stage: 'inhabited',
          organicComplexity: 1.0,
        },
      },
      planetConfig
    )

    const floraSp = manager.getSpeciesList()[0]!
    floraSp.traits = {
      ...floraSp.traits,
      domain: 'flora',
      domainLabel: 'Thực Vật',
      tier: 'simple_multicellular',
      trophicRole: 'producer',
    }

    // Step 1: Without microbial biomass (<= 10), flora cannot reproduce
    manager.step(1, planetConfig, rng)
    // No new offspring should have been created without microbial foundation
    const floraAfterStep1 = manager.getOrganisms()
    expect(floraAfterStep1.length).toBeLessThanOrEqual(2)

    // Scenario B: Flora WITH thriving microbial foundation
    const microbeGenotype = prebioticEngine.generatePrimordialGenotype(
      planetConfig,
      'carbon_organic'
    )
    const microbeSpecies = new Species(
      'sp_microbe_foundation',
      'Vi Sinh Nền Tảng',
      microbeGenotype,
      1,
      1,
      '#06b6d4'
    )

    manager.restoreState(
      {
        currentGeneration: 1,
        nextOrganismId: 100,
        nextSpeciesId: 10,
        species: [
          {
            id: plantSpeciesOnly.id,
            name: plantSpeciesOnly.name,
            color: plantSpeciesOnly.color,
            generation: 1,
            emergenceRotation: 1,
            isExtinct: false,
            extinctionRotation: null,
            foundingGenotype: plantGenotype,
          },
          {
            id: microbeSpecies.id,
            name: microbeSpecies.name,
            color: microbeSpecies.color,
            generation: 1,
            emergenceRotation: 1,
            isExtinct: false,
            extinctionRotation: null,
            foundingGenotype: microbeGenotype,
          },
        ],
        organisms: [
          // Thriving microbial bedrock: 100 biomass
          new Organism('org_m1', 'sp_microbe_foundation', microbeGenotype, 1, 10.0, 100, 0),
          // Flora organism
          new Organism('org_p_rich', 'sp_flora_isolated', plantGenotype, 1, 8.0, 10, 0),
          new Organism('org_p_rich2', 'sp_flora_isolated', plantGenotype, 1, 8.0, 10, 0),
        ].map((o) => ({
          id: o.id,
          speciesId: o.speciesId,
          genotype: o.genotype,
          generation: o.generation,
          energy: o.energy,
          cohortWeight: o.cohortWeight,
          cellId: o.cellId,
          ageRotations: o.ageRotations,
          fitness: o.fitness,
        })),
        prebiotic: {
          stage: 'inhabited',
          organicComplexity: 1.0,
        },
      },
      planetConfig
    )

    const restoredFlora = manager.getSpeciesList().find((s) => s.id === 'sp_flora_isolated')!
    restoredFlora.traits = {
      ...restoredFlora.traits,
      domain: 'flora',
      domainLabel: 'Thực Vật',
      tier: 'simple_multicellular',
      trophicRole: 'producer',
    }

    const restoredMicrobe = manager.getSpeciesList().find((s) => s.id === 'sp_microbe_foundation')!
    restoredMicrobe.traits = {
      ...restoredMicrobe.traits,
      domain: 'microbe',
      tier: 'unicellular',
      trophicRole: 'producer',
    }

    // Step with thriving microbial foundation: flora reproduces successfully and thrives!
    manager.step(1, planetConfig, rng)
    const floraAfterSymbiosis = manager
      .getOrganisms()
      .filter((o) => o.speciesId === 'sp_flora_isolated')
    expect(floraAfterSymbiosis.length).toBeGreaterThan(0)
    // Flora should have maintained or gained energy from microbial nutrient symbiosis
    expect(floraAfterSymbiosis[0]!.energy).toBeGreaterThan(5.0)
  })

  it('follows the sequential 6-stage biological milestone pathway and never jumps directly from microbes to fauna', () => {
    manager.seedPrimordialLife(planetConfig, 40)
    const rng = new SeededRNG(777)

    // Run 30 rotations
    for (let r = 1; r <= 30; r++) {
      manager.step(r, planetConfig, rng)
    }

    const species = manager.getSpeciesList()
    expect(species.length).toBeGreaterThanOrEqual(1)

    for (const sp of species) {
      expect([
        'prokaryote',
        'eukaryote',
        'simple_multicellular',
        'differentiated_tissue',
        'primitive_animal',
        'complex_bilaterian',
        'advanced',
        'sapient',
        'unicellular',
        'complex_multicellular',
      ]).toContain(sp.traits.tier)

      // Microbes / prokaryotes / eukaryotes / simple multicellular / differentiated tissue CANNOT be fauna
      if (
        sp.traits.tier === 'prokaryote' ||
        sp.traits.tier === 'eukaryote' ||
        sp.traits.tier === 'simple_multicellular' ||
        sp.traits.tier === 'differentiated_tissue' ||
        sp.traits.tier === 'unicellular'
      ) {
        expect(sp.traits.domain).not.toBe('fauna')
      }

      // If fauna exists, it must be primitive_animal, complex_bilaterian, advanced, or sapient
      if (sp.traits.domain === 'fauna') {
        expect([
          'primitive_animal',
          'complex_bilaterian',
          'advanced',
          'sapient',
          'complex_multicellular',
        ]).toContain(sp.traits.tier)
      }
    }
  })

  it('enforces extinction of fauna herbivores when plant/flora cover is extinct, even if microbes exist', () => {
    manager.initPlanet(planetConfig)
    const rng = new SeededRNG(777)

    const prebioticEngine = new PrebioticEngine()
    const microbeGenotype = prebioticEngine.generatePrimordialGenotype(
      planetConfig,
      'cyanobacteria'
    )

    // Dedicated herbivore genotype: low metabolic rate (0.2) + moderate mobility (0.5)
    // In TaxonomyEngine at gen 25, this evaluates to: tier = 'complex_bilaterian', domain = 'fauna', trophicRole = 'herbivore'
    const herbivoreGenotype = {
      genes: {
        thermalOptimum: GeneExpression.createGene('thermalOptimum', 0.5),
        thermalRange: GeneExpression.createGene('thermalRange', 0.5),
        waterConservation: GeneExpression.createGene('waterConservation', 0.5),
        metabolicEfficiency: GeneExpression.createGene('metabolicEfficiency', 0.2),
        reproductiveInvestment: GeneExpression.createGene('reproductiveInvestment', 0.5),
        structuralArmor: GeneExpression.createGene('structuralArmor', 0.3),
        mobilityFactor: GeneExpression.createGene('mobilityFactor', 0.5),
      },
    }

    // Species 1: Microbe autotroph (Cyanobacteria) in ocean cell 0
    const microbeSpecies = new Species(
      'sp_microbe_producer',
      'Vi khuẩn quang hợp',
      microbeGenotype,
      1,
      1,
      '#06b6d4',
      planetConfig
    )

    // Species 2: Metazoan Herbivore (Fauna) in land cell 10 at generation 25
    const herbivoreSpecies = new Species(
      'sp_fauna_herbivore',
      'Động vật ăn thực vật',
      herbivoreGenotype,
      1,
      0,
      '#10b981',
      planetConfig
    )
    herbivoreSpecies.generation = 25
    herbivoreSpecies.updateTraits(planetConfig)

    expect(herbivoreSpecies.traits.domain).toBe('fauna')
    expect(herbivoreSpecies.traits.trophicRole).toBe('herbivore')

    manager.restoreState(
      {
        currentGeneration: 25,
        nextOrganismId: 10,
        nextSpeciesId: 5,
        species: [
          {
            id: microbeSpecies.id,
            name: microbeSpecies.name,
            color: microbeSpecies.color,
            generation: 1,
            emergenceRotation: 1,
            isExtinct: false,
            extinctionRotation: null,
            foundingGenotype: microbeGenotype,
          },
          {
            id: herbivoreSpecies.id,
            name: herbivoreSpecies.name,
            color: herbivoreSpecies.color,
            generation: 25,
            emergenceRotation: 1,
            isExtinct: false,
            extinctionRotation: null,
            foundingGenotype: herbivoreGenotype,
          },
        ],
        organisms: [
          // 50 cyanobacteria in cell 0
          new Organism('org_m1', 'sp_microbe_producer', microbeGenotype, 1, 8.0, 50, 0),
          // 20 fauna herbivores in cell 10
          new Organism('org_h1', 'sp_fauna_herbivore', herbivoreGenotype, 25, 8.0, 20, 10),
          new Organism('org_h2', 'sp_fauna_herbivore', herbivoreGenotype, 25, 8.0, 20, 10),
        ],
        prebiotic: {
          stage: 'inhabited',
          organicComplexity: 1.0,
        },
      },
      planetConfig
    )

    // Step 1: Plants (flora) are extinct (0 flora species on the planet).
    // Fauna herbivores must NOT multiply; they should starve.
    const summary1 = manager.step(1, planetConfig, rng)

    const herbSummary1 = summary1.speciesSummaries.find((s) => s.id === 'sp_fauna_herbivore')!
    expect(herbSummary1.hungerState).toBe('starving')
    expect(herbSummary1.foodChainSummary).toContain('chết đói')

    // Herbivore population must not expand:
    expect(herbSummary1.population).toBeLessThanOrEqual(40)

    // Step several more rotations:
    for (let r = 2; r <= 8; r++) {
      manager.step(r, planetConfig, rng)
    }

    // The fauna herbivores must collapse and go extinct due to lack of plant cover
    const finalSummary = manager.step(9, planetConfig, rng)
    const finalHerb = finalSummary.speciesSummaries.find((s) => s.id === 'sp_fauna_herbivore')
    expect(finalHerb).toBeUndefined()
    expect(manager.getSpeciesList().find((s) => s.id === 'sp_fauna_herbivore')).toBeUndefined()
    expect(finalSummary.extinctSpeciesCount).toBeGreaterThanOrEqual(1)
  })

  it('purges extinct species completely from speciesMap and summaries to optimize performance', () => {
    const manager = new PopulationManager()
    const planetConfig = GenesisEngine.generatePlanet({}, 42)
    manager.initPlanet(planetConfig)
    const rng = new SeededRNG(123)

    const genotype = {
      genes: {
        thermalOptimum: GeneExpression.createGene('thermalOptimum', 0.5),
        thermalRange: GeneExpression.createGene('thermalRange', 0.5),
        waterConservation: GeneExpression.createGene('waterConservation', 0.5),
        metabolicEfficiency: GeneExpression.createGene('metabolicEfficiency', 0.5),
        reproductiveInvestment: GeneExpression.createGene('reproductiveInvestment', 0.5),
        structuralArmor: GeneExpression.createGene('structuralArmor', 0.5),
        mobilityFactor: GeneExpression.createGene('mobilityFactor', 0.5),
      },
    }

    const doomedSpecies = new Species('sp_doomed', 'Doomed Species', genotype, 1, 0, '#ffffff', planetConfig)
    const healthySpecies = new Species('sp_healthy', 'Healthy Species', genotype, 1, 0, '#00ff00', planetConfig)

    manager.restoreState(
      {
        currentGeneration: 5,
        nextOrganismId: 10,
        nextSpeciesId: 5,
        species: [
          {
            id: doomedSpecies.id,
            name: doomedSpecies.name,
            color: doomedSpecies.color,
            generation: 5,
            emergenceRotation: 1,
            isExtinct: false,
            extinctionRotation: null,
            foundingGenotype: genotype,
          },
          {
            id: healthySpecies.id,
            name: healthySpecies.name,
            color: healthySpecies.color,
            generation: 5,
            emergenceRotation: 1,
            isExtinct: false,
            extinctionRotation: null,
            foundingGenotype: genotype,
          },
        ],
        organisms: [
          // 0 organisms for doomed species
          // 100 organisms for healthy species in ocean cell
          new Organism('org_healthy_1', 'sp_healthy', genotype, 5, 10.0, 100, 0),
        ],
        prebiotic: {
          stage: 'inhabited',
          organicComplexity: 1.0,
        },
      },
      planetConfig
    )

    expect(manager.getSpeciesList().length).toBe(2)

    // Step 1: Detects doomedSpecies has 0 organisms, purges it
    const summary = manager.step(1, planetConfig, rng)

    // Doomed species must be completely wiped from speciesMap and speciesSummaries
    expect(manager.getSpeciesList().length).toBe(1)
    expect(manager.getSpeciesList().find((s) => s.id === 'sp_doomed')).toBeUndefined()
    expect(summary.speciesSummaries.find((s) => s.id === 'sp_doomed')).toBeUndefined()
    expect(summary.activeSpeciesCount).toBe(1)
    expect(summary.extinctSpeciesCount).toBe(1)

    // Exported state must not contain doomed species
    const exported = manager.exportState()
    expect(exported.species.find((s) => s.id === 'sp_doomed')).toBeUndefined()
  })

  it('automatically sparks a new microbial lineage when parallel chemistry saturates', () => {
    const manager = new PopulationManager()
    const planetConfig = GenesisEngine.generatePlanet({}, 42)
    manager.initPlanet(planetConfig)
    const rng = new SeededRNG(999)

    // Spark initial life
    manager.sparkBiogenesis(planetConfig, rng)
    expect(manager.getSpeciesList().length).toBe(1)

    // Catalyze chemistry to saturate prebiotic reservoir
    for (let i = 0; i < 5; i++) {
      manager.triggerChemicalCatalyst('spark')
      manager.triggerChemicalCatalyst('vent')
    }

    // Step several rotations (>= 3)
    let speciationCount = 0
    for (let r = 2; r <= 15; r++) {
      const summary = manager.step(r, planetConfig, rng)
      const deNovoEvent = summary.speciationEvents.find(
        (e) => e.eventType === 'de_novo_chemical_synthesis'
      )
      if (deNovoEvent) {
        speciationCount++
        expect(deNovoEvent.eventType).toBe('de_novo_chemical_synthesis')
        expect(deNovoEvent.description).toContain('Dòng vi sinh mới')
        break
      }
    }

    // A new microbial lineage was automatically sparked from prebiotic chemistry
    expect(speciationCount).toBeGreaterThanOrEqual(1)
    expect(manager.getSpeciesList().length).toBeGreaterThanOrEqual(2)
  })
})
