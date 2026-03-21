/**
 * Phase 49 — Audio Settings Panel
 *
 * A floating panel toggled with the M key that lets the player adjust volume
 * levels and toggle mute.  The panel is accessible from anywhere — no
 * proximity to a station is required.
 *
 * Volume changes are committed immediately to useAudioStore; App.tsx
 * subscribes to the store and applies changes to the audioManager
 * singleton in real time.
 */

import { useCallback, useEffect, useRef } from 'react'
import { useAudioStore } from '../../store/useAudioStore'

// ─── Volume slider row ────────────────────────────────────────────────────────

interface SliderRowProps {
  label: string
  value: number
  onChange: (v: number) => void
}

function SliderRow({ label, value, onChange }: SliderRowProps) {
  const inputId = `audio-slider-${label.toLowerCase()}`
  return (
    <div className="audio-panel__row">
      <label className="audio-panel__label" htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        className="audio-panel__slider"
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <span className="audio-panel__pct" aria-hidden="true">{Math.round(value * 100)}%</span>
    </div>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function AudioSettingsPanel() {
  const isOpen        = useAudioStore((s) => s.isOpen)
  const closePanel    = useAudioStore((s) => s.closePanel)
  const isMuted       = useAudioStore((s) => s.isMuted)
  const toggleMute    = useAudioStore((s) => s.toggleMute)
  const masterVolume  = useAudioStore((s) => s.masterVolume)
  const musicVolume   = useAudioStore((s) => s.musicVolume)
  const sfxVolume     = useAudioStore((s) => s.sfxVolume)
  const ambientVolume = useAudioStore((s) => s.ambientVolume)
  const setMasterVolume  = useAudioStore((s) => s.setMasterVolume)
  const setMusicVolume   = useAudioStore((s) => s.setMusicVolume)
  const setSfxVolume     = useAudioStore((s) => s.setSfxVolume)
  const setAmbientVolume = useAudioStore((s) => s.setAmbientVolume)

  const isOpenRef = useRef(false)
  useEffect(() => { isOpenRef.current = isOpen }, [isOpen])

  const panelRef = useRef<HTMLDivElement>(null)

  const handleClose = useCallback(() => closePanel(), [closePanel])

  // Escape closes the panel; M toggle is handled in App.tsx.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (e.code === 'Escape' && isOpenRef.current) handleClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleClose])

  // Focus panel on open.
  useEffect(() => {
    if (isOpen) panelRef.current?.focus()
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      ref={panelRef}
      className="audio-panel"
      role="dialog"
      aria-modal="false"
      aria-label="Audio Settings"
      tabIndex={-1}
    >
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="audio-panel__header">
        <span className="audio-panel__title">♪ Audio Settings</span>
        <button
          className={`audio-panel__mute-btn${isMuted ? ' audio-panel__mute-btn--active' : ''}`}
          onClick={toggleMute}
          aria-pressed={isMuted}
          aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
        >
          {isMuted ? '🔇 Muted' : '🔊 Mute'}
        </button>
        <button
          className="audio-panel__close"
          onClick={handleClose}
          aria-label="Close audio settings"
        >
          ✕
        </button>
      </div>

      {/* ── Volume sliders ────────────────────────────────────────────── */}
      <div className="audio-panel__body">
        <SliderRow label="Master"  value={masterVolume}  onChange={setMasterVolume} />
        <SliderRow label="Music"   value={musicVolume}   onChange={setMusicVolume} />
        <SliderRow label="Effects" value={sfxVolume}     onChange={setSfxVolume} />
        <SliderRow label="Ambient" value={ambientVolume} onChange={setAmbientVolume} />
      </div>

      <p className="audio-panel__hint">Press M or Esc to close</p>
    </div>
  )
}
