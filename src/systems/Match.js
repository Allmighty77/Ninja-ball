// ════════════════════════════════════════════════════════════
// MATCH — Logique de partie (durée, score, buts, possession)
// Gère la boucle de jeu, le chrono, les événements de but
// ════════════════════════════════════════════════════════════
import * as THREE from 'three'
import { Renderer } from '../engine/Renderer.js'
import { Physics } from '../engine/Physics.js'
import { Input } from '../engine/Input.js'
import { AudioEngine } from '../engine/Audio.js'
import { Stadium, FIELD } from '../entities/Stadium.js'
import { Ball } from '../entities/Ball.js'
import { Player } from '../entities/Player.js'
import { AI } from '../systems/AI.js'
import { HUD } from '../systems/HUD.js'
import { saveMatchResult } from '../data/db.js'

export class Match {
  constructor(playerChar, aiChar, audio) {
    this.playerChar = playerChar
    this.aiChar = aiChar
    this.audio = audio

    // Canvas Three.js
    this.canvas = document.createElement('canvas')
    this.canvas.className = 'game-canvas'
    document.getElementById('app').appendChild(this.canvas)

    // Moteurs
    this.renderer = new Renderer(this.canvas)
    this.physics = new Physics()
    this.input = new Input()

    // Entités
    this.stadium = new Stadium(this.renderer, this.physics)
    this.ball = new Ball(this.renderer, this.physics)
    this.player = new Player(playerChar, 0, this.renderer, this.physics, this.audio, this.stadium)
    this.aiPlayer = new Player(aiChar, 1, this.renderer, this.physics, this.audio, this.stadium)
    // Try to load optional custom models from /models/<id>.glb
    try {
      this.player.loadCharacterModel(`/models/${playerChar.id}.glb`)
    } catch (e) {}
    try {
      this.aiPlayer.loadCharacterModel(`/models/${aiChar.id}.glb`)
    } catch (e) {}
    this.ai = new AI(this.aiPlayer, this.ball, this.player, this.stadium)

    // HUD
    this.hud = new HUD()
    this.hud.mount(document.getElementById('app'))
    this.hud.updateScore(0, 0, playerChar.name, aiChar.name)
    this.hud.registerMobileInput(this.input)

    // État du match
    this.timeLeft = 120 // 2 minutes
    this.scoreL = 0
    this.scoreR = 0
    this.goalCooldown = 0
    this.gameOver = false
    this.onEnd = null
    this.slowMo = 1.0

    // Sifflet de début
    this.audio.play('whistle')

    this._lastTime = performance.now()
    this._running = false
  }

  start() {
    this._running = true
    this._loop()
  }

  stop() {
    this._running = false
  }

  _loop = () => {
    if (!this._running) return
    const now = performance.now()
    const dt = Math.min(0.033, (now - this._lastTime) / 1000)
    this._lastTime = now
    this.update(dt)
    this.renderer.render(dt)
    requestAnimationFrame(this._loop)
  }

  update(dt) {
    if (this.gameOver) return

    // Slow-mo
    const effectiveDt = dt * this.slowMo
    if (this.slowMo < 1.0) {
      this.slowMo = Math.min(1.0, this.slowMo + dt * 0.5)
    }

    // Chrono
    this.timeLeft -= dt
    if (this.timeLeft <= 0) {
      this.timeLeft = 0
      this._endMatch()
      return
    }

    // Cooldown de but (reset)
    if (this.goalCooldown > 0) {
      this.goalCooldown -= dt
      // Pendant le cooldown, on gèle les contrôles
      this.physics.step(effectiveDt)
      this.ball.update(effectiveDt)
      this.stadium.update(effectiveDt, performance.now() / 1000)
      this.renderer.updateCamera(new THREE.Vector3(0, 1, 0), dt)
      this.hud.updateTimer(this.timeLeft)
      return
    }

    // Entrées
    this.input.update()

    // Joueur humain
    this.player.move(this.input.move, effectiveDt, this.input.sprint)

    // Actions du joueur
    if (this.input.actions.shoot) {
      if (this.player.hasBall) {
        this.player.shoot(this.ball, 1.0, true)
      } else {
        // Tentative de vol si près de l'IA
        const dist = this.player.position.distanceTo(this.aiPlayer.position)
        if (dist < 3.2 && this.aiPlayer.hasBall) {
          this.aiPlayer.hasBall = false
          this.player.hasBall = true
          this.ball.lastOwner = this.player
          this.audio.play('hit')
          this.player.effects.spawnBurst(this.aiPlayer.position.clone(), 0xffff00, 15)
        }
      }
    }
    if (this.input.actions.dash) {
      this.player.dash({ x: this.input.move.x || this.player.facing.x, y: this.input.move.y || this.player.facing.z })
    }
    for (let i = 0; i < 3; i++) {
      if (this.input.actions.jutsu[i]) {
        this.player.useJutsu(i, this.ball, this.aiPlayer)
      }
    }

    // IA
    this.ai.update(effectiveDt)

    // Détection de possession du ballon
    this._checkBallPossession(effectiveDt)

    // Mise à jour des entités
    this.player.update(effectiveDt, this.ball)
    this.aiPlayer.update(effectiveDt, this.ball)
    this.physics.step(effectiveDt)
    this.ball.update(effectiveDt)
    this.stadium.update(effectiveDt, performance.now() / 1000)

    // Détection des buts
    this._checkGoal()

    // Caméra suit le ballon + joueur
    const camTarget = new THREE.Vector3(
      (this.ball.position.x + this.player.position.x) / 2,
      1,
      (this.ball.position.z + this.player.position.z) / 2,
    )
    this.renderer.updateCamera(camTarget, dt)

    // HUD
    this.hud.updateTimer(this.timeLeft)
    this.hud.updateChakra(this.player.chakra, this.player.chakraMax)
    this.hud.updateJutsu(this.player.character, this.player.cooldowns, this.player.chakra)
  }

