import { useEffect, useRef } from 'react'
import * as THREE from 'three'
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
    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)

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

    const resize = () => {
      if (!container.clientWidth || !container.clientHeight) {
        return
      }
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
    }
    window.addEventListener('resize', resize)

    let animationFrame = 0
    const animate = () => {
      animationFrame = requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', resize)
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose())
          } else {
            object.material.dispose()
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
        <p>Phase 02 rendering skeleton: camera, lights, loop, and test terrain.</p>
      </header>
      <div
        className="scene-container"
        ref={sceneRef}
        aria-label="3D prototype world scene"
      />
    </main>
  )
}

export default App
