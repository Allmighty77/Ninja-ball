// ════════════════════════════════════════════════════════════
// HUD — score, chakra, jutsu, combo, pause, tutoriel
// ════════════════════════════════════════════════════════════

export class HUD {
  constructor() {
    this.root = document.createElement('div')
    this.root.className = 'hud'
    this._buildScoreboard()
    this._buildChakraGauge()
    this._buildJutsuButtons()
    this._buildCombo()
    this._buildMobileControls()
    this._buildGoalOverlay()
    this._buildPauseOverlay()
    this._buildTutorial()
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

  _buildCombo() {
    this.comboEl = document.createElement('div')
    this.comboEl.className = 'hud-combo'
    this.comboEl.id = 'hudCombo'
    this.comboEl.style.cssText = `
      position:absolute; top:22%; left:50%; transform:translateX(-50%);
      font-size:28px; font-weight:900; color:#ff6b1a;
      text-shadow:0 0 12px #ff6b1a, 0 2px 4px #000;
      opacity:0; transition:opacity 0.15s, transform 0.15s;
      pointer-events:none; letter-spacing:2px; z-index:20;
    `
    this.root.appendChild(this.comboEl)
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
      <div class="goal-combo" id="goalCombo" style="font-size:18px;margin-top:8px;opacity:0.9"></div>
    `
    this.root.appendChild(this.goalOverlay)
  }

  _buildPauseOverlay() {
    this.pauseOverlay = document.createElement('div')
    this.pauseOverlay.id = 'pauseOverlay'
    this.pauseOverlay.style.cssText = `
      display:none; position:absolute; inset:0; z-index:50;
      background:rgba(0,0,0,0.72); align-items:center; justify-content:center;
      flex-direction:column; color:#fff; font-family:system-ui,sans-serif;
    `
    this.pauseOverlay.innerHTML = `
      <div style="font-size:42px;font-weight:900;letter-spacing:4px;margin-bottom:12px">PAUSE</div>
      <div style="opacity:0.8;margin-bottom:24px">Échap ou P pour reprendre</div>
      <div style="font-size:13px;opacity:0.55">ZQSD · Espace tir · E dash · 1/2/3 jutsu · Shift sprint</div>
    `
    this.root.appendChild(this.pauseOverlay)
  }

  _buildTutorial() {
    this.tutorialEl = document.createElement('div')
    this.tutorialEl.id = 'tutorialOverlay'
    this.tutorialEl.style.cssText = `
      display:none; position:absolute; bottom:18%; left:50%; transform:translateX(-50%);
      z-index:40; max-width:min(420px,92vw); padding:14px 18px;
      background:rgba(10,10,24,0.92); border:1px solid #ff6b1a88; border-radius:12px;
      color:#fff; font-size:14px; line-height:1.5; text-align:center;
      pointer-events:none;
    `
    this.tutorialEl.innerHTML = `
      <strong style="color:#ff6b1a">Objectif</strong> : marque plus de buts que l'adversaire en 2 min.<br/>
      <strong>Espace</strong> = tirer / voler · <strong>E</strong> = dash · <strong>1 2 3</strong> = jutsu<br/>
      <span style="opacity:0.7">Gère ton chakra. Enchaîne des combos pour plus de puissance.</span>
    `
    this.root.appendChild(this.tutorialEl)
  }

  showTutorial() {
    this.tutorialEl.style.display = 'block'
    setTimeout(() => {
      if (this.tutorialEl) this.tutorialEl.style.display = 'none'
    }, 9000)
  }

  setPaused(paused) {
    this.pauseOverlay.style.display = paused ? 'flex' : 'none'
  }

  mount(parent) {
    parent.appendChild(this.root)
  }

  unmount() {
    if (this.root.parentElement) this.root.parentElement.removeChild(this.root)
  }

  updateScore(scoreL, scoreR, nameL, nameR) {
    const el = (id) => document.getElementById(id)
    if (el('sbScoreL')) el('sbScoreL').textContent = scoreL
    if (el('sbScoreR')) el('sbScoreR').textContent = scoreR
    if (el('sbNameL')) el('sbNameL').textContent = nameL
    if (el('sbNameR')) el('sbNameR').textContent = nameR
  }

  updateTimer(seconds) {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    const el = document.getElementById('sbTimer')
    if (!el) return
    el.textContent = `${m}:${s.toString().padStart(2, '0')}`
    if (seconds < 30) {
      el.style.color = '#ff3333'
      el.style.textShadow = '0 0 10px #ff0000'
    } else {
      el.style.color = '#ffffff'
      el.style.textShadow = ''
    }
  }

  updateChakra(chakra, max) {
    const ratio = chakra / max
    const fill = document.getElementById('chakraFill')
    if (fill) fill.style.strokeDashoffset = String(157 * (1 - ratio))
    const label = document.getElementById('chakraLabel')
    if (label) label.textContent = Math.floor(chakra)
  }

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

  updateCombo(combo) {
    const el = this.comboEl
    if (!el) return
    if (combo >= 2) {
      el.textContent = `COMBO x${combo}`
      el.style.opacity = '1'
      el.style.transform = 'translateX(-50%) scale(1.15)'
      setTimeout(() => {
        if (el) el.style.transform = 'translateX(-50%) scale(1)'
      }, 80)
    } else {
      el.style.opacity = '0'
    }
  }

  _jutsuIcon(type) {
    const icons = {
      shot: '⚽', pass: '➤', boost: '▲', tackle: '⚔',
      dash: '⚡', slowmo: '⌛', zone: '◉', heal: '✚', copy: '✦',
    }
    return icons[type] || '?'
  }

  showGoal(scorerName, combo = 0) {
    const sub = document.getElementById('goalSub')
    const gc = document.getElementById('goalCombo')
    if (sub) sub.textContent = scorerName
    if (gc) gc.textContent = combo >= 5 ? `COMBO x${combo} !` : ''
    this.goalOverlay.classList.add('active')
    setTimeout(() => this.goalOverlay.classList.remove('active'), 2600)
  }

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
        input.registerMobileButton(id, el, () => input.triggerAction(action))
      }
    })
  }
}
