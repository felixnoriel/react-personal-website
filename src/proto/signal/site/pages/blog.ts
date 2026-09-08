/**
 * SIGNAL — the writing group: /blog/ and the eighteen /blog/<slug>/ pages.
 *
 * One idea runs through both: the archive is EIGHTEEN DISPATCHES ON ONE WIRE,
 * the same wire shapes/stream.ts hangs in the core. On the index the wire is a
 * sticky rail of eighteen knots beside the log; on a post it becomes the
 * article's rail, with the contents branching off it and the reading progress
 * running down it. Hovering either end — a row, a knot — pulls the sculpture to
 * that post's knot, so the page and the core are the same eighteen objects.
 *
 * This module runs at BUILD time (scripts/render-signal.ts), so every title,
 * date, excerpt, word count and paragraph is real HTML at first paint. The
 * WordPress export carries numeric entities (`&#8211;`) and markup habits from
 * 2016 (an <h1> inside the body, images wrapped in <p>, links to the old
 * domain); all of that is normalised here, once, rather than in the browser.
 *
 * Images: the bodies point at an S3 bucket that answers 403 to every origin but
 * production. layout.ts's localizeImages() swaps each <img> whose URL is in the
 * generated manifests for a sized, lazy AVIF/WebP <picture> served from this
 * site — so the markup below writes plain <img src="<original url>"> and lets
 * the shell localise it. Three of the 441 sources are gone from the bucket
 * entirely; sections/pages-blog.ts catches their load error and draws a plate.
 */
import type { PageSpec } from '../layout'
import { SITE, tidyProse } from '../layout'
import { blogPosts } from '../../../shared/data'
import { SECTIONS } from '../../../shared/content'
import { LANES, laneWeight } from '../../shapes/stream'
import { IMAGES as COVER_FILES } from '../../../../data/images/blog.generated'
import { IMAGES as FRAME_FILES } from '../../../../data/images/prose.generated'

/* ------------------------------------------------------------------ text */

const NAMED: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…',
  mdash: '—', ndash: '–', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', deg: '°',
}
/** WordPress leaves numeric entities in the exported strings; turn them into text */
function decode(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n: string) => NAMED[n.toLowerCase()] ?? m)
}
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
/** decode once, escape once: what the reader sees is the real character */
const T = (s: string) => esc(decode(s))
/** plain text, for <title>, meta and JSON-LD */
const P = (s: string) => decode(s.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim()

/* ----------------------------------------------------------------- facts */

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
/** parse the stored stamp by hand: no timezone in the string, so no drift */
function parts(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  return m ? { y: m[1], mo: Number(m[2]), d: Number(m[3]), day: `${m[1]}-${m[2]}-${m[3]}` } : null
}
const shown = (iso: string) => {
  const p = parts(iso)
  return p ? `${p.d} ${MON[p.mo - 1]} ${p.y}` : iso
}
/** the same count sections/writing.html.ts and shapes/stream.ts use, so the
 *  home page, this page and the sculpture never disagree by a word */
const wordsIn = (html: string) =>
  html.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').split(/\s+/).filter(Boolean).length
const mins = (w: number) => Math.max(1, Math.round(w / 200))
const group = (v: number) => v.toLocaleString('en-US')

/* -------------------------------------------------------------- pictures */

/**
 * How big the optimised copy of a source actually is. The encoder never
 * upscales, so a 440px-wide 2016 thumbnail tops out at a 200px variant — three
 * of the eighteen covers are that small, and blown up to card size they are
 * mush. `plate()` therefore prefers the cover but falls back to the first frame
 * inside the post that is big enough: still the dispatch's own photograph, just
 * the copy that survived at a usable size.
 */
const FILES: Record<string, { width: number; height: number; avif: { w: number }[]; webp: { w: number }[] }> = {
  ...FRAME_FILES,
  ...COVER_FILES,
}
const maxW = (url: string) => {
  const f = FILES[url]
  if (!f) return 0
  return Math.max(f.avif.at(-1)?.w ?? 0, f.webp.at(-1)?.w ?? 0)
}
/** the picture that represents a dispatch on a card and at the top of its page */
function plate(post: { content: string; image: { url: string; alt?: string } }): string {
  const url = post.image.url
  if (maxW(url) >= 480) return url
  for (const m of post.content.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)) if (maxW(m[1]) >= 480) return m[1]
  return url
}

