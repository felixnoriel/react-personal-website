import { Cloud, Layout, Server } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  GlassPanel,
  HudDot,
  Reveal,
  SectionHeading,
  SectionShell,
} from './ui/section'
import { ACCENT, type Accent } from './ui/section-tokens'

// ============================================================
// TechToolbelt — "Tools and tech I reach for every day."
//
// Rebuilt from a ~1,000-line pile (orbital core-reactor, htop process
// tables with per-row sparklines + mouse spotlights, a skill heatmap,
// a filterable terminal) into three clean glass stack cards. Same
// real data; far easier to grasp; no perpetual animation systems.
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
            <span className="italic font-extrabold aurora-text">every day.</span>
          </>
        }
        intro="A decade of shipping across startups, media, and Web3 — here's what's in the current toolbox, booted and running."
      />

      <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
        {STACKS.map((s, i) => (
          <StackCard key={s.id} stack={s} index={i} />
        ))}
      </div>
    </SectionShell>
  )
}

function StackCard({ stack, index }: { stack: Stack; index: number }) {
  const a = ACCENT[stack.accent]
  const Icon = stack.icon
  const total = countItems(stack)
  const live = countLive(stack)

  return (
    <Reveal delay={index * 0.1}>
      <GlassPanel accent={stack.accent} className="h-full p-5 flex flex-col">
        {/* header */}
        <div className="flex items-center gap-3 mb-5">
          <span
            className={`w-11 h-11 rounded-xl flex items-center justify-center ${a.soft} ${a.text}`}
          >
            <Icon className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <div className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-soft">
              {stack.number} · {stack.caption}
            </div>
            <h3 className="font-display text-xl font-bold tracking-tight text-ink">
              {stack.title}
            </h3>
          </div>
          <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-[10px] text-ink-soft shrink-0">
            <span className={`w-1.5 h-1.5 rounded-full ${a.bg}`} />
            {live}/{total}
          </span>
        </div>

        {/* groups */}
        <div className="space-y-4 flex-1">
          {stack.groups.map((g) => (
            <div key={g.label}>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-soft">
                  {g.label}
                </span>
                <span className="flex-1 h-px bg-border/50" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {g.items.map((it) => (
                  <SkillChip key={it.name} skill={it} accent={stack.accent} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>
    </Reveal>
  )
}

function SkillChip({ skill, accent }: { skill: Skill; accent: Accent }) {
  const a = ACCENT[accent]
  const legacy = skill.note === 'legacy'

  return (
    <span
      className={`inline-flex items-center gap-1.5 pl-2 pr-2 py-1 rounded-md border font-mono text-[11px] transition-colors ${
        legacy
          ? 'border-border/40 bg-background/25 text-ink-soft'
          : 'border-border/60 bg-background/45 text-ink hover:border-ink/25'
      }`}
    >
      {skill.live && <span className={`w-1.5 h-1.5 rounded-full ${a.bg}`} />}
      <span>{skill.name}</span>
      {skill.years != null && (
        <span className="text-ink-soft text-[9.5px] tabular-nums">
          {skill.years}y
        </span>
      )}
    </span>
  )
}
