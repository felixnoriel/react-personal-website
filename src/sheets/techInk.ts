/**
 * Tech ink - the third device, and it has no motion at all.
 *
 * Hover or focus a technology on a career row and every OTHER place that
 * technology appears in the section inks itself: the same tag three rows down,
 * the mention inside an outcome line. It answers a question the section
 * otherwise cannot ("where have I used Go?").
 *
 * It is the CSS Custom Highlight API: arbitrary Range objects styled from
 * script with no DOM mutation and no wrapper elements, so it is structurally
 * incapable of shifting the page. The ranges are built once on idle; hovering
 * costs one CSS.highlights.set.
 *
 * The whole feature sits behind `highlights in CSS`. Where it is missing,
 * nothing happens and nothing is missing from the page.
 */

const HIGHLIGHT = 'tech-ink'
/** ranges are cheap, but a runaway scan is not: stop at 300 */
const RANGE_CAP = 300

export interface TechInk {
  /** ink every occurrence of `name` except the ones inside `exclude` */
  ink(name: string | null, exclude?: Element | null): void
  destroy(): void
}

const NOOP: TechInk = { ink: () => {}, destroy: () => {} }

type HighlightCtor = new (...ranges: Range[]) => object
interface Registry {
  set(name: string, highlight: object): void
  delete(name: string): boolean
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export function initTechInk(root: HTMLElement, names: string[]): TechInk {
  if (typeof window === 'undefined' || !('highlights' in CSS)) return NOOP
  const Ctor = (window as unknown as { Highlight?: HighlightCtor }).Highlight
  const registry = (CSS as unknown as { highlights?: Registry }).highlights
  if (!Ctor || !registry) return NOOP

  // longest first, so "React Native" wins over "React" at the same position
  const terms = [...new Set(names.map((n) => n.trim()).filter(Boolean))].sort((a, b) => b.length - a.length)
  if (terms.length === 0) return NOOP

  // a name only counts as itself: "Node" must not ink half of "Node.js"
  const re = new RegExp(`(?<![\\w.+#-])(${terms.map(escapeRe).join('|')})(?![\\w.+#-])`, 'gi')

  const ranges = new Map<string, Range[]>()
  let total = 0
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node && total < RANGE_CAP; node = walker.nextNode()) {
    const text = node.nodeValue
    if (!text) continue
    re.lastIndex = 0
    let m = re.exec(text)
    while (m && total < RANGE_CAP) {
      const range = document.createRange()
      range.setStart(node, m.index)
      range.setEnd(node, m.index + m[1].length)
      const key = m[1].toLowerCase()
      const found = ranges.get(key)
      if (found) found.push(range)
      else ranges.set(key, [range])
      total += 1
      m = re.exec(text)
    }
  }

  const clear = () => registry.delete(HIGHLIGHT)

  return {
    ink(name, exclude) {
      if (!name) {
        clear()
        return
      }
      const all = ranges.get(name.trim().toLowerCase())
      const use = all && exclude ? all.filter((r) => !exclude.contains(r.startContainer)) : all
      if (!use || use.length === 0) {
        clear()
        return
      }
      registry.set(HIGHLIGHT, new Ctor(...use))
    },
    destroy: clear,
  }
}
