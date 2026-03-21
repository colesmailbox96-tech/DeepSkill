# Veilmarch — Original Low-Poly 3D RPG Master Build Plan

> A fully original, over-the-shoulder, low-ish-poly 3D fantasy RPG designed for implementation by a GitHub coding agent through many tightly scoped, sequential phases.

---

## What This Document Is

This is not a vague concept note.

This is a **production-facing markdown blueprint** for an AI coding agent that needs:

- strict scope control,
- narrow pull requests,
- explicit content rules,
- hard boundaries against placeholder abuse,
- and a phase structure fine-grained enough to stop the usual “I touched 47 systems and half of them don’t work” nonsense.

The game should evoke the long-term progression appeal of classic skill-based fantasy RPGs, but it must be **completely original** in:

- world,
- lore,
- skills flavor,
- region names,
- items,
- monsters,
- quests,
- factions,
- UI identity,
- progression framing,
- and narrative tone.

This means **no copied RuneScape names, layouts, jokes, quest parallels, monster analog swaps, or iconic UI clones**.

---

## Hard Rules for the GitHub Agent

### Originality Rules

The agent must not:

- reuse names from RuneScape or any obvious adjacent MMO analog,
- create near-copy substitutes like “Green Imp” instead of “Goblin,”
- mirror iconic town structures or world layouts,
- recreate recognizable quest beats with only surface renaming,
- build a UI that is visually a legal-risk nostalgia skin,
- treat this as “OSRS but with synonyms.”

The agent must:

- use only original location names,
- use only original item and monster names,
- preserve a distinct frontier-mystic identity,
- make the game feel spiritually familiar in loop structure but unmistakably its own work.

### Pull Request Discipline Rules

Every phase PR must include:

1. scope summary,
2. files changed,
3. files intentionally untouched,
4. test checklist,
5. screenshots or recordings,
6. known limitations,
7. explicit note that no unrelated placeholders were introduced.

### Placeholder Rules

The agent must not add:

- dead UI tabs,
- empty inventory categories,
- nonfunctional buttons,
- fake shops,
- unreachable content,
- stub skills with no gameplay loop,
- monsters with no spawn logic,
- recipes with no acquisition path,
- quests with no completion state,
- gear slots with no stat behavior.

If a system appears in the build, it must actually function.

### Scope Rules

For each phase:

- modify only the systems needed for that phase,
- avoid proactive refactors unless there is a real blocker,
- do not rewrite architecture “for future-proofing” unless the phase explicitly authorizes it,
- keep the PR small enough that a human reviewer can verify the full feature slice.

---

## High-Level Game Identity

### Working Title
**Veilmarch**

### One-Sentence Pitch
A low-poly frontier fantasy RPG set across drowned roads, ashwood ridges, buried engine-crypts, and lantern marshes, where the player grows from a camphand into a master of survival, craft, and ruin-delving.

### Design Pillars

1. **Readable long-term progression**  
   Every repeated action should visibly matter.

2. **A world with its own bones**  
   Not medieval theme park nostalgia. Weathered, eerie, grounded, and original.

3. **Skills as lived activities**  
   Mining, fishing, woodcutting, cooking, smithing, and related skills must feel embodied in the world.

4. **Tactile traversal and interaction**  
   Over-the-shoulder movement, camera, selection, and action feedback must feel smooth.

5. **GitHub-agent survivability**  
   The project plan must be sliced so the agent cannot easily turn it into slop.

---

## World Overview

### World Name
**The Veilmarch Territories**

### Starting Region
**Cinderglen Reach**

### Tone

- rain-dark timber,
- cold forge glow,
- worn roads,
- marsh lanterns,
- cliff shrines,
- buried mechanical relics,
- frontier settlements built over unstable ancient infrastructure.

### Core Premise

Beneath the Veilmarch lies a network of half-living, half-mechanical structures known as **Deep Hearts**. These sealed cores once regulated heat, water pressure, mineral growth, and migratory channels across the land. Now many have cracked, stalled, or awakened incorrectly.

This has altered the natural world:

- ore veins pulse with inner warmth,
- trees mineralize over time,
- fish gather near geothermal seep lines,
- marsh lights drift where old vents leak charged vapor,
- and certain creatures emerge only where the Deep Hearts disturb the terrain.

The player begins in a modest settlement and rises through labor, exploration, trade, craft mastery, and ruin expeditions.

---

## Visual Direction

### Visual Style

- low-ish poly 3D,
- clean silhouettes,
- flat or lightly blended shading,
- high readability at distance,
- restrained palette,
- atmospheric lighting,
- stylized but not toy-like.

### Camera Target

- over-the-shoulder,
- slightly elevated,
- playable on desktop and mobile,
- readable for skilling, combat, and traversal.

### Environment Mood

Think:

- wet earth,
- ember-lit workshops,
- mossed stone,
- ironbark groves,
- foggy shorelines,
- ruin doors cut into hillsides,
- weathered rope bridges,
- tide shrines with quiet machinery inside.

Not:

- bright parody fantasy,
- cartoony plastic colors,
- direct copy of any known MMO town composition.

---

## Tech Stack Recommendation

