/**
 * Phase 101 — Comprehensive Pass: High-Impact Feature Identification
 *
 * Goal: Surface the full set of high-impact functionalities that warrant
 * priority scheduling in the next development sprint.  This module combines
 * signals from three sources:
 *
 *  1. EXPANSION_BACKLOG (Phase 99) — existing P0/P1 items promoted here for
 *     visibility with additional scheduling context.
 *  2. RC_KNOWN_ISSUES (Phase 100) — deferred issues whose deferral has a
 *     measurable player-facing impact.
 *  3. Gap analysis — capabilities that are partially implemented or
 *     acknowledged in the blueprint but not yet assigned a backlog item.
 *
 * Output shape
 * ────────────
 *  PassFeature — the primary unit: a feature with an impact tier, effort
 *    estimate, owning system, sprint grouping, and dependency list.
 *  SprintGroup — a named cluster of PassFeatures that can be shipped together
 *    as a coherent release slice.
 *  ImpactMatrix — paired score table used by sprint planners to rank features
 *    by value/effort ratio without resorting to guesswork.
 *
 * Scope contract
 * ──────────────
 * This file is intentionally read-only data — no side-effects, no store
 * imports.  It exists to be consumed by planning overlays, the main menu's
 * "Roadmap" section, and automated sprint-planning tooling.
 */

// ─── 1. Shared vocabulary ─────────────────────────────────────────────────────

/**
 * Categorical impact tier for a single feature.
 *
 *  'critical'  — Directly breaks or severely degrades the player experience.
 *                Must ship before any further distribution.
 *  'high'      — Unlocks a meaningful content or progression gate.
 *                Schedule in the current sprint.
 *  'medium'    — Meaningful quality-of-life or content expansion.
 *                Schedule once high items clear.
 *  'low'       — Polish, nice-to-have, or cosmetic improvement.
 *                Park until bandwidth allows.
 */
export type ImpactTier = 'critical' | 'high' | 'medium' | 'low'

/**
 * Rough effort estimate expressed as an idealized developer-day range.
 *
 *  'xs'  — ≤ 0.5 day   (configuration change, small data edit)
 *  's'   — 1–2 days    (targeted bug-fix or minor feature addition)
 *  'm'   — 3–5 days    (self-contained feature with UI)
 *  'l'   — 1–2 weeks   (system-level feature touching multiple files)
 *  'xl'  — > 2 weeks   (architectural change or large content block)
 */
export type EffortEstimate = 'xs' | 's' | 'm' | 'l' | 'xl'

/**
 * Game system or layer that owns the feature.
 * Used for routing work to the correct specialist and for filtering the
 * impact matrix by area of concern.
 */
export type OwningSystem =
  | 'balance'
  | 'save_load'
  | 'combat'
  | 'world'
  | 'skills'
  | 'quests'
  | 'ui_ux'
  | 'performance'
  | 'audio'
  | 'narrative'
  | 'accessibility'

/**
 * Sprint grouping label.  Features in the same group are intended to ship
 * together as a coherent release slice.  The numeric suffix provides a
 * rough ordering hint (lower = earlier).
 */
export type SprintGroup =
  | 'sprint_1_stabilization'
  | 'sprint_2_mid_content'
  | 'sprint_3_late_content'
  | 'sprint_4_polish'

// ─── 2. PassFeature — primary unit ───────────────────────────────────────────

/**
 * A single identifiable feature or fix to be included in the comprehensive
 * pass.  Each entry is a self-contained unit of work with enough context for
 * a developer to estimate scope and sequence without additional documents.
 */
export interface PassFeature {
  /** Stable snake_case identifier.  Must be unique within COMPREHENSIVE_PASS. */
  id: string

  /** Short human-readable title (≤ 72 characters). */
  title: string

  /**
   * One or two sentences describing what the feature does and why it matters
   * to the player experience.
   */
  description: string

  /** Categorical impact tier (see ImpactTier). */
  impact: ImpactTier

