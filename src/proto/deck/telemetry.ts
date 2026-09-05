/**
 * The top rail. Every value on it is measured on this machine, this load:
 * the real GPU name, the real time to first byte, the real frame time (with
 * a live 60-sample trace), and two real clocks. Nothing here is decorative.
 */

const $ = (id: string) => document.getElementById(id)

export interface Telemetry {
  setRenderer(name: string): void
  frame(ms: number): void
  stop(): void
}

function shortRenderer(raw: string) {
  let s = raw.replace(/ANGLE \(|\)$/g, '').trim()
  // "Apple, ANGLE Metal Renderer: Apple M3 Pro, Unspecified Version"
  const parts = s.split(',').map((x) => x.trim())
  const meat = parts.find((x) => /apple|nvidia|amd|intel|adreno|mali|radeon|geforce|metal/i.test(x))
  if (meat) s = meat
  s = s.replace(/ANGLE Metal Renderer:\s*/i, '').replace(/\s*Unspecified Version\s*/i, '')
  s = s.replace(/\s*\(0x[0-9A-Fa-f]+\)\s*/g, ' ').replace(/\s{2,}/g, ' ').trim()
  return s.length > 30 ? s.slice(0, 29) + '…' : s
}

export function startTelemetry(): Telemetry {
  const elRenderer = $('t-renderer')
  const elTtfb = $('t-ttfb')
  const elFrame = $('t-frame')
  const elLocal = $('t-local')
  const elBkk = $('t-bkk')
  const spark = $('spark') as unknown as SVGSVGElement | null

  // --- time to first byte, straight from the navigation entry
  try {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (nav && elTtfb) elTtfb.textContent = Math.max(0, Math.round(nav.responseStart)) + 'ms'
  } catch {
    if (elTtfb) elTtfb.textContent = 'n/a'
  }

  // --- two clocks
  const fmt = (tz?: string) =>
    new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      ...(tz ? { timeZone: tz } : {}),
    })
  let local: Intl.DateTimeFormat
  let bkk: Intl.DateTimeFormat
  try {
    local = fmt()
    bkk = fmt('Asia/Bangkok')
  } catch {
    local = fmt()
    bkk = fmt()
  }
  const tick = () => {
    const now = new Date()
    if (elLocal) elLocal.textContent = local.format(now)
    if (elBkk) elBkk.textContent = bkk.format(now)
  }
  tick()
  const clock = window.setInterval(tick, 10000)

  // --- frame time trace
  const N = 30
  const buf = new Float32Array(N)
  let n = 0
  let head = 0
  let acc = 0
  let accN = 0
  let lastPaint = 0
  let poly: SVGPolylineElement | null = null

  if (spark) {
    poly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline')
    poly.setAttribute('fill', 'none')
    poly.setAttribute('stroke', 'currentColor')
    poly.setAttribute('stroke-width', '1')
    poly.setAttribute('stroke-linejoin', 'round')
    poly.setAttribute('vector-effect', 'non-scaling-stroke')
    poly.setAttribute('opacity', '0.85')
    spark.appendChild(poly)
  }

  return {
    setRenderer(name: string) {
      if (elRenderer) elRenderer.textContent = shortRenderer(name)
    },
    frame(ms: number) {
      buf[head] = ms
      head = (head + 1) % N
      if (n < N) n++
      acc += ms
      accN++
      const now = performance.now()
      if (now - lastPaint < 320) return
      lastPaint = now
      const avg = acc / Math.max(accN, 1)
      acc = 0
      accN = 0
      if (elFrame) elFrame.textContent = avg.toFixed(1) + 'ms'
      if (!poly) return
      // 0..33ms mapped to the 13px strip, newest on the right
      let d = ''
      for (let i = 0; i < n; i++) {
        const v = buf[(head + N - n + i) % N]
        const x = (i / Math.max(n - 1, 1)) * 74
        const y = 12.4 - Math.min(v, 33) / 33 * 11.4
        d += (i ? ' ' : '') + x.toFixed(1) + ',' + y.toFixed(1)
      }
      poly.setAttribute('points', d)
    },
    stop() {
      clearInterval(clock)
    },
  }
}
