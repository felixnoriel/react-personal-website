/**
 * CAREER — the index (/career/) and the nine role pages (/career/<slug>/).
 *
 * The index is the whole record on one axis: nine tenures drawn against the
 * years they actually ran (so the overlaps — Dashify running under Zookal,
 * Genopets and Stable — are visible rather than claimed), then nine full
 * records with every achievement, every badge, every tool and every date.
 * A role page is that one seat in full: the prose the role shipped with, its
 * highlights, its stack, the products that came out of it, and the same axis
 * in miniature so the visitor always knows where they are standing.
 *
 * The core holds the orbit (shape 2) on all ten pages, and a role page pulls
 * the swarm to that role's knot — the sculpture and the page are the same
 * nine objects seen twice.
 *
 * This module runs at BUILD time, so it may import the heavy datasets.
 */
import type { PageSpec } from '../layout'
import { SITE, tidyProse } from '../layout'
import { SECTIONS } from '../../../shared/content'
import { careers, projects } from '../../../shared/data'
import { NOW_M, ROLE_SPANS, ringRadius } from '../../shapes/orbit'
import type { Career, Project } from '../../../shared/data'

/* ------------------------------------------------------------------ text */

/** the datasets carry WordPress entities; the page wants real characters */
const dec = (s: string) =>
  s
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
/** decode, then escape: safe in text and in attributes */
const t = (s: string) => esc(dec(s))
const strip = (html: string) => dec(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim()
const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s)

/** 9 → "9 mo", 42 → "3 yr 6 mo" */
function duration(m: number): string {
  if (m < 12) return `${m} mo`
  const y = Math.floor(m / 12)
  const r = m % 12
  return r ? `${y} yr ${r} mo` : `${y} yr`
}

/** the old site's estimate: 220 words a minute, at least one */
const readingMinutes = (html: string) => Math.max(1, Math.ceil(strip(html).split(/\s+/).filter(Boolean).length / 220))

/** several excerpts in the dataset are truncated stubs — those are not copy */
const realExcerpt = (s?: string) => (s && s.length > 46 && !s.endsWith('...') ? dec(s) : '')

