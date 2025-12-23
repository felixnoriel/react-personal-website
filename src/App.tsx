import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { useEffect } from 'react'
import { DataProvider } from './contexts/DataContext'
import { MainLayout } from './components/layout/MainLayout'
import { ScrollToTop } from './components/ScrollToTop'
import { Home } from './pages/Home'
import { Blog } from './pages/Blog'
import { BlogDetail } from './pages/BlogDetail'
import { Projects } from './pages/Projects'
import { ProjectDetail } from './pages/ProjectDetail'
import { Career } from './pages/Career'
import { CareerDetail } from './pages/CareerDetail'
import { About } from './pages/About'
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
            </MainLayout>
          </AnalyticsWrapper>
        </Router>
      </DataProvider>
    </HelmetProvider>
  )
}

export default App
