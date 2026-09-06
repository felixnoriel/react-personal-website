/**
 * SIGNAL shape 7 — the beam (the contact chapter): the whole core condenses
 * into one vertical signal, a bright pulse at its heart. PLACEHOLDER
 * geometry: the contact owner refines this file.
 */
import { CHUNK, rng } from './index'
import type { ShapeGen } from './index'

export const beam: ShapeGen = function* (out, n, scale) {
  const rand = rng(0xbea41f07)
  const H = 1.9
  for (let i = 0; i < n; i++) {
    const f = (i + rand() - 0.5) / n
    const roll = rand()
    let x: number
    let y: number
    let z: number
    let heat: number
    if (roll < 0.5) {
      // the beam
      const th = 0.02 * Math.sqrt(-2 * Math.log(1 - rand() * 0.999))
      const a = rand() * Math.PI * 2
      x = (f * 2 - 1) * 0.06 + Math.cos(a) * th
      y = (rand() * 2 - 1) * H
      z = Math.sin(a) * th
      heat = 0.6 + rand() * 0.4
    } else if (roll < 0.62) {
      // the heart
      const s = 0.1 * Math.sqrt(-2 * Math.log(1 - rand() * 0.999))
      const a = rand() * Math.PI * 2
      const b = Math.acos(2 * rand() - 1)
      x = Math.sin(b) * Math.cos(a) * s
      y = Math.sin(b) * Math.sin(a) * s
      z = Math.cos(b) * s
      heat = 1
    } else {
      // a wide, dim halo
      const s = 0.9 * Math.sqrt(-2 * Math.log(1 - rand() * 0.999))
      const a = rand() * Math.PI * 2
      x = (f * 2 - 1) * 1.6 + Math.cos(a) * s * 0.3
      y = (rand() * 2 - 1) * H * 1.2
      z = Math.sin(a) * s * 0.3
      heat = 0.04 + rand() * 0.06
    }
    const o = i * 4
    out[o] = x * scale
    out[o + 1] = y * scale
    out[o + 2] = z * scale
    out[o + 3] = heat
    if (i % CHUNK === 0) yield
  }
}
