import * as THREE from 'three'

/**
 * Phase 72 — VFX Pass I
 *
 * Lightweight procedural visual-effect system.  All effects are purely
 * Three.js mesh / points objects managed by a flat array; no sprites,
 * no texture atlas, no external assets.
 *
 * Public API
 * ----------
 *   initVfx(scene, getPlayerPos)        — register scene + player position
 *                                          accessor; call once at startup.
 *   spawnGatherSparks(position)         — chip / spark burst for woodcutting,
 *                                          mining, foraging, and salvage.
 *   spawnHitRing(position)              — brief red ring on creature hit.
 *   spawnLevelUpRing()                  — gold expanding ring at player
 *                                          position on skill level-up.
 *   spawnWardActivation(position)       — teal ring on ward inscription.
 *   tickVfx(delta)                      — advance all live effects one frame.
 */

// ── Internal types ────────────────────────────────────────────────────────────

type VfxKind = 'gather_sparks' | 'hit_ring' | 'levelup_ring' | 'ward_activation'

interface VfxEffect {
  kind: VfxKind
  /** Root object added to the scene; removed when the effect expires. */
  mesh: THREE.Object3D
  age: number
  duration: number
}

// ── Module-level state ────────────────────────────────────────────────────────

let _scene: THREE.Scene | null = null
let _getPlayerPos: (() => THREE.Vector3) | null = null
const _effects: VfxEffect[] = []
const _toRemove: VfxEffect[] = []

// ── Initialisation ────────────────────────────────────────────────────────────

/**
 * Register the Three.js scene and a player-position accessor.
 * Must be called once before any spawn* functions are used.
 */
export function initVfx(scene: THREE.Scene, getPlayerPos: () => THREE.Vector3): void {
  _scene = scene
  _getPlayerPos = getPlayerPos
}

// ── Spawn helpers ─────────────────────────────────────────────────────────────

/**
 * Spawn a burst of 8 tiny gold/orange spark chips at `position`.
 * Used for woodcutting, mining, foraging, and salvage completions.
 */
