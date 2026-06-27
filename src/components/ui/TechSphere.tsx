import { useEffect, useMemo, useRef, useState } from 'react'
import { RotateCw } from 'lucide-react'
import { useFxLevel } from '../../hooks/useFxLevel'

// ============================================================
// TechSphere — a draggable 3D constellation that holds ALL three
// stacks (front end / back end / infrastructure) in one webgl-feeling
// star map, color-coded by domain.
//
// Crisp DOM text + a canvas starfield (no Three.js): the only per-frame
// work is GPU-composited translate3d/opacity writes + a cheap canvas
// pass. Points sit on a Fibonacci sphere, rotate, and project with
// perspective so front words read bigger/brighter.
//
// Interaction:
//   - drag to spin, momentum on release, spin slows while hovering
//   - hover a node → it lifts (scale + halo) and shows years
//   - the filter chips REFORM the sphere: pick a domain and that group
//     re-spreads to fill the whole sphere (positions animate) while the
//     others fade out — so each stack becomes readable on its own.
//   - faint constellation lines link nearby visible nodes.
// Pauses off-screen / tab-hidden / reduced-motion.
// ============================================================

export type SphereWord = { name: string; years?: number; groupId: string; legacy?: boolean }
export type SphereGroup = { id: string; title: string; accent: string; total: number; live: number }

// brightened brand accents per domain (the light-mode vars are too dark
// to glow on near-black). c = solid, glow = text-shadow, soft/edge = chip.
const GCOLOR: Record<string, { c: string; glow: string; soft: string; edge: string }> = {
  accent: { c: 'hsl(322 88% 73%)', glow: 'hsl(322 85% 62% / 0.6)', soft: 'hsl(322 80% 58% / 0.16)', edge: 'hsl(322 84% 66% / 0.5)' },
  lime: { c: 'hsl(79 78% 65%)', glow: 'hsl(79 74% 54% / 0.55)', soft: 'hsl(79 72% 50% / 0.18)', edge: 'hsl(79 74% 58% / 0.45)' },
  electric: { c: 'hsl(214 92% 76%)', glow: 'hsl(214 90% 64% / 0.6)', soft: 'hsl(214 86% 58% / 0.16)', edge: 'hsl(214 90% 68% / 0.5)' },
  amber: { c: 'hsl(40 95% 69%)', glow: 'hsl(40 92% 58% / 0.55)', soft: 'hsl(40 90% 55% / 0.16)', edge: 'hsl(40 94% 62% / 0.45)' },
}
const colorFor = (accent: string) => GCOLOR[accent] ?? GCOLOR.accent

// Concentric shells, like a star's core and layers: infrastructure is the
// dense inner core, back end the middle layer, front end the outer layer —
// which mirrors how the stack physically sits (infra underneath, front end on
// top). Picking a layer pulls it out to fill the whole sphere.
const LAYER: Record<string, number> = { infra: 0.48, backend: 0.73, frontend: 1 }

