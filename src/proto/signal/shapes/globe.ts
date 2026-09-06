/** SIGNAL shape 5 — the globe: the fifteen cities and the routes between them. */
import { CHUNK, rng } from './index'
import type { ShapeGen } from './index'

export const CITY_LATLON: [number, number][] = [
  [13.75, 100.5], // Bangkok
  [14.6, 120.98], // Manila
  [22.32, 114.17], // Hong Kong
  [25.03, 121.57], // Taipei
  [37.57, 126.98], // Seoul
  [35.68, 139.65], // Tokyo
  [1.35, 103.82], // Singapore
  [-8.65, 115.22], // Bali
  [-33.87, 151.21], // Sydney
  [40.71, -74.01], // New York
  [34.05, -118.24], // Los Angeles
  [43.65, -79.38], // Toronto
  [40.42, -3.7], // Madrid
  [44.49, 11.34], // Bologna
  [48.14, 11.58], // Munich
]

export function ll(lat: number, lon: number): [number, number, number] {
  const a = (lat * Math.PI) / 180
  const b = (lon * Math.PI) / 180
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

/* ------------------------------------------------------------------ *
 * 2 — THE GLOBE: a sparse planet, the fifteen real cities lit, and great
 * circle arcs between them in the order he actually travelled. Bucket
 * sorted by x (O(n), no comparator) so the sweep stays coherent.
 * ------------------------------------------------------------------ */
export const globe: ShapeGen = function* (out, n, scale) {
  const rand = rng(0x2545f491)
  const R = 1.5
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

  const shell = Math.floor(n * 0.46)
  const ga = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < shell; i++) {
    const y = 1 - (i / (shell - 1)) * 2
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const th = ga * i
    push(Math.cos(th) * r * R, y * R, Math.sin(th) * r * R, 0.1 + rand() * 0.06)
    if (i % CHUNK === 0) yield
  }

  const legs = CITY_LATLON.length - 1
  const per = Math.max(1, Math.floor((n * 0.4) / legs))
  for (let l = 0; l < legs; l++) {
    const a = ll(...CITY_LATLON[l])
    const b = ll(...CITY_LATLON[l + 1])
    const om = Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])))
    const so = Math.sin(om) || 1
    for (let i = 0; i < per; i++) {
      const t = i / per
      const s1 = Math.sin((1 - t) * om) / so
      const s2 = Math.sin(t * om) / so
      let x = a[0] * s1 + b[0] * s2
      let y = a[1] * s1 + b[1] * s2
      let z = a[2] * s1 + b[2] * s2
      const len = Math.hypot(x, y, z) || 1
      const lift = R * (1 + 0.19 * Math.sin(Math.PI * t) * (0.4 + om))
      x = (x / len) * lift + (rand() - 0.5) * 0.012
      y = (y / len) * lift + (rand() - 0.5) * 0.012
      z = (z / len) * lift + (rand() - 0.5) * 0.012
      push(x, y, z, 0.3 + Math.sin(Math.PI * t) * 0.26)
    }
    yield
  }

  const perCity = Math.max(1, Math.floor((n - w) / CITY_LATLON.length))
  for (let c = 0; c < CITY_LATLON.length; c++) {
    const p = ll(...CITY_LATLON[c])
    const heat = c === 0 ? 0.42 : 0.3 // Bangkok is home — brightest
    for (let i = 0; i < perCity; i++) {
      const beacon = rand() < 0.22
      const spread = beacon ? 0.014 : 0.15 * Math.sqrt(-2 * Math.log(1 - rand() * 0.999))
      const a = rand() * Math.PI * 2
      const b2 = Math.acos(2 * rand() - 1)
      const sb = Math.sin(b2)
      const h = beacon ? R * (1 + rand() * 0.14) : R * (1 + (rand() - 0.4) * 0.02)
      push(p[0] * h + sb * Math.cos(a) * spread, p[1] * h + sb * Math.sin(a) * spread, p[2] * h + Math.cos(b2) * spread, heat)
    }
    yield
  }
  while (w < n) {
    const a = rand() * Math.PI * 2
    const y = 2 * rand() - 1
    const r = Math.sqrt(1 - y * y)
    push(Math.cos(a) * r * R, y * R, Math.sin(a) * r * R, 0.1)
  }
  yield

  // bucket sort by x so the sweep matches the other shapes
  const B = 1024
  const counts = new Uint32Array(B + 1)
  const bin = new Uint16Array(n)
  const inv = (B - 1) / (2 * R * 1.35)
  for (let i = 0; i < n; i++) {
    let k = ((tmp[i * 4] + R * 1.35) * inv) | 0
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
