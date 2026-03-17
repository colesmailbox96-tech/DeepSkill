/**
 * Phase 11 — Item Registry
 *
 * Central lookup for all ItemDefinitions.  Definitions are registered at
 * module load time; the registry is keyed by item id.  All item sets
 * (Phase 11 seeds and the Phase 12 starter set) are registered here so
 * any consumer of this module sees the full catalog without requiring
 * additional imports at the entrypoint level.
 */

import type { ItemDefinition } from './itemSchema'
import { STARTER_ITEMS } from './starterItems'

// ── Internal store ───────────────────────────────────────────────────────────

const _registry = new Map<string, ItemDefinition>()

// ── Public API ───────────────────────────────────────────────────────────────

/** Register a single item definition.  Overwrites any previous entry with the
 *  same id so phases can refine or replace definitions without ceremony. */
export function registerItem(def: ItemDefinition): void {
  _registry.set(def.id, def)
}

/** Register multiple definitions in one call. */
export function registerItems(defs: ItemDefinition[]): void {
  for (const def of defs) {
    _registry.set(def.id, def)
  }
}

/** Look up an item definition by id.  Returns undefined when not found. */
export function getItem(id: string): ItemDefinition | undefined {
  return _registry.get(id)
}

/** Returns true when an id has a registered definition. */
export function hasItem(id: string): boolean {
  return _registry.has(id)
}

/** Snapshot of all registered definitions, in insertion order. */
export function getAllItems(): ItemDefinition[] {
  return Array.from(_registry.values())
}

// ── Seed definitions — Phase 11 ─────────────────────────────────────────────

registerItems([
  {
    id: 'rough_stone',
    name: 'Rough Stone',
    type: 'material',
    stackable: true,
    value: 1,
    icon: 'items/rough_stone.png',
    description:
      'A palm-sized chunk of unworked stone broken from surface rubble. ' +
      'Useful in small amounts for basic construction tasks.',
  },
  {
    id: 'ash_twig',
    name: 'Ash Twig',
    type: 'material',
    stackable: true,
    value: 1,
    icon: 'items/ash_twig.png',
    description:
      'A slender grey twig shed by an ash tree. ' +
      'Brittle on its own, but bundles of them serve as tinder or fletching stock.',
  },
])

// ── Starter item set — Phase 12 ──────────────────────────────────────────────

registerItems(STARTER_ITEMS)
