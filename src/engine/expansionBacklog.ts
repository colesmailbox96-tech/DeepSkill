/**
 * Phase 99 — Expansion Backlog Authoring
 *
 * Goal: organise post-demo work rather than improvising chaos.
 *
 * This file is the single authoritative source for what gets built after the
 * public demo.  It is structured in four sections:
 *
 *  1. Ranked Backlog  — every post-demo work item, ordered by priority tier.
 *  2. Feature Buckets — categorical groupings used for sprint planning.
 *  3. Cut vs Keep     — explicit triage of scope that is deprioritised or removed.
 *  4. Risk Notes      — known technical or design hazards that must be tracked.
 *
 * Priority tiers
 * ──────────────
 *  P0  Critical — blocking release or actively breaking the player experience.
 *  P1  High     — unlocks the next major content gate; schedule in the next sprint.
 *  P2  Medium   — meaningful expansion; schedule once P1 items clear.
 *  P3  Low      — nice-to-have or polish; park until bandwidth allows.
 *
 * Telemetry signals that informed ranking
 * ────────────────────────────────────────
 *  Phase 98 added local-only telemetry (session_start / new_game /
 *  area_entered / skill_level_up / quest_complete / player_defeated /
 *  demo_overlay_dismissed).  Until real demo sessions supply data, rankings
 *  reflect design intent and known gap analysis from the demo slice audit.
 */

// ─── 1. Ranked Backlog ────────────────────────────────────────────────────────

export type BacklogPriority = 'P0' | 'P1' | 'P2' | 'P3'
export type BacklogBucket =
  | 'world_expansion'
  | 'skill_expansion'
  | 'combat_expansion'
  | 'narrative_expansion'
  | 'systems_hardening'
  | 'balance_and_feel'

export interface BacklogItem {
  id: string
  title: string
  priority: BacklogPriority
  bucket: BacklogBucket
  /** One-line rationale explaining why this item belongs at this priority. */
  rationale: string
  /**
   * Prerequisite backlog item ids that must ship before this one is attempted.
   * Empty array means no blocking dependency.
   */
  blockedBy: string[]
}

