/**
 * Phase 40 — Smithing Panel
 * Phase 41 — Tool Upgrade Recipes (Forge tab)
 *
 * A furnace-side crafting panel toggled when the player interacts with the
 * Furnace station or presses F while near it.  Two tabs are shown:
 *
 *   Smelt — ore → bar recipes (Phase 40)
 *   Forge — bar + materials → upgraded tools (Phase 41)
 *
 * Pressing F, Escape, or clicking ✕ closes the panel.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSmithingStore } from '../../store/useSmithingStore'
import { useGameStore } from '../../store/useGameStore'
import { getItem } from '../../data/items/itemRegistry'
import { getAllSmeltRecipes, getAllForgeRecipes } from '../../engine/smithing'
import type { SmeltRecipeConfig, ForgeRecipeConfig } from '../../engine/smithing'

// ─── Smelt recipe row ─────────────────────────────────────────────────────

interface RecipeRowProps {
  recipe: SmeltRecipeConfig
  oreQty: number
  forgingLevel: number
  onSmelt: (recipe: SmeltRecipeConfig) => void
}

function RecipeRow({ recipe, oreQty, forgingLevel, onSmelt }: RecipeRowProps) {
  const barDef  = getItem(recipe.barId)
  const oreDef  = getItem(recipe.oreId)
  const barName = barDef?.name  ?? recipe.barId
  const oreName = oreDef?.name  ?? recipe.oreId
  const meetsLevel = forgingLevel >= recipe.levelReq
  const hasOre     = oreQty >= recipe.oreQty
  const canSmelt   = meetsLevel && hasOre

  return (
    <li className={`smithing-recipe${canSmelt ? '' : ' smithing-recipe--locked'}`}>
      <div className="smithing-recipe__top">
        <span className="smithing-recipe__name">
          {oreName} ×{recipe.oreQty}
          <span className="smithing-recipe__arrow"> → </span>
          {barName}
        </span>
        {!meetsLevel && (
          <span className="smithing-recipe__lock-badge">Forging {recipe.levelReq} req</span>
        )}
      </div>
      <div className="smithing-recipe__meta">
        <span>Lvl {recipe.levelReq}</span>
        <span>·</span>
        <span>{recipe.xp} XP</span>
        <span>·</span>
        <span>{recipe.smeltDuration} s</span>
      </div>
      <div className="smithing-recipe__bottom">
        <span className={`smithing-recipe__count${hasOre ? '' : ' smithing-recipe__count--low'}`}>
          In bag: {oreQty}
        </span>
        <button
          className="smithing-recipe__btn"
          disabled={!canSmelt}
          onClick={() => onSmelt(recipe)}
          aria-label={`Smelt ${barName}`}
        >
          Smelt
        </button>
      </div>
    </li>
  )
}

// ─── Forge recipe row ─────────────────────────────────────────────────────

interface ForgeRecipeRowProps {
  recipe: ForgeRecipeConfig
  slots: ReadonlyArray<{ id: string; quantity: number }>
  forgingLevel: number
  gatherLevel: number
  onForge: (recipe: ForgeRecipeConfig) => void
}

function ForgeRecipeRow({ recipe, slots, forgingLevel, gatherLevel, onForge }: ForgeRecipeRowProps) {
  const toolDef    = getItem(recipe.toolId)
  const toolName   = toolDef?.name ?? recipe.toolId
  const meetsForging  = forgingLevel  >= recipe.forgingLevelReq
  const meetsGather   = gatherLevel   >= recipe.skillReq.level
  const meetsLevels   = meetsForging && meetsGather
  const hasIngredients = recipe.ingredients.every((ing) => {
    const slot = slots.find((s) => s.id === ing.id)
    return slot != null && slot.quantity >= ing.qty
  })
  const canForge = meetsLevels && hasIngredients
  const skillLabel = recipe.skillReq.skill.charAt(0).toUpperCase() + recipe.skillReq.skill.slice(1)

  return (
    <li className={`smithing-recipe${canForge ? '' : ' smithing-recipe--locked'}`}>
      <div className="smithing-recipe__top">
        <span className="smithing-recipe__name">
          {recipe.ingredients.map((ing, i) => (
            <span key={ing.id}>
              {i > 0 && <span className="smithing-recipe__plus"> + </span>}
              {ing.label} ×{ing.qty}
            </span>
          ))}
          <span className="smithing-recipe__arrow"> → </span>
          {toolName}
        </span>
        {!meetsLevels && (
          <span className="smithing-recipe__lock-badge">
            {!meetsForging ? `Forging ${recipe.forgingLevelReq}` : `${skillLabel} ${recipe.skillReq.level}`} req
          </span>
        )}
      </div>
      <div className="smithing-recipe__meta">
        <span>Forging {recipe.forgingLevelReq}</span>
        <span>·</span>
        <span>{skillLabel} {recipe.skillReq.level}</span>
        <span>·</span>
        <span>{recipe.xp} XP</span>
        <span>·</span>
        <span>{recipe.forgeDuration} s</span>
      </div>
      <div className="smithing-recipe__bottom">
        <span className={`smithing-recipe__ingredient-list${hasIngredients ? '' : ' smithing-recipe__count--low'}`}>
          {recipe.ingredients.map((ing) => {
            const have = slots.find((s) => s.id === ing.id)?.quantity ?? 0
            return (
              <span key={ing.id} className={have >= ing.qty ? '' : 'smithing-recipe__count--low'}>
                {ing.label}: {have}/{ing.qty}
              </span>
            )
          })}
        </span>
        <button
          className="smithing-recipe__btn"
          disabled={!canForge}
          onClick={() => onForge(recipe)}
          aria-label={`Forge ${toolName}`}
        >
          Forge
        </button>
      </div>
    </li>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────

type SmithingTab = 'smelt' | 'forge'

interface SmithingPanelProps {
  /** Called when the player activates a smelt from this panel. */
  onSmelt: (recipe: SmeltRecipeConfig) => void
  /** Called when the player activates a tool forge from this panel. */
  onForge: (recipe: ForgeRecipeConfig) => void
}

