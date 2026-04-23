import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion, useScroll, useSpring } from 'framer-motion'
import {
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  Clock,
  Compass,
  Facebook,
  Linkedin,
  MapPin,
  Plane,
  Radio,
  Stamp,
  Twitter,
} from 'lucide-react'
import type { BlogPost } from '../../types/data'

interface BlogViewProps {
  blog: BlogPost | null
}

// ============================================================
// utils — matched to BlogList so codes line up
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
  const freq = (100 + ((h >> 9) % 100) / 10).toFixed(1) // 100.0 - 109.9
  return { code, lat, lng, dispatchNum, wx, readMin, freq }
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
// Bits
// ============================================================

function Postmark({ date, code, size = 100 }: { date: string; code: string; size?: number }) {
  const id = useMemo(() => `bv-pm-${Math.random().toString(36).slice(2, 9)}`, [])
  return (
    <div className="relative text-ink/80" style={{ width: size, height: size }}>
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
// Flight progress bar — replaces the usual linear progress
// ============================================================

function FlightProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 180, damping: 30, mass: 0.3 })

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      {/* runway (dashed line) */}
      <div className="relative h-1 bg-transparent overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(to right, transparent 0 6px, hsl(var(--ink) / 0.15) 6px 12px)',
            backgroundSize: '12px 1px',
            backgroundPosition: 'center',
            backgroundRepeat: 'repeat-x',
          }}
        />
        <motion.div
          className="absolute inset-y-0 left-0 origin-left bg-gradient-to-r from-[hsl(var(--accent))] via-[hsl(var(--lime))] to-[hsl(var(--electric))]"
          style={{ scaleX, right: 0 }}
        />
        {/* the plane riding the progress */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2"
          style={{ left: useSpring(scrollYProgress, { stiffness: 180, damping: 30 }) }}
        >
          <div
            style={{
              width: '100%',
              transform: 'translateX(-50%)',
            }}
          >
            <Plane className="w-4 h-4 text-[hsl(var(--accent))] -rotate-90" />
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// ============================================================
// Hero cover
// ============================================================

function DispatchHero({ blog }: { blog: BlogPost }) {
  const meta = stableMeta(blog.slug)
  const reduce = useReducedMotion()
  const now = useLiveTime()
  const utc = now.toISOString().slice(11, 16)

  return (
    <section className="relative border-b border-ink/10 bg-surface overflow-hidden">
      {/* bg */}
      <div aria-hidden className="absolute inset-0 bg-graph opacity-30 pointer-events-none" />
      {!reduce && <div className="absolute inset-0 bg-scanlines opacity-[0.07] pointer-events-none" />}
      <div aria-hidden className="absolute -top-40 -left-40 w-[480px] h-[480px] rounded-full bg-[hsl(var(--accent)/0.08)] blur-3xl animate-pulse-glow" />
      <div aria-hidden className="absolute -bottom-40 -right-40 w-[480px] h-[480px] rounded-full bg-[hsl(var(--lime)/0.12)] blur-3xl animate-pulse-glow" />

      <div className="relative container mx-auto max-w-6xl px-4 pt-10 pb-14 md:pt-14 md:pb-20">
        {/* Top nav row */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <Link
            to="/blog"
            className="group inline-flex items-center gap-2 h-9 px-3.5 rounded-full border-2 border-ink/15 bg-card font-mono text-[10px] tracking-[0.22em] uppercase text-ink hover:border-ink hover:bg-ink hover:text-background transition-all"
          >
            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
            return · archive
          </Link>
          <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.22em] uppercase text-ink-soft">
            <span className="flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-[hsl(var(--lime))] animate-pulse" />
              freq {meta.freq}
            </span>
            <span className="opacity-40">·</span>
            <span>utc {utc}</span>
          </div>
        </div>

        {/* Dispatch slate header */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-wrap items-center gap-2 mb-5"
        >
          <Stamp3D color="accent">
            <Stamp className="w-3 h-3" />
            Dispatch #{meta.dispatchNum}
          </Stamp3D>
          {blog.tags?.[0]?.name && (
            <Stamp3D color="amber">
              <MapPin className="w-3 h-3" />
              {blog.tags[0].name}
            </Stamp3D>
          )}
          <Stamp3D color="electric">
            <Compass className="w-3 h-3" />
            {meta.code} · {meta.lat}° {meta.lng}°
          </Stamp3D>
          <Stamp3D color="lime">
            <Clock className="w-3 h-3" />
            {meta.readMin} min read
          </Stamp3D>
        </motion.div>

        {/* Title block */}
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter text-ink leading-[0.95] text-balance mb-6"
          dangerouslySetInnerHTML={{ __html: blog.title }}
        />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="max-w-3xl text-lg md:text-xl text-ink-muted leading-relaxed mb-10"
          dangerouslySetInnerHTML={{ __html: blog.excerpt }}
        />

        {/* Hero image card */}
        {blog.image?.url && (
          <motion.figure
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-3xl border-2 border-ink/10 bg-card overflow-hidden shadow-warm"
          >
            <Tape className="-top-2 left-12 -rotate-6" />
            <Tape className="-top-2 right-12 rotate-6" />

            {/* Console bar */}
            <div className="relative flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-dashed border-ink/15 bg-[hsl(var(--background)/0.6)] backdrop-blur">
              <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.22em] uppercase text-ink-soft">
                <span className="flex items-center gap-1.5">
                  <Radio className="w-3 h-3 text-[hsl(var(--lime))] animate-pulse" />
                  transmission open
                </span>
                <span className="hidden md:inline opacity-60">·</span>
                <span className="hidden md:inline">ch. {meta.freq}</span>
                <span className="hidden md:inline opacity-60">·</span>
                <span className="hidden md:inline">{meta.wx}</span>
              </div>
              <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-soft flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                {blog.publishedDate}
              </div>
            </div>

            <div className="relative aspect-[16/9] md:aspect-[21/9]">
              <img
                className="absolute inset-0 w-full h-full object-cover"
                src={blog.image.url}
                alt={blog.image.alt || blog.title}
                width={1400}
                height={800}
                loading="eager"
              />
              {!reduce && <div className="absolute inset-0 bg-scanlines opacity-25 mix-blend-overlay pointer-events-none" />}
              <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--ink)/0.25)] via-transparent to-transparent pointer-events-none" />

              {/* Postmark */}
              <div className="absolute top-4 right-4 md:top-6 md:right-6 opacity-85">
                <Postmark date={blog.publishedDate.split(',')[0] || blog.publishedDate} code={meta.code} size={110} />
              </div>

              {/* Flight arc */}
              <svg className="absolute bottom-0 left-0 w-full h-24 pointer-events-none" viewBox="0 0 400 80" preserveAspectRatio="none">
                <motion.path
                  d="M 0 60 Q 100 20, 200 45 T 400 30"
                  fill="none"
                  stroke="hsl(var(--lime))"
                  strokeWidth="1"
                  strokeDasharray="3 4"
                  opacity="0.7"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, delay: 0.6 }}
                />
                {!reduce && (
                  <motion.circle
                    r="2.8"
                    fill="hsl(var(--lime))"
                    animate={{ offsetDistance: ['0%', '100%'] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                    style={{ offsetPath: "path('M 0 60 Q 100 20, 200 45 T 400 30')" }}
                  />
                )}
              </svg>
            </div>
          </motion.figure>
        )}
      </div>
    </section>
  )
}

