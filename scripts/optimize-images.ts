/**
 * Build-time image optimization pipeline.
 *
 * Walks the STRUCTURED image fields of the content data (career.ts, projects.ts,
 * blog.ts, and the hard-coded travel photos in FieldNotesSheet.tsx) - never the
 * inline HTML `content` strings - downloads each source once, converts it to
 * AVIF + WebP at capped widths, writes the files under public/img/, and emits
 * one typed manifest per content group (src/data/images/<group>.generated.ts)
 * so components can render a zero-CLS <picture> with real width/height and
 * small bytes. The manifests are split so a page only ships the entries it can
 * render: the project galleries alone are three quarters of the total and are
 * only ever drawn on /projects/:slug.
 *
 * Run: `bun scripts/optimize-images.ts` (also wired up as `bun run images`,
 * and as the first step of `bun run build`).
 *
 * Idempotency: a small cache at .cache/images/cache.json records, per source
 * URL, the HTTP validators (ETag / Last-Modified / Content-Length) and a sha256
 * hash of the downloaded bytes from the last successful run. On a re-run we
 * first send a HEAD request; if the validators match the cache AND every
 * output file the cache remembers still exists on disk, we skip the download
 * and the (expensive) sharp encode entirely. If HEAD is unsupported/blocked we
 * fall back to a GET and compare the content hash instead. Either way, a
 * source is only ever re-encoded when it actually changed or an output is
 * missing.
 */

import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import sharp from 'sharp'

import { careers } from '../src/data/career.ts'
import { projects } from '../src/data/projects.ts'
import { blogPosts } from '../src/data/blog.ts'
import type { ImageVariant, OptimizedImage } from '../src/types/images.ts'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ROOT = join(import.meta.dirname, '..')
const OUT_DIR = join(ROOT, 'public', 'img')
const CACHE_DIR = join(ROOT, '.cache', 'images')
const CACHE_FILE = join(CACHE_DIR, 'cache.json')
const MANIFEST_DIR = join(ROOT, 'src', 'data', 'images')
const FIELD_NOTES_FILE = join(ROOT, 'src', 'sheets', 'FieldNotesSheet.tsx')

/** Which pages can draw an image. Each group becomes its own manifest file. */
type Group = 'career' | 'projects' | 'galleries' | 'blog' | 'site'
const GROUPS: Group[] = ['career', 'projects', 'galleries', 'blog', 'site']

// 200 exists for the fixed small slots (company logos at 88px, gallery thumbs);
// without it the browser's smallest choice for an 88px logo was the 480 file.
const WIDTHS = [200, 480, 960, 1600] as const
const AVIF_QUALITY = 55
const WEBP_QUALITY = 78
const LQIP_WIDTH = 24
const LQIP_QUALITY = 40
const CONCURRENCY = 6

// felixstatic S3 buckets 403 unless the request looks like it came from a
// browser that was referred by the old dashify preview deployment.
const FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
  Referer: 'https://felixnoriel-dashify.vercel.app/',
} as const

const FETCH_TIMEOUT_MS = 20_000

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CacheEntry {
  /** the width ladder the outputs were encoded with; a changed ladder re-encodes */
  widths?: string
  etag?: string
  lastModified?: string
  contentLength?: number
  sourceHash: string
  isSvg: boolean
  width: number
  height: number
  inputBytes: number
  outputBytes: number
  outputs: string[] // absolute paths on disk, for existence checks
  manifest: OptimizedImage
}

type Cache = Record<string, CacheEntry>

interface ImageRef {
  url: string
  refs: string[] // human-readable "where this came from", for logging only
  groups: Set<Group> // which manifests the entry is written to
}

type Outcome =
  | { status: 'ok'; url: string; cached: boolean; inputBytes: number; outputBytes: number }
  | { status: 'skipped-local'; url: string }
  | { status: 'failed'; url: string; reason: string }

