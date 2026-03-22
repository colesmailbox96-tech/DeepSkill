/**
 * Phase 59 — Cook Panel Store
 *
 * Minimal Zustand store for the CookPanel open/close state.
 * The panel is opened when the player interacts with the Hearthfire campfire.
 * Pressing Escape or clicking ✕ closes it.
 */

import { create } from 'zustand'

interface CookPanelState {
  isOpen: boolean
  openPanel: () => void
  closePanel: () => void
}

export const useCookPanelStore = create<CookPanelState>((set) => ({
  isOpen: false,
  openPanel: () => set({ isOpen: true }),
  closePanel: () => set({ isOpen: false }),
}))