export const EXPANSION_BACKLOG: BacklogItem[] = [
  // ── P0 — Critical ─────────────────────────────────────────────────────────

  {
    id: 'demo_feedback_balance',
    title: 'Demo Feedback Integration — balance pass from telemetry',
    priority: 'P0',
    bucket: 'balance_and_feel',
    rationale:
      'Telemetry signals (skill_level_up cadence, player_defeated locations, quest_complete ordering) ' +
      'directly inform XP curve, encounter difficulty, and quest reward tuning.  Must land before ' +
      'wider distribution to avoid anchoring new players on broken numbers.',
    blockedBy: [],
  },
  {
    id: 'save_integrity_hotfixes',
    title: 'Save Integrity Hotfixes — address any corruption edge-cases surfaced by demo',
    priority: 'P0',
    bucket: 'systems_hardening',
    rationale:
      'Phase 90 added migration and backup keys; demo sessions may surface edge-cases in ' +
      'applySaveMigrations or the primary→backup fallback path.  A broken save loop is a hard blocker ' +
      'for any further retention work.',
    blockedBy: [],
  },
  {
    id: 'respawn_feel',
    title: 'Respawn Loop Feel — reduce frustration at the player_defeated screen',
    priority: 'P0',
    bucket: 'balance_and_feel',
    rationale:
      'player_defeated telemetry will reveal the most common death contexts.  If early deaths cluster ' +
      'in a single zone the penalty curve must be adjusted before release so new players are not ' +
      'discouraged before reaching the first skill milestone.',
    blockedBy: [],
  },

  // ── P1 — High ─────────────────────────────────────────────────────────────

  {
    id: 'unlock_marrowfen',
    title: 'Unlock Marrowfen — open mid-game region to players post-demo',
    priority: 'P1',
    bucket: 'world_expansion',
    rationale:
      'Marrowfen is fully authored (Phase 74) and sits behind the demo gate.  Unlocking it gives ' +
      'players a clear "what is next" destination and exercises the hazard, creature, and loot systems ' +
      'at mid-game difficulty.',
    blockedBy: ['demo_feedback_balance'],
  },
  {
    id: 'unlock_brackroot',
    title: 'Unlock Brackroot — open advanced corridor and deepen the trail zone',
    priority: 'P1',
    bucket: 'world_expansion',
    rationale:
      'Brackroot (Phase 35 + Phase 91 density pass) is feature-complete.  It connects Hushwood to ' +
      'Marrowfen; the demo gate must be lifted together with Marrowfen to preserve traversal continuity.',
    blockedBy: ['unlock_marrowfen'],
  },
  {
    id: 'unlock_tinkering',
    title: 'Unlock Tinkering Skill — advanced gear assembly available post-demo',
    priority: 'P1',
    bucket: 'skill_expansion',
    rationale:
      'Tinkering provides the only route to lanterns, tool upgrades, and the Warden Focus neck-slot ' +
      '(Phase 87).  Keeping it locked past demo exit stunts the mid-game gear ladder.',
    blockedBy: ['demo_feedback_balance'],
  },
  {
    id: 'unlock_tailoring',
    title: 'Unlock Tailoring Skill — cloth and leather armour routes post-demo',
    priority: 'P1',
    bucket: 'skill_expansion',
    rationale:
      'Tailoring fills the cloth/leather armour slot that smithing cannot cover.  Required before ' +
      'the Marrowfen hazard tier becomes comfortable for most player builds.',
    blockedBy: ['unlock_marrowfen'],
  },
  {
    id: 'unlock_carving',
    title: 'Unlock Carving Skill — bone, wood, and resin craft routes post-demo',
    priority: 'P1',
    bucket: 'skill_expansion',
    rationale:
      'Carving unlocks mid-tier tools and consumables sourced from forage/gathering surplus.  ' +
      'It closes the gap between gathering abundance and crafting poverty for non-metal builds.',
    blockedBy: ['demo_feedback_balance'],
  },

  // ── P2 — Medium ───────────────────────────────────────────────────────────

  {
    id: 'unlock_warding',
    title: 'Unlock Warding Skill — magical wards and the Chapel questline',
    priority: 'P2',
    bucket: 'skill_expansion',
    rationale:
      'Warding is the specialist defensive skill tied to Tidemark Chapel lore.  Unlocking it requires ' +
      'Tidemark to be accessible; bundle with that region unlock.',
    blockedBy: ['unlock_tidemark_chapel'],
  },
  {
    id: 'unlock_surveying',
    title: 'Unlock Surveying Skill — secret paths and hidden cache content',
    priority: 'P2',
    bucket: 'skill_expansion',
    rationale:
      'Phase 44 and Phase 80 authored surveying and secret-path content.  Unlocking the skill adds ' +
      'replayability for completionist players and surfaces lore nodes buried across all regions.',
    blockedBy: ['unlock_marrowfen'],
  },
  {
    id: 'unlock_tidemark_chapel',
    title: 'Unlock Tidemark Chapel — mist-hazard region and storyline arc',
    priority: 'P2',
    bucket: 'world_expansion',
    rationale:
      'Chapel is the narrative centrepiece linking Nairn Dusk to the Warden lore.  It requires the ' +
      'mist/darkness hazard system (Phase 68) which is already implemented.  Schedule after P1 ' +
      'content settles player progression.',
    blockedBy: ['unlock_marrowfen', 'unlock_tailoring'],
  },
  {
    id: 'unlock_hollow_vault',
    title: 'Unlock Hollow Vault — late-game salvage and vault exploration',
    priority: 'P2',
    bucket: 'world_expansion',
    rationale:
      'Hollow Vault (Phase 65 + Phase 66 salvage) is feature-complete.  It serves as the mid-to-late ' +
      'gateway and is the spatial prerequisite for Belowglass Vaults access.',
    blockedBy: ['unlock_tidemark_chapel'],
  },
  {
    id: 'mid_game_creature_pack',
    title: 'Mid-Game Creature Pack — Chapel Wisp, Hushfang, Ember Ram, Silt Widow',
    priority: 'P2',
    bucket: 'combat_expansion',
    rationale:
      'Blueprint mid-game creature list (§1987–1994) is not yet populated.  These mobs bridge ' +
      'the difficulty gap between starter Cinderhare/Thornling encounters and the Vault Skulk tier.',
    blockedBy: ['unlock_marrowfen'],
  },
  {
    id: 'advanced_questlines',
    title: 'Advanced Questlines — faction-specific chains for Tidebound and Quarry Union',
    priority: 'P2',
    bucket: 'narrative_expansion',
    rationale:
      'Phase 75 authored mid-tier questlines; faction trust (Phase 76) and faction rewards (Phase 77) ' +
      'exist but the narrative chains are thin.  Fleshing them out gives players a reason to engage ' +
      'faction standing beyond vendor unlocks.',
    blockedBy: ['unlock_marrowfen', 'unlock_tidemark_chapel'],
  },
  {
    id: 'late_game_materials',
    title: 'Late-Game Material Tier — Vaultglass Shard, Heartwire Coil, Pressure-Sintered Plate',
    priority: 'P2',
    bucket: 'skill_expansion',
    rationale:
      'Blueprint §1995–2003 defines the late-game material tier but none of these items have drop ' +
      'sources or crafting routes yet.  They anchor the Belowglass crafting endgame.',
    blockedBy: ['unlock_hollow_vault'],
  },

  // ── P3 — Low ──────────────────────────────────────────────────────────────

  {
    id: 'unlock_belowglass_vaults',
    title: 'Unlock Belowglass Vaults — end-game boss dungeon and Warden encounter',
    priority: 'P3',
    bucket: 'world_expansion',
    rationale:
      'Belowglass is fully authored (Phase 78) and the boss framework exists (Phase 83–84).  ' +
      'It is the intended demo-graduation climax but should only open once the preceding content ' +
      'tier proves stable under player load.',
    blockedBy: ['unlock_hollow_vault', 'late_game_materials'],
  },
  {
    id: 'wardens_legacy_chain',
    title: "Warden's Legacy Chain — post-boss questline continuation for Nairn and Aldric",
    priority: 'P3',
    bucket: 'narrative_expansion',
    rationale:
      'Phase 87 authored the chain (wardens_echo + wardens_legacy) but it requires the boss encounter ' +
      'to have been completed.  Only relevant once Belowglass is unlocked.',
    blockedBy: ['unlock_belowglass_vaults'],
  },
  {
    id: 'vault_skulk_expansion',
    title: 'Vault Skulk Expansion — additional Vault-tier hostile variants',
    priority: 'P3',
    bucket: 'combat_expansion',
    rationale:
      'Belowglass has only the Vault Skulk as a primary mob; the dungeon needs 2–3 variants with ' +
      'distinct attack patterns to avoid encounter monotony.',
    blockedBy: ['unlock_belowglass_vaults'],
  },
  {
    id: 'performance_pass_ii',
    title: 'Performance Pass II — Three.js draw-call and geometry budget review',
    priority: 'P3',
    bucket: 'systems_hardening',
    rationale:
      'LOD streaming (Phase 88) and hysteresis logic cover region-scale loading but per-frame ' +
      'draw-call count has not been profiled at full mob density.  Profile in Phase 100 window or ' +
      'whenever frame rate complaints surface from testers.',
    blockedBy: [],
  },
  {
    id: 'new_player_tutorial_ii',
    title: 'New Player Tutorial II — contextual hint overlays for first craft and first combat',
    priority: 'P3',
    bucket: 'balance_and_feel',
    rationale:
      'Phase 86 covered new-player experience; demo telemetry may reveal a specific drop-off point ' +
      'during first-time crafting or combat.  A targeted hint overlay (non-intrusive) is cheaper ' +
      'than redesigning those flows.',
    blockedBy: ['demo_feedback_balance'],
  },
  {
    id: 'audio_expansion',
    title: 'Audio Expansion — new region stingers and crafting SFX variants',
    priority: 'P3',
    bucket: 'balance_and_feel',
    rationale:
      'Phase 93 covered audio polish.  As locked regions open they will reuse placeholder stinger ' +
      'data until dedicated stingers are authored.  Low priority unless a specific region feels ' +
      'tonally wrong to playtesters.',
    blockedBy: ['unlock_marrowfen'],
  },
]

