import { useState } from 'react'
import { Link } from 'react-router-dom'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import { Tag } from '../Tag'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import type { Project } from '../../types/data'

interface ProjectViewProps {
  project: Project | null
  otherProjects: Project[]
}

export function ProjectView({ project, otherProjects }: ProjectViewProps) {
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
                width={800}
                height={600}
                loading="lazy"
              />
            </figure>
          )}
          <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: project.content }} />
        </div>

        <div className="lg:col-span-1">
          <ProjectSideInfo tags={project.tags} otherProjects={otherProjects} />
        </div>
      </div>

      {/* Gallery Images */}
      {project.gallery && project.gallery.filter((img) => img.url).length > 0 && (
        <div className="mt-12">
          <h2 className="text-3xl font-bold mb-6">Gallery</h2>
          
          {(() => {
            const validImages = project.gallery?.filter((img) => img.url) || []
            
            // Check if we have any categories defined
            const hasCategories = validImages.some(img => img.category)
            
            if (!hasCategories) {
               // Fallback to simpler view if no categories
                return (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {validImages.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setPhotoIndex(index)
                          setLightboxOpen(true)
                        }}
                        className="group relative overflow-hidden rounded-lg cursor-pointer bg-muted"
                      >
                        <img
                          src={img.url}
                          alt={img.alt || `Gallery image ${index + 1}`}
                          className="w-full h-auto aspect-video object-cover group-hover:scale-110 transition-transform duration-300"
                          width={400}
                          height={225}
                          loading="lazy"
                        />
                        {img.alt && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity text-left">
                            {img.alt}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )
            }

            // Group by category
            const grouped = validImages.reduce((acc, img, index) => {
              const category = img.category || 'Other'
              if (!acc[category]) acc[category] = []
              acc[category].push({ img, index })
              return acc
            }, {} as Record<string, { img: typeof validImages[0], index: number }[]>)

            // Sort categories if needed, or keep order of appearance (acc keys order)
            
            return (
              <div className="space-y-10">
                {Object.entries(grouped).map(([category, items]) => (
                  <div key={category} className="space-y-4">
                     <div className="flex items-center gap-4">
                        <h3 className="text-xl font-semibold text-primary">{category}</h3>
                        <div className="h-px bg-border flex-1"></div>
                     </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {items.map(({ img, index }) => (
                        <button
                          key={index}
                          onClick={() => {
                            setPhotoIndex(index)
                            setLightboxOpen(true)
                          }}
                          className="group relative overflow-hidden rounded-lg cursor-pointer bg-muted"
                        >
                          <img
                            src={img.url}
                            alt={img.alt || ''}
                            className="w-full h-auto aspect-video object-cover group-hover:scale-110 transition-transform duration-300"
                            width={400}
                            height={225}
                            loading="lazy"
                          />
                          {(img.alt && img.alt !== 'Default') && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity text-left truncate">
                              {img.alt}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
            )

          })()}

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

function ProjectSideInfo({ tags, otherProjects }: { tags: any[]; otherProjects: Project[] }) {
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

      {otherProjects.length > 0 && (
        <Card>
           <CardHeader>
            <CardTitle className="text-lg">Other Projects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {otherProjects.map((project) => (
                <Link key={project.slug} to={`/projects/${project.slug}`} className="block group hover:opacity-80 transition-opacity">
                {project.image?.url && (
                    <img
                    src={project.image.url}
                    alt={project.image.alt || project.title}
                    className="w-full h-auto mb-3 rounded-md shadow-sm"
                    width={300}
                    height={200}
                    loading="lazy"
                    />
                )}
                <h3 className="text-xl font-bold group-hover:text-primary transition-colors" dangerouslySetInnerHTML={{ __html: project.title }} />
                </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
