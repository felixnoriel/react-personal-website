/**
 * pages-about — behaviour for /about/ and /404/.
 *
 * Three jobs, and nothing else.
 *
 * 1. The build cards fill themselves in from what actually happened on this
 *    device: the renderer that was granted, the particles being drawn, the
 *    median frame time, the first byte, the first paint, the screen. Every
 *    one of those is read from a browser API or from the core's own handle
 *    (window.__signal), never written by hand — a card that cannot measure
 *    its value says so.
 * 2. The labels pinned to the sculpture. Four facts around the coil on the
 *    about page, two on the beam on the 404. They are absolutely positioned
 *    overlays driven by four custom properties the scene writes, so they can
 *    never move the article, and they simply do not exist without a GPU.
 * 3. The eight-pose strip lights the row the core is holding, and hovering a
 *    build card pulls the swarm toward it.
 *
 * Main thread: no per-frame work of its own. The measured cells refresh on a
 * one-second interval (two, with reduced motion), the row lighting is an
 * IntersectionObserver, and hover handlers set the well and toggle a class.
 *
 * It loads itself from the page's <head> AND exports init(scene) for
 * sections/index.ts. Whichever arrives first wins; the second is a no-op.
 */
import type { Scene, Vec3 } from '../scene'
import { beamBase, beamMuzzle } from '../shapes/beam'

/** where a pinned label sits on the coil: the ring of current, at angle u */
const coilAt = (u: number): Vec3 => [Math.cos(u) * 1.16, Math.sin(u) * 1.16, 0]

interface Pin {
  text: string
  point: Vec3
  shape: number
  lime?: boolean
  offset?: [number, number]
}

const ABOUT_PINS: Pin[] = [
  { text: 'available for work', point: coilAt(0.42), shape: 0, lime: true, offset: [14, -10] },
  { text: 'bangkok · utc+7', point: coilAt(1.94), shape: 0, offset: [-16, -12] },
  { text: '13+ years shipping', point: coilAt(3.42), shape: 0, offset: [-18, 10] },
  { text: 'nomading with the fam', point: coilAt(5.1), shape: 0, offset: [16, 12] },
]

const NF_PINS: Pin[] = [
  { text: 'signal ends here', point: beamMuzzle(), shape: 7, offset: [18, -12] },
  { text: 'no route', point: beamBase(), shape: 7, lime: true, offset: [18, 12] },
]

/** "320000" → "320k", the same shorthand the rail uses */
const count = (v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(Math.round(v)))

interface CoreInfo {
  tier?: string
  count?: number
  fps?: number
  ms?: number
  drawn?: number
}

let started = false

