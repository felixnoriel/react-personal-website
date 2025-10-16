import { useParams } from 'react-router-dom'
import { useData } from '../contexts/DataContext'
import { SEOHead } from '../components/seo/SEOHead'
import { CareerView } from '../components/career/CareerView'
import { filterBySlug } from '../utils/data-filters'
import type { Career } from '../types/data'

export function CareerDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { career, projects, loading } = useData()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  const careerItems = filterBySlug<Career>(slug || '', career)
  const careerItem = careerItems[0] || null

  // Filter projects by career slug (match company slug to career slug)
  const relatedProjects = projects.filter((p) => p.company?.slug === slug)

  return (
    <>
      {careerItem && (
        <SEOHead
          title={`${careerItem.jobTitle} | ${careerItem.title}`}
          description={careerItem.content.replace(/<[^>]*>/g, '').slice(0, 160)}
          image={careerItem.image.url}
          url={`/career/${careerItem.slug}`}
        />
      )}
      <CareerView experience={careerItem} projects={relatedProjects} />
    </>
  )
}
