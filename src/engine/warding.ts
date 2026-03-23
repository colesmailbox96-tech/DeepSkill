/**
 * Phase 46 — Warding Skill Foundation
 * Phase 66 — Salvage System: vault_seal_ward added.
 * Phase 81 — Advanced Warding Content: ember_ward_seal, deep_ruin_ward,
 *             shatterglass_ward.  Anti-wisp ward repel.  Area-clearing seal.
 *
 * Adds an occult utility skill to Veilmarch.  A warding altar is placed in
 * the Hushwood settlement; players interact with it (or press G while nearby)
 * to open the Warding Panel, then craft a ward mark.
 *
 * Warding covers several use cases:
 *   1. Environmental protection — Ashwillow Ward: guards against mist seep.
 *   2. Creature deterrence   — Thornward Mark: unsettles hostile creatures.
 *   3. Ruin spirit deterrence — Vault Seal Ward: bars lesser spirits. [P66]
 *   4. Anti-wisp seal        — Ember Ward Seal: repels Chapel Wisps. [P81]
 *   5. Area-clearing seal    — Deep Ruin Ward: forces nearby creatures to
 *                              flee when activated.  [P81]
 *   6. Hazard protection     — Shatterglass Ward: guards against the deep
 *                              glass haze of the Belowglass inner vault. [P81]
 *
 * Ward mark recipes:
 *   ashwood_log      ×2 → ashwillow_ward    (lvl 1, 12 s, 14 xp)
 *   reed_fiber       ×3 → thornward_mark    (lvl 2, 15 s, 18 xp)
 *   vault_seal_wax   ×2 → vault_seal_ward   (lvl 3, 18 s, 24 xp) [Phase 66]
 *   wisp_ember       ×2 → ember_ward_seal   (lvl 4, 20 s, 30 xp) [Phase 81]
 *   construct_plating×1 → deep_ruin_ward    (lvl 5, 24 s, 36 xp) [Phase 81]
 *   vault_glass_shard×3 → shatterglass_ward (lvl 6, 28 s, 42 xp) [Phase 81]
 *
 * The caller (App.tsx) owns the level check, timed session, item swap, and XP
 * grant.  This module provides the data, station visual, and helpers.
 */

import * as THREE from 'three'
import type { Interactable } from './interactable'
import { useGameStore } from '../store/useGameStore'

// ─── Recipe configuration ─────────────────────────────────────────────────

/** All warding material IDs. */
export type WardableId =
  | 'ashwood_log'
  | 'reed_fiber'
  | 'vault_seal_wax'
  | 'wisp_ember'
  | 'construct_plating'
  | 'vault_glass_shard'

/** Union of every ward mark output ID. */
export type WardOutputId =
  | 'ashwillow_ward'
  | 'thornward_mark'
  | 'vault_seal_ward'
  | 'ember_ward_seal'
  | 'deep_ruin_ward'
  | 'shatterglass_ward'

export interface WardRecipeConfig {
  /** Human-readable label for notifications and the panel. */
  label: string
  /** Registry ID of the primary material consumed. */
  materialId: WardableId
  /** How many material units are consumed per ward. */
  materialQty: number
  /** Registry ID of the output item produced. */
  outputId: WardOutputId
  /** Minimum Warding level required. */
  levelReq: number
  /** Seconds the player must stand at the altar to complete the ward mark. */
  wardDuration: number
  /** Warding XP awarded on a successful mark inscription. */
  xp: number
  /** Short description of the ward's protective purpose, shown in the panel. */
  effectHint: string
}

