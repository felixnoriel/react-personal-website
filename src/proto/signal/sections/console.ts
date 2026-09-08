/**
 * CONSOLE — the live half of the header and the command console.
 *
 * Cost model, because this runs while the GPU owns the frame:
 *   · per frame: at most TWO custom-property writes (--m on the header and on
 *     the phone strip). Every tick's height and colour and every section
 *     link's underline are calc()s off that one number, in CSS.
 *   · per chapter change (eight times a page): a handful of class toggles.
 *   · nothing else. No layout reads inside onFrame.
 *
 * The scene only ticks when a GPU tier ignited, so there is a scroll-driven
 * fallback for the CSS tier that reads the same chapter anchors.
 *
 * This module must NOT import the blog/career/project data — every
 * destination is already real HTML in the page (console.html.ts).
 */
import { BIO, EMAIL, FEATURED, SOCIALS, TERMINAL, TOOLS } from '../../shared/content'
import { chapterAt, measureChapters, morphAt } from '../chapters'
import type { Scene } from '../scene'

type Chunk = string | { t: string; c?: string; href?: string; ext?: boolean }
interface Row {
  chunks: Chunk[]
  cls?: string
}

const MAX_LINES = 70
const pad2 = (n: number) => (n < 10 ? '0' : '') + n
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)

