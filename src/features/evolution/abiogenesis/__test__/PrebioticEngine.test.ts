import { describe, it, expect, beforeEach } from 'vitest'
import { PrebioticEngine } from '../PrebioticEngine.js'
import { GenesisEngine } from '../../../genesis/services/GenesisEngine.js'
import type { PlanetConfig } from '../../../genesis/types/genesis.js'

describe('PrebioticEngine', () => {
  let engine: PrebioticEngine
  let temperatePlanet: PlanetConfig

  beforeEach(() => {
    engine = new PrebioticEngine()
    temperatePlanet = GenesisEngine.generatePlanet({}, 42)
  })

  it('evaluates chemical fertility for an Earth-like temperate planet', () => {
    const chem = engine.evaluateChemistry(temperatePlanet)
    expect(chem.waterViability).toBeGreaterThan(0.5)
    expect(chem.organicAbundance).toBeGreaterThan(0.3)
    expect(chem.catalystEnergy).toBeGreaterThan(0.2)
    expect(chem.chemicalFertility).toBeGreaterThan(0.4)
  })

  it('hinders chemical synthesis on a sterile frozen iceball without heat', () => {
    const frozenPlanet: PlanetConfig = {
      ...temperatePlanet,
      surfaceTemperatureCelsius: -95,
      oceanLevel: 0.1,
      initialResources: {
        ...temperatePlanet.initialResources,
        geothermalEnergy: 5,
        solarIrradianceWatts: 200,
      },
    }

    const chem = engine.evaluateChemistry(frozenPlanet)
    expect(chem.waterViability).toBe(0)
    expect(chem.chemicalFertility).toBeLessThan(0.3)
  })

  it('accumulates organic complexity over simulation rotations through phases', () => {
    expect(engine.getOrganicComplexity()).toBe(0)

    for (let r = 1; r <= 10; r++) {
      engine.step(r, temperatePlanet)
    }

    expect(engine.getOrganicComplexity()).toBeGreaterThan(0.15)
    expect(engine.getMonomerConcentration()).toBeGreaterThan(0)
  })

  it('progresses through chemical evolution phases from monomers to protocells', () => {
    let state = engine.step(1, temperatePlanet)
    expect(state.chemicalPhase).toBe('monomer_synthesis')
    expect(state.chemicalPhaseLabel).toContain('Monomer')

    // Accelerate monomers and polymers
    engine.catalyzeSpark()
    engine.catalyzeSpark()
    engine.catalyzeVent()

    state = engine.step(2, temperatePlanet)
    expect(state.monomerConcentration).toBeGreaterThanOrEqual(0.3)
    expect(['polymer_formation', 'protocell_assembly', 'microbial_emergence']).toContain(
      state.chemicalPhase
    )
  })

  it('flags biogenesisReadiness when organic complexity crosses threshold', () => {
    let state = engine.step(1, temperatePlanet)
    expect(state.stage).toBe('prebiotic')

    // Advance until ready
    for (let r = 2; r <= 15; r++) {
      state = engine.step(r, temperatePlanet)
    }

    expect(state.organicComplexity).toBeGreaterThanOrEqual(0.25)
    expect(state.biogenesisReadiness).toBe(true)
  })

  it('synthesizes primordial genotype matching hydrothermal vent archetype', () => {
    const ventPlanet: PlanetConfig = {
      ...temperatePlanet,
      initialResources: {
        ...temperatePlanet.initialResources,
        geothermalEnergy: 85,
      },
      atmosphericComposition: {
        ...temperatePlanet.atmosphericComposition,
        methane: 12.0,
      },
    }

    const chem = engine.evaluateChemistry(ventPlanet)
    expect(chem.archetype).toBe('Chemoarchaeon Primus')

    const genotype = engine.generatePrimordialGenotype(ventPlanet, chem.archetype)
    expect(genotype.genes.thermalOptimum.alleleA.value).toBeGreaterThanOrEqual(0.7)
  })

  it('maintains continuous parallel chemical evolution during inhabited era with biotic feedback', () => {
    engine.setStage('inhabited')
    engine.setMonomerConcentration(0.3)
    engine.setPolymerComplexity(0.4)
    engine.setProtocellStability(0.3)

    // Advance with biological biomass and active species present
    const state = engine.step(1, temperatePlanet, undefined, 250, 4)

    expect(state.stage).toBe('inhabited')
    expect(state.chemicalPhase).toBe('biogeochemical_flux')
    expect(state.chemicalPhaseLabel).toContain('Tuần hoàn Hóa sinh quyển')
    expect(state.bioticFeedbackFlux).toBeGreaterThan(0.3)
    expect(state.organicPoolVolume).toBeGreaterThan(0)
    expect(state.statusDescription).toContain('Parallel chemical synthesis flux')
  })

  it('supports interactive catalysts (Miller-Urey spark and vent)', () => {
    const initMonomer = engine.getMonomerConcentration()
    engine.catalyzeSpark()
    expect(engine.getMonomerConcentration()).toBeGreaterThan(initMonomer)

    const initPolymer = engine.getPolymerComplexity()
    engine.catalyzeVent()
    expect(engine.getPolymerComplexity()).toBeGreaterThan(initPolymer)
    expect(engine.getProtocellStability()).toBeGreaterThan(0)
  })

  it('flags deNovoSynthesisReady when organic pool and protocells saturate in inhabited era', () => {
    engine.setStage('inhabited')
    // Saturate chemical pool
    engine.setMonomerConcentration(0.9)
    engine.setPolymerComplexity(0.85)
    engine.setProtocellStability(0.85)
    engine.setOrganicPoolVolume(0.92)

    // Catalyst pulses to saturate organic pool
    engine.catalyzeVent()
    engine.catalyzeSpark()

    const state = engine.step(1, temperatePlanet, undefined, 300, 5)
    expect(state.deNovoSynthesisReady).toBe(true)

    // Consume de novo synthesis
    engine.consumeDeNovoBiogenesis()
    expect(engine.getDeNovoSynthesisReady()).toBe(false)
  })

  it('accumulates secondary prebiotic complexity when extinct in viable environment', () => {
    engine.setStage('extinct')
    engine.setOrganicComplexity(0.05)

    // Advance 10 rotations under favorable conditions
    let state = engine.step(1, temperatePlanet)
    for (let r = 2; r <= 10; r++) {
      state = engine.step(r, temperatePlanet)
    }

    expect(state.stage).toBe('extinct')
    expect(state.organicComplexity).toBeGreaterThan(0.2)
    expect(state.statusDescription).toContain('Secondary prebiotic synthesis')
  })

  it('degrades organic complexity when extinct in a hostile environment', () => {
    engine.setStage('extinct')
    engine.setOrganicComplexity(0.5)

    const sterilePlanet: PlanetConfig = {
      ...temperatePlanet,
      surfaceTemperatureCelsius: 110, // Boiling water, unviable
      oceanLevel: 0.05,
    }

    const state = engine.step(1, sterilePlanet)
    expect(state.organicComplexity).toBeLessThan(0.5)
    expect(state.statusDescription).toContain('Hostile environment')
  })

  it('classifies the three grand evolutionary macro-eras and planetary protocell architecture', () => {
    // 1. Initial Chemical Evolution era
    let state = engine.step(1, temperatePlanet)
    expect(state.macroEra).toBe('chemical_evolution')
    expect(state.macroEraLabel).toContain('Kỷ I: Tiến Hóa Hóa Học')
    expect(state.protocellForm).toBe('lipid_coacervate')

    // 2. Prebiological Evolution era (protocells maturing)
    engine.catalyzeSpark()
    engine.catalyzeVent()
    state = engine.step(2, temperatePlanet)
    expect(state.macroEra).toBe('prebiological_evolution')
    expect(state.macroEraLabel).toContain('Kỷ II: Tiến Hóa Tiền Sinh Học')
    expect(state.protocellComplexity).toBeGreaterThan(0.2)
    expect(state.protoMetabolismRate).toBeGreaterThan(0.2)

    // 3. Biological Evolution era (inhabited world)
    engine.setStage('inhabited')
    state = engine.step(3, temperatePlanet, undefined, 200, 3)
    expect(state.macroEra).toBe('biological_evolution')
    expect(state.macroEraLabel).toContain('Kỷ III: Tiến Hóa Sinh Học')

    // 4. Exotic Protocell Form on Frozen sub-zero world
    const cryoPlanet: PlanetConfig = {
      ...temperatePlanet,
      surfaceTemperatureCelsius: -50,
    }
    const cryoState = engine.step(1, cryoPlanet)
    expect(cryoState.protocellForm).toBe('azotosome_cryo')
    expect(cryoState.protocellFormLabel).toContain('Azotosome')
  })
})
