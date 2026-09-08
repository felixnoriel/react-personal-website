/**
 * SIGNAL shape 4 — the constellation (the skills chapter).
 *
 * Fifty-six stars on a sphere, one per tool, in TOOLS order. Because a
 * Fibonacci sphere walks its points from pole to pole in index order, the
 * three domains land as three latitude bands — front end on top, back end
 * through the middle, infrastructure underneath — which is the way the
 * stack actually sits. Node size and brightness follow the years behind
 * the tool; the three legacy tools are hollow shells instead of solid
 * knots; faint filaments run along the same neighbour graph the section's
 * crisp overlay draws, so the sharp line and the soft one are the same
 * line.
 *
 * Two layouts share one longitude sequence, so a domain filter is a pure
 * latitude stretch and every star travels a short, readable arc:
 *   constellationNodes()  — all 56 spread over the whole sphere
 *   constellationSpread() — each domain spread over the whole sphere
 */
import { CHUNK, rng } from './index'
import type { ShapeGen } from './index'
import { TOOLS } from '../../shared/content'
import type { Domain } from '../../shared/content'

export type P3 = [number, number, number]

/** the sphere the stars sit on, in sculpture units */
export const NODE_R = 1.46
/** a phone sits the camera further back but the screen is narrower — the
 *  sphere shrinks so the sky keeps a margin either side */
export const PHONE_SCALE = 0.86

const M = TOOLS.length
const GA = Math.PI * (3 - Math.sqrt(5))

/** deterministic jitter, so the sky reads grown rather than machined */
const J = (() => {
  const r = rng(0x5eed51)
  const a = new Float64Array(M * 2)
  for (let i = 0; i < a.length; i++) a[i] = r() * 2 - 1
  return a
})()

/** each tool's rank inside its own domain, and how many that domain holds */
const RANK = new Int32Array(M)
const SIZE: Record<Domain, number> = { frontend: 0, backend: 0, infra: 0 }
for (let i = 0; i < M; i++) {
  const d = TOOLS[i].domain
  RANK[i] = SIZE[d]
  SIZE[d] = SIZE[d] + 1
}

/**
 * point k of n on a Fibonacci sphere, but with tool i's longitude — the
 * two layouts keep the same angle so a re-form only slides latitude.
 */
function shell(k: number, n: number, i: number): P3 {
  let y = 1 - (2 * (k + 0.5)) / n + (J[i * 2] * 0.66) / n
  if (y > 0.997) y = 0.997
  else if (y < -0.997) y = -0.997
  const r = Math.sqrt(1 - y * y)
  const th = GA * i + J[i * 2 + 1] * 0.06
  return [Math.cos(th) * r, y, Math.sin(th) * r]
}

const at = (p: P3, s: number): P3 => [p[0] * s, p[1] * s, p[2] * s]

/** one point per tool, in TOOLS order (the "all" sky), sculpture units */
export function constellationNodes(scale = 1): P3[] {
  return TOOLS.map((_, i) => at(shell(i, M, i), NODE_R * scale))
}

/** one point per tool when its own domain fills the whole sphere */
export function constellationSpread(scale = 1): P3[] {
  return TOOLS.map((t, i) => at(shell(RANK[i], SIZE[t.domain], i), NODE_R * 1.04 * scale))
}

/** the middle of a domain's band, pulled inside the shell (a gravity well) */
export function domainCenter(d: Domain, scale = 1): P3 {
  const p = constellationNodes(1)
  let x = 0
  let y = 0
  let z = 0
  let n = 0
  for (let i = 0; i < M; i++) {
    if (TOOLS[i].domain !== d) continue
    x += p[i][0]
    y += p[i][1]
    z += p[i][2]
    n++
  }
  const len = Math.hypot(x, y, z) || 1
  const k = (NODE_R * 0.62 * scale) / len
  void n
  return [x * k, y * k, z * k]
}

/** the constellation figure: every tool linked to its two nearest same-domain neighbours */
export function constellationEdges(): [number, number][] {
  const p = constellationNodes(1)
  const seen = new Set<number>()
  const out: [number, number][] = []
  const near: [number, number][] = []
  for (let i = 0; i < M; i++) {
    near.length = 0
    for (let j = 0; j < M; j++) {
      if (j === i || TOOLS[j].domain !== TOOLS[i].domain) continue
      const dx = p[i][0] - p[j][0]
      const dy = p[i][1] - p[j][1]
      const dz = p[i][2] - p[j][2]
      near.push([dx * dx + dy * dy + dz * dz, j])
    }
    near.sort((a, b) => a[0] - b[0])
    for (let k = 0; k < Math.min(2, near.length); k++) {
      const j = near[k][1]
      const a = i < j ? i : j
      const b = i < j ? j : i
      const key = a * 64 + b
      if (seen.has(key)) continue
      seen.add(key)
      out.push([a, b])
    }
  }
  return out
}

