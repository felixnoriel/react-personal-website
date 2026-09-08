/**
 * SIGNAL — the skills chapter's behaviour.
 *
 * The sculpture is the constellation while this chapter is on screen, so
 * the 56 tool labels are pinned to the very points the swarm is drawing,
 * through the same camera (scene.project). A crisp canvas draws the same
 * neighbour graph the shape's filaments follow, which turns the soft
 * volumetric knots into readable stars.
 *
 * Per frame, while the chapter is up, this writes two style properties per
 * visible label and one canvas pass. Nothing reads layout, nothing
 * allocates, and everything stops the moment the chapter leaves.
 *
 * With no GPU at all (?fx=css, or a machine with neither WebGPU nor
 * WebGL2) the scene never ticks, so the section runs the same constellation
 * on its own small camera instead — the chapter is designed either way.
 */
import type { Scene, Vec3 } from '../scene'
import { DOMAINS, TOOLS } from '../../shared/content'
import type { Domain } from '../../shared/content'
import { NODE_R, PHONE_SCALE, constellationEdges, constellationNodes, constellationSpread, domainCenter } from '../shapes/constellation'

type RGB = [number, number, number]
type Filter = 'all' | Domain

const SHAPE = 4
const M = TOOLS.length

/** "H S% L%" → sRGB 0..255, for the canvas */
function tokenRGB(name: string, fallback: RGB): RGB {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  const m = raw.match(/([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/)
  if (!m) return fallback
  const h = parseFloat(m[1])
  const s = parseFloat(m[2]) / 100
  const l = parseFloat(m[3]) / 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))))
  return [f(0), f(8), f(4)]
}

function glowSprite(c: RGB, size: number): HTMLCanvasElement {
  const cv = document.createElement('canvas')
  cv.width = size
  cv.height = size
  const g = cv.getContext('2d')
  if (g) {
    const r = size / 2
    const grad = g.createRadialGradient(r, r, 0, r, r, r)
    grad.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},0.95)`)
    grad.addColorStop(0.28, `rgba(${c[0]},${c[1]},${c[2]},0.34)`)
    grad.addColorStop(0.62, `rgba(${c[0]},${c[1]},${c[2]},0.07)`)
    grad.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`)
    g.fillStyle = grad
    g.fillRect(0, 0, size, size)
  }
  return cv
}