/** newest first — the order the lanes, the wire, the cards and prev/next share */
const POSTS = [...blogPosts].sort(
  (a, b) =>
    (parts(b.publishedDate)?.day ?? '').localeCompare(parts(a.publishedDate)?.day ?? '') ||
    b.publishedDate.localeCompare(a.publishedDate),
)

interface Row {
  post: (typeof POSTS)[number]
  /** the source URL of the picture this dispatch is shown by */
  face: string
  i: number
  words: number
  read: number
  frames: number
  date: string
  day: string
  title: string
  plain: string
  excerpt: string
  href: string
  url: string
}

const ROWS: Row[] = POSTS.map((post, i) => {
  const words = wordsIn(post.content)
  return {
    post,
    face: plate(post),
    i,
    words,
    read: mins(words),
    frames: (post.content.match(/<img\b/g) ?? []).length,
    date: shown(post.publishedDate),
    day: parts(post.publishedDate)?.day ?? '',
    title: T(post.title),
    plain: P(post.title),
    excerpt: T(post.excerpt),
    href: `/blog/${post.slug}/`,
    url: `${SITE.url}${SITE.base}/blog/${post.slug}/`,
  }
})

/* --------------------------------------------------------------- the body */

/**
 * The old domain is still up, but a link from one dispatch to another belongs
 * inside this site: it keeps the reader in the archive, and it gets the
 * prefetch and the page transition. The 2016 permalinks do not match today's
 * slugs (`/worlds-highest-bungee/` is `worlds-highest-bungee-in-macau-tower-macau`),
 * so the target is matched on shared slug words and only rewritten when the
 * overlap is decisive. Anything weaker stays an ordinary external link.
 */
