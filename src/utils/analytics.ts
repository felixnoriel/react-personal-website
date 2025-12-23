import ReactGA from 'react-ga4'

// Google Analytics Measurement ID
const GA_MEASUREMENT_ID = 'G-JEM0Y5QF76'

// Check if we're in development for debug logging
const isDevelopment = import.meta.env.DEV

/**
 * Initialize Google Analytics
 * Should be called once when the app starts
 */
export const initGA = () => {
  try {
    ReactGA.initialize(GA_MEASUREMENT_ID, {
      gaOptions: {
        // Anonymize IP addresses for privacy
        anonymize_ip: true,
        // Enable debug mode in development
        debug_mode: isDevelopment,
      },
      gtagOptions: {
        // Send page views manually (we'll track route changes)
        send_page_view: false,
      },
    })

    if (isDevelopment) {
      console.log('Google Analytics initialized in development mode')
    }
  } catch (error) {
    console.error('Failed to initialize Google Analytics:', error)
  }
}

/**
 * Track page views
 * Call this on route changes
 */
export const trackPageView = (path: string, title?: string) => {
  try {
    ReactGA.send({
      hitType: 'pageview',
      page: path,
      title: title || document.title,
    })

    if (isDevelopment) {
      console.log('GA Page View:', { path, title })
    }
  } catch (error) {
    console.error('Failed to track page view:', error)
  }
}

/**
 * Track custom events
 */
export const trackEvent = (
  category: string,
  action: string,
  label?: string,
  value?: number
) => {
  try {
    ReactGA.event({
      category,
      action,
      label,
      value,
    })

    if (isDevelopment) {
      console.log('GA Event:', { category, action, label, value })
    }
  } catch (error) {
    console.error('Failed to track event:', error)
  }
}

// Predefined event tracking functions for common interactions

/**
 * Track navigation clicks
 */
export const trackNavigation = (destination: string, source: string = 'nav') => {
  trackEvent('Navigation', 'Click', `${source} -> ${destination}`)
}

/**
 * Track external link clicks
 */
export const trackExternalLink = (url: string, label?: string) => {
  trackEvent('External Link', 'Click', label || url)
}

/**
 * Track social media clicks
 */
export const trackSocialClick = (platform: string, action: string = 'Click') => {
  trackEvent('Social Media', action, platform)
}

/**
 * Track project interactions
 */
export const trackProjectView = (projectName: string) => {
  trackEvent('Project', 'View', projectName)
}

export const trackProjectLinkClick = (projectName: string, linkType: 'demo' | 'github' | 'external') => {
  trackEvent('Project', `${linkType}_link_click`, projectName)
}

/**
 * Track blog interactions
 */
export const trackBlogView = (blogTitle: string) => {
  trackEvent('Blog', 'View', blogTitle)
}

export const trackBlogRead = (blogTitle: string, scrollDepth: number) => {
  trackEvent('Blog', 'Read', blogTitle, scrollDepth)
}

/**
 * Track career/experience interactions
 */
export const trackCareerView = (companyName: string) => {
  trackEvent('Career', 'View', companyName)
}

/**
 * Track contact form interactions
 */
export const trackContactFormInteraction = (action: 'focus' | 'submit' | 'error', field?: string) => {
  trackEvent('Contact Form', action, field)
}

/**
 * Track email clicks
 */
export const trackEmailClick = (source: string = 'contact_section') => {
  trackEvent('Contact', 'Email Click', source)
}

/**
 * Track resume/CV downloads
 */
export const trackResumeDownload = (source: string = 'unknown') => {
  trackEvent('Download', 'Resume', source)
}

/**
 * Track scroll depth
 */
export const trackScrollDepth = (depth: 25 | 50 | 75 | 100, page: string) => {
  trackEvent('Scroll Depth', `${depth}%`, page)
}

/**
 * Track time on page
 */
export const trackTimeOnPage = (page: string, seconds: number) => {
  trackEvent('Engagement', 'Time on Page', page, seconds)
}

/**
 * Track search/filter usage
 */
export const trackSearch = (searchTerm: string, resultCount: number) => {
  trackEvent('Search', 'Query', searchTerm, resultCount)
}

export const trackFilter = (filterType: string, filterValue: string) => {
  trackEvent('Filter', filterType, filterValue)
}

/**
 * Track errors
 */
export const trackError = (errorMessage: string, errorLocation?: string) => {
  trackEvent('Error', errorMessage, errorLocation)
}

/**
 * Track media interactions
 */
export const trackMediaView = (mediaType: 'image' | 'video', mediaName: string) => {
  trackEvent('Media', `View ${mediaType}`, mediaName)
}

/**
 * Track button clicks
 */
export const trackButtonClick = (buttonName: string, location: string) => {
  trackEvent('Button', 'Click', `${buttonName} (${location})`)
}

/**
 * Track modal/dialog interactions
 */
export const trackModalInteraction = (modalName: string, action: 'open' | 'close') => {
  trackEvent('Modal', action, modalName)
}

/**
 * Track technology/skill clicks
 */
export const trackTechClick = (techName: string, source: string = 'tech_toolbelt') => {
  trackEvent('Technology', 'Click', `${techName} (${source})`)
}

/**
 * Track section visibility (for understanding which sections users engage with)
 */
export const trackSectionView = (sectionName: string, page: string) => {
  trackEvent('Section', 'View', `${page} - ${sectionName}`)
}

/**
 * Track user engagement score
 * This can be called periodically to measure overall engagement
 */
export const trackEngagement = (score: number, page: string) => {
  trackEvent('Engagement', 'Score', page, score)
}
