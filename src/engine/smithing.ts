/**
 * Phase 40 — Smithing Foundation
 * Phase 79 — Advanced Smithing and Alloy Routes
 *
 * Provides the forging furnace engine for Veilmarch.  A single furnace station
 * is placed in the Hushwood settlement; players interact with it to smelt raw
 * ore into metal bars that feed higher-tier crafting.
 *
 * Smelt recipes (ore → bar):
 *   copper_ore ×3  → copper_bar  (lvl 1, 4 s, 15 xp)
 *   iron_ore   ×4  → iron_bar    (lvl 5, 6 s, 30 xp)
 *   duskiron_ore ×5 → duskiron_bar (lvl 10, 8 s, 45 xp)
 *
 * Alloy recipes (multi-material → bar/ingot):
 *   duskiron_bar ×3 + bogfiend_scale ×4 → fensteel_bar    (lvl 14, 12 s, 80 xp)
 *   vault_glass_shard ×3 + iron_bar ×1  → vaultglass_fitting (lvl 12, 10 s, 65 xp)
 *   fensteel_bar ×2 + construct_plating ×2 → heartwrought_ingot (lvl 16, 15 s, 100 xp)
 *
 * The caller (App.tsx) owns the level check, timed session, item swap, and XP
 * grant.  This module provides the data, station visual, and helpers.
 */

import * as THREE from 'three'
import type { Interactable } from './interactable'
import { useGameStore } from '../store/useGameStore'

// ─── Recipe configuration ─────────────────────────────────────────────────

/** All smeltable ore IDs. */
export type SmeltableId = 'copper_ore' | 'iron_ore' | 'duskiron_ore'

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
  // Phase 58 — Duskiron Ore: dense advanced ore from the Ashfen Copse.
  // Requires level 10 Forging and consumes 5 ore per bar.
  duskiron_ore: {
    label: 'Duskiron Ore',
    oreId: 'duskiron_ore',
    oreQty: 5,
    barId: 'duskiron_bar',
    levelReq: 10,
    smeltDuration: 8,
    xp: 45,
  },
} as const

/**
 * Priority order used by findSmeltableOre() when the player has multiple
 * smeltable ores — highest-value recipe preferred first.
 */
const SMELT_PRIORITY: SmeltableId[] = ['duskiron_ore', 'iron_ore', 'copper_ore']

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

  const matStone = new THREE.MeshLambertMaterial({ color: 0x706860 })
  const matBrick = new THREE.MeshLambertMaterial({ color: 0x8b4513 })
  const matGlow  = new THREE.MeshBasicMaterial({ color: 0xff6600 })
  const matChimney = new THREE.MeshLambertMaterial({ color: 0x5a5050 })

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

// ─── Phase 41 — Tool Forge Recipes ───────────────────────────────────────

/** A single ingredient consumed when forging a tool. */
export interface ForgeIngredient {
  /** Registry ID of the item consumed. */
  id: string
  /** Human-readable name (mirrors itemRegistry, kept here for panels). */
  label: string
  /** Quantity consumed per forge. */
  qty: number
}

/**
 * Configuration for a single tool forge recipe.  Tools are crafted at the
 * furnace — the same station used for smelting — but occupy a separate
 * recipe tab and are completed as a single timed session.
 */
export interface ForgeRecipeConfig {
  /** Human-readable name of the output tool. */
  label: string
  /** Registry ID of the tool produced. */
  toolId: string
  /** Tool tier that the produced tool occupies (used by getToolSpeedFactor). */
  toolTier: number
  /** All ingredients consumed during the forge. */
  ingredients: ForgeIngredient[]
  /** Minimum level of the associated gathering skill required to forge. */
  skillReq: { skill: string; level: number }
  /** Minimum Forging level required. */
  forgingLevelReq: number
  /** Seconds at the furnace to complete the forge. */
  forgeDuration: number
  /** Forging XP awarded on completion. */
  xp: number
  /**
   * Speed multiplier applied to gather actions when this tool (or better) is
   * equipped.  1.0 = same as tier 1; 0.75 = 25 % faster; 0.60 = 40 % faster.
   */
  tierSpeedFactor: number
}

