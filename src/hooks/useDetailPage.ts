import { useEffect, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * useReadingMinutes — estimate read time from HTML content.
 * Strips tags, counts words, divides by 220wpm (typical mid-tier reader
 * for technical content), rounds up, floors at 1.
 */
export function useReadingMinutes(html: string | undefined): number {
  return useMemo(() => {
    const plain = (html ?? '').replace(/<[^>]+>/g, ' ')
    const words = plain.split(/\s+/).filter(Boolean).length
    return Math.max(1, Math.ceil(words / 220))
  }, [html])
}

/**
 * useKeyboardNav — page-level keyboard shortcuts for detail pages:
 *   ←        prev item (if href provided)
 *   →        next item (if href provided)
 *   Esc      back to index page
 *   g g      smooth-scroll to top (vim-style)
 *
 * Skipped while focus is in a form field, when modifier keys are held,
 * and when the lightbox is open (yet-another-react-lightbox mounts a
 * `.yarl__root` element to <body>).
 */
export function useKeyboardNav({
  prevHref,
  nextHref,
  indexHref,
}: {
  prevHref?: string | null
  nextHref?: string | null
  indexHref: string
}) {
  const navigate = useNavigate()
  const lastG = useRef<number>(0)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      )
        return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (document.querySelector('.yarl__root')) return
      if (e.key === 'ArrowLeft' && prevHref) {
        navigate(prevHref)
      } else if (e.key === 'ArrowRight' && nextHref) {
        navigate(nextHref)
      } else if (e.key === 'Escape') {
        navigate(indexHref)
      } else if (e.key === 'g' || e.key === 'G') {
        const now = performance.now()
        if (now - lastG.current < 500) {
          window.scrollTo({ top: 0, behavior: 'smooth' })
          lastG.current = 0
        } else {
          lastG.current = now
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate, prevHref, nextHref, indexHref])
}

/**
 * useScrollSpy — track which section is currently "in focus" via
 * IntersectionObserver. Returns the active section id as the user scrolls.
 *
 * Default rootMargin shrinks the viewport so a section becomes "active"
 * as soon as it crosses into the upper third — feels more natural than
 * waiting for a section to fully enter view.
 */
export function useScrollSpy(
  sectionIds: string[],
  options?: { rootMargin?: string; threshold?: number[] },
): string {
  const fallback = sectionIds[0] ?? ''
  const [active, setActive] = useState<string>(fallback)
  // Re-run when the ids array changes (parent should memoize). Stringify
  // for stable dep comparison without double-effects on identical arrays.
  const ids = sectionIds.join('|')
  useEffect(() => {
    const els = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el != null)
    if (els.length === 0 || typeof IntersectionObserver === 'undefined') return
    const visibility = new Map<string, number>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) visibility.set(e.target.id, e.intersectionRatio)
        let best: { id: string; ratio: number } | null = null
        for (const id of sectionIds) {
          const ratio = visibility.get(id) ?? 0
          if (ratio > 0 && (!best || ratio > best.ratio)) best = { id, ratio }
        }
        if (best) setActive(best.id)
      },
      {
        rootMargin: options?.rootMargin ?? '-140px 0px -55% 0px',
        threshold: options?.threshold ?? [0, 0.25, 0.5, 0.75, 1],
      },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids, options?.rootMargin])
  return active
}

/**
 * useProseAnchors — augment every h2/h3 inside the referenced container
 * with an id (slugified from the text) plus a hover-reveal `#` link
 * for deep-linking. Smooth-scrolls + updates URL hash on click.
 *
 * Run as an effect against the rendered DOM because content typically
 * comes through `dangerouslySetInnerHTML`.
 */
export function useProseAnchors(
  ref: RefObject<HTMLElement | null>,
  deps: unknown[],
) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const headings = el.querySelectorAll<HTMLElement>('h2, h3')
    const slugify = (text: string) =>
      text
        .toLowerCase()
        .replace(/<[^>]+>/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    const used = new Set<string>()
    headings.forEach((h) => {
      if (h.dataset.anchorReady === '1') return
      let id = h.id || slugify(h.textContent || '')
      if (!id) return
      // Disambiguate duplicate slugs within the same article
      if (used.has(id)) {
        let i = 2
        while (used.has(`${id}-${i}`)) i++
        id = `${id}-${i}`
      }
      used.add(id)
      h.id = id
      h.classList.add(
        'scroll-mt-[140px]',
        'group/heading',
        'relative',
      )
      const link = document.createElement('a')
      link.href = `#${id}`
      link.setAttribute('aria-label', `Link to ${h.textContent} section`)
      link.className =
        'no-underline ml-2 text-ink-soft/40 hover:text-accent opacity-0 group-hover/heading:opacity-100 transition-opacity text-[0.8em] font-mono align-middle'
      link.textContent = '#'
      link.addEventListener('click', (e) => {
        e.preventDefault()
        const target = document.getElementById(id)
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        if (history.replaceState) history.replaceState(null, '', `#${id}`)
      })
      h.appendChild(link)
      h.dataset.anchorReady = '1'
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