| Layer | Recommendation | Notes |
|---|---|---|
| Rendering | Three.js | Strong browser-side 3D foundation |
| UI | React 18 | Componentized UI, panel management |
| State | Zustand | Lightweight global state |
| Build | Vite | Fast iteration |
| Language | TypeScript preferred | Use JS only if existing repo is already locked in |
| Audio | Howler.js | Simple music/SFX routing |
| Storage | localStorage | Enough for initial single-player progression |
| Packaging | PWA | Mobile-friendly and installable |
| Assets | GLB / GLTF | Consistent low-poly asset pipeline |

---

## Suggested Folder Structure

```text
veilmarch/
├── public/
│   ├── models/
│   │   ├── terrain/
│   │   ├── structures/
│   │   ├── props/
│   │   ├── creatures/
│   │   ├── npcs/
│   │   └── equipment/
│   ├── audio/
│   │   ├── music/
│   │   ├── ambience/
│   │   └── sfx/
│   ├── icons/
│   └── manifest.json
├── src/
│   ├── app/
│   ├── data/
│   │   ├── skills/
│   │   ├── items/
│   │   ├── creatures/
│   │   ├── regions/
│   │   ├── recipes/
│   │   ├── npcs/
│   │   ├── quests/
│   │   ├── vendors/
│   │   └── economy/
│   ├── engine/
│   │   ├── scene/
│   │   ├── camera/
│   │   ├── movement/
│   │   ├── interaction/
│   │   ├── world/
│   │   ├── combat/
│   │   ├── audio/
│   │   └── save/
│   ├── game/
│   │   ├── player/
│   │   ├── skills/
│   │   ├── inventory/
│   │   ├── equipment/
│   │   ├── crafting/
│   │   ├── gathering/
│   │   ├── creatures/
│   │   ├── quests/
│   │   ├── worldstate/
│   │   └── vendors/
│   ├── store/
│   ├── ui/
│   │   ├── hud/
│   │   ├── panels/
│   │   ├── overlays/
│   │   ├── menus/
│   │   └── mobile/
│   ├── utils/
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── vite.config.ts
└── README.md
```

---

## Core Gameplay Loops

### Primary Loop

1. move through world,
2. gather raw materials,
3. process materials,
4. craft tools, food, and gear,
5. gain skill levels,
6. unlock new routes, nodes, recipes, and threats,
7. fight or avoid creatures,
8. sell, store, refine, and reinvest,
9. access deeper and stranger regions.

### Secondary Loop

1. talk to locals,
2. take practical work orders,
3. complete region-based tasks,
4. earn access to tools, stations, and new routes,
5. uncover Deep Heart-related mysteries.

### Long-Term Loop

1. master multiple gathering and production skills,
2. acquire better loadouts,
3. survive stronger regions,
4. unlock faction trust,
5. access engine-crypt dungeons,
6. build a coherent personal progression route.

---

## Skills

These should retain familiar usability while remaining fully original in world framing.

### Core Skills

- **Woodcutting** — fell trees and gather specialized wood types.
- **Mining** — extract stone, ore, mineral salts, and charged deposits.
- **Fishing** — catch freshwater, marsh, reef, and thermal species.
- **Cooking** — prepare food for healing, buffs, and trade.
- **Smithing** — refine metal bars and shape tools and equipment.
- **Foraging** — gather plants, fungi, reeds, resin, and marsh herbs.
- **Carving** — shape wood, bone, horn, and shell into utility parts.
- **Tinkering** — assemble field tools, lanterns, hooks, traps, and utility devices.
- **Warding** — inscribe protective marks, anti-ruin charms, and traversal seals.
- **Surveying** — detect hidden nodes, structural weak points, buried paths, and rare gathering bonuses.
- **Combat** — can be subdivided later into melee, ranged, and channeling if desired.

### Why Add New Skills

The game needs some systems that are not just “old MMO muscle memory with a different coat of paint.”

The strongest additions are:

#### Surveying
A field-prospecting skill that rewards observation. It can support:

- rare node detection,
- hidden caches,
- route shortcuts,
- buried salvage,
- weak-wall identification,
- increased yield on certain interactables.

#### Warding
A grounded occult utility skill. It can support:

- ruin entry requirements,
- temporary protection from environmental hazards,
- safer gathering in hostile zones,
- special anti-creature marks,
- simple light or barrier interactions.

#### Tinkering
A practical utility-crafting skill. It fits the setting better than broad “magic crafting” early on. It can support:

- improved gathering tools,
- bait cages,
- reinforced hooks,
- lantern upgrades,
- field kits,
- traversal devices,
- salvage conversion.

---

## Combat Direction

Combat should be readable, modest in scope initially, and not the first place the project drowns.

### Initial Combat Principles

- one active target at a time,
- clear aggro radius,
- simple melee hit logic,
- simple ranged later,
- avoid overbuilding animation complexity early,
- prioritise responsiveness over spectacle.

### Combat Feel Goals

- movement and facing are clear,
- hit registration is consistent,
- creature pursuit does not break zone boundaries,
- attack cadence is readable,
- healing food works predictably,
- low-level enemies are useful but not annoying.

---

## Regions

These are intentionally original and designed to avoid “obvious nostalgic map clone syndrome.”

### 1. Hushwood
The player’s starting hamlet.

**Features:**
- bunkhouse,
- forge shed,
- cookfire commons,
- small storehouse,
- fish rack,
- task board,
- training grove,
- shallow bank branch equivalent as a ledger hall.

### 2. Brackroot Trail
A muddy road and tree-cut corridor leading out of Hushwood.

