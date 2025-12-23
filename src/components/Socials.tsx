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
    <div className="flex gap-4">
      {socials.map((social) => (
        <a
          key={social.name}
          target="_blank"
          rel="noopener noreferrer"
          href={social.url}
          onClick={() => trackSocialClick(social.name)}
          className="w-12 h-12 rounded-full border-2 border-current flex items-center justify-center transition-all hover:scale-110 hover:bg-white/20"
          aria-label={social.name}
        >
          <social.Icon className="w-5 h-5" />
        </a>
      ))}
    </div>
  )
}
