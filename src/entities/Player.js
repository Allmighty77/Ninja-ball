// ════════════════════════════════════════════════════════════
// JOUEUR — Personnage ninja low-poly stylisé (cel-shaded)
// Corps complet + cheveux uniques + vêtements + bandeau
// Contient : mesh, déplacement, jutsu, chakra, cooldowns
// ════════════════════════════════════════════════════════════
import * as THREE from 'three'
import { Effects } from './Effects.js'

export class Player {
  constructor(character, side, renderer, physics, audio, stadium) {
    this.character = character
    this.side = side // 0 = joueur (score +Z), 1 = IA (score -Z)
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

    // Animation
    this.animTime = 0
    this.isMoving = false

    // Construit le mesh
    this._buildMesh()

    // Seaux de chakra au sol (actifs pendant les jutsu)
    this.activeSeals = []
  }

  _buildMesh() {
    const c = this.character
    this.group = new THREE.Group()

    // ─── CORPS ───────────────────────────────────────────────
    // Torse (veste ninja)
    const torsoGeo = new THREE.BoxGeometry(1.1, 1.3, 0.55)
    const torsoMat = this.renderer.toonMaterial(c.color, { emissive: c.color, emissiveIntensity: 0.12 })
    this.torso = new THREE.Mesh(torsoGeo, torsoMat)
    this.torso.position.y = 1.55
    this.torso.castShadow = true
    this.group.add(this.torso)

    // Col / haut de la veste
    const collarGeo = new THREE.BoxGeometry(1.15, 0.25, 0.58)
    const collarMat = this.renderer.toonMaterial(c.accentColor || c.color, { emissive: c.accentColor || c.color, emissiveIntensity: 0.1 })
    const collar = new THREE.Mesh(collarGeo, collarMat)
    collar.position.y = 2.2
    collar.castShadow = true
    this.group.add(collar)

    // Pantalon
    const pantsGeo = new THREE.BoxGeometry(1.0, 0.9, 0.5)
    const pantsMat = this.renderer.toonMaterial(0x1a1a2e)
    this.pants = new THREE.Mesh(pantsGeo, pantsMat)
    this.pants.position.y = 0.7
    this.pants.castShadow = true
    this.group.add(this.pants)

    // ─── JAMBES ──────────────────────────────────────────────
    this.legs = []
    for (const side of [-1, 1]) {
      const leg = new THREE.Group()
      const thighGeo = new THREE.CapsuleGeometry(0.18, 0.45, 4, 8)
      const thigh = new THREE.Mesh(thighGeo, pantsMat)
      thigh.position.y = -0.35
      thigh.castShadow = true
      leg.add(thigh)

      const shinGeo = new THREE.CapsuleGeometry(0.15, 0.4, 4, 8)
      const shinMat = this.renderer.toonMaterial(0x2a2a3e)
      const shin = new THREE.Mesh(shinGeo, shinMat)
      shin.position.y = -0.9
      shin.castShadow = true
      leg.add(shin)

      // Chaussure
      const shoeGeo = new THREE.BoxGeometry(0.28, 0.18, 0.4)
      const shoeMat = this.renderer.toonMaterial(0x111122)
      const shoe = new THREE.Mesh(shoeGeo, shoeMat)
      shoe.position.set(0, -1.25, 0.05)
      shoe.castShadow = true
      leg.add(shoe)

      leg.position.set(side * 0.28, 0.55, 0)
      this.group.add(leg)
      this.legs.push(leg)
    }

    // ─── BRAS ────────────────────────────────────────────────
    this.arms = []
    const armMat = this.renderer.toonMaterial(c.color, { emissive: c.color, emissiveIntensity: 0.08 })
    const skinMat = this.renderer.toonMaterial(0xf5d4a0)
    for (const side of [-1, 1]) {
      const arm = new THREE.Group()
      const upperGeo = new THREE.CapsuleGeometry(0.14, 0.4, 4, 8)
      const upper = new THREE.Mesh(upperGeo, armMat)
      upper.position.y = -0.25
      upper.castShadow = true
      arm.add(upper)

      const lowerGeo = new THREE.CapsuleGeometry(0.12, 0.35, 4, 8)
      const lower = new THREE.Mesh(lowerGeo, skinMat)
      lower.position.y = -0.7
      lower.castShadow = true
      arm.add(lower)

      // Main
      const handGeo = new THREE.SphereGeometry(0.12, 8, 6)
      const hand = new THREE.Mesh(handGeo, skinMat)
      hand.position.y = -1.0
      hand.castShadow = true
      arm.add(hand)

      arm.position.set(side * 0.7, 2.0, 0)
      this.group.add(arm)
      this.arms.push(arm)
    }

    // ─── TÊTE ────────────────────────────────────────────────
    const headGeo = new THREE.SphereGeometry(0.42, 16, 12)
    this.headMesh = new THREE.Mesh(headGeo, skinMat)
    this.headMesh.position.y = 2.65
    this.headMesh.castShadow = true
    this.group.add(this.headMesh)

    // Yeux simples
    const eyeMat = this.renderer.toonMaterial(0x1a1a2e)
    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), eyeMat)
      eye.position.set(side * 0.15, 2.7, 0.38)
      this.group.add(eye)
    }

    // ─── BANDEAU FRONTAL ─────────────────────────────────────
    const bandGeo = new THREE.TorusGeometry(0.44, 0.07, 8, 20)
    const bandMat = this.renderer.toonMaterial(0x303050, { emissive: 0x101030, emissiveIntensity: 0.2 })
    this.bandMesh = new THREE.Mesh(bandGeo, bandMat)
    this.bandMesh.position.y = 2.72
    this.bandMesh.rotation.x = Math.PI / 2
    this.group.add(this.bandMesh)

    // Plaque métallique
    const plateGeo = new THREE.BoxGeometry(0.42, 0.18, 0.06)
    const plateMat = this.renderer.toonMaterial(0x7080a0, { emissive: 0x3060ff, emissiveIntensity: 0.35 })
    this.plateMesh = new THREE.Mesh(plateGeo, plateMat)
    this.plateMesh.position.set(0, 2.72, 0.4)
    this.group.add(this.plateMesh)

    // Symbole simple (feuille / spiral selon perso)
    const symbolGeo = new THREE.CircleGeometry(0.08, 8)
    const symbolMat = new THREE.MeshBasicMaterial({ color: 0x1a1a2e })
    const symbol = new THREE.Mesh(symbolGeo, symbolMat)
    symbol.position.set(0, 2.72, 0.44)
    this.group.add(symbol)

    // ─── CHEVEUX UNIQUES PAR PERSONNAGE ──────────────────────
    this._buildHair(c.id)

    // ─── ANNEAU DE CHAKRA AU SOL ─────────────────────────────
    const ringGeo = new THREE.RingGeometry(0.7, 0.95, 32)
    const ringMat = new THREE.MeshBasicMaterial({
      color: c.color,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    })
    this.chakraRing = new THREE.Mesh(ringGeo, ringMat)
    this.chakraRing.rotation.x = -Math.PI / 2
    this.chakraRing.position.y = 0.04
    this.group.add(this.chakraRing)

    // Placeholder pour futur modèle .glb
    this.customModel = null
    this.bodyMesh = this.torso // pour compatibilité animation

    this.group.position.copy(this.position)
    this.renderer.add(this.group)
  }

  _buildHair(id) {
    const hairGroup = new THREE.Group()
    hairGroup.position.y = 2.65

    if (id === 'naruto') {
      // Cheveux jaunes hérissés
      const hairMat = this.renderer.toonMaterial(0xffdd44, { emissive: 0xffaa00, emissiveIntensity: 0.15 })
      // Volume principal
      const main = new THREE.Mesh(new THREE.SphereGeometry(0.48, 12, 10), hairMat)
      main.position.y = 0.15
      main.scale.set(1.05, 0.9, 1.05)
      hairGroup.add(main)
      // Pics
      for (let i = 0; i < 8; i++) {
        const spike = new THREE.Mesh(
          new THREE.ConeGeometry(0.12, 0.45, 5),
          hairMat,
        )
        const a = (i / 8) * Math.PI * 2
        spike.position.set(Math.cos(a) * 0.35, 0.35, Math.sin(a) * 0.3)
        spike.rotation.z = Math.cos(a) * 0.4
        spike.rotation.x = -0.3 + Math.sin(a) * 0.2
        hairGroup.add(spike)
      }
    } else if (id === 'sasuke') {
      // Cheveux noirs pointus vers l'arrière
      const hairMat = this.renderer.toonMaterial(0x1a1a28, { emissive: 0x0a0a14, emissiveIntensity: 0.1 })
      const main = new THREE.Mesh(new THREE.SphereGeometry(0.46, 12, 10), hairMat)
      main.position.y = 0.12
      main.scale.set(1.0, 0.85, 1.1)
      hairGroup.add(main)
      // Mèches arrière
      for (let i = 0; i < 5; i++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.5, 5), hairMat)
        spike.position.set((i - 2) * 0.12, 0.25, -0.35)
        spike.rotation.x = 0.8
        hairGroup.add(spike)
      }
      // Mèche frontale
      const bang = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.35, 0.08), hairMat)
      bang.position.set(-0.2, 0.05, 0.4)
      bang.rotation.z = 0.3
      hairGroup.add(bang)
    } else if (id === 'sakura') {
      // Cheveux roses courts
      const hairMat = this.renderer.toonMaterial(0xff6b9d, { emissive: 0xff4b8b, emissiveIntensity: 0.12 })
      const main = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 12), hairMat)
      main.position.y = 0.18
      main.scale.set(1.1, 0.95, 1.05)
      hairGroup.add(main)
      // Deux pics latéraux
      for (const side of [-1, 1]) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.4, 6), hairMat)
        spike.position.set(side * 0.4, 0.3, 0)
        spike.rotation.z = side * -0.6
        hairGroup.add(spike)
      }
    } else if (id === 'kakashi') {
      // Cheveux argentés + masque
      const hairMat = this.renderer.toonMaterial(0xc0c8d8, { emissive: 0x8890a0, emissiveIntensity: 0.1 })
      const main = new THREE.Mesh(new THREE.SphereGeometry(0.47, 12, 10), hairMat)
      main.position.y = 0.14
      main.scale.set(1.05, 0.9, 1.05)
      hairGroup.add(main)
      // Pics désordonnés
      for (let i = 0; i < 6; i++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.4, 5), hairMat)
        const a = (i / 6) * Math.PI * 2
        spike.position.set(Math.cos(a) * 0.3, 0.35, Math.sin(a) * 0.25)
        spike.rotation.z = Math.cos(a) * 0.5
        hairGroup.add(spike)
      }
      // Masque (bas du visage)
      const maskMat = this.renderer.toonMaterial(0x2a2a3a)
      const mask = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.35, 0.35), maskMat)
      mask.position.set(0, -0.25, 0.15)
      hairGroup.add(mask)
    }

    this.group.add(hairGroup)
    this.hairGroup = hairGroup
  }

  // Charge un modèle .glb personnalisé (pour ajout futur d'assets)
  async loadCharacterModel(url) {
    try {
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
      const loader = new GLTFLoader()
      const gltf = await loader.loadAsync(url)
      // Cache le placeholder
      this.group.children.forEach((ch) => {
        if (ch !== this.chakraRing) ch.visible = false
      })
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
      this.group.rotation.y = this._lerpAngle(this.group.rotation.y, targetAngle, dt * 12)
      this.facing.set(dir.x, 0, dir.y).normalize()
      this.isMoving = true
    } else {
      this.velocity.x *= 0.85
      this.velocity.z *= 0.85
      this.isMoving = false
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

  // Tir/passe — CORRIGÉ : direction correcte vers le but adverse
  shoot(ball, power = 1.0, towardsGoal = true) {
    if (!this.hasBall) return false
    const dir = new THREE.Vector3()
    if (towardsGoal) {
      // Joueur (side 0) score en +Z, IA (side 1) score en -Z
      const goalZ = this.side === 0 ? 35 : -35
      // Légère correction vers le centre en X pour un tir plus précis
      dir.set(-this.position.x * 0.25, 0.15, goalZ - this.position.z).normalize()
    } else {
      dir.copy(this.facing)
      dir.y = 0.1
      dir.normalize()
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
        if (this.hasBall || this._nearBall(ball, 2.5)) {
          this.hasBall = true
          this.shoot(ball, 2.0, true)
          this.effects.spawnBurst(this.position.clone(), this.character.color, 30)
          this.renderer.addShake(0.8)
        }
        break
      case 'pass':
        if (this.hasBall) {
          this.shoot(ball, 1.5, true)
          this.effects.spawnBurst(this.position.clone(), this.character.color, 20)
        }
        break
      case 'boost':
        this.boostTime = 5.0
        this.effects.spawnAura(this, this.character.color, 5.0)
        break
      case 'tackle':
        if (opponent && opponent.hasBall) {
          const dist = this.position.distanceTo(opponent.position)
          if (dist < 5.5) {
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

    // Animation de course / idle
    this.animTime += dt * (this.isMoving ? 10 : 3)
    if (this.legs && this.legs.length === 2) {
      const swing = Math.sin(this.animTime) * (this.isMoving ? 0.55 : 0.08)
      this.legs[0].rotation.x = swing
      this.legs[1].rotation.x = -swing
      if (this.arms && this.arms.length === 2) {
        this.arms[0].rotation.x = -swing * 0.7
        this.arms[1].rotation.x = swing * 0.7
      }
    }

    // Légère bob du torso
    if (this.torso) {
      this.torso.position.y = 1.55 + Math.abs(Math.sin(this.animTime * 0.5)) * (this.isMoving ? 0.06 : 0.02)
    }

    // Anneau de chakra pulsant
    const ringPulse = 1 + Math.sin(performance.now() * 0.004) * 0.12
    this.chakraRing.scale.set(ringPulse, ringPulse, 1)
    this.chakraRing.material.opacity = this.hasBall ? 0.85 : 0.3 + (this.chakra / this.chakraMax) * 0.35

    // Possession du ballon
    if (this.hasBall && ball) {
      const offset = this.facing.clone().multiplyScalar(1.25)
      ball.body.position.set(
        this.position.x + offset.x,
        0.55,
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
