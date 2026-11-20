import type { PlanetConfig } from '../../genesis/types/genesis.js'
import { GeneExpression } from '../genetics/Gene.js'
import type { Genotype } from '../genetics/types.js'
import type {
  BiologicalTraits,
  EvolutionTier,
  OrganismDomain,
  PlanetaryLineage,
  SapientArchetype,
  TrophicMode,
  TrophicRole,
  TaxonomicHierarchy,
} from './types.js'

export class TaxonomyEngine {
  /**
   * Evaluates the evolutionary tier, biological traits, morphology, and adaptations
   * for a given genotype, generation, and planetary environment.
   */
  static evaluateTraits(
    genotype: Genotype,
    generation: number,
    planetConfig?: PlanetConfig,
    customTier?: EvolutionTier
  ): BiologicalTraits {
    const expressed = GeneExpression.expressGenotype(genotype)

    // 1. Calculate Evolutionary Complexity Index [0.0, 1.0]
    const armorNorm = expressed.radiationResistance // maps structuralArmor
    const metabolicNorm = expressed.metabolicRate / 2.0 // normalized
    const mobilityNorm = expressed.mobility
    const genNorm = Math.min(1.0, generation / 45.0)

    const rawComplexity =
      genNorm * 0.55 +
      armorNorm * 0.15 +
      mobilityNorm * 0.15 +
      metabolicNorm * 0.15
    const complexityIndex = Number(Math.min(1.0, Math.max(0.05, rawComplexity)).toFixed(3))

    // 2. Determine Evolution Tier following the authentic 6-stage biological milestone:
    // Stage 1: Prokaryotes (Tế bào nhân sơ: Bacteria, Archaea)
    // Stage 2: Eukaryotes (Tế bào nhân thực: Nội cộng sinh ti thể & lục lạp)
    // Stage 3: Simple Multicellular (Đa bào đơn giản / Tập đoàn tế bào: Colonial aggregates)
    // Stage 4: Differentiated Tissues (Phân hóa tế bào và mô sơ khai: Biểu mô, sinh sản, vận động)
    // Stage 5: Primitive Animals (Động vật đa bào nguyên thủy: Bọt biển, ruột khoang tỏa tròn - LẦN ĐẦU TIÊN CÓ ĐỘNG VẬT)
    // Stage 6: Complex Bilaterians (Động vật đối xứng hai bên & cơ quan phức tạp: Bilateria)
    // Stage 7: Advanced (Động thực vật bậc cao)
    // Stage 8: Sapient (Sinh vật thông minh)
    let tier: EvolutionTier = customTier ?? 'prokaryote'
    if (!customTier) {
      if (generation >= 40 || complexityIndex >= 0.90) {
        tier = 'sapient'
      } else if (generation >= 32 || (generation >= 28 && complexityIndex >= 0.78)) {
        tier = 'advanced'
      } else if (generation >= 24 || (generation >= 20 && complexityIndex >= 0.65)) {
        tier = 'complex_bilaterian'
      } else if (generation >= 18 || (generation >= 15 && complexityIndex >= 0.52)) {
        tier = 'primitive_animal'
      } else if (generation >= 12 || (generation >= 9 && complexityIndex >= 0.40)) {
        tier = 'differentiated_tissue'
      } else if (generation >= 7 || (generation >= 5 && complexityIndex >= 0.28)) {
        tier = 'simple_multicellular'
      } else if (generation >= 3 || (generation >= 2 && complexityIndex >= 0.18)) {
        tier = 'eukaryote'
      } else {
        tier = 'prokaryote'
      }
    } else {
      if (customTier === 'unicellular') tier = 'prokaryote'
      if (customTier === 'complex_multicellular') tier = 'complex_bilaterian'
    }

    // 3. Determine Planetary Speculative Lineage
    const oceanLevel = planetConfig?.oceanLevel ?? 0.5
    const temp = planetConfig?.surfaceTemperatureCelsius ?? 15
    const rad = planetConfig?.environmentalConditions?.radiationLevel ?? 'shielded'
    const pressure = planetConfig?.atmosphericComposition?.pressureAtm ?? 1.0
    const silicates = planetConfig?.elementalComposition?.silicatesRock ?? 50
    const carbonOrganics = planetConfig?.elementalComposition?.carbonOrganics ?? 18

    let planetaryLineage: PlanetaryLineage = 'terran_carbon'
    let planetaryLineageLabel = 'Nhánh Hữu cơ Nguyên sinh'

    if (temp < -10) {
      planetaryLineage = 'cryo_methanogen'
      planetaryLineageLabel = 'Nhánh Siêu hàn Mê-tan'
    } else if (
      (silicates > 75 && carbonOrganics < 10) ||
      rad === 'extreme' ||
      temp > 55
    ) {
      planetaryLineage = 'silico_crystalline'
      planetaryLineageLabel = 'Nhánh Tinh thể Silic Áp điện'
    } else if (rad === 'intense') {
      planetaryLineage = 'radiotrophic_litho'
      planetaryLineageLabel = 'Nhánh Cương thạch Bức xạ'
    } else if (oceanLevel > 0.65) {
      planetaryLineage = 'abyssal_chemosynthetic'
      planetaryLineageLabel = 'Nhánh Thủy nhiệt Vực sâu'
    } else if (pressure > 1.8) {
      planetaryLineage = 'aero_atmospheric'
      planetaryLineageLabel = 'Nhánh Khí quyển Lơ lửng'
    }

    // 4. Trophic Mode
    let trophicMode: TrophicMode = 'heterotroph'
    let trophicLabel = 'Dị dưỡng tiêu thụ'

    if (expressed.radiationResistance >= 0.8) {
      trophicMode = 'radiotroph'
      trophicLabel = 'Hấp thụ bức xạ ion hóa'
    } else if (expressed.thermalOptimumCelsius >= 50) {
      trophicMode = 'chemotroph'
      trophicLabel = 'Hóa tự dưỡng khoáng đáy biển'
    } else if (expressed.metabolicRate <= 0.9) {
      trophicMode = 'autotroph'
      trophicLabel = 'Quang tự dưỡng ánh sáng sao'
    }

    // 5. Adaptations based on phenotypic extremes
    const adaptations: string[] = []
    if (expressed.thermalOptimumCelsius <= -5) {
      adaptations.push('Protein chống đông âm độ')
    } else if (expressed.thermalOptimumCelsius >= 45) {
      adaptations.push('Màng bọc chịu nhiệt siêu bền')
    } else {
      adaptations.push('Điều hòa thân nhiệt thích nghi')
    }

    if (expressed.waterConservation >= 0.75) {
      adaptations.push('Biểu bì giữ nước chống khô hạn')
    }
    if (expressed.radiationResistance >= 0.7) {
      adaptations.push('Cơ chế phục hồi DNA trước bức xạ')
    }
    if (expressed.mobility >= 0.7) {
      adaptations.push('Hệ vận động phản xạ tốc độ cao')
    }
    if (expressed.clutchSize >= 4) {
      adaptations.push('Chiến lược sinh sôi quần thể nhanh')
    } else {
      adaptations.push('Chăm sóc và nuôi dưỡng con non chuyên sâu')
    }

    // 6. Organism Domain (Thực vật, Động vật, Nấm, Vi sinh) & Food Chain Trophic Role (6 cấp độ chuỗi thức ăn)
    let domain: OrganismDomain = 'microbe'
    let domainLabel = 'Vi sinh vật'
    let domainIcon = '🦠'
    let trophicRole: TrophicRole = 'producer'
    let trophicRoleLabel = 'Sinh vật sản xuất (Bậc 1)'
    let trophicLevel = 1
    let dietDescription = 'Hấp thụ khoáng chất và năng lượng sao'

    if (tier === 'prokaryote' || tier === 'unicellular') {
      domain = 'microbe'
      domainLabel = 'Vi sinh vật (Nhân sơ)'
      domainIcon = '🦠'
      if (trophicMode === 'autotroph' || trophicMode === 'chemotroph') {
        trophicRole = 'producer'
        trophicRoleLabel = 'Sinh vật sản xuất (Tảo đơn bào / Vi khuẩn lam quang hợp)'
        trophicLevel = 1
        dietDescription = 'Quang hợp & hóa năng sơ khai, mở đầu chuỗi thức ăn sinh quyển'
      } else {
        trophicRole = 'decomposer'
        trophicRoleLabel = 'Sinh vật phân giải (Vi khuẩn hoại sinh nhân sơ)'
        trophicLevel = 1
        dietDescription = 'Phân hủy xác hữu cơ và chất thải thành chất vô cơ cho thực vật/tảo tái hấp thụ'
      }
    } else if (tier === 'eukaryote') {
      domain = 'microbe'
      domainLabel = 'Nguyên sinh vật (Nhân thực)'
      domainIcon = '🧫'
      if (trophicMode === 'autotroph' || trophicMode === 'chemotroph') {
        trophicRole = 'producer'
        trophicRoleLabel = 'Sinh vật sản xuất (Tảo đơn bào lục, silic, giáp)'
        trophicLevel = 1
        dietDescription = 'Quang hợp nhờ lục lạp nội cộng sinh, mở đầu chuỗi thức ăn'
      } else if (expressed.mobility >= 0.2) {
        trophicRole = 'herbivore'
        trophicRoleLabel = 'Sinh vật tiêu thụ bậc 1 (Động vật nguyên sinh ăn tảo)'
        trophicLevel = 2
        dietDescription = 'Trùng giày, trùng roi dị dưỡng ăn tảo đơn bào và vi khuẩn lam'
      } else {
        trophicRole = 'decomposer'
        trophicRoleLabel = 'Sinh vật phân giải (Nguyên sinh vật hoại sinh)'
        trophicLevel = 1
        dietDescription = 'Thực bào mùn bã và phân giải chất hữu cơ trả lại khoáng chất vô cơ'
      }
    } else if (tier === 'simple_multicellular') {
      // Giai đoạn 3: Đa bào đơn giản / Tập đoàn tế bào (Tuyệt đối CHƯA THỂ là động vật fauna!)
      if (trophicMode === 'autotroph' || trophicMode === 'chemotroph') {
        domain = 'flora'
        domainLabel = 'Thực vật (Tảo tập đoàn)'
        domainIcon = '🌿'
        trophicRole = 'producer'
        trophicRoleLabel = 'Sinh vật sản xuất (Tảo màng đa bào)'
        trophicLevel = 1
        dietDescription = 'Tập đoàn tế bào quang hợp năng lượng sao và trao đổi khoáng'
      } else if (trophicMode === 'heterotroph' && expressed.mobility <= 0.22) {
        domain = 'fungi'
        domainLabel = 'Nấm & Phân giải'
        domainIcon = '🍄'
        trophicRole = 'decomposer'
        trophicRoleLabel = 'Sinh vật phân giải (Nấm sợi sơ khai)'
        trophicLevel = 1
        dietDescription = 'Khối tế bào hợp tác phân hủy chất hữu cơ'
      } else {
        domain = 'microbe'
        domainLabel = 'Tập đoàn nguyên sinh vật'
        domainIcon = '🧫'
        trophicRole = 'herbivore'
        trophicRoleLabel = 'Sinh vật tiêu thụ bậc 1 (Tập đoàn dị dưỡng lọc tảo)'
        trophicLevel = 2
        dietDescription = 'Hợp tác lọc hạt hữu cơ và tảo vi sinh'
      }
    } else if (tier === 'differentiated_tissue') {
      // Giai đoạn 4: Phân hóa tế bào và mô sơ khai (Biểu mô, mầm sinh sản, mô vận động)
      if (trophicMode === 'autotroph' || trophicMode === 'chemotroph') {
        domain = 'flora'
        domainLabel = 'Thực vật (Đa bào có mô)'
        domainIcon = '🌿'
        trophicRole = 'producer'
        trophicRoleLabel = 'Sinh vật sản xuất (Thực vật sơ khai)'
        trophicLevel = 1
        dietDescription = 'Phiến mô quang hợp hấp thụ ánh sáng sao và rễ mầm hút khoáng'
      } else if (expressed.mobility <= 0.25 && trophicMode === 'heterotroph') {
        domain = 'fungi'
        domainLabel = 'Nấm & Phân giải'
        domainIcon = '🍄'
        trophicRole = 'decomposer'
        trophicRoleLabel = 'Sinh vật phân giải (Nấm phân hóa mô)'
        trophicLevel = 1
        dietDescription = 'Sợi khuẩn ty phân hóa tiết enzym tiêu hóa ngoại bào'
      } else {
        // Tiền thân động vật phân hóa mô (Stem Metazoa / Placozoa)
        domain = 'microbe'
        domainLabel = 'Thể đa bào phân hóa mô'
        domainIcon = '🧫'
        trophicRole = 'herbivore'
        trophicRoleLabel = 'Sinh vật tiêu thụ bậc 1 (Mô biểu mô hấp thu tảo)'
        trophicLevel = 2
        dietDescription = 'Lớp tế bào bụng tiêu hóa bề mặt thảm vi sinh và tảo phù du'
      }
    } else if (tier === 'primitive_animal') {
      // Giai đoạn 5: ĐÂY MỚI LÀ LẦN ĐẦU TIÊN CỦA GIỚI ĐỘNG VẬT (fauna)!
      // Cấu trúc dạng bọt biển (Porifera) hoặc ruột khoang (Cnidaria), đối xứng tỏa tròn hoặc bất đối xứng
      if (
        (trophicMode === 'autotroph' || trophicMode === 'chemotroph') &&
        expressed.mobility <= 0.25
      ) {
        domain = 'flora'
        domainLabel = 'Thực vật'
        domainIcon = '🌿'
        trophicRole = 'producer'
        trophicRoleLabel = 'Sinh vật sản xuất'
        trophicLevel = 1
        dietDescription = 'Thực vật phân hóa mô quang hợp'
      } else {
        domain = 'fauna'
        domainLabel = 'Động vật (Nguyên thủy)'
        domainIcon = '🪸' // Bọt biển / Ruột khoang tỏa tròn
        if (expressed.metabolicRate >= 1.25 && expressed.mobility >= 0.45) {
          trophicRole = 'carnivore'
          trophicRoleLabel = 'Sinh vật tiêu thụ bậc 2 (Động vật ruột khoang bắt mồi)'
          trophicLevel = 3
          dietDescription = 'Xúc tu tế bào gai bắt và làm tê liệt các sinh vật tiêu thụ bậc 1'
        } else if (expressed.mobility >= 0.3) {
          trophicRole = 'omnivore'
          trophicRoleLabel = 'Động vật tỏa tròn ăn tạp (Bậc 2)'
          trophicLevel = 2
          dietDescription = 'Bắt giữ linh hoạt vi sinh vật phù du và hạt hữu cơ'
        } else {
          trophicRole = 'herbivore'
          trophicRoleLabel = 'Sinh vật tiêu thụ bậc 1 (Bọt biển lọc tảo)'
          trophicLevel = 2
          dietDescription = 'Hệ thống lỗ hút lọc tảo và thảm thực vật phù du'
        }
      }
    } else if (tier === 'complex_bilaterian' || tier === 'complex_multicellular') {
      // Giai đoạn 6: Động vật đối xứng 2 bên (Bilateria: Cá nhỏ, Giáp xác, Nòng nọc, Côn trùng)
      if (
        (trophicMode === 'autotroph' || trophicMode === 'chemotroph') &&
        expressed.mobility <= 0.35
      ) {
        domain = 'flora'
        domainLabel = 'Thực vật'
        domainIcon = '🌿'
        trophicRole = 'producer'
        trophicRoleLabel = 'Sinh vật sản xuất (Thực vật)'
        trophicLevel = 1
        dietDescription = 'Quang hợp ánh sáng sao, hấp thụ khoáng chất từ bệ sinh quyển vi sinh'
      } else if (
        expressed.mobility <= 0.18 &&
        trophicMode === 'heterotroph' &&
        expressed.radiationResistance >= 0.4
      ) {
        domain = 'fungi'
        domainLabel = 'Nấm & Phân giải'
        domainIcon = '🍄'
        trophicRole = 'decomposer'
        trophicRoleLabel = 'Sinh vật phân giải'
        trophicLevel = 1
        dietDescription = 'Phân hủy sinh khối chết, tái sinh khoáng chất vô cơ'
      } else {
        domain = 'fauna'
        domainLabel = 'Động vật'
        domainIcon = '🐾'
        if (expressed.metabolicRate >= 1.25 && expressed.mobility >= 0.5) {
          trophicRole = 'carnivore'
          trophicRoleLabel = 'Sinh vật tiêu thụ bậc 2 (Cá nhỏ / Côn trùng săn mồi)'
          trophicLevel = 3
          dietDescription = 'Săn giáp xác nhỏ, bọ nước Daphnia, nòng nọc và ấu trùng thủy sinh bậc 2'
        } else if (expressed.mobility >= 0.35 && expressed.radiationResistance >= 0.45) {
          trophicRole = 'omnivore'
          trophicRoleLabel = 'Động vật ăn tạp đối xứng hai bên (Bậc 2)'
          trophicLevel = 2
          dietDescription = 'Tiêu thụ linh hoạt thảm thực vật, tảo và con mồi giáp xác nhỏ'
        } else {
          trophicRole = 'herbivore'
          trophicRoleLabel = 'Sinh vật tiêu thụ bậc 1 (Giáp xác / Bọ nước / Động vật ăn cỏ)'
          trophicLevel = 2
          dietDescription = 'Chuyển hóa năng lượng từ tảo đơn bào và thực vật thành sinh khối động vật'
        }
      }
    } else if (tier === 'advanced') {
      // Giai đoạn 7: Động vật bậc cao (Cá lớn, Chim săn mồi, Bò sát, Động vật có vú)
      if (
        (trophicMode === 'autotroph' || trophicMode === 'chemotroph') &&
        expressed.mobility <= 0.35
      ) {
        domain = 'flora'
        domainLabel = 'Thực vật'
        domainIcon = '🌿'
        trophicRole = 'producer'
        trophicRoleLabel = 'Sinh vật sản xuất (Thực vật bậc cao)'
        trophicLevel = 1
        dietDescription = 'Hấp thụ ánh sáng mặt trời, nước và CO2 tổng hợp sinh khối lớn'
      } else if (
        expressed.mobility <= 0.18 &&
        trophicMode === 'heterotroph'
      ) {
        domain = 'fungi'
        domainLabel = 'Nấm & Phân giải'
        domainIcon = '🍄'
        trophicRole = 'decomposer'
        trophicRoleLabel = 'Sinh vật phân giải'
        trophicLevel = 1
        dietDescription = 'Phân hủy xác sinh khối động thực vật thành chất vô cơ'
      } else {
        domain = 'fauna'
        domainLabel = 'Động vật'
        domainIcon = '🐾'
        if (expressed.metabolicRate >= 1.25 && expressed.mobility >= 0.5) {
          // Phân biệt Động vật có vú đỉnh chuỗi (Bậc 5) vs Động vật săn mồi bậc 3 (Cá lớn, chim, bò sát - Bậc 4)
          if (expressed.metabolicRate >= 1.35 || expressed.clutchSize <= 3) {
            trophicRole = 'carnivore'
            trophicRoleLabel = 'Động vật có vú ăn thịt đầu bảng (Bậc 5 - Apex Mammals)'
            trophicLevel = 5
            dietDescription = 'Đỉnh chuỗi thức ăn: Săn cá lớn, hải cẩu, thú ăn cỏ và động vật móng guốc'
          } else {
            trophicRole = 'carnivore'
            trophicRoleLabel = 'Sinh vật tiêu thụ bậc 3 (Cá lớn / Chim săn mồi / Bò sát)'
            trophicLevel = 4
            dietDescription = 'Kiểm soát số lượng cá nhỏ, ếch nhái và động vật tiêu thụ bậc 2'
          }
        } else if (expressed.mobility >= 0.35 && expressed.radiationResistance >= 0.45) {
          trophicRole = 'omnivore'
          trophicRoleLabel = 'Động vật có vú ăn tạp đầu bảng (Bậc 5)'
          trophicLevel = 5
          dietDescription = 'Tiêu thụ linh hoạt cá lớn, sinh vật biển, quả hạt và thảm thực vật'
        } else {
          trophicRole = 'herbivore'
          trophicRoleLabel = 'Sinh vật tiêu thụ bậc 1 (Động vật có vú ăn thực vật)'
          trophicLevel = 2
          dietDescription = 'Tiêu thụ khối lượng lớn thảm thực vật, tích lũy sinh khối động vật'
        }
      }
    } else {
      // Giai đoạn 8: sapient (Sinh vật trí tuệ đỉnh chuỗi thức ăn)
      domain = 'fauna'
      domainLabel = 'Sinh vật trí tuệ'
      domainIcon = '🧠'
      trophicRole = expressed.metabolicRate >= 1.25 ? 'carnivore' : 'omnivore'
      trophicRoleLabel = 'Sinh vật trí tuệ đỉnh chuỗi thức ăn (Bậc 5 - Apex Sapient)'
      trophicLevel = 5
      dietDescription = 'Làm chủ chuỗi năng lượng sinh quyển, quản lý và tiêu thụ tài nguyên đỉnh chuỗi'
    }

    // Adaptive genomic heritage for Flora and Microorganisms
    if (domain === 'flora') {
      adaptations.push('Thừa kế bộ gen quang dưỡng từ vi sinh vật')
      if (expressed.waterConservation >= 0.6) {
        adaptations.push('Mô mạch và cutin thích nghi đất liền')
      } else {
        adaptations.push('Phiến lá quang hợp mỏng hấp thụ ánh sáng sao')
      }
    } else if (tier === 'prokaryote' || tier === 'eukaryote' || tier === 'unicellular' || tier === 'simple_multicellular') {
      adaptations.push('Phân đôi sinh sôi quy mô lớn')
      adaptations.push('Đa dạng hóa biến dị di truyền cao')
    }

    // 7. Speculative Non-Earth Morphology, Locomotion, and Taxonomy Across All Tiers
    let tierLabel = 'Tế bào nhân sơ'
    let tierRank = 1
    let cellularGrade = 'Tế bào nhân sơ (Chưa có màng nhân, chuỗi DNA trần)'
    let bodySymmetry: 'none' | 'asymmetrical' | 'radial' | 'bilateral' = 'none'
    let morphology = 'Tế bào đơn lẻ có màng lipid mỏng'
    let locomotion = 'Roi bơi và biến dạng màng tế bào'
    let scientificName = `Prokaryota gen${generation}`
    let sapientArchetype: SapientArchetype | undefined
    let sapientLabel: string | undefined

    switch (tier) {
      case 'prokaryote':
      case 'unicellular':
        tierRank = 1
        tierLabel = 'Tế bào nhân sơ'
        cellularGrade = 'Tế bào nhân sơ (Chưa có màng nhân, chuỗi DNA trần)'
        bodySymmetry = 'none'
        adaptations.push('Cấu trúc nhân sơ chưa có màng nhân')
        adaptations.push('Phân đôi nhị phân tốc độ cao')
        if (planetaryLineage === 'cryo_methanogen') {
          scientificName = 'Azotobacter cryophilus'
          morphology = 'Đơn bào màng azotosome bơi trong dung môi mê-tan lỏng âm 120°C'
          locomotion = 'Chuyển động dòng chảy hydrocacbon và co bóp màng dẻo'
        } else if (planetaryLineage === 'silico_crystalline') {
          scientificName = 'Silicococcus piezoelectrus'
          morphology = 'Nguyên bào tinh thể silic đơn bào, thu nhận năng lượng dao động áp điện'
          locomotion = 'Xung điện vi mô và biến dạng tinh thể vi lượng'
        } else if (planetaryLineage === 'aero_atmospheric') {
          scientificName = 'Aerosphaera levitans'
          morphology = 'Bào thể sương khí quang hợp trôi nổi trong các tầng mây đối lưu'
          locomotion = 'Lơ lửng khí quyển nhờ túi khí heli nội sinh'
        } else if (planetaryLineage === 'abyssal_chemosynthetic') {
          scientificName = 'Chemoarchaeon abyssi'
          morphology = 'Vi sinh hóa dưỡng đáy vực, khử lưu huỳnh và sắt từ miệng phun nhiệt'
          locomotion = 'Lông bơi siêu vi chống chịu áp suất đáy biển cực đại'
        } else if (planetaryLineage === 'radiotrophic_litho') {
          scientificName = 'Radiococcus petra'
          morphology = 'Đơn bào màng bọc melanin hấp thụ bức xạ ion hóa tia gamma'
          locomotion = 'Chuyển động Brown trên bề mặt quặng phóng xạ'
        } else {
          scientificName = expressed.thermalOptimumCelsius > 40 ? 'Thermococcus antiquus' : 'Cyanothrix simplex'
          morphology = 'Cấu trúc đơn bào hiển vi, trao đổi chất trực tiếp qua màng lipid'
          locomotion = 'Chuyển động Brown và lông bơi siêu vi'
        }
        break

      case 'eukaryote':
        tierRank = 2
        tierLabel = 'Tế bào nhân thực'
        cellularGrade = 'Tế bào nhân thực (Màng nhân hoàn chỉnh, tích hợp ti thể & lục lạp)'
        bodySymmetry = 'none'
        adaptations.push('Màng nhân hoàn chỉnh bảo vệ vật chất di truyền')
        adaptations.push('Nội cộng sinh ti thể tạo năng lượng ATP vượt trội')
        if (trophicMode === 'autotroph') {
          adaptations.push('Lục lạp nội cộng sinh hấp thụ quang năng sao')
        }
        if (planetaryLineage === 'cryo_methanogen') {
          scientificName = 'Cryoplasma eukaryotum'
          morphology = 'Đơn bào nhân thực màng kép siêu hàn, có ti thể chuyển hóa lipid âm độ'
          locomotion = 'Chân giả dẻo dai lướt trên bề mặt tinh thể mê-tan'
        } else if (planetaryLineage === 'silico_crystalline') {
          scientificName = 'Silicoeukaryota piezo'
          morphology = 'Đơn bào có cấu trúc nhân áp điện phân tách, tinh thể ti thể nội sinh cộng hưởng'
          locomotion = 'Roi bơi tinh thể dẫn truyền vi xung điện'
        } else if (planetaryLineage === 'aero_atmospheric') {
          scientificName = 'Aeroeukaryota volans'
          morphology = 'Bào tử nhân thực có không bào khí và ti thể hô hấp hiếu khí lơ lửng'
          locomotion = 'Lông rung chuyển động xoáy lơ lửng trong hơi mây'
        } else if (planetaryLineage === 'abyssal_chemosynthetic') {
          scientificName = 'Bathyeukaryota profundus'
          morphology = 'Nguyên sinh vật đáy biển sâu có màng nhân kép và thể hô hấp hóa năng'
          locomotion = 'Lông roi xoắn chống chịu áp lực nước cực đại'
        } else if (planetaryLineage === 'radiotrophic_litho') {
          scientificName = 'Radioeukaryota munitus'
          morphology = 'Tế bào nhân thực chứa bào quan phân tách và enzym bảo vệ DNA bức xạ'
          locomotion = 'Biến dạng màng và chân giả bắt hạt ion'
        } else {
          scientificName = trophicMode === 'autotroph' ? 'Chlamydomonas nova' : 'Protista eukaryota'
          morphology = 'Tế bào đơn bào có màng nhân hoàn chỉnh, tích hợp ti thể và lục lạp nhờ nội cộng sinh'
          locomotion = 'Roi bơi phức tạp, lông rung và chân giả linh hoạt'
        }
        break

      case 'simple_multicellular':
        tierRank = 3
        tierLabel = 'Đa bào đơn giản'
        cellularGrade = 'Tập đoàn đa bào sơ khai (Khối tế bào liên kết hợp tác, chưa phân hóa mô)'
        bodySymmetry = 'asymmetrical'
        adaptations.push('Liên kết bám dính tế bào (Cadherin/Pectin)')
        adaptations.push('Hợp tác chuyển hóa dinh dưỡng liên tế bào')
        if (planetaryLineage === 'cryo_methanogen') {
          scientificName = 'Cryofilum hydrocarbonea'
          morphology = 'Mạng lưới sợi sinh học polyme dẻo dai bám trên băng tuyết hydrocacbon'
          locomotion = 'Lan tỏa sợi tế bào theo vết nứt băng tuyết'
        } else if (planetaryLineage === 'silico_crystalline') {
          scientificName = 'Lithopecten crystallinus'
          morphology = 'Cụm tập đoàn pha lê đa bào bán dẫn, kết nối mạng lưới cộng hưởng nhiệt'
          locomotion = 'Cố định trên nền quặng đá bazan'
        } else if (planetaryLineage === 'aero_atmospheric') {
          scientificName = 'Aerocolonia vesicaria'
          morphology = 'Tập đoàn túi khí liên kết màng mỏng, nổi bồng bềnh nhờ khí nhẹ nội sinh'
          locomotion = 'Trôi dạt tự do theo các luồng gió tầng cao'
        } else if (planetaryLineage === 'abyssal_chemosynthetic') {
          scientificName = 'Tubicolora phosphorica'
          morphology = 'Rừng ống sinh học dạ quang cộng sinh vi khuẩn hóa năng quanh miệng phun nhiệt'
          locomotion = 'Bám rễ trên vách đá magma đáy biển'
        } else if (planetaryLineage === 'radiotrophic_litho') {
          scientificName = 'Chondrophyte radicans'
          morphology = 'Thảm rêu khoáng hấp thụ bức xạ, tích tụ các nguyên tố kim loại nặng'
          locomotion = 'Bám chặt vào các khối đá giàu urani và thori'
        } else {
          scientificName = domain === 'flora' ? 'Alga simplex' : 'Coloniothrix gelatinosa'
          morphology = domain === 'flora' ? 'Tảo tập đoàn dạng cầu/sợi quang hợp lục' : 'Tập đoàn tế bào dạng chuỗi hoặc màng chất nhờn liên kết'
          locomotion = domain === 'flora' ? 'Bám rễ trên đá và trôi dạt mặt nước' : 'Trôi dạt theo dòng chất lưu và neo bám nền đá'
        }
        break

      case 'differentiated_tissue':
        tierRank = 4
        tierLabel = 'Phân hóa mô & tế bào'
        cellularGrade = 'Đa bào có sự phân hóa mô sơ khai (Biểu mô, tế bào sinh sản, mầm mô)'
        bodySymmetry = 'asymmetrical'
        adaptations.push('Phân hóa tế bào soma và tế bào mầm sinh sản')
        adaptations.push('Lớp biểu mô bề mặt bảo vệ ngăn thất thoát dịch')
        adaptations.push('Tiếp hợp khe truyền tín hiệu thần kinh-hóa học sơ khai')
        if (planetaryLineage === 'cryo_methanogen') {
          scientificName = 'Cryoplacozoa gelida'
          morphology = 'Thể đa bào phân tầng màng mỡ chống đông ngoại vi và mô hấp thụ bên trong'
          locomotion = 'Lớp lông biểu mô trườn trên bề mặt băng'
        } else if (planetaryLineage === 'silico_crystalline') {
          scientificName = 'Silicostroma stratatum'
          morphology = 'Cấu trúc đa pha gồm lớp vỏ khoáng cách nhiệt bên ngoài và lõi dẫn điện bên trong'
          locomotion = 'Cố định, uốn cong theo nhiệt độ'
        } else if (planetaryLineage === 'aero_atmospheric') {
          scientificName = 'Veloplana aetheria'
          morphology = 'Màng mô hai lớp phân hóa: khoang chứa khí nổi và biểu mô hấp thu quang năng'
          locomotion = 'Uốn lượn mép màng trong các dòng đối lưu không khí'
        } else if (planetaryLineage === 'abyssal_chemosynthetic') {
          scientificName = 'Bathyplax profunda'
          morphology = 'Phiến mô dẹp phân tầng, lớp ngoài bắt khoáng và lớp trong phân giải hóa năng'
          locomotion = 'Trườn bám trên đá đáy vực'
        } else if (planetaryLineage === 'radiotrophic_litho') {
          scientificName = 'Radiostroma laminare'
          morphology = 'Mô biểu bì đa tầng chứa melanin dày đặc, che chắn các tế bào sinh sản'
          locomotion = 'Bám chặt vách quặng phóng xạ'
        } else {
          scientificName = domain === 'flora' ? 'Porphyra primitivus' : 'Placozoa textum'
          morphology = domain === 'flora' ? 'Thực vật thủy sinh có phiến mô phân hóa tầng quang hợp' : 'Thể đa bào dẹp hai lớp biểu mô, tiêu hóa ngoại bào bề mặt'
          locomotion = domain === 'flora' ? 'Cố định nền đá ven bờ' : 'Lông rung biểu mô trườn nhẹ trên nền đáy'
        }
        break

      case 'primitive_animal':
        tierRank = 5
        tierLabel = 'Động vật nguyên thủy'
        cellularGrade = 'Động vật đa bào nguyên thủy (2 lá phôi, bọt biển / ruột khoang tỏa tròn)'
        bodySymmetry = 'radial'
        adaptations.push('Cơ thể đối xứng tỏa tròn (Radial) hoặc bất đối xứng (Porifera)')
        adaptations.push('Khoang tiêu hóa túi ngoại bào sơ khai')
        adaptations.push('Mạng lưới tế bào thần kinh phân tán (Nerve Net)')
        if (trophicRole === 'carnivore' || trophicRole === 'omnivore') {
          adaptations.push('Tế bào gai xúc tu bắt mồi chuyên biệt')
        }
        if (planetaryLineage === 'cryo_methanogen') {
          scientificName = 'Cryomedusa rotata'
          morphology = 'Sinh vật dạng sứa cryo trong suốt đối xứng tỏa tròn, túi tiêu hóa co bóp trong mê-tan'
          locomotion = 'Xung lực co bóp vòm dù nhịp nhàng trong chất lỏng âm độ'
        } else if (planetaryLineage === 'silico_crystalline') {
          scientificName = 'Lithocorallium radiatum'
          morphology = 'San hô tinh thể tỏa tròn, các gai khoáng lọc dòng khoáng nham thạch'
          locomotion = 'Bám rễ trên vách dung nham nguội'
        } else if (planetaryLineage === 'aero_atmospheric') {
          scientificName = 'Aerochrysaora velata'
          morphology = 'Sinh vật ruột khoang dạng vòm dù (bio-parachute) trôi lượn đối xứng tỏa tròn'
          locomotion = 'Co bóp méo dù và buông xúc tu dài đón gió'
        } else if (planetaryLineage === 'abyssal_chemosynthetic') {
          scientificName = 'Porifera bathyphila'
          morphology = 'Bọt biển vực sâu dạng ống hút thủy nhiệt, hệ thống tế bào cổ áo lọc hạt khoáng'
          locomotion = 'Lông rung thành ống dẫn nước liên tục'
        } else if (planetaryLineage === 'radiotrophic_litho') {
          scientificName = 'Radiopolypus calyx'
          morphology = 'Polyp thạch giáp tỏa tròn bọc chì, mở các xúc tu hút mùn bức xạ'
          locomotion = 'Bám cố định trên mạch quặng'
        } else {
          scientificName = domain === 'fauna' ? (trophicRole === 'carnivore' ? 'Cnidaria radiata' : 'Porifera spongia') : 'Alga radiata'
          morphology = domain === 'fauna' ? 'Cơ thể dạng bọt biển lọc thức ăn hoặc sứa ruột khoang đối xứng tỏa tròn' : 'Thực vật thủy sinh tỏa tròn'
          locomotion = domain === 'fauna' ? 'Co bóp chuông thân thể hoặc lông rung thành ống dẫn nước' : 'Bám cố định dưới nước'
        }
        break

      case 'complex_bilaterian':
      case 'complex_multicellular':
        tierRank = 6
        tierLabel = 'Động vật đối xứng 2 bên'
        cellularGrade = 'Động vật đối xứng hai bên (Bilateria: 3 lá phôi, hạch não, khoang cơ thể, ống tiêu hóa 2 đầu)'
        bodySymmetry = 'bilateral'
        adaptations.push('Đối xứng hai bên (Bilateral Symmetry) định hướng di chuyển')
        adaptations.push('Hiện tượng tập trung đầu (Cephalization) hình thành hạch não')
        adaptations.push('Ống tiêu hóa hoàn chỉnh 2 đầu (Miệng - Hậu môn)')
        adaptations.push('Khoang cơ thể thực sự (Coelom) bảo vệ nội tạng chuyên biệt')
        adaptations.push('Hệ cơ 3 lá phôi vận động linh hoạt')
        if (planetaryLineage === 'cryo_methanogen') {
          scientificName = 'Methanotriton algidus'
          morphology = 'Sinh vật kỳ giông mê-tan đối xứng 2 bên, tuần hoàn chất lưu hydrocacbon chống đông'
          locomotion = 'Bơi uốn lượn trong hồ mê-tan lỏng và bò trên băng tuyết'
        } else if (planetaryLineage === 'silico_crystalline') {
          scientificName = 'Ferrosilicon testudo'
          morphology = 'Sinh vật giáp khoáng silicat đối xứng 2 bên, hạch não tinh thể điều phối chi'
          locomotion = 'Các chi khớp khoáng cứng cáp di chuyển trên sỏi đá'
        } else if (planetaryLineage === 'aero_atmospheric') {
          scientificName = 'Aero-Pteron bilateralis'
          morphology = 'Sinh vật phi cơ sinh học đối xứng 2 bên, có cánh phụ và cơ quan định hướng đầu'
          locomotion = 'Cánh lái cơ động và van khí phản lực'
        } else if (planetaryLineage === 'abyssal_chemosynthetic') {
          scientificName = 'Cephalopoda abyssalis'
          morphology = 'Thủy quái giáp xác / chân khớp biển sâu phân đốt đối xứng 2 bên, xúc giác đầu nhạy bén'
          locomotion = 'Phản lực thủy động học và chân bơi đối xứng'
        } else if (planetaryLineage === 'radiotrophic_litho') {
          scientificName = 'Carapax radiatus'
          morphology = 'Bò sát giáp phiến chì-khoáng đối xứng 2 bên, mắt cảm biến bức xạ gamma'
          locomotion = 'Sáu chi dạng móng neo vững trên nền đá bức xạ'
        } else {
          scientificName = domain === 'flora' ? 'Flora vasculata' : expressed.waterConservation > 0.6 ? 'Arthropoda robustus' : 'Bilateria segmentata'
          morphology = domain === 'flora' ? 'Thực vật có mô mạch dẫn truyền và rễ cọc đối xứng' : 'Hệ cơ quan phân hóa: 3 lá phôi, ống tiêu hóa 2 đầu, hạch não tập trung'
          locomotion = domain === 'flora' ? 'Cố định nền đất, vươn tán đón ánh sáng' : 'Chi khớp đốt phân đoạn hoặc vây bơi lượn sóng'
        }
        break

      case 'advanced':
        tierRank = 7
        tierLabel = 'Động thực vật bậc cao'
        cellularGrade = 'Động thực vật bậc cao (Hệ cơ quan chuyên biệt hoàn chỉnh, tuần hoàn kín)'
        bodySymmetry = 'bilateral'
        adaptations.push('Hệ thần kinh não bộ phức tạp')
        adaptations.push('Hệ tuần hoàn kín với tim nhiều ngăn')
        adaptations.push('Hệ giác quan thị giác và thính giác sắc bén')
        if (planetaryLineage === 'cryo_methanogen') {
          scientificName = 'Cryotitan pachydermus'
          morphology = 'Cự thú lớp biểu bì đông kết siêu dày, túi điều hòa nhiệt nội sinh'
          locomotion = 'Chi đệm bọc sừng vững chãi lướt trên sông băng vĩnh cửu'
        } else if (planetaryLineage === 'silico_crystalline') {
          scientificName = 'Lithotherium titanum'
          morphology = 'Cự thú nham thạch vỏ giáp thạch anh, chuyển hóa bức xạ và nhiệt năng dung nham'
          locomotion = 'Bốn chi cột trụ rung chuyển mặt đất dung nham'
        } else if (planetaryLineage === 'aero_atmospheric') {
          scientificName = 'Aero-Pterotherium'
          morphology = 'Dực thú cánh buồm lượn ba chiều cơ động cao, không bao giờ chạm đất'
          locomotion = 'Sải cánh rộng hàng chục mét lướt gió tầng bình lưu'
        } else if (planetaryLineage === 'abyssal_chemosynthetic') {
          scientificName = 'Bathypelagic Leviathan'
          morphology = 'Cự thú đại dương sâu thẳm, lớp vỏ sừng phát xạ ánh sáng sinh học rực rỡ'
          locomotion = 'Vây chèo khổng lồ uốn lượn đẩy cơ thể nghìn tấn xé nước'
        } else if (planetaryLineage === 'radiotrophic_litho') {
          scientificName = 'Meganeura radiorobusta'
          morphology = 'Sinh vật vỏ giáp bức xạ siêu bền, miễn nhiễm hoàn toàn ion hóa hạt nhân'
          locomotion = 'Bò leo vách đá dựng đứng và cánh giáp trợ lực'
        } else {
          scientificName = domain === 'flora' ? 'Silvamagna excelsa' : 'Theriosaurus sapiens-prae'
          morphology = domain === 'flora' ? 'Rừng đại mộc rễ sâu, tán lá quang hợp hiệu suất cao' : 'Sinh vật máu nóng có hệ thần kinh trung ương và giác quan tinh nhạy'
          locomotion = domain === 'flora' ? 'Thực vật cao tầng che phủ mặt đất' : 'Bốn chi linh hoạt hoặc sải cánh cơ động cao'
        }
        break

      case 'sapient':
        tierRank = 8
        tierLabel = 'Sinh vật trí tuệ'
        cellularGrade = 'Sinh vật trí tuệ đỉnh cao (Vỏ não phát triển tột bậc, tư duy trừu tượng)'
        bodySymmetry = 'bilateral'
        if (planetaryLineage === 'cryo_methanogen') {
          sapientArchetype = 'cryo_titan'
          sapientLabel = 'Khổng lồ Lớp dày Băng giá (Cryo-Titan)'
          scientificName = 'Glaciatitan noeticus'
          morphology = 'Khối sinh học khổng lồ tích trữ nhiệt lượng, mô não thể lỏng đông đặc chậm'
          locomotion = 'Chân đệm diện tích lớn lướt nhẹ trên sông băng'
          adaptations.push('Tư duy cộng hưởng trường nhiệt nội sinh')
        } else if (planetaryLineage === 'abyssal_chemosynthetic') {
          sapientArchetype = 'aquatic_cephalopod'
          sapientLabel = 'Thủy tộc Xúc tu Biển sâu (Cephalosapient)'
          scientificName = 'Cephalopoda illuminatus'
          morphology = 'Thân mềm thủy động học, 8 xúc tu cảm giác tinh xảo, da phát quang biểu tượng ngôn ngữ'
          locomotion = 'Phản lực thủy triều và lướt sóng ngầm'
          adaptations.push('Giao tiếp bằng ngôn ngữ ánh sáng phát quang quang phổ')
        } else if (planetaryLineage === 'silico_crystalline' || planetaryLineage === 'radiotrophic_litho') {
          sapientArchetype = 'silicon_crystalline'
          sapientLabel = 'Trí tuệ Tinh thể Silic Áp điện (Silico-Crystalline)'
          scientificName = 'Lithosapiens electricus'
          morphology = 'Khung xương mạng tinh thể silic bán dẫn, não bộ tích hợp mạch áp điện sinh học'
          locomotion = 'Cộng hưởng từ tính và khớp tinh thể linh hoạt'
          adaptations.push('Xử lý thông tin bằng xung lượng tử áp điện')
        } else if (planetaryLineage === 'aero_atmospheric' || pressure > 1.8) {
          sapientArchetype = 'aerial_avian'
          sapientLabel = 'Dực nhân Tầng không (Aero-Avian)'
          scientificName = 'Aeroavis sapiens'
          morphology = 'Khung xương sợi rỗng siêu nhẹ, sải cánh rộng lớn kết hợp chi tay khéo léo'
          locomotion = 'Bay lượn ba chiều không gian và lướt gió'
          adaptations.push('Tư duy định vị siêu thanh và bản đồ không gian 3D')
        } else {
          sapientArchetype = 'humanoid'
          sapientLabel = 'Hình nhân Đứng thẳng (Anthropoid Sapient)'
          scientificName = 'Homo noosphere'
          morphology = 'Thân đứng thẳng hai chân, bàn tay 5 ngón đối ngón linh hoạt, vỏ não phát triển tột bậc'
          locomotion = 'Dáng đi hai chân (bipedal) bền bỉ trên mọi địa hình cạn'
          adaptations.push('Chế tác công cụ phức tạp và truyền đạt tri thức trừu tượng')
        }
        break
    }

    const taxonomicHierarchy = TaxonomyEngine.generateTaxonomicHierarchy(
      tier,
      domain,
      planetaryLineage,
      sapientArchetype,
      trophicRole,
      scientificName,
      trophicLevel
    )

    return {
      tier,
      tierLabel,
      tierRank,
      cellularGrade,
      bodySymmetry,
      domain,
      domainLabel,
      domainIcon,
      trophicRole,
      trophicRoleLabel,
      trophicLevel,
      dietDescription,
      scientificName,
      planetaryLineage,
      planetaryLineageLabel,
      trophicMode,
      trophicLabel,
      morphology,
      locomotion,
      sapientArchetype,
      sapientLabel,
      notableAdaptations: adaptations,
      complexityIndex,
      taxonomicHierarchy,
    }
  }

