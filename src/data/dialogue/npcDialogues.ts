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
import { useFactionStore } from '../../store/useFactionStore'
import { useNotifications } from '../../store/useNotifications'
import { FACTION_TIER_ORDER } from '../../engine/shop'

// ─── Aldric — Village Elder ───────────────────────────────────────────────────

const aldricTree = {
  npcName: 'Aldric (Village Elder)',
  rootNode: 'intro',
  repeatNode: 'repeat',
  nodes: {
    intro: {
      key: 'intro',
      text: "Ah — you've arrived at last. I am Aldric, elder of Cinderglen. There's much I need to tell you, but first things first. The settlement is stretched thin: Bron at the forge needs timber, Mira at the inn needs fish, and the quarry face needs hands. Start there — learn the land, build your strength. The dangers to the south can wait a little longer.",
      choices: [
        { label: "What's happening to the south?", nextNode: 'south' },
        { label: 'Tell me about the Veil.', nextNode: 'veil' },
        { label: "I'll get started. Farewell.", nextNode: null },
      ],
    },
    veil: {
      key: 'veil',
      text: "The Veil is an ancient boundary between what we know and what should remain unknown. Lately it flickers, and where it falters, creatures cross. For now, focus on the settlement's needs — timber, fish, stone. That will prepare you for what lies further south.",
      choices: [
        { label: "What's happening to the south?", nextNode: 'south' },
        { label: 'Farewell, elder.', nextNode: null },
      ],
    },
    south: {
      key: 'south',
      text: "The Brackroot Trail winds through the grove. Woodcutters used it before the Snarl Whelps moved in. Further on lies Tidemark Chapel, the quarry, and the deep fen — each with their own hazards. But start here, in Cinderglen. Cut some timber, fish the pond, mine the rock face. When you've found your footing, come back and I'll have more work for you.",
      choices: [
        { label: 'I understand. Farewell.', nextNode: null },
      ],
    },
    repeat: {
      key: 'repeat',
      text: 'Stay vigilant, wanderer. The Veil does not rest, and neither should we.',
      choices: [
        { label: 'Tell me about the Veil.', nextNode: 'veil' },
        { label: "What's happening to the south?", nextNode: 'south' },
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
      text: "Bron's the name. If it's metal work you need, you've found the right forge. I carry tools and ore — quality stock, fair prices. Bring me ores or tools you don't need and I'll give you Marks for them.",
      choices: [
        { label: 'Browse your wares.', nextNode: null, onSelect: () => useShopStore.getState().openShop('bron') },
        { label: 'What do you make?', nextNode: 'craft' },
        { label: 'Where is the quarry?', nextNode: 'quarry' },
        { label: "I'll look around. Farewell.", nextNode: null },
      ],
    },
    craft: {
      key: 'craft',
      text: "Tools, mostly. A solid hatchet, a reliable pick — that's what keeps this settlement alive. Give me the materials and I'll shape something worth carrying.",
      choices: [
        { label: 'Browse your wares.', nextNode: null, onSelect: () => useShopStore.getState().openShop('bron') },
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
        { label: 'Browse your wares.', nextNode: null, onSelect: () => useShopStore.getState().openShop('bron') },
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
      text: "Tomas at your service, finest wares this side of the Veil! Provisions, herbs, basic materials — have a look at what I've got. Need tools? Bron at the forge or Brin Salt down at the shoreline may have what you're after.",
      choices: [
        {
          label: 'Open the shop.',
          nextNode: null,
          onSelect: () => useShopStore.getState().openShop('tomas'),
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
          onSelect: () => useShopStore.getState().openShop('tomas'),
        },
        { label: 'Not now. Farewell.', nextNode: null },
      ],
    },
  },
}

// ─── Nairn Dusk — Ward-Adept (Phase 47 + Phase 64) ───────────────────────────

const nairnDuskTree = {
  npcName: 'Nairn Dusk (Ward-Adept)',
  rootNode: 'intro',
  repeatNode: 'repeat',
  nodes: {
    intro: {
      key: 'intro',
      text: "You've found the chapel, then. Most who wander this way don't come back whole. The mist from the shaft — it seeps into the lungs, into the mind. I learned to read the ward patterns carved into these stones. They hold it back, if you know how to use them.",
      choices: [
        { label: 'What is the mist?', nextNode: 'mist' },
        { label: 'What are ward patterns?', nextNode: 'wards' },
        { label: 'What happened here?', nextNode: 'history' },
        { label: 'I should be careful. Farewell.', nextNode: null },
      ],
    },
    mist: {
      key: 'mist',
      text: "The sealed shaft runs deep — deeper than anyone has measured. What rises from it is not water, though it floods these floors every season. It is something older. It drains the warmth from you. Stand in it long enough without protection and you'll collapse.",
      choices: [
        { label: 'How do I protect myself?', nextNode: 'protection' },
        { label: 'What are ward patterns?', nextNode: 'wards' },
        { label: 'I understand. Farewell.', nextNode: null },
      ],
    },
    protection: {
      key: 'protection',
      text: "An Ashwillow Ward, carried on your person, will shield you. The glyphs on the disc resonate with the boundary markers etched into the stone here — the mist cannot settle where the pattern holds. Craft one at the warding altar in Hushwood before you venture deeper.",
      choices: [
        { label: 'What are ward patterns?', nextNode: 'wards' },
        { label: 'Thank you. Farewell.', nextNode: null },
      ],
    },
    wards: {
      key: 'wards',
      text: "Ward patterns are sigil frameworks — interlocking shapes that redirect occult energy rather than absorb it. The ones here were carved by the chapel founders to contain whatever they discovered in the shaft. The Warding Altar back in Hushwood is a working copy of those old techniques. Use it.",
      choices: [
        { label: 'What happened here?', nextNode: 'history' },
        { label: 'Thank you. Farewell.', nextNode: null },
      ],
    },
    history: {
      key: 'history',
      text: "This was a tidal shrine, built when the Reach was still young. The founders believed the shaft connected to something they called the Tidemark — a boundary beneath the ground where the Veil runs thin. They sealed it, eventually. Whatever they saw down there convinced them the boundary should stay closed.",
      choices: [
        { label: 'What is the mist?', nextNode: 'mist' },
        { label: 'Tell me about the Chapel Wisps.', nextNode: 'wisps' },
        { label: 'Unsettling. Farewell.', nextNode: null },
      ],
    },
    wisps: {
      key: 'wisps',
      text: "They are not true creatures. I believe they are the mist given unstable form — condensed fragments of whatever energy the shaft vents. When they dissolve they shed a cold light I call a Wisp Ember. I have been trying to collect three of these fragments to map the Tidemark boundary precisely. The wisps reform quickly, but their embers persist.",
      choices: [
        { label: 'I can gather the Wisp Embers for you.', nextNode: 'task_embers' },
        { label: 'What is the mist?', nextNode: 'mist' },
        { label: 'Understood. Farewell.', nextNode: null },
      ],
    },
    task_embers: {
      key: 'task_embers',
      text: "If you are willing to enter the inner shrine, I would be grateful. Carry a ward — do not go in without one. Defeat the wisps and gather three embers from what they leave behind. Bring them back to me and I can finally triangulate the Tidemark boundary. It may be the only way to understand how to properly seal this shaft for good.",
      choices: [
        { label: 'I will do it. Farewell.', nextNode: null },
        { label: 'How do I protect myself?', nextNode: 'protection' },
      ],
    },
    repeat: {
      key: 'repeat',
      text: "The mist still rises. Carry your ward if you go deeper — I've seen what happens to those who don't.",
      choices: [
        { label: 'Tell me about the mist again.', nextNode: 'mist' },
        { label: 'How do I protect myself?', nextNode: 'protection' },
        { label: 'Tell me about the Chapel Wisps.', nextNode: 'wisps' },
        { label: 'Farewell.', nextNode: null },
      ],
    },
  },
}

// ─── Brin Salt — Fisher (Phase 55) ───────────────────────────────────────────

const brinSaltTree = {
  npcName: 'Brin Salt (Fisher)',
  rootNode: 'intro',
  repeatNode: 'repeat',
  nodes: {
    intro: {
      key: 'intro',
      text: "Name's Brin Salt. I run tackle and rods for anyone serious about fishing Gloamwater Bank. Quality gear, no rubbish. I'll buy any fish you pull from these channels too.",
      choices: [
        { label: 'Browse your tackle.', nextNode: null, onSelect: () => useShopStore.getState().openShop('brin_salt') },
        { label: 'Any tips for the good spots?', nextNode: 'spots' },
        { label: 'Good to know. Farewell.', nextNode: null },
      ],
    },
    spots: {
      key: 'spots',
      text: "Minnows hug the shallows nearest the bank. Perch hold at middle depth — use a bait basket to bring them up. Gloomfin are rare; they run deep past the dock end, usually at dusk. Don't rush the cast.",
      choices: [
        { label: 'Browse your tackle.', nextNode: null, onSelect: () => useShopStore.getState().openShop('brin_salt') },
        { label: 'Thanks for the advice.', nextNode: null },
      ],
    },
    repeat: {
      key: 'repeat',
      text: "Back at the bank? Good haul this morning if you got here early. What do you need?",
      choices: [
        { label: 'Browse your tackle.', nextNode: null, onSelect: () => useShopStore.getState().openShop('brin_salt') },
        { label: 'Any tips for the good spots?', nextNode: 'spots' },
        { label: 'Nothing right now. Farewell.', nextNode: null },
      ],
    },
  },
}

// ─── Gorven — Quarry Foreman (Phase 75) ──────────────────────────────────────

const gorvenTree = {
  npcName: 'Gorven (Quarry Foreman)',
  rootNode: 'intro',
  repeatNode: 'repeat',
  nodes: {
    intro: {
      key: 'intro',
      text: "Gorven. I run the Redwake face. We're behind on iron — the settlement keeps requisitioning and we can't keep pace. If you're willing to swing a pick I could use the help.",
      choices: [
        { label: 'What do you need?', nextNode: 'iron_need' },
        { label: 'Tell me about the quarry.', nextNode: 'quarry_lore' },
        { label: 'Just passing through.', nextNode: null },
      ],
    },
    iron_need: {
      key: 'iron_need',
      text: "Five chunks of iron ore, delivered to Bron down at the smithy. After that, I've got a deeper job for you — duskiron seam, further in. Harder going but the vein is rich.",
      choices: [
        { label: "I'll get on it.", nextNode: null },
        { label: 'Tell me about the quarry.', nextNode: 'quarry_lore' },
      ],
    },
    quarry_lore: {
      key: 'quarry_lore',
      text: "Redwake has been worked since before the settlement was built. The older crew called the deep seam 'duskiron' — harder than standard iron, runs darker, takes an edge better. Takes a better pick too. Don't go at it with a copper tool.",
      choices: [
        { label: 'What do you need from me?', nextNode: 'iron_need' },
        { label: "Good to know. I'll be back.", nextNode: null },
      ],
    },
    deep_seam: {
      key: 'deep_seam',
      text: "Good work on the iron. Now the real job: there's a duskiron seam deeper in along the north wall, just before the locked supply alcove. Bring me three chunks of duskiron ore and I'll see the cache opened for you. What's in there is worth the effort.",
      choices: [
        { label: "I'll get the duskiron.", nextNode: null },
        { label: 'Tell me about the quarry.', nextNode: 'quarry_lore' },
      ],
    },
    repeat: {
      key: 'repeat',
      text: "Face is still running. You need more ore, the seam's open. Don't let the loose rubble catch you.",
      choices: [
        { label: 'What else needs doing?', nextNode: 'deep_seam' },
        { label: 'Tell me about the quarry.', nextNode: 'quarry_lore' },
        { label: 'Understood. Farewell.', nextNode: null },
      ],
    },
  },
}

// ─── Olen — Union Trader (Phase 77) ──────────────────────────────────────────

/**
 * Olen guards the Quarry Union's private stock.
 * Opening the shop requires at least Acquainted (100 rep) standing with the
 * Quarry Union; the Duskiron Pick inside the shop is separately locked to
 * Trusted (300 rep) standing.
 */
function tryOpenOlenShop(): void {
  const tier = useFactionStore.getState().getTrustTier('quarry_union')
  const tierIdx = FACTION_TIER_ORDER.indexOf(tier)
  const acquaintedIdx = FACTION_TIER_ORDER.indexOf('acquainted')
  if (tierIdx >= acquaintedIdx) {
    useShopStore.getState().openShop('olen')
  } else {
    const rep = useFactionStore.getState().getRepForFaction('quarry_union')
    useNotifications.getState().push(
      `The Union Post requires Acquainted standing with the Quarry Union (100 rep). You have ${rep}.`,
      'info',
    )
  }
}

const olenTree = {
  npcName: 'Olen (Union Trader)',
  rootNode: 'intro',
  repeatNode: 'repeat',
  nodes: {
    intro: {
      key: 'intro',
      text: "Olen. I run the union post — ore, picks, the good stuff. We don't sell to just anyone. Earn your standing with the Quarry Union first and I'll see you right.",
      choices: [
        { label: 'Browse the union post.', nextNode: null, onSelect: tryOpenOlenShop },
        { label: 'What do you carry?', nextNode: 'stock' },
        { label: 'How do I earn union standing?', nextNode: 'standing' },
        { label: "Not right now.", nextNode: null },
      ],
    },
    stock: {
      key: 'stock',
      text: "Iron ore, duskiron ore when the seam's been worked, iron picks — standard union issue. Trusted members get access to the duskiron pick too. Finest mining tool you'll find this side of the Deep Heart.",
      choices: [
        { label: 'Browse the union post.', nextNode: null, onSelect: tryOpenOlenShop },
        { label: 'How do I earn union standing?', nextNode: 'standing' },
        { label: "I'll keep that in mind.", nextNode: null },
      ],
    },
    standing: {
      key: 'standing',
      text: "Talk to Gorven — he'll put you on contract work. Haul ore, clear the deep face, deliver to spec. Do that and the union will vouch for you. Show up enough times and you'll be Trusted.",
      choices: [
        { label: 'Browse the union post.', nextNode: null, onSelect: tryOpenOlenShop },
        { label: 'What do you carry?', nextNode: 'stock' },
        { label: 'Understood. Farewell.', nextNode: null },
      ],
    },
    repeat: {
      key: 'repeat',
      text: "You're back. Seam's running today — good time to stock up.",
      choices: [
        { label: 'Browse the union post.', nextNode: null, onSelect: tryOpenOlenShop },
        { label: 'What do you carry?', nextNode: 'stock' },
        { label: 'Farewell.', nextNode: null },
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
  registerDialogue(nairnDuskTree)
  registerDialogue(brinSaltTree)
  // Phase 75
  registerDialogue(gorvenTree)
  // Phase 77
  registerDialogue(olenTree)
}
