/** SIGNAL shape 1 — the words: the core spells PRODUCT / ENGINEER. */
import { CHUNK, rng } from './index'
import type { ShapeGen } from './index'

/* ------------------------------------------------------------------ *
 * 1 — THE WORDS: "PRODUCT" / "ENGINEER" rasterised, sampled in column
 * order, given a slab of depth so the letterforms are volumes not decals.
 * ------------------------------------------------------------------ */
function rasterColumns(lines: string[], font: string, w: number, h: number): Int16Array | null {
  const cvs = document.createElement('canvas')
  cvs.width = w
  cvs.height = h
  const ctx = cvs.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const lh = h / lines.length
  for (let i = 0; i < lines.length; i++) {
    let size = lh * 0.84
    ctx.font = `800 ${size}px ${font}`
    const target = w * 0.94
    const m = ctx.measureText(lines[i]).width
    if (m > target) {
      size *= target / m
      ctx.font = `800 ${size}px ${font}`
    }
    ctx.fillText(lines[i], w / 2, lh * (i + 0.5))
  }
  const img = ctx.getImageData(0, 0, w, h).data
  let count = 0
  for (let k = 3; k < img.length; k += 4) if (img[k] > 128) count++
  if (count < 400) return null
  const pts = new Int16Array(count * 2)
  let j = 0
  // column-major scan → already sorted left to right
  for (let x = 0; x < w; x++)
    for (let y = 0; y < h; y++)
      if (img[(y * w + x) * 4 + 3] > 128) {
        pts[j++] = x
        pts[j++] = y
      }
  return pts
}

export const words: ShapeGen = function* (out, n, scale, ctx) {
  const font = ctx.font
  const wide = ctx.wordWidth
  const W = 900
  const H = 320
  const pts = rasterColumns(['PRODUCT', 'ENGINEER'], font, W, H)
  const rand = rng(0x9e3779b1)
  yield
  if (!pts) {
    for (let i = 0; i < n; i++) {
      const o = i * 4
      out[o] = (i / n - 0.5) * (wide + 0.4) * scale
      out[o + 1] = (rand() - 0.5) * 0.7 * scale
      out[o + 2] = (rand() - 0.5) * 0.3 * scale
      out[o + 3] = 0.35
      if (i % CHUNK === 0) yield
    }
    return
  }
  const m = pts.length / 2
  const aspect = W / H
  for (let i = 0; i < n; i++) {
    const k = Math.min(m - 1, (((i / n) * m) | 0)) * 2
    const px = pts[k] + rand() - 0.5
    const py = pts[k + 1] + rand() - 0.5
    const o = i * 4
    out[o] = (px / W - 0.5) * wide * scale
    out[o + 1] = -(py / H - 0.5) * (wide / aspect) * scale
    const d = (rand() + rand() + rand() - 1.5) / 1.5
    out[o + 2] = d * 0.5 * scale
    out[o + 3] = 0.2 + (1 - Math.abs(d)) * 0.24
    if (i % CHUNK === 0) yield
  }
}
