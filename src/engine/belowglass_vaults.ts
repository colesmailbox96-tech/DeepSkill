/**
 * Phase 78 — Belowglass Vaults Entrance Slice
 *
 * Introduces the late-game ruin identity: the Belowglass Vaults threshold, a
 * crystalline pre-Veil sub-structure that lies directly west of the Hollow
 * Vault lower floor.
 *
 * Zone summary
 * ─────────────
 *  Layout:
 *   Threshold chamber   x = −102 → −128, z = −10 → +10  (26 wide, 20 deep)
 *   Connected to Hollow Vault lower floor at x = −98.
 *
 *  Visual identity — vaultglass ruin:
 *   Angular floor tiles of pale grey-blue stone.  Tall fractured vaultglass
 *   pillars rise from the chamber floor, refracting faint bioluminescent
 *   light from within.  Collapsed wall sections expose rough rubble fill
 *   behind the glass cladding.  A dim, cool blue ambient glow fills the hall.
 *
 *  Salvage nodes (Phase 78 tier increase):
 *   3 × Shattered Vaultglass nodes  (Salvaging lvl 5, 35 XP, vault_glass_shard)
 *   3 × Construct Core nodes        (Salvaging lvl 6, 55 XP, construct_plating)
 *   Placed via buildVaultSalvageNodes() in salvage.ts.
 *
 *  Creatures (spawned via creature.ts):
 *   Shard Construct — fast crystalline automaton; spawns near entrance.
 *   Glass Warden    — slow heavy sentinel; patrols inner threshold.
 *
 *  Access gate:
 *   A heavy vaultglass slab seals the threshold entrance at x = −100 until
 *   the player has completed the "Echoes of the Sealed Shaft" task
 *   (tidemark_sealed_shaft).  Uses the Phase 67 GateRequirement framework.
 *
 *  Atmosphere:
 *   A cool blue-white ambient fill light unique to the threshold.
 *   Fractured glass pillars emit a pale refracted glow.
 *   Two point lights near collapsed wall sections simulate skylight breaks.
 */

import * as THREE from 'three'
import type { Interactable } from './interactable'
import { buildGatedDoor, type GatedDoorResult } from './gating'

// ─── Zone bounds (exported for App.tsx region checks) ─────────────────────────

export const BV_MIN_X = -154
export const BV_MAX_X = -98
export const BV_MIN_Z = -14
export const BV_MAX_Z =  14

// ─── Shared materials ─────────────────────────────────────────────────────────

/** Pale grey-blue angular stone floor. */
const matThresholdFloor = new THREE.MeshStandardMaterial({
  color: 0x2a3240,
  roughness: 0.85,
})
/** Dark rubble-fill sections behind the glass cladding. */
const matRubbleFill = new THREE.MeshStandardMaterial({ color: 0x1e1e28, roughness: 0.97 })
/** Fractured vaultglass pillar — pale cyan-blue with faint self-illumination. */
const matVaultGlass = new THREE.MeshStandardMaterial({
  color: 0x7ab8d0,
  roughness: 0.18,
  metalness: 0.12,
  emissive: new THREE.Color(0x3a6878),
  emissiveIntensity: 0.45,
})
/** Pillar base socket — dark polished stone. */
const matPillarBase = new THREE.MeshStandardMaterial({ color: 0x1e2830, roughness: 0.88 })
/** Invisible collision boundary. */
const matBound = new THREE.MeshStandardMaterial({ visible: false })

// ─── Public result type ───────────────────────────────────────────────────────

export interface BelowglassVaultsResult {
  /** Collidable meshes appended to the global collidables array. */
  collidables: THREE.Mesh[]
  /**
   * The access gate slab result.  App.tsx calls pollOpened() each frame and,
   * when true, removes the slab from collidables and interactables.
   */
  gateDoor: GatedDoorResult
  /**
   * Phase 84 — The inner sanctum boss chamber door result.  Sealed until the
   * player has Salvaging level 5.  App.tsx calls pollOpened() each frame and,
   * when true, removes the slab from collidables and interactables.
   */
  sanctumDoor: GatedDoorResult
}

