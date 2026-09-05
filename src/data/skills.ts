/**
 * The toolbox, as a bill of materials.
 *
 * Every tool carries the real number of years it has been in use, whether it
 * is still in daily use (`live`), and whether it is only kept around for
 * legacy work (`note: 'legacy'`). A tool with neither flag is simply used
 * when the job calls for it - it is not marked, because the data does not
 * say either way and the drawing never invents a mark.
 *
 * Moved out of the old TechToolbelt component unchanged: same names, same
 * years, same live/legacy flags, same order.
 */

export type Skill = {
  name: string
  years?: number
  /** currently in daily use */
  live?: boolean
  /** 'legacy' where the tool is kept only for older work */
  note?: string
}

export type SkillGroup = {
  label: string
  items: Skill[]
}

export type Stack = {
  id: 'frontend' | 'backend' | 'infra'
  title: string
  caption: string
  groups: SkillGroup[]
}

export const STACKS: Stack[] = [
  {
    id: 'frontend',
    title: 'Front end',
    caption: 'interfaces & experience',
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
    caption: 'services & data',
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
    caption: 'cloud & delivery',
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

const allSkills: Skill[] = STACKS.flatMap((stack) => stack.groups.flatMap((group) => group.items))

/** Every tool in the list. */
export const TOOL_COUNT = allSkills.length

/** The ones still in daily use. */
export const LIVE_COUNT = allSkills.filter((skill) => skill.live).length

/** The longest-running tool, so the years hairline is drawn to a real scale. */
export const MAX_YEARS = allSkills.reduce((max, skill) => Math.max(max, skill.years ?? 0), 0)
