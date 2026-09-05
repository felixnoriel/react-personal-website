/**
 * LUMEN — shared state, palette and geometry for the light hero.
 *
 * One canvas sits behind every DOM node and paints five things in a single
 * pass: the luminous medium, the caustics it throws on the paper, the glass
 * panels, the glass headline, and the pointer lens. The DOM keeps the text
 * (real, selectable, in the a11y tree); the GPU keeps the light.
 */

/* ---- palette: the site's own HSL tokens, resolved to sRGB 0..1 ---- */
export const PAPER = [0.9644, 0.972, 0.948] as const // 79 30% 96%
export const VIOLET = [0.5372, 0.1428, 0.3729] as const // 325 58% 34%
export const BLUE = [0.2184, 0.3444, 0.5616] as const // 218 44% 39%
export const LIME = [0.6094, 0.712, 0.388] as const // 79 36% 55%
export const INDIGO = [0.3089, 0.2546, 0.5054] as const // 253 33% 38%

export type Tier = 'webgpu' | 'webgl' | 'css'

/* ---- render uniform block (floats). Shared by the WGSL and GLSL paths. ---- */
export const R = {
  res: 0, // vec2  canvas backing px
  inv: 2, // vec2  1/res
  time: 4,
  boot: 5, // 0..1 the light arriving
  lensOn: 6,
  maskFade: 7,
  lens: 8, // vec2 backing px
  lensR: 10,
  reduced: 11,
  mask: 12, // vec4 x,y,w,h backing px
  pulses: 16, // 3 x vec4 (x, y, age, amp)
  panels: 28, // 4 x vec4 (x, y, w, h)
  panelR: 44, // vec4 radius per panel
  glass: 48, // 0..1 glass fade-in
  grain: 49,
  scale: 50, // backing px per CSS px
  aspect: 51,
  grid: 52, // vec2 sim cells — the render stencil must step in CELLS, not pixels
  SIZE: 64,
} as const

/* ---- sim uniform block ---- */
export const S = {
  grid: 0, // vec2
  inv: 2, // vec2
  dt: 4,
  time: 5,
  boot: 6,
  decay: 7,
  grav: 8, // vec2
  ambient: 10,
  aspect: 11,
  splats: 12, // 4 x vec4 (x, y, radius, strength) — x,y in 0..1
  svel: 28, // 4 x vec4 (vx, vy, colourMix, dyeAmount)
  pulse: 44, // vec4 (x, y, amplitude, radius) — the click shockwave
  clear: 48, // vec4 (centre y, half h, centre x, half w) — the headline's clean paper
  SIZE: 52,
} as const

export const MAX_SPLATS = 4
export const MAX_PULSES = 3
export const MAX_PANELS = 4

export interface Splat {
  x: number
  y: number
  r: number
  strength: number
  vx: number
  vy: number
  mix: number
  dye: number
}

/** A critically damped spring — the lens has mass, so it lags and settles. */
export class Spring {
  v = 0
  value: number
  private stiffness: number
  private damping: number
  constructor(value: number, stiffness = 170, damping = 22) {
    this.value = value
    this.stiffness = stiffness
    this.damping = damping
  }
  step(target: number, dt: number) {
    const d = Math.min(dt, 1 / 30)
    const a = (target - this.value) * this.stiffness - this.v * this.damping
    this.v += a * d
    this.value += this.v * d
    return this.value
  }
}

/** Reads a CSS-pixel rect for every element the canvas must render as glass. */
export function measurePanels(scale: number) {
  const out: { rect: DOMRect; radius: number }[] = []
  document.querySelectorAll<HTMLElement>('[data-glass]').forEach((el) => {
    if (out.length >= MAX_PANELS) return
    const rect = el.getBoundingClientRect()
    if (rect.width < 2 || rect.height < 2) return
    const cs = getComputedStyle(el)
    const radius = parseFloat(cs.borderTopLeftRadius) || 20
    out.push({ rect, radius: radius * scale })
  })
  return out
}

/**
 * Builds the headline coverage mask: the exact glyph shapes of the two
 * headline lines, drawn once into an offscreen canvas in the same face, at
 * the same size and the same place they occupy in the layout.
 *
 * R = hard coverage, G = 3px blur (the bevel), B = 9px blur (the caustic
 * halo). Pre-blurring on the CPU keeps the fragment shader to four taps.
 */
export function buildHeadlineMask(scale: number): { canvas: HTMLCanvasElement; rect: DOMRect } | null {
  const els = [document.getElementById('head'), document.getElementById('sub')].filter(Boolean) as HTMLElement[]
  if (!els.length) return null

  const pad = 46
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity
  const lines: { text: string; cs: CSSStyleDeclaration; rect: DOMRect }[] = []
  for (const el of els) {
    const rect = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    lines.push({ text: el.textContent || '', cs, rect })
    x0 = Math.min(x0, rect.left)
    y0 = Math.min(y0, rect.top)
    x1 = Math.max(x1, rect.right)
    y1 = Math.max(y1, rect.bottom)
  }
  x0 -= pad
  y0 -= pad
  x1 += pad
  y1 += pad
  const w = Math.max(8, Math.ceil((x1 - x0) * scale))
  const h = Math.max(8, Math.ceil((y1 - y0) * scale))

  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  if (!ctx) return null
  ctx.scale(scale, scale)
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'

  const paint = () => {
    for (const l of lines) {
      const size = parseFloat(l.cs.fontSize)
      const lh = parseFloat(l.cs.lineHeight) || size * 1.2
      ctx.font = `${l.cs.fontWeight} ${size}px ${l.cs.fontFamily}`
      // letter-spacing on the 2D context is supported in every engine we
      // target; where it is missing the glyphs still land, just a hair wider
      try {
        ctx.letterSpacing = l.cs.letterSpacing
      } catch {
        /* older engine: ignore */
      }
      const m = ctx.measureText(l.text)
      const asc = m.fontBoundingBoxAscent || size * 0.98
      const desc = m.fontBoundingBoxDescent || size * 0.29
      // CSS half-leading: the baseline sits (lineHeight - contentHeight)/2 +
      // ascent below the top of the line box
      const baseline = l.rect.top - y0 + (lh - (asc + desc)) / 2 + asc
      ctx.fillText(l.text, l.rect.left - x0, baseline)
    }
  }

  // Three coverages in three channels, blurred by the compositor rather than
  // by a JavaScript loop: R = the glyph itself, G = the bevel, B = the halo
  // the letters throw on the paper. Drawing onto an opaque ground keeps the
  // channels independent of alpha.
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, w / scale, h / scale)
  ctx.globalCompositeOperation = 'lighter'
  const canFilter = 'filter' in ctx

  ctx.fillStyle = '#ff0000'
  paint()
  ctx.fillStyle = '#00ff00'
  if (canFilter) ctx.filter = `blur(${(3 * scale).toFixed(2)}px)`
  paint()
  ctx.fillStyle = '#0000ff'
  if (canFilter) ctx.filter = `blur(${(11 * scale).toFixed(2)}px)`
  paint()
  if (canFilter) ctx.filter = 'none'

  const rect = new DOMRect(x0, y0, x1 - x0, y1 - y0)
  return { canvas: c, rect }
}

/** Sim grid: keeps the viewport's aspect at a fixed cell budget. */
export function simGrid(aspect: number, budget: number) {
  const w = Math.round(Math.sqrt(budget * aspect))
  const h = Math.round(w / aspect)
  return [Math.max(48, w), Math.max(48, h)] as const
}
