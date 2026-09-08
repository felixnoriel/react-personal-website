/**
 * SIGNAL shape 6 — the stream (the writing chapter).
 *
 * Eighteen dispatches hung on one wire. A filament descends across the frame
 * with a knot on it for every post, newest at the top; each knot pours a
 * braided thread of light whose LENGTH is that post's word count, so the
 * sculpture is the archive, measured — the 3,093-word Phuket itinerary really
 * does fall furthest and the 203-word Macau note is a stub.
 *
 * sections/writing.ts anchors its HTML lane labels to lanePoint(i) and pulls
 * the swarm to the hovered post's knot, so the cards and the sculpture are the
 * same eighteen objects. Bucket sorted by x (O(n), no comparator) so the morph
 * sweep into and out of this pose stays coherent with every other shape.
 */
import type { ShapeGen } from './index'

/*
 * This module is a LEAF on purpose. sections/writing.html.ts runs at build time
 * and needs the lane table below to draw the cards, and shapes/index.ts imports
 * this file to assemble SHAPES — importing the shared CHUNK/rng from './index'
 * would close that circle and leave SHAPES reading an uninitialised binding.
 * So the slice size and the xorshift live here, identical to './index'.
 */
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

/** how many dispatches the stream carries (src/data/blog.ts has 18) */
export const LANES = 18

/**
 * Word count per post, newest first — the same order writing.html.ts renders.
 * Measured from src/data/blog.ts (tags stripped); the renderer re-derives them
 * at build time and warns if this table ever drifts from the data.
 */
export const LANE_WORDS = [
  203, 535, 3093, 602, 1026, 675, 531, 907, 504, 1284, 2409, 1124, 746, 734, 519, 905, 810, 1048,
] as const

/* ---------------------------------------------------------------- geometry */

/**
 * The wire is a descending HELIX, not a straight diagonal, and that is a
 * correctness decision rather than a styling one: main.ts yaws this camera by
 * up to ±77° on a slow sway, and any flat arrangement of eighteen lanes goes
 * edge-on and collapses into one blur at some point in that swing. On a helix
 * the lanes are spread around the axis, so a quarter of them always face the
 * camera and the descent stays readable at every angle.
 */
const R = 0.8
const TURNS = 1.18
const TH0 = -0.55
/** the first knot's height, and how far the wire descends across all eighteen */
const TOP = 1.5
const SPAN = 2.3
/** how far a thread falls: the shortest post, and the extra the longest adds */
const FALL_MIN = 0.2
const FALL_ADD = 0.6

/**
 * On a phone the camera sits further back and the sprites are drawn larger, so
 * the lanes are spread a little and dropped, because main.ts anchors this
 * chapter high there. lanePoint(i, phone) bakes both in, so writing.ts's
 * gravity well always lands on the knot the visitor can actually see.
 */
const PHONE_SPREAD = 1.15
const PHONE_DROP = -0.75

const LN_MIN = Math.log(Math.min(...LANE_WORDS))
const LN_MAX = Math.log(Math.max(...LANE_WORDS))
/** 0..1 on a log scale, so one 3k-word outlier does not flatten the other 17 */
export function laneWeight(i: number): number {
  return (Math.log(LANE_WORDS[Math.round(i) % LANES]) - LN_MIN) / (LN_MAX - LN_MIN)
}
/** how far post i's thread falls, in sculpture units */
export function laneFall(i: number, phone = false): number {
  return (FALL_MIN + FALL_ADD * laneWeight(i)) * (phone ? PHONE_SPREAD : 1)
}

/** the knot post i hangs from — what the labels anchor to and the well reaches for */
export function lanePoint(i: number, phone = false, scale = 1): [number, number, number] {
  const f = Math.max(0, Math.min(1, i / (LANES - 1)))
  const s = (phone ? PHONE_SPREAD : 1) * scale
  const th = TH0 + f * TURNS * Math.PI * 2
  return [
    Math.cos(th) * R * s,
    (TOP - f * SPAN) * s + (phone ? PHONE_DROP * scale : 0),
    Math.sin(th) * R * s,
  ]
}

/** the tail of post i's thread — where a longer read reaches */
export function laneTail(i: number, phone = false, scale = 1): [number, number, number] {
  const p = lanePoint(i, phone, scale)
  return [p[0], p[1] - laneFall(i, phone) * scale, p[2]]
}

/* --------------------------------------------------------------- the build */

