import { useState, type FormEvent } from 'react'
import { ArrowUpRight, Check, Coffee, Copy, Mail, MapPin, Send } from 'lucide-react'
import { LiveClock } from './ui/LiveClock'
import {
  FxWord,
  GlassPanel,
  HudDot,
  Reveal,
  SectionHeading,
  SectionShell,
} from './ui/section'

// ============================================================
// ContactSection — "Got something in mind? Let's talk."
//
// Rebuilt from a ~1,080-line radio console (morse encoder, signal
// bars, amplitude decay, flying-envelope transmission overlay, tilt)
// into a clean form + info cards. Same mailto behaviour and the same
// email (norielfelixjr@gmail.com).
// ============================================================

const EMAIL = 'norielfelixjr@gmail.com'

export function ContactSection() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sent, setSent] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const mailto = `mailto:${EMAIL}?subject=${encodeURIComponent(
      `Message from ${form.name || 'someone'}`,
    )}&body=${encodeURIComponent(`${form.message}\n\nFrom: ${form.email}`)}`
    window.location.href = mailto
    setSent(true)
    window.setTimeout(() => setSent(false), 4000)
  }

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked — no-op */
    }
  }

  return (
    <SectionShell id="contact-section">
      <SectionHeading
        eyebrow="contact"
        meta={
          <span className="inline-flex items-center gap-2">
            <HudDot accent="lime" />
            open channel
          </span>
        }
        title={
          <>
            Got something in mind?{' '}
            <FxWord className="italic font-extrabold">Let's talk.</FxWord>
          </>
        }
        intro="Whether it's a product, a problem, or just a quick chat about engineering — drop a line and I'll get back to you."
      />

      <div className="mt-12 grid lg:grid-cols-5 gap-5 items-start">
        {/* form */}
        <Reveal className="lg:col-span-3">
          <GlassPanel tilt={false} className="p-6 md:p-7">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="callsign · your name">
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="jane doe"
                  className="w-full bg-background/50 border border-border/60 rounded-lg px-3.5 py-2.5 text-ink placeholder:text-ink-soft/70 outline-none focus:border-accent/60 transition-colors"
                />
              </Field>
              <Field label="reply-to · email">
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="jane@somewhere.co"
                  className="w-full bg-background/50 border border-border/60 rounded-lg px-3.5 py-2.5 text-ink placeholder:text-ink-soft/70 outline-none focus:border-accent/60 transition-colors"
                />
              </Field>
              <Field label="transmission · message">
                <textarea
                  required
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder="what's on your mind? a build · a bug · a bad joke..."
                  className="w-full bg-background/50 border border-border/60 rounded-lg px-3.5 py-2.5 text-ink placeholder:text-ink-soft/70 outline-none focus:border-accent/60 transition-colors resize-none"
                />
              </Field>
              <button
                type="submit"
                className="group inline-flex items-center gap-2 h-12 px-6 rounded-full bg-ink text-background text-sm font-medium hover:bg-accent transition-colors"
              >
                {sent ? (
                  <>
                    <Check className="w-4 h-4" />
                    Opening your mail app…
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    Send message
                  </>
                )}
              </button>
            </form>
          </GlassPanel>
        </Reveal>

        {/* info cards */}
        <div className="lg:col-span-2 space-y-5">
          <Reveal delay={0.06}>
            <GlassPanel accent="lime" className="p-5">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft mb-2">
                <MapPin className="w-3.5 h-3.5 text-lime" />
                currently operating from
              </div>
              <div className="font-display text-2xl font-bold text-ink">Bangkok</div>
              <div className="font-mono text-[11px] text-ink-soft mt-0.5">
                13.75°N · 100.50°E · TH
              </div>
              <div className="mt-3 flex items-center justify-between font-mono text-[11px] text-ink-muted">
                <span>
                  local <LiveClock timezone="Asia/Bangkok" className="text-ink text-xs" />
                </span>
                <span className="text-ink-soft">GMT+7</span>
              </div>
              <div className="mt-3 pt-3 border-t border-border/50 text-[12px] text-ink-muted">
                Remote, async-friendly · usually reply within 24h.
              </div>
            </GlassPanel>
          </Reveal>

          <Reveal delay={0.12}>
            <GlassPanel accent="accent" className="p-5">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft mb-2">
                <Mail className="w-3.5 h-3.5 text-accent" />
                direct · email
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`mailto:${EMAIL}`}
                  className="font-medium text-ink hover:text-accent transition-colors break-all"
                >
                  {EMAIL}
                </a>
                <button
                  onClick={copyEmail}
                  aria-label="Copy email"
                  className="ml-auto shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border/60 text-ink-soft hover:text-accent hover:border-accent/50 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-lime" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="mt-2 font-mono text-[11px] text-ink-soft">
                preferred for proposals · async · anytime
              </div>
            </GlassPanel>
          </Reveal>

          <Reveal delay={0.18}>
            <GlassPanel accent="amber" className="p-5">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft mb-2">
                <Coffee className="w-3.5 h-3.5 text-amber" />
                or · a virtual coffee
              </div>
              <div className="font-display text-lg font-bold text-ink">
                Let's grab a virtual coffee.
              </div>
              <p className="mt-1 text-[13px] text-ink-muted leading-relaxed">
                Always up for a good chat about products, engineering, and food.
              </p>
              <a
                href={`mailto:${EMAIL}?subject=${encodeURIComponent('Virtual coffee?')}`}
                className="mt-3 inline-flex items-center gap-1.5 font-mono text-[13px] text-ink hover:text-amber transition-colors"
              >
                <span className="text-amber">$</span> brew ./coffee
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </GlassPanel>
          </Reveal>
        </div>
      </div>
    </SectionShell>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  )
}
