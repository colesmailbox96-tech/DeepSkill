/**
 * Phase 43 — Tinkering Store
 *
 * Minimal Zustand store for the TinkeringPanel open/close state.
 * The panel is toggled via the E interaction key (near the bench) or the
 * T key (while near the tinkerer's bench).
 */

import { create } from 'zustand'

interface TinkeringState {
  isOpen: boolean
  openPanel: () => void
  closePanel: () => void
  togglePanel: () => void
}

export const useTinkeringStore = create<TinkeringState>((set) => ({
  isOpen: false,
  openPanel: () => set({ isOpen: true }),
  closePanel: () => set({ isOpen: false }),
  togglePanel: () => set((s) => ({ isOpen: !s.isOpen })),
}))
