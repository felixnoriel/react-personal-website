import { useEffect, useRef } from 'react'
import { useFxLevel } from '../../hooks/useFxLevel'

/**
 * KineticHeadline — the hero headline as living, touchable type.
 *
 * Three acts, all driven by ONE tiny engine writing per-letter
 * `font-variation-settings: 'wght'` on a variable font:
 *   1. Text is readable at frame one (no scramble — never garble the
 *      words being read), then a single weight wave sweeps through.
 *   2. Live: on desktop, letters swell toward the cursor as it passes
 *      (gooey type) and a click sends a weight ripple. Touch gets the
 *      static gradient — pointer forces are a mouse affordance.
 *
 * Why weight-only (no per-letter transforms): the aurora gradient is
 * `background-clip: text` on the HOST element, and weight changes are
 * plain text layout — the clip re-derives perfectly every frame. A
 * transformed descendant inside a clipped host is undefined territory
 * across engines; weight isn't.
 *
 * Perf shape (per this repo's hard-won rules):
 *   - No React re-renders after mount — the engine writes DOM directly.
 *   - One rAF loop that SLEEPS whenever every letter is at rest.
 *   - pointermove is desktop-only (disableHeavyFx gate); mobile pays
 *     nothing until a tap.
 *   - Letter positions are cached; scroll/resize just mark them dirty.
 *   - Reduced-motion renders static text, no listeners at all.
 */

const BASE_WGHT = 700 // matches the h1's font-bold
const PEAK_WGHT = 900
const POINTER_RADIUS = 120 // px of cursor influence

type Pulse = { x: number; y: number; t0: number; life: number; span: number }

interface KineticHeadlineProps {
  text: string
  variant?: 'cool' | 'warm'
  className?: string
}

