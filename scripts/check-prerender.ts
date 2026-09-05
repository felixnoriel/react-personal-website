/**
 * Every sheet is really in the static HTML.
 *
 * The whole point of prerendering is that crawlers, link unfurlers and the
 * first paint get the finished page without JavaScript. This asserts one
 * known string from each home-page sheet, the head tags that unfurls need,
 * and a sample of the detail pages.
 *
 *   bun scripts/check-prerender.ts
 */
import { readFileSync, existsSync } from 'node:fs'

const read = (p: string) => {
  if (!existsSync(p)) throw new Error(`${p} missing`)
  return readFileSync(p, 'utf8')
}

const home = read('dist/index.html')

const HOME_STRINGS: Array<[string, string]> = [
  ['hero h1', 'Product Engineer'],
  ['hero bio', 'technical co-founder'],
  ['hero metric', '7.5M+'],
  ['experience title', 'A decade of building with small, sharp teams.'],
  ['experience row', 'Genopets'],
  ['work title', 'shipped and scaled'],
  ['parts title', 'Tools and tech I reach for every day.'],
  ['parts row', 'PostgreSQL'],
  ['field notes title', 'Nomading across Asia with the fam and a laptop.'],
  ['writing title', 'Field notes from the road.'],
  ['contact title', 'Got something in mind?'],
  ['footer', 'MIT-licensed curiosity'],
  ['head description', 'name="description"'],
  ['head og:image', 'property="og:image"'],
  ['head canonical', 'rel="canonical"'],
  ['json-ld person', '"@type":"Person"'],
  ['inlined stylesheet', '<style>'],
  ['font preload', 'rel="preload" as="font"'],
]

const PAGES: Array<[string, string]> = [
  ['dist/career/genopets/index.html', 'Senior Full Stack Engineer'],
  ['dist/projects/dashify/index.html', 'Dashify'],
  ['dist/blog/first-skydiving-experience/index.html', 'Tandem'],
  ['dist/about/index.html', 'digital nomading with the fam'],
  ['dist/career/index.html', 'Yondu'],
  ['dist/projects/index.html', 'The CEO Magazine Intranet'],
  ['dist/blog/index.html', 'Macau'],
  ['dist/404.html', 'Not in this set.'],
]

const failures: string[] = []
for (const [label, needle] of HOME_STRINGS) {
  if (!home.includes(needle)) failures.push(`home: ${label} ("${needle}") not in dist/index.html`)
}
for (const [file, needle] of PAGES) {
  try {
    if (!read(file).includes(needle)) failures.push(`${file}: "${needle}" missing`)
  } catch (e) {
    failures.push(String(e instanceof Error ? e.message : e))
  }
}
if (/loading…|<div class="sheet-loading"/.test(home)) failures.push('home: a Suspense fallback is in the static HTML')

if (failures.length) {
  console.error(`check-prerender: ${failures.length} failure(s)\n` + failures.join('\n'))
  process.exit(1)
}
console.log(`check-prerender: ${HOME_STRINGS.length + PAGES.length} assertions passed`)
