/**
 * DECK — Felix Noriel's hero as a spatial control deck.
 *
 * Order of operations, and why:
 *   1. The HTML has already painted. Nothing in this module is allowed to move
 *      a single character of it — every visual it adds is a transform, an
 *      opacity, or pixels in a fixed canvas that sits behind the text.
 *   2. The power-on runs on the DOM alone (edges, terminal, counters), so it
 *      finishes on time whether or not the GPU is ready.
 *   3. The field starts when the browser is idle, picks WebGPU, then WebGL2,
 *      then gives up and leaves the CSS glass in place.
 *   4. One rAF loop does everything after that: springs, four transforms, one
 *      uniform buffer write, one draw. No layout is read or written in it.
 */

import { startTelemetry } from './telemetry'
import { DeckTerminal } from './terminal'
import { mountPalette } from './palette'
import { createWebGL2, type Backend } from './gl'
import { createWebGPU } from './gpu'
import {
  clearPane,
  FLOAT_COUNT,
  writeGlobals,
  writePane,
  type PaneUniform,
} from './uniforms'
import {
  ident,
  matrix3dString,
  pageBox,
  paneMatrix,
  projectQuad,
  Spring,
  toLocal,
  updateInverse,
  type Camera,
  type PaneModel,
} from './panes'

const html = document.documentElement
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const coarse = window.matchMedia('(pointer: coarse)').matches
let phone = window.matchMedia('(max-width: 900px)').matches

/* ------------------------------------------------------------------ colour */

