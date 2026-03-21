/**
 * Phase 46 — Warding Store
 *
 * Minimal Zustand store for the WardingPanel open/close state.
 * The panel is toggled via the E interaction key (near the altar) or the
 * G key (while near the warding altar).
 */

import { create } from 'zustand'

interface WardingState {
  isOpen: boolean
  openPanel: () => void
  closePanel: () => void
  togglePanel: () => void
}

export const useWardingStore = create<WardingState>((set) => ({
  isOpen: false,
  openPanel: () => set({ isOpen: true }),
  closePanel: () => set({ isOpen: false }),
  togglePanel: () => set((s) => ({ isOpen: !s.isOpen })),
}))
