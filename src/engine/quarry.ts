/**
 * Phase 18 — Quarry Region Slice
 *
 * Builds Redwake Quarry as a playable external zone north of Hushwood:
 *   - a connecting dirt trail from the Hushwood north gate to the quarry entrance,
 *   - quarry basin terrain (rocky, slightly different palette),
 *   - stone cliff walls on three sides (north, east, west) acting as collision
 *     boundaries and giving the basin its "exposed quarry" feel,
 *   - 8 mining nodes (2 loose stone, 3 copper, 3 iron — iron-rich per lore),
 *   - one foreman NPC: Gorven (Quarry Foreman),
 *   - invisible boundary walls for the connecting corridor.
 *
 * The Hushwood north boundary wall has a 6-unit gap at x = 0 (see hushwood.ts)
 * that lines up with the 6-unit-wide trail built here.
 *
 * Spatial layout (top-down, z increases southward in Three.js):
 *
 *   Hushwood settlement    z = 0    (centre)
 *   Hushwood north gate    z = −19  (6-unit gap)
 *   Trail corridor         z = −19  →  z = −52  (33 units long, 6 units wide)
 *   Quarry entrance        z = −52
 *   Quarry basin           z = −52  →  z = −96  (44 units deep)
 *   Quarry north cliff     z = −96
 */

import * as THREE from 'three'
import type { Interactable } from './interactable'
import type { Npc } from './npc'
import { buildRockNodesAt } from './mining'
import type { RockNode } from './mining'
import { useNotifications } from '../store/useNotifications'

// ─── Shared materials ────────────────────────────────────────────────────────

const matRockyGround = new THREE.MeshStandardMaterial({ color: 0x6b6256, roughness: 0.97 })
const matTrailGround = new THREE.MeshStandardMaterial({ color: 0x5c4a32, roughness: 0.92 })
const matCliff       = new THREE.MeshStandardMaterial({ color: 0x736860, roughness: 0.92 })
const matCliffDark   = new THREE.MeshStandardMaterial({ color: 0x5a4e44, roughness: 0.95 })
const matWood        = new THREE.MeshStandardMaterial({ color: 0x9a6c3a, roughness: 0.80 })
const matMetal       = new THREE.MeshStandardMaterial({ color: 0x606878, roughness: 0.60 })
const matCrate       = new THREE.MeshStandardMaterial({ color: 0xa07840, roughness: 0.85 })
const matLantern     = new THREE.MeshStandardMaterial({
  color: 0xffcc44,
  emissive: new THREE.Color(0xff8800),
  emissiveIntensity: 0.8,
  roughness: 0.5,
})
const matBound = new THREE.MeshStandardMaterial({ visible: false })

// ─── Public result type ───────────────────────────────────────────────────────

export interface QuarryResult {
  /** Collidable meshes — appended to the global collidables array in App.tsx. */
  collidables: THREE.Mesh[]
  /** Live quarry rock nodes for per-frame respawn ticking. */
  rockNodes: RockNode[]
  /** Live NPC objects for per-frame ambient sway (the foreman). */
  npcs: Npc[]
}

// ─── Quarry mining node placements ───────────────────────────────────────────

/**
 * Eight mining nodes inside the quarry basin.
 * Positions are world-space (x, z) absolute coordinates.
 *
 *   2 × Loose Stone   — scattered near the quarry entrance
 *   3 × Copper Vein   — mid-basin oxidized seams
 *   3 × Iron Vein     — deeper back of the basin (lore: iron-rich seams)
 */
const QUARRY_ROCK_PLACEMENTS: ReadonlyArray<{ pos: [number, number]; variant: 'loose_stone' | 'copper' | 'iron' }> = [
  { pos: [-14, -57], variant: 'loose_stone' },
  { pos: [ 11, -59], variant: 'loose_stone' },
  { pos: [  -8, -65], variant: 'copper' },
  { pos: [ 14, -69], variant: 'copper' },
  { pos: [ -2, -77], variant: 'copper' },
  { pos: [-15, -72], variant: 'iron'   },
  { pos: [  9, -78], variant: 'iron'   },
  { pos: [  0, -88], variant: 'iron'   },
]

