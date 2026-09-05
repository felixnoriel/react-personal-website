/**
 * LUMEN — the DOM side: the terminal that types, the numbers that count and
 * the instrument readout. Nothing here ever changes a box: the terminal lines
 * are sized by an invisible full-text ghost and the numbers lock their width
 * before the first tick, so the layout cannot shift.
 */

/**
 * Splits a line into one span per character, so revealing them can never
 * re-wrap the line. Every character keeps its box from the first paint;
 * typing only flips visibility.
 */
function splitChars(el: Element): HTMLElement[] {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  const texts: Text[] = []
  let n = walker.nextNode() as Text | null
  while (n) {
    texts.push(n)
    n = walker.nextNode() as Text | null
  }
  const out: HTMLElement[] = []
  for (const t of texts) {
    const frag = document.createDocumentFragment()
    for (const ch of t.data) {
      const s = document.createElement('span')
      s.className = 'ch'
      s.textContent = ch
      frag.appendChild(s)
      out.push(s)
    }
    t.replaceWith(frag)
  }
  return out
}

/** Types the terminal in, character by character, over about 1.2 s. */
export function typeTerminal(root: HTMLElement, done?: () => void) {
  const lines = Array.from(root.querySelectorAll<HTMLElement>('.ink')).map(splitChars)
  document.documentElement.classList.add('fx-typing')

  const RATE = 205 // characters per second
  const GAP = 0.085 // pause between lines, seconds
  let li = 0
  let shown = 0
  let cut = 0
  let last = performance.now()

  const step = (now: number) => {
    const dt = Math.min(0.1, (now - last) / 1000)
    last = now
    if (li >= lines.length) {
      document.documentElement.classList.add('fx-typed')
      done?.()
      return
    }
    shown += dt * RATE
    const line = lines[li]
    const target = Math.max(0, Math.min(line.length, Math.floor(shown)))
    for (; cut < target; cut++) line[cut].classList.add('on')
    if (shown >= line.length) {
      li++
      cut = 0
      shown = -GAP * RATE
    }
    requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 4)

/** Counts the four real impact numbers up once. Width is locked first. */
export function countMetrics(reduced: boolean) {
  const cells = Array.from(document.querySelectorAll<HTMLElement>('.val[data-count]'))
  for (const el of cells) {
    const w = el.getBoundingClientRect().width
    if (w > 0) el.style.minWidth = `${Math.ceil(w)}px`
  }
  document.querySelectorAll<HTMLElement>('.bar span').forEach((s, i) => {
    setTimeout(() => (s.style.width = s.dataset.w || '0%'), reduced ? 0 : 260 + i * 90)
  })
  if (reduced) return

  const start = performance.now()
  const DUR = 1250
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / DUR)
    const e = easeOut(t)
    for (const el of cells) {
      const target = parseFloat(el.dataset.count || '0')
      const dec = parseInt(el.dataset.dec || '0', 10)
      el.textContent = (target * e).toFixed(dec) + (el.dataset.suffix || '')
    }
    if (t < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

/** The readout only ever prints things that were actually measured. */
export class Readout {
  private tierEl = document.getElementById('ro-tier')!
  private gpuEl = document.getElementById('ro-gpu')!
  private gridEl = document.getElementById('ro-grid')!
  private perfEl = document.getElementById('ro-perf')!
  private frames = 0
  private acc = 0
  private fps = 0
  private paint = 0
  private note = ''

  constructor() {
    this.readPaint()
    try {
      // The paint entry can land after the readout has already printed a line
      // (it always does on the CSS tier, which prints once and never ticks),
      // so every update re-renders whatever the readout is currently saying.
      new PerformanceObserver((list) => {
        const e = list.getEntries()
        if (e.length) {
          this.paint = Math.round(e[e.length - 1].startTime)
          this.render()
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true })
    } catch {
      /* no LCP observer: the FCP number stands */
    }
  }

  /** The first paint, straight from the paint timeline. Never a guess. */
  private readPaint() {
    const fcp = performance.getEntriesByName('first-contentful-paint')[0]
    if (fcp) this.paint = Math.round(fcp.startTime)
  }

  private render() {
    if (!this.note && !this.fps) return
    if (!this.paint) this.readPaint()
    // a number that was never measured is never printed
    const head = this.paint ? `paint ${this.paint} ms · ` : ''
    this.perfEl.textContent = head + (this.note || `${this.fps} fps`)
  }

  setTier(tier: string, gpu: string, grid: [number, number]) {
    this.tierEl.textContent = `lumen · ${tier}`
    this.gpuEl.textContent = gpu
    this.gridEl.textContent = grid[0] && grid[1] ? ` · ${grid[0]}×${grid[1]} cells` : ''
  }

  tick(dt: number) {
    this.frames++
    this.acc += dt
    if (this.acc >= 0.5) {
      this.fps = Math.round(this.frames / this.acc)
      this.frames = 0
      this.acc = 0
      this.note = ''
      this.render()
    }
  }

  still(note: string) {
    this.note = note
    this.render()
  }

  get frameRate() {
    return this.fps
  }
}
