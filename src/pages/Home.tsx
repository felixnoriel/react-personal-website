import { SEOHead, personJsonLd } from '../components/seo/SEOHead'
import { useData } from '../contexts/DataContext'
import { HeroSheet } from '../sheets/HeroSheet'
import { ExperienceSheet } from '../sheets/ExperienceSheet'
import { WorkSheet } from '../sheets/WorkSheet'
import { PartsListSheet } from '../sheets/PartsListSheet'
import { FieldNotesSheet } from '../sheets/FieldNotesSheet'
import { ContactSheet } from '../sheets/ContactSheet'

// The home page is one drawing set, read top to bottom: who (hero), the
// proof (experience drawn to scale), the work, the parts list, the field
// notes, contact. Everything renders into the static HTML at build time;
// below-the-fold sheets use content-visibility: auto to stay cheap.
export function Home() {
  const { career, projects } = useData()
  const worksFor = career.filter((c) => /present/i.test(c.endDate)).map((c) => ({ name: c.title }))
  const knowsAbout = Array.from(new Set(career.flatMap((c) => c.techStack ?? [])))

  return (
    <>
      <SEOHead jsonLd={personJsonLd({ knowsAbout, worksFor })} />
      <HeroSheet />
      <ExperienceSheet careers={career} />
      <WorkSheet projects={projects} />
      <PartsListSheet />
      <FieldNotesSheet />
      <ContactSheet />
    </>
  )
}
