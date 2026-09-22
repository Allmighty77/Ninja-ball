// ════════════════════════════════════════════════════════════
// IA ADVERSAIRE — Poursuit le ballon, tire près du but, jutsu aléatoires
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
    this.jutsuTimer = 3 + Math.random() * 4
  }

  update(dt) {
    this.thinkTimer -= dt
    this.jutsuTimer -= dt

    // Prend une décision toutes les 0.3s
    if (this.thinkTimer <= 0) {
      this._think()
      this.thinkTimer = 0.3
    }

    const ballPos = new THREE.Vector3(this.ball.position.x, 0, this.ball.position.z)
    const distToBall = this.player.position.distanceTo(ballPos)
    // IA (side 1) score en -Z, joueur (side 0) score en +Z
    const goalZ = this.player.side === 0 ? 35 : -35
    const distToGoal = Math.abs(this.player.position.z - goalZ)

    let dir = { x: 0, y: 0 }
    let sprint = false

    switch (this.decision) {
      case 'chase':
        // Poursuit le ballon
        dir = this._dirTo(ballPos)
        sprint = distToBall > 10
        break
      case 'dribble':
        // Avance vers le but adverse avec le ballon
        const goalDir = this._dirTo(new THREE.Vector3(0, 0, goalZ))
        dir = goalDir
        sprint = distToGoal > 20
        break
      case 'shoot':
        // Tire vers le but
        if (this.player.hasBall && distToGoal < 22) {
          this.player.shoot(this.ball, 1.25, true)
          this.decision = 'chase'
        }
        break
      case 'defend':
        // Retourne vers son propre but
        // ownGoal : côté opposé à goalZ
        const ownGoalZ = this.player.side === 0 ? -35 : 35
        const ownGoal = new THREE.Vector3(0, 0, ownGoalZ)
        dir = this._dirTo(ownGoal)
        break
      case 'steal':
        // Tente de voler le ballon à l'adversaire
        if (this.opponent.hasBall) {
          dir = this._dirTo(this.opponent.position)
          sprint = true
          // Si proche, utilise un jutsu de tackle
          if (this.player.position.distanceTo(this.opponent.position) < 4.5) {
            const tackleIdx = this.player.character.jutsus.findIndex((j) => j.type === 'tackle')
            if (tackleIdx >= 0 && this.player.cooldowns[tackleIdx] <= 0 && this.player.chakra >= 30) {
              this.player.useJutsu(tackleIdx, this.ball, this.opponent)
            }
          }
        }
        break
    }

    this.player.move(dir, dt, sprint)

    // Jutsu aléatoires
    if (this.jutsuTimer <= 0) {
      this.jutsuTimer = 4 + Math.random() * 5
      if (this.player.chakra > 40) {
        const available = this.player.character.jutsus
          .map((j, i) => ({ j, i }))
          .filter(({ j, i }) => this.player.cooldowns[i] <= 0 && this.player.chakra >= j.cost)
        if (available.length > 0) {
          const pick = available[Math.floor(Math.random() * available.length)]
          this.player.useJutsu(pick.i, this.ball, this.opponent)
        }
      }
    }
  }

  _think() {
    const ballPos = new THREE.Vector3(this.ball.position.x, 0, this.ball.position.z)
    const distToBall = this.player.position.distanceTo(ballPos)
    const goalZ = this.player.side === 0 ? 35 : -35
    const distToGoal = Math.abs(this.player.position.z - goalZ)

    if (this.player.hasBall) {
      if (distToGoal < 20) {
        this.decision = 'shoot'
      } else {
        this.decision = 'dribble'
      }
    } else if (this.opponent.hasBall) {
      this.decision = 'steal'
    } else if (distToBall < 16) {
      this.decision = 'chase'
    } else {
      // Retourne en défense si le ballon est loin
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
