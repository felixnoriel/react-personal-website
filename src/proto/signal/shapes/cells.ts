/** SIGNAL shape 3 — the cells (the work chapter). PLACEHOLDER: the old five-plate
 * stack; the work owner replaces this with product cells and exports cellPoints(). */
import { CHUNK, rng } from './index'
import type { ShapeGen } from './index'

/* ------------------------------------------------------------------ *
 * 3 — THE STACK: five edge-lit plates inside a cage of vertical bus
 * lines. The last chapter is about his stack, so the sculpture becomes
 * one — layers, not dust. Emitted in x order (a particle's index IS its
 * column), so the sweep out of the globe stays coherent with no sort.
 * ------------------------------------------------------------------ */
export const cells: ShapeGen = function* (out, n, scale) {
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

/** anchor points for the featured products, in sculpture units */
export function cellPoints(scale = 1): [number, number, number][] {
  return [-1.14, 0, 1.14].map((y) => [0, y * scale, 0])
}
