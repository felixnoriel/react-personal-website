import { createContext, useContext, useMemo } from 'react'
import type { BlogPostMeta, Career, Project } from '../types/data'
import { careers } from '../data/career'
import { projects } from '../data/projects'
import { blogIndex } from '../data/blog-index'

// Blog used to stream in after mount. It cannot any more: the blog pages are
// prerendered to static HTML at build time, and an effect never runs during
// that render — the shipped HTML would be an empty list. Loading it after
// mount on the client would then disagree with that HTML and break hydration.
// So all three datasets are imported up front and the build keeps blog in its
// own chunk (see vite.config.ts) to bound the parse cost.
//
// `blog` only carries metadata (see BlogPostMeta) - every post's full HTML
// body lives in its own chunk under data/blog-content/ and is loaded only by
// the /blog/:slug page (see src/data/blog-content.ts), so the home page and
// the /blog list no longer pay for content nobody there reads.

interface DataState {
  blog: BlogPostMeta[]
  career: Career[]
  projects: Project[]
  loading: boolean
  error: string | null
}

interface DataContextType extends DataState {
  refetch: () => void
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo<DataContextType>(
    () => ({
      blog: blogIndex,
      career: careers,
      projects,
      loading: false,
      error: null,
      refetch: () => {},
    }),
    [],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
