import { Link } from 'react-router-dom'
import { Button } from '../ui/button'
import type { BlogPost } from '../../types/data'

interface BlogViewProps {
  blog: BlogPost | null
}

export function BlogView({ blog }: BlogViewProps) {
  if (!blog) {
    return <div className="text-center py-20 text-muted-foreground">Blog post not found</div>
  }

  return (
    <section>
      <section className="container mx-auto max-w-4xl px-4 py-12">
        <h1
          className="text-4xl md:text-5xl font-bold text-center mb-6"
          dangerouslySetInnerHTML={{ __html: blog.title }}
        />
        <h2
          className="text-xl text-center text-muted-foreground mb-8"
          dangerouslySetInnerHTML={{ __html: blog.excerpt }}
        />
        {blog.image?.url && (
          <img className="w-full rounded-lg shadow-lg mb-8" src={blog.image.url} alt={blog.image.alt || blog.title} />
        )}
      </section>

      <section className="container mx-auto max-w-4xl px-4 pb-12">
        <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: blog.content }} />

        <SharePost blog={blog} />

        <div className="mt-12">
          <Link to="/blog">
            <Button variant="outline">
              <i className="fas fa-arrow-left mr-2" />
              Back to blog
            </Button>
          </Link>
        </div>
      </section>
    </section>
  )
}

function SharePost({ blog }: { blog: BlogPost }) {
  const shareToFacebook = () => {
    window.open(
      'https://www.facebook.com/sharer/sharer.php?u=' + window.location.href,
      'sharer',
      'width=626,height=436',
    )
  }

  const shareToTwitter = () => {
    window.open(
      'https://twitter.com/share?url=' + window.location.href + '&text=' + blog.title,
      'sharer',
      'width=626,height=436',
    )
  }

  const shareToLinkedIn = () => {
    window.open(
      'https://www.linkedin.com/sharing/share-offsite/?url=' + window.location.href,
      'sharer',
      'width=626,height=436',
    )
  }

  return (
    <div className="mt-12 pt-8 border-t">
      <p className="text-xl font-semibold mb-4">Share this post</p>
      <div className="flex gap-4">
        <button
          onClick={shareToFacebook}
          className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors"
          aria-label="Share on Facebook"
        >
          <i className="fab fa-facebook-f" />
        </button>
        <button
          onClick={shareToTwitter}
          className="w-12 h-12 rounded-full bg-sky-500 text-white flex items-center justify-center hover:bg-sky-600 transition-colors"
          aria-label="Share on Twitter"
        >
          <i className="fab fa-twitter" />
        </button>
        <button
          onClick={shareToLinkedIn}
          className="w-12 h-12 rounded-full bg-blue-700 text-white flex items-center justify-center hover:bg-blue-800 transition-colors"
          aria-label="Share on LinkedIn"
        >
          <i className="fab fa-linkedin-in" />
        </button>
      </div>
    </div>
  )
}
