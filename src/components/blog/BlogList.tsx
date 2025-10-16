import { Link } from 'react-router-dom'
import { Card, CardContent } from '../ui/card'
import { ViewAllLink } from '../ViewAllLink'
import type { BlogPost } from '../../types/data'

interface BlogListProps {
  blogList: BlogPost[]
  indexPage?: boolean
}

export function BlogList({ blogList, indexPage }: BlogListProps) {
  return (
    <div>
      <section className="bg-muted py-20 text-center">
        <div className="container mx-auto max-w-7xl px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog</h1>
          <h2 className="text-xl md:text-2xl text-muted-foreground">I am also a foodie and love traveling</h2>
        </div>
      </section>

      <section className="py-12 container mx-auto max-w-7xl px-4">
        <BlogListContent blogList={blogList} />
        <ViewAllLink route="blog" indexPage={indexPage} />
      </section>
    </div>
  )
}

function BlogListContent({ blogList }: { blogList: BlogPost[] }) {
  if (!blogList || !Array.isArray(blogList)) {
    return <div className="text-center text-muted-foreground">No blog posts found</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {blogList.map((blog: BlogPost) => (
        <BlogItem key={blog.slug} blog={blog} />
      ))}
    </div>
  )
}

function BlogItem({ blog }: { blog: BlogPost }) {
  if (!blog) {
    return null
  }

  return (
    <Link to={`/blog/${blog.slug}`} className="block group">
      <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow">
        {blog.image?.url && (
          <figure className="aspect-video overflow-hidden">
            <img
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              alt={blog.image.alt || blog.title}
              src={blog.image.url}
            />
          </figure>
        )}
        <CardContent className="p-6">
          <p className="text-xl font-semibold mb-3 line-clamp-2" dangerouslySetInnerHTML={{ __html: blog.title }} />
          <div
            className="text-sm text-muted-foreground line-clamp-3"
            dangerouslySetInnerHTML={{ __html: blog.excerpt }}
          />
          <p className="text-primary mt-4 flex items-center gap-2 group-hover:gap-3 transition-all">
            View
            <i className="fas fa-arrow-right text-sm" />
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}
