/**
 * UI Store — Zustand store for presentation-layer state only.
 *
 * This store holds UI preferences and panel visibility.
 * Simulation state is NOT stored here — it comes from the Worker.
 */

import { create } from 'zustand'

interface UIState {
  isDebugPanelOpen: boolean
  toggleDebugPanel: () => void
}

export const useUIStore = create<UIState>((set) => ({
  isDebugPanelOpen: true,
  toggleDebugPanel: () =>
    set((state) => ({ isDebugPanelOpen: !state.isDebugPanelOpen })),
}))

