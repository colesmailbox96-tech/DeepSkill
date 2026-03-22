/**
 * Phase 42 — Carving Skill Foundation
 * Phase 62 — Creature Loot Expansion: two new carving recipes added.
 *
 * Provides a carving workbench station and the handheld carving interface for
 * Veilmarch.  A single workbench is placed in the Hushwood settlement; players
 * interact with it to shape raw wood and bone into utility components.
 *
 * Carving recipes:
 *   ashwood_log    ×1 → whittled_peg   (lvl 1, 5 s, 10 xp)
 *   ashwood_log    ×2 → carved_bowl    (lvl 2, 7 s, 15 xp)
 *   ashwood_log    ×2 → ashwood_shaft  (lvl 3, 6 s, 18 xp)
 *   crawler_chitin ×1 → chitin_pin     (lvl 4, 8 s, 20 xp)
 *   thornling_hide ×1 → rough_binding  (lvl 4, 6 s, 16 xp)  [Phase 62]
 *   bone_shard     ×2 → bone_needle    (lvl 5, 8 s, 22 xp)  [Phase 62]
 *
 * The caller (App.tsx) owns the level check, timed session, item swap, and XP
 * grant.  This module provides the data, station visual, and helpers.
 */

import * as THREE from 'three'
import type { Interactable } from './interactable'
import { useGameStore } from '../store/useGameStore'

// ─── Recipe configuration ─────────────────────────────────────────────────

/** All carvable material IDs. */
export type CarvableId = 'ashwood_log' | 'crawler_chitin' | 'thornling_hide' | 'bone_shard'

/** Union of every carving output ID — mirrors `SmeltableId` in smithing.ts. */
export type CarveOutputId = 'whittled_peg' | 'carved_bowl' | 'ashwood_shaft' | 'chitin_pin' | 'rough_binding' | 'bone_needle'

export interface CarveRecipeConfig {
  /** Human-readable label for notifications. */
  label: string
  /** Registry ID of the primary material consumed. */
  materialId: CarvableId
  /** How many material units are consumed per carve. */
  materialQty: number
  /** Registry ID of the output item produced. */
  outputId: CarveOutputId
  /** Minimum Carving level required. */
  levelReq: number
  /** Seconds the player must stand at the workbench to complete the carve. */
  carveDuration: number
  /** Carving XP awarded on a successful carve. */
  xp: number
}

export const CARVE_RECIPE_CONFIG: Readonly<Record<CarveOutputId, CarveRecipeConfig>> = {
  whittled_peg: {
    label: 'Whittled Peg',
    materialId: 'ashwood_log',
    materialQty: 1,
    outputId: 'whittled_peg',
    levelReq: 1,
    carveDuration: 5,
    xp: 10,
  },
  carved_bowl: {
    label: 'Carved Bowl',
    materialId: 'ashwood_log',
    materialQty: 2,
    outputId: 'carved_bowl',
    levelReq: 2,
    carveDuration: 7,
    xp: 15,
  },
  ashwood_shaft: {
    label: 'Ashwood Shaft',
    materialId: 'ashwood_log',
    materialQty: 2,
    outputId: 'ashwood_shaft',
    levelReq: 3,
    carveDuration: 6,
    xp: 18,
  },
  chitin_pin: {
    label: 'Chitin Pin',
    materialId: 'crawler_chitin',
    materialQty: 1,
    outputId: 'chitin_pin',
    levelReq: 4,
    carveDuration: 8,
    xp: 20,
  },
  // Phase 62 — Creature Loot Expansion: new carving recipes for creature drops.
  // rough_binding and bone_needle feed the hide-armour and fine-stitching routes
  // that will be expanded in Phase 63.
  rough_binding: {
    label: 'Rough Binding',
    materialId: 'thornling_hide',
    materialQty: 1,
    outputId: 'rough_binding',
    levelReq: 4,
    carveDuration: 6,
    xp: 16,
  },
  bone_needle: {
    label: 'Bone Needle',
    materialId: 'bone_shard',
    materialQty: 2,
    outputId: 'bone_needle',
    levelReq: 5,
    carveDuration: 8,
    xp: 22,
  },
} as const

/**
 * Priority order used by findCarvableMaterial() and getAllCarveRecipes().
 * Typed as `CarveOutputId[]` so the compiler catches any key mismatch with
 * `CARVE_RECIPE_CONFIG`.
 */
const CARVE_DISPLAY_ORDER: CarveOutputId[] = [
  'whittled_peg',
  'carved_bowl',
  'ashwood_shaft',
  'chitin_pin',
  'rough_binding',
  'bone_needle',
]

// ─── Workbench station type ───────────────────────────────────────────────