**Features:**
- beginner woodcutting,
- foraging nodes,
- low-threat creatures,
- first hidden surveying cache.

### 3. Redwake Quarry
An exposed mining basin with iron-rich seams and unstable stone shelves.

**Features:**
- mining progression,
- basic hauling set pieces,
- quarry foreman NPC,
- tool upgrade route.

### 4. Gloamwater Bank
A foggy shoreline and dock network where fish, reeds, and muck-life gather.

**Features:**
- fishing,
- foraging,
- cooking ingredients,
- bait systems,
- later lantern-eel route.

### 5. Ashfen Copse
A warped woodland where heat from the ground has mineralized roots and bark.

**Features:**
- advanced woodcutting,
- resin collection,
- strange creatures,
- warding relevance.

### 6. Tidemark Chapel
A half-flooded shrine complex built around an old sealed shaft.

**Features:**
- first ruin-like zone,
- occult NPCs,
- early warding tutorials,
- environmental hazards.

### 7. Hollow Vault Steps
A terraced ruin descending toward buried mechanical chambers.

**Features:**
- mid-game combat,
- surveying secrets,
- salvage,
- locked passages.

### 8. Marrowfen
A dangerous marsh of pale roots, gas vents, and slow water.

**Features:**
- high-tier foraging,
- ward hazards,
- rare fish,
- stronger creatures,
- visibility gameplay.

### 9. Belowglass Vaults
A late-game Deep Heart-adjacent ruin network.

**Features:**
- hostile constructs,
- rare ore,
- ancient salvage,
- environmental mechanics.

---

## Factions

### The Hushwrights
Practical builders, haulers, woodcutters, and repair workers.

### The Tidebound Keepers
Shrine-tenders, ferrymen, and lore stewards of the wet routes.

### The Quarry Union of Redwake
Ore workers, refiners, and contract smiths.

### The Lantern Circle
Warders, signal-keepers, and quiet students of Deep Heart disturbances.

### The Underline Syndics
Salvagers, negotiators, and licensed ruin brokers who are not always as licensed as advertised.

Faction access should come later, but names and world logic should be consistent from the start.

---

## Itemization Philosophy

Items should feel practical first, mystical second.

### Equipment Tiers Example

Instead of bronze / iron / steel clones, use distinct material lines such as:

- **Ashwood**
- **Redwake Iron**
- **Duskiron**
- **Fensteel**
- **Vaultglass**
- **Heartwrought Alloy**

### Item Categories

- tools,
- weapons,
- field gear,
- food,
- raw materials,
- refined materials,
- salvage,
- ward tokens,
- bait and lure items,
- crafting parts,
- utility consumables.

### Early Tool Names

- Rough Ash Hatchet
- Quarry Pick
- Reedline Rod
- Camp Skillet
- Carver’s Knife
- Surveyor’s Wand
- Marking Chalk Bundle
- Tinhook Lantern
- Patchplate Buckler
- Ironspine Spear

---

## Creature Direction

Creatures should avoid direct genre copy-paste.

### Early Creatures

- **Cinderhare** — quick skittish animal, non-aggressive, early resource creature.
- **Mossback Toad** — bulky marsh animal with low-threat attacks.
- **Thornling** — root-and-fiber ambusher from Brackroot and Ashfen edges.
- **Slatebeak** — cliff-bird scavenger around quarry shelves.
- **Mireling** — wetland stalker drawn to lanterns and bait.

### Mid Creatures

- **Chapel Wisp** — unstable light-being around Tidemark ruins.
- **Vault Skulk** — ruin predator using line-of-sight ambush behavior.
- **Hushfang** — pack creature of the mineral woods.
- **Ember Ram** — horned beast from heated ridges.
- **Silt Widow** — marsh web-spitter.

### Late Creatures

- **Root Stag** — territorial ancient woodland giant.
- **Lantern Eel** — electrical shoreline predator.
- **Deep Husk** — animated worker-shell near the buried engines.
- **Glassjaw Sentinel** — vault construct.
- **Heartwake Seraph** — very late-game Deep Heart guardian.

---

## Quest Style

Quests should not feel like copied comedy errands. They should be grounded in labor, logistics, survival, repair, route access, and local mystery.

### Good Quest Types

- restore a broken ferry route,
- gather resin and fiber to patch a lantern mast,
- investigate why quarry ore has begun arriving warm,
- mark safe passage through fog banks,
- reinforce shrine seals,
- identify what is disturbing the fish runs,
- recover a survey ledger from a root-choked ruin stair,
- build a field kit for a trapped work crew.

### Bad Quest Types

- obvious milk/egg/flour meme clones,
- wink-at-the-player parody filler,
- “kill 10 rats” with no context,
- cartoonish fetch nonsense that does not fit the world.

---

## UI Direction

The UI must be practical and legible but not a nostalgia photocopy.

### UI Principles

- panel-based,
- diegetic-adjacent materials and textures,
- dark timber / iron / parchment-inspired surfaces,
- compact but readable,
- mobile-compatible,
- no direct mimicry of classic MMO panel placement.

### Core UI Surfaces

- HUD,
- inventory panel,
- equipment panel,
- skills panel,
- dialogue box,
- task journal,
- vendor interface,
- cooking / smithing / crafting panels,
- region map overlay,
- notifications / loot toasts.

---

## Save / Data Direction

Initial scope is single-player local persistence.

