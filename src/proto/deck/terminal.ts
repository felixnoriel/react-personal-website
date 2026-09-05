import { BIO, EMAIL, ROLES, SOCIALS, TERMINAL } from '../shared/content'

/**
 * A terminal that actually runs. The power-on reveal is a clip animation over
 * text that is already in the HTML — nothing reflows, and a visitor without JS
 * reads exactly the same words. Every command answers from the real content
 * data; the stack probe reads each key's own record off the DOM.
 */

type Span = [cls: string, text: string]

const MAX_LINES = 140

export class DeckTerminal {
  private out: HTMLElement
  private form: HTMLFormElement | null
  private input: HTMLInputElement | null
  private lines: HTMLParagraphElement[]
  private probeEls: HTMLParagraphElement[] | null = null
  private phone = false
  private timers: number[] = []

  constructor(root: HTMLElement) {
    this.out = root
    this.form = document.getElementById('term-form') as HTMLFormElement | null
    this.input = document.getElementById('term-input') as HTMLInputElement | null
    this.lines = Array.from(root.querySelectorAll<HTMLParagraphElement>('.tl[data-line]'))
    this.phone = window.matchMedia('(max-width: 900px)').matches

    this.form?.addEventListener('submit', (e) => {
      e.preventDefault()
      const v = (this.input?.value || '').trim()
      if (this.input) this.input.value = ''
      if (v) this.run(v)
    })
  }

  /** the power-on reveal, ~980ms end to end */
  boot(reduced: boolean) {
    if (reduced) {
      this.lines.forEach((l) => {
        l.style.clipPath = 'none'
        l.style.opacity = '1'
      })
      this.caret()
      return
    }
    const wipe = !this.phone
    // hold every line back with an inline style: the .fx-boot class is gone by
    // now, and a line whose turn has not come must not flash into view
    this.lines.forEach((l) => {
      if (wipe) l.style.clipPath = 'inset(0 100% 0 0)'
      else l.style.opacity = '0'
    })
    const at = [60, 330, 520, 660, 800]
    this.lines.forEach((line, i) => {
      const chars = Number(line.style.getPropertyValue('--n')) || 40
      const delay = at[i] ?? 60 + i * 170
      const t = window.setTimeout(() => {
        line.style.animation = wipe
          ? `reveal ${Math.min(90 + chars * 5, 340)}ms steps(${Math.max(6, Math.round(chars / 2.4))}, end) both`
          : 'tlrise 240ms cubic-bezier(.16,.84,.3,1) both'
        if (!wipe) {
          line.style.clipPath = 'none'
          line.style.opacity = '1'
        }
      }, delay)
      this.timers.push(t)
    })
    const t = window.setTimeout(() => this.caret(), 1080)
    this.timers.push(t)
  }

  private caret() {
    if (this.out.querySelector('.caretline')) return
    const p = this.line([
      ['p', '$'],
      ['', ' '],
    ])
    p.classList.add('caretline')
    const c = document.createElement('span')
    c.className = 'caret'
    p.appendChild(c)
    this.out.appendChild(p)
    this.scroll()
  }

  private line(spans: Span[]) {
    const p = document.createElement('p')
    p.className = 'tl out'
    for (const [cls, text] of spans) {
      if (!cls) {
        p.appendChild(document.createTextNode(text))
      } else {
        const s = document.createElement('span')
        s.className = cls
        s.textContent = text
        p.appendChild(s)
      }
    }
    return p
  }

  private push(p: HTMLParagraphElement) {
    const caret = this.out.querySelector('.caretline')
    if (caret) this.out.insertBefore(p, caret)
    else this.out.appendChild(p)
    const kids = this.out.children
    while (kids.length > MAX_LINES) this.out.removeChild(kids[0])
    this.scroll()
    return p
  }

  private scroll() {
    this.out.scrollTop = this.out.scrollHeight
  }

  echo(cmd: string) {
    this.push(
      this.line([
        ['p', '$'],
        ['w', ' ' + cmd],
      ]),
    )
  }

  say(text: string, cls = 'g') {
    return this.push(
      this.line([
        [cls, '›'],
        ['', ' ' + text],
      ]),
    )
  }

  /** hovering a key on the bed reads that key's record out loud */
  probe(name: string, record: string) {
    const a = this.line([
      ['p', '$'],
      ['w', ' stack ' + name.toLowerCase().replace(/[^a-z0-9.+]/g, '')],
    ])
    const b = this.line([
      ['g', '›'],
      ['', ' '],
      ['k', record],
    ])
    const prev = this.probeEls
    if (prev && prev[1].parentNode === this.out && this.isTail(prev[1])) {
      this.out.replaceChild(a, prev[0])
      this.out.replaceChild(b, prev[1])
    } else {
      this.push(a)
      this.push(b)
    }
    this.probeEls = [a, b]
    this.scroll()
  }

  private isTail(el: Element) {
    const caret = this.out.querySelector('.caretline')
    const last = caret ? caret.previousElementSibling : this.out.lastElementChild
    return last === el
  }

  run(raw: string) {
    const cmd = raw.trim().toLowerCase()
    this.echo(raw.trim())
    this.probeEls = null
    switch (cmd) {
      case 'help':
        this.say('commands: ' + TERMINAL.commands.join(' · '))
        this.say('try: sudo hire-felix', 'dim')
        break
      case 'whoami':
        BIO.forEach((b) => this.say(b))
        break
      case 'work':
      case 'projects':
        ROLES.slice(0, 5).forEach((r) => this.say(`${r.company} — ${r.title} · ${r.when}`))
        this.say(`+ ${ROLES.length - 5} more, 2013 → now · scroll for the full record`, 'dim')
        break
      case 'skills':
      case 'stack': {
        const chips = document.querySelectorAll<HTMLElement>('#keybed .chip')
        chips.forEach((c) => this.say(`${c.dataset.tech} — ${c.dataset.rec}`))
        break
      }
      case 'contact':
        this.say(EMAIL, 'k')
        SOCIALS.forEach((s) => this.say(`${s.name} — ${s.url}`))
        break
      case 'clear': {
        this.out.replaceChildren()
        this.caret()
        break
      }
      case 'sudo hire-felix':
        this.say(TERMINAL.hire.granted, 'p')
        break
      case 'hire-felix':
        this.say(TERMINAL.hire.denied, 'k')
        break
      default:
        this.say(`command not found: ${raw.trim()} — try "help"`, 'dim')
    }
  }

  focus() {
    this.input?.focus()
  }

  destroy() {
    this.timers.forEach(clearTimeout)
  }
}
