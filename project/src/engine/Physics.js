// ════════════════════════════════════════════════════════════
// MOTEUR PHYSIQUE — Cannon-es
// Gère le monde physique du ballon + collisions
// ════════════════════════════════════════════════════════════
import * as CANNON from 'cannon-es'

export class Physics {
  constructor() {
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -30, 0),
    })
    this.world.broadphase = new CANNON.SAPBroadphase(this.world)
    this.world.allowSleep = false
    this.world.defaultContactMaterial.friction = 0.3
    this.world.defaultContactMaterial.restitution = 0.6

    // Matériaux
    this.groundMat = new CANNON.Material('ground')
    this.ballMat = new CANNON.Material('ball')
    this.playerMat = new CANNON.Material('player')

    // Contact ball-sol
    this.world.addContactMaterial(
      new CANNON.ContactMaterial(this.groundMat, this.ballMat, {
        friction: 0.4,
        restitution: 0.65,
      }),
    )
    // Contact ball-joueur
    this.world.addContactMaterial(
      new CANNON.ContactMaterial(this.playerMat, this.ballMat, {
        friction: 0.1,
        restitution: 0.8,
      }),
    )

    // Sol physique
    this.groundBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
      material: this.groundMat,
    })
    this.groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
    this.world.addBody(this.groundBody)

    // Murs invisibles (limites terrain) — créés plus tard par le stadium
    this.walls = []
  }

  // Ajoute un mur de bord
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

  // Crée le corps du ballon
  createBall(radius = 0.4) {
    const body = new CANNON.Body({
      mass: 0.8,
      shape: new CANNON.Sphere(radius),
      material: this.ballMat,
      linearDamping: 0.15,
      angularDamping: 0.15,
    })
    body.position.set(0, 2, 0)
    this.world.addBody(body)
    return body
  }

  step(dt) {
    this.world.step(Math.min(dt, 1 / 30))
  }

  dispose() {
    this.world.clearForces()
  }
}
