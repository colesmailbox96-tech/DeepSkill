/**
 * Phase 20 — Shoreline Region Slice
 *
 * Builds Gloamwater Bank as a playable skilling zone east of Hushwood:
 *   - a connecting dirt trail from the Hushwood east gate to the bank entrance,
 *   - sandy bank terrain with a broad water surface at the far east,
 *   - a wooden dock structure extending into the water,
 *   - 3 fishing nodes (minnow / perch / gloomfin) along the waterline,
 *   - 3 reed foraging nodes that yield reed_fiber and grant fishing XP,
 *   - one fisher NPC: Brin Salt,
 *   - a cookfire set piece near the dock.
 *
 * The Hushwood east boundary wall has a 6-unit gap at z = 0 (see hushwood.ts)
 * that lines up with the 6-unit-wide trail built here.
 *
 * Spatial layout (top-down; x increases eastward, z increases southward):
 *
 *   Hushwood settlement    x =   0  (centre)
 *   Hushwood east gate     x = +19  (6-unit gap at z = 0)
 *   Trail corridor         x = +19  →  x = +42  (23 units long, 6 units wide)
 *   Bank entrance          x = +42
 *   Bank terrain           x = +42  →  x = +62  (20 units deep land area)
 *   Shore transition       x = +60  →  x = +64  (sandy overlap strip)
 *   Water surface          x = +62  →  x = +80  (18 units of open water)
 *   East boundary          x = +80
 *   North boundary         z = −18
 *   South boundary         z = +18
 */

import * as THREE from 'three'
import type { Interactable } from './interactable'
import type { Npc } from './npc'
import { buildFishingNodesAt } from './fishing'
import type { FishingNode } from './fishing'
import { useNotifications } from '../store/useNotifications'
import { useGameStore } from '../store/useGameStore'
import { getItem } from '../data/items/itemRegistry'

// ─── Shared materials ────────────────────────────────────────────────────────

const matSand    = new THREE.MeshStandardMaterial({ color: 0xc8b882, roughness: 0.95 })
const matShore   = new THREE.MeshStandardMaterial({ color: 0xd4c89a, roughness: 0.97 })
const matTrail   = new THREE.MeshStandardMaterial({ color: 0x5c4a32, roughness: 0.92 })
const matVerge   = new THREE.MeshStandardMaterial({ color: 0x8a7a60, roughness: 0.93 })
const matWater   = new THREE.MeshStandardMaterial({
  color: 0x2a6080,
  roughness: 0.08,
  transparent: true,
  opacity: 0.82,
})
const matWood    = new THREE.MeshStandardMaterial({ color: 0x9a6c3a, roughness: 0.82 })
const matDarkWood = new THREE.MeshStandardMaterial({ color: 0x6a4c28, roughness: 0.88 })
const matReed    = new THREE.MeshStandardMaterial({ color: 0x7a9e52, roughness: 0.90 })
const matReedHead = new THREE.MeshStandardMaterial({ color: 0x8b6c3a, roughness: 0.85 })
const matEmber   = new THREE.MeshStandardMaterial({
  color: 0xff5500,
  emissive: new THREE.Color(0xff3300),
  emissiveIntensity: 0.9,
  roughness: 0.5,
})
const matBound   = new THREE.MeshStandardMaterial({ visible: false })

/** Seconds before a harvested reed node becomes gatherable again. */
const REED_RESPAWN_TIME = 15.0

// ─── Public result type ───────────────────────────────────────────────────────

/** Live state for a single reed foraging node. */
export interface ReedNode {
  /** Unique identifier. */
  id: string
  /** Lifecycle state. */
  state: 'ready' | 'quiet'
  /** Countdown until the node becomes active again. */
  respawnTimer: number
  /** Reed cluster mesh — hidden when quiet. */
  clusterMesh: THREE.Group
  /** Interactable descriptor. */
  interactable: Interactable
}

export interface ShorelineResult {
  /** Collidable meshes — appended to the global collidables array in App.tsx. */
  collidables: THREE.Mesh[]
  /** Interactable descriptors — appended to the global interactables array. */
  interactables: Interactable[]
  /** Live fishing nodes at the bank for per-frame respawn ticking. */
  fishingNodes: FishingNode[]
  /** Live reed nodes for per-frame respawn ticking. */
  reedNodes: ReedNode[]
  /** Live NPC objects for per-frame ambient sway. */
  npcs: Npc[]
}

// ─── Fishing node placements (bank spots) ────────────────────────────────────

