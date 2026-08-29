import { m } from 'framer-motion'
import { useRef, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react'
import { ACCENT, EASE, type Accent } from './section-tokens'
import { useFxLevel } from '../../hooks/useFxLevel'

// ============================================================
// Shared section design system — the single visual language used
// across every redesigned homepage section. The whole point is
// cohesion: one glass-over-shader aesthetic, one heading pattern,
// one motion language, so the page reads as a single designed
// system rather than seven bespoke (and busy) ones.
//
// Sections are transparent so the global ShaderField backdrop
// (mounted once in Home) shows through; content sits on frosted
// GlassPanels for legibility — the hero's proven pattern.
// ============================================================

// Entrances are ONE-SHOT (framer whileInView, once:true): content settles
// and stays settled. Scroll-scrubbed entrances kept text moving for as
// long as the user scrolled and un-revealed on scroll-up — reading tax.

// Transparent section wrapper — lets the global shader show through.
export function SectionShell({
  id,
  children,
  className = '',
  width = 'max-w-6xl',
}: {
  id?: string
  children: ReactNode
  className?: string
  width?: string
}) {
  return (
    <section id={id} className={`relative py-24 md:py-32 scroll-mt-20 ${className}`}>
      <div className={`container relative mx-auto px-6 ${width}`}>{children}</div>
    </section>
  )
}

// Live "ping" indicator — the recurring on-brand status dot.
export function HudDot({
  accent = 'lime',
  className = '',
}: {
  accent?: Accent
  className?: string
}) {
  const a = ACCENT[accent]
  return (
    <span className={`relative flex h-1.5 w-1.5 ${className}`}>
      <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${a.bg}`} />
    </span>
  )
}

// Frosted glass surface — the universal content container. Shows the
// living shader behind through a blur, with a thin accent top edge.
export function GlassPanel({
  children,
  className = '',
  accent = 'accent',
  accentTop = true,
  spotlight = true,
}: {
  children: ReactNode
  className?: string
  accent?: Accent
  accentTop?: boolean
  /** cursor-follow accent glow — GPU translate, no repaint. */
  spotlight?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const spotRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  const st = useRef({ x: 0, y: 0 })
  const { disableHeavyFx } = useFxLevel()
  const spotOn = spotlight && !disableHeavyFx
  const interactive = spotOn

  const apply = () => {
    rafRef.current = null
    const s = st.current
    if (spotOn && spotRef.current) {
      spotRef.current.style.transform = `translate3d(${s.x - 280}px, ${s.y - 280}px, 0)`
    }
  }

  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    st.current.x = e.clientX - r.left
    st.current.y = e.clientY - r.top
    if (rafRef.current == null) rafRef.current = requestAnimationFrame(apply)
  }

  return (
    <div
      ref={ref}
      onPointerMove={interactive ? onMove : undefined}
      style={{
        // Layered "liquid glass" depth, all static (rasterized once):
        //   1) bright top edge — light catching the rim of the pane
        //   2) faint inner ring — the glass thickness
        //   3) grounding drop shadow
        //   4) an accent-tinted halo that BLEEDS past the panel and melts
        //      it into the living shader behind (box-shadow isn't clipped by
        //      overflow-hidden) — this is what makes the card read as
        //      floating ON the shader rather than sitting on opaque paper.
        boxShadow: `inset 0 1px 0 0 hsl(var(--background) / 0.6), inset 0 0 0 1px hsl(var(--background) / 0.14), 0 26px 64px -30px hsl(var(--ink) / 0.5), 0 0 60px -16px hsl(${ACCENT[accent].hsl} / 0.18)`,
      }}
      className={`group/glass corner-squircle relative rounded-2xl border border-ink/[0.07] bg-background/60 backdrop-blur-xl md:backdrop-blur-2xl overflow-hidden ${className}`}
    >
      {/* cursor-follow accent glow */}
      {spotOn && (
        <div
          ref={spotRef}
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 w-[560px] h-[560px] opacity-0 group-hover/glass:opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at center, hsl(${ACCENT[accent].hsl} / 0.13), transparent 60%)`,
            willChange: 'transform',
          }}
        />
      )}
      {accentTop && (
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-px z-[1]"
          style={{
            background: `linear-gradient(90deg, transparent, hsl(${ACCENT[accent].hsl} / 0.55), transparent)`,
          }}
        />
      )}
      {children}
    </div>
  )
}

