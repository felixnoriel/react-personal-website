/**
 * SIGNAL — the morph targets, in page order.
 *
 * Every particle keeps its index across all shapes, so the mapping IS the
 * choreography: each generator emits points in a left-to-right sweep
 * (arc-length, raster columns or an x bucket sort), so particle i sits at
 * roughly the same horizontal fraction in every shape and a morph reads as
 * one object unrolling into the next.
 *
 * Layout: a flat Float32Array of vec4 (x, y, z, heat), shape s at s*n*4.
 * Each generator yields every CHUNK particles so the build can run in idle
 * slices without ever blocking a frame.
 */

export const CHUNK = 2000

/** deterministic xorshift so every tier draws the same sculpture */
export function rng(seed: number) {
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

export interface ShapeCtx {
  /** the page's body font, for the raster of the words */
  font: string
  /** how wide the words pose is, in sculpture units */
  wordWidth: number
  /** true on a phone layout: shapes may pack tighter */
  phone: boolean
}

export type ShapeGen = (out: Float32Array, n: number, scale: number, ctx: ShapeCtx) => Generator<void, void, unknown>

import { coil } from './coil'
import { words } from './words'
import { orbit } from './orbit'
import { cells } from './cells'
import { constellation } from './constellation'
import { globe } from './globe'
import { stream } from './stream'
import { beam } from './beam'

/** page order; a section's data-shape attribute is an index into this list */
export const SHAPES: ShapeGen[] = [coil, words, orbit, cells, constellation, globe, stream, beam]
export const SHAPE = {
  coil: 0,
  words: 1,
  orbit: 2,
  cells: 3,
  constellation: 4,
  globe: 5,
  stream: 6,
  beam: 7,
} as const
export const SHAPE_COUNT = SHAPES.length
