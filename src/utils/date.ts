// Lightweight date formatting — native Date/Intl, no luxon (~70KB / ~24KB gz
// saved off the bundle). Supports the luxon-style tokens this app uses:
// yyyy, MMMM, MMM, MM, dd.

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Format an ISO date string with luxon-style tokens.
 * Tokens are replaced longest-first so MMMM/MMM/MM don't collide.
 */
export function formatDate(dateString: string, format: string = 'yyyy-MM-dd'): string {
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return dateString
  const mo = d.getMonth()
  return format
    .replace(/yyyy/g, String(d.getFullYear()))
    .replace(/MMMM/g, MONTHS[mo])
    .replace(/MMM/g, MONTHS[mo].slice(0, 3))
    .replace(/MM/g, pad(mo + 1))
    .replace(/dd/g, pad(d.getDate()))
}

/**
 * Human-readable date, e.g. "March 05, 2024".
 */
export function formatDateHuman(dateString: string): string {
  return formatDate(dateString, 'MMMM dd, yyyy')
}

/**
 * Relative time, e.g. "2 days ago" — native Intl.RelativeTimeFormat.
 */
export function getRelativeTime(dateString: string): string {
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return dateString
  const diff = d.getTime() - Date.now()
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31_536_000_000],
    ['month', 2_592_000_000],
    ['day', 86_400_000],
    ['hour', 3_600_000],
    ['minute', 60_000],
    ['second', 1_000],
  ]
  for (const [unit, ms] of units) {
    if (Math.abs(diff) >= ms || unit === 'second') {
      return rtf.format(Math.round(diff / ms), unit)
    }
  }
  return dateString
}
