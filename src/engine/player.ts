import * as THREE from 'three'

/**
 * Phase 71 — Animation Integration Pass adds 'gather', 'attack', and
 * 'interact' states so animatePlayer() can drive distinct procedural loops.
 */
export type MoveState = 'idle' | 'walk' | 'gather' | 'attack' | 'interact'

export interface Player {
  mesh: THREE.Group
  moveState: MoveState
  speed: number
  /** Phase 71 — running timer (seconds) used as the phase input for procedural animations. */
  animPhase: number
  /**
   * Phase 71 — `animPhase` value captured the moment the 'interact' arc started.
   * Subtracted from `animPhase` in animatePlayer() so the arc always begins from
   * zero offset regardless of when [E] is pressed.
   */
  interactStartPhase: number
}

/**
 * Safety-clamp applied as a last-resort fallback in case all boundary-wall
 * collision pushback is bypassed.  Both Hushwood (±19) and Redwake Quarry
 * (z down to ≈−96) plus their connecting corridor are within ±100, so this
 * value is intentionally generous — the invisible boundary walls do the real
 * work of keeping the player inside each zone.
 */
const HALF_BOUNDS = 100

/** Approximate horizontal radius of the player capsule (metres). */
const PLAYER_RADIUS = 0.35

// Reused each frame to avoid per-frame heap allocations.
const _dir = new THREE.Vector3()

export function createPlayer(scene: THREE.Scene): Player {
  const group = new THREE.Group()

  const mat = new THREE.MeshStandardMaterial({ color: 0x3a7bd5, roughness: 0.6 })
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 1.0, 4, 8), mat)
  // Capsule origin is at its centre; shift up so the bottom sits on y=0.
  body.position.y = 0.8
  group.add(body)

  scene.add(group)

  return { mesh: group, moveState: 'idle', speed: 5, animPhase: 0, interactStartPhase: 0 }
}

export function updatePlayer(
  player: Player,
  keys: Set<string>,
  delta: number,
  /** Camera yaw (radians). When provided, WASD moves relative to the camera. */
  cameraYaw = 0,
  /** Static collidable bounding boxes – precomputed once, player is pushed out of each. */
  collidables: THREE.Box3[] = [],
  /** Optional virtual joystick direction from mobile controls (values in [-1, 1]). */
  joystick?: { x: number; z: number },
): void {
  _dir.set(0, 0, 0)

  if (keys.has('KeyW') || keys.has('ArrowUp')) _dir.z -= 1
  if (keys.has('KeyS') || keys.has('ArrowDown')) _dir.z += 1
  if (keys.has('KeyA') || keys.has('ArrowLeft')) _dir.x -= 1
  if (keys.has('KeyD') || keys.has('ArrowRight')) _dir.x += 1

  // Virtual joystick input from mobile controls.
  if (joystick && (Math.abs(joystick.x) > 0.15 || Math.abs(joystick.z) > 0.15)) {
    _dir.x += joystick.x
    _dir.z += joystick.z
  }

  if (_dir.lengthSq() > 0) {
    player.moveState = 'walk'
    _dir.normalize()

    // Rotate the local-space direction into world space around the camera yaw.
    // x_world =  x_local·cos(θ) + z_local·sin(θ)
    // z_world = -x_local·sin(θ) + z_local·cos(θ)
    const cos = Math.cos(cameraYaw)
    const sin = Math.sin(cameraYaw)
    const wx = _dir.x * cos + _dir.z * sin
    const wz = -_dir.x * sin + _dir.z * cos
    _dir.x = wx
    _dir.z = wz

    // Capture rotation angle from the world-space direction before scaling.
    const angle = Math.atan2(_dir.x, _dir.z)

    _dir.multiplyScalar(player.speed * delta)

    player.mesh.position.x = THREE.MathUtils.clamp(
      player.mesh.position.x + _dir.x,
      -HALF_BOUNDS,
      HALF_BOUNDS,
    )
    player.mesh.position.z = THREE.MathUtils.clamp(
      player.mesh.position.z + _dir.z,
      -HALF_BOUNDS,
      HALF_BOUNDS,
    )

    // Rotate mesh to face the direction of travel.
    player.mesh.rotation.y = angle
  } else {
    player.moveState = 'idle'
  }

  // AABB pushback — keep player outside all precomputed collidable bounding boxes.
  for (const bbox of collidables) {
    const ex = bbox.min.x - PLAYER_RADIUS
    const EX = bbox.max.x + PLAYER_RADIUS
    const ez = bbox.min.z - PLAYER_RADIUS
    const EZ = bbox.max.z + PLAYER_RADIUS
    const px = player.mesh.position.x
    const pz = player.mesh.position.z
    if (px > ex && px < EX && pz > ez && pz < EZ) {
      const dL = px - ex
      const dR = EX - px
      const dF = pz - ez
      const dB = EZ - pz
      const m = Math.min(dL, dR, dF, dB)
      if (m === dL) player.mesh.position.x = ex
      else if (m === dR) player.mesh.position.x = EX
      else if (m === dF) player.mesh.position.z = ez
      else player.mesh.position.z = EZ
    }
  }
}

