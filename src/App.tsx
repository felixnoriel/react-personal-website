import { BrowserRouter, StaticRouter, Routes, Route } from 'react-router'
import { lazy, Suspense, useEffect, useState } from 'react'
import { LazyMotion } from 'motion/react'
import { DataProvider } from './contexts/DataContext'
import { MainLayout } from './components/layout/MainLayout'
import { ScrollToTop } from './components/ScrollToTop'

// Lazy Load Pages
const Home = lazy(() => import('./pages/Home').then(mod => ({ default: mod.Home })))
// Home is fetched in parallel with the entry, not after it: the build injects
// a modulepreload for this chunk into index.html (see vite.config.ts), which
// removes a whole round-trip from the hero on a phone connection. This warm
// import is the belt-and-braces path for browsers without modulepreload.
// Browser-only: during prerender the route tree is walked by React itself.
if (typeof window !== 'undefined') void import('./pages/Home')
const Blog = lazy(() => import('./pages/Blog').then(mod => ({ default: mod.Blog })))
const BlogDetail = lazy(() => import('./pages/BlogDetail').then(mod => ({ default: mod.BlogDetail })))
const Projects = lazy(() => import('./pages/Projects').then(mod => ({ default: mod.Projects })))
const ProjectDetail = lazy(() => import('./pages/ProjectDetail').then(mod => ({ default: mod.ProjectDetail })))
const Career = lazy(() => import('./pages/Career').then(mod => ({ default: mod.Career })))
const CareerDetail = lazy(() => import('./pages/CareerDetail').then(mod => ({ default: mod.CareerDetail })))
const About = lazy(() => import('./pages/About').then(mod => ({ default: mod.About })))
// Command palette is only needed on the Cmd-K shortcut — keep its code out of
// the initial bundle.
const CommandPalette = lazy(() => import('./components/ui/CommandPalette').then(mod => ({ default: mod.CommandPalette })))
import { initGA, trackError } from './utils/analytics'
import { usePrefetchRoutes } from './hooks/usePrefetchRoutes'
import { usePageTracking } from './hooks/usePageTracking'
import { useScrollTracking } from './hooks/useScrollTracking'
import { useTimeTracking } from './hooks/useTimeTracking'

// motion animation features, loaded as their own async chunk so they
// don't weigh down the initial bundle. Modulepreloaded from the HTML too
// (vite.config.ts), so the chunk streams in parallel with the entry.
const loadMotionFeatures = () => import('./utils/motionFeatures').then((mod) => mod.default)

// Analytics wrapper component
function AnalyticsWrapper({ children }: { children: React.ReactNode }) {
  usePageTracking()
  useScrollTracking()
  useTimeTracking()
  // hover-intent chunk prefetch — SPA navigations feel instant
  usePrefetchRoutes()
  return <>{children}</>
}

// Every page is prerendered to static HTML at build time (vite-prerender-plugin),
// so this same tree has to render in Node as well as in the browser. Node has no
// history to read, so the URL being rendered is handed in as a prop and the
// declarative StaticRouter serves it.
function AppRouter({ url, children }: { url?: string; children: React.ReactNode }) {
  if (typeof window === 'undefined') {
    return <StaticRouter location={url ?? '/'}>{children}</StaticRouter>
  }
  return <BrowserRouter>{children}</BrowserRouter>
}

function App({ url }: { url?: string } = {}) {
  // Analytics init waits for idle — it should never compete with first paint
  useEffect(() => {
    const w = window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
    }
    if (w.requestIdleCallback) w.requestIdleCallback(() => initGA(), { timeout: 3000 })
    else setTimeout(initGA, 1200)

    // Global error tracking
    const handleError = (event: ErrorEvent) => {
      trackError(event.message, 'Global Window Error')
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      trackError(event.reason?.message || 'Promise Rejection', 'Global Promise Rejection')
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  // Command palette — the listener is eager + tiny so it can lazy-load and
  // open the palette on demand; the palette component itself is a lazy chunk.
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [paletteLoaded, setPaletteLoaded] = useState(false)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes('mac')
      const mod = isMac ? e.metaKey : e.ctrlKey
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteLoaded(true)
        setPaletteOpen((v) => !v)
      } else if (e.key === 'Escape') {
        setPaletteOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <LazyMotion features={loadMotionFeatures} strict>
      <DataProvider>
        <AppRouter url={url}>
          <AnalyticsWrapper>
            <ScrollToTop />
            <MainLayout>
              <Suspense
                fallback={
                  <div
                    className="min-h-screen bg-background flex items-center justify-center"
                    aria-label="Loading"
                  >
                    <span className="font-mono text-[11px] tracking-[0.3em] uppercase text-ink-soft/70 animate-pulse">
                      loading…
                    </span>
                  </div>
                }
              >
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:slug" element={<BlogDetail />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/projects/:slug" element={<ProjectDetail />} />
                  <Route path="/career" element={<Career />} />
                  <Route path="/career/:slug" element={<CareerDetail />} />
                  <Route path="/about" element={<About />} />
                </Routes>
              </Suspense>
            </MainLayout>
            {paletteLoaded && (
              <Suspense fallback={null}>
                <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
              </Suspense>
            )}
          </AnalyticsWrapper>
        </AppRouter>
      </DataProvider>
    </LazyMotion>
  )
}

export default App
