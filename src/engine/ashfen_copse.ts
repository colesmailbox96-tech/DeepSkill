/**
 * Phase 57 — Ashfen Copse Zone
 * Phase 58 — Resource Tier Expansion (adds Duskiron Seam nodes)
 *
 * Introduces a visually distinct advanced gathering-and-combat area northeast
 * of Redwake Quarry, accessible through a gap in the quarry's east cliff wall.
 *
 * Zone summary
 * ─────────────
 *  Layout:
 *   Connecting corridor   x = +20 → +34, z = −76 → −70  (6-unit wide, 14 deep)
 *   Copse ground          x = +34 → +72, z = −54 → −92  (38 wide, 38 deep)
 *   Centre                (53, −73)
 *
 *  Visual identity — mineral wood:
 *   The Ashfen Copse trees have dark charcoal-grey bark streaked with faint
 *   iron-trace mineral glints.  A subtle dark-green atmospheric light replaces
 *   the warm quarry glow.  Ground is dark, mineral-dusted loam.
 *
 *  Resources:
 *   4 × Mineral Ashwood trees  (level 8 woodcutting, 55 XP, mineralwood_log)
 *   3 × Ashfen Resin nodes     (level 5 foraging,    28 XP, ashfen_resin)
 *   3 × Duskiron Seam nodes    (level 10 mining,     50 XP, duskiron_ore)  [Phase 58]
 *
 *  Creatures (spawned via creature.ts):
 *   1 × Hushfang  — sleek charcoal predator (hostile)
 *   1 × Ember Ram — stocky geothermal brute (hostile)
 *
 *  Atmosphere:
 *   A cool teal-grey ambience provided by three low-intensity point lights
 *   (one wide copse fill and two mineral-glow root-bed lights).
 *
 * Access:
 *   quarry.ts splits its east cliff at z = −70 → −76 to create the 6-unit
 *   opening that aligns with the corridor entrance built here.
 */

import * as THREE from 'three'
import type { Interactable } from './interactable'
import { buildTreeNodesAt } from './woodcutting'
import type { TreeNode } from './woodcutting'
import { buildForageNodesAt } from './foraging'
import type { ForageNode } from './foraging'
import { buildRockNodesAt } from './mining'
import type { RockNode } from './mining'

// ─── Shared materials ─────────────────────────────────────────────────────────

/** Dark, mineral-dusted loam ground of the copse. */
const matCopseGround = new THREE.MeshStandardMaterial({ color: 0x28231e, roughness: 0.98 })
/** Connecting corridor ground — slightly lighter mineral dirt. */
const matCorridor    = new THREE.MeshStandardMaterial({ color: 0x3a3228, roughness: 0.95 })
/** Dark stone boulders scattered through the copse. */
const matBoulder     = new THREE.MeshStandardMaterial({ color: 0x3a3540, roughness: 0.90 })
/** Fallen mineral-wood log: dark bark with a slight metallic sheen. */
const matDeadLog     = new THREE.MeshStandardMaterial({
  color: 0x1e1e24,
  roughness: 0.82,
  metalness: 0.08,
})
/** Mineral-trace root glow (emissive, subtle). */
const matRootGlow    = new THREE.MeshStandardMaterial({
  color: 0x405840,
  emissive: new THREE.Color(0x203820),
  emissiveIntensity: 0.6,
  roughness: 0.60,
})
/** Invisible collision boundary. */
const matBound = new THREE.MeshStandardMaterial({ visible: false })

// ─── Public result type ───────────────────────────────────────────────────────

export interface AshfenCopseResult {
  /** Collidable meshes — appended to the global collidables array in App.tsx. */
  collidables: THREE.Mesh[]
  /** Live Mineral Ashwood tree nodes for per-frame respawn ticking. */
  treeNodes: TreeNode[]
  /** Live Ashfen Resin forage nodes for per-frame respawn ticking. */
  forageNodes: ForageNode[]
  /** Live Duskiron ore rock nodes for per-frame respawn ticking. */
  rockNodes: RockNode[]
}

// ─── Tree placements ──────────────────────────────────────────────────────────

/**
 * Four Mineral Ashwood trees placed throughout the copse.
 * World-space (x, z) absolute coordinates.
 */
