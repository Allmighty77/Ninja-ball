export const Settings = {
  _prefix: 'ninjaball.settings.',
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(this._prefix + key)
      return raw === null ? fallback : JSON.parse(raw)
    } catch (e) {
      return fallback
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(this._prefix + key, JSON.stringify(value))
    } catch (e) {}
  },
  applyToAudio(audio) {
    if (!audio) return
    const muted = this.get('audio.muted', false)
    const vol = this.get('audio.volume', 0.4)
    if (typeof audio.setMuted === 'function') {
      audio.setMuted(muted)
    }
    if (typeof audio.setVolume === 'function') {
      if (!muted) audio.setVolume(vol)
    } else if (audio.masterGain && !muted) {
      audio.masterGain.gain.value = vol
    }
  },
}
