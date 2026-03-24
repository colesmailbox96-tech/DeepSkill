/**
 * Phase 96 — Public Demo Slice Selection
 * Phase 97 — Demo Polish Pass (intro text constants)
 *
 * Defines the authoritative content set for the public demo vertical slice.
 * This file acts as the single source of truth for what is included in the
 * demo build vs. what is locked behind the full-game gate.
 *
 * Demo philosophy
 * ───────────────
 *  The demo should offer a complete loop: arrive in Hushwood, talk to the
 *  Elder, gather across three starter zones, craft basic gear, and deliver
 *  quest items — giving an outside tester a 15–30 minute experience that
 *  showcases the core skill-loop and questline progression without requiring
 *  knowledge of the full world.
 *
 * Content breakdown
 * ─────────────────
 *  Regions   — Hushwood, Quarry Trail, Shoreline, Ashfen Copse
 *  Skills    — Woodcutting, Mining, Fishing, Foraging, Cooking, Smithing
 *  Quests    — Elder's Introduction, Foreman's Contract, Elder's Survey
 *  Locked    — Marrowfen, Tidemark Chapel, Belowglass Vaults, Brackroot,
 *              Hollow Vault; Tinkering, Tailoring, Carving, Warding,
 *              Surveying; Warden's Legacy chain; Boss encounter
 */

// ─── Intro Messaging ─────────────────────────────────────────────────────────

/**
 * Subtitle shown in the DemoWelcomeOverlay header.
 * Describes the world and sets expectations for the demo experience.
 */
export const DEMO_SUBTITLE =
  'An original low-poly frontier fantasy RPG set across drowned roads, ashwood ridges, and lantern marshes. ' +
  'Grow from a camphand into a skilled gatherer and craftsperson in this opening act of the Veilmarch Territories.'

/**
 * Estimated playtime for the demo slice, shown alongside the "Public Demo" badge.
 */
export const DEMO_ESTIMATED_PLAYTIME = '15–30 min'

// ─── Selected Regions ────────────────────────────────────────────────────────

export interface DemoRegionEntry {
  id: string
  label: string
  description: string
}

export const DEMO_REGIONS: DemoRegionEntry[] = [
  {
    id: 'hushwood',
    label: 'Hushwood',
    description: 'The starter village and surrounding forest — first gathering and quest hub.',
  },
  {
    id: 'quarry',
    label: 'Quarry Trail',
    description: 'Rocky excavation site north of Hushwood. Mining, ore delivery, and the Foreman.',
  },
  {
    id: 'shoreline',
    label: 'Shoreline',
    description: 'Coastal stretch east of Hushwood. Fishing spots and forage nodes.',
  },
  {
    id: 'ashfen',
    label: 'Ashfen Copse',
    description: 'Sparse woodland west of the village. Secondary foraging and amber resin.',
  },
]

// ─── Selected Skills ──────────────────────────────────────────────────────────

export interface DemoSkillEntry {
  id: string
  label: string
  tier: 'gathering' | 'processing'
}

export const DEMO_SKILLS: DemoSkillEntry[] = [
  { id: 'woodcutting', label: 'Woodcutting',  tier: 'gathering'   },
  { id: 'mining',      label: 'Mining',        tier: 'gathering'   },
  { id: 'fishing',     label: 'Fishing',       tier: 'gathering'   },
  { id: 'foraging',    label: 'Foraging',      tier: 'gathering'   },
  { id: 'hearthcraft', label: 'Cooking',       tier: 'processing'  },
  { id: 'forging',     label: 'Smithing',      tier: 'processing'  },
]

// ─── Selected Questlines ──────────────────────────────────────────────────────

export interface DemoQuestlineEntry {
  id: string
  label: string
  rootTaskId: string
  summary: string
}

export const DEMO_QUESTLINES: DemoQuestlineEntry[] = [
  {
    id: 'elders_introduction',
    label: "Elder's Introduction",
    rootTaskId: 'word_from_the_elder',
    summary:
      'Speak with Aldric the Village Elder; complete his opening commissions across the starter zones.',
  },
  {
    id: 'foremans_contract',
    label: "Foreman's Contract",
    rootTaskId: 'quarry_word',
    summary:
      'Answer Gorven the Foreman at the Quarry; mine iron and duskiron ore to secure the supply cache.',
  },
  {
    id: 'elders_survey',
    label: "Elder's Survey",
    rootTaskId: 'survey_reach',
    summary:
      'Accept a broad commission from Aldric; gather samples from each starter region and file a full report.',
  },
]

// ─── Content Lock List ────────────────────────────────────────────────────────

export interface DemoLockedEntry {
  label: string
  reason: string
}

export const DEMO_CONTENT_LOCK: DemoLockedEntry[] = [
  { label: 'Marrowfen',          reason: 'Mid-game region; above demo scope.' },
  { label: 'Tidemark Chapel',    reason: 'Mist-hazard area; reserved for full release.' },
  { label: 'Belowglass Vaults',  reason: 'End-game boss dungeon; not in demo.' },
  { label: 'Brackroot',          reason: 'Advanced corridor; reserved for full release.' },
  { label: 'Hollow Vault',       reason: 'Late-game vault; reserved for full release.' },
  { label: 'Tinkering',          reason: 'Advanced craft; reserved for full release.' },
  { label: 'Tailoring',          reason: 'Advanced craft; reserved for full release.' },
  { label: 'Carving',            reason: 'Advanced craft; reserved for full release.' },
  { label: 'Warding',            reason: 'Specialist skill; reserved for full release.' },
  { label: 'Surveying',          reason: 'Specialist skill; reserved for full release.' },
  { label: "Warden's Legacy",    reason: 'Post-boss chain; requires full-game content.' },
  { label: 'Boss Encounter',     reason: 'Vault Heart Warden; not in demo.' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns true if the given skill id is part of the demo slice. */
export function isSkillInDemo(skillId: string): boolean {
  return DEMO_SKILLS.some((s) => s.id === skillId)
}

/** Returns true if the given region id is part of the demo slice. */
export function isRegionInDemo(regionId: string): boolean {
  return DEMO_REGIONS.some((r) => r.id === regionId)
}

/** Returns true if the given root task id belongs to a demo questline. */
export function isQuestlineInDemo(rootTaskId: string): boolean {
  return DEMO_QUESTLINES.some((q) => q.rootTaskId === rootTaskId)
}