// ---------------------------------------------------------------------------
// 1. Collect every URL from the structured data fields
// ---------------------------------------------------------------------------

function collectImageRefs(): ImageRef[] {
  const byUrl = new Map<string, ImageRef>()
  const add = (url: string | undefined, ref: string, group: Group) => {
    if (!url) return
    const existing = byUrl.get(url)
    if (existing) {
      existing.refs.push(ref)
      existing.groups.add(group)
    } else byUrl.set(url, { url, refs: [ref], groups: new Set([group]) })
  }

  for (const c of careers) {
    add(c.image?.url, `career:${c.slug}.image`, 'career')
    add(c.banner?.url, `career:${c.slug}.banner`, 'career')
  }
  for (const p of projects) {
    add(p.image?.url, `project:${p.slug}.image`, 'projects')
    add(p.company?.image?.url, `project:${p.slug}.company.image`, 'projects')
    for (const [i, g] of (p.gallery ?? []).entries()) {
      add(g.url, `project:${p.slug}.gallery[${i}]`, 'galleries')
    }
  }
  for (const b of blogPosts) {
    add(b.image?.url, `blog:${b.slug}.image`, 'blog')
  }

  // FieldNotesSheet.tsx hard-codes its travel photos in a local PLACES array.
  // A .tsx component cannot be imported here, so the Unsplash URLs are pulled
  // straight out of the source text instead.
  const fieldNotesSource = readFileSync(FIELD_NOTES_FILE, 'utf-8')
  const unsplashUrls = fieldNotesSource.match(/https:\/\/images\.unsplash\.com\/[^'"]+/g) ?? []
  for (const [i, url] of unsplashUrls.entries()) {
    add(url, `FieldNotesSheet.tsx:PLACES[${i}].image`, 'site')
  }

  return [...byUrl.values()]
}

// ---------------------------------------------------------------------------
// 2. Slugging - stable, short, filesystem-safe, collision-safe
// ---------------------------------------------------------------------------

function shortHash(input: string): string {
  return createHash('sha1').update(input).digest('hex').slice(0, 8)
}

function slugify(urlStr: string): string {
  let pathname: string
  try {
    pathname = new URL(urlStr).pathname
  } catch {
    pathname = urlStr
  }
  const noExt = pathname.replace(/\.[a-zA-Z0-9]+$/, '')
  const segments = noExt.split('/').filter(Boolean)
  let slug = segments.slice(-3).join('-').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  if (slug.length > 50) slug = slug.slice(-50).replace(/^-+/, '')
  return `${slug || 'img'}-${shortHash(urlStr)}`
}

// ---------------------------------------------------------------------------
// 3. Networking helpers
// ---------------------------------------------------------------------------

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    return await promise
  } finally {
    clearTimeout(timer)
  }
}

async function headRequest(url: string): Promise<Response | undefined> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    try {
      const res = await fetch(url, { method: 'HEAD', headers: FETCH_HEADERS, signal: controller.signal })
      return res
    } finally {
      clearTimeout(timer)
    }
  } catch {
    return undefined // HEAD unsupported/blocked - caller falls back to GET
  }
}

