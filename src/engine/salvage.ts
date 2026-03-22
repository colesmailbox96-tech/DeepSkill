/**
 * Phase 66 — Salvage System
 *
 * Adds interactive salvage nodes inside the Hollow Vault Steps zone.  Each
 * node represents a distinct category of ruin-derived material that the
 * player must have sufficient Salvaging skill to extract.
 *
 * Node variants
 * ─────────────
 *  masonry_rubble — Antechamber (x ≈ −64 → −73): loose stonework knocked
 *                   free from vault walls.  Yields crumbled_masonry.
 *  relic_cache    — Upper steps (x ≈ −77 → −86): corroded iron fittings
 *                   protruding from the rubble.  Yields iron_relic_fragment.
 *  wax_seal       — Lower floor (x ≈ −90 → −96): remnant wax seals pressed
 *                   into stone depressions.  Yields vault_seal_wax.
 *
 * Downstream uses
 * ───────────────
 *  crumbled_masonry   ×2 → vault_mortar      (Tinkering lvl 5, 11 s, 28 xp)
 *  iron_relic_fragment×1 → relic_rivet       (Tinkering lvl 6, 14 s, 32 xp)
 *  vault_seal_wax     ×2 → vault_seal_ward   (Warding   lvl 3, 18 s, 24 xp)
 *
 * All salvage materials can be sold to Tomas (General Trader) or bought from
 * his limited stock when the player has not yet unlocked the vault.
 *
 * The caller (App.tsx) owns the level check, XP grant, and item add.
 * This module provides the data, node visuals, and helpers.
 */

import * as THREE from 'three'
import type { Interactable } from './interactable'
import { useNotifications } from '../store/useNotifications'
import { useGameStore } from '../store/useGameStore'

// ─── Variant configuration ────────────────────────────────────────────────────

export type SalvageVariant = 'masonry_rubble' | 'relic_cache' | 'wax_seal'

export interface SalvageVariantConfig {
  /** Interaction label shown when the node is ready. */
  label: string
  /** Interaction label shown after the node has been salvaged. */
  quietLabel: string
  /** Notification text shown when the node is already depleted. */
  depletedMessage: string
  /** Registry ID of the item granted on a successful salvage. */
  itemId: string
  /** Salvaging XP awarded on a successful extract. */
  xp: number
  /** Minimum Salvaging level required. */
  levelReq: number
  /** Seconds before a depleted node becomes salvageable again. */
  respawnTime: number
  /** Primary geometry/material colour. */
  primaryColor: number
  /** Secondary / accent colour. */
  secondaryColor: number
}

export const SALVAGE_VARIANT_CONFIG: Readonly<Record<SalvageVariant, SalvageVariantConfig>> = {
  masonry_rubble: {
    label: 'Masonry Rubble',
    quietLabel: 'Cleared Rubble',
    depletedMessage: 'This rubble pile has been stripped clean — wait for new debris to settle.',
    itemId: 'crumbled_masonry',
    xp: 10,
    levelReq: 1,
    respawnTime: 30,
    primaryColor: 0x7a6a58,
    secondaryColor: 0x4a3c30,
  },
  relic_cache: {
    label: 'Relic Cache',
    quietLabel: 'Stripped Fitting',
    depletedMessage: 'The iron fragments here have been picked out — wait for more to work loose.',
    itemId: 'iron_relic_fragment',
    xp: 20,
    levelReq: 2,
    respawnTime: 45,
    primaryColor: 0x6a4a32,
    secondaryColor: 0x8a6040,
  },
  wax_seal: {
    label: 'Vault Wax Seal',
    quietLabel: 'Scraped Seal',
    depletedMessage: 'This wax seal has been fully scraped — it will rebuild slowly over time.',
    itemId: 'vault_seal_wax',
    xp: 28,
    levelReq: 3,
    respawnTime: 60,
    primaryColor: 0x5a2a18,
    secondaryColor: 0xc08040,
  },
} as const

// ─── Node type ─────────────────────────────────────────────────────────────

/** Live state for a single salvage node in the world. */
export interface SalvageNode {
  /** Unique identifier (e.g. "salvage_0"). */
  id: string
  /** Which variant this node represents. */
  variant: SalvageVariant
  /** Lifecycle state. */
  state: 'ready' | 'quiet'
  /** Countdown in seconds until the node becomes salvageable again. */
  respawnTimer: number
  /** Visual group — hidden when the node is quiet. */
  clusterMesh: THREE.Group
  /** Interactable descriptor registered in the shared interactables array. */
  interactable: Interactable
}

