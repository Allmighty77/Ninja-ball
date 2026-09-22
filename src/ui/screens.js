// ════════════════════════════════════════════════════════════
// ÉCRANS — menus + progression locale + difficulté
// ════════════════════════════════════════════════════════════
import { CHARACTERS } from '../data/characters.js'
import { Settings } from '../Settings.js'
import { Progress } from '../data/Progress.js'
import { getCharacterStats, getRecentMatches } from '../data/db.js'

export function createTitleScreen(onStart, onLeaderboard, onSettings, progress = null) {
  const p = progress || Progress.get()
  const screen = document.createElement('div')
  screen.className = 'screen screen-title'
  screen.innerHTML = `
    <div class="title-bg"></div>
    <div class="title-content">
      <div class="title-seal"></div>
      <h1 class="title-main">
        <span class="title-ninja">NINJA</span>
        <span class="title-ball">BALL</span>
      </h1>
      <p class="title-sub">ULTIMATE CLASH</p>
      <p class="title-desc">Football Ninja Clash — Fan Game Non Commercial</p>
      ${p.gamesPlayed > 0 ? `<p style="opacity:0.75;font-size:13px;margin:8px 0">🏆 ${p.wins}V · Série ${p.winStreak} · Record combo x${p.bestCombo}</p>` : ''}
      <button class="btn-primary" id="btnStart">COMMENCER</button>
      <div style="display:flex; gap:8px; justify-content:center; margin-top:10px; flex-wrap:wrap">
        <button class="btn-secondary" id="btnLeaderboard">CLASSEMENT</button>
        <button class="btn-secondary" id="btnSettings">OPTIONS</button>
      </div>
      <div class="title-controls">
        <div class="ctrl-row"><span class="ctrl-key">ZQSD / WASD</span> Déplacer</div>
        <div class="ctrl-row"><span class="ctrl-key">ESPACE</span> Tirer / Voler</div>
        <div class="ctrl-row"><span class="ctrl-key">E</span> Dash</div>
        <div class="ctrl-row"><span class="ctrl-key">1 / 2 / 3</span> Jutsu</div>
        <div class="ctrl-row"><span class="ctrl-key">SHIFT</span> Sprint · <span class="ctrl-key">Échap</span> Pause</div>
      </div>
      <p class="title-disclaimer">Naruto © Kishimoto / Shueisha / Pierrot / Bandai Namco</p>
    </div>
  `
  screen.querySelector('#btnStart').addEventListener('click', () => onStart())
  screen.querySelector('#btnLeaderboard').addEventListener('click', () => onLeaderboard())
  const settingsBtn = screen.querySelector('#btnSettings')
  if (settingsBtn && typeof onSettings === 'function') settingsBtn.addEventListener('click', () => onSettings())
  return screen
}

export function createSettingsScreen(onBack) {
  const screen = document.createElement('div')
  screen.className = 'screen screen-select'
  const curQuality = Settings.get('graphics.quality', 'high')
  const curShadows = Settings.get('graphics.shadows', true)
  const curVol = Settings.get('audio.volume', 0.4)
  const curDiff = Progress.get().difficulty || 'normal'
  screen.innerHTML = `
    <div style="max-width:600px;text-align:left;padding:16px">
      <h2>Options</h2>
      <div style="margin:12px 0">
        <label>Difficulté IA : </label>
        <select id="optDiff">
          <option value="easy">Facile</option>
          <option value="normal">Normal</option>
          <option value="hard">Difficile</option>
        </select>
      </div>
      <div style="margin:12px 0">
        <label>Qualité graphique : </label>
        <select id="optQuality">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
      <div style="margin:12px 0">
        <label><input type="checkbox" id="optShadows" /> Activer les ombres</label>
      </div>
      <div style="margin:12px 0">
        <label>Volume maître : </label>
        <input id="optVol" type="range" min="0" max="1" step="0.01" />
      </div>
      <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn-primary" id="optSave">Enregistrer</button>
        <button class="btn-secondary" id="optRemap">Remapper les touches</button>
        <button class="btn-secondary" id="optBack">← Retour</button>
      </div>
    </div>
  `
  const sel = screen.querySelector('#optQuality')
  const sh = screen.querySelector('#optShadows')
  const vol = screen.querySelector('#optVol')
  const diff = screen.querySelector('#optDiff')
  sel.value = curQuality
  sh.checked = !!curShadows
  vol.value = String(curVol)
  diff.value = curDiff

  screen.querySelector('#optSave').addEventListener('click', () => {
    Settings.set('graphics.quality', sel.value)
    Settings.set('graphics.shadows', !!sh.checked)
    Settings.set('audio.volume', Number(vol.value))
    Progress.setDifficulty(diff.value)
    onBack()
  })
  screen.querySelector('#optBack').addEventListener('click', () => onBack())
  screen.querySelector('#optRemap').addEventListener('click', async () => {
    const remapScreen = await import('./screens.js').then((m) =>
      m.createRemapScreen(() => {
        if (remapScreen.parentElement) remapScreen.parentElement.replaceChild(screen, remapScreen)
      }),
    )
    if (screen.parentElement) screen.parentElement.replaceChild(remapScreen, screen)
  })
  return screen
}

