import { createContext, useContext, useMemo } from 'react'
import type { BlogPost, Career, Project } from '../types/data'
import { careers } from '../data/career'
import { projects } from '../data/projects'
import { blogPosts } from '../data/blog'

// Blog used to stream in after mount. It cannot any more: the blog pages are
// prerendered to static HTML at build time, and an effect never runs during
// that render — the shipped HTML would be an empty list. Loading it after
// mount on the client would then disagree with that HTML and break hydration.
// So all three datasets are imported up front and the build keeps blog in its
// own chunk (see vite.config.ts) to bound the parse cost.

interface DataState {
  blog: BlogPost[]
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
      blog: blogPosts,
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
