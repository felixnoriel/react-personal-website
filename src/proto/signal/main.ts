/**
 * SIGNAL — orchestration.
 *
 * Order of operations, and the reason for it:
 *   1. The HTML has already painted. Nothing here runs before that.
 *   2. After `load` (or ~1 idle slice), build the four morph target sets in
 *      12k-particle slices so no single task ever passes ~10 ms.
 *   3. Pick a tier (WebGPU compute → WebGL2 analytic → CSS), ignite, and
 *      hand the rAF loop over to the GPU. From then on the main thread
 *      writes 256 bytes of uniforms per frame and nothing else.
 *   4. Everything the telemetry rail prints is measured, never invented.
 */

import { METRICS, CITIES, TECH, ROLES } from '../shared/content'
import { createShapeBuild } from './shapes'
import { createGpuCore } from './gpu'
import { createGlCore } from './gl'
import type { CoreHandle, Frame, RGB } from './types'

const root = document.documentElement
const canvas = document.getElementById('core') as HTMLCanvasElement | null
const railEl = document.getElementById('rail')
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
const coarse = matchMedia('(pointer: coarse)').matches
const phone = matchMedia('(max-width: 860px)').matches

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a || 1e-6), 0, 1)
  return t * t * (3 - 2 * t)
}
const mix = (a: number, b: number, t: number) => a + (b - a) * t

/* ---------------------------------------------------------------- palette */

/** "H S% L%" token → LINEAR rgb, because the shader does real light maths */
function token(name: string, fallback: RGB): RGB {
  const raw = getComputedStyle(root).getPropertyValue(name).trim()
  const m = raw.match(/([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/)
  if (!m) return fallback
  const h = parseFloat(m[1])
  const s = parseFloat(m[2]) / 100
  const l = parseFloat(m[3]) / 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
  const rgb: RGB = [lin(f(0)), lin(f(8)), lin(f(4))]
  // normalise to equal peak energy: hue is the token's, strength is the
  // shader's job — otherwise the blue end of the ramp sinks into the ground
  const peak = Math.max(rgb[0], rgb[1], rgb[2]) || 1
  return [rgb[0] / peak, rgb[1] / peak, rgb[2] / peak]
}

/* ------------------------------------------------------------- telemetry */

const GLYPHS = '0123456789ABCDEF·/\\|'
function printCell(key: string, value: string, instant: boolean, hot = false) {
  const el = railEl?.querySelector<HTMLElement>(`[data-t="${key}"]`)
  if (!el) return
  el.classList.toggle('hot', hot)
  if (instant || reduced) {
    el.textContent = value
    return
  }
  let step = 0
  const total = 6
  const tick = () => {
    step++
    if (step >= total) {
      el.textContent = value
      return
    }
    let s = ''
    for (let i = 0; i < value.length; i++)
      s += i < (value.length * step) / total ? value[i] : GLYPHS[(Math.random() * GLYPHS.length) | 0]
    el.textContent = s
    setTimeout(tick, 34)
  }
  tick()
}

function navTiming() {
  const n = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
  return n ? Math.max(0, Math.round(n.responseStart)) : null
}
let fcpMs: number | null = null
try {
  const po = new PerformanceObserver((list) => {
    for (const e of list.getEntries()) if (e.name === 'first-contentful-paint') fcpMs = Math.round(e.startTime)
  })
  po.observe({ type: 'paint', buffered: true })
} catch {
  /* no paint timing here */
}

const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
const narrow = matchMedia('(max-width: 560px)').matches
const fmtBkk = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Bangkok',
  hour: '2-digit',
  minute: '2-digit',
  ...(narrow ? {} : { second: '2-digit' as const }),
  hour12: false,
})
const fmtLocal = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })

