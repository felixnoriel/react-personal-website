import { Link } from 'react-router-dom'
import { ArrowUpRight, MapPin } from 'lucide-react'
import type { Career } from '../types/data'
import { ScrambleText } from './ui/ScrambleText'
import {
  FxWord,
  GlassPanel,
  HudDot,
  Reveal,
  SectionHeading,
  SectionShell,
  Tag,
} from './ui/section'
import { ACCENT, type Accent } from './ui/section-tokens'

// ============================================================
// BuildingJourney — "A decade of building with small, sharp teams."
//
// Rebuilt from a ~610-line git-commit-graph (vertical rail + nodes +
// branch/author/HEAD chrome + per-row file-diff achievements) into a
// clean timeline of glass cards. Keeps a light commit-flavored header
// nod; same real career data.
// ============================================================

interface BuildingJourneyProps {
  experiences: Career[]
  showViewAllLink?: boolean
}

const COMMIT_MESSAGES: Record<string, string> = {
  stable: 'launch StablePay — USDT as everyday money',
  genopets: 'scale Web3 gaming platform to 150k MAU',
  dashify: 'ship hospitality SaaS serving 20+ venues',
  zookal: 'launch cross-platform homework help app',
  'the-ceo-magazine': 'architect publishing cloud stack on AWS',
  'tech-pilot-fund': 'maintain fintech web properties',
  kforce: 'build scalable .NET customer solutions',
  iserve: 'lead Java backend systems',
  yondu: 'kick off engineering career',
}

function commitHash(slug: string): string {
  let h = 5381
  for (let i = 0; i < slug.length; i++) h = ((h << 5) + h + slug.charCodeAt(i)) | 0
  return (h >>> 0).toString(16).padStart(8, '0').slice(0, 7)
}

const CYCLE: Accent[] = ['accent', 'lime', 'electric', 'amber']

export function BuildingJourney({
  experiences,
  showViewAllLink = true,
}: BuildingJourneyProps) {
  return (
    <SectionShell id="career-section">
      <SectionHeading
        eyebrow="experience"
        meta="2014 → now"
        title={
          <>
            A decade of building with{' '}
            <FxWord className="italic font-extrabold">small, sharp teams.</FxWord>
          </>
        }
        intro="Startups across gaming, hospitality, education, and publishing — the products and teams that shaped how I work."
      />

      <div className="mt-12 space-y-5">
        {experiences.map((exp, i) => (
          <Reveal key={exp.slug} delay={i * 0.05}>
            <CareerCard exp={exp} accent={CYCLE[i % CYCLE.length]} isCurrent={i === 0} />
          </Reveal>
        ))}
      </div>

      {showViewAllLink && (
        <div className="mt-8">
          <Link
            to="/career"
            className="group inline-flex items-center gap-2 font-mono text-sm text-ink hover:text-accent transition-colors"
          >
            <span className="text-accent">$</span> cd ./full-experience
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      )}
    </SectionShell>
  )
}

function CareerCard({
  exp,
  accent,
  isCurrent,
}: {
  exp: Career
  accent: Accent
  isCurrent: boolean
}) {
  const a = ACCENT[accent]
  const msg = COMMIT_MESSAGES[exp.slug] || `build ${exp.title.toLowerCase()}`
  const achievements = exp.achievements?.slice(0, 3) ?? []
  const tech = exp.techStack?.slice(0, 8) ?? []

  return (
    <GlassPanel accent={accent} className="p-5 md:p-6">
      {/* light commit-flavored header */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] mb-3">
        <span className={a.text}>● {commitHash(exp.slug)}</span>
        <span className="text-ink-muted">{msg}</span>
        {isCurrent && (
          <span className="ml-auto inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-lime/10 text-lime border border-lime/30 text-[10px] uppercase tracking-[0.15em]">
            <HudDot accent="lime" />
            live
          </span>
        )}
      </div>

      {/* company / role */}
      <h3 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-ink">
        <ScrambleText text={exp.title} trigger="hover" />
        <span className="text-ink-soft font-medium"> · </span>
        <span className="text-ink-muted font-semibold text-lg md:text-xl">
          {exp.jobTitle}
        </span>
      </h3>

      {/* meta */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 font-mono text-[12px] text-ink-muted">
        <span className="tabular-nums">
          {exp.startDate} → {exp.endDate}
        </span>
        <span className="inline-flex items-center gap-1">
          <MapPin className="w-3 h-3 text-ink-soft" />
          {exp.location}
        </span>
      </div>

      {/* achievements */}
      {achievements.length > 0 && (
        <ul className="mt-4 space-y-2.5">
          {achievements.map((ach, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[13.5px]">
              <span className={`${a.text} mt-0.5 shrink-0 font-mono`}>▸</span>
              <span className="flex-1 min-w-0">
                <span className="flex flex-wrap items-baseline gap-2">
                  <span className="text-ink font-medium">{ach.title}</span>
                  {ach.badge && (
                    <span
                      className={`inline-block font-mono text-[10px] px-2 py-0.5 rounded-full border ${a.border} ${a.soft} ${a.text}`}
                    >
                      {ach.badge}
                    </span>
                  )}
                </span>
                {ach.description && (
                  <span className="block text-ink-muted text-[12.5px] mt-0.5 leading-snug">
                    {ach.description}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* tech */}
      {tech.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {tech.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
      )}
    </GlassPanel>
  )
}
