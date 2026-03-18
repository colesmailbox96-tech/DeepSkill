import { create } from 'zustand'
import { getItem } from '../data/items/itemRegistry'
import type { ItemDefinition } from '../data/items/itemSchema'
import type { Skill } from '../data/skills/skillSchema'
import { STARTER_SKILLS } from '../data/skills/starterSkills'
import { applyXp } from '../data/skills/xpCurve'
import { useNotifications } from './useNotifications'

// Re-export so consumers can get the full definition alongside store types.
export type { ItemDefinition }
// Re-export Skill so HUD components can import it from a single store entry-point.
export type { Skill }

// ── Player Stats ────────────────────────────────────────────────────────────

export interface PlayerStats {
  name: string
  level: number
  experience: number
  experienceToNextLevel: number
  health: number
  maxHealth: number
  stamina: number
  maxStamina: number
  /** Phase 23 — numeric coin currency. */
  coins: number
}

const DEFAULT_PLAYER_STATS: PlayerStats = {
  name: 'Wanderer',
  level: 1,
  experience: 0,
  experienceToNextLevel: 100,
  health: 100,
  maxHealth: 100,
  stamina: 50,
  maxStamina: 50,
  coins: 50,
}

// ── Inventory ───────────────────────────────────────────────────────────────

/**
 * A single stack in the player's inventory.
 *
 * Phase 11: the `id` field doubles as the ItemDefinition lookup key.
 * Use `getItem(item.id)` (from itemRegistry) to obtain the full definition
 * including type, value, icon, and metadata.  The `name` field is kept for
 * backward-compatibility and is auto-populated from the registry when an item
 * is added via addItem().
 */
export interface InventoryItem {
  id: string
  name: string
  quantity: number
}

export interface InventoryState {
  slots: InventoryItem[]
  maxSlots: number
}

const DEFAULT_INVENTORY: InventoryState = {
  slots: [
    { id: 'rough_ash_hatchet', name: 'Rough Ash Hatchet', quantity: 1 },
    { id: 'quarry_pick', name: 'Quarry Pick', quantity: 1 },
    { id: 'reedline_rod', name: 'Reedline Rod', quantity: 1 },
    { id: 'camp_rations', name: 'Camp Rations', quantity: 3 },
    { id: 'rough_stone', name: 'Rough Stone', quantity: 5 },
    { id: 'ash_twig', name: 'Ash Twig', quantity: 2 },
  ],
  maxSlots: 20,
}

// ── Skills ──────────────────────────────────────────────────────────────────

export interface SkillsState {
  skills: Skill[]
}

const DEFAULT_SKILLS: SkillsState = {
  skills: STARTER_SKILLS,
}

// ── Settings ────────────────────────────────────────────────────────────────

export interface Settings {
  masterVolume: number
  musicVolume: number
  sfxVolume: number
  mouseSensitivity: number
  showFps: boolean
}

const DEFAULT_SETTINGS: Settings = {
  masterVolume: 1.0,
  musicVolume: 0.8,
  sfxVolume: 1.0,
  mouseSensitivity: 0.5,
  showFps: false,
}

// ── Store ────────────────────────────────────────────────────────────────────

export interface GameState {
  playerStats: PlayerStats
  inventory: InventoryState
  skills: SkillsState
  settings: Settings

  // Player stat mutators
  setPlayerName: (name: string) => void
  setHealth: (health: number) => void
  setStamina: (stamina: number) => void
  /** Phase 23 — add coins (positive amount only). */
  addCoins: (amount: number) => void
  /**
   * Phase 23 — deduct coins.
   * Returns true on success, false when the player has insufficient funds.
   */
  spendCoins: (amount: number) => boolean

  // Inventory mutators
  addItem: (item: InventoryItem) => void
  removeItem: (id: string, quantity?: number) => void

  // Skills mutators
  addSkill: (skill: Skill) => void
  updateSkillExperience: (id: string, experience: number) => void
  /**
   * Phase 14 — XP Curve Base
   *
   * Grant `amount` XP to the skill identified by `id`.  Applies the
   * xpCurve formula, handles multi-level advancement, fires a level-up
   * notification for each level gained, and calls the optional `onLevelUp`
   * hook with the skill name and new level.
   */
  grantSkillXp: (
    id: string,
    amount: number,
    onLevelUp?: (skillName: string, newLevel: number) => void,
  ) => void

  // Settings mutators
  updateSettings: (patch: Partial<Settings>) => void
}

