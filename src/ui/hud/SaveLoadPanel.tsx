/**
 * Phase 50 — Save / Load Panel
 *
 * A floating panel toggled with the P key that lets the player manually save
 * progress, see when the game was last saved, and optionally wipe save data.
 * Auto-saves run in the background every 60 s via App.tsx — this panel gives
 * the player explicit control on top of that.
 *
 * Accessible from anywhere — no proximity to a station is required.
 */
import { useCallback, useEffect, useRef } from 'react'
import { useSaveLoadStore } from '../../store/useSaveLoadStore'
import { useSaveGame, useLoadGame, clearSaveData } from '../../store/useSaveLoad'

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatTimestamp(ms: number): string {
  const d = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function SaveLoadPanel() {
  const isOpen      = useSaveLoadStore((s) => s.isOpen)
  const closePanel  = useSaveLoadStore((s) => s.closePanel)
  const lastSavedAt = useSaveLoadStore((s) => s.lastSavedAt)
  const hasSave     = useSaveLoadStore((s) => s.hasSave)
  const notifySaved  = useSaveLoadStore((s) => s.notifySaved)
  const notifyCleared = useSaveLoadStore((s) => s.notifyCleared)

  const saveGame = useSaveGame()
  const loadGame = useLoadGame()

  const isOpenRef = useRef(false)
  useEffect(() => { isOpenRef.current = isOpen }, [isOpen])

  const panelRef = useRef<HTMLDivElement>(null)

  const handleClose = useCallback(() => closePanel(), [closePanel])

  const handleSave = useCallback(() => {
    saveGame()
    notifySaved()
  }, [saveGame, notifySaved])

  const handleLoad = useCallback(() => {
    loadGame()
    closePanel()
  }, [loadGame, closePanel])

  const handleClear = useCallback(() => {
    clearSaveData()
    notifyCleared()
  }, [notifyCleared])

  // Escape closes the panel; P toggle is handled in App.tsx.
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
      className="save-panel"
      role="dialog"
      aria-modal="false"
      aria-label="Save &amp; Load"
      tabIndex={-1}
    >
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="save-panel__header">
        <span className="save-panel__title">💾 Save &amp; Load</span>
        <button
          className="save-panel__close"
          onClick={handleClose}
          aria-label="Close save panel"
        >
          ✕
        </button>
      </div>

      {/* ── Status ────────────────────────────────────────────────────── */}
      <div className="save-panel__status">
        {lastSavedAt !== null
          ? <span className="save-panel__status--saved">✔ Saved at {formatTimestamp(lastSavedAt)}</span>
          : hasSave
            ? <span className="save-panel__status--exists">Save data found</span>
            : <span className="save-panel__status--none">No save data</span>
        }
      </div>

      {/* ── Actions ───────────────────────────────────────────────────── */}
      <div className="save-panel__body">
        <button
          className="save-panel__btn save-panel__btn--save"
          onClick={handleSave}
          aria-label="Save progress"
        >
          💾 Save Progress
        </button>

        <button
          className="save-panel__btn save-panel__btn--load"
          onClick={handleLoad}
          disabled={!hasSave}
          aria-label="Load progress"
          aria-disabled={!hasSave}
        >
          📂 Load Progress
        </button>

        {hasSave && (
          <button
            className="save-panel__btn save-panel__btn--clear"
            onClick={handleClear}
            aria-label="Delete save data"
          >
            🗑 Delete Save
          </button>
        )}
      </div>

      <p className="save-panel__hint">
        Auto-saved every 60 sec · Press P or Esc to close
      </p>
    </div>
  )
}
