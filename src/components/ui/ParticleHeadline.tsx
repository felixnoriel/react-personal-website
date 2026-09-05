import { memo, useEffect, useRef } from 'react'
import { hslVarToRgb } from '../../utils/glPalette'

/**
 * ParticleHeadline — the hero headline as ~10k living GPU particles.
 *
 * The real DOM text paints first and stays FULLY VISIBLE — the swarm is
 * a translucent living texture over solid type, never a replacement for
 * it. After the boot veil lifts, glyphs are sampled into particle homes
 * and the swarm assembles from a chaos ring. The cursor repels particles
 * (with a swirl), clicks send shockwave rings, and the `sudo hire-felix`
 * terminal easter egg detonates and reassembles the swarm. Desktop-only:
 * pointer forces are a mouse affordance.
 *
 * Why this stays fast (this repo's #1 rule):
 *   - ALL particle motion is computed analytically in the vertex shader
 *     from (time, assembly progress, pointer, ripples). No physics state,
 *     no ping-pong FBOs, no per-particle CPU work — the main thread
 *     writes ~20 uniform floats and issues ONE draw call per frame.
 *   - GL setup is deferred to launch time (post-boot + fonts ready), so
 *     nothing is paid up front — and React StrictMode's dev double-mount
 *     never touches a context it would then destroy.
 *   - The rAF loop pauses when the hero is offscreen or the tab hidden.
 *   - Buffers are built once (rebuilt only on debounced resize).
 *   - No WebGL / compile failure / context loss → caller falls back to
 *     the kinetic text treatment.
 */

const ASSEMBLE_MS = 1500
const BURST_IN_MS = 380
const RIPPLE_LIFE = 1.5

const VERT = `
attribute vec2 aHome;   // css px in canvas space
attribute vec4 aRand;   // per-particle hashes 0..1
uniform vec2  uRes;     // canvas css size
uniform float uDpr;
uniform float uTime;
uniform float uProgress;   // 0 = chaos ring, 1 = assembled
uniform vec2  uPointer;    // css px, eased
uniform float uPtrStr;     // 0..1
uniform vec3  uRipples[5]; // xy css px, z age seconds (<0 inactive)
uniform vec3  uC1; uniform vec3 uC2; uniform vec3 uC3; uniform vec3 uC4;
varying float vAlpha;
varying vec3  vColor;

float easeOut(float t) { return 1.0 - pow(1.0 - t, 3.0); }

void main() {
  // staggered per-particle assembly
  float delay = aRand.x * 0.5;
  float p = easeOut(clamp((uProgress - delay) / (1.0 - delay + 1e-4), 0.0, 1.0));

  // chaos origin: a wide rotating elliptical ring around the headline
  float ang = aRand.y * 6.2831 + uTime * 0.22;
  float rad = 340.0 + aRand.z * 560.0;
  vec2 chaos = uRes * 0.5 + vec2(cos(ang) * 1.25, sin(ang) * 0.65) * rad;

  vec2 pos = mix(chaos, aHome, p);

  // idle shimmer — a whisper of motion. Assembled glyphs should read as
  // SOLID ink; the drama comes from the contrast when they explode.
  float tt = uTime * 1.6 + aRand.w * 6.2831;
  pos += vec2(sin(tt + aHome.y * 0.021), cos(tt * 0.83 + aHome.x * 0.017)) * mix(2.4, 0.55, p);

  // cursor: radial repulsion + tangential swirl
  vec2 d = pos - uPointer;
  float R = 110.0;
  float f = (R * R) / (dot(d, d) + R * R) * uPtrStr;
  f *= f;
  vec2 dir = normalize(d + 1e-4);
  pos += dir * f * 90.0 + vec2(-dir.y, dir.x) * f * 38.0;

  // click shockwaves — same ring language as the ShaderField backdrop
  float glow = 0.0;
  for (int i = 0; i < 5; i++) {
    float age = uRipples[i].z;
    if (age < 0.0) continue;
    float dd = distance(aHome, uRipples[i].xy);
    float w = exp(-abs(dd - age * 460.0) * 0.03) * max(0.0, 1.0 - age * 0.66);
    pos += normalize(aHome - uRipples[i].xy + 1e-3) * w * 44.0;
    glow += w;
  }

  // palette: blend the brand colors along x with per-particle variance
  float m = aHome.x / uRes.x + aRand.y * 0.3;
  vec3 col = mix(uC1, uC3, smoothstep(0.0, 0.62, m));
  col = mix(col, uC2, smoothstep(0.5, 1.05, m) * 0.75);
  col = mix(col, uC4, aRand.w * 0.35);
  vColor = mix(col, vec3(1.0), min(0.6, f * 0.8 + glow * 0.5));

  float size = (1.8 + aRand.z * 1.6) * (1.0 + f * 1.2 + glow * 0.9);
  size *= mix(1.5, 1.0, p); // bigger sparks while in flight
  // high alpha floor once assembled — the glyphs must keep the ink-weight
  // of the real headline, with only a gentle shimmer on top
  vAlpha = mix(0.35, 0.62, p) * (0.93 + 0.07 * sin(tt * 1.3));
  vAlpha = min(1.0, vAlpha + f * 0.35 + glow * 0.45);

  vec2 clip = (pos / uRes) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  gl_PointSize = size * uDpr;
}
`

