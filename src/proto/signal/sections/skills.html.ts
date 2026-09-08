/**
 * SIGNAL — the skills chapter (shape 4, the constellation).
 *
 * Everything here is real HTML at first paint, rendered at build time from
 * content.ts: the 56 star labels that the scene later pins onto the
 * sculpture, and — the part a recruiter actually reads — the whole toolbox
 * as a grouped, three-column list with years, live and legacy markers.
 * Nothing below needs JavaScript to be readable.
 */
import { DOMAINS, SECTIONS, TOOLS } from '../../shared/content'
import type { Domain, Tool } from '../../shared/content'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const TOTAL = TOOLS.length
const LIVE = TOOLS.filter((t) => t.live).length
const MAX_YEARS = TOOLS.reduce((m, t) => Math.max(m, t.years), 1)

/** on a phone the sky only carries the tools he is on today — the rest stay in the list */
const isKey = (t: Tool) => t.live

const countOf = (d: Domain) => TOOLS.filter((t) => t.domain === d)
const liveOf = (d: Domain) => countOf(d).filter((t) => t.live).length

/** the groups of one domain, in the toolbox's own order */
function groupsOf(d: Domain): { label: string; items: { tool: Tool; i: number }[] }[] {
  const out: { label: string; items: { tool: Tool; i: number }[] }[] = []
  TOOLS.forEach((tool, i) => {
    if (tool.domain !== d) return
    let g = out[out.length - 1]
    if (!g || g.label !== tool.group) {
      g = { label: tool.group, items: [] }
      out.push(g)
    }
    g.items.push({ tool, i })
  })
  return out
}

function star(t: Tool, i: number): string {
  const tag = t.live ? 'live' : t.legacy ? 'legacy' : ''
  const meta = `${t.years}y${tag ? ` · ${tag}` : ''}`
  return `<span class="sk-star${isKey(t) ? ' key' : ''}${t.legacy ? ' old' : ''}" data-i="${i}" data-d="${t.domain}"><b>${esc(t.name)}</b><em>${meta}</em></span>`
}

function row({ tool, i }: { tool: Tool; i: number }): string {
  const state = tool.live ? ' live' : tool.legacy ? ' old' : ''
  const mark = tool.live ? 'live' : tool.legacy ? 'legacy' : `${tool.years} years`
  return (
    `<li class="sk-row${state}" data-i="${i}">` +
    `<i class="sk-mark" aria-hidden="true"></i>` +
    `<span class="sk-nm">${esc(tool.name)}</span>` +
    `<span class="sk-bar" aria-hidden="true" style="--y:${(tool.years / MAX_YEARS).toFixed(3)}"><i></i></span>` +
    `<span class="sk-yr mono">${tool.years}y</span>` +
    `<span class="sr">, ${mark}</span>` +
    `</li>`
  )
}

function column(d: (typeof DOMAINS)[number]): string {
  const groups = groupsOf(d.id)
  return (
    `<div class="sk-col" data-d="${d.id}">` +
    `<div class="sk-colhead">` +
    `<span class="sk-num mono">${d.number}</span>` +
    `<h3>${d.title}</h3>` +
    `<span class="sk-cap mono">${esc(d.caption)}</span>` +
    `<span class="sk-tally mono"><i></i>${liveOf(d.id)} live / ${countOf(d.id).length}</span>` +
    `</div>` +
    groups
      .map(
        (g) =>
          `<div class="sk-grp"><h4 class="mono">${esc(g.label)}<span>${g.items.length}</span></h4>` +
          `<ul>${g.items.map(row).join('')}</ul></div>`,
      )
      .join('') +
    `</div>`
  )
}

export function render(): string {
  const c = SECTIONS.skills
  const title = c.title.replace('every day.', '<em class="fx">every day.</em>')
  return `
      <section class="chapter right sk" id="skills" data-shape="4" aria-labelledby="skills-title">
        <div class="sk-sky" id="skSky" aria-hidden="true">
          <canvas class="sk-web" id="skWeb"></canvas>
          <div class="sk-stars" id="skStars">${TOOLS.map(star).join('')}</div>
          <div class="sk-focus" id="skFocus">
            <span class="sk-fd mono"></span>
            <b class="sk-fn"></b>
            <span class="sk-fm mono"></span>
          </div>
        </div>

        <div class="inner sk-head">
          <span class="kicker mono rev">${c.index} — ${c.eyebrow}</span>
          <h2 class="rev" id="skills-title">${title}</h2>
          <p class="rev">${c.intro}</p>
          <p class="sk-meta mono rev" id="skMeta">
            <i class="dot"></i><b data-n="${TOTAL}">${TOTAL}</b> tools
            <span class="sk-sep">·</span>
            <b data-n="${LIVE}">${LIVE}</b> live
            <span class="sk-sep">·</span>
            <span class="sk-scope">whole toolbox</span>
          </p>
          <div class="sk-chips rev" role="group" aria-label="Show one part of the stack">
            <button type="button" class="sk-chip on" data-f="all" aria-pressed="true">All<span>${TOTAL}</span></button>
            ${DOMAINS.map(
              (d) =>
                `<button type="button" class="sk-chip" data-f="${d.id}" aria-pressed="false"><i></i>${d.title}<span>${liveOf(d.id)}/${countOf(d.id).length}</span></button>`,
            ).join('')}
          </div>
          <p class="sk-hint mono rev" id="skHint">drag to spin · hover a star · pick a stack</p>
        </div>

        <div class="sk-list rev" id="skList" data-f="all">
          ${DOMAINS.map(column).join('')}
          <p class="sk-key mono"><i class="k-live"></i>on it today<i class="k-old"></i>legacy, still readable<span>bar = years</span></p>
        </div>
      </section>`
}
