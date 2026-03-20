/**
 * Phase 40 — Smithing Store
 *
 * Minimal Zustand store for the SmithingPanel open/close state.
 * The panel is toggled via the E interaction key (near a furnace) or the
 * F key (near a furnace) or by clicking the furnace directly.
 */

import { create } from 'zustand'

interface SmithingState {
  isOpen: boolean
  openPanel: () => void
  closePanel: () => void
  togglePanel: () => void
}

export const useSmithingStore = create<SmithingState>((set) => ({
  isOpen: false,
  openPanel: () => set({ isOpen: true }),
  closePanel: () => set({ isOpen: false }),
  togglePanel: () => set((s) => ({ isOpen: !s.isOpen })),
}))
