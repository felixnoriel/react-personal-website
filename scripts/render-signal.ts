/**
 * Renders every route of the SIGNAL site to a static HTML file under
 * proto/signal/<path>/index.html, from proto/signal/template.html, the
 * section renderers (home) and the page groups (career, projects, blog,
 * about, 404). Re-run after changing content or any renderer:
 * `bun run proto:render`.
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { PAGE } from '../src/proto/signal/sections/all'
import { allPages } from '../src/proto/signal/site/pages/index'
import { renderPage } from '../src/proto/signal/site/layout'

const ROOT = join(import.meta.dirname, '..')
const OUT = join(ROOT, 'proto', 'signal')
const SECTIONS = join(ROOT, 'src', 'proto', 'signal', 'sections')
const ctx = {
  template: readFileSync(join(ROOT, 'proto', 'signal', 'template.html'), 'utf8'),
  css(key: string) {
    const f = join(SECTIONS, `${key}.css`)
    return existsSync(f) ? `      /* ---- ${key} ---- */\n` + readFileSync(f, 'utf8') : ''
  },
}

const shared = {
  header: safe(() => PAGE.header(), '<header class="rail-top mono"><b>FELIX NORIEL</b></header>'),
  after: safe(() => PAGE.after(), ''),
  consoleCss: ctx.css('console'),
}

function safe<T>(fn: () => T, fallback: T, label = 'shared'): T {
  try {
    return fn()
  } catch (e) {
    console.warn(`render-signal: ${label} failed (${e instanceof Error ? e.message : e})`)
    return fallback
  }
}

let pages
try {
  pages = allPages()
} catch (e) {
  console.error(`render-signal: a page group failed to load: ${e instanceof Error ? e.message : e}`)
  process.exit(1)
}

let written = 0
const seen = new Set<string>()
for (const p of pages) {
  if (seen.has(p.path)) {
    console.warn(`render-signal: duplicate route ${p.path} skipped`)
    continue
  }
  seen.add(p.path)
  const html = safe(() => renderPage(p, shared, ctx), '', p.path)
  if (!html) continue
  const dir = join(OUT, p.path)
  mkdirSync(dir, { recursive: true })
  const file = join(dir, 'index.html')
  if (!existsSync(file) || readFileSync(file, 'utf8') !== html) writeFileSync(file, html)
  written++
}
console.log(`render-signal: ${written} pages under proto/signal/`)
