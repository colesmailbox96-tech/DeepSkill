/**
 * Phase 63 — Tailoring Store
 *
 * Minimal Zustand store for the TailoringPanel open/close state.
 * The panel is toggled via the E interaction key (near the sewing table) or
 * the H key (while near the sewing table).
 */

import { create } from 'zustand'

interface TailoringState {
  isOpen: boolean
  openPanel: () => void
  closePanel: () => void
  togglePanel: () => void
}

export const useTailoringStore = create<TailoringState>((set) => ({
  isOpen: false,
  openPanel: () => set({ isOpen: true }),
  closePanel: () => set({ isOpen: false }),
  togglePanel: () => set((s) => ({ isOpen: !s.isOpen })),
}))