/**
 * Three fishing spots along the Gloamwater Bank waterline.
 * World-space (x, z) absolute coordinates.
 * Spots are placed at the water's edge so the player can reach them
 * by standing on the shore transition strip (x = +60 → +64).
 *
 *   1 × Shallows Pool  (minnow,   level 1) — south shore near the dock
 *   1 × Reed-bank Pool (perch,    level 1) — north shore
 *   1 × Deepwater Hole (gloomfin, level 5) — mid-shore deep channel
 */
const BANK_FISH_PLACEMENTS: ReadonlyArray<{ pos: [number, number]; variant: 'minnow' | 'perch' | 'gloomfin' }> = [
  { pos: [63, -5], variant: 'minnow'   },
  { pos: [63,  5], variant: 'perch'    },
  { pos: [65, -9], variant: 'gloomfin' },
]

// ─── Reed node placements ────────────────────────────────────────────────────

const REED_PLACEMENTS: ReadonlyArray<[number, number]> = [
  [47, -10],
  [53,  12],
  [57,  -8],
]

// ─── Main builder ─────────────────────────────────────────────────────────────

/**
 * Populate `scene` with all Gloamwater Bank geometry and return collidables,
 * interactables, fishing nodes, reed nodes, and NPC objects.
 *
 * @param scene         Three.js scene to add meshes to.
 * @param interactables Shared interactables array (mutated in place).
 * @param onCastStart   Fishing callback passed to each bank fishing node.
 * @param onReedGather  Callback invoked when the player gathers a reed node.
 */
