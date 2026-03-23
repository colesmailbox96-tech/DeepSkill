/**
 * Phase 74 — Marrowfen Blockout
 *
 * Adds a dangerous mid-late region south of the Brackroot Bog with a
 * distinct murky, foreboding atmosphere.
 *
 * Zone summary
 * ─────────────
 *  Layout:
 *   Connecting corridor   x = −8 → +8,   z = +50 → +60  (16 wide, 10 deep)
 *   Marrowfen ground      x = −28 → +28, z = +60 → +105 (56 wide, 45 deep)
 *   Centre                (0, +82)
 *
 *  Visual identity — murky fen:
 *   Dark, waterlogged ground with standing murky water channels running
 *   east-west across the fen.  Gnarled, moss-draped mangrove pillars break
 *   the skyline.  Faint bioluminescent spore clusters provide the only
 *   ambient light.  Pale gas vent emissions billow from cracks in the fen
 *   floor in the deeper north area.
 *
 *  Resources:
 *   3 × Marrowfen Spore Cluster nodes  (level 9 foraging, 45 XP, marrowfen_spore)
 *
 *  Hazard:
 *   Gas vent zone (x −14 → +14, z +76 → +92) — toxic miasma that deals
 *   periodic damage.  Carrying a Bog Filter Wrap provides protection.
 *   Registered in hazard.ts; App.tsx processes the tick.
 *
 *  Darkness zone:
 *   The dense canopy over the entire fen (x −28 → +28, z +60 → +105) blocks
 *   most light.  Registered in lighting.ts; a Hollow Lantern negates the
 *   stamina drain.
 *
 *  Creatures (spawned via creature.ts):
 *   Bogfiend   — hulking territorial biped; spawns in deep fen.
 *   Mire Hound — lean, fast predator; spawns near the fen entrance.
 *
 *  Atmosphere:
 *   A sickly, dim green-yellow fill light hangs over the fen interior.
 *   Two gas-vent glow points provide a pale sulphurous light in the north.
 *   Spore clusters emit a soft violet bioluminescence.
 *
 * Access:
 *   A narrow muddy corridor (z = +50 → +60, x = −8 → +8) connects the
 *   Brackroot Bog to the Marrowfen entrance.  Invisible boundary walls
 *   close the corridor on its north and south sides.
 */

import * as THREE from 'three'
import type { Interactable } from './interactable'
import { buildForageNodesAt } from './foraging'
import type { ForageNode } from './foraging'

// ─── Zone bounds (exported for App.tsx region checks) ─────────────────────────

export const MF_MIN_X = -28
export const MF_MAX_X =  28
export const MF_MIN_Z =  60
export const MF_MAX_Z = 105

// ─── Shared materials ─────────────────────────────────────────────────────────

/** Waterlogged, dark fen ground — almost black mud. */
const matFenGround = new THREE.MeshStandardMaterial({ color: 0x1a1e18, roughness: 0.99 })
/** Connecting corridor — slightly lighter mud path from the bog. */
const matCorridor  = new THREE.MeshStandardMaterial({ color: 0x2a2c22, roughness: 0.97 })
/** Murky water channel surface — dark olive-brown with slight sheen. */
const matChannel   = new THREE.MeshStandardMaterial({
  color: 0x1e2a18,
  roughness: 0.40,
  metalness: 0.10,
})
/** Gnarled mangrove pillar bark — dark, twisted, organic. */
const matMangrove  = new THREE.MeshStandardMaterial({ color: 0x2a2218, roughness: 0.95 })
/** Gas vent crack — pale sulphur-tinted stone. */
const matVentCrack = new THREE.MeshStandardMaterial({
  color: 0x6a6a2a,
  emissive: new THREE.Color(0x303010),
  emissiveIntensity: 0.5,
  roughness: 0.80,
})
/** Spore cluster cap — bioluminescent pale violet. */
const matSpore = new THREE.MeshStandardMaterial({
  color: 0xd4b8e0,
  emissive: new THREE.Color(0x8860a8),
  emissiveIntensity: 0.7,
  roughness: 0.60,
})
/** Invisible collision boundary. */
const matBound = new THREE.MeshStandardMaterial({ visible: false })

// ─── Public result type ───────────────────────────────────────────────────────

export interface MarrowfenResult {
  /** Collidable meshes appended to the global collidables array. */
  collidables: THREE.Mesh[]
  /** Live Marrowfen Spore forage nodes for per-frame respawn ticking. */
  forageNodes: ForageNode[]
}

// ─── Forage node placements ───────────────────────────────────────────────────

