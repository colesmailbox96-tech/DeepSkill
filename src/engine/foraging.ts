/**
 * Phase 21 — Foraging System Base
 *
 * Provides a shared engine for all instant-gather forage nodes across
 * Veilmarch zones (Hushwood area, Gloamwater Bank, etc.).
 *
 * Three variants are available:
 *   - reed_clump  : dense cattail reeds near water          → reed_fiber  (lvl 1,  8 xp)
 *   - marsh_herb  : moisture-loving plants near waterways   → marsh_herb  (lvl 1, 12 xp)
 *   - resin_glob  : amber resin on stressed ironbark bark   → resin_glob  (lvl 3, 18 xp)
 *
 * Phase 57 — Ashfen Copse Zone adds:
 *   - ashfen_resin: dark mineral resin seeping from Mineral Ashwood bark
 *                   → ashfen_resin (lvl 5, 28 xp)
 *
 * Unlike woodcutting / mining / fishing, foraging is instant — there is no
 * cast or chop timer.  The caller (App.tsx) receives an onForageStart
 * callback, checks the level requirement, grants the reward immediately,
 * and calls depleteForageNode() to begin the respawn countdown.
 */

import * as THREE from 'three'
import type { Interactable } from './interactable'
import { useNotifications } from '../store/useNotifications'
import { useGameStore } from '../store/useGameStore'

// ─── Variant configuration ────────────────────────────────────────────────────

export type ForageVariant = 'reed_clump' | 'marsh_herb' | 'resin_glob' | 'ashfen_resin' | 'marsh_glass_reed' | 'marrowfen_spore'

export interface ForageVariantConfig {
  /** Interaction label shown when the node is ready. */
  label: string
  /** Interaction label shown after the node has been gathered. */
  quietLabel: string
  /** Notification text shown when the node is already depleted. */
  depletedMessage: string
  /** Registry ID of the item granted on a successful gather. */
  itemId: string
  /** Foraging XP awarded on a successful gather. */
  xp: number
  /** Minimum foraging level required to gather this node. */
  levelReq: number
  /** Seconds before a depleted node becomes gatherable again. */
  respawnTime: number
  /** Primary geometry/material colour. */
  primaryColor: number
  /** Secondary / accent colour (heads, blobs, etc.). */
  secondaryColor: number
}

export const FORAGE_VARIANT_CONFIG: Readonly<Record<ForageVariant, ForageVariantConfig>> = {
  reed_clump: {
    label: 'Reed Cluster',
    quietLabel: 'Bare Reed Patch',
    depletedMessage: 'These reeds are already stripped — wait for regrowth.',
    itemId: 'reed_fiber',
    xp: 8,
    levelReq: 1,
    respawnTime: 15,
    primaryColor: 0x7a9e52,
    secondaryColor: 0x8b6c3a,
  },
  marsh_herb: {
    label: 'Marsh Herb',
    quietLabel: 'Bare Herb Patch',
    depletedMessage: 'This herb patch has been stripped — wait for it to regrow.',
    itemId: 'marsh_herb',
    xp: 12,
    levelReq: 1,
    respawnTime: 20,
    primaryColor: 0x4a7a3a,
    secondaryColor: 0x6aaa5a,
  },
  resin_glob: {
    label: 'Resin Glob',
    quietLabel: 'Dry Bark',
    depletedMessage: 'The resin here has been scraped clean — wait for it to seep again.',
    itemId: 'resin_glob',
    xp: 18,
    levelReq: 3,
    respawnTime: 25,
    primaryColor: 0xc88820,
    secondaryColor: 0x7a4a18,
  },
  // Phase 57 — Ashfen Copse mineral resin: dark amber seeping from Mineral
  // Ashwood bark.  Harder and more valuable than ordinary resin.
  ashfen_resin: {
    label: 'Ashfen Resin Node',
    quietLabel: 'Scraped Bark',
    depletedMessage: 'The mineral resin has been fully scraped — it will seep again in time.',
    itemId: 'ashfen_resin',
    xp: 28,
    levelReq: 5,
    respawnTime: 35,
    primaryColor: 0x6a3a10,
    secondaryColor: 0x2a1a08,
  },
  // Phase 58 — Marsh Glass Reed: semi-translucent reeds growing in mineral-rich
  // shallows.  Their prismatic stalks shimmer with a pale green-white light.
  marsh_glass_reed: {
    label: 'Marsh Glass Reed',
    quietLabel: 'Bare Reed Bed',
    depletedMessage: 'These glass reeds have been stripped — wait for regrowth.',
    itemId: 'marsh_glass_reed',
    xp: 35,
    levelReq: 7,
    respawnTime: 40,
    primaryColor: 0xa8d8c0,
    secondaryColor: 0xd0f0e8,
  },
  // Phase 74 — Marrowfen rare fungal cluster: pale glowing spore caps that
  // push up through the fen mud.  High XP and rare; requires level 9 Foraging.
  marrowfen_spore: {
    label: 'Marrowfen Spore Cluster',
    quietLabel: 'Spent Spore Bed',
    depletedMessage: 'These spore caps have been harvested — wait for the next bloom.',
    itemId: 'marrowfen_spore',
    xp: 45,
    levelReq: 9,
    respawnTime: 55,
    primaryColor: 0xd4b8e0,
    secondaryColor: 0x8860a8,
  },
} as const

