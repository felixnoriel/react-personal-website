/**
 * NOMAD — the globe chapter's behaviour.
 *
 * The section's HTML is already on screen; this module only adds the layer
 * that rides the sculpture. Per frame it projects fifteen city points and
 * four flight paths with the scene's own camera, drops any label the globe
 * itself is hiding (a real sphere occlusion test, not a guess), drops any
 * label a nearer one already covers, and writes one transform and one
 * opacity per element — nothing else. It reads no layout inside the frame
 * loop, and it does nothing at all while the globe is not the pose on
 * screen, so the chapter costs nothing until the visitor arrives.
 *
 * Everything the overlay shows also exists in the flow (the city index, the
 * manifest, the readout), so the CSS tier, a keyboard and a screen reader
 * get the whole section without it.
 */
import type { Scene, Vec3 } from '../scene'
import type { Arc } from '../shapes/globe'
import { GLOBE_R, cityPoints, greatCircle } from '../shapes/globe'
import { ACTIVE_EDGES, CITY_LIST } from '../../shared/content'

interface CityRec {
  code: string
  name: string
  country: string
  tz: string
  geo: string
  km: string
  btn: HTMLButtonElement
  pin: HTMLElement | null
  p: Vec3
  /** the last written state, so nothing is written twice */
  shown: boolean
  flip: boolean
  /** the label is dropped (a nearer one covers it) and only the dot is drawn */
  bare: boolean
  lit: boolean
}

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a || 1e-6), 0, 1)
  return t * t * (3 - 2 * t)
}