/**
 * Three Marrowfen Spore Cluster nodes scattered through the fen.
 * Placed away from the dangerous gas vent zone so low-level players can
 * harvest at least one node before encountering the worst hazards.
 */
const MF_SPORE_PLACEMENTS: ReadonlyArray<{
  pos: [number, number]
  variant: 'marrowfen_spore'
}> = [
  { pos: [ -18, 66], variant: 'marrowfen_spore' },   // near west entrance margin
  { pos: [  14, 75], variant: 'marrowfen_spore' },   // mid-fen east bank
  { pos: [  -8, 96], variant: 'marrowfen_spore' },   // deep north near a mangrove
]

// ─── Main builder ─────────────────────────────────────────────────────────────

/**
 * Populate `scene` with all Marrowfen geometry and return collidables and
 * forage nodes.  Interactables are appended directly to the shared array.
 *
 * @param scene         Three.js scene to add meshes to.
 * @param interactables Shared interactables array (mutated in place).
 * @param onForageStart Foraging callback passed to each spore node.
 */
export function buildMarrowfen(
  scene: THREE.Scene,
  interactables: Interactable[],
  onForageStart: (node: ForageNode) => void,
): MarrowfenResult {
  const collidables: THREE.Mesh[] = []

  // ── Connecting corridor (x = −8 → +8, z = +50 → +60) ─────────────────────
  // A narrow muddy path leading south from the bog into the fen entrance.
  const corridor = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), matCorridor)
  corridor.rotation.x = -Math.PI / 2
  corridor.position.set(0, 0.01, 55)
  scene.add(corridor)

  // Invisible corridor walls keep the player on the 16-unit-wide passage.
  const corrW = _addWall(scene, 0.4, 5, 10, -8.2, 2.5, 55, matBound)
  const corrE = _addWall(scene, 0.4, 5, 10,  8.2, 2.5, 55, matBound)
  collidables.push(corrW, corrE)

  // ── Fen main ground (x = −28 → +28, z = +60 → +105) ─────────────────────
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(56, 45), matFenGround)
  ground.rotation.x = -Math.PI / 2
  ground.position.set(0, 0.01, 82.5)
  scene.add(ground)

  // ── Boundary walls ────────────────────────────────────────────────────────
  // South wall (z = +60): full 56-unit span; corridor entrance is on the
  // north side of this wall (z = +50 → +60) at x = −8 → +8.
  //   West half:  x = −28 → −8 (20-unit span, centre x = −18)
  //   East half:  x = +8  → +28 (20-unit span, centre x = +18)
  const boundSW = _addWall(scene, 20, 5, 0.4, -18, 2.5, 59.8, matBound)
  const boundSE = _addWall(scene, 20, 5, 0.4,  18, 2.5, 59.8, matBound)
  // North wall (z = +105)
  const boundN  = _addWall(scene, 56, 5, 0.4,   0, 2.5, 105.2, matBound)
  // West wall (x = −28)
  const boundW  = _addWall(scene, 0.4, 5, 45, -28.2, 2.5, 82.5, matBound)
  // East wall (x = +28)
  const boundE  = _addWall(scene, 0.4, 5, 45,  28.2, 2.5, 82.5, matBound)
  collidables.push(boundSW, boundSE, boundN, boundW, boundE)

  // ── Murky water channels ──────────────────────────────────────────────────
  // Three east-west channels of standing water cross the fen at different
  // depths.  Slightly raised above the ground plane for a wet-surface effect.
  // These are visual only — the XZ-only collision system treats them as flat.
  _addChannel(scene,  0, 68, 40, 2.8)   // shallow entrance channel
  _addChannel(scene,  0, 80, 50, 3.4)   // wide mid-fen channel
  _addChannel(scene,  0, 94, 38, 2.2)   // deep north channel near vents

  // ── Gnarled mangrove pillars ──────────────────────────────────────────────
  // Twisted column-like roots rising from the fen floor; provide atmosphere
  // and serve as visual landmarks.  Collidable trunks give the zone texture.
  const mp1 = _addMangrove(scene, -22, 64)
  const mp2 = _addMangrove(scene,  20, 71)
  const mp3 = _addMangrove(scene,  -5, 88)
  const mp4 = _addMangrove(scene,  18, 97)
  const mp5 = _addMangrove(scene, -20, 100)
  collidables.push(mp1, mp2, mp3, mp4, mp5)

  // ── Gas vent cracks ───────────────────────────────────────────────────────
  // Three cracked floor sections emit visual sulphurous glow — the hazard
  // zone defined in hazard.ts covers the area around these emitters.
  _addVentCrack(scene, -6, 80)
  _addVentCrack(scene,  8, 86)
  _addVentCrack(scene, -4, 90)

  // ── Spore cluster visual emitters ─────────────────────────────────────────
  // Decorative glowing spore beds near (but not always identical to) the
  // forage node positions, giving the fen a distinctive bioluminescent feel.
  _addSporeCluster(scene, -18, 66)
  _addSporeCluster(scene,  14, 75)
  _addSporeCluster(scene,  -8, 96)

  // ── Atmosphere lighting ───────────────────────────────────────────────────
  // A sickly, dim green-yellow fill unique to the fen interior.
  const fenAmbient = new THREE.PointLight(0x2a3010, 1.2, 60)
  fenAmbient.position.set(0, 5, 82)
  scene.add(fenAmbient)

  // Two gas-vent glow points in the hazard sub-zone.
  const ventGlow1 = new THREE.PointLight(0x606018, 2.0, 18)
  ventGlow1.position.set(-4, 1.2, 84)
  scene.add(ventGlow1)

  const ventGlow2 = new THREE.PointLight(0x505014, 1.6, 14)
  ventGlow2.position.set(8, 1.0, 90)
  scene.add(ventGlow2)

  // Bioluminescent spore glow — soft violet light pooling near the node beds.
  const sporeGlow = new THREE.PointLight(0x6040a0, 1.4, 22)
  sporeGlow.position.set(-4, 0.8, 80)
  scene.add(sporeGlow)

  // ── Marrowfen Spore forage nodes ──────────────────────────────────────────
  const forageNodes = buildForageNodesAt(
    scene,
    interactables,
    MF_SPORE_PLACEMENTS,
    onForageStart,
    'marrowfen_spore',
  )

  return { collidables, forageNodes }
}

