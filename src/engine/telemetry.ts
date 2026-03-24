/**
 * Phase 98 — Telemetry Hooks Decision
 *
 * Decision: YES — add lightweight, local-only event hooks.
 *
 * Rationale
 * ─────────
 *  During the public demo we need to understand how far players progress,
 *  which skills they level, and where they die.  This data guides the next
 *  iteration of content and balance work (Phase 99 Expansion Backlog).
 *
 *  Privacy stance
 *  ──────────────
 *  All events are stored entirely in memory for the lifetime of the browser
 *  session.  Nothing is transmitted to any external server.  An optional
 *  helper (`exportTelemetry`) serialises the ring-buffer to JSON so a tester
 *  can voluntarily copy-paste it into a feedback form or the browser console.
 *  No personally-identifiable information is collected.
 *
 *  Implementation notes
 *  ────────────────────
 *  • Ring-buffer capped at MAX_EVENTS (500) to prevent unbounded memory growth.
 *  • Timestamps use performance.now() (monotonic) relative to session start, so
 *    they are unaffected by system-clock adjustments and cannot be used to infer
 *    real-world wall-clock timing of a tester's session.
 *  • The module is intentionally free of React / Zustand dependencies so it
 *    can be imported anywhere without introducing framework coupling.
 */

// ─── Event catalogue ─────────────────────────────────────────────────────────

export type TelemetryEventType =
  | 'session_start'
  | 'new_game'
  | 'area_entered'
  | 'skill_level_up'
  | 'quest_complete'
  | 'player_defeated'
  | 'demo_overlay_dismissed'

export interface TelemetryEvent {
  /** Monotonic milliseconds from session start (via performance.now()). */
  t: number
  /** Event category. */
  type: TelemetryEventType
  /** Optional key/value payload specific to each event type. */
  data?: Record<string, string | number | boolean>
}

// ─── Ring-buffer store ────────────────────────────────────────────────────────

const MAX_EVENTS = 500

/** Monotonic origin timestamp using performance.now() (set at module load). */
const SESSION_START = performance.now()

const _events: TelemetryEvent[] = []

// ─── Core recording function ──────────────────────────────────────────────────

/**
 * Record a telemetry event.  Safe to call at any time; if the buffer is full,
 * the oldest entry is evicted to make room for the new event.
 */
export function recordEvent(
  type: TelemetryEventType,
  data?: Record<string, string | number | boolean>,
): void {
  if (_events.length >= MAX_EVENTS) {
    _events.shift()
  }
  _events.push({ t: performance.now() - SESSION_START, type, data })
}

// ─── Typed convenience wrappers ───────────────────────────────────────────────

/** Called once at module load / page initialisation. */
export function recordSessionStart(): void {
  recordEvent('session_start')
}

/** Called when the player starts a new game (clears save and enters world). */
export function recordNewGame(): void {
  recordEvent('new_game')
}

/**
 * Called when the player moves into a new audio/gameplay region.
 * @param regionId  Canonical region id (e.g. 'hushwood', 'quarry', …).
 */
export function recordAreaEntered(regionId: string): void {
  recordEvent('area_entered', { region: regionId })
}

/**
 * Called on every skill level-up.
 * @param skillId   Canonical skill id (e.g. 'woodcutting').
 * @param newLevel  The level the skill just reached.
 */
export function recordSkillLevelUp(skillId: string, newLevel: number): void {
  recordEvent('skill_level_up', { skill: skillId, level: newLevel })
}

/**
 * Called when a task/quest is moved to the completed list.
 * @param taskId  Canonical task id (e.g. 'word_from_the_elder').
 */
export function recordQuestComplete(taskId: string): void {
  recordEvent('quest_complete', { task: taskId })
}

/** Called when the player's HP reaches 0 and the respawn overlay is shown. */
export function recordPlayerDefeated(): void {
  recordEvent('player_defeated')
}

/** Called when the player dismisses the demo welcome overlay. */
export function recordDemoOverlayDismissed(): void {
  recordEvent('demo_overlay_dismissed')
}

// ─── Debug export ─────────────────────────────────────────────────────────────

/**
 * Returns a JSON string containing all buffered telemetry events for this
 * session.  Intended for voluntary tester copy-paste into a feedback channel.
 *
 * Example (browser console):
 *   console.log(exportTelemetry())
 */
export function exportTelemetry(): string {
  return JSON.stringify({ session_ms: performance.now() - SESSION_START, events: _events }, null, 2)
}

/**
 * Returns a frozen shallow copy of the current event buffer.
 * Useful for in-game debug panels or unit tests.
 */
export function getTelemetryEvents(): readonly TelemetryEvent[] {
  return Object.freeze(_events.slice())
}

// ─── Initialise ───────────────────────────────────────────────────────────────

// Automatically record the session start event when this module is first loaded.
recordSessionStart()
