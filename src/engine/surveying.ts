/**
 * Phase 44 — Surveying Skill Foundation
 * Phase 45 — Hidden Cache System
 * Phase 65 — Hollow Vault Steps survey caches
 * Phase 80 — Advanced Surveying and Secret Paths
 *
 * Adds an original discovery skill to Veilmarch.  A survey stone is placed in
 * the Hushwood settlement; players interact with it (or press Y while nearby)
 * to open the Surveying Panel, then activate a timed survey sweep.
 *
 * While survey mode is active the engine periodically checks for hidden cache
 * spots within detection range and reveals them with a glowing marker.  When
 * the player walks to a revealed cache and presses E, they receive a randomised
 * salvage reward drawn from a weighted pool and surveying XP.
 *
 * Phase 45 additions:
 *   - Weighted randomised salvage pool per cache (replaces single fixed reward).
 *   - Two new buried cache locations (6 caches total).
 *   - Live cooldown status exported for the panel UI.
 *
 * Phase 65 additions:
 *   - Two new buried cache locations in the Hollow Vault Steps (8 caches total).
 *
 * Phase 80 additions:
 *   - Two new high-level survey caches in the Belowglass Vaults (10 caches total).
 *   - Hidden shortcuts: buildHiddenShortcut() builds a rubble-pile collidable that
 *     only a sufficiently skilled surveyor can clear.  Two shortcuts are defined in
 *     HIDDEN_SHORTCUT_CONFIGS — one in the Hollow Vault Steps and one at the
 *     Belowglass threshold.  When cleared the caller removes the mesh from
 *     collidables and registers the discovery on the minimap.
 *
 * Survey caches:
 *   Cache A — near the eastern tree line       ( 6,   0,   8)  lvl 1   6 xp
 *   Cache B — south of the fishing dock        ( 3,   0,  -4)  lvl 1   8 xp
 *   Cache C — behind the carving workbench     (-5,   0,   9)  lvl 2  10 xp
 *   Cache D — far north trail bend             ( 0,   0,  24)  lvl 3  18 xp
 *   Cache E — west camp edge (bog margin)      (-8,   0,   3)  lvl 1   7 xp  ← Phase 45
 *   Cache F — northeast ridge lookout          ( 8,   0,  18)  lvl 2  12 xp  ← Phase 45
 *   Cache G — vault antechamber                (-67,  0,   2)  lvl 3  16 xp  ← Phase 65
 *   Cache H — lower vault floor                (-95,  0,  -4)  lvl 4  22 xp  ← Phase 65
 *   Cache I — Vault Passage Niche              (-107, 0,   5)  lvl 5  28 xp  ← Phase 80
 *   Cache J — Deep Vault Alcove                (-125, 0,  -6)  lvl 6  35 xp  ← Phase 80
 *
 * Hidden shortcuts:
 *   Shortcut 1 — Collapsed Vault Wall   (x=-72,  z=0)  surveying lvl 5  ← Phase 80
 *   Shortcut 2 — Sealed Rift Fissure    (x=-100, z=-8) surveying lvl 6  ← Phase 80
 *
 * The caller (App.tsx) owns the survey timer, reveal loop, cache interaction,
 * item award, and XP grant.  This module provides the data, station visual,
 * cache visual meshes, and helpers.
 */

import * as THREE from 'three'
import type { Interactable } from './interactable'
import { useGameStore } from '../store/useGameStore'
import { useNotifications } from '../store/useNotifications'

// ─── Survey cache configuration ───────────────────────────────────────────

/**
 * One entry in a cache's randomised salvage pool.
 * Higher `weight` values are more likely to be selected.
 */
export interface SalvageEntry {
  /** Item ID matching a registered game item. */
  itemId: string
  /** Quantity to award when this entry is chosen. */
  qty: number
  /** Relative probability weight (integers, any positive value). */
  weight: number
}

