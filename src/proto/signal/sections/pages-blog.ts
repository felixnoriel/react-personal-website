/**
 * THE WRITING PAGES — behaviour for /blog/ and /blog/<slug>/.
 *
 * Everything here links the two representations of the same eighteen
 * dispatches: the rows and knots on the page, and the knots of the stream the
 * core is holding. Hover a row, focus a knot, scroll into a dispatch — the
 * swarm reaches for that post's knot and one small chip opens on it.
 *
 * Main-thread budget: no per-frame DOM writes. The reading progress is a
 * scroll-driven CSS animation wherever the browser has one (Chrome, Safari 26)
 * and a single rAF-throttled custom property in Firefox; hover handlers set the
 * gravity well and toggle a class; the chip that follows the sculpture is moved
 * by the scene's own anchor pass.
 *
 * It loads itself from the page's <head> AND exports init(scene) for
 * sections/index.ts. Whichever arrives first wins; the second is a no-op.
 */
import type { Scene, Vec3 } from '../scene'
import { LANES, lanePoint } from '../shapes/stream'

type VTDoc = Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } }

let started = false

export function init(scene: Scene) {
  if (started) return
  const main = document.querySelector<HTMLElement>('[data-page^="/blog/"]')
  if (!main) return
  started = true

  const page = main.dataset.page || '/blog/'
  const reduced = scene.reduced
  const behavior: ScrollBehavior = reduced ? 'auto' : 'smooth'
  const points: Vec3[] = Array.from({ length: LANES }, (_, i) => lanePoint(i, scene.phone))

  /* ------------------------------------------------------------- the chip */

  /** one label, pinned to the knot of whichever dispatch the reader is on */
  let chip: HTMLElement | null = null
  let release: (() => void) | null = null
  let chipLane = -1
  let chipTitle = ''

  function buildChip() {
    if (chip || scene.phone || !scene.live) return
    chip = document.createElement('div')
    chip.className = 'bl-mark mono'
    chip.setAttribute('aria-hidden', 'true')
    chip.innerHTML = '<i></i><b></b><em></em>'
    document.body.appendChild(chip)
    if (chipLane >= 0) markChip(chipLane, chipTitle)
  }

  function markChip(i: number, title: string) {
    chipLane = i
    chipTitle = title
    if (!chip) return
    if (i < 0) {
      chip.style.setProperty('--show', '0')
      return
    }
    chip.querySelector('b')!.textContent = String(i + 1).padStart(2, '0')
    chip.querySelector('em')!.textContent = title
    chip.style.setProperty('--show', '1')
    release?.()
    release = scene.anchor(chip, points[i], scene.SHAPE.stream, { offset: [14, -14], manual: true })
  }

  // onFrame only ticks while a GPU core is drawing, so the first callback is
  // the moment the sculpture exists and the chip has something to sit on
  const off = scene.onFrame(() => {
    off()
    buildChip()
  })

  /* ------------------------------------------------------- broken sources */

  // Three of the 441 frames are gone from the bucket for good. Catch the load
  // failure in the capture phase (error does not bubble) and let the CSS draw
  // the plate, so a dead source is a designed panel and never a broken icon.
  addEventListener(
    'error',
    (e) => {
      const t = e.target as HTMLElement | null
      if (!t || t.tagName !== 'IMG') return
      t.closest('.bp-fig')?.classList.add('is-gone')
      if (t.closest('.bl-shot, .bp-cover, .bp-th')) (t.closest('picture') ?? t).remove()
    },
    true,
  )

  if (page === '/blog/') archive()
  else dispatch()

  /* ====================================================== THE ARCHIVE PAGE */

  function archive() {
    const log = main!.querySelector<HTMLElement>('.bl-log')
    const cards = Array.from(main!.querySelectorAll<HTMLElement>('.bl-card'))
    const knots = Array.from(main!.querySelectorAll<HTMLElement>('.bl-knot'))
    const items = Array.from(main!.querySelectorAll<HTMLElement>('.bl-item'))
    const byLane: (HTMLElement | null)[] = new Array(LANES).fill(null)
    for (const c of cards) {
      const i = Number(c.dataset.i)
      if (i >= 0 && i < LANES) byLane[i] = c
    }
    const titleOf = (i: number) => byLane[i]?.querySelector('.bl-title')?.textContent?.trim() ?? ''

    /* --- one dispatch is "live": the row, its knot, the well and the chip */
    let live = -1
    let pinned = -1 // what scrolling says, when the pointer says nothing
    function light(i: number, fromPointer = true) {
      if (i < 0 && fromPointer) i = pinned
      if (i === live) return
      if (live >= 0) {
        byLane[live]?.classList.remove('on')
        knots[live]?.classList.remove('on')
      }
      live = i
      if (i < 0) {
        scene.setWell(null)
        markChip(-1, '')
        return
      }
      byLane[i]?.classList.add('on')
      knots[i]?.classList.add('on')
      scene.setWell(points[i], 0.95)
      markChip(i, titleOf(i))
    }
    const laneOf = (t: EventTarget | null) => {
      const el = (t as Element | null)?.closest?.('[data-i]') as HTMLElement | null
      const i = el ? Number(el.dataset.i) : NaN
      return Number.isFinite(i) && i >= 0 && i < LANES ? i : -1
    }

    let hovering = false
    main!.addEventListener(
      'pointerover',
      (e) => {
        hovering = true
        light(laneOf(e.target))
      },
      { passive: true },
    )
    main!.addEventListener(
      'pointerleave',
      () => {
        hovering = false
        light(-1)
      },
      { passive: true },
    )
    main!.addEventListener('focusin', (e) => light(laneOf(e.target)))
    main!.addEventListener('focusout', (e) => {
      if (!main!.contains((e as FocusEvent).relatedTarget as Node | null)) light(-1)
    })
    // a finger gets the pull and the shockwave before the link opens
    main!.addEventListener(
      'pointerdown',
      (e) => {
        const i = laneOf(e.target)
        if (i < 0) return
        light(i)
        scene.fire(points[i])
      },
      { passive: true },
    )

    // a knot is a jump to its row
    for (const k of knots) {
      k.addEventListener('click', () => {
        const i = Number(k.dataset.i)
        const card = byLane[i]
        if (!card) return
        card.scrollIntoView({ behavior, block: 'center' })
        card.focus({ preventScroll: true })
      })
    }

    /* --- scrolling picks the live dispatch when the pointer is elsewhere */
    if ('IntersectionObserver' in window && cards.length) {
      const seen = new Set<number>()
      const io = new IntersectionObserver(
        (es) => {
          for (const en of es) {
            const i = Number((en.target as HTMLElement).dataset.i)
            if (en.isIntersecting) seen.add(i)
            else seen.delete(i)
          }
          pinned = seen.size ? Math.min(...seen) : -1
          if (!hovering) light(pinned, false)
        },
        { rootMargin: '-42% 0px -42% 0px' },
      )
      for (const c of cards) io.observe(c)
    }

    /* --- the four counters */
    countUp(Array.from(main!.querySelectorAll<HTMLElement>('[data-wc]')), main!.querySelector('.bl-stats'))

    /* --- search and order */
    const input = main!.querySelector<HTMLInputElement>('#bl-q')
    const chips = Array.from(main!.querySelectorAll<HTMLButtonElement>('.bl-chip'))
    const count = main!.querySelector<HTMLElement>('.bl-count')
    const none = main!.querySelector<HTMLElement>('.bl-none')
    const clear = main!.querySelector<HTMLButtonElement>('.bl-clear')
    let mode = 'new'

    const key = (el: HTMLElement) =>
      mode === 'long' ? -Number(el.dataset.w) : mode === 'short' ? Number(el.dataset.w) : Number(el.dataset.k)

    function apply(reorder: boolean) {
      const q = (input?.value ?? '').trim().toLowerCase()
      let shown = 0
      for (const it of items) {
        const hit = !q || (it.dataset.find ?? '').includes(q)
        it.hidden = !hit
        if (hit) shown++
        // a hidden row must not be reachable by keyboard
        const a = it.querySelector<HTMLElement>('a')
        if (a) a.tabIndex = hit ? 0 : -1
      }
      if (count) count.textContent = `${shown} of ${items.length}`
      if (none) none.hidden = shown > 0
      if (!reorder || !log) return
      const order = [...items].sort((a, b) => key(a) - key(b))
      for (const el of order) log.appendChild(el)
    }

    const vtDoc = document as VTDoc
    const canVT =
      !reduced &&
      typeof vtDoc.startViewTransition === 'function' &&
      CSS.supports('view-transition-name', 'match-element')

    function run(reorder: boolean) {
      if (!canVT || !log) {
        apply(reorder)
        return
      }
      log.classList.add('vt')
      document.documentElement.dataset.blvt = '1'
      const done = () => {
        log.classList.remove('vt')
        delete document.documentElement.dataset.blvt
      }
      try {
        vtDoc.startViewTransition!(() => apply(reorder)).finished.then(done, done)
      } catch {
        apply(reorder)
        done()
      }
    }

    let queued = false
    input?.addEventListener('input', () => {
      if (queued) return
      queued = true
      requestAnimationFrame(() => {
        queued = false
        apply(false)
      })
    })
    clear?.addEventListener('click', () => {
      if (input) input.value = ''
      apply(false)
      input?.focus()
    })
    for (const c of chips) {
      c.addEventListener('click', () => {
        if (c.classList.contains('on')) return
        mode = c.dataset.sort ?? 'new'
        for (const o of chips) {
          const on = o === c
          o.classList.toggle('on', on)
          o.setAttribute('aria-pressed', String(on))
        }
        run(true)
      })
    }
  }

  /* ===================================================== ONE DISPATCH PAGE */

  function dispatch() {
    const art = main!.querySelector<HTMLElement>('.bp')
    const i = Number(art?.dataset.i ?? -1)
    const title = main!.querySelector('h1')?.textContent?.trim() ?? ''

    /* --- the core condenses on this dispatch's knot while the head is up,
           and lets go once the reader is inside the transcript */
    if (i >= 0 && i < LANES) {
      const head = main!.querySelector('.bp-head')
      const hold = () => {
        scene.setWell(points[i], 0.8)
        markChip(i, title)
      }
      hold()
      if (head && 'IntersectionObserver' in window) {
        new IntersectionObserver(
          (es) => {
            for (const en of es) {
              if (en.isIntersecting) hold()
              else {
                scene.setWell(null)
                markChip(-1, '')
              }
            }
          },
          { rootMargin: '-20% 0px -30% 0px' },
        ).observe(head)
      }
      // the end of the transcript sends the signal on
      const close = main!.querySelector('.bp-close')
      if (close && 'IntersectionObserver' in window && !reduced) {
        const io = new IntersectionObserver(
          (es) => {
            for (const en of es) {
              if (!en.isIntersecting) continue
              io.disconnect()
              scene.fire(points[i])
            }
          },
          { rootMargin: '0px 0px -15% 0px' },
        )
        io.observe(close)
      }
      // hovering a neighbour previews it on the wire
      const sibs = Array.from(main!.querySelectorAll<HTMLElement>('.bp-sib[data-i]'))
      for (const s of sibs) {
        const k = Number(s.dataset.i)
        if (!(k >= 0 && k < LANES)) continue
        s.addEventListener('pointerenter', () => {
          scene.setWell(points[k], 1)
          markChip(k, s.querySelector('.bl-title')?.textContent?.trim() ?? '')
        }, { passive: true })
        s.addEventListener('pointerleave', () => markChip(-1, ''), { passive: true })
      }
    }

    /* --- the contents follow the reading */
    const links = Array.from(main!.querySelectorAll<HTMLAnchorElement>('.bp-toc a[data-to]'))
    if (links.length && 'IntersectionObserver' in window) {
      const ids = links.map((a) => a.dataset.to!)
      const heads = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[]
      const inBand = new Set<string>()
      let current = ''
      const paint = () => {
        let want = current
        for (const id of ids) if (inBand.has(id)) want = id
        if (want === current) return
        current = want
        for (const a of links) a.classList.toggle('on', a.dataset.to === want)
      }
      const io = new IntersectionObserver(
        (es) => {
          for (const en of es) {
            const id = (en.target as HTMLElement).id
            if (en.isIntersecting) inBand.add(id)
            else inBand.delete(id)
          }
          paint()
        },
        { rootMargin: '-14% 0px -72% 0px' },
      )
      for (const h of heads) io.observe(h)
    }

    /* --- the light down the wire, where the compositor cannot do it */
    const bar = main!.querySelector<HTMLElement>('.bp-prog i')
    if (bar && !CSS.supports('animation-timeline', 'scroll()')) {
      let tick = false
      const write = () => {
        tick = false
        const max = document.documentElement.scrollHeight - innerHeight
        bar.style.setProperty('--read', String(max > 0 ? Math.min(1, scrollY / max) : 0))
      }
      addEventListener(
        'scroll',
        () => {
          if (tick) return
          tick = true
          requestAnimationFrame(write)
        },
        { passive: true },
      )
      write()
    }

    /* --- copy the link */
    for (const b of Array.from(main!.querySelectorAll<HTMLButtonElement>('.bp-copy'))) {
      const label = b.querySelector('span')
      const was = label?.textContent ?? 'Copy link'
      b.addEventListener('click', async () => {
        const url = b.dataset.url || location.href
        try {
          await navigator.clipboard.writeText(url)
        } catch {
          return
        }
        b.classList.add('done')
        if (label) label.textContent = 'Link copied'
        setTimeout(() => {
          b.classList.remove('done')
          if (label) label.textContent = was
        }, 1900)
      })
    }

    /* --- the contact sheet jumps into the transcript */
    if (!reduced) {
      for (const a of Array.from(main!.querySelectorAll<HTMLAnchorElement>('.bp-th, .bp-toc a[data-to], .bp-anchor'))) {
        a.addEventListener('click', (e) => {
          const id = a.getAttribute('href')?.slice(1)
          const el = id ? document.getElementById(id) : null
          if (!el) return
          e.preventDefault()
          el.scrollIntoView({ behavior, block: 'start' })
          history.replaceState(null, '', `#${id}`)
        })
      }
    }
  }

  /* ------------------------------------------------------------ counters */

  function countUp(nums: HTMLElement[], watch: Element | null) {
    const fmt = (v: number) => v.toLocaleString('en-US')
    const settle = () => nums.forEach((el) => (el.textContent = fmt(Number(el.dataset.wc))))
    if (!nums.length) return
    if (reduced || !watch || !('IntersectionObserver' in window)) {
      settle()
      return
    }
    const io = new IntersectionObserver(
      (es) => {
        for (const en of es) {
          if (!en.isIntersecting) continue
          io.disconnect()
          nums.forEach((el, k) => setTimeout(() => run(el, Number(el.dataset.wc)), k * 90))
        }
      },
      { rootMargin: '0px 0px -15% 0px' },
    )
    io.observe(watch)
    function run(el: HTMLElement, end: number) {
      const t0 = performance.now()
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / 1000)
        el.textContent = fmt(Math.round(end * (1 - Math.pow(1 - p, 4))))
        if (p < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }
  }
}

/* -------------------------------------------------------------- self-boot */

/**
 * The page's <head> loads this module directly, so it works whether or not
 * sections/index.ts has been told about it. main.ts publishes the scene right
 * before it initialises the sections, so wait for it rather than racing it.
 */
if (typeof document !== 'undefined') {
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
    // main.ts publishes the scene right before it initialises the sections
    if (++tries < 180) requestAnimationFrame(look)
  }
  const boot = () => {
    if (document.querySelector('[data-page^="/blog/"]')) look()
  }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot, { once: true })
  else boot()
}
