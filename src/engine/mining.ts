/**
 * Phase 17 — Mining Node System
 *
 * Creates the second skilling loop by placing three rock/ore-vein variants
 * around Hushwood settlement.  Each variant differs in level requirement,
 * mine duration, XP reward, and ore output:
 *
 *   Loose Stone   — level 1, 2 s mine,   10 XP, small_stone
 *   Copper Vein   — level 1, 3.5 s mine, 22 XP, copper_ore
 *   Iron Vein     — level 5, 5 s mine,   35 XP, iron_ore
 */

import * as THREE from 'three'
import type { Interactable } from './interactable'
import { useNotifications } from '../store/useNotifications'
import { useGameStore } from '../store/useGameStore'

// ── Constants ─────────────────────────────────────────────────────────────────

/** Seconds before a depleted rock respawns as an interactable node. */
export const ROCK_RESPAWN_TIME = 30.0

/** Item IDs that count as a valid mining pickaxe, mapped to their tool tier. */
const PICKAXE_TIERS: Readonly<Record<string, number>> = {
  quarry_pick: 1,
  iron_pick: 2,
}

/** Item IDs that count as a valid mining pickaxe. */
const PICKAXE_IDS = new Set(Object.keys(PICKAXE_TIERS))

// ── Variant system ────────────────────────────────────────────────────────────

/** The three beginner rock/ore variants introduced in Phase 17, plus Duskiron (Phase 58). */
export type RockVariant = 'loose_stone' | 'copper' | 'iron' | 'duskiron'

/** Per-variant configuration used for gameplay and visual construction. */
export interface RockVariantConfig {
  /** Display label shown in the interaction prompt. */
  label: string
  /** Item ID granted on a successful mine. */
  oreId: string
  /** Seconds the player must continuously mine to yield one ore. */
  mineDuration: number
  /** Mining XP awarded per ore mined. */
  xp: number
  /** Minimum mining level required to mine this rock. */
  levelReq: number
  // ── Visual geometry ────────────────────────────────────────────────────
  rockColor: number
  oreColor: number
  /** DodecahedronGeometry radius — controls rock size. */
  rockRadius: number
  /** Whether to show a coloured ore-vein patch on the rock face. */
  showOreVein: boolean
}

/**
 * Immutable configuration table for all three beginner rock variants.
 * Consumed by buildOneRock (visual construction) and by App.tsx (reward logic).
 */
export const ROCK_VARIANT_CONFIG: Readonly<Record<RockVariant, RockVariantConfig>> = {
  loose_stone: {
    label: 'Loose Stone',
    oreId: 'small_stone',
    mineDuration: 2.0,
    xp: 10,
    levelReq: 1,
    rockColor: 0xa8a8a8,
    oreColor: 0xa8a8a8,
    rockRadius: 0.55,
    showOreVein: false,
  },
  copper: {
    label: 'Copper Vein',
    oreId: 'copper_ore',
    mineDuration: 3.5,
    xp: 22,
    levelReq: 1,
    rockColor: 0x7a7a7a,
    oreColor: 0xb87333,
    rockRadius: 0.75,
    showOreVein: true,
  },
  iron: {
    label: 'Iron Vein',
    oreId: 'iron_ore',
    mineDuration: 5.0,
    xp: 35,
    levelReq: 5,
    rockColor: 0x525252,
    oreColor: 0x7a3520,
    rockRadius: 0.85,
    showOreVein: true,
  },
  // Phase 58 — Duskiron: dense dark ore with violet mineral veins,
  // found only in the Ashfen Copse.  Requires level 10 mining.
  duskiron: {
    label: 'Duskiron Seam',
    oreId: 'duskiron_ore',
    mineDuration: 6.5,
    xp: 50,
    levelReq: 10,
    rockColor: 0x2e2838,
    oreColor: 0x7a5aaa,
    rockRadius: 0.95,
    showOreVein: true,
  },
}

// ── Materials ─────────────────────────────────────────────────────────────────

const matRubble = new THREE.MeshStandardMaterial({ color: 0x888880, roughness: 0.95 })