export interface SurveyCacheConfig {
  /** Unique cache identifier. */
  id: string
  /** Human-readable display name shown in the panel. */
  label: string
  /** World-space position of the hidden cache. */
  position: Readonly<[number, number, number]>
  /**
   * Weighted pool of possible salvage rewards.
   * One entry is drawn at random (weighted) each time the cache is claimed.
   */
  rewardPool: SalvageEntry[]
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
    label: 'East Treeline Cache',
    position: [6, 0, 8],
    rewardPool: [
      { itemId: 'ore_chip',   qty: 2, weight: 4 },
      { itemId: 'small_stone',qty: 3, weight: 3 },
      { itemId: 'raw_resin',  qty: 1, weight: 1 },
    ],
    levelReq: 1,
    xp: 6,
    cooldown: 120,
  },
  {
    id: 'cache_fishing_dock',
    label: 'Fishing Dock Cache',
    position: [3, 0, -4],
    rewardPool: [
      { itemId: 'raw_resin',  qty: 1, weight: 4 },
      { itemId: 'reed_fiber', qty: 2, weight: 3 },
      { itemId: 'ore_chip',   qty: 1, weight: 1 },
    ],
    levelReq: 1,
    xp: 8,
    cooldown: 120,
  },
  {
    id: 'cache_workbench_behind',
    label: 'Workbench Cache',
    position: [-5, 0, 9],
    rewardPool: [
      { itemId: 'flint_shard',       qty: 2, weight: 4 },
      { itemId: 'ore_chip',          qty: 2, weight: 2 },
      { itemId: 'waystone_fragment', qty: 1, weight: 1 },
    ],
    levelReq: 2,
    xp: 10,
    cooldown: 150,
  },
  {
    id: 'cache_north_trail',
    label: 'North Trail Cache',
    position: [0, 0, 24],
    rewardPool: [
      { itemId: 'rare_fragment',     qty: 1, weight: 3 },
      { itemId: 'flint_shard',       qty: 2, weight: 2 },
      { itemId: 'waystone_fragment', qty: 1, weight: 1 },
    ],
    levelReq: 3,
    xp: 18,
    cooldown: 240,
  },
  {
    // Phase 45 — new cache E
    id: 'cache_west_bog_edge',
    label: 'West Bog Cache',
    position: [-8, 0, 3],
    rewardPool: [
      { itemId: 'marsh_herb', qty: 2, weight: 4 },
      { itemId: 'reed_fiber', qty: 3, weight: 3 },
      { itemId: 'ore_chip',   qty: 1, weight: 1 },
    ],
    levelReq: 1,
    xp: 7,
    cooldown: 120,
  },
  {
    // Phase 45 — new cache F
    id: 'cache_northeast_ridge',
    label: 'Northeast Ridge Cache',
    position: [8, 0, 18],
    rewardPool: [
      { itemId: 'copper_ore',  qty: 1, weight: 3 },
      { itemId: 'flint_shard', qty: 1, weight: 3 },
      { itemId: 'raw_resin',  qty: 2, weight: 1 },
    ],
    levelReq: 2,
    xp: 12,
    cooldown: 150,
  },

  // ── Phase 65 — Hollow Vault Steps hidden caches ───────────────────────────

  // Cache G — Vault Antechamber Cache
  //   Buried just inside the vault entrance beneath loose rubble.
  //   Level 3 required; rewards vault-adjacent materials.
  {
    id: 'cache_vault_antechamber',
    label: 'Vault Antechamber Cache',
    position: [-67, 0, 2],
    rewardPool: [
      { itemId: 'vault_chitin', qty: 2, weight: 4 },
      { itemId: 'bone_shard',   qty: 2, weight: 3 },
      { itemId: 'small_stone',  qty: 3, weight: 3 },
      { itemId: 'raw_resin',    qty: 1, weight: 1 },
    ],
    levelReq: 3,
    xp: 16,
    cooldown: 180,
  },

  // Cache H — Lower Vault Cache
  //   Concealed in a gap between collapsed masonry blocks at the deepest level.
  //   Level 4 required; rewards rare vault and warding materials.
  {
    id: 'cache_vault_lower',
    label: 'Lower Vault Cache',
    position: [-95, 0, -4],
    rewardPool: [
      { itemId: 'wraith_stone',    qty: 1, weight: 3 },
      { itemId: 'vault_chitin',    qty: 3, weight: 4 },
      { itemId: 'resinous_organ',  qty: 1, weight: 2 },
      { itemId: 'duskiron_ore',    qty: 1, weight: 1 },
    ],
    levelReq: 4,
    xp: 22,
    cooldown: 240,
  },

  // ── Phase 80 — Belowglass Vaults hidden caches ────────────────────────────

  // Cache I — Vault Passage Niche
  //   Tucked into a fractured alcove just past the belowglass threshold.
  //   Level 5 required; rewards vaultglass and construct materials.
  {
    id: 'cache_bv_passage_niche',
    label: 'Vault Passage Niche',
    position: [-107, 0, 5],
    rewardPool: [
      { itemId: 'vault_glass_shard', qty: 1, weight: 3 },
      { itemId: 'construct_plating', qty: 1, weight: 3 },
      { itemId: 'fensteel_bar',      qty: 1, weight: 1 },
    ],
    levelReq: 5,
    xp: 28,
    cooldown: 300,
  },

  // Cache J — Deep Vault Alcove
  //   Hidden behind a collapsed glass panel deep in the inner chamber.
  //   Level 6 required; rewards high-tier alloy materials.
  {
    id: 'cache_bv_deep_alcove',
    label: 'Deep Vault Alcove',
    position: [-125, 0, -6],
    rewardPool: [
      { itemId: 'construct_plating',  qty: 2, weight: 4 },
      { itemId: 'vault_glass_shard',  qty: 2, weight: 3 },
      { itemId: 'heartwrought_ingot', qty: 1, weight: 1 },
    ],
    levelReq: 6,
    xp: 35,
    cooldown: 360,
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

// ─── Randomised salvage pool helper ──────────────────────────────────────

/**
 * Draw one entry from a weighted salvage pool.
 * Rolls a random value against the cumulative weight sum and returns the
 * matching entry.  Returns a default ore chip entry if the pool is empty.
 */
export function pickReward(pool: SalvageEntry[]): SalvageEntry {
  if (pool.length === 0) return { itemId: 'ore_chip', qty: 1, weight: 1 }
  const totalWeight = pool.reduce((sum, e) => sum + e.weight, 0)
  let roll = Math.random() * totalWeight
  for (const entry of pool) {
    roll -= entry.weight
    if (roll <= 0) return entry
  }
  return pool[pool.length - 1]
}

// ─── Cache status for UI display ─────────────────────────────────────────

/** Snapshot of a single cache's runtime status, safe to pass to React UI. */
export interface CacheStatusEntry {
  id: string
  label: string
  levelReq: number
  revealed: boolean
  /** Seconds remaining on cooldown (0 means ready to be detected). */
  cooldownRemaining: number
}

/**
 * Build a serialisable status snapshot from the live cache array.
 * Used by App.tsx to push cooldown info into the Zustand UI store each tick.
 */
export function buildCacheStatusList(caches: SurveyCache[]): CacheStatusEntry[] {
  return caches.map((c) => ({
    id: c.config.id,
    label: c.config.label,
    levelReq: c.config.levelReq,
    revealed: c.revealed,
    cooldownRemaining: c.cooldownRemaining,
  }))
}

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

  const matStone = new THREE.MeshLambertMaterial({ color: 0x7a7060 })
  const matGlyph = new THREE.MeshStandardMaterial({ color: 0xd4c87a, roughness: 0.5, emissive: new THREE.Color(0x887a20), emissiveIntensity: 0.6 })
  const matBase  = new THREE.MeshLambertMaterial({ color: 0x5a5040 })

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

    // Declare a mutable reference so the interactable's onInteract closure
    // can forward to the cache object without needing null! or circular init.
    // eslint-disable-next-line prefer-const
    let resolvedCache: SurveyCache

    const interactable: Interactable = {
      mesh: markerMesh,
      label: 'Revealed Cache',
      interactRadius: 0,
      onInteract: () => onClaimCache(resolvedCache),
    }
    interactables.push(interactable)

    const cache: SurveyCache = {
      config: cfg,
      markerMesh,
      revealed: false,
      cooldownRemaining: 0,
      interactable,
    }
    resolvedCache = cache
    return cache
  })
}

