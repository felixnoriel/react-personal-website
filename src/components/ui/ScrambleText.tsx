import { useEffect, useRef, useState } from 'react'

interface ScrambleTextProps {
  text: string
  className?: string
  trigger?: 'hover' | 'view' | 'mount'
  duration?: number
}

const CHARS = '!<>-_\\/[]{}—=+*^?#________'

export function ScrambleText({
  text,
  className = '',
  trigger = 'hover',
  duration = 600,
}: ScrambleTextProps) {
  const [display, setDisplay] = useState(text)
  const frameRef = useRef<number | null>(null)
  const elementRef = useRef<HTMLSpanElement>(null)

  const scramble = () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current)
    const start = performance.now()

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const revealed = Math.floor(progress * text.length)
      let output = ''
      for (let i = 0; i < text.length; i++) {
        if (i < revealed || text[i] === ' ') {
          output += text[i]
        } else {
          output += CHARS[Math.floor(Math.random() * CHARS.length)]
        }
      }
      setDisplay(output)
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        setDisplay(text)
      }
    }
    frameRef.current = requestAnimationFrame(tick)
  }

  useEffect(() => {
    if (trigger === 'mount') {
      scramble()
    } else if (trigger === 'view') {
      const el = elementRef.current
      if (!el) return
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            scramble()
            observer.disconnect()
          }
        },
        { threshold: 0.5 }
      )
      observer.observe(el)
      return () => observer.disconnect()
    }
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])

  const handleHover = () => {
    if (trigger === 'hover') scramble()
  }

  return (
    <span
      ref={elementRef}
      onMouseEnter={handleHover}
      className={className}
    >
      {display}
    </span>
  )
}