export function init(scene: Scene) {
  if (started) return
  const main = document.querySelector<HTMLElement>('main[data-page]')
  const page = main?.dataset.page
  if (page !== '/about/' && page !== '/404/') return
  started = true

  /* ------------------------------------------------- labels on the sculpture */

  const holder = document.getElementById(page === '/about/' ? 'ab-pins' : 'nf-pins')
  if (holder && !scene.reduced) {
    // no GPU means no sculpture to pin anything to; the CSS tier hides the
    // holder as well, so this is belt and braces
    const attach = () => {
      if (!scene.live) return
      for (const p of page === '/about/' ? ABOUT_PINS : NF_PINS) {
        const el = document.createElement('span')
        el.className = 'ab-pin mono' + (p.lime ? ' lime' : '')
        el.innerHTML = `<i aria-hidden="true"></i>${p.text}`
        holder.appendChild(el)
        scene.anchor(el, p.point, p.shape, { manual: true, offset: p.offset, fade: 1.9 })
      }
    }
    // the core ignites a beat after the page paints; wait for it rather than
    // creating labels that would sit dead on a CSS-tier page
    let tries = 0
    const wait = setInterval(() => {
      if (scene.live) {
        clearInterval(wait)
        attach()
      } else if (++tries > 40) clearInterval(wait)
    }, 250)
  }

  /* ------------------------------------------------------- the measured cells */

  const cells = new Map<string, HTMLElement>()
  for (const el of Array.from(document.querySelectorAll<HTMLElement>('[data-live]')))
    cells.set(el.dataset.live!, el)

  const set = (key: string, value: string, tone?: 'set' | 'warm') => {
    const el = cells.get(key)
    if (!el || el.textContent === value) return
    el.textContent = value
    el.title = value
    el.classList.toggle('set', tone === 'set')
    el.classList.toggle('warm', tone === 'warm')
  }

  if (cells.size) {
    // what the browser itself measured for this navigation
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    if (nav) set('ttfb', `${Math.max(0, Math.round(nav.responseStart))}ms`, 'set')
    else set('ttfb', 'not exposed')

    const paint = () => {
      const fcp = performance.getEntriesByType('paint').find((e) => e.name === 'first-contentful-paint')
      if (fcp) set('paint', `${Math.round(fcp.startTime)}ms`, 'set')
      return !!fcp
    }
    if (!paint()) {
      try {
        const po = new PerformanceObserver(() => {
          if (paint()) po.disconnect()
        })
        po.observe({ type: 'paint', buffered: true })
      } catch {
        set('paint', 'not exposed')
      }
    }

    const dpr = Math.round((window.devicePixelRatio || 1) * 10) / 10
    set('screen', `${window.innerWidth} × ${window.innerHeight} @ ${dpr}×`, 'set')

    // the core's own handle: it only exists once a GPU tier has ignited
    let settled = false
    const readCore = () => {
      const info = (window as Window & { __signal?: CoreInfo }).__signal
      if (info?.tier) {
        settled = true
        set('renderer', info.tier, 'set')
        set('particles', count(info.drawn ?? info.count ?? 0), 'set')
        if (info.ms) set('frame', `${info.ms.toFixed(1)}ms`, info.ms > 22 ? 'warm' : 'set')
        return true
      }
      if (document.documentElement.dataset.fx === 'css') {
        settled = true
        set('renderer', 'CSS · no GPU', 'warm')
        set('particles', 'none')
        set('frame', 'no loop')
        return true
      }
      return false
    }
    readCore()
    // one cheap interval: it hunts for the tier, then keeps the live numbers
    // honest. Nothing here reads layout, so it cannot cost a reflow.
    const every = scene.reduced ? 2000 : 1000
    let waited = 0
    const timer = setInterval(() => {
      readCore()
      // with no GPU there is no loop and nothing left to refresh
      if (settled && document.documentElement.dataset.fx === 'css') clearInterval(timer)
      if (!settled && (waited += every) > 20000) {
        set('renderer', 'still starting')
        clearInterval(timer)
      }
    }, every)
    addEventListener('pagehide', () => clearInterval(timer), { once: true })
    // the screen line is only true for the current viewport
    let rt = 0
    addEventListener('resize', () => {
      clearTimeout(rt)
      rt = window.setTimeout(() => {
        const d = Math.round((window.devicePixelRatio || 1) * 10) / 10
        set('screen', `${window.innerWidth} × ${window.innerHeight} @ ${d}×`, 'set')
      }, 220)
    })
  }

  if (page === '/about/') initAbout(scene)
  else initNotFound(scene)
}

/* -------------------------------------------------------------------- about */

