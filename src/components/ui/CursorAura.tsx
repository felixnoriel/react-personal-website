import { useEffect, useRef } from 'react'

interface CursorAuraProps {
  className?: string
}

// Brand-palette HSL hues — the trail particle colors cycle through these
// so a long gesture leaves a rainbow ribbon rather than a monochrome streak.
const HUES = [325, 145, 200, 38]

/**
 * CursorAura — pure-CSS desktop cursor effect, site-wide.
 *
 * Three effects, all implemented with the GPU compositor only — NO
 * per-frame JavaScript draw work, NO rAF loop, NO canvas:
 *
 *   1. Soft halo: a single fixed `<div>` with a static radial-gradient
 *      background. Position updates via `transform: translate3d()`,
 *      written in an rAF-coalesced mousemove handler. The browser
 *      handles the translation entirely on the compositor — no
 *      rasterization, no layout, no paint per frame.
 *
 *   2. Comet trail: rainbow-colored particles emitted on cursor move,
 *      throttled to one particle every 40ms (and only after the cursor
 *      has moved ≥ 5px since the last emit). Each particle is a tiny
 *      `<div>` with a CSS `@keyframes` animation that scales+fades it
 *      over 500ms, then removes itself on `animationend`. Particle hue
 *      cycles through HUES so a long gesture paints a rainbow ribbon.
 *      Worst case ~12 active particles in DOM; main-thread cost per
 *      particle: 1× createElement + appendChild + 1× removal.
 *
 *   3. Click pulse: each mousedown injects a tiny `<div>` at the click
 *      coordinates. CSS `@keyframes` animation expands + fades it over
 *      600ms; element removes itself on `animationend` (with a 700ms
 *      setTimeout fallback for backgrounded tabs).
 *
 * Skipped on mobile (touch has no hover cursor) and on prefers-reduced-motion.
 *
 * Why CSS instead of canvas: an earlier canvas+rAF iteration had a
 * fixed per-frame main-thread cost that, combined with other rAF-driven
 * animations on the page, exceeded the 16ms budget under repeated clicks
 * and produced perceptible hangs. This architecture has zero per-frame
 * cost when idle and constant compositor-only cost when active.
 */
export function CursorAura({ className = '' }: CursorAuraProps) {
  const haloRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    if (!window.matchMedia('(min-width: 768px)').matches) return

    const halo = haloRef.current
    if (!halo) return

    // ── Halo: GPU-translate-only position update ────────────────────────
    let rafId: number | null = null
    let lastX = -9999
    let lastY = -9999
    let visible = false
    // Trail throttling state — emit at most one particle per 40ms, and
    // only when the cursor has moved ≥ MIN_MOVE_PX since the last emit.
    // Worst-case active-particle budget: 500ms / 40ms = ~12 particles.
    let lastTrailT = 0
    let lastTrailX = -9999
    let lastTrailY = -9999
    let trailHueIdx = 0
    const TRAIL_THROTTLE_MS = 40
    const MIN_MOVE_PX_SQ = 25 // (5px)²

    const onMove = (e: MouseEvent) => {
      lastX = e.clientX
      lastY = e.clientY
      // Trail particle emission — runs in the event handler (cheap),
      // not in the rAF, so we don't lose particles when the rAF coalesces
      // multiple mousemoves into one. Each particle is a CSS-animated
      // <div> that removes itself on animationend; main thread does NO
      // per-frame work for it after spawn.
      const now = performance.now()
      if (
        now - lastTrailT >= TRAIL_THROTTLE_MS &&
        (lastTrailX - lastX) ** 2 + (lastTrailY - lastY) ** 2 >= MIN_MOVE_PX_SQ
      ) {
        lastTrailT = now
        lastTrailX = lastX
        lastTrailY = lastY
        const dot = document.createElement('div')
        dot.className = 'cursor-aura-trail'
        dot.style.left = `${lastX}px`
        dot.style.top = `${lastY}px`
        dot.style.setProperty('--cursor-hue', String(HUES[trailHueIdx]))
        trailHueIdx = (trailHueIdx + 1) % HUES.length
        const cleanupDot = () => dot.remove()
        dot.addEventListener('animationend', cleanupDot, { once: true })
        // Fallback if animationend never fires (tab-backgrounded mid-anim).
        window.setTimeout(cleanupDot, 600)
        document.body.appendChild(dot)
      }

      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        rafId = null
        // translate3d hints at GPU compositing.
        halo.style.transform = `translate3d(${lastX}px, ${lastY}px, 0) translate(-50%, -50%)`
        if (!visible) {
          halo.style.opacity = '1'
          visible = true
        }
      })
    }
    const onDocLeave = (e: MouseEvent) => {
      if (e.relatedTarget == null) {
        halo.style.opacity = '0'
        visible = false
      }
    }

    // ── Click pulse: CSS keyframes on injected <div> ───────────────────
    const onDown = (e: MouseEvent) => {
      const ring = document.createElement('div')
      ring.className = 'cursor-aura-pulse'
      ring.style.left = `${e.clientX}px`
      ring.style.top = `${e.clientY}px`
      const cleanup = () => ring.remove()
      ring.addEventListener('animationend', cleanup, { once: true })
      // Belt-and-suspenders: if animationend never fires (e.g. tab
      // backgrounded mid-animation), still clean up the node.
      window.setTimeout(cleanup, 700)
      document.body.appendChild(ring)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mousedown', onDown, { passive: true })
    document.documentElement.addEventListener('mouseout', onDocLeave)

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mousedown', onDown)
      document.documentElement.removeEventListener('mouseout', onDocLeave)
    }
  }, [])

  return (
    <div
      ref={haloRef}
      aria-hidden
      className={`cursor-aura-halo fixed top-0 left-0 pointer-events-none hidden md:block z-40 ${className}`}
      style={{ opacity: 0, transform: 'translate3d(-9999px, -9999px, 0)' }}
    />
  )
}
