/**
 * The deck's light. One image, written twice: once in GLSL ES 3.00 for the
 * WebGL2 tier, once in WGSL for the WebGPU tier. They read the same uniform
 * bytes (see uniforms.ts) and are kept structurally identical on purpose.
 *
 * What it draws, back to front:
 *   1. a dark ground and a drifting volumetric haze (fractal value noise,
 *      three depth layers, each parallaxing at its own rate)
 *   2. a perspective floor grid, analytically antialiased (no fwidth, so it
 *      can be resampled inside a refraction branch)
 *   3. for every pane: its lit edge bleeding INTO the haze — a hot core, a
 *      halo and a wide room-light term, the last two scaled by the fog
 *      density at that pixel — plus a caustic pool on the floor beneath it
 *      and, for the identity plate, a downward light shaft
 *   4. for every pane, back to front: the glass body — the haze behind it,
 *      resampled through a rim-weighted refraction offset with a chromatic
 *      split, darkened and tinted, plus a Fresnel rim, a plate gradient, a
 *      key-light streak and an anisotropic pointer sheen. Light that other
 *      panes threw into the room is carried onto the glass, so lifting one
 *      pane really does light its neighbours.
 *   5. vignette, Reinhard tone map, and a per-pixel dither that kills the
 *      banding a smooth fog would otherwise show on an 8-bit target
 */

/* ------------------------------------------------------------------ GLSL */

export const GLSL_VERT = `#version 300 es
void main(){
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`

