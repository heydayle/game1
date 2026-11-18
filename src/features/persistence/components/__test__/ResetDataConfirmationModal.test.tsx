import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ResetDataConfirmationModal } from '../ResetDataConfirmationModal.js'

describe('ResetDataConfirmationModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <ResetDataConfirmationModal isOpen={false} onClose={vi.fn()} onConfirmReset={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders confirmation dialog with warnings when open', () => {
    render(
      <ResetDataConfirmationModal isOpen={true} onClose={vi.fn()} onConfirmReset={vi.fn()} />
    )

    expect(screen.getByText('Xác Nhận Xóa Dữ Liệu')).toBeInTheDocument()
    expect(screen.getByText(/Hành động này sẽ/)).toBeInTheDocument()
    expect(screen.getByText(/Kho lưu trữ \(World Archives\)/)).toBeInTheDocument()
    expect(screen.getByText(/Phiên chơi tự động lưu \(Auto-Save Session\)/)).toBeInTheDocument()
    expect(screen.getByText(/Hủy bỏ \(Giữ lại\)/)).toBeInTheDocument()
    expect(screen.getByText(/Xóa sạch & Chơi mới/)).toBeInTheDocument()
  })

  it('calls onClose when clicking cancel button', () => {
    const onClose = vi.fn()
    render(
      <ResetDataConfirmationModal isOpen={true} onClose={onClose} onConfirmReset={vi.fn()} />
    )

    fireEvent.click(screen.getByText(/Hủy bỏ \(Giữ lại\)/))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onConfirmReset when clicking confirm button', async () => {
    const onConfirmReset = vi.fn()
    render(
      <ResetDataConfirmationModal isOpen={true} onClose={vi.fn()} onConfirmReset={onConfirmReset} />
    )

    await act(async () => {
      fireEvent.click(screen.getByText(/Xóa sạch & Chơi mới/))
    })
    expect(onConfirmReset).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when pressing Escape key', () => {
    const onClose = vi.fn()
    render(
      <ResetDataConfirmationModal isOpen={true} onClose={onClose} onConfirmReset={vi.fn()} />
    )

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
