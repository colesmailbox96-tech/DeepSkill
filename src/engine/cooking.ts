/**
 * Phase 22 — Cooking System Foundation
 * Phase 59 — Cooking Expansion: hushfang_meat and ember_ram_meat added.
 * Phase 62 — Creature Loot Expansion: toad_gland → marsh_tonic added.
 * Phase 87 — Warden's Legacy: eel_lantern_organ → lantern_eel_broth added.
 *
 * Provides the hearthcraft cooking engine for Veilmarch.  A single campfire
 * cook station is placed in the Hushwood settlement; players interact with it
 * to cook raw ingredients into restorative food.
 *
 * Cookable recipes (raw → cooked):
 *   minnow          → cooked_minnow    (lvl 1, 2 s, 10 xp, heals  6 HP)
 *   perch           → cooked_perch     (lvl 1, 3 s, 18 xp, heals 14 HP)
 *   gloomfin        → cooked_gloomfin  (lvl 5, 4 s, 30 xp, heals 25 HP)
 *   cinderhare_meat → cooked_cinderhare(lvl 1, 3 s, 15 xp, heals 18 HP)
 *   toad_gland      → marsh_tonic      (lvl 3, 5 s, 20 xp, heals 12 HP + stamina) [Phase 62]
 *   eel_lantern_organ→lantern_eel_broth(lvl 6, 5 s, 42 xp, heals 20 HP + 30 stamina) [Phase 87]
 *
 * The caller (App.tsx) owns the level check, timed session, item swap, and XP
 * grant.  This module provides the data, station visual, and helpers.
 */

import * as THREE from 'three'
import type { Interactable } from './interactable'
import { useGameStore } from '../store/useGameStore'

// ─── Recipe configuration ──────────────────────────────────────────────────

/** All raw item IDs that can be cooked at a cook station. */
export type CookableId =
  | 'minnow'
  | 'perch'
  | 'gloomfin'
  | 'cinderhare_meat'
  | 'hushfang_meat'
  | 'ember_ram_meat'
  | 'toad_gland'
  | 'eel_lantern_organ'

export interface CookRecipeConfig {
  /** Human-readable ingredient name for notification messages. */
  label: string
  /** Registry ID of the raw ingredient consumed. */
  rawId: CookableId
  /** Registry ID of the cooked item produced. */
  cookedId: string
  /** Minimum Hearthcraft level required to cook this. */
  levelReq: number
  /** Seconds the player must stand at the fire to complete the cook. */
  cookDuration: number
  /** Hearthcraft XP awarded on a successful cook. */
  xp: number
  /** HP restored when the cooked item is consumed (informational). */
  healsHp: number
  /** Stamina restored when the cooked item is consumed (informational; optional). */
  restoresStamina?: number
}

export const COOK_RECIPE_CONFIG: Readonly<Record<CookableId, CookRecipeConfig>> = {
  minnow: {
    label: 'Minnow',
    rawId: 'minnow',
    cookedId: 'cooked_minnow',
    levelReq: 1,
    cookDuration: 2,
    xp: 10,
    healsHp: 6,
  },
  perch: {
    label: 'Perch',
    rawId: 'perch',
    cookedId: 'cooked_perch',
    levelReq: 1,
    cookDuration: 3,
    xp: 18,
    healsHp: 14,
  },
  gloomfin: {
    label: 'Gloomfin',
    rawId: 'gloomfin',
    cookedId: 'cooked_gloomfin',
    levelReq: 5,
    cookDuration: 4,
    xp: 30,
    healsHp: 25,
  },
  cinderhare_meat: {
    label: 'Cinderhare Meat',
    rawId: 'cinderhare_meat',
    cookedId: 'cooked_cinderhare',
    levelReq: 1,
    cookDuration: 3,
    xp: 15,
    healsHp: 18,
  },
  hushfang_meat: {
    label: 'Hushfang Meat',
    rawId: 'hushfang_meat',
    cookedId: 'hushfang_steak',
    levelReq: 5,
    cookDuration: 4,
    xp: 35,
    healsHp: 32,
  },
  ember_ram_meat: {
    label: 'Ember Ram Meat',
    rawId: 'ember_ram_meat',
    cookedId: 'ember_roast',
    levelReq: 8,
    cookDuration: 5,
    xp: 50,
    healsHp: 22,
  },
  // Phase 62 — Creature Loot Expansion: toad_gland rendered into marsh_tonic.
  // The numbing properties of the gland produce a restorative tonic that heals
  // a modest amount of HP and replenishes stamina — useful after skirmishes.
  toad_gland: {
    label: 'Toad Gland',
    rawId: 'toad_gland',
    cookedId: 'marsh_tonic',
    levelReq: 3,
    cookDuration: 5,
    xp: 20,
    healsHp: 12,
    restoresStamina: 20,
  },
  // Phase 87 — Warden's Legacy: eel_lantern_organ rendered into lantern_eel_broth.
  // The bioluminescent organ of a Lantern Eel is simmered into a rich golden broth
  // that restores a moderate amount of HP and a large portion of stamina.  The
  // electrical charge in the marrow passes harmlessly through the digestive system
  // but leaves the drinker unusually alert — perfect before a long vault descent.
  eel_lantern_organ: {
    label: 'Lantern Eel Organ',
    rawId: 'eel_lantern_organ',
    cookedId: 'lantern_eel_broth',
    levelReq: 6,
    cookDuration: 5,
    xp: 42,
    healsHp: 20,
    restoresStamina: 30,
  },
} as const

