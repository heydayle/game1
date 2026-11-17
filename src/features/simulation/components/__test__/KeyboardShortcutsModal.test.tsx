import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { KeyboardShortcutsModal } from '../KeyboardShortcutsModal.js'

describe('KeyboardShortcutsModal', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <KeyboardShortcutsModal isOpen={false} onClose={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders all keybindings and categories when isOpen is true', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={vi.fn()} />)

    expect(screen.getByText('Keyboard Navigation & Controls')).toBeInTheDocument()
    expect(screen.getByText('Simulation')).toBeInTheDocument()
    expect(screen.getByText('Camera & Audio')).toBeInTheDocument()
    expect(screen.getByText('Menus')).toBeInTheDocument()

    expect(screen.getByText('Pause / Resume simulation')).toBeInTheDocument()
    expect(screen.getByText('Toggle cinematic auto-orbit camera')).toBeInTheDocument()
    expect(screen.getByText('Toggle audio sound effects (Mute/Unmute)')).toBeInTheDocument()
    expect(screen.getByText('Space')).toBeInTheDocument()
  })

  it('triggers onClose when close button, backdrop, or Escape is pressed', () => {
    const handleClose = vi.fn()
    render(<KeyboardShortcutsModal isOpen={true} onClose={handleClose} />)

    // Close button
    fireEvent.click(screen.getByText('✕ Esc'))
    expect(handleClose).toHaveBeenCalledTimes(1)

    // Backdrop click
    fireEvent.click(screen.getByTestId('shortcuts-modal-backdrop'))
    expect(handleClose).toHaveBeenCalledTimes(2)

    // Escape key
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(handleClose).toHaveBeenCalledTimes(3)
  })
})