export function init(scene: Scene) {
  const sky = document.getElementById('skSky')
  const web = document.getElementById('skWeb') as HTMLCanvasElement | null
  const starsHost = document.getElementById('skStars')
  const listEl = document.getElementById('skList')
  const focusEl = document.getElementById('skFocus')
  const metaEl = document.getElementById('skMeta')
  const section = document.getElementById('skills')
  if (!sky || !web || !starsHost || !listEl || !focusEl || !section) return
  // narrowed once, so the closures below do not have to re-prove it
  const skyEl: HTMLElement = sky
  const canvasEl: HTMLCanvasElement = web
  const listBox: HTMLElement = listEl
  const focusBox: HTMLElement = focusEl
  const sectionEl: HTMLElement = section

  const stars = Array.from(starsHost.querySelectorAll<HTMLElement>('.sk-star'))
  const rowEls = Array.from(listEl.querySelectorAll<HTMLElement>('.sk-row'))
  const rows: (HTMLElement | undefined)[] = new Array(TOOLS.length)
  for (const r of rowEls) rows[Number(r.dataset.i)] = r
  const chips = Array.from(document.querySelectorAll<HTMLElement>('.sk-chip'))
  if (stars.length !== M) return

  const g = canvasEl.getContext('2d', { alpha: true })
  const reduced = scene.reduced
  let phone = matchMedia('(max-width: 860px)').matches

  /* ------------------------------------------------------------ geometry */

  // the shape build baked a smaller sphere for a phone; the labels have to
  // sit on the same one, so the factor is read once and never re-read
  const RAD = NODE_R * (phone ? PHONE_SCALE : 1)
  const geoK = phone ? PHONE_SCALE : 1
  const home = constellationNodes(geoK)
  const spread = constellationSpread(geoK)
  const edges = constellationEdges()
  const centre: Record<Domain, Vec3> = {
    frontend: domainCenter('frontend', geoK),
    backend: domainCenter('backend', geoK),
    infra: domainCenter('infra', geoK),
  }

  /** live positions the labels, the canvas and the gravity well all share */
  const pts: Vec3[] = home.map((p) => [p[0], p[1], p[2]] as Vec3)
  const inc = new Float32Array(M).fill(1) // 1 = in the current filter
  const sx = new Float32Array(M)
  const sy = new Float32Array(M)
  const sw = new Float32Array(M)
  const front = new Float32Array(M)
  const seen = new Uint8Array(M)
  const lastA = new Float32Array(M).fill(-1)
  const labA = new Float32Array(M)
  const labVis = new Float32Array(M).fill(1)
  const labW = new Float32Array(M)
  const bx0 = new Float32Array(M)
  const bx1 = new Float32Array(M)
  const by0 = new Float32Array(M)
  const by1 = new Float32Array(M)
  const side = new Int8Array(M).fill(1)
  const ORIGIN: Vec3 = [0, 0, 0]
  const ord: number[] = []
  for (let i = 0; i < M; i++) ord.push(i)

  const domIdx: Record<Domain, number> = { frontend: 0, backend: 1, infra: 2 }
  const DOM_RGB: RGB[] = [
    tokenRGB('--magenta', [196, 118, 168]),
    tokenRGB('--lime', [199, 214, 158]),
    tokenRGB('--electric', [110, 148, 214]),
  ]
  const DOM_CSS = DOM_RGB.map((c) => `rgb(${c[0]},${c[1]},${c[2]})`)
  const SPRITE = DOM_RGB.map((c) => glowSprite(c, 96))
  const tdom = TOOLS.map((t) => domIdx[t.domain])
  /** which labels the sky carries at this width (a phone shows only the live ones) */
  const shown = TOOLS.map((t) => !phone || t.live)
  /** edges grouped by domain, so the canvas sets its stroke colour three times */
  const edgeByDom: [number, number][][] = [[], [], []]
  for (const e of edges) edgeByDom[tdom[e[0]]].push(e)

  /* --------------------------------------------------------------- state */

  let filter: Filter = 'all'
  let hover = -1
  let active = false
  let mode: 'wait' | 'live' | 'solo' = 'wait'
  let vw = window.innerWidth
  let vh = window.innerHeight
  let dpr = 1
  let tPrev = performance.now()
  let bornAt = 0
  let hoverPulse = 0
  let hoverFrom: 'sky' | 'list' = 'sky'
  let ptrX = -1e4
  let ptrY = -1e4
  // 1 while the written toolbox owns the screen: the sky steps back rather
  // than printing 56 labels through the panel
  let dimWant = 0
  let dim = 0

  /* ----------------------------------------------------- the solo camera */

  let yaw = 0.3
  let pitch = -0.18
  let yawV = 0
  let pitchV = 0
  let drift = 0
  let soloRaf = 0
  let onScreen = false

  const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)

  /* ------------------------------------------------------------- targets */

  function targetOf(i: number, out: Vec3) {
    if (filter === 'all') {
      out[0] = home[i][0] * RAD
      out[1] = home[i][1] * RAD
      out[2] = home[i][2] * RAD
    } else if (TOOLS[i].domain === filter) {
      out[0] = spread[i][0]
      out[1] = spread[i][1]
      out[2] = spread[i][2]
    } else {
      out[0] = home[i][0] * RAD * 0.3
      out[1] = home[i][1] * RAD * 0.3
      out[2] = home[i][2] * RAD * 0.3
    }
  }
  const tmp: Vec3 = [0, 0, 0]

  // constellationNodes/Spread already carry the radius; normalise both to
  // plain unit vectors once so targetOf can scale them itself
  for (let i = 0; i < M; i++) {
    const l = Math.hypot(home[i][0], home[i][1], home[i][2]) || 1
    home[i][0] /= l
    home[i][1] /= l
    home[i][2] /= l
    pts[i][0] = home[i][0] * RAD
    pts[i][1] = home[i][1] * RAD
    pts[i][2] = home[i][2] * RAD
  }

  /** the reading column's left edge: the sky never writes over the copy */
  let copyLeft = 1e9
  /** label widths, measured off the render loop (never inside a frame) */
  function measureLabels() {
    for (let i = 0; i < M; i++) labW[i] = stars[i].offsetWidth || TOOLS[i].name.length * 7.1 + 6
    const col = sectionEl.querySelector<HTMLElement>('.inner')
    copyLeft = !phone && col ? col.getBoundingClientRect().left - 16 : 1e9
  }
  requestAnimationFrame(measureLabels)
  if ('fonts' in document) document.fonts.ready.then(measureLabels).catch(() => {})

  /* -------------------------------------------------------------- canvas */

  function sizeCanvas() {
    vw = window.innerWidth
    vh = window.innerHeight
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    if (vw * vh * dpr * dpr > 3.2e6) dpr = Math.sqrt(3.2e6 / (vw * vh))
    canvasEl.width = Math.max(1, Math.round(vw * dpr))
    canvasEl.height = Math.max(1, Math.round(vh * dpr))
    g?.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  /* --------------------------------------------------------- the readout */

  const fd = focusEl.querySelector<HTMLElement>('.sk-fd')
  const fn = focusEl.querySelector<HTMLElement>('.sk-fn')
  const fm = focusEl.querySelector<HTMLElement>('.sk-fm')

  function setHover(i: number) {
    if (i === hover) return
    if (hover >= 0) {
      stars[hover].classList.remove('hi')
      rows[hover]?.classList.remove('hi')
    }
    hover = i
    if (i >= 0) {
      const t = TOOLS[i]
      stars[i].classList.add('hi')
      rows[i]?.classList.add('hi')
      focusBox.dataset.d = t.domain
      if (fd) fd.textContent = `${t.domain === 'infra' ? 'infrastructure' : t.domain === 'frontend' ? 'front end' : 'back end'} · ${t.group}`
      if (fn) fn.textContent = t.name
      if (fm) fm.textContent = `${t.years} ${t.years === 1 ? 'year' : 'years'}${t.live ? ' · on it today' : t.legacy ? ' · legacy' : ''}`
      focusBox.classList.add('on')
      scene.setWell(pts[i], 0.58)
      hoverPulse = 1
    } else {
      focusBox.classList.remove('on')
      releaseWell()
    }
  }

  function releaseWell() {
    if (filter === 'all') scene.setWell(null)
    else scene.setWell(centre[filter], 0.62)
  }

  /* --------------------------------------------------------- the filters */

  const scopeEl = metaEl?.querySelector<HTMLElement>('.sk-scope')
  const numEls = metaEl ? Array.from(metaEl.querySelectorAll<HTMLElement>('b')) : []
  const GLYPH = '0123456789'

  function scramble(el: HTMLElement, value: string) {
    if (reduced) {
      el.textContent = value
      return
    }
    let step = 0
    const tick = () => {
      step++
      if (step >= 5) {
        el.textContent = value
        return
      }
      let s = ''
      for (let i = 0; i < value.length; i++) s += i < (value.length * step) / 5 ? value[i] : GLYPH[(Math.random() * 10) | 0]
      el.textContent = s
      setTimeout(tick, 38)
    }
    tick()
  }

  function setFilter(next: Filter) {
    if (next === filter) return
    filter = next
    for (const c of chips) {
      const on = c.dataset.f === next
      c.classList.toggle('on', on)
      c.setAttribute('aria-pressed', on ? 'true' : 'false')
    }
    listBox.dataset.f = next
    if (metaEl) {
      if (next === 'all') delete metaEl.dataset.d
      else metaEl.dataset.d = next
    }
    const pool = next === 'all' ? TOOLS : TOOLS.filter((t) => t.domain === next)
    if (numEls[0]) scramble(numEls[0], String(pool.length))
    if (numEls[1]) scramble(numEls[1], String(pool.filter((t) => t.live).length))
    if (scopeEl) scopeEl.textContent = next === 'all' ? 'whole toolbox' : (DOMAINS.find((d) => d.id === next)?.caption ?? '')
    if (hover >= 0 && next !== 'all' && TOOLS[hover].domain !== next) setHover(-1)
    releaseWell()
    scene.fire(next === 'all' ? [0, 0, 0] : centre[next])
    if (mode === 'solo') startSolo()
  }

  for (const c of chips) {
    c.addEventListener('click', () => setFilter((c.dataset.f as Filter) || 'all'))
    // the four chips behave as one control: arrows walk them, as a toolbar does
    c.addEventListener('keydown', (e) => {
      const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
      if (!step) return
      e.preventDefault()
      const i = chips.indexOf(c)
      const next = chips[(i + step + chips.length) % chips.length]
      next.focus()
      setFilter((next.dataset.f as Filter) || 'all')
    })
  }

  /* ----------------------------------------------------------- the mouse */

  const idxOf = (e: Event, sel: string) => {
    const el = (e.target as Element | null)?.closest?.(sel) as HTMLElement | null
    if (!el) return -1
    const n = Number(el.dataset.i)
    return Number.isFinite(n) ? n : -1
  }

  starsHost.addEventListener('pointerover', (e) => {
    const i = idxOf(e, '.sk-star')
    if (i >= 0) {
      hoverFrom = 'sky'
      setHover(i)
    }
  })
  // no pointerout here on purpose: the sphere turns, so a label slides out
  // from under a still cursor. The frame loop lets go when the pointer is
  // genuinely far from the star instead.
  addEventListener(
    'pointermove',
    (e) => {
      ptrX = e.clientX
      ptrY = e.clientY
    },
    { passive: true },
  )
  addEventListener(
    'pointerdown',
    (e) => {
      const t2 = e.target as Element | null
      if (hoverFrom === 'sky' && hover >= 0 && !t2?.closest?.('.sk-star')) setHover(-1)
    },
    { passive: true },
  )
  starsHost.addEventListener('click', (e) => {
    const i = idxOf(e, '.sk-star')
    if (i < 0) return
    hoverFrom = 'sky'
    setHover(i)
    scene.fire(pts[i])
    hoverPulse = 1
  })
  listEl.addEventListener('pointerover', (e) => {
    const i = idxOf(e, '.sk-row')
    if (i >= 0) {
      hoverFrom = 'list'
      setHover(i)
    }
  })
  listEl.addEventListener('pointerleave', () => {
    if (hover >= 0) setHover(-1)
  })

  /* --------------------------------------------------- the drag, solo only */

  let dragging = false
  let lastX = 0
  let lastY = 0
  // the sky layer itself is pointer-transparent, so the press has to be
  // caught on the page — anything that is text or a control keeps its own
  // behaviour, everything else turns the sphere
  const READING = 'a, button, input, textarea, p, li, h1, h2, h3, h4, .sk-list'
  addEventListener(
    'pointerdown',
    (e) => {
      if (mode !== 'solo' || !active) return
      const t2 = e.target as Element | null
      if (e.pointerType === 'mouse' && t2?.closest?.(READING)) return
      dragging = true
      lastX = e.clientX
      lastY = e.clientY
      drift = 0
    },
    { passive: true },
  )
  addEventListener(
    'pointermove',
    (e) => {
      if (!dragging || mode !== 'solo') return
      yawV += (e.clientX - lastX) * 0.0016
      pitchV += (e.clientY - lastY) * 0.0011
      lastX = e.clientX
      lastY = e.clientY
    },
    { passive: true },
  )
  const endDrag = () => {
    dragging = false
  }
  addEventListener('pointerup', endDrag, { passive: true })
  addEventListener('pointercancel', endDrag, { passive: true })

  /* ------------------------------------------------------------- the run */

  function activate() {
    active = true
    sizeCanvas()
    skyEl.classList.add('on')
    if (!bornAt) bornAt = performance.now()
    releaseWell()
  }
  function deactivate() {
    active = false
    skyEl.classList.remove('on')
    setHover(-1)
    scene.setWell(null)
    if (g) g.clearRect(0, 0, vw, vh)
    for (let i = 0; i < M; i++)
      if (lastA[i] !== 0) {
        stars[i].style.opacity = '0'
        lastA[i] = 0
      }
  }

  let rt = 0
  addEventListener('resize', () => {
    clearTimeout(rt)
    rt = window.setTimeout(() => {
      phone = matchMedia('(max-width: 860px)').matches
      for (let i = 0; i < M; i++) shown[i] = !phone || TOOLS[i].live
      if (active) sizeCanvas()
      measureLabels()
    }, 180)
  })

  /** the section's own camera, used only when no GPU tier ignited */
  function soloProject(i: number) {
    const p = pts[i]
    const cy = Math.cos(yaw)
    const sy2 = Math.sin(yaw)
    const cx = Math.cos(pitch)
    const sx2 = Math.sin(pitch)
    const x1 = p[0] * cy - p[2] * sy2
    const z1 = p[0] * sy2 + p[2] * cy
    const y2 = p[1] * cx - z1 * sx2
    const z2 = p[1] * sx2 + z1 * cx
    const persp = 4.2
    const w = persp - z2
    const k = (persp / w) * soloRad
    sx[i] = soloCx + x1 * k
    sy[i] = soloCy - y2 * k
    sw[i] = w
  }
  let soloCx = 0
  let soloCy = 0
  let soloRad = 1
  function soloFrame() {
    soloCx = phone ? vw * 0.5 : vw * 0.355
    soloCy = phone ? vh * 0.26 : vh * 0.5
    soloRad = phone ? Math.min(vw, vh) * 0.16 : Math.min(vw * 0.145, vh * 0.175)
  }

  function tick(now: number) {
    const dtRaw = (now - tPrev) / 1000
    tPrev = now
    const dt = clamp(dtRaw, 0.001, 0.05)
    dim += (dimWant - dim) * clamp(dt * 5.5, 0, 1)

    const near =
      mode === 'live' ? clamp(1 - Math.abs(scene.frame.morph - SHAPE) * 1.05, 0, 1) : onScreen ? 1 : 0
    if (near <= 0.002 || (dim > 0.985 && dimWant === 1)) {
      if (active) deactivate()
      return
    }
    if (!active) activate()

    // ---- the layout eases toward whatever the filter asks for
    const k = 1 - Math.exp(-dt * (reduced ? 24 : 7.4))
    for (let i = 0; i < M; i++) {
      targetOf(i, tmp)
      const p = pts[i]
      p[0] += (tmp[0] - p[0]) * k
      p[1] += (tmp[1] - p[1]) * k
      p[2] += (tmp[2] - p[2]) * k
      const want = filter === 'all' || TOOLS[i].domain === filter ? 1 : 0.055
      inc[i] += (want - inc[i]) * k
    }
    hoverPulse *= Math.pow(0.86, dt * 60)
    if (hover >= 0 && hoverFrom === 'sky' && !scene.coarse) {
      const dx = ptrX - sx[hover]
      const dy = ptrY - sy[hover]
      if (dx * dx + dy * dy > 130 * 130) setHover(-1)
    }

    // ---- project every star with the camera the sculpture is using
    let minW = 1e9
    let maxW = -1e9
    if (mode === 'live') {
      for (let i = 0; i < M; i++) {
        const q = scene.project(pts[i])
        sx[i] = q.x
        sy[i] = q.y
        sw[i] = q.w
        seen[i] = q.visible ? 1 : 0
        if (q.visible) {
          if (q.w < minW) minW = q.w
          if (q.w > maxW) maxW = q.w
        }
      }
    } else {
      soloFrame()
      for (let i = 0; i < M; i++) {
        soloProject(i)
        seen[i] = 1
        if (sw[i] < minW) minW = sw[i]
        if (sw[i] > maxW) maxW = sw[i]
      }
    }
    const span = Math.max(0.001, maxW - minW)
    const mid = (minW + maxW) / 2
    for (let i = 0; i < M; i++) front[i] = seen[i] ? clamp((maxW - sw[i]) / span, 0, 1) : 0
    ord.sort((a, b) => front[a] - front[b])

    // ---- decide each label before anything is drawn: only the near half of
    // the sphere carries text, and a label sits on the outward side of its
    // star so the middle of the sky stays open
    const shade = near * (1 - dim)
    const cx = mode === 'live' ? scene.project(ORIGIN).x : soloCx
    for (let i = 0; i < M; i++) {
      if (!shown[i] || !seen[i]) {
        labA[i] = 0
        continue
      }
      const born = reduced ? 1 : clamp((now - bornAt - i * 13) / 340, 0, 1)
      const gate = clamp((front[i] - 0.3) / 0.24, 0, 1)
      labA[i] = shade * inc[i] * born * gate * (0.5 + 0.5 * front[i])
      if (sx[i] < cx - 26) side[i] = -1
      else if (sx[i] > cx + 26) side[i] = 1
    }

    // ---- no two names ever stack: walking front to back, the nearer star
    // keeps its label and anything it would cover fades out (and back in
    // when the sphere turns), so the sky stays a chart rather than a pile
    const vk = clamp(dt * 6.5, 0, 1)
    let acc = 0
    for (let n = M - 1; n >= 0; n--) {
      const i = ord[n]
      let ok = labA[i] > 0.05
      if (ok) {
        const sc = clamp(mid / Math.max(0.4, sw[i]), 0.76, 1.24)
        const w = (labW[i] || 62) * sc
        const h = 16 * sc
        const x0 = side[i] > 0 ? sx[i] + 10 * sc : sx[i] - 10 * sc - w
        const y0 = sy[i] - h * 0.5
        const x1 = x0 + w
        const y1 = y0 + h
        // the rails and the reading column are out of bounds for a label
        if (x1 > copyLeft || x0 < 6 || x1 > vw - 6 || y0 < (phone ? 88 : 60) || y1 > vh - 54 || (phone && sy[i] > vh * 0.42)) ok = false
        for (let k = 0; ok && k < acc; k++) {
          if (x0 < bx1[k] + 4 && x1 + 4 > bx0[k] && y0 < by1[k] + 2 && y1 + 2 > by0[k]) {
            ok = false
            break
          }
        }
        if (ok) {
          bx0[acc] = x0
          bx1[acc] = x1
          by0[acc] = y0
          by1[acc] = y1
          acc++
        }
      }
      labVis[i] += ((ok ? 1 : 0) - labVis[i]) * vk
      labA[i] *= labVis[i]
    }

    // ---- the crisp figure: the same neighbour graph the swarm's filaments follow
    if (g) {
      g.clearRect(0, 0, vw, vh)
      g.globalCompositeOperation = 'lighter'
      g.lineWidth = phone ? 0.7 : 0.85
      for (let d = 0; d < 3; d++) {
        g.strokeStyle = DOM_CSS[d]
        const list = edgeByDom[d]
        for (let e = 0; e < list.length; e++) {
          const a = list[e][0]
          const b = list[e][1]
          if (!seen[a] || !seen[b]) continue
          const vis = Math.min(inc[a], inc[b])
          if (vis < 0.06) continue
          const f = (front[a] + front[b]) * 0.5
          const hot = hover === a || hover === b ? 0.5 : 0
          const alpha = shade * vis * (0.06 + f * 0.2 + hot) * (mode === 'solo' ? 1.35 : 1)
          if (alpha < 0.012) continue
          g.globalAlpha = Math.min(0.85, alpha)
          g.beginPath()
          g.moveTo(sx[a], sy[a])
          g.lineTo(sx[b], sy[b])
          g.stroke()
        }
      }

      // back to front, so the near stars sit on top of the far ones
      // with no GPU bloom behind them the crisp stars carry the whole image,
      // so they burn a little brighter on the CSS tier
      const solo = mode === 'solo' ? 1.5 : 1
      const base = (phone ? 1.6 : 2.1) * (mode === 'solo' ? 1.15 : 1)
      g.fillStyle = '#eef2ff'
      for (let n = 0; n < M; n++) {
        const i = ord[n]
        if (!seen[i] || inc[i] < 0.05) continue
        const t = TOOLS[i]
        const sc = clamp(mid / Math.max(0.4, sw[i]), 0.55, 1.7)
        const hot = hover === i ? 1 : 0
        const a = shade * inc[i] * (0.22 + front[i] * 0.78)
        const r = (base + t.years * 0.115) * sc * (t.legacy ? 0.72 : 1) * (1 + hot * 0.5)
        const gl = r * (t.legacy ? 4.2 : 6.4) * (1 + hot * 0.9 + hoverPulse * hot * 0.6)
        g.globalAlpha = Math.min(1, a * (t.legacy ? 0.45 : 0.8) * (1 + hot) * solo)
        g.drawImage(SPRITE[tdom[i]], sx[i] - gl, sy[i] - gl, gl * 2, gl * 2)
        g.globalAlpha = Math.min(1, a * (t.legacy ? 0.42 : 1))
        g.beginPath()
        if (t.legacy) {
          g.strokeStyle = DOM_CSS[tdom[i]]
          g.lineWidth = 1
          g.arc(sx[i], sy[i], r, 0, 6.2832)
          g.stroke()
        } else {
          if (hot) g.fillStyle = '#ffffff'
          g.arc(sx[i], sy[i], r, 0, 6.2832)
          g.fill()
          if (hot) g.fillStyle = '#eef2ff'
        }
      }
      // the hairline that ties a label back to its star
      g.strokeStyle = '#c9d4ff'
      g.lineWidth = 0.7
      for (let i = 0; i < M; i++) {
        if (labA[i] < 0.08) continue
        const sc = clamp(mid / Math.max(0.4, sw[i]), 0.76, 1.24)
        const r = (base + TOOLS[i].years * 0.115) * sc + 1.6
        g.globalAlpha = labA[i] * 0.4
        g.beginPath()
        g.moveTo(sx[i] + r * side[i], sy[i])
        g.lineTo(sx[i] + 10.5 * sc * side[i], sy[i])
        g.stroke()
      }
      g.globalAlpha = 1
      g.globalCompositeOperation = 'source-over'
    }

    // ---- the labels: two writes each, and only while they can be seen
    for (let i = 0; i < M; i++) {
      if (!shown[i]) continue
      const el = stars[i]
      const a = labA[i]
      if (a <= 0.02) {
        if (lastA[i] !== 0) {
          el.style.opacity = '0'
          lastA[i] = 0
        }
        continue
      }
      const sc = clamp(mid / Math.max(0.4, sw[i]), 0.76, 1.24)
      const flip = side[i] < 0 ? ' translateX(-100%)' : ''
      el.style.transform = `translate3d(${sx[i].toFixed(1)}px,${sy[i].toFixed(1)}px,0) scale(${sc.toFixed(3)}) translate(${11 * side[i]}px,-50%)${flip}`
      el.style.opacity = a.toFixed(3)
      lastA[i] = a
    }
  }

  /* --------------------------------------------------------- the two loops */

  scene.onFrame(() => {
    if (mode !== 'live') {
      mode = 'live'
      if (soloRaf) cancelAnimationFrame(soloRaf)
      soloRaf = 0
      tPrev = performance.now()
    }
    tick(performance.now())
  })

  function soloLoop(now: number) {
    // no GPU loop is paying for this one, so it only runs while the chapter
    // is on screen and the tab is in front
    if (mode !== 'solo' || !onScreen) {
      soloRaf = 0
      if (active) deactivate()
      return
    }
    soloRaf = requestAnimationFrame(soloLoop)
    if (document.hidden) {
      tPrev = now
      return
    }
    const dt = clamp((now - tPrev) / 1000, 0.001, 0.05)
    if (!reduced) {
      // a short entry turn so the depth reads, then it rests
      drift += dt
      const idle = dragging || drift > 5 ? 0 : 0.16
      yawV += (idle * dt * 6 - yawV) * Math.min(1, dt * 2.2)
      yaw += yawV
      pitch = clamp(pitch + pitchV, -0.62, 0.62)
      yawV *= Math.pow(0.9, dt * 60)
      pitchV *= Math.pow(0.9, dt * 60)
    }
    tick(now)
  }
  function startSolo() {
    drift = 0
    if (soloRaf || mode === 'live') return
    mode = 'solo'
    tPrev = performance.now()
    soloRaf = requestAnimationFrame(soloLoop)
  }

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (es) => {
        onScreen = es[0].isIntersecting
        if (mode === 'solo' && onScreen && !soloRaf) startSolo()
      },
      { rootMargin: '10% 0px' },
    )
    io.observe(section)
  } else {
    onScreen = true
  }
  // once the written toolbox covers the upper half of the screen it is the
  // thing being read, so the constellation bows out instead of printing
  // labels through it
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (es) => {
        dimWant = es[0].isIntersecting ? 1 : 0
        if (!dimWant && mode === 'solo' && onScreen && !soloRaf) startSolo()
      },
      { rootMargin: '0px 0px -55% 0px' },
    )
    io.observe(listBox)
  }

  // the GPU tiers tick this section themselves; if nothing has, run it alone
  setTimeout(() => {
    if (mode === 'wait') startSolo()
  }, 2600)

  /* ------------------------------------------------- the counters, once */

  if (metaEl && 'IntersectionObserver' in window && !reduced) {
    const target = numEls.map((el) => el.dataset.n || el.textContent || '0')
    const io = new IntersectionObserver(
      (es) => {
        if (!es[0].isIntersecting) return
        io.disconnect()
        numEls.forEach((el, i) => {
          const end = parseInt(target[i], 10) || 0
          const t0 = performance.now()
          const step = (n: number) => {
            const p = clamp((n - t0) / 900, 0, 1)
            el.textContent = String(Math.round(end * (1 - Math.pow(1 - p, 4))))
            if (p < 1) requestAnimationFrame(step)
            else el.textContent = target[i]
          }
          requestAnimationFrame(step)
        })
      },
      { rootMargin: '0px 0px -18% 0px' },
    )
    io.observe(metaEl)
  }

  if (scene.coarse) {
    const hint = document.getElementById('skHint')
    if (hint) hint.textContent = 'drag to spin · tap a star · pick a stack'
  }
}
