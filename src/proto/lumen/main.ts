/**
 * LUMEN — hero entry point.
 *
 * Order of business, on purpose:
 *   1. the browser paints the hand-written HTML (the H1 is the LCP),
 *   2. the terminal types and the numbers count,
 *   3. after `load`, when the main thread is idle, the GPU takes over the light.
 * Nothing here moves a single box.
 */
import { HEADLINE, METRICS, NAME } from '../shared/content'
import { MAX_PANELS, R, S, Spring, buildHeadlineMask, measurePanels, simGrid } from './shared'
import { createGpuBackend, type Backend } from './gpu'
import { createGlBackend } from './gl'
import { Readout, countMetrics, typeTerminal } from './ui'

/**
 * How much of the DOM headline's own ink survives once the glass letters are
 * lit underneath it. Never 0: the ink is what makes the headline read.
 */
const INK_FLOOR = 0.8

const html = document.documentElement
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
const coarse = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window
const phone = matchMedia('(max-width: 860px)').matches

// The copy on the page and the copy in the repo are the same copy.
if (import.meta.env.DEV) {
  const h1 = document.getElementById('head')
  if (h1 && h1.textContent !== HEADLINE[0]) console.warn('lumen: headline out of sync with content.ts', NAME, METRICS.length)
}

if (coarse) html.classList.add('touch')
const hint = document.getElementById('hint')
if (hint && coarse) hint.textContent = 'touch to push the light'

const readout = new Readout()

/* ---------------- 2. the DOM comes alive right after first paint ---------- */
const term = document.getElementById('term')
const headEl = document.getElementById('head')
const subEl = document.getElementById('sub')
requestAnimationFrame(() =>
  requestAnimationFrame(() => {
    // the headline has already painted as real text; now it can wear the gradient
    html.classList.add('fx-grad')
    // reduced motion keeps the terminal exactly as it was authored in the HTML
    if (term && !reduced) typeTerminal(term)
  }),
)

/**
 * `document.fonts.ready` resolves as soon as nothing is *pending* — which can
 * be before the Google Fonts stylesheet has even been parsed. The headline
 * mask must be cut from the same face the DOM is using, so ask for the display
 * face by name and wait for that.
 */
const fontsReady: Promise<unknown> = document.fonts
  ? Promise.race([
      (async () => {
        try {
          await document.fonts.load('700 100px "Space Grotesk"')
        } catch {
          /* the metric-matched fallback carries the layout */
        }
        await document.fonts.ready
      })(),
      new Promise((r) => setTimeout(r, 2000)),
    ])
  : Promise.resolve()

fontsReady.then(() => countMetrics(reduced))

/* ---------------- 3. the light ------------------------------------------- */
type PointerRec = { x: number; y: number; px: number; py: number; vx: number; vy: number; t: number }

const pointers = new Map<number, PointerRec>()
const uni = new Float32Array(R.SIZE)
const sim = new Float32Array(S.SIZE)
const pulses: { x: number; y: number; age: number; amp: number }[] = []
const lensX = new Spring(0, 150, 21)
const lensY = new Spring(0, 150, 21)

let backend: Backend | null = null
let canvas: HTMLCanvasElement | null = null
let scale = 1
let cssW = 0
let cssH = 0
let running = false
let visible = true
let onScreen = true
let started = 0
let last = 0
let maskRect: DOMRect | null = null
let glass = 0
let maskFade = 0
let lensOn = 0
let grav = { x: 0, y: 0 }
let simTime = Math.random() * 120

function viewport() {
  cssW = Math.max(320, window.innerWidth)
  cssH = Math.max(320, window.innerHeight)
  scale = phone ? Math.min(devicePixelRatio || 1, 2) * 0.72 : Math.min(devicePixelRatio || 1, 1.5)
}

function layout() {
  if (!backend || !canvas) return
  viewport()
  const w = Math.round(cssW * scale)
  const h = Math.round(cssH * scale)
  if (canvas.width !== w || canvas.height !== h) backend.resize(w, h)

  uni[R.res] = w
  uni[R.res + 1] = h
  uni[R.inv] = 1 / w
  uni[R.inv + 1] = 1 / h
  uni[R.scale] = scale
  uni[R.aspect] = w / h
  uni[R.grid] = backend.grid[0]
  uni[R.grid + 1] = backend.grid[1]
  uni[R.lensR] = (phone ? 88 : 112) * scale
  uni[R.grain] = reduced ? 0.006 : 0.013

  const panels = measurePanels(scale)
  for (let i = 0; i < MAX_PANELS; i++) {
    const p = panels[i]
    const o = R.panels + i * 4
    uni[o] = p ? p.rect.left * scale : 0
    uni[o + 1] = p ? p.rect.top * scale : 0
    uni[o + 2] = p ? p.rect.width * scale : 0
    uni[o + 3] = p ? p.rect.height * scale : 0
    uni[R.panelR + i] = p ? p.radius : 0
  }

  sim[S.aspect] = w / h

  // The clearing: the medium is told to stay thin exactly where the headline's
  // INK is — measured from the live text, not the full-width element — so the
  // biggest type on the page always keeps its paper while the light comes
  // straight back on the empty side of the line.
  const ink = inkBox(headEl, subEl)
  sim[S.clear] = (ink.top + ink.bottom) / 2 / cssH
  sim[S.clear + 1] = Math.min(0.26, Math.max(0.1, (((ink.bottom - ink.top) / 2) * 1.55) / cssH))
  sim[S.clear + 2] = (ink.left + ink.right) / 2 / cssW
  sim[S.clear + 3] = Math.min(0.6, (((ink.right - ink.left) / 2) * 1.08) / cssW)
}