const FRAG = `
precision mediump float;
varying float vAlpha;
varying vec3  vColor;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.1, d) * vAlpha;
  if (a < 0.02) discard;
  gl_FragColor = vec4(vColor, a);
}
`

function compileShader(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)
  if (!sh) return null
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh)
    return null
  }
  return sh
}

/** Rasterize the two headline lines and sample glyph pixels → particle homes
 *  (in canvas space: host rect inflated by `pad`). */
function sampleTargets(
  lines: HTMLElement[],
  hostRect: DOMRect,
  pad: number,
  step: number,
): Float32Array | null {
  const w = Math.ceil(hostRect.width)
  const h = Math.ceil(hostRect.height)
  if (w < 10 || h < 10) return null
  const cvs = document.createElement('canvas')
  cvs.width = w
  cvs.height = h
  const ctx = cvs.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  ctx.fillStyle = '#000'
  ctx.textBaseline = 'middle'
  for (const el of lines) {
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    // mirror the DOM's actual face/weight so the swarm matches the text.
    // The canvas font setter is a SILENT no-op on parse failure, so verify
    // it took and fall back to a sanitized stack if not.
    ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
    if (!ctx.font.includes(cs.fontSize)) {
      ctx.font = `${cs.fontWeight} ${cs.fontSize} 'Space Grotesk', sans-serif`
    }
    if ('letterSpacing' in ctx && cs.letterSpacing !== 'normal') {
      ctx.letterSpacing = cs.letterSpacing
    }
    // draw from the CONTENT box: the line spans carry padding (the editorial
    // indent), and getBoundingClientRect includes it — sampling from the
    // padding box painted the swarm one indent left of the real text
    ctx.fillText(
      el.textContent ?? '',
      r.left - hostRect.left + parseFloat(cs.paddingLeft || '0'),
      r.top - hostRect.top + r.height / 2 + r.height * 0.03,
    )
  }
  const img = ctx.getImageData(0, 0, w, h).data
  const pts: number[] = []
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      if (img[(y * w + x) * 4 + 3] > 128) {
        pts.push(x + pad, y + pad, Math.random(), Math.random(), Math.random(), Math.random())
      }
    }
  }
  if (pts.length / 6 < 200) return null
  // monumental type samples far more pixels — decimate evenly past the cap
  // so the draw cost stays flat no matter the headline size
  const MAX = 26000
  const n = pts.length / 6
  if (n > MAX) {
    const out = new Float32Array(MAX * 6)
    const stride = n / MAX
    for (let i = 0; i < MAX; i++) {
      const src = Math.floor(i * stride) * 6
      out.set(pts.slice(src, src + 6), i * 6)
    }
    return out
  }
  return new Float32Array(pts)
}

interface ParticleHeadlineProps {
  /** the h1 (text host) — canvas overlays it, inflated by pad */
  hostRef: React.RefObject<HTMLElement | null>
  /** the two line spans to rasterize */
  lineRefs: React.RefObject<HTMLElement | null>[]
  isMobile: boolean
  /** WebGL missing/failed/context-lost → parent falls back to kinetic text */
  onFail: () => void
}

