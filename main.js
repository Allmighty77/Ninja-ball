// ════════════════════════════════════════════════════════════
// NINJA BALL — Ultimate Clash
// Point d'entrée — Machine à états : Titre → Sélection → Match → Fin
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
  document.removeEventListener('click', unlockAudio)
  document.removeEventListener('touchstart', unlockAudio)
}
document.addEventListener('click', unlockAudio)
document.addEventListener('touchstart', unlockAudio)

function showTitle() {
  state = 'title'
  const progress = Progress.get()
  const screen = createTitleScreen(
    () => {
      audio.play('menu')
      showSelect()
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
  const screen = createSettingsScreen(() => {
    audio.play('select')
    Settings.applyToAudio(audio)
    showTitle()
  })
  showScreen(screen)
}

function showSelect() {
  state = 'select'
  const screen = createSelectScreen((char) => {
    if (char === null) {
      audio.play('select')
      showTitle()
    } else {
      audio.play('select')
      selectedChar = char
      const aiPool = CHARACTERS.filter((c) => c.id !== char.id)
      const aiChar = aiPool[Math.floor(Math.random() * aiPool.length)]
      startMatch(char, aiChar)
    }
  })
  showScreen(screen)
}

function startMatch(playerChar, aiChar) {
  state = 'match'
  if (currentScreen && currentScreen.parentElement) {
    currentScreen.parentElement.removeChild(currentScreen)
  }
  currentScreen = null

  const difficulty = Progress.get().difficulty || 'normal'
  const showTutorial = !Progress.get().tutorialDone

  currentMatch = new Match(playerChar, aiChar, audio, { difficulty, showTutorial })
  currentMatch.onEnd = (result) => {
    const progress = Progress.recordMatch(result)
    if (showTutorial) Progress.markTutorialDone()
    const unlocked = Achievements.evaluate(progress, result.stats || {})
    result.unlockedAchievements = unlocked
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
      const aiPool = CHARACTERS.filter((c) => c.id !== selectedChar.id)
      const aiChar = aiPool[Math.floor(Math.random() * aiPool.length)]
      startMatch(selectedChar, aiChar)
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
    showTitle()
  })
  .catch(() => {
    Settings.applyToAudio(audio)
    showTitle()
  })