const ASHFEN_TREE_PLACEMENTS: ReadonlyArray<{
  pos: [number, number]
  variant: 'mineralwood'
}> = [
  { pos: [40, -60], variant: 'mineralwood' },   // south-west of copse
  { pos: [62, -64], variant: 'mineralwood' },   // south-east of copse
  { pos: [44, -80], variant: 'mineralwood' },   // centre-west
  { pos: [64, -84], variant: 'mineralwood' },   // centre-east, near boulder cluster
]

// ─── Resin node placements ────────────────────────────────────────────────────

/**
 * Three Ashfen Resin nodes seeping from mineral-stressed root beds.
 * World-space (x, z) absolute coordinates.
 */
const ASHFEN_RESIN_PLACEMENTS: ReadonlyArray<{
  pos: [number, number]
  variant: 'ashfen_resin'
}> = [
  { pos: [42, -67], variant: 'ashfen_resin' },   // near south-west tree
  { pos: [58, -75], variant: 'ashfen_resin' },   // copse centre
  { pos: [62, -88], variant: 'ashfen_resin' },   // deep north-east corner
]

// ─── Duskiron seam placements (Phase 58) ─────────────────────────────────────

/**
 * Three Duskiron Seam nodes embedded in the copse's mineral-laden rock faces.
 * World-space (x, z) absolute coordinates.
 */
const ASHFEN_DUSKIRON_PLACEMENTS: ReadonlyArray<{
  pos: [number, number]
  variant: 'duskiron'
}> = [
  { pos: [37, -58], variant: 'duskiron' },   // south-west near entrance
  { pos: [68, -72], variant: 'duskiron' },   // east boulder cluster
  { pos: [46, -88], variant: 'duskiron' },   // deep north corner
]

// ─── Main builder ─────────────────────────────────────────────────────────────

/**
 * Populate `scene` with all Ashfen Copse geometry and return collidables,
 * tree nodes, forage nodes, and duskiron rock nodes.  Interactables are
 * appended directly to the shared `interactables` array passed in.
 *
 * @param scene         Three.js scene to add meshes to.
 * @param interactables Shared interactables array (mutated in place).
 * @param onChopStart   Woodcutting callback passed to each tree node.
 * @param onForageStart Foraging callback passed to each resin node.
 * @param onMineStart   Mining callback passed to each duskiron seam node.
 */