/** Hide all cache markers and disable their interaction radius. */
export function hideAllCaches(caches: SurveyCache[]): void {
  for (const cache of caches) {
    cache.revealed = false
    cache.markerMesh.visible = false
    cache.interactable.interactRadius = 0
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
      cache.interactable.interactRadius = SURVEY_CLAIM_RADIUS
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

// ─── Phase 80 — Hidden shortcuts ──────────────────────────────────────────────

/**
 * Configuration for a buried passage that an expert surveyor can clear.
 * A rubble-pile collidable blocks the opening; when all skill requirements are
 * met and the player interacts, the pile is removed and the shortcut opens.
 */
export interface HiddenShortcutConfig {
  /** Unique identifier used to track discovery on the minimap. */
  id: string
  /** Interaction label shown in the E-prompt while the passage is blocked. */
  label: string
  /** World X of the rubble-pile centre. */
  x: number
  /** World Z of the rubble-pile centre. */
  z: number
  /** Width of the blocking mesh (X axis). */
  width: number
  /** Height of the blocking mesh (Y axis). */
  height: number
  /** Depth of the blocking mesh (Z axis). */
  depth: number
  /** Minimum Surveying level required to clear the passage. */
  surveyingLevel: number
  /** Notification shown to the player when the shortcut is opened. */
  openMessage: string
}

/** Two predefined hidden shortcuts added in Phase 80. */
export const HIDDEN_SHORTCUT_CONFIGS: Readonly<HiddenShortcutConfig[]> = [
  {
    // Hollow Vault Steps — collapsed wall between vault and chapel corridor.
    id: 'shortcut_vault_breach',
    label: 'Collapsed Vault Wall',
    x: -72, z: 0,
    width: 1.5, height: 2.2, depth: 0.8,
    surveyingLevel: 5,
    openMessage: 'You clear the collapsed stones — a hidden shortcut through the vault wall is revealed.',
  },
  {
    // Belowglass threshold — sealed rift fissure at the vault boundary.
    id: 'shortcut_belowglass_rift',
    label: 'Sealed Rift Fissure',
    x: -100, z: -8,
    width: 1.5, height: 2.2, depth: 0.8,
    surveyingLevel: 6,
    openMessage: 'The ancient fissure cracks open — a shortcut between the vault chambers is revealed.',
  },
] as const

/** Result handle returned by buildHiddenShortcut. */
export interface HiddenShortcutResult {
  /** Shortcut id — matches HiddenShortcutConfig.id; used for minimap registration. */
  id: string
  /** The blocking rubble mesh — push into collidables and hide on open. */
  mesh: THREE.Mesh
  /** The interaction target — splice from interactables on open. */
  interactable: Interactable
  /**
   * Returns true once on the frame the player successfully opens the shortcut.
   * Clears the flag on read.  Call every frame from App.tsx.
   */
  pollOpened(): boolean
}

/** Build a rubble-pile collidable for a hidden shortcut mesh. */
function _buildRubbleMesh(width: number, height: number, depth: number): THREE.Mesh {
  const mat = new THREE.MeshStandardMaterial({
    color: 0x554840,
    roughness: 0.98,
    emissive: new THREE.Color(0x201814),
    emissiveIntensity: 0.3,
  })
  return new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), mat)
}

