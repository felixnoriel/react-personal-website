import { useData } from '../contexts/DataContext'
import { SEOHead } from '../components/seo/SEOHead'
import { BlogList } from '../components/blog/BlogList'

export function Blog() {
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

  return (
    <>
      <SEOHead
        title="Blog"
        description="I am also a foodie and love traveling. Check out my blog posts about food, travel, and technology."
        url="/blog"
      />
      <BlogList blogList={blog} indexPage={false} />
    </>
  )
}
