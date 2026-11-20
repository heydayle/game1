import type { PlanetConfig } from '../../genesis/types/genesis.js'
import type { Genotype, SpeciesSummary } from '../genetics/types.js'
import { TaxonomyEngine } from '../taxonomy/TaxonomyEngine.js'
import { UniversalTaxonomyEngine } from '../taxonomy/UniversalTaxonomyEngine.js'
import type { BiologicalTraits, EvolutionTier, PopulationDemographics } from '../taxonomy/types.js'
import type { Organism } from './Organism.js'

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
    planetConfig?: PlanetConfig,
    customTier?: EvolutionTier
  ) {
    this.id = id
    this.name = name
    this.foundingGenotype = foundingGenotype
    this.emergenceRotation = emergenceRotation
    this.color = customColor ?? SPECIES_PALETTES[colorIndex % SPECIES_PALETTES.length] ?? '#10b981'
    const tier =
      customTier ??
      (planetConfig && this.generation <= 1
        ? UniversalTaxonomyEngine.deriveEvolutionTier(foundingGenotype, planetConfig)
        : undefined)
    this.traits = TaxonomyEngine.evaluateTraits(foundingGenotype, this.generation, planetConfig, tier)
  }

  /**
   * Recalculates traits and evolutionary tier as species generations advance.
   * Returns true if the species ascended to a higher tier.
   */
  updateTraits(planetConfig?: PlanetConfig, customTier?: EvolutionTier): boolean {
    const prevTier = this.traits.tier
    const tier =
      customTier ??
      (this.generation > 1
        ? undefined
        : planetConfig
          ? UniversalTaxonomyEngine.deriveEvolutionTier(this.foundingGenotype, planetConfig)
          : undefined)
    this.traits = TaxonomyEngine.evaluateTraits(this.foundingGenotype, this.generation, planetConfig, tier)
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

    // ── Population Demographics & Social Characteristics ──
    // 1. Kích thước (Size): pop
    // 2. Mật độ (Density): Số cá thể / số ô sinh thái có mặt
    const occupiedCellIds = new Set(livingMembers.map((m) => m.cellId))
    const densityPerCell = Number((pop / Math.max(1, occupiedCellIds.size)).toFixed(1))

    // 3. Tỉ lệ giới tính (Sex ratio)
    // Tế bào nhân sơ & nguyên sinh vô tính phân đôi: 100% vô tính
    // Động vật đối xứng 2 bên, thú & con người: tỉ lệ giới tính xấp xỉ 1:1 (50% Đực : 50% Cái)
    const isAsexual =
      this.traits.tier === 'prokaryote' ||
      this.traits.tier === 'unicellular' ||
      (this.traits.tier === 'eukaryote' && this.traits.domain !== 'fauna')
    const sexRatio = isAsexual
      ? { malePct: 0, femalePct: 100 }
      : { malePct: 50, femalePct: 50 }

    // 4. Nhóm tuổi (Age Structure: Trước sinh sản, Đang sinh sản, Sau sinh sản)
    let preReproductiveCount = 0
    let reproductiveCount = 0
    let postReproductiveCount = 0
    for (const m of livingMembers) {
      if (m.ageRotations < 15) {
        preReproductiveCount += m.cohortWeight
      } else if (m.ageRotations <= 50) {
        reproductiveCount += m.cohortWeight
      } else {
        postReproductiveCount += m.cohortWeight
      }
    }
    const safePop = Math.max(1, pop)
    const preReproductivePct = Math.round((preReproductiveCount / safePop) * 100)
    const reproductivePct = Math.round((reproductiveCount / safePop) * 100)
    const postReproductivePct = Math.max(0, 100 - preReproductivePct - reproductivePct)

    // 5. Kiểu phân bố (Spatial Distribution: Clumped / Uniform / Random)
    let distributionPattern: 'clumped' | 'uniform' | 'random' = 'clumped'
    let distributionLabel = 'Phân bố theo nhóm (Quần tụ quanh nguồn sống & bầy đàn)'
    if (occupiedCellIds.size >= 12) {
      distributionPattern = 'random'
      distributionLabel = 'Phân bố ngẫu nhiên (Môi trường đồng nhất, phát tán rộng)'
    } else if (occupiedCellIds.size >= 6) {
      distributionPattern = 'uniform'
      distributionLabel = 'Phân bố đồng đều (Cạnh tranh lãnh thổ cân bằng)'
    }

    // Cấp độ tế bào cấu tạo và chuyên hóa
    const isProkaryote = this.traits.tier === 'prokaryote' || this.traits.tier === 'unicellular'
    const cellularGradeDetail = {
      cellType: isProkaryote ? ('prokaryote' as const) : ('eukaryote' as const),
      cellTypeLabel: isProkaryote ? 'Tế bào nhân sơ' : 'Tế bào nhân thực',
      specialization: isProkaryote
        ? 'Tế bào nhân sơ: Không có màng nhân hoàn chỉnh, cấu tạo đơn giản, chuỗi DNA trần, phân đôi tốc độ cao'
        : this.traits.tierRank >= 6
          ? 'Tế bào nhân thực: Cơ thể đa bào cấu tạo từ hàng nghìn tỷ tế bào nhân thực chuyên hóa sâu (tế bào thần kinh, cơ, máu, biểu mô...)'
          : 'Tế bào nhân thực: Có màng nhân bảo vệ vật chất di truyền, tích hợp ti thể & lục lạp nội cộng sinh',
    }

    // Đặc điểm xã hội độc nhất nếu là Quần thể người (Homo sapiens) hoặc Sinh vật trí tuệ (Sapient)
    const isSapient = this.traits.tier === 'sapient' || this.traits.sapientArchetype === 'humanoid'
    const socialTraits = isSapient
      ? {
        isHumanoidOrSapient: true,
        socialOrganization: 'Tổ chức xã hội cấp tiến: Cấu trúc gia đình, thị tộc, đô thị hóa, pháp luật và trật tự nhà nước',
        toolUseAndTechnology: 'Chế tác công cụ lao động phức tạp, làm chủ năng lượng, tự động hóa và khoa học kỹ thuật',
        culturalTransmission: 'Ngôn ngữ, chữ viết, giáo dục truyền đạt văn hóa, đạo đức và tri thức tích lũy qua các thế hệ',
        environmentalModification: 'Khả năng cải tạo môi trường sống chủ động: Y tế kéo dài tuổi thọ, nông nghiệp, kiến trúc sinh thái',
      }
      : undefined

    const demographics: PopulationDemographics = {
      size: pop,
      densityPerCell,
      sexRatio,
      ageStructure: {
        preReproductivePct,
        reproductivePct,
        postReproductivePct,
      },
      distributionPattern,
      distributionLabel,
      cellularGradeDetail,
      socialTraits,
    }

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
      taxonomicHierarchy: this.traits.taxonomicHierarchy,
      demographics,
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

