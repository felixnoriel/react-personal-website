/**
 * /about/ — who Felix is, and how this site is actually built.
 *
 * Two halves. The first is the original About copy, verbatim (it is his
 * voice, emoji included). The second replaces the old page's "Front End /
 * Back End / Hosting" cards with the truth about THIS site: a WebGPU
 * particle core with WebGL2 and CSS tiers, every route written to a real
 * HTML file at build time, cross-document view transitions, a telemetry
 * rail that prints only measured values.
 *
 * Nothing in the build section is a boast the page cannot back up: the
 * counts below are computed from the datasets at build time, and the live
 * cells are filled at runtime from the renderer this visitor actually got
 * (sections/pages-about.ts). The third block is the core's own vocabulary —
 * eight rows, each carrying its shape index, so the core performs every one
 * of its eight poses while you read what it is doing.
 */
import type { PageSpec } from '../layout'
import { SITE } from '../layout'
import { CITY_LIST, TOOLS } from '../../../shared/content'
import { blogPosts, careers, projects } from '../../../shared/data'

/** counted from the data, so the sentence can never drift from the site */
const COUNTS = {
  roles: careers.length,
  projects: projects.length,
  posts: blogPosts.length,
  tools: TOOLS.length,
  live: TOOLS.filter((t) => t.live).length,
  cities: CITY_LIST.length,
}

/** the eight poses of the core, in page order (shapes/index.ts) */
const POSES: { name: string; what: string; where: string; href: string; side: 'l' | 'r' }[] = [
  {
    name: 'the coil',
    what: 'A ring wound twenty-one times with a filament of light, and one razor circle of current through the middle. This is the core at rest.',
    where: 'the front page',
    href: '/',
    side: 'l',
  },
  {
    name: 'the words',
    what: 'The same particles, rasterised into two lines of type. The core spells out what he does, then lets go of it.',
    where: 'experience',
    href: '/#experience',
    side: 'l',
  },
  {
    name: 'the orbit',
    what: `Nine rings, one for each role. The radius reads as how long he stayed; the bright one is where he is now.`,
    where: 'the roles',
    href: '/career/',
    side: 'l',
  },
  {
    name: 'the cells',
    what: 'Three lit plates for the three products that carry real numbers, and the rest of the shelf behind them.',
    where: 'selected work',
    href: '/projects/',
    side: 'l',
  },
  {
    name: 'the constellation',
    what: `${COUNTS.tools} tools on a sphere. Bigger and brighter is more years; the dim hollow ones are the tools he has retired.`,
    where: 'capabilities',
    href: '/#skills',
    side: 'r',
  },
  {
    name: 'the globe',
    what: `${COUNTS.cities} cities on a wireframe earth, with the routes between them. Bangkok is the one that is lit.`,
    where: 'nomad.log',
    href: '/#nomad',
    side: 'r',
  },
  {
    name: 'the stream',
    what: `${COUNTS.posts} threads running downstream, one per post. Touch a card and its thread lights up.`,
    where: 'writing',
    href: '/blog/',
    side: 'l',
  },
  {
    name: 'the beam',
    what: 'The core stops being an object and becomes a transmission: a pad on the ground, a white column, and the signal leaving the page.',
    where: 'contact',
    href: '/#contact',
    side: 'r',
  },
]

/** one card of the build section; `live` names the runtime cells it carries */
interface Card {
  n: string
  title: string
  body: string
  live?: { key: string; label: string; w: string }[]
  extra?: string
}

