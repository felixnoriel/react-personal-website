import { SEOHead } from '../components/seo/SEOHead'
import { AboutWebsite } from '../components/AboutWebsite'
import { ContactSheet } from '../sheets/ContactSheet'

export function About() {
  return (
    <>
      <SEOHead
        title="About"
        description="About Felix Noriel and this website. Built with React 19, Vite 8, react-router 8 and TypeScript, prerendered to static HTML."
        url="/about"
      />
      <AboutWebsite />
      <ContactSheet />
    </>
  )
}
