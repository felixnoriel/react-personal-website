/**
 * LUMEN — WebGL2 fallback.
 *
 * Same look, cheaper physics. Instead of a pressure-projected fluid it advects
 * the dye through an analytic curl-noise flow (divergence free by
 * construction) plus the live pointer impulses, so the medium still has
 * memory, thickness and a wake. The composite pass — medium, caustics, glass
 * panels, glass headline, lens — is a port of the WebGPU one.
 */
import { R, S, type Tier } from './shared'
import type { Backend } from './gpu'

const COMMON = /* glsl */ `#version 300 es
precision highp float;
precision highp sampler2D;

const vec3 PAPER  = vec3(0.9644, 0.9720, 0.9480);
const vec3 VIOLET = vec3(0.5372, 0.1428, 0.3729);
const vec3 BLUE   = vec3(0.2184, 0.3444, 0.5616);
const vec3 LIME    = vec3(0.6094, 0.7120, 0.3880);
const vec3 INDIGO = vec3(0.3089, 0.2546, 0.5054);

float hash21(vec2 p) {
  vec2 q = fract(p * vec2(123.34, 345.45));
  q += dot(q, q + 34.345);
  return fract(q.x * q.y);
}
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i), b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0)), d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * vnoise(p); p *= 2.03; a *= 0.5; }
  return v;
}
`

const VERT = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`

const SIM_FRAG =
  COMMON +
  /* glsl */ `
uniform sampler2D u_dye;
uniform vec2 u_grid;
uniform float u_dt, u_time, u_boot, u_decay, u_ambient, u_aspect;
uniform vec2 u_grav;
uniform vec4 u_clear;
uniform vec4 u_splats[4];
uniform vec4 u_svel[4];
uniform vec4 u_pulse;
out vec4 frag;

vec4 fetch(vec2 uv) { return texture(u_dye, vec2(uv.x, 1.0 - uv.y)); }

float potential(vec2 p, float t) {
  return fbm(p + vec2(t * 0.050, -t * 0.037)) - fbm(p * 0.71 + vec2(-t * 0.031, t * 0.043) + 17.0);
}
vec2 curl(vec2 p, float t) {
  float e = 0.035;
  float dx = potential(p + vec2(e, 0.0), t) - potential(p - vec2(e, 0.0), t);
  float dy = potential(p + vec2(0.0, e), t) - potential(p - vec2(0.0, e), t);
  return vec2(dy, -dx) / (2.0 * e);
}
vec3 baseColour(vec2 uv, float t) {
  vec2 p = vec2(uv.x * u_aspect, uv.y) * 1.45;
  float a = fbm(p + vec2(t * 0.021, t * 0.013));
  float b = fbm(p * 0.78 + vec2(-t * 0.017, t * 0.024) + 9.3);
  vec3 c = BLUE;
  c = mix(c, INDIGO, smoothstep(0.32, 0.66, a));
  c = mix(c, VIOLET, smoothstep(0.44, 0.80, b));
  c = mix(c, LIME, smoothstep(0.60, 0.94, a * (1.0 - b) * 1.9) * 0.8);
  return c;
}

/* The standing composition — see gpu.ts for the reasoning. Three fixed pools
   that breathe but never travel, and a clearing across the headline so the
   biggest type on the page always has paper behind it. Only the ambient dye is
   shaped; anything the visitor pushes in is injected at full strength. */
vec4 compose(vec2 uv) {
  float br = 0.5 + 0.5 * sin(u_time * 0.107);
  float br2 = 0.5 + 0.5 * sin(u_time * 0.081 + 2.2);
  float crown = exp(-pow((uv.y - 0.055) / (0.165 + 0.030 * br), 2.0))
              * (0.34 + 0.92 * smoothstep(0.08, 0.98, uv.x)) * 1.24;
  vec2 d1 = vec2((uv.x - 0.94) / 0.44, (uv.y - 0.94) / 0.26);
  float deep = exp(-dot(d1, d1)) * (0.80 + 0.42 * br2) * 1.42;
  vec2 d2 = vec2((uv.x - 0.02) / 0.40, (uv.y - 1.06) / 0.24);
  float shelf = exp(-dot(d2, d2)) * 0.62;
  float w = crown + deep + shelf;
  vec3 green = mix(LIME, INDIGO, 0.34);
  vec3 mixed = (BLUE * crown + VIOLET * deep + green * shelf) / max(w, 1e-3);
  vec3 c = mix(INDIGO, mixed, smoothstep(0.03, 0.40, w));
  float gy = exp(-pow((uv.y - u_clear.x) / max(u_clear.y, 0.02), 2.0));
  float gx = 1.0 - smoothstep(0.0, 0.30, max(0.0, abs(uv.x - u_clear.z) - u_clear.w));
  float clear = 1.0 - 0.84 * gy * (0.20 + 0.80 * gx);
  return vec4(c, 0.055 + w * clear);
}

