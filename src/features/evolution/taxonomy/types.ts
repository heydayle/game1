export type EvolutionTier =
  | 'prokaryote' // Giai đoạn 1: Tế bào nhân sơ (Bacteria, Archaea)
  | 'eukaryote' // Giai đoạn 2: Tế bào nhân thực (Nội cộng sinh ti thể, lục lạp)
  | 'simple_multicellular' // Giai đoạn 3: Sinh vật đa bào đơn giản (Tập đoàn tế bào)
  | 'differentiated_tissue' // Giai đoạn 4: Phân hóa tế bào và mô sơ khai
  | 'primitive_animal' // Giai đoạn 5: Động vật đa bào nguyên thủy (Bọt biển, Ruột khoang, Đối xứng tỏa tròn)
  | 'complex_bilaterian' // Giai đoạn 6: Động vật đối xứng hai bên & Cơ quan phức tạp
  | 'advanced' // Giai đoạn 7: Động thực vật bậc cao (Mammals, Avian, Apex Organisms)
  | 'sapient' // Giai đoạn 8: Sinh vật phức tạp thông minh (Humanoid, Aquatic, Silicate, Aerial, Cryo)
  | 'unicellular' // Tương thích ngược (Legacy alias -> Tế bào nhân sơ)
  | 'complex_multicellular' // Tương thích ngược (Legacy alias -> Động vật đối xứng hai bên)

export type SapientArchetype =
  | 'humanoid' // Hình nhân 2 chân, tư duy công cụ (Earth-like planets)
  | 'aquatic_cephalopod' // Thủy tộc xúc tu phát quang trí tuệ (Ocean worlds)
  | 'silicon_crystalline' // Tinh thể silic cộng hưởng nhiệt (High radiation / volcanic worlds)
  | 'aerial_avian' // Dực nhân lượn tầng không (Thick atmosphere, low gravity)
  | 'cryo_titan' // Khổng lồ lớp dày chịu lạnh (Cryosphere / Ice worlds)

export type TrophicMode =
  | 'autotroph' // Tự dưỡng quang hợp
  | 'chemotroph' // Hóa tự dưỡng (đáy biển, miệng phun nhiệt)
  | 'heterotroph' // Dị dưỡng tiêu thụ
  | 'radiotroph' // Hấp thụ bức xạ ion hóa

export type OrganismDomain =
  | 'flora' // Thực vật & Tảo quang hợp / hóa dưỡng
  | 'fauna' // Động vật
  | 'fungi' // Nấm & Sinh vật hoại sinh
  | 'microbe' // Vi sinh vật cổ sơ (Archaea / Bacteria)

export type TrophicRole =
  | 'producer' // Bậc 1: Sinh vật sản xuất (Thực vật, Tảo quang hợp/hóa dưỡng)
  | 'herbivore' // Bậc 2: Động vật ăn thực vật (Primary Consumer)
  | 'carnivore' // Bậc 3: Động vật ăn thịt / Săn mồi (Secondary / Apex Predator)
  | 'omnivore' // Bậc 2-3: Động vật ăn tạp (Ăn cả thực vật và động vật)
  | 'decomposer' // Sinh vật phân giải (Tái sinh khoáng chất đất & chất nền)

export type PlanetaryLineage =
  | 'terran_carbon' // Nhánh Hữu cơ Nguyên sinh (Carbon - Nước lỏng)
  | 'silico_crystalline' // Nhánh Tinh thể Silic Áp điện (Khoáng thạch - Áp điện - Nham thạch)
  | 'cryo_methanogen' // Nhánh Siêu hàn Mê-tan (Hydrocacbon - Azotosome âm độ)
  | 'abyssal_chemosynthetic' // Nhánh Thủy nhiệt Vực sâu (Lưu huỳnh - Khử sắt - Dạ quang)
  | 'aero_atmospheric' // Nhánh Khí quyển Lơ lửng (Bọt khí - Khinh khí cầu sinh học)
  | 'radiotrophic_litho' // Nhánh Cương thạch Bức xạ (Giáp khoáng - Hấp thụ ion gamma)

export interface BiologicalTraits {
  readonly tier: EvolutionTier
  readonly tierLabel: string
  readonly tierRank: number // 1 to 8
  readonly cellularGrade?: string
  readonly bodySymmetry?: 'none' | 'asymmetrical' | 'radial' | 'bilateral'
  readonly domain: OrganismDomain
  readonly domainLabel: string
  readonly domainIcon: string
  readonly trophicRole: TrophicRole
  readonly trophicRoleLabel: string
  readonly trophicLevel: number // 1 to 3
  readonly dietDescription: string
  readonly scientificName: string
  readonly planetaryLineage: PlanetaryLineage
  readonly planetaryLineageLabel: string
  readonly trophicMode: TrophicMode
  readonly trophicLabel: string
  readonly morphology: string
  readonly locomotion: string
  readonly sapientArchetype?: SapientArchetype
  readonly sapientLabel?: string
  readonly notableAdaptations: readonly string[]
  readonly complexityIndex: number // 0.0 to 1.0
}

export interface SpeciationEvent {
  readonly id: string
  readonly speciesId: string
  readonly speciesName: string
  readonly scientificName: string
  readonly tier: EvolutionTier
  readonly tierLabel: string
  readonly color: string
  readonly emergenceRotation: number
  readonly traits: BiologicalTraits
  readonly eventType:
  | 'biogenesis'
  | 'resurgence'
  | 'branching'
  | 'ascension'
  | 'de_novo_chemical_synthesis'
  readonly description: string
}
