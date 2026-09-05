/**
 * Highlight ink - the Custom Highlight API, shared by every search field on
 * the site (the sheet index's filter today, the writing index tomorrow).
 *
 * As the visitor types, every matching phrase in the live page is inked. The
 * API styles arbitrary Range objects straight from script, so there is no
 * <mark> wrapper, no DOM mutation and therefore no possibility of layout
 * shift - and it inks across element boundaries, which a wrapper cannot.
 * Where the API is missing the whole feature is skipped and the field still
 * filters, so nothing depends on it.
 *
 * Budget, so a fast typist can never make it expensive: a three-character
 * floor, a 120ms debounce, and at most 300 ranges per pass.
 */

/** The highlight the sheet index paints under. Named in CSS as ::highlight(). */
export const SHEET_FIND = 'sheet-find'

const MIN_CHARS = 3
const MAX_RANGES = 300
const DEBOUNCE_MS = 120

/** Text that is in the DOM but is not page copy. */
const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE'])

const timers = new Map<string, number>()

/** Cross-engine since Firefox 140, but never assumed: everything is behind this. */
function supported(): boolean {
  return typeof CSS !== 'undefined' && 'highlights' in CSS
}

function collect(root: Element, needle: string): Range[] {
  const ranges: Range[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let node = walker.nextNode()

  while (node && ranges.length < MAX_RANGES) {
    const text = node.nodeValue
    const parent = node.parentElement
    if (text && parent && !SKIP.has(parent.tagName)) {
      const hay = text.toLowerCase()
      let from = hay.indexOf(needle)
      while (from !== -1 && ranges.length < MAX_RANGES) {
        const range = document.createRange()
        range.setStart(node, from)
        range.setEnd(node, from + needle.length)
        ranges.push(range)
        from = hay.indexOf(needle, from + needle.length)
      }
    }
    node = walker.nextNode()
  }

  return ranges
}

/** Paint now. Returns how many phrases were inked. */
function paint(name: string, query: string, root: Element | null): number {
  if (!supported()) return 0
  const needle = query.trim().toLowerCase()
  if (!root || needle.length < MIN_CHARS) {
    CSS.highlights.delete(name)
    return 0
  }
  const ranges = collect(root, needle)
  if (ranges.length === 0) {
    CSS.highlights.delete(name)
    return 0
  }
  CSS.highlights.set(name, new Highlight(...ranges))
  return ranges.length
}

/**
 * Ink every occurrence of `query` inside `root`, debounced by 120ms so a
 * keystroke costs one keystroke. Anything under three characters clears.
 */
export function inkMatches(name: string, query: string, root: Element | null): void {
  if (typeof window === 'undefined' || !supported()) return
  const pending = timers.get(name)
  if (pending !== undefined) window.clearTimeout(pending)
  timers.set(
    name,
    window.setTimeout(() => {
      timers.delete(name)
      paint(name, query, root)
    }, DEBOUNCE_MS),
  )
}

/** Drop the ink and any pending pass. Safe to call when nothing is inked. */
export function clearInk(name: string): void {
  if (typeof window === 'undefined') return
  const pending = timers.get(name)
  if (pending !== undefined) {
    window.clearTimeout(pending)
    timers.delete(name)
  }
  if (supported()) CSS.highlights.delete(name)
}
