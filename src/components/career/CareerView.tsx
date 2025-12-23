import { ProjectList } from '../project/ProjectList'
import type { Career, Project } from '../../types/data'

interface CareerViewProps {
  experience: Career | null
  projects: Project[]
}

export function CareerView({ experience, projects }: CareerViewProps) {
  return (
    <div>
      <section className="py-12">
        <CareerInfo experience={experience} />
      </section>
      <ProjectList projects={projects} viewType="career" />
    </div>
  )
}

function CareerInfo({ experience }: { experience: Career | null }) {
  if (!experience) {
    return <div className="text-center py-20 text-muted-foreground">Experience not found</div>
  }

  return (
    <div className="container mx-auto max-w-4xl px-4">
      <div className="text-center mb-12">
        <h1
          className="text-4xl md:text-5xl font-bold mb-4"
          dangerouslySetInnerHTML={{
            __html: `${experience.jobTitle}, ${experience.title}`,
          }}
        />
        <h2 className="text-xl text-muted-foreground mb-8">
          {experience.startDate} - {experience.endDate}
        </h2>
        {experience.image?.url && (
          <figure className="flex justify-center mb-6">
            <img
              src={experience.image.url}
              alt={experience.image.alt || experience.title}
              width={600}
              height={400}
              loading="lazy"
              className="max-w-md w-full h-auto"
            />
          </figure>
        )}
        <em className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: experience.location }} />
      </div>
      <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: experience.content }} />
    </div>
  )
}
