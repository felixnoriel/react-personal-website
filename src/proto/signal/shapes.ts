/**
 * SIGNAL — the morph targets.
 *
 * Every particle keeps its index across all four shapes, so the mapping IS
 * the choreography. Each generator emits points in a left-to-right sweep
 * (coil: arc-length; words: raster columns; globe: bucket-sorted by x), so
 * particle i sits at roughly the same horizontal fraction in every shape.
 * The morph therefore reads as one object unrolling into the next instead
 * of a random scatter — and it costs no comparison sort at all.
 *
 * The whole build is a generator that yields every few thousand particles,
 * so the caller can spend it in idle slices and never block a frame.
 *
 * Layout: a flat Float32Array of vec4 (x, y, z, heat), shape s at s*n*4.
 */

export const SHAPE_COUNT = 4
const CHUNK = 12000

/** deterministic xorshift so every tier draws the same sculpture */
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

const CITY_LATLON: [number, number][] = [
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

function ll(lat: number, lon: number): [number, number, number] {
  const a = (lat * Math.PI) / 180
  const b = (lon * Math.PI) / 180
  return [Math.cos(a) * Math.cos(b), Math.sin(a), -Math.cos(a) * Math.sin(b)]
}

/* ------------------------------------------------------------------ *
 * 0 — THE CORE: a ring wound 21 times with a filament of light, plus a
 * razor-thin circle of current threading it. Not a torus knot, not a
 * sphere of dots: a coil, which is what a reactor actually looks like.
 * 62% filament, 8% the inner ring (white hot), 22% corona, 8% sparks.
 * ------------------------------------------------------------------ */
function* coil(out: Float32Array, n: number, scale: number) {
  const rand = rng(0x51c17a1)
  const R = 1.16
  const r = 0.42
  const turns = 21
  for (let i = 0; i < n; i++) {
    const f = (i + rand() - 0.5) / n
    const u = f * Math.PI * 2
    const roll = rand()
    let x: number
    let y: number
    let z: number
    let heat: number

    if (roll < 0.62) {
      // the wound filament — a tight rope with a gaussian cross-section
      const v = u * turns
      const th = 0.03 * Math.sqrt(-2 * Math.log(1 - rand() * 0.999))
      const a = rand() * Math.PI * 2
      const rr = R + (r + th * Math.cos(a)) * Math.cos(v)
      x = rr * Math.cos(u)
      y = rr * Math.sin(u)
      z = (r + th * Math.cos(a)) * Math.sin(v) + th * Math.sin(a) * 0.6
      heat = Math.max(0, 1 - th / 0.05)
    } else if (roll < 0.7) {
      // the current: a razor circle through the middle of the coil
      const th = 0.011 * (rand() + rand() - 1)
      const rr = R + th
      x = rr * Math.cos(u)
      y = rr * Math.sin(u)
      z = 0.014 * (rand() + rand() - 1)
      heat = 1
    } else if (roll < 0.92) {
      // corona — the volume the coil sits inside
      const a = rand() * Math.PI * 2
      const rad = r * (1.05 + rand() * 1.05)
      const rr = R + rad * Math.cos(a)
      x = rr * Math.cos(u)
      y = rr * Math.sin(u)
      z = rad * Math.sin(a)
      heat = 0.1 + rand() * 0.13
    } else {
      // sparks thrown clear of the machine
      const a = rand() * Math.PI * 2
      const b = Math.acos(2 * rand() - 1)
      const rad = 0.7 + rand() * 1.5
      const sb = Math.sin(b)
      x = R * Math.cos(u) + sb * Math.cos(a) * rad
      y = R * Math.sin(u) + sb * Math.sin(a) * rad
      z = Math.cos(b) * rad * 0.7
      heat = 0.05 + rand() * 0.1
    }

    const o = i * 4
    out[o] = x * scale
    out[o + 1] = y * scale
    out[o + 2] = z * scale
    out[o + 3] = heat
    if (i % CHUNK === 0) yield
  }
}

/* ------------------------------------------------------------------ *
 * 1 — THE WORDS: "PRODUCT" / "ENGINEER" rasterised, sampled in column
 * order, given a slab of depth so the letterforms are volumes not decals.
 * ------------------------------------------------------------------ */
function rasterColumns(lines: string[], font: string, w: number, h: number): Int16Array | null {
  const cvs = document.createElement('canvas')
  cvs.width = w
  cvs.height = h
  const ctx = cvs.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const lh = h / lines.length
  for (let i = 0; i < lines.length; i++) {
    let size = lh * 0.84
    ctx.font = `800 ${size}px ${font}`
    const target = w * 0.94
    const m = ctx.measureText(lines[i]).width
    if (m > target) {
      size *= target / m
      ctx.font = `800 ${size}px ${font}`
    }
    ctx.fillText(lines[i], w / 2, lh * (i + 0.5))
  }
  const img = ctx.getImageData(0, 0, w, h).data
  let count = 0
  for (let k = 3; k < img.length; k += 4) if (img[k] > 128) count++
  if (count < 400) return null
  const pts = new Int16Array(count * 2)
  let j = 0
  // column-major scan → already sorted left to right
  for (let x = 0; x < w; x++)
    for (let y = 0; y < h; y++)
      if (img[(y * w + x) * 4 + 3] > 128) {
        pts[j++] = x
        pts[j++] = y
      }
  return pts
}

function* words(out: Float32Array, n: number, scale: number, font: string, wide: number) {
  const W = 900
  const H = 320
  const pts = rasterColumns(['PRODUCT', 'ENGINEER'], font, W, H)
  const rand = rng(0x9e3779b1)
  yield
  if (!pts) {
    for (let i = 0; i < n; i++) {
      const o = i * 4
      out[o] = (i / n - 0.5) * (wide + 0.4) * scale
      out[o + 1] = (rand() - 0.5) * 0.7 * scale
      out[o + 2] = (rand() - 0.5) * 0.3 * scale
      out[o + 3] = 0.35
      if (i % CHUNK === 0) yield
    }
    return
  }
  const m = pts.length / 2
  const aspect = W / H
  for (let i = 0; i < n; i++) {
    const k = Math.min(m - 1, (((i / n) * m) | 0)) * 2
    const px = pts[k] + rand() - 0.5
    const py = pts[k + 1] + rand() - 0.5
    const o = i * 4
    out[o] = (px / W - 0.5) * wide * scale
    out[o + 1] = -(py / H - 0.5) * (wide / aspect) * scale
    const d = (rand() + rand() + rand() - 1.5) / 1.5
    out[o + 2] = d * 0.5 * scale
    out[o + 3] = 0.2 + (1 - Math.abs(d)) * 0.24
    if (i % CHUNK === 0) yield
  }
}

/* ------------------------------------------------------------------ *
 * 2 — THE GLOBE: a sparse planet, the fifteen real cities lit, and great
 * circle arcs between them in the order he actually travelled. Bucket
 * sorted by x (O(n), no comparator) so the sweep stays coherent.
 * ------------------------------------------------------------------ */
function* globe(out: Float32Array, n: number, scale: number) {
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

/* ------------------------------------------------------------------ *
 * 3 — THE STACK: five edge-lit plates inside a cage of vertical bus
 * lines. The last chapter is about his stack, so the sculpture becomes
 * one — layers, not dust. Emitted in x order (a particle's index IS its
 * column), so the sweep out of the globe stays coherent with no sort.
 * ------------------------------------------------------------------ */
function* stack(out: Float32Array, n: number, scale: number) {
  const rand = rng(0xb5297a4d)
  const L = 5
  const R = 1.36
  const HH = 1.14
  for (let i = 0; i < n; i++) {
    const x = ((i + rand()) / n) * 2 * R - R
    const half = Math.sqrt(Math.max(0, R * R - x * x))
    const li = (rand() * L) | 0
    const ly = ((li / (L - 1)) * 2 - 1) * HH
    const roll = rand()
    let y: number
    let z: number
    let heat: number

    if (roll < 0.4) {
      // the rim of a plate — the bright edge that draws the layer
      z = (rand() < 0.5 ? -half : half) + 0.02 * (rand() + rand() - 1)
      y = ly + 0.018 * (rand() + rand() - 1)
      heat = 0.82 + rand() * 0.18
    } else if (roll < 0.68) {
      // the plate itself: a thin wafer, dimmest where it is thinnest
      z = (rand() * 2 - 1) * half * 0.97
      y = ly + 0.05 * (rand() + rand() - 1)
      heat = (0.1 + rand() * 0.2) * (0.3 + (0.7 * half) / R)
    } else if (roll < 0.9) {
      // the cage: bus lines running the full height at the silhouette
      z = (rand() < 0.5 ? -1 : 1) * half * (0.93 + rand() * 0.07)
      y = (rand() * 2 - 1) * HH * 1.04
      heat = 0.2 + rand() * 0.2
    } else {
      // loose dust, so the machine sits in air rather than on nothing
      z = (rand() * 2 - 1) * (half + 0.25 + rand() * 0.85)
      y = (rand() * 2 - 1) * (HH + 0.55)
      heat = 0.05 + rand() * 0.08
    }

    const o = i * 4
    out[o] = x * scale
    out[o + 1] = y * scale
    out[o + 2] = z * scale
    out[o + 3] = heat
    if (i % CHUNK === 0) yield
  }
}

export interface ShapeBuild {
  data: Float32Array
  /** spend up to budgetMs; returns true once every shape is finished */
  step(budgetMs: number): boolean
}

export function createShapeBuild(n: number, scale: number, font: string, wordWidth = 5.0): ShapeBuild {
  const data = new Float32Array(n * 4 * SHAPE_COUNT)
  const tasks = [
    coil(data.subarray(0, n * 4), n, scale),
    words(data.subarray(n * 4, n * 8), n, scale, font, wordWidth),
    globe(data.subarray(n * 8, n * 12), n, scale),
    stack(data.subarray(n * 12, n * 16), n, scale),
  ]
  let t = 0
  return {
    data,
    step(budgetMs) {
      const end = performance.now() + budgetMs
      while (t < tasks.length) {
        const r = tasks[t].next()
        if (r.done) t++
        if (performance.now() >= end) return t >= tasks.length
      }
      return true
    },
  }
}