  /** Rough effort estimate (see EffortEstimate). */
  effort: EffortEstimate

  /** Game system that owns this feature. */
  system: OwningSystem

  /** Sprint group this feature belongs to (see SprintGroup). */
  sprint: SprintGroup

  /**
   * Ids of other PassFeature entries that must be completed before this
   * feature can be started.  Empty array means no blocking dependency.
   */
  blockedBy: string[]

  /**
   * Optional cross-reference to an existing EXPANSION_BACKLOG id or
   * RC_KNOWN_ISSUE id.  Undefined when the feature is net-new to this pass.
   */
  backlogRef?: string

  /**
   * Optional success criterion — a single measurable outcome that confirms
   * the feature shipped correctly.  Expressed as a plain-English assertion.
   */
  acceptanceCriterion?: string
}

// ─── 3. COMPREHENSIVE_PASS — feature catalogue ────────────────────────────────

export const COMPREHENSIVE_PASS: readonly PassFeature[] = [

  // ── Sprint 1 — Stabilization (critical + high blockers) ───────────────────

  {
    id: 'xp_curve_rebalance',
    title: 'XP Curve Rebalance — align gathering/combat XP to telemetry cadence',
    description:
      'Telemetry signals (skill_level_up cadence per session) show whether the first-skill ' +
      'milestone lands within the intended 15-minute window.  Adjust multipliers in each ' +
      'skill\'s XP table so that level 5 is achievable in a casual session without grinding.',
    impact: 'critical',
    effort: 's',
    system: 'balance',
    sprint: 'sprint_1_stabilization',
    blockedBy: [],
    backlogRef: 'demo_feedback_balance',
    acceptanceCriterion:
      'A player with zero prior knowledge reaches level 5 Woodcutting within 20 minutes ' +
      'of starting a new game without reading any external guide.',
  },

  {
    id: 'death_penalty_curve',
    title: 'Death Penalty Curve — reduce early-game mark loss on first defeat',
    description:
      'player_defeated telemetry clusters early deaths in the Quarry approach.  The flat ' +
      '10 % mark penalty discourages new players before they reach their first skill milestone.  ' +
      'Scale the penalty from 2 % at player level ≤ 5 up to 10 % at level 20+.',
    impact: 'critical',
    effort: 's',
    system: 'combat',
    sprint: 'sprint_1_stabilization',
    blockedBy: [],
    backlogRef: 'respawn_feel',
    acceptanceCriterion:
      'A level-3 player who dies loses no more than 2 % of their current marks.',
  },

  {
    id: 'gated_door_save_state',
    title: 'Gated Door Save State — persist opened doors across save/load cycles',
    description:
      'Currently a door that has been opened re-renders its mesh on save reload.  Add an ' +
      '`openedGates` set to the save schema (SAVE_VERSION 3 migration) so doors remain ' +
      'visually absent for players who already unlocked them.',
    impact: 'critical',
    effort: 'm',
    system: 'save_load',
    sprint: 'sprint_1_stabilization',
    blockedBy: ['save_version_3_migration'],
    backlogRef: 'save_integrity_hotfixes',
    acceptanceCriterion:
      'A gated door that was opened before a manual save is absent (not re-rendered) ' +
      'immediately after reloading the page.',
  },

  {
    id: 'save_version_3_migration',
    title: 'Save Schema v3 Migration — add openedGates and unlockedRegions fields',
    description:
      'Extend MIGRATION_TABLE in the save system to step saves from v2 to v3.  The migration ' +
      'adds an empty `openedGates` set and an `unlockedRegions` set seeded from the player\'s ' +
      'current demo unlock state.  Required before gated_door_save_state ships.',
    impact: 'critical',
    effort: 's',
    system: 'save_load',
    sprint: 'sprint_1_stabilization',
    blockedBy: [],
    backlogRef: 'save_integrity_hotfixes',
    acceptanceCriterion:
      'A v2 save loaded in a build running v3 migration passes without throwing and ' +
      'correctly populates openedGates as an empty set.',
  },

  {
    id: 'respawn_grace_window',
    title: 'Respawn Grace Window — 5-second invincibility after respawn',
    description:
      'Players who respawn adjacent to the creature that killed them are immediately killed ' +
      'again before they can react.  Add a 5-second post-respawn grace period during which ' +
      'creatures cannot deal damage to the player.',
    impact: 'high',
    effort: 's',
    system: 'combat',
    sprint: 'sprint_1_stabilization',
    blockedBy: ['death_penalty_curve'],
    backlogRef: 'respawn_feel',
    acceptanceCriterion:
      'Player health does not decrease for 5 seconds after the respawn animation completes, ' +
      'even when standing inside a hostile creature\'s attack range.',
  },

  {
    id: 'creature_draw_call_budget',
    title: 'Creature InstancedMesh — reduce draw calls for same-type creatures',
    description:
      'At 10+ simultaneous creature spawns the Three.js draw-call count approaches mobile GPU ' +
      'limits.  Migrate same-type creature meshes to InstancedMesh so that ten Cinderhares ' +
      'produce one draw call instead of ten.',
    impact: 'high',
    effort: 'l',
    system: 'performance',
    sprint: 'sprint_1_stabilization',
    blockedBy: [],
    backlogRef: 'three_draw_call_budget',
    acceptanceCriterion:
      'Chrome DevTools Performance tab shows < 150 draw calls per frame when all four demo ' +
      'regions are loaded simultaneously with maximum creature density.',
  },

  // ── Sprint 2 — Mid Content (high + medium unlocks) ────────────────────────

  {
    id: 'unlock_marrowfen_region',
    title: 'Unlock Marrowfen Region — open the mid-game marsh to post-demo players',
    description:
      'Marrowfen is fully authored (Phase 74) and locked behind the demo gate.  Remove the ' +
      'demo gate flag for Marrowfen, verify hazard zones and creature spawns are active, and ' +
      'add the region to the LOD streaming set.',
    impact: 'high',
    effort: 's',
    system: 'world',
    sprint: 'sprint_2_mid_content',
    blockedBy: ['gated_door_save_state', 'save_version_3_migration'],
    backlogRef: 'unlock_marrowfen',
    acceptanceCriterion:
      'A player at level 10 Foraging can enter Marrowfen, collect Marrowfen Spore nodes, ' +
      'and trigger gas-vent hazard warnings without errors.',
  },

  {
    id: 'unlock_brackroot_region',
    title: 'Unlock Brackroot Trail Region — open the advanced corridor zone',
    description:
      'Brackroot Trail (Phase 35) is authored and gated.  Unlocking it provides the geographic ' +
      'link between Hushwood and the late-game Hollow Vault, and activates its ambient ' +
      'landmark interactables.',
    impact: 'high',
    effort: 'xs',
    system: 'world',
    sprint: 'sprint_2_mid_content',
    blockedBy: ['unlock_marrowfen_region'],
    backlogRef: 'unlock_brackroot',
    acceptanceCriterion:
      'Brackroot Trail is traversable, ambient interactables respond correctly, and the ' +
      'region label appears on the minimap when the player enters.',
  },

  {
    id: 'tinkering_skill_unlock',
    title: 'Tinkering Skill Unlock — enable advanced device assembly post-demo',
    description:
      'Tinkering (Phase 43) is implemented but demo-gated.  Removing the gate exposes the ' +
      'bench, device recipes, and tinker-level gating to post-demo players, providing a ' +
      'dedicated crafting progression route alongside Smithing.',
    impact: 'high',
    effort: 'xs',
    system: 'skills',
    sprint: 'sprint_2_mid_content',
    blockedBy: [],
    backlogRef: 'unlock_tinkering',
    acceptanceCriterion:
      'The Tinkering bench is interactable, its recipe list renders, and crafting a Tier-1 ' +
      'device awards Tinkering XP.',
  },

  {
    id: 'tailoring_skill_unlock',
    title: 'Tailoring Skill Unlock — cloth and leather armour routes',
    description:
      'Tailoring (Phase 63) is implemented and demo-gated.  Unlocking it gives players an ' +
      'armour crafting path independent of Smithing, diversifying gear acquisition and ' +
      'providing a use for foraged plant fibres.',
    impact: 'high',
    effort: 'xs',
    system: 'skills',
    sprint: 'sprint_2_mid_content',
    blockedBy: [],
    backlogRef: 'unlock_tailoring',
    acceptanceCriterion:
      'Loom station is interactable, Tier-1 cloth recipe is available with correct material ' +
      'requirements, and the crafted item equips in the appropriate gear slot.',
  },

  {
    id: 'carving_skill_unlock',
    title: 'Carving Skill Unlock — bone, wood, and resin craft routes',
    description:
      'Carving (Phase 42) is implemented and demo-gated.  Unlocking it adds the first ' +
      'trophy-item category, encouraging players to engage with the combat and foraging loops ' +
      'for materials beyond raw ore and wood.',
    impact: 'high',
    effort: 'xs',
    system: 'skills',
    sprint: 'sprint_2_mid_content',
    blockedBy: [],
    backlogRef: 'unlock_carving',
    acceptanceCriterion:
      'Carving bench is interactable, bone carving recipe produces a trophy item, and the ' +
      'item appears in the inventory with correct flavour text.',
  },

  {
    id: 'mid_game_creatures',
    title: 'Mid-Game Creature Pack — Chapel Wisp, Hushfang, Ember Ram, Silt Widow',
    description:
      'Adding four new creature types raises the mid-game combat variety beyond the three ' +
      'starter variants.  Each type has a distinct attack pattern: Wisp (ranged), Hushfang ' +
      '(fast melee), Ember Ram (charge), Silt Widow (area-denial web).',
    impact: 'high',
    effort: 'l',
    system: 'combat',
    sprint: 'sprint_2_mid_content',
    blockedBy: ['creature_draw_call_budget'],
    backlogRef: 'mid_game_creature_pack',
    acceptanceCriterion:
      'All four creature types spawn in their designated regions, deal their correct damage ' +
      'types, and drop appropriate loot without console errors.',
  },

  {
    id: 'lod_hysteresis_retune',
    title: 'LOD Hysteresis Re-tune — increase band to 30 units for multi-region traversal',
    description:
      'Phase 88 set a 20-unit show/hide gap appropriate for four demo regions.  With Marrowfen ' +
      'and Brackroot simultaneously loadable the gap causes visible prop pop-in in corridor ' +
      'zones.  Increase the hysteresis band to 30 units and validate on a mid-spec mobile device.',
    impact: 'medium',
    effort: 'xs',
    system: 'performance',
    sprint: 'sprint_2_mid_content',
    blockedBy: ['unlock_marrowfen_region', 'unlock_brackroot_region'],
    backlogRef: 'lod_hysteresis_tuning',
    acceptanceCriterion:
      'No visible region-chunk pop-in occurs when the player walks from Hushwood through ' +
      'Brackroot Trail at full walking speed on a 2021-era mid-spec Android device.',
  },

  {
    id: 'notification_persistence',
    title: 'Notification Persistence — toast queue survives panel transitions',
    description:
      'Notifications (NotificationFeed) are lost when the player opens a full-screen panel ' +
      '(e.g. Inventory) that momentarily re-mounts the HUD.  Buffer up to 10 pending toasts ' +
      'in the notification store so they reappear when the panel closes.',
    impact: 'medium',
    effort: 's',
    system: 'ui_ux',
    sprint: 'sprint_2_mid_content',
    blockedBy: [],
    acceptanceCriterion:
      'A crafting completion notification issued while the Inventory panel is open appears ' +
      'as a toast within 1 second of the panel closing.',
  },

  {
    id: 'audio_buffer_cap',
    title: 'Audio Buffer Cap — prevent unbounded AudioBuffer allocation on Safari/iOS',
    description:
      'Phase 93 added region stingers without capping total AudioBuffer memory.  On Safari/iOS ' +
      'the AudioContext node limit can be hit during dense combat.  Add a MAX_AUDIO_BUFFERS ' +
      'constant and an LRU eviction policy for least-recently-played stingers.',
    impact: 'medium',
    effort: 's',
    system: 'audio',
    sprint: 'sprint_2_mid_content',
    blockedBy: [],
    backlogRef: 'audio_safari_limit',
    acceptanceCriterion:
      'A 30-minute session on an iPhone 12 in Safari produces no AudioContext errors and ' +
      'background music does not drop out during combat.',
  },

  // ── Sprint 3 — Late Content (medium unlocks, narrative, advanced systems) ──

  {
    id: 'warding_skill_unlock',
    title: 'Warding Skill Unlock — magical wards and Chapel questline access',
    description:
      'Warding (Phase 46) is implemented and demo-gated.  Unlocking it enables the creature ' +
      'ward checks, ward recipes, and unblocks the Tidemark Chapel story arc gated on Warding ' +
      'level 5.',
    impact: 'medium',
    effort: 'xs',
    system: 'skills',
    sprint: 'sprint_3_late_content',
    blockedBy: ['unlock_marrowfen_region'],
    backlogRef: 'unlock_warding',
    acceptanceCriterion:
      'Warding basin is interactable at the Chapel ruins, a Ward-Spiral recipe crafts ' +
      'correctly, and a creature with a ward check is repelled when the ward is active.',
  },

  {
    id: 'surveying_skill_unlock',
    title: 'Surveying Skill Unlock — hidden cache discovery across all regions',
    description:
      'Surveying (Phase 44/45) is implemented and demo-gated.  Unlocking it gives players ' +
      'a reason to revisit all nine regions and rewards thorough exploration with hidden cache ' +
      'loot that includes late-game material tier items.',
    impact: 'medium',
    effort: 'xs',
    system: 'skills',
    sprint: 'sprint_3_late_content',
    blockedBy: ['unlock_marrowfen_region', 'unlock_brackroot_region'],
    backlogRef: 'unlock_surveying',
    acceptanceCriterion:
      'Survey chalk can be placed in all unlocked regions, at least one hidden cache is ' +
      'discoverable per region, and the cache loot table matches the late-game material tier.',
  },

  {
    id: 'unlock_tidemark_chapel',
    title: 'Unlock Tidemark Chapel Region — mist-hazard zone and story arc',
    description:
      'Tidemark Chapel (Phase 47) is authored and demo-gated.  Unlocking it activates the ' +
      'mist-hazard environmental damage, coastal ruin interactables, and the Warding-level-gated ' +
      'inner sanctum.  Requires Warding skill unlock first.',
    impact: 'medium',
    effort: 's',
    system: 'world',
    sprint: 'sprint_3_late_content',
    blockedBy: ['warding_skill_unlock'],
    backlogRef: 'unlock_tidemark_chapel',
    acceptanceCriterion:
      'Chapel mist-hazard HUD warning appears on entry, inner sanctum gate is blocked ' +
      'below Warding 5, and lore interactables are all readable without errors.',
  },

  {
    id: 'unlock_hollow_vault',
    title: 'Unlock Hollow Vault Region — late-game salvage and vault exploration',
    description:
      'Hollow Vault (Phase 65) is authored and demo-gated.  Unlocking it activates the item- ' +
      'gated inner door and the Deep Heart chamber.  It is the geographic prerequisite for the ' +
      'Belowglass Vaults end-game boss dungeon.',
    impact: 'medium',
    effort: 's',
    system: 'world',
    sprint: 'sprint_3_late_content',
    blockedBy: ['unlock_tidemark_chapel'],
    backlogRef: 'unlock_hollow_vault',
    acceptanceCriterion:
      'Inner door gate correctly blocks entry without the required key item, and the Deep ' +
      'Heart chamber is accessible and populated with salvage nodes after the gate is cleared.',
  },

  {
    id: 'faction_questlines',
    title: 'Advanced Questlines — Tidebound and Quarry Union faction chains',
    description:
      'Phase 87 shipped the Warden questline.  Adding two faction-specific chains (Tidebound: ' +
      '3 tasks; Quarry Union: 3 tasks) gives faction rep a clear narrative payoff beyond stat ' +
      'bonuses and surfaces underused dialogue from Brin Salt and Olen.',
    impact: 'medium',
    effort: 'l',
    system: 'quests',
    sprint: 'sprint_3_late_content',
    blockedBy: ['unlock_tidemark_chapel', 'unlock_marrowfen_region'],
    backlogRef: 'advanced_questlines',
    acceptanceCriterion:
      'Each questline has a visible start trigger (NPC dialogue option), at least three ' +
      'objectives, and a faction-rep reward that updates the Faction panel without errors.',
  },

  {
    id: 'late_game_materials',
    title: 'Late-Game Material Tier — Vaultglass Shard, Heartwire Coil, Pressure-Sintered Plate',
    description:
      'Three new material types create a crafting destination for players who have cleared ' +
      'Hollow Vault and Belowglass Vaults.  Each material gates the highest tier of Smithing, ' +
      'Tinkering, and Tailoring recipes.',
    impact: 'medium',
    effort: 'm',
    system: 'skills',
    sprint: 'sprint_3_late_content',
    blockedBy: ['unlock_hollow_vault', 'tinkering_skill_unlock', 'tailoring_skill_unlock'],
    backlogRef: 'late_game_materials',
    acceptanceCriterion:
      'Each material is obtainable via the correct acquisition path (salvage node, vault ' +
      'chest, synthesis recipe), and each gates at least one high-tier craftable item.',
  },

  {
    id: 'faction_trust_cap',
    title: 'Faction Trust Per-Session Cap — prevent runaway stacking',
    description:
      'Phase 76 implemented trust gain but did not cap per-session accumulation.  A player ' +
      'grinding faction tasks can hit max trust in a single session before questlines are ' +
      'authored to pace the reward.  Cap trust gain at 200 per session per faction.',
    impact: 'medium',
    effort: 'xs',
    system: 'quests',
    sprint: 'sprint_3_late_content',
    blockedBy: [],
    backlogRef: 'faction_trust_balance',
    acceptanceCriterion:
      'After earning 200 trust with any faction in a single browser session, further ' +
      'trust-granting actions for that faction silently award 0 trust (no error, no notification).',
  },

  // ── Sprint 4 — Polish (low-impact, experience improvements) ───────────────

  {
    id: 'unlock_belowglass_vaults',
    title: 'Unlock Belowglass Vaults — end-game boss dungeon and Warden encounter',
    description:
      'Belowglass Vaults (Phase 78) and the Boss framework (Phase 83) are authored.  ' +
      'Unlocking the region and wiring the Vault Heart Warden encounter gives the game ' +
      'a definitive climax for fully progressed players.',
    impact: 'low',
    effort: 'm',
    system: 'world',
    sprint: 'sprint_4_polish',
    blockedBy: ['unlock_hollow_vault', 'late_game_materials'],
    backlogRef: 'unlock_belowglass_vaults',
    acceptanceCriterion:
      'Vault Heart Warden spawns at correct health, phases at thresholds defined in ' +
      'BossPhaseThreshold, and rewards the Warden\'s Legacy questline on defeat.',
  },

  {
    id: 'wardens_legacy_continuation',
    title: "Warden's Legacy Continuation — post-boss narrative for Nairn and Aldric",
    description:
      "Phase 87 shipped the three-step Warden chain but it ends at wardens_legacy with no " +
      "epilogue dialogue.  Add two follow-up dialogue nodes to Nairn and Aldric that " +
      "acknowledge the Warden's defeat and hint at the world state beyond the Vaults.",
    impact: 'low',
    effort: 's',
    system: 'narrative',
    sprint: 'sprint_4_polish',
    blockedBy: ['unlock_belowglass_vaults'],
    backlogRef: 'wardens_legacy_chain',
    acceptanceCriterion:
      "Nairn and Aldric each have a new dialogue branch visible only after wardens_legacy " +
      "is in the completed task list, and neither branch references any placeholder text.",
  },

  {
    id: 'vault_skulk_expansion',
    title: 'Vault Skulk Expansion — additional Vault-tier hostile variants',
    description:
      'Two new Vault Skulk variants (Corrosive Skulk, Armoured Skulk) diversify the end-game ' +
      'combat encounters in Belowglass Vaults and give players a reason to optimise their ' +
      'gear before the boss encounter.',
    impact: 'low',
    effort: 'm',
    system: 'combat',
    sprint: 'sprint_4_polish',
    blockedBy: ['unlock_belowglass_vaults', 'mid_game_creatures'],
    backlogRef: 'vault_skulk_expansion',
    acceptanceCriterion:
      'Both variants spawn in Belowglass Vaults, each uses a distinct attack animation, ' +
      'and defeating either awards appropriate Vault-tier loot.',
  },

  {
    id: 'performance_pass_ii',
    title: 'Performance Pass II — geometry budget and shader complexity review',
    description:
      'With all nine regions and full creature density active, conduct a second performance ' +
      'profile to identify remaining bottlenecks.  Focus on shader complexity in weather + ' +
      'day/night overlap states and texture atlas opportunities.',
    impact: 'low',
    effort: 'l',
    system: 'performance',
    sprint: 'sprint_4_polish',
    blockedBy: ['creature_draw_call_budget', 'unlock_belowglass_vaults'],
    backlogRef: 'performance_pass_ii',
    acceptanceCriterion:
      'All nine regions loaded simultaneously with storm weather and night lighting ' +
      'maintain ≥ 30 fps on a 2020-era mid-spec Android device.',
  },

  {
    id: 'font_scale_task_panel',
    title: 'Font Scale — apply fontScale preference to Task Tracker and Journal panels',
    description:
      'Phase 89 applied fontScale to the HUD but missed the Task Tracker and Journal panels. ' +
      'Extending the preference ensures accessibility completeness for the two most text-heavy ' +
      'surfaces in the game.',
    impact: 'low',
    effort: 'xs',
    system: 'accessibility',
    sprint: 'sprint_4_polish',
    blockedBy: [],
    acceptanceCriterion:
      'Setting fontScale to 1.5 in Accessibility settings increases text size in the ' +
      'Task Tracker and Journal panels by exactly 50 % relative to the default.',
  },

  {
    id: 'minimap_region_icons',
    title: 'Minimap Region Icons — distinct icon per region type on the overhead map',
    description:
      'The current minimap (Phase 54) shows only a player dot and region label.  Adding a ' +
      'small icon per region type (forest, marsh, quarry, vault, coast) gives players a ' +
      'faster spatial reference when navigating between regions.',
    impact: 'low',
    effort: 's',
    system: 'ui_ux',
    sprint: 'sprint_4_polish',
    blockedBy: [],
    acceptanceCriterion:
      'Each of the nine regions displays a distinct icon on the minimap that is readable ' +
      'at both the default and 1.5× font scale setting.',
  },
] as const