export function init(scene: Scene) {
  const hdr = document.getElementById('hdr')
  const strip = document.getElementById('chapstrip')
  const dlg = document.getElementById('con') as HTMLDialogElement | null
  if (!hdr) return

  const reduced = scene.reduced
  const smooth: ScrollBehavior = reduced ? 'auto' : 'smooth'

  /* ------------------------------------------------------ the chapters */

  const ticks = Array.from(document.querySelectorAll<HTMLElement>('.gt'))
  const navLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('.chapnav a'))
  const gcur = document.getElementById('gcur')
  const csNum = document.getElementById('csNum')
  const csName = document.getElementById('csName')

  /** chapter index → { name, selector }, read from the markup itself */
  const CH: { name: string; target: string }[] = []
  for (const t of ticks) {
    const i = Number(t.dataset.ch)
    if (Number.isFinite(i) && !CH[i]) CH[i] = { name: t.dataset.name || '', target: t.dataset.target || '' }
  }
  const LAST = CH.length - 1

  function chapterEl(i: number): Element | null {
    const sel = CH[i]?.target
    if (!sel || sel === '#top') return null
    try {
      return document.querySelector(sel)
    } catch {
      return null
    }
  }

  /**
   * The header ships on every route. Only the home page has the eight chapter
   * anchors, so everywhere else the gauge steps aside and the links stay plain
   * links that navigate home.
   */
  const home = document.querySelectorAll('[data-shape]').length > 3
  if (!home) hdr.classList.add('subpage')
  /** the home page's own URL, already rebased by the renderer */
  const HOME = (document.querySelector<HTMLAnchorElement>('.hdr .mark')?.getAttribute('href') || '/').split('#')[0]

  function goto(i: number) {
    const n = clamp(Math.round(i), 0, LAST)
    const el = chapterEl(n)
    if (!el && n > 0) return false
    const top = el ? el.getBoundingClientRect().top + window.scrollY - 6 : 0
    window.scrollTo({ top: Math.max(0, top), behavior: smooth })
    return true
  }

  let shownM = -99
  let shownCh = -1
  // read once, and only when a chapter first changes: getComputedStyle on the
  // root forces a style recalc, which has no business running at start-up
  let lime = ''
  const limeToken = () =>
    (lime ||= (getComputedStyle(document.documentElement).getPropertyValue('--lime') || '79 41% 74%').trim())

  function apply(m: number, chapter: number) {
    const mv = clamp(m, 0, LAST)
    if (Math.abs(mv - shownM) > 0.004) {
      shownM = mv
      const s = mv.toFixed(3)
      hdr!.style.setProperty('--m', s)
      strip?.style.setProperty('--m', s)
    }
    // the discrete chapter comes from which anchor is on screen, not from the
    // eased morph — the label must change the moment the section arrives
    const ch = clamp(Math.round(chapter), 0, LAST)
    if (ch === shownCh) return
    shownCh = ch
    const label = CH[ch]?.name || ''
    if (gcur) gcur.textContent = pad2(ch + 1)
    if (csNum) csNum.textContent = pad2(ch + 1)
    if (csName) csName.textContent = label
    for (const t of ticks) t.classList.toggle('now', Number(t.dataset.ch) === ch)
    for (const a of navLinks) {
      const on = ch >= Number(a.dataset.from) && ch <= Number(a.dataset.to)
      if (on) a.setAttribute('aria-current', 'true')
      else a.removeAttribute('aria-current')
      // a one-shot scan on the label that just became current. Web Animations
      // rather than a class, so nothing here ever reads layout inside a frame.
      if (on && !reduced)
        a.firstElementChild?.animate(
          [
            { textShadow: '0 0 0 hsl(' + limeToken() + ' / 0)' },
            { textShadow: '0 0 13px hsl(' + limeToken() + ' / 0.95)', offset: 0.22 },
            { textShadow: '0 0 0 hsl(' + limeToken() + ' / 0)' },
          ],
          { duration: 640, easing: 'cubic-bezier(.16,1,.3,1)' },
        )
    }
  }

  // The scene drives this whenever a GPU tier is alive. On the CSS tier the
  // render loop never starts, so a scroll-driven fallback reads the same
  // chapter anchors chapters.ts already measured.
  if (home) scene.onFrame((f) => apply(f.morph, f.chapter))

  let queued = false
  const selfTick = () => {
    queued = false
    if (scene.live) return
    const y = window.scrollY
    apply(morphAt(y), chapterAt(y))
  }
  const nudge = () => {
    if (!queued) {
      queued = true
      requestAnimationFrame(selfTick)
    }
  }
  if (home) addEventListener('scroll', nudge, { passive: true })
  let rt = 0
  addEventListener('resize', () => {
    clearTimeout(rt)
    rt = window.setTimeout(() => {
      if (scene.live) return
      measureChapters()
      nudge()
    }, 200)
  })
  addEventListener('load', () => {
    if (!scene.live) apply(morphAt(window.scrollY), chapterAt(window.scrollY))
  })
  if (home) apply(morphAt(window.scrollY), chapterAt(window.scrollY))

  for (const t of ticks) {
    t.addEventListener('click', (e) => {
      const n = Number(t.dataset.ch)
      e.preventDefault()
      if (!goto(n)) location.assign(HOME)
    })
  }
  for (const a of navLinks) {
    a.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || !home) return
      const hash = (a.getAttribute('href') || '').replace(/^[^#]*/, '')
      if (!goto(Number(a.dataset.from))) return
      e.preventDefault()
      history.replaceState(null, '', hash || location.pathname)
    })
    a.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
      if (!d) return
      e.preventDefault()
      const i = navLinks.indexOf(a)
      navLinks[clamp(i + d, 0, navLinks.length - 1)]?.focus()
    })
  }
  if (home)
    document.querySelector<HTMLAnchorElement>('.hdr .mark')?.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: smooth })
    })


  /* -------------------------------------------------------- the console */

  if (!dlg) return
  const kbdBtn = document.getElementById('kbd-k')

  /**
   * Sixty rows of real HTML are already in the page; reading them costs a few
   * milliseconds, so the wiring waits for an idle slice — or for the first
   * time somebody actually opens the console, whichever comes first.
   */
  const openHooks: (() => void)[] = []
  /** set by wire(); the header's keys use them before and after mounting */
  let openConsole: (() => void) | null = null
  let closeConsole: (() => void) | null = null
  let runCmd: ((c: string) => void) | null = null

  let mounted = false
  function mount() {
    if (mounted) return
    mounted = true
    wire()
  }
  const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: object) => void }).requestIdleCallback
  if (idle) idle(() => mount(), { timeout: 2500 })
  else setTimeout(mount, 1200)

  const hasCommand = 'command' in HTMLButtonElement.prototype
  if (hasCommand)
    dlg.addEventListener('command', ((e: Event & { command?: string }) => {
      if (e.command !== 'show-modal') return
      mount()
      requestAnimationFrame(() => openHooks.forEach((f) => f()))
    }) as EventListener)

  /* ---- the keyboard: chapters and the console, live from the first frame ---- */

  addEventListener('keydown', (e) => {
    const el = e.target as HTMLElement | null
    const typing = !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
    const open = dlg!.open
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault()
      kbdBtn?.classList.add('down')
      setTimeout(() => kbdBtn?.classList.remove('down'), 190)
      mount()
      if (open) closeConsole?.()
      else openConsole?.()
      return
    }
    if (open || typing || e.metaKey || e.ctrlKey || e.altKey) return
    const k = e.key
    if (k === '/' || k === '?') {
      e.preventDefault()
      mount()
      openConsole?.()
      if (k === '?') runCmd?.('help')
      return
    }
    const down = k === 'j' || (e.shiftKey && k === 'ArrowDown')
    const up = k === 'k' || (e.shiftKey && k === 'ArrowUp')
    if (!down && !up) return
    if (e.shiftKey && k !== 'ArrowDown' && k !== 'ArrowUp') return
    e.preventDefault()
    goto(clamp(shownCh + (down ? 1 : -1), 0, LAST))
  })

  function wire() {
  const dg = dlg as HTMLDialogElement
  const panel = dg.querySelector<HTMLElement>('.con-in')
  const input = document.getElementById('con-input') as HTMLInputElement | null
  const list = document.getElementById('con-list')
  const out = document.getElementById('con-out')
  const empty = document.getElementById('con-empty')
  if (!panel || !input || !list || !out || !empty) return

  const allNodes = Array.from(list.children) as HTMLElement[]
  const items = Array.from(list.querySelectorAll<HTMLElement>('.opt')).map((el) => {
    const label = el.querySelector<HTMLElement>('.ol')?.textContent || ''
    const meta = el.querySelector<HTMLElement>('.om')?.textContent || ''
    return { el, label, key: `${label} ${meta} ${el.dataset.kind || ''}`.toLowerCase() }
  })
  let shown = items.slice()
  let sel = 0

  /* ---- output ---- */

  function say(chunks: Chunk[], cls = '') {
    const p = document.createElement('p')
    p.className = 'tl' + (cls ? ' ' + cls : '') + (reduced ? '' : ' new')
    const g = document.createElement('span')
    g.className = 'p'
    g.textContent = cls === 'cmd' ? '$' : '›'
    p.appendChild(g)
    const body = document.createElement('span')
    for (const c of chunks) {
      if (typeof c === 'string') {
        body.appendChild(document.createTextNode(c))
        continue
      }
      const el = c.href ? document.createElement('a') : document.createElement('span')
      if (c.href) {
        ;(el as HTMLAnchorElement).href = c.href
        if (c.ext) {
          ;(el as HTMLAnchorElement).target = '_blank'
          ;(el as HTMLAnchorElement).rel = 'noopener noreferrer'
        }
      }
      if (c.c) el.className = c.c
      el.textContent = c.t
      body.appendChild(el)
    }
    p.appendChild(body)
    out!.appendChild(p)
    // the blinking prompt always sits last
    const c = out!.querySelector('.caretline')
    if (c) out!.appendChild(c)
    while (out!.children.length > MAX_LINES) out!.removeChild(out!.children[0])
    out!.scrollTop = out!.scrollHeight
    return p
  }

  /** the live prompt line at the foot of the scrollback */
  function caret() {
    let c = out!.querySelector<HTMLElement>('.caretline')
    if (!c) {
      c = document.createElement('p')
      c.className = 'tl caretline'
      const g = document.createElement('span')
      g.className = 'p'
      g.textContent = '$'
      const b = document.createElement('span')
      b.className = 'caret'
      c.append(g, b)
    }
    out!.appendChild(c)
    out!.scrollTop = out!.scrollHeight
  }

  /** print several lines with a small stagger, the way the old terminal did */
  function stream(rows: Row[], step = 70) {
    if (reduced) {
      rows.forEach((r) => say(r.chunks, r.cls))
      return
    }
    rows.forEach((r, i) => setTimeout(() => say(r.chunks, r.cls), i * step))
  }

  /** the one-line description a project already carries in the palette */
  function projMeta(title: string) {
    const it = items.find((i) => i.el.dataset.kind === 'project' && i.label === title)
    return it?.el.querySelector<HTMLElement>('.om')?.textContent || ''
  }

  /** the measured state of the core, never invented */
  function coreLine(): Chunk[] {
    const s = (window as Window & { __signal?: { tier: string; count: number; fps: number; ms: number } }).__signal
    if (!s) return [{ t: 'core: ', c: '' }, { t: 'CSS tier — no GPU behind the page', c: 'w' }]
    return [
      'core: ',
      { t: s.tier, c: 'k' },
      ' · ',
      { t: String(s.count.toLocaleString('en-GB')), c: 'w' },
      ' particles · ',
      { t: `${s.ms}ms`, c: 'w' },
      ' frame',
    ]
  }

  /* ---- commands ---- */

  const JUMPS: Record<string, number> = { work: 3, skills: 4, stack: 4 }

  function run(raw: string) {
    const cmd = raw.trim()
    if (!cmd) return
    const c = cmd.toLowerCase()
    say([{ t: cmd, c: 'w' }], 'cmd')

    if (c === 'clear') {
      out!.replaceChildren()
      say(['output cleared · type ', { t: 'help', c: 'k' }, ' for the list'], 'dim')
      caret()
      return
    }
    if (c === 'help' || c === '?') {
      stream([
        { chunks: ['commands · ', { t: TERMINAL.commands.join(' · '), c: 'w' }] },
        { chunks: ['core · ', { t: 'spin', c: 'w' }, ' · ', { t: 'pulse', c: 'w' }] },
        { chunks: ['keys · ', { t: 'j', c: 'w' }, ' / ', { t: 'k', c: 'w' }, ' move a chapter · ', { t: '⌘K', c: 'w' }, ' opens this · ', { t: 'esc', c: 'w' }, ' closes'] },
        { chunks: ['type any name above to jump straight to it'], cls: 'dim' },
        { chunks: ['hint: real engineers use ', { t: 'sudo', c: 'k' }], cls: 'dim' },
      ])
      return
    }
    if (c === 'whoami') {
      const rows: Row[] = BIO.map((b) => ({ chunks: [b] }))
      rows.push({ chunks: [{ t: 'felix@portfolio', c: 'k' }, ' · ', { t: EMAIL, c: 'w', href: 'mailto:' + EMAIL }] })
      stream(rows, 110)
      return
    }
    if (c === 'work') {
      const rows: Row[] = FEATURED.map((f) => ({
        chunks: [
          { t: f.title, c: 'w' },
          f.outcomes ? ' — ' + f.outcomes.map((o) => `${o.figure} ${o.label}`).join(' · ') : ' — ' + projMeta(f.title),
        ],
      }))
      rows.push({ chunks: ['jumping to selected work…'], cls: 'dim' })
      stream(rows)
      jump(JUMPS[c])
      return
    }
    if (c === 'projects') {
      const rows: Row[] = items
        .filter((i) => i.el.dataset.kind === 'project')
        .map((i) => ({
          chunks: [
            { t: i.label, c: 'w', href: i.el.getAttribute('href') || '#' },
            ' — ',
            i.el.querySelector<HTMLElement>('.om')?.textContent || '',
          ],
        }))
      stream(rows, 55)
      return
    }
    if (c === 'skills' || c === 'stack') {
      const live = TOOLS.filter((t) => t.live).length
      const legacy = TOOLS.filter((t) => t.legacy).length
      const by = (d: string) => TOOLS.filter((t) => t.domain === d).length
      stream([
        { chunks: [{ t: String(TOOLS.length), c: 'k' }, ' tools · ', { t: String(live), c: 'k' }, ' live · ', { t: String(legacy), c: 'k' }, ' retired'] },
        { chunks: [`front end ${by('frontend')} · back end ${by('backend')} · infrastructure ${by('infra')}`] },
        { chunks: ['jumping to capabilities…'], cls: 'dim' },
      ])
      jump(JUMPS[c])
      return
    }
    if (c === 'contact') {
      const rows: Row[] = [{ chunks: [{ t: EMAIL, c: 'w', href: 'mailto:' + EMAIL }] }]
      for (const s of SOCIALS)
        rows.push({ chunks: [{ t: s.name, c: 'w', href: s.url, ext: true }, ' — ', s.url.replace(/^https?:\/\/(www\.)?/, '')] })
      rows.push({ chunks: ['type the address above and press ⏎ to copy it'], cls: 'dim' })
      stream(rows)
      return
    }
    if (c === 'spin') {
      scene.spin(scene.phone ? 190 : 320, 40)
      say(scene.live ? ['core: yaw impulse sent'] : ['core: CSS tier — nothing to spin'], scene.live ? '' : 'dim')
      if (scene.live) say(coreLine(), 'dim')
      return
    }
    if (c === 'pulse') {
      scene.fire()
      say(scene.live ? ['core: shockwave released from the well'] : ['core: CSS tier — no swarm to push'], scene.live ? '' : 'dim')
      if (scene.live) say(coreLine(), 'dim')
      return
    }
    if (c === 'sudo hire-felix' || c === 'sudo hire felix' || c === 'sudo hire') {
      scene.fire()
      panel!.classList.remove('granted')
      void panel!.offsetWidth
      panel!.classList.add('granted')
      say([{ t: 'access granted', c: 'k' }, ' — offer inbound. felix@', { t: 'your-team', c: 'w' }, ' provisioned ✓'])
      say(['send it to ', { t: EMAIL, c: 'w', href: 'mailto:' + EMAIL }], 'dim')
      return
    }
    if (c === 'hire' || c === 'hire-felix' || c === 'hire felix') {
      say([TERMINAL.hire.denied.replace('sudo hire-felix', ''), { t: 'sudo hire-felix', c: 'k' }], 'warn')
      return
    }
    say(['command not found: ', { t: cmd, c: 'w' }, ' — try ', { t: 'help', c: 'k' }], 'dim')
  }

  function jump(ch: number | undefined) {
    if (ch === undefined) return
    setTimeout(
      () => {
        close()
        if (!goto(ch)) location.assign(HOME + '#' + (CH[ch]?.name || '').toLowerCase())
      },
      reduced ? 0 : 480,
    )
  }

  /* ---- filtering ---- */

  const edge = (h: string, i: number) => i === 0 || !/[a-z0-9]/.test(h[i - 1])

  /**
   * A substring wins; a subsequence only counts when it starts on a word
   * boundary and stays tight, otherwise four letters would "match" half the
   * blog archive.
   */
  function score(needle: string, hay: string) {
    const i = hay.indexOf(needle)
    if (i >= 0)
      return { s: (edge(hay, i) ? 1000 : 860) - i * 3 - hay.length * 0.15, at: [i, i + needle.length] as [number, number] }
    if (needle.length < 2) return null
    let j = 0
    let first = -1
    let spread = 0
    let prev = -1
    for (let k = 0; k < hay.length && j < needle.length; k++) {
      if (hay[k] === needle[j]) {
        if (first < 0) first = k
        if (prev >= 0) spread += k - prev - 1
        prev = k
        j++
      }
    }
    if (j < needle.length || !edge(hay, first) || spread > needle.length * 2 + 4) return null
    return { s: 560 - spread * 8 - first, at: null }
  }

  function mark(el: HTMLElement, label: string, at: [number, number] | null) {
    const t = el.querySelector<HTMLElement>('.ol')
    if (!t) return
    if (!at) {
      t.textContent = label
      return
    }
    t.replaceChildren(
      document.createTextNode(label.slice(0, at[0])),
      Object.assign(document.createElement('mark'), { textContent: label.slice(at[0], at[1]) }),
      document.createTextNode(label.slice(at[1])),
    )
  }

  function filter(q: string) {
    const n = q.trim().toLowerCase()
    if (!n) {
      shown = items.slice()
      items.forEach((i) => mark(i.el, i.label, null))
      list!.replaceChildren(...allNodes)
      empty!.hidden = true
    } else {
      const hit: { it: (typeof items)[number]; s: number; at: [number, number] | null }[] = []
      for (const it of items) {
        const low = it.label.toLowerCase()
        let r = score(n, low)
        if (!r) {
          const k = score(n, it.key)
          if (k) r = { s: k.s - 380, at: null }
        }
        if (r) hit.push({ it, s: r.s, at: r.at })
      }
      hit.sort((a, b) => b.s - a.s)
      shown = hit.map((h) => h.it)
      hit.forEach((h) => mark(h.it.el, h.it.label, h.at))
      list!.replaceChildren(...hit.map((h) => h.it.el))
      empty!.hidden = hit.length > 0
    }
    list!.scrollTop = 0
    sel = 0
    select(0, false)
  }

  function select(i: number, scroll = true) {
    sel = clamp(i, 0, Math.max(0, shown.length - 1))
    for (let k = 0; k < items.length; k++) items[k].el.classList.remove('sel')
    const cur = shown[sel]
    if (!cur) {
      input!.removeAttribute('aria-activedescendant')
      return
    }
    cur.el.classList.add('sel')
    input!.setAttribute('aria-activedescendant', cur.el.id)
    if (scroll) cur.el.scrollIntoView({ block: 'nearest' })
  }

  /* ---- activation ---- */

  function activate(el: HTMLElement) {
    const cmd = el.dataset.cmd
    if (cmd) {
      input!.value = ''
      filter('')
      run(cmd)
      input!.focus()
      return
    }
    const href = el.getAttribute('href') || ''
    if (href.startsWith('mailto:')) {
      const addr = href.slice(7)
      const copy = navigator.clipboard?.writeText?.(addr)
      if (copy)
        copy
          .then(() => say(['copied ', { t: addr, c: 'k' }, ' to the clipboard']))
          .catch(() => say(['open a draft: ', { t: addr, c: 'w', href }]))
      else say(['open a draft: ', { t: addr, c: 'w', href }])
      return
    }
    const hash = href.includes('#') ? href.slice(href.indexOf('#')) : ''
    const ch = Number(el.dataset.ch)
    if (Number.isFinite(ch) && el.dataset.kind !== 'command' && home) {
      close()
      goto(ch)
      history.replaceState(null, '', hash || href)
      return
    }
    if (href) {
      if (el.getAttribute('target') === '_blank') window.open(href, '_blank', 'noopener,noreferrer')
      else location.assign(href)
    }
  }

  list.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('.opt')
    if (!el) return
    e.preventDefault()
    select(shown.findIndex((s) => s.el === el))
    activate(el)
  })
  list.addEventListener(
    'pointermove',
    (e) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>('.opt')
      if (!el || el.classList.contains('sel')) return
      const i = shown.findIndex((s) => s.el === el)
      if (i >= 0) select(i, false)
    },
    { passive: true },
  )

  /* ---- open / close ---- */

  const modal = typeof dg.showModal === 'function'
  let closing = 0
  let scrollLock = ''

  let greeted = false
  function afterOpen() {
    // the page behind a modal still scrolls with the wheel; hold it still.
    // html already hides its scrollbar, so nothing reflows.
    scrollLock = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    if (input!.value) {
      input!.value = ''
      filter('')
    } else select(0, false)
    input!.focus()
    if (!greeted) {
      greeted = true
      say(coreLine(), 'dim')
      caret()
    }
    if (!reduced) scene.fire()
  }

  function open() {
    if (dg.open) return
    if (modal) dg.showModal()
    else dg.setAttribute('open', '')
    afterOpen()
  }

  const endClose = (e: AnimationEvent) => {
    if (e.target === dg) done()
  }
  function done() {
    clearTimeout(closing)
    dg.removeEventListener('animationend', endClose)
    dg.classList.remove('closing')
    document.documentElement.style.overflow = scrollLock
    if (!dg.open) return
    if (modal) dg.close()
    else dg.removeAttribute('open')
  }

  function close() {
    if (!dg.open || dg.classList.contains('closing')) return
    clearTimeout(closing)
    if (reduced) {
      done()
      return
    }
    dg.classList.add('closing')
    closing = window.setTimeout(done, 260)
    dg.addEventListener('animationend', endClose)
  }

  // Invoker commands open the dialog on their own (Baseline since Dec 2025):
  // only wire a click when the engine has no CommandEvent, so nothing opens twice.
  if (hasCommand) {
    openHooks.push(afterOpen)
    // the command that mounted this module fired before wire() ran
    if (dg.open) afterOpen()
  } else {
    kbdBtn?.addEventListener('click', open)
    document.querySelector('.cs-open')?.addEventListener('click', () => open())
  }

  document.getElementById('con-close')?.addEventListener('click', close)
  dg.addEventListener('cancel', (e) => {
    e.preventDefault()
    close()
  })
  dg.addEventListener('pointerdown', (e) => {
    if (e.target === dg) close()
  })

  input.addEventListener('input', () => filter(input.value))
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      select(sel + 1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      select(sel - 1)
    } else if (e.key === 'Home' && !input.value) {
      e.preventDefault()
      select(0)
    } else if (e.key === 'End' && !input.value) {
      e.preventDefault()
      select(shown.length - 1)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const cur = shown[sel]
      if (cur) activate(cur.el)
      else {
        const v = input.value
        input.value = ''
        filter('')
        run(v)
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      if (input.value) {
        input.value = ''
        filter('')
      } else close()
    }
  })

  openConsole = open
  closeConsole = close
  runCmd = run
  }
}
