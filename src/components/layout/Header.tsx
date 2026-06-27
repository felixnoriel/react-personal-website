import { useState, useEffect, useRef } from 'react'
import {
  motion,
  AnimatePresence,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, ArrowUpRight, Search } from 'lucide-react'
import { MagneticButton } from '../ui/MagneticButton'

// ============================================================
// Header — floating glass "command deck".
//
// A detached, centered capsule that floats over the living shader.
// Wow details, all GPU/transform-driven so it stays buttery:
//   - sliding active-pill (framer layoutId) that follows scrollspy
//     AND hover — the satisfying "indicator slides between tabs"
//   - a scroll-progress ring wrapping the "F" logo
//   - a cursor-reactive sheen (translate3d, rAF-coalesced, no repaint)
//   - a magnetic Contact button
// All original navigation behaviour is preserved.
// ============================================================

// Ordered to match the homepage section flow: hero → Skills (tools) →
// nomad → Experience → Work.
const navItems = [
  { name: 'Skills', id: 'skills-section', redirectPath: '/' },
  { name: 'Writing', id: 'nomad-section', redirectPath: '/blog' },
  { name: 'Experience', id: 'career-section', redirectPath: '/career' },
  { name: 'Work', id: 'projects-section', redirectPath: '/projects' },
]

