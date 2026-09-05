/**
 * SIGNAL — the WebGL2 tier (Firefox today, and any machine whose WebGPU
 * adapter is refused).
 *
 * No compute stage, so the swarm is solved ANALYTICALLY in the vertex
 * shader — position is a pure function of (targets, morph, time, pointer,
 * shockwaves). That is the same discipline the current site's particle
 * headline uses: no physics state, no ping-pong, one draw call, and the
 * main thread only writes a handful of uniforms per frame.
 *
 * It keeps the parts that make light look like light: an rgba16f HDR
 * target, a five-pass bloom, filmic tone mapping, and premultiplied
 * alpha 0 so the canvas adds to the page instead of covering it.
 */

import type { CoreHandle, CoreOpts } from './types'

const VERT = /* glsl */ `#version 300 es
precision highp float;
layout(location = 0) in vec4 t0;
layout(location = 1) in vec4 t1;
layout(location = 2) in vec4 t2;
layout(location = 3) in vec4 t3;

uniform mat4 uVP;
uniform vec4 uPtr;      // xyz well, w strength
uniform vec4 uParams;   // time, morph, ignite, brightness
uniform vec4 uPhys;     // flowAmp, flowScale, sizePx, camera distance
uniform vec2 uRes;
uniform vec4 uWaves[4];
uniform vec3 uColA, uColB, uColC, uColD;
uniform float uCount;

out vec3 vCol;
out float vAmp;

vec3 flow(vec3 p, float t, float k) {
  vec3 q = p * k + vec3(0.0, 0.0, t * 0.22);
  vec3 f = vec3(sin(q.z) + 1.10 * cos(q.y), 0.9 * sin(q.x) + cos(q.z), 1.1 * sin(q.y) + 0.9 * cos(q.x));
  vec3 r = p * (k * 2.7) - vec3(t * 0.41, t * 0.24, t * 0.12);
  f += 0.34 * vec3(sin(r.z) + cos(r.y), sin(r.x) + cos(r.z), sin(r.y) + cos(r.x));
  return f;
}

void main() {
  float s = clamp(uParams.y, 0.0, 3.0);
  float si = floor(s);
  float f = smoothstep(0.0, 1.0, s - si);
  vec4 a = si < 0.5 ? t0 : (si < 1.5 ? t1 : (si < 2.5 ? t2 : t3));
  vec4 b = si < 0.5 ? t1 : (si < 1.5 ? t2 : t3);
  vec4 tgt = mix(a, b, f);
  vec3 target = tgt.xyz;
  float hot = tgt.w;

  float idx = float(gl_VertexID);
  float fi = idx / uCount;

  // ignition: hauled in from a dark shell, staggered per particle
  float ign = uParams.z;
  float delay = fract(sin(idx * 12.9898) * 43758.5453) * 0.35;
  float e = clamp((ign - delay) / max(1e-3, 1.0 - delay), 0.0, 1.0);
  e = 1.0 - pow(1.0 - e, 3.0);
  vec3 dir0 = normalize(target + vec3(1e-3));
  vec3 shell = dir0 * (4.2 + fract(sin(idx * 78.233) * 24634.6345) * 3.0);
  vec3 p = mix(shell, target, e);

  // filaments — a displacement field rather than an integrated one
  p += flow(p, uParams.x, uPhys.y) * (uPhys.x * (1.35 - hot));

  // gravity well: pull toward the cursor plus a tangential swirl
  vec3 d = uPtr.xyz - p;
  float r2 = dot(d, d);
  float g = uPtr.w / (r2 + 0.13);
  vec3 dir = d * inversesqrt(max(r2, 1e-6));
  vec3 tn = normalize(cross(dir, vec3(0.0, 0.0, 1.0)) + vec3(1e-5));
  p += dir * g * 0.30 + tn * g * 0.40;

  float glow = 0.0;
  for (int i = 0; i < 4; i++) {
    float age = uWaves[i].w;
    if (age < 0.0) continue;
    vec3 dd = p - uWaves[i].xyz;
    float L = length(dd) + 1e-4;
    float amp = exp(-abs(L - age * 3.6) * 2.6) * max(0.0, 1.0 - age * 0.75);
    p += (dd / L) * amp * 0.55;
    glow += amp;
  }

  vec4 clip = uVP * vec4(p, 1.0);
  gl_Position = clip;
  float w = max(clip.w, 0.25);
  gl_PointSize = clamp(uPhys.z * (0.62 + hot * 0.85) / w, 0.6, 42.0);

  float mx = clamp(p.x * 0.26 + 0.5, 0.0, 1.0);
  vec3 col = mix(uColA, uColB, smoothstep(0.0, 0.60, mx));
  col = mix(col, uColC, smoothstep(0.44, 1.02, mx));
  col = mix(col, uColD, pow(hot, 3.0) * 0.34);

  float pulse = pow(max(0.0, sin(fi * 12.5664 - uParams.x * 1.15)), 34.0);
  float fade = smoothstep(uPhys.w + 3.6, uPhys.w - 2.9, clip.w);
  vAmp = fade * (0.021 + hot * 0.155) * (1.0 + pulse * 6.0 + glow * 3.0) * uParams.w * ign;
  vCol = col + vec3(0.55, 0.85, 0.45) * pulse * 0.9 + vec3(glow * 0.5);
}
`

const FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec3 vCol;
in float vAmp;
out vec4 o;
void main() {
  vec2 uv = gl_PointCoord * 2.0 - 1.0;
  float a = exp(-dot(uv, uv) * 4.6) - 0.010;
  if (a <= 0.0) discard;
  o = vec4(vCol * (a * vAmp), a * vAmp * 0.35);
}
`

const POST_VERT = /* glsl */ `#version 300 es
precision highp float;
out vec2 vUv;
void main() {
  vec2 p = vec2(gl_VertexID == 2 ? 3.0 : -1.0, gl_VertexID == 0 ? -3.0 : 1.0);
  vUv = (p + 1.0) * 0.5;
  gl_Position = vec4(p, 0.0, 1.0);
}
`

const POST_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D texA;
uniform sampler2D texB;
uniform vec4 uTexel;   // 1/w, 1/h, dirX, dirY
uniform vec4 uCfg;     // radius|exposure, threshold, chroma, bloom
uniform int uMode;     // 0 bright, 1 blur, 2 composite
out vec4 o;

vec3 tonemap(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}
vec3 srgb(vec3 x) {
  return mix(1.055 * pow(max(x, 0.0), vec3(1.0 / 2.4)) - 0.055, x * 12.92, step(x, vec3(0.0031308)));
}

void main() {
  if (uMode == 0) {
    vec2 t = uTexel.xy;
    vec3 c = texture(texA, vUv + vec2(-t.x, -t.y)).rgb + texture(texA, vUv + vec2(t.x, -t.y)).rgb +
             texture(texA, vUv + vec2(-t.x, t.y)).rgb + texture(texA, vUv + vec2(t.x, t.y)).rgb;
    c *= 0.25;
    float l = max(c.r, max(c.g, c.b));
    o = vec4(c * (max(l - uCfg.y, 0.0) / max(l, 1e-4)), 1.0);
  } else if (uMode == 1) {
    vec2 st = uTexel.xy * uTexel.zw * uCfg.x;
    vec3 c = texture(texA, vUv).rgb * 0.227;
    c += (texture(texA, vUv + st * 1.385).rgb + texture(texA, vUv - st * 1.385).rgb) * 0.316;
    c += (texture(texA, vUv + st * 3.253).rgb + texture(texA, vUv - st * 3.253).rgb) * 0.070;
    o = vec4(c, 1.0);
  } else {
    vec3 scene = texture(texA, vUv).rgb;
    vec3 bl = texture(texB, vUv).rgb;
    vec2 off = (vUv - 0.5) * uCfg.z;
    float br = texture(texB, vUv + off).r;
    float bb = texture(texB, vUv - off).b;
    vec3 halo = vec3(mix(bl.r, br, 0.6), bl.g, mix(bl.b, bb, 0.6));
    vec3 c = tonemap((scene + halo * uCfg.w) * uCfg.x);
    o = vec4(srgb(c), 0.0);
  }
}
`