/** The box the headline's glyphs actually cover, not the box its element does. */
function inkBox(...els: (HTMLElement | null)[]) {
  let top = Infinity,
    bottom = -Infinity,
    left = Infinity,
    right = -Infinity
  for (const el of els) {
    if (!el) continue
    const r = document.createRange()
    r.selectNodeContents(el)
    const b = r.getBoundingClientRect()
    if (b.width < 1) continue
    top = Math.min(top, b.top)
    bottom = Math.max(bottom, b.bottom)
    left = Math.min(left, b.left)
    right = Math.max(right, b.right)
  }
  if (!isFinite(top)) return { top: cssH * 0.26, bottom: cssH * 0.42, left: 0, right: cssW }
  return { top, bottom, left, right }
}

function rebuildMask() {
  if (!backend) return
  const m = buildHeadlineMask(scale)
  if (!m) return
  backend.setMask(m.canvas)
  maskRect = m.rect
  uni[R.mask] = m.rect.left * scale
  uni[R.mask + 1] = m.rect.top * scale
  uni[R.mask + 2] = m.rect.width * scale
  uni[R.mask + 3] = m.rect.height * scale
}

function writeSplats(dt: number) {
  for (let i = 0; i < 4; i++) {
    const o = S.splats + i * 4
    sim[o] = sim[o + 1] = sim[o + 2] = sim[o + 3] = 0
    const v = S.svel + i * 4
    sim[v] = sim[v + 1] = sim[v + 2] = sim[v + 3] = 0
  }
  if (reduced) return
  let i = 0
  for (const p of pointers.values()) {
    if (i >= 4) break
    const o = S.splats + i * 4
    const v = S.svel + i * 4
    const speed = Math.hypot(p.vx, p.vy)
    sim[o] = p.x / cssW
    sim[o + 1] = p.y / cssH
    sim[o + 2] = 0.062 + Math.min(0.06, speed * 0.025)
    sim[o + 3] = Math.min(1.2, 0.34 + speed * 1.1)
    sim[v] = (p.vx / cssW) * 0.5
    sim[v + 1] = (p.vy / cssH) * 0.5
    sim[v + 2] = (i * 0.37) % 1
    sim[v + 3] = Math.min(4.5, 0.5 + speed * 5) * dt * 60
    i++
  }
}

