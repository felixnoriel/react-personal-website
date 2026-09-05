import { Link } from 'react-router'
import { Picture } from '../Picture'
import { ArrowMark } from '../../marks'
import { AchievementList, TenureRule } from '../../sheets/ExperienceSheet'
import { careerAxis, formatDuration, tenureOf } from '../../utils/timeline'
import type { Career, Project } from '../../types/data'
import '../../sheets/experience.css'

interface CareerViewProps {
  experience: Career | null
  /** projects shipped from this seat */
  projects: Project[]
  /** every role, so the tenure rule is drawn on the site's one true axis */
  careers: Career[]
}

/**
 * /career/:slug - the next sheet in the set.
 *
 * It opens with its own title block: the company name as the H1 (the same
 * glyphs that travelled out of the index row), the role's real tenure drawn
 * as a segment on the same 2013 -> now axis directly beneath it, the logo
 * plate, and one sidenote carrying how long the role actually ran.
 */
export function CareerView({ experience, projects, careers }: CareerViewProps) {
  if (!experience) {
    return (
      <article className="career-sheet" data-sheet-ready="">
        <h1 className="career-sheet__title">Not on the timeline</h1>
        <p className="career-sheet__where">
          <Link className="link" to="/career">
            Experience
          </Link>
        </p>
      </article>
    )
  }

  const axis = careerAxis(careers)
  const tenure = tenureOf(experience, axis)

  return (
    <article className="career-sheet" data-slug={experience.slug} data-sheet-ready="">
      <Link className="career-sheet__back meta link" to="/career">
        Experience
      </Link>

      <div className="cols">
        <div className="cols__main">
          <h1 className="career-sheet__title detail__title">{experience.title}</h1>
        </div>
        <aside className="cols__side sidenote career-sheet__note">
          <p className="figure career-sheet__figure">{formatDuration(tenure.years)}</p>
          <p className="meta meta--pen">
            {experience.startDate} – {experience.endDate}
          </p>
        </aside>
      </div>

      <TenureRule tenure={tenure} axis={axis} className="detail__rule career-sheet__rule" />

      {experience.image?.url && (
        <span className="career-sheet__plate detail__plate plate">
          <Picture src={experience.image.url} alt={experience.image.alt || experience.title} sizes="220px" />
        </span>
      )}

      <h2 className="career-sheet__role">{experience.jobTitle}</h2>
      <p className="career-sheet__where meta">{experience.location}</p>

      <AchievementList items={experience.achievements} />

      {experience.content && <div className="prose-sheet" dangerouslySetInnerHTML={{ __html: experience.content }} />}

      {projects.length > 0 && (
        <section className="career-sheet__projects">
          <h2>Projects</h2>
          <ul>
            {projects.map((project) => (
              <li key={project.slug}>
                <Link className="index-row career-sheet__project" to={`/projects/${project.slug}`}>
                  <span className="career-sheet__project-title">{project.title}</span>
                  <span className="leader" aria-hidden="true" />
                  <ArrowMark className="career-sheet__mark" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  )
}