export function buildShoreline(
  scene: THREE.Scene,
  interactables: Interactable[],
  onCastStart: (node: FishingNode) => void,
  onReedGather: (node: ReedNode) => void,
): ShorelineResult {
  const collidables: THREE.Mesh[] = []
  const npcs: Npc[] = []

  // ── Connecting trail (x = +19 → +42, z = −3 → +3) ────────────────────────
  // Dirt road continuing the Hushwood E-W road east through the gap.
  const trail = new THREE.Mesh(new THREE.PlaneGeometry(23, 6), matTrail)
  trail.rotation.x = -Math.PI / 2
  trail.position.set(30.5, 0.01, 0) // centre of x +19 → +42
  scene.add(trail)

  // Sandy verge strips either side of the trail
  const vergeN = new THREE.Mesh(new THREE.PlaneGeometry(23, 1.5), matVerge)
  vergeN.rotation.x = -Math.PI / 2
  vergeN.position.set(30.5, 0.005, -3.75)
  scene.add(vergeN)

  const vergeS = new THREE.Mesh(new THREE.PlaneGeometry(23, 1.5), matVerge)
  vergeS.rotation.x = -Math.PI / 2
  vergeS.position.set(30.5, 0.005, 3.75)
  scene.add(vergeS)

  // Invisible corridor walls — keep player on the 6-unit-wide trail
  const corrN = _addWall(scene, 23, 6, 0.4, 30.5, 3, -3.1, matBound)
  const corrS = _addWall(scene, 23, 6, 0.4, 30.5, 3,  3.1, matBound)
  collidables.push(corrN, corrS)

  // ── Bank ground (x = +42 → +62, z = −18 → +18) ───────────────────────────
  const bankFloor = new THREE.Mesh(new THREE.PlaneGeometry(20, 36), matSand)
  bankFloor.rotation.x = -Math.PI / 2
  bankFloor.position.set(52, 0.01, 0) // centre: (42 + 62) / 2 = 52
  scene.add(bankFloor)

  // Sandy shore transition strip (x = +60 → +64)
  const shoreStrip = new THREE.Mesh(new THREE.PlaneGeometry(4, 36), matShore)
  shoreStrip.rotation.x = -Math.PI / 2
  shoreStrip.position.set(62, 0.015, 0)
  scene.add(shoreStrip)

  // ── Water surface (x = +62 → +80, z = −18 → +18) ─────────────────────────
  const water = new THREE.Mesh(new THREE.PlaneGeometry(18, 36), matWater)
  water.rotation.x = -Math.PI / 2
  water.position.set(71, 0.04, 0) // centre: (62 + 80) / 2 = 71
  scene.add(water)

  // Sea floor beneath the water — gives the water a visible bed instead of
  // showing the dark scene background through the semi-transparent surface.
  const matSeaFloor = new THREE.MeshStandardMaterial({ color: 0x486060, roughness: 0.99 })
  const seaFloor = new THREE.Mesh(new THREE.PlaneGeometry(22, 40), matSeaFloor)
  seaFloor.rotation.x = -Math.PI / 2
  seaFloor.position.set(71, -0.4, 0)
  scene.add(seaFloor)

  // Soft blue-green ambient over the water
  const waterLight = new THREE.PointLight(0x204860, 0.9, 22)
  waterLight.position.set(71, 1.5, 0)
  scene.add(waterLight)

  // ── Boundary walls ────────────────────────────────────────────────────────

  // North boundary (z = −18)
  const boundN = _addWall(scene, 38, 6, 0.4, 61, 3, -18, matBound)
  // South boundary (z = +18)
  const boundS = _addWall(scene, 38, 6, 0.4, 61, 3,  18, matBound)
  // East boundary (x = +80) — at the far edge of the water.
  const boundE = _addWall(scene, 0.4, 6, 36, 80, 3,   0, matBound)
  collidables.push(boundN, boundS, boundE)

  // ── Dock structure (x = +58 → +72, z = −1 → +1) ─────────────────────────
  // Four wooden support posts
  for (const px of [59, 63, 67, 71]) {
    _addBox(scene, 0.22, 1.8, 0.22, px, 0.9, -0.8, matDarkWood)
    _addBox(scene, 0.22, 1.8, 0.22, px, 0.9,  0.8, matDarkWood)
  }
  // Dock planks (three overlapping boards for width)
  _addBox(scene, 14, 0.14, 0.5, 65, 0.18, -0.7, matWood)
  _addBox(scene, 14, 0.14, 0.5, 65, 0.18,  0.0, matWood)
  _addBox(scene, 14, 0.14, 0.5, 65, 0.18,  0.7, matWood)
  // Low dock railing on the north side
  _addBox(scene, 14, 0.6, 0.1, 65, 0.56, -0.95, matWood)

  // ── Cookfire near the bank (x = +47, z = −6) ─────────────────────────────
  // Stone ring base
  const matFireRing = new THREE.MeshStandardMaterial({ color: 0x8e8680, roughness: 0.88 })
  const fireRing = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.12, 6, 12), matFireRing)
  fireRing.rotation.x = -Math.PI / 2
  fireRing.position.set(47, 0.12, -6)
  scene.add(fireRing)
  // Fire stones (four rough dodecahedra around the ring)
  const matFireStone = new THREE.MeshStandardMaterial({ color: 0x8e8680, roughness: 0.88 })
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2
    const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16, 0), matFireStone)
    stone.position.set(47 + Math.cos(angle) * 0.52, 0.14, -6 + Math.sin(angle) * 0.52)
    scene.add(stone)
  }
  // Ember glow (central flat disc)
  const ember = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.38, 0.08, 8), matEmber)
  ember.position.set(47, 0.08, -6)
  scene.add(ember)
  // Warm point light from the fire
  const fireLight = new THREE.PointLight(0xff6020, 2.2, 12)
  fireLight.position.set(47, 0.7, -6)
  scene.add(fireLight)

  // ── Brin Salt NPC — fisher stationed near the dock ────────────────────────
  const brinGroup = new THREE.Group()
  brinGroup.position.set(53, 0, 3)
  brinGroup.rotation.y = Math.PI * 0.75 // facing north-east toward the water

  const brinBodyMat = new THREE.MeshStandardMaterial({ color: 0x4a6a8a, roughness: 0.72 })
  const brinBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 0.9, 4, 8), brinBodyMat)
  brinBody.position.y = 0.7
  brinGroup.add(brinBody)

  const brinDiscMat = new THREE.MeshStandardMaterial({
    color: 0xffe080,
    emissive: new THREE.Color(0xffe080),
    emissiveIntensity: 0.4,
    roughness: 0.5,
  })
  const brinDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 0.06, 8),
    brinDiscMat,
  )
  brinDisc.position.y = 1.85
  brinGroup.add(brinDisc)

  scene.add(brinGroup)

  const brinInteractable: Interactable = {
    mesh: brinGroup,
    label: 'Brin Salt (Fisher)',
    interactRadius: 2.2,
    onInteract: () =>
      useNotifications
        .getState()
        .push('Brin Salt: "The tidal channels run deep here — best spots are out past the dock."', 'info'),
  }
  interactables.push(brinInteractable)

  const brinNpc: Npc = {
    mesh: brinGroup,
    idleAngle: Math.PI * 0.75,
    ambientPhase: 1.3,
    ambientTime: 0,
  }
  npcs.push(brinNpc)

  // ── Fishing nodes along the Gloamwater Bank waterline ────────────────────
  const fishingNodes = buildFishingNodesAt(
    scene,
    interactables,
    BANK_FISH_PLACEMENTS,
    onCastStart,
    'bank_fish',
  )

  // ── Reed foraging nodes ───────────────────────────────────────────────────
  const reedNodes = REED_PLACEMENTS.map(([rx, rz], idx) =>
    _buildOneReedNode(scene, interactables, `reed_${idx}`, rx, rz, onReedGather),
  )

  return { collidables, interactables, fishingNodes, reedNodes, npcs }
}

