import type { MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useData } from '../contexts/DataContext'
import { SEOHead } from '../components/seo/SEOHead'
import { OUTCOMES, projectTitle } from '../sheets/WorkSheet'
import type { Project } from '../types/data'
import '../sheets/work.css'

/**
 * /projects - the index sheet.
 *
 * Every project as a row against the datum: the company on the left in
 * ballpoint, the title in the display face, the excerpt at reading measure,
 * and - where the project has them - its real outcome figures. No cards.
 * The title is the link; a click anywhere else on the row opens the same
 * sheet.
 */
export function Projects() {
  const { projects } = useData()
  const navigate = useNavigate()

  const onRowClick = (e: MouseEvent<HTMLElement>, slug: string) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    if ((e.target as Element).closest('a')) return // the link handles itself
    void navigate(`/projects/${slug}`)
  }

  return (
    <>
      <SEOHead
        title="Projects"
        description="Some of my past work and projects I've been involved with."
        url="/projects"
      />
      <section className="detail" aria-labelledby="projects-title">
        <h1 className="detail__title" id="projects-title">
          Products I&apos;ve shipped and scaled.
        </h1>
        <div className="detail__rule" aria-hidden="true" />
        <p className="detail__excerpt">
          From Web3 gaming to hospitality SaaS — a handful of the products that define the last few years of my work.
        </p>

        <div className="projects-index">
          {projects.map((project: Project) => {
            const outcomes = OUTCOMES[project.slug]
            return (
              <article className="projects-row" key={project.slug} onClick={(e) => onRowClick(e, project.slug)}>
                <div className="meta projects-row__company">{project.company?.title ?? ''}</div>
                <div>
                  <h2 className="projects-row__title">
                    <Link className="projects-row__link" to={`/projects/${project.slug}`}>
                      <span dangerouslySetInnerHTML={{ __html: projectTitle(project) }} />
                    </Link>
                  </h2>
                  <div
                    className="projects-row__excerpt"
                    dangerouslySetInnerHTML={{ __html: project.excerpt }}
                  />
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
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </>
  )
}
