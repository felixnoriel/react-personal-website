/**
 * The deck's geometry: real DOM panes placed in a real perspective scene.
 *
 * The whole projection is computed here rather than left to nested CSS 3D
 * transforms, for one reason: the GPU field has to know exactly where each
 * pane's four corners land on screen so it can draw the glass under the text.
 * Owning the matrix means the DOM and the shader can never disagree by a
 * pixel. Each pane gets one `matrix3d()` that already contains the camera,
 * so there is no parent `perspective` to double up on.
 */

export type Mat4 = Float64Array

const RAD = Math.PI / 180

export function ident(): Mat4 {
  const m = new Float64Array(16)
  m[0] = m[5] = m[10] = m[15] = 1
  return m
}
/** out = a * b (column-major, m[col*4+row]) */
export function mul(a: Mat4, b: Mat4, out: Mat4): Mat4 {
  for (let c = 0; c < 4; c++) {
    const b0 = b[c * 4],
      b1 = b[c * 4 + 1],
      b2 = b[c * 4 + 2],
      b3 = b[c * 4 + 3]
    for (let r = 0; r < 4; r++) {
      out[c * 4 + r] = a[r] * b0 + a[4 + r] * b1 + a[8 + r] * b2 + a[12 + r] * b3
    }
  }
  return out
}

export class Spring {
  v = 0
  x: number
  k: number
  c: number
  constructor(x: number, k = 172, c = 19) {
    this.x = x
    this.k = k
    this.c = c
  }
  step(target: number, dt: number) {
    const n = dt > 0.019 ? 3 : 1
    const h = dt / n
    for (let i = 0; i < n; i++) {
      this.v += (-this.k * (this.x - target) - this.c * this.v) * h
      this.x += this.v * h
    }
  }
  set(x: number) {
    this.x = x
    this.v = 0
  }
}

export interface PaneModel {
  el: HTMLElement
  key: string
  color: [number, number, number]
  baseZ: number
  baseRx: number
  baseRy: number
  glass: number
  shaft: number
  radius: number
  /** untransformed page box, refreshed on resize only */
  px: number
  py: number
  w: number
  h: number
  z: Spring
  rx: Spring
  ry: Spring
  dx: Spring
  dy: Spring
  lit: Spring
  held: boolean
  hover: boolean
  grabX: number
  grabY: number
  /** screen-space corners, CSS px, filled every frame */
  quad: Float64Array
  /** homography: screen CSS px -> pane-local CSS px */
  inv: Float32Array
}

export function pageBox(el: HTMLElement) {
  let x = 0
  let y = 0
  let n: HTMLElement | null = el
  while (n) {
    x += n.offsetLeft
    y += n.offsetTop
    const p = n.offsetParent as HTMLElement | null
    if (p) {
      x += p.clientLeft
      y += p.clientTop
    }
    n = p
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight }
}

/* ---------------------------------------------------------------- matrices */

const _t2 = ident()
const _pm = ident()
const _cam = ident()
const _rx = ident()
const _ry = ident()
const _tc = ident()
const _tp = ident()
const _prx = ident()
const _pry = ident()
const _a = ident()
const _b = ident()
const _c = ident()

function setTrans2(m: Mat4, x: number, y: number) {
  m.fill(0)
  m[0] = m[5] = m[10] = m[15] = 1
  m[12] = x
  m[13] = y
}
function setTrans(m: Mat4, x: number, y: number, z: number) {
  m.fill(0)
  m[0] = m[5] = m[10] = m[15] = 1
  m[12] = x
  m[13] = y
  m[14] = z
}
function setPersp(m: Mat4, d: number) {
  m.fill(0)
  m[0] = m[5] = m[10] = m[15] = 1
  m[11] = -1 / d
}
function setRotX(m: Mat4, deg: number) {
  const a = deg * RAD
  const s = Math.sin(a)
  const c = Math.cos(a)
  m.fill(0)
  m[0] = 1
  m[5] = c
  m[6] = s
  m[9] = -s
  m[10] = c
  m[15] = 1
}
function setRotY(m: Mat4, deg: number) {
  const a = deg * RAD
  const s = Math.sin(a)
  const c = Math.cos(a)
  m.fill(0)
  m[0] = c
  m[2] = -s
  m[5] = 1
  m[8] = s
  m[10] = c
  m[15] = 1
}

export interface Camera {
  d: number
  tiltX: number
  tiltY: number
  z: number
  ox: number
  oy: number
}

/**
 * Build the pane's full transform, relative to its own untransformed centre.
 * The screen-space pre-translate keeps the scene rotation centred on the
 * camera target rather than on each pane.
 */
export function paneMatrix(p: PaneModel, cam: Camera, scrollY: number, out: Mat4): Mat4 {
  const scx = p.px + p.w / 2
  const scy = p.py + p.h / 2 - scrollY
  const relX = scx - cam.ox
  const relY = scy - cam.oy

  setTrans2(_t2, -relX, -relY)
  setPersp(_pm, cam.d)
  setTrans(_cam, 0, 0, cam.z)
  setRotX(_rx, cam.tiltX)
  setRotY(_ry, cam.tiltY)
  setTrans(_tc, relX + p.dx.x, relY + p.dy.x, p.z.x)
  setRotX(_prx, p.baseRx + p.rx.x)
  setRotY(_pry, p.baseRy + p.ry.x)

  mul(_t2, _pm, _a)
  mul(_a, _cam, _b)
  mul(_b, _rx, _a)
  mul(_a, _ry, _b)
  mul(_b, _tc, _a)
  mul(_a, _prx, _b)
  mul(_b, _pry, out)
  void _tp
  void _c
  return out
}

