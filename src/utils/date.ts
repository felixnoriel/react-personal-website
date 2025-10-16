import { DateTime } from 'luxon'

/**
 * Format a date string to YYYY-MM-DD format
 */
export function formatDate(dateString: string, format: string = 'yyyy-MM-dd'): string {
  try {
    return DateTime.fromISO(dateString).toFormat(format)
  } catch (error) {
    console.error('Error formatting date:', error)
    return dateString
  }
}

/**
 * Format a date to a human-readable format
 */
export function formatDateHuman(dateString: string): string {
  try {
    return DateTime.fromISO(dateString).toFormat('MMMM dd, yyyy')
  } catch (error) {
    console.error('Error formatting date:', error)
    return dateString
  }
}

/**
 * Get relative time (e.g., "2 days ago")
 */
export function getRelativeTime(dateString: string): string {
  try {
    return DateTime.fromISO(dateString).toRelative() || dateString
  } catch (error) {
    console.error('Error getting relative time:', error)
    return dateString
  }
}
