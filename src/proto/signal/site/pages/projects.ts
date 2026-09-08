/**
 * SIGNAL — /projects/ and the nine /projects/<slug>/ case studies.
 *
 * The index is the manifest of everything shipped: a full-screen contents
 * list (nine lines a recruiter reads in three seconds), then the catalogue
 * of nine cards with a live stack filter. The detail pages are the case
 * files: the write-up verbatim, the stack, the whole gallery behind a real
 * light-box, and the way on to the next project.
 *
 * Every string comes from src/data/projects.ts, src/data/career.ts or
 * shared/content.ts. The only drawn artwork is StablePay's screen: it has
 * no image file, so its payment rail is hand-drawn SVG in the page palette
 * (its four claims are the ones on the real banner). Every other image is
 * the real one, served locally, sized, lazy (layout.ts swaps each <img>
 * for an AVIF/WebP <picture> from the manifest at render time).
 *
 * This module runs at BUILD time only (scripts/render-signal.ts), so it may
 * import the heavy data and the image manifests; sections/pages-projects.ts
 * is the runtime half and imports none of it.
 */
import type { PageSpec } from '../layout'
import { tidyProse } from '../layout'
import { SECTIONS, FEATURED } from '../../../shared/content'
import { careers, projects } from '../../../shared/data'
import type { Image, Project } from '../../../shared/data'
import { IMAGES as PROJECT_IMAGES } from '../../../../data/images/projects.generated'
import { IMAGES as GALLERY_IMAGES } from '../../../../data/images/galleries.generated'
import type { OptimizedImage } from '../../../../types/images'

/* ---------------------------------------------------------------- text */

