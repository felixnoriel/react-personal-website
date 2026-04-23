import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowUpRight,
  Calendar,
  Clock,
  Compass,
  ImageIcon,
  MapPin,
  Radio,
  Search,
  Stamp,
} from 'lucide-react'
import { ViewAllLink } from '../ViewAllLink'
import type { BlogPost } from '../../types/data'

interface BlogListProps {
  blogList: BlogPost[]
  indexPage?: boolean
}

// ============================================================
// Utilities
// ============================================================

function hashSlug(slug: string): number {
  let h = 2166136261
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

const LOCATION_CODES = [
  'BKK', 'MNL', 'TYO', 'HKG', 'SIN', 'BLI', 'SGN', 'KUL', 'TPE', 'SEL',
  'MAD', 'NYC', 'LAX', 'YYZ', 'BLQ', 'MUC', 'SYD', 'LIS', 'PAR', 'LON',
]
const WX_CODES = ['28°C · sun', '24°C · clouds', '31°C · haze', '19°C · rain', '26°C · wind', '33°C · humid']

function stableMeta(slug: string) {
  const h = hashSlug(slug)
  const code = LOCATION_CODES[h % LOCATION_CODES.length]
  const lat = ((h % 85) - 30).toFixed(2)
  const lng = (((h >> 3) % 360) - 180).toFixed(2)
  const dispatchNum = String((h % 850) + 1).padStart(3, '0')
  const wx = WX_CODES[(h >> 5) % WX_CODES.length]
  const readMin = ((h >> 7) % 8) + 3
  const rot = (((h >> 11) % 11) - 5) * 0.35 // -1.75 to 1.75deg
  const layout = (h >> 13) % 3 // 0 = tall, 1 = standard, 2 = wide
  return { code, lat, lng, dispatchNum, wx, readMin, rot, layout }
}

function useLiveTime() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(id)
  }, [])
  return now
}

// ============================================================
// Small pieces
// ============================================================

function Postmark({ date, code, size = 80 }: { date: string; code: string; size?: number }) {
  const id = useMemo(() => `bl-pm-${Math.random().toString(36).slice(2, 9)}`, [])
  return (
    <div className="relative text-ink/75" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <path id={id} d="M 50 50 m -34 0 a 34 34 0 1 1 68 0 a 34 34 0 1 1 -68 0" />
        </defs>
        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 2" />
        <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="0.6" />
        <circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 1.5" />
        <text fontSize="5.4" fontWeight="700" letterSpacing="1" fill="currentColor">
          <textPath href={`#${id}`} startOffset="4%">
            · VIA AIRMAIL · POSTED BY HAND · DISPATCHED
          </textPath>
        </text>
        <text x="50" y="48" textAnchor="middle" fontSize="9" fontWeight="700" letterSpacing="0.8" fill="currentColor" fontFamily="'JetBrains Mono', monospace">
          {code}
        </text>
        <text x="50" y="60" textAnchor="middle" fontSize="5.5" fontWeight="600" letterSpacing="0.4" fill="currentColor" fontFamily="'JetBrains Mono', monospace">
          {date}
        </text>
      </svg>
    </div>
  )
}

function Stamp3D({
  children,
  color = 'accent',
}: {
  children: React.ReactNode
  color?: 'accent' | 'amber' | 'electric' | 'lime'
}) {
  const ring =
    color === 'amber'
      ? 'text-[hsl(var(--amber))] border-[hsl(var(--amber)/0.6)]'
      : color === 'electric'
      ? 'text-[hsl(var(--electric))] border-[hsl(var(--electric)/0.6)]'
      : color === 'lime'
      ? 'text-[hsl(var(--lime))] border-[hsl(var(--lime)/0.7)]'
      : 'text-[hsl(var(--accent))] border-[hsl(var(--accent)/0.6)]'

  return (
    <span
      className={`inline-flex items-center gap-1.5 border-2 px-2.5 py-1 rounded-sm font-mono text-[10px] tracking-[0.18em] uppercase rotate-[-2deg] ${ring}`}
      style={{ boxShadow: 'inset 0 0 0 1px currentColor' }}
    >
      {children}
    </span>
  )
}

