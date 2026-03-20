/**
 * Phase 37 — Task Tracker HUD
 *
 * A small overlay panel (bottom-right corner) that displays the player's
 * active tasks and their objective progress.  Hidden when there are no
 * active tasks.
 *
 * Layout (per task)
 * ─────────────────
 *  ┌──────────────────────────────────┐
 *  │ Task Title              [giver]  │  ← header
 *  │  ▸ Objective text   0 / 1        │  ← objective row
 *  │  ▸ …                             │
 *  └──────────────────────────────────┘
 *
 * Behaviour
 * ─────────
 *  - Renders all active tasks from useTaskStore.
 *  - Each objective row shows current / required progress.
 *  - A completed objective is struck through and shown in muted colour.
 *  - At most 3 tasks are shown simultaneously; excess tasks are hidden with
 *    a "+N more" indicator to keep the overlay compact.
 *  - Pointer-events are re-enabled on the panel so players can read it on
 *    touch devices (scroll if needed) but the default HUD overlay has
 *    pointer-events:none so the 3-D canvas remains fully interactive behind
 *    any empty space.
 */

import { useTaskStore } from '../../store/useTaskStore'
import { getTask } from '../../engine/task'

/** Maximum number of tasks shown before the "+N more" overflow hint. */
const MAX_VISIBLE_TASKS = 3

export function TaskTrackerHud() {
  const active = useTaskStore((s) => s.active)

  if (active.length === 0) return null

  const visible = active.slice(0, MAX_VISIBLE_TASKS)
  const overflow = active.length - visible.length

  return (
    <div className="task-tracker" aria-label="Active tasks">
      <div className="task-tracker__heading">Active Tasks</div>

      {visible.map((record) => {
        const def = getTask(record.taskId)
        if (!def) return null

        return (
          <div key={record.taskId} className="task-tracker__task">
            {/* Task header */}
            <div className="task-tracker__task-title">
              <span className="task-tracker__task-name">{def.title}</span>
              <span className="task-tracker__task-giver">{def.giverName}</span>
            </div>

            {/* Objectives */}
            <ul className="task-tracker__objectives" aria-label={`Objectives for ${def.title}`}>
              {def.objectives.map((obj) => {
                const current = record.progress[obj.id] ?? 0
                const done = current >= obj.required
                return (
                  <li
                    key={obj.id}
                    className={`task-tracker__obj${done ? ' task-tracker__obj--done' : ''}`}
                    aria-label={`${obj.description}: ${current} of ${obj.required}`}
                  >
                    <span className="task-tracker__obj-text">{obj.description}</span>
                    {obj.required > 1 && (
                      <span className="task-tracker__obj-count">
                        {current} / {obj.required}
                      </span>
                    )}
                    {done && <span className="task-tracker__obj-check" aria-hidden>✓</span>}
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}

      {overflow > 0 && (
        <div className="task-tracker__overflow" aria-label={`${overflow} more tasks not shown`}>
          +{overflow} more
        </div>
      )}
    </div>
  )
}
