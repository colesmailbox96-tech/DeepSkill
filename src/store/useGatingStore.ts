import { create } from 'zustand'
import type { GateRequirement } from '../engine/gating'

/**
 * Phase 67 — Gating Store
 *
 * Holds the requirement that is currently blocking the player at a gate.
 * The GateBlockedHud reads this to render a persistent panel explaining
 * what the player must do to proceed.
 *
 * Set by buildGatedDoor / hollow_vault gate when the player's interaction
 * attempt fails.  Cleared when the gate opens or after a short timeout in
 * the HUD component.
 */

interface GatingState {
  /** The requirement blocking the player; null when no gate is blocking. */
  blockedRequirement: GateRequirement | null
  setBlockedRequirement: (req: GateRequirement | null) => void
}

export const useGatingStore = create<GatingState>((set) => ({
  blockedRequirement: null,
  setBlockedRequirement: (req) => set({ blockedRequirement: req }),
}))