// Modern frosted tag pill — the single tag language used everywhere
// (tech stacks, project tags, skill chips). Hairline + barely-there
// dark frost so the living shader bleeds through and it reads as part
// of the background rather than a boxy chip.
export function Tag({
  children,
  accent,
  dot = false,
  muted = false,
  className = '',
}: {
  children: ReactNode
  /** color of the leading dot (and hover tint), when used */
  accent?: Accent
  dot?: boolean
  /** dimmer, recede-into-background variant (e.g. legacy/secondary) */
  muted?: boolean
  className?: string
}) {
  const a = accent ? ACCENT[accent] : null
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10.5px] backdrop-blur-sm transition-colors ${
        muted
          ? 'border-ink/[0.06] bg-ink/[0.02] text-ink-soft/80'
          : 'border-ink/[0.09] bg-ink/[0.035] text-ink-soft hover:border-accent/35 hover:text-ink'
      } ${className}`}
    >
      {dot && a && <span className={`h-1.5 w-1.5 rounded-full ${a.bg}`} />}
      {children}
    </span>
  )
}

// Heading emphasis: a static aurora gradient. (The scramble-in + glitch
// made the first thing the eye lands on unreadable for a beat, in every
// section.)
export function FxWord({
  children,
  variant,
  className = '',
}: {
  children: string
  variant?: 'cool' | 'warm'
  className?: string
}) {
  const tint = variant === 'cool' ? 'aurora-cool' : variant === 'warm' ? 'aurora-warm' : ''
  return <span className={`aurora-text aurora-static ${tint} ${className}`}>{children}</span>
}

// The one consistent section header: mono eyebrow + meta, big display
// title, optional intro. Scroll-reveals once.
export function SectionHeading({
  eyebrow,
  meta,
  title,
  intro,
  index,
  align = 'left',
  className = '',
}: {
  eyebrow: string
  meta?: ReactNode
  title: ReactNode
  intro?: ReactNode
  /** giant ghost numeral behind the heading ("01"…) — editorial scale cue */
  index?: string
  align?: 'left' | 'between'
  className?: string
}) {
  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: EASE }}
      className={`relative ${className}`}
    >
      <SectionHeadingInner
        eyebrow={eyebrow}
        meta={meta}
        title={title}
        intro={intro}
        index={index}
        align={align}
      />
    </m.div>
  )
}

function SectionHeadingInner({
  eyebrow,
  meta,
  title,
  intro,
  index,
  align,
}: {
  eyebrow: string
  meta?: ReactNode
  title: ReactNode
  intro?: ReactNode
  index?: string
  align: 'left' | 'between'
}) {
  return (
    <>
      {index && (
        <span
          aria-hidden
          className="absolute -top-[0.42em] right-0 font-display font-bold leading-none text-[6rem] md:text-[9.5rem] tracking-tighter text-transparent select-none pointer-events-none"
          style={{ WebkitTextStroke: '1.5px hsl(var(--ink) / 0.13)' }}
        >
          {index}
        </span>
      )}
      <div className="flex items-center gap-3 mb-4 font-mono text-[11px] tracking-[0.25em] uppercase text-ink-soft">
        <span className="text-accent">—</span>
        <span>{eyebrow}</span>
        <span className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
        {meta && (
          <span className="text-ink-muted normal-case tracking-normal shrink-0">
            {meta}
          </span>
        )}
      </div>
      <div
        className={
          align === 'between'
            ? 'flex flex-col md:flex-row md:items-end md:justify-between gap-5'
            : ''
        }
      >
        <h2 className="text-box-cap font-display text-4xl md:text-5xl lg:text-[3.4rem] leading-[1.02] font-bold tracking-tighter text-ink text-balance max-w-3xl">
          {title}
        </h2>
        {intro && align === 'between' && (
          <p className="text-ink-muted leading-relaxed max-w-md md:text-right md:text-[15px]">
            {intro}
          </p>
        )}
      </div>
      {intro && align !== 'between' && (
        <p className="mt-4 text-ink-muted leading-relaxed max-w-xl">{intro}</p>
      )}
    </>
  )
}

// Reusable scroll-reveal wrapper for staggered content blocks. Scrubbed
// browsers get the CSS view-timeline rise (stagger comes free from each
// block's own scroll position — `delay` only applies to the framer path).
export function Reveal({
  children,
  delay = 0,
  y = 22,
  className = '',
}: {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
}) {
  return (
    <m.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: EASE }}
      className={className}
    >
      {children}
    </m.div>
  )
}
