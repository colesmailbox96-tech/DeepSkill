/**
 * Phase 51 — Main Menu Screen
 * Phase 100 — RC build label wired in.
 *
 * Full-screen title overlay shown on boot.  Presents three choices:
 *
 *   • Continue  — loads the existing save snapshot and starts play
 *                 (disabled / hidden when no save exists).
 *   • New Game  — clears any existing save, resets game state to defaults,
 *                 and starts a fresh session.
 *   • Settings  — opens the Audio Settings panel in-place so the player
 *                 can adjust volume before entering the world.
 *
 * The component is purely presentational — all side-effects (loading,
 * resetting, opening sub-panels) are invoked via props passed from App.tsx.
 */
import { useEffect, useRef } from 'react'
import { useAudioStore } from '../../store/useAudioStore'
import { RC_BUILD_LABEL } from '../../engine/releaseCandidate'

// ─── Props ────────────────────────────────────────────────────────────────────

export interface MainMenuScreenProps {
  /** Whether there is existing save data the player can continue from. */
  hasSave: boolean
  /** Called when the player clicks "Continue". */
  onContinue: () => void
  /** Called when the player clicks "New Game". */
  onNewGame: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MainMenuScreen({ hasSave, onContinue, onNewGame }: MainMenuScreenProps) {
  const toggleAudio = useAudioStore((s) => s.togglePanel)

  // Focus the primary action button on mount so keyboard navigation works
  // immediately without the player having to click first.
  const primaryBtnRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    primaryBtnRef.current?.focus()
  }, [])

  // Allow Enter / Space on the focused button (browser default for <button>),
  // and let Escape dismiss the settings panel if it is open.
  // No extra key-binding is needed here — the AudioSettingsPanel handles its
  // own Escape listener.

  return (
    <div className="main-menu" role="dialog" aria-modal="true" aria-label="Main Menu">
      {/* ── Background gradient layer ──────────────────────────────────── */}
      <div className="main-menu__backdrop" aria-hidden="true" />

      {/* ── Title card ────────────────────────────────────────────────── */}
      <div className="main-menu__card">
        <div className="main-menu__logo">
          <h1 className="main-menu__title">Veilmarch</h1>
          <p className="main-menu__subtitle">An open-world crafting RPG</p>
          <span className="main-menu__build-badge">{RC_BUILD_LABEL}</span>
        </div>

        {/* ── Navigation buttons ──────────────────────────────────────── */}
        <nav className="main-menu__nav" aria-label="Main menu actions">
          {hasSave && (
            <button
              ref={primaryBtnRef}
              className="main-menu__btn main-menu__btn--continue"
              onClick={onContinue}
              aria-label="Continue your saved adventure"
            >
              ▶ Continue
            </button>
          )}

          <button
            ref={hasSave ? undefined : primaryBtnRef}
            className="main-menu__btn main-menu__btn--new"
            onClick={onNewGame}
            aria-label={hasSave ? 'Start a new game (overwrites save)' : 'Start a new game'}
          >
            {hasSave ? '✦ New Game' : '✦ Start Game'}
          </button>

          <button
            className="main-menu__btn main-menu__btn--settings"
            onClick={toggleAudio}
            aria-label="Open audio settings"
          >
            ⚙ Settings
          </button>
        </nav>

        <p className="main-menu__hint">
          WASD / joystick to move · E to interact · tap or click creature to target · I for inventory
        </p>
      </div>
    </div>
  )
}
