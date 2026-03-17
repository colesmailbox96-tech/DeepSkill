/**
 * Phase 07 — Hushwood Blockout
 *
 * Builds the starter settlement as a playable spatial layout:
 *   - roads (N-S and E-W dirt tracks)
 *   - 5 simple structures (longhouse, forge/smithy, storage shed, inn, guard hut)
 *   - commons area with central well
 *   - forge area (glowing ember + point light)
 *   - shoreline / pond edge
 *   - invisible boundary walls (collision)
 *
 * Returns the collidable meshes (used by both camera and player collision) and
 * interactable descriptors (passed into the interaction system).
 */

import * as THREE from 'three'
import type { Interactable } from './interactable'
import type { Npc } from './npc'
import { buildNpcs } from './npc'
import { useNotifications } from '../store/useNotifications'

// ─── Shared materials ────────────────────────────────────────────────────────

const matTerrain = new THREE.MeshStandardMaterial({ color: 0x7a6248, roughness: 0.95 })
const matRoad    = new THREE.MeshStandardMaterial({ color: 0x5c4a32, roughness: 0.90 })
const matStone   = new THREE.MeshStandardMaterial({ color: 0x8e8680, roughness: 0.85 })
const matWood    = new THREE.MeshStandardMaterial({ color: 0x9a6c3a, roughness: 0.80 })
const matDark    = new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.90 })
const matCommons = new THREE.MeshStandardMaterial({ color: 0x9a9080, roughness: 0.90 })
const matWater   = new THREE.MeshStandardMaterial({
  color: 0x2a5080,
  roughness: 0.10,
  transparent: true,
  opacity: 0.80,
})
const matShore   = new THREE.MeshStandardMaterial({ color: 0xb0a07a, roughness: 0.95 })
const matEmber   = new THREE.MeshStandardMaterial({
  color: 0xff6600,
  emissive: new THREE.Color(0xff3300),
  emissiveIntensity: 0.9,
  roughness: 0.5,
})
// Boundary walls are invisible collision volumes
const matBound = new THREE.MeshStandardMaterial({ visible: false })

// ─── Public result type ───────────────────────────────────────────────────────

export interface HushwoodResult {
  /** Meshes added to the scene – passed to camera raycaster and player AABB. */
  collidables: THREE.Mesh[]
  /** Interaction descriptors for all named settlement objects and NPCs. */
  interactables: Interactable[]
  /** Live NPC objects returned for per-frame animation via updateNpcs(). */
  npcs: Npc[]
}

// ─── Main builder ────────────────────────────────────────────────────────────

/**
 * Populate `scene` with all Hushwood settlement geometry and return the
 * collidable meshes and interactable descriptors.
 */
