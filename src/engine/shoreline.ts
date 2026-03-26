/**
 * Phase 20 — Shoreline Region Slice (updated Phase 21)
 *
 * Builds Gloamwater Bank as a playable skilling zone east of Hushwood:
 *   - a connecting dirt trail from the Hushwood east gate to the bank entrance,
 *   - sandy bank terrain with a broad water surface at the far east,
 *   - a wooden dock structure extending into the water,
 *   - 3 fishing nodes (minnow / perch / gloomfin) along the waterline,
 *   - 3 reed foraging nodes (reed_clump variant) using the shared foraging engine,
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
import { buildForageNodesAt } from './foraging'
import type { ForageNode } from './foraging'
import { useDialogueStore } from '../store/useDialogueStore'
import { useNotifications } from '../store/useNotifications'

// ─── Shared materials ────────────────────────────────────────────────────────
const matSand    = new THREE.MeshLambertMaterial({ color: 0xc8b882 })
const matShore   = new THREE.MeshLambertMaterial({ color: 0xd4c89a })
const matTrail   = new THREE.MeshLambertMaterial({ color: 0x5c4a32 })
const matVerge   = new THREE.MeshLambertMaterial({ color: 0x8a7a60 })
const matWater   = new THREE.MeshStandardMaterial({
  color: 0x2a6080,
  roughness: 0.08,
  transparent: true,
  opacity: 0.82,
})
const matWood    = new THREE.MeshLambertMaterial({ color: 0x9a6c3a })
const matDarkWood = new THREE.MeshLambertMaterial({ color: 0x6a4c28 })
const matEmber   = new THREE.MeshStandardMaterial({
  color: 0xff5500,
  emissive: new THREE.Color(0xff3300),
  emissiveIntensity: 0.9,
  roughness: 0.5,
})
const matBound   = new THREE.MeshLambertMaterial({ visible: false })

// ─── Public result type ───────────────────────────────────────────────────────

export interface ShorelineResult {
  /** Collidable meshes — appended to the global collidables array in App.tsx. */
  collidables: THREE.Mesh[]
  /** Live fishing nodes at the bank for per-frame respawn ticking. */
  fishingNodes: FishingNode[]
  /**
   * Live forage nodes for per-frame respawn ticking.
   * Includes all bank forage variants: reed_clump and marsh_glass_reed (Phase 58+).
   */
  forageNodes: ForageNode[]
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

// ─── Reed forage placements at the bank (reed_clump variant) ─────────────────

const REED_PLACEMENTS: ReadonlyArray<{ pos: [number, number]; variant: 'reed_clump' }> = [
  { pos: [47, -10], variant: 'reed_clump' },
  { pos: [53,  12], variant: 'reed_clump' },
  { pos: [57,  -8], variant: 'reed_clump' },
]

// ─── Marsh glass reed placements (Phase 58) ───────────────────────────────────

/**
 * Two marsh glass reed clusters growing in the mineral-rich shallows of
 * Gloamwater Bank.  These shimmer faintly with prismatic light.
 */
const MARSH_GLASS_REED_PLACEMENTS: ReadonlyArray<{ pos: [number, number]; variant: 'marsh_glass_reed' }> = [
  { pos: [50, -16], variant: 'marsh_glass_reed' },   // south-west shallows
  { pos: [61,   8], variant: 'marsh_glass_reed' },   // north bank edge
]

// ─── Main builder ─────────────────────────────────────────────────────────────

/**
 * Populate `scene` with all Gloamwater Bank geometry and return collidables,
 * fishing nodes, forage nodes, and NPC objects.  Interactables are appended
 * directly to the shared `interactables` array passed in — they are not part
 * of the return value.
 *
 * @param scene         Three.js scene to add meshes to.
 * @param interactables Shared interactables array (mutated in place).
 * @param onCastStart   Fishing callback passed to each bank fishing node.
 * @param onForageStart Foraging callback passed to all bank forage nodes
 *                      (reed_clump and marsh_glass_reed variants).
 */
