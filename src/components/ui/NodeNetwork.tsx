import { useEffect, useRef } from 'react'

interface NodeNetworkProps {
  className?: string
  density?: number
  linkDistance?: number
  color?: string
  accentColor?: string
  mouseRadius?: number
}

type Node = {
  x: number
  y: number
  vx: number
  vy: number
}

type Pulse = {
  a: number
  b: number
  t: number
  speed: number
}

export function NodeNetwork({
  className = '',
  density = 0.00008,
  linkDistance = 140,
  color = 'hsl(199 16% 48%)',
  accentColor = 'hsl(325 58% 34%)',
  mouseRadius = 160,
}: NodeNetworkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | null>(null)
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -9999,
    y: -9999,
    active: false,
  })

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = 0
    let height = 0
    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    const nodes: Node[] = []
    const pulses: Pulse[] = []

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      width = parent.clientWidth
      height = parent.clientHeight
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const target = Math.max(24, Math.min(80, Math.round(width * height * density)))
      while (nodes.length < target) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
        })
      }
      while (nodes.length > target) nodes.pop()
    }

    resize()

    const ro = new ResizeObserver(resize)
    if (canvas.parentElement) ro.observe(canvas.parentElement)

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current.x = e.clientX - rect.left
      mouseRef.current.y = e.clientY - rect.top
      mouseRef.current.active = true
    }
    const onLeave = () => {
      mouseRef.current.active = false
      mouseRef.current.x = -9999
      mouseRef.current.y = -9999
    }

    const host = canvas.parentElement ?? canvas
    host.addEventListener('mousemove', onMove)
    host.addEventListener('mouseleave', onLeave)

    let lastPulse = 0

    const frame = (t: number) => {
      ctx.clearRect(0, 0, width, height)

      // integrate nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]
        // gentle drift
        n.x += n.vx
        n.y += n.vy

        // mouse influence — push away smoothly
        if (mouseRef.current.active) {
          const dx = n.x - mouseRef.current.x
          const dy = n.y - mouseRef.current.y
          const d2 = dx * dx + dy * dy
          const r2 = mouseRadius * mouseRadius
          if (d2 < r2 && d2 > 0.1) {
            const d = Math.sqrt(d2)
            const force = (1 - d / mouseRadius) * 0.6
            n.vx += (dx / d) * force * 0.08
            n.vy += (dy / d) * force * 0.08
          }
        }

        // damping
        n.vx *= 0.985
        n.vy *= 0.985

        // wrap around edges
        if (n.x < -10) n.x = width + 10
        if (n.x > width + 10) n.x = -10
        if (n.y < -10) n.y = height + 10
        if (n.y > height + 10) n.y = -10
      }

      // draw links
      ctx.lineWidth = 1
      const link2 = linkDistance * linkDistance
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d2 = dx * dx + dy * dy
          if (d2 < link2) {
            const alpha = (1 - d2 / link2) * 0.45
            ctx.strokeStyle = color
            ctx.globalAlpha = alpha
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }
      ctx.globalAlpha = 1

      // emit pulses occasionally
      if (t - lastPulse > 900 && nodes.length > 4 && pulses.length < 10) {
        lastPulse = t
        const a = Math.floor(Math.random() * nodes.length)
        let b = Math.floor(Math.random() * nodes.length)
        // prefer near neighbour
        let best = b
        let bestD = Infinity
        for (let k = 0; k < 6; k++) {
          const cand = Math.floor(Math.random() * nodes.length)
          if (cand === a) continue
          const dx = nodes[a].x - nodes[cand].x
          const dy = nodes[a].y - nodes[cand].y
          const d2 = dx * dx + dy * dy
          if (d2 < bestD) {
            bestD = d2
            best = cand
          }
        }
        b = best
        if (a !== b && bestD < link2 * 4) {
          pulses.push({ a, b, t: 0, speed: 0.008 + Math.random() * 0.008 })
        }
      }

      // update + draw pulses
      for (let k = pulses.length - 1; k >= 0; k--) {
        const p = pulses[k]
        p.t += p.speed
        if (p.t >= 1) {
          pulses.splice(k, 1)
          continue
        }
        const a = nodes[p.a]
        const b = nodes[p.b]
        if (!a || !b) {
          pulses.splice(k, 1)
          continue
        }
        const x = a.x + (b.x - a.x) * p.t
        const y = a.y + (b.y - a.y) * p.t
        // trail
        const trail = 0.18
        const tx = a.x + (b.x - a.x) * Math.max(0, p.t - trail)
        const ty = a.y + (b.y - a.y) * Math.max(0, p.t - trail)
        const grad = ctx.createLinearGradient(tx, ty, x, y)
        grad.addColorStop(0, 'transparent')
        grad.addColorStop(1, accentColor)
        ctx.strokeStyle = grad
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(tx, ty)
        ctx.lineTo(x, y)
        ctx.stroke()
        ctx.fillStyle = accentColor
        ctx.beginPath()
        ctx.arc(x, y, 2, 0, Math.PI * 2)
        ctx.fill()
      }

      // draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]
        let r = 1.6
        let fill = color
        if (mouseRef.current.active) {
          const dx = n.x - mouseRef.current.x
          const dy = n.y - mouseRef.current.y
          const d2 = dx * dx + dy * dy
          if (d2 < mouseRadius * mouseRadius) {
            const t2 = 1 - d2 / (mouseRadius * mouseRadius)
            r = 1.6 + t2 * 2.4
            fill = accentColor
          }
        }
        ctx.fillStyle = fill
        ctx.beginPath()
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(frame)
    }
    rafRef.current = requestAnimationFrame(frame)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      ro.disconnect()
      host.removeEventListener('mousemove', onMove)
      host.removeEventListener('mouseleave', onLeave)
    }
  }, [density, linkDistance, color, accentColor, mouseRadius])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`absolute inset-0 pointer-events-none ${className}`}
    />
  )
}
