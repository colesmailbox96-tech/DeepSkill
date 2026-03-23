/**
 * Phase 23 — Starter Shop / Trade Interface
 * Phase 24 — Currency and Economy Base (re-exports economy helpers)
 * Phase 55 — Vendor Diversity
 * Phase 77 — Faction Vendors / Rewards
 *
 * Defines per-vendor stock and buy/sell constraints for the four distinct
 * vendor roles in Cinderglen:
 *
 *   'general'       — Tomas (Travelling Merchant): consumables + basic materials.
 *   'toolsmith'     — Bron (Blacksmith): gathering tools + ores; only buys tools,
 *                     ores, bars, and wood materials.
 *   'fishsupplier'  — Brin Salt (Fisher): fishing rods + tackle; only buys
 *                     fishing tools and raw/cooked fish.
 *   'faction_union' — Olen (Union Trader): Quarry Union–exclusive tools and ore;
 *                     requires Acquainted standing to trade, Trusted to unlock
 *                     the Duskiron Pick.  Offers better sell prices to Trusted+
 *                     members (faction sell bonus).
 *
 * Buy  price = item.value (full registry value in Marks).
 * Sell price = Math.max(1, Math.floor(item.value / 3))  — one-third, min 1 Mark.
 *   Faction sell bonus: Trusted members receive +15%, Honored +30% when selling
 *   to their aligned faction vendor.
 */

import type { ItemDefinition } from '../data/items/itemSchema'
import type { FactionTier } from '../store/useFactionStore'

// Re-export Phase 24 economy constants so shop consumers need only one import.
export {
  CURRENCY_NAME,
  CURRENCY_PLURAL,
  CURRENCY_SYMBOL,
  formatCurrency,
  validatePurchase,
  validateSale,
} from './economy'

// ── Vendor stock entry ────────────────────────────────────────────────────────

/**
 * A single line in the vendor's inventory.
 *
 * stock — initial/maximum units available for sale.  null = unlimited supply.
 * Remaining stock is tracked separately in useShopStore so that purchases
 * actually decrement the available count and the runtime state stays in sync
 * with what the player sees.
 */
export interface VendorItem {
  id: string
  /** Initial/maximum units available.  null = unlimited. */
  stock: number | null
  /**
   * Optional faction requirement to purchase this specific item.
   * If present the item is shown in the buy tab but locked (greyed out with a
   * padlock hint) until the player reaches the required trust tier with that
   * faction.  Other items in the same vendor's stock remain purchasable.
   */
  factionGate?: { factionId: string; factionName: string; minTier: FactionTier }
}

// ── Vendor role ───────────────────────────────────────────────────────────────

/**
 * Broad vendor classification that drives stock identity and sell constraints.
 */
export type VendorRole = 'general' | 'toolsmith' | 'fishsupplier' | 'faction_union'

// ── Vendor definition ─────────────────────────────────────────────────────────

export interface VendorDef {
  /** Unique vendor id matching the NPC key used to open the shop. */
  id: string
  /** Display name shown in the shop panel header. */
  displayName: string
  /** Short name used in contextual messages (e.g. "Bron", "Brin"). */
  shortName: string
  /** Role determines sell-filter rules. */
  role: VendorRole
  /** Short description of what the vendor specializes in (shown in header). */
  tagline: string
  /** Items the vendor offers for sale. */
  stock: VendorItem[]
  /**
   * Faction this vendor is aligned with.
   * When set, members at Trusted+ standing receive a sell-price bonus when
   * selling goods to this vendor (see getFactionSellBonus).
   */
  factionId?: string
}

// ── Tomas — General Trader ────────────────────────────────────────────────────

const TOMAS_DEF: VendorDef = {
  id: 'tomas',
  displayName: "Tomas's Shop",
  shortName: 'Tomas',
  role: 'general',
  tagline: 'General provisions & sundries',
  stock: [
    // Consumables — limited stock per session to prevent infinite healing purchases.
    // Phase 85 — camp_rations capped at 20 units; restocks each session load.
    { id: 'camp_rations',  stock: 20 },

    // Basic materials
    { id: 'reed_fiber',    stock: null },
    { id: 'ash_twig',      stock: null },
    { id: 'rough_stone',   stock: null },
    { id: 'marsh_herb',    stock: null },

    // Phase 66 — Salvage System: limited stock of raw salvage materials so
    // players can bootstrap early recipes before unlocking the vault.
    { id: 'crumbled_masonry',     stock: 8 },
    { id: 'iron_relic_fragment',  stock: 5 },
    { id: 'vault_seal_wax',       stock: 3 },
  ],
}

