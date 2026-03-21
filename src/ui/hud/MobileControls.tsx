import { useRef, useCallback, useEffect, useState } from 'react'
import type * as React from 'react'
import { useMobileStore } from '../../store/useMobileStore'
import type { InputAction } from '../../engine/inputActions'

interface MobileControlsProps {
  /** Shared ref that MobileControls writes joystick direction into each frame. */
  joystickRef: React.MutableRefObject<{ x: number; z: number }>
  /** Ref updated by the game loop each frame – true when an interaction target is in range. */
  hasTargetRef: React.MutableRefObject<boolean>
  /**
   * Phase 53 — unified action dispatcher provided by App.  Mobile buttons call
   * this instead of dispatching raw KeyboardEvents so both input paths share
   * the same logic.
   */
  dispatchAction: (action: InputAction) => void
}

/** Radius of the joystick base in CSS pixels. */
const JOYSTICK_RADIUS = 52

/**
 * Mobile-only overlay: virtual joystick (bottom-left) + action buttons
 * (bottom-right).  Hidden on pointer:fine (mouse) devices via CSS media query.
 *
 * Phase 52 — also renders a tap-ripple indicator at the canvas position where
 * the player tapped to target a creature.
 *
 * Phase 53 — all action buttons (including Interact) route through the unified
 * InputAction dispatcher.  Journal and Ledger buttons added for feature parity
 * with desktop keyboard shortcuts.
 */
export function MobileControls({ joystickRef, hasTargetRef, dispatchAction }: MobileControlsProps) {
  const baseRef = useRef<HTMLDivElement>(null)
  const knobRef = useRef<HTMLDivElement>(null)
  const activeTouchRef = useRef<number | null>(null)

  // Phase 52 — subscribe to tap feedback from the game loop.
  const tapFeedback      = useMobileStore((s) => s.tapFeedback)
  const clearTapFeedback = useMobileStore((s) => s.clearTapFeedback)

  // Fallback: if the animation event never fires (e.g. on pointer:fine devices
  // where the overlay is hidden), clear the feedback after the animation
  // duration (420 ms) plus a small margin.
  useEffect(() => {
    if (!tapFeedback) return
    const id = setTimeout(clearTapFeedback, 450)
    return () => clearTimeout(id)
  }, [tapFeedback, clearTapFeedback])

  // Poll the hasTargetRef every 100 ms – only a ref read per tick, no DOM access.
  const [hasTarget, setHasTarget] = useState(false)

  useEffect(() => {
    const id = setInterval(() => {
      const next = hasTargetRef.current
      setHasTarget((prev) => (prev === next ? prev : next))
    }, 100)
    return () => clearInterval(id)
  }, [hasTargetRef])

  /** Move the knob and update the shared joystick ref. */
  const updateKnob = useCallback(
    (clientX: number, clientY: number) => {
      const base = baseRef.current
      const knob = knobRef.current
      if (!base || !knob) return

      const rect = base.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = clientX - cx
      const dy = clientY - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      const clamped = Math.min(dist, JOYSTICK_RADIUS)
      const angle = Math.atan2(dy, dx)

      const kx = Math.cos(angle) * clamped
      const ky = Math.sin(angle) * clamped
      knob.style.transform = `translate(calc(-50% + ${kx}px), calc(-50% + ${ky}px))`

      const norm = dist > 5 ? Math.min(dist / JOYSTICK_RADIUS, 1) : 0
      joystickRef.current = {
        x: Math.cos(angle) * norm,
        // screen Y increases downward; in 3-D world, positive Z is "backward"
        z: Math.sin(angle) * norm,
      }
    },
    [joystickRef],
  )

  /** Reset knob to centre and zero joystick direction. */
  const resetKnob = useCallback(() => {
    activeTouchRef.current = null
    joystickRef.current = { x: 0, z: 0 }
    if (knobRef.current) {
      knobRef.current.style.transform = 'translate(-50%, -50%)'
    }
  }, [joystickRef])

  const onJoystickStart = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation()
      const touch = e.changedTouches[0]
      activeTouchRef.current = touch.identifier
      updateKnob(touch.clientX, touch.clientY)
    },
    [updateKnob],
  )

  const onJoystickMove = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation()
      const touch = Array.from(e.changedTouches).find(
        (t) => t.identifier === activeTouchRef.current,
      )
      if (touch) updateKnob(touch.clientX, touch.clientY)
    },
    [updateKnob],
  )

  const onJoystickEnd = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation()
      // Only reset if the touch that ended is the one driving the joystick.
      const ended = Array.from(e.changedTouches).some(
        (t) => t.identifier === activeTouchRef.current,
      )
      if (ended) resetKnob()
    },
    [resetKnob],
  )

  // ── Phase 53 — all action buttons route through the unified dispatcher ────

  const makeTouchHandler = useCallback(
    (action: InputAction) => (e: React.TouchEvent) => {
      e.stopPropagation()
      e.preventDefault()
      dispatchAction(action)
    },
    [dispatchAction],
  )

  const onInteractTouch  = makeTouchHandler('interact')
  const onInventoryTouch = makeTouchHandler('toggle-inventory')
  const onSkillsTouch    = makeTouchHandler('toggle-skills')
  const onJournalTouch   = makeTouchHandler('toggle-journal')
  const onLedgerTouch    = makeTouchHandler('toggle-ledger')

  return (
    <div className="mobile-controls">
      {/* ── Virtual joystick (bottom-left) — purely decorative element ── */}
      <div
        ref={baseRef}
        className="joystick-base"
        aria-hidden="true"
        onTouchStart={onJoystickStart}
        onTouchMove={onJoystickMove}
        onTouchEnd={onJoystickEnd}
        onTouchCancel={onJoystickEnd}
      >
        <div ref={knobRef} className="joystick-knob" />
      </div>

      {/* ── Action buttons (bottom-right) ─────────────────────────── */}
      <div className="mobile-actions">
        <div className="mobile-actions__row">
          <button
            className="mobile-btn mobile-btn--secondary"
            onTouchStart={onInventoryTouch}
            aria-label="Open inventory"
          >
            🎒
          </button>
          <button
            className="mobile-btn mobile-btn--secondary"
            onTouchStart={onSkillsTouch}
            aria-label="Open skills"
          >
            📊
          </button>
          <button
            className="mobile-btn mobile-btn--secondary"
            onTouchStart={onJournalTouch}
            aria-label="Open journal"
          >
            📖
          </button>
          <button
            className="mobile-btn mobile-btn--secondary"
            onTouchStart={onLedgerTouch}
            aria-label="Open ledger"
          >
            🏛️
          </button>
        </div>
        <button
          className={`mobile-btn mobile-btn--interact${hasTarget ? ' mobile-btn--active' : ''}`}
          onTouchStart={onInteractTouch}
          aria-label="Interact"
        >
          E
        </button>
      </div>

      {/* ── Phase 52 — Tap-targeting ripple feedback ──────────────── */}
      {tapFeedback && (
        <div
          key={tapFeedback.key}
          className="tap-ripple"
          aria-hidden="true"
          style={{ left: tapFeedback.x, top: tapFeedback.y }}
          onAnimationEnd={clearTapFeedback}
        />
      )}
    </div>
  )
}