  /**
   * Generates authentic 7-level Linnaean taxonomic hierarchy
   * (Giới / Kingdom -> Ngành / Phylum -> Lớp / Class -> Bộ / Order -> Họ / Family -> Chi / Genus -> Loài / Species)
   */
  static generateTaxonomicHierarchy(
    tier: EvolutionTier,
    domain: OrganismDomain,
    planetaryLineage: PlanetaryLineage,
    sapientArchetype: SapientArchetype | undefined,
    trophicRole: TrophicRole,
    scientificName: string,
    trophicLevel: number
  ): TaxonomicHierarchy {
    // 1. Humanoid Sapient (Con người hiện đại: Homo sapiens)
    if (sapientArchetype === 'humanoid' || (tier === 'sapient' && planetaryLineage === 'terran_carbon')) {
      return {
        domainRank: 'Eukaryota (Sinh vật nhân thực)',
        kingdom: 'Animalia (Giới Động vật)',
        phylum: 'Chordata (Ngành Có dây sống / Cột sống)',
        classRank: 'Mammalia (Lớp Động vật có vú / Lớp Thú)',
        orderRank: 'Primates (Bộ Linh trưởng)',
        familyRank: 'Hominidae (Họ Người)',
        genusRank: 'Homo (Chi Người)',
        speciesRank: scientificName || 'Homo sapiens (Con người hiện đại)',
      }
    }

    // 2. Extraterrestrial Sapient Lineages
    if (tier === 'sapient') {
      if (sapientArchetype === 'aquatic_cephalopod') {
        return {
          domainRank: 'Eukaryota (Nhân thực thủy quyển)',
          kingdom: 'Animalia (Động vật)',
          phylum: 'Mollusca (Ngành Thân mềm)',
          classRank: 'Cephalopoda (Lớp Chân đầu trí tuệ)',
          orderRank: 'Octopoda (Bộ Bạch tuộc phát quang)',
          familyRank: 'Bathycephalidae (Họ Thủy tộc vực sâu)',
          genusRank: 'Cephalopoda',
          speciesRank: scientificName,
        }
      }
      if (sapientArchetype === 'silicon_crystalline') {
        return {
          domainRank: 'Lithobiota (Sinh giới khoáng silic)',
          kingdom: 'Crystallia (Giới Tinh thể sinh học)',
          phylum: 'Piezochorda (Ngành Dây áp điện)',
          classRank: 'Silicoclasia (Lớp Tinh thể bán dẫn)',
          orderRank: 'Lithosapientia (Bộ Trí tuệ thạch anh)',
          familyRank: 'Pyrosilicidae (Họ Tinh thể nham thạch)',
          genusRank: 'Lithosapiens',
          speciesRank: scientificName,
        }
      }
      if (sapientArchetype === 'aerial_avian') {
        return {
          domainRank: 'Eukaryota (Nhân thực khí quyển)',
          kingdom: 'Animalia (Động vật)',
          phylum: 'Chordata (Có dây sống)',
          classRank: 'Aves (Lớp Chim / Dực tộc)',
          orderRank: 'Aero-Primates (Bộ Linh trưởng bay lượn)',
          familyRank: 'Aeroavidae (Họ Dực nhân tầng không)',
          genusRank: 'Aeroavis',
          speciesRank: scientificName,
        }
      }
      if (sapientArchetype === 'cryo_titan') {
        return {
          domainRank: 'Cryobiota (Sinh giới siêu hàn)',
          kingdom: 'Animalia (Động vật)',
          phylum: 'Chordata (Có dây sống)',
          classRank: 'Mammalia (Lớp Thú hàn đới khổng lồ)',
          orderRank: 'Cryotheria (Bộ Cự thú băng vĩnh cửu)',
          familyRank: 'Glaciatitanidae (Họ Băng khổng lồ)',
          genusRank: 'Glaciatitan',
          speciesRank: scientificName,
        }
      }
    }

    // 3. Stage 7: Advanced Organisms (Mammals, Apex Carnivores, Avian, Flora)
    if (tier === 'advanced') {
      if (domain === 'flora') {
        return {
          domainRank: 'Eukaryota (Sinh vật nhân thực)',
          kingdom: 'Plantae (Giới Thực vật)',
          phylum: 'Tracheophyta (Ngành Thực vật có mạch)',
          classRank: 'Magnoliopsida (Lớp Thực vật hạt kín / Đại mộc)',
          orderRank: 'Fagales (Bộ Dẻ / Rừng đại ngàn)',
          familyRank: 'Fagaceae (Họ Cây thân gỗ)',
          genusRank: 'Silvamagna',
          speciesRank: scientificName,
        }
      }
      // Fauna: Mammalia or Higher Chordates
      if (trophicLevel >= 5 || trophicRole === 'carnivore' || trophicRole === 'omnivore') {
        return {
          domainRank: 'Eukaryota (Sinh vật nhân thực)',
          kingdom: 'Animalia (Giới Động vật)',
          phylum: 'Chordata (Ngành Có dây sống / Động vật có xương sống)',
          classRank: 'Mammalia (Lớp Động vật có vú / Lớp Thú)',
          orderRank: trophicRole === 'carnivore' ? 'Carnivora (Bộ Ăn thịt)' : 'Cetartiodactyla (Bộ Móng guốc / Thú biển)',
          familyRank: trophicRole === 'carnivore' ? 'Felidae / Ursidae (Họ Mèo lớn / Họ Gấu)' : 'Bovidae / Delphinidae (Họ Móng guốc / Cá voi)',
          genusRank: 'Theriosaurus',
          speciesRank: scientificName,
        }
      }
      return {
        domainRank: 'Eukaryota (Sinh vật nhân thực)',
        kingdom: 'Animalia (Giới Động vật)',
        phylum: 'Chordata (Ngành Có dây sống)',
        classRank: 'Mammalia (Lớp Động vật có vú ăn thực vật)',
        orderRank: 'Artiodactyla (Bộ Móng guốc chẵn)',
        familyRank: 'Bovidae (Họ Trâu bò / Thú gặm cỏ)',
        genusRank: 'Herbitherium',
        speciesRank: scientificName,
      }
    }

    // 4. Stage 6: Complex Bilaterians (Bilateria: Cá nhỏ, Giáp xác, Bọ nước Daphnia, Côn trùng)
    if (tier === 'complex_bilaterian' || tier === 'complex_multicellular') {
      if (domain === 'flora') {
        return {
          domainRank: 'Eukaryota (Sinh vật nhân thực)',
          kingdom: 'Plantae (Giới Thực vật)',
          phylum: 'Pteridophyta (Ngành Dương xỉ / Quyết có mạch)',
          classRank: 'Polypodiopsida',
          orderRank: 'Polypodiales',
          familyRank: 'Polypodiaceae',
          genusRank: 'Flora',
          speciesRank: scientificName,
        }
      }
      if (trophicRole === 'herbivore') {
        return {
          domainRank: 'Eukaryota (Sinh vật nhân thực)',
          kingdom: 'Animalia (Giới Động vật)',
          phylum: 'Arthropoda (Ngành Chân khớp / Giáp xác)',
          classRank: 'Branchiopoda (Lớp Mang chân / Bọ nước)',
          orderRank: 'Cladocera (Bộ Râu ngành)',
          familyRank: 'Daphniidae (Họ Bọ nước Daphnia)',
          genusRank: 'Daphnia',
          speciesRank: scientificName,
        }
      }
      return {
        domainRank: 'Eukaryota (Sinh vật nhân thực)',
        kingdom: 'Animalia (Giới Động vật)',
        phylum: 'Chordata (Ngành Có dây sống)',
        classRank: 'Actinopterygii (Lớp Cá vây tia / Cá nhỏ)',
        orderRank: 'Clupeiformes (Bộ Cá trích / Cá cơm)',
        familyRank: 'Engraulidae (Họ Cá cơm)',
        genusRank: 'Bilateria',
        speciesRank: scientificName,
      }
    }

    // 5. Stage 5: Primitive Animals (Bọt biển / Porifera, Ruột khoang / Cnidaria)
    if (tier === 'primitive_animal') {
      if (domain === 'flora') {
        return {
          domainRank: 'Eukaryota (Sinh vật nhân thực)',
          kingdom: 'Plantae (Giới Thực vật)',
          phylum: 'Chlorophyta (Ngành Tảo lục đa bào)',
          classRank: 'Chlorophyceae',
          orderRank: 'Volvocales',
          familyRank: 'Volvocaceae',
          genusRank: 'Alga',
          speciesRank: scientificName,
        }
      }
      const isPorifera = trophicRole === 'herbivore'
      return {
        domainRank: 'Eukaryota (Sinh vật nhân thực)',
        kingdom: 'Animalia (Giới Động vật)',
        phylum: isPorifera ? 'Porifera (Ngành Thân lỗ / Bọt biển)' : 'Cnidaria (Ngành Ruột khoang / Sứa, San hô)',
        classRank: isPorifera ? 'Demospongiae (Lớp Bọt biển thông thường)' : 'Scyphozoa (Lớp Sứa đối xứng tỏa tròn)',
        orderRank: isPorifera ? 'Dictyoceratida' : 'Semaeostomeae',
        familyRank: isPorifera ? 'Spongiidae' : 'Cyaneidae',
        genusRank: isPorifera ? 'Porifera' : 'Cnidaria',
        speciesRank: scientificName,
      }
    }

    // 6. Stage 4: Differentiated Tissue
    if (tier === 'differentiated_tissue') {
      return {
        domainRank: 'Eukaryota (Sinh vật nhân thực)',
        kingdom: domain === 'flora' ? 'Plantae (Giới Thực vật)' : domain === 'fungi' ? 'Fungi (Giới Nấm)' : 'Protista (Nguyên sinh)',
        phylum: domain === 'flora' ? 'Bryophyta (Ngành Rêu mô sơ khai)' : 'Placozoa (Đa bào dạng tấm)',
        classRank: 'Bryopsida',
        orderRank: 'Bryales',
        familyRank: 'Bryaceae',
        genusRank: 'Thallus',
        speciesRank: scientificName,
      }
    }

    // 7. Stage 3: Simple Multicellular (Tập đoàn đa bào / Tảo sợi)
    if (tier === 'simple_multicellular') {
      return {
        domainRank: 'Eukaryota (Sinh vật nhân thực)',
        kingdom: domain === 'fungi' ? 'Fungi (Giới Nấm)' : 'Plantae (Giới Thực vật)',
        phylum: 'Chlorophyta (Ngành Tảo lục)',
        classRank: 'Ulvophyceae (Lớp Tảo màng)',
        orderRank: 'Ulvales',
        familyRank: 'Ulvaceae',
        genusRank: 'Alga',
        speciesRank: scientificName,
      }
    }

    // 8. Stage 2: Eukaryotes (Nguyên sinh vật nhân thực: Trùng giày, Trùng roi, Tảo đơn bào)
    if (tier === 'eukaryote') {
      const isProtozoan = trophicRole === 'herbivore'
      return {
        domainRank: 'Eukaryota (Sinh vật nhân thực)',
        kingdom: 'Protista (Giới Nguyên sinh vật)',
        phylum: isProtozoan ? 'Ciliophora (Ngành Trùng lông / Trùng giày)' : 'Chlorophyta (Ngành Tảo lục đơn bào)',
        classRank: isProtozoan ? 'Ciliatea' : 'Chlorophyceae',
        orderRank: isProtozoan ? 'Peniculida' : 'Chlamydomonadales',
        familyRank: isProtozoan ? 'Parameciidae (Họ Trùng giày)' : 'Chlamydomonadaceae',
        genusRank: isProtozoan ? 'Paramecium' : 'Chlamydomonas',
        speciesRank: scientificName,
      }
    }

    // 9. Stage 1: Prokaryotes (Tế bào nhân sơ: Vi khuẩn lam, Vi khuẩn hóa dưỡng)
    return {
      domainRank: 'Prokaryota (Sinh vật nhân sơ)',
      kingdom: 'Monera (Giới Khởi sinh / Bacteria)',
      phylum: 'Cyanobacteria (Ngành Vi khuẩn lam quang hợp)',
      classRank: 'Cyanophyceae',
      orderRank: 'Chroococcales',
      familyRank: 'Chroococcaceae',
      genusRank: 'Prokaryota',
      speciesRank: scientificName,
    }
  }

