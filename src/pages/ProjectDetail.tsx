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

  // Calculate other projects (2 items)
  const currentIndex = projects.findIndex((p) => p.slug === slug)
  
  let otherProjects: Project[] = []
  
  if (projects.length >= 3 && currentIndex !== -1) {
      if (currentIndex === 0) {
          // First item: First two items are next two projects
          otherProjects = [projects[1], projects[2]]
      } else if (currentIndex === projects.length - 1) {
          // Last item: Other projects are the first two projects
          otherProjects = [projects[0], projects[1]]
      } else {
          // Middle items: Previous and Next
          otherProjects = [projects[currentIndex - 1], projects[currentIndex + 1]]
      }
  } else if (projects.length === 2 && currentIndex !== -1) {
      // Fallback for only 2 projects, just show the other one (twice? or just once? List handles array)
      otherProjects = [projects[(currentIndex + 1) % 2]]
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
      <ProjectView project={project} otherProjects={otherProjects} />
    </>
  )
}
