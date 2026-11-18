import { describe, expect, it } from 'vitest'
import { GenesisEngine } from '../../../genesis/services/GenesisEngine.js'
import type { PlanetConfig } from '../../../genesis/types/genesis.js'
import { PrebioticEngine } from '../../abiogenesis/PrebioticEngine.js'
import { TaxonomyEngine } from '../TaxonomyEngine.js'

describe('TaxonomyEngine - Authentic 6-Stage Biological Evolution Pathway', () => {
  const prebioticEngine = new PrebioticEngine()
  const defaultPlanet = GenesisEngine.generatePlanet({}, 42)
  const primordialGenotype = prebioticEngine.generatePrimordialGenotype(defaultPlanet, 'cyanobacteria')

  it('Stage 1 (Prokaryotes): evaluates primordial life as prokaryote (Tế bào nhân sơ)', () => {
    const traits = TaxonomyEngine.evaluateTraits(primordialGenotype, 1, defaultPlanet)
    expect(traits.tier).toBe('prokaryote')
    expect(traits.tierLabel).toBe('Tế bào nhân sơ')
    expect(traits.tierRank).toBe(1)
    expect(traits.domain).toBe('microbe')
    expect(traits.domainLabel).toContain('Nhân sơ')
    expect(traits.domainIcon).toBe('🦠')
    expect(traits.bodySymmetry).toBe('none')
    expect(traits.cellularGrade).toContain('Tế bào nhân sơ')
    expect(traits.notableAdaptations).toContain('Cấu trúc nhân sơ chưa có màng nhân')
    expect(traits.notableAdaptations).toContain('Phân đôi nhị phân tốc độ cao')
    expect(traits.complexityIndex).toBeGreaterThan(0)
    expect(traits.complexityIndex).toBeLessThan(0.35)
  })

  it('Stage 2 (Eukaryotes): evolves into eukaryote via endosymbiosis (Tế bào nhân thực)', () => {
    const traits = TaxonomyEngine.evaluateTraits(primordialGenotype, 4, defaultPlanet)
    expect(traits.tier).toBe('eukaryote')
    expect(traits.tierLabel).toBe('Tế bào nhân thực')
    expect(traits.tierRank).toBe(2)
    expect(traits.domain).toBe('microbe')
    expect(traits.domainLabel).toContain('Nhân thực')
    expect(traits.domainIcon).toBe('🧫')
    expect(traits.bodySymmetry).toBe('none')
    expect(traits.cellularGrade).toContain('Màng nhân hoàn chỉnh, tích hợp ti thể & lục lạp')
    expect(traits.notableAdaptations).toContain('Màng nhân hoàn chỉnh bảo vệ vật chất di truyền')
    expect(traits.notableAdaptations).toContain('Nội cộng sinh ti thể tạo năng lượng ATP vượt trội')
  })

  it('Stage 3 (Simple Multicellular): aggregates into colonial multicellularity without true tissues', () => {
    const traits = TaxonomyEngine.evaluateTraits(primordialGenotype, 8, defaultPlanet)
    expect(traits.tier).toBe('simple_multicellular')
    expect(traits.tierLabel).toBe('Đa bào đơn giản')
    expect(traits.tierRank).toBe(3)
    // CANNOT be fauna yet! Only flora (colonial algae), fungi, or colonial microbes
    expect(['flora', 'fungi', 'microbe']).toContain(traits.domain)
    expect(traits.domain).not.toBe('fauna')
    expect(traits.bodySymmetry).toBe('asymmetrical')
    expect(traits.cellularGrade).toContain('Tập đoàn đa bào sơ khai')
  })

  it('Stage 4 (Differentiated Tissues): forms specialized cell layers and primitive tissues', () => {
    const traits = TaxonomyEngine.evaluateTraits(primordialGenotype, 14, defaultPlanet)
    expect(traits.tier).toBe('differentiated_tissue')
    expect(traits.tierLabel).toBe('Phân hóa mô & tế bào')
    expect(traits.tierRank).toBe(4)
    // CANNOT be fauna yet!
    expect(['flora', 'fungi', 'microbe']).toContain(traits.domain)
    expect(traits.domain).not.toBe('fauna')
    expect(traits.cellularGrade).toContain('Đa bào có sự phân hóa mô sơ khai')
    expect(traits.notableAdaptations).toContain('Phân hóa tế bào soma và tế bào mầm sinh sản')
  })

  it('Stage 5 (Primitive Animals): FIRST appearance of animal kingdom (Metazoa - Porifera/Cnidaria)', () => {
    const traits = TaxonomyEngine.evaluateTraits(primordialGenotype, 20, defaultPlanet)
    expect(traits.tier).toBe('primitive_animal')
    expect(traits.tierLabel).toBe('Động vật nguyên thủy')
    expect(traits.tierRank).toBe(5)
    // Metazoa first appears here with radial symmetry or sponges
    expect(['fauna', 'flora']).toContain(traits.domain)
    if (traits.domain === 'fauna') {
      expect(traits.domainIcon).toBe('🪸')
      expect(traits.domainLabel).toContain('Động vật (Nguyên thủy)')
    }
    expect(traits.bodySymmetry).toBe('radial')
    expect(traits.cellularGrade).toContain('2 lá phôi, bọt biển / ruột khoang tỏa tròn')
    expect(traits.notableAdaptations).toContain('Cơ thể đối xứng tỏa tròn (Radial) hoặc bất đối xứng (Porifera)')
    expect(traits.notableAdaptations).toContain('Mạng lưới tế bào thần kinh phân tán (Nerve Net)')
  })

  it('Stage 6 (Complex Bilaterians): evolves bilateral symmetry, cephalization and specialized organs', () => {
    const traits = TaxonomyEngine.evaluateTraits(primordialGenotype, 26, defaultPlanet)
    expect(traits.tier).toBe('complex_bilaterian')
    expect(traits.tierLabel).toBe('Động vật đối xứng 2 bên')
    expect(traits.tierRank).toBe(6)
    expect(traits.bodySymmetry).toBe('bilateral')
    expect(traits.cellularGrade).toContain('Bilateria: 3 lá phôi, hạch não, khoang cơ thể, ống tiêu hóa 2 đầu')
    expect(traits.notableAdaptations).toContain('Đối xứng hai bên (Bilateral Symmetry) định hướng di chuyển')
    expect(traits.notableAdaptations).toContain('Hiện tượng tập trung đầu (Cephalization) hình thành hạch não')
    expect(traits.notableAdaptations).toContain('Ống tiêu hóa hoàn chỉnh 2 đầu (Miệng - Hậu môn)')
  })

  it('Stage 7 (Advanced): evolves into advanced organisms with closed circulatory system and brain', () => {
    const traits = TaxonomyEngine.evaluateTraits(primordialGenotype, 35, defaultPlanet)
    expect(traits.tier).toBe('advanced')
    expect(traits.tierLabel).toBe('Động thực vật bậc cao')
    expect(traits.tierRank).toBe(7)
    expect(traits.bodySymmetry).toBe('bilateral')
    expect(traits.notableAdaptations).toContain('Hệ thần kinh não bộ phức tạp')
    expect(traits.notableAdaptations).toContain('Hệ tuần hoàn kín với tim nhiều ngăn')
  })

  it('Stage 8 (Sapient): branches into sapient humanoid intelligence on Earth-like temperate world', () => {
    const earthLike: PlanetConfig = {
      ...defaultPlanet,
      surfaceTemperatureCelsius: 18,
      oceanLevel: 0.5,
      environmentalConditions: {
        ...defaultPlanet.environmentalConditions,
        radiationLevel: 'shielded',
      },
    }
    const traits = TaxonomyEngine.evaluateTraits(primordialGenotype, 45, earthLike)
    expect(traits.tier).toBe('sapient')
    expect(traits.tierLabel).toBe('Sinh vật trí tuệ')
    expect(traits.tierRank).toBe(8)
    expect(traits.sapientArchetype).toBe('humanoid')
    expect(traits.sapientLabel).toContain('Hình nhân')
  })

  it('branches into aquatic cephalopod sapient on ocean worlds at high generation', () => {
    const oceanWorld: PlanetConfig = {
      ...defaultPlanet,
      oceanLevel: 0.72,
      surfaceTemperatureCelsius: 22,
    }
    const traits = TaxonomyEngine.evaluateTraits(primordialGenotype, 45, oceanWorld)
    expect(traits.tier).toBe('sapient')
    expect(traits.sapientArchetype).toBe('aquatic_cephalopod')
    expect(traits.sapientLabel).toContain('Thủy tộc')
  })

  it('branches into cryo titan sapient on sub-zero worlds at high generation', () => {
    const cryoWorld: PlanetConfig = {
      ...defaultPlanet,
      surfaceTemperatureCelsius: -30,
      oceanLevel: 0.35,
    }
    const traits = TaxonomyEngine.evaluateTraits(primordialGenotype, 45, cryoWorld)
    expect(traits.tier).toBe('sapient')
    expect(traits.sapientArchetype).toBe('cryo_titan')
    expect(traits.sapientLabel).toContain('Băng giá')
  })

  it('branches into silicon crystalline sapient on extreme heat worlds at high generation', () => {
    const volcanicWorld: PlanetConfig = {
      ...defaultPlanet,
      surfaceTemperatureCelsius: 55,
      environmentalConditions: {
        ...defaultPlanet.environmentalConditions,
        radiationLevel: 'extreme',
      },
    }
    const traits = TaxonomyEngine.evaluateTraits(primordialGenotype, 45, volcanicWorld)
    expect(traits.tier).toBe('sapient')
    expect(traits.sapientArchetype).toBe('silicon_crystalline')
    expect(traits.sapientLabel).toContain('Tinh thể Silic')
  })

  it('branches into aero avian sapient on dense atmosphere worlds at high generation', () => {
    const denseWorld: PlanetConfig = {
      ...defaultPlanet,
      atmosphericComposition: {
        ...defaultPlanet.atmosphericComposition,
        pressureAtm: 2.5,
      },
      surfaceTemperatureCelsius: 20,
      oceanLevel: 0.45,
    }
    const traits = TaxonomyEngine.evaluateTraits(primordialGenotype, 45, denseWorld)
    expect(traits.tier).toBe('sapient')
    expect(traits.sapientArchetype).toBe('aerial_avian')
    expect(traits.sapientLabel).toContain('Dực nhân')
  })

  it('determines speculative non-Earth planetary lineages and morphology across alien worlds', () => {
    // 1. Cryo-Methanogen world
    const cryoPlanet: PlanetConfig = {
      ...defaultPlanet,
      surfaceTemperatureCelsius: -45,
    }
    const cryoTraits = TaxonomyEngine.evaluateTraits(primordialGenotype, 1, cryoPlanet)
    expect(cryoTraits.planetaryLineage).toBe('cryo_methanogen')
    expect(cryoTraits.planetaryLineageLabel).toContain('Mê-tan')
    expect(cryoTraits.morphology).toContain('azotosome')
    expect(cryoTraits.scientificName).toBe('Azotobacter cryophilus')

    // 2. Silico-Crystalline world
    const siliconPlanet: PlanetConfig = {
      ...defaultPlanet,
      surfaceTemperatureCelsius: 70,
      elementalComposition: {
        ...defaultPlanet.elementalComposition,
        silicatesRock: 75,
      },
    }
    const siliconTraits = TaxonomyEngine.evaluateTraits(primordialGenotype, 1, siliconPlanet)
    expect(siliconTraits.planetaryLineage).toBe('silico_crystalline')
    expect(siliconTraits.planetaryLineageLabel).toContain('Tinh thể Silic')
    expect(siliconTraits.morphology).toContain('tinh thể silic')
    expect(siliconTraits.scientificName).toBe('Silicococcus piezoelectrus')

    // 3. Species naming with planetary lineage
    const siliconName = TaxonomyEngine.generateSpeciesDisplayName(
      'prokaryote',
      undefined,
      'microbe',
      'producer',
      1,
      'silico_crystalline'
    )
    expect(siliconName).toBe('Nguyên bào Silic Nhân sơ A')

    const cryoName = TaxonomyEngine.generateSpeciesDisplayName(
      'prokaryote',
      undefined,
      'microbe',
      'producer',
      2,
      'cryo_methanogen'
    )
    expect(cryoName).toBe('Vi sinh Mê-tan Nhân sơ B')
  })

  it('guarantees that early evolutionary tiers can NEVER skip to fauna (Metazoa)', () => {
    // Tiers 1-4 cannot produce fauna under any trait mutation
    for (const gen of [1, 2, 4, 6, 8, 10, 12, 16]) {
      const traits = TaxonomyEngine.evaluateTraits(primordialGenotype, gen, defaultPlanet)
      if (
        traits.tier === 'prokaryote' ||
        traits.tier === 'eukaryote' ||
        traits.tier === 'simple_multicellular' ||
        traits.tier === 'differentiated_tissue'
      ) {
        expect(traits.domain).not.toBe('fauna')
      }
    }
  })
})
