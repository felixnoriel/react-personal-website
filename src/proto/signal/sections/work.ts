/**
 * work — behaviour.
 *
 * Four jobs, all cheap:
 *   1. Hovering (or tapping, or tabbing to) a product pulls the swarm into
 *      that product's cell of the sculpture and lights the plate.
 *   2. The pointer's light and the card's tilt follow the pointer — one
 *      rect read and four custom-property writes per frame, at most.
 *   3. A module only runs its schematic animation while it is on screen.
 *   4. The outcome numbers count up the first time a module arrives.
 *
 * Nothing here reads layout inside a scene frame, and nothing writes to the
 * DOM per frame unless a pointer is actually moving over a card.
 */
import type { Scene, Vec3 } from '../scene'
import { busPoints, cellPoints } from '../shapes/cells'

const TILT = 2.6

interface Card {
  root: HTMLElement
  card: HTMLElement
  point: Vec3
}

export function init(scene: Scene) {
  const section = document.getElementById('work')
  if (!section) return

  const cells = cellPoints()
  const bus = busPoints()
  const cards: Card[] = []
  for (const el of Array.from(section.querySelectorAll<HTMLElement>('[data-cell], [data-bus]'))) {
    const card = el.querySelector<HTMLElement>('.wk-card')
    if (!card) continue
    const i = Number(el.dataset.cell ?? el.dataset.bus)
    const point = el.dataset.cell !== undefined ? cells[i] : bus[i]
    if (!point) continue
    cards.push({ root: el, card, point })
  }
  if (!cards.length) return

  /* ------------------------------------------------- pointer + the well */

  let active: Card | null = null
  let rect: DOMRect | null = null
  let stale = true
  let mx = 0
  let my = 0
  let queued = false

  const paint = () => {
    queued = false
    const a = active
    if (!a) return
    if (stale || !rect) {
      rect = a.card.getBoundingClientRect()
      stale = false
    }
    const x = mx - rect.left
    const y = my - rect.top
    a.card.style.setProperty('--gx', `${(x - rect.width / 2).toFixed(0)}px`)
    a.card.style.setProperty('--gy', `${(y - rect.height / 2).toFixed(0)}px`)
    if (scene.reduced || scene.coarse) return
    const nx = (x / rect.width) * 2 - 1
    const ny = (y / rect.height) * 2 - 1
    a.card.style.setProperty('--ry', `${(nx * TILT).toFixed(2)}deg`)
    a.card.style.setProperty('--rx', `${(-ny * TILT).toFixed(2)}deg`)
  }
  const queue = () => {
    if (queued) return
    queued = true
    requestAnimationFrame(paint)
  }

  const enter = (c: Card, tilt: boolean) => {
    if (active && active !== c) leave(active)
    active = c
    rect = null
    stale = true
    c.root.classList.add('on')
    scene.setWell(c.point, 1.05)
    if (tilt) queue()
  }
  const leave = (c: Card) => {
    c.root.classList.remove('on')
    c.card.style.removeProperty('--rx')
    c.card.style.removeProperty('--ry')
    c.card.style.removeProperty('--gx')
    c.card.style.removeProperty('--gy')
    if (active === c) {
      active = null
      scene.setWell(null)
    }
  }

  addEventListener('scroll', () => (stale = true), { passive: true })
  addEventListener('resize', () => (stale = true), { passive: true })

  for (const c of cards) {
    c.card.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'touch') return
      mx = e.clientX
      my = e.clientY
      enter(c, true)
    })
    c.card.addEventListener('pointermove', (e) => {
      if (active !== c || e.pointerType === 'touch') return
      mx = e.clientX
      my = e.clientY
      queue()
    })
    c.card.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'touch') return
      leave(c)
    })
    // a press anywhere on the plate throws a shockwave from that product's cell
    c.card.addEventListener(
      'pointerdown',
      (e) => {
        mx = e.clientX
        my = e.clientY
        if (e.pointerType !== 'touch') enter(c, true)
        scene.fire(c.point)
      },
      { passive: true },
    )
    c.card.addEventListener('focus', () => enter(c, false))
    c.card.addEventListener('blur', () => leave(c))
  }

  /* ------------------------------------- on-screen: run, count, reveal */

  const counted = new WeakSet<HTMLElement>()
  const instant = scene.reduced

  const countUp = (el: HTMLElement) => {
    const to = el.dataset.to
    if (!to) return
    const m = to.match(/^([\d.]+)(.*)$/)
    if (!m || instant) return
    const end = parseFloat(m[1])
    const dec = (m[1].split('.')[1] || '').length
    const t0 = performance.now()
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / 1250)
      const e = 1 - Math.pow(1 - p, 4)
      el.textContent = (end * e).toFixed(dec) + m[2]
      if (p < 1) requestAnimationFrame(step)
      else el.textContent = to
    }
    requestAnimationFrame(step)
  }

  const wake = (el: HTMLElement) => {
    el.classList.add('live')
    if (counted.has(el)) return
    counted.add(el)
    el.querySelectorAll<HTMLElement>('.wk-fig[data-to]').forEach((f, i) => setTimeout(() => countUp(f), i * 110))
  }

  const mods = Array.from(section.querySelectorAll<HTMLElement>('.wk-mod'))
  if ('IntersectionObserver' in window) {
    // A finger has no hover, and a tap opens the case study — so on touch the
    // SCROLL is the interaction: whichever product is crossing the middle of
    // the screen is the one the core holds.
    if (scene.coarse) {
      const centre = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            const c = cards.find((k) => k.root === e.target)
            if (!c) continue
            if (e.isIntersecting) enter(c, false)
            else if (active === c) leave(c)
          }
        },
        { rootMargin: '-42% 0px -42% 0px' },
      )
      cards.forEach((c) => centre.observe(c.root))
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const el = e.target as HTMLElement
          if (e.isIntersecting) wake(el)
          else el.classList.remove('live')
        }
      },
      { rootMargin: '10% 0px' },
    )
    mods.forEach((m) => io.observe(m))
    // belt and braces: content-visibility can delay the page-wide reveal
    // observer, and this block must never be left invisible
    const safety = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        section.querySelectorAll<HTMLElement>('.rev').forEach((r) => r.classList.add('in'))
        safety.disconnect()
      },
      { rootMargin: '25% 0px' },
    )
    safety.observe(section)
  } else {
    mods.forEach(wake)
    section.querySelectorAll<HTMLElement>('.rev').forEach((r) => r.classList.add('in'))
  }
}
