/**
 * Gives each prerendered page <link rel="modulepreload"> tags for the route
 * chunks IT needs, so the browser fetches them in parallel with the entry
 * script instead of discovering them one round-trip later.
 *
 * Vite only sees one HTML template, and vite-prerender-plugin stamps that
 * template onto every route, so an HTML-transform plugin can only preload one
 * route's chunks for all pages (the old approach pushed the home page's ~50 KB
 * onto /about and every blog post). This runs after the build instead, maps
 * each page path to its route module, and expands that module's static import
 * chain through the build manifest. Blog posts also get their own body chunk.
 */
import { existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const DIST = 'dist'
const MANIFEST = join(DIST, '.vite', 'manifest.json')

interface ManifestChunk {
  file: string
  imports?: string[]
}

/** page path -> the source modules that route renders */
const ROUTES: Array<[RegExp, (m: RegExpMatchArray) => string[]]> = [
  [/^\/$/, () => ['src/pages/Home.tsx']],
  [/^\/about$/, () => ['src/pages/About.tsx']],
  [/^\/career$/, () => ['src/pages/Career.tsx']],
  [/^\/career\/[^/]+$/, () => ['src/pages/CareerDetail.tsx']],
  [/^\/projects$/, () => ['src/pages/Projects.tsx']],
  [/^\/projects\/[^/]+$/, () => ['src/pages/ProjectDetail.tsx']],
  [/^\/blog$/, () => ['src/pages/Blog.tsx']],
  [/^\/blog\/([^/]+)$/, (m) => ['src/pages/BlogDetail.tsx', `src/data/blog-content/${m[1]}.ts`]],
  [/^\/404$/, () => ['src/pages/NotFound.tsx']],
]

function pages(dir: string, base = ''): Array<[string, string]> {
  const out: Array<[string, string]> = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out.push(...pages(p, `${base}/${name}`))
    else if (name === 'index.html') out.push([base || '/', p])
  }
  return out
}

if (!existsSync(MANIFEST)) {
  console.error('route-preloads: dist/.vite/manifest.json missing - is build.manifest on?')
  process.exit(1)
}
const manifest: Record<string, ManifestChunk> = JSON.parse(readFileSync(MANIFEST, 'utf8'))

function filesFor(modules: string[]): string[] {
  const files = new Set<string>()
  const visit = (key: string) => {
    const chunk = manifest[key]
    if (!chunk || files.has(chunk.file)) return
    files.add(chunk.file)
    chunk.imports?.forEach(visit)
  }
  for (const m of modules) {
    if (!manifest[m]) {
      console.error(`route-preloads: ${m} is not in the build manifest`)
      process.exit(1)
    }
    visit(m)
  }
  return [...files]
}

const all = pages(DIST)
let tagged = 0
for (const [route, file] of all) {
  const hit = ROUTES.map((r) => [r[1], route.match(r[0])] as const).find(([, m]) => m)
  if (!hit) {
    console.error(`route-preloads: no route module known for ${route}`)
    process.exit(1)
  }
  const [modulesOf, m] = hit
  const html = readFileSync(file, 'utf8')
  const tags = filesFor(modulesOf(m!))
    .filter((f) => !html.includes(`/${f}`))
    .map((f) => `<link rel="modulepreload" crossorigin href="/${f}">`)
  writeFileSync(file, html.replace('</head>', `${tags.join('')}</head>`))
  tagged += tags.length
}
rmSync(join(DIST, '.vite'), { recursive: true, force: true })
console.log(`route-preloads: ${tagged} preload tags written across ${all.length} pages`)