// ─── Reed node respawn update ─────────────────────────────────────────────────

/**
 * Per-frame update: tick respawn timers and restore reed visuals when ready.
 * Call once per animation frame.
 */
export function updateReedNodes(nodes: ReedNode[], delta: number): void {
  for (const node of nodes) {
    if (node.state !== 'quiet') continue
    node.respawnTimer -= delta
    if (node.respawnTimer <= 0) {
      node.state = 'ready'
      node.clusterMesh.visible = true
      node.interactable.label = 'Reed Cluster'
    }
  }
}

/**
 * Transition a reed node into the quiet (harvested) state.
 * Called by App.tsx after a successful gather interaction.
 */
export function depleteReedNode(node: ReedNode): void {
  node.state = 'quiet'
  node.respawnTimer = REED_RESPAWN_TIME
  node.clusterMesh.visible = false
  node.interactable.label = 'Bare Reed Patch'
}

// ─── Private helpers ──────────────────────────────────────────────────────────

/** Build one reed foraging node at (x, z). Returns the live ReedNode. */
function _buildOneReedNode(
  scene: THREE.Scene,
  interactables: Interactable[],
  id: string,
  x: number,
  z: number,
  onReedGather: (node: ReedNode) => void,
): ReedNode {
  const cluster = new THREE.Group()
  cluster.position.set(x, 0, z)
  scene.add(cluster)

  // Cluster of thin reed stalks
  // Clone materials once per cluster so emissive highlighting works per-interactable
  // while avoiding redundant allocations across the individual stalk meshes.
  const clusterReedMat = matReed.clone()
  const clusterHeadMat = matReedHead.clone()
  const stalkOffsets: Array<[number, number, number]> = [
    [ 0.0, 0,  0.0],
    [ 0.2, 0,  0.3],
    [-0.25, 0,  0.15],
    [ 0.1, 0, -0.28],
    [-0.1, 0, -0.1],
  ]
  for (const [ox, , oz] of stalkOffsets) {
    const height = 1.1 + Math.random() * 0.4
    const stalk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.05, height, 5),
      clusterReedMat,
    )
    stalk.position.set(ox, height / 2, oz)
    stalk.rotation.z = (Math.random() - 0.5) * 0.18
    cluster.add(stalk)

    // Cattail head at the tip of each stalk
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.22, 7), clusterHeadMat)
    head.position.set(ox, height + 0.1, oz)
    cluster.add(head)
  }

  const interactable: Interactable = {
    mesh: cluster,
    label: 'Reed Cluster',
    interactRadius: 2.0,
    onInteract: () => {
      if (node.state === 'quiet') {
        useNotifications.getState().push('These reeds are already stripped — wait for regrowth.', 'info')
        return
      }
      const reedName = getItem('reed_fiber')?.name ?? 'Reed Fiber'
      const { addItem, grantSkillXp } = useGameStore.getState()
      addItem({ id: 'reed_fiber', name: reedName, quantity: 1 })
      grantSkillXp('fishing', 8)
      useNotifications.getState().push(`You strip a handful of ${reedName.toLowerCase()} from the reeds.`, 'success')
      onReedGather(node)
    },
  }

  const node: ReedNode = {
    id,
    state: 'ready',
    respawnTimer: 0,
    clusterMesh: cluster,
    interactable,
  }

  interactables.push(interactable)
  return node
}

/** Add a box-geometry mesh at (x, y, z). Returns the created mesh. */
function _addBox(
  scene: THREE.Scene,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  mat: THREE.MeshStandardMaterial,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
  mesh.position.set(x, y, z)
  scene.add(mesh)
  return mesh
}

/** Add an invisible collision wall at (x, y, z). Returns the created mesh. */
function _addWall(
  scene: THREE.Scene,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  mat: THREE.MeshStandardMaterial,
): THREE.Mesh {
  return _addBox(scene, w, h, d, x, y, z, mat)
}
