/**
 * SIGNAL — the page shell every route is rendered through.
 *
 * One real HTML file per page: the template's head (tokens, base CSS,
 * fonts) plus this page's own section CSS, per-page <head> metadata, the
 * shared header from the console owner, the page's main markup and the
 * shared after-main markup (palette, dialogs). The core canvas and the rail
 * are in the template, so every page ignites the same way.
 */
export const SITE = {
  name: 'Felix Noriel',
  url: 'https://felixnoriel-dashify.vercel.app',
  /** the site lives under this prefix while it is a preview next to the old site */
  base: '/proto/signal',
  description:
    'Product-Focused Software Engineer who loves solving problems and getting my hands dirty with new technologies. Big foodie, loves cooking and traveling.',
  image: '/og.png',
}

export interface PageSpec {
  /** route path with a trailing slash, e.g. '/career/genopets/' ('/' for home) */
  path: string
  /** <title> without the site suffix; '' for the home page */
  title: string
  description: string
  /** absolute or site-relative image for og:image */
  image?: string
  /** 'article' for blog posts */
  type?: 'website' | 'article'
  jsonLd?: Record<string, unknown>
  /** the shape the core holds on this page (index into shapes/index.ts) */
  shape?: number
  /** the section CSS files (keys under sections/) to inline for this page */
  css: string[]
  /** the <main> contents */
  main: string
  /** anything extra for <head> (preloads, per-page style) */
  head?: string
  /** robots noindex (404) */
  noindex?: boolean
}

/** what the renderer script hands in: the shell template, a section-CSS reader and the image manifests */
export interface RenderCtx {
  template: string
  css(key: string): string
  /** original URL → optimized variants (src/data/images/*.generated.ts, merged) */
  images: Record<string, OptimizedImage>
}

export interface ImageVariant {
  src: string
  w: number
}
export interface OptimizedImage {
  width: number
  height: number
  avif: ImageVariant[]
  webp: ImageVariant[]
  fallback: string
  lqip: string
  svg?: string
}

const srcset = (v: ImageVariant[]) => v.map((x) => `${x.src} ${x.w}w`).join(', ')

/**
 * Every <img> whose src is in the manifests becomes a sized, lazy <picture>
 * served from this site (AVIF, then WebP): the original hosts refuse every
 * origin but production, and a remote image can shift layout. Images already
 * inside a <picture>, and anything without a manifest entry, are left alone.
 */
export function localizeImages(html: string, images: Record<string, OptimizedImage>): string {
  return html.replace(/<picture\b[\s\S]*?<\/picture>|<img\b[^>]*>/g, (tag) => {
    if (tag.startsWith('<picture')) return tag
    const m = tag.match(/\bsrc=(?:"([^"]*)"|'([^']*)')/)
    const url = m?.[1] ?? m?.[2]
    if (!url) return tag
    const img = images[url]
    if (!img) return tag
    if (img.svg) return tag.replace(url, img.svg)
    const attr = (name: string) => tag.match(new RegExp(`\\b${name}=(?:"([^"]*)"|'([^']*)')`))
    const alt = attr('alt')?.[1] ?? attr('alt')?.[2] ?? ''
    const cls = attr('class')?.[1] ?? attr('class')?.[2]
    const sizes = attr('sizes')?.[1] ?? attr('sizes')?.[2] ?? '(min-width: 900px) 720px, 100vw'
    const style = attr('style')?.[1] ?? attr('style')?.[2]
    const eager = /\bloading=["']eager["']|\bfetchpriority=["']high["']/.test(tag)
    const w = attr('width')?.[1] ?? String(img.width)
    const h = attr('height')?.[1] ?? String(img.height)
    const extra = tag.match(/\bdata-[a-z0-9-]+=(?:"[^"]*"|'[^']*')/g)?.join(' ') ?? ''
    return (
      `<picture>` +
      (img.avif.length ? `<source type="image/avif" srcset="${srcset(img.avif)}" sizes="${sizes}">` : '') +
      (img.webp.length ? `<source type="image/webp" srcset="${srcset(img.webp)}" sizes="${sizes}">` : '') +
      `<img src="${img.fallback}" alt="${esc(alt)}" width="${w}" height="${h}"${cls ? ` class="${cls}"` : ''}` +
      `${style ? ` style="${style}"` : img.lqip ? ` style="background:url(${img.lqip}) center/cover"` : ''}` +
      ` loading="${eager ? 'eager' : 'lazy'}" decoding="async"${eager ? ' fetchpriority="high"' : ''}${extra ? ' ' + extra : ''}></picture>`
    )
  })
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
const abs = (u: string) => (u.startsWith('http') ? u : SITE.url + u)

export function head(p: PageSpec): string {
  const full = p.title ? `${p.title} | ${SITE.name}` : `${SITE.name} — Product Engineer`
  const url = SITE.url + SITE.base + p.path
  const image = abs(p.image || SITE.image)
  const lines = [
    `<title>${esc(full)}</title>`,
    `<meta name="description" content="${esc(p.description)}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta name="robots" content="${p.noindex ? 'noindex' : 'index, follow'}" />`,
    `<meta property="og:type" content="${p.type || 'website'}" />`,
    `<meta property="og:title" content="${esc(full)}" />`,
    `<meta property="og:description" content="${esc(p.description)}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:site_name" content="${SITE.name}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(full)}" />`,
    `<meta name="twitter:description" content="${esc(p.description)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    p.jsonLd ? `<script type="application/ld+json">${JSON.stringify(p.jsonLd).replace(/</g, '\\u003c')}</script>` : '',
    p.head || '',
  ]
  return lines.filter(Boolean).join('\n    ')
}

export function renderPage(p: PageSpec, shared: { header: string; after: string; consoleCss: string }, ctx: RenderCtx): string {
  const styles = [...p.css.map((k) => ctx.css(k)), shared.consoleCss].filter(Boolean).join('\n')
  const main = `    <main${p.shape !== undefined ? ` data-shape="${p.shape}"` : ''} data-page="${p.path}">\n${p.main}\n    </main>`
  // the header knows from the markup whether it is on a subpage, so its
  // phone layout is right at first paint (a class added later by script
  // re-laid the header and rescaled the mobile viewport: a layout shift)
  const header = p.path === '/' ? shared.header : shared.header.replace('class="rail-top mono hdr', 'class="rail-top mono hdr subpage')
  const html = ctx.template.replace('<!--@head-->', head(p))
    .replace('<!--@styles-->', styles)
    .replace('<!--@header-->', header)
    .replace('<!--@main-->', localizeImages(main, ctx.images))
    .replace('<!--@after-->', shared.after)
  return rebase(html)
}

/** internal links are written site-relative ("/career/genopets/"); while the
 *  site previews under SITE.base they must point there. Once it moves to the
 *  root, base is '' and this is the identity. */
export function rebase(html: string): string {
  if (!SITE.base) return html
  return html.replace(/(href|action)="\/(?!proto\/|assets\/|img\/|src\/|[a-z]+:)([^"#]*)("|#)/g, (m, attr, rest, tail) => {
    const path = '/' + rest
    // only routes of this site; static files (og.png, fonts) stay at the root
    if (/^\/(career|projects|blog|about|404)(\/|$)/.test(path) || path === '/') return `${attr}="${SITE.base}${path}${tail}`
    return m
  })
}

/** blog and project bodies come from a CMS: make their images lazy and sized */
export function tidyProse(html: string): string {
  return html
    .replace(/<img\b(?![^>]*\bloading=)/g, '<img loading="lazy" decoding="async"')
    .replace(/\btarget='_blank'/g, 'target="_blank" rel="noopener"')
}
