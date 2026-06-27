import { useEffect, useRef, useState } from 'react'
import { useFxLevel } from '../../hooks/useFxLevel'

/**
 * ShaderText — the LITERAL "living shader flowing inside the letters".
 *
 * A dedicated WebGL canvas runs the same domain-warped FBM flow field as
 * the background, but multiplies its output alpha by a TEXT MASK TEXTURE:
 * the headline is rendered to an offscreen 2D canvas (canvas `fillText`, so
 * wrapping + web-font glyphs are fully under our control), uploaded as a
 * texture, and sampled in the fragment shader. The field therefore shows
 * ONLY inside the glyphs — real shader pixels poured into the type.
 *
 * Robustness: the mask is rebuilt on resize and after the web font loads,
 * so it always matches the rendered size; lines are explicit (no reflow
 * guesswork). A real <h1> with the text stays in the DOM for a11y/SEO, and
 * mobile / reduced-motion / no-WebGL fall back to a static gradient text.
 */

const VERT = `attribute vec2 a_pos; void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }`

const FRAG = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec3 u_c1, u_c2, u_c3, u_c4; // line 1 palette
uniform vec3 u_d1, u_d2, u_d3, u_d4; // line 2 palette
uniform sampler2D u_mask;

float hash(vec2 p){ p = fract(p*vec2(123.34,345.45)); p += dot(p, p+34.345); return fract(p.x*p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  float a = hash(i), b = hash(i+vec2(1.0,0.0)), c = hash(i+vec2(0.0,1.0)), d = hash(i+vec2(1.0,1.0));
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
}
float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.02; a*=0.5; } return v; }

