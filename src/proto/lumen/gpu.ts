/**
 * LUMEN — WebGPU backend.
 *
 * Compute passes run a real incompressible fluid (advect, force, divergence,
 * Jacobi pressure, projection) on a small grid, then advect a coloured dye
 * through it. That is what gives the light memory: a stroke stays, drifts and
 * dissolves instead of being repainted every frame.
 *
 * One fragment pass composites the whole hero: the medium with its caustics,
 * the glass panels (bevel normal -> refraction -> dispersion -> rim), the glass
 * headline (from a coverage mask of the real glyphs) and the pointer lens.
 */
import { R, S, type Tier } from './shared'

const COMMON = /* wgsl */ `
const PAPER  = vec3f(0.9644, 0.9720, 0.9480);
const VIOLET = vec3f(0.5372, 0.1428, 0.3729);
const BLUE   = vec3f(0.2184, 0.3444, 0.5616);
const LIME   = vec3f(0.6094, 0.7120, 0.3880);
const INDIGO = vec3f(0.3089, 0.2546, 0.5054);

fn hash21(p: vec2f) -> f32 {
  var q = fract(p * vec2f(123.34, 345.45));
  q += dot(q, q + 34.345);
  return fract(q.x * q.y);
}
fn vnoise(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  let a = hash21(i);
  let b = hash21(i + vec2f(1.0, 0.0));
  let c = hash21(i + vec2f(0.0, 1.0));
  let d = hash21(i + vec2f(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
fn fbm(p0: vec2f) -> f32 {
  var p = p0;
  var v = 0.0;
  var a = 0.5;
  for (var i = 0; i < 4; i = i + 1) {
    v = v + a * vnoise(p);
    p = p * 2.03;
    a = a * 0.5;
  }
  return v;
}
`

const SIM_HEAD = /* wgsl */ `
struct Sim {
  grid: vec2f,
  inv: vec2f,
  dt: f32,
  time: f32,
  boot: f32,
  decay: f32,
  grav: vec2f,
  ambient: f32,
  aspect: f32,
  splats: array<vec4f, 4>,
  svel: array<vec4f, 4>,
  pulse: vec4f,
  clear: vec4f,
};
@group(0) @binding(0) var<uniform> S: Sim;
@group(0) @binding(1) var samp: sampler;

/**
 * The standing composition.
 *
 * The medium is not a uniform flood. It pools in three fixed places — a crown
 * along the top edge, a deep mass low and right, a cool shelf low and left —
 * and it stays thin across the headline, which is the one place the page
 * cannot afford to lose its paper. The pools breathe; they never travel, so a
 * still frame of this page is composed rather than random.
 *
 * Only the AMBIENT dye is shaped this way. Anything the visitor pushes into
 * the medium is injected at full strength, so a stroke through the clearing is
 * the most visible thing on the page.
 */
fn compose(uv: vec2f) -> vec4f {
  let br = 0.5 + 0.5 * sin(S.time * 0.107);
  let br2 = 0.5 + 0.5 * sin(S.time * 0.081 + 2.2);
  // a cool crown of light entering along the top edge, leaning right
  let crown = exp(-pow((uv.y - 0.055) / (0.165 + 0.030 * br), 2.0))
            * (0.34 + 0.92 * smoothstep(0.08, 0.98, uv.x)) * 1.24;
  // the deep pool: the heaviest, most saturated mass, low and right
  let d1 = vec2f((uv.x - 0.94) / 0.44, (uv.y - 0.94) / 0.26);
  let deep = exp(-dot(d1, d1)) * (0.80 + 0.42 * br2) * 1.42;
  // the shelf: a cool green low band on the left, under the buttons
  let d2 = vec2f((uv.x - 0.02) / 0.40, (uv.y - 1.06) / 0.24);
  let shelf = exp(-dot(d2, d2)) * 0.62;
  let w = crown + deep + shelf;
  // each pool carries its own colour, so the composition has a palette rather
  // than a soup that averages out to grey
  let green = mix(LIME, INDIGO, 0.34);
  let mixed = (BLUE * crown + VIOLET * deep + green * shelf) / max(w, 1e-3);
  let c = mix(INDIGO, mixed, smoothstep(0.03, 0.40, w));
  // the clearing is cut to the shape of the headline's own ink, so the light
  // comes straight back on the empty side of the line instead of leaving a
  // dead grey band across the page
  let gy = exp(-pow((uv.y - S.clear.x) / max(S.clear.y, 0.02), 2.0));
  let gx = 1.0 - smoothstep(0.0, 0.30, max(0.0, abs(uv.x - S.clear.z) - S.clear.w));
  let clear = 1.0 - 0.84 * gy * (0.20 + 0.80 * gx);
  return vec4f(c, 0.055 + w * clear);
}

fn potential(p: vec2f, t: f32) -> f32 {
  return fbm(p + vec2f(t * 0.050, -t * 0.037)) - fbm(p * 0.71 + vec2f(-t * 0.031, t * 0.043) + 17.0);
}
fn curl(p: vec2f, t: f32) -> vec2f {
  let e = 0.035;
  let dx = potential(p + vec2f(e, 0.0), t) - potential(p - vec2f(e, 0.0), t);
  let dy = potential(p + vec2f(0.0, e), t) - potential(p - vec2f(0.0, e), t);
  return vec2f(dy, -dx) / (2.0 * e);
}
fn baseColour(uv: vec2f, t: f32) -> vec3f {
  let p = vec2f(uv.x * S.aspect, uv.y) * 1.45;
  let a = fbm(p + vec2f(t * 0.021, t * 0.013));
  let b = fbm(p * 0.78 + vec2f(-t * 0.017, t * 0.024) + 9.3);
  var c = BLUE;
  c = mix(c, INDIGO, smoothstep(0.32, 0.66, a));
  c = mix(c, VIOLET, smoothstep(0.44, 0.80, b));
  c = mix(c, LIME, smoothstep(0.60, 0.94, a * (1.0 - b) * 1.9) * 0.8);
  return c;
}
fn cl(g: vec2i) -> vec2i {
  return clamp(g, vec2i(0, 0), vec2i(S.grid) - vec2i(1, 1));
}
`

