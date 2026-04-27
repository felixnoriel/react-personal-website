import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion'
import {
  Activity,
  Cloud,
  Cpu,
  HardDrive,
  Layout,
  Server,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Marquee } from './ui/Marquee'
import { useFxLevel } from '../hooks/useFxLevel'

type Accent = 'accent' | 'lime' | 'electric'

type Skill = {
  name: string
  years?: number
  live?: boolean
  note?: string
}

type Stack = {
  id: 'frontend' | 'backend' | 'infra'
  title: string
  number: string
  caption: string
  icon: LucideIcon
  accent: Accent
  groups: { label: string; items: Skill[] }[]
}

const STACKS: Stack[] = [
  {
    id: 'frontend',
    title: 'Front end',
    number: '01',
    caption: 'interfaces & experience',
    icon: Layout,
    accent: 'accent',
    groups: [
      {
        label: 'Frameworks',
        items: [
          { name: 'React', years: 9, live: true },
          { name: 'React Native', years: 6, live: true },
          { name: 'Next.js', years: 5, live: true },
          { name: 'Vite', years: 3, live: true },
          { name: 'AngularJS', years: 6, note: 'legacy' },
          { name: 'jQuery', years: 10, note: 'legacy' },
        ],
      },
      {
        label: 'UI & Styling',
        items: [
          { name: 'Tailwind', years: 4, live: true },
          { name: 'shadcn/ui', years: 2, live: true },
          { name: 'Chakra', years: 3 },
          { name: 'Material UI', years: 4 },
        ],
      },
      {
        label: 'Tooling',
        items: [
          { name: 'GraphQL', years: 5, live: true },
          { name: 'Storybook', years: 4 },
          { name: 'Turborepo', years: 2, live: true },
          { name: 'Webpack', years: 6 },
        ],
      },
      {
        label: 'Testing',
        items: [
          { name: 'Jest', years: 6 },
          { name: 'Playwright', years: 2, live: true },
        ],
      },
    ],
  },
  {
    id: 'backend',
    title: 'Back end',
    number: '02',
    caption: 'services & data',
    icon: Server,
    accent: 'lime',
    groups: [
      {
        label: 'Languages',
        items: [
          { name: 'Node.js', years: 11, live: true },
          { name: 'TypeScript', years: 9, live: true },
          { name: 'Golang', years: 3, live: true },
          { name: 'NestJS', years: 4 },
          { name: 'Express', years: 10 },
          { name: 'Java', years: 3 },
          { name: '.NET / C#', years: 2 },
          { name: 'PHP', years: 5, note: 'legacy' },
        ],
      },
      {
        label: 'Databases',
        items: [
          { name: 'PostgreSQL', years: 8, live: true },
          { name: 'MySQL', years: 8 },
          { name: 'Firebase', years: 4 },
          { name: 'Convex', years: 1, live: true },
        ],
      },
      {
        label: 'Observability',
        items: [
          { name: 'Datadog', years: 3, live: true },
          { name: 'Sentry', years: 6 },
          { name: 'New Relic', years: 3 },
        ],
      },
    ],
  },
  {
    id: 'infra',
    title: 'Infrastructure',
    number: '03',
    caption: 'cloud & delivery',
    icon: Cloud,
    accent: 'electric',
    groups: [
      {
        label: 'Google Cloud',
        items: [
          { name: 'Cloud Run', years: 4, live: true },
          { name: 'Cloud Functions', years: 5 },
          { name: 'Pub/Sub', years: 4 },
          { name: 'BigQuery', years: 4 },
          { name: 'Cloud SQL', years: 3 },
          { name: 'Cloud Tasks', years: 3 },
          { name: 'Storage', years: 5 },
          { name: 'Cloud Build', years: 3 },
        ],
      },
      {
        label: 'AWS',
        items: [
          { name: 'Lambda', years: 5, live: true },
          { name: 'ECS', years: 4, live: true },
          { name: 'CDK', years: 3 },
          { name: 'EC2', years: 6 },
          { name: 'S3', years: 8 },
          { name: 'SNS / SQS', years: 5 },
          { name: 'CloudFront', years: 5 },
          { name: 'RDS', years: 4 },
          { name: 'API Gateway', years: 4 },
          { name: 'CloudFormation', years: 5 },
        ],
      },
      {
        label: 'Other',
        items: [
          { name: 'Docker', years: 7, live: true },
          { name: 'GitHub Actions', years: 4, live: true },
          { name: 'Vercel', years: 4, live: true },
          { name: 'Redis', years: 7 },
          { name: 'Circle CI', years: 5 },
          { name: 'Algolia', years: 3 },
          { name: 'Typesense', years: 2 },
        ],
      },
    ],
  },
]

const ACCENT_TOKEN: Record<Accent, { text: string; bg: string; ring: string; dot: string; bar: string; glow: string; hsl: string }> = {
  accent: {
    text: 'text-accent',
    bg: 'bg-accent/10',
    ring: 'ring-accent/40',
    dot: 'bg-accent',
    bar: 'bg-accent',
    glow: 'hsl(var(--accent) / 0.35)',
    hsl: 'var(--accent)',
  },
  lime: {
    text: 'text-lime',
    bg: 'bg-lime/15',
    ring: 'ring-lime/40',
    dot: 'bg-lime',
    bar: 'bg-lime',
    glow: 'hsl(var(--lime) / 0.45)',
    hsl: 'var(--lime)',
  },
  electric: {
    text: 'text-electric',
    bg: 'bg-electric/10',
    ring: 'ring-electric/40',
    dot: 'bg-electric',
    bar: 'bg-electric',
    glow: 'hsl(var(--electric) / 0.4)',
    hsl: 'var(--electric)',
  },
}

type FilterId = 'all' | 'frontend' | 'backend' | 'infra'

function formatUptime(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
}

function hashSeed(str: string): number {
  let seed = 0
  for (let i = 0; i < str.length; i++) seed = (seed * 31 + str.charCodeAt(i)) | 0
  return seed >>> 0
}

function seededRng(seed: number): () => number {
  let s = seed || 1
  return () => {
    s = (s * 9301 + 49297) & 0xffffffff
    return ((s >>> 0) % 10000) / 10000
  }
}

