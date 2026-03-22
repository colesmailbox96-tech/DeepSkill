/**
 * Phase 33 — Food Store
 *
 * Tracks the per-player food-use cooldown and exposes the consume action.
 * The game loop (App.tsx) calls tickCooldown(delta) each frame so the timer
 * stays accurate without needing React renders or setInterval.
 *
 * Phase 59 — Buff tracking
 * Eating a food with `consumableMeta.buffAttack` activates a timed attack
 * bonus.  `buffAttackRemaining` counts down each frame; `buffAttackBonus`
 * returns the active bonus (0 when no buff is active).
 */

import { create } from 'zustand'
import { FOOD_COMBAT_COOLDOWN } from '../engine/food'
import { useGameStore } from './useGameStore'
import { getItem } from '../data/items/itemRegistry'
import { useNotifications } from './useNotifications'

export interface FoodState {
  /** Seconds remaining on the eat cooldown; 0 means ready to eat. */
  cooldownRemaining: number

  /** Seconds remaining on the active attack buff (0 = no buff). */
  buffAttackRemaining: number

  /** The flat attack bonus granted by the active food buff (0 = no buff). */
  buffAttackBonus: number

  /**
   * Advance both the eat cooldown and the attack-buff timer by delta seconds.
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
  buffAttackRemaining: 0,
  buffAttackBonus: 0,

  tickCooldown: (delta) =>
    set((state) => {
      const next: Partial<FoodState> = {}
      if (state.cooldownRemaining > 0) {
        next.cooldownRemaining = Math.max(0, state.cooldownRemaining - delta)
      }
      if (state.buffAttackRemaining > 0) {
        const remaining = Math.max(0, state.buffAttackRemaining - delta)
        next.buffAttackRemaining = remaining
        if (remaining === 0) next.buffAttackBonus = 0
      }
      return Object.keys(next).length > 0 ? { ...state, ...next } : state
    }),

  eat: (itemId, inCombat) => {
    // Enforce cooldown when in combat.
    const { cooldownRemaining } = get()
    if (inCombat && cooldownRemaining > 0) return false

    // Guard: item must exist in inventory before we look up its definition.
    const { playerStats, setHealth, setStamina, removeItem, inventory } = useGameStore.getState()
    if (!inventory.slots.some((s) => s.id === itemId)) return false

    const def = getItem(itemId)
    if (!def || def.type !== 'consumable' || !def.consumableMeta?.healsHp) return false

    const { healsHp, restoresStamina, buffAttack, duration } = def.consumableMeta

    // Don't waste food when already at full health AND the item has nothing
    // else to restore (e.g. stamina).  A tonic that restores stamina is still
    // useful even when the player is at full HP.
    const hpFull = playerStats.health >= playerStats.maxHealth
    const staminaFull =
      !restoresStamina || playerStats.stamina >= playerStats.maxStamina
    if (hpFull && staminaFull) {
      useNotifications.getState().push('Already at full health.', 'info')
      return false
    }

    const newHp = Math.min(playerStats.maxHealth, playerStats.health + healsHp)
    const actualHeal = newHp - playerStats.health
    setHealth(newHp)

    // Restore stamina if the item carries a stamina value.
    let staminaPart = ''
    if (restoresStamina) {
      const newStamina = Math.min(
        playerStats.maxStamina,
        playerStats.stamina + restoresStamina,
      )
      const actualStamina = newStamina - playerStats.stamina
      setStamina(newStamina)
      if (actualStamina > 0) staminaPart = `+${actualStamina} Stamina`
    }

    removeItem(itemId, 1)

    // Apply attack buff if the food carries one.
    const buffPart =
      buffAttack && duration
        ? `+${buffAttack} Attack for ${duration} s`
        : ''

    const healPart = actualHeal > 0 ? `restored ${actualHeal} HP` : ''
    const parts = [healPart, staminaPart, buffPart].filter(Boolean)

    useNotifications
      .getState()
      .push(`Ate ${def.name} — ${parts.join(' · ')}.`, 'success')

    if (buffAttack && duration) {
      set({ buffAttackBonus: buffAttack, buffAttackRemaining: duration })
    }

    // Apply cooldown only during combat so out-of-combat eating is frictionless.
    if (inCombat) {
      set({ cooldownRemaining: FOOD_COMBAT_COOLDOWN })
    }

    return true
  },
}))