### Save Requirements

Persist:

- player position,
- inventory,
- equipment,
- skill XP and levels,
- unlocked recipes,
- completed tasks,
- vendor access state,
- region unlocks,
- world interactable resets where applicable.

### Data Principles

- content should be data-driven,
- skills, items, creatures, recipes, and regions should live in clear data modules,
- avoid hardcoding progression thresholds inside random components.

---

# Multi-Phase Build Plan

The entire point is to keep the agent from trying to land “the whole game” in one pull request and producing industrial-grade slop.

Each phase below is deliberately narrow.

---

## Phase 01 — Repo Audit and Build Baseline

**Goal:** establish a stable base and remove hidden chaos.

**Deliverables:**
- confirm project boots cleanly,
- document current file structure,
- remove broken imports and dead references,
- verify dev/build commands,
- add a short contributor/build doc for agent continuity.

**Do not touch:** gameplay systems beyond what is necessary to boot.

---

## Phase 02 — Rendering Skeleton

**Goal:** create a minimal world scene with camera, lighting, and a flat test plane.

**Deliverables:**
- scene manager,
- renderer setup,
- directional light + ambient light,
- camera root,
- basic game loop,
- one visible low-poly test environment.

---

## Phase 03 — Player Controller Base

**Goal:** make the player avatar move correctly in 3D space.

**Deliverables:**
- controllable player capsule or placeholder model,
- walk / idle state,
- desktop movement,
- camera follow behavior,
- movement boundaries.

---

## Phase 04 — Orbit and Zoom Camera Controls

**Goal:** get the over-the-shoulder view feeling right.

**Deliverables:**
- mouse orbit,
- zoom in/out,
- pitch clamp,
- collision-aware fallback if camera clips,
- smoothing.

---

## Phase 05 — Interaction Targeting Base

**Goal:** establish universal object interaction.

**Deliverables:**
- interact raycast or proximity system,
- hover / target state,
- interaction prompt,
- shared interactable interface.

---

## Phase 06 — Core State Store

**Goal:** centralize player/game state.

**Deliverables:**
- Zustand store skeleton,
- player stats section,
- inventory section,
- skills section,
- settings section,
- save/load hooks placeholders only where functional.

---

## Phase 07 — Hushwood Blockout

**Goal:** build the starter settlement as a playable spatial layout.

**Deliverables:**
- roads,
- 3–5 simple structures,
- commons area,
- forge area,
- shoreline or pond edge,
- collision boundaries,
- navigation space tested.

---

## Phase 08 — Hushwood NPC Placement

**Goal:** place foundational non-combat NPCs.

**Deliverables:**
- 4–6 named NPCs,
- idle locations,
- basic facing/ambient loops,
- interact labels,
- no deep dialogue yet.

---

## Phase 09 — HUD Foundation

**Goal:** add non-intrusive runtime UI.

**Deliverables:**
- player name / status strip,
- health display,
- stamina or action state if used,
- interaction prompt zone,
- notification feed base.

---

## Phase 10 — Inventory Foundation

**Goal:** make items exist in a functional inventory.

**Deliverables:**
- inventory data model,
- slot grid,
- stack rules,
- add/remove item behavior,
- tooltip base.

---

## Phase 11 — Item Data Schema

**Goal:** define robust item data structure before content sprawl starts.

**Deliverables:**
- item type taxonomy,
- icon reference rules,
- stackability flag,
- value field,
- equipability rules,
- tool metadata,
- consumable metadata.

---

## Phase 12 — Starter Item Set

**Goal:** add a tiny, fully functional original starter item pool.

**Deliverables:**
- Rough Ash Hatchet,
- Quarry Pick,
- Reedline Rod,
- Camp Rations,
- Ashwood Log,
- Reed Fiber,
- Small Stone,
- Cinderhare Meat.

---

## Phase 13 — Skills Panel Foundation

**Goal:** create a working skill UI with no fake categories.

**Deliverables:**
- skill list panel,
- level + XP display,
- hover descriptions,
- clean update flow from store.

---

## Phase 14 — XP Curve Base

**Goal:** define progression rules before systems branch out.

**Deliverables:**
- level thresholds,
- XP grant utility,
- level-up event hook,
- level-up notification.

---

## Phase 15 — Woodcutting Node System

**Goal:** create the first real skilling loop.

**Deliverables:**
- tree interactables,
- gather timing,
- inventory reward,
- XP reward,
- stump / respawn behavior,
- fail state if no hatchet.

---

## Phase 16 — Beginner Tree Variants

**Goal:** differentiate resource tiers.

**Deliverables:**
- Ash Sapling,
- Ashwood Tree,
- Ironbark Youngling,
- level requirements,
- different log outputs,
- basic visual distinction.

---

## Phase 17 — Mining Node System

**Goal:** create second real skilling loop.

**Deliverables:**
- rock interactables,
- gather timing,
- ore drops,
- XP rewards,
- depleted state,
- respawn behavior.

---

## Phase 18 — Quarry Region Slice

**Goal:** add Redwake Quarry as a basic external zone.

**Deliverables:**
- route from Hushwood,
- quarry terrain blockout,
- mining nodes,
- one foreman NPC,
- traversal and collision pass.

---

## Phase 19 — Fishing Node System

**Goal:** create third gathering loop.