function makeSparklinePath(name: string, width: number, height: number): string {
  const rng = seededRng(hashSeed(name))
  const steps = 14
  const pts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * width
    const y = height - (0.2 + rng() * 0.7) * height
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`)
  }
  return `M ${pts.join(' L ')}`
}

export function TechToolbelt() {
  const [filter, setFilter] = useState<FilterId>('all')
  const [uptime, setUptime] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setUptime((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const allSkills = useMemo(() => {
    const out: Array<Skill & { stack: Stack; group: string; pid: string }> = []
    let pid = 1
    STACKS.forEach((s) => {
      s.groups.forEach((g) => {
        g.items.forEach((it) => {
          out.push({
            ...it,
            stack: s,
            group: g.label,
            pid: pid.toString().padStart(3, '0'),
          })
          pid++
        })
      })
    })
    return out
  }, [])

  const visibleStacks = filter === 'all' ? STACKS : STACKS.filter((s) => s.id === filter)
  const toolCount = allSkills.length
  const liveCount = allSkills.filter((s) => s.live).length
  const liveNow = allSkills.filter((s) => s.live)

  const stackCounts: Record<FilterId, number> = {
    all: allSkills.length,
    frontend: STACKS[0].groups.reduce((n, g) => n + g.items.length, 0),
    backend: STACKS[1].groups.reduce((n, g) => n + g.items.length, 0),
    infra: STACKS[2].groups.reduce((n, g) => n + g.items.length, 0),
  }

  // Keyboard F1-F4 shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F1') { e.preventDefault(); setFilter('all') }
      if (e.key === 'F2') { e.preventDefault(); setFilter('frontend') }
      if (e.key === 'F3') { e.preventDefault(); setFilter('backend') }
      if (e.key === 'F4') { e.preventDefault(); setFilter('infra') }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const hexTick = ((uptime * 2749) & 0xffff).toString(16).padStart(4, '0').toUpperCase()

  return (
    <section
      id="skills-section"
      className="relative py-28 md:py-36 bg-surface scroll-mt-20 border-y border-border overflow-hidden"
    >
      {/* ambient backdrop */}
      <div
        aria-hidden
        className="absolute top-0 right-0 w-[45%] h-[60%] pointer-events-none opacity-60"
        style={{
          background:
            'radial-gradient(ellipse at top right, hsl(var(--lime) / 0.1), transparent 70%)',
        }}
      />
      <div
        aria-hidden
        className="absolute bottom-0 left-0 w-[40%] h-[50%] pointer-events-none opacity-40"
        style={{
          background:
            'radial-gradient(ellipse at bottom left, hsl(var(--accent) / 0.08), transparent 70%)',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--ink)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--ink)) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="container relative mx-auto px-6 max-w-6xl">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl mb-10 md:mb-12"
        >
          <div className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-ink-muted mb-4">
            <span className="font-mono">— Capabilities</span>
            <span className="inline-flex items-center gap-1.5 font-mono normal-case text-[10px] text-ink-soft">
              <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse" />
              v2025.1 · kernel
            </span>
          </div>
          <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tighter text-ink mb-6 text-balance">
            Tools and tech I reach{' '}
            <span className="italic font-extrabold text-accent">for every day</span>.
          </h2>
          <p className="text-lg text-ink-muted max-w-xl leading-relaxed">
            A decade of shipping across startups, media, and Web3 — here&apos;s
            what&apos;s in the current toolbox, booted and running.
          </p>
        </motion.div>

        {/* ---------------------------------------------------------- */}
        {/* CORE REACTOR — orbital visualization                       */}
        {/* ---------------------------------------------------------- */}
        <CoreReactor
          stacks={STACKS}
          activeStack={filter}
          onSelectStack={(id) => setFilter(id)}
          uptime={uptime}
        />

        {/* ---------------------------------------------------------- */}
        {/* TERMINAL DASHBOARD                                         */}
        {/* ---------------------------------------------------------- */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-2xl border border-border bg-background overflow-hidden shadow-[0_30px_80px_-30px_hsl(var(--ink)/0.4)]"
        >
          {/* === Title bar === */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-ink text-background">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
              <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
              <span className="w-3 h-3 rounded-full bg-[#28C840]" />
            </span>
            <span className="font-mono text-[11px] text-white/60 ml-2 hidden sm:inline">
              felix@dev — ~/skills.sh — 120×40
            </span>
            <span className="ml-auto flex items-center gap-3 font-mono text-[11px]">
              <span className="flex items-center gap-1.5 text-lime">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-lime opacity-75 animate-ping" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lime" />
                </span>
                LIVE
              </span>
              <span className="text-white/40 hidden sm:inline">·</span>
              <span className="text-white/70 tabular-nums hidden sm:inline">{formatUptime(uptime)}</span>
            </span>
          </div>

          {/* === System readout strip === */}
          <div className="relative flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5 text-[11px] font-mono text-ink-soft border-b border-border bg-surface/50">
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-accent/40 to-transparent"
            />
            <Readout label="host" value="felix.local" valueCls="text-ink" />
            <Readout label="kernel" value="v2025.1" valueCls="text-electric" />
            <Readout label="tools" value={String(toolCount)} valueCls="text-ink" />
            <Readout label="procs" value={`${liveCount}`} valueCls="text-lime" dot />
            <Readout label="stacks" value="3" valueCls="text-amber" />
            <span className="ml-auto tabular-nums text-ink-soft flex items-center gap-2">
              <Zap className="w-3 h-3 text-amber" />
              <span className="text-ink-soft">tick</span>
              <span className="text-accent">0x{hexTick}</span>
            </span>
          </div>

          {/* === Skill Matrix Heatmap === */}
          <SkillHeatmap
            allSkills={allSkills}
            filter={filter}
            onSelect={(id) => setFilter(id)}
          />

          {/* === htop-style filter tabs === */}
          <div className="flex items-stretch bg-border/40 border-b border-border font-mono text-[12px] overflow-x-auto">
            <FilterTab
              fKey="F1"
              label="all"
              count={stackCounts.all}
              active={filter === 'all'}
              onClick={() => setFilter('all')}
            />
            <FilterTab
              fKey="F2"
              label="frontend"
              count={stackCounts.frontend}
              active={filter === 'frontend'}
              onClick={() => setFilter('frontend')}
              accent="accent"
            />
            <FilterTab
              fKey="F3"
              label="backend"
              count={stackCounts.backend}
              active={filter === 'backend'}
              onClick={() => setFilter('backend')}
              accent="lime"
            />
            <FilterTab
              fKey="F4"
              label="infra"
              count={stackCounts.infra}
              active={filter === 'infra'}
              onClick={() => setFilter('infra')}
              accent="electric"
            />
            <span className="ml-auto flex items-center px-4 text-[10px] text-ink-soft whitespace-nowrap">
              <span className="hidden md:inline">press </span>
              <kbd className="mx-1 px-1 py-0.5 rounded-sm border border-border bg-background text-ink-muted">F1-F4</kbd>
              <span className="hidden md:inline">to switch</span>
            </span>
          </div>

          {/* === Process Tables === */}
          <div
            className={`grid gap-px bg-border ${
              filter === 'all' ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'
            }`}
          >
            <AnimatePresence mode="popLayout">
              {visibleStacks.map((s, i) => (
                <ProcessTable key={s.id} stack={s} index={i} />
              ))}
            </AnimatePresence>
          </div>

          {/* === Running processes ticker === */}
          <div className="border-t border-border bg-ink text-background">
            <div className="flex items-center gap-2 px-4 py-2 text-[10px] font-mono tracking-[0.2em] uppercase text-white/50">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-lime opacity-75 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lime" />
              </span>
              <span>ps aux | grep &quot;running&quot;</span>
              <span className="ml-auto normal-case text-white/40 hidden sm:inline">
                {liveCount}/{toolCount} procs active
              </span>
            </div>
            <Marquee className="py-2.5 text-[11px] tracking-[0.15em] uppercase text-white/60 border-t border-white/5">
              {liveNow.map((s, i) => {
                const dot = ACCENT_TOKEN[s.stack.accent].dot
                return (
                  <div key={`${s.name}-${i}`} className="flex items-center gap-7">
                    <span className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                      <span className="font-mono text-white">{s.name}</span>
                      <span className="font-mono text-white/40 tabular-nums">
                        {s.years || 0}y
                      </span>
                    </span>
                    <span className="text-white/30">//</span>
                  </div>
                )
              })}
            </Marquee>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ============================================================
// SkillHeatmap — animated grid of all tools, color by stack,
// intensity by years, pulsing if live
// ============================================================

function SkillHeatmap({
  allSkills,
  filter,
  onSelect,
}: {
  allSkills: Array<Skill & { stack: Stack; group: string; pid: string }>
  filter: FilterId
  onSelect: (id: FilterId) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(50)
  const my = useMotionValue(50)
  const bg = useMotionTemplate`radial-gradient(500px circle at ${mx}% ${my}%, hsl(var(--accent) / 0.08), transparent 50%)`
  // Skip mousemove handler on mobile — touchscreens fire phantom mousemove
  // events on tap that retrigger the radial-gradient repaint for nothing.
  const { isMobile } = useFxLevel()

  return (
    <div
      ref={ref}
      onMouseMove={
        isMobile
          ? undefined
          : (e) => {
              const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
              mx.set(((e.clientX - r.left) / r.width) * 100)
              my.set(((e.clientY - r.top) / r.height) * 100)
            }
      }
      className="relative border-b border-border bg-gradient-to-br from-background via-surface/20 to-background px-5 md:px-6 py-5 overflow-hidden"
    >
      {/* scanline overlay */}
      <div aria-hidden className="absolute inset-0 bg-scanlines pointer-events-none opacity-25" />
      {/* mouse spotlight */}
      <motion.div
        aria-hidden
        style={{ background: bg }}
        className="absolute inset-0 pointer-events-none"
      />

      <div className="relative">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-4 font-mono text-[10px] tracking-[0.18em] uppercase text-ink-soft">
          <Activity className="w-3 h-3 text-lime shrink-0" />
          <span>skill.matrix</span>
          <span className="text-ink-soft">·</span>
          <span className="text-ink normal-case tabular-nums">{allSkills.length} nodes</span>
          <span className="text-ink-soft">·</span>
          <span className="normal-case">
            intensity <span className="text-ink">= years</span>
          </span>
          <span className="ml-auto flex items-center gap-3 normal-case">
            {STACKS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelect(s.id as FilterId)}
                className={`flex items-center gap-1.5 hover:text-ink transition-colors ${
                  filter === s.id ? 'text-ink' : ''
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-[2px] ${ACCENT_TOKEN[s.accent].dot}`} />
                <span>{s.title.toLowerCase()}</span>
              </button>
            ))}
          </span>
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(22px,1fr))] gap-[4px]">
          {allSkills.map((s, i) => {
            const cls = ACCENT_TOKEN[s.stack.accent]
            const intensity = Math.min((s.years || 1) / 10, 1)
            const isActive = filter === 'all' || filter === s.stack.id
            const col = `hsl(${cls.hsl} / ${0.18 + intensity * 0.55})`
            return (
              <motion.button
                key={`${s.name}-${i}`}
                type="button"
                initial={{ opacity: 0, scale: 0.3 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.35,
                  delay: Math.min(i * 0.008, 0.5),
                  ease: [0.22, 1, 0.36, 1],
                }}
                onClick={() => onSelect(s.stack.id as FilterId)}
                title={`${s.name} — ${s.years || 0}y${s.live ? ' · live' : ''}`}
                className={`relative aspect-square rounded-[4px] transition-all duration-300 hover:scale-[1.4] hover:z-10 ${
                  isActive ? 'opacity-100' : 'opacity-20'
                }`}
                style={{ backgroundColor: col }}
                aria-label={`${s.name}, ${s.years || 0} years${s.live ? ', live' : ''}`}
              >
                {s.live && !isMobile && (
                  <motion.span
                    aria-hidden
                    className="absolute inset-0 rounded-[4px]"
                    animate={{ opacity: [0.3, 0.9, 0.3] }}
                    transition={{
                      duration: 2 + (i % 5) * 0.3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: (i % 9) * 0.2,
                    }}
                    style={{ backgroundColor: `hsl(${cls.hsl} / 0.35)` }}
                  />
                )}
                {s.live && (
                  <span
                    aria-hidden
                    className="absolute top-[2px] right-[2px] w-[3px] h-[3px] rounded-full"
                    style={{ backgroundColor: `hsl(${cls.hsl} / 0.9)` }}
                  />
                )}
              </motion.button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// ProcessTable — htop-style process list per stack
// ============================================================

function ProcessTable({ stack, index }: { stack: Stack; index: number }) {
  const cls = ACCENT_TOKEN[stack.accent]
  const Icon = stack.icon
  const ref = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const spot = useMotionTemplate`radial-gradient(500px circle at ${mx}% ${my}%, ${cls.glow}, transparent 55%)`
  // Mobile: skip mouse spotlight (touchscreens fire phantom mousemove on tap)
  // and skip the per-row live-shimmer infinite loop. With ~60 live rows the
  // shimmer alone was running 60 concurrent animations every frame.
  const { isMobile } = useFxLevel()

  const total = stack.groups.reduce((n, g) => n + g.items.length, 0)
  const live = stack.groups.reduce(
    (n, g) => n + g.items.filter((it) => it.live).length,
    0
  )

  return (
    <motion.div
      ref={ref}
      onMouseMove={
        isMobile
          ? undefined
          : (e) => {
              if (!ref.current) return
              const r = ref.current.getBoundingClientRect()
              mx.set(((e.clientX - r.left) / r.width) * 100)
              my.set(((e.clientY - r.top) / r.height) * 100)
            }
      }
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="group relative bg-background"
    >
      {/* moving spotlight */}
      <motion.div
        aria-hidden
        style={{ background: spot }}
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
      />
      {/* top accent line */}
      <div
        className={`absolute top-0 left-0 right-0 h-[2px] ${cls.bar} opacity-0 group-hover:opacity-90 transition-opacity`}
      />

      {/* Header */}
      <div className="relative flex items-center gap-3 px-5 py-3 border-b border-border bg-surface/40">
        <span
          className={`w-9 h-9 rounded-lg flex items-center justify-center ${cls.bg} ${cls.text} transition-transform group-hover:scale-[1.06] group-hover:-rotate-3`}
        >
          <Icon className="w-4 h-4" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[10px] text-ink-soft tabular-nums">
              {stack.number}
            </span>
            <h3 className="font-display text-base md:text-lg font-bold text-ink truncate">
              {stack.title}
            </h3>
          </div>
          <div className="font-mono text-[10px] text-ink-muted">
            ~/skills/{stack.id} · {stack.caption}
          </div>
        </div>
        <div className="text-right font-mono text-[10px] text-ink-soft shrink-0">
          <div>
            <span className="text-ink tabular-nums">{total}</span> procs
          </div>
          <div className="flex items-center gap-1 justify-end">
            <span className={`w-1 h-1 rounded-full ${cls.dot} animate-pulse`} />
            <span className={cls.text}>{live}</span>
            <span>live</span>
          </div>
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[30px_1fr_36px_36px_72px] gap-2 px-5 py-1.5 border-b border-border text-[9.5px] font-mono tracking-[0.12em] uppercase text-ink-soft">
        <span>pid</span>
        <span>name</span>
        <span className="text-right">yrs</span>
        <span>stat</span>
        <span>load</span>
      </div>

      {/* Process rows, grouped */}
      <div>
        {stack.groups.map((group, gi) => {
          return (
            <div key={group.label}>
              {/* Group header */}
              <div className="px-5 py-1.5 bg-surface/30 border-t border-border/60 text-[9.5px] font-mono tracking-[0.15em] uppercase text-ink-soft flex items-center gap-2">
                <span className={cls.text}>
                  [{group.label.toLowerCase().replace(/\s/g, '_')}]
                </span>
                <span className="flex-1 h-px bg-border/60" />
                <span className="tabular-nums">{group.items.length.toString().padStart(2, '0')}</span>
              </div>
              {group.items.map((it, i) => (
                <ProcessRow
                  key={it.name}
                  skill={it}
                  accent={stack.accent}
                  pid={(gi * 100 + i + 1).toString().padStart(3, '0')}
                  rowIndex={gi * 10 + i}
                  lite={isMobile}
                />
              ))}
            </div>
          )
        })}
      </div>

      {/* Footer signature */}
      <div className="relative px-5 py-2 border-t border-border bg-surface/30 flex items-center gap-2 font-mono text-[9.5px] text-ink-soft">
        <Cpu className="w-3 h-3" />
        <span>
          felix.stacks[<span className="text-ink">{stack.number.replace(/^0/, '')}</span>]
        </span>
        <span className="text-ink-soft">·</span>
        <span>
          status: <span className={cls.text}>operational</span>
        </span>
        <span className="ml-auto flex items-center gap-1">
          <HardDrive className="w-3 h-3" />
          <span className="text-ink">{stack.id}.pid</span>
        </span>
      </div>
    </motion.div>
  )
}

// ============================================================
// ProcessRow — single skill row, htop style
// ============================================================

function ProcessRow({
  skill,
  accent,
  pid,
  rowIndex,
  lite = false,
}: {
  skill: Skill
  accent: Accent
  pid: string
  rowIndex: number
  lite?: boolean
}) {
  const cls = ACCENT_TOKEN[accent]
  const loadPct = Math.min((skill.years || 1) / 11, 1) * 100
  const sparkPath = useMemo(
    () => makeSparklinePath(skill.name, 56, 14),
    [skill.name]
  )

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: 0.35,
        delay: Math.min(rowIndex * 0.02, 0.8),
        ease: [0.22, 1, 0.36, 1],
      }}
      className="grid grid-cols-[30px_1fr_36px_36px_72px] gap-2 px-5 py-[5px] items-center text-[12px] font-mono hover:bg-surface/60 transition-colors group/row border-t border-border/30"
    >
      {/* PID */}
      <span className="text-ink-soft tabular-nums text-[11px]">{pid}</span>

      {/* Name + note + sparkline */}
      <span className="flex items-center gap-2 min-w-0">
        <span className="text-ink truncate">{skill.name}</span>
        {skill.note && (
          <span className="text-[9.5px] text-ink-soft uppercase tracking-wider shrink-0">
            ·{skill.note}
          </span>
        )}
        <svg
          className="ml-auto hidden md:block opacity-0 group-hover/row:opacity-100 transition-opacity shrink-0"
          width="56"
          height="14"
          viewBox="0 0 56 14"
          aria-hidden
        >
          <motion.path
            d={sparkPath}
            fill="none"
            stroke={`hsl(${cls.hsl})`}
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: rowIndex * 0.02, ease: 'easeOut' }}
          />
        </svg>
      </span>

      {/* Years */}
      <span
        className={`tabular-nums text-right text-[11px] ${
          skill.years && skill.years >= 5 ? cls.text : 'text-ink-muted'
        }`}
      >
        {skill.years || 0}y
      </span>

      {/* Status */}
      <span className="flex items-center gap-1 text-[10px]">
        {skill.live ? (
          <>
            <span className="relative flex h-1.5 w-1.5">
              {!lite && (
                <span
                  className={`absolute inline-flex h-full w-full rounded-full ${cls.dot} opacity-75 animate-ping`}
                />
              )}
              <span
                className={`relative inline-flex h-1.5 w-1.5 rounded-full ${cls.dot}`}
              />
            </span>
            <span className={cls.text}>R</span>
          </>
        ) : (
          <>
            <span className={`w-1.5 h-1.5 rounded-full ${cls.dot} opacity-30`} />
            <span className="text-ink-soft">S</span>
          </>
        )}
      </span>

      {/* Load bar */}
      <div className="relative h-[7px] rounded-sm bg-border/40 overflow-hidden">
        <motion.span
          aria-hidden
          className={`absolute top-0 left-0 bottom-0 rounded-sm ${cls.bar}`}
          initial={{ width: 0 }}
          whileInView={{ width: `${loadPct}%` }}
          viewport={{ once: true }}
          transition={{
            duration: 0.9,
            delay: Math.min(rowIndex * 0.025, 1.2),
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{ opacity: skill.years && skill.years >= 3 ? 1 : 0.55 }}
        />
        {skill.live && !lite && (
          <motion.span
            aria-hidden
            className="absolute top-0 bottom-0 w-6 bg-gradient-to-r from-transparent via-white/40 to-transparent"
            animate={{ left: ['-20%', '120%'] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
              delay: (rowIndex % 7) * 0.3,
            }}
          />
        )}
      </div>
    </motion.div>
  )
}

// ============================================================
// FilterTab — htop-style F-key tab
// ============================================================

function FilterTab({
  fKey,
  label,
  count,
  active,
  onClick,
  accent,
}: {
  fKey: string
  label: string
  count: number
  active: boolean
  onClick: () => void
  accent?: Accent
}) {
  const activeBg =
    accent === 'accent'
      ? 'bg-accent'
      : accent === 'lime'
      ? 'bg-lime'
      : accent === 'electric'
      ? 'bg-electric'
      : 'bg-ink'
  const activeText =
    accent === 'accent'
      ? 'text-accent'
      : accent === 'lime'
      ? 'text-lime'
      : accent === 'electric'
      ? 'text-electric'
      : 'text-ink'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative group inline-flex items-center gap-2 px-3 md:px-4 py-2.5 transition-colors whitespace-nowrap border-r border-border/60 ${
        active
          ? 'bg-background text-ink'
          : 'bg-surface/40 text-ink-muted hover:text-ink hover:bg-surface/80'
      }`}
    >
      <span
        className={`text-[10px] px-1.5 py-0.5 rounded-sm font-semibold tabular-nums ${
          active ? `${activeBg} text-background` : 'bg-border/50 text-ink-soft'
        }`}
      >
        {fKey}
      </span>
      <span className={active ? activeText : ''}>{label}</span>
      <span className="text-[10px] text-ink-soft tabular-nums">
        ({count.toString().padStart(2, '0')})
      </span>
      {active && (
        <motion.span
          aria-hidden
          layoutId="tab-underline"
          className={`absolute left-0 right-0 bottom-0 h-[2px] ${activeBg}`}
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
        />
      )}
    </button>
  )
}