export function createRemapScreen(onDone) {
  const screen = document.createElement('div')
  screen.className = 'screen screen-select'
  const mapping = JSON.parse(
    localStorage.getItem('ninjaball.settings.controls') ||
      JSON.stringify({ shoot: 'Space', dash: 'KeyE', jutsu1: 'Digit1', jutsu2: 'Digit2', jutsu3: 'Digit3' }),
  )
  screen.innerHTML = `
    <div style="max-width:600px;text-align:left;padding:16px">
      <h2>Remapper les touches</h2>
      <div id="remap-list"></div>
      <div style="margin-top:16px">
        <button class="btn-primary" id="remapSave">Enregistrer</button>
        <button class="btn-secondary" id="remapCancel">Annuler</button>
      </div>
    </div>
  `
  const list = screen.querySelector('#remap-list')
  const actions = ['shoot', 'dash', 'jutsu1', 'jutsu2', 'jutsu3']
  let listening = null
  function render() {
    list.innerHTML = actions
      .map(
        (a) =>
          `<div style="margin:8px 0"><strong>${a}</strong>: <button class="remap-btn" data-action="${a}">${mapping[a]}</button></div>`,
      )
      .join('')
    list.querySelectorAll('.remap-btn').forEach((b) => {
      b.addEventListener('click', () => {
        listening = b.dataset.action
        b.textContent = 'Appuyez sur une touche...'
      })
    })
  }
  window.addEventListener('keydown', (e) => {
    if (!listening) return
    mapping[listening] = e.code
    listening = null
    render()
  })
  render()
  screen.querySelector('#remapSave').addEventListener('click', () => {
    localStorage.setItem('ninjaball.settings.controls', JSON.stringify(mapping))
    onDone(true)
  })
  screen.querySelector('#remapCancel').addEventListener('click', () => onDone(false))
  return screen
}

