import { Link } from 'react-router-dom'
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion'
import {
  ArrowUpRight,
  Code2,
  Cpu,
  GitCommit,
  Layers,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useRef } from 'react'
import type { Project, Tag } from '../types/data'
import { trackProjectView, trackButtonClick } from '../utils/analytics'
import { ScrambleText } from './ui/ScrambleText'
import { AnimatedNumber } from './ui/AnimatedNumber'
import { TiltCard } from './ui/TiltCard'
import { StablePayBanner } from './ui/StablePayBanner'

interface ProductsBuiltProps {
  projects: Project[]
  showViewAllLink?: boolean
}

type Accent = 'accent' | 'lime' | 'electric'

type AnimatedStat = {
  label: string
  value: number
  icon: LucideIcon
  suffix?: string
  accent: Accent
}

const ACCENT_CLS: Record<Accent, { text: string; bg: string; dot: string; bar: string; ring: string }> = {
  accent: {
    text: 'text-accent',
    bg: 'bg-accent/10',
    dot: 'bg-accent',
    bar: 'bg-accent',
    ring: 'ring-accent/30',
  },
  lime: {
    text: 'text-lime',
    bg: 'bg-lime/15',
    dot: 'bg-lime',
    bar: 'bg-lime',
    ring: 'ring-lime/30',
  },
  electric: {
    text: 'text-electric',
    bg: 'bg-electric/10',
    dot: 'bg-electric',
    bar: 'bg-electric',
    ring: 'ring-electric/30',
  },
}

// djb2 hash → stable 7-char commit ID per slug
function commitHash(slug: string): string {
  let hash = 5381
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) + hash + slug.charCodeAt(i)) | 0
  }
  const hex = (hash >>> 0).toString(16).padStart(8, '0')
  return hex.slice(0, 7)
}

// Derive a conventional-commit style message per project
function commitMessage(project: Project): string {
  const map: Record<string, string> = {
    stable: 'feat(stablepay): USDT as everyday money',
    genopets: 'feat(genopets): web3 gaming platform · 150k MAU',
    dashify: 'feat(dashify): hospitality SaaS for hotels',
    zookal: 'feat(zookal): textbook marketplace, 360k+ users',
    'the-ceo-magazine-website': 'feat(ceo-mag): headless CMS publishing',
    'the-ceo-magazine-intranet': 'feat(ceo-mag): internal ops platform',
    'the-ceo-magazine-shop': 'feat(ceo-mag): commerce + subscriptions',
    'dot-acs': 'feat(dot-acs): access-control system',
    'health-maintenance-system': 'feat(hms): hospital scheduling & records',
  }
  return map[project.slug] || `feat(${project.slug}): ${project.title.toLowerCase()}`
}

const transformProject = (
  project: Project,
): Project & { stats?: AnimatedStat[] } => {
  if (project.slug === 'stable') {
    return { ...project, title: 'StablePay' }
  } else if (project.slug === 'genopets') {
    return {
      ...project,
      title: 'Genopets Gaming Platform',
      stats: [
        { label: 'MAU', value: 150, icon: Users, suffix: 'k', accent: 'accent' },
        { label: 'msgs/day', value: 7.5, icon: Zap, suffix: 'M', accent: 'lime' },
        { label: 'faster', value: 80, icon: TrendingUp, suffix: '%', accent: 'electric' },
      ],
    }
  } else if (project.slug === 'dashify') {
    return {
      ...project,
      title: 'Dashify Hospitality Platform',
      stats: [
        { label: 'venues', value: 20, icon: Users, suffix: '+', accent: 'accent' },
        { label: 'MAU', value: 5, icon: Zap, suffix: 'k', accent: 'lime' },
        { label: 'cost savings', value: 75, icon: TrendingUp, suffix: '%', accent: 'electric' },
      ],
    }
  }

  if (
    project.title.toLowerCase().includes('zookal') ||
    project.slug === 'the-ceo-magazine-website'
  ) {
    return {
      ...project,
      title:
        project.slug === 'the-ceo-magazine-website'
          ? 'The CEO Magazine Website'
          : project.title,
    }
  }

  return project
}

