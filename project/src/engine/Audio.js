// ════════════════════════════════════════════════════════════
// AUDIO — Web Audio API
// SFX synthétisés (tir, jutsu, but, sifflet) + structure pour mp3
// ════════════════════════════════════════════════════════════

export class AudioEngine {
  constructor() {
    this.ctx = null
    this.enabled = false
    this.masterGain = null
    // Structure pour futurs fichiers mp3
    this.sounds = {}
    this.unlocked = false
  }

  // Initialise le contexte audio (nécessite interaction utilisateur)
  init() {
    if (this.ctx) return
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)()
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.value = 0.4
      this.masterGain.connect(this.ctx.destination)
      this.enabled = true
    } catch (e) {
      console.warn('Audio non disponible', e)
    }
  }

  // Déverrouille l'audio sur interaction
  unlock() {
    if (!this.ctx) this.init()
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume()
    this.unlocked = true
  }

  // Charge un fichier son (pour ajout mp3 futurs)
  async loadSound(name, url) {
    if (!this.ctx) this.init()
    try {
      const resp = await fetch(url)
      const buf = await resp.arrayBuffer()
      const audioBuf = await this.ctx.decodeAudioData(buf)
      this.sounds[name] = audioBuf
    } catch (e) {
      console.warn(`Son ${name} non chargé`, e)
    }
  }

  // Joue un son chargé (mp3) ou fallback synthétisé
  play(name, opts = {}) {
    if (!this.enabled || !this.ctx) return
    if (this.sounds[name]) {
      this._playBuffer(name, opts)
    } else {
      this._playSynth(name, opts)
    }
  }

  _playBuffer(name, opts) {
    const src = this.ctx.createBufferSource()
    src.buffer = this.sounds[name]
    const gain = this.ctx.createGain()
    gain.gain.value = opts.volume ?? 1
    src.connect(gain)
    gain.connect(this.masterGain)
    src.start()
  }

  // Synthèse de SFX par type
  _playSynth(name, opts = {}) {
    const ctx = this.ctx
    const now = ctx.currentTime
    const vol = opts.volume ?? 1

    switch (name) {
      case 'shoot':
      case 'kick': {
        // Bruit d'impact +whoosh
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(600, now)
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.15)
        g.gain.setValueAtTime(0.5 * vol, now)
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.2)
        osc.connect(g)
        g.connect(this.masterGain)
        osc.start(now)
        osc.stop(now + 0.2)
        break
      }
      case 'jutsu': {
        // Son mystique montant
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(200, now)
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.4)
        g.gain.setValueAtTime(0.3 * vol, now)
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
        const filter = ctx.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.value = 1200
        osc.connect(filter)
        filter.connect(g)
        g.connect(this.masterGain)
        osc.start(now)
        osc.stop(now + 0.5)
        break
      }
      case 'goal': {
        // Fanfare but
        const notes = [523, 659, 784, 1047]
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator()
          const g = ctx.createGain()
          osc.type = 'square'
          osc.frequency.value = freq
          const t = now + i * 0.12
          g.gain.setValueAtTime(0.2 * vol, t)
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.3)
          osc.connect(g)
          g.connect(this.masterGain)
          osc.start(t)
          osc.stop(t + 0.3)
        })
        break
      }
      case 'whistle': {
        // Sifflet d'arbitre
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = 'square'
        osc.frequency.setValueAtTime(2000, now)
        osc.frequency.linearRampToValueAtTime(2200, now + 0.3)
        g.gain.setValueAtTime(0.15 * vol, now)
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.4)
        osc.connect(g)
        g.connect(this.masterGain)
        osc.start(now)
        osc.stop(now + 0.4)
        break
      }
      case 'dash': {
        // Whoosh de dash
        const noise = this._noiseBurst(0.2, vol * 0.3)
        break
      }
      case 'hit': {
        // Impact
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(150, now)
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.1)
        g.gain.setValueAtTime(0.4 * vol, now)
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.12)
        osc.connect(g)
        g.connect(this.masterGain)
        osc.start(now)
        osc.stop(now + 0.12)
        break
      }
      case 'select': {
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = 880
        g.gain.setValueAtTime(0.2 * vol, now)
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.1)
        osc.connect(g)
        g.connect(this.masterGain)
        osc.start(now)
        osc.stop(now + 0.1)
        break
      }
      case 'menu': {
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(440, now)
        osc.frequency.linearRampToValueAtTime(660, now + 0.15)
        g.gain.setValueAtTime(0.15 * vol, now)
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.2)
        osc.connect(g)
        g.connect(this.masterGain)
        osc.start(now)
        osc.stop(now + 0.2)
        break
      }
    }
  }

  _noiseBurst(duration, vol) {
    const ctx = this.ctx
    const bufferSize = ctx.sampleRate * duration
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
    }
    const src = ctx.createBufferSource()
    src.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 800
    const g = ctx.createGain()
    g.gain.value = vol
    src.connect(filter)
    filter.connect(g)
    g.connect(this.masterGain)
    src.start()
    return src
  }

  dispose() {
    if (this.ctx) this.ctx.close()
  }
}