void main() {
  vec2 uv = vec2(gl_FragCoord.x, u_grid.y - gl_FragCoord.y) / u_grid;

  vec2 v = curl(vec2(uv.x * u_aspect, uv.y) * 2.85, u_time) * u_ambient;
  float front = u_boot * 1.45 - 0.22;
  float edge = exp(-pow((uv.x - front) / 0.10, 2.0));
  v += vec2(0.62, 0.0) * edge * 1.9;
  v += u_grav * 1.2;
  for (int i = 0; i < 4; i++) {
    if (u_splats[i].w > 0.0) {
      vec2 d = (uv - u_splats[i].xy) * vec2(u_aspect, 1.0);
      float w = exp(-dot(d, d) / max(u_splats[i].z * u_splats[i].z, 1e-6)) * u_splats[i].w;
      v += u_svel[i].xy * w * 2.4;
    }
  }
  if (u_pulse.z > 0.0) {
    vec2 pd = (uv - u_pulse.xy) * vec2(u_aspect, 1.0);
    float w = exp(-pow(length(pd) / max(u_pulse.w, 1e-4), 2.0)) * u_pulse.z;
    v += normalize(pd + vec2(1e-5)) * w * 2.0;
  }
  float bx = smoothstep(0.0, 0.035, uv.x) * (1.0 - smoothstep(0.965, 1.0, uv.x));
  float by = smoothstep(0.0, 0.035, uv.y) * (1.0 - smoothstep(0.965, 1.0, uv.y));
  v *= 0.45 + 0.55 * bx * by;

  vec2 back = clamp(uv - v * u_dt, vec2(0.001), vec2(0.999));
  vec4 d = fetch(back) * u_decay;

  vec3 base = baseColour(uv, u_time);
  float arrived = clamp((front - uv.x) * 5.0 + 0.4, 0.0, 1.0);
  vec2 sp = vec2(uv.x * u_aspect, uv.y);
  float n1 = fbm(sp * 3.1 + vec2(u_time * 0.037, -u_time * 0.028));
  float n2 = fbm(sp * 8.4 + vec2(-u_time * 0.052, u_time * 0.041) + 31.0);
  float clump = pow(n1 * 0.72 + n2 * 0.46, 2.5) * 4.2;
  vec4 comp = compose(uv);
  vec3 tint = mix(base, comp.rgb, 0.68);
  float inj = (0.34 * arrived * comp.a * (0.04 + clump) + 1.2 * edge) * u_dt;
  d += vec4(tint * inj, inj);

  for (int i = 0; i < 4; i++) {
    if (u_splats[i].w > 0.0 && u_svel[i].w > 0.0) {
      vec2 dd = (uv - u_splats[i].xy) * vec2(u_aspect, 1.0);
      float w = exp(-dot(dd, dd) / max(u_splats[i].z * u_splats[i].z, 1e-6)) * u_splats[i].w * u_svel[i].w * u_dt;
      vec3 col = mix(base, mix(VIOLET, INDIGO, u_svel[i].z * 0.7), 0.88);
      d += vec4(col * w, w);
    }
  }
  if (u_pulse.z > 0.0) {
    vec2 pd = (uv - u_pulse.xy) * vec2(u_aspect, 1.0);
    float w = exp(-pow(length(pd) / max(u_pulse.w * 1.2, 1e-4), 2.0)) * u_pulse.z * u_dt * 1.6;
    d += vec4(mix(base, VIOLET, 0.45) * w * 0.7, w * 0.7);
  }
  frag = min(d, vec4(7.0));
}
`

const RENDER_FRAG =
  COMMON +
  /* glsl */ `
