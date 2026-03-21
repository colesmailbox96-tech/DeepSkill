/**
 * Stabilization Pass A — Sub-phase A14: Save / load / session resilience.
 *
 * Persists a minimal save snapshot to localStorage so that mobile users can
 * leave the app and return without losing progress.
 *
 * Saved fields: playerStats, inventory, skills, equipment, and settings.
 * Large/transient state (NPC positions, combat, active sessions) is
 * intentionally excluded — it is rebuilt from defaults on each load.
 */
import { useCallback } from 'react'
import { useGameStore } from './useGameStore'
import type { PlayerStats, InventoryState, EquipmentState, Settings } from './useGameStore'
import type { SkillsState } from './useGameStore'

const SAVE_KEY = 'veilmarch_save_v1'

interface SaveSnapshot {
  version: 1
  playerStats: PlayerStats
  inventory: InventoryState
  skills: SkillsState
  equipment: EquipmentState
  settings: Settings
}

/** Serialise the relevant slice of game state to localStorage. */
export function useSaveGame(): () => void {
  return useCallback(() => {
    try {
      const { playerStats, inventory, skills, equipment, settings } =
        useGameStore.getState()
      const snapshot: SaveSnapshot = {
        version: 1,
        playerStats,
        inventory,
        skills,
        equipment,
        settings,
      }
      localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot))
    } catch (err) {
      // localStorage can throw in private-browsing modes or when the quota is full.
      console.warn('[Save] failed to persist game state:', err)
    }
  }, [])
}

/**
 * Read a saved snapshot from localStorage and hydrate the store.
 * Silently no-ops if no save exists or the data is malformed — the
 * game simply starts from its default state.
 */
export function useLoadGame(): () => void {
  return useCallback(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY)
      if (!raw) return

      const snapshot = JSON.parse(raw) as Partial<SaveSnapshot>
      if (snapshot.version !== 1) return

      const store = useGameStore.getState()

      if (snapshot.playerStats) {
        store.setPlayerName(snapshot.playerStats.name)
        store.setHealth(snapshot.playerStats.health)
        store.setStamina(snapshot.playerStats.stamina)
      }

      if (snapshot.inventory?.slots) {
        // Re-add every saved item so the normal stacking / capacity logic
        // runs correctly rather than replacing the slot array wholesale.
        // Snapshot the current slots first — removeItem mutates the store
        // array so we need a stable copy to iterate over.
        const currentSlots = useGameStore.getState().inventory.slots.slice()
        for (const slot of currentSlots) {
          store.removeItem(slot.id, slot.quantity)
        }
        for (const item of snapshot.inventory.slots) {
          store.addItem(item)
        }
      }

      if (snapshot.skills?.skills) {
        for (const saved of snapshot.skills.skills) {
          store.updateSkillExperience(saved.id, saved.experience)
        }
      }

      if (snapshot.equipment) {
        for (const [, item] of Object.entries(snapshot.equipment)) {
          if (item) store.equipItem(item.id)
        }
      }

      if (snapshot.settings) {
        store.updateSettings(snapshot.settings)
      }
    } catch (err) {
      console.warn('[Load] failed to restore game state:', err)
    }
  }, [])
}

/** Returns true if a save snapshot exists in localStorage. */
export function hasSaveData(): boolean {
  try {
    return localStorage.getItem(SAVE_KEY) !== null
  } catch {
    return false
  }
}

/** Erase the persisted save snapshot. */
export function clearSaveData(): void {
  try {
    localStorage.removeItem(SAVE_KEY)
  } catch {
    /* no-op in restricted environments */
  }
}
