/**
 * Phase 14 — XP Curve Base
 *
 * Defines the level-threshold formula and utility helpers used by every
 * skill-granting system in Veilmarch.
 *
 * Curve formula:  xpToNextLevel(level) = level * (level + 1) * 50
 *
 *   Level  1 →  2 :    100 xp
 *   Level  2 →  3 :    300 xp
 *   Level  5 →  6 :  1 500 xp
 *   Level 10 → 11 :  5 500 xp
 *   Level 50 → 51 : 127 550 xp
 *
 * Maximum skill level is 99.
 */

export const MAX_SKILL_LEVEL = 99

/**
 * XP required to advance from `level` to `level + 1`.
 * Returns 0 when `level` is already at MAX_SKILL_LEVEL.
 */
export function xpToNextLevel(level: number): number {
  if (level >= MAX_SKILL_LEVEL) return 0
  return level * (level + 1) * 50
}

/**
 * Apply `amount` XP to a skill snapshot and return the updated snapshot.
 * May level up multiple times if the XP amount is large enough.
 *
 * @param level   current level
 * @param xp      current experience (progress toward next level)
 * @param amount  XP to add — clamped to ≥ 0
 * @returns `{ level, experience, experienceToNextLevel, levelsGained }`
 */
export function applyXp(
  level: number,
  xp: number,
  amount: number,
): {
  level: number
  experience: number
  experienceToNextLevel: number
  levelsGained: number
} {
  // Treat any non-finite input as a safe default to prevent NaN propagation.
  const safeLevel = Number.isFinite(level) ? Math.max(1, Math.floor(level)) : 1
  const safeXp = Number.isFinite(xp) ? Math.max(0, Math.floor(xp)) : 0
  const safeAmount = Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0

  // Max-level skills have no progress; discard any incoming XP.
  if (safeLevel >= MAX_SKILL_LEVEL) {
    return {
      level: safeLevel,
      experience: 0,
      experienceToNextLevel: 0,
      levelsGained: 0,
    }
  }

  if (safeAmount === 0) {
    return {
      level: safeLevel,
      experience: safeXp,
      experienceToNextLevel: xpToNextLevel(safeLevel),
      levelsGained: 0,
    }
  }

  let cur = safeLevel
  let curXp = safeXp + safeAmount
  let levelsGained = 0

  while (cur < MAX_SKILL_LEVEL) {
    const threshold = xpToNextLevel(cur)
    if (curXp >= threshold) {
      curXp -= threshold
      cur++
      levelsGained++
    } else {
      break
    }
  }

  // Discard overflow XP once max level is reached.
  if (cur >= MAX_SKILL_LEVEL) {
    curXp = 0
  }

  return {
    level: cur,
    experience: curXp,
    experienceToNextLevel: xpToNextLevel(cur),
    levelsGained,
  }
}
