import { Link } from 'react-router'
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
 */
export function Projects() {
  const { projects } = useData()

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
              <Link className="projects-row" key={project.slug} to={`/projects/${project.slug}`}>
                <div className="meta projects-row__company">{project.company?.title ?? ''}</div>
                <div>
                  <h2
                    className="projects-row__title"
                    dangerouslySetInnerHTML={{ __html: projectTitle(project) }}
                  />
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
              </Link>
            )
          })}
        </div>
      </section>
    </>
  )
}
