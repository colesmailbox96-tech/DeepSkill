import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { createPlayer, updatePlayer, animatePlayer } from './engine/player'
import {
  createCameraState,
  updateOrbitCamera,
  applyOrbitDrag,
  applyZoom,
  TOUCH_ORBIT_SENSITIVITY,
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
import {
  buildWorkbenchStation,
  findCarvableMaterial,
  getCarvingLevel,
} from './engine/carving'
import type { CarveRecipeConfig } from './engine/carving'
import { useCarvingStore } from './store/useCarvingStore'
import {
  buildTinkererBenchStation,
  findTinkerableMaterial,
  getTinkeringLevel,
} from './engine/tinkering'
import type { TinkerRecipeConfig } from './engine/tinkering'
import { useTinkeringStore } from './store/useTinkeringStore'
import {
  buildSewingTableStation,
  findTailorableMaterial,
  getTailoringLevel,
} from './engine/tailoring'
import type { TailorRecipeConfig } from './engine/tailoring'
import { useTailoringStore } from './store/useTailoringStore'
import {
  buildSurveyStoneStation,
  buildSurveyCaches,
  revealNearbyCaches,
  animateCacheMarkers,
  tickCacheCooldowns,
  hideAllCaches,
  getSurveyingLevel,
  pickReward,
  buildCacheStatusList,
  SURVEY_MODE_DURATION,
  SURVEY_CLAIM_RADIUS,
  SURVEY_STONE_INTERACT_RADIUS,
} from './engine/surveying'
import type { SurveyCache } from './engine/surveying'
import { useSurveyingStore } from './store/useSurveyingStore'
import { SurveyingPanel } from './ui/hud/SurveyingPanel'
import {
  buildWardingAltarStation,
  findWardableMaterial,
  getWardingLevel,
  WARDING_ALTAR_INTERACT_RADIUS,
} from './engine/warding'
import type { WardRecipeConfig } from './engine/warding'
import { useWardingStore } from './store/useWardingStore'
import { buildBrackroot } from './engine/brackroot'
import { buildTidemarkChapel } from './engine/tidemark_chapel'
import { buildAshfenCopse } from './engine/ashfen_copse'
import { buildHollowVault, pollGateUnsealed } from './engine/hollow_vault'
import {
  buildSalvageNodes,
  updateSalvageNodes,
  depleteSalvageNode,
  getSalvagingLevel,
  SALVAGE_VARIANT_CONFIG,
} from './engine/salvage'
import type { SalvageNode } from './engine/salvage'
import {
  getHazardAtPosition,
  isProtectedFromHazard,
} from './engine/hazard'
import { useHazardStore } from './store/useHazardStore'
import {
  getDarkZoneAtPosition,
  hasLanternEquipped,
} from './engine/lighting'
import { useLightingStore } from './store/useLightingStore'
import { useGameStore } from './store/useGameStore'
import { useNotifications } from './store/useNotifications'
import { useFoodStore } from './store/useFoodStore'
import { useCookPanelStore } from './store/useCookPanelStore'
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
import { buildCreatures, updateCreatures, triggerFlee, triggerAggro } from './engine/creature'
import type { Creature } from './engine/creature'
import {
  createCombatState,
  updateCombat,
  setTarget,
  PLAYER_BASE_ATTACK,
} from './engine/combat'
import {
  createRangedState,
  fireProjectile,
  updateRanged,
  disposeArrowResources,
  PLAYER_RANGED_RANGE,
} from './engine/ranged'
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
import { CarvingPanel } from './ui/hud/CarvingPanel'
import { TinkeringPanel } from './ui/hud/TinkeringPanel'
import { TailoringPanel } from './ui/hud/TailoringPanel'
import { WardingPanel } from './ui/hud/WardingPanel'
import { CookPanel } from './ui/hud/CookPanel'
import { HazardWarningHud } from './ui/hud/HazardWarningHud'
import { GateBlockedHud } from './ui/hud/GateBlockedHud'
import { DarknessHud } from './ui/hud/DarknessHud'
import { AudioSettingsPanel } from './ui/hud/AudioSettingsPanel'
import { audioManager, getAudioRegion } from './engine/audio'
import type { AudioRegion } from './engine/audio'
import { useAudioStore } from './store/useAudioStore'
import { SaveLoadPanel } from './ui/hud/SaveLoadPanel'
import { useSaveGame, useLoadGame, clearSaveData, hasSaveData } from './store/useSaveLoad'
import { useSaveLoadStore } from './store/useSaveLoadStore'
import { useMainMenuStore } from './store/useMainMenuStore'
import { MainMenuScreen } from './ui/screens/MainMenuScreen'
import { useMobileStore } from './store/useMobileStore'
import { KEY_TO_ACTION, dispatchPanelKey } from './engine/inputActions'
import type { InputAction } from './engine/inputActions'
import { registerAllTasks } from './data/tasks/taskRegistry'
import { useTaskStore } from './store/useTaskStore'
import { getTask } from './engine/task'
import { useMinimapStore } from './store/useMinimapStore'
import { getRegionLabel } from './engine/minimap'
import { MinimapHud } from './ui/hud/MinimapHud'
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
/** Phase 42 — Active carve session: recipe being carved + elapsed time. */
interface CarveSession  { recipe: CarveRecipeConfig;  elapsed: number }
/** Phase 43 — Active tinker session: recipe being assembled + elapsed time. */
interface TinkerSession { recipe: TinkerRecipeConfig; elapsed: number }
/** Phase 46 — Active ward session: recipe being inscribed + elapsed time. */
interface WardSession   { recipe: WardRecipeConfig;   elapsed: number }
/** Phase 63 — Active tailor session: recipe being stitched + elapsed time. */
interface TailorSession { recipe: TailorRecipeConfig; elapsed: number }

function App() {
  const sceneRef = useRef<HTMLDivElement>(null)
  const promptRef = useRef<HTMLDivElement>(null)

  // Phase 06 — subscribe to player name from the global store
  const playerName = useGameStore((s) => s.playerStats.name)

  // ── Phase 37 — Task Framework ────────────────────────────────────────────
  // Subscribe to the currently open dialogue NPC so talk-type objectives can
  // be marked as complete when the player speaks to the target NPC.
  const openDialogueNpcName = useDialogueStore((s) => s.activeTree?.npcName ?? null)

  // Auto-accept all tasks once at game start (runs once because the dependency
  // array is empty; acceptTask is idempotent for known tasks).
  useEffect(() => {
    useTaskStore.getState().acceptTask('word_from_the_elder')
    useTaskStore.getState().acceptTask('warm_runoff')
    // Phase 38 — practical starter tasks
    useTaskStore.getState().acceptTask('haul_for_the_hearth')
    useTaskStore.getState().acceptTask('stock_the_camp_stores')
    useTaskStore.getState().acceptTask('stone_from_the_quarry')
    // Phase 64 — Tidemark Storyline Arc
    useTaskStore.getState().acceptTask('tidemark_word')
    useTaskStore.getState().acceptTask('tidemark_ward_proof')
    useTaskStore.getState().acceptTask('tidemark_mist_born')
    useTaskStore.getState().acceptTask('tidemark_sealed_shaft')
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

  // ── Phase 50 — Save / Load ────────────────────────────────────────────────
  const saveGame = useSaveGame()
  const loadGame = useLoadGame()

  // ── Phase 51 — Main Menu / Continue Flow ─────────────────────────────────
  const menuVisible = useMainMenuStore((s) => s.isVisible)
  const hideMenu    = useMainMenuStore((s) => s.hide)

  // Check for an existing save exactly once when the component mounts.
  // The value is stable for the lifetime of the menu — it only becomes
  // false after a "New Game" action, which also hides the menu.
  const menuHasSave = useMemo(() => hasSaveData(), [])

  /**
   * "Continue" — restore the saved snapshot, then enter the world.
   * Auto-load on boot is intentionally removed: the player now explicitly
   * chooses Continue vs New Game from the main menu.
   */
  const handleContinue = () => {
    loadGame()
    hideMenu()
  }

  /**
   * "New Game" — wipe the persistent save, reset in-memory state to defaults,
   * and enter the world with a fresh character.
   */
  const handleNewGame = () => {
    clearSaveData()
    useSaveLoadStore.getState().notifyCleared()
    useGameStore.getState().resetToDefaults()
    hideMenu()
  }

  // Auto-save every 60 seconds, but only after the player has entered the world.
  // While the main menu is visible the game state is at defaults (or not yet
  // loaded), so triggering a save here would overwrite an existing save with
  // default data.  Adding `menuVisible` to the dependency array causes React to
  // re-install the effect whenever the menu is shown/hidden, and the early
  // return below ensures no interval is created while the menu is open.
  useEffect(() => {
    if (menuVisible) return     // title screen is showing — do not auto-save
    const interval = setInterval(() => {
      const saved = saveGame()
      if (saved) useSaveLoadStore.getState().notifySaved()
    }, 60_000)
    return () => clearInterval(interval)
  }, [saveGame, menuVisible])
  /** True when the player is in range of an interactable – drives the interact button pulse. */
  const mobileHasTargetRef = useRef(false)
  /**
   * Phase 53 — unified action dispatcher.  Set by the game loop once it has
   * the context (player position, interaction state, station refs) required
   * to resolve every InputAction.  MobileControls calls this instead of
   * dispatching raw KeyboardEvents so both input paths share identical logic.
   */
  const dispatchActionRef = useRef<(action: InputAction) => void>(() => {})
  /** Smelt callback set by the game loop, called by SmithingPanel recipe buttons. */
  const smeltFromPanelRef = useRef<(recipe: import('./engine/smithing').SmeltRecipeConfig) => void>(() => {})
  /** Forge callback set by the game loop, called by SmithingPanel forge buttons. */
  const forgeFromPanelRef = useRef<(recipe: import('./engine/smithing').ForgeRecipeConfig) => void>(() => {})
  /** Carve callback set by the game loop, called by CarvingPanel recipe buttons. */
  const carveFromPanelRef = useRef<(recipe: import('./engine/carving').CarveRecipeConfig) => void>(() => {})
  /** Tinker callback set by the game loop, called by TinkeringPanel recipe buttons. */
  const tinkerFromPanelRef = useRef<(recipe: import('./engine/tinkering').TinkerRecipeConfig) => void>(() => {})
  /** Tailor callback set by the game loop, called by TailoringPanel recipe buttons. */
  const tailorFromPanelRef = useRef<(recipe: import('./engine/tailoring').TailorRecipeConfig) => void>(() => {})
  /** Survey callback set by the game loop, called by SurveyingPanel sweep button. */
  const startSurveyFromPanelRef = useRef<() => void>(() => {})
  /** Ward callback set by the game loop, called by WardingPanel recipe buttons. */
  const wardFromPanelRef = useRef<(recipe: WardRecipeConfig) => void>(() => {})
  /** Cook callback set by the game loop, called by CookPanel recipe buttons. */
  const cookFromPanelRef = useRef<(recipe: CookRecipeConfig) => void>(() => {})
  /** Accumulator for throttling cache-status updates to ~1 Hz (Phase 45). */
  const surveyStatusAccumRef = useRef(0)
  /**
   * Phase 71 — Countdown (seconds) driving the 'interact' body animation.
   * Set to a positive value when the player fires the [E] interact action;
   * decremented each frame; player moveState is forced to 'interact' while > 0.
   */
  const interactAnimTimerRef = useRef(0)

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

    // Detect coarse-pointer (touch) devices once for renderer / prompt tuning.
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

    const renderer = new THREE.WebGLRenderer({
      // Disable antialias on mobile for a meaningful performance gain;
      // on desktop the extra quality is worth the cost.
      antialias: !isTouchDevice,
      powerPreference: 'high-performance',
    })
    // Cap pixel ratio at 2 – going above that wastes GPU time on high-DPI
    // phones with no visible quality benefit at normal viewing distance.
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
      audioManager.playSfx('chop')
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
      audioManager.playSfx('mine')
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
      audioManager.playSfx('fish_cast')
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
      audioManager.playSfx('forage')
      audioManager.playSfx('collect')
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

    // Phase 47 — Tidemark Chapel Zone
    // Build the western mist-hazard shrine zone and merge its results.
    const chapel = buildTidemarkChapel(scene, interactables)
    collidables.push(...chapel.collidables)
    allNpcs.push(...chapel.npcs)

    // Phase 65 — Hollow Vault Steps Zone
    // Build the ruin-adjacent descending vault west of the chapel.
    // The gate slab is a collidable until the player unseals it with a ward.
    const hollowVault = buildHollowVault(scene, interactables)
    collidables.push(...hollowVault.collidables)
    let vaultGateSealed = true

    // Phase 66 — Salvage System
    // Salvage nodes placed inside the Hollow Vault.  Uses the 'salvaging' skill;
    // the callback pattern mirrors onForageStart.
    const onSalvageStart = (node: SalvageNode) => {
      const cfg = SALVAGE_VARIANT_CONFIG[node.variant]
      if (getSalvagingLevel() < cfg.levelReq) {
        useNotifications.getState().push(
          `You need level ${cfg.levelReq} Salvaging to extract from this.`,
          'info',
        )
        return
      }
      const { addItem, grantSkillXp } = useGameStore.getState()
      const itemName = getItem(cfg.itemId)?.name ?? cfg.itemId
      const added = addItem({ id: cfg.itemId, name: itemName, quantity: 1 })
      if (!added) {
        useNotifications.getState().push(
          `Your inventory is too full to salvage ${itemName.toLowerCase()}.`,
          'info',
        )
        return
      }
      grantSkillXp('salvaging', cfg.xp)
      advanceGatherObjectives(cfg.itemId)
      audioManager.playSfx('forage')
      audioManager.playSfx('collect')
      useNotifications.getState().push(
        `You salvage ${article(itemName)} ${itemName.toLowerCase()}.`,
        'success',
      )
      depleteSalvageNode(node)
    }

    const allSalvageNodes = buildSalvageNodes(scene, interactables, onSalvageStart)

    // Phase 57 — Ashfen Copse Zone
    // Phase 58 — adds Duskiron Seam rock nodes; onMineStart callback needed.
    // Build the northeast advanced gathering-and-combat zone and merge results.
    const ashfenCopse = buildAshfenCopse(scene, interactables, onChopStart, onForageStart, onMineStart)
    collidables.push(...ashfenCopse.collidables)
    allTreeNodes.push(...ashfenCopse.treeNodes)
    allForageNodes.push(...ashfenCopse.forageNodes)
    allRockNodes.push(...ashfenCopse.rockNodes)

    // Phase 22 — Cooking System Foundation
    // Phase 59 — Panel-based recipe selection replaces auto-cook.
    // Cooking session: tracks which recipe is being cooked and elapsed cook time.
    const cookingRef = { current: null as CookingSession | null }

    // Opening the panel is now the campfire interaction; actual cooking starts
    // when the player selects a recipe inside the panel (cookFromPanelRef below).
    const onCookStart = () => {
      // Already cooking — do nothing (session is in progress).
      if (cookingRef.current) return
      useCookPanelStore.getState().openPanel()
    }

    buildCookStation(scene, interactables, onCookStart)

    // Called by CookPanel when the player selects a recipe to cook.
    cookFromPanelRef.current = (recipe: CookRecipeConfig) => {
      if (cookingRef.current) return

      if (getCookingLevel() < recipe.levelReq) {
        useNotifications.getState().push(
          `You need level ${recipe.levelReq} Hearthcraft to cook this.`,
          'info',
        )
        return
      }

      const { inventory } = useGameStore.getState()
      if (!inventory.slots.some((s) => s.id === recipe.rawId && s.quantity > 0)) {
        useNotifications.getState().push('You have nothing to cook here.', 'info')
        return
      }

      cookingRef.current = { recipe, elapsed: 0 }
      useNotifications.getState().push(
        `You begin cooking the ${recipe.label.toLowerCase()} over the hearthfire…`,
        'info',
      )
    }

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

    // Phase 42 — Carving Foundation
    // Carve session: tracks which recipe is being carved and elapsed time.
    const carveRef = { current: null as CarveSession | null }
    // Captured after buildWorkbenchStation(); read by onCarveStart and the tick.
    let workbenchStation: import('./engine/carving').WorkbenchStation | null = null
    const WORKBENCH_INTERACT_RADIUS = 2.0

    const onCarveStart = (recipe?: CarveRecipeConfig) => {
      // Already carving — do nothing.
      if (carveRef.current) return
      const { inventory } = useGameStore.getState()

      if (workbenchStation) {
        const dist = player.mesh.position.distanceTo(workbenchStation.mesh.position)
        if (dist > WORKBENCH_INTERACT_RADIUS) {
          useNotifications.getState().push('You need to be at the workbench to carve.', 'info')
          return
        }
      }

      const chosen = recipe ?? findCarvableMaterial(inventory.slots)
      if (!chosen) {
        useNotifications.getState().push('You have no materials ready to carve here.', 'info')
        useCarvingStore.getState().openPanel()
        return
      }
      if (getCarvingLevel() < chosen.levelReq) {
        useNotifications.getState().push(
          `You need level ${chosen.levelReq} Carving to carve this.`,
          'info',
        )
        useCarvingStore.getState().openPanel()
        return
      }
      const slot = inventory.slots.find((s) => s.id === chosen.materialId)
      if (!slot || slot.quantity < chosen.materialQty) {
        const materialName = getItem(chosen.materialId)?.name ?? chosen.materialId
        useNotifications.getState().push(
          `You don't have enough ${materialName.toLowerCase()} to carve.`,
          'info',
        )
        useCarvingStore.getState().openPanel()
        return
      }
      useCarvingStore.getState().openPanel()
      carveRef.current = { recipe: chosen, elapsed: 0 }
      useNotifications.getState().push('You begin carving...', 'info')
    }

    workbenchStation = buildWorkbenchStation(scene, interactables, () => onCarveStart())
    carveFromPanelRef.current = (recipe) => onCarveStart(recipe)

    // Phase 43 — Tinkering Foundation
    // Tinker session: tracks which recipe is being assembled and elapsed time.
    const tinkerRef = { current: null as TinkerSession | null }
    // Captured after buildTinkererBenchStation(); read by onTinkerStart and the tick.
    let tinkererBenchStation: import('./engine/tinkering').TinkererBenchStation | null = null
    const TINKERER_BENCH_INTERACT_RADIUS = 2.0

    const onTinkerStart = (recipe?: TinkerRecipeConfig) => {
      // Already assembling — do nothing.
      if (tinkerRef.current) return
      const { inventory } = useGameStore.getState()

      if (tinkererBenchStation) {
        const dist = player.mesh.position.distanceTo(tinkererBenchStation.mesh.position)
        if (dist > TINKERER_BENCH_INTERACT_RADIUS) {
          useNotifications.getState().push("You need to be at the tinkerer's bench to assemble.", 'info')
          return
        }
      }

      const chosen = recipe ?? findTinkerableMaterial(inventory.slots)
      if (!chosen) {
        useNotifications.getState().push('You have no materials ready to assemble here.', 'info')
        useTinkeringStore.getState().openPanel()
        return
      }
      if (getTinkeringLevel() < chosen.levelReq) {
        useNotifications.getState().push(
          `You need level ${chosen.levelReq} Tinkering to assemble this.`,
          'info',
        )
        useTinkeringStore.getState().openPanel()
        return
      }
      const slot = inventory.slots.find((s) => s.id === chosen.materialId)
      if (!slot || slot.quantity < chosen.materialQty) {
        const materialName = getItem(chosen.materialId)?.name ?? chosen.materialId
        useNotifications.getState().push(
          `You don't have enough ${materialName.toLowerCase()} to assemble this.`,
          'info',
        )
        useTinkeringStore.getState().openPanel()
        return
      }
      // Check secondary ingredient when present (Phase 58+)
      if (chosen.secondaryIngredient) {
        const sec = chosen.secondaryIngredient
        const secSlot = inventory.slots.find((s) => s.id === sec.id)
        if (!secSlot || secSlot.quantity < sec.qty) {
          useNotifications.getState().push(
            `You also need ${sec.qty}× ${sec.label} to assemble this.`,
            'info',
          )
          useTinkeringStore.getState().openPanel()
          return
        }
      }
      useTinkeringStore.getState().openPanel()
      tinkerRef.current = { recipe: chosen, elapsed: 0 }
      useNotifications.getState().push('You begin assembling...', 'info')
    }

    tinkererBenchStation = buildTinkererBenchStation(scene, interactables, () => onTinkerStart())
    tinkerFromPanelRef.current = (recipe) => onTinkerStart(recipe)

    // Phase 63 — Tailoring Foundation
    // Tailor session: tracks which recipe is being stitched and elapsed time.
    const tailorRef = { current: null as TailorSession | null }
    // Captured after buildSewingTableStation(); read by onTailorStart and the tick.
    let sewingTableStation: import('./engine/tailoring').SewingTableStation | null = null
    const SEWING_TABLE_INTERACT_RADIUS = 2.0

    const onTailorStart = (recipe?: TailorRecipeConfig) => {
      // Already tailoring — do nothing.
      if (tailorRef.current) return
      const { inventory } = useGameStore.getState()

      if (sewingTableStation) {
        const dist = player.mesh.position.distanceTo(sewingTableStation.mesh.position)
        if (dist > SEWING_TABLE_INTERACT_RADIUS) {
          useNotifications.getState().push('You need to be at the sewing table to tailor.', 'info')
          return
        }
      }

      const chosen = recipe ?? findTailorableMaterial(inventory.slots)
      if (!chosen) {
        useNotifications.getState().push('You have no materials ready to stitch here.', 'info')
        useTailoringStore.getState().openPanel()
        return
      }
      if (getTailoringLevel() < chosen.levelReq) {
        useNotifications.getState().push(
          `You need level ${chosen.levelReq} Tailoring to stitch this.`,
          'info',
        )
        useTailoringStore.getState().openPanel()
        return
      }
      const primarySlot = inventory.slots.find((s) => s.id === chosen.materialId)
      if (!primarySlot || primarySlot.quantity < chosen.materialQty) {
        const materialName = getItem(chosen.materialId)?.name ?? chosen.materialId
        useNotifications.getState().push(
          `You don't have enough ${materialName.toLowerCase()} to stitch this.`,
          'info',
        )
        useTailoringStore.getState().openPanel()
        return
      }
      const sec = chosen.secondaryIngredient
      const secSlot = inventory.slots.find((s) => s.id === sec.id)
      if (!secSlot || secSlot.quantity < sec.qty) {
        useNotifications.getState().push(
          `You also need ${sec.qty}× ${sec.label} to stitch this.`,
          'info',
        )
        useTailoringStore.getState().openPanel()
        return
      }
      useTailoringStore.getState().openPanel()
      tailorRef.current = { recipe: chosen, elapsed: 0 }
      useNotifications.getState().push('You begin stitching...', 'info')
    }

    sewingTableStation = buildSewingTableStation(scene, interactables, () => onTailorStart())
    tailorFromPanelRef.current = (recipe) => onTailorStart(recipe)

    // Phase 44 — Surveying Foundation
    let surveyStoneStation: import('./engine/surveying').SurveyStoneStation | null = null
    // Declared before onStartSurvey so the closure captures the variable without TDZ risk.
    let surveyCaches: SurveyCache[] = []

    const onSurveyOpen = () => {
      if (surveyStoneStation) {
        const dist = player.mesh.position.distanceTo(surveyStoneStation.mesh.position)
        if (dist > SURVEY_STONE_INTERACT_RADIUS) {
          useNotifications.getState().push('You need to be at the survey stone to survey.', 'info')
          return
        }
      }
      useSurveyingStore.getState().openPanel()
    }

    const onStartSurvey = () => {
      if (surveyStoneStation) {
        const dist = player.mesh.position.distanceTo(surveyStoneStation.mesh.position)
        if (dist > SURVEY_STONE_INTERACT_RADIUS) {
          useNotifications.getState().push('You need to be at the survey stone to begin a sweep.', 'info')
          return
        }
      }
      const { surveyActive } = useSurveyingStore.getState()
      if (surveyActive) {
        useNotifications.getState().push('A survey sweep is already active.', 'info')
        return
      }
      useSurveyingStore.getState().startSurvey(SURVEY_MODE_DURATION)
      useNotifications.getState().push('You begin a survey sweep — golden caches will glow nearby.', 'info')
      // Immediately check for nearby caches on sweep start.
      const found = revealNearbyCaches(surveyCaches, player.mesh.position)
      if (found > 0) {
        useNotifications.getState().push(
          `${found} hidden cache${found > 1 ? 's' : ''} revealed nearby!`,
          'success',
        )
      }
    }

    const onClaimCache = (cache: SurveyCache) => {
      if (!cache.revealed || cache.cooldownRemaining > 0) return
      const dist = player.mesh.position.distanceTo(cache.markerMesh.position)
      if (dist > SURVEY_CLAIM_RADIUS) {
        useNotifications.getState().push('Move closer to the cache to claim it.', 'info')
        return
      }
      const surveyLvl = getSurveyingLevel()
      if (surveyLvl < cache.config.levelReq) {
        useNotifications.getState().push(
          `You need level ${cache.config.levelReq} Surveying to claim this cache.`,
          'info',
        )
        return
      }
      // Phase 45 — draw a randomised reward from the weighted pool.
      const reward = pickReward(cache.config.rewardPool)
      const { inventory, addItem, grantSkillXp } = useGameStore.getState()
      const rewardName = getItem(reward.itemId)?.name ?? reward.itemId
      const hasExisting = inventory.slots.some((s) => s.id === reward.itemId)
      const slotsUsed = inventory.slots.length
      const canAdd = hasExisting || slotsUsed < inventory.maxSlots
      if (!canAdd) {
        useNotifications.getState().push('Your inventory is full — make room before claiming.', 'info')
        return
      }
      addItem({ id: reward.itemId, name: rewardName, quantity: reward.qty })
      grantSkillXp('surveying', cache.config.xp)
      cache.revealed = false
      cache.markerMesh.visible = false
      cache.interactable.interactRadius = 0
      cache.cooldownRemaining = cache.config.cooldown
      useNotifications.getState().push(
        `You unearth ${rewardName} ×${reward.qty}! (+${cache.config.xp} surveying xp)`,
        'success',
      )
    }

    surveyStoneStation = buildSurveyStoneStation(scene, interactables, () => onSurveyOpen())
    surveyCaches = buildSurveyCaches(scene, interactables, onClaimCache)
    startSurveyFromPanelRef.current = () => onStartSurvey()

    // Phase 46 — Warding Foundation
    const wardRef = { current: null as WardSession | null }
    let wardingAltarStation: import('./engine/warding').WardingAltarStation | null = null

    const onWardStart = (recipe?: WardRecipeConfig) => {
      // Already inscribing — do nothing.
      if (wardRef.current) return
      const { inventory } = useGameStore.getState()

      if (wardingAltarStation) {
        const dist = player.mesh.position.distanceTo(wardingAltarStation.mesh.position)
        if (dist > WARDING_ALTAR_INTERACT_RADIUS) {
          useNotifications.getState().push('You need to be at the warding altar to inscribe.', 'info')
          return
        }
      }

      const chosen = recipe ?? findWardableMaterial(inventory.slots)
      if (!chosen) {
        useNotifications.getState().push('You have no materials ready to inscribe here.', 'info')
        useWardingStore.getState().openPanel()
        return
      }
      if (getWardingLevel() < chosen.levelReq) {
        useNotifications.getState().push(
          `You need level ${chosen.levelReq} Warding to inscribe this.`,
          'info',
        )
        useWardingStore.getState().openPanel()
        return
      }
      const slot = inventory.slots.find((s) => s.id === chosen.materialId)
      if (!slot || slot.quantity < chosen.materialQty) {
        const materialName = getItem(chosen.materialId)?.name ?? chosen.materialId
        useNotifications.getState().push(
          `You don't have enough ${materialName.toLowerCase()} to inscribe this.`,
          'info',
        )
        useWardingStore.getState().openPanel()
        return
      }
      useWardingStore.getState().openPanel()
      wardRef.current = { recipe: chosen, elapsed: 0 }
      useNotifications.getState().push('You begin inscribing a ward mark...', 'info')
    }

    wardingAltarStation = buildWardingAltarStation(scene, interactables, () => onWardStart())
    wardFromPanelRef.current = (recipe) => onWardStart(recipe)
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
    // Phase 61 — ranged combat state (in-flight projectiles + reload timer).
    const rangedRef = { current: createRangedState() }

    // Precompute world-space bounding boxes for static collidables once so that
    // updatePlayer() doesn't have to call setFromObject() every frame.
    const collidableBoxes: THREE.Box3[] = collidables.map((m) =>
      new THREE.Box3().setFromObject(m),
    )

    // Phase 65 — Index of the vault gate slab in both collidables and
    // collidableBoxes.  Used to splice it out once the player unseals the gate.
    let vaultGateSlabIdx = collidables.indexOf(hollowVault.gateMesh)

    // Phase 67 — Tracks whether the inner sanctum door is still sealed.
    // The index is computed at removal time via indexOf() to avoid staleness
    // caused by earlier collidable splices (e.g. vault gate slab removal).
    let innerSanctumDoorSealed = true

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
      carveRef.current = null
      tinkerRef.current = null
      tailorRef.current = null
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

      // Phase 64 — Advance any active 'kill' task objectives matching this creature.
      {
        const { active, updateObjective } = useTaskStore.getState()
        for (const record of active) {
          const def = getTask(record.taskId)
          if (!def) continue
          for (const obj of def.objectives) {
            if (
              obj.type === 'kill' &&
              obj.targetId === target.def.id &&
              (record.progress[obj.id] ?? 0) < obj.required
            ) {
              updateObjective(record.taskId, obj.id, 1)
            }
          }
        }
      }

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
          // Advance any active gather objectives that match this drop item.
          for (let i = 0; i < drop.qty; i++) {
            advanceGatherObjectives(drop.itemId)
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

    // ── Phase 53 — Shared input-action handler ──────────────────────────────
    // Both keyboard (onKeyDown) and mobile controls (dispatchActionRef) call
    // this single function so all named actions follow an identical code path.
    const onInputAction = (action: InputAction) => {
      if (action === 'interact') {
        if (interactionState.target) {
          audioManager.playSfx('interact')
          interactionState.target.onInteract()
          // Phase 71 — anchor the interact arc to the current animPhase so
          // it always starts from zero offset regardless of when [E] fires.
          player.interactStartPhase = player.animPhase
          interactAnimTimerRef.current = 0.4
        }
        return
      }
      // Panel-toggle actions whose open/close logic lives inside the component
      // (InventoryPanel / SkillsPanel / JournalPanel / LedgerPanel) — forward
      // via a synthetic key event so their built-in handlers fire as normal.
      if (
        action === 'toggle-inventory' ||
        action === 'toggle-skills'    ||
        action === 'toggle-journal'   ||
        action === 'toggle-ledger'
      ) {
        dispatchPanelKey(action)
        return
      }
      // Station panels — only open when the player is within range.
      if (action === 'toggle-smithing') {
        const smithing = useSmithingStore.getState()
        if (smithing.isOpen) {
          smithing.closePanel()
        } else if (
          furnaceStation &&
          player.mesh.position.distanceTo(furnaceStation.mesh.position) <= FURNACE_INTERACT_RADIUS
        ) {
          smithing.openPanel()
        }
        return
      }
      if (action === 'toggle-carving') {
        const carving = useCarvingStore.getState()
        if (carving.isOpen) {
          carving.closePanel()
        } else if (
          workbenchStation &&
          player.mesh.position.distanceTo(workbenchStation.mesh.position) <= WORKBENCH_INTERACT_RADIUS
        ) {
          carving.openPanel()
        }
        return
      }
      if (action === 'toggle-tinkering') {
        const tinkering = useTinkeringStore.getState()
        if (tinkering.isOpen) {
          tinkering.closePanel()
        } else if (
          tinkererBenchStation &&
          player.mesh.position.distanceTo(tinkererBenchStation.mesh.position) <= TINKERER_BENCH_INTERACT_RADIUS
        ) {
          tinkering.openPanel()
        }
        return
      }
      if (action === 'toggle-tailoring') {
        const tailoring = useTailoringStore.getState()
        if (tailoring.isOpen) {
          tailoring.closePanel()
        } else if (
          sewingTableStation &&
          player.mesh.position.distanceTo(sewingTableStation.mesh.position) <= SEWING_TABLE_INTERACT_RADIUS
        ) {
          tailoring.openPanel()
        }
        return
      }
      if (action === 'toggle-surveying') {
        const surveying = useSurveyingStore.getState()
        if (surveying.isOpen) {
          surveying.closePanel()
        } else if (
          surveyStoneStation &&
          player.mesh.position.distanceTo(surveyStoneStation.mesh.position) <= SURVEY_STONE_INTERACT_RADIUS
        ) {
          surveying.openPanel()
        }
        return
      }
      if (action === 'toggle-warding') {
        const warding = useWardingStore.getState()
        if (warding.isOpen) {
          warding.closePanel()
        } else if (
          wardingAltarStation &&
          player.mesh.position.distanceTo(wardingAltarStation.mesh.position) <= WARDING_ALTAR_INTERACT_RADIUS
        ) {
          warding.openPanel()
        }
        return
      }
      if (action === 'toggle-audio') {
        useAudioStore.getState().togglePanel()
        return
      }
      if (action === 'toggle-save') {
        useSaveLoadStore.getState().togglePanel()
        return
      }
      if (action === 'toggle-map') {
        useMinimapStore.getState().toggleExpanded()
        return
      }
    }

    // Wire the action dispatcher into the ref so MobileControls can call it.
    dispatchActionRef.current = onInputAction

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return
      // Phase 49 — initialise audio on first key gesture (browser autoplay policy).
      audioManager.init()
      // Phase 51 — while the main menu is visible, suppress all world input so
      // the player cannot move or interact behind the overlay.  The M key is
      // still permitted so the Settings button in the menu can open the audio
      // panel via keyboard as well.
      if (isMenuVisible) {
        if (e.code === 'KeyM') useAudioStore.getState().togglePanel()
        return
      }
      keys.add(e.code)
      // Phase 53 — map key code to named action and route through the unified handler.
      const action = KEY_TO_ACTION[e.code]
      if (action) onInputAction(action)
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

    // Phase 51 — mirror main-menu visibility into a local let so the animate
    // loop and key handlers can gate world-input without reading Zustand on
    // every frame.  Starts true (menu is shown on boot).
    let isMenuVisible = useMainMenuStore.getState().isVisible
    const unsubscribeMenu = useMainMenuStore.subscribe(
      (s) => { isMenuVisible = s.isVisible },
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
    // Phase 52 — short single-finger taps (no significant movement, < 350 ms)
    // are used for creature targeting instead of starting an orbit.
    // The virtual joystick (MobileControls component) handles movement separately.
    type TouchPhase = 'none' | 'orbit' | 'pinch'
    let touchPhase: TouchPhase = 'none'
    let orbitTouchId = -1
    let orbitLastX = 0
    let orbitLastY = 0
    let pinchLastDist = 0

    // Phase 52 — tap targeting state
    const TAP_MAX_MOVE_PX = 12   // pixels – cancel tap if finger moves this far
    const TAP_MAX_MS      = 350  // milliseconds – cancel tap if held this long
    let tapStartX    = 0
    let tapStartY    = 0
    let tapStartTime = 0
    let tapCancelled = true

    const onTouchStart = (e: TouchEvent) => {
      // Phase 49 — init audio on first touch gesture.
      audioManager.init()
      // Phase 52 — mark this session as a touch device.
      useMobileStore.getState().setTouchDevice()
      // Prevent page scroll / zoom on the canvas.
      e.preventDefault()
      if (e.touches.length === 1) {
        touchPhase = 'orbit'
        orbitTouchId = e.touches[0].identifier
        orbitLastX = e.touches[0].clientX
        orbitLastY = e.touches[0].clientY
        // Phase 52 — begin tap detection for targeting
        tapStartX    = e.touches[0].clientX
        tapStartY    = e.touches[0].clientY
        tapStartTime = performance.now()
        tapCancelled = false
      } else if (e.touches.length >= 2) {
        touchPhase = 'pinch'
        tapCancelled = true   // multi-touch is never a tap
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
        // Phase 52 — cancel tap when the finger travels beyond the dead-zone.
        if (!tapCancelled) {
          const dx = touch.clientX - tapStartX
          const dy = touch.clientY - tapStartY
          if (Math.sqrt(dx * dx + dy * dy) > TAP_MAX_MOVE_PX) {
            tapCancelled = true
          }
        }
        applyOrbitDrag(camState, touch.clientX - orbitLastX, touch.clientY - orbitLastY, TOUCH_ORBIT_SENSITIVITY)
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

    // ── Phase 31 / Phase 52 — Shared raycast target-selection helper ────────
    // Used by both left-click (onCanvasClick) and mobile tap (onTouchEnd) so
    // the two input paths stay behaviour-identical.
    const raycaster = new THREE.Raycaster()
    const _clickNdc = new THREE.Vector2()

    const selectTargetAtClientPoint = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect()
      _clickNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1
      _clickNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(_clickNdc, camera)
      const creatureMeshes = creatures.map((c) => c.mesh)
      const hits = raycaster.intersectObjects(creatureMeshes, true)
      if (hits.length > 0) {
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
        // Tapped/clicked empty space — deselect current target.
        if (combatRef.current.target) {
          setTarget(combatRef.current, null)
          useCombatStore.getState().clearTarget()
        }
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      // Phase 52 — tap targeting: resolve if this was a valid short tap.
      if (!tapCancelled && performance.now() - tapStartTime < TAP_MAX_MS) {
        const t = e.changedTouches[0]
        selectTargetAtClientPoint(t.clientX, t.clientY)
        // Show ripple feedback at tap position.
        useMobileStore.getState().showTapFeedback(t.clientX, t.clientY)
      }
      tapCancelled = true

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
    const onCanvasClick = (e: MouseEvent) => {
      // Phase 49 — init audio on first click gesture.
      audioManager.init()
      // Only respond to unmodified left-click (not right-drag release).
      if (e.button !== 0) return
      selectTargetAtClientPoint(e.clientX, e.clientY)
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

    // Phase 37 — Explore objective tracking.
    // A one-shot flag per explore zone so the trigger fires exactly once per
    // session even if the player lingers in the zone or re-enters it later.
    const exploredZones = new Set<string>()

    /**
     * Fire explore-type task objectives for `zoneId` the first time the player
     * enters that zone.  Subsequent calls with the same `zoneId` are no-ops.
     */
    function triggerZoneExplore(zoneId: string): void {
      if (exploredZones.has(zoneId)) return
      exploredZones.add(zoneId)
      const { active, updateObjective } = useTaskStore.getState()
      for (const record of active) {
        const def = getTask(record.taskId)
        if (!def) continue
        for (const obj of def.objectives) {
          if (
            obj.type === 'explore' &&
            obj.targetId === zoneId &&
            (record.progress[obj.id] ?? 0) < obj.required
          ) {
            updateObjective(record.taskId, obj.id, 1)
          }
        }
      }
    }

    // Phase 48 — Environmental Hazard System tick accumulator and prior-zone tracker.
    let hazardTickAccum = 0
    let prevHazardId: string | null = null

    // Phase 68 — Light and Visibility Mechanics tick accumulator and prior-zone tracker.
    let darkTickAccum = 0
    let prevDarkZoneId: string | null = null

    // Phase 49 — Audio Foundation: subscribe to store changes.
    // Do NOT call audioManager.init() here — defer until the first user gesture
    // to comply with browser autoplay policy and avoid allocating audio
    // resources before they are needed.
    const unsubscribeAudio = useAudioStore.subscribe((s) => {
      audioManager.setVolumes(s.masterVolume, s.musicVolume, s.sfxVolume, s.ambientVolume)
      audioManager.setMuted(s.isMuted)
    })
    // Per-frame audio-region tracker.
    let prevAudioRegion: AudioRegion | null = null
    const animate = () => {
      animationFrame = requestAnimationFrame(animate)
      const delta = clock.getDelta()

      // Phase 34 — freeze all player-input and combat systems while the
      // respawn overlay is visible.  The camera, NPC ambient sway, and
      // resource-node timers still advance so the world looks alive.
      // Phase 51 — same gate applies while the main menu is shown on boot.

      if (!isDefeated && !isMenuVisible) {
        updatePlayer(player, keys, delta, camState.theta, collidableBoxes, mobileJoystickRef.current)
      }
      updateOrbitCamera(camera, player.mesh, camState, delta, collidables)

      // Phase 08 — advance NPC ambient idle sway
      updateNpcs(allNpcs, delta)

      if (!isDefeated && !isMenuVisible) {
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
              audioManager.playSfx('collect')
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
              audioManager.playSfx('collect')
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
              audioManager.playSfx('collect')
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

      // Phase 66 — tick salvage node respawn timers
      updateSalvageNodes(allSalvageNodes, delta)

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

      // Phase 42 — tick carve session
      if (carveRef.current) {
        const sess = carveRef.current
        const tooFar = workbenchStation
          ? player.mesh.position.distanceTo(workbenchStation.mesh.position) > WORKBENCH_INTERACT_RADIUS
          : false
        if (player.moveState === 'walk' || tooFar) {
          carveRef.current = null
          useNotifications.getState().push('You step away from the workbench.', 'info')
        } else {
          sess.elapsed += delta
          if (sess.elapsed >= sess.recipe.carveDuration) {
            carveRef.current = null
            const { inventory, addItem, removeItem, grantSkillXp } = useGameStore.getState()
            const outputName = getItem(sess.recipe.outputId)?.name ?? sess.recipe.outputId
            const materialName = getItem(sess.recipe.materialId)?.name ?? sess.recipe.materialId
            // Re-validate material at completion.
            const matSlot = inventory.slots.find((s) => s.id === sess.recipe.materialId)
            if (!matSlot || matSlot.quantity < sess.recipe.materialQty) {
              useNotifications.getState().push(
                `The ${materialName.toLowerCase()} material was used up — carve cancelled.`,
                'info',
              )
              return
            }
            // Guard: ensure the output can be received before consuming materials.
            const hasExistingOutput = inventory.slots.some((s) => s.id === sess.recipe.outputId)
            const slotsAfterRemove = matSlot.quantity <= sess.recipe.materialQty
              ? inventory.slots.length - 1
              : inventory.slots.length
            const canAdd = hasExistingOutput || slotsAfterRemove < inventory.maxSlots
            if (!canAdd) {
              useNotifications.getState().push('Your inventory is full — make room before carving.', 'info')
              return
            }
            removeItem(sess.recipe.materialId, sess.recipe.materialQty)
            addItem({ id: sess.recipe.outputId, name: outputName, quantity: 1 })
            grantSkillXp('carving', sess.recipe.xp)
            useNotifications.getState().push(
              `You carve a ${outputName}!`,
              'success',
            )
          }
        }
      }

      // Phase 43 — tick tinker session
      if (tinkerRef.current) {
        const sess = tinkerRef.current
        const tooFar = tinkererBenchStation
          ? player.mesh.position.distanceTo(tinkererBenchStation.mesh.position) > TINKERER_BENCH_INTERACT_RADIUS
          : false
        if (player.moveState === 'walk' || tooFar) {
          tinkerRef.current = null
          useNotifications.getState().push("You step away from the tinkerer's bench.", 'info')
        } else {
          sess.elapsed += delta
          if (sess.elapsed >= sess.recipe.tinkerDuration) {
            tinkerRef.current = null
            const { inventory, addItem, removeItem, grantSkillXp } = useGameStore.getState()
            const outputName = getItem(sess.recipe.outputId)?.name ?? sess.recipe.outputId
            const materialName = getItem(sess.recipe.materialId)?.name ?? sess.recipe.materialId
            // Re-validate primary material at completion.
            const matSlot = inventory.slots.find((s) => s.id === sess.recipe.materialId)
            if (!matSlot || matSlot.quantity < sess.recipe.materialQty) {
              useNotifications.getState().push(
                `The ${materialName.toLowerCase()} material was used up — assembly cancelled.`,
                'info',
              )
              return
            }
            // Re-validate secondary ingredient at completion (Phase 58+).
            const sec = sess.recipe.secondaryIngredient
            if (sec) {
              const secSlot = inventory.slots.find((s) => s.id === sec.id)
              if (!secSlot || secSlot.quantity < sec.qty) {
                useNotifications.getState().push(
                  `The ${sec.label.toLowerCase()} was used up — assembly cancelled.`,
                  'info',
                )
                return
              }
            }
            // Guard: ensure the output can be received before consuming materials.
            const hasExistingOutput = inventory.slots.some((s) => s.id === sess.recipe.outputId)
            const slotsAfterRemove = matSlot.quantity <= sess.recipe.materialQty
              ? inventory.slots.length - 1
              : inventory.slots.length
            const canAdd = hasExistingOutput || slotsAfterRemove < inventory.maxSlots
            if (!canAdd) {
              useNotifications.getState().push("Your inventory is full — make room before assembling.", 'info')
              return
            }
            removeItem(sess.recipe.materialId, sess.recipe.materialQty)
            if (sec) {
              removeItem(sec.id, sec.qty)
            }
            addItem({ id: sess.recipe.outputId, name: outputName, quantity: 1 })
            grantSkillXp('tinkering', sess.recipe.xp)
            useNotifications.getState().push(
              `You assemble ${outputName}!`,
              'success',
            )
          }
        }
      }

      // Phase 63 — tick tailor session
      if (tailorRef.current) {
        const sess = tailorRef.current
        const tooFar = sewingTableStation
          ? player.mesh.position.distanceTo(sewingTableStation.mesh.position) > SEWING_TABLE_INTERACT_RADIUS
          : false
        if (player.moveState === 'walk' || tooFar) {
          tailorRef.current = null
          useNotifications.getState().push('You step away from the sewing table.', 'info')
        } else {
          sess.elapsed += delta
          if (sess.elapsed >= sess.recipe.tailorDuration) {
            tailorRef.current = null
            const { inventory, addItem, removeItem, grantSkillXp } = useGameStore.getState()
            const outputName   = getItem(sess.recipe.outputId)?.name  ?? sess.recipe.outputId
            const materialName = getItem(sess.recipe.materialId)?.name ?? sess.recipe.materialId
            // Re-validate primary material at completion.
            const matSlot = inventory.slots.find((s) => s.id === sess.recipe.materialId)
            if (!matSlot || matSlot.quantity < sess.recipe.materialQty) {
              useNotifications.getState().push(
                `The ${materialName.toLowerCase()} was used up — stitching cancelled.`,
                'info',
              )
              return
            }
            // Re-validate secondary ingredient at completion.
            const sec = sess.recipe.secondaryIngredient
            const secSlot = inventory.slots.find((s) => s.id === sec.id)
            if (!secSlot || secSlot.quantity < sec.qty) {
              useNotifications.getState().push(
                `The ${sec.label.toLowerCase()} was used up — stitching cancelled.`,
                'info',
              )
              return
            }
            // Guard: ensure the output can be received before consuming materials.
            // Both the primary and secondary ingredients may each free a slot when
            // their stacks are fully depleted, so account for both when calculating
            // available space.
            const hasExistingOutput = inventory.slots.some((s) => s.id === sess.recipe.outputId)
            let slotsAfterRemove = inventory.slots.length
            if (matSlot.quantity <= sess.recipe.materialQty) slotsAfterRemove -= 1
            if (secSlot.quantity <= sec.qty) slotsAfterRemove -= 1
            const canAdd = hasExistingOutput || slotsAfterRemove < inventory.maxSlots
            if (!canAdd) {
              useNotifications.getState().push("Your inventory is full — make room before stitching.", 'info')
              return
            }
            removeItem(sess.recipe.materialId, sess.recipe.materialQty)
            removeItem(sec.id, sec.qty)
            addItem({ id: sess.recipe.outputId, name: outputName, quantity: 1 })
            grantSkillXp('tailoring', sess.recipe.xp)
            useNotifications.getState().push(
              `You stitch together ${outputName}!`,
              'success',
            )
          }
        }
      }

      // Phase 44 — tick surveying: sweep timer, cache reveal, animate, and cooldowns
      tickCacheCooldowns(surveyCaches, delta)
      animateCacheMarkers(surveyCaches, delta)
      const { surveyActive } = useSurveyingStore.getState()
      if (surveyActive) {
        useSurveyingStore.getState().tickSurvey(delta)
        // Re-check for newly detectable caches each frame while sweep is active.
        revealNearbyCaches(surveyCaches, player.mesh.position)
        // If sweep just expired after tickSurvey, hide any un-claimed markers.
        if (!useSurveyingStore.getState().surveyActive) {
          hideAllCaches(surveyCaches)
          useNotifications.getState().push('Survey sweep ended.', 'info')
        }
      }
      // Phase 45 — push live cache status into the Zustand store for the panel UI.
      // Throttle to ~1 Hz so the panel updates smoothly without thrashing React.
      surveyStatusAccumRef.current += delta
      if (surveyStatusAccumRef.current >= 1.0) {
        surveyStatusAccumRef.current -= 1.0
        useSurveyingStore.getState().updateCacheStatus(buildCacheStatusList(surveyCaches))
      }

      // Phase 46 — tick ward inscription session
      if (wardRef.current) {
        const sess = wardRef.current
        const tooFar = wardingAltarStation
          ? player.mesh.position.distanceTo(wardingAltarStation.mesh.position) > WARDING_ALTAR_INTERACT_RADIUS
          : false
        if (player.moveState === 'walk' || tooFar) {
          wardRef.current = null
          useNotifications.getState().push('You step away from the warding altar.', 'info')
        } else {
          sess.elapsed += delta
          if (sess.elapsed >= sess.recipe.wardDuration) {
            wardRef.current = null
            const { inventory, addItem, removeItem, grantSkillXp } = useGameStore.getState()
            const outputName = getItem(sess.recipe.outputId)?.name ?? sess.recipe.outputId
            const materialName = getItem(sess.recipe.materialId)?.name ?? sess.recipe.materialId
            // Re-validate material at completion.
            const matSlot = inventory.slots.find((s) => s.id === sess.recipe.materialId)
            if (!matSlot || matSlot.quantity < sess.recipe.materialQty) {
              useNotifications.getState().push(
                `The ${materialName.toLowerCase()} material was used up — inscription cancelled.`,
                'info',
              )
            } else {
              // Guard: account for the slot freed when the material stack is fully consumed.
              const hasExisting = inventory.slots.some((s) => s.id === sess.recipe.outputId)
              const willFreeSlot = matSlot.quantity === sess.recipe.materialQty
              const slotsAfterRemove = inventory.slots.length - (willFreeSlot ? 1 : 0)
              const canAdd = hasExisting || slotsAfterRemove < inventory.maxSlots
              if (!canAdd) {
                useNotifications.getState().push('Your inventory is full — ward mark could not be stored.', 'info')
              } else {
                removeItem(sess.recipe.materialId, sess.recipe.materialQty)
                addItem({ id: sess.recipe.outputId, name: outputName, quantity: 1 })
                grantSkillXp('warding', sess.recipe.xp)
                advanceGatherObjectives(sess.recipe.outputId)
                useNotifications.getState().push(
                  `Ward mark inscribed: ${outputName}! (+${sess.recipe.xp} warding xp)`,
                  'success',
                )
              }
            }
          }
        }
      }

      // Phase 05 — interaction targeting
      updateInteraction(interactionState, player, interactables)

      // Phase 48 — Environmental Hazard System tick.
      // Check which hazard volume (if any) contains the player, update the
      // hazard warning store, fire entry notifications, and apply per-tick
      // effects (damage or stamina drain) when unprotected.
      {
        const pos = player.mesh.position
        const hazardDef = getHazardAtPosition(pos.x, pos.z)
        const hazardId = hazardDef ? hazardDef.id : null

        if (hazardId !== prevHazardId) {
          // Player crossed a hazard boundary.
          if (hazardDef) {
            const { inventory } = useGameStore.getState()
            const isProtected = isProtectedFromHazard(hazardDef, inventory)
            useHazardStore.getState().setActiveHazard(hazardDef.id, isProtected)
            if (isProtected) {
              useNotifications.getState().push(hazardDef.entryProtectedMessage, 'info')
            } else {
              useNotifications.getState().push(hazardDef.entryMessage, 'warning')
            }
          } else {
            useHazardStore.getState().clearHazard()
          }
          hazardTickAccum = 0
        }

        prevHazardId = hazardId

        if (hazardDef) {
          // Refresh protection status each tick (player may pick up/drop ward).
          const { inventory } = useGameStore.getState()
          const isProtected = isProtectedFromHazard(hazardDef, inventory)
          // Update store only when state changes to avoid redundant HUD re-renders.
          const hazardState = useHazardStore.getState()
          if (
            hazardState.activeHazardId !== hazardDef.id ||
            hazardState.isProtected !== isProtected
          ) {
            hazardState.setActiveHazard(hazardDef.id, isProtected)
          }

          hazardTickAccum += delta
          while (hazardTickAccum >= hazardDef.tickInterval) {
            hazardTickAccum -= hazardDef.tickInterval
            if (!isProtected) {
              const { playerStats, setHealth, setStamina } = useGameStore.getState()
              if (hazardDef.effect === 'damage') {
                const newHp = Math.max(0, playerStats.health - hazardDef.tickAmount)
                setHealth(newHp)
                useNotifications.getState().push(
                  `${hazardDef.tickMessage} (−${hazardDef.tickAmount} HP)`,
                  'warning',
                )
                if (newHp <= 0) {
                  _onPlayerDefeated()
                }
              } else if (hazardDef.effect === 'stamina_drain') {
                const newStamina = Math.max(0, playerStats.stamina - hazardDef.tickAmount)
                setStamina(newStamina)
                useNotifications.getState().push(
                  `${hazardDef.tickMessage} (−${hazardDef.tickAmount} stamina)`,
                  'warning',
                )
              }
            }
          }
        } else {
          hazardTickAccum = 0
        }
      }

      // Phase 68 — Light and Visibility Mechanics: check dark zones and apply
      // stamina drain when the player is in a dark area without a light source.
      {
        const pos = player.mesh.position
        const darkDef = getDarkZoneAtPosition(pos.x, pos.z)
        const darkId = darkDef ? darkDef.id : null

        if (darkId !== prevDarkZoneId) {
          // Player crossed a dark-zone boundary.
          if (darkDef) {
            const lit = hasLanternEquipped()
            useLightingStore.getState().setDarkZone(darkDef.id, lit)
            if (lit) {
              useNotifications.getState().push(darkDef.entryLitMessage, 'info')
            } else {
              useNotifications.getState().push(darkDef.entryDarkMessage, 'warning')
            }
          } else {
            useLightingStore.getState().clearDarkZone()
          }
          darkTickAccum = 0
        }

        prevDarkZoneId = darkId

        if (darkDef) {
          // Refresh lit status each tick (player may equip/unequip lantern).
          const lit = hasLanternEquipped()
          const lightState = useLightingStore.getState()
          if (
            lightState.activeDarkZoneId !== darkDef.id ||
            lightState.isLit !== lit
          ) {
            lightState.setDarkZone(darkDef.id, lit)
          }

          darkTickAccum += delta
          while (darkTickAccum >= darkDef.tickInterval) {
            darkTickAccum -= darkDef.tickInterval
            if (!lit) {
              const { playerStats, setStamina } = useGameStore.getState()
              const newStamina = Math.max(0, playerStats.stamina - darkDef.tickAmount)
              setStamina(newStamina)
              useNotifications.getState().push(
                `${darkDef.tickMessage} (−${darkDef.tickAmount} stamina)`,
                'warning',
              )
            }
          }
        } else {
          darkTickAccum = 0
        }
      }

      // Phase 29/30 — tick creature AI (roaming, flee, aggro, pursuit bounds, reset)
      updateCreatures(creatures, delta, player.mesh.position, onCreatureAttack)

      // Phase 31 — tick player combat loop (auto-attack, cooldown, kill detection)
      updateCombat(
        combatRef.current,
        delta,
        player.mesh.position,
        useGameStore.getState().equipStats.totalAttack +
          useFoodStore.getState().buffAttackBonus,
        useGameStore.getState().equipStats.attackSpeed,
        onPlayerHit,
        onPlayerKill,
      )

      // Phase 61 — tick ranged combat loop (bow auto-fire + projectile flight).
      {
        const target = combatRef.current.target
        if (target && target.state !== 'dead' && rangedRef.current.reloadTimer <= 0) {
          // Check whether a ranged weapon is currently equipped in mainHand.
          const gameState = useGameStore.getState()
          const mainHandItem = gameState.equipment['mainHand']
          const weaponDef = mainHandItem ? getItem(mainHandItem.id) : null
          if (
            weaponDef?.equipMeta?.weaponType === 'ranged' &&
            weaponDef.equipMeta.ammoId
          ) {
            const ammoId = weaponDef.equipMeta.ammoId
            const ammoSlot = gameState.inventory.slots.find((s) => s.id === ammoId)
            const dist = player.mesh.position.distanceTo(target.mesh.position)
            if (ammoSlot && ammoSlot.quantity > 0 && dist <= PLAYER_RANGED_RANGE) {
              // Consume one arrow before firing.
              gameState.removeItem(ammoId, 1)
              const rangedDamage = Math.max(
                1,
                PLAYER_BASE_ATTACK +
                  gameState.equipStats.totalAttack +
                  (weaponDef.equipMeta.rangeBonus ?? 0) +
                  useFoodStore.getState().buffAttackBonus,
              )
              const fired = fireProjectile(
                rangedRef.current,
                player.mesh.position,
                target,
                rangedDamage,
                scene,
                gameState.equipStats.attackSpeed,
              )
              if (!fired) {
                // Refund ammo if the fire call rejected (defensive guard).
                const ammoName = getItem(ammoId)?.name ?? ammoId
                gameState.addItem({ id: ammoId, name: ammoName, quantity: 1 })
              }
            }
          }
        }

        // Advance all in-flight projectiles every frame.
        updateRanged(
          rangedRef.current,
          delta,
          scene,
          (hitTarget, damage) => {
            // Force the struck creature into aggro so it responds to ranged hits
            // from outside its normal aggro radius.
            triggerAggro(hitTarget)
            onPlayerHit(hitTarget, damage)
          },
          onPlayerKill,
        )
      }
      // Phase 33 — tick food cooldown timer
      useFoodStore.getState().tickCooldown(delta)

      // Phase 49 — Audio: update ambient region and music mode each frame.
      {
        const pos = player.mesh.position
        const region = getAudioRegion(pos.x, pos.z)
        if (region !== prevAudioRegion) {
          audioManager.setRegion(region)
          prevAudioRegion = region
        }
        const inCombat = combatRef.current.target !== null
        audioManager.setMusicMode(inCombat ? 'combat' : 'peaceful')
      }

      // Phase 54 — Update minimap store with current player position and facing.
      {
        const pos = player.mesh.position
        const angle = player.mesh.rotation.y
        const regionLabel = getRegionLabel(pos.x, pos.z)
        useMinimapStore.getState().setPlayerState(pos.x, pos.z, angle, regionLabel)
      }

      // Phase 37 — Explore objective trigger: fire when the player enters a
      // named zone for the first time.  Each zone fires at most once per
      // session (guarded by exploredZones via triggerZoneExplore).
      if (player.mesh.position.z >= 19) {
        triggerZoneExplore('brackroot_trail')
      }
      // Phase 47 — Tidemark Chapel explore trigger.
      if (player.mesh.position.x <= -32) {
        triggerZoneExplore('tidemark_chapel')
      }
      // Phase 65 — Hollow Vault Steps explore trigger.
      if (player.mesh.position.x <= -62 && player.mesh.position.z >= -10 && player.mesh.position.z <= 10) {
        triggerZoneExplore('hollow_vault')
      }
      // Phase 65 — Vault gate unseal: hide gate mesh, remove its collidable, and
      // unregister its interactable so the player can't target an invisible gate.
      if (vaultGateSealed && pollGateUnsealed()) {
        vaultGateSealed = false
        hollowVault.gateMesh.visible = false
        if (vaultGateSlabIdx >= 0) {
          collidables.splice(vaultGateSlabIdx, 1)
          collidableBoxes.splice(vaultGateSlabIdx, 1)
          vaultGateSlabIdx = -1
        }
        const gateInteractableIdx = interactables.indexOf(hollowVault.gateInteractable)
        if (gateInteractableIdx !== -1) {
          interactables.splice(gateInteractableIdx, 1)
        }
      }
      // Phase 67 — Inner sanctum door: opened when the player satisfies the
      // task requirement.  Index is computed at removal time to avoid stale
      // values caused by earlier collidable splices (e.g. vault gate slab).
      if (innerSanctumDoorSealed && hollowVault.innerSanctumDoor.pollOpened()) {
        innerSanctumDoorSealed = false
        hollowVault.innerSanctumDoor.mesh.visible = false
        const doorCollidableIdx = collidables.indexOf(hollowVault.innerSanctumDoor.mesh)
        if (doorCollidableIdx >= 0) {
          collidables.splice(doorCollidableIdx, 1)
          collidableBoxes.splice(doorCollidableIdx, 1)
        }
        const doorInteractableIdx = interactables.indexOf(hollowVault.innerSanctumDoor.interactable)
        if (doorInteractableIdx !== -1) {
          interactables.splice(doorInteractableIdx, 1)
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

      // Phase 71 — Override player moveState for animation purposes and call
      // animatePlayer.  The moveState overrides only apply when the player is
      // actively playing; when frozen (defeat overlay / main menu) we force
      // 'idle' so the body reliably lerps back to rest.
      if (!isDefeated && !isMenuVisible) {
        // Gather: any active resource or crafting session → rhythmic dip loop.
        const hasGatherSession =
          !!choppingRef.current ||
          !!miningRef.current  ||
          !!fishingRef.current ||
          !!cookingRef.current ||
          !!smeltRef.current   ||
          !!forgeRef.current   ||
          !!carveRef.current   ||
          !!tinkerRef.current  ||
          !!tailorRef.current  ||
          !!wardRef.current
        if (hasGatherSession) {
          player.moveState = 'gather'
        }

        // Attack: player has an active live target → fast oscillating pulse.
        const combatTgt = combatRef.current.target
        if (combatTgt && combatTgt.state !== 'dead') {
          player.moveState = 'attack'
        }

        // Interact: [E] was pressed recently → single dip-and-rise arc.
        if (interactAnimTimerRef.current > 0) {
          interactAnimTimerRef.current -= delta
          if (interactAnimTimerRef.current < 0) interactAnimTimerRef.current = 0
          // Interact overrides idle and walk but yields to gather/attack.
          if (player.moveState === 'idle' || player.moveState === 'walk') {
            player.moveState = 'interact'
          }
        }
      } else {
        // Frozen: force idle so animatePlayer lerps the body back to rest.
        player.moveState = 'idle'
        interactAnimTimerRef.current = 0
      }

      animatePlayer(player, delta)

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
      unsubscribeRespawn()
      unsubscribeAudio()
      unsubscribeMenu()
      audioManager.dispose()
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
      // Phase 61 — free shared arrow geometry/material that are not part of the scene graph.
      disposeArrowResources()
      container.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>Veilmarch</h1>
        <p id="scene-description" className="app-header__desc">
          Playing as <strong>{playerName}</strong>.
          WASD / joystick to move · drag to orbit · pinch/scroll to zoom · E / tap to interact · tap or click creature to target.
          I = inventory, K = skills, B = shop, L = ledger hall, Q = equipment, J = journal, F = smithing, V = carving, T = tinkering, H = tailoring, Y = surveying, G = warding, M = audio, P = save, N = map.
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
          {/* Phase 42 — Carving panel */}
          <CarvingPanel
            onCarve={(recipe) => carveFromPanelRef.current(recipe)}
          />
          {/* Phase 43 — Tinkering panel */}
          <TinkeringPanel
            onTinker={(recipe) => tinkerFromPanelRef.current(recipe)}
          />
          {/* Phase 63 — Tailoring panel */}
          <TailoringPanel
            onTailor={(recipe) => tailorFromPanelRef.current(recipe)}
          />
          {/* Phase 44 — Surveying panel */}
          <SurveyingPanel
            onStartSurvey={() => startSurveyFromPanelRef.current()}
          />
          {/* Phase 46 — Warding panel */}
          <WardingPanel
            onWard={(recipe) => wardFromPanelRef.current(recipe)}
          />
          {/* Phase 59 — Cook panel */}
          <CookPanel
            onCookSelect={(recipe) => cookFromPanelRef.current(recipe)}
          />
          {/* Phase 48 — Environmental hazard warning banner */}
          <HazardWarningHud />
          {/* Phase 67 — Gate requirement feedback panel */}
          <GateBlockedHud />
          {/* Phase 68 — Darkness vignette and zone status */}
          <DarknessHud />
          {/* Phase 49 — Audio settings panel */}
          <AudioSettingsPanel />
          {/* Phase 50 — Save / Load panel */}
          <SaveLoadPanel />
          {/* Phase 54 — Minimap / Region Map */}
          <MinimapHud />
          {/* Mobile gesture controls (hidden on pointer:fine devices) */}
          <MobileControls
            joystickRef={mobileJoystickRef}
            hasTargetRef={mobileHasTargetRef}
            dispatchAction={(action) => dispatchActionRef.current(action)}
          />
        </div>
        <div ref={promptRef} className="interaction-prompt" aria-live="polite" />
        {/* Phase 51 — Main menu / title screen overlay (shown on boot) */}
        {menuVisible && (
          <MainMenuScreen
            hasSave={menuHasSave}
            onContinue={handleContinue}
            onNewGame={handleNewGame}
          />
        )}
      </div>
    </main>
  )
}

export default App
