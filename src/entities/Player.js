// ════════════════════════════════════════════════════════════
// JOUEUR — Capsule colorée avec bandeau frontal
// PRÊT à recevoir des modèles .glb plus tard (loadCharacterModel)
// Contient : mesh, déplacement, jutsu, chakra, cooldowns
// ════════════════════════════════════════════════════════════
import * as THREE from 'three'
import { Effects } from './Effects.js'

export class Player {
  constructor(character, side, renderer, physics, audio, stadium) {
    this.character = character
    this.side = side // 0 = gauche, 1 = droite
    this.renderer = renderer
    this.physics = physics
    this.audio = audio
    this.stadium = stadium
    this.effects = new Effects(renderer)

    // État
    this.position = new THREE.Vector3(side === 0 ? -8 : 8, 0, 0)
    this.velocity = new THREE.Vector3()
    this.facing = new THREE.Vector3(0, 0, side === 0 ? 1 : -1)
    this.chakra = character.chakraMax
    this.chakraMax = character.chakraMax
    this.chakraRegen = 8 // par seconde
    this.hasBall = false
    this.stunned = 0
    this.boostTime = 0
    this.slowMoTime = 0
    this.healTime = 0
    this.copyReady = false
    this.copiedJutsu = null

    // Cooldowns jutsu
    this.cooldowns = [0, 0, 0]

    // Construit le mesh
    this._buildMesh()

    // Seau de chakra au sol (actif pendant les jutsu)
    this.activeSeals = []
  }

  _buildMesh() {
    const c = this.character
    this.group = new THREE.Group()

    // Corps — capsule
    const bodyGeo = new THREE.CapsuleGeometry(0.6, 1.4, 8, 16)
    const bodyMat = this.renderer.toonMaterial(c.color, { emissive: c.color, emissiveIntensity: 0.15 })
    this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat)
    this.bodyMesh.position.y = 1.3
    this.bodyMesh.castShadow = true
    this.group.add(this.bodyMesh)

    // Tête
    const headGeo = new THREE.SphereGeometry(0.45, 16, 12)
    const headMat = this.renderer.toonMaterial(0xf5d4a0)
    this.headMesh = new THREE.Mesh(headGeo, headMat)
    this.headMesh.position.y = 2.5
    this.headMesh.castShadow = true
    this.group.add(this.headMesh)

    // Bandeau frontal (metal headband)
    const bandGeo = new THREE.TorusGeometry(0.46, 0.08, 8, 16)
    const bandMat = this.renderer.toonMaterial(0x404060, { emissive: 0x202040, emissiveIntensity: 0.2 })
    this.bandMesh = new THREE.Mesh(bandGeo, bandMat)
    this.bandMesh.position.y = 2.55
    this.bandMesh.rotation.x = Math.PI / 2
    this.group.add(this.bandMesh)

    // Symbole du village sur le bandeau (plaque)
    const plateGeo = new THREE.BoxGeometry(0.5, 0.15, 0.06)
    const plateMat = this.renderer.toonMaterial(0x606080, { emissive: 0x3060ff, emissiveIntensity: 0.3 })
    this.plateMesh = new THREE.Mesh(plateGeo, plateMat)
    this.plateMesh.position.set(0, 2.55, 0.42)
    this.group.add(this.plateMesh)

