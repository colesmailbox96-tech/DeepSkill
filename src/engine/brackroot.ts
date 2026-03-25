/**
 * Phase 35 — Brackroot Trail Zone
 * Phase 91 — Content Density Pass (ambient props, trail landmarks, interaction points)
 *
 * Builds the first combat-adjacent route leading south out of Hushwood:
 *   - a connecting dirt trail from the Hushwood south gate to the trail clearing,
 *   - dense undergrowth terrain with a darker palette,
 *   - tree border and canopy set pieces along the sides of the trail,
 *   - 5 woodcutting nodes (2 saplings, 2 ashwood, 1 ironbark deeper in),
 *   - 2 hostile creature spawn zones (Snarl Whelp and Brackroot Crawler),
 *   - one hidden cache interactable tucked off the main path.
 *
 * Phase 91 additions:
 *   - Trail marker post (z = +22) — readable interaction giving directional info
 *   - Stone cairn landmark (x = +2, z = +30) — mid-trail visual anchor
 *   - Fallen mossy log (x = −5, z = +41) — trail edge ambient prop
 *   - Gnarled root cluster (x = +9, z = +55) — clearing ambient prop
 *   - Deadwood stakes (x = −15, z = +69) — deep-clearing atmosphere marker
 *
 * The Hushwood south boundary wall was split in hushwood.ts to create a 6-unit
 * gap at x = 0 so the player can walk south along the road toward this zone.
 *
 * Spatial layout (top-down; z increases southward in Three.js):
 *
 *   Hushwood settlement    z =   0  (centre)
 *   Hushwood south gate    z = +19  (6-unit gap at x = 0)
 *   Trail corridor         z = +19  →  z = +46  (27 units long, 6 units wide)
 *   Brackroot clearing     z = +46  →  z = +82  (36 units deep)
 *   South boundary         z = +82
 *   West boundary          x = −18
 *   East boundary          x = +18
 */

import * as THREE from 'three'
import type { Interactable } from './interactable'
import { buildTreeNodesAt } from './woodcutting'
import type { TreeNode, TreeVariant } from './woodcutting'
import { useNotifications } from '../store/useNotifications'
import { useGameStore } from '../store/useGameStore'
import { getItem } from '../data/items/itemRegistry'

// ─── Shared materials ─────────────────────────────────────────────────────────

const matTrail      = new THREE.MeshLambertMaterial({ color: 0x5c4a32 })
const matUndergrowth = new THREE.MeshLambertMaterial({ color: 0x4a5c38 })
const matVerge      = new THREE.MeshLambertMaterial({ color: 0x3d4f2e })
const matDarkMoss   = new THREE.MeshLambertMaterial({ color: 0x2e3d22 })
const matLog        = new THREE.MeshLambertMaterial({ color: 0x6b4c28 })
const matStone      = new THREE.MeshLambertMaterial({ color: 0x7a7268 })
const matCache      = new THREE.MeshLambertMaterial({ color: 0x8a7248 })
const matLantern    = new THREE.MeshStandardMaterial({
  color: 0xffcc44,
  emissive: new THREE.Color(0xff8800),
  emissiveIntensity: 0.75,
  roughness: 0.5,
})
const matBound = new THREE.MeshLambertMaterial({ visible: false })

// ─── Public result type ───────────────────────────────────────────────────────

export interface BrackrootResult {
  /** Collidable meshes — appended to the global collidables array in App.tsx. */
  collidables: THREE.Mesh[]
  /** Live tree nodes for per-frame respawn ticking. */
  treeNodes: TreeNode[]
}

// ─── Tree placements (Brackroot clearing) ────────────────────────────────────

/**
 * Five woodcutting trees placed within the Brackroot clearing.
 *
 *   2 × Ash Sapling       — scattered near the trail entrance to the clearing
 *   2 × Ashwood Tree      — mid-clearing, flanking the path
 *   1 × Ironbark Youngling — deeper south (level 5 requirement)
 */
