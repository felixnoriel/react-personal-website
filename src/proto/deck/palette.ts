import { EMAIL, SOCIALS, TERMINAL } from '../shared/content'
import type { DeckTerminal } from './terminal'

/**
 * The palette is a pane that arrives from depth. The flight is a real
 * same-document View Transition (Baseline since Firefox 144), so the browser
 * animates a snapshot on the compositor instead of us animating a big blurred
 * card on the main thread. The opening button uses an invoker command, with a
 * plain click listener for engines that do not have CommandEvent yet.
 */

interface Cmd {
  glyph: string
  label: string
  kind: string
  go: () => void
}

const anyDoc = document as unknown as {
  startViewTransition?: (cb: unknown) => { finished: Promise<void> }
}

function transition(update: () => void, type: string) {
  if (!anyDoc.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    update()
    return
  }
  try {
    anyDoc.startViewTransition({ update, types: [type] })
  } catch {
    anyDoc.startViewTransition(update)
  }
}

export function mountPalette(term: DeckTerminal) {
  const root = document.getElementById('palette')
  const input = document.getElementById('pal-input') as HTMLInputElement | null
  const list = document.getElementById('pal-list')
  const opener = document.getElementById('kbd-k')
  if (!root || !input || !list) return { open: () => {}, close: () => {} }

  const cmds: Cmd[] = [
    ...TERMINAL.commands.map((c) => ({
      glyph: '$',
      label: c,
      kind: 'run',
      go: () => term.run(c),
    })),
    { glyph: '$', label: 'sudo hire-felix', kind: 'run', go: () => term.run('sudo hire-felix') },
    {
      glyph: '@',
      label: EMAIL,
      kind: 'email',
      go: () => window.open('mailto:' + EMAIL, '_self'),
    },
    ...SOCIALS.map((s) => ({
      glyph: '↗',
      label: s.name,
      kind: 'link',
      go: () => window.open(s.url, '_blank', 'noopener'),
    })),
  ]

  let shown: Cmd[] = cmds
  let sel = 0
  let open = false

  function render(q: string) {
    const needle = q.trim().toLowerCase()
    shown = needle ? cmds.filter((c) => c.label.toLowerCase().includes(needle)) : cmds
    sel = 0
    list!.replaceChildren()
    shown.forEach((c, i) => {
      const li = document.createElement('li')
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'cmdbtn'
      b.setAttribute('role', 'option')
      b.setAttribute('aria-selected', String(i === 0))
      b.innerHTML = ''
      const g = document.createElement('span')
      g.className = 'glyph'
      g.textContent = c.glyph
      const t = document.createElement('span')
      t.textContent = c.label
      const k = document.createElement('span')
      k.className = 'kind'
      k.textContent = c.kind
      b.append(g, t, k)
      b.addEventListener('click', () => {
        fire(i)
      })
      li.appendChild(b)
      list!.appendChild(li)
    })
  }

  function mark() {
    const btns = list!.querySelectorAll<HTMLButtonElement>('.cmdbtn')
    btns.forEach((b, i) => b.setAttribute('aria-selected', String(i === sel)))
    btns[sel]?.scrollIntoView({ block: 'nearest' })
  }

  function fire(i: number) {
    const c = shown[i]
    close()
    c?.go()
  }

  function show() {
    if (open) return
    open = true
    transition(() => {
      root!.hidden = false
    }, 'deck-palette')
    input!.value = ''
    render('')
    requestAnimationFrame(() => input!.focus())
    try {
      history.pushState({ deckPalette: 1 }, '')
    } catch {
      /* history is optional */
    }
  }

  function close(fromPop = false) {
    if (!open) return
    open = false
    transition(() => {
      root!.hidden = true
    }, 'deck-palette')
    if (!fromPop) {
      try {
        if (history.state && (history.state as { deckPalette?: number }).deckPalette) history.back()
      } catch {
        /* history is optional */
      }
    }
  }

  input.addEventListener('input', () => render(input.value))
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      sel = Math.min(sel + 1, shown.length - 1)
      mark()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      sel = Math.max(sel - 1, 0)
      mark()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      fire(sel)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      close()
    }
  })
  root.addEventListener('pointerdown', (e) => {
    if (e.target === root) close()
  })
  window.addEventListener('popstate', () => {
    if (open) close(true)
  })

  // invoker command first, click as the fallback
  const supportsCommand = 'command' in HTMLButtonElement.prototype
  if (supportsCommand) {
    root.addEventListener('command', ((e: Event & { command?: string }) => {
      if (e.command === '--deck-palette') show()
    }) as EventListener)
  } else {
    opener?.addEventListener('click', show)
  }

  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault()
      if (open) close()
      else show()
      return
    }
    if (e.key === 'Escape' && open) {
      e.preventDefault()
      close()
    }
  })

  return { open: show, close }
}
