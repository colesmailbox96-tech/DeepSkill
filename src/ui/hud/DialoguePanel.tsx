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
 *  - Closes on Escape or ✕.
 *  - Selecting a choice with nextNode navigates to that node.
 *  - Selecting a choice with nextNode === null closes the panel.
 *  - onSelect callbacks fire before navigation so side-effects (e.g. opening
 *    the shop) run immediately.
 *  - A synthesised "Farewell." choice is appended when a node has no choices
 *    defined, ensuring the player always has a way to close the panel.
 *  - Focus is set to the panel container on open so keyboard users can
 *    immediately tab to the first choice button.
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

  // Focus panel container on open so keyboard users can tab to choices.
  useEffect(() => {
    if (isOpen) panelRef.current?.focus()
  }, [isOpen])

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
      className="dialogue-panel"
      role="dialog"
      aria-modal="true"
      aria-label={`Talking with ${npcName}`}
      ref={panelRef}
      tabIndex={-1}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="dialogue-panel__header">
        <span className="dialogue-panel__npc-name">{npcName}</span>
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
        {choices.map((choice, i) => (
          <button
            key={i}
            className="dialogue-choice"
            onClick={() => handleChoice(choice)}
          >
            {choice.label}
          </button>
        ))}
      </div>
    </div>
  )
}
