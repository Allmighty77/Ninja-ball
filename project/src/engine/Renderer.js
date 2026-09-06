// ════════════════════════════════════════════════════════════
// MOTEUR 3D — Three.js avec cel-shading (toon shading)
// Gère scène, caméra, lumière, matériaux toon, fog
// ════════════════════════════════════════════════════════════
import * as THREE from 'three'

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x0a0a18)
    this.scene.fog = new THREE.Fog(0x0a0a18, 60, 140)

    // Caméra dynamique qui suit l'action
    this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 300)
    this.camera.position.set(0, 18, 35)
    this.camera.lookAt(0, 0, 0)

    // Renderer WebGL avec antialiasing
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.15

    // Matériau toon (cel-shaded) réutilisable
    this._toonGradient = this._createToonGradient()

    // Lumières
    this._setupLights()

    // Gestion resize
    window.addEventListener('resize', () => this.onResize())

    // État caméra
    this.cameraTarget = new THREE.Vector3(0, 1, 0)
    this.cameraShake = 0
    this.timeScale = 1.0
  }

  // Crée une texture gradient pour le toon shading
  _createToonGradient() {
    const colors = new Uint8Array([
      80, 80, 80, 255,
      160, 160, 160, 255,
      240, 240, 240, 255,
      255, 255, 255, 255,
    ])
    const tex = new THREE.DataTexture(colors, 4, 1, THREE.RGBAFormat)
    tex.needsUpdate = true
    tex.minFilter = THREE.NearestFilter
    tex.magFilter = THREE.NearestFilter
    return tex
  }

  // Crée un matériau cel-shaded avec couleur donnée
  toonMaterial(color, opts = {}) {
    return new THREE.MeshToonMaterial({
      color,
      gradientMap: this._toonGradient,
      ...opts,
    })
  }

  _setupLights() {
    // Lumière ambiante douce
    const ambient = new THREE.AmbientLight(0x4a4a6a, 0.6)
    this.scene.add(ambient)

    // Lumière principale (lune)
    const moon = new THREE.DirectionalLight(0xb0c4ff, 1.2)
    moon.position.set(20, 40, 15)
    moon.castShadow = true
    moon.shadow.mapSize.set(2048, 2048)
    moon.shadow.camera.left = -50
    moon.shadow.camera.right = 50
    moon.shadow.camera.top = 50
    moon.shadow.camera.bottom = -50
    moon.shadow.camera.near = 1
    moon.shadow.camera.far = 100
    this.scene.add(moon)
    this.moon = moon

    // Lumière d'ambiance orange (stade)
    const stadium = new THREE.PointLight(0xff6b1a, 0.8, 80)
    stadium.position.set(0, 20, 0)
    this.scene.add(stadium)
    this.stadiumLight = stadium

    // Hémisphère pour adoucir
    const hemi = new THREE.HemisphereLight(0x6a7aff, 0x2a1a0a, 0.4)
    this.scene.add(hemi)
  }

  // Ajoute un objet à la scène
  add(obj) {
    this.scene.add(obj)
  }

  remove(obj) {
    this.scene.remove(obj)
  }

  // Met à jour la caméra (suit une cible avec lerp + shake)
  updateCamera(targetPos, dt) {
    this.cameraTarget.lerp(targetPos, Math.min(1, dt * 4))
    const desiredX = this.cameraTarget.x * 0.5
    const desiredZ = this.cameraTarget.z * 0.6 + 32
    this.camera.position.x += (desiredX - this.camera.position.x) * Math.min(1, dt * 3)
    this.camera.position.z += (desiredZ - this.camera.position.z) * Math.min(1, dt * 3)
    this.camera.position.y = 18

    // Screen shake
    if (this.cameraShake > 0.01) {
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShake
      this.camera.position.y += (Math.random() - 0.5) * this.cameraShake
      this.cameraShake *= 0.9
    }

    this.camera.lookAt(this.cameraTarget)
  }

  addShake(amount) {
    this.cameraShake = Math.min(2, this.cameraShake + amount)
  }

  // Rendu de la frame
  render(dt) {
    this.renderer.render(this.scene, this.camera)
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  dispose() {
    this.renderer.dispose()
    window.removeEventListener('resize', this.onResize)
  }
}
