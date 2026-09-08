/**
 * pages-projects — the behaviour of /projects/ and the nine case files.
 *
 * Everything here is optional: the pages are complete static HTML and every
 * link, heading and image works with this file switched off. What it adds:
 *
 *   1. The core answers the page. Touching a project — hover, focus, or
 *      simply scrolling it to the middle of a phone screen — pulls the swarm
 *      into that product's cell of the bench, and three labels ride the
 *      sculpture naming the featured three.
 *   2. A live stack filter on the index, animated by the browser's own
 *      view transition where there is one.
 *   3. A real light-box: keys, swipe, a thumbnail rail, no dependency.
 *
 * Cheap by construction: no layout reads inside a scene frame, no per-frame
 * DOM writes except the scene's own label transforms, and the only work a
 * pointer causes is one rect read and four custom-property writes.
 */
import type { Scene, Vec3 } from '../scene'
import { busPoints, cellPoints } from '../shapes/cells'

const TILT = 2.4

interface Target {
  root: HTMLElement
  hit: HTMLElement
  point: Vec3
  cell: number
}

export function init(scene: Scene) {
  const main = document.querySelector<HTMLElement>('main[data-page^="/projects/"]')
  if (!main) return
  const cells = cellPoints()
  const bus = busPoints()

  const pointOf = (el: HTMLElement): { point: Vec3; cell: number } | null => {
    const c = el.dataset.cell
    const b = el.dataset.bus
    if (c !== undefined && cells[Number(c)]) return { point: cells[Number(c)], cell: Number(c) }
    if (b !== undefined && bus[Number(b)]) return { point: bus[Number(b)], cell: -1 }
    return null
  }

  /* ------------------------------------------------- the well and the pins */

  const pins = Array.from(main.querySelectorAll<HTMLElement>('.pj-pin'))
  pins.forEach((el, i) => {
    if (cells[i]) scene.anchor(el, cells[i], 3, { offset: [0, -34], fade: 1.1 })
  })
  const litPin = (cell: number) => pins.forEach((p, i) => p.classList.toggle('lit', i === cell))

  let active: Target | null = null
  let rect: DOMRect | null = null
  let stale = true
  let mx = 0
  let my = 0
  let queued = false

  const paint = () => {
    queued = false
    const a = active
    if (!a || !a.hit.classList.contains('pj-link')) return
    if (stale || !rect) {
      rect = a.hit.getBoundingClientRect()
      stale = false
    }
    const x = mx - rect.left
    const y = my - rect.top
    a.hit.style.setProperty('--gx', `${(x - rect.width / 2).toFixed(0)}px`)
    a.hit.style.setProperty('--gy', `${(y - rect.height / 2).toFixed(0)}px`)
    if (scene.reduced || scene.coarse) return
    a.hit.style.setProperty('--ry', `${(((x / rect.width) * 2 - 1) * TILT).toFixed(2)}deg`)
    a.hit.style.setProperty('--rx', `${((1 - (y / rect.height) * 2) * TILT).toFixed(2)}deg`)
  }
  const queue = () => {
    if (queued) return
    queued = true
    requestAnimationFrame(paint)
  }

  const enter = (tg: Target, tilt: boolean) => {
    if (active && active !== tg) leave(active)
    active = tg
    rect = null
    stale = true
    tg.root.classList.add('on')
    scene.setWell(tg.point, 1.05)
    litPin(tg.cell)
    if (tilt) queue()
  }
  const leave = (tg: Target) => {
    tg.root.classList.remove('on')
    tg.hit.style.removeProperty('--rx')
    tg.hit.style.removeProperty('--ry')
    if (active === tg) {
      active = null
      scene.setWell(null)
      litPin(-1)
    }
  }

  addEventListener('scroll', () => (stale = true), { passive: true })
  addEventListener('resize', () => (stale = true), { passive: true })

  const targets: Target[] = []
  for (const root of Array.from(main.querySelectorAll<HTMLElement>('[data-cell], [data-bus]'))) {
    const p = pointOf(root)
    if (!p) continue
    const hit = root.querySelector<HTMLElement>('.pj-link, a') ?? root
    const tg: Target = { root, hit, point: p.point, cell: p.cell }
    targets.push(tg)
    hit.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'touch') return
      mx = e.clientX
      my = e.clientY
      enter(tg, true)
    })
    hit.addEventListener('pointermove', (e) => {
      if (active !== tg || e.pointerType === 'touch') return
      mx = e.clientX
      my = e.clientY
      queue()
    })
    hit.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'touch') return
      leave(tg)
    })
    hit.addEventListener(
      'pointerdown',
      (e) => {
        mx = e.clientX
        my = e.clientY
        if (e.pointerType !== 'touch') enter(tg, true)
        else {
          if (active && active !== tg) leave(active)
          active = tg
          tg.root.classList.add('on')
          scene.setWell(tg.point, 1.05)
          litPin(tg.cell)
        }
        scene.fire(tg.point)
      },
      { passive: true },
    )
    hit.addEventListener('focus', () => enter(tg, false))
    hit.addEventListener('blur', () => leave(tg))
  }

  /* ---------------------------------------------------------- counters */

  const countUp = (el: HTMLElement) => {
    const to = el.dataset.to
    if (!to) return
    const m = to.match(/^([\d.]+)(.*)$/)
    if (!m || scene.reduced) return
    const end = parseFloat(m[1])
    const dec = (m[1].split('.')[1] || '').length
    const t0 = performance.now()
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / 1150)
      el.textContent = (end * (1 - Math.pow(1 - p, 4))).toFixed(dec) + m[2]
      if (p < 1) requestAnimationFrame(step)
      else el.textContent = to
    }
    requestAnimationFrame(step)
  }

  const io = 'IntersectionObserver' in window
  const counted = new WeakSet<HTMLElement>()
  const wake = (el: HTMLElement) => {
    el.classList.add('live')
    if (counted.has(el)) return
    counted.add(el)
    el.querySelectorAll<HTMLElement>('[data-to]').forEach((f, i) => setTimeout(() => countUp(f), i * 100))
  }
  const wakeable = Array.from(main.querySelectorAll<HTMLElement>('.pj-card, .pj-stats, .pj-screen'))
  if (io) {
    const live = new IntersectionObserver(
      (es) => {
        for (const e of es) {
          const el = e.target as HTMLElement
          if (e.isIntersecting) wake(el)
          else el.classList.remove('live')
        }
      },
      { rootMargin: '12% 0px' },
    )
    wakeable.forEach((el) => live.observe(el))
    // content-visibility can outrun the page-wide reveal observer; nothing
    // in this group may ever be left invisible
    const safety = new IntersectionObserver(
      (es) => {
        for (const e of es)
          if (e.isIntersecting) {
            e.target.querySelectorAll<HTMLElement>('.rev').forEach((r) => r.classList.add('in'))
            safety.unobserve(e.target)
          }
      },
      { rootMargin: '30% 0px' },
    )
    main.querySelectorAll<HTMLElement>('.pj-cat, .pj-gal, .pj-cols, .pj-more').forEach((s) => safety.observe(s))
  } else {
    wakeable.forEach(wake)
    main.querySelectorAll<HTMLElement>('.rev').forEach((r) => r.classList.add('in'))
  }

  // on a phone there is no hover: whatever is crossing the middle of the
  // screen is what the core holds
  if (io && scene.coarse) {
    const centre = new IntersectionObserver(
      (es) => {
        for (const e of es) {
          const tg = targets.find((k) => k.root === e.target)
          if (!tg) continue
          if (e.isIntersecting) enter(tg, false)
          else if (active === tg) leave(tg)
        }
      },
      { rootMargin: '-45% 0px -45% 0px' },
    )
    targets.filter((t) => t.root.classList.contains('pj-card')).forEach((t) => centre.observe(t.root))
  }

  initFilter(scene, main)
  initCase(scene, main)
}

