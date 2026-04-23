import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion'
import {
  Activity,
  ArrowDown,
  ArrowUpRight,
  Boxes,
  Cloud,
  Cpu,
  GitCommit,
  Layers,
  MapPin,
  Radio,
  Rocket,
  Signal,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { LiveClock } from './ui/LiveClock'
import { Marquee } from './ui/Marquee'
import { AnimatedNumber } from './ui/AnimatedNumber'
import { MagneticButton } from './ui/MagneticButton'
import { NodeNetwork } from './ui/NodeNetwork'

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

const TAGLINE_WORDS = [
  'shipping',
  'real',
  'products',
  'with',
  'AI',
  'in',
  'the',
  'loop.',
]

type Accent = 'accent' | 'lime' | 'electric' | 'amber'

const ACCENT_VAR: Record<Accent, string> = {
  accent: '--accent',
  lime: '--lime',
  electric: '--electric',
  amber: '--amber',
}

type ArtifactType = 'feat' | 'fix' | 'ship' | 'deploy'

type ShipArtifact = {
  id: string
  type: ArtifactType
  label: string
  accent: Accent
}

const SHIP_ARTIFACTS: ShipArtifact[] = [
  { id: 'a01', type: 'feat', label: 'usdt fx rails', accent: 'accent' },
  { id: 'a02', type: 'fix', label: 'ledger drift', accent: 'lime' },
  { id: 'a03', type: 'ship', label: 'dashify v2', accent: 'amber' },
  { id: 'a04', type: 'deploy', label: 'api v2.47', accent: 'electric' },
  { id: 'a05', type: 'feat', label: 'inline editor', accent: 'accent' },
  { id: 'a06', type: 'deploy', label: 'stable-api', accent: 'lime' },
  { id: 'a07', type: 'ship', label: 'travel-log', accent: 'amber' },
  { id: 'a08', type: 'feat', label: 'radar globe', accent: 'electric' },
  { id: 'a09', type: 'fix', label: 'tz offset', accent: 'lime' },
  { id: 'a10', type: 'deploy', label: 'core.reactor', accent: 'accent' },
  { id: 'a11', type: 'ship', label: 'kyc v3', accent: 'amber' },
  { id: 'a12', type: 'feat', label: 'morse stream', accent: 'electric' },
  { id: 'a13', type: 'fix', label: 'hydration race', accent: 'accent' },
  { id: 'a14', type: 'ship', label: 'airmail ui', accent: 'lime' },
]

const ACCENT_CLS: Record<Accent, { text: string; bg: string; ring: string; dot: string; bar: string }> = {
  accent: {
    text: 'text-accent',
    bg: 'bg-accent/10',
    ring: 'ring-accent/30',
    dot: 'bg-accent',
    bar: 'bg-accent',
  },
  lime: {
    text: 'text-lime',
    bg: 'bg-lime/15',
    ring: 'ring-lime/30',
    dot: 'bg-lime',
    bar: 'bg-lime',
  },
  electric: {
    text: 'text-electric',
    bg: 'bg-electric/10',
    ring: 'ring-electric/30',
    dot: 'bg-electric',
    bar: 'bg-electric',
  },
  amber: {
    text: 'text-amber',
    bg: 'bg-amber/10',
    ring: 'ring-amber/30',
    dot: 'bg-amber',
    bar: 'bg-amber',
  },
}

const BOOT_LINE = 'felix --status --live'
const SESSION_ID = '#2847'

export function Intro() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const sectionRef = useRef<HTMLElement>(null)
  const mouseX = useMotionValue(-400)
  const mouseY = useMotionValue(-400)
  const smoothX = useSpring(mouseX, { damping: 20, stiffness: 120 })
  const smoothY = useSpring(mouseY, { damping: 20, stiffness: 120 })
  const spotlight = useTransform(
    [smoothX, smoothY],
    ([x, y]) =>
      `radial-gradient(600px circle at ${x}px ${y}px, hsl(var(--accent) / 0.14), transparent 55%)`
  )
  const [aiHover, setAiHover] = useState(false)

  // boot-line typewriter
  const [bootTyped, setBootTyped] = useState('')
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setBootTyped(BOOT_LINE)
      return
    }
    let i = 0
    const t = setInterval(() => {
      i++
      setBootTyped(BOOT_LINE.slice(0, i))
      if (i >= BOOT_LINE.length) clearInterval(t)
    }, 55)
    return () => clearInterval(t)
  }, [])

  // slow frame counter for bottom HUD (10 fps is plenty)
  const [frame, setFrame] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setFrame((n) => (n + 1) % 10000), 100)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const handler = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      mouseX.set(e.clientX - rect.left)
      mouseY.set(e.clientY - rect.top)
    }
    const leave = () => {
      mouseX.set(-400)
      mouseY.set(-400)
    }
    el.addEventListener('mousemove', handler)
    el.addEventListener('mouseleave', leave)
    return () => {
      el.removeEventListener('mousemove', handler)
      el.removeEventListener('mouseleave', leave)
    }
  }, [mouseX, mouseY])

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-background"
    >
      {/* dot grid */}
      <div
        aria-hidden
        className="absolute inset-0 bg-dots opacity-40 pointer-events-none"
      />
      {/* faint scan lines */}
      <div
        aria-hidden
        className="absolute inset-0 bg-scanlines opacity-[0.15] pointer-events-none mix-blend-multiply"
      />
      <NodeNetwork className="opacity-[0.55]" />
      <motion.div
        aria-hidden
        style={{ background: spotlight }}
        className="absolute inset-0 pointer-events-none"
      />
      <div
        aria-hidden
        className="absolute top-0 right-0 w-[55%] h-[55%] pointer-events-none animate-float-slow"
        style={{
          background:
            'radial-gradient(ellipse at top right, hsl(var(--amber) / 0.18), transparent 60%)',
        }}
      />
      <div
        aria-hidden
        className="absolute bottom-0 left-0 w-[45%] h-[45%] pointer-events-none animate-pulse-glow"
        style={{
          background:
            'radial-gradient(ellipse at bottom left, hsl(var(--electric) / 0.1), transparent 60%)',
        }}
      />
      <div
        aria-hidden
        className="absolute top-[30%] left-[40%] w-[30%] h-[40%] pointer-events-none animate-pulse-glow"
        style={{
          background:
            'radial-gradient(circle, hsl(var(--plum) / 0.08), transparent 70%)',
        }}
      />

      {/* floating micro-particles */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none overflow-hidden"
      >
        {[
          { left: '12%', top: '22%', size: 4, color: 'bg-accent/60', dur: 7, delay: 0 },
          { left: '82%', top: '18%', size: 3, color: 'bg-lime/70', dur: 9, delay: 1.2 },
          { left: '28%', top: '72%', size: 5, color: 'bg-amber/50', dur: 8, delay: 2.1 },
          { left: '62%', top: '58%', size: 2, color: 'bg-electric/70', dur: 10, delay: 0.6 },
          { left: '90%', top: '68%', size: 3, color: 'bg-accent/50', dur: 11, delay: 3 },
          { left: '5%', top: '52%', size: 2, color: 'bg-lime/60', dur: 12, delay: 1.8 },
          { left: '48%', top: '12%', size: 3, color: 'bg-amber/60', dur: 9, delay: 2.8 },
          { left: '72%', top: '82%', size: 4, color: 'bg-accent/40', dur: 13, delay: 0.4 },
        ].map((p, i) => (
          <motion.span
            key={i}
            className={`absolute rounded-full ${p.color}`}
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              boxShadow: '0 0 12px currentColor',
            }}
            animate={{
              y: [0, -24, 0],
              x: [0, i % 2 === 0 ? 12 : -12, 0],
              opacity: [0.3, 0.9, 0.3],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: p.dur,
              delay: p.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* HUD corner brackets */}
      <HudCorners />

      <div className="container relative z-10 mx-auto px-6 pt-28 md:pt-32 pb-12 flex-1 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start w-full">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-8 max-w-5xl"
          >
            {/* Boot strip: prompt + status + clock */}
            <div className="flex flex-wrap items-center gap-2.5 mb-10 text-[11px]">
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 h-8 px-3 rounded-md border border-border bg-background/80 backdrop-blur-sm font-mono tracking-normal text-[11px] shadow-[0_8px_20px_-12px_hsl(var(--ink)/0.25)]"
              >
                <span className="text-lime">felix@portfolio</span>
                <span className="text-ink-soft">:~$</span>
                <span className="text-ink">{bootTyped}</span>
                {bootTyped.length < BOOT_LINE.length ? (
                  <span className="w-1.5 h-3.5 bg-ink animate-blink" />
                ) : (
                  <motion.span
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="ml-1 text-lime"
                  >
                    ↵
                  </motion.span>
                )}
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-lime/40 bg-lime/10 text-ink"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-lime opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-lime" />
                </span>
                <span className="font-mono text-[11px] tracking-wide">status: available</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background/60 backdrop-blur-sm text-ink-muted"
              >
                <Terminal className="w-3 h-3" />
                <LiveClock timezone="UTC" className="text-ink text-xs" />
                <span className="text-ink-soft">· UTC</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background/60 backdrop-blur-sm text-ink-muted font-mono text-[10.5px] tracking-[0.1em]"
              >
                <span className="text-ink-soft">session</span>
                <span className="text-ink tabular-nums">{SESSION_ID}</span>
              </motion.div>
            </div>

            <h1 className="font-display text-[clamp(2.5rem,6.2vw,5.25rem)] leading-[0.98] tracking-tighter text-ink font-bold mb-8 text-balance">
              <span className="whitespace-nowrap">
                <span className="italic font-extrabold text-accent text-glow-accent">
                  Product
                </span>{' '}
                <span className="glitch-pulse inline-block">Engineer</span>
              </span>{' '}
              {TAGLINE_WORDS.map((w, i) => (
                <span key={i}>
                  <motion.span
                    className="inline-block"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: 0.08 + i * 0.05,
                      duration: 0.45,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    {w === 'shipping' ? (
                      <span className="relative inline-block">
                        shipping
                        <svg
                          className="absolute -bottom-2 left-0 w-full h-2"
                          viewBox="0 0 200 8"
                          preserveAspectRatio="none"
                          aria-hidden
                        >
                          <defs>
                            <linearGradient id="ship-squiggle" x1="0" x2="1" y1="0" y2="0">
                              <stop offset="0%" stopColor="hsl(var(--amber))" />
                              <stop offset="50%" stopColor="hsl(var(--accent))" />
                              <stop offset="100%" stopColor="hsl(var(--lime))" />
                            </linearGradient>
                          </defs>
                          <motion.path
                            d="M 0 4 Q 50 0 100 4 T 200 4"
                            fill="none"
                            stroke="url(#ship-squiggle)"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{
                              duration: 0.9,
                              delay: 0.25 + i * 0.05,
                              ease: 'easeOut',
                            }}
                          />
                        </svg>
                      </span>
                    ) : w === 'AI' ? (
                      <span
                        className="relative inline-block cursor-default"
                        onMouseEnter={() => setAiHover(true)}
                        onMouseLeave={() => setAiHover(false)}
                      >
                        <span className="glitch-crazy italic font-extrabold text-accent text-glow-accent relative z-10 inline-block">
                          AI
                        </span>
                        <motion.span
                          aria-hidden
                          className="absolute inset-0 -m-6 pointer-events-none"
                          animate={{ rotate: aiHover ? 360 : 0 }}
                          transition={{
                            duration: 6,
                            repeat: aiHover ? Infinity : 0,
                            ease: 'linear',
                          }}
                        >
                          {[0, 1, 2, 3].map((i) => {
                            const angle = (i / 4) * Math.PI * 2
                            const colors = ['bg-accent', 'bg-lime', 'bg-electric', 'bg-amber']
                            return (
                              <motion.span
                                key={i}
                                className={`absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full ${colors[i]}`}
                                style={{
                                  x: `${Math.cos(angle) * 48 - 3}px`,
                                  y: `${Math.sin(angle) * 48 - 3}px`,
                                }}
                                animate={{
                                  opacity: aiHover ? [0, 1, 1, 0] : 0,
                                  scale: aiHover ? [0, 1, 1, 0] : 0,
                                }}
                                transition={{
                                  duration: 1.4,
                                  repeat: aiHover ? Infinity : 0,
                                  delay: i * 0.1,
                                  ease: 'easeOut',
                                }}
                              />
                            )
                          })}
                        </motion.span>
                        <motion.span
                          aria-hidden
                          className="absolute inset-0 -m-3 rounded-full pointer-events-none"
                          style={{
                            background:
                              'radial-gradient(circle, hsl(var(--accent) / 0.25), transparent 70%)',
                          }}
                          animate={{
                            opacity: aiHover ? [0.3, 0.7, 0.3] : 0,
                            scale: aiHover ? [0.9, 1.1, 0.9] : 0.9,
                          }}
                          transition={{
                            duration: 2,
                            repeat: aiHover ? Infinity : 0,
                            ease: 'easeInOut',
                          }}
                        />
                      </span>
                    ) : w === 'loop.' ? (
                      <span className="relative inline-flex items-baseline">
                        <span className="relative">
                          loop
                          <motion.svg
                            aria-hidden
                            viewBox="0 0 120 52"
                            preserveAspectRatio="none"
                            className="absolute left-0 right-0 -bottom-1 w-full h-[0.35em] pointer-events-none overflow-visible"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.9, duration: 0.4 }}
                          >
                            <defs>
                              <linearGradient id="loop-underline-grad" x1="0" x2="1" y1="0" y2="0">
                                <stop offset="0%" stopColor="hsl(var(--lime))" />
                                <stop offset="50%" stopColor="hsl(var(--accent))" />
                                <stop offset="100%" stopColor="hsl(var(--amber))" />
                              </linearGradient>
                            </defs>
                            <motion.path
                              d="M 4 26 C 4 6, 56 6, 60 26 C 64 46, 116 46, 116 26 C 116 6, 64 6, 60 26 C 56 46, 4 46, 4 26 Z"
                              fill="none"
                              stroke="url(#loop-underline-grad)"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeDasharray="3 6"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{
                                duration: 1.1,
                                delay: 0.85 + i * 0.05,
                                ease: [0.22, 1, 0.36, 1],
                              }}
                            />
                            <motion.circle
                              r="2.5"
                              fill="hsl(var(--accent))"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 2, duration: 0.3 }}
                            >
                              <animateMotion
                                dur="3.8s"
                                begin="2s"
                                repeatCount="indefinite"
                                path="M 4 26 C 4 6, 56 6, 60 26 C 64 46, 116 46, 116 26 C 116 6, 64 6, 60 26 C 56 46, 4 46, 4 26 Z"
                              />
                            </motion.circle>
                          </motion.svg>
                        </span>
                        <span>.</span>
                      </span>
                    ) : (
                      w
                    )}
                  </motion.span>
                  {i < TAGLINE_WORDS.length - 1 ? ' ' : ''}
                </span>
              ))}
            </h1>

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
                className="group inline-flex items-center gap-2 h-12 px-6 rounded-full border border-ink/15 text-ink text-sm font-medium hover:border-ink/40 hover:bg-surface transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-accent group-hover:rotate-12 transition-transform" />
                Get in touch
              </MagneticButton>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-4 lg:pt-8"
          >
            <ShipEngine frame={frame} />
          </motion.div>
        </div>
      </div>

      {/* Bottom telemetry HUD strip */}
      <BottomHudStrip frame={frame} />

      {/* Tech marquee */}
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

      <motion.button
        onClick={() => scrollToSection('skills-section')}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="hidden md:flex absolute bottom-32 right-10 flex-col items-center gap-3 text-xs tracking-[0.2em] uppercase text-ink-muted hover:text-ink transition-colors group"
        aria-label="Scroll to explore"
      >
        Scroll
        <motion.span
          aria-hidden
          className="relative block w-px h-14 bg-border overflow-hidden"
        >
          <motion.span
            className="absolute top-0 left-0 w-full bg-gradient-to-b from-accent via-lime to-transparent"
            initial={{ height: 0, y: 0 }}
            animate={{ height: '60%', y: ['0%', '140%', '0%'] }}
            transition={{
              height: { duration: 0.8, delay: 1.8, ease: 'easeOut' },
              y: {
                duration: 2.2,
                delay: 2.6,
                repeat: Infinity,
                ease: 'easeInOut',
              },
            }}
          />
        </motion.span>
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
// WhoamiTerminal — types `whoami`, then streams the bio out
// character-by-character across colored fragments
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

