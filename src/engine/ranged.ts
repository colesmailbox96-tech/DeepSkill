/**
 * Phase 61 — Ranged Combat Foundation
 *
 * Provides the player-side ranged combat loop: projectile creation, per-frame
 * flight simulation, proximity hit detection, and creature-response handling.
 *
 * Design:
 *   - Ranged attacks fire when the player has a bow (weaponType 'ranged') in
 *     the main-hand slot, the required ammo item in inventory, a live target
 *     selected, and the reload timer has expired.
 *   - Each fired arrow is a short cylinder mesh that travels at
 *     PROJECTILE_SPEED toward the target creature's position at launch.
 *   - A hit is registered when the projectile comes within HIT_RADIUS of the
 *     target's position.  damageCreature() is called immediately; the mesh is
 *     then removed from the scene.
 *   - Projectiles that miss or whose targets die in flight are culled when
 *     their elapsed time exceeds maxLife.
 *   - Creatures struck from outside their normal aggroRadius enter aggro state
 *     through the exported triggerAggro() helper in creature.ts so they
 *     respond to shots fired from stealth range.
 */

import * as THREE from 'three'
import type { Creature } from './creature'
import { damageCreature } from './creature'

// ── Constants ─────────────────────────────────────────────────────────────────

/** Maximum distance (metres) from which a bow shot will register a hit. */
export const PLAYER_RANGED_RANGE = 14.0

/**
 * Travel speed of an arrow in metres per second.
 * Fast enough to feel responsive; slow enough that arrow travel is visually noticeable.
 */
export const PROJECTILE_SPEED = 20.0

/**
 * Base reload time in seconds between successive bow shots (unmodified by
 * attack-speed gear).  Intentionally slower than melee to keep ranged balanced
 * as a kiting tool rather than a damage-per-second upgrade.
 */
export const RANGED_ATTACK_COOLDOWN = 2.2

/**
 * Proximity radius (metres) within which a projectile is considered to have
 * struck the target creature.
 */
const HIT_RADIUS = 1.3

/** Height offset (metres) above ground for the player's launch origin. */
const PLAYER_EYE_HEIGHT = 1.4

/** Height offset (metres) above ground for the centre of a target creature. */
const TARGET_CENTER_HEIGHT = 1.0

/** Minimum attack-speed multiplier to prevent division by near-zero values. */
const MIN_ATTACK_SPEED = 0.1

// ── Shared arrow mesh resources ───────────────────────────────────────────────
//
// Creating a new CylinderGeometry + MeshBasicMaterial per arrow causes avoidable
// GC pressure and GPU resource churn during sustained ranged combat.  Instead,
// one geometry and one material are allocated at module-init time and shared
// across all projectile Mesh instances.  Call disposeArrowResources() on session
// teardown (e.g. inside App.tsx's cleanup effect) to free them.

/** Shared geometry for all in-flight arrow meshes (oriented along +Z). */
const _arrowGeom: THREE.BufferGeometry = (() => {
  const g = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 4)
  g.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2))
  return g
})()

/** Shared material for all in-flight arrow meshes. */
const _arrowMat: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({ color: 0x8b6914 })

/**
 * Free the shared arrow geometry and material.
 * Call once when the 3-D scene is torn down (e.g. inside the App.tsx
 * `useEffect` cleanup) to avoid GPU resource leaks.
 */
export function disposeArrowResources(): void {
  _arrowGeom.dispose()
  _arrowMat.dispose()
}

/** One arrow in flight. */
export interface Projectile {
  /** Visible arrow mesh (cylinder oriented along velocity). */
  mesh: THREE.Mesh
  /** Current velocity vector in world space (constant after launch). */
  velocity: THREE.Vector3
  /** Target the arrow was aimed at on launch. */
  target: Creature
  /** Pre-computed damage to apply on hit. */
  damage: number
  /** Seconds since launch.  Arrow is culled when elapsed >= maxLife. */
  elapsed: number
  /** Maximum lifetime = distance-at-launch / PROJECTILE_SPEED * 2.5 (generous). */
  maxLife: number
}

/** Mutable per-session ranged-combat state (held in a ref inside App.tsx). */
export interface RangedState {
  /** All arrows currently in flight. */
  projectiles: Projectile[]
  /** Seconds remaining on the reload cooldown; 0 = ready to shoot. */
  reloadTimer: number
}

// ── Factory ───────────────────────────────────────────────────────────────────

