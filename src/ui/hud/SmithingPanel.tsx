/**
 * Phase 40 — Smithing Panel
 * Phase 41 — Tool Upgrade Recipes (Forge tab)
 * Phase 70 — Crafting Panel UX Pass (filter bar, output preview, missing-material feedback)
 * Phase 79 — Advanced Smithing and Alloy Routes (Alloy tab)
 *
 * A furnace-side crafting panel toggled when the player interacts with the
 * Furnace station or presses F while near it.  Three tabs are shown:
 *
 *   Smelt — ore → bar recipes (Phase 40)
 *   Forge — bar + materials → upgraded tools (Phase 41)
 *   Alloy — multi-material → alloy bar / ingot recipes (Phase 79)
 *
 * Pressing F, Escape, or clicking ✕ closes the panel.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSmithingStore } from '../../store/useSmithingStore'
import { useGameStore } from '../../store/useGameStore'
import { getItem } from '../../data/items/itemRegistry'
import { getAllSmeltRecipes, getAllForgeRecipes, getAllAlloyRecipes } from '../../engine/smithing'
import type { SmeltRecipeConfig, ForgeRecipeConfig, AlloyRecipeConfig } from '../../engine/smithing'
import { CraftFilterBar, RecipeOutputPreview } from './CraftFilterBar'
import type { CraftSortMode } from './CraftFilterBar'

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
  const need       = Math.max(0, recipe.oreQty - oreQty)

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
      <RecipeOutputPreview outputDef={barDef} />
      <div className="smithing-recipe__meta">
        <span>Lvl {recipe.levelReq}</span>
        <span>·</span>
        <span>{recipe.xp} XP</span>
        <span>·</span>
        <span>{recipe.smeltDuration} s</span>
      </div>
      <div className="smithing-recipe__bottom">
        <span className={`smithing-recipe__count${hasOre ? '' : ' smithing-recipe__count--low'}`}>
          In bag: {oreQty}{need > 0 && <span className="craft-need"> (need {need} more)</span>}
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
      <RecipeOutputPreview outputDef={toolDef} />
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
        <span className="smithing-recipe__ingredient-list">
          {recipe.ingredients.map((ing) => {
            const have = slots.find((s) => s.id === ing.id)?.quantity ?? 0
            const short = Math.max(0, ing.qty - have)
            return (
              <span key={ing.id} className={have >= ing.qty ? '' : 'smithing-recipe__count--low'}>
                {ing.label}: {have}/{ing.qty}
                {short > 0 && <span className="craft-need"> −{short}</span>}
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

// ─── Alloy recipe row ─────────────────────────────────────────────────────

interface AlloyRecipeRowProps {
  recipe: AlloyRecipeConfig
  slots: ReadonlyArray<{ id: string; quantity: number }>
  forgingLevel: number
  onAlloy: (recipe: AlloyRecipeConfig) => void
}

function AlloyRecipeRow({ recipe, slots, forgingLevel, onAlloy }: AlloyRecipeRowProps) {
  const outputDef  = getItem(recipe.outputId)
  const outputName = outputDef?.name ?? recipe.outputId
  const meetsLevel = forgingLevel >= recipe.forgingLevelReq
  const hasIngredients = recipe.ingredients.every((ing) => {
    const slot = slots.find((s) => s.id === ing.id)
    return slot != null && slot.quantity >= ing.qty
  })
  const canAlloy = meetsLevel && hasIngredients

  return (
    <li className={`smithing-recipe${canAlloy ? '' : ' smithing-recipe--locked'}`}>
      <div className="smithing-recipe__top">
        <span className="smithing-recipe__name">
          {recipe.ingredients.map((ing, i) => (
            <span key={ing.id}>
              {i > 0 && <span className="smithing-recipe__plus"> + </span>}
              {ing.label} ×{ing.qty}
            </span>
          ))}
          <span className="smithing-recipe__arrow"> → </span>
          {outputName}
        </span>
        {!meetsLevel && (
          <span className="smithing-recipe__lock-badge">Forging {recipe.forgingLevelReq} req</span>
        )}
      </div>
      <RecipeOutputPreview outputDef={outputDef} />
      <div className="smithing-recipe__meta">
        <span>Forging {recipe.forgingLevelReq}</span>
        <span>·</span>
        <span>{recipe.xp} XP</span>
        <span>·</span>
        <span>{recipe.alloyDuration} s</span>
      </div>
      <div className="smithing-recipe__bottom">
        <span className="smithing-recipe__ingredient-list">
          {recipe.ingredients.map((ing) => {
            const have = slots.find((s) => s.id === ing.id)?.quantity ?? 0
            const short = Math.max(0, ing.qty - have)
            return (
              <span key={ing.id} className={have >= ing.qty ? '' : 'smithing-recipe__count--low'}>
                {ing.label}: {have}/{ing.qty}
                {short > 0 && <span className="craft-need"> −{short}</span>}
              </span>
            )
          })}
        </span>
        <button
          className="smithing-recipe__btn"
          disabled={!canAlloy}
          onClick={() => onAlloy(recipe)}
          aria-label={`Alloy ${outputName}`}
        >
          Alloy
        </button>
      </div>
    </li>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────

type SmithingTab = 'smelt' | 'forge' | 'alloy'

interface SmithingPanelProps {
  /** Called when the player activates a smelt from this panel. */
  onSmelt: (recipe: SmeltRecipeConfig) => void
  /** Called when the player activates a tool forge from this panel. */
  onForge: (recipe: ForgeRecipeConfig) => void
  /** Called when the player activates an alloy fusion from this panel. */
  onAlloy: (recipe: AlloyRecipeConfig) => void
}