export const useGameStore = create<GameState>((set, get) => ({
  playerStats: structuredClone(DEFAULT_PLAYER_STATS),
  inventory: structuredClone(DEFAULT_INVENTORY),
  skills: structuredClone(DEFAULT_SKILLS),
  settings: structuredClone(DEFAULT_SETTINGS),

  // ── Player stat mutators ─────────────────────────────────────────────────
  setPlayerName: (name) =>
    set((state) => ({
      playerStats: { ...state.playerStats, name },
    })),

  setHealth: (health) =>
    set((state) => ({
      playerStats: {
        ...state.playerStats,
        health: Math.max(0, Math.min(health, state.playerStats.maxHealth)),
      },
    })),

  setStamina: (stamina) =>
    set((state) => ({
      playerStats: {
        ...state.playerStats,
        stamina: Math.max(0, Math.min(stamina, state.playerStats.maxStamina)),
      },
    })),

  addCoins: (amount) =>
    set((state) => {
      const n = Math.floor(amount)
      if (n <= 0) return state
      return { playerStats: { ...state.playerStats, coins: state.playerStats.coins + n } }
    }),

  spendCoins: (amount) => {
    const n = Math.floor(amount)
    if (n <= 0) return false
    const current = get().playerStats.coins
    if (current < n) return false
    set((state) => ({ playerStats: { ...state.playerStats, coins: state.playerStats.coins - n } }))
    return true
  },

  // ── Inventory mutators ───────────────────────────────────────────────────
  addItem: (item) =>
    set((state) => {
      // Guard: quantity must be a positive integer.
      const qty = Math.floor(item.quantity)
      if (qty <= 0) return state

      // Phase 11: auto-populate name from registry when available so callers
      // don't have to duplicate display strings.
      const def = getItem(item.id)
      const resolvedName = def?.name ?? item.name

      const existing = state.inventory.slots.find((s) => s.id === item.id)
      if (existing) {
        return {
          inventory: {
            ...state.inventory,
            slots: state.inventory.slots.map((s) =>
              s.id === item.id
                ? { ...s, quantity: s.quantity + qty }
                : s,
            ),
          },
        }
      }
      if (state.inventory.slots.length >= state.inventory.maxSlots) {
        return state
      }
      return {
        inventory: {
          ...state.inventory,
          slots: [...state.inventory.slots, { ...item, name: resolvedName, quantity: qty }],
        },
      }
    }),

  removeItem: (id, quantity = 1) =>
    set((state) => {
      // Guard: quantity must be positive; no-op when slot doesn't exist.
      if (quantity <= 0) return state
      if (!state.inventory.slots.some((s) => s.id === id)) return state

      const updated = state.inventory.slots
        .map((s) => (s.id === id ? { ...s, quantity: s.quantity - quantity } : s))
        .filter((s) => s.quantity > 0)
      return { inventory: { ...state.inventory, slots: updated } }
    }),

  // ── Skills mutators ──────────────────────────────────────────────────────
  addSkill: (skill) =>
    set((state) => {
      if (state.skills.skills.some((s) => s.id === skill.id)) {
        return state
      }
      return {
        skills: { ...state.skills, skills: [...state.skills.skills, { ...skill }] },
      }
    }),

  updateSkillExperience: (id, experience) =>
    set((state) => {
      const target = state.skills.skills.find((s) => s.id === id)
      if (!target || target.experience === experience) return state
      return {
        skills: {
          ...state.skills,
          skills: state.skills.skills.map((s) =>
            s.id === id ? { ...s, experience } : s,
          ),
        },
      }
    }),

  grantSkillXp: (id, amount, onLevelUp) =>
    set((state) => {
      const target = state.skills.skills.find((s) => s.id === id)
      if (!target) return state

      const result = applyXp(target.level, target.experience, amount)

      // No change — skip the update entirely to avoid unnecessary re-renders.
      if (
        result.level === target.level &&
        result.experience === target.experience &&
        result.experienceToNextLevel === target.experienceToNextLevel
      ) {
        return state
      }

      // Fire level-up notifications and the optional callback for each
      // level gained.
      if (result.levelsGained > 0) {
        const { push } = useNotifications.getState()
        for (let i = 1; i <= result.levelsGained; i++) {
          const gainedLevel = target.level + i
          push(`${target.name} reached level ${gainedLevel}!`, 'success')
          onLevelUp?.(target.name, gainedLevel)
        }
      }

      return {
        skills: {
          ...state.skills,
          skills: state.skills.skills.map((s) =>
            s.id === id
              ? {
                  ...s,
                  level: result.level,
                  experience: result.experience,
                  experienceToNextLevel: result.experienceToNextLevel,
                }
              : s,
          ),
        },
      }
    }),

  // ── Settings mutators ────────────────────────────────────────────────────
  updateSettings: (patch) =>
    set((state) => ({
      settings: { ...state.settings, ...patch },
    })),
}))