export function buildHushwood(scene: THREE.Scene): HushwoodResult {
  const collidables: THREE.Mesh[] = []
  const interactables: Interactable[] = []

  // ── Terrain ground (40 × 40) ─────────────────────────────────────────────
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), matTerrain)
  ground.rotation.x = -Math.PI / 2
  scene.add(ground)

  // ── Roads ────────────────────────────────────────────────────────────────
  // North-south main track
  const roadNS = new THREE.Mesh(new THREE.PlaneGeometry(4, 40), matRoad)
  roadNS.rotation.x = -Math.PI / 2
  roadNS.position.y = 0.01
  scene.add(roadNS)

  // East-west cross track
  const roadEW = new THREE.Mesh(new THREE.PlaneGeometry(40, 4), matRoad)
  roadEW.rotation.x = -Math.PI / 2
  roadEW.position.y = 0.01
  scene.add(roadEW)

  // ── Commons area ─────────────────────────────────────────────────────────
  // Stone-paved disc at (0, 0, 3)
  const commonsPad = new THREE.Mesh(
    new THREE.CylinderGeometry(5, 5, 0.06, 20),
    matCommons,
  )
  commonsPad.position.set(0, 0.01, 3)
  scene.add(commonsPad)

  // Central well: stone base + wooden post
  const wellBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.6, 0.7, 0.5, 12),
    matStone,
  )
  wellBase.position.set(0, 0.25, 3)
  scene.add(wellBase)
  collidables.push(wellBase)

  const wellPost = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 1.4, 6),
    matWood,
  )
  wellPost.position.set(0, 1.2, 3)
  scene.add(wellPost)

  // ── Structures ────────────────────────────────────────────────────────────

  // 1. Longhouse / Village Hall — north center
  //    8 wide × 4 tall × 5 deep, front face at z = −7.5
  const hall = _addStructure(scene, 8, 4, 5, 0, -10, matStone)
  collidables.push(hall)
  interactables.push({
    mesh: hall,
    label: 'Village Hall',
    interactRadius: 3.5,
    onInteract: () => useNotifications.getState().push('Entered Village Hall', 'info'),
  })

  // 2. Forge / Smithy — east
  //    5 wide × 3.5 tall × 5 deep
  const forge = _addStructure(scene, 5, 3.5, 5, 10, 3, matDark)
  collidables.push(forge)
  interactables.push({
    mesh: forge,
    label: 'Smithy Forge',
    interactRadius: 3.5,
    onInteract: () => useNotifications.getState().push('Approached Smithy Forge', 'info'),
  })

  // Forge area: glowing ember box in front of smithy
  const ember = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 0.7), matEmber)
  ember.position.set(7.8, 0.35, 3)
  scene.add(ember)

  // Warm point light above the forge mouth
  const forgeLight = new THREE.PointLight(0xff5500, 3, 10)
  forgeLight.position.set(7.5, 2.0, 3)
  scene.add(forgeLight)

  // 3. Storage Shed — west
  //    5 wide × 3 tall × 4 deep
  const storage = _addStructure(scene, 5, 3, 4, -10, 3, matWood)
  collidables.push(storage)
  interactables.push({
    mesh: storage,
    label: 'Storage Shed',
    interactRadius: 3.0,
    onInteract: () => useNotifications.getState().push('Opened Storage Shed', 'info'),
  })

  // 4. Inn / Tavern — south
  //    7 wide × 4 tall × 6 deep, front face at z ≈ 11
  const inn = _addStructure(scene, 7, 4, 6, 0, 14, matWood)
  collidables.push(inn)
  interactables.push({
    mesh: inn,
    label: 'Mudroot Inn',
    interactRadius: 3.5,
    onInteract: () => useNotifications.getState().push('Entered Mudroot Inn', 'info'),
  })

  // 5. Guard Hut — north-west
  //    3 wide × 2.5 tall × 3 deep
  const hut = _addStructure(scene, 3, 2.5, 3, -11, -9, matStone)
  collidables.push(hut)
  interactables.push({
    mesh: hut,
    label: 'Guard Post',
    interactRadius: 2.5,
    onInteract: () => useNotifications.getState().push('Checked Guard Post', 'info'),
  })

  // ── Shoreline / Pond ─────────────────────────────────────────────────────
  // Sandy bank surrounding the water
  const shore = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), matShore)
  shore.rotation.x = -Math.PI / 2
  shore.position.set(12, 0.01, -11)
  scene.add(shore)

  // Water surface (slightly above shore to avoid z-fighting)
  const water = new THREE.Mesh(new THREE.PlaneGeometry(10, 7), matWater)
  water.rotation.x = -Math.PI / 2
  water.position.set(12, 0.04, -11)
  scene.add(water)

  // Faint blue ambient over the pond
  const pondLight = new THREE.PointLight(0x204870, 0.8, 14)
  pondLight.position.set(12, 1.5, -11)
  scene.add(pondLight)

  // ── Invisible boundary walls ─────────────────────────────────────────────
  // Four thin collision volumes at the settlement perimeter (±19 units)
  const BOUND = 19
  const boundWalls = [
    _addWall(scene, 40, 6, 0.4,  0,      3, -BOUND, matBound), // north
    _addWall(scene, 40, 6, 0.4,  0,      3,  BOUND, matBound), // south
    _addWall(scene, 0.4, 6, 40,  BOUND,  3,  0,     matBound), // east
    _addWall(scene, 0.4, 6, 40, -BOUND,  3,  0,     matBound), // west
  ]
  collidables.push(...boundWalls)

  // ── Phase 08 — NPC placement ─────────────────────────────────────────────
  const npcs = buildNpcs(scene, interactables)

  return { collidables, interactables, npcs }
}

// ─── Private helpers ──────────────────────────────────────────────────────────

/**
 * Add a box-geometry structure at position (x, h/2, z) so its base sits on
 * y = 0.  Returns the created mesh.
 */
function _addStructure(
  scene: THREE.Scene,
  w: number,
  h: number,
  d: number,
  x: number,
  z: number,
  mat: THREE.MeshStandardMaterial,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
  mesh.position.set(x, h / 2, z)
  scene.add(mesh)
  return mesh
}

/** Add a box collision wall at (x, y, z). */
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