export function createSelectScreen(onConfirm) {
  const screen = document.createElement('div')
  screen.className = 'screen screen-select'
  let selectedIdx = 0

  screen.innerHTML = `
    <div class="select-header">
      <h2>CHOISIS TON NINJA</h2>
    </div>
    <div class="select-grid" id="selectGrid"></div>
    <div class="select-detail" id="selectDetail"></div>
    <button class="btn-primary" id="btnConfirm">CONFIRMER →</button>
    <button class="btn-secondary" id="btnBack">← RETOUR</button>
  `

  const grid = screen.querySelector('#selectGrid')
  const detail = screen.querySelector('#selectDetail')

  function renderCards() {
    grid.innerHTML = ''
    CHARACTERS.forEach((char, i) => {
      const card = document.createElement('div')
      card.className = 'char-card' + (i === selectedIdx ? ' selected' : '')
      const hex = '#' + char.color.toString(16).padStart(6, '0')
      const accHex = '#' + char.accentColor.toString(16).padStart(6, '0')
      card.style.setProperty('--char-color', hex)
      card.style.setProperty('--char-accent', accHex)
      card.innerHTML = `
        <div class="char-avatar">
          <div class="char-orb"></div>
          <div class="char-ring"></div>
        </div>
        <div class="char-name">${char.name}</div>
        <div class="char-clan">${char.clan}</div>
        <div class="char-stats">
          <div class="stat-row"><span>VIT</span><div class="stat-bar"><div class="stat-fill" style="width:${char.speed * 10}%"></div></div></div>
          <div class="stat-row"><span>TIR</span><div class="stat-bar"><div class="stat-fill" style="width:${char.shotPower * 10}%"></div></div></div>
          <div class="stat-row"><span>CHK</span><div class="stat-bar"><div class="stat-fill" style="width:${(char.chakraMax / 120) * 100}%"></div></div></div>
        </div>
      `
      card.addEventListener('click', () => {
        selectedIdx = i
        renderCards()
        renderDetail()
      })
      grid.appendChild(card)
    })
  }

  function renderDetail() {
    const char = CHARACTERS[selectedIdx]
    const hex = '#' + char.color.toString(16).padStart(6, '0')
    detail.innerHTML = `
      <div class="detail-panel" style="border-color:${hex}">
        <h3>${char.name}</h3>
        <p class="detail-desc">${char.description}</p>
        <div class="detail-jutsus">
          ${char.jutsus
            .map(
              (j, i) => `
            <div class="detail-jutsu">
              <div class="dj-num">${i + 1}</div>
              <div class="dj-info">
                <div class="dj-name">${j.name}</div>
                <div class="dj-desc">${j.description}</div>
                <div class="dj-stats">Chakra: ${j.cost} | CD: ${j.cooldown}s</div>
              </div>
            </div>
          `,
            )
            .join('')}
        </div>
      </div>
    `
  }

  renderCards()
  renderDetail()

  screen.querySelector('#btnConfirm').addEventListener('click', () => onConfirm(CHARACTERS[selectedIdx]))
  screen.querySelector('#btnBack').addEventListener('click', () => onConfirm(null))
  return screen
}

export function createEndScreen(result, onRematch, onMenu, progress = null) {
  const screen = document.createElement('div')
  screen.className = 'screen screen-end'
  const winnerText = result.winner === 'player' ? 'VICTOIRE !' : result.winner === 'ai' ? 'DÉFAITE...' : 'ÉGALITÉ'
  const winnerClass = result.winner === 'player' ? 'win' : result.winner === 'ai' ? 'lose' : 'draw'
  const pHex = '#' + result.playerChar.color.toString(16).padStart(6, '0')
  const aHex = '#' + result.aiChar.color.toString(16).padStart(6, '0')
  const st = result.stats || {}
  const p = progress || Progress.get()

  screen.innerHTML = `
    <div class="end-content">
      <h2 class="end-result ${winnerClass}">${winnerText}</h2>
      <div class="end-score">
        <div class="end-team">
          <div class="end-name" style="color:${pHex}">${result.playerChar.name}</div>
          <div class="end-goals">${result.scoreL}</div>
        </div>
        <div class="end-vs">—</div>
        <div class="end-team">
          <div class="end-goals">${result.scoreR}</div>
          <div class="end-name" style="color:${aHex}">${result.aiChar.name}</div>
        </div>
      </div>
      <div class="end-stats" style="margin:16px 0;font-size:14px;opacity:0.9;line-height:1.7">
        <div>⚽ Buts : <strong>${st.playerGoals ?? result.scoreL}</strong></div>
        <div>⚔ Vols : <strong>${st.steals ?? 0}</strong> · ✦ Jutsu : <strong>${st.jutsusUsed ?? 0}</strong></div>
        <div>🔥 Combo max : <strong>x${st.maxCombo ?? 0}</strong></div>
        <div style="margin-top:8px;opacity:0.75">Profil — ${p.wins}V / ${p.losses}D · Série ${p.winStreak} · Record x${p.bestCombo}</div>
      </div>
      <div class="end-buttons">
        <button class="btn-primary" id="btnRematch">REJOUER</button>
        <button class="btn-secondary" id="btnMenu">MENU</button>
      </div>
    </div>
  `
  screen.querySelector('#btnRematch').addEventListener('click', () => onRematch())
  screen.querySelector('#btnMenu').addEventListener('click', () => onMenu())
  return screen
}