const RING_R = 19
const RING_C = 2 * Math.PI * RING_R

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeId, setActiveId] = useState('hero')
  const [hoverId, setHoverId] = useState<string | null>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const onHome = location.pathname === '/'

  const navRef = useRef<HTMLElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)

  // scroll-progress ring around the logo
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.3,
  })
  const ringOffset = useTransform(progress, (p) => RING_C * (1 - p))

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // scrollspy — the section whose bounds straddle the 40%-viewport line is
  // "active". Deterministic (one section straddles the line at a time),
  // rAF-throttled, and reads layout only — far more reliable than comparing
  // IntersectionObserver ratios across sections of wildly different heights.
  useEffect(() => {
    if (!onHome) return
    const ids = ['hero', ...navItems.map((n) => n.id), 'contact-section']
    let raf: number | null = null
    const compute = () => {
      raf = null
      const line = window.innerHeight * 0.4
      let current = 'hero'
      for (const id of ids) {
        const el = document.getElementById(id)
        if (!el) continue
        const r = el.getBoundingClientRect()
        if (r.top <= line && r.bottom > line) {
          current = id
          break
        }
      }
      setActiveId((prev) => (prev === current ? prev : current))
    }
    const onScroll = () => {
      if (raf == null) raf = requestAnimationFrame(compute)
    }
    compute()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf != null) cancelAnimationFrame(raf)
    }
  }, [onHome, location.pathname])

  // cursor sheen on the capsule (GPU translate, no repaint)
  const onNavMove = (e: React.PointerEvent) => {
    const nav = navRef.current
    const g = glowRef.current
    if (!nav || !g) return
    const r = nav.getBoundingClientRect()
    const x = e.clientX - r.left
    const y = e.clientY - r.top
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        g.style.transform = `translate3d(${x - 170}px, ${y - 170}px, 0)`
      })
    }
  }

  // ---- preserved navigation behaviour ----
  const handleNavClick = (id: string, redirectPath?: string) => {
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false)
      if (redirectPath) {
        if (id === 'skills-section') {
          if (location.pathname !== '/') {
            navigate('/')
            setTimeout(
              () => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }),
              100,
            )
          } else {
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
          }
          return
        }
        if (redirectPath !== location.pathname) {
          navigate(redirectPath)
          window.scrollTo({ top: 0, behavior: 'smooth' })
          return
        }
      }
    }

    setIsMobileMenuOpen(false)
    if (location.pathname !== '/') {
      navigate('/')
      setTimeout(
        () => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }),
        100,
      )
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleContactClick = () => {
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false)
      navigate('/about')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setIsMobileMenuOpen(false)
    const el = document.getElementById('contact-section')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    } else if (location.pathname !== '/') {
      navigate('/')
      setTimeout(
        () => document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' }),
        100,
      )
    }
  }

  const openPalette = () =>
    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: true,
        ctrlKey: true,
        bubbles: true,
      }),
    )

  const indicatorId = hoverId ?? (onHome ? activeId : null)

  return (
    <header className="fixed top-0 inset-x-0 z-50 flex flex-col items-center px-3 pt-3 pointer-events-none">
      {/* liquid-glass refraction filter — referenced by .liquid-refract */}
      <svg aria-hidden width="0" height="0" className="absolute pointer-events-none">
        <defs>
          <filter id="liquid-glass-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.014 0.021" numOctaves="2" seed="7" result="noise" />
            <feGaussianBlur in="noise" stdDeviation="1.4" result="bn" />
            <feDisplacementMap in="SourceGraphic" in2="bn" scale="20" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
      <motion.nav
        ref={navRef}
        onPointerMove={onNavMove}
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          // beveled glass edge — bright top rim catching light, faint dark
          // base for thickness — over grounding depth + an accent halo.
          boxShadow: isScrolled
            ? 'inset 0 1px 1px rgba(255,255,255,0.65), inset 0 -1px 1.5px rgba(70,40,70,0.08), 0 18px 44px -22px hsl(var(--ink) / 0.5), 0 0 44px -12px hsl(var(--accent) / 0.22)'
            : 'inset 0 1px 1px rgba(255,255,255,0.55), inset 0 -1px 1.5px rgba(70,40,70,0.06), 0 12px 36px -22px hsl(var(--ink) / 0.4), 0 0 34px -14px hsl(var(--accent) / 0.16)',
        }}
        className={`pointer-events-auto liquid-glass relative flex items-center gap-1 rounded-full border border-white/25 overflow-hidden transition-[box-shadow,padding] duration-300 pl-2 pr-2 ${
          isScrolled ? 'py-1.5' : 'py-2'
        }`}
      >
        {/* liquid refraction — bends the backdrop through the glass (Chromium) */}
        <div aria-hidden className="liquid-refract pointer-events-none absolute inset-0 z-0" />
        {/* specular gloss — the bright reflection across the top of the pane */}
        <div aria-hidden className="liquid-gloss pointer-events-none absolute inset-0 z-[1]" />
        {/* cursor sheen — a moving specular highlight that tracks the pointer */}
        <div
          ref={glowRef}
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 w-[340px] h-[340px] z-[2]"
          style={{
            background:
              'radial-gradient(circle at center, rgba(255,255,255,0.32), hsl(var(--accent) / 0.12) 42%, transparent 64%)',
            willChange: 'transform',
          }}
        />

        {/* logo + scroll-progress ring */}
        <Link
          to="/"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="relative z-10 flex items-center gap-2.5 pl-1 pr-2 group"
          aria-label="Home"
        >
          <span className="relative flex items-center justify-center w-11 h-11">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 44 44">
              <defs>
                <linearGradient id="nav-ring-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--accent))" />
                  <stop offset="38%" stopColor="hsl(var(--electric))" />
                  <stop offset="68%" stopColor="hsl(var(--lime))" />
                  <stop offset="100%" stopColor="hsl(var(--amber))" />
                </linearGradient>
              </defs>
              <circle
                cx="22"
                cy="22"
                r={RING_R}
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth="1.5"
              />
              <motion.circle
                cx="22"
                cy="22"
                r={RING_R}
                fill="none"
                stroke="url(#nav-ring-grad)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={RING_C}
                style={{
                  strokeDashoffset: ringOffset,
                  filter: 'drop-shadow(0 0 2px hsl(var(--accent) / 0.55))',
                }}
              />
            </svg>
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-ink text-background font-display text-base font-semibold transition-transform duration-300 group-hover:scale-95">
              F
            </span>
          </span>
          <span className="font-display text-[15px] font-semibold text-ink hidden sm:inline tracking-tight pr-1">
            Felix Noriel
          </span>
        </Link>

        {/* nav items with sliding pill */}
        <div
          className="relative z-10 hidden md:flex items-center"
          onMouseLeave={() => setHoverId(null)}
        >
          {navItems.map((item) => {
            const isActive = onHome && activeId === item.id
            return (
              <button
                key={item.id}
                onMouseEnter={() => setHoverId(item.id)}
                onClick={() => handleNavClick(item.id, item.redirectPath)}
                className={`relative px-3.5 py-2 text-[13.5px] font-medium rounded-full transition-colors ${
                  isActive ? 'text-ink' : 'text-ink-muted hover:text-ink'
                }`}
              >
                {indicatorId === item.id && (
                  <motion.span
                    layoutId="nav-pill"
                    aria-hidden
                    className="absolute inset-0 rounded-full"
                    style={{
                      background:
                        'linear-gradient(120deg, hsl(var(--accent) / 0.2), hsl(var(--electric) / 0.12))',
                      border: '1px solid hsl(var(--accent) / 0.28)',
                      boxShadow:
                        '0 0 18px -5px hsl(var(--accent) / 0.55), inset 0 1px 0 hsl(var(--background) / 0.35)',
                    }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative">{item.name}</span>
              </button>
            )
          })}
        </div>

        {/* command palette */}
        <button
          type="button"
          onClick={openPalette}
          aria-label="Open command palette"
          className="relative z-10 hidden md:inline-flex items-center gap-2 h-9 pl-3 pr-2 rounded-full border border-ink/[0.08] bg-background/40 text-ink-soft hover:text-ink hover:border-accent/45 hover:bg-background/55 transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <kbd className="inline-flex items-center px-1.5 py-0.5 rounded border border-ink/10 bg-background/60 text-[10px] font-mono">
            ⌘K
          </kbd>
        </button>

        {/* contact (magnetic) */}
        <MagneticButton
          onClick={handleContactClick}
          strength={0.35}
          className="relative z-10 group hidden md:inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-ink text-background text-[13px] font-medium overflow-hidden shadow-[0_8px_24px_-10px_hsl(var(--accent)/0.55)]"
        >
          <span className="relative z-10">Contact</span>
          <ArrowUpRight className="w-3.5 h-3.5 relative z-10 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          <span
            aria-hidden
            className="absolute inset-0 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 bg-gradient-to-r from-accent via-amber/80 to-lime/50"
          />
        </MagneticButton>

        {/* mobile toggle */}
        <button
          onClick={() => setIsMobileMenuOpen((v) => !v)}
          className="relative z-10 md:hidden w-10 h-10 flex items-center justify-center rounded-full text-ink hover:bg-surface/60 transition-colors"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </motion.nav>

      {/* mobile menu — glass dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            style={{
              boxShadow:
                'inset 0 1px 0 0 hsl(var(--background) / 0.6), 0 26px 64px -30px hsl(var(--ink) / 0.5), 0 0 50px -16px hsl(var(--accent) / 0.2)',
            }}
            className="pointer-events-auto md:hidden mt-2 w-[min(92vw,420px)] rounded-2xl border border-ink/[0.08] bg-background/75 backdrop-blur-2xl overflow-hidden"
          >
            <div className="p-3 flex flex-col gap-0.5">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id, item.redirectPath)}
                  className="text-left px-3 py-2.5 rounded-xl text-base font-display font-medium text-ink hover:bg-accent/10 transition-colors"
                >
                  {item.name}
                </button>
              ))}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  openPalette()
                }}
                className="text-left px-3 py-2.5 rounded-xl text-base font-display font-medium text-ink-muted hover:bg-accent/10 transition-colors flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Search
              </button>
              <button
                onClick={handleContactClick}
                className="mt-1.5 inline-flex items-center justify-center gap-1.5 h-12 rounded-xl bg-ink text-background font-medium"
              >
                Contact
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
