/**
 * SIGNAL — the WebGPU core.
 *
 * A compute pass integrates every particle (spring to its morph target +
 * a divergence-free ABC flow for filaments + the pointer's gravity well +
 * click shockwaves), then one instanced draw lays up to 320k velocity-
 * stretched gaussian sprites into an rgba16float HDR target. Five
 * quarter-res passes turn the over-1.0 highlights into real bloom, and the
 * composite tone-maps and writes PREMULTIPLIED alpha 0 — so the canvas ADDS
 * light to the CSS ground behind it instead of covering it, which is how
 * light actually behaves.
 *
 * The main thread's per-frame job is: write 256 bytes of uniforms, submit.
 */

import type { CoreHandle, CoreOpts } from './types'

/* The uniform block, shared verbatim by the sim and draw modules. */
const UNI = /* wgsl */ `
struct Uni {
  viewProj : mat4x4<f32>,
  ptr      : vec4<f32>,   // xyz gravity well in sculpture space, w strength
  params   : vec4<f32>,   // time, dt, morph(0..3), ignite(0..1)
  phys     : vec4<f32>,   // spring, damping, flowAmp, flowScale
  rend     : vec4<f32>,   // sizePx, resX, resY, brightness
  wave0    : vec4<f32>,   // xyz origin, w age (<0 = idle)
  wave1    : vec4<f32>,
  wave2    : vec4<f32>,
  wave3    : vec4<f32>,
  colA     : vec4<f32>,
  colB     : vec4<f32>,
  colC     : vec4<f32>,
  colD     : vec4<f32>,
  depth    : vec4<f32>,   // fade near, fade far, spare, spare
};
`

const SIM_WGSL = /* wgsl */ `
${UNI}
@group(0) @binding(0) var<storage, read_write> pos : array<vec4<f32>>;
@group(0) @binding(1) var<storage, read_write> vel : array<vec4<f32>>;
@group(0) @binding(2) var<storage, read>       tgt : array<vec4<f32>>;
@group(0) @binding(3) var<uniform>             U   : Uni;

// A Beltrami (ABC) flow: divergence-free by construction, so the swarm
// swirls into filaments and never bunches into blobs. Two octaves, twelve
// trig calls, zero memory traffic.
fn flow(p : vec3<f32>, t : f32) -> vec3<f32> {
  let q = p * U.phys.w + vec3<f32>(0.0, 0.0, t * 0.22);
  var f = vec3<f32>(
    1.00 * sin(q.z) + 1.10 * cos(q.y),
    0.90 * sin(q.x) + 1.00 * cos(q.z),
    1.10 * sin(q.y) + 0.90 * cos(q.x));
  let r = p * (U.phys.w * 2.7) - vec3<f32>(t * 0.41, t * 0.24, t * 0.12);
  f += 0.34 * vec3<f32>(sin(r.z) + cos(r.y), sin(r.x) + cos(r.z), sin(r.y) + cos(r.x));
  return f;
}

fn shock(p : vec3<f32>, w : vec4<f32>) -> vec3<f32> {
  if (w.w < 0.0) { return vec3<f32>(0.0); }
  let d = p - w.xyz;
  let dd = length(d) + 1e-4;
  let ring = w.w * 3.6;
  let amp = exp(-abs(dd - ring) * 2.6) * max(0.0, 1.0 - w.w * 0.75);
  return (d / dd) * amp * 11.0;
}

@compute @workgroup_size(128)
fn cs(@builtin(global_invocation_id) gid : vec3<u32>) {
  let n = arrayLength(&pos);
  let i = gid.x;
  if (i >= n) { return; }

  // the morph: one continuous slide across the four shapes
  let s  = clamp(U.params.z, 0.0, 3.0);
  let si = floor(s);
  let s0 = u32(si);
  let s1 = min(s0 + 1u, 3u);
  let f  = smoothstep(0.0, 1.0, s - si);
  let a  = tgt[s0 * n + i];
  let b  = tgt[s1 * n + i];
  let home = mix(a.xyz, b.xyz, f);
  let hot    = mix(a.w,   b.w,   f);

  var p  = pos[i].xyz;
  var v  = vel[i].xyz;
  let dt = U.params.y;

  v += (home - p) * (U.phys.x * dt);                 // spring home
  v += flow(p, U.params.x) * (U.phys.z * (1.35 - hot) * dt);  // filaments, gentlest on the spine
  // gravity well: radial pull plus a tangential swirl, so it orbits
  let d   = U.ptr.xyz - p;
  let r2  = dot(d, d);
  let g   = U.ptr.w / (r2 + 0.13);
  let dir = d * inverseSqrt(max(r2, 1e-6));
  let tn  = normalize(cross(dir, vec3<f32>(0.0, 0.0, 1.0)) + vec3<f32>(1e-5, 1e-5, 0.0));
  v += (dir * g * 2.4 + tn * g * 3.0) * dt;
  v += (shock(p, U.wave0) + shock(p, U.wave1) + shock(p, U.wave2) + shock(p, U.wave3)) * dt;

  v *= exp(-U.phys.y * dt);
  p += v * dt;

  pos[i] = vec4<f32>(p, clamp(length(v) * 0.34, 0.0, 1.0));
  vel[i] = vec4<f32>(v, hot);
}
`

