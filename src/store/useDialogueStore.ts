/**
 * Phase 36 — Dialogue Store
 *
 * Manages the live state of the NPC dialogue panel:
 *   - which NPC is currently being spoken to (null = panel closed)
 *   - which DialogueNode is currently displayed
 *   - the set of NPC names whose first-meeting (rootNode) has already been seen
 *     so that repeat visits start from `repeatNode` instead
 *
 * Actions
 * ───────
 *  openDialogue(npcName)  – looks up the tree, decides root vs repeat node,
 *                           marks the NPC as seen, opens the panel.
 *  advanceTo(nodeKey)     – moves to a different node inside the current tree.
 *  closeDialogue()        – hides the panel and clears live state.
 */

import { create } from 'zustand'
import { getDialogue } from '../engine/dialogue'
import type { DialogueTree, DialogueNode } from '../engine/dialogue'

export interface DialogueState {
  /** The full dialogue tree for the active NPC, or null when closed. */
  activeTree: DialogueTree | null
  /** The node currently being displayed, or null when closed. */
  currentNode: DialogueNode | null
  /** NPC names whose intro (rootNode) has already been seen. */
  seenNpcs: Set<string>

  /** Open the dialogue panel for the named NPC. No-ops if no tree is registered. */
  openDialogue: (npcName: string) => void
  /** Navigate to a different node within the current tree. */
  advanceTo: (nodeKey: string) => void
  /** Close the panel and clear active state. */
  closeDialogue: () => void
}

export const useDialogueStore = create<DialogueState>((set, get) => ({
  activeTree: null,
  currentNode: null,
  seenNpcs: new Set(),

  openDialogue: (npcName: string) => {
    const tree = getDialogue(npcName)
    if (!tree) return

    const { seenNpcs } = get()
    const alreadySeen = seenNpcs.has(npcName)

    // Decide entry point: repeat greeting if the player has spoken before.
    const startKey =
      alreadySeen && tree.repeatNode ? tree.repeatNode : tree.rootNode
    const startNode = tree.nodes[startKey]
    if (!startNode) return

    // Mark as seen (no-op on subsequent visits).
    const updatedSeen = new Set(seenNpcs)
    updatedSeen.add(npcName)

    set({ activeTree: tree, currentNode: startNode, seenNpcs: updatedSeen })
  },

  advanceTo: (nodeKey: string) => {
    const { activeTree } = get()
    if (!activeTree) return
    const node = activeTree.nodes[nodeKey]
    if (!node) return
    set({ currentNode: node })
  },

  closeDialogue: () => {
    set({ activeTree: null, currentNode: null })
  },
}))
