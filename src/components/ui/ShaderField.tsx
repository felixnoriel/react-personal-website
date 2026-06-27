import { memo, useEffect, useRef, useState } from 'react'
import { useFxLevel } from '../../hooks/useFxLevel'

/**
 * ShaderField — the hero's signature "wow" background. A single WebGL
 * fragment shader paints a domain-warped flow field (Iñigo-Quilez-style
 * FBM) that drifts through the brand palette and reacts to the cursor.
 *
 * Why a shader instead of more DOM/SVG/Canvas-2D animation: the old hero
 * stacked ~10 independent main-thread animation systems (node network,
 * circuit SMIL, lightning, meteors, spotlight spring, dot twinkles, a
 * 4Hz re-render…) that fought each other for the main thread and caused
 * the click/scroll hangs in the git history. A fragment shader does ALL
 * its work on the GPU — the main thread just writes a couple of uniforms
 * per frame — so it looks far more advanced AND frees the main thread.
 * That's the whole trick behind "how is this real-time in a browser."
 *
 * Performance guards:
 *   - Renders at REDUCED_SCALE of CSS pixels (the field is soft, so a
 *     smaller buffer is visually identical but a big fill-rate win).
 *   - Pauses the rAF loop when `paused` (hero scrolled offscreen) and
 *     when the tab is hidden.
 *   - Mouse is rAF-coalesced and eased; no per-event GL work.
 *   - Mobile / reduced-motion / no-WebGL fall back to a static CSS
 *     gradient (no GPU loop at all) via `disableHeavyFx`.
 *   - Handles WebGL context loss/restore gracefully.
 */

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`

// Domain-warped fractal flow field. Output is premultiplied-free RGBA so it
// composites over the paper background; alpha is driven by the field so the
// hero stays light and legible where the field is quiet.
const FRAG = `
precision highp float;

