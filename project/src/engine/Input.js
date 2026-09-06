// ════════════════════════════════════════════════════════════
// SYSTÈME D'ENTRÉES — Clavier + joystick virtuel mobile
// Desktop : ZQSD/WASD + Espace + E + 1/2/3 + Shift
// Mobile : joystick + boutons tactiles
// ════════════════════════════════════════════════════════════

export class Input {
  constructor() {
    this.keys = {}
    this.move = { x: 0, y: 0 }
    this.sprint = false
    this.actions = { shoot: false, dash: false, jutsu: [false, false, false] }
    this._pressed = new Set()

    // Joystick virtuel
    this.joy = { active: false, cx: 0, cy: 0, dx: 0, dy: 0, id: null }

    // Boutons mobile
    this.mobileButtons = {}

    this._onKeyDown = (e) => {
      const code = e.code
      this.keys[code] = true
      if (['Space', 'KeyE', 'Digit1', 'Digit2', 'Digit3'].includes(code)) {
        e.preventDefault()
        this._pressed.add(code)
      }
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyZ', 'KeyQ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight'].includes(code)) {
        e.preventDefault()
      }
    }
    this._onKeyUp = (e) => {
      this.keys[e.code] = false
    }

    window.addEventListener('keydown', this._onKeyDown)
    window.addEventListener('keyup', this._onKeyUp)

    // Détection tactile
    this._isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    if (this._isTouch) this._setupTouch()
  }

  _setupTouch() {
    window.addEventListener('touchstart', (e) => this._onTouchStart(e), { passive: false })
    window.addEventListener('touchmove', (e) => this._onTouchMove(e), { passive: false })
    window.addEventListener('touchend', (e) => this._onTouchEnd(e), { passive: false })
  }

  _onTouchStart(e) {
    e.preventDefault()
    for (const t of e.changedTouches) {
      // Zone gauche = joystick
      if (t.clientX < window.innerWidth * 0.5 && !this.joy.active) {
        this.joy.active = true
        this.joy.id = t.identifier
        this.joy.cx = t.clientX
        this.joy.cy = t.clientY
        this.joy.dx = 0
        this.joy.dy = 0
      } else {
        // Zone droite = boutons — vérifier les boutons HUD
        this._checkButton(t.clientX, t.clientY, 'down')
      }
    }
  }

  _onTouchMove(e) {
    e.preventDefault()
    for (const t of e.changedTouches) {
      if (t.identifier === this.joy.id) {
        this.joy.dx = t.clientX - this.joy.cx
        this.joy.dy = t.clientY - this.joy.cy
        const max = 80
        const len = Math.hypot(this.joy.dx, this.joy.dy)
        if (len > max) {
          this.joy.dx = (this.joy.dx / len) * max
          this.joy.dy = (this.joy.dy / len) * max
        }
      }
    }
  }

  _onTouchEnd(e) {
    e.preventDefault()
    for (const t of e.changedTouches) {
      if (t.identifier === this.joy.id) {
        this.joy.active = false
        this.joy.id = null
        this.joy.dx = 0
        this.joy.dy = 0
      } else {
        this._checkButton(t.clientX, t.clientY, 'up')
      }
    }
  }

  // Enregistre les boutons mobiles (appelé par le HUD)
  registerMobileButton(id, el, callback) {
    this.mobileButtons[id] = { el, callback, pressed: false }
  }

  _checkButton(x, y, state) {
    for (const [id, btn] of Object.entries(this.mobileButtons)) {
      const rect = btn.el.getBoundingClientRect()
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        if (state === 'down') btn.pressed = true
        if (state === 'up') {
          btn.pressed = false
          if (btn.callback) btn.callback()
        }
        return
      }
    }
  }

  // Met à jour l'état des entrées (appelé chaque frame)
  update() {
    // Mouvement clavier (ZQSD ou WASD ou flèches)
    let mx = 0
    let my = 0
    if (this.keys['KeyW'] || this.keys['KeyZ'] || this.keys['ArrowUp']) my -= 1
    if (this.keys['KeyS'] || this.keys['ArrowDown']) my += 1
    if (this.keys['KeyA'] || this.keys['KeyQ'] || this.keys['ArrowLeft']) mx -= 1
    if (this.keys['KeyD'] || this.keys['ArrowRight']) mx += 1

    // Sprint
    this.sprint = !!(this.keys['ShiftLeft'] || this.keys['ShiftRight'])

    // Joystick mobile
    if (this.joy.active) {
      mx = this.joy.dx / 80
      my = this.joy.dy / 80
    }

    // Normalise
    const len = Math.hypot(mx, my)
    if (len > 1) {
      mx /= len
      my /= len
    }
    this.move.x = mx
    this.move.y = my

    // Actions — pressions d'une frame
    this.actions.shoot = this._consume('Space')
    this.actions.dash = this._consume('KeyE')
    this.actions.jutsu[0] = this._consume('Digit1')
    this.actions.jutsu[1] = this._consume('Digit2')
    this.actions.jutsu[2] = this._consume('Digit3')
  }

  _consume(code) {
    if (this._pressed.has(code)) {
      this._pressed.delete(code)
      return true
    }
    return false
  }

  // Permet au HUD mobile de déclencher une action
  triggerAction(name) {
    if (name === 'shoot') this._pressed.add('Space')
    else if (name === 'dash') this._pressed.add('KeyE')
    else if (name === 'jutsu1') this._pressed.add('Digit1')
    else if (name === 'jutsu2') this._pressed.add('Digit2')
    else if (name === 'jutsu3') this._pressed.add('Digit3')
  }

  get isTouch() {
    return this._isTouch
  }

  dispose() {
    window.removeEventListener('keydown', this._onKeyDown)
    window.removeEventListener('keyup', this._onKeyUp)
  }
}
