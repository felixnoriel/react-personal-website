import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { lazy, Suspense, useEffect, useState } from 'react'
import { AnimatePresence, LazyMotion, m } from 'framer-motion'
import { DataProvider } from './contexts/DataContext'
import { MainLayout } from './components/layout/MainLayout'
import { ScrollToTop } from './components/ScrollToTop'
import { ScrollHUD } from './components/ui/ScrollHUD'
import { BootLoader } from './components/ui/BootLoader'

// Lazy Load Pages
const Home = lazy(() => import('./pages/Home').then(mod => ({ default: mod.Home })))
const Blog = lazy(() => import('./pages/Blog').then(mod => ({ default: mod.Blog })))
const BlogDetail = lazy(() => import('./pages/BlogDetail').then(mod => ({ default: mod.BlogDetail })))
const Projects = lazy(() => import('./pages/Projects').then(mod => ({ default: mod.Projects })))
const ProjectDetail = lazy(() => import('./pages/ProjectDetail').then(mod => ({ default: mod.ProjectDetail })))
const Career = lazy(() => import('./pages/Career').then(mod => ({ default: mod.Career })))
const CareerDetail = lazy(() => import('./pages/CareerDetail').then(mod => ({ default: mod.CareerDetail })))
const About = lazy(() => import('./pages/About').then(mod => ({ default: mod.About })))
// Command palette is only needed on ⌘K — keep its code out of the initial bundle.
const CommandPalette = lazy(() => import('./components/ui/CommandPalette').then(mod => ({ default: mod.CommandPalette })))
import { initGA, trackError } from './utils/analytics'
import { usePageTracking } from './hooks/usePageTracking'
import { useScrollTracking } from './hooks/useScrollTracking'
import { useTimeTracking } from './hooks/useTimeTracking'

// framer-motion animation features, loaded as their own async chunk so they
// don't weigh down the initial bundle (they stream in behind the boot veil).
const loadMotionFeatures = () => import('./utils/motionFeatures').then((mod) => mod.default)

// Analytics wrapper component
function AnalyticsWrapper({ children }: { children: React.ReactNode }) {
  usePageTracking()
  useScrollTracking()
  useTimeTracking()
  return <>{children}</>
}

function App() {
  // Initialize Google Analytics on app mount
  useEffect(() => {
    initGA()

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

  // Boot veil — NON-blocking. The real app mounts immediately so the lazy
  // route/section chunks start downloading at t=0; the cinematic boot just
  // overlays for a beat and fades. (The old code hard-gated the whole app for
  // 3s, so nothing even began loading until the boot finished.)
  const BOOT_MS = 1400
  const [bootTimeUp, setBootTimeUp] = useState(false)
  // The veil also waits on the framer feature chunk: `m` components render in
  // their pre-animation `initial` state (e.g. opacity:0) until domMax loads, so
  // lifting the veil before then could flash a blank hero on a slow connection.
  // Gating on both keeps the reveal clean and preserves the boot's exit-fade.
  const [featuresReady, setFeaturesReady] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setBootTimeUp(true), BOOT_MS)
    let alive = true
    const ready = () => alive && setFeaturesReady(true)
    import('./utils/motionFeatures').then(ready).catch(ready)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [])
  const bootDone = bootTimeUp && featuresReady

  // ⌘K command palette — the listener is eager + tiny so it can lazy-load and
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
    <HelmetProvider>
      <LazyMotion features={loadMotionFeatures} strict>
        <DataProvider>
          <Router>
            <AnalyticsWrapper>
              <ScrollToTop />
              <ScrollHUD />
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
          </Router>
        </DataProvider>

        {/* cinematic boot — fixed veil over the loading app, fades out once done */}
        <AnimatePresence>
          {!bootDone && (
            <m.div
              key="boot"
              className="fixed inset-0 z-[100]"
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
              <BootLoader durationMs={BOOT_MS} />
            </m.div>
          )}
        </AnimatePresence>
      </LazyMotion>
    </HelmetProvider>
  )
}

export default App
