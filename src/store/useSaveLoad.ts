/**
 * Stabilization Pass A — Sub-phase A14: Save / load / session resilience.
 *
 * Persists a minimal save snapshot to localStorage so that mobile users can
 * leave the app and return without losing progress.
 *
 * Saved fields: playerStats, inventory, skills, equipment, settings, and
 * vendor stock counts (so finite-supply items stay depleted across sessions).
 * Items marked resetEachSession in their VendorItem definition are excluded
 * from the restored stock and reset to their initial supply on every load.
 * Large/transient state (NPC positions, combat, active sessions) is
 * intentionally excluded — it is rebuilt from defaults on each load.
 */
import { useCallback } from 'react'
import { useGameStore } from './useGameStore'
import { useShopStore } from './useShopStore'
import { useFactionStore } from './useFactionStore'
import { getAllVendorDefs } from '../engine/shop'
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
  /** Phase 76 — faction reputation values. Optional for backward compatibility. */
  factionRep?: Record<string, number>
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
      const { rep: factionRep } = useFactionStore.getState()
      const snapshot: SaveSnapshot = {
        version: 1,
        playerStats,
        inventory,
        skills,
        equipment,
        settings,
        vendorStocks,
        factionRep,
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
      // Phase 85 — items with resetEachSession: true are stripped from the
      // saved snapshot so they reset to their initial stock on every load
      // (e.g. camp_rations replenishes to 20 each session).
      if (snapshot.vendorStocks && typeof snapshot.vendorStocks === 'object') {
        // Build the set of session-resetting items so we can exclude them.
        const sessionResetKeys = new Set<string>()
        for (const vendor of getAllVendorDefs()) {
          for (const item of vendor.stock) {
            if (item.resetEachSession) {
              sessionResetKeys.add(`${vendor.id}::${item.id}`)
            }
          }
        }
        // Clone the saved stocks, removing any session-reset entries so they
        // fall back to the defaults provided by buildDefaultVendorStocks().
        const filteredStocks: Record<string, Record<string, number>> = {}
        for (const [vendorId, itemMap] of Object.entries(snapshot.vendorStocks)) {
          const filteredItems: Record<string, number> = {}
          for (const [itemId, qty] of Object.entries(itemMap)) {
            if (!sessionResetKeys.has(`${vendorId}::${itemId}`)) {
              filteredItems[itemId] = qty
            }
          }
          if (Object.keys(filteredItems).length > 0) {
            filteredStocks[vendorId] = filteredItems
          }
        }
        useShopStore.getState().setVendorStocks(filteredStocks)
      }

      // Phase 76 — restore faction rep if present.
      // Absent in saves from before Phase 76; the store will use its defaults.
      // Only restore rep for faction ids that exist in the registry; this
      // prevents a crafted or corrupt save from injecting arbitrary keys into
      // the runtime rep map.
      if (snapshot.factionRep && typeof snapshot.factionRep === 'object') {
        const knownRep = useFactionStore.getState().rep
        const validatedRep: Record<string, number> = {}
        for (const [factionId, amount] of Object.entries(snapshot.factionRep)) {
          // Allow 0 here (exact restore semantics); gainRep rejects <= 0
          // because it is an incremental add, not a restoration.
          if (
            factionId in knownRep &&
            typeof amount === 'number' &&
            Number.isFinite(amount) &&
            amount >= 0
          ) {
            validatedRep[factionId] = Math.floor(amount)
          }
        }
        if (Object.keys(validatedRep).length > 0) {
          useFactionStore.setState((s) => ({
            rep: { ...s.rep, ...validatedRep },
          }))
        }
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
