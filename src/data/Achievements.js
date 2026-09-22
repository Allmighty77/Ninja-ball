// ════════════════════════════════════════════════════════════
// ACHIEVEMENTS — objectifs locaux, gratuits, non pay-to-win
// ════════════════════════════════════════════════════════════

const KEY = 'ninjaball.achievements.v1'

export const ACHIEVEMENT_DEFS = [
  { id: 'first_win', name: 'Premier sacre', desc: 'Gagne ton premier match', check: (p) => p.wins >= 1 },
  { id: 'hat_trick', name: 'Hat-trick', desc: 'Marque 3 buts dans un match', check: (_p, m) => (m?.playerGoals || 0) >= 3 },
  { id: 'combo_5', name: 'Enchaînement', desc: 'Atteins un combo x5', check: (p) => p.bestCombo >= 5 },
  { id: 'combo_10', name: 'Tempête de chakra', desc: 'Atteins un combo x10', check: (p) => p.bestCombo >= 10 },
  { id: 'streak_3', name: 'Série de 3', desc: 'Gagne 3 matchs d’affilée', check: (p) => p.bestStreak >= 3 },
  { id: 'veteran', name: 'Vétéran', desc: 'Joue 10 matchs', check: (p) => p.gamesPlayed >= 10 },
  { id: 'sniper', name: 'Sniper', desc: 'Marque 20 buts au total', check: (p) => p.totalGoals >= 20 },
  { id: 'thief', name: 'Voleur de ballon', desc: 'Réussis 5 vols dans un match', check: (_p, m) => (m?.steals || 0) >= 5 },
]

function loadUnlocked() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}

function saveUnlocked(map) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map))
  } catch {}
}

export const Achievements = {
  list() {
    const unlocked = loadUnlocked()
    return ACHIEVEMENT_DEFS.map((d) => ({
      ...d,
      unlocked: !!unlocked[d.id],
      unlockedAt: unlocked[d.id] || null,
    }))
  },

  /**
   * Évalue les achievements après un match.
   * @returns {Array} nouveaux achievements débloqués
   */
  evaluate(progress, matchStats) {
    const unlocked = loadUnlocked()
    const newly = []
    for (const def of ACHIEVEMENT_DEFS) {
      if (unlocked[def.id]) continue
      try {
        if (def.check(progress, matchStats)) {
          unlocked[def.id] = Date.now()
          newly.push({ id: def.id, name: def.name, desc: def.desc })
        }
      } catch {}
    }
    if (newly.length) saveUnlocked(unlocked)
    return newly
  },
}
