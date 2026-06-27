import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  Code2,
  GitCommit,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Project } from '../types/data'
import { ScrambleText } from './ui/ScrambleText'
import { AnimatedNumber } from './ui/AnimatedNumber'
import { StablePayBanner } from './ui/StablePayBanner'
import { trackProjectView } from '../utils/analytics'
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
// ProductsBuilt — "Products I've shipped and scaled."
//
// Rebuilt from ~645 lines (deployment ticker rails, tilt cards, mouse
// spotlights, HUD corner brackets, scanline overlays) into clean glass
// project cards. Same data, same title overrides + injected scale
// stats, same /projects/:slug links.
// ============================================================

interface ProductsBuiltProps {
  projects: Project[]
  showViewAllLink?: boolean
}

type AnimatedStat = {
  label: string
  value: number
  icon: LucideIcon
  suffix: string
  accent: Accent
}

function commitHash(slug: string): string {
  let h = 5381
  for (let i = 0; i < slug.length; i++) h = ((h << 5) + h + slug.charCodeAt(i)) | 0
  return (h >>> 0).toString(16).padStart(8, '0').slice(0, 7)
}

// Title overrides + injected scale stats (hard-coded, as before).
const transformProject = (
  project: Project,
): Project & { stats?: AnimatedStat[] } => {
  if (project.slug === 'stable') return { ...project, title: 'StablePay' }
  if (project.slug === 'genopets') {
    return {
      ...project,
      title: 'Genopets Gaming Platform',
      stats: [
        { label: 'MAU', value: 150, icon: Users, suffix: 'k', accent: 'accent' },
        { label: 'msgs/day', value: 7.5, icon: Zap, suffix: 'M', accent: 'lime' },
        { label: 'faster', value: 80, icon: TrendingUp, suffix: '%', accent: 'electric' },
      ],
    }
  }
  if (project.slug === 'dashify') {
    return {
      ...project,
      title: 'Dashify Hospitality Platform',
      stats: [
        { label: 'venues', value: 20, icon: Users, suffix: '+', accent: 'accent' },
        { label: 'MAU', value: 5, icon: Zap, suffix: 'k', accent: 'lime' },
        { label: 'cost saved', value: 75, icon: TrendingUp, suffix: '%', accent: 'electric' },
      ],
    }
  }
  return project
}

export function ProductsBuilt({
  projects,
  showViewAllLink = true,
}: ProductsBuiltProps) {
  const transformed = projects.map(transformProject)

  return (
    <SectionShell id="projects-section">
      <SectionHeading
        eyebrow="selected work"
        meta={
          <span className="inline-flex items-center gap-2">
            <HudDot accent="lime" />
            {projects.length} deployments
          </span>
        }
        title={
          <>
            Products I've{' '}
            <FxWord className="italic font-extrabold">shipped and scaled.</FxWord>
          </>
        }
        intro="From Web3 gaming to hospitality SaaS — a handful of the products that define the last few years of my work."
      />

      <div className="mt-12 space-y-6">
        {transformed.map((project, i) => (
          <Reveal key={project.slug} delay={i * 0.05}>
            <ProjectCard project={project} index={i} />
          </Reveal>
        ))}
      </div>

      {showViewAllLink && (
        <div className="mt-8">
          <Link
            to="/projects"
            className="group inline-flex items-center gap-2 font-mono text-sm text-ink hover:text-accent transition-colors"
          >
            <span className="text-accent">$</span> cd ./all-projects
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      )}
    </SectionShell>
  )
}

function ProjectImage({ project }: { project: Project }) {
  if (project.slug === 'stable') return <StablePayBanner />

  if (!project.image?.url) {
    return (
      <div className="w-full h-full flex items-center justify-center text-ink-soft">
        <Code2 className="w-10 h-10" />
      </div>
    )
  }

  const isSvg = project.image.url.endsWith('.svg')
  const isPortrait =
    !!project.image.height &&
    !!project.image.width &&
    project.image.height > project.image.width

  if (isSvg) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[hsl(79_58%_85%)] via-[hsl(79_48%_75%)] to-[hsl(79_42%_65%)] p-10 group-hover:scale-[1.02] transition-transform duration-700">
        <img
          src={project.image.url}
          alt={project.title}
          loading="lazy"
          className="max-w-[70%] max-h-[60%] w-auto h-auto object-contain"
        />
      </div>
    )
  }

  if (isPortrait) {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-ink via-plum to-accent/40 p-8 overflow-hidden">
        <img
          src={project.image.url}
          alt={project.title}
          width={project.image.width}
          height={project.image.height}
          loading="lazy"
          className="relative max-h-[90%] w-auto h-auto object-contain drop-shadow-2xl group-hover:scale-[1.03] transition-transform duration-700"
        />
      </div>
    )
  }

  return (
    <img
      src={project.image.url}
      alt={project.title}
      width={800}
      height={600}
      loading="lazy"
      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
    />
  )
}