// ─── 2. Feature Buckets ───────────────────────────────────────────────────────

export interface FeatureBucket {
  id: BacklogBucket
  label: string
  description: string
  /** Backlog item ids that belong to this bucket (derived from EXPANSION_BACKLOG). */
  itemIds: string[]
}

function _itemsForBucket(bucket: BacklogBucket): string[] {
  return EXPANSION_BACKLOG.filter((i) => i.bucket === bucket).map((i) => i.id)
}

export const FEATURE_BUCKETS: FeatureBucket[] = [
  {
    id: 'world_expansion',
    label: 'World Expansion',
    description:
      'Unlock existing but gated regions (Marrowfen, Brackroot, Tidemark Chapel, Hollow Vault, ' +
      'Belowglass Vaults) and ensure traversal continuity as each gate lifts.',
    itemIds: _itemsForBucket('world_expansion'),
  },
  {
    id: 'skill_expansion',
    label: 'Skill Expansion',
    description:
      'Open the four advanced crafting skills (Tinkering, Tailoring, Carving, Warding) and the ' +
      'specialist gathering skill (Surveying) that were gated from the demo slice.  Also covers ' +
      'the late-game material tier that anchors endgame crafting.',
    itemIds: _itemsForBucket('skill_expansion'),
  },
  {
    id: 'combat_expansion',
    label: 'Combat Expansion',
    description:
      'Populate the mid-game creature list from the blueprint (Chapel Wisp, Hushfang, Ember Ram, ' +
      'Silt Widow) and extend the Vault Skulk into a small family of variants for Belowglass.',
    itemIds: _itemsForBucket('combat_expansion'),
  },
  {
    id: 'narrative_expansion',
    label: 'Narrative Expansion',
    description:
      "Deepen faction questlines (Tidebound Keepers, Quarry Union) and complete the Warden's Legacy " +
      'post-boss chain.  Narrative work is generally lower-risk but high-retention impact.',
    itemIds: _itemsForBucket('narrative_expansion'),
  },
  {
    id: 'systems_hardening',
    label: 'Systems Hardening',
    description:
      'Address save corruption edge-cases from the demo, profile and improve Three.js draw-call ' +
      'budget, and monitor audio memory as new region stingers are added.',
    itemIds: _itemsForBucket('systems_hardening'),
  },
  {
    id: 'balance_and_feel',
    label: 'Balance & Feel',
    description:
      'Apply post-demo telemetry signal to XP curves, encounter difficulty, respawn penalty, and ' +
      'targeted hint overlays.  This bucket ships continuously as data arrives; it is never truly done.',
    itemIds: _itemsForBucket('balance_and_feel'),
  },
]