async function getRequest(url: string): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    return await fetch(url, { method: 'GET', headers: FETCH_HEADERS, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

const WIDTH_KEY = WIDTHS.join(',')

/** the cache entry is reusable only if every output is on disk AND it was
 *  encoded with the current width ladder */
function outputsCurrent(entry: CacheEntry): boolean {
  return entry.widths === WIDTH_KEY && entry.outputs.length > 0 && entry.outputs.every((p) => existsSync(p))
}

// ---------------------------------------------------------------------------
// 4. Per-image processing
// ---------------------------------------------------------------------------

function isSvgUrl(url: string): boolean {
  try {
    return new URL(url).pathname.toLowerCase().endsWith('.svg')
  } catch {
    return url.toLowerCase().endsWith('.svg')
  }
}

function parseSvgIntrinsicSize(svg: string): { width: number; height: number } {
  const widthAttr = svg.match(/<svg[^>]*\swidth="([\d.]+)(?:px)?"/i)
  const heightAttr = svg.match(/<svg[^>]*\sheight="([\d.]+)(?:px)?"/i)
  if (widthAttr && heightAttr) {
    return { width: Math.round(Number(widthAttr[1])), height: Math.round(Number(heightAttr[1])) }
  }
  const viewBox = svg.match(/viewBox="([\d.\-]+)\s+([\d.\-]+)\s+([\d.]+)\s+([\d.]+)"/i)
  if (viewBox) {
    return { width: Math.round(Number(viewBox[3])), height: Math.round(Number(viewBox[4])) }
  }
  return { width: 300, height: 150 } // last-resort fallback, logged by the caller
}

async function processSvg(url: string, buffer: Buffer, slug: string): Promise<{ manifest: OptimizedImage; outputs: string[] }> {
  const svgText = buffer.toString('utf-8')
  const { width, height } = parseSvgIntrinsicSize(svgText)
  const outPath = join(OUT_DIR, `${slug}.svg`)
  writeFileSync(outPath, buffer)
  const publicPath = `/img/${slug}.svg`
  return {
    manifest: { width, height, avif: [], webp: [], fallback: publicPath, lqip: '', svg: publicPath },
    outputs: [outPath],
  }
}

async function processRaster(url: string, buffer: Buffer, slug: string): Promise<{ manifest: OptimizedImage; outputs: string[] }> {
  const source = sharp(buffer)
  const metadata = await source.metadata()
  const sourceWidth = metadata.width ?? 0
  const sourceHeight = metadata.height ?? 0
  if (!sourceWidth || !sourceHeight) {
    throw new Error('could not read image dimensions')
  }

  let candidateWidths = WIDTHS.filter((w) => w <= sourceWidth)
  if (candidateWidths.length === 0) candidateWidths = [sourceWidth] // never upscale

  const outputs: string[] = []
  const avif: ImageVariant[] = []
  const webp: ImageVariant[] = []

  for (const w of candidateWidths) {
    const resized = sharp(buffer).resize({ width: w, withoutEnlargement: true })

    const avifPath = join(OUT_DIR, `${slug}-${w}.avif`)
    await resized.clone().avif({ quality: AVIF_QUALITY }).toFile(avifPath)
    avif.push({ src: `/img/${slug}-${w}.avif`, w })
    outputs.push(avifPath)

    const webpPath = join(OUT_DIR, `${slug}-${w}.webp`)
    await resized.clone().webp({ quality: WEBP_QUALITY }).toFile(webpPath)
    webp.push({ src: `/img/${slug}-${w}.webp`, w })
    outputs.push(webpPath)
  }

  const lqipBuffer = await sharp(buffer)
    .resize({ width: LQIP_WIDTH, withoutEnlargement: true })
    .webp({ quality: LQIP_QUALITY })
    .toBuffer()
  const lqip = `data:image/webp;base64,${lqipBuffer.toString('base64')}`

  const largestWebp = webp[webp.length - 1]
  return {
    manifest: {
      width: sourceWidth,
      height: sourceHeight,
      avif,
      webp,
      fallback: largestWebp.src,
      lqip,
    },
    outputs,
  }
}

// ---------------------------------------------------------------------------
// 5. Cache
// ---------------------------------------------------------------------------

function loadCache(): Cache {
  if (!existsSync(CACHE_FILE)) return {}
  try {
    return JSON.parse(readFileSync(CACHE_FILE, 'utf-8'))
  } catch {
    console.warn(`  ! could not parse ${CACHE_FILE}, starting with an empty cache`)
    return {}
  }
}

function saveCache(cache: Cache) {
  mkdirSync(CACHE_DIR, { recursive: true })
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2))
}

