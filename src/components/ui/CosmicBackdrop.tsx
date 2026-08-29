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

function announce(kind: 'webgpu' | 'webgl' | 'static', count: number) {
  const detail = { kind, count }
  ;(window as unknown as { __fxRendererInfo?: object }).__fxRendererInfo = detail
  window.dispatchEvent(new CustomEvent('fx:renderer', { detail }))
}

export function CosmicBackdrop() {
  const { reduceMotion, isMobile } = useFxLevel()
  const [gpu, setGpu] = useState(false)

  useEffect(() => {
    if (reduceMotion) {
      announce('static', 0)
      return
    }
    // respect data-saver users: the aurora alone carries the scene
    if (window.matchMedia?.('(prefers-reduced-data: reduce)').matches) {
      announce('webgl', 0)
      return
    }
    if (!('gpu' in navigator) || !navigator.gpu) {
      announce('webgl', 0)
      return
    }
    let alive = true
    navigator.gpu
      .requestAdapter()
      .then((adapter) => {
        if (!alive) return
        if (adapter) setGpu(true)
        else announce('webgl', 0)
      })
      .catch(() => {
        if (alive) announce('webgl', 0)
      })
    return () => {
      alive = false
    }
  }, [reduceMotion])

  return (
    <>
      {/* mobile runs the field quieter: the same filaments that read as
          distant atmosphere on desktop render huge against a small
          viewport and fight the text */}
      <ShaderField intensity={isMobile ? 0.5 : 0.78} />
      {/* luminance scrim — text always wins, but the field must stay ALIVE:
          light theme needs only a whisper of scrim (vivid is the point),
          dark needs more so neon never fights the type */}
      <div aria-hidden className="absolute inset-0 bg-scrim" />
      {gpu && !reduceMotion && (
        <GalaxyField
          isMobile={isMobile}
          onFail={() => {
            setGpu(false)
            announce('webgl', 0)
          }}
        />
      )}
    </>
  )
}
