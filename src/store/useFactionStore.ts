/**
 * Phase 76 — Faction Trust Store
 *
 * Tracks the player's reputation with every faction.
 *
 * Rep range:  0 – 1000 (uncapped at 1000 for future use)
 * Trust tiers:
 *   neutral     0 – 99   — no standing; faction does not recognise you
 *   acquainted  100–299  — they know your name; minor discounts / dialogue
 *   trusted     300–599  — reliable ally; unlocks gated content
 *   honored     600–1000 — deep bond; premium perks and rare unlocks
 *
 * Gain sources (Phase 76):
 *   - Task completion with factionRep rewards (see TaskReward in task.ts)
 *
 * Unlock usage (Phase 76):
 *   - GateRequirement kind 'faction' checks minTier against getTrustTier()
 */

import { create } from 'zustand'
import { getAllFactions } from '../data/factions/factionRegistry'

// ─── Tier ─────────────────────────────────────────────────────────────────────

export type FactionTier = 'neutral' | 'acquainted' | 'trusted' | 'honored'

const TIER_THRESHOLDS: { tier: FactionTier; min: number }[] = [
  { tier: 'honored',    min: 600 },
  { tier: 'trusted',   min: 300 },
  { tier: 'acquainted', min: 100 },
  { tier: 'neutral',   min:   0 },
]

export function tierFromRep(rep: number): FactionTier {
  for (const { tier, min } of TIER_THRESHOLDS) {
    if (rep >= min) return tier
  }
  return 'neutral'
}

/** Rep required to reach a given tier (the lower bound). */
export const TIER_REP: Record<FactionTier, number> = {
  neutral:    0,
  acquainted: 100,
  trusted:    300,
  honored:    600,
}

// ─── Default state ────────────────────────────────────────────────────────────

function buildDefaultRep(): Record<string, number> {
  const out: Record<string, number> = {}
  for (const f of getAllFactions()) {
    out[f.id] = 0
  }
  return out
}

// ─── Store ────────────────────────────────────────────────────────────────────

export interface FactionState {
  /** Reputation values keyed by faction id (0–1000+). */
  rep: Record<string, number>

  /**
   * Increase reputation with a faction.
   * `amount` must be a positive integer; non-positive or non-finite values
   * are silently ignored.
   */
  gainRep: (factionId: string, amount: number) => void

  /** Return the current reputation value for a faction (0 if unknown). */
  getRepForFaction: (factionId: string) => number

  /** Return the trust tier for a faction. */
  getTrustTier: (factionId: string) => FactionTier

  /** Reset all faction rep to zero (used by New Game). */
  resetToDefaults: () => void
}

export const useFactionStore = create<FactionState>((set, get) => ({
  rep: buildDefaultRep(),

  gainRep: (factionId, amount) => {
    const n = Math.floor(amount)
    if (!Number.isFinite(n) || n <= 0) return
    // Ignore unknown faction ids.
    if (!(factionId in get().rep)) return
    set((s) => ({
      rep: { ...s.rep, [factionId]: s.rep[factionId] + n },
    }))
  },

  getRepForFaction: (factionId) => get().rep[factionId] ?? 0,

  getTrustTier: (factionId) => tierFromRep(get().rep[factionId] ?? 0),

  resetToDefaults: () => set({ rep: buildDefaultRep() }),
}))