function compile(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const mk = (type: number, src: string) => {
    const s = gl.createShader(type)!
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader')
    return s
  }
  const p = gl.createProgram()!
  gl.attachShader(p, mk(gl.VERTEX_SHADER, vs))
  gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs))
  gl.linkProgram(p)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'link')
  return p
}

function perspective(fovy: number, aspect: number, near: number, far: number, sx: number, sy: number) {
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

function viewMatrix(dist: number, tilt: number, spin: number): [Float32Array, Float32Array] {
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

function mul(a: Float32Array, b: Float32Array) {
  const o = new Float32Array(16)
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++) {
      let s = 0
      for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]
      o[c * 4 + r] = s
    }
  return o
}

export function createGlCore(opts: CoreOpts): CoreHandle | null {
  const gl = opts.canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    powerPreference: 'high-performance',
  })
  if (!gl) return null
  if (!gl.getExtension('EXT_color_buffer_float')) return null
  gl.getExtension('OES_texture_float_linear')

  let prog: WebGLProgram
  let post: WebGLProgram
  try {
    prog = compile(gl, VERT, FRAG)
    post = compile(gl, POST_VERT, POST_FRAG)
  } catch {
    return null
  }

  const dbg = gl.getExtension('WEBGL_debug_renderer_info')
  const raw = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : String(gl.getParameter(gl.RENDERER))
  // the driver string carries a vendor prefix nobody reads ("ANGLE Metal
  // Renderer: Apple M1 Pro"); the rail wants the chip, not the plumbing
  const chip = (raw.match(/\(([^,]+),\s*([^,]+)/)?.[2]?.trim() || raw).replace(/^[A-Za-z ]*Renderer:\s*/, '')
  const label = 'WebGL2 · ' + chip.slice(0, 22)

  const N = opts.count
  const vao = gl.createVertexArray()!
  gl.bindVertexArray(vao)
  const vbo = gl.createBuffer()!
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
  // interleave the four shape targets so one particle is one cache line pair
  const inter = new Float32Array(N * 16)
  for (let i = 0; i < N; i++)
    for (let s = 0; s < 4; s++)
      for (let k = 0; k < 4; k++) inter[i * 16 + s * 4 + k] = opts.shapes[s * N * 4 + i * 4 + k]
  gl.bufferData(gl.ARRAY_BUFFER, inter, gl.STATIC_DRAW)
  for (let s = 0; s < 4; s++) {
    gl.enableVertexAttribArray(s)
    gl.vertexAttribPointer(s, 4, gl.FLOAT, false, 64, s * 16)
  }
  gl.bindVertexArray(null)

  const U = (p: WebGLProgram, n: string) => gl.getUniformLocation(p, n)
  const u = {
    vp: U(prog, 'uVP'),
    ptr: U(prog, 'uPtr'),
    params: U(prog, 'uParams'),
    phys: U(prog, 'uPhys'),
    res: U(prog, 'uRes'),
    waves: U(prog, 'uWaves'),
    ca: U(prog, 'uColA'),
    cb: U(prog, 'uColB'),
    cc: U(prog, 'uColC'),
    cd: U(prog, 'uColD'),
    count: U(prog, 'uCount'),
  }
  const pu = {
    texA: U(post, 'texA'),
    texB: U(post, 'texB'),
    texel: U(post, 'uTexel'),
    cfg: U(post, 'uCfg'),
    mode: U(post, 'uMode'),
  }

  type FB = { fb: WebGLFramebuffer; tex: WebGLTexture; w: number; h: number }
  const mkFb = (w: number, h: number): FB => {
    const tex = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    const fb = gl.createFramebuffer()!
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    return { fb, tex, w, h }
  }

  let scene: FB | null = null
  let bx: FB | null = null
  let by: FB | null = null
  let W = 0
  let H = 0
  const del = (f: FB | null) => {
    if (!f) return
    gl.deleteFramebuffer(f.fb)
    gl.deleteTexture(f.tex)
  }

  const wavesArr = new Float32Array(16)
  let dead = false

  return {
    label,
    count: N,
    resize(w, h) {
      if (dead) return
      W = Math.max(2, Math.round(w))
      H = Math.max(2, Math.round(h))
      del(scene)
      del(bx)
      del(by)
      scene = mkFb(W, H)
      const qw = Math.max(2, W >> 2)
      const qh = Math.max(2, H >> 2)
      bx = mkFb(qw, qh)
      by = mkFb(qw, qh)
    },
    frame(f) {
      if (dead || !scene || !bx || !by) return
      const aspect = W / H
      const [view, R] = viewMatrix(f.dist, f.tilt, f.spin)
      const vp = mul(perspective(f.fov, aspect, 0.1, 60, f.shiftX, f.shiftY), view)
      const fq = 1 / Math.tan(f.fov / 2)
      const vx = ((f.px - f.shiftX) * aspect * f.dist) / fq
      const vy = ((f.py - f.shiftY) * f.dist) / fq

      gl.bindFramebuffer(gl.FRAMEBUFFER, scene.fb)
      gl.viewport(0, 0, W, H)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.ONE, gl.ONE)
      gl.useProgram(prog)
      gl.uniformMatrix4fv(u.vp, false, vp)
      gl.uniform4f(u.ptr, R[0] * vx + R[3] * vy, R[1] * vx + R[4] * vy, R[2] * vx + R[5] * vy, f.pointer)
      gl.uniform4f(u.params, f.time, f.morph, f.ignite, f.brightness)
      gl.uniform4f(u.phys, f.flowAmp * 0.055, f.flowScale, f.sizePx, f.dist)
      gl.uniform2f(u.res, W, H)
      for (let i = 0; i < 4; i++) wavesArr.set(f.waves[i], i * 4)
      gl.uniform4fv(u.waves, wavesArr)
      gl.uniform3fv(u.ca, opts.palette[0])
      gl.uniform3fv(u.cb, opts.palette[1])
      gl.uniform3fv(u.cc, opts.palette[2])
      gl.uniform3fv(u.cd, opts.palette[3])
      gl.uniform1f(u.count, N)
      gl.bindVertexArray(vao)
      gl.drawArrays(gl.POINTS, 0, f.active)
      gl.bindVertexArray(null)

      // ---- post
      gl.disable(gl.BLEND)
      gl.useProgram(post)
      gl.uniform1i(pu.texA, 0)
      gl.uniform1i(pu.texB, 1)
      const run = (dst: FB | null, src: WebGLTexture, src2: WebGLTexture, mode: number, texel: number[], cfg: number[]) => {
        gl.bindFramebuffer(gl.FRAMEBUFFER, dst ? dst.fb : null)
        gl.viewport(0, 0, dst ? dst.w : W, dst ? dst.h : H)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, src)
        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D, src2)
        gl.uniform4fv(pu.texel, texel)
        gl.uniform4fv(pu.cfg, cfg)
        gl.uniform1i(pu.mode, mode)
        gl.drawArrays(gl.TRIANGLES, 0, 3)
      }
      const qt = [1 / bx.w, 1 / bx.h, 1, 0]
      run(bx, scene.tex, scene.tex, 0, [1 / W, 1 / H, 0, 0], [0, opts.bloomThreshold, 0, 0])
      run(by, bx.tex, bx.tex, 1, [qt[0], qt[1], 1, 0], [1.0, 0, 0, 0])
      run(bx, by.tex, by.tex, 1, [qt[0], qt[1], 0, 1], [1.0, 0, 0, 0])
      run(by, bx.tex, bx.tex, 1, [qt[0], qt[1], 1, 0], [3.4, 0, 0, 0])
      run(bx, by.tex, by.tex, 1, [qt[0], qt[1], 0, 1], [3.4, 0, 0, 0])
      run(null, scene.tex, bx.tex, 2, [0, 0, 0, 0], [opts.exposure, 0, 0.0055, opts.bloomStrength])
    },
    destroy() {
      dead = true
      del(scene)
      del(bx)
      del(by)
      gl.deleteBuffer(vbo)
      gl.deleteVertexArray(vao)
      gl.deleteProgram(prog)
      gl.deleteProgram(post)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    },
  }
}
