/**
 * One float buffer, one layout, both backends. WebGPU and WebGL2 read the exact
 * same bytes, so the two shaders can never drift on packing.
 *
 *   floats 0..15    four global vec4s
 *   floats 16..     six panes x six vec4s
 */
export const MAX_PANES = 6
export const PANE_VEC4 = 6
export const GLOBAL_VEC4 = 4
export const FLOAT_COUNT = GLOBAL_VEC4 * 4 + MAX_PANES * PANE_VEC4 * 4 // 160
export const BYTE_LENGTH = FLOAT_COUNT * 4 // 640

/** where pane `i` starts, in floats */
export const paneBase = (i: number) => GLOBAL_VEC4 * 4 + i * PANE_VEC4 * 4

export interface PaneUniform {
  /** homography rows: screen(canvas px) -> pane-local px */
  inv: Float32Array // 9, row-major
  halfW: number
  halfH: number
  radius: number
  color: [number, number, number]
  /** how hard the edge is lit, 0 = dark */
  lit: number
  centerX: number
  centerY: number
  /** how far the pane is pulled toward the camera, 0..1 */
  lift: number
  /** 0 = no glass body drawn (the keybed reads better unglazed) */
  glass: number
  /** volumetric shaft cast downward from the bottom edge */
  shaft: number
  /** pointer in pane-local px, and whether it is present */
  ptrX: number
  ptrY: number
  ptrOn: number
}

export function writeGlobals(
  f: Float32Array,
  resX: number,
  resY: number,
  time: number,
  power: number,
  /** the power-on scan: -1 when idle, else 0..1 across the screen */
  sweep: number,
  spare1: number,
  spare2: number,
  quality: number,
  scroll: number,
  camZ: number,
  fog: number,
  dpr: number,
) {
  f[0] = resX
  f[1] = resY
  f[2] = time
  f[3] = power
  f[4] = sweep
  f[5] = spare1
  f[6] = spare2
  f[7] = quality
  f[8] = scroll
  f[9] = camZ
  f[10] = fog
  f[11] = dpr
  f[12] = 0
  f[13] = 0
  f[14] = 0
  f[15] = 0
}

export function writePane(f: Float32Array, i: number, p: PaneUniform) {
  const b = paneBase(i)
  const m = p.inv
  f[b + 0] = m[0]
  f[b + 1] = m[1]
  f[b + 2] = m[2]
  f[b + 3] = p.halfW
  f[b + 4] = m[3]
  f[b + 5] = m[4]
  f[b + 6] = m[5]
  f[b + 7] = p.halfH
  f[b + 8] = m[6]
  f[b + 9] = m[7]
  f[b + 10] = m[8]
  f[b + 11] = p.radius
  f[b + 12] = p.color[0]
  f[b + 13] = p.color[1]
  f[b + 14] = p.color[2]
  f[b + 15] = p.lit
  f[b + 16] = p.centerX
  f[b + 17] = p.centerY
  f[b + 18] = p.lift
  f[b + 19] = p.glass
  f[b + 20] = p.shaft
  f[b + 21] = p.ptrX
  f[b + 22] = p.ptrY
  f[b + 23] = p.ptrOn
}

export function clearPane(f: Float32Array, i: number) {
  const b = paneBase(i)
  for (let k = 0; k < PANE_VEC4 * 4; k++) f[b + k] = 0
}
