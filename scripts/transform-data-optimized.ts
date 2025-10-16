/**
 * Optimized data transformation script
 * - Small data (career, projects) → TypeScript files (bundled)
 * - Large data (blog) → JSON files (fetched at runtime)
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Helper to get image from WordPress media
function extractImage(wpPost: any): any {
  const defaultImage = { url: 'https://via.placeholder.com/800x600', alt: '' }

  if (!wpPost._embedded || !wpPost._embedded['wp:featuredmedia']) {
    return defaultImage
  }

  const media = wpPost._embedded['wp:featuredmedia'][0]
  if (!media) return defaultImage

  const sizes = media.media_details?.sizes
  if (!sizes) {
    return {
      url: media.source_url || defaultImage.url,
      alt: media.alt_text || wpPost.title?.rendered || '',
      width: media.width,
      height: media.height,
    }
  }

  const preferredSize = sizes.medium_large || sizes.medium || sizes.large || sizes.full

  return {
    url: preferredSize?.source_url || media.source_url || defaultImage.url,
    alt: media.alt_text || wpPost.title?.rendered || '',
    width: preferredSize?.width,
    height: preferredSize?.height,
  }
}

// Helper to extract tags from WordPress
function extractTags(wpPost: any): any[] {
  if (!wpPost._embedded || !wpPost._embedded['wp:term']) {
    return []
  }

  const tags: any[] = []
  const taxonomies = wpPost._embedded['wp:term']

  taxonomies.forEach((taxonomy: any[]) => {
    if (Array.isArray(taxonomy)) {
      taxonomy.forEach((term: any) => {
        if (term.taxonomy !== 'post_tag') {
          tags.push({
            name: term.name,
            slug: term.slug,
          })
        }
      })
    }
  })

  return tags
}

// Helper to extract gallery images
function extractGalleryImages(shortcodeText: string): any[] {
  if (!shortcodeText || shortcodeText === '') {
    return []
  }

  if (shortcodeText.indexOf('gallery_lightbox') < 0) {
    return []
  }

  const galleries: any[] = []
  const srcMatches = shortcodeText.matchAll(/src=["']([^"']+)["']/g)
  const titleMatches = shortcodeText.matchAll(/title=["']([^"']*)["']/g)

  const urls = Array.from(srcMatches).map((m) => m[1])
  const titles = Array.from(titleMatches).map((m) => m[1])

  urls.forEach((url, index) => {
    if (url && url.startsWith('http')) {
      galleries.push({
        url: url,
        alt: titles[index] || '',
      })
    }
  })

  return galleries
}

// Transform blog posts
function transformBlogPosts(wpPosts: any[]): any[] {
  return wpPosts.map((post) => ({
    slug: post.slug,
    title: post.title?.rendered || '',
    excerpt: post.excerpt?.rendered || '',
    content: post.content?.rendered || '',
    image: extractImage(post),
    publishedDate: post.date,
    modifiedDate: post.modified,
    tags: extractTags(post),
  }))
}

// Transform career
function transformCareer(wpCareer: any[]): any[] {
  return wpCareer.map((career) => ({
    slug: career.slug,
    title: career.title?.rendered || '',
    content: career.content?.rendered || '',
    jobTitle: career.custom_meta?.custom_meta_job_title || '',
    startDate: career.custom_meta?.custom_meta_start_date || '',
    endDate: career.custom_meta?.custom_meta_end_date || '',
    location: career.custom_meta?.custom_meta_location || '',
    image: extractImage(career),
  }))
}

// Transform projects
function transformProjects(wpProjects: any[]): any[] {
  return wpProjects.map((project) => {
    const transformed: any = {
      slug: project.slug,
      title: project.title?.rendered || '',
      excerpt: project.excerpt?.rendered || '',
      content: project.content?.rendered || '',
      image: extractImage(project),
      tags: extractTags(project),
      gallery: extractGalleryImages(project.custom_meta?.custom_meta_sc_projects_images || ''),
    }

    if (project.custom_meta?.company) {
      const company = project.custom_meta.company
      transformed.company = {
        title: company.title?.rendered || '',
        slug: company.slug,
        image: extractImage(company),
      }
    }

    return transformed
  })
}

// Generate TypeScript file content
function generateTSFile(dataName: string, typeName: string, data: any[]): string {
  const jsonString = JSON.stringify(data, null, 2)
  console.log(`   Generated ${Math.round(jsonString.length / 1024)}KB of TypeScript`)

  return `/**
 * ${dataName} data
 * Auto-generated - DO NOT EDIT MANUALLY
 */

import type { ${typeName} } from '../types/data';

export const ${dataName}: ${typeName}[] = ${jsonString};
`
}

// Main transformation
function transformData() {
  const oldDataDir = path.join(__dirname, '../old-version/static')
  const srcDataDir = path.join(__dirname, '../src/data')
  const publicDataDir = path.join(__dirname, '../public/data')

  if (!fs.existsSync(srcDataDir)) {
    fs.mkdirSync(srcDataDir, { recursive: true })
  }
  if (!fs.existsSync(publicDataDir)) {
    fs.mkdirSync(publicDataDir, { recursive: true })
  }

  console.log('🔄 Optimized data transformation...\n')

  // Blog: Save as JSON (too large for bundling)
  console.log('📝 Transforming blog posts → JSON...')
  const blogJson = JSON.parse(fs.readFileSync(path.join(oldDataDir, 'blog.json'), 'utf-8'))
  const blogPosts = transformBlogPosts(blogJson)
  fs.writeFileSync(path.join(publicDataDir, 'blog.json'), JSON.stringify(blogPosts, null, 2))
  console.log(`✅ Blog: ${blogPosts.length} posts → public/data/blog.json (fetched at runtime)\n`)

  // Career: Save as TypeScript (small, bundle it)
  console.log('💼 Transforming career → TypeScript...')
  const careerJson = JSON.parse(fs.readFileSync(path.join(oldDataDir, 'career.json'), 'utf-8'))
  const careers = transformCareer(careerJson)
  fs.writeFileSync(path.join(srcDataDir, 'career.ts'), generateTSFile('careers', 'Career', careers))
  console.log(`✅ Career: ${careers.length} entries → src/data/career.ts (bundled)\n`)

  // Projects: Save as TypeScript (small, bundle it)
  console.log('🚀 Transforming projects → TypeScript...')
  const projectsJson = JSON.parse(fs.readFileSync(path.join(oldDataDir, 'projects.json'), 'utf-8'))
  const projects = transformProjects(projectsJson)
  fs.writeFileSync(path.join(srcDataDir, 'projects.ts'), generateTSFile('projects', 'Project', projects))
  console.log(`✅ Projects: ${projects.length} projects → src/data/projects.ts (bundled)\n`)

  console.log('🎉 Data transformation complete!')
  console.log(`📁 TypeScript (bundled): ${srcDataDir}`)
  console.log(`📁 JSON (runtime): ${publicDataDir}`)
}

transformData()
