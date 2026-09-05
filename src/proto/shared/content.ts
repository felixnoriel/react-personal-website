/**
 * The real hero content, shared by every hero prototype under src/proto/.
 * Copy is verbatim from the live site (src/components/Intro.tsx and the
 * content inventory). Do not reword; only the presentation is yours.
 */
export const NAME = 'Felix Noriel'
export const HEADLINE = ['Product Engineer', 'Startups · Web3 · Fintech'] as const
export const STATUS = { available: 'available for work', where: 'Bangkok · UTC+7 · remote-friendly' } as const
export const BIO = [
  "I'm Felix — a senior full-stack engineer and technical co-founder.",
  '13+ years shipping software for startups across Web3, fintech, hospitality, and media.',
  'Currently based in Asia and digital nomading with the fam.',
] as const
export const CTAS = [
  { label: 'See selected work', href: '/#work' },
  { label: 'Get in touch', href: '/#contact' },
] as const
/** the four real impact numbers (panel title "impact", "2013 → now") */
export const METRICS = [
  { value: '7.5M+', label: 'messages / day', note: 'event pipeline → BigQuery' },
  { value: '150k', label: 'monthly actives', note: 'Genopets · Web3 gaming' },
  { value: '80%', label: 'faster p95', note: 'latency optimization' },
  { value: '1.8M+', label: 'users reached', note: 'notification system' },
] as const
export const TECH = [
  'TypeScript', 'React', 'React Native', 'Node.js', 'Next.js', 'Golang', 'Rust', 'PostgreSQL',
  'Solana', 'AWS', 'GCP', 'GraphQL', 'Python', 'Redis', 'EVM', 'Datadog',
] as const
export const NAV = ['Skills', 'Writing', 'Experience', 'Work', 'Contact'] as const
export const SOCIALS = [
  { name: 'LinkedIn', url: 'https://www.linkedin.com/in/felixnoriel/' },
  { name: 'GitHub', url: 'https://github.com/felixnoriel' },
  { name: 'Facebook', url: 'https://www.facebook.com/felixnoriel' },
  { name: 'Instagram', url: 'https://www.instagram.com/felixnoriel/' },
] as const
export const EMAIL = 'norielfelixjr@gmail.com'
/** the terminal easter egg from the old hero, for prototypes that keep a terminal */
export const TERMINAL = {
  prompt: 'felix@portfolio :~/about',
  commands: ['help', 'work', 'projects', 'skills', 'stack', 'contact', 'clear', 'whoami'],
  hire: { denied: 'permission denied — try sudo hire-felix', granted: 'access granted — offer inbound. felix@your-team provisioned ✓' },
} as const
/** the 9 roles, newest first, for prototypes that show the journey */
export const ROLES = [
  { company: 'Stable', title: 'Senior Full Stack Engineer', when: 'Dec 2025 – Present', where: 'Fully Remote' },
  { company: 'Genopets', title: 'Senior Full Stack Engineer', when: 'Apr 2022 – Oct 2025', where: 'Fully Remote' },
  { company: 'Dashify', title: 'Technical Co-Founder', when: 'Mar 2020 – Present', where: 'Australia & Remote' },
  { company: 'Zookal', title: 'Software Engineer', when: 'Feb 2020 – Apr 2022', where: 'Sydney' },
  { company: 'The CEO Magazine', title: 'Lead Developer', when: 'Sep 2016 – Aug 2018', where: 'Brookvale, Sydney' },
  { company: 'Tech Pilot Fund', title: 'Web Developer', when: 'May – Sep 2016', where: 'Sydney CBD' },
  { company: 'KForce Global Solutions', title: 'Software Engineer', when: 'Oct 2015 – Apr 2016', where: 'Makati City' },
  { company: 'iServe Solutions', title: 'Software Developer', when: '2014 – 2015', where: 'San Juan City' },
  { company: 'Yondu', title: 'Junior Software Engineer', when: '2013 – 2014', where: 'Taguig City' },
] as const
/** cities from the nomad log, current first */
export const CITIES = ['Bangkok', 'Manila', 'Hong Kong', 'Taipei', 'Seoul', 'Tokyo', 'Singapore', 'Bali', 'Sydney', 'New York', 'Los Angeles', 'Toronto', 'Madrid', 'Bologna', 'Munich'] as const
