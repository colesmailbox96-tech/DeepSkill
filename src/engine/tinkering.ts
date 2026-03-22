/**
 * Phase 43 — Tinkering Skill Foundation
 *
 * Provides a tinkerer's bench station and the assembly interface for
 * Veilmarch.  A single bench is placed in the Hushwood settlement; players
 * interact with it to assemble refined metals and worked wood into utility
 * devices.
 *
 * Tinkering recipes:
 *   copper_bar   ×2  → lantern_parts    (lvl 1,  8 s, 12 xp)
 *   iron_bar     ×1  → reinforced_hook  (lvl 2,  6 s, 15 xp)
 *   ashwood_shaft×2  → bait_basket      (lvl 3,  9 s, 18 xp)
 *   iron_bar     ×2  → repair_clamp     (lvl 4, 10 s, 22 xp)
 *
 * The caller (App.tsx) owns the level check, timed session, item swap, and XP
 * grant.  This module provides the data, station visual, and helpers.
 */

import * as THREE from 'three'
import type { Interactable } from './interactable'
import { useGameStore } from '../store/useGameStore'

// ─── Recipe configuration ─────────────────────────────────────────────────

/** All tinkerable material IDs. */
export type TinkerableId = 'copper_bar' | 'iron_bar' | 'ashwood_shaft' | 'duskiron_bar'

/** Union of every tinkering output ID. */
export type TinkerOutputId = 'lantern_parts' | 'reinforced_hook' | 'bait_basket' | 'repair_clamp' | 'dusk_lens_mount'

export interface TinkerRecipeConfig {
  /** Human-readable label for notifications. */
  label: string
  /** Registry ID of the primary material consumed. */
  materialId: TinkerableId
  /** How many material units are consumed per tinker. */
  materialQty: number
  /** Registry ID of the output item produced. */
  outputId: TinkerOutputId
  /** Minimum Tinkering level required. */
  levelReq: number
  /** Seconds the player must stand at the bench to complete the assembly. */
  tinkerDuration: number
  /** Tinkering XP awarded on a successful assembly. */
  xp: number
}

export const TINKER_RECIPE_CONFIG: Readonly<Record<TinkerOutputId, TinkerRecipeConfig>> = {
  lantern_parts: {
    label: 'Lantern Parts',
    materialId: 'copper_bar',
    materialQty: 2,
    outputId: 'lantern_parts',
    levelReq: 1,
    tinkerDuration: 8,
    xp: 12,
  },
  reinforced_hook: {
    label: 'Reinforced Hook',
    materialId: 'iron_bar',
    materialQty: 1,
    outputId: 'reinforced_hook',
    levelReq: 2,
    tinkerDuration: 6,
    xp: 15,
  },
  bait_basket: {
    label: 'Bait Basket',
    materialId: 'ashwood_shaft',
    materialQty: 2,
    outputId: 'bait_basket',
    levelReq: 3,
    tinkerDuration: 9,
    xp: 18,
  },
  repair_clamp: {
    label: 'Repair Clamp',
    materialId: 'iron_bar',
    materialQty: 2,
    outputId: 'repair_clamp',
    levelReq: 4,
    tinkerDuration: 10,
    xp: 22,
  },
  // Phase 58 — Dusk Lens Mount: a precision assembly of duskiron and marsh
  // glass reed, used in advanced optical and surveying instruments.
  dusk_lens_mount: {
    label: 'Dusk Lens Mount',
    materialId: 'duskiron_bar',
    materialQty: 1,
    outputId: 'dusk_lens_mount',
    levelReq: 8,
    tinkerDuration: 12,
    xp: 38,
  },
} as const

/**
 * Priority order used by findTinkerableMaterial() and getAllTinkerRecipes().
 * Typed as `TinkerOutputId[]` so the compiler catches any key mismatch with
 * `TINKER_RECIPE_CONFIG`.
 */
const TINKER_DISPLAY_ORDER: TinkerOutputId[] = [
  'lantern_parts',
  'reinforced_hook',
  'bait_basket',
  'repair_clamp',
  'dusk_lens_mount',
]

// ─── Tinkerer's bench station type ───────────────────────────────────────

/** Represents the single tinkerer's bench placed in the Hushwood settlement. */
export interface TinkererBenchStation {
  /** Unique identifier. */
  id: string
  /** Root Three.js group for the bench visual. */
  mesh: THREE.Group
  /** Interactable descriptor registered in the shared array. */
  interactable: Interactable
}

// ─── Visual builder ───────────────────────────────────────────────────────

