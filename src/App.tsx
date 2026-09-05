import { BrowserRouter, StaticRouter, Routes, Route, useLocation } from 'react-router'
import { lazy, Suspense, useEffect } from 'react'
import { DataProvider } from './contexts/DataContext'
import { SheetHeader } from './sheets/SheetHeader'
import { TitleBlockFooter } from './sheets/TitleBlockFooter'
import { SheetIndex } from './sheets/SheetIndex'
import { ScrollToTop } from './components/ScrollToTop'
import { notifyLocationChange } from './transitions/sheetChange'
import { initGA, trackError } from './utils/analytics'
import { usePrefetchRoutes } from './hooks/usePrefetchRoutes'
import { usePageTracking } from './hooks/usePageTracking'

// Every page is prerendered to static HTML at build time, so the same tree
// renders in Node (StaticRouter, given the URL) and in the browser
// (BrowserRouter). Routes are code-split; each page's own route chunks are
// modulepreloaded from its HTML (scripts/route-preloads.ts) so they stream in
// parallel with the entry, and the home page starts its import at once.
const Home = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })))
if (typeof window !== 'undefined' && window.location.pathname === '/') void import('./pages/Home')
const Blog = lazy(() => import('./pages/Blog').then((m) => ({ default: m.Blog })))
const BlogDetail = lazy(() => import('./pages/BlogDetail').then((m) => ({ default: m.BlogDetail })))
const Projects = lazy(() => import('./pages/Projects').then((m) => ({ default: m.Projects })))
const ProjectDetail = lazy(() => import('./pages/ProjectDetail').then((m) => ({ default: m.ProjectDetail })))
const Career = lazy(() => import('./pages/Career').then((m) => ({ default: m.Career })))
const CareerDetail = lazy(() => import('./pages/CareerDetail').then((m) => ({ default: m.CareerDetail })))
const About = lazy(() => import('./pages/About').then((m) => ({ default: m.About })))
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })))

function AppRouter({ url, children }: { url?: string; children: React.ReactNode }) {
  if (typeof window === 'undefined') return <StaticRouter location={url ?? '/'}>{children}</StaticRouter>
  return <BrowserRouter>{children}</BrowserRouter>
}

/** Browser-only concerns: analytics at idle, error reporting, route prefetch,
 *  and the location-change signal the Sheet Change transition waits on. */
function Runtime() {
  usePageTracking()
  usePrefetchRoutes()
  const location = useLocation()
  useEffect(() => {
    notifyLocationChange()
  }, [location])
  useEffect(() => {
    const w = window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }
    if (w.requestIdleCallback) w.requestIdleCallback(() => initGA(), { timeout: 4000 })
    else setTimeout(initGA, 2000)
    const onError = (e: ErrorEvent) => trackError(e.message, 'Global Window Error')
    const onRejection = (e: PromiseRejectionEvent) => trackError(e.reason?.message || 'Promise Rejection', 'Global Promise Rejection')
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [])
  return null
}

function App({ url }: { url?: string } = {}) {
  return (
    <DataProvider>
      <AppRouter url={url}>
        <Runtime />
        <ScrollToTop />
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SheetHeader />
        <SheetIndex />
        <div className="sheet">
          <div className="field">
            <div className="datum" aria-hidden="true" />
            <main id="main" tabIndex={-1}>
              <Suspense fallback={<div className="sheet-loading" aria-label="Loading" />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:slug" element={<BlogDetail />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/projects/:slug" element={<ProjectDetail />} />
                  <Route path="/career" element={<Career />} />
                  <Route path="/career/:slug" element={<CareerDetail />} />
                  <Route path="/about" element={<About />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </main>
            <TitleBlockFooter />
          </div>
        </div>
      </AppRouter>
    </DataProvider>
  )
}

export default App
