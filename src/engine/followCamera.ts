import * as THREE from 'three'

// ─── Tuneable constants ───────────────────────────────────────────────────────
// Tuned for a third-person perspective: camera behind and slightly above the
// player, with smooth orbit and zoom.

/** Minimum pitch (radians) – allows near-overhead views for tactical clarity. */
export const PHI_MIN = 0.15
/** Maximum pitch (radians) – allows near-horizontal views while preventing the
 *  camera from dipping below the player. */
export const PHI_MAX = 1.35
/** Closest the camera can get to the player (metres). */
export const RADIUS_MIN = 5
/** Furthest the camera can pull back (metres). */
export const RADIUS_MAX = 22
/** Angle sensitivity for pointer-drag orbit (radians per pixel). */
const ORBIT_SENSITIVITY = 0.004
/** Angle sensitivity for touch-drag orbit on mobile (radians per pixel).
 *  Intentionally lower than mouse sensitivity – finger swipes cover more
 *  screen distance so the same pixel-delta formula feels too fast. */
export const TOUCH_ORBIT_SENSITIVITY = 0.0025
/** Zoom speed (radius units per normalised scroll notch). */
const ZOOM_SPEED = 0.5
/** Orbit smoothing factor (exponential-decay rate) – higher = snappier. */
const LERP_FACTOR = 16
/** Separate zoom damping factor – slightly softer than orbit for a smooth
 *  scroll-wheel feel without overshooting. */
const ZOOM_DAMP_FACTOR = 12
/** Height above the player's base used as the follow target. */
const FOLLOW_HEIGHT = 1.4
/** Horizontal shoulder offset (metres), applied on camera-right axis.
 *  Set to zero for a centred RuneScape-style framing. */
const SHOULDER_OFFSET = 0
/** Pull the camera in this many metres from a collision surface. */
const COLLISION_MARGIN = 0.3
/** Absolute minimum radius used when collision clipping is active. */
const COLLISION_RADIUS_MIN = 0.75
/** Follow smoothing factor – higher = tighter target tracking. */
const FOLLOW_LERP_FACTOR = 14
/** Seconds of orbit-idle before the camera begins drifting behind the player. */
const SNAP_BACK_DELAY = 2.0
/** Rate at which the camera yaw drifts toward "behind the player" (rad/s). */
const SNAP_BACK_SPEED = 1.5

// ─── Per-frame scratch objects (no per-frame heap allocations) ────────────────

const _offset = new THREE.Vector3()
const _lookAt = new THREE.Vector3()
const _desiredCameraPos = new THREE.Vector3()
const _clampedCameraPos = new THREE.Vector3()
const _rayDir = new THREE.Vector3()
const _raycaster = new THREE.Raycaster()

// ─── Public API ───────────────────────────────────────────────────────────────

export interface CameraState {
  /** Target yaw angle around the Y-axis (radians). */
  thetaTarget: number
  /** Target pitch angle from the vertical (radians, clamped to [PHI_MIN, PHI_MAX]). */
  phiTarget: number
  /** Target orbit radius (metres, clamped to [RADIUS_MIN, RADIUS_MAX]). */
  radiusTarget: number
  /** Smoothed yaw – updated each frame. */
  theta: number
  /** Smoothed pitch – updated each frame. */
  phi: number
  /** Smoothed radius – updated each frame. */
  radius: number
  /** Smoothed follow target to reduce jitter while moving. */
  followTarget: THREE.Vector3
  /** Whether followTarget has been initialized to the player's position. */
  followInitialized: boolean
  /** Seconds elapsed since the user last performed an orbit drag or zoom.
   *  Used to trigger the gentle snap-back drift behind the player. */
  orbitIdleTime: number
}

