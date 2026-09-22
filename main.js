// ════════════════════════════════════════════════════════════
// NINJA BALL — Ultimate Clash
// Point d'entrée — Titre → Mode → Sélection → Match → Fin
// ════════════════════════════════════════════════════════════
import { AudioEngine } from './src/engine/Audio.js'
import { Settings } from './src/Settings.js'
import {
  createTitleScreen,
  createSelectScreen,
  createEndScreen,
  createLeaderboardScreen,
  createSettingsScreen,
} from './src/ui/screens.js'
import { Loader } from './src/Loader.js'
import { DevOverlay } from './src/dev/DevOverlay.js'
import { Match } from './src/systems/Match.js'
import { CHARACTERS } from './src/data/characters.js'
import { Progress } from './src/data/Progress.js'
import { Achievements } from './src/data/Achievements.js'

const audio = new AudioEngine()

let state = 'title'
let currentScreen = null
let currentMatch = null
let selectedChar = null
let selectedChar2 = null
let matchMode = 'vsAI' // vsAI | vsHuman

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

function showScreen(screen) {
  if (currentScreen && currentScreen.parentElement) {
    currentScreen.parentElement.removeChild(currentScreen)
  }
  currentScreen = screen
  document.getElementById('app').appendChild(screen)
}

function unlockAudio() {
  audio.unlock()
  const muted = Settings.get('audio.muted', false)
  audio.setMuted(muted)
  Settings.applyToAudio(audio)
  try {
    if (!muted) audio.startMusic()
  } catch {}
  document.removeEventListener('click', unlockAudio)
  document.removeEventListener('touchstart', unlockAudio)
}
document.addEventListener('click', unlockAudio)
document.addEventListener('touchstart', unlockAudio)

function showTitle() {
  state = 'title'
  const progress = Progress.get()
  const screen = createTitleScreen(
    (mode) => {
      audio.play('menu')
      matchMode = mode === 'vsHuman' ? 'vsHuman' : 'vsAI'
      showSelect(1)
    },
    () => {
      audio.play('menu')
      showLeaderboard()
    },
    () => {
      audio.play('menu')
      showSettings()
    },
    progress,
  )
  showScreen(screen)
}

function showSettings() {
  state = 'settings'
  const screen = createSettingsScreen((opts) => {
    audio.play('select')
    if (opts && typeof opts.muted === 'boolean') {
      audio.setMuted(opts.muted)
      Settings.set('audio.muted', opts.muted)
    }
    Settings.applyToAudio(audio)
    showTitle()
  })
  showScreen(screen)
}

function showSelect(step) {
  state = 'select'
  const title =
    matchMode === 'vsHuman'
      ? step === 1
        ? 'JOUEUR 1 — CHOISIS TON NINJA'
        : 'JOUEUR 2 — CHOISIS TON NINJA'
      : null

  const screen = createSelectScreen(
    (char) => {
      if (char === null) {
        audio.play('select')
        if (matchMode === 'vsHuman' && step === 2) {
          showSelect(1)
        } else {
          showTitle()
        }
        return
      }
      audio.play('select')
      if (matchMode === 'vsHuman') {
        if (step === 1) {
          selectedChar = char
          showSelect(2)
        } else {
          selectedChar2 = char
          startMatch(selectedChar, selectedChar2)
        }
      } else {
        selectedChar = char
        const aiPool = CHARACTERS.filter((c) => c.id !== char.id)
        const aiChar = aiPool[Math.floor(Math.random() * aiPool.length)]
        startMatch(char, aiChar)
      }
    },
    { headerTitle: title },
  )
  showScreen(screen)
}

function startMatch(playerChar, otherChar) {
  state = 'match'
  if (currentScreen && currentScreen.parentElement) {
    currentScreen.parentElement.removeChild(currentScreen)
  }
  currentScreen = null

  const difficulty = Progress.get().difficulty || 'normal'
  const showTutorial = !Progress.get().tutorialDone && matchMode === 'vsAI'

  currentMatch = new Match(playerChar, otherChar, audio, {
    difficulty,
    showTutorial,
    mode: matchMode,
  })
  currentMatch.onEnd = (result) => {
    if (matchMode === 'vsAI') {
      const progress = Progress.recordMatch(result)
      if (showTutorial) Progress.markTutorialDone()
      const unlocked = Achievements.evaluate(progress, result.stats || {})
      result.unlockedAchievements = unlocked
    }
    currentMatch.dispose()
    currentMatch = null
    showEnd(result)
  }
  currentMatch.start()
}

function showEnd(result) {
  state = 'end'
  const progress = Progress.get()
  if (result.unlockedAchievements?.length) {
    audio.play('goal')
  }
  const screen = createEndScreen(
    result,
    () => {
      audio.play('select')
      if (matchMode === 'vsHuman') {
        startMatch(selectedChar, selectedChar2)
      } else {
        const aiPool = CHARACTERS.filter((c) => c.id !== selectedChar.id)
        const aiChar = aiPool[Math.floor(Math.random() * aiPool.length)]
        startMatch(selectedChar, aiChar)
      }
    },
    () => {
      audio.play('select')
      showTitle()
    },
    progress,
  )
  showScreen(screen)
}

function showLeaderboard() {
  state = 'leaderboard'
  const screen = createLeaderboardScreen(() => {
    audio.play('select')
    showTitle()
  })
  showScreen(screen)
}

DevOverlay.install()
Loader.preload({ assets: [], sounds: [] })
  .then(() => {
    Settings.applyToAudio(audio)
    const muted = Settings.get('audio.muted', false)
    audio.setMuted(muted)
    showTitle()
  })
  .catch(() => {
    Settings.applyToAudio(audio)
    showTitle()
  })
