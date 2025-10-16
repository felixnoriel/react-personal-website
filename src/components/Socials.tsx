export function Socials() {
  const socials = [
    {
      name: 'LinkedIn',
      icon: 'fab fa-linkedin-in',
      url: 'https://www.linkedin.com/in/felixnoriel/',
    },
    {
      name: 'GitHub',
      icon: 'fab fa-github',
      url: 'https://github.com/felixnoriel',
    },
    {
      name: 'Facebook',
      icon: 'fab fa-facebook-f',
      url: 'https://www.facebook.com/felixnoriel',
    },
    {
      name: 'Instagram',
      icon: 'fab fa-instagram',
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
          className="w-12 h-12 rounded-full border-2 border-current flex items-center justify-center transition-all hover:scale-110 hover:bg-white/20"
          aria-label={social.name}
        >
          <i className={social.icon} />
        </a>
      ))}
    </div>
  )
}
