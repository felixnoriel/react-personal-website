import { memo, useEffect, useRef } from 'react'
import { hslVarToRgb } from '../../utils/glPalette'

/**
 * GalaxyField — a WebGPU COMPUTE-SHADER particle galaxy behind the whole
 * page. Hundreds of thousands of particles are simulated entirely on the
 * GPU (curl-noise flow + cursor gravity/vortex + scroll warp) and drawn
 * as velocity-stretched streaks with additive glow. Scroll fast and the
 * dust becomes a starfield warp; park the cursor and it spirals into a
 * slow vortex around it.
 *
 * This is the site's "latest tech" statement piece: real WebGPU compute,
 * no libraries, ~1ms of GPU time per frame. The main thread writes one
 * 112-byte uniform buffer and submits two passes — nothing else.
 *
 * Guards (this repo's rules):
 *   - Mounted only after a successful adapter probe (CosmicBackdrop);
 *     any init/device failure calls onFail → the WebGL aurora carries on
 *     alone. Reduced-motion never mounts it.
 *   - Loop fully stops when the tab is hidden; adaptive particle count
 *     backs off if real frame times say the GPU is struggling.
 *   - Announces itself via `fx:renderer` (+ writes live fps into #fx-fps)
 *     so the hero HUD can show an honest "webgpu · Nk particles" readout.
 */

const WORKGROUP = 256
const MARGIN = 40 // off-viewport wrap margin, css px

const WGSL = /* wgsl */ `
struct Sim {
  res: vec2f,
  mouse: vec2f,
  dt: f32,
  time: f32,
  mouseStr: f32,
  warp: f32,
  count: f32,
  pulse: f32,
  dark: f32,
  pad1: f32,
  c1: vec4f,
  c2: vec4f,
  c3: vec4f,
  c4: vec4f,
}

@group(0) @binding(0) var<uniform> sim: Sim;
@group(0) @binding(1) var<storage, read_write> parts: array<vec4f>;

fn hash21(p: vec2f) -> f32 {
  var q = fract(p * vec2f(123.34, 345.45));
  q += dot(q, q + 34.345);
  return fract(q.x * q.y);
}

fn vnoise(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let a = hash21(i);
  let b = hash21(i + vec2f(1.0, 0.0));
  let c = hash21(i + vec2f(0.0, 1.0));
  let d = hash21(i + vec2f(1.0, 1.0));
  let u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// divergence-free flow field — particles glide instead of clumping
fn curl(p: vec2f) -> vec2f {
  let e = 0.7;
  let dx = vnoise(p + vec2f(e, 0.0)) - vnoise(p - vec2f(e, 0.0));
  let dy = vnoise(p + vec2f(0.0, e)) - vnoise(p - vec2f(0.0, e));
  return vec2f(dy, -dx) * (0.5 / e);
}

@compute @workgroup_size(${WORKGROUP})
fn step(@builtin(global_invocation_id) gid: vec3u) {
  let i = gid.x;
  if (f32(i) >= sim.count) { return; }
  var p = parts[i].xy;
  var v = parts[i].zw;

  // layered curl flow (two octaves drifting at different rates)
  let flow = curl(p * 0.0022 + vec2f(sim.time * 0.02, 0.0)) * 26.0
           + curl(p * 0.011 - vec2f(0.0, sim.time * 0.035)) * 9.0;
  v += flow * sim.dt;

  // cursor: soft gravity + tangential vortex (pulse = click kick)
  let d = sim.mouse - p;
  let r2 = dot(d, d) + 4000.0;
  let g = (140000.0 / r2) * sim.mouseStr * (1.0 + sim.pulse * 2.5);
  let dn = d * inverseSqrt(r2);
  v += dn * g * 26.0 * sim.dt;
  v += vec2f(-dn.y, dn.x) * g * 44.0 * sim.dt;

  // scroll warp — the page flies THROUGH the dust
  v.y -= sim.warp * 1500.0 * sim.dt;

  v *= exp(-1.35 * sim.dt);
  p += v * sim.dt * 60.0;

  // toroidal wrap with margin (re-seed x on a vertical wrap so the warp
  // stream doesn't develop visible bands)
  let w = sim.res + vec2f(${MARGIN * 2}.0);
  if (p.y < -${MARGIN}.0) {
    p.y += w.y;
    p.x = hash21(vec2f(p.x, sim.time)) * sim.res.x;
  } else if (p.y > sim.res.y + ${MARGIN}.0) {
    p.y -= w.y;
    p.x = hash21(vec2f(p.x, sim.time + 7.0)) * sim.res.x;
  }
  if (p.x < -${MARGIN}.0) { p.x += w.x; }
  else if (p.x > sim.res.x + ${MARGIN}.0) { p.x -= w.x; }

  parts[i] = vec4f(p, v);
}

struct VSOut {
  @builtin(position) pos: vec4f,
  @location(0) uv: vec2f,
  @location(1) col: vec4f,
}

@vertex
fn vs(@builtin(vertex_index) vi: u32, @builtin(instance_index) ii: u32) -> VSOut {
  let pv = parts[ii];
  let speed = length(pv.zw);
  let dir = select(vec2f(0.0, 1.0), pv.zw / max(speed, 1e-4), speed > 1e-4);
  let nrm = vec2f(-dir.y, dir.x);
  // velocity-stretched streaks: fast particles become warp lines
  let len = clamp(1.7 + speed * 1.9, 1.7, 34.0);
  let wid = clamp(2.7 - speed * 0.03, 1.1, 2.7);
  let u = f32(vi & 1u) * 2.0 - 1.0;
  let w = f32(vi >> 1u) * 2.0 - 1.0;
  let world = pv.xy + dir * (u * len * 0.5) + nrm * (w * wid * 0.5);
  let clip = (world / sim.res) * 2.0 - vec2f(1.0);

  let h = hash21(vec2f(f32(ii) * 0.123, f32(ii) * 0.789));
  var col = mix(sim.c1.rgb, sim.c3.rgb, smoothstep(0.0, 1.0, h));
  col = mix(col, sim.c2.rgb, step(0.82, h));
  col = mix(col, sim.c4.rgb, step(0.94, h));
  // dark theme: speed brightens toward white-hot; light theme: stay ink
  col = mix(col, vec3f(1.0), min(0.55, speed * 0.045) * sim.dark);
  let alpha = (0.3 + 0.55 * min(1.0, speed * 0.06)) * (0.45 + 0.55 * h);

  var out: VSOut;
  out.pos = vec4f(clip.x, -clip.y, 0.0, 1.0);
  out.uv = vec2f(u, w);
  out.col = vec4f(col, alpha);
  return out;
}

@fragment
fn fs(in: VSOut) -> @location(0) vec4f {
  let fall = (1.0 - in.uv.x * in.uv.x) * (1.0 - in.uv.y * in.uv.y);
  let a = in.col.a * fall * fall;
  // dark theme composites ADDITIVELY (alpha 0, pure light); light theme
  // composites normally (premultiplied over) so ink reads on paper
  return vec4f(in.col.rgb * a, a * (1.0 - sim.dark));
}
`

