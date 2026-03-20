/**
 * Phase 44 — Surveying Skill Foundation
 *
 * Adds an original discovery skill to Veilmarch.  A survey stone is placed in
 * the Hushwood settlement; players interact with it (or press Y while nearby)
 * to open the Surveying Panel, then activate a timed survey sweep.
 *
 * While survey mode is active the engine periodically checks for hidden cache
 * spots within detection range and reveals them with a glowing marker.  When
 * the player walks to a revealed cache and presses E, they receive a randomised
 * salvage reward and surveying XP.
 *
 * Survey caches:
 *   Cache A — near the eastern tree line    (6,  0,  8)  salvage: ore_chip   6 xp
 *   Cache B — south of the fishing dock     (3,  0, -4)  salvage: raw_resin  8 xp
 *   Cache C — behind the carving workbench  (-5, 0,  9)  salvage: flint_shard 10 xp
 *   Cache D — far north trail bend          (0,  0, 24)  salvage: rare_fragment 18 xp
 *
 * The caller (App.tsx) owns the survey timer, reveal loop, cache interaction,
 * item award, and XP grant.  This module provides the data, station visual,
 * cache visual meshes, and helpers.
 */

import * as THREE from 'three'
import type { Interactable } from './interactable'
import { useGameStore } from '../store/useGameStore'

// ─── Survey cache configuration ───────────────────────────────────────────

/** Salvage item IDs that a survey cache can yield. */
export type SurveyRewardId = 'ore_chip' | 'raw_resin' | 'flint_shard' | 'rare_fragment'

export interface SurveyCacheConfig {
  /** Unique cache identifier. */
  id: string
  /** World-space position of the hidden cache. */
  position: Readonly<[number, number, number]>
  /** ID of the salvage item rewarded when claimed. */
  rewardId: SurveyRewardId
  /** Quantity of the reward item given. */
  rewardQty: number
  /** Surveying level required to detect this cache. */
  levelReq: number
  /** Surveying XP awarded when the cache is claimed. */
  xp: number
  /** Seconds before a claimed cache resets and can be found again. */
  cooldown: number
}

/** All predefined survey cache spots. */
export const SURVEY_CACHE_CONFIGS: Readonly<SurveyCacheConfig[]> = [
  {
    id: 'cache_east_treeline',
    position: [6, 0, 8],
    rewardId: 'ore_chip',
    rewardQty: 2,
    levelReq: 1,
    xp: 6,
    cooldown: 120,
  },
  {
    id: 'cache_fishing_dock',
    position: [3, 0, -4],
    rewardId: 'raw_resin',
    rewardQty: 1,
    levelReq: 1,
    xp: 8,
    cooldown: 120,
  },
  {
    id: 'cache_workbench_behind',
    position: [-5, 0, 9],
    rewardId: 'flint_shard',
    rewardQty: 2,
    levelReq: 2,
    xp: 10,
    cooldown: 150,
  },
  {
    id: 'cache_north_trail',
    position: [0, 0, 24],
    rewardId: 'rare_fragment',
    rewardQty: 1,
    levelReq: 3,
    xp: 18,
    cooldown: 240,
  },
] as const

/** Maximum world-distance at which survey mode can detect a hidden cache. */
export const SURVEY_DETECT_RADIUS = 12

/** Distance within which a revealed cache can be claimed (pressed E). */
export const SURVEY_CLAIM_RADIUS = 2.0

/** Seconds the survey mode stays active after being triggered. */
export const SURVEY_MODE_DURATION = 20

/** Interaction radius for the survey stone station. */
export const SURVEY_STONE_INTERACT_RADIUS = 2.0

// ─── Survey cache runtime state ───────────────────────────────────────────

/** Runtime state for a single survey cache instance in the world. */
export interface SurveyCache {
  config: SurveyCacheConfig
  /** Marker mesh shown when the cache is revealed; hidden otherwise. */
  markerMesh: THREE.Group
  /** Whether the cache has been revealed by an active survey sweep. */
  revealed: boolean
  /** Seconds remaining on cooldown after claiming (0 = ready). */
  cooldownRemaining: number
  /** Interactable registered while the cache is revealed. */
  interactable: Interactable
}

// ─── Survey stone station ─────────────────────────────────────────────────

export interface SurveyStoneStation {
  id: string
  mesh: THREE.Group
  interactable: Interactable
}

// ─── Visual helpers ───────────────────────────────────────────────────────

/** Build the survey stone mesh — a rough standing stone with an etched glyph. */
function _buildSurveyStoneMesh(): THREE.Group {
  const group = new THREE.Group()

  const matStone = new THREE.MeshStandardMaterial({ color: 0x7a7060, roughness: 0.9 })
  const matGlyph = new THREE.MeshStandardMaterial({ color: 0xd4c87a, roughness: 0.5, emissive: new THREE.Color(0x887a20), emissiveIntensity: 0.6 })
  const matBase  = new THREE.MeshStandardMaterial({ color: 0x5a5040, roughness: 0.95 })

  // Base slab
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.5), matBase)
  base.position.set(0, 0.06, 0)
  group.add(base)

  // Standing stone body (slightly tilted for character)
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.36, 1.1, 0.22), matStone)
  body.position.set(0, 0.67, 0)
  body.rotation.z = 0.04
  group.add(body)

  // Rounded cap
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.14, 6), matStone)
  cap.position.set(0, 1.29, 0)
  group.add(cap)

  // Etched glyph disc on the face of the stone
  const glyph = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.02, 8), matGlyph)
  glyph.rotation.x = Math.PI / 2
  glyph.position.set(0, 0.72, 0.12)
  group.add(glyph)

  // Subtle golden ambient glow
  const glow = new THREE.PointLight(0xffe880, 0.9, 4)
  glow.position.set(0, 1.2, 0)
  group.add(glow)

  return group
}

