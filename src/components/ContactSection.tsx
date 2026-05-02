import {
  motion,
  AnimatePresence,
  useInView,
  useReducedMotion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import {
  ArrowUpRight,
  CheckCircle2,
  Coffee,
  Copy,
  Mail,
  MapPin,
  Radio,
  Send,
  Stamp,
} from 'lucide-react'
import { useFxLevel } from '../hooks/useFxLevel'

// ============================================================
// Morse code (A–Z + 0–9) — for the live callsign preview
// ============================================================

const MORSE: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.',
  G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..',
  M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.',
  S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
  Y: '-.--', Z: '--..',
  0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-',
  5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.',
}

function toMorse(s: string): string {
  if (!s) return ''
  return s
    .toUpperCase()
    .split('')
    .map((ch) => (ch === ' ' ? '/' : MORSE[ch] || ''))
    .filter(Boolean)
    .join(' ')
}

// ============================================================
// Live time (BKK · UTC+7) — ticks every second so seconds move too
// ============================================================

function useLiveTime() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])
  return now
}

// Get BKK local time (UTC+7)
function getBkkTime(now: Date) {
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  const bkk = new Date(utc + 7 * 3600000)
  const hh = String(bkk.getHours()).padStart(2, '0')
  const mm = String(bkk.getMinutes()).padStart(2, '0')
  const ss = String(bkk.getSeconds()).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

// ============================================================
// Airmail striped border — classic red/blue/cream repeating pattern
// ============================================================

function AirmailStripe({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={className}
      style={{
        backgroundImage:
          'repeating-linear-gradient(-45deg, hsl(var(--accent)) 0 8px, transparent 8px 16px, hsl(var(--electric)) 16px 24px, transparent 24px 32px)',
      }}
    />
  )
}

// ============================================================
// Postmark — circular rubber stamp with date + code
// ============================================================

function Postmark({
  date,
  code,
  size = 90,
  animate = false,
}: {
  date: string
  code: string
  size?: number
  animate?: boolean
}) {
  const id = useMemo(() => `cs-pm-${Math.random().toString(36).slice(2, 9)}`, [])
  const reduce = useReducedMotion()

  return (
    <motion.div
      className="relative text-ink/80"
      style={{ width: size, height: size }}
      initial={animate && !reduce ? { scale: 0.3, opacity: 0, rotate: -24 } : false}
      animate={animate && !reduce ? { scale: 1, opacity: 1, rotate: -8 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 16 }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <path id={id} d="M 50 50 m -34 0 a 34 34 0 1 1 68 0 a 34 34 0 1 1 -68 0" />
        </defs>
        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 2" />
        <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="0.6" />
        <circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 1.5" />
        <text fontSize="5.4" fontWeight="700" letterSpacing="1" fill="currentColor">
          <textPath href={`#${id}`} startOffset="4%">
            · VIA AIRMAIL · POSTED BY HAND · TRANSMITTED
          </textPath>
        </text>
        <text
          x="50"
          y="48"
          textAnchor="middle"
          fontSize="9"
          fontWeight="700"
          letterSpacing="0.8"
          fill="currentColor"
          fontFamily="'JetBrains Mono', monospace"
        >
          {code}
        </text>
        <text
          x="50"
          y="60"
          textAnchor="middle"
          fontSize="5.5"
          fontWeight="600"
          letterSpacing="0.4"
          fill="currentColor"
          fontFamily="'JetBrains Mono', monospace"
        >
          {date}
        </text>
      </svg>
    </motion.div>
  )
}

// ============================================================
// Frequency bars (5-bar signal strength) — used in headers
// ============================================================

function SignalBars({ n = 5, active = true }: { n?: number; active?: boolean }) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLSpanElement>(null)
  // Pause the infinite animation entirely when off-screen. With several
  // SignalBars elements scattered through the page (each running 5 infinite
  // height tweens), keeping them ticking when invisible is wasted CPU.
  const inView = useInView(ref, { amount: 0, margin: '120px' })
  const animateNow = active && !reduce && inView
  return (
    <span ref={ref} className="inline-flex items-end gap-[2px] h-3">
      {Array.from({ length: n }).map((_, i) => {
        const baseH = 4 + i * 2
        if (!animateNow) {
          return (
            <span
              key={i}
              className="block w-[3px] bg-[hsl(var(--lime))] rounded-sm"
              style={{ height: baseH }}
            />
          )
        }
        return (
          <motion.span
            key={i}
            className="block w-[3px] bg-[hsl(var(--lime))] rounded-sm"
            animate={{ height: [baseH, baseH + 4, baseH] }}
            transition={{
              duration: 1.2 + (i % 3) * 0.2,
              repeat: Infinity,
              delay: i * 0.1,
              ease: 'easeInOut',
            }}
            style={{ height: baseH }}
          />
        )
      })}
    </span>
  )
}

// ============================================================
// Keystroke-reactive waveform — gets louder as you type
// ============================================================

function Waveform({ amplitude }: { amplitude: number }) {
  const reduce = useReducedMotion()
  const { isMobile } = useFxLevel()
  const ref = useRef<HTMLDivElement>(null)
  // Pause the infinite per-bar height animations when off-screen. The
  // contact form sits at the bottom of the page; keeping 20 (mobile) /
  // 40 (desktop) concurrent infinite tweens running while the user is
  // reading the hero is wasted CPU on the main thread. We render plain
  // <span>s (no framer-motion track at all) when off-screen — passing
  // a static `animate` value to <motion.span> doesn't actually stop the
  // WAAPI track when `transition.repeat` is Infinity.
  const inView = useInView(ref, { amount: 0, margin: '160px' })
  const animateNow = !reduce && inView
  // Halve bar count on mobile — 40 concurrent infinite framer-motion height
  // animations is the kind of thing phones really feel.
  const bars = isMobile ? 20 : 40
  return (
    <div
      ref={ref}
      aria-hidden
      className="flex items-center gap-[2px] h-10"
      style={{ width: '100%' }}
    >
      {Array.from({ length: bars }).map((_, i) => {
        const baseH = 3 + ((i * 7) % 4)
        const boost = amplitude * (6 + ((i * 13) % 14))
        const maxH = Math.min(36, baseH + boost)
        if (!animateNow) {
          return (
            <span
              key={i}
              className="block flex-1 bg-[hsl(var(--accent))] rounded-full origin-center"
              style={{ minWidth: 2, height: baseH, opacity: 0.5 }}
            />
          )
        }
        return (
          <motion.span
            key={i}
            className="block flex-1 bg-[hsl(var(--accent))] rounded-full origin-center"
            style={{ minWidth: 2 }}
            animate={{
              height: [baseH, maxH, baseH],
              opacity: [0.45, 0.9, 0.45],
            }}
            transition={{
              duration: 0.6 + (i % 5) * 0.08,
              repeat: Infinity,
              delay: i * 0.015,
              ease: 'easeInOut',
            }}
          />
        )
      })}
    </div>
  )
}

// ============================================================
// Ambient radar — expanding concentric rings
// ============================================================

function RadarPulse({ size = 260, className = '' }: { size?: number; className?: string }) {
  const reduce = useReducedMotion()
  return (
    <div
      aria-hidden
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full text-accent">
        {/* base rings */}
        <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="0.3" strokeDasharray="1 2" opacity="0.3" />
        <circle cx="50" cy="50" r="36" fill="none" stroke="currentColor" strokeWidth="0.3" opacity="0.25" />
        <circle cx="50" cy="50" r="24" fill="none" stroke="currentColor" strokeWidth="0.3" opacity="0.2" />
        <circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" strokeWidth="0.3" opacity="0.15" />
        {/* crosshair */}
        <line x1="50" y1="2" x2="50" y2="98" stroke="currentColor" strokeWidth="0.3" strokeDasharray="1 3" opacity="0.2" />
        <line x1="2" y1="50" x2="98" y2="50" stroke="currentColor" strokeWidth="0.3" strokeDasharray="1 3" opacity="0.2" />

        {/* rotating sweep */}
        {!reduce && (
          <motion.line
            x1="50"
            y1="50"
            x2="50"
            y2="5"
            stroke="currentColor"
            strokeWidth="0.6"
            strokeLinecap="round"
            opacity="0.6"
            style={{ originX: '50%', originY: '50%' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
          />
        )}

        {/* expanding pings */}
        {!reduce &&
          [0, 1, 2].map((i) => (
            <motion.circle
              key={i}
              cx="50"
              cy="50"
              r="4"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.4"
              initial={{ r: 4, opacity: 0 }}
              animate={{ r: [4, 48], opacity: [0.8, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: i * 1, ease: 'easeOut' }}
            />
          ))}

        {/* BKK dot */}
        <circle cx="50" cy="50" r="1.6" fill="currentColor" />
        <circle cx="50" cy="50" r="3" fill="none" stroke="currentColor" strokeWidth="0.4">
          {!reduce && (
            <animate
              attributeName="r"
              values="1.6;4;1.6"
              dur="1.8s"
              repeatCount="indefinite"
            />
          )}
        </circle>

        {/* labels */}
        <text x="50" y="8" textAnchor="middle" fontSize="3.5" fontWeight="700" letterSpacing="0.8" fill="currentColor" opacity="0.5" fontFamily="'JetBrains Mono', monospace">N</text>
        <text x="50" y="97" textAnchor="middle" fontSize="3.5" fontWeight="700" letterSpacing="0.8" fill="currentColor" opacity="0.5" fontFamily="'JetBrains Mono', monospace">S</text>
        <text x="4" y="52" textAnchor="middle" fontSize="3.5" fontWeight="700" letterSpacing="0.8" fill="currentColor" opacity="0.5" fontFamily="'JetBrains Mono', monospace">W</text>
        <text x="96" y="52" textAnchor="middle" fontSize="3.5" fontWeight="700" letterSpacing="0.8" fill="currentColor" opacity="0.5" fontFamily="'JetBrains Mono', monospace">E</text>
      </svg>
    </div>
  )
}

// ============================================================
// Transmit button — physical chunky button with LED
// ============================================================

function TransmitButton({
  status,
  disabled,
}: {
  status: 'idle' | 'encoding' | 'transmitting' | 'delivered'
  disabled: boolean
}) {
  const label =
    status === 'encoding'
      ? 'encoding···'
      : status === 'transmitting'
      ? 'transmitting···'
      : status === 'delivered'
      ? 'delivered ✓'
      : 'transmit'
  const ledColor =
    status === 'idle'
      ? 'bg-[hsl(var(--lime))] shadow-[0_0_12px_hsl(var(--lime))]'
      : status === 'delivered'
      ? 'bg-[hsl(var(--lime))] shadow-[0_0_18px_hsl(var(--lime))]'
      : 'bg-[hsl(var(--amber))] shadow-[0_0_18px_hsl(var(--amber))]'

  return (
    <button
      type="submit"
      disabled={disabled}
      className={`group relative inline-flex items-center gap-3 h-14 pl-5 pr-6 rounded-full border-2 border-ink font-mono text-[12px] tracking-[0.28em] uppercase font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
        status === 'idle'
          ? 'bg-ink text-background hover:bg-accent hover:border-accent hover:-translate-y-0.5'
          : status === 'delivered'
          ? 'bg-[hsl(var(--lime))] border-[hsl(var(--lime))] text-[hsl(var(--ink))]'
          : 'bg-[hsl(var(--amber))] border-[hsl(var(--amber))] text-background'
      }`}
      style={{
        boxShadow: '0 4px 0 hsl(var(--ink) / 0.2), 0 14px 30px -8px hsl(var(--accent) / 0.4)',
      }}
    >
      {/* LED */}
      <span className={`inline-block w-2.5 h-2.5 rounded-full animate-pulse ${ledColor}`} />
      <span>{label}</span>
      {status === 'idle' ? (
        <Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      ) : status === 'delivered' ? (
        <CheckCircle2 className="w-4 h-4" />
      ) : (
        <ArrowUpRight className="w-4 h-4 animate-pulse" />
      )}
    </button>
  )
}

// ============================================================
// Flying envelope overlay — animates from bottom-left to top-right on send
// ============================================================

function FlyingEnvelope({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* runway arc */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <motion.path
              d="M 10 80 Q 45 10, 90 12"
              fill="none"
              stroke="hsl(var(--accent))"
              strokeWidth="0.2"
              strokeDasharray="1 1.5"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.7 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>

          {/* envelope flying */}
          <motion.div
            className="absolute"
            initial={{ left: '10%', top: '80%', rotate: -12, scale: 1 }}
            animate={{ left: '88%', top: '12%', rotate: 18, scale: 0.4 }}
            transition={{ duration: 1.6, ease: [0.45, 0, 0.25, 1] }}
            style={{ x: '-50%', y: '-50%' }}
          >
            <svg width="140" height="100" viewBox="0 0 140 100" className="drop-shadow-2xl">
              {/* envelope back */}
              <rect x="2" y="8" width="136" height="86" rx="4" fill="hsl(var(--card))" stroke="hsl(var(--ink))" strokeWidth="1.5" />
              {/* airmail stripes */}
              <rect x="2" y="8" width="136" height="4" fill="url(#airmailGrad1)" />
              <rect x="2" y="90" width="136" height="4" fill="url(#airmailGrad1)" />
              <defs>
                <linearGradient id="airmailGrad1" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="hsl(var(--accent))" />
                  <stop offset="50%" stopColor="hsl(var(--electric))" />
                  <stop offset="100%" stopColor="hsl(var(--accent))" />
                </linearGradient>
              </defs>
              {/* flap */}
              <path d="M 2 8 L 70 56 L 138 8" fill="none" stroke="hsl(var(--ink))" strokeWidth="1.5" />
              {/* par avion stamp */}
              <rect x="98" y="16" width="32" height="22" fill="hsl(var(--accent))" opacity="0.85" />
              <text x="114" y="30" textAnchor="middle" fontSize="6" fontWeight="700" fill="hsl(var(--background))" fontFamily="'JetBrains Mono', monospace">
                PAR
              </text>
              <text x="114" y="37" textAnchor="middle" fontSize="6" fontWeight="700" fill="hsl(var(--background))" fontFamily="'JetBrains Mono', monospace">
                AVION
              </text>
              {/* address lines */}
              <line x1="14" y1="62" x2="80" y2="62" stroke="hsl(var(--ink))" strokeWidth="0.6" opacity="0.5" />
              <line x1="14" y1="72" x2="70" y2="72" stroke="hsl(var(--ink))" strokeWidth="0.6" opacity="0.5" />
              <line x1="14" y1="82" x2="90" y2="82" stroke="hsl(var(--ink))" strokeWidth="0.6" opacity="0.5" />
            </svg>
          </motion.div>

          {/* center transmission status */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="font-mono text-sm md:text-base tracking-[0.32em] uppercase text-ink-soft bg-[hsl(var(--background)/0.85)] backdrop-blur px-6 py-3 rounded-full border-2 border-dashed border-ink/20 shadow-warm"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <span className="inline-block w-2 h-2 rounded-full bg-[hsl(var(--amber))] mr-2 animate-pulse" />
              transmitting ▸▸▸ via airmail
            </motion.div>
          </motion.div>

          {/* radar pulse from bottom-left */}
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="absolute rounded-full border-2 border-[hsl(var(--accent))]"
              style={{ left: '10%', top: '80%', x: '-50%', y: '-50%' }}
              initial={{ width: 20, height: 20, opacity: 0.7 }}
              animate={{ width: 600, height: 600, opacity: 0 }}
              transition={{ duration: 1.6, delay: i * 0.25, ease: 'easeOut' }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ============================================================
// Main component
// ============================================================

type Status = 'idle' | 'encoding' | 'transmitting' | 'delivered'

export function ContactSection() {
  const reduce = useReducedMotion()
  const now = useLiveTime()
  const bkkTime = getBkkTime(now)

  const [formData, setFormData] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState<Status>('idle')
  const [amp, setAmp] = useState(0)
  const [emailStamped, setEmailStamped] = useState(false)
  const [copied, setCopied] = useState(false)
  const decayRef = useRef<number | null>(null)

  // Decay amplitude back to 0 over time
  useEffect(() => {
    if (amp === 0) return
    if (decayRef.current) window.clearTimeout(decayRef.current)
    decayRef.current = window.setTimeout(() => setAmp((a) => Math.max(0, a - 1)), 120)
    return () => {
      if (decayRef.current) window.clearTimeout(decayRef.current)
    }
  }, [amp])

  // Signal "strength" from message length (0-5)
  const signalStrength = Math.min(5, Math.floor(formData.message.length / 30) + 1)

  const morse = toMorse(formData.name).slice(0, 60)

  // Parallax tilt on the form card (subtle)
  const mx = useMotionValue(0.5)
  const my = useMotionValue(0.5)
  const rotX = useSpring(useTransform(my, [0, 1], [2, -2]), { stiffness: 200, damping: 22 })
  const rotY = useSpring(useTransform(mx, [0, 1], [-2, 2]), { stiffness: 200, damping: 22 })

  const cardRef = useRef<HTMLDivElement>(null)
  const handleCardMove = (e: React.MouseEvent) => {
    if (!cardRef.current || reduce) return
    const rect = cardRef.current.getBoundingClientRect()
    mx.set((e.clientX - rect.left) / rect.width)
    my.set((e.clientY - rect.top) / rect.height)
  }
  const handleCardLeave = () => {
    mx.set(0.5)
    my.set(0.5)
  }

  const bumpAmp = () => setAmp((a) => Math.min(4, a + 1))

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (status !== 'idle') return
    setStatus('encoding')

    // encoding (dial up)
    window.setTimeout(() => setStatus('transmitting'), 500)

    // open mailto + mark delivered
    window.setTimeout(() => {
      const mailtoLink = `mailto:norielfelixjr@gmail.com?subject=Message from ${formData.name}&body=${encodeURIComponent(
        formData.message
      )}%0A%0AFrom: ${formData.email}`
      window.location.href = mailtoLink
      setStatus('delivered')
    }, 1800)

    // reset to idle after delivery state
    window.setTimeout(() => setStatus('idle'), 4200)
  }

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText('norielfelixjr@gmail.com')
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }

  const isBusy = status !== 'idle'

  return (
    <section
      id="contact-section"
      className="relative py-28 md:py-36 bg-background scroll-mt-20 overflow-hidden"
    >
      {/* Backgrounds */}
      <div aria-hidden className="absolute inset-0 bg-graph opacity-30 pointer-events-none" />
      {!reduce && <div className="absolute inset-0 bg-scanlines opacity-[0.05] pointer-events-none" />}
      <div
        aria-hidden
        className="absolute -top-32 right-0 w-[420px] h-[420px] rounded-full bg-[hsl(var(--accent)/0.10)] blur-3xl animate-pulse-glow pointer-events-none"
      />
      <div
        aria-hidden
        className="absolute -bottom-40 -left-40 w-[520px] h-[520px] rounded-full bg-[hsl(var(--lime)/0.14)] blur-3xl animate-pulse-glow pointer-events-none"
      />

      {/* Full-screen transmission overlay */}
      <FlyingEnvelope show={status === 'transmitting' || status === 'delivered'} />

      <div className="relative container mx-auto px-6 max-w-6xl">
        {/* Console strip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[10px] tracking-[0.22em] uppercase text-ink-soft mb-6"
        >
          <span className="flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-[hsl(var(--lime))] animate-pulse" />
            transceiver · open
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[hsl(var(--lime))]" />
            freq 101.7 · ch.open
          </span>
          <span className="hidden sm:flex items-center gap-1.5">
            <MapPin className="w-3 h-3" />
            bkk · 13.75°n · 100.50°e
          </span>
          <span className="hidden md:flex items-center gap-1.5">
            sig
            <SignalBars active={!isBusy} n={5} />
          </span>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl mb-14 md:mb-16"
        >
          <div className="text-xs tracking-[0.3em] uppercase text-ink-soft mb-5 flex items-center gap-2">
            <span className="w-10 h-px bg-ink/30" />
            Contact · open channel
          </div>
          <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tighter text-ink text-balance mb-6 leading-[0.95]">
            Got something in mind?{' '}
            <span className="italic font-extrabold text-accent inline-block relative">
              <span className="glitch-pulse">Let&apos;s talk</span>
              <motion.span
                aria-hidden
                className="absolute left-0 -bottom-1 h-[3px] bg-[hsl(var(--accent))] origin-left"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                style={{ width: '100%' }}
              />
            </span>
            .
          </h2>
          <p className="text-lg text-ink-muted leading-relaxed max-w-xl">
            Whether it&apos;s a product, a problem, or just a quick chat about
            engineering — key the mic, hit <span className="font-mono text-ink">transmit</span>,
            and I&apos;ll receive on the other end.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* LEFT: transceiver / airmail envelope */}
          <motion.div
            ref={cardRef}
            onMouseMove={handleCardMove}
            onMouseLeave={handleCardLeave}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            style={{
              rotateX: rotX,
              rotateY: rotY,
              transformPerspective: 1400,
              transformStyle: 'preserve-3d',
            }}
            className="lg:col-span-7 relative"
          >
            <div className="relative rounded-3xl border-2 border-ink/10 bg-card shadow-warm overflow-hidden">
              {/* Airmail stripe border — top */}
              <AirmailStripe className="absolute top-0 left-0 right-0 h-2" />
              {/* bottom */}
              <AirmailStripe className="absolute bottom-0 left-0 right-0 h-2" />
              {/* left */}
              <AirmailStripe className="absolute top-0 bottom-0 left-0 w-2" />
              {/* right */}
              <AirmailStripe className="absolute top-0 bottom-0 right-0 w-2" />

              {/* Transceiver header */}
              <div className="relative ml-2 mr-2 mt-2 px-5 md:px-6 py-3 border-b border-dashed border-ink/15 bg-[hsl(var(--background)/0.6)] backdrop-blur flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.22em] uppercase text-ink-soft">
                  <span className="flex items-center gap-1.5">
                    <Radio className="w-3 h-3 text-[hsl(var(--lime))] animate-pulse" />
                    transceiver v2.4
                  </span>
                  <span className="opacity-60 hidden sm:inline">·</span>
                  <span className="hidden sm:inline">par avion</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.22em] uppercase text-ink-soft">
                  <span>sig</span>
                  <SignalBars n={5} active={!isBusy} />
                  <span className="opacity-60">·</span>
                  <span>{signalStrength}/5</span>
                </div>
              </div>

              {/* Form */}
              <form
                onSubmit={handleSubmit}
                className="relative px-6 md:px-10 py-8 md:py-10"
                aria-busy={isBusy}
              >
                {/* Field: callsign */}
                <div className="mb-8">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <label
                      htmlFor="name"
                      className="flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] uppercase text-ink-soft"
                    >
                      <Stamp className="w-3 h-3" />
                      callsign · your name
                    </label>
                    <span className="font-mono text-[9px] tracking-[0.22em] uppercase text-ink-soft/70">
                      req
                    </span>
                  </div>
                  <input
                    id="name"
                    type="text"
                    placeholder="jane doe"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value })
                      bumpAmp()
                    }}
                    disabled={isBusy}
                    className="w-full px-0 py-2 bg-transparent border-0 border-b-2 border-dashed border-ink/15 text-ink text-xl md:text-2xl font-display tracking-tight placeholder:text-ink-soft/50 placeholder:font-normal focus:border-accent focus:outline-none transition-colors disabled:opacity-50"
                    required
                    autoComplete="name"
                  />
                  {/* Morse code preview */}
                  <div className="mt-2 flex items-center gap-3 font-mono text-[10px] tracking-[0.2em] text-ink-soft min-h-[14px]">
                    <span className="text-[9px] uppercase tracking-[0.22em] text-ink-soft/70 shrink-0">morse ·</span>
                    <span className="text-accent/80 truncate">{morse || '···     ···     ···'}</span>
                  </div>
                </div>

                {/* Field: return address */}
                <div className="mb-8 relative">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <label
                      htmlFor="email"
                      className="flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] uppercase text-ink-soft"
                    >
                      <Mail className="w-3 h-3" />
                      return address · email
                    </label>
                    <span className="font-mono text-[9px] tracking-[0.22em] uppercase text-ink-soft/70">
                      req
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      placeholder="jane@somewhere.co"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value })
                        bumpAmp()
                        if (emailStamped) setEmailStamped(false)
                      }}
                      onBlur={() => {
                        if (formData.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.email)) {
                          setEmailStamped(true)
                        }
                      }}
                      disabled={isBusy}
                      className="w-full px-0 py-2 bg-transparent border-0 border-b-2 border-dashed border-ink/15 text-ink text-xl md:text-2xl font-display tracking-tight placeholder:text-ink-soft/50 placeholder:font-normal focus:border-accent focus:outline-none transition-colors disabled:opacity-50"
                      required
                      autoComplete="email"
                    />
                    {/* Postmark stamps over the right side once valid */}
                    <AnimatePresence>
                      {emailStamped && (
                        <motion.div
                          key="pm"
                          className="absolute -top-2 right-0 pointer-events-none"
                          initial={{ scale: 0.3, opacity: 0, rotate: -30 }}
                          animate={{ scale: 1, opacity: 0.85, rotate: -8 }}
                          exit={{ opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 14 }}
                        >
                          <Postmark
                            date={`${new Date().getMonth() + 1}/${new Date().getDate()}`}
                            code="BKK"
                            size={72}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Field: message */}
                <div className="mb-6">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <label
                      htmlFor="message"
                      className="flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] uppercase text-ink-soft"
                    >
                      <Send className="w-3 h-3" />
                      transmission · message
                    </label>
                    <span className="font-mono text-[9px] tracking-[0.22em] uppercase text-ink-soft/70">
                      {formData.message.length} chars
                    </span>
                  </div>
                  <textarea
                    id="message"
                    placeholder="what's on your mind? a build · a bug · a bad joke..."
                    rows={5}
                    value={formData.message}
                    onChange={(e) => {
                      setFormData({ ...formData, message: e.target.value })
                      bumpAmp()
                    }}
                    disabled={isBusy}
                    className="w-full px-4 py-3 bg-[hsl(var(--background)/0.6)] border-2 border-dashed border-ink/15 rounded-2xl text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none focus:ring-4 focus:ring-[hsl(var(--accent)/0.12)] transition-all resize-none font-mono text-sm leading-relaxed disabled:opacity-50"
                    required
                  />

                  {/* waveform reacting to typing */}
                  <div className="mt-3 flex items-center gap-3">
                    <span className="font-mono text-[9px] tracking-[0.22em] uppercase text-ink-soft shrink-0">
                      wave ·
                    </span>
                    <div className="flex-1 min-w-0">
                      <Waveform amplitude={amp} />
                    </div>
                    <span className="font-mono text-[9px] tracking-[0.22em] uppercase text-ink-soft shrink-0">
                      {amp > 0 ? 'keying' : 'idle'}
                    </span>
                  </div>
                </div>

                {/* Footer: status + transmit */}
                <div className="mt-8 pt-6 border-t border-dashed border-ink/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-soft flex items-center gap-2">
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full ${
                        status === 'idle'
                          ? 'bg-[hsl(var(--lime))]'
                          : status === 'delivered'
                          ? 'bg-[hsl(var(--lime))]'
                          : 'bg-[hsl(var(--amber))]'
                      } animate-pulse`}
                    />
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={status}
                        initial={{ opacity: 0, y: 3 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -3 }}
                        transition={{ duration: 0.25 }}
                      >
                        status: {status}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                  <TransmitButton status={status} disabled={isBusy} />
                </div>
              </form>
            </div>
          </motion.div>

          {/* RIGHT: field unit */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-5 space-y-5"
          >
            {/* Radar card */}
            <div className="relative rounded-3xl border-2 border-ink/10 bg-card p-6 shadow-warm overflow-hidden">
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-soft flex items-center gap-1.5">
                  <Radio className="w-3 h-3" />
                  field unit · live
                </span>
                <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-[hsl(var(--lime))] flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[hsl(var(--lime))] animate-pulse" />
                  on air
                </span>
              </div>

              <div className="flex flex-col md:flex-row items-center md:items-start gap-5">
                <RadarPulse size={180} />
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-soft mb-1">
                    currently operating from
                  </div>
                  <div className="font-display text-3xl font-bold tracking-tight text-ink mb-1">
                    Bangkok
                  </div>
                  <div className="font-mono text-xs text-ink-muted mb-4">
                    13.75°N · 100.50°E · TH
                  </div>

                  <div className="grid grid-cols-2 gap-3 font-mono text-[10px] tracking-[0.18em] uppercase">
                    <div className="rounded-lg border border-dashed border-ink/15 bg-background p-2.5">
                      <div className="text-ink-soft mb-1">local time</div>
                      <div className="text-ink normal-case tracking-tight text-sm font-semibold">
                        {bkkTime}
                      </div>
                    </div>
                    <div className="rounded-lg border border-dashed border-ink/15 bg-background p-2.5">
                      <div className="text-ink-soft mb-1">tz</div>
                      <div className="text-ink normal-case tracking-tight text-sm font-semibold">
                        GMT+7
                      </div>
                    </div>
                    <div className="rounded-lg border border-dashed border-ink/15 bg-background p-2.5 col-span-2">
                      <div className="text-ink-soft mb-1 flex items-center gap-2">
                        availability
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[hsl(var(--lime))] animate-pulse" />
                      </div>
                      <div className="text-ink normal-case tracking-tight text-sm">
                        remote, async-friendly · reply within 24h
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct dial — email */}
            <a
              href="mailto:norielfelixjr@gmail.com"
              className="group relative block rounded-2xl border-2 border-ink/10 bg-card p-5 shadow-warm hover:-translate-y-0.5 hover:border-accent/40 transition-all overflow-hidden"
            >
              {/* scan line on hover */}
              <div
                aria-hidden
                className="absolute inset-0 bg-scanlines opacity-0 group-hover:opacity-30 transition-opacity pointer-events-none"
              />
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] uppercase text-ink-soft mb-2">
                    <Mail className="w-3 h-3" />
                    direct dial · email
                  </div>
                  <div className="font-display text-xl md:text-2xl font-bold text-ink tracking-tight group-hover:text-accent transition-colors truncate">
                    norielfelixjr@gmail.com
                  </div>
                  <div className="mt-1 text-xs text-ink-muted">
                    preferred for proposals · async · anytime
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      copyEmail()
                    }}
                    aria-label="Copy email"
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full border-2 border-ink/15 bg-background hover:border-accent hover:text-accent transition-colors"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4 text-[hsl(var(--lime))]" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <div className="inline-flex items-center justify-center w-9 h-9 rounded-full border-2 border-ink/15 bg-background group-hover:border-accent group-hover:text-accent transition-colors">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
              {copied && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 font-mono text-[10px] tracking-[0.22em] uppercase text-[hsl(var(--lime))]"
                >
                  ✓ copied to clipboard
                </motion.div>
              )}
            </a>

            {/* Coffee card */}
            <div className="relative rounded-2xl border-2 border-dashed border-ink/15 bg-background p-5 overflow-hidden">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] uppercase text-ink-soft mb-2">
                    <Coffee className="w-3 h-3" />
                    or · a virtual coffee
                  </div>
                  <div className="font-display text-lg md:text-xl font-bold text-ink tracking-tight mb-1">
                    Let&apos;s grab a virtual coffee.
                  </div>
                  <div className="text-xs text-ink-muted">
                    I&apos;m always up for a good chat about products, engineering, and food.
                  </div>
                </div>
                <motion.div
                  animate={reduce ? undefined : { rotate: [0, -8, 8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="shrink-0"
                >
                  <Coffee className="w-6 h-6 text-[hsl(var(--amber))]" />
                </motion.div>
              </div>
              {/* steam lines */}
              {!reduce && (
                <div aria-hidden className="absolute top-3 right-4 flex gap-1 pointer-events-none">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="block w-[2px] h-4 rounded-full bg-[hsl(var(--amber)/0.4)]"
                      animate={{ opacity: [0, 0.8, 0], y: [0, -6, -12] }}
                      transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.3, ease: 'easeOut' }}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Bottom ticker */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-14 relative overflow-hidden border-y border-dashed border-ink/15 py-2"
        >
          <div
            className={`flex items-center gap-8 whitespace-nowrap font-mono text-[10px] tracking-[0.22em] uppercase text-ink-soft ${reduce ? '' : 'animate-scroll-x'}`}
            style={{ width: reduce ? 'auto' : 'max-content' }}
          >
            {Array.from({ length: 2 }).flatMap((_, rep) =>
              [
                '── CHANNEL OPEN · STANDING BY',
                'freq 101.7 · tx ready',
                `local time bkk · ${bkkTime}`,
                'postage paid · par avion',
                'typical reply · under 24h',
                'channel: open · async welcome',
                `sig: 5/5 · utc+7`,
                '── KEY THE MIC WHEN READY',
              ].map((item, i) => (
                <span key={`${rep}-${i}`} className="inline-flex items-center gap-3">
                  {item}
                  <span className="opacity-40">◆</span>
                </span>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
