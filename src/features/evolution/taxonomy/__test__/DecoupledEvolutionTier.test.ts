import { describe, it, expect } from 'vitest'
import { GenesisEngine } from '../../../genesis/services/GenesisEngine.js'
import { PrebioticEngine } from '../../abiogenesis/PrebioticEngine.js'
import { UniversalTaxonomyEngine } from '../UniversalTaxonomyEngine.js'
import { Species } from '../../population/Species.js'
import { PopulationManager } from '../../population/PopulationManager.js'
import { SeededRNG } from '../../../../shared/utils/seeded-rng.js'

describe('Decoupled Evolution Tier & Trait-Driven Taxonomy', () => {
  const prebioticEngine = new PrebioticEngine()
  const defaultPlanet = GenesisEngine.generatePlanet({}, 42)
  const primordialGenotype = prebioticEngine.generatePrimordialGenotype(defaultPlanet, 'cyanobacteria')

  it('prokaryotes stay prokaryotes across deep generations without becoming animals', () => {
    // A single-celled cyanobacterium
    const tierGen1 = UniversalTaxonomyEngine.deriveEvolutionTier(primordialGenotype, defaultPlanet)
    expect(tierGen1).toBe('prokaryote')

    // Instantiate species and advance its generation count to 50
    const species = new Species('sp_test', 'Test Microbe', primordialGenotype, 0, 0, undefined, defaultPlanet, 'prokaryote')
    expect(species.traits.tier).toBe('prokaryote')
    expect(species.traits.domain).toBe('microbe')

    species.generation = 50
    const ascended = species.updateTraits(defaultPlanet, 'prokaryote')
    // Should NOT ascend to sapient or animal just because generation is 50!
    expect(ascended).toBe(false)
    expect(species.traits.tier).toBe('prokaryote')
    expect(species.traits.domain).toBe('microbe')
  })

  it('PopulationManager maintains microbial domain and does not force sapient at generation 40', () => {
    const manager = new PopulationManager()
    const rng = new SeededRNG(12345)
    manager.initPlanet(defaultPlanet)

    // Trigger biogenesis
    manager.triggerBiogenesis(defaultPlanet, rng, 20)

    const speciesList = manager.getSpeciesList()
    expect(speciesList.length).toBeGreaterThan(0)
    const founding = speciesList[0]!

    expect(founding.traits.tier).toBe('prokaryote')
    expect(founding.traits.domain).toBe('microbe')
  })
})
