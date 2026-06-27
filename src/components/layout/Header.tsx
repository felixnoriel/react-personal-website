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

const navItems = [
  { name: 'Work', id: 'projects-section', redirectPath: '/projects' },
  { name: 'Experience', id: 'career-section', redirectPath: '/career' },
  { name: 'Skills', id: 'skills-section', redirectPath: '/' },
  { name: 'Writing', id: 'nomad-section', redirectPath: '/blog' },
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
      <motion.nav
        ref={navRef}
        onPointerMove={onNavMove}
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`pointer-events-auto relative flex items-center gap-1 rounded-full border backdrop-blur-xl overflow-hidden transition-[background-color,border-color,box-shadow,padding] duration-300 pl-2 pr-2 ${
          isScrolled
            ? 'py-1.5 bg-background/70 border-border/60 shadow-[0_16px_40px_-20px_hsl(var(--ink)/0.5)]'
            : 'py-2 bg-background/45 border-border/40 shadow-[0_12px_36px_-22px_hsl(var(--ink)/0.4)]'
        }`}
      >
        {/* cursor sheen */}
        <div
          ref={glowRef}
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 w-[340px] h-[340px] -z-0"
          style={{
            background:
              'radial-gradient(circle at center, hsl(var(--accent) / 0.16), transparent 60%)',
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
                stroke="hsl(var(--accent))"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray={RING_C}
                style={{ strokeDashoffset: ringOffset }}
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
                    className="absolute inset-0 rounded-full bg-accent/12 border border-accent/20"
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
          className="relative z-10 hidden md:inline-flex items-center gap-2 h-9 pl-3 pr-2 rounded-full border border-border/50 bg-background/40 text-ink-soft hover:text-ink hover:border-accent/40 transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <kbd className="inline-flex items-center px-1.5 py-0.5 rounded border border-border/60 bg-background/60 text-[10px] font-mono">
            ⌘K
          </kbd>
        </button>

        {/* contact (magnetic) */}
        <MagneticButton
          onClick={handleContactClick}
          strength={0.35}
          className="relative z-10 group hidden md:inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-ink text-background text-[13px] font-medium overflow-hidden"
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
            className="pointer-events-auto md:hidden mt-2 w-[min(92vw,420px)] rounded-2xl border border-border/60 bg-background/80 backdrop-blur-xl shadow-[0_24px_60px_-30px_hsl(var(--ink)/0.5)] overflow-hidden"
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
