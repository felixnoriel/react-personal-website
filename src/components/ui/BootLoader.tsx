import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

/**
 * BootLoader — a cinematic boot-sequence loading experience.
 *
 * Stack (back to front):
 *   1. Dark cockpit background w/ radial vignette
 *   2. Matrix-style character rain (canvas)
 *   3. Hex grid + crosshair overlay
 *   4. Expanding pulse rings radiating from core
 *   5. 3D-tilted orbital core w/ 3 rings, 3 data packets traveling on rails,
 *      pulsing hex reactor w/ glitching monogram
 *   6. Holographic title with RGB split + periodic glitch burst
 *   7. Segmented progress bar with shimmer
 *   8. Rich boot log (6 rows, hex addresses, timings, state pills)
 *   9. HUD corner brackets, scan sweep, 6 live stat chips
 *
 * All motion respects prefers-reduced-motion.
 */

type BootStep = {
  addr: string
  mod: string
  label: string
}

const BOOT_STEPS: BootStep[] = [
  { addr: '0x7f32a2', mod: 'kernel', label: 'init(runtime.v2026.04)' },
  { addr: '0x7f32b1', mod: 'fs    ', label: 'mount("/felix/workspace")' },
  { addr: '0x7f32c4', mod: 'tw    ', label: 'compile(design-tokens, 154)' },
  { addr: '0x7f32e0', mod: 'fx    ', label: 'framer.boot(reducedMotion)' },
  { addr: '0x7f3301', mod: 'ai    ', label: 'claude.handshake("loop")' },
  { addr: '0x7f3320', mod: 'net   ', label: 'routes.preload(/, /projects)' },
  { addr: '0x7f334a', mod: 'gpu   ', label: 'shader.link(hud, orbit, rain)' },
  { addr: '0x7f3370', mod: 'hud   ', label: 'calibrate(grid, brackets)' },
  { addr: '0x7f3398', mod: 'data  ', label: 'hydrate(career, projects)' },
  { addr: '0x7f33b5', mod: 'render', label: 'pipeline.flush() → frame(0)' },
]

const TOTAL_SEGMENTS = 24
const VISIBLE_LOG_ROWS = 6

