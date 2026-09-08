/**
 * CONSOLE — the header, the chapter gauge and the command console.
 *
 * Everything a visitor can reach is REAL HTML here: the six section links,
 * the eight chapter ticks and all sixty destinations inside the console.
 * The console itself opens with an invoker command (`command="show-modal"`,
 * Baseline since December 2025), so on a modern browser it opens, closes and
 * navigates with no JavaScript at all. console.ts only adds the live parts:
 * filtering, the terminal, the chapter tracking and the keyboard.
 *
 * This module runs at BUILD time (scripts/render-signal.ts). It may import the
 * heavy data files; console.ts must not, and does not.
 */
import { EMAIL, FEATURED, SECTIONS, SOCIALS, TOOLS } from '../../shared/content'
import { blogPosts, careers, projects } from '../../shared/data'

/* ---------------------------------------------------------------- text */

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
const clip = (s: string, n: number) => {
  const d = dec(s).replace(/\s+/g, ' ').trim()
  return esc(d.length > n ? d.slice(0, n - 1).trimEnd() + '…' : d)
}
const year = (iso: string) => iso.slice(0, 4)

/* ------------------------------------------------------------- chapters */

/**
 * The eight poses of the core, in page order. `target` is a selector the
 * runtime resolves against the finished page, so a section owner can move
 * their block without breaking the gauge.
 */
const CHAPTERS: { i: number; name: string; target: string }[] = [
  { i: 0, name: 'Signal', target: '#top' },
  { i: 1, name: 'Experience', target: '#experience' },
  { i: 2, name: 'Roles', target: '[data-shape="2"]' },
  { i: 3, name: 'Work', target: '#work' },
  { i: 4, name: 'Skills', target: '#skills' },
  { i: 5, name: 'Nomad', target: '#nomad' },
  { i: 6, name: 'Writing', target: '#writing' },
  { i: 7, name: 'Contact', target: '#contact' },
]

/**
 * The six section links, each covering the chapters it owns. The header is
 * shared by EVERY route, so a link is written site-relative with the hash
 * ("/#work"): on the home page the script scrolls, on a career or blog page
 * the browser navigates home and lands on the section. layout.ts's rebase()
 * puts the preview base in front.
 */
const NAVS: { label: string; key: keyof typeof SECTIONS; from: number; to: number }[] = [
  { label: 'Experience', key: 'experience', from: 1, to: 2 },
  { label: 'Work', key: 'work', from: 3, to: 3 },
  { label: 'Skills', key: 'skills', from: 4, to: 4 },
  { label: 'Nomad', key: 'nomad', from: 5, to: 5 },
  { label: 'Writing', key: 'writing', from: 6, to: 6 },
  { label: 'Contact', key: 'contact', from: 7, to: 7 },
]

/** the eight ticks, shared by the header gauge and the phone strip */
function ticks(cls: string): string {
  return CHAPTERS.map(
    (c) =>
      `<button type="button" class="${cls}" style="--i:${c.i}" data-ch="${c.i}" data-name="${t(c.name)}" data-target="${t(c.target)}" tabindex="-1"></button>`,
  ).join('')
}

/* --------------------------------------------------------------- header */

export function header(): string {
  const nav = NAVS.map(
    (n) =>
      `<a href="/#${n.key}" data-from="${n.from}" data-to="${n.to}" style="--a:${n.from};--b:${n.to}"><span>${n.label}</span><i aria-hidden="true"></i></a>`,
  ).join('')

  return `
    <header class="rail-top mono hdr" id="hdr" style="--m:0">
      <div class="hdr-l">
        <a class="mark" href="/" aria-label="Felix Noriel — home"
          ><span class="bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span><b>FELIX NORIEL</b></a
        ><span class="sep" aria-hidden="true">/</span><span class="sig">SIGNAL</span>
      </div>

      <div class="hdr-c">
        <nav class="chapnav" id="chapnav" aria-label="Sections">${nav}</nav>
      </div>

      <div class="hdr-r">
        <div class="gauge" id="gauge" aria-hidden="true">
          <span class="gticks">${ticks('gt')}</span>
          <span class="gnum"><b id="gcur">01</b><span class="gsl">/</span>08</span>
        </div>
        <button type="button" class="kbd" id="kbd-k" commandfor="con" command="show-modal" aria-label="Open the console. Keyboard shortcut: Command or Control K">
          <span class="kbd-keys" aria-hidden="true"><kbd>⌘</kbd><kbd>K</kbd></span>
          <span class="kbd-touch" aria-hidden="true">console</span>
        </button>
        <span class="clockwrap"><span id="clockLabel">BKK</span>&nbsp;<span id="clock">--:--:--</span></span>
      </div>
    </header>

    <div class="chapstrip mono" id="chapstrip" style="--m:0">
      <button type="button" class="cs-open" commandfor="con" command="show-modal" aria-label="Open the console">
        <b id="csNum">01</b><span class="cs-dot" aria-hidden="true">·</span><span id="csName">Signal</span
        ><span class="cs-k" aria-hidden="true">›_</span>
      </button>
      <span class="cs-g" aria-hidden="true">${ticks('gt')}</span>
    </div>`
}

/* -------------------------------------------------------------- console */

interface Opt {
  kind: string
  glyph: string
  label: string
  meta: string
  href?: string
  cmd?: string
  ch?: number
  ext?: boolean
}