interface GalaxyFieldProps {
  isMobile: boolean
  onFail: () => void
}

export const GalaxyField = memo(function GalaxyField({ isMobile, onFail }: GalaxyFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const failRef = useRef(onFail)
  failRef.current = onFail

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !navigator.gpu) return
    let disposed = false
    let raf = 0
    let device: GPUDevice | null = null

    const fail = () => {
      if (disposed) return
      disposed = true
      if (raf) cancelAnimationFrame(raf)
      failRef.current()
    }

    // budget by device: RAM-constrained machines get half the fleet, and
    // the adaptive backoff below trims further if frame times complain
    const lowMem =
      (navigator as unknown as { deviceMemory?: number }).deviceMemory !== undefined &&
      (navigator as unknown as { deviceMemory?: number }).deviceMemory! <= 4
    const count = (isMobile ? 90_000 : 500_000) >> (lowMem ? 1 : 0)
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75)
    const cleanupFns: Array<() => void> = []

    ;(async () => {
      try {
        // stay entirely out of the load trace: init after window load + idle
        if (document.readyState !== 'complete') {
          await new Promise<void>((r) =>
            window.addEventListener('load', () => r(), { once: true }),
          )
        }
        await new Promise<void>((r) => {
          const w = window as unknown as {
            requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number
          }
          if (w.requestIdleCallback) w.requestIdleCallback(() => r(), { timeout: 1500 })
          else setTimeout(r, 250)
        })
        if (disposed) return
        const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' })
        if (!adapter || disposed) {
          if (!disposed) fail()
          return
        }
        device = await adapter.requestDevice()
        if (disposed) {
          device.destroy()
          return
        }
        device.lost.then(() => fail())

        const ctx = canvas.getContext('webgpu')
        if (!ctx) {
          fail()
          return
        }
        const format = navigator.gpu.getPreferredCanvasFormat()
        ctx.configure({ device, format, alphaMode: 'premultiplied' })

        const module = device.createShaderModule({ code: WGSL })
        const computePipe = device.createComputePipeline({
          layout: 'auto',
          compute: { module, entryPoint: 'step' },
        })
        // dark: pure additive light; light: premultiplied source-over ink
        const isDark = document.documentElement.classList.contains('dark')
        const blend: GPUBlendState = isDark
          ? {
              color: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
              alpha: { srcFactor: 'zero', dstFactor: 'one', operation: 'add' },
            }
          : {
              color: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
              alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
            }
        const renderPipe = device.createRenderPipeline({
          layout: 'auto',
          vertex: { module, entryPoint: 'vs' },
          fragment: {
            module,
            entryPoint: 'fs',
            targets: [{ format, blend }],
          },
          primitive: { topology: 'triangle-strip' },
        })

        // particle buffer: xy pos (css px), zw vel
        const partBuf = device.createBuffer({
          size: count * 16,
          usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        })
        // positions only — velocities stay at the typed array's zeros and
        // pick up motion from the flow field within a frame or two
        const seed = new Float32Array(count * 4)
        const W = window.innerWidth
        const H = window.innerHeight
        for (let i = 0; i < count; i++) {
          seed[i * 4] = Math.random() * W
          seed[i * 4 + 1] = Math.random() * H
        }
        device.queue.writeBuffer(partBuf, 0, seed)

        const uniBuf = device.createBuffer({
          size: 112,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        })
        const uni = new Float32Array(28)
        uni[10] = isDark ? 1 : 0
        // palette — luminous neon over dark, deep ink dust over light paper
        const L = isDark
          ? { c1: 0.68, c2: 0.72, c3: 0.7, c4: 0.68, sat: 1.35 }
          : { c1: 0.4, c2: 0.38, c3: 0.42, c4: 0.38, sat: 1.35 }
        const pal = [
          hslVarToRgb('--accent', [0.85, 0.5, 0.72], L.sat, L.c1),
          hslVarToRgb('--lime', [0.75, 0.85, 0.6], L.sat, L.c2),
          hslVarToRgb('--electric', [0.55, 0.7, 0.95], L.sat, L.c3),
          hslVarToRgb('--amber', [0.7, 0.62, 0.95], L.sat, L.c4),
        ]
        for (let c = 0; c < 4; c++) {
          uni[12 + c * 4] = pal[c][0]
          uni[12 + c * 4 + 1] = pal[c][1]
          uni[12 + c * 4 + 2] = pal[c][2]
          uni[12 + c * 4 + 3] = 1
        }

        const computeBind = device.createBindGroup({
          layout: computePipe.getBindGroupLayout(0),
          entries: [
            { binding: 0, resource: { buffer: uniBuf } },
            { binding: 1, resource: { buffer: partBuf } },
          ],
        })
        const renderBind = device.createBindGroup({
          layout: renderPipe.getBindGroupLayout(0),
          entries: [
            { binding: 0, resource: { buffer: uniBuf } },
            { binding: 1, resource: { buffer: partBuf } },
          ],
        })

        // ── frame state ──────────────────────────────────────────────
        let cssW = 0
        let cssH = 0
        const resize = () => {
          cssW = window.innerWidth
          cssH = window.innerHeight
          canvas.width = Math.max(1, Math.floor(cssW * dpr))
          canvas.height = Math.max(1, Math.floor(cssH * dpr))
        }
        resize()
        window.addEventListener('resize', resize)

        const mouse = { x: cssW / 2, y: cssH / 3, tx: cssW / 2, ty: cssH / 3, str: 0, tstr: 0 }
        let pulse = 0
        const onMove = (e: PointerEvent) => {
          mouse.tx = e.clientX
          mouse.ty = e.clientY
          mouse.tstr = 1
        }
        const onDown = () => {
          pulse = 1
        }
        window.addEventListener('pointermove', onMove, { passive: true })
        window.addEventListener('pointerdown', onDown, { passive: true })

        let warp = 0
        let warpTarget = 0
        let lastScrollY = window.scrollY
        let lastScrollT = performance.now()
        const onScroll = () => {
          const now = performance.now()
          const dy = window.scrollY - lastScrollY
          const dtMs = Math.max(16, now - lastScrollT)
          lastScrollY = window.scrollY
          lastScrollT = now
          warpTarget = Math.max(-1, Math.min(1, (dy / dtMs) * 0.5))
        }
        window.addEventListener('scroll', onScroll, { passive: true })

        // adaptive quality: back off the particle count if real frame
        // times say the GPU can't keep up
        let activeCount = count
        let slowFrames = 0
        let fpsFrames = 0
        let fpsT0 = performance.now()

        let elapsed = 0
        let last = performance.now()

        const announce = () => {
          const detail = { kind: 'webgpu', count: activeCount }
          ;(window as unknown as { __fxRendererInfo?: object }).__fxRendererInfo = detail
          window.dispatchEvent(new CustomEvent('fx:renderer', { detail }))
        }
        announce()

        const frame = (now: number) => {
          if (disposed) return
          if (document.hidden) {
            raf = 0
            return
          }
          raf = requestAnimationFrame(frame)
          const dt = Math.min(0.05, (now - last) / 1000)
          last = now
          elapsed += dt

          // adaptive backoff (only while the tab is actually animating)
          if (dt > 0.024) {
            slowFrames++
            if (slowFrames > 90 && activeCount > 60_000) {
              activeCount = Math.floor(activeCount * 0.6)
              slowFrames = 0
              announce()
            }
          } else if (slowFrames > 0) {
            slowFrames--
          }

          // live fps readout for the hero HUD (direct DOM write, no React)
          fpsFrames++
          if (now - fpsT0 > 1000) {
            const el = document.getElementById('fx-fps')
            if (el) el.textContent = String(Math.min(240, Math.round((fpsFrames * 1000) / (now - fpsT0))))
            fpsFrames = 0
            fpsT0 = now
          }

          mouse.x += (mouse.tx - mouse.x) * 0.12
          mouse.y += (mouse.ty - mouse.y) * 0.12
          mouse.str += (mouse.tstr - mouse.str) * 0.05
          warp += (warpTarget - warp) * 0.08
          warpTarget *= 0.9
          pulse *= 0.94

          uni[0] = cssW
          uni[1] = cssH
          uni[2] = mouse.x
          uni[3] = mouse.y
          uni[4] = dt
          uni[5] = elapsed
          uni[6] = mouse.str
          uni[7] = warp
          uni[8] = activeCount
          uni[9] = pulse
          device!.queue.writeBuffer(uniBuf, 0, uni)

          const enc = device!.createCommandEncoder()
          const cp = enc.beginComputePass()
          cp.setPipeline(computePipe)
          cp.setBindGroup(0, computeBind)
          cp.dispatchWorkgroups(Math.ceil(activeCount / WORKGROUP))
          cp.end()
          const rp = enc.beginRenderPass({
            colorAttachments: [
              {
                view: ctx.getCurrentTexture().createView(),
                clearValue: { r: 0, g: 0, b: 0, a: 0 },
                loadOp: 'clear',
                storeOp: 'store',
              },
            ],
          })
          rp.setPipeline(renderPipe)
          rp.setBindGroup(0, renderBind)
          rp.draw(4, activeCount)
          rp.end()
          device!.queue.submit([enc.finish()])
        }
        raf = requestAnimationFrame(frame)

        const onVis = () => {
          if (!document.hidden && !raf && !disposed) {
            last = performance.now()
            raf = requestAnimationFrame(frame)
          }
        }
        document.addEventListener('visibilitychange', onVis)

        cleanupFns.push(() => {
          window.removeEventListener('resize', resize)
          window.removeEventListener('pointermove', onMove)
          window.removeEventListener('pointerdown', onDown)
          window.removeEventListener('scroll', onScroll)
          document.removeEventListener('visibilitychange', onVis)
          partBuf.destroy()
          uniBuf.destroy()
        })
      } catch {
        fail()
      }
    })()

    return () => {
      disposed = true
      if (raf) cancelAnimationFrame(raf)
      cleanupFns.forEach((fn) => fn())
      device?.destroy()
    }
  }, [isMobile])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    />
  )
})