const BRACKROOT_TREE_PLACEMENTS: ReadonlyArray<{
  pos: [number, number]
  variant: TreeVariant
}> = [
  { pos: [ -6, 50], variant: 'sapling'  },  // trail-left sapling
  { pos: [  7, 52], variant: 'sapling'  },  // trail-right sapling
  { pos: [-11, 60], variant: 'ashwood'  },  // west-clearing ashwood
  { pos: [ 10, 63], variant: 'ashwood'  },  // east-clearing ashwood
  { pos: [ -2, 74], variant: 'ironbark' },  // deep-south ironbark
]

// ─── Main builder ─────────────────────────────────────────────────────────────

/**
 * Populate `scene` with all Brackroot Trail geometry and return collidables
 * and tree nodes.  Interactables are appended directly to the shared
 * `interactables` array passed in.
 *
 * @param scene         Three.js scene to add meshes to.
 * @param interactables Shared interactables array (mutated in place).
 * @param onChopStart   Woodcutting callback passed to each tree node.
 */
export function buildBrackroot(
  scene: THREE.Scene,
  interactables: Interactable[],
  onChopStart: (node: TreeNode) => void,
): BrackrootResult {
  const collidables: THREE.Mesh[] = []

  // ── Connecting trail (z = +19 → +46, x = −3 → +3) ────────────────────────
  // Dirt track running south from the Hushwood south gate.
  const trail = new THREE.Mesh(new THREE.PlaneGeometry(4, 27), matTrail)
  trail.rotation.x = -Math.PI / 2
  trail.position.set(0, 0.01, 32.5) // centre of z +19 to +46
  scene.add(trail)

  // Undergrowth verge either side of the trail
  const vergeW = new THREE.Mesh(new THREE.PlaneGeometry(3, 27), matVerge)
  vergeW.rotation.x = -Math.PI / 2
  vergeW.position.set(-4.5, 0.005, 32.5)
  scene.add(vergeW)

  const vergeE = new THREE.Mesh(new THREE.PlaneGeometry(3, 27), matVerge)
  vergeE.rotation.x = -Math.PI / 2
  vergeE.position.set(4.5, 0.005, 32.5)
  scene.add(vergeE)

  // Corridor walls — keep player on the 6-unit-wide trail.
  const corrW = _addWall(scene, 0.4, 6, 27, -3.2, 3, 32.5, matBound)
  const corrE = _addWall(scene, 0.4, 6, 27,  3.2, 3, 32.5, matBound)
  collidables.push(corrW, corrE)

  // ── Brackroot clearing floor (z = +46 → +82, x = −18 → +18) ─────────────
  const clearingFloor = new THREE.Mesh(new THREE.PlaneGeometry(36, 36), matUndergrowth)
  clearingFloor.rotation.x = -Math.PI / 2
  clearingFloor.position.set(0, 0.005, 64) // centre: (46 + 82) / 2 = 64
  scene.add(clearingFloor)

  // Dark moss patches — add visual texture variety
  const mossPatchA = new THREE.Mesh(new THREE.PlaneGeometry(8, 6), matDarkMoss)
  mossPatchA.rotation.x = -Math.PI / 2
  mossPatchA.position.set(-5, 0.01, 58)
  scene.add(mossPatchA)

  const mossPatchB = new THREE.Mesh(new THREE.PlaneGeometry(6, 9), matDarkMoss)
  mossPatchB.rotation.x = -Math.PI / 2
  mossPatchB.position.set(9, 0.01, 70)
  scene.add(mossPatchB)

  const mossPatchC = new THREE.Mesh(new THREE.PlaneGeometry(10, 7), matDarkMoss)
  mossPatchC.rotation.x = -Math.PI / 2
  mossPatchC.position.set(-3, 0.01, 78)
  scene.add(mossPatchC)

  // ── Zone boundary walls ────────────────────────────────────────────────────

  // South wall — split around the Marrowfen corridor entrance (x = −8 → +8).
  // The 36-unit span (x = −18 → +18) is broken into two 10-unit segments so
  // the 16-unit gap in the centre aligns with the Marrowfen connecting corridor.
  //   West half: x = −18 → −8, centre x = −13
  //   East half: x = +8 → +18, centre x = +13
  const wallSW = _addWall(scene, 10, 6, 0.4, -13, 3, 82, matBound)
  const wallSE = _addWall(scene, 10, 6, 0.4,  13, 3, 82, matBound)
  // West wall
  const wallW = _addWall(scene, 0.4, 6, 36, -18, 3, 64, matBound)
  // East wall
  const wallE = _addWall(scene, 0.4, 6, 36, 18, 3, 64, matBound)
  collidables.push(wallSW, wallSE, wallW, wallE)

  // ── Set pieces ────────────────────────────────────────────────────────────

  // ── Phase 91 — Trail corridor landmarks ──────────────────────────────────

  // Trail marker post at z = +22 — a short weathered wooden post driven into
  // the verge with a rough-carved arrow pointing south.  Readable interaction.
  const markerPost = new THREE.Group()
  markerPost.position.set(-3.6, 0, 22)
  // Post shaft
  const markerShaft = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.8, 0.14), matLog)
  markerShaft.position.y = 0.9
  markerPost.add(markerShaft)
  // Horizontal sign board
  const markerBoard = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.28, 0.1), matCache)
  markerBoard.position.set(0.36, 1.72, 0)
  markerPost.add(markerBoard)
  scene.add(markerPost)

  const markerInteractable: Interactable = {
    mesh: markerPost,
    label: 'Trail Marker',
    interactRadius: 1.8,
    onInteract: () => {
      useNotifications
        .getState()
        .push('A weathered post reads: "Brackroot Trail — South. Mind the dark."', 'info')
    },
  }
  interactables.push(markerInteractable)

  // Stone cairn at mid-corridor (x = +2, z = +30) — stacked rock landmark.
  const cairnBase = new THREE.Mesh(new THREE.DodecahedronGeometry(0.36, 0), matStone)
  cairnBase.scale.y = 0.58
  cairnBase.position.set(2, 0.21, 30)
  scene.add(cairnBase)
  const cairnMid = new THREE.Mesh(new THREE.DodecahedronGeometry(0.26, 0), matStone)
  cairnMid.scale.y = 0.62
  cairnMid.position.set(2.04, 0.58, 30.05)
  scene.add(cairnMid)
  const cairnTop = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), matStone)
  cairnTop.position.set(1.98, 0.88, 29.96)
  scene.add(cairnTop)

  // Fallen mossy log across the west verge at z = +41 — ambient border prop.
  const mossyLog = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 4.0, 7), matLog)
  mossyLog.position.set(-5, 0.24, 41)
  mossyLog.rotation.z = Math.PI / 2 // lay flat
  mossyLog.rotation.y = 0.2
  scene.add(mossyLog)

  // ── Phase 91 — Clearing ambient props ────────────────────────────────────

  // Gnarled root cluster on the east verge of the clearing (x = +9, z = +55).
  // Three interlocked root arcs — visual texture, no collision.
  for (let i = 0; i < 3; i++) {
    const rootArc = new THREE.Mesh(
      new THREE.TorusGeometry(0.4 + i * 0.15, 0.06 + i * 0.02, 5, 10, Math.PI * 0.7),
      matLog,
    )
    rootArc.position.set(9 + i * 0.3, 0.1, 55 + i * 0.4)
    rootArc.rotation.x = Math.PI / 2
    rootArc.rotation.z = (i / 3) * Math.PI
    scene.add(rootArc)
  }

  // Deadwood stakes at deep-clearing edge (x = −15, z = +69) — three short
  // blackened stakes, as if driven by an old boundary marker.
  const stakePositions: [number, number][] = [[-15, 69], [-14.3, 70.2], [-15.6, 70.8]]
  for (const [sx, sz] of stakePositions) {
    const stake = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.9, 5), matLog)
    stake.position.set(sx, 0.45, sz)
    stake.rotation.z = (Math.random() - 0.5) * 0.25
    scene.add(stake)
  }

  // Trail entrance marker — a weathered wooden post with a dim lantern.
  _addBox(scene, 0.15, 2.2, 0.15, 4, 1.1, 47.5, matLog)
  const lanternMesh = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.26, 0.26), matLantern)
  lanternMesh.position.set(4, 2.5, 47.5)
  scene.add(lanternMesh)
  const trailLight = new THREE.PointLight(0xd07820, 1.6, 12)
  trailLight.position.set(4, 2.7, 47.5)
  scene.add(trailLight)

  // Fallen log — blocking the west side of the clearing entrance (deco, collidable)
  const fallenLog = _addBox(scene, 4.5, 0.45, 0.55, -9.5, 0.22, 47, matLog)
  fallenLog.rotation.y = 0.18
  collidables.push(fallenLog)

  // Mossy boulders flanking the middle of the clearing
  const boulder1 = _addBox(scene, 1.2, 0.9, 1.1, -14, 0.45, 61, matStone)
  boulder1.rotation.y = 0.4
  collidables.push(boulder1)

  const boulder2 = _addBox(scene, 1.0, 0.75, 0.9, 14.5, 0.38, 67, matStone)
  boulder2.rotation.y = -0.3
  collidables.push(boulder2)

  const boulder3 = _addBox(scene, 0.85, 0.65, 0.8, -13, 0.32, 73, matStone)
  boulder3.rotation.y = 0.9
  collidables.push(boulder3)

  // Twisted dead tree trunk (purely decorative, no interaction) — deep south
  _addBox(scene, 0.22, 3.2, 0.22, 15, 1.6, 75, matLog)

  // ── Hidden cache ─────────────────────────────────────────────────────────
  // A small stone-covered box tucked behind the east boulder cluster.
  // First interaction: grants one Waystone Fragment and reveals the cache is opened.
  // Subsequent interactions: inform the player it has already been looted.
  let cacheOpened = false

  const cacheGroup = new THREE.Group()
  cacheGroup.position.set(15.5, 0, 71)
  scene.add(cacheGroup)

  // Chest base
  const chestBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.35, 0.5),
    matCache.clone(),
  )
  chestBase.position.y = 0.17
  cacheGroup.add(chestBase)

  // Chest lid (slightly darker, angled)
  const chestLid = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.18, 0.5),
    matCache.clone(),
  )
  chestLid.position.set(0, 0.44, 0)
  cacheGroup.add(chestLid)

  // Stone camouflage on top
  const stoneCover = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.28, 0),
    matStone.clone(),
  )
  stoneCover.scale.set(1.5, 0.5, 1.2)
  stoneCover.position.set(0.05, 0.55, 0.02)
  cacheGroup.add(stoneCover)

  const cacheInteractable: Interactable = {
    mesh: cacheGroup,
    label: 'Hidden Cache',
    interactRadius: 2.0,
    onInteract: () => {
      if (cacheOpened) {
        useNotifications.getState().push('The cache has already been looted.', 'info')
        return
      }

      // Inventory capacity check — addItem is a silent no-op when the slot is
      // new and the inventory is full.  Guard here so the cache isn't consumed
      // without delivering the reward.
      const { addItem, inventory } = useGameStore.getState()
      const itemDef = getItem('waystone_fragment')
      const itemName = itemDef?.name ?? 'Waystone Fragment'
      const alreadyStacked = inventory.slots.some((s) => s != null && s.id === 'waystone_fragment')
      const inventoryFull  = inventory.slots.length >= inventory.maxSlots
      if (inventoryFull && !alreadyStacked) {
        useNotifications
          .getState()
          .push('Your inventory is full — make space before looting the cache.', 'info')
        return
      }

      cacheOpened = true
      cacheInteractable.label = 'Looted Cache'

      // Award the Waystone Fragment
      addItem({ id: 'waystone_fragment', name: itemName, quantity: 1 })

      // Visually open the chest: tilt lid and swap colour
      chestLid.rotation.x = -Math.PI / 3
      chestLid.position.z = -0.15
      ;(chestBase.material as THREE.MeshLambertMaterial).color.set(0xa0895c)

      useNotifications
        .getState()
        .push(`You discover a hidden cache and find a ${itemName}!`, 'success')
    },
  }
  interactables.push(cacheInteractable)

  // ── Woodcutting nodes (5 trees in the clearing) ───────────────────────────
  const treeNodes = buildTreeNodesAt(
    scene,
    interactables,
    BRACKROOT_TREE_PLACEMENTS,
    onChopStart,
    'brackroot_tree',
  )

  return { collidables, treeNodes }
}

// ─── Private helpers ──────────────────────────────────────────────────────────

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
