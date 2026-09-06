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

/* ------------------------------------------------------------------------ *
 * The rest of the home page's real content, lifted from the live site's
 * components (TechToolbelt, NomadLife, ProductsBuilt, sections, Footer).
 * ------------------------------------------------------------------------ */

export type Domain = 'frontend' | 'backend' | 'infra'
export interface Tool {
  name: string
  years: number
  live: boolean
  legacy: boolean
  domain: Domain
  group: string
}
export const DOMAINS: { id: Domain; title: string; caption: string; number: string }[] = [
  { id: 'frontend', title: 'Front end', caption: 'interfaces & experience', number: '01' },
  { id: 'backend', title: 'Back end', caption: 'services & data', number: '02' },
  { id: 'infra', title: 'Infrastructure', caption: 'cloud & delivery', number: '03' },
]
const T = (domain: Domain, group: string, items: [string, number, ('live' | 'legacy')?][]): Tool[] =>
  items.map(([name, years, flag]) => ({ name, years, live: flag === 'live', legacy: flag === 'legacy', domain, group }))
/** the 56 tools, in the toolbox's own order */
export const TOOLS: Tool[] = [
  ...T('frontend', 'Frameworks', [['React', 9, 'live'], ['React Native', 6, 'live'], ['Next.js', 5, 'live'], ['Vite', 3, 'live'], ['AngularJS', 6, 'legacy'], ['jQuery', 10, 'legacy']]),
  ...T('frontend', 'UI & Styling', [['Tailwind', 4, 'live'], ['shadcn/ui', 2, 'live'], ['Chakra', 3], ['Material UI', 4]]),
  ...T('frontend', 'Tooling', [['GraphQL', 5, 'live'], ['Storybook', 4], ['Turborepo', 2, 'live'], ['Webpack', 6]]),
  ...T('frontend', 'Testing', [['Jest', 6], ['Playwright', 2, 'live']]),
  ...T('backend', 'Languages', [['Node.js', 11, 'live'], ['TypeScript', 9, 'live'], ['Golang', 3, 'live'], ['NestJS', 4], ['Express', 10], ['Java', 3], ['.NET / C#', 2], ['PHP', 5, 'legacy']]),
  ...T('backend', 'Databases', [['PostgreSQL', 8, 'live'], ['MySQL', 8], ['Firebase', 4], ['Convex', 1, 'live']]),
  ...T('backend', 'Observability', [['Datadog', 3, 'live'], ['Sentry', 6], ['New Relic', 3]]),
  ...T('infra', 'Google Cloud', [['Cloud Run', 4, 'live'], ['Cloud Functions', 5], ['Pub/Sub', 4], ['BigQuery', 4], ['Cloud SQL', 3], ['Cloud Tasks', 3], ['Storage', 5], ['Cloud Build', 3]]),
  ...T('infra', 'AWS', [['Lambda', 5, 'live'], ['ECS', 4, 'live'], ['CDK', 3], ['EC2', 6], ['S3', 8], ['SNS / SQS', 5], ['CloudFront', 5], ['RDS', 4], ['API Gateway', 4], ['CloudFormation', 5]]),
  ...T('infra', 'Other', [['Docker', 7, 'live'], ['GitHub Actions', 4, 'live'], ['Vercel', 4, 'live'], ['Redis', 7], ['Circle CI', 5], ['Algolia', 3], ['Typesense', 2]]),
]