function readColor(name: string, fallback: [number, number, number]): [number, number, number] {
  const v = getComputedStyle(html).getPropertyValue(name).trim()
  const m = /^#([0-9a-f]{6})$/i.exec(v)
  if (!m) return fallback
  const n = parseInt(m[1], 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}
const LIME = readColor('--lime', [0.718, 0.886, 0.353])
const ELECTRIC = readColor('--electric', [0.353, 0.58, 0.965])
const MAGENTA = readColor('--magenta', [0.929, 0.353, 0.686])
const INDIGO = readColor('--indigo', [0.561, 0.478, 0.831])

/* ------------------------------------------------------------------- panes */

interface Spec {
  key: string
  color: [number, number, number]
  z: number
  rx: number
  ry: number
  glass: number
  shaft: number
  radius: number
  /** how hard this pane's edge burns at rest — the identity plate leads */
  gain: number
  /** how far it comes toward you when grabbed */
  pull: number
  bootDelay: number
}
const SPECS: Spec[] = [
  // back to front — the shader composites glass in this order
  { key: 'keys', color: INDIGO, z: -132, rx: 30, ry: 0, glass: 0.52, shaft: 0, radius: 22, gain: 0.26, pull: 130, bootDelay: 470 },
  { key: 'impact', color: MAGENTA, z: -112, rx: 0, ry: -3.6, glass: 1, shaft: 0, radius: 24, gain: 0.30, pull: 150, bootDelay: 340 },
  { key: 'term', color: ELECTRIC, z: -104, rx: 0, ry: 3.6, glass: 1, shaft: 0, radius: 14, gain: 0.80, pull: 150, bootDelay: 210 },
  { key: 'id', color: LIME, z: 0, rx: 0, ry: 0, glass: 1, shaft: 0.95, radius: 16, gain: 0.92, pull: 104, bootDelay: 80 },
]

const panes: PaneModel[] = []
for (const s of SPECS) {
  const el = document.querySelector<HTMLElement>(`[data-pane="${s.key}"]`)
  if (!el) continue
  panes.push({
    el,
    key: s.key,
    color: s.color,
    baseZ: s.z,
    baseRx: phone ? s.rx * 0.62 : s.rx,
    baseRy: phone ? 0 : s.ry,
    glass: s.glass,
    shaft: s.shaft,
    radius: s.radius,
    px: 0,
    py: 0,
    w: 1,
    h: 1,
    z: new Spring(0),
    rx: new Spring(0),
    ry: new Spring(0),
    dx: new Spring(0),
    dy: new Spring(0),
    lit: new Spring(0, 90, 15),
    held: false,
    hover: false,
    grabX: 0,
    grabY: 0,
    quad: new Float64Array(8),
    inv: new Float32Array(9),
  })
}

const keysWrap = document.querySelector<HTMLElement>('.keys-wrap')
const stage = document.getElementById('stage')
const hintEl = document.querySelector<HTMLElement>('.hint')
let hintOff = false

function measure() {
  phone = window.matchMedia('(max-width: 900px)').matches
  for (const p of panes) {
    const b = pageBox(p.el)
    p.px = b.x
    p.py = b.y
    p.w = b.w
    p.h = b.h
    const spec = SPECS.find((s) => s.key === p.key)!
    p.baseRx = phone ? spec.rx * 0.62 : spec.rx
    p.baseRy = phone ? 0 : spec.ry
    p.baseZ = phone ? spec.z * 0.5 : spec.z
  }
}
measure()

/* --------------------------------------------------------------- telemetry */

const tele = startTelemetry()
const term = new DeckTerminal(document.getElementById('term') as HTMLElement)
const palette = mountPalette(term)
void palette

/* ------------------------------------------------------------- power-on */

const counters = Array.from(document.querySelectorAll<HTMLElement>('.mv'))

function countUp(el: HTMLElement, delay: number) {
  const to = Number(el.dataset.to || '0')
  const dp = Number(el.dataset.dp || '0')
  const suffix = el.dataset.suffix || ''
  const dur = 760
  el.style.opacity = '0'
  const t0 = performance.now() + delay
  const step = () => {
    const now = performance.now()
    if (now < t0) {
      requestAnimationFrame(step)
      return
    }
    const t = Math.min((now - t0) / dur, 1)
    const e = 1 - Math.pow(1 - t, 4)
    el.style.opacity = String(Math.min(1, t * 3))
    el.textContent = (to * e).toFixed(dp) + suffix
    if (t < 1) requestAnimationFrame(step)
    else {
      el.textContent = el.dataset.final || to.toFixed(dp) + suffix
      el.style.opacity = '1'
    }
  }
  requestAnimationFrame(step)
}

/** how long the whole power-on takes; after this every light is simply on */
const BOOT_MS = 1400
let bootStart = 0
let booting = false
let bootDone = false
let quietBoot = false

function powerOn() {
  if (booting) return
  booting = true
  bootStart = performance.now()
  const quiet = reduced || html.classList.contains('fx-quiet')
  quietBoot = quiet
  html.classList.remove('fx-boot')
  html.classList.add('fx-on')
  // one frame later, so the headline's first paint is opaque text (and can be
  // the LCP) before it dissolves into the gradient
  requestAnimationFrame(() => requestAnimationFrame(() => html.classList.add('fx-ramp')))
  try {
    sessionStorage.setItem('deck.booted', '1')
  } catch {
    /* private mode is fine */
  }
  term.boot(quiet)
  counters.forEach((el, i) => {
    el.dataset.final = el.textContent || ''
    if (quiet) {
      el.style.opacity = '1'
      return
    }
    countUp(el, 380 + i * 70)
  })
  if (quiet) {
    for (const p of panes) {
      p.z.set(p.baseZ)
      p.lit.set(1)
    }
    // one more still frame once the fonts have settled the boxes
    setTimeout(() => {
      measure()
      dirty = true
    }, 500)
  }
}

/* -------------------------------------------------------------- the field */

const canvas = document.getElementById('fx') as HTMLCanvasElement
const data = new Float32Array(FLOAT_COUNT)
let backend: Backend | null = null
let scale = 1
let targetScale = 1
let cssW = 0
let cssH = 0

function sizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  // the canvas element's own box is the shader's coordinate space; on phones it
  // is NOT window.innerWidth (visual viewport / scrollbar), and a mismatch
  // shears every pane's glass away from its text
  cssW = canvas.clientWidth || window.innerWidth
  cssH = canvas.clientHeight || window.innerHeight
  const base = phone ? 0.62 : 0.82
  scale = Math.max(0.36, Math.min(dpr, 1.6) * base * targetScale)
  const w = Math.max(2, Math.round(cssW * scale))
  const h = Math.max(2, Math.round(cssH * scale))
  backend?.resize(w, h)
}

if ('ResizeObserver' in window) {
  new ResizeObserver(() => {
    sizeCanvas()
    dirty = true
  }).observe(canvas)

  // Panes reflow when the web font swaps in. If the cached boxes went stale the
  // shader would draw every pane's glass in the wrong place, so re-measure from
  // the elements themselves rather than trusting one reading at startup.
  let pending = 0
  const ro = new ResizeObserver(() => {
    if (pending) return
    pending = requestAnimationFrame(() => {
      pending = 0
      measure()
      dirty = true
    })
  })
  for (const p of panes) ro.observe(p.el)
}
try {
  document.fonts?.ready.then(() => {
    measure()
    dirty = true
  })
} catch {
  /* no font loading API is fine */
}