// ─── 4. ImpactMatrix — scored ranking table ───────────────────────────────────

/**
 * Value/effort ratio score for a PassFeature.
 *
 * score = IMPACT_WEIGHT[impact] / EFFORT_WEIGHT[effort]
 *
 * Higher score = higher priority.  Used by sprint planners to rank features
 * within the same sprint group when time is constrained.
 */
export interface ImpactMatrixEntry {
  id: string
  title: string
  impact: ImpactTier
  effort: EffortEstimate
  sprint: SprintGroup
  /** Computed value/effort ratio (higher = do first). */
  score: number
}

const IMPACT_WEIGHT: Record<ImpactTier, number> = {
  critical: 100,
  high: 60,
  medium: 30,
  low: 10,
}

const EFFORT_WEIGHT: Record<EffortEstimate, number> = {
  xs: 1,
  s: 2,
  m: 4,
  l: 8,
  xl: 16,
}

/**
 * Pre-computed impact matrix sorted by descending score (best ROI first).
 * Recalculated at module load from COMPREHENSIVE_PASS constants.
 */
export const IMPACT_MATRIX: readonly ImpactMatrixEntry[] = [...COMPREHENSIVE_PASS]
  .map((f) => ({
    id: f.id,
    title: f.title,
    impact: f.impact,
    effort: f.effort,
    sprint: f.sprint,
    score: IMPACT_WEIGHT[f.impact] / EFFORT_WEIGHT[f.effort],
  }))
  .sort((a, b) => b.score - a.score)

