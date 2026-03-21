/**
 * Phase 48 — Environmental Hazard System
 *
 * Provides a data-driven framework for axis-aligned hazard volumes.  Each
 * HazardDef describes a region of the world where the player suffers a
 * periodic effect (damage or debuff) unless they carry an appropriate ward
 * item.  All per-frame tick logic is driven by App.tsx via tickHazards().
 *
 * Hazard zones currently registered
 * ───────────────────────────────────
 *  mist_seep   Inner shrine of Tidemark Chapel (x −46→−60, z −10→+10)
 *              Migrated from the inline Phase 47 implementation.
 *
 *  spore_drift  Brackroot bog thicket (x −4→+4, z 20→30)
 *               Heavy fungal spore cloud; causes fatigue (stamina drain).
 *
 *  caustic_vent Quarry pit east wall  (x 12→20, z −6→+6)
 *               Acidic vapour from deep ore seam; deals moderate damage.
 */

import type { InventoryState } from '../store/useGameStore'

// ─── Types ────────────────────────────────────────────────────────────────────

/** Axis-aligned bounding box for a hazard volume (Y is ignored). */
export interface HazardAABB {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

/** Kind of effect applied each tick while the player is unprotected. */
export type HazardEffect = 'damage' | 'stamina_drain'

/** Static definition of a hazard zone. */
export interface HazardDef {
  /** Unique identifier for this hazard. */
  id: string
  /** Short display name shown in the warning HUD. */
  label: string
  /** World-space volume. */
  aabb: HazardAABB
  /** Type of effect applied per tick. */
  effect: HazardEffect
  /** Seconds between ticks. */
  tickInterval: number
  /** Amount subtracted per tick (HP or stamina depending on effect). */
  tickAmount: number
  /** Item id that completely neutralises this hazard, or null for no protection. */
  wardItemId: string | null
  /** Notification text shown when the player enters (unprotected). */
  entryMessage: string
  /** Notification text shown when the player enters and is protected. */
  entryProtectedMessage: string
  /** Notification text appended each damage tick. */
  tickMessage: string
  /** Accent colour used by the warning HUD (CSS hex string). */
  color: string
  /** Emoji / icon character rendered in the warning HUD. */
  icon: string
}

// ─── Hazard registry ──────────────────────────────────────────────────────────

/** All environmental hazard zones in the world. */
const HAZARD_DEFS: HazardDef[] = [
  {
    id: 'mist_seep',
    label: 'Mist Seep',
    aabb: { minX: -60, maxX: -46, minZ: -10, maxZ: 10 },
    effect: 'damage',
    tickInterval: 3.0,
    tickAmount: 1,
    wardItemId: 'ashwillow_ward',
    entryMessage: 'A cold mist seeps from the shaft. Your skin prickles.',
    entryProtectedMessage: 'Your Ashwillow Ward hums — the mist cannot take hold.',
    tickMessage: 'The mist seep drains you.',
    color: '#7ab0d8',
    icon: '🌫️',
  },
  {
    id: 'spore_drift',
    label: 'Spore Drift',
    aabb: { minX: -4, maxX: 4, minZ: 20, maxZ: 30 },
    effect: 'stamina_drain',
    tickInterval: 4.0,
    tickAmount: 8,
    wardItemId: 'thornward_mark',
    entryMessage: 'Thick spores swirl in the air. You feel sluggish.',
    entryProtectedMessage: 'Your Thornward Mark repels the spores.',
    tickMessage: 'Spores sap your endurance.',
    color: '#9ccc65',
    icon: '🍄',
  },
  {
    id: 'caustic_vent',
    label: 'Caustic Vent',
    aabb: { minX: 12, maxX: 20, minZ: -6, maxZ: 6 },
    effect: 'damage',
    tickInterval: 2.5,
    tickAmount: 2,
    wardItemId: null,
    entryMessage: 'Acidic vapour burns your lungs. Find shelter!',
    entryProtectedMessage: '', // no ward available — this message is never shown
    tickMessage: 'Caustic fumes sear through you.',
    color: '#ef9a3a',
    icon: '⚗️',
  },
]

// ─── Public API ───────────────────────────────────────────────────────────────

/** Return all registered hazard definitions. */
export function getAllHazardDefs(): readonly HazardDef[] {
  return HAZARD_DEFS
}

/**
 * Return the HazardDef whose volume contains `(x, z)`, or `null` if the
 * position lies outside every hazard zone.  Only the first match is returned
 * (zones should not overlap).
 */
export function getHazardAtPosition(x: number, z: number): HazardDef | null {
  for (const def of HAZARD_DEFS) {
    const { aabb } = def
    if (x >= aabb.minX && x <= aabb.maxX && z >= aabb.minZ && z <= aabb.maxZ) {
      return def
    }
  }
  return null
}

/**
 * Return `true` if the player's inventory contains the ward item required to
 * be immune to `hazard`.
 */
export function isProtectedFromHazard(
  hazard: HazardDef,
  inventory: InventoryState,
): boolean {
  if (!hazard.wardItemId) return false
  return inventory.slots.some((s) => s.id === hazard.wardItemId)
}
