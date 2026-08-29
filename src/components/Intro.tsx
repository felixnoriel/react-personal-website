import { m } from 'framer-motion'
import {
  Activity,
  ArrowDown,
  ArrowUpRight,
  Cpu,
  Database,
  Gauge,
  Radio,
  Sparkles,
  Terminal,
  Users,
  Zap,
} from 'lucide-react'
import type { ReactNode, PointerEvent as ReactPointerEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { LiveClock } from './ui/LiveClock'
import { Marquee } from './ui/Marquee'
import { AnimatedNumber } from './ui/AnimatedNumber'
import { MagneticButton } from './ui/MagneticButton'
import { HeroHeadline } from './ui/HeroHeadline'
import { useFxLevel } from '../hooks/useFxLevel'
import { useDepthParallax, type ParallaxLayer } from '../hooks/useDepthParallax'

// ============================================================
// Intro — the hero. Rebuilt around a single GPU fragment-shader
// background (see ShaderField) instead of the ~10 competing
// main-thread animation systems the old hero stacked. The shader
// carries the atmosphere on the GPU; the foreground stays cheap
// (mount-time entrances + a couple of localized loops), which is
// what keeps it smooth for a first-time viewer while looking far
// more advanced.
//
// All prior hero content is preserved — identity, headline, bio,
// tech stack, CTAs — and the right-hand panel is upgraded from a
// decorative "ship engine" into a real engineering-impact deck
// that showcases the production numbers from the data.
// ============================================================

const TECH_STACK = [
  'TypeScript',
  'React',
  'React Native',
  'Node.js',
  'Next.js',
  'Golang',
  'Rust',
  'PostgreSQL',
  'Solana',
  'AWS',
  'GCP',
  'GraphQL',
  'Python',
  'Redis',
  'EVM',
  'Datadog',
]

const BOOT_LINE = 'felix --status --live'
const SESSION_ID = '#2847'

type Accent = 'accent' | 'lime' | 'electric' | 'amber'

const A_TEXT: Record<Accent, string> = {
  accent: 'text-accent',
  lime: 'text-lime',
  electric: 'text-electric',
  amber: 'text-amber',
}

// Real production impact, pulled from the career/projects data. These are the
// numbers that say "software engineer" louder than any decoration.
type Metric = {
  value: number
  decimals: number
  suffix: string
  label: string
  sub: string
  accent: Accent
  fill: number
  Icon: typeof Activity
}

const METRICS: Metric[] = [
  {
    value: 7.5,
    decimals: 1,
    suffix: 'M+',
    label: 'messages / day',
    sub: 'event pipeline → BigQuery',
    accent: 'electric',
    fill: 0.94,
    Icon: Activity,
  },
  {
    value: 150,
    decimals: 0,
    suffix: 'k',
    label: 'monthly actives',
    sub: 'Genopets · Web3 gaming',
    accent: 'accent',
    fill: 0.78,
    Icon: Users,
  },
  {
    value: 80,
    decimals: 0,
    suffix: '%',
    label: 'faster p95',
    sub: 'latency optimization',
    accent: 'lime',
    fill: 0.8,
    Icon: Gauge,
  },
  {
    value: 1.8,
    decimals: 1,
    suffix: 'M+',
    label: 'users reached',
    sub: 'notification system',
    accent: 'amber',
    fill: 0.7,
    Icon: Database,
  },
]

const IMPACT_CHIPS = [
  '13+ yrs shipping',
  '60k DAU anti-fraud',
  '300+ req/sec peak',
  '20+ venues · Dashify',
  '75% infra cost saved',
]

export function Intro() {
  const sectionRef = useRef<HTMLElement>(null)
  const { reduceMotion, isMobile, disableHeavyFx } = useFxLevel()

  // Pointer-depth rig — the three hero layers drift at different depths
  // with the cursor so the scene reads as 3D. Writes the CSS `translate`
  // property, which composes with framer's transform (same element) and
  // the scroll-exit animation (ancestor wrappers). Desktop only.
  const leftLayerRef = useRef<HTMLDivElement>(null)
  const panelLayerRef = useRef<HTMLDivElement>(null)
  const hudLayerRef = useRef<HTMLDivElement>(null)
  const parallaxLayers = useMemo<ParallaxLayer[]>(
    () => [
      { ref: leftLayerRef, depth: -7 }, // foreground: against the cursor
      { ref: panelLayerRef, depth: -12 }, // closest: strongest counter-drift
      { ref: hudLayerRef, depth: 9 }, // background frame: drifts with it
    ],
    [],
  )
  useDepthParallax(sectionRef, parallaxLayers, !disableHeavyFx)

  // Instant (not smooth) CTA scroll — a hard-won fix from this repo's history:
  // smooth-scroll is a JS-driven animation that competes with the heavy
  // below-the-fold sections on the main thread and makes the click feel frozen.
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'auto', block: 'start' })
  }

  // boot-line typewriter — one-shot. Reduced-motion gets it instantly.
  const [bootTyped, setBootTyped] = useState('')
  useEffect(() => {
    if (reduceMotion) {
      setBootTyped(BOOT_LINE)
      return
    }
    const cadence = isMobile ? 65 : 38
    let i = 0
    const t = setInterval(() => {
      i++
      setBootTyped(BOOT_LINE.slice(0, i))
      if (i >= BOOT_LINE.length) clearInterval(t)
    }, cadence)
    return () => clearInterval(t)
  }, [reduceMotion, isMobile])

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-transparent"
    >
      {/* The living shader backdrop is global (mounted in Home) — the hero
          floats over it like every other section. Just a little extra HUD
          texture here. */}
      <StaticSubstrate />
      {/* vivid aurora blooms — saturated gradient fields that make the light
          theme read as a designed holographic surface, not plain paper.
          Pure CSS, compositor-only drift, hidden for reduced motion via the
          existing animate-float-slow gate (they stay as static color). */}
      <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="animate-float-slow absolute -top-[10%] -left-[6%] w-[55vw] h-[55vw] max-w-[760px] max-h-[760px] rounded-full opacity-45 dark:opacity-25 blur-3xl"
          style={{
            background:
              'radial-gradient(circle at 35% 35%, hsl(var(--accent) / 0.55), hsl(var(--electric) / 0.35) 45%, transparent 70%)',
          }}
        />
        <div
          className="animate-float-slow absolute top-[26%] -right-[10%] w-[48vw] h-[48vw] max-w-[680px] max-h-[680px] rounded-full opacity-40 dark:opacity-20 blur-3xl"
          style={{
            background:
              'radial-gradient(circle at 60% 40%, hsl(var(--lime) / 0.6), hsl(var(--amber) / 0.35) 50%, transparent 72%)',
            animationDelay: '-7s',
          }}
        />
      </div>
      <div
        ref={hudLayerRef}
        className="hero-exit-hud absolute inset-0 pointer-events-none z-10"
      >
        <HudCorners />
      </div>

      <div className="container relative z-10 mx-auto px-6 pt-20 md:pt-24 pb-8 flex-1 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center w-full">
          {/* ---- left: identity + headline + bio + CTAs ----
              Outer div owns the scroll-driven exit (CSS transform/opacity);
              the m.div owns the entrance + the parallax `translate`. */}
          <div className="lg:col-span-7 max-w-3xl hero-exit-head">
          <m.div
            ref={leftLayerRef}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* boot strip */}
            <div className="flex flex-wrap items-center gap-2.5 mb-6 text-[11px]">
              <div
                className="inline-flex items-center gap-2 h-8 px-3 rounded-lg border border-ink/[0.08] bg-background/30 backdrop-blur-md font-mono tracking-normal text-[11px]"
                style={{
                  boxShadow:
                    'inset 0 1px 0 0 hsl(var(--background) / 0.5), 0 2px 10px -6px hsl(var(--ink) / 0.25)',
                }}
              >
                <span className="text-lime">felix@portfolio</span>
                <span className="text-ink-soft">:~$</span>
                {/* reserve the full command's width from first paint — the chip
                    growing as it types was wrapping the session chip onto a new
                    row mid-boot and shifting the whole hero down (CLS) */}
                <span className="relative text-ink">
                  {/* nowrap: the reservation must occupy one line exactly like
                      the overlay, or the two disagree below ~345px width */}
                  <span aria-hidden className="invisible whitespace-nowrap">{BOOT_LINE}</span>
                  <span className="absolute inset-y-0 left-0 whitespace-nowrap">
                    {bootTyped}
                    {bootTyped.length < BOOT_LINE.length && (
                      <span className="inline-block w-1.5 h-3.5 bg-ink animate-blink align-middle" />
                    )}
                  </span>
                </span>
              </div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-lime/30 bg-lime/[0.1] backdrop-blur-md text-ink"
                style={{
                  boxShadow:
                    'inset 0 1px 0 0 hsl(var(--background) / 0.35), 0 0 18px -7px hsl(var(--lime) / 0.7)',
                }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="motion-safe-mobile absolute inline-flex h-full w-full rounded-full bg-lime opacity-75 animate-ping" />
                  <span
                    className="relative inline-flex h-2 w-2 rounded-full bg-lime"
                    style={{ boxShadow: '0 0 6px hsl(var(--lime))' }}
                  />
                </span>
                <span className="font-mono text-[11px] tracking-wide">status: available</span>
              </div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-ink/[0.08] bg-background/30 backdrop-blur-md text-ink-muted"
                style={{ boxShadow: 'inset 0 1px 0 0 hsl(var(--background) / 0.45)' }}
              >
                <Terminal className="w-3 h-3 text-electric/80" />
                <LiveClock timezone="UTC" className="text-ink text-xs" />
                <span className="text-ink-soft">· UTC</span>
              </div>
              <div
                className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-ink/[0.08] bg-background/30 backdrop-blur-md text-ink-muted font-mono text-[10.5px] tracking-[0.1em]"
                style={{ boxShadow: 'inset 0 1px 0 0 hsl(var(--background) / 0.45)' }}
              >
                <span className="text-ink-soft">session</span>
                <span className="text-accent tabular-nums">{SESSION_ID}</span>
              </div>
              <RendererChip />
            </div>

            {/* headline — the WebGL particle swarm (real text paints first for
                LCP/SEO, then ~10k particles assemble it and react to the
                cursor); falls back to the kinetic variable-font treatment
                where WebGL isn't available. See HeroHeadline. */}
            <h1
              aria-label="Product Engineer · Problem Solver"
              className="font-display leading-[1.05] tracking-tighter font-bold mb-6"
            >
              <HeroHeadline />
            </h1>

            <WhoamiTerminal />

            <div className="flex flex-wrap items-center gap-3">
              <MagneticButton
                onClick={() => scrollToSection('projects-section')}
                strength={0.4}
                className="group corner-squircle relative inline-flex items-center gap-2 h-12 px-6 rounded-full bg-ink text-background text-sm font-medium hover:bg-accent transition-colors overflow-hidden"
              >
                <span className="relative z-10">See selected work</span>
                <ArrowUpRight className="w-4 h-4 relative z-10 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                <span
                  aria-hidden
                  className="absolute inset-0 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 bg-gradient-to-r from-accent via-amber/70 to-lime/40"
                />
              </MagneticButton>
              <MagneticButton
                onClick={() => scrollToSection('contact-section')}
                strength={0.3}
                className="group inline-flex items-center gap-2 h-12 px-6 rounded-full border border-ink/15 text-ink text-sm font-medium hover:border-ink/40 hover:bg-surface/60 backdrop-blur-sm transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-accent group-hover:rotate-12 transition-transform" />
                Get in touch
              </MagneticButton>
            </div>
          </m.div>
          </div>

          {/* ---- right: engineering-impact telemetry deck ---- */}
          <div className="lg:col-span-5 hero-exit-panel">
          <m.div
            ref={panelLayerRef}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <MetricsPanel />
          </m.div>
          </div>
        </div>
      </div>

      {/* tech marquee */}
      <div className="relative z-10 border-y border-border bg-surface/40 backdrop-blur-sm py-4">
        <Marquee className="text-[11px] tracking-[0.25em] uppercase text-ink-muted">
          {TECH_STACK.map((tech, i) => (
            <div key={`${tech}-${i}`} className="flex items-center gap-12">
              <span className="font-mono">{tech}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-accent/40" />
            </div>
          ))}
        </Marquee>
      </div>

      {/* scroll cue */}
      <m.button
        onClick={() => scrollToSection('skills-section')}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.8 }}
        className="hidden md:flex absolute bottom-28 right-10 flex-col items-center gap-3 text-xs tracking-[0.2em] uppercase text-ink-muted hover:text-ink transition-colors group z-10"
        aria-label="Scroll to explore"
      >
        Scroll
        <span aria-hidden className="relative block w-px h-14 bg-border overflow-hidden">
          <m.span
            className="absolute top-0 left-0 w-full bg-gradient-to-b from-accent via-lime to-transparent"
            initial={{ height: 0, y: 0 }}
            animate={{ height: '60%', y: ['0%', '140%', '0%'] }}
            transition={{
              height: { duration: 0.8, delay: 1.6, ease: 'easeOut' },
              y: { duration: 2.2, delay: 2.4, repeat: Infinity, ease: 'easeInOut' },
            }}
          />
        </span>
        <m.span
          animate={{ y: [0, 4, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="group-hover:text-accent transition-colors"
        >
          <ArrowDown className="w-4 h-4" />
        </m.span>
      </m.button>
    </section>
  )
}

// ============================================================
// RendererChip — an honest tech readout: which engine is painting the
// backdrop (webgpu compute galaxy / webgl aurora), how many particles,
// and a live fps counter the engine writes directly into #fx-fps.
// ============================================================

type RendererInfo = { kind: 'webgpu' | 'webgl' | 'static'; count: number }

function RendererChip() {
  const [info, setInfo] = useState<RendererInfo | null>(null)
  useEffect(() => {
    const cached = (window as unknown as { __fxRendererInfo?: RendererInfo }).__fxRendererInfo
    if (cached) setInfo(cached)
    const on = (e: Event) => setInfo((e as CustomEvent<RendererInfo>).detail)
    window.addEventListener('fx:renderer', on)
    return () => window.removeEventListener('fx:renderer', on)
  }, [])
  if (!info || info.kind === 'static') return null
  return (
    <div
      className="hidden lg:inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-electric/25 bg-electric/[0.07] backdrop-blur-md text-ink-muted font-mono text-[10.5px] tracking-[0.08em]"
      style={{ boxShadow: 'inset 0 1px 0 0 hsl(var(--background) / 0.35), 0 0 16px -8px hsl(var(--electric) / 0.7)' }}
    >
      <Zap className="w-3 h-3 text-electric" />
      <span className="text-ink">{info.kind}</span>
      {info.kind === 'webgpu' && (
        <>
          <span className="text-ink-soft">·</span>
          <span className="text-electric tabular-nums">{Math.round(info.count / 1000)}k</span>
          <span className="text-ink-soft">particles</span>
          <span className="text-ink-soft">·</span>
          <span id="fx-fps" className="text-lime tabular-nums">
            —
          </span>
          <span className="text-ink-soft">fps</span>
        </>
      )}
    </div>
  )
}

// ============================================================
// MetricsPanel — production-telemetry deck. Real career numbers
// presented as a live observability readout (on-brand: he ships
// with Datadog). Counters animate once on view; fill bars run a
// one-shot entrance. No perpetual loops.
// ============================================================

const A_HSL: Record<Accent, string> = {
  accent: 'var(--accent)',
  lime: 'var(--lime)',
  electric: 'var(--electric)',
  amber: 'var(--amber)',
}

// stable, gently-rising telemetry sparkline path from a seed string
function buildSpark(seed: string): { line: string; area: string } {
  let s = 0
  for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0
  const rng = () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
  const n = 14
  const pts: Array<[number, number]> = []
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 100
    const trend = 21 - (i / (n - 1)) * 15 // rising left→right (SVG y is down)
    const y = Math.max(3, Math.min(23, trend + (rng() - 0.5) * 7))
    pts.push([x, y])
  }
  const line = 'M ' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L ')
  return { line, area: `${line} L 100 26 L 0 26 Z` }
}