// ─── 5. SprintGroup manifest ──────────────────────────────────────────────────

/**
 * Metadata for a sprint group used in planning overlays.
 */
export interface SprintGroupEntry {
  id: SprintGroup
  label: string
  goal: string
  /** Ids of PassFeatures assigned to this sprint group. */
  featureIds: string[]
}

/**
 * Manifest of all sprint groups with their assigned features.
 * Automatically derived from COMPREHENSIVE_PASS so it never drifts.
 */
export const SPRINT_GROUPS: readonly SprintGroupEntry[] = (
  [
    {
      id: 'sprint_1_stabilization' as const,
      label: 'Sprint 1 — Stabilization',
      goal:
        'Fix critical save, death penalty, and performance issues before wider distribution.  ' +
        'No new content ships until these items clear.',
    },
    {
      id: 'sprint_2_mid_content' as const,
      label: 'Sprint 2 — Mid Content',
      goal:
        'Unlock the first wave of demo-gated content (Marrowfen, Brackroot, three skills) and ' +
        'harden the mid-game systems that will receive traffic immediately after gating opens.',
    },
    {
      id: 'sprint_3_late_content' as const,
      label: 'Sprint 3 — Late Content',
      goal:
        'Open the remaining demo-gated regions, advanced skills, and faction questlines to ' +
        'create a complete end-to-end progression arc for fully committed players.',
    },
    {
      id: 'sprint_4_polish' as const,
      label: 'Sprint 4 — Polish',
      goal:
        'Ship the end-game boss encounter, climactic narrative resolution, and cross-cutting ' +
        'accessibility and UX improvements that benefit all player segments.',
    },
  ] satisfies Omit<SprintGroupEntry, 'featureIds'>[]
).map((g) => ({
  ...g,
  featureIds: COMPREHENSIVE_PASS.filter((f) => f.sprint === g.id).map((f) => f.id),
}))

