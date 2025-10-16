import { useParams } from 'react-router-dom'
import { useData } from '../contexts/DataContext'
import { BlogPostSEO } from '../components/seo/SEOHead'
import { BlogView } from '../components/blog/BlogView'
import { filterBySlug } from '../utils/data-filters'
import type { BlogPost } from '../types/data'

export function BlogDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { blog, loading } = useData()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  const blogPosts = filterBySlug<BlogPost>(slug || '', blog)
  const blogPost = blogPosts[0] || null

  return (
    <>
      {blogPost && (
        <BlogPostSEO
          title={blogPost.title}
          excerpt={blogPost.excerpt.replace(/<[^>]*>/g, '')}
          image={blogPost.image.url}
          slug={slug || ''}
          publishedDate={blogPost.publishedDate}
          modifiedDate={blogPost.modifiedDate}
          tags={blogPost.tags.map((tag) => tag.name)}
        />
      )}
      <BlogView blog={blogPost} />
    </>
  )
}