/** the identity chip that stands in for a logo that never arrives */
const initials = (s: string) =>
  s
    .split(/\s+/)
    .filter((w) => !/^(the|of|and|a)$/i.test(w))
    .map((w) => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase()

/* ----------------------------------------------------------------- icons */

/** one small sprite, drawn once per page and referenced by every highlight */
const GLYPH: Record<string, string> = {
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M10.7 18.6h2.6"/>',
  card: '<rect x="2.5" y="5.5" width="19" height="13" rx="2.5"/><path d="M2.5 10.5h19"/>',
  server:
    '<rect x="3" y="3.5" width="18" height="7" rx="2"/><rect x="3" y="13.5" width="18" height="7" rx="2"/><path d="M6.8 7h.02M6.8 17h.02"/>',
  cloud: '<path d="M7 18.5h10a4 4 0 0 0 .6-7.96A6 6 0 0 0 5.9 11.6 3.5 3.5 0 0 0 7 18.5Z"/>',
  shield: '<path d="M12 2.8 4.5 6v6c0 4.4 3.1 7.9 7.5 9.2 4.4-1.3 7.5-4.8 7.5-9.2V6Z"/>',
  chart: '<path d="M3.5 20.5h17"/><path d="M7 20.5V11M12 20.5V4.5M17 20.5v-6"/>',
  bolt: '<path d="M13 2.2 5 13.6h6L10.6 21.8 19 10.4h-6Z"/>',
  mail: '<rect x="2.5" y="5" width="19" height="14" rx="2.4"/><path d="m3.6 7 8.4 6 8.4-6"/>',
  rocket:
    '<path d="M12 2.5c3.4 2.4 5.2 6 5.2 10.2L12 17.5 6.8 12.7C6.8 8.5 8.6 4.9 12 2.5Z"/><path d="M9.4 17.2c-1.7.9-2.6 2.5-2.6 4.3 1.9 0 3.4-.9 4.3-2.5M14.6 17.2c1.7.9 2.6 2.5 2.6 4.3-1.9 0-3.4-.9-4.3-2.5"/><circle cx="12" cy="9.8" r="1.7"/>',
  target: '<circle cx="12" cy="12" r="8.6"/><circle cx="12" cy="12" r="4.4"/><circle cx="12" cy="12" r=".6"/>',
  cart:
    '<path d="M2.5 3.5h2.6l2.4 11.2h9.6l2.1-8H6.4"/><circle cx="9.6" cy="19.3" r="1.5"/><circle cx="17" cy="19.3" r="1.5"/>',
  code: '<path d="m8.5 8-5 4 5 4M15.5 8l5 4-5 4M13.6 4.4l-3.2 15.2"/>',
  users:
    '<path d="M15.5 20.2v-1.8a4 4 0 0 0-4-4h-4a4 4 0 0 0-4 4v1.8"/><circle cx="9.5" cy="7.4" r="3.4"/><path d="M21 20.2v-1.8a4 4 0 0 0-3-3.87M16.2 4.2a4 4 0 0 1 0 7.4"/>',
  db: '<ellipse cx="12" cy="5.8" rx="7.5" ry="3.3"/><path d="M4.5 5.8v12.4c0 1.8 3.4 3.3 7.5 3.3s7.5-1.5 7.5-3.3V5.8"/><path d="M4.5 12c0 1.8 3.4 3.3 7.5 3.3s7.5-1.5 7.5-3.3"/>',
  wrench:
    '<path d="M15.6 4.4a5.5 5.5 0 0 0-7.2 7.2l-5 5a2.1 2.1 0 0 0 3 3l5-5a5.5 5.5 0 0 0 7.2-7.2l-3 3-2.9-.7-.7-2.9Z"/>',
  check: '<circle cx="12" cy="12" r="8.6"/><path d="m8.2 12.2 2.6 2.6 5-5.4"/>',
  layers: '<path d="m12 3 8.5 4.5L12 12 3.5 7.5Z"/><path d="m3.5 12 8.5 4.5 8.5-4.5M3.5 16.6 12 21l8.5-4.4"/>',
  bug: '<rect x="8" y="7" width="8" height="12" rx="4"/><path d="M8 11H4.5M16 11h3.5M8 15.5H4.5M16 15.5h3.5M9.6 7.2 8.2 4.6M14.4 7.2l1.4-2.6"/>',
  book:
    '<path d="M3.5 4.5h5.2c1.8 0 3.3 1.4 3.3 3.2V20a2.6 2.6 0 0 0-2.6-2.4H3.5Z"/><path d="M20.5 4.5h-5.2A3.3 3.3 0 0 0 12 7.7V20a2.6 2.6 0 0 1 2.6-2.4h5.9Z"/>',
  dot: '<circle cx="12" cy="12" r="3.4"/>',
}
/** the dataset names its icons the way the old site's icon set did */
const ICON: Record<string, string> = {
  Smartphone: 'phone',
  Banknote: 'card',
  CreditCard: 'card',
  Server: 'server',
  Cloud: 'cloud',
  Shield: 'shield',
  BarChart3: 'chart',
  Zap: 'bolt',
  Mail: 'mail',
  Rocket: 'rocket',
  Target: 'target',
  ShoppingCart: 'cart',
  Code: 'code',
  Code2: 'code',
  FileCode: 'code',
  Users: 'users',
  Database: 'db',
  Wrench: 'wrench',
  CheckCircle: 'check',
  Layers: 'layers',
  Bug: 'bug',
  BookOpen: 'book',
}
const glyphOf = (icon?: string) => (icon && ICON[icon]) || 'dot'
const icon = (name: string) => `<svg class="ic" aria-hidden="true"><use href="#i-${name}"/></svg>`
/** only the symbols a page actually uses are emitted */
function sprite(names: string[]): string {
  const uniq = [...new Set(names)].filter((n) => GLYPH[n])
  if (!uniq.length) return ''
  return `
        <svg class="cr-sprite" aria-hidden="true" focusable="false" width="0" height="0">${uniq
          .map((n) => `<symbol id="i-${n}" viewBox="0 0 24 24">${GLYPH[n]}</symbol>`)
          .join('')}</svg>`
}

/* ------------------------------------------------------------- the axis */

/* every bar is drawn against the same decade, so the lengths are comparable
   and the overlaps are real rather than a layout accident */
const AXIS0 = 2013 * 12
const AXIS1 = NOW_M + 3
const SPAN = AXIS1 - AXIS0
const pct = (m: number) => ((m - AXIS0) / SPAN) * 100
const YEAR_TICKS = [2014, 2016, 2018, 2020, 2022, 2024, 2026]

const LONGEST = Math.max(...ROLE_SPANS.map((s) => s.months))
const ACHIEVEMENTS = careers.reduce((n, c) => n + (c.achievements?.length ?? 0), 0)
const RUNNING = ROLE_SPANS.filter((s) => s.current).length
const YEARS = Math.floor((NOW_M - Math.min(...ROLE_SPANS.map((s) => s.start))) / 12)

const related = (slug: string): Project[] => projects.filter((p) => p.company?.slug === slug)

/**
 * The decade axis. `mode` decides what a lane does: on the index it jumps to
 * that role's record on the same page, on a role page it navigates to the
 * next seat — so the map is also the site's navigation.
 */
function axis(mode: 'index' | 'mini', current = -1): string {
  const lanes = careers
    .map((c, i) => {
      const s = ROLE_SPANS[i]
      const href = mode === 'index' ? `#r-${esc(c.slug)}` : `/career/${esc(c.slug)}/`
      const here = i === current
      const label = `${dec(c.title)} — ${dec(c.jobTitle)}, ${c.startDate} to ${c.endDate}, ${duration(s.months)}`
      return `
              <li class="ax-row" style="--i:${i}">
                <a class="ax-lane${s.current ? ' now' : ''}${here ? ' here' : ''}" href="${href}" data-role="${i}"
                  ${here ? 'aria-current="page" ' : ''}aria-label="${esc(label)}">
                  <span class="ax-co">${t(c.title)}</span>
                  <span class="ax-track"
                    ><i style="--a:${pct(s.start).toFixed(2)}%;--w:${((s.months / SPAN) * 100).toFixed(2)}%"
                      ><em class="mono">${t(c.startDate)} → ${t(c.endDate)}</em></i
                    ></span
                  >
                  <span class="ax-len mono">${duration(s.months)}</span>
                </a>
              </li>`
    })
    .join('')
  return `
        <figure class="cr-axis${mode === 'mini' ? ' mini' : ''} rev" style="--now:${pct(NOW_M).toFixed(2)}%">
          <figcaption class="mono">
            <span>${mode === 'mini' ? 'the whole record' : 'the decade on one axis'}</span
            ><span>2013 → now</span>
          </figcaption>
          <div class="ax-scale mono" aria-hidden="true">
            <span class="ax-co"></span>
            <span class="ax-track">${YEAR_TICKS.map((y) => `<b style="--a:${pct(y * 12).toFixed(2)}%">${y}</b>`).join(
              '',
            )}<u style="--a:${pct(NOW_M).toFixed(2)}%"></u></span>
            <span class="ax-len"></span>
          </div>
          <ol class="ax-rows">${lanes}
          </ol>
        </figure>`
}

/* ------------------------------------------------------------- the index */

function record(c: Career, i: number): string {
  const s = ROLE_SPANS[i]
  const blurb = realExcerpt(c.excerpt)
  const rel = related(c.slug)
  const ach = (c.achievements ?? [])
    .map(
      (a) => `
                    <li>
                      <span class="ach-ic" aria-hidden="true">${icon(glyphOf(a.icon))}</span>
                      <span class="ach-b"
                        ><b>${t(a.title)}</b>${a.badge ? `<em class="mono">${t(a.badge)}</em>` : ''}
                        <span>${t(a.description)}</span></span
                      >
                    </li>`,
    )
    .join('')
  const tech = (c.techStack ?? []).map((x) => `<li>${t(x)}</li>`).join('')
  const name = `${dec(c.title)} — ${dec(c.jobTitle)}, ${c.startDate} to ${c.endDate}`
  return `
              <li class="cr-rec rev" id="r-${esc(c.slug)}" data-role="${i}"
                style="--t:${(s.months / LONGEST).toFixed(3)};--r:${(ringRadius(i) / 1.2).toFixed(3)}">
                <span class="cr-mark" aria-hidden="true"><i></i></span>
                <article class="cr-card">
                  <div class="cr-top">
                    <span class="cr-ix mono">${String(i + 1).padStart(2, '0')}</span>
                    <span class="cr-logo"
                      ><b class="cr-chip mono">${initials(dec(c.title))}</b
                      ><img src="${esc(c.image.url)}" alt="" style="background:none" loading="lazy" decoding="async"
                    /></span>
                    ${s.current ? '<span class="cr-live mono"><i class="dot"></i>current</span>' : ''}
                  </div>
                  <h2 class="cr-co"><a href="/career/${esc(c.slug)}/" aria-label="${esc(name)}"><span data-vt="title">${t(
                    c.title,
                  )}</span></a></h2>
                  <p class="cr-job">${t(c.jobTitle)}</p>
                  <ul class="cr-meta mono">
                    <li>${t(c.startDate)} → ${t(c.endDate)}</li>
                    <li>${duration(s.months)}</li>
                    <li>${t(c.location)}</li>
                  </ul>
                  <span class="cr-bar" aria-hidden="true"><i></i></span>
                  ${blurb ? `<p class="cr-sum">${esc(blurb)}</p>` : ''}
                  <ul class="cr-ach">${ach}
                  </ul>
                  <ul class="tags mono">${tech}</ul>
                  <p class="cr-foot mono">
                    <span class="cr-open">open the role <span class="arw" aria-hidden="true">↗</span></span>
                    ${
                      rel.length
                        ? `<span class="cr-ships">${rel.length} shipped from this seat · ${rel
                            .map((p) => t(p.title))
                            .join(' · ')}</span>`
                        : ''
                    }
                  </p>
                </article>
              </li>`
}

function indexPage(): PageSpec {
  const c = SECTIONS.experience
  const stat = (v: number, suffix: string, label: string) => `
              <div class="cr-stat">
                <dt class="mono">${label}</dt>
                <dd><span data-crcount="${v}">${v}</span>${suffix}</dd>
              </div>`
  const glyphs = careers.flatMap((r) => (r.achievements ?? []).map((a) => glyphOf(a.icon)))
  return {
    path: '/career/',
    title: 'Experience',
    description:
      'The full record: nine roles across Web3, fintech, hospitality, education and publishing — every tenure, highlight and stack, on one timeline.',
    shape: 2,
    css: ['pages-career'],
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Felix Noriel — experience',
      itemListOrder: 'https://schema.org/ItemListOrderDescending',
      numberOfItems: careers.length,
      itemListElement: careers.map((r, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: `${dec(r.jobTitle)}, ${dec(r.title)}`,
        url: `${SITE.url}${SITE.base}/career/${r.slug}/`,
      })),
    },
    main: `
      <section class="cr" id="experience" aria-labelledby="career-title">
        <div class="chapter cr-head">
          <div class="inner">
            <span class="kicker mono rev">career.log — the full record</span>
            <h1 class="rev" id="career-title">${c.title}</h1>
            <p class="rev">${c.intro}</p>
            <dl class="cr-stats rev">${stat(YEARS, '+', 'years shipping')}${stat(careers.length, '', 'roles')}${stat(
              ACHIEVEMENTS,
              '',
              'highlights',
            )}${stat(RUNNING, '', 'still running')}
            </dl>
            <p class="cr-up mono rev"><a href="/">← back to the signal</a></p>
          </div>
        </div>

        <div class="cr-body">
          ${axis('index')}
          <ol class="cr-recs">${careers.map((r, i) => record(r, i)).join('')}
          </ol>
          <nav class="cr-end mono" aria-label="More">
            <a class="cta ghost glass" href="/projects/">the products <span class="arw" aria-hidden="true">↗</span></a>
            <a class="cta ghost glass" href="/">back to the signal <span class="arw" aria-hidden="true">↗</span></a>
          </nav>
        </div>
        ${sprite(glyphs)}
      </section>`,
  }
}