// ─── 3. Cut vs Keep List ──────────────────────────────────────────────────────

export type CutKeepDecision = 'keep' | 'cut' | 'defer'

export interface CutKeepEntry {
  label: string
  decision: CutKeepDecision
  reason: string
}

export const CUT_VS_KEEP: CutKeepEntry[] = [
  // ── Keep ──────────────────────────────────────────────────────────────────
  {
    label: 'All five gated regions',
    decision: 'keep',
    reason:
      'Marrowfen, Brackroot, Tidemark Chapel, Hollow Vault, and Belowglass Vaults are fully authored. ' +
      'Cutting any one of them wastes completed work and breaks the intended narrative arc.',
  },
  {
    label: 'All four locked crafting skills (Tinkering, Tailoring, Carving, Warding)',
    decision: 'keep',
    reason:
      'These skills are implemented and tested.  They are the primary driver of mid-to-late-game ' +
      'engagement; removing any of them would create a noticeable crafting gap.',
  },
  {
    label: 'Surveying skill and secret-path content',
    decision: 'keep',
    reason:
      'Surveying adds replayability and lore depth.  It is low-effort to unlock given Phase 80 ' +
      'already authored the hidden-cache and secret-path systems.',
  },
  {
    label: "Warden's Legacy questline chain",
    decision: 'keep',
    reason:
      'Provides narrative closure for Nairn Dusk and Aldric; authored in Phase 87.  ' +
      'This is the planned post-boss reward loop and should not be cut.',
  },
  {
    label: 'Boss encounter (Vault Heart Warden)',
    decision: 'keep',
    reason:
      'The boss framework and first encounter are implemented (Phases 83–84).  It is the climactic ' +
      'moment the entire demo funnel points toward; cutting it would leave no satisfying endpoint.',
  },
  {
    label: 'LOD / streaming (Phase 88)',
    decision: 'keep',
    reason:
      'Critical for browser performance as locked regions open.  The hysteresis tuning may need ' +
      'adjustment but the system itself must remain.',
  },

  // ── Cut ───────────────────────────────────────────────────────────────────
  {
    label: 'Tool durability / wear system (Phase 73 decision deferred)',
    decision: 'cut',
    reason:
      'Phase 73 was explicitly a "Decision Phase" and the decision was to defer.  Adding ' +
      'durability friction now would hurt new-player onboarding without meaningful design payoff.  ' +
      'Cutting it permanently keeps the gathering loop frictionless.',
  },
  {
    label: 'Broad animation integration pass (Phase 71 partial)',
    decision: 'cut',
    reason:
      'Full skeletal animation is scope-heavy and risks introducing regression across all region ' +
      'builders.  The current geometry-swap approach is sufficient for the demo aesthetic.  ' +
      'A dedicated animation sprint should be its own future phase, not bundled with expansion.',
  },

  // ── Defer ─────────────────────────────────────────────────────────────────
  {
    label: 'Multiplayer / co-op layer',
    decision: 'defer',
    reason:
      'Not referenced anywhere in the 100-phase blueprint.  If community interest emerges post-demo ' +
      'this is a candidate for a separate expansion blueprint, but it would require rebuilding the ' +
      'interaction and state models from scratch.',
  },
  {
    label: 'Cloud save / cross-device sync',
    decision: 'defer',
    reason:
      'localStorage persistence is correct for the demo scope.  Cloud sync requires an authenticated ' +
      'backend which is outside the current no-server privacy stance established in Phase 98.',
  },
  {
    label: 'Additional biome (beyond the nine authored regions)',
    decision: 'defer',
    reason:
      'The nine-region blueprint is coherent as-is.  A tenth region should only be authored once ' +
      'all nine are open, balanced, and fully questlined.  Premature expansion creates content debt.',
  },
]

