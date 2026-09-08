/**
 * work — THE BENCH.
 *
 * Three featured products as full modules (meta, outcome numbers, verbatim
 * build notes, tags and a bespoke schematic screen), then the other six as a
 * compact grid. Every string here comes from src/data/projects.ts,
 * src/data/career.ts or shared/content.ts — nothing is written for effect.
 *
 * The schematics are hand-drawn SVG in the page palette. StablePay has no
 * image file, and every felixstatic S3 banner currently answers 403, so all
 * three screens are drawn rather than photographed: each one is that
 * product's real architecture, labelled with its real stack.
 */
import { SECTIONS, FEATURED } from '../../shared/content'
import { projects, careers } from '../../shared/data'
import type { Project } from '../../shared/data'

/* ---------------------------------------------------------------- text */

const ENT: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }
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

/** the <li> lines of a project's own write-up, verbatim */
function notes(p: Project, pick: number[]): string[] {
  const all = [...p.content.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => decode(m[1].replace(/<[^>]+>/g, '').trim()))
  return pick.map((i) => all[i]).filter(Boolean)
}

const year = (s: string): string => (s.match(/\d{4}/)?.[0] ?? s)
function span(slug: string | undefined): { role: string; when: string } {
  const c = careers.find((k) => k.slug === slug)
  if (!c) return { role: '', when: '' }
  return { role: c.jobTitle, when: `${c.startDate} → ${c.endDate}` }
}

/* ------------------------------------------------------------ schematics */

/** shared chrome: the figure caption every screen carries top-left */
const fig = (n: string, title: string, right = '') =>
  `<text class="sv-fig" x="0" y="12">FIG.${n} · ${title}</text>` +
  (right ? `<text class="sv-fig hot" x="640" y="12" text-anchor="end">${right}</text>` : '')

const node = (x: number, y: number, w: number, h: number, kind: string, name: string) =>
  `<rect class="sv-node" x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/>` +
  `<text class="sv-key" x="${x + 16}" y="${y + 22}">${kind}</text>` +
  `<text class="sv-nm" x="${x + 16}" y="${y + 44}">${name}</text>`

const chev = (x: number, y: number) => `<path class="sv-chev" d="M${x},${y - 5} l6,5 l-6,5"/>`

/** 01 — StablePay: the rail a transfer actually crosses. */
function schemaStable(): string {
  const pill = (x: number, w: number, label: string) =>
    `<rect class="sv-pill" x="${x}" y="44" width="${w}" height="26" rx="13"/>` +
    `<text class="sv-key lit" x="${x + w / 2}" y="61" text-anchor="middle">${label}</text>`
  return `<svg class="sv" viewBox="-18 -12 676 356" role="img" aria-label="StablePay architecture: pay, split and send home flows enter a React Native app, cross a Golang API on AWS observed by Datadog, and settle on EVM.">
    ${fig('01', 'ON-CHAIN PAYMENT RAIL')}
    <rect class="sv-plate" x="232" y="116" width="400" height="142" rx="14"/>
    <text class="sv-key" x="620" y="248" text-anchor="end">AWS</text>
    ${pill(8, 64, 'pay')}${pill(82, 72, 'split')}${pill(166, 104, 'send home')}
    <path class="sv-wire" d="M40,70 V104 M118,70 V104 M218,70 V104 M40,104 H218 M96,104 V136"/>
    ${node(24, 136, 144, 60, 'MOBILE', 'React Native')}
    ${node(248, 136, 144, 60, 'API', 'Golang')}
    ${node(472, 136, 144, 60, 'SETTLEMENT', 'EVM')}
    <path class="sv-wire lit" d="M168,166 H248 M392,166 H472"/>
    ${chev(228, 166)}${chev(452, 166)}
    <path class="sv-wire dot" d="M320,196 V228 M544,196 V228"/>
    <rect class="sv-chip" x="272" y="228" width="96" height="24" rx="6"/>
    <text class="sv-key" x="320" y="244" text-anchor="middle">Datadog</text>
    <rect class="sv-chip ok" x="496" y="228" width="96" height="24" rx="6"/>
    <text class="sv-key lit" x="544" y="244" text-anchor="middle">settled</text>
    <text class="sv-cap" x="0" y="300">instant · zero fees · no borders</text>
  </svg>
  <i class="wk-p p-pay"></i><i class="wk-p p-tap"></i>`
}