// ─── 6. Helpers ───────────────────────────────────────────────────────────────

/** Returns all PassFeatures at or above the given impact tier. */
export function getFeaturesByImpact(minImpact: ImpactTier): PassFeature[] {
  const order: ImpactTier[] = ['critical', 'high', 'medium', 'low']
  const threshold = order.indexOf(minImpact)
  return COMPREHENSIVE_PASS.filter((f) => order.indexOf(f.impact) <= threshold)
}

/** Returns all PassFeatures assigned to the given sprint group. */
export function getFeaturesBySprint(sprint: SprintGroup): PassFeature[] {
  return COMPREHENSIVE_PASS.filter((f) => f.sprint === sprint)
}

/** Returns all PassFeatures owned by the given system. */
export function getFeaturesBySystem(system: OwningSystem): PassFeature[] {
  return COMPREHENSIVE_PASS.filter((f) => f.system === system)
}

/**
 * Returns PassFeatures that are immediately actionable.
 *
 * A feature is actionable when every id in its `blockedBy` array is present
 * in `completedIds`.  Pass an empty set to find all features with no declared
 * blockers.
 */
export function getActionableFeatures(
  completedIds: ReadonlySet<string> = new Set(),
): PassFeature[] {
  return COMPREHENSIVE_PASS.filter((f) =>
    f.blockedBy.every((dep) => completedIds.has(dep)),
  )
}