const WGSL_ADVECT_VEL = COMMON + SIM_HEAD + /* wgsl */ `
@group(0) @binding(2) var velSrc: texture_2d<f32>;
@group(0) @binding(3) var velDst: texture_storage_2d<rgba16float, write>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) gid: vec3u) {
  let g = vec2i(gid.xy);
  let dim = vec2i(S.grid);
  if (g.x >= dim.x || g.y >= dim.y) { return; }
  let uv = (vec2f(g) + 0.5) * S.inv;

  let v0 = textureSampleLevel(velSrc, samp, uv, 0.0).xy;
  let back = clamp(uv - v0 * S.dt, vec2f(0.001), vec2f(0.999));
  var v = textureSampleLevel(velSrc, samp, back, 0.0).xy;

  // ambient: a slow divergence-free curl flow keeps the medium alive
  let amb = curl(vec2f(uv.x * S.aspect, uv.y) * 2.85, S.time) * S.ambient;
  v = mix(v, amb, 1.0 - exp(-S.dt * 1.7));

  // the arrival: a wavefront that pours light in from the left edge
  let front = S.boot * 1.45 - 0.22;
  let edge = exp(-pow((uv.x - front) / 0.10, 2.0));
  v += vec2f(0.62, 0.0) * edge * S.dt * 3.4;

  // device tilt pours the medium downhill
  v += S.grav * S.dt;

  for (var i = 0u; i < 4u; i = i + 1u) {
    let s = S.splats[i];
    if (s.w > 0.0) {
      let d = (uv - s.xy) * vec2f(S.aspect, 1.0);
      let w = exp(-dot(d, d) / max(s.z * s.z, 1e-6)) * s.w;
      v += S.svel[i].xy * w;
    }
  }

  // a click is a pressure pulse: the medium is shoved outward
  if (S.pulse.z > 0.0) {
    let d = (uv - S.pulse.xy) * vec2f(S.aspect, 1.0);
    let r = length(d);
    let w = exp(-pow(r / max(S.pulse.w, 1e-4), 2.0)) * S.pulse.z;
    v += normalize(d + vec2f(1e-5, 1e-5)) * w;
  }

  // no flow through the frame
  let bx = smoothstep(0.0, 0.035, uv.x) * (1.0 - smoothstep(0.965, 1.0, uv.x));
  let by = smoothstep(0.0, 0.035, uv.y) * (1.0 - smoothstep(0.965, 1.0, uv.y));
  v *= (0.45 + 0.55 * bx * by) * 0.997;

  textureStore(velDst, g, vec4f(v, 0.0, 1.0));
}
`

const WGSL_DIVERGENCE = COMMON + SIM_HEAD + /* wgsl */ `
@group(0) @binding(2) var velSrc: texture_2d<f32>;
@group(0) @binding(3) var divDst: texture_storage_2d<rgba16float, write>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) gid: vec3u) {
  let g = vec2i(gid.xy);
  let dim = vec2i(S.grid);
  if (g.x >= dim.x || g.y >= dim.y) { return; }
  let l = textureLoad(velSrc, cl(g - vec2i(1, 0)), 0).x;
  let r = textureLoad(velSrc, cl(g + vec2i(1, 0)), 0).x;
  let b = textureLoad(velSrc, cl(g - vec2i(0, 1)), 0).y;
  let t = textureLoad(velSrc, cl(g + vec2i(0, 1)), 0).y;
  textureStore(divDst, g, vec4f(0.5 * ((r - l) + (t - b)), 0.0, 0.0, 1.0));
}
`

