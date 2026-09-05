import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { lazy, Suspense, useEffect, useState } from 'react'
import { AnimatePresence, LazyMotion, m } from 'framer-motion'
import { DataProvider } from './contexts/DataContext'
import { MainLayout } from './components/layout/MainLayout'
import { ScrollToTop } from './components/ScrollToTop'

// Lazy Load Pages
const Home = lazy(() => import('./pages/Home').then(mod => ({ default: mod.Home })))
// Home is fetched in parallel with the entry, not after it: the build injects
// a modulepreload for this chunk into index.html (see vite.config.ts), which
// removes a whole round-trip from the hero on a phone connection. This warm
// import is the belt-and-braces path for browsers without modulepreload.
import('./pages/Home')
// The cinematic boot is its own chunk — its matrix-rain canvas must not cost
// bundle bytes or main-thread time in the window the hero is rendering. Until
// it lands, the static #boot-static frame (a sibling of #root that React never
// touches) is what the visitor sees, so nothing flashes on a slow connection.
const BootLoader = lazy(() =>
  import('./components/ui/BootLoader').then(mod => ({ default: mod.BootLoader })),
)
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
import { usePrefetchRoutes } from './hooks/usePrefetchRoutes'
import { usePageTracking } from './hooks/usePageTracking'
import { useScrollTracking } from './hooks/useScrollTracking'
import { useTimeTracking } from './hooks/useTimeTracking'

// framer-motion animation features, loaded as their own async chunk so they
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

function App() {
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

  // Boot veil — NON-blocking. The real app mounts immediately so the lazy
  // route/section chunks start downloading at t=0; the cinematic boot just
  // overlays for a beat and fades. (The old code hard-gated the whole app for
  // 3s, so nothing even began loading until the boot finished.)
  // Speed rules: the beat is SHORT, and a repeat visit in the same session
  // skips the veil entirely — the cinematic intro is for first contact only.
  const BOOT_MS = 600
  const [skipBoot] = useState(() => {
    try {
      return sessionStorage.getItem('fx-booted') === '1'
    } catch {
      return false
    }
  })
  const [bootTimeUp, setBootTimeUp] = useState(false)
  // The veil also waits on the framer feature chunk: `m` components render in
  // their pre-animation `initial` state (e.g. opacity:0) until domMax loads, so
  // lifting the veil before then could flash a blank hero on a slow connection.
  // Gating on both keeps the reveal clean and preserves the boot's exit-fade.
  // The chunk is modulepreloaded, so this gate rarely binds in practice.
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
  const bootDone = skipBoot || (bootTimeUp && featuresReady)

  // Tell fx components (particle headline) the veil is lifting, so their
  // big entrance moment happens where the visitor can actually see it.
  useEffect(() => {
    if (bootDone) {
      // the pre-hydration boot frame lives OUTSIDE #root (see index.html), so
      // React never unmounts it — take it down as the veil lifts
      document.getElementById('boot-static')?.remove()
      ;(window as unknown as { __fxBootDone?: boolean }).__fxBootDone = true
      window.dispatchEvent(new Event('fx:bootdone'))
      try {
        sessionStorage.setItem('fx-booted', '1')
      } catch {
        /* private mode — every visit gets the boot, fine */
      }
    }
  }, [bootDone])

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
              <Suspense fallback={null}>
                <BootLoader durationMs={BOOT_MS} />
              </Suspense>
            </m.div>
          )}
        </AnimatePresence>
      </LazyMotion>
    </HelmetProvider>
  )
}

export default App