/** Construct a fresh, idle ranged state. */
export function createRangedState(): RangedState {
  return { projectiles: [], reloadTimer: 0 }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Attempt to fire one arrow toward `target`.
 *
 * The caller is responsible for:
 *   - verifying a ranged weapon is equipped
 *   - verifying the required ammo is present in inventory
 *   - consuming one unit of ammo **before** calling this function
 *
 * @param state      Live RangedState (mutated in place).
 * @param playerPos  Current player world-space position.
 * @param target     Targeted creature; must be alive.
 * @param damage     Total damage to deal on a successful hit.
 * @param scene      THREE.Scene used to add and later remove the arrow mesh.
 * @param attackSpeed Weapon-speed multiplier; higher values reload faster.
 * @returns `true` if a projectile was successfully created.
 */
export function fireProjectile(
  state: RangedState,
  playerPos: THREE.Vector3,
  target: Creature,
  damage: number,
  scene: THREE.Scene,
  attackSpeed: number,
): boolean {
  if (state.reloadTimer > 0) return false
  if (target.state === 'dead') return false

  // Compute direction from the player's eye height to the target centre.
  const origin = playerPos.clone().setY(playerPos.y + PLAYER_EYE_HEIGHT)
  const targetCentre = target.mesh.position.clone().setY(target.mesh.position.y + TARGET_CENTER_HEIGHT)
  const dir = new THREE.Vector3().subVectors(targetCentre, origin).normalize()

  // Create a mesh that reuses the shared geometry and material.
  // No per-shot allocation — dramatically reduces GC pressure during sustained fire.
  const mesh = new THREE.Mesh(_arrowGeom, _arrowMat)
  mesh.position.copy(origin)

  // Point the mesh along the flight direction.
  const up = new THREE.Vector3(0, 1, 0)
  // Avoid degenerate quaternion if dir is exactly up/down.
  if (Math.abs(dir.dot(up)) < 0.999) {
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir)
  }

  scene.add(mesh)

  const dist = origin.distanceTo(targetCentre)
  const maxLife = (dist / PROJECTILE_SPEED) * 2.5

  state.projectiles.push({
    mesh,
    velocity: dir.clone().multiplyScalar(PROJECTILE_SPEED),
    target,
    damage,
    elapsed: 0,
    maxLife,
  })

  // Set reload timer, scaled by attackSpeed (higher speed = shorter cooldown).
  state.reloadTimer = RANGED_ATTACK_COOLDOWN / Math.max(MIN_ATTACK_SPEED, attackSpeed)
  return true
}

/**
 * Advance all in-flight projectiles by one frame.
 *
 * Ticks the reload timer; moves each arrow along its velocity vector; culls
 * arrows that have hit their target, exceeded their lifetime, or whose target
 * has already died.
 *
 * @param state   Live RangedState (mutated in place).
 * @param delta   Frame time in seconds.
 * @param scene   THREE.Scene (needed to remove hit/expired arrow meshes).
 * @param onHit   Called when an arrow strikes its target with (target, damage).
 * @param onKill  Called when the hit kills the target.
 */
export function updateRanged(
  state: RangedState,
  delta: number,
  scene: THREE.Scene,
  onHit: (target: Creature, damage: number) => void,
  onKill: (target: Creature) => void,
): void {
  // Tick reload cooldown every frame regardless of whether arrows are in flight.
  if (state.reloadTimer > 0) {
    state.reloadTimer = Math.max(0, state.reloadTimer - delta)
  }

  if (state.projectiles.length === 0) return

  const toRemove: Projectile[] = []

  for (const proj of state.projectiles) {
    proj.elapsed += delta

    // Advance position.
    proj.mesh.position.addScaledVector(proj.velocity, delta)

    // Discard if target is already dead or projectile has outlived its range.
    if (proj.target.state === 'dead' || proj.elapsed >= proj.maxLife) {
      toRemove.push(proj)
      continue
    }

    // Proximity hit check against the target's centre of mass.
    const targetCentre = proj.target.mesh.position.clone().setY(
      proj.target.mesh.position.y + TARGET_CENTER_HEIGHT,
    )
    if (proj.mesh.position.distanceTo(targetCentre) <= HIT_RADIUS) {
      const killed = damageCreature(proj.target, proj.damage)
      onHit(proj.target, proj.damage)
      if (killed) onKill(proj.target)
      toRemove.push(proj)
    }
  }

  // Remove culled projectiles from the scene.
  // Geometry and material are shared resources — do NOT dispose them here;
  // they are freed once on teardown via disposeArrowResources().
  for (const proj of toRemove) {
    scene.remove(proj.mesh)
    const idx = state.projectiles.indexOf(proj)
    if (idx !== -1) state.projectiles.splice(idx, 1)
  }
}
