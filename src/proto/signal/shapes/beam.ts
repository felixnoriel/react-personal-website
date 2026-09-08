/**
 * SIGNAL shape 7 — THE BEAM (the contact chapter).
 *
 * The whole core stops being an object and becomes a transmission: a lit
 * pad on the ground, a white-hot column rising out of it with two current
 * threads wound around it, eight packet rings climbing the column, and a
 * crown of rays where the signal leaves the page.
 *
 * Colour in both renderers is a ramp across x (electric → indigo → magenta),
 * so the parts that are meant to carry colour — the pad, the packet rings
 * and the crown — are the wide ones, and the column stays one hot white-blue
 * line, which is what a signal actually looks like.
 *
 * Emitted through a temp buffer and bucket sorted by x (the same O(n) pass
 * globe.ts uses) so particle i keeps its horizontal fraction across every
 * shape and the morph out of the stream reads as one object.
 */
import { CHUNK, rng } from './index'
import type { ShapeGen } from './index'

type P3 = [number, number, number]

/** the geometry the contact section anchors its labels to */
export const BEAM = {
  /** the pad, on the ground */
  base: -1.45,
  /** where the column ends and the crown opens */
  throat: 0.85,
  /** the tip of the crown */
  muzzle: 1.6,
  /** outer radius of the pad */
  padR: 1.34,
  /** packet rings climbing the column */
  rungs: 8,
} as const

/** the height of packet ring k (0 = lowest, BEAM.rungs-1 = highest) */
export function rungY(k: number): number {
  const lo = BEAM.base + 0.24
  const hi = BEAM.throat - 0.06
  return lo + (k / (BEAM.rungs - 1)) * (hi - lo)
}
/** the radius of packet ring k — they open as they climb */
export function rungR(k: number): number {
  return 0.19 + (k / (BEAM.rungs - 1)) * 0.25
}

/** a point on the axis of the beam at height y */
export const beamAt = (y: number): P3 => [0, y, 0]
/** the mouth of the transmitter */
export const beamBase = (): P3 => [0, BEAM.base + 0.07, 0]
/** the tip, where the signal leaves */
export const beamMuzzle = (): P3 => [0, BEAM.muzzle + 0.06, 0]
/** the axis point of packet ring k (labels take a pixel offset, so x stays 0) */
export const beamRung = (k: number): P3 => [0, rungY(k), 0]
/** i of `of` points spaced around the pad's outer ring */
export function padRing(i: number, of: number): P3 {
  const a = (i / of) * Math.PI * 2 + Math.PI * 0.15
  return [Math.cos(a) * (BEAM.padR * 0.78), BEAM.base + 0.05, Math.sin(a) * (BEAM.padR * 0.78)]
}