function Tape({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute w-14 h-4 bg-[hsl(var(--amber)/0.18)] border-x border-[hsl(var(--amber)/0.35)] ${className}`}
      style={{ backdropFilter: 'blur(1px)' }}
    />
  )
}

// ============================================================
// Hero — dispatch archive title card
// ============================================================

function ArchiveHero({ total, tags }: { total: number; tags: string[] }) {
  const now = useLiveTime()
  const utc = now.toISOString().slice(11, 16)
  const reduce = useReducedMotion()

  return (
    <section className="relative border-y border-ink/10 bg-surface overflow-hidden">
      {/* layered backgrounds */}
      <div aria-hidden className="absolute inset-0 bg-graph opacity-30 pointer-events-none" />
      {!reduce && <div className="absolute inset-0 bg-scanlines opacity-[0.07] pointer-events-none" />}
      <div aria-hidden className="absolute -top-32 -left-32 w-[360px] h-[360px] rounded-full bg-[hsl(var(--accent)/0.1)] blur-3xl animate-pulse-glow" />
      <div aria-hidden className="absolute -bottom-32 -right-32 w-[360px] h-[360px] rounded-full bg-[hsl(var(--lime)/0.14)] blur-3xl animate-pulse-glow" />

      <div className="relative container mx-auto max-w-7xl px-4 py-20 md:py-28">
        {/* transmission strip */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[10px] tracking-[0.22em] uppercase text-ink-soft mb-6">
          <span className="flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-[hsl(var(--lime))] animate-pulse" />
            receiving · freq 101.7
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[hsl(var(--lime))]" />
            live · utc {utc}
          </span>
          <span className="hidden sm:flex items-center gap-1.5">
            <Compass className="w-3 h-3" />
            13.75°N · 100.50°E · bkk
          </span>
          {!reduce && (
            <span className="hidden md:inline-flex items-center gap-0.5">
              {Array.from({ length: 10 }).map((_, i) => (
                <motion.span
                  key={i}
                  className="inline-block w-[3px] bg-[hsl(var(--accent)/0.7)] rounded-sm"
                  animate={{ height: ['4px', '12px', '6px', '14px', '4px'] }}
                  transition={{ duration: 1.4 + (i % 3) * 0.25, repeat: Infinity, delay: i * 0.08, ease: 'easeInOut' }}
                  style={{ height: 4 }}
                />
              ))}
            </span>
          )}
        </div>

        <div className="grid md:grid-cols-12 gap-8 md:gap-12 items-end">
          <div className="md:col-span-8">
            <div className="text-xs tracking-[0.3em] uppercase text-ink-soft mb-5 flex items-center gap-2">
              <span className="w-10 h-px bg-ink/30" />
              Archive · Field dispatches
            </div>
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-5xl md:text-7xl lg:text-[88px] font-extrabold tracking-tighter text-ink leading-[0.9] text-balance"
            >
              The{' '}
              <span className="italic text-accent relative inline-block">
                dispatch
                <motion.span
                  aria-hidden
                  className="absolute left-0 -bottom-1 h-1 bg-[hsl(var(--accent))] origin-left"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  style={{ width: '100%' }}
                />
              </span>
              <br />
              archive.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mt-6 max-w-2xl text-ink-muted leading-relaxed text-base md:text-lg"
            >
              A running notebook of places, meals, and teams — filed by hand
              from hotel rooms, cafes, and 35,000 ft above. Foodie by default,
              engineer by training, tourist on weekends.
            </motion.p>
          </div>

          {/* meta panel */}
          <motion.aside
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="md:col-span-4 relative"
          >
            <div className="relative rounded-2xl border-2 border-ink/10 bg-card p-5 shadow-warm">
              <Tape className="-top-2 left-6 -rotate-6" />
              <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-dashed border-ink/15">
                <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-soft flex items-center gap-1.5">
                  <Stamp className="w-3 h-3" />
                  manifest · v{new Date().getFullYear()}
                </span>
                <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-[hsl(var(--lime))] flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[hsl(var(--lime))] animate-pulse" />
                  live
                </span>
              </div>
              <dl className="grid grid-cols-2 gap-3 font-mono text-[10px] tracking-[0.18em] uppercase">
                <div>
                  <dt className="text-ink-soft mb-1">filed</dt>
                  <dd className="font-display text-2xl font-bold text-ink normal-case tracking-tight">{total}</dd>
                </div>
                <div>
                  <dt className="text-ink-soft mb-1">channels</dt>
                  <dd className="font-display text-2xl font-bold text-ink normal-case tracking-tight">{tags.length}</dd>
                </div>
                <div className="col-span-2 pt-2 border-t border-dashed border-ink/15">
                  <dt className="text-ink-soft mb-1.5">current base</dt>
                  <dd className="text-ink normal-case tracking-tight font-mono text-xs">
                    BKK · 13.75°N 100.50°E
                  </dd>
                </div>
              </dl>
            </div>
          </motion.aside>
        </div>
      </div>

      {/* scrolling ticker */}
      <div className="relative border-t border-dashed border-ink/15 bg-[hsl(var(--background)/0.6)] backdrop-blur">
        <div className="overflow-hidden py-2">
          <div
            className={`flex items-center gap-8 whitespace-nowrap font-mono text-[10px] tracking-[0.22em] uppercase text-ink-soft ${reduce ? '' : 'animate-scroll-x'}`}
            style={{ width: reduce ? 'auto' : 'max-content' }}
          >
            {Array.from({ length: 2 }).flatMap((_, rep) =>
              [
                '── DISPATCH WIRE · LIVE',
                'BKK · 13.75°N 100.50°E · active',
                `${total} dispatches on record`,
                'channel: open',
                'postage: paid',
                'freq 101.7 · transmitting',
                'next update: pending',
                'file a dispatch ↓',
                'airmail · expedited',
              ].map((item, i) => (
                <span key={`${rep}-${i}`} className="inline-flex items-center gap-3">
                  {item}
                  <span className="opacity-40">◆</span>
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================================
// Filter bar — tags as passport stamps + search
// ============================================================

function FilterBar({
  tags,
  activeTag,
  onSelect,
  query,
  onQuery,
}: {
  tags: string[]
  activeTag: string | null
  onSelect: (t: string | null) => void
  query: string
  onQuery: (q: string) => void
}) {
  return (
    <div className="mb-10 space-y-4">
      <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.22em] uppercase text-ink-soft">
        <span className="w-8 h-px bg-ink/25" />
        sort by channel
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Search */}
        <div className="relative lg:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-soft pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="search the archive..."
            className="w-full h-11 pl-10 pr-4 rounded-full border-2 border-ink/10 bg-card font-mono text-xs placeholder:text-ink-soft focus:outline-none focus:border-accent focus:ring-4 focus:ring-[hsl(var(--accent)/0.15)] transition-all"
          />
        </div>

        {/* Tag chips */}
        <div className="flex-1 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onSelect(null)}
            className={`relative inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border-2 font-mono text-[10px] tracking-[0.2em] uppercase transition-all ${
              activeTag === null
                ? 'border-ink bg-ink text-background shadow-warm rotate-[-1deg]'
                : 'border-ink/15 bg-card text-ink hover:border-ink/40 hover:-translate-y-0.5'
            }`}
          >
            <Stamp className="w-3 h-3" />
            all dispatches
          </button>
          {tags.map((tag, i) => (
            <button
              key={tag}
              type="button"
              onClick={() => onSelect(tag)}
              className={`relative inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border-2 font-mono text-[10px] tracking-[0.2em] uppercase transition-all ${
                activeTag === tag
                  ? 'border-accent bg-[hsl(var(--accent)/0.08)] text-accent shadow-warm rotate-[1deg]'
                  : 'border-ink/15 bg-card text-ink hover:border-accent/50 hover:-translate-y-0.5'
              }`}
              style={{ transform: activeTag === tag ? undefined : `rotate(${(i % 3) - 1}deg)` }}
            >
              <MapPin className="w-3 h-3" />
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Dispatch cards — three variants cycling
// ============================================================

// Variant A — tall polaroid
function PolaroidCard({ post, delay = 0 }: { post: BlogPost; delay?: number }) {
  const meta = stableMeta(post.slug)
  const reduce = useReducedMotion()
  return (
    <motion.article
      initial={{ opacity: 0, y: 20, rotate: meta.rot }}
      whileInView={{ opacity: 1, y: 0, rotate: meta.rot }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      whileHover={reduce ? undefined : { rotate: 0, y: -6 }}
      className="group"
    >
      <Link to={`/blog/${post.slug}`} className="block">
        <div className="relative rounded-2xl border-2 border-ink/10 bg-card overflow-hidden shadow-warm hover:shadow-lg transition-shadow">
          <Tape className="-top-1 left-8 -rotate-6" />
          <Tape className="-top-1 right-8 rotate-6" />

          <div className="relative aspect-[4/5] overflow-hidden bg-background">
            {post.image?.url ? (
              <img
                src={post.image.url}
                alt={post.title}
                width={600}
                height={750}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-ink-soft">
                <ImageIcon className="w-8 h-8" />
              </div>
            )}
            <div className="absolute inset-0 bg-scanlines opacity-30 mix-blend-overlay pointer-events-none" />
            <div className="absolute top-3 left-3">
              <Stamp3D color="accent">
                <Stamp className="w-3 h-3" />
                #{meta.dispatchNum}
              </Stamp3D>
            </div>
            <div className="absolute top-3 right-3 opacity-80 group-hover:opacity-100 transition-opacity">
              <Postmark date={post.publishedDate.split(',')[0] || post.publishedDate} code={meta.code} size={58} />
            </div>
          </div>

          <div className="p-5">
            <div className="flex items-center gap-3 font-mono text-[9px] tracking-[0.22em] uppercase text-ink-soft mb-2">
              <span className="flex items-center gap-1">
                <Calendar className="w-2.5 h-2.5" />
                {post.publishedDate}
              </span>
              <span className="opacity-50">·</span>
              <span className="flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                {meta.readMin} min
              </span>
            </div>
            <h3
              className="font-display text-lg font-bold tracking-tight text-ink mb-2 line-clamp-2 group-hover:text-accent transition-colors"
              dangerouslySetInnerHTML={{ __html: post.title }}
            />
            <div
              className="text-sm text-ink-muted line-clamp-2 mb-4"
              dangerouslySetInnerHTML={{ __html: post.excerpt }}
            />
            <div className="pt-3 border-t border-dashed border-ink/15 flex items-center justify-between font-mono text-[9px] tracking-[0.22em] uppercase text-ink-soft">
              <span>{meta.code} · {meta.wx}</span>
              <span className="inline-flex items-center gap-1 text-ink group-hover:text-accent transition-colors">
                open
                <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  )
}

// Variant B — horizontal postcard
function PostcardCard({ post, delay = 0 }: { post: BlogPost; delay?: number }) {
  const meta = stableMeta(post.slug)
  const reduce = useReducedMotion()
  return (
    <motion.article
      initial={{ opacity: 0, y: 20, rotate: meta.rot }}
      whileInView={{ opacity: 1, y: 0, rotate: meta.rot }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      whileHover={reduce ? undefined : { rotate: 0, y: -6 }}
      className="group"
    >
      <Link to={`/blog/${post.slug}`} className="block">
        <div className="relative grid grid-cols-5 rounded-2xl border-2 border-ink/10 bg-card overflow-hidden shadow-warm hover:shadow-lg transition-shadow min-h-[280px]">
          <div className="col-span-2 relative overflow-hidden border-r-2 border-dashed border-ink/15">
            {post.image?.url ? (
              <img
                src={post.image.url}
                alt={post.title}
                width={500}
                height={500}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-700"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-surface">
                <ImageIcon className="w-7 h-7 text-ink-soft" />
              </div>
            )}
            <div className="absolute top-2 left-2">
              <div className="font-mono text-[9px] tracking-[0.2em] uppercase bg-[hsl(var(--background)/0.85)] backdrop-blur px-2 py-1 rounded-sm border border-ink/10 text-ink">
                {meta.code}
              </div>
            </div>
          </div>
          <div className="col-span-3 relative p-5 flex flex-col">
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none opacity-40"
              style={{
                backgroundImage: 'linear-gradient(transparent 1.5rem, hsl(var(--ink)/0.06) 1.5rem, hsl(var(--ink)/0.06) calc(1.5rem + 1px), transparent calc(1.5rem + 1px))',
                backgroundSize: '100% 1.75rem',
              }}
            />
            <div className="relative flex items-center justify-between gap-2 mb-3">
              <span className="font-mono text-[9px] tracking-[0.22em] uppercase text-ink-soft flex items-center gap-1.5">
                <Stamp className="w-2.5 h-2.5" />
                #{meta.dispatchNum}
              </span>
              <div className="opacity-60 group-hover:opacity-90 transition-opacity">
                <Postmark date={post.publishedDate.split(',')[0] || post.publishedDate} code={meta.code} size={44} />
              </div>
            </div>
            <h3
              className="relative font-display text-xl font-bold tracking-tight text-ink leading-tight mb-2 line-clamp-2 group-hover:text-accent transition-colors"
              dangerouslySetInnerHTML={{ __html: post.title }}
            />
            <div
              className="relative text-sm text-ink-muted line-clamp-3 mb-3"
              dangerouslySetInnerHTML={{ __html: post.excerpt }}
            />
            <div className="relative mt-auto flex items-center justify-between gap-2 pt-2 border-t border-dashed border-ink/15 font-mono text-[9px] tracking-[0.22em] uppercase text-ink-soft">
              <span className="flex items-center gap-1.5">
                <Clock className="w-2.5 h-2.5" />
                {meta.readMin} min · {meta.wx}
              </span>
              <span className="inline-flex items-center gap-1 text-ink group-hover:text-accent transition-colors">
                read
                <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  )
}

// Variant C — luggage tag (wider, overlay)
function LuggageCard({ post, delay = 0 }: { post: BlogPost; delay?: number }) {
  const meta = stableMeta(post.slug)
  const reduce = useReducedMotion()
  return (
    <motion.article
      initial={{ opacity: 0, y: 20, rotate: meta.rot }}
      whileInView={{ opacity: 1, y: 0, rotate: meta.rot }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      whileHover={reduce ? undefined : { rotate: 0, y: -6 }}
      className="group"
    >
      <Link to={`/blog/${post.slug}`} className="block">
        <div className="relative rounded-2xl border-2 border-ink/10 bg-card overflow-hidden shadow-warm hover:shadow-lg transition-shadow">
          <Tape className="-top-1 left-1/2 -translate-x-1/2 rotate-0" />

          <div className="relative aspect-[5/4] overflow-hidden bg-background">
            {post.image?.url ? (
              <img
                src={post.image.url}
                alt={post.title}
                width={800}
                height={640}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-ink-soft">
                <ImageIcon className="w-8 h-8" />
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--ink)/0.75)] via-[hsl(var(--ink)/0.2)] to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-scanlines opacity-30 mix-blend-overlay pointer-events-none" />

            {/* top badges */}
            <div className="absolute top-4 left-4 flex gap-2">
              <Stamp3D color="amber">
                <Stamp className="w-3 h-3" />
                #{meta.dispatchNum}
              </Stamp3D>
              <Stamp3D color="electric">
                <Compass className="w-3 h-3" />
                {meta.code}
              </Stamp3D>
            </div>

            {/* bottom overlay content */}
            <div className="absolute bottom-0 left-0 right-0 p-5 text-[hsl(var(--background))]">
              <div className="font-mono text-[9px] tracking-[0.22em] uppercase text-[hsl(var(--background)/0.7)] mb-2 flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Calendar className="w-2.5 h-2.5" />
                  {post.publishedDate}
                </span>
                <span className="opacity-50">·</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {meta.readMin} min
                </span>
              </div>
              <h3
                className="font-display text-xl md:text-2xl font-bold tracking-tight leading-tight line-clamp-2 group-hover:text-[hsl(var(--lime))] transition-colors"
                dangerouslySetInnerHTML={{ __html: post.title }}
              />
            </div>
          </div>

          <div className="p-5">
            <div
              className="text-sm text-ink-muted line-clamp-2 mb-3"
              dangerouslySetInnerHTML={{ __html: post.excerpt }}
            />
            <div className="pt-3 border-t border-dashed border-ink/15 flex items-center justify-between font-mono text-[9px] tracking-[0.22em] uppercase text-ink-soft">
              <span>{meta.wx}</span>
              <span className="inline-flex items-center gap-1 text-ink group-hover:text-accent transition-colors">
                open dispatch
                <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  )
}

// ============================================================
// Main exports
// ============================================================

export function BlogList({ blogList, indexPage }: BlogListProps) {
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLDivElement>(null)

  const safeList = useMemo(() => (Array.isArray(blogList) ? blogList : []), [blogList])

  const allTags = useMemo(() => {
    const s = new Set<string>()
    safeList.forEach((p) => p.tags?.forEach((t) => s.add(t.name)))
    return Array.from(s).sort()
  }, [safeList])

  const filtered = useMemo(() => {
    return safeList.filter((p) => {
      if (activeTag && !p.tags?.some((t) => t.name === activeTag)) return false
      if (query) {
        const q = query.toLowerCase()
        const hay = (p.title + ' ' + p.excerpt + ' ' + (p.tags?.map((t) => t.name).join(' ') || '')).toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [safeList, activeTag, query])

  return (
    <div className="bg-background">
      <ArchiveHero total={safeList.length} tags={allTags} />

      <section className="relative container mx-auto max-w-7xl px-4 py-16" ref={searchRef}>
        <FilterBar
          tags={allTags}
          activeTag={activeTag}
          onSelect={setActiveTag}
          query={query}
          onQuery={setQuery}
        />

        <BlogGrid posts={filtered} />

        {filtered.length === 0 && (
          <div className="py-24 text-center">
            <div className="inline-block font-mono text-[10px] tracking-[0.22em] uppercase text-ink-soft mb-3">
              // no dispatches matched
            </div>
            <p className="text-ink-muted">
              The wire&apos;s quiet for that search. Try another channel.
            </p>
          </div>
        )}

        <div className="mt-12">
          <ViewAllLink route="blog" indexPage={indexPage} />
        </div>
      </section>
    </div>
  )
}

function BlogGrid({ posts }: { posts: BlogPost[] }) {
  if (!posts.length) return null

  // First post = featured luggage tag (full width on md), rest cycle through variants
  const [first, ...rest] = posts
  const meta0 = stableMeta(first.slug)

  return (
    <div>
      {/* Featured top */}
      <div className="mb-8">
        <FeaturedHero post={first} meta={meta0} />
      </div>

      {/* Staggered grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {rest.map((post, i) => {
          const m = stableMeta(post.slug)
          const delay = (i % 6) * 0.05
          if (m.layout === 0) {
            return <PolaroidCard key={post.slug} post={post} delay={delay} />
          }
          if (m.layout === 2) {
            return <LuggageCard key={post.slug} post={post} delay={delay} />
          }
          return <PostcardCard key={post.slug} post={post} delay={delay} />
        })}
      </div>
    </div>
  )
}

function FeaturedHero({
  post,
  meta,
}: {
  post: BlogPost
  meta: ReturnType<typeof stableMeta>
}) {
  const reduce = useReducedMotion()
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="group"
    >
      <Link to={`/blog/${post.slug}`} className="block">
        <div className="relative rounded-3xl border-2 border-ink/10 bg-card overflow-hidden shadow-warm">
          <Tape className="-top-2 left-12 -rotate-6" />
          <Tape className="-top-2 right-12 rotate-6" />

          {/* top console bar */}
          <div className="relative flex items-center justify-between gap-3 px-5 py-3 border-b border-dashed border-ink/15 bg-[hsl(var(--background)/0.6)] backdrop-blur">
            <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.22em] uppercase text-ink-soft">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-[hsl(var(--lime))] animate-pulse" />
                top dispatch · pinned
              </span>
              <span className="hidden md:inline opacity-60">·</span>
              <span className="hidden md:inline">#{meta.dispatchNum}</span>
            </div>
            <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-soft">
              {post.publishedDate}
            </div>
          </div>

          <div className="grid md:grid-cols-2">
            {/* image */}
            <div className="relative aspect-[16/10] md:aspect-auto overflow-hidden bg-background">
              {post.image?.url ? (
                <img
                  src={post.image.url}
                  alt={post.title}
                  width={1200}
                  height={800}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-ink-soft">
                  <ImageIcon className="w-10 h-10" />
                </div>
              )}
              <div className="absolute inset-0 bg-scanlines opacity-30 mix-blend-overlay pointer-events-none" />
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <Stamp3D color="accent">
                  <Stamp className="w-3 h-3" />
                  featured
                </Stamp3D>
                {post.tags?.[0] && (
                  <Stamp3D color="amber">
                    <MapPin className="w-3 h-3" />
                    {post.tags[0].name}
                  </Stamp3D>
                )}
              </div>
              <div className="absolute top-3 right-3">
                <Postmark date={post.publishedDate.split(',')[0] || post.publishedDate} code={meta.code} size={82} />
              </div>

              {/* flight arc */}
              <svg className="absolute bottom-0 left-0 w-full h-20 pointer-events-none" viewBox="0 0 400 80" preserveAspectRatio="none">
                <motion.path
                  d="M 0 60 Q 100 20, 200 45 T 400 30"
                  fill="none"
                  stroke="hsl(var(--accent))"
                  strokeWidth="1"
                  strokeDasharray="3 4"
                  opacity="0.6"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.8, delay: 0.3 }}
                />
                {!reduce && (
                  <motion.circle
                    r="2.5"
                    fill="hsl(var(--accent))"
                    animate={{ offsetDistance: ['0%', '100%'] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                    style={{ offsetPath: "path('M 0 60 Q 100 20, 200 45 T 400 30')" }}
                  />
                )}
              </svg>
            </div>

            {/* content */}
            <div className="p-6 md:p-10 flex flex-col justify-center">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[10px] tracking-[0.22em] uppercase text-ink-soft mb-4">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  {post.publishedDate}
                </span>
                <span className="flex items-center gap-1.5">
                  <Compass className="w-3 h-3" />
                  {meta.lat}° · {meta.lng}°
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  {meta.readMin} min
                </span>
              </div>

              <h2
                className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter text-ink mb-4 text-balance group-hover:text-accent transition-colors"
                dangerouslySetInnerHTML={{ __html: post.title }}
              />

              <div
                className="text-ink-muted leading-relaxed line-clamp-4 mb-6"
                dangerouslySetInnerHTML={{ __html: post.excerpt }}
              />

              <div className="pt-5 border-t border-dashed border-ink/15 flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-soft">
                  channel: {post.tags?.[0]?.name || 'general'} · {meta.wx}
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink group-hover:text-accent transition-colors">
                  Open dispatch
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  )
}