function ProjectCard({
  project,
  index,
}: {
  project: Project & { stats?: AnimatedStat[] }
  index: number
}) {
  const isFirst = index === 0
  const tags = project.tags?.slice(0, 8) ?? []
  const imageLeft = index % 2 === 0

  return (
    <GlassPanel className="overflow-hidden">
      <Link
        to={`/projects/${project.slug}`}
        onClick={() => trackProjectView(project.title)}
        className="group grid grid-cols-1 lg:grid-cols-2 items-stretch"
      >
        {/* image */}
        <div
          className={`relative aspect-[16/10] lg:aspect-auto lg:min-h-[360px] overflow-hidden bg-surface ${
            imageLeft ? '' : 'lg:order-last'
          }`}
        >
          <ProjectImage project={project} />
          {/* company badge */}
          {project.company?.image?.url && (
            <div
              className={`absolute top-4 left-4 w-14 h-14 rounded-xl backdrop-blur border border-border/60 flex items-center justify-center overflow-hidden shadow-md ${
                project.company.image.url.endsWith('.svg')
                  ? 'bg-[hsl(79_58%_82%)]'
                  : 'bg-background/95'
              }`}
            >
              <img
                src={project.company.image.url}
                alt={project.company.title}
                loading="lazy"
                className="w-full h-full object-contain p-2"
              />
            </div>
          )}
        </div>

        {/* content */}
        <div className="p-6 md:p-8 flex flex-col">
          <div className="flex items-center gap-2.5 mb-3 font-mono text-[10.5px] tracking-[0.14em] uppercase text-ink-soft">
            <GitCommit className="w-3 h-3 text-accent" />
            <span className="text-ink">~/projects/{project.slug}</span>
            <span className="ml-auto inline-flex items-center gap-1.5 text-lime">
              <HudDot accent="lime" />
              {isFirst ? 'head / main' : 'shipped'}
            </span>
          </div>

          <h3 className="font-display text-2xl md:text-[1.9rem] leading-tight font-bold tracking-tight text-ink group-hover:text-accent transition-colors">
            <ScrambleText text={project.title} trigger="hover" />
          </h3>
          {project.company?.title && (
            <div className="mt-1 font-mono text-[12px] text-ink-soft">
              {project.company.title}
            </div>
          )}

          <div
            className="mt-3 text-ink-muted text-[14px] leading-relaxed line-clamp-3 [&_strong]:text-ink [&_strong]:font-semibold"
            dangerouslySetInnerHTML={{ __html: project.excerpt }}
          />

          {/* injected scale stats */}
          {project.stats && (
            <div className="mt-4 flex flex-wrap gap-2.5">
              {project.stats.map((s) => {
                const a = ACCENT[s.accent]
                const Icon = s.icon
                return (
                  <div
                    key={s.label}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${a.border} ${a.soft}`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${a.text}`} />
                    <span className={`font-display font-bold tabular-nums ${a.text}`}>
                      <AnimatedNumber
                        value={s.value}
                        suffix={s.suffix}
                        decimals={s.value % 1 !== 0 ? 1 : 0}
                      />
                    </span>
                    <span className="font-mono text-[10px] text-ink-soft">{s.label}</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* tags */}
          {tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <Tag key={t.slug}>{t.name}</Tag>
              ))}
            </div>
          )}

          <div className="mt-auto pt-5 flex items-center justify-between">
            <span className="inline-flex items-center gap-2 font-mono text-[13px] text-ink group-hover:text-accent transition-colors">
              <span className="text-accent">$</span> cat ./case-study.md
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </span>
            <span className="font-mono text-[10px] text-ink-soft tabular-nums">
              #{commitHash(project.slug)}
            </span>
          </div>
        </div>
      </Link>
    </GlassPanel>
  )
}
