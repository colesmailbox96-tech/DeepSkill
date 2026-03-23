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
  // Phase 62 — also yields thornling_hide, bone_shard, and resinous_organ.
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
      {
        itemId: 'thornling_hide',
        chance: 0.55,
        minQty: 1,
        maxQty: 1,
        rarity: 'common',
      },
      {
        itemId: 'bone_shard',
        chance: 0.55,
        minQty: 1,
        maxQty: 2,
        rarity: 'common',
      },
      {
        itemId: 'resinous_organ',
        chance: 0.30,
        minQty: 1,
        maxQty: 1,
        rarity: 'uncommon',
      },
    ],
    currencyMin: 0,
    currencyMax: 3,
  },

  // Mossback Toad — quick, marsh-dwelling amphibian; drops soft hide.
  // Phase 62 — also yields toad_gland used in the new marsh_tonic cooking recipe.
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
      {
        itemId: 'toad_gland',
        chance: 0.50,
        minQty: 1,
        maxQty: 1,
        rarity: 'uncommon',
      },
    ],
    currencyMin: 0,
    currencyMax: 2,
  },

  // Snarl Whelp — scrappy trail creature; drops rough fur pelt.
  // Phase 62 — also yields bone_shard.
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
      {
        itemId: 'bone_shard',
        chance: 0.45,
        minQty: 1,
        maxQty: 2,
        rarity: 'common',
      },
    ],
    currencyMin: 0,
    currencyMax: 2,
  },

  // Brackroot Crawler — chitinous insect; drops shell segments.
  // Phase 62 — also yields resinous_organ.
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
      {
        itemId: 'resinous_organ',
        chance: 0.40,
        minQty: 1,
        maxQty: 1,
        rarity: 'uncommon',
      },
    ],
    currencyMin: 0,
    currencyMax: 3,
  },

  // Phase 58 — Ashfen Copse creatures now drop duskiron ore as a rare reward,
  // linking combat progression to the new resource tier.
  // Phase 59 — Hushfang and Ember Ram also drop their respective raw meats
  // so players have ingredients for the new Cooking Expansion recipes.
  // Phase 62 — Hushfang and Ember Ram gain hide and bone_shard drops,
  // feeding the new tinkering and carving craft routes.

  // Hushfang — sleek charcoal predator; reliably drops its fang; rare duskiron ore.
  hushfang: {
    entries: [
      {
        itemId: 'hushfang_fang',
        chance: 0.90,
        minQty: 1,
        maxQty: 1,
        rarity: 'common',
      },
      {
        itemId: 'hushfang_meat',
        chance: 0.75,
        minQty: 1,
        maxQty: 1,
        rarity: 'common',
      },
      {
        itemId: 'ashfen_resin',
        chance: 0.40,
        minQty: 1,
        maxQty: 1,
        rarity: 'uncommon',
      },
      {
        itemId: 'duskiron_ore',
        chance: 0.15,
        minQty: 1,
        maxQty: 2,
        rarity: 'rare',
      },
      {
        itemId: 'hushfang_hide',
        chance: 0.65,
        minQty: 1,
        maxQty: 1,
        rarity: 'common',
      },
      {
        itemId: 'bone_shard',
        chance: 0.60,
        minQty: 1,
        maxQty: 2,
        rarity: 'common',
      },
    ],
    currencyMin: 2,
    currencyMax: 6,
  },

  // Ember Ram — stocky geothermal brute; reliably drops its horn; rare duskiron ore.
  ember_ram: {
    entries: [
      {
        itemId: 'ember_ram_horn',
        chance: 0.85,
        minQty: 1,
        maxQty: 1,
        rarity: 'common',
      },
      {
        itemId: 'ember_ram_meat',
        chance: 0.70,
        minQty: 1,
        maxQty: 1,
        rarity: 'common',
      },
      {
        itemId: 'small_stone',
        chance: 0.50,
        minQty: 1,
        maxQty: 3,
        rarity: 'common',
      },
      {
        itemId: 'duskiron_ore',
        chance: 0.20,
        minQty: 1,
        maxQty: 2,
        rarity: 'rare',
      },
      {
        itemId: 'ember_ram_hide',
        chance: 0.60,
        minQty: 1,
        maxQty: 1,
        rarity: 'common',
      },
      {
        itemId: 'bone_shard',
        chance: 0.50,
        minQty: 1,
        maxQty: 2,
        rarity: 'common',
      },
    ],
    currencyMin: 3,
    currencyMax: 8,
  },

  // ── Phase 65 — Hollow Vault Steps creatures ────────────────────────────────

  // Vault Crawler — fast arthropod; main drop is vault chitin; occasional bone shards.
  vault_crawler: {
    entries: [
      {
        itemId: 'vault_chitin',
        chance: 0.80,
        minQty: 1,
        maxQty: 2,
        rarity: 'common',
      },
      {
        itemId: 'bone_shard',
        chance: 0.45,
        minQty: 1,
        maxQty: 2,
        rarity: 'common',
      },
      {
        itemId: 'small_stone',
        chance: 0.30,
        minQty: 1,
        maxQty: 2,
        rarity: 'common',
      },
    ],
    currencyMin: 1,
    currencyMax: 4,
  },

  // Stone Wraith — spectral construct; drops wraith stone; rare resinous organ.
  stone_wraith: {
    entries: [
      {
        itemId: 'wraith_stone',
        chance: 0.70,
        minQty: 1,
        maxQty: 2,
        rarity: 'uncommon',
      },
      {
        itemId: 'resinous_organ',
        chance: 0.35,
        minQty: 1,
        maxQty: 1,
        rarity: 'uncommon',
      },
      {
        itemId: 'small_stone',
        chance: 0.55,
        minQty: 1,
        maxQty: 3,
        rarity: 'common',
      },
    ],
    currencyMin: 4,
    currencyMax: 10,
  },

  // ── Phase 82 — Higher Threat Creature Pack ─────────────────────────────────

  // Deep Husk — massive calcified vault-construct; drops husk_membrane and
  // construct_plating; occasional vault_glass_shard; high currency reward.
  deep_husk: {
    entries: [
      {
        itemId: 'husk_membrane',
        chance: 0.70,
        minQty: 1,
        maxQty: 2,
        rarity: 'uncommon',
      },
      {
        itemId: 'construct_plating',
        chance: 0.55,
        minQty: 1,
        maxQty: 1,
        rarity: 'uncommon',
      },
      {
        itemId: 'vault_glass_shard',
        chance: 0.30,
        minQty: 1,
        maxQty: 2,
        rarity: 'uncommon',
      },
      {
        itemId: 'bone_shard',
        chance: 0.60,
        minQty: 1,
        maxQty: 3,
        rarity: 'common',
      },
    ],
    currencyMin: 8,
    currencyMax: 18,
  },

  // Glassjaw Sentinel — fast glass-alloy construct; drops glassjaw_shard as
  // its signature material; vault_glass_shard as common secondary.
  glassjaw_sentinel: {
    entries: [
      {
        itemId: 'glassjaw_shard',
        chance: 0.75,
        minQty: 1,
        maxQty: 2,
        rarity: 'uncommon',
      },
      {
        itemId: 'vault_glass_shard',
        chance: 0.65,
        minQty: 1,
        maxQty: 2,
        rarity: 'common',
      },
      {
        itemId: 'small_stone',
        chance: 0.40,
        minQty: 1,
        maxQty: 3,
        rarity: 'common',
      },
    ],
    currencyMin: 6,
    currencyMax: 14,
  },

  // Lantern Eel — bioluminescent fen predator; drops eel_lantern_organ as
  // its signature material; reed_fiber as common secondary.
  lantern_eel: {
    entries: [
      {
        itemId: 'eel_lantern_organ',
        chance: 0.80,
        minQty: 1,
        maxQty: 1,
        rarity: 'uncommon',
      },
      {
        itemId: 'reed_fiber',
        chance: 0.60,
        minQty: 1,
        maxQty: 3,
        rarity: 'common',
      },
      {
        itemId: 'mossback_hide',
        chance: 0.35,
        minQty: 1,
        maxQty: 1,
        rarity: 'common',
      },
    ],
    currencyMin: 5,
    currencyMax: 12,
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