// ─── NPC constants ───────────────────────────────────────────────────────────
// (Ambient sway is driven by updateNpcs() in npc.ts; idleAngle and
//  ambientPhase below are consumed there.)

// ─── Main builder ────────────────────────────────────────────────────────────

/**
 * Populate `scene` with all Redwake Quarry geometry and return collidables,
 * interactables, rock nodes, and NPC objects.
 *
 * @param scene         Three.js scene to add meshes to.
 * @param interactables Shared interactables array (mutated in place).
 * @param onMineStart   Mining callback passed to each rock node.
 */
export function buildQuarry(
  scene: THREE.Scene,
  interactables: Interactable[],
  onMineStart: (node: RockNode) => void,
): QuarryResult {
  const collidables: THREE.Mesh[] = []
  const npcs: Npc[] = []

  // ── Connecting trail (z = −19 → −52, x = −3 → +3) ────────────────────────
  // Dirt road strip continuing the Hushwood N-S road north through the gap.
  const trail = new THREE.Mesh(new THREE.PlaneGeometry(4, 33), matTrailGround)
  trail.rotation.x = -Math.PI / 2
  trail.position.set(0, 0.01, -35.5) // centre of z −19 to −52
  scene.add(trail)

  // Rocky verge either side of the trail
  const vergeW = new THREE.Mesh(new THREE.PlaneGeometry(2, 33), matRockyGround)
  vergeW.rotation.x = -Math.PI / 2
  vergeW.position.set(-4, 0.005, -35.5)
  scene.add(vergeW)

  const vergeE = new THREE.Mesh(new THREE.PlaneGeometry(2, 33), matRockyGround)
  vergeE.rotation.x = -Math.PI / 2
  vergeE.position.set(4, 0.005, -35.5)
  scene.add(vergeE)

  // Invisible corridor walls — keep player on the 6-unit-wide trail (matching
  // the Hushwood north gate opening at x = −3 → +3).
  const corrW = _addWall(scene, 0.4, 6, 33, -3.2, 3, -35.5, matBound)
  const corrE = _addWall(scene, 0.4, 6, 33,  3.2, 3, -35.5, matBound)
  collidables.push(corrW, corrE)

  // ── Quarry basin floor (z = −52 → −96, x = −20 → +20) ───────────────────
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 44), matRockyGround)
  floor.rotation.x = -Math.PI / 2
  floor.position.set(0, 0.01, -74) // centre: (−52 + −96) / 2 = −74
  scene.add(floor)

  // ── Quarry cliff walls (visible stone, also collidable) ───────────────────

  // North cliff — wide back wall of the basin.
  // Center at z = −98 so the inner (south) face aligns with z = −96,
  // matching the stated basin extent.
  const cliffN = _addBox(scene, 40, 10, 4, 0, 5, -98, matCliff)
  collidables.push(cliffN)

  // East cliff — right face of the basin
  const cliffE = _addBox(scene, 4, 10, 44, 22, 5, -74, matCliff)
  collidables.push(cliffE)

  // West cliff — left face of the basin
  const cliffW = _addBox(scene, 4, 10, 44, -22, 5, -74, matCliff)
  collidables.push(cliffW)

  // Cliff ledge detail — a slightly darker narrow shelf along the east and west
  // inner faces, purely visual, adds visual depth.
  // (_addBox already calls scene.add — no extra add needed.)
  _addBox(scene, 0.8, 1.2, 44, 19.6, 1.5, -74, matCliffDark)
  _addBox(scene, 0.8, 1.2, 44, -19.6, 1.5, -74, matCliffDark)

  // ── Set pieces — entrance area ───────────────────────────────────────────

  // Rough wooden post with a lantern at the quarry entrance (right side).
  // (_addBox already calls scene.add — no extra add needed for any set piece.)
  _addBox(scene, 0.18, 2.4, 0.18, 7, 1.2, -53.5, matWood)
  const lanternR = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.28), matLantern)
  lanternR.position.set(7, 2.65, -53.5)
  scene.add(lanternR)
  const lanternLight = new THREE.PointLight(0xffa030, 2.5, 14)
  lanternLight.position.set(7, 2.8, -53.5)
  scene.add(lanternLight)

  // Tool rack — a simple T-shape east of the entrance (horizontal bar + post)
  _addBox(scene, 0.2, 1.6, 0.2, -9, 0.8, -55, matWood)
  _addBox(scene, 1.8, 0.15, 0.2, -9, 1.7, -55, matWood)
  // Pickaxe hanging from rack (metal head + handle)
  _addBox(scene, 0.6, 0.25, 0.1, -9, 1.78, -55.08, matMetal)
  _addBox(scene, 0.08, 1.1, 0.08, -9.3, 1.2, -55, matWood)

  // Ore crates stacked near the east cliff entrance
  const crate1 = _addBox(scene, 0.9, 0.9, 0.9,  14, 0.45, -57, matCrate)
  const crate2 = _addBox(scene, 0.9, 0.9, 0.9,  15, 0.45, -58, matCrate)
  const crate3 = _addBox(scene, 0.9, 0.9, 0.9,  14, 1.35, -57.5, matCrate)
  collidables.push(crate1, crate2, crate3)

  // ── Set pieces — quarry interior ─────────────────────────────────────────

  // Broken cart wheel (flat torus-like) near the centre of the basin
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.12, 6, 12), matWood)
  wheel.rotation.x = Math.PI / 2
  wheel.position.set(-5, 0.12, -72)
  scene.add(wheel)

  // Rubble pile — rough cluster representing excavated rock
  const rubble1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4, 0), matCliffDark)
  rubble1.scale.y = 0.55
  rubble1.position.set(3, 0.22, -83)
  scene.add(rubble1)
  const rubble2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35, 0), matCliffDark)
  rubble2.scale.y = 0.55
  rubble2.position.set(3.8, 0.19, -83.5)
  scene.add(rubble2)
  const rubble3 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 0), matCliffDark)
  rubble3.scale.y = 0.5
  rubble3.position.set(2.6, 0.15, -84)
  scene.add(rubble3)

  // A warm orange glow deep in the quarry (ore-vein heat from lore: Deep Hearts)
  const oreGlow = new THREE.PointLight(0xd06828, 1.2, 18)
  oreGlow.position.set(-4, 1.8, -85)
  scene.add(oreGlow)

  // ── Foreman NPC — Gorven ──────────────────────────────────────────────────
  // Stationed just inside the quarry entrance, facing south toward the trail.
  const foremanGroup = new THREE.Group()
  foremanGroup.position.set(6, 0, -55.5)
  foremanGroup.rotation.y = 0 // facing south (positive Z)

  const foremanBodyMat = new THREE.MeshStandardMaterial({ color: 0x6b4f30, roughness: 0.7 })
  const foremanBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 0.9, 4, 8), foremanBodyMat)
  foremanBody.position.y = 0.7
  foremanGroup.add(foremanBody)

  const foremanDiscMat = new THREE.MeshStandardMaterial({
    color: 0xffe080,
    emissive: new THREE.Color(0xffe080),
    emissiveIntensity: 0.4,
    roughness: 0.5,
  })
  const foremanDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 0.06, 8),
    foremanDiscMat,
  )
  foremanDisc.position.y = 1.85
  foremanGroup.add(foremanDisc)

  scene.add(foremanGroup)

  const foremanInteractable: Interactable = {
    mesh: foremanGroup,
    label: 'Gorven (Quarry Foreman)',
    interactRadius: 2.2,
    onInteract: () =>
      useNotifications
        .getState()
        .push('Gorven: "Keep your pick sharp and your feet clear of loose rubble."', 'info'),
  }
  interactables.push(foremanInteractable)

  const foremanNpc: Npc = {
    mesh: foremanGroup,
    idleAngle: 0,
    ambientPhase: 0.5,
    ambientTime: 0,
  }
  npcs.push(foremanNpc)

  // ── Mining nodes (8 nodes inside the quarry basin) ────────────────────────
  const rockNodes = buildRockNodesAt(
    scene,
    interactables,
    QUARRY_ROCK_PLACEMENTS,
    onMineStart,
    'quarry_rock',
  )

  return { collidables, rockNodes, npcs }
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