/** Represents the single carving workbench placed in the Hushwood settlement. */
export interface WorkbenchStation {
  /** Unique identifier. */
  id: string
  /** Root Three.js group for the workbench visual. */
  mesh: THREE.Group
  /** Interactable descriptor registered in the shared array. */
  interactable: Interactable
}

// ─── Visual builder ───────────────────────────────────────────────────────

/** Build the workbench mesh — a simple wood-plank table with legs and tools. */
function _buildWorkbenchMesh(): THREE.Group {
  const group = new THREE.Group()

  const matWood   = new THREE.MeshStandardMaterial({ color: 0x7a5c3a, roughness: 0.85 })
  const matDark   = new THREE.MeshStandardMaterial({ color: 0x4e3820, roughness: 0.9 })
  const matMetal  = new THREE.MeshStandardMaterial({ color: 0x888070, roughness: 0.6, metalness: 0.4 })

  // Tabletop plank
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.65), matWood)
  top.position.set(0, 0.85, 0)
  group.add(top)

  // Four legs
  const legGeom = new THREE.BoxGeometry(0.08, 0.75, 0.08)
  const legPositions: [number, number, number][] = [
    [ 0.53, 0.425,  0.27],
    [-0.53, 0.425,  0.27],
    [ 0.53, 0.425, -0.27],
    [-0.53, 0.425, -0.27],
  ]
  for (const [x, y, z] of legPositions) {
    const leg = new THREE.Mesh(legGeom, matDark)
    leg.position.set(x, y, z)
    group.add(leg)
  }

  // Cross-brace at the bottom
  const braceH = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.06, 0.06), matDark)
  braceH.position.set(0, 0.22, 0)
  group.add(braceH)

  // Small iron chisel tool resting on the top
  const chisel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.32), matMetal)
  chisel.position.set(0.35, 0.915, 0.05)
  group.add(chisel)

  // Mallet head resting on the top
  const malletHead = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.14), matDark)
  malletHead.position.set(-0.3, 0.96, 0.0)
  group.add(malletHead)

  // Mallet handle
  const malletHandle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.4), matWood)
  malletHandle.position.set(-0.3, 0.915, 0.22)
  group.add(malletHandle)

  // Soft warm ambient light over the bench
  const light = new THREE.PointLight(0xfff0c8, 1.5, 5)
  light.position.set(0, 1.5, 0)
  group.add(light)

  return group
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Spawn the Hushwood carving workbench station, register its interactable,
 * and return the station descriptor.
 *
 * The station is placed at (-4, 0, 9) — west side of the commons, mirroring
 * the furnace on the east side.
 *
 * @param scene         Three.js scene to add the mesh to.
 * @param interactables Mutable array; the station's interactable is appended.
 * @param onCarveStart  Called when the player interacts with the workbench.
 */
export function buildWorkbenchStation(
  scene: THREE.Scene,
  interactables: Interactable[],
  onCarveStart: () => void,
): WorkbenchStation {
  const mesh = _buildWorkbenchMesh()
  mesh.position.set(-4, 0, 9)
  scene.add(mesh)

  const interactable: Interactable = {
    mesh,
    label: 'Workbench',
    interactRadius: 2.0,
    onInteract: onCarveStart,
  }
  interactables.push(interactable)

  return { id: 'workbench_station_0', mesh, interactable }
}

/**
 * Return every carve recipe in display order.  Used by CarvingPanel to
 * always show the full recipe list.
 */
export function getAllCarveRecipes(): CarveRecipeConfig[] {
  return CARVE_DISPLAY_ORDER.map((id) => CARVE_RECIPE_CONFIG[id])
}

/**
 * Return the player's current Carving skill level from the global store.
 * Returns 1 when the skill is not yet initialised.
 */
export function getCarvingLevel(): number {
  const { skills } = useGameStore.getState()
  return skills.skills.find((s) => s.id === 'carving')?.level ?? 1
}

/**
 * Scan the player's inventory for the first recipe whose material requirement
 * is met (by quantity).  Recipes are checked in display order.  Returns the
 * matching recipe config or null when no carvable material is available in
 * sufficient quantity.
 *
 * Note: this does **not** enforce level requirements — the caller is
 * responsible for checking `recipe.levelReq` against `getCarvingLevel()`.
 */
export function findCarvableMaterial(
  slots: ReadonlyArray<{ id: string; quantity: number }>,
): CarveRecipeConfig | null {
  for (const id of CARVE_DISPLAY_ORDER) {
    const cfg = CARVE_RECIPE_CONFIG[id]
    const slot = slots.find((s) => s.id === cfg.materialId)
    if (slot && slot.quantity >= cfg.materialQty) {
      return cfg
    }
  }
  return null
}
