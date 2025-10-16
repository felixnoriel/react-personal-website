import { Link } from 'react-router-dom'
import { ViewAllLink } from '../ViewAllLink'
import type { Career } from '../../types/data'

interface CareerTimelineProps {
  experiences: Career[]
  indexPage?: boolean
}

export function CareerTimeline({ experiences, indexPage }: CareerTimelineProps) {
  return (
    <section>
      <section id="career-section" className="py-20 text-center">
        <div className="container mx-auto max-w-7xl px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Career Timeline</h1>
          <h2 className="text-xl md:text-2xl text-muted-foreground">Companies I have been a part of</h2>
        </div>
      </section>

      <section className="py-12 container mx-auto max-w-4xl px-4">
        <ExperienceList experiences={experiences} />
        <ViewAllLink route="career" indexPage={indexPage} />
      </section>
    </section>
  )
}

function ExperienceList({ experiences }: { experiences: Career[] }) {
  if (!experiences || experiences.length === 0) {
    return <div className="text-center text-muted-foreground">No experience found</div>
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-border" />

      {/* Start marker */}
      <div className="flex justify-center mb-12">
        <div className="bg-primary text-primary-foreground rounded-full p-4 z-10 shadow-lg">
          <i className="fas fa-laptop text-2xl" />
        </div>
      </div>

      {/* Experiences */}
      {experiences.map((exp: Career, index: number) => (
        <Experience key={exp.slug} experience={exp} isEven={index % 2 === 0} />
      ))}
    </div>
  )
}

function Experience({ experience, isEven }: { experience: Career; isEven: boolean }) {
  if (!experience) {
    return null
  }

  return (
    <div className="relative mb-16">
      {/* Timeline marker */}
      <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-primary border-4 border-background rounded-full z-10" />

      {/* Content - Alternating left/right */}
      <div className={`flex ${isEven ? 'justify-end' : 'justify-start'}`}>
        <div className={`w-full md:w-5/12 ${isEven ? 'md:pr-12' : 'md:pl-12'}`}>
          <Link
            to={`/career/${experience.slug}`}
            className="block group bg-card border rounded-lg shadow-sm hover:shadow-lg transition-all overflow-hidden"
          >
            {/* Company Logo */}
            {experience.image?.url && (
              <div className="bg-muted p-6 flex items-center justify-center h-32">
                <img
                  src={experience.image.url}
                  alt={experience.image.alt || experience.title}
                  className="max-h-20 w-auto object-contain group-hover:scale-110 transition-transform"
                />
              </div>
            )}

            {/* Job Info */}
            <div className="p-6">
              <p
                className="text-lg font-bold mb-2 group-hover:text-primary transition-colors"
                dangerouslySetInnerHTML={{
                  __html: `${experience.jobTitle}`,
                }}
              />
              <p
                className="text-base font-semibold text-muted-foreground mb-3"
                dangerouslySetInnerHTML={{ __html: experience.title }}
              />
              <p className="text-sm text-muted-foreground mb-2">
                {experience.startDate} - {experience.endDate}
              </p>
              <em className="text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: experience.location }} />
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