async function startField() {
  if (backend) return
  let b: Backend | null = null
  try {
    b = await createWebGPU(canvas)
  } catch {
    b = null
  }
  if (!b) {
    try {
      b = createWebGL2(canvas)
    } catch {
      b = null
    }
  }
  if (!b) {
    tele.setRenderer('css fallback')
    html.classList.add('fx-css')
    return
  }
  backend = b
  tele.setRenderer(b.kind === 'webgpu' ? 'webgpu · ' + b.renderer : 'webgl2 · ' + b.renderer)
  sizeCanvas()
  dirty = true
}

/* ------------------------------------------------------------ interaction */

const cam: Camera = { d: 1500, tiltX: 0, tiltY: 0, z: 0, ox: 0, oy: 0 }
const tiltXs = new Spring(0, 58, 13)
const tiltYs = new Spring(0, 58, 13)
let wantTiltX = 0
let wantTiltY = 0
let gyroX = 0
let gyroY = 0

let ptrX = -9999
let ptrY = -9999
let ptrOn = 0
let held: PaneModel | null = null
let hovered: PaneModel | null = null
let dirty = true
let holdTimer = 0
let downX = 0
let downY = 0
let pendingTouch: PaneModel | null = null

const M = ident()
const local: [number, number] = [0, 0]
/** pane indices, back to front — re-sorted every frame as panes lift */
const order = panes.map((_, i) => i)

function paneAt(x: number, y: number): PaneModel | null {
  for (let k = order.length - 1; k >= 0; k--) {
    const p = panes[order[k]]
    toLocal(p, x, y, local)
    if (Math.abs(local[0]) <= p.w / 2 && Math.abs(local[1]) <= p.h / 2) return p
  }
  return null
}

function isInteractive(t: EventTarget | null) {
  const el = t as HTMLElement | null
  return !!el?.closest?.('a, button, input, textarea, select, [contenteditable]')
}

function onMove(e: PointerEvent) {
  ptrX = e.clientX
  ptrY = e.clientY
  ptrOn = 1
  if (!coarse) {
    wantTiltX = -((ptrY / Math.max(cssH, 1)) - 0.5) * 3.2
    wantTiltY = ((ptrX / Math.max(cssW, 1)) - 0.5) * 5.0
  }
  if (pendingTouch && Math.hypot(e.clientX - downX, e.clientY - downY) > 12) {
    clearTimeout(holdTimer)
    pendingTouch = null
  }
  dirty = true
}

function beginGrab(p: PaneModel, x: number, y: number) {
  held = p
  p.held = true
  p.grabX = x
  p.grabY = y
  html.classList.add('grabbing')
  p.el.classList.add('held')
  const hot = p.el.dataset.hot
  if (hot) p.el.style.setProperty('--hot', hot)
  const verb = document.getElementById('hint-verb')
  if (verb) verb.textContent = 'let go'
  dirty = true
}

function endGrab() {
  if (!held) return
  held.held = false
  held.el.classList.remove('held')
  held = null
  html.classList.remove('grabbing')
  const verb = document.getElementById('hint-verb')
  if (verb) verb.textContent = coarse ? 'press and hold a pane' : 'drag a pane'
  dirty = true
}

function onDown(e: PointerEvent) {
  if (e.button !== undefined && e.button !== 0) return
  const p = paneAt(e.clientX, e.clientY)
  if (!p) return
  downX = e.clientX
  downY = e.clientY
  ptrX = e.clientX
  ptrY = e.clientY
  ptrOn = 1
  if (e.pointerType === 'touch') {
    // never fight the scroller: a lift only happens on a real press-and-hold
    pendingTouch = p
    clearTimeout(holdTimer)
    holdTimer = window.setTimeout(() => {
      if (pendingTouch === p) {
        beginGrab(p, downX, downY)
        pendingTouch = null
      }
    }, 210)
    return
  }
  if (!isInteractive(e.target)) e.preventDefault()
  try {
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  } catch {
    /* capture is a nicety */
  }
  beginGrab(p, e.clientX, e.clientY)
}

