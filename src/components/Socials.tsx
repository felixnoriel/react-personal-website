import { Linkedin, Github, Facebook, Instagram } from 'lucide-react'
import { trackSocialClick } from '../utils/analytics'

export function Socials() {
  const socials = [
    {
      name: 'LinkedIn',
      Icon: Linkedin,
      url: 'https://www.linkedin.com/in/felixnoriel/',
    },
    {
      name: 'GitHub',
      Icon: Github,
      url: 'https://github.com/felixnoriel',
    },
    {
      name: 'Facebook',
      Icon: Facebook,
      url: 'https://www.facebook.com/felixnoriel',
    },
    {
      name: 'Instagram',
      Icon: Instagram,
      url: 'https://www.instagram.com/felixnoriel/',
    },
  ]

  return (
    <div className="flex gap-3">
      {socials.map((social) => (
        <a
          key={social.name}
          target="_blank"
          rel="noopener noreferrer"
          href={social.url}
          onClick={() => trackSocialClick(social.name)}
          className="w-10 h-10 rounded-full border border-border text-ink-muted flex items-center justify-center hover:border-ink hover:text-ink hover:bg-surface transition-colors"
          aria-label={social.name}
        >
          <social.Icon className="w-4 h-4" />
        </a>
      ))}
    </div>
  )
}
