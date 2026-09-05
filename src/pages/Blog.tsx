import { useData } from '../contexts/DataContext'
import { SEOHead } from '../components/seo/SEOHead'
import { BlogList } from '../components/blog/BlogList'

/** /blog - the whole archive as one index sheet. */
export function Blog() {
  const { blog } = useData()

  return (
    <>
      <SEOHead
        title="Blog"
        description="I am also a foodie and love traveling. Check out my blog posts about food, travel, and technology."
        url="/blog"
      />
      <BlogList posts={blog} />
    </>
  )
}