// live telemetry sparkline — area + a drawn-in line + a bright signal pulse
// that continuously flows along the data (1 cheap SMIL dash animation)
function MiniSparkline({ accent, seed }: { accent: Accent; seed: string }) {
  const { line, area } = useMemo(() => buildSpark(seed), [seed])
  const hsl = `hsl(${A_HSL[accent]})`
  const gid = `spk-${seed.replace(/\W/g, '')}`
  // faster, per-box pulse rate (1.0–1.4s) so the four feeds sweep at slightly
  // different speeds instead of pulsing in lockstep
  const pulseDur = useMemo(() => {
    let h = 0
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
    return 1.0 + (h % 5) * 0.1
  }, [seed])
  return (
    <svg viewBox="0 0 100 26" preserveAspectRatio="none" className="w-full h-6 mt-2.5" aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={hsl} stopOpacity="0.3" />
          <stop offset="100%" stopColor={hsl} stopOpacity="0" />
        </linearGradient>
      </defs>
      <m.path
        d={area}
        fill={`url(#${gid})`}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.4 }}
      />
      <m.path
        d={line}
        fill="none"
        stroke={hsl}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 0.5 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      />
      {/* the bright signal pulse sweeping the line */}
      <path
        d={line}
        fill="none"
        stroke={hsl}
        strokeWidth="2.2"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        pathLength={100}
        strokeDasharray="14 86"
        style={{ filter: `drop-shadow(0 0 2px ${hsl})` }}
      >
        <animate attributeName="stroke-dashoffset" from="100" to="0" dur={`${pulseDur.toFixed(2)}s`} repeatCount="indefinite" />
      </path>
    </svg>
  )
}

