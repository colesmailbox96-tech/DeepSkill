/**
 * Phase 23 — Shop / Trade Store
 * Phase 55 — Vendor Diversity: track active vendor id alongside open state.
 *             Remaining stock counters for finite-supply items are tracked here
 *             so purchases actually decrement available quantity.
 *
 * Open/close is triggered by NPC onInteract callbacks and consumed by ShopPanel.
 */

import { create } from 'zustand'
import { getAllVendorDefs } from '../engine/shop'

// ── Remaining-stock helpers ────────────────────────────────────────────────────

/**
 * Build the default remaining-stock map from all vendor definitions.
 * Only finite-stock items (stock !== null) are tracked; unlimited items are
 * absent from the map and callers should treat absence as unlimited supply.
 */
function buildDefaultVendorStocks(): Record<string, Record<string, number>> {
  const stocks: Record<string, Record<string, number>> = {}
  for (const vendor of getAllVendorDefs()) {
    const finiteItems: Record<string, number> = {}
    for (const item of vendor.stock) {
      if (item.stock !== null) {
        finiteItems[item.id] = item.stock as number
      }
    }
    if (Object.keys(finiteItems).length > 0) {
      stocks[vendor.id] = finiteItems
    }
  }
  return stocks
}

// ── Store interface ────────────────────────────────────────────────────────────

export interface ShopState {
  isOpen: boolean
  /** Id of the currently active vendor (matches VendorDef.id in shop.ts). */
  vendorId: string
  /**
   * Remaining stock counts for finite-supply items, keyed by
   * vendorId → itemId → remaining units.
   *
   * Only items with a finite initial stock appear here; an absent entry means
   * unlimited supply.  Counts are decremented on purchase and persisted via
   * the save/load system.
   */
  vendorStocks: Record<string, Record<string, number>>
  /** Open the shop for the given vendor. */
  openShop: (vendorId: string) => void
  closeShop: () => void
  /**
   * Decrement the remaining count for a finite-stock item by 1.
   * No-ops when the item is unlimited or already at 0.
   */
  decrementStock: (vendorId: string, itemId: string) => void
  /**
   * Replace the entire vendorStocks map.
   * Called by the save/load system when restoring a persisted snapshot.
   */
  setVendorStocks: (stocks: Record<string, Record<string, number>>) => void
}

// ── Store ──────────────────────────────────────────────────────────────────────

export const useShopStore = create<ShopState>((set, get) => ({
  isOpen: false,
  vendorId: 'tomas',
  vendorStocks: buildDefaultVendorStocks(),

  openShop: (vendorId: string) => set({ isOpen: true, vendorId }),
  closeShop: () => set({ isOpen: false }),

  decrementStock: (vendorId: string, itemId: string) => {
    const current = get().vendorStocks
    const vendorMap = current[vendorId]
    if (!vendorMap || !(itemId in vendorMap)) return  // unlimited — nothing to track
    const remaining = vendorMap[itemId]
    if (remaining <= 0) return  // already sold out
    set({
      vendorStocks: {
        ...current,
        [vendorId]: { ...vendorMap, [itemId]: remaining - 1 },
      },
    })
  },

  setVendorStocks: (stocks) => set({ vendorStocks: stocks }),
}))