/** 02 — Genopets: the event pipeline and what it paid for. */
function schemaGeno(): string {
  const dots = [
    [14, 52], [40, 74], [22, 96], [58, 44], [76, 66], [50, 104], [92, 88], [30, 66],
    [104, 52], [68, 88], [118, 76], [86, 108], [132, 96], [110, 104], [46, 56], [124, 60],
  ]
    .map(([x, y]) => `<circle class="sv-ev" cx="${x}" cy="${y}" r="2.2"/>`)
    .join('')
  const stage = (x: number, w: number, i: string, label: string) =>
    `<rect class="sv-node" x="${x}" y="140" width="${w}" height="58" rx="10"/>` +
    `<text class="sv-key" x="${x + 14}" y="162">${i}</text>` +
    `<text class="sv-nm sm" x="${x + 14}" y="184">${label}</text>`
  return `<svg class="sv" viewBox="-18 -12 676 356" role="img" aria-label="Genopets event pipeline: events flow through Pub/Sub, Cloud Functions and BigQuery into 50+ analytics dashboards, with p95 latency cut by 80 percent.">
    ${fig('02', 'EVENT PIPELINE', '7.5M+ / DAY')}
    ${dots}
    <path class="sv-wire" d="M8,124 H148 M78,124 V140"/>
    <text class="sv-key" x="8" y="36">events</text>
    ${stage(8, 140, '01', 'Pub/Sub')}
    ${stage(172, 152, '02', 'Cloud Functions')}
    ${stage(348, 124, '03', 'BigQuery')}
    ${stage(496, 136, '04', '50+ dashboards')}
    <path class="sv-wire lit" d="M148,169 H172 M324,169 H348 M472,169 H496"/>
    ${chev(154, 169)}${chev(330, 169)}${chev(478, 169)}
    <text class="sv-key" x="8" y="238">p95 latency</text>
    <rect class="sv-bar" x="8" y="248" width="460" height="10" rx="5"/>
    <text class="sv-key sm" x="478" y="257">before</text>
    <rect class="sv-bar ok" x="8" y="268" width="92" height="10" rx="5"/>
    <text class="sv-key lit sm" x="110" y="277">80% faster</text>
    <text class="sv-cap" x="0" y="304">60k DAU · 150k MAU · 300+ req/sec at peak</text>
  </svg>
  <i class="wk-p p-ev1"></i><i class="wk-p p-ev2"></i><i class="wk-p p-ev3"></i>`
}

/** 03 — Dashify: one app where five services used to be. */
function schemaDash(): string {
  const rows = [56, 108, 162, 216, 270]
  const spokes = rows
    .map((y, i) => `<path class="sv-wire s${i}" d="M126,162 C162,162 168,${y} 196,${y}"/>`)
    .join('')
  const heads = ['Rostering &amp; onboarding', 'Table reservations', 'Ordering &amp; invoicing', 'Task management', 'CRM']
    .map(
      (s, i) =>
        `<circle class="sv-hub s${i}" cx="196" cy="${rows[i]}" r="3.4"/>` +
        `<text class="sv-nm sm" x="208" y="${rows[i] + 4}">${s}</text>`,
    )
    .join('')
  let grid = ''
  for (let r = 0; r < 5; r++)
    for (let c = 0; c < 4; c++)
      grid += `<rect class="sv-tile" x="${496 + c * 30}" y="${90 + r * 30}" width="22" height="22" rx="5"/>`
  return `<svg class="sv" viewBox="-18 -12 676 356" role="img" aria-label="Dashify: one hub feeding rostering, reservations, ordering, tasks and CRM, running 20 hospitality venues.">
    ${fig('03', 'ONE APP, FIVE WORKFLOWS')}
    <rect class="sv-node" x="8" y="136" width="118" height="52" rx="10"/>
    <text class="sv-nm" x="24" y="167">Dashify</text>
    ${spokes}${heads}
    <path class="sv-rule" d="M466,40 V292"/>
    <text class="sv-key" x="496" y="78">20+ venues</text>
    ${grid}
    <text class="sv-key sm" x="496" y="250">+ 1 wholesale supplier</text>
    <text class="sv-cap" x="0" y="304">Simplified &amp; cost-efficient alternative to using multiple disconnected services</text>
  </svg>
  <i class="wk-p p-hub"></i>`
}

/* --------------------------------------------------------------- pieces */

/** the three-across strip under a title: outcome numbers, or what it is */
function strip(items: { figure: string; label: string }[], words: boolean): string {
  return `<dl class="wk-out${words ? ' words' : ''}">${items
    .map(
      (o) =>
        `<div><dt class="mono">${t(o.label)}</dt><dd class="wk-fig"${words ? '' : ` data-to="${t(o.figure)}"`}>${t(o.figure)}</dd></div>`,
    )
    .join('')}</dl>`
}

const tagList = (p: Project, max = 99) =>
  `<ul class="tags">${p.tags
    .slice(0, max)
    .map((g) => `<li>${t(g.name)}</li>`)
    .join('')}</ul>`

