/**
 * The career timeline drawn to a true shared axis.
 *
 * Every role's start and end are read from the same strings that already
 * feed the cards ("Dec 2025", "Present", "2014"), turned into decimal years,
 * and placed on one 2013 -> now axis. Nothing here is hand-typed, so a data
 * edit moves the drawing.
 */
import type { Career } from '../types/data'

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
}

/** The moment the build ran, as a decimal year. Injected by vite.config.ts
 *  so the prerendered HTML and the browser agree to the digit; a live clock
 *  here would put a hydration mismatch on every current role the month
 *  after a deploy. Falls back to the wall clock in tests. */
declare const __NOW_YEAR__: number | undefined
export const NOW_YEAR: number =
  typeof __NOW_YEAR__ === 'number' ? __NOW_YEAR__ : decimalYear(new Date())

export function decimalYear(d: Date): number {
  return d.getUTCFullYear() + (d.getUTCMonth() + 0.5) / 12
}

/** "Dec 2025" -> 2025.96, "2014" -> 2014.0, "Present" -> now (the build year) */
export function parseCareerDate(s: string, edge: 'start' | 'end'): number {
  void edge // both edges read a bare year the same way; the parameter stays for the callers
  const t = s.trim().toLowerCase()
  if (t === 'present' || t === 'now' || t === '') return NOW_YEAR
  const m = /^([a-z]{3})[a-z]*\s+(\d{4})$/.exec(t)
  if (m && m[1] in MONTHS) return Number(m[2]) + (MONTHS[m[1]] + 0.5) / 12
  // a bare year is read as that year's start on both edges: "2014 - 2015" is
  // one year of work, not two
  const y = /^(\d{4})$/.exec(t)
  if (y) return Number(y[1])
  const asDate = new Date(s)
  return Number.isNaN(asDate.getTime()) ? NOW_YEAR : decimalYear(asDate)
}

export interface Tenure {
  start: number
  end: number
  /** decimal years, e.g. 3.5 */
  years: number
  /** offset and width of the bar as a fraction of the axis, 0..1 */
  x: number
  w: number
  current: boolean
}

export interface Axis {
  from: number
  to: number
  /** the tick years printed above the track */
  ticks: number[]
}

export function careerAxis(careers: Career[]): Axis {
  const starts = careers.map((c) => parseCareerDate(c.startDate, 'start'))
  const from = Math.floor(Math.min(...starts))
  const to = NOW_YEAR
  const ticks: number[] = []
  for (let y = from; y < to; y += 3) ticks.push(y)
  return { from, to, ticks }
}

export function tenureOf(c: Career, axis: Axis): Tenure {
  const start = parseCareerDate(c.startDate, 'start')
  const end = parseCareerDate(c.endDate, 'end')
  const span = axis.to - axis.from
  const clamp = (v: number) => Math.min(1, Math.max(0, v))
  const x = clamp((start - axis.from) / span)
  const w = clamp((end - axis.from) / span) - x
  return {
    start,
    end,
    years: Math.max(0, end - start),
    x,
    w,
    current: /present/i.test(c.endDate),
  }
}

/** "3y 6m" from a decimal span; roles under a year show months only */
export function formatDuration(years: number): string {
  const months = Math.round(years * 12)
  const y = Math.floor(months / 12)
  const m = months % 12
  if (y === 0) return `${Math.max(1, m)}m`
  return m === 0 ? `${y}y` : `${y}y ${m}m`
}

/**
 * Rows separated by a real gap of more than `minGap` years on the axis get a
 * visible break. Rows are newest first, so the gap is between this row's
 * end and the previous (newer) row's start.
 */
export function gapBefore(newer: Tenure | undefined, older: Tenure, minGap = 0.5): boolean {
  if (!newer) return false
  return newer.start - older.end > minGap
}

export const pct = (v: number) => `${(v * 100).toFixed(2)}%`
