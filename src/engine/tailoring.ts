/**
 * Phase 63 — Armor and Clothing Craft Routes
 *
 * Provides a sewing-table station and the assembly interface for Veilmarch.
 * A single sewing table is placed in the Hushwood settlement; players interact
 * with it to stitch hides, bindings, and pads into wearable armour and
 * purpose-made utility garments.
 *
 * Tailoring recipes:
 *   hushfang_hide  ×2 + bone_needle    ×1 → hide_bracers      (lvl 1,  7 s, 15 xp)
 *   hushfang_hide  ×2 + bone_needle    ×1 → hide_hood         (lvl 2,  8 s, 18 xp)
 *   hushfang_hide  ×3 + rough_binding  ×1 → hide_leggings     (lvl 2,  9 s, 21 xp)
 *   hushfang_hide  ×3 + rough_binding  ×2 → hide_jerkin       (lvl 3, 10 s, 24 xp)
 *   char_pad       ×1 + hide_wrap      ×1 → patchplate_coif   (lvl 4, 10 s, 28 xp)
 *   char_pad       ×2 + rough_binding  ×2 → patchplate_vest   (lvl 5, 12 s, 32 xp)
 *   thornling_hide ×2 + bone_needle    ×1 → gatherer_wraps    (lvl 1,  6 s, 12 xp)
 *   thornling_hide ×3 + rough_binding  ×1 → woodcutter_smock  (lvl 2,  8 s, 16 xp)
 *   ember_ram_hide ×2 + bone_needle    ×1 → miner_gloves      (lvl 3,  8 s, 20 xp)
 *
 * The caller (App.tsx) owns the level check, timed session, item swap, and XP
 * grant.  This module provides the data, station visual, and helpers.
 */

import * as THREE from 'three'
import type { Interactable } from './interactable'
import { useGameStore } from '../store/useGameStore'

// ─── Recipe configuration ─────────────────────────────────────────────────

/** Primary material IDs accepted by the sewing table. */
export type TailorMaterialId =
  | 'hushfang_hide'
  | 'thornling_hide'
  | 'ember_ram_hide'
  | 'char_pad'

/** Union of every tailoring output ID. */
export type TailorOutputId =
  | 'hide_bracers'
  | 'hide_hood'
  | 'hide_leggings'
  | 'hide_jerkin'
  | 'patchplate_coif'
  | 'patchplate_vest'
  | 'gatherer_wraps'
  | 'woodcutter_smock'
  | 'miner_gloves'

export interface TailorRecipeConfig {
  /** Human-readable label for notifications. */
  label: string
  /** Registry ID of the primary material consumed. */
  materialId: TailorMaterialId
  /** How many primary material units are consumed per craft. */
  materialQty: number
  /**
   * Secondary ingredient required alongside the primary material.
   * The sewing table always requires two distinct materials to operate —
   * a hide body and a needle or binding to join the seams.
   */
  secondaryIngredient: { id: string; qty: number; label: string }
  /** Registry ID of the output item produced. */
  outputId: TailorOutputId
  /** Minimum Tailoring level required. */
  levelReq: number
  /** Seconds the player must stand at the table to complete the stitch. */
  tailorDuration: number
  /** Tailoring XP awarded on a successful craft. */
  xp: number
}

