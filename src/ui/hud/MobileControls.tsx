import { useRef, useCallback, useEffect, useState } from 'react'

interface MobileControlsProps {
  /** Shared ref that MobileControls writes joystick direction into each frame. */
  joystickRef: React.MutableRefObject<{ x: number; z: number }>
  /** Called when the user taps the interact button. */
  onInteract: () => void
  /** Ref updated by the game loop each frame – true when an interaction target is in range. */
  hasTargetRef: React.MutableRefObject<boolean>
}

/** Radius of the joystick base in CSS pixels. */
const JOYSTICK_RADIUS = 52

/**
 * Mobile-only overlay: virtual joystick (bottom-left) + action buttons
 * (bottom-right).  Hidden on pointer:fine (mouse) devices via CSS media query.
 */
export function MobileControls({ joystickRef, onInteract, hasTargetRef }: MobileControlsProps) {
  const baseRef = useRef<HTMLDivElement>(null)
  const knobRef = useRef<HTMLDivElement>(null)
  const activeTouchRef = useRef<number | null>(null)

  // Poll the hasTargetRef every 100 ms – only a ref read per tick, no DOM access.
  const [hasTarget, setHasTarget] = useState(false)

  useEffect(() => {
    const id = setInterval(() => {
      setHasTarget(hasTargetRef.current)
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
      resetKnob()
    },
    [resetKnob],
  )

  const onInteractTouch = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation()
      e.preventDefault()
      onInteract()
    },
    [onInteract],
  )

  const dispatchKey = useCallback((code: string) => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true }))
  }, [])

  const onInventoryTouch = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation()
      e.preventDefault()
      dispatchKey('KeyI')
    },
    [dispatchKey],
  )

  const onSkillsTouch = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation()
      e.preventDefault()
      dispatchKey('KeyK')
    },
    [dispatchKey],
  )

  return (
    <div className="mobile-controls" aria-hidden="true">
      {/* ── Virtual joystick (bottom-left) ────────────────────────── */}
      <div
        ref={baseRef}
        className="joystick-base"
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
        </div>
        <button
          className={`mobile-btn mobile-btn--interact${hasTarget ? ' mobile-btn--active' : ''}`}
          onTouchStart={onInteractTouch}
          aria-label="Interact"
        >
          E
        </button>
      </div>
    </div>
  )
}
