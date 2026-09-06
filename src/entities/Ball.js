// ════════════════════════════════════════════════════════════
// BALLON — Sphère cel-shaded avec traînée de chakra
// Corps physique Cannon-es + mesh Three.js
// ════════════════════════════════════════════════════════════
import * as THREE from 'three'

export class Ball {
  constructor(renderer, physics) {
    this.renderer = renderer
    this.physics = physics
    this.radius = 0.4

    // Corps physique
    this.body = physics.createBall(this.radius)

    // Mesh — sphère cel-shaded
    const geo = new THREE.SphereGeometry(this.radius, 24, 16)
    const mat = renderer.toonMaterial(0xffaa3a, { emissive: 0xff6b1a, emissiveIntensity: 0.2 })
    this.mesh = new THREE.Mesh(geo, mat)
    this.mesh.castShadow = true
    renderer.add(this.mesh)

    // Motifs du ballon (pentagones sombres)
    const dotMat = renderer.toonMaterial(0x1a1a2e)
    for (let i = 0; i < 8; i++) {
      const dotGeo = new THREE.CircleGeometry(0.12, 5)
      const dot = new THREE.Mesh(dotGeo, dotMat)
      const phi = Math.acos(-1 + (2 * i) / 8)
      const theta = Math.sqrt(8 * Math.PI) * phi
      dot.position.set(
        this.radius * 1.01 * Math.cos(theta) * Math.sin(phi),
        this.radius * 1.01 * Math.sin(theta) * Math.sin(phi),
        this.radius * 1.01 * Math.cos(phi),
      )
      dot.lookAt(dot.position.clone().multiplyScalar(2))
      this.mesh.add(dot)
    }

    // Trail (traînée de chakra)
    this.trailPoints = []
    this.trailMaxLen = 20
    this._buildTrail()

    // État
    this.speed = 0
    this.lastOwner = null
  }

  _buildTrail() {
    const trailGeo = new THREE.BufferGeometry()
    const positions = new Float32Array(this.trailMaxLen * 3)
    trailGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const trailMat = new THREE.LineBasicMaterial({ color: 0xff6b1a, transparent: true, opacity: 0.6, linewidth: 2 })
    this.trail = new THREE.Line(trailGeo, trailMat)
    this.trail.frustumCulled = false
    this.renderer.add(this.trail)
  }

  // Applique une force au ballon (tir/passe)
  kick(direction, power) {
    this.body.wakeUp()
    this.body.angularVelocity.set(0, 0, 0)
    this.body.velocity.set(direction.x * power, direction.y * power, direction.z * power)
    this.lastOwner = null
  }

  // Réinitialise le ballon au centre
  reset(z = 0) {
    this.body.position.set(0, 2, z)
    this.body.velocity.set(0, 0, 0)
    this.body.angularVelocity.set(0, 0, 0)
    this.trailPoints = []
    this.lastOwner = null
  }

  // Récupère la position
  get position() {
    return this.body.position
  }

  get velocity() {
    return this.body.velocity
  }

  update(dt) {
    // Sync mesh avec le corps physique
    this.mesh.position.copy(this.body.position)
    this.mesh.quaternion.copy(this.body.quaternion)

    // Vitesse
    this.speed = this.body.velocity.length()

    // Trail à haute vitesse
    if (this.speed > 8) {
      this.trailPoints.push(this.body.position.clone())
      if (this.trailPoints.length > this.trailMaxLen) this.trailPoints.shift()
    } else if (this.trailPoints.length > 0) {
      this.trailPoints.shift()
    }

    this._updateTrail()
  }

  _updateTrail() {
    const positions = this.trail.geometry.attributes.position.array
    for (let i = 0; i < this.trailMaxLen; i++) {
      if (i < this.trailPoints.length) {
        const p = this.trailPoints[i]
        positions[i * 3] = p.x
        positions[i * 3 + 1] = p.y
        positions[i * 3 + 2] = p.z
      } else {
        positions[i * 3] = this.body.position.x
        positions[i * 3 + 1] = this.body.position.y
        positions[i * 3 + 2] = this.body.position.z
      }
    }
    this.trail.geometry.attributes.position.needsUpdate = true
    this.trail.material.opacity = Math.min(0.7, this.speed / 30)
  }

  dispose() {
    this.renderer.remove(this.mesh)
    this.renderer.remove(this.trail)
    this.physics.world.removeBody(this.body)
  }
}