/** Build the tinkerer's bench mesh — a compact worktop with small tools and parts. */
function _buildTinkererBenchMesh(): THREE.Group {
  const group = new THREE.Group()

  const matWood   = new THREE.MeshStandardMaterial({ color: 0x6b4f2e, roughness: 0.82 })
  const matDark   = new THREE.MeshStandardMaterial({ color: 0x3d2b14, roughness: 0.9 })
  const matMetal  = new THREE.MeshStandardMaterial({ color: 0x9a8c78, roughness: 0.5, metalness: 0.55 })
  const matCopper = new THREE.MeshStandardMaterial({ color: 0xb36a32, roughness: 0.55, metalness: 0.6 })

  // Tabletop
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 0.55), matWood)
  top.position.set(0, 0.84, 0)
  group.add(top)

  // Raised back-shelf
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.06, 0.18), matDark)
  shelf.position.set(0, 1.0, -0.185)
  group.add(shelf)

  // Shelf uprights
  const upright = new THREE.BoxGeometry(0.05, 0.22, 0.05)
  for (const x of [-0.5, 0.5]) {
    const u = new THREE.Mesh(upright, matDark)
    u.position.set(x, 0.93, -0.185)
    group.add(u)
  }

  // Four legs
  const legGeom = new THREE.BoxGeometry(0.07, 0.76, 0.07)
  const legPositions: [number, number, number][] = [
    [ 0.49, 0.42,  0.22],
    [-0.49, 0.42,  0.22],
    [ 0.49, 0.42, -0.22],
    [-0.49, 0.42, -0.22],
  ]
  for (const [x, y, z] of legPositions) {
    const leg = new THREE.Mesh(legGeom, matDark)
    leg.position.set(x, y, z)
    group.add(leg)
  }

  // Cross-brace
  const brace = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.05, 0.05), matDark)
  brace.position.set(0, 0.2, 0)
  group.add(brace)

  // Small copper panel on the bench surface
  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, 0.15), matCopper)
  panel.position.set(-0.28, 0.89, 0.06)
  group.add(panel)

  // Iron pliers resting on the bench
  const pliersBody = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.28), matMetal)
  pliersBody.position.set(0.26, 0.885, 0.04)
  group.add(pliersBody)

  // Tiny screw on the shelf
  const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.06, 6), matMetal)
  screw.position.set(0.0, 1.04, -0.185)
  group.add(screw)

  // Warm amber glow over the bench
  const light = new THREE.PointLight(0xffe0a0, 1.4, 5)
  light.position.set(0, 1.6, 0)
  group.add(light)

  return group
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Spawn the Hushwood tinkerer's bench station, register its interactable,
 * and return the station descriptor.
 *
 * The station is placed at (0, 0, 12) — north end of the settlement commons,
 * accessible from both the furnace (east) and the carving workbench (west).
 *
 * @param scene         Three.js scene to add the mesh to.
 * @param interactables Mutable array; the station's interactable is appended.
 * @param onTinkerStart Called when the player interacts with the bench.
 */
export function buildTinkererBenchStation(
  scene: THREE.Scene,
  interactables: Interactable[],
  onTinkerStart: () => void,
): TinkererBenchStation {
  const mesh = _buildTinkererBenchMesh()
  mesh.position.set(0, 0, 12)
  scene.add(mesh)

  const interactable: Interactable = {
    mesh,
    label: "Tinkerer's Bench",
    interactRadius: 2.0,
    onInteract: onTinkerStart,
  }
  interactables.push(interactable)

  return { id: 'tinkerer_bench_station_0', mesh, interactable }
}

/**
 * Return every tinker recipe in display order.  Used by TinkeringPanel to
 * always show the full recipe list.
 */
export function getAllTinkerRecipes(): TinkerRecipeConfig[] {
  return TINKER_DISPLAY_ORDER.map((id) => TINKER_RECIPE_CONFIG[id])
}

/**
 * Return the player's current Tinkering skill level from the global store.
 * Returns 1 when the skill is not yet initialised.
 */
export function getTinkeringLevel(): number {
  const { skills } = useGameStore.getState()
  return skills.skills.find((s) => s.id === 'tinkering')?.level ?? 1
}

/**
 * Scan the player's inventory for the first recipe whose material requirement
 * is met (by quantity).  Recipes are checked in display order.  Returns the
 * matching recipe config or null when no tinkerable material is available in
 * sufficient quantity.
 *
 * Note: this does **not** enforce level requirements — the caller is
 * responsible for checking `recipe.levelReq` against `getTinkeringLevel()`.
 */
export function findTinkerableMaterial(
  slots: ReadonlyArray<{ id: string; quantity: number }>,
): TinkerRecipeConfig | null {
  for (const id of TINKER_DISPLAY_ORDER) {
    const cfg = TINKER_RECIPE_CONFIG[id]
    const slot = slots.find((s) => s.id === cfg.materialId)
    if (slot && slot.quantity >= cfg.materialQty) {
      return cfg
    }
  }
  return null
}
