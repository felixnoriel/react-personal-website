/**
 * Generic data filtering utilities
 * Type-safe replacements for WordPress helper functions
 */

/**
 * Filter items by slug
 */
export function filterBySlug<T extends { slug: string }>(slug: string, list: T[]): T[] {
  if (!list || !Array.isArray(list)) {
    return []
  }
  return list.filter((item) => item.slug === slug)
}

/**
 * Limit results to a specific page size
 */
export function filterPerPage<T>(perPage: number, list: T[]): T[] {
  if (!list || !Array.isArray(list)) {
    return []
  }
  if (list.length <= perPage) {
    return list
  }
  return list.slice(0, perPage)
}
