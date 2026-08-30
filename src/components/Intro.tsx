import { m } from 'framer-motion'
import {
  Activity,
  ArrowDown,
  ArrowUpRight,
  Cpu,
  Database,
  Gauge,
  Sparkles,
  Users,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatedNumber } from './ui/AnimatedNumber'
import { MagneticButton } from './ui/MagneticButton'
import { HeroHeadline } from './ui/HeroHeadline'

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
    Icon: Activity,
  },
  {
    value: 150,
    decimals: 0,
    suffix: 'k',
    label: 'monthly actives',
    sub: 'Genopets · Web3 gaming',
    accent: 'accent',
    Icon: Users,
  },
  {
    value: 80,
    decimals: 0,
    suffix: '%',
    label: 'faster p95',
    sub: 'latency optimization',
    accent: 'lime',
    Icon: Gauge,
  },
  {
    value: 1.8,
    decimals: 1,
    suffix: 'M+',
    label: 'users reached',
    sub: 'notification system',
    accent: 'amber',
    Icon: Database,
  },
]


export function Intro() {

  // Instant (not smooth) CTA scroll — a hard-won fix from this repo's history:
  // smooth-scroll is a JS-driven animation that competes with the heavy
  // below-the-fold sections on the main thread and makes the click feel frozen.
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'auto', block: 'start' })
  }

  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-transparent"
    >
      {/* The living shader backdrop is global (mounted in Home) — the hero
          floats over it like every other section. Just a little extra HUD
          texture here. */}
      <StaticSubstrate />
      {/* ONE static pastel bloom — warmth without a third moving layer */}
      <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-[8%] -left-[4%] w-[52vw] h-[52vw] max-w-[720px] max-h-[720px] rounded-full opacity-35 dark:opacity-20 blur-3xl"
          style={{
            background:
              'radial-gradient(circle at 35% 35%, hsl(var(--accent) / 0.4), hsl(var(--electric) / 0.25) 45%, transparent 70%)',
          }}
        />
      </div>

      <div className="container relative z-10 mx-auto px-6 pt-24 md:pt-28 pb-8 flex-1 flex flex-col justify-center">
        {/* ---- monumental headline: full-bleed, the type IS the layout.
            Outer div owns the scroll-driven exit (CSS transform/opacity);
            the m.div owns the entrance + the parallax `translate`. */}
        <div className="hero-exit-head">
          <m.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* status line — the two facts a recruiter needs first, nothing else */}
            <div className="flex flex-wrap items-center gap-2.5 mb-7 text-[11px]">
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-lime/30 bg-lime/[0.1] backdrop-blur-md text-ink"
                style={{
                  boxShadow:
                    'inset 0 1px 0 0 hsl(var(--background) / 0.35), 0 0 18px -7px hsl(var(--lime) / 0.7)',
                }}
              >
                <span
                  className="inline-flex h-2 w-2 rounded-full bg-lime"
                  style={{ boxShadow: '0 0 6px hsl(var(--lime))' }}
                />
                <span className="font-mono text-[11px] tracking-wide">available for work</span>
              </div>
              <span className="font-mono text-[11px] text-ink-muted">
                Bangkok · UTC+7 · remote-friendly
              </span>
            </div>

            {/* headline — the WebGL particle swarm (real text paints first for
                LCP/SEO, then the particles assemble it and react to the
                cursor); falls back to the kinetic variable-font treatment
                where WebGL isn't available. See HeroHeadline. */}
            <h1
              aria-label="Product Engineer. Startups, Web3, Fintech."
              className="font-display leading-[0.98] tracking-tighter font-bold mb-10"
            >
              <HeroHeadline />
            </h1>
          </m.div>
        </div>

        {/* ---- second band: terminal + CTAs beside the telemetry deck ---- */}
        <div className="hero-exit-panel grid grid-cols-1 lg:grid-cols-12 gap-10 items-start w-full">
          <m.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7 max-w-3xl"
          >
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

          {/* ---- right: engineering-impact telemetry deck ---- */}
          <m.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5"
          >
            <MetricsPanel />
          </m.div>
        </div>
      </div>

      {/* tech stack — static, readable, no crawl (a moving list can't be read) */}
      <div className="relative z-10 border-y border-border bg-surface/40 backdrop-blur-sm py-4">
        <div className="container mx-auto px-6 flex flex-wrap items-center justify-center gap-x-[2.2vw] gap-y-1.5">
          {TECH_STACK.slice(0, 10).map((tech) => (
            <span
              key={tech}
              className="font-display font-bold tracking-tight text-[clamp(18px,2vw,32px)] text-transparent"
              style={{ WebkitTextStroke: '1.2px hsl(var(--ink) / 0.45)' }}
            >
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* scroll cue — static; the affordance needs no perpetual motion */}
      <button
        onClick={() => scrollToSection('skills-section')}
        className="hidden md:flex absolute bottom-28 right-10 flex-col items-center gap-3 text-xs tracking-[0.2em] uppercase text-ink-muted hover:text-ink transition-colors group z-10"
        aria-label="Scroll to explore"
      >
        Scroll
        <span aria-hidden className="block w-px h-14 bg-gradient-to-b from-accent/70 via-border to-transparent" />
        <ArrowDown className="w-4 h-4 group-hover:text-accent group-hover:translate-y-0.5 transition-all" />
      </button>
    </section>
  )
}

