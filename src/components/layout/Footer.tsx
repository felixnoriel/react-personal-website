import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight, Terminal } from 'lucide-react'
import { Socials } from '../Socials'
import { trackNavigation, trackEmailClick } from '../../utils/analytics'
import { LiveClock } from '../ui/LiveClock'

export function Footer() {
  const currentYear = new Date().getFullYear()

  const quickLinks = [
    { name: 'Home', href: '/' },
    { name: 'Work', href: '/projects' },
    { name: 'Experience', href: '/career' },
    { name: 'Skills', href: '/#skills-section' },
    { name: 'Writing', href: '/blog' },
  ]

  return (
    <footer className="relative bg-ink text-background overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--lime)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--lime)) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      <div
        aria-hidden
        className="absolute -top-40 right-0 w-[60%] h-[60%] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at top right, hsl(var(--accent) / 0.18), transparent 60%)',
        }}
      />
      <div
        aria-hidden
        className="absolute -bottom-40 left-0 w-[50%] h-[50%] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at bottom left, hsl(var(--lime) / 0.1), transparent 60%)',
        }}
      />
      <div className="container mx-auto max-w-7xl px-6 py-20 md:py-28 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl mb-20"
        >
          <div className="flex flex-wrap items-center gap-3 mb-6 text-[11px] tracking-[0.2em] uppercase">
            <span className="text-background/60 font-mono">— Let&apos;s build something</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-lime/40 bg-lime/10 text-lime font-mono normal-case text-[10px]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-lime opacity-75 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lime" />
              </span>
              online · accepting dms
            </span>
          </div>
          <h2 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tightest text-background text-balance leading-[0.95]">
            Have an idea?{' '}
            <a
              href="mailto:norielfelixjr@gmail.com"
              onClick={() => trackEmailClick('footer_hero')}
              className="italic font-extrabold text-accent hover:text-lime transition-colors hover:underline underline-offset-8 decoration-2"
            >
              Say hello
            </a>
            .
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 pb-12 border-b border-background/10">
          <div className="md:col-span-5">
            <div className="flex items-center gap-3 mb-6">
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-background text-ink font-display text-base font-medium">
                F
              </span>
              <div>
                <div className="font-display text-lg font-bold text-background">Felix Noriel</div>
                <div className="text-sm text-background/50">Product Engineer · Asia</div>
              </div>
            </div>
            <p className="text-background/60 leading-relaxed text-sm max-w-sm mb-6">
              Full-stack engineer and technical co-founder. Currently shipping
              at Stable on StablePay, and building Dashify on the side.
            </p>
            <Socials />
          </div>

          <div className="md:col-span-3 md:col-start-7">
            <div className="text-[11px] tracking-[0.18em] uppercase text-background/50 mb-5">
              Navigate
            </div>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  {link.href.startsWith('/#') ? (
                    <a
                      href={link.href}
                      onClick={() => trackNavigation(link.href, 'footer_quick_link')}
                      className="group inline-flex items-center gap-1.5 text-background/80 hover:text-accent transition-colors text-sm"
                    >
                      {link.name}
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ) : (
                    <Link
                      to={link.href}
                      onClick={() => trackNavigation(link.href, 'footer_quick_link')}
                      className="group inline-flex items-center gap-1.5 text-background/80 hover:text-accent transition-colors text-sm"
                    >
                      {link.name}
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <div className="text-[11px] tracking-[0.18em] uppercase text-background/50 mb-5">
              Contact
            </div>
            <ul className="space-y-3 text-sm text-background/80">
              <li>
                <a
                  href="mailto:norielfelixjr@gmail.com"
                  onClick={() => trackEmailClick('footer_contact')}
                  className="hover:text-accent transition-colors"
                >
                  norielfelixjr@gmail.com
                </a>
              </li>
              <li>Based in Asia · nomading</li>
              <li>Available for remote work</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <p className="text-background/50 text-xs font-mono">
            © {currentYear} Felix Noriel · MIT-licensed curiosity
          </p>
          <div className="inline-flex items-center gap-2 text-xs text-background/50 font-mono">
            <Terminal className="w-3 h-3 text-lime" />
            <LiveClock timezone="UTC" className="text-background/80" />
            <span className="text-background/40">· UTC</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