export const WARD_RECIPE_CONFIG: Readonly<Record<WardOutputId, WardRecipeConfig>> = {
  ashwillow_ward: {
    label: 'Ashwillow Ward',
    materialId: 'ashwood_log',
    materialQty: 2,
    outputId: 'ashwillow_ward',
    levelReq: 1,
    wardDuration: 12,
    xp: 14,
    effectHint: 'Environmental protection',
  },
  thornward_mark: {
    label: 'Thornward Mark',
    materialId: 'reed_fiber',
    materialQty: 3,
    outputId: 'thornward_mark',
    levelReq: 2,
    wardDuration: 15,
    xp: 18,
    effectHint: 'Creature deterrence',
  },

  // Phase 66 — Salvage System: vault seal wax from the Hollow Vault used as
  // a binding medium for a stronger ward pattern.  The residual protective
  // intention locked inside the wax amplifies the inscription, producing a
  // seal effective against lesser spirits and ruin creatures.
  vault_seal_ward: {
    label: 'Vault Seal Ward',
    materialId: 'vault_seal_wax',
    materialQty: 2,
    outputId: 'vault_seal_ward',
    levelReq: 3,
    wardDuration: 18,
    xp: 24,
    effectHint: 'Ruin spirit deterrence',
  },

  // Phase 81 — Advanced Warding Content.

  // Ember Ward Seal: inscribed using the cold-light embers shed by Chapel
  // Wisps.  The latent mist-energy crystallised in each ember is redirected
  // outward, creating a pattern that wisps instinctively recoil from.
  ember_ward_seal: {
    label: 'Ember Ward Seal',
    materialId: 'wisp_ember',
    materialQty: 2,
    outputId: 'ember_ward_seal',
    levelReq: 4,
    wardDuration: 20,
    xp: 30,
    effectHint: 'Anti-wisp seal; repels Chapel Wisps',
  },

  // Deep Ruin Ward: bound with construct plating's residual mechanoresonance.
  // When activated at a ruin threshold, the ward pulses outward and forces
  // nearby hostile creatures to flee — an area-clearing seal.
  deep_ruin_ward: {
    label: 'Deep Ruin Ward',
    materialId: 'construct_plating',
    materialQty: 1,
    outputId: 'deep_ruin_ward',
    levelReq: 5,
    wardDuration: 24,
    xp: 36,
    effectHint: 'Area-clearing seal; use to repel all nearby creatures',
  },

  // Shatterglass Ward: the vault glass shard matrix holds a permanent
  // refractive resonance that counters the deep glass haze filling the
  // inner Belowglass vault halls.
  shatterglass_ward: {
    label: 'Shatterglass Ward',
    materialId: 'vault_glass_shard',
    materialQty: 3,
    outputId: 'shatterglass_ward',
    levelReq: 6,
    wardDuration: 28,
    xp: 42,
    effectHint: 'Belowglass deep-glass-haze protection',
  },
} as const

/**
 * Priority order used by findWardableMaterial() and getAllWardRecipes().
 * Typed as `WardOutputId[]` so the compiler catches any key mismatch with
 * `WARD_RECIPE_CONFIG`.
 */
const WARD_DISPLAY_ORDER: WardOutputId[] = [
  'ashwillow_ward',
  'thornward_mark',
  'vault_seal_ward',
  'ember_ward_seal',
  'deep_ruin_ward',
  'shatterglass_ward',
]

// ─── Interact radius ──────────────────────────────────────────────────────

/** Maximum distance at which the player can use the warding altar. */
export const WARDING_ALTAR_INTERACT_RADIUS = 2.0

// ─── Warding altar station type ───────────────────────────────────────────

/** Represents the single warding altar placed in the Hushwood settlement. */
export interface WardingAltarStation {
  /** Unique identifier. */
  id: string
  /** Root Three.js group for the altar visual. */
  mesh: THREE.Group
  /** Interactable descriptor registered in the shared array. */
  interactable: Interactable
}

// ─── Visual builder ───────────────────────────────────────────────────────

/** Build the warding altar mesh — a low stone plinth with carved glyphs. */
function _buildWardingAltarMesh(): THREE.Group {
  const group = new THREE.Group()

  const matStone  = new THREE.MeshStandardMaterial({ color: 0x5a5760, roughness: 0.88 })
  const matDark   = new THREE.MeshStandardMaterial({ color: 0x35303a, roughness: 0.9 })
  const matGlyph  = new THREE.MeshStandardMaterial({ color: 0x8a5fc7, roughness: 0.5, emissive: new THREE.Color(0x3a1a6a), emissiveIntensity: 0.55 })
  const matCandle = new THREE.MeshStandardMaterial({ color: 0xe8d8a0, roughness: 0.7 })
  const matFlame  = new THREE.MeshStandardMaterial({ color: 0xffa030, roughness: 0.3, emissive: new THREE.Color(0xdd6010), emissiveIntensity: 1.2 })

  // Base plinth
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.18, 0.9), matDark)
  base.position.set(0, 0.09, 0)
  group.add(base)

  // Middle column
  const column = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.48, 0.72), matStone)
  column.position.set(0, 0.42, 0)
  group.add(column)

  // Top slab
  const slab = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.1, 0.82), matStone)
  slab.position.set(0, 0.71, 0)
  group.add(slab)

  // Carved glyph disc inset on the top slab surface
  const glyphDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.02, 16), matGlyph)
  glyphDisc.position.set(0, 0.77, 0)
  group.add(glyphDisc)

  // Four corner stones around the base
  const cornerGeom = new THREE.BoxGeometry(0.12, 0.22, 0.12)
  const cornerOffsets: [number, number][] = [
    [ 0.44,  0.44],
    [-0.44,  0.44],
    [ 0.44, -0.44],
    [-0.44, -0.44],
  ]
  for (const [x, z] of cornerOffsets) {
    const corner = new THREE.Mesh(cornerGeom, matDark)
    corner.position.set(x, 0.11, z)
    group.add(corner)
  }

  // Two small candles on the slab
  const candleGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.14, 6)
  const flameGeom  = new THREE.ConeGeometry(0.025, 0.07, 6)
  const candlePositions: [number, number][] = [[-0.22, 0.0], [0.22, 0.0]]
  for (const [cx, cz] of candlePositions) {
    const candle = new THREE.Mesh(candleGeom, matCandle)
    candle.position.set(cx, 0.83, cz)
    group.add(candle)
    const flame = new THREE.Mesh(flameGeom, matFlame)
    flame.position.set(cx, 0.945, cz)
    group.add(flame)
  }

  // Soft violet glow from the altar
  const light = new THREE.PointLight(0xb070e0, 1.2, 5)
  light.position.set(0, 1.4, 0)
  group.add(light)

  return group
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Spawn the Hushwood warding altar station, register its interactable,
 * and return the station descriptor.
 *
 * The altar is placed at (-4, 0, 18) — north-west of the settlement, near
 * the treeline, a natural spot for hedge-ritual work away from the forge.
 *
 * @param scene         Three.js scene to add the mesh to.
 * @param interactables Mutable array; the station's interactable is appended.
 * @param onWardStart   Called when the player interacts with the altar.
 */
