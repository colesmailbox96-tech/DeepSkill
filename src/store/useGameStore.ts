import { create } from 'zustand'
import { getItem } from '../data/items/itemRegistry'
import type { ItemDefinition, EquipSlot } from '../data/items/itemSchema'
import type { Skill } from '../data/skills/skillSchema'
import { STARTER_SKILLS } from '../data/skills/starterSkills'
import { applyXp } from '../data/skills/xpCurve'
import { useNotifications } from './useNotifications'
import {
  computeEquipStats,
  meetsEquipRequirements,
} from '../engine/equipment'
import type { EquipStats } from '../engine/equipment'
import { recordSkillLevelUp } from '../engine/telemetry'

// Re-export so consumers can get the full definition alongside store types.
export type { ItemDefinition, EquipSlot }
// Re-export Skill so HUD components can import it from a single store entry-point.
export type { Skill }
// Re-export EquipStats for UI consumers.
export type { EquipStats }

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
  /** Phase 23 — numeric coin currency. Phase 24 — named Marks (⬡). */
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
 *
 * Phase 73: `durability` tracks remaining uses for tool items.  Absent means
 * the tool is at full durability (equals the item's maxDurability).
 */
export interface InventoryItem {
  id: string
  name: string
  quantity: number
  /** Phase 73 — remaining uses for tool-type items.  Absent = full durability. */
  durability?: number
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
    // Phase 26 / 27 — starter equipment pieces so the equipment system is immediately testable.
    { id: 'patchplate_buckler', name: 'Patchplate Buckler', quantity: 1 },
    { id: 'roughhide_vest', name: 'Roughhide Vest', quantity: 1 },
    { id: 'ashwood_club', name: 'Ashwood Club', quantity: 1 },
    { id: 'marsh_boots', name: 'Marsh Boots', quantity: 1 },
    // Phase 27 — Ironspine Spear (requires Wayfaring 2 to equip).
    { id: 'ironspine_spear', name: 'Ironspine Spear', quantity: 1 },
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

// ── Equipment ────────────────────────────────────────────────────────────────

/**
 * Phase 26 — Equipment State
 *
 * Maps each EquipSlot to the InventoryItem currently occupying it.
 * Absent keys (undefined) indicate an empty slot.
 */
export type EquipmentState = Partial<Record<EquipSlot, InventoryItem>>

const DEFAULT_EQUIPMENT: EquipmentState = {}

// ── Store ────────────────────────────────────────────────────────────────────

export interface GameState {
  playerStats: PlayerStats
  inventory: InventoryState
  skills: SkillsState
  settings: Settings
  /** Phase 26 — currently equipped items, keyed by slot. */
  equipment: EquipmentState
  /** Phase 26 — aggregated bonuses from all equipped gear. */
  equipStats: EquipStats

  // Player stat mutators
  setPlayerName: (name: string) => void
  setHealth: (health: number) => void
  setStamina: (stamina: number) => void
  /** Phase 23/24 — add Marks (positive amount only). */
  addCoins: (amount: number) => void
  /**
   * Phase 23/24 — deduct Marks.
   * Returns true on success, false when the player has insufficient funds.
   */
  spendCoins: (amount: number) => boolean

  // Inventory mutators
  /**
   * Add an item (or stack quantity) to the player's inventory.
   * Returns `true` when the item was successfully added or stacked,
   * `false` when the inventory is full and the item cannot be received.
   */
  addItem: (item: InventoryItem) => boolean
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

  /**
   * Phase 26 — Equip an inventory item.
   *
   * Moves the item from the player's inventory into the correct equipment
   * slot.  Any item already in that slot is swapped back into inventory.
   * Returns `true` on success, `false` when the item is not equippable or
   * the player does not meet the requirements.
   */
  equipItem: (itemId: string) => boolean
  /**
   * Phase 26 — Unequip the item in the given slot.
   *
   * Moves the item back into inventory.  No-op when the slot is empty.
   */
  unequipItem: (slot: EquipSlot) => void

  /**
   * Phase 51 — Reset all game state to its initial defaults.
   *
   * Used by the Main Menu "New Game" flow to wipe any in-memory progress
   * before starting a fresh session.
   */
  resetToDefaults: () => void

  /**
   * Phase 73 — Degrade the highest-tier tool for the given skill by one use.
   *
   * Finds the best (highest tier) tool in inventory that matches `skill`,
   * decrements its durability by 1 (treating absent durability as max), and
   * removes it with a notification when it breaks.  If the slot has
   * quantity > 1 the broken copy is consumed and the remainder is restored
   * to full durability.
   */
  degradeTool: (skill: string) => void
}

export const useGameStore = create<GameState>((set, get) => ({
  playerStats: structuredClone(DEFAULT_PLAYER_STATS),
  inventory: structuredClone(DEFAULT_INVENTORY),
  skills: structuredClone(DEFAULT_SKILLS),
  settings: structuredClone(DEFAULT_SETTINGS),
  equipment: structuredClone(DEFAULT_EQUIPMENT),
  equipStats: { totalAttack: 0, totalDefence: 0, attackSpeed: 1 },

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
  addItem: (item): boolean => {
    // Guard: quantity must be a positive integer.
    const qty = Math.floor(item.quantity)
    if (qty <= 0) return false

    // Phase 11: auto-populate name from registry when available so callers
    // don't have to duplicate display strings.
    const def = getItem(item.id)
    const resolvedName = def?.name ?? item.name

    const state = get()
    const existing = state.inventory.slots.find((s) => s.id === item.id)

    if (existing) {
      // Stack onto existing slot — always succeeds.
      set((s) => ({
        inventory: {
          ...s.inventory,
          slots: s.inventory.slots.map((slot) =>
            slot.id === item.id ? { ...slot, quantity: slot.quantity + qty } : slot,
          ),
        },
      }))
      return true
    }

    if (state.inventory.slots.length >= state.inventory.maxSlots) {
      // Inventory is full; item cannot be received.
      return false
    }

    set((s) => ({
      inventory: {
        ...s.inventory,
        slots: [...s.inventory.slots, { ...item, name: resolvedName, quantity: qty }],
      },
    }))
    return true
  },

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
          // Phase 98 — Telemetry: record each skill level gained.
          recordSkillLevelUp(id, gainedLevel)
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

  // ── Equipment mutators ───────────────────────────────────────────────────
  equipItem: (itemId) => {
    const state = get()

    // Item must be in inventory.
    const invSlot = state.inventory.slots.find((s) => s.id === itemId)
    if (!invSlot) return false

    // Item must be of type 'equipment' and have equipMeta.
    const def = getItem(itemId)
    if (!def || def.type !== 'equipment' || !def.equipMeta) return false

    const equipSlot = def.equipMeta.slot

    // Check skill requirements.
    const skillMap: Partial<Record<string, number>> = {}
    for (const sk of state.skills.skills) {
      skillMap[sk.id] = sk.level
    }
    if (!meetsEquipRequirements(def, skillMap)) return false

    // Build new equipment map — put item into slot.
    const newEquipment: EquipmentState = { ...state.equipment }
    const displaced = newEquipment[equipSlot] ?? null

    newEquipment[equipSlot] = { id: itemId, name: def.name, quantity: 1 }

    // Remove one unit from inventory.
    const updatedSlots = state.inventory.slots
      .map((s) => (s.id === itemId ? { ...s, quantity: s.quantity - 1 } : s))
      .filter((s) => s.quantity > 0)

    // If something was displaced, return it to inventory.
    const finalSlots = displaced
      ? (() => {
          const existing = updatedSlots.find((s) => s.id === displaced.id)
          if (existing) {
            return updatedSlots.map((s) =>
              s.id === displaced.id ? { ...s, quantity: s.quantity + 1 } : s,
            )
          }
          return [...updatedSlots, { ...displaced, quantity: 1 }]
        })()
      : updatedSlots

    // Recompute aggregate stats.
    const allEquippedDefs = Object.values(newEquipment).map((it) =>
      it ? getItem(it.id) : null,
    )
    const newEquipStats = computeEquipStats(allEquippedDefs)

    set({
      equipment: newEquipment,
      equipStats: newEquipStats,
      inventory: { ...state.inventory, slots: finalSlots },
    })
    return true
  },

  unequipItem: (slot) => {
    const state = get()
    const equipped = state.equipment[slot]
    if (!equipped) return

    // Check capacity before returning to inventory — only stack if item
    // already exists, otherwise a free slot is required.
    const existing = state.inventory.slots.find((s) => s.id === equipped.id)
    if (!existing && state.inventory.slots.length >= state.inventory.maxSlots) {
      const { push } = useNotifications.getState()
      push('Inventory is full — cannot unequip.', 'info')
      return
    }

    // Return the item to inventory.
    const updatedSlots = existing
      ? state.inventory.slots.map((s) =>
          s.id === equipped.id ? { ...s, quantity: s.quantity + 1 } : s,
        )
      : [...state.inventory.slots, { ...equipped, quantity: 1 }]

    const newEquipment: EquipmentState = { ...state.equipment }
    delete newEquipment[slot]

    // Recompute aggregate stats.
    const allEquippedDefs = Object.values(newEquipment).map((it) =>
      it ? getItem(it.id) : null,
    )
    const newEquipStats = computeEquipStats(allEquippedDefs)

    set({
      equipment: newEquipment,
      equipStats: newEquipStats,
      inventory: { ...state.inventory, slots: updatedSlots },
    })
  },

  // Phase 51 — reset all in-memory progress to starter defaults.
  resetToDefaults: () => {
    set({
      playerStats: structuredClone(DEFAULT_PLAYER_STATS),
      inventory:   structuredClone(DEFAULT_INVENTORY),
      skills:      structuredClone(DEFAULT_SKILLS),
      settings:    structuredClone(DEFAULT_SETTINGS),
      equipment:   structuredClone(DEFAULT_EQUIPMENT),
      equipStats:  { totalAttack: 0, totalDefence: 0, attackSpeed: 1 },
    })
  },

  // Phase 73 — degrade the active tool for the given skill by one use.
  degradeTool: (skill: string) => {
    const { inventory } = get()
    // Find the highest-tier tool in inventory that matches this skill.
    let bestSlot: InventoryItem | undefined
    let bestTier = 0
    for (const s of inventory.slots) {
      const def = getItem(s.id)
      if (def?.type === 'tool' && def.toolMeta?.skill === skill) {
        const tier = def.toolMeta.tier
        if (tier > bestTier) {
          bestTier = tier
          bestSlot = s
        }
      }
    }
    if (!bestSlot) return

    const def = getItem(bestSlot.id)!
    const maxDur = def.toolMeta!.maxDurability

    // If max durability is not a positive finite number we cannot safely degrade this tool.
    if (!Number.isFinite(maxDur) || maxDur <= 0) {
      return
    }

    const rawCurrent = bestSlot.durability
    const current =
      rawCurrent === undefined || !Number.isFinite(rawCurrent) || rawCurrent < 0
        ? maxDur
        : rawCurrent
    const next = current - 1

    if (next <= 0) {
      // Tool copy breaks.
      if (bestSlot.quantity > 1) {
        // Consume one copy; remaining copies reset to full durability.
        set((s) => ({
          inventory: {
            ...s.inventory,
            slots: s.inventory.slots.map((sl) =>
              sl.id === bestSlot!.id
                ? { ...sl, quantity: sl.quantity - 1, durability: undefined }
                : sl,
            ),
          },
        }))
      } else {
        // Remove the broken tool entirely.
        set((s) => ({
          inventory: {
            ...s.inventory,
            slots: s.inventory.slots.filter((sl) => sl.id !== bestSlot!.id),
          },
        }))
      }
      useNotifications.getState().push(`Your ${def.name} has broken!`, 'warning')
    } else {
      set((s) => ({
        inventory: {
          ...s.inventory,
          slots: s.inventory.slots.map((sl) =>
            sl.id === bestSlot!.id ? { ...sl, durability: next } : sl,
          ),
        },
      }))
    }
  },
}))