const ENT: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }
/** the datasets carry WordPress entities (&#8211;, &amp;) — decode, then escape once */
function decode(s: string): string {
  return s.replace(/&(#\d+|\w+);/g, (m, k: string) =>
    k[0] === '#' ? String.fromCharCode(Number(k.slice(1))) : (ENT[k] ?? m),
  )
}
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
/** decode the source entity, escape for output: same glyphs, valid markup */
const t = (s: string): string => esc(decode(s))
/** plain text for <title>, meta and aria */
const plain = (s: string): string =>
  decode(s.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
const clip = (s: string, n: number): string => {
  const d = plain(s)
  return d.length > n ? d.slice(0, n - 1).trimEnd() + '…' : d
}
const pad = (n: number): string => String(n).padStart(2, '0')
const slugify = (s: string): string =>
  plain(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/** djb2 → the 7-character build id the old site printed on every project */
function commit(slug: string): string {
  let h = 5381
  for (let i = 0; i < slug.length; i++) h = ((h << 5) + h + slug.charCodeAt(i)) | 0
  return (h >>> 0).toString(16).padStart(8, '0').slice(0, 7)
}

/** the write-up, read at 200 words a minute */
function minutes(html: string): number {
  return Math.max(1, Math.round(plain(html).split(/\s+/).filter(Boolean).length / 200))
}

/* ---------------------------------------------------------------- data */

/** the three products that get a cell of the sculpture, in bench order */
const FEAT = ['stable', 'genopets', 'dashify']
const featOf = (slug: string) => FEAT.indexOf(slug)
const rest = projects.filter((p) => featOf(p.slug) < 0)
const busOf = (slug: string) => rest.findIndex((p) => p.slug === slug)

const IMAGES: Record<string, OptimizedImage> = { ...PROJECT_IMAGES, ...GALLERY_IMAGES }

interface Post {
  role: string
  when: string
  short: string
  location: string
  slug: string
}
/** the role behind a project, from the career data */
function post(p: Project): Post | null {
  const c = careers.find((k) => k.slug === p.company?.slug)
  if (!c) return null
  const y = (s: string) => (s.match(/\d{4}/)?.[0] ?? s)
  return {
    role: c.jobTitle,
    when: `${c.startDate} → ${c.endDate}`,
    short: `${y(c.startDate)}–${c.endDate === 'Present' ? 'now' : y(c.endDate)}`,
    location: c.location,
    slug: c.slug,
  }
}

/** the index card title: the long product names from content.ts where there is one */
const cardTitle = (p: Project) => FEATURED.find((f) => f.slug === p.slug)?.title ?? p.title
const outcomes = (p: Project) => FEATURED.find((f) => f.slug === p.slug)?.outcomes
/** StablePay ships no numbers yet, so its three-up names what it is made of */
const WORDS: Record<string, { figure: string; label: string }[]> = {
  stable: [
    { figure: 'EVM', label: 'payment rails' },
    { figure: 'React Native', label: 'mobile app' },
    { figure: 'AWS · Datadog', label: 'go services' },
  ],
}
const gallery = (p: Project): Image[] => (p.gallery ?? []).filter((g) => g.url)

const FRAMES = projects.reduce((n, p) => n + gallery(p).length, 0)
const COMPANIES = new Set(projects.map((p) => p.company?.slug).filter(Boolean)).size

/* -------------------------------------------------------------- images */

/**
 * An <img> the render step turns into a sized, lazy AVIF/WebP <picture>.
 * `flat` drops the blur-up placeholder (a 2 KB data URI): worth it on the
 * few big shots, not on thirty-seven gallery thumbnails.
 */
function img(src: string, alt: string, cls: string, w: number, h: number, sizes: string, flat = false): string {
  return (
    `<img src="${src}" alt="${t(alt)}" class="${cls}" width="${w}" height="${h}" sizes="${sizes}"` +
    (flat ? ` style="background:hsl(200 14% 12%)"` : '') +
    ` loading="lazy" decoding="async">`
  )
}

/** the light-box needs the full-size variants, so they ride on the button */
function frameData(g: Image): string {
  const m = IMAGES[g.url]
  if (!m) return ` data-src="${g.url}" data-w="1600" data-h="900"`
  const set = (m.avif.length ? m.avif : m.webp).map((v) => `${v.src} ${v.w}w`).join(', ')
  return (
    ` data-src="${m.fallback}" data-w="${m.width}" data-h="${m.height}"` +
    (set ? ` data-set="${set}" data-type="${m.avif.length ? 'image/avif' : 'image/webp'}"` : '')
  )
}

/* ---------------------------------------------------------- StablePay */

/**
 * StablePay's screen. There is no image file for it, so the product is
 * drawn: the four claims on its banner, the rail a transfer crosses, and
 * the stack it crosses it on — all from src/data/projects.ts.
 */
const CLAIMS = ['USDT made easy', 'Send & receive instantly', 'Zero fees', 'No borders']

function payDevice(x: number, y: number): string {
  return (
    `<rect class="pv-dev" x="${x}" y="${y}" width="132" height="176" rx="18"/>` +
    `<text class="pv-k" x="${x + 16}" y="${y + 30}">BALANCE</text>` +
    `<text class="pv-amt" x="${x + 16}" y="${y + 58}">USDT</text>` +
    `<rect class="pv-row" x="${x + 14}" y="${y + 76}" width="104" height="26" rx="8"/>` +
    `<text class="pv-k lit" x="${x + 26}" y="${y + 93}">pay</text>` +
    `<rect class="pv-row" x="${x + 14}" y="${y + 108}" width="104" height="26" rx="8"/>` +
    `<text class="pv-k lit" x="${x + 26}" y="${y + 125}">split</text>` +
    `<rect class="pv-row" x="${x + 14}" y="${y + 140}" width="104" height="26" rx="8"/>` +
    `<text class="pv-k lit" x="${x + 26}" y="${y + 157}">send home</text>`
  )
}

/** the compact screen on the index card (16:9) */
function payCard(): string {
  const claims = CLAIMS.map(
    (c, i) =>
      `<rect class="pv-claim" x="196" y="${56 + i * 40}" width="268" height="30" rx="15"/>` +
      `<circle class="pv-dot s${i}" cx="214" cy="${71 + i * 40}" r="3.2"/>` +
      `<text class="pv-nm sm" x="228" y="${75 + i * 40}">${t(c)}</text>`,
  ).join('')
  return `<svg class="pv" viewBox="0 0 480 270" role="img" aria-label="StablePay: a mobile wallet whose pay, split and send-home flows settle instantly on chain with no fees and no borders.">
      <text class="pv-fig" x="18" y="26">STABLEPAY \u00b7 USDT MADE EASY</text>
      ${payDevice(18, 52)}
      <path class="pv-arc" d="M150,140 C176,140 172,100 194,100"/>
      <path class="pv-arc run" d="M150,140 C176,140 172,100 194,100"/>
      ${claims}
      <text class="pv-cap" x="18" y="252">instant \u00b7 zero fees \u00b7 no borders</text>
    </svg>`
}

/** the full screen on the case-study page (2:1): the claims and the rail */
function payScreen(): string {
  const claims = CLAIMS.map(
    (c, i) =>
      `<rect class="pv-claim" x="${232 + (i % 2) * 208}" y="${52 + ((i / 2) | 0) * 44}" width="196" height="32" rx="16"/>` +
      `<circle class="pv-dot s${i}" cx="${250 + (i % 2) * 208}" cy="${68 + ((i / 2) | 0) * 44}" r="3.4"/>` +
      `<text class="pv-nm sm" x="${264 + (i % 2) * 208}" y="${73 + ((i / 2) | 0) * 44}">${t(c)}</text>`,
  ).join('')
  const node = (x: number, w: number, kind: string, name: string) =>
    `<rect class="pv-node" x="${x}" y="222" width="${w}" height="58" rx="12"/>` +
    `<text class="pv-k" x="${x + 16}" y="244">${kind}</text>` +
    `<text class="pv-nm big" x="${x + 16}" y="266">${name}</text>`
  return `<svg class="pv" viewBox="0 0 640 340" role="img" aria-label="StablePay architecture: pay, split and send-home flows leave a React Native app, cross a Golang service on AWS watched by Datadog, and settle on EVM.">
      <text class="pv-fig" x="18" y="26">STABLEPAY · USDT MADE EASY</text>
      <text class="pv-fig hot" x="622" y="26" text-anchor="end">ZERO FEES</text>
      ${payDevice(18, 40)}
      <path class="pv-arc" d="M156,128 C200,128 200,84 236,84"/>
      <path class="pv-arc run" d="M156,128 C200,128 200,84 236,84"/>
      ${claims}
      <path class="pv-rule" d="M18,200 H622"/>
      ${node(18, 168, 'MOBILE', 'React Native')}
      ${node(236, 168, 'API · AWS', 'Golang')}
      ${node(454, 168, 'SETTLEMENT', 'EVM')}
      <path class="pv-wire lit" d="M186,251 H236 M404,251 H454"/>
      <path class="pv-chev" d="M216,246 l6,5 l-6,5"/><path class="pv-chev" d="M434,246 l6,5 l-6,5"/>
      <rect class="pv-chip" x="236" y="292" width="88" height="24" rx="6"/>
      <text class="pv-k" x="280" y="308" text-anchor="middle">Datadog</text>
      <rect class="pv-chip ok" x="454" y="292" width="88" height="24" rx="6"/>
      <text class="pv-k lit" x="498" y="308" text-anchor="middle">settled</text>
      <path class="pv-wire dot" d="M280,280 V292 M498,280 V292"/>
    </svg>`
}

/* --------------------------------------------------------------- parts */

const tagList = (p: Project, max = 99): string => {
  const shown = p.tags.slice(0, max)
  const more = p.tags.length - shown.length
  return (
    `<ul class="tags pj-tags">${shown.map((g) => `<li>${t(g.name)}</li>`).join('')}` +
    (more > 0 ? `<li class="more">+${more}</li>` : '') +
    `</ul>`
  )
}

/** the card's picture: the real banner, or StablePay's drawn screen */
function shot(p: Project, feat: number): string {
  if (p.slug === 'stable') return payCard()
  const sizes =
    feat === 0
      ? '(min-width: 1180px) 620px, (min-width: 760px) 60vw, 100vw'
      : feat > 0
        ? '(min-width: 1180px) 46vw, 100vw'
        : '(min-width: 1180px) 30vw, (min-width: 760px) 46vw, 100vw'
  return img(p.image.url, p.image.alt || plain(p.title), 'pj-img', 800, 450, sizes)
}

function card(p: Project, i: number): string {
  const feat = featOf(p.slug)
  const bus = busOf(p.slug)
  const m = post(p)
  const g = gallery(p)
  const out = outcomes(p) ?? WORDS[p.slug]
  const words = !outcomes(p) && !!WORDS[p.slug]
  const id = `pj-t-${p.slug}`
  const tags = p.tags.map((x) => x.slug).join(' ')
  return `
            <article class="pj-card rev${feat >= 0 ? ' feat f' + feat : ''}" style="--i:${i}"
              data-slug="${p.slug}" data-tags="${tags}" ${feat >= 0 ? `data-cell="${feat}"` : `data-bus="${bus}"`}>
              <a class="pj-link" href="/projects/${p.slug}/" aria-labelledby="${id}">
                <span class="pj-glow" aria-hidden="true"></span><span class="pj-rim" aria-hidden="true"></span>
                <div class="pj-shot">
                  ${shot(p, feat)}
                  <span class="pj-hud" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
                  <span class="pj-scan" aria-hidden="true"></span>
                  <span class="pj-no mono">${pad(i + 1)}</span>
                  ${g.length ? `<span class="pj-fr mono">${g.length} frames</span>` : ''}
                </div>
                <div class="pj-info">
                  <p class="pj-meta mono">
                    <span class="co">${t(p.company?.title ?? '')}</span>${m ? `<span class="sep">/</span><span>${t(m.role)}</span><span class="sep">/</span><span>${t(m.short)}</span>` : ''}
                  </p>
                  <h3 class="pj-title" id="${id}" data-vt="title">${t(cardTitle(p))}</h3>
                  <p class="pj-ex">${t(p.excerpt)}</p>
                  ${
                    out
                      ? `<dl class="pj-out${words ? ' words' : ''}">${out
                          .map(
                            (o) =>
                              `<div><dt class="mono">${t(o.label)}</dt><dd${words ? '' : ` data-to="${t(o.figure)}"`}>${t(o.figure)}</dd></div>`,
                          )
                          .join('')}</dl>`
                      : ''
                  }
                  ${tagList(p, feat >= 0 ? 99 : 5)}
                  <span class="pj-go mono">read the case study<i aria-hidden="true">↗</i><b class="mono">#${commit(p.slug)}</b></span>
                </div>
              </a>
            </article>`
}

/* ------------------------------------------------------------ /projects/ */

function indexPage(): PageSpec {
  const c = SECTIONS.work
  // the stacks worth a filter chip: every tool used on more than one project
  const counts = new Map<string, { name: string; n: number }>()
  for (const p of projects)
    for (const g of p.tags) {
      const e = counts.get(g.slug) ?? { name: g.name, n: 0 }
      e.n++
      counts.set(g.slug, e)
    }
  const chips = [...counts.entries()]
    .filter(([, e]) => e.n > 1)
    .sort((a, b) => b[1].n - a[1].n || a[1].name.localeCompare(b[1].name))
    .slice(0, 10)

  const toc = projects
    .map((p, i) => {
      const m = post(p)
      const g = gallery(p)
      const feat = featOf(p.slug)
      return `
              <li class="pj-row rev" style="--i:${i}" data-slug="${p.slug}" ${feat >= 0 ? `data-cell="${feat}"` : `data-bus="${busOf(p.slug)}"`}>
                <a href="/projects/${p.slug}/">
                  <b class="mono">${pad(i + 1)}</b>
                  <span class="nm">${t(p.title)}</span>
                  <span class="meta"><span class="co mono">${t(p.company?.title ?? '')}</span><span
                    class="yr mono">${m ? t(m.short) : ''}</span><span
                    class="st mono">${p.tags.length} tools</span><span
                    class="fr mono">${g.length ? `${g.length} frames` : '—'}</span></span>
                  <i class="arw mono" aria-hidden="true">↗</i>
                </a>
              </li>`
    })
    .join('')

  const stats: [string, string, string][] = [
    [String(projects.length), 'products shipped', '2013 → now'],
    [String(COMPANIES), 'companies', 'AU · PH · remote'],
    [String(FRAMES), 'gallery frames', 'real screens'],
    ['3', 'featured', 'the current bench'],
  ]

  return {
    path: '/projects/',
    title: 'Projects',
    description: plain(c.intro),
    image: PROJECT_IMAGES[projects[1].image.url]?.fallback,
    shape: 3,
    css: ['pages-projects'],
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Projects — Felix Noriel',
      description: plain(c.intro),
      hasPart: projects.map((p) => ({
        '@type': 'CreativeWork',
        name: plain(cardTitle(p)),
        description: plain(p.excerpt),
        url: `${'https://felixnoriel-dashify.vercel.app'}/projects/${p.slug}/`,
      })),
    },
    main: `
      <section class="chapter pj-hero" id="projects" aria-labelledby="projects-title">
        <div class="inner">
          <span class="kicker mono rev">${c.index} — ${c.eyebrow} / index</span>
          <h1 id="projects-title" class="rev">${c.title}</h1>
          <p class="pj-intro rev">${c.intro}</p>
          <dl class="pj-stats rev">
            ${stats
              .map(
                ([f, l, n]) =>
                  `<div><dd class="pj-fig" data-to="${f}">${f}</dd><dt class="mono">${l}</dt><span class="mono note">${n}</span></div>`,
              )
              .join('\n            ')}
          </dl>
          <ol class="pj-toc" aria-label="Every project, newest first">${toc}
          </ol>
          <p class="pj-hint mono rev"><span>the catalogue</span><i aria-hidden="true">↓</i></p>
        </div>
      </section>

      <section class="pj-cat" id="catalogue" aria-labelledby="cat-title">
        <div class="inner">
          <header class="pj-cathead">
            <div class="rev">
              <span class="kicker mono">the catalogue</span>
              <h2 id="cat-title">Nine builds, newest first.</h2>
            </div>
            <p class="pj-showing mono" aria-live="polite" data-n="${projects.length}">showing <b>${pad(projects.length)}</b> of ${pad(projects.length)}</p>
          </header>
          <div class="pj-filter mono" role="group" aria-label="Filter the catalogue by stack">
            <button type="button" class="pj-chip on" data-tag="" aria-pressed="true">all<b>${pad(projects.length)}</b></button>
            ${chips
              .map(
                ([slug, e]) =>
                  `<button type="button" class="pj-chip" data-tag="${slug}" aria-pressed="false">${t(e.name)}<b>${pad(e.n)}</b></button>`,
              )
              .join('\n            ')}
          </div>
          <div class="pj-grid" id="pj-grid">${projects.map(card).join('')}
          </div>
          <p class="pj-empty mono" hidden>nothing in the catalogue uses that. <button type="button" class="pj-reset">show all nine</button></p>
        </div>
      </section>

      <div class="pj-pins" aria-hidden="true">
        ${FEAT.map((s, i) => {
          const p = projects.find((x) => x.slug === s)!
          return `<span class="pj-pin" data-pin="${i}"><b class="mono">${pad(featOf(s) + 1)}</b>${t(p.title)}</span>`
        }).join('\n        ')}
      </div>`,
  }
}

/* ------------------------------------------------- /projects/<slug>/ */

function galleryBlock(p: Project, g: Image[]): string {
  if (!g.length) return ''
  const cats = [...new Set(g.map((x) => x.category || ''))].filter(Boolean)
  const tiles = g
    .map((x, i) => {
      const cat = x.category || ''
      const label = x.alt && x.alt !== 'Default' ? plain(x.alt) : `Frame ${i + 1}`
      return `
              <button type="button" class="pj-tile rev" style="--i:${i % 8}" data-i="${i}" data-cat="${t(cat)}"
                data-alt="${t(label)}"${frameData(x)} aria-label="Open frame ${i + 1} of ${g.length}${cat ? ` — ${plain(cat)}` : ''} in the light-box">
                ${img(x.url, label, 'pj-th', 400, 225, '(min-width: 1180px) 260px, (min-width: 700px) 30vw, 46vw', true)}
                <span class="pj-hud" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
                <span class="pj-fno mono">F${pad(i + 1)}</span>
                ${cat ? `<span class="pj-fcat mono">${t(cat)}</span>` : ''}
                <span class="pj-open mono" aria-hidden="true">expand</span>
              </button>`
    })
    .join('')

  return `
        <section class="pj-gal" id="gallery" aria-labelledby="gal-title">
          <header class="pj-galhead">
            <h2 id="gal-title" class="rev"><span class="kicker mono">gallery</span>${g.length} frames from the build</h2>
            ${
              cats.length
                ? `<div class="pj-tabs mono" role="group" aria-label="Filter the gallery">
              <button type="button" class="pj-tab on" data-cat="" aria-pressed="true">all<b>${pad(g.length)}</b></button>
              ${cats
                .map(
                  (c) =>
                    `<button type="button" class="pj-tab" data-cat="${t(c)}" aria-pressed="false">${t(c)}<b>${pad(g.filter((x) => (x.category || '') === c).length)}</b></button>`,
                )
                .join('\n              ')}
            </div>`
                : ''
            }
          </header>
          <div class="pj-tiles">${tiles}
          </div>
        </section>

        <dialog class="pj-lb" id="pj-lb" aria-label="${t(plain(p.title))} gallery">
          <div class="pj-lb-bar mono">
            <span class="pj-lb-n"><b>01</b><span class="sl">/</span>${pad(g.length)}</span>
            <span class="pj-lb-cap"></span>
            <span class="pj-lb-keys" aria-hidden="true"><kbd>←</kbd><kbd>→</kbd><kbd>esc</kbd></span>
            <button type="button" class="pj-lb-x" aria-label="Close the light-box">✕</button>
          </div>
          <figure class="pj-lb-fig">
            <picture class="pj-lb-pic"><img alt="" width="1600" height="900" decoding="async"></picture>
          </figure>
          <button type="button" class="pj-lb-go prev" aria-label="Previous frame">‹</button>
          <button type="button" class="pj-lb-go next" aria-label="Next frame">›</button>
          <div class="pj-lb-rail" aria-hidden="true"></div>
        </dialog>`
}

function detailPage(p: Project, i: number): PageSpec {
  const m = post(p)
  const g = gallery(p)
  const feat = featOf(p.slug)
  const prev = projects[(i - 1 + projects.length) % projects.length]
  const next = projects[(i + 1) % projects.length]
  const hash = commit(p.slug)
  const read = minutes(p.content)
  const career = careers.find((k) => k.slug === p.company?.slug)
  const logo = career && IMAGES[career.image.url] ? career.image.url : ''

  // the write-up, verbatim: its own headings become link targets
  const body = tidyProse(p.content).replace(/<h3>([\s\S]*?)<\/h3>/g, (_, inner: string) => {
    const id = slugify(inner)
    return `<h3 id="${id}"><a class="pj-hash" href="#${id}" aria-label="Link to this section">#</a>${inner}</h3>`
  })
  const heads = [...p.content.matchAll(/<h3>([\s\S]*?)<\/h3>/g)].map((x) => plain(x[1]))

  const chip = (k: string, v: string) => `<span class="pj-chip2"><b class="mono">${k}</b><span>${v}</span></span>`

  const nav = (dir: 'prev' | 'next', o: Project) => `
            <a class="pj-nx ${dir}" href="/projects/${o.slug}/">
              <span class="mono">${dir === 'prev' ? '← previous build' : 'next build →'}</span>
              <strong>${t(o.title)}</strong>
              <span class="mono sm">/projects/${o.slug}/</span>
            </a>`

  return {
    path: `/projects/${p.slug}/`,
    title: plain(p.title),
    description: clip(p.excerpt, 155),
    image: IMAGES[p.image.url]?.fallback,
    type: 'article',
    shape: 3,
    css: ['pages-projects'],
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      name: plain(p.title),
      description: plain(p.excerpt),
      author: { '@type': 'Person', name: 'Felix Noriel' },
      keywords: p.tags.map((x) => plain(x.name)).join(', '),
      ...(p.company ? { publisher: { '@type': 'Organization', name: plain(p.company.title) } } : {}),
    },
    main: `
      <article class="pj-case" data-project="${p.slug}" ${feat >= 0 ? `data-cell="${feat}"` : `data-bus="${busOf(p.slug)}"`}>
        <section class="chapter pj-top" aria-labelledby="case-title">
          <div class="inner">
            <nav class="pj-crumb mono" aria-label="Breadcrumb">
              <a class="back" href="/projects/"><i aria-hidden="true">←</i>all projects</a>
              <span class="pos"><span>build</span><b>${pad(i + 1)}</b><span class="sl">/</span>${pad(projects.length)}</span>
              <span class="hash">#${hash}</span>
              <span class="pn">
                <a href="/projects/${prev.slug}/" title="${t(plain(prev.title))}" aria-label="Previous project: ${t(plain(prev.title))}">‹</a>
                <a href="/projects/${next.slug}/" title="${t(plain(next.title))}" aria-label="Next project: ${t(plain(next.title))}">›</a>
              </span>
            </nav>
            <span class="kicker mono rev">${m ? `${t(p.company?.title ?? '')} — ${t(m.role)}` : t(p.company?.title ?? 'case file')}</span>
            <h1 id="case-title" class="rev">${t(p.title)}</h1>
            <p class="pj-lede rev">${t(p.excerpt)}</p>
            <div class="pj-chips rev">
              ${p.company ? chip('client', `<a href="/career/${p.company.slug}/">${t(p.company.title)}</a>`) : ''}
              ${m ? chip('when', t(m.when)) : ''}
              ${m ? chip('where', t(m.location)) : ''}
              ${chip('stack', `${p.tags.length} tools`)}
              ${g.length ? chip('frames', `${g.length}`) : ''}
              ${chip('read', `~${read} min`)}
            </div>
            <p class="pj-hint mono rev"><span>the build</span><i aria-hidden="true">↓</i></p>
          </div>
        </section>

        <div class="pj-main">
          <section class="pj-screenwrap" aria-label="${t(plain(p.title))} — screen">
            <div class="pj-screen${p.slug === 'stable' ? ' drawn' : ''}">
              <div class="pj-screen-bar mono">
                <span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>
                <span class="path">~/projects/${p.slug}/${p.slug === 'stable' ? 'rail.svg' : 'hero.png'}</span>
                <span class="right">${p.slug === 'stable' ? 'vector · drawn' : `${IMAGES[p.image.url]?.width ?? p.image.width ?? ''}×${IMAGES[p.image.url]?.height ?? p.image.height ?? ''}`}<b>#${hash}</b></span>
              </div>
              ${
                p.slug === 'stable'
                  ? `<div class="pj-screen-in">${payScreen()}</div>`
                  : `<${g.length ? 'button type="button" class="pj-screen-in open" data-i="0" aria-label="Open the gallery"' : 'div class="pj-screen-in"'}>${img(
                      p.image.url,
                      p.image.alt || plain(p.title),
                      'pj-hero-img',
                      1600,
                      900,
                      '(min-width: 1180px) 1060px, 100vw',
                    )}<span class="pj-hud" aria-hidden="true"><i></i><i></i><i></i><i></i></span>${g.length ? '<span class="pj-open mono">open the gallery</span>' : ''}</${g.length ? 'button' : 'div'}>`
              }
            </div>
          </section>

          <nav class="pj-sub mono" aria-label="On this page">
            <a href="#overview" class="on">overview</a>
            ${heads.map((h) => `<a href="#${slugify(h)}">${t(h.toLowerCase())}</a>`).join('\n            ')}
            ${g.length ? '<a href="#gallery">gallery</a>' : ''}
            <a href="#more">next</a>
          </nav>

          <div class="pj-cols">
            <section class="pj-doc" id="overview" aria-label="The write-up">
              <div class="pj-doc-bar mono">
                <span>~/projects/${p.slug}/README.md</span>
                <span class="right">${plain(p.content).split(/\s+/).length} words<b>~${read} min</b></span>
              </div>
              <div class="pj-prose rev">${body}</div>
              <div class="pj-doc-foot mono"><span>— EOF —</span><span>#${hash}</span></div>
            </section>

            <aside class="pj-side">
              <div class="pj-panel rev" id="stack">
                <p class="pj-panel-h mono"><span>stack.matrix</span><b>${pad(p.tags.length)}</b></p>
                <ul class="pj-matrix mono">${p.tags
                  .map((x, k) => `<li><b>[${pad(k).toUpperCase()}]</b>${t(x.name)}</li>`)
                  .join('')}</ul>
              </div>
              ${
                career
                  ? `<div class="pj-panel rev">
                <p class="pj-panel-h mono"><span>the team</span></p>
                <a class="pj-co" href="/career/${career.slug}/">
                  ${logo ? img(logo, `${plain(career.title)} logo`, 'pj-co-logo', 160, 48, '160px', true) : ''}
                  <strong>${t(career.title)}</strong>
                  <span class="mono">${t(career.jobTitle)}</span>
                  <span class="mono sm">${t(career.startDate)} → ${t(career.endDate)} · ${t(career.location)}</span>
                  <span class="pj-co-go mono">the role<i aria-hidden="true">↗</i></span>
                </a>
              </div>`
                  : ''
              }
              <div class="pj-panel rev">
                <p class="pj-panel-h mono"><span>build.spec</span></p>
                <dl class="pj-spec mono">
                  <div><dt>index</dt><dd>${pad(i + 1)} / ${pad(projects.length)}</dd></div>
                  <div><dt>id</dt><dd class="lit">#${hash}</dd></div>
                  <div><dt>stack</dt><dd>${p.tags.length} tools</dd></div>
                  <div><dt>frames</dt><dd>${g.length || '—'}</dd></div>
                  <div><dt>core</dt><dd class="lit">${feat >= 0 ? `cell ${pad(feat + 1)}` : `bus ${pad(busOf(p.slug) + 1)}`}</dd></div>
                </dl>
              </div>
            </aside>
          </div>
${galleryBlock(p, g)}

          <section class="pj-more" id="more" aria-label="More projects">
            <div class="pj-nxs">${nav('prev', prev)}${nav('next', next)}</div>
            <a class="cta ghost glass pj-all" href="/projects/">all ${projects.length} projects<span class="arw" aria-hidden="true">→</span></a>
          </section>
        </div>
      </article>`,
  }
}

export function projectPages(): PageSpec[] {
  return [indexPage(), ...projects.map((p, i) => detailPage(p, i))]
}