export function spawnGatherSparks(position: THREE.Vector3): void {
  if (!_scene) return

  const N = 8
  const positions = new Float32Array(N * 3)
  const velocities = new Float32Array(N * 3)

  for (let i = 0; i < N; i++) {
    const angle = (i / N) * Math.PI * 2
    const r = 0.1 + Math.random() * 0.15
    positions[i * 3]     = position.x + Math.cos(angle) * 0.05
    positions[i * 3 + 1] = position.y + 0.6 + Math.random() * 0.2
    positions[i * 3 + 2] = position.z + Math.sin(angle) * 0.05
    velocities[i * 3]     = Math.cos(angle) * r
    velocities[i * 3 + 1] = 1.2 + Math.random() * 0.8
    velocities[i * 3 + 2] = Math.sin(angle) * r
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  const mat = new THREE.PointsMaterial({
    color: 0xffa030,
    size: 0.09,
    sizeAttenuation: true,
    transparent: true,
    opacity: 1.0,
    depthWrite: false,
  })

  const points = new THREE.Points(geo, mat)
  points.userData.velocities = velocities
  _scene.add(points)

  _effects.push({ kind: 'gather_sparks', mesh: points, age: 0, duration: 0.55 })
}

/**
 * Spawn a brief expanding red ring at `position` (creature hit feedback).
 * The ring lies flat on the XZ plane, centred on the hit position.
 */
export function spawnHitRing(position: THREE.Vector3): void {
  if (!_scene) return

  const geo = new THREE.RingGeometry(0.12, 0.22, 20)
  const mat = new THREE.MeshBasicMaterial({
    color: 0xff2020,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
  const mesh = new THREE.Mesh(geo, mat)
  // Rotate to horizontal — ring lies in the XZ plane.
  mesh.rotation.x = -Math.PI / 2
  mesh.position.copy(position)
  mesh.position.y = 0.05   // just above ground
  _scene.add(mesh)

  _effects.push({ kind: 'hit_ring', mesh, age: 0, duration: 0.22 })
}

/**
 * Spawn a gold expanding ring centred on the player for a skill level-up cue.
 * The ring grows and fades over ~1 s to avoid distracting prolonged effects.
 */
export function spawnLevelUpRing(): void {
  if (!_scene || !_getPlayerPos) return

  const pos = _getPlayerPos()

  const geo = new THREE.RingGeometry(0.2, 0.38, 28)
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffe040,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.rotation.x = -Math.PI / 2
  mesh.position.copy(pos)
  mesh.position.y = 0.08
  _scene.add(mesh)

  _effects.push({ kind: 'levelup_ring', mesh, age: 0, duration: 1.0 })
}

/**
 * Spawn a teal / sea-green expanding ring at `position` for ward inscription
 * completion feedback.
 */
export function spawnWardActivation(position: THREE.Vector3): void {
  if (!_scene) return

  const geo = new THREE.RingGeometry(0.18, 0.3, 24)
  const mat = new THREE.MeshBasicMaterial({
    color: 0x40ffcc,
    transparent: true,
    opacity: 0.88,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.rotation.x = -Math.PI / 2
  mesh.position.copy(position)
  mesh.position.y = 0.06
  _scene.add(mesh)

  _effects.push({ kind: 'ward_activation', mesh, age: 0, duration: 0.9 })
}

// ── Per-frame tick ────────────────────────────────────────────────────────────

/**
 * Advance all active VFX effects by `delta` seconds.
 * Call once per animation frame from the main loop.
 */
export function tickVfx(delta: number): void {
  for (const effect of _effects) {
    effect.age += delta
    const t = Math.min(1, effect.age / effect.duration)

    switch (effect.kind) {
      case 'gather_sparks': {
        const pts = effect.mesh as THREE.Points
        const mat = pts.material as THREE.PointsMaterial
        const posAttr = pts.geometry.getAttribute('position') as THREE.BufferAttribute
        const pos = posAttr.array as Float32Array
        const vel = pts.userData.velocities as Float32Array
        const N = pos.length / 3
        for (let i = 0; i < N; i++) {
          pos[i * 3]     += vel[i * 3]     * delta
          pos[i * 3 + 1] += vel[i * 3 + 1] * delta
          pos[i * 3 + 2] += vel[i * 3 + 2] * delta
          // Gravity drag
          vel[i * 3 + 1] -= 5 * delta
        }
        posAttr.needsUpdate = true
        mat.opacity = 1 - t
        break
      }

      case 'hit_ring': {
        const mesh = effect.mesh as THREE.Mesh
        const mat = mesh.material as THREE.MeshBasicMaterial
        // Scale from 1× to 3× over lifetime.
        const s = 1 + t * 2
        mesh.scale.set(s, s, 1)
        mat.opacity = (1 - t) * 0.85
        break
      }

      case 'levelup_ring': {
        const mesh = effect.mesh as THREE.Mesh
        const mat = mesh.material as THREE.MeshBasicMaterial
        // Scale from 1× to 5× over lifetime.
        const s = 1 + t * 4
        mesh.scale.set(s, s, 1)
        mat.opacity = (1 - t) * 0.9
        break
      }

      case 'ward_activation': {
        const mesh = effect.mesh as THREE.Mesh
        const mat = mesh.material as THREE.MeshBasicMaterial
        const s = 1 + t * 3.5
        mesh.scale.set(s, s, 1)
        mat.opacity = (1 - t) * 0.88
        break
      }
    }

    if (effect.age >= effect.duration) {
      if (_scene) _scene.remove(effect.mesh)
      _disposeEffect(effect)
      _toRemove.push(effect)
    }
  }

  if (_toRemove.length > 0) {
    for (const e of _toRemove) {
      const idx = _effects.indexOf(e)
      if (idx !== -1) _effects.splice(idx, 1)
    }
    _toRemove.length = 0
  }
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function _disposeEffect(effect: VfxEffect): void {
  const obj = effect.mesh
  if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
    obj.geometry.dispose()
    if (Array.isArray(obj.material)) {
      for (const m of obj.material) m.dispose()
    } else {
      ;(obj.material as THREE.Material).dispose()
    }
  }
}