export function SmithingPanel({ onSmelt, onForge }: SmithingPanelProps) {
  const isOpen     = useSmithingStore((s) => s.isOpen)
  const closePanel = useSmithingStore((s) => s.closePanel)
  const slots      = useGameStore((s) => s.inventory.slots)
  // Subscribe to forging skill so the panel re-renders when level changes.
  const forgingLevel = useGameStore(
    (s) => s.skills.skills.find((sk) => sk.id === 'forging')?.level ?? 1,
  )
  // Subscribe to the raw skills array; build an id→level map only when it changes.
  const skills = useGameStore((s) => s.skills.skills)
  const skillLevels = useMemo(
    () => Object.fromEntries(skills.map((sk) => [sk.id, sk.level])),
    [skills],
  )

  const [activeTab, setActiveTab] = useState<SmithingTab>('smelt')

  const isOpenRef = useRef(false)
  isOpenRef.current = isOpen
  const panelRef = useRef<HTMLDivElement>(null)

  const handleClose = useCallback(() => closePanel(), [closePanel])

  // F key or Escape closes the panel; F opening is handled in App.tsx.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      if ((e.code === 'KeyF' || e.code === 'Escape') && isOpenRef.current) {
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

  const smeltRecipes = getAllSmeltRecipes()
  const forgeRecipes = getAllForgeRecipes()

  const getOreQty = (oreId: string): number =>
    slots.find((s) => s.id === oreId)?.quantity ?? 0

  // Look up gather skill level from the subscribed skillLevels map.
  const getGatherLevel = (skillId: string): number => skillLevels[skillId] ?? 1

  return (
    <div
      ref={panelRef}
      className="smithing-panel"
      role="dialog"
      aria-modal="false"
      aria-label="Furnace — Smithing"
      tabIndex={-1}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="smithing-panel__header">
        <span className="smithing-panel__title">Furnace · Smithing</span>
        <span className="smithing-panel__level">Forging lvl {forgingLevel}</span>
        <button
          className="smithing-panel__close"
          onClick={handleClose}
          aria-label="Close smithing panel"
        >
          ✕
        </button>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <div className="smithing-panel__tabs" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'smelt'}
          className={`smithing-panel__tab${activeTab === 'smelt' ? ' smithing-panel__tab--active' : ''}`}
          onClick={() => setActiveTab('smelt')}
        >
          Smelt
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'forge'}
          className={`smithing-panel__tab${activeTab === 'forge' ? ' smithing-panel__tab--active' : ''}`}
          onClick={() => setActiveTab('forge')}
        >
          Forge Tools
        </button>
      </div>

      {/* ── Recipe list ────────────────────────────────────────────────── */}
      {activeTab === 'smelt' && (
        <ul className="smithing-panel__list" role="list">
          {smeltRecipes.map((recipe) => (
            <RecipeRow
              key={recipe.oreId}
              recipe={recipe}
              oreQty={getOreQty(recipe.oreId)}
              forgingLevel={forgingLevel}
              onSmelt={onSmelt}
            />
          ))}
        </ul>
      )}

      {activeTab === 'forge' && (
        <ul className="smithing-panel__list" role="list">
          {forgeRecipes.map((recipe) => (
            <ForgeRecipeRow
              key={recipe.toolId}
              recipe={recipe}
              slots={slots}
              forgingLevel={forgingLevel}
              gatherLevel={getGatherLevel(recipe.skillReq.skill)}
              onForge={onForge}
            />
          ))}
        </ul>
      )}

      <p className="smithing-panel__hint">Press F or Esc to close</p>
    </div>
  )
}
