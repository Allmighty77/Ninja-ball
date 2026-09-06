// ════════════════════════════════════════════════════════════
// HUD — Interface de jeu (score, chrono, chakra, jutsu, mobile)
// HUD hybride : style FIFA + style Naruto Storm
// ════════════════════════════════════════════════════════════

export class HUD {
  constructor() {
    this.root = document.createElement('div')
    this.root.className = 'hud'
    this._buildScoreboard()
    this._buildChakraGauge()
    this._buildJutsuButtons()
    this._buildMobileControls()
    this._buildGoalOverlay()
  }

  _buildScoreboard() {
    this.scoreboard = document.createElement('div')
    this.scoreboard.className = 'hud-scoreboard'
    this.scoreboard.innerHTML = `
      <div class="sb-team sb-left">
        <div class="sb-name" id="sbNameL">Joueur</div>
        <div class="sb-score" id="sbScoreL">0</div>
      </div>
      <div class="sb-center">
        <div class="sb-timer" id="sbTimer">2:00</div>
        <div class="sb-label">NINJA BALL</div>
      </div>
      <div class="sb-team sb-right">
        <div class="sb-score" id="sbScoreR">0</div>
        <div class="sb-name" id="sbNameR">IA</div>
      </div>
    `
    this.root.appendChild(this.scoreboard)
  }

  _buildChakraGauge() {
    this.chakraWrap = document.createElement('div')
    this.chakraWrap.className = 'hud-chakra'
    // SVG jauge incurvée lumineuse
    this.chakraWrap.innerHTML = `
      <svg viewBox="0 0 120 70" class="chakra-svg">
        <defs>
          <linearGradient id="chakraGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#ff6b1a"/>
            <stop offset="100%" stop-color="#ffaa3a"/>
          </linearGradient>
          <filter id="chakraGlow">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <path class="chakra-bg" d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="#222" stroke-width="8" stroke-linecap="round"/>
        <path class="chakra-fill" id="chakraFill" d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="url(#chakraGrad)" stroke-width="8" stroke-linecap="round" filter="url(#chakraGlow)" stroke-dasharray="157" stroke-dashoffset="157"/>
      </svg>
      <div class="chakra-label" id="chakraLabel">100</div>
    `
    this.root.appendChild(this.chakraWrap)
  }

  _buildJutsuButtons() {
    this.jutsuWrap = document.createElement('div')
    this.jutsuWrap.className = 'hud-jutsu'
    this.jutsuButtons = []
    for (let i = 0; i < 3; i++) {
      const btn = document.createElement('div')
      btn.className = 'jutsu-btn'
      btn.innerHTML = `
        <div class="jutsu-icon" id="jutsuIcon${i}">?</div>
        <div class="jutsu-name" id="jutsuName${i}">—</div>
        <div class="jutsu-cd" id="jutsuCd${i}"></div>
        <div class="jutsu-key">${i + 1}</div>
      `
      this.jutsuWrap.appendChild(btn)
      this.jutsuButtons.push(btn)
    }
    this.root.appendChild(this.jutsuWrap)
  }

  _buildMobileControls() {
    this.mobileWrap = document.createElement('div')
    this.mobileWrap.className = 'hud-mobile'
    this.mobileWrap.innerHTML = `
      <div class="mobile-joystick" id="mJoy">
        <div class="joystick-base"></div>
        <div class="joystick-knob" id="mKnob"></div>
      </div>
      <div class="mobile-buttons">
        <button class="mbtn mbtn-shoot" id="mbtnShoot" data-action="shoot">TIR</button>
        <button class="mbtn mbtn-dash" id="mbtnDash" data-action="dash">DASH</button>
        <button class="mbtn mbtn-jutsu" id="mbtnJ1" data-action="jutsu1">J1</button>
        <button class="mbtn mbtn-jutsu" id="mbtnJ2" data-action="jutsu2">J2</button>
        <button class="mbtn mbtn-jutsu" id="mbtnJ3" data-action="jutsu3">J3</button>
      </div>
    `
    this.root.appendChild(this.mobileWrap)
  }

