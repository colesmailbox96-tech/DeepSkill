/**
 * Phase 43 — Tinkering Panel
 *
 * A bench-side crafting panel toggled when the player interacts with the
 * Tinkerer's Bench or presses T while near it.  All tinkering recipes are
 * shown in a single list; completed items are practical utility devices.
 *
 * Pressing T, Escape, or clicking ✕ closes the panel.
 */

import { useCallback, useEffect, useRef } from 'react'
import { useTinkeringStore } from '../../store/useTinkeringStore'
import { useGameStore } from '../../store/useGameStore'
import { getItem } from '../../data/items/itemRegistry'
import { getAllTinkerRecipes } from '../../engine/tinkering'
import type { TinkerRecipeConfig } from '../../engine/tinkering'

// ─── Recipe row ───────────────────────────────────────────────────────────

interface TinkerRecipeRowProps {
  recipe: TinkerRecipeConfig
  materialQty: number
  tinkeringLevel: number
  onTinker: (recipe: TinkerRecipeConfig) => void
}

function TinkerRecipeRow({ recipe, materialQty, tinkeringLevel, onTinker }: TinkerRecipeRowProps) {
  const outputDef    = getItem(recipe.outputId)
  const materialDef  = getItem(recipe.materialId)
  const outputName   = outputDef?.name   ?? recipe.outputId
  const materialName = materialDef?.name ?? recipe.materialId
  const meetsLevel   = tinkeringLevel >= recipe.levelReq
  const hasMaterial  = materialQty >= recipe.materialQty
  const canTinker    = meetsLevel && hasMaterial

  return (
    <li className={`tinkering-recipe${canTinker ? '' : ' tinkering-recipe--locked'}`}>
      <div className="tinkering-recipe__top">
        <span className="tinkering-recipe__name">
          {materialName} ×{recipe.materialQty}
          <span className="tinkering-recipe__arrow"> → </span>
          {outputName}
        </span>
        {!meetsLevel && (
          <span className="tinkering-recipe__lock-badge">Tinkering {recipe.levelReq} req</span>
        )}
      </div>
      <div className="tinkering-recipe__meta">
        <span>Lvl {recipe.levelReq}</span>
        <span>·</span>
        <span>{recipe.xp} XP</span>
        <span>·</span>
        <span>{recipe.tinkerDuration} s</span>
      </div>
      <div className="tinkering-recipe__bottom">
        <span className={`tinkering-recipe__count${hasMaterial ? '' : ' tinkering-recipe__count--low'}`}>
          In bag: {materialQty}
        </span>
        <button
          className="tinkering-recipe__btn"
          disabled={!canTinker}
          onClick={() => onTinker(recipe)}
          aria-label={`Assemble ${outputName}`}
        >
          Assemble
        </button>
      </div>
    </li>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────

interface TinkeringPanelProps {
  /** Called when the player activates an assembly from this panel. */
  onTinker: (recipe: TinkerRecipeConfig) => void
}

export function TinkeringPanel({ onTinker }: TinkeringPanelProps) {
  const isOpen     = useTinkeringStore((s) => s.isOpen)
  const closePanel = useTinkeringStore((s) => s.closePanel)
  const slots      = useGameStore((s) => s.inventory.slots)
  const tinkeringLevel = useGameStore(
    (s) => s.skills.skills.find((sk) => sk.id === 'tinkering')?.level ?? 1,
  )

  const isOpenRef = useRef(false)
  isOpenRef.current = isOpen
  const panelRef = useRef<HTMLDivElement>(null)

  const handleClose = useCallback(() => closePanel(), [closePanel])

  // Escape closes the panel; T toggle is handled exclusively in App.tsx.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (e.code === 'Escape' && isOpenRef.current) {
        handleClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleClose])

  // Focus panel on open.
  useEffect(() => {
    if (isOpen) panelRef.current?.focus()
  }, [isOpen])

  if (!isOpen) return null

  const recipes = getAllTinkerRecipes()

  const getMaterialQty = (materialId: string): number =>
    slots.find((s) => s.id === materialId)?.quantity ?? 0

  return (
    <div
      ref={panelRef}
      className="tinkering-panel"
      role="dialog"
      aria-modal="false"
      aria-label="Tinkerer's Bench — Tinkering"
      tabIndex={-1}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="tinkering-panel__header">
        <span className="tinkering-panel__title">Tinkerer's Bench · Tinkering</span>
        <span className="tinkering-panel__level">Tinkering lvl {tinkeringLevel}</span>
        <button
          className="tinkering-panel__close"
          onClick={handleClose}
          aria-label="Close tinkering panel"
        >
          ✕
        </button>
      </div>

      {/* ── Recipe list ────────────────────────────────────────────────── */}
      <ul className="tinkering-panel__list" role="list">
        {recipes.map((recipe) => (
          <TinkerRecipeRow
            key={recipe.outputId}
            recipe={recipe}
            materialQty={getMaterialQty(recipe.materialId)}
            tinkeringLevel={tinkeringLevel}
            onTinker={onTinker}
          />
        ))}
      </ul>

      <p className="tinkering-panel__hint">Press T or Esc to close</p>
    </div>
  )
}
