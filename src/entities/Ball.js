// ════════════════════════════════════════════════════════════
// BALLON — Sphère cel-shaded + traînée de chakra optimisée
// ════════════════════════════════════════════════════════════
import * as THREE from 'three'

export class Ball {
  constructor(renderer, physics) {
    this.renderer = renderer
    this.physics = physics
    this.radius = 0.4

    this.body = physics.createBall(this.radius)

    const geo = new THREE.SphereGeometry(this.radius, 20, 14)
    const mat = renderer.toonMaterial(0xffaa3a, { emissive: 0xff6b1a, emissiveIntensity: 0.22 })
    this.mesh = new THREE.Mesh(geo, mat)
    this.mesh.castShadow = true
    renderer.add(this.mesh)

    // Motifs (légers)
    const dotMat = renderer.toonMaterial(0x1a1a2e)
    for (let i = 0; i < 6; i++) {
      const dotGeo = new THREE.CircleGeometry(0.11, 5)
      const dot = new THREE.Mesh(dotGeo, dotMat)
      const phi = Math.acos(-1 + (2 * i) / 6)
      const theta = Math.sqrt(6 * Math.PI) * phi
      const r = this.radius * 1.01
      dot.position.set(
        r * Math.cos(theta) * Math.sin(phi),
        r * Math.sin(theta) * Math.sin(phi),
        r * Math.cos(phi),
      )
      dot.lookAt(0, 0, 0)
      this.mesh.add(dot)
    }

    // Trail — buffer fixe, pas de .clone() chaque frame
    this.trailMaxLen = 18
    this.trailX = new Float32Array(this.trailMaxLen)
    this.trailY = new Float32Array(this.trailMaxLen)
    this.trailZ = new Float32Array(this.trailMaxLen)
    this.trailLen = 0
    this._buildTrail()

    this.speed = 0
    this.lastOwner = null
  }

  _buildTrail() {
    const trailGeo = new THREE.BufferGeometry()
    const positions = new Float32Array(this.trailMaxLen * 3)
    trailGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const trailMat = new THREE.LineBasicMaterial({
      color: 0xff6b1a,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    })
    this.trail = new THREE.Line(trailGeo, trailMat)
    this.trail.frustumCulled = false
    this.renderer.add(this.trail)
  }

  kick(direction, power) {
    this.body.wakeUp()
    this.body.angularVelocity.set(0, 0, 0)
    this.body.velocity.set(direction.x * power, direction.y * power, direction.z * power)
    this.lastOwner = null
  }

  reset(z = 0) {
    this.body.wakeUp()
    this.body.position.set(0, 2, z)
    this.body.velocity.set(0, 0, 0)
    this.body.angularVelocity.set(0, 0, 0)
    this.trailLen = 0
    this.lastOwner = null
  }

  get position() {
    return this.body.position
  }

  get velocity() {
    return this.body.velocity
  }

  update(dt) {
    this.mesh.position.copy(this.body.position)
    this.mesh.quaternion.copy(this.body.quaternion)

    this.speed = this.body.velocity.length()

    // Trail sans allocation
    if (this.speed > 7.5) {
      if (this.trailLen < this.trailMaxLen) {
        this.trailX[this.trailLen] = this.body.position.x
        this.trailY[this.trailLen] = this.body.position.y
        this.trailZ[this.trailLen] = this.body.position.z
        this.trailLen++
      } else {
        // shift left
        for (let i = 0; i < this.trailMaxLen - 1; i++) {
          this.trailX[i] = this.trailX[i + 1]
          this.trailY[i] = this.trailY[i + 1]
          this.trailZ[i] = this.trailZ[i + 1]
        }
        this.trailX[this.trailMaxLen - 1] = this.body.position.x
        this.trailY[this.trailMaxLen - 1] = this.body.position.y
        this.trailZ[this.trailMaxLen - 1] = this.body.position.z
      }
    } else if (this.trailLen > 0) {
      this.trailLen--
    }

    this._updateTrail()
  }

  _updateTrail() {
    const positions = this.trail.geometry.attributes.position.array
    const px = this.body.position.x
    const py = this.body.position.y
    const pz = this.body.position.z
    for (let i = 0; i < this.trailMaxLen; i++) {
      if (i < this.trailLen) {
        positions[i * 3] = this.trailX[i]
        positions[i * 3 + 1] = this.trailY[i]
        positions[i * 3 + 2] = this.trailZ[i]
      } else {
        positions[i * 3] = px
        positions[i * 3 + 1] = py
        positions[i * 3 + 2] = pz
      }
    }
    this.trail.geometry.attributes.position.needsUpdate = true
    this.trail.material.opacity = Math.min(0.65, this.speed / 28)
  }

  dispose() {
    this.renderer.remove(this.mesh)
    this.renderer.remove(this.trail)
    this.mesh.geometry.dispose()
    this.trail.geometry.dispose()
    this.physics.world.removeBody(this.body)
  }
}