// ─── 4. Risk Notes ────────────────────────────────────────────────────────────

export type RiskSeverity = 'high' | 'medium' | 'low'

export interface RiskNote {
  id: string
  title: string
  severity: RiskSeverity
  description: string
  /** Suggested mitigation action. */
  mitigation: string
}

export const RISK_NOTES: RiskNote[] = [
  {
    id: 'threejs_drawcall_budget',
    title: 'Three.js draw-call budget under full mob density',
    severity: 'high',
    description:
      'LOD streaming (Phase 88) hides regions but individual creature meshes are not instanced. ' +
      'When mid-game regions open and spawn 10+ creatures simultaneously, frame rate on low-end ' +
      'mobile hardware may drop below the 30 fps target.',
    mitigation:
      'Profile using Chrome DevTools Performance tab with all mid-game regions loaded. ' +
      'Apply InstancedMesh where the same creature geometry appears more than three times per frame. ' +
      'Schedule as part of Performance Pass II (backlog id: performance_pass_ii).',
  },
  {
    id: 'save_schema_growth',
    title: 'Save schema growth as new skills and regions unlock',
    severity: 'high',
    description:
      'Phase 90 established SAVE_VERSION=2 with applySaveMigrations.  Each skill unlock, region ' +
      'gate state, and new task type will require a migration step.  Failing to author migrations ' +
      'will silently corrupt saves for returning players.',
    mitigation:
      'Increment SAVE_VERSION and add an explicit migration step in MIGRATION_TABLE for every ' +
      'structural change to the persisted game state.  Add a migration regression test before ' +
      'any expansion ships.',
  },
  {
    id: 'audio_memory_region_stingers',
    title: 'Audio memory growth from additional region stingers',
    severity: 'medium',
    description:
      'Each new region unlock may require a dedicated audio stinger.  Phase 93 routed stingers ' +
      'through musicGain but did not cap total AudioBuffer memory.  On Safari/iOS, AudioContext ' +
      'memory limits are tighter than desktop Chrome.',
    mitigation:
      'Audit AudioBuffer allocation in audio.ts after each region unlock.  Prefer streaming or ' +
      'shared base stingers with region-specific short motif overlays to reduce total buffer count.',
  },
  {
    id: 'lod_hysteresis_tuning',
    title: 'LOD hysteresis band needs re-tuning as regions open',
    severity: 'medium',
    description:
      'Phase 88 set a 20-unit show/hide gap.  With more regions loaded simultaneously the active ' +
      'RegionLODEntry set grows, and the hysteresis threshold that was appropriate for four demo ' +
      'regions may cause visible pop-in or unnecessary work when traversing corridor zones.',
    mitigation:
      'Increase hysteresis band to 30 units or make it per-region based on region bounding radius ' +
      'once Marrowfen and Brackroot are simultaneously loadable.  Re-measure on a mid-spec mobile device.',
  },
  {
    id: 'gating_state_consistency',
    title: 'Content-gate state must stay consistent across save/load cycles',
    severity: 'medium',
    description:
      'demoSlice.ts defines the gate list but the gate state (what is locked vs unlocked) is ' +
      'derived at runtime.  As expansion unlock logic is added, gate state must be serialised and ' +
      'migrated correctly or players will find previously-unlocked content re-locked after a save reload.',
    mitigation:
      'Add a dedicated `unlockedRegions` and `unlockedSkills` set to the save schema (v3 migration). ' +
      'Derive gate rendering from the saved set rather than hardcoded demo constants once expansion ' +
      'gates become dynamic.',
  },
  {
    id: 'telemetry_signal_lag',
    title: 'Telemetry data lag — real demo sessions needed before balance numbers are trustworthy',
    severity: 'low',
    description:
      'Phase 98 telemetry is local-only and voluntary.  Balance item demo_feedback_balance is ' +
      'ranked P0 but the underlying data depends on testers actually exporting and sharing their ' +
      'session JSON.  Decisions made before sufficient sessions are collected may be wrong.',
    mitigation:
      'Set a minimum threshold of 10 exported sessions before committing to XP curve changes. ' +
      'Mark any balance changes shipped before that threshold as provisional and plan a follow-up ' +
      'tuning pass once the 10-session floor is reached.',
  },
  {
    id: 'faction_trust_balance',
    title: 'Faction trust balance — trust gain rates untested beyond demo scope',
    severity: 'low',
    description:
      'Phase 76 implemented faction trust but only three questlines (all Hushwood-centric) run in ' +
      'the demo.  When faction-specific questlines (Tidebound, Quarry Union) open, the relative ' +
      'trust gain rates may create dominant-faction strategies that undermine the intended plurality.',
    mitigation:
      'Cap per-session trust gain to prevent runaway stacking.  Review faction reward schedules ' +
      '(Phase 77) against the planned questline pacing before advanced_questlines ships.',
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns all backlog items at the given priority tier, preserving array order. */
export function getBacklogByPriority(priority: BacklogPriority): BacklogItem[] {
  return EXPANSION_BACKLOG.filter((i) => i.priority === priority)
}

/** Returns all backlog items in the given feature bucket, preserving array order. */
export function getBacklogByBucket(bucket: BacklogBucket): BacklogItem[] {
  return EXPANSION_BACKLOG.filter((i) => i.bucket === bucket)
}

/** Returns all risk notes at or above the given severity threshold. */
export function getRisksBySeverity(minSeverity: RiskSeverity): RiskNote[] {
  const order: RiskSeverity[] = ['high', 'medium', 'low']
  const threshold = order.indexOf(minSeverity)
  return RISK_NOTES.filter((r) => order.indexOf(r.severity) <= threshold)
}

/**
 * Returns all backlog items that are immediately actionable (no unresolved blockers).
 *
 * @param shippedIds  Set of backlog item ids that have already been shipped.
 *                    Callers should populate this from whatever tracking mechanism
 *                    records completed items (e.g. a persisted backlog-status store or
 *                    a build-time constant updated each phase).  When called with the
 *                    default empty set it returns all items with no declared blockers.
 */
export function getUnblockedItems(shippedIds: ReadonlySet<string> = new Set()): BacklogItem[] {
  return EXPANSION_BACKLOG.filter((i) =>
    i.blockedBy.every((dep) => shippedIds.has(dep)),
  )
}