/** project a pane-local point (z = 0) to screen CSS px */
function project(m: Mat4, x: number, y: number, cx: number, cy: number, out: Float64Array, i: number) {
  const vx = m[0] * x + m[4] * y + m[12]
  const vy = m[1] * x + m[5] * y + m[13]
  const vw = m[3] * x + m[7] * y + m[15]
  const iw = Math.abs(vw) < 1e-6 ? 1 : 1 / vw
  out[i] = cx + vx * iw
  out[i + 1] = cy + vy * iw
}

export function projectQuad(p: PaneModel, m: Mat4, scrollY: number) {
  const cx = p.px + p.w / 2
  const cy = p.py + p.h / 2 - scrollY
  const hw = p.w / 2
  const hh = p.h / 2
  project(m, -hw, -hh, cx, cy, p.quad, 0)
  project(m, hw, -hh, cx, cy, p.quad, 2)
  project(m, hw, hh, cx, cy, p.quad, 4)
  project(m, -hw, hh, cx, cy, p.quad, 6)
}

/* ------------------------------------------------------- homography (3x3) */

const _h = new Float64Array(9)
const _hi = new Float64Array(9)

/** unit square (0,0)(1,0)(1,1)(0,1) -> quad, row-major */
function unitToQuad(q: Float64Array, out: Float64Array) {
  const x0 = q[0],
    y0 = q[1],
    x1 = q[2],
    y1 = q[3],
    x2 = q[4],
    y2 = q[5],
    x3 = q[6],
    y3 = q[7]
  const dx1 = x1 - x2,
    dx2 = x3 - x2,
    dx3 = x0 - x1 + x2 - x3
  const dy1 = y1 - y2,
    dy2 = y3 - y2,
    dy3 = y0 - y1 + y2 - y3
  let a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number
  if (Math.abs(dx3) < 1e-9 && Math.abs(dy3) < 1e-9) {
    a = x1 - x0
    b = x2 - x1
    c = x0
    d = y1 - y0
    e = y2 - y1
    f = y0
    g = 0
    h = 0
  } else {
    const det = dx1 * dy2 - dy1 * dx2
    if (Math.abs(det) < 1e-9) return false
    g = (dx3 * dy2 - dy3 * dx2) / det
    h = (dx1 * dy3 - dy1 * dx3) / det
    a = x1 - x0 + g * x1
    b = x3 - x0 + h * x3
    c = x0
    d = y1 - y0 + g * y1
    e = y3 - y0 + h * y3
    f = y0
  }
  out[0] = a
  out[1] = b
  out[2] = c
  out[3] = d
  out[4] = e
  out[5] = f
  out[6] = g
  out[7] = h
  out[8] = 1
  return true
}

function invert3(m: Float64Array, out: Float64Array) {
  const a = m[0],
    b = m[1],
    c = m[2],
    d = m[3],
    e = m[4],
    f = m[5],
    g = m[6],
    h = m[7],
    i = m[8]
  const A = e * i - f * h,
    B = f * g - d * i,
    C = d * h - e * g
  const det = a * A + b * B + c * C
  if (Math.abs(det) < 1e-12) return false
  const id = 1 / det
  out[0] = A * id
  out[1] = (c * h - b * i) * id
  out[2] = (b * f - c * e) * id
  out[3] = B * id
  out[4] = (a * i - c * g) * id
  out[5] = (c * d - a * f) * id
  out[6] = C * id
  out[7] = (b * g - a * h) * id
  out[8] = (a * e - b * d) * id
  return true
}

/** screen CSS px -> pane-local CSS px (origin at the pane centre) */
export function updateInverse(p: PaneModel): boolean {
  if (!unitToQuad(p.quad, _h)) return false
  if (!invert3(_h, _hi)) return false
  const hw = p.w / 2
  const hh = p.h / 2
  // local = [[2hw,0,-hw],[0,2hh,-hh],[0,0,1]] * H^-1
  const o = p.inv
  o[0] = 2 * hw * _hi[0] - hw * _hi[6]
  o[1] = 2 * hw * _hi[1] - hw * _hi[7]
  o[2] = 2 * hw * _hi[2] - hw * _hi[8]
  o[3] = 2 * hh * _hi[3] - hh * _hi[6]
  o[4] = 2 * hh * _hi[4] - hh * _hi[7]
  o[5] = 2 * hh * _hi[5] - hh * _hi[8]
  o[6] = _hi[6]
  o[7] = _hi[7]
  o[8] = _hi[8]
  return true
}

/** map a screen CSS px point into pane-local px using the cached inverse */
export function toLocal(p: PaneModel, x: number, y: number, out: [number, number]) {
  const m = p.inv
  const w = m[6] * x + m[7] * y + m[8]
  const iw = Math.abs(w) < 1e-6 ? 1 : 1 / w
  out[0] = (m[0] * x + m[1] * y + m[2]) * iw
  out[1] = (m[3] * x + m[4] * y + m[5]) * iw
}

export function matrix3dString(m: Mat4) {
  let s = 'matrix3d('
  for (let i = 0; i < 16; i++) {
    s += (Math.abs(m[i]) < 1e-7 ? 0 : +m[i].toFixed(6)) + (i < 15 ? ',' : '')
  }
  return s + ')'
}