export const TAILOR_RECIPE_CONFIG: Readonly<Record<TailorOutputId, TailorRecipeConfig>> = {
  // ── Utility Clothing ──────────────────────────────────────────────────
  // Low-level entry recipes so any player can start using the sewing table.
  gatherer_wraps: {
    label: "Gatherer's Wraps",
    materialId: 'thornling_hide',
    materialQty: 2,
    secondaryIngredient: { id: 'bone_needle', qty: 1, label: 'Bone Needle' },
    outputId: 'gatherer_wraps',
    levelReq: 1,
    tailorDuration: 6,
    xp: 12,
  },

  // ── Hide Armor Route ──────────────────────────────────────────────────
  hide_bracers: {
    label: 'Hide Bracers',
    materialId: 'hushfang_hide',
    materialQty: 2,
    secondaryIngredient: { id: 'bone_needle', qty: 1, label: 'Bone Needle' },
    outputId: 'hide_bracers',
    levelReq: 1,
    tailorDuration: 7,
    xp: 15,
  },

  hide_hood: {
    label: 'Hide Hood',
    materialId: 'hushfang_hide',
    materialQty: 2,
    secondaryIngredient: { id: 'bone_needle', qty: 1, label: 'Bone Needle' },
    outputId: 'hide_hood',
    levelReq: 2,
    tailorDuration: 8,
    xp: 18,
  },

  woodcutter_smock: {
    label: "Woodcutter's Smock",
    materialId: 'thornling_hide',
    materialQty: 3,
    secondaryIngredient: { id: 'rough_binding', qty: 1, label: 'Rough Binding' },
    outputId: 'woodcutter_smock',
    levelReq: 2,
    tailorDuration: 8,
    xp: 16,
  },

  hide_leggings: {
    label: 'Hide Leggings',
    materialId: 'hushfang_hide',
    materialQty: 3,
    secondaryIngredient: { id: 'rough_binding', qty: 1, label: 'Rough Binding' },
    outputId: 'hide_leggings',
    levelReq: 2,
    tailorDuration: 9,
    xp: 21,
  },

  miner_gloves: {
    label: "Miner's Gloves",
    materialId: 'ember_ram_hide',
    materialQty: 2,
    secondaryIngredient: { id: 'bone_needle', qty: 1, label: 'Bone Needle' },
    outputId: 'miner_gloves',
    levelReq: 3,
    tailorDuration: 8,
    xp: 20,
  },

  hide_jerkin: {
    label: 'Hide Jerkin',
    materialId: 'hushfang_hide',
    materialQty: 3,
    secondaryIngredient: { id: 'rough_binding', qty: 2, label: 'Rough Binding' },
    outputId: 'hide_jerkin',
    levelReq: 3,
    tailorDuration: 10,
    xp: 24,
  },

  // ── Patchplate Upgrades ───────────────────────────────────────────────
  patchplate_coif: {
    label: 'Patchplate Coif',
    materialId: 'char_pad',
    materialQty: 1,
    secondaryIngredient: { id: 'hide_wrap', qty: 1, label: 'Hide Wrap' },
    outputId: 'patchplate_coif',
    levelReq: 4,
    tailorDuration: 10,
    xp: 28,
  },

  patchplate_vest: {
    label: 'Patchplate Vest',
    materialId: 'char_pad',
    materialQty: 2,
    secondaryIngredient: { id: 'rough_binding', qty: 2, label: 'Rough Binding' },
    outputId: 'patchplate_vest',
    levelReq: 5,
    tailorDuration: 12,
    xp: 32,
  },
} as const

/**
 * Display order for the sewing-table recipe list.
 * Sorted by level requirement ascending so the panel reads like a progression ladder.
 */
const TAILOR_DISPLAY_ORDER: TailorOutputId[] = [
  'gatherer_wraps',
  'hide_bracers',
  'hide_hood',
  'woodcutter_smock',
  'hide_leggings',
  'miner_gloves',
  'hide_jerkin',
  'patchplate_coif',
  'patchplate_vest',
]

// ─── Sewing table station type ────────────────────────────────────────────

/** Represents the single sewing table placed in the Hushwood settlement. */
export interface SewingTableStation {
  /** Unique identifier. */
  id: string
  /** Root Three.js group for the sewing table visual. */
  mesh: THREE.Group
  /** Interactable descriptor registered in the shared array. */
  interactable: Interactable
}

// ─── Visual builder ───────────────────────────────────────────────────────

