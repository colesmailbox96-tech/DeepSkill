/**
 * Phase 23 — Shop / Trade Store
 * Phase 55 — Vendor Diversity: track active vendor id alongside open state.
 *
 * Minimal zustand slice that tracks whether the shop panel is open and which
 * vendor the player is trading with.
 * Open/close is triggered by NPC onInteract callbacks and consumed by ShopPanel.
 */

import { create } from 'zustand'

export interface ShopState {
  isOpen: boolean
  /** Id of the currently active vendor (matches VendorDef.id in shop.ts). */
  vendorId: string
  /** Open the shop for the given vendor. */
  openShop: (vendorId: string) => void
  closeShop: () => void
}

export const useShopStore = create<ShopState>((set) => ({
  isOpen: false,
  vendorId: 'tomas',
  openShop:  (vendorId: string) => set({ isOpen: true, vendorId }),
  closeShop: () => set({ isOpen: false }),
}))