// ── Bron — Toolsmith ──────────────────────────────────────────────────────────

const BRON_DEF: VendorDef = {
  id: 'bron',
  displayName: "Bron's Smithy",
  shortName: 'Bron',
  role: 'toolsmith',
  tagline: 'Tools & metal goods — buys ores, bars, and tools',
  stock: [
    // Tier-1 gathering tools
    { id: 'rough_ash_hatchet', stock: null },
    { id: 'quarry_pick',       stock: null },

    // Tier-2 gathering tools (limited supply — restock between sessions)
    { id: 'copper_hatchet',    stock: 3 },
    { id: 'iron_pick',         stock: 3 },

    // Ores for resale
    { id: 'copper_ore',        stock: null },
    { id: 'iron_ore',          stock: null },
    // Phase 58 — Duskiron Ore (limited — Bron sources it from Ashfen expeditions)
    { id: 'duskiron_ore',      stock: 5 },
  ],
}

// ── Brin Salt — Fisher Supplier ───────────────────────────────────────────────

const BRIN_SALT_DEF: VendorDef = {
  id: 'brin_salt',
  displayName: "Brin's Tackle",
  shortName: 'Brin',
  role: 'fishsupplier',
  tagline: 'Fishing rods & tackle — buys fish and fishing gear',
  stock: [
    // Fishing rods
    { id: 'reedline_rod',    stock: null },
    { id: 'reinforced_rod',  stock: 3 },

    // Tackle & bait
    { id: 'reinforced_hook', stock: null },
    { id: 'bait_basket',     stock: null },
  ],
}

// ── Olen — Quarry Union Trader (Phase 77) ─────────────────────────────────────

/**
 * Stationed at the Redwake Quarry entrance.
 * Requires Acquainted (100 rep) with the Quarry Union to open shop.
 * The Duskiron Pick is locked behind Trusted (300 rep).
 */
const OLEN_DEF: VendorDef = {
  id: 'olen',
  displayName: "Olen's Union Post",
  shortName: 'Olen',
  role: 'faction_union',
  factionId: 'quarry_union',
  tagline: 'Union-grade tools and ore — members preferred',
  stock: [
    // Ore available to any Union member (Acquainted+)
    { id: 'iron_ore',       stock: null },
    { id: 'duskiron_ore',   stock: 10 },

    // Tools available to any Union member
    { id: 'iron_pick',      stock: 3 },

    // Tier-3 tool — Trusted standing required
    {
      id: 'duskiron_pick',
      stock: 2,
      factionGate: {
        factionId:   'quarry_union',
        factionName: 'Quarry Union',
        minTier:     'trusted',
      },
    },
  ],
}

// ── Vendor registry ───────────────────────────────────────────────────────────

const VENDOR_REGISTRY = new Map<string, VendorDef>([
  [TOMAS_DEF.id,     TOMAS_DEF],
  [BRON_DEF.id,      BRON_DEF],
  [BRIN_SALT_DEF.id, BRIN_SALT_DEF],
  [OLEN_DEF.id,      OLEN_DEF],
])

/**
 * Look up a vendor definition by id.
 * Falls back to the general trader if the id is unknown.
 */
export function getVendorDef(vendorId: string): VendorDef {
  return VENDOR_REGISTRY.get(vendorId) ?? TOMAS_DEF
}

/**
 * Return all registered vendor definitions.
 * Used by the shop store to initialise remaining-stock counters.
 */
export function getAllVendorDefs(): VendorDef[] {
  return Array.from(VENDOR_REGISTRY.values())
}

// ── Sell constraint ───────────────────────────────────────────────────────────

/** Item IDs that Bron (Toolsmith) will buy from the player. */
const TOOLSMITH_ACCEPTED_IDS = new Set<string>([
  // All tools are accepted (checked by item.type === 'tool' below)
  // Ores
  'copper_ore', 'iron_ore', 'ore_chip', 'duskiron_ore',
  // Smelted bars
  'copper_bar', 'iron_bar', 'duskiron_bar',
  // Wood used in smithing
  'ashwood_log', 'ironbark_log', 'ash_sapling_log',
  // Stone
  'rough_stone', 'small_stone', 'flint_shard',
  // Higher-tier tinkering outputs
  'dusk_lens_mount',
  // Phase 66 — Salvage System: raw salvage materials and crafted outputs
  'crumbled_masonry', 'iron_relic_fragment', 'vault_mortar', 'relic_rivet',
])

