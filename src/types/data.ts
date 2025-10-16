/**
 * Core data types for the personal website
 * Simplified from WordPress complex structure to flat 1-2 layer hierarchy
 */

// Core image type
export interface Image {
  url: string
  alt?: string
  width?: number
  height?: number
}

// Tag/Category type
export interface Tag {
  name: string
  slug: string
}

// Blog post type (simplified)
export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  content: string
  image: Image
  publishedDate: string
  modifiedDate: string
  tags: Tag[]
}

// Career/Company type (simplified)
export interface Career {
  slug: string
  title: string // Company name
  content: string
  jobTitle: string
  startDate: string
  endDate: string
  location: string
  image: Image
}

// Project type (simplified)
export interface Project {
  slug: string
  title: string
  excerpt: string
  content: string
  image: Image
  company?: {
    title: string
    slug: string
    image: Image
  }
  tags: Tag[]
  gallery?: Image[]
}
