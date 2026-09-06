// ════════════════════════════════════════════════════════════
// EFFETS — Particules d'impact, auras, trails, sceaux, éclairs
// Système de particules procédural avec Three.js
// ════════════════════════════════════════════════════════════
import * as THREE from 'three'

export class Effects {
  constructor(renderer) {
    this.renderer = renderer
    this.particles = []
    this.auras = []
    this.zones = []
  }

  // Particules d'impact (explosion de particules)
  spawnImpact(pos, color = 0xff6b1a) {
    const count = 20
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3)
    const velocities = []
    for (let i = 0; i < count; i++) {
      positions[i * 3] = pos.x
      positions[i * 3 + 1] = pos.y
      positions[i * 3 + 2] = pos.z
      const angle = Math.random() * Math.PI * 2
      const speed = 3 + Math.random() * 5
      velocities.push({
        x: Math.cos(angle) * speed,
        y: 2 + Math.random() * 4,
        z: Math.sin(angle) * speed,
      })
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const mat = new THREE.PointsMaterial({ color, size: 0.3, transparent: true, opacity: 1, blending: THREE.AdditiveBlending })
    const points = new THREE.Points(geo, mat)
    this.renderer.add(points)
    this.particles.push({ points, velocities, life: 0.6, maxLife: 0.6 })
  }

  // Explosion plus large (jutsu puissant)
  spawnBurst(pos, color, count = 30) {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3)
    const velocities = []
    for (let i = 0; i < count; i++) {
      positions[i * 3] = pos.x
      positions[i * 3 + 1] = pos.y + 0.5
      positions[i * 3 + 2] = pos.z
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      const speed = 5 + Math.random() * 8
      velocities.push({
        x: Math.sin(phi) * Math.cos(theta) * speed,
        y: Math.cos(phi) * speed,
        z: Math.sin(phi) * Math.sin(theta) * speed,
      })
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const mat = new THREE.PointsMaterial({ color, size: 0.4, transparent: true, opacity: 1, blending: THREE.AdditiveBlending })
    const points = new THREE.Points(geo, mat)
    this.renderer.add(points)
    this.particles.push({ points, velocities, life: 1.0, maxLife: 1.0 })
  }

  // Trail de dash
  spawnDashTrail(pos, color, dir) {
    const count = 10
    for (let i = 0; i < count; i++) {
      const geo = new THREE.SphereGeometry(0.3 - i * 0.02, 8, 6)
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6 - i * 0.05 })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(pos.x - dir.x * i * 0.5, 1.3, pos.z - dir.y * i * 0.5)
      this.renderer.add(mesh)
      this.particles.push({ points: mesh, velocities: [], life: 0.4, maxLife: 0.4, isMesh: true })
    }
  }

  // Aura autour d'un joueur (boost, heal, etc.)
  spawnAura(player, color, duration) {
    const auraGeo = new THREE.SphereGeometry(1.5, 16, 12)
    const auraMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.25, side: THREE.BackSide, blending: THREE.AdditiveBlending })
    const aura = new THREE.Mesh(auraGeo, auraMat)
    aura.position.copy(player.position)
    aura.position.y = 1.3
    this.renderer.add(aura)
    this.auras.push({ mesh: aura, player, color, life: duration, maxLife: duration })
  }

  // Zone d'effet au sol
  spawnZone(pos, color, duration) {
    const zoneGeo = new THREE.RingGeometry(1, 3, 32)
    const zoneMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })
    const zone = new THREE.Mesh(zoneGeo, zoneMat)
    zone.rotation.x = -Math.PI / 2
    zone.position.set(pos.x, 0.05, pos.z)
    this.renderer.add(zone)
    this.zones.push({ mesh: zone, life: duration, maxLife: duration })
  }

  // Particules de but (grande explosion)
  spawnGoalEffect(pos) {
    for (let c = 0; c < 3; c++) {
      const colors = [0xff6b1a, 0xffaa3a, 0x00ffff]
      this.spawnBurst(pos, colors[c], 40)
    }
  }

  update(dt) {
    // Particules
    this.particles = this.particles.filter((p) => {
      p.life -= dt
      if (p.life <= 0) {
        this.renderer.remove(p.points)
        if (p.points.geometry) p.points.geometry.dispose()
        if (p.points.material) p.points.material.dispose()
        return false
      }
      const positions = p.points.geometry?.attributes?.position
      if (positions && !p.isMesh) {
        const arr = positions.array
        for (let i = 0; i < p.velocities.length; i++) {
          arr[i * 3] += p.velocities[i].x * dt
          arr[i * 3 + 1] += p.velocities[i].y * dt
          arr[i * 3 + 2] += p.velocities[i].z * dt
          p.velocities[i].y -= 15 * dt // gravité
        }
        positions.needsUpdate = true
      }
      if (p.points.material) {
        p.points.material.opacity = p.life / p.maxLife
      }
      if (p.isMesh && p.points.material) {
        p.points.material.opacity = (p.life / p.maxLife) * 0.6
        p.points.scale.multiplyScalar(1 - dt * 2)
      }
      return true
    })

    // Auras
    this.auras = this.auras.filter((a) => {
      a.life -= dt
      if (a.life <= 0) {
        this.renderer.remove(a.mesh)
        a.mesh.geometry.dispose()
        a.mesh.material.dispose()
        return false
      }
      if (a.player) {
        a.mesh.position.copy(a.player.position)
        a.mesh.position.y = 1.3
      }
      const pulse = 1 + Math.sin(performance.now() * 0.008) * 0.1
      a.mesh.scale.setScalar(pulse)
      a.mesh.material.opacity = (a.life / a.maxLife) * 0.3
      return true
    })

    // Zones
    this.zones = this.zones.filter((z) => {
      z.life -= dt
      if (z.life <= 0) {
        this.renderer.remove(z.mesh)
        z.mesh.geometry.dispose()
        z.mesh.material.dispose()
        return false
      }
      z.mesh.rotation.z += dt * 2
      z.mesh.material.opacity = (z.life / z.maxLife) * 0.5
      const s = 1 + (1 - z.life / z.maxLife) * 0.5
      z.mesh.scale.setScalar(s)
      return true
    })
  }

  dispose() {
    this.particles.forEach((p) => this.renderer.remove(p.points))
    this.auras.forEach((a) => this.renderer.remove(a.mesh))
    this.zones.forEach((z) => this.renderer.remove(z.mesh))
    this.particles = []
    this.auras = []
    this.zones = []
  }
}