// ─── Main builder ─────────────────────────────────────────────────────────────

/**
 * Populate `scene` with all Belowglass Vaults threshold geometry.
 * Returns collidables and the gated access door handle.
 *
 * @param scene         Three.js scene to add meshes to.
 * @param interactables Shared interactables array (mutated in place).
 */
export function buildBelowglassVaults(
  scene: THREE.Scene,
  interactables: Interactable[],
): BelowglassVaultsResult {
  const collidables: THREE.Mesh[] = []

  // ── Threshold floor (x = −102 → −128, z = −10 → +10) ─────────────────────
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(26, 20), matThresholdFloor)
  floor.rotation.x = -Math.PI / 2
  floor.position.set(-115, 0.01, 0)
  scene.add(floor)

  // Narrow entry strip bridging the Hollow Vault lower floor to the threshold
  // (x = −98 → −102).  Fills the visual gap at the Belowglass gate/slab.
  const entryStrip = new THREE.Mesh(new THREE.PlaneGeometry(4, 20), matThresholdFloor)
  entryStrip.rotation.x = -Math.PI / 2
  entryStrip.position.set(-100, 0.01, 0)
  scene.add(entryStrip)

  // ── Boundary walls ─────────────────────────────────────────────────────────
  // North wall (z = −10)
  const boundN  = _addWall(scene, 26, 6, 0.4,  -115, 3, -10.2, matBound)
  // South wall (z = +10)
  const boundS  = _addWall(scene, 26, 6, 0.4,  -115, 3,  10.2, matBound)
  // West wall (x = −128)
  const boundW  = _addWall(scene, 0.4, 6, 20,  -128.2, 3, 0, matBound)
  // East wall gap: opening (z = −6 → +6) centred at z = 0; two flanking sections.
  //   East-north flange: z = −10 → −6 (4-unit span, centre z = −8)
  //   East-south flange: z = +6 → +10 (4-unit span, centre z = +8)
  const boundEN = _addWall(scene, 0.4, 6, 4,  -101.8, 3, -8, matBound)
  const boundES = _addWall(scene, 0.4, 6, 4,  -101.8, 3,  8, matBound)
  collidables.push(boundN, boundS, boundW, boundEN, boundES)

  // ── Rubble-fill side sections ──────────────────────────────────────────────
  // Low rubble piles along the north and south walls give the hall a partially-
  // collapsed feel while providing visual cover for the boundary walls.
  _addRubbleFill(scene, -106, -9)
  _addRubbleFill(scene, -114,  9)
  _addRubbleFill(scene, -122, -9)
  _addRubbleFill(scene, -126,  8)

  // ── Fractured vaultglass pillars ───────────────────────────────────────────
  // Tall glassy columns that serve as the zone's primary visual landmark.
  // Collidable so the player must navigate around them.
  const p1 = _addGlassPillar(scene, -107, -6)
  const p2 = _addGlassPillar(scene, -107,  6)
  const p3 = _addGlassPillar(scene, -116, -5)
  const p4 = _addGlassPillar(scene, -116,  5)
  const p5 = _addGlassPillar(scene, -124, -6)
  const p6 = _addGlassPillar(scene, -124,  6)
  collidables.push(p1, p2, p3, p4, p5, p6)

  // ── Atmosphere lighting ────────────────────────────────────────────────────
  // Cool blue-white fill across the full threshold chamber.
  const ambientFill = new THREE.PointLight(0x5080b0, 1.4, 40)
  ambientFill.position.set(-114, 5, 0)
  scene.add(ambientFill)

  // Individual pillar glows — pale cyan, low radius.
  const pillarGlow1 = new THREE.PointLight(0x60b8d8, 1.2, 8)
  pillarGlow1.position.set(-116, 2, 0)
  scene.add(pillarGlow1)

  const pillarGlow2 = new THREE.PointLight(0x50a8cc, 1.0, 7)
  pillarGlow2.position.set(-107, 2, 0)
  scene.add(pillarGlow2)

  // Collapsed wall break — pale daylight simulation on the west end.
  const wallBreak = new THREE.PointLight(0x8ab8cc, 0.8, 10)
  wallBreak.position.set(-126, 4, 0)
  scene.add(wallBreak)

  // ── Access gate door ───────────────────────────────────────────────────────
  // A heavy vaultglass slab blocks the entrance until the player has completed
  // "Echoes of the Sealed Shaft" — the final Hollow Vault exploration task.
  // The door is narrow enough to span the 12-unit opening (z = −6 → +6).
  const gateDoor = buildGatedDoor(scene, interactables, {
    x: -100,
    y: 3,
    z: 0,
    width: 0.4,
    height: 6,
    depth: 12,
    label: 'Belowglass Threshold Slab',
    color: 0x4a7898,
    emissive: 0x1a3a4a,
    openMessage: 'The vaultglass slab grinds aside — the Belowglass Vaults lie open before you.',
    requirements: [
      {
        kind: 'task',
        taskId: 'tidemark_sealed_shaft',
        taskTitle: 'Echoes of the Sealed Shaft',
      },
    ],
  })
  collidables.push(gateDoor.mesh as THREE.Mesh)

  // ── Inner Sanctum — Phase 84 boss chamber ─────────────────────────────────
  // The Warden's Sanctum lies further west of the threshold chamber
  // (x = −130 → −154, z = −14 → +14).  A wider, taller hall lit by deep
  // resonance glow.  The Vault-Heart Warden stands at its centre.

  // Sanctum floor
  const sanctumFloor = new THREE.Mesh(new THREE.PlaneGeometry(24, 28), matThresholdFloor)
  sanctumFloor.rotation.x = -Math.PI / 2
  sanctumFloor.position.set(-142, 0.01, 0)
  scene.add(sanctumFloor)

  // Sanctum boundary walls
  const sancN  = _addWall(scene, 24, 8, 0.4,  -142, 4, -14.2, matBound)
  const sancS  = _addWall(scene, 24, 8, 0.4,  -142, 4,  14.2, matBound)
  const sancW  = _addWall(scene, 0.4, 8, 28,  -154.2, 4, 0, matBound)
  collidables.push(sancN, sancS, sancW)

  // Boss altar platform — a raised dais at the sanctum centre where the
  // Vault-Heart Warden stands dormant.
  const altarMat = new THREE.MeshStandardMaterial({
    color: 0x1c2838,
    roughness: 0.80,
    emissive: new THREE.Color(0x0a1820),
    emissiveIntensity: 0.35,
  })
  const altarDais = new THREE.Mesh(new THREE.BoxGeometry(6, 0.35, 6), altarMat)
  altarDais.position.set(-141, 0.175, 0)
  scene.add(altarDais)

  // Altar glyph ring — a flat ring of pale vaultglass set into the dais.
  const glyphMat = new THREE.MeshStandardMaterial({
    color: 0x5098c0,
    roughness: 0.15,
    emissive: new THREE.Color(0x204860),
    emissiveIntensity: 0.70,
  })
  const altarGlyph = new THREE.Mesh(new THREE.RingGeometry(1.6, 2.5, 16), glyphMat)
  altarGlyph.rotation.x = -Math.PI / 2
  altarGlyph.position.set(-141, 0.52, 0)
  scene.add(altarGlyph)

  // Six resonance pillars: four at sanctum corners and two flanking the altar.
  const sp1 = _addGlassPillar(scene, -133, -11)
  const sp2 = _addGlassPillar(scene, -133,  11)
  const sp3 = _addGlassPillar(scene, -149, -11)
  const sp4 = _addGlassPillar(scene, -149,  11)
  collidables.push(sp1, sp2, sp3, sp4)

  // Mid-sanctum accent pillars flanking the altar
  const sp5 = _addGlassPillar(scene, -141, -9)
  const sp6 = _addGlassPillar(scene, -141,  9)
  collidables.push(sp5, sp6)

  // Sanctum atmosphere lighting — deep blue resonance glow from the altar.
  const sanctumAmbient = new THREE.PointLight(0x203858, 1.6, 30)
  sanctumAmbient.position.set(-141, 5, 0)
  scene.add(sanctumAmbient)

  const altarGlow = new THREE.PointLight(0x4090c0, 2.0, 14)
  altarGlow.position.set(-141, 1.5, 0)
  scene.add(altarGlow)

  const cornerGlow1 = new THREE.PointLight(0x305878, 1.0, 10)
  cornerGlow1.position.set(-149, 3, -8)
  scene.add(cornerGlow1)

  const cornerGlow2 = new THREE.PointLight(0x305878, 1.0, 10)
  cornerGlow2.position.set(-149, 3, 8)
  scene.add(cornerGlow2)

  // ── Sanctum access gate ────────────────────────────────────────────────────
  // A dense vaultglass slab seals the passage from the threshold into the
  // Inner Sanctum at x = −129.  Requires Salvaging level 5 to open, implying
  // the player has worked the vault extensively before facing the boss.
  const sanctumDoor = buildGatedDoor(scene, interactables, {
    x: -129,
    y: 3.5,
    z: 0,
    width: 0.5,
    height: 7,
    depth: 28,
    label: 'Sanctum Resonance Seal',
    color: 0x284870,
    emissive: 0x0c1e30,
    openMessage: 'The resonance seal shatters — the Inner Sanctum lies open.',
    requirements: [
      {
        kind: 'skill',
        skillId: 'salvaging',
        skillName: 'Salvaging',
        minLevel: 5,
      },
    ],
  })
  collidables.push(sanctumDoor.mesh as THREE.Mesh)

  return { collidables, gateDoor, sanctumDoor }
}