const DRAW_WGSL = /* wgsl */ `
${UNI}
@group(0) @binding(0) var<storage, read> pos : array<vec4<f32>>;
@group(0) @binding(1) var<storage, read> vel : array<vec4<f32>>;
@group(0) @binding(2) var<uniform>       U   : Uni;

struct VOut {
  @builtin(position) clip : vec4<f32>,
  @location(0) uv  : vec2<f32>,
  @location(1) col : vec3<f32>,
  @location(2) amp : f32,
};

@vertex
fn vs(@builtin(vertex_index) vi : u32, @builtin(instance_index) ii : u32) -> VOut {
  var o : VOut;
  let n = arrayLength(&pos);
  let P = pos[ii];
  let V = vel[ii];

  let clip = U.viewProj * vec4<f32>(P.xyz, 1.0);
  if (clip.w < 0.08) {
    o.clip = vec4<f32>(0.0, 0.0, 2.0, 1.0);
    o.uv = vec2<f32>(0.0, 0.0);
    o.col = vec3<f32>(0.0, 0.0, 0.0);
    o.amp = 0.0;
    return o;
  }
  let clipV = U.viewProj * vec4<f32>(P.xyz + V.xyz * 0.018, 1.0);

  let res  = U.rend.yz;
  let ndc  = clip.xy / clip.w;
  let ndcV = clipV.xy / max(clipV.w, 0.08);
  // build the sprite frame in device pixels so it stays round at any aspect
  let dpx = (ndcV - ndc) * res * 0.5;
  let sp  = length(dpx);
  var ax  = vec2<f32>(1.0, 0.0);
  if (sp > 0.001) { ax = dpx / sp; }
  let perp = vec2<f32>(-ax.y, ax.x);

  let cx = select(-1.0, 1.0, (vi & 1u) == 1u);
  let cy = select(-1.0, 1.0, (vi & 2u) == 2u);

  let hotv = V.w;
  let radius  = (U.rend.x * (0.62 + hotv * 0.85)) / max(clip.w, 0.25);
  let stretch = 1.0 + min(sp * 0.42, 2.4);
  let offPx = ax * (cx * radius * stretch) + perp * (cy * radius);
  o.clip = vec4<f32>(ndc.x + offPx.x * 2.0 / res.x, ndc.y + offPx.y * 2.0 / res.y, 0.5, 1.0);
  o.uv = vec2<f32>(cx, cy);

  // colour: brand ramp across x, hot cores toward lime, speed toward white
  let mx = clamp(P.x * 0.26 + 0.5, 0.0, 1.0);
  var col = mix(U.colA.rgb, U.colB.rgb, smoothstep(0.0, 0.60, mx));
  col = mix(col, U.colC.rgb, smoothstep(0.44, 1.02, mx));
  col = mix(col, U.colD.rgb, pow(hotv, 3.0) * 0.34);
  col = mix(col, vec3<f32>(1.0, 0.97, 0.92), min(0.62, P.w * P.w * 0.9));

  // the signal: a pulse of current running along the sculpture
  let fi = f32(ii) / f32(n);
  let pulse = pow(max(0.0, sin(fi * 12.5664 - U.params.x * 1.15)), 34.0);

  let fade = smoothstep(U.depth.y, U.depth.x, clip.w);
  o.amp = fade * (0.021 + hotv * 0.155) * (1.0 + pulse * 6.0) * U.rend.w * U.params.w;
  o.col = col + vec3<f32>(0.55, 0.85, 0.45) * pulse * 0.9;
  return o;
}

@fragment
fn fs(i : VOut) -> @location(0) vec4<f32> {
  let d2 = dot(i.uv, i.uv);
  let a = exp(-d2 * 4.6) - 0.010;
  if (a <= 0.0) { discard; }
  return vec4<f32>(i.col * (a * i.amp), a * i.amp * 0.35);
}
`

