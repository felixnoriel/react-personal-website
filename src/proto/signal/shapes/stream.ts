/**
 * SIGNAL shape 6 — the stream (the writing chapter): the core pours into a
 * tall column of falling filaments, like a feed. PLACEHOLDER geometry: the
 * writing owner refines this file.
 */
import { CHUNK, rng } from './index'
import type { ShapeGen } from './index'

export const stream: ShapeGen = function* (out, n, scale) {
  const rand = rng(0x57a3e4b1)
  const H = 1.7
  const W = 1.5
  for (let i = 0; i < n; i++) {
    const f = (i + rand() - 0.5) / n
    const x = (f * 2 - 1) * W
    const lane = Math.floor(rand() * 14)
    const roll = rand()
    let y: number
    let z: number
    let heat: number
    if (roll < 0.7) {
      // a falling filament: thin, bright at the head
      const t = rand()
      y = H - t * 2 * H
      z = ((lane / 13) * 2 - 1) * 0.5 + (rand() - 0.5) * 0.04
      heat = 0.22 + Math.pow(1 - t, 6) * 0.7
    } else {
      y = (rand() * 2 - 1) * H * 1.1
      z = (rand() * 2 - 1) * 0.9
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
