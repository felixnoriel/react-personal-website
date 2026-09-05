/**
 * Sheet Change - the site's one motion showpiece.
 *
 * Click a career row or a project block and the page does not blank or
 * cross-fade: the row becomes the next sheet. Its title travels into the
 * detail page's H1, its rule re-draws at the new scale, its plate grows into
 * the header plate, and the datum re-draws to the new sheet's length. Press
 * Back and it runs in reverse.
 *
 * It is the browser's own View Transition API driven by hand around React
 * Router's declarative `navigate` - no library, no framework mode. About
 * sixty lines.
 *
 * Rules that make it hold:
 *  - Cross-route pairs need an EXPLICIT shared name. `match-element` cannot
 *    pair two different DOM elements, so the source row is named
 *    imperatively the instant before the transition and cleared after.
 *  - A duplicate name aborts the transition, so at most one element on the
 *    page carries each name at any time.
 *  - The target route's code is fetched before the swap. Every route is
 *    React.lazy, and a swap that lands on a Suspense fallback would morph the
 *    title into a spinner.
 *  - Reduced motion never snapshots anything: it navigates directly.
 *  - Failure mode everywhere is an instant navigation, which is today's
 *    behaviour.
 */
import { flushSync } from 'react-dom'
import type { NavigateFunction } from 'react-router'

type Dir = 'forward' | 'back'
export const PAIR_NAMES = ['sheet-title', 'sheet-rule', 'sheet-plate'] as const
export type PairName = (typeof PAIR_NAMES)[number]

interface ViewTransitionLike {
  finished: Promise<void>
  ready: Promise<void>
  updateCallbackDone: Promise<void>
}
type StartVT = (
  arg: (() => void | Promise<void>) | { update: () => void | Promise<void>; types?: string[] },
) => ViewTransitionLike

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined'

const supported = () => isBrowser && typeof (document as unknown as { startViewTransition?: StartVT }).startViewTransition === 'function'
const reduceMotion = () => isBrowser && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** The slug whose list row should pair with the outgoing detail sheet on Back. */
let returnTarget: string | null = null
export function getReturnTarget(): string | null {
  return returnTarget
}

/* Location-change signalling. App.tsx calls notifyLocationChange() from an
   effect on every route change, so the transition can wait for the router
   to have committed the new sheet before the new snapshot is taken. */
const waiters = new Set<() => void>()
export function notifyLocationChange(): void {
  waiters.forEach((w) => w())
}
function nextLocationChange(timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    const done = () => {
      waiters.delete(done)
      clearTimeout(t)
      resolve()
    }
    const t = setTimeout(done, timeoutMs)
    waiters.add(done)
  })
}

/** Resolves once `test()` is truthy, polled per frame, or after `timeoutMs`. */
function waitFor(test: () => unknown, timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    const started = performance.now()
    const tick = () => {
      if (test() || performance.now() - started > timeoutMs) resolve()
      else requestAnimationFrame(tick)
    }
    tick()
  })
}

function startVT(update: () => void | Promise<void>, dir: Dir): ViewTransitionLike {
  const start = (document as unknown as { startViewTransition: StartVT }).startViewTransition.bind(document)
  // `sheet` selects the morph's CSS; `back` is added on a history traversal.
  const types = dir === 'back' ? ['sheet', 'back'] : ['sheet']
  try {
    // object form with `types`: Baseline 2026-01-13. Older engines throw.
    return start({ update, types })
  } catch {
    return start(update)
  }
}

function nameChildren(source: Element, names: readonly PairName[]): HTMLElement[] {
  const named: HTMLElement[] = []
  for (const n of names) {
    const el = source.querySelector<HTMLElement>(`[data-vt="${n}"]`)
    if (el) {
      el.style.viewTransitionName = n
      named.push(el)
    }
  }
  return named
}
const unname = (els: HTMLElement[]) => els.forEach((el) => (el.style.viewTransitionName = ''))

/** On a phone only two layers are named: the title and the plate. */
const pairNamesForViewport = (): readonly PairName[] =>
  window.matchMedia('(max-width: 640px)').matches ? ['sheet-title', 'sheet-plate'] : PAIR_NAMES

export interface SheetChangeOptions {
  /** the clicked row or block; its [data-vt] children are the pairs */
  source: HTMLElement
  /** the route to open */
  to: string
  /** the row's slug, so the row can pair again on the way back */
  slug: string
  navigate: NavigateFunction
  /** the target route's chunk, e.g. () => import('../pages/CareerDetail') */
  prefetch?: () => Promise<unknown>
}

export async function sheetChange({ source, to, slug, navigate, prefetch }: SheetChangeOptions): Promise<void> {
  const run = () => navigate(to)
  if (!supported() || reduceMotion()) {
    run()
    return
  }
  if (prefetch) {
    // usePrefetchRoutes already warms the chunk on hover, so this is usually
    // instant; the race keeps a cold cache from feeling like a hang.
    await Promise.race([prefetch().catch(() => undefined), new Promise((r) => setTimeout(r, 700))])
  }
  const named = nameChildren(source, pairNamesForViewport())
  returnTarget = slug
  const vt = startVT(async () => {
    flushSync(run)
    // React.lazy resolves on a microtask even when the module is cached, so
    // the first committed frame can be the Suspense fallback. The old
    // snapshot stays on screen while we wait for the real sheet to land.
    await waitFor(() => document.querySelector('[data-sheet-ready]'), 500)
  }, 'forward')
  vt.finished.finally(() => unname(named))
}

/* Back and Forward. The router owns history; the Navigation API is only READ
   here, to learn that a traversal is happening and in which direction, so the
   same transition can run in reverse. Chrome 102 / Firefox 147 / Safari 26.2;
   elsewhere Back is an instant navigation. */
interface NavigateEventLike extends Event {
  navigationType: string
  destination: { index: number }
}
interface NavigationLike extends EventTarget {
  currentEntry?: { index: number } | null
}

if (isBrowser && 'navigation' in window) {
  const nav = (window as unknown as { navigation: NavigationLike }).navigation
  nav.addEventListener('navigate', (ev) => {
    const e = ev as NavigateEventLike
    if (e.navigationType !== 'traverse' || !supported() || reduceMotion()) return
    const from = nav.currentEntry?.index ?? -1
    const to = e.destination?.index ?? -1
    const dir: Dir = to !== -1 && to < from ? 'back' : 'forward'
    const target = returnTarget
    let named: HTMLElement[] = []
    const vt = startVT(async () => {
      await nextLocationChange(600)
      await waitFor(() => document.querySelector('[data-sheet-ready]'), 300)
      // the row we left from pairs with the sheet we are leaving
      if (dir === 'back' && target) {
        const row = document.querySelector<HTMLElement>(`[data-slug="${CSS.escape(target)}"]`)
        if (row) named = nameChildren(row, pairNamesForViewport())
      }
    }, dir)
    vt.finished.finally(() => {
      unname(named)
      if (dir === 'back') returnTarget = null
    })
  })
}