// ─── Node type ────────────────────────────────────────────────────────────────

/** Live state for a single forage node in the world. */
export interface ForageNode {
  /** Unique identifier (e.g. "forage_0", "shore_forage_1"). */
  id: string
  /** Which variant this node represents. */
  variant: ForageVariant
  /** Lifecycle state. */
  state: 'ready' | 'quiet'
  /** Countdown in seconds until the node becomes gatherable again. */
  respawnTimer: number
  /** Visual cluster group — hidden when the node is quiet. */
  clusterMesh: THREE.Group
  /** Interactable descriptor registered in the shared interactables array. */
  interactable: Interactable
}

// ─── Hushwood-area placements ────────────────────────────────────────────────

/**
 * Forage node positions for the Hushwood starting area.
 *
 * Positions avoid overlapping with known tree, rock, and building placements:
 *   Trees     : [-15,-13], [2,-16], [16,-6], [15,12], [-14,12], [-15,0]
 *   Rocks     : [8,9], [-3,-15], [13,7], [17,-3], [-8,15], [5,17]
 *   Buildings : Hall(0,-10,8×5), Forge(10,3,5×5), Shed(-10,3,5×4),
 *               Inn(0,14,7×6), GuardHut(-11,-9,3×3)
 */
const FORAGE_PLACEMENTS: ReadonlyArray<{ pos: [number, number]; variant: ForageVariant }> = [
  // marsh herbs near the damp margins of the settlement
  { pos: [  5, -10], variant: 'marsh_herb' }, // north-east margin
  { pos: [ -6,   7], variant: 'marsh_herb' }, // west-south clearing
  { pos: [ 11,  14], variant: 'marsh_herb' }, // south-east fringe

  // resin globs seeping from ironbark bark near the ironbark stands
  { pos: [-14, -15], variant: 'resin_glob' }, // north-west ironbark grove
  { pos: [ 13,  10], variant: 'resin_glob' }, // south-east ironbark stand
]

// ─── Visual builders ──────────────────────────────────────────────────────────

/** Build the Three.js geometry for a reed-clump node. */
function _buildReedClusterMesh(primaryColor: number, secondaryColor: number): THREE.Group {
  const group   = new THREE.Group()
  const matStalk = new THREE.MeshStandardMaterial({ color: primaryColor,   roughness: 0.90 })
  const matHead  = new THREE.MeshStandardMaterial({ color: secondaryColor, roughness: 0.85 })

  const offsets: Array<[number, number]> = [
    [ 0.00,  0.00],
    [ 0.20,  0.30],
    [-0.25,  0.15],
    [ 0.10, -0.28],
    [-0.10, -0.10],
  ]
  for (const [ox, oz] of offsets) {
    const height = 1.1 + Math.random() * 0.4
    const stalk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.05, height, 5),
      matStalk,
    )
    stalk.position.set(ox, height / 2, oz)
    stalk.rotation.z = (Math.random() - 0.5) * 0.18
    group.add(stalk)

    const head = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.22, 7),
      matHead,
    )
    head.position.set(ox, height + 0.10, oz)
    group.add(head)
  }
  return group
}