/** Build the sewing table mesh — a compact worktop draped with a fabric remnant. */
function _buildSewingTableMesh(): THREE.Group {
  const group = new THREE.Group()

  const matWood    = new THREE.MeshStandardMaterial({ color: 0x7a5c3a, roughness: 0.80 })
  const matDark    = new THREE.MeshStandardMaterial({ color: 0x4a3218, roughness: 0.88 })
  const matCloth   = new THREE.MeshStandardMaterial({ color: 0x8b6f47, roughness: 0.95 })
  const matIron    = new THREE.MeshStandardMaterial({ color: 0x888078, roughness: 0.55, metalness: 0.45 })
  const matThread  = new THREE.MeshStandardMaterial({ color: 0xc8a060, roughness: 0.9 })

  // Tabletop
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.07, 0.5), matWood)
  top.position.set(0, 0.82, 0)
  group.add(top)

  // Four legs
  const legGeom = new THREE.BoxGeometry(0.07, 0.78, 0.07)
  const legPositions: [number, number, number][] = [
    [ 0.44, 0.41,  0.20],
    [-0.44, 0.41,  0.20],
    [ 0.44, 0.41, -0.20],
    [-0.44, 0.41, -0.20],
  ]
  for (const [x, y, z] of legPositions) {
    const leg = new THREE.Mesh(legGeom, matDark)
    leg.position.set(x, y, z)
    group.add(leg)
  }

  // Cross-brace between legs
  const brace = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.04, 0.04), matDark)
  brace.position.set(0, 0.22, 0)
  group.add(brace)

  // Fabric remnant draped over the left half of the table
  const cloth = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.015, 0.44), matCloth)
  cloth.position.set(-0.24, 0.862, 0)
  group.add(cloth)

  // Small iron needle-frame resting on the right half
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.04, 0.18), matIron)
  frame.position.set(0.3, 0.862, 0.02)
  group.add(frame)

  // Thread spool standing on the frame
  const spool = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.1, 8), matThread)
  spool.position.set(0.3, 0.92, 0.02)
  group.add(spool)

  // Warm amber work-light over the table
  const light = new THREE.PointLight(0xffd080, 1.2, 4.5)
  light.position.set(0, 1.55, 0)
  group.add(light)

  return group
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Spawn the Hushwood sewing table, register its interactable, and return the
 * station descriptor.
 *
 * The station is placed at (−4, 0, 9) — west side of the settlement commons,
 * symmetrically opposite the furnace at (+4, 0, 9).
 *
 * @param scene         Three.js scene to add the mesh to.
 * @param interactables Mutable array; the station's interactable is appended.
 * @param onTailorStart Called when the player interacts with the table.
 */
export function buildSewingTableStation(
  scene: THREE.Scene,
  interactables: Interactable[],
  onTailorStart: () => void,
): SewingTableStation {
  const mesh = _buildSewingTableMesh()
  mesh.position.set(-4, 0, 9)
  scene.add(mesh)

  const interactable: Interactable = {
    mesh,
    label: 'Sewing Table',
    interactRadius: 2.0,
    onInteract: onTailorStart,
  }
  interactables.push(interactable)

  return { id: 'sewing_table_station_0', mesh, interactable }
}

/**
 * Return every tailoring recipe in display order.  Used by TailoringPanel to
 * always show the full recipe list.
 */
export function getAllTailorRecipes(): TailorRecipeConfig[] {
  return TAILOR_DISPLAY_ORDER.map((id) => TAILOR_RECIPE_CONFIG[id])
}

/**
 * Return the player's current Tailoring skill level from the global store.
 * Returns 1 when the skill is not yet initialised.
 */
export function getTailoringLevel(): number {
  const { skills } = useGameStore.getState()
  return skills.skills.find((s) => s.id === 'tailoring')?.level ?? 1
}

/**
 * Scan the player's inventory for the first recipe whose primary and
 * secondary ingredient requirements are both satisfied (by quantity).
 * Recipes are checked in display order.  Returns the matching recipe
 * config or null when no fully-satisfiable recipe is available.
 *
 * Note: this does **not** enforce level requirements — the caller is
 * responsible for checking `recipe.levelReq` against `getTailoringLevel()`.
 */
export function findTailorableMaterial(
  slots: ReadonlyArray<{ id: string; quantity: number }>,
): TailorRecipeConfig | null {
  for (const id of TAILOR_DISPLAY_ORDER) {
    const cfg = TAILOR_RECIPE_CONFIG[id]
    const primary = slots.find((s) => s.id === cfg.materialId)
    if (!primary || primary.quantity < cfg.materialQty) continue
    const secondary = slots.find((s) => s.id === cfg.secondaryIngredient.id)
    if (!secondary || secondary.quantity < cfg.secondaryIngredient.qty) continue
    return cfg
  }
  return null
}
