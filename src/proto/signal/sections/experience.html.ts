/**
 * EXPERIENCE — the static markup, rendered at build time.
 *
 * Two chapters in one section:
 *   data-shape="1"  the header, held while the core spells PRODUCT ENGINEER
 *   data-shape="2"  the roles, held while the core is the nine-ring orbit
 *
 * Everything a recruiter needs is real HTML here: nine roles, every
 * achievement with its badge and description, every tech stack, every logo,
 * and a decade map that puts the whole thing on one axis. The effects layer
 * adds light to this; it never supplies the content.
 */
import { SECTIONS } from '../../shared/content'
import { careers } from '../../shared/data'
import { NOW_M, ROLE_SPANS, ringRadius } from '../shapes/orbit'

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** 9 → "9 mo", 42 → "3 yr 6 mo" */
function duration(m: number): string {
  if (m < 12) return `${m} mo`
  const y = Math.floor(m / 12)
  const r = m % 12
  return r ? `${y} yr ${r} mo` : `${y} yr`
}

/* the axis every bar on the decade map is drawn against */
const AXIS0 = 2013 * 12
const AXIS1 = NOW_M + 2
const SPAN = AXIS1 - AXIS0
const pct = (m: number) => ((m - AXIS0) / SPAN) * 100

const LONGEST = Math.max(...ROLE_SPANS.map((s) => s.months))
const ACHIEVEMENTS = careers.reduce((n, c) => n + (c.achievements?.length ?? 0), 0)
const RUNNING = ROLE_SPANS.filter((s) => s.current).length
const YEARS = Math.floor((NOW_M - Math.min(...ROLE_SPANS.map((s) => s.start))) / 12)

/** the placeholder excerpts in the dataset are truncated stubs — skip those */
const realExcerpt = (s?: string) => (s && s.length > 46 && !s.endsWith('...') ? s : '')

/** the identity chip that stands in for a logo that never arrives */
const initials = (t: string) =>
  t
    .split(/\s+/)
    .filter((w) => !/^(the|of|and|a)$/i.test(w))
    .map((w) => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase()

const stat = (v: number, suffix: string, label: string) => `
            <div class="xp-stat">
              <dt class="mono">${label}</dt>
              <dd><span data-xpcount="${v}">${v}</span>${suffix}</dd>
            </div>`

function mapRow(i: number): string {
  const c = careers[i]
  const s = ROLE_SPANS[i]
  return `
            <li class="map-row" style="--i:${i}">
              <button type="button" class="map-bar${s.current ? ' now' : ''}" data-role="${i}"
                aria-label="${esc(c.title)}, ${esc(c.jobTitle)}, ${esc(c.startDate)} to ${esc(c.endDate)}, ${duration(s.months)}">
                <span class="map-co">${esc(c.title)}</span>
                <span class="map-track"><i style="--a:${pct(s.start).toFixed(2)}%;--w:${((s.months / SPAN) * 100).toFixed(2)}%"></i></span>
                <span class="map-len mono">${duration(s.months)}</span>
              </button>
            </li>`
}

function roleCard(i: number): string {
  const c = careers[i]
  const s = ROLE_SPANS[i]
  const blurb = realExcerpt(c.excerpt)
  const ach = (c.achievements ?? [])
    .map(
      (a) => `
                  <li class="ach-i">
                    <b>${esc(a.title)}</b>${a.badge ? `<em class="ach-b mono">${esc(a.badge)}</em>` : ''}
                    <span>${esc(a.description)}</span>
                  </li>`,
    )
    .join('')
  const tech = (c.techStack ?? []).map((t) => `<li>${esc(t)}</li>`).join('')
  return `
            <li class="role rev" data-role="${i}" data-slug="${esc(c.slug)}" id="xp-${esc(c.slug)}"
              style="--r:${(ringRadius(i) / 1.2).toFixed(3)};--t:${(s.months / LONGEST).toFixed(3)}">
              <span class="role-mark" aria-hidden="true"><i></i></span>
              <article class="role-card">
                <div class="role-top">
                  <span class="role-ix mono">${String(i + 1).padStart(2, '0')}</span>
                  <span class="role-logo"
                    ><b class="role-chip mono">${initials(c.title)}</b
                    ><img src="${esc(c.image.url)}" alt="" width="150" height="34" loading="lazy" decoding="async"
                  /></span>
                  ${s.current ? '<span class="role-now mono"><i class="dot"></i>current</span>' : ''}
                </div>
                <h3 class="role-co"><a href="/career/${esc(c.slug)}">${esc(c.title)}</a></h3>
                <p class="role-job">${esc(c.jobTitle)}</p>
                <p class="role-when mono">
                  <span>${esc(c.startDate)} → ${esc(c.endDate)}</span><span class="role-sep">·</span><span>${duration(s.months)}</span><span class="role-sep">·</span><span>${esc(c.location)}</span>
                </p>
                ${blurb ? `<p class="role-sum">${esc(blurb)}</p>` : ''}
                <ul class="ach">${ach}
                </ul>
                <ul class="tags mono">${tech}</ul>
                <a class="role-more mono" href="/career/${esc(c.slug)}">the full role <span class="arw">↗</span></a>
              </article>
            </li>`
}

export function render(): string {
  const c = SECTIONS.experience
  return `
      <section class="xp" id="experience" aria-labelledby="experience-title">
        <div class="chapter xp-head" data-shape="1">
          <div class="inner">
            <span class="kicker mono rev">${c.index} — ${c.eyebrow}</span>
            <h2 class="rev" id="experience-title">${c.title}</h2>
            <p class="rev">${c.intro}</p>
            <dl class="xp-stats rev">${stat(YEARS, '+', 'years shipping')}${stat(careers.length, '', 'roles')}${stat(ACHIEVEMENTS, '', 'highlights')}${stat(RUNNING, '', 'still running')}
            </dl>
          </div>
        </div>

        <div class="xp-body">
          <figure class="xp-map rev" style="--now:${pct(NOW_M).toFixed(2)}%;--step:${((36 / SPAN) * 100).toFixed(3)}%">
            <figcaption class="mono"><span>the decade on one axis</span><span>2013 → now</span></figcaption>
            <div class="map-scale mono" aria-hidden="true">
              <span class="map-co"></span>
              <span class="map-track">${[2016, 2019, 2022, 2025]
                .map((y) => `<b style="--a:${pct(y * 12).toFixed(2)}%">${y}</b>`)
                .join('')}<u style="--a:${pct(NOW_M).toFixed(2)}%"></u></span>
              <span class="map-len"></span>
            </div>
            <ul class="map-rows">${careers.map((_, i) => mapRow(i)).join('')}
            </ul>
          </figure>

          <div class="xp-track">
            <span class="xp-spine" aria-hidden="true"><i></i></span>
            <ol class="xp-roles" data-shape="2">${careers.slice(0, 3).map((_, i) => roleCard(i)).join('')}
            </ol>
            <p class="see-all rev"><span class="mono">the three most recent of ${careers.length} roles</span><a class="cta ghost glass" href="/career/">All ${careers.length} roles <span class="arw">↗</span></a></p>
          </div>
        </div>
      </section>`
}
