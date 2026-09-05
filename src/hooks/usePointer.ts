import { useSyncExternalStore } from 'react'

/**
 * Two real signals instead of a viewport-width guess:
 *  - fine pointer + hover: the device can hover, so hover-dependent
 *    affordances make sense (a touch laptop and a small desktop both qualify)
 *  - reduced motion: the person asked for none
 * Both are read with useSyncExternalStore so the build-time render (no
 * window) and the first client render agree: neither is assumed until the
 * browser says so.
 */
function subscribe(query: string) {
  return (cb: () => void) => {
    if (typeof window === 'undefined') return () => {}
    const mq = window.matchMedia(query)
    mq.addEventListener('change', cb)
    return () => mq.removeEventListener('change', cb)
  }
}
const snapshot = (query: string) => () => typeof window !== 'undefined' && window.matchMedia(query).matches
const serverSnapshot = () => false

const FINE = '(any-hover: hover) and (any-pointer: fine)'
const REDUCE = '(prefers-reduced-motion: reduce)'

export function usePointerFine(): boolean {
  return useSyncExternalStore(subscribe(FINE), snapshot(FINE), serverSnapshot)
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe(REDUCE), snapshot(REDUCE), serverSnapshot)
}
