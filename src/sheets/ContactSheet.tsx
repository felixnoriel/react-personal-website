import { useEffect, useRef, useState, type FormEvent } from 'react'
import { CheckMark, CopyMark } from '../marks'
import { LiveClock } from '../components/ui/LiveClock'
import { Section } from './Section'
import './contact.css'

// ==========================================================================
// Sheet 6 - Contact.
//
// The email comes first, because the form only opens a mailto: anyway: a
// real mailto link set at display size with a square copy button beside it,
// and the virtual-coffee note in the right columns. Underneath, the form on
// the datum and the notes table every drawing carries - where he is, what
// time it is there, how to reach him - drawn as a two-column definition list
// with a hairline between rows.
//
// The block renders on / and on /about, and the footer carries the email on
// every other route (WCAG 2.2 "consistent help").
//
// Nothing here animates: the only motion is a 120ms colour change on hover
// and focus, and the copy mark swapping to a tick for a second and a half.
// ==========================================================================

const EMAIL = 'norielfelixjr@gmail.com'
const COFFEE_HREF = `mailto:${EMAIL}?subject=${encodeURIComponent('Virtual coffee?')}`

export function ContactSheet() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sent, setSent] = useState(false)
  const [copied, setCopied] = useState(false)
  const timers = useRef<number[]>([])

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((t) => window.clearTimeout(t))
  }, [])

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }

  // Same behaviour as the site has always had: the form composes a mail and
  // hands it to the reader's own mail app. No endpoint, no third party.
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const mailto = `mailto:${EMAIL}?subject=${encodeURIComponent(
      `Message from ${form.name || 'someone'}`,
    )}&body=${encodeURIComponent(`${form.message}\n\nFrom: ${form.email}`)}`
    window.location.href = mailto
    setSent(true)
    later(() => setSent(false), 4000)
  }

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL)
      setCopied(true)
      later(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked - the address is right there as a link */
    }
  }

  return (
    <Section
      id="sheet-contact"
      title="Got something in mind? Let's talk."
      intro="Whether it's a product, a problem, or just a quick chat about engineering — drop a line and I'll get back to you."
      cvHeight={900}
      className="contact"
    >
      <div className="cols contact__top">
        <div className="contact__direct">
          <div className="contact__email-row">
            <a className="link contact__email" href={`mailto:${EMAIL}`}>
              {EMAIL}
            </a>
            <button
              type="button"
              className={`contact__copy${copied ? ' contact__copy--done' : ''}`}
              onClick={copyEmail}
              aria-label="Copy email"
            >
              {copied ? <CheckMark /> : <CopyMark />}
            </button>
            <span role="status" className="visually-hidden">
              {copied ? 'Email copied' : ''}
            </span>
          </div>
        </div>

        <aside className="contact__coffee">
          <a className="contact__coffee-link" href={COFFEE_HREF}>
            Let&apos;s grab a virtual coffee.
          </a>
          <p className="contact__coffee-sub">
            Always up for a good chat about products, engineering, and food.
          </p>
        </aside>
      </div>

      <hr className="rule contact__rule" />

      <div className="cols contact__body">
        <form className="contact__form" onSubmit={handleSubmit}>
          <div className="contact__field">
            <label className="meta meta--head contact__label" htmlFor="contact-name">
              Name
            </label>
            <input
              id="contact-name"
              name="name"
              className="contact__input"
              required
              autoComplete="name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div className="contact__field">
            <label className="meta meta--head contact__label" htmlFor="contact-email">
              Email
            </label>
            <input
              id="contact-email"
              name="email"
              type="email"
              className="contact__input"
              required
              autoComplete="email"
              aria-describedby="contact-email-hint"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
            <p id="contact-email-hint" className="contact__hint">
              Add an email address I can reply to.
            </p>
          </div>

          <div className="contact__field">
            <label className="meta meta--head contact__label" htmlFor="contact-message">
              Message
            </label>
            <textarea
              id="contact-message"
              name="message"
              className="contact__textarea"
              rows={5}
              required
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            />
          </div>

          <button type="submit" className="btn btn--solid contact__submit">
            {sent ? 'Opening your mail app…' : 'Send message'}
          </button>
        </form>

        <dl className="notes contact__notes">
          <dt>currently operating from</dt>
          <dd>Bangkok</dd>
          <dd className="contact__cont contact__val--pen">13.75°N · 100.50°E · TH</dd>

          <dt>local time</dt>
          <dd className="contact__val--pen">
            <LiveClock timezone="Asia/Bangkok" className="contact__clock" />
          </dd>
          <dd className="contact__cont contact__val--pen">GMT+7</dd>
          <dd className="contact__cont">Remote, async-friendly · usually reply within 24h.</dd>

          <dt>direct · email</dt>
          <dd>
            <a className="link" href={`mailto:${EMAIL}`}>
              {EMAIL}
            </a>
          </dd>

          <dt>preferred for proposals</dt>
          <dd>async · anytime</dd>
        </dl>
      </div>
    </Section>
  )
}
