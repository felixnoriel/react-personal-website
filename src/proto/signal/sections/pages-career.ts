/**
 * CAREER PAGES — behaviour for /career/ and /career/<slug>/.
 *
 * The idea is the same one the home page's experience block runs on: the
 * axis, the records and the nine rings of the core are three views of the
 * same nine objects, so touching any one of them lights the other two. Here
 * it also works with the thumb — the record crossing the middle of the phone
 * screen is the one the swarm reaches for — and a role page holds the core
 * at its own knot for as long as the visitor stays.
 *
 * Cost per frame: one vector write on a role page (the well's slow drift),
 * and nothing at all on the index. Every class change runs on a pointer,
 * focus or intersection event; no layout is read inside a frame.
 */
import type { Scene, Vec3 } from '../scene'
import { ROLE_SPANS, orbitNodes } from '../shapes/orbit'

/** the orbit's index in the page's shape list */
const SHAPE = 2

export function init(scene: Scene) {
  const page = document.querySelector<HTMLElement>('main[data-page^="/career/"]')
  if (!page) return
  revealLogos()
  const nodes = orbitNodes(1) as Vec3[]
  const index = document.querySelector<HTMLElement>('.cr')
  if (index) initIndex(scene, nodes)
  const detail = document.querySelector<HTMLElement>('.cd')
  if (detail) initDetail(scene, nodes, detail)
}

/* Several of the logo files 403 today. The identity chip is the base state
   and the image only reveals itself once it has really arrived, so a dead
   URL costs nothing and a live one still gets its logo. */
function revealLogos() {
  for (const img of document.querySelectorAll<HTMLImageElement>('.cr-logo img, .cd-id img')) {
    // the renderer may have wrapped the image in a <picture>, so the plate is
    // the nearest labelled ancestor, not simply the parent
    const box = img.closest('.cr-logo, .cd-id')
    if (!box) continue
    if (img.complete) {
      if (img.naturalWidth > 0) box.classList.add('ok')
      continue
    }
    img.addEventListener('load', () => box.classList.add('ok'), { once: true })
  }
}

/** the nine labels the scene pins to the knots of the orbit */
function makeLabels(scene: Scene, nodes: Vec3[], href: (i: number) => string | null, current: number) {
  const labels: HTMLElement[] = []
  const frag = document.createDocumentFragment()
  for (let i = 0; i < nodes.length; i++) {
    const s = ROLE_SPANS[i]
    const el = document.createElement('a')
    el.className = 'crn' + (s.current ? ' live' : '') + (i === current ? ' here' : '')
    const to = href(i)
    if (to) el.href = to
    el.dataset.role = String(i)
    el.tabIndex = -1
    el.setAttribute('aria-hidden', 'true')
    const dot = document.createElement('i')
    const year = document.createElement('em')
    year.textContent = String(Math.floor(s.start / 12))
    const co = document.createElement('span')
    co.textContent = ' ' + s.company
    el.append(dot, year, co)
    labels.push(el)
    frag.append(el)
  }
  document.body.append(frag)
  for (let i = 0; i < nodes.length; i++)
    scene.anchor(labels[i], nodes[i], SHAPE, { offset: [0, -17], fade: 1.5, manual: true })
  return labels
}

/* --------------------------------------------------------------- index */

function initIndex(scene: Scene, nodes: Vec3[]) {
  const n = nodes.length
  const byRole = <T extends HTMLElement>(sel: string) => {
    const out: T[] = new Array(n)
    for (const el of document.querySelectorAll<T>(sel)) {
      const i = Number(el.dataset.role)
      if (Number.isFinite(i) && i >= 0 && i < n) out[i] = el
    }
    return out
  }
  const recs = byRole<HTMLElement>('.cr-rec')
  const lanes = byRole<HTMLAnchorElement>('.ax-lane')
  if (!recs[0]) return

  const labels = makeLabels(scene, nodes, (i) => (recs[i]?.id ? '#' + recs[i].id : null), -1)

  let hovered = -1
  let reading = -1
  let shown = -1

  const paint = () => {
    const want = hovered >= 0 ? hovered : reading
    if (want === shown) return
    if (shown >= 0) {
      recs[shown]?.classList.remove('on')
      lanes[shown]?.classList.remove('on')
      labels[shown]?.classList.remove('on')
    }
    shown = want
    if (want >= 0) {
      recs[want]?.classList.add('on')
      lanes[want]?.classList.add('on')
      labels[want]?.classList.add('on')
      scene.setWell(nodes[want], hovered >= 0 ? 1 : 0.8)
    } else {
      scene.setWell(null)
    }
  }

  const enter = (i: number) => {
    hovered = i
    paint()
  }
  const leave = (i: number) => {
    if (hovered === i) hovered = -1
    paint()
  }

  for (let i = 0; i < n; i++) {
    for (const el of [recs[i], lanes[i], labels[i]]) {
      if (!el) continue
      el.addEventListener('pointerenter', () => enter(i))
      el.addEventListener('pointerleave', () => leave(i))
      el.addEventListener('focusin', () => enter(i))
      el.addEventListener('focusout', () => leave(i))
    }
    // a tap is not a hover: the touch itself lights the record and fires
    recs[i]?.addEventListener(
      'pointerdown',
      (e) => {
        enter(i)
        if ((e as PointerEvent).pointerType !== 'mouse') scene.fire(nodes[i])
      },
      { passive: true },
    )
    lanes[i]?.addEventListener('click', (e) => {
      const target = recs[i]
      if (!target) return
      e.preventDefault()
      history.replaceState(null, '', '#' + target.id)
      target.scrollIntoView({ behavior: scene.reduced ? 'auto' : 'smooth', block: 'center' })
      enter(i)
      scene.fire(nodes[i])
      setTimeout(() => leave(i), 1400)
    })
  }

  // the record crossing the middle of the screen is the one the core reaches
  // for when nothing is being pointed at — which is how it works on a phone
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const i = Number((e.target as HTMLElement).dataset.role)
          if (!Number.isFinite(i)) continue
          if (e.isIntersecting) reading = i
          else if (reading === i) reading = -1
        }
        paint()
      },
      { rootMargin: '-46% 0px -46% 0px' },
    )
    for (const r of recs) if (r) io.observe(r)
  }

  counters(scene)
}

