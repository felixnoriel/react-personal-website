/**
 * Renders proto/signal/index.html from proto/signal/template.html and the
 * section renderers under src/proto/signal/sections/*.html.ts, so every
 * section's markup is real HTML at first paint and comes from the same
 * data files the rest of the site uses. Re-run after changing content or a
 * section: `bun run proto:render`.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { PAGE } from '../src/proto/signal/sections/all'

const ROOT = join(import.meta.dirname, '..')
const DIR = join(ROOT, 'src', 'proto', 'signal', 'sections')
const template = readFileSync(join(ROOT, 'proto', 'signal', 'template.html'), 'utf8')

const styles: string[] = []
const bodies: string[] = []
for (const s of PAGE.sections) {
  const css = join(DIR, `${s.key}.css`)
  if (existsSync(css)) styles.push(`      /* ---- ${s.key} ---- */\n` + readFileSync(css, 'utf8'))
  try {
    bodies.push(s.render())
  } catch (e) {
    // one section mid-edit must not block the others: keep its slot, say so
    console.warn(`render-signal: ${s.key} failed to render (${e instanceof Error ? e.message : e}); left empty`)
    bodies.push(`      <!-- ${s.key}: render failed -->`)
  }
}
const headerCss = join(DIR, 'console.css')
if (existsSync(headerCss)) styles.push(`      /* ---- console ---- */\n` + readFileSync(headerCss, 'utf8'))

let html = template
  .replace('<!--@styles-->', styles.join('\n'))
  .replace('<!--@header-->', PAGE.header())
  .replace('<!--@sections-->', bodies.join('\n'))
  .replace('<!--@after-->', PAGE.after())

const out = join(ROOT, 'proto', 'signal', 'index.html')
writeFileSync(out, html)
console.log(`render-signal: ${PAGE.sections.length} sections, ${Math.round(html.length / 1024)} KB -> proto/signal/index.html`)