/**
 * Build a collidable hidden-shortcut rubble pile in the world.
 *
 * The pile blocks passage until the player interacts while meeting the
 * Surveying skill requirement.  When the requirement is met pollOpened()
 * returns true on the following call, signalling App.tsx to remove the
 * collidable and register the discovery on the minimap.
 */
export function buildHiddenShortcut(
  scene: THREE.Scene,
  interactables: Interactable[],
  config: HiddenShortcutConfig,
): HiddenShortcutResult {
  const mesh = _buildRubbleMesh(config.width, config.height, config.depth)
  mesh.position.set(config.x, config.height / 2, config.z)
  scene.add(mesh)

  let _opened = false

  const interactable: Interactable = {
    mesh,
    label: config.label,
    interactRadius: 2.5,
    onInteract: () => {
      const surveyingLevel = getSurveyingLevel()
      if (surveyingLevel < config.surveyingLevel) {
        useNotifications
          .getState()
          .push(
            `Requires Surveying level ${config.surveyingLevel} to reveal this passage (you are level ${surveyingLevel}).`,
            'info',
          )
        return
      }
      _opened = true
      useNotifications.getState().push(config.openMessage, 'success')
    },
  }
  interactables.push(interactable)

  return {
    id: config.id,
    mesh,
    interactable,
    pollOpened() {
      if (_opened) {
        _opened = false
        return true
      }
      return false
    },
  }
}
