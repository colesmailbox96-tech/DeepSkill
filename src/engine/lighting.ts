/**
 * Phase 68 — Light and Visibility Mechanics
 *
 * Defines darkness zones where the player's visibility is impaired without a
 * light source, and helpers to check whether the player carries one.
 *
 * Design goals
 * ────────────
 *  • Darkness is an axis-aligned zone property, mirroring the Phase 48 hazard
 *    system so the integration pattern in App.tsx stays consistent.
 *  • A lantern equipped in the offHand slot (EquipMeta.providesLight === true)
 *    fully negates the darkness penalty.
 *  • Without a light source the player suffers a stamina drain every tick and
 *    sees a dark vignette overlay rendered by DarknessHud.
 *  • Gameplay is intentionally simple: enter a dark zone → equip lantern → play
 *    normally.  No complex line-of-sight or partial-vision systems.
 *
 * Dark zones
 * ──────────
 *  vault_dark   Hollow Vault Steps (full extent).  The vault was sealed and
 *               windowless; only residual occult luminescence remains.
 *               x = −75 → −98, z = −10 → +10  (upper steps + lower floor)
 *
 * Lantern item
 * ────────────
 *  hollow_lantern  Equipment, offHand slot.  Crafted at the Tinkerer's Bench
 *                  from Lantern Parts + Vault Seal Wax (Phase 68).
 */

import { useGameStore } from '../store/useGameStore'
import { getItem } from '../data/items/itemRegistry'

// ─── Types ────────────────────────────────────────────────────────────────────

/** Axis-aligned bounding box for a dark zone (Y is ignored). */
export interface DarkZoneAABB {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

/** Static definition of a darkness zone. */
export interface DarkZoneDef {
  /** Unique identifier. */
  id: string
  /** Short display name shown in the HUD. */
  label: string
  /** World-space volume. */
  aabb: DarkZoneAABB
  /**
   * Darkness intensity: 0 = fully lit, 1 = pitch black.
   * Drives the vignette opacity in DarknessHud.
   */
  intensity: number
  /** Seconds between stamina-drain ticks when unlit. */
  tickInterval: number
  /** Stamina drained per tick when unlit. */
  tickAmount: number
  /** Notification shown when the player enters unlit. */
  entryDarkMessage: string
  /** Notification shown when the player enters with a light source. */
  entryLitMessage: string
  /** Notification appended on each stamina-drain tick. */
  tickMessage: string
}

// ─── Dark zone registry ───────────────────────────────────────────────────────

const DARK_ZONE_DEFS: DarkZoneDef[] = [
  {
    id: 'vault_dark',
    label: 'Hollow Vault',
    aabb: { minX: -98, maxX: -75, minZ: -10, maxZ: 10 },
    intensity: 0.72,
    tickInterval: 5.0,
    tickAmount: 5,
    entryDarkMessage:
      'Darkness swallows the vault. You can barely see your hands. Equip a lantern.',
    entryLitMessage:
      'Your lantern pushes back the vault darkness. The way ahead is clear.',
    tickMessage: 'The vault darkness disorients you — your stamina fades.',
  },
  // Phase 74 — Marrowfen darkness zone: a dense canopy of gnarled mangrove and
  // hanging moss blocks most light.  A lantern is needed to navigate safely.
  {
    id: 'marrowfen_dark',
    label: 'Marrowfen',
    aabb: { minX: -28, maxX: 28, minZ: 60, maxZ: 105 },
    intensity: 0.60,
    tickInterval: 6.0,
    tickAmount: 4,
    entryDarkMessage:
      'The fen canopy smothers all light. Shapes blur in the murk — equip a lantern to see clearly.',
    entryLitMessage:
      'Your lantern cuts through the fen murk. The path ahead is visible.',
    tickMessage: 'The thick darkness of the Marrowfen saps your endurance.',
  },
]

// ─── Public API ───────────────────────────────────────────────────────────────

/** Return all registered dark zone definitions. */
export function getAllDarkZoneDefs(): readonly DarkZoneDef[] {
  return DARK_ZONE_DEFS
}

/**
 * Return the DarkZoneDef whose volume contains `(x, z)`, or `null` when the
 * position is outside every dark zone.  Only the first match is returned.
 */
export function getDarkZoneAtPosition(x: number, z: number): DarkZoneDef | null {
  for (const def of DARK_ZONE_DEFS) {
    const { aabb } = def
    if (x >= aabb.minX && x <= aabb.maxX && z >= aabb.minZ && z <= aabb.maxZ) {
      return def
    }
  }
  return null
}

/**
 * Return `true` when the player has at least one equipped item with
 * `providesLight === true`.  Checks all equipment slots.
 */
export function hasLanternEquipped(): boolean {
  const { equipment } = useGameStore.getState()
  for (const item of Object.values(equipment)) {
    if (!item) continue
    const def = getItem(item.id)
    if (def?.equipMeta?.providesLight) return true
  }
  return false
}
