/** SIGNAL — camera math shared by both renderers and the label projector. */

export type Mat4 = Float32Array

/** WebGPU clip space: depth 0..1 */
export function perspectiveGPU(fovy: number, aspect: number, near: number, far: number, sx: number, sy: number): Mat4 {
  const f = 1 / Math.tan(fovy / 2)
  const nf = 1 / (near - far)
  const m = new Float32Array(16)
  m[0] = f / aspect
  m[5] = f
  m[8] = -sx
  m[9] = -sy
  m[10] = far * nf
  m[11] = -1
  m[14] = far * near * nf
  return m
}

/** OpenGL clip space: depth -1..1 */
export function perspectiveGL(fovy: number, aspect: number, near: number, far: number, sx: number, sy: number): Mat4 {
  const f = 1 / Math.tan(fovy / 2)
  const nf = 1 / (near - far)
  const m = new Float32Array(16)
  m[0] = f / aspect
  m[5] = f
  m[8] = -sx
  m[9] = -sy
  m[10] = (far + near) * nf
  m[11] = -1
  m[14] = 2 * far * near * nf
  return m
}

/** view = translate(0,0,-dist) · rotX(tilt) · rotY(spin); also returns R (row-major 3x3) */
export function viewMatrix(dist: number, tilt: number, spin: number): [Mat4, Float32Array] {
  const cs = Math.cos(spin)
  const ss = Math.sin(spin)
  const ct = Math.cos(tilt)
  const st = Math.sin(tilt)
  const r = new Float32Array([cs, 0, -ss, st * ss, ct, st * cs, ct * ss, -st, ct * cs])
  const m = new Float32Array(16)
  m[0] = r[0]
  m[4] = r[1]
  m[8] = r[2]
  m[1] = r[3]
  m[5] = r[4]
  m[9] = r[5]
  m[2] = r[6]
  m[6] = r[7]
  m[10] = r[8]
  m[14] = -dist
  m[15] = 1
  return [m, r]
}

export function mul(a: Mat4, b: Mat4): Mat4 {
  const o = new Float32Array(16)
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++) {
      let s = 0
      for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]
      o[c * 4 + r] = s
    }
  return o
}

/** clip-space transform of a point; returns [ndcX, ndcY, w] (w <= 0 means behind the camera) */
export function transform(vp: Mat4, x: number, y: number, z: number): [number, number, number] {
  const cx = vp[0] * x + vp[4] * y + vp[8] * z + vp[12]
  const cy = vp[1] * x + vp[5] * y + vp[9] * z + vp[13]
  const cw = vp[3] * x + vp[7] * y + vp[11] * z + vp[15]
  return [cx / (cw || 1e-6), cy / (cw || 1e-6), cw]
}