// ============================================================
// Metadata sidebar
// ============================================================

function FieldNotesSidebar({ blog }: { blog: BlogPost }) {
  const meta = stableMeta(blog.slug)
  return (
    <aside className="lg:sticky lg:top-24 space-y-5">
      {/* Dispatch slate */}
      <div className="relative rounded-2xl border-2 border-ink/10 bg-card p-5 shadow-warm">
        <Tape className="-top-2 left-6 -rotate-6" />
        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-dashed border-ink/15">
          <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-soft flex items-center gap-1.5">
            <Stamp className="w-3 h-3" />
            field notes
          </span>
          <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-[hsl(var(--lime))] flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[hsl(var(--lime))] animate-pulse" />
            filed
          </span>
        </div>
        <dl className="space-y-3 font-mono text-[10px] tracking-[0.18em] uppercase text-ink-soft">
          <div className="flex justify-between gap-3">
            <dt>dispatch</dt>
            <dd className="text-ink normal-case tracking-tight">#{meta.dispatchNum}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>coord</dt>
            <dd className="text-ink normal-case tracking-tight">{meta.lat}°, {meta.lng}°</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>sta.</dt>
            <dd className="text-ink normal-case tracking-tight">{meta.code}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>freq</dt>
            <dd className="text-ink normal-case tracking-tight">{meta.freq} MHz</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>read</dt>
            <dd className="text-ink normal-case tracking-tight">{meta.readMin} min</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>wx</dt>
            <dd className="text-ink normal-case tracking-tight">{meta.wx}</dd>
          </div>
          <div className="pt-2 border-t border-dashed border-ink/15">
            <dt className="mb-1">channels</dt>
            <dd className="flex flex-wrap gap-1.5 mt-1.5">
              {blog.tags?.map((t) => (
                <span
                  key={t.slug}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-ink/15 bg-background text-[9px] normal-case tracking-[0.12em]"
                >
                  <MapPin className="w-2.5 h-2.5" />
                  {t.name}
                </span>
              ))}
            </dd>
          </div>
        </dl>
      </div>

      {/* Postmark card */}
      <div className="relative rounded-2xl border-2 border-dashed border-ink/15 bg-background p-5 flex flex-col items-center">
        <span className="font-mono text-[9px] tracking-[0.22em] uppercase text-ink-soft mb-3">
          // postmarked
        </span>
        <Postmark date={blog.publishedDate.split(',')[0] || blog.publishedDate} code={meta.code} size={160} />
        <span className="mt-3 font-mono text-[9px] tracking-[0.22em] uppercase text-ink-soft text-center">
          filed from the road
        </span>
      </div>
    </aside>
  )
}

