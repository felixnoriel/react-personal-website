import type { MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Section } from './Section'
import { Picture } from '../components/Picture'
import { IMAGES as projectImages } from '../data/images/projects.generated'
import { StablePaySchematic } from './StablePaySchematic'
import { ArrowMark } from '../marks'
import { sheetChange } from '../transitions/sheetChange'
import type { Project } from '../types/data'
import './work.css'

/**
 * Sheet 3 - Selected work.
 *
 * Three projects, each a full-width block on the sheet rather than a card:
 * a rule above, the title on the datum with its own rule under it, the real
 * outcome figures at display size, the excerpt at reading measure, the tech
 * as square chips, and the plate out in the right columns. The title is the
 * link (so a screen reader hears "StablePay", not the whole block); a click
 * anywhere else in the block opens the same sheet, and the block becomes the
 * detail sheet (Sheet Change).
 */

/** Presentation titles for the three home blocks (existing copy). */
const TITLES: Record<string, string> = {
  stable: 'StablePay',
  genopets: 'Genopets Gaming Platform',
  dashify: 'Dashify Hospitality Platform',
}

/** The real outcome numbers, split so the figure can be set in the display
 *  face and its unit beneath it. Read together they are the existing strings:
 *  150k MAU, 7.5M msgs/day, 80% faster; 20+ venues, 5k MAU, 75% cost saved. */
export const OUTCOMES: Record<string, { figure: string; label: string }[]> = {
  genopets: [
    { figure: '150k', label: 'MAU' },
    { figure: '7.5M', label: 'msgs/day' },
    { figure: '80%', label: 'faster' },
  ],
  dashify: [
    { figure: '20+', label: 'venues' },
    { figure: '5k', label: 'MAU' },
    { figure: '75%', label: 'cost saved' },
  ],
}

const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve']
export const countWord = (n: number) => WORDS[n] ?? String(n)

export const projectTitle = (p: Project) => TITLES[p.slug] ?? p.title

/** The plate art. StablePay has no banner file, so it gets the schematic. */
export function ProjectPlate({
  project,
  sizes,
  priority = false,
}: {
  project: Project
  sizes: string
  priority?: boolean
}) {
  const title = projectTitle(project)
  if (project.slug === 'stable') {
    return <StablePaySchematic title={project.image?.alt || title} />
  }
  return <Picture src={project.image?.url} from={projectImages} alt={project.image?.alt || title} sizes={sizes} priority={priority} />
}

export function WorkSheet({ projects }: { projects: Project[] }) {
  const navigate = useNavigate()
  const shown = projects.slice(0, 3)

  // Runs for a click anywhere in the block, including on the title link
  // (the event bubbles up, and preventDefault here still cancels the link's
  // own navigation). Modified clicks return early so the link keeps its
  // native open-in-new-tab behaviour.
  const onBlockClick = (e: MouseEvent<HTMLElement>, slug: string) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    void sheetChange({
      source: e.currentTarget,
      to: `/projects/${slug}`,
      navigate,
      prefetch: () => import('../pages/ProjectDetail'),
    })
  }

  return (
    <Section
      id="sheet-work"
      title="Products I've shipped and scaled."
      intro="From Web3 gaming to hospitality SaaS — a handful of the products that define the last few years of my work."
      cvHeight={2200}
    >
      <div className="work-list">
        {shown.map((project) => {
          const title = projectTitle(project)
          const outcomes = OUTCOMES[project.slug]
          return (
            <article
              key={project.slug}
              className="work-block"
              data-slug={project.slug}
              data-sheet-source={`/projects/${project.slug}`}
              onClick={(e) => onBlockClick(e, project.slug)}
            >
              <div className="cols">
                <div className="cols__main">
                  <h3 className="work-block__title" data-vt="sheet-title">
                    <a className="work-block__link" href={`/projects/${project.slug}`}>
                      {title}
                    </a>
                  </h3>
                  <div className="work-block__rule" data-vt="sheet-rule" aria-hidden="true" />

                  {outcomes && (
                    <div className="work-figures">
                      {outcomes.map((o) => (
                        <div className="work-figure" key={o.label}>
                          <span className="figure work-figure__value">{o.figure}</span>
                          <span className="meta meta--label work-figure__label">{o.label}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div
                    className="work-block__excerpt"
                    dangerouslySetInnerHTML={{ __html: project.excerpt }}
                  />

                  <div className="work-tags">
                    {project.tags.slice(0, 4).map((tag) => (
                      <span className="chip" key={tag.slug}>
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="cols__side work-plate" data-vt="sheet-plate">
                  <div className="plate">
                    <ProjectPlate project={project} sizes="(min-width: 900px) 360px, 92vw" />
                  </div>
                  <div className="meta plate__caption">{title}</div>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      <p className="work-out">
        <Link className="link" to="/projects">
          {`All ${countWord(projects.length)} projects`} <ArrowMark />
        </Link>
      </p>
    </Section>
  )
}