function renderFragments(
  fragments: WhoamiFragment[],
  charsShown: number,
): ReactNode[] {
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

function WhoamiTerminal() {
  const lineLengths = useMemo(
    () => WHOAMI_OUTPUT.map((l) => l.reduce((n, f) => n + f.t.length, 0)),
    [],
  )
  const [typedCmd, setTypedCmd] = useState('')
  const [typedPerLine, setTypedPerLine] = useState<number[]>(() =>
    WHOAMI_OUTPUT.map(() => 0),
  )
  const [readyPrompt, setReadyPrompt] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setTypedCmd(WHOAMI_COMMAND)
      setTypedPerLine(lineLengths)
      setReadyPrompt(true)
      setReduceMotion(true)
      return
    }

    const timers: ReturnType<typeof setTimeout>[] = []
    const intervals: ReturnType<typeof setInterval>[] = []
    let cancelled = false

    const addTimer = (fn: () => void, ms: number) => {
      const t = setTimeout(() => {
        if (cancelled) return
        fn()
      }, ms)
      timers.push(t)
    }

    const clearScreen = () => {
      setTypedCmd('')
      setTypedPerLine(WHOAMI_OUTPUT.map(() => 0))
      setReadyPrompt(false)
    }

    const typeLine = (lineIdx: number) => {
      if (cancelled) return
      if (lineIdx >= WHOAMI_OUTPUT.length) {
        // All lines done → show ready prompt → hold 1.5s → clear → re-run
        addTimer(() => {
          setReadyPrompt(true)
          addTimer(() => {
            clearScreen()
            addTimer(runCycle, 280)
          }, 1500)
        }, 380)
        return
      }
      const targetLen = lineLengths[lineIdx]
      let chars = 0
      const interval = setInterval(() => {
        if (cancelled) {
          clearInterval(interval)
          return
        }
        // small bursts of 1-2 chars per tick for natural stream feel
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

    const runCycle = () => {
      if (cancelled) return
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
    }

    runCycle()

    return () => {
      cancelled = true
      intervals.forEach((i) => clearInterval(i))
      timers.forEach((t) => clearTimeout(t))
    }
  }, [lineLengths])

  const cmdTyping = typedCmd.length < WHOAMI_COMMAND.length
  const activeLineIdx = typedPerLine.findIndex(
    (n, i) => n > 0 && n < lineLengths[i],
  )
  const caretOnCmd = cmdTyping
  const caretOnLine = !cmdTyping && activeLineIdx !== -1 ? activeLineIdx : -1

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="relative max-w-2xl mb-10 rounded-xl border border-border bg-background/80 backdrop-blur-sm overflow-hidden shadow-[0_12px_36px_-14px_hsl(var(--ink)/0.22)]"
    >
      {/* title bar */}
      <div className="flex items-center gap-2 px-3.5 py-2 border-b border-border bg-surface/80">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
        </span>
        <span className="ml-2 font-mono text-[10.5px] text-ink-soft truncate">
          ~/felix · whoami
        </span>
        <span className="ml-auto flex items-center gap-1.5 font-mono text-[9.5px] tracking-[0.15em] uppercase text-ink-soft">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-lime opacity-75 animate-ping" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lime" />
          </span>
          <span className="hidden sm:inline">zsh</span>
        </span>
      </div>

      {/* body */}
      <div
        className="px-4 py-3.5 font-mono text-[13px] md:text-[14px] leading-[1.75]"
        aria-label="About Felix"
      >
        {/* command line */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-lime shrink-0">felix@portfolio</span>
          <span className="text-ink-soft shrink-0">:~$</span>
          <span className="text-ink">{typedCmd}</span>
          {caretOnCmd && <CaretInline />}
        </div>

        {/* output lines — each one character-streams in. Rows always render
            to reserve height so the terminal doesn't grow as text streams. */}
        <div className="mt-2 space-y-0.5 text-ink-muted">
          {WHOAMI_OUTPUT.map((fragments, i) => {
            const chars = typedPerLine[i]
            const visible = chars > 0 || reduceMotion
            return (
              <div
                key={i}
                className="flex gap-2 min-h-[1.75em] transition-opacity duration-150"
                style={{ opacity: visible ? 1 : 0 }}
                aria-hidden={!visible}
              >
                <span className="text-ink-soft shrink-0 select-none">▸</span>
                <span className="flex-1 break-words">
                  {renderFragments(fragments, chars)}
                  {caretOnLine === i && <CaretInline />}
                </span>
              </div>
            )
          })}
        </div>

        {/* ready-for-next-command prompt — slot is always reserved */}
        <div
          className="flex items-center gap-2 text-ink-soft mt-3 min-h-[1.75em] transition-opacity duration-300"
          style={{ opacity: readyPrompt || reduceMotion ? 1 : 0 }}
          aria-hidden={!(readyPrompt || reduceMotion)}
        >
          <span className="text-lime">felix@portfolio</span>
          <span>:~$</span>
          <CaretInline />
        </div>
      </div>
    </motion.div>
  )
}

// ============================================================
// HudCorners — 4 SVG corner brackets framing the hero viewport
// ============================================================

function HudCorners() {
  const brackets = [
    { className: 'top-24 left-5', d: 'M 2 14 L 2 2 L 14 2' },
    { className: 'top-24 right-5', d: 'M 6 2 L 18 2 L 18 14' },
    { className: 'bottom-36 left-5', d: 'M 2 6 L 2 18 L 14 18' },
    { className: 'bottom-36 right-5', d: 'M 6 18 L 18 18 L 18 6' },
  ]
  return (
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none hidden md:block"
    >
      {brackets.map((b, i) => (
        <motion.svg
          key={i}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 0.55, scale: 1 }}
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

// ============================================================
// ShipEngine — the live console on the right.
// Instead of a static activity feed, this is a LIVE visualization
// of the "AI ↔ Human loop" — an infinity (∞) path with particles
// flowing between FELIX and CLAUDE, birthing artifacts at the
// crossover that fall into a rolling shipped stream below.
// ============================================================

function ShipEngine({ frame }: { frame: number }) {
  const [reduce, setReduce] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduce(mq.matches)
    const onChange = () => setReduce(mq.matches)
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])

  // Rolling shipped-artifacts queue. Each has a unique uid so
  // AnimatePresence can track enter/exit reliably.
  const uidRef = useRef(5)
  const [queue, setQueue] = useState<Array<ShipArtifact & { uid: number }>>(
    () =>
      SHIP_ARTIFACTS.slice(0, 5).map((a, i) => ({
        ...a,
        uid: i,
      })),
  )

  useEffect(() => {
    if (reduce) return
    const t = setInterval(() => {
      setQueue((prev) => {
        const next = SHIP_ARTIFACTS[uidRef.current % SHIP_ARTIFACTS.length]
        const uid = uidRef.current++
        return [...prev.slice(1), { ...next, uid }]
      })
    }, 2900)
    return () => clearInterval(t)
  }, [reduce])

  const fps = 58 + ((frame % 7) - 3)
  const iter = 2847 + Math.floor(frame / 12)
  const shippedToday = 7 + (uidRef.current - 5)

  return (
    <div className="relative">
      {/* animated border glow */}
      <motion.div
        aria-hidden
        className="absolute -inset-px rounded-2xl opacity-70 blur-[1px]"
        style={{
          background:
            'linear-gradient(120deg, hsl(var(--accent) / 0.4), hsl(var(--amber) / 0.25), hsl(var(--lime) / 0.4), hsl(var(--electric) / 0.3), hsl(var(--accent) / 0.4))',
          backgroundSize: '250% 250%',
        }}
        animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative rounded-2xl border border-border bg-background overflow-hidden shadow-[0_30px_80px_-30px_hsl(var(--ink)/0.3)]">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-ink text-background">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
            <span className="w-3 h-3 rounded-full bg-[#28C840]" />
          </span>
          <span className="font-mono text-[11px] text-white/70 ml-2 truncate">
            felix.sys · <span className="text-white">ship.engine</span>
          </span>
          <span className="ml-auto flex items-center gap-1.5 font-mono text-[10px] text-lime">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-lime opacity-75 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lime" />
            </span>
            LIVE
          </span>
        </div>

        {/* Session meta strip */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 border-b border-border bg-surface/50 text-[10px] font-mono text-ink-soft tracking-[0.1em] uppercase">
          <span>iter</span>
          <span className="text-ink tabular-nums">#{iter}</span>
          <span className="text-ink-soft">·</span>
          <span>build</span>
          <span className="text-accent tabular-nums">v2026.1</span>
          <span className="ml-auto flex items-center gap-1 normal-case tracking-normal">
            <Cpu className="w-3 h-3 text-lime" />
            <span className="text-ink tabular-nums">{fps}rpm</span>
          </span>
        </div>

        {/* === LOOP ENGINE centerpiece === */}
        <div className="relative border-b border-border bg-[radial-gradient(ellipse_at_center,hsl(var(--surface))_0%,hsl(var(--background))_70%)]">
          {/* scanlines */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none opacity-[0.06]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, hsl(var(--ink)) 0px, hsl(var(--ink)) 1px, transparent 1px, transparent 3px)',
            }}
          />
          <LoopEngine reduce={reduce} />
        </div>

        {/* === Shipped Stream === */}
        <div className="px-4 pt-3 pb-3 bg-surface/30">
          <div className="flex items-center justify-between mb-2 text-[10px] font-mono uppercase tracking-[0.15em] text-ink-soft">
            <span className="flex items-center gap-1.5">
              <Boxes className="w-3 h-3 text-amber" />
              shipped stream
            </span>
            <span className="normal-case tracking-normal tabular-nums text-ink">
              +{shippedToday} today
            </span>
          </div>
          <div className="flex flex-wrap items-start gap-1 min-h-[44px]">
            <AnimatePresence initial={false} mode="popLayout">
              {queue.map((item) => (
                <ArtifactChip key={item.uid} artifact={item} />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* LED stats */}
        <div className="grid grid-cols-3 gap-px bg-border border-t border-border">
          <LedStat number={13} suffix="+" label="yrs shipping" accent="accent" idx="01" />
          <LedStat number={12} label="countries" accent="lime" idx="02" />
          <LedStat number={20} suffix="+" label="products" accent="electric" idx="03" />
        </div>

        {/* Footer signature */}
        <div className="flex items-center gap-2 px-4 py-2 border-t border-border bg-surface/60 font-mono text-[10px] text-ink-soft">
          <Terminal className="w-3 h-3 text-accent" />
          <span className="text-ink">0x8A2F</span>
          <span className="text-ink-soft">·</span>
          <span>felix.local</span>
          <span className="text-ink-soft">·</span>
          <span className="text-lime">verified</span>
          <span className="ml-auto flex items-center gap-1 text-lime">
            <Radio className="w-3 h-3" />
            127.0.0.1
          </span>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// LoopEngine — the infinity-loop SVG centerpiece.
// Lemniscate path traced as two joined cubic beziers crossing
// at the center. FELIX (lime) on the left lobe, CLAUDE (accent)
// on the right. Particles flow continuously along the full path
// via <animateMotion>. At the center crossover, amber "artifact"
// particles drip downward into the stream below.
// ============================================================

function LoopEngine({ reduce }: { reduce: boolean }) {
  const W = 320
  const H = 180
  const CX = W / 2
  const CY = 92
  const A = 112 // horizontal reach
  const B = 52 // vertical reach

  // Figure-8 / lemniscate traced as 4 cubic bezier segments.
  // left → center (upper-left arc), center → right (lower-right arc),
  // right → center (upper-right arc), center → left (lower-left arc).
  const pathD = [
    `M ${CX - A} ${CY}`,
    `C ${CX - A} ${CY - B}, ${CX - 5} ${CY - B}, ${CX} ${CY}`,
    `C ${CX + 5} ${CY + B}, ${CX + A} ${CY + B}, ${CX + A} ${CY}`,
    `C ${CX + A} ${CY - B}, ${CX + 5} ${CY - B}, ${CX} ${CY}`,
    `C ${CX - 5} ${CY + B}, ${CX - A} ${CY + B}, ${CX - A} ${CY}`,
    `Z`,
  ].join(' ')

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      className="relative w-full h-auto"
      role="img"
      aria-label="AI to Human feedback loop"
    >
      <defs>
        <path id="infinity-path" d={pathD} />
        <linearGradient id="loop-grad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="hsl(var(--lime))" />
          <stop offset="50%" stopColor="hsl(var(--accent))" />
          <stop offset="100%" stopColor="hsl(var(--accent))" />
        </linearGradient>
        <radialGradient id="crossover-glow">
          <stop offset="0%" stopColor="hsl(var(--amber))" stopOpacity="1" />
          <stop offset="100%" stopColor="hsl(var(--amber))" stopOpacity="0" />
        </radialGradient>
        <filter id="particle-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* top label */}
      <text
        x={CX}
        y="16"
        textAnchor="middle"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize="8.5"
        fill="hsl(var(--ink-soft))"
        letterSpacing="3"
      >
        ∞ AI ↔ HUMAN LOOP ∞
      </text>

      {/* fat glow under path */}
      <use
        href="#infinity-path"
        fill="none"
        stroke="url(#loop-grad)"
        strokeWidth="8"
        strokeOpacity="0.10"
      />

      {/* base path */}
      <use
        href="#infinity-path"
        fill="none"
        stroke="url(#loop-grad)"
        strokeWidth="1"
        strokeOpacity="0.5"
      />

      {/* scrolling dashed overlay */}
      <use
        href="#infinity-path"
        fill="none"
        stroke="url(#loop-grad)"
        strokeWidth="1.1"
        strokeDasharray="3 7"
        strokeOpacity="0.85"
      >
        {!reduce && (
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="-80"
            dur="9s"
            repeatCount="indefinite"
          />
        )}
      </use>

      {/* crossover halo */}
      <circle
        cx={CX}
        cy={CY}
        r="14"
        fill="url(#crossover-glow)"
        opacity="0.6"
      >
        {!reduce && (
          <animate
            attributeName="opacity"
            values="0.35;0.85;0.35"
            dur="2.2s"
            repeatCount="indefinite"
          />
        )}
      </circle>

      {/* expanding pulse ring at crossover */}
      {!reduce && (
        <circle
          cx={CX}
          cy={CY}
          r="4"
          fill="none"
          stroke="hsl(var(--amber))"
          strokeWidth="0.9"
        >
          <animate
            attributeName="r"
            from="4"
            to="24"
            dur="2.6s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            from="0.8"
            to="0"
            dur="2.6s"
            repeatCount="indefinite"
          />
        </circle>
      )}

      {/* Particles flowing along infinity — alternating lime/accent */}
      {!reduce && (
        <g>
          <circle r="2.8" fill="hsl(var(--lime))" filter="url(#particle-glow)">
            <animateMotion dur="9s" repeatCount="indefinite" begin="0s">
              <mpath href="#infinity-path" />
            </animateMotion>
          </circle>
          <circle r="2.1" fill="hsl(var(--lime))" opacity="0.75" filter="url(#particle-glow)">
            <animateMotion dur="9s" repeatCount="indefinite" begin="-2.25s">
              <mpath href="#infinity-path" />
            </animateMotion>
          </circle>
          <circle r="2.8" fill="hsl(var(--accent))" filter="url(#particle-glow)">
            <animateMotion dur="9s" repeatCount="indefinite" begin="-4.5s">
              <mpath href="#infinity-path" />
            </animateMotion>
          </circle>
          <circle r="2.1" fill="hsl(var(--accent))" opacity="0.75" filter="url(#particle-glow)">
            <animateMotion dur="9s" repeatCount="indefinite" begin="-6.75s">
              <mpath href="#infinity-path" />
            </animateMotion>
          </circle>
        </g>
      )}

      {/* Artifact funnel — dashed line from crossover downward */}
      <line
        x1={CX}
        y1={CY + 8}
        x2={CX}
        y2={H - 18}
        stroke="hsl(var(--amber))"
        strokeOpacity="0.25"
        strokeWidth="0.8"
        strokeDasharray="2 3"
      />

      {/* dripping amber artifact particles */}
      {!reduce &&
        [0, 0.9, 1.8].map((delay, i) => (
          <circle
            key={i}
            r="2"
            fill="hsl(var(--amber))"
            filter="url(#particle-glow)"
          >
            <animate
              attributeName="opacity"
              values="0;1;1;0"
              keyTimes="0;0.12;0.8;1"
              dur="2.7s"
              begin={`${delay}s`}
              repeatCount="indefinite"
            />
            <animateMotion
              dur="2.7s"
              begin={`${delay}s`}
              repeatCount="indefinite"
              path={`M ${CX} ${CY + 8} L ${CX} ${H - 18}`}
            />
          </circle>
        ))}

      {/* HUMAN node — left lobe */}
      <g>
        <rect
          x="12"
          y={CY - 22}
          width="72"
          height="44"
          rx="7"
          fill="hsl(var(--lime) / 0.08)"
          stroke="hsl(var(--lime) / 0.42)"
          strokeWidth="1"
        />
        {/* brain glyph */}
        <g transform={`translate(${26} ${CY})`}>
          <circle r="6" fill="hsl(var(--lime) / 0.18)" stroke="hsl(var(--lime))" strokeWidth="0.8" />
          <path
            d="M -3.5 -1.5 Q 0 -4 3.5 -1.5 M -3.5 1.5 Q 0 4 3.5 1.5 M 0 -3 L 0 3"
            fill="none"
            stroke="hsl(var(--lime))"
            strokeWidth="0.6"
            opacity="0.8"
          />
        </g>
        <text
          x="58"
          y={CY - 2}
          textAnchor="middle"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          fontSize="10"
          fontWeight="700"
          fill="hsl(var(--lime))"
          letterSpacing="1.5"
        >
          FELIX
        </text>
        <text
          x="58"
          y={CY + 11}
          textAnchor="middle"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          fontSize="6.5"
          fill="hsl(var(--lime))"
          opacity="0.6"
          letterSpacing="2"
        >
          HUMAN · SR ENG
        </text>
        {/* pulse aura */}
        {!reduce && (
          <circle
            cx="48"
            cy={CY}
            r="10"
            fill="none"
            stroke="hsl(var(--lime))"
            strokeWidth="0.7"
          >
            <animate
              attributeName="r"
              from="10"
              to="30"
              dur="2.8s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              from="0.55"
              to="0"
              dur="2.8s"
              repeatCount="indefinite"
            />
          </circle>
        )}
      </g>

      {/* AI node — right lobe */}
      <g>
        <rect
          x={W - 84}
          y={CY - 22}
          width="72"
          height="44"
          rx="7"
          fill="hsl(var(--accent) / 0.08)"
          stroke="hsl(var(--accent) / 0.42)"
          strokeWidth="1"
        />
        {/* chip glyph */}
        <g transform={`translate(${W - 30} ${CY})`}>
          <rect
            x="-6"
            y="-6"
            width="12"
            height="12"
            rx="1.5"
            fill="hsl(var(--accent) / 0.18)"
            stroke="hsl(var(--accent))"
            strokeWidth="0.8"
          />
          <rect
            x="-2.5"
            y="-2.5"
            width="5"
            height="5"
            fill="hsl(var(--accent))"
          />
          {/* chip legs */}
          <line x1="-6" y1="-3" x2="-8" y2="-3" stroke="hsl(var(--accent))" strokeWidth="0.6" />
          <line x1="-6" y1="0" x2="-8" y2="0" stroke="hsl(var(--accent))" strokeWidth="0.6" />
          <line x1="-6" y1="3" x2="-8" y2="3" stroke="hsl(var(--accent))" strokeWidth="0.6" />
          <line x1="6" y1="-3" x2="8" y2="-3" stroke="hsl(var(--accent))" strokeWidth="0.6" />
          <line x1="6" y1="0" x2="8" y2="0" stroke="hsl(var(--accent))" strokeWidth="0.6" />
          <line x1="6" y1="3" x2="8" y2="3" stroke="hsl(var(--accent))" strokeWidth="0.6" />
        </g>
        <text
          x={W - 58}
          y={CY - 2}
          textAnchor="middle"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          fontSize="10"
          fontWeight="700"
          fill="hsl(var(--accent))"
          letterSpacing="1.5"
        >
          CLAUDE
        </text>
        <text
          x={W - 58}
          y={CY + 11}
          textAnchor="middle"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          fontSize="6.5"
          fill="hsl(var(--accent))"
          opacity="0.6"
          letterSpacing="2"
        >
          AI · COPILOT
        </text>
        {/* pulse aura, offset in phase */}
        {!reduce && (
          <circle
            cx={W - 48}
            cy={CY}
            r="10"
            fill="none"
            stroke="hsl(var(--accent))"
            strokeWidth="0.7"
          >
            <animate
              attributeName="r"
              from="10"
              to="30"
              dur="2.8s"
              begin="1.4s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              from="0.55"
              to="0"
              dur="2.8s"
              begin="1.4s"
              repeatCount="indefinite"
            />
          </circle>
        )}
      </g>

      {/* corner markers */}
      <g stroke="hsl(var(--ink-soft))" strokeWidth="0.8" fill="none" opacity="0.45">
        <path d="M 6 6 L 6 12 M 6 6 L 12 6" />
        <path d={`M ${W - 6} 6 L ${W - 6} 12 M ${W - 6} 6 L ${W - 12} 6`} />
        <path d={`M 6 ${H - 6} L 6 ${H - 12} M 6 ${H - 6} L 12 ${H - 6}`} />
        <path d={`M ${W - 6} ${H - 6} L ${W - 6} ${H - 12} M ${W - 6} ${H - 6} L ${W - 12} ${H - 6}`} />
      </g>

      {/* footer label */}
      <text
        x={CX}
        y={H - 6}
        textAnchor="middle"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize="7.5"
        fill="hsl(var(--amber))"
        opacity="0.7"
        letterSpacing="2.5"
      >
        ↓ SHIPPING · iterate · ship · iterate
      </text>
    </svg>
  )
}

// ============================================================
// ArtifactChip — a single artifact in the shipped stream.
// Animates in from above when pushed, slides when neighbors
// exit via `layout` + popLayout mode.
// ============================================================

function ArtifactChip({
  artifact,
}: {
  artifact: ShipArtifact & { uid: number }
}) {
  const cls = ACCENT_CLS[artifact.accent]
  const Icon =
    artifact.type === 'ship'
      ? Rocket
      : artifact.type === 'deploy'
      ? Cloud
      : artifact.type === 'fix'
      ? Zap
      : GitCommit

  return (
    <motion.span
      layout
      initial={{ opacity: 0, y: -14, scale: 0.7 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -14, scale: 0.7 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`inline-flex items-center gap-1 px-1.5 py-1 rounded font-mono text-[10px] ${cls.bg}`}
      style={{
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: `hsl(var(${ACCENT_VAR[artifact.accent]}) / 0.35)`,
      }}
    >
      <Icon className={`w-2.5 h-2.5 ${cls.text}`} aria-hidden />
      <span
        className={`text-[9px] uppercase tracking-wider opacity-75 ${cls.text}`}
      >
        {artifact.type}
      </span>
      <span className="text-ink">{artifact.label}</span>
    </motion.span>
  )
}

function LedStat({
  number,
  suffix,
  label,
  accent,
  idx,
}: {
  number: number
  suffix?: string
  label: string
  accent: Exclude<Accent, 'amber'>
  idx: string
}) {
  const cls = ACCENT_CLS[accent]
  // normalize fullness: years out of 15, countries out of 20, products out of 30
  const scaleMap: Record<string, number> = { '01': 15, '02': 20, '03': 30 }
  const pct = Math.min((number / (scaleMap[idx] || 25)) * 100, 100)
  return (
    <div className="bg-background p-3.5 relative overflow-hidden group">
      <span
        aria-hidden
        className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[1200ms] ease-out pointer-events-none bg-gradient-to-r from-transparent via-accent/15 to-transparent"
      />
      <div className="flex items-center justify-between text-[9.5px] font-mono text-ink-soft mb-1.5">
        <span className="tabular-nums">{idx}</span>
        <span className={`w-1 h-1 rounded-full ${cls.dot} animate-pulse`} />
      </div>
      <div className="font-display text-2xl md:text-[28px] font-black text-ink tracking-tighter leading-none">
        <AnimatedNumber value={number} suffix={suffix} />
        <span className={`ml-0.5 ${cls.text}`}>.</span>
      </div>
      <div className="mt-2 h-[3px] rounded-full bg-border overflow-hidden relative">
        <motion.span
          className={`block h-full ${cls.bar} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.span
          aria-hidden
          className="absolute top-0 bottom-0 w-4 bg-gradient-to-r from-transparent via-white/60 to-transparent"
          animate={{ left: ['-20%', '120%'] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
            delay: 1 + (idx === '01' ? 0 : idx === '02' ? 0.8 : 1.6),
          }}
        />
      </div>
      <div className="text-[9px] tracking-[0.12em] uppercase text-ink-muted mt-1.5 font-semibold truncate">
        {label}
      </div>
    </div>
  )
}

// ============================================================
// BottomHudStrip — telemetry bar above the marquee
// ============================================================

function BottomHudStrip({ frame }: { frame: number }) {
  // mild sine-wave wiggle so numbers feel alive without thrashing renders
  const cpu = 42 + Math.round(Math.sin(frame / 30) * 8)
  const mem = 61 + Math.round(Math.cos(frame / 40) * 4)
  const tick = ((frame * 1733) & 0xffff).toString(16).padStart(4, '0').toUpperCase()

  return (
    <div className="relative z-10 hidden md:flex items-center justify-between gap-4 px-6 py-2 border-t border-border bg-ink text-white/70 text-[10px] font-mono tracking-[0.15em] uppercase">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <MapPin className="w-3 h-3 text-lime" />
          <span>14.60° n · 120.98° e</span>
          <span className="text-white/40">· manila</span>
        </span>
        <span className="text-white/30">//</span>
        <span className="flex items-center gap-1.5">
          <Signal className="w-3 h-3 text-electric" />
          <span>128ms</span>
          <span className="text-white/40">· cf-hkg01</span>
        </span>
      </div>
      <div className="flex items-center gap-4 normal-case tracking-normal">
        <span className="hidden lg:flex items-center gap-1.5">
          <Cpu className="w-3 h-3 text-amber" />
          <span className="text-white tabular-nums">cpu {cpu}%</span>
        </span>
        <span className="hidden lg:flex items-center gap-1.5">
          <Layers className="w-3 h-3 text-lime" />
          <span className="text-white tabular-nums">mem {mem}%</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Activity className="w-3 h-3 text-accent" />
          <span className="text-white tabular-nums">
            tick 0x{tick}
          </span>
        </span>
      </div>
    </div>
  )
}
