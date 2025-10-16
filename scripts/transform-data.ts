/**
 * Data transformation script
 * Converts WordPress JSON structure to flat TypeScript data files
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

  // Try to get medium_large, fallback to medium, then large
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

// Helper to extract gallery images from WordPress shortcode
function extractGalleryImages(shortcodeText: string): any[] {
  if (!shortcodeText || shortcodeText === '') {
    return []
  }

  // Check if it has gallery_lightbox shortcode
  if (shortcodeText.indexOf('gallery_lightbox') < 0) {
    return []
  }

  const galleries: any[] = []

  // Simple approach: match all src URLs in the shortcode
  // Format: [img_c src="URL" ... ][/img_c] or src='URL'
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

// Transform career/company data
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
  return wpProjects.map((project, index) => {
    console.log(`   - Processing project ${index + 1}/${wpProjects.length}: ${project.slug}`)

    const galleryText = project.custom_meta?.custom_meta_sc_projects_images || ''
    console.log(`     Gallery shortcode length: ${galleryText.length} chars`)

    const gallery = extractGalleryImages(galleryText)
    console.log(`     Extracted ${gallery.length} gallery images`)

    const transformed: any = {
      slug: project.slug,
      title: project.title?.rendered || '',
      excerpt: project.excerpt?.rendered || '',
      content: project.content?.rendered || '',
      image: extractImage(project),
      tags: extractTags(project),
      gallery: gallery,
    }

    // Add company info if exists
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
  console.log(`   Stringifying ${data.length} items...`)
  const jsonString = JSON.stringify(data, null, 2)
  console.log(`   Generated ${Math.round(jsonString.length / 1024)}KB of TypeScript`)

  return `/**
 * ${dataName} data
 * Auto-generated from WordPress JSON - DO NOT EDIT MANUALLY
 * To update, modify the source JSON and run: npm run transform-data
 */

import type { ${typeName} } from '../types/data';

export const ${dataName}: ${typeName}[] = ${jsonString};
`
}

// Main transformation function
function transformData() {
  const publicDataDir = path.join(__dirname, '../public/data')
  const srcDataDir = path.join(__dirname, '../src/data')

  // Create src/data directory if it doesn't exist
  if (!fs.existsSync(srcDataDir)) {
    fs.mkdirSync(srcDataDir, { recursive: true })
  }

  console.log('🔄 Starting data transformation...\n')

  // Transform blog posts
  console.log('📝 Transforming blog posts...')
  console.log('   Reading blog.json...')
  const blogJson = JSON.parse(fs.readFileSync(path.join(publicDataDir, 'blog.json'), 'utf-8'))
  console.log(`   Processing ${blogJson.length} blog posts...`)
  const blogPosts = transformBlogPosts(blogJson)
  console.log('   Writing blog.ts...')
  fs.writeFileSync(path.join(srcDataDir, 'blog.ts'), generateTSFile('blogPosts', 'BlogPost', blogPosts))
  console.log(`✅ Transformed ${blogPosts.length} blog posts\n`)

  // Transform career
  console.log('💼 Transforming career data...')
  console.log('   Reading career.json...')
  const careerJson = JSON.parse(fs.readFileSync(path.join(publicDataDir, 'career.json'), 'utf-8'))
  console.log(`   Processing ${careerJson.length} career entries...`)
  const careers = transformCareer(careerJson)
  console.log('   Writing career.ts...')
  fs.writeFileSync(path.join(srcDataDir, 'career.ts'), generateTSFile('careers', 'Career', careers))
  console.log(`✅ Transformed ${careers.length} career entries\n`)

  // Transform projects
  console.log('🚀 Transforming projects...')
  console.log('   Reading projects.json...')
  const projectsJson = JSON.parse(fs.readFileSync(path.join(publicDataDir, 'projects.json'), 'utf-8'))
  console.log(`   Processing ${projectsJson.length} projects...`)
  const projects = transformProjects(projectsJson)
  console.log('   Writing projects.ts...')
  fs.writeFileSync(path.join(srcDataDir, 'projects.ts'), generateTSFile('projects', 'Project', projects))
  console.log(`✅ Transformed ${projects.length} projects\n`)

  console.log('🎉 Data transformation complete!')
  console.log(`📁 Output directory: ${srcDataDir}`)
}

// Run transformation
transformData()