  _buildGoalOverlay() {
    this.goalOverlay = document.createElement('div')
    this.goalOverlay.className = 'goal-overlay'
    this.goalOverlay.innerHTML = `
      <div class="goal-text">BUT !</div>
      <div class="goal-sub" id="goalSub"></div>
    `
    this.root.appendChild(this.goalOverlay)
  }

  mount(parent) {
    parent.appendChild(this.root)
  }

  unmount() {
    if (this.root.parentElement) this.root.parentElement.removeChild(this.root)
  }

  // Met à jour le scoreboard
  updateScore(scoreL, scoreR, nameL, nameR) {
    document.getElementById('sbScoreL').textContent = scoreL
    document.getElementById('sbScoreR').textContent = scoreR
    document.getElementById('sbNameL').textContent = nameL
    document.getElementById('sbNameR').textContent = nameR
  }

  // Met à jour le chrono
  updateTimer(seconds) {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    const el = document.getElementById('sbTimer')
    if (el) el.textContent = `${m}:${s.toString().padStart(2, '0')}`
    // Rouge si < 30s
    if (seconds < 30) el.style.color = '#ff3333'
    else el.style.color = '#ffffff'
  }

  // Met à jour la jauge de chakra
  updateChakra(chakra, max) {
    const ratio = chakra / max
    const fill = document.getElementById('chakraFill')
    if (fill) {
      const total = 157
      fill.style.strokeDashoffset = total * (1 - ratio)
    }
    const label = document.getElementById('chakraLabel')
    if (label) label.textContent = Math.floor(chakra)
  }

  // Met à jour les boutons jutsu
  updateJutsu(character, cooldowns, chakra) {
    character.jutsus.forEach((jutsu, i) => {
      const icon = document.getElementById(`jutsuIcon${i}`)
      const name = document.getElementById(`jutsuName${i}`)
      const cd = document.getElementById(`jutsuCd${i}`)
      const btn = this.jutsuButtons[i]

      if (icon) icon.textContent = this._jutsuIcon(jutsu.type)
      if (name) name.textContent = jutsu.name
      if (btn) {
        const onCd = cooldowns[i] > 0
        const noChakra = chakra < jutsu.cost
        btn.classList.toggle('cooldown', onCd)
        btn.classList.toggle('no-chakra', noChakra && !onCd)
        if (cd) cd.textContent = onCd ? cooldowns[i].toFixed(1) : ''
      }
    })
  }

  _jutsuIcon(type) {
    const icons = {
      shot: '⚽',
      pass: '➤',
      boost: '▲',
      tackle: '⚔',
      dash: '⚡',
      slowmo: '⌛',
      zone: '◉',
      heal: '✚',
      copy: '✦',
    }
    return icons[type] || '?'
  }

  // Affiche le but en grand
  showGoal(scorerName) {
    const sub = document.getElementById('goalSub')
    if (sub) sub.textContent = scorerName
    this.goalOverlay.classList.add('active')
    setTimeout(() => this.goalOverlay.classList.remove('active'), 2500)
  }

  // Enregistre les boutons mobiles pour l'input
  registerMobileInput(input) {
    if (!input.isTouch) {
      this.mobileWrap.style.display = 'none'
      return
    }
    const buttons = [
      { id: 'mbtnShoot', action: 'shoot' },
      { id: 'mbtnDash', action: 'dash' },
      { id: 'mbtnJ1', action: 'jutsu1' },
      { id: 'mbtnJ2', action: 'jutsu2' },
      { id: 'mbtnJ3', action: 'jutsu3' },
    ]
    buttons.forEach(({ id, action }) => {
      const el = document.getElementById(id)
      if (el) {
        input.registerMobileButton(id, el, () => {
          input.triggerAction(action)
        })
      }
    })
  }
}
