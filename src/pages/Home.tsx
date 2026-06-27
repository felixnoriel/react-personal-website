import { lazy, Suspense } from 'react'
import { useData } from '../contexts/DataContext'
import { SEOHead } from '../components/seo/SEOHead'
import { Intro } from '../components/Intro'
import { ShaderField } from '../components/ui/ShaderField'

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
      <div
        className="min-h-screen bg-background flex items-center justify-center"
        aria-label="Loading"
      >
        <span className="font-mono text-[11px] tracking-[0.3em] uppercase text-ink-soft/70 animate-pulse">
          loading…
        </span>
      </div>
    )
  }

  return (
    <>
      <SEOHead />
      {/* Global living shader backdrop — ONE WebGL context behind the whole
          page. Every redesigned section is transparent and floats over this
          field on frosted glass panels (the hero's proven legible pattern),
          so the site reads as one cohesive system. CSS-gradient fallback on
          mobile / reduced-motion / no-WebGL. */}
      <div aria-hidden className="fixed inset-0 z-0 pointer-events-none">
        <ShaderField intensity={0.82} />
      </div>
      <div className="relative z-10">
        <Intro />
        <Suspense fallback={<div className="h-40 flex items-center justify-center text-muted-foreground">Loading...</div>}>
          <NomadLife />
          <TechToolbelt />
          <BuildingJourney experiences={careerList} />
          <ProductsBuilt projects={projectList} />
          <TravelStories stories={blogList} />
          <ContactSection />
        </Suspense>
      </div>
    </>
  )
}
