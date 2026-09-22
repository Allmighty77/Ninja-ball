// ════════════════════════════════════════════════════════════
// PROGRESSION LOCALE — stats offline + tutoriel
// Fonctionne sans Supabase ; ne remplace pas le classement online
// ════════════════════════════════════════════════════════════

const KEY = 'ninjaball.progress.v1'

const DEFAULT = {
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  totalGoals: 0,
  bestCombo: 0,
  winStreak: 0,
  bestStreak: 0,
  tutorialDone: false,
  difficulty: 'normal', // easy | normal | hard
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT }
    return { ...DEFAULT, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT }
  }
}

function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {}
}

export const Progress = {
  get() {
    return load()
  },

  setDifficulty(d) {
    const p = load()
    p.difficulty = d
    save(p)
  },

  markTutorialDone() {
    const p = load()
    p.tutorialDone = true
    save(p)
  },

  /** Appelé à la fin d'un match */
  recordMatch(result) {
    const p = load()
    p.gamesPlayed += 1
    const goals = result.stats?.playerGoals ?? result.scoreL ?? 0
    p.totalGoals += goals
    const combo = result.stats?.maxCombo ?? 0
    if (combo > p.bestCombo) p.bestCombo = combo

    if (result.winner === 'player') {
      p.wins += 1
      p.winStreak += 1
      if (p.winStreak > p.bestStreak) p.bestStreak = p.winStreak
    } else if (result.winner === 'ai') {
      p.losses += 1
      p.winStreak = 0
    } else {
      p.draws += 1
      p.winStreak = 0
    }
    save(p)
    return p
  },
}