const CARDS: Card[] = [
  {
    n: '01',
    title: 'The page came first',
    body:
      'Every route is a real HTML file, written at build time. No framework runs in the page — the words are on screen and readable before a single script executes, and the effects join afterwards.',
    live: [
      { key: 'paint', label: 'first paint', w: '5.4em' },
      { key: 'ttfb', label: 'first byte', w: '5.4em' },
    ],
  },
  {
    n: '02',
    title: 'The core asks for a GPU, three times',
    body:
      'It is a real particle simulation. It asks for WebGPU first, falls back to WebGL2, and draws the same coil in plain CSS if there is no GPU at all. How many particles you get is read off your own device — cores and memory — from 56,000 on a phone to 320,000 on a desktop.',
    live: [
      { key: 'renderer', label: 'you got', w: '15em' },
      { key: 'particles', label: 'particles', w: '5.4em' },
      { key: 'frame', label: 'frame', w: '5.4em' },
    ],
    extra: `<p class="ab-swap mono"><span>see the other tiers</span>
          <a href="./" data-fx="">auto</a><a href="?fx=webgl" data-fx="webgl">webgl2</a><a href="?fx=css" data-fx="css">css</a></p>`,
  },
  {
    n: '03',
    title: 'Scrolling is the morph',
    body:
      'There are eight poses and one object. Every particle keeps the same index in all eight, so the core never re-forms — it unrolls from one shape into the next, and where you are on the page decides how far it has got. Keep scrolling and it runs the whole set.',
  },
  {
    n: '04',
    title: 'Pages hand off to each other',
    body:
      'Moving around the site is a normal navigation, so the browser itself animates it: the card you click grows into the title of the page it opens. The next page is already fetched by the time your finger lands, because touching a link starts the download.',
  },
  {
    n: '05',
    title: 'The writing is an old blog, baked in',
    body:
      `The posts, the roles and the projects came out of a WordPress site. There is no CMS behind this one: ${COUNTS.roles} roles, ${COUNTS.projects} projects and ${COUNTS.posts} posts are static data in the build, and every picture is re-encoded and sized while the site is built, so nothing can move on the page while it loads.`,
  },
  {
    n: '06',
    title: 'The bottom strip never guesses',
    body:
      'The rail along the bottom of every page prints what happened on your machine: the renderer it was given, the particles it is drawing, the median frame time, the first byte and the first paint. If a number is not measured, it is not printed.',
    live: [{ key: 'screen', label: 'your screen', w: '10.5em' }],
  },
]

/** the old page's three columns — Front End, Back End, Hosting — told truthfully */
const SPEC: { title: string; items: string[] }[] = [
  {
    title: 'Front end',
    items: [
      'Hand-written HTML, rendered at build time',
      'Plain TypeScript modules — no framework in the page',
      'Vite for the build',
      'View transitions between pages',
      'Reveals, staggering and the progress bar in CSS only',
    ],
  },
  {
    title: 'The core',
    items: [
      'WebGPU compute, with a WebGL2 tier behind it',
      'A CSS coil when there is no GPU at all',
      'Eight morph targets, built in idle slices',
      'Particle count picked from your device',
      'Everything pauses when the tab is hidden',
    ],
  },
  {
    title: 'Content & hosting',
    items: [
      `${COUNTS.roles} roles, ${COUNTS.projects} projects, ${COUNTS.posts} posts`,
      `${COUNTS.tools} tools (${COUNTS.live} still in daily use), ${COUNTS.cities} cities`,
      'Exported once from WordPress, now static data',
      'Images re-encoded to AVIF and WebP at build time',
      'Deployed on Vercel 🚀',
    ],
  },
]

/**
 * The page's own behaviour, loaded from the head so nothing shared has to
 * know these two routes exist. The <noscript> rule matters: the reveal class
 * starts at opacity 0 and JavaScript adds the class that brings it in, so
 * without this the page would be blank for a reader with no script.
 */
// the behaviour module is registered in sections/index.ts like every other one
const HEAD =
  `<noscript><style>.rev{opacity:1!important;transform:none!important}.ab-pose-in{opacity:1!important;transform:none!important}</style></noscript>`

const cardHtml = (c: Card): string => `
          <li class="ab-card glass rev" data-w="${c.n}">
            <span class="ab-n mono" aria-hidden="true">${c.n}</span>
            <h3>${c.title}</h3>
            <p>${c.body}</p>
            ${
              c.live
                ? `<dl class="ab-live mono">${c.live
                    .map(
                      (l) =>
                        `<div><dt>${l.label}</dt><dd><span data-live="${l.key}" style="--w:${l.w}">measuring</span></dd></div>`,
                    )
                    .join('')}</dl>`
                : ''
            }${c.extra || ''}
          </li>`

const poseHtml = (p: (typeof POSES)[number], i: number): string => `
          <li class="ab-pose ${p.side === 'r' ? 'r' : 'l'}" data-shape="${i}" data-i="${i}">
            <div class="ab-pose-in">
              <span class="ab-pose-n mono" aria-hidden="true">${String(i).padStart(2, '0')}</span>
              <h3>${p.name}</h3>
              <p>${p.what}</p>
              <a class="ab-pose-go mono" href="${p.href}"><span>${p.where}</span><i aria-hidden="true">→</i></a>
            </div>
          </li>`

