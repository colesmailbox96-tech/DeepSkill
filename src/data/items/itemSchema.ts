/**
 * Phase 11 — Item Data Schema
 *
 * Defines every type used to describe an item in Veilmarch.
 * All fields are intentional and functional; no stubs.
 */

// ── Item type taxonomy ───────────────────────────────────────────────────────

/**
 * Broad classification that drives inventory behaviour, shop sorting, and
 * action-menu choices.
 *
 * - 'material'    Raw or processed resource (logs, ore, fibre, etc.).
 * - 'tool'        Held tool that enables or improves a skilling action.
 * - 'consumable'  Single-use item with an immediate or timed effect.
 * - 'equipment'   Worn or wielded gear that provides passive stat bonuses.
 * - 'quest'       Story or task item; always unique, never sold.
 */
export type ItemType = 'material' | 'tool' | 'consumable' | 'equipment' | 'quest'

// ── Equipment slot taxonomy ──────────────────────────────────────────────────

/**
 * All valid body-slot positions for worn or wielded gear.
 * Used by EquipMeta.slot; only ItemType 'equipment' items may have EquipMeta.
 */
export type EquipSlot =
  | 'mainHand'
  | 'offHand'
  | 'head'
  | 'chest'
  | 'legs'
  | 'feet'
  | 'hands'
  | 'ring'
  | 'neck'

// ── Icon reference rules ─────────────────────────────────────────────────────

/**
 * Path convention: all icon strings are paths **relative to /public/icons/**.
 * Example: 'items/rough_stone.png'
 *
 * Until dedicated art exists, the UI falls back to a generic placeholder at
 * /public/icons/items/placeholder.png.  The field is always present so the
 * rendering layer can rely on it unconditionally.
 */

// ── Tool metadata ────────────────────────────────────────────────────────────

/**
 * Extra data attached to items of type 'tool'.
 *
 * skill — the skill ID this tool applies to (e.g. 'woodcutting', 'mining').
 * tier  — quality tier starting at 1 (starter); higher tiers improve gather
 *         speed and unlock harder nodes.
 */
export interface ToolMeta {
  skill: string
  tier: number
}

// ── Consumable metadata ──────────────────────────────────────────────────────

/**
 * Extra data attached to items of type 'consumable'.
 * All numeric healing / restore fields are additive flat values.
 * duration is in seconds (for timed buffs only).
 * effect is a short human-readable description shown in the tooltip.
 */
export interface ConsumableMeta {
  healsHp?: number
  restoresStamina?: number
  /** Flat attack bonus added for `duration` seconds after eating. */
  buffAttack?: number
  duration?: number
  effect?: string
}

// ── Equipment metadata ───────────────────────────────────────────────────────

/**
 * Extra data attached to items of type 'equipment'.
 *
 * slot         — body slot this piece occupies.
 * attackBonus  — flat bonus to outgoing attack damage.
 * defenceBonus — flat damage reduction applied before HP loss.
 * requirements — minimum skill levels required to equip, keyed by skill id.
 */
export interface EquipMeta {
  slot: EquipSlot
  attackBonus?: number
  defenceBonus?: number
  requirements?: Partial<Record<string, number>>
}

// ── Master item definition ───────────────────────────────────────────────────

/**
 * Complete description of a single item type.
 * Instances of items in a player's inventory are represented as
 * { id, quantity } references — the ItemDefinition supplies everything else.
 *
 * Fields:
 *  id           — unique snake_case identifier used throughout the codebase.
 *  name         — display name shown in UI.
 *  type         — ItemType classification (see above).
 *  stackable    — true ⟹ multiple units share one inventory slot.
 *                 false ⟹ each unit takes its own slot (e.g. equipment).
 *  value        — base coin value; buy price = value, sell price ≈ value / 3.
 *  icon         — icon path relative to /public/icons/ (see icon rules above).
 *  description  — one or two sentences of flavour + function text.
 *  toolMeta     — present only when type === 'tool'.
 *  consumableMeta — present only when type === 'consumable'.
 *  equipMeta    — present only when type === 'equipment'.
 */
export interface ItemDefinition {
  id: string
  name: string
  type: ItemType
  stackable: boolean
  value: number
  icon: string
  description: string
  toolMeta?: ToolMeta
  consumableMeta?: ConsumableMeta
  equipMeta?: EquipMeta
}
