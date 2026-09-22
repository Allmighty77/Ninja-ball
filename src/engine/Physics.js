// ════════════════════════════════════════════════════════════
// MOTEUR PHYSIQUE — Cannon-es — timestep fixe (60 Hz)
// Sensation stable type console / AAA
// ════════════════════════════════════════════════════════════
import * as CANNON from 'cannon-es'

const FIXED_DT = 1 / 60
const MAX_SUBSTEPS = 4

export class Physics {
  constructor() {
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -28, 0),
    })
    this.world.broadphase = new CANNON.SAPBroadphase(this.world)
    this.world.allowSleep = true
    this.world.defaultContactMaterial.friction = 0.28
    this.world.defaultContactMaterial.restitution = 0.55

    this.groundMat = new CANNON.Material('ground')
    this.ballMat = new CANNON.Material('ball')
    this.playerMat = new CANNON.Material('player')

    this.world.addContactMaterial(
      new CANNON.ContactMaterial(this.groundMat, this.ballMat, {
        friction: 0.35,
        restitution: 0.62,
      }),
    )
    this.world.addContactMaterial(
      new CANNON.ContactMaterial(this.playerMat, this.ballMat, {
        friction: 0.08,
        restitution: 0.75,
      }),
    )

    this.groundBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
      material: this.groundMat,
    })
    this.groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
    this.world.addBody(this.groundBody)

    this.walls = []
    this._accumulator = 0
  }

  addWall(width, height, depth, x, y, z) {
    const body = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2)),
      material: this.groundMat,
    })
    body.position.set(x, y, z)
    this.world.addBody(body)
    this.walls.push(body)
    return body
  }

  createBall(radius = 0.4) {
    const body = new CANNON.Body({
      mass: 0.75,
      shape: new CANNON.Sphere(radius),
      material: this.ballMat,
      linearDamping: 0.12,
      angularDamping: 0.18,
      allowSleep: true,
      sleepSpeedLimit: 0.15,
      sleepTimeLimit: 0.4,
    })
    body.position.set(0, 2, 0)
    this.world.addBody(body)
    return body
  }

  /**
   * Step avec accumulateur (timestep fixe 60 Hz)
   * Évite le jitter et les explosions de physique
   */
  step(dt) {
    this._accumulator += Math.min(dt, 0.05)
    let steps = 0
    while (this._accumulator >= FIXED_DT && steps < MAX_SUBSTEPS) {
      this.world.step(FIXED_DT)
      this._accumulator -= FIXED_DT
      steps++
    }
  }

  dispose() {
    this.world.clearForces()
  }
}
