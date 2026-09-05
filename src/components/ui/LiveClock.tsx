import { useEffect, useState } from 'react'

interface LiveClockProps {
  timezone?: string
  className?: string
}

/**
 * Local time at minute precision, no blinking separator: a value that
 * changed every second (with a flashing colon) next to body copy kept
 * the reader's peripheral vision from ever settling. Updates land on
 * the minute boundary.
 */
export function LiveClock({ timezone = 'UTC', className = '' }: LiveClockProps) {
  const [time, setTime] = useState('--:--')

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const update = () => {
      const now = new Date()
      setTime(
        new Intl.DateTimeFormat('en-AU', {
          timeZone: timezone,
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(now),
      )
      timer = setTimeout(update, 60_000 - (now.getSeconds() * 1000 + now.getMilliseconds()) + 50)
    }
    update()
    return () => clearTimeout(timer)
  }, [timezone])

  return <span className={className}>{time}</span>
}
