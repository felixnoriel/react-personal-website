import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Socials } from '../Socials'
import { Button } from '../ui/button'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showBackground, setShowBackground] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const windowPosition = window.pageYOffset
      setShowBackground(windowPosition >= 300)
      setShowScrollTop(windowPosition >= 1200)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      {/* Top Navigation Bar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          showBackground ? 'bg-[#1f2937a8] backdrop-blur-sm shadow-md' : ''
        }`}
      >
        <div className="container mx-auto max-w-7xl px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => setIsMenuOpen(true)}
            className={`text-2xl transition-colors hover:text-white ${showBackground ? 'text-white' : 'text-foreground'}`}
            aria-label="Open menu"
          >
            <i className="fas fa-bars" />
          </Button>
        </div>
      </nav>

      {/* Mobile Menu Sidebar */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${
          isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50" onClick={() => setIsMenuOpen(false)} />

        {/* Sidebar */}
        <div
          className={`absolute right-0 top-0 bottom-0 w-80 bg-background shadow-2xl transition-transform duration-300 ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full p-8">
            <button
              onClick={() => setIsMenuOpen(false)}
              className="self-end text-2xl mb-8 hover:text-primary transition-colors"
              aria-label="Close menu"
            >
              <i className="fas fa-times" />
            </button>

            <nav className="flex-1 flex flex-col gap-6 text-xl">
              <Link to="/" onClick={() => setIsMenuOpen(false)} className="hover:text-primary transition-colors">
                Home
              </Link>
              <Link
                to="/projects"
                onClick={() => setIsMenuOpen(false)}
                className="hover:text-primary transition-colors"
              >
                Projects
              </Link>
              <Link to="/career" onClick={() => setIsMenuOpen(false)} className="hover:text-primary transition-colors">
                Career
              </Link>
              <Link to="/blog" onClick={() => setIsMenuOpen(false)} className="hover:text-primary transition-colors">
                Blog
              </Link>
              <Link to="/about" onClick={() => setIsMenuOpen(false)} className="hover:text-primary transition-colors">
                About
              </Link>
              <a href="mailto:jrnoriel_56@yahoo.com" className="hover:text-primary transition-colors">
                Contact Me
              </a>
            </nav>

            <div className="mt-8">
              <Socials />
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-40 w-12 h-12 rounded-full bg-teal-gradient text-white shadow-lg hover:shadow-xl transition-all hover:scale-110"
          aria-label="Scroll to top"
        >
          <i className="fas fa-arrow-up" />
        </button>
      )}
    </>
  )
}
