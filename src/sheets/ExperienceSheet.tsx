import { useEffect, useRef, type CSSProperties, type MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Section } from './Section'
import { Picture } from '../components/Picture'
import { IMAGES as careerImages } from '../data/images/career.generated'
import { sheetChange } from '../transitions/sheetChange'
import { careerAxis, gapBefore, pct, tenureOf, type Axis, type Tenure } from '../utils/timeline'
import { initScale } from './scale'
import { initTechInk, type TechInk } from './techInk'
import type { Career } from '../types/data'
import './experience.css'

/* The section's own copy, verbatim, shared with the /career index sheet. */
export const EXPERIENCE_TITLE = 'A decade of building with small, sharp teams.'
export const EXPERIENCE_INTRO =
  'Startups across gaming, hospitality, education, and publishing — the products and teams that shaped how I work.'
export const EXPERIENCE_META = '2014 → now'

/** four decimals is a third of a day: enough for a month-stepped axis */
const num = (v: number) => String(Math.round(v * 10_000) / 10_000)

/** the axis the segments are drawn against, handed to CSS as data */
function axisStyle(axis: Axis): CSSProperties {
  return { '--axis-from': num(axis.from), '--axis-to': num(axis.to) } as CSSProperties
}

/** the tenure segment's geometry, as data for the CSS to draw with */
function segmentStyle(t: Tenure): CSSProperties {
  return {
    '--start': num(t.start),
    '--end': num(t.end),
    '--fallback-x': pct(t.x),
    '--fallback-w': pct(t.w),
  } as CSSProperties
}

/** run once the browser is idle, and let the effect take it back */
function onIdle(run: () => void): () => void {
  const w = window as unknown as {
    requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number
    cancelIdleCallback?: (id: number) => void
  }
  const request = w.requestIdleCallback
  const cancel = w.cancelIdleCallback
  if (request && cancel) {
    const id = request(run, { timeout: 2000 })
    return () => cancel(id)
  }
  const id = setTimeout(run, 200)
  return () => clearTimeout(id)
}

/* ------------------------------------------------------------------ rows */

interface RowProps {
  career: Career
  tenure: Tenure
  /** a real break in the axis before this row: 20px of air and a firmer rule */
  gap: boolean
  /** the /career sheet prints every achievement under the row */
  expanded: boolean
  onOpen: (e: MouseEvent<HTMLAnchorElement>, slug: string) => void
  onInk: (name: string | null, from?: Element | null) => void
}

function CareerRow({ career, tenure, gap, expanded, onOpen, onInk }: RowProps) {
  // The home sheet shows the first three; the /career index has room for all.
  const tech = expanded ? (career.techStack ?? []) : (career.techStack ?? []).slice(0, 3)
  const outcome = career.achievements?.[0]?.title

  return (
    <li
      className={`career-row${gap ? ' career-row--gap' : ''}`}
      data-slug={career.slug}
      data-sheet-source={`/career/${career.slug}`}
      data-start={num(tenure.start)}
      data-end={num(tenure.end)}
    >
      <div className="career-row__line1">
        <span className="career-row__plate plate" data-vt="sheet-plate">
          <Picture src={career.image.url} from={careerImages} alt={career.image.alt || career.title} sizes="88px" />
        </span>
        <Link
          className="career-row__name"
          to={`/career/${career.slug}`}
          data-vt="sheet-title"
          onClick={(e) => onOpen(e, career.slug)}
        >
          {career.title}
        </Link>
        <span className="career-row__dates meta meta--pen">
          {career.startDate} – {career.endDate}
        </span>
      </div>

      <div className="career-row__line2">
        <span className="career-row__role meta">
          {career.jobTitle} · {career.location}
        </span>
        {tech.length > 0 && (
          <span className="career-row__tech">
            {tech.map((name) => (
              <button
                key={name}
                type="button"
                className="meta meta--pen career-row__chip"
                onPointerEnter={(e) => onInk(name, e.currentTarget)}
                onFocus={(e) => onInk(name, e.currentTarget)}
                onClick={(e) => onInk(name, e.currentTarget)}
                onPointerLeave={() => onInk(null)}
                onBlur={() => onInk(null)}
              >
                {name}
              </button>
            ))}
          </span>
        )}
      </div>

      {expanded ? (
        <AchievementList items={career.achievements} />
      ) : (
        outcome && <p className="career-row__outcome">{outcome}</p>
      )}

      <span className="career-row__track" data-vt="sheet-rule" aria-hidden="true">
        <span className="career-row__seg" style={segmentStyle(tenure)} />
      </span>
    </li>
  )
}

