import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SpeciesCardsDock } from '../SpeciesCardsDock.js'
import type { SpeciesSummary } from '../../genetics/types.js'

describe('SpeciesCardsDock', () => {
  const mockSpecies: SpeciesSummary[] = [
    {
      id: 'sp_1',
      name: 'Thực vật Quang hợp A',
      color: '#10b981',
      population: 1500,
      generation: 4,
      averageFitness: 0.85,
      dominantTraits: {
        thermalOptimum: 25,
        waterConservation: 0.6,
        resilience: 0.4,
      },
      isExtinct: false,
      tier: 'simple_multicellular',
      tierLabel: 'Đa bào sơ khai',
      tierRank: 2,
      scientificName: 'Alga simplex',
      domain: 'flora',
      domainLabel: 'Thực vật',
      domainIcon: '🌿',
      trophicRole: 'producer',
      trophicRoleLabel: 'Sinh vật sản xuất (Thực vật)',
      trophicLevel: 1,
      foodChainSummary: 'Quang năng sao & khoáng chất',
      biologicalTraits: {
        tier: 'simple_multicellular',
        tierLabel: 'Đa bào sơ khai',
        tierRank: 2,
        domain: 'flora',
        domainLabel: 'Thực vật',
        domainIcon: '🌿',
        trophicRole: 'producer',
        trophicRoleLabel: 'Sinh vật sản xuất',
        trophicLevel: 1,
        dietDescription: 'Quang hợp ánh sáng sao',
        scientificName: 'Alga simplex',
        planetaryLineage: 'terran_carbon',
        planetaryLineageLabel: 'Nhánh Hữu cơ Nguyên sinh',
        trophicMode: 'autotroph',
        trophicLabel: 'Quang tự dưỡng ánh sáng sao',
        morphology: 'Tảo sợi lục',
        locomotion: 'Bám rễ trên đá',
        notableAdaptations: ['Điều hòa thân nhiệt'],
        complexityIndex: 0.25,
      },
    },
    {
      id: 'sp_2',
      name: 'Thú Săn mồi A',
      color: '#f59e0b',
      population: 45000,
      generation: 25,
      averageFitness: 0.95,
      dominantTraits: {
        thermalOptimum: 22,
        waterConservation: 0.8,
        resilience: 0.7,
      },
      isExtinct: false,
      tier: 'advanced',
      tierLabel: 'Động thực vật bậc cao',
      tierRank: 4,
      scientificName: 'Theriosaurus venator',
      domain: 'fauna',
      domainLabel: 'Động vật',
      domainIcon: '🐾',
      trophicRole: 'carnivore',
      trophicRoleLabel: 'Động vật ăn thịt (Săn mồi)',
      trophicLevel: 3,
      foodChainSummary: 'Săn: Dã thú Ăn cỏ',
      biologicalTraits: {
        tier: 'advanced',
        tierLabel: 'Động thực vật bậc cao',
        tierRank: 4,
        domain: 'fauna',
        domainLabel: 'Động vật',
        domainIcon: '🐾',
        trophicRole: 'carnivore',
        trophicRoleLabel: 'Động vật ăn thịt',
        trophicLevel: 3,
        dietDescription: 'Săn bắt động vật ăn cỏ',
        scientificName: 'Theriosaurus venator',
        planetaryLineage: 'terran_carbon',
        planetaryLineageLabel: 'Nhánh Hữu cơ Nguyên sinh',
        trophicMode: 'heterotroph',
        trophicLabel: 'Dị dưỡng tiêu thụ',
        morphology: 'Thân linh hoạt, nanh vuốt săn mồi',
        locomotion: 'Bốn chi tốc độ cao',
        notableAdaptations: ['Khứu giác tinh nhạy'],
        complexityIndex: 0.65,
      },
    },
    {
      id: 'sp_extinct_1',
      name: 'Vi sinh vật Cổ đại Tuyệt diệt',
      color: '#ef4444',
      population: 0,
      generation: 12,
      averageFitness: 0.1,
      dominantTraits: {
        thermalOptimum: 30,
        waterConservation: 0.5,
        resilience: 0.2,
      },
      isExtinct: true,
      emergenceRotation: 5,
      extinctionRotation: 45,
      lifespanRotations: 40,
      tier: 'unicellular',
      tierLabel: 'Đơn bào',
      tierRank: 1,
      scientificName: 'Archaeon primordialis',
      domain: 'microbe',
      domainLabel: 'Vi sinh',
      domainIcon: '🦠',
      trophicRole: 'producer',
      trophicRoleLabel: 'Hóa tự dưỡng',
      trophicLevel: 1,
    },
    {
      id: 'sp_mega_1',
      name: 'Tập đoàn Vi khuẩn Vô tận',
      color: '#06b6d4',
      population: 2_500_000_000,
      generation: 80,
      averageFitness: 0.9,
      dominantTraits: {
        thermalOptimum: 20,
        waterConservation: 0.5,
        resilience: 0.8,
      },
      isExtinct: false,
      tier: 'unicellular',
      tierLabel: 'Đơn bào',
      tierRank: 1,
      scientificName: 'Cyanobacteria infinitus',
      domain: 'microbe',
      domainLabel: 'Vi sinh',
      domainIcon: '🦠',
      trophicRole: 'producer',
      trophicRoleLabel: 'Sinh vật sản xuất',
      trophicLevel: 1,
    },
  ]

  it('renders floating dock toggle button when closed', () => {
    render(<SpeciesCardsDock speciesSummaries={mockSpecies} />)
    expect(screen.getByText(/Chuỗi Thức Ăn & Phân Loại Sinh Vật \(4\)/)).toBeInTheDocument()
  })

  it('opens cards dock when clicking toggle button and displays species cards', () => {
    render(<SpeciesCardsDock speciesSummaries={mockSpecies} />)
    const toggleBtn = screen.getByText(/Chuỗi Thức Ăn & Phân Loại Sinh Vật \(4\)/)
    fireEvent.click(toggleBtn)

    expect(screen.getByText('Thực vật Quang hợp A')).toBeInTheDocument()
    expect(screen.getByText('Thú Săn mồi A')).toBeInTheDocument()
    expect(screen.getByText('Alga simplex')).toBeInTheDocument()
    expect(screen.getByText('Theriosaurus venator')).toBeInTheDocument()
    expect(screen.getByText(/Quang năng sao & khoáng chất/)).toBeInTheDocument()
  })

  it('formats populations with k, m, and infinity symbol', () => {
    render(<SpeciesCardsDock speciesSummaries={mockSpecies} embedded />)

    // sp_1: 1500 -> '1.5k'
    expect(screen.getByText('1.5k')).toBeInTheDocument()
    // sp_2: 45000 -> '45k'
    expect(screen.getByText('45k')).toBeInTheDocument()
    // sp_mega_1: 2.5 billion -> '∞'
    expect(screen.getByText('∞')).toBeInTheDocument()
  })

  it('sorts living species descending by population', () => {
    render(<SpeciesCardsDock speciesSummaries={mockSpecies} embedded />)

    // The living species names in order should be:
    // 1. Tập đoàn Vi khuẩn Vô tận (2.5 billion)
    // 2. Thú Săn mồi A (45,000)
    // 3. Thực vật Quang hợp A (1,500)
    const allTitles = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(allTitles[0]).toBe('Tập đoàn Vi khuẩn Vô tận')
    expect(allTitles[1]).toBe('Thú Săn mồi A')
    expect(allTitles[2]).toBe('Thực vật Quang hợp A')
  })

  it('renders extinct species collapsed into a single line showing lifespan in rotations', () => {
    render(<SpeciesCardsDock speciesSummaries={mockSpecies} embedded />)

    // Extinct species header
    expect(screen.getByText(/Loài đã tuyệt chủng \(1\)/)).toBeInTheDocument()
    expect(screen.getByText('Vi sinh vật Cổ đại Tuyệt diệt')).toBeInTheDocument()
    expect(screen.getByText(/Đã tồn tại: 40 vòng quay/)).toBeInTheDocument()
  })

  it('filters species cards by domain tabs', () => {
    render(<SpeciesCardsDock speciesSummaries={mockSpecies} />)
    fireEvent.click(screen.getByText(/Chuỗi Thức Ăn & Phân Loại Sinh Vật \(4\)/))

    // Click 'Thực vật' tab
    const floraTab = screen.getByRole('button', { name: /Thực vật/i })
    fireEvent.click(floraTab)

    expect(screen.getByText('Thực vật Quang hợp A')).toBeInTheDocument()
    expect(screen.queryByText('Thú Săn mồi A')).not.toBeInTheDocument()

    // Click 'Động vật' tab
    const faunaTab = screen.getByRole('button', { name: /Động vật/i })
    fireEvent.click(faunaTab)

    expect(screen.queryByText('Thực vật Quang hợp A')).not.toBeInTheDocument()
    expect(screen.getByText('Thú Săn mồi A')).toBeInTheDocument()
  })

  it('switches to Trophic Food Web view mode', () => {
    render(<SpeciesCardsDock speciesSummaries={mockSpecies} />)
    fireEvent.click(screen.getByText(/Chuỗi Thức Ăn & Phân Loại Sinh Vật \(4\)/))

    // Click 'Chuỗi & Mạng Lưới Thức Ăn' view button
    const foodWebBtn = screen.getByRole('button', { name: /Chuỗi & Mạng Lưới Thức Ăn/i })
    fireEvent.click(foodWebBtn)

    expect(screen.getByText(/Bậc 3: Động Vật Ăn Thịt & Săn Mồi/)).toBeInTheDocument()
    expect(screen.getByText(/Bậc 1: Sinh Vật Sản Xuất Nền Tảng/)).toBeInTheDocument()
  })

  it('renders virtual scroll container and adapts card style for embedded layout', () => {
    const { container } = render(<SpeciesCardsDock speciesSummaries={mockSpecies} embedded />)

    const virtualList = screen.getByTestId('virtual-species-list')
    expect(virtualList).toBeInTheDocument()
    expect(virtualList).toHaveClass('overflow-y-auto')

    // In embedded layout, card has w-full
    const firstCard = container.querySelector('.w-full.h-\\[185px\\]')
    expect(firstCard).toBeInTheDocument()
    expect(screen.getByText('Cuộn ảo dọc • 60 FPS')).toBeInTheDocument()
  })

  it('adapts card style for standalone horizontal carousel layout', () => {
    const { container } = render(<SpeciesCardsDock speciesSummaries={mockSpecies} />)
    fireEvent.click(screen.getByText(/Chuỗi Thức Ăn & Phân Loại Sinh Vật \(4\)/))

    const virtualList = screen.getByTestId('virtual-species-list')
    expect(virtualList).toBeInTheDocument()
    expect(virtualList).toHaveClass('overflow-x-auto')

    // In standalone layout, card has w-80 flex-shrink-0
    const standaloneCard = container.querySelector('.w-80.flex-shrink-0')
    expect(standaloneCard).toBeInTheDocument()
    expect(screen.getByText('Cuộn ảo ngang • 60 FPS')).toBeInTheDocument()
  })

  it('renders all 6 complete trophic levels and aquatic / terrestrial food chain flows', () => {
    const baseProducer = mockSpecies[0]!
    const baseCarnivore = mockSpecies[1]!
    const multiTrophicSpecies: SpeciesSummary[] = [
      {
        ...baseProducer,
        id: 'sp_p1',
        name: 'Tảo Đơn Bào Quang Hợp',
        trophicRole: 'producer',
        trophicLevel: 1,
      },
      {
        ...baseProducer,
        id: 'sp_c1',
        name: 'Bọ Nước Daphnia',
        trophicRole: 'herbivore',
        trophicLevel: 2,
      },
      {
        ...baseCarnivore,
        id: 'sp_c2',
        name: 'Cá Nhỏ Thủy Sinh',
        trophicRole: 'carnivore',
        trophicLevel: 3,
      },
      {
        ...baseCarnivore,
        id: 'sp_c3',
        name: 'Hải Cẩu & Chim Biển',
        trophicRole: 'carnivore',
        trophicLevel: 4,
      },
      {
        ...baseCarnivore,
        id: 'sp_c4',
        name: 'Cá Voi Sát Thủ',
        trophicRole: 'carnivore',
        trophicLevel: 5,
        tier: 'advanced',
      },
      {
        ...baseProducer,
        id: 'sp_dec',
        name: 'Vi Khuẩn Hoại Sinh',
        trophicRole: 'decomposer',
        domain: 'fungi',
      },
    ]

    render(<SpeciesCardsDock speciesSummaries={multiTrophicSpecies} />)
    fireEvent.click(screen.getByText(/Chuỗi Thức Ăn & Phân Loại Sinh Vật \(6\)/))

    const foodWebBtn = screen.getByRole('button', { name: /Chuỗi & Mạng Lưới Thức Ăn/i })
    fireEvent.click(foodWebBtn)

    // Check educational diagrams
    expect(screen.getByText(/Chuỗi Dưới Nước \(Aquatic Chain\)/)).toBeInTheDocument()
    expect(screen.getByText(/Chuỗi Ven Bờ & Trên Cạn/)).toBeInTheDocument()

    // Check all 6 trophic tiers
    expect(screen.getByText(/Bậc 5: Động Vật Có Vú & Đỉnh Chuỗi/)).toBeInTheDocument()
    expect(screen.getByText(/Bậc 4: Động Vật Ăn Thịt Bậc Cao/)).toBeInTheDocument()
    expect(screen.getByText(/Bậc 3: Động Vật Ăn Thịt & Săn Mồi/)).toBeInTheDocument()
    expect(screen.getByText(/Bậc 2: Động Vật Ăn Thực Vật & Ăn Tạp/)).toBeInTheDocument()
    expect(screen.getByText(/Bậc 1: Sinh Vật Sản Xuất Nền Tảng/)).toBeInTheDocument()
    expect(screen.getByText(/Sinh Vật Phân Giải & Tuần Hoàn Vật Chất/)).toBeInTheDocument()

    // Verify individual species badges
    expect(screen.getByText('Cá Voi Sát Thủ')).toBeInTheDocument()
    expect(screen.getByText('Hải Cẩu & Chim Biển')).toBeInTheDocument()
    expect(screen.getByText('Cá Nhỏ Thủy Sinh')).toBeInTheDocument()
    expect(screen.getByText('Bọ Nước Daphnia')).toBeInTheDocument()
    expect(screen.getByText('Tảo Đơn Bào Quang Hợp')).toBeInTheDocument()
    expect(screen.getByText('Vi Khuẩn Hoại Sinh')).toBeInTheDocument()
  })

  it('switches to Linnaean Taxonomy & Population Demographics view mode', () => {
    const baseSapient = mockSpecies[1]!
    const testList: SpeciesSummary[] = [
      {
        ...baseSapient,
        id: 'sp_sapient',
        name: 'Con Người Hiện Đại',
        tier: 'sapient',
        scientificName: 'Homo sapiens',
        taxonomicHierarchy: {
          domainRank: 'Eukaryota (Sinh vật nhân thực)',
          kingdom: 'Animalia (Giới Động vật)',
          phylum: 'Chordata (Ngành Có dây sống)',
          classRank: 'Mammalia (Lớp Động vật có vú)',
          orderRank: 'Primates (Bộ Linh trưởng)',
          familyRank: 'Hominidae (Họ Người)',
          genusRank: 'Homo (Chi Người)',
          speciesRank: 'Homo sapiens (Con người hiện đại)',
        },
        demographics: {
          size: 7800000000,
          densityPerCell: 120.5,
          sexRatio: { malePct: 50, femalePct: 50 },
          ageStructure: { preReproductivePct: 25, reproductivePct: 55, postReproductivePct: 20 },
          distributionPattern: 'clumped',
          distributionLabel: 'Phân bố theo nhóm (Đô thị hóa & quần cư)',
          cellularGradeDetail: {
            cellType: 'eukaryote',
            cellTypeLabel: 'Tế bào nhân thực',
            specialization: 'Hàng nghìn tỷ tế bào nhân thực chuyên hóa sâu (thần kinh, cơ, máu, biểu mô)',
          },
          socialTraits: {
            isHumanoidOrSapient: true,
            socialOrganization: 'Tổ chức xã hội cấp tiến: Gia đình, thị tộc, đô thị hóa & pháp luật',
            toolUseAndTechnology: 'Chế tác công cụ phức tạp, làm chủ năng lượng & khoa học kỹ thuật',
            culturalTransmission: 'Ngôn ngữ, chữ viết, giáo dục truyền đạt tri thức và đạo đức qua các thế hệ',
            environmentalModification: 'Khả năng cải tạo môi trường sống chủ động: Y tế, nông nghiệp, kiến trúc',
          },
        },
      },
    ]

    render(<SpeciesCardsDock speciesSummaries={testList} />)
    fireEvent.click(screen.getByText(/Chuỗi Thức Ăn & Phân Loại Sinh Vật \(1\)/))

    // Click 'Phân Loại Học & Quần Thể' view button
    const taxonomyBtn = screen.getByRole('button', { name: /Phân Loại Học & Quần Thể/i })
    fireEvent.click(taxonomyBtn)

    // Check 4 Levels of Organization
    expect(screen.getByText(/4 Cấp Độ Tổ Chức Sinh Học \(Từ Tế Bào Đến Loài\)/)).toBeInTheDocument()
    expect(screen.getByText(/Tế Bào \(Đơn vị cấu tạo & chức năng/)).toBeInTheDocument()
    expect(screen.getByText(/Loài & Quần Thể \(5 Đặc trưng cơ bản\)/)).toBeInTheDocument()

    // Check 7-Rank Linnaean Hierarchy from Mammalia to Homo sapiens
    expect(screen.getByText(/Thang Phân Loại Sinh Học Linnaean \(Từ Giới Đến Con Người\)/)).toBeInTheDocument()
    expect(screen.getByText('Animalia')).toBeInTheDocument()
    expect(screen.getByText('Chordata')).toBeInTheDocument()
    expect(screen.getByText('Mammalia')).toBeInTheDocument()
    expect(screen.getByText('Primates')).toBeInTheDocument()
    expect(screen.getByText('Hominidae')).toBeInTheDocument()
    expect(screen.getByText('Homo')).toBeInTheDocument()
    expect(screen.getByText('H. sapiens')).toBeInTheDocument()

    // Check Human population social characteristics
    expect(screen.getByText(/Quần Thể Người \(Homo sapiens\) & Các Đặc Điểm Xã Hội Vượt Trội/)).toBeInTheDocument()
    expect(screen.getByText(/Tổ chức xã hội:/)).toBeInTheDocument()
    expect(screen.getByText(/Công cụ & Kỹ thuật:/)).toBeInTheDocument()
    expect(screen.getByText(/Văn hóa & Giáo dục:/)).toBeInTheDocument()
    expect(screen.getByText(/Cải tạo môi trường:/)).toBeInTheDocument()

    // Check individual living species demographics display
    expect(screen.getByText('Con Người Hiện Đại')).toBeInTheDocument()
    expect(screen.getByText(/120.5/)).toBeInTheDocument()
    expect(screen.getByText(/50% ♂/)).toBeInTheDocument()
    expect(screen.getByText(/50% ♀/)).toBeInTheDocument()
    expect(screen.getByText(/Non:/)).toBeInTheDocument()
  })
})
