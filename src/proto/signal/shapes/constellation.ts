/**
 * SIGNAL shape 4 — the constellation (the skills chapter): fifty-six nodes
 * on a sphere, one per tool, brighter and larger the more years behind it,
 * hollow for the three legacy tools, with faint filaments between tools of
 * the same domain. PLACEHOLDER geometry: the skills owner refines this and
 * keeps constellationNodes() in step with it.
 */
import { CHUNK, rng } from './index'
import type { ShapeGen } from './index'
import { TOOLS } from '../../shared/content'

const R = 1.42

/** one point per tool, in TOOLS order (fibonacci sphere), sculpture units */
export function constellationNodes(scale = 1): [number, number, number][] {
  const m = TOOLS.length
  const ga = Math.PI * (3 - Math.sqrt(5))
  return TOOLS.map((_, i) => {
    const y = 1 - (i / (m - 1)) * 2
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const th = ga * i
    return [Math.cos(th) * r * R * scale, y * R * scale, Math.sin(th) * r * R * scale]
  })
}

export const constellation: ShapeGen = function* (out, n, scale) {
  const rand = rng(0xc0a57e11)
  const nodes = constellationNodes(1)
  const m = nodes.length
  const tmp = new Float32Array(n * 4)
  for (let i = 0; i < n; i++) {
    const k = Math.min(m - 1, Math.floor(rand() * m))
    const p = nodes[k]
    const yrs = TOOLS[k].years
    const roll = rand()
    let x: number
    let y: number
    let z: number
    let heat: number
    if (roll < 0.55) {
      // the node: a soft knot whose size follows the years
      const s = (0.03 + yrs * 0.006) * Math.sqrt(-2 * Math.log(1 - rand() * 0.999))
      const a = rand() * Math.PI * 2
      const b = Math.acos(2 * rand() - 1)
      x = p[0] + Math.sin(b) * Math.cos(a) * s
      y = p[1] + Math.sin(b) * Math.sin(a) * s
      z = p[2] + Math.cos(b) * s
      heat = TOOLS[k].legacy ? 0.18 : 0.45 + Math.min(1, yrs / 11) * 0.5
    } else if (roll < 0.85) {
      // a filament to a neighbour in the same domain
      let j = k
      for (let t = 0; t < 8; t++) {
        const c = Math.min(m - 1, Math.floor(rand() * m))
        if (TOOLS[c].domain === TOOLS[k].domain && c !== k) {
          j = c
          break
        }
      }
      const q = nodes[j]
      const f = rand()
      x = p[0] + (q[0] - p[0]) * f
      y = p[1] + (q[1] - p[1]) * f
      z = p[2] + (q[2] - p[2]) * f
      const len = Math.hypot(x, y, z) || 1
      const lift = R * (1 + 0.06 * Math.sin(Math.PI * f))
      x = (x / len) * lift
      y = (y / len) * lift
      z = (z / len) * lift
      heat = 0.12 + Math.sin(Math.PI * f) * 0.1
    } else {
      // dust inside the sphere
      const a = rand() * Math.PI * 2
      const yy = 2 * rand() - 1
      const rr = Math.sqrt(1 - yy * yy) * R * Math.cbrt(rand())
      x = Math.cos(a) * rr
      y = yy * R * Math.cbrt(rand())
      z = Math.sin(a) * rr
      heat = 0.05 + rand() * 0.06
    }
    const o = i * 4
    tmp[o] = x
    tmp[o + 1] = y
    tmp[o + 2] = z
    tmp[o + 3] = heat
    if (i % CHUNK === 0) yield
  }
  // bucket sort by x so the sweep matches the other shapes
  const B = 1024
  const counts = new Uint32Array(B + 1)
  const bin = new Uint16Array(n)
  const inv = (B - 1) / (2 * R * 1.2)
  for (let i = 0; i < n; i++) {
    let k = ((tmp[i * 4] + R * 1.2) * inv) | 0
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