uniform vec2  u_res;
uniform float u_time;
uniform vec2  u_mouse;      // normalized 0..1, y up
uniform float u_mouseGlow;  // 0 when pointer absent, ~1 when present
uniform vec3  u_c1;         // accent  (violet)
uniform vec3  u_c2;         // lime    (tea green)
uniform vec3  u_c3;         // electric(dusk blue)
uniform vec3  u_c4;         // amber   (indigo)
uniform float u_alpha;      // master intensity
uniform float u_dark;       // 0 = light paper, 1 = dark mode
uniform vec3  u_ripples[5]; // click shockwaves: xy = pos (0..1, y up), z = age (s); z<0 = inactive

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p *= 2.02;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / u_res.y;

  vec2 p = uv;
  p.x *= aspect;
  p *= 2.3;

  float t = u_time * 0.075;

  // pull the field gently toward the cursor for a "live" feel
  vec2 m = u_mouse;
  m.x *= aspect;
  m *= 2.3;
  vec2 toM = (m - p);
  float mDist = length(toM);
  p += normalize(toM + 0.0001) * 0.18 * u_mouseGlow * exp(-mDist * 0.9);

  // two-stage domain warp
  vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t * 0.8));
  vec2 r = vec2(
    fbm(p + 1.7 * q + vec2(1.7, 9.2) + 0.15 * t),
    fbm(p + 1.7 * q + vec2(8.3, 2.8) - 0.13 * t)
  );
  float f = fbm(p + 2.0 * r);

  // cursor bloom
  vec2 muv = u_mouse;
  muv.x *= aspect;
  vec2 fuv = uv;
  fuv.x *= aspect;
  float glow = exp(-length(fuv - muv) * 3.2) * u_mouseGlow;
  f += glow * 0.35;

  // distinct color regions from the warp vectors (less muddy than averaging
  // everything together) so violet, blue, green and indigo each get their say
  vec3 col = u_c1;
  col = mix(col, u_c3, smoothstep(0.15, 0.85, q.x));
  col = mix(col, u_c2, smoothstep(0.20, 0.85, r.y) * 0.95);
  col = mix(col, u_c4, smoothstep(0.55, 1.0, f));

  // twin flowing filament bands — bright thin level sets that drift as f evolves
  float band1 = abs(fract(f * 2.6 + t * 0.7) - 0.5);
  float band2 = abs(fract(f * 5.0 - t * 0.4) - 0.5);
  float fil = smoothstep(0.06, 0.0, band1) + 0.5 * smoothstep(0.035, 0.0, band2);
  vec3 filCol = mix(u_c3, vec3(1.0), 0.35);
  col += fil * 0.7 * filCol;
  col += glow * 0.8 * mix(u_c1, u_c2, 0.4);

  // lift saturation + contrast so it reads as a luminous energy field, not haze
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col = clamp(mix(vec3(lum), col, 1.35), 0.0, 1.2);

  // alpha: quiet where the field is low so text stays readable
  float a = u_alpha * (0.18 + 0.82 * smoothstep(0.10, 0.92, f));
  a += fil * 0.35 * u_alpha;
  a += glow * 0.35;

  // on light paper keep it airy; on dark mode let it breathe wider
  a *= mix(0.9, 1.15, u_dark);

  // click shockwaves — luminous rings expanding from each click point
  for (int i = 0; i < 5; i++) {
    float age = u_ripples[i].z;
    if (age < 0.0) continue;
    vec2 rp = u_ripples[i].xy;
    rp.x *= aspect;
    float d = distance(vec2(uv.x * aspect, uv.y), rp);
    float radius = age * 0.55;
    float life = clamp(1.0 - age / 1.6, 0.0, 1.0);
    float ring = smoothstep(0.05, 0.0, abs(d - radius)) * life;
    col += ring * (0.5 * (u_c1 + u_c3) + 0.35);
    a += ring * 0.55 * life;
  }

  gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
}
`

// Render the field at a fraction of CSS resolution. The field is soft, so a
// smaller buffer looks identical while slashing fragment-shader fill cost.
const REDUCED_SCALE = 0.6

type RGB = [number, number, number]

// Read an "H S% L%" CSS var → RGB 0..1. satBoost/lightTo turn the UI-tuned
// (deliberately muted, for text contrast) brand colors into luminous versions
// that actually glow as an aurora over the light paper instead of going muddy.
function hslVarToRgb(
  varName: string,
  fallback: RGB,
  satBoost = 1,
  lightTo?: number,
): RGB {
  if (typeof window === 'undefined') return fallback
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim()
  // expected "H S% L%"
  const m = raw.match(/([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/)
  if (!m) return fallback
  const h = parseFloat(m[1])
  const s = Math.min(1, (parseFloat(m[2]) / 100) * satBoost)
  const l = lightTo !== undefined ? lightTo : parseFloat(m[3]) / 100
  const k = (n: number) => (n + h / 30) % 12
  const aa = s * Math.min(l, 1 - l)
  const f = (n: number) =>
    l - aa * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [f(0), f(8), f(4)]
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
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

interface ShaderFieldProps {
  className?: string
  paused?: boolean
  /** master intensity 0..1 (how strong the wash reads) */
  intensity?: number
}

export const ShaderField = memo(function ShaderField({
  className = '',
  paused = false,
  intensity = 1,
}: ShaderFieldProps) {
  const { reduceMotion, isMobile } = useFxLevel()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [webglFailed, setWebglFailed] = useState(false)

  // Live refs the rAF loop reads without re-subscribing.
  const pausedRef = useRef(paused)
  pausedRef.current = paused
  const intensityRef = useRef(intensity)
  intensityRef.current = intensity

  useEffect(() => {
    // Reduced-motion users get the static CSS fallback (no GPU loop). Mobile
    // DOES get the live shader now — just at a lower internal resolution so the
    // fill cost stays trivial on phone GPUs.
    if (reduceMotion) return
    const canvas = canvasRef.current
    if (!canvas) return
    const renderScale = isMobile ? 0.42 : REDUCED_SCALE

    const gl = (canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      powerPreference: 'low-power',
      desynchronized: true,
    }) ||
      canvas.getContext('experimental-webgl', {
        alpha: true,
        antialias: false,
      })) as WebGLRenderingContext | null

    if (!gl) {
      setWebglFailed(true)
      return
    }

    const vs = compile(gl, gl.VERTEX_SHADER, VERT)
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
    if (!vs || !fs) {
      setWebglFailed(true)
      return
    }
    const prog = gl.createProgram()
    if (!prog) {
      setWebglFailed(true)
      return
    }
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      setWebglFailed(true)
      return
    }
    gl.useProgram(prog)

    // Full-screen triangle (covers clip space; cheaper than a quad).
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    )
    const aPos = gl.getAttribLocation(prog, 'a_pos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    const U = {
      res: gl.getUniformLocation(prog, 'u_res'),
      time: gl.getUniformLocation(prog, 'u_time'),
      mouse: gl.getUniformLocation(prog, 'u_mouse'),
      mouseGlow: gl.getUniformLocation(prog, 'u_mouseGlow'),
      c1: gl.getUniformLocation(prog, 'u_c1'),
      c2: gl.getUniformLocation(prog, 'u_c2'),
      c3: gl.getUniformLocation(prog, 'u_c3'),
      c4: gl.getUniformLocation(prog, 'u_c4'),
      alpha: gl.getUniformLocation(prog, 'u_alpha'),
      dark: gl.getUniformLocation(prog, 'u_dark'),
      ripples: gl.getUniformLocation(prog, 'u_ripples'),
    }

    // Palette from CSS variables → works in light or (future) dark mode.
    const readPalette = () => {
      gl.uniform3fv(U.c1, hslVarToRgb('--accent', [0.72, 0.3, 0.56], 1.35, 0.58))
      gl.uniform3fv(U.c2, hslVarToRgb('--lime', [0.66, 0.82, 0.45], 1.3, 0.62))
      gl.uniform3fv(U.c3, hslVarToRgb('--electric', [0.3, 0.5, 0.82], 1.4, 0.58))
      gl.uniform3fv(U.c4, hslVarToRgb('--amber', [0.46, 0.4, 0.74], 1.35, 0.54))
      const isDark = document.documentElement.classList.contains('dark')
      gl.uniform1f(U.dark, isDark ? 1 : 0)
    }
    readPalette()

    let cssW = 0
    let cssH = 0
    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      cssW = parent.clientWidth
      cssH = parent.clientHeight
      const w = Math.max(1, Math.floor(cssW * renderScale))
      const h = Math.max(1, Math.floor(cssH * renderScale))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
        gl.viewport(0, 0, w, h)
        gl.uniform2f(U.res, w, h)
      }
    }
    resize()
    const ro = new ResizeObserver(resize)
    if (canvas.parentElement) ro.observe(canvas.parentElement)

    // Cursor reactivity. The canvas + its wrapper are pointer-events:none (so
    // they never block clicks on the hero content) — which means they never
    // receive pointer events either. So we listen on `window` and normalize
    // against the canvas rect. Eased in the render loop; no GL work per event.
    const mouse = { tx: 0.5, ty: 0.5, x: 0.5, y: 0.5, glow: 0, tglow: 0 }
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const nx = (e.clientX - rect.left) / Math.max(1, rect.width)
      const ny = (e.clientY - rect.top) / Math.max(1, rect.height)
      mouse.tx = nx
      mouse.ty = 1 - ny
      // glow only when the pointer is actually over (or near) the hero
      mouse.tglow =
        nx >= -0.1 && nx <= 1.1 && ny >= -0.1 && ny <= 1.1 ? 1 : 0
    }
    const onLeave = () => {
      mouse.tglow = 0
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseleave', onLeave)

    let raf = 0
    let elapsed = 0
    let last = performance.now()
    let contextLost = false

    // click shockwaves — a click anywhere sends a ring through the field.
    // Capped at 5 concurrent; aged + pruned each frame. Pure uniform writes.
    const RIPPLE_LIFE = 1.6
    const ripples: { x: number; y: number; t0: number }[] = []
    const rippleData = new Float32Array(15)
    for (let i = 0; i < 5; i++) rippleData[i * 3 + 2] = -1
    const onDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      ripples.push({
        x: (e.clientX - rect.left) / Math.max(1, rect.width),
        y: 1 - (e.clientY - rect.top) / Math.max(1, rect.height),
        t0: elapsed,
      })
      if (ripples.length > 5) ripples.shift()
    }
    window.addEventListener('pointerdown', onDown, { passive: true })

    const onLost = (e: Event) => {
      e.preventDefault()
      contextLost = true
      if (raf) cancelAnimationFrame(raf)
    }
    const onRestored = () => {
      contextLost = false
      // A restored context needs full re-init; simplest robust path is to
      // flip to the CSS fallback rather than rebuild GL state mid-session.
      setWebglFailed(true)
    }
    canvas.addEventListener('webglcontextlost', onLost as EventListener)
    canvas.addEventListener('webglcontextrestored', onRestored)

    const render = (now: number) => {
      raf = requestAnimationFrame(render)
      if (contextLost) return
      // Pause when offscreen or tab hidden — zero GPU/CPU while parked.
      if (pausedRef.current || document.hidden) {
        last = now
        return
      }
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      elapsed += dt

      // ease cursor + glow
      mouse.x += (mouse.tx - mouse.x) * 0.08
      mouse.y += (mouse.ty - mouse.y) * 0.08
      mouse.glow += (mouse.tglow - mouse.glow) * 0.06

      gl.uniform1f(U.time, elapsed)
      gl.uniform2f(U.mouse, mouse.x, mouse.y)
      gl.uniform1f(U.mouseGlow, mouse.glow)
      gl.uniform1f(U.alpha, intensityRef.current)

      // pack active ripples (age <= life) into the uniform array
      let w = 0
      for (let i = 0; i < ripples.length && w < 5; i++) {
        const age = elapsed - ripples[i].t0
        if (age > RIPPLE_LIFE) continue
        rippleData[w * 3] = ripples[i].x
        rippleData[w * 3 + 1] = ripples[i].y
        rippleData[w * 3 + 2] = age
        w++
      }
      for (let i = w; i < 5; i++) rippleData[i * 3 + 2] = -1
      while (ripples.length && elapsed - ripples[0].t0 > RIPPLE_LIFE) ripples.shift()
      gl.uniform3fv(U.ripples, rippleData)

      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    raf = requestAnimationFrame(render)

    // Re-read palette if the theme class flips (no toggle today, cheap insurance).
    const mo = new MutationObserver(readPalette)
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => {
      if (raf) cancelAnimationFrame(raf)
      ro.disconnect()
      mo.disconnect()
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('webglcontextlost', onLost as EventListener)
      canvas.removeEventListener('webglcontextrestored', onRestored)
      gl.deleteProgram(prog)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      gl.deleteBuffer(buf)
      const ext = gl.getExtension('WEBGL_lose_context')
      ext?.loseContext()
    }
  }, [reduceMotion, isMobile])

  // CSS fallback — static layered brand-color blooms. Free (no loop), used for
  // reduced-motion or when WebGL is unavailable / lost.
  const showFallback = reduceMotion || webglFailed

  return (
    <div
      aria-hidden
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
    >
      {showFallback && (
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(60% 50% at 18% 22%, hsl(var(--accent) / 0.20), transparent 70%),' +
              'radial-gradient(55% 45% at 82% 18%, hsl(var(--electric) / 0.16), transparent 72%),' +
              'radial-gradient(60% 55% at 70% 88%, hsl(var(--lime) / 0.18), transparent 70%),' +
              'radial-gradient(50% 45% at 30% 80%, hsl(var(--amber) / 0.14), transparent 72%)',
          }}
        />
      )}
      {!reduceMotion && !webglFailed && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ width: '100%', height: '100%' }}
        />
      )}
    </div>
  )
})
