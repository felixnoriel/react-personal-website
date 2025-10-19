import { Link } from 'react-router-dom'
import { Card, CardContent } from '../ui/card'
import { ViewAllLink } from '../ViewAllLink'
import { Tag } from '../Tag'
import type { Project } from '../../types/data'

interface ProjectListProps {
  projects: Project[]
  viewType?: string
  indexPage?: boolean
}

export function ProjectList({ projects, viewType, indexPage }: ProjectListProps) {
  if (!projects || !projects[0]) {
    return <div className="text-center text-muted-foreground"></div>
  }

  return (
    <div>
      <ProjectListHeader viewType={viewType} />
      <section className="py-12 container mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: Project) => (
            <ProjectItem key={project.slug} project={project} />
          ))}
        </div>
        <ViewAllLink route="projects" indexPage={indexPage} />
      </section>
    </div>
  )
}

function ProjectListHeader({ viewType }: { viewType?: string }) {
  let title = 'Projects'
  let subtitle = 'Some of my past work'

  if (viewType === 'career') {
    title = "Some projects I've been involved with"
    subtitle = ''
  }

  return (
    <section className="bg-teal-gradient text-white py-20 text-center">
      <div className="container mx-auto max-w-7xl px-4">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">{title}</h1>
        {subtitle && <h2 className="text-xl md:text-2xl opacity-90">{subtitle}</h2>}
      </div>
    </section>
  )
}

function ProjectItem({ project }: { project: Project }) {
  if (!project) {
    return null
  }

  return (
    <Link to={`/projects/${project.slug}`} className="block group">
      <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow">
        {project.image?.url && (
          <figure className="aspect-video overflow-hidden">
            <img
              src={project.image.url}
              alt={project.image.alt || project.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </figure>
        )}
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-3 line-clamp-2" dangerouslySetInnerHTML={{ __html: project.title }} />
          <div
            className="text-sm text-muted-foreground line-clamp-3 mb-4"
            dangerouslySetInnerHTML={{ __html: project.excerpt }}
          />
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <Tag key={tag.slug} title={tag.name} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