  /**
   * Generates a descriptive scientific common name for a species based on tier, lineage, and domain/trophicRole.
   */
  static generateSpeciesDisplayName(
    tier: EvolutionTier,
    sapientArchetype?: SapientArchetype,
    domain: OrganismDomain = 'microbe',
    trophicRole: TrophicRole = 'producer',
    index = 1,
    planetaryLineage: PlanetaryLineage = 'terran_carbon'
  ): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const suffix = letters[(index - 1) % letters.length] ?? 'A'

    if (tier === 'sapient') {
      if (sapientArchetype === 'aquatic_cephalopod') return `Thủy tộc Trí tuệ ${suffix}`
      if (sapientArchetype === 'silicon_crystalline') return `Người Tinh thể Silic ${suffix}`
      if (sapientArchetype === 'aerial_avian') return `Dực tộc Tầng không ${suffix}`
      if (sapientArchetype === 'cryo_titan') return `Khổng lồ Băng tuyết ${suffix}`
      return `Hình nhân Khôn ngoan ${suffix}`
    }

    if (tier === 'prokaryote' || tier === 'unicellular') {
      if (planetaryLineage === 'silico_crystalline') return `Nguyên bào Silic Nhân sơ ${suffix}`
      if (planetaryLineage === 'cryo_methanogen') return `Vi sinh Mê-tan Nhân sơ ${suffix}`
      if (planetaryLineage === 'aero_atmospheric') return `Bào thể Khí Nhân sơ ${suffix}`
      if (planetaryLineage === 'abyssal_chemosynthetic') return `Cổ khuẩn Vực sâu ${suffix}`
      if (planetaryLineage === 'radiotrophic_litho') return `Vi khuẩn Giáp bức xạ ${suffix}`
      return `Vi khuẩn Nhân sơ ${suffix}`
    }

