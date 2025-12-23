import { lazy, Suspense } from 'react'
import { useData } from '../contexts/DataContext'
import { SEOHead } from '../components/seo/SEOHead'
import { Intro } from '../components/Intro'

const TechToolbelt = lazy(() => import('../components/TechToolbelt').then(m => ({ default: m.TechToolbelt })))
const BuildingJourney = lazy(() => import('../components/BuildingJourney').then(m => ({ default: m.BuildingJourney })))
const ProductsBuilt = lazy(() => import('../components/ProductsBuilt').then(m => ({ default: m.ProductsBuilt })))
const NomadLife = lazy(() => import('../components/NomadLife').then(m => ({ default: m.NomadLife })))
const TravelStories = lazy(() => import('../components/TravelStories').then(m => ({ default: m.TravelStories })))
const ContactSection = lazy(() => import('../components/ContactSection').then(m => ({ default: m.ContactSection })))
import { filterPerPage } from '../utils/data-filters'

export function Home() {
  const { career, projects, blog, loading } = useData()

  // Limit to first 3 items for homepage preview
  const careerList = filterPerPage(3, career)
  const projectList = filterPerPage(3, projects)
  const blogList = filterPerPage(4, blog) // Show 4 items as requested

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-4">
                 <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                 <div className="absolute inset-0 border-4 border-violet-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
          <p className="text-xl font-medium text-gray-500">Loading experience...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <SEOHead />
      <Intro />
      <Suspense fallback={<div className="h-40 flex items-center justify-center text-muted-foreground">Loading...</div>}>
        <TechToolbelt />
        <BuildingJourney experiences={careerList} />
        <ProductsBuilt projects={projectList} />
        <NomadLife />
        <TravelStories stories={blogList} />
        <ContactSection />
      </Suspense>
    </>
  )
}
