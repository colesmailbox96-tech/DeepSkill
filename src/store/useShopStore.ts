/**
 * Phase 23 — Shop / Trade Store
 *
 * Minimal zustand slice that tracks whether the shop panel is open.
 * Open/close is triggered by Tomas's onInteract callback (npc.ts) and
 * consumed by ShopPanel.
 */

import { create } from 'zustand'

export interface ShopState {
  isOpen: boolean
  openShop: () => void
  closeShop: () => void
  toggleShop: () => void
}

export const useShopStore = create<ShopState>((set) => ({
  isOpen: false,
  openShop:  () => set({ isOpen: true }),
  closeShop: () => set({ isOpen: false }),
  toggleShop: () => set((s) => ({ isOpen: !s.isOpen })),
}))