const tokens = (s: string) => new Set(s.split(/[^a-z0-9]+/i).filter((x) => x.length > 2))
const SLUG_TOKENS = ROWS.map((r) => ({ r, t: tokens(r.post.slug) }))
function internal(href: string): string | null {
  const m = /^https?:\/\/(?:www\.)?whoisfelix\.com\/(.*)$/i.exec(href)
  if (!m) return null
  const path = m[1].replace(/^index\.php\/[\d/]+/, '').replace(/^blog\//, '').replace(/[/?#].*$/, '')
  if (!path) return '/blog/'
  const want = tokens(path)
  if (!want.size) return null
  let best: Row | null = null
  let score = 0
  for (const { r, t } of SLUG_TOKENS) {
    let n = 0
    for (const x of want) if (t.has(x)) n++
    const s = n / want.size
    if (s > score) {
      score = s
      best = r
    }
  }
  return best && score >= 0.7 ? best.href : null
}

/** headings become anchors so the contents rail can link to them */
const slugify = (s: string) =>
  P(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'section'

interface Head2 {
  id: string
  text: string
  level: 2 | 3
}

/**
 * One pass over a post body. Everything here is a fix to 2016 markup, never a
 * rewrite of the words:
 *   - the leading <h1> becomes an <h2> (the page's own <h1> is the title, and
 *     eleven bodies carry a second, different headline that must survive)
 *   - a lead paragraph that repeats the excerpt verbatim is dropped, because
 *     the page already prints the excerpt above it
 *   - <img> keeps its original src (the shell localises it) but loses the
 *     stale width/height, so the box comes from the real file and cannot shift
 *   - an image alone in a <p>, and WordPress's own <figure class="wp-caption">,
 *     become one <figure class="bp-fig"> with its caption
 *   - links to the old domain come home; every other absolute link opens in a
 *     new tab, safely
 *   - Facebook's <div class="text_exposed_show"> wrappers and the empty
 *     paragraphs they leave behind are unwrapped
 */
function body(post: (typeof POSTS)[number]): { html: string; heads: Head2[]; frames: string[]; dupLead: boolean } {
  let html = tidyProse(post.content)
  const heads: Head2[] = []
  const frames: string[] = []
  const seen = new Set<string>()
  let fn = 0

  // 1. unwrap the Facebook paste wrappers and drop the empties they leave
  html = html
    .replace(/<div\b[^>]*>/g, '')
    .replace(/<\/div>/g, '')
    .replace(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/g, '')

  // 2. the <h1> the export left in the body. Eleven posts have one; six of
  //    them just repeat the title the page already prints, so those go, and
  //    the five that are a real second headline become <h2>.
  const flat = (x: string) => P(x).toLowerCase().replace(/[^a-z0-9]+/g, '')
  html = html.replace(/^\s*<h1(?:\s[^>]*)?>([\s\S]*?)<\/h1>\s*/, (m, inner: string) =>
    flat(inner) === flat(post.title) ? '' : m,
  )
  html = html.replace(/<h1(\s[^>]*)?>/g, '<h2$1>').replace(/<\/h1>/g, '</h2>')

  // 3. the opening paragraph and the excerpt above it are often the same
  //    sentence. If they match exactly, drop the paragraph; if the paragraph
  //    merely STARTS with the excerpt it carries more, so it stays and the
  //    page drops its own lead instead (`dupLead`).
  let dupLead = false
  const lead = /<p>([\s\S]*?)<\/p>/.exec(html)
  const ex = P(post.excerpt)
  if (lead && lead.index < 460 && ex) {
    const text = P(lead[1])
    if (text === ex) html = html.slice(0, lead.index) + html.slice(lead.index + lead[0].length)
    else if (text.startsWith(ex)) dupLead = true
  }

  // 4. headings: give every h2/h3 an id and collect the contents
  html = html.replace(/<(h2|h3)(\s[^>]*)?>([\s\S]*?)<\/\1>/g, (_m, tag: string, attrs: string, inner: string) => {
    const text = P(inner)
    if (!text) return `<${tag}${attrs ?? ''}>${inner}</${tag}>`
    let id = slugify(text)
    let n = 2
    while (seen.has(id)) id = `${slugify(text)}-${n++}`
    seen.add(id)
    heads.push({ id, text, level: tag === 'h2' ? 2 : 3 })
    return `<${tag} id="${id}" class="bp-h rev">${inner}<a class="bp-anchor" href="#${id}" aria-label="Link to this section">#</a></${tag}>`
  })

  // 5. WordPress figures → one clean figure with its caption
  html = html.replace(
    /<figure\b[^>]*>\s*(<img\b[^>]*>)\s*(?:<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>)?\s*<\/figure>/g,
    (_m, img: string, cap?: string) => figure(img, ++fn, frames, cap),
  )

  // 6. an image (or a run of them) alone in a paragraph is a figure too
  html = html.replace(/<p>((?:\s|<br\s*\/?>|<img\b[^>]*>)+)<\/p>/g, (_m, inner: string) => {
    const imgs = inner.match(/<img\b[^>]*>/g)
    if (!imgs) return ''
    return imgs.map((im) => figure(im, ++fn, frames)).join('\n')
  })

  // 7. anything still inline keeps its place, sized and lazy
  html = html.replace(/<img\b[^>]*>/g, (im) => prep(im, 'bp-inline'))

  // 8. links: home for this site's own, safe for the rest
  html = html.replace(/<a\b([^>]*)href="([^"]+)"([^>]*)>/g, (m, pre: string, href: string, post2: string) => {
    const home = internal(href)
    if (home) return `<a${pre}href="${home}"${post2} data-inner="1">`
    if (/^https?:/i.test(href) && !/\btarget=/.test(m))
      return `<a${pre}href="${href}"${post2} target="_blank" rel="noopener">`
    return m
  })

  // 9. paragraphs and lists reveal as they arrive. The drop cap goes on the
  //    first one only when it opens with a letter — several bodies start
  //    inside an <a> or an underlined <span>, where a floated capital breaks.
  let first = true
  html = html.replace(/<(p|ul|ol|blockquote)>/g, (_m, tag: string) => {
    if (tag !== 'p') return `<${tag} class="rev">`
    const cap = first
    first = false
    return `<p class="rev${cap ? ' bp-cap1' : ''}">`
  })
  html = html.replace(/<p class="rev bp-cap1">(?![A-Za-z])/, '<p class="rev">')

  return { html, heads, frames, dupLead }
}

