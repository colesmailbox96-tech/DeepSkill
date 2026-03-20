import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { createPlayer, updatePlayer } from './engine/player'
import {
  createCameraState,
  updateOrbitCamera,
  applyOrbitDrag,
  applyZoom,
} from './engine/followCamera'
import type { Interactable } from './engine/interactable'
import { createInteractionState } from './engine/interactable'
import { updateInteraction } from './engine/interaction'
import { buildHushwood } from './engine/hushwood'
import { updateNpcs } from './engine/npc'
import {
  buildTreeNodes,
  updateTreeNodes,
  fellTree,
  hasHatchet,
  getHatchetTier,
  getWoodcuttingLevel,
  VARIANT_CONFIG,
} from './engine/woodcutting'
import type { TreeNode } from './engine/woodcutting'
import {
  buildRockNodes,
  updateRockNodes,
  depleteRock,
  hasPickaxe,
  getPickaxeTier,
  getMiningLevel,
  ROCK_VARIANT_CONFIG,
} from './engine/mining'
import type { RockNode } from './engine/mining'
import { buildQuarry } from './engine/quarry'
import {
  buildFishingNodes,
  updateFishingNodes,
  depleteFishSpot,
  hasRod,
  getRodTier,
  getFishingLevel,
  FISH_SPOT_CONFIG,
} from './engine/fishing'
import type { FishingNode } from './engine/fishing'
import {
  buildShoreline,
} from './engine/shoreline'
import {
  buildForageNodes,
  updateForageNodes,
  depleteForageNode,
  getForagingLevel,
  FORAGE_VARIANT_CONFIG,
} from './engine/foraging'
import type { ForageNode } from './engine/foraging'
import {
  buildCookStation,
  findCookableIngredient,
  getCookingLevel,
} from './engine/cooking'
import type { CookRecipeConfig } from './engine/cooking'
import {
  buildFurnaceStation,
  findSmeltableOre,
  getForgingLevel,
  hasIngredientsFor,
  getToolSpeedFactor,
} from './engine/smithing'
import type { SmeltRecipeConfig, ForgeRecipeConfig } from './engine/smithing'
import { useSmithingStore } from './store/useSmithingStore'
import { buildBrackroot } from './engine/brackroot'
import { useGameStore } from './store/useGameStore'
import { useNotifications } from './store/useNotifications'
import { useFoodStore } from './store/useFoodStore'
import { getItem } from './data/items/itemRegistry'
import { PlayerStrip } from './ui/hud/PlayerStrip'
import { NotificationFeed } from './ui/hud/NotificationFeed'
import { InventoryPanel } from './ui/hud/InventoryPanel'
import { SkillsPanel } from './ui/hud/SkillsPanel'
import { ShopPanel } from './ui/hud/ShopPanel'
import { LedgerPanel } from './ui/hud/LedgerPanel'
import { EquipmentPanel } from './ui/hud/EquipmentPanel'
import { MobileControls } from './ui/hud/MobileControls'
import { CombatTargetHud } from './ui/hud/CombatTargetHud'
import { buildCreatures, updateCreatures, triggerFlee } from './engine/creature'
import type { Creature } from './engine/creature'
import {
  createCombatState,
  updateCombat,
  setTarget,
} from './engine/combat'
import { rollLoot } from './engine/loot'
import { useCombatStore } from './store/useCombatStore'
import { RESPAWN_X, RESPAWN_Y, RESPAWN_Z, RESPAWN_LOCATION_LABEL } from './engine/respawn'
import { useRespawnStore } from './store/useRespawnStore'
import { RespawnOverlay } from './ui/hud/RespawnOverlay'
import { DialoguePanel } from './ui/hud/DialoguePanel'
import { registerAllDialogues } from './data/dialogue/npcDialogues'
import { useDialogueStore } from './store/useDialogueStore'
import { TaskTrackerHud } from './ui/hud/TaskTrackerHud'
import { JournalPanel } from './ui/hud/JournalPanel'
import { SmithingPanel } from './ui/hud/SmithingPanel'
import { registerAllTasks } from './data/tasks/taskRegistry'
import { useTaskStore } from './store/useTaskStore'
import { getTask } from './engine/task'
import './App.css'

// Register NPC dialogue trees once at module load time.
registerAllDialogues()

// Register task definitions once at module load time.
registerAllTasks()

// ── Gather-session types (used by both woodcutting and mining loops) ───────────

/** Tracks an active woodcutting chop: which tree and elapsed time. */
interface ChoppingSession { node: TreeNode; elapsed: number }

/** Tracks an active mining attempt: which rock and elapsed time. */
interface MiningSession { node: RockNode; elapsed: number }

/** Tracks an active fishing cast: which spot and elapsed cast time. */
interface FishingSession { node: FishingNode; elapsed: number }

/** Tracks an active hearthcraft cook: which recipe and elapsed cook time. */
interface CookingSession { recipe: CookRecipeConfig; elapsed: number }
/** Phase 40 — Active smelt session: recipe being smelted + elapsed time. */
interface SmeltSession { recipe: SmeltRecipeConfig; elapsed: number }
/** Phase 41 — Active forge session: recipe being forged + elapsed time. */
interface ForgeSession  { recipe: ForgeRecipeConfig;  elapsed: number }