export function aboutPages(): PageSpec[] {
  return [
    {
      path: '/about/',
      title: 'About',
      description:
        'Felix Noriel — product engineer, based in Asia, nomading with the family. And how this site is built: a WebGPU particle core with WebGL2 and CSS tiers, static pages, and a rail that only prints measured numbers.',
      // no `shape` here on purpose: it would land on <main>, whose box is the
      // whole document, and one anchor that tall holds its pose over every
      // other anchor on the page. The head section carries shape 0 instead.
      css: ['pages-about'],
      head: HEAD,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        name: 'About Felix Noriel',
        url: SITE.url + SITE.base + '/about/',
        mainEntity: {
          '@type': 'Person',
          name: 'Felix Noriel',
          jobTitle: 'Product Engineer',
          description: 'Product Engineer based in Asia, digital nomading with the family.',
        },
      },
      main: `
      <section class="chapter ab-hero" data-shape="0" aria-labelledby="ab-title">
        <div class="inner">
          <span class="kicker mono rev">about</span>
          <h1 class="rev" id="ab-title"><span class="ink">About Me</span></h1>
          <p class="ab-lead rev">
            I'm a <strong>Product Engineer</strong> based in <b class="hl">Asia</b>, digital nomading with the fam
            <span class="ab-emo" aria-hidden="true">🌏</span>
          </p>
          <p class="ab-lead rev">
            When I'm not in front of my computer, I like to cook, trying out different restaurants and cuisines, and
            traveling every once in a while. <span class="ab-emo" aria-hidden="true">🍜</span>
          </p>
          <ul class="tags ab-facts rev">
            <li class="on">available for work</li>
            <li>Bangkok · UTC+7</li>
            <li>13+ years shipping</li>
            <li>remote-friendly</li>
          </ul>
          <div class="ctas endcard rev">
            <a class="cta solid" href="/#work">See selected work <span class="arw" aria-hidden="true">↗</span></a>
            <a class="cta ghost glass" href="/#contact">Get in touch <span class="arw" aria-hidden="true">↗</span></a>
          </div>
        </div>
        <div class="ab-pins" id="ab-pins" aria-hidden="true"></div>
      </section>

      <section class="chapter ab-build" id="build" data-shape="1" aria-labelledby="ab-build-title">
        <div class="inner ab-wide">
          <span class="kicker mono rev">how this site is built</span>
          <h2 class="rev" id="ab-build-title">Six things are true about the page you are on.</h2>
          <p class="ab-sub rev">
            The old version of this page listed the libraries it used. This one lists what is actually running, and
            shows you the numbers your own device produced while you read it.
          </p>
          <ol class="ab-cards">${CARDS.map(cardHtml).join('')}
          </ol>

          <div class="ab-spec">${SPEC.map(
            (s) => `
            <section class="ab-col rev" aria-labelledby="spec-${s.title.replace(/[^a-z]/gi, '').toLowerCase()}">
              <h3 class="mono" id="spec-${s.title.replace(/[^a-z]/gi, '').toLowerCase()}">${s.title}</h3>
              <ul>${s.items.map((i) => `<li>${i}</li>`).join('')}</ul>
            </section>`,
          ).join('')}
          </div>
        </div>
      </section>

      <section class="ab-poses" id="poses" aria-labelledby="ab-poses-title">
        <div class="ab-poses-head">
          <div class="inner">
            <span class="kicker mono rev">the core, pose by pose</span>
            <h2 class="rev" id="ab-poses-title">Eight shapes. One object.</h2>
            <p class="rev">
              Keep going. The core is holding the pose you are reading about, and morphing to the next one in the gap
              between them — the same eight it runs on the front page.
            </p>
          </div>
        </div>
        <ol class="ab-pose-list">${POSES.map(poseHtml).join('')}
        </ol>
      </section>

      <section class="chapter ab-end" aria-labelledby="ab-end-title">
        <div class="inner">
          <span class="kicker mono rev">next</span>
          <h2 class="rev" id="ab-end-title">Go and look at the work.</h2>
          <div class="ctas endcard rev">
            <a class="cta solid" href="/projects/">Projects <span class="arw" aria-hidden="true">→</span></a>
            <a class="cta ghost glass" href="/career/">Career <span class="arw" aria-hidden="true">→</span></a>
            <a class="cta ghost glass" href="/blog/">Writing <span class="arw" aria-hidden="true">→</span></a>
            <a class="cta ghost glass" href="/#contact">Contact <span class="arw" aria-hidden="true">→</span></a>
          </div>
          <p class="ab-made mono rev">Developed with <span class="ab-heart" aria-hidden="true">❤</span> by Felix Noriel</p>
        </div>
      </section>`,
    },
  ]
}
