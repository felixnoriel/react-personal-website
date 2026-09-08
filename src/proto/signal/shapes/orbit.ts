/**
 * SIGNAL shape 2 — THE ORBIT (the experience chapter).
 *
 * Nine rings, one per role, built as an armillary rather than a stack of
 * hula hoops: each ring's RADIUS is how long that tenure ran, each ring's
 * inclination fans it clear of its neighbours, and one bright knot per ring
 * marks where that role's card points. The two roles still running (Stable,
 * Dashify) carry a comet of hotter particles running ahead of their knot, so
 * "current" is something you can see rather than a caption's claim.
 *
 * The node phases are not decorative: they are solved so the nine knots land
 * at nine well-separated heights, because each knot carries an HTML label and
 * labels that pile up are labels nobody reads. A small ring can only reach as
 * far as its own radius, so the rings are ranked by size and the outer ones
 * take the extreme heights.
 *
 * Emitted into a scratch buffer and bucket-sorted by x at the end (the same
 * trick globe.ts uses), so a particle keeps roughly its horizontal place from
 * the words pose and the morph reads as one object unrolling, not a reshuffle.
 */
import type { ShapeGen } from './index'
import { ROLES } from '../../shared/content'

/* The section modules import the ring geometry below, and the page renderer
   imports them at build time. Pulling CHUNK/rng from ./index would make this
   file a cycle partner of the shape registry, and whichever side is entered
   first would read the other's bindings before they exist — which is exactly
   what the build-time renderer does. Eight lines of local copy keep this
   module a leaf. Same xorshift, same slice size, same sculpture. */
const CHUNK = 12000
function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s ^= s << 13
    s >>>= 0
    s ^= s >> 17
    s ^= s << 5
    s >>>= 0
    return s / 4294967296
  }
}

/* ------------------------------------------------------------ the tenures */

const MON = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const NOW_D = new Date()
/** absolute month number, so arithmetic on dates is just subtraction */
export const NOW_M = NOW_D.getFullYear() * 12 + NOW_D.getMonth()

/** "Dec 2025" / "2013" / "Present" / "May" → an absolute month number */
export function monthStamp(part: string, fallbackYear: number): { m: number; current: boolean } {
  if (/present|now/i.test(part)) return { m: NOW_M, current: true }
  const mm = part.match(/[A-Za-z]{3}/)
  const yy = part.match(/\d{4}/)
  const year = yy ? +yy[0] : fallbackYear
  const mon = mm ? Math.max(0, MON.indexOf(mm[0].toLowerCase())) : 0
  return { m: year * 12 + mon, current: false }
}

export interface RoleSpan {
  company: string
  /** absolute month the role started */
  start: number
  /** absolute month it ended (today for the two still running) */
  end: number
  months: number
  current: boolean
}

/** the nine tenures, newest first — parsed from the real dates, never typed in */
export const ROLE_SPANS: RoleSpan[] = ROLES.map((r) => {
  const [a, b] = r.when.split(/[–—-]/).map((s) => s.trim())
  const e = monthStamp(b ?? a, NOW_D.getFullYear())
  const s = monthStamp(a, Math.floor(e.m / 12))
  const months = Math.max(1, e.m - s.m)
  return { company: r.company, start: s.m, end: e.m, months, current: e.current }
})

const N = ROLE_SPANS.length
const LONGEST = Math.max(...ROLE_SPANS.map((s) => s.months))

/** ring radius, in sculpture units: the square root keeps short stints visible */
export function ringRadius(i: number): number {
  return 0.4 + 0.8 * Math.sqrt(ROLE_SPANS[i].months / LONGEST)
}

/** the inclination that fans ring i clear of its neighbours */
const inclination = (i: number) => -0.6 + (1.2 * i) / (N - 1)
/** golden-angle azimuth, so no two rings share a plane */
const azimuth = (i: number) => i * 2.399963

/** the ring's two in-plane unit vectors */
function basis(i: number): [[number, number, number], [number, number, number]] {
  const inc = inclination(i)
  const az = azimuth(i)
  const ci = Math.cos(inc)
  const si = Math.sin(inc)
  const ca = Math.cos(az)
  const sa = Math.sin(az)
  return [
    [ca, 0, -sa],
    [si * sa, ci, si * ca],
  ]
}

