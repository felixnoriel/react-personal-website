/**
 * Blog titles and excerpts come out of the old CMS carrying HTML entities
 * (&#8211; for an en dash, &#8217; for an apostrophe). They are printed as
 * plain text, so they are decoded here rather than injected as HTML.
 *
 * Plain string work on purpose: every page is rendered to HTML at build time
 * where there is no DOM, and a decoder that only worked in the browser would
 * make the two renders disagree and break hydration.
 */
const NAMED: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00a0',
  hellip: '…',
  ndash: '–',
  mdash: '—',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
}

export function decodeEntities(s: string): string {
  if (!s.includes('&')) return s
  return s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (whole, body: string) => {
    if (body[0] === '#') {
      const code = body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10)
      return Number.isFinite(code) ? String.fromCodePoint(code) : whole
    }
    return NAMED[body.toLowerCase()] ?? whole
  })
}
