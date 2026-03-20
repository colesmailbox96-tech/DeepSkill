/**
 * Phase 42 — Carving Store
 *
 * Minimal Zustand store for the CarvingPanel open/close state.
 * The panel is toggled via the E interaction key (near the workbench) or the
 * V key (while near the workbench).
 */

import { create } from 'zustand'

interface CarvingState {
  isOpen: boolean
  openPanel: () => void
  closePanel: () => void
  togglePanel: () => void
}

export const useCarvingStore = create<CarvingState>((set) => ({
  isOpen: false,
  openPanel: () => set({ isOpen: true }),
  closePanel: () => set({ isOpen: false }),
  togglePanel: () => set((s) => ({ isOpen: !s.isOpen })),
}))