/** Build the Three.js geometry for a marsh-herb node. */
function _buildMarshHerbMesh(primaryColor: number, secondaryColor: number): THREE.Group {
  const group   = new THREE.Group()
  const matLeaf = new THREE.MeshStandardMaterial({ color: primaryColor,   roughness: 0.85 })
  const matStem = new THREE.MeshStandardMaterial({ color: secondaryColor, roughness: 0.90 })

  // Three leafy sprigs arranged in a loose cluster
  const sprigs: Array<[number, number]> = [
    [ 0.00,  0.00],
    [ 0.22,  0.16],
    [-0.18,  0.20],
  ]
  for (const [ox, oz] of sprigs) {
    const stemH = 0.28 + Math.random() * 0.12
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.035, stemH, 5),
      matStem,
    )
    stem.position.set(ox, stemH / 2, oz)
    stem.rotation.z = (Math.random() - 0.5) * 0.20
    group.add(stem)

    // Leaf: flattened sphere
    const leaf = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 6, 4),
      matLeaf,
    )
    leaf.scale.set(1.0, 0.28, 0.9)
    leaf.position.set(ox, stemH + 0.06, oz)
    leaf.rotation.y = Math.random() * Math.PI
    group.add(leaf)
  }
  return group
}

/** Build the Three.js geometry for a resin-glob node. */
function _buildResinGlobMesh(primaryColor: number, secondaryColor: number): THREE.Group {
  const group   = new THREE.Group()
  const matResin = new THREE.MeshStandardMaterial({
    color: primaryColor,
    emissive: new THREE.Color(primaryColor).multiplyScalar(0.18),
    roughness: 0.45,
  })
  const matBark = new THREE.MeshStandardMaterial({ color: secondaryColor, roughness: 0.92 })

  // Small bark-stub base
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.28, 0.20, 7),
    matBark,
  )
  base.position.y = 0.10
  group.add(base)

  // Two or three amber resin blobs of varying size
  const blobs: Array<[number, number, number, number]> = [
    [ 0.00, 0.28, 0.00, 0.12],
    [ 0.12, 0.22, 0.10, 0.09],
    [-0.10, 0.24, 0.08, 0.08],
  ]
  for (const [bx, by, bz, r] of blobs) {
    const blob = new THREE.Mesh(new THREE.SphereGeometry(r, 6, 5), matResin)
    blob.position.set(bx, by, bz)
    group.add(blob)
  }
  return group
}

/** Build the Three.js geometry for a marsh-glass-reed node. */
function _buildMarshGlassReedMesh(primaryColor: number, secondaryColor: number): THREE.Group {
  const group = new THREE.Group()
  const matStalk = new THREE.MeshStandardMaterial({
    color: primaryColor,
    emissive: new THREE.Color(secondaryColor).multiplyScalar(0.22),
    roughness: 0.30,
    transparent: true,
    opacity: 0.88,
  })
  const matTip = new THREE.MeshStandardMaterial({
    color: secondaryColor,
    emissive: new THREE.Color(secondaryColor).multiplyScalar(0.35),
    roughness: 0.20,
    transparent: true,
    opacity: 0.75,
  })

  const offsets: Array<[number, number]> = [
    [ 0.00,  0.00],
    [ 0.22,  0.18],
    [-0.20,  0.22],
    [ 0.10, -0.25],
    [-0.12, -0.12],
  ]
  for (const [ox, oz] of offsets) {
    const height = 1.3 + Math.random() * 0.5
    const stalk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.04, height, 6),
      matStalk,
    )
    stalk.position.set(ox, height / 2, oz)
    stalk.rotation.z = (Math.random() - 0.5) * 0.14
    group.add(stalk)

    // Prismatic tip — slightly faceted cone
    const tip = new THREE.Mesh(
      new THREE.ConeGeometry(0.055, 0.28, 6),
      matTip,
    )
    tip.position.set(ox, height + 0.14, oz)
    group.add(tip)
  }
  return group
}

