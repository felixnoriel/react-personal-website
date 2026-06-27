import { Link } from 'react-router-dom'
import { ArrowUpRight, MapPin } from 'lucide-react'
import type { BlogPost } from '../types/data'
import { formatDate } from '../utils/date'
import {
  GlassPanel,
  HudDot,
  Reveal,
  SectionHeading,
  SectionShell,
} from './ui/section'

// ============================================================
// TravelStories — "Field notes from the road."
//
// Rebuilt from a ~650-line airmail console (postmarks, synthetic
// location codes / coords / weather, dispatch console, ticker wire)
// into clean editorial cards: one feature + a postcard grid. Same
// real posts (title, excerpt, image, date) and /blog/:slug links.
// ============================================================

interface TravelStoriesProps {
  stories: BlogPost[]
}

function prettyDate(d: string): string {
  return formatDate(d, 'MMM yyyy')
}

// Blog titles/excerpts can carry HTML entities (e.g. &#8211; for an en-dash).
// Decode them so they render as real characters, not literal entity codes.
function decodeEntities(s: string): string {
  if (typeof document === 'undefined' || !s.includes('&')) return s
  const el = document.createElement('textarea')
  el.innerHTML = s
  return el.value
}

export function TravelStories({ stories }: TravelStoriesProps) {
  if (!stories.length) return null
  const [feature, ...rest] = stories
  const postcards = rest.slice(0, 3)

  return (
    <SectionShell>
      <SectionHeading
        eyebrow="writing"
        meta={
          <span className="inline-flex items-center gap-2">
            <HudDot accent="lime" />
            field notes
          </span>
        }
        title={
          <>
            Field notes from{' '}
            <span className="italic font-extrabold aurora-text">the road.</span>
          </>
        }
        intro="Dispatches from the places I've worked from, the teams I've shipped with, and the roads in between."
      />

      <div className="mt-12 grid lg:grid-cols-2 gap-5">
        {/* feature */}
        <Reveal>
          <FeatureCard post={feature} />
        </Reveal>

        {/* postcards */}
        <div className="grid sm:grid-cols-2 gap-5 content-start">
          {postcards.map((post, i) => (
            <Reveal key={post.slug} delay={0.06 + i * 0.06}>
              <Postcard post={post} />
            </Reveal>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <Link
          to="/blog"
          className="group inline-flex items-center gap-2 font-mono text-sm text-ink hover:text-accent transition-colors"
        >
          <span className="text-accent">$</span> open ./archive ·{' '}
          {stories.length}+ dispatches filed
          <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
      </div>
    </SectionShell>
  )
}

function FeatureCard({ post }: { post: BlogPost }) {
  return (
    <Link to={`/blog/${post.slug}`} className="group block h-full">
      <GlassPanel className="h-full flex flex-col overflow-hidden">
        <div className="relative aspect-[16/10] overflow-hidden bg-surface">
          {post.image?.url && (
            <img
              src={post.image.url}
              alt={post.image.alt || post.title}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[hsl(253_38%_8%/0.55)] to-transparent" />
          <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/80 backdrop-blur border border-border/60 font-mono text-[10px] uppercase tracking-[0.14em] text-ink">
            <MapPin className="w-3 h-3 text-accent" />
            featured
          </span>
        </div>
        <div className="p-6 flex flex-col flex-1">
          <div className="font-mono text-[11px] text-ink-soft tabular-nums">
            {prettyDate(post.publishedDate)}
          </div>
          <h3 className="mt-2 font-display text-2xl font-bold leading-tight tracking-tight text-ink group-hover:text-accent transition-colors text-balance">
            {decodeEntities(post.title)}
          </h3>
          <p className="mt-2.5 text-ink-muted text-[14px] leading-relaxed line-clamp-3">
            {decodeEntities(post.excerpt)}
          </p>
          <span className="mt-auto pt-5 inline-flex items-center gap-2 font-mono text-[13px] text-ink group-hover:text-accent transition-colors">
            read the dispatch
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </span>
        </div>
      </GlassPanel>
    </Link>
  )
}

function Postcard({ post }: { post: BlogPost }) {
  return (
    <Link to={`/blog/${post.slug}`} className="group block h-full">
      <GlassPanel accentTop={false} className="h-full flex flex-col overflow-hidden">
        <div className="relative aspect-[16/10] overflow-hidden bg-surface">
          {post.image?.url && (
            <img
              src={post.image.url}
              alt={post.image.alt || post.title}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          )}
        </div>
        <div className="p-4 flex flex-col flex-1">
          <div className="font-mono text-[10px] text-ink-soft tabular-nums">
            {prettyDate(post.publishedDate)}
          </div>
          <h3 className="mt-1.5 font-display text-[15px] font-bold leading-snug tracking-tight text-ink group-hover:text-accent transition-colors line-clamp-3">
            {decodeEntities(post.title)}
          </h3>
        </div>
      </GlassPanel>
    </Link>
  )
}