// live throughput ticker — a small ops/sec readout that flickers like a feed
function LiveStat() {
  const [v, setV] = useState(2840)
  useEffect(() => {
    const id = setInterval(() => setV(2650 + Math.floor(Math.random() * 480)), 420)
    return () => clearInterval(id)
  }, [])
  return <span className="tabular-nums">{v.toLocaleString()}</span>
}

function MetricsPanel() {
  // Holographic tilt — the deck leans toward the cursor with a tracking
  // glare, same rAF-coalesced GPU-transform pattern as GlassPanel (the
  // proven one from this repo's perf history). Desktop only.
  const { disableHeavyFx } = useFxLevel()
  const tiltRef = useRef<HTMLDivElement>(null)
  const glareRef = useRef<HTMLDivElement>(null)
  const tiltRaf = useRef<number | null>(null)
  // rect cached on pointerenter — reading it per pointermove would force a
  // layout under the parallax + scroll-exit writers on this same subtree
  const tiltRect = useRef<DOMRect | null>(null)
  const tiltState = useRef({ x: 0, y: 0, rx: 0, ry: 0 })

  useEffect(() => {
    if (disableHeavyFx) {
      // clear leftover pointer styles (e.g. desktop→mobile resize mid-hover)
      tiltRef.current?.style.removeProperty('transform')
      tiltRef.current?.style.removeProperty('transition')
      glareRef.current?.style.removeProperty('transform')
    }
    return () => {
      if (tiltRaf.current != null) cancelAnimationFrame(tiltRaf.current)
    }
  }, [disableHeavyFx])

  const applyTilt = () => {
    tiltRaf.current = null
    const s = tiltState.current
    if (tiltRef.current) {
      tiltRef.current.style.transform = `perspective(1100px) rotateX(${s.rx.toFixed(2)}deg) rotateY(${s.ry.toFixed(2)}deg)`
    }
    if (glareRef.current) {
      glareRef.current.style.transform = `translate3d(${s.x - 300}px, ${s.y - 300}px, 0)`
    }
  }

  const onTiltEnter = (e: ReactPointerEvent<HTMLDivElement>) => {
    tiltRect.current = tiltRef.current?.getBoundingClientRect() ?? null
    onTiltMove(e)
  }

  const onTiltMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = tiltRef.current
    const r = tiltRect.current
    if (!el || !r) return
    const x = e.clientX - r.left
    const y = e.clientY - r.top
    tiltState.current.x = x
    tiltState.current.y = y
    tiltState.current.rx = (0.5 - y / r.height) * 4.5
    tiltState.current.ry = (x / r.width - 0.5) * 4.5
    el.style.transition = 'none'
    if (tiltRaf.current == null) tiltRaf.current = requestAnimationFrame(applyTilt)
  }

  const onTiltLeave = () => {
    const el = tiltRef.current
    if (!el) return
    el.style.transition = 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)'
    el.style.transform = 'perspective(1100px) rotateX(0deg) rotateY(0deg)'
  }

  return (
    <div
      ref={tiltRef}
      onPointerEnter={disableHeavyFx ? undefined : onTiltEnter}
      onPointerMove={disableHeavyFx ? undefined : onTiltMove}
      onPointerLeave={disableHeavyFx ? undefined : onTiltLeave}
      className="group/metrics relative rounded-2xl overflow-hidden"
      style={disableHeavyFx ? undefined : { willChange: 'transform' }}
    >
      {/* feathered frosted backdrop — dissolves into the shader at its edges */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-[inherit] bg-background/28 backdrop-blur-2xl"
        style={{
          WebkitMaskImage:
            'linear-gradient(to right, transparent, #000 6%, #000 94%, transparent), linear-gradient(to bottom, transparent, #000 5%, #000 95%, transparent)',
          WebkitMaskComposite: 'source-in',
          maskImage:
            'linear-gradient(to right, transparent, #000 6%, #000 94%, transparent), linear-gradient(to bottom, transparent, #000 5%, #000 95%, transparent)',
          maskComposite: 'intersect',
        }}
      />
      {/* holographic glare — a soft sheen tracking the cursor while tilted.
          Not rendered at all when effects are gated off (mobile / reduced
          motion): nothing would ever drive it, and its promoted layer +
          blend mode would just leak GPU memory and hover-latch on tap. */}
      {!disableHeavyFx && (
        <div
          ref={glareRef}
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 z-10 w-[600px] h-[600px] opacity-0 group-hover/metrics:opacity-100 transition-opacity duration-300 mix-blend-overlay"
          style={{
            background:
              'radial-gradient(circle at center, rgba(255,255,255,0.16), transparent 55%)',
            willChange: 'transform',
          }}
        />
      )}
      {/* title bar */}
      <div className="relative z-10 flex items-center gap-2 px-4 py-2.5 border-b border-ink/5">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rotate-45 rounded-[1px] bg-accent" />
          <span className="w-1.5 h-1.5 rotate-45 rounded-[1px] bg-lime" />
          <span className="w-1.5 h-1.5 rotate-45 rounded-[1px] bg-electric" />
        </span>
        <span className="ml-1.5 font-mono text-[10.5px] text-ink-soft truncate">
          felix.sys · prod.metrics
        </span>
        <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-[9.5px] tracking-[0.18em] uppercase text-ink-soft">
          <span className="relative flex h-1.5 w-1.5">
            <span className="motion-safe-mobile absolute inline-flex h-full w-full rounded-full bg-lime opacity-75 animate-ping" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lime" />
          </span>
          live
        </span>
      </div>

      {/* readout header */}
      <div className="relative z-10 flex items-center justify-between px-4 py-2.5 border-b border-ink/5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <Cpu className="w-3 h-3 text-accent" />
          aggregate impact
        </span>
        <span className="text-ink-muted">2013 → now</span>
      </div>

      {/* metric grid */}
      <div className="relative z-10 grid grid-cols-2 gap-2.5 px-4 pt-3 pb-1">
        {METRICS.map((m) => (
          <div
            key={m.label}
            className="relative p-3.5 rounded-xl bg-background/40 border border-ink/[0.06] overflow-hidden"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-soft">
                {m.label}
              </span>
              <m.Icon className={`w-3.5 h-3.5 ${A_TEXT[m.accent]}`} />
            </div>
            <div
              className={`font-display text-[1.7rem] leading-none font-bold tabular-nums ${A_TEXT[m.accent]}`}
              style={{ textShadow: `0 0 22px hsl(${A_HSL[m.accent]} / 0.3)` }}
            >
              <AnimatedNumber
                value={m.value}
                decimals={m.decimals}
                suffix={m.suffix}
                duration={1600}
              />
            </div>
            <div className="font-mono text-[9.5px] text-ink-muted mt-1 truncate">
              {m.sub}
            </div>
            <MiniSparkline accent={m.accent} seed={m.label} />
          </div>
        ))}
      </div>

      {/* impact chips — native sibling-index() stagger where supported */}
      <div className="stagger-in relative z-10 flex flex-wrap gap-1.5 px-4 py-3 mt-1">
        {IMPACT_CHIPS.map((c, i) => {
          const a: Accent = (['accent', 'lime', 'electric', 'amber', 'accent'] as Accent[])[i]
          return (
            <span
              key={c}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border backdrop-blur-md font-mono text-[9.5px] tracking-tight text-ink-muted"
              style={{
                background: `hsl(${A_HSL[a]} / 0.07)`,
                borderColor: `hsl(${A_HSL[a]} / 0.24)`,
                boxShadow: `inset 0 1px 0 0 hsl(var(--background) / 0.4), 0 0 16px -10px hsl(${A_HSL[a]} / 0.8)`,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{
                  background: `hsl(${A_HSL[a]})`,
                  boxShadow: `0 0 6px hsl(${A_HSL[a]} / 0.9)`,
                  animationDelay: `${i * 0.25}s`,
                }}
              />
              {c}
            </span>
          )
        })}
      </div>

      {/* footer status line */}
      <div className="relative z-10 flex items-center justify-between px-4 py-2 border-t border-ink/5 font-mono text-[9.5px] tracking-[0.1em] text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <Radio className="w-3 h-3 text-lime" />
          live · <LiveStat /> ops/s
        </span>
        <span className="inline-flex items-center gap-1.5 text-ink-muted">
          <Zap className="w-3 h-3 text-amber" />
          13+ yrs · 4 industries
        </span>
      </div>
    </div>
  )
}

// ============================================================
// WhoamiTerminal — types `whoami`, then streams the bio out
// character-by-character. Type-once (no perpetual re-loop), so a
// first-time viewer sees the full reveal and the main thread goes
// quiet afterward.
// ============================================================

type WhoamiFragment = { t: string; cls?: string }

const WHOAMI_COMMAND = 'whoami'
const WHOAMI_OUTPUT: WhoamiFragment[][] = [
  [
    { t: "I'm " },
    { t: 'Felix', cls: 'text-ink font-semibold' },
    { t: ' — a senior full-stack engineer and technical co-founder.' },
  ],
  [
    { t: '13+ years', cls: 'text-accent font-semibold' },
    { t: ' shipping software for startups across ' },
    { t: 'Web3', cls: 'text-accent' },
    { t: ', ' },
    { t: 'fintech', cls: 'text-lime' },
    { t: ', ' },
    { t: 'hospitality', cls: 'text-electric' },
    { t: ', and ' },
    { t: 'media', cls: 'text-amber' },
    { t: '.' },
  ],
  [
    { t: 'Currently based in ' },
    { t: 'Asia', cls: 'text-lime font-semibold' },
    { t: ' and digital nomading with the ' },
    { t: 'fam', cls: 'text-accent font-semibold' },
    { t: '.' },
  ],
]

// Every character is laid out at its FINAL position from the first frame
// (untyped chars are just invisible), so typing changes zero geometry — no
// re-wrapping, no caret push, no layout shift. The reveal is pure opacity,
// and the "caret" is a block highlight on the next untyped cell (classic
// terminal cursor) — it occupies the cell it already owns.
function renderFragments(
  fragments: WhoamiFragment[],
  charsShown: number,
  showCaret = false,
): ReactNode[] {
  const out: ReactNode[] = []
  let cursor = 0
  for (let fi = 0; fi < fragments.length; fi++) {
    const frag = fragments[fi]
    const start = cursor
    out.push(
      <span key={fi} className={frag.cls}>
        {[...frag.t].map((ch, ci) => {
          const idx = start + ci
          if (idx < charsShown) return ch
          const isCaret = showCaret && idx === charsShown
          return (
            <span key={ci} className={isCaret ? 'term-caret' : 'opacity-0'}>
              {ch}
            </span>
          )
        })}
      </span>,
    )
    cursor += frag.t.length
  }
  return out
}

function CaretInline() {
  return (
    <span
      aria-hidden
      // negative right margin cancels the caret's own width so it never pushes a
      // word onto a new line mid-type (which would jitter the terminal height)
      className="inline-block w-[7px] h-[15px] bg-ink animate-blink align-middle ml-0.5 -mr-[7px] translate-y-[-1px]"
    />
  )
}

// one console line with a code-editor line-number gutter
function ConsoleRow({
  n,
  children,
  hidden = false,
  dim = false,
}: {
  n: number | string
  children: ReactNode
  hidden?: boolean
  dim?: boolean
}) {
  return (
    <div
      className="flex min-h-[1.85em] transition-opacity duration-150"
      style={{ opacity: hidden ? 0 : 1 }}
      aria-hidden={hidden}
    >
      <span className="w-7 shrink-0 text-right pr-3 mr-3 border-r border-border/40 text-ink-soft/40 select-none tabular-nums">
        {n}
      </span>
      <span className={`flex-1 min-w-0 break-words ${dim ? 'text-ink-soft' : 'text-ink-muted'}`}>
        {children}
      </span>
    </div>
  )
}

// ── interactive commands ──────────────────────────────────────────
type TermEntry = { cmd: string; out: ReactNode }

const TERM_JUMPS: Record<string, { id: string; label: string }> = {
  work: { id: 'projects-section', label: 'selected work' },
  projects: { id: 'projects-section', label: 'selected work' },
  skills: { id: 'skills-section', label: 'skills' },
  stack: { id: 'skills-section', label: 'skills' },
  contact: { id: 'contact-section', label: 'contact' },
}

const TERM_HELP = (
  <div>
    <div>
      <span className="text-ink">whoami</span> · replay the intro
    </div>
    <div>
      <span className="text-ink">work</span> · <span className="text-ink">skills</span> ·{' '}
      <span className="text-ink">contact</span> · jump to a section
    </div>
    <div>
      <span className="text-ink">clear</span> · wipe the screen
    </div>
    <div className="text-ink-soft">
      hint: real engineers use <span className="text-accent">sudo</span>
    </div>
  </div>
)

function WhoamiTerminal() {
  const lineLengths = useMemo(
    () => WHOAMI_OUTPUT.map((l) => l.reduce((n, f) => n + f.t.length, 0)),
    [],
  )
  const [typedCmd, setTypedCmd] = useState('')
  const [typedPerLine, setTypedPerLine] = useState<number[]>(() =>
    WHOAMI_OUTPUT.map(() => 0),
  )
  // sticks true after the first reveal: the prompt row stays mounted (and
  // focused input alive) even while `whoami` replays the intro
  const [everDone, setEverDone] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [entries, setEntries] = useState<TermEntry[]>([])
  const [draft, setDraft] = useState('')
  // bumping this replays the whoami intro (the `whoami` command)
  const [cycle, setCycle] = useState(0)
  const hostRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setTypedCmd(WHOAMI_COMMAND)
      setTypedPerLine(lineLengths)
      setEverDone(true)
      setReduceMotion(true)
      return
    }

    // Type-ONCE reveal (no perpetual loop — the terminal parks on an
    // interactive prompt when finished, so the main thread goes quiet).
    const timers: ReturnType<typeof setTimeout>[] = []
    const intervals: ReturnType<typeof setInterval>[] = []
    let cancelled = false

    function addTimer(fn: () => void, ms: number) {
      const t = setTimeout(() => {
        if (!cancelled) fn()
      }, ms)
      timers.push(t)
    }

    function typeLine(lineIdx: number) {
      if (cancelled) return
      if (lineIdx >= WHOAMI_OUTPUT.length) {
        addTimer(() => setEverDone(true), 360)
        return
      }
      const targetLen = lineLengths[lineIdx]
      let chars = 0
      const interval = setInterval(() => {
        if (cancelled) {
          clearInterval(interval)
          return
        }
        // same chars/second as a per-char tick, but 3× fewer React renders —
        // long-task cost during load matters more than per-char granularity
        const burst = Math.random() < 0.35 ? 4 : 3
        chars = Math.min(chars + burst, targetLen)
        setTypedPerLine((prev) => {
          const next = [...prev]
          next[lineIdx] = chars
          return next
        })
        if (chars >= targetLen) {
          clearInterval(interval)
          addTimer(() => typeLine(lineIdx + 1), 150)
        }
      }, 42)
      intervals.push(interval)
    }

    setTypedCmd('')
    setTypedPerLine(WHOAMI_OUTPUT.map(() => 0))
    let cmdChar = 0
    const cmdInt = setInterval(() => {
      if (cancelled) {
        clearInterval(cmdInt)
        return
      }
      cmdChar++
      setTypedCmd(WHOAMI_COMMAND.slice(0, cmdChar))
      if (cmdChar >= WHOAMI_COMMAND.length) {
        clearInterval(cmdInt)
        addTimer(() => typeLine(0), 240)
      }
    }, 60)
    intervals.push(cmdInt)

    return () => {
      cancelled = true
      intervals.forEach((i) => clearInterval(i))
      timers.forEach((t) => clearTimeout(t))
    }
  }, [lineLengths, cycle])

  const runCommand = (raw: string) => {
    const cmd = raw.trim()
    if (!cmd) return
    const c = cmd.toLowerCase()
    if (c === 'clear') {
      setEntries([])
      return
    }
    if (c === 'whoami') {
      setEntries([])
      setCycle((k) => k + 1)
      return
    }
    let out: ReactNode
    if (c === 'help' || c === '?') {
      out = TERM_HELP
    } else if (TERM_JUMPS[c]) {
      const jump = TERM_JUMPS[c]
      out = (
        <span>
          opening <span className="text-ink">{jump.label}</span>…
        </span>
      )
      setTimeout(() => {
        document.getElementById(jump.id)?.scrollIntoView({ behavior: 'auto', block: 'start' })
      }, 350)
    } else if (c === 'sudo hire-felix' || c === 'sudo hire felix' || c === 'sudo hire') {
      // detonate + reassemble the particle headline
      window.dispatchEvent(new Event('fx:burst'))
      out = (
        <span>
          <span className="text-lime">access granted</span> — offer inbound. felix@
          <span className="text-accent">your-team</span> provisioned ✓
        </span>
      )
    } else if (c === 'hire-felix' || c === 'hire felix' || c === 'hire') {
      out = (
        <span className="text-amber">
          permission denied — try <span className="text-ink">sudo hire-felix</span>
        </span>
      )
    } else {
      out = (
        <span>
          command not found: <span className="text-ink">{cmd}</span> — try{' '}
          <span className="text-accent">help</span>
        </span>
      )
    }
    setEntries((prev) => [...prev.slice(-2), { cmd, out }])
  }

  const cmdTyping = typedCmd.length < WHOAMI_COMMAND.length
  const activeLineIdx = typedPerLine.findIndex((n, i) => n > 0 && n < lineLengths[i])
  const caretOnLine = !cmdTyping && activeLineIdx !== -1 ? activeLineIdx : -1
  const entryBase = WHOAMI_OUTPUT.length + 2

  return (
    <m.div
      ref={hostRef}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      // the whole terminal is a click target for its prompt (real terminal feel)
      onClick={() => everDone && inputRef.current?.focus({ preventScroll: true })}
      className={`relative max-w-2xl mb-7 rounded-2xl overflow-hidden ${everDone ? 'cursor-text' : ''}`}
    >
      {/* feathered frosted backdrop — dissolves into the shader at its edges
          instead of sitting on top as a framed card */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-[inherit] bg-background/25 backdrop-blur-2xl"
        style={{
          WebkitMaskImage:
            'linear-gradient(to right, transparent, #000 6%, #000 94%, transparent), linear-gradient(to bottom, transparent, #000 7%, #000 93%, transparent)',
          WebkitMaskComposite: 'source-in',
          maskImage:
            'linear-gradient(to right, transparent, #000 6%, #000 94%, transparent), linear-gradient(to bottom, transparent, #000 7%, #000 93%, transparent)',
          maskComposite: 'intersect',
        }}
      />
      {/* header — palette mark + path + live equalizer */}
      <div className="relative z-10 flex items-center gap-2 px-5 py-2.5 border-b border-ink/5 font-mono text-[10.5px]">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rotate-45 rounded-[1px] bg-accent" />
          <span className="w-1.5 h-1.5 rotate-45 rounded-[1px] bg-lime" />
          <span className="w-1.5 h-1.5 rotate-45 rounded-[1px] bg-electric" />
        </span>
        <span className="text-lime ml-1.5">felix@portfolio</span>
        <span className="text-ink-soft">:~/about</span>
        <span className="ml-auto inline-flex items-center gap-2 uppercase tracking-[0.16em] text-[9.5px] text-ink-soft">
          <span className="flex items-end gap-[2px] h-3" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="eq-bar w-[2px] h-full rounded-full bg-lime"
                style={{ animationDelay: `${i * 0.13}s` }}
              />
            ))}
          </span>
          running
        </span>
      </div>

      <div
        className="relative z-10 px-4 py-4 font-mono text-[13px] md:text-[14px] leading-[1.85]"
        aria-label="About Felix"
      >
        <ConsoleRow n={1} dim>
          <span className="text-accent mr-2">$</span>
          <span className="text-ink">{typedCmd}</span>
          {cmdTyping && <CaretInline />}
        </ConsoleRow>

        {WHOAMI_OUTPUT.map((fragments, i) => {
          const chars = typedPerLine[i]
          const visible = chars > 0 || reduceMotion
          return (
            <ConsoleRow key={i} n={i + 2} hidden={!visible}>
              <span className="text-accent/45 mr-2 select-none">▸</span>
              {renderFragments(fragments, chars, caretOnLine === i)}
            </ConsoleRow>
          )
        })}

        {/* interactive history — capped at the last 3 commands. The log
            container is always mounted so the live region exists before its
            first announcement (screen readers miss regions that appear with
            their content). */}
        <div role="log" aria-live="polite">
          {entries.map((e, i) => (
            <div key={`${i}-${e.cmd}`} className="term-entry">
              <ConsoleRow n={entryBase + i * 2} dim>
                <span className="text-accent mr-2">$</span>
                <span className="text-ink">{e.cmd}</span>
              </ConsoleRow>
              <ConsoleRow n={entryBase + i * 2 + 1}>
                <span className="text-accent/45 mr-2 select-none">▸</span>
                {e.out}
              </ConsoleRow>
            </div>
          ))}
        </div>

        {/* live prompt — a real terminal. Type `help`. Always mounted (it
            reserves its row from first paint — no shift when it activates,
            and focus survives a `whoami` replay), revealed once typed out. */}
        <div
          className={`flex min-h-[1.85em] transition-opacity duration-300 ${
            everDone ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden={!everDone}
        >
          <span className="w-7 shrink-0 text-right pr-3 mr-3 border-r border-border/40 text-ink-soft/40 select-none">
            ❯
          </span>
          <span className="text-accent mr-2">$</span>
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                runCommand(draft)
                setDraft('')
              }
            }}
            aria-label="Terminal command input"
            placeholder='type "help"'
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            tabIndex={everDone ? 0 : -1}
            className="flex-1 min-w-0 bg-transparent border-none outline-none font-mono text-[16px] md:text-[14px] text-ink placeholder:text-ink-soft/45 rounded focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent/50"
            style={{ caretColor: 'hsl(var(--accent))' }}
          />
        </div>
      </div>
    </m.div>
  )
}

// ============================================================
// StaticSubstrate — crisp static dot grid + faint scanlines.
// Zero JS animation: the SVG pattern is static and the scanline
// shimmer is a cheap GPU-composited CSS bg (disabled on mobile).
// ============================================================

function StaticSubstrate() {
  return (
    <>
      <svg
        aria-hidden
        className="absolute inset-0 w-full h-full pointer-events-none opacity-70"
      >
        <defs>
          <pattern
            id="hero-dots"
            x="0"
            y="0"
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="12" cy="12" r="1" fill="hsl(var(--ink) / 0.10)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-dots)" />
      </svg>
      <div
        aria-hidden
        className="absolute inset-0 bg-scanlines opacity-[0.10] pointer-events-none mix-blend-multiply"
      />
    </>
  )
}

// ============================================================
// HudCorners — 4 SVG corner brackets framing the hero viewport.
// Mount-time entrance only.
// ============================================================

function HudCorners() {
  const brackets = [
    { className: 'top-24 left-5', d: 'M 2 14 L 2 2 L 14 2' },
    { className: 'top-24 right-5', d: 'M 6 2 L 18 2 L 18 14' },
    { className: 'bottom-36 left-5', d: 'M 2 6 L 2 18 L 14 18' },
    { className: 'bottom-36 right-5', d: 'M 6 18 L 18 18 L 18 6' },
  ]
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none hidden md:block z-10">
      {brackets.map((b, i) => (
        <m.svg
          key={i}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 0.5, scale: 1 }}
          transition={{ delay: 0.6 + i * 0.08, duration: 0.5 }}
          width="20"
          height="20"
          viewBox="0 0 20 20"
          className={`absolute ${b.className} text-lime`}
        >
          <path
            d={b.d}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </m.svg>
      ))}
    </div>
  )
}
