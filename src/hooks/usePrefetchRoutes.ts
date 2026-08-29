import { useEffect } from 'react'

/**
 * usePrefetchRoutes — SPA-correct "speculation": the moment a pointer
 * hovers (or touch starts on) any internal link, the target route's lazy
 * chunk starts downloading, so the actual navigation is instant.
 * (The browser Speculation Rules API only covers full document loads,
 * not SPA route changes — this is the equivalent for our router.)
 *
 * One delegated listener, each chunk fetched at most once (dynamic
 * import() is cached), zero cost until the user shows intent.
 */

const PREFETCH: Array<[RegExp, () => Promise<unknown>]> = [
  [/^\/blog\/./, () => import('../pages/BlogDetail')],
  [/^\/blog$/, () => import('../pages/Blog')],
  [/^\/projects\/./, () => import('../pages/ProjectDetail')],
  [/^\/projects$/, () => import('../pages/Projects')],
  [/^\/career\/./, () => import('../pages/CareerDetail')],
  [/^\/career$/, () => import('../pages/Career')],
  [/^\/about$/, () => import('../pages/About')],
  [/^\/$/, () => import('../pages/Home')],
]

const warmed = new Set<string>()

function warm(href: string) {
  const path = href.split(/[?#]/)[0]
  if (warmed.has(path)) return
  for (const [re, load] of PREFETCH) {
    if (re.test(path)) {
      warmed.add(path)
      load().catch(() => warmed.delete(path))
      return
    }
  }
}

export function usePrefetchRoutes() {
  useEffect(() => {
    const onIntent = (e: Event) => {
      const a = (e.target as Element | null)?.closest?.('a[href^="/"]')
      if (a) warm(a.getAttribute('href') ?? '')
    }
    window.addEventListener('pointerover', onIntent, { passive: true })
    window.addEventListener('touchstart', onIntent, { passive: true })
    return () => {
      window.removeEventListener('pointerover', onIntent)
      window.removeEventListener('touchstart', onIntent)
    }
  }, [])
}
