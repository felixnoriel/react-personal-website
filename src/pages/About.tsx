import { SEOHead } from '../components/seo/SEOHead'
import { AboutWebsite } from '../components/AboutWebsite'

export function About() {
  return (
    <>
      <SEOHead
        title="About"
        description="About Felix Noriel and this website. Built with React, Vite, Tailwind CSS, and modern web technologies."
        url="/about"
      />
      <AboutWebsite />
    </>
  )
}