export const beam: ShapeGen = function* (out, n, scale) {
  const rand = rng(0xbea41f07)
  /** a Rayleigh radius: the same soft-edged falloff the other shapes use */
  const rad = (s: number) => s * Math.sqrt(-2 * Math.log(1 - rand() * 0.999))

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

  /* 1 — THE PAD: three rings and eighteen struts on the ground, with a
     white mouth at the centre where the column leaves. Widest part of the
     sculpture, so it carries the full colour ramp. */
  const nPad = Math.floor(n * 0.13)
  const RINGS = [0.56, 0.95, BEAM.padR]
  for (let i = 0; i < nPad; i++) {
    const roll = rand()
    const a = rand() * Math.PI * 2
    if (roll < 0.5) {
      const k = (rand() * 3) | 0
      const R = RINGS[k] + rad(0.011) * (rand() < 0.5 ? -1 : 1)
      push(Math.cos(a) * R, BEAM.base + (rand() - 0.5) * 0.022, Math.sin(a) * R, 0.2 + 0.12 * (2 - k))
    } else if (roll < 0.86) {
      const arm = ((rand() * 18) | 0) / 18
      const aa = arm * Math.PI * 2
      const r = 0.22 + rand() * (BEAM.padR - 0.22)
      push(
        Math.cos(aa) * r + rad(0.006),
        BEAM.base + (rand() - 0.5) * 0.018,
        Math.sin(aa) * r + rad(0.006),
        0.1 + 0.12 * rand(),
      )
    } else {
      const r = rad(0.085)
      push(Math.cos(a) * r, BEAM.base + rand() * 0.13, Math.sin(a) * r, 0.86 + rand() * 0.14)
    }
    if (i % CHUNK === 0) yield
  }

  /* 2 — THE COLUMN: a hot rope with two current threads wound around it. */
  const nCol = Math.floor(n * 0.29)
  const H = BEAM.throat - BEAM.base
  for (let i = 0; i < nCol; i++) {
    const t = rand()
    const y = BEAM.base + t * H
    const a = rand() * Math.PI * 2
    if (rand() < 0.58) {
      const r = rad(0.023)
      push(Math.cos(a) * r, y, Math.sin(a) * r, 0.7 + 0.3 * Math.max(0, 1 - r / 0.042))
    } else {
      const ph = t * Math.PI * 11 + (rand() < 0.5 ? 0 : Math.PI)
      const rr = 0.105 + 0.018 * Math.sin(t * Math.PI * 6)
      const j = rad(0.013)
      push(Math.cos(ph) * rr + Math.cos(a) * j, y, Math.sin(ph) * rr + Math.sin(a) * j, 0.4 + 0.22 * rand())
    }
    if (i % CHUNK === 0) yield
  }

  /* 3 — THE PACKETS: eight rings climbing the column, wider and hotter the
     higher they get. This is the part that reads as "something is being
     sent", and it is what the form's three fields light up against. */
  const nPk = Math.floor(n * 0.16)
  for (let i = 0; i < nPk; i++) {
    const k = (rand() * BEAM.rungs) | 0
    const f = k / (BEAM.rungs - 1)
    const R = rungR(k)
    const a = rand() * Math.PI * 2
    const t = rad(0.012)
    const a2 = rand() * Math.PI * 2
    push(
      Math.cos(a) * R + Math.cos(a2) * t,
      rungY(k) + Math.sin(a2) * t * 0.55,
      Math.sin(a) * R + Math.sin(a2) * t,
      0.5 + 0.45 * f,
    )
    if (i % CHUNK === 0) yield
  }

  /* 4 — THE CROWN: the signal leaving, as ninety-six discrete rays rather
     than a fog, opening from the throat to a metre and a half across. */
  const nWv = Math.floor(n * 0.2)
  const RAYS = 96
  for (let i = 0; i < nWv; i++) {
    const ray = (rand() * RAYS) | 0
    const a = ray * 2.399963 + (rand() - 0.5) * 0.045
    const t = Math.pow(rand(), 0.92)
    const y = BEAM.throat + t * (BEAM.muzzle - BEAM.throat)
    const R = 0.07 + Math.pow(t, 1.45) * 1.2
    const j = rad(0.019)
    const a2 = rand() * Math.PI * 2
    push(Math.cos(a) * R + Math.cos(a2) * j, y, Math.sin(a) * R + Math.sin(a2) * j, 0.08 + 0.46 * (1 - t * 0.78))
    if (i % CHUNK === 0) yield
  }

  /* 5 — sparks that got away, above the crown */
  const nSp = Math.floor(n * 0.02)
  for (let i = 0; i < nSp; i++) {
    const a = rand() * Math.PI * 2
    const r = rad(0.75)
    push(Math.cos(a) * r, BEAM.muzzle + rand() * 0.85, Math.sin(a) * r, 0.14 + rand() * 0.24)
  }
  yield

  /* 6 — the air the beam passes through, and the haze on the ground */
  while (w < n) {
    const a = rand() * Math.PI * 2
    if (rand() < 0.6) {
      const r = 0.34 + rad(0.66)
      push(Math.cos(a) * r, BEAM.base + rand() * (BEAM.muzzle - BEAM.base + 0.35), Math.sin(a) * r, 0.03 + rand() * 0.05)
    } else {
      const r = rad(1.05)
      push(Math.cos(a) * r, BEAM.base - 0.04 + rad(0.08), Math.sin(a) * r, 0.025 + rand() * 0.04)
    }
    if (w % CHUNK === 0) yield
  }
  yield

  /* bucket sort by x so the sweep matches every other shape (O(n), no
     comparator — the same pass globe.ts uses) */
  const B = 1024
  const SPAN = 2.4
  const counts = new Uint32Array(B + 1)
  const bin = new Uint16Array(n)
  const inv = (B - 1) / (2 * SPAN)
  for (let i = 0; i < n; i++) {
    let k = ((tmp[i * 4] + SPAN) * inv) | 0
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
