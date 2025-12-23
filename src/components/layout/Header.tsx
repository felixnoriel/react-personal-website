import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../ui/button'
import { Menu, X, Sparkles } from 'lucide-react'

const navItems = [
  { name: 'Home', href: '/', id: 'home', redirectPath: '/' },
  { name: 'Skills', href: '/#skills-section', id: 'skills-section', redirectPath: '/' },
  { name: 'Career', href: '/#career-section', id: 'career-section', redirectPath: '/career' },
  { name: 'Projects', href: '/#projects-section', id: 'projects-section', redirectPath: '/projects' },
  { name: 'Travel', href: '/#nomad-section', id: 'nomad-section', redirectPath: '/blog' },
]

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleNavClick = (_href: string, id: string, redirectPath?: string) => {
    // Mobile specific behavior
    if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false)
        if (redirectPath) {
            if (id === 'skills-section') {
               // Special case for skills: Go to home then scroll
               if (location.pathname !== '/') {
                   navigate('/')
                    setTimeout(() => {
                        const element = document.getElementById(id)
                        if (element) {
                        element.scrollIntoView({ behavior: 'smooth' })
                        }
                    }, 100)
               } else {
                   const element = document.getElementById(id)
                   if (element) {
                       element.scrollIntoView({ behavior: 'smooth' })
                   }
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

    // Default Desktop / Existing Behavior
    setIsMobileMenuOpen(false)
    if (location.pathname !== '/') {
      navigate('/')
      setTimeout(() => {
        const element = document.getElementById(id)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
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
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/80 backdrop-blur-xl shadow-lg border-b border-violet-100'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            whileHover={{ scale: 1.05 }}
          >
            <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center">
              <img
                src="https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/felixnoriellogo.png"
                alt="Felix Noriel"
                width={40}
                height={40}
                className="h-10 w-auto"
              />
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <Button
                  variant="ghost"
                  className="relative hover:text-violet-600 transition-colors text-base"
                  onClick={() => handleNavClick(item.href, item.id)}
                >
                  {item.name}
                  <motion.span
                    className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-violet-600 to-pink-600 origin-left"
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                </Button>
              </motion.div>
            ))}
          </div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: 'spring' }}
            className="hidden md:block"
          >
            <Button 
                onClick={handleContactClick}
                className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all group"
            >
              <Sparkles className="mr-2 h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
              Contact
            </Button>
          </motion.div>

          {/* Mobile Menu Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="md:hidden"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="relative"
            >
              <motion.div
                animate={{ rotate: isMobileMenuOpen ? 90 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </motion.div>
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            className="md:hidden bg-white/95 backdrop-blur-xl border-t border-violet-100 overflow-hidden"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Button
                    variant="ghost"
                    className="justify-start w-full hover:bg-violet-50 hover:text-violet-600 text-lg py-6"
                    onClick={() => handleNavClick(item.href, item.id, item.redirectPath)}
                  >
                    {item.name}
                  </Button>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: navItems.length * 0.05 }}
              >
                <Button 
                    onClick={handleContactClick}
                    className="w-full mt-4 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white py-6 text-lg"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Contact
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
