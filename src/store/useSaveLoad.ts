/**
 * Stabilization Pass A — Sub-phase A14: Save / load / session resilience.
 *
 * Persists a minimal save snapshot to localStorage so that mobile users can
 * leave the app and return without losing progress.
 *
 * Saved fields: playerStats, inventory, skills, equipment, settings, and
 * vendor stock counts (so finite-supply items stay depleted across sessions).
 * Large/transient state (NPC positions, combat, active sessions) is
 * intentionally excluded — it is rebuilt from defaults on each load.
 */
import { useCallback } from 'react'
import { useGameStore } from './useGameStore'
import { useShopStore } from './useShopStore'
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
  /** Remaining stock counts for finite-supply vendor items. Optional for
   *  backward compatibility with saves created before Phase 55. */
  vendorStocks?: Record<string, Record<string, number>>
}

/** Runtime guard: verify that `v` is a finite, non-NaN number. */
function isValidNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}

/** Serialise the relevant slice of game state to localStorage. */
export function useSaveGame(): () => boolean {
  return useCallback((): boolean => {
    try {
      const { playerStats, inventory, skills, equipment, settings } =
        useGameStore.getState()
      const { vendorStocks } = useShopStore.getState()
      const snapshot: SaveSnapshot = {
        version: 1,
        playerStats,
        inventory,
        skills,
        equipment,
        settings,
        vendorStocks,
      }
      localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot))
      return true
    } catch (err) {
      // localStorage can throw in private-browsing modes or when the quota is full.
      console.warn('[Save] failed to persist game state:', err)
      return false
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

      // Restore full playerStats with field-level validation so a corrupt
      // or partial save cannot introduce NaN or wrong-type values into the
      // store.  Each field falls back to the current store value when
      // invalid so partial saves still apply the valid subset.
      if (snapshot.playerStats) {
        const sp = snapshot.playerStats
        const current = store.playerStats
        useGameStore.setState({
          playerStats: {
            name: typeof sp.name === 'string' && sp.name.trim() !== '' ? sp.name : current.name,
            level: isValidNumber(sp.level) ? sp.level : current.level,
            experience: isValidNumber(sp.experience) ? sp.experience : current.experience,
            experienceToNextLevel: isValidNumber(sp.experienceToNextLevel) ? sp.experienceToNextLevel : current.experienceToNextLevel,
            health: isValidNumber(sp.health) ? sp.health : current.health,
            maxHealth: isValidNumber(sp.maxHealth) ? sp.maxHealth : current.maxHealth,
            stamina: isValidNumber(sp.stamina) ? sp.stamina : current.stamina,
            maxStamina: isValidNumber(sp.maxStamina) ? sp.maxStamina : current.maxStamina,
            coins: isValidNumber(sp.coins) ? sp.coins : current.coins,
          },
        })
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
        // Replace the entire skills slice so level / experience /
        // experienceToNextLevel all stay in sync with the saved state.
        useGameStore.setState({ skills: snapshot.skills })
      }

      if (snapshot.equipment) {
        for (const [, item] of Object.entries(snapshot.equipment)) {
          if (item) store.equipItem(item.id)
        }
      }

      if (snapshot.settings) {
        store.updateSettings(snapshot.settings)
      }

      // Restore vendor stock counts if present (Phase 55+).
      // Absent in saves from before Phase 55; the store will use its defaults.
      if (snapshot.vendorStocks && typeof snapshot.vendorStocks === 'object') {
        useShopStore.getState().setVendorStocks(snapshot.vendorStocks)
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