  // Vérifie qui possède le ballon
  _checkBallPossession(dt) {
    const ballPos = new THREE.Vector3(this.ball.position.x, 0, this.ball.position.z)
    const distP = this.player.position.distanceTo(ballPos)
    const distA = this.aiPlayer.position.distanceTo(ballPos)

    // Si personne n'a le ballon et qu'un joueur est proche
    if (!this.player.hasBall && !this.aiPlayer.hasBall) {
      if (this.ball.speed < 3.5) {
        if (distP < 1.6 && distP < distA) {
          this.player.hasBall = true
          this.ball.lastOwner = this.player
        } else if (distA < 1.6 && distA < distP) {
          this.aiPlayer.hasBall = true
          this.ball.lastOwner = this.aiPlayer
        }
      }
    }
  }

  // Vérifie si un but est marqué
  // Joueur (side 0) score en +Z, IA (side 1) score en -Z
  _checkGoal() {
    const bx = this.ball.position.x
    const bz = this.ball.position.z
    const by = this.ball.position.y
    const gw = FIELD.goalWidth / 2

    // But côté -Z → point pour l'IA (side 1)
    if (bz < -FIELD.length / 2 + 0.5 && Math.abs(bx) < gw && by < FIELD.goalHeight) {
      this._onGoal(1)
    }
    // But côté +Z → point pour le joueur (side 0)
    if (bz > FIELD.length / 2 - 0.5 && Math.abs(bx) < gw && by < FIELD.goalHeight) {
      this._onGoal(0)
    }
  }

  _onGoal(scorerSide) {
    if (this.goalCooldown > 0) return
    if (scorerSide === 0) this.scoreL++
    else this.scoreR++

    const scorerName = scorerSide === 0 ? this.playerChar.name : this.aiChar.name
    this.hud.updateScore(this.scoreL, this.scoreR, this.playerChar.name, this.aiChar.name)
    this.hud.showGoal(scorerName)
    this.audio.play('goal')
    this.renderer.addShake(2.0)
    this.slowMo = 0.2

    // Particules de but
    this.player.effects.spawnGoalEffect(this.ball.position.clone())

    // Reset positions et états
    this.goalCooldown = 3.0
    this.player.hasBall = false
    this.aiPlayer.hasBall = false
    this.player.position.set(-8, 0, 0)
    this.aiPlayer.position.set(8, 0, 0)
    this.player.group.position.copy(this.player.position)
    this.aiPlayer.group.position.copy(this.aiPlayer.position)
    this.player.facing.set(0, 0, 1)
    this.aiPlayer.facing.set(0, 0, -1)
    this.player.group.rotation.y = 0
    this.aiPlayer.group.rotation.y = Math.PI
    this.player.stunned = 0
    this.aiPlayer.stunned = 0
    this.player.velocity.set(0, 0, 0)
    this.aiPlayer.velocity.set(0, 0, 0)

    // Ballon au centre après un délai
    setTimeout(() => {
      this.ball.reset(0)
    }, 1500)
  }

  _endMatch() {
    this.gameOver = true
    this.audio.play('whistle')
    const result = {
      scoreL: this.scoreL,
      scoreR: this.scoreR,
      playerChar: this.playerChar,
      aiChar: this.aiChar,
      winner: this.scoreL > this.scoreR ? 'player' : this.scoreR > this.scoreL ? 'ai' : 'draw',
    }
    // Sauvegarde le résultat en base de données (asynchrone, non bloquant)
    saveMatchResult(result, this.playerChar, this.aiChar)
    setTimeout(() => {
      if (this.onEnd) this.onEnd(result)
    }, 1500)
  }

  dispose() {
    this.stop()
    this.input.dispose()
    this.hud.unmount()
    this.player.dispose()
    this.aiPlayer.dispose()
    this.ball.dispose()
    this.renderer.dispose()
    if (this.canvas.parentElement) this.canvas.parentElement.removeChild(this.canvas)
  }
}
