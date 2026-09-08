/** SIGNAL shape 3 — THE BENCH (the work chapter).
 *
 * Three lit product cells standing on one bus. Each cell is a thin slab with
 * a hard bright rim, a substrate of dim traces, a row of pins dropping to the
 * lower rail, and one bright signal running across its face — a different
 * waveform per product, because each one moves a different kind of traffic.
 * Ribbon cable links the cells; the whole bench floats in a little dust.
 *
 * Emitted strictly in x order (a particle's index IS its column), so the
 * morph out of the orbit and on into the constellation stays coherent with
 * no sort. cellPoints()/busPoints() below are the anchors the section hovers
 * and pins labels to — keep them in step with the geometry.
 */
import { CHUNK, rng } from './index'
import type { ShapeGen } from './index'

/* ---- geometry, in sculpture units ---- */
/** the three cell centres, left to right: StablePay, Genopets, Dashify */
const CX = [-0.92, 0, 0.92]
/** half width / height / depth of one cell */
const HW = 0.36
const HH = 0.46
const HD = 0.15
/** the two bus rails, above and below the bench */
const RAIL = 0.78
/** how far the sweep runs past the outermost cell */
const XMAX = 1.5
/** the current product burns brightest */
const HEAT = [1, 0.94, 0.88]
/** the outer edge of the bench */
const SPAN = CX[2] + HW

/** the signal across a cell's face: a different waveform per product */
function trace(c: number, u: number): number {
  // 0 — payments: a clean pulse train, one packet after another
  if (c === 0) return Math.tanh(Math.sin(u * Math.PI * 2.4) * 3.4) * 0.52
  // 1 — events: a dense stream that swells as the pipeline fills
  if (c === 1) return Math.sin(u * Math.PI * 6.5) * (0.2 + 0.25 * (u + 1))
  // 2 — venues: a staircase, one step per room brought on
  return (Math.floor((u + 1) * 2.5) / 2.5 - 1) * 0.55
}

/** cheap deterministic hash, so the gaps in the substrate stay put every build */
function gap(a: number, b: number): number {
  const s = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453
  return s - Math.floor(s)
}