const WGSL_JACOBI = COMMON + SIM_HEAD + /* wgsl */ `
@group(0) @binding(2) var presSrc: texture_2d<f32>;
@group(0) @binding(3) var presDst: texture_storage_2d<rgba16float, write>;
@group(0) @binding(4) var divSrc: texture_2d<f32>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) gid: vec3u) {
  let g = vec2i(gid.xy);
  let dim = vec2i(S.grid);
  if (g.x >= dim.x || g.y >= dim.y) { return; }
  let l = textureLoad(presSrc, cl(g - vec2i(1, 0)), 0).x;
  let r = textureLoad(presSrc, cl(g + vec2i(1, 0)), 0).x;
  let b = textureLoad(presSrc, cl(g - vec2i(0, 1)), 0).x;
  let t = textureLoad(presSrc, cl(g + vec2i(0, 1)), 0).x;
  let d = textureLoad(divSrc, g, 0).x;
  textureStore(presDst, g, vec4f((l + r + b + t - d) * 0.25, 0.0, 0.0, 1.0));
}
`

const WGSL_PROJECT = COMMON + SIM_HEAD + /* wgsl */ `
@group(0) @binding(2) var velSrc: texture_2d<f32>;
@group(0) @binding(3) var velDst: texture_storage_2d<rgba16float, write>;
@group(0) @binding(4) var presSrc: texture_2d<f32>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) gid: vec3u) {
  let g = vec2i(gid.xy);
  let dim = vec2i(S.grid);
  if (g.x >= dim.x || g.y >= dim.y) { return; }
  let l = textureLoad(presSrc, cl(g - vec2i(1, 0)), 0).x;
  let r = textureLoad(presSrc, cl(g + vec2i(1, 0)), 0).x;
  let b = textureLoad(presSrc, cl(g - vec2i(0, 1)), 0).x;
  let t = textureLoad(presSrc, cl(g + vec2i(0, 1)), 0).x;
  var v = textureLoad(velSrc, g, 0).xy;
  v -= 0.5 * vec2f(r - l, t - b);
  textureStore(velDst, g, vec4f(v, 0.0, 1.0));
}
`

const WGSL_ADVECT_DYE = COMMON + SIM_HEAD + /* wgsl */ `
@group(0) @binding(2) var dyeSrc: texture_2d<f32>;
@group(0) @binding(3) var dyeDst: texture_storage_2d<rgba16float, write>;
@group(0) @binding(4) var velSrc: texture_2d<f32>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) gid: vec3u) {
  let g = vec2i(gid.xy);
  let dim = vec2i(S.grid);
  if (g.x >= dim.x || g.y >= dim.y) { return; }
  let uv = (vec2f(g) + 0.5) * S.inv;

  let v = textureSampleLevel(velSrc, samp, uv, 0.0).xy;
  let back = clamp(uv - v * S.dt, vec2f(0.001), vec2f(0.999));
  var d = textureSampleLevel(dyeSrc, samp, back, 0.0) * S.decay;

  let base = baseColour(uv, S.time);
  let front = S.boot * 1.45 - 0.22;
  let arrived = clamp((front - uv.x) * 5.0 + 0.4, 0.0, 1.0);
  let edge = exp(-pow((uv.x - front) / 0.085, 2.0));
  // the medium is never a flat wash: dye enters in clumps that the flow then
  // stretches into filaments, which is what gives it thickness and grain
  let sp = vec2f(uv.x * S.aspect, uv.y);
  let n1 = fbm(sp * 3.1 + vec2f(S.time * 0.037, -S.time * 0.028));
  let n2 = fbm(sp * 8.4 + vec2f(-S.time * 0.052, S.time * 0.041) + 31.0);
  let clump = pow(n1 * 0.72 + n2 * 0.46, 2.5) * 4.2;
  let comp = compose(uv);
  // the noise gives the medium its grain; the composition gives it its palette
  let tint = mix(base, comp.rgb, 0.68);
  let inj = (0.34 * arrived * comp.a * (0.04 + clump) + 1.2 * edge) * S.dt;
  d += vec4f(tint * inj, inj);

  for (var i = 0u; i < 4u; i = i + 1u) {
    let s = S.splats[i];
    if (s.w > 0.0 && S.svel[i].w > 0.0) {
      let dd = (uv - s.xy) * vec2f(S.aspect, 1.0);
      let w = exp(-dot(dd, dd) / max(s.z * s.z, 1e-6)) * s.w * S.svel[i].w * S.dt;
      let col = mix(base, mix(VIOLET, INDIGO, S.svel[i].z * 0.7), 0.88);
      d += vec4f(col * w, w);
    }
  }

  if (S.pulse.z > 0.0) {
    let dd = (uv - S.pulse.xy) * vec2f(S.aspect, 1.0);
    let w = exp(-pow(length(dd) / max(S.pulse.w * 1.2, 1e-4), 2.0)) * S.pulse.z * S.dt * 1.6;
    d += vec4f(mix(base, VIOLET, 0.45) * w * 0.7, w * 0.7);
  }

  textureStore(dyeDst, g, min(d, vec4f(7.0)));
}
`

