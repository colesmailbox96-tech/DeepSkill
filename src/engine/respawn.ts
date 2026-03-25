/**
 * Phase 34 — Respawn / Safe Recovery Loop
 *
 * Constants and helpers for the player defeat + safe recovery system.
 *
 * Design:
 *   - On defeat the player retains all items and currency (no punishing loss).
 *   - The player is teleported to the town square (commons area with central
 *     well at the heart of Cinderglen Settlement).
 *   - Full health is restored.
 *   - A blocking overlay informs the player what happened and where they wake.
 *   - The overlay must be dismissed before play resumes (anti-softlock).
 */

// ── Constants ─────────────────────────────────────────────────────────────────

/** World-space X coordinate of the settlement respawn point (town square). */
export const RESPAWN_X = 0

/** World-space Z coordinate of the settlement respawn point (town square
 *  commons area — matches the stone-paved disc / central well in Hushwood). */
export const RESPAWN_Z = 3

/** Y position used when teleporting the player mesh (matches createPlayer). */
export const RESPAWN_Y = 0

/** Human-readable name of the respawn location shown in the overlay. */
export const RESPAWN_LOCATION_LABEL = 'Cinderglen Settlement — Hearth Rest'
