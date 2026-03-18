/**
 * Phase 23 — Starter Shop / Trade Interface
 *
 * Defines the vendor stock for Tomas (Travelling Merchant) and the
 * buy/sell pricing rules used by the ShopPanel UI.
 *
 * Buy  price = item.value (full registry value).
 * Sell price = Math.max(1, Math.floor(item.value / 3))  — one-third, min 1.
 */

// ── Vendor stock entry ────────────────────────────────────────────────────────

/**
 * A single line in the vendor's inventory.
 *
 * stock — maximum number the vendor can sell.  null = unlimited supply.
 */
export interface VendorItem {
  id: string
  /** null = unlimited. */
  stock: number | null
}

// ── Tomas's stock ─────────────────────────────────────────────────────────────

/**
 * Items offered for sale by Tomas (Travelling Merchant).
 *
 * Ordered: tools first, then consumables, then raw materials.
 * All lines have unlimited stock so players can re-buy tools and consumables
 * without restriction.
 */
export const VENDOR_STOCK: VendorItem[] = [
  // Tools
  { id: 'rough_ash_hatchet', stock: null },
  { id: 'quarry_pick',       stock: null },
  { id: 'reedline_rod',      stock: null },

  // Consumables
  { id: 'camp_rations',      stock: null },

  // Materials
  { id: 'reed_fiber',        stock: null },
  { id: 'ash_twig',          stock: null },
  { id: 'rough_stone',       stock: null },
]

// ── Price helpers ─────────────────────────────────────────────────────────────

/**
 * Returns the buy price for an item.
 * Uses the item's registry `value` directly.
 * Returns 0 when the item is not in the vendor catalog.
 */
export function getBuyPrice(itemValue: number): number {
  return itemValue
}

/**
 * Returns the sell price for an item (what the vendor pays the player).
 * Always at least 1 coin so every item is sellable.
 */
export function getSellPrice(itemValue: number): number {
  return Math.max(1, Math.floor(itemValue / 3))
}