/**
 * Vertical flatten factor applied to every rock mesh.
 * The Y scale is multiplied by this value so rocks look grounded rather than
 * perfectly spherical, and the same factor drives the Y position offset so
 * the bottom of the rock sits flush with y = 0.
 */
const ROCK_Y_FLATTEN = 0.70

// ── Types ─────────────────────────────────────────────────────────────────────

/** Live state for a single rock node in the world. */
export interface RockNode {
  /** Unique identifier (e.g. "rock_0"). */
  id: string
  /** Which variant this rock is. */
  variant: RockVariant
  /** Current lifecycle state. */
  state: 'ready' | 'depleted'
  /** Countdown until the rock reforms (only meaningful when state === 'depleted'). */
  respawnTimer: number
  /** Main rock body mesh — hidden when depleted. */
  rockMesh: THREE.Mesh
  /** Ore-vein indicator mesh — hidden when depleted (only on copper/iron). */
  oreMesh: THREE.Mesh
  /** Low rubble mesh — visible only when node is in depleted state. */
  rubbleMesh: THREE.Mesh
  /** Interactable descriptor pushed into the scene interactables array. */
  interactable: Interactable
}

// ── Rock placements ───────────────────────────────────────────────────────────

/**
 * World positions and variant assignments for the six beginner rock nodes
 * placed around Hushwood settlement (Phase 17 layout).
 *
 *   2 × Loose Stone  (level 1)
 *   2 × Copper Vein  (level 1)
 *   2 × Iron Vein    (level 5)
 */
const ROCK_PLACEMENTS: Array<{ pos: [number, number]; variant: RockVariant }> = [
  { pos: [  8,   9], variant: 'loose_stone' }, // south of forge area
  { pos: [ -3, -15], variant: 'loose_stone' }, // north clearing
  { pos: [ 13,   7], variant: 'copper'      }, // east copper vein
  { pos: [ 17,  -3], variant: 'copper'      }, // far east copper vein
  { pos: [ -8,  15], variant: 'iron'        }, // south-west iron vein
  { pos: [  5,  17], variant: 'iron'        }, // south iron vein
]

// ── Builder helpers ───────────────────────────────────────────────────────────

function buildOneRock(
  scene: THREE.Scene,
  id: string,
  x: number,
  z: number,
  variant: RockVariant,
  onMineStart: (node: RockNode) => void,
): RockNode {
  const cfg = ROCK_VARIANT_CONFIG[variant]

  // A stable group anchors the interactable so proximity checks and emissive
  // highlights always target the correct world position regardless of which
  // child mesh is currently visible.
  const group = new THREE.Group()
  group.position.set(x, 0, z)
  scene.add(group)

  // Main rock body — DodecahedronGeometry gives a natural, irregular shape.
  const rockMesh = new THREE.Mesh(
    new THREE.DodecahedronGeometry(cfg.rockRadius, 0),
    new THREE.MeshStandardMaterial({ color: cfg.rockColor, roughness: 0.90 }),
  )
  // Scale vertically to flatten slightly so the rock looks grounded.
  rockMesh.scale.y = ROCK_Y_FLATTEN
  rockMesh.position.set(0, cfg.rockRadius * ROCK_Y_FLATTEN, 0)
  group.add(rockMesh)

  // Ore-vein indicator — a small flat box on the front face of the rock.
  const oreMesh = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.rockRadius * 0.55, cfg.rockRadius * 0.12, cfg.rockRadius * 0.30),
    new THREE.MeshStandardMaterial({ color: cfg.oreColor, roughness: 0.65 }),
  )
  oreMesh.position.set(0, cfg.rockRadius * 0.60, cfg.rockRadius * 0.88)
  oreMesh.visible = cfg.showOreVein
  group.add(oreMesh)

  // Rubble: flat low cylinder shown when the node is depleted, initially hidden.
  const rubbleMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(cfg.rockRadius * 0.65, cfg.rockRadius * 0.70, 0.14, 8),
    matRubble.clone(),
  )
  rubbleMesh.position.set(0, 0.07, 0)
  rubbleMesh.visible = false
  group.add(rubbleMesh)

  const interactable: Interactable = {
    mesh: group,
    label: cfg.label,
    interactRadius: 2.5,
    onInteract: () => {
      if (node.state === 'depleted') {
        useNotifications.getState().push('This rock is depleted — wait for it to reform.', 'info')
        return
      }
      onMineStart(node)
    },
  }

  const node: RockNode = {
    id,
    variant,
    state: 'ready',
    respawnTimer: 0,
    rockMesh,
    oreMesh,
    rubbleMesh,
    interactable,
  }

  return node
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Spawn all beginner rock nodes into `scene` and register their interactables.
 *
 * @param scene         Three.js scene to add meshes to.
 * @param interactables Mutable array; each rock's interactable is appended.
 * @param onMineStart   Callback invoked when the player presses E on a ready rock.
 *                      The caller (App.tsx) owns the gather-timer and reward logic.
 */