export function SmithingPanel({ onSmelt, onForge, onAlloy }: SmithingPanelProps) {
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
  const [craftableOnly, setCraftableOnly] = useState(false)
  const [sortMode, setSortMode] = useState<CraftSortMode>('level')

  const isOpenRef = useRef(false)
  useEffect(() => { isOpenRef.current = isOpen }, [isOpen])
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

  const allSmeltRecipes = getAllSmeltRecipes()
  const allForgeRecipes = getAllForgeRecipes()
  const allAlloyRecipes = getAllAlloyRecipes()

  const getOreQty = (oreId: string): number =>
    slots.find((s) => s.id === oreId)?.quantity ?? 0

  // Look up gather skill level from the subscribed skillLevels map.
  const getGatherLevel = (skillId: string): number => skillLevels[skillId] ?? 1

  // ── Smelt filter + sort ───────────────────────────────────────────────
  const smeltCraftable = allSmeltRecipes.filter((r) =>
    forgingLevel >= r.levelReq && getOreQty(r.oreId) >= r.oreQty,
  )
  const smeltVisible = (craftableOnly ? smeltCraftable : allSmeltRecipes)
    .slice()
    .sort((a, b) =>
      sortMode === 'name'
        ? (getItem(a.barId)?.name ?? a.barId).localeCompare(getItem(b.barId)?.name ?? b.barId)
        : a.levelReq - b.levelReq,
    )

  // ── Forge filter + sort ───────────────────────────────────────────────
  const forgeCraftable = allForgeRecipes.filter((r) =>
    forgingLevel >= r.forgingLevelReq &&
    getGatherLevel(r.skillReq.skill) >= r.skillReq.level &&
    r.ingredients.every((ing) => (slots.find((s) => s.id === ing.id)?.quantity ?? 0) >= ing.qty),
  )
  const forgeVisible = (craftableOnly ? forgeCraftable : allForgeRecipes)
    .slice()
    .sort((a, b) =>
      sortMode === 'name'
        ? (getItem(a.toolId)?.name ?? a.toolId).localeCompare(getItem(b.toolId)?.name ?? b.toolId)
        : a.forgingLevelReq - b.forgingLevelReq,
    )

  // ── Alloy filter + sort ───────────────────────────────────────────────
  const alloyCraftable = allAlloyRecipes.filter((r) =>
    forgingLevel >= r.forgingLevelReq &&
    r.ingredients.every((ing) => (slots.find((s) => s.id === ing.id)?.quantity ?? 0) >= ing.qty),
  )
  const alloyVisible = (craftableOnly ? alloyCraftable : allAlloyRecipes)
    .slice()
    .sort((a, b) =>
      sortMode === 'name'
        ? (getItem(a.outputId)?.name ?? a.outputId).localeCompare(getItem(b.outputId)?.name ?? b.outputId)
        : a.forgingLevelReq - b.forgingLevelReq,
    )

  const activeCraftableCount =
    activeTab === 'smelt' ? smeltCraftable.length :
    activeTab === 'forge' ? forgeCraftable.length :
    alloyCraftable.length
  const activeTotalCount =
    activeTab === 'smelt' ? allSmeltRecipes.length :
    activeTab === 'forge' ? allForgeRecipes.length :
    allAlloyRecipes.length

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
        <button
          role="tab"
          aria-selected={activeTab === 'alloy'}
          className={`smithing-panel__tab${activeTab === 'alloy' ? ' smithing-panel__tab--active' : ''}`}
          onClick={() => setActiveTab('alloy')}
        >
          Alloy
        </button>
      </div>

      {/* ── Filter bar ─────────────────────────────────────────────────── */}
      <CraftFilterBar
        craftableOnly={craftableOnly}
        sortMode={sortMode}
        onToggleCraftable={() => setCraftableOnly((v) => !v)}
        onSetSort={setSortMode}
        craftableCount={activeCraftableCount}
        totalCount={activeTotalCount}
      />

      {/* ── Recipe list ────────────────────────────────────────────────── */}
      {activeTab === 'smelt' && (
        <ul className="smithing-panel__list" role="list">
          {smeltVisible.map((recipe) => (
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
          {forgeVisible.map((recipe) => (
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

      {activeTab === 'alloy' && (
        <ul className="smithing-panel__list" role="list">
          {alloyVisible.map((recipe) => (
            <AlloyRecipeRow
              key={recipe.outputId}
              recipe={recipe}
              slots={slots}
              forgingLevel={forgingLevel}
              onAlloy={onAlloy}
            />
          ))}
        </ul>
      )}

      <p className="smithing-panel__hint">Press F or Esc to close</p>
    </div>
  )
}