// ---------------------------------------------------------------------------
// 6. Concurrency-limited pool
// ---------------------------------------------------------------------------

async function pool<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0
  async function runner() {
    while (next < items.length) {
      const i = next++
      results[i] = await worker(items[i])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runner))
  return results
}

// ---------------------------------------------------------------------------
// 7. Main per-URL pipeline
// ---------------------------------------------------------------------------

async function processOne(
  ref: ImageRef,
  cache: Cache,
  manifest: Record<string, OptimizedImage>,
): Promise<Outcome> {
  const { url } = ref

  if (!/^https?:\/\//i.test(url)) {
    console.log(`  - skip (local path, not on disk): ${url}  [${ref.refs.join(', ')}]`)
    return { status: 'skipped-local', url }
  }

  const cached = cache[url]

  // Fast path: HEAD request + validator comparison, no download at all.
  if (cached && outputsCurrent(cached)) {
    const head = await headRequest(url)
    if (head && head.ok) {
      const etag = head.headers.get('etag') ?? undefined
      const lastModified = head.headers.get('last-modified') ?? undefined
      const contentLength = Number(head.headers.get('content-length') ?? NaN)
      const validatorsKnown = Boolean(etag || lastModified || Number.isFinite(contentLength))
      const unchanged =
        validatorsKnown &&
        etag === cached.etag &&
        lastModified === cached.lastModified &&
        (Number.isFinite(contentLength) ? contentLength === cached.contentLength : true)
      if (unchanged) {
        manifest[url] = cached.manifest
        console.log(`  = cached (unchanged): ${url}`)
        return { status: 'ok', url, cached: true, inputBytes: cached.inputBytes, outputBytes: cached.outputBytes }
      }
    }
  }

  // Slow path: download and compare content hash.
  let res: Response
  try {
    res = await getRequest(url)
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err)
    console.warn(`  x failed (network error): ${url} - ${reason}`)
    return { status: 'failed', url, reason }
  }
  if (!res.ok) {
    console.warn(`  x failed (HTTP ${res.status}): ${url}`)
    return { status: 'failed', url, reason: `HTTP ${res.status}` }
  }

  const arrayBuffer = await res.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const sourceHash = createHash('sha256').update(buffer).digest('hex')

  if (cached && cached.sourceHash === sourceHash && outputsCurrent(cached)) {
    manifest[url] = cached.manifest
    console.log(`  = cached (same content hash): ${url}`)
    return { status: 'ok', url, cached: true, inputBytes: cached.inputBytes, outputBytes: cached.outputBytes }
  }

  const slug = slugify(url)
  mkdirSync(OUT_DIR, { recursive: true })

  try {
    const isSvg = isSvgUrl(url)
    const { manifest: entryManifest, outputs } = isSvg
      ? await processSvg(url, buffer, slug)
      : await processRaster(url, buffer, slug)

    const outputBytes = outputs.reduce((sum, p) => sum + statSync(p).size, 0)

    cache[url] = {
      widths: WIDTH_KEY,
      etag: res.headers.get('etag') ?? undefined,
      lastModified: res.headers.get('last-modified') ?? undefined,
      contentLength: Number(res.headers.get('content-length') ?? buffer.byteLength),
      sourceHash,
      isSvg,
      width: entryManifest.width,
      height: entryManifest.height,
      inputBytes: buffer.byteLength,
      outputBytes,
      outputs,
      manifest: entryManifest,
    }
    manifest[url] = entryManifest
    console.log(
      `  + processed: ${url} -> ${slug}${isSvg ? '.svg (copied as-is)' : ` (${entryManifest.width}x${entryManifest.height}, ${outputs.length} files)`}`,
    )
    return { status: 'ok', url, cached: false, inputBytes: buffer.byteLength, outputBytes }
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err)
    console.warn(`  x failed (processing error): ${url} - ${reason}`)
    return { status: 'failed', url, reason }
  }
}

