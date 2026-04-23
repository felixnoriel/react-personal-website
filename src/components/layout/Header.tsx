import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, ArrowUpRight, Search } from 'lucide-react'

const navItems = [
  { name: 'Work', href: '/#projects-section', id: 'projects-section', redirectPath: '/projects' },
  { name: 'Experience', href: '/#career-section', id: 'career-section', redirectPath: '/career' },
  { name: 'Skills', href: '/#skills-section', id: 'skills-section', redirectPath: '/' },
  { name: 'Writing', href: '/#nomad-section', id: 'nomad-section', redirectPath: '/blog' },
]

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleNavClick = (_href: string, id: string, redirectPath?: string) => {
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false)
      if (redirectPath) {
        if (id === 'skills-section') {
          if (location.pathname !== '/') {
            navigate('/')
            setTimeout(() => {
              const element = document.getElementById(id)
              if (element) element.scrollIntoView({ behavior: 'smooth' })
            }, 100)
          } else {
            const element = document.getElementById(id)
            if (element) element.scrollIntoView({ behavior: 'smooth' })
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
      setTimeout(() => {
        const element = document.getElementById(id)
        if (element) element.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } else {
      const element = document.getElementById(id)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      } else if (id === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
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
    const element = document.getElementById('contact-section')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    } else {
      if (location.pathname !== '/') {
        navigate('/')
        setTimeout(() => {
          const el = document.getElementById('contact-section')
          if (el) el.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      }
    }
  }

  return (
    <motion.nav
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-background/80 backdrop-blur-xl border-b border-border'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link
            to="/"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-1.5 group"
          >
            <span className="flex items-center justify-center w-11 h-11 rounded-full bg-ink text-background font-display text-lg font-medium">
              F
            </span>
            <span className="font-display text-[17px] font-medium text-ink hidden sm:inline tracking-tight">
              Felix Noriel
            </span>
          </Link>

          <div className="hidden md:flex items-center flex-1 justify-center px-6">
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(
                  new KeyboardEvent('keydown', {
                    key: 'k',
                    metaKey: true,
                    ctrlKey: true,
                    bubbles: true,
                  })
                )
              }}
              className="group relative w-full max-w-sm inline-flex items-center gap-3 h-10 pl-4 pr-1.5 rounded-full border border-border bg-surface/60 backdrop-blur-sm hover:border-accent/40 hover:bg-background transition-colors text-left overflow-hidden"
              aria-label="Open command palette"
            >
              <Search className="w-4 h-4 text-ink-soft group-hover:text-accent transition-colors shrink-0" />
              <span className="flex-1 text-sm text-ink-muted group-hover:text-ink transition-colors truncate">
                Jump anywhere — work, experience, skills…
              </span>
              <kbd className="shrink-0 inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full border border-border bg-background text-[11px] font-mono text-ink-muted group-hover:border-accent/40 group-hover:text-accent transition-colors">
                ⌘K
              </kbd>
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-accent/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </button>
          </div>

          <div className="hidden md:block">
            <button
              onClick={handleContactClick}
              className="group inline-flex items-center gap-1.5 h-10 px-5 rounded-full bg-ink text-background text-sm font-medium hover:bg-accent transition-colors"
            >
              Contact
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5 text-ink" />
              ) : (
                <Menu className="h-5 w-5 text-ink" />
              )}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden bg-background border-t border-border overflow-hidden"
          >
            <div className="container mx-auto px-6 py-6 flex flex-col gap-1">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item.href, item.id, item.redirectPath)}
                  className="text-left py-3 text-lg font-display font-light text-ink border-b border-border last:border-b-0"
                >
                  {item.name}
                </button>
              ))}
              <button
                onClick={handleContactClick}
                className="mt-4 inline-flex items-center justify-center gap-1.5 h-12 rounded-full bg-ink text-background font-medium"
              >
                Contact
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
