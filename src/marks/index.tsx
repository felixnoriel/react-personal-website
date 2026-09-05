/**
 * The site's marks - six hand-drawn inline SVGs instead of an icon library.
 * All are 1px strokes on a 16 grid, currentColor, decorative (aria-hidden)
 * unless a label is passed.
 */
import type { SVGProps } from 'react'

type MarkProps = SVGProps<SVGSVGElement> & { label?: string; size?: number }

function Mark({ label, size = 16, children, ...rest }: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      {...rest}
    >
      {label && <title>{label}</title>}
      {children}
    </svg>
  )
}

/** → */
export const ArrowMark = (p: MarkProps) => (
  <Mark {...p}>
    <path d="M2 8h11M9 4l4 4-4 4" />
  </Mark>
)

/** ↗ an external link */
export const ExternalMark = (p: MarkProps) => (
  <Mark {...p}>
    <path d="M4 12L12 4M6 4h6v6" />
  </Mark>
)

/** two overlapping sheets */
export const CopyMark = (p: MarkProps) => (
  <Mark {...p}>
    <path d="M5.5 5.5h7v7h-7zM3.5 10.5v-7h7" />
  </Mark>
)

/** × */
export const CloseMark = (p: MarkProps) => (
  <Mark {...p}>
    <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
  </Mark>
)

/** ⌄ a disclosure chevron */
export const ChevronMark = (p: MarkProps) => (
  <Mark {...p}>
    <path d="M3 6l5 5 5-5" />
  </Mark>
)

/** ✓ */
export const CheckMark = (p: MarkProps) => (
  <Mark {...p}>
    <path d="M2.5 8.5l3.5 3.5 7.5-8" />
  </Mark>
)

/** The monogram: an F drawn with a draughtsman's two strokes, in a 1px frame. */
export const Monogram = ({ size = 20, label = 'Felix Noriel', ...rest }: MarkProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="square"
    role="img"
    aria-label={label}
    {...rest}
  >
    <rect x="0.5" y="0.5" width="19" height="19" />
    <path d="M6.5 15.5v-11h8M6.5 9.5h5.5" strokeWidth="1.25" />
  </svg>
)
