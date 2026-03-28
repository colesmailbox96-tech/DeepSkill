/**
 * Phase 100 — Release Candidate Stabilization
 * Phase 101 — Comprehensive Pass (phase log entry added; RC-1 build unchanged)
 *
 * Central manifest describing the RC-1 demo build of Veilmarch.
 * Intended to be consumed by the main menu and future crash/feedback reporters
 * to surface version information without coupling UI to individual engine files.
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
export const RC_PHASE = 102 as const

// ── Completed phase summary ───────────────────────────────────────────────────

/**
 * Curated milestone summary of key development phases included in RC-1.
 * Lists the canonical phase number for each system as tagged in its source
 * file — phases that were internal sub-iterations or minor balance passes
 * are not separately enumerated.
 * Used in the release notes overlay and telemetry exports.
 */
export interface PhaseEntry {
  phase: number
  title: string
  /** One-line summary of what was delivered. */
  summary: string
}

export const RC_PHASE_LOG: readonly PhaseEntry[] = [
  { phase: 7,   title: 'Hushwood Blockout',             summary: 'First full region: buildings, props, ambient NPC stubs, exterior traversal.' },
  { phase: 8,   title: 'NPC Placement',                 summary: 'Six starter NPCs placed in Hushwood; ambient sway; dialogue scaffolding.' },
  { phase: 16,  title: 'Woodcutting Node System',       summary: 'Ash tree variants, chopping action, XP curve, level gating.' },
  { phase: 17,  title: 'Mining Node System',            summary: 'Redwake ore nodes, pick interaction, XP curve.' },
  { phase: 18,  title: 'Redwake Quarry Region',         summary: 'Second region: quarry terrain, dense mining nodes, Olen NPC.' },
  { phase: 19,  title: 'Fishing Node System',           summary: 'Shoreline fishing spots, rod casting, warm-scale fish drops.' },
  { phase: 20,  title: 'Gloamwater Shoreline Region',   summary: 'Third region: shoreline bank, fishing density nodes, Brin Salt NPC.' },
  { phase: 21,  title: 'Foraging System',               summary: 'Marsh herb and berry nodes, foraging level gating.' },
  { phase: 22,  title: 'Cooking / Hearthcraft',         summary: 'Campfire station, recipe system, food item definitions.' },
  { phase: 23,  title: 'Starter Shop',                  summary: 'Vendor definitions, buy/sell workflow, finite stock.' },
  { phase: 24,  title: 'Economy — Marks Currency',      summary: 'Coin field on player stats, pricing model, Marks (⬡) display.' },
  { phase: 25,  title: 'Ledger Hall Storage',           summary: 'Off-player storage deposit/withdraw with ledger panel.' },
  { phase: 26,  title: 'Equipment System',              summary: 'Gear slots, equip/unequip, stat bonuses.' },
  { phase: 29,  title: 'Non-Aggressive Wildlife',       summary: 'Passive creature variants (Cinderhare, Slatebeak) with ambient wander.' },
  { phase: 31,  title: 'Combat Foundation',             summary: 'Hostile creature spawning, player melee attack, HP loss.' },
  { phase: 33,  title: 'Food Consumption in Combat',    summary: 'Consumable foods, temporary stat boosts during combat.' },
  { phase: 34,  title: 'Respawn / Recovery Loop',       summary: 'Respawn overlay, spawn-point selection, coin penalty.' },
  { phase: 35,  title: 'Brackroot Trail Region',        summary: 'Ninth region: connecting trail, ambient landmarks.' },
  { phase: 36,  title: 'Dialogue Framework',            summary: 'DialogueTree engine, choice branches, optional summary field.' },
  { phase: 37,  title: 'Task / Quest Framework',        summary: 'Task registry, objectives, rewards, journal panel.' },
  { phase: 40,  title: 'Smithing / Forging',            summary: 'Forge station, smelt + forge workflow, fensteel bar chain.' },
  { phase: 42,  title: 'Carving Skill',                 summary: 'Carving bench, bone / wood carving, trophy items.' },
  { phase: 43,  title: 'Tinkering Skill',               summary: 'Tinkerer bench, device recipes, tinker-level gating.' },
  { phase: 44,  title: 'Surveying Skill',               summary: 'Survey chalk, marker placement, XP curve.' },
  { phase: 45,  title: 'Hidden Cache System',           summary: 'Surveying caches placed across regions, loot tables.' },
  { phase: 46,  title: 'Warding Skill',                 summary: 'Warding basin, ward recipes, creature ward checks.' },
  { phase: 47,  title: 'Tidemark Chapel Region',        summary: 'Sixth region: coastal ruins, hazard zone, lore interactables.' },
  { phase: 48,  title: 'Environmental Hazard System',   summary: 'Damage zones, persistent warning HUD, Marrowfen gas vents.' },
  { phase: 49,  title: 'Audio Foundation',              summary: 'Howler.js integration, background music, volume settings.' },
  { phase: 51,  title: 'Main Menu Screen',              summary: 'Full-screen title overlay; Continue / New Game / Settings.' },
  { phase: 54,  title: 'Minimap HUD',                   summary: 'Overhead region minimap, player dot, region label.' },
  { phase: 57,  title: 'Ashfen Copse Region',           summary: 'Fourth region: ashfen terrain, foraging nodes, Duskiron seam.' },
  { phase: 61,  title: 'Ranged Combat',                 summary: 'Bow slot, projectile travel, ranged creature variants.' },
  { phase: 63,  title: 'Tailoring Skill',               summary: 'Loom station, fabric recipes, cloth item chain.' },
  { phase: 65,  title: 'Hollow Vault Region',           summary: 'Eighth region: hollow Deep Heart chamber, item-gated inner door.' },
  { phase: 66,  title: 'Salvage System',                summary: 'Salvage nodes, junk items, partial-material rewards.' },
  { phase: 67,  title: 'Gating Framework',              summary: 'Requirement engine (skill/task/item/faction), collidable gated doors.' },
  { phase: 68,  title: 'Lighting Mechanics',            summary: 'Darkness zones, lantern item, visibility penalty.' },
  { phase: 72,  title: 'VFX Pass',                      summary: 'Particle emitters for gather, craft, combat hits.' },
  { phase: 74,  title: 'Marrowfen Region',              summary: 'Fifth region: marshy terrain, marrowfen spore nodes, gas-vent hazards.' },
  { phase: 76,  title: 'Faction / Reputation System',   summary: 'Faction definitions, rep gain, trust tier checks, faction panel.' },
  { phase: 78,  title: 'Belowglass Vaults Region',      summary: 'Seventh region: underground engine-crypts, salvage tier.' },
  { phase: 83,  title: 'Boss Encounter Framework',      summary: 'BossPhaseThreshold, health bar, phase transitions.' },
  { phase: 87,  title: "Warden's Legacy Questline",     summary: "Three-step chain: vault_heart → wardens_echo → wardens_legacy." },
  { phase: 88,  title: 'LOD / Streaming Pass',          summary: '8 region chunks with hysteresis-band show/hide (20-unit band).' },
  { phase: 89,  title: 'Accessibility / Readability',   summary: 'reducedMotion + fontScale prefs, focus-visible rings.' },
  { phase: 90,  title: 'Save Robustness / Migration',   summary: 'SAVE_VERSION=2, backup key, step-by-step migration runner, corruption recovery.' },
  { phase: 91,  title: 'Content Density Pass',          summary: 'Ambient props + interactable landmarks in all corridors.' },
  { phase: 92,  title: 'Day / Night Cycle',             summary: '10-keyframe lighting table, period transitions, FogExp2.' },
  { phase: 93,  title: 'Audio Polish Pass',             summary: 'Creature SFX types, region stinger, craft/level-up audio.' },
  { phase: 94,  title: 'World Cohesion Lore Pass',      summary: 'NPC summaries, vault inscription, improved task descriptions.' },
  { phase: 95,  title: 'Weather System',                summary: 'clear/overcast/rain/storm/fog states, tick-based transitions, WeatherHud.' },
  { phase: 96,  title: 'Public Demo Slice Selection',   summary: 'DEMO_REGIONS(4), DEMO_SKILLS(6), DEMO_QUESTLINES(3), 12 locked content items.' },
  { phase: 97,  title: 'Demo Polish Pass',              summary: 'DemoWelcomeOverlay playtime badge, CSS animations, new-game notification.' },
  { phase: 98,  title: 'Telemetry Hooks',               summary: 'Local-only 500-event ring-buffer; 7 event types wired to key systems.' },
  { phase: 99,  title: 'Expansion Backlog Authoring',   summary: '18 backlog items P0–P3, 6 feature buckets, 10 cut/keep entries, 7 risk notes.' },
  { phase: 100, title: 'Release Candidate Stabilization', summary: 'Lint clean, chunk splitting, RC manifest wired to main menu, README refresh.' },
  { phase: 101, title: 'Comprehensive Pass — High-Impact Feature Identification', summary: '24 PassFeatures across 4 sprint groups; ImpactMatrix, SprintGroup manifest, and helper functions for sprint planning.' },
  { phase: 102, title: 'Gated Door Save State — Save Schema v3', summary: 'openedGates set persisted in save snapshot; v2→v3 migration; 5 gated doors restored from save on first frame.' },
] as const

// ── Known limitations (open issues entering RC-1) ────────────────────────────

/**
 * Tracked issues that are acknowledged but deferred to post-demo expansion.
 * Each entry maps to either a P0/P1/P2 backlog item or a thematic backlog
 * bucket (for example, the systems_hardening bucket in EXPANSION_BACKLOG).
 */
export interface KnownIssue {
  id: string
  severity: 'high' | 'medium' | 'low'
  description: string
  /**
   * Corresponding backlog identifier — either a concrete backlog item id
   * (for example, `save_integrity_hotfixes`) or a backlog bucket id
   * (for example, `systems_hardening`).
   */
  backlogRef: string
}

export const RC_KNOWN_ISSUES: readonly KnownIssue[] = [
  {
    id: 'save_gating_transient',
    severity: 'medium',
    description:
      'FIXED (Phase 102): Opened gated doors are now persisted in the save snapshot via ' +
      'the openedGates field (save schema v3). Doors are restored from the save on the ' +
      'first animation frame after loading and do not reappear. v2→v3 migration seeds ' +
      'openedGates as an empty set for existing saves.',
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