    if (tier === 'eukaryote') {
      if (planetaryLineage === 'silico_crystalline') return `Đơn bào Silic Nhân thực ${suffix}`
      if (planetaryLineage === 'cryo_methanogen') return `Nguyên sinh vật Băng giá ${suffix}`
      if (planetaryLineage === 'aero_atmospheric') return `Bào tử Khí Nhân thực ${suffix}`
      if (planetaryLineage === 'abyssal_chemosynthetic') return `Nguyên sinh vật Vực sâu ${suffix}`
      if (planetaryLineage === 'radiotrophic_litho') return `Đơn bào Bức xạ Nhân thực ${suffix}`
      return `Nguyên sinh vật Nhân thực ${suffix}`
    }

    if (tier === 'simple_multicellular') {
      if (planetaryLineage === 'silico_crystalline') return `Cụm Pha lê Bán dẫn ${suffix}`
      if (planetaryLineage === 'cryo_methanogen') return `Tảo Sợi Hydrocacbon ${suffix}`
      if (planetaryLineage === 'aero_atmospheric') return `Tập đoàn Túi khí ${suffix}`
      if (planetaryLineage === 'abyssal_chemosynthetic') return `Thảm Vi sinh Dạ quang ${suffix}`
      if (planetaryLineage === 'radiotrophic_litho') return `Rêu Khoáng Bức xạ ${suffix}`
      return `Tập đoàn Đa bào ${suffix}`
    }