export const GLSL_FRAG = `#version 300 es
precision highp float;
out vec4 fragColor;

layout(std140) uniform U {
  vec4 G[4];
  vec4 P[36];
};

#define RES     G[0].xy
#define TIME    G[0].z
#define POWER   G[0].w
#define SWEEP   G[1].x
#define QUAL    G[1].w
#define SCROLL  G[2].x
#define CAMZ    G[2].y
#define FOG     G[2].z
#define SCALE   G[2].w

float hash21(vec2 p){
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm2(vec2 p){
  float v = 0.5 * vnoise(p);
  p *= 2.03; v += 0.25 * vnoise(p);
  return v * 1.3333;
}
float fbm3(vec2 p){
  float v = 0.5 * vnoise(p);
  p *= 2.03; v += 0.25 * vnoise(p);
  p *= 2.03; v += 0.125 * vnoise(p);
  return v * 1.1428;
}

vec2 hzc(vec2 q){
  return (q - 0.5 * RES) / RES.y * 1.55 + vec2(0.0, CAMZ * 0.00042 + SCROLL * 0.00016);
}
/* full-quality haze — one call per pixel */
float hazeHi(vec2 q){
  vec2 z = hzc(q);
  float t = TIME;
  float f  = 0.56 * fbm3(z * 1.22 + vec2( t * 0.030, -t * 0.018));
  f       += 0.30 * fbm3(z * 2.60 + vec2(-t * 0.046,  t * 0.027) + 4.1);
  f       += QUAL * 0.20 * fbm3(z * 5.40 + vec2(t * 0.074, t * 0.043) + 9.3);
  return pow(f, 2.35) * 2.05;
}
/* cheap haze — the three refracted samples inside glass */
float hazeLo(vec2 q){
  vec2 z = hzc(q);
  float t = TIME;
  float f  = 0.56 * fbm2(z * 1.22 + vec2( t * 0.030, -t * 0.018));
  f       += 0.30 * fbm2(z * 2.60 + vec2(-t * 0.046,  t * 0.027) + 4.1);
  return pow(f, 2.35) * 2.05;
}

/* Perspective floor. Derivative-free antialiasing so it stays legal (and
   correct) when sampled through the glass refraction offset. */
float gridAt(vec2 q){
  float yh = RES.y * 0.175;
  float dy = q.y - yh;
  if (dy < 6.0) return 0.0;
  float depth = 820.0 / dy;
  float K = 0.60 * RES.x;
  vec2 wp = vec2((q.x - RES.x * 0.5) * depth / K, depth - TIME * 0.60 - CAMZ * 0.0024);
  vec2 wd = vec2(depth / K, depth * depth / 820.0);
  vec2 cell = wp * 0.5;
  vec2 cd = max(wd * 0.5, vec2(1e-4));
  vec2 g = abs(fract(cell) - 0.5) / cd;
  float line = 1.0 - min(min(g.x, g.y), 1.0);
  float fade = exp(-depth * 0.0135) * smoothstep(0.0, RES.y * 0.11, dy);
  return line * fade;
}

vec3 groundAt(vec2 q){
  float v = q.y / RES.y;
  vec3 top = vec3(0.0340, 0.0290, 0.0690);
  vec3 mid = vec3(0.0575, 0.0470, 0.1090);
  vec3 bot = vec3(0.0270, 0.0235, 0.0545);
  return mix(mix(top, mid, smoothstep(0.0, 0.52, v)), bot, smoothstep(0.52, 1.0, v));
}

vec3 backdrop(vec2 q, vec3 hz){
  vec3 c = groundAt(q);
  /* the air is iridescent: it shifts electric blue -> violet across the room,
     the way the old hero's holographic field did */
  vec3 tint = mix(vec3(0.215, 0.300, 0.740), vec3(0.455, 0.235, 0.545), clamp(q.x / RES.x, 0.0, 1.0));
  c += tint * max(hz - 0.14, vec3(0.0)) * (0.94 * FOG);
  c += vec3(0.155, 0.295, 0.670) * gridAt(q) * (0.62 * POWER);
  return c;
}

float sdRound(vec2 p, vec2 b, float r){
  vec2 d = abs(p) - b + r;
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - r;
}
vec2 sdGradient(vec2 p, vec2 b, float r){
  vec2 d = abs(p) - b + r;
  vec2 s = sign(p);
  if (d.x > 0.0 && d.y > 0.0) return normalize(d + 1e-5) * s;
  return (d.x > d.y ? vec2(s.x, 0.0) : vec2(0.0, s.y));
}

void main(){
  vec2 q = vec2(gl_FragCoord.x, RES.y * SCALE - gl_FragCoord.y) / SCALE;

  float hzv = hazeHi(q);
  vec3 base0 = backdrop(q, vec3(hzv));
  vec3 col = base0;

  /* ---- pass 1: every pane's light goes into the room ---- */
  for (int i = 0; i < 6; i++){
    int b = i * 6;
    vec4 li = P[b + 3];
    if (li.w <= 0.002) continue;
    vec4 r0 = P[b + 0], r1 = P[b + 1], r2 = P[b + 2];
    vec4 ce = P[b + 4], ex = P[b + 5];
    vec3 pq = vec3(q, 1.0);
    float w = dot(r2.xyz, pq);
    if (abs(w) < 1e-5) continue;
    vec2 lp = vec2(dot(r0.xyz, pq), dot(r1.xyz, pq)) / w;
    vec2 hs = vec2(r0.w, r1.w);
    float d = sdRound(lp, hs, r2.w);
    float ad = abs(d);
    /* the pane is lit by strip lights on its top and bottom rails, so the
       edge is never an even neon outline: the sides only catch the spill, and
       what reaches the room is mostly the wide, fog-scaled glow */
    vec2 en = sdGradient(lp, hs, r2.w);
    float band = mix(0.06, 1.0, abs(en.y)) * (en.y < 0.0 ? 1.0 : 0.66);
    float fogMod = 0.34 + 1.05 * hzv;
    float core = exp(-ad * 0.200) * band;
    float halo = exp(-ad * 0.021) * mix(0.30, 1.0, band);
    float wide = exp(-ad * 0.0042);
    col += li.rgb * (core * 0.105 + halo * 0.125 * fogMod + wide * 0.055 * fogMod) * li.w;

    /* caustic pool on the floor under the pane */
    vec2 rel = (q - vec2(ce.x, ce.y + hs.y * 1.62)) / vec2(hs.x * 1.15, hs.y * 0.60);
    col += li.rgb * exp(-dot(rel, rel) * 1.50) * (0.078 * li.w) * (0.35 + 0.80 * hzv);

    /* volumetric shaft falling from the plate's bottom edge */
    if (ex.x > 0.001){
      float sy = q.y - (ce.y + hs.y);
      if (sy > 0.0){
        float spread = 1.0 + sy * 0.0022;
        float sx = abs(q.x - ce.x) / (hs.x * spread);
        float shaft = smoothstep(1.02, 0.10, sx) * exp(-sy * 0.0019);
        col += li.rgb * shaft * (ex.x * 0.075) * (0.22 + 1.10 * hzv);
      }
    }
  }

  /* light that reached this pixel from the panes — glass in front of it
     still receives it, so a lifted pane really does light its neighbours */
  vec3 room = col - base0;

  /* dust in the air: sparse motes that are only visible where light is */
  {
    vec2 dq = q * 0.045;
    vec2 di = floor(dq);
    vec2 df = fract(dq) - 0.5;
    float h1 = hash21(di);
    float h2 = hash21(di + 7.7);
    vec2 wob = vec2(sin(TIME * 0.34 + h1 * 41.0), cos(TIME * 0.27 + h2 * 37.0)) * 0.30;
    float mote = smoothstep(0.9950, 1.0, h1) * smoothstep(0.17, 0.0, length(df - wob));
    col += room * mote * 2.4;
  }

  /* ---- pass 2: glass bodies, back to front ---- */
  for (int i = 0; i < 6; i++){
    int b = i * 6;
    vec4 li = P[b + 3];
    vec4 ce = P[b + 4];
    if (ce.w <= 0.002) continue;
    vec4 r0 = P[b + 0], r1 = P[b + 1], r2 = P[b + 2];
    vec4 ex = P[b + 5];
    vec3 pq = vec3(q, 1.0);
    float w = dot(r2.xyz, pq);
    if (abs(w) < 1e-5) continue;
    vec2 lp = vec2(dot(r0.xyz, pq), dot(r1.xyz, pq)) / w;
    vec2 hs = vec2(r0.w, r1.w);
    float d = sdRound(lp, hs, r2.w);
    if (d > 0.0) continue;

    float inMask = smoothstep(0.0, -1.3, d) * ce.w;
    float edgeT = 1.0 - clamp(-d / 34.0, 0.0, 1.0);
    vec2 nrm = sdGradient(lp, hs, r2.w);
    vec2 off = nrm * (pow(edgeT, 1.6) * 46.0 + 3.0);

    float hg = hazeLo(q + off);
    vec3 hzr = vec3(hg);
    if (edgeT > 0.045){
      hzr.r = hazeLo(q + off * 1.16);
      hzr.b = hazeLo(q + off * 0.84);
    }
    vec3 bg2 = backdrop(q + off, hzr);

    vec3 glass = bg2 * 0.72;
    glass = mix(glass, vec3(0.0340, 0.0290, 0.0620), 0.30);
    /* the plate catches room light from above */
    float vgrad = clamp(0.5 - lp.y / (hs.y * 2.0), 0.0, 1.0);
    glass += vec3(0.050, 0.056, 0.092) * vgrad * 0.60;
    glass += li.rgb * (pow(edgeT, 2.2) * 0.19 + pow(edgeT, 7.0) * 0.32) * li.w;
    glass += room * 0.34;

    /* an anisotropic sheen that slides across the glass under the pointer */
    vec2 dsp = (lp - ex.yz) / vec2(max(hs.x * 0.85, 1.0), max(hs.y * 0.40, 1.0));
    float sp = exp(-dot(dsp, dsp) * 1.5) * ex.w;
    glass += (li.rgb * 0.42 + 0.58) * sp * (0.070 + 0.10 * ce.z);

    /* fixed key light, so every pane shares one room */
    float streak = exp(-abs(lp.x * 0.42 + lp.y + hs.y * 0.34) / max(hs.y * 0.55, 1.0));
    glass += vec3(0.50, 0.57, 0.88) * streak * 0.034;

    col = mix(col, glass, inMask);
  }

  /* the power-on scan: a bar of light crossing the room once, the way the old
     hero's boot scanned the screen — here it is actually in the haze */
  if (SWEEP >= 0.0){
    float sx = SWEEP * RES.x;
    float dx = abs(q.x - sx);
    float band = exp(-dx / 130.0);
    float line = exp(-dx / 6.0);
    float amt = (0.30 + 1.30 * hzv);
    col += (vec3(0.52, 0.86, 0.34) * band * 0.15 + vec3(0.80, 1.00, 0.70) * line * 0.34) * amt;
  }

  vec2 vq = (q / RES - 0.5) * vec2(1.12, 1.0);
  col *= clamp(1.0 - 0.40 * pow(length(vq) * 1.42, 2.3), 0.32, 1.0);
  col = col / (1.0 + col * 0.58);
  col = pow(max(col, 0.0), vec3(0.95));
  col += (hash21(q + fract(TIME) * 97.0) - 0.5) * 0.0135;
  fragColor = vec4(col, 1.0);
}`