export interface City {
  code: string
  name: string
  lat: number
  lng: number
  current?: boolean
}
/** the fifteen cities of the nomad log; Bangkok is home today */
export const CITY_LIST: City[] = [
  { code: 'BKK', name: 'Bangkok', lat: 13.75, lng: 100.5, current: true },
  { code: 'MNL', name: 'Manila', lat: 14.6, lng: 120.98 },
  { code: 'HKG', name: 'Hong Kong', lat: 22.32, lng: 114.17 },
  { code: 'TPE', name: 'Taipei', lat: 25.03, lng: 121.57 },
  { code: 'SEL', name: 'Seoul', lat: 37.57, lng: 126.98 },
  { code: 'TYO', name: 'Tokyo', lat: 35.68, lng: 139.65 },
  { code: 'SIN', name: 'Singapore', lat: 1.35, lng: 103.82 },
  { code: 'BLI', name: 'Bali', lat: -8.65, lng: 115.22 },
  { code: 'SYD', name: 'Sydney', lat: -33.87, lng: 151.21 },
  { code: 'NYC', name: 'New York', lat: 40.71, lng: -74.01 },
  { code: 'LAX', name: 'Los Angeles', lat: 34.05, lng: -118.24 },
  { code: 'YYZ', name: 'Toronto', lat: 43.65, lng: -79.38 },
  { code: 'MAD', name: 'Madrid', lat: 40.42, lng: -3.7 },
  { code: 'BLQ', name: 'Bologna', lat: 44.49, lng: 11.34 },
  { code: 'MUC', name: 'Munich', lat: 48.14, lng: 11.58 },
]
/** the web of routes flown, and the highlighted tour from the current base */
export const ROUTE_EDGES: [string, string][] = [
  ['MNL', 'TPE'], ['TPE', 'TYO'], ['TYO', 'SEL'], ['SEL', 'HKG'], ['HKG', 'MNL'], ['MNL', 'BKK'], ['BKK', 'SIN'],
  ['SIN', 'BLI'], ['BLI', 'SYD'], ['MNL', 'MAD'], ['MAD', 'BLQ'], ['BLQ', 'MUC'], ['MAD', 'NYC'], ['NYC', 'YYZ'], ['NYC', 'LAX'],
]
export const ACTIVE_EDGES: [string, string][] = [['BKK', 'MAD'], ['MAD', 'NYC'], ['NYC', 'LAX']]
export const NOMAD_STATS = [
  { value: 15, suffix: '+', label: 'Countries coded from', sub: 'passport.stamps' },
  { value: 5, suffix: '+', label: 'Years as a nomad', sub: 'in.flight' },
  { value: 1000, suffix: '+', label: 'Cafés explored', sub: 'espresso.shots' },
  { value: 500, suffix: '+', label: 'Local dishes tried', sub: 'menu.items' },
] as const
export const PLACES = [
  { image: 'https://images.unsplash.com/photo-1649061267116-bf9d813b3757?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=640', title: 'Café coding', location: 'Tokyo, Japan', description: 'Best matcha lattes while debugging' },
  { image: 'https://images.unsplash.com/photo-1609765685592-703a97c877ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=640', title: 'Cloud office', location: '35,000 ft', description: 'Where merge conflicts meet turbulence' },
  { image: 'https://images.unsplash.com/photo-1652793822328-47340b1b4407?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=640', title: 'City explorer', location: 'Street markets', description: 'Best ideas come while walking' },
  { image: 'https://images.unsplash.com/photo-1758767055219-35755e2d76bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=640', title: 'Food adventures', location: 'Everywhere', description: 'Trying local cuisines between commits' },
] as const

/** the home page's section copy, verbatim from the live site */
export const SECTIONS = {
  experience: { eyebrow: 'experience', index: '03', title: 'A decade of building with small, sharp teams.', intro: 'Startups across gaming, hospitality, education, and publishing — the products and teams that shaped how I work.' },
  work: { eyebrow: 'selected work', index: '04', title: "Products I've shipped and scaled.", intro: 'From Web3 gaming to hospitality SaaS — a handful of the products that define the last few years of my work.' },
  skills: { eyebrow: 'capabilities', index: '01', title: 'Tools and tech I reach for every day.', intro: "A decade of shipping across startups, media, and Web3 — here's what's in the current toolbox, booted and running." },
  nomad: { eyebrow: 'nomad.log', index: '02', title: 'Nomading across Asia with the fam and a laptop.', intro: 'Based in Asia and moving between cities with family in tow — building products between flights, markets, and good coffee.' },
  writing: { eyebrow: 'writing', index: '05', title: 'Field notes from the road.', intro: "Dispatches from the places I've worked from, the teams I've shipped with, and the roads in between." },
  contact: { eyebrow: 'contact', index: '06', title: "Got something in mind? Let's talk.", intro: "Whether it's a product, a problem, or just a quick chat about engineering — drop a line and I'll get back to you." },
} as const

/** the three featured products on the home page, with their real outcome numbers */
export const FEATURED: { slug: string; title: string; outcomes?: { figure: string; label: string }[] }[] = [
  { slug: 'stable', title: 'StablePay' },
  { slug: 'genopets', title: 'Genopets Gaming Platform', outcomes: [{ figure: '150k', label: 'MAU' }, { figure: '7.5M', label: 'msgs/day' }, { figure: '80%', label: 'faster' }] },
  { slug: 'dashify', title: 'Dashify Hospitality Platform', outcomes: [{ figure: '20+', label: 'venues' }, { figure: '5k', label: 'MAU' }, { figure: '75%', label: 'cost saved' }] },
]

export const FOOTER = {
  headline: ['Have an idea?', 'Say hello.'],
  blurb: 'Full-stack engineer and technical co-founder. Currently shipping at Stable on StablePay, and building Dashify on the side.',
  facts: ['Based in Asia · nomading', 'Available for remote work'],
  legal: 'Felix Noriel · MIT-licensed curiosity',
} as const
