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
import { useGameStore } from './store/useGameStore'
import { PlayerStrip } from './ui/hud/PlayerStrip'
import { NotificationFeed } from './ui/hud/NotificationFeed'
import { InventoryPanel } from './ui/hud/InventoryPanel'
import './App.css'

function App() {
  const sceneRef = useRef<HTMLDivElement>(null)
  const promptRef = useRef<HTMLDivElement>(null)

  // Phase 06 — subscribe to player name from the global store
  const playerName = useGameStore((s) => s.playerStats.name)

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

    const canvas = renderer.domElement
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerCancel)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('contextmenu', onContextMenu)

    window.addEventListener('resize', updateViewport)

    const clock = new THREE.Clock()
    let animationFrame = 0
    const animate = () => {
      animationFrame = requestAnimationFrame(animate)
      const delta = clock.getDelta()
      updatePlayer(player, keys, delta, camState.theta, collidableBoxes)
      updateOrbitCamera(camera, player.mesh, camState, delta, collidables)

      // Phase 08 — advance NPC ambient idle sway
      updateNpcs(npcs, delta)

      // Phase 05 — interaction targeting
      updateInteraction(interactionState, player, interactables)
      const tgt = interactionState.target
      if (tgt !== previousTarget) {
        applyHighlight(previousTarget, EMISSIVE_CLEAR)
        applyHighlight(tgt, EMISSIVE_HOVER)
        previousTarget = tgt
        if (promptRef.current) {
          if (tgt) {
            promptRef.current.textContent = `[E]  ${tgt.label}`
            promptRef.current.classList.add('visible')
          } else {
            promptRef.current.textContent = ''
            promptRef.current.classList.remove('visible')
          }
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
      <header>
        <h1>Veilmarch Prototype</h1>
        <p id="scene-description">
          Phase 11: Item Data Schema — playing as <strong>{playerName}</strong>.
          WASD to move, right-drag to orbit, scroll to zoom, E to interact, I to open inventory.
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
        </div>
        <div ref={promptRef} className="interaction-prompt" aria-live="polite" />
      </div>
    </main>
  )
}

export default App