uniform sampler2D u_dye;
uniform sampler2D u_mask;
uniform vec2 u_res, u_inv, u_lens;
uniform float u_time, u_lensOn, u_maskFade, u_lensR, u_glass, u_grain, u_scale;
uniform vec2 u_dyeGrid;
uniform vec4 u_mask4;
uniform vec4 u_pulses[3];
uniform vec4 u_panels[4];
uniform vec4 u_panelR;
out vec4 frag;

vec4 fieldRaw(vec2 uv) {
  vec2 c = clamp(uv, vec2(0.0015), vec2(0.9985));
  return texture(u_dye, vec2(c.x, 1.0 - c.y));
}
/* light ON a sheet of paper, never a sheet of light — see gpu.ts */
vec3 tone(vec4 s) {
  float dens = s.a;
  vec3 col = s.rgb / max(dens, 1e-3);
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col = clamp(mix(vec3(lum), col, 1.20), vec3(0.0), vec3(1.4));
  float a = 1.0 - exp(-dens * 0.95);
  vec3 filt = clamp(col * 1.20 + 0.02, vec3(0.0), vec3(1.7));
  return PAPER * mix(vec3(1.0), filt, clamp(a * 0.94, 0.0, 1.0));
}
vec3 mediumFlat(vec2 uv) { return tone(fieldRaw(uv)); }
vec3 mediumFull(vec2 uv) {
  /* step in SIM CELLS, not canvas pixels — see gpu.ts */
  vec2 e = 1.7 / u_dyeGrid;
  vec4 c0 = fieldRaw(uv);
  float dl = fieldRaw(uv - vec2(e.x, 0.0)).a;
  float dr = fieldRaw(uv + vec2(e.x, 0.0)).a;
  float db = fieldRaw(uv - vec2(0.0, e.y)).a;
  float dtp = fieldRaw(uv + vec2(0.0, e.y)).a;
  float dens = c0.a;
  vec2 grad = vec2(dr - dl, dtp - db);
  float lap = (dl + dr + db + dtp) - 4.0 * dens;
  float a = 1.0 - exp(-dens * 1.15);
  vec3 c = tone(c0);
  vec3 n = normalize(vec3(-grad * 58.0, 1.0));
  vec3 L = normalize(vec3(-0.42, -0.62, 0.66));
  c *= mix(1.0, 0.68 + 0.66 * (dot(n, L) * 0.5 + 0.5), a * 0.95);
  float inte = smoothstep(0.0, 0.075, uv.y) * smoothstep(0.0, 0.075, 1.0 - uv.y)
             * smoothstep(0.0, 0.05, uv.x) * smoothstep(0.0, 0.05, 1.0 - uv.x);
  float caus = pow(clamp(-lap * 34.0, 0.0, 1.0), 2.1) * inte;
  vec3 irid = 0.5 + 0.5 * cos(6.2831 * (dens * 0.5 + vec3(0.0, 0.33, 0.67)));
  c += caus * mix(mix(vec3(1.0), c, 0.5), irid, 0.45) * 0.36 * (0.2 + a);
  float band = abs(fract(dens * 1.7 - u_time * 0.05) - 0.5);
  c += smoothstep(0.016, 0.0, band) * a * 0.12 * inte * mix(vec3(1.0), c, 0.45);
  return c;
}
float sdBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + vec2(r);
  return length(max(q, vec2(0.0))) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  vec2 px = vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y);
  vec2 uv = px * u_inv;

  float lensRim = 0.0, lensSpec = 0.0, lensIn = 0.0;
  if (u_lensOn > 0.002) {
    vec2 dl = px - u_lens;
    float r = length(dl);
    if (r < u_lensR * 1.06) {
      float q = min(r / u_lensR, 1.0);
      float k = sqrt(max(1.0 - q * q, 0.0));
      uv += normalize(dl + vec2(1e-4)) * (1.0 - k) * u_lensR * 0.40 * u_inv * u_lensOn;
      lensIn = (1.0 - smoothstep(0.97, 1.0, q)) * u_lensOn;
      lensRim = smoothstep(0.80, 0.99, q) * (1.0 - smoothstep(0.99, 1.04, r / u_lensR)) * u_lensOn;
      vec3 n = normalize(vec3(dl / u_lensR, k * 1.15));
      lensSpec = pow(max(dot(n, normalize(vec3(-0.52, -0.66, 0.54))), 0.0), 24.0) * u_lensOn;
    }
  }

  float pulseGlow = 0.0;
  for (int i = 0; i < 3; i++) {
    vec4 p = u_pulses[i];
    if (p.w > 0.002) {
      float d = length(px - p.xy);
      float rad = p.z * 1150.0 * u_scale;
      float w = exp(-pow((d - rad) / (44.0 * u_scale), 2.0)) * p.w;
      uv += normalize(px - p.xy + vec2(1e-4)) * w * 11.0 * u_scale * u_inv;
      pulseGlow += w;
    }
  }

  vec3 col = mediumFull(uv);

  for (int i = 0; i < 4; i++) {
    vec4 P = u_panels[i];
    if (P.z > 2.0) {
      vec2 cen = P.xy + P.zw * 0.5;
      vec2 hs = P.zw * 0.5;
      float rr = min(u_panelR[i], min(hs.x, hs.y));
      vec2 q = px - cen;
      float sd = sdBox(q, hs, rr);
      float bev = 18.0 * u_scale;
      if (sd < 76.0 * u_scale) {
        vec2 ex = vec2(1.3 * u_scale, 0.0), ey = vec2(0.0, 1.3 * u_scale);
        float gx = sdBox(q + ex, hs, rr) - sdBox(q - ex, hs, rr);
        float gy = sdBox(q + ey, hs, rr) - sdBox(q - ey, hs, rr);
        vec2 gr = normalize(vec2(gx, gy) + vec2(1e-5));
        float h = smoothstep(0.0, -bev, sd);
        vec2 disp = -gr * (1.0 - h) * bev * 1.7;
        vec3 refr = vec3(
          mediumFlat(uv + disp * 1.12 * u_inv).r,
          mediumFlat(uv + disp * 1.00 * u_inv).g,
          mediumFlat(uv + disp * 0.88 * u_inv).b);
        vec3 body = mix(vec3(0.995, 0.998, 0.990), refr, 0.21 + 0.20 * (1.0 - h));
        float rim = smoothstep(2.6 * u_scale, 0.0, abs(sd + 1.7 * u_scale));
        vec3 n3 = normalize(vec3(gr * (1.0 - h) * 1.7, 0.60));
        float spec = pow(max(dot(n3, normalize(vec3(-0.55, -0.66, 0.51))), 0.0), 16.0);
        body += vec3(rim * 0.20) + vec3(spec * 0.44 * (1.0 - h));
        float inside = 1.0 - smoothstep(-1.0 * u_scale, 1.0 * u_scale, sd);
        col = mix(col, body, inside * u_glass);
        float outside = smoothstep(0.0, 11.0 * u_scale, sd) * (1.0 - smoothstep(11.0 * u_scale, 42.0 * u_scale, sd));
        float down = smoothstep(0.0, 20.0 * u_scale, q.y - hs.y * 0.88);
        col += outside * down * mediumFlat(uv) * 0.10 * u_glass;
      }
    }
  }

  if (u_maskFade > 0.002 && u_mask4.z > 1.0) {
    vec2 mu = (px - u_mask4.xy) / u_mask4.zw;
    if (mu.x > 0.0 && mu.x < 1.0 && mu.y > 0.0 && mu.y < 1.0) {
      vec4 t0 = texture(u_mask, mu);
      float m = t0.r, halo = t0.b;
      if (m + halo > 0.004) {
        vec2 e = vec2(1.7 * u_scale) / u_mask4.zw;
        float gx = texture(u_mask, mu + vec2(e.x, 0.0)).g - texture(u_mask, mu - vec2(e.x, 0.0)).g;
        float gy = texture(u_mask, mu + vec2(0.0, e.y)).g - texture(u_mask, mu - vec2(0.0, e.y)).g;
        vec2 grad = vec2(gx, gy);
        vec2 disp = -grad * 190.0 * u_scale;
        vec3 refr = clamp(vec3(
          mediumFlat(uv + disp * 1.16 * u_inv).r,
          mediumFlat(uv + disp * 1.00 * u_inv).g,
          mediumFlat(uv + disp * 0.84 * u_inv).b), vec3(0.0), vec3(1.4));
        float tx = clamp((px.x - u_mask4.x) / u_mask4.z, 0.0, 1.0);
        vec3 tint = mix(vec3(0.150, 0.262, 0.492), vec3(0.232, 0.183, 0.436), smoothstep(0.02, 0.48, tx));
        tint = mix(tint, vec3(0.454, 0.093, 0.320), smoothstep(0.44, 0.94, tx));
        float lum = dot(refr, vec3(0.299, 0.587, 0.114));
        vec3 body = tint * (0.52 + 0.24 * lum) + refr * 0.18;
        float edge = clamp(length(grad) * 26.0, 0.0, 1.0);
        vec3 n3 = normalize(vec3(-grad * 110.0, 0.55));
        float spec = pow(max(dot(n3, normalize(vec3(-0.45, -0.72, 0.53))), 0.0), 14.0);
        vec3 lc = body + vec3(0.78, 0.56, 0.92) * edge * 0.26 + vec3(spec * 0.40);
        /* erode the antialiased rim — see gpu.ts */
        float mm = smoothstep(0.30, 0.82, m);
        col = mix(col, lc, mm * u_maskFade);
        float bloom = clamp(halo - m, 0.0, 1.0);
        col += bloom * bloom * mediumFlat(uv) * 0.16 * u_maskFade;
      }
    }
  }

  col += vec3(lensIn * 0.022) + vec3(lensRim * 0.20) + vec3(lensSpec * 0.52);
  col += pulseGlow * vec3(0.62, 0.48, 0.70) * 0.28;
  float vg = 1.0 - 0.10 * smoothstep(0.36, 1.0, length((uv - 0.5) * vec2(1.0, 0.86)) * 1.55);
  col *= vg;
  col += (hash21(px + u_time * 57.0) - 0.5) * u_grain;
  frag = vec4(clamp(col, vec3(0.0), vec3(1.0)), 1.0);
}
`

function compile(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const mk = (type: number, src: string) => {
    const sh = gl.createShader(type)!
    gl.shaderSource(sh, src)
    gl.compileShader(sh)
    return sh
  }
  const p = gl.createProgram()!
  const v = mk(gl.VERTEX_SHADER, vs)
  const f = mk(gl.FRAGMENT_SHADER, fs)
  gl.attachShader(p, v)
  gl.attachShader(p, f)
  gl.linkProgram(p)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    const log = gl.getShaderInfoLog(f) || gl.getShaderInfoLog(v) || gl.getProgramInfoLog(p)
    gl.deleteProgram(p)
    throw new Error('lumen: shader link failed — ' + log)
  }
  gl.deleteShader(v)
  gl.deleteShader(f)
  return p
}

export function createGlBackend(
  canvas: HTMLCanvasElement,
  gw: number,
  gh: number,
  onLost?: () => void,
): Backend | null {
  const gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'high-performance',
  })
  if (!gl) return null
  if (!gl.getExtension('EXT_color_buffer_float')) return null
  gl.getExtension('OES_texture_float_linear')

  let simProg: WebGLProgram
  let renProg: WebGLProgram
  try {
    simProg = compile(gl, VERT, SIM_FRAG)
    renProg = compile(gl, VERT, RENDER_FRAG)
  } catch {
    return null
  }

  const vao = gl.createVertexArray()
  gl.bindVertexArray(vao)

  let lost = false
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault()
    lost = true
    onLost?.()
  })

  const mkTex = (w: number, h: number) => {
    const t = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, t)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    return t
  }
  const dye = [mkTex(gw, gh), mkTex(gw, gh)]
  const fbo = dye.map((t) => {
    const f = gl.createFramebuffer()!
    gl.bindFramebuffer(gl.FRAMEBUFFER, f)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0)
    return f
  })
  // clear both to zero so the medium starts empty and the light arrives
  for (const f of fbo) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, f)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)

  const maskTex = gl.createTexture()!
  gl.bindTexture(gl.TEXTURE_2D, maskTex)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]))
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

  const uni = (p: WebGLProgram, n: string) => gl.getUniformLocation(p, n)
  const sU = {
    dye: uni(simProg, 'u_dye'),
    grid: uni(simProg, 'u_grid'),
    dt: uni(simProg, 'u_dt'),
    time: uni(simProg, 'u_time'),
    boot: uni(simProg, 'u_boot'),
    decay: uni(simProg, 'u_decay'),
    ambient: uni(simProg, 'u_ambient'),
    aspect: uni(simProg, 'u_aspect'),
    grav: uni(simProg, 'u_grav'),
    clear: uni(simProg, 'u_clear'),
    splats: uni(simProg, 'u_splats'),
    svel: uni(simProg, 'u_svel'),
    pulse: uni(simProg, 'u_pulse'),
  }
  const rU = {
    dye: uni(renProg, 'u_dye'),
    mask: uni(renProg, 'u_mask'),
    res: uni(renProg, 'u_res'),
    inv: uni(renProg, 'u_inv'),
    lens: uni(renProg, 'u_lens'),
    time: uni(renProg, 'u_time'),
    lensOn: uni(renProg, 'u_lensOn'),
    maskFade: uni(renProg, 'u_maskFade'),
    dyeGrid: uni(renProg, 'u_dyeGrid'),
    lensR: uni(renProg, 'u_lensR'),
    glass: uni(renProg, 'u_glass'),
    grain: uni(renProg, 'u_grain'),
    scale: uni(renProg, 'u_scale'),
    mask4: uni(renProg, 'u_mask4'),
    pulses: uni(renProg, 'u_pulses'),
    panels: uni(renProg, 'u_panels'),
    panelR: uni(renProg, 'u_panelR'),
  }

  const dbg = gl.getExtension('WEBGL_debug_renderer_info')
  const info = (dbg ? (gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) as string) : gl.getParameter(gl.RENDERER)) || 'webgl2'

  let src = 0

  return {
    tier: 'webgl' as Tier,
    info: String(info).replace(/\s*\(.*$/, '').slice(0, 46),
    grid: [gw, gh],
    resize(w: number, h: number) {
      canvas.width = w
      canvas.height = h
    },
    setMask(img: HTMLCanvasElement) {
      gl.bindTexture(gl.TEXTURE_2D, maskTex)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
    },
    frame(u: Float32Array, s: Float32Array) {
      if (lost) return
      // ---- sim step ----
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo[1 - src])
      gl.viewport(0, 0, gw, gh)
      gl.useProgram(simProg)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, dye[src])
      gl.uniform1i(sU.dye, 0)
      gl.uniform2f(sU.grid, gw, gh)
      gl.uniform1f(sU.dt, s[S.dt])
      gl.uniform1f(sU.time, s[S.time])
      gl.uniform1f(sU.boot, s[S.boot])
      gl.uniform1f(sU.decay, s[S.decay])
      gl.uniform1f(sU.ambient, s[S.ambient])
      gl.uniform1f(sU.aspect, s[S.aspect])
      gl.uniform2f(sU.grav, s[S.grav], s[S.grav + 1])
      gl.uniform4f(sU.clear, s[S.clear], s[S.clear + 1], s[S.clear + 2], s[S.clear + 3])
      gl.uniform4fv(sU.splats, s.subarray(S.splats, S.splats + 16))
      gl.uniform4fv(sU.svel, s.subarray(S.svel, S.svel + 16))
      gl.uniform4fv(sU.pulse, s.subarray(S.pulse, S.pulse + 4))
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      src = 1 - src

      // ---- composite ----
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.useProgram(renProg)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, dye[src])
      gl.uniform1i(rU.dye, 0)
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, maskTex)
      gl.uniform1i(rU.mask, 1)
      gl.uniform2f(rU.res, u[R.res], u[R.res + 1])
      gl.uniform2f(rU.inv, u[R.inv], u[R.inv + 1])
      gl.uniform2f(rU.lens, u[R.lens], u[R.lens + 1])
      gl.uniform1f(rU.time, u[R.time])
      gl.uniform1f(rU.lensOn, u[R.lensOn])
      gl.uniform1f(rU.maskFade, u[R.maskFade])
      gl.uniform2f(rU.dyeGrid, gw, gh)
      gl.uniform1f(rU.lensR, u[R.lensR])
      gl.uniform1f(rU.glass, u[R.glass])
      gl.uniform1f(rU.grain, u[R.grain])
      gl.uniform1f(rU.scale, u[R.scale])
      gl.uniform4fv(rU.mask4, u.subarray(R.mask, R.mask + 4))
      gl.uniform4fv(rU.pulses, u.subarray(R.pulses, R.pulses + 12))
      gl.uniform4fv(rU.panels, u.subarray(R.panels, R.panels + 16))
      gl.uniform4fv(rU.panelR, u.subarray(R.panelR, R.panelR + 4))
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    },
    destroy() {
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    },
  }
}
