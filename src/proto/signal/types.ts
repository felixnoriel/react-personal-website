/** SIGNAL — the contract every renderer tier honours. */

export type RGB = [number, number, number]

export interface CoreOpts {
  canvas: HTMLCanvasElement
  /** particles for this tier */
  count: number
  /** packed vec4 targets for all four shapes, shape s at offset s*count*4 */
  shapes: Float32Array
  /** colA electric, colB indigo, colC magenta, colD lime */
  palette: [RGB, RGB, RGB, RGB]
  exposure: number
  bloomThreshold: number
  bloomStrength: number
}

/** everything the main thread hands the GPU each frame */
export interface Frame {
  time: number
  dt: number
  /** 0..3 — a continuous slide across coil → words → globe → stack */
  morph: number
  /** 0..1 ignition ramp; also the master brightness gate */
  ignite: number
  spring: number
  damping: number
  flowAmp: number
  flowScale: number
  /** pointer in NDC (-1..1), plus its strength */
  px: number
  py: number
  pointer: number
  /** camera */
  dist: number
  fov: number
  tilt: number
  spin: number
  shiftX: number
  shiftY: number
  /** sprite radius in device px at w=1 */
  sizePx: number
  brightness: number
  /** how many particles to actually draw (adaptive quality) */
  active: number
  /** four shockwaves: x, y, z, age (age < 0 = idle) */
  waves: [number, number, number, number][]
}

export interface CoreHandle {
  label: string
  count: number
  resize(w: number, h: number): void
  frame(f: Frame): void
  destroy(): void
}