export function buildShoreline(
  scene: THREE.Scene,
  interactables: Interactable[],
  onCastStart: (node: FishingNode) => void,
  onForageStart: (node: ForageNode) => void,
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

  // ── Phase 91 — Trail corridor landmarks ──────────────────────────────────

  // Shoreline direction sign post at x = +23, z = −2.2 — a sun-bleached post
  // with a carved board pointing east toward the bank.  Readable interaction.
  const sSignGroup = new THREE.Group()
  sSignGroup.position.set(23, 0, -2.2)
  const sShaft = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.9, 0.14), matWood)
  sShaft.position.y = 0.95
  sSignGroup.add(sShaft)
  const sBoard = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.28, 0.1), matVerge)
  sBoard.position.set(0.44, 1.76, 0)
  sBoard.rotation.y = Math.PI / 10
  sSignGroup.add(sBoard)
  scene.add(sSignGroup)

  const sSignInteractable: Interactable = {
    mesh: sSignGroup,
    label: 'Trail Sign',
    interactRadius: 1.8,
    onInteract: () => {
      useNotifications
        .getState()
        .push('A salt-bleached post reads: "Gloamwater Bank — East. Rods welcome."', 'info')
    },
  }
  interactables.push(sSignInteractable)

  // Driftwood log on the south verge at x = +37, z = +2.8 — washed-up ambient prop.
  const driftLog = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.24, 3.5, 7),
    matDarkWood,
  )
  driftLog.position.set(37, 0.2, 2.8)
  driftLog.rotation.z = Math.PI / 2
  driftLog.rotation.y = 0.35
  scene.add(driftLog)

  // Small smooth stones scattered near the driftwood — ambient texture.
  const stonePositions: [number, number, number][] = [
    [35.6, 0.08, 2.4], [36.8, 0.06, 3.2], [38.2, 0.07, 2.9],
  ]
  const matSmooth = new THREE.MeshLambertMaterial({ color: 0xa09888 })
  for (const [sx, sy, sz] of stonePositions) {
    const s = new THREE.Mesh(new THREE.DodecahedronGeometry(0.14, 0), matSmooth)
    s.scale.y = 0.55
    s.position.set(sx, sy, sz)
    s.rotation.y = Math.random() * Math.PI
    scene.add(s)
  }


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
  const matSeaFloor = new THREE.MeshLambertMaterial({ color: 0x486060 })
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
  const matFireRing = new THREE.MeshLambertMaterial({ color: 0x8e8680 })
  const fireRing = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.12, 6, 12), matFireRing)
  fireRing.rotation.x = -Math.PI / 2
  fireRing.position.set(47, 0.12, -6)
  scene.add(fireRing)
  // Fire stones (four rough dodecahedra around the ring)
  const matFireStone = new THREE.MeshLambertMaterial({ color: 0x8e8680 })
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
    onInteract: () => useDialogueStore.getState().openDialogue('Brin Salt (Fisher)'),
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

  // ── Reed forage nodes along the Gloamwater Bank ─────────────────────────────
  const reedForageNodes = buildForageNodesAt(
    scene,
    interactables,
    REED_PLACEMENTS,
    onForageStart,
    'shore_forage',
  )

  // ── Marsh Glass Reed nodes (Phase 58) ────────────────────────────────────────
  const glassReedForageNodes = buildForageNodesAt(
    scene,
    interactables,
    MARSH_GLASS_REED_PLACEMENTS,
    onForageStart,
    'shore_glass_reed',
  )

  const forageNodes = [...reedForageNodes, ...glassReedForageNodes]

  return { collidables, fishingNodes, forageNodes, npcs }
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
  mat: THREE.Material,
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
  mat: THREE.Material,
): THREE.Mesh {
  return _addBox(scene, w, h, d, x, y, z, mat)
}