// ─── Private helpers ──────────────────────────────────────────────────────────

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

/**
 * Add a fractured vaultglass pillar at (x, z).
 * Returns the pillar cylinder for collision registration.
 */
function _addGlassPillar(scene: THREE.Scene, x: number, z: number): THREE.Mesh {
  const group = new THREE.Group()

  // Base socket
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38, 0.42, 0.20, 8),
    matPillarBase,
  )
  base.position.set(0, 0.10, 0)
  group.add(base)

  // Main glass shaft — slightly tapered
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.30, 5.5, 8),
    matVaultGlass,
  )
  shaft.position.set(0, 2.95, 0)
  group.add(shaft)

  // Fractured crown cap — wider to suggest breakage
  const crown = new THREE.Mesh(
    new THREE.CylinderGeometry(0.10, 0.28, 0.40, 7),
    matVaultGlass,
  )
  crown.position.set(0, 5.9, 0)
  crown.rotation.y = 0.6
  group.add(crown)

  group.position.set(x, 0, z)
  scene.add(group)

  // Return the shaft mesh with a world position for collision purposes.
  // We add a dedicated invisible collision cylinder at the same position.
  const col = new THREE.Mesh(
    new THREE.CylinderGeometry(0.30, 0.30, 6, 8),
    matBound,
  )
  col.position.set(x, 3, z)
  scene.add(col)
  return col
}

/** Add a low rubble-fill mound along a wall — visual only. */
function _addRubbleFill(scene: THREE.Scene, x: number, z: number): void {
  const rubble = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.50, 1.0),
    matRubbleFill,
  )
  rubble.position.set(x, 0.25, z)
  rubble.rotation.y = (x + z) * 0.3
  scene.add(rubble)
}
