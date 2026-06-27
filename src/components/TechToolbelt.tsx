import { Cloud, Layout, Server } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  FxWord,
  HudDot,
  Reveal,
  SectionHeading,
  SectionShell,
} from './ui/section'
import type { Accent } from './ui/section-tokens'
import { TechSphere, type SphereGroup, type SphereWord } from './ui/TechSphere'

// ============================================================
// TechToolbelt — "Tools and tech I reach for every day."
//
// Rebuilt from a ~1,000-line pile (orbital core-reactor, htop process
// tables, a skill heatmap) into one interactive 3D constellation that
// holds all three stacks — color-coded by domain, filterable, with the
// sphere reforming to each stack on demand. Same real skill data.
// ============================================================

type Skill = {
  name: string
  years?: number
  live?: boolean
  note?: string
}

type Stack = {
  id: 'frontend' | 'backend' | 'infra'
  title: string
  number: string
  caption: string
  icon: LucideIcon
  accent: Accent
  groups: { label: string; items: Skill[] }[]
}

const STACKS: Stack[] = [
  {
    id: 'frontend',
    title: 'Front end',
    number: '01',
    caption: 'interfaces & experience',
    icon: Layout,
    accent: 'accent',
    groups: [
      {
        label: 'Frameworks',
        items: [
          { name: 'React', years: 9, live: true },
          { name: 'React Native', years: 6, live: true },
          { name: 'Next.js', years: 5, live: true },
          { name: 'Vite', years: 3, live: true },
          { name: 'AngularJS', years: 6, note: 'legacy' },
          { name: 'jQuery', years: 10, note: 'legacy' },
        ],
      },
      {
        label: 'UI & Styling',
        items: [
          { name: 'Tailwind', years: 4, live: true },
          { name: 'shadcn/ui', years: 2, live: true },
          { name: 'Chakra', years: 3 },
          { name: 'Material UI', years: 4 },
        ],
      },
      {
        label: 'Tooling',
        items: [
          { name: 'GraphQL', years: 5, live: true },
          { name: 'Storybook', years: 4 },
          { name: 'Turborepo', years: 2, live: true },
          { name: 'Webpack', years: 6 },
        ],
      },
      {
        label: 'Testing',
        items: [
          { name: 'Jest', years: 6 },
          { name: 'Playwright', years: 2, live: true },
        ],
      },
    ],
  },
  {
    id: 'backend',
    title: 'Back end',
    number: '02',
    caption: 'services & data',
    icon: Server,
    accent: 'lime',
    groups: [
      {
        label: 'Languages',
        items: [
          { name: 'Node.js', years: 11, live: true },
          { name: 'TypeScript', years: 9, live: true },
          { name: 'Golang', years: 3, live: true },
          { name: 'NestJS', years: 4 },
          { name: 'Express', years: 10 },
          { name: 'Java', years: 3 },
          { name: '.NET / C#', years: 2 },
          { name: 'PHP', years: 5, note: 'legacy' },
        ],
      },
      {
        label: 'Databases',
        items: [
          { name: 'PostgreSQL', years: 8, live: true },
          { name: 'MySQL', years: 8 },
          { name: 'Firebase', years: 4 },
          { name: 'Convex', years: 1, live: true },
        ],
      },
      {
        label: 'Observability',
        items: [
          { name: 'Datadog', years: 3, live: true },
          { name: 'Sentry', years: 6 },
          { name: 'New Relic', years: 3 },
        ],
      },
    ],
  },
  {
    id: 'infra',
    title: 'Infrastructure',
    number: '03',
    caption: 'cloud & delivery',
    icon: Cloud,
    accent: 'electric',
    groups: [
      {
        label: 'Google Cloud',
        items: [
          { name: 'Cloud Run', years: 4, live: true },
          { name: 'Cloud Functions', years: 5 },
          { name: 'Pub/Sub', years: 4 },
          { name: 'BigQuery', years: 4 },
          { name: 'Cloud SQL', years: 3 },
          { name: 'Cloud Tasks', years: 3 },
          { name: 'Storage', years: 5 },
          { name: 'Cloud Build', years: 3 },
        ],
      },
      {
        label: 'AWS',
        items: [
          { name: 'Lambda', years: 5, live: true },
          { name: 'ECS', years: 4, live: true },
          { name: 'CDK', years: 3 },
          { name: 'EC2', years: 6 },
          { name: 'S3', years: 8 },
          { name: 'SNS / SQS', years: 5 },
          { name: 'CloudFront', years: 5 },
          { name: 'RDS', years: 4 },
          { name: 'API Gateway', years: 4 },
          { name: 'CloudFormation', years: 5 },
        ],
      },
      {
        label: 'Other',
        items: [
          { name: 'Docker', years: 7, live: true },
          { name: 'GitHub Actions', years: 4, live: true },
          { name: 'Vercel', years: 4, live: true },
          { name: 'Redis', years: 7 },
          { name: 'Circle CI', years: 5 },
          { name: 'Algolia', years: 3 },
          { name: 'Typesense', years: 2 },
        ],
      },
    ],
  },
]

const countItems = (s: Stack) =>
  s.groups.reduce((m, g) => m + g.items.length, 0)
const countLive = (s: Stack) =>
  s.groups.reduce((m, g) => m + g.items.filter((i) => i.live).length, 0)

// Flatten the stacks into the constellation's data: one node per skill
// (tagged with its domain), plus per-domain totals for the filter chips.
const SPHERE_GROUPS: SphereGroup[] = STACKS.map((s) => ({
  id: s.id,
  title: s.title,
  accent: s.accent,
  total: countItems(s),
  live: countLive(s),
}))
const SPHERE_WORDS: SphereWord[] = STACKS.flatMap((s) =>
  s.groups.flatMap((g) =>
    g.items.map((it) => ({
      name: it.name,
      years: it.years,
      groupId: s.id,
      legacy: it.note === 'legacy',
    })),
  ),
)

export function TechToolbelt() {
  const toolCount = STACKS.reduce((n, s) => n + countItems(s), 0)
  const liveCount = STACKS.reduce((n, s) => n + countLive(s), 0)

  return (
    <SectionShell id="skills-section">
      <SectionHeading
        eyebrow="capabilities"
        meta={
          <span className="inline-flex items-center gap-2">
            <HudDot accent="lime" />
            {toolCount} tools · {liveCount} live
          </span>
        }
        title={
          <>
            Tools and tech I reach for{' '}
            <FxWord className="italic font-extrabold">every day.</FxWord>
          </>
        }
        intro="A decade of shipping across startups, media, and Web3 — here's what's in the current toolbox, booted and running."
      />

      <Reveal className="mt-12">
        <TechSphere words={SPHERE_WORDS} groups={SPHERE_GROUPS} />
      </Reveal>
    </SectionShell>
  )
}

