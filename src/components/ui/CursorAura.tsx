import { useEffect, useRef } from 'react'

interface CursorAuraProps {
  className?: string
}

type TrailPoint = { x: number; y: number; t: number }

// Brand-palette HSL hues — the trail color-cycles through these so a long
// gesture leaves a rainbow ribbon rather than a monochrome streak.
const HUES = [325, 145, 200, 38]

/**
 * CursorAura — site-wide desktop canvas effect that follows the cursor
 * across every page. Two layered effects on a single rAF + single
 * fixed-position canvas:
 *
 *   1. Comet trail: a gradient-stroked ribbon traces recent cursor positions,
 *      fading by age. Color cycles through the brand palette so fast gestures
 *      paint a rainbow streak.
 *   2. Soft halo: a radial-gradient bloom under the cursor head, like the
 *      cursor itself is emitting light into the page.
 *
 * Click ripples were removed in this iteration: they spawned heavy stroke
 * + radial-gradient draws that, under repeated rapid clicks, made the page
 * feel frozen for the duration of the ripple animation. The visual loss
 * is small — clicks already get OS-level button-press feedback and the
 * trail head naturally pulses on the click position because mousedown is
 * always preceded by mousemove that updates the trail.
 *
 * The canvas is `position: fixed; inset: 0` so it covers the viewport and
 * doesn't move with scroll. Listeners are on `window` so the effect tracks
 * the cursor regardless of which element it's hovering. `pointer-events: none`
 * keeps the canvas out of hit-testing — it's purely visual.
 *
 * Idle-skip pattern: when there's no live trail and the mouse isn't in
 * the document, we skip the entire clear+draw pipeline and just queue
 * the next rAF.
 *
 * Skipped on mobile (touch has no hover cursor) and on prefers-reduced-motion.
 */
export function CursorAura({ className = '' }: CursorAuraProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    if (!window.matchMedia('(min-width: 768px)').matches) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = 0
    let height = 0
    // Cap DPR at 1.5 instead of the usual 2 — the trail/ripple visuals are
    // soft, glow-driven, and don't reward extra subpixel detail. Halving
    // the pixel budget on a 3x retina cuts ~55% of the per-frame fill cost.
    let dpr = Math.min(window.devicePixelRatio || 1, 1.5)

    const trail: TrailPoint[] = []
    const mouse = { x: -9999, y: -9999, active: false }
    // hue cycles purely on resize / re-mount now (not per click) — keeps
    // the trail color shifting subtly without burning frame time on
    // click-spawned ripples that the user perceived as "click hangs".
    const baseHueIdx = 0
    // Track whether the canvas currently has anything painted. Lets us
    // skip the entire clear/draw pipeline on idle frames (no cursor active +
    // no live trail) — by far the most common state, since the cursor
    // sits still on text most of the time.
    let lastFrameDirty = false

    const resize = () => {
      // Site-wide canvas — sizes to the viewport, not a parent element.
      width = window.innerWidth
      height = window.innerHeight
      dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }
    resize()
    window.addEventListener('resize', resize)

    const HALO_R = 100

    const onMove = (e: MouseEvent) => {
      // Canvas is fixed at viewport (0,0), so clientX/Y maps directly.
      mouse.x = e.clientX
      mouse.y = e.clientY
      mouse.active = true
      const now = performance.now()
      const last = trail[trail.length - 1]
      // Skip near-duplicates so the trail length tracks gesture distance,
      // not event frequency.
      if (!last || (last.x - mouse.x) ** 2 + (last.y - mouse.y) ** 2 > 12) {
        trail.push({ x: mouse.x, y: mouse.y, t: now })
        if (trail.length > 36) trail.shift()
      }
    }
    // mouseout on documentElement with relatedTarget=null = cursor left the
    // window entirely. We use that as the "halo off" signal so the halo
    // doesn't linger at the page edge after the cursor goes to chrome.
    const onDocLeave = (e: MouseEvent) => {
      if (e.relatedTarget == null) mouse.active = false
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    document.documentElement.addEventListener('mouseout', onDocLeave)

    const TRAIL_FADE_MS = 700

    const frame = (now: number) => {
      while (trail.length && now - trail[0].t > TRAIL_FADE_MS) trail.shift()

      // Idle fast-path: nothing to draw → skip clear+draw entirely.
      const idle = !mouse.active && trail.length === 0
      if (idle) {
        if (lastFrameDirty) {
          ctx.clearRect(0, 0, width, height)
          lastFrameDirty = false
        }
        rafRef.current = requestAnimationFrame(frame)
        return
      }

      ctx.clearRect(0, 0, width, height)
      lastFrameDirty = true

      // 1. Soft cursor halo — only allocates a gradient when the cursor is
      // actually on the page (idle path above already returned otherwise).
      if (mouse.active) {
        const baseHue = HUES[baseHueIdx]
        const grad = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          HALO_R,
        )
        grad.addColorStop(0, `hsla(${baseHue}, 85%, 65%, 0.22)`)
        grad.addColorStop(0.45, `hsla(${baseHue}, 85%, 55%, 0.08)`)
        grad.addColorStop(1, 'transparent')
        ctx.fillStyle = grad
        ctx.fillRect(mouse.x - HALO_R, mouse.y - HALO_R, HALO_R * 2, HALO_R * 2)
      }

      // 2. Comet trail — stroke fading segments
      if (trail.length >= 2) {
        for (let i = 1; i < trail.length; i++) {
          const a = trail[i - 1]
          const b = trail[i]
          const ageMax = Math.max(now - a.t, now - b.t)
          const alpha = 1 - ageMax / TRAIL_FADE_MS
          if (alpha <= 0) continue
          const hueA = HUES[(baseHueIdx + i) % HUES.length]
          const hueB = HUES[(baseHueIdx + i + 1) % HUES.length]

          // Outer wide glow
          ctx.strokeStyle = `hsla(${hueA}, 90%, 60%, ${alpha * 0.32})`
          ctx.lineWidth = 9
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()

          // Bright inner core
          ctx.strokeStyle = `hsla(${hueB}, 95%, 75%, ${alpha * 0.85})`
          ctx.lineWidth = 1.8
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
        }
        // White-hot head
        const head = trail[trail.length - 1]
        const hue = HUES[baseHueIdx]
        const headR = 14
        const headGrad = ctx.createRadialGradient(
          head.x,
          head.y,
          0,
          head.x,
          head.y,
          headR,
        )
        headGrad.addColorStop(0, 'rgba(255,255,255,0.95)')
        headGrad.addColorStop(0.35, `hsla(${hue}, 95%, 70%, 0.7)`)
        headGrad.addColorStop(1, 'transparent')
        ctx.fillStyle = headGrad
        ctx.fillRect(head.x - headR, head.y - headR, headR * 2, headR * 2)
      }

      rafRef.current = requestAnimationFrame(frame)
    }
    rafRef.current = requestAnimationFrame(frame)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
      document.documentElement.removeEventListener('mouseout', onDocLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`fixed inset-0 pointer-events-none hidden md:block z-40 ${className}`}
    />
  )
}
