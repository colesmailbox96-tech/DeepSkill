/**
 * Phase 36 — NPC Dialogue Trees
 *
 * Branching dialogue data for every NPC in Cinderglen Settlement.
 * Each NPC has:
 *   - a first-meeting flow (rootNode) with lore, personality and choices.
 *   - a repeat-visit shortcut (repeatNode) so returning players see a
 *     context-appropriate greeting rather than the full intro again.
 *
 * Accept / decline hooks live inside individual `onSelect` callbacks; the
 * store layer (useDialogueStore) exposes them to the UI without tying this
 * file to any React imports.
 *
 * Call `registerAllDialogues()` once at startup (e.g. in App.tsx) to load
 * all trees into the engine registry.
 */

import { registerDialogue } from '../../engine/dialogue'
import { useShopStore } from '../../store/useShopStore'

// ─── Aldric — Village Elder ───────────────────────────────────────────────────

const aldricTree = {
  npcName: 'Aldric (Village Elder)',
  rootNode: 'intro',
  repeatNode: 'repeat',
  nodes: {
    intro: {
      key: 'intro',
      text: "Welcome, wanderer. I am Aldric, elder of Cinderglen. The Veil grows restless and strange things stir along the trail south. You'd do well to keep your wits sharp.",
      choices: [
        { label: 'Tell me about the Veil.', nextNode: 'veil' },
        { label: 'What lies south of here?', nextNode: 'south' },
        { label: "I'll be on my way.", nextNode: null },
      ],
    },
    veil: {
      key: 'veil',
      text: "The Veil is an ancient boundary — A boundary between what we know and what should remain unknown. Lately it flickers, and where it falters, creatures cross. Take heed.",
      choices: [
        { label: 'What lies south of here?', nextNode: 'south' },
        { label: 'Farewell, elder.', nextNode: null },
      ],
    },
    south: {
      key: 'south',
      text: "The Brackroot Trail winds through the grove. Woodcutters used it before the Snarl Whelps moved in. If you must go, travel light and stay alert.",
      choices: [
        { label: 'I understand. Farewell.', nextNode: null },
      ],
    },
    repeat: {
      key: 'repeat',
      text: 'Stay vigilant, wanderer. The Veil does not rest, and neither should we.',
      choices: [
        { label: 'Tell me about the Veil.', nextNode: 'veil' },
        { label: 'What lies south of here?', nextNode: 'south' },
        { label: 'Farewell.', nextNode: null },
      ],
    },
  },
}

// ─── Bron — Blacksmith ────────────────────────────────────────────────────────

const bronTree = {
  npcName: 'Bron (Blacksmith)',
  rootNode: 'intro',
  repeatNode: 'repeat',
  nodes: {
    intro: {
      key: 'intro',
      text: "Bron's the name. If it's metal work you need, you've found the right forge. I'm low on ore right now — the quarry haul's been thin. Bring me some stone and we might strike a deal.",
      choices: [
        { label: 'What do you make?', nextNode: 'craft' },
        { label: 'Where is the quarry?', nextNode: 'quarry' },
        { label: "I'll look around. Farewell.", nextNode: null },
      ],
    },
    craft: {
      key: 'craft',
      text: "Tools, mostly. A solid hatchet, a reliable pick — that's what keeps this settlement alive. Give me the materials and I'll shape something worth carrying.",
      choices: [
        { label: 'Where is the quarry?', nextNode: 'quarry' },
        { label: 'Understood. Farewell.', nextNode: null },
      ],
    },
    quarry: {
      key: 'quarry',
      text: "East of the commons, past the pond. Redwake Quarry. Hard rock but good yield if you've got the right pick. Watch your step — loose shale shifts underfoot.",
      choices: [
        { label: 'Thanks for the tip.', nextNode: null },
      ],
    },
    repeat: {
      key: 'repeat',
      text: "Back already? The forge never sleeps. What do you need?",
      choices: [
        { label: 'What do you make?', nextNode: 'craft' },
        { label: 'Where is the quarry?', nextNode: 'quarry' },
        { label: 'Nothing right now. Farewell.', nextNode: null },
      ],
    },
  },
}

// ─── Mira — Innkeeper ─────────────────────────────────────────────────────────

const miraTree = {
  npcName: 'Mira (Innkeeper)',
  rootNode: 'intro',
  repeatNode: 'repeat',
  nodes: {
    intro: {
      key: 'intro',
      text: "Oh! A new face — welcome to the Mudroot Inn. I'm Mira. We've a warm hearth and a cook pot if you're hungry. Not much else to offer these days, I'm afraid.",
      choices: [
        { label: 'What do you cook here?', nextNode: 'cook' },
        { label: 'Has business been slow?', nextNode: 'slow' },
        { label: 'Thank you. Farewell.', nextNode: null },
      ],
    },
    cook: {
      key: 'cook',
      text: "Whatever comes in from the trail — fish from the shoreline, herbs from the commons. Fresh is best. There's a hearthcraft station out back if you want to make your own.",
      choices: [
        { label: 'Where is the hearthcraft station?', nextNode: 'hearth' },
        { label: 'Farewell.', nextNode: null },
      ],
    },
    hearth: {
      key: 'hearth',
      text: "Around the east side of the inn, just past the woodpile. Can't miss the smell of it on a good day.",
      choices: [
        { label: "I'll have a look. Farewell.", nextNode: null },
      ],
    },
    slow: {
      key: 'slow',
      text: "Since those creature sightings started on the south trail, fewer traders dare the roads. We manage. Aldric keeps spirits up, bless him.",
      choices: [
        { label: 'What do you cook here?', nextNode: 'cook' },
        { label: 'I see. Farewell.', nextNode: null },
      ],
    },
    repeat: {
      key: 'repeat',
      text: "Good to see you again. The hearth is always going if you need it.",
      choices: [
        { label: 'What do you cook here?', nextNode: 'cook' },
        { label: 'Farewell, Mira.', nextNode: null },
      ],
    },
  },
}

