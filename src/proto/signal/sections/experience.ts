/**
 * EXPERIENCE — behaviour.
 *
 * One idea: the decade map, the nine cards and the nine rings of the core are
 * three views of the same nine objects, so touching any one of them lights the
 * other two. Point at a role and the swarm reaches for that role's knot; a
 * leader line runs from the page's edge out to it, the way the hero's impact
 * readouts are wired back into the coil.
 *
 * Cost per frame: nothing. The only per-frame DOM writes are the scene's own
 * label transforms. Everything here runs on pointer, focus and intersection
 * events, and never reads layout inside a frame.
 */
import type { Scene, Vec3 } from '../scene'
import { ROLE_SPANS, orbitNodes } from '../shapes/orbit'

/** the orbit's index in the page's shape list */
const SHAPE = 2
/** how far the morph may drift before this section hands the core back */
const HOLD = 0.5

export function init(scene: Scene) {
  const list = document.querySelector<HTMLElement>('.xp-roles')
  if (!list) return
  const nodes = orbitNodes(1) as Vec3[]
  const n = nodes.length

  const byRole = <T extends HTMLElement>(sel: string) => {
    const out: T[] = new Array(n)
    for (const el of document.querySelectorAll<T>(sel)) {
      const i = Number(el.dataset.role)
      if (Number.isFinite(i) && i >= 0 && i < n) out[i] = el
    }
    return out
  }
  const cards = byRole<HTMLElement>('.xp-roles .role')
  const bars = byRole<HTMLElement>('.map-bar')
  if (!cards[0]) return

  /* ---------------------------------------------------------- the labels */

  const labels: HTMLElement[] = []
  const frag = document.createDocumentFragment()
  for (let i = 0; i < n; i++) {
    const s = ROLE_SPANS[i]
    const el = document.createElement('b')
    el.className = 'xp-node' + (s.current ? ' live' : '')
    el.dataset.role = String(i)
    el.setAttribute('aria-hidden', 'true')
    const dot = document.createElement('i')
    const year = document.createElement('em')
    year.textContent = String(Math.floor(s.start / 12))
    const co = document.createElement('span')
    co.textContent = ' ' + s.company
    el.append(dot, year, co)
    labels.push(el)
    frag.append(el)
  }
  const beam = document.createElement('span')
  beam.className = 'xp-beam'
  beam.setAttribute('aria-hidden', 'true')
  frag.append(beam)
  document.body.append(frag)
  for (let i = 0; i < n; i++) scene.anchor(labels[i], nodes[i], SHAPE, { offset: [0, -17], fade: 1.5, manual: true })

  /* ----------------------------------------------------------- the logos */

  // Several of the logo files 403 today. The identity chip under each image is
  // the base state, and the image only reveals itself once it has really
  // arrived — so a dead URL costs nothing and a live one still gets its logo.
  for (const img of document.querySelectorAll<HTMLImageElement>('.role-logo img')) {
    const box = img.parentElement
    if (!box) continue
    if (img.complete) {
      if (img.naturalWidth > 0) box.classList.add('ok')
      continue
    }
    img.addEventListener('load', () => box.classList.add('ok'), { once: true })
  }

  /* ------------------------------------------------------- the highlight */

  let hovered = -1
  let reading = 0
  let shown = -1
  let held = true
  let lastPing = 0
  let releaseBeam: (() => void) | null = null

  const clear = (i: number) => {
    cards[i]?.classList.remove('on')
    bars[i]?.classList.remove('on')
    labels[i]?.classList.remove('on')
  }

  function paint() {
    if (!held) return
    const i = hovered >= 0 ? hovered : reading
    if (i === shown) return
    if (shown >= 0) clear(shown)
    shown = i
    cards[i]?.classList.add('on')
    bars[i]?.classList.add('on')
    labels[i]?.classList.add('on')

    // A cursor is itself a gravity well in this page, so on a mouse the core
    // only gets pulled when you deliberately point at a role. A finger has no
    // hover, so on touch the core follows whatever card you have scrolled to.
    // 0.42 is a lean, not a collapse: the page's own cursor well runs at about
    // 0.16 in the chapters, and anything near 1 balls the whole orbit up into a
    // knot and throws the nine rings away.
    if (hovered >= 0) scene.setWell(nodes[i], 0.42)
    else if (scene.coarse) scene.setWell(nodes[i], 0.2)
    else scene.setWell(null)

    releaseBeam?.()
    releaseBeam = scene.anchor(beam, nodes[i], SHAPE, { manual: true, fade: 1.5 })

    // a ping through that ring when you arrive on a role, throttled so a sweep
    // down the list reads as a rhythm rather than a strobe
    const now = performance.now()
    if (hovered >= 0 && !scene.reduced && now - lastPing > 380) {
      lastPing = now
      scene.fire(nodes[i])
    }
  }

  function release() {
    if (shown >= 0) clear(shown)
    shown = -1
    hovered = -1
    scene.setWell(null)
    releaseBeam?.()
    releaseBeam = null
    beam.style.visibility = 'hidden'
  }

  /* --------------------------------------------------------- the pointer */

  const roleAt = (t: EventTarget | null) => {
    const el = (t as Element | null)?.closest?.('[data-role]') as HTMLElement | null
    if (!el) return -1
    const i = Number(el.dataset.role)
    return Number.isFinite(i) ? i : -1
  }
  const enter = (e: Event) => {
    const i = roleAt(e.target)
    if (i >= 0 && i !== hovered) {
      hovered = i
      paint()
    }
  }
  const leave = (e: Event) => {
    const to = (e as PointerEvent).relatedTarget as Element | null
    if (to && roleAt(to) >= 0) return
    if (hovered < 0) return
    hovered = -1
    paint()
  }
  for (const host of [list, document.querySelector('.map-rows')]) {
    if (!host) continue
    host.addEventListener('pointerover', enter, { passive: true })
    host.addEventListener('pointerout', leave, { passive: true })
    host.addEventListener('focusin', enter, { passive: true })
    host.addEventListener('focusout', leave, { passive: true })
  }
  for (const el of labels) {
    el.addEventListener('pointerenter', enter, { passive: true })
    el.addEventListener('pointerleave', leave, { passive: true })
  }

  /* ------------------------------------------------------------ the taps */

  const jump = (i: number) => {
    hovered = i
    paint()
    scene.fire(nodes[i])
    cards[i]?.scrollIntoView({ behavior: scene.reduced ? 'auto' : 'smooth', block: 'center' })
  }
  document.querySelector('.map-rows')?.addEventListener('click', (e) => {
    const i = roleAt(e.target)
    if (i >= 0) jump(i)
  })
  for (const el of labels)
    el.addEventListener('click', () => {
      const i = Number(el.dataset.role)
      if (i >= 0) jump(i)
    })

  // A click anywhere on a card opens that role — except on a phone, where a
  // tap is how you aim the core, and except mid-selection, where the click
  // belongs to the text the reader just picked out.
  list.addEventListener('click', (e) => {
    const ev = e as MouseEvent
    const i = roleAt(ev.target)
    if (i < 0 || (ev.target as Element).closest('a, button')) return
    if (scene.coarse) {
      hovered = i
      paint()
      scene.fire(nodes[i])
      return
    }
    const sel = getSelection()
    if (sel && !sel.isCollapsed) return
    const slug = cards[i]?.dataset.slug
    if (slug) location.assign(`/career/${slug}`)
  })

  /* ------------------------------------------------- what you are reading */

  if ('IntersectionObserver' in window) {
    // a thin band across the middle of the viewport: whichever card sits in it
    // is the one being read. No scroll handler, no layout reads.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            const i = Number((e.target as HTMLElement).dataset.role)
            if (Number.isFinite(i)) {
              reading = i
              paint()
            }
          }
      },
      { rootMargin: '-42% 0px -42% 0px' },
    )
    for (const c of cards) if (c) io.observe(c)
  }

  /* -------------------------------------------------------- the counters */

  const stats = Array.from(document.querySelectorAll<HTMLElement>('[data-xpcount]'))
  const host = document.querySelector('.xp-stats')
  if (stats.length && host && !scene.reduced && 'IntersectionObserver' in window) {
    const run = () =>
      stats.forEach((el, k) => {
        const end = Number(el.dataset.xpcount)
        if (!Number.isFinite(end)) return
        const t0 = performance.now() + k * 80
        el.textContent = '0'
        const step = (now: number) => {
          const p = Math.max(0, Math.min(1, (now - t0) / 900))
          el.textContent = String(Math.round(end * (1 - Math.pow(1 - p, 4))))
          if (p < 1) requestAnimationFrame(step)
          else el.textContent = String(end)
        }
        requestAnimationFrame(step)
      })
    const io2 = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io2.disconnect()
          run()
        }
      },
      { rootMargin: '0px 0px -18% 0px' },
    )
    io2.observe(host)
  }

  /* ---------------------------------------------------- handing the core back */

  // The well belongs to whichever chapter is on screen: let go the moment the
  // orbit stops being the pose, so the next section starts from a clean core.
  scene.onFrame((f) => {
    const near = Math.abs(f.morph - SHAPE) < HOLD
    if (near === held) return
    held = near
    if (near) paint()
    else release()
  })
}