/* ---------------------------------------------------------------- the swarm */

/** how much of the swarm each star earns: years, halved for a legacy tool */
const WEIGHT = TOOLS.map((t) => (t.legacy ? 0.5 : 1) * (0.55 + t.years * 0.15))
/** O(1) weighted pick */
const PICK = (() => {
  const total = WEIGHT.reduce((a, b) => a + b, 0)
  const table = new Uint8Array(2048)
  let acc = 0
  let k = 0
  for (let i = 0; i < M; i++) {
    acc += WEIGHT[i] / total
    const end = Math.min(2048, Math.round(acc * 2048))
    while (k < end) table[k++] = i
  }
  while (k < 2048) table[k++] = M - 1
  return table
})()

export const constellation: ShapeGen = function* (out, n, scale, ctx) {
  const rand = rng(0xc0a57e11)
  const k = ctx.phone ? PHONE_SCALE : 1
  const RR = NODE_R * k
  const nodes = constellationNodes(k)
  const edges = constellationEdges()
  const ec = edges.length
  const tmp = new Float32Array(n * 4)

  for (let i = 0; i < n; i++) {
    const roll = rand()
    let x: number
    let y: number
    let z: number
    let heat: number

    if (roll < 0.34) {
      // a star: a soft knot whose size follows the years, hollow if legacy
      const k = PICK[(rand() * 2048) | 0]
      const p = nodes[k]
      const t = TOOLS[k]
      const a = rand() * Math.PI * 2
      const b = Math.acos(2 * rand() - 1)
      const sb = Math.sin(b)
      let s: number
      if (t.legacy) {
        // a shell, not a ball — the tool is an outline of itself now
        s = 0.052 * k * (0.92 + rand() * 0.1)
        heat = 0.08 + rand() * 0.03
      } else {
        // Brightness here is DENSITY, not heat: the swarm crowds a long-service
        // tool and thins out around a new one. Heat stays low on purpose —
        // a compact, high-heat knot saturates the bloom into a visible block.
        s = (0.03 + t.years * 0.006) * k * Math.sqrt(-2 * Math.log(1 - rand() * 0.999))
        heat = 0.14 + Math.min(1, t.years / 11) * 0.34
      }
      x = p[0] + sb * Math.cos(a) * s
      y = p[1] + Math.cos(b) * s
      z = p[2] + sb * Math.sin(a) * s
    } else if (roll < 0.68 && ec > 0) {
      // a filament along the constellation figure, bowed outward like a wire
      const e = edges[(rand() * ec) | 0]
      const p = nodes[e[0]]
      const q = nodes[e[1]]
      const f = rand()
      const bow = Math.sin(Math.PI * f)
      x = p[0] + (q[0] - p[0]) * f
      y = p[1] + (q[1] - p[1]) * f
      z = p[2] + (q[2] - p[2]) * f
      const len = Math.hypot(x, y, z) || 1
      const lift = (RR * (1 + 0.05 * bow)) / len
      const w = (rand() - 0.5) * 0.012 * k
      x = x * lift + w
      y = y * lift + w * 0.6
      z = z * lift
      heat = 0.075 + bow * 0.09
    } else if (roll < 0.85) {
      // the sky itself: a thin haze on the shell, so the sphere reads round
      const a = rand() * Math.PI * 2
      const yy = 2 * rand() - 1
      const rr = Math.sqrt(1 - yy * yy)
      const lift = RR * (1.0 + (rand() - 0.5) * 0.05)
      x = Math.cos(a) * rr * lift
      y = yy * lift
      z = Math.sin(a) * rr * lift
      heat = 0.04 + rand() * 0.035
    } else {
      // dust inside the sphere, so the volume is not an empty shell
      const a = rand() * Math.PI * 2
      const yy = 2 * rand() - 1
      const cb = Math.cbrt(rand())
      const rr = Math.sqrt(1 - yy * yy) * RR * cb
      x = Math.cos(a) * rr
      y = yy * RR * cb
      z = Math.sin(a) * rr
      heat = 0.03 + rand() * 0.045
    }

    const o = i * 4
    tmp[o] = x
    tmp[o + 1] = y
    tmp[o + 2] = z
    tmp[o + 3] = heat
    if (i % CHUNK === 0) yield
  }

  // bucket sort by x so the sweep matches every other shape and the morph
  // reads as one object unrolling
  const B = 1024
  const counts = new Uint32Array(B + 1)
  const bin = new Uint16Array(n)
  const inv = (B - 1) / (2 * RR * 1.2)
  for (let i = 0; i < n; i++) {
    let bk = ((tmp[i * 4] + RR * 1.2) * inv) | 0
    if (bk < 0) bk = 0
    else if (bk >= B) bk = B - 1
    bin[i] = bk
    counts[bk + 1]++
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
