// ════════════════════════════════════════════════════════════
// SYSTÈME D'ENTRÉES — Clavier + joystick mobile + gamepad
// ════════════════════════════════════════════════════════════

import * as THREE from 'three'
import { Settings } from '../Settings.js'

const DEFAULT_MAPPING = {
  shoot: 'Space',
  dash: 'KeyE',
  jutsu1: 'Digit1',
  jutsu2: 'Digit2',
  jutsu3: 'Digit3',
}

export class Input {
  constructor() {
    this.keys = {}
    this.move = new THREE.Vector2(0, 0)
    this.sprint = false
    this.actions = { shoot: false, dash: false, jutsu: [false, false, false] }
    this._pressed = new Set()

    this.joy = { active: false, cx: 0, cy: 0, dx: 0, dy: 0, id: null }
    this.mobileButtons = {}

    // Remap : Settings OU localStorage (écran remap)
    this.mapping = { ...DEFAULT_MAPPING, ...this._loadMapping() }

    this._onKeyDown = (e) => {
      const code = e.code
      this.keys[code] = true
      const mappedCodes = Object.values(this.mapping)
      if (mappedCodes.includes(code) || this._isMoveKey(code)) {
        e.preventDefault()
      }
      if (mappedCodes.includes(code)) {
        this._pressed.add(code)
      }
    }
    this._onKeyUp = (e) => {
      this.keys[e.code] = false
    }

    window.addEventListener('keydown', this._onKeyDown)
    window.addEventListener('keyup', this._onKeyUp)

    this._gamepadIndex = null
    window.addEventListener('gamepadconnected', (e) => {
      this._gamepadIndex = e.gamepad.index
    })
    window.addEventListener('gamepaddisconnected', (e) => {
      if (this._gamepadIndex === e.gamepad.index) this._gamepadIndex = null
    })

    this._isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    if (this._isTouch) this._setupTouch()
  }

  _loadMapping() {
    try {
      const fromSettings = Settings.get('controls', null)
      if (fromSettings) return fromSettings
      const raw = localStorage.getItem('ninjaball.settings.controls')
      if (raw) return JSON.parse(raw)
    } catch {}
    return {}
  }

  _isMoveKey(code) {
    return [
      'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyZ', 'KeyQ',
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      'ShiftLeft', 'ShiftRight',
    ].includes(code)
  }

  _setupTouch() {
    window.addEventListener('touchstart', (e) => this._onTouchStart(e), { passive: false })
    window.addEventListener('touchmove', (e) => this._onTouchMove(e), { passive: false })
    window.addEventListener('touchend', (e) => this._onTouchEnd(e), { passive: false })
  }

  _onTouchStart(e) {
    e.preventDefault()
    for (const t of e.changedTouches) {
      if (t.clientX < window.innerWidth * 0.5 && !this.joy.active) {
        this.joy.active = true
        this.joy.id = t.identifier
        this.joy.cx = t.clientX
        this.joy.cy = t.clientY
        this.joy.dx = 0
        this.joy.dy = 0
      } else {
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

  update() {
    let mx = 0
    let my = 0
    if (this.keys['KeyW'] || this.keys['KeyZ'] || this.keys['ArrowUp']) my -= 1
    if (this.keys['KeyS'] || this.keys['ArrowDown']) my += 1
    if (this.keys['KeyA'] || this.keys['KeyQ'] || this.keys['ArrowLeft']) mx -= 1
    if (this.keys['KeyD'] || this.keys['ArrowRight']) mx += 1

    this.sprint = !!(this.keys['ShiftLeft'] || this.keys['ShiftRight'])

    if (this.joy.active) {
      mx = this.joy.dx / 80
      my = this.joy.dy / 80
    }

    const len = Math.hypot(mx, my)
    if (len > 1) {
      mx /= len
      my /= len
    }
    this.move.set(mx, my)

    // Utilise les clés d'action du mapping (remap fonctionnel)
    this.actions.shoot = this._consume('shoot')
    this.actions.dash = this._consume('dash')
    this.actions.jutsu[0] = this._consume('jutsu1')
    this.actions.jutsu[1] = this._consume('jutsu2')
    this.actions.jutsu[2] = this._consume('jutsu3')

    if (this._gamepadIndex !== null) {
      const gp = navigator.getGamepads()[this._gamepadIndex]
      if (gp) {
        const gmx = gp.axes[0] || 0
        const gmy = gp.axes[1] || 0
        const dz = 0.2
        if (Math.abs(gmx) > dz || Math.abs(gmy) > dz) {
          this.move.set(Math.abs(gmx) > dz ? gmx : 0, Math.abs(gmy) > dz ? gmy : 0)
        }
        if (gp.buttons[0]?.pressed) this._pressed.add(this.mapping.shoot)
        if (gp.buttons[1]?.pressed) this._pressed.add(this.mapping.dash)
        if (gp.buttons[2]?.pressed) this._pressed.add(this.mapping.jutsu1)
        if (gp.buttons[3]?.pressed) this._pressed.add(this.mapping.jutsu2)
        if (gp.buttons[4]?.pressed) this._pressed.add(this.mapping.jutsu3)
        if (gp.buttons[7]?.pressed) this.sprint = true
      }
    }
  }

  _consume(actionName) {
    const code = this.mapping[actionName] || DEFAULT_MAPPING[actionName]
    if (code && this._pressed.has(code)) {
      this._pressed.delete(code)
      return true
    }
    return false
  }

  triggerAction(name) {
    const code = this.mapping[name] || DEFAULT_MAPPING[name]
    if (code) this._pressed.add(code)
  }

  get isTouch() {
    return this._isTouch
  }

  dispose() {
    window.removeEventListener('keydown', this._onKeyDown)
    window.removeEventListener('keyup', this._onKeyUp)
  }
}