export const cells: ShapeGen = function* (out, n, scale) {
  const rand = rng(0x2f9a13c7)
  for (let i = 0; i < n; i++) {
    const x = ((i + rand()) / n) * 2 * XMAX - XMAX
    let c = -1
    for (let k = 0; k < 3; k++) if (Math.abs(x - CX[k]) <= HW) c = k
    const u = c >= 0 ? (x - CX[c]) / HW : 0
    const h0 = c >= 0 ? HEAT[c] : 0.85
    const outside = Math.abs(x) > SPAN

    let y: number
    let z: number
    let heat: number
    const roll = rand()

    // ---- the bus: two rails the whole length, densest between the cells
    const railShare = c >= 0 ? 0.1 : outside ? 0.2 : 0.42
    if (roll < railShare) {
      const taper = outside ? 1 - Math.min(1, (Math.abs(x) - SPAN) / (XMAX - SPAN)) : 1
      y = (rand() < 0.5 ? -1 : 1) * (RAIL + 0.014 * (rand() + rand() - 1))
      z = 0.07 * (rand() + rand() - 1)
      heat = (0.42 + rand() * 0.32) * (0.35 + 0.65 * taper)
    } else if (c < 0) {
      // ---- between the cells: ribbon cable. Past them: dust.
      if (!outside && roll < railShare + 0.42) {
        const li = (rand() * 5) | 0
        y = (li / 4 - 0.5) * 2 * HH * 0.66 + 0.008 * (rand() + rand() - 1)
        z = (rand() < 0.5 ? -1 : 1) * HD * 0.6 + 0.02 * (rand() + rand() - 1)
        heat = 0.34 + rand() * 0.2
      } else {
        const w = outside ? 1 + (Math.abs(x) - SPAN) * 1.6 : 1
        y = (rand() * 2 - 1) * (RAIL + 0.28) * w
        z = (rand() * 2 - 1) * (HD + 0.5) * w
        heat = 0.04 + rand() * 0.08
      }
    } else if (Math.abs(u) > 0.9) {
      // ---- the left and right edges of a cell: the vertical rim
      const r = (roll - railShare) / (1 - railShare)
      if (r < 0.58) {
        y = (rand() * 2 - 1) * HH
        z = (rand() < 0.5 ? -1 : 1) * HD + 0.012 * (rand() + rand() - 1)
        heat = (0.86 + rand() * 0.14) * h0
      } else if (r < 0.78) {
        y = (rand() * 2 - 1) * HH
        z = (rand() * 2 - 1) * HD
        heat = (0.22 + rand() * 0.16) * h0
      } else {
        y = (rand() * 2 - 1) * HH * 1.1
        z = (rand() * 2 - 1) * (HD + 0.16)
        heat = 0.05 + rand() * 0.07
      }
    } else {
      // ---- the face of a cell
      const r = (roll - railShare) / (1 - railShare)
      if (r < 0.3) {
        // the hard edge, top and bottom — what draws the plate
        y = (rand() < 0.5 ? -1 : 1) * HH + 0.011 * (rand() + rand() - 1)
        z = (rand() < 0.5 ? -1 : 1) * HD + 0.013 * (rand() + rand() - 1)
        heat = (0.9 + rand() * 0.1) * h0
      } else if (r < 0.52) {
        // the substrate: seven dim traces with gaps punched out of them
        const li = (rand() * 7) | 0
        if (gap(li, Math.floor(u * 11)) < 0.24) {
          y = (rand() * 2 - 1) * HH * 1.04
          z = (rand() * 2 - 1) * (HD + 0.1)
          heat = 0.05 + rand() * 0.07
        } else {
          y = (li / 6 - 0.5) * 2 * HH * 0.74 + 0.007 * (rand() + rand() - 1)
          z = (rand() < 0.5 ? -1 : 1) * HD * 0.94
          heat = (0.2 + rand() * 0.16) * h0
        }
      } else if (r < 0.74) {
        // the signal: one bright line across the face
        y = trace(c, u) * HH + 0.015 * (rand() + rand() - 1)
        z = 0.035 * (rand() + rand() - 1)
        heat = (0.88 + rand() * 0.12) * h0
      } else if (r < 0.82) {
        // pins: nine stubs dropping from the plate to the lower rail
        if ((((u + 1) * 9) | 0) % 2 === 0) {
          y = -HH - rand() * (RAIL - HH)
          z = 0.03 * (rand() + rand() - 1)
          heat = (0.34 + rand() * 0.24) * h0
        } else {
          y = (rand() * 2 - 1) * HH * 1.06
          z = (rand() * 2 - 1) * (HD + 0.12)
          heat = 0.05 + rand() * 0.07
        }
      } else {
        // the volume the plate sits inside
        y = (rand() * 2 - 1) * HH * 1.08
        z = (rand() * 2 - 1) * (HD + 0.2)
        heat = 0.05 + rand() * 0.08
      }
    }

    const o = i * 4
    out[o] = x * scale
    out[o + 1] = y * scale
    out[o + 2] = z * scale
    out[o + 3] = heat
    if (i % CHUNK === 0) yield
  }
}

/** the centre of each featured product's cell, in sculpture units */
export function cellPoints(scale = 1): [number, number, number][] {
  return CX.map((x) => [x * scale, 0, 0.16 * scale] as [number, number, number])
}

/** six stops along the lower bus — one per project in the compact grid */
export function busPoints(scale = 1): [number, number, number][] {
  return Array.from(
    { length: 6 },
    (_, i) => [(-1.15 + (i * 2.3) / 5) * scale, -RAIL * scale, 0.08 * scale] as [number, number, number],
  )
}
