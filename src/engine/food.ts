/**
 * Phase 33 — Food Consumption in Combat
 *
 * Pure constants and helpers for food-use cooldown management.
 * Stateful tracking lives in src/store/useFoodStore.ts.
 */

/**
 * Seconds a player must wait between eating while actively in combat.
 * Out-of-combat eats are unrestricted (cooldown is not applied).
 */
export const FOOD_COMBAT_COOLDOWN = 3