/* ============================================================ the filter */

function initFilter(scene: Scene, main: HTMLElement) {
  const grid = main.querySelector<HTMLElement>('#pj-grid')
  const chips = Array.from(main.querySelectorAll<HTMLButtonElement>('.pj-chip'))
  if (!grid || !chips.length) return
  const cards = Array.from(grid.querySelectorAll<HTMLElement>('.pj-card'))
  const rows = Array.from(main.querySelectorAll<HTMLElement>('.pj-row'))
  const showing = main.querySelector<HTMLElement>('.pj-showing')
  const empty = main.querySelector<HTMLElement>('.pj-empty')
  const reset = main.querySelector<HTMLButtonElement>('.pj-reset')
  const total = cards.length
  const pad = (n: number) => String(n).padStart(2, '0')

  const apply = (tag: string) => {
    let n = 0
    for (const c of cards) {
      const hit = !tag || (c.dataset.tags || '').split(' ').includes(tag)
      c.hidden = !hit
      if (hit) n++
    }
    for (const r of rows) {
      const slug = r.dataset.slug
      const card = cards.find((c) => c.dataset.slug === slug)
      r.classList.toggle('dim', !!tag && !!card && card.hidden)
    }
    if (showing) showing.innerHTML = `showing <b>${pad(n)}</b> of ${pad(total)}`
    if (empty) empty.hidden = n > 0
    for (const c of chips) {
      const on = (c.dataset.tag || '') === tag
      c.classList.toggle('on', on)
      c.setAttribute('aria-pressed', on ? 'true' : 'false')
    }
  }

  const start = (tag: string) => {
    const run = () => apply(tag)
    const vt = (document as Document & { startViewTransition?: (cb: () => void) => unknown }).startViewTransition
    if (!vt || scene.reduced) {
      run()
      return
    }
    // the browser animates every card from where it was to where it lands
    const root = document.documentElement
    grid.classList.add('vt')
    root.classList.add('pj-vt')
    const done = () => {
      grid.classList.remove('vt')
      root.classList.remove('pj-vt')
    }
    const tr = vt.call(document, run) as { finished?: Promise<unknown> }
    if (tr && tr.finished) void tr.finished.then(done, done)
    else setTimeout(done, 400)
  }

  for (const c of chips)
    c.addEventListener('click', () => {
      start(c.dataset.tag || '')
      scene.fire()
    })
  reset?.addEventListener('click', () => start(''))
}

