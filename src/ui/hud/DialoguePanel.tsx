/**
 * Phase 36 — Dialogue Panel
 *
 * Renders the NPC talk UI when a dialogue is active.
 *
 * Layout
 * ──────
 *  ┌─────────────────────────────────┐
 *  │ NPC Name                     ✕  │  ← header
 *  ├─────────────────────────────────┤
 *  │  "NPC speech text…"             │  ← speech bubble
 *  ├─────────────────────────────────┤
 *  │  [ Choice A ]  [ Choice B ]     │  ← player choices (buttons)
 *  └─────────────────────────────────┘
 *
 * Behaviour
 * ─────────
 *  - Full modal: backdrop blocks pointer-events; focus is trapped within the
 *    panel while it is open so keyboard users cannot tab into game HUD behind it.
 *  - Focus trap re-queries the panel on every node advance so newly rendered
 *    choice buttons are always included.
 *  - Closes on Escape or ✕.
 *  - Selecting a choice with nextNode navigates to that node.
 *  - Selecting a choice with nextNode === null closes the panel.
 *  - onSelect callbacks fire before navigation so side-effects (e.g. opening
 *    the shop) run immediately.
 *  - A synthesised "Farewell." choice is appended when a node has no choices
 *    defined, ensuring the player always has a way to close the panel.
 *  - Choice buttons use stable keys (label+nextNode) so React never reuses the
 *    wrong DOM node when the choice set changes between nodes.
 */

import { useCallback, useEffect, useRef } from 'react'
import { useDialogueStore } from '../../store/useDialogueStore'
import type { DialogueChoice } from '../../engine/dialogue'

const FAREWELL_CHOICE: DialogueChoice = {
  label: 'Farewell.',
  nextNode: null,
}

export function DialoguePanel() {
  const activeTree  = useDialogueStore((s) => s.activeTree)
  const currentNode = useDialogueStore((s) => s.currentNode)
  const advanceTo   = useDialogueStore((s) => s.advanceTo)
  const closeDialogue = useDialogueStore((s) => s.closeDialogue)

  const panelRef = useRef<HTMLDivElement>(null)

  const isOpen = activeTree !== null && currentNode !== null

  // Close on Escape.
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') closeDialogue()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, closeDialogue])

  // Focus trap: re-run whenever the active node changes (choice buttons are
  // replaced between nodes so the live focusable list must be refreshed).
  useEffect(() => {
    if (!isOpen) return

    const panel = panelRef.current
    if (!panel) return

    // Focus the first button in the panel each time a new node loads.
    const firstBtn = panel.querySelector<HTMLElement>('button')
    firstBtn?.focus()

    // Trap Tab / Shift-Tab inside the panel.
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      // Re-query on every Tab press so late-rendered elements are included.
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute('disabled'))
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentNode])

  const handleChoice = useCallback(
    (choice: DialogueChoice) => {
      // Fire optional side-effect (e.g. open shop, set quest flag).
      choice.onSelect?.()
      // Navigate or close.
      if (choice.nextNode === null) {
        closeDialogue()
      } else {
        advanceTo(choice.nextNode)
      }
    },
    [advanceTo, closeDialogue],
  )

  if (!isOpen) return null

  const choices = currentNode!.choices ?? [FAREWELL_CHOICE]
  const npcName = activeTree!.npcName

  return (
    <div
      className="dialogue-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`Talking with ${npcName}`}
    >
      <div className="dialogue-panel" ref={panelRef} tabIndex={-1}>
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="dialogue-panel__header">
          <div className="dialogue-panel__npc-identity">
            <span className="dialogue-panel__npc-name">{npcName}</span>
            {activeTree!.summary && (
              <span className="dialogue-panel__npc-summary">{activeTree!.summary}</span>
            )}
          </div>
          <button
            className="dialogue-panel__close"
            onClick={closeDialogue}
            aria-label="End conversation"
          >
            ✕
          </button>
        </div>

        {/* ── NPC speech ─────────────────────────────────────────────────────── */}
        <p className="dialogue-panel__speech" aria-live="polite">
          {currentNode!.text}
        </p>

        {/* ── Player choices ─────────────────────────────────────────────────── */}
        <div className="dialogue-panel__choices" role="group" aria-label="Your responses">
          {choices.map((choice) => (
            <button
              key={`${choice.label}|${choice.nextNode}`}
              className="dialogue-choice"
              onClick={() => handleChoice(choice)}
            >
              {choice.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