const WGSL_RENDER = COMMON + /* wgsl */ `
struct Uni {
  res: vec2f,
  inv: vec2f,
  time: f32,
  boot: f32,
  lensOn: f32,
  maskFade: f32,
  lens: vec2f,
  lensR: f32,
  reduced: f32,
  mask: vec4f,
  pulses: array<vec4f, 3>,
  panels: array<vec4f, 4>,
  panelR: vec4f,
  glass: f32,
  grain: f32,
  scale: f32,
  aspect: f32,
  grid: vec2f,
};
@group(0) @binding(0) var<uniform> U: Uni;
@group(0) @binding(1) var samp: sampler;
@group(0) @binding(2) var dyeTex: texture_2d<f32>;
@group(0) @binding(3) var maskTex: texture_2d<f32>;

fn fieldRaw(uv: vec2f) -> vec4f {
  return textureSampleLevel(dyeTex, samp, clamp(uv, vec2f(0.0015), vec2f(0.9985)), 0.0);
}

/**
 * density and colour -> what the eye sees on paper.
 * The paper is never fully covered: this is light ON a sheet, not a sheet of
 * light, which is what keeps every word on the page readable.
 */
fn tone(s: vec4f) -> vec3f {
  let dens = s.a;
  var col = s.rgb / max(dens, 1e-3);
  let lum = dot(col, vec3f(0.299, 0.587, 0.114));
  col = clamp(mix(vec3f(lum), col, 1.20), vec3f(0.0), vec3f(1.4));
  let a = 1.0 - exp(-dens * 0.95);
  // the medium TINTS the sheet rather than covering it: thin light leaves the
  // paper's own brightness alone, thick light stains it a real colour
  let filt = clamp(col * 1.20 + 0.02, vec3f(0.0), vec3f(1.7));
  return PAPER * mix(vec3f(1.0), filt, clamp(a * 0.94, 0.0, 1.0));
}

/** the medium as a flat colour — used inside glass, where we pay per channel */
fn mediumFlat(uv: vec2f) -> vec3f {
  return tone(fieldRaw(uv));
}

/** the medium with thickness shading, caustics and veins */
fn mediumFull(uv: vec2f) -> vec3f {
  // step the stencil in SIM CELLS. Stepping in canvas pixels samples inside a
  // single bilinear-filtered cell, and the second derivative of a linear ramp
  // is a hard edge — which is what put blocky colour fringes in the light.
  let e = 1.7 / U.grid;
  let c0 = fieldRaw(uv);
  let dl = fieldRaw(uv - vec2f(e.x, 0.0)).a;
  let dr = fieldRaw(uv + vec2f(e.x, 0.0)).a;
  let db = fieldRaw(uv - vec2f(0.0, e.y)).a;
  let dt = fieldRaw(uv + vec2f(0.0, e.y)).a;
  let dens = c0.a;
  let grad = vec2f(dr - dl, dt - db);
  let lap = (dl + dr + db + dt) - 4.0 * dens;
  let a = 1.0 - exp(-dens * 1.15);
  var c = tone(c0);

  // thickness: the medium shades itself, so it reads as depth not wallpaper
  let n = normalize(vec3f(-grad * 58.0, 1.0));
  let L = normalize(vec3f(-0.42, -0.62, 0.66));
  c *= mix(1.0, 0.68 + 0.66 * (dot(n, L) * 0.5 + 0.5), a * 0.95);

  // caustics: where the medium focuses, thin curved highlights land on paper
  // the caustic is a second derivative, so it screams at the frame edge where
  // the boundary condition piles the medium up; keep it to the interior
  let inte = smoothstep(0.0, 0.075, uv.y) * smoothstep(0.0, 0.075, 1.0 - uv.y)
           * smoothstep(0.0, 0.05, uv.x) * smoothstep(0.0, 0.05, 1.0 - uv.x);
  let caus = pow(clamp(-lap * 34.0, 0.0, 1.0), 2.1) * inte;
  let irid = 0.5 + 0.5 * cos(6.2831 * (dens * 0.5 + vec3f(0.0, 0.33, 0.67)));
  c += caus * mix(mix(vec3f(1.0), c, 0.5), irid, 0.45) * 0.36 * (0.2 + a);

  // veins drifting through the dye
  let band = abs(fract(dens * 1.7 - U.time * 0.05) - 0.5);
  c += smoothstep(0.016, 0.0, band) * a * 0.12 * inte * mix(vec3f(1.0), c, 0.45);
  return c;
}

fn sdBox(p: vec2f, b: vec2f, r: f32) -> f32 {
  let q = abs(p) - b + vec2f(r);
  return length(max(q, vec2f(0.0))) + min(max(q.x, q.y), 0.0) - r;
}

@vertex
fn vs(@builtin(vertex_index) vi: u32) -> @builtin(position) vec4f {
  var p = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
  return vec4f(p[vi], 0.0, 1.0);
}

@fragment
fn fs(@builtin(position) fc: vec4f) -> @location(0) vec4f {
  let px = fc.xy;
  var uv = px * U.inv;

  // ---- the lens: the pointer is a piece of glass with mass ----
  var lensRim = 0.0;
  var lensSpec = 0.0;
  var lensIn = 0.0;
  if (U.lensOn > 0.002) {
    let dl = px - U.lens;
    let r = length(dl);
    if (r < U.lensR * 1.06) {
      let q = min(r / U.lensR, 1.0);
      let k = sqrt(max(1.0 - q * q, 0.0));
      let bend = 1.0 - k;
      uv += normalize(dl + vec2f(1e-4)) * bend * U.lensR * 0.40 * U.inv * U.lensOn;
      lensIn = (1.0 - smoothstep(0.97, 1.0, q)) * U.lensOn;
      lensRim = smoothstep(0.80, 0.99, q) * (1.0 - smoothstep(0.99, 1.04, r / U.lensR)) * U.lensOn;
      let n = normalize(vec3f(dl / U.lensR, k * 1.15));
      lensSpec = pow(max(dot(n, normalize(vec3f(-0.52, -0.66, 0.54))), 0.0), 24.0) * U.lensOn;
    }
  }

  // ---- click pulses: a pressure ring travelling through the medium ----
  var pulseGlow = 0.0;
  for (var i = 0u; i < 3u; i = i + 1u) {
    let p = U.pulses[i];
    if (p.w > 0.002) {
      let d = length(px - p.xy);
      let rad = p.z * 1150.0 * U.scale;
      let w = exp(-pow((d - rad) / (44.0 * U.scale), 2.0)) * p.w;
      uv += normalize(px - p.xy + vec2f(1e-4)) * w * 11.0 * U.scale * U.inv;
      pulseGlow += w;
    }
  }

  var col = mediumFull(uv);

  // ---- glass panels: bevel normal, refraction, dispersion, rim, caustic ----
  for (var i = 0u; i < 4u; i = i + 1u) {
    let P = U.panels[i];
    if (P.z > 2.0) {
      let cen = P.xy + P.zw * 0.5;
      let hs = P.zw * 0.5;
      let rr = min(U.panelR[i], min(hs.x, hs.y));
      let q = px - cen;
      let sd = sdBox(q, hs, rr);
      let bev = 18.0 * U.scale;
      if (sd < 76.0 * U.scale) {
        let ex = vec2f(1.3 * U.scale, 0.0);
        let ey = vec2f(0.0, 1.3 * U.scale);
        let gx = sdBox(q + ex, hs, rr) - sdBox(q - ex, hs, rr);
        let gy = sdBox(q + ey, hs, rr) - sdBox(q - ey, hs, rr);
        let gr = normalize(vec2f(gx, gy) + vec2f(1e-5, 1e-5));
        let h = smoothstep(0.0, -bev, sd);
        let disp = -gr * (1.0 - h) * bev * 1.7;
        let cr = mediumFlat(uv + disp * 1.12 * U.inv).r;
        let cg = mediumFlat(uv + disp * 1.00 * U.inv).g;
        let cb = mediumFlat(uv + disp * 0.88 * U.inv).b;
        let refr = vec3f(cr, cg, cb);
        // a slab of glass over paper, not fog: the panel keeps its own white
        // and lets the medium through as a tint, so the type inside stays crisp
        var body = mix(vec3f(0.995, 0.998, 0.990), refr, 0.21 + 0.20 * (1.0 - h));
        let rim = smoothstep(2.6 * U.scale, 0.0, abs(sd + 1.7 * U.scale));
        let n3 = normalize(vec3f(gr * (1.0 - h) * 1.7, 0.60));
        let spec = pow(max(dot(n3, normalize(vec3f(-0.55, -0.66, 0.51))), 0.0), 16.0);
        body += vec3f(rim * 0.20) + vec3f(spec * 0.44 * (1.0 - h));
        let inside = 1.0 - smoothstep(-1.0 * U.scale, 1.0 * U.scale, sd);
        col = mix(col, body, inside * U.glass);
        // the light the slab throws onto the paper just below it
        let outside = smoothstep(0.0, 11.0 * U.scale, sd) * (1.0 - smoothstep(11.0 * U.scale, 42.0 * U.scale, sd));
        let down = smoothstep(0.0, 20.0 * U.scale, q.y - hs.y * 0.88);
        col += outside * down * mediumFlat(uv) * 0.10 * U.glass;
      }
    }
  }

  // ---- glass headline: the real glyphs, cut from the same light ----
  if (U.maskFade > 0.002 && U.mask.z > 1.0) {
    let mu = (px - U.mask.xy) / U.mask.zw;
    if (mu.x > 0.0 && mu.x < 1.0 && mu.y > 0.0 && mu.y < 1.0) {
      let t0 = textureSampleLevel(maskTex, samp, mu, 0.0);
      let m = t0.r;
      let halo = t0.b;
      if (m + halo > 0.004) {
        let e = vec2f(1.7 * U.scale, 1.7 * U.scale) / U.mask.zw;
        let gx = textureSampleLevel(maskTex, samp, mu + vec2f(e.x, 0.0), 0.0).g
               - textureSampleLevel(maskTex, samp, mu - vec2f(e.x, 0.0), 0.0).g;
        let gy = textureSampleLevel(maskTex, samp, mu + vec2f(0.0, e.y), 0.0).g
               - textureSampleLevel(maskTex, samp, mu - vec2f(0.0, e.y), 0.0).g;
        let grad = vec2f(gx, gy);
        let disp = -grad * 190.0 * U.scale;
        let cr = mediumFlat(uv + disp * 1.16 * U.inv).r;
        let cg = mediumFlat(uv + disp * 1.00 * U.inv).g;
        let cb = mediumFlat(uv + disp * 0.84 * U.inv).b;
        let refr = clamp(vec3f(cr, cg, cb), vec3f(0.0), vec3f(1.4));

        // the letters keep the site's own headline gradient as their tint
        let tx = clamp((px.x - U.mask.x) / U.mask.z, 0.0, 1.0);
        var tint = mix(vec3f(0.150, 0.262, 0.492), vec3f(0.232, 0.183, 0.436), smoothstep(0.02, 0.48, tx));
        tint = mix(tint, vec3f(0.454, 0.093, 0.320), smoothstep(0.44, 0.94, tx));
        // coloured glass: the site's gradient is the material, the medium is
        // the lamp behind it. The DOM headline keeps most of its ink on top of
        // this, so the glass can afford to carry the light rather than the
        // weight — the two together are darker than either alone.
        let lum = dot(refr, vec3f(0.299, 0.587, 0.114));
        let body = tint * (0.52 + 0.24 * lum) + refr * 0.18;

        let edge = clamp(length(grad) * 26.0, 0.0, 1.0);
        let n3 = normalize(vec3f(-grad * 110.0, 0.55));
        let spec = pow(max(dot(n3, normalize(vec3f(-0.45, -0.72, 0.53))), 0.0), 14.0);
        let lc = body + vec3f(0.78, 0.56, 0.92) * edge * 0.26 + vec3f(spec * 0.40);
        // erode the antialiased rim of the coverage: the canvas runs below the
        // screen's own pixel ratio, so an un-eroded edge peeks out from under
        // the DOM ink and reads as a ghost of the letter
        let mm = smoothstep(0.30, 0.82, m);
        col = mix(col, lc, mm * U.maskFade);

        // the caustic the headline throws on the paper
        let bloom = clamp(halo - m, 0.0, 1.0);
        col += bloom * bloom * mediumFlat(uv) * 0.16 * U.maskFade;
      }
    }
  }

  col += vec3f(lensIn * 0.022) + vec3f(lensRim * 0.20) + vec3f(lensSpec * 0.52);
  col += pulseGlow * vec3f(0.62, 0.48, 0.70) * 0.28;

  let vg = 1.0 - 0.10 * smoothstep(0.36, 1.0, length((uv - 0.5) * vec2f(1.0, 0.86)) * 1.55);
  col *= vg;
  col += (hash21(px + U.time * 57.0) - 0.5) * U.grain;

  return vec4f(clamp(col, vec3f(0.0), vec3f(1.0)), 1.0);
}
`

