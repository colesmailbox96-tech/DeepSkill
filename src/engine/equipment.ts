/**
 * Phase 26 — Equipment System Foundation
 *
 * Defines equipment slot metadata, derived-stat computation, and equip
 * validation helpers.  The Zustand store (useGameStore) calls these
 * functions so UI components stay free of business logic.
 */

import type { EquipSlot, ItemDefinition } from '../data/items/itemSchema'

// ── Slot display metadata ────────────────────────────────────────────────────

/**
 * Human-readable label and display order for each equipment slot.
 * Ordered to match a typical paper-doll layout (head → weapon → accessories).
 */
export const EQUIP_SLOT_META: Record<EquipSlot, { label: string; order: number }> = {
  head:     { label: 'Head',      order: 0 },
  chest:    { label: 'Chest',     order: 1 },
  legs:     { label: 'Legs',      order: 2 },
  feet:     { label: 'Feet',      order: 3 },
  hands:    { label: 'Hands',     order: 4 },
  mainHand: { label: 'Main Hand', order: 5 },
  offHand:  { label: 'Off Hand',  order: 6 },
  ring:     { label: 'Ring',      order: 7 },
  neck:     { label: 'Neck',      order: 8 },
}

/** Ordered array of all equipment slot keys for iteration in the UI. */
export const EQUIP_SLOTS: EquipSlot[] = (
  Object.entries(EQUIP_SLOT_META) as [EquipSlot, { label: string; order: number }][]
)
  .sort((a, b) => a[1].order - b[1].order)
  .map(([slot]) => slot)

// ── Derived stat computation ─────────────────────────────────────────────────

/** Aggregated bonuses derived from all currently equipped items. */
export interface EquipStats {
  totalAttack: number
  totalDefence: number
}

/**
 * Sum the attack and defence bonuses from a set of equipped item definitions.
 * Pass an array of the `ItemDefinition`s that are currently equipped
 * (null/undefined entries are silently ignored).
 */
export function computeEquipStats(
  equippedDefs: (ItemDefinition | null | undefined)[],
): EquipStats {
  let totalAttack = 0
  let totalDefence = 0
  for (const def of equippedDefs) {
    if (!def?.equipMeta) continue
    totalAttack += def.equipMeta.attackBonus ?? 0
    totalDefence += def.equipMeta.defenceBonus ?? 0
  }
  return { totalAttack, totalDefence }
}

// ── Equip validation ─────────────────────────────────────────────────────────

/**
 * Determine whether a player's skill levels satisfy the requirements defined
 * on an item's `equipMeta.requirements`.
 *
 * @param def       The item definition to test.
 * @param skillMap  A map of skill id → current level (e.g. from the store).
 * @returns `true` when the item can be equipped; `false` otherwise.
 */
export function meetsEquipRequirements(
  def: ItemDefinition,
  skillMap: Partial<Record<string, number>>,
): boolean {
  const reqs = def.equipMeta?.requirements
  if (!reqs) return true
  for (const [skillId, minLevel] of Object.entries(reqs)) {
    if ((skillMap[skillId] ?? 0) < (minLevel ?? 0)) return false
  }
  return true
}