/* ------------------------------------------------------------------ WGSL */

export const WGSL = /* wgsl */ `
struct U {
  G : array<vec4f, 4>,
  P : array<vec4f, 36>,
};
@group(0) @binding(0) var<uniform> u : U;

fn RES()    -> vec2f { return u.G[0].xy; }
fn TIME()   -> f32   { return u.G[0].z; }
fn POWER()  -> f32   { return u.G[0].w; }
fn SWEEP()  -> f32   { return u.G[1].x; }
fn QUAL()   -> f32   { return u.G[1].w; }
fn SCROLL() -> f32   { return u.G[2].x; }
fn CAMZ()   -> f32   { return u.G[2].y; }
fn FOG()    -> f32   { return u.G[2].z; }
fn SCALE()  -> f32   { return u.G[2].w; }

@vertex
fn vs(@builtin(vertex_index) vi : u32) -> @builtin(position) vec4f {
  let p = vec2f(f32((vi << 1u) & 2u), f32(vi & 2u));
  return vec4f(p * 2.0 - 1.0, 0.0, 1.0);
}

fn hash21(p0 : vec2f) -> f32 {
  var p = fract(p0 * vec2f(123.34, 345.45));
  p += vec2f(dot(p, p + 34.345));
  return fract(p.x * p.y);
}
fn vnoise(p : vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let a = hash21(i);
  let b = hash21(i + vec2f(1.0, 0.0));
  let c = hash21(i + vec2f(0.0, 1.0));
  let d = hash21(i + vec2f(1.0, 1.0));
  let uu = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, uu.x), mix(c, d, uu.x), uu.y);
}
fn fbm2(p0 : vec2f) -> f32 {
  var p = p0;
  var v = 0.5 * vnoise(p);
  p *= 2.03; v += 0.25 * vnoise(p);
  return v * 1.3333;
}
fn fbm3(p0 : vec2f) -> f32 {
  var p = p0;
  var v = 0.5 * vnoise(p);
  p *= 2.03; v += 0.25 * vnoise(p);
  p *= 2.03; v += 0.125 * vnoise(p);
  return v * 1.1428;
}

fn hzc(q : vec2f) -> vec2f {
  return (q - 0.5 * RES()) / RES().y * 1.55 + vec2f(0.0, CAMZ() * 0.00042 + SCROLL() * 0.00016);
}
fn hazeHi(q : vec2f) -> f32 {
  let z = hzc(q);
  let t = TIME();
  var f = 0.56 * fbm3(z * 1.22 + vec2f( t * 0.030, -t * 0.018));
  f += 0.30 * fbm3(z * 2.60 + vec2f(-t * 0.046, t * 0.027) + 4.1);
  f += QUAL() * 0.20 * fbm3(z * 5.40 + vec2f(t * 0.074, t * 0.043) + 9.3);
  return pow(f, 2.35) * 2.05;
}
fn hazeLo(q : vec2f) -> f32 {
  let z = hzc(q);
  let t = TIME();
  var f = 0.56 * fbm2(z * 1.22 + vec2f( t * 0.030, -t * 0.018));
  f += 0.30 * fbm2(z * 2.60 + vec2f(-t * 0.046, t * 0.027) + 4.1);
  return pow(f, 2.35) * 2.05;
}

fn gridAt(q : vec2f) -> f32 {
  let yh = RES().y * 0.175;
  let dy = q.y - yh;
  if (dy < 6.0) { return 0.0; }
  let depth = 820.0 / dy;
  let K = 0.60 * RES().x;
  let wp = vec2f((q.x - RES().x * 0.5) * depth / K, depth - TIME() * 0.60 - CAMZ() * 0.0024);
  let wd = vec2f(depth / K, depth * depth / 820.0);
  let cell = wp * 0.5;
  let cd = max(wd * 0.5, vec2f(1e-4));
  let g = abs(fract(cell) - vec2f(0.5)) / cd;
  let line = 1.0 - min(min(g.x, g.y), 1.0);
  let fade = exp(-depth * 0.0135) * smoothstep(0.0, RES().y * 0.11, dy);
  return line * fade;
}

fn groundAt(q : vec2f) -> vec3f {
  let v = q.y / RES().y;
  let top = vec3f(0.0340, 0.0290, 0.0690);
  let mid = vec3f(0.0575, 0.0470, 0.1090);
  let bot = vec3f(0.0270, 0.0235, 0.0545);
  return mix(mix(top, mid, smoothstep(0.0, 0.52, v)), bot, smoothstep(0.52, 1.0, v));
}

fn backdrop(q : vec2f, hz : vec3f) -> vec3f {
  var c = groundAt(q);
  let tint = mix(vec3f(0.215, 0.300, 0.740), vec3f(0.455, 0.235, 0.545), clamp(q.x / RES().x, 0.0, 1.0));
  c += tint * max(hz - vec3f(0.14), vec3f(0.0)) * (0.94 * FOG());
  c += vec3f(0.155, 0.295, 0.670) * gridAt(q) * (0.62 * POWER());
  return c;
}

fn sdRound(p : vec2f, b : vec2f, r : f32) -> f32 {
  let d = abs(p) - b + vec2f(r);
  return min(max(d.x, d.y), 0.0) + length(max(d, vec2f(0.0))) - r;
}
fn sdGradient(p : vec2f, b : vec2f, r : f32) -> vec2f {
  let d = abs(p) - b + vec2f(r);
  let s = sign(p);
  if (d.x > 0.0 && d.y > 0.0) { return normalize(d + vec2f(1e-5)) * s; }
  if (d.x > d.y) { return vec2f(s.x, 0.0); }
  return vec2f(0.0, s.y);
}

@fragment
fn fs(@builtin(position) pos : vec4f) -> @location(0) vec4f {
  let q = pos.xy / SCALE();

  let hzv = hazeHi(q);
  let base0 = backdrop(q, vec3f(hzv));
  var col = base0;

  for (var i = 0; i < 6; i++) {
    let b = i * 6;
    let li = u.P[b + 3];
    if (li.w <= 0.002) { continue; }
    let r0 = u.P[b + 0];
    let r1 = u.P[b + 1];
    let r2 = u.P[b + 2];
    let ce = u.P[b + 4];
    let ex = u.P[b + 5];
    let pq = vec3f(q, 1.0);
    let w = dot(r2.xyz, pq);
    if (abs(w) < 1e-5) { continue; }
    let lp = vec2f(dot(r0.xyz, pq), dot(r1.xyz, pq)) / w;
    let hs = vec2f(r0.w, r1.w);
    let d = sdRound(lp, hs, r2.w);
    let ad = abs(d);
    let en = sdGradient(lp, hs, r2.w);
    var band = mix(0.06, 1.0, abs(en.y));
    if (en.y >= 0.0) { band = band * 0.66; }
    let fogMod = 0.34 + 1.05 * hzv;
    let core = exp(-ad * 0.200) * band;
    let halo = exp(-ad * 0.021) * mix(0.30, 1.0, band);
    let wide = exp(-ad * 0.0042);
    col += li.rgb * (core * 0.105 + halo * 0.125 * fogMod + wide * 0.055 * fogMod) * li.w;

    let rel = (q - vec2f(ce.x, ce.y + hs.y * 1.62)) / vec2f(hs.x * 1.15, hs.y * 0.60);
    col += li.rgb * exp(-dot(rel, rel) * 1.50) * (0.078 * li.w) * (0.35 + 0.80 * hzv);

    if (ex.x > 0.001) {
      let sy = q.y - (ce.y + hs.y);
      if (sy > 0.0) {
        let spread = 1.0 + sy * 0.0022;
        let sx = abs(q.x - ce.x) / (hs.x * spread);
        let shaft = smoothstep(1.02, 0.10, sx) * exp(-sy * 0.0019);
        col += li.rgb * shaft * (ex.x * 0.075) * (0.22 + 1.10 * hzv);
      }
    }
  }

  let room = col - base0;

  {
    let dq = q * 0.045;
    let di = floor(dq);
    let df = fract(dq) - vec2f(0.5);
    let h1 = hash21(di);
    let h2 = hash21(di + vec2f(7.7));
    let wob = vec2f(sin(TIME() * 0.34 + h1 * 41.0), cos(TIME() * 0.27 + h2 * 37.0)) * 0.30;
    let mote = smoothstep(0.9950, 1.0, h1) * smoothstep(0.17, 0.0, length(df - wob));
    col += room * mote * 2.4;
  }

  for (var i = 0; i < 6; i++) {
    let b = i * 6;
    let li = u.P[b + 3];
    let ce = u.P[b + 4];
    if (ce.w <= 0.002) { continue; }
    let r0 = u.P[b + 0];
    let r1 = u.P[b + 1];
    let r2 = u.P[b + 2];
    let ex = u.P[b + 5];
    let pq = vec3f(q, 1.0);
    let w = dot(r2.xyz, pq);
    if (abs(w) < 1e-5) { continue; }
    let lp = vec2f(dot(r0.xyz, pq), dot(r1.xyz, pq)) / w;
    let hs = vec2f(r0.w, r1.w);
    let d = sdRound(lp, hs, r2.w);
    if (d > 0.0) { continue; }

    let inMask = smoothstep(0.0, -1.3, d) * ce.w;
    let edgeT = 1.0 - clamp(-d / 34.0, 0.0, 1.0);
    let nrm = sdGradient(lp, hs, r2.w);
    let off = nrm * (pow(edgeT, 1.6) * 46.0 + 3.0);

    let hg = hazeLo(q + off);
    var hzr = vec3f(hg);
    if (edgeT > 0.045) {
      hzr.r = hazeLo(q + off * 1.16);
      hzr.b = hazeLo(q + off * 0.84);
    }
    let bg2 = backdrop(q + off, hzr);

    var glass = bg2 * 0.72;
    glass = mix(glass, vec3f(0.0340, 0.0290, 0.0620), 0.30);
    let vgrad = clamp(0.5 - lp.y / (hs.y * 2.0), 0.0, 1.0);
    glass += vec3f(0.050, 0.056, 0.092) * vgrad * 0.60;
    glass += li.rgb * (pow(edgeT, 2.2) * 0.19 + pow(edgeT, 7.0) * 0.32) * li.w;
    glass += room * 0.34;

    let dsp = (lp - ex.yz) / vec2f(max(hs.x * 0.85, 1.0), max(hs.y * 0.40, 1.0));
    let sp = exp(-dot(dsp, dsp) * 1.5) * ex.w;
    glass += (li.rgb * 0.42 + vec3f(0.58)) * sp * (0.070 + 0.10 * ce.z);

    let streak = exp(-abs(lp.x * 0.42 + lp.y + hs.y * 0.34) / max(hs.y * 0.55, 1.0));
    glass += vec3f(0.50, 0.57, 0.88) * streak * 0.034;

    col = mix(col, glass, vec3f(inMask));
  }

  if (SWEEP() >= 0.0) {
    let sx = SWEEP() * RES().x;
    let dx = abs(q.x - sx);
    let band = exp(-dx / 130.0);
    let line = exp(-dx / 6.0);
    let amt = (0.30 + 1.30 * hzv);
    col += (vec3f(0.52, 0.86, 0.34) * band * 0.15 + vec3f(0.80, 1.00, 0.70) * line * 0.34) * amt;
  }

  let vq = (q / RES() - 0.5) * vec2f(1.12, 1.0);
  col *= clamp(1.0 - 0.40 * pow(length(vq) * 1.42, 2.3), 0.32, 1.0);
  col = col / (1.0 + col * 0.58);
  col = pow(max(col, vec3f(0.0)), vec3f(0.95));
  col += vec3f((hash21(q + vec2f(fract(TIME()) * 97.0)) - 0.5) * 0.0135);
  return vec4f(col, 1.0);
}
`