    if (tier === 'differentiated_tissue') {
      if (planetaryLineage === 'silico_crystalline') return `Phiến Đá Phân hóa mô ${suffix}`
      if (planetaryLineage === 'cryo_methanogen') return `Tảo Băng Phân hóa mô ${suffix}`
      if (planetaryLineage === 'aero_atmospheric') return `Màng Sợi Tầng đối lưu ${suffix}`
      if (planetaryLineage === 'abyssal_chemosynthetic') return `Thực vật Vực sâu có mô ${suffix}`
      if (planetaryLineage === 'radiotrophic_litho') return `Thạch sinh Biểu mô ${suffix}`
      return `Sinh vật Phân hóa mô ${suffix}`
    }

    if (tier === 'primitive_animal') {
      if (planetaryLineage === 'silico_crystalline') return `San hô Silic Tỏa tròn ${suffix}`
      if (planetaryLineage === 'cryo_methanogen') return `Sứa Cryo Băng tuyết ${suffix}`
      if (planetaryLineage === 'aero_atmospheric') return `Thể dù Khí quyển ${suffix}`
      if (planetaryLineage === 'abyssal_chemosynthetic') return `Bọt biển Dạ quang Vực sâu ${suffix}`
      if (planetaryLineage === 'radiotrophic_litho') return `Polyp Thạch giáp Tỏa tròn ${suffix}`
      return `Bọt biển / Ruột khoang Tỏa tròn ${suffix}`
    }