**Deliverables:**
- fishing spots,
- cast timer,
- fish outputs,
- baitless starter mode or simple bait design,
- XP rewards,
- node cycling behavior.

---

## Phase 20 — Shoreline Region Slice

**Goal:** add Gloamwater Bank as a functional skilling zone.

**Deliverables:**
- dock or bank edge layout,
- fishing nodes,
- reed foraging nodes,
- one fisher NPC,
- one cookfire or rack nearby.

---

## Phase 21 — Foraging System Base

**Goal:** establish non-tree, non-rock gathering.

**Deliverables:**
- reed clumps,
- marsh herbs,
- resin globs,
- inventory rewards,
- XP grants,
- level requirements if needed.

---

## Phase 22 — Cooking System Foundation

**Goal:** make gathered food useful.

**Deliverables:**
- raw vs cooked items,
- cook station interaction,
- cook success flow,
- healing value,
- XP rewards,
- failed cook output only if intentionally designed.

---

## Phase 23 — Starter Shop / Trade Interface

**Goal:** let the player buy and sell items with an actual functioning UI.

**Deliverables:**
- one vendor inventory,
- buy/sell logic,
- currency item or numeric currency system,
- value rules,
- no fake stock tabs.

---

## Phase 24 — Currency and Economy Base

**Goal:** define item values and basic economy behavior.

**Deliverables:**
- currency naming,
- item values for all existing content,
- vendor transaction validation,
- insufficient funds handling.

---

## Phase 25 — Storage / Ledger Hall System

**Goal:** create a banking equivalent without cloning known MMO interface conventions.

**Deliverables:**
- personal storage access point,
- deposit / withdraw,
- stack persistence,
- simple sorting,
- clear separation from inventory.

---

## Phase 26 — Equipment System Foundation

**Goal:** allow actual gear use.

**Deliverables:**
- equipment slots,
- equip/unequip logic,
- stat hooks,
- tool slot rules if separate,
- UI reflection.

---

## Phase 27 — Starter Gear Content

**Goal:** add functional early gear.

**Deliverables:**
- Patchplate Buckler,
- Roughhide Vest,
- Ashwood Club,
- Ironspine Spear,
- Marsh Boots,
- equip stats and restrictions.

---

## Phase 28 — Basic Creature Framework

**Goal:** make non-player living entities function.

**Deliverables:**
- spawn system,
- idle roaming,
- pursuit bounds,
- despawn/reset logic,
- creature data schema.

---

## Phase 29 — Non-Aggressive Wildlife

**Goal:** populate the world with low-risk life.

**Deliverables:**
- Cinderhare,
- Slatebeak,
- ambient movement,
- optional harvestable drops.

---

## Phase 30 — Starter Hostile Creatures

**Goal:** introduce low-level combat risk.

**Deliverables:**
- Thornling,
- Mossback Toad,
- aggro radius,
- attack cadence,
- health,
- defeat and respawn flow.

---

## Phase 31 — Combat Loop Foundation

**Goal:** make targetable combat actually playable.

**Deliverables:**
- target selection,
- attack start,
- damage application,
- hit cooldown,
- player death or defeat fallback,
- creature death handling.

---

## Phase 32 — Loot Drop System

**Goal:** defeated creatures should produce grounded rewards.

**Deliverables:**
- loot table schema,
- ground item or direct loot implementation,
- pickup interaction,
- rarity weighting.

---

## Phase 33 — Food Consumption in Combat

**Goal:** make cooking matter in danger.

**Deliverables:**
- consume action,
- heal effect,
- cooldown if needed,
- combat-safe use handling.

---

## Phase 34 — Respawn / Safe Recovery Loop

**Goal:** losing should not nuke flow.

**Deliverables:**
- defeat location,
- item retention rule,
- recovery messaging,
- health reset,
- anti-softlock validation.

---

## Phase 35 — Brackroot Trail Zone

**Goal:** create the first combat-adjacent route out of town.

**Deliverables:**
- traversal route,
- woodcutting nodes,
- low creatures,
- one hidden cache for future surveying tie-in.

---

## Phase 36 — Dialogue Framework

**Goal:** NPCs need structured dialogue, not one-line props.

**Deliverables:**
- branching dialogue data,
- talk UI,
- accept/decline hooks,
- repeatable state handling.

---

## Phase 37 — Task / Quest Framework

**Goal:** implement basic work order progression.

**Deliverables:**
- task data model,
- objective tracking,
- completion rewards,
- journal entry support.

---

## Phase 38 — Starter Tasks Set

**Goal:** add first practical tasks.

**Deliverables:**
- deliver cut wood,
- stock camp fish,
- gather quarry stone,
- investigate warm runoff,
- each fully completable.

---

## Phase 39 — Journal UI

**Goal:** display active and completed tasks cleanly.

**Deliverables:**
- active task list,
- objective breakdown,
- completion state,
- reward preview.

---

## Phase 40 — Smithing Foundation

**Goal:** let mined ore become useful progression.

**Deliverables:**
- smeltable resources,
- furnace station,
- bar creation,
- basic XP reward,
- smithing panel base.

---

## Phase 41 — Tool Upgrade Recipes

**Goal:** connect gathering skills into better tools.

**Deliverables:**
- upgraded hatchet,
- upgraded pick,
- improved rod,
- requirements,
- stat benefits.

---

## Phase 42 — Carving Skill Foundation

**Goal:** add distinct material shaping loop.

