import { useEffect, useState } from 'react'

interface LiveClockProps {
  timezone?: string
  className?: string
}

export function LiveClock({ timezone = 'UTC', className = '' }: LiveClockProps) {
  const [time, setTime] = useState<{ hours: string; minutes: string; seconds: string }>({
    hours: '--',
    minutes: '--',
    seconds: '--',
  })

  useEffect(() => {
    const update = () => {
      const now = new Date()
      const formatter = new Intl.DateTimeFormat('en-AU', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
      const parts = formatter.formatToParts(now)
      const hours = parts.find((p) => p.type === 'hour')?.value || '--'
      const minutes = parts.find((p) => p.type === 'minute')?.value || '--'
      const seconds = parts.find((p) => p.type === 'second')?.value || '--'
      setTime({ hours, minutes, seconds })
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [timezone])

  return (
    <span className={`font-mono tabular-nums ${className}`}>
      {time.hours}
      <span className="animate-blink">:</span>
      {time.minutes}
      <span className="text-ink-soft">:{time.seconds}</span>
    </span>
  )
}
