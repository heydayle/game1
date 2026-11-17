import { useEffect } from 'react'

interface KeyboardShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
}

interface ShortcutItem {
  key: string
  action: string
  category: 'Simulation' | 'Camera & Audio' | 'Menus'
}

const SHORTCUTS: ShortcutItem[] = [
  { key: 'Space', action: 'Pause / Resume simulation', category: 'Simulation' },
  { key: '1, 2, 3, 4', action: 'Set time warp (1x, 10x, 100x, 1000x)', category: 'Simulation' },
  { key: 'C', action: 'Toggle cinematic auto-orbit camera', category: 'Camera & Audio' },
  { key: 'M', action: 'Toggle audio sound effects (Mute/Unmute)', category: 'Camera & Audio' },
  { key: 'H', action: 'Toggle HUD overlay (Cinematic screen view)', category: 'Camera & Audio' },
  { key: 'G', action: 'Open Genesis Protocol questionnaire', category: 'Menus' },
  { key: 'Ctrl + S', action: 'Open World Archives & Save Manager', category: 'Menus' },
  { key: '?', action: 'Toggle this Shortcuts Guide', category: 'Menus' },
  { key: 'Esc', action: 'Close any open modal dialog', category: 'Menus' },
]

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const categories: Array<ShortcutItem['category']> = ['Simulation', 'Camera & Audio', 'Menus']

  return (
    <div
      data-testid="shortcuts-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-white/15 bg-gray-950/95 p-6 font-mono text-xs shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            <h2 className="text-sm font-semibold tracking-wider text-white uppercase">
              Keyboard Navigation & Controls
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded px-2 py-1 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            ✕ Esc
          </button>
        </div>

        {/* Shortcuts List grouped by Category */}
        <div className="mt-4 space-y-4">
          {categories.map((cat) => (
            <div key={cat} className="space-y-1.5">
              <span className="text-[10px] tracking-widest text-cyan-400 uppercase font-bold">
                {cat}
              </span>
              <div className="rounded-lg border border-white/5 bg-white/5 p-2 space-y-1.5">
                {SHORTCUTS.filter((s) => s.category === cat).map((s) => (
                  <div key={s.key} className="flex items-center justify-between py-0.5">
                    <span className="text-gray-300">{s.action}</span>
                    <kbd className="rounded border border-white/20 bg-black/60 px-2 py-0.5 font-mono text-[11px] font-semibold text-cyan-300 shadow">
                      {s.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-5 border-t border-white/10 pt-3 flex items-center justify-between text-[10px] text-gray-400">
          <span>Press any listed shortcut anytime to activate</span>
          <button
            onClick={onClose}
            className="rounded bg-cyan-700/80 hover:bg-cyan-600 px-3 py-1 font-semibold text-white transition-all shadow"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}