export function BootLoader({
  label = 'BOOTING WORKSPACE',
  durationMs = 3000,
}: {
  label?: string
  durationMs?: number
}) {
  const reduce = useReducedMotion() ?? false

  const [progress, setProgress] = useState(0) // 0..1
  const [logIdx, setLogIdx] = useState(0)
  const [tick, setTick] = useState(0)
  const [glitch, setGlitch] = useState(false)
  const startedAt = useRef<number>(performance.now())

  // Main progress loop — ease-out curve across `durationMs`
  useEffect(() => {
    if (reduce) {
      setProgress(1)
      setLogIdx(BOOT_STEPS.length - VISIBLE_LOG_ROWS)
      return
    }
    const durSec = durationMs / 1000
    let rafId = 0
    const loop = () => {
      const elapsed = (performance.now() - startedAt.current) / 1000
      const eased = 1 - Math.pow(1 - Math.min(elapsed / durSec, 0.995), 3)
      setProgress(eased)
      setTick(Math.floor(elapsed * 10))
      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [reduce, durationMs])

  // Rolling log window
  useEffect(() => {
    if (reduce) return
    const visibleStart = Math.min(
      Math.floor(progress * (BOOT_STEPS.length - 2)),
      BOOT_STEPS.length - VISIBLE_LOG_ROWS,
    )
    setLogIdx(Math.max(0, visibleStart))
  }, [progress, reduce])

  // Periodic glitch burst on the title
  useEffect(() => {
    if (reduce) return
    const id = setInterval(() => {
      setGlitch(true)
      setTimeout(() => setGlitch(false), 120)
    }, 1100)
    return () => clearInterval(id)
  }, [reduce])

  const activeStep = Math.min(
    Math.floor(progress * BOOT_STEPS.length),
    BOOT_STEPS.length - 1,
  )
  const filledSegments = Math.round(progress * TOTAL_SEGMENTS)
  const visibleSteps = BOOT_STEPS.slice(logIdx, logIdx + VISIBLE_LOG_ROWS)

  // Live stat values
  const uptime = (tick / 10).toFixed(1)
  const fps = useMemo(() => 58 + ((tick * 7) % 4), [tick])
  const mem = useMemo(() => (10.2 + ((tick * 0.3) % 4)).toFixed(1), [tick])
  const net = useMemo(() => 38 + ((tick * 5) % 14), [tick])
  const thr = useMemo(() => 6 + ((tick * 2) % 4), [tick])

  return (
    <div
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden"
      role="status"
      aria-label={label}
      style={{
        backgroundColor: '#060611',
        backgroundImage:
          'radial-gradient(ellipse at 50% 45%, rgba(30, 40, 70, 0.55) 0%, rgba(6, 6, 17, 1) 70%)',
      }}
    >
      {/* 1. Matrix rain */}
      <MatrixRain reduce={reduce} />

      {/* 2. Hex grid overlay */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.18]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(180, 255, 180, 0.12) 1px, transparent 1px),
            linear-gradient(90deg, rgba(180, 255, 180, 0.12) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
        }}
      />

      {/* 3. Vignette darken at edges */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(6,6,17,0.8) 95%)',
        }}
      />

      {/* 4. Horizontal scan sweep */}
      {!reduce && (
        <motion.div
          aria-hidden
          className="absolute left-0 right-0 h-[2px] pointer-events-none z-[2]"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(142, 255, 166, 0.0) 10%, rgba(142, 255, 166, 0.9) 50%, rgba(142, 255, 166, 0.0) 90%, transparent 100%)',
            boxShadow: '0 0 28px rgba(142, 255, 166, 0.75)',
          }}
          initial={{ top: '12%', opacity: 0 }}
          animate={{ top: ['12%', '88%', '12%'], opacity: [0, 1, 0] }}
          transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* 5. HUD brackets */}
      <HudBrackets />

      {/* 6. Live stat chips (6 total, 3 top + 3 bottom) */}
      <StatChip pos="tl" slot={0} k="SYS" v="FX.KERNEL" dot="lime" />
      <StatChip pos="tl" slot={1} k="UP" v={`${uptime}s`} dot="electric" />
      <StatChip pos="tl" slot={2} k="MEM" v={`${mem}MB`} dot="lime" />
      <StatChip pos="tr" slot={0} k="FPS" v={`${fps}`} dot={fps >= 60 ? 'lime' : 'amber'} />
      <StatChip pos="tr" slot={1} k="NET" v={`${net}ms`} dot={net < 45 ? 'lime' : 'amber'} />
      <StatChip pos="tr" slot={2} k="THR" v={`×${thr}`} dot="electric" />
      <StatChip pos="bl" slot={0} k="NODE" v="fx-01.sfo" dot="amber" />
      <StatChip pos="br" slot={0} k="VER" v="2026.04.23" dot="lime" />

      {/* 7. MAIN STACK */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-6 w-full max-w-xl">
        {/* Top meta line */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="font-mono text-[10px] tracking-[0.32em] uppercase text-white/35 flex items-center gap-2.5"
        >
          <span className="inline-block w-6 h-px bg-white/30" />
          <span>&#47;&#47; FX.BOOT-SEQUENCE</span>
          <span>·</span>
          <span>v2026.04.23</span>
          <span className="inline-block w-6 h-px bg-white/30" />
        </motion.div>

        {/* Orbital core */}
        <OrbitCore reduce={reduce} progress={progress} />

        {/* Holographic title */}
        <HoloTitle label={label} glitch={glitch} reduce={reduce} />

        {/* Streaming subtitle */}
        <div className="font-mono text-[11px] tracking-wider text-white/55 flex items-center gap-2">
          <span className="text-lime">&gt;</span>
          <TypingLine progress={progress} reduce={reduce} />
          {!reduce && <BlinkCaret />}
        </div>

        {/* Segmented progress */}
        <div className="w-full">
          <div className="flex items-center justify-between font-mono text-[9.5px] tracking-[0.22em] uppercase text-white/40 mb-1.5">
            <span>PROGRESS</span>
            <span className="flex items-center gap-2">
              <span className="text-white/60 tabular-nums">
                {filledSegments.toString().padStart(2, '0')}/{TOTAL_SEGMENTS}
              </span>
              <span className="text-lime tabular-nums">
                {String(Math.round(progress * 100)).padStart(3, '0')}%
              </span>
            </span>
          </div>
          <div className="flex gap-[2px]">
            {Array.from({ length: TOTAL_SEGMENTS }).map((_, i) => {
              const on = i < filledSegments
              const edge = i === filledSegments - 1 && !reduce
              return (
                <motion.div
                  key={i}
                  className="flex-1 h-2 rounded-[1px]"
                  style={{
                    backgroundColor: on
                      ? 'rgba(142, 255, 166, 0.8)'
                      : 'rgba(255, 255, 255, 0.06)',
                    border: on
                      ? '1px solid rgba(142, 255, 166, 0.9)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: edge
                      ? '0 0 10px rgba(142, 255, 166, 1), inset 0 0 6px rgba(142, 255, 166, 0.5)'
                      : on
                      ? '0 0 4px rgba(142, 255, 166, 0.55)'
                      : 'none',
                  }}
                  animate={edge ? { opacity: [0.6, 1, 0.6] } : undefined}
                  transition={
                    edge
                      ? { duration: 0.9, repeat: Infinity, ease: 'easeInOut' }
                      : undefined
                  }
                />
              )
            })}
          </div>
        </div>

        {/* Terminal log */}
        <div
          className="w-full font-mono text-[11px] leading-[1.85] rounded-md px-3.5 py-2.5 relative overflow-hidden"
          style={{
            backgroundColor: 'rgba(10, 14, 28, 0.75)',
            border: '1px solid rgba(142, 255, 166, 0.15)',
            boxShadow:
              '0 12px 40px -12px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.03)',
          }}
        >
          {/* Corner tick ornaments */}
          <span className="absolute top-1 left-1 w-1.5 h-1.5 border-l border-t border-lime/60" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 border-r border-t border-lime/60" />
          <span className="absolute bottom-1 left-1 w-1.5 h-1.5 border-l border-b border-lime/60" />
          <span className="absolute bottom-1 right-1 w-1.5 h-1.5 border-r border-b border-lime/60" />

          {visibleSteps.map((step, rowIdx) => {
            const realIdx = logIdx + rowIdx
            const state =
              realIdx < activeStep
                ? 'ok'
                : realIdx === activeStep
                ? 'run'
                : 'pending'
            const ms =
              state === 'ok'
                ? 1 + ((realIdx * 13) % 8)
                : state === 'run'
                ? Math.floor((tick * 2) % 16)
                : 0
            return (
              <motion.div
                key={`${step.addr}-${realIdx}`}
                initial={reduce ? false : { opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2.5 whitespace-nowrap"
              >
                <StatePill state={state} reduce={reduce} />
                <span className="text-white/35 tabular-nums">[{step.addr}]</span>
                <span className="text-white/55 uppercase tracking-wider text-[10px] w-12 shrink-0">
                  {step.mod.trim()}
                </span>
                <span
                  className={
                    state === 'ok'
                      ? 'text-white/60'
                      : state === 'run'
                      ? 'text-white'
                      : 'text-white/25'
                  }
                >
                  {step.label}
                </span>
                <span className="ml-auto text-[10px] tabular-nums text-white/35 shrink-0 min-w-[42px] text-right">
                  {state === 'pending' ? '—' : `${ms}ms`}
                </span>
              </motion.div>
            )
          })}
        </div>

        {/* Bottom tagline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="font-mono text-[9.5px] tracking-[0.36em] uppercase text-white/30 flex items-center gap-3"
        >
          <span>human</span>
          <span className="text-lime">×</span>
          <span>claude</span>
          <span className="text-lime">×</span>
          <span>loop</span>
        </motion.div>
      </div>

      {/* sr-only */}
      <span className="sr-only">
        {label}, {Math.round(progress * 100)} percent complete
      </span>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// OrbitCore — 3D-tilted orbit rings + data packets + hex core
// ════════════════════════════════════════════════════════════
function OrbitCore({ reduce, progress }: { reduce: boolean; progress: number }) {
  const W = 260
  const C = W / 2
  const rings = [
    { r: 112, color: 'rgba(142,255,166,0.55)', dur: 18 },
    { r: 88, color: 'rgba(130, 190, 255, 0.55)', dur: 12 },
    { r: 64, color: 'rgba(255, 190, 120, 0.55)', dur: 8 },
  ]

  return (
    <div
      className="relative"
      style={{
        width: W,
        height: W,
        perspective: '900px',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Expanding pulse rings */}
      {!reduce &&
        [0, 1, 2].map((i) => (
          <motion.div
            key={`pulse-${i}`}
            aria-hidden
            className="absolute inset-0 rounded-full border"
            style={{
              borderColor: 'rgba(142, 255, 166, 0.55)',
              boxShadow: '0 0 20px rgba(142, 255, 166, 0.35)',
            }}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: [0.4, 1.45], opacity: [0, 0.55, 0] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 1,
              ease: 'easeOut',
            }}
          />
        ))}

      {/* Main 3D-tilted SVG stack */}
      <div
        className="absolute inset-0"
        style={{
          transform: 'rotateX(62deg)',
          transformStyle: 'preserve-3d',
        }}
      >
        <svg
          width={W}
          height={W}
          viewBox={`0 0 ${W} ${W}`}
          className="absolute inset-0"
          aria-hidden
        >
          <defs>
            <radialGradient id="ocGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(142,255,166,0.8)" />
              <stop offset="50%" stopColor="rgba(130,190,255,0.18)" />
              <stop offset="100%" stopColor="rgba(130,190,255,0)" />
            </radialGradient>
          </defs>

          {/* Core glow */}
          <circle cx={C} cy={C} r="100" fill="url(#ocGlow)" />

          {/* The 3 concentric rings */}
          {rings.map((ring, i) => (
            <g key={i}>
              <circle
                cx={C}
                cy={C}
                r={ring.r}
                fill="none"
                stroke={ring.color}
                strokeWidth="1"
                strokeDasharray={i === 0 ? '0' : i === 1 ? '6 8' : '2 4'}
                opacity={0.6}
              />
              {/* Tick marks on outermost ring */}
              {i === 0 &&
                Array.from({ length: 48 }).map((_, j) => {
                  const a = (j / 48) * Math.PI * 2
                  const r1 = ring.r + 4
                  const r2 = j % 6 === 0 ? ring.r + 10 : ring.r + 6
                  return (
                    <line
                      key={j}
                      x1={C + r1 * Math.cos(a)}
                      y1={C + r1 * Math.sin(a)}
                      x2={C + r2 * Math.cos(a)}
                      y2={C + r2 * Math.sin(a)}
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth="0.8"
                    />
                  )
                })}
            </g>
          ))}

          {/* Data packets riding each ring (via animateMotion) */}
          {!reduce &&
            rings.map((ring, i) => {
              const pathId = `ring-path-${i}`
              const colors = ['#8effa6', '#82beff', '#ffbe78']
              return (
                <g key={`packet-${i}`}>
                  <path
                    id={pathId}
                    d={`M ${C - ring.r} ${C} A ${ring.r} ${ring.r} 0 1 1 ${
                      C + ring.r
                    } ${C} A ${ring.r} ${ring.r} 0 1 1 ${C - ring.r} ${C}`}
                    fill="none"
                    stroke="none"
                  />
                  {/* 2 packets per ring, offset */}
                  {[0, 0.5].map((offset, k) => (
                    <g key={k}>
                      <circle
                        r="5"
                        fill={colors[i]}
                        opacity="0.35"
                        style={{ filter: `drop-shadow(0 0 6px ${colors[i]})` }}
                      >
                        <animateMotion
                          dur={`${ring.dur}s`}
                          repeatCount="indefinite"
                          begin={`-${ring.dur * offset}s`}
                          rotate="auto"
                        >
                          <mpath href={`#${pathId}`} />
                        </animateMotion>
                      </circle>
                      <circle r="2.2" fill={colors[i]}>
                        <animateMotion
                          dur={`${ring.dur}s`}
                          repeatCount="indefinite"
                          begin={`-${ring.dur * offset}s`}
                          rotate="auto"
                        >
                          <mpath href={`#${pathId}`} />
                        </animateMotion>
                      </circle>
                      {/* Trailing streak */}
                      <rect
                        x="-14"
                        y="-0.6"
                        width="14"
                        height="1.2"
                        fill={colors[i]}
                        opacity="0.5"
                      >
                        <animateMotion
                          dur={`${ring.dur}s`}
                          repeatCount="indefinite"
                          begin={`-${ring.dur * offset}s`}
                          rotate="auto"
                        >
                          <mpath href={`#${pathId}`} />
                        </animateMotion>
                      </rect>
                    </g>
                  ))}
                </g>
              )
            })}

          {/* Progress arc on outermost ring */}
          <circle
            cx={C}
            cy={C}
            r={rings[0].r}
            fill="none"
            stroke="#8effa6"
            strokeWidth="2"
            strokeLinecap="round"
            transform={`rotate(-90 ${C} ${C})`}
            strokeDasharray={2 * Math.PI * rings[0].r}
            strokeDashoffset={2 * Math.PI * rings[0].r * (1 - progress)}
            style={{
              filter: 'drop-shadow(0 0 8px rgba(142,255,166,0.95))',
              transition: 'stroke-dashoffset 0.18s linear',
            }}
          />

          {/* Radial spokes (8) */}
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i / 8) * Math.PI * 2
            const r1 = 30
            const r2 = rings[0].r - 4
            return (
              <line
                key={i}
                x1={C + r1 * Math.cos(a)}
                y1={C + r1 * Math.sin(a)}
                x2={C + r2 * Math.cos(a)}
                y2={C + r2 * Math.sin(a)}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1"
                strokeDasharray="2 4"
              />
            )
          })}
        </svg>
      </div>

      {/* FLAT central reactor (stays upright, not tilted) */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ zIndex: 2 }}
      >
        <ReactorCore reduce={reduce} />
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// ReactorCore — hex core with glitching monogram
// ════════════════════════════════════════════════════════════
function ReactorCore({ reduce }: { reduce: boolean }) {
  const size = 72
  const hexPts = useMemo(() => {
    const c = size / 2
    const r = c - 2
    const pts: string[] = []
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6
      pts.push(`${c + r * Math.cos(a)},${c + r * Math.sin(a)}`)
    }
    return pts.join(' ')
  }, [size])
  const hexPtsInner = useMemo(() => {
    const c = size / 2
    const r = c - 12
    const pts: string[] = []
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6
      pts.push(`${c + r * Math.cos(a)},${c + r * Math.sin(a)}`)
    }
    return pts.join(' ')
  }, [size])

  // Glitch the monogram character occasionally
  const [mono, setMono] = useState('FX')
  useEffect(() => {
    if (reduce) return
    const glyphs = ['FX', 'F×', '0F', '<>', 'FX', 'FX', 'ƒx', 'FX']
    let i = 0
    const id = setInterval(() => {
      i = (i + 1) % glyphs.length
      setMono(glyphs[i])
    }, 520)
    return () => clearInterval(id)
  }, [reduce])

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0"
        aria-hidden
      >
        {/* outer glow */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 + 4}
          fill="rgba(142,255,166,0.18)"
          style={{ filter: 'blur(6px)' }}
        />
        {/* outer hex */}
        <polygon
          points={hexPts}
          fill="#060611"
          stroke="#8effa6"
          strokeWidth="1.5"
          style={{ filter: 'drop-shadow(0 0 8px rgba(142,255,166,0.9))' }}
        />
        {/* inner hex */}
        <polygon
          points={hexPtsInner}
          fill="none"
          stroke="rgba(142,255,166,0.4)"
          strokeWidth="0.8"
        />
        {/* pulsing inner dot */}
        {!reduce ? (
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r="3.5"
            fill="#8effa6"
            animate={{ r: [3, 5.5, 3], opacity: [1, 0.55, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ filter: 'drop-shadow(0 0 6px #8effa6)' }}
          />
        ) : (
          <circle cx={size / 2} cy={size / 2} r="3.5" fill="#8effa6" />
        )}
      </svg>
      {/* glitching monogram text — HTML for sharper typography */}
      <div
        className="absolute inset-0 flex items-center justify-center select-none"
        style={{
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.16em',
          color: 'rgba(255,255,255,0.95)',
          textShadow: '0 0 8px rgba(142,255,166,0.8)',
        }}
      >
        {mono}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// HoloTitle — chromatic-aberration + glitch title
// ════════════════════════════════════════════════════════════
function HoloTitle({
  label,
  glitch,
  reduce,
}: {
  label: string
  glitch: boolean
  reduce: boolean
}) {
  const styleBase: React.CSSProperties = {
    fontFamily: '"JetBrains Mono", ui-monospace, monospace',
    fontWeight: 700,
    letterSpacing: '0.32em',
  }
  return (
    <div className="relative" aria-label={label}>
      {/* RGB split: red + cyan layers behind the main one */}
      {!reduce && (
        <>
          <motion.div
            aria-hidden
            className="absolute inset-0 flex items-center justify-center whitespace-nowrap"
            style={{
              ...styleBase,
              color: '#ff3b7a',
              mixBlendMode: 'screen',
              opacity: glitch ? 0.9 : 0.55,
            }}
            animate={
              glitch
                ? { x: [-3, 4, -2, 0], y: [1, -1, 2, 0] }
                : { x: [-1.2, 1.2, -1.2], y: 0 }
            }
            transition={{
              duration: glitch ? 0.14 : 3,
              repeat: glitch ? 0 : Infinity,
              ease: glitch ? 'linear' : 'easeInOut',
            }}
          >
            <span className="text-2xl md:text-3xl">{label}</span>
          </motion.div>
          <motion.div
            aria-hidden
            className="absolute inset-0 flex items-center justify-center whitespace-nowrap"
            style={{
              ...styleBase,
              color: '#35e3ff',
              mixBlendMode: 'screen',
              opacity: glitch ? 0.9 : 0.55,
            }}
            animate={
              glitch
                ? { x: [3, -4, 2, 0], y: [-1, 1, -2, 0] }
                : { x: [1.2, -1.2, 1.2], y: 0 }
            }
            transition={{
              duration: glitch ? 0.14 : 3,
              repeat: glitch ? 0 : Infinity,
              ease: glitch ? 'linear' : 'easeInOut',
            }}
          >
            <span className="text-2xl md:text-3xl">{label}</span>
          </motion.div>
        </>
      )}

      {/* Main layer — holographic gradient */}
      <div
        className="relative text-2xl md:text-3xl whitespace-nowrap"
        style={{
          ...styleBase,
          background:
            'linear-gradient(90deg, #8effa6 0%, #82beff 50%, #ffbe78 100%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          filter: 'drop-shadow(0 0 12px rgba(142,255,166,0.35))',
          transform: glitch ? 'translate(1px, -1px)' : 'none',
          transition: 'transform 60ms linear',
        }}
      >
        {label}
      </div>

      {/* Underline flicker */}
      {!reduce && (
        <motion.div
          aria-hidden
          className="absolute -bottom-1.5 left-0 right-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(142,255,166,0.85) 50%, transparent 100%)',
          }}
          animate={{ opacity: [0.4, 1, 0.4], scaleX: [0.85, 1, 0.85] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// TypingLine — cycles through phases based on progress
// ════════════════════════════════════════════════════════════
function TypingLine({
  progress,
  reduce,
}: {
  progress: number
  reduce: boolean
}) {
  const phases = [
    'initializing runtime',
    'loading workspace',
    'compiling design tokens',
    'connecting claude',
    'hydrating data',
    'priming renderer',
    'ready',
  ]
  const idx = Math.min(Math.floor(progress * phases.length), phases.length - 1)
  const phase = phases[idx]

  // Character-reveal within the current phase based on its sub-progress
  if (reduce) return <span>{phases[phases.length - 2]}</span>
  const within = progress * phases.length - idx
  const shown = Math.floor(within * phase.length) + 1
  return <span>{phase.slice(0, shown)}</span>
}

// ════════════════════════════════════════════════════════════
// BlinkCaret
// ════════════════════════════════════════════════════════════
function BlinkCaret() {
  return (
    <motion.span
      className="inline-block w-[7px] h-[12px] bg-lime ml-0.5"
      animate={{ opacity: [1, 0, 1] }}
      transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
      style={{ filter: 'drop-shadow(0 0 4px #8effa6)' }}
    />
  )
}

// ════════════════════════════════════════════════════════════
// MatrixRain — subtle katakana/hex rain background
// ════════════════════════════════════════════════════════════
function MatrixRain({ reduce }: { reduce: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (reduce) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const fontSize = 14
    const chars =
      '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF<>/_'

    let w = 0
    let h = 0
    let cols = 0
    let drops: number[] = []
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.scale(dpr, dpr)
      cols = Math.floor(w / fontSize)
      drops = Array.from(
        { length: cols },
        () => (Math.random() * -h) / fontSize,
      )
    }
    resize()
    window.addEventListener('resize', resize)

    let raf = 0
    const draw = () => {
      // trail fade
      ctx.fillStyle = 'rgba(6, 6, 17, 0.09)'
      ctx.fillRect(0, 0, w, h)
      ctx.font = `${fontSize}px "JetBrains Mono", ui-monospace, monospace`
      for (let i = 0; i < cols; i++) {
        const y = drops[i] * fontSize
        const ch = chars[Math.floor(Math.random() * chars.length)]
        // Leading char brighter
        const leading = Math.random() > 0.97
        ctx.fillStyle = leading
          ? 'rgba(200, 255, 210, 0.9)'
          : 'rgba(142, 255, 166, 0.28)'
        ctx.fillText(ch, i * fontSize, y)
        if (y > h && Math.random() > 0.965) drops[i] = 0
        drops[i] += 0.75
      }
      raf = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [reduce])

  if (reduce) return null

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="absolute inset-0 pointer-events-none opacity-[0.55]"
      style={{ mixBlendMode: 'screen' }}
    />
  )
}

// ════════════════════════════════════════════════════════════
// StatePill — OK / RUN / ···
// ════════════════════════════════════════════════════════════
function StatePill({
  state,
  reduce,
}: {
  state: 'ok' | 'run' | 'pending'
  reduce: boolean
}) {
  if (state === 'ok') {
    return (
      <span
        className="inline-flex items-center justify-center w-[42px] shrink-0 font-mono text-[9.5px] tracking-wider rounded-sm py-[1px]"
        style={{
          color: '#8effa6',
          backgroundColor: 'rgba(142, 255, 166, 0.12)',
          border: '1px solid rgba(142, 255, 166, 0.5)',
        }}
      >
        OK
      </span>
    )
  }
  if (state === 'run') {
    return (
      <motion.span
        className="inline-flex items-center justify-center w-[42px] shrink-0 font-mono text-[9.5px] tracking-wider rounded-sm py-[1px]"
        style={{
          color: '#82beff',
          backgroundColor: 'rgba(130, 190, 255, 0.14)',
          border: '1px solid rgba(130, 190, 255, 0.55)',
        }}
        animate={reduce ? undefined : { opacity: [1, 0.45, 1] }}
        transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
      >
        RUN
      </motion.span>
    )
  }
  return (
    <span
      className="inline-flex items-center justify-center w-[42px] shrink-0 font-mono text-[9.5px] tracking-wider rounded-sm py-[1px]"
      style={{
        color: 'rgba(255,255,255,0.35)',
        backgroundColor: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      ···
    </span>
  )
}

// ════════════════════════════════════════════════════════════
// HudBrackets — 4 corner brackets
// ════════════════════════════════════════════════════════════
function HudBrackets() {
  const brackets = [
    { className: 'top-4 left-4', d: 'M 2 14 L 2 2 L 14 2' },
    { className: 'top-4 right-4', d: 'M 6 2 L 18 2 L 18 14' },
    { className: 'bottom-4 left-4', d: 'M 2 6 L 2 18 L 14 18' },
    { className: 'bottom-4 right-4', d: 'M 6 18 L 18 18 L 18 6' },
  ]
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none z-[3]">
      {brackets.map((b, i) => (
        <motion.svg
          key={i}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 0.9, scale: 1 }}
          transition={{ delay: 0.15 + i * 0.07, duration: 0.45 }}
          width="22"
          height="22"
          viewBox="0 0 20 20"
          className={`absolute ${b.className}`}
          style={{
            color: '#8effa6',
            filter: 'drop-shadow(0 0 4px rgba(142,255,166,0.7))',
          }}
        >
          <path
            d={b.d}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </motion.svg>
      ))}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// StatChip — corner live-stat
// ════════════════════════════════════════════════════════════
function StatChip({
  pos,
  slot,
  k,
  v,
  dot,
}: {
  pos: 'tl' | 'tr' | 'bl' | 'br'
  slot: number
  k: string
  v: string
  dot: 'lime' | 'accent' | 'amber' | 'electric'
}) {
  const base =
    pos === 'tl'
      ? { top: 16 + slot * 18, left: 44 }
      : pos === 'tr'
      ? { top: 16 + slot * 18, right: 44 }
      : pos === 'bl'
      ? { bottom: 16 + slot * 18, left: 44 }
      : { bottom: 16 + slot * 18, right: 44 }

  const dotClr =
    dot === 'lime'
      ? '#8effa6'
      : dot === 'accent'
      ? '#82beff'
      : dot === 'amber'
      ? '#ffbe78'
      : '#b886ff'

  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0, y: pos.startsWith('t') ? -4 : 4 }}
      animate={{ opacity: 0.92, y: 0 }}
      transition={{ delay: 0.25 + slot * 0.06, duration: 0.4 }}
      className="hidden md:flex absolute z-[4] items-center gap-1.5 font-mono text-[10px] tracking-[0.18em] uppercase"
      style={base}
    >
      <motion.span
        className="inline-block w-1.5 h-1.5 rounded-full"
        style={{
          backgroundColor: dotClr,
          boxShadow: `0 0 6px ${dotClr}`,
        }}
        animate={{ opacity: [1, 0.35, 1] }}
        transition={{
          duration: 1.4 + slot * 0.2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <span style={{ color: 'rgba(255,255,255,0.45)' }}>{k}</span>
      <span style={{ color: 'rgba(255,255,255,0.9)' }} className="tabular-nums">
        {v}
      </span>
    </motion.div>
  )
}