**Deliverables:**
- carving station or handheld interface,
- wood/bone utility outputs,
- item requirements,
- XP rewards.

---

## Phase 43 — Tinkering Skill Foundation

**Goal:** add practical utility crafting.

**Deliverables:**
- lantern parts,
- reinforced hook,
- bait basket,
- repair clamp,
- progression hooks for later systems.

---

## Phase 44 — Surveying Skill Foundation

**Goal:** add an original discovery skill.

**Deliverables:**
- activate surveying mode,
- detect nearby hidden cache spots,
- reveal temporary markers,
- reward salvage or rare resource.

---

## Phase 45 — Hidden Cache System

**Goal:** make surveying materially worthwhile.

**Deliverables:**
- buried cache points,
- reveal/pickup flow,
- randomized salvage pool,
- cooldown/reset behavior.

---

## Phase 46 — Warding Skill Foundation

**Goal:** add occult utility without overbuilding spellcasting.

**Deliverables:**
- craft simple ward marks,
- place or consume ward effect,
- one environmental protection use case,
- one creature deterrence use case.

---

## Phase 47 — Tidemark Chapel Zone

**Goal:** introduce first mystic-hazard region.

**Deliverables:**
- chapel layout,
- flood or mist hazard,
- ward-relevant interactions,
- one new NPC,
- one new creature type.

---

## Phase 48 — Environmental Hazard System

**Goal:** make certain regions mechanically distinct.

**Deliverables:**
- hazard volume framework,
- damage or debuff over time,
- warning UI,
- protection via item/ward.

---

## Phase 49 — Audio Foundation

**Goal:** add enough sound to make the world feel alive.

**Deliverables:**
- ambient loop by region,
- interaction SFX,
- gathering SFX,
- simple music routing,
- mute/volume settings.

---

## Phase 50 — Save / Load System

**Goal:** persist meaningful progression.

**Deliverables:**
- local save trigger,
- load on boot,
- state validation,
- version-safe fallback behavior.

---

## Phase 51 — Main Menu and Continue Flow

**Goal:** make the game feel like an actual product.

**Deliverables:**
- title screen,
- continue/new game,
- settings access,
- save slot structure if used.

---

## Phase 52 — Mobile Controls Foundation ✅

**Goal:** ensure the game is not desktop-only cosplay.

**Deliverables:**
- virtual joystick,
- mobile interaction button,
- camera swipe,
- responsive HUD spacing,
- tap targeting.

---

## Phase 53 — Input Unification Pass ✅

**Goal:** standardize desktop and mobile actions.

**Deliverables:**
- shared action abstraction (`src/engine/inputActions.ts` — `InputAction` type + `KEY_TO_ACTION` map + `dispatchPanelKey`),
- no broken feature parity (Journal 📖 and Ledger 🏛️ buttons added to MobileControls),
- consistent targeting and interaction behavior (both click and tap share `selectTargetAtClientPoint`; all panel toggles route through unified `onInputAction`).

---

## Phase 54 — Minimap / Region Map Foundation

**Goal:** give spatial awareness without cloning iconic MMO layouts.

**Deliverables:**
- simple minimap,
- local marker support,
- player orientation,
- region overlay option.

---

## Phase 55 — Vendor Diversity

**Goal:** separate vendor roles meaningfully.

**Deliverables:**
- general trader,
- toolsmith,
- fisher supplier,
- buy/sell constraints,
- stock identity.

---

## Phase 56 — Creature Behavior Improvement Pass

**Goal:** stop bad AI from making the world feel fake.

**Deliverables:**
- leash logic,
- better return-to-spawn,
- obstacle awareness improvements,
- less jitter / swarm nonsense.

---

## Phase 57 — Ashfen Copse Zone

**Goal:** add a visually distinct advanced gathering/combat area.

**Deliverables:**
- mineral wood visuals,
- advanced trees,
- resin nodes,
- Hushfang or Ember Ram presence,
- atmosphere pass.

---

## Phase 58 — Resource Tier Expansion

**Goal:** broaden progression without exploding scope.

**Deliverables:**
- Duskiron Ore,
- Ironbark Log,
- Marsh Glass Reed,
- higher recipe requirements,
- updated vendor and loot usage.

---

## Phase 59 — Cooking Expansion

**Goal:** make food choices interesting.

**Deliverables:**
- multiple fish and meat dishes,
- healing differences,
- one buff food path,
- better recipe panel clarity.

---

## Phase 60 — Combat Equipment Stats Pass

**Goal:** make gear choice matter.

**Deliverables:**
- attack value hooks,
- defense value hooks,
- weapon cadence or type distinctions,
- tool vs weapon separation cleanup.

---

## Phase 61 — Ranged Combat Foundation

**Goal:** add a second combat style carefully.

**Deliverables:**
- basic ranged weapon,
- projectile logic,
- ammo item if used,
- creature response handling.

---

## Phase 62 — Creature Loot Expansion

**Goal:** connect combat to crafting and economy.

**Deliverables:**
- hides,
- bone shards,
- glands,
- resinous organs,
- crafting uses for all new drops.

---

## Phase 63 — Armor and Clothing Craft Routes

**Goal:** add more player-made progression.

**Deliverables:**
- hide armor route,
- patchplate upgrades,
- utility clothing with skill relevance,
- crafting requirements.

---

