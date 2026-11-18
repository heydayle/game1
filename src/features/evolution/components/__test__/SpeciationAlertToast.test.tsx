import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { SpeciationAlertToast } from '../SpeciationAlertToast.js'
import type { SpeciationEvent } from '../../taxonomy/types.js'

describe('SpeciationAlertToast', () => {
  const sampleEvent: SpeciationEvent = {
    id: 'ev_1',
    speciesId: 'sp_new_1',
    speciesName: 'Hình nhân Khôn ngoan A',
    scientificName: 'Homo noosphere',
    tier: 'sapient',
    tierLabel: 'Sinh vật trí tuệ',
    color: '#06b6d4',
    emergenceRotation: 24,
    eventType: 'branching',
    description: 'Phân nhánh mới xuất hiện!',
    traits: {
      tier: 'sapient',
      tierLabel: 'Sinh vật trí tuệ',
      tierRank: 5,
      domain: 'fauna',
      domainLabel: 'Động vật',
      domainIcon: '🐾',
      trophicRole: 'carnivore',
      trophicRoleLabel: 'Động vật ăn thịt',
      trophicLevel: 3,
      dietDescription: 'Săn bắt động vật ăn cỏ',
      scientificName: 'Homo noosphere',
      planetaryLineage: 'terran_carbon',
      planetaryLineageLabel: 'Nhánh Hữu cơ Nguyên sinh',
      trophicMode: 'heterotroph',
      trophicLabel: 'Dị dưỡng tiêu thụ',
      morphology: 'Thân đứng thẳng hai chân, bàn tay 5 ngón',
      locomotion: 'Dáng đi hai chân',
      sapientArchetype: 'humanoid',
      sapientLabel: 'Hình nhân Đứng thẳng (Anthropoid Sapient)',
      notableAdaptations: ['Chế tác công cụ phức tạp'],
      complexityIndex: 0.9,
    },
  }

  const secondEvent: SpeciationEvent = {
    ...sampleEvent,
    id: 'ev_2',
    speciesId: 'sp_new_2',
    speciesName: 'Cự Thú Băng Hàn B',
    scientificName: 'Cryotitan pachydermus',
  }

  const ascensionEvent: SpeciationEvent = {
    ...sampleEvent,
    id: 'ev_asc_1',
    speciesId: 'sp_asc_1',
    speciesName: 'Sinh vật Đa bào Tiên phong',
    scientificName: 'Metazoa primus',
    tier: 'simple_multicellular',
    tierLabel: 'Đa bào đơn giản',
    eventType: 'ascension',
    description: 'Đột phá nấc thang tiến hóa: Đa bào đơn giản!',
  }

  it('renders nothing when no events are provided', () => {
    const { container } = render(<SpeciationAlertToast events={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('displays compact speciation banner and expands details when clicking details button', () => {
    render(<SpeciationAlertToast events={[sampleEvent]} />)

    expect(screen.getByText('Hình nhân Khôn ngoan A')).toBeInTheDocument()
    expect(screen.getByText('Homo noosphere')).toBeInTheDocument()
    expect(screen.getByText('Sinh vật trí tuệ')).toBeInTheDocument()
    expect(screen.getByText('Động vật ăn thịt')).toBeInTheDocument()

    // Expand details
    const detailsBtn = screen.getByText('▼ Chi tiết')
    fireEvent.click(detailsBtn)

    expect(screen.getByText('Săn bắt động vật ăn cỏ')).toBeInTheDocument()
    expect(screen.getByText('Dáng đi hai chân')).toBeInTheDocument()
    expect(screen.getByText(/Hình nhân Đứng thẳng/)).toBeInTheDocument()
    expect(screen.getByText('▲ Thu gọn')).toBeInTheDocument()
  })

  it('calls onSelectSpecies when clicking view in roster button', () => {
    const onSelect = vi.fn()
    render(<SpeciationAlertToast events={[sampleEvent]} onSelectSpecies={onSelect} />)

    const viewBtn = screen.getByText(/Xem trong danh mục →/)
    fireEvent.click(viewBtn)

    expect(onSelect).toHaveBeenCalledWith('sp_new_1')
  })

  it('dismisses announcement when clicking close button', () => {
    render(<SpeciationAlertToast events={[sampleEvent]} />)

    const closeBtn = screen.getByTitle('Đóng thông báo')
    fireEvent.click(closeBtn)

    expect(screen.queryByText('Hình nhân Khôn ngoan A')).not.toBeInTheDocument()
  })

  it('displays de novo chemical synthesis banner when de novo event arrives', () => {
    const deNovoEvent: SpeciationEvent = {
      ...sampleEvent,
      id: 'ev_denovo_1',
      eventType: 'de_novo_chemical_synthesis',
      speciesName: 'Vi khuẩn Nguyên thủy X',
    }
    render(<SpeciationAlertToast events={[deNovoEvent]} />)
    expect(screen.getByText('⚗️ KHỞI SINH HÓA HỌC TỰ PHÁT')).toBeInTheDocument()
    expect(screen.getByText('Vi khuẩn Nguyên thủy X')).toBeInTheDocument()
  })

  it('manages queue as a stack and allows dismissing all with one click', () => {
    render(<SpeciationAlertToast events={[sampleEvent, secondEvent]} />)

    // Top card shows first event
    expect(screen.getByText('Hình nhân Khôn ngoan A')).toBeInTheDocument()
    // Stack badge shows queue length
    expect(screen.getByText('+1 loài trong hàng đợi')).toBeInTheDocument()
    expect(screen.getByTestId('toast-stack-layer-1')).toBeInTheDocument()

    // Dismiss all
    const dismissAllBtn = screen.getByText(/Bỏ qua tất cả/)
    fireEvent.click(dismissAllBtn)

    expect(screen.queryByText('Hình nhân Khôn ngoan A')).not.toBeInTheDocument()
    expect(screen.queryByText('Cự Thú Băng Hàn B')).not.toBeInTheDocument()
  })

  it('separates evolution events to the bottom and new species to the top', () => {
    const simpleSpeciesEvent: SpeciationEvent = {
      ...sampleEvent,
      id: 'ev_simple_1',
      speciesName: 'Tảo Đơn Bào X',
      traits: {
        ...sampleEvent.traits,
        tier: 'unicellular',
        tierLabel: 'Đơn bào',
      },
    }

    render(<SpeciationAlertToast events={[simpleSpeciesEvent, ascensionEvent]} />)

    const speciesToast = screen.getByTestId('toast-stream-species')
    const evolutionToast = screen.getByTestId('toast-stream-evolution')

    expect(speciesToast).toBeInTheDocument()
    expect(evolutionToast).toBeInTheDocument()

    // Top stream contains new species
    expect(speciesToast).toHaveTextContent('Tảo Đơn Bào X')
    expect(speciesToast).toHaveTextContent('✨ PHÁT HIỆN LOÀI MỚI')

    // Bottom stream contains evolutionary ascension
    expect(evolutionToast).toHaveTextContent('Sinh vật Đa bào Tiên phong')
    expect(evolutionToast).toHaveTextContent('🧬 ĐỘT PHÁ NẤC THANG TIẾN HÓA')
  })

  it('caps queue at maximum 3 latest events per stream', () => {
    const ev1: SpeciationEvent = { ...sampleEvent, id: 'ev_cap_1', speciesName: 'Loài 1' }
    const ev2: SpeciationEvent = { ...sampleEvent, id: 'ev_cap_2', speciesName: 'Loài 2' }
    const ev3: SpeciationEvent = { ...sampleEvent, id: 'ev_cap_3', speciesName: 'Loài 3' }
    const ev4: SpeciationEvent = { ...sampleEvent, id: 'ev_cap_4', speciesName: 'Loài 4' }
    const ev5: SpeciationEvent = { ...sampleEvent, id: 'ev_cap_5', speciesName: 'Loài 5' }

    render(<SpeciationAlertToast events={[ev1, ev2, ev3, ev4, ev5]} />)

    // Only last 3 (Loài 3, Loài 4, Loài 5) should be retained
    expect(screen.queryByText('Loài 1')).not.toBeInTheDocument()
    expect(screen.queryByText('Loài 2')).not.toBeInTheDocument()
    expect(screen.getByText('Loài 3')).toBeInTheDocument()
    expect(screen.getByText('+2 loài trong hàng đợi')).toBeInTheDocument()
  })

  describe('auto-dismiss timing', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it('auto-dismisses notification after 3 seconds', () => {
      render(<SpeciationAlertToast events={[sampleEvent]} />)
      expect(screen.getByText('Hình nhân Khôn ngoan A')).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(3000)
      })

      expect(screen.queryByText('Hình nhân Khôn ngoan A')).not.toBeInTheDocument()
    })
  })
})