// ─── Hollow Vault node placements ──────────────────────────────────────────

/**
 * Fixed salvage node placements inside the Hollow Vault Steps zone.
 *
 *  masonry_rubble: antechamber (x −60 to −75, z −7 to +7)
 *  relic_cache:    upper steps (x −75 to −88, z −10 to +10)
 *  wax_seal:       lower floor (x −88 to −98, z −8 to +8)
 */
const SALVAGE_PLACEMENTS: ReadonlyArray<{ pos: [number, number]; variant: SalvageVariant }> = [
  // Antechamber masonry piles — debris knocked from the north and south walls
  { pos: [-65, -4], variant: 'masonry_rubble' },
  { pos: [-70,  3], variant: 'masonry_rubble' },
  { pos: [-67,  0], variant: 'masonry_rubble' },

  // Upper steps relic caches — iron fittings protruding from collapsed risers
  { pos: [-79, -6], variant: 'relic_cache' },
  { pos: [-84,  5], variant: 'relic_cache' },
  { pos: [-81,  0], variant: 'relic_cache' },

  // Lower floor wax seals — ancient ward-wax pressed into stone depressions
  { pos: [-91, -3], variant: 'wax_seal' },
  { pos: [-94,  4], variant: 'wax_seal' },
  { pos: [-97,  0], variant: 'wax_seal' },
]

// ─── Visual builders ────────────────────────────────────────────────────────

/** Masonry rubble: a low mound of stone block fragments. */
function _buildMasonryRubbleMesh(primary: number, secondary: number): THREE.Group {
  const group   = new THREE.Group()
  const matStone = new THREE.MeshStandardMaterial({ color: primary,   roughness: 0.94 })
  const matDark  = new THREE.MeshStandardMaterial({ color: secondary, roughness: 0.96 })

  // Base scatter of irregular stone blocks
  const blockSpecs: Array<[number, number, number, number, number, number, boolean]> = [
    // [w, h, d, x, y, z, dark?]
    [0.45, 0.20, 0.38, -0.10, 0.10, -0.05, false],
    [0.32, 0.16, 0.28,  0.22, 0.08,  0.18, true],
    [0.38, 0.14, 0.30, -0.25, 0.07,  0.20, false],
    [0.22, 0.22, 0.24,  0.08, 0.11, -0.22, true],
    [0.30, 0.12, 0.20, -0.05, 0.06,  0.08, false],
    [0.18, 0.18, 0.16,  0.28, 0.09, -0.12, false],
  ]
  for (const [w, h, d, x, y, z, dark] of blockSpecs) {
    const block = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      dark ? matDark : matStone,
    )
    block.position.set(x, y, z)
    block.rotation.y = (x + z) * 1.4   // deterministic variety per block
    group.add(block)
  }

  return group
}

/** Relic cache: corroded iron fragments wedged into a stone crevice. */
function _buildRelicCacheMesh(primary: number, secondary: number): THREE.Group {
  const group    = new THREE.Group()
  const matRust  = new THREE.MeshStandardMaterial({ color: primary,   roughness: 0.88, metalness: 0.30 })
  const matStone = new THREE.MeshStandardMaterial({ color: secondary, roughness: 0.92 })

  // Stone base crevice
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.18, 0.44), matStone)
  base.position.set(0, 0.09, 0)
  group.add(base)

  // Iron fragments protruding from the crevice
  const fragSpecs: Array<[number, number, number, number, number, number]> = [
    // [w, h, d, x, y, z]
    [0.08, 0.28, 0.06,  0.06, 0.28,  0.05],
    [0.06, 0.22, 0.05, -0.12, 0.24, -0.06],
    [0.10, 0.18, 0.07,  0.16, 0.22,  0.10],
    [0.05, 0.20, 0.06, -0.04, 0.26,  0.12],
  ]
  for (const [w, h, d, x, y, z] of fragSpecs) {
    const frag = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), matRust)
    frag.position.set(x, y, z)
    frag.rotation.z = (x * 0.8)   // slight tilt per fragment
    group.add(frag)
  }

  return group
}