function startClock() {
  const el = document.getElementById('clock')
  const label = document.getElementById('clockLabel')
  const home = tz === 'Asia/Bangkok'
  if (label) label.textContent = home ? 'LOCAL' : 'BKK'
  const tick = () => {
    if (el) el.textContent = fmtBkk.format(new Date())
  }
  tick()
  setInterval(tick, 1000)
  return home
}

/* --------------------------------------------------------------- counters */

function countUp(el: HTMLElement, target: string, instant: boolean) {
  const m = target.match(/^([\d.]+)(.*)$/)
  if (!m || instant || reduced) {
    el.textContent = target
    return
  }
  const end = parseFloat(m[1])
  const suffix = m[2]
  const dec = (m[1].split('.')[1] || '').length
  const t0 = performance.now()
  const dur = 1150
  const step = (now: number) => {
    const p = clamp((now - t0) / dur, 0, 1)
    const e = 1 - Math.pow(1 - p, 4)
    el.textContent = (end * e).toFixed(dec) + suffix
    if (p < 1) requestAnimationFrame(step)
    else el.textContent = target
  }
  requestAnimationFrame(step)
}

/* ------------------------------------------------------------- chapter UI */

function fillTags() {
  const set = (id: string, items: readonly string[], highlight?: (s: string) => boolean) => {
    const ul = document.getElementById(id)
    if (!ul) return
    ul.replaceChildren(
      ...items.map((t) => {
        const li = document.createElement('li')
        li.textContent = t
        if (highlight?.(t)) li.className = 'on'
        return li
      }),
    )
  }
  set(
    'roles',
    ROLES.map((r) => r.company),
    (c) => c === 'Stable',
  )
  set('cities', CITIES, (c) => c === 'Bangkok')
  set('stack', TECH)
}

function revealOnScroll() {
  const items = Array.from(document.querySelectorAll<HTMLElement>('.rev'))
  if (reduced || !('IntersectionObserver' in window)) {
    items.forEach((i) => i.classList.add('in'))
    return
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries)
        if (e.isIntersecting) {
          e.target.classList.add('in')
          io.unobserve(e.target)
        }
    },
    { rootMargin: '0px 0px -12% 0px' },
  )
  items.forEach((i) => io.observe(i))
}

/* ------------------------------------------------------------------- boot */

const repeat = (() => {
  try {
    const seen = sessionStorage.getItem('signal.booted') === '1'
    sessionStorage.setItem('signal.booted', '1')
    return seen
  } catch {
    return false
  }
})()

function pickCount(): number {
  const cores = navigator.hardwareConcurrency || 4
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4
  if (phone || coarse) return cores >= 6 && mem >= 4 ? 96000 : 56000
  if (cores >= 8 && mem >= 8) return 320000
  if (cores >= 4) return 180000
  return 110000
}