export function buildRockNodes(
  scene: THREE.Scene,
  interactables: Interactable[],
  onMineStart: (node: RockNode) => void,
): RockNode[] {
  return ROCK_PLACEMENTS.map(({ pos: [x, z], variant }, idx) => {
    const node = buildOneRock(scene, `rock_${idx}`, x, z, variant, onMineStart)
    interactables.push(node.interactable)
    return node
  })
}

/**
 * Spawn rock nodes at arbitrary world positions and register their interactables.
 * Used by secondary zones (e.g. Redwake Quarry) that define their own placement data.
 *
 * @param scene         Three.js scene to add meshes to.
 * @param interactables Mutable array; each rock's interactable is appended.
 * @param placements    Custom (x, z) + variant pairs.
 * @param onMineStart   Callback invoked when the player presses E on a ready rock.
 * @param idPrefix      Prefix for node IDs so they don't collide with other sets.
 */
export function buildRockNodesAt(
  scene: THREE.Scene,
  interactables: Interactable[],
  placements: ReadonlyArray<{ pos: [number, number]; variant: RockVariant }>,
  onMineStart: (node: RockNode) => void,
  idPrefix: string,
): RockNode[] {
  return placements.map(({ pos: [x, z], variant }, idx) => {
    const node = buildOneRock(scene, `${idPrefix}_${idx}`, x, z, variant, onMineStart)
    interactables.push(node.interactable)
    return node
  })
}

/**
 * Per-frame update: tick respawn timers and restore rock visuals when ready.
 * Call once per animation frame after `updatePlayer`.
 */
export function updateRockNodes(nodes: RockNode[], delta: number): void {
  for (const node of nodes) {
    if (node.state !== 'depleted') continue
    node.respawnTimer -= delta
    if (node.respawnTimer <= 0) {
      node.state = 'ready'
      node.rockMesh.visible = true
      node.oreMesh.visible = ROCK_VARIANT_CONFIG[node.variant].showOreVein
      node.rubbleMesh.visible = false
      // Restore the correct label for this variant
      node.interactable.label = ROCK_VARIANT_CONFIG[node.variant].label
    }
  }
}

/**
 * Transition a rock into the depleted state.
 * Called by App.tsx after a successful mine completes.
 */
export function depleteRock(node: RockNode): void {
  node.state = 'depleted'
  node.respawnTimer = ROCK_RESPAWN_TIME
  node.rockMesh.visible = false
  node.oreMesh.visible = false
  node.rubbleMesh.visible = true
  node.interactable.label = 'Depleted Rock'
}

/**
 * Returns the tier of the best pickaxe currently in the player's inventory.
 * Returns 0 when no pickaxe is held.
 */
export function getPickaxeTier(): number {
  const { slots } = useGameStore.getState().inventory
  return slots.reduce((best, s) => {
    const t = s != null ? (PICKAXE_TIERS[s.id] ?? 0) : 0
    return t > best ? t : best
  }, 0)
}

/**
 * Returns true if the player's inventory contains at least one item that
 * qualifies as a mining pickaxe.
 */
export function hasPickaxe(): boolean {
  const { slots } = useGameStore.getState().inventory
  return slots.some((s) => s != null && PICKAXE_IDS.has(s.id))
}

/**
 * Returns the player's current Mining skill level from the game store.
 */
export function getMiningLevel(): number {
  const { skills } = useGameStore.getState()
  return skills.skills.find((s) => s.id === 'mining')?.level ?? 1
}
