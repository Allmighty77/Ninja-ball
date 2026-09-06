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
    const vol = this.get('audio.volume', 0.4)
    if (audio && audio.masterGain) audio.masterGain.gain.value = vol
  }
}
