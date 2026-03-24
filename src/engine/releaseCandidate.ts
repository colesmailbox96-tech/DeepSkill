/**
 * Phase 100 — Release Candidate Stabilization
 *
 * Central manifest describing the RC-1 demo build of Veilmarch.
 * Consumed by the main menu and any future crash/feedback reporter to
 * surface version information without coupling UI to individual engine files.
 *
 * Scope contract
 * ──────────────
 * This file MUST remain read-only data — no side-effects, no store imports.
 * All game systems remain unchanged from their phase-of-origin implementations.
 */

// ── Build identity ────────────────────────────────────────────────────────────

/** Semantic build label surfaced in the main menu and help overlays. */
export const RC_BUILD_LABEL = 'RC-1' as const

/**
 * Canonical phase number at which this release candidate was cut.
 * Increment when a hotfix phase branches from this RC.
 */
export const RC_PHASE = 100 as const

// ── Completed phase summary ───────────────────────────────────────────────────

/**
 * Human-readable record of every development phase included in RC-1.
 * Used in the release notes overlay and telemetry exports.
 */
export interface PhaseEntry {
  phase: number
  title: string
  /** One-line summary of what was delivered. */
  summary: string
}

export const RC_PHASE_LOG: readonly PhaseEntry[] = [
  { phase: 1,   title: 'Project Scaffold',             summary: 'Vite + React + Three.js + Zustand skeleton with Hushwood terrain stub.' },
  { phase: 2,   title: 'Player Movement',              summary: 'Over-the-shoulder keyboard movement, orbit camera, collision detection.' },
  { phase: 3,   title: 'Hushwood Settlement',          summary: 'First full region: buildings, props, ambient NPCs.' },
  { phase: 4,   title: 'Inventory System',             summary: 'Item schema, slot-based inventory, quantity stacking.' },
  { phase: 5,   title: 'Woodcutting Skill',            summary: 'Ash trees, chopping action, XP curve, level gating.' },
  { phase: 6,   title: 'Mining Skill',                 summary: 'Redwake ore nodes, pick interaction, smelting stub.' },
  { phase: 7,   title: 'Fishing Skill',                summary: 'Shoreline nodes, rod casting, warm-scale fish drops.' },
  { phase: 8,   title: 'Foraging Skill',               summary: 'Marsh herb and berry nodes, foraging level gating.' },
  { phase: 9,   title: 'Cooking / Hearthcraft',        summary: 'Campfire station, recipe system, food item definitions.' },
  { phase: 10,  title: 'Smithing / Forging',           summary: 'Forge station, smelt + forge workflow, fensteel bar chain.' },
  { phase: 11,  title: 'NPC Dialogue System',          summary: 'DialogueTree engine, choice branches, summary field.' },
  { phase: 12,  title: 'Task / Quest System',          summary: 'Task registry, objectives, rewards, journal panel.' },
  { phase: 13,  title: 'Economy — Marks Currency',     summary: 'Coin field on player stats, pricing model.' },
  { phase: 14,  title: 'Shop System',                  summary: 'Vendor definitions, buy/sell workflow, finite stock.' },
  { phase: 15,  title: 'Ledger Hall Storage',          summary: 'Off-player storage deposit/withdraw with ledger panel.' },
  { phase: 16,  title: 'Combat Foundation',            summary: 'Creature spawning, player attack, HP loss, respawn.' },
  { phase: 17,  title: 'Faction / Reputation',         summary: 'Faction definitions, rep gain, trust tier checks.' },
  { phase: 18,  title: 'Equipment System',             summary: 'Gear slots, equip/unequip, stat bonuses.' },
  { phase: 19,  title: 'Mobile Touch Controls',        summary: 'Virtual joystick, touch orbit, safe-area layout.' },
  { phase: 20,  title: 'PWA Support',                  summary: 'Web app manifest, service worker, installable.' },
  { phase: 21,  title: 'Redwake Quarry Region',        summary: 'Second region: quarry terrain, mining density nodes.' },
  { phase: 22,  title: 'Gloamwater Shoreline Region',  summary: 'Third region: shoreline bank, fishing density nodes.' },
  { phase: 23,  title: 'Ashfen Copse Region',          summary: 'Fourth region: ashfen terrain, foraging density nodes.' },
  { phase: 24,  title: 'Tinkering Skill',              summary: 'Tinkerer bench, device recipes, tinker-level gating.' },
  { phase: 25,  title: 'Tailoring Skill',              summary: 'Loom station, fabric recipes, cloth item chain.' },
  { phase: 26,  title: 'Carving Skill',                summary: 'Carving bench, bone / wood carving, trophy items.' },
  { phase: 27,  title: 'Warding Skill',                summary: 'Warding basin, ward recipes, creature ward checks.' },
  { phase: 28,  title: 'Surveying Skill',              summary: 'Survey chalk, cache system, marker placement.' },
  { phase: 29,  title: 'Ranged Combat',                summary: 'Bow slot, projectile travel, ranged creature variants.' },
  { phase: 30,  title: 'Boss Encounter',               summary: 'Vault Heart encounter, health bar, phase transitions.' },
  { phase: 31,  title: 'Creature Bestiary Pass',       summary: 'Cinderhare, Mossback Toad, Thornling, Slatebeak, Mireling.' },
  { phase: 32,  title: 'Marrowfen Region',             summary: 'Fifth region: marshy terrain, marrowfen spore nodes.' },
  { phase: 33,  title: 'Tidemark Chapel Region',       summary: 'Sixth region: coastal ruins, lore interactables.' },
  { phase: 34,  title: 'Belowglass Vaults Region',     summary: 'Seventh region: underground engine-crypts.' },
  { phase: 35,  title: 'Hollow Vault Region',          summary: 'Eighth region: hollow Deep Heart chamber.' },
  { phase: 36,  title: 'Brackroot Trail Region',       summary: 'Ninth region: connecting trail, ambient landmarks.' },
  { phase: 37,  title: 'Hazard System',                summary: 'Environmental hazards, damage zones, warning HUD.' },
  { phase: 38,  title: 'Food / Buff System',           summary: 'Consumable foods, temporary stat boosts, buff timer.' },
  { phase: 39,  title: 'Salvage System',               summary: 'Salvage nodes, junk items, partial-material rewards.' },
  { phase: 40,  title: 'Lighting Pass',                summary: 'Point lights at forges, lanterns, camp fires.' },
  { phase: 41,  title: 'VFX Pass',                     summary: 'Particle emitters for gather, craft, combat hits.' },
  { phase: 42,  title: 'NPC Questline Chains',         summary: 'Multi-step questlines: Elder introduction, Foreman contract, Survey reach, Warden legacy.' },
  { phase: 43,  title: 'Respawn / Death System',       summary: 'Respawn overlay, spawn-point selection, coin penalty.' },
  { phase: 44,  title: 'Minimap HUD',                  summary: 'Overhead region minimap, player dot, region label.' },
  { phase: 45,  title: 'Hidden Cache System',          summary: 'Surveying caches placed across regions, loot tables.' },
  { phase: 67,  title: 'Gating Framework',             summary: 'Requirement engine (skill/task/item/faction), gated doors.' },
  { phase: 76,  title: 'Faction Persistence',          summary: 'Faction rep serialised in save schema v1.' },
  { phase: 85,  title: 'Vendor Session Reset',         summary: 'resetEachSession flag strips vendor stock from saves.' },
  { phase: 86,  title: 'Task Persistence',             summary: 'Active + completed task records serialised in save schema.' },
  { phase: 87,  title: "Warden's Legacy Questline",    summary: "Three-step chain: vault_heart → wardens_echo → wardens_legacy." },
  { phase: 88,  title: 'LOD / Streaming Pass',         summary: '8 region chunks with hysteresis-band show/hide (20-unit band).' },
  { phase: 89,  title: 'Accessibility / Readability',  summary: 'reducedMotion + fontScale prefs, focus-visible rings.' },
  { phase: 90,  title: 'Save Robustness / Migration',  summary: 'SAVE_VERSION=2, backup key, step-by-step migration runner, corruption recovery.' },
  { phase: 91,  title: 'Content Density Pass',         summary: 'Ambient props + interactable landmarks in all corridors.' },
  { phase: 92,  title: 'Day / Night Cycle',            summary: '10-keyframe lighting table, period transitions, FogExp2.' },
  { phase: 93,  title: 'Audio Polish Pass',            summary: 'Creature SFX types, region stinger, craft/level-up audio.' },
  { phase: 94,  title: 'World Cohesion Lore Pass',     summary: 'NPC summaries, vault inscription, improved task descriptions.' },
  { phase: 95,  title: 'Weather System',               summary: 'clear/overcast/rain/storm/fog states, tick-based transitions, WeatherHud.' },
  { phase: 96,  title: 'Public Demo Slice Selection',  summary: 'DEMO_REGIONS(4), DEMO_SKILLS(6), DEMO_QUESTLINES(3), 11 locked content items.' },
  { phase: 97,  title: 'Demo Polish Pass',             summary: 'DemoWelcomeOverlay playtime badge, CSS animations, new-game notification.' },
  { phase: 98,  title: 'Telemetry Hooks',              summary: 'Local-only 500-event ring-buffer; 7 event types wired to key systems.' },
  { phase: 99,  title: 'Expansion Backlog Authoring',  summary: '18 backlog items P0–P3, 6 feature buckets, 11 cut/keep entries, 7 risk notes.' },
  { phase: 100, title: 'Release Candidate Stabilization', summary: 'Lint clean, chunk splitting, RC manifest, README refresh, content consistency.' },
] as const

