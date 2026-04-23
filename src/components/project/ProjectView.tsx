import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useScroll,
  useSpring,
} from 'framer-motion'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Code2,
  Cpu,
  FileText,
  GitBranch,
  Layers,
  Maximize2,
  Signal,
} from 'lucide-react'
import Lightbox from 'yet-another-react-lightbox'
import Captions from 'yet-another-react-lightbox/plugins/captions'
import Counter from 'yet-another-react-lightbox/plugins/counter'
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen'
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import 'yet-another-react-lightbox/styles.css'
import 'yet-another-react-lightbox/plugins/captions.css'
import 'yet-another-react-lightbox/plugins/counter.css'
import 'yet-another-react-lightbox/plugins/thumbnails.css'
import { StablePayBanner } from '../ui/StablePayBanner'
import type { Image as ImageAsset, Project, Tag } from '../../types/data'

interface ProjectViewProps {
  project: Project | null
  otherProjects: Project[]
  index: number
  total: number
  prev: Project | null
  next: Project | null
}

// djb2 hash → 7-char commit id (mirrors ProductsBuilt.tsx)
function commitHash(slug: string): string {
  let hash = 5381
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) + hash + slug.charCodeAt(i)) | 0
  }
  return (hash >>> 0).toString(16).padStart(8, '0').slice(0, 7)
}

// Accent cycle for matrix / chips
const TAG_ACCENTS = [
  'text-accent',
  'text-lime',
  'text-electric',
  'text-amber',
] as const

// ============================================================
// Root
// ============================================================

