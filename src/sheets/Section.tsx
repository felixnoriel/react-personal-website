import type { ReactNode } from 'react'

/**
 * A sheet section: a real <h2>, an optional intro at reading measure, and
 * an optional fact at the right end of the heading row (never an ordinal,
 * never an eyebrow). Rhythm and rules come from sheet.css.
 */
export function Section({
  id,
  title,
  intro,
  meta,
  cvHeight,
  className = '',
  children,
}: {
  id: string
  title: ReactNode
  intro?: ReactNode
  /** a real fact about the section - a count, a span, a coordinate */
  meta?: ReactNode
  /** estimated height for content-visibility: auto below the fold */
  cvHeight?: number
  className?: string
  children: ReactNode
}) {
  const cv = cvHeight ? { className: 'cv-auto', style: { '--cv-height': `${cvHeight}px` } as React.CSSProperties } : {}
  return (
    <section
      id={id}
      className={`section ${cv.className ?? ''} ${className}`.trim()}
      style={cv.style}
      aria-labelledby={`${id}-title`}
    >
      <div className="section__head">
        <h2 id={`${id}-title`}>{title}</h2>
        {meta && <div className="mono mono--label section__meta">{meta}</div>}
      </div>
      {intro && <p className="section__intro">{intro}</p>}
      {children}
    </section>
  )
}