/** All tool upgrade forge recipes, in display order. */
export const FORGE_RECIPES: readonly ForgeRecipeConfig[] = [
  {
    label: 'Copper Hatchet',
    toolId: 'copper_hatchet',
    toolTier: 2,
    ingredients: [
      { id: 'copper_bar',  label: 'Copper Bar',  qty: 2 },
      { id: 'ashwood_log', label: 'Ashwood Log', qty: 2 },
    ],
    skillReq: { skill: 'woodcutting', level: 3 },
    forgingLevelReq: 2,
    forgeDuration: 6,
    xp: 25,
    tierSpeedFactor: 0.75,
  },
  {
    label: 'Iron Pick',
    toolId: 'iron_pick',
    toolTier: 2,
    ingredients: [
      { id: 'iron_bar',      label: 'Iron Bar',      qty: 2 },
      { id: 'ironbark_log',  label: 'Ironbark Log',  qty: 1 },
      { id: 'small_stone',   label: 'Small Stone',   qty: 4 },
    ],
    skillReq: { skill: 'mining', level: 5 },
    forgingLevelReq: 7,
    forgeDuration: 8,
    xp: 40,
    tierSpeedFactor: 0.75,
  },
  {
    label: 'Reinforced Rod',
    toolId: 'reinforced_rod',
    toolTier: 2,
    ingredients: [
      { id: 'copper_bar', label: 'Copper Bar', qty: 1 },
      { id: 'reed_fiber', label: 'Reed Fiber', qty: 3 },
    ],
    skillReq: { skill: 'fishing', level: 3 },
    forgingLevelReq: 2,
    forgeDuration: 5,
    xp: 20,
    tierSpeedFactor: 0.75,
  },
  // Phase 58 — Duskiron Hatchet: a high-grade cutting tool forged from duskiron
  // bar and reinforced with dense ironbark hafting.  Requires serious skill to
  // wield effectively but chops through even mineralwood with speed.
  {
    label: 'Duskiron Hatchet',
    toolId: 'duskiron_hatchet',
    toolTier: 3,
    ingredients: [
      { id: 'duskiron_bar',  label: 'Duskiron Bar',  qty: 2 },
      { id: 'ironbark_log',  label: 'Ironbark Log',  qty: 2 },
    ],
    skillReq: { skill: 'woodcutting', level: 8 },
    forgingLevelReq: 10,
    forgeDuration: 10,
    xp: 60,
    tierSpeedFactor: 0.60,
  },
  // Phase 79 — Fensteel tools: tier-4 tools forged from fensteel bar and
  // vaultglass fittings.  Faster and longer-lasting than anything in tier 3.
  {
    label: 'Fensteel Hatchet',
    toolId: 'fensteel_hatchet',
    toolTier: 4,
    ingredients: [
      { id: 'fensteel_bar',       label: 'Fensteel Bar',       qty: 2 },
      { id: 'vaultglass_fitting', label: 'Vaultglass Fitting', qty: 1 },
      { id: 'ironbark_log',       label: 'Ironbark Log',       qty: 2 },
    ],
    skillReq: { skill: 'woodcutting', level: 10 },
    forgingLevelReq: 14,
    forgeDuration: 14,
    xp: 100,
    tierSpeedFactor: 0.50,
  },
  {
    label: 'Fensteel Pick',
    toolId: 'fensteel_pick',
    toolTier: 4,
    ingredients: [
      { id: 'fensteel_bar',       label: 'Fensteel Bar',       qty: 2 },
      { id: 'vaultglass_fitting', label: 'Vaultglass Fitting', qty: 1 },
      { id: 'small_stone',        label: 'Small Stone',        qty: 4 },
    ],
    skillReq: { skill: 'mining', level: 10 },
    forgingLevelReq: 14,
    forgeDuration: 14,
    xp: 100,
    tierSpeedFactor: 0.50,
  },
] as const

/**
 * Return every forge recipe.  Used by SmithingPanel to render the Forge tab.
 */
export function getAllForgeRecipes(): ForgeRecipeConfig[] {
  return [...FORGE_RECIPES]
}

/**
 * Return the gather-speed multiplier that applies at the given tool tier.
 * Tier 1 (starter tools) → 1.0 (no bonus).
 * Higher tiers → the best (lowest) `tierSpeedFactor` among all forge recipes
 * whose `toolTier` is less than or equal to the player's current tier.
 * Falls back to 1.0 when tier < 2 or no matching recipe is found.
 */
