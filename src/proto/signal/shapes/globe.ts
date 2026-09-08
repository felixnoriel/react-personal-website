/**
 * SIGNAL shape 5 — the globe.
 *
 * A sparse planet with a graticule so it reads as a world in one glance, the
 * fifteen real cities lit as beacons, and the fifteen legs he actually flew
 * drawn as great-circle arcs that lift higher the longer they are. The nomad
 * section anchors its HTML labels to `cityPoints()` and rides `greatCircle()`
 * with its flight dots, so the overlay and the sculpture are the same geometry.
 * Bucket sorted by x (O(n), no comparator) so the morph sweep stays coherent.
 */
import { CHUNK, rng } from './index'
import type { ShapeGen } from './index'
import { CITY_LIST, ROUTE_EDGES } from '../../shared/content'

/** [lat, lon] of the fifteen cities, in CITY_LIST order (one source of truth) */
export const CITY_LATLON: [number, number][] = CITY_LIST.map((c) => [c.lat, c.lng])

/**
 * The globe is turned so that home faces the camera when the pose settles:
 * Bangkok's meridian (100.5°E) is the one pointing at the visitor, which puts
 * Asia in the middle of the frame and swings the Americas in as it rocks.
 */
export const LON_OFFSET = -190.5

export function ll(lat: number, lon: number): [number, number, number] {
  const a = (lat * Math.PI) / 180
  const b = ((lon + LON_OFFSET) * Math.PI) / 180
  return [Math.cos(a) * Math.cos(b), Math.sin(a), -Math.cos(a) * Math.sin(b)]
}

/** the surface point of each city, in sculpture units (before the shape scale) */
export const GLOBE_R = 1.5
export function cityPoints(scale = 1): [number, number, number][] {
  return CITY_LATLON.map(([lat, lon]) => {
    const p = ll(lat, lon)
    return [p[0] * GLOBE_R * scale, p[1] * GLOBE_R * scale, p[2] * GLOBE_R * scale]
  })
}

/** the flown legs, as index pairs into CITY_LIST */
export const ROUTE_PAIRS: [number, number][] = ROUTE_EDGES.map(
  ([a, b]) =>
    [CITY_LIST.findIndex((c) => c.code === a), CITY_LIST.findIndex((c) => c.code === b)] as [number, number],
).filter(([a, b]) => a >= 0 && b >= 0)

export interface Arc {
  /** central angle in radians */
  om: number
  /** great-circle distance in km (mean Earth radius) */
  km: number
  /** a point on the flight path, t = 0..1, in sculpture units */
  at(t: number, scale?: number): [number, number, number]
}

/** the same curve the particles draw, so a flight dot rides the thread exactly */
export function greatCircle(ai: number, bi: number): Arc {
  const a = ll(...CITY_LATLON[ai])
  const b = ll(...CITY_LATLON[bi])
  const om = Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])))
  const so = Math.sin(om) || 1
  return {
    om,
    km: om * 6371,
    at(t, scale = 1) {
      const s1 = Math.sin((1 - t) * om) / so
      const s2 = Math.sin(t * om) / so
      const x = a[0] * s1 + b[0] * s2
      const y = a[1] * s1 + b[1] * s2
      const z = a[2] * s1 + b[2] * s2
      const len = Math.hypot(x, y, z) || 1
      const lift = (GLOBE_R * (1 + 0.19 * Math.sin(Math.PI * t) * (0.4 + om)) * scale) / len
      return [x * lift, y * lift, z * lift]
    },
  }
}

/* ------------------------------------------------------------------ *
 * The generator.
 * ------------------------------------------------------------------ */
