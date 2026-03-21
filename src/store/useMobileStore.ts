/**
 * Phase 52 — Mobile Controls Store
 *
 * Tracks touch-device detection and ephemeral tap feedback.
 *
 *  • isTouchDevice  — set to true on the first touch event; used to tailor
 *                     HUD text and interaction prompts for mobile players.
 *  • tapFeedback    — a short-lived (x, y) ripple position written by the
 *                     game loop whenever the player taps the canvas to target
 *                     a creature.  MobileControls reads this to render a
 *                     visual ripple at the tap site.
 */
import { create } from 'zustand'

/** Ephemeral data for a single tap-ripple event. */
export interface TapFeedback {
  /** Viewport X coordinate of the tap centre. */
  x: number
  /** Viewport Y coordinate of the tap centre. */
  y: number
  /**
   * Monotonically-increasing key so React can remount the ripple element
   * for each new tap even when the (x, y) position is identical.
   */
  key: number
}

interface MobileState {
  /** True once the first touch event fires on this session. */
  isTouchDevice: boolean
  /** Non-null while a tap-ripple is queued for display; cleared by MobileControls. */
  tapFeedback: TapFeedback | null

  /** Mark this session as a touch-device session. */
  setTouchDevice: () => void
  /** Queue a tap ripple at the given viewport position. */
  showTapFeedback: (x: number, y: number) => void
  /** Called by MobileControls after the ripple animation ends. */
  clearTapFeedback: () => void
}

let _tapKey = 0

export const useMobileStore = create<MobileState>((set) => ({
  isTouchDevice: false,
  tapFeedback: null,

  setTouchDevice: () => set({ isTouchDevice: true }),
  showTapFeedback: (x, y) => set({ tapFeedback: { x, y, key: ++_tapKey } }),
  clearTapFeedback: () => set({ tapFeedback: null }),
}))
