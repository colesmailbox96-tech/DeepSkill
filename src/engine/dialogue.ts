/**
 * Phase 36 — Dialogue Framework
 *
 * Provides the data model for branching NPC dialogue trees and a simple
 * registry for looking up trees by NPC name.
 *
 * Data model
 * ──────────
 *  DialogueChoice – a single option the player can select, with an optional
 *                   callback and a pointer to the next node (or null to close).
 *  DialogueNode   – a single beat of NPC speech, plus an optional set of
 *                   choices the player can make.
 *  DialogueTree   – the complete conversation for one NPC.
 *                   `rootNode`   = entry point on first meeting.
 *                   `repeatNode` = entry point on subsequent talks (optional;
 *                                  falls back to rootNode when not set).
 *
 * Repeatable-state handling
 * ─────────────────────────
 *  The store (useDialogueStore) tracks a Set of NPC names whose rootNode has
 *  already been seen.  When openDialogue() is called for a known NPC the tree
 *  starts from `repeatNode` (if defined) so the player sees a shorter greeting
 *  instead of the full first-meeting flow.
 */

// ─── Public types ──────────────────────────────────────────────────────────────

/** A single choice offered to the player inside a dialogue node. */
export interface DialogueChoice {
  /** Text shown on the choice button. */
  label: string
  /**
   * Key of the next DialogueNode to display when this choice is picked.
   * `null` closes the dialogue.
   */
  nextNode: string | null
  /**
   * Optional side-effect callback executed when the player selects this choice
   * (e.g. opening the shop, giving an item, setting a quest flag).
   */
  onSelect?: () => void
}

/** One beat of NPC speech, optionally followed by player choices. */
export interface DialogueNode {
  /** Unique key within the owning DialogueTree. */
  key: string
  /** The NPC's speech text. */
  text: string
  /**
   * Player choices rendered as buttons.  When omitted the dialogue ends
   * automatically after displaying the text (a single "Farewell" option is
   * synthesised by the UI layer).
   */
  choices?: DialogueChoice[]
}

/** Complete branching conversation for one NPC. */
export interface DialogueTree {
  /** Display name shown in the dialogue panel header. */
  npcName: string
  /**
   * Optional one-line descriptor shown below the NPC name in the dialogue
   * panel — role, affiliation, or mood cue (e.g. "Quarry Foreman · Redwake Union").
   */
  summary?: string
  /** Key of the node used the *first* time the player talks to this NPC. */
  rootNode: string
  /**
   * Key of the node used on every *subsequent* visit.  Falls back to
   * `rootNode` when undefined so first-time and repeat dialogues are the
   * same if no repeat path is needed.
   */
  repeatNode?: string
  /** All nodes in the tree, keyed by DialogueNode.key. */
  nodes: Record<string, DialogueNode>
}

// ─── Registry ──────────────────────────────────────────────────────────────────

const _registry = new Map<string, DialogueTree>()

/**
 * Register a dialogue tree.  The NPC name is used as the lookup key and must
 * match the string passed to `openDialogue()`.
 */
export function registerDialogue(tree: DialogueTree): void {
  _registry.set(tree.npcName, tree)
}

/**
 * Retrieve a registered dialogue tree by NPC name.
 * Returns `undefined` if none has been registered for that name.
 */
export function getDialogue(npcName: string): DialogueTree | undefined {
  return _registry.get(npcName)
}
