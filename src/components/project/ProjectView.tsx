import { useState } from 'react'
import { Link } from 'react-router-dom'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import { Tag } from '../Tag'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import type { Project } from '../../types/data'

interface ProjectViewProps {
  project: Project | null
}

export function ProjectView({ project }: ProjectViewProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [photoIndex, setPhotoIndex] = useState(0)

  if (!project) {
    return <div className="text-center py-20 text-muted-foreground">Project not found</div>
  }

  const lightboxSlides =
    project.gallery
      ?.filter((img) => img.url)
      .map((img) => ({
        src: img.url,
        alt: img.alt || '',
      })) || []

  return (
    <section className="container mx-auto max-w-7xl px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <h1 className="text-4xl md:text-5xl font-bold mb-6" dangerouslySetInnerHTML={{ __html: project.title }} />
          {project.image?.url && (
            <figure className="mb-8">
              <img
                alt={project.image.alt || project.title}
                src={project.image.url}
                className="w-full rounded-lg shadow-lg"
              />
            </figure>
          )}
          <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: project.content }} />
        </div>

        <div className="lg:col-span-1">
          <ProjectSideInfo tags={project.tags} company={project.company} />
        </div>
      </div>

      {/* Gallery Images */}
      {project.gallery && project.gallery.filter((img) => img.url).length > 0 && (
        <div className="mt-12">
          <h2 className="text-3xl font-bold mb-6">Images</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {project.gallery
              .filter((img) => img.url)
              .map((img, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setPhotoIndex(index)
                    setLightboxOpen(true)
                  }}
                  className="group relative overflow-hidden rounded-lg cursor-pointer"
                >
                  <img
                    src={img.url}
                    alt={img.alt || `Gallery image ${index + 1}`}
                    className="w-full h-auto aspect-video object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  {img.alt && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {img.alt}
                    </div>
                  )}
                </button>
              ))}
          </div>

          {/* Lightbox */}
          <Lightbox
            open={lightboxOpen}
            close={() => setLightboxOpen(false)}
            slides={lightboxSlides}
            index={photoIndex}
          />
        </div>
      )}
    </section>
  )
}

function ProjectSideInfo({ tags, company }: { tags: any[]; company?: Project['company'] }) {
  return (
    <div className="space-y-6">
      {tags && tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Technologies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Tag key={tag.slug} title={tag.name} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {company && <ProjectCompanyInfo company={company} />}
    </div>
  )
}

function ProjectCompanyInfo({ company }: { company: Project['company'] }) {
  if (!company) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Company</CardTitle>
      </CardHeader>
      <CardContent>
        <Link to={`/career/${company.slug}`} className="block group hover:opacity-80 transition-opacity">
          {company.image?.url && (
            <img src={company.image.url} alt={company.image.alt || company.title} className="w-full h-auto mb-3" />
          )}
          <p
            className="font-semibold group-hover:text-primary transition-colors"
            dangerouslySetInnerHTML={{ __html: company.title }}
          />
        </Link>
      </CardContent>
    </Card>
  )
}