export const globe: ShapeGen = function* (out, n, scale) {
  const rand = rng(0x2545f491)
  const R = GLOBE_R
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

  // --- the body: a fibonacci shell, dim, so the planet has volume
  const shell = Math.floor(n * 0.28)
  const ga = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < shell; i++) {
    const y = 1 - (i / (shell - 1)) * 2
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const th = ga * i
    push(Math.cos(th) * r * R, y * R, Math.sin(th) * r * R, 0.07 + rand() * 0.05)
    if (i % CHUNK === 0) yield
  }

  // --- the graticule: five parallels and eight meridians. This is what makes
  // a cloud of points read as a globe at a glance instead of a fuzzy ball.
  const grat = Math.floor(n * 0.12)
  const PARALLELS = [-60, -30, 0, 30, 60]
  const MERIDIANS = 8
  const lines = PARALLELS.length + MERIDIANS
  const perLine = Math.max(1, Math.floor(grat / lines))
  for (let p = 0; p < PARALLELS.length; p++) {
    const lat = PARALLELS[p]
    const heat = lat === 0 ? 0.2 : 0.13
    for (let i = 0; i < perLine; i++) {
      const lon = (i / perLine) * 360
      const q = ll(lat, lon)
      const j = 1 + (rand() - 0.5) * 0.006
      push(q[0] * R * j, q[1] * R * j, q[2] * R * j, heat)
    }
    yield
  }
  for (let m = 0; m < MERIDIANS; m++) {
    const lon = (m / MERIDIANS) * 360
    for (let i = 0; i < perLine; i++) {
      const lat = -90 + (i / perLine) * 180
      const q = ll(lat, lon)
      const j = 1 + (rand() - 0.5) * 0.006
      push(q[0] * R * j, q[1] * R * j, q[2] * R * j, 0.12)
    }
    yield
  }

  // --- the routes he actually flew, as lifted great circles
  const legs = ROUTE_PAIRS.length
  const perLeg = Math.max(1, Math.floor((n * 0.34) / Math.max(1, legs)))
  for (let l = 0; l < legs; l++) {
    const [ai, bi] = ROUTE_PAIRS[l]
    const arc = greatCircle(ai, bi)
    // the epic legs burn; a forty-minute hop between two Asian cities is a
    // quiet thread, or the short arcs read as flares instead of routes
    const reach = 0.13 + 0.3 * Math.min(1, arc.om / 1.45)
    for (let i = 0; i < perLeg; i++) {
      const t = i / perLeg
      const q = arc.at(t)
      push(
        q[0] + (rand() - 0.5) * 0.012,
        q[1] + (rand() - 0.5) * 0.012,
        q[2] + (rand() - 0.5) * 0.012,
        0.11 + Math.sin(Math.PI * t) * reach,
      )
    }
    yield
  }

  // --- the cities: a tight beacon core plus a pin standing off the surface.
  // Bangkok is home, so its pin is taller and its core burns white.
  const perCity = Math.max(1, Math.floor((n - w) / CITY_LATLON.length))
  for (let c = 0; c < CITY_LATLON.length; c++) {
    const p = ll(...CITY_LATLON[c])
    const home = CITY_LIST[c].current === true
    // bright enough to read as a beacon, calm enough that the flow field
    // cannot whip the pin into a flare
    const heat = home ? 0.6 : 0.34
    const pinH = home ? 0.2 : 0.08
    for (let i = 0; i < perCity; i++) {
      const u = rand()
      if (u < 0.24) {
        // the pin: a thin column of light standing off the city
        const t = rand()
        const h = R * (1 + pinH * t)
        const j = 0.006 + t * 0.012
        push(
          p[0] * h + (rand() - 0.5) * j,
          p[1] * h + (rand() - 0.5) * j,
          p[2] * h + (rand() - 0.5) * j,
          heat * (1 - 0.5 * t),
        )
      } else {
        // the halo: a soft pool of light on the surface
        const spread = 0.11 * Math.sqrt(-2 * Math.log(1 - rand() * 0.999))
        const a = rand() * Math.PI * 2
        const b2 = Math.acos(2 * rand() - 1)
        const sb = Math.sin(b2)
        const h = R * (1 + (rand() - 0.4) * 0.02)
        push(
          p[0] * h + sb * Math.cos(a) * spread,
          p[1] * h + sb * Math.sin(a) * spread,
          p[2] * h + Math.cos(b2) * spread,
          heat * (0.5 + rand() * 0.3),
        )
      }
    }
    yield
  }

  while (w < n) {
    const a = rand() * Math.PI * 2
    const y = 2 * rand() - 1
    const r = Math.sqrt(1 - y * y)
    push(Math.cos(a) * r * R, y * R, Math.sin(a) * r * R, 0.08)
  }
  yield

  // scale is applied on the way out, with the bucket sort by x so the sweep
  // matches every other shape
  const B = 1024
  const counts = new Uint32Array(B + 1)
  const bin = new Uint16Array(n)
  const inv = (B - 1) / (2 * R * 1.4)
  for (let i = 0; i < n; i++) {
    let k = ((tmp[i * 4] + R * 1.4) * inv) | 0
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
