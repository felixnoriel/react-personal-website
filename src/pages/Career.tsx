import { useData } from '../contexts/DataContext'
import { SEOHead } from '../components/seo/SEOHead'
import { CareerTimeline } from '../components/career/CareerTimeline'

export function Career() {
  const { career, loading } = useData()

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

  return (
    <>
      <SEOHead title="Career" description="Career timeline - Companies I have been a part of" url="/career" />
      <CareerTimeline experiences={career} indexPage={false} />
    </>
  )
}