/* The knot phases, solved for spread.
   Each knot carries an HTML label, and labels that pile up are labels nobody
   reads — so the nine heights are solved, not chosen. A ring can only lift its
   knot as high as its own radius allows, so the rings are ranked by that reach
   and handed a rung of an evenly spaced ladder, clipped to what they can do;
   the sign alternates so consecutive rungs also sit on opposite sides. */
const NODE_PHASE = (() => {
  const reach = ROLE_SPANS.map((_, i) => ringRadius(i) * Math.cos(inclination(i)) * 0.98)
  const rank = ROLE_SPANS.map((_, i) => i).sort((a, b) => reach[a] - reach[b])
  // the widest evenly spaced ladder every ring can still reach its rung of
  const step = Math.min(...rank.map((i, k) => reach[i] / (k + 0.9)))
  const phase = new Array<number>(N)
  for (let k = 0; k < N; k++) {
    const i = rank[k]
    const rung = Math.min(reach[i], step * (k + 0.9)) * (k % 2 === 0 ? 1 : -1)
    const base = Math.asin(Math.max(-0.97, Math.min(0.97, rung / reach[i])))
    // alternate the branch so the knots also split left and right of the axis
    phase[i] = k % 2 === 0 ? base : Math.PI - base
  }
  return phase
})()

function onRing(i: number, phi: number, r = ringRadius(i)): [number, number, number] {
  const [u, v] = basis(i)
  const c = Math.cos(phi) * r
  const s = Math.sin(phi) * r
  return [u[0] * c + v[0] * s, u[1] * c + v[1] * s, u[2] * c + v[2] * s]
}

/** where each role's node sits (index 0 = newest role), in sculpture units */
export function orbitNodes(scale = 1): [number, number, number][] {
  return ROLE_SPANS.map((_, i) => {
    const p = onRing(i, NODE_PHASE[i])
    return [p[0] * scale, p[1] * scale, p[2] * scale]
  })
}

/* ---------------------------------------------------------- the sculpture */