    if (tier === 'complex_bilaterian' || tier === 'complex_multicellular') {
      if (planetaryLineage === 'silico_crystalline') return `Giáp xác Silic Đối xứng ${suffix}`
      if (planetaryLineage === 'cryo_methanogen') return `Kỳ giông Mê-tan Đối xứng ${suffix}`
      if (planetaryLineage === 'aero_atmospheric') return `Dực thú Khí quyển Đối xứng ${suffix}`
      if (planetaryLineage === 'abyssal_chemosynthetic') return `Chân khớp Biển sâu Đối xứng ${suffix}`
      if (planetaryLineage === 'radiotrophic_litho') return `Bò sát Vỏ bức xạ Đối xứng ${suffix}`
      return `Động vật Đối xứng 2 bên ${suffix}`
    }

    if (tier === 'advanced') {
      if (planetaryLineage === 'silico_crystalline') return `Cự thú Nham thạch ${suffix}`
      if (planetaryLineage === 'cryo_methanogen') return `Cự thú Vỏ băng ${suffix}`
      if (planetaryLineage === 'aero_atmospheric') return `Dực thú Tầng không ${suffix}`
      if (planetaryLineage === 'abyssal_chemosynthetic') return `Leviathan Đáy vực ${suffix}`
      if (planetaryLineage === 'radiotrophic_litho') return `Dã thú Vỏ bức xạ ${suffix}`
    }

    switch (domain) {
      case 'flora':
        return `Thực vật Quang hợp ${suffix}`
      case 'fungi':
        return `Nấm Phân giải ${suffix}`
      case 'fauna':
        if (trophicRole === 'carnivore') return `Thú Săn mồi ${suffix}`
        if (trophicRole === 'omnivore') return `Dã thú Ăn tạp ${suffix}`
        return `Dã thú Ăn cỏ ${suffix}`
      default:
        return `Sinh vật Phức hợp ${suffix}`
    }
  }
}
