/**
 * Phase 24 — Currency and Economy Base
 *
 * Centralises the currency identity and transaction-validation helpers
 * used throughout the shop and any future trading systems.
 *
 * Currency: Marks
 *   Marks are the standard tender of the Veilmarch Territories — small
 *   stamped discs issued by frontier trade-posts.  Symbol: ⬡
 *
 * Value tiers (buy price = item.value):
 *   1   — basic loose material  (rough_stone, ash_twig, small_stone, ash_sapling_log)
 *   2   — light gathered goods  (reed_fiber, minnow)
 *   3   — common materials      (ashwood_log, marsh_herb)
 *   4   — mid-tier materials    (copper_ore, resin_glob, cinderhare_meat, cooked_minnow)
 *   5   — standard consumables  (camp_rations, perch)
 *   6   — quality wood          (ironbark_log)
 *   7   — iron ore              (iron_ore)
 *   8   — starter tool / cooked (reedline_rod, cooked_cinderhare)
 *  10   — rare fish / cooked    (gloomfin, cooked_perch)
 *  12   — starter hatchet       (rough_ash_hatchet)
 *  14   — starter pick          (quarry_pick)
 *  22   — premium cooked fish   (cooked_gloomfin)
 *
 * Sell price = Math.max(1, Math.floor(value / 3))  — one-third, min 1 Mark.
 */

// ── Currency identity ─────────────────────────────────────────────────────────

/** Singular display name for one unit of currency. */
export const CURRENCY_NAME = 'Mark'

/** Plural display name. */
export const CURRENCY_PLURAL = 'Marks'

/** Unicode glyph used as the currency symbol in HUD and shop panels. */
export const CURRENCY_SYMBOL = '⬡'

/**
 * Formats a coin amount for display.
 * Examples:  formatCurrency(1) → "⬡ 1 Mark"
 *            formatCurrency(5) → "⬡ 5 Marks"
 */
export function formatCurrency(amount: number): string {
  return `${CURRENCY_SYMBOL} ${amount} ${amount === 1 ? CURRENCY_NAME : CURRENCY_PLURAL}`
}

// ── Transaction validation ─────────────────────────────────────────────────────

export type TransactionResult =
  | { ok: true }
  | { ok: false; reason: string }

/**
 * Validates a purchase before committing it.
 *
 * Returns { ok: true } when all conditions are met, or { ok: false, reason }
 * with a human-readable message the UI can surface directly.
 *
 * @param price           Buy price in Marks.
 * @param playerCoins     Current player coin balance.
 * @param inventorySlots  Number of slots currently occupied.
 * @param maxSlots        Maximum inventory capacity.
 * @param alreadyHasItem  True when the item already exists in a slot
 *                        (stacking — no new slot needed).
 */
export function validatePurchase(
  price: number,
  playerCoins: number,
  inventorySlots: number,
  maxSlots: number,
  alreadyHasItem: boolean,
): TransactionResult {
  if (price <= 0) {
    return { ok: false, reason: 'This item cannot be purchased.' }
  }
  if (!alreadyHasItem && inventorySlots >= maxSlots) {
    return { ok: false, reason: 'Your inventory is full.' }
  }
  if (playerCoins < price) {
    return {
      ok: false,
      reason: `Not enough ${CURRENCY_PLURAL}. Need ${price}, have ${playerCoins}.`,
    }
  }
  return { ok: true }
}

/**
 * Validates a sale before committing it.
 *
 * Returns { ok: true } when all conditions are met, or { ok: false, reason }
 * with a human-readable message.
 *
 * @param itemType          The ItemType of the item being sold.
 * @param hasItemInInventory True when the item is confirmed in inventory.
 */
export function validateSale(
  itemType: string,
  hasItemInInventory: boolean,
): TransactionResult {
  if (itemType === 'quest') {
    return { ok: false, reason: 'Quest items cannot be sold.' }
  }
  if (!hasItemInInventory) {
    return { ok: false, reason: 'Item not found in inventory.' }
  }
  return { ok: true }
}