export function init(scene: Scene) {
  const root = document.getElementById('nomad')
  if (!root) return
  const hud = root.querySelector<HTMLElement>('[data-hud]')
  const inner = root.querySelector<HTMLElement>('.inner')
  const pinEls = Array.from(root.querySelectorAll<HTMLElement>('.pin'))
  const jetEls = Array.from(root.querySelectorAll<HTMLElement>('.jet'))
  const laneEls = Array.from(root.querySelectorAll<SVGGElement>('.lane[data-e]'))
  const hovLane = root.querySelector<SVGGElement>('[data-hov]')
  const btns = Array.from(root.querySelectorAll<HTMLButtonElement>('.ct'))
  const legEls = Array.from(root.querySelectorAll<HTMLElement>('[data-legs] li'))
  const now = root.querySelector<HTMLElement>('[data-now]')

  const pts = cityPoints(1)
  const homeAt = CITY_LIST.findIndex((c) => c.current)
  const homeIdx = homeAt >= 0 ? homeAt : 0

  /* ---------------------------------------------------------- the cities */
  const cities: CityRec[] = btns.map((btn) => {
    const i = Number(btn.dataset.i)
    return {
      code: btn.dataset.code || '',
      name: btn.dataset.name || '',
      country: btn.dataset.country || '',
      tz: btn.dataset.tz || 'UTC',
      geo: btn.dataset.geo || '',
      km: btn.dataset.km || '',
      btn,
      pin: pinEls[i] ?? null,
      p: (pts[i] ?? [0, 0, 0]) as Vec3,
      shown: false,
      flip: false,
      bare: false,
      lit: false,
    }
  })

  /* --------------------------------------------------------- the flights */
  const legs = ACTIVE_EDGES.map(([a, b], i) => {
    const ai = CITY_LIST.findIndex((c) => c.code === a)
    const bi = CITY_LIST.findIndex((c) => c.code === b)
    const arc = greatCircle(Math.max(0, ai), Math.max(0, bi))
    return {
      ai,
      bi,
      arc,
      /** longer legs take longer: every dot moves at one honest speed */
      dur: 6 + arc.km / 2200,
      phase: i * 0.37,
      el: jetEls[i] ?? null,
      glow: laneEls[i]?.querySelector<SVGPathElement>('.glow') ?? null,
      core: laneEls[i]?.querySelector<SVGPathElement>('.core') ?? null,
      row: legEls[i] ?? null,
      bar: legEls[i]?.querySelector<HTMLElement>('.bar') ?? null,
      /** where the aircraft is this frame, in sculpture space */
      at: [0, 0, 0] as Vec3,
      hidden: true,
    }
  })
  const hovGlow = hovLane?.querySelector<SVGPathElement>('.glow') ?? null
  const hovCore = hovLane?.querySelector<SVGPathElement>('.core') ?? null

  /* ------------------------------------------------------ the live clock */
  const fmt = new Map<string, Intl.DateTimeFormat>()
  const timeIn = (tz: string) => {
    let f = fmt.get(tz)
    if (!f) {
      try {
        f = new Intl.DateTimeFormat('en-GB', {
          timeZone: tz,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      } catch {
        f = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
      }
      fmt.set(tz, f)
    }
    return f.format(new Date())
  }
  const offset = new Map<string, string>()
  const offsetOf = (tz: string) => {
    let s = offset.get(tz)
    if (s === undefined) {
      try {
        s =
          new Intl.DateTimeFormat('en-GB', { timeZone: tz, timeZoneName: 'shortOffset' })
            .formatToParts(new Date())
            .find((p) => p.type === 'timeZoneName')
            ?.value.replace('GMT', 'UTC') ?? ''
      } catch {
        s = ''
      }
      offset.set(tz, s)
    }
    return s
  }

  const el = {
    code: now?.querySelector<HTMLElement>('[data-code]') ?? null,
    name: now?.querySelector<HTMLElement>('[data-name]') ?? null,
    country: now?.querySelector<HTMLElement>('[data-country]') ?? null,
    time: now?.querySelector<HTMLElement>('[data-time]') ?? null,
    geo: now?.querySelector<HTMLElement>('[data-geo]') ?? null,
    km: now?.querySelector<HTMLElement>('[data-km]') ?? null,
    state: now?.querySelector<HTMLElement>('[data-state]') ?? null,
    homeClock: root.querySelector<HTMLElement>('[data-home-clock]'),
  }

  /* -------------------------------------------------------------- state */
  let hover: number | null = null
  let pinned: number | null = null
  let legHover: number | null = null
  let routeHover: number | null = null
  let shown = homeIdx
  /** which city the globe is steering toward (null = let it drift) */
  let aimIdx: number | null = null
  let pinSteer = false
  let wellTo: Vec3 | null = null
  let lastWell: Vec3 | null = null
  let wellStr = 0

  const tick = () => {
    const c = cities[shown]
    if (c && el.time) el.time.textContent = `${timeIn(c.tz)} ${offsetOf(c.tz)}`
    if (el.homeClock) el.homeClock.textContent = timeIn(cities[homeIdx]?.tz || 'Asia/Bangkok').slice(0, 5)
  }

  const paint = () => {
    const i = hover ?? pinned ?? homeIdx
    if (i !== shown) {
      shown = i
      const c = cities[i]
      if (c) {
        if (el.code) el.code.textContent = c.code
        if (el.name) el.name.textContent = c.name
        if (el.country) el.country.textContent = c.country
        if (el.geo) el.geo.textContent = c.geo
        if (el.km) el.km.textContent = c.km || 'home base'
        if (el.state) el.state.textContent = i === homeIdx ? 'you are here' : 'looking at'
        now?.classList.toggle('away', i !== homeIdx)
      }
    }
    tick()
  }
  tick()
  setInterval(() => {
    if (!document.hidden) tick()
  }, 1000)

  const setLit = (i: number, on: boolean) => {
    const c = cities[i]
    if (!c || c.lit === on) return
    c.lit = on
    c.btn.classList.toggle('on', on)
    c.pin?.classList.toggle('on', on)
  }

  /**
   * `steer` says whether the globe should turn to bring this city round. It
   * is true for the index and the keyboard (the city may be on the far side)
   * and false for a pin on the globe itself — that one is already facing the
   * visitor, and turning it would slide the label out from under the cursor.
   */
  const focus = (i: number | null, steer: boolean) => {
    const was = hover ?? pinned
    hover = i
    const next = hover ?? pinned
    if (was != null && was !== next) setLit(was, false)
    if (next != null) setLit(next, true)
    wellTo = next != null ? cities[next].p : null
    aimIdx = i != null ? (steer ? i : null) : pinSteer ? pinned : null
    paint()
  }

  const togglePin = (i: number, steer: boolean) => {
    const was = pinned
    pinned = pinned === i ? null : i
    if (was != null && was !== pinned) {
      cities[was].btn.setAttribute('aria-pressed', 'false')
      if (was !== hover) setLit(was, false)
    }
    cities[i].btn.setAttribute('aria-pressed', pinned === i ? 'true' : 'false')
    const next = hover ?? pinned
    if (next != null) setLit(next, true)
    wellTo = next != null ? cities[next].p : null
    pinSteer = steer && pinned != null
    aimIdx = pinned != null && steer ? pinned : aimIdx
    scene.fire(cities[i].p)
    paint()
  }

  cities.forEach((c, i) => {
    const enter = (steer: boolean) => (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      focus(i, steer)
    }
    const leave = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      focus(null, false)
    }
    c.btn.addEventListener('pointerenter', enter(true))
    c.btn.addEventListener('pointerleave', leave)
    c.btn.addEventListener('focus', () => focus(i, true))
    c.btn.addEventListener('blur', () => focus(null, false))
    c.btn.addEventListener('click', () => togglePin(i, true))
    const tag = c.pin?.querySelector<HTMLElement>('.tag')
    if (tag) {
      tag.addEventListener('pointerenter', enter(false))
      tag.addEventListener('pointerleave', leave)
      tag.addEventListener('click', () => togglePin(i, false))
    }
  })

  legs.forEach((leg, i) => {
    const row = leg.row
    if (!row) return
    row.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'touch') return
      legHover = i
      row.classList.add('on')
      if (leg.ai >= 0) setLit(leg.ai, true)
      if (leg.bi >= 0) setLit(leg.bi, true)
    })
    row.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'touch') return
      legHover = null
      row.classList.remove('on')
      const keep = hover ?? pinned
      if (leg.ai >= 0 && leg.ai !== keep) setLit(leg.ai, false)
      if (leg.bi >= 0 && leg.bi !== keep) setLit(leg.bi, false)
    })
    row.addEventListener('click', () => scene.fire(leg.at))
  })

  /* ------------------------------------- the fifteen legs he actually flew */
  const flown = Array.from(root.querySelectorAll<HTMLElement>('.lg')).map((li) => ({
    el: li,
    a: Number(li.dataset.a),
    b: Number(li.dataset.b),
    arc: greatCircle(Number(li.dataset.a), Number(li.dataset.b)),
  }))
  flown.forEach((leg, i) => {
    leg.el.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'touch') return
      routeHover = i
      leg.el.classList.add('on')
      setLit(leg.a, true)
      setLit(leg.b, true)
      wellTo = leg.arc.at(0.5) as Vec3
    })
    leg.el.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'touch') return
      routeHover = null
      leg.el.classList.remove('on')
      const keep = hover ?? pinned
      if (leg.a !== keep) setLit(leg.a, false)
      if (leg.b !== keep) setLit(leg.b, false)
      wellTo = keep != null ? cities[keep].p : null
    })
  })

  /* ------------------------------------------------- the four photographs */
  const cards = Array.from(root.querySelectorAll<HTMLElement>('.card[data-p]'))
  const tyo = CITY_LIST.findIndex((c) => c.code === 'TYO')
  let roam = 0
  cards.forEach((card, i) => {
    // each frame is somewhere real: Tokyo, the air over the BKK→MAD leg, the
    // markets of home, and "everywhere" — which walks the whole log
    const enter = () => {
      if (i === 0) wellTo = cities[tyo]?.p ?? null
      else if (i === 1) wellTo = legs[0]?.at ?? null
      else if (i === 2) wellTo = cities[homeIdx]?.p ?? null
      else {
        roam = (roam + 1) % Math.max(1, cities.length)
        wellTo = cities[roam]?.p ?? null
      }
    }
    card.addEventListener('pointerenter', enter)
    card.addEventListener('pointerleave', () => {
      const keep = hover ?? pinned
      wellTo = keep != null ? cities[keep].p : null
    })
    card.addEventListener('click', () => {
      enter()
      if (wellTo) scene.fire(wellTo)
    })
  })

  /* ------------------------------------------------- the numbers counting */
  const dds = Array.from(root.querySelectorAll<HTMLElement>('.nmd-stats dd'))
  const statsEl = root.querySelector('.nmd-stats')
  if (!scene.reduced && statsEl && dds.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        io.disconnect()
        dds.forEach((d, i) => {
          const end = Number(d.dataset.n || 0)
          const sfx = d.dataset.suffix || ''
          const t0 = performance.now() + i * 110
          const step = (ms: number) => {
            const p = clamp((ms - t0) / 1150, 0, 1)
            const e = 1 - Math.pow(1 - p, 4)
            d.textContent = Math.round(end * e).toLocaleString('en-US') + sfx
            if (p < 1) requestAnimationFrame(step)
          }
          d.textContent = '0' + sfx
          requestAnimationFrame(step)
        })
      },
      { rootMargin: '0px 0px -18% 0px' },
    )
    io.observe(statsEl)
  }

  /* ---------------------------------------------------------- the overlay */
  if (!hud) return

  /** the copy column's edges: a label never crosses into the text */
  let keepX = Infinity
  let innerTop = Infinity
  const measure = () => {
    if (!inner) return
    const r = inner.getBoundingClientRect()
    keepX = scene.phone ? Infinity : r.left - 16
    // absolute page position, so the frame loop can place it on screen from
    // the scroll value it is already given — no layout read per frame
    innerTop = r.top + window.scrollY
  }
  measure()
  let rt = 0
  addEventListener('resize', () => {
    clearTimeout(rt)
    rt = window.setTimeout(measure, 200)
  })
  addEventListener('load', measure)

  const TAU = Math.PI * 2
  const PULL = 0.15
  const PX: Vec3 = [1, 0, 0]
  const PZ: Vec3 = [0, 0, 1]
  const N = cities.length
  const SAMPLES = scene.phone ? 16 : 26
  /** the label's own box, so two of them are only dropped when they truly overlap */
  const LABW = scene.phone ? 38 : 96
  const LABH = scene.phone ? 15 : 19
  const R = GLOBE_R
  const px = new Float32Array(N)
  const py = new Float32Array(N)
  const pa = new Float32Array(N)
  const rank = new Float32Array(N)
  const live = new Int32Array(N)
  const mark = new Uint8Array(N)
  const okx = new Float32Array(N)
  const oky = new Float32Array(N)

  /** the great-circle path between two points, clipped where the globe hides it */
  const pathOf = (arc: { at(t: number, s?: number): Vec3 }, dist: number): string => {
    let d = ''
    let pen = false
    for (let i = 0; i <= SAMPLES; i++) {
      const p = arc.at(i / SAMPLES)
      const q = scene.project(p)
      const toward = dist - q.w
      const r2 = p[0] * p[0] + p[1] * p[1] + p[2] * p[2]
      if (!q.visible || (toward < 0 && r2 - toward * toward < R * R * 1.008)) {
        pen = false
        continue
      }
      d += (pen ? 'L' : 'M') + Math.round(q.x) + ' ' + Math.round(q.y)
      pen = true
    }
    return d
  }

  let on = false
  let driven = false
  let hovKey = ''
  const homeArc = new Map<number, Arc>()

  scene.onFrame((f) => {
    const near = 1 - Math.abs(f.morph - 5) * 1.3
    if (near <= 0) {
      if (on) {
        on = false
        hud.classList.remove('on')
        wellStr = 0
        scene.setWell(null)
      }
      return
    }
    if (!on) {
      on = true
      hud.classList.add('on')
      // the frame loop owns the aircraft from here; the CSS fallback stops
      if (!driven) {
        driven = true
        root.classList.add('driven')
      }
    }
    const vis = Math.min(1, near)
    // the sculpture's centre gives the camera distance, so the sphere's own
    // occlusion can be solved exactly — no guessing which side a city is on
    const dist = scene.project([0, 0, 0]).w
    // on a phone the globe owns the top of the screen and the log owns the
    // rest: pins stop where the copy starts
    const keepY = scene.phone ? Math.min(window.innerHeight * 0.46, innerTop - f.scrollY - 12) : Infinity
    const flipAt = keepX === Infinity ? window.innerWidth * 0.58 : keepX - LABW - 30

    /* ---- the well, eased, so the swarm leans into a target and lets go.
       Half strength: the globe should dent toward the city, not tear open. */
    const want = legHover != null ? legs[legHover].at : wellTo
    const k = clamp(f.dt * 5.5, 0, 1)
    if (want) {
      lastWell = want
      wellStr += (PULL - wellStr) * k
      scene.setWell(want, wellStr)
    } else if (wellStr > 0.02 && lastWell) {
      wellStr += (0 - wellStr) * k
      scene.setWell(lastWell, wellStr)
    } else if (wellStr !== 0) {
      wellStr = 0
      scene.setWell(null)
    }

    /* ---- the fifteen cities: every one the globe is not hiding gets its dot,
       and the labels go to whoever fits without covering a nearer one */
    let n = 0
    for (let i = 0; i < N; i++) {
      const c = cities[i]
      if (!c.pin) continue
      const q = scene.project(c.p)
      const facing = (dist - q.w) / R
      const a = vis * smooth(-0.06, 0.4, facing) * (0.5 + 0.5 * q.depth)
      if (!q.visible || a < 0.06 || q.x > keepX || q.y > keepY) continue
      px[i] = q.x
      py[i] = q.y
      pa[i] = a
      // home first, then whatever is lit, then whatever faces us most
      rank[i] = facing + (i === homeIdx ? 4 : 0) + (c.lit ? 2 : 0)
      live[n++] = i
    }
    // nearest first (insertion sort: fifteen items, no allocation)
    for (let a = 1; a < n; a++) {
      const v = live[a]
      let b = a - 1
      while (b >= 0 && rank[live[b]] < rank[v]) {
        live[b + 1] = live[b]
        b--
      }
      live[b + 1] = v
    }
    let placed = 0
    mark.fill(0)
    for (let s = 0; s < n; s++) {
      const i = live[s]
      const c = cities[i]
      const x = px[i]
      const y = py[i]
      const flip = x > flipAt
      // the label's own box, on the side it will actually be drawn
      const x0 = flip ? x - 12 - LABW : x + 12
      let clash = false
      for (let j = 0; j < placed; j++) {
        if (Math.abs(oky[j] - y) < LABH && x0 < okx[j] + LABW + 8 && okx[j] < x0 + LABW + 8) {
          clash = true
          break
        }
      }
      if (!clash) {
        okx[placed] = x0
        oky[placed] = y
        placed++
      }
      mark[i] = 1
      if (flip !== c.flip) {
        c.flip = flip
        c.pin!.classList.toggle('flip', flip)
      }
      if (c.bare !== clash) {
        c.bare = clash
        c.pin!.classList.toggle('bare', clash)
      }
      if (!c.shown) {
        c.shown = true
        c.pin!.style.visibility = 'visible'
      }
      c.pin!.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
      c.pin!.style.opacity = pa[i].toFixed(3)
    }
    // anything the globe is hiding this frame goes away
    for (let i = 0; i < N; i++) {
      const c = cities[i]
      if (mark[i] || !c.shown || !c.pin) continue
      c.shown = false
      c.pin.style.opacity = '0'
      c.pin.style.visibility = 'hidden'
    }

    /* ---- the three flights in the air: thread, aircraft, manifest bar */
    for (let i = 0; i < legs.length; i++) {
      const leg = legs[i]
      const t = scene.reduced ? 0.5 : ((f.time / leg.dur + leg.phase) % 1)
      const p = leg.arc.at(t)
      leg.at[0] = p[0]
      leg.at[1] = p[1]
      leg.at[2] = p[2]
      const d = pathOf(leg.arc, dist)
      leg.glow?.setAttribute('d', d)
      leg.core?.setAttribute('d', d)
      if (leg.bar) leg.bar.style.transform = `scaleX(${t.toFixed(3)})`
      if (!leg.el) continue
      const q = scene.project(p)
      const toward = dist - q.w
      const r2 = p[0] * p[0] + p[1] * p[1] + p[2] * p[2]
      const hidden =
        !q.visible || (toward < 0 && r2 - toward * toward < R * R * 1.008) || q.x > keepX || q.y > keepY
      if (hidden) {
        if (!leg.hidden) {
          leg.hidden = true
          leg.el.style.opacity = '0'
          leg.el.style.visibility = 'hidden'
        }
        continue
      }
      if (leg.hidden) {
        leg.hidden = false
        leg.el.style.visibility = 'visible'
      }
      leg.el.style.transform = `translate3d(${q.x.toFixed(1)}px, ${q.y.toFixed(1)}px, 0)`
      leg.el.style.opacity = (vis * (0.55 + 0.45 * q.depth)).toFixed(3)
    }

    /* ---- the planet turns to face whatever the visitor is looking at.
       The camera's own yaw is read back out of the projection (two probe
       points), so this steers the real camera instead of guessing at it. */
    const aim =
      routeHover != null && flown[routeHover]
        ? (flown[routeHover].arc.at(0.5) as Vec3)
        : aimIdx != null
          ? cities[aimIdx].p
          : null
    if (aim && !scene.reduced) {
      const u = aim
      const ax = dist - scene.project(PX).w
      const az = dist - scene.project(PZ).w
      let d = Math.atan2(u[0], u[2]) - Math.atan2(ax, az)
      d = (((d + Math.PI) % TAU) + TAU) % TAU - Math.PI
      if (Math.abs(d) > 0.045) scene.spin(clamp(d * 34, -9, 9), 0)
    }

    /* ---- the traced thread: a flown leg under the pointer, or the line
       from home to whatever city the visitor is looking at */
    const target = hover ?? pinned
    let key = ''
    let trace: Arc | null = null
    if (routeHover != null && flown[routeHover]) {
      key = 'r' + routeHover
      trace = flown[routeHover].arc
    } else if (target != null && target !== homeIdx) {
      key = 'c' + target
      let a = homeArc.get(target)
      if (!a) {
        a = greatCircle(homeIdx, target)
        homeArc.set(target, a)
      }
      trace = a
    }
    if (key !== hovKey) {
      hovKey = key
      if (!trace) {
        hovGlow?.setAttribute('d', '')
        hovCore?.setAttribute('d', '')
      }
    }
    if (trace) {
      const d = pathOf(trace, dist)
      hovGlow?.setAttribute('d', d)
      hovCore?.setAttribute('d', d)
    }
  })
}
