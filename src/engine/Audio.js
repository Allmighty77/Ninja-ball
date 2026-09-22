// ════════════════════════════════════════════════════════════
// AUDIO — Web Audio API
// SFX synthétisés + musique d'ambiance loop + mute
// ════════════════════════════════════════════════════════════

export class AudioEngine {
  constructor() {
    this.ctx = null
    this.enabled = false
    this.muted = false
    this.masterGain = null
    this.sfxGain = null
    this.musicGain = null
    this.sounds = {}
    this.unlocked = false
    this._musicNodes = []
    this._musicPlaying = false
  }

  init() {
    if (this.ctx) return
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)()
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.value = 0.4
      this.masterGain.connect(this.ctx.destination)

      this.sfxGain = this.ctx.createGain()
      this.sfxGain.gain.value = 1
      this.sfxGain.connect(this.masterGain)

      this.musicGain = this.ctx.createGain()
      this.musicGain.gain.value = 0.12
      this.musicGain.connect(this.masterGain)

      this.enabled = true
    } catch (e) {
      console.warn('Audio non disponible', e)
    }
  }

  unlock() {
    if (!this.ctx) this.init()
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume()
    this.unlocked = true
  }

  setMuted(muted) {
    this.muted = !!muted
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : 0.4
    }
  }

  setVolume(vol) {
    if (this.masterGain && !this.muted) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, vol))
    }
  }

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

  play(name, opts = {}) {
    if (!this.enabled || !this.ctx || this.muted) return
    if (this.sounds[name]) {
      this._playBuffer(name, opts)
    } else {
      this._playSynth(name, opts)
    }
  }

  /** Musique d'ambiance minimaliste (pad + pulse) — démarre une seule fois */
  startMusic() {
    if (!this.enabled || !this.ctx || this._musicPlaying) return
    this._musicPlaying = true
    const ctx = this.ctx
    const now = ctx.currentTime

    // Pad grave
    const osc1 = ctx.createOscillator()
    const g1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.value = 110
    g1.gain.value = 0.08
    osc1.connect(g1)
    g1.connect(this.musicGain)
    osc1.start(now)

    // Pad aigu léger
    const osc2 = ctx.createOscillator()
    const g2 = ctx.createGain()
    osc2.type = 'triangle'
    osc2.frequency.value = 220
    g2.gain.value = 0.04
    osc2.connect(g2)
    g2.connect(this.musicGain)
    osc2.start(now)

    // LFO volume pour respiration
    const lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()
    lfo.frequency.value = 0.08
    lfoGain.gain.value = 0.03
    lfo.connect(lfoGain)
    lfoGain.connect(g1.gain)
    lfo.start(now)

    this._musicNodes = [osc1, osc2, lfo, g1, g2]
  }

  stopMusic() {
    for (const n of this._musicNodes) {
      try {
        if (n.stop) n.stop()
        if (n.disconnect) n.disconnect()
      } catch {}
    }
    this._musicNodes = []
    this._musicPlaying = false
  }

  _playBuffer(name, opts) {
    const src = this.ctx.createBufferSource()
    src.buffer = this.sounds[name]
    const gain = this.ctx.createGain()
    gain.gain.value = opts.volume ?? 1
    src.connect(gain)
    gain.connect(this.sfxGain || this.masterGain)
    src.start()
  }

  _playSynth(name, opts = {}) {
    const ctx = this.ctx
    const now = ctx.currentTime
    const vol = opts.volume ?? 1
    const dest = this.sfxGain || this.masterGain

    switch (name) {
      case 'shoot':
      case 'kick': {
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(600, now)
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.15)
        g.gain.setValueAtTime(0.5 * vol, now)
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.2)
        osc.connect(g)
        g.connect(dest)
        osc.start(now)
        osc.stop(now + 0.2)
        break
      }
      case 'jutsu': {
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
        g.connect(dest)
        osc.start(now)
        osc.stop(now + 0.5)
        break
      }
      case 'goal': {
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
          g.connect(dest)
          osc.start(t)
          osc.stop(t + 0.3)
        })
        break
      }
      case 'whistle': {
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = 'square'
        osc.frequency.setValueAtTime(2000, now)
        osc.frequency.linearRampToValueAtTime(2200, now + 0.3)
        g.gain.setValueAtTime(0.15 * vol, now)
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.4)
        osc.connect(g)
        g.connect(dest)
        osc.start(now)
        osc.stop(now + 0.4)
        break
      }
      case 'dash': {
        this._noiseBurst(0.2, vol * 0.3)
        break
      }
      case 'hit': {
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(150, now)
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.1)
        g.gain.setValueAtTime(0.4 * vol, now)
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.12)
        osc.connect(g)
        g.connect(dest)
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
        g.connect(dest)
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
        g.connect(dest)
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
    g.connect(this.sfxGain || this.masterGain)
    src.start()
    return src
  }

  dispose() {
    this.stopMusic()
    if (this.ctx) this.ctx.close()
  }
}