function loop(now: number) {
  if (!running || !backend) return
  const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000))
  last = now
  const elapsed = (now - started) / 1000
  simTime += dt

  // the arrival: the medium fills over about 900 ms after the page has painted
  const boot = Math.min(1, elapsed / 1.05)
  const bootEase = 1 - Math.pow(1 - boot, 3)

  // pointer velocity decays so a flick leaves a wake, not a permanent jet
  for (const [id, p] of pointers) {
    p.vx *= Math.exp(-dt * 7)
    p.vy *= Math.exp(-dt * 7)
    if (now - p.t > 2600 && id !== -1) pointers.delete(id)
  }

  const first = pointers.values().next().value as PointerRec | undefined
  if (first && !reduced) {
    lensX.step(first.x, dt)
    lensY.step(first.y, dt)
    lensOn = Math.min(1, lensOn + dt * 2.6)
  } else {
    lensOn = Math.max(0, lensOn - dt * 2.2)
  }

  glass = Math.min(1, glass + dt * 1.25)
  // The DOM gradient is the headline's INK and it never leaves: it keeps the
  // letters as dark and as legible as the original's, it stays the LCP
  // element, and find-in-page still highlights something a visitor can see.
  // The glass letters light it from underneath, so the ink shimmers and
  // refracts without ever going pale.
  if (maskRect && bootEase > 0.85 && maskFade < 1) {
    maskFade = Math.min(1, maskFade + dt * 1.1)
    const o = String(1 - maskFade * (1 - INK_FLOOR))
    if (headEl) headEl.style.opacity = o
    if (subEl) subEl.style.opacity = o
  }

  uni[R.time] = simTime
  uni[R.boot] = bootEase
  uni[R.lensOn] = lensOn
  uni[R.maskFade] = maskFade
  uni[R.lens] = lensX.value * scale
  uni[R.lens + 1] = lensY.value * scale
  uni[R.reduced] = reduced ? 1 : 0
  uni[R.glass] = glass

  for (let i = 0; i < 3; i++) {
    const p = pulses[i]
    const o = R.pulses + i * 4
    if (!p || p.amp <= 0.002) {
      uni[o + 3] = 0
      continue
    }
    p.age += dt
    p.amp *= Math.exp(-dt * 2.6)
    uni[o] = p.x * scale
    uni[o + 1] = p.y * scale
    uni[o + 2] = p.age
    uni[o + 3] = p.amp
  }

  sim[S.grid] = backend.grid[0]
  sim[S.grid + 1] = backend.grid[1]
  sim[S.inv] = 1 / backend.grid[0]
  sim[S.inv + 1] = 1 / backend.grid[1]
  sim[S.dt] = dt
  sim[S.time] = simTime
  sim[S.boot] = bootEase
  sim[S.decay] = Math.exp(-dt * 0.3)
  sim[S.ambient] = reduced ? 0.022 : 0.055
  sim[S.grav] = grav.x
  sim[S.grav + 1] = grav.y
  writeSplats(dt)

  const live = pulses.find((p) => p && p.amp > 0.02 && p.age < 0.34)
  if (live && !reduced) {
    sim[S.pulse] = live.x / cssW
    sim[S.pulse + 1] = live.y / cssH
    sim[S.pulse + 2] = live.amp * 1.05
    sim[S.pulse + 3] = 0.075
  } else {
    sim[S.pulse + 2] = 0
  }

  backend.frame(uni, sim, phone ? 8 : 14)
  readout.tick(dt)

  // reduced motion: the light arrives, settles, and then holds still
  if (reduced && elapsed > 2.1) {
    running = false
    readout.still('still · reduced motion')
    return
  }
  requestAnimationFrame(loop)
}

function play() {
  if (running || !backend || !visible || !onScreen) return
  running = true
  last = performance.now()
  if (!started) started = last
  html.classList.remove('fx-idle')
  requestAnimationFrame(loop)
}
function pause() {
  running = false
  html.classList.add('fx-idle')
}

/* ---------------- input: the hand in the light --------------------------- */
function track(e: PointerEvent) {
  const id = e.pointerType === 'mouse' ? -1 : e.pointerId
  const p = pointers.get(id)
  const now = performance.now()
  if (!p) {
    pointers.set(id, { x: e.clientX, y: e.clientY, px: e.clientX, py: e.clientY, vx: 0, vy: 0, t: now })
    if (id === -1) {
      lensX.value = e.clientX
      lensY.value = e.clientY
    }
    return
  }
  const dt = Math.max(0.008, (now - p.t) / 1000)
  p.vx = p.vx * 0.55 + ((e.clientX - p.x) / dt / 1000) * 0.45
  p.vy = p.vy * 0.55 + ((e.clientY - p.y) / dt / 1000) * 0.45
  p.px = p.x
  p.py = p.y
  p.x = e.clientX
  p.y = e.clientY
  p.t = now
  html.classList.add('fx-touched')
}

function pulseAt(x: number, y: number) {
  const slot = pulses.findIndex((p) => !p || p.amp <= 0.05)
  const rec = { x, y, age: 0, amp: 1 }
  if (slot === -1) pulses[0] = rec
  else pulses[slot] = rec
  html.classList.add('fx-touched')
}

function bindInput() {
  addEventListener('pointermove', track, { passive: true })
  addEventListener('pointerdown', (e) => {
    track(e)
    pulseAt(e.clientX, e.clientY)
  })
  addEventListener('pointerup', (e) => {
    if (e.pointerType !== 'mouse') pointers.delete(e.pointerId)
  })
  addEventListener('pointercancel', (e) => pointers.delete(e.pointerId))
  addEventListener('pointerleave', () => pointers.delete(-1))
  // keyboard is not left out: Enter on the hero sends a pulse from the centre
  addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.target === document.body || e.target === document.documentElement)) {
      pulseAt(cssW * 0.5, cssH * 0.45)
    }
  })
}

