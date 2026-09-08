/**
 * WRITING — the static markup (rendered at build time, so every title, date,
 * excerpt and number is real HTML at first paint).
 *
 * All eighteen dispatches: the newest as a feature, the other seventeen as a
 * two-column log. Titles and excerpts arrive from WordPress with numeric HTML
 * entities baked in (`&#8211;`, `&#038;`, `&#8217;`) — they are decoded here
 * and re-escaped once, so the page shows an en dash and not its code.
 *
 * Each card carries data-i: its lane in the stream sculpture. writing.ts uses
 * that to light the matching thread, and shapes/stream.ts hangs the same
 * eighteen knots from the same word counts.
 */
import { blogPosts } from '../../shared/data'
import { SECTIONS } from '../../shared/content'
import { LANE_WORDS, laneWeight } from '../shapes/stream'

/* ------------------------------------------------------------------ text */

const NAMED: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…',
  mdash: '—', ndash: '–', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', deg: '°',
}
/** WordPress leaves numeric entities in the exported titles; turn them back into text */
function decode(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => NAMED[String(n).toLowerCase()] ?? m)
}
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
/** decode once, escape once: what the reader sees is the real character */
const T = (s: string) => esc(decode(s))

/* ------------------------------------------------------------------ facts */

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
/** parse the stored stamp by hand: no timezone in the string, so no drift */
function parts(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  return m ? { y: m[1], mo: Number(m[2]), d: Number(m[3]), iso: `${m[1]}-${m[2]}-${m[3]}` } : null
}
const shown = (iso: string) => {
  const p = parts(iso)
  return p ? `${p.d} ${MON[p.mo - 1]} ${p.y}` : iso
}
const words = (html: string) =>
  html.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').split(/\s+/).filter(Boolean).length
const mins = (w: number) => Math.max(1, Math.round(w / 200))
const group = (v: number) => v.toLocaleString('en-US')

/** newest first — the order the lanes, the labels and the cards all share */
const POSTS = [...blogPosts].sort(
  (a, b) => (parts(b.publishedDate)?.iso ?? '').localeCompare(parts(a.publishedDate)?.iso ?? '') ||
    b.publishedDate.localeCompare(a.publishedDate),
)

/* --------------------------------------------------------------- the plate */

/** a stable 0..1 from the slug, so every dispatch gets the same cover every build */
function hash(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h / 4294967296
}
const PAIRS = [
  ['--electric', '--indigo'],
  ['--indigo', '--magenta'],
  ['--magenta', '--electric'],
  ['--electric', '--lime'],
  ['--indigo', '--electric'],
]

/**
 * The cover: a contour plate drawn from the post's own slug, with the real
 * photograph laid over it.
 *
 * The plate is not a placeholder — it is what the card falls back to. The
 * originals sit on an S3 bucket that answers "AccessDenied" to every request
 * from outside production (checked 2026-09-06 in curl and in Chrome); the page
 * shell rewrites each <img> whose URL is in the generated manifest into a
 * sized, lazy AVIF/WebP <picture> served from this site, and writing.ts marks
 * the plate if one ever fails anyway. Either way the box is fixed by
 * aspect-ratio, so nothing can move.
 */
function plate(
  i: number,
  post: { slug: string; image?: { url?: string; alt?: string; width?: number; height?: number } },
  ar: string,
  sizes: string,
) {
  const h = hash(post.slug)
  const [c1, c2] = PAIRS[Math.floor(h * PAIRS.length) % PAIRS.length]
  const style = [
    `--ar:${ar}`,
    `--c1:var(${c1})`,
    `--c2:var(${c2})`,
    `--a:${Math.round(90 + h * 180)}deg`,
    `--cx:${Math.round(18 + h * 64)}%`,
    `--cy:${Math.round(24 + ((h * 7) % 1) * 58)}%`,
  ].join(';')
  const im = post.image
  const photo = im?.url
    ? `<img class="wr-photo" src="${esc(im.url)}" alt="" width="${im.width ?? 768}" height="${
        im.height ?? 432
      }" sizes="${sizes}" loading="lazy" decoding="async" />`
    : ''
  return `<span class="wr-plate" style="${style}">${photo}<b class="wr-pn mono">${String(i + 1).padStart(
    2,
    '0',
  )}</b></span>`
}