function onUp() {
  clearTimeout(holdTimer)
  pendingTouch = null
  endGrab()
}

window.addEventListener('pointermove', onMove, { passive: true })
window.addEventListener('pointerdown', onDown)
window.addEventListener('pointerup', onUp)
window.addEventListener('pointercancel', onUp)
window.addEventListener('blur', onUp)
window.addEventListener('pointerleave', () => {
  ptrOn = 0
  wantTiltX = 0
  wantTiltY = 0
  dirty = true
})

/* keys on the bed read out their own record */
const keybed = document.getElementById('keybed')
let keyHot = 0
keybed?.addEventListener('pointerover', (e) => {
  const chip = (e.target as HTMLElement).closest<HTMLElement>('.chip')
  if (!chip || !chip.dataset.tech) return
  keyHot = 1
  dirty = true
  term.probe(chip.dataset.tech, chip.dataset.rec || '')
})
keybed?.addEventListener('pointerleave', () => {
  keyHot = 0
  dirty = true
})
keybed?.addEventListener('focusin', (e) => {
  const chip = (e.target as HTMLElement).closest<HTMLElement>('.chip')
  if (chip?.dataset.tech) term.probe(chip.dataset.tech, chip.dataset.rec || '')
})
keybed?.querySelectorAll<HTMLElement>('.chip').forEach((c, i) => {
  c.style.setProperty('--sd', 410 + i * 17 + 'ms')
  if (c.dataset.tech && c.dataset.rec) c.setAttribute('aria-label', `${c.dataset.tech} — ${c.dataset.rec}`)
  c.addEventListener('click', () => term.probe(c.dataset.tech!, c.dataset.rec || ''))
})

/* the phone's gyroscope, only ever after an explicit tap */
const tiltBtn = document.getElementById('tilt')
let gyroOn = false
tiltBtn?.addEventListener('click', async () => {
  if (gyroOn) {
    gyroOn = false
    gyroX = 0
    gyroY = 0
    tiltBtn.textContent = 'tilt'
    return
  }
  const DOE = (window as unknown as { DeviceOrientationEvent?: { requestPermission?: () => Promise<string> } })
    .DeviceOrientationEvent
  try {
    if (DOE?.requestPermission) {
      const r = await DOE.requestPermission()
      if (r !== 'granted') {
        tiltBtn.textContent = 'no tilt'
        return
      }
    }
  } catch {
    tiltBtn.textContent = 'no tilt'
    return
  }
  gyroOn = true
  tiltBtn.textContent = 'tilt on'
  window.addEventListener('deviceorientation', (ev) => {
    if (!gyroOn) return
    const g = ev.gamma ?? 0
    const b = ev.beta ?? 0
    gyroY = Math.max(-7, Math.min(7, g * 0.16))
    gyroX = Math.max(-5, Math.min(5, (b - 45) * -0.09))
    dirty = true
  })
})

/* --------------------------------------------------------------- the loop */

let last = performance.now()
let liveAt = 0
let running = false
let frames = 0
let ema = 16
let adapted = 0
const uni: PaneUniform = {
  inv: new Float32Array(9),
  halfW: 0,
  halfH: 0,
  radius: 0,
  color: [0, 0, 0],
  lit: 0,
  centerX: 0,
  centerY: 0,
  lift: 0,
  glass: 0,
  shaft: 0,
  ptrX: 0,
  ptrY: 0,
  ptrOn: 0,
}