// ============================================================
// MetricsPanel — four REAL production numbers. This is the hiring
// evidence, so it gets a calm, solid, square-to-the-reader panel:
// no tilt, no fake sparklines, no fake live tickers, no glare.
// The one-shot count-up draws the eye, then everything rests.
// ============================================================

const A_HSL: Record<Accent, string> = {
  accent: 'var(--accent)',
  lime: 'var(--lime)',
  electric: 'var(--electric)',
  amber: 'var(--amber)',
}

function MetricsPanel() {
  return (
    <div
      className="corner-squircle relative rounded-2xl overflow-hidden border border-ink/[0.07] bg-background/70 backdrop-blur-xl"
      style={{
        boxShadow:
          'inset 0 1px 0 0 hsl(var(--background) / 0.6), 0 24px 60px -30px hsl(var(--ink) / 0.35)',
      }}
    >
      <div className="flex items-center justify-between px-5 py-3 border-b border-ink/5 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-accent" />
          impact
        </span>
        <span className="text-ink-muted">2013 → now</span>
      </div>

      <div className="grid grid-cols-2 gap-2.5 p-4">
        {METRICS.map((metric) => (
          <div
            key={metric.label}
            className="p-4 rounded-xl bg-background/55 border border-ink/[0.06]"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-soft">
                {metric.label}
              </span>
              <metric.Icon className={`w-3.5 h-3.5 ${A_TEXT[metric.accent]}`} />
            </div>
            <div
              className={`font-display text-[1.8rem] leading-none font-bold tabular-nums ${A_TEXT[metric.accent]}`}
              style={{ textShadow: `0 0 22px hsl(${A_HSL[metric.accent]} / 0.25)` }}
            >
              <AnimatedNumber
                value={metric.value}
                decimals={metric.decimals}
                suffix={metric.suffix}
                duration={1400}
              />
            </div>
            <div className="font-mono text-[11px] text-ink-muted mt-1.5">{metric.sub}</div>
          </div>
        ))}
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
      <span className={`flex-1 min-w-0 break-words ${dim ? 'text-ink-soft' : 'text-ink'}`}>
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

    // Instant reveal — the bio is the strongest hiring content on the
    // page, so it must be READABLE at first paint, not after 4 seconds of
    // typing. Lines fade in with a tiny stagger to keep the terminal feel.
    const timers: ReturnType<typeof setTimeout>[] = []
    setTypedCmd(WHOAMI_COMMAND)
    setTypedPerLine(WHOAMI_OUTPUT.map(() => 0))
    WHOAMI_OUTPUT.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setTypedPerLine((prev) => {
            const next = [...prev]
            next[i] = lineLengths[i]
            return next
          })
        }, 120 + i * 110),
      )
    })
    timers.push(setTimeout(() => setEverDone(true), 120 + WHOAMI_OUTPUT.length * 110 + 150))
    return () => timers.forEach((t) => clearTimeout(t))
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

  const entryBase = WHOAMI_OUTPUT.length + 2

  return (
    <m.div
      ref={hostRef}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      // the whole terminal is a click target for its prompt (real terminal feel)
      onClick={() => everDone && inputRef.current?.focus({ preventScroll: true })}
      className={`corner-squircle relative max-w-2xl mb-7 rounded-2xl overflow-hidden border border-ink/[0.07] bg-background/70 backdrop-blur-xl ${everDone ? 'cursor-text' : ''}`}
      style={{
        boxShadow:
          'inset 0 1px 0 0 hsl(var(--background) / 0.6), 0 24px 60px -30px hsl(var(--ink) / 0.35)',
      }}
    >
      {/* header — palette mark + path + live equalizer */}
      <div className="relative z-10 flex items-center gap-2 px-5 py-2.5 border-b border-ink/5 font-mono text-[10.5px]">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rotate-45 rounded-[1px] bg-accent" />
          <span className="w-1.5 h-1.5 rotate-45 rounded-[1px] bg-lime" />
          <span className="w-1.5 h-1.5 rotate-45 rounded-[1px] bg-electric" />
        </span>
        <span className="text-lime ml-1.5">felix@portfolio</span>
        <span className="text-ink-soft">:~/about</span>
        <span className="ml-auto inline-flex items-center gap-1.5 uppercase tracking-[0.16em] text-[10px] text-ink-soft">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-lime" />
          online
        </span>
      </div>

      <div
        className="relative z-10 px-4 py-4 font-mono text-[13.5px] md:text-[14.5px] leading-[1.85]"
        aria-label="About Felix"
      >
        <ConsoleRow n={1} dim>
          <span className="text-accent mr-2">$</span>
          <span className="text-ink">{typedCmd}</span>
        </ConsoleRow>

        {WHOAMI_OUTPUT.map((fragments, i) => {
          const chars = typedPerLine[i]
          const visible = chars > 0 || reduceMotion
          return (
            <ConsoleRow key={i} n={i + 2} hidden={!visible}>
              <span className="text-accent/45 mr-2 select-none">▸</span>
              {renderFragments(fragments, chars)}
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
// StaticSubstrate — a crisp static dot grid. Zero animation:
// texture is felt, never read.
// ============================================================

function StaticSubstrate() {
  return (
    <>
      <svg
        aria-hidden
        className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
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
    </>
  )
}
