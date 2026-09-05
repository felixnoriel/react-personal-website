import { createContext, useContext, useState, useEffect } from 'react'
import type { BlogPost, Career, Project } from '../types/data'
import { careers } from '../data/career'
import { projects } from '../data/projects'
// Blog is by far the largest dataset (~50KB gz). It's loaded lazily off the
// critical path — the home only needs a few previews (below the fold) and the
// blog routes are themselves lazy — so initial paint isn't blocked on it.

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
  // career + projects ship with the bundle (small); blog streams in after mount
  const [blog, setBlog] = useState<BlogPost[]>([])
  const [error, setError] = useState<string | null>(null)

  const loadBlog = () => {
    import('../data/blog')
      .then((m) => setBlog(m.blogPosts))
      .catch((e) => {
        console.error('Error loading blog data:', e)
        setError('Failed to load blog data')
      })
  }

  useEffect(() => {
    loadBlog()
  }, [])

  const value: DataContextType = {
    blog,
    career: careers,
    projects,
    loading: false,
    error,
    refetch: loadBlog,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