/* ------------------------------------------------------- the role pages */

/** the CMS bodies are hand-written HTML; two of them carry a stray closer */
function repairProse(html: string): string {
  return html
    .replace(/^\s*<\/(h[1-6]|p|li|ul)>\s*/i, '')
    .replace(/<p>([^<]*)<\/h[1-6]>/gi, '<p>$1</p>')
    .replace(/<a\b(?![^>]*\brel=)([^>]*\btarget="_blank")/gi, '<a rel="noopener"$1')
}

/** headings become link targets, so a long role can be pointed at */
function anchorHeadings(html: string, used: Set<string>): string {
  return html.replace(/<(h[23])>([\s\S]*?)<\/\1>/gi, (_m, tag: string, inner: string) => {
    const base =
      strip(inner)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 44) || 'section'
    let id = base
    let n = 2
    while (used.has(id)) id = `${base}-${n++}`
    used.add(id)
    return `<${tag} id="${id}">${inner}</${tag}>`
  })
}

function projectCard(p: Project): string {
  const tags = (p.tags ?? []).slice(0, 5).map((x) => `<li>${t(x.name)}</li>`).join('')
  /* Every screenshot in the dataset is a CMS URL the renderer localizes. A
     bare local path is a file this site does not have (StablePay ships no
     screenshot), so that card gets a plate drawn in the palette instead of a
     request that can only 404. */
  const shot = p.image?.url?.startsWith('http')
    ? `<span class="cd-shot"><img src="${esc(p.image.url)}" alt="" loading="lazy" decoding="async" /></span>`
    : `<span class="cd-shot cd-plate" aria-hidden="true"><b class="mono">${initials(dec(p.title))}</b></span>`
  return `
                <li class="cd-proj rev">
                  <a href="/projects/${esc(p.slug)}/">
                    ${shot}
                    <span class="cd-pbody">
                      <b>${t(p.title)}</b>
                      <span class="cd-pex">${clip(strip(p.excerpt || p.content), 132)}</span>
                      <ul class="tags mono">${tags}</ul>
                    </span>
                  </a>
                </li>`
}

