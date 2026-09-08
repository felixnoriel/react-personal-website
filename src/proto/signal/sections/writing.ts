/**
 * WRITING — behaviour.
 *
 * Everything here is a link between two representations of the same eighteen
 * posts: the cards in the flow and the knots on the wire. Hover, focus or tap a
 * card and the swarm reaches for that post's knot, its label opens on the
 * sculpture and its bar lifts in the index strip — and the same three things
 * happen from the other direction.
 *
 * Main-thread budget: the only per-frame writes are the scene's own label
 * transforms. Hover handlers set the well and toggle a class; the pointer light
 * on the feature card writes two custom properties, at most once per frame and
 * only while the pointer is on that one card.
 */
import type { Scene, Vec3 } from '../scene'
import { LANES, lanePoint } from '../shapes/stream'

type VTDoc = Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } }

export function init(scene: Scene) {
  const sec = document.getElementById('writing')
  if (!sec) return

  const byLane: (HTMLElement | null)[] = new Array(LANES).fill(null)
  for (const el of Array.from(sec.querySelectorAll<HTMLElement>('.wr-card'))) {
    const i = Number(el.dataset.i)
    if (i >= 0 && i < LANES) byLane[i] = el
  }
  const bars = Array.from(sec.querySelectorAll<HTMLElement>('.wr-index i'))
  // lanePoint bakes in the phone's wider, lower wire, so the well and the
  // labels always land on the knot the visitor is actually looking at
  const points: Vec3[] = Array.from({ length: LANES }, (_, i) => lanePoint(i, scene.phone))
  const labels: HTMLElement[] = []

  /* ------------------------------------------------------ the two-way link */

  let cur = -1
  function light(i: number) {
    if (i === cur) return
    if (cur >= 0) {
      byLane[cur]?.classList.remove('on')
      bars[cur]?.classList.remove('on')
      labels[cur]?.classList.remove('on')
    }
    cur = i
    if (i < 0) {
      scene.setWell(null)
      return
    }
    byLane[i]?.classList.add('on')
    bars[i]?.classList.add('on')
    labels[i]?.classList.add('on')
    // a hover is the visitor's own move, so it still answers under reduced
    // motion — but as a lean, not a rush
    scene.setWell(points[i], scene.reduced ? 0.4 : 0.9)
  }
  const laneOf = (t: EventTarget | null) => {
    const el = (t as Element | null)?.closest?.('[data-i]') as HTMLElement | null
    const i = el ? Number(el.dataset.i) : NaN
    return Number.isFinite(i) && i >= 0 && i < LANES ? i : -1
  }

  sec.addEventListener('pointerover', (e) => light(laneOf(e.target)), { passive: true })
  sec.addEventListener('pointerleave', () => light(-1), { passive: true })
  // keyboard reaches the sculpture too: tabbing the archive walks the wire
  sec.addEventListener('focusin', (e) => light(laneOf(e.target)))
  sec.addEventListener('focusout', (e) => {
    if (!sec.contains((e as FocusEvent).relatedTarget as Node | null)) light(-1)
  })
  // a finger gets the same pull, plus the shockwave, before the link opens
  sec.addEventListener(
    'pointerdown',
    (e) => {
      const i = laneOf(e.target)
      if (i < 0) return
      light(i)
      scene.fire(points[i])
    },
    { passive: true },
  )

  // when the chapter scrolls away the well must let go, or the swarm stays
  // clamped to a knot that is no longer on screen
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      (es) => {
        for (const en of es) if (!en.isIntersecting) light(-1)
      },
      { rootMargin: '0px' },
    ).observe(sec)
  }

  /* ------------------------------------------------------- counting the log */

  const nums = Array.from(sec.querySelectorAll<HTMLElement>('[data-wc]'))
  const settle = () => nums.forEach((el) => (el.textContent = fmt(Number(el.dataset.wc))))
  const fmt = (v: number) => v.toLocaleString('en-US')
  if (scene.reduced || !('IntersectionObserver' in window)) {
    settle()
  } else {
    const io = new IntersectionObserver(
      (es) => {
        for (const en of es) {
          if (!en.isIntersecting) continue
          io.disconnect()
          nums.forEach((el, k) => setTimeout(() => countUp(el, Number(el.dataset.wc)), k * 110))
        }
      },
      { rootMargin: '0px 0px -20% 0px' },
    )
    const stats = sec.querySelector('.wr-stats')
    if (stats) io.observe(stats)
    else settle()
  }
  function countUp(el: HTMLElement, end: number) {
    const t0 = performance.now()
    const dur = 1000
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / dur)
      const e = 1 - Math.pow(1 - p, 4)
      el.textContent = fmt(Math.round(end * e))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }

  /* ---------------------------------------------------------- ordering the archive */

  const log = sec.querySelector<HTMLElement>('.wr-log')
  const chips = Array.from(sec.querySelectorAll<HTMLButtonElement>('.wr-chip'))
  if (log && chips.length) {
    const vtDoc = document as VTDoc
    const canVT =
      !scene.reduced &&
      typeof vtDoc.startViewTransition === 'function' &&
      CSS.supports('view-transition-name', 'match-element')
    for (const chip of chips) {
      chip.addEventListener('click', () => {
        const mode = chip.dataset.sort === 'long' ? 'long' : 'new'
        if (chip.classList.contains('on')) return
        for (const c of chips) {
          const on = c === chip
          c.classList.toggle('on', on)
          c.setAttribute('aria-pressed', String(on))
        }
        const items = Array.from(log.children) as HTMLElement[]
        const key = (el: HTMLElement) => (mode === 'long' ? -Number(el.dataset.w) : Number(el.dataset.k))
        items.sort((a, b) => key(a) - key(b))
        const commit = () => items.forEach((el) => log.appendChild(el))
        // the control answers on the sculpture too: a pulse from whichever
        // dispatch the new order puts first
        const lead = Number(items[0]?.dataset.k)
        if (Number.isFinite(lead) && !scene.reduced) {
          scene.fire(points[lead])
          light(lead)
          // let go after the move settles, unless the visitor has since
          // pointed at something else
          setTimeout(() => cur === lead && light(-1), 900)
        }
        if (!canVT) {
          commit()
          return
        }
        // the rows fly to their new places; the rest of the page is told to
        // hold still so the live canvas is never cross-faded against itself
        log.classList.add('vt')
        document.documentElement.dataset.wrVt = '1'
        try {
          const t = vtDoc.startViewTransition!(commit)
          const done = () => {
            log.classList.remove('vt')
            delete document.documentElement.dataset.wrVt
          }
          t.finished.then(done, done)
        } catch {
          commit()
          log.classList.remove('vt')
          delete document.documentElement.dataset.wrVt
        }
      })
    }
  }

  /* ------------------------------------------------- the light on the feature */

  const feature = sec.querySelector<HTMLElement>('.wr-feature')
  if (feature && !scene.coarse && !scene.reduced) {
    let mx = 0
    let my = 0
    let queued = false
    const write = () => {
      queued = false
      feature.style.setProperty('--mx', `${mx.toFixed(1)}px`)
      feature.style.setProperty('--my', `${my.toFixed(1)}px`)
    }
    feature.addEventListener(
      'pointermove',
      (e) => {
        const r = feature.getBoundingClientRect()
        mx = e.clientX - r.left
        my = e.clientY - r.top
        if (!queued) {
          queued = true
          requestAnimationFrame(write)
        }
      },
      { passive: true },
    )
  }

  /* ------------------------------------------------- the labels on the wire */

  // onFrame only ticks while a GPU core is drawing, so the first callback IS
  // the moment the sculpture exists and the labels have something to sit on
  if (!scene.phone) {
    const off = scene.onFrame(() => {
      off()
      if (!scene.live) return
      buildLabels()
    })
  }

  function buildLabels() {
    const layer = document.createElement('div')
    layer.className = 'wr-lanes'
    layer.setAttribute('aria-hidden', 'true')
    for (let i = 0; i < LANES; i++) {
      const card = byLane[i]
      if (!card) continue
      const title = card.querySelector('.wr-title, .wr-ftitle')?.textContent?.trim() ?? ''
      const el = document.createElement('span')
      el.className = 'wr-lane'
      el.dataset.i = String(i)
      el.innerHTML = '<i class="pip"></i><b></b><em></em>'
      el.querySelector('b')!.textContent = String(i + 1).padStart(2, '0')
      el.querySelector('em')!.textContent = title
      layer.appendChild(el)
      labels[i] = el
      // manual: the scene writes --ax/--ay/--aw/--aa and the CSS does the rest,
      // so depth can dim the far side of the helix with no per-frame JS
      scene.anchor(el, points[i], scene.SHAPE.stream, { offset: [12, -12], manual: true })
    }
    layer.addEventListener('pointerover', (e) => light(laneOf(e.target)), { passive: true })
    layer.addEventListener('pointerleave', () => light(-1), { passive: true })
    // clicking a knot takes the reader to the card it belongs to
    layer.addEventListener('click', (e) => {
      const i = laneOf(e.target)
      if (i < 0) return
      byLane[i]?.scrollIntoView({ behavior: scene.reduced ? 'auto' : 'smooth', block: 'center' })
      byLane[i]?.focus({ preventScroll: true })
    })
    document.body.appendChild(layer)
  }

  /* ------------------------------------------------------------ the photos */

  // The shell rewrites each cover into a local <picture>; if one ever fails to
  // arrive anyway, the plate underneath is already a finished drawing — say so
  // with a class rather than leaving a broken frame.
  sec.addEventListener(
    'error',
    (e) => {
      const img = e.target as HTMLElement | null
      if (img && img.tagName === 'IMG') img.closest('.wr-plate')?.classList.add('noimg')
    },
    true,
  )
}
