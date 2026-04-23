import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion'
import {
  ArrowUpRight,
  Calendar,
  Clock,
  Compass,
  ImageIcon,
  MapPin,
  Radio,
  Stamp,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { BlogPost } from '../types/data'
import { Link } from 'react-router-dom'

interface TravelStoriesProps {
  stories: BlogPost[]
}

// Tiny live UTC clock, 30s cadence — cheap, no extra deps
function useLiveTime() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(id)
  }, [])
  return now
}

// Simple deterministic hash so each post gets stable "metadata" (coord, dispatch #, etc.)
function hashSlug(slug: string): number {
  let h = 2166136261
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

const LOCATION_CODES = [
  'MNL', 'BKK', 'TYO', 'HKG', 'SIN', 'BLI', 'SGN', 'KUL', 'TPE', 'SEL',
  'MAD', 'NYC', 'LAX', 'YYZ', 'BLQ', 'MUC', 'SYD',
]

const WX_CODES = ['28°C · sun', '24°C · clouds', '31°C · haze', '19°C · rain', '26°C · wind']

function stableMeta(slug: string) {
  const h = hashSlug(slug)
  const code = LOCATION_CODES[h % LOCATION_CODES.length]
  const lat = ((h % 85) - 30).toFixed(2)
  const lng = (((h >> 3) % 360) - 180).toFixed(2)
  const dispatchNum = String((h % 850) + 1).padStart(3, '0')
  const wx = WX_CODES[(h >> 5) % WX_CODES.length]
  const readMin = ((h >> 7) % 8) + 3
  const rot = (((h >> 11) % 9) - 4) * 0.35 // -1.4 to 1.4deg
  return { code, lat, lng, dispatchNum, wx, readMin, rot }
}

// Postmark circle — dashed ring with curved text and a bold stamp date
function Postmark({
  date,
  code,
  className = '',
  size = 84,
}: {
  date: string
  code: string
  className?: string
  size?: number
}) {
  const id = useMemo(() => `pm-${Math.random().toString(36).slice(2, 9)}`, [])
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="w-full h-full text-ink/70">
        <defs>
          <path id={id} d="M 50 50 m -34 0 a 34 34 0 1 1 68 0 a 34 34 0 1 1 -68 0" />
        </defs>
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
          strokeDasharray="2 2"
        />
        <circle
          cx="50"
          cy="50"
          r="38"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.6"
        />
        <circle
          cx="50"
          cy="50"
          r="28"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          strokeDasharray="1 1.5"
        />
        <text fontSize="5.4" fontWeight="700" letterSpacing="1" fill="currentColor">
          <textPath href={`#${id}`} startOffset="4%">
            · VIA AIRMAIL · POSTED BY HAND · DISPATCHED
          </textPath>
        </text>
        <text
          x="50"
          y="48"
          textAnchor="middle"
          fontSize="9"
          fontWeight="700"
          letterSpacing="0.8"
          fill="currentColor"
          fontFamily="'JetBrains Mono', monospace"
        >
          {code}
        </text>
        <text
          x="50"
          y="60"
          textAnchor="middle"
          fontSize="5.5"
          fontWeight="600"
          letterSpacing="0.4"
          fill="currentColor"
          fontFamily="'JetBrains Mono', monospace"
        >
          {date}
        </text>
      </svg>
    </div>
  )
}

// Rubber-stamp style block
function Stamp3D({ children, color = 'accent' }: { children: ReactNode; color?: 'accent' | 'amber' | 'electric' | 'lime' }) {
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
      style={{
        boxShadow: 'inset 0 0 0 1px currentColor',
      }}
    >
      {children}
    </span>
  )
}

