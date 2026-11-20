import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import {
  SapientEvolutionLogHUD,
  type SapientLogEntry,
} from '../SapientEvolutionLogHUD.js'
import { isModernIntelligentHigherOrganism } from '../../../../App.js'
import type { BiologicalTraits } from '../../taxonomy/types.js'

describe('SapientEvolutionLogHUD', () => {
  const sampleLog: SapientLogEntry = {
    id: 'log_sapient_1',
    speciesId: 'sp_sapient_homo',
    speciesName: 'Người Tinh khôn Khởi nguyên',
    scientificName: 'Homo sapiens primus',
    tier: 'sapient',
    tierLabel: 'Sinh vật có Trí tuệ',
    sapientArchetype: 'humanoid',
    sapientLabel: 'Hình nhân Đứng thẳng (Anthropoid Sapient)',
    color: '#f59e0b',
    rotation: 450,
    generation: 120,
    description:
      'Khai mở trí năng: Loài Người Tinh khôn Khởi nguyên đã tiến hóa thành Sinh vật có Trí tuệ và ý thức!',
    timestamp: Date.now(),
  }

  it('renders nothing when logs list is empty', () => {
    const { container } = render(
      <SapientEvolutionLogHUD
        logs={[]}
        countdownSeconds={null}
        savedSpeed={5}
        onDismiss={vi.fn()}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders sapient species details and description in bottom-left log', () => {
    render(
      <SapientEvolutionLogHUD
        logs={[sampleLog]}
        countdownSeconds={null}
        savedSpeed={5}
        onDismiss={vi.fn()}
      />
    )

    expect(screen.getByTestId('sapient-evolution-log-hud')).toBeDefined()
    expect(screen.getByText('Người Tinh khôn Khởi nguyên')).toBeDefined()
    expect(screen.getByText('Homo sapiens primus')).toBeDefined()
    expect(screen.getByText('Hình nhân Đứng thẳng (Anthropoid Sapient)')).toBeDefined()
    expect(screen.getByText('450')).toBeDefined()
    expect(screen.getByText('Gen 120')).toBeDefined()
    expect(
      screen.getByText(
        'Khai mở trí năng: Loài Người Tinh khôn Khởi nguyên đã tiến hóa thành Sinh vật có Trí tuệ và ý thức!'
      )
    ).toBeDefined()
  })

  it('displays countdown timer and "Tiếp tục ngay" when auto-paused for 10s', () => {
    const onResume = vi.fn()
    render(
      <SapientEvolutionLogHUD
        logs={[sampleLog]}
        countdownSeconds={8}
        savedSpeed={5}
        onDismiss={vi.fn()}
        onResumeNow={onResume}
      />
    )

    expect(screen.getByText('8s')).toBeDefined()
    expect(screen.getByText(/Tạm dừng 10s quan sát/)).toBeDefined()

    const resumeBtn = screen.getByTestId('sapient-log-resume-now-btn')
    fireEvent.click(resumeBtn)
    expect(onResume).toHaveBeenCalledTimes(1)
  })

  it('displays active continuation message when 10s timer is finished', () => {
    render(
      <SapientEvolutionLogHUD
        logs={[sampleLog]}
        countdownSeconds={null}
        savedSpeed={10}
        onDismiss={vi.fn()}
      />
    )

    expect(
      screen.getByText('Tiến trình mô phỏng đang tiếp tục (10x)')
    ).toBeDefined()
  })

  it('triggers onDismiss when close button is clicked', () => {
    const onDismiss = vi.fn()
    render(
      <SapientEvolutionLogHUD
        logs={[sampleLog]}
        countdownSeconds={null}
        savedSpeed={5}
        onDismiss={onDismiss}
      />
    )

    const closeBtn = screen.getByTestId('sapient-log-close-btn')
    fireEvent.click(closeBtn)
    expect(onDismiss).toHaveBeenCalledWith('log_sapient_1')
  })

  it('triggers onSelectSpecies when "Xem loài" is clicked', () => {
    const onSelect = vi.fn()
    render(
      <SapientEvolutionLogHUD
        logs={[sampleLog]}
        countdownSeconds={null}
        savedSpeed={5}
        onDismiss={vi.fn()}
        onSelectSpecies={onSelect}
      />
    )

    const viewBtn = screen.getByText('🔍 Xem loài')
    fireEvent.click(viewBtn)
    expect(onSelect).toHaveBeenCalledWith('sp_sapient_homo')
  })

  it('allows navigating between multiple sapient logs and dismissing all', () => {
    const secondLog: SapientLogEntry = {
      ...sampleLog,
      id: 'log_sapient_2',
      speciesId: 'sp_cephalopod',
      speciesName: 'Thủy tộc Xúc tu Biển sâu',
      scientificName: 'Cephalosapientus abyssi',
      sapientArchetype: 'aquatic_cephalopod',
      sapientLabel: 'Thủy tộc Xúc tu Biển sâu (Cephalosapient)',
    }

    const onDismissAll = vi.fn()
    render(
      <SapientEvolutionLogHUD
        logs={[sampleLog, secondLog]}
        countdownSeconds={null}
        savedSpeed={5}
        onDismiss={vi.fn()}
        onDismissAll={onDismissAll}
      />
    )

    expect(screen.getByText('1/2 loài')).toBeDefined()
    expect(screen.getByText('Người Tinh khôn Khởi nguyên')).toBeDefined()

    const nextBtn = screen.getByText('▶')
    fireEvent.click(nextBtn)
    expect(screen.getByText('2/2 loài')).toBeDefined()
    expect(screen.getByText('Thủy tộc Xúc tu Biển sâu')).toBeDefined()

    const dismissAllBtn = screen.getByText('Đóng tất cả')
    fireEvent.click(dismissAllBtn)
    expect(onDismissAll).toHaveBeenCalledTimes(1)
  })

  describe('isModernIntelligentHigherOrganism criteria filter', () => {
    it('returns false for normal plants (flora), never pauses for vegetation', () => {
      const plantTraits: Partial<BiologicalTraits> = {
        domain: 'flora',
        domainLabel: 'Thực vật',
        tier: 'advanced',
        tierLabel: 'Thực vật bậc cao',
        bodySymmetry: 'bilateral',
      }
      expect(isModernIntelligentHigherOrganism(plantTraits as BiologicalTraits, 'advanced')).toBe(false)
      expect(isModernIntelligentHigherOrganism(plantTraits as BiologicalTraits, 'sapient')).toBe(false)
    })

    it('returns false for normal microbes (prokaryote, eukaryote)', () => {
      const microbeTraits: Partial<BiologicalTraits> = {
        domain: 'microbe',
        domainLabel: 'Vi sinh vật',
        tier: 'prokaryote',
        tierLabel: 'Tế bào nhân sơ',
        bodySymmetry: 'none',
      }
      expect(isModernIntelligentHigherOrganism(microbeTraits as BiologicalTraits, 'prokaryote')).toBe(false)
    })

    it('returns false for normal fungi and decomposers', () => {
      const fungiTraits: Partial<BiologicalTraits> = {
        domain: 'fungi',
        domainLabel: 'Nấm & Phân giải',
        tier: 'advanced',
        tierLabel: 'Nấm đại thể bậc cao',
        bodySymmetry: 'radial',
      }
      expect(isModernIntelligentHigherOrganism(fungiTraits as BiologicalTraits, 'advanced')).toBe(false)
    })

    it('returns false for primitive animals (sponges, jellyfish, radial symmetry)', () => {
      const primitiveTraits: Partial<BiologicalTraits> = {
        domain: 'fauna',
        domainLabel: 'Động vật nguyên thủy',
        tier: 'primitive_animal',
        tierLabel: 'Động vật nguyên thủy',
        bodySymmetry: 'radial',
      }
      expect(isModernIntelligentHigherOrganism(primitiveTraits as BiologicalTraits, 'primitive_animal')).toBe(false)
    })

    it('returns false for normal complex bilaterian animals without modern sapience', () => {
      const normalBilaterian: Partial<BiologicalTraits> = {
        domain: 'fauna',
        domainLabel: 'Động vật',
        tier: 'complex_bilaterian',
        tierLabel: 'Động vật đối xứng 2 bên',
        bodySymmetry: 'bilateral',
        complexityIndex: 0.68,
      }
      expect(isModernIntelligentHigherOrganism(normalBilaterian as BiologicalTraits, 'complex_bilaterian')).toBe(false)
    })

    it('returns false for normal advanced animals (beasts, herbivores, raptors) without sapience', () => {
      const normalBeast: Partial<BiologicalTraits> = {
        domain: 'fauna',
        domainLabel: 'Động vật',
        tier: 'advanced',
        tierLabel: 'Động thực vật bậc cao',
        bodySymmetry: 'bilateral',
        complexityIndex: 0.82,
      }
      expect(isModernIntelligentHigherOrganism(normalBeast as BiologicalTraits, 'advanced')).toBe(false)
    })

    it('returns true for modern intelligent humanoid species resembling humans', () => {
      const humanoidTraits: Partial<BiologicalTraits> = {
        domain: 'fauna',
        domainLabel: 'Động vật',
        tier: 'sapient',
        tierLabel: 'Sinh vật trí tuệ',
        bodySymmetry: 'bilateral',
        sapientArchetype: 'humanoid',
        sapientLabel: 'Hình nhân Đứng thẳng (Anthropoid Sapient)',
        complexityIndex: 0.92,
      }
      expect(isModernIntelligentHigherOrganism(humanoidTraits as BiologicalTraits, 'sapient')).toBe(true)
    })

    it('returns true for modern intelligent animal species (cephalopod, avian, cryo titan)', () => {
      const cephalopodTraits: Partial<BiologicalTraits> = {
        domain: 'fauna',
        domainLabel: 'Động vật',
        tier: 'sapient',
        tierLabel: 'Sinh vật trí tuệ',
        bodySymmetry: 'bilateral',
        sapientArchetype: 'aquatic_cephalopod',
        sapientLabel: 'Thủy tộc Xúc tu Biển sâu (Cephalosapient)',
        complexityIndex: 0.89,
      }
      expect(isModernIntelligentHigherOrganism(cephalopodTraits as BiologicalTraits, 'sapient')).toBe(true)
    })
  })
})
