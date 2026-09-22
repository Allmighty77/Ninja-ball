// ════════════════════════════════════════════════════════════
// QUALITÉ GRAPHIQUE — presets type console (Low / Medium / High)
// Appliqués au Renderer et aux effets pour performance stable
// ════════════════════════════════════════════════════════════
import { Settings } from '../Settings.js'

const PRESETS = {
  low: {
    maxDpr: 1.0,
    antialias: false,
    shadows: false,
    shadowMapSize: 512,
    particleMul: 0.45,
    fogDensity: 0.016,
    exposure: 1.15,
  },
  medium: {
    maxDpr: 1.35,
    antialias: true,
    shadows: true,
    shadowMapSize: 1024,
    particleMul: 0.75,
    fogDensity: 0.013,
    exposure: 1.2,
  },
  high: {
    maxDpr: 1.75,
    antialias: true,
    shadows: true,
    shadowMapSize: 2048,
    particleMul: 1.0,
    fogDensity: 0.012,
    exposure: 1.22,
  },
}

export function getGraphicsPreset() {
  const q = Settings.get('graphics.quality', 'high')
  const base = PRESETS[q] || PRESETS.high
  const userShadows = Settings.get('graphics.shadows', true)
  const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4
  const lowPower = cores < 4

  return {
    ...base,
    // Ombres : preset ET préférence utilisateur ET hardware
    shadows: base.shadows && userShadows && !lowPower,
    particleMul: lowPower ? Math.min(base.particleMul, 0.5) : base.particleMul,
    maxDpr: lowPower ? Math.min(base.maxDpr, 1.15) : base.maxDpr,
  }
}

export function scaleParticleCount(baseCount) {
  const { particleMul } = getGraphicsPreset()
  return Math.max(4, Math.round(baseCount * particleMul))
}