// ─── Dwyn — Guard ─────────────────────────────────────────────────────────────

const dwynTree = {
  npcName: 'Dwyn (Guard)',
  rootNode: 'intro',
  repeatNode: 'repeat',
  nodes: {
    intro: {
      key: 'intro',
      text: "Halt — actually, you look alright. I'm Dwyn. I keep watch on the north approach. Stay out of trouble and we'll get along fine.",
      choices: [
        { label: 'Any dangers to watch for?', nextNode: 'dangers' },
        { label: 'What happened on the south trail?', nextNode: 'south' },
        { label: 'Understood. Carry on.', nextNode: null },
      ],
    },
    dangers: {
      key: 'dangers',
      text: "Snarl Whelps mostly. Small, but they nip hard and they don't stop once they start. Don't let them surround you and you'll be fine. Brackroot Crawlers are slower but hit heavier — give them space.",
      choices: [
        { label: 'What happened on the south trail?', nextNode: 'south' },
        { label: 'Good advice. Farewell.', nextNode: null },
      ],
    },
    south: {
      key: 'south',
      text: "Trail used to be clear. Then the Veil shifted and the creatures moved in. I don't have the numbers to patrol down there, so if you're heading south, go armed and be quick about it.",
      choices: [
        { label: 'Any dangers to watch for?', nextNode: 'dangers' },
        { label: 'Thanks for the warning.', nextNode: null },
      ],
    },
    repeat: {
      key: 'repeat',
      text: "Keep your guard up out there. The settlement depends on it.",
      choices: [
        { label: 'Any dangers to watch for?', nextNode: 'dangers' },
        { label: 'Farewell, Dwyn.', nextNode: null },
      ],
    },
  },
}

// ─── Sera — Herbalist ─────────────────────────────────────────────────────────

const seraTree = {
  npcName: 'Sera (Herbalist)',
  rootNode: 'intro',
  repeatNode: 'repeat',
  nodes: {
    intro: {
      key: 'intro',
      text: "Hello there! I'm Sera. I gather herbs, roots, anything useful that grows near the commons. The land gives freely if you know how to look.",
      choices: [
        { label: 'What grows around here?', nextNode: 'herbs' },
        { label: 'Can plants help in a fight?', nextNode: 'combat' },
        { label: 'Lovely to meet you. Farewell.', nextNode: null },
      ],
    },
    herbs: {
      key: 'herbs',
      text: "Thornling moss after rain, reed fiber by the shoreline, and if you're lucky, a resin glob from the older trees on the Brackroot Trail. I press them into salves and pastes.",
      choices: [
        { label: 'Can plants help in a fight?', nextNode: 'combat' },
        { label: 'Fascinating. Farewell.', nextNode: null },
      ],
    },
    combat: {
      key: 'combat',
      text: "Absolutely. Cook a hearty meal before heading into danger — it can mean the difference between standing and falling. I've seen it save lives.",
      choices: [
        { label: 'Good to know. Farewell.', nextNode: null },
      ],
    },
    repeat: {
      key: 'repeat',
      text: "Back again! Have you tried foraging near the commons? There is always something new to find.",
      choices: [
        { label: 'What grows around here?', nextNode: 'herbs' },
        { label: 'Farewell, Sera.', nextNode: null },
      ],
    },
  },
}

// ─── Tomas — Travelling Merchant ─────────────────────────────────────────────

const tomasTree = {
  npcName: 'Tomas (Merchant)',
  rootNode: 'intro',
  repeatNode: 'repeat',
  nodes: {
    intro: {
      key: 'intro',
      text: "Tomas at your service, finest wares this side of the Veil! Tools, provisions, odds and ends — have a look at what I've got.",
      choices: [
        {
          label: 'Open the shop.',
          nextNode: null,
          onSelect: () => useShopStore.getState().openShop(),
        },
        { label: 'Maybe later. Farewell.', nextNode: null },
      ],
    },
    repeat: {
      key: 'repeat',
      text: "Welcome back! Ready to browse?",
      choices: [
        {
          label: 'Open the shop.',
          nextNode: null,
          onSelect: () => useShopStore.getState().openShop(),
        },
        { label: 'Not now. Farewell.', nextNode: null },
      ],
    },
  },
}

// ─── Public registration function ─────────────────────────────────────────────

/**
 * Register all NPC dialogue trees into the engine registry.
 * Call once at application startup before the first NPC interaction.
 */
export function registerAllDialogues(): void {
  registerDialogue(aldricTree)
  registerDialogue(bronTree)
  registerDialogue(miraTree)
  registerDialogue(dwynTree)
  registerDialogue(seraTree)
  registerDialogue(tomasTree)
}
