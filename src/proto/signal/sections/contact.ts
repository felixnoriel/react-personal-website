/**
 * CONTACT — behaviour.
 *
 * The idea: the form IS the beam. Focusing a field pulls the core to that
 * field's ring on the column; typing measures the real payload; sending
 * fires a shockwave at the pad, lights every ring bottom to top as the wave
 * climbs, rides a packet up to the muzzle and then opens the mail app with
 * exactly the mailto: the live site builds.
 *
 * Main-thread budget: nothing runs per frame here. The scene moves the
 * anchored labels; everything else is an event handler that writes one
 * class or one CSS variable, plus one clock tick a second that stops when
 * the section is off screen or the tab is hidden.
 */
import type { Scene, Vec3 } from '../scene'
import { EMAIL } from '../../shared/content'
import { beamBase, beamMuzzle, beamRung, padRing } from '../shapes/beam'

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T | null

export function init(scene: Scene) {
  const sec = $('contact')
  if (!sec) return
  const layer = $('beamAnchors')
  const reduced = scene.reduced

  /* ------------------------------------------------------------ clocks */

  const clock = $('ctClock')
  const utc = $('ctUtc')
  const day = $('ctDay')?.firstElementChild as HTMLElement | null
  const fmtBkk = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Bangkok',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  const fmtUtc = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  /** Bangkok is UTC+7 the whole year round — no DST to chase */
  const bkkFraction = (d: Date) => (((d.getTime() / 1000 + 7 * 3600) % 86400) + 86400) % 86400 / 86400
  let awake = true
  const tick = () => {
    if (!awake || document.hidden) return
    const now = new Date()
    if (clock) clock.textContent = fmtBkk.format(now)
    if (utc) utc.textContent = fmtUtc.format(now)
    if (day) day.style.setProperty('--day', bkkFraction(now).toFixed(4))
  }
  tick()
  setInterval(tick, 1000)
  document.addEventListener('visibilitychange', tick)

  /* the copyright year is baked at build time; keep it honest at runtime */
  const yr = $('ctYear')
  const thisYear = String(new Date().getFullYear())
  if (yr && yr.textContent !== thisYear) yr.textContent = thisYear

  /* ------------------------------------------- HTML pinned to the beam */

  if (layer) {
    const mz = $('baMuzzle')
    if (mz) scene.anchor(mz, beamMuzzle(), 7, { offset: [0, -16], fade: 1.25 })
    const bs = $('baBase')
    if (bs) scene.anchor(bs, beamBase(), 7, { offset: [0, 34], fade: 1.25 })
    for (const el of Array.from(layer.querySelectorAll<HTMLElement>('.ba-rung'))) {
      const k = Number(el.dataset.rung)
      if (Number.isFinite(k)) scene.anchor(el, beamRung(k), 7, { offset: [18, 0], fade: 1.25 })
    }
    const pkt = $('baPkt')
    if (pkt) scene.anchor(pkt, beamMuzzle(), 7, { manual: true, fade: 1.25 })
  }

  /* --------------------------------------------- the gravity well rules
     A focused field always wins; a hovered card only borrows the core
     while nothing is focused; leaving the section lets it go. */

  let focused: Vec3 | null = null
  let hovered: Vec3 | null = null
  let focusStr = 0.18
  const applyWell = () => {
    const p = focused ?? hovered
    scene.setWell(p, focused ? focusStr : 0.13)
  }
  const setFocus = (p: Vec3 | null, strength = 0.18) => {
    focused = p
    focusStr = strength
    applyWell()
  }
  const setHover = (p: Vec3 | null) => {
    hovered = p
    applyWell()
  }

  /* ------------------------------------------------------------- form */

  const form = $<HTMLFormElement>('ctForm')
  const nameI = $<HTMLInputElement>('ct-name')
  const mailI = $<HTMLInputElement>('ct-mail')
  const msgI = $<HTMLTextAreaElement>('ct-msg')
  const fill = $('ctFill')
  const bytesEl = $('ctBytes')
  const log = $('ctLog')
  const sendBtn = $<HTMLButtonElement>('ctSend')
  const sendLabel = sendBtn?.querySelector<HTMLElement>('.ct-sendlabel') ?? null
  const enc = new TextEncoder()
  const rung = (k: number) => layer?.querySelector<HTMLElement>(`.ba-rung[data-rung="${k}"]`) ?? null

  /** the exact body the live site sends, so the byte count is the real one */
  const bodyOf = () => `${msgI?.value ?? ''}\n\nFrom: ${mailI?.value ?? ''}`
  /** nothing typed is nothing to send, not the eight bytes of the wrapper */
  const payload = () => (msgI?.value || mailI?.value ? enc.encode(bodyOf()).length : 0)

  const measure = () => {
    const n = payload()
    if (bytesEl) bytesEl.textContent = `${n} B`
    if (fill) fill.style.setProperty('--fill', Math.min(1, n / 320).toFixed(3))
    return n
  }

  const fields: [HTMLElement | null, number][] = [
    [nameI, 1],
    [mailI, 3],
    [msgI, 5],
  ]
  for (const [el, k] of fields) {
    if (!el) continue
    const mark = () => rung(k)?.classList.toggle('done', !!(el as HTMLInputElement).value.trim())
    el.addEventListener('focus', () => {
      rung(k)?.classList.add('on')
      setFocus(beamRung(k))
    })
    el.addEventListener('blur', () => {
      rung(k)?.classList.remove('on')
      mark()
      setFocus(null)
    })
    el.addEventListener('input', () => {
      mark()
      const n = measure()
      // while the message is being written the core leans a little harder:
      // the signal builds with the payload
      if (k === 5 && document.activeElement === el) setFocus(beamRung(5), 0.16 + Math.min(0.1, (n / 320) * 0.1))
    })
  }
  measure()

  /* the three station cards borrow the core while the pointer is on them */
  const cards: [string, number][] = [
    ['ctStation', 6],
    ['ctMail', 4],
    ['ctCoffee', 2],
  ]
  for (const [id, k] of cards) {
    const el = $(id)
    if (!el) continue
    el.addEventListener('pointerenter', (e) => {
      if ((e as PointerEvent).pointerType === 'mouse') setHover(beamRung(k))
    })
    el.addEventListener('pointerleave', () => setHover(null))
  }

  let logTimer = 0
  const say = (line: string) => {
    if (!log) return
    log.textContent = line
    sec.classList.add('logon')
    clearTimeout(logTimer)
    logTimer = window.setTimeout(() => sec.classList.remove('logon'), 6000)
  }

  const stamp = () => `${fmtBkk.format(new Date())} bkk`

  /** the launch: shockwave at the pad, rings bottom to top, packet to the muzzle */
  function transmit(n: number) {
    scene.fire(beamBase())
    say(`tx ${stamp()} · ${n} B · uplink open`)
    if (layer) {
      const b = scene.project(beamBase())
      const m = scene.project(beamMuzzle())
      const rise = b.visible && m.visible ? Math.max(140, b.y - m.y) : 320
      const pkt = $('baPkt')
      pkt?.style.setProperty('--rise', `${Math.round(rise)}px`)
      const pn = $('baPktN')
      if (pn) pn.textContent = `${n} B`
      layer.classList.remove('tx')
      requestAnimationFrame(() => layer.classList.add('tx'))
      setTimeout(() => layer.classList.remove('tx'), 2000)
    }
    if (!reduced) {
      setHover(beamMuzzle())
      setTimeout(() => scene.fire(beamMuzzle()), 900)
      setTimeout(() => setHover(null), 1400)
    }
  }

  form?.addEventListener('submit', (e) => {
    e.preventDefault()
    const name = nameI?.value.trim() ?? ''
    const mail = mailI?.value.trim() ?? ''
    const msg = msgI?.value ?? ''
    // byte-for-byte the mailto: the live site's ContactSection builds
    const mailto = `mailto:${EMAIL}?subject=${encodeURIComponent(
      `Message from ${name || 'someone'}`,
    )}&body=${encodeURIComponent(`${msg}\n\nFrom: ${mail}`)}`

    sec.classList.add('sent')
    if (sendLabel) sendLabel.textContent = 'Opening your mail app…'
    transmit(payload())

    // the mail app opens a beat later, so the launch is actually seen; well
    // inside the transient activation window, so no browser treats it as a
    // popup out of nowhere
    setTimeout(() => {
      window.location.href = mailto
    }, 420)
    setTimeout(() => {
      sec.classList.remove('sent')
      if (sendLabel) sendLabel.textContent = 'Send message'
    }, 4000)
  })

  /* the send button leans toward the pointer, the way the live site's
     MagneticButton does — two variable writes per pointer move, capped to
     one per frame, and nothing at all on a touch screen */
  if (sendBtn && !scene.coarse && !reduced) {
    let box: DOMRect | null = null
    let queued = false
    let mx = 0
    let my = 0
    const write = () => {
      queued = false
      sendBtn.style.setProperty('--mx', `${mx.toFixed(1)}px`)
      sendBtn.style.setProperty('--my', `${my.toFixed(1)}px`)
    }
    sendBtn.addEventListener('pointerenter', () => {
      box = sendBtn.getBoundingClientRect()
      sendBtn.classList.add('pull')
    })
    sendBtn.addEventListener('pointermove', (e) => {
      if (!box) return
      mx = (e.clientX - (box.left + box.width / 2)) * 0.28
      my = (e.clientY - (box.top + box.height / 2)) * 0.36
      if (!queued) {
        queued = true
        requestAnimationFrame(write)
      }
    })
    sendBtn.addEventListener('pointerleave', () => {
      box = null
      mx = 0
      my = 0
      sendBtn.classList.remove('pull')
      write()
    })
    addEventListener('scroll', () => (box = null), { passive: true })
  }

  // ⌘/ctrl-enter sends from anywhere in the form, like any composer
  form?.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      form.requestSubmit()
    }
  })

  /* ------------------------------------------------------ copy the address */

  const copy = $<HTMLButtonElement>('ctCopy')
  let copyTimer = 0
  copy?.addEventListener('click', async () => {
    let ok = false
    try {
      await navigator.clipboard.writeText(EMAIL)
      ok = true
    } catch {
      // clipboard refused (insecure context, Safari without a gesture): put
      // the address under the cursor's own selection so ⌘C still works
      const addr = sec.querySelector<HTMLElement>('.ct-addr')
      if (addr) {
        const r = document.createRange()
        r.selectNodeContents(addr)
        const s = getSelection()
        s?.removeAllRanges()
        s?.addRange(r)
      }
    }
    copy.classList.toggle('done', ok)
    say(ok ? `copy ${stamp()} · ${EMAIL} → clipboard` : `copy ${stamp()} · selected — press ⌘C`)
    scene.fire(beamBase())
    clearTimeout(copyTimer)
    copyTimer = window.setTimeout(() => copy.classList.remove('done'), 1700)
  })

  /* --------------------------------------------------- footer interactions */

  let lastFire = 0
  const hello = $('ctHello')
  hello?.addEventListener('pointerenter', (e) => {
    if ((e as PointerEvent).pointerType !== 'mouse') return
    const t = performance.now()
    if (t - lastFire < 900) return
    lastFire = t
    scene.fire(beamMuzzle())
  })

  for (const a of Array.from(document.querySelectorAll<HTMLElement>('.ftr-soc a[data-soc]'))) {
    const i = Number(a.dataset.soc)
    a.addEventListener('pointerenter', (e) => {
      if ((e as PointerEvent).pointerType === 'mouse') setHover(padRing(i, 4))
    })
    a.addEventListener('pointerleave', () => setHover(null))
  }

  /* --------------------------------- the labels only live with the chapter */

  const ftr = $('ftr')
  if ('IntersectionObserver' in window) {
    const seen = new Map<Element, boolean>()
    let endingDeep = false
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set(e.target, e.isIntersecting)
        const here = seen.get(sec) === true
        const ending = seen.get(ftr as Element) === true
        // the clocks tick while either block is on screen; the labels live
        // only while the console does, and step aside for the ending
        awake = here || ending
        const show = here && !endingDeep
        layer?.classList.toggle('on', show)
        if (!here) {
          setHover(null)
          setFocus(null)
        }
        if (awake) tick()
      },
      { rootMargin: '10% 0px' },
    )
    io.observe(sec)
    if (ftr) {
      io.observe(ftr)
      // a second, coarser watch: once a quarter of the footer is up, the
      // beam's ticks would float over the sign-off, so they fade first
      new IntersectionObserver(
        ([e]) => {
          endingDeep = e.intersectionRatio > 0.24
          if (endingDeep) layer?.classList.remove('on')
        },
        { threshold: [0, 0.24, 0.5] },
      ).observe(ftr)
    }
  } else {
    layer?.classList.add('on')
  }
}
