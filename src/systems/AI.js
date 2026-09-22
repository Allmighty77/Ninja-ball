// ════════════════════════════════════════════════════════════
// IA ÉLITE — Pression, interception, dribble intelligent, jutsu contextuels
// Sensation adversaire “humain fort” pour un jeu addictif
// ════════════════════════════════════════════════════════════
import * as THREE from 'three'

export class AI {
  constructor(player, ball, opponent, stadium) {
    this.player = player
    this.ball = ball
    this.opponent = opponent
    this.stadium = stadium
    this.thinkTimer = 0
    this.decision = 'chase'
    this.jutsuTimer = 2 + Math.random() * 2
    this.aggression = 0.65 // 0–1, monte si perd
    this._tmp = new THREE.Vector3()
    this._ballPos = new THREE.Vector3()
  }

  update(dt, scoreDiff = 0) {
    // Plus agressif si derrière au score
    this.aggression = Math.min(0.95, 0.55 + Math.max(0, -scoreDiff) * 0.12)

    this.thinkTimer -= dt
    this.jutsuTimer -= dt

    if (this.thinkTimer <= 0) {
      this._think()
      this.thinkTimer = 0.18 + Math.random() * 0.12
    }

    this._ballPos.set(this.ball.position.x, 0, this.ball.position.z)
    const distToBall = this.player.position.distanceTo(this._ballPos)
    const goalZ = this.player.side === 0 ? 35 : -35
    const distToGoal = Math.abs(this.player.position.z - goalZ)

    let dir = { x: 0, y: 0 }
    let sprint = false

    switch (this.decision) {
      case 'chase': {
        // Intercepte la trajectoire du ballon
        const lead = Math.min(0.45, this.ball.speed * 0.04)
        this._tmp.set(
          this.ball.position.x + this.ball.velocity.x * lead,
          0,
          this.ball.position.z + this.ball.velocity.z * lead,
        )
        dir = this._dirTo(this._tmp)
        sprint = distToBall > 6
        break
      }
      case 'dribble': {
        // Avance vers le but en contournant l'adversaire
        const sideOffset = this.opponent.position.x > this.player.position.x ? -4 : 4
        this._tmp.set(sideOffset * 0.6, 0, goalZ)
        // Blend vers le but
        const gx = -this.player.position.x * 0.15
        this._tmp.x = gx + sideOffset * 0.35
        dir = this._dirTo(this._tmp)
        sprint = distToGoal > 14 && this.aggression > 0.5
        // Tire tôt si ouvert
        if (distToGoal < 18 && Math.random() < 0.04 + this.aggression * 0.05) {
          this.player.shoot(this.ball, 1.15 + this.aggression * 0.2, true)
          this.decision = 'chase'
        }
        break
      }
      case 'shoot': {
        if (this.player.hasBall && distToGoal < 24) {
          // Power selon distance
          const power = distToGoal < 12 ? 1.35 : 1.15
          this.player.shoot(this.ball, power, true)
          this.decision = 'chase'
        }
        break
      }
      case 'defend': {
        const ownGoalZ = this.player.side === 0 ? -35 : 35
        // Position entre ballon et but
        this._tmp.set(
          this._ballPos.x * 0.4,
          0,
          ownGoalZ * 0.55 + this._ballPos.z * 0.25,
        )
        dir = this._dirTo(this._tmp)
        sprint = distToBall < 20
        break
      }
      case 'steal': {
        if (this.opponent.hasBall) {
          // Coupe l'angle vers le but adverse du joueur
          const oppGoalZ = this.opponent.side === 0 ? 35 : -35
          this._tmp.set(
            this.opponent.position.x * 0.7 + this._ballPos.x * 0.3,
            0,
            this.opponent.position.z * 0.6 + oppGoalZ * 0.15,
          )
          dir = this._dirTo(this.opponent.position)
          sprint = true
          const d = this.player.position.distanceTo(this.opponent.position)
          if (d < 4.8) {
            const tackleIdx = this.player.character.jutsus.findIndex((j) => j.type === 'tackle')
            if (tackleIdx >= 0 && this.player.cooldowns[tackleIdx] <= 0 && this.player.chakra >= 28) {
              this.player.useJutsu(tackleIdx, this.ball, this.opponent)
            }
          }
        } else {
          this.decision = 'chase'
        }
        break
      }
      case 'intercept': {
        this._tmp.set(
          this.ball.position.x + this.ball.velocity.x * 0.5,
          0,
          this.ball.position.z + this.ball.velocity.z * 0.5,
        )
        dir = this._dirTo(this._tmp)
        sprint = true
        break
      }
    }

    this.player.move(dir, dt, sprint)

    // Jutsu intelligents (pas purement aléatoires)
    if (this.jutsuTimer <= 0) {
      this.jutsuTimer = 2.5 + Math.random() * 3.5
      this._trySmartJutsu(distToBall, distToGoal)
    }
  }

  _trySmartJutsu(distToBall, distToGoal) {
    if (this.player.chakra < 28) return
    const jutsus = this.player.character.jutsus
    const available = jutsus
      .map((j, i) => ({ j, i }))
      .filter(({ j, i }) => this.player.cooldowns[i] <= 0 && this.player.chakra >= j.cost)
    if (!available.length) return

    // Priorités contextuelles
    let pick = null
    if (this.opponent.hasBall && this.player.position.distanceTo(this.opponent.position) < 6) {
      pick = available.find((a) => a.j.type === 'tackle') || available.find((a) => a.j.type === 'slowmo')
    } else if (this.player.hasBall && distToGoal < 22) {
      pick = available.find((a) => a.j.type === 'shot') || available.find((a) => a.j.type === 'boost')
    } else if (this.ball.speed > 10 && distToBall < 12) {
      pick = available.find((a) => a.j.type === 'zone') || available.find((a) => a.j.type === 'dash')
    } else if (this.player.chakra < 50) {
      pick = available.find((a) => a.j.type === 'heal')
    }
    if (!pick && Math.random() < 0.45 + this.aggression * 0.3) {
      pick = available[Math.floor(Math.random() * available.length)]
    }
    if (pick) this.player.useJutsu(pick.i, this.ball, this.opponent)
  }

  _think() {
    this._ballPos.set(this.ball.position.x, 0, this.ball.position.z)
    const distToBall = this.player.position.distanceTo(this._ballPos)
    const goalZ = this.player.side === 0 ? 35 : -35
    const distToGoal = Math.abs(this.player.position.z - goalZ)
    const ownGoalZ = this.player.side === 0 ? -35 : 35
    const ballNearOwnGoal = Math.abs(this._ballPos.z - ownGoalZ) < 22

    if (this.player.hasBall) {
      if (distToGoal < 16 || (distToGoal < 22 && this.aggression > 0.7)) {
        this.decision = 'shoot'
      } else {
        this.decision = 'dribble'
      }
    } else if (this.opponent.hasBall) {
      this.decision = 'steal'
    } else if (this.ball.speed > 8 && distToBall < 18) {
      this.decision = 'intercept'
    } else if (distToBall < 14 || !ballNearOwnGoal) {
      this.decision = 'chase'
    } else {
      this.decision = 'defend'
    }
  }

  _dirTo(target) {
    const dx = target.x - this.player.position.x
    const dz = target.z - this.player.position.z
    const len = Math.hypot(dx, dz) || 1
    return { x: dx / len, y: dz / len }
  }
}
