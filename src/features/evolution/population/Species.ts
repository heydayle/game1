import type { Genotype, SpeciesSummary } from '../genetics/types.js'
import type { Organism } from './Organism.js'
import type { BiologicalTraits } from '../taxonomy/types.js'
import { TaxonomyEngine } from '../taxonomy/TaxonomyEngine.js'
import type { PlanetConfig } from '../../genesis/types/genesis.js'

const SPECIES_PALETTES = [
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#84cc16', // Lime
  '#f97316', // Orange
  '#14b8a6', // Teal
]

export class Species {
  readonly id: string
  readonly name: string
  readonly color: string
  readonly foundingGenotype: Genotype
  readonly emergenceRotation: number

  isExtinct = false
  extinctionRotation: number | null = null
  generation = 1
  traits: BiologicalTraits

  constructor(
    id: string,
    name: string,
    foundingGenotype: Genotype,
    emergenceRotation = 0,
    colorIndex = 0,
    customColor?: string,
    planetConfig?: PlanetConfig
  ) {
    this.id = id
    this.name = name
    this.foundingGenotype = foundingGenotype
    this.emergenceRotation = emergenceRotation
    this.color = customColor ?? SPECIES_PALETTES[colorIndex % SPECIES_PALETTES.length] ?? '#10b981'
    this.traits = TaxonomyEngine.evaluateTraits(foundingGenotype, this.generation, planetConfig)
  }

  /**
   * Recalculates traits and evolutionary tier as species generations advance.
   * Returns true if the species ascended to a higher tier.
   */
  updateTraits(planetConfig?: PlanetConfig): boolean {
    const prevTier = this.traits.tier
    this.traits = TaxonomyEngine.evaluateTraits(this.foundingGenotype, this.generation, planetConfig)
    return this.traits.tier !== prevTier
  }

  toSummary(livingMembers: readonly Organism[]): SpeciesSummary {
    let pop = 0
    let weightedFitness = 0
    let weightedThermal = 0
    let weightedWater = 0
    let weightedResilience = 0

    if (livingMembers.length > 0) {
      for (const m of livingMembers) {
        const weight = m.cohortWeight
        pop += weight
        weightedFitness += m.fitness * weight
        weightedThermal += m.phenotype.thermalOptimumCelsius * weight
        weightedWater += m.phenotype.waterConservation * weight
        weightedResilience += m.phenotype.radiationResistance * weight
      }
      if (pop > 0) {
        weightedFitness /= pop
        weightedThermal /= pop
        weightedWater /= pop
        weightedResilience /= pop
      }
    }

    const lifespan =
      this.isExtinct && this.extinctionRotation !== null
        ? Math.max(1, this.extinctionRotation - this.emergenceRotation)
        : undefined

    let foodChainSummary = this.traits.dietDescription
    if (this.traits.tier === 'prokaryote') {
      foodChainSummary = 'Hấp thụ hóa năng vô cơ/hữu cơ, phân đôi sinh khối quy mô cực lớn'
    } else if (this.traits.tier === 'eukaryote') {
      foodChainSummary = 'Nội cộng sinh ti thể/lục lạp, dị dưỡng hoặc quang dưỡng phức tạp'
    } else if (this.traits.tier === 'simple_multicellular') {
      foodChainSummary = 'Tập đoàn đa bào, phân phối dưỡng chất màng tế bào hợp tác'
    } else if (this.traits.tier === 'differentiated_tissue') {
      foodChainSummary = 'Mô biểu mô hấp thụ & tiêu hóa nội/ngoại bào sơ khai'
    } else if (this.traits.tier === 'primitive_animal') {
      foodChainSummary = 'Lọc hạt hữu cơ / xoang vị ruột túi đối xứng tỏa tròn'
    } else if (this.traits.tier === 'complex_bilaterian') {
      foodChainSummary = 'Ống tiêu hóa 2 đầu hoàn chỉnh (miệng - hậu môn), săn mồi hoặc ăn cỏ'
    } else if (this.traits.domain === 'flora') {
      foodChainSummary = 'Quang dưỡng thích nghi từ bộ gen vi sinh & hấp thụ khoáng'
    } else if (this.traits.tier === 'unicellular') {
      foodChainSummary = 'Hấp thụ hóa năng/quang năng, phân đôi sinh khối quy mô lớn'
    }

    const hungerState: 'satiated' | 'hungry' | 'starving' =
      pop <= 0 ? 'starving' : weightedFitness >= 0.6 ? 'satiated' : weightedFitness >= 0.3 ? 'hungry' : 'starving'

    return {
      id: this.id,
      name: this.name,
      color: this.color,
      population: pop,
      generation: this.generation,
      averageFitness: Number(weightedFitness.toFixed(3)),
      dominantTraits: {
        thermalOptimum: Math.round(weightedThermal),
        waterConservation: Number(weightedWater.toFixed(2)),
        resilience: Number(weightedResilience.toFixed(2)),
      },
      isExtinct: this.isExtinct,
      emergenceRotation: this.emergenceRotation,
      extinctionRotation: this.extinctionRotation,
      lifespanRotations: lifespan,
      tier: this.traits.tier,
      tierLabel: this.traits.tierLabel,
      tierRank: this.traits.tierRank,
      scientificName: this.traits.scientificName,
      biologicalTraits: this.traits,
      domain: this.traits.domain,
      domainLabel: this.traits.domainLabel,
      domainIcon: this.traits.domainIcon,
      trophicRole: this.traits.trophicRole,
      trophicRoleLabel: this.traits.trophicRoleLabel,
      trophicLevel: this.traits.trophicLevel,
      foodChainSummary,
      hungerState,
    }
  }
}

