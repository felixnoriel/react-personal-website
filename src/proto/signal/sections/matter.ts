/**
 * SIGNAL — the hero's words are matter.
 *
 * The real headline and subtitle stay in the DOM (read, selected, indexed).
 * When the cursor comes near them, an exact light copy takes their place:
 * every pixel of the rendered glyphs becomes a particle with the colour the
 * page painted there. The copy obeys the same gravity as the core —
 *   · a moving cursor drags the letters after it, and they spring home;
 *   · a charged black hole (hold the mouse on open ground) tears them off
 *     and swallows them; letting go blows them back out and they re-form;
 *   · a click or a tap on the words bursts them from that point.
 * Once everything is home and the cursor has left, the DOM text fades back.
 *
 * The simulation is a few typed arrays on the CPU (tens of thousands of
 * particles, ~1 ms a frame) and runs only while something is disturbed;
 * one WebGL2 draw puts it on a canvas above the copy. Idle cost: zero.
 */
import type { Scene } from '../scene'

type Src = { el: HTMLElement; gradient: boolean }

const VERT = /* glsl */ `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPos;   // viewport css px
layout(location = 1) in vec4 aCol;   // rgb + coverage
layout(location = 2) in float aFx;   // 0..1 speed glow, negative = swallowed
uniform vec2 uView;
uniform float uSize;
uniform float uGlow;                 // 0 = the solid pass, 1 = the halo pass
out vec4 vCol;
void main() {
  vec2 ndc = vec2(aPos.x / uView.x * 2.0 - 1.0, 1.0 - aPos.y / uView.y * 2.0);
  gl_Position = vec4(ndc, 0.0, 1.0);
  float eaten = clamp(-aFx, 0.0, 1.0);
  float hot = max(aFx, 0.0);
  gl_PointSize = uSize * mix(1.0, 7.0, uGlow) * (1.0 + hot * 0.6);
  vec3 c = mix(aCol.rgb, vec3(1.0, 0.97, 0.92), min(0.75, hot));
  float a = aCol.a * (1.0 - eaten) * mix(1.0, 0.032 + hot * 0.08, uGlow);
  vCol = vec4(c * a, a);
}`

const FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec4 vCol;
uniform float uGlow;
out vec4 o;
void main() {
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float d = dot(q, q);
  float k = uGlow > 0.5 ? exp(-d * 3.2) : (d > 1.0 ? 0.0 : 1.0);
  if (k <= 0.004) discard;
  o = vCol * k;
}`

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)

function hsl(token: string): [number, number, number] {
  const m = getComputedStyle(document.documentElement)
    .getPropertyValue(token)
    .match(/([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/)
  if (!m) return [1, 1, 1]
  const h = +m[1]
  const s = +m[2] / 100
  const l = +m[3] / 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [f(0), f(8), f(4)]
}

export function initMatter(scene: Scene, sources: Src[]) {
  if (scene.reduced || !sources.length) return
  const hero = sources[0].el.closest<HTMLElement>('.hero')
  if (!hero) return

  const canvas = document.createElement('canvas')
  canvas.id = 'matter'
  canvas.setAttribute('aria-hidden', 'true')
  document.body.appendChild(canvas)
  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false })
  if (!gl) {
    canvas.remove()
    return
  }
  const mk = (type: number, src: string) => {
    const sh = gl.createShader(type)!
    gl.shaderSource(sh, src)
    gl.compileShader(sh)
    return sh
  }
  const prog = gl.createProgram()!
  gl.attachShader(prog, mk(gl.VERTEX_SHADER, VERT))
  gl.attachShader(prog, mk(gl.FRAGMENT_SHADER, FRAG))
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    canvas.remove()
    return
  }
  const uView = gl.getUniformLocation(prog, 'uView')
  const uSize = gl.getUniformLocation(prog, 'uSize')
  const uGlow = gl.getUniformLocation(prog, 'uGlow')
  const vao = gl.createVertexArray()!
  const posBuf = gl.createBuffer()!
  const colBuf = gl.createBuffer()!
  const fxBuf = gl.createBuffer()!

  /* ------------------------------------------------ the glyphs, as matter */

  let N = 0
  let hx = new Float32Array(0) // home, document px
  let hy = new Float32Array(0)
  let x = new Float32Array(0)
  let y = new Float32Array(0)
  let vx = new Float32Array(0)
  let vy = new Float32Array(0)
  let fx = new Float32Array(0) // speed glow, or < 0 while swallowed
  let screen = new Float32Array(0)
  let built = false
  let zone = { l: 0, t: 0, r: 0, b: 0 } // document px

  /** draw each character where the DOM put it, read the pixels back */
  function build() {
    const sx = window.scrollX
    const sy = window.scrollY
    const px: number[] = [] // document x, y per particle
    const col: number[] = [] // r, g, b, coverage per particle
    zone = { l: Infinity, t: Infinity, r: -Infinity, b: -Infinity }
    const stops = [hsl('--electric'), hsl('--indigo'), hsl('--magenta'), hsl('--lime')]
    const at = [0, 0.38, 0.72, 1.04]
    const ramp = (t: number): [number, number, number] => {
      t = clamp(t, 0, 1.04)
      let i = 0
      while (i < at.length - 2 && t > at[i + 1]) i++
      const u = clamp((t - at[i]) / (at[i + 1] - at[i]), 0, 1)
      const a = stops[i]
      const b = stops[i + 1]
      return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]
    }

    for (const src of sources) {
      const node = src.el.firstChild
      if (!node || node.nodeType !== Node.TEXT_NODE) continue
      const text = node.textContent || ''
      const cs = getComputedStyle(src.el)
      const range = document.createRange()
      const chars: { ch: string; r: DOMRect }[] = []
      for (let i = 0; i < text.length; i++) {
        if (!text[i].trim()) continue
        range.setStart(node, i)
        range.setEnd(node, i + 1)
        const r = range.getBoundingClientRect()
        if (r.width > 0) chars.push({ ch: text[i], r })
      }
      if (!chars.length) continue
      let l = Infinity
      let t = Infinity
      let r = -Infinity
      let b = -Infinity
      for (const c of chars) {
        l = Math.min(l, c.r.left)
        t = Math.min(t, c.r.top)
        r = Math.max(r, c.r.right)
        b = Math.max(b, c.r.bottom)
      }
      l = Math.floor(l) - 2
      t = Math.floor(t) - 2
      const W = Math.ceil(r - l) + 4
      const H = Math.ceil(b - t) + 4
      const cv = document.createElement('canvas')
      cv.width = W
      cv.height = H
      const g = cv.getContext('2d', { willReadFrequently: true })
      if (!g) continue
      g.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
      g.fillStyle = '#fff'
      g.textBaseline = 'alphabetic'
      // the line fragments, in reading order, for the continuous gradient
      const lines: { top: number; left: number; width: number; off: number }[] = []
      let run = 0
      for (const c of chars) {
        let ln = lines.find((q) => Math.abs(q.top - c.r.top) < c.r.height * 0.5)
        if (!ln) {
          ln = { top: c.r.top, left: c.r.left, width: 0, off: 0 }
          lines.push(ln)
        }
        ln.left = Math.min(ln.left, c.r.left)
        ln.width = Math.max(ln.width, c.r.right - ln.left)
        const m = g.measureText(c.ch)
        const asc = m.fontBoundingBoxAscent || c.r.height * 0.8
        const desc = m.fontBoundingBoxDescent || c.r.height * 0.2
        // the char box is the font's content area: centre it on the box
        const base = c.r.top + (c.r.height - (asc + desc)) / 2 + asc
        g.fillText(c.ch, c.r.left - l, base - t)
      }
      for (const ln of lines) {
        ln.off = run
        run += ln.width
      }
      const total = Math.max(1, run)
      const lineH = chars[0].r.height
      const solid = cs.color.match(/[\d.]+/g)?.map(Number) || [255, 255, 255, 1]
      const img = g.getImageData(0, 0, W, H).data
      for (let yy = 0; yy < H; yy++)
        for (let xx = 0; xx < W; xx++) {
          const a = img[(yy * W + xx) * 4 + 3] / 255
          if (a < 0.3) continue
          const vxp = l + xx + 0.5
          const vyp = t + yy + 0.5
          px.push(vxp + sx, vyp + sy)
          if (src.gradient) {
            // CSS paints the inline's gradient across its fragments as one
            // strip (box-decoration-break: slice), at 96deg
            const ln = lines.find((q) => vyp >= q.top - 2 && vyp <= q.top + lineH + 2) || lines[0]
            const ix = ln.off + (vxp - ln.left)
            const iy = vyp - ln.top
            const L = total * 0.9945 + lineH * 0.1045
            const c = ramp(((ix - total / 2) * 0.9945 + (iy - lineH / 2) * 0.1045) / L + 0.5)
            col.push(c[0], c[1], c[2], a)
          } else {
            col.push(solid[0] / 255, solid[1] / 255, solid[2] / 255, a * (solid[3] ?? 1))
          }
        }
      zone.l = Math.min(zone.l, l + sx)
      zone.t = Math.min(zone.t, t + sy)
      zone.r = Math.max(zone.r, l + W + sx)
      zone.b = Math.max(zone.b, t + H + sy)
    }

    N = px.length / 2
    hx = new Float32Array(N)
    hy = new Float32Array(N)
    for (let i = 0; i < N; i++) {
      hx[i] = px[i * 2]
      hy[i] = px[i * 2 + 1]
    }
    x = hx.slice()
    y = hy.slice()
    vx = new Float32Array(N)
    vy = new Float32Array(N)
    fx = new Float32Array(N)
    screen = new Float32Array(N * 2)
    const cols = new Float32Array(col)
    gl!.bindVertexArray(vao)
    gl!.bindBuffer(gl!.ARRAY_BUFFER, posBuf)
    gl!.bufferData(gl!.ARRAY_BUFFER, screen.byteLength, gl!.DYNAMIC_DRAW)
    gl!.enableVertexAttribArray(0)
    gl!.vertexAttribPointer(0, 2, gl!.FLOAT, false, 0, 0)
    gl!.bindBuffer(gl!.ARRAY_BUFFER, colBuf)
    gl!.bufferData(gl!.ARRAY_BUFFER, cols, gl!.STATIC_DRAW)
    gl!.enableVertexAttribArray(1)
    gl!.vertexAttribPointer(1, 4, gl!.FLOAT, false, 0, 0)
    gl!.bindBuffer(gl!.ARRAY_BUFFER, fxBuf)
    gl!.bufferData(gl!.ARRAY_BUFFER, fx.byteLength, gl!.DYNAMIC_DRAW)
    gl!.enableVertexAttribArray(2)
    gl!.vertexAttribPointer(2, 1, gl!.FLOAT, false, 0, 0)
    gl!.bindVertexArray(null)
    built = true
  }

  /* ---------------------------------------------------------- the inputs */

  let cx = -1e4 // cursor, viewport px
  let cy = -1e4
  let pcx = cx
  let pcy = cy
  let cvx = 0 // cursor velocity, px/s
  let cvy = 0
  let movedAt = 0
  let touching = false
  const MARGIN = scene.phone ? 40 : 110

  const near = (m = MARGIN) => {
    const sx = window.scrollX
    const sy = window.scrollY
    return cx + sx > zone.l - m && cx + sx < zone.r + m && cy + sy > zone.t - m && cy + sy < zone.b + m
  }

  const ready = () => scene.live && document.documentElement.dataset.ignite === 'done' && scene.frame.morph < 0.5
  addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse' && !touching) return
      // a real sweep wakes the words; a reader's twitch does not
      const swept = Math.abs(e.clientX - cx) + Math.abs(e.clientY - cy) > 5
      cx = e.clientX
      cy = e.clientY
      movedAt = performance.now()
      if (active || !swept || !ready()) return
      if (!built) build()
      if (near()) wake()
    },
    { passive: true },
  )
  // a click or a tap on the words bursts them from that point
  for (const src of sources)
    src.el.closest('h1, p')?.addEventListener('pointerdown', (e) => {
      if (!ready()) return
      const pe = e as PointerEvent
      touching = pe.pointerType !== 'mouse'
      cx = pcx = pe.clientX
      cy = pcy = pe.clientY
      if (!built) build()
      wake()
      burst(pe.clientX, pe.clientY, 0.32)
    })
  addEventListener('pointerup', () => (touching = false), { passive: true })
  addEventListener('pointercancel', () => (touching = false), { passive: true })
  scene.onBurst((bx, by, power) => {
    if (!ready()) return
    if (!built) build()
    wake()
    burst(bx, by, power)
  })

  // layout moves the glyphs: rebuild after a resize
  let rt = 0
  addEventListener('resize', () => {
    clearTimeout(rt)
    rt = window.setTimeout(() => {
      if (active) sleep()
      built = false
      build()
    }, 220)
  })
  // build once the page has settled, so the first touch is instant
  const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback
  ;(idle ? (cb: () => void) => idle(cb) : (cb: () => void) => setTimeout(cb, 1500))(() => {
    document.fonts?.ready.then(() => {
      if (!built) build()
    })
  })

  /* ------------------------------------------------------- awake / asleep */

  let active = false
  let calm = 0
  let W = 0
  let H = 0
  let dpr = 1

  function wake() {
    if (active || !N) return
    active = true
    calm = 0
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    W = window.innerWidth
    H = window.innerHeight
    canvas.width = Math.round(W * dpr)
    canvas.height = Math.round(H * dpr)
    canvas.classList.add('on')
    hero!.classList.add('matter-on')
  }
  function sleep() {
    active = false
    canvas.classList.remove('on')
    hero!.classList.remove('matter-on')
    for (let i = 0; i < N; i++) {
      x[i] = hx[i]
      y[i] = hy[i]
      vx[i] = vy[i] = fx[i] = 0
    }
  }

  function burst(bx: number, by: number, power: number) {
    const sx = window.scrollX
    const sy = window.scrollY
    const R = 160 + power * 520
    const kick = 700 + power * 2600
    for (let i = 0; i < N; i++) {
      const dx = x[i] - (bx + sx)
      const dy = y[i] - (by + sy)
      const d = Math.sqrt(dx * dx + dy * dy) + 1e-3
      if (fx[i] < 0) fx[i] = 0 // the swallowed come back out first
      if (d > R) continue
      const f = (1 - d / R) * kick * (0.6 + Math.random() * 0.8)
      vx[i] += (dx / d) * f + (Math.random() - 0.5) * f * 0.35
      vy[i] += (dy / d) * f + (Math.random() - 0.5) * f * 0.35
    }
  }

  /* ------------------------------------------------------------ the frame */

  scene.onFrame((fr) => {
    // a hole charging on open ground beside the words reaches for them
    const reach = MARGIN + fr.charge * 300
    if (!active) {
      if (fr.charge > 0.1 && built && ready() && near(reach)) wake()
      if (!active) return
    }
    const dt = clamp(fr.dt, 1 / 240, 1 / 30)
    const sx = window.scrollX
    const sy = window.scrollY
    const now = performance.now()

    // the cursor's velocity, eased, so a flick throws and a hover doesn't
    const ivx = (cx - pcx) / dt
    const ivy = (cy - pcy) / dt
    pcx = cx
    pcy = cy
    const kv = clamp(dt * 14, 0, 1)
    cvx += (clamp(ivx, -4000, 4000) - cvx) * kv
    cvy += (clamp(ivy, -4000, 4000) - cvy) * kv
    // gravity follows motion, as it does for the core
    const moving = 1 - clamp((now - movedAt - 250) / 700, 0, 1)
    const charge = fr.charge
    const inside = near(reach) && fr.morph < 0.5
    const px = cx + sx
    const py = cy + sy
    const G = inside ? (moving * 0.35 + charge * 9) * 9000 : 0
    const R2 = (120 + charge * 300) ** 2
    const swallow = 10 + charge * 26
    const wind = inside ? moving * 5.5 : 0

    let restless = 0
    const R = Math.sqrt(R2)
    for (let i = 0; i < N; i++) {
      let ax = 0
      let ay = 0
      // the spring home; a charged hole nearby loosens it, which is what
      // lets the letters be torn off and drawn in from a distance
      let k = 68
      if (G > 0) {
        const dx = px - x[i]
        const dy = py - y[i]
        const d2 = dx * dx + dy * dy
        if (d2 < R2) {
          const d = Math.sqrt(d2) + 1e-3
          const fall = 1 - d / R
          // 1/d, not 1/d²: a hole the size of a fingertip has to reach a
          // whole word to tear it off
          const g = (G / (d + 60)) * fall
          k *= 1 - 0.94 * charge * Math.min(1, fall * 2.5)
          // pull, plus a swirl so the stream winds in instead of piling up
          ax += (dx / d) * g * 60 - (dy / d) * g * 34 + cvx * wind * fall * fall
          ay += (dy / d) * g * 60 + (dx / d) * g * 34 + cvy * wind * fall * fall
          // past the horizon a particle is swallowed until something lets it go
          if (charge > 0.15 && d < swallow) fx[i] = Math.max(-1, Math.min(fx[i], 0) - dt * 6)
        }
      }
      ax += (hx[i] - x[i]) * k - vx[i] * 12.5
      ay += (hy[i] - y[i]) * k - vy[i] * 12.5
      vx[i] += ax * dt
      vy[i] += ay * dt
      x[i] += vx[i] * dt
      y[i] += vy[i] * dt
      const sp = Math.abs(vx[i]) + Math.abs(vy[i])
      if (fx[i] >= 0) fx[i] = Math.min(1, sp / 1400)
      else if (charge < 0.05) fx[i] = Math.min(0, fx[i] + dt * 3)
      if (sp > 4 || Math.abs(hx[i] - x[i]) + Math.abs(hy[i] - y[i]) > 0.6 || fx[i] < 0) restless++
      screen[i * 2] = x[i] - sx
      screen[i * 2 + 1] = y[i] - sy
    }

    // home, still, and the cursor resting or gone: the page has its words back
    if (!restless && charge === 0 && (!inside || moving === 0)) {
      if (++calm > 12) {
        sleep()
        return
      }
    } else calm = 0

    gl!.viewport(0, 0, canvas.width, canvas.height)
    gl!.clearColor(0, 0, 0, 0)
    gl!.clear(gl!.COLOR_BUFFER_BIT)
    gl!.useProgram(prog)
    gl!.uniform2f(uView, W, H)
    // one sample per css px, drawn as one css px square: at rest the
    // squares tile the glyphs exactly, so the copy is the same weight
    gl!.uniform1f(uSize, 1.02 * dpr)
    gl!.bindVertexArray(vao)
    gl!.bindBuffer(gl!.ARRAY_BUFFER, posBuf)
    gl!.bufferSubData(gl!.ARRAY_BUFFER, 0, screen)
    gl!.bindBuffer(gl!.ARRAY_BUFFER, fxBuf)
    gl!.bufferSubData(gl!.ARRAY_BUFFER, 0, fx)
    gl!.enable(gl!.BLEND)
    // the halo first, added like light; then the glyph matter over it
    if (!document.documentElement.classList.contains('q-lite')) {
      gl!.blendFunc(gl!.ONE, gl!.ONE)
      gl!.uniform1f(uGlow, 1)
      gl!.drawArrays(gl!.POINTS, 0, N)
    }
    gl!.blendFunc(gl!.ONE, gl!.ONE_MINUS_SRC_ALPHA)
    gl!.uniform1f(uGlow, 0)
    gl!.drawArrays(gl!.POINTS, 0, N)
    gl!.bindVertexArray(null)
  })
}
