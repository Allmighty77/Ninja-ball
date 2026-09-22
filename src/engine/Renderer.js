// ════════════════════════════════════════════════════════════
// MOTEUR 3D — Three.js cel-shaded — qualité production
// ════════════════════════════════════════════════════════════
import * as THREE from 'three'
import { getGraphicsPreset } from './GraphicsQuality.js'

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas
    const preset = getGraphicsPreset()
    this.preset = preset

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x0a0a18)
    this.scene.fog = new THREE.FogExp2(0x0a0a18, preset.fogDensity)

    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 280)
    this.camera.position.set(0, 16, 34)
    this.camera.lookAt(0, 1, 0)

    const dpr = Math.min(window.devicePixelRatio || 1, preset.maxDpr)
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: preset.antialias && dpr < 1.5,
      powerPreference: 'high-performance',
      alpha: false,
    })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(dpr)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = preset.exposure

    this.shadowsEnabled = preset.shadows
    if (this.shadowsEnabled) {
      this.renderer.shadowMap.enabled = true
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    }

    this._toonGradient = this._createToonGradient()
    this._matCache = new Map()

    this._setupLights(preset)

    this.cameraTarget = new THREE.Vector3(0, 1, 0)
    this.cameraPos = new THREE.Vector3(0, 16, 34)
    this.cameraShake = 0
    this.fovBase = 50
    this.fovPunch = 0
    this.lookAhead = new THREE.Vector3()
    this._desiredTarget = new THREE.Vector3()

    this._resizeBound = () => this.onResize()
    window.addEventListener('resize', this._resizeBound)
  }

  _createToonGradient() {
    const colors = new Uint8Array([
      70, 70, 80, 255,
      140, 140, 155, 255,
      210, 210, 220, 255,
      255, 255, 255, 255,
    ])
    const tex = new THREE.DataTexture(colors, 4, 1, THREE.RGBAFormat)
    tex.needsUpdate = true
    tex.minFilter = THREE.NearestFilter
    tex.magFilter = THREE.NearestFilter
    return tex
  }

  toonMaterial(color, opts = {}) {
    const key = `${color}_${opts.emissive || 0}_${opts.emissiveIntensity || 0}`
    if (this._matCache.has(key)) return this._matCache.get(key)
    const mat = new THREE.MeshToonMaterial({
      color,
      gradientMap: this._toonGradient,
      ...opts,
    })
    this._matCache.set(key, mat)
    return mat
  }

  _setupLights(preset) {
    this.scene.add(new THREE.AmbientLight(0x3a3a55, 0.55))

    const moon = new THREE.DirectionalLight(0xb0c8ff, 1.15)
    moon.position.set(25, 45, 18)
    if (this.shadowsEnabled) {
      moon.castShadow = true
      const res = preset.shadowMapSize || 1024
      moon.shadow.mapSize.set(res, res)
      moon.shadow.camera.left = -40
      moon.shadow.camera.right = 40
      moon.shadow.camera.top = 40
      moon.shadow.camera.bottom = -40
      moon.shadow.camera.near = 2
      moon.shadow.camera.far = 90
      moon.shadow.bias = -0.0008
    }
    this.scene.add(moon)
    this.moon = moon

    const stadium = new THREE.PointLight(0xff6b1a, 0.7, 90, 1.5)
    stadium.position.set(0, 18, 0)
    this.scene.add(stadium)
    this.stadiumLight = stadium

    this.scene.add(new THREE.HemisphereLight(0x5a6aff, 0x1a1208, 0.35))
  }

  add(obj) {
    this.scene.add(obj)
  }

  remove(obj) {
    this.scene.remove(obj)
  }

  updateCamera(targetPos, velocityHint, dt) {
    if (velocityHint) {
      this.lookAhead.copy(velocityHint).multiplyScalar(0.12)
    } else {
      this.lookAhead.set(0, 0, 0)
    }
    this._desiredTarget.copy(targetPos).add(this.lookAhead)
    this.cameraTarget.lerp(this._desiredTarget, 1 - Math.exp(-5 * dt))

    const desiredX = this.cameraTarget.x * 0.45
    const desiredZ = this.cameraTarget.z * 0.55 + 30
    const desiredY = 15 + Math.min(4, Math.abs(this.cameraTarget.z) * 0.04)

    this.cameraPos.x += (desiredX - this.cameraPos.x) * (1 - Math.exp(-4 * dt))
    this.cameraPos.z += (desiredZ - this.cameraPos.z) * (1 - Math.exp(-4 * dt))
    this.cameraPos.y += (desiredY - this.cameraPos.y) * (1 - Math.exp(-3 * dt))

    let sx = 0
    let sy = 0
    if (this.cameraShake > 0.01) {
      sx = (Math.random() - 0.5) * this.cameraShake
      sy = (Math.random() - 0.5) * this.cameraShake * 0.6
      this.cameraShake *= Math.exp(-8 * dt)
    }

    this.camera.position.set(this.cameraPos.x + sx, this.cameraPos.y + sy, this.cameraPos.z)

    this.fovPunch = Math.max(0, this.fovPunch - dt * 25)
    this.camera.fov = this.fovBase + this.fovPunch
    this.camera.updateProjectionMatrix()

    this.camera.lookAt(this.cameraTarget.x, this.cameraTarget.y + 0.8, this.cameraTarget.z)
  }

  addShake(amount) {
    this.cameraShake = Math.min(2.5, this.cameraShake + amount)
  }

  punchFOV(amount = 6) {
    this.fovPunch = Math.min(12, this.fovPunch + amount)
  }

  render() {
    this.renderer.render(this.scene, this.camera)
  }

  onResize() {
    const w = window.innerWidth
    const h = window.innerHeight
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
  }

  dispose() {
    window.removeEventListener('resize', this._resizeBound)
    this._matCache.forEach((m) => m.dispose())
    this._matCache.clear()
    if (this._toonGradient) this._toonGradient.dispose()
    this.renderer.dispose()
  }
}
