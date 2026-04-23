import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useEffect, useState } from 'react'

export function TechCursor() {
  const x = useMotionValue(-200)
  const y = useMotionValue(-200)
  const sx = useSpring(x, { stiffness: 450, damping: 40, mass: 0.4 })
  const sy = useSpring(y, { stiffness: 450, damping: 40, mass: 0.4 })
  const [label, setLabel] = useState('IDLE')
  const [variant, setVariant] = useState<'idle' | 'link' | 'cta' | 'text'>('idle')
  const [visible, setVisible] = useState(false)
  const [enabled, setEnabled] = useState(false)

  // Coordinate readouts
  const coordX = useTransform(sx, (v) => Math.round(v).toString().padStart(4, '0'))
  const coordY = useTransform(sy, (v) => Math.round(v).toString().padStart(4, '0'))

  useEffect(() => {
    // Disable on touch / coarse pointer
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    setEnabled(mq.matches)
    const change = () => setEnabled(mq.matches)
    mq.addEventListener?.('change', change)
    return () => mq.removeEventListener?.('change', change)
  }, [])

  useEffect(() => {
    if (!enabled) return

    const onMove = (e: MouseEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
      if (!visible) setVisible(true)

      const el = e.target as HTMLElement | null
      if (!el) return
      const interactive = el.closest(
        'a, button, [role="button"], input, textarea, select, [data-cursor]'
      ) as HTMLElement | null
      if (!interactive) {
        setVariant('idle')
        setLabel('IDLE')
        return
      }
      const hint = interactive.getAttribute('data-cursor')
      if (hint) {
        setLabel(hint.toUpperCase())
        setVariant('link')
        return
      }
      const tag = interactive.tagName.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select') {
        setVariant('text')
        setLabel('TYPE')
      } else if (tag === 'a') {
        setVariant('link')
        setLabel('LINK')
      } else {
        setVariant('cta')
        setLabel('CLICK')
      }
    }
    const onLeave = () => setVisible(false)
    const onEnter = () => setVisible(true)

    window.addEventListener('mousemove', onMove)
    document.addEventListener('mouseleave', onLeave)
    document.addEventListener('mouseenter', onEnter)
    return () => {
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('mouseenter', onEnter)
    }
  }, [enabled, visible, x, y])

  if (!enabled) return null

  const ringScale =
    variant === 'idle' ? 1 : variant === 'link' ? 1.3 : variant === 'cta' ? 1.5 : 1.2

  const color =
    variant === 'idle'
      ? 'hsl(var(--ink-soft))'
      : variant === 'link'
      ? 'hsl(var(--accent))'
      : variant === 'cta'
      ? 'hsl(var(--amber))'
      : 'hsl(var(--lime))'

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[100] hidden md:block"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.2s' }}
    >
      {/* Dot */}
      <motion.div
        style={{ x: sx, y: sy }}
        className="fixed top-0 left-0"
      >
        <div
          className="w-1 h-1 rounded-full -translate-x-1/2 -translate-y-1/2"
          style={{ background: color }}
        />
      </motion.div>

      {/* Ring with crosshair */}
      <motion.div
        style={{ x: sx, y: sy }}
        className="fixed top-0 left-0"
      >
        <div className="relative -translate-x-1/2 -translate-y-1/2">
        <motion.div
          animate={{ scale: ringScale }}
          transition={{ type: 'spring', stiffness: 320, damping: 22 }}
          className="relative"
        >
          <div
            className="w-8 h-8 rounded-full border transition-colors"
            style={{ borderColor: color }}
          />
          {/* Crosshair ticks */}
          <span
            className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-1 h-px"
            style={{ background: color }}
          />
          <span
            className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-1 h-px"
            style={{ background: color }}
          />
          <span
            className="absolute left-1/2 -translate-x-1/2 -top-1.5 h-1 w-px"
            style={{ background: color }}
          />
          <span
            className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 h-1 w-px"
            style={{ background: color }}
          />
        </motion.div>

        {/* Label + coordinates */}
        <motion.div
          initial={false}
          animate={{ opacity: variant === 'idle' ? 0.55 : 1 }}
          className="absolute top-full left-full mt-3 ml-3 flex flex-col gap-0.5 text-[9px] font-mono tracking-[0.15em] uppercase whitespace-nowrap"
          style={{ color }}
        >
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-1 w-1">
              <span
                className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
                style={{ background: color }}
              />
              <span
                className="relative inline-flex h-1 w-1 rounded-full"
                style={{ background: color }}
              />
            </span>
            {label}
          </span>
          <span className="opacity-60 text-ink-soft normal-case">
            x:<motion.span>{coordX}</motion.span> · y:
            <motion.span>{coordY}</motion.span>
          </span>
        </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