    // Anneau de chakra au sol (indicateur de propriétaire)
    const ringGeo = new THREE.RingGeometry(0.8, 1.0, 32)
    const ringMat = new THREE.MeshBasicMaterial({ color: c.color, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
    this.chakraRing = new THREE.Mesh(ringGeo, ringMat)
    this.chakraRing.rotation.x = -Math.PI / 2
    this.chakraRing.position.y = 0.05
    this.group.add(this.chakraRing)

    // Placeholder pour futur modèle .glb
    this.customModel = null

    this.group.position.copy(this.position)
    this.renderer.add(this.group)
  }

  // Charge un modèle .glb personnalisé (pour ajout futur d'assets)
  async loadCharacterModel(url) {
    try {
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
      const loader = new GLTFLoader()
      const gltf = await loader.loadAsync(url)
      // Cache la capsule placeholder
      this.bodyMesh.visible = false
      this.headMesh.visible = false
      this.bandMesh.visible = false
      this.plateMesh.visible = false
      this.customModel = gltf.scene
      this.customModel.traverse((c) => {
        if (c.isMesh) {
          c.castShadow = true
          c.receiveShadow = true
        }
      })
      this.group.add(this.customModel)
      return true
    } catch (e) {
      console.warn(`Modèle ${url} non chargé, utilisation du placeholder`, e)
      return false
    }
  }

  // Déplacement
  move(dir, dt, sprint = false) {
    if (this.stunned > 0) return

    const baseSpeed = this.character.speed
    const sprintMul = sprint ? 1.5 : 1.0
    const boostMul = this.boostTime > 0 ? 1.6 : 1.0
    const slowMul = this.slowMoTime > 0 ? 0.4 : 1.0
    const speed = baseSpeed * sprintMul * boostMul * slowMul

    const lenSq = typeof dir.lengthSq === 'function' ? dir.lengthSq() : (dir.x * dir.x + dir.y * dir.y)
    if (lenSq > 0.01) {
      this.velocity.x = dir.x * speed
      this.velocity.z = dir.y * speed
      // Tourne le joueur vers la direction
      const targetAngle = Math.atan2(dir.x, dir.y)
      this.group.rotation.y = this._lerpAngle(this.group.rotation.y, targetAngle, dt * 10)
      this.facing.set(dir.x, 0, dir.y).normalize()
    } else {
      this.velocity.x *= 0.85
      this.velocity.z *= 0.85
    }

    this.position.x += this.velocity.x * dt
    this.position.z += this.velocity.z * dt

    // Limites du terrain
    const limX = 24
    const limZ = 34
    this.position.x = Math.max(-limX, Math.min(limX, this.position.x))
    this.position.z = Math.max(-limZ, Math.min(limZ, this.position.z))

    this.group.position.copy(this.position)
  }

  _lerpAngle(a, b, t) {
    let diff = b - a
    while (diff > Math.PI) diff -= Math.PI * 2
    while (diff < -Math.PI) diff += Math.PI * 2
    return a + diff * Math.min(1, t)
  }

  // Tir/passe
  shoot(ball, power = 1.0, towardsGoal = true) {
    if (!this.hasBall) return false
    const dir = new THREE.Vector3()
    if (towardsGoal) {
      // Direction vers le but adverse
      const goalZ = this.side === 0 ? -35 : 35
      dir.set(goalZ - this.position.x === 0 ? 0 : (0 - this.position.x) * 0.3, 0, goalZ - this.position.z).normalize()
    } else {
      dir.copy(this.facing)
    }
    const force = this.character.shotPower * 6 * power
    ball.kick(dir, force)
    this.hasBall = false
    ball.lastOwner = this
    this.audio.play('shoot')
    this.effects.spawnImpact(ball.position.clone(), this.character.color)
    this.renderer.addShake(0.3)
    return true
  }

  // Passe (vers un point)
  pass(ball, target) {
    if (!this.hasBall) return false
    const dir = new THREE.Vector3().subVectors(target, ball.position).normalize()
    const force = this.character.shotPower * 4
    ball.kick(dir, force)
    this.hasBall = false
    ball.lastOwner = this
    this.audio.play('shoot')
    return true
  }

  // Dash — déplacement rapide
  dash(dir) {
    const cost = 20
    if (this.chakra < cost || this.stunned > 0) return false
    this.chakra -= cost
    const dashDist = 8
    this.position.x += dir.x * dashDist
    this.position.z += dir.y * dashDist
    const limX = 24
    const limZ = 34
    this.position.x = Math.max(-limX, Math.min(limX, this.position.x))
    this.position.z = Math.max(-limZ, Math.min(limZ, this.position.z))
    this.group.position.copy(this.position)
    this.audio.play('dash')
    this.effects.spawnDashTrail(this.position.clone(), this.character.color, dir)
    return true
  }

  // Jutsu — exécute un des 3 jutsu
  useJutsu(index, ball, opponent) {
    if (index < 0 || index > 2) return false
    const jutsu = this.character.jutsus[index]
    if (this.cooldowns[index] > 0 || this.chakra < jutsu.cost || this.stunned > 0) return false

    this.chakra -= jutsu.cost
    this.cooldowns[index] = jutsu.cooldown
    this.audio.play('jutsu')

    // Sceau au sol
    const sealTick = this.stadium.spawnSeal(this.position.clone(), this.character.color, 1.5)
    if (sealTick) this.activeSeals.push(sealTick)

    // Effet selon type de jutsu
    switch (jutsu.type) {
      case 'shot':
        if (this.hasBall || this._nearBall(ball, 2)) {
          this.shoot(ball, 2.0, true)
          this.effects.spawnBurst(this.position.clone(), this.character.color, 30)
          this.renderer.addShake(0.8)
        }
        break
      case 'pass':
        if (this.hasBall) {
          // Passe multi-cible — tire vers le but avec courbe
          this.shoot(ball, 1.5, true)
          this.effects.spawnBurst(this.position.clone(), this.character.color, 20)
        }
        break
      case 'boost':
        this.boostTime = 5.0
        this.effects.spawnAura(this, this.character.color, 5.0)
        break
      case 'tackle':
        // Vole le ballon si près de l'adversaire
        if (opponent && opponent.hasBall) {
          const dist = this.position.distanceTo(opponent.position)
          if (dist < 5) {
            opponent.hasBall = false
            opponent.stunned = 1.5
            this.hasBall = true
            ball.lastOwner = this
            this.effects.spawnBurst(opponent.position.clone(), 0xffff00, 25)
            this.renderer.addShake(0.6)
            this.audio.play('hit')
          }
        }
        break
      case 'dash':
        this.dash({ x: this.facing.x, y: this.facing.z })
        this.effects.spawnBurst(this.position.clone(), this.character.color, 15)
        break
      case 'slowmo':
        if (opponent) {
          opponent.slowMoTime = 4.0
          this.effects.spawnAura(opponent, 0x88aaff, 4.0)
        }
        break
      case 'zone':
        // Ralentit le ballon
        if (ball) {
          ball.body.velocity.scale(0.3, ball.body.velocity)
          this.effects.spawnZone(ball.position.clone(), this.character.color, 4.0)
        }
        break
      case 'heal':
        this.chakra = Math.min(this.chakraMax, this.chakra + 40)
        this.healTime = 3.0
        this.effects.spawnAura(this, 0x44ff88, 3.0)
        break
      case 'copy':
        if (opponent) {
          this.copyReady = true
          this.effects.spawnAura(this, 0xffffff, 3.0)
        }
        break
    }
    return true
  }

  _nearBall(ball, dist) {
    return this.position.distanceTo(new THREE.Vector3(ball.position.x, 0, ball.position.z)) < dist
  }

  // Mise à jour
  update(dt, ball) {
    // Régénération chakra
    this.chakra = Math.min(this.chakraMax, this.chakra + this.chakraRegen * dt)

    // Cooldowns
    for (let i = 0; i < 3; i++) {
      if (this.cooldowns[i] > 0) this.cooldowns[i] = Math.max(0, this.cooldowns[i] - dt)
    }

    // Timers d'effets
    if (this.stunned > 0) this.stunned -= dt
    if (this.boostTime > 0) this.boostTime -= dt
    if (this.slowMoTime > 0) this.slowMoTime -= dt
    if (this.healTime > 0) this.healTime -= dt

    // Animation du corps (rebond léger au mouvement)
    const moving = this.velocity.lengthSq() > 0.5
    if (moving) {
      this.bodyMesh.position.y = 1.3 + Math.abs(Math.sin(performance.now() * 0.012)) * 0.1
    } else {
      this.bodyMesh.position.y += (1.3 - this.bodyMesh.position.y) * dt * 5
    }

    // Anneau de chakra pulsant
    const ringPulse = 1 + Math.sin(performance.now() * 0.004) * 0.1
    this.chakraRing.scale.set(ringPulse, ringPulse, 1)
    this.chakraRing.material.opacity = this.hasBall ? 0.8 : 0.3 + (this.chakra / this.chakraMax) * 0.3

    // Possession du ballon
    if (this.hasBall && ball) {
      // Ballon collé devant le joueur
      const offset = this.facing.clone().multiplyScalar(1.2)
      ball.body.position.set(
        this.position.x + offset.x,
        0.6,
        this.position.z + offset.z,
      )
      ball.body.velocity.set(0, 0, 0)
      ball.body.angularVelocity.set(0, 0, 0)
    }

    // Sceaux actifs
    this.activeSeals = this.activeSeals.filter((tick) => tick(dt))

    // Effets
    this.effects.update(dt)
  }

  dispose() {
    this.effects.dispose()
    this.renderer.remove(this.group)
  }
}