export function buildAshfenCopse(
  scene: THREE.Scene,
  interactables: Interactable[],
  onChopStart: (node: TreeNode) => void,
  onForageStart: (node: ForageNode) => void,
  onMineStart: (node: RockNode) => void,
): AshfenCopseResult {
  const collidables: THREE.Mesh[] = []

  // ── Connecting corridor (x = +20 → +34, z = −76 → −70) ───────────────────
  // Narrow mineral-dirt track running east from the quarry cliff gap.
  const corridor = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), matCorridor)
  corridor.rotation.x = -Math.PI / 2
  corridor.position.set(27, 0.01, -73)
  scene.add(corridor)

  // Invisible corridor walls keep the player on the 6-unit-wide track.
  const corrN = _addWall(scene, 14, 6, 0.4, 27, 3, -76.2, matBound)
  const corrS = _addWall(scene, 14, 6, 0.4, 27, 3, -69.8, matBound)
  collidables.push(corrN, corrS)

  // ── Copse ground (x = +34 → +72, z = −54 → −92) ─────────────────────────
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(38, 38), matCopseGround)
  ground.rotation.x = -Math.PI / 2
  ground.position.set(53, 0.01, -73)
  scene.add(ground)

  // ── Boundary walls ────────────────────────────────────────────────────────
  // North wall (z = −92)
  const boundN = _addWall(scene, 38, 6, 0.4, 53, 3, -92.2, matBound)
  // South wall (z = −54) — full 38-unit span; the corridor entrance is on the
  // west side of the copse (at x = +34), not on this boundary.
  const boundS = _addWall(scene, 38, 6, 0.4, 53, 3, -53.8, matBound)
  // East wall (x = +72)
  const boundE = _addWall(scene, 0.4, 6, 38,  72.2, 3, -73, matBound)
  // West wall: split around the corridor mouth (z = −76 → −70) at x = +34.
  //   North half: z = −92 → −76 (16 units deep, center z = −84)
  //   South half: z = −70 → −54 (16 units deep, center z = −62)
  const boundWN = _addWall(scene, 0.4, 6, 16, 33.8, 3, -84, matBound)
  const boundWS = _addWall(scene, 0.4, 6, 16, 33.8, 3, -62, matBound)
  collidables.push(boundN, boundS, boundE, boundWN, boundWS)

  // ── Set pieces — atmosphere boulders ─────────────────────────────────────
  // Scattered large mineral boulders give the copse its "advanced zone" feel.
  const boulder1 = _addBoulder(scene, 1.4, 0.9, 1.2, 66, -83)
  const boulder2 = _addBoulder(scene, 1.1, 0.8, 1.0, 55, -89)
  const boulder3 = _addBoulder(scene, 0.9, 0.7, 1.1, 38, -75)
  const boulder4 = _addBoulder(scene, 1.6, 1.0, 1.3, 70, -60)
  collidables.push(boulder1, boulder2, boulder3, boulder4)

  // ── Set pieces — fallen mineral-wood log ──────────────────────────────────
  // A toppled ancient mineral tree, purely visual.
  const log = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.34, 5.0, 8),
    matDeadLog,
  )
  log.position.set(49, 0.30, -69)
  log.rotation.z = Math.PI / 2
  log.rotation.y = 0.35
  scene.add(log)

  // ── Set pieces — root-glow emitters ──────────────────────────────────────
  // Faint mineral-charged root beds with a very subtle emissive glow, giving
  // the zone an otherworldly atmosphere.
  _addRootGlow(scene, 41, -72)
  _addRootGlow(scene, 63, -82)
  _addRootGlow(scene, 56, -61)

  // ── Atmosphere lighting ───────────────────────────────────────────────────
  // A cool, low-intensity teal-green ambient fill unique to the copse.
  const copseAmbient = new THREE.PointLight(0x203828, 1.4, 48)
  copseAmbient.position.set(53, 4, -73)
  scene.add(copseAmbient)

  // Two mineral-glow point lights seeping from root beds.
  const rootLight1 = new THREE.PointLight(0x304838, 1.8, 20)
  rootLight1.position.set(41, 0.8, -72)
  scene.add(rootLight1)

  const rootLight2 = new THREE.PointLight(0x2e4030, 1.6, 18)
  rootLight2.position.set(63, 0.8, -82)
  scene.add(rootLight2)

  // ── Mineral Ashwood tree nodes ────────────────────────────────────────────
  const treeNodes = buildTreeNodesAt(
    scene,
    interactables,
    ASHFEN_TREE_PLACEMENTS,
    onChopStart,
    'ashfen_tree',
  )

  // ── Ashfen Resin forage nodes ─────────────────────────────────────────────
  const forageNodes = buildForageNodesAt(
    scene,
    interactables,
    ASHFEN_RESIN_PLACEMENTS,
    onForageStart,
    'ashfen_resin',
  )

  // ── Duskiron Seam mining nodes (Phase 58) ─────────────────────────────────
  const rockNodes = buildRockNodesAt(
    scene,
    interactables,
    ASHFEN_DUSKIRON_PLACEMENTS,
    onMineStart,
    'ashfen_rock',
  )

  return { collidables, treeNodes, forageNodes, rockNodes }
}

// ─── Private helpers ──────────────────────────────────────────────────────────

/** Add a rough dodecahedron boulder at (x, 0, z) and return it. */
function _addBoulder(
  scene: THREE.Scene,
  rx: number,
  ry: number,
  rz: number,
  x: number,
  z: number,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8, 0), matBoulder)
  mesh.scale.set(rx, ry, rz)
  mesh.position.set(x, ry * 0.8 * 0.5, z)
  mesh.rotation.y = Math.random() * Math.PI
  scene.add(mesh)
  return mesh
}

/** Add a flat root-glow disc at (x, 0, z) — purely visual. */
function _addRootGlow(scene: THREE.Scene, x: number, z: number): void {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 1.1, 0.08, 10),
    matRootGlow,
  )
  mesh.position.set(x, 0.04, z)
  scene.add(mesh)
}

/** Add an invisible collision wall at (x, y, z) and return it. */
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
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
  mesh.position.set(x, y, z)
  scene.add(mesh)
  return mesh
}