// ─── Node builder ─────────────────────────────────────────────────────────────

/** Build a single forage node at (x, z) and register its interactable. */
function _buildOneForageNode(
  scene: THREE.Scene,
  interactables: Interactable[],
  id: string,
  x: number,
  z: number,
  variant: ForageVariant,
  onForageStart: (node: ForageNode) => void,
): ForageNode {
  const cfg = FORAGE_VARIANT_CONFIG[variant]

  let clusterMesh: THREE.Group
  if (variant === 'reed_clump') {
    clusterMesh = _buildReedClusterMesh(cfg.primaryColor, cfg.secondaryColor)
  } else if (variant === 'marsh_herb') {
    clusterMesh = _buildMarshHerbMesh(cfg.primaryColor, cfg.secondaryColor)
  } else if (variant === 'marsh_glass_reed') {
    clusterMesh = _buildMarshGlassReedMesh(cfg.primaryColor, cfg.secondaryColor)
  } else {
    clusterMesh = _buildResinGlobMesh(cfg.primaryColor, cfg.secondaryColor)
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
      onForageStart(node)
    },
  }

  const node: ForageNode = {
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

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Spawn the default Hushwood-area forage nodes and register their interactables.
 *
 * @param scene         Three.js scene to add meshes to.
 * @param interactables Mutable array; each node's interactable is appended.
 * @param onForageStart Callback invoked when the player interacts with a ready node.
 *                      The caller (App.tsx) owns the level check, reward, and depletion.
 */
export function buildForageNodes(
  scene: THREE.Scene,
  interactables: Interactable[],
  onForageStart: (node: ForageNode) => void,
): ForageNode[] {
  return FORAGE_PLACEMENTS.map(({ pos: [x, z], variant }, idx) =>
    _buildOneForageNode(scene, interactables, `forage_${idx}`, x, z, variant, onForageStart),
  )
}

/**
 * Spawn forage nodes at arbitrary world positions and register their interactables.
 * Used by secondary zones (e.g. Gloamwater Bank) that supply their own placement data.
 *
 * @param scene         Three.js scene to add meshes to.
 * @param interactables Mutable array; each node's interactable is appended.
 * @param placements    Custom (x, z) + variant pairs.
 * @param onForageStart Callback invoked when the player interacts with a ready node.
 * @param idPrefix      Prefix for node IDs so they don't collide with other sets.
 */
export function buildForageNodesAt(
  scene: THREE.Scene,
  interactables: Interactable[],
  placements: ReadonlyArray<{ pos: [number, number]; variant: ForageVariant }>,
  onForageStart: (node: ForageNode) => void,
  idPrefix: string,
): ForageNode[] {
  return placements.map(({ pos: [x, z], variant }, idx) =>
    _buildOneForageNode(scene, interactables, `${idPrefix}_${idx}`, x, z, variant, onForageStart),
  )
}

/**
 * Per-frame update: tick respawn timers and restore forage visuals when ready.
 * Call once per animation frame.
 */
export function updateForageNodes(nodes: ForageNode[], delta: number): void {
  for (const node of nodes) {
    if (node.state !== 'quiet') continue
    node.respawnTimer -= delta
    if (node.respawnTimer <= 0) {
      node.state = 'ready'
      node.clusterMesh.visible = true
      node.interactable.label = FORAGE_VARIANT_CONFIG[node.variant].label
    }
  }
}

/**
 * Transition a forage node into the quiet (depleted) state and start the
 * respawn countdown.  Call this from App.tsx after granting the gather reward.
 */
export function depleteForageNode(node: ForageNode): void {
  node.state = 'quiet'
  node.respawnTimer = FORAGE_VARIANT_CONFIG[node.variant].respawnTime
  node.clusterMesh.visible = false
  node.interactable.label = FORAGE_VARIANT_CONFIG[node.variant].quietLabel
}

/**
 * Return the player's current foraging skill level from the global store.
 * Returns 1 when the foraging skill is not yet initialised.
 */
export function getForagingLevel(): number {
  const { skills } = useGameStore.getState()
  return skills.skills.find((s) => s.id === 'foraging')?.level ?? 1
}