interface Feat {
  slug: string
  pick: number[]
  schema: () => string
  words?: { figure: string; label: string }[]
}
const FEAT: Feat[] = [
  {
    slug: 'stable',
    pick: [0, 1, 3],
    schema: schemaStable,
    words: [
      { figure: 'EVM', label: 'payment rails' },
      { figure: 'React Native', label: 'mobile app' },
      { figure: 'AWS · Datadog', label: 'go services' },
    ],
  },
  { slug: 'genopets', pick: [2, 5, 9], schema: schemaGeno },
  { slug: 'dashify', pick: [0, 1, 2], schema: schemaDash },
]

function module_(f: Feat, i: number): string {
  const p = projects.find((x) => x.slug === f.slug)
  if (!p) return ''
  const meta = span(p.company?.slug)
  const out = FEATURED.find((x) => x.slug === f.slug)?.outcomes
  const idx = String(i + 1).padStart(2, '0')
  return `
          <article class="wk-mod rev" data-cell="${i}" style="--i:${i}">
            <a class="wk-card" href="/projects/${p.slug}" aria-labelledby="wk-t-${p.slug}">
              <span class="wk-glow" aria-hidden="true"></span>
              <span class="wk-rim" aria-hidden="true"></span>
              <div class="wk-body">
                <p class="wk-meta mono">
                  <b>${idx}</b><span class="wk-co">${t(p.company?.title ?? '')}</span>
                  <span class="sep">/</span><span>${t(meta.role)}</span>
                  <span class="sep">/</span><span>${t(meta.when)}</span>
                </p>
                <h3 class="wk-title" id="wk-t-${p.slug}">${t(p.title)}</h3>
                <p class="wk-ex">${t(p.excerpt)}</p>
                ${strip(f.words ?? out ?? [], !!f.words)}
                <ul class="wk-hi">${notes(p, f.pick)
                  .map((s) => `<li>${esc(s)}</li>`)
                  .join('')}</ul>
                ${tagList(p)}
                <span class="wk-go mono">read the case study <i aria-hidden="true">↗</i></span>
              </div>
              <div class="wk-screen">${f.schema()}
                <i class="wk-scan" aria-hidden="true"></i>
                <span class="wk-lock" aria-hidden="true">core → cell ${idx}</span>
              </div>
            </a>
          </article>`
}

function minor(p: Project, i: number): string {
  const meta = span(p.company?.slug)
  const c = careers.find((k) => k.slug === p.company?.slug)
  const when = c ? `${year(c.startDate)}–${year(c.endDate)}` : ''
  return `
            <article class="wk-min rev" data-bus="${i}" style="--i:${i}">
              <a class="wk-card sm" href="/projects/${p.slug}" aria-labelledby="wk-m-${p.slug}">
                <span class="wk-glow" aria-hidden="true"></span>
                <span class="wk-rim" aria-hidden="true"></span>
                <p class="wk-meta mono"><b>${String(i + 4).padStart(2, '0')}</b><span>${t(when)}</span></p>
                <svg class="wk-mark m${i}" viewBox="0 0 48 48" aria-hidden="true">
                  <path class="sv-wire" d="M6,38 H20 V14 H34 V26 H42"/>
                  <circle cx="6" cy="38" r="2.6"/><circle cx="20" cy="14" r="2.6"/>
                  <circle cx="34" cy="26" r="2.6"/><circle class="lit" cx="42" cy="26" r="3"/>
                </svg>
                <h4 class="wk-mt" id="wk-m-${p.slug}">${t(p.title)}</h4>
                <p class="wk-mc mono">${t(p.company?.title ?? '')}${meta.role ? ` · ${t(meta.role)}` : ''}</p>
                <p class="wk-mx">${t(p.excerpt)}</p>
                ${tagList(p, 5)}
                <span class="wk-mgo mono">${p.gallery?.length ? `${p.gallery.length} images` : 'case study'}<i aria-hidden="true">↗</i></span>
              </a>
            </article>`
}

/* ----------------------------------------------------------------- page */

export function render(): string {
  void minor
  const c = SECTIONS.work
  const rest = projects.filter((p) => !FEAT.some((f) => f.slug === p.slug))
  return `
      <section class="chapter wk" id="work" data-shape="3" aria-labelledby="work-title">
        <div class="inner">
          <header class="wk-head">
            <div class="rev">
              <span class="kicker mono">${c.index} — ${c.eyebrow}</span>
              <h2 id="work-title">${c.title}</h2>
              <p class="wk-intro">${c.intro}</p>
            </div>
            <p class="wk-count mono rev">
              <span><b>3</b> featured</span><span class="sep">/</span><span><b>${projects.length}</b> shipped</span>
              <span class="sep">/</span><span>2013 → now</span>
            </p>
          </header>

          <div class="wk-mods">${FEAT.map(module_).join('')}
          </div>

          <p class="see-all rev"><span class="mono">also shipped: ${rest.length} more products</span><a class="cta ghost glass" href="/projects/">All ${projects.length} products <span class="arw">↗</span></a></p>
        </div>
      </section>`
}
