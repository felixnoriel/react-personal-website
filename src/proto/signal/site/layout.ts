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

/** what the renderer script hands in: the shell template and a section-CSS reader */
export interface RenderCtx {
  template: string
  css(key: string): string
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
  const html = ctx.template.replace('<!--@head-->', head(p))
    .replace('<!--@styles-->', styles)
    .replace('<!--@header-->', shared.header)
    .replace('<!--@main-->', main)
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
