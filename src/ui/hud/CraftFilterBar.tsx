/**
 * Phase 70 — Crafting Panel UX Pass
 *
 * Shared filter/sort bar used by every crafting panel.  Provides:
 *   - "Craftable only" toggle that hides recipes the player cannot currently make.
 *   - Sort mode buttons: sort by level requirement or alphabetically by name.
 *   - A "X / Y craftable" counter showing how many of the panel's recipes are
 *     immediately available.
 *
 * Also exports `RecipeOutputPreview`, a shared component that renders an item's
 * stats and flavour description below the recipe ingredients row.
 */

import type { ItemDefinition } from '../../data/items/itemSchema'

// ── Filter/sort bar ──────────────────────────────────────────────────────────

export type CraftSortMode = 'level' | 'name'

interface CraftFilterBarProps {
  craftableOnly: boolean
  sortMode: CraftSortMode
  onToggleCraftable: () => void
  onSetSort: (mode: CraftSortMode) => void
  craftableCount: number
  totalCount: number
}

export function CraftFilterBar({
  craftableOnly,
  sortMode,
  onToggleCraftable,
  onSetSort,
  craftableCount,
  totalCount,
}: CraftFilterBarProps) {
  return (
    <div className="craft-filter-bar" role="toolbar" aria-label="Recipe filters">
      <button
        className={`craft-filter-bar__toggle${craftableOnly ? ' craft-filter-bar__toggle--active' : ''}`}
        onClick={onToggleCraftable}
        aria-pressed={craftableOnly}
        title={craftableOnly ? 'Showing craftable recipes only — click to show all' : 'Click to show only craftable recipes'}
      >
        {craftableOnly ? '✓ Craftable' : 'All'}
      </button>

      <span className="craft-filter-bar__count" aria-live="polite">
        {craftableCount}/{totalCount} ready
      </span>

      <div className="craft-filter-bar__sort" role="group" aria-label="Sort recipes">
        <button
          className={`craft-filter-bar__sort-btn${sortMode === 'level' ? ' craft-filter-bar__sort-btn--active' : ''}`}
          onClick={() => onSetSort('level')}
          aria-pressed={sortMode === 'level'}
          title="Sort by level requirement"
        >
          Lvl
        </button>
        <button
          className={`craft-filter-bar__sort-btn${sortMode === 'name' ? ' craft-filter-bar__sort-btn--active' : ''}`}
          onClick={() => onSetSort('name')}
          aria-pressed={sortMode === 'name'}
          title="Sort alphabetically"
        >
          A–Z
        </button>
      </div>
    </div>
  )
}

// ── Output preview ────────────────────────────────────────────────────────────

interface RecipeOutputPreviewProps {
  outputDef: ItemDefinition | undefined
}

/**
 * Displays the output item's flavour description and numeric stats.
 * Returns null when the item definition is missing or has no useful stats.
 */
export function RecipeOutputPreview({ outputDef }: RecipeOutputPreviewProps) {
  if (!outputDef) return null

  const stats: string[] = []

  const e = outputDef.equipMeta
  if (e) {
    if (e.attackBonus)  stats.push(`+${e.attackBonus} Atk`)
    if (e.defenceBonus) stats.push(`+${e.defenceBonus} Def`)
    if (e.rangeBonus)   stats.push(`+${e.rangeBonus} Rng`)
    if (e.attackSpeed != null && e.attackSpeed !== 1)
      stats.push(`${e.attackSpeed}× Spd`)
  }

  const c = outputDef.consumableMeta
  if (c) {
    if (c.healsHp)           stats.push(`+${c.healsHp} HP`)
    if (c.restoresStamina)   stats.push(`+${c.restoresStamina} Stam`)
    if (c.buffAttack && c.duration)
      stats.push(`+${c.buffAttack} Atk ${c.duration}s`)
  }

  if (outputDef.toolMeta) {
    stats.push(`Tier ${outputDef.toolMeta.tier}`)
  }

  return (
    <div className="craft-preview">
      <span className="craft-preview__desc">{outputDef.description}</span>
      {stats.length > 0 && (
        <span className="craft-preview__stats">{stats.join(' · ')}</span>
      )}
    </div>
  )
}
