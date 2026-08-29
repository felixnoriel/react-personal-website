import { useEffect } from 'react'
import type { RefObject } from 'react'

export type ParallaxLayer = {
  ref: RefObject<HTMLElement | null>
  /** px of drift at full pointer deflection; sign sets direction
   *  (negative = against the cursor, i.e. reads as "closer"). */
  depth: number
}

/**
 * useDepthParallax — pointer-depth rig for the hero. Each registered
 * layer drifts a few px with the cursor at its own depth, so the
 * whole scene reads as 3D layers floating over the shader.
 *
 * Writes the CSS `translate` property (NOT `transform`), so it
 * composes freely with framer-motion's inline transform on the same
 * element and with the scroll-driven exit animation on ancestors.
 *
 * One eased rAF loop that sleeps once settled; hard-pauses when the
 * section is offscreen. Caller gates it (desktop-only via useFxLevel).
 */
export function useDepthParallax(
  sectionRef: RefObject<HTMLElement | null>,
  layers: ParallaxLayer[],
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) return
    const section = sectionRef.current
    if (!section) return

    let raf = 0
    let inView = true
    const cur = { x: 0, y: 0 }
    const tgt = { x: 0, y: 0 }

    const tick = () => {
      raf = 0
      cur.x += (tgt.x - cur.x) * 0.07
      cur.y += (tgt.y - cur.y) * 0.07
      for (const { ref, depth } of layers) {
        const el = ref.current
        if (el) {
          el.style.translate = `${(cur.x * depth).toFixed(2)}px ${(cur.y * depth * 0.75).toFixed(2)}px`
        }
      }
      const settled =
        Math.abs(tgt.x - cur.x) < 0.003 && Math.abs(tgt.y - cur.y) < 0.003
      if (!settled) raf = requestAnimationFrame(tick)
    }

    const wake = () => {
      if (!raf && inView && !document.hidden) raf = requestAnimationFrame(tick)
    }

    const onMove = (e: PointerEvent) => {
      tgt.x = (e.clientX / window.innerWidth - 0.5) * 2
      tgt.y = (e.clientY / window.innerHeight - 0.5) * 2
      wake()
    }

    const io = new IntersectionObserver((entries) => {
      inView = entries[0]?.isIntersecting ?? true
      if (inView) wake()
    })
    io.observe(section)
    window.addEventListener('pointermove', onMove, { passive: true })

    return () => {
      if (raf) cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener('pointermove', onMove)
      for (const { ref } of layers) ref.current?.style.removeProperty('translate')
    }
  }, [sectionRef, layers, enabled])
}