export const orbit: ShapeGen = function* (out, n, scale) {
  const rand = rng(0x0b17a4d3)
  const tmp = new Float32Array(n * 4)
  let w = 0
  const push = (x: number, y: number, z: number, h: number) => {
    if (w >= n) return
    const o = w++ * 4
    tmp[o] = x
    tmp[o + 1] = y
    tmp[o + 2] = z
    tmp[o + 3] = h
  }

  // ---- the rings themselves: a filament with a gaussian cross-section, the
  // budget split by circumference so a long tenure is not a thinner line
  const circ = ROLE_SPANS.map((_, i) => ringRadius(i))
  const circTotal = circ.reduce((a, b) => a + b, 0)
  const ringBudget = Math.floor(n * 0.58)
  for (let i = 0; i < N; i++) {
    const span = ROLE_SPANS[i]
    const count = Math.max(600, Math.floor((ringBudget * circ[i]) / circTotal))
    const [u, v] = basis(i)
    const r = ringRadius(i)
    // recency reads as heat: the newest ring is the brightest line
    const recency = 1 - i / (N - 1)
    const base = 0.2 + recency * 0.16 + (span.current ? 0.12 : 0)
    for (let k = 0; k < count; k++) {
      const phi = ((k + rand() - 0.5) / count) * Math.PI * 2
      const th = 0.017 * Math.sqrt(-2 * Math.log(1 - rand() * 0.999))
      const a = rand() * Math.PI * 2
      const rr = r + th * Math.cos(a)
      const off = th * Math.sin(a)
      const c = Math.cos(phi) * rr
      const s = Math.sin(phi) * rr
      // the third axis of the ring plane, so the filament has a round section
      const nx = u[1] * v[2] - u[2] * v[1]
      const ny = u[2] * v[0] - u[0] * v[2]
      const nz = u[0] * v[1] - u[1] * v[0]
      // a slow ripple along the wire, so a ring is never a dead perfect circle
      const rip = Math.sin(phi * 5 + i * 1.7) * 0.012
      push(
        u[0] * c + v[0] * s + nx * off + nx * rip,
        u[1] * c + v[1] * s + ny * off + ny * rip,
        u[2] * c + v[2] * s + nz * off + nz * rip,
        base * (1 - th / 0.05) + 0.06,
      )
      if (k % CHUNK === 0) yield
    }
    yield
  }

  // ---- the knots: one per role, plus a comet running ahead of the two that
  // are still running today
  const knotBudget = Math.floor(n * 0.14)
  const perKnot = Math.floor(knotBudget / N)
  const knots = orbitNodes(1)
  for (let i = 0; i < N; i++) {
    const span = ROLE_SPANS[i]
    const p = knots[i]
    const heat = span.current ? 0.95 : 0.72 + (1 - i / (N - 1)) * 0.14
    const tail = span.current ? Math.floor(perKnot * 0.34) : 0
    for (let k = 0; k < perKnot - tail; k++) {
      const s = 0.038 * Math.sqrt(-2 * Math.log(1 - rand() * 0.999))
      const a = rand() * Math.PI * 2
      const b = Math.acos(2 * rand() - 1)
      const sb = Math.sin(b)
      push(p[0] + sb * Math.cos(a) * s, p[1] + sb * Math.sin(a) * s, p[2] + Math.cos(b) * s, heat)
    }
    for (let k = 0; k < tail; k++) {
      const t = k / Math.max(1, tail)
      const q = onRing(i, NODE_PHASE[i] + 0.62 * t)
      const s = 0.02 + t * 0.03
      const a = rand() * Math.PI * 2
      push(q[0] + Math.cos(a) * s * rand(), q[1] + Math.sin(a) * s * rand(), q[2] + (rand() - 0.5) * s, 0.9 * (1 - t * 0.7))
      if (k % CHUNK === 0) yield
    }
    yield
  }

  // ---- the spindle: the axis every ring turns around. An instrument has one,
  // but it is a thread through the middle, not a bar down the frame — it
  // tapers in both thickness and heat toward the poles.
  const axis = Math.floor(n * 0.035)
  for (let k = 0; k < axis; k++) {
    const t = (k + rand() - 0.5) / axis
    const fall = Math.max(0, 1 - Math.abs(t - 0.5) * 2.05)
    const y = (t - 0.5) * 2.2
    const th = 0.009 * (rand() + rand() - 1) * (0.35 + fall)
    const a = rand() * Math.PI * 2
    push(Math.cos(a) * th, y, Math.sin(a) * th, 0.06 + 0.4 * fall * fall)
    if (k % CHUNK === 0) yield
  }
  yield

  // ---- the dust that gives the machine a volume to sit inside
  while (w < n) {
    const a = rand() * Math.PI * 2
    const b = Math.acos(2 * rand() - 1)
    const rad = 0.55 + Math.pow(rand(), 0.62) * 1.05
    const sb = Math.sin(b)
    push(sb * Math.cos(a) * rad, Math.cos(b) * rad * 0.92, sb * Math.sin(a) * rad, 0.05 + rand() * 0.07)
    if (w % CHUNK === 0) yield
  }
  yield

  // ---- bucket sort by x (O(n), no comparator) so the sweep matches the
  // other shapes and the morph reads as one object
  const B = 1024
  const EXT = 1.45
  const counts = new Uint32Array(B + 1)
  const bin = new Uint16Array(n)
  const inv = (B - 1) / (2 * EXT)
  for (let i = 0; i < n; i++) {
    let k = ((tmp[i * 4] + EXT) * inv) | 0
    if (k < 0) k = 0
    else if (k >= B) k = B - 1
    bin[i] = k
    counts[k + 1]++
  }
  yield
  for (let i = 0; i < B; i++) counts[i + 1] += counts[i]
  for (let i = 0; i < n; i++) {
    const d = counts[bin[i]]++ * 4
    const s = i * 4
    out[d] = tmp[s] * scale
    out[d + 1] = tmp[s + 1] * scale
    out[d + 2] = tmp[s + 2] * scale
    out[d + 3] = tmp[s + 3]
    if (i % CHUNK === 0) yield
  }
}