## Phase 64 — Tidemark Storyline Arc

**Goal:** build the first multi-step regional narrative.

**Deliverables:**
- 3–5 connected tasks,
- chapel hazard explanation,
- warding relevance,
- region reward unlock.

---

## Phase 65 — Hollow Vault Steps Blockout

**Goal:** add a more dangerous ruin-adjacent region.

**Deliverables:**
- descending terrain,
- ruin doors,
- creature population,
- hidden surveying content,
- progression gate.

---

## Phase 66 — Salvage System

**Goal:** formalize ruin-derived materials.

**Deliverables:**
- salvage item category,
- salvage nodes or drops,
- use in tinkering / warding / vendors.

---

## Phase 67 — Locked Gate / Requirement Framework

**Goal:** make progression gating explicit and reusable.

**Deliverables:**
- skill-gated nodes,
- task-gated doors,
- item-gated access,
- clear feedback UI.

---

## Phase 68 — Light and Visibility Mechanics

**Goal:** make lantern and atmosphere systems matter in select areas.

**Deliverables:**
- darkness modifier in chosen zones,
- lantern equip/use support,
- visibility gameplay kept simple and readable.

---

## Phase 69 — Region-Specific Music and Ambience Pass

**Goal:** strengthen identity.

**Deliverables:**
- Hushwood ambience,
- quarry ambience,
- shoreline ambience,
- chapel ambience,
- smooth transitions.

---

## Phase 70 — Crafting Panel UX Pass

**Goal:** stop crafting interfaces from feeling like debug menus.

**Deliverables:**
- filter/sort recipes,
- requirement display,
- output preview,
- missing-material feedback.

---

## Phase 71 — Animation Integration Pass

**Goal:** reduce placeholder feel.

**Deliverables:**
- better gather loops,
- attack loops,
- interact motion,
- creature hit react minimum set.

---

## Phase 72 — VFX Pass I

**Goal:** improve feedback without overdoing spectacle.

**Deliverables:**
- gather spark / chip effects,
- hit flashes,
- level-up cue,
- ward activation effect.

---

## Phase 73 — Tool Durability or Wear Decision Phase

**Goal:** consciously choose whether tools degrade.

**Deliverables:**
- either implement simple durability,
- or explicitly reject durability and document why,
- no half-system.

---

## Phase 74 — Marrowfen Blockout

**Goal:** add dangerous mid-late region with unique mood.

**Deliverables:**
- murky water channels,
- gas vent hazards,
- rare foraging nodes,
- dangerous creatures,
- lantern relevance.

---

## Phase 75 — Mid-Tier Questlines

**Goal:** create region-bridging progression.

**Deliverables:**
- 3 quest chains connecting Hushwood, Quarry, Chapel, and Marsh,
- each with practical rewards or access unlocks.

---

## Phase 76 — Faction Trust Framework

**Goal:** begin deeper progression structure.

**Deliverables:**
- faction rep data model,
- gain sources,
- simple unlock usage,
- no sprawling social simulation.

---

## Phase 77 — Faction Vendors / Rewards

**Goal:** give faction trust utility.

**Deliverables:**
- one faction-specific vendor or recipe route,
- one tool or gear unlock,
- one convenience reward.

---

## Phase 78 — Belowglass Vaults Entrance Slice

**Goal:** introduce late-game ruin identity.

**Deliverables:**
- vault threshold area,
- construct enemies,
- salvage tier increase,
- clear access requirement.

---

## Phase 79 — Advanced Smithing and Alloy Routes

**Goal:** add late material progression.

**Deliverables:**
- Fensteel,
- Vaultglass fittings,
- Heartwrought precursor materials,
- higher-tier recipes.

---

## Phase 80 — Advanced Surveying and Secret Paths

**Goal:** deepen exploration mastery.

**Deliverables:**
- hidden shortcuts,
- buried doors,
- rare revealables,
- map annotations if appropriate.

---

## Phase 81 — Advanced Warding Content

**Goal:** expand the occult utility lane.

**Deliverables:**
- stronger protection marks,
- area-clearing seals,
- special ruin requirements,
- anti-wisp functionality.

---

## Phase 82 — Higher Threat Creature Pack

**Goal:** flesh out late combat ecology.

**Deliverables:**
- Deep Husk,
- Glassjaw Sentinel,
- Lantern Eel,
- improved loot and behavior definitions.

---

## Phase 83 — Boss Encounter Framework

**Goal:** support rare major fights without rewriting combat from scratch.

**Deliverables:**
- arena state rules,
- boss health bar style,
- special behavior hooks,
- reset logic.

---

## Phase 84 — First Boss Encounter

**Goal:** add one real capstone challenge.

**Deliverables:**
- boss design such as Root Stag or Deep Heart guardian,
- gated encounter,
- unique drops,
- full completion handling.

---

## Phase 85 — Loot Table Balance Pass

**Goal:** stop progression from becoming degenerate farm spam.

**Deliverables:**
- drop rate tuning,
- node yield tuning,
- food economy sanity pass,
- vendor value sanity pass.

---

## Phase 86 — New Player Experience Pass

**Goal:** reduce friction without killing discovery.

**Deliverables:**
- better starting guidance,
- cleaner prompts,
- no info-dump walls,
- first-hour progression clarity.

---

## Phase 87 — Performance Pass I

**Goal:** keep browser play stable.