function start() {
  startClock()
  fillTags()
  revealOnScroll()

  const ttfb = navTiming()

  if (!canvas) return
  let canvasRef: HTMLCanvasElement = canvas

  // ---- ignite the DOM side immediately; the GPU joins when it is ready
  root.dataset.ignite = repeat ? 'done' : 'run'
  // the four numbers come from content.ts, not from the markup
  const numbers = Array.from(document.querySelectorAll<HTMLElement>('[data-count]'))
  numbers.forEach((el, i) => {
    const v = METRICS[i]?.value
    if (v) el.dataset.count = v
  })
  const runCounters = () => numbers.forEach((el, i) => setTimeout(() => countUp(el, el.dataset.count!, repeat), i * 90))

  const font = getComputedStyle(document.body).fontFamily || 'sans-serif'
  const N = pickCount()
  const build = createShapeBuild(N, 1.0, font, phone ? 3.2 : 4.6)

  let core: CoreHandle | null = null
  let started = 0
  const waves: Frame['waves'] = [
    [0, 0, 0, -1],
    [0, 0, 0, -1],
    [0, 0, 0, -1],
    [0, 0, 0, -1],
  ]

  const idle: (cb: () => void) => void =
    'requestIdleCallback' in window
      ? (cb) => (window as Window & typeof globalThis).requestIdleCallback(() => cb(), { timeout: 400 })
      : (cb) => setTimeout(cb, 1)

  // Build the sculpture in slices so no task ever blocks a frame.
  const grind = () => {
    if (build.step(9)) {
      idle(boot)
      return
    }
    idle(grind)
  }

  async function boot() {
    const opts = {
      canvas: canvas!,
      count: N,
      shapes: build.data,
      palette: [
        token('--electric', [0.15, 0.3, 0.68]),
        token('--indigo', [0.24, 0.19, 0.55]),
        token('--magenta', [0.6, 0.15, 0.38]),
        token('--lime', [0.58, 0.69, 0.36]),
      ] as [RGB, RGB, RGB, RGB],
      exposure: 1.12,
      bloomThreshold: 0.5,
      bloomStrength: 1.15,
    }
    core = await createGpuCore(opts)
    if (!core) {
      // a refused WebGPU attempt can still have claimed the canvas — give the
      // WebGL2 tier a clean one rather than a dead context
      const fresh = canvas!.cloneNode(false) as HTMLCanvasElement
      canvas!.replaceWith(fresh)
      opts.canvas = fresh
      canvasRef = fresh
      core = createGlCore(opts)
    }
    if (!core) {
      root.dataset.fx = 'css'
      printCell('renderer', 'CSS (no GPU)', repeat)
      printCell('particles', '—', repeat)
      printCell('frame', '—', repeat)
      finishRail()
      runCounters()
      // the lowest tier still lights the headline — it just has no GPU behind it
      setTimeout(() => (root.dataset.ignite = 'done'), repeat ? 60 : 700)
      return
    }
    root.dataset.fx = 'live'
    resize()
    started = performance.now()
    ;(window as Window & { __signal?: unknown }).__signal = {
      tier: core.label,
      count: core.count,
      fps: 0,
      ms: 0,
      well: 0,
      drawn: core.count,
    }

    const cells: [string, string, boolean][] = [
      ['renderer', core.label, false],
      ['particles', fmtCount(core.count), false],
    ]
    cells.forEach(([k, v], i) => setTimeout(() => printCell(k, v, repeat), repeat ? 0 : 90 + i * 110))
    setTimeout(finishRail, repeat ? 0 : 320)
    setTimeout(runCounters, repeat ? 0 : 260)
    setTimeout(
      () => {
        root.dataset.ignite = 'done'
      },
      repeat ? 60 : 1250,
    )
    // the first frame after the build carries the whole setup gap: start the
    // clock here so the rail never prints a 700 ms "frame time"
    last = performance.now()
    times.length = 0
    fpsT = last
    requestAnimationFrame(loop)
  }

  /** what the draw call is actually laying down, in the rail's own words */
  const fmtCount = (v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))

  function finishRail() {
    printCell('ttfb', ttfb === null ? 'n/a' : `${ttfb}ms`, repeat)
    printCell('paint', fcpMs === null ? 'n/a' : `${fcpMs}ms`, repeat)
    printCell('local', `${fmtLocal.format(new Date())} · ${tz.split('/').pop()?.replace(/_/g, ' ')}`, repeat)
  }

  /* ------------------------------------------------------------ viewport */

  let vw = 0
  let vh = 0
  function resize() {
    const w = window.innerWidth
    const h = window.innerHeight
    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    const budget = phone ? 2.1e6 : 2.7e6
    if (w * h * dpr * dpr > budget) dpr = Math.sqrt(budget / (w * h))
    vw = Math.round(w * dpr)
    vh = Math.round(h * dpr)
    canvasRef.width = vw
    canvasRef.height = vh
    core?.resize(vw, vh)
  }
  let rt = 0
  addEventListener('resize', () => {
    clearTimeout(rt)
    rt = window.setTimeout(resize, 180)
  })

  /* ------------------------------------------------------------- pointer */

  let px = 0.35
  let py = 0
  let tx = 0.35
  let ty = 0
  let ptrStr = 0
  let ptrWant = 0
  let dragging = false
  let moved = false
  let lastX = 0
  let lastY = 0
  let yaw = 0
  let pitch = 0
  let yawV = 0
  let pitchV = 0

  const setPointer = (cx: number, cy: number) => {
    tx = (cx / window.innerWidth) * 2 - 1
    ty = 1 - (cy / window.innerHeight) * 2
    ptrWant = reduced ? 0 : 1
  }

  if (!reduced) {
    addEventListener(
      'pointermove',
      (e) => {
        setPointer(e.clientX, e.clientY)
        if (dragging) {
          yawV += (e.clientX - lastX) * 0.00042
          pitchV += (e.clientY - lastY) * 0.0003
          if (!moved && Math.abs(e.clientX - lastX) + Math.abs(e.clientY - lastY) > 3) {
            // a real drag, not a click: suppress selection for its duration
            moved = true
            root.dataset.drag = '1'
            getSelection()?.removeAllRanges()
          }
          lastX = e.clientX
          lastY = e.clientY
        }
      },
      { passive: true },
    )
    // pointerleave does NOT bubble, so a window listener only ever sees it in
    // the capture phase — and there it also sees every child element the
    // pointer crosses, which would blink the well off mid-sweep. Only the
    // outermost element leaving means the pointer really left the page.
    addEventListener(
      'pointerleave',
      (e) => {
        if (e.target === root || e.target === document.body || e.target === document) ptrWant = 0
      },
      true,
    )
    // A mouse press that lands ON the copy belongs to the reader: it selects
    // text as it always did. A press on the open ground belongs to the
    // sculpture, and THAT drag is the one that must not paint a selection
    // across the bio as it sweeps. A finger never selects on a swipe, so
    // touch can orbit from anywhere.
    // the elements that actually carry text, not the roomy boxes around them
    const READING = 'h1, h2, p, li, dt, dd, a, button, .note, .cap, .where, .pill, .rail-top, .rail-bot'
    addEventListener(
      'pointerdown',
      (e) => {
        const t = e.target as Element | null
        dragging = e.pointerType !== 'mouse' || !t?.closest?.(READING)
        moved = false
        lastX = e.clientX
        lastY = e.clientY
        setPointer(e.clientX, e.clientY)
        fire()
      },
      { passive: true },
    )
    // a finger that lifts is a pointer that left: touch and pen release the
    // well, a mouse keeps it because the cursor is still on the page
    const release = (e: PointerEvent) => {
      dragging = false
      moved = false
      delete root.dataset.drag
      if (e.pointerType !== 'mouse') ptrWant = 0
    }
    addEventListener('pointerup', release, { passive: true })
    addEventListener('pointercancel', release, { passive: true })
    // dragging the sculpture must not paint a text selection across the bio
    addEventListener('selectstart', (e) => {
      if (moved) e.preventDefault()
    })
    addEventListener('blur', () => {
      dragging = false
      moved = false
      delete root.dataset.drag
      ptrWant = 0
    })
  }

  /** a shockwave from wherever the gravity well currently is */
  let wellWorld: [number, number, number] = [0, 0, 0]
  function fire() {
    let slot = waves.findIndex((w) => w[3] < 0)
    if (slot < 0) slot = 0
    waves[slot] = [wellWorld[0], wellWorld[1], wellWorld[2], 0]
  }

  /* -------------------------------------------------------------- scroll */

  let scrollPos = 0
  let morph = 0
  addEventListener('scroll', () => (scrollPos = window.scrollY), { passive: true })

  /* --------------------------------------------------------- pause / loop */

  let paused = false
  addEventListener('visibilitychange', () => {
    paused = document.hidden
    if (!paused) {
      last = performance.now()
      requestAnimationFrame(loop)
    }
  })

  let last = performance.now()
  let spin = 0
  let flick = 0
  const times: number[] = []
  let active = N
  let shownCount = N
  let fpsT = 0

  function loop(now: number) {
    if (paused || !core) return
    requestAnimationFrame(loop)
    const dtRaw = (now - last) / 1000
    last = now
    const dt = clamp(dtRaw, 0.0005, 0.05)
    const t = (now - started) / 1000

    // ---- frame time telemetry + adaptive quality
    times.push(dtRaw * 1000)
    if (times.length > 90) times.shift()
    if (now - fpsT > 500) {
      const sorted = [...times].sort((a, b) => a - b)
      const med = sorted[sorted.length >> 1] || 16
      printCell('frame', `${med.toFixed(1)}ms`, true, med > 22)
      const w = window as Window & { __signal?: { fps: number; ms: number; well: number; drawn: number } }
      if (w.__signal) {
        w.__signal.fps = Math.round(1000 / Math.max(1, med))
        w.__signal.ms = Math.round(med * 100) / 100
        w.__signal.well = Math.round(ptrStr * 100) / 100
        w.__signal.drawn = active
      }
      if (times.length > 60) {
        if (med > 19.5 && active > N * 0.3) active = Math.max(Math.floor(N * 0.3), Math.floor(active * 0.78))
        else if (med < 14 && active < N) active = Math.min(N, Math.floor(active * 1.1) + 1000)
      }
      // the rail says what the draw call draws: on a phone that throttles,
      // the number goes DOWN and the rail says so
      if (Math.abs(active - shownCount) > N * 0.02) {
        shownCount = active
        printCell('particles', fmtCount(active), true)
      }
      fpsT = now
    }

    // ---- ignition ramp
    const ignRaw = repeat ? clamp(t / 0.35, 0, 1) : clamp(t / 0.95, 0, 1)
    const ign = reduced ? 1 : 1 - Math.pow(1 - ignRaw, 3)
    // how far the swarm has actually converged — brightness follows THIS,
    // so the wide rush-in cannot blow out the text it passes behind
    const settle = reduced || repeat ? 1 : smoothstep(0, 1, clamp(t / 1.85, 0, 1))

    // ---- the morph, driven by how far down the piece you are
    const s = scrollPos / Math.max(1, window.innerHeight)
    // pose 1 (the words) lands when chapter 1 fills the screen, and so on
    const want = s <= 0.42 ? 0 : s < 1 ? (s - 0.42) / 0.58 : Math.min(3, s)
    morph += (want - morph) * clamp(dt * 7, 0, 1)

    // near a whole number the sculpture is "posed" — slow down and flatten
    const nearest = Math.round(morph)
    const faceOn = nearest === 1 ? 1 - clamp(Math.abs(morph - 1) * 2.2, 0, 1) : 0

    // ---- camera
    const sway = reduced
      ? Math.sin(t * 0.02) * 0.12
      : Math.sin(t * 0.163) * 1.02 + Math.sin(t * 0.057) * 0.32
    spin = sway * (1 - 0.94 * faceOn)
    yaw += yawV
    pitch += pitchV
    yawV *= Math.pow(0.86, dt * 60)
    pitchV *= Math.pow(0.86, dt * 60)
    yaw *= Math.pow(0.992, dt * 60)
    pitch *= Math.pow(0.992, dt * 60)
    pitch = clamp(pitch, -0.5, 0.5)

    const ANCH_X = phone ? [-0.04, -0.02, 0.0, 0.0] : [0.2, 0.08, -0.3, 0.26]
    const ANCH_Y = phone ? [0.48, 0.26, 0.44, 0.72] : [0.06, 0.34, 0.0, -0.02]
    const mi = Math.min(3, Math.max(0, Math.floor(morph)))
    const mj = Math.min(3, mi + 1)
    const mf = smoothstep(0, 1, morph - mi)
    const globeOn = 1 - clamp(Math.abs(morph - 2) * 1.6, 0, 1)
    const stackOn = smoothstep(2.3, 3, morph)

    // ---- pointer easing (a light spring, so the well has weight)
    const k = clamp(dt * 6.5, 0, 1)
    px += (tx - px) * k
    py += (ty - py) * k
    ptrStr += (ptrWant - ptrStr) * clamp(dt * 3.4, 0, 1)

    for (const w of waves) if (w[3] >= 0) w[3] = w[3] > 1.5 ? -1 : w[3] + dt

    const fov = 0.72
    const dist =
      (phone ? 9.3 : 5.6) + faceOn * (phone ? 1.5 : 0.25) + globeOn * (phone ? 1.9 : 0.5) + stackOn * (phone ? 1.3 : 1.15)
    const tilt = (-0.5 + Math.sin(t * 0.109) * 0.13) * (1 - 0.9 * faceOn) + pitch
    const shiftX = mix(ANCH_X[mi], ANCH_X[mj], mf)
    const shiftY = mix(ANCH_Y[mi], ANCH_Y[mj], mf)

    // remember where the well is in sculpture space so a click can use it
    const aspect = vw / vh
    const fq = 1 / Math.tan(fov / 2)
    const wx = ((px - shiftX) * aspect * dist) / fq
    const wy = ((py - shiftY) * dist) / fq
    const cs = Math.cos(spin + yaw)
    const ss = Math.sin(spin + yaw)
    const ct = Math.cos(tilt)
    const st = Math.sin(tilt)
    wellWorld = [cs * wx + st * ss * wy, wy * ct, -ss * wx + st * cs * wy]

    flick = 0.88 + Math.sin(t * 2.3) * 0.02 + Math.sin(t * 7.7) * 0.012

    const f: Frame = {
      time: t,
      dt,
      morph,
      ignite: ign,
      spring: mix(20, 9.5, ign) + faceOn * 6,
      damping: mix(6.5, 3.2, ign) + faceOn * 1.6,
      // the stack is a built thing: the flow that makes filaments would only
      // blur its edges, so it is turned down where the plates are
      flowAmp: reduced ? 0.16 : mix(0.1, 0.55, ign) * (1 - 0.5 * faceOn) * (1 - 0.62 * stackOn),
      flowScale: 1.05,
      px,
      py,
      pointer: reduced ? 0 : ptrStr * (0.88 - 0.72 * smoothstep(0.15, 0.9, morph)) * (dragging ? 1.6 : 1),
      dist,
      fov,
      tilt,
      spin: spin + yaw,
      shiftX,
      shiftY,
      // the words pose packs every particle into a small footprint, so trim
      // the sprite and the exposure there or the letterforms clip to white
      sizePx: (phone ? 12.5 : 6.2) * (1 - (phone ? 0.42 : 0.14) * faceOn) * (vw / Math.max(1, window.innerWidth)),
      // the words and the globe were murky on a phone: the sprite shrinks
      // instead of the light dimming, and the swarm settling in is what
      // brings the brightness up, not the clock
      brightness:
        (phone ? 2.0 : 1.35) *
        flick *
        (1 - faceOn * (phone ? 0.12 : 0.16)) *
        (1 + globeOn * (phone ? 0.34 : 0)) *
        mix(0.5, 1, settle),
      active,
      waves,
    }
    core.frame(f)
  }

  // Heavy work starts one frame AFTER the first paint — not at `load`, which
  // would also wait on the font request. Two rAFs guarantee the hero is on
  // screen; the adapter request is fired first so the driver warms up while
  // the CPU builds the target sets.
  const kick = () => {
    void (navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown> } }).gpu?.requestAdapter()?.catch(() => {})
    idle(grind)
  }
  requestAnimationFrame(() => requestAnimationFrame(kick))
}

if (canvas) start()
else document.querySelectorAll<HTMLElement>('.rev').forEach((e) => e.classList.add('in'))