/* -------------------------------------------------------------------- html */

export function render(): string {
  const c = SECTIONS.writing

  const rows = POSTS.map((p, i) => ({
    p,
    i,
    w: words(p.content),
    date: shown(p.publishedDate),
    day: parts(p.publishedDate)?.iso ?? '',
  }))

  // the sculpture keeps its own copy of these counts; say so loudly if they drift
  const drift = rows.some((r) => r.w !== LANE_WORDS[r.i])
  if (drift || rows.length !== LANE_WORDS.length) {
    console.warn(
      'writing: LANE_WORDS in shapes/stream.ts no longer matches src/data/blog.ts —',
      `expected [${rows.map((r) => r.w).join(', ')}]`,
    )
  }

  const totalWords = rows.reduce((a, r) => a + r.w, 0)
  const totalMins = rows.reduce((a, r) => a + mins(r.w), 0)

  const feature = rows[0]
  // the home page is an overview: the newest dispatch plus the next two
  const rest = rows.slice(1, 3)

  /* the eighteen-bar index: a legend for the sculpture that works on every tier */
  const index = rows
    .map(
      (r) =>
        `<i data-i="${r.i}" style="--l:${laneWeight(r.i).toFixed(3)}"${r.i === 0 ? ' class="lead"' : ''}></i>`,
    )
    .join('')

  const log = rest
    .map(
      (r) => `<li class="wr-item" data-k="${r.i}" data-w="${r.w}">
              <a class="wr-card wr-row" data-i="${r.i}" href="/blog/${r.p.slug}/">
                <span class="wr-num mono">${String(r.i + 1).padStart(2, '0')}</span>
                ${plate(r.i, r.p, '1', '64px')}
                <span class="wr-body">
                  <span class="wr-title">${T(r.p.title)}</span>
                  <span class="wr-ex">${T(r.p.excerpt)}</span>
                  <span class="wr-meta mono"><time datetime="${r.day}">${r.date}</time><i>·</i>${mins(
                    r.w,
                  )} min<i>·</i>${group(r.w)} words</span>
                </span>
                <span class="wr-len" style="--l:${laneWeight(r.i).toFixed(3)}" aria-hidden="true"></span>
              </a>
            </li>`,
    )
    .join('')

  return `
      <section class="chapter wr" id="writing" data-shape="6" aria-labelledby="writing-title">
        <div class="inner wr-head">
          <span class="kicker mono rev">${c.index} — ${c.eyebrow}</span>
          <h2 class="rev" id="writing-title">${c.title}</h2>
          <p class="rev">${c.intro}</p>

          <dl class="wr-stats mono rev">
            <div><dd data-wc="${rows.length}">${rows.length}</dd><dt>dispatches</dt></div>
            <div><dd data-wc="${totalWords}">${group(totalWords)}</dd><dt>words written</dt></div>
            <div><dd data-wc="${totalMins}">${totalMins}</dd><dt>minutes end to end</dt></div>
          </dl>

          <div class="wr-idxcap mono rev"><span>archive index</span><span>newest → oldest</span></div>
          <div class="wr-index rev" aria-hidden="true"><span class="wr-base"></span>${index}</div>
        </div>

        <a class="wr-card wr-feature rev" data-i="${feature.i}" href="/blog/${feature.p.slug}/">
          ${plate(feature.i, feature.p, '16/9', '(min-width: 861px) 300px, 92vw')}
          <span class="wr-fbody">
            <span class="wr-tag mono"><i class="dot"></i>latest dispatch</span>
            <h3 class="wr-ftitle">${T(feature.p.title)}</h3>
            <span class="wr-fex">${T(feature.p.excerpt)}</span>
            <span class="wr-meta mono"><time datetime="${feature.day}">${feature.date}</time><i>·</i>${mins(
              feature.w,
            )} min read<i>·</i>${group(feature.w)} words</span>
            <span class="wr-go">Read the dispatch <i class="arw" aria-hidden="true">↗</i></span>
          </span>
        </a>

        <ol class="wr-log">${log}</ol>

        <p class="see-all rev"><span class="mono">the three most recent of ${rows.length} dispatches</span><a class="cta ghost glass" href="/blog/">The whole archive <span class="arw">↗</span></a></p>
      </section>`
}