// ── Known limitations (open issues entering RC-1) ────────────────────────────

/**
 * Tracked issues that are acknowledged but deferred to post-demo expansion.
 * Each entry maps to a P0/P1/P2 item in EXPANSION_BACKLOG.
 */
export interface KnownIssue {
  id: string
  severity: 'high' | 'medium' | 'low'
  description: string
  /** Corresponding backlog item id. */
  backlogRef: string
}

export const RC_KNOWN_ISSUES: readonly KnownIssue[] = [
  {
    id: 'save_gating_transient',
    severity: 'medium',
    description:
      'Opened gated doors are not persisted in the save snapshot. ' +
      'Doors re-evaluate their requirements on load, so players who meet ' +
      'the gate requirements will not be blocked again, but the door mesh ' +
      'reappears until interacted with. Tracked as save_integrity_hotfixes (P0).',
    backlogRef: 'save_integrity_hotfixes',
  },
  {
    id: 'three_draw_call_budget',
    severity: 'medium',
    description:
      'With 10+ simultaneous creature spawns the Three.js draw-call count ' +
      'approaches mobile GPU limits. InstancedMesh migration is tracked in ' +
      'the expansion backlog systems_hardening bucket.',
    backlogRef: 'systems_hardening',
  },
  {
    id: 'audio_safari_limit',
    severity: 'low',
    description:
      'AudioContext node limit is tighter on Safari/iOS. Region stingers ' +
      'and layered SFX may drop on older iPhones during dense combat sequences.',
    backlogRef: 'systems_hardening',
  },
  {
    id: 'lod_hysteresis_tuning',
    severity: 'low',
    description:
      'The Phase 88 LOD hysteresis band (20 units) may need re-tuning once ' +
      'mid-game regions with higher prop density are unlocked.',
    backlogRef: 'systems_hardening',
  },
] as const

