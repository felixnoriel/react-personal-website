/**
 * Writes dist/sitemap.xml from the pages the prerender step actually
 * produced, so the sitemap can never list a route that does not exist or
 * point at a domain the site no longer lives on. Each entry uses the page's
 * own canonical URL; pages marked noindex (the 404 sheet) are left out, and
 * blog posts carry their published date as lastmod.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const DIST = 'dist'

function pages(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out.push(...pages(p))
    else if (name === 'index.html') out.push(p)
  }
  return out
}

const attr = (html: string, re: RegExp) => html.match(re)?.[1]

const entries: string[] = []
for (const file of pages(DIST).sort()) {
  const html = readFileSync(file, 'utf8')
  if (/<meta[^>]*name="robots"[^>]*content="noindex"/.test(html)) continue
  const loc = attr(html, /<link[^>]*rel="canonical"[^>]*href="([^"]+)"/)
  if (!loc) {
    console.error(`build-sitemap: ${file} has no canonical link`)
    process.exit(1)
  }
  const lastmod = attr(html, /<meta[^>]*property="article:modified_time"[^>]*content="([^"]+)"/)
    ?? attr(html, /<meta[^>]*property="article:published_time"[^>]*content="([^"]+)"/)
  entries.push(
    `  <url><loc>${loc}</loc>${lastmod ? `<lastmod>${lastmod.slice(0, 10)}</lastmod>` : ''}</url>`,
  )
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`
writeFileSync(join(DIST, 'sitemap.xml'), xml)
console.log(`build-sitemap: ${entries.length} urls written to dist/sitemap.xml`)