/* device tilt: only ever after an explicit tap on the tilt control */
function bindTilt() {
  const btn = document.getElementById('tilt') as HTMLButtonElement | null
  if (!btn) return
  let on = false
  const handler = (e: DeviceOrientationEvent) => {
    const g = (e.gamma ?? 0) / 90
    const b = ((e.beta ?? 0) - 40) / 90
    grav.x = Math.max(-1, Math.min(1, g)) * 0.34
    grav.y = Math.max(-1, Math.min(1, b)) * 0.34
  }
  btn.addEventListener('click', async () => {
    if (on) {
      removeEventListener('deviceorientation', handler)
      grav.x = grav.y = 0
      on = false
      btn.textContent = 'tilt: off'
      return
    }
    const D = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> } | undefined
    try {
      if (D?.requestPermission) {
        const res = await D.requestPermission()
        if (res !== 'granted') {
          btn.textContent = 'tilt: denied'
          return
        }
      }
    } catch {
      btn.textContent = 'tilt: unavailable'
      return
    }
    addEventListener('deviceorientation', handler)
    on = true
    btn.textContent = 'tilt: on'
  })
}

/**
 * If the GPU context is taken away (tab backgrounded on a laptop switching
 * cards, a driver reset), the page falls back to the still CSS field and the
 * DOM headline takes its ink back. Nothing disappears.
 */
function onGpuLost() {
  running = false
  // the still CSS composition comes back with fx-canvas removed
  html.classList.remove('fx-canvas', 'fx-glass')
  if (headEl) headEl.style.opacity = ''
  if (subEl) subEl.style.opacity = ''
  readout.still('gpu context lost · static field')
}

/* ---------------- boot the GPU after the page has painted ---------------- */
async function ignite() {
  canvas = document.createElement('canvas')
  canvas.id = 'lumen-fx'
  canvas.setAttribute('aria-hidden', 'true')
  document.body.insertBefore(canvas, document.body.firstChild)

  viewport()
  const aspect = cssW / cssH
  const [gw, gh] = simGrid(aspect, phone ? 30000 : 140000)

  // ?fx=webgl / ?fx=css force a lower tier, so every tier can be checked on
  // hardware that supports them all
  const forced = new URLSearchParams(location.search).get('fx')
  if (forced !== 'webgl' && forced !== 'css') backend = await createGpuBackend(canvas, gw, gh, onGpuLost)
  if (!backend && forced !== 'css') backend = createGlBackend(canvas, gw, gh, onGpuLost)
  if (!backend) {
    // CSS tier: the still gradient field stays, the page is already designed
    canvas.remove()
    canvas = null
    html.classList.add('fx-live')
    readout.setTier('css', 'no gpu context', [0, 0])
    readout.still('static field')
    return
  }

  layout()
  // fx-canvas, not fx-live: it is what tells the still CSS field to step aside,
  // and only a real canvas has earned that
  html.classList.add('fx-live', 'fx-canvas')
  readout.setTier(backend.tier, backend.info.toLowerCase(), backend.grid)

  await fontsReady
  // rasterising the headline mask is real CPU work; hand the main thread back
  // first so it never joins the pipeline build into one long task
  await yieldToMain()
  rebuildMask()
  layout()
  html.classList.add('fx-glass')

  bindInput()
  if (coarse) bindTilt()
  play()

  let t = 0
  addEventListener(
    'resize',
    () => {
      clearTimeout(t)
      t = window.setTimeout(() => {
        layout()
        rebuildMask()
        layout()
      }, 180)
    },
    { passive: true },
  )

  // if the display face lands late, re-cut the mask so the glass letters and
  // the DOM text never disagree
  if (document.fonts) {
    document.fonts.addEventListener('loadingdone', () => {
      rebuildMask()
      layout()
    })
  }

  document.addEventListener('visibilitychange', () => {
    visible = !document.hidden
    if (visible) play()
    else pause()
  })

  const hero = document.querySelector('.stage')
  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(
      (entries) => {
        onScreen = entries[0].isIntersecting
        if (onScreen) play()
        else pause()
      },
      { threshold: 0 },
    ).observe(hero)
  }

  // a small, honest handle for measuring the real frame rate
  ;(window as unknown as { __lumen: unknown }).__lumen = {
    get fps() {
      return readout.frameRate
    },
    tier: backend.tier,
    grid: backend.grid,
    info: backend.info,
    push(x: number, y: number) {
      track({ clientX: x, clientY: y, pointerType: 'mouse', pointerId: 1 } as PointerEvent)
    },
    pulse: pulseAt,
  }
}

/** Breaks a long stretch of setup into separate tasks (Chrome/Firefox get scheduler.yield). */
function yieldToMain(): Promise<void> {
  const s = (window as unknown as { scheduler?: { yield?: () => Promise<void> } }).scheduler
  if (s?.yield) return s.yield()
  return new Promise((r) => setTimeout(r, 0))
}

function afterPaint() {
  const idle = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: object) => void }).requestIdleCallback
  const go = () => void ignite()
  if (idle) idle(go, { timeout: 900 })
  else setTimeout(go, 200)
}

if (document.readyState === 'complete') afterPaint()
else addEventListener('load', afterPaint, { once: true })