function App() {
  const sceneRef = useRef<HTMLDivElement>(null)
  const promptRef = useRef<HTMLDivElement>(null)

  // Phase 06 — subscribe to player name from the global store
  const playerName = useGameStore((s) => s.playerStats.name)

  // ── Phase 37 — Task Framework ────────────────────────────────────────────
  // Subscribe to the currently open dialogue NPC so talk-type objectives can
  // be marked as complete when the player speaks to the target NPC.
  const openDialogueNpcName = useDialogueStore((s) => s.activeTree?.npcName ?? null)

  // Auto-accept the introductory task once at game start (runs once because
  // the dependency array is empty; acceptTask is idempotent for known tasks).
  useEffect(() => {
    useTaskStore.getState().acceptTask('word_from_the_elder')
    useTaskStore.getState().acceptTask('warm_runoff')
    // Phase 38 — practical starter tasks
    useTaskStore.getState().acceptTask('haul_for_the_hearth')
    useTaskStore.getState().acceptTask('stock_the_camp_stores')
    useTaskStore.getState().acceptTask('stone_from_the_quarry')
  }, [])

  // Advance 'talk' objectives and handle 'deliver' objectives when the player
  // opens dialogue with an NPC.
  useEffect(() => {
    if (!openDialogueNpcName) return
    const { active, updateObjective } = useTaskStore.getState()
    for (const record of active) {
      const def = getTask(record.taskId)
      if (!def) continue
      for (const obj of def.objectives) {
        // ── Talk objectives ──────────────────────────────────────────────
        if (
          obj.type === 'talk' &&
          obj.targetId === openDialogueNpcName &&
          (record.progress[obj.id] ?? 0) < obj.required
        ) {
          updateObjective(record.taskId, obj.id, 1)
        }

        // ── Deliver objectives ───────────────────────────────────────────
        // A deliver objective completes when:
        //   1. The player is speaking to the target NPC.
        //   2. All companion gather objectives on this task are satisfied.
        //   3. The player's inventory contains the required items.
        // Items from the companion gather objectives are consumed on delivery.
        if (
          obj.type === 'deliver' &&
          obj.targetId === openDialogueNpcName &&
          (record.progress[obj.id] ?? 0) < obj.required
        ) {
          const gatherObjs = def.objectives.filter((o) => o.type === 'gather')
          const allGathered =
            gatherObjs.length > 0 &&
            gatherObjs.every(
              (o) => (record.progress[o.id] ?? 0) >= o.required,
            )

          if (allGathered) {
            // Verify the player still has all the required items before
            // consuming them (they may have manually dropped some since
            // the gather objective completed).
            const { inventory, removeItem } = useGameStore.getState()
            const canDeliver = gatherObjs.every((o) => {
              if (!o.targetId) return true
              const slot = inventory.slots.find((s) => s.id === o.targetId)
              return slot !== undefined && slot.quantity >= o.required
            })

            if (canDeliver) {
              for (const gatherObj of gatherObjs) {
                if (gatherObj.targetId) {
                  removeItem(gatherObj.targetId, gatherObj.required)
                }
              }
              updateObjective(record.taskId, obj.id, 1)
            } else {
              useNotifications
                .getState()
                .push(
                  `You no longer have all the required items to deliver to ${openDialogueNpcName}.`,
                  'warning',
                )
            }
          } else {
            useNotifications
              .getState()
              .push(
                `Gather the required items before delivering them to ${openDialogueNpcName}.`,
                'info',
              )
          }
        }
      }
    }
  }, [openDialogueNpcName])

  // ── Mobile controls shared state ────────────────────────────────────────
  /** Joystick direction written by MobileControls, read by the game loop. */
  const mobileJoystickRef = useRef<{ x: number; z: number }>({ x: 0, z: 0 })
  /** Interact callback set by the game loop, called by the mobile interact button. */
  const mobileInteractRef = useRef<() => void>(() => {})
  /** True when the player is in range of an interactable – drives the interact button pulse. */
  const mobileHasTargetRef = useRef(false)
  /** Smelt callback set by the game loop, called by SmithingPanel recipe buttons. */
  const smeltFromPanelRef = useRef<(recipe: import('./engine/smithing').SmeltRecipeConfig) => void>(() => {})
  /** Forge callback set by the game loop, called by SmithingPanel forge buttons. */
  const forgeFromPanelRef = useRef<(recipe: import('./engine/smithing').ForgeRecipeConfig) => void>(() => {})

  useEffect(() => {
    const container = sceneRef.current
    if (!container) {
      return
    }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1b2024)

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      100,
    )
    camera.position.set(0, 3.8, 7)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    const updateViewport = () => {
      const rect = renderer.domElement.getBoundingClientRect()
      const width = rect.width || container.clientWidth
      const height = rect.height || container.clientHeight
      if (!width || !height) {
        return
      }
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
    }

    // ResizeObserver fires once CSS layout has settled (including on first paint
    // and on orientation change) which makes it more reliable than a one-shot
    // updateViewport() call or a window 'resize' listener alone.
    const resizeObserver = new ResizeObserver(updateViewport)
    resizeObserver.observe(renderer.domElement)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45)
    const directionalLight = new THREE.DirectionalLight(0xffe2c2, 1.25)
    directionalLight.position.set(6, 10, 4)
    scene.add(ambientLight, directionalLight)

    // Phase 07 — Hushwood settlement blockout; Phase 08 — NPC placement
    const { collidables, interactables, npcs } = buildHushwood(scene)

    // Helper: choose correct English indefinite article for a noun.
    const article = (noun: string) => (/^[aeiou]/i.test(noun) ? 'an' : 'a')

    // Phase 15 — Woodcutting node system
    // Chopping session: tracks which tree is being cut and elapsed chop time.
    const choppingRef = { current: null as ChoppingSession | null }

    const onChopStart = (node: TreeNode) => {
      if (!hasHatchet()) {
        useNotifications.getState().push('You need a hatchet to chop trees.', 'info')
        return
      }
      // Level requirement check
      const cfg = VARIANT_CONFIG[node.variant]
      if (getWoodcuttingLevel() < cfg.levelReq) {
        useNotifications.getState().push(
          `You need level ${cfg.levelReq} Woodcutting to chop this.`,
          'info',
        )
        return
      }
      // Already chopping this exact tree — do nothing.
      if (choppingRef.current?.node === node) return
      choppingRef.current = { node, elapsed: 0 }
      useNotifications.getState().push(`You begin chopping the ${cfg.label.toLowerCase()}…`, 'info')
    }

    const treeNodes = buildTreeNodes(scene, interactables, onChopStart)

    // Phase 17 — Mining node system
    // Mining session: tracks which rock is being mined and elapsed mine time.
    const miningRef = { current: null as MiningSession | null }

    const onMineStart = (node: RockNode) => {
      if (!hasPickaxe()) {
        useNotifications.getState().push('You need a pickaxe to mine rocks.', 'info')
        return
      }
      // Level requirement check
      const cfg = ROCK_VARIANT_CONFIG[node.variant]
      if (getMiningLevel() < cfg.levelReq) {
        useNotifications.getState().push(
          `You need level ${cfg.levelReq} Mining to mine this.`,
          'info',
        )
        return
      }
      // Already mining this exact rock — do nothing.
      if (miningRef.current?.node === node) return
      miningRef.current = { node, elapsed: 0 }
      useNotifications.getState().push(`You begin mining the ${cfg.label.toLowerCase()}…`, 'info')
    }

    const rockNodes = buildRockNodes(scene, interactables, onMineStart)

    // Phase 18 — Quarry Region Slice
    // Build Redwake Quarry zone and merge its results into the shared collections.
    const quarry = buildQuarry(scene, interactables, onMineStart)
    collidables.push(...quarry.collidables)
    const allRockNodes = [...rockNodes, ...quarry.rockNodes]

    // Phase 19 — Fishing Node System
    // Fishing session: tracks which spot is being fished and elapsed cast time.
    const fishingRef = { current: null as FishingSession | null }

    const onCastStart = (node: FishingNode) => {
      if (!hasRod()) {
        useNotifications.getState().push('You need a fishing rod to fish here.', 'info')
        return
      }
      // Level requirement check
      const cfg = FISH_SPOT_CONFIG[node.variant]
      if (getFishingLevel() < cfg.levelReq) {
        useNotifications.getState().push(
          `You need level ${cfg.levelReq} Fishing to fish here.`,
          'info',
        )
        return
      }
      // Already casting at this exact spot — do nothing.
      if (fishingRef.current?.node === node) return
      fishingRef.current = { node, elapsed: 0 }
      useNotifications.getState().push(`You cast your line at the ${cfg.label.toLowerCase()}…`, 'info')
    }

    const fishingNodes = buildFishingNodes(scene, interactables, onCastStart)

    // Phase 21 — Foraging System Base
    // Foraging is instant (no session timer) — level is checked, reward granted,
    // and the node depleted all within this single callback.

    /**
     * Phase 38 — Advance any active 'gather' objectives that match `itemId`.
     * Called after every successful resource collection (woodcutting, mining,
     * fishing, foraging) so that gather-type task objectives track in real time.
     */
    function advanceGatherObjectives(itemId: string): void {
      const { active, updateObjective } = useTaskStore.getState()
      for (const record of active) {
        const def = getTask(record.taskId)
        if (!def) continue
        for (const obj of def.objectives) {
          if (
            obj.type === 'gather' &&
            obj.targetId === itemId &&
            (record.progress[obj.id] ?? 0) < obj.required
          ) {
            updateObjective(record.taskId, obj.id, 1)
          }
        }
      }
    }

    const onForageStart = (node: ForageNode) => {
      const cfg = FORAGE_VARIANT_CONFIG[node.variant]
      if (getForagingLevel() < cfg.levelReq) {
        useNotifications.getState().push(
          `You need level ${cfg.levelReq} Foraging to gather this.`,
          'info',
        )
        return
      }
      const { addItem, grantSkillXp } = useGameStore.getState()
      const itemName = getItem(cfg.itemId)?.name ?? cfg.itemId
      const added = addItem({ id: cfg.itemId, name: itemName, quantity: 1 })
      if (!added) {
        useNotifications.getState().push(
          `Your inventory is too full to gather ${itemName.toLowerCase()}.`,
          'info',
        )
        return
      }
      grantSkillXp('foraging', cfg.xp)
      advanceGatherObjectives(cfg.itemId)
      useNotifications.getState().push(
        `You gather ${article(itemName)} ${itemName.toLowerCase()}.`,
        'success',
      )
      depleteForageNode(node)
    }

    // Hushwood-area forage nodes (marsh herbs + resin globs)
    const forageNodes = buildForageNodes(scene, interactables, onForageStart)

    // Phase 20 — Shoreline Region Slice
    // Build Gloamwater Bank zone and merge its results into the shared collections.
    const shoreline = buildShoreline(scene, interactables, onCastStart, onForageStart)
    collidables.push(...shoreline.collidables)
    const allFishingNodes = [...fishingNodes, ...shoreline.fishingNodes]
    const allNpcs         = [...npcs, ...quarry.npcs, ...shoreline.npcs]
    const allForageNodes  = [...forageNodes, ...shoreline.forageNodes]

    // Phase 35 — Brackroot Trail Zone
    // Build the southern combat-adjacent route and merge its results.
    const brackroot = buildBrackroot(scene, interactables, onChopStart)
    collidables.push(...brackroot.collidables)
    const allTreeNodes = [...treeNodes, ...brackroot.treeNodes]

    // Phase 22 — Cooking System Foundation
    // Cooking session: tracks which recipe is being cooked and elapsed cook time.
    const cookingRef = { current: null as CookingSession | null }

    const onCookStart = () => {
      // Already cooking — do nothing.
      if (cookingRef.current) return

      const { inventory } = useGameStore.getState()
      const recipe = findCookableIngredient(inventory.slots)

      if (!recipe) {
        useNotifications.getState().push('You have nothing to cook here.', 'info')
        return
      }
      if (getCookingLevel() < recipe.levelReq) {
        useNotifications.getState().push(
          `You need level ${recipe.levelReq} Hearthcraft to cook this.`,
          'info',
        )
        return
      }

      cookingRef.current = { recipe, elapsed: 0 }
      useNotifications.getState().push(
        `You begin cooking the ${recipe.label.toLowerCase()} over the hearthfire…`,
        'info',
      )
    }

    buildCookStation(scene, interactables, onCookStart)

    // Phase 40 — Smithing Foundation
    // Smelt session: tracks which recipe is being smelted and elapsed time.
    const smeltRef = { current: null as SmeltSession | null }
    // Captured after buildFurnaceStation(); read by onSmeltStart and the tick.
    let furnaceStation: import('./engine/smithing').FurnaceStation | null = null
    const FURNACE_INTERACT_RADIUS = 2.0

    const onSmeltStart = (recipe?: SmeltRecipeConfig) => {
      // Already smelting — do nothing.
      if (smeltRef.current) return

      // Proximity check — player must be standing at the furnace.
      if (furnaceStation) {
        const dist = player.mesh.position.distanceTo(furnaceStation.mesh.position)
        if (dist > FURNACE_INTERACT_RADIUS) {
          useNotifications.getState().push('You need to be at the furnace to smelt.', 'info')
          return
        }
      }

      const { inventory } = useGameStore.getState()
      // If called from the panel button a specific recipe is supplied; otherwise
      // auto-select the best available ore (interaction-key path).
      const chosen = recipe ?? findSmeltableOre(inventory.slots)

      if (!chosen) {
        useNotifications.getState().push('You have no ore ready to smelt here.', 'info')
        useSmithingStore.getState().openPanel()
        return
      }
      if (getForgingLevel() < chosen.levelReq) {
        useNotifications.getState().push(
          `You need level ${chosen.levelReq} Forging to smelt this.`,
          'info',
        )
        useSmithingStore.getState().openPanel()
        return
      }

      // Re-validate ore quantity — panel state may have been stale.
      const oreSlot = inventory.slots.find((s) => s.id === chosen.oreId)
      if (!oreSlot || oreSlot.quantity < chosen.oreQty) {
        useNotifications.getState().push(
          `You don't have enough ${chosen.label.toLowerCase()} to smelt.`,
          'info',
        )
        return
      }

      // Open the panel so the player can track progress.
      useSmithingStore.getState().openPanel()
      smeltRef.current = { recipe: chosen, elapsed: 0 }
      useNotifications.getState().push(
        `You place the ${chosen.label.toLowerCase()} into the furnace…`,
        'info',
      )
    }

    furnaceStation = buildFurnaceStation(scene, interactables, () => onSmeltStart())
    smeltFromPanelRef.current = (recipe) => onSmeltStart(recipe)

    // Phase 41 — Forge session: forge tool upgrade at the furnace.
    const forgeRef = { current: null as ForgeSession | null }

    const onForgeStart = (recipe: ForgeRecipeConfig) => {
      // Already forging or smelting — do nothing.
      if (forgeRef.current || smeltRef.current) return

      // Proximity check — must be at the furnace.
      if (furnaceStation) {
        const dist = player.mesh.position.distanceTo(furnaceStation.mesh.position)
        if (dist > FURNACE_INTERACT_RADIUS) {
          useNotifications.getState().push('You need to be at the furnace to forge.', 'info')
          return
        }
      }

      const { inventory } = useGameStore.getState()
      // Forging level check.
      if (getForgingLevel() < recipe.forgingLevelReq) {
        useNotifications.getState().push(
          `You need level ${recipe.forgingLevelReq} Forging to forge this.`,
          'info',
        )
        return
      }
      // Gathering skill level check.
      const gatherLevel = useGameStore.getState().skills.skills.find(
        (s) => s.id === recipe.skillReq.skill,
      )?.level ?? 1
      if (gatherLevel < recipe.skillReq.level) {
        const skillLabel = recipe.skillReq.skill.charAt(0).toUpperCase() + recipe.skillReq.skill.slice(1)
        useNotifications.getState().push(
          `You need level ${recipe.skillReq.level} ${skillLabel} to forge this.`,
          'info',
        )
        return
      }
      // Ingredient check.
      if (!hasIngredientsFor(recipe, inventory.slots)) {
        useNotifications.getState().push(
          `You don't have the materials to forge a ${recipe.label}.`,
          'info',
        )
        return
      }

      useSmithingStore.getState().openPanel()
      forgeRef.current = { recipe, elapsed: 0 }
      useNotifications.getState().push(
        `You begin forging a ${recipe.label}…`,
        'info',
      )
    }

    forgeFromPanelRef.current = (recipe) => onForgeStart(recipe)

    // Phase 29 — Non-Aggressive Wildlife
    // onHarvest: award drop item, notify, then trigger a flee.
    const onHarvest = (creature: Creature) => {
      const { def } = creature
      if (!def.dropItemId) return
      // Respect cooldown — if the creature was recently harvested, do nothing.
      if (creature.dropCooldown > 0) {
        useNotifications.getState().push(
          `The ${def.name} has nothing more to give right now.`,
          'info',
        )
        return
      }
      const chance = def.dropChance ?? 0.75
      if (Math.random() < chance) {
        const { addItem, inventory } = useGameStore.getState()
        const itemDef = getItem(def.dropItemId)
        const itemName = itemDef?.name ?? def.dropItemId

        // Inventory capacity check: addItem is a silent no-op when the slot is
        // new and the inventory is full — guard here so we don't mislead the
        // player with a success notification or consume the cooldown for nothing.
        const alreadyStacked = inventory.slots.some((s) => s.id === def.dropItemId)
        const inventoryFull = inventory.slots.length >= inventory.maxSlots
        if (inventoryFull && !alreadyStacked) {
          useNotifications.getState().push(
            `Your inventory is full — drop something to harvest the ${def.name}.`,
            'info',
          )
          return
        }

        addItem({ id: def.dropItemId, name: itemName, quantity: 1 })
        useNotifications.getState().push(
          `You harvest ${article(itemName)} ${itemName.toLowerCase()} from the ${def.name}.`,
          'success',
        )
      } else {
        useNotifications.getState().push(
          `The ${def.name} slips away before you can gather anything.`,
          'info',
        )
      }
      // Start the drop cooldown and trigger flee only when the interaction
      // completed (item awarded or the creature simply bolted without dropping).
      creature.dropCooldown = 25
      triggerFlee(creature, player.mesh.position)
    }

    const creatures: Creature[] = buildCreatures(scene, interactables, onHarvest)

    // Phase 30 — creature attack handler.
    // Invoked each time a hostile creature lands a melee hit on the player.
    // Applies damage factoring in equipped defence bonus, clamps health to 0,
    // and pushes a warning notification.
    // Phase 31 — defeat fallback is called here; defined after player is created.
    let _onPlayerDefeated: () => void = () => {}
    const onCreatureAttack = (creature: Creature, rawDamage: number) => {
      const { playerStats, equipStats, setHealth } = useGameStore.getState()
      const mitigated = Math.max(1, rawDamage - equipStats.totalDefence)
      const newHp = Math.max(0, playerStats.health - mitigated)
      setHealth(newHp)
      useNotifications.getState().push(
        `The ${creature.def.name} strikes you for ${mitigated} damage!`,
        'warning',
      )
      // Phase 31 — player defeat fallback.
      if (newHp <= 0) {
        _onPlayerDefeated()
      }
    }

    // Phase 31 — combat state (target + player attack timer).
    const combatRef = { current: createCombatState() }

    // Precompute world-space bounding boxes for static collidables once so that
    // updatePlayer() doesn't have to call setFromObject() every frame.
    const collidableBoxes: THREE.Box3[] = collidables.map((m) =>
      new THREE.Box3().setFromObject(m),
    )

    // Phase 03 — player controller
    const player = createPlayer(scene)

    // Phase 34 — Respawn / Safe Recovery Loop.
    // Restores full HP, clears combat, teleports the player to the settlement
    // hearth, and triggers the respawn overlay.  The player retains all items
    // and currency (no punishing item loss).  The blocking overlay prevents
    // any further input until the player explicitly dismisses it.
    _onPlayerDefeated = () => {
      const { playerStats, setHealth } = useGameStore.getState()
      // Restore full health.
      setHealth(playerStats.maxHealth)
      // Clear combat target to prevent immediate re-aggro on wake.
      setTarget(combatRef.current, null)
      useCombatStore.getState().clearTarget()
      // Teleport to settlement hearth (world origin).
      player.mesh.position.set(RESPAWN_X, RESPAWN_Y, RESPAWN_Z)
      // Clear any held movement inputs so the player doesn't slide after waking.
      keys.clear()
      mobileJoystickRef.current.x = 0
      mobileJoystickRef.current.z = 0
      // Cancel any in-progress gathering/cooking/smelting/forging sessions (player teleported away).
      choppingRef.current = null
      miningRef.current = null
      fishingRef.current = null
      cookingRef.current = null
      smeltRef.current = null
      forgeRef.current = null
      // Show the blocking respawn overlay.
      useRespawnStore.getState().triggerDefeat(RESPAWN_LOCATION_LABEL)
    }

    // Phase 31 — player-attack hit notification.
    const onPlayerHit = (target: Creature, damage: number) => {
      useNotifications.getState().push(
        `You strike the ${target.def.name} for ${damage} damage.`,
        'info',
      )
    }

    // Phase 31 / 32 — player-attack kill: notify, roll loot, award items + currency.
    const onPlayerKill = (target: Creature) => {
      useCombatStore.getState().clearTarget()
      useNotifications.getState().push(
        `You defeat the ${target.def.name}!`,
        'success',
      )

      // Phase 32 — roll loot table and award results.
      const { items, currency } = rollLoot(target.def.id)
      const { addItem, addCoins, inventory } = useGameStore.getState()

      // Pre-compute a Set of item ids already in the inventory so the per-drop
      // stacking check is O(1) rather than a repeated linear scan.
      const stackedIds = new Set(inventory.slots.map((s) => s.id))
      // Track free slots locally so sequential non-stackable drops within the
      // same kill correctly decrement the budget without re-reading Zustand.
      let freeSlots = inventory.maxSlots - inventory.slots.length

      const awarded: Array<{ name: string; qty: number }> = []

      for (const drop of items) {
        const def = getItem(drop.itemId)
        const name = def?.name ?? drop.itemId
        const mergesIntoStack = (def?.stackable ?? false) && stackedIds.has(drop.itemId)

        // addItem is a silent no-op when the inventory is full and the item
        // doesn't already occupy a stack.  Pre-check so we only announce items
        // the player actually receives.
        const canAdd = mergesIntoStack || freeSlots > 0
        if (canAdd) {
          addItem({ id: drop.itemId, name, quantity: drop.qty })
          awarded.push({ name, qty: drop.qty })
          if (!mergesIntoStack) {
            freeSlots--
          }
        }
        // else: inventory full — item silently skipped, not announced.
      }

      if (currency > 0) {
        addCoins(currency)
      }

      const lostItems = items.length - awarded.length
      if (awarded.length > 0 || currency > 0) {
        const parts: string[] = awarded.map((d) => `${d.qty}× ${d.name}`)
        if (currency > 0) parts.push(`${currency} ⬡`)
        useNotifications.getState().push(
          `Loot: ${parts.join(', ')}`,
          'info',
        )
      }
      if (lostItems > 0) {
        useNotifications.getState().push(
          `${lostItems} loot item${lostItems > 1 ? 's' : ''} lost — inventory full!`,
          'warning',
        )
      }
    }

    // Phase 04 — orbit camera state
    const camState = createCameraState()

    const interactionState = createInteractionState()

    // Wire up the mobile interact button to trigger the current interaction target.
    mobileInteractRef.current = () => {
      if (interactionState.target) interactionState.target.onInteract()
    }

    // Phase 05 — highlight material helper
    let previousTarget: Interactable | null = null
    const EMISSIVE_HOVER = new THREE.Color(0x886600)
    const EMISSIVE_CLEAR = new THREE.Color(0x000000)

    function applyHighlight(item: Interactable | null, color: THREE.Color) {
      if (!item) return
      item.mesh.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) return
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        for (const mat of mats) {
          if (mat instanceof THREE.MeshStandardMaterial) {
            mat.emissive.copy(color)
          }
        }
      })
    }

    // Track which keys are currently held.
    const keys = new Set<string>()
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return
      keys.add(e.code)
      if (e.code === 'KeyE' && interactionState.target) {
        interactionState.target.onInteract()
      }
      if (e.code === 'KeyF') {
        // Toggle the smithing panel; open only when near the furnace.
        const smithing = useSmithingStore.getState()
        if (smithing.isOpen) {
          smithing.closePanel()
        } else if (
          furnaceStation &&
          player.mesh.position.distanceTo(furnaceStation.mesh.position) <= FURNACE_INTERACT_RADIUS
        ) {
          smithing.openPanel()
        }
      }
    }
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.code)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    // Phase 34 — track defeated state in a ref so the animation loop avoids
    // a Zustand store read every frame.  A lightweight subscription keeps the
    // ref in sync whenever the state actually changes.
    let isDefeated = useRespawnStore.getState().defeated
    const unsubscribeRespawn = useRespawnStore.subscribe(
      (s) => { isDefeated = s.defeated },
    )

    // ── Orbit drag (right mouse button) ────────────────────────────────────
    let isDragging = false
    let lastX = 0
    let lastY = 0

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 2) return
      isDragging = true
      lastX = e.clientX
      lastY = e.clientY
      renderer.domElement.setPointerCapture(e.pointerId)
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return
      applyOrbitDrag(camState, e.clientX - lastX, e.clientY - lastY)
      lastX = e.clientX
      lastY = e.clientY
    }

    const onPointerUp = (e: PointerEvent) => {
      if (e.button !== 2) return
      isDragging = false
    }

    const onPointerCancel = () => {
      isDragging = false
    }

    // ── Zoom (scroll wheel) ─────────────────────────────────────────────────
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      // Normalise to pixel units so zoom feels consistent across devices.
      let delta = e.deltaY
      if (e.deltaMode === 1) delta *= 15   // DOM_DELTA_LINE  → pixels
      if (e.deltaMode === 2) delta *= 300  // DOM_DELTA_PAGE  → pixels
      applyZoom(camState, delta)
    }

    // Suppress browser context menu so right-drag isn't interrupted.
    const onContextMenu = (e: Event) => e.preventDefault()

    // ── Touch controls (mobile) ──────────────────────────────────────────────
    // Single-finger drag → camera orbit; two-finger pinch → zoom.
    // The virtual joystick (MobileControls component) handles movement separately.
    type TouchPhase = 'none' | 'orbit' | 'pinch'
    let touchPhase: TouchPhase = 'none'
    let orbitTouchId = -1
    let orbitLastX = 0
    let orbitLastY = 0
    let pinchLastDist = 0

    const onTouchStart = (e: TouchEvent) => {
      // Prevent page scroll / zoom on the canvas.
      e.preventDefault()
      if (e.touches.length === 1) {
        touchPhase = 'orbit'
        orbitTouchId = e.touches[0].identifier
        orbitLastX = e.touches[0].clientX
        orbitLastY = e.touches[0].clientY
      } else if (e.touches.length >= 2) {
        touchPhase = 'pinch'
        const t0 = e.touches[0]
        const t1 = e.touches[1]
        const dx = t1.clientX - t0.clientX
        const dy = t1.clientY - t0.clientY
        pinchLastDist = Math.sqrt(dx * dx + dy * dy)
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      if (touchPhase === 'orbit' && e.touches.length === 1) {
        const touch = Array.from(e.touches).find((t) => t.identifier === orbitTouchId)
        if (!touch) return
        applyOrbitDrag(camState, touch.clientX - orbitLastX, touch.clientY - orbitLastY)
        orbitLastX = touch.clientX
        orbitLastY = touch.clientY
      } else if (e.touches.length >= 2) {
        touchPhase = 'pinch'
        const t0 = e.touches[0]
        const t1 = e.touches[1]
        const dx = t1.clientX - t0.clientX
        const dy = t1.clientY - t0.clientY
        const dist = Math.sqrt(dx * dx + dy * dy)
        // Pinching in (shrinking distance) zooms in → negative scroll equivalent.
        applyZoom(camState, (pinchLastDist - dist) * 2)
        pinchLastDist = dist
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        touchPhase = 'none'
      } else if (e.touches.length === 1) {
        touchPhase = 'orbit'
        orbitTouchId = e.touches[0].identifier
        orbitLastX = e.touches[0].clientX
        orbitLastY = e.touches[0].clientY
      }
    }

    // ── Phase 31 — Left-click target selection ──────────────────────────────
    // Raycasts against creature meshes on left-click; clicking a hostile
    // creature sets it as the combat target; clicking empty space clears it.
    const raycaster = new THREE.Raycaster()
    const _clickNdc = new THREE.Vector2()

    const onCanvasClick = (e: MouseEvent) => {
      // Only respond to unmodified left-click (not right-drag release).
      if (e.button !== 0) return

      const rect = canvas.getBoundingClientRect()
      _clickNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      _clickNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(_clickNdc, camera)

      // Collect all creature mesh objects and test against them.
      const creatureMeshes = creatures.map((c) => c.mesh)
      const hits = raycaster.intersectObjects(creatureMeshes, true)

      if (hits.length > 0) {
        // Walk up the hierarchy to find the matching Creature.
        const hitObj = hits[0].object
        const matched = creatures.find((c) => {
          let obj: THREE.Object3D | null = hitObj
          while (obj) {
            if (obj === c.mesh) return true
            obj = obj.parent
          }
          return false
        })
        if (matched && matched.def.aggroRadius && matched.state !== 'dead') {
          setTarget(combatRef.current, matched)
          useCombatStore.getState().setTargetInfo(
            matched.def.name,
            matched.hp,
            matched.def.maxHp ?? matched.hp,
          )
          useNotifications.getState().push(
            `You target the ${matched.def.name}.`,
            'info',
          )
        }
      } else {
        // Clicked empty space — deselect.
        if (combatRef.current.target) {
          setTarget(combatRef.current, null)
          useCombatStore.getState().clearTarget()
        }
      }
    }

    const canvas = renderer.domElement
    canvas.addEventListener('click', onCanvasClick)
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerCancel)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('contextmenu', onContextMenu)
    canvas.addEventListener('touchstart', onTouchStart, { passive: false })
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('touchend', onTouchEnd, { passive: false })
    canvas.addEventListener('touchcancel', onTouchEnd, { passive: false })

    window.addEventListener('resize', updateViewport)

    const clock = new THREE.Clock()
    let animationFrame = 0
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

    // Phase 37 — Explore objective tracking.
    // A one-shot flag per explore zone so the trigger fires exactly once per
    // session even if the player lingers in the zone or re-enters it later.
    const exploredZones = new Set<string>()
    const animate = () => {
      animationFrame = requestAnimationFrame(animate)
      const delta = clock.getDelta()

      // Phase 34 — freeze all player-input and combat systems while the
      // respawn overlay is visible.  The camera, NPC ambient sway, and
      // resource-node timers still advance so the world looks alive.

      if (!isDefeated) {
        updatePlayer(player, keys, delta, camState.theta, collidableBoxes, mobileJoystickRef.current)
      }
      updateOrbitCamera(camera, player.mesh, camState, delta, collidables)

      // Phase 08 — advance NPC ambient idle sway
      updateNpcs(allNpcs, delta)

      if (!isDefeated) {
      // Phase 15 — tick woodcutting session and respawn timers
      updateTreeNodes(allTreeNodes, delta)
      if (choppingRef.current) {
        const sess = choppingRef.current
        if (player.moveState === 'walk') {
          // Moving cancels the active chop.
          choppingRef.current = null
          useNotifications.getState().push('You stop chopping.', 'info')
        } else {
          sess.elapsed += delta
          // Phase 41 — tier 2 hatchet chops faster; factor comes from forge recipe config.
          const chopSpeed = getToolSpeedFactor(getHatchetTier())
          if (sess.elapsed >= VARIANT_CONFIG[sess.node.variant].chopDuration * chopSpeed) {
            choppingRef.current = null
            const cfg = VARIANT_CONFIG[sess.node.variant]
            const { addItem, grantSkillXp } = useGameStore.getState()
            // Resolve display name from registry (single source of truth); id is the fallback.
            const logName = getItem(cfg.logId)?.name ?? cfg.logId
            const added = addItem({ id: cfg.logId, name: logName, quantity: 1 })
            if (added) {
              grantSkillXp('woodcutting', cfg.xp)
              advanceGatherObjectives(cfg.logId)
              useNotifications.getState().push(`You cut ${article(logName)} ${logName.toLowerCase()}.`, 'success')
              fellTree(sess.node)
            } else {
              useNotifications.getState().push('Your inventory is full — you cannot carry any more logs.', 'warning')
            }
          }
        }
      }

      // Phase 17 — tick mining session and respawn timers
      updateRockNodes(allRockNodes, delta)
      if (miningRef.current) {
        const sess = miningRef.current
        if (player.moveState === 'walk') {
          // Moving cancels the active mine.
          miningRef.current = null
          useNotifications.getState().push('You stop mining.', 'info')
        } else {
          sess.elapsed += delta
          // Phase 41 — tier 2 pick mines faster; factor comes from forge recipe config.
          const mineSpeed = getToolSpeedFactor(getPickaxeTier())
          if (sess.elapsed >= ROCK_VARIANT_CONFIG[sess.node.variant].mineDuration * mineSpeed) {
            miningRef.current = null
            const cfg = ROCK_VARIANT_CONFIG[sess.node.variant]
            const { addItem, grantSkillXp } = useGameStore.getState()
            // Resolve display name from registry (single source of truth); id is the fallback.
            const oreName = getItem(cfg.oreId)?.name ?? cfg.oreId
            const added = addItem({ id: cfg.oreId, name: oreName, quantity: 1 })
            if (added) {
              grantSkillXp('mining', cfg.xp)
              advanceGatherObjectives(cfg.oreId)
              useNotifications.getState().push(`You mine ${article(oreName)} ${oreName.toLowerCase()}.`, 'success')
              depleteRock(sess.node)
            } else {
              useNotifications.getState().push('Your inventory is full — you cannot carry any more ore.', 'warning')
            }
          }
        }
      }

      // Phase 19 — tick fishing session and respawn timers
      updateFishingNodes(allFishingNodes, delta)
      if (fishingRef.current) {
        const sess = fishingRef.current
        if (player.moveState === 'walk') {
          // Moving cancels the active cast.
          fishingRef.current = null
          useNotifications.getState().push('You reel in your line.', 'info')
        } else {
          sess.elapsed += delta
          // Phase 41 — tier 2 rod casts faster; factor comes from forge recipe config.
          const castSpeed = getToolSpeedFactor(getRodTier())
          if (sess.elapsed >= FISH_SPOT_CONFIG[sess.node.variant].castDuration * castSpeed) {
            fishingRef.current = null
            const cfg = FISH_SPOT_CONFIG[sess.node.variant]
            const { addItem, grantSkillXp } = useGameStore.getState()
            // Resolve display name from registry (single source of truth); id is the fallback.
            const fishName = getItem(cfg.fishId)?.name ?? cfg.fishId
            const added = addItem({ id: cfg.fishId, name: fishName, quantity: 1 })
            if (added) {
              grantSkillXp('fishing', cfg.xp)
              advanceGatherObjectives(cfg.fishId)
              useNotifications.getState().push(`You catch ${article(fishName)} ${fishName.toLowerCase()}!`, 'success')
              depleteFishSpot(sess.node)
            } else {
              useNotifications.getState().push('Your inventory is full — you cannot carry any more fish.', 'warning')
            }
          }
        }
      }

      // Phase 21 — tick forage node respawn timers
      updateForageNodes(allForageNodes, delta)

      // Phase 22 — tick cooking session
      if (cookingRef.current) {
        const sess = cookingRef.current
        if (player.moveState === 'walk') {
          // Moving away from the fire cancels the cook.
          cookingRef.current = null
          useNotifications.getState().push('You step away from the fire.', 'info')
        } else {
          sess.elapsed += delta
          if (sess.elapsed >= sess.recipe.cookDuration) {
            cookingRef.current = null
            const { inventory, addItem, removeItem, grantSkillXp } = useGameStore.getState()
            const cookedName = getItem(sess.recipe.cookedId)?.name ?? sess.recipe.cookedId
            // Guard: ensure the cooked item can be received before consuming
            // the raw ingredient.  The cooked slot will either stack onto an
            // existing entry or occupy a new slot.  After removing one raw
            // item the freed slot is only available when that stack hits zero,
            // so we calculate available capacity conservatively.
            const hasExistingCooked = inventory.slots.some((s) => s.id === sess.recipe.cookedId)
            const rawStackSize = inventory.slots.find((s) => s.id === sess.recipe.rawId)?.quantity ?? 0
            const slotsAfterRemove = rawStackSize === 1
              ? inventory.slots.length - 1   // raw stack will disappear
              : inventory.slots.length
            const canAdd = hasExistingCooked || slotsAfterRemove < inventory.maxSlots
            if (!canAdd) {
              useNotifications.getState().push('Your inventory is full — make room before cooking.', 'info')
              return
            }
            removeItem(sess.recipe.rawId, 1)
            addItem({ id: sess.recipe.cookedId, name: cookedName, quantity: 1 })
            grantSkillXp('hearthcraft', sess.recipe.xp)
            useNotifications.getState().push(
              `You cook the ${sess.recipe.label.toLowerCase()}. ${cookedName} ready!`,
              'success',
            )
          }
        }
      }

      // Phase 40 — tick smelt session
      if (smeltRef.current) {
        const sess = smeltRef.current
        const tooFar = furnaceStation
          ? player.mesh.position.distanceTo(furnaceStation.mesh.position) > FURNACE_INTERACT_RADIUS
          : false
        if (player.moveState === 'walk' || tooFar) {
          // Moving away from or out of range of the furnace cancels the smelt.
          smeltRef.current = null
          useNotifications.getState().push('You step away from the furnace.', 'info')
        } else {
          sess.elapsed += delta
          if (sess.elapsed >= sess.recipe.smeltDuration) {
            smeltRef.current = null
            const { inventory, addItem, removeItem, grantSkillXp } = useGameStore.getState()
            const barName = getItem(sess.recipe.barId)?.name ?? sess.recipe.barId
            // Re-validate ore at completion — inventory may have changed during the smelt.
            const oreSlot = inventory.slots.find((s) => s.id === sess.recipe.oreId)
            if (!oreSlot || oreSlot.quantity < sess.recipe.oreQty) {
              useNotifications.getState().push(
                `The ${sess.recipe.label.toLowerCase()} was used up — smelt cancelled.`,
                'info',
              )
              return
            }
            // Guard: ensure the bar can be received before consuming the ore.
            // The bar slot will either stack or occupy a new slot.  After removing
            // oreQty units the slot may vacate if the stack empties.
            const hasExistingBar = inventory.slots.some((s) => s.id === sess.recipe.barId)
            const slotsAfterRemove = oreSlot.quantity <= sess.recipe.oreQty
              ? inventory.slots.length - 1   // ore stack will vacate
              : inventory.slots.length
            const canAdd = hasExistingBar || slotsAfterRemove < inventory.maxSlots
            if (!canAdd) {
              useNotifications.getState().push('Your inventory is full — make room before smelting.', 'info')
              return
            }
            removeItem(sess.recipe.oreId, sess.recipe.oreQty)
            addItem({ id: sess.recipe.barId, name: barName, quantity: 1 })
            grantSkillXp('forging', sess.recipe.xp)
            useNotifications.getState().push(
              `You smelt the ${sess.recipe.label.toLowerCase()}. ${barName} ready!`,
              'success',
            )
          }
        }
      }

      // Phase 41 — tick forge session
      if (forgeRef.current) {
        const sess = forgeRef.current
        const tooFar = furnaceStation
          ? player.mesh.position.distanceTo(furnaceStation.mesh.position) > FURNACE_INTERACT_RADIUS
          : false
        if (player.moveState === 'walk' || tooFar) {
          forgeRef.current = null
          useNotifications.getState().push('You step away from the furnace.', 'info')
        } else {
          sess.elapsed += delta
          if (sess.elapsed >= sess.recipe.forgeDuration) {
            forgeRef.current = null
            const { inventory, addItem, removeItem, grantSkillXp } = useGameStore.getState()
            const toolName = getItem(sess.recipe.toolId)?.name ?? sess.recipe.toolId
            // Re-validate ingredients at completion.
            if (!hasIngredientsFor(sess.recipe, inventory.slots)) {
              useNotifications.getState().push(
                `Materials were used up — forge cancelled.`,
                'info',
              )
              return
            }
            // Guard: the tool needs a free slot only if the player doesn't already
            // have this tool id (addItem stacks by id regardless of stackable flag).
            // Ingredient stacks that are fully consumed also free up slots.
            const slotsFreed = sess.recipe.ingredients.reduce((freed, ing) => {
              const slot = inventory.slots.find((s) => s.id === ing.id)
              return slot && slot.quantity <= ing.qty ? freed + 1 : freed
            }, 0)
            const slotsAfterRemove = inventory.slots.length - slotsFreed
            const needsNewSlot = !inventory.slots.some((s) => s.id === sess.recipe.toolId)
            if (needsNewSlot && slotsAfterRemove >= inventory.maxSlots) {
              useNotifications.getState().push('Your inventory is full — make room before forging.', 'info')
              return
            }
            // Consume all ingredients then award the tool.
            for (const ing of sess.recipe.ingredients) {
              removeItem(ing.id, ing.qty)
            }
            addItem({ id: sess.recipe.toolId, name: toolName, quantity: 1 })
            grantSkillXp('forging', sess.recipe.xp)
            useNotifications.getState().push(
              `You forge a ${toolName}!`,
              'success',
            )
          }
        }
      }

      // Phase 05 — interaction targeting
      updateInteraction(interactionState, player, interactables)

      // Phase 29/30 — tick creature AI (roaming, flee, aggro, pursuit bounds, reset)
      updateCreatures(creatures, delta, player.mesh.position, onCreatureAttack)

      // Phase 31 — tick player combat loop (auto-attack, cooldown, kill detection)
      updateCombat(
        combatRef.current,
        delta,
        player.mesh.position,
        useGameStore.getState().equipStats.totalAttack,
        onPlayerHit,
        onPlayerKill,
      )
      // Phase 33 — tick food cooldown timer
      useFoodStore.getState().tickCooldown(delta)

      // Phase 37 — Explore objective trigger: fire when the player enters a
      // named zone for the first time.  Each zone fires at most once per
      // session (guarded by _exploredZones).
      if (!exploredZones.has('brackroot_trail') && player.mesh.position.z >= 19) {
        exploredZones.add('brackroot_trail')
        const { active, updateObjective } = useTaskStore.getState()
        for (const record of active) {
          const def = getTask(record.taskId)
          if (!def) continue
          for (const obj of def.objectives) {
            if (
              obj.type === 'explore' &&
              obj.targetId === 'brackroot_trail' &&
              (record.progress[obj.id] ?? 0) < obj.required
            ) {
              updateObjective(record.taskId, obj.id, 1)
            }
          }
        }
      }
      // Sync live target HP to the combat store so the React overlay stays current.
      // Cache the last values written to avoid redundant Zustand updates every frame.
      const combatTarget = combatRef.current.target
      if (combatTarget && combatTarget.state !== 'dead') {
        const store = useCombatStore.getState()
        const newMaxHp = combatTarget.def.maxHp ?? combatTarget.hp
        if (
          store.targetName !== combatTarget.def.name ||
          store.targetHp !== combatTarget.hp ||
          store.targetMaxHp !== newMaxHp
        ) {
          store.setTargetInfo(combatTarget.def.name, combatTarget.hp, newMaxHp)
        }
      } else if (!combatTarget) {
        // Target was cleared (killed or deselected) — ensure UI is also cleared.
        if (useCombatStore.getState().targetName !== null) {
          useCombatStore.getState().clearTarget()
        }
      }

      const tgt = interactionState.target
      mobileHasTargetRef.current = !!tgt
      if (tgt !== previousTarget) {
        applyHighlight(previousTarget, EMISSIVE_CLEAR)
        applyHighlight(tgt, EMISSIVE_HOVER)
        previousTarget = tgt
      }
      if (promptRef.current) {
        if (tgt) {
          promptRef.current.textContent = isTouchDevice ? `TAP  ${tgt.label}` : `[E]  ${tgt.label}`
          promptRef.current.classList.add('visible')
        } else {
          promptRef.current.textContent = ''
          promptRef.current.classList.remove('visible')
        }
      }
      } // end !isDefeated

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
      unsubscribeRespawn()
      window.removeEventListener('resize', updateViewport)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerCancel)
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('contextmenu', onContextMenu)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
      canvas.removeEventListener('touchcancel', onTouchEnd)
      canvas.removeEventListener('click', onCanvasClick)
      scene.traverse((object) => {
        const renderObject = object as THREE.Object3D & {
          geometry?: THREE.BufferGeometry
          material?: THREE.Material | THREE.Material[]
        }
        renderObject.geometry?.dispose()
        if (renderObject.material) {
          if (Array.isArray(renderObject.material)) {
            renderObject.material.forEach((material) => material.dispose())
          } else {
            renderObject.material.dispose()
          }
        }
      })
      renderer.dispose()
      container.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>Veilmarch</h1>
        <p id="scene-description" className="app-header__desc">
          Playing as <strong>{playerName}</strong>.
          WASD / joystick to move · drag to orbit · pinch/scroll to zoom · E / tap to interact · click creature to target.
          I = inventory, K = skills, B = shop, L = ledger hall, Q = equipment, J = journal, F = smithing.
        </p>
      </header>
      <div
        className="scene-container"
        ref={sceneRef}
        role="region"
        aria-label="3D prototype world scene"
        aria-describedby="scene-description"
      >
        {/* Phase 09 — HUD overlay */}
        <div className="hud-overlay">
          <PlayerStrip />
          {/* Phase 31 — Combat target nameplate + HP bar */}
          <CombatTargetHud />
          <NotificationFeed />
          {/* Phase 10 — Inventory panel */}
          <InventoryPanel />
          {/* Phase 14 — Skills panel */}
          <SkillsPanel />
          {/* Phase 23 — Shop panel */}
          <ShopPanel />
          {/* Phase 25 — Ledger Hall / Storage panel */}
          <LedgerPanel />
          {/* Phase 26 — Equipment panel */}
          <EquipmentPanel />
          {/* Phase 34 — Respawn / Safe Recovery overlay */}
          <RespawnOverlay />
          {/* Phase 36 — Dialogue panel */}
          <DialoguePanel />
          {/* Phase 37 — Task tracker HUD */}
          <TaskTrackerHud />
          {/* Phase 39 — Journal panel */}
          <JournalPanel />
          {/* Phase 40 — Smithing panel */}
          <SmithingPanel
            onSmelt={(recipe) => smeltFromPanelRef.current(recipe)}
            onForge={(recipe) => forgeFromPanelRef.current(recipe)}
          />
          {/* Mobile gesture controls (hidden on pointer:fine devices) */}
          <MobileControls
            joystickRef={mobileJoystickRef}
            onInteract={() => mobileInteractRef.current()}
            hasTargetRef={mobileHasTargetRef}
          />
        </div>
        <div ref={promptRef} className="interaction-prompt" aria-live="polite" />
      </div>
    </main>
  )
}

export default App
