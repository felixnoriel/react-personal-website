import { Helmet } from 'react-helmet-async'

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
    'Software Engineer who loves solving problems and getting my hands dirty with new technologies. Big foodie, loves cooking and traveling.',
  image: 'https://whoisfelix.com/og-image.jpg',
  url: 'https://whoisfelix.com',
  siteName: 'Felix Noriel',
  twitterHandle: '@felixnoriel',
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
    <Helmet>
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
      {type === 'article' && article && (
        <>
          {article.publishedTime && <meta property="article:published_time" content={article.publishedTime} />}
          {article.modifiedTime && <meta property="article:modified_time" content={article.modifiedTime} />}
          {article.author && <meta property="article:author" content={article.author} />}
          {article.tags && article.tags.map((tag) => <meta key={tag} property="article:tag" content={tag} />)}
        </>
      )}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={defaultMeta.twitterHandle} />
      <meta name="twitter:creator" content={defaultMeta.twitterHandle} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Additional SEO */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
    </Helmet>
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

export function BlogPostSEO({ title, excerpt, image, slug, publishedDate, modifiedDate, tags }: BlogPostSEOProps) {
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
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
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
          })}
        </script>
      </Helmet>
    </>
  )
}