// ============================================================
// Readout — label: value pair
// ============================================================

function Readout({
  label,
  value,
  valueCls = 'text-ink',
  dot,
}: {
  label: string
  value: string
  valueCls?: string
  dot?: boolean
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-lime opacity-75 animate-ping" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lime" />
        </span>
      )}
      <span className="text-ink-soft uppercase tracking-[0.15em]">{label}</span>
      <span className="text-ink-soft">:</span>
      <span className={`${valueCls} tabular-nums`}>{value}</span>
    </span>
  )
}

// ============================================================
// CoreReactor — orbital visualization of the full stack.
// Central kernel, 3 concentric orbits (one per stack), every
// tool as a node on its orbit. Radar sweep, data particles,
// pulse waves, star field, 3D parallax tilt. Click any node
// or label to filter the htop terminal below.
// ============================================================

type HoverState = {
  name: string
  years: number
  live: boolean
  note?: string
  stack: Stack
  x: number
  y: number
}

type PlacedNode = Skill & {
  stack: Stack
  angle: number
  x: number
  y: number
  radius: number
}

const REACTOR_W = 900
const REACTOR_H = 700
const REACTOR_CX = 450
const REACTOR_CY = 350

function radiusForStack(id: Stack['id']): number {
  if (id === 'frontend') return 130
  if (id === 'backend') return 215
  return 300
}