export function buildWardingAltarStation(
  scene: THREE.Scene,
  interactables: Interactable[],
  onWardStart: () => void,
): WardingAltarStation {
  const mesh = _buildWardingAltarMesh()
  mesh.position.set(-4, 0, 18)
  scene.add(mesh)

  const interactable: Interactable = {
    mesh,
    label: 'Warding Altar',
    interactRadius: WARDING_ALTAR_INTERACT_RADIUS,
    onInteract: onWardStart,
  }
  interactables.push(interactable)

  return { id: 'warding_altar_station_0', mesh, interactable }
}

/**
 * Return every ward recipe in display order.  Used by WardingPanel to
 * always show the full recipe list.
 */
export function getAllWardRecipes(): WardRecipeConfig[] {
  return WARD_DISPLAY_ORDER.map((id) => WARD_RECIPE_CONFIG[id])
}

/**
 * Return the player's current Warding skill level from the global store.
 * Returns 1 when the skill is not yet initialised.
 */
export function getWardingLevel(): number {
  const { skills } = useGameStore.getState()
  return skills.skills.find((s) => s.id === 'warding')?.level ?? 1
}

/**
 * Scan the player's inventory for the first recipe whose material requirement
 * is met (by quantity).  Recipes are checked in display order.  Returns the
 * matching recipe config or null when no wardable material is available in
 * sufficient quantity.
 *
 * Note: this does **not** enforce level requirements — the caller is
 * responsible for checking `recipe.levelReq` against `getWardingLevel()`.
 */
export function findWardableMaterial(
  slots: ReadonlyArray<{ id: string; quantity: number }>,
): WardRecipeConfig | null {
  for (const id of WARD_DISPLAY_ORDER) {
    const cfg = WARD_RECIPE_CONFIG[id]
    const slot = slots.find((s) => s.id === cfg.materialId)
    if (slot && slot.quantity >= cfg.materialQty) {
      return cfg
    }
  }
  return null
}

// ─── Phase 81 — Area-clearing seal constants ──────────────────────────────

/**
 * The item ID of the area-clearing seal produced in Phase 81.
 * When the player activates (uses) this item from their inventory all
 * hostile creatures within DEEP_RUIN_WARD_CLEAR_RADIUS are forced to flee.
 */
export const DEEP_RUIN_WARD_ITEM_ID = 'deep_ruin_ward'

/**
 * Radius (metres) within which hostile creatures are forced to flee when
 * a Deep Ruin Ward is activated.
 */
export const DEEP_RUIN_WARD_CLEAR_RADIUS = 14

/**
 * The item ID of the anti-wisp ward produced in Phase 81.  When carried,
 * Chapel Wisps treat the player as a repelling source and flee on approach.
 */
export const EMBER_WARD_SEAL_ITEM_ID = 'ember_ward_seal'

/**
 * Range (metres) within which Chapel Wisps are repelled while the player
 * carries an Ember Ward Seal.
 */
export const EMBER_WARD_REPEL_RADIUS = 10
