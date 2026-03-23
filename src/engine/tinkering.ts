/**
 * Phase 43 — Tinkering Skill Foundation
 * Phase 58 — Dusk Lens Mount added.
 * Phase 62 — Creature Loot Expansion: sealing_pitch, hide_wrap, char_pad added.
 * Phase 66 — Salvage System: vault_mortar, relic_rivet added.
 * Phase 68 — Light and Visibility Mechanics: hollow_lantern added.
 *
 * Provides a tinkerer's bench station and the assembly interface for
 * Veilmarch.  A single bench is placed in the Hushwood settlement; players
 * interact with it to assemble refined metals and worked wood into utility
 * devices.
 *
 * Tinkering recipes:
 *   copper_bar          ×2 → lantern_parts    (lvl 1,  8 s, 12 xp)
 *   iron_bar            ×1 → reinforced_hook  (lvl 2,  6 s, 15 xp)
 *   ashwood_shaft       ×2 → bait_basket      (lvl 3,  9 s, 18 xp)
 *   iron_bar            ×2 → repair_clamp     (lvl 4, 10 s, 22 xp)
 *   duskiron_bar    ×1 + marsh_glass_reed ×2 → dusk_lens_mount (lvl 8, 12 s, 38 xp) [Phase 58]
 *   copper_bar      ×1 + resinous_organ   ×2 → sealing_pitch   (lvl 5, 10 s, 26 xp) [Phase 62]
 *   iron_bar        ×1 + hushfang_hide    ×2 → hide_wrap        (lvl 6, 11 s, 30 xp) [Phase 62]
 *   iron_bar        ×1 + ember_ram_hide   ×2 → char_pad         (lvl 7, 12 s, 34 xp) [Phase 62]
 *   crumbled_masonry×2                       → vault_mortar     (lvl 5, 11 s, 28 xp) [Phase 66]
 *   iron_relic_fragment×1                    → relic_rivet      (lvl 6, 14 s, 32 xp) [Phase 66]
 *   lantern_parts×1 + vault_seal_wax×1       → hollow_lantern   (lvl 3, 12 s, 22 xp) [Phase 68]
 *
 * The caller (App.tsx) owns the level check, timed session, item swap, and XP
 * grant.  This module provides the data, station visual, and helpers.
 */

import * as THREE from 'three'
import type { Interactable } from './interactable'
import { useGameStore } from '../store/useGameStore'

// ─── Recipe configuration ─────────────────────────────────────────────────

/** All tinkerable material IDs. */
export type TinkerableId = 'copper_bar' | 'iron_bar' | 'ashwood_shaft' | 'duskiron_bar' | 'crumbled_masonry' | 'iron_relic_fragment' | 'lantern_parts'

/** Union of every tinkering output ID. */
export type TinkerOutputId = 'lantern_parts' | 'reinforced_hook' | 'bait_basket' | 'repair_clamp' | 'dusk_lens_mount' | 'sealing_pitch' | 'hide_wrap' | 'char_pad' | 'vault_mortar' | 'relic_rivet' | 'hollow_lantern'

export interface TinkerRecipeConfig {
  /** Human-readable label for notifications. */
  label: string
  /** Registry ID of the primary material consumed. */
  materialId: TinkerableId
  /** How many material units are consumed per tinker. */
  materialQty: number
  /**
   * Optional secondary ingredient required in addition to the primary material.
   * When present, both the primary and secondary must be in the player's
   * inventory before assembly can start.
   */
  secondaryIngredient?: { id: string; qty: number; label: string }
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
  // Phase 58 — Dusk Lens Mount: a precision duskiron ring fitted with a
  // faceted marsh glass reed lens, used in advanced optical and surveying
  // instruments.  Requires both duskiron_bar (frame) and marsh_glass_reed (lens).
  dusk_lens_mount: {
    label: 'Dusk Lens Mount',
    materialId: 'duskiron_bar',
    materialQty: 1,
    secondaryIngredient: { id: 'marsh_glass_reed', qty: 2, label: 'Marsh Glass Reed' },
    outputId: 'dusk_lens_mount',
    levelReq: 8,
    tinkerDuration: 12,
    xp: 38,
  },
  // Phase 62 — Creature Loot Expansion: three new tinkering recipes that
  // consume creature-dropped materials, connecting combat to the crafting economy.