function CoreReactor({
  stacks,
  activeStack,
  onSelectStack,
  uptime,
}: {
  stacks: Stack[]
  activeStack: FilterId
  onSelectStack: (id: FilterId) => void
  uptime: number
}) {
  const reduce = useReducedMotion()
  const cardRef = useRef<HTMLDivElement>(null)

  // Parallax 3D tilt
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rotX = useSpring(useTransform(my, [-0.5, 0.5], [5, -5]), {
    stiffness: 130,
    damping: 20,
    mass: 0.6,
  })
  const rotY = useSpring(useTransform(mx, [-0.5, 0.5], [-5, 5]), {
    stiffness: 130,
    damping: 20,
    mass: 0.6,
  })

  const [hover, setHover] = useState<HoverState | null>(null)
  const [hoverOrbit, setHoverOrbit] = useState<FilterId | null>(null)

  // Placement of every tool onto an orbit
  const placedNodes: PlacedNode[] = useMemo(() => {
    const out: PlacedNode[] = []
    stacks.forEach((s) => {
      const items = s.groups.flatMap((g) => g.items)
      const R = radiusForStack(s.id)
      // ring-specific offset so the nodes aren't aligned across rings
      const offsetPerRing =
        s.id === 'frontend' ? 0 : s.id === 'backend' ? 0.35 : 0.72
      items.forEach((it, i) => {
        const angle =
          (i / items.length) * Math.PI * 2 - Math.PI / 2 + offsetPerRing
        const x = REACTOR_CX + Math.cos(angle) * R
        const y = REACTOR_CY + Math.sin(angle) * R
        out.push({ ...it, stack: s, angle, x, y, radius: R })
      })
    })
    return out
  }, [stacks])

  const totalNodes = placedNodes.length
  const liveNodes = placedNodes.filter((n) => n.live).length

  // Star field — deterministic. Cut to 40 stars and only twinkle every
  // third one (~14) to keep concurrent SMIL animations bounded.
  const stars = useMemo(() => {
    const rng = seededRng(0x1a2b3c)
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: rng() * REACTOR_W,
      y: rng() * REACTOR_H,
      r: 0.35 + rng() * 1.1,
      delay: rng() * 3.2,
      dur: 2 + rng() * 2.2,
      twinkle: i % 3 === 0,
    }))
  }, [])

  // Throttle mousemove to 1 update per animation frame. Without this every
  // pointer event triggers a spring + re-rasterization of the whole 3D-tilted
  // SVG, which is the main source of lag on this visualization.
  const rafRef = useRef<number | null>(null)
  const pendingPtr = useRef<{ x: number; y: number } | null>(null)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    pendingPtr.current = { x: e.clientX, y: e.clientY }
    if (rafRef.current !== null) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      const p = pendingPtr.current
      if (!p || !cardRef.current) return
      const rect = cardRef.current.getBoundingClientRect()
      mx.set((p.x - rect.left) / rect.width - 0.5)
      my.set((p.y - rect.top) / rect.height - 0.5)
    })
  }

  const handleMouseLeave = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    pendingPtr.current = null
    mx.set(0)
    my.set(0)
    setHover(null)
    setHoverOrbit(null)
  }

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const stackCount = (s: Stack) =>
    s.groups.reduce((n, g) => n + g.items.length, 0)
  const stackLive = (s: Stack) =>
    s.groups.reduce((n, g) => n + g.items.filter((it) => it.live).length, 0)

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="relative mb-6 rounded-2xl border border-border bg-ink text-background overflow-hidden shadow-[0_40px_100px_-30px_hsl(var(--ink)/0.55)]"
      style={{ perspective: 1400 }}
    >
      <motion.div
        style={{
          rotateX: reduce ? 0 : rotX,
          rotateY: reduce ? 0 : rotY,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* === Top HUD bar === */}
        <div className="relative flex items-center gap-3 px-4 py-2.5 border-b border-white/10 bg-black/40 backdrop-blur font-mono text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
            <span className="w-3 h-3 rounded-full bg-[#28C840]" />
          </span>
          <span className="text-white/60 ml-1 hidden sm:inline">
            felix@core — ~/reactor.sh
          </span>
          <span className="ml-auto flex items-center gap-3 tracking-[0.15em] uppercase text-[10px]">
            <span className="flex items-center gap-1.5 text-lime">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-lime opacity-75 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lime" />
              </span>
              online
            </span>
            <span className="text-white/40">·</span>
            <span className="text-white/70 tabular-nums">
              T+{formatUptime(uptime)}
            </span>
          </span>
        </div>

        {/* === Subtitle strip === */}
        <div className="relative flex items-center flex-wrap gap-x-4 gap-y-1 px-4 py-2 border-b border-white/10 bg-black/60 font-mono text-[10px] tracking-[0.18em] uppercase text-white/50">
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-accent/60 to-transparent"
          />
          <span className="text-accent">▸ core.reactor</span>
          <span className="text-white/30">·</span>
          <span>v2025.1</span>
          <span className="text-white/30">·</span>
          <span>
            <span className="text-white">{totalNodes}</span> nodes
          </span>
          <span className="text-white/30">·</span>
          <span>
            <span className="text-lime">{liveNodes}</span> live
          </span>
          <span className="text-white/30">·</span>
          <span>
            <span className="text-white">3</span> orbits
          </span>
          <span className="ml-auto hidden md:inline-flex items-center gap-2 normal-case tracking-normal">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-60 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
              interactive
            </span>
            <span className="text-white/40">·</span>
            <span className="text-white/60">
              click any <span className="text-lime">orbit</span> or{' '}
              <span className="text-accent">node</span> to filter
            </span>
          </span>
        </div>

        {/* === Main SVG orbital system === */}
        <div className="relative aspect-[9/7] w-full overflow-hidden bg-[radial-gradient(ellipse_at_center,hsl(var(--background))_0%,#070812_60%,#030309_100%)]">
          {/* scanlines overlay */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none opacity-[0.04]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, rgba(255,255,255,.4) 0px, rgba(255,255,255,.4) 1px, transparent 1px, transparent 3px)',
            }}
          />

          <svg
            viewBox={`0 0 ${REACTOR_W} ${REACTOR_H}`}
            preserveAspectRatio="xMidYMid meet"
            className="absolute inset-0 w-full h-full"
          >
            <defs>
              <path
                id="orbit-frontend"
                d={`M ${REACTOR_CX - 130} ${REACTOR_CY} a 130 130 0 1 1 260 0 a 130 130 0 1 1 -260 0`}
              />
              <path
                id="orbit-backend"
                d={`M ${REACTOR_CX - 215} ${REACTOR_CY} a 215 215 0 1 1 430 0 a 215 215 0 1 1 -430 0`}
              />
              <path
                id="orbit-infra"
                d={`M ${REACTOR_CX - 300} ${REACTOR_CY} a 300 300 0 1 1 600 0 a 300 300 0 1 1 -600 0`}
              />

              <radialGradient id="core-gradient">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                <stop
                  offset="30%"
                  stopColor="hsl(var(--accent))"
                  stopOpacity="1"
                />
                <stop
                  offset="75%"
                  stopColor="hsl(var(--accent))"
                  stopOpacity="0.25"
                />
                <stop
                  offset="100%"
                  stopColor="hsl(var(--accent))"
                  stopOpacity="0"
                />
              </radialGradient>

              <radialGradient id="core-halo">
                <stop
                  offset="0%"
                  stopColor="hsl(var(--accent))"
                  stopOpacity="0.55"
                />
                <stop
                  offset="45%"
                  stopColor="hsl(var(--accent))"
                  stopOpacity="0.12"
                />
                <stop
                  offset="100%"
                  stopColor="hsl(var(--accent))"
                  stopOpacity="0"
                />
              </radialGradient>

              <linearGradient id="beam-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop
                  offset="0%"
                  stopColor="hsl(var(--accent))"
                  stopOpacity="0.45"
                />
                <stop
                  offset="60%"
                  stopColor="hsl(var(--accent))"
                  stopOpacity="0.08"
                />
                <stop
                  offset="100%"
                  stopColor="hsl(var(--accent))"
                  stopOpacity="0"
                />
              </linearGradient>

              {/* #node-glow filter was removed. A Gaussian blur applied to
                  54 tool dots + 12 particles + core was being re-rasterized
                  every tilt frame and pinning the main thread. The soft
                  outer ring under each dot already simulates a glow. */}
            </defs>

            {/* Star field — pointer-events skipped so hit-testing on
                mousemove doesn't walk 40 hidden elements */}
            <g pointerEvents="none">
              {stars.map((s) => (
                <circle
                  key={s.id}
                  cx={s.x}
                  cy={s.y}
                  r={s.r}
                  fill="#ffffff"
                  opacity="0.6"
                >
                  {!reduce && s.twinkle && (
                    <animate
                      attributeName="opacity"
                      values="0.15;0.9;0.15"
                      dur={`${s.dur}s`}
                      begin={`${s.delay}s`}
                      repeatCount="indefinite"
                    />
                  )}
                </circle>
              ))}
            </g>

            {/* Decorative concentric grid rings */}
            <g pointerEvents="none">
              {[70, 160, 245, 335].map((r) => (
                <circle
                  key={r}
                  cx={REACTOR_CX}
                  cy={REACTOR_CY}
                  r={r}
                  fill="none"
                  stroke="#ffffff"
                  strokeOpacity="0.045"
                  strokeWidth="1"
                  strokeDasharray="1 5"
                />
              ))}
            </g>

            {/* Faint energy spokes */}
            <g pointerEvents="none">
              {Array.from({ length: 24 }, (_, i) => {
                const a = (i / 24) * Math.PI * 2
                const x2 = REACTOR_CX + Math.cos(a) * 340
                const y2 = REACTOR_CY + Math.sin(a) * 340
                return (
                  <line
                    key={i}
                    x1={REACTOR_CX}
                    y1={REACTOR_CY}
                    x2={x2}
                    y2={y2}
                    stroke="#ffffff"
                    strokeOpacity="0.045"
                    strokeWidth="1"
                  />
                )
              })}
            </g>

            {/* Orbit rings (visual) */}
            {stacks.map((s) => {
              const R = radiusForStack(s.id)
              const tok = ACCENT_TOKEN[s.accent]
              const isDim = activeStack !== 'all' && activeStack !== s.id
              const isOrbitHover = hoverOrbit === s.id
              const dashDur =
                s.id === 'frontend' ? '18s' : s.id === 'backend' ? '24s' : '32s'
              const dashDir =
                s.id === 'backend' ? '-120' : '120'
              return (
                <g
                  key={s.id}
                  opacity={isDim ? 0.22 : 1}
                  pointerEvents="none"
                  style={{ transition: 'opacity 0.25s ease' }}
                >
                  {/* soft fat glow ring — brightens on hover */}
                  <circle
                    cx={REACTOR_CX}
                    cy={REACTOR_CY}
                    r={R}
                    fill="none"
                    stroke={`hsl(${tok.hsl} / ${isOrbitHover ? 0.3 : 0.14})`}
                    strokeWidth={isOrbitHover ? 24 : 16}
                    style={{ transition: 'all 0.2s ease' }}
                  />
                  {/* thin base ring */}
                  <circle
                    cx={REACTOR_CX}
                    cy={REACTOR_CY}
                    r={R}
                    fill="none"
                    stroke={`hsl(${tok.hsl} / ${isOrbitHover ? 0.7 : 0.35})`}
                    strokeWidth={isOrbitHover ? 1.5 : 1}
                    style={{ transition: 'all 0.2s ease' }}
                  />
                  {/* crisp dashed ring that scrolls */}
                  <circle
                    cx={REACTOR_CX}
                    cy={REACTOR_CY}
                    r={R}
                    fill="none"
                    stroke={`hsl(${tok.hsl} / ${isOrbitHover ? 1 : 0.9})`}
                    strokeWidth={isOrbitHover ? 1.8 : 1}
                    strokeDasharray="4 9"
                    style={{ transition: 'stroke-width 0.2s ease' }}
                  >
                    {!reduce && (
                      <animate
                        attributeName="stroke-dashoffset"
                        from="0"
                        to={dashDir}
                        dur={dashDur}
                        repeatCount="indefinite"
                      />
                    )}
                  </circle>
                </g>
              )
            })}

            {/* Orbit click targets — wide invisible strokes give each orbit a
                ~44px hit zone so users can click anywhere on the ring, not
                just the tiny dashed line. Rendered AFTER the visual rings so
                they capture pointer events. */}
            {stacks.map((s) => {
              const R = radiusForStack(s.id)
              return (
                <circle
                  key={`hit-${s.id}`}
                  cx={REACTOR_CX}
                  cy={REACTOR_CY}
                  r={R}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={44}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoverOrbit(s.id as FilterId)}
                  onMouseLeave={() => setHoverOrbit(null)}
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectStack(s.id as FilterId)
                  }}
                >
                  <title>Click to filter {s.title}</title>
                </circle>
              )
            })}

            {/* Data particles flowing along each orbit. Cut 4→2 per orbit
                (12→6 total), removed the blur filter that was recomputed per
                frame, and painted a cheap opacity halo behind each particle
                to preserve the glow feel. */}
            {!reduce &&
              stacks.map((s) => {
                const tok = ACCENT_TOKEN[s.accent]
                const count = 2
                const dur =
                  s.id === 'frontend' ? 9 : s.id === 'backend' ? 14 : 20
                return (
                  <g key={`particles-${s.id}`} pointerEvents="none">
                    {Array.from({ length: count }, (_, i) => (
                      <g key={i}>
                        {/* cheap static halo, travels with the particle */}
                        <circle
                          r="5"
                          fill={`hsl(${tok.hsl})`}
                          opacity="0.22"
                        >
                          <animateMotion
                            dur={`${dur}s`}
                            repeatCount="indefinite"
                            begin={`-${(i * dur) / count}s`}
                            rotate="auto"
                          >
                            <mpath href={`#orbit-${s.id}`} />
                          </animateMotion>
                        </circle>
                        <circle
                          r="2.4"
                          fill={`hsl(${tok.hsl})`}
                        >
                          <animateMotion
                            dur={`${dur}s`}
                            repeatCount="indefinite"
                            begin={`-${(i * dur) / count}s`}
                            rotate="auto"
                          >
                            <mpath href={`#orbit-${s.id}`} />
                          </animateMotion>
                        </circle>
                      </g>
                    ))}
                  </g>
                )
              })}

            {/* Radar sweep beam */}
            {!reduce && (
              <g pointerEvents="none">
                <g>
                  <polygon
                    points={`${REACTOR_CX},${REACTOR_CY} ${REACTOR_CX + 340},${REACTOR_CY - 70} ${REACTOR_CX + 340},${REACTOR_CY + 70}`}
                    fill="url(#beam-gradient)"
                    opacity="0.55"
                  />
                  <line
                    x1={REACTOR_CX}
                    y1={REACTOR_CY}
                    x2={REACTOR_CX + 340}
                    y2={REACTOR_CY}
                    stroke="hsl(var(--accent))"
                    strokeOpacity="0.85"
                    strokeWidth="1"
                  />
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from={`0 ${REACTOR_CX} ${REACTOR_CY}`}
                    to={`360 ${REACTOR_CX} ${REACTOR_CY}`}
                    dur="14s"
                    repeatCount="indefinite"
                  />
                </g>
              </g>
            )}

            {/* Expanding pulse waves from core */}
            {!reduce && (
              <g pointerEvents="none">
                {[0, 1.8, 3.6].map((delay, i) => (
                  <circle
                    key={i}
                    cx={REACTOR_CX}
                    cy={REACTOR_CY}
                    r="30"
                    fill="none"
                    stroke="hsl(var(--accent))"
                    strokeWidth="1.5"
                  >
                    <animate
                      attributeName="r"
                      from="30"
                      to="335"
                      dur="5.4s"
                      begin={`${delay}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      from="0.55"
                      to="0"
                      dur="5.4s"
                      begin={`${delay}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                ))}
              </g>
            )}

            {/* Ring labels at top — now interactive pills with hover state
                so it's obvious they filter the stack. */}
            {stacks.map((s) => {
              const R = radiusForStack(s.id)
              const tok = ACCENT_TOKEN[s.accent]
              const isDim = activeStack !== 'all' && activeStack !== s.id
              const isOrbitHover = hoverOrbit === s.id
              const isActive = activeStack === s.id
              const labelY = REACTOR_CY - R - 14
              const labelText = `◢ ${s.title.toUpperCase()}.ORBIT · R=${R}`
              // Estimate pill width from label length
              const pillW = labelText.length * 6 + 28
              const pillH = 20
              return (
                <g
                  key={`lbl-${s.id}`}
                  opacity={isDim ? 0.45 : 1}
                  onMouseEnter={() => setHoverOrbit(s.id as FilterId)}
                  onMouseLeave={() => setHoverOrbit(null)}
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectStack(s.id as FilterId)
                  }}
                  style={{ cursor: 'pointer', transition: 'opacity 0.2s ease' }}
                >
                  {/* pill background */}
                  <rect
                    x={REACTOR_CX - pillW / 2}
                    y={labelY - pillH / 2 - 2}
                    width={pillW}
                    height={pillH}
                    rx={10}
                    fill={
                      isOrbitHover || isActive
                        ? `hsl(${tok.hsl} / 0.22)`
                        : 'rgba(0,0,0,0.55)'
                    }
                    stroke={`hsl(${tok.hsl} / ${isOrbitHover || isActive ? 0.95 : 0.55})`}
                    strokeWidth={isOrbitHover || isActive ? 1.3 : 1}
                    style={{ transition: 'all 0.2s ease' }}
                  />
                  <text
                    x={REACTOR_CX}
                    y={labelY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                    fontSize="10"
                    letterSpacing="3"
                    fill={`hsl(${tok.hsl})`}
                    style={{ transition: 'all 0.2s ease' }}
                  >
                    {labelText}
                  </text>
                  {/* "click to filter" hint — appears on hover */}
                  {isOrbitHover && (
                    <text
                      x={REACTOR_CX}
                      y={labelY + 18}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                      fontSize="8"
                      letterSpacing="3"
                      fill={`hsl(${tok.hsl})`}
                      opacity="0.75"
                    >
                      ▸ CLICK TO FILTER
                    </text>
                  )}
                </g>
              )
            })}

            {/* Central core */}
            <g pointerEvents="none">
              <circle
                cx={REACTOR_CX}
                cy={REACTOR_CY}
                r="95"
                fill="url(#core-halo)"
              />
              <circle
                cx={REACTOR_CX}
                cy={REACTOR_CY}
                r="28"
                fill="url(#core-gradient)"
              >
                {!reduce && (
                  <animate
                    attributeName="r"
                    values="26;32;26"
                    dur="2.6s"
                    repeatCount="indefinite"
                  />
                )}
              </circle>
              <circle
                cx={REACTOR_CX}
                cy={REACTOR_CY}
                r="10"
                fill="#ffffff"
              >
                {!reduce && (
                  <animate
                    attributeName="opacity"
                    values="0.85;1;0.85"
                    dur="1.4s"
                    repeatCount="indefinite"
                  />
                )}
              </circle>
              <text
                x={REACTOR_CX}
                y={REACTOR_CY + 58}
                textAnchor="middle"
                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                fontSize="10.5"
                fill="#ffffff"
                opacity="0.55"
                letterSpacing="3"
              >
                FELIX.KERNEL
              </text>
              <text
                x={REACTOR_CX}
                y={REACTOR_CY + 72}
                textAnchor="middle"
                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                fontSize="8.5"
                fill="hsl(var(--accent))"
                opacity="0.7"
                letterSpacing="2.5"
              >
                10y · shipping
              </text>
            </g>

            {/* Tool nodes */}
            <g>
              {placedNodes.map((n, i) => {
                const tok = ACCENT_TOKEN[n.stack.accent]
                const yrs = n.years || 1
                const nr = 3.2 + Math.min(yrs / 11, 1) * 4.8
                const isDim =
                  activeStack !== 'all' && activeStack !== n.stack.id
                const isHovered =
                  hover?.name === n.name && hover?.stack.id === n.stack.id
                return (
                  <g
                    key={`${n.stack.id}-${n.name}-${i}`}
                    opacity={isDim ? 0.22 : 1}
                    onMouseEnter={() =>
                      setHover({
                        name: n.name,
                        years: yrs,
                        live: !!n.live,
                        note: n.note,
                        stack: n.stack,
                        x: n.x,
                        y: n.y,
                      })
                    }
                    onMouseLeave={() => setHover(null)}
                    onClick={() => onSelectStack(n.stack.id as FilterId)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Static "live" pip — replaces 21 per-node SMIL pulses
                        that were running concurrently (42 animate elements). */}
                    {n.live && (
                      <circle
                        cx={n.x + nr + 2.5}
                        cy={n.y - nr - 1}
                        r={1.6}
                        fill="hsl(var(--lime))"
                        opacity={isDim ? 0.3 : 0.95}
                      />
                    )}
                    {/* live pulse aura — now only on the hovered node */}
                    {n.live && !reduce && isHovered && (
                      <circle
                        cx={n.x}
                        cy={n.y}
                        r={nr + 2}
                        fill="none"
                        stroke={`hsl(${tok.hsl})`}
                        strokeWidth="1.2"
                        strokeOpacity="0.55"
                      >
                        <animate
                          attributeName="r"
                          from={nr + 2}
                          to={nr + 18}
                          dur="2.4s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="opacity"
                          from="0.8"
                          to="0"
                          dur="2.4s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}
                    {/* outer soft ring — now doubles as the glow so we can
                        drop the expensive Gaussian blur filter from 54 dots */}
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={nr + (isHovered ? 5 : 3)}
                      fill={`hsl(${tok.hsl} / ${isHovered ? 0.42 : 0.28})`}
                      style={{ transition: 'all 0.2s ease' }}
                    />
                    {/* main dot — filter removed; cost was ~54x Gaussian blur
                        re-rasterized every tilt frame. */}
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={isHovered ? nr * 1.35 : nr}
                      fill={`hsl(${tok.hsl})`}
                      style={{ transition: 'all 0.2s ease' }}
                    />
                    {/* highlight */}
                    <circle
                      cx={n.x - nr * 0.15}
                      cy={n.y - nr * 0.2}
                      r={nr * 0.42}
                      fill="#ffffff"
                      opacity={isHovered ? 1 : 0.85}
                    />
                    {/* hover tether line out to label */}
                    {isHovered && (
                      <line
                        x1={n.x}
                        y1={n.y}
                        x2={n.x + (n.x > REACTOR_CX ? 18 : -18)}
                        y2={n.y + (n.y > REACTOR_CY ? 14 : -14)}
                        stroke={`hsl(${tok.hsl})`}
                        strokeOpacity="0.9"
                        strokeWidth="1"
                      />
                    )}
                  </g>
                )
              })}
            </g>
          </svg>

          {/* Hover tooltip (HTML overlay, positioned via % of viewBox) */}
          <AnimatePresence>
            {hover && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.96 }}
                transition={{ duration: 0.12 }}
                className="pointer-events-none absolute z-20"
                style={{
                  left: `${(hover.x / REACTOR_W) * 100}%`,
                  top: `${(hover.y / REACTOR_H) * 100}%`,
                  transform:
                    hover.y < REACTOR_CY
                      ? 'translate(-50%, 14px)'
                      : 'translate(-50%, calc(-100% - 14px))',
                }}
              >
                <div
                  className="px-2.5 py-2 rounded-md bg-black/90 backdrop-blur-sm shadow-xl font-mono text-[10px] whitespace-nowrap text-white"
                  style={{
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: `hsl(${ACCENT_TOKEN[hover.stack.accent].hsl} / 0.55)`,
                    boxShadow: `0 10px 30px -12px hsl(${ACCENT_TOKEN[hover.stack.accent].hsl} / 0.55)`,
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-1 uppercase tracking-[0.18em] text-[9px] text-white/55">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor: `hsl(${ACCENT_TOKEN[hover.stack.accent].hsl})`,
                      }}
                    />
                    <span>{hover.stack.title}</span>
                    <span className="text-white/30">·</span>
                    <span>
                      R={radiusForStack(hover.stack.id)}
                    </span>
                  </div>
                  <div className="text-[12.5px] font-semibold text-white leading-tight mb-0.5">
                    {hover.name}
                  </div>
                  <div className="flex items-center gap-1.5 text-[9.5px] text-white/55 tracking-wide">
                    <span className="tabular-nums">{hover.years}y</span>
                    <span className="text-white/30">·</span>
                    <span
                      style={{
                        color: hover.live
                          ? 'hsl(var(--lime))'
                          : 'rgba(255,255,255,0.45)',
                      }}
                    >
                      {hover.live ? 'LIVE · running' : 'STANDBY'}
                    </span>
                    {hover.note && (
                      <>
                        <span className="text-white/30">·</span>
                        <span className="text-white/55">{hover.note}</span>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Corner HUD readouts */}
          <div className="pointer-events-none absolute top-3 left-3 font-mono text-[9px] tracking-[0.2em] uppercase text-white/40 leading-snug">
            <div className="flex items-center gap-1.5">
              <span className="text-lime">◉</span>
              <span>lat 13.7°N</span>
            </div>
            <div className="pl-[15px]">lng 100.5°E</div>
            <div className="pl-[15px] text-white/30">bkk · gmt+7</div>
          </div>
          <div className="pointer-events-none absolute top-3 right-3 text-right font-mono text-[9px] tracking-[0.2em] uppercase text-white/40 leading-snug">
            <div>reactor.core</div>
            <div className="text-white/70">
              stable <span className="text-lime">99.98%</span>
            </div>
            <div className="text-white/30">uptime 10y+</div>
          </div>
          {/* Prominent interaction hint — only shows while no filter is
              active so it disappears once the user has engaged. */}
          <AnimatePresence>
            {activeStack === 'all' && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.3 }}
                className="pointer-events-none absolute bottom-3 left-3 font-mono text-[10px] leading-snug"
              >
                <div
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-accent/60 bg-black/70 backdrop-blur-sm"
                  style={{
                    boxShadow: '0 0 18px -4px hsl(var(--accent) / 0.45)',
                  }}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-70 animate-ping" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                  </span>
                  <span className="uppercase tracking-[0.22em] text-accent text-[9.5px]">
                    tip
                  </span>
                  <span className="text-white/30">·</span>
                  <span className="text-white/75 tracking-wide">
                    click any{' '}
                    <span className="text-lime font-semibold">orbit ring</span>{' '}
                    or{' '}
                    <span className="text-accent font-semibold">node</span> to
                    filter
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="pointer-events-none absolute bottom-3 right-3 text-right font-mono text-[9px] tracking-[0.2em] uppercase text-white/40 leading-snug">
            <div>scanning...</div>
            <div className="tabular-nums text-white/70 text-[13px] leading-tight">
              0x
              {((totalNodes * 1247 + uptime * 11) & 0xffff)
                .toString(16)
                .padStart(4, '0')
                .toUpperCase()}
            </div>
          </div>
        </div>

        {/* === Orbit legend / quick-filter strip === */}
        <div className="flex items-center flex-wrap gap-x-1.5 gap-y-1 px-4 py-2.5 border-t border-white/10 bg-black/60 font-mono text-[10px] tracking-[0.18em] uppercase">
          {stacks.map((s) => {
            const tok = ACCENT_TOKEN[s.accent]
            const cnt = stackCount(s)
            const live = stackLive(s)
            const isActive = activeStack === s.id
            return (
              <button
                type="button"
                key={s.id}
                onClick={() => onSelectStack(s.id as FilterId)}
                className={`group flex items-center gap-2 px-2.5 py-1 rounded transition-colors ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: `hsl(${tok.hsl})` }}
                />
                <span>{s.id}.orbit</span>
                <span className="normal-case tracking-normal text-white/40 tabular-nums">
                  {cnt}·
                  <span style={{ color: `hsl(${tok.hsl})` }}>{live}</span>
                  <span className="text-white/40">live</span>
                </span>
              </button>
            )
          })}
          <span className="ml-auto flex items-center gap-2 text-[9.5px] text-white/35 normal-case tracking-normal">
            {activeStack !== 'all' ? (
              <button
                type="button"
                onClick={() => onSelectStack('all')}
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                <span>↺</span>
                <span>reset isolation</span>
              </button>
            ) : (
              <span>all orbits engaged</span>
            )}
          </span>
        </div>
      </motion.div>
    </motion.div>
  )
}