export function createLeaderboardScreen(onBack) {
  const screen = document.createElement('div')
  screen.className = 'screen screen-leaderboard'
  const local = Progress.get()
  screen.innerHTML = `
    <div class="leaderboard-content">
      <h2>CLASSEMENT</h2>
      <div style="margin-bottom:16px;opacity:0.85;font-size:14px">
        Stats locales : ${local.wins}V · ${local.losses}D · ${local.draws}N · Série ${local.winStreak}
      </div>
      <div class="leaderboard-loading" id="lbLoading">Chargement online...</div>
      <div class="leaderboard-stats" id="lbStats"></div>
      <div class="leaderboard-recent">
        <h3>DERNIERS MATCHS</h3>
        <div id="lbRecent"></div>
      </div>
      <button class="btn-secondary" id="btnLbBack" style="margin-top:16px">← RETOUR</button>
    </div>
  `

  const statsEl = screen.querySelector('#lbStats')
  const recentEl = screen.querySelector('#lbRecent')
  const loadingEl = screen.querySelector('#lbLoading')

  Promise.all([getCharacterStats(), getRecentMatches(8)])
    .then(([stats, recent]) => {
      loadingEl.style.display = 'none'
      if (stats.length === 0) {
        statsEl.innerHTML = '<p class="lb-empty">Aucun classement online (mode local actif).</p>'
      } else {
        statsEl.innerHTML = `
          <table class="lb-table">
            <thead>
              <tr><th>Ninja</th><th>V</th><th>D</th><th>N</th><th>BM</th><th>BE</th><th>MJ</th></tr>
            </thead>
            <tbody>
              ${stats
                .map((s) => {
                  const char = CHARACTERS.find((c) => c.id === s.character_id)
                  const hex = char ? '#' + char.color.toString(16).padStart(6, '0') : '#ff6b1a'
                  return `<tr>
                  <td class="lb-name" style="color:${hex}">${s.character_name}</td>
                  <td>${s.wins}</td><td>${s.losses}</td><td>${s.draws}</td>
                  <td>${s.goals_scored}</td><td>${s.goals_conceded}</td><td>${s.matches_played}</td>
                </tr>`
                })
                .join('')}
            </tbody>
          </table>
        `
      }
      if (recent.length === 0) {
        recentEl.innerHTML = '<p class="lb-empty">Aucun match récent online.</p>'
      } else {
        recentEl.innerHTML = recent
          .map((m) => {
            const pHex =
              '#' +
              (CHARACTERS.find((c) => c.id === m.player_character_id)?.color || 0xff6b1a)
                .toString(16)
                .padStart(6, '0')
            const aHex =
              '#' +
              (CHARACTERS.find((c) => c.id === m.ai_character_id)?.color || 0x2b6fff)
                .toString(16)
                .padStart(6, '0')
            const wLabel = m.winner === 'player' ? 'Victoire' : m.winner === 'ai' ? 'Défaite' : 'Nul'
            const wClass = m.winner === 'player' ? 'lb-win' : m.winner === 'ai' ? 'lb-lose' : 'lb-draw'
            const date = new Date(m.created_at).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })
            return `<div class="lb-match ${wClass}">
            <span class="lb-date">${date}</span>
            <span class="lb-teams">
              <span style="color:${pHex}">${m.player_character_name}</span>
              ${m.player_score} — ${m.ai_score}
              <span style="color:${aHex}">${m.ai_character_name}</span>
            </span>
            <span class="lb-wlabel">${wLabel}</span>
          </div>`
          })
          .join('')
      }
    })
    .catch(() => {
      loadingEl.textContent = 'Classement online indisponible — stats locales OK.'
    })

  screen.querySelector('#btnLbBack').addEventListener('click', () => onBack())
  return screen
}
