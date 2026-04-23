import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion'
import { useRef, type ReactNode } from 'react'

interface TiltCardProps {
  children: ReactNode
  className?: string
  tiltStrength?: number
  spotlightSize?: number
  spotlightOpacity?: number
  rounded?: string
}

export function TiltCard({
  children,
  className = '',
  tiltStrength = 6,
  spotlightSize = 500,
  spotlightOpacity = 0.14,
  rounded = 'rounded-3xl',
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0.5)
  const y = useMotionValue(0.5)

  const springConfig = { stiffness: 200, damping: 22, mass: 0.4 }
  const rotateX = useSpring(
    useTransform(y, [0, 1], [tiltStrength, -tiltStrength]),
    springConfig
  )
  const rotateY = useSpring(
    useTransform(x, [0, 1], [-tiltStrength, tiltStrength]),
    springConfig
  )

  const mx = useTransform(x, (v) => `${v * 100}%`)
  const my = useTransform(y, (v) => `${v * 100}%`)
  const spotlight = useMotionTemplate`radial-gradient(${spotlightSize}px circle at ${mx} ${my}, hsl(var(--accent) / ${spotlightOpacity}), transparent 55%)`

  const onMove = (e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    x.set((e.clientX - rect.left) / rect.width)
    y.set((e.clientY - rect.top) / rect.height)
  }

  const onLeave = () => {
    x.set(0.5)
    y.set(0.5)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 1200,
        transformStyle: 'preserve-3d',
      }}
      className={`relative ${className}`}
    >
      {children}
      <motion.div
        aria-hidden
        style={{ background: spotlight }}
        className={`absolute inset-0 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-500 ${rounded}`}
      />
    </motion.div>
  )
}