**Deliverables:**
- draw call reduction targets,
- culling pass,
- update loop cleanup,
- obvious memory leak checks.

---

## Phase 88 — LOD / Streaming Pass

**Goal:** support larger regions cleanly.

**Deliverables:**
- distance-based model simplification or visibility control,
- region chunk activation rules,
- no ugly pop-in where avoidable.

---

## Phase 89 — Accessibility / Readability Pass

**Goal:** improve usability.

**Deliverables:**
- font size review,
- contrast checks,
- reduced motion option if needed,
- clearer interaction indicators.

---

## Phase 90 — Save Robustness and Migration Pass

**Goal:** stop future updates from nuking player progress.

**Deliverables:**
- save schema versioning,
- migration fallback logic,
- corruption recovery handling.

---

## Phase 91 — Content Density Pass

**Goal:** eliminate dead stretches.

**Deliverables:**
- ambient props,
- minor gatherables,
- small interaction points,
- route landmarks.

---

## Phase 92 — UI Identity Pass

**Goal:** make the UI feel authored, not default.

**Deliverables:**
- stronger material language,
- icon consistency,
- spacing pass,
- panel polish,
- still no nostalgia-clone layout.

---

## Phase 93 — Audio Polish Pass

**Goal:** remove repetition and dead silence.

**Deliverables:**
- more region cues,
- creature SFX pass,
- craft station sounds,
- menu / UI audio refinement.

---

## Phase 94 — World Cohesion Lore Pass

**Goal:** align names, tasks, flavor text, and environmental storytelling.

**Deliverables:**
- item descriptions,
- NPC summary text,
- task flavor pass,
- region signage or lore snippets.

---

## Phase 95 — Regression Testing Sweep

**Goal:** verify old phases did not get wrecked by later ones.

**Deliverables:**
- full feature checklist,
- skilling test routes,
- combat test routes,
- save/load tests,
- mobile checks.

---

## Phase 96 — Public Demo Slice Selection

**Goal:** identify the best playable vertical slice for outside testing.

**Deliverables:**
- selected regions,
- selected skills,
- selected questlines,
- content lock list.

---

## Phase 97 — Demo Polish Pass

**Goal:** make the chosen slice feel complete.

**Deliverables:**
- bug fixes,
- visual cleanup,
- progression smoothing,
- intro messaging,
- build stability.

---

## Phase 98 — Telemetry Hooks Decision

**Goal:** decide whether to add lightweight analytics later.

**Deliverables:**
- explicit yes/no decision,
- if yes, simple event hooks plan,
- if no, document why.

---

## Phase 99 — Expansion Backlog Authoring

**Goal:** organize post-demo work rather than improvising chaos.

**Deliverables:**
- ranked backlog,
- feature buckets,
- cut vs keep list,
- risk notes.

---

## Phase 100 — Release Candidate Stabilization

**Goal:** final prep before broader release.

**Deliverables:**
- top issue fixes,
- load-time review,
- content consistency pass,
- final smoke test.

---

# Initial Content Reference Appendix

## Starter NPCs

- **Edda Mire** — camp steward of Hushwood.
- **Tor Bracken** — wood hauler and practical early task giver.
- **Sella Vane** — cookfire quartermaster.
- **Iven Rusk** — quarry contact.
- **Brin Salt** — fisher and shoreline vendor.
- **Nairn Dusk** — quiet ward-adept linked to Tidemark Chapel.

## Starter Items

- Rough Ash Hatchet
- Quarry Pick
- Reedline Rod
- Camp Skillet
- Patchplate Buckler
- Ashwood Log
- Reed Fiber
- Redwake Ore
- Cinderhare Meat
- Marsh Herb Bundle
- Resin Clump
- Warm Scale Fish
- Lantern Wick
- Survey Chalk
- Bent Hook

## Starter Creatures

- Cinderhare
- Mossback Toad
- Thornling
- Slatebeak
- Mireling

## Mid-Game Items

- Ironbark Log
- Duskiron Ore
- Fensteel Bar
- Tinhook Lantern
- Ashmark Seal
- Reinforced Bait Cage
- Carver’s Knife
- Surveyor’s Wand
- Resin Torch
- Mire-Salt Pack

## Mid-Game Creatures

- Chapel Wisp
- Hushfang
- Ember Ram
- Silt Widow
- Vault Skulk

## Late-Game Materials

- Vaultglass Shard
- Heartwire Coil
- Pressure-Sintered Plate
- Old Seal Fragment
- Fensteel Rivet Pack
- Deep Husk Core

---

# Agent Execution Template for Every Phase

For every PR, the GitHub agent should append a section like this:

## Phase Summary
- What this PR implemented

## Systems Touched
- explicit list

## Systems Not Touched
- explicit list

## Functional Test Steps
1. launch game
2. do X
3. do Y
4. verify Z

## Screenshots
- screenshot 1
- screenshot 2
- screenshot 3

## Known Limitations
- honest list only

## Placeholder Check
- confirm no fake UI, no dead buttons, no unreachable content

---

# Final Instruction to the GitHub Agent

Do not try to hero-ball this.

Do not merge ten phases into one because the systems “seem related.” They always seem related. That is how codebases become landfill.

Do not add broad future architecture to impress nobody.

Do not create decorative systems that do not function.

Land **small, fully working, reviewable slices**.

That is how this becomes a real game instead of a beautifully structured hallucination.