export const ParticleHeadline = memo(function ParticleHeadline({
  hostRef,
  lineRefs,
  isMobile,
  onFail,
}: ParticleHeadlineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cbRef = useRef({ onFail })
  cbRef.current = { onFail }

  useEffect(() => {
    const canvas = canvasRef.current
    const host = hostRef.current
    const lines = lineRefs.map((r) => r.current).filter(Boolean) as HTMLElement[]
    if (!canvas || !host || lines.length === 0) return

    const pad = isMobile ? 70 : 150
    const step = isMobile ? 1 : 2
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2)

    // ── GL objects — created lazily at launch, not at mount ──────────
    let gl: WebGLRenderingContext | null = null
    let prog: WebGLProgram | null = null
    let vs: WebGLShader | null = null
    let fs: WebGLShader | null = null
    let buf: WebGLBuffer | null = null
    const U: Record<string, WebGLUniformLocation | null> = {}
    let count = 0

    let disposed = false
    let failed = false
    const fail = () => {
      if (failed || disposed) return
      failed = true
      cbRef.current.onFail()
    }

    const initGL = (): boolean => {
      gl = canvas.getContext('webgl', {
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: false,
        powerPreference: 'low-power',
      }) as WebGLRenderingContext | null
      if (!gl || gl.isContextLost()) return false
      vs = compileShader(gl, gl.VERTEX_SHADER, VERT)
      fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAG)
      prog = gl.createProgram()
      if (!vs || !fs || !prog) return false
      gl.attachShader(prog, vs)
      gl.attachShader(prog, fs)
      gl.linkProgram(prog)
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false
      gl.useProgram(prog)
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

      buf = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buf)
      const aHome = gl.getAttribLocation(prog, 'aHome')
      const aRand = gl.getAttribLocation(prog, 'aRand')
      gl.enableVertexAttribArray(aHome)
      gl.enableVertexAttribArray(aRand)
      gl.vertexAttribPointer(aHome, 2, gl.FLOAT, false, 24, 0)
      gl.vertexAttribPointer(aRand, 4, gl.FLOAT, false, 24, 8)

      for (const name of ['uRes', 'uDpr', 'uTime', 'uProgress', 'uPointer', 'uPtrStr', 'uRipples', 'uC1', 'uC2', 'uC3', 'uC4']) {
        U[name] = gl.getUniformLocation(prog, name)
      }
      gl.uniform1f(U.uDpr, dpr)
      // theme-aware ink: on light paper the swarm needs DEEP saturated tones
      // to read as bold type (partial point coverage lightens everything);
      // on the dark theme it flips to luminous neon so the glyphs glow.
      const dark = document.documentElement.classList.contains('dark')
      const L = dark
        ? { c1: 0.68, c2: 0.72, c3: 0.68, c4: 0.64, sat: 1.5 }
        : { c1: 0.4, c2: 0.38, c3: 0.42, c4: 0.38, sat: 1.75 }
      gl.uniform3fv(U.uC1, hslVarToRgb('--accent', [0.4, 0.1, 0.28], L.sat, L.c1))
      gl.uniform3fv(U.uC2, hslVarToRgb('--lime', [0.32, 0.42, 0.2], L.sat, L.c2))
      gl.uniform3fv(U.uC3, hslVarToRgb('--electric', [0.14, 0.24, 0.48], L.sat, L.c3))
      gl.uniform3fv(U.uC4, hslVarToRgb('--amber', [0.22, 0.18, 0.42], L.sat, L.c4))
      return true
    }

    const layout = (): boolean => {
      if (!gl) return false
      const hostRect = host.getBoundingClientRect()
      const cssW = Math.ceil(hostRect.width) + pad * 2
      const cssH = Math.ceil(hostRect.height) + pad * 2
      canvas.style.width = `${cssW}px`
      canvas.style.height = `${cssH}px`
      canvas.style.left = `${-pad}px`
      canvas.style.top = `${-pad}px`
      canvas.width = Math.floor(cssW * dpr)
      canvas.height = Math.floor(cssH * dpr)
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(U.uRes, cssW, cssH)
      const targets = sampleTargets(lines, hostRect, pad, step)
      if (!targets) return false
      count = targets.length / 6
      gl.bufferData(gl.ARRAY_BUFFER, targets, gl.STATIC_DRAW)
      return true
    }

    // ── frame state (uniform-only per frame) ─────────────────────────
    const pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999, str: 0, tstr: 0 }
    let canvasRect: DOMRect | null = null
    let rectDirty = true
    const ripples: { x: number; y: number; t0: number }[] = []
    const rippleData = new Float32Array(15)
    let assembleStart = -1
    let burstStart = -1
    let raf = 0
    let paused = false
    let elapsed = 0
    let last = performance.now()

    const refreshRect = () => {
      canvasRect = canvas.getBoundingClientRect()
      rectDirty = false
    }

    const render = (now: number) => {
      // truly stop (not idle) while offscreen or hidden — the IO callback
      // and visibilitychange wake the loop back up
      if (failed || disposed || paused || document.hidden || !gl) {
        raf = 0
        last = now
        return
      }
      raf = requestAnimationFrame(render)
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      elapsed += dt
      if (rectDirty) refreshRect()

      // assembly / burst progress
      let progress = Math.min(1, (now - assembleStart) / ASSEMBLE_MS)
      if (burstStart >= 0) {
        const bt = now - burstStart
        if (bt < BURST_IN_MS) {
          progress = 1 - (bt / BURST_IN_MS) * 0.9
        } else if (bt < BURST_IN_MS + ASSEMBLE_MS) {
          progress = 0.1 + ((bt - BURST_IN_MS) / ASSEMBLE_MS) * 0.9
        } else {
          burstStart = -1
          progress = 1
        }
      }

      pointer.x += (pointer.tx - pointer.x) * 0.14
      pointer.y += (pointer.ty - pointer.y) * 0.14
      pointer.str += (pointer.tstr - pointer.str) * 0.08

      let w = 0
      for (let i = 0; i < ripples.length && w < 5; i++) {
        const age = (now - ripples[i].t0) / 1000
        if (age > RIPPLE_LIFE) continue
        rippleData[w * 3] = ripples[i].x
        rippleData[w * 3 + 1] = ripples[i].y
        rippleData[w * 3 + 2] = age
        w++
      }
      for (let i = w; i < 5; i++) rippleData[i * 3 + 2] = -1
      while (ripples.length && (now - ripples[0].t0) / 1000 > RIPPLE_LIFE) ripples.shift()

      gl.uniform1f(U.uTime, elapsed)
      gl.uniform1f(U.uProgress, progress)
      gl.uniform2f(U.uPointer, pointer.x, pointer.y)
      gl.uniform1f(U.uPtrStr, pointer.str)
      gl.uniform3fv(U.uRipples, rippleData)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.POINTS, 0, count)
    }

    // ── launch: after fonts (accurate glyph sampling) + boot veil ────
    const launch = () => {
      if (disposed || failed || assembleStart >= 0) return
      if (!initGL() || !layout()) {
        fail()
        return
      }
      canvas.addEventListener('webglcontextlost', onLost as EventListener)
      assembleStart = performance.now()
      last = performance.now()
      raf = requestAnimationFrame(render)
    }
    const pendingTimers: ReturnType<typeof setTimeout>[] = []
    // gate on the ACTUAL display face — document.fonts.ready can resolve
    // against an empty pending set before the async stylesheet even starts
    const fontsReady: Promise<unknown> = Promise.race([
      document.fonts?.load?.('700 1em "Space Grotesk"') ?? Promise.resolve(),
      new Promise((r) => pendingTimers.push(setTimeout(r, 2500))),
    ])
    let launchT: ReturnType<typeof setTimeout> | undefined
    Promise.resolve(fontsReady).then(() => {
      // small beat after the fonts settle so the swarm-in is actually seen
      if (!disposed) launchT = setTimeout(launch, 120)
    })
    // late font arrivals reflow the text — re-sample so the swarm can
    // never drift from the glyphs it is supposed to be
    document.fonts?.ready?.then(() => {
      if (!disposed && !failed && assembleStart >= 0 && !layout()) fail()
    })

    // ── input ─────────────────────────────────────────────────────────
    const near = (cx: number, cy: number, slack: number) => {
      if (!canvasRect) return false
      return (
        cx > canvasRect.left - slack &&
        cx < canvasRect.right + slack &&
        cy > canvasRect.top - slack &&
        cy < canvasRect.bottom + slack
      )
    }
    // pointer forces are a MOUSE affordance: on touch, the "cursor" is a
    // scroll gesture and the field latching to it carved rings through the
    // headline. Fine pointers only, and always released on up/cancel.
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      if (rectDirty) refreshRect()
      if (!canvasRect) return
      pointer.tx = e.clientX - canvasRect.left
      pointer.ty = e.clientY - canvasRect.top
      pointer.tstr = near(e.clientX, e.clientY, 40) ? 1 : 0
    }
    const releasePointer = () => {
      pointer.tstr = 0
    }
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      if (rectDirty) refreshRect()
      if (!near(e.clientX, e.clientY, 60) || !canvasRect) return
      ripples.push({
        x: e.clientX - canvasRect.left,
        y: e.clientY - canvasRect.top,
        t0: performance.now(),
      })
      if (ripples.length > 5) ripples.shift()
    }
    const onBurst = () => {
      if (assembleStart >= 0 && burstStart < 0) burstStart = performance.now()
    }
    const markDirty = () => {
      rectDirty = true
    }
    const onLost = (e: Event) => {
      e.preventDefault()
      fail()
    }

    // rebuild targets on real width changes (debounced)
    let resizeT: ReturnType<typeof setTimeout> | undefined
    let lastW = window.innerWidth
    const onResize = () => {
      rectDirty = true
      if (window.innerWidth === lastW) return
      lastW = window.innerWidth
      clearTimeout(resizeT)
      resizeT = setTimeout(() => {
        if (!disposed && !failed && assembleStart >= 0 && !layout()) fail()
      }, 300)
    }

    // restart the (fully stopped) loop when the hero returns / tab re-shows
    const wakeRender = () => {
      if (!raf && !disposed && !failed && assembleStart >= 0 && !paused && !document.hidden) {
        last = performance.now()
        raf = requestAnimationFrame(render)
      }
    }
    const io = new IntersectionObserver((es) => {
      paused = !(es[0]?.isIntersecting ?? true)
      if (!paused) wakeRender()
    })
    io.observe(canvas)
    // any reflow that changes the text's box (late font, zoom, rotation)
    // re-samples — the swarm can never drift from its glyphs
    let roT: ReturnType<typeof setTimeout> | undefined
    const ro = new ResizeObserver(() => {
      clearTimeout(roT)
      roT = setTimeout(() => {
        if (!disposed && !failed && assembleStart >= 0 && !layout()) fail()
      }, 200)
    })
    ro.observe(lines[0])
    const onVis = () => wakeRender()
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', releasePointer, { passive: true })
    window.addEventListener('pointercancel', releasePointer, { passive: true })
    window.addEventListener('blur', releasePointer)
    window.addEventListener('fx:burst', onBurst)
    window.addEventListener('scroll', markDirty, { passive: true })
    window.addEventListener('resize', onResize)

    return () => {
      disposed = true
      if (raf) cancelAnimationFrame(raf)
      clearTimeout(launchT)
      clearTimeout(resizeT)
      clearTimeout(roT)
      ro.disconnect()
      pendingTimers.forEach(clearTimeout)
      document.removeEventListener('visibilitychange', onVis)
      io.disconnect()
      canvas.removeEventListener('webglcontextlost', onLost as EventListener)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', releasePointer)
      window.removeEventListener('pointercancel', releasePointer)
      window.removeEventListener('blur', releasePointer)
      window.removeEventListener('fx:burst', onBurst)
      window.removeEventListener('scroll', markDirty)
      window.removeEventListener('resize', onResize)
      if (gl) {
        if (prog) gl.deleteProgram(prog)
        if (vs) gl.deleteShader(vs)
        if (fs) gl.deleteShader(fs)
        if (buf) gl.deleteBuffer(buf)
        gl.getExtension('WEBGL_lose_context')?.loseContext()
      }
    }
    // lineRefs is stable-by-construction (memoized array of stable refs)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostRef, isMobile])

  return (
    <canvas
      ref={canvasRef}
      // key: crossing the md breakpoint re-runs the effect, whose cleanup
      // loses the GL context — getContext on the SAME node then returns that
      // dead context forever. A fresh canvas node per mode sidesteps it.
      key={isMobile ? 'particles-m' : 'particles-d'}
      aria-hidden
      className="absolute pointer-events-none z-[1]"
      // zero-sized until launch() lays it out — a default 300×150 canvas box
      // getting repositioned later would register as a layout shift (CLS)
      style={{ width: 0, height: 0 }}
    />
  )
})