// Tape strip for polaroid corners
function Tape({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute w-14 h-4 bg-[hsl(var(--amber)/0.18)] border-x border-[hsl(var(--amber)/0.35)] ${className}`}
      style={{ backdropFilter: 'blur(1px)' }}
    />
  )
}

// Featured card — big hero dispatch
function FeaturedDispatch({ post, index }: { post: BlogPost; index: number }) {
  const meta = stableMeta(post.slug)
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  // Tilt on mouse move
  const mx = useMotionValue(0.5)
  const my = useMotionValue(0.5)
  const spring = { stiffness: 200, damping: 22, mass: 0.4 }
  const rotX = useSpring(useTransform(my, [0, 1], [5, -5]), spring)
  const rotY = useSpring(useTransform(mx, [0, 1], [-5, 5]), spring)

  const handleMove = (e: React.MouseEvent) => {
    if (!ref.current || reduce) return
    const rect = ref.current.getBoundingClientRect()
    mx.set((e.clientX - rect.left) / rect.width)
    my.set((e.clientY - rect.top) / rect.height)
  }
  const handleLeave = () => {
    mx.set(0.5)
    my.set(0.5)
  }

  return (
    <motion.article
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      style={{
        rotateX: rotX,
        rotateY: rotY,
        transformPerspective: 1400,
        transformStyle: 'preserve-3d',
      }}
      className="group relative"
    >
      <Link to={`/blog/${post.slug}`} className="block">
        <div className="relative rounded-3xl border-2 border-ink/10 bg-card overflow-hidden shadow-warm">
          {/* Corner tape */}
          <Tape className="-top-1 left-10 -rotate-6" />
          <Tape className="-top-1 right-10 rotate-6" />

          {/* Dispatch header band */}
          <div className="relative z-10 flex items-center justify-between gap-4 px-6 py-3 border-b border-dashed border-ink/20 bg-[hsl(var(--background)/0.6)] backdrop-blur">
            <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.22em] uppercase text-ink-soft">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-[hsl(var(--lime))] animate-pulse" />
                live feed
              </span>
              <span className="hidden md:inline opacity-60">·</span>
              <span className="hidden md:inline">dispatch #{meta.dispatchNum}</span>
              <span className="hidden md:inline opacity-60">·</span>
              <span className="hidden md:inline">ch. 101.7</span>
            </div>
            <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-soft">
              transmitting ▸▸▸
            </div>
          </div>

          {/* Hero image */}
          <div className="relative aspect-[16/11] overflow-hidden bg-background">
            {post.image?.url ? (
              <motion.img
                src={post.image.url}
                alt={post.title}
                width={1200}
                height={800}
                loading="lazy"
                className="w-full h-full object-cover"
                style={{ transformStyle: 'preserve-3d' }}
                whileHover={reduce ? undefined : { scale: 1.04 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-ink-soft">
                <ImageIcon className="w-10 h-10" />
              </div>
            )}

            {/* Scan / grain overlay */}
            <div className="absolute inset-0 bg-scanlines opacity-40 mix-blend-overlay pointer-events-none" />

            {/* Top-left stamp cluster */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <Stamp3D color="accent">
                <Stamp className="w-3 h-3" />
                Dispatch · {meta.dispatchNum}
              </Stamp3D>
              {post.tags?.[0]?.name && (
                <Stamp3D color="amber">
                  <MapPin className="w-3 h-3" />
                  {post.tags[0].name}
                </Stamp3D>
              )}
            </div>

            {/* Top-right postmark */}
            <div className="absolute top-3 right-3 opacity-80 group-hover:opacity-100 transition-opacity">
              <Postmark date={post.publishedDate} code={meta.code} size={96} />
            </div>

            {/* Bottom dashed routes overlay */}
            <svg
              className="absolute bottom-0 left-0 w-full h-24 pointer-events-none"
              viewBox="0 0 400 80"
              preserveAspectRatio="none"
            >
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
              <motion.circle
                r="2.5"
                fill="hsl(var(--accent))"
                initial={{ offsetDistance: '0%' }}
                animate={reduce ? undefined : { offsetDistance: ['0%', '100%'] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                style={{
                  offsetPath: "path('M 0 60 Q 100 20, 200 45 T 400 30')",
                }}
              />
            </svg>
          </div>

          {/* Body */}
          <div className="relative p-6 md:p-8 bg-card">
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
                {meta.readMin} min read
              </span>
              <span className="hidden md:flex items-center gap-1.5">
                <Radio className="w-3 h-3" />
                {meta.wx}
              </span>
            </div>

            <h3
              className="font-display text-2xl md:text-4xl font-bold tracking-tighter text-ink mb-4 text-balance group-hover:text-accent transition-colors"
              dangerouslySetInnerHTML={{ __html: post.title }}
            />

            <div
              className="text-ink-muted leading-relaxed line-clamp-3 mb-5"
              dangerouslySetInnerHTML={{ __html: post.excerpt }}
            />

            <div className="flex items-center justify-between gap-4 pt-5 border-t border-dashed border-ink/15">
              <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-soft">
                featured dispatch · read on →
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink group-hover:text-accent transition-colors">
                Open dispatch
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  )
}

// Smaller postcard-style dispatch
function PostcardDispatch({ post, index }: { post: BlogPost; index: number }) {
  const meta = stableMeta(post.slug)
  const reduce = useReducedMotion()

  return (
    <motion.article
      initial={{ opacity: 0, y: 20, rotate: meta.rot }}
      whileInView={{ opacity: 1, y: 0, rotate: meta.rot }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.07 }}
      whileHover={reduce ? undefined : { rotate: 0, y: -4 }}
      className="group"
    >
      <Link to={`/blog/${post.slug}`} className="block">
        <div className="relative grid grid-cols-5 gap-0 rounded-2xl border-2 border-ink/10 bg-card overflow-hidden shadow-warm hover:shadow-lg transition-shadow">
          {/* Stamp column */}
          <div className="col-span-2 relative overflow-hidden border-r-2 border-dashed border-ink/15">
            {post.image?.url ? (
              <img
                src={post.image.url}
                alt={post.title}
                width={600}
                height={600}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-700"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-surface">
                <ImageIcon className="w-7 h-7 text-ink-soft" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[hsl(var(--ink)/0.2)] mix-blend-multiply" />
            {/* Corner stamp */}
            <div className="absolute top-2 left-2">
              <div className="font-mono text-[9px] tracking-[0.2em] uppercase bg-[hsl(var(--background)/0.85)] backdrop-blur px-2 py-1 rounded-sm border border-ink/10 text-ink">
                {meta.code} · {meta.dispatchNum}
              </div>
            </div>
          </div>

          {/* Note column */}
          <div className="col-span-3 relative p-5 flex flex-col">
            {/* Faux ruled lines */}
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none opacity-40"
              style={{
                backgroundImage: 'linear-gradient(transparent 1.5rem, hsl(var(--ink)/0.06) 1.5rem, hsl(var(--ink)/0.06) calc(1.5rem + 1px), transparent calc(1.5rem + 1px))',
                backgroundSize: '100% 1.75rem',
              }}
            />

            <div className="relative flex items-center justify-between gap-2 mb-2">
              <span className="font-mono text-[9px] tracking-[0.22em] uppercase text-ink-soft flex items-center gap-1.5">
                <Calendar className="w-2.5 h-2.5" />
                {post.publishedDate}
              </span>
              <div className="opacity-60 group-hover:opacity-90 transition-opacity">
                <Postmark date={post.publishedDate.split(',')[0] || post.publishedDate} code={meta.code} size={44} />
              </div>
            </div>

            <h3
              className="relative font-display text-lg md:text-xl font-bold tracking-tight text-ink leading-tight mb-2 line-clamp-2 group-hover:text-accent transition-colors"
              dangerouslySetInnerHTML={{ __html: post.title }}
            />

            <div
              className="relative text-sm text-ink-muted line-clamp-3 mb-3"
              dangerouslySetInnerHTML={{ __html: post.excerpt }}
            />

            <div className="relative mt-auto flex items-center justify-between gap-2 pt-2 border-t border-dashed border-ink/15">
              <span className="font-mono text-[9px] tracking-[0.22em] uppercase text-ink-soft flex items-center gap-1.5">
                <Clock className="w-2.5 h-2.5" />
                {meta.readMin} min
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-ink group-hover:text-accent transition-colors">
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

// Dispatch console header — ticker + live clock
function DispatchConsole({ count }: { count: number }) {
  const now = useLiveTime()
  const utc = now.toISOString().slice(11, 16) // HH:MM UTC
  const reduce = useReducedMotion()

  return (
    <div className="relative flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[10px] tracking-[0.22em] uppercase text-ink-soft mb-4">
      <span className="flex items-center gap-1.5">
        <Radio className="w-3 h-3 text-[hsl(var(--lime))] animate-pulse" />
        transmitting
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[hsl(var(--lime))]" />
        live · utc {utc}
      </span>
      <span className="hidden sm:flex items-center gap-1.5">
        <Compass className="w-3 h-3" />
        13.75°N · 100.50°E · bkk
      </span>
      <span className="hidden md:flex items-center gap-1.5">
        <Stamp className="w-3 h-3" />
        {count} dispatches on wire
      </span>
      {!reduce && (
        <span className="hidden md:inline-flex items-center gap-0.5">
          {/* frequency bars */}
          {Array.from({ length: 10 }).map((_, i) => (
            <motion.span
              key={i}
              className="inline-block w-[3px] bg-[hsl(var(--accent)/0.7)] rounded-sm"
              animate={{ height: ['4px', '12px', '6px', '14px', '4px'] }}
              transition={{
                duration: 1.4 + (i % 3) * 0.25,
                repeat: Infinity,
                delay: i * 0.08,
                ease: 'easeInOut',
              }}
              style={{ height: 4 }}
            />
          ))}
        </span>
      )}
    </div>
  )
}

export function TravelStories({ stories }: TravelStoriesProps) {
  const reduce = useReducedMotion()
  const displayStories = stories.slice(0, 4)

  if (!displayStories.length) {
    return null
  }

  const [featured, ...rest] = displayStories

  return (
    <section className="relative py-28 md:py-36 bg-surface scroll-mt-20 border-y border-border overflow-hidden">
      {/* Background: faint grid + radio halos */}
      <div aria-hidden className="absolute inset-0 bg-graph opacity-30 pointer-events-none" />
      <div
        aria-hidden
        className="absolute -top-40 -left-40 w-[420px] h-[420px] rounded-full bg-[hsl(var(--accent)/0.08)] blur-3xl animate-pulse-glow"
      />
      <div
        aria-hidden
        className="absolute -bottom-40 -right-40 w-[480px] h-[480px] rounded-full bg-[hsl(var(--lime)/0.12)] blur-3xl animate-pulse-glow"
      />
      {!reduce && (
        <div className="absolute inset-0 bg-scanlines opacity-[0.07] pointer-events-none" />
      )}

      <div className="relative container mx-auto px-6 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 md:mb-16"
        >
          <DispatchConsole count={stories.length} />
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-3xl">
              <div className="text-xs tracking-[0.3em] uppercase text-ink-soft mb-4 flex items-center gap-2">
                <span className="w-10 h-px bg-ink/30" />
                Writing · Feat.04
              </div>
              <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tighter text-ink text-balance leading-[0.95]">
                Field notes{' '}
                <span className="italic font-extrabold text-accent relative inline-block">
                  from the road
                  {/* underline stroke animation */}
                  <motion.span
                    aria-hidden
                    className="absolute left-0 -bottom-1 h-[3px] bg-[hsl(var(--accent))] origin-left"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    style={{ width: '100%' }}
                  />
                </span>
                .
              </h2>
            </div>
            <p className="md:max-w-sm text-ink-muted leading-relaxed text-sm md:text-base">
              <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-soft block mb-1.5">
                // transmission log
              </span>
              Dispatches from the places I&apos;ve worked from, teams I&apos;ve
              shipped with, and the roads in between. Filed by hand, stamped,
              and sent along.
            </p>
          </div>
        </motion.div>

        {/* Grid: featured + stacked postcards */}
        <div className="grid lg:grid-cols-5 gap-6 md:gap-8 mb-12 items-start">
          <div className="lg:col-span-3">
            <FeaturedDispatch post={featured} index={0} />
          </div>
          <div className="lg:col-span-2 flex flex-col gap-5">
            {rest.map((post, i) => (
              <PostcardDispatch key={post.slug} post={post} index={i} />
            ))}
          </div>
        </div>

        {/* Footer CTA: dispatch wire */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative rounded-2xl border border-dashed border-ink/20 bg-card p-5 md:p-6"
        >
          {/* Scrolling ticker */}
          <div className="relative overflow-hidden mb-5 border-y border-dashed border-ink/15 py-2">
            <div
              className={`flex items-center gap-8 whitespace-nowrap font-mono text-[10px] tracking-[0.22em] uppercase text-ink-soft ${reduce ? '' : 'animate-scroll-x'}`}
              style={{ width: reduce ? 'auto' : 'max-content' }}
            >
              {Array.from({ length: 2 }).flatMap((_, rep) =>
                [
                  '── DISPATCH WIRE · LIVE',
                  'BKK · 13.75°N 100.50°E · active',
                  'Manila 1w ago',
                  'Tokyo 2w ago',
                  'Bali 3w ago',
                  'Singapore 1mo ago',
                  'Madrid 6w ago',
                  '── POSTAGE PAID · FIELD DISPATCH',
                  'freq 101.7 · active',
                  'next dispatch: pending',
                ].map((item, i) => (
                  <span key={`${rep}-${i}`} className="inline-flex items-center gap-3">
                    {item}
                    <span className="opacity-40">◆</span>
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-soft mb-1">
                // full archive
              </div>
              <div className="font-display text-xl md:text-2xl font-bold text-ink tracking-tight">
                {stories.length}+ dispatches filed · still writing.
              </div>
            </div>
            <Link
              to="/blog"
              className="group relative inline-flex items-center gap-2 h-12 px-6 rounded-full border-2 border-ink/15 bg-background text-ink text-sm font-medium hover:border-ink hover:bg-ink hover:text-background transition-all overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Visit the archive
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </span>
              <span
                aria-hidden
                className="absolute inset-0 bg-[hsl(var(--accent)/0.1)] translate-y-full group-hover:translate-y-0 transition-transform duration-500"
              />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
