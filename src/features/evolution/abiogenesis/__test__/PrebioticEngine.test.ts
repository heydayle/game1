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

  it('accumulates organic complexity over simulation rotations', () => {
    expect(engine.getOrganicComplexity()).toBe(0)

    for (let r = 1; r <= 10; r++) {
      engine.step(r, temperatePlanet)
    }

    expect(engine.getOrganicComplexity()).toBeGreaterThan(0.15)
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
})

