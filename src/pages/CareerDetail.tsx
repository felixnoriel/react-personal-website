import { useParams } from 'react-router'
import { useData } from '../contexts/DataContext'
import { SEOHead } from '../components/seo/SEOHead'
import { CareerView } from '../components/career/CareerView'
import { filterBySlug } from '../utils/data-filters'
import type { Career } from '../types/data'

export function CareerDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { career, projects } = useData()

  const experience = filterBySlug<Career>(slug || '', career)[0] || null
  // a project belongs to this sheet when its company is this company
  const relatedProjects = projects.filter((p) => p.company?.slug === slug)

  return (
    <>
      {experience && (
        <SEOHead
          title={`${experience.jobTitle} | ${experience.title}`}
          description={experience.content.replace(/<[^>]*>/g, '').slice(0, 160)}
          image={experience.image.url}
          url={`/career/${experience.slug}`}
        />
      )}
      <CareerView experience={experience} projects={relatedProjects} careers={career} />
    </>
  )
}
