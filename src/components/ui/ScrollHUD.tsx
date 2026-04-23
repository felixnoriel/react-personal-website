import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useEffect, useState } from 'react'

const SECTION_IDS = [
  { id: 'hero', label: 'HERO' },
  { id: 'skills-section', label: 'STACK' },
  { id: 'projects-section', label: 'PROJECTS' },
  { id: 'career-section', label: 'CAREER' },
  { id: 'contact-section', label: 'CONTACT' },
]

export function ScrollHUD() {
  const progress = useMotionValue(0)
  const smooth = useSpring(progress, { stiffness: 140, damping: 24 })
  const pct = useTransform(smooth, (v) => `${Math.round(v * 100).toString().padStart(2, '0')}`)
  const bar = useTransform(smooth, (v) => `${v * 100}%`)
  const [active, setActive] = useState('HERO')
  const [bytes, setBytes] = useState('0000')

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      progress.set(p)
      setBytes(Math.round(p * 4096).toString(16).padStart(4, '0').toUpperCase())

      // Find active section
      const mid = window.innerHeight * 0.35
      let current = 'HERO'
      for (const s of SECTION_IDS) {
        const el = document.getElementById(s.id)
        if (!el) continue
        const rect = el.getBoundingClientRect()
        if (rect.top <= mid && rect.bottom > mid) {
          current = s.label
          break
        }
        if (rect.top <= mid) {
          current = s.label
        }
      }
      setActive(current)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [progress])

  return (
    <div
      aria-hidden
      className="hidden lg:flex fixed bottom-6 left-6 z-[60] items-center gap-3 px-3 py-2 rounded-full border border-border bg-background/80 backdrop-blur-md text-[10px] font-mono tracking-[0.15em] uppercase text-ink-muted shadow-sm"
    >
      <span className="flex items-center gap-1.5">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-lime opacity-75 animate-ping" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lime" />
        </span>
        <span className="text-ink">{active}</span>
      </span>
      <span className="w-px h-3 bg-border" />
      <div className="flex items-center gap-2">
        <div className="relative w-20 h-[3px] bg-border rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent via-lime to-accent"
            style={{ width: bar }}
          />
        </div>
        <motion.span className="tabular-nums text-ink">{pct}</motion.span>%
      </div>
      <span className="w-px h-3 bg-border" />
      <span className="text-ink-soft">
        0x<span className="text-accent">{bytes}</span>
      </span>
    </div>
  )
}
