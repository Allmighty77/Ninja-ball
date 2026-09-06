// ════════════════════════════════════════════════════════════
// STADE NINJA — Terrain cel-shaded avec bois + néons holographiques
// Ciel crépusculaire, lune avec sceau, buts, lignes de terrain
// ════════════════════════════════════════════════════════════
import * as THREE from 'three'

export const FIELD = {
  width: 50,   // axe X
  length: 70,  // axe Z
  goalWidth: 10,
  goalHeight: 4,
  goalDepth: 2,
}

export class Stadium {
  constructor(renderer, physics) {
    this.renderer = renderer
    this.physics = physics
    this.group = new THREE.Group()
    this.sealRing = null
    this.sealPulse = 0
    this._build()
  }

  _build() {
    this._buildSky()
    this._buildMoon()
    this._buildField()
    this._buildGoals()
    this._buildWalls()
    this._buildNeonStands()
    this.renderer.add(this.group)
  }

  // Ciel crépusculaire — dôme avec gradient
  _buildSky() {
    const geo = new THREE.SphereGeometry(150, 32, 16)
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x1a1a3e) },
        midColor: { value: new THREE.Color(0x4a2a5e) },
        botColor: { value: new THREE.Color(0xff6b1a) },
      },
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 midColor;
        uniform vec3 botColor;
        varying vec3 vWorldPos;
        void main() {
          float h = normalize(vWorldPos).y;
          vec3 c;
          if (h > 0.0) c = mix(midColor, topColor, h);
          else c = mix(midColor, botColor, -h * 2.0);
          gl_FragColor = vec4(c, 1.0);
        }
      `,
      side: THREE.BackSide,
    })
    const sky = new THREE.Mesh(geo, mat)
    this.group.add(sky)
  }

  // Lune avec sceau lumineux
  _buildMoon() {
    // Lune
    const moonGeo = new THREE.SphereGeometry(6, 24, 16)
    const moonMat = this.renderer.toonMaterial(0xddeeff, { emissive: 0x4466aa, emissiveIntensity: 0.5 })
    const moon = new THREE.Mesh(moonGeo, moonMat)
    moon.position.set(-50, 55, -80)
    this.group.add(moon)

    // Halo
    const haloGeo = new THREE.SphereGeometry(8, 24, 16)
    const haloMat = new THREE.MeshBasicMaterial({ color: 0x88aaff, transparent: true, opacity: 0.15, side: THREE.BackSide })
    const halo = new THREE.Mesh(haloGeo, haloMat)
    halo.position.copy(moon.position)
    this.group.add(halo)

    // Sceau sur la lune (anneaux)
    for (let i = 0; i < 3; i++) {
      const r = 3 + i * 1.2
      const ringGeo = new THREE.RingGeometry(r - 0.08, r, 64)
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xff6b1a, transparent: true, opacity: 0.4 - i * 0.1, side: THREE.DoubleSide })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.position.copy(moon.position)
      ring.lookAt(0, 0, 0)
      this.group.add(ring)
    }
  }

  // Terrain — sol + lignes + sceau central
  _buildField() {
    const w = FIELD.width
    const l = FIELD.length

    // Sol principal (gazon sombre cel-shaded)
    const fieldGeo = new THREE.PlaneGeometry(w, l)
    const fieldMat = this.renderer.toonMaterial(0x1a3a1a)
    const field = new THREE.Mesh(fieldGeo, fieldMat)
    field.rotation.x = -Math.PI / 2
    field.receiveShadow = true
    this.group.add(field)

    // Bandes de gazon alternées
    for (let i = 0; i < 7; i++) {
      const stripeGeo = new THREE.PlaneGeometry(w, l / 7)
      const stripeMat = this.renderer.toonMaterial(i % 2 === 0 ? 0x1e4422 : 0x1a3a1a)
      const stripe = new THREE.Mesh(stripeGeo, stripeMat)
      stripe.rotation.x = -Math.PI / 2
      stripe.position.set(0, 0.01, -l / 2 + (l / 7) * (i + 0.5))
      stripe.receiveShadow = true
      this.group.add(stripe)
    }

    // Lignes de terrain (néons blancs)
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xaaffee, transparent: true, opacity: 0.6 })
    const lineH = 0.03

    // Contour
    const border = new THREE.Mesh(new THREE.BoxGeometry(w, lineH, 0.15), lineMat)
    border.position.set(0, 0.02, -l / 2)
    this.group.add(border)
    const border2 = border.clone()
    border2.position.z = l / 2
    this.group.add(border2)
    const border3 = new THREE.Mesh(new THREE.BoxGeometry(0.15, lineH, l), lineMat)
    border3.position.set(-w / 2, 0.02, 0)
    this.group.add(border3)
    const border4 = border3.clone()
    border4.position.x = w / 2
    this.group.add(border4)

    // Ligne médiane
    const midLine = new THREE.Mesh(new THREE.BoxGeometry(w, lineH, 0.15), lineMat)
    midLine.position.set(0, 0.02, 0)
    this.group.add(midLine)

    // Cercle central
    const circleGeo = new THREE.RingGeometry(5.8, 6.0, 64)
    const circleMat = new THREE.MeshBasicMaterial({ color: 0xaaffee, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
    const circle = new THREE.Mesh(circleGeo, circleMat)
    circle.rotation.x = -Math.PI / 2
    circle.position.y = 0.02
    this.group.add(circle)

    // Sceau central au sol (cercle de sceau lumineux)
    this._buildCenterSeal()

    // Zones de but
    for (const side of [-1, 1]) {
      const zoneGeo = new THREE.PlaneGeometry(14, 12)
      const zoneMat = new THREE.MeshBasicMaterial({ color: 0xff6b1a, transparent: true, opacity: 0.08, side: THREE.DoubleSide })
      const zone = new THREE.Mesh(zoneGeo, zoneMat)
      zone.rotation.x = -Math.PI / 2
      zone.position.set(0, 0.015, side * (l / 2 - 6))
      this.group.add(zone)
    }
  }

  // Sceau lumineux central pulsant
  _buildCenterSeal() {
    this.sealRing = new THREE.Group()
    for (let i = 0; i < 3; i++) {
      const r = 2 + i * 0.8
      const ringGeo = new THREE.RingGeometry(r - 0.06, r, 48)
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xff6b1a, transparent: true, opacity: 0.3, side: THREE.DoubleSide })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.rotation.x = -Math.PI / 2
      ring.position.y = 0.03
      this.sealRing.add(ring)
    }
    // Rayons du sceau
    for (let i = 0; i < 8; i++) {
      const rayGeo = new THREE.PlaneGeometry(0.08, 3.6)
      const rayMat = new THREE.MeshBasicMaterial({ color: 0xff8b3a, transparent: true, opacity: 0.2, side: THREE.DoubleSide })
      const ray = new THREE.Mesh(rayGeo, rayMat)
      ray.rotation.x = -Math.PI / 2
      ray.rotation.z = (i / 8) * Math.PI * 2
      ray.position.y = 0.03
      this.sealRing.add(ray)
    }
    this.group.add(this.sealRing)
  }

  // Construit les buts (cadre néon)
  _buildGoals() {
    const gw = FIELD.goalWidth
    const gh = FIELD.goalHeight
    const gd = FIELD.goalDepth
    const neonMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.7 })
    const postMat = this.renderer.toonMaterial(0xffffff, { emissive: 0x00ffff, emissiveIntensity: 0.3 })

    for (const side of [-1, 1]) {
      const goal = new THREE.Group()
      const z = side * (FIELD.length / 2)

      // Poteaux
      const postGeo = new THREE.CylinderGeometry(0.15, 0.15, gh, 8)
      const lp = new THREE.Mesh(postGeo, postMat)
      lp.position.set(-gw / 2, gh / 2, z)
      lp.castShadow = true
      goal.add(lp)
      const rp = new THREE.Mesh(postGeo, postMat)
      rp.position.set(gw / 2, gh / 2, z)
      rp.castShadow = true
      goal.add(rp)

      // Barre transversale
      const barGeo = new THREE.CylinderGeometry(0.15, 0.15, gw, 8)
      const bar = new THREE.Mesh(barGeo, postMat)
      bar.rotation.z = Math.PI / 2
      bar.position.set(0, gh, z)
      bar.castShadow = true
      goal.add(bar)

      // Filet (semi-transparente)
      const netMat = new THREE.MeshBasicMaterial({ color: 0xaaffff, transparent: true, opacity: 0.1, side: THREE.DoubleSide })
      const backGeo = new THREE.PlaneGeometry(gw, gh)
      const back = new THREE.Mesh(backGeo, netMat)
      back.position.set(0, gh / 2, z + side * gd)
      goal.add(back)

      // Lignes néon au sol
      const lineGeo = new THREE.PlaneGeometry(gw, 0.15)
      const line = new THREE.Mesh(lineGeo, neonMat)
      line.rotation.x = -Math.PI / 2
      line.position.set(0, 0.03, z)
      goal.add(line)

      this.group.add(goal)
    }
  }

  // Murs invisibles pour la physique
  _buildWalls() {
    const w = FIELD.width
    const l = FIELD.length
    const h = 8
    // Côtés (axe X)
    this.physics.addWall(1, h, l, -w / 2, h / 2, 0)
    this.physics.addWall(1, h, l, w / 2, h / 2, 0)
    // Derrière les buts (axe Z) — légèrement derrière
    this.physics.addWall(w, h, 1, 0, h / 2, -l / 2 - 0.5)
    this.physics.addWall(w, h, 1, 0, h / 2, l / 2 + 0.5)
  }

  // Gradines en néons holographiques
  _buildNeonStands() {
    const w = FIELD.width
    const l = FIELD.length
    const standMat = this.renderer.toonMaterial(0x1a1a2e)
    const neonColors = [0xff6b1a, 0x00ffff, 0xff4b8b, 0x2b6fff]

    for (let side = 0; side < 4; side++) {
      const isLong = side < 2
      const sLen = isLong ? l + 20 : w + 20
      const sWid = 8
      const standGeo = new THREE.BoxGeometry(isLong ? sWid : sLen, 5, isLong ? sLen : sWid)
      const stand = new THREE.Mesh(standGeo, standMat)
      stand.castShadow = true
      stand.receiveShadow = true

      if (side === 0) stand.position.set(-w / 2 - 5, 2.5, 0)
      else if (side === 1) stand.position.set(w / 2 + 5, 2.5, 0)
      else if (side === 2) stand.position.set(0, 2.5, -l / 2 - 5)
      else stand.position.set(0, 2.5, l / 2 + 5)
      this.group.add(stand)

      // Lignes néon sur les gradins
      for (let i = 0; i < 3; i++) {
        const nc = neonColors[(side + i) % neonColors.length]
        const nMat = new THREE.MeshBasicMaterial({ color: nc, transparent: true, opacity: 0.5 })
        let neon
        if (isLong) {
          neon = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, sLen - 4), nMat)
          neon.position.set(side === 0 ? -w / 2 - 5 : w / 2 + 5, 1 + i * 1.5, 0)
        } else {
          neon = new THREE.Mesh(new THREE.BoxGeometry(sLen - 4, 0.15, 0.2), nMat)
          neon.position.set(0, 1 + i * 1.5, side === 2 ? -l / 2 - 5 : l / 2 + 5)
        }
        this.group.add(neon)
      }
    }
  }

  // Met à jour l'animation du sceau central
  update(dt, time) {
    if (this.sealRing) {
      this.sealPulse += dt * 2
      this.sealRing.rotation.y += dt * 0.3
      const s = 1 + Math.sin(this.sealPulse) * 0.05
      this.sealRing.scale.set(s, 1, s)
      this.sealRing.children.forEach((c, i) => {
        if (c.material) c.material.opacity = 0.2 + Math.sin(this.sealPulse + i) * 0.1
      })
    }
  }

  // Affiche un sceau temporaire au sol à une position
  spawnSeal(pos, color = 0xff6b1a, duration = 2) {
    const seal = new THREE.Group()
    for (let i = 0; i < 2; i++) {
      const r = 1.5 + i * 0.6
      const ringGeo = new THREE.RingGeometry(r - 0.05, r, 32)
      const ringMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, side: THREE.DoubleSide })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.rotation.x = -Math.PI / 2
      seal.add(ring)
    }
    // Rayons
    for (let i = 0; i < 6; i++) {
      const rayGeo = new THREE.PlaneGeometry(0.06, 2)
      const rayMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, side: THREE.DoubleSide })
      const ray = new THREE.Mesh(rayGeo, rayMat)
      ray.rotation.x = -Math.PI / 2
      ray.rotation.z = (i / 6) * Math.PI * 2
      seal.add(ray)
    }
    seal.position.set(pos.x, 0.04, pos.z)
    this.group.add(seal)

    // Animation + suppression
    let elapsed = 0
    const tick = (dt) => {
      elapsed += dt
      seal.rotation.y += dt * 3
      const p = elapsed / duration
      seal.scale.setScalar(1 + p * 0.5)
      seal.children.forEach((c) => { if (c.material) c.material.opacity = 0.8 * (1 - p) })
      if (elapsed >= duration) {
        this.group.remove(seal)
        return false
      }
      return true
    }
    return tick
  }
}
