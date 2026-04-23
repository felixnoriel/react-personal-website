import type { ReactNode } from 'react'

interface MarqueeProps {
  children: ReactNode
  className?: string
  reverse?: boolean
}

export function Marquee({ children, className = '', reverse = false }: MarqueeProps) {
  return (
    <div className={`relative flex overflow-hidden ${className}`}>
      <div
        className="flex shrink-0 animate-scroll-x items-center gap-12 pr-12"
        style={reverse ? { animationDirection: 'reverse' } : undefined}
      >
        {children}
      </div>
      <div
        aria-hidden
        className="flex shrink-0 animate-scroll-x items-center gap-12 pr-12"
        style={reverse ? { animationDirection: 'reverse' } : undefined}
      >
        {children}
      </div>
    </div>
  )
}