/** an <img> from the export, ready for localizeImages(): original src, our
 *  class and sizes, no stale intrinsic size (the manifest knows the real one) */
function prep(img: string, cls: string, sizes = '(min-width: 1180px) 720px, (min-width: 861px) 58vw, 92vw'): string {
  const src = /\bsrc="([^"]*)"/.exec(img)?.[1] ?? ''
  const alt = /\balt="([^"]*)"/.exec(img)?.[1] ?? ''
  // three of the 441 sources have gone from the bucket: ask for nothing, and
  // let the figure draw its plate instead of firing a request that 403s
  if (!src || !FILES[src]) return ''
  return `<img src="${esc(src)}" alt="${T(alt)}" class="${cls}" sizes="${sizes}">`
}

function figure(img: string, n: number, frames: string[], cap?: string): string {
  const alt = /\balt="([^"]*)"/.exec(img)?.[1] ?? ''
  const src = /\bsrc="([^"]*)"/.exec(img)?.[1] ?? ''
  if (!src) return ''
  const shot = prep(img, 'bp-shot')
  if (shot) frames.push(src)
  const caption = cap && P(cap) ? `<figcaption>${T(cap.replace(/<[^>]+>/g, ''))}</figcaption>` : ''
  return `<figure class="bp-fig rev${shot ? '' : ' is-gone'}" id="frame-${n}" data-alt="${
    T(alt) || 'frame no longer in the archive'
  }"><span class="bp-fn mono" aria-hidden="true">${String(n).padStart(2, '0')}</span>${shot}${caption}</figure>`
}

/* ---------------------------------------------------------- shared pieces */

/** the eighteen-knot wire: the page's copy of the sculpture, on every tier */
function wire(active = -1): string {
  const knots = ROWS.map(
    (r) =>
      `<button type="button" class="bl-knot${r.i === active ? ' here' : ''}" data-i="${r.i}" style="--l:${laneWeight(
        r.i,
      ).toFixed(3)}" aria-label="${r.plain.replace(/"/g, '&quot;')}"${
        r.i === active ? ' aria-current="true"' : ''
      }><i aria-hidden="true"></i><em>${String(r.i + 1).padStart(2, '0')}</em><b>${r.title}</b></button>`,
  ).join('')
  return `<nav class="bl-wire" aria-label="The eighteen dispatches"><span class="bl-line" aria-hidden="true"></span>${knots}</nav>`
}

/** the picture of a post, as the shell will localise it */
function cover(r: Row, cls: string, sizes: string, eager = false): string {
  return `<img src="${esc(r.face)}" alt="${T(r.post.image.alt || r.post.title)}" class="${cls}" sizes="${sizes}"${
    eager ? ' loading="eager" fetchpriority="high"' : ''
  }>`
}

const AUTHOR = {
  '@type': 'Person',
  name: SITE.name,
  url: SITE.url,
}

/**
 * Both routes load this group's behaviour module themselves. It also exports
 * init(scene) for sections/index.ts, and refuses to run twice, so registering
 * it there later changes nothing. The <noscript> rule matters more than it
 * looks: `.rev` starts at opacity 0 and the shell's observer is what reveals
 * it, so without this an article would be blank for a reader with no script.
 */
