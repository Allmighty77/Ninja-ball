import { AudioEngine } from './engine/Audio.js'

export const Loader = {
  async preload(opts = {}) {
    // Affiche écran de chargement
    const overlay = document.createElement('div')
    overlay.id = 'loader-overlay'
    overlay.innerHTML = `<div class="loader-box"><div class="loader-spinner"></div><div class="loader-text">Chargement... <span id="loader-pct">0%</span></div></div>`
    document.body.appendChild(overlay)

    try {
      const assets = opts.assets || []
      const total = assets.length + (opts.sounds ? opts.sounds.length : 0)
      let done = 0

      const update = () => {
        const pct = total === 0 ? 100 : Math.round((done / total) * 100)
        const el = document.getElementById('loader-pct')
        if (el) el.textContent = `${pct}%`
      }

      // Précharge sons if any
      if (opts.sounds && opts.sounds.length) {
        const audio = new AudioEngine()
        for (const s of opts.sounds) {
          try {
            await audio.loadSound(s.name, s.url)
          } catch (e) {
            // ignore individual failures
          }
          done++
          update()
        }
      }

      // Précharge autres assets
      for (const a of assets) {
        try {
          if (a.toLowerCase().endsWith('.glb')) {
            // try using GLTFLoader when available
            try {
              const mod = await import('three/examples/jsm/loaders/GLTFLoader.js')
              const { GLTFLoader } = mod
              const loader = new GLTFLoader()
              await loader.loadAsync(a)
            } catch (e) {
              // fallback to fetch
              await fetch(a, { cache: 'reload' })
            }
          } else {
            await fetch(a, { cache: 'reload' })
          }
        } catch (e) {
          // ignore
        }
        done++
        update()
      }

      // Petite attente pour l'UX
      await new Promise((r) => setTimeout(r, 150))
    } finally {
      if (overlay && overlay.parentElement) overlay.parentElement.removeChild(overlay)
    }
  }
}
