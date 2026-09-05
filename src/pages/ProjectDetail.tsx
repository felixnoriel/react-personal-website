import { useParams } from 'react-router'
import { useData } from '../contexts/DataContext'
import { SEOHead } from '../components/seo/SEOHead'
import { ProjectView } from '../components/project/ProjectView'
import type { Project } from '../types/data'

export function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { projects } = useData()

  const index = projects.findIndex((p) => p.slug === slug)
  const project: Project | null = index === -1 ? null : projects[index]
  const total = projects.length

  const prev = index > 0 ? projects[index - 1] : null
  const next = index !== -1 && index < total - 1 ? projects[index + 1] : null

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
      <ProjectView project={project} total={total} prev={prev} next={next} />
    </>
  )
}