export interface Backend {
  tier: Tier
  info: string
  grid: [number, number]
  resize(w: number, h: number): void
  setMask(src: HTMLCanvasElement): void
  frame(u: Float32Array, s: Float32Array, iterations: number): void
  destroy(): void
}

type Tex = GPUTexture

export async function createGpuBackend(
  canvas: HTMLCanvasElement,
  gridW: number,
  gridH: number,
  onLost?: () => void,
  timeoutMs = 2600,
): Promise<Backend | null> {
  const nav = navigator as Navigator & { gpu?: GPU }
  if (!nav.gpu) return null

  const withTimeout = <T,>(p: Promise<T>): Promise<T | null> =>
    Promise.race([p.catch(() => null), new Promise<null>((r) => setTimeout(() => r(null), timeoutMs))])

  const adapter = await withTimeout(nav.gpu.requestAdapter({ powerPreference: 'high-performance' }))
  if (!adapter) return null
  const device = await withTimeout(adapter.requestDevice())
  if (!device) return null

  const ctx = canvas.getContext('webgpu') as GPUCanvasContext | null
  if (!ctx) return null
  const format = nav.gpu.getPreferredCanvasFormat()
  ctx.configure({ device, format, alphaMode: 'opaque' })

  let lost = false
  device.lost.then(() => {
    lost = true
    onLost?.()
  })

  const samp = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear',
    addressModeU: 'clamp-to-edge',
    addressModeV: 'clamp-to-edge',
  })

  const simBuf = device.createBuffer({ size: S.SIZE * 4, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST })
  const uniBuf = device.createBuffer({ size: R.SIZE * 4, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST })

  const mkCompute = (code: string) =>
    device.createComputePipelineAsync({
      layout: 'auto',
      compute: { module: device.createShaderModule({ code }), entryPoint: 'main' },
    })

  const [pAdvV, pDiv, pJac, pProj, pAdvD, pRender] = await Promise.all([
    mkCompute(WGSL_ADVECT_VEL),
    mkCompute(WGSL_DIVERGENCE),
    mkCompute(WGSL_JACOBI),
    mkCompute(WGSL_PROJECT),
    mkCompute(WGSL_ADVECT_DYE),
    device.createRenderPipelineAsync({
      layout: 'auto',
      vertex: { module: device.createShaderModule({ code: WGSL_RENDER }), entryPoint: 'vs' },
      fragment: {
        module: device.createShaderModule({ code: WGSL_RENDER }),
        entryPoint: 'fs',
        targets: [{ format }],
      },
      primitive: { topology: 'triangle-list' },
    }),
  ])

  const mkTex = (w: number, h: number): Tex =>
    device.createTexture({
      size: [w, h],
      format: 'rgba16float',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST,
    })

  const gw = gridW
  const gh = gridH
  const vel: Tex[] = [mkTex(gw, gh), mkTex(gw, gh)]
  const dye: Tex[] = [mkTex(gw, gh), mkTex(gw, gh)]
  const pres: Tex[] = [mkTex(gw, gh), mkTex(gw, gh)]
  const div = mkTex(gw, gh)

  // a 1x1 stand-in until the headline mask has been rasterised
  let maskTex = device.createTexture({
    size: [1, 1],
    format: 'rgba8unorm',
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
  })
  device.queue.writeTexture({ texture: maskTex }, new Uint8Array([0, 0, 0, 255]), { bytesPerRow: 4 }, [1, 1])

  // `layout: 'auto'` strips bindings a shader does not use, so the passes that
  // only textureLoad (divergence, pressure, projection) must not be handed a
  // sampler — binding one would invalidate the whole bind group.
  const bg = (
    pipe: GPUComputePipeline,
    entries: { binding: number; resource: GPUBindingResource }[],
    sampled = true,
  ): GPUBindGroup =>
    device.createBindGroup({
      layout: pipe.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: simBuf } },
        ...(sampled ? [{ binding: 1, resource: samp }] : []),
        ...entries,
      ],
    })

  const view = (t: Tex) => t.createView()

  const bgAdvV = [0, 1].map((i) =>
    bg(pAdvV, [
      { binding: 2, resource: view(vel[i]) },
      { binding: 3, resource: view(vel[1 - i]) },
    ]),
  )
  const bgDiv = [0, 1].map((i) =>
    bg(
      pDiv,
      [
        { binding: 2, resource: view(vel[i]) },
        { binding: 3, resource: view(div) },
      ],
      false,
    ),
  )
  const bgJac = [0, 1].map((i) =>
    bg(
      pJac,
      [
        { binding: 2, resource: view(pres[i]) },
        { binding: 3, resource: view(pres[1 - i]) },
        { binding: 4, resource: view(div) },
      ],
      false,
    ),
  )
  const bgProj: GPUBindGroup[] = []
  for (let v = 0; v < 2; v++)
    for (let p = 0; p < 2; p++)
      bgProj[v * 2 + p] = bg(
        pProj,
        [
          { binding: 2, resource: view(vel[v]) },
          { binding: 3, resource: view(vel[1 - v]) },
          { binding: 4, resource: view(pres[p]) },
        ],
        false,
      )
  const bgAdvD: GPUBindGroup[] = []
  for (let d = 0; d < 2; d++)
    for (let v = 0; v < 2; v++)
      bgAdvD[d * 2 + v] = bg(pAdvD, [
        { binding: 2, resource: view(dye[d]) },
        { binding: 3, resource: view(dye[1 - d]) },
        { binding: 4, resource: view(vel[v]) },
      ])

  let renderBG: GPUBindGroup[] = []
  const buildRenderBG = () => {
    renderBG = [0, 1].map((i) =>
      device.createBindGroup({
        layout: pRender.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: uniBuf } },
          { binding: 1, resource: samp },
          { binding: 2, resource: view(dye[i]) },
          { binding: 3, resource: maskTex.createView() },
        ],
      }),
    )
  }
  buildRenderBG()

  const gx = Math.ceil(gw / 8)
  const gy = Math.ceil(gh / 8)

  let velI = 0
  let dyeI = 0

  const info = (() => {
    const a = adapter as GPUAdapter & { info?: { vendor?: string; architecture?: string; description?: string } }
    const i = a.info
    const bits = [i?.architecture, i?.vendor, i?.description].filter(Boolean) as string[]
    return bits.length ? bits.join(' ') : 'gpu adapter'
  })()

  return {
    tier: 'webgpu',
    info,
    grid: [gw, gh],
    resize(w: number, h: number) {
      canvas.width = w
      canvas.height = h
    },
    setMask(src: HTMLCanvasElement) {
      if (lost) return
      maskTex.destroy()
      maskTex = device.createTexture({
        size: [src.width, src.height],
        format: 'rgba8unorm',
        usage:
          GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
      })
      device.queue.copyExternalImageToTexture({ source: src }, { texture: maskTex }, [src.width, src.height])
      buildRenderBG()
    },
    frame(u: Float32Array, s: Float32Array, iterations: number) {
      if (lost) return
      device.queue.writeBuffer(simBuf, 0, s as unknown as ArrayBufferView & { buffer: ArrayBuffer })
      device.queue.writeBuffer(uniBuf, 0, u as unknown as ArrayBufferView & { buffer: ArrayBuffer })
      const enc = device.createCommandEncoder()

      const pass = enc.beginComputePass()
      pass.setPipeline(pAdvV)
      pass.setBindGroup(0, bgAdvV[velI])
      pass.dispatchWorkgroups(gx, gy)
      velI = 1 - velI

      pass.setPipeline(pDiv)
      pass.setBindGroup(0, bgDiv[velI])
      pass.dispatchWorkgroups(gx, gy)

      let presI = 0
      pass.setPipeline(pJac)
      for (let k = 0; k < iterations; k++) {
        pass.setBindGroup(0, bgJac[presI])
        pass.dispatchWorkgroups(gx, gy)
        presI = 1 - presI
      }

      pass.setPipeline(pProj)
      pass.setBindGroup(0, bgProj[velI * 2 + presI])
      pass.dispatchWorkgroups(gx, gy)
      velI = 1 - velI

      pass.setPipeline(pAdvD)
      pass.setBindGroup(0, bgAdvD[dyeI * 2 + velI])
      pass.dispatchWorkgroups(gx, gy)
      dyeI = 1 - dyeI
      pass.end()

      const rp = enc.beginRenderPass({
        colorAttachments: [
          {
            view: ctx.getCurrentTexture().createView(),
            clearValue: { r: 0.96, g: 0.97, b: 0.95, a: 1 },
            loadOp: 'clear',
            storeOp: 'store',
          },
        ],
      })
      rp.setPipeline(pRender)
      rp.setBindGroup(0, renderBG[dyeI])
      rp.draw(3)
      rp.end()

      device.queue.submit([enc.finish()])
    },
    destroy() {
      try {
        device.destroy()
      } catch {
        /* already gone */
      }
    },
  }
}
