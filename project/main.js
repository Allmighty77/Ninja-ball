// ════════════════════════════════════════════════════════════
// NINJA BALL — Ultimate Clash
// Point d'entrée — Machine à états : Titre → Sélection → Match → Fin
// PWA : enregistre le service worker
// ════════════════════════════════════════════════════════════
import './style.css'
import { AudioEngine } from './src/engine/Audio.js'
import { createTitleScreen, createSelectScreen, createEndScreen, createLeaderboardScreen } from './src/ui/screens.js'
import { Match } from './src/systems/Match.js'
import { CHARACTERS, getCharacterById } from './src/data/characters.js'

// Audio partagé entre tous les écrans
const audio = new AudioEngine()

// État global
let state = 'title'
let currentScreen = null
let currentMatch = null
let selectedChar = null

// Enregistrement du service worker (PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

// Affiche un écran (remplace le précédent)
function showScreen(screen) {
  if (currentScreen && currentScreen.parentElement) {
    currentScreen.parentElement.removeChild(currentScreen)
  }
  currentScreen = screen
  document.getElementById('app').appendChild(screen)
}

// Démarre l'audio au premier clic
function unlockAudio() {
  audio.unlock()
  document.removeEventListener('click', unlockAudio)
  document.removeEventListener('touchstart', unlockAudio)
}
document.addEventListener('click', unlockAudio)
document.addEventListener('touchstart', unlockAudio)

// ════════════════════════════════════════════════════════════
// ÉCRAN TITRE
// ════════════════════════════════════════════════════════════
function showTitle() {
  state = 'title'
  const screen = createTitleScreen(() => {
    audio.play('menu')
    showSelect()
  }, () => {
    audio.play('menu')
    showLeaderboard()
  })
  showScreen(screen)
}

// ════════════════════════════════════════════════════════════
// ÉCRAN SÉLECTION
// ════════════════════════════════════════════════════════════
function showSelect() {
  state = 'select'
  const screen = createSelectScreen((char) => {
    if (char === null) {
      // Retour
      audio.play('select')
      showTitle()
    } else {
      audio.play('select')
      selectedChar = char
      // L'IA choisit un perso aléatoire différent
      const aiPool = CHARACTERS.filter((c) => c.id !== char.id)
      const aiChar = aiPool[Math.floor(Math.random() * aiPool.length)]
      startMatch(char, aiChar)
    }
  })
  showScreen(screen)
}

// ════════════════════════════════════════════════════════════
// MATCH
// ════════════════════════════════════════════════════════════
function startMatch(playerChar, aiChar) {
  state = 'match'
  // Nettoie l'écran
  if (currentScreen && currentScreen.parentElement) {
    currentScreen.parentElement.removeChild(currentScreen)
  }
  currentScreen = null

  currentMatch = new Match(playerChar, aiChar, audio)
  currentMatch.onEnd = (result) => {
    currentMatch.dispose()
    currentMatch = null
    showEnd(result)
  }
  currentMatch.start()
}

// ════════════════════════════════════════════════════════════
// ÉCRAN FIN
// ════════════════════════════════════════════════════════════
function showEnd(result) {
  state = 'end'
  const screen = createEndScreen(
    result,
    () => {
      audio.play('select')
      // Rejouer avec les mêmes persos
      const aiPool = CHARACTERS.filter((c) => c.id !== selectedChar.id)
      const aiChar = aiPool[Math.floor(Math.random() * aiPool.length)]
      startMatch(selectedChar, aiChar)
    },
    () => {
      audio.play('select')
      showTitle()
    },
  )
  showScreen(screen)
}

// Démarrage
showTitle()

// ════════════════════════════════════════════════════════════
// ÉCRAN CLASSEMENT
// ════════════════════════════════════════════════════════════
function showLeaderboard() {
  state = 'leaderboard'
  const screen = createLeaderboardScreen(() => {
    audio.play('select')
    showTitle()
  })
  showScreen(screen)
}
