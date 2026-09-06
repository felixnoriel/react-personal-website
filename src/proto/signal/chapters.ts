/**
 * SIGNAL — maps the scroll position to the morph value.
 *
 * Every element with a data-shape attribute is a chapter anchor. Reading
 * down the page, the core holds a chapter's shape while that element is on
 * screen and slides to the next shape in the gap between them. The hero is
 * the implicit first anchor (shape 0).
 */
interface Anchor {
  shape: number
  /** scrollY at which the shape is fully reached */
  start: number
  /** scrollY until which the shape is held */
  end: number
}

let anchors: Anchor[] = []

export function measureChapters() {
  const vh = window.innerHeight
  const y0 = window.scrollY
  const list: Anchor[] = [{ shape: 0, start: -1e9, end: vh * 0.42 }]
  for (const el of Array.from(document.querySelectorAll<HTMLElement>('[data-shape]'))) {
    const shape = Number(el.dataset.shape)
    if (!Number.isFinite(shape)) continue
    const r = el.getBoundingClientRect()
    const top = r.top + y0
    const start = top - vh * 0.62
    const end = Math.max(start, top + r.height - vh * 0.85)
    list.push({ shape, start, end })
  }
  list.sort((a, b) => a.start - b.start)
  anchors = list
}

/** the continuous morph value for a scroll position */
export function morphAt(scrollY: number): number {
  if (!anchors.length) return 0
  for (let i = 0; i < anchors.length; i++) {
    const a = anchors[i]
    const next = anchors[i + 1]
    if (scrollY <= a.end || !next) return a.shape
    if (scrollY < next.start) {
      const t = (scrollY - a.end) / Math.max(1, next.start - a.end)
      return a.shape + (next.shape - a.shape) * t
    }
  }
  return anchors[anchors.length - 1].shape
}

/** which anchor is "current" (its element on screen), for chapter-aware UI */
export function chapterAt(scrollY: number): number {
  let best = anchors[0]?.shape ?? 0
  for (const a of anchors) if (scrollY >= a.start - 1) best = a.shape
  return best
}
