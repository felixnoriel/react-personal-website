import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { trackPageView } from '../utils/analytics'

/**
 * Hook to track page views on route changes
 * Automatically tracks when the route changes
 */
export const usePageTracking = () => {
  const location = useLocation()

  useEffect(() => {
    // Track page view on route change
    const path = location.pathname + location.search
    trackPageView(path)
  }, [location])
}