/** the four numbers in the head, counted up once they are on screen */
function counters(scene: Scene) {
  const cells = Array.from(document.querySelectorAll<HTMLElement>('[data-crcount]'))
  if (!cells.length) return
  const run = (el: HTMLElement) => {
    const to = Number(el.dataset.crcount)
    if (!Number.isFinite(to)) return
    if (scene.reduced || to <= 1) {
      el.textContent = String(to)
      return
    }
    const t0 = performance.now()
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / 900)
      const e = 1 - Math.pow(1 - k, 3)
      el.textContent = String(Math.round(to * e))
      if (k < 1) requestAnimationFrame(step)
    }
    el.textContent = '0'
    requestAnimationFrame(step)
  }
  if (!('IntersectionObserver' in window)) {
    cells.forEach(run)
    return
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries)
        if (e.isIntersecting) {
          run(e.target as HTMLElement)
          io.unobserve(e.target)
        }
    },
    { rootMargin: '0px 0px -10% 0px' },
  )
  cells.forEach((c) => io.observe(c))
}

/* -------------------------------------------------------------- detail */

function initDetail(scene: Scene, nodes: Vec3[], root: HTMLElement) {
  const i = Number(root.dataset.role)
  if (!Number.isFinite(i) || i < 0 || i >= nodes.length) return
  const home = nodes[i]

  // every knot links to its own seat; the mini axis on this page already
  // carries the nine real paths, so nothing here has to guess a slug
  const paths: (string | null)[] = new Array(nodes.length).fill(null)
  for (const a of root.querySelectorAll<HTMLAnchorElement>('.ax-lane')) {
    const k = Number(a.dataset.role)
    if (Number.isFinite(k) && k >= 0 && k < nodes.length) paths[k] = a.getAttribute('href')
  }
  makeLabels(scene, nodes, (k) => paths[k], i)

  /* the swarm is held at this role's knot. It drifts a little around it, so
     the core reads as alive rather than parked, and a highlight the visitor
     points at pulls it a step further out along that ring. */
  const well: Vec3 = [home[0], home[1], home[2]]
  const target: Vec3 = [home[0], home[1], home[2]]
  scene.setWell(well, 0.92)

  const hls = Array.from(root.querySelectorAll<HTMLElement>('.hl'))
  const reach = (k: number) => {
    // a point a little outside the knot, turned by which highlight it is:
    // the same knot, seen from a different side
    const a = (k + 1) * 1.05
    const r = 0.26
    target[0] = home[0] * 1.12 + Math.cos(a) * r
    target[1] = home[1] * 1.12 + Math.sin(a) * r * 0.7
    target[2] = home[2] * 1.12 + Math.sin(a * 1.7) * r
  }
  const rest = () => {
    target[0] = home[0]
    target[1] = home[1]
    target[2] = home[2]
  }
  hls.forEach((el, k) => {
    const on = () => {
      el.classList.add('on')
      reach(k)
    }
    const off = () => {
      el.classList.remove('on')
      rest()
    }
    el.addEventListener('pointerenter', on)
    el.addEventListener('pointerleave', off)
    el.addEventListener('focusin', on)
    el.addEventListener('focusout', off)
    el.addEventListener('pointerdown', () => scene.fire(well), { passive: true })
  })

  if (scene.reduced) {
    scene.onFrame(() => {
      well[0] += (target[0] - well[0]) * 0.08
      well[1] += (target[1] - well[1]) * 0.08
      well[2] += (target[2] - well[2]) * 0.08
    })
  } else {
    scene.onFrame((f) => {
      const s = Math.sin(f.time * 0.5) * 0.05
      const c = Math.cos(f.time * 0.37) * 0.05
      well[0] += (target[0] + c - well[0]) * 0.06
      well[1] += (target[1] + s - well[1]) * 0.06
      well[2] += (target[2] - s - well[2]) * 0.06
    })
    // the page arrives: one pulse out of the knot it is standing on
    setTimeout(() => scene.live && scene.fire(home), 900)
  }

  /* the record is a book: ← is the newer seat, → the older one, esc is the
     shelf. The console owns j/k and the arrows with shift, so these are free. */
  const go = (sel: string) => {
    const a = root.querySelector<HTMLAnchorElement>(sel)
    if (a) location.href = a.href
  }
  addEventListener('keydown', (e) => {
    const el = e.target as HTMLElement | null
    if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return
    if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return
    if (document.querySelector('dialog[open]')) return
    if (e.key === 'ArrowLeft') go('.cd-prev')
    else if (e.key === 'ArrowRight') go('.cd-next')
    else if (e.key === 'Escape') go('.cd-all')
    else return
    e.preventDefault()
  })
}