/**
 * Priority order used by findCookableIngredient() when the player has
 * multiple cookable items — highest-value recipe is preferred first.
 * Ordered by overall restorative value; toad_gland yields less HP than perch
 * so it sits below perch in the auto-select priority.
 */
const COOK_PRIORITY: CookableId[] = [
  'ember_ram_meat',
  'hushfang_meat',
  'eel_lantern_organ',
  'gloomfin',
  'cinderhare_meat',
  'perch',
  'toad_gland',
  'minnow',
]

// ─── Cook station type ────────────────────────────────────────────────────

/** Represents the single campfire cook station placed in the Hushwood area. */
export interface CookStation {
  /** Unique identifier. */
  id: string
  /** Root Three.js group for the campfire visual. */
  mesh: THREE.Group
  /** Interactable descriptor registered in the shared array. */
  interactable: Interactable
}

// ─── Visual builder ───────────────────────────────────────────────────────

/** Build the campfire mesh — stone ring, crossed logs, embers, flame. */
function _buildCampfireMesh(): THREE.Group {
  const group = new THREE.Group()

  const matStone = new THREE.MeshLambertMaterial({ color: 0x8e8680 })
  const matLog   = new THREE.MeshLambertMaterial({ color: 0x6a4a28 })
  // Use MeshBasicMaterial for ember and flame so the interaction highlight
  // system (which overwrites MeshStandardMaterial.emissive) cannot dim them.
  const matEmber = new THREE.MeshBasicMaterial({ color: 0xff5500 })
  const matFlame = new THREE.MeshBasicMaterial({
    color: 0xff9900,
    transparent: true,
    opacity: 0.85,
  })

  // Stone ring base
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.50, 0.12, 6, 12),
    matStone,
  )
  ring.rotation.x = Math.PI / 2
  ring.position.y = 0.12
  group.add(ring)

  // Two crossed logs inside the ring
  const logGeo = new THREE.CylinderGeometry(0.06, 0.07, 1.0, 7)
  const logA = new THREE.Mesh(logGeo, matLog)
  logA.rotation.z = Math.PI / 2
  logA.rotation.y = Math.PI / 6
  logA.position.y = 0.10
  group.add(logA)

  const logB = new THREE.Mesh(logGeo, matLog)
  logB.rotation.z = Math.PI / 2
  logB.rotation.y = -Math.PI / 6
  logB.position.y = 0.10
  group.add(logB)

  // Ember bed (flat disk)
  const embers = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.32, 0.06, 10),
    matEmber,
  )
  embers.position.y = 0.08
  group.add(embers)

  // Flame cone
  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.18, 0.50, 7),
    matFlame,
  )
  flame.position.y = 0.50
  group.add(flame)

  // Warm point light above the fire
  const light = new THREE.PointLight(0xff5500, 3.5, 9)
  light.position.y = 0.8
  group.add(light)

  return group
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Spawn the Hushwood campfire cook station, register its interactable, and
 * return the station descriptor.
 *
 * The station is placed at (-4, 0, 9) — west of the road between the commons
 * and the Mudroot Inn.
 *
 * @param scene         Three.js scene to add the mesh to.
 * @param interactables Mutable array; the station's interactable is appended.
 * @param onCookStart   Called when the player interacts with a ready station.
 *                      App.tsx owns inventory scan, level check, and session.
 */
export function buildCookStation(
  scene: THREE.Scene,
  interactables: Interactable[],
  onCookStart: () => void,
): CookStation {
  const mesh = _buildCampfireMesh()
  mesh.position.set(-4, 0, 9)
  scene.add(mesh)

  const interactable: Interactable = {
    mesh,
    label: 'Hearthfire',
    interactRadius: 2.0,
    onInteract: onCookStart,
  }
  interactables.push(interactable)

  return { id: 'cook_station_0', mesh, interactable }
}

/**
 * Scan the player's inventory for the best cookable ingredient (highest
 * priority recipe first).  Returns the matching recipe config or null when
 * no cookable ingredient is found.
 *
 * Note: this does **not** enforce level requirements — the caller is
 * responsible for checking `recipe.levelReq` against `getCookingLevel()`.
 */
export function findCookableIngredient(
  slots: ReadonlyArray<{ id: string; quantity: number }>,
): CookRecipeConfig | null {
  for (const rawId of COOK_PRIORITY) {
    if (slots.some((s) => s.id === rawId && s.quantity > 0)) {
      return COOK_RECIPE_CONFIG[rawId]
    }
  }
  return null
}

/**
 * Return the player's current Hearthcraft skill level from the global store.
 * Returns 1 when the skill is not yet initialised.
 */
export function getCookingLevel(): number {
  const { skills } = useGameStore.getState()
  return skills.skills.find((s) => s.id === 'hearthcraft')?.level ?? 1
}

/**
 * All cook recipes in display order (lowest level-req first, then by heal
 * value).  Use this to populate the CookPanel recipe list.
 */
export function getAllCookRecipes(): CookRecipeConfig[] {
  return (Object.values(COOK_RECIPE_CONFIG) as CookRecipeConfig[]).sort(
    (a, b) => a.levelReq - b.levelReq || a.healsHp - b.healsHp,
  )
}
