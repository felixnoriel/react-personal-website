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
      <ProjectView project={project} />
    </>
  )
}
