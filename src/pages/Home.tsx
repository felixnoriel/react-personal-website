import { useData } from '../contexts/DataContext'
import { SEOHead } from '../components/seo/SEOHead'
import { Intro } from '../components/Intro'
import { Skills } from '../components/Skills'
import { CareerTimeline } from '../components/career/CareerTimeline'
import { ProjectList } from '../components/project/ProjectList'
import { BlogList } from '../components/blog/BlogList'
import { filterPerPage } from '../utils/data-filters'

export function Home() {
  const { career, projects, blog, loading } = useData()

  // Limit to 3 items for homepage preview
  const careerList = filterPerPage(3, career)
  const projectList = filterPerPage(3, projects)
  const blogList = filterPerPage(3, blog)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <SEOHead />
      <Intro />
      <Skills />
      <CareerTimeline indexPage={true} experiences={careerList} />
      <ProjectList indexPage={true} projects={projectList} />
      <BlogList indexPage={true} blogList={blogList} />
    </>
  )
}
