/**
 * Wires every section's behaviour once the scene exists. Each page loads
 * only the modules it renders: the home page's sections, or the page
 * group's module. The console (header, palette, terminal) is on every page.
 * Modules load as separate chunks so no page evaluates code it never runs.
 */
import type { Scene } from '../scene'

type Init = (scene: Scene) => void
type Loader = () => Promise<{ init: Init }>

const HOME: [string, Loader][] = [
  ['experience', () => import('./experience')],
  ['work', () => import('./work')],
  ['skills', () => import('./skills')],
  ['nomad', () => import('./nomad')],
  ['writing', () => import('./writing')],
  ['contact', () => import('./contact')],
]
const PAGES: [string, Loader][] = [
  ['/career/', () => import('./pages-career')],
  ['/projects/', () => import('./pages-projects')],
  ['/blog/', () => import('./pages-blog')],
  ['/about/', () => import('./pages-about')],
  ['/404/', () => import('./pages-about')],
]

export function initSections(scene: Scene) {
  const page = document.querySelector<HTMLElement>('main[data-page]')?.dataset.page || '/'
  const wanted: [string, Loader][] = [['console', () => import('./console')]]
  if (page === '/') wanted.push(...HOME)
  else wanted.push(...PAGES.filter(([prefix]) => page.startsWith(prefix)))
  const T = (window as Window & { __timing?: Record<string, number> }).__timing
  for (const [key, load] of wanted) {
    load()
      .then((m) => {
        const t0 = performance.now()
        try {
          m.init(scene)
        } catch (e) {
          // one section must never take the page down
          if (import.meta.env.DEV) throw e
        }
        if (T) T['init:' + key] = Math.round((performance.now() - t0) * 10) / 10
      })
      .catch(() => {
        /* a missing chunk leaves the static page as it is */
      })
  }
}