/** Create a default CameraState with a behind-and-above third-person framing. */
export function createCameraState(): CameraState {
  return {
    thetaTarget: 0,
    // phi ~0.75 rad ≈ 43° from vertical (i.e. 47° pitch downward from
    // horizontal) — the classic RuneScape third-person angle.
    phiTarget: 0.75,
    radiusTarget: 12,
    theta: 0,
    phi: 0.75,
    radius: 12,
    followTarget: new THREE.Vector3(),
    followInitialized: false,
    orbitIdleTime: 0,
  }
}

/**
 * Update the orbit camera each frame.
 *
 * Uses exponential decay for smooth, non-floaty interpolation of orbit angles
 * and radius.  A separate damping factor is applied to zoom so scroll-wheel
 * input settles gently without affecting orbit snap.
 *
 * When the user has not orbited for `SNAP_BACK_DELAY` seconds, the camera yaw
 * gently drifts toward the "behind the player" direction for gameplay
 * readability.
 *
 * If `collidables` is non-empty a ray is cast from the look-at point to the
 * desired camera position; the radius is shortened to avoid clipping.
 */
export function updateOrbitCamera(
  camera: THREE.PerspectiveCamera,
  target: THREE.Object3D,
  state: CameraState,
  delta: number,
  collidables: THREE.Object3D[],
): void {
  // Accumulate orbit-idle time for snap-back logic.
  state.orbitIdleTime += delta

  // ── Snap-back: drift yaw toward "behind the player" when orbit is idle ────
  if (state.orbitIdleTime > SNAP_BACK_DELAY) {
    // "Behind the player" is the yaw that places the camera opposite the
    // direction the character faces.  target.rotation.y gives the character's
    // facing direction so the camera yaw behind is facing + π.
    const behindYaw = target.rotation.y + Math.PI

    // Compute shortest angular difference (wrapping-safe).
    const diff = Math.atan2(Math.sin(behindYaw - state.thetaTarget), Math.cos(behindYaw - state.thetaTarget))

    // Only drift when the difference is noticeable to avoid micro-jitter.
    if (Math.abs(diff) > 0.02) {
      const maxStep = SNAP_BACK_SPEED * delta
      state.thetaTarget += Math.sign(diff) * Math.min(Math.abs(diff), maxStep)
    }
  }

  // ── Exponential-decay smoothing toward targets ────────────────────────────
  const orbitT = 1 - Math.exp(-LERP_FACTOR * delta)
  state.theta  += (state.thetaTarget  - state.theta)  * orbitT
  state.phi    += (state.phiTarget    - state.phi)    * orbitT

  // Zoom uses its own softer damping so the scroll wheel settles smoothly.
  const zoomT = 1 - Math.exp(-ZOOM_DAMP_FACTOR * delta)
  state.radius += (state.radiusTarget - state.radius) * zoomT

  // Smooth follow target: player position raised to exploration framing height.
  const followT = 1 - Math.exp(-FOLLOW_LERP_FACTOR * delta)
  if (!state.followInitialized) {
    state.followTarget.copy(target.position)
    state.followTarget.y += FOLLOW_HEIGHT
    state.followInitialized = true
  } else {
    _lookAt.copy(target.position)
    _lookAt.y += FOLLOW_HEIGHT
    state.followTarget.lerp(_lookAt, followT)
  }

  // Shoulder-offset look-at point, applied on yaw-relative right axis.
  _lookAt.copy(state.followTarget)
  if (SHOULDER_OFFSET !== 0) {
    _applyShoulderOffset(_lookAt, state.theta, SHOULDER_OFFSET)
  }

  // Compute the spherical offset at the smoothed radius and desired camera position.
  _sphereOffset(state.theta, state.phi, state.radius, _offset)
  _desiredCameraPos.copy(_lookAt).add(_offset)

  // Collision check from un-offset follow target to desired camera position.
  _clampedCameraPos.copy(_desiredCameraPos)
  if (collidables.length > 0) {
    _rayDir.copy(_desiredCameraPos).sub(state.followTarget)
    const rayLength = _rayDir.length()
    if (rayLength > 0.0001) {
      _rayDir.divideScalar(rayLength)
      _raycaster.set(state.followTarget, _rayDir)
      _raycaster.far = rayLength
      const hits = _raycaster.intersectObjects(collidables, true)
      if (hits.length > 0 && hits[0].distance < rayLength) {
        const clampedDistance = Math.max(COLLISION_RADIUS_MIN, hits[0].distance - COLLISION_MARGIN)
        _clampedCameraPos.copy(state.followTarget).addScaledVector(_rayDir, clampedDistance)
      }
    }
  }

  camera.position.copy(_clampedCameraPos)
  camera.lookAt(_lookAt)
}

