export const DevOverlay = {
  install() {
    if (window.__DEV_OVERLAY_INSTALLED) return
    window.__DEV_OVERLAY_INSTALLED = true
    const el = document.createElement('div')
    el.id = 'dev-overlay'
    el.style.display = 'none'
    el.innerHTML = `<div id="dev-overlay-inner"><button id="dev-close">✕</button><pre id="dev-stack"></pre></div>`
    document.body.appendChild(el)

    document.getElementById('dev-close').addEventListener('click', () => { el.style.display = 'none' })

    window.addEventListener('error', (e) => {
      this.show(e.message + '\n' + (e.error && e.error.stack ? e.error.stack : ''))
    })
    window.addEventListener('unhandledrejection', (e) => {
      this.show('UnhandledRejection: ' + (e.reason && e.reason.stack ? e.reason.stack : e.reason))
    })
  },
  show(msg) {
    const el = document.getElementById('dev-overlay')
    if (!el) return
    el.style.display = 'block'
    const pre = document.getElementById('dev-stack')
    pre.textContent = msg
  }
}