export function ProductsBuilt({
  projects,
  showViewAllLink = true,
}: ProductsBuiltProps) {
  const displayProjects = projects.map(transformProject)
  const total = displayProjects.length

  return (
    <section
      id="projects-section"
      className="relative py-28 md:py-36 bg-surface scroll-mt-20 border-y border-border overflow-hidden"
    >
      <div
        aria-hidden
        className="absolute right-0 top-0 w-[35%] h-[60%] pointer-events-none opacity-70"
        style={{
          background:
            'radial-gradient(ellipse at top right, hsl(var(--accent) / 0.06), transparent 70%)',
        }}
      />
      <div
        aria-hidden
        className="absolute left-0 bottom-0 w-[40%] h-[50%] pointer-events-none opacity-50"
        style={{
          background:
            'radial-gradient(ellipse at bottom left, hsl(var(--lime) / 0.07), transparent 70%)',
        }}
      />

      <div className="container relative mx-auto px-6 max-w-6xl">
        {/* ===================== HEADING ===================== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-12"
        >
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs tracking-[0.2em] uppercase text-ink-muted mb-4">
              <span className="font-mono">— Selected Work</span>
              <span className="font-mono normal-case text-[10px] text-ink-soft">
                ./projects <span className="text-accent">--featured</span>
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono normal-case text-[10px] text-ink-soft">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-lime opacity-75 animate-ping" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lime" />
                </span>
                <span className="text-ink">{total}</span> deployments
              </span>
            </div>
            <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tighter text-ink text-balance">
              Products I&apos;ve{' '}
              <span className="italic font-extrabold text-accent">shipped</span>{' '}
              and scaled.
            </h2>
          </div>
          <p className="md:max-w-sm text-ink-muted leading-relaxed">
            From Web3 gaming to hospitality SaaS — a handful of the products
            that define the last few years of my work.
          </p>
        </motion.div>

        {/* ===================== GIT LOG STRIP ===================== */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-10 rounded-xl border border-border bg-background overflow-hidden shadow-[0_12px_32px_-18px_hsl(var(--ink)/0.3)]"
        >
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-ink text-background">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
            </span>
            <span className="font-mono text-[10.5px] text-white/70 ml-2">
              ~/projects · git log --oneline --graph
            </span>
            <span className="ml-auto font-mono text-[10px] text-white/50 hidden md:inline">
              {total} commits · branch: <span className="text-lime">main</span>
            </span>
          </div>
          <div className="px-4 py-3 font-mono text-[11.5px] md:text-[12px] leading-[1.8] text-ink-muted">
            {displayProjects.slice(0, 4).map((p, i) => (
              <div key={p.slug} className="flex flex-wrap items-baseline gap-2">
                <span className="text-lime select-none">*</span>
                <span className="text-accent tabular-nums">
                  {commitHash(p.slug)}
                </span>
                {i === 0 && (
                  <span className="text-[9.5px] px-1.5 rounded-sm bg-lime/15 text-lime uppercase tracking-wider">
                    HEAD → main
                  </span>
                )}
                <span className="text-ink-soft">·</span>
                <span className="text-ink truncate">{commitMessage(p)}</span>
              </div>
            ))}
            {displayProjects.length > 4 && (
              <div className="flex items-baseline gap-2 text-ink-soft">
                <span className="text-lime select-none">*</span>
                <span className="tabular-nums">… {displayProjects.length - 4} more commits</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* ===================== DEPLOYMENT CARDS ===================== */}
        <div className="relative space-y-6 md:space-y-10">
          {/* vertical rail connector on desktop */}
          <span
            aria-hidden
            className="hidden lg:block absolute left-[-38px] top-6 bottom-6 w-px bg-gradient-to-b from-transparent via-border to-transparent"
          />

          {displayProjects.map((project, index) => (
            <DeployCard
              key={project.slug}
              project={project}
              index={index}
              total={total}
            />
          ))}
        </div>

        {showViewAllLink && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-16 flex justify-center"
          >
            <Link
              to="/projects"
              onClick={() => trackButtonClick('View All Projects', 'ProductsBuilt')}
              className="group relative inline-flex items-center gap-2 h-12 px-6 rounded-full border border-ink/20 text-ink text-sm font-medium hover:border-ink hover:bg-ink hover:text-background transition-colors overflow-hidden"
            >
              <span className="relative z-10 font-mono text-[11px] text-ink-soft group-hover:text-background/70 transition-colors">
                $
              </span>
              <span className="relative z-10">cd ./all-projects</span>
              <ArrowUpRight className="w-4 h-4 relative z-10 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  )
}

// ============================================================
// DeployCard — single project rendered as a deployment frame
// ============================================================

function DeployCard({
  project,
  index,
  total,
}: {
  project: Project & { stats?: AnimatedStat[] }
  index: number
  total: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const spot = useMotionTemplate`radial-gradient(500px circle at ${mx}% ${my}%, hsl(var(--accent) / 0.08), transparent 55%)`
  const num = (index + 1).toString().padStart(2, '0')
  const totalStr = total.toString().padStart(2, '0')
  const isFirst = index === 0
  const hash = commitHash(project.slug)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.06 }}
      className="relative"
    >
      {/* commit node on the rail (desktop only) */}
      <span
        aria-hidden
        className="hidden lg:flex absolute left-[-44px] top-8 z-10"
      >
        <span
          className={`relative flex items-center justify-center w-3.5 h-3.5 rounded-full bg-background ring-2 ${
            isFirst ? 'ring-accent' : 'ring-border'
          }`}
        >
          <span
            className={`absolute inset-0 rounded-full ${
              isFirst ? 'bg-accent' : 'bg-ink-soft'
            } opacity-50 animate-ping`}
          />
          <span
            className={`relative w-1.5 h-1.5 rounded-full ${
              isFirst ? 'bg-accent' : 'bg-ink'
            }`}
          />
        </span>
      </span>

      {/* DEPLOYMENT banner */}
      <div className="flex items-center gap-3 mb-2.5 px-1 font-mono text-[10px] tracking-[0.25em] uppercase text-ink-soft">
        <span className="flex items-center gap-1.5">
          <GitCommit className="w-3 h-3 text-accent" />
          <span className="text-ink">deployment</span>
          <span className="text-accent tabular-nums">{num}</span>
          <span className="text-ink-soft">/</span>
          <span className="text-ink-soft tabular-nums">{totalStr}</span>
        </span>
        <span
          aria-hidden
          className="flex-1 h-px bg-gradient-to-r from-border via-border to-transparent"
        />
        <span className="hidden md:inline text-accent tabular-nums">#{hash}</span>
        <span className="hidden md:inline text-ink-soft">·</span>
        <span className="hidden md:inline text-lime">
          ● {isFirst ? 'head / main' : 'shipped'}
        </span>
      </div>

      <TiltCard tiltStrength={3} spotlightSize={600} spotlightOpacity={0.08}>
        <Link
          to={`/projects/${project.slug}`}
          onClick={() => trackProjectView(project.title)}
          className="group relative block overflow-hidden rounded-3xl border border-border bg-background hover:border-ink/30 transition-all hover:shadow-[0_30px_80px_-30px_hsl(var(--accent)/0.28)]"
        >
          {/* animated top accent bar */}
          <span
            aria-hidden
            className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent via-amber to-electric opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          />
          {/* subtle mouse-tracked spotlight overlay */}
          <motion.span
            aria-hidden
            ref={ref as unknown as React.Ref<HTMLSpanElement>}
            onMouseMove={(e) => {
              const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
              mx.set(((e.clientX - r.left) / r.width) * 100)
              my.set(((e.clientY - r.top) / r.height) * 100)
            }}
            style={{ background: spot }}
            className="absolute inset-0 pointer-events-none"
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            {/* ================ IMAGE SIDE ================ */}
            <div className="lg:col-span-7 relative aspect-[4/3] lg:aspect-auto overflow-hidden bg-surface order-last lg:order-first">
              {project.slug === 'stable' ? (
                <StablePayBanner />
              ) : project.image?.url ? (
                project.image.url.endsWith('.svg') ? (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[hsl(79_58%_85%)] via-[hsl(79_48%_75%)] to-[hsl(79_42%_65%)] p-12 md:p-16 group-hover:scale-[1.02] transition-transform duration-700">
                    <img
                      src={project.image.url}
                      alt={project.title}
                      loading="lazy"
                      className="max-w-[70%] max-h-[60%] w-auto h-auto object-contain"
                    />
                  </div>
                ) : project.image.height &&
                  project.image.width &&
                  project.image.height > project.image.width ? (
                  <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-ink via-plum to-accent/40 p-8 md:p-12 overflow-hidden">
                    <div
                      aria-hidden
                      className="absolute inset-0 opacity-30"
                      style={{
                        background:
                          'radial-gradient(ellipse at top, hsl(var(--lime) / 0.3), transparent 60%)',
                      }}
                    />
                    <img
                      src={project.image.url}
                      alt={project.title}
                      width={project.image.width}
                      height={project.image.height}
                      loading="lazy"
                      className="relative max-h-[88%] w-auto h-auto object-contain drop-shadow-2xl group-hover:scale-[1.03] transition-transform duration-700"
                    />
                  </div>
                ) : (
                  <img
                    src={project.image.url}
                    alt={project.title}
                    width={800}
                    height={600}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                  />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center text-ink-soft">
                  <Code2 className="w-10 h-10" />
                </div>
              )}

              {/* scan lines overlay */}
              <div
                aria-hidden
                className="absolute inset-0 bg-scanlines opacity-[0.18] pointer-events-none mix-blend-multiply"
              />

              {/* corner HUD brackets */}
              <HudCorners />

              {/* company logo badge */}
              <div
                className={`absolute top-5 left-5 w-16 h-16 md:w-20 md:h-20 rounded-2xl backdrop-blur border border-border flex items-center justify-center overflow-hidden shadow-md ${
                  project.company?.image?.url?.endsWith('.svg')
                    ? 'bg-[hsl(79_58%_82%)]'
                    : 'bg-background/95'
                }`}
              >
                {project.company?.image?.url ? (
                  <img
                    src={project.company.image.url}
                    alt={project.company.title}
                    width={80}
                    height={80}
                    loading="lazy"
                    className="w-full h-full object-contain p-3"
                  />
                ) : (
                  <span className="text-2xl">⚡</span>
                )}
              </div>

              {/* top-right LIVE badge */}
              <div className="absolute top-5 right-5 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/90 backdrop-blur border border-border text-[10px] tracking-widest uppercase text-ink font-mono">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-lime opacity-75 animate-ping" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lime" />
                  </span>
                  Live
                </span>
              </div>

              {/* bottom overlay meta strip */}
              <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 px-4 py-2 bg-gradient-to-t from-ink/70 via-ink/40 to-transparent text-white font-mono text-[10px] tracking-[0.15em] uppercase">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-lime" />
                  <span className="tabular-nums">
                    {project.tags?.length ?? 0}
                  </span>
                  <span className="text-white/60">stack</span>
                </span>
                <span className="text-white/30">·</span>
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-3 h-3 text-accent" />
                  <span className="text-white/60">build</span>
                  <span className="tabular-nums">#{hash}</span>
                </span>
                <span className="ml-auto hidden md:inline text-white/50">
                  {project.company?.title || 'felix.dev'}
                </span>
              </div>
            </div>

            {/* ================ CONTENT SIDE ================ */}
            <div className="lg:col-span-5 p-8 md:p-10 lg:p-12 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-border bg-gradient-to-b from-background to-surface/30 relative">
              {/* Slug path + big number */}
              <div>
                <div className="flex items-center justify-between mb-5">
                  <span className="font-mono text-[11px] text-ink-soft">
                    ~/projects/
                    <span className="text-ink">{project.slug}</span>
                  </span>
                  <span
                    aria-hidden
                    className="font-display text-5xl md:text-6xl font-black text-ink/10 leading-none tracking-tighter select-none group-hover:text-accent/30 transition-colors"
                  >
                    {num}
                  </span>
                </div>

                <h3 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink mb-4 group-hover:text-accent transition-colors">
                  <ScrambleText text={project.title} trigger="hover" />
                </h3>

                <div
                  className="text-ink-muted mb-7 leading-relaxed text-[15px]"
                  dangerouslySetInnerHTML={{
                    __html:
                      project.excerpt ||
                      project.content.substring(0, 150) + '...',
                  }}
                />

                {/* Animated stats (if present) */}
                {project.stats && (
                  <div className="grid grid-cols-3 gap-3 mb-7 pb-7 border-b border-border">
                    {project.stats.map((stat, i) => {
                      const cls = ACCENT_CLS[stat.accent]
                      const Icon = stat.icon
                      return (
                        <div key={i} className="relative">
                          <div className="flex items-center gap-1.5 text-[9.5px] font-mono tracking-[0.15em] uppercase text-ink-soft mb-1.5">
                            <Icon className={`w-3 h-3 ${cls.text}`} />
                            <span>{stat.label}</span>
                          </div>
                          <div className="font-display text-2xl font-bold text-ink tracking-tighter leading-none">
                            <AnimatedNumber
                              value={stat.value}
                              suffix={stat.suffix}
                              decimals={stat.value % 1 !== 0 ? 1 : 0}
                            />
                            <span className={`ml-0.5 ${cls.text}`}>.</span>
                          </div>
                          <div className="mt-2 h-[2px] rounded-full bg-border overflow-hidden">
                            <motion.span
                              className={`block h-full ${cls.bar}`}
                              initial={{ width: 0 }}
                              whileInView={{ width: '85%' }}
                              viewport={{ once: true }}
                              transition={{
                                duration: 1.1,
                                delay: 0.3 + i * 0.12,
                                ease: [0.22, 1, 0.36, 1],
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Tags — terminal chips */}
                {project.tags && project.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-8 font-mono text-[10.5px]">
                    {project.tags.slice(0, 8).map((tag: Tag) => (
                      <span
                        key={tag.slug}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-sm border border-border bg-surface/60 text-ink-muted hover:text-ink hover:border-accent/40 transition-colors"
                      >
                        <span className="text-accent">+</span>
                        {tag.name}
                      </span>
                    ))}
                    {project.tags.length > 8 && (
                      <span className="inline-flex items-center px-2 py-1 text-ink-soft">
                        +{project.tags.length - 8} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* CTA — terminal prompt style */}
              <div className="flex items-center justify-between pt-4 border-t border-border/60">
                <div className="inline-flex items-center gap-2 font-mono text-[12.5px] text-ink-soft">
                  <span className="text-lime">$</span>
                  <span className="group-hover:text-ink transition-colors">
                    cat ./case-study.md
                  </span>
                  <span
                    aria-hidden
                    className="w-1.5 h-3 bg-ink animate-blink opacity-60"
                  />
                </div>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink group-hover:text-accent transition-colors">
                  Read
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </span>
              </div>
            </div>
          </div>
        </Link>
      </TiltCard>
    </motion.div>
  )
}

// ============================================================
// HudCorners — 4 L-shaped SVG corner brackets
// ============================================================

function HudCorners() {
  const brackets: Array<{ className: string; d: string }> = [
    { className: 'top-2 left-2', d: 'M 2 12 L 2 2 L 12 2' },
    { className: 'top-2 right-2', d: 'M 4 2 L 14 2 L 14 12' },
    { className: 'bottom-2 left-2', d: 'M 2 4 L 2 14 L 12 14' },
    { className: 'bottom-2 right-2', d: 'M 4 14 L 14 14 L 14 4' },
  ]
  return (
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
    >
      {brackets.map((b, i) => (
        <svg
          key={i}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          className={`absolute ${b.className} text-lime`}
        >
          <path
            d={b.d}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      ))}
    </div>
  )
}
