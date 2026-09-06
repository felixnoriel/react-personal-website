/**
 * SIGNAL — the scene API every section talks to.
 *
 * main.ts owns the render loop and fills these fields each frame; sections
 * read them, anchor HTML labels to points of the sculpture, pull the swarm
 * toward a hovered target, fire pulses and subscribe to frames. Nothing in
 * here touches the GPU directly.
 */
import { SHAPE } from './shapes/index'

export type Vec3 = [number, number, number]

export interface FrameInfo {
  /** continuous morph value (shape index with fraction) */
  morph: number
  /** the chapter currently on screen */
  chapter: number
  time: number
  dt: number
  scrollY: number
}

export interface AnchorOpts {
  /** pixel offset from the projected point */
  offset?: [number, number]
  /** how quickly the label fades as the morph leaves the shape (default 1.4) */
  fade?: number
  /** keep the element in the flow, only update the CSS variables --ax/--ay/--aw (default: the scene sets transform/opacity) */
  manual?: boolean
}

export interface Projected {
  x: number
  y: number
  /** clip w: larger = farther; <= 0 = behind the camera */
  w: number
  /** 0..1, 1 = nearest */
  depth: number
  visible: boolean
}

export interface Scene {
  readonly reduced: boolean
  readonly phone: boolean
  readonly coarse: boolean
  readonly SHAPE: typeof SHAPE
  /** the last frame's values */
  frame: FrameInfo
  /** has the GPU tier ignited (false on the CSS tier) */
  live: boolean
  /** project a sculpture-space point to viewport pixels */
  project(p: Vec3): Projected
  /** anchor an element to a sculpture point while `shape` is near-active; returns a release fn */
  anchor(el: HTMLElement, point: Vec3, shape: number, opts?: AnchorOpts): () => void
  /** pull the swarm to a sculpture point (a hovered role, tool, city); null releases */
  setWell(p: Vec3 | null, strength?: number): void
  /** a shockwave from a sculpture point (default: the current well) */
  fire(p?: Vec3): void
  /** add spin velocity to the sculpture (drag to orbit) */
  spin(dx: number, dy: number): void
  /** per-frame callback; returns an unsubscribe fn */
  onFrame(cb: (f: FrameInfo) => void): () => void
  /** print a telemetry cell in the rail (measured values only) */
  print(key: string, value: string, hot?: boolean): void
}

interface AnchorRec {
  el: HTMLElement
  point: Vec3
  shape: number
  opts: AnchorOpts
}

export interface SceneControls {
  well: { p: Vec3 | null; strength: number }
  fire: (p?: Vec3) => void
  spin: (dx: number, dy: number) => void
  print: (key: string, value: string, hot?: boolean) => void
  /** the current view-projection matrix, written by main.ts each frame */
  vp: Float32Array | null
  width: number
  height: number
}

export function createScene(env: { reduced: boolean; phone: boolean; coarse: boolean }, ctl: SceneControls) {
  const anchors = new Set<AnchorRec>()
  const subs = new Set<(f: FrameInfo) => void>()

  const scene: Scene & { _tick(f: FrameInfo): void } = {
    reduced: env.reduced,
    phone: env.phone,
    coarse: env.coarse,
    SHAPE,
    frame: { morph: 0, chapter: 0, time: 0, dt: 0, scrollY: 0 },
    live: false,
    project(p) {
      const vp = ctl.vp
      if (!vp) return { x: 0, y: 0, w: 0, depth: 0, visible: false }
      const cx = vp[0] * p[0] + vp[4] * p[1] + vp[8] * p[2] + vp[12]
      const cy = vp[1] * p[0] + vp[5] * p[1] + vp[9] * p[2] + vp[13]
      const cw = vp[3] * p[0] + vp[7] * p[1] + vp[11] * p[2] + vp[15]
      if (cw <= 0.05) return { x: 0, y: 0, w: cw, depth: 0, visible: false }
      const nx = cx / cw
      const ny = cy / cw
      return {
        x: (nx * 0.5 + 0.5) * ctl.width,
        y: (0.5 - ny * 0.5) * ctl.height,
        w: cw,
        depth: Math.max(0, Math.min(1, 1 - (cw - 3) / 8)),
        visible: nx > -1.15 && nx < 1.15 && ny > -1.15 && ny < 1.15,
      }
    },
    anchor(el, point, shape, opts = {}) {
      const rec: AnchorRec = { el, point, shape, opts }
      anchors.add(rec)
      el.style.willChange = 'transform, opacity'
      return () => {
        anchors.delete(rec)
        el.style.willChange = ''
      }
    },
    setWell(p, strength = 1) {
      ctl.well.p = p
      ctl.well.strength = strength
    },
    fire(p) {
      ctl.fire(p)
    },
    spin(dx, dy) {
      ctl.spin(dx, dy)
    },
    onFrame(cb) {
      subs.add(cb)
      return () => subs.delete(cb)
    },
    print(key, value, hot) {
      ctl.print(key, value, hot)
    },
    _tick(f) {
      this.frame = f
      for (const a of anchors) {
        const near = 1 - Math.abs(f.morph - a.shape) * (a.opts.fade ?? 1.4)
        if (near <= 0) {
          if (a.el.style.opacity !== '0') {
            a.el.style.opacity = '0'
            a.el.style.visibility = 'hidden'
          }
          continue
        }
        const q = this.project(a.point)
        if (!q.visible) {
          a.el.style.opacity = '0'
          a.el.style.visibility = 'hidden'
          continue
        }
        const ox = a.opts.offset?.[0] ?? 0
        const oy = a.opts.offset?.[1] ?? 0
        const alpha = Math.min(1, near) * (0.35 + 0.65 * q.depth)
        if (a.opts.manual) {
          a.el.style.setProperty('--ax', `${(q.x + ox).toFixed(1)}px`)
          a.el.style.setProperty('--ay', `${(q.y + oy).toFixed(1)}px`)
          a.el.style.setProperty('--aw', q.depth.toFixed(3))
          a.el.style.setProperty('--aa', alpha.toFixed(3))
          a.el.style.visibility = 'visible'
          a.el.style.opacity = ''
        } else {
          a.el.style.transform = `translate3d(${(q.x + ox).toFixed(1)}px, ${(q.y + oy).toFixed(1)}px, 0)`
          a.el.style.opacity = alpha.toFixed(3)
          a.el.style.visibility = 'visible'
        }
      }
      for (const cb of subs) cb(f)
    },
  }
  return scene
}
