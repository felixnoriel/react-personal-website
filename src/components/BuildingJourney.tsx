import { Link } from 'react-router-dom'
import { motion, useMotionValue, useMotionTemplate } from 'framer-motion'
import { useMemo, useState } from 'react'
import {
  MapPin,
  ArrowUpRight,
  Shield,
  BarChart3,
  Zap,
  Mail,
  Rocket,
  Target,
  Banknote,
  Smartphone,
  CreditCard,
  ShoppingCart,
  Code2,
  Cloud,
  Server,
  Users,
  Database,
  Wrench,
  Code,
  FileCode,
  CheckCircle,
  Layers,
  Bug,
  BookOpen,
  HelpCircle,
  GitCommit,
  type LucideIcon,
} from 'lucide-react'
import type { Career } from '@/types/data'
import { ScrambleText } from './ui/ScrambleText'

interface BuildingJourneyProps {
  experiences: Career[]
  showViewAllLink?: boolean
}

const iconMap: Record<string, LucideIcon> = {
  Shield, BarChart3, Zap, Mail, Rocket, Target, Banknote, Smartphone,
  CreditCard, ShoppingCart, Code2, Cloud, Server, Users, Database, Wrench,
  Code, FileCode, CheckCircle, Layers, Bug, BookOpen,
}

type CommitType = 'feat' | 'refactor' | 'perf' | 'build' | 'init'

interface Commit {
  exp: Career
  hash: string
  type: CommitType
  scope: string
  message: string
  achievements: NonNullable<Career['achievements']>
  techStack: string[]
  isHead: boolean
  isInit: boolean
}

const TYPE_TOKEN: Record<CommitType, { text: string; ring: string; bg: string; label: string }> = {
  feat: { text: 'text-lime', ring: 'ring-lime/50', bg: 'bg-lime/10', label: 'feat' },
  refactor: { text: 'text-accent', ring: 'ring-accent/50', bg: 'bg-accent/10', label: 'refactor' },
  perf: { text: 'text-electric', ring: 'ring-electric/50', bg: 'bg-electric/10', label: 'perf' },
  build: { text: 'text-amber', ring: 'ring-amber/50', bg: 'bg-amber/10', label: 'build' },
  init: { text: 'text-ink-soft', ring: 'ring-border', bg: 'bg-surface', label: 'init' },
}

// Deterministic 7-char hash from slug (djb2)
function hashFromSlug(slug: string): string {
  let h = 5381
  for (let i = 0; i < slug.length; i++) {
    h = ((h << 5) + h + slug.charCodeAt(i)) | 0
  }
  return (h >>> 0).toString(16).padStart(8, '0').slice(0, 7)
}

const commitMessageMap: Record<string, { type: CommitType; message: string }> = {
  stable: { type: 'feat', message: 'launch StablePay — USDT as everyday money' },
  genopets: { type: 'refactor', message: 'scale Web3 gaming platform to 150k MAU' },
  dashify: { type: 'feat', message: 'ship hospitality SaaS serving 20+ venues' },
  zookal: { type: 'perf', message: 'launch cross-platform homework help app' },
  'the-ceo-magazine': { type: 'build', message: 'architect publishing cloud stack on AWS' },
  'tech-pilot-fund': { type: 'build', message: 'maintain fintech web properties' },
  'kforce-global-solutions': { type: 'refactor', message: 'build scalable .NET customer solutions' },
  'iserve-customer-management-solutions': { type: 'feat', message: 'lead Java backend systems' },
  yondu: { type: 'init', message: 'kick off engineering career' },
}

function buildCommits(experiences: Career[]): Commit[] {
  return experiences.map((exp, index) => {
    const meta = commitMessageMap[exp.slug] || {
      type: 'feat' as CommitType,
      message: `${exp.jobTitle.toLowerCase()} at ${exp.title.toLowerCase()}`,
    }
    const scope = exp.slug.split('-')[0]
    return {
      exp,
      hash: hashFromSlug(exp.slug),
      type: meta.type,
      scope,
      message: meta.message,
      achievements: exp.achievements || [],
      techStack: exp.techStack || [],
      isHead: index === 0,
      isInit: index === experiences.length - 1,
    }
  })
}