const COMMANDS: { name: string; meta: string }[] = [
  { name: 'help', meta: 'every command, listed' },
  { name: 'whoami', meta: 'the short version' },
  { name: 'work', meta: 'the products, with their numbers' },
  { name: 'projects', meta: 'all nine, with links' },
  { name: 'skills', meta: 'the toolbox, counted' },
  { name: 'stack', meta: 'same as skills' },
  { name: 'contact', meta: 'email and socials' },
  { name: 'spin', meta: 'kick the core into a spin' },
  { name: 'pulse', meta: 'send a shockwave through the core' },
  { name: 'clear', meta: 'wipe the output' },
  { name: 'hire', meta: 'permission denied' },
  { name: 'sudo hire-felix', meta: 'access granted' },
]

function optHtml(o: Opt, i: number): string {
  const attrs = [
    `class="opt" role="option" id="o${i}" data-kind="${o.kind}"`,
    o.cmd ? `data-cmd="${t(o.cmd)}"` : '',
    o.ch !== undefined ? `data-ch="${o.ch}"` : '',
  ]
    .filter(Boolean)
    .join(' ')
  const inner =
    `<span class="og" aria-hidden="true">${o.glyph}</span>` +
    `<span class="ol">${o.label}</span>` +
    `<span class="om">${o.meta}</span>` +
    `<span class="ok">${o.kind}</span>`
  const ext = o.ext ? ' target="_blank" rel="noopener noreferrer"' : ''
  return o.href
    ? `<a ${attrs} href="${o.href}"${ext}>${inner}</a>`
    : `<button type="button" ${attrs}>${inner}</button>`
}

export function after(): string {
  const groups: { title: string; opts: Opt[] }[] = []

  groups.push({
    title: 'go',
    opts: [
      { kind: 'hero', glyph: '§', label: 'Top', meta: 'the core, the numbers, the bio', href: '/', ch: 0 },
      ...NAVS.map((n) => ({
        kind: 'section',
        glyph: '§',
        label: n.label,
        meta: clip(SECTIONS[n.key].title, 54),
        href: `/#${n.key}`,
        ch: n.from,
      })),
    ],
  })

  groups.push({
    title: 'run',
    opts: COMMANDS.map((c) => ({ kind: 'command', glyph: '$', label: c.name, meta: c.meta, cmd: c.name })),
  })

  groups.push({
    title: 'career',
    opts: careers.map((c) => ({
      kind: 'career',
      glyph: '▸',
      label: t(c.title),
      meta: `${t(c.jobTitle)} · ${t(c.startDate)} – ${t(c.endDate)}`,
      href: `/career/${c.slug}/`,
    })),
  })

  groups.push({
    title: 'built',
    opts: projects.map((p) => ({
      kind: 'project',
      glyph: '◆',
      label: t(p.title),
      meta: clip(p.excerpt, 58),
      href: `/projects/${p.slug}/`,
    })),
  })

  groups.push({
    title: 'writing',
    opts: blogPosts.map((b) => ({
      kind: 'post',
      glyph: '¶',
      label: clip(b.title, 56),
      meta: year(b.publishedDate),
      href: `/blog/${b.slug}/`,
    })),
  })

  groups.push({
    title: 'elsewhere',
    opts: [
      { kind: 'email', glyph: '@', label: EMAIL, meta: 'copy or open a draft', href: `mailto:${EMAIL}` },
      ...SOCIALS.map((s) => ({
        kind: 'link',
        glyph: '↗',
        label: s.name,
        meta: s.url.replace(/^https?:\/\/(www\.)?/, ''),
        href: s.url,
        ext: true,
      })),
    ],
  })

  let n = 0
  const body = groups
    .map(
      (g) =>
        `<div class="grp" aria-hidden="true"><span>${g.title}</span><em>${g.opts.length}</em></div>` +
        g.opts.map((o) => optHtml(o, n++)).join(''),
    )
    .join('')

  const places = groups.reduce((s, g) => s + (g.title === 'run' ? 0 : g.opts.length), 0)
  const live = TOOLS.filter((x) => x.live).length
  const feat = FEATURED.length

  return `
    <dialog id="con" class="con" aria-label="Signal console">
      <div class="con-in">
        <form class="con-top" id="con-form" autocomplete="off">
          <span class="con-prompt" aria-hidden="true">felix@portfolio<span class="con-path"> :~/</span></span>
          <label class="sr" for="con-input">Type a command, or the name of a place to go</label>
          <input
            id="con-input"
            class="con-input mono"
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="con-list"
            aria-autocomplete="list"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            enterkeyhint="go"
            placeholder="search, or run a command"
          />
          <button type="button" class="con-x" id="con-close" aria-label="Close the console"><span>esc</span></button>
        </form>

        <div class="con-body">
          <div class="con-col con-left">
            <div class="con-list" id="con-list" role="listbox" aria-label="Commands and destinations">${body}</div>
            <p class="con-empty" id="con-empty" hidden>nothing matches — press <b>⏎</b> to run it as a command</p>
          </div>
          <div class="con-col con-right">
            <div class="con-out" id="con-out" role="log" aria-live="polite" aria-label="Console output">
              <p class="tl"><span class="p">›</span><span>signal console · <b>${places}</b> places · <b>${COMMANDS.length}</b> commands</span></p>
              <p class="tl"><span class="p">›</span><span><span class="k">${feat}</span> products · <span class="k">${careers.length}</span> roles · <span class="k">${TOOLS.length}</span> tools (${live} live) · <span class="k">${blogPosts.length}</span> posts</span></p>
              <p class="tl dim"><span class="p">›</span><span>type to filter · ⏎ to run · try <b>help</b></span></p>
            </div>
          </div>
        </div>

        <footer class="con-foot">
          <span><b>↑↓</b> move</span><span><b>⏎</b> run</span><span><b>j</b>/<b>k</b> chapter</span><span><b>esc</b> close</span>
          <span class="con-hint">real engineers use <span class="k">sudo</span></span>
        </footer>
      </div>
    </dialog>`
}