/** Item IDs that Brin Salt (Fisher Supplier) will buy from the player. */
const FISHER_ACCEPTED_IDS = new Set<string>([
  // Raw fish
  'minnow', 'perch', 'gloomfin',
  // Cooked fish
  'cooked_minnow', 'cooked_perch', 'cooked_gloomfin',
  // Tackle materials
  'reinforced_hook', 'bait_basket', 'reed_fiber',
])

/** Item IDs that Olen (Union Trader) will buy from the player. */
const UNION_ACCEPTED_IDS = new Set<string>([
  // Ores and bars
  'copper_ore', 'iron_ore', 'ore_chip', 'duskiron_ore',
  'copper_bar', 'iron_bar', 'duskiron_bar',
  // Stone
  'rough_stone', 'small_stone', 'flint_shard',
  // Phase 66 salvage materials
  'crumbled_masonry', 'iron_relic_fragment', 'vault_mortar', 'relic_rivet',
])

/**
 * Returns true when the player can sell `item` to `vendor`.
 *
 * Quest items are universally non-sellable.
 * General traders accept any non-quest item.
 * Toolsmiths accept tools plus smithing materials.
 * Fisher suppliers accept fishing tools plus fish and tackle.
 * Union traders (`faction_union`) accept mining tools plus union ores, stone,
 *   and salvage materials.
 */
export function canSellToVendor(item: ItemDefinition, vendor: VendorDef): boolean {
  if (item.type === 'quest') return false

  switch (vendor.role) {
    case 'general':
      return true

    case 'toolsmith':
      if (item.type === 'tool') return true
      return TOOLSMITH_ACCEPTED_IDS.has(item.id)

    case 'fishsupplier':
      if (item.type === 'tool' && item.toolMeta?.skill === 'fishing') return true
      return FISHER_ACCEPTED_IDS.has(item.id)

    case 'faction_union':
      if (item.type === 'tool' && item.toolMeta?.skill === 'mining') return true
      return UNION_ACCEPTED_IDS.has(item.id)
  }
}

// ── Legacy export — backward-compat alias for TOMAS_DEF.stock ────────────────

/**
 * @deprecated  Use `getVendorDef('tomas').stock` instead.
 * Kept for any code that still imports VENDOR_STOCK directly.
 */
export const VENDOR_STOCK: VendorItem[] = TOMAS_DEF.stock

// ── Price helpers ─────────────────────────────────────────────────────────────

/**
 * Returns the buy price for an item.
 * Uses the item's registry `value` directly.
 */
export function getBuyPrice(itemValue: number): number {
  return itemValue
}

/**
 * Returns the sell price for an item (what the vendor pays the player).
 * Always at least 1 coin so every item is sellable.
 *
 * Phase 85 — consumables (food, tonics) sell for 1/4 of their value instead
 * of the standard 1/3 to reduce the profitability of cook-and-sell loops.
 */
export function getSellPrice(itemValue: number, isConsumable = false): number {
  const divisor = isConsumable ? 4 : 3
  return Math.max(1, Math.floor(itemValue / divisor))
}

// ── Faction sell bonus (Phase 77) ─────────────────────────────────────────────

/**
 * Faction-aligned sell bonus multiplier.
 *
 * When a player sells goods to a vendor whose `factionId` matches a faction
 * where the player has Trusted or Honored standing, they receive a sell-price
 * premium:
 *   Trusted  → 1.15 (15% bonus)
 *   Honored  → 1.30 (30% bonus)
 *   All others → 1.00 (no bonus)
 *
 * @param tier  The player's current trust tier with the vendor's faction.
 * @returns Multiplier to apply to the base sell price.
 */
export function getFactionSellBonus(tier: FactionTier): number {
  if (tier === 'honored')  return 1.30
  if (tier === 'trusted')  return 1.15
  return 1.0
}

/** Ordered tiers for threshold comparisons. */
export const FACTION_TIER_ORDER: FactionTier[] = [
  'neutral',
  'acquainted',
  'trusted',
  'honored',
]