function frame(now: number) {
  if (!running) return
  requestAnimationFrame(frame)
  const dt = Math.min((now - last) / 1000, 0.05)
  last = now
  frames++

  if (reduced && !dirty && frames > 3) return
  dirty = false

  const ms = dt * 1000
  ema += (ms - ema) * 0.1
  tele.frame(ms)

  const scrollY = window.scrollY
  cam.ox = cssW * 0.5
  cam.oy = cssH * 0.40
  cam.d = phone ? 1060 : 1320
  cam.z = -Math.min(scrollY, cssH * 1.2) * 0.55

  const t = (now - (bootStart || now)) / 1000
  // reduced motion gets the finished frame, not a frozen mid-power-on one
  const bootMs = booting ? (reduced ? BOOT_MS : now - bootStart) : 0
  if (booting && !bootDone && bootMs >= BOOT_MS) bootDone = true

  // The hint belongs to the rest state. The camera slides the deck under it as
  // you scroll, so it leaves rather than printing on top of the keys.
  const wantHintOff = scrollY > 80
  if (wantHintOff !== hintOff) {
    hintOff = wantHintOff
    hintEl?.classList.toggle('gone', wantHintOff)
  }

  if (reduced) {
    tiltXs.set(wantTiltX + gyroX)
    tiltYs.set(wantTiltY + gyroY)
  } else {
    tiltXs.step(wantTiltX + gyroX, dt)
    tiltYs.step(wantTiltY + gyroY, dt)
  }
  // the camera sits a touch above the deck at rest, so it reads as a surface
  cam.tiltX = tiltXs.x - (phone ? 1.4 : 2.4)
  cam.tiltY = tiltYs.x

  hovered = ptrOn ? paneAt(ptrX, ptrY) : null

  // The last beat of the power-on: the terminal pane lifts once and settles.
  // It is the deck telling you the panes are objects you can pick up — one
  // gesture, transform only, never on a repeat visit or under reduced motion.
  const demoT = (bootMs - 1250) / 820
  const demo =
    !reduced && !quietBoot && !held && demoT > 0 && demoT < 1
      ? Math.sin(demoT * Math.PI)
      : 0

  order.sort((a, b) => panes[a].z.x - panes[b].z.x)

  let anyLit = false
  for (let k = 0; k < order.length; k++) {
    const i = order[k]
    const p = panes[i]
    const spec = SPECS[i]
    const grabbed = p.held
    const hot = hovered === p

    const pw = bootDone
      ? 1
      : booting
        ? Math.max(0, Math.min(1, (bootMs - spec.bootDelay) / 420))
        : 0
    let tz = p.baseZ
    let trx = 0
    let tryy = 0
    let tdx = 0
    let tdy = 0
    let tlit = pw * spec.gain * (p.key === 'keys' ? 1 + keyHot * 0.55 : 1)

    const pull = phone ? spec.pull * 0.62 : spec.pull
    if (grabbed) {
      toLocal(p, ptrX, ptrY, local)
      tz = p.baseZ + pull
      tryy = Math.max(-11, Math.min(11, (local[0] / (p.w / 2)) * 11))
      trx = Math.max(-9, Math.min(9, -(local[1] / (p.h / 2)) * 9))
      // it follows your hand with mass, but never leaves the room: the ceiling
      // accounts for how much coming forward will make the pane grow
      const grow = cam.d / Math.max(cam.d - (p.baseZ + pull), 1)
      const ceil = 54 + (p.h / 2) * grow - (p.py + p.h / 2 - scrollY)
      tdx = Math.max(-230, Math.min(230, (ptrX - p.grabX) * 0.40))
      tdy = Math.max(ceil, Math.min(210, (ptrY - p.grabY) * 0.40))
      tlit = 2.5 * pw
    } else if (demo > 0.001 && p.key === 'term' && !hot) {
      tz = p.baseZ + pull * 0.40 * demo
      trx = -2.1 * demo
      tryy = 1.6 * demo
      tlit = pw * spec.gain * (1 + demo * 1.15)
    } else if (hot && !held) {
      toLocal(p, ptrX, ptrY, local)
      tz = p.baseZ + 26
      tryy = Math.max(-3.2, Math.min(3.2, (local[0] / (p.w / 2)) * 3.2))
      trx = Math.max(-2.4, Math.min(2.4, -(local[1] / (p.h / 2)) * 2.4))
      tlit = 1.45 * pw * spec.gain
    }

    if (reduced) {
      p.z.set(tz)
      p.rx.set(trx)
      p.ry.set(tryy)
      p.dx.set(tdx)
      p.dy.set(tdy)
      p.lit.set(tlit)
    } else {
      p.z.step(tz, dt)
      p.rx.step(trx, dt)
      p.ry.step(tryy, dt)
      p.dx.step(tdx, dt)
      p.dy.step(tdy, dt)
      p.lit.step(tlit, dt)
    }

    paneMatrix(p, cam, scrollY, M)
    p.el.style.transform = matrix3dString(M)
    projectQuad(p, M, scrollY)
    const ok = updateInverse(p)

    const top = Math.min(p.quad[1], p.quad[3], p.quad[5], p.quad[7])
    const bot = Math.max(p.quad[1], p.quad[3], p.quad[5], p.quad[7])
    const onScreen = ok && bot > -160 && top < cssH + 160

    if (!onScreen) {
      clearPane(data, k)
      continue
    }
    anyLit = true

    uni.inv.set(p.inv)
    uni.halfW = p.w / 2
    uni.halfH = p.h / 2
    uni.radius = p.radius
    uni.color = p.color
    uni.lit = p.lit.x
    uni.centerX = (p.quad[0] + p.quad[2] + p.quad[4] + p.quad[6]) / 4
    uni.centerY = (p.quad[1] + p.quad[3] + p.quad[5] + p.quad[7]) / 4
    uni.lift = Math.max(0, (p.z.x - p.baseZ) / pull)
    uni.glass = p.glass
    uni.shaft = p.shaft * Math.min(1, p.lit.x)
    if (hot || grabbed) {
      toLocal(p, ptrX, ptrY, local)
      uni.ptrX = local[0]
      uni.ptrY = local[1]
      uni.ptrOn = 1
    } else {
      uni.ptrX = 0
      uni.ptrY = 0
      uni.ptrOn = 0
    }
    writePane(data, k, uni)
  }
  for (let k = order.length; k < 6; k++) clearPane(data, k)

  if (backend) {
    const power = bootDone ? 1 : booting ? Math.min(1, bootMs / 900) : 0
    // the scan starts when the field itself lights up, so it is always seen
    const sweepMs = liveAt ? now - liveAt : 0
    const sweep = !reduced && liveAt && sweepMs < 980 ? (sweepMs / 980) * 1.34 - 0.17 : -1
    writeGlobals(
      data,
      cssW,
      cssH,
      reduced ? 6 : t,
      power,
      sweep,
      0,
      0,
      phone || !anyLit ? 0 : 1,
      scrollY,
      cam.z,
      // the room thins out as the camera pulls back off the deck
      1 - Math.min(scrollY / Math.max(cssH * 1.1, 1), 1) * 0.5,
      scale,
    )
    backend.draw(data)
    if (!liveAt) {
      liveAt = now
      html.classList.add('fx-live')
    }
  }

  // adaptive quality: two steps down, never up, and only after it settles
  if (!reduced && frames > 90 && adapted < 2 && ema > 21) {
    adapted++
    targetScale *= 0.78
    sizeCanvas()
    frames = 0
    ema = 16
  }
}

