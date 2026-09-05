// No helmet: React 19 hoists <title>, <meta> and <link> rendered anywhere in
// the tree straight into <head>, on the server render and on the client alike.
// React does NOT de-duplicate titles, so exactly ONE of these may render per
// page — every page component renders a single SEOHead (or BlogPostSEO).
//
// The JSON-LD block is deliberately a plain <script> in the body: React only
// hoists async scripts, and structured data is valid anywhere in the document.

interface SEOHeadProps {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: 'website' | 'article'
  article?: {
    publishedTime?: string
    modifiedTime?: string
    author?: string
    tags?: string[]
  }
}

const defaultMeta = {
  title: 'Felix Noriel - Software Engineer',
  description:
    'Product-Focused Software Engineer who loves solving problems and getting my hands dirty with new technologies. Big foodie, loves cooking and traveling.',
  image:
    'https://media.licdn.com/dms/image/v2/C5603AQELrWWM8qWfTA/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1595380035576?e=1762387200&v=beta&t=evvVd9G1ZHlqC1HBM6SfEZn81AQg2SevcgwHCtQmoao',
  url: 'https://felixnoriel-dashify.vercel.app',
  siteName: 'Felix Noriel',
}

export function SEOHead({
  title,
  description = defaultMeta.description,
  image = defaultMeta.image,
  url = defaultMeta.url,
  type = 'website',
  article,
}: SEOHeadProps) {
  const fullTitle = title ? `${title} | ${defaultMeta.siteName}` : defaultMeta.title
  const fullUrl = url.startsWith('http') ? url : `${defaultMeta.url}${url}`

  return (
    <>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content={defaultMeta.siteName} />

      {/* Article Specific Meta Tags */}
      {type === 'article' && article?.publishedTime && (
        <meta property="article:published_time" content={article.publishedTime} />
      )}
      {type === 'article' && article?.modifiedTime && (
        <meta property="article:modified_time" content={article.modifiedTime} />
      )}
      {type === 'article' && article?.author && (
        <meta property="article:author" content={article.author} />
      )}
      {type === 'article' &&
        article?.tags?.map((tag) => <meta key={tag} property="article:tag" content={tag} />)}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Additional SEO */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
    </>
  )
}

interface BlogPostSEOProps {
  title: string
  excerpt: string
  image?: string
  slug: string
  publishedDate?: string
  modifiedDate?: string
  tags?: string[]
}

export function BlogPostSEO({
  title,
  excerpt,
  image,
  slug,
  publishedDate,
  modifiedDate,
  tags,
}: BlogPostSEOProps) {
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description: excerpt,
    image: image,
    datePublished: publishedDate,
    dateModified: modifiedDate,
    author: {
      '@type': 'Person',
      name: 'Felix Noriel',
    },
    keywords: tags?.join(', '),
    // `</script>` inside a JSON string would end the tag early — neutralise it.
  }).replace(/</g, '\\u003c')

  return (
    <>
      <SEOHead
        title={title}
        description={excerpt}
        image={image}
        url={`/blog/${slug}`}
        type="article"
        article={{
          publishedTime: publishedDate,
          modifiedTime: modifiedDate,
          author: 'Felix Noriel',
          tags,
        }}
      />
      {/* JSON-LD Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
    </>
  )
}
