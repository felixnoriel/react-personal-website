import { useMemo } from 'react'
import { Link } from 'react-router'
import type { BlogPost } from '../../types/data'
import { Picture } from '../Picture'
import { IMAGES as blogImages } from '../../data/images/blog.generated'
import { SITE } from '../seo/SEOHead'
import { useData } from '../../contexts/DataContext'
import { formatDate } from '../../utils/date'
import { decodeEntities } from './decode'
import { liftHeadings } from '../../utils/headings'
import './blog.css'

interface BlogViewProps {
  blog: BlogPost | null
}

/* The body already carries the post's own <h1> from the old CMS. The page
   sets that title itself, so the duplicate is dropped rather than shipped as
   a second first-level heading. */
const stripLeadingTitle = (html: string) => html.replace(/^\s*<h1[^>]*>[\s\S]*?<\/h1>/i, '')

/**
 * /blog/:slug - one dispatch, set as the next sheet in the set.
 *
 * The title, the rule under it and the cover plate are the three elements the
 * Sheet Change transition morphs into, so they keep the class names motion.css
 * names. Everything else is plain: one 36rem column of prose against the
 * datum, the share row as three ordinary links, and the neighbouring posts on
 * the bottom rule.
 */
export function BlogView({ blog }: BlogViewProps) {
  const { blog: index } = useData()

  const neighbours = useMemo(() => {
    if (!blog) return { prev: null, next: null }
    const ordered = [...index].sort((a, b) => (a.publishedDate < b.publishedDate ? 1 : -1))
    const at = ordered.findIndex((p) => p.slug === blog.slug)
    return {
      prev: at > 0 ? ordered[at - 1] : null,
      next: at !== -1 && at < ordered.length - 1 ? ordered[at + 1] : null,
    }
  }, [index, blog])

  if (!blog) {
    return (
      <section className="section blog-detail">
        <div className="blog-missing">
          <h1 className="detail__title">Not on the shelf.</h1>
          <p className="ink-2">That post is not in the archive.</p>
          <Link className="link" to="/blog">
            The archive
          </Link>
        </div>
      </section>
    )
  }

  const title = decodeEntities(blog.title)
  const url = `${SITE.url}/blog/${blog.slug}`
  const share = [
    { label: 'Share on Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    {
      label: 'Share on Twitter',
      href: `https://twitter.com/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    },
    {
      label: 'Share on LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
  ]

  return (
    <article className="section blog-detail">
      <p className="blog-detail__crumb">
        <Link className="link" to="/blog">
          The archive
        </Link>
      </p>

      <h1 className="detail__title">{title}</h1>
      <p className="meta meta--pen blog-detail__date">{formatDate(blog.publishedDate, 'yyyy-MM-dd')}</p>
      <div className="detail__rule" aria-hidden="true" />

      {blog.image?.url && (
        <div className="plate detail__plate">
          <Picture
            src={blog.image.url}
            from={blogImages}
            alt={blog.image.alt ? decodeEntities(blog.image.alt) : title}
            sizes="(min-width: 900px) 704px, 100vw"
            priority
          />
        </div>
      )}

      <div className="prose-sheet" dangerouslySetInnerHTML={{ __html: liftHeadings(stripLeadingTitle(blog.content)) }} />

      {blog.tags?.length > 0 && (
        <ul className="blog-detail__chips">
          {blog.tags.map((t) => (
            <li className="chip" key={t.slug}>
              {t.name}
            </li>
          ))}
        </ul>
      )}

      <div className="blog-detail__share">
        <span className="meta meta--label">Share</span>
        {share.map((s) => (
          <a className="link" key={s.label} href={s.href} target="_blank" rel="noreferrer">
            {s.label}
            <span className="visually-hidden">opens in a new tab</span>
          </a>
        ))}
      </div>

      {(neighbours.prev || neighbours.next) && (
        <nav className="blog-detail__nav" aria-label="More posts">
          {neighbours.prev && (
            <Link to={`/blog/${neighbours.prev.slug}`}>
              <span className="meta">Previous</span>
              <span className="blog-detail__nav-title">{decodeEntities(neighbours.prev.title)}</span>
            </Link>
          )}
          {neighbours.next && (
            <Link className="is-next" to={`/blog/${neighbours.next.slug}`}>
              <span className="meta">Next</span>
              <span className="blog-detail__nav-title">{decodeEntities(neighbours.next.title)}</span>
            </Link>
          )}
        </nav>
      )}
    </article>
  )
}
