import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { trackTimeOnPage } from '../utils/analytics'

/**
 * Hook to track time spent on each page
 * Sends the time spent when user navigates away or closes the page
 */
export const useTimeTracking = () => {
  const location = useLocation()
  const startTime = useRef<number>(Date.now())
  const currentPath = useRef<string>(location.pathname)

  useEffect(() => {
    // Reset start time on route change
    startTime.current = Date.now()
    currentPath.current = location.pathname

    return () => {
      // Calculate time spent when component unmounts (route change)
      const timeSpent = Math.round((Date.now() - startTime.current) / 1000) // in seconds
      
      // Only track if user spent more than 3 seconds on the page
      if (timeSpent >= 3) {
        trackTimeOnPage(currentPath.current, timeSpent)
      }
    }
  }, [location.pathname])

  useEffect(() => {
    // Track time when user leaves the page (closes tab/window)
    const handleBeforeUnload = () => {
      const timeSpent = Math.round((Date.now() - startTime.current) / 1000)
      if (timeSpent >= 3) {
        trackTimeOnPage(currentPath.current, timeSpent)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])
}
