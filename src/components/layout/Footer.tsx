import { Code, Sparkles, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Socials } from '../Socials'
import { trackNavigation, trackEmailClick } from '../../utils/analytics'

export function Footer() {
  const currentYear = new Date().getFullYear()

  const quickLinks = [
    { name: 'Home', href: '/' },
    { name: 'Skills', href: '/#skills-section' },
    { name: 'Projects', href: '/projects' },
    { name: 'Journey', href: '/career' },
    { name: 'Contact', href: 'mailto:norielfelixjr@gmail.com' },
  ]

  return (
    <footer className="bg-gradient-to-br from-violet-50/50 via-pink-50/50 to-orange-50/50 border-t-2 border-violet-100 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -bottom-20 left-1/4 w-96 h-96 bg-gradient-to-br from-violet-400/10 to-pink-400/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
          }}
          transition={{ duration: 15, repeat: Infinity }}
        />
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  whileHover={{ scale: 1.05 }}
                >
                  <img
                    src="https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/felixnoriellogo.png"
                    alt="Felix Noriel"
                    width={48}
                    height={48}
                    className="h-12 w-auto"
                  />
                </motion.div>
              <div>
                <h4 className="font-bold text-gradient-primary">Felix Noriel</h4>
                <p className="text-muted-foreground text-sm flex items-center gap-1">
                  <Code className="w-3 h-3" />
                  Software Engineer
                </p>
              </div>
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground mb-4 text-sm"
            >
              Crafting exceptional digital experiences with modern technologies. Let's build something amazing together! ✨
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Socials />
            </motion.div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h4 className="font-bold mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-600" />
              Quick Links
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((link, index) => (
                <motion.li
                  key={link.name}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  whileHover={{ x: 5 }}
                >
                  {link.href.startsWith('mailto:') || link.href.startsWith('/#') ? (
                    <a
                      href={link.href}
                      onClick={() => {
                        if (link.href.startsWith('mailto:')) {
                           trackEmailClick('footer_quick_link')
                        } else {
                           trackNavigation(link.href, 'footer_quick_link')
                        }
                      }}
                      className="text-muted-foreground hover:text-violet-600 transition-colors flex items-center gap-2 group text-sm"
                    >
                      <span className="w-1 h-1 bg-violet-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                      {link.name}
                    </a>
                  ) : (
                    <Link
                      to={link.href}
                      onClick={() => trackNavigation(link.href, 'footer_quick_link')}
                      className="text-muted-foreground hover:text-violet-600 transition-colors flex items-center gap-2 group text-sm"
                    >
                      <span className="w-1 h-1 bg-violet-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                      {link.name}
                    </Link>
                  )}
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Get in Touch */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <h4 className="font-bold mb-4 flex items-center gap-2">
              <Mail className="w-4 h-4 text-pink-600" />
              Get in Touch
            </h4>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <motion.li
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                📧 norielfelixjr@gmail.com
              </motion.li>
              <motion.li
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.45 }}
              >
                📍 Sydney, Australia
              </motion.li>
              <motion.li
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
              >
                🌍 Available remotely
              </motion.li>
            </ul>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="pt-8 border-t-2 border-violet-100 flex flex-col md:flex-row justify-between items-center gap-4"
        >
          <p className="text-muted-foreground text-sm text-center md:text-left">
            © {currentYear} Felix Noriel. All rights reserved.
          </p>
          <motion.p
            className="text-muted-foreground text-sm flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
          >
            Made with{' '}
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              ❤️
            </motion.span>{' '}
            and lots of ☕
          </motion.p>
        </motion.div>
      </div>
    </footer>
  )
}
