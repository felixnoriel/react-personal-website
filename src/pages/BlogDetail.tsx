import { Suspense, use } from 'react'
import { useParams } from 'react-router'
import { useData } from '../contexts/DataContext'
import { BlogPostSEO } from '../components/seo/SEOHead'
import { BlogView } from '../components/blog/BlogView'
import { filterBySlug } from '../utils/data-filters'
import { loadBlogContent } from '../data/blog-content'
import type { BlogPost, BlogPostMeta } from '../types/data'

function DetailLoading() {
  return <div className="section" aria-label="Loading" />
}

// Reads the post body via React 19's `use()`. Suspends until the content
// chunk for this slug has loaded - during build-time prerendering, that
// wait is what lets the crawler get full HTML instead of a loading state.
function BlogBody({ meta }: { meta: BlogPostMeta }) {
  const content = use(loadBlogContent(meta.slug))
  const blog: BlogPost = { ...meta, content }
  return <BlogView blog={blog} />
}

export function BlogDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { blog: blogIndex } = useData()

  const metas = filterBySlug<BlogPostMeta>(slug || '', blogIndex)
  const meta = metas[0] || null

  // No matching post - render the "not found" state directly rather than
  // suspending on a slug that has no content chunk to load.
  if (!meta) {
    return <BlogView blog={null} />
  }

  return (
    <>
      <BlogPostSEO
        title={meta.title}
        excerpt={meta.excerpt.replace(/<[^>]*>/g, '')}
        image={meta.image.url}
        slug={slug || ''}
        publishedDate={meta.publishedDate}
        modifiedDate={meta.modifiedDate}
        tags={meta.tags.map((tag) => tag.name)}
      />
      <Suspense fallback={<DetailLoading />}>
        <BlogBody meta={meta} />
      </Suspense>
    </>
  )
}
