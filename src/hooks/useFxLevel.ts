import { useEffect, useState } from 'react'

/**
 * useFxLevel — single source of truth for "should I run heavy decorative
 * animations" decisions across the site.
 *
 * Returns three signals:
 *   - reduceMotion: user has `prefers-reduced-motion: reduce`
 *   - isMobile:     viewport is below the md breakpoint (<768px)
 *   - disableHeavyFx: true if EITHER of the above. This is the flag most
 *     decorative code should gate on — kills the work for both touch
 *     phones (perf) and a11y users (preference) in one check.
 *
 * Why a hook (not a constant): both can change at runtime. A user can
 * resize their window, rotate their phone, or toggle the system reduce-
 * motion setting. We listen to MediaQueryList change events so components
 * re-render with fresh values.
 *
 * SSR-safe: starts with `disableHeavyFx: true` (the conservative default —
 * no heavy animations until we're sure the client is a desktop with no
 * reduce-motion preference). Hydrates to the real values on mount.
 */
export function useFxLevel() {
  const [state, setState] = useState(() => ({
    reduceMotion: true,
    isMobile: true,
    disableHeavyFx: true,
  }))

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const rmq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const dmq = window.matchMedia('(min-width: 768px)')

    const sync = () => {
      const reduceMotion = rmq.matches
      const isMobile = !dmq.matches
      setState({
        reduceMotion,
        isMobile,
        disableHeavyFx: reduceMotion || isMobile,
      })
    }
    sync()

    rmq.addEventListener?.('change', sync)
    dmq.addEventListener?.('change', sync)
    return () => {
      rmq.removeEventListener?.('change', sync)
      dmq.removeEventListener?.('change', sync)
    }
  }, [])

  return state
}