// ---------------------------------------------------------------------------
// 8. Manifest emission
// ---------------------------------------------------------------------------

function emitManifests(refs: ImageRef[], manifest: Record<string, OptimizedImage>) {
  mkdirSync(MANIFEST_DIR, { recursive: true })
  for (const group of GROUPS) {
    const entries: Record<string, OptimizedImage> = {}
    for (const ref of refs) {
      if (ref.groups.has(group) && manifest[ref.url]) entries[ref.url] = manifest[ref.url]
    }
    const lines = [
      '// GENERATED by scripts/optimize-images.ts - do not edit',
      '//',
      `// The "${group}" images: each original URL (exactly as it appears in the`,
      '// content data) mapped to its optimized AVIF/WebP variants, so <Picture>',
      '// can render a zero-CLS <picture> with real width/height.',
      '// Re-run `bun run images` to regenerate.',
      '',
      "import type { OptimizedImage } from '../../types/images.ts'",
      '',
      `export const IMAGES: Record<string, OptimizedImage> = ${JSON.stringify(entries, null, 2)}`,
      '',
    ]
    writeFileSync(join(MANIFEST_DIR, `${group}.generated.ts`), lines.join('\n'))
    console.log(`  manifest ${group}: ${Object.keys(entries).length} images`)
  }
}

// ---------------------------------------------------------------------------
// 9. Entry point
// ---------------------------------------------------------------------------

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

async function main() {
  console.log('Image optimization pipeline\n')

  const refs = collectImageRefs()
  console.log(`Found ${refs.length} unique image URLs across career.ts, projects.ts, blog.ts, FieldNotesSheet.tsx\n`)

  const cache = loadCache()
  const manifest: Record<string, OptimizedImage> = {}

  const outcomes = await pool(refs, CONCURRENCY, (ref) => processOne(ref, cache, manifest))

  saveCache(cache)
  console.log('')
  emitManifests(refs, manifest)

  const ok = outcomes.filter((o) => o.status === 'ok') as Extract<Outcome, { status: 'ok' }>[]
  const failed = outcomes.filter((o) => o.status === 'failed') as Extract<Outcome, { status: 'failed' }>[]
  const skippedLocal = outcomes.filter((o) => o.status === 'skipped-local')
  const freshlyProcessed = ok.filter((o) => !o.cached).length
  const fromCache = ok.filter((o) => o.cached).length

  const totalInput = ok.reduce((sum, o) => sum + o.inputBytes, 0)
  const totalOutput = ok.reduce((sum, o) => sum + o.outputBytes, 0)

  console.log('\n--- Summary ---')
  console.log(`Processed OK:      ${ok.length}  (${freshlyProcessed} fresh, ${fromCache} from cache)`)
  console.log(`Skipped (local):   ${skippedLocal.length}`)
  console.log(`Failed:            ${failed.length}`)
  console.log(`Total input bytes: ${formatBytes(totalInput)} (${totalInput.toLocaleString()} B)`)
  console.log(`Total output bytes:${' '}${formatBytes(totalOutput)} (${totalOutput.toLocaleString()} B)`)
  if (totalInput > 0) {
    console.log(`Size reduction:    ${(100 - (totalOutput / totalInput) * 100).toFixed(1)}%`)
  }

  if (failed.length > 0) {
    console.log('\nFailed URLs (skipped, build not blocked):')
    for (const f of failed) console.log(`  - ${f.url}  (${f.reason})`)
  }

  console.log(`\nManifests written to ${MANIFEST_DIR}`)
  console.log(`Cache written to ${CACHE_FILE}`)
  // Never fail the build - failures are logged above and simply omitted from the manifest.
  process.exit(0)
}

main().catch((err) => {
  console.error('Unexpected error in image optimization pipeline:', err)
  // Still never fail the build.
  process.exit(0)
})