/* ========================================================= the case file */

interface Frame {
  src: string
  set: string
  type: string
  w: number
  h: number
  alt: string
  cat: string
  btn: HTMLElement
}

function initCase(scene: Scene, main: HTMLElement) {
  /* ---- the core holds this product while its body is on screen ---- */
  const body = main.querySelector<HTMLElement>('.pj-main')
  const article = main.querySelector<HTMLElement>('.pj-case')
  if (body && article && 'IntersectionObserver' in window) {
    const c = article.dataset.cell
    const b = article.dataset.bus
    const p = c !== undefined ? cellPoints()[Number(c)] : b !== undefined ? busPoints()[Number(b)] : null
    if (p) {
      const hold = new IntersectionObserver(
        (es) => {
          for (const e of es) {
            if (e.isIntersecting) scene.setWell(p, 0.95)
            else scene.setWell(null)
          }
        },
        { rootMargin: '-20% 0px -20% 0px' },
      )
      hold.observe(body)
    }
  }

  /* ---- the sub-nav follows the reading ---- */
  const links = Array.from(main.querySelectorAll<HTMLAnchorElement>('.pj-sub a'))
  if (links.length && 'IntersectionObserver' in window) {
    const map = new Map<Element, HTMLAnchorElement>()
    for (const a of links) {
      const el = document.getElementById(decodeURIComponent(a.hash.slice(1)))
      if (el) map.set(el, a)
    }
    const seen = new Set<Element>()
    const spy = new IntersectionObserver(
      (es) => {
        for (const e of es) {
          if (e.isIntersecting) seen.add(e.target)
          else seen.delete(e.target)
        }
        let best: Element | null = null
        for (const el of map.keys()) if (seen.has(el) && !best) best = el
        if (!best) return
        for (const [el, a] of map) a.classList.toggle('on', el === best)
      },
      { rootMargin: '-15% 0px -70% 0px' },
    )
    map.forEach((_, el) => spy.observe(el))
  }

  /* ---- the gallery ---- */
  const tiles = Array.from(main.querySelectorAll<HTMLButtonElement>('.pj-tile'))
  if (!tiles.length) return

  for (const tab of Array.from(main.querySelectorAll<HTMLButtonElement>('.pj-tab'))) {
    tab.addEventListener('click', () => {
      const cat = tab.dataset.cat || ''
      for (const b of Array.from(main.querySelectorAll<HTMLButtonElement>('.pj-tab'))) {
        const on = b === tab
        b.classList.toggle('on', on)
        b.setAttribute('aria-pressed', on ? 'true' : 'false')
      }
      for (const t of tiles) t.hidden = !!cat && (t.dataset.cat || '') !== cat
    })
  }

  const frames: Frame[] = tiles.map((b) => ({
    src: b.dataset.src || '',
    set: b.dataset.set || '',
    type: b.dataset.type || 'image/avif',
    w: Number(b.dataset.w) || 1600,
    h: Number(b.dataset.h) || 900,
    alt: b.dataset.alt || '',
    cat: b.dataset.cat || '',
    btn: b,
  }))

  const lb = main.querySelector<HTMLDialogElement>('#pj-lb')
  if (!lb || typeof lb.showModal !== 'function') return
  const pic = lb.querySelector<HTMLElement>('.pj-lb-pic')!
  const shown = pic.querySelector('img')!
  const num = lb.querySelector<HTMLElement>('.pj-lb-n b')!
  const cap = lb.querySelector<HTMLElement>('.pj-lb-cap')!
  const rail = lb.querySelector<HTMLElement>('.pj-lb-rail')!
  let at = 0
  let opener: HTMLElement | null = null
  let built = false

  const preload = (i: number) => {
    const f = frames[(i + frames.length) % frames.length]
    if (!f) return
    const im = new Image()
    if (f.set) {
      im.sizes = '100vw'
      im.srcset = f.set
    }
    im.src = f.src
  }

  const show = (i: number) => {
    at = (i + frames.length) % frames.length
    const f = frames[at]
    pic.querySelector('source')?.remove()
    if (f.set) {
      const s = document.createElement('source')
      s.type = f.type
      s.srcset = f.set
      s.sizes = '100vw'
      pic.insertBefore(s, shown)
    }
    shown.width = f.w
    shown.height = f.h
    shown.alt = f.alt
    shown.src = f.src
    num.textContent = String(at + 1).padStart(2, '0')
    cap.textContent = f.cat ? `${f.alt} · ${f.cat}` : f.alt
    const thumbs = Array.from(rail.children) as HTMLElement[]
    thumbs.forEach((el, k) => el.classList.toggle('on', k === at))
    thumbs[at]?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: scene.reduced ? 'auto' : 'smooth' })
    preload(at + 1)
    preload(at - 1)
  }

  const buildRail = () => {
    if (built) return
    built = true
    const frag = document.createDocumentFragment()
    frames.forEach((f, i) => {
      const b = document.createElement('button')
      b.type = 'button'
      b.tabIndex = -1
      const src = f.btn.querySelector('picture, img')
      if (src) b.appendChild(src.cloneNode(true))
      b.addEventListener('click', () => show(i))
      frag.appendChild(b)
    })
    rail.appendChild(frag)
  }

  const open = (i: number, from: HTMLElement | null) => {
    opener = from
    buildRail()
    show(i)
    lb.showModal()
    scene.fire()
    lb.querySelector<HTMLButtonElement>('.pj-lb-x')?.focus()
  }
  const close = () => {
    lb.classList.add('closing')
    const done = () => {
      lb.classList.remove('closing')
      lb.close()
      opener?.focus()
    }
    if (scene.reduced) done()
    else setTimeout(done, 150)
  }

  tiles.forEach((b, i) => b.addEventListener('click', () => open(i, b)))
  main.querySelector<HTMLElement>('.pj-screen-in.open')?.addEventListener('click', (e) => open(0, e.currentTarget as HTMLElement))
  lb.querySelector<HTMLButtonElement>('.pj-lb-x')?.addEventListener('click', close)
  lb.querySelector<HTMLButtonElement>('.pj-lb-go.prev')?.addEventListener('click', () => show(at - 1))
  lb.querySelector<HTMLButtonElement>('.pj-lb-go.next')?.addEventListener('click', () => show(at + 1))
  lb.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      show(at - 1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      show(at + 1)
    } else if (e.key === 'Home') {
      e.preventDefault()
      show(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      show(frames.length - 1)
    }
  })
  // Escape closes it itself; keep the fade and the focus return
  lb.addEventListener('cancel', (e) => {
    e.preventDefault()
    close()
  })
  // a click on the dark ground, not on the picture, closes it
  lb.addEventListener('click', (e) => {
    if (e.target === lb) close()
  })

  // swipe, on the picture only, so a vertical drag still scrolls
  const fig = lb.querySelector<HTMLElement>('.pj-lb-fig')!
  let sx = 0
  let sy = 0
  let down = false
  fig.addEventListener(
    'pointerdown',
    (e) => {
      down = true
      sx = e.clientX
      sy = e.clientY
    },
    { passive: true },
  )
  fig.addEventListener(
    'pointerup',
    (e) => {
      if (!down) return
      down = false
      const dx = e.clientX - sx
      if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(e.clientY - sy)) show(at + (dx < 0 ? 1 : -1))
    },
    { passive: true },
  )
  fig.addEventListener('pointercancel', () => (down = false), { passive: true })
}
