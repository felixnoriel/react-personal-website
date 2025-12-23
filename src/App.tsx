import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { lazy, Suspense, useEffect } from 'react'
import { DataProvider } from './contexts/DataContext'
import { MainLayout } from './components/layout/MainLayout'
import { ScrollToTop } from './components/ScrollToTop'

// Lazy Load Pages
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })))
const Blog = lazy(() => import('./pages/Blog').then(m => ({ default: m.Blog })))
const BlogDetail = lazy(() => import('./pages/BlogDetail').then(m => ({ default: m.BlogDetail })))
const Projects = lazy(() => import('./pages/Projects').then(m => ({ default: m.Projects })))
const ProjectDetail = lazy(() => import('./pages/ProjectDetail').then(m => ({ default: m.ProjectDetail })))
const Career = lazy(() => import('./pages/Career').then(m => ({ default: m.Career })))
const CareerDetail = lazy(() => import('./pages/CareerDetail').then(m => ({ default: m.CareerDetail })))
const About = lazy(() => import('./pages/About').then(m => ({ default: m.About })))
import { initGA, trackError } from './utils/analytics'
import { usePageTracking } from './hooks/usePageTracking'
import { useScrollTracking } from './hooks/useScrollTracking'
import { useTimeTracking } from './hooks/useTimeTracking'

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

  return (
    <HelmetProvider>
      <DataProvider>
        <Router>
          <AnalyticsWrapper>
            <ScrollToTop />
            <MainLayout>
              <Suspense fallback={
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-4">
                      <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-violet-600 rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <p className="text-xl font-medium text-gray-500">Loading experience...</p>
                  </div>
                </div>
              }>
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
          </AnalyticsWrapper>
        </Router>
      </DataProvider>
    </HelmetProvider>
  )
}

export default App
