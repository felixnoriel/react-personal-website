import { createContext, useContext, useState, useEffect } from 'react'
import type { BlogPost, Career, Project } from '../types/data'
import { careers } from '../data/career'
import { projects } from '../data/projects'

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
  const [state, setState] = useState<DataState>({
    blog: [],
    career: careers, // Bundled - instant
    projects: projects, // Bundled - instant
    loading: true,
    error: null,
  })

  const loadData = async () => {
    try {
      // Fetch blog data at runtime (too large to bundle)
      const response = await fetch('/data/blog.json')
      const blogData: BlogPost[] = await response.json()

      setState({
        blog: blogData,
        career: careers,
        projects: projects,
        loading: false,
        error: null,
      })
    } catch (error) {
      console.error('Error loading blog data:', error)
      setState((prev) => ({
        ...prev,
        loading: false,
        error: 'Failed to load blog data',
      }))
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const value: DataContextType = {
    ...state,
    refetch: loadData,
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
