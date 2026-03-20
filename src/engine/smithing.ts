/**
 * Phase 40 — Smithing Foundation
 *
 * Provides the forging furnace engine for Veilmarch.  A single furnace station
 * is placed in the Hushwood settlement; players interact with it to smelt raw
 * ore into metal bars that feed higher-tier crafting.
 *
 * Smelt recipes (ore → bar):
 *   copper_ore ×3  → copper_bar  (lvl 1, 4 s, 15 xp)
 *   iron_ore   ×4  → iron_bar    (lvl 5, 6 s, 30 xp)
 *
 * The caller (App.tsx) owns the level check, timed session, item swap, and XP
 * grant.  This module provides the data, station visual, and helpers.
 */

import * as THREE from 'three'
import type { Interactable } from './interactable'
import { useGameStore } from '../store/useGameStore'

// ─── Recipe configuration ─────────────────────────────────────────────────

/** All smeltable ore IDs. */
export type SmeltableId = 'copper_ore' | 'iron_ore'

export interface SmeltRecipeConfig {
  /** Human-readable ingredient name for notification messages. */
  label: string
  /** Registry ID of the ore consumed. */
  oreId: SmeltableId
  /** How many ore units are consumed per bar. */
  oreQty: number
  /** Registry ID of the bar produced. */
  barId: string
  /** Minimum Forging level required to smelt this. */
  levelReq: number
  /** Seconds the player must stand at the furnace to complete the smelt. */
  smeltDuration: number
  /** Forging XP awarded on a successful smelt. */
  xp: number
}

export const SMELT_RECIPE_CONFIG: Readonly<Record<SmeltableId, SmeltRecipeConfig>> = {
  copper_ore: {
    label: 'Copper Ore',
    oreId: 'copper_ore',
    oreQty: 3,
    barId: 'copper_bar',
    levelReq: 1,
    smeltDuration: 4,
    xp: 15,
  },
  iron_ore: {
    label: 'Iron Ore',
    oreId: 'iron_ore',
    oreQty: 4,
    barId: 'iron_bar',
    levelReq: 5,
    smeltDuration: 6,
    xp: 30,
  },
} as const

/**
 * Priority order used by findSmeltableOre() when the player has multiple
 * smeltable ores — highest-value recipe preferred first.
 */
const SMELT_PRIORITY: SmeltableId[] = ['iron_ore', 'copper_ore']

// ─── Furnace station type ─────────────────────────────────────────────────

/** Represents the single furnace station placed near the Hushwood settlement. */
export interface FurnaceStation {
  /** Unique identifier. */
  id: string
  /** Root Three.js group for the furnace visual. */
  mesh: THREE.Group
  /** Interactable descriptor registered in the shared array. */
  interactable: Interactable
}

// ─── Visual builder ───────────────────────────────────────────────────────

/** Build the furnace mesh — stone block body, arched mouth, chimney, glow. */
function _buildFurnaceMesh(): THREE.Group {
  const group = new THREE.Group()

  const matStone = new THREE.MeshStandardMaterial({ color: 0x706860, roughness: 0.9 })
  const matBrick = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.85 })
  const matGlow  = new THREE.MeshBasicMaterial({ color: 0xff6600 })
  const matChimney = new THREE.MeshStandardMaterial({ color: 0x5a5050, roughness: 0.9 })

  // Main body — rectangular stone block
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 1.0, 0.8),
    matStone,
  )
  body.position.y = 0.5
  group.add(body)

  // Brick arch mouth front face
  const mouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.4, 0.05),
    matBrick,
  )
  mouth.position.set(0, 0.35, 0.425)
  group.add(mouth)

  // Inner glow panel (slightly recessed)
  const glow = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.30, 0.04),
    matGlow,
  )
  glow.position.set(0, 0.35, 0.41)
  group.add(glow)

  // Chimney stack on top
  const chimney = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.18, 0.55, 8),
    matChimney,
  )
  chimney.position.set(0, 1.28, -0.1)
  group.add(chimney)

  // Warm orange point light emanating from the mouth
  const light = new THREE.PointLight(0xff6600, 4.0, 7)
  light.position.set(0, 0.5, 0.6)
  group.add(light)

  return group
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Spawn the Hushwood furnace station, register its interactable, and return
 * the station descriptor.
 *
 * The station is placed at (4, 0, 9) — east side of the commons, across from
 * the campfire cook station.
 *
 * @param scene         Three.js scene to add the mesh to.
 * @param interactables Mutable array; the station's interactable is appended.
 * @param onSmeltStart  Called when the player interacts with a ready station.
 *                      App.tsx owns inventory scan, level check, and session.
 */
export function buildFurnaceStation(
  scene: THREE.Scene,
  interactables: Interactable[],
  onSmeltStart: () => void,
): FurnaceStation {
  const mesh = _buildFurnaceMesh()
  mesh.position.set(4, 0, 9)
  scene.add(mesh)

  const interactable: Interactable = {
    mesh,
    label: 'Furnace',
    interactRadius: 2.0,
    onInteract: onSmeltStart,
  }
  interactables.push(interactable)

  return { id: 'furnace_station_0', mesh, interactable }
}

/**
 * Scan the player's inventory for the best smeltable ore (highest priority
 * recipe first, must have enough quantity to smelt one bar).  Returns the
 * matching recipe config or null when no smeltable ore is found in sufficient
 * quantity.
 *
 * Note: this does **not** enforce level requirements — the caller is
 * responsible for checking `recipe.levelReq` against `getForgingLevel()`.
 */
export function findSmeltableOre(
  slots: ReadonlyArray<{ id: string; quantity: number }>,
): SmeltRecipeConfig | null {
  for (const oreId of SMELT_PRIORITY) {
    const cfg = SMELT_RECIPE_CONFIG[oreId]
    const slot = slots.find((s) => s.id === oreId)
    if (slot && slot.quantity >= cfg.oreQty) {
      return cfg
    }
  }
  return null
}

/**
 * Return every smelt recipe, regardless of inventory.  Used by SmithingPanel
 * to always show the full recipe list.
 */
export function getAllSmeltRecipes(): SmeltRecipeConfig[] {
  return SMELT_PRIORITY.map((id) => SMELT_RECIPE_CONFIG[id])
}

/**
 * Return the player's current Forging skill level from the global store.
 * Returns 1 when the skill is not yet initialised.
 */
export function getForgingLevel(): number {
  const { skills } = useGameStore.getState()
  return skills.skills.find((s) => s.id === 'forging')?.level ?? 1
}
