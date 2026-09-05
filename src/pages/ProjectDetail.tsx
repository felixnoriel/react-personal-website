import { useParams } from 'react-router-dom'
import { useData } from '../contexts/DataContext'
import { SEOHead } from '../components/seo/SEOHead'
import { ProjectView } from '../components/project/ProjectView'
import { filterBySlug } from '../utils/data-filters'
import type { Project } from '../types/data'

export function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { projects, loading } = useData()

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

  const projectItems = filterBySlug<Project>(slug || '', projects)
  const project = projectItems[0] || null

  // Compute navigation context
  const currentIndex = projects.findIndex((p) => p.slug === slug)
  const total = projects.length

  let prev: Project | null = null
  let next: Project | null = null
  let otherProjects: Project[] = []

  if (total > 0 && currentIndex !== -1) {
    prev = projects[(currentIndex - 1 + total) % total]
    next = projects[(currentIndex + 1) % total]
    // Keep otherProjects for the sidebar (prev + next)
    if (total >= 3) {
      otherProjects = [prev, next]
    } else if (total === 2) {
      otherProjects = [projects[(currentIndex + 1) % 2]]
    }
  }

  return (
    <>
      {project && (
        <SEOHead
          title={project.title}
          description={project.excerpt.replace(/<[^>]*>/g, '')}
          image={project.image.url}
          url={`/projects/${project.slug}`}
        />
      )}
      <ProjectView
        project={project}
        otherProjects={otherProjects}
        index={currentIndex}
        total={total}
        prev={prev}
        next={next}
      />
    </>
  )
}
