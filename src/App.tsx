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
  getWoodcuttingLevel,
  VARIANT_CONFIG,
} from './engine/woodcutting'
import type { TreeNode } from './engine/woodcutting'
import {
  buildRockNodes,
  updateRockNodes,
  depleteRock,
  hasPickaxe,
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
  getFishingLevel,
  FISH_SPOT_CONFIG,
} from './engine/fishing'
import type { FishingNode } from './engine/fishing'
import {
  buildShoreline,
  updateReedNodes,
  depleteReedNode,
} from './engine/shoreline'
import { useGameStore } from './store/useGameStore'
import { useNotifications } from './store/useNotifications'
import { getItem } from './data/items/itemRegistry'
import { PlayerStrip } from './ui/hud/PlayerStrip'
import { NotificationFeed } from './ui/hud/NotificationFeed'
import { InventoryPanel } from './ui/hud/InventoryPanel'
import { SkillsPanel } from './ui/hud/SkillsPanel'
import { MobileControls } from './ui/hud/MobileControls'
import './App.css'

// ── Gather-session types (used by both woodcutting and mining loops) ───────────

/** Tracks an active woodcutting chop: which tree and elapsed time. */
interface ChoppingSession { node: TreeNode; elapsed: number }

/** Tracks an active mining attempt: which rock and elapsed time. */
interface MiningSession { node: RockNode; elapsed: number }

/** Tracks an active fishing cast: which spot and elapsed cast time. */
interface FishingSession { node: FishingNode; elapsed: number }

function App() {
  const sceneRef = useRef<HTMLDivElement>(null)
  const promptRef = useRef<HTMLDivElement>(null)

  // Phase 06 — subscribe to player name from the global store
  const playerName = useGameStore((s) => s.playerStats.name)

  // ── Mobile controls shared state ────────────────────────────────────────
  /** Joystick direction written by MobileControls, read by the game loop. */
  const mobileJoystickRef = useRef<{ x: number; z: number }>({ x: 0, z: 0 })
  /** Interact callback set by the game loop, called by the mobile interact button. */
  const mobileInteractRef = useRef<() => void>(() => {})
  /** True when the player is in range of an interactable – drives the interact button pulse. */
  const mobileHasTargetRef = useRef(false)

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
    updateViewport()

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
    const quarryNpcs   = [...npcs, ...quarry.npcs]

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

    // Phase 20 — Shoreline Region Slice
    // Build Gloamwater Bank zone and merge its results into the shared collections.
    const shoreline = buildShoreline(scene, interactables, onCastStart, depleteReedNode)
    collidables.push(...shoreline.collidables)
    const allFishingNodes = [...fishingNodes, ...shoreline.fishingNodes]
    const allNpcs         = [...quarryNpcs, ...shoreline.npcs]

    // Precompute world-space bounding boxes for static collidables once so that
    // updatePlayer() doesn't have to call setFromObject() every frame.
    const collidableBoxes: THREE.Box3[] = collidables.map((m) =>
      new THREE.Box3().setFromObject(m),
    )

    // Phase 03 — player controller
    const player = createPlayer(scene)

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
    }
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.code)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

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

    const canvas = renderer.domElement
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
    const animate = () => {
      animationFrame = requestAnimationFrame(animate)
      const delta = clock.getDelta()
      updatePlayer(player, keys, delta, camState.theta, collidableBoxes, mobileJoystickRef.current)
      updateOrbitCamera(camera, player.mesh, camState, delta, collidables)

      // Phase 08 — advance NPC ambient idle sway
      updateNpcs(allNpcs, delta)

      // Phase 15 — tick woodcutting session and respawn timers
      updateTreeNodes(treeNodes, delta)
      if (choppingRef.current) {
        const sess = choppingRef.current
        if (player.moveState === 'walk') {
          // Moving cancels the active chop.
          choppingRef.current = null
          useNotifications.getState().push('You stop chopping.', 'info')
        } else {
          sess.elapsed += delta
          if (sess.elapsed >= VARIANT_CONFIG[sess.node.variant].chopDuration) {
            choppingRef.current = null
            const cfg = VARIANT_CONFIG[sess.node.variant]
            const { addItem, grantSkillXp } = useGameStore.getState()
            // Resolve display name from registry (single source of truth); id is the fallback.
            const logName = getItem(cfg.logId)?.name ?? cfg.logId
            addItem({ id: cfg.logId, name: logName, quantity: 1 })
            grantSkillXp('woodcutting', cfg.xp)
            useNotifications.getState().push(`You cut ${article(logName)} ${logName.toLowerCase()}.`, 'success')
            fellTree(sess.node)
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
          if (sess.elapsed >= ROCK_VARIANT_CONFIG[sess.node.variant].mineDuration) {
            miningRef.current = null
            const cfg = ROCK_VARIANT_CONFIG[sess.node.variant]
            const { addItem, grantSkillXp } = useGameStore.getState()
            // Resolve display name from registry (single source of truth); id is the fallback.
            const oreName = getItem(cfg.oreId)?.name ?? cfg.oreId
            addItem({ id: cfg.oreId, name: oreName, quantity: 1 })
            grantSkillXp('mining', cfg.xp)
            useNotifications.getState().push(`You mine ${article(oreName)} ${oreName.toLowerCase()}.`, 'success')
            depleteRock(sess.node)
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
          if (sess.elapsed >= FISH_SPOT_CONFIG[sess.node.variant].castDuration) {
            fishingRef.current = null
            const cfg = FISH_SPOT_CONFIG[sess.node.variant]
            const { addItem, grantSkillXp } = useGameStore.getState()
            // Resolve display name from registry (single source of truth); id is the fallback.
            const fishName = getItem(cfg.fishId)?.name ?? cfg.fishId
            addItem({ id: cfg.fishId, name: fishName, quantity: 1 })
            grantSkillXp('fishing', cfg.xp)
            useNotifications.getState().push(`You catch ${article(fishName)} ${fishName.toLowerCase()}!`, 'success')
            depleteFishSpot(sess.node)
          }
        }
      }

      // Phase 20 — tick reed node respawn timers
      updateReedNodes(shoreline.reedNodes, delta)

      // Phase 05 — interaction targeting
      updateInteraction(interactionState, player, interactables)
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

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(animationFrame)
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
          WASD / joystick to move · drag to orbit · pinch/scroll to zoom · E / tap to interact.
          I = inventory, K = skills.
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
          <NotificationFeed />
          {/* Phase 10 — Inventory panel */}
          <InventoryPanel />
          {/* Phase 14 — Skills panel */}
          <SkillsPanel />
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