/** Wax seal: a circular depression in the floor filled with dark seal wax. */
function _buildWaxSealMesh(primary: number, secondary: number): THREE.Group {
  const group   = new THREE.Group()
  const matWax  = new THREE.MeshStandardMaterial({
    color: primary,
    roughness: 0.55,
    emissive: new THREE.Color(secondary).multiplyScalar(0.18),
    emissiveIntensity: 0.5,
  })
  const matRim  = new THREE.MeshStandardMaterial({ color: 0x383030, roughness: 0.90 })

  // Stone rim (sunken disc)
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.06, 16), matRim)
  rim.position.set(0, 0.03, 0)
  group.add(rim)

  // Wax fill disc — slightly raised
  const wax = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.04, 16), matWax)
  wax.position.set(0, 0.07, 0)
  group.add(wax)

  // Faint glow to make wax seals visible in the dark vault
  const glow = new THREE.PointLight(secondary, 0.6, 2.2)
  glow.position.set(0, 0.40, 0)
  group.add(glow)

  return group
}

// ─── Node builder ──────────────────────────────────────────────────────────

/** Build a single salvage node at (x, z) and register its interactable. */
function _buildOneSalvageNode(
  scene: THREE.Scene,
  interactables: Interactable[],
  id: string,
  x: number,
  z: number,
  variant: SalvageVariant,
  onSalvageStart: (node: SalvageNode) => void,
): SalvageNode {
  const cfg = SALVAGE_VARIANT_CONFIG[variant]

  let clusterMesh: THREE.Group
  if (variant === 'masonry_rubble') {
    clusterMesh = _buildMasonryRubbleMesh(cfg.primaryColor, cfg.secondaryColor)
  } else if (variant === 'relic_cache') {
    clusterMesh = _buildRelicCacheMesh(cfg.primaryColor, cfg.secondaryColor)
  } else {
    clusterMesh = _buildWaxSealMesh(cfg.primaryColor, cfg.secondaryColor)
  }

  clusterMesh.position.set(x, 0, z)
  scene.add(clusterMesh)

  const interactable: Interactable = {
    mesh: clusterMesh,
    label: cfg.label,
    interactRadius: 2.0,
    onInteract: () => {
      if (node.state === 'quiet') {
        useNotifications.getState().push(cfg.depletedMessage, 'info')
        return
      }
      onSalvageStart(node)
    },
  }

  const node: SalvageNode = {
    id,
    variant,
    state: 'ready',
    respawnTimer: 0,
    clusterMesh,
    interactable,
  }

  interactables.push(interactable)
  return node
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Spawn all Hollow Vault salvage nodes and register their interactables.
 *
 * @param scene           Three.js scene to add meshes to.
 * @param interactables   Mutable array; each node's interactable is appended.
 * @param onSalvageStart  Callback invoked when the player interacts with a
 *                        ready node.  The caller (App.tsx) owns the level
 *                        check, reward, and depletion.
 */
export function buildSalvageNodes(
  scene: THREE.Scene,
  interactables: Interactable[],
  onSalvageStart: (node: SalvageNode) => void,
): SalvageNode[] {
  return SALVAGE_PLACEMENTS.map(({ pos: [x, z], variant }, idx) =>
    _buildOneSalvageNode(scene, interactables, `salvage_${idx}`, x, z, variant, onSalvageStart),
  )
}

/**
 * Per-frame update: tick respawn timers and restore salvage visuals when ready.
 * Call once per animation frame.
 */
export function updateSalvageNodes(nodes: SalvageNode[], delta: number): void {
  for (const node of nodes) {
    if (node.state !== 'quiet') continue
    node.respawnTimer -= delta
    if (node.respawnTimer <= 0) {
      node.state = 'ready'
      node.clusterMesh.visible = true
      node.interactable.label = SALVAGE_VARIANT_CONFIG[node.variant].label
    }
  }
}

/**
 * Transition a salvage node into the quiet (depleted) state and start the
 * respawn countdown.  Call this from App.tsx after granting the salvage reward.
 */
export function depleteSalvageNode(node: SalvageNode): void {
  node.state = 'quiet'
  node.respawnTimer = SALVAGE_VARIANT_CONFIG[node.variant].respawnTime
  node.clusterMesh.visible = false
  node.interactable.label = SALVAGE_VARIANT_CONFIG[node.variant].quietLabel
}

/**
 * Return the player's current Salvaging skill level from the global store.
 * Returns 1 when the skill is not yet initialised.
 */
export function getSalvagingLevel(): number {
  const { skills } = useGameStore.getState()
  return skills.skills.find((s) => s.id === 'salvaging')?.level ?? 1
}