// ============================================================
// Share
// ============================================================

function SharePost({ blog }: { blog: BlogPost }) {
  const shareUrl = () => (typeof window !== 'undefined' ? window.location.href : '')
  const shareToFacebook = () =>
    window.open('https://www.facebook.com/sharer/sharer.php?u=' + shareUrl(), 'sharer', 'width=626,height=436')
  const shareToTwitter = () =>
    window.open('https://twitter.com/share?url=' + shareUrl() + '&text=' + blog.title, 'sharer', 'width=626,height=436')
  const shareToLinkedIn = () =>
    window.open('https://www.linkedin.com/sharing/share-offsite/?url=' + shareUrl(), 'sharer', 'width=626,height=436')

  const buttons = [
    { label: 'Facebook', Icon: Facebook, onClick: shareToFacebook, color: 'accent' as const },
    { label: 'Twitter', Icon: Twitter, onClick: shareToTwitter, color: 'electric' as const },
    { label: 'LinkedIn', Icon: Linkedin, onClick: shareToLinkedIn, color: 'lime' as const },
  ]

  const ringCls = (c: 'accent' | 'electric' | 'lime') =>
    c === 'electric'
      ? 'border-[hsl(var(--electric))] text-[hsl(var(--electric))] hover:bg-[hsl(var(--electric))] hover:text-background'
      : c === 'lime'
      ? 'border-[hsl(var(--lime))] text-[hsl(var(--lime))] hover:bg-[hsl(var(--lime))] hover:text-background'
      : 'border-[hsl(var(--accent))] text-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))] hover:text-background'

  return (
    <div className="mt-14 pt-8 border-t border-dashed border-ink/15">
      <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.22em] uppercase text-ink-soft mb-5">
        <span className="w-8 h-px bg-ink/25" />
        broadcast this dispatch
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {buttons.map(({ label, Icon, onClick, color }) => (
          <button
            key={label}
            onClick={onClick}
            aria-label={`Share on ${label}`}
            className={`group relative inline-flex items-center gap-2 h-11 px-4 rounded-full border-2 bg-card font-mono text-[10px] tracking-[0.2em] uppercase transition-all hover:-translate-y-0.5 ${ringCls(color)}`}
          >
            <Icon className="w-4 h-4" />
            <span>broadcast · {label.toLowerCase()}</span>
            <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// Main
// ============================================================

export function BlogView({ blog }: BlogViewProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  if (!blog) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-soft mb-3">
            // transmission lost
          </div>
          <p className="text-ink-muted">The dispatch you&apos;re after isn&apos;t on the wire.</p>
          <Link
            to="/blog"
            className="group mt-6 inline-flex items-center gap-2 h-11 px-5 rounded-full border-2 border-ink/15 bg-card text-ink text-sm font-medium hover:border-ink hover:bg-ink hover:text-background transition-all"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Return to archive
          </Link>
        </div>
      </div>
    )
  }

  return (
    <article className="relative">
      <FlightProgress />
      <DispatchHero blog={blog} />

      {/* Body */}
      <section className="relative bg-background">
        <div className="container mx-auto max-w-7xl px-4 py-16 md:py-20">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-14">
            {/* Sidebar */}
            <div className="lg:col-span-4 xl:col-span-3 order-2 lg:order-1">
              <FieldNotesSidebar blog={blog} />
            </div>

            {/* Prose */}
            <div className="lg:col-span-8 xl:col-span-9 order-1 lg:order-2">
              {/* Notebook header */}
              <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.22em] uppercase text-ink-soft mb-8">
                <span className="w-10 h-px bg-ink/25" />
                transcript opens
              </div>

              <div
                ref={contentRef}
                className="prose prose-lg max-w-none
                  prose-headings:font-display prose-headings:tracking-tighter prose-headings:text-ink prose-headings:font-bold
                  prose-h2:text-3xl md:prose-h2:text-4xl prose-h2:mt-14 prose-h2:mb-5 prose-h2:relative prose-h2:pl-4 prose-h2:border-l-4 prose-h2:border-[hsl(var(--accent))]
                  prose-h3:text-2xl md:prose-h3:text-3xl prose-h3:mt-10 prose-h3:mb-4
                  prose-p:text-ink prose-p:leading-[1.8]
                  prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-a:underline-offset-4
                  prose-strong:text-ink prose-strong:font-semibold
                  prose-blockquote:border-l-4 prose-blockquote:border-[hsl(var(--accent))] prose-blockquote:bg-[hsl(var(--accent)/0.05)] prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:font-display prose-blockquote:text-xl prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:my-8 prose-blockquote:text-ink
                  prose-img:rounded-2xl prose-img:border-2 prose-img:border-ink/10 prose-img:shadow-warm
                  prose-ul:my-6 prose-li:text-ink prose-li:marker:text-[hsl(var(--accent))]
                  prose-code:text-accent prose-code:bg-[hsl(var(--accent)/0.08)] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-[0.9em] prose-code:before:content-[''] prose-code:after:content-['']"
                dangerouslySetInnerHTML={{ __html: blog.content }}
              />

              {/* End of transcript */}
              <div className="mt-16 pt-8 border-t border-dashed border-ink/15 flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-soft flex items-center gap-2">
                  <span className="w-8 h-px bg-ink/25" />
                  transcript closes · end of wire
                </span>
                <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-soft hidden md:flex items-center gap-1.5">
                  <Stamp className="w-3 h-3" />
                  signed · fn
                </span>
              </div>

              <SharePost blog={blog} />

              {/* Return */}
              <div className="mt-12">
                <Link
                  to="/blog"
                  className="group inline-flex items-center gap-2 h-12 px-6 rounded-full border-2 border-ink/15 bg-card text-ink text-sm font-medium hover:border-ink hover:bg-ink hover:text-background transition-all"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  Return to the archive
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </article>
  )
}