/**
 * Apply a pointer-drag delta to the camera state.
 * `dx` and `dy` are raw pixel deltas from a pointermove event.
 * Pass an explicit `sensitivity` to override the default (e.g. use
 * `TOUCH_ORBIT_SENSITIVITY` for touch-based orbit on mobile).
 */
export function applyOrbitDrag(
  state: CameraState,
  dx: number,
  dy: number,
  sensitivity: number = ORBIT_SENSITIVITY,
): void {
  state.thetaTarget -= dx * sensitivity
  state.phiTarget = THREE.MathUtils.clamp(
    state.phiTarget + dy * sensitivity,
    PHI_MIN,
    PHI_MAX,
  )
  // Reset idle timer so snap-back doesn't fight the user.
  state.orbitIdleTime = 0
}

/**
 * Apply a scroll wheel delta to the camera state.
 * `normalised` should be in "pixel" units (multiply line/page deltas before
 * calling).  One typical mouse notch ≈ 100 pixels.
 */
export function applyZoom(state: CameraState, normalised: number): void {
  state.radiusTarget = THREE.MathUtils.clamp(
    state.radiusTarget + normalised * 0.01 * ZOOM_SPEED,
    RADIUS_MIN,
    RADIUS_MAX,
  )
  // Zooming counts as active camera input — delay snap-back.
  state.orbitIdleTime = 0
}

// ─── Private helpers ──────────────────────────────────────────────────────────

/** Convert spherical (theta, phi, r) to a Cartesian offset vector. */
function _sphereOffset(
  theta: number,
  phi: number,
  r: number,
  out: THREE.Vector3,
): void {
  out.set(
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.cos(theta),
  )
}

/** Apply a yaw-relative shoulder offset on the horizontal camera-right axis. */
function _applyShoulderOffset(out: THREE.Vector3, theta: number, shoulder: number): void {
  out.x += Math.cos(theta) * shoulder
  out.z -= Math.sin(theta) * shoulder
}

// ─── Portrait-mode FOV helper ─────────────────────────────────────────────────

/** Base vertical FOV used when the viewport is landscape (aspect ≥ 1). */
const BASE_FOV = 55

/**
 * Return an appropriate vertical FOV for the given aspect ratio.
 *
 * In landscape the base FOV is returned unchanged.  In portrait (aspect < 1)
 * the FOV is widened so the horizontal extent of the scene remains roughly the
 * same as in landscape — this prevents the world from appearing "zoomed in"
 * when the phone is held upright and keeps gameplay readable.  The adjustment
 * mirrors the "vert-" technique commonly used in GTA and similar third-person
 * titles.
 *
 * The result is clamped to [BASE_FOV, 90] to avoid extreme fisheye distortion.
 */
export function getResponsiveFov(aspect: number): number {
  if (aspect >= 1) return BASE_FOV
  // Convert base FOV to horizontal FOV, then derive the vertical FOV that
  // would produce the same horizontal extent at the new (narrower) aspect.
  const baseRad = THREE.MathUtils.degToRad(BASE_FOV)
  const hFov = 2 * Math.atan(Math.tan(baseRad / 2) * (16 / 9))
  const vRad = 2 * Math.atan(Math.tan(hFov / 2) / aspect)
  return THREE.MathUtils.clamp(THREE.MathUtils.radToDeg(vRad), BASE_FOV, 90)
}