function rolePage(c: Career, i: number): PageSpec {
  const s = ROLE_SPANS[i]
  const rel = related(c.slug)
  const prose = c.content ? anchorHeadings(tidyProse(repairProse(c.content)), new Set<string>()) : ''
  const blurb = realExcerpt(c.excerpt)
  const prev = careers[i - 1]
  const next = careers[i + 1]
  const title = `${dec(c.jobTitle)}, ${dec(c.title)}`
  const summary =
    blurb ||
    (prose ? clip(strip(prose), 158) : '') ||
    `${dec(c.jobTitle)} at ${dec(c.title)}, ${c.startDate} – ${c.endDate}, ${dec(c.location)}.`

  const ach = (c.achievements ?? [])
    .map(
      (a, k) => `
              <li class="hl rev" data-hl="${k}">
                <span class="hl-ic" aria-hidden="true">${icon(glyphOf(a.icon))}</span>
                <b>${t(a.title)}</b>
                ${a.badge ? `<em class="mono">${t(a.badge)}</em>` : ''}
                <span>${t(a.description)}</span>
              </li>`,
    )
    .join('')

  const chip = (label: string, value: string) =>
    `<li><b>${label}</b><span>${value}</span></li>`

  return {
    path: `/career/${c.slug}/`,
    title,
    description: clip(summary, 158),
    image: c.banner?.url || c.image.url,
    shape: 2,
    css: ['pages-career'],
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE.url}${SITE.base}/` },
        { '@type': 'ListItem', position: 2, name: 'Experience', item: `${SITE.url}${SITE.base}/career/` },
        { '@type': 'ListItem', position: 3, name: title, item: `${SITE.url}${SITE.base}/career/${c.slug}/` },
      ],
    },
    main: `
      <article class="cd" id="experience" data-role="${i}" data-slug="${esc(c.slug)}" aria-labelledby="role-title">
        <div class="chapter cd-head">
          <div class="inner">
            <nav class="cd-crumb mono rev" aria-label="Breadcrumb">
              <a href="/career/"><span class="arw" aria-hidden="true">←</span> cd ../career</a>
            </nav>
            <span class="kicker mono rev">career.log · role ${String(i + 1).padStart(2, '0')} of ${String(
              careers.length,
            ).padStart(2, '0')}</span>
            <h1 class="rev" id="role-title">${t(c.jobTitle)},<br /><span class="cd-co">${t(c.title)}</span></h1>
            <p class="cd-sum rev">${esc(summary)}</p>
            <ul class="cd-meta mono rev">
              ${chip('tenure', `${t(c.startDate)} – ${t(c.endDate)}`)}
              ${chip('length', duration(s.months))}
              ${chip('loc', t(c.location))}
              ${prose ? chip('read', `~${readingMinutes(prose)} min`) : ''}
              ${rel.length ? chip('projects', String(rel.length)) : ''}
              ${s.current ? '<li class="on"><b>status</b><span><i class="dot"></i>current</span></li>' : ''}
            </ul>
            <span class="cd-id rev"
              ><b class="cr-chip mono">${initials(dec(c.title))}</b
              ><img src="${esc(c.image.url)}" alt="${t(c.image.alt || c.title)}" style="background:none" loading="lazy" decoding="async"
            /></span>
          </div>
        </div>

        <div class="cd-body">
          ${
            ach
              ? `<section class="cd-block" aria-labelledby="hl-title">
            <h2 class="kicker mono rev" id="hl-title">— highlights</h2>
            <ol class="cd-hls">${ach}
            </ol>
          </section>`
              : ''
          }

          ${
            prose
              ? `<section class="cd-block" aria-labelledby="ov-title">
            <h2 class="kicker mono rev" id="ov-title">— overview</h2>
            <div class="cd-file rev">
              <div class="cd-fname mono"><span class="cd-dots" aria-hidden="true"><i></i><i></i><i></i></span><span
                ><em>~/career/</em>${esc(c.slug)}<em>/role.md</em></span
              ></div>
              <div class="prose">${prose}</div>
            </div>
          </section>`
              : ''
          }

          ${
            c.techStack?.length
              ? `<section class="cd-block" aria-labelledby="st-title">
            <h2 class="kicker mono rev" id="st-title">— stack</h2>
            <ul class="tags mono rev cd-stack">${c.techStack.map((x) => `<li>${t(x)}</li>`).join('')}</ul>
          </section>`
              : ''
          }

          ${
            rel.length
              ? `<section class="cd-block" aria-labelledby="pr-title">
            <h2 class="kicker mono rev" id="pr-title">— shipped from this seat · ${String(rel.length).padStart(
              2,
              '0',
            )} ${rel.length === 1 ? 'mission' : 'missions'}</h2>
            <ul class="cd-projs">${rel.map((p) => projectCard(p)).join('')}
            </ul>
          </section>`
              : ''
          }

          <section class="cd-block" aria-labelledby="ax-title">
            <h2 class="kicker mono rev" id="ax-title">— where this sits</h2>
            ${axis('mini', i)}
          </section>

          <nav class="cd-nav mono" aria-label="Roles">
            ${
              prev
                ? `<a class="cd-prev" href="/career/${esc(prev.slug)}/" rel="prev"
              ><b><span class="arw" aria-hidden="true">←</span> newer</b><span>${t(prev.title)}</span></a>`
                : '<span class="cd-none"></span>'
            }
            <a class="cd-all" href="/career/">all nine roles</a>
            ${
              next
                ? `<a class="cd-next" href="/career/${esc(next.slug)}/" rel="next"
              ><b>older <span class="arw" aria-hidden="true">→</span></b><span>${t(next.title)}</span></a>`
                : '<span class="cd-none"></span>'
            }
          </nav>
        </div>
        ${sprite((c.achievements ?? []).map((a) => glyphOf(a.icon)))}
      </article>`,
  }
}

export function careerPages(): PageSpec[] {
  return [indexPage(), ...careers.map((c, i) => rolePage(c, i))]
}
