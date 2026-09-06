/**
 * SIGNAL — page-to-page motion. The site is real pages, so this uses the
 * cross-document View Transition API (Chrome 126+, Safari 18.2+; other
 * browsers get an ordinary navigation): the header and the page title
 * carry stable names in CSS, and the element that was clicked hands its
 * name to the next page's title so a card grows into its page. Links to
 * other pages are also prefetched on hover, so the next page is already
 * in the cache when the click lands.
 */
type PageSwapEvent = Event & { viewTransition?: unknown; activation?: { entry?: { url?: string } } }
type PageRevealEvent = Event & { viewTransition?: { types?: Set<string> } | null }

const same = (u: string) => {
  try {
    const x = new URL(u, location.href)
    return x.origin === location.origin ? x.pathname : null
  } catch {
    return null
  }
}

export function initTransitions() {
  // the card that was clicked names its title so the destination H1 can pair with it
  let lastClicked: HTMLElement | null = null
  addEventListener('pointerdown', (e) => {
    const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
    lastClicked = a && same(a.href) ? a : null
  })
  addEventListener('pageswap', (ev) => {
    const e = ev as PageSwapEvent
    if (!e.viewTransition || !lastClicked) return
    const title = lastClicked.querySelector<HTMLElement>('[data-vt="title"]') || lastClicked.querySelector<HTMLElement>('h2, h3')
    if (title) title.style.viewTransitionName = 'page-title'
  })
  addEventListener('pagereveal', (ev) => {
    const e = ev as PageRevealEvent
    if (!e.viewTransition) return
    const h1 = document.querySelector<HTMLElement>('main h1')
    if (h1) h1.style.viewTransitionName = 'page-title'
    // the name must be unique: drop it once the transition has finished
    ;(e.viewTransition as unknown as { finished?: Promise<void> }).finished?.then(() => {
      if (h1) h1.style.viewTransitionName = ''
    })
  })

  // hover / touch prefetch of internal pages
  const done = new Set<string>()
  const prefetch = (href: string) => {
    const p = same(href)
    if (!p || done.has(p) || p === location.pathname) return
    done.add(p)
    const l = document.createElement('link')
    l.rel = 'prefetch'
    l.href = p
    l.as = 'document'
    document.head.appendChild(l)
  }
  addEventListener('pointerover', (e) => {
    const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
    if (a) prefetch(a.href)
  }, { passive: true })
  addEventListener('touchstart', (e) => {
    const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
    if (a) prefetch(a.href)
  }, { passive: true })
}