const POST_WGSL = /* wgsl */ `
struct Post {
  texel : vec4<f32>,   // 1/w, 1/h, dirX, dirY
  cfg   : vec4<f32>,   // radius|exposure, threshold, chroma, bloom
};
@group(0) @binding(0) var samp : sampler;
@group(0) @binding(1) var texA : texture_2d<f32>;
@group(0) @binding(2) var texB : texture_2d<f32>;
@group(0) @binding(3) var<uniform> PP : Post;

struct FOut { @builtin(position) pos : vec4<f32>, @location(0) uv : vec2<f32> };

@vertex
fn fullscreen(@builtin(vertex_index) vi : u32) -> FOut {
  var p = array<vec2<f32>, 3>(vec2<f32>(-1.0, -3.0), vec2<f32>(-1.0, 1.0), vec2<f32>(3.0, 1.0));
  var o : FOut;
  let q = p[vi];
  o.pos = vec4<f32>(q, 0.0, 1.0);
  o.uv = vec2<f32>((q.x + 1.0) * 0.5, (1.0 - q.y) * 0.5);
  return o;
}

@fragment
fn bright(i : FOut) -> @location(0) vec4<f32> {
  let t = PP.texel.xy;
  var c = textureSample(texA, samp, i.uv + vec2<f32>(-t.x, -t.y)).rgb;
  c += textureSample(texA, samp, i.uv + vec2<f32>(t.x, -t.y)).rgb;
  c += textureSample(texA, samp, i.uv + vec2<f32>(-t.x, t.y)).rgb;
  c += textureSample(texA, samp, i.uv + vec2<f32>(t.x, t.y)).rgb;
  c *= 0.25;
  let l = max(c.r, max(c.g, c.b));
  let s = max(l - PP.cfg.y, 0.0) / max(l, 1e-4);
  return vec4<f32>(c * s, 1.0);
}

@fragment
fn blur(i : FOut) -> @location(0) vec4<f32> {
  let stp = PP.texel.xy * PP.texel.zw * PP.cfg.x;
  var c = textureSample(texA, samp, i.uv).rgb * 0.227;
  c += (textureSample(texA, samp, i.uv + stp * 1.385).rgb +
        textureSample(texA, samp, i.uv - stp * 1.385).rgb) * 0.316;
  c += (textureSample(texA, samp, i.uv + stp * 3.253).rgb +
        textureSample(texA, samp, i.uv - stp * 3.253).rgb) * 0.070;
  return vec4<f32>(c, 1.0);
}

fn tonemap(x : vec3<f32>) -> vec3<f32> {
  let a = 2.51; let b = 0.03; let c = 2.43; let d = 0.59; let e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), vec3<f32>(0.0), vec3<f32>(1.0));
}
fn srgb(x : vec3<f32>) -> vec3<f32> {
  let lo = x * 12.92;
  let hi = 1.055 * pow(max(x, vec3<f32>(0.0)), vec3<f32>(1.0 / 2.4)) - 0.055;
  return select(hi, lo, x < vec3<f32>(0.0031308));
}

@fragment
fn composite(i : FOut) -> @location(0) vec4<f32> {
  let scene = textureSample(texA, samp, i.uv).rgb;
  let bl    = textureSample(texB, samp, i.uv).rgb;
  // a whisper of lateral chromatic spread on the halo — lens, not filter
  let off = (i.uv - vec2<f32>(0.5, 0.5)) * PP.cfg.z;
  let blr = textureSample(texB, samp, i.uv + off).r;
  let blb = textureSample(texB, samp, i.uv - off).b;
  let halo = vec3<f32>(mix(bl.r, blr, 0.6), bl.g, mix(bl.b, blb, 0.6));
  var c = scene + halo * PP.cfg.w;
  c = tonemap(c * PP.cfg.x);
  // premultiplied alpha 0 = this canvas ADDS to the page behind it
  return vec4<f32>(srgb(c), 0.0);
}
`