// ── Phase 71 — Procedural animation ──────────────────────────────────────────

/** Natural resting Y of the player body capsule mesh. */
const BODY_BASE_Y = 0.8

/**
 * Phase 71 — Animate the player body with simple procedural sine-wave offsets.
 *
 * Call once per animation frame *after* updatePlayer() and any moveState
 * overrides so the correct state drives the correct loop.
 *
 * Frequencies below are true Hz (complete cycles per second).  Each multiplier
 * is `2π × frequency_Hz` so that `Math.sin(animPhase × multiplier)` oscillates
 * at the stated rate regardless of the frame rate.
 *
 * States:
 *   walk    — 2.5 Hz vertical bob (footstep rhythm).
 *   gather  — 1.0 Hz downward dip (axe-swing / mining strike / cast cycle).
 *   attack  — 4.0 Hz fast pulse while auto-attacking in melee.
 *   interact — deterministic single dip-and-rise arc anchored to the [E] press.
 *   idle    — body smoothly lerps back to rest height.
 */
export function animatePlayer(player: Player, delta: number): void {
  player.animPhase += delta

  const body = player.mesh.children[0] as THREE.Mesh
  if (!body) return

  switch (player.moveState) {
    case 'walk': {
      // 2.5 Hz vertical bob — simulates weight shifting between feet.
      // Multiplier = 2π × 2.5 ≈ 15.71 rad/s.
      body.position.y = BODY_BASE_Y + Math.sin(player.animPhase * Math.PI * 5) * 0.04
      break
    }
    case 'gather': {
      // 1.0 Hz downward dip — chop/mine/cast repeating cycle.
      // Multiplier = 2π × 1.0 ≈ 6.28 rad/s.
      // Math.max(0, sin(t)) produces [0,1] on the positive half-cycle and 0
      // on the negative half, creating a repeated downward stroke + quick return.
      const t = player.animPhase * Math.PI * 2
      body.position.y = BODY_BASE_Y - Math.max(0, Math.sin(t)) * 0.12
      break
    }
    case 'attack': {
      // 4.0 Hz rapid pulse while auto-attacking.
      // Multiplier = 2π × 4.0 ≈ 25.13 rad/s.
      body.position.y = BODY_BASE_Y + Math.sin(player.animPhase * Math.PI * 8) * 0.06
      break
    }
    case 'interact': {
      // Deterministic single dip-and-rise arc anchored to when [E] was pressed.
      // localPhase = 0 at trigger → arc starts exactly at rest, dips, and returns.
      // Using abs(sin(localPhase × π / duration)) so the arc completes in ~0.4 s.
      const localPhase = player.animPhase - player.interactStartPhase
      body.position.y = BODY_BASE_Y - Math.abs(Math.sin(localPhase * Math.PI * 2.5)) * 0.08
      break
    }
    default: {
      // Idle: smoothly lerp back to the natural resting height.
      // Clamp alpha to ≤ 1 so a frame-time spike can never overshoot BODY_BASE_Y.
      const lerpAlpha = Math.min(1, delta * 6)
      body.position.y = THREE.MathUtils.lerp(body.position.y, BODY_BASE_Y, lerpAlpha)
      break
    }
  }
}