export function TechSphere({ words, groups }: { words: SphereWord[]; groups: SphereGroup[] }) {
  const { reduceMotion, isMobile } = useFxLevel()
  const hostRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([])
  const [hovered, setHovered] = useState(-1)
  const hoveredRef = useRef(-1)
  // `active` includes hover-preview; `clicked` is the locked-in filter.
  const [active, setActive] = useState('all')
  const activeRef = useRef('all')
  activeRef.current = active
  const clickedRef = useRef('all')

  const accentById = useMemo(() => {
    const m: Record<string, string> = {}
    groups.forEach((g) => (m[g.id] = g.accent))
    return m
  }, [groups])
  // per-word display color (group color, or white while hovered — handled in JSX)
  const wordColors = useMemo(
    () => words.map((w) => colorFor(accentById[w.groupId])),
    [words, accentById],
  )

  useEffect(() => {
    const host = hostRef.current
    const canvas = canvasRef.current
    if (!host || !canvas) return
    const ctx = canvas.getContext('2d')
    const N = words.length

    const fib = (count: number, i: number) => {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / count)
      const theta = Math.PI * (1 + Math.sqrt(5)) * i
      return {
        x: Math.sin(phi) * Math.cos(theta),
        y: Math.sin(phi) * Math.sin(theta),
        z: Math.cos(phi),
      }
    }
    // two layouts per word: the global "all" spread, and a per-group spread
    // (so a group can fill the whole sphere when it's the only one shown).
    const posAll = words.map((_, i) => {
      const p = fib(N, i)
      const L = LAYER[words[i].groupId] ?? 1
      return { x: p.x * L, y: p.y * L, z: p.z * L }
    })
    const posGroup: { x: number; y: number; z: number }[] = new Array(N)
    groups.forEach((g) => {
      const idxs = words.map((w, i) => (w.groupId === g.id ? i : -1)).filter((i) => i >= 0)
      idxs.forEach((gi, li) => (posGroup[gi] = fib(idxs.length, li)))
    })

    // per-word animated state: current base unit pos + visibility (filter fade)
    const base = posAll.map((p) => ({ ...p }))
    const vis = words.map(() => 1)

    const persp = 2.0
    const baseVy = reduceMotion ? 0 : isMobile ? 0.0016 : 0.0022
    let ax = 0.18
    let ay = 0
    let vx = 0
    let vy = baseVy
    let dragging = false
    let lastX = 0
    let lastY = 0
    let radius = 0
    let cssW = 0
    let cssH = 0
    let stars: { x: number; y: number; r: number; a: number; tw: number; warm: boolean }[] = []
    const screen: ({ sx: number; sy: number; depth: number } | null)[] = new Array(N)
    const pointer = { clientX: 0, clientY: 0, present: false }
    const cursor = { cx: 0, cy: 0, inside: false }

    const makeStars = () => {
      const count = isMobile ? 70 : 140
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * cssW,
        y: Math.random() * cssH,
        r: 0.4 + Math.random() * 1.4,
        a: 0.18 + Math.random() * 0.6,
        tw: Math.random() * Math.PI * 2,
        warm: Math.random() < 0.32,
      }))
    }

    const resize = () => {
      const r = host.getBoundingClientRect()
      cssW = r.width
      cssH = r.height
      radius = Math.min(cssW, cssH) * 0.34
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.max(1, Math.floor(cssW * dpr))
      canvas.height = Math.max(1, Math.floor(cssH * dpr))
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      makeStars()
    }

    const drawStars = () => {
      if (!ctx) return
      for (const s of stars) {
        if (!reduceMotion) {
          s.tw += 0.02
          s.x += 0.04
          if (s.x > cssW) s.x = 0
        }
        const tw = reduceMotion ? 0.85 : 0.55 + 0.45 * Math.sin(s.tw)
        const alpha = s.a * tw
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = s.warm ? `rgba(214,182,120,${alpha})` : `rgba(216,222,255,${alpha})`
        ctx.fill()
      }
    }

    const drawLines = () => {
      if (!ctx) return
      const maxDist = radius * 0.6
      ctx.lineWidth = 0.7
      for (let i = 0; i < N; i++) {
        const a = screen[i]
        if (!a) continue
        for (let j = i + 1; j < N; j++) {
          const b = screen[j]
          if (!b) continue
          const dx = a.sx - b.sx
          const dy = a.sy - b.sy
          const d = Math.hypot(dx, dy)
          if (d > maxDist) continue
          const prox = 1 - d / maxDist
          const front = (a.depth + b.depth) / 2
          const alpha = prox * prox * 0.24 * (0.3 + front * 0.7)
          if (alpha < 0.012) continue
          ctx.strokeStyle = `rgba(158,176,236,${alpha.toFixed(3)})`
          ctx.beginPath()
          ctx.moveTo(a.sx, a.sy)
          ctx.lineTo(b.sx, b.sy)
          ctx.stroke()
        }
      }
    }

    const project = () => {
      const act = activeRef.current
      const cosY = Math.cos(ay)
      const sinY = Math.sin(ay)
      const cosX = Math.cos(ax)
      const sinX = Math.sin(ax)
      const hov = hoveredRef.current
      for (let i = 0; i < N; i++) {
        // ease toward the layout + visibility for the current filter
        const isAct = act === 'all' || words[i].groupId === act
        const tp = act !== 'all' && words[i].groupId === act ? posGroup[i] : posAll[i]
        base[i].x += (tp.x - base[i].x) * 0.12
        base[i].y += (tp.y - base[i].y) * 0.12
        base[i].z += (tp.z - base[i].z) * 0.12
        vis[i] += ((isAct ? 1 : 0) - vis[i]) * 0.12

        const el = wordRefs.current[i]
        if (vis[i] < 0.015) {
          if (el) el.style.opacity = '0'
          screen[i] = null
          continue
        }
        const p = base[i]
        const x1 = p.x * cosY - p.z * sinY
        const z1 = p.x * sinY + p.z * cosY
        const y2 = p.y * cosX - z1 * sinX
        const z2 = p.y * sinX + z1 * cosX
        const sc = persp / (persp - z2)
        const tx = x1 * radius * sc
        const ty = y2 * radius * sc
        const depth = (z2 + 1) / 2
        screen[i] = vis[i] > 0.5 ? { sx: cssW / 2 + tx, sy: cssH / 2 + ty, depth } : null
        if (!el) continue
        const isHover = i === hov
        // smaller toward the core (mag = layer radius in "all", → 1 when the
        // layer is pulled out to fill) so the dense inner core stays legible
        const mag = Math.hypot(p.x, p.y, p.z)
        const scale =
          sc * 0.7 * (isHover ? 1.3 : 1) * (words[i].legacy ? 0.92 : 1) * (0.62 + 0.38 * mag)
        el.style.transform = `translate(-50%, -50%) translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`
        const baseOp = (0.2 + depth * 0.8) * (words[i].legacy ? 0.62 : 1)
        el.style.opacity = (baseOp * vis[i]).toFixed(3)
        el.style.zIndex = isHover ? '200' : String(Math.round(depth * 100))
      }
    }

    const pickHover = () => {
      let idx = -1
      if (cursor.inside && !dragging) {
        const rad = 40
        let best = rad * rad
        for (let i = 0; i < N; i++) {
          const s = screen[i]
          if (!s || s.depth < 0.4 || vis[i] < 0.6) continue
          const dx = s.sx - cursor.cx
          const dy = s.sy - cursor.cy
          const d2 = dx * dx + dy * dy
          if (d2 < best) {
            best = d2
            idx = i
          }
        }
      }
      if (idx !== hoveredRef.current) {
        hoveredRef.current = idx
        setHovered(idx)
      }
    }

    let raf = 0
    let paused = false
    const tick = () => {
      raf = requestAnimationFrame(tick)
      if (paused || document.hidden) return
      if (pointer.present) {
        const r = host.getBoundingClientRect()
        cursor.cx = pointer.clientX - r.left
        cursor.cy = pointer.clientY - r.top
        cursor.inside =
          cursor.cx >= 0 && cursor.cx <= r.width && cursor.cy >= 0 && cursor.cy <= r.height
      }
      if (!dragging && !reduceMotion) {
        const target = cursor.inside ? baseVy * 0.12 : baseVy
        ax += vx
        ay += vy
        vx *= 0.94
        vy += (target - vy) * 0.05
        ax = Math.max(-1.25, Math.min(1.25, ax))
      }
      project()
      pickHover()
      if (ctx) ctx.clearRect(0, 0, cssW, cssH)
      drawStars()
      drawLines()
    }

    const onDown = (e: PointerEvent) => {
      dragging = true
      lastX = e.clientX
      lastY = e.clientY
    }
    const onMove = (e: PointerEvent) => {
      pointer.clientX = e.clientX
      pointer.clientY = e.clientY
      pointer.present = true
      if (!dragging) return
      const dvy = (e.clientX - lastX) * 0.006
      const dvx = (e.clientY - lastY) * 0.006
      lastX = e.clientX
      lastY = e.clientY
      ay += dvy
      ax = Math.max(-1.25, Math.min(1.25, ax + dvx))
      vy = dvy
      vx = dvx
    }
    const onUp = () => {
      dragging = false
    }
    const onLeave = () => {
      pointer.present = false
      cursor.inside = false
    }

    resize()
    project()
    if (ctx) ctx.clearRect(0, 0, cssW, cssH)
    drawStars()
    drawLines()
    const ro = new ResizeObserver(resize)
    ro.observe(host)
    const io = new IntersectionObserver(([e]) => (paused = !e.isIntersecting), {
      rootMargin: '120px',
    })
    io.observe(host)
    host.addEventListener('pointerdown', onDown)
    host.addEventListener('pointerleave', onLeave)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      host.removeEventListener('pointerdown', onDown)
      host.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [reduceMotion, isMobile, words, groups])

  const chips: { id: string; title: string; color: string; soft: string; edge: string; sub?: string }[] = [
    { id: 'all', title: 'All', color: 'rgba(244,247,255,0.92)', soft: 'hsl(0 0% 100% / 0.08)', edge: 'hsl(0 0% 100% / 0.22)', sub: String(words.length) },
    ...groups.map((g) => {
      const c = colorFor(g.accent)
      return { id: g.id, title: g.title, color: c.c, soft: c.soft, edge: c.edge, sub: `${g.live}/${g.total}` }
    }),
  ]

  return (
    <div
      ref={hostRef}
      className="relative h-[440px] md:h-[520px] rounded-2xl overflow-hidden border border-ink/10 cursor-grab active:cursor-grabbing touch-pan-y select-none"
      style={{
        background: 'radial-gradient(125% 100% at 50% 32%, hsl(253 38% 14%), hsl(253 46% 6%) 68%)',
        boxShadow: 'inset 0 0 90px hsl(253 60% 3% / 0.7), 0 26px 64px -30px hsl(var(--ink) / 0.5)',
      }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />

      {/* domain filter — hover to preview, click to lock; reforms the sphere */}
      <div className="absolute top-0 inset-x-0 z-20 flex flex-wrap items-center gap-1.5 px-3.5 py-3">
        {chips.map((ch) => {
          const isActive = active === ch.id
          return (
            <button
              key={ch.id}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => {
                clickedRef.current = ch.id
                setActive(ch.id)
              }}
              onMouseEnter={() => setActive(ch.id)}
              onMouseLeave={() => setActive(clickedRef.current)}
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] tracking-wide transition-colors"
              style={
                isActive
                  ? { color: ch.color, background: ch.soft, borderColor: ch.edge, boxShadow: `0 0 18px -6px ${ch.color}` }
                  : { color: 'hsl(0 0% 100% / 0.5)', background: 'hsl(0 0% 100% / 0.03)', borderColor: 'hsl(0 0% 100% / 0.1)' }
              }
            >
              {ch.id !== 'all' && (
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: ch.color, boxShadow: isActive ? `0 0 6px ${ch.color}` : undefined }}
                />
              )}
              <span>{ch.title}</span>
              {ch.sub && <span className="opacity-60">{ch.sub}</span>}
            </button>
          )
        })}
      </div>

      {/* words */}
      <div className="absolute inset-0" aria-hidden>
        {words.map((w, i) => {
          const c = wordColors[i]
          const isHover = hovered === i
          return (
            <span
              key={`${w.groupId}-${w.name}`}
              ref={(el) => {
                wordRefs.current[i] = el
              }}
              className="absolute left-1/2 top-1/2 font-display font-bold whitespace-nowrap"
              style={{
                fontSize: 'clamp(0.85rem, 1.35vw, 1.3rem)',
                color: isHover ? '#fff' : c.c,
                textShadow: isHover ? `0 0 16px ${c.glow}, 0 0 5px rgba(255,255,255,0.55)` : `0 0 11px ${c.glow}`,
                filter: isHover ? 'drop-shadow(0 0 10px rgba(255,255,255,0.7))' : undefined,
                willChange: 'transform, opacity',
              }}
            >
              {w.name}
              {isHover && w.years != null && (
                <span className="ml-1.5 align-middle font-mono text-[0.58em] font-normal opacity-75">
                  {w.years}y
                </span>
              )}
            </span>
          )
        })}
      </div>

      {/* hint */}
      <div className="pointer-events-none absolute bottom-3 left-4 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">
        drag to spin · hover a node · pick a domain
        <RotateCw className="h-3 w-3" />
      </div>

      {/* a11y — decorative; expose the stacks as plain text */}
      <span className="sr-only">
        {groups
          .map(
            (g) =>
              `${g.title}: ${words
                .filter((w) => w.groupId === g.id)
                .map((w) => w.name + (w.years != null ? ` (${w.years} years)` : ''))
                .join(', ')}`,
          )
          .join('. ')}
        .
      </span>
    </div>
  )
}
