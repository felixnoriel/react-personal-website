import { useData } from '../contexts/DataContext'
import { SEOHead } from '../components/seo/SEOHead'
import { CareerScale, EXPERIENCE_INTRO, EXPERIENCE_META, EXPERIENCE_TITLE } from '../sheets/ExperienceSheet'

/**
 * /career - the same nine-row scale drawing as Sheet 2, scrubber included,
 * with every achievement expanded under its row. An index sheet, not cards.
 */
export function Career() {
  const { career } = useData()

  return (
    <>
      <SEOHead title="Career" description="Career timeline - Companies I have been a part of" url="/career" />
      <article className="career-index">
        <div className="career-index__head">
          <h1 className="career-index__title">{EXPERIENCE_TITLE}</h1>
          <p className="meta meta--label">{EXPERIENCE_META}</p>
        </div>
        <p className="career-index__intro">{EXPERIENCE_INTRO}</p>
        <CareerScale careers={career} idPrefix="career-index" expanded />
      </article>
    </>
  )
}