// ── Smoke-test checklist ──────────────────────────────────────────────────────

/**
 * Minimal smoke-test paths that must pass before shipping the RC.
 * Intended for a human QA reviewer or automated test scaffolding.
 */
export interface SmokeTest {
  id: string
  description: string
  /** System under test. */
  system: string
}

export const RC_SMOKE_TESTS: readonly SmokeTest[] = [
  { id: 'sm_01', system: 'world',     description: 'Player spawns in Hushwood with correct default stats.' },
  { id: 'sm_02', system: 'movement',  description: 'WASD movement and camera orbit work on desktop.' },
  { id: 'sm_03', system: 'mobile',    description: 'Virtual joystick and interact button respond on a touch viewport.' },
  { id: 'sm_04', system: 'gathering', description: 'Chopping an Ash Log awards item + XP and updates the skill panel.' },
  { id: 'sm_05', system: 'crafting',  description: 'Smelting ore at the forge produces a bar and deducts inventory.' },
  { id: 'sm_06', system: 'combat',    description: 'Attacking a Cinderhare deals damage; defeating it awards XP.' },
  { id: 'sm_07', system: 'quest',     description: "Talking to Edda Mire accepts the Elder's Introduction questline." },
  { id: 'sm_08', system: 'save',      description: 'Manual save followed by page reload restores player stats and inventory.' },
  { id: 'sm_09', system: 'save',      description: 'Corrupt primary save falls back to backup with a warning notification.' },
  { id: 'sm_10', system: 'demo',      description: 'Demo welcome overlay appears on new game and dismisses cleanly.' },
  { id: 'sm_11', system: 'daynight',  description: 'Day/night cycle advances and lighting changes are visible over time.' },
  { id: 'sm_12', system: 'weather',   description: 'Weather transitions occur and WeatherHud reflects the current state.' },
  { id: 'sm_13', system: 'audio',     description: 'Background music starts on new game; SFX fire on gather/craft.' },
  { id: 'sm_14', system: 'access',    description: 'Reduced-motion toggle suppresses CSS animations; font-scale applies.' },
  { id: 'sm_15', system: 'telemetry', description: 'exportTelemetry() returns a session_start event after page load.' },
] as const
