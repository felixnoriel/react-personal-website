/**
 * SIGNAL shape 2 — the orbit (the experience chapter): nine rings, one per
 * role, newest and largest outside, each carrying a bright node where the
 * role's card points. PLACEHOLDER geometry: the experience owner refines
 * this file and keeps orbitNodes() in step with it.
 */
import { CHUNK, rng } from './index'
import type { ShapeGen } from './index'
import { ROLES } from '../../shared/content'

const RINGS = ROLES.length
const R0 = 0.42
const DR = 0.19

/** where each role's node sits (index 0 = newest role), sculpture units */
export function orbitNodes(scale = 1): [number, number, number][] {
  return ROLES.map((_, i) => {
    const r = R0 + (RINGS - 1 - i) * DR
    const a = (i / RINGS) * Math.PI * 2 + 0.4
    return [Math.cos(a) * r * scale, Math.sin(a) * r * 0.62 * scale, Math.sin(a * 2) * 0.12 * scale]
  })
}

export const orbit: ShapeGen = function* (out, n, scale) {
  const rand = rng(0x0b17a4d3)
  const nodes = orbitNodes(1)
  for (let i = 0; i < n; i++) {
    const f = (i + rand() - 0.5) / n
    const u = f * Math.PI * 2 * RINGS
    const ring = Math.min(RINGS - 1, Math.floor(f * RINGS))
    const r = R0 + (RINGS - 1 - ring) * DR
    const roll = rand()
    let x: number
    let y: number
    let z: number
    let heat: number
    if (roll < 0.78) {
      const th = 0.012 * (rand() + rand() - 1)
      x = Math.cos(u) * (r + th)
      y = Math.sin(u) * (r + th) * 0.62
      z = Math.sin(u * 3 + ring) * 0.05 + th
      heat = 0.28 + rand() * 0.2
    } else if (roll < 0.9) {
      // the node: a bright knot on the ring
      const p = nodes[ring]
      const s = 0.05 * Math.sqrt(-2 * Math.log(1 - rand() * 0.999))
      const a = rand() * Math.PI * 2
      x = p[0] + Math.cos(a) * s
      y = p[1] + Math.sin(a) * s
      z = p[2] + (rand() - 0.5) * 0.04
      heat = 0.9
    } else {
      x = Math.cos(u) * (r + (rand() - 0.5) * 0.3)
      y = Math.sin(u) * (r + (rand() - 0.5) * 0.3) * 0.62
      z = (rand() - 0.5) * 0.5
      heat = 0.08 + rand() * 0.08
    }
    const o = i * 4
    out[o] = x * scale
    out[o + 1] = y * scale
    out[o + 2] = z * scale
    out[o + 3] = heat
    if (i % CHUNK === 0) yield
  }
}
