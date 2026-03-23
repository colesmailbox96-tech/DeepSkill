/**
 * Phase 76 — Faction Registry
 *
 * Defines every faction in the world.  Each record carries only the
 * immutable data needed for display and lookup; mutable rep values live in
 * useFactionStore.
 *
 * Factions
 * ────────
 *  hushwrights        — Practical builders, haulers, and woodcutters.
 *  tidebound_keepers  — Shrine-tenders and lore stewards of the wet routes.
 *  quarry_union       — Ore workers, refiners, and contract smiths.
 *  lantern_circle     — Warders and students of Deep Heart disturbances.
 *  underline_syndics  — Salvagers and ruin brokers.
 */

export interface FactionDefinition {
  /** Unique identifier used as the lookup key. */
  id: string
  /** Display name shown in the UI. */
  name: string
  /** Short description for the faction panel tooltip. */
  description: string
}

// ─── Faction definitions ──────────────────────────────────────────────────────

export const FACTIONS: FactionDefinition[] = [
  {
    id: 'hushwrights',
    name: 'The Hushwrights',
    description: 'Practical builders, haulers, woodcutters, and repair workers who keep Cinderglen standing.',
  },
  {
    id: 'tidebound_keepers',
    name: 'The Tidebound Keepers',
    description: 'Shrine-tenders, ferrymen, and lore stewards who guard the wet routes and chapel traditions.',
  },
  {
    id: 'quarry_union',
    name: 'Quarry Union of Redwake',
    description: 'Ore workers, refiners, and contract smiths who run the Redwake Quarry.',
  },
  {
    id: 'lantern_circle',
    name: 'The Lantern Circle',
    description: 'Warders, signal-keepers, and quiet students of Deep Heart disturbances.',
  },
  {
    id: 'underline_syndics',
    name: 'The Underline Syndics',
    description: 'Salvagers, negotiators, and licensed ruin brokers — not always as licensed as advertised.',
  },
]

// ─── Registry ─────────────────────────────────────────────────────────────────

const _registry = new Map<string, FactionDefinition>(
  FACTIONS.map((f) => [f.id, f]),
)

/** Look up a faction definition by id. Returns undefined if not found. */
export function getFaction(id: string): FactionDefinition | undefined {
  return _registry.get(id)
}

/** Return all faction definitions in declaration order. */
export function getAllFactions(): FactionDefinition[] {
  return FACTIONS
}
