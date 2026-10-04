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
  /** first visit: every particle starts in one point and is blown out by the ignition wave */
  bang: boolean
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
  /** when set, the gravity well sits at this sculpture-space point instead of under the pointer */
  well?: [number, number, number]
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
  /** how hard each shockwave hits (1 = a click) */
  waveK: [number, number, number, number]
  /** seconds since the ignition began (drives the WebGL2 tier's analytic big bang) */
  bangT: number
  /** 0..1 how much the held pointer has charged the well */
  charge: number
  /** vertical streak length in device px from the scroll speed */
  warp: number
  /** the gravitational lens at the pointer: x, y (0..1, y down), strength, Einstein radius (fraction of the height) */
  lens: [number, number, number, number]
  /** a flash of light: x, y (0..1, y down), intensity, radius (fraction of the height) */
  flash: [number, number, number, number]
  /** extra lateral chromatic spread on the halo */
  chroma: number
}

export interface CoreHandle {
  label: string
  count: number
  resize(w: number, h: number): void
  frame(f: Frame): void
  /** replace the morph targets (the shapes finish building after ignition) */
  updateTargets(shapes: Float32Array): void
  destroy(): void
}