// a debug handle for the verification harness; costs one property
;(window as unknown as { __deck?: unknown }).__deck = { panes, cam, get scale() { return scale }, get css() { return [cssW, cssH] } }

function start() {
  if (running) return
  running = true
  last = performance.now()
  requestAnimationFrame(frame)
}
function stop() {
  running = false
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) stop()
  else {
    dirty = true
    start()
  }
})

let resizeT = 0
window.addEventListener('resize', () => {
  clearTimeout(resizeT)
  resizeT = window.setTimeout(() => {
    measure()
    sizeCanvas()
    dirty = true
  }, 120)
})
window.addEventListener('scroll', () => {
  dirty = true
}, { passive: true })

/* ----------------------------------------------------------------- ignite */

cssW = window.innerWidth
cssH = window.innerHeight
if (coarse) {
  const verb = document.getElementById('hint-verb')
  if (verb) verb.textContent = 'press and hold a pane'
  const kbd = document.querySelector<HTMLElement>('#kbd-k kbd')
  if (kbd) kbd.textContent = 'tap'
}
if (keysWrap) keysWrap.style.perspective = 'none'

// The DOM power-on does not wait for `load`: it costs nothing and holding it
// back pushes the largest text paint late on a slow phone.
function ignite() {
  measure()
  sizeCanvas()
  powerOn()
  start()
}
requestAnimationFrame(() => requestAnimationFrame(ignite))

// The GPU field is the heavy part, so it waits for a quiet moment after load.
function litField() {
  const idle =
    (window as unknown as { requestIdleCallback?: (cb: () => void, o?: object) => number })
      .requestIdleCallback || ((cb: () => void) => setTimeout(cb, 1))
  idle(
    () => {
      void startField()
    },
    { timeout: 900 },
  )
}
if (document.readyState === 'complete') litField()
else window.addEventListener('load', litField, { once: true })

/* the shell needs to know a pane is grabbable */
stage?.addEventListener('pointermove', () => {
  const c = held ? 'grabbing' : hovered ? 'grab' : ''
  if (stage.style.cursor !== c) stage.style.cursor = c
})
