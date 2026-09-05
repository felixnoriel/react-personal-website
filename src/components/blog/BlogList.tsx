import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Link } from 'react-router'
import type { BlogPostMeta } from '../../types/data'
import { formatDate } from '../../utils/date'
import { decodeEntities } from './decode'
import './blog.css'

interface BlogListProps {
  posts: BlogPostMeta[]
}

/* The two browser features this list uses, typed narrowly so neither needs a
   cast to `any` and neither can be called where it does not exist. */
type StartViewTransition = (arg: { update: () => void; types?: string[] }) => unknown
type HighlightRegistryLike = { set: (name: string, value: object) => void; delete: (name: string) => void }
type HighlightCtor = new (...ranges: Range[]) => object

const MAX_INK = 300

/**
 * /blog - the archive as an index sheet.
 *
 * Every post is one row: date, title, a dot leader, its first tag. No cards,
 * no covers, no invented dispatch numbers. Search and tag filtering are plain
 * controls above the index.
 *
 * Two things here are worth knowing:
 *
 *  - Filtering by tag runs inside a view transition typed `reorder`, so the
 *    rows travel to their new positions instead of jumping. Every row carries
 *    one `view-transition-name: match-element` declaration, which mints a
 *    unique name per element, so eighteen rows animate from one line of CSS.
 *    Without the API the list re-orders instantly, which is today's behaviour.
 *
 *  - Search matches are inked with the Custom Highlight API. It paints Range
 *    objects, so no <mark> is wrapped around anything, the DOM never changes,
 *    and the highlight cannot shift the layout. Engines without it show no
 *    highlight and the filtering still works.
 */
export function BlogList({ posts }: BlogListProps) {
  const [query, setQuery] = useState('')
  const [tag, setTag] = useState<string | null>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const searchId = useId()

  const rows = useMemo(
    () =>
      [...posts]
        .sort((a, b) => (a.publishedDate < b.publishedDate ? 1 : -1))
        .map((p) => ({ ...p, title: decodeEntities(p.title), excerpt: decodeEntities(p.excerpt) })),
    [posts],
  )

  const tags = useMemo(() => {
    const seen = new Set<string>()
    rows.forEach((p) => p.tags?.forEach((t) => seen.add(t.name)))
    return [...seen].sort()
  }, [rows])

  const needle = query.trim().toLowerCase()
  const visible = rows.filter((p) => {
    if (tag && !p.tags?.some((t) => t.name === tag)) return false
    if (!needle) return true
    return (p.title + ' ' + p.excerpt).toLowerCase().includes(needle)
  })

  // Tag changes re-order the list, which is the one place on the site where a
  // view transition is describing real movement rather than decorating a click.
  const selectTag = (next: string | null) => {
    const start = (document as Document & { startViewTransition?: StartViewTransition }).startViewTransition
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (typeof start !== 'function' || reduce) {
      setTag(next)
      return
    }
    try {
      start.call(document, { update: () => flushSync(() => setTag(next)), types: ['reorder'] })
    } catch {
      // engines that only know the callback form
      setTag(next)
    }
  }

  const shown = visible.length
  useEffect(() => {
    if (!('highlights' in CSS)) return
    const registry = (CSS as unknown as { highlights: HighlightRegistryLike }).highlights
    const Ctor = (window as unknown as { Highlight?: HighlightCtor }).Highlight
    const term = query.trim().toLowerCase()
    const root = listRef.current
    if (!Ctor || !term || !root) {
      registry.delete('search-ink')
      return
    }
    const ranges: Range[] = []
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    let node = walker.nextNode()
    while (node && ranges.length < MAX_INK) {
      const text = (node.nodeValue ?? '').toLowerCase()
      let at = text.indexOf(term)
      while (at !== -1 && ranges.length < MAX_INK) {
        const range = document.createRange()
        range.setStart(node, at)
        range.setEnd(node, at + term.length)
        ranges.push(range)
        at = text.indexOf(term, at + term.length)
      }
      node = walker.nextNode()
    }
    registry.set('search-ink', new Ctor(...ranges))
    return () => registry.delete('search-ink')
  }, [query, shown])

  return (
    <section className="section blog-index" aria-labelledby="blog-index-title">
      <div className="section__head">
        <h1 id="blog-index-title">Field notes from the road.</h1>
        <p className="meta meta--label">{rows.length} dispatches</p>
      </div>
      <p className="section__intro">
        Dispatches from the places I&apos;ve worked from, the teams I&apos;ve shipped with, and the roads in between.
      </p>

      <div className="blog-index__controls">
        <div className="blog-search">
          <label className="meta meta--label" htmlFor={searchId}>
            Search
          </label>
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
        </div>

        {tags.length > 0 && (
          <div className="blog-index__tags" role="group" aria-label="Filter by tag">
            <button type="button" className="chip blog-tag" aria-pressed={tag === null} onClick={() => selectTag(null)}>
              All
            </button>
            {tags.map((t) => (
              <button
                key={t}
                type="button"
                className="chip blog-tag"
                aria-pressed={tag === t}
                onClick={() => selectTag(t)}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      <ul className="blog-index__list" ref={listRef}>
        {visible.map((post) => (
          <li className="blog-index__row" key={post.slug}>
            <Link className="index-row blog-row" to={`/blog/${post.slug}`}>
              <span className="meta meta--pen">{formatDate(post.publishedDate, 'yyyy-MM-dd')}</span>
              <span className="blog-row__mid">
                <span className="blog-row__title">{post.title}</span>
                <span className="leader" aria-hidden="true" />
              </span>
              {post.tags?.[0] && <span className="meta blog-row__tag">{post.tags[0].name}</span>}
            </Link>
          </li>
        ))}
      </ul>

      {shown === 0 && <p className="blog-index__empty">Nothing here matches that.</p>}
    </section>
  )
}
