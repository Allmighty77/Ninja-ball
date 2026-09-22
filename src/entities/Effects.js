// ════════════════════════════════════════════════════════════
// EFFETS — Particules scalées par preset qualité
// ════════════════════════════════════════════════════════════
import * as THREE from 'three'
import { scaleParticleCount } from '../engine/GraphicsQuality.js'

export class Effects {
  constructor(renderer) {
    this.renderer = renderer
    this.particles = []
    this.auras = []
    this.zones = []
    this._tmp = new THREE.Vector3()
  }

  spawnImpact(pos, color = 0xff6b1a) {
    this._spawnPoints(pos, color, scaleParticleCount(16), 0.55, 0.28, 4, 6)
  }

  spawnBurst(pos, color, count = 28) {
    this._spawnPoints(
      { x: pos.x, y: (pos.y || 0) + 0.4, z: pos.z },
      color,
      scaleParticleCount(count),
      0.9,
      0.38,
      6,
      10,
    )
  }

  _spawnPoints(pos, color, count, life, size, speedMin, speedMax) {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = pos.x
      positions[i * 3 + 1] = pos.y
      positions[i * 3 + 2] = pos.z
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      const speed = speedMin + Math.random() * (speedMax - speedMin)
      velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed
      velocities[i * 3 + 1] = Math.cos(phi) * speed * 0.85 + 1.5
      velocities[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * speed
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const mat = new THREE.PointsMaterial({
      color,
      size,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })
    const points = new THREE.Points(geo, mat)
    points.frustumCulled = false
    this.renderer.add(points)
    this.particles.push({
      points,
      velocities,
      life,
      maxLife: life,
      isMesh: false,
    })
  }

  spawnDashTrail(pos, color, dir) {
    const count = scaleParticleCount(6)
    for (let i = 0; i < count; i++) {
      const geo = new THREE.SphereGeometry(0.22 - i * 0.025, 6, 5)
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.55 - i * 0.07,
        depthWrite: false,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(
        pos.x - (dir.x || 0) * i * 0.55,
        1.2,
        pos.z - (dir.y || 0) * i * 0.55,
      )
      this.renderer.add(mesh)
      this.particles.push({
        points: mesh,
        velocities: null,
        life: 0.32,
        maxLife: 0.32,
        isMesh: true,
      })
    }
  }

  spawnAura(player, color, duration) {
    const auraGeo = new THREE.SphereGeometry(1.45, 12, 10)
    const auraMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.22,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const aura = new THREE.Mesh(auraGeo, auraMat)
    aura.position.copy(player.position)
    aura.position.y = 1.25
    this.renderer.add(aura)
    this.auras.push({ mesh: aura, player, life: duration, maxLife: duration })
  }

  spawnZone(pos, color, duration) {
    const zoneGeo = new THREE.RingGeometry(0.9, 2.8, 24)
    const zoneMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const zone = new THREE.Mesh(zoneGeo, zoneMat)
    zone.rotation.x = -Math.PI / 2
    zone.position.set(pos.x, 0.06, pos.z)
    this.renderer.add(zone)
    this.zones.push({ mesh: zone, life: duration, maxLife: duration })
  }

  spawnGoalEffect(pos) {
    const colors = [0xff6b1a, 0xffaa3a, 0x00e8ff]
    for (let c = 0; c < 3; c++) {
      this.spawnBurst(pos, colors[c], 32)
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.life -= dt
      if (p.life <= 0) {
        this.renderer.remove(p.points)
        if (p.points.geometry) p.points.geometry.dispose()
        if (p.points.material) p.points.material.dispose()
        this.particles.splice(i, 1)
        continue
      }
      const t = p.life / p.maxLife
      if (!p.isMesh && p.velocities) {
        const arr = p.points.geometry.attributes.position.array
        const n = p.velocities.length / 3
        for (let j = 0; j < n; j++) {
          arr[j * 3] += p.velocities[j * 3] * dt
          arr[j * 3 + 1] += p.velocities[j * 3 + 1] * dt
          arr[j * 3 + 2] += p.velocities[j * 3 + 2] * dt
          p.velocities[j * 3 + 1] -= 14 * dt
        }
        p.points.geometry.attributes.position.needsUpdate = true
        p.points.material.opacity = t
      } else if (p.isMesh) {
        p.points.material.opacity = t * 0.55
        const s = 0.92 + t * 0.08
        p.points.scale.setScalar(s)
      }
    }

    for (let i = this.auras.length - 1; i >= 0; i--) {
      const a = this.auras[i]
      a.life -= dt
      if (a.life <= 0) {
        this.renderer.remove(a.mesh)
        a.mesh.geometry.dispose()
        a.mesh.material.dispose()
        this.auras.splice(i, 1)
        continue
      }
      if (a.player) {
        a.mesh.position.x = a.player.position.x
        a.mesh.position.z = a.player.position.z
        a.mesh.position.y = 1.25
      }
      const pulse = 1 + Math.sin(performance.now() * 0.009) * 0.12
      a.mesh.scale.setScalar(pulse)
      a.mesh.material.opacity = (a.life / a.maxLife) * 0.28
    }

    for (let i = this.zones.length - 1; i >= 0; i--) {
      const z = this.zones[i]
      z.life -= dt
      if (z.life <= 0) {
        this.renderer.remove(z.mesh)
        z.mesh.geometry.dispose()
        z.mesh.material.dispose()
        this.zones.splice(i, 1)
        continue
      }
      z.mesh.rotation.z += dt * 1.8
      const t = z.life / z.maxLife
      z.mesh.material.opacity = t * 0.48
      const s = 1 + (1 - t) * 0.55
      z.mesh.scale.setScalar(s)
    }
  }

  dispose() {
    this.particles.forEach((p) => {
      this.renderer.remove(p.points)
      if (p.points.geometry) p.points.geometry.dispose()
      if (p.points.material) p.points.material.dispose()
    })
    this.auras.forEach((a) => {
      this.renderer.remove(a.mesh)
      a.mesh.geometry.dispose()
      a.mesh.material.dispose()
    })
    this.zones.forEach((z) => {
      this.renderer.remove(z.mesh)
      z.mesh.geometry.dispose()
      z.mesh.material.dispose()
    })
    this.particles = []
    this.auras = []
    this.zones = []
  }
}
