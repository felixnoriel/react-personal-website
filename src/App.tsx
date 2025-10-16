import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
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

function App() {
  return (
    <HelmetProvider>
      <DataProvider>
        <Router>
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
        </Router>
      </DataProvider>
    </HelmetProvider>
  )
}

export default App
