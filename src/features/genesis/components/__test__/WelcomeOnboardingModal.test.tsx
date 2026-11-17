import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WelcomeOnboardingModal } from '../WelcomeOnboardingModal.js'

describe('WelcomeOnboardingModal', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <WelcomeOnboardingModal
        isOpen={false}
        onStartCustomGenesis={vi.fn()}
        onSelectDefaultPlanet={vi.fn()}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders introduction and action cards when isOpen is true', () => {
    render(
      <WelcomeOnboardingModal
        isOpen={true}
        onStartCustomGenesis={vi.fn()}
        onSelectDefaultPlanet={vi.fn()}
      />
    )

    expect(
      screen.getByText('CHÀO MỪNG ĐẾN VỚI EVOLUTION SANDBOX')
    ).toBeInTheDocument()
    expect(
      screen.getByText('Vũ Trụ Giả Lập Hành Tinh & Tiến Hóa')
    ).toBeInTheDocument()
    expect(screen.getByText('✦ Tạo Hành Tinh Riêng')).toBeInTheDocument()
    expect(screen.getByText('⚡ Hành Tinh Mặc Định')).toBeInTheDocument()
    expect(screen.getByText('Genesis Protocol (10 Câu hỏi)')).toBeInTheDocument()
    expect(screen.getByText('Gaia — Trái Đất Sơ Khai')).toBeInTheDocument()
  })

  it('triggers onStartCustomGenesis when custom button is clicked', () => {
    const handleStartCustom = vi.fn()
    const handleSelectDefault = vi.fn()

    render(
      <WelcomeOnboardingModal
        isOpen={true}
        onStartCustomGenesis={handleStartCustom}
        onSelectDefaultPlanet={handleSelectDefault}
      />
    )

    fireEvent.click(screen.getByText('✦ Tạo Hành Tinh Riêng'))
    expect(handleStartCustom).toHaveBeenCalledTimes(1)
    expect(handleSelectDefault).not.toHaveBeenCalled()
  })

  it('triggers onSelectDefaultPlanet when default button is clicked', () => {
    const handleStartCustom = vi.fn()
    const handleSelectDefault = vi.fn()

    render(
      <WelcomeOnboardingModal
        isOpen={true}
        onStartCustomGenesis={handleStartCustom}
        onSelectDefaultPlanet={handleSelectDefault}
      />
    )

    fireEvent.click(screen.getByText('⚡ Hành Tinh Mặc Định'))
    expect(handleSelectDefault).toHaveBeenCalledTimes(1)
    expect(handleStartCustom).not.toHaveBeenCalled()
  })
})