const HEAD =
  `<noscript><style>.rev{opacity:1!important;transform:none!important}</style></noscript>`

/* ------------------------------------------------------------- the index */

function indexPage(): PageSpec {
  const c = SECTIONS.writing
  const totalWords = ROWS.reduce((a, r) => a + r.words, 0)
  const totalMins = ROWS.reduce((a, r) => a + r.read, 0)
  const totalFrames = ROWS.reduce((a, r) => a + r.frames, 0)

  const items = ROWS.map((r) => {
    const feature = r.i === 0
    const find = `${r.plain} ${P(r.post.excerpt)}`.toLowerCase().replace(/"/g, '')
    return `<li class="bl-item${feature ? ' bl-first' : ''}" data-k="${r.i}" data-w="${r.words}" data-find="${esc(
      find,
    )}">
              <a class="bl-card" data-i="${r.i}" href="${r.href}">
                <span class="bl-shot">${cover(
                  r,
                  'bl-img',
                  feature ? '(min-width: 861px) 560px, 92vw' : '(min-width: 861px) 232px, 34vw',
                )}<b class="bl-pn mono">${String(r.i + 1).padStart(2, '0')}</b></span>
                <span class="bl-body">
                  ${feature ? '<span class="bl-tag mono"><i class="dot"></i>latest dispatch</span>' : ''}
                  <span class="bl-title" data-vt="title">${r.title}</span>
                  <span class="bl-ex">${r.excerpt}</span>
                  <span class="bl-meta mono"><time datetime="${r.day}">${r.date}</time><i>·</i>${
                    r.read
                  } min<i>·</i>${group(r.words)} words<i>·</i>${r.frames} frames</span>
                  ${feature ? '<span class="bl-go">Read the dispatch <i class="arw" aria-hidden="true">↗</i></span>' : ''}
                </span>
                <span class="bl-len" style="--l:${laneWeight(r.i).toFixed(3)}" aria-hidden="true"></span>
              </a>
            </li>`
  }).join('')

  return {
    path: '/blog/',
    title: 'Writing',
    description:
      'Eighteen field notes from the road — itineraries, food, and the reasons to go, from Felix Noriel.',
    image: ROWS[0].post.image.url,
    shape: 6,
    css: ['pages-blog'],
    head: HEAD,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Writing — Felix Noriel',
      description: P(c.intro),
      url: `${SITE.url}${SITE.base}/blog/`,
      author: AUTHOR,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: ROWS.length,
        itemListElement: ROWS.map((r) => ({
          '@type': 'ListItem',
          position: r.i + 1,
          url: r.url,
          name: r.plain,
        })),
      },
    },
    main: `
      <section class="chapter bl" id="archive" aria-labelledby="bl-title">
        <div class="inner bl-head">
          <span class="kicker mono rev">${c.index} — the archive · ${ROWS.length} dispatches</span>
          <h1 class="rev" id="bl-title"><span class="ink">${c.title}</span></h1>
          <p class="rev">${c.intro}</p>
          <dl class="bl-stats mono rev">
            <div><dd data-wc="${ROWS.length}">${ROWS.length}</dd><dt>dispatches</dt></div>
            <div><dd data-wc="${totalWords}">${group(totalWords)}</dd><dt>words written</dt></div>
            <div><dd data-wc="${totalMins}">${totalMins}</dd><dt>minutes end to end</dt></div>
            <div><dd data-wc="${totalFrames}">${group(totalFrames)}</dd><dt>frames filed</dt></div>
          </dl>
        </div>

        <div class="bl-bar rev">
          <label class="bl-find">
            <span class="sr">Search the archive</span>
            <i class="bl-mag mono" aria-hidden="true">⌕</i>
            <input type="search" id="bl-q" placeholder="search the archive" autocomplete="off" enterkeyhint="search" />
          </label>
          <span class="bl-sort" role="group" aria-label="Order the archive">
            <button type="button" class="bl-chip on" data-sort="new" aria-pressed="true">newest</button>
            <button type="button" class="bl-chip" data-sort="long" aria-pressed="false">longest</button>
            <button type="button" class="bl-chip" data-sort="short" aria-pressed="false">shortest</button>
          </span>
          <span class="bl-count mono" role="status">${ROWS.length} of ${ROWS.length}</span>
        </div>

        <div class="bl-grid">
          ${wire()}
          <ol class="bl-log">${items}</ol>
        </div>

        <p class="bl-none mono" hidden>nothing on the wire for that. <button type="button" class="bl-clear">clear the search</button></p>

        <div class="bl-foot">
          <a class="cta ghost glass" href="/">← back to the signal</a>
          <a class="cta ghost glass" href="/#contact">Say hello</a>
        </div>
      </section>`,
  }
}

