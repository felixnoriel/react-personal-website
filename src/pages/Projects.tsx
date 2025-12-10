import { useData } from '../contexts/DataContext'
import { SEOHead } from '../components/seo/SEOHead'
import { ProductsBuilt } from '../components/ProductsBuilt'

export function Projects() {
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

  return (
    <>
      <SEOHead
        title="Projects"
        description="Some of my past work and projects I've been involved with."
        url="/projects"
      />
      <ProductsBuilt projects={projects} showViewAllLink={false} />
    </>
  )
}
