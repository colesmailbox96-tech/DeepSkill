/**
 * Phase 32 — Loot Drop System
 *
 * Defines chance-based loot tables for hostile creatures and provides
 * the rollLoot() helper that resolves a kill into awarded items and optional
 * currency.  The caller (App.tsx) is responsible for adding results to the
 * player's inventory and coin balance.
 *
 * Design:
 *   - Each LootEntry carries its own independent drop chance (0–1), so
 *     multiple entries can trigger from a single kill.
 *   - Rarity is metadata only (for display / future filter purposes); the
 *     actual probability is encoded in `chance` — rarity does not alter odds.
 *   - Currency is rolled as a uniform integer in [currencyMin, currencyMax].
 *     A range of [0, 0] (default) means no coin drop.
 *   - rollLoot() is stateless but non-deterministic: each call samples
 *     Math.random() independently, so two calls for the same creature may
 *     yield different results.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Flavour classification for a loot entry.
 * Does not affect probability — use `chance` for that.
 */
export type LootRarity = 'common' | 'uncommon' | 'rare'

/** A single potential reward in a loot table. */
export interface LootEntry {
  /** Item definition id (matches ItemDefinition.id in the item registry). */
  itemId: string
  /**
   * 0–1 probability that this entry triggers on each kill.
   * 1.0 = always drops; 0.05 = 5 % chance.
   */
  chance: number
  /** Minimum quantity awarded when the entry triggers (inclusive, ≥ 1). */
  minQty: number
  /** Maximum quantity awarded when the entry triggers (inclusive, ≥ minQty). */
  maxQty: number
  /** Visual rarity hint for UI display. */
  rarity: LootRarity
}

/** Full loot specification for one creature type. */
export interface LootTable {
  /** Ordered list of potential item drops. */
  entries: LootEntry[]
  /** Minimum Marks (⬡) awarded on kill (default 0). */
  currencyMin?: number
  /** Maximum Marks (⬡) awarded on kill (default 0). */
  currencyMax?: number
}

/** Result produced by rollLoot(). */
export interface LootResult {
  /** Items that should be added to the player's inventory. */
  items: Array<{ itemId: string; qty: number }>
  /** Marks to add to the player's coin balance. */
  currency: number
}

// ── Loot tables ───────────────────────────────────────────────────────────────

/**
 * Maps creature def.id → LootTable.
 * Add an entry here for each hostile creature type.
 */
const CREATURE_LOOT_TABLES: Record<string, LootTable> = {
  // Thornling — slow, hard-hitting briar beast; drops durable organic fragments.
  thornling: {
    entries: [
      {
        itemId: 'thornling_shard',
        chance: 0.75,
        minQty: 1,
        maxQty: 2,
        rarity: 'common',
      },
      {
        itemId: 'small_stone',
        chance: 0.5,
        minQty: 1,
        maxQty: 3,
        rarity: 'common',
      },
      {
        itemId: 'resin_glob',
        chance: 0.2,
        minQty: 1,
        maxQty: 1,
        rarity: 'uncommon',
      },
    ],
    currencyMin: 0,
    currencyMax: 3,
  },

  // Mossback Toad — quick, marsh-dwelling amphibian; drops soft hide.
  mossback_toad: {
    entries: [
      {
        itemId: 'mossback_hide',
        chance: 0.7,
        minQty: 1,
        maxQty: 1,
        rarity: 'common',
      },
      {
        itemId: 'reed_fiber',
        chance: 0.4,
        minQty: 1,
        maxQty: 2,
        rarity: 'common',
      },
    ],
    currencyMin: 0,
    currencyMax: 2,
  },

  // Snarl Whelp — scrappy trail creature; drops rough fur pelt.
  snarl_whelp: {
    entries: [
      {
        itemId: 'snarl_pelt',
        chance: 0.65,
        minQty: 1,
        maxQty: 1,
        rarity: 'common',
      },
      {
        itemId: 'small_stone',
        chance: 0.35,
        minQty: 1,
        maxQty: 2,
        rarity: 'common',
      },
    ],
    currencyMin: 0,
    currencyMax: 2,
  },

  // Brackroot Crawler — chitinous insect; drops shell segments.
  brackroot_crawler: {
    entries: [
      {
        itemId: 'crawler_chitin',
        chance: 0.70,
        minQty: 1,
        maxQty: 2,
        rarity: 'common',
      },
      {
        itemId: 'resin_glob',
        chance: 0.25,
        minQty: 1,
        maxQty: 1,
        rarity: 'uncommon',
      },
    ],
    currencyMin: 0,
    currencyMax: 3,
  },
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Roll the loot table for the given creature id and return what dropped.
 *
 * Returns an empty LootResult (no items, 0 currency) for creatures that have
 * no registered loot table so callers don't need to null-check.
 *
 * @param creatureId  The `def.id` of the defeated creature.
 */
export function rollLoot(creatureId: string): LootResult {
  const table = CREATURE_LOOT_TABLES[creatureId]
  if (!table) {
    return { items: [], currency: 0 }
  }

  const items: LootResult['items'] = []

  for (const entry of table.entries) {
    if (Math.random() < entry.chance) {
      const qty =
        entry.minQty === entry.maxQty
          ? entry.minQty
          : entry.minQty + Math.floor(Math.random() * (entry.maxQty - entry.minQty + 1))
      items.push({ itemId: entry.itemId, qty })
    }
  }

  const min = table.currencyMin ?? 0
  const max = table.currencyMax ?? 0
  const currency =
    min === max ? min : min + Math.floor(Math.random() * (max - min + 1))

  return { items, currency }
}

/**
 * Return a deep clone of the loot table for the given creature id, or
 * undefined if none exists.  A clone is returned so callers cannot
 * accidentally mutate the global tables and affect future drops.
 * Useful for UI previews or future loot-inspect features.
 */
export function getLootTable(creatureId: string): LootTable | undefined {
  const table = CREATURE_LOOT_TABLES[creatureId]
  if (!table) return undefined
  return structuredClone(table)
}