void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  float m = texture2D(u_mask, vec2(uv.x, 1.0 - uv.y)).a;
  if (m < 0.004) { gl_FragColor = vec4(0.0); return; }

  vec2 p = uv * vec2(u_res.x / u_res.y, 1.0) * 2.6;
  float t = u_time * 0.35;
  vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2,1.3) - t*0.8));
  vec2 r = vec2(fbm(p + 1.7*q + vec2(1.7,9.2) + 0.15*t),
                fbm(p + 1.7*q + vec2(8.3,2.8) - 0.13*t));
  float f = fbm(p + 2.0*r);

  // pick the palette per line so the two lines read as distinct shades.
  // The text mask is sampled flipped, so the TOP line (line 1) is uv.y > 0.5.
  float top = step(0.5, uv.y);
  vec3 a1 = mix(u_d1, u_c1, top);
  vec3 a2 = mix(u_d2, u_c2, top);
  vec3 a3 = mix(u_d3, u_c3, top);
  vec3 a4 = mix(u_d4, u_c4, top);

  vec3 col = mix(a1, a3, clamp(length(q), 0.0, 1.0));
  col = mix(col, a2, clamp(length(r) * 0.9, 0.0, 1.0));
  col = mix(col, a4, clamp(f*f*1.5, 0.0, 1.0));

  // flowing bright filaments for life (kept modest so the type stays legible)
  float band = abs(fract(f*2.6 + t*0.6) - 0.5);
  float fil = smoothstep(0.05, 0.0, band);
  col += fil * 0.35 * mix(a3, vec3(1.0), 0.45);

  // keep enough depth for contrast on the light paper
  col *= 0.95;
  gl_FragColor = vec4(col, m);
}
`

type RGB = [number, number, number]

function hslVar(name: string, fallback: RGB, satBoost = 1, lightTo?: number): RGB {
  if (typeof window === 'undefined') return fallback
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  const mm = raw.match(/([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/)
  if (!mm) return fallback
  const h = parseFloat(mm[1])
  const s = Math.min(1, (parseFloat(mm[2]) / 100) * satBoost)
  const l = lightTo !== undefined ? lightTo : parseFloat(mm[3]) / 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
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

export function ShaderText({
  lines,
  className = '',
}: {
  lines: string[]
  className?: string
}) {
  const { reduceMotion } = useFxLevel()
  const hostRef = useRef<HTMLHeadingElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [paused, setPaused] = useState(false)
  const pausedRef = useRef(false)
  pausedRef.current = paused
  const [failed, setFailed] = useState(false)
  // lines is a fresh array each render — keep it in a ref so the WebGL effect
  // doesn't tear down + recreate the context on every parent re-render (the
  // boot typewriter re-renders ~20x/sec, which would exhaust GL contexts).
  const linesRef = useRef(lines)
  linesRef.current = lines

  // pause when the hero scrolls offscreen
  useEffect(() => {
    const el = hostRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) setPaused(!e.isIntersecting)
      },
      { rootMargin: '60px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    // reduced-motion → static gradient fallback; everyone else (incl. mobile)
    // gets the real shader-in-text. The canvas is small, so it's cheap.
    if (reduceMotion) return
    const host = hostRef.current
    const canvas = canvasRef.current
    if (!host || !canvas) return

    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
      depth: false,
      powerPreference: 'low-power',
    }) as WebGLRenderingContext | null
    if (!gl) {
      setFailed(true)
      return
    }
    const vs = compile(gl, gl.VERTEX_SHADER, VERT)
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
    if (!vs || !fs) {
      setFailed(true)
      return
    }
    const prog = gl.createProgram()!
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      setFailed(true)
      return
    }
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(prog, 'a_pos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    const U = {
      res: gl.getUniformLocation(prog, 'u_res'),
      time: gl.getUniformLocation(prog, 'u_time'),
      mask: gl.getUniformLocation(prog, 'u_mask'),
      c1: gl.getUniformLocation(prog, 'u_c1'),
      c2: gl.getUniformLocation(prog, 'u_c2'),
      c3: gl.getUniformLocation(prog, 'u_c3'),
      c4: gl.getUniformLocation(prog, 'u_c4'),
      d1: gl.getUniformLocation(prog, 'u_d1'),
      d2: gl.getUniformLocation(prog, 'u_d2'),
      d3: gl.getUniformLocation(prog, 'u_d3'),
      d4: gl.getUniformLocation(prog, 'u_d4'),
    }
    // Two palettes kept in SEPARATE hue families so the lines read as clearly
    // different color sets. Line 1 "Product Engineer" — a pure COOL blue ramp
    // (mid → bright → sky → deep), no magenta so it stays unmistakably blue.
    gl.uniform3fv(U.c1, hslVar('--electric', [0.18, 0.32, 0.6], 1.25, 0.5))
    gl.uniform3fv(U.c2, hslVar('--electric', [0.3, 0.46, 0.78], 1.35, 0.64))
    gl.uniform3fv(U.c3, hslVar('--electric', [0.42, 0.6, 0.88], 1.2, 0.74))
    gl.uniform3fv(U.c4, hslVar('--electric', [0.08, 0.16, 0.4], 1.3, 0.3))
    // Line 2 "Making It Happen" — a pure WARM magenta / rose ramp, the
    // complementary side of the wheel so the contrast against line 1 is obvious.
    gl.uniform3fv(U.d1, hslVar('--accent', [0.62, 0.18, 0.42], 1.3, 0.52))
    gl.uniform3fv(U.d2, hslVar('--accent', [0.82, 0.32, 0.58], 1.4, 0.66))
    gl.uniform3fv(U.d3, hslVar('--accent', [0.9, 0.5, 0.72], 1.2, 0.76))
    gl.uniform3fv(U.d4, hslVar('--plum', [0.34, 0.1, 0.26], 1.3, 0.3))

    // mask texture (text rendered to a 2D canvas)
    const maskTex = gl.createTexture()
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, maskTex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.uniform1i(U.mask, 0)

    const maskCanvas = document.createElement('canvas')
    const mctx = maskCanvas.getContext('2d')!

    let cssW = 0
    let cssH = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const buildMask = () => {
      if (cssW < 2 || cssH < 2) return
      const cs = getComputedStyle(host)
      const w = Math.floor(cssW * dpr)
      const h = Math.floor(cssH * dpr)
      maskCanvas.width = w
      maskCanvas.height = h
      mctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      mctx.clearRect(0, 0, cssW, cssH)
      mctx.fillStyle = '#fff'
      mctx.textAlign = 'left'
      mctx.textBaseline = 'middle'
      mctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
      try {
        // match the headline's tight tracking where supported
        ;(mctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing =
          cs.letterSpacing && cs.letterSpacing !== 'normal' ? cs.letterSpacing : '-0.02em'
      } catch {
        /* letterSpacing unsupported — fine */
      }
      const ln = linesRef.current
      const band = cssH / ln.length
      ln.forEach((line, i) => {
        mctx.fillText(line, 0, band * (i + 0.5))
      })
      gl.bindTexture(gl.TEXTURE_2D, maskTex)
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, maskCanvas)
    }

    const resize = () => {
      cssW = host.clientWidth
      cssH = host.clientHeight
      const w = Math.max(1, Math.floor(cssW * dpr))
      const h = Math.max(1, Math.floor(cssH * dpr))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
        gl.viewport(0, 0, w, h)
        gl.uniform2f(U.res, w, h)
      }
      buildMask()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(host)
    // rebuild once the real web font is ready (first paint may be a fallback face)
    if (document.fonts?.ready) document.fonts.ready.then(resize).catch(() => {})

    let raf = 0
    let last = performance.now()
    let elapsed = 0
    const render = (now: number) => {
      raf = requestAnimationFrame(render)
      if (pausedRef.current || document.hidden) {
        last = now
        return
      }
      elapsed += Math.min(0.05, (now - last) / 1000)
      last = now
      gl.uniform1f(U.time, elapsed)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    raf = requestAnimationFrame(render)

    const onLost = (e: Event) => {
      e.preventDefault()
      setFailed(true)
    }
    canvas.addEventListener('webglcontextlost', onLost)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      canvas.removeEventListener('webglcontextlost', onLost)
      gl.deleteProgram(prog)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      gl.deleteBuffer(buf)
      gl.deleteTexture(maskTex)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [reduceMotion])

  const useGL = !reduceMotion && !failed

  return (
    <h1 ref={hostRef} className={`relative ${className}`} aria-label={lines.join(' ')}>
      {/* real text — reserves the exact box + carries a11y/SEO; invisible when
          the canvas is painting, a static gradient as the fallback */}
      <span aria-hidden className={useGL ? 'text-transparent' : 'aurora-text'}>
        {lines.map((line, i) => (
          <span key={i} className="block whitespace-nowrap">
            {line}
          </span>
        ))}
      </span>
      {useGL && (
        <canvas
          ref={canvasRef}
          aria-hidden
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
      )}
    </h1>
  )
}