/** A role's achievements, as they are written in the data. */
export function AchievementList({ items }: { items?: Career['achievements'] }) {
  if (!items || items.length === 0) return null
  return (
    <ul className="career-ach">
      {items.map((a) => (
        <li className="career-ach__item" key={a.title}>
          <p className="career-ach__head">
            <span className="career-ach__title">{a.title}</span>
            {a.badge && <span className="career-ach__badge meta meta--pen">{a.badge}</span>}
          </p>
          <p className="career-ach__desc">{a.description}</p>
        </li>
      ))}
    </ul>
  )
}

/* ----------------------------------------------------------- the drawing */

interface ScaleProps {
  careers: Career[]
  /** unique on the page: the readout is referenced by the slider */
  idPrefix: string
  expanded?: boolean
}

/**
 * The nine rows on one true axis, with the axis itself draggable.
 * Rendered on the home sheet and, with every achievement expanded, on /career.
 */
export function CareerScale({ careers, idPrefix, expanded = false }: ScaleProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const inkRef = useRef<TechInk | null>(null)
  const navigate = useNavigate()

  const axis = careerAxis(careers)
  const span = axis.to - axis.from || 1
  // whole months from the axis start to now; the slider steps in these so
  // every step is exactly one month and the last step is the present
  const months = Math.floor(span * 12 + 1e-6)
  const rows = careers.map((career) => ({ career, tenure: tenureOf(career, axis) }))
  const techNames = Array.from(new Set(careers.flatMap((c) => c.techStack ?? [])))

  // Year labels sit ABOVE the rule, so nothing knocks a hole in it. The last
  // three-year tick is dropped where it would collide with `now`.
  const ticks = [
    ...axis.ticks
      .map((year) => ({ label: String(year), x: (year - axis.from) / span, now: false }))
      .filter((t) => t.x <= 0.8),
    { label: 'now', x: 1, now: true },
  ]

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    let stopScale = () => {}
    const cancel = onIdle(() => {
      stopScale = initScale(root)
      inkRef.current = initTechInk(root, techNames)
    })
    return () => {
      cancel()
      stopScale()
      inkRef.current?.destroy()
      inkRef.current = null
    }
    // the drawing is static after the first render: nine rows, one axis
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onOpen = (e: MouseEvent<HTMLAnchorElement>, slug: string) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const row = e.currentTarget.closest<HTMLElement>('.career-row')
    if (!row) return
    e.preventDefault()
    void sheetChange({
      source: row,
      to: `/career/${slug}`,
      navigate,
      prefetch: () => import('../pages/CareerDetail'),
    })
  }

  const onInk = (name: string | null, from?: Element | null) => inkRef.current?.ink(name, from)

  return (
    <div className="career-drawing" ref={rootRef} style={axisStyle(axis)}>
      <div className="scale">
        <output className="scale__readout meta meta--pen" id={`${idPrefix}-readout`} aria-live="polite" />
        <div className="scale__frame">
          {ticks.map((t) => (
            <span
              key={t.label}
              className={`scale__tick meta meta--label${t.now ? ' scale__tick--now' : ''}`}
              style={{ '--x': pct(t.x) } as CSSProperties}
              aria-hidden="true"
            >
              {t.label}
            </span>
          ))}
          <span className="scale__indicator" aria-hidden="true" />
          <input
            className="scale__input"
            type="range"
            min={0}
            max={months}
            step={1}
            defaultValue={months}
            data-from={num(axis.from)}
            data-to={num(axis.to)}
            aria-label="Scrub the career timeline by month"
            aria-describedby={`${idPrefix}-readout`}
          />
        </div>
      </div>

      <ol className="career-list">
        {rows.map(({ career, tenure }, i) => (
          <CareerRow
            key={career.slug}
            career={career}
            tenure={tenure}
            gap={gapBefore(rows[i - 1]?.tenure, tenure)}
            expanded={expanded}
            onOpen={onOpen}
            onInk={onInk}
          />
        ))}
      </ol>
    </div>
  )
}

/* --------------------------------------------------------- the home sheet */

export function ExperienceSheet({ careers }: { careers: Career[] }) {
  return (
    <Section
      id="sheet-experience"
      className="experience-sheet"
      title={EXPERIENCE_TITLE}
      intro={EXPERIENCE_INTRO}
      meta={EXPERIENCE_META}
      cvHeight={1600}
    >
      <CareerScale careers={careers} idPrefix="sheet-experience" />
      <p className="experience-sheet__more">
        <Link className="link" to="/career">
          All nine roles
        </Link>
      </p>
    </Section>
  )
}

/** the tenure rule a detail sheet re-draws itself with, on the same axis */
export function TenureRule({ tenure, axis, className = '' }: { tenure: Tenure; axis: Axis; className?: string }) {
  return (
    <div className={`career-row__track ${className}`.trim()} style={axisStyle(axis)} aria-hidden="true">
      <span className="career-row__seg" style={segmentStyle(tenure)} />
    </div>
  )
}