// ─── Private helpers ──────────────────────────────────────────────────────────

/** Add a flat, slightly-raised water channel at (centreX, centreZ). */
function _addChannel(
  scene: THREE.Scene,
  cx: number,
  cz: number,
  width: number,
  depth: number,
): void {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    matChannel,
  )
  mesh.rotation.x = -Math.PI / 2
  mesh.position.set(cx, 0.03, cz)
  scene.add(mesh)
}

/**
 * Add a gnarled mangrove pillar (collidable trunk) at (x, z).
 * Returns the trunk mesh for collision registration.
 */
function _addMangrove(scene: THREE.Scene, x: number, z: number): THREE.Mesh {
  const trunkH = 5.5 + Math.random() * 2
  const trunk  = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.42, trunkH, 7),
    matMangrove,
  )
  trunk.position.set(x, trunkH / 2, z)
  trunk.rotation.y = Math.random() * Math.PI
  // Slight lean for organic feel.
  trunk.rotation.z = (Math.random() - 0.5) * 0.12
  scene.add(trunk)

  // A spreading root mass at the base — visual only.
  const root = new THREE.Mesh(
    new THREE.CylinderGeometry(0.85, 1.0, 0.18, 8),
    matMangrove,
  )
  root.position.set(x, 0.09, z)
  scene.add(root)

  return trunk
}

/** Add a gas vent crack disc at (x, z) — emissive, visual only. */
function _addVentCrack(scene: THREE.Scene, x: number, z: number): void {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.75, 0.06, 8),
    matVentCrack,
  )
  mesh.position.set(x, 0.03, z)
  mesh.rotation.y = Math.random() * Math.PI
  scene.add(mesh)
}

/** Add a bioluminescent spore cluster at (x, z) — visual only. */
function _addSporeCluster(scene: THREE.Scene, x: number, z: number): void {
  // Central cap
  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(0.40, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
    matSpore,
  )
  cap.position.set(x, 0.40, z)
  scene.add(cap)

  // Stalk
  const stalk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.10, 0.42, 6),
    matSpore,
  )
  stalk.position.set(x, 0.21, z)
  scene.add(stalk)

  // Two smaller satellite caps
  for (let i = 0; i < 2; i++) {
    const angle  = (i / 2) * Math.PI * 2 + 0.8
    const radius = 0.45 + i * 0.15
    const small  = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 6, 5, 0, Math.PI * 2, 0, Math.PI / 2),
      matSpore,
    )
    small.position.set(
      x + Math.cos(angle) * radius,
      0.22,
      z + Math.sin(angle) * radius,
    )
    scene.add(small)
  }
}

/** Add an invisible collision wall and return it. */
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
