import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { trackScrollDepth } from '../utils/analytics'

/**
 * Hook to track scroll depth on pages
 * Tracks when user scrolls to 25%, 50%, 75%, and 100% of the page
 */
export const useScrollTracking = () => {
  const location = useLocation()
  const trackedDepths = useRef<Set<number>>(new Set())

  useEffect(() => {
    // Reset tracked depths on route change
    trackedDepths.current = new Set()

    const handleScroll = () => {
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const scrollPercentage = (scrollTop / (documentHeight - windowHeight)) * 100

      // Track milestones: 25%, 50%, 75%, 100%
      const milestones = [25, 50, 75, 100] as const
      
      milestones.forEach((milestone) => {
        if (scrollPercentage >= milestone && !trackedDepths.current.has(milestone)) {
          trackedDepths.current.add(milestone)
          trackScrollDepth(milestone, location.pathname)
        }
      })
    }

    // Add scroll listener with throttling
    let ticking = false
    const scrollListener = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', scrollListener, { passive: true })

    return () => {
      window.removeEventListener('scroll', scrollListener)
    }
  }, [location.pathname])
}