  // Sealing Pitch: copper plate pressed against resinous organs to cure a
  // waterproof adhesive disc.  Used in lanterns, containers, and joins.
  sealing_pitch: {
    label: 'Sealing Pitch',
    materialId: 'copper_bar',
    materialQty: 1,
    secondaryIngredient: { id: 'resinous_organ', qty: 2, label: 'Resinous Organ' },
    outputId: 'sealing_pitch',
    levelReq: 5,
    tinkerDuration: 10,
    xp: 26,
  },

  // Hide Wrap: layers of Hushfang hide stitched around an iron backing strip.
  // A padded panel used in armour linings and weapon grips.
  hide_wrap: {
    label: 'Hide Wrap',
    materialId: 'iron_bar',
    materialQty: 1,
    secondaryIngredient: { id: 'hushfang_hide', qty: 2, label: 'Hushfang Hide' },
    outputId: 'hide_wrap',
    levelReq: 6,
    tinkerDuration: 11,
    xp: 30,
  },

  // Char Pad: thick Ember Ram hide bonded to an iron backing and hardened by
  // residual mineral heat.  A primary impact-buffer component for mid-tier armour.
  char_pad: {
    label: 'Char Pad',
    materialId: 'iron_bar',
    materialQty: 1,
    secondaryIngredient: { id: 'ember_ram_hide', qty: 2, label: 'Ember Ram Hide' },
    outputId: 'char_pad',
    levelReq: 7,
    tinkerDuration: 12,
    xp: 34,
  },

  // Phase 66 — Salvage System: two new tinkering recipes that consume salvage
  // materials gathered in the Hollow Vault, connecting the new salvaging loop
  // to the broader crafting economy.

  // Vault Mortar: crumbled masonry pulverised and pressed into a bonding compound.
  // Used in structural repairs, sealed joins, and heavy armour construction.
  vault_mortar: {
    label: 'Vault Mortar',
    materialId: 'crumbled_masonry',
    materialQty: 2,
    outputId: 'vault_mortar',
    levelReq: 5,
    tinkerDuration: 11,
    xp: 28,
  },

  // Relic Rivet: worked from a single Iron Relic Fragment into a precision fastener.
  // The pre-Veil iron grain makes these rivets unusually strong for mid-tier assembly.
  relic_rivet: {
    label: 'Relic Rivet',
    materialId: 'iron_relic_fragment',
    materialQty: 1,
    outputId: 'relic_rivet',
    levelReq: 6,
    tinkerDuration: 14,
    xp: 32,
  },

  // Phase 68 — Light and Visibility Mechanics: the Hollow Lantern requires
  // pre-assembled Lantern Parts sealed with Vault Seal Wax so the reservoir
  // holds oil in the vault's damp air.
  hollow_lantern: {
    label: 'Hollow Lantern',
    materialId: 'lantern_parts',
    materialQty: 1,
    secondaryIngredient: { id: 'vault_seal_wax', qty: 1, label: 'Vault Seal Wax' },
    outputId: 'hollow_lantern',
    levelReq: 3,
    tinkerDuration: 12,
    xp: 22,
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
  'sealing_pitch',
  'hide_wrap',
  'char_pad',
  'vault_mortar',
  'relic_rivet',
  'hollow_lantern',
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
 * is met (by quantity), including any secondary ingredient when the recipe
 * requires one.  Recipes are checked in display order.  Returns the matching
 * recipe config or null when no fully-satisfiable recipe is available.
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
    if (!slot || slot.quantity < cfg.materialQty) continue
    // When a secondary ingredient is required, verify it is also present.
    if (cfg.secondaryIngredient) {
      const sec = slots.find((s) => s.id === cfg.secondaryIngredient!.id)
      if (!sec || sec.quantity < cfg.secondaryIngredient.qty) continue
    }
    return cfg
  }
  return null
}