export function getToolSpeedFactor(tier: number): number {
  if (tier < 2) return 1.0
  let best = 1.0
  for (const recipe of FORGE_RECIPES) {
    if (recipe.toolTier <= tier && recipe.tierSpeedFactor < best) {
      best = recipe.tierSpeedFactor
    }
  }
  return best
}

/**
 * Check whether the player currently has enough materials in their inventory
 * to forge the given recipe.  Does **not** check skill or forging-level
 * requirements — the caller is responsible for those checks.
 */
export function hasIngredientsFor(
  recipe: ForgeRecipeConfig,
  slots: ReadonlyArray<{ id: string; quantity: number }>,
): boolean {
  return recipe.ingredients.every((ing) => {
    const slot = slots.find((s) => s.id === ing.id)
    return slot != null && slot.quantity >= ing.qty
  })
}

// ─── Phase 79 — Alloy Recipes ─────────────────────────────────────────────

/**
 * Configuration for a single alloy recipe.  Alloy routes combine multiple
 * processed materials at the furnace into a new bar or ingot.  Unlike
 * simple smelt recipes (single ore → bar), alloy recipes can consume any
 * combination of bars, creature drops, and salvaged components.
 *
 * The panel renders these in a third "Alloy" tab alongside Smelt and Forge.
 */
export interface AlloyRecipeConfig {
  /** Human-readable name of the output material. */
  label: string
  /** Registry ID of the produced bar or ingot. */
  outputId: string
  /** All ingredients consumed per batch. */
  ingredients: ForgeIngredient[]
  /** Minimum Forging level required. */
  forgingLevelReq: number
  /** Seconds at the furnace to complete the alloy. */
  alloyDuration: number
  /** Forging XP awarded on completion. */
  xp: number
}

/** All alloy fusion recipes, in display order (lowest level first). */
export const ALLOY_RECIPES: readonly AlloyRecipeConfig[] = [
  // Vaultglass Fitting: vault-glass shards rebound with iron into a precision
  // component used in high-tier tool cutting edges.
  {
    label: 'Vaultglass Fitting',
    outputId: 'vaultglass_fitting',
    ingredients: [
      { id: 'vault_glass_shard', label: 'Vault Glass Shard', qty: 3 },
      { id: 'iron_bar',          label: 'Iron Bar',          qty: 1 },
    ],
    forgingLevelReq: 12,
    alloyDuration: 10,
    xp: 65,
  },
  // Fensteel Bar: duskiron tempered with bogfiend essence — flexible and dense,
  // the primary structural material for tier-4 tools.
  {
    label: 'Fensteel Bar',
    outputId: 'fensteel_bar',
    ingredients: [
      { id: 'duskiron_bar',   label: 'Duskiron Bar',   qty: 3 },
      { id: 'bogfiend_scale', label: 'Bogfiend Scale', qty: 4 },
    ],
    forgingLevelReq: 14,
    alloyDuration: 12,
    xp: 80,
  },
  // Heartwrought Ingot: the rarest alloy in the Veilmarch tradition — fensteel
  // fused with the residual construct metal recovered from vault plating.
  {
    label: 'Heartwrought Ingot',
    outputId: 'heartwrought_ingot',
    ingredients: [
      { id: 'fensteel_bar',      label: 'Fensteel Bar',      qty: 2 },
      { id: 'construct_plating', label: 'Construct Plating', qty: 2 },
    ],
    forgingLevelReq: 16,
    alloyDuration: 15,
    xp: 100,
  },
] as const

/**
 * Return every alloy recipe.  Used by SmithingPanel to render the Alloy tab.
 */
export function getAllAlloyRecipes(): AlloyRecipeConfig[] {
  return [...ALLOY_RECIPES]
}

/**
 * Check whether the player has enough materials for the given alloy recipe.
 * Does **not** check forging-level requirements.
 */
export function hasIngredientsForAlloy(
  recipe: AlloyRecipeConfig,
  slots: ReadonlyArray<{ id: string; quantity: number }>,
): boolean {
  return recipe.ingredients.every((ing) => {
    const slot = slots.find((s) => s.id === ing.id)
    return slot != null && slot.quantity >= ing.qty
  })
}
