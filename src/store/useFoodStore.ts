/**
 * Phase 33 — Food Store
 *
 * Tracks the per-player food-use cooldown and exposes the consume action.
 * The game loop (App.tsx) calls tickCooldown(delta) each frame so the timer
 * stays accurate without needing React renders or setInterval.
 */

import { create } from 'zustand'
import { FOOD_COMBAT_COOLDOWN } from '../engine/food'
import { useGameStore } from './useGameStore'
import { getItem } from '../data/items/itemRegistry'
import { useNotifications } from './useNotifications'

export interface FoodState {
  /** Seconds remaining on the eat cooldown; 0 means ready to eat. */
  cooldownRemaining: number

  /**
   * Advance the cooldown timer by delta seconds.
   * Call once per frame from the game loop.
   */
  tickCooldown: (delta: number) => void

  /**
   * Attempt to eat the given item.
   *
   * @param itemId   - inventory item id to consume.
   * @param inCombat - true when the player has an active combat target.
   * @returns true when the item was successfully consumed.
   */
  eat: (itemId: string, inCombat: boolean) => boolean
}

export const useFoodStore = create<FoodState>((set, get) => ({
  cooldownRemaining: 0,

  tickCooldown: (delta) =>
    set((state) => {
      if (state.cooldownRemaining <= 0) return state
      return { cooldownRemaining: Math.max(0, state.cooldownRemaining - delta) }
    }),

  eat: (itemId, inCombat) => {
    // Enforce cooldown when in combat.
    const { cooldownRemaining } = get()
    if (inCombat && cooldownRemaining > 0) return false

    // Guard: item must exist in inventory before we look up its definition.
    const { playerStats, setHealth, removeItem, inventory } = useGameStore.getState()
    if (!inventory.slots.some((s) => s.id === itemId)) return false

    const def = getItem(itemId)
    if (!def || def.type !== 'consumable' || !def.consumableMeta?.healsHp) return false

    // Don't waste food when already at full health.
    if (playerStats.health >= playerStats.maxHealth) {
      useNotifications.getState().push('Already at full health.', 'info')
      return false
    }

    const healsHp = def.consumableMeta.healsHp
    const newHp = Math.min(playerStats.maxHealth, playerStats.health + healsHp)
    const actualHeal = newHp - playerStats.health

    setHealth(newHp)
    removeItem(itemId, 1)

    useNotifications
      .getState()
      .push(`Ate ${def.name} — restored ${actualHeal} HP.`, 'success')

    // Apply cooldown only during combat so out-of-combat eating is frictionless.
    if (inCombat) {
      set({ cooldownRemaining: FOOD_COMBAT_COOLDOWN })
    }

    return true
  },
}))
