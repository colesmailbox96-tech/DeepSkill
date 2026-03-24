/**
 * Phase 39 — Journal Panel
 *
 * A full-featured task journal toggled with the J key.  Displays active and
 * completed tasks with their objective breakdowns, reward previews, and the
 * narrative journal entry written by the task giver.
 *
 * Layout
 * ──────
 *  ┌─────────────────────────────────────────────────────────────┐
 *  │ Journal                     [3 active · 1 complete]     [✕] │
 *  ├──────────────┬──────────────────────────────────────────────┤
 *  │ Task list    │  Task detail                                  │
 *  │  ▸ Task A   │   Title                         [Active]      │
 *  │  ▸ Task B   │   Given by: NPC                               │
 *  │  ─ Task C ✓ │   Description paragraph                       │
 *  │             │   ── Objectives ──────────────────────────    │
 *  │             │    ▸ Objective text         2 / 5             │
 *  │             │    ▸ Done objective     ✓ (struck)            │
 *  │             │   ── Rewards ─────────────────────────────    │
 *  │             │    ⬡ 15 Marks  ·  +30 Woodcutting XP         │
 *  │             │   ── Journal Entry ───────────────────────    │
 *  │             │    Narrative text…                            │
 *  └─────────────┴──────────────────────────────────────────────┘
 *
 * Behaviour
 * ─────────
 *  - J key (or press [J] shown in the hint) toggles open/closed.
 *  - Escape closes the panel.
 *  - Selecting a task in the sidebar shows its full detail on the right.
 *  - Active tasks are listed first; completed tasks are listed below a divider.
 *  - Completed tasks show a ✓ badge and greyed-out objectives.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { TaskDefinition } from '../../engine/task'
import { getTask } from '../../engine/task'
import { CURRENCY_NAME, CURRENCY_PLURAL, CURRENCY_SYMBOL } from '../../engine/economy'
import { getItem } from '../../data/items/itemRegistry'
import { getFaction } from '../../data/factions/factionRegistry'
import type { TaskRecord } from '../../store/useTaskStore'
import { useTaskStore } from '../../store/useTaskStore'
import { audioManager } from '../../engine/audio'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCoins(amount: number): string {
  return `${CURRENCY_SYMBOL} ${amount} ${amount === 1 ? CURRENCY_NAME : CURRENCY_PLURAL}`
}

function formatXpLabel(skill: string): string {
  return skill.charAt(0).toUpperCase() + skill.slice(1)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface TaskDetailProps {
  record: TaskRecord
  def: TaskDefinition
  isCompleted: boolean
}

function TaskDetail({ record, def, isCompleted }: TaskDetailProps) {
  return (
    <div className="journal-detail">
      {/* Header */}
      <div className="journal-detail__header">
        <span className="journal-detail__title">{def.title}</span>
        <span
          className={
            isCompleted
              ? 'journal-detail__badge journal-detail__badge--done'
              : 'journal-detail__badge journal-detail__badge--active'
          }
        >
          {isCompleted ? 'Completed' : 'Active'}
        </span>
      </div>

      <div className="journal-detail__giver">Given by: {def.giverName}</div>

      <p className="journal-detail__desc">{def.description}</p>

      {/* Objectives */}
      <div className="journal-detail__section-label">Objectives</div>
      <ul className="journal-detail__objectives" aria-label={`Objectives for ${def.title}`}>
        {def.objectives.map((obj) => {
          const current = record.progress[obj.id] ?? 0
          const done = current >= obj.required
          return (
            <li
              key={obj.id}
              className={`journal-detail__obj${done ? ' journal-detail__obj--done' : ''}`}
              aria-label={`${obj.description}: ${current} of ${obj.required}${done ? ', complete' : ''}`}
            >
              <span className="journal-detail__obj-bullet" aria-hidden>
                {done ? '✓' : '▸'}
              </span>
              <span className="journal-detail__obj-text">{obj.description}</span>
              {obj.required > 1 && !done && (
                <span className="journal-detail__obj-count">
                  {current} / {obj.required}
                </span>
              )}
            </li>
          )
        })}
      </ul>

      {/* Rewards */}
      <div className="journal-detail__section-label">Rewards</div>
      <div className="journal-detail__rewards">
        {def.reward.coins != null && def.reward.coins > 0 && (
          <span className="journal-detail__reward-chip journal-detail__reward-chip--coins">
            {formatCoins(def.reward.coins)}
          </span>
        )}
        {def.reward.xp?.map((xpR) => (
          <span
            key={xpR.skill}
            className="journal-detail__reward-chip journal-detail__reward-chip--xp"
          >
            +{xpR.amount} {formatXpLabel(xpR.skill)} XP
          </span>
        ))}
        {def.reward.items?.map((itemR) => {
          const itemDef = getItem(itemR.itemId)
          const label = itemDef?.name ?? itemR.itemId
          return (
            <span
              key={itemR.itemId}
              className="journal-detail__reward-chip journal-detail__reward-chip--item"
            >
              {itemR.qty > 1 ? `${itemR.qty}× ` : ''}{label}
            </span>
          )
        })}
        {def.reward.factionRep?.map((fr) => {
          const factionDef = getFaction(fr.factionId)
          const factionLabel = factionDef?.name ?? fr.factionId
          return (
            <span
              key={fr.factionId}
              className="journal-detail__reward-chip journal-detail__reward-chip--faction"
              title={factionLabel}
            >
              +{fr.amount} {factionLabel} rep
            </span>
          )
        })}
      </div>

      {/* Journal Entry */}
      {def.journalEntry && (
        <>
          <div className="journal-detail__section-label">Journal Entry</div>
          <p className="journal-detail__entry">{def.journalEntry}</p>
        </>
      )}
    </div>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function JournalPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const isOpenRef = useRef(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const active = useTaskStore((s) => s.active)
  const completed = useTaskStore((s) => s.completed)

  const handleClose = useCallback(() => {
    isOpenRef.current = false
    setIsOpen(false)
  }, [])

  // J key toggles; Escape closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (e.code === 'KeyJ') {
        const next = !isOpenRef.current
        isOpenRef.current = next
        setIsOpen(next)
        audioManager.playSfx(next ? 'ui_open' : 'ui_close')
      } else if (e.code === 'Escape' && isOpenRef.current) {
        handleClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleClose])

  // Auto-select first task when opening or when active list changes.
  useEffect(() => {
    if (!isOpen) return
    const allRecords = [...active, ...completed]
    if (allRecords.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedTaskId(null)
      return
    }
    // Keep selection if it's still valid; otherwise pick the first task.
    const stillValid = allRecords.some((r) => r.taskId === selectedTaskId)
    if (!stillValid) {
      setSelectedTaskId(allRecords[0].taskId)
    }
  }, [isOpen, active, completed, selectedTaskId])

  // Focus the panel when it opens.
  useEffect(() => {
    if (isOpen) panelRef.current?.focus()
  }, [isOpen])

  if (!isOpen) return null

  const allRecords = [...active, ...completed]
  const completedIds = new Set(completed.map((r) => r.taskId))

  const selectedRecord = allRecords.find((r) => r.taskId === selectedTaskId) ?? null
  const selectedDef = selectedRecord ? getTask(selectedRecord.taskId) : null

  return (
    <div
      ref={panelRef}
      className="journal-panel"
      role="dialog"
      aria-modal="false"
      aria-label="Task Journal"
      tabIndex={-1}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="journal-panel__header">
        <span className="journal-panel__title">Journal</span>
        <span className="journal-panel__counts">
          {active.length} active · {completed.length} complete
        </span>
        <button
          className="journal-panel__close"
          onClick={handleClose}
          aria-label="Close journal"
        >
          ✕
        </button>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="journal-panel__body">
        {/* Sidebar — task list */}
        <nav className="journal-sidebar" aria-label="Task list">
          {allRecords.length === 0 ? (
            <div className="journal-sidebar__empty">No tasks yet.</div>
          ) : (
            <>
              {active.length > 0 && (
                <>
                  <div className="journal-sidebar__group-label">Active</div>
                  <ul className="journal-sidebar__list" role="list">
                    {active.map((record) => {
                      const def = getTask(record.taskId)
                      if (!def) return null
                      const isSelected = selectedTaskId === record.taskId
                      return (
                        <li key={record.taskId} role="listitem">
                          <button
                            className={`journal-sidebar__item${isSelected ? ' journal-sidebar__item--selected' : ''}`}
                            onClick={() => setSelectedTaskId(record.taskId)}
                            aria-selected={isSelected}
                          >
                            <span className="journal-sidebar__item-icon" aria-hidden>▸</span>
                            <span className="journal-sidebar__item-title">{def.title}</span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </>
              )}

              {completed.length > 0 && (
                <>
                  <div className="journal-sidebar__group-label journal-sidebar__group-label--done">
                    Completed
                  </div>
                  <ul className="journal-sidebar__list" role="list">
                    {completed.map((record) => {
                      const def = getTask(record.taskId)
                      if (!def) return null
                      const isSelected = selectedTaskId === record.taskId
                      return (
                        <li key={record.taskId} role="listitem">
                          <button
                            className={`journal-sidebar__item journal-sidebar__item--done${isSelected ? ' journal-sidebar__item--selected' : ''}`}
                            onClick={() => setSelectedTaskId(record.taskId)}
                            aria-selected={isSelected}
                          >
                            <span className="journal-sidebar__item-icon" aria-hidden>✓</span>
                            <span className="journal-sidebar__item-title">{def.title}</span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </>
              )}
            </>
          )}
        </nav>

        {/* Detail pane */}
        <div className="journal-detail-pane">
          {selectedRecord && selectedDef ? (
            <TaskDetail
              record={selectedRecord}
              def={selectedDef}
              isCompleted={completedIds.has(selectedRecord.taskId)}
            />
          ) : (
            <div className="journal-detail-pane__empty">
              {allRecords.length === 0
                ? 'Accept a task from a settler to begin tracking your progress here.'
                : 'Select a task from the list.'}
            </div>
          )}
        </div>
      </div>

      {/* ── Hotkey hint ──────────────────────────────────────────────────── */}
      <div className="journal-panel__hint">[J] toggle · [Esc] close</div>
    </div>
  )
}
