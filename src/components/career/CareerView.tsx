import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Clock,
  FileText,
  FolderOpen,
  MapPin,
} from 'lucide-react'
import { ProjectList } from '../project/ProjectList'
import { SubNav, type SubNavItem } from '../ui/page/SubNav'
import {
  useKeyboardNav,
  useProseAnchors,
  useReadingMinutes,
} from '../../hooks/useDetailPage'
import type { Career, Project } from '../../types/data'

interface CareerViewProps {
  experience: Career | null
  projects: Project[]
}

export function CareerView({ experience, projects }: CareerViewProps) {
  const proseRef = useRef<HTMLDivElement>(null)
  const readingMinutes = useReadingMinutes(experience?.content)
  useProseAnchors(proseRef, [experience?.content])
  useKeyboardNav({
    prevHref: null,
    nextHref: null,
    indexHref: '/career',
  })

  if (!experience) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="rounded-2xl border border-border bg-background overflow-hidden max-w-md w-full shadow-[0_20px_60px_-30px_hsl(var(--ink)/0.25)] p-8 text-center">
          <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-soft mb-3">
            // 404 — record not found
          </div>
          <p className="text-ink-muted mb-6">
            That career entry isn&apos;t on the timeline.
          </p>
          <Link
            to="/career"
            className="group inline-flex items-center gap-2 h-10 px-5 rounded-full border border-border bg-card text-ink hover:border-accent/50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="font-mono text-[10.5px] tracking-[0.18em] uppercase">
              return to timeline
            </span>
          </Link>
        </div>
      </section>
    )
  }

  // Combine prev/next siblings would be nice — but CareerDetail doesn't
  // currently pass them. Esc → /career still works via useKeyboardNav.
  const hasProjects = projects.length > 0

  return (
    <article className="relative">
      {/* overflow-x-clip so descendants can use position:sticky safely */}
      <section className="relative overflow-x-clip bg-background">
        <div className="container mx-auto max-w-5xl px-4 py-10 md:py-14">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <Link
              to="/career"
              className="group inline-flex items-center gap-1.5 text-ink-soft hover:text-ink transition-colors font-mono text-[11px]"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>cd ../career</span>
            </Link>
          </motion.div>

          {/* Hero */}
          <motion.header
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mb-8"
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] tracking-[0.26em] uppercase font-mono text-ink-soft mb-5">
              <span className="text-accent">— career.log</span>
              <span className="text-ink-soft/60">·</span>
              <span className="inline-flex items-center gap-1.5">
                <Briefcase className="w-3 h-3 text-lime" />
                <span className="text-ink">{experience.jobTitle}</span>
              </span>
            </div>

            <h1
              className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter text-ink leading-[1.04] mb-4 text-balance"
              dangerouslySetInnerHTML={{
                __html: `${experience.jobTitle}, ${experience.title}`,
              }}
            />

            <div className="mt-5 flex flex-wrap items-center gap-2 text-[11px] font-mono">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-surface/60">
                <Calendar className="w-3 h-3 text-accent" />
                <span className="text-ink-soft">tenure</span>
                <span className="text-ink-soft/50">=</span>
                <span className="text-ink">
                  {experience.startDate} – {experience.endDate}
                </span>
              </span>
              {experience.location && (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-surface/60"
                >
                  <MapPin className="w-3 h-3 text-amber" />
                  <span className="text-ink-soft">loc</span>
                  <span className="text-ink-soft/50">=</span>
                  <span
                    className="text-ink"
                    dangerouslySetInnerHTML={{ __html: experience.location }}
                  />
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-surface/60">
                <Clock className="w-3 h-3 text-lime" />
                <span className="text-ink-soft">read</span>
                <span className="text-ink-soft/50">=</span>
                <span className="text-ink tabular-nums">~{readingMinutes} min</span>
              </span>
              {hasProjects && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-surface/60">
                  <FolderOpen className="w-3 h-3 text-electric" />
                  <span className="text-ink-soft">projects</span>
                  <span className="text-ink-soft/50">=</span>
                  <span className="text-ink tabular-nums">{projects.length}</span>
                </span>
              )}
            </div>
          </motion.header>

          {/* Sticky sub-nav (Overview / Projects) */}
          <SubNav
            items={[
              { id: 'overview', label: 'overview', icon: <FileText className="w-3 h-3" /> },
              ...(hasProjects
                ? [
                    {
                      id: 'projects',
                      label: 'projects',
                      icon: <FolderOpen className="w-3 h-3" />,
                    },
                  ]
                : []),
            ] as SubNavItem[]}
            underlineLayoutId="career-subnav-underline"
          />

          {/* Hero image */}
          {experience.image?.url && (
            <motion.figure
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-12 rounded-2xl border border-border bg-surface overflow-hidden"
            >
              <img
                src={experience.image.url}
                alt={experience.image.alt || experience.title}
                width={experience.image.width || 1200}
                height={experience.image.height || 600}
                loading="lazy"
                className="w-full h-auto object-cover"
              />
            </motion.figure>
          )}

          {/* Overview / prose */}
          <motion.div
            id="overview"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
            className="scroll-mt-[140px] rounded-2xl border border-border bg-background overflow-hidden shadow-[0_20px_60px_-30px_hsl(var(--ink)/0.2)]"
          >
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-surface/70 backdrop-blur">
              <FileText className="w-3.5 h-3.5 text-accent" />
              <span className="font-mono text-[11px] text-ink truncate">
                <span className="text-ink-soft">~/career/</span>
                {experience.slug}
                <span className="text-ink-soft">/role.md</span>
              </span>
            </div>
            <div
              ref={proseRef}
              className="prose prose-lg max-w-none px-5 md:px-10 py-8 md:py-10 prose-headings:font-display prose-headings:tracking-tight prose-headings:text-ink prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-strong:text-ink prose-li:text-ink prose-li:marker:text-accent"
              dangerouslySetInnerHTML={{ __html: experience.content }}
            />
          </motion.div>
        </div>
      </section>

      {/* Projects from this role */}
      {hasProjects && (
        <section
          id="projects"
          className="scroll-mt-[140px] relative bg-background border-t border-border"
        >
          <div className="container mx-auto max-w-7xl px-4 pt-14 md:pt-20 pb-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] tracking-[0.26em] uppercase font-mono text-ink-soft mb-4">
              <span className="text-accent">— shipped from this seat</span>
              <span className="text-ink-soft/60">·</span>
              <span>
                <span className="text-ink tabular-nums">
                  {projects.length.toString().padStart(2, '0')}
                </span>{' '}
                missions
              </span>
            </div>
          </div>
          <ProjectList projects={projects} viewType="career" />
        </section>
      )}
      {/* Back-to-top + global gg shortcut now live in MainLayout. */}
    </article>
  )
}
