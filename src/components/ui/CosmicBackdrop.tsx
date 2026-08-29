import { useEffect, useState } from 'react'
import { ShaderField } from './ShaderField'
import { GalaxyField } from './GalaxyField'
import { useFxLevel } from '../../hooks/useFxLevel'

/**
 * CosmicBackdrop — the site's layered living background, with a strict
 * luminance hierarchy so content ALWAYS leads:
 *
 *   1. ShaderField  — deep WebGL aurora (dimmed on dark)
 *   2. scrim        — semi-opaque background wash that forces the nebula
 *                     to recede behind text
 *   3. GalaxyField  — the WebGPU compute particle galaxy, drawn ABOVE the
 *                     scrim so its dust and warp streaks stay crisp
 *
 * WebGPU is probed once; anything short of a real adapter leaves the
 * proven WebGL aurora carrying the scene alone. Reduced-motion gets the
 * static gradient + scrim only.
 */

export function CosmicBackdrop() {
  const { reduceMotion, isMobile } = useFxLevel()
  const [gpu, setGpu] = useState(false)
  // freeze the whole backdrop once the hero scrolls away: an animating
  // field behind body copy is pure reading tax — the last frame stays as
  // a static texture and everything below reads on calm ground
  const [heroAway, setHeroAway] = useState(false)
  useEffect(() => {
    const hero = document.getElementById('hero')
    if (!hero || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver((es) => {
      setHeroAway(!(es[0]?.isIntersecting ?? true))
    })
    io.observe(hero)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (reduceMotion) return
    // respect data-saver users: the aurora alone carries the scene
    if (window.matchMedia?.('(prefers-reduced-data: reduce)').matches) return
    if (!('gpu' in navigator) || !navigator.gpu) return
    let alive = true
    navigator.gpu
      .requestAdapter()
      .then((adapter) => {
        if (alive && adapter) setGpu(true)
      })
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [reduceMotion])

  return (
    <>
      {/* pastel atmosphere — quiet on mobile (small screens amplify the
          field), frozen once the hero leaves the viewport */}
      <ShaderField intensity={isMobile ? 0.42 : 0.62} paused={heroAway} />
      {/* luminance scrim — text always wins, but the field must stay ALIVE:
          light theme needs only a whisper of scrim (vivid is the point),
          dark needs more so neon never fights the type */}
      <div aria-hidden className="absolute inset-0 bg-scrim" />
      {gpu && !reduceMotion && (
        <GalaxyField
          isMobile={isMobile}
          paused={heroAway}
          onFail={() => setGpu(false)}
        />
      )}
    </>
  )
}