function initAbout(scene: Scene) {
  /* the tier switch says which tier this page was asked for */
  const want = new URLSearchParams(location.search).get('fx') || ''
  for (const a of Array.from(document.querySelectorAll<HTMLAnchorElement>('.ab-swap a')))
    if ((a.dataset.fx || '') === want) a.setAttribute('aria-current', 'true')

  /* hovering a build card pulls the swarm toward it */
  const cards = Array.from(document.querySelectorAll<HTMLElement>('.ab-card'))
  const cardPoint = (i: number): Vec3 => [-1.7 + (i % 3) * 1.7, i < 3 ? 0.55 : -0.55, 0.35]
  let lit = -1
  const light = (i: number) => {
    if (i === lit) return
    if (lit >= 0) cards[lit]?.classList.remove('on')
    lit = i
    if (i < 0) {
      scene.setWell(null)
      return
    }
    cards[i]?.classList.add('on')
    scene.setWell(cardPoint(i), 1.05)
  }
  const indexOf = (t: EventTarget | null) => {
    const el = (t as Element | null)?.closest?.('.ab-card') as HTMLElement | null
    return el ? cards.indexOf(el) : -1
  }
  const list = document.querySelector<HTMLElement>('.ab-cards')
  if (list) {
    list.addEventListener('pointerover', (e) => light(indexOf(e.target)), { passive: true })
    list.addEventListener('pointerleave', () => light(-1), { passive: true })
    list.addEventListener('focusin', (e) => light(indexOf(e.target)))
    list.addEventListener('focusout', (e) => {
      if (!list.contains((e as FocusEvent).relatedTarget as Node | null)) light(-1)
    })
    // a finger gets the pull and the shockwave too
    list.addEventListener(
      'pointerdown',
      (e) => {
        const i = indexOf(e.target)
        if (i < 0) return
        light(i)
        scene.fire(cardPoint(i))
      },
      { passive: true },
    )
  }

  /* The eight-pose strip. The lit row is the pose the core is actually
     holding, so it is read from the morph itself rather than guessed from
     geometry: one integer compare per frame, and a class swap only when the
     pose changes. With no GPU there is no frame loop, so an observer covers
     that tier and steps aside the moment the real thing starts. */
  const rows = Array.from(document.querySelectorAll<HTMLElement>('.ab-pose'))
  if (!rows.length) return
  let posed = -1
  const pose = (k: number) => {
    if (k === posed) return
    rows[posed]?.classList.remove('on')
    posed = k
    rows[k]?.classList.add('on')
  }
  let io: IntersectionObserver | null = null
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) e.target.classList.toggle('on', e.isIntersecting)
      },
      { rootMargin: '-40% 0px -40% 0px' },
    )
    rows.forEach((r) => io!.observe(r))
  } else {
    rows.forEach((r) => r.classList.add('on'))
  }
  scene.onFrame((f) => {
    if (io) {
      io.disconnect()
      io = null
      rows.forEach((r) => r.classList.remove('on'))
    }
    // biased so a row lights as it arrives and holds until the next is read
    pose(Math.max(0, Math.min(rows.length - 1, Math.floor(f.morph + 0.4))))
  })
  // leaving the build block must let the swarm go, or it stays hooked on a
  // card while the core is meant to be running the poses
  const poses = document.getElementById('poses')
  if (poses)
    new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) light(-1)
      },
      { rootMargin: '0px' },
    ).observe(poses)
}

/* ---------------------------------------------------------------------- 404 */

function initNotFound(scene: Scene) {
  /* the address that was actually asked for. The static file cannot know it;
     the preview also lives under a base path, which is stripped so the line
     reads as the site's own address and not the folder it previews in. */
  const el = document.getElementById('nf-path')
  if (el) {
    const own = document.querySelector<HTMLElement>('main[data-page]')?.dataset.page || '/404/'
    const path = location.pathname
    const base = path.endsWith(own) ? path.slice(0, path.length - own.length) : ''
    const asked = (path.startsWith(base) ? path.slice(base.length) : path) + location.search
    el.textContent = asked || '/'
  }

  /* the beam sends one pulse when the core is up, and one more when the
     visitor takes the way home — the page's only two shockwaves */
  if (!scene.reduced) {
    let tries = 0
    const wait = setInterval(() => {
      if (scene.live) {
        clearInterval(wait)
        scene.fire(beamBase())
      } else if (++tries > 40) clearInterval(wait)
    }, 250)
  }
  document.getElementById('nf-home')?.addEventListener(
    'pointerdown',
    () => {
      scene.fire(beamMuzzle())
    },
    { passive: true },
  )
}

/**
 * Self-load. The page's <head> pulls this module in directly, so the two
 * pages carry their own behaviour and nothing shared has to know about them.
 * main.ts creates window.__scene before it initialises the sections, so wait
 * for it rather than racing it.
 */
if (typeof document !== 'undefined' && document.querySelector('main[data-page="/about/"], main[data-page="/404/"]')) {
  let tries = 0
  const look = () => {
    const s = (window as Window & { __scene?: Scene }).__scene
    if (s) {
      try {
        init(s)
      } catch {
        /* one page must never take the site down */
      }
      return
    }
    if (++tries < 180) requestAnimationFrame(look)
  }
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', look, { once: true })
  else if (w.requestIdleCallback) w.requestIdleCallback(look, { timeout: 200 })
  else look()
}
