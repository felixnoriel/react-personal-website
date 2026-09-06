/** SIGNAL shape 0 — the core: a coil of light (the hero). */
import { CHUNK, rng } from './index'
import type { ShapeGen } from './index'

/* ------------------------------------------------------------------ *
 * 0 — THE CORE: a ring wound 21 times with a filament of light, plus a
 * razor-thin circle of current threading it. Not a torus knot, not a
 * sphere of dots: a coil, which is what a reactor actually looks like.
 * 62% filament, 8% the inner ring (white hot), 22% corona, 8% sparks.
 * ------------------------------------------------------------------ */
export const coil: ShapeGen = function* (out, n, scale) {
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