export function ProjectView({
  project,
  otherProjects,
  index,
  total,
  prev,
  next,
}: ProjectViewProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [photoIndex, setPhotoIndex] = useState(0)

  // scroll progress → top-of-page bar
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    mass: 0.4,
  })

  const { validGallery, hasCategories, lightboxSlides } = useMemo(() => {
    const vg = (project?.gallery ?? []).filter((img) => img.url)
    const hc = vg.some((img) => img.category)
    const ls = vg.map((img, i) => {
      const showAlt = !!img.alt && img.alt !== 'Default'
      const frame = `F${(i + 1).toString().padStart(2, '0')}`
      return {
        src: img.url,
        alt: img.alt || `Frame ${i + 1}`,
        title: showAlt ? img.alt : frame,
        description: img.category
          ? `${frame} · ${img.category}`
          : `${frame} · ${project?.title ?? 'gallery'}`,
      }
    })
    return { validGallery: vg, hasCategories: hc, lightboxSlides: ls }
  }, [project])

  if (!project) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="rounded-2xl border border-border bg-background overflow-hidden max-w-md w-full shadow-[0_20px_60px_-30px_hsl(var(--ink)/0.25)]">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-ink text-background">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
            </span>
            <span className="font-mono text-[10.5px] text-white/70 ml-2">
              stderr · mission-lookup
            </span>
          </div>
          <div className="px-5 py-8 font-mono text-sm text-ink-muted leading-relaxed">
            <div>
              <span className="text-accent">$</span> cat ./project.md
            </div>
            <div className="mt-2 text-destructive">
              → 404 · project not found
            </div>
            <div className="mt-4 text-ink-soft text-[12px]">
              The dossier you requested is either classified, archived, or does
              not exist.
            </div>
            <Link
              to="/projects"
              className="mt-6 inline-flex items-center gap-1.5 text-ink hover:text-accent transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>cd ../projects</span>
            </Link>
          </div>
        </div>
      </section>
    )
  }

  const hash = commitHash(project.slug)
  const missionNum = (index + 1).toString().padStart(2, '0')
  const totalStr = total.toString().padStart(2, '0')

  return (
    <>
      {/* scroll progress bar at the very top */}
      <motion.div
        aria-hidden
        className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent via-lime to-electric origin-left z-50"
        style={{ scaleX }}
      />

      <section className="relative overflow-hidden bg-background">
        {/* ambient glows */}
        <div
          aria-hidden
          className="absolute right-0 top-20 w-[40%] h-[60%] pointer-events-none opacity-70"
          style={{
            background:
              'radial-gradient(ellipse at top right, hsl(var(--accent) / 0.08), transparent 65%)',
          }}
        />
        <div
          aria-hidden
          className="absolute left-0 bottom-24 w-[40%] h-[50%] pointer-events-none opacity-50"
          style={{
            background:
              'radial-gradient(ellipse at bottom left, hsl(var(--lime) / 0.07), transparent 65%)',
          }}
        />

        <div className="container mx-auto max-w-7xl px-4 py-10 md:py-14 relative">
          {/* ===================== BREADCRUMB / TOP CHROME ===================== */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-10 rounded-xl border border-border bg-background/80 backdrop-blur overflow-hidden"
          >
            <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-border bg-ink text-background">
              <span className="flex items-center gap-1.5 shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
              </span>
              <span className="font-mono text-[10.5px] text-white/70 ml-1 truncate">
                ~/projects/{project.slug} · mission-dossier
              </span>
              <span className="ml-auto hidden md:inline-flex items-center gap-1.5 font-mono text-[10px] text-white/55">
                <GitBranch className="w-3 h-3" />
                branch: <span className="text-lime">main</span>
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 text-[11px] font-mono">
              <Link
                to="/projects"
                className="group inline-flex items-center gap-1.5 text-ink-soft hover:text-ink transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>cd ../projects</span>
              </Link>
              <span className="flex items-center gap-2 text-ink-soft">
                <span className="hidden sm:inline text-[10px] tracking-[0.2em] uppercase">
                  mission
                </span>
                <span className="tabular-nums text-ink">{missionNum}</span>
                <span className="text-ink-soft">/</span>
                <span className="tabular-nums text-ink-soft">{totalStr}</span>
                <span className="text-accent">·</span>
                <span className="tabular-nums text-accent">#{hash}</span>
              </span>
              <div className="flex items-center gap-2">
                {prev && (
                  <Link
                    to={`/projects/${prev.slug}`}
                    className="group inline-flex items-center gap-1 px-2 py-1 rounded border border-border text-ink-soft hover:text-ink hover:border-accent/40 transition-colors"
                    title={prev.title.replace(/<[^>]*>/g, '')}
                  >
                    <ChevronLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
                    <span className="hidden sm:inline">prev</span>
                  </Link>
                )}
                {next && (
                  <Link
                    to={`/projects/${next.slug}`}
                    className="group inline-flex items-center gap-1 px-2 py-1 rounded border border-border text-ink-soft hover:text-ink hover:border-accent/40 transition-colors"
                    title={next.title.replace(/<[^>]*>/g, '')}
                  >
                    <span className="hidden sm:inline">next</span>
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                )}
              </div>
            </div>
          </motion.div>

          {/* ===================== HERO HEADER ===================== */}
          <motion.header
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="mb-10"
          >
            {/* meta strip */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] tracking-[0.26em] uppercase font-mono text-ink-soft mb-5">
              <span className="text-accent">— case file</span>
              <span className="text-ink-soft/60">·</span>
              <span>
                mission{' '}
                <span className="text-ink tabular-nums">{missionNum}</span>
                <span className="text-ink-soft/60">/</span>
                <span className="text-ink-soft tabular-nums">{totalStr}</span>
              </span>
              <span className="text-ink-soft/60">·</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-lime opacity-75 animate-ping" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lime" />
                </span>
                <span className="text-lime">deployed</span>
              </span>
              <span className="text-ink-soft/60">·</span>
              <span className="tabular-nums text-accent">#{hash}</span>
            </div>

            <h1
              className="font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-ink text-balance leading-[1.02] mb-5"
              dangerouslySetInnerHTML={{ __html: project.title }}
            />

            {project.excerpt && (
              <p
                className="max-w-3xl text-ink-muted text-base md:text-lg leading-relaxed"
                dangerouslySetInnerHTML={{ __html: project.excerpt }}
              />
            )}

            {/* inline meta chips */}
            <div className="mt-7 flex flex-wrap items-center gap-2 text-[11px] font-mono">
              {project.company?.title && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-surface/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  <span className="text-ink-soft">client</span>
                  <span className="text-ink-soft/50">=</span>
                  <span className="text-ink">{project.company.title}</span>
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-surface/60">
                <Layers className="w-3 h-3 text-lime" />
                <span className="text-ink-soft">stack</span>
                <span className="text-ink-soft/50">=</span>
                <span className="text-ink tabular-nums">
                  {project.tags?.length ?? 0} tech
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-surface/60">
                <Cpu className="w-3 h-3 text-electric" />
                <span className="text-ink-soft">build</span>
                <span className="text-ink-soft/50">=</span>
                <span className="text-ink tabular-nums">#{hash}</span>
              </span>
              {validGallery.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-surface/60">
                  <FileText className="w-3 h-3 text-amber" />
                  <span className="text-ink-soft">logs</span>
                  <span className="text-ink-soft/50">=</span>
                  <span className="text-ink tabular-nums">
                    {validGallery.length} frames
                  </span>
                </span>
              )}
            </div>
          </motion.header>

          {/* ===================== HERO CONSOLE ===================== */}
          <MissionConsole project={project} hash={hash} />

          {/* ===================== MAIN + SIDEBAR ===================== */}
          <div className="mt-12 md:mt-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
            {/* Main */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-8"
            >
              <DocsWindow
                slug={project.slug}
                hash={hash}
                content={project.content}
              />
            </motion.div>

            {/* Sidebar */}
            <div className="lg:col-span-4">
              <ProjectSidebar
                project={project}
                otherProjects={otherProjects}
              />
            </div>
          </div>

          {/* ===================== GALLERY ===================== */}
          {validGallery.length > 0 && (
            <GallerySection
              validGallery={validGallery}
              hasCategories={hasCategories}
              onOpen={(i) => {
                setPhotoIndex(i)
                setLightboxOpen(true)
              }}
            />
          )}

          {/* Lightbox — enhanced with thumbnails, counter, captions, zoom, fullscreen */}
          <Lightbox
            open={lightboxOpen}
            close={() => setLightboxOpen(false)}
            slides={lightboxSlides}
            index={photoIndex}
            plugins={[Captions, Counter, Fullscreen, Thumbnails, Zoom]}
            controller={{ closeOnBackdropClick: true, closeOnPullDown: true }}
            animation={{ fade: 260, swipe: 320 }}
            carousel={{ finite: false, padding: '16px', spacing: '4%' }}
            counter={{ container: { style: { top: 16, left: 16 } } }}
            captions={{ descriptionTextAlign: 'start', showToggle: false }}
            thumbnails={{
              position: 'bottom',
              width: 128,
              height: 72,
              border: 1,
              borderRadius: 8,
              padding: 4,
              gap: 10,
              imageFit: 'cover',
              showToggle: true,
            }}
            zoom={{
              maxZoomPixelRatio: 3,
              zoomInMultiplier: 1.8,
              doubleTapDelay: 300,
              doubleClickDelay: 300,
              wheelZoomDistanceFactor: 120,
              keyboardMoveDistance: 60,
            }}
            styles={{
              container: { backgroundColor: 'rgba(6, 6, 17, 0.94)' },
              button: { filter: 'drop-shadow(0 0 6px hsl(var(--accent)/0.4))' },
              thumbnailsContainer: {
                backgroundColor: 'rgba(6, 6, 17, 0.85)',
                backdropFilter: 'blur(8px)',
              },
              thumbnail: {
                backgroundColor: 'rgba(20, 22, 38, 0.9)',
                borderColor: 'rgba(255, 255, 255, 0.12)',
              },
            }}
          />

          {/* ===================== FOOTER NAV ===================== */}
          <FooterNav prev={prev} next={next} />
        </div>
      </section>
    </>
  )
}

// ============================================================
// MissionConsole — terminal-framed hero image with HUD overlays
// ============================================================

function MissionConsole({
  project,
  hash,
}: {
  project: Project
  hash: string
}) {
  const mx = useMotionValue(50)
  const my = useMotionValue(50)
  const spot = useMotionTemplate`radial-gradient(600px circle at ${mx}% ${my}%, hsl(var(--accent) / 0.13), transparent 55%)`

  const isStable = project.slug === 'stable'
  const hasImage = !!project.image?.url
  const isSvg = hasImage && project.image.url.endsWith('.svg')
  const isPortrait =
    hasImage &&
    !!project.image.height &&
    !!project.image.width &&
    project.image.height > project.image.width

  const fileExt = isStable ? 'tsx' : isSvg ? 'svg' : 'jpg'

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.18 }}
      className="group relative rounded-2xl border border-border bg-background overflow-hidden shadow-[0_40px_100px_-40px_hsl(var(--accent)/0.35)]"
    >
      {/* animated top gradient bar */}
      <span
        aria-hidden
        className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent via-amber to-electric opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"
      />

      {/* top window chrome */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-ink text-background">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
        </span>
        <span className="font-mono text-[10.5px] text-white/70 ml-2 truncate">
          ~/projects/{project.slug}/hero.{fileExt}
        </span>
        <span className="ml-auto hidden md:flex items-center gap-2 font-mono text-[10px] text-white/55">
          <span>preview</span>
          <span className="text-white/30">·</span>
          <span className="text-lime">●</span>
          <span className="tabular-nums">#{hash}</span>
        </span>
      </div>

      {/* image area */}
      <div
        onMouseMove={(e) => {
          const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
          mx.set(((e.clientX - r.left) / r.width) * 100)
          my.set(((e.clientY - r.top) / r.height) * 100)
        }}
        className="relative aspect-[16/9] md:aspect-[2/1] bg-surface"
      >
        {isStable ? (
          <StablePayBanner />
        ) : hasImage ? (
          isSvg ? (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[hsl(79_58%_85%)] via-[hsl(79_48%_75%)] to-[hsl(79_42%_65%)] p-12 md:p-20 group-hover:scale-[1.01] transition-transform duration-700">
              <img
                src={project.image.url}
                alt={project.image.alt || project.title}
                loading="lazy"
                className="max-w-[55%] max-h-[70%] w-auto h-auto object-contain"
              />
            </div>
          ) : isPortrait ? (
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
                alt={project.image.alt || project.title}
                width={project.image.width}
                height={project.image.height}
                loading="lazy"
                className="relative max-h-[92%] w-auto h-auto object-contain drop-shadow-2xl group-hover:scale-[1.02] transition-transform duration-700"
              />
            </div>
          ) : (
            <img
              src={project.image.url}
              alt={project.image.alt || project.title}
              width={project.image.width || 1600}
              height={project.image.height || 900}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-soft">
            <Code2 className="w-12 h-12" />
          </div>
        )}

        {/* scan lines */}
        <div
          aria-hidden
          className="absolute inset-0 bg-scanlines opacity-[0.15] pointer-events-none mix-blend-multiply"
        />

        {/* mouse spotlight */}
        <motion.span
          aria-hidden
          style={{ background: spot }}
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        />

        {/* HUD corners — always visible */}
        <HudCorners alwaysVisible />

        {/* top-right rec pill */}
        <div className="absolute top-5 right-5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/90 backdrop-blur border border-border text-[10px] tracking-widest uppercase text-ink font-mono">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-destructive" />
            </span>
            rec
          </span>
        </div>

        {/* bottom meta strip */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 px-4 py-2 bg-gradient-to-t from-ink/75 via-ink/40 to-transparent text-white font-mono text-[10px] tracking-[0.2em] uppercase">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-lime" />
            <span>broadcast.live</span>
          </span>
          <span className="text-white/30">·</span>
          <span className="text-white/80">
            {isStable
              ? 'interactive · react'
              : isSvg
                ? 'vector · svg'
                : project.image.width && project.image.height
                  ? `${project.image.width}×${project.image.height}`
                  : 'raster'}
          </span>
          <span className="ml-auto hidden md:inline text-white/55">
            frame · <span className="text-white/85">#{hash}</span>
          </span>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================================
// DocsWindow — README.md frame around the project content
// ============================================================

function DocsWindow({
  slug,
  hash,
  content,
}: {
  slug: string
  hash: string
  content: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-background overflow-hidden shadow-[0_20px_60px_-30px_hsl(var(--ink)/0.25)]">
      {/* header */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-border bg-surface/70 backdrop-blur">
        <FileText className="w-3.5 h-3.5 text-accent" />
        <span className="font-mono text-[11px] text-ink truncate">
          <span className="text-ink-soft">~/projects/</span>
          {slug}
          <span className="text-ink-soft">/README.md</span>
        </span>
        <span className="ml-auto hidden md:flex items-center gap-2 text-[10px] font-mono text-ink-soft">
          <span className="tabular-nums">#{hash}</span>
          <span className="text-ink-soft/60">·</span>
          <span className="text-lime">utf-8</span>
          <span className="text-ink-soft/60">·</span>
          <span>markdown</span>
        </span>
      </div>

      {/* body */}
      <div className="relative">
        {/* decorative gutter rail */}
        <span
          aria-hidden
          className="absolute top-8 bottom-8 left-6 w-px bg-gradient-to-b from-transparent via-border to-transparent hidden md:block"
        />
        <div className="px-5 md:pl-12 md:pr-10 py-8 md:py-10">
          {/* cat prompt */}
          <div className="mb-7 flex items-center gap-3 font-mono text-[11px] tracking-[0.24em] uppercase text-ink-soft">
            <span className="text-accent">$</span>
            <span>cat ./README.md</span>
            <span
              aria-hidden
              className="w-1.5 h-3 bg-ink animate-blink opacity-60"
            />
            <span
              aria-hidden
              className="flex-1 h-px bg-gradient-to-r from-border to-transparent"
            />
          </div>
          {/* prose content */}
          <div
            className="prose prose-lg max-w-none prose-headings:font-display prose-headings:tracking-tight prose-headings:text-ink prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-strong:text-ink prose-code:text-accent prose-code:font-mono prose-code:text-[0.9em] prose-code:before:content-[''] prose-code:after:content-['']"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </div>

      {/* footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-surface/40 font-mono text-[10px] text-ink-soft">
        <span className="flex items-center gap-1.5">
          <span className="text-lime">●</span>
          <span>saved</span>
          <span className="text-ink-soft/60">·</span>
          <span className="tabular-nums">#{hash}</span>
        </span>
        <span className="tabular-nums">--- EOF ---</span>
      </div>
    </div>
  )
}

// ============================================================
// Sidebar — Transmission / Stack Matrix / Switch Mission
// ============================================================

function ProjectSidebar({
  project,
  otherProjects,
}: {
  project: Project
  otherProjects: Project[]
}) {
  return (
    <aside className="space-y-5">
      {/* TRANSMISSION */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <TransmissionCard hash={commitHash(project.slug)} />
      </motion.div>

      {/* STACK MATRIX */}
      {project.tags && project.tags.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <StackMatrix tags={project.tags} />
        </motion.div>
      )}

      {/* SWITCH MISSION */}
      {otherProjects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <SwitchMission otherProjects={otherProjects} />
        </motion.div>
      )}
    </aside>
  )
}

function SidebarCardHeader({
  icon,
  title,
  count,
}: {
  icon: ReactNode
  title: string
  count?: number
}) {
  return (
    <div className="flex items-center gap-2 px-3.5 py-2 border-b border-border bg-surface/60 backdrop-blur font-mono text-[10.5px] tracking-[0.2em] uppercase text-ink-soft">
      <span className="text-accent">{icon}</span>
      <span className="text-ink">{title}</span>
      <span className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
      {typeof count === 'number' && (
        <span className="tabular-nums text-ink-soft">
          {count.toString().padStart(2, '0')}
        </span>
      )}
    </div>
  )
}

function TransmissionCard({ hash }: { hash: string }) {
  return (
    <div className="rounded-xl border border-border bg-background overflow-hidden shadow-[0_10px_30px_-18px_hsl(var(--ink)/0.18)]">
      <SidebarCardHeader
        icon={<Signal className="w-3 h-3" />}
        title="transmission.log"
      />
      <div className="px-3.5 py-3.5 space-y-2.5 font-mono text-[11px]">
        {/* signal bars + active status */}
        <div className="flex items-center gap-3">
          <SignalBars />
          <div className="flex flex-col">
            <span className="text-ink-soft text-[9.5px] tracking-[0.22em] uppercase">
              status
            </span>
            <span className="text-lime inline-flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-lime opacity-75 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lime" />
              </span>
              active
            </span>
          </div>
          <div className="ml-auto flex flex-col text-right">
            <span className="text-ink-soft text-[9.5px] tracking-[0.22em] uppercase">
              uplink
            </span>
            <span className="text-ink tabular-nums">99.9%</span>
          </div>
        </div>
        {/* freq + hash */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
          <div>
            <div className="text-[9.5px] tracking-[0.22em] uppercase text-ink-soft">
              freq
            </div>
            <div className="text-ink tabular-nums">main</div>
          </div>
          <div className="text-right">
            <div className="text-[9.5px] tracking-[0.22em] uppercase text-ink-soft">
              hash
            </div>
            <div className="text-accent tabular-nums">#{hash}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SignalBars() {
  const heights = [0.35, 0.6, 0.82, 1]
  return (
    <div
      aria-hidden
      className="flex items-end gap-[3px] h-6 w-9"
      style={{ alignSelf: 'flex-end' }}
    >
      {heights.map((h, i) => (
        <motion.span
          key={i}
          className="w-1.5 rounded-sm bg-lime"
          initial={{ scaleY: 0.15, opacity: 0.5 }}
          whileInView={{ scaleY: h, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.1 + i * 0.08 }}
          style={{ height: '100%', transformOrigin: 'bottom' }}
        />
      ))}
    </div>
  )
}

function StackMatrix({ tags }: { tags: Tag[] }) {
  return (
    <div className="rounded-xl border border-border bg-background overflow-hidden shadow-[0_10px_30px_-18px_hsl(var(--ink)/0.18)]">
      <SidebarCardHeader
        icon={<Layers className="w-3 h-3" />}
        title="stack.matrix"
        count={tags.length}
      />
      <div className="px-2.5 py-2.5 grid grid-cols-2 gap-1.5">
        {tags.map((tag, i) => {
          const accent = TAG_ACCENTS[i % TAG_ACCENTS.length]
          const position = `[${i.toString(16).padStart(2, '0').toUpperCase()}]`
          return (
            <motion.span
              key={tag.slug}
              initial={{ opacity: 0, y: 4 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.03 }}
              className="group flex items-center gap-1.5 px-2 py-1.5 rounded-md border border-border bg-surface/40 hover:bg-surface hover:border-accent/40 transition-colors font-mono text-[10.5px]"
            >
              <span
                className={`${accent} tabular-nums text-[9px] opacity-80 shrink-0`}
              >
                {position}
              </span>
              <span
                className="text-ink truncate"
                dangerouslySetInnerHTML={{ __html: tag.name }}
              />
            </motion.span>
          )
        })}
      </div>
    </div>
  )
}

function SwitchMission({ otherProjects }: { otherProjects: Project[] }) {
  return (
    <div className="rounded-xl border border-border bg-background overflow-hidden shadow-[0_10px_30px_-18px_hsl(var(--ink)/0.18)]">
      <SidebarCardHeader
        icon={<GitBranch className="w-3 h-3" />}
        title="switch.mission"
        count={otherProjects.length}
      />
      <div className="p-2.5 space-y-2.5">
        {otherProjects.map((p) => {
          const pHash = commitHash(p.slug)
          return (
            <Link
              key={p.slug}
              to={`/projects/${p.slug}`}
              className="group block rounded-lg overflow-hidden border border-border bg-surface/30 hover:border-accent/40 hover:shadow-[0_10px_30px_-18px_hsl(var(--accent)/0.35)] transition-all"
            >
              {/* thumbnail */}
              <div className="relative aspect-[3/2] overflow-hidden bg-surface">
                {p.slug === 'stable' ? (
                  <div className="w-full h-full bg-gradient-to-br from-[hsl(79_58%_85%)] via-[hsl(79_48%_75%)] to-[hsl(79_42%_65%)] flex items-center justify-center">
                    <span className="font-display text-lg text-ink tracking-tight">
                      StablePay
                    </span>
                  </div>
                ) : p.image?.url ? (
                  p.image.url.endsWith('.svg') ? (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[hsl(79_58%_85%)] via-[hsl(79_48%_75%)] to-[hsl(79_42%_65%)] p-4">
                      <img
                        src={p.image.url}
                        alt={p.image.alt || p.title}
                        loading="lazy"
                        className="max-w-[70%] max-h-[70%] w-auto h-auto object-contain"
                      />
                    </div>
                  ) : (
                    <img
                      src={p.image.url}
                      alt={p.image.alt || p.title}
                      className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500"
                      width={300}
                      height={200}
                      loading="lazy"
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink-soft">
                    <Code2 className="w-6 h-6" />
                  </div>
                )}
                {/* scan overlay */}
                <div
                  aria-hidden
                  className="absolute inset-0 bg-scanlines opacity-[0.12] mix-blend-multiply pointer-events-none"
                />
                {/* commit badge */}
                <div className="absolute top-2 left-2 font-mono text-[9px] tracking-widest uppercase px-1.5 py-0.5 rounded bg-background/85 text-accent border border-border tabular-nums">
                  #{pHash}
                </div>
                {/* HUD corners on hover */}
                <HudCorners />
              </div>
              {/* text */}
              <div className="px-3 py-2.5 bg-background">
                <div className="font-mono text-[9.5px] tracking-[0.18em] uppercase text-ink-soft mb-0.5 truncate">
                  ./{p.slug}
                </div>
                <h3
                  className="font-display text-sm font-semibold text-ink group-hover:text-accent transition-colors truncate"
                  dangerouslySetInnerHTML={{ __html: p.title }}
                />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================
// GallerySection — category-aware gallery with terminal headers
// ============================================================

function GallerySection({
  validGallery,
  hasCategories,
  onOpen,
}: {
  validGallery: ImageAsset[]
  hasCategories: boolean
  onOpen: (index: number) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6 }}
      className="mt-16 md:mt-24"
    >
      {/* Gallery top chrome */}
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.26em] uppercase">
          <span className="text-accent">—</span>
          <span className="text-ink">gallery.stream</span>
          <span className="inline-flex items-center gap-1.5 text-lime normal-case tracking-normal text-[10px]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-lime opacity-75 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lime" />
            </span>
            live feed
          </span>
        </span>
        <span className="flex-1 h-px bg-gradient-to-r from-border via-border to-transparent" />
        <span className="font-mono text-[11px] text-ink-soft tabular-nums">
          {validGallery.length.toString().padStart(2, '0')} frames
        </span>
      </div>

      {hasCategories ? (
        <CategoryGallery validGallery={validGallery} onOpen={onOpen} />
      ) : (
        <FlatGallery validGallery={validGallery} onOpen={onOpen} />
      )}
    </motion.div>
  )
}

function CategoryGallery({
  validGallery,
  onOpen,
}: {
  validGallery: ImageAsset[]
  onOpen: (index: number) => void
}) {
  const grouped = validGallery.reduce<
    Record<string, Array<{ img: ImageAsset; index: number }>>
  >((acc, img, index) => {
    const category = img.category || 'Other'
    if (!acc[category]) acc[category] = []
    acc[category].push({ img, index })
    return acc
  }, {})

  return (
    <div className="space-y-12">
      {Object.entries(grouped).map(([category, items]) => {
        const slug = category.toLowerCase().replace(/\s+/g, '_')
        return (
          <div key={category}>
            {/* category header */}
            <div className="mb-4 flex items-center gap-3 font-mono text-[11px] tracking-[0.22em] uppercase text-ink-soft">
              <span className="text-accent">&gt;</span>
              <span className="text-ink">log.{slug}</span>
              <span className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
              <span className="tabular-nums text-ink-soft">
                {items.length.toString().padStart(2, '0')}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {items.map((item, i) => (
                <GalleryTile
                  key={item.index}
                  img={item.img}
                  index={item.index}
                  frame={i + 1}
                  onOpen={onOpen}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function FlatGallery({
  validGallery,
  onOpen,
}: {
  validGallery: ImageAsset[]
  onOpen: (index: number) => void
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {validGallery.map((img, index) => (
        <GalleryTile
          key={index}
          img={img}
          index={index}
          frame={index + 1}
          onOpen={onOpen}
        />
      ))}
    </div>
  )
}

function GalleryTile({
  img,
  index,
  frame,
  onOpen,
}: {
  img: ImageAsset
  index: number
  frame: number
  onOpen: (index: number) => void
}) {
  const showAlt = !!img.alt && img.alt !== 'Default'
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: (frame % 8) * 0.03 }}
      onClick={() => onOpen(index)}
      aria-label={`Open ${img.alt || `frame ${frame}`} — image ${frame} of gallery`}
      className="group relative aspect-video overflow-hidden rounded-lg border border-border bg-surface hover:border-accent/60 transition-colors text-left cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <img
        src={img.url}
        alt={img.alt || `Frame ${frame}`}
        className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500"
        width={400}
        height={225}
        loading="lazy"
      />
      {/* darken on hover to lift the expand affordance */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-ink/0 via-ink/0 to-ink/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
      />
      {/* scan overlay on hover */}
      <div
        aria-hidden
        className="absolute inset-0 bg-scanlines opacity-0 group-hover:opacity-[0.18] mix-blend-multiply pointer-events-none transition-opacity"
      />
      {/* HUD corners on hover */}
      <HudCorners />
      {/* frame number badge */}
      <div className="absolute top-2 left-2 font-mono text-[9px] tracking-widest uppercase px-1.5 py-0.5 rounded bg-background/85 text-ink border border-border tabular-nums">
        F{frame.toString().padStart(2, '0')}
      </div>
      {/* expand affordance — appears on hover, centered */}
      <div
        aria-hidden
        className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      >
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-background/90 border border-accent/40 text-ink font-mono text-[10px] tracking-[0.18em] uppercase shadow-[0_6px_20px_-6px_hsl(var(--accent)/0.5)] backdrop-blur-sm scale-95 group-hover:scale-100 transition-transform">
          <Maximize2 className="w-3 h-3 text-accent" />
          <span>expand</span>
        </span>
      </div>
      {/* bottom caption on hover */}
      {showAlt && (
        <div className="absolute inset-x-0 bottom-0 px-3 py-2 bg-gradient-to-t from-ink/85 via-ink/40 to-transparent text-white font-mono text-[10px] opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300 truncate">
          {img.alt}
        </div>
      )}
    </motion.button>
  )
}

// ============================================================
// FooterNav — prev/next mission cards
// ============================================================

function FooterNav({
  prev,
  next,
}: {
  prev: Project | null
  next: Project | null
}) {
  if (!prev && !next) return null
  return (
    <motion.nav
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="mt-16 md:mt-24 grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      {prev ? (
        <FooterCard direction="prev" project={prev} />
      ) : (
        <div className="hidden md:block" />
      )}
      {next ? (
        <FooterCard direction="next" project={next} />
      ) : (
        <div className="hidden md:block" />
      )}
    </motion.nav>
  )
}

function FooterCard({
  direction,
  project,
}: {
  direction: 'prev' | 'next'
  project: Project
}) {
  const isPrev = direction === 'prev'
  const hash = commitHash(project.slug)
  return (
    <Link
      to={`/projects/${project.slug}`}
      className={`group relative block rounded-2xl border border-border bg-background p-5 md:p-6 hover:border-accent/40 hover:shadow-[0_20px_50px_-20px_hsl(var(--accent)/0.3)] transition-all overflow-hidden ${
        isPrev ? '' : 'md:text-right'
      }`}
    >
      {/* animated top bar */}
      <span
        aria-hidden
        className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${
          isPrev ? 'from-accent to-transparent' : 'from-transparent to-accent'
        } opacity-0 group-hover:opacity-100 transition-opacity`}
      />
      <div
        className={`flex items-center gap-2 font-mono text-[10px] tracking-[0.26em] uppercase text-ink-soft mb-3 ${
          isPrev ? '' : 'md:flex-row-reverse'
        }`}
      >
        {isPrev ? (
          <ChevronLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
        ) : (
          <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        )}
        <span>{isPrev ? 'previous mission' : 'next mission'}</span>
        <span className="text-accent tabular-nums">#{hash}</span>
      </div>
      <h3
        className="font-display text-xl md:text-2xl font-bold tracking-tight text-ink group-hover:text-accent transition-colors leading-tight"
        dangerouslySetInnerHTML={{ __html: project.title }}
      />
      <p className="mt-2 font-mono text-[11px] text-ink-soft truncate">
        ~/projects/{project.slug}
      </p>
    </Link>
  )
}

// ============================================================
// HudCorners — 4 L-shaped SVG corner brackets
// ============================================================

function HudCorners({
  alwaysVisible = false,
  color = 'text-lime',
}: {
  alwaysVisible?: boolean
  color?: string
}) {
  const brackets: Array<{ className: string; d: string }> = [
    { className: 'top-2 left-2', d: 'M 2 12 L 2 2 L 12 2' },
    { className: 'top-2 right-2', d: 'M 4 2 L 14 2 L 14 12' },
    { className: 'bottom-2 left-2', d: 'M 2 4 L 2 14 L 12 14' },
    { className: 'bottom-2 right-2', d: 'M 4 14 L 14 14 L 14 4' },
  ]
  const wrapperCls = alwaysVisible
    ? 'opacity-90'
    : 'opacity-0 group-hover:opacity-100 transition-opacity duration-500'
  return (
    <div
      aria-hidden
      className={`absolute inset-0 pointer-events-none ${wrapperCls}`}
    >
      {brackets.map((b, i) => (
        <svg
          key={i}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          className={`absolute ${b.className} ${color}`}
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