export function KineticHeadline({
  text,
  variant,
  className = '',
}: KineticHeadlineProps) {
  const { reduceMotion, disableHeavyFx } = useFxLevel()
  const hostRef = useRef<HTMLSpanElement>(null)
  // read by the engine's listeners so a mobile↔desktop resize doesn't tear
  // down + replay the whole effect (it would re-run the scramble mid-session)
  const heavyFxOffRef = useRef(disableHeavyFx)
  heavyFxOffRef.current = disableHeavyFx

  useEffect(() => {
    if (reduceMotion) return
    const host = hostRef.current
    if (!host) return
    const letters = Array.from(host.querySelectorAll<HTMLSpanElement>('[data-kin]'))
    if (!letters.length) return
    const finalChars = letters.map((el) => el.dataset.kin ?? '')

    let raf = 0
    let revealed = false
    const wght = letters.map(() => BASE_WGHT)
    const written = letters.map(() => BASE_WGHT)
    let centers: { x: number; y: number }[] | null = null
    let centersDirty = true
    let hostRect = host.getBoundingClientRect()
    let hostRectDirty = false
    const pointer = { x: -1e4, y: -1e4, near: false }
    const pulses: Pulse[] = []

    // scroll/resize move the headline: refresh the cached host box before the
    // next hit-test, or the whole interaction dies behind a stale rect
    const freshHostRect = () => {
      if (hostRectDirty) {
        hostRect = host.getBoundingClientRect()
        hostRectDirty = false
      }
    }

    const computeCenters = () => {
      hostRect = host.getBoundingClientRect()
      centers = letters.map((el) => {
        const b = el.getBoundingClientRect()
        return { x: b.left + b.width / 2, y: b.top + b.height / 2 }
      })
      centersDirty = false
    }

    const tick = (now: number) => {
      raf = 0
      let busy = false

      // ── Act 1: instant text (the headline must be readable at frame
      // one — scrambling the first words destroyed the highest-value
      // pixels on the page), then a single weight wave sweeps through.
      if (!revealed) {
        revealed = true
        computeCenters()
        pulses.push({
          x: hostRect.left,
          y: hostRect.top + hostRect.height / 2,
          t0: now,
          life: 1000,
          span: hostRect.width + 260,
        })
        busy = true
      }

      // ── Act 3: weight field (pointer + travelling pulses) ──────
      if (revealed) {
        if (centersDirty) computeCenters()
        for (let p = pulses.length - 1; p >= 0; p--) {
          if (now - pulses[p].t0 > pulses[p].life) pulses.splice(p, 1)
        }
        const r2 = POINTER_RADIUS * POINTER_RADIUS
        for (let i = 0; i < letters.length; i++) {
          const c = centers![i]
          let inf = 0
          if (pointer.near) {
            const dx = pointer.x - c.x
            const dy = (pointer.y - c.y) * 1.6 // elliptical: line is wide, not tall
            inf = Math.exp(-(dx * dx + dy * dy) / r2)
          }
          for (const p of pulses) {
            const age = (now - p.t0) / p.life
            const front = age * p.span
            const d = Math.abs(Math.hypot(c.x - p.x, c.y - p.y) - front)
            const pi = Math.exp(-(d * d) / (75 * 75)) * (1 - age)
            if (pi > inf) inf = pi
          }
          const target = BASE_WGHT + (PEAK_WGHT - BASE_WGHT) * inf
          wght[i] += (target - wght[i]) * 0.24
          // snap when close so a settled letter reads exactly its target
          // (and a relaxed one drops its inline override to a clean 700)
          if (Math.abs(target - wght[i]) < 0.5) wght[i] = target
          else busy = true
          if (Math.abs(wght[i] - written[i]) >= 1) {
            written[i] = Math.round(wght[i])
            letters[i].style.fontVariationSettings = `'wght' ${written[i]}`
          }
        }
        // Sleep once every letter sits AT its target — even with the cursor
        // parked on the headline (a resting cursor emits no pointermove, so
        // an awake loop here would spin at full frame rate forever).
        if (pulses.length) busy = true
      }

      if (busy) raf = requestAnimationFrame(tick)
    }

    const wake = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }

    // Desktop: cursor proximity. Window-level (host has no pointer events of
    // its own worth trusting under the parallax layers), gated to the hero.
    const onMove = (e: PointerEvent) => {
      if (heavyFxOffRef.current) return
      freshHostRect()
      pointer.x = e.clientX
      pointer.y = e.clientY
      const pad = POINTER_RADIUS * 1.4
      const wasNear = pointer.near
      pointer.near =
        e.clientX > hostRect.left - pad &&
        e.clientX < hostRect.right + pad &&
        e.clientY > hostRect.top - pad &&
        e.clientY < hostRect.bottom + pad
      if (pointer.near || wasNear) wake()
    }

    // Mouse-only click ripple through the letters (touch scroll-start
    // taps must never fire forces).
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      if (!revealed) return
      freshHostRect()
      const pad = 90
      if (
        e.clientX > hostRect.left - pad &&
        e.clientX < hostRect.right + pad &&
        e.clientY > hostRect.top - pad &&
        e.clientY < hostRect.bottom + pad
      ) {
        if (pulses.length > 3) pulses.shift()
        pulses.push({ x: e.clientX, y: e.clientY, t0: performance.now(), life: 750, span: 420 })
        wake()
      }
    }

    const markDirty = () => {
      centersDirty = true
      hostRectDirty = true
      // if the loop is asleep with letters swollen, a scroll moved them out
      // from under the cursor — wake once so they relax against fresh rects
      wake()
    }

    // cursor left the window with letters swollen → let them relax
    const onBlur = () => {
      pointer.near = false
      wake()
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('scroll', markDirty, { passive: true })
    window.addEventListener('resize', markDirty)
    window.addEventListener('blur', onBlur)
    wake()

    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('scroll', markDirty)
      window.removeEventListener('resize', markDirty)
      window.removeEventListener('blur', onBlur)
      letters.forEach((el, i) => {
        el.textContent = finalChars[i]
        el.style.removeProperty('font-variation-settings')
      })
    }
  }, [reduceMotion, text])

  const tint = variant === 'cool' ? 'aurora-cool' : variant === 'warm' ? 'aurora-warm' : ''
  return (
    <span ref={hostRef} className={`aurora-text ${tint} ${className}`}>
      {text.split('').map((ch, i) =>
        ch === ' ' ? (
          ' '
        ) : (
          <span key={i} data-kin={ch}>
            {ch}
          </span>
        ),
      )}
    </span>
  )
}