export function BuildingJourney({ experiences, showViewAllLink = true }: BuildingJourneyProps) {
  const commits = useMemo(() => buildCommits(experiences), [experiences])
  const [filter, setFilter] = useState<'all' | CommitType>('all')
  const visibleCommits = filter === 'all' ? commits : commits.filter((c) => c.type === filter)

  const typeCounts = useMemo(() => ({
    all: commits.length,
    feat: commits.filter((c) => c.type === 'feat').length,
    refactor: commits.filter((c) => c.type === 'refactor').length,
    perf: commits.filter((c) => c.type === 'perf').length,
    build: commits.filter((c) => c.type === 'build').length,
    init: commits.filter((c) => c.type === 'init').length,
  }), [commits])

  return (
    <section
      id="career-section"
      className="relative py-28 md:py-36 bg-background scroll-mt-20 overflow-hidden"
    >
      <div
        aria-hidden
        className="absolute left-0 top-[20%] w-[30%] h-[50%] pointer-events-none opacity-70"
        style={{
          background:
            'radial-gradient(ellipse at left center, hsl(var(--electric) / 0.06), transparent 70%)',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--ink)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--ink)) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div className="container relative mx-auto px-6 max-w-6xl">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-16"
        >
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-ink-muted mb-4">
              <span className="font-mono">— Experience</span>
              <span className="font-mono normal-case text-[10px] text-ink-soft">[ 2014 → now ]</span>
            </div>
            <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tighter text-ink text-balance">
              A decade of{' '}
              <span className="italic font-extrabold text-accent">building with</span>{' '}
              small, sharp teams.
            </h2>
          </div>
          <p className="md:max-w-sm text-ink-muted leading-relaxed">
            Startups across gaming, hospitality, education, and publishing —
            these are the products and teams that shaped how I work.
          </p>
        </motion.div>

        {/* Terminal frame */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-t-2xl border border-border border-b-0 bg-ink text-background overflow-hidden shadow-[0_20px_60px_-30px_hsl(var(--ink)/0.5)]"
        >
          {/* Title bar */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
              <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
              <span className="w-3 h-3 rounded-full bg-[#28C840]" />
            </span>
            <span className="font-mono text-[11px] text-white/50 ml-2 hidden sm:inline">
              felix@dev — career — 87×29
            </span>
            <span className="ml-auto font-mono text-[11px] text-white/40 flex items-center gap-2">
              <span className="hidden md:inline">utf-8 · LF</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse" />
                main
              </span>
            </span>
          </div>

          {/* Prompt + filter pills */}
          <div className="px-4 md:px-5 py-3.5 flex flex-col md:flex-row md:items-center gap-3 font-mono text-[12.5px]">
            <div className="flex items-center gap-2 text-white/70 flex-wrap">
              <span className="text-lime">felix</span>
              <span className="text-white/40">@</span>
              <span className="text-accent">dev</span>
              <span className="text-white/40">:</span>
              <span className="text-electric">~/career</span>
              <span className="text-amber">(main)</span>
              <span className="text-white/40">$</span>
              <span className="text-white">git log --graph --career</span>
              <motion.span
                animate={{ opacity: [1, 1, 0, 0] }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear', times: [0, 0.5, 0.5, 1] }}
                className="inline-block w-1.5 h-[1em] bg-lime align-[-2px] ml-0.5"
              />
            </div>
            <div className="md:ml-auto flex flex-wrap items-center gap-1">
              {(['all', 'feat', 'refactor', 'perf', 'build'] as const).map((key) => (
                <FilterPill
                  key={key}
                  label={key === 'all' ? '--all' : key}
                  count={typeCounts[key]}
                  active={filter === key}
                  onClick={() => setFilter(key as 'all' | CommitType)}
                  type={key}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Git log */}
        <div className="rounded-b-2xl border border-border bg-background overflow-hidden">
          {visibleCommits.length === 0 ? (
            <div className="px-8 py-16 text-center font-mono text-sm text-ink-soft">
              <span className="text-ink-muted">no commits match filter{' '}</span>
              <span className="text-accent">{filter}</span>
            </div>
          ) : (
            visibleCommits.map((commit, index) => (
              <CommitRow
                key={commit.exp.slug}
                commit={commit}
                index={index}
                isFirst={index === 0}
                isLast={index === visibleCommits.length - 1}
              />
            ))
          )}
        </div>

        {/* Git status footer */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-mono text-[11px] text-ink-soft"
        >
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <span>
              <span className="text-ink-muted">commits:</span>{' '}
              <span className="text-accent tabular-nums">{visibleCommits.length}</span>
              <span className="text-ink-soft">/</span>
              <span className="tabular-nums">{commits.length}</span>
            </span>
            <span>
              <span className="text-ink-muted">span:</span>{' '}
              <span className="text-lime">13 years</span>
            </span>
            <span>
              <span className="text-ink-muted">branch:</span>{' '}
              <span className="text-electric">main</span>
            </span>
            <span>
              <span className="text-ink-muted">tracking:</span>{' '}
              <span className="text-amber">origin/main</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-lime opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-lime" />
            </span>
            <span>clean · up to date with origin/main</span>
          </div>
        </motion.div>

        {showViewAllLink && (
          <div className="mt-12 flex justify-center">
            <Link
              to="/career"
              className="group inline-flex items-center gap-2 h-11 px-6 rounded-full border border-ink/20 text-ink text-sm font-medium hover:border-ink hover:bg-ink hover:text-background transition-colors"
            >
              View full experience
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

function FilterPill({
  label,
  count,
  active,
  onClick,
  type,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
  type: CommitType | 'all'
}) {
  const activeText =
    type === 'all'
      ? 'text-ink'
      : type === 'feat'
      ? 'text-lime'
      : type === 'refactor'
      ? 'text-accent'
      : type === 'perf'
      ? 'text-electric'
      : 'text-amber'

  return (
    <button
      onClick={onClick}
      className={`relative px-2.5 py-1 rounded-md font-mono text-[11px] transition-colors ${
        active ? activeText : 'text-white/55 hover:text-white hover:bg-white/5'
      }`}
    >
      <span className="relative z-10">{label}</span>
      <span className={`relative z-10 ml-1 ${active ? 'text-ink/60' : 'text-white/35'}`}>
        {count}
      </span>
      {active && (
        <motion.span
          layoutId="career-filter-active"
          className="absolute inset-0 rounded-md bg-background shadow-[0_4px_20px_-6px_hsl(var(--background)/0.8)]"
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
        />
      )}
    </button>
  )
}

function CommitRow({
  commit,
  index,
  isFirst,
  isLast,
}: {
  commit: Commit
  index: number
  isFirst: boolean
  isLast: boolean
}) {
  const { exp, hash, type, scope, message, achievements, techStack, isHead, isInit } = commit
  const colors = TYPE_TOKEN[type]

  const mx = useMotionValue(50)
  const my = useMotionValue(50)
  const background = useMotionTemplate`radial-gradient(520px circle at ${mx}% ${my}%, hsl(var(--accent) / 0.07), transparent 45%)`

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.06, 0.6), ease: [0.22, 1, 0.36, 1] }}
      className={`relative ${!isLast ? 'border-b border-border' : ''}`}
      onMouseMove={(e) => {
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
        mx.set(((e.clientX - r.left) / r.width) * 100)
        my.set(((e.clientY - r.top) / r.height) * 100)
      }}
    >
      <Link
        to={exp.linkToProject ? `/projects/${exp.slug}` : `/career/${exp.slug}`}
        className="group relative block px-5 md:px-8 py-8 md:py-10 overflow-hidden"
      >
        {/* Hover spotlight */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background }}
        />
        {/* Active HEAD highlight bar */}
        {isHead && (
          <span
            aria-hidden
            className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-lime via-accent to-electric"
          />
        )}

        <div className="relative flex gap-5 md:gap-7">
          {/* Rail column */}
          <div className="relative w-10 shrink-0">
            {/* Top segment */}
            {!isFirst && (
              <span
                aria-hidden
                className="absolute left-1/2 -translate-x-1/2 top-0 h-6 w-[2px] bg-gradient-to-b from-transparent to-border"
              />
            )}
            {/* Commit node */}
            <div className="relative z-10 mt-6">
              <div
                className={`relative w-10 h-10 rounded-full ring-2 ${colors.ring} bg-surface border border-border flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-110`}
              >
                {exp.image?.url ? (
                  <div
                    className={`w-full h-full flex items-center justify-center ${
                      exp.image.url.endsWith('.svg')
                        ? 'bg-[hsl(79_58%_82%)] p-1'
                        : 'bg-surface p-1'
                    }`}
                  >
                    <img
                      src={exp.image.url}
                      alt={exp.title}
                      className="w-full h-full object-contain"
                      width={40}
                      height={40}
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <GitCommit className="w-4 h-4 text-ink-soft" />
                )}
              </div>
              {isHead && (
                <>
                  <span
                    aria-hidden
                    className="absolute inset-0 rounded-full ring-2 ring-lime/60 animate-ping opacity-50"
                  />
                  <span
                    aria-hidden
                    className="absolute -inset-1.5 rounded-full ring-1 ring-lime/20"
                  />
                </>
              )}
            </div>
            {/* Bottom segment */}
            {!isLast && (
              <span
                aria-hidden
                className="absolute left-1/2 -translate-x-1/2 top-[calc(1.5rem+2.5rem)] bottom-0 w-[2px] bg-border group-hover:bg-accent/30 transition-colors"
              />
            )}
          </div>

          {/* Commit body */}
          <div className="min-w-0 flex-1">
            {/* commit <hash> (HEAD → main, tag: v...) */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2 font-mono text-[11.5px] md:text-[12px] leading-snug">
              <span className="text-ink-soft">commit</span>
              <span className={`${colors.text} font-semibold`}>{hash}</span>
              {isHead && (
                <>
                  <span className="text-ink-soft">(</span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-electric/10 text-electric border border-electric/30">
                    HEAD
                  </span>
                  <span className="text-ink-soft">→</span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-lime/10 text-lime border border-lime/30">
                    main
                  </span>
                  <span className="text-ink-soft">,</span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber/10 text-amber border border-amber/30">
                    tag: v2025.12
                  </span>
                  <span className="text-ink-soft">)</span>
                  <span className="ml-auto inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-lime/10 text-lime border border-lime/30 text-[10px] tracking-[0.15em] uppercase">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-lime opacity-75 animate-ping" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lime" />
                    </span>
                    Live
                  </span>
                </>
              )}
              {isInit && (
                <>
                  <span className="text-ink-soft">(</span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface text-ink-soft border border-border">
                    root-commit
                  </span>
                  <span className="text-ink-soft">)</span>
                </>
              )}
            </div>

            {/* Author / Date / Location */}
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11.5px] font-mono text-ink-muted mb-5">
              <span>
                <span className="text-ink-soft">Author:</span>{' '}
                <span className="text-ink">Felix Noriel</span>
                <span className="text-ink-soft"> &lt;felix@noriel.dev&gt;</span>
              </span>
              <span>
                <span className="text-ink-soft">Date:</span>{' '}
                <span className="text-ink tabular-nums">
                  {exp.startDate} → {exp.endDate}
                </span>
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-ink-soft" />
                <span className="text-ink">{exp.location}</span>
              </span>
            </div>

            {/* Conventional commit: type(scope): message */}
            <div className="mb-4 font-mono text-[13.5px] md:text-[14px] leading-relaxed">
              <span className={`font-semibold ${colors.text}`}>{colors.label}</span>
              <span className="text-ink-soft">(</span>
              <span className="text-ink">{scope}</span>
              <span className="text-ink-soft">)</span>
              <span className="text-ink-soft">: </span>
              <span className="text-ink">{message}</span>
            </div>

            {/* Company / role headline */}
            <h3 className="font-display text-2xl md:text-3xl font-bold text-ink mb-5 tracking-tight group-hover:text-accent transition-colors">
              <ScrambleText text={exp.title} trigger="hover" />
              <span className="text-ink-soft font-medium"> · </span>
              <span className="text-ink-muted font-semibold text-xl md:text-2xl">{exp.jobTitle}</span>
            </h3>

            {/* Achievements — as a file diff */}
            {achievements.length > 0 && (
              <div className="mb-5 rounded-lg border border-border bg-surface/40 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-surface/60 font-mono text-[10.5px] text-ink-soft">
                  <span className="text-ink-muted">~/impact.md</span>
                  <span className="text-ink-soft">·</span>
                  <span>{achievements.length} notable items</span>
                  <span className="ml-auto flex items-center gap-1">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${colors.bg.replace('/10', '')} ring-1 ${colors.ring}`} />
                    <span className="hidden sm:inline">modified</span>
                  </span>
                </div>
                <ul className="divide-y divide-border/60">
                  {achievements.slice(0, 4).map((achievement, i) => {
                    const IconComponent = iconMap[achievement.icon] || HelpCircle
                    return (
                      <li
                        key={i}
                        className="flex items-start gap-3 px-3 py-2.5 hover:bg-background/70 transition-colors"
                      >
                        <span className={`font-mono text-[13px] ${colors.text} shrink-0 leading-5 w-3`}>▸</span>
                        <IconComponent className="w-3.5 h-3.5 text-ink-soft mt-1 shrink-0" />
                        <div className="flex-1 min-w-0 text-[13px]">
                          <div className="flex flex-wrap items-baseline gap-2">
                            <span className="text-ink font-medium">{achievement.title}</span>
                            {achievement.badge && (
                              <span className="inline-block font-mono text-[10px] text-ink-soft px-1.5 py-0.5 rounded border border-border bg-background">
                                {achievement.badge}
                              </span>
                            )}
                          </div>
                          <div className="text-ink-muted text-[12.5px] mt-0.5 leading-snug">
                            {achievement.description}
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {/* Tech stack — as package.json additions */}
            {techStack.length > 0 && (
              <div className="mb-5">
                <div className="font-mono text-[10.5px] text-ink-soft mb-1.5 flex items-center gap-2">
                  <span className="text-ink-muted">package.json</span>
                  <span>·</span>
                  <span className="text-lime">
                    +{techStack.length} {techStack.length === 1 ? 'dependency' : 'dependencies'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                  {techStack.slice(0, 10).map((tech) => (
                    <span
                      key={tech}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-border bg-lime/[0.04] hover:border-lime/40 hover:bg-lime/10 transition-colors"
                    >
                      <span className="text-lime font-semibold">+</span>
                      <span className="text-ink">{tech}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* CD footer */}
            <div className="inline-flex items-center gap-2 text-[12px] font-mono text-ink-muted group-hover:text-accent transition-colors">
              <span className="text-ink-soft">$</span>
              <span>cd ./{exp.slug}</span>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
