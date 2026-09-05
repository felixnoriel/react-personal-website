// No helmet: React 19 hoists <title>, <meta> and <link> rendered anywhere in
// the tree straight into <head>, on the build-time render and on the client
// alike. React does NOT de-duplicate titles, so exactly ONE SEOHead (or
// BlogPostSEO) renders per page.
//
// JSON-LD is a plain <script> in the body on purpose: React only hoists
// async scripts, and structured data is valid anywhere in the document.

export const SITE = {
  name: 'Felix Noriel',
  title: 'Felix Noriel - Software Engineer',
  description:
    'Product-Focused Software Engineer who loves solving problems and getting my hands dirty with new technologies. Big foodie, loves cooking and traveling.',
  url: 'https://felixnoriel-dashify.vercel.app',
  image: '/og.png',
  imageWidth: 1200,
  imageHeight: 630,
  imageAlt: 'Felix Noriel. Product Engineer. Startups, Web3, Fintech.',
  email: 'norielfelixjr@gmail.com',
  sameAs: [
    'https://www.linkedin.com/in/felixnoriel/',
    'https://github.com/felixnoriel',
    'https://www.facebook.com/felixnoriel',
    'https://www.instagram.com/felixnoriel/',
  ],
}

const absolute = (u: string) => (u.startsWith('http') ? u : `${SITE.url}${u}`)

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
  /** extra JSON-LD graph nodes for this page */
  jsonLd?: Record<string, unknown>
  /** keep the page out of search results (the 404 sheet) */
  noindex?: boolean
}

export function SEOHead({
  title,
  description = SITE.description,
  image = SITE.image,
  url = SITE.url,
  type = 'website',
  article,
  jsonLd,
  noindex = false,
}: SEOHeadProps) {
  const fullTitle = title ? `${title} | ${SITE.name}` : SITE.title
  const fullUrl = absolute(url)
  const fullImage = absolute(image)
  const ownImage = image === SITE.image

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={fullUrl} />

      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      {ownImage && <meta property="og:image:width" content={String(SITE.imageWidth)} />}
      {ownImage && <meta property="og:image:height" content={String(SITE.imageHeight)} />}
      {ownImage && <meta property="og:image:alt" content={SITE.imageAlt} />}
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content={SITE.name} />

      {type === 'article' && article?.publishedTime && (
        <meta property="article:published_time" content={article.publishedTime} />
      )}
      {type === 'article' && article?.modifiedTime && (
        <meta property="article:modified_time" content={article.modifiedTime} />
      )}
      {type === 'article' && article?.author && <meta property="article:author" content={article.author} />}
      {type === 'article' && article?.tags?.map((tag) => <meta key={tag} property="article:tag" content={tag} />)}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />

      <meta name="robots" content={noindex ? 'noindex' : 'index, follow'} />

      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
    </>
  )
}

/** The home page's entity: who Felix is, in the vocabulary crawlers read. */
export function personJsonLd(input: { knowsAbout: string[]; worksFor: { name: string; url?: string }[] }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: SITE.name,
      jobTitle: 'Product Engineer',
      description: SITE.description,
      email: `mailto:${SITE.email}`,
      url: SITE.url,
      image: absolute(SITE.image),
      sameAs: SITE.sameAs,
      knowsAbout: input.knowsAbout,
      worksFor: input.worksFor.map((w) => ({ '@type': 'Organization', ...w })),
      homeLocation: { '@type': 'Place', name: 'Bangkok, Thailand' },
    },
  }
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
    <SEOHead
      title={title}
      description={excerpt}
      image={image}
      url={`/blog/${slug}`}
      type="article"
      article={{ publishedTime: publishedDate, modifiedTime: modifiedDate, author: SITE.name, tags }}
      jsonLd={{
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: title,
        description: excerpt,
        image: image ? absolute(image) : undefined,
        datePublished: publishedDate,
        dateModified: modifiedDate,
        author: { '@type': 'Person', name: SITE.name, url: SITE.url },
        keywords: tags?.join(', '),
        mainEntityOfPage: `${SITE.url}/blog/${slug}`,
      }}
    />
  )
}