type Mat4 = Float32Array

function perspective(fovy: number, aspect: number, near: number, far: number, sx: number, sy: number): Mat4 {
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

/** view = translate(0,0,-dist) · rotX(tilt) · rotY(spin); also returns R (row-major 3x3) */
function viewMatrix(dist: number, tilt: number, spin: number): [Mat4, Float32Array] {
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

function mul(a: Mat4, b: Mat4): Mat4 {
  const o = new Float32Array(16)
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++) {
      let s = 0
      for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]
      o[c * 4 + r] = s
    }
  return o
}

export async function createGpuCore(opts: CoreOpts): Promise<CoreHandle | null> {
  const gpu = (navigator as Navigator & { gpu?: GPU }).gpu
  if (!gpu) return null
  let adapter: GPUAdapter | null = null
  try {
    adapter = await gpu.requestAdapter({ powerPreference: 'high-performance' })
  } catch {
    return null
  }
  if (!adapter) return null
  let device: GPUDevice
  try {
    device = await adapter.requestDevice()
  } catch {
    return null
  }
  const format = gpu.getPreferredCanvasFormat()

  const info = (adapter as GPUAdapter & { info?: { vendor?: string; architecture?: string } }).info
  const label = ['WebGPU', info?.vendor, info?.architecture].filter(Boolean).join(' · ') || 'WebGPU'

  const N = opts.count
  const simMod = device.createShaderModule({ code: SIM_WGSL })
  const drawMod = device.createShaderModule({ code: DRAW_WGSL })
  const postMod = device.createShaderModule({ code: POST_WGSL })

  const posBuf = device.createBuffer({ size: N * 16, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST })
  const velBuf = device.createBuffer({ size: N * 16, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST })
  const tgtBuf = device.createBuffer({
    size: opts.shapes.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  })
  device.queue.writeBuffer(tgtBuf, 0, opts.shapes.buffer as ArrayBuffer, opts.shapes.byteOffset, opts.shapes.byteLength)

  // ignition seed: everything starts far out on a dark shell and is hauled in
  const seed = new Float32Array(N * 4)
  for (let i = 0; i < N; i++) {
    const o = i * 4
    const x = opts.shapes[o]
    const y = opts.shapes[o + 1]
    const z = opts.shapes[o + 2]
    const len = Math.hypot(x, y, z) || 1
    const k = 3.6 + Math.random() * 3.2
    seed[o] = (x / len) * k + (Math.random() - 0.5) * 1.7
    seed[o + 1] = (y / len) * k + (Math.random() - 0.5) * 1.7
    seed[o + 2] = (z / len) * k + (Math.random() - 0.5) * 1.7
  }
  device.queue.writeBuffer(posBuf, 0, seed)
  device.queue.writeBuffer(velBuf, 0, new Float32Array(N * 4))

  const UNI_SIZE = 64 + 16 * 13
  const uni = new Float32Array(UNI_SIZE / 4)
  const uniBuf = device.createBuffer({ size: UNI_SIZE, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST })

  const simLayout = device.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
      { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
      { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
      { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
    ],
  })
  const drawLayout = device.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: 'read-only-storage' } },
      { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: { type: 'read-only-storage' } },
      { binding: 2, visibility: GPUShaderStage.VERTEX, buffer: { type: 'uniform' } },
    ],
  })
  const postLayout = device.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
      { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
      { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
      { binding: 3, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
    ],
  })

  const simBind = device.createBindGroup({
    layout: simLayout,
    entries: [
      { binding: 0, resource: { buffer: posBuf } },
      { binding: 1, resource: { buffer: velBuf } },
      { binding: 2, resource: { buffer: tgtBuf } },
      { binding: 3, resource: { buffer: uniBuf } },
    ],
  })
  const drawBind = device.createBindGroup({
    layout: drawLayout,
    entries: [
      { binding: 0, resource: { buffer: posBuf } },
      { binding: 1, resource: { buffer: velBuf } },
      { binding: 2, resource: { buffer: uniBuf } },
    ],
  })

  const HDR: GPUTextureFormat = 'rgba16float'
  let simPipe: GPUComputePipeline
  let drawPipe: GPURenderPipeline
  let brightPipe: GPURenderPipeline
  let blurPipe: GPURenderPipeline
  let compPipe: GPURenderPipeline
  try {
    const mkPost = (entry: string, fmt: GPUTextureFormat) =>
      device.createRenderPipelineAsync({
        layout: device.createPipelineLayout({ bindGroupLayouts: [postLayout] }),
        vertex: { module: postMod, entryPoint: 'fullscreen' },
        fragment: { module: postMod, entryPoint: entry, targets: [{ format: fmt }] },
        primitive: { topology: 'triangle-list' },
      })
    ;[simPipe, drawPipe, brightPipe, blurPipe, compPipe] = await Promise.all([
      device.createComputePipelineAsync({
        layout: device.createPipelineLayout({ bindGroupLayouts: [simLayout] }),
        compute: { module: simMod, entryPoint: 'cs' },
      }),
      device.createRenderPipelineAsync({
        layout: device.createPipelineLayout({ bindGroupLayouts: [drawLayout] }),
        vertex: { module: drawMod, entryPoint: 'vs' },
        fragment: {
          module: drawMod,
          entryPoint: 'fs',
          targets: [
            {
              format: HDR,
              blend: {
                color: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
                alpha: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
              },
            },
          ],
        },
        primitive: { topology: 'triangle-strip' },
      }),
      mkPost('bright', HDR),
      mkPost('blur', HDR),
      mkPost('composite', format),
    ])
  } catch {
    device.destroy()
    return null
  }

  // Only now claim the canvas: if anything above had failed we must leave it
  // untouched so the WebGL2 tier can still take it.
  const ctx = opts.canvas.getContext('webgpu')
  if (!ctx) {
    device.destroy()
    return null
  }
  ctx.configure({ device, format, alphaMode: 'premultiplied' })

  const sampler = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear',
    addressModeU: 'clamp-to-edge',
    addressModeV: 'clamp-to-edge',
  })

  const mkPP = (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => {
    const buf = device.createBuffer({ size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST })
    device.queue.writeBuffer(buf, 0, new Float32Array([a, b, c, d, e, f, g, h]))
    return buf
  }

  let sceneTex: GPUTexture | null = null
  let texX: GPUTexture | null = null
  let texY: GPUTexture | null = null
  let vScene: GPUTextureView | null = null
  let vX: GPUTextureView | null = null
  let vY: GPUTextureView | null = null
  let bindBright: GPUBindGroup | null = null
  let bindBlur: GPUBindGroup[] = []
  let bindComp: GPUBindGroup | null = null
  let W = 0
  let H = 0

  function sized(w: number, h: number) {
    W = Math.max(2, Math.round(w))
    H = Math.max(2, Math.round(h))
    sceneTex?.destroy()
    texX?.destroy()
    texY?.destroy()
    const usage = GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
    sceneTex = device.createTexture({ size: [W, H], format: HDR, usage })
    const qw = Math.max(2, W >> 2)
    const qh = Math.max(2, H >> 2)
    texX = device.createTexture({ size: [qw, qh], format: HDR, usage })
    texY = device.createTexture({ size: [qw, qh], format: HDR, usage })
    vScene = sceneTex.createView()
    vX = texX.createView()
    vY = texY.createView()

    const bg = (a: GPUTextureView, b: GPUTextureView, u: GPUBuffer) =>
      device.createBindGroup({
        layout: postLayout,
        entries: [
          { binding: 0, resource: sampler },
          { binding: 1, resource: a },
          { binding: 2, resource: b },
          { binding: 3, resource: { buffer: u } },
        ],
      })
    bindBright = bg(vScene, vScene, mkPP(1 / W, 1 / H, 0, 0, 0, opts.bloomThreshold, 0, 0))
    bindBlur = [
      bg(vX, vX, mkPP(1 / qw, 1 / qh, 1, 0, 1.0, 0, 0, 0)),
      bg(vY, vY, mkPP(1 / qw, 1 / qh, 0, 1, 1.0, 0, 0, 0)),
      bg(vX, vX, mkPP(1 / qw, 1 / qh, 1, 0, 3.4, 0, 0, 0)),
      bg(vY, vY, mkPP(1 / qw, 1 / qh, 0, 1, 3.4, 0, 0, 0)),
    ]
    bindComp = bg(vScene, vX, mkPP(0, 0, 0, 0, opts.exposure, 0, 0.0055, opts.bloomStrength))
  }

  let dead = false
  device.lost.then(() => {
    dead = true
  })

  return {
    label,
    count: N,
    resize(w, h) {
      if (!dead) sized(w, h)
    },
    frame(f) {
      if (dead || !sceneTex || !bindComp) return
      const aspect = W / H
      const [view, R] = viewMatrix(f.dist, f.tilt, f.spin)
      const vp = mul(perspective(f.fov, aspect, 0.1, 60, f.shiftX, f.shiftY), view)
      uni.set(vp, 0)
      // pointer → sculpture space: a point on the focal plane, un-rotated
      const fq = 1 / Math.tan(f.fov / 2)
      const vx = ((f.px - f.shiftX) * aspect * f.dist) / fq
      const vy = ((f.py - f.shiftY) * f.dist) / fq
      uni[16] = R[0] * vx + R[3] * vy
      uni[17] = R[1] * vx + R[4] * vy
      uni[18] = R[2] * vx + R[5] * vy
      uni[19] = f.pointer
      uni[20] = f.time
      uni[21] = f.dt
      uni[22] = f.morph
      uni[23] = f.ignite
      uni[24] = f.spring
      uni[25] = f.damping
      uni[26] = f.flowAmp
      uni[27] = f.flowScale
      uni[28] = f.sizePx
      uni[29] = W
      uni[30] = H
      uni[31] = f.brightness
      for (let i = 0; i < 4; i++) {
        const w = f.waves[i]
        uni[32 + i * 4] = w[0]
        uni[33 + i * 4] = w[1]
        uni[34 + i * 4] = w[2]
        uni[35 + i * 4] = w[3]
      }
      for (let i = 0; i < 4; i++) {
        const c = opts.palette[i]
        uni[48 + i * 4] = c[0]
        uni[49 + i * 4] = c[1]
        uni[50 + i * 4] = c[2]
        uni[51 + i * 4] = 1
      }
      uni[64] = f.dist - 2.9
      uni[65] = f.dist + 3.6
      device.queue.writeBuffer(uniBuf, 0, uni)

      const enc = device.createCommandEncoder()
      const cp = enc.beginComputePass()
      cp.setPipeline(simPipe)
      cp.setBindGroup(0, simBind)
      cp.dispatchWorkgroups(Math.ceil(N / 128))
      cp.end()

      const rp = enc.beginRenderPass({
        colorAttachments: [
          { view: vScene!, clearValue: { r: 0, g: 0, b: 0, a: 0 }, loadOp: 'clear', storeOp: 'store' },
        ],
      })
      rp.setPipeline(drawPipe)
      rp.setBindGroup(0, drawBind)
      rp.draw(4, f.active)
      rp.end()

      const pass = (view: GPUTextureView, pipe: GPURenderPipeline, bind: GPUBindGroup) => {
        const p = enc.beginRenderPass({
          colorAttachments: [{ view, clearValue: { r: 0, g: 0, b: 0, a: 1 }, loadOp: 'clear', storeOp: 'store' }],
        })
        p.setPipeline(pipe)
        p.setBindGroup(0, bind)
        p.draw(3)
        p.end()
      }
      pass(vX!, brightPipe, bindBright!)
      pass(vY!, blurPipe, bindBlur[0])
      pass(vX!, blurPipe, bindBlur[1])
      pass(vY!, blurPipe, bindBlur[2])
      pass(vX!, blurPipe, bindBlur[3])
      pass(ctx!.getCurrentTexture().createView(), compPipe, bindComp)

      device.queue.submit([enc.finish()])
    },
    destroy() {
      dead = true
      try {
        sceneTex?.destroy()
        texX?.destroy()
        texY?.destroy()
        posBuf.destroy()
        velBuf.destroy()
        tgtBuf.destroy()
        device.destroy()
      } catch {
        /* already gone */
      }
    },
  }
}