/**
 * Build the marker mesh shown above a revealed cache.
 * A pulsing golden diamond beacon floating above ground.
 */
function _buildCacheMarkerMesh(): THREE.Group {
  const group = new THREE.Group()

  const matBeacon = new THREE.MeshStandardMaterial({
    color: 0xffd050,
    roughness: 0.2,
    metalness: 0.3,
    emissive: new THREE.Color(0xffaa00),
    emissiveIntensity: 1.2,
    transparent: true,
    opacity: 0.88,
  })
  const matPillar = new THREE.MeshStandardMaterial({
    color: 0xffd050,
    transparent: true,
    opacity: 0.35,
    emissive: new THREE.Color(0xffcc40),
    emissiveIntensity: 0.8,
  })

  // Diamond octahedron beacon
  const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), matBeacon)
  beacon.position.set(0, 1.2, 0)
  beacon.rotation.y = Math.PI / 4
  group.add(beacon)

  // Vertical light pillar
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.0, 6), matPillar)
  pillar.position.set(0, 0.6, 0)
  group.add(pillar)

  // Bright point light to cast cache glow on the ground
  const light = new THREE.PointLight(0xffcc20, 1.8, 3.5)
  light.position.set(0, 1.0, 0)
  group.add(light)

  group.visible = false
  return group
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Spawn the Hushwood survey stone station.
 *
 * The stone is placed at (4, 0, 14) — east of the tinkerer's bench, visible
 * from the commons path.
 */
export function buildSurveyStoneStation(
  scene: THREE.Scene,
  interactables: Interactable[],
  onSurveyOpen: () => void,
): SurveyStoneStation {
  const mesh = _buildSurveyStoneMesh()
  mesh.position.set(4, 0, 14)
  scene.add(mesh)

  const interactable: Interactable = {
    mesh,
    label: 'Survey Stone',
    interactRadius: SURVEY_STONE_INTERACT_RADIUS,
    onInteract: onSurveyOpen,
  }
  interactables.push(interactable)

  return { id: 'survey_stone_0', mesh, interactable }
}

/**
 * Spawn all survey cache instances in the world.  Each cache starts hidden;
 * the survey sweep reveals them when the player is close enough with an active
 * survey mode.
 */
export function buildSurveyCaches(
  scene: THREE.Scene,
  interactables: Interactable[],
  onClaimCache: (cache: SurveyCache) => void,
): SurveyCache[] {
  return SURVEY_CACHE_CONFIGS.map((cfg) => {
    const markerMesh = _buildCacheMarkerMesh()
    markerMesh.position.set(cfg.position[0], cfg.position[1], cfg.position[2])
    scene.add(markerMesh)

    const interactable: Interactable = {
      mesh: markerMesh,
      label: 'Revealed Cache',
      interactRadius: SURVEY_CLAIM_RADIUS,
      onInteract: () => onClaimCache(cache),
    }
    // Cache interactables are only registered while revealed; we register them
    // up-front but the reveal/hide logic gates visibility and interaction.
    interactables.push(interactable)

    const cache: SurveyCache = {
      config: cfg,
      markerMesh,
      revealed: false,
      cooldownRemaining: 0,
      interactable,
    }
    return cache
  })
}

/** Hide all cache markers and remove them from active interaction. */
export function hideAllCaches(caches: SurveyCache[]): void {
  for (const cache of caches) {
    cache.revealed = false
    cache.markerMesh.visible = false
  }
}

/**
 * Reveal caches within detection range of `playerPos` that are:
 *   - not on cooldown,
 *   - meet the current surveying level requirement.
 * Returns the number of newly revealed caches.
 */
export function revealNearbyCaches(
  caches: SurveyCache[],
  playerPos: THREE.Vector3,
): number {
  const surveyingLevel = getSurveyingLevel()
  let count = 0
  for (const cache of caches) {
    if (cache.revealed) continue
    if (cache.cooldownRemaining > 0) continue
    if (surveyingLevel < cache.config.levelReq) continue
    const dx = playerPos.x - cache.config.position[0]
    const dz = playerPos.z - cache.config.position[2]
    const dist = Math.sqrt(dx * dx + dz * dz)
    if (dist <= SURVEY_DETECT_RADIUS) {
      cache.revealed = true
      cache.markerMesh.visible = true
      count++
    }
  }
  return count
}

/**
 * Animate revealed cache markers — rotate the beacon and pulse glow.
 * Should be called every frame while at least one cache is revealed.
 */
export function animateCacheMarkers(caches: SurveyCache[], delta: number): void {
  for (const cache of caches) {
    if (!cache.revealed) continue
    const beacon = cache.markerMesh.children[0] as THREE.Mesh | undefined
    if (beacon) beacon.rotation.y += delta * 1.6
  }
}

/**
 * Tick cooldown timers for all caches.  When a cooldown expires the cache
 * becomes ready to be detected again on the next survey sweep.
 */
export function tickCacheCooldowns(caches: SurveyCache[], delta: number): void {
  for (const cache of caches) {
    if (cache.cooldownRemaining > 0) {
      cache.cooldownRemaining = Math.max(0, cache.cooldownRemaining - delta)
    }
  }
}

/**
 * Return the player's current Surveying skill level from the global store.
 * Returns 1 when the skill is not yet initialised.
 */
export function getSurveyingLevel(): number {
  const { skills } = useGameStore.getState()
  return skills.skills.find((s) => s.id === 'surveying')?.level ?? 1
}