/* -------------------------------------------------------------- one post */

function postPage(r: Row): PageSpec {
  const { html, heads, frames, dupLead } = body(r.post)
  const prev = ROWS[r.i - 1] // newer
  const next = ROWS[r.i + 1] // older
  const share = encodeURIComponent(r.url)
  const shareText = encodeURIComponent(r.plain)

  /**
   * The contact sheet. The covers only exist up to 480px wide, so a full-bleed
   * hero photograph would be an upscale; the frames inside the post are the big
   * files. Four of them, at their own size, are both sharper and a better
   * promise of what is in the dispatch — and each one jumps to its figure.
   */
  const sheet = frames.filter((f) => f !== r.face)
  const strip = sheet.length
    ? `<div class="bp-strip" role="group" aria-label="Frames in this dispatch">
              ${sheet
                .slice(0, 4)
                .map(
                  (src) =>
                    `<a class="bp-th" href="#frame-${frames.indexOf(src) + 1}"><img src="${esc(
                      src,
                    )}" alt="" class="bp-thimg" sizes="112px" /><b class="mono">${String(
                      frames.indexOf(src) + 1,
                    ).padStart(2, '0')}</b></a>`,
                )
                .join('')}
              ${
                sheet.length > 4 ? `<span class="bp-more mono">+${sheet.length - 4}<br />more</span>` : ''
              }
            </div>`
    : ''

  const toc = heads.length
    ? `<nav class="bp-toc" aria-label="What is in this dispatch">
            <span class="bp-cap mono">contents</span>
            <ol>${heads
              .map(
                (h) =>
                  `<li class="bp-t${h.level}"><a href="#${h.id}" data-to="${h.id}"><i aria-hidden="true"></i><span>${esc(
                    h.text,
                  )}</span></a></li>`,
              )
              .join('')}</ol>
          </nav>`
    : ''

  const shareBlock = `<div class="bp-share">
            <span class="bp-cap mono">broadcast</span>
            <a class="bp-sh" href="https://www.facebook.com/sharer/sharer.php?u=${share}" target="_blank" rel="noopener" aria-label="Share on Facebook"><b>fb</b><span>Facebook</span></a>
            <a class="bp-sh" href="https://twitter.com/intent/tweet?url=${share}&amp;text=${shareText}" target="_blank" rel="noopener" aria-label="Share on X"><b>x</b><span>X / Twitter</span></a>
            <a class="bp-sh" href="https://www.linkedin.com/sharing/share-offsite/?url=${share}" target="_blank" rel="noopener" aria-label="Share on LinkedIn"><b>in</b><span>LinkedIn</span></a>
            <button type="button" class="bp-sh bp-copy" data-url="${esc(r.url)}"><b>⧉</b><span>Copy link</span></button>
          </div>`

  const sib = (o: Row | undefined, dir: 'prev' | 'next') =>
    o
      ? `<a class="bp-sib bl-card glass" data-i="${o.i}" href="${o.href}">
              <span class="mono bp-sibcap">${dir === 'prev' ? '← newer dispatch' : 'older dispatch →'}</span>
              <span class="bl-title" data-vt="title">${o.title}</span>
              <span class="bp-sibmeta mono"><time datetime="${o.day}">${o.date}</time><i>·</i>${o.read} min</span>
            </a>`
      : `<span class="bp-sib is-end mono">${dir === 'prev' ? 'this is the newest dispatch' : 'the wire starts here'}</span>`

  return {
    path: `/blog/${r.post.slug}/`,
    title: r.plain,
    description: P(r.post.excerpt) || `${r.plain} — a field note by Felix Noriel.`,
    image: r.post.image.url,
    type: 'article',
    shape: 6,
    css: ['pages-blog'],
    head: HEAD,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: r.plain,
      description: P(r.post.excerpt),
      image: [r.post.image.url],
      datePublished: r.post.publishedDate,
      dateModified: r.post.modifiedDate || r.post.publishedDate,
      author: AUTHOR,
      publisher: AUTHOR,
      mainEntityOfPage: { '@type': 'WebPage', '@id': r.url },
      url: r.url,
      wordCount: r.words,
      timeRequired: `PT${r.read}M`,
      inLanguage: 'en',
      isPartOf: { '@type': 'Blog', name: 'Field notes from the road.', url: `${SITE.url}${SITE.base}/blog/` },
    },
    main: `
      <article class="bp" data-i="${r.i}">
        <header class="bp-head">
          <a class="bp-back mono" href="/blog/"><i aria-hidden="true">←</i> the archive</a>
          <div class="bp-headgrid">
            <div class="bp-headl">
              <span class="kicker mono rev">dispatch ${String(r.i + 1).padStart(2, '0')} / ${ROWS.length}</span>
              <h1 class="rev" id="bp-title">${r.title}</h1>
              ${dupLead ? '' : `<p class="bp-lead rev">${r.excerpt}</p>`}
              <dl class="bp-facts mono rev">
                <div class="glass"><dt>filed</dt><dd><time datetime="${r.day}">${r.date}</time></dd></div>
                <div class="glass"><dt>read</dt><dd>${r.read} min</dd></div>
                <div class="glass"><dt>words</dt><dd>${group(r.words)}</dd></div>
                <div class="glass"><dt>frames</dt><dd>${r.frames}</dd></div>
              </dl>
            </div>
            <div class="bp-headr rev">
              <figure class="bp-cover">
                ${cover(r, 'bp-coverimg', '(min-width: 861px) 520px, 94vw', true)}
                <figcaption class="mono"><span>${T(
                  r.post.image.alt || r.post.title,
                )}</span><span class="bp-covern">${String(r.i + 1).padStart(2, '0')} / ${ROWS.length}</span></figcaption>
              </figure>
              ${strip}
            </div>
          </div>
        </header>

        <div class="bp-body">
          <aside class="bp-rail">
            <div class="bp-railin">
              <span class="bp-prog" aria-hidden="true"><i></i></span>
              ${toc}
              ${shareBlock}
            </div>
          </aside>

          <div class="bp-prose" id="transcript">
            <span class="bp-open mono rev" aria-hidden="true">transcript opens</span>
            ${html}
            <div class="bp-close mono">
              <span>end of transmission</span>
              <span class="bp-sign">filed by fn · ${r.date}</span>
            </div>
            <div class="bp-mshare">${shareBlock}</div>
          </div>
        </div>

        <nav class="bp-pn" aria-label="More dispatches">
          ${sib(prev, 'prev')}
          ${sib(next, 'next')}
        </nav>

        <div class="bl-foot">
          <a class="cta ghost glass" href="/blog/">← all ${ROWS.length} dispatches</a>
          <a class="cta ghost glass" href="/#contact">Say hello</a>
        </div>
      </article>`,
  }
}

export function blogPages(): PageSpec[] {
  if (ROWS.length !== LANES) {
    console.warn(`blog: ${ROWS.length} posts but shapes/stream.ts hangs ${LANES} knots`)
  }
  return [indexPage(), ...ROWS.map(postPage)]
}