export const stream: ShapeGen = function* (out, n, scale, ctx) {
  const phone = ctx.phone
  const spread = phone ? PHONE_SPREAD : 1
  const rand = rng(0x57a3e4b1)
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

  const knots: [number, number, number][] = []
  for (let i = 0; i < LANES; i++) knots.push(lanePoint(i, phone))

  // --- the wire: one filament threaded through all eighteen knots, so the
  // dispatches read as one archive rather than eighteen loose columns
  const wireN = Math.floor(n * 0.09)
  const perSeg = Math.max(1, Math.floor(wireN / (LANES - 1)))
  for (let i = 0; i < LANES - 1; i++) {
    for (let k = 0; k < perSeg; k++) {
      // walk the helix itself between neighbours, so the wire is one curve
      const q = lanePoint(i + k / perSeg, phone)
      const j = (0.005 + rand() * 0.008) * spread
      push(
        q[0] + (rand() - 0.5) * j,
        q[1] + (rand() - 0.5) * j,
        q[2] + (rand() - 0.5) * j,
        0.34 + rand() * 0.1,
      )
    }
    yield
  }

  // --- the threads: a braid of three strands round a bright core, tapering as
  // it falls. Share the budget by length, so a long read really is denser.
  const totalFall = Array.from({ length: LANES }, (_, i) => laneFall(i, phone)).reduce((a, b) => a + b, 0)
  const threadN = Math.floor(n * 0.63)
  const STRANDS = 3
  const TURNS = 1.55
  for (let i = 0; i < LANES; i++) {
    const [kx, ky, kz] = knots[i]
    const fall = laneFall(i, phone)
    const feature = i === 0
    const rad = (feature ? 0.082 : 0.05) * spread
    const count = Math.max(1, Math.floor((threadN * fall) / totalFall))

    // The knot: a bead of light the label sits on. Kept deliberately WIDE and
    // below full heat — a tighter, hotter bead saturates the quarter-res bloom
    // in gpu.ts and the halo turns into a visible rectangle.
    const beadN = Math.floor(count * 0.085)
    for (let k = 0; k < beadN; k++) {
      const s = (feature ? 0.068 : 0.052) * spread * Math.sqrt(-2 * Math.log(1 - rand() * 0.999))
      const a = rand() * Math.PI * 2
      const b2 = Math.acos(2 * rand() - 1)
      const sb = Math.sin(b2)
      push(
        kx + sb * Math.cos(a) * s,
        ky + sb * Math.sin(a) * s,
        kz + Math.cos(b2) * s,
        (feature ? 0.66 : 0.52) * Math.max(0, 1 - (s / spread) * 3.4) + 0.1,
      )
      if (w % CHUNK === 0) yield
    }

    // the braid
    for (let k = beadN; k < count; k++) {
      const u = rand()
      const t = u * u * 0.35 + u * 0.65 // denser near the head, thinning as it falls
      const core = rand() < 0.17
      const strand = (k % STRANDS) / STRANDS
      const a = t * TURNS * Math.PI * 2 + strand * Math.PI * 2
      const rr = core
        ? 0.006 * spread * (rand() + rand())
        : rad * (1 - 0.58 * t) * (0.62 + 0.5 * rand())
      const drift = (rand() - 0.5) * 0.012 * spread
      push(
        kx + Math.cos(a) * rr + drift,
        ky - t * fall + (rand() - 0.5) * 0.01 * spread,
        kz + Math.sin(a) * rr * 0.9 + drift,
        core ? 0.5 * (1 - t * 0.7) + 0.1 : (1 - t) * (1 - t) * 0.44 + 0.05,
      )
      if (w % CHUNK === 0) yield
    }

    // drips: what has already fallen off the end of the thread
    const dripN = Math.floor(count * 0.07)
    for (let k = 0; k < dripN; k++) {
      const d = rand()
      push(
        kx + (rand() - 0.5) * 0.09 * spread,
        ky - fall - d * 0.55 * spread,
        kz + (rand() - 0.5) * 0.09 * spread,
        0.1 * (1 - d) + 0.02,
      )
    }
    yield
  }

  // --- the mist the stream falls through, so the pose has volume rather than
  // eighteen lines on a black field
  while (w < n) {
    const a = rand() * Math.PI * 2
    const rr = (0.25 + rand() * 1.15) * spread
    push(
      Math.cos(a) * rr,
      (TOP + 0.25 - rand() * (SPAN + 1.5)) * spread + (phone ? PHONE_DROP : 0),
      Math.sin(a) * rr,
      0.03 + rand() * 0.05,
    )
    if (w % CHUNK === 0) yield
  }
  yield

  // --- bucket sort by x so particle i keeps its horizontal fraction across
  // every shape and the morph reads as one object unrolling
  const B = 1024
  const RANGE = (R + 0.65) * spread
  const counts = new Uint32Array(B + 1)
  const bin = new Uint16Array(n)
  const inv = (B - 1) / (2 * RANGE)
  for (let i = 0; i < n; i++) {
    let k = ((tmp[i * 4] + RANGE) * inv) | 0
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
