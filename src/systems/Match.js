// ════════════════════════════════════════════════════════════
// MATCH — 1vIA ou 2 joueurs local + pause + difficulté + tutoriel
// ════════════════════════════════════════════════════════════
import * as THREE from 'three'
import { Renderer } from '../engine/Renderer.js'
import { Physics } from '../engine/Physics.js'
import { Input } from '../engine/Input.js'
import { Stadium, FIELD } from '../entities/Stadium.js'
import { Ball } from '../entities/Ball.js'
import { Player } from '../entities/Player.js'
import { AI } from '../systems/AI.js'
import { HUD } from '../systems/HUD.js'
import { saveMatchResult } from '../data/db.js'

const DIFFICULTY = {
  easy: { aiThinkMul: 1.4, aiAggro: 0.35, playerChakraRegen: 10 },
  normal: { aiThinkMul: 1.0, aiAggro: 0.65, playerChakraRegen: 8 },
  hard: { aiThinkMul: 0.7, aiAggro: 0.9, playerChakraRegen: 7 },
}

export class Match {
  constructor(playerChar, aiChar, audio, opts = {}) {
    this.playerChar = playerChar
    this.aiChar = aiChar
    this.audio = audio
    this.difficulty = opts.difficulty || 'normal'
    this.showTutorial = !!opts.showTutorial
    this.mode = opts.mode === 'vsHuman' ? 'vsHuman' : 'vsAI'
    const diff = DIFFICULTY[this.difficulty] || DIFFICULTY.normal

    this.canvas = document.createElement('canvas')
    this.canvas.className = 'game-canvas'
    document.getElementById('app').appendChild(this.canvas)

    this.renderer = new Renderer(this.canvas)
    this.physics = new Physics()
    this.input = new Input()
    this.input.setTwoPlayer(this.mode === 'vsHuman')

    this.stadium = new Stadium(this.renderer, this.physics)
    this.ball = new Ball(this.renderer, this.physics)
    this.player = new Player(playerChar, 0, this.renderer, this.physics, this.audio, this.stadium)
    this.aiPlayer = new Player(aiChar, 1, this.renderer, this.physics, this.audio, this.stadium)
    this.player.chakraRegen = diff.playerChakraRegen
    this.aiPlayer.chakraRegen = diff.playerChakraRegen

    if (this.mode === 'vsAI') {
      this.ai = new AI(this.aiPlayer, this.ball, this.player, this.stadium)
      this.ai.aggression = diff.aiAggro
      this._aiThinkMul = diff.aiThinkMul
    } else {
      this.ai = null
      this._aiThinkMul = 1
    }

    this.hud = new HUD()
    this.hud.mount(document.getElementById('app'))
    this.hud.updateScore(0, 0, playerChar.name, aiChar.name)
    this.hud.registerMobileInput(this.input)
    if (this.showTutorial) this.hud.showTutorial()

    this.timeLeft = 120
    this.scoreL = 0
    this.scoreR = 0
    this.goalCooldown = 0
    this.gameOver = false
    this.paused = false
    this.onEnd = null
    this.slowMo = 1.0
    this.introCountdown = 3.2
    this._countdownStep = 4

    this.combo = 0
    this.comboTimer = 0
    this.playerGoals = 0
    this.aiGoals = 0
    this.steals = 0
    this.jutsusUsed = 0
    this.maxCombo = 0

    this._timers = []
    this._ballFlat = new THREE.Vector3()

    this.audio.play('whistle')
    try {
      this.audio.startMusic()
    } catch {}

    this._lastTime = performance.now()
    this._running = false
    this.hud.showCountdown(3)
    this._camTarget = new THREE.Vector3()
    this._ballVel = new THREE.Vector3()

    this._onKeyPause = (e) => {
      if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault()
        this.togglePause()
      }
    }
    window.addEventListener('keydown', this._onKeyPause)
  }

  _later(fn, ms) {
    const id = setTimeout(() => {
      this._timers = this._timers.filter((t) => t !== id)
      if (!this._running && this.gameOver === false) return
      try {
        fn()
      } catch {}
    }, ms)
    this._timers.push(id)
    return id
  }

  togglePause() {
    if (this.gameOver || this.goalCooldown > 0) return
    this.paused = !this.paused
    this.hud.setPaused(this.paused)
    if (!this.paused) this._lastTime = performance.now()
  }

  start() {
    this._running = true
    this._lastTime = performance.now()
    this._loop()
  }

  stop() {
    this._running = false
  }

  _loop = () => {
    if (!this._running) return
    const now = performance.now()
    const dt = Math.min(0.05, (now - this._lastTime) / 1000)
    this._lastTime = now
    if (!this.paused) this.update(dt)
    this.renderer.render()
    requestAnimationFrame(this._loop)
  }

  _handlePlayerActions(pl, actions, move, sprint, opponent, isP1) {
    pl.move(move, this._effectiveDt, sprint)

    if (actions.shoot) {
      if (pl.hasBall) {
        pl.shoot(this.ball, 1.0 + (isP1 ? this.combo * 0.03 : 0), true)
        if (isP1) this._addCombo(1)
        this.renderer.punchFOV(5)
        this.renderer.addShake(0.35)
      } else {
        const dist = pl.position.distanceTo(opponent.position)
        if (dist < 3.3 && opponent.hasBall) {
          opponent.hasBall = false
          pl.hasBall = true
          this.ball.lastOwner = pl
          if (isP1) {
            this.steals++
            this._addCombo(2)
          }
          this.audio.play('hit')
          pl.effects.spawnBurst(opponent.position.clone(), 0xffff00, 18)
          this.renderer.addShake(0.45)
          this.renderer.punchFOV(4)
        }
      }
    }
    if (actions.dash) {
      const ok = pl.dash({
        x: move.x || pl.facing.x,
        y: move.y || pl.facing.z,
      })
      if (ok) {
        if (isP1) this._addCombo(1)
        this.renderer.punchFOV(4)
        this.renderer.addShake(0.25)
      }
    }
    for (let i = 0; i < 3; i++) {
      if (actions.jutsu[i]) {
        const used = pl.useJutsu(i, this.ball, opponent)
        if (used) {
          if (isP1) {
            this.jutsusUsed++
            this._addCombo(2)
          }
          this.renderer.punchFOV(7)
          this.renderer.addShake(0.5)
        }
      }
    }
  }

  update(dt) {
    if (this.gameOver) return

    const intensity = this.timeLeft < 30 ? 1.08 : 1.0
    if (this.introCountdown > 0) {
      this.introCountdown = Math.max(0, this.introCountdown - dt)
      const step = Math.ceil(this.introCountdown)
      if (step > 0 && step < this._countdownStep) {
        this._countdownStep = step
        this.hud.showCountdown(step)
      } else if (step === 0 && this._countdownStep !== 0) {
        this._countdownStep = 0
        this.hud.showCountdown(0)
      }
      this.hud.updateTimer(this.timeLeft)
      this.renderer.updateCamera(new THREE.Vector3(0, 1.2, 0), null, dt)
      return
    }

    const effectiveDt = dt * this.slowMo * intensity
    this._effectiveDt = effectiveDt

    if (this.slowMo < 1.0) {
      this.slowMo = Math.min(1.0, this.slowMo + dt * 0.55)
    }

    if (this.comboTimer > 0) {
      this.comboTimer -= dt
      if (this.comboTimer <= 0) this.combo = 0
    }

    this.timeLeft -= dt
    if (this.timeLeft <= 0) {
      this.timeLeft = 0
      this._endMatch()
      return
    }

    if (this.goalCooldown > 0) {
      this.goalCooldown -= dt
      this.physics.step(effectiveDt)
      this.ball.update(effectiveDt)
      this.stadium.update(effectiveDt, performance.now() / 1000)
      this._camTarget.set(0, 1.2, 0)
      this.renderer.updateCamera(this._camTarget, null, dt)
      this.hud.updateTimer(this.timeLeft)
      this.hud.updateCombo(this.combo)
      return
    }

    this.input.update()

    this._handlePlayerActions(
      this.player,
      this.input.actions,
      this.input.move,
      this.input.sprint,
      this.aiPlayer,
      true,
    )

    if (this.mode === 'vsHuman') {
      this._handlePlayerActions(
        this.aiPlayer,
        this.input.actions2,
        this.input.move2,
        this.input.sprint2,
        this.player,
        false,
      )
    } else if (this.ai) {
      const scoreDiff = this.scoreL - this.scoreR
      this.ai.update(effectiveDt * this._aiThinkMul, scoreDiff)
    }

    this._checkBallPossession()

    this.player.update(effectiveDt, this.ball)
    this.aiPlayer.update(effectiveDt, this.ball)
    this.physics.step(effectiveDt)
    this.ball.update(effectiveDt)
    this.stadium.update(effectiveDt, performance.now() / 1000)

    this._checkGoal()

    this._camTarget.set(
      this.ball.position.x * 0.55 + this.player.position.x * 0.45,
      1.1,
      this.ball.position.z * 0.55 + this.player.position.z * 0.45,
    )
    this._ballVel.set(this.ball.velocity.x, 0, this.ball.velocity.z)
    this.renderer.updateCamera(this._camTarget, this._ballVel, dt)

    this.hud.updateTimer(this.timeLeft)
    this.hud.updateChakra(this.player.chakra, this.player.chakraMax)
    this.hud.updateJutsu(this.player.character, this.player.cooldowns, this.player.chakra)
    this.hud.updateCombo(this.combo)
  }

  _addCombo(n) {
    this.combo += n
    this.comboTimer = 3.5
    if (this.combo > this.maxCombo) this.maxCombo = this.combo
    if (this.combo >= 5 && this.combo % 5 === 0) {
      this.audio.play('select')
      this.renderer.punchFOV(3)
    }
  }

  _checkBallPossession() {
    this._ballFlat.set(this.ball.position.x, 0, this.ball.position.z)
    const distP = this.player.position.distanceTo(this._ballFlat)
    const distA = this.aiPlayer.position.distanceTo(this._ballFlat)

    if (!this.player.hasBall && !this.aiPlayer.hasBall) {
      if (this.ball.speed < 4.0) {
        if (distP < 1.7 && distP <= distA) {
          this.player.hasBall = true
          this.ball.lastOwner = this.player
        } else if (distA < 1.7 && distA < distP) {
          this.aiPlayer.hasBall = true
          this.ball.lastOwner = this.aiPlayer
        }
      }
    }
  }

  _checkGoal() {
    const bx = this.ball.position.x
    const bz = this.ball.position.z
    const by = this.ball.position.y
    const gw = FIELD.goalWidth / 2

    if (bz < -FIELD.length / 2 + 0.5 && Math.abs(bx) < gw && by < FIELD.goalHeight) {
      this._onGoal(1)
    }
    if (bz > FIELD.length / 2 - 0.5 && Math.abs(bx) < gw && by < FIELD.goalHeight) {
      this._onGoal(0)
    }
  }

  _onGoal(scorerSide) {
    if (this.goalCooldown > 0) return
    if (scorerSide === 0) {
      this.scoreL++
      this.playerGoals++
      this._addCombo(5)
    } else {
      this.scoreR++
      this.aiGoals++
      this.combo = 0
    }

    const scorerName = scorerSide === 0 ? this.playerChar.name : this.aiChar.name
    this.hud.updateScore(this.scoreL, this.scoreR, this.playerChar.name, this.aiChar.name)
    this.hud.showGoal(scorerName, scorerSide === 0 ? this.combo : 0)
    this.audio.play('goal')
    this.renderer.addShake(2.4)
    this.renderer.punchFOV(12)
    this.slowMo = 0.15

    this.player.effects.spawnGoalEffect(
      new THREE.Vector3(this.ball.position.x, this.ball.position.y, this.ball.position.z),
    )

    this.goalCooldown = 2.8
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

    this._later(() => {
      if (this.ball) this.ball.reset(0)
    }, 1300)
  }

  _endMatch() {
    this.gameOver = true
    this.audio.play('whistle')
    try {
      this.audio.stopMusic()
    } catch {}
    const result = {
      scoreL: this.scoreL,
      scoreR: this.scoreR,
      playerChar: this.playerChar,
      aiChar: this.aiChar,
      mode: this.mode,
      winner: this.scoreL > this.scoreR ? 'player' : this.scoreR > this.scoreL ? 'ai' : 'draw',
      stats: {
        playerGoals: this.playerGoals,
        aiGoals: this.aiGoals,
        steals: this.steals,
        jutsusUsed: this.jutsusUsed,
        maxCombo: this.maxCombo,
      },
    }
    if (this.mode === 'vsAI') {
      saveMatchResult(result, this.playerChar, this.aiChar)
    }
    this._later(() => {
      if (this.onEnd) this.onEnd(result)
    }, 1400)
  }

  dispose() {
    this.stop()
    for (const id of this._timers) clearTimeout(id)
    this._timers = []
    try {
      this.audio.stopMusic()
    } catch {}
    window.removeEventListener('keydown', this._onKeyPause)
    this.input.dispose()
    this.hud.unmount()
    this.player.dispose()
    this.aiPlayer.dispose()
    this.ball.dispose()
    this.physics.dispose()
    this.renderer.dispose()
    if (this.canvas.parentElement) this.canvas.parentElement.removeChild(this.canvas)
  }
}
