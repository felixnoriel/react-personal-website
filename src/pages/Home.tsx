import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { useData } from '../contexts/DataContext'
import { SEOHead } from '../components/seo/SEOHead'
import { Intro } from '../components/Intro'
import { CosmicBackdrop } from '../components/ui/CosmicBackdrop'

const TechToolbelt = lazy(() => import('../components/TechToolbelt').then(m => ({ default: m.TechToolbelt })))
const BuildingJourney = lazy(() => import('../components/BuildingJourney').then(m => ({ default: m.BuildingJourney })))
const ProductsBuilt = lazy(() => import('../components/ProductsBuilt').then(m => ({ default: m.ProductsBuilt })))
const NomadLife = lazy(() => import('../components/NomadLife').then(m => ({ default: m.NomadLife })))
const TravelStories = lazy(() => import('../components/TravelStories').then(m => ({ default: m.TravelStories })))
const ContactSection = lazy(() => import('../components/ContactSection').then(m => ({ default: m.ContactSection })))
import { filterPerPage } from '../utils/data-filters'

// Mount a section only when the user approaches it (900px ahead). React
// never renders the subtree until then, which cuts initial script time to
// a fraction — content-visibility alone still paid full render cost.
// The wrapper carries the section's anchor id so terminal commands,
// hero CTAs, and nav scrollspy work before the content exists.
function LazyMount({
  id,
  minHeight,
  children,
}: {
  id?: string
  minHeight: number
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [show, setShow] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || show) return
    if (typeof IntersectionObserver === 'undefined') {
      setShow(true)
      return
    }
    const io = new IntersectionObserver(
      (es) => {
        if (es[0]?.isIntersecting) {
          setShow(true)
          io.disconnect()
        }
      },
      { rootMargin: '900px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [show])
  return (
    <div ref={ref} id={id} className="scroll-mt-20" style={show ? undefined : { minHeight }}>
      {show && <Suspense fallback={null}>{children}</Suspense>}
    </div>
  )
}

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
      {/* Global living backdrop — deep WebGL aurora + luminance scrim +
          the WebGPU compute particle galaxy, ONE fixed layer behind the
          whole page. Every section is transparent and floats over it on
          frosted glass panels. Falls back webgpu → webgl → static CSS. */}
      <div aria-hidden className="fixed inset-0 z-0 pointer-events-none">
        <CosmicBackdrop />
      </div>
      <div className="relative z-10">
        <Intro />
        <LazyMount id="skills-section" minHeight={1000}>
          <TechToolbelt />
        </LazyMount>
        <LazyMount id="nomad-section" minHeight={2200}>
          <NomadLife />
        </LazyMount>
        <LazyMount id="career-section" minHeight={1600}>
          <BuildingJourney experiences={careerList} />
        </LazyMount>
        <LazyMount id="projects-section" minHeight={3100}>
          <ProductsBuilt projects={projectList} />
        </LazyMount>
        <LazyMount minHeight={1900}>
          <TravelStories stories={blogList} />
        </LazyMount>
        <LazyMount id="contact-section" minHeight={2000}>
          <ContactSection />
        </LazyMount>
      </div>
    </>
  )
}
