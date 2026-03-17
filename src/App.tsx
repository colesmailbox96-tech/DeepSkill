import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { createPlayer, updatePlayer } from './engine/player'
import { updateFollowCamera } from './engine/followCamera'
import './App.css'

function App() {
  const sceneRef = useRef<HTMLDivElement>(null)

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

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    const directionalLight = new THREE.DirectionalLight(0xffe2c2, 1.25)
    directionalLight.position.set(6, 10, 4)
    scene.add(ambientLight, directionalLight)

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 24),
      new THREE.MeshStandardMaterial({ color: 0x6d7884, roughness: 0.85 }),
    )
    ground.rotation.x = -Math.PI / 2
    scene.add(ground)

    scene.add(new THREE.GridHelper(24, 24, 0x7f8b99, 0x4b535d))

    // Phase 03 — player controller
    const player = createPlayer(scene)

    // Track which keys are currently held.
    const keys = new Set<string>()
    const onKeyDown = (e: KeyboardEvent) => keys.add(e.code)
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.code)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    window.addEventListener('resize', updateViewport)

    const clock = new THREE.Clock()
    let animationFrame = 0
    const animate = () => {
      animationFrame = requestAnimationFrame(animate)
      const delta = clock.getDelta()
      updatePlayer(player, keys, delta)
      updateFollowCamera(camera, player.mesh, delta)
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', updateViewport)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
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
          Phase 03: player controller — move with WASD or arrow keys.
        </p>
      </header>
      <div
        className="scene-container"
        ref={sceneRef}
        role="region"
        aria-label="3D prototype world scene"
        aria-describedby="scene-description"
      />
    </main>
  )
}

export default App
