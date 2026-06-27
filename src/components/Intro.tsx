import { motion } from 'framer-motion'
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
import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { LiveClock } from './ui/LiveClock'
import { Marquee } from './ui/Marquee'
import { AnimatedNumber } from './ui/AnimatedNumber'
import { MagneticButton } from './ui/MagneticButton'
import { ShaderText } from './ui/ShaderText'
import { useFxLevel } from '../hooks/useFxLevel'

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
const A_BG: Record<Accent, string> = {
  accent: 'bg-accent',
  lime: 'bg-lime',
  electric: 'bg-electric',
  amber: 'bg-amber',
}
const A_DOT: Record<Accent, string> = {
  accent: 'bg-accent',
  lime: 'bg-lime',
  electric: 'bg-electric',
  amber: 'bg-amber',
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
  const { reduceMotion, isMobile } = useFxLevel()

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
    const cadence = isMobile ? 90 : 55
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
      <HudCorners />

      <div className="container relative z-10 mx-auto px-6 pt-20 md:pt-24 pb-8 flex-1 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center w-full">
          {/* ---- left: identity + headline + bio + CTAs ---- */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7 max-w-3xl"
          >
            {/* boot strip */}
            <div className="flex flex-wrap items-center gap-2.5 mb-6 text-[11px]">
              <div className="inline-flex items-center gap-2 h-8 px-3 rounded-md border border-ink/10 bg-background/25 backdrop-blur-md font-mono tracking-normal text-[11px]">
                <span className="text-lime">felix@portfolio</span>
                <span className="text-ink-soft">:~$</span>
                <span className="text-ink">{bootTyped}</span>
                {bootTyped.length < BOOT_LINE.length && (
                  <span className="w-1.5 h-3.5 bg-ink animate-blink" />
                )}
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-lime/25 bg-lime/[0.08] backdrop-blur-md text-ink">
                <span className="relative flex h-2 w-2">
                  <span className="motion-safe-mobile absolute inline-flex h-full w-full rounded-full bg-lime opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-lime" />
                </span>
                <span className="font-mono text-[11px] tracking-wide">status: available</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-ink/10 bg-background/25 backdrop-blur-md text-ink-muted">
                <Terminal className="w-3 h-3" />
                <LiveClock timezone="UTC" className="text-ink text-xs" />
                <span className="text-ink-soft">· UTC</span>
              </div>
              <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-ink/10 bg-background/25 backdrop-blur-md text-ink-muted font-mono text-[10.5px] tracking-[0.1em]">
                <span className="text-ink-soft">session</span>
                <span className="text-ink tabular-nums">{SESSION_ID}</span>
              </div>
            </div>

            {/* headline */}
            <ShaderText
              lines={['Product Engineer', 'Making It Happen']}
              className="font-display text-[clamp(2rem,5.2vw,4.25rem)] leading-[1.06] tracking-tighter font-bold mb-6"
            />

            <WhoamiTerminal />

            <div className="flex flex-wrap items-center gap-3">
              <MagneticButton
                onClick={() => scrollToSection('projects-section')}
                strength={0.4}
                className="group relative inline-flex items-center gap-2 h-12 px-6 rounded-full bg-ink text-background text-sm font-medium hover:bg-accent transition-colors overflow-hidden"
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
          </motion.div>

          {/* ---- right: engineering-impact telemetry deck ---- */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5"
          >
            <MetricsPanel />
          </motion.div>
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
      <motion.button
        onClick={() => scrollToSection('skills-section')}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.8 }}
        className="hidden md:flex absolute bottom-28 right-10 flex-col items-center gap-3 text-xs tracking-[0.2em] uppercase text-ink-muted hover:text-ink transition-colors group z-10"
        aria-label="Scroll to explore"
      >
        Scroll
        <span aria-hidden className="relative block w-px h-14 bg-border overflow-hidden">
          <motion.span
            className="absolute top-0 left-0 w-full bg-gradient-to-b from-accent via-lime to-transparent"
            initial={{ height: 0, y: 0 }}
            animate={{ height: '60%', y: ['0%', '140%', '0%'] }}
            transition={{
              height: { duration: 0.8, delay: 1.6, ease: 'easeOut' },
              y: { duration: 2.2, delay: 2.4, repeat: Infinity, ease: 'easeInOut' },
            }}
          />
        </span>
        <motion.span
          animate={{ y: [0, 4, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="group-hover:text-accent transition-colors"
        >
          <ArrowDown className="w-4 h-4" />
        </motion.span>
      </motion.button>
    </section>
  )
}

// ============================================================
// MetricsPanel — production-telemetry deck. Real career numbers
// presented as a live observability readout (on-brand: he ships
// with Datadog). Counters animate once on view; fill bars run a
// one-shot entrance. No perpetual loops.
// ============================================================

function MetricsPanel() {
  return (
    <div className="relative rounded-2xl overflow-hidden">
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
            <div className="mt-2.5 h-1 rounded-full bg-border/70 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${A_BG[m.accent]}`}
                initial={{ width: 0 }}
                whileInView={{ width: `${Math.round(m.fill * 100)}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* impact chips */}
      <div className="relative z-10 flex flex-wrap gap-1.5 px-4 py-3 mt-1">
        {IMPACT_CHIPS.map((c, i) => {
          const a: Accent = (['accent', 'lime', 'electric', 'amber', 'accent'] as Accent[])[i]
          return (
            <span
              key={c}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-ink/10 bg-background/30 backdrop-blur-md font-mono text-[9.5px] tracking-tight text-ink-muted"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${A_DOT[a]}`} />
              {c}
            </span>
          )
        })}
      </div>

      {/* footer status line */}
      <div className="relative z-10 flex items-center justify-between px-4 py-2 border-t border-ink/5 font-mono text-[9.5px] tracking-[0.1em] text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <Radio className="w-3 h-3 text-lime" />
          uptime: shipping
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

function renderFragments(fragments: WhoamiFragment[], charsShown: number): ReactNode[] {
  const out: ReactNode[] = []
  let cursor = 0
  for (let fi = 0; fi < fragments.length; fi++) {
    const frag = fragments[fi]
    const end = cursor + frag.t.length
    if (charsShown >= end) {
      out.push(
        <span key={fi} className={frag.cls}>
          {frag.t}
        </span>,
      )
    } else if (charsShown > cursor) {
      const take = charsShown - cursor
      out.push(
        <span key={fi} className={frag.cls}>
          {frag.t.slice(0, take)}
        </span>,
      )
      break
    } else {
      break
    }
    cursor = end
  }
  return out
}

function CaretInline() {
  return (
    <span
      aria-hidden
      className="inline-block w-[7px] h-[15px] bg-ink animate-blink align-middle ml-0.5 translate-y-[-1px]"
    />
  )
}

// resting caret — glows + pulses (CSS .caret-glow)
function GlowCaret() {
  return (
    <span
      aria-hidden
      className="caret-glow inline-block w-[8px] h-[15px] bg-accent rounded-[1px] align-middle translate-y-[-1px]"
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
  n: number
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

function WhoamiTerminal() {
  const lineLengths = useMemo(
    () => WHOAMI_OUTPUT.map((l) => l.reduce((n, f) => n + f.t.length, 0)),
    [],
  )
  const [typedCmd, setTypedCmd] = useState('')
  const [typedPerLine, setTypedPerLine] = useState<number[]>(() =>
    WHOAMI_OUTPUT.map(() => 0),
  )
  const [done, setDone] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setTypedCmd(WHOAMI_COMMAND)
      setTypedPerLine(lineLengths)
      setDone(true)
      setReduceMotion(true)
      return
    }

    const timers: ReturnType<typeof setTimeout>[] = []
    const intervals: ReturnType<typeof setInterval>[] = []
    let cancelled = false

    const addTimer = (fn: () => void, ms: number) => {
      const t = setTimeout(() => {
        if (!cancelled) fn()
      }, ms)
      timers.push(t)
    }

    const typeLine = (lineIdx: number) => {
      if (cancelled) return
      if (lineIdx >= WHOAMI_OUTPUT.length) {
        addTimer(() => setDone(true), 360)
        return
      }
      const targetLen = lineLengths[lineIdx]
      let chars = 0
      const interval = setInterval(() => {
        if (cancelled) {
          clearInterval(interval)
          return
        }
        const burst = Math.random() < 0.22 ? 2 : 1
        chars = Math.min(chars + burst, targetLen)
        setTypedPerLine((prev) => {
          const next = [...prev]
          next[lineIdx] = chars
          return next
        })
        if (chars >= targetLen) {
          clearInterval(interval)
          addTimer(() => typeLine(lineIdx + 1), 240)
        }
      }, 22)
      intervals.push(interval)
    }

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
        addTimer(() => typeLine(0), 360)
      }
    }, 95)
    intervals.push(cmdInt)

    return () => {
      cancelled = true
      intervals.forEach((i) => clearInterval(i))
      timers.forEach((t) => clearTimeout(t))
    }
  }, [lineLengths])

  const cmdTyping = typedCmd.length < WHOAMI_COMMAND.length
  const activeLineIdx = typedPerLine.findIndex((n, i) => n > 0 && n < lineLengths[i])
  const caretOnLine = !cmdTyping && activeLineIdx !== -1 ? activeLineIdx : -1

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="relative max-w-2xl mb-7 rounded-2xl overflow-hidden"
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
              {renderFragments(fragments, chars)}
              {caretOnLine === i && <CaretInline />}
            </ConsoleRow>
          )
        })}

        <ConsoleRow n={WHOAMI_OUTPUT.length + 2} dim hidden={!done}>
          <span className="text-accent mr-2">$</span>
          <GlowCaret />
        </ConsoleRow>
      </div>
    </motion.div>
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
        <motion.svg
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
        </motion.svg>
      ))}
    </div>
  )
}
